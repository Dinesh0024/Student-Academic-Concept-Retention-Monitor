const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../db');
const jsonDb = require('../json_db');
const { JWT_SECRET, authenticateToken, isAuthorizedFacultyEmail } = require('../middleware/auth');
const { generateSecret, matchCode, verifyCode } = require('../totp');
const {
    generateRegistrationOptions,
    verifyRegistrationResponse,
    generateAuthenticationOptions,
    verifyAuthenticationResponse
} = require('@simplewebauthn/server');

const router = express.Router();

const AUTHORIZED_FACULTY = process.env.AUTHORIZED_FACULTY || 'smith@college.edu';
const RP_ID = process.env.WEBAUTHN_RP_ID || 'localhost';
const ORIGIN = process.env.WEBAUTHN_ORIGIN || 'http://localhost:5000';
const passkeyChallenges = new Map();
const MFA_ISSUER = 'Academic Portal';
const MFA_ENCRYPTION_KEY = crypto.createHash('sha256')
    .update(process.env.MFA_ENCRYPTION_KEY || JWT_SECRET)
    .digest();

function encryptSecret(secret) {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', MFA_ENCRYPTION_KEY, iv);
    const encrypted = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
    return `${iv.toString('base64url')}.${cipher.getAuthTag().toString('base64url')}.${encrypted.toString('base64url')}`;
}

function decryptSecret(value) {
    const [iv, authTag, encrypted] = value.split('.').map((part) => Buffer.from(part, 'base64url'));
    const decipher = crypto.createDecipheriv('aes-256-gcm', MFA_ENCRYPTION_KEY, iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}

const normalizeEmail = (email) => email?.trim().toLowerCase();
const getFactor = (email) => jsonDb.getRecords('two_factor_auth')
    .find((record) => record.email === normalizeEmail(email));
const saveFactor = (email, updates) => jsonDb.upsertRecord('two_factor_auth', {
    ...(getFactor(email) || {}),
    id: normalizeEmail(email),
    email: normalizeEmail(email),
    ...updates
});
const getLoginChallenge = (id) => jsonDb.getRecords('two_factor_challenges')
    .find((challenge) => challenge.id === id);

function issueSessionToken(user, role) {
    return jwt.sign(
        { id: user.id, email: user.email, role },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
}

async function validateAccountPassword(email, role, password) {
    if (!password || !['student', 'faculty'].includes(role)) return false;
    const table = role === 'faculty' ? 'faculty' : 'students';
    const result = await pool.query(`SELECT password_hash FROM ${table} WHERE email = $1`, [normalizeEmail(email)]);
    return result.rows.length > 0
        && result.rows[0].password_hash
        && bcrypt.compare(password, result.rows[0].password_hash);
}

function getAuthenticatedAccount(req) {
    const email = normalizeEmail(req.user?.email);
    const role = req.user?.role;
    if (!email || !['student', 'faculty'].includes(role)) return null;
    return { email, role };
}

router.get('/2fa/status', authenticateToken, (req, res) => {
    const account = getAuthenticatedAccount(req);
    if (!account) return res.status(403).json({ error: 'Two-factor authentication is unavailable for this account.' });
    const factor = getFactor(account.email);
    res.json({ enabled: Boolean(factor?.enabled) });
});

router.post('/2fa/setup', authenticateToken, async (req, res) => {
    try {
        const account = getAuthenticatedAccount(req);
        if (!account) return res.status(403).json({ error: 'Two-factor authentication is unavailable for this account.' });
        if (!await validateAccountPassword(account.email, account.role, req.body.password)) {
            return res.status(401).json({ error: 'The current account password is incorrect.' });
        }

        const existing = getFactor(account.email);
        if (existing?.enabled) return res.status(409).json({ error: 'Two-factor authentication is already enabled.' });

        const secret = generateSecret();
        const accountLabel = `${MFA_ISSUER}:${account.email}`;
        const otpauthUrl = `otpauth://totp/${encodeURIComponent(accountLabel)}?secret=${secret}&issuer=${encodeURIComponent(MFA_ISSUER)}&algorithm=SHA1&digits=6&period=30`;
        saveFactor(account.email, {
            enabled: false,
            pending_secret: encryptSecret(secret),
            secret: null,
            updated_at: new Date().toISOString()
        });

        res.json({ secret, otpauthUrl });
    } catch (err) {
        console.error('Two-factor setup error:', err);
        res.status(500).json({ error: 'Could not start two-factor setup.' });
    }
});

router.post('/2fa/enable', authenticateToken, (req, res) => {
    try {
        const account = getAuthenticatedAccount(req);
        if (!account) return res.status(403).json({ error: 'Two-factor authentication is unavailable for this account.' });
        const factor = getFactor(account.email);
        if (!factor?.pending_secret) return res.status(400).json({ error: 'Start two-factor setup before confirming a code.' });
        if (!verifyCode(decryptSecret(factor.pending_secret), req.body.code)) {
            return res.status(400).json({ error: 'The authenticator code is invalid or expired.' });
        }

        saveFactor(account.email, {
            enabled: true,
            secret: factor.pending_secret,
            pending_secret: null,
            failed_attempts: 0,
            locked_until: null,
            last_counter: null,
            updated_at: new Date().toISOString()
        });
        res.json({ enabled: true });
    } catch (err) {
        console.error('Two-factor enable error:', err);
        res.status(500).json({ error: 'Could not enable two-factor authentication.' });
    }
});

router.post('/2fa/disable', authenticateToken, async (req, res) => {
    try {
        const account = getAuthenticatedAccount(req);
        if (!account) return res.status(403).json({ error: 'Two-factor authentication is unavailable for this account.' });
        const factor = getFactor(account.email);
        if (!factor?.enabled || !factor.secret) return res.status(400).json({ error: 'Two-factor authentication is not enabled.' });
        if (!await validateAccountPassword(account.email, account.role, req.body.password)) {
            return res.status(401).json({ error: 'The current account password is incorrect.' });
        }
        if (!verifyCode(decryptSecret(factor.secret), req.body.code)) {
            return res.status(400).json({ error: 'The authenticator code is invalid or expired.' });
        }

        saveFactor(account.email, {
            enabled: false,
            secret: null,
            pending_secret: null,
            updated_at: new Date().toISOString()
        });
        res.json({ enabled: false });
    } catch (err) {
        console.error('Two-factor disable error:', err);
        res.status(500).json({ error: 'Could not disable two-factor authentication.' });
    }
});

const encodeCredentialId = (value) => typeof value === 'string' ? value : Buffer.from(value).toString('base64url');
const decodeCredentialId = (value) => Buffer.from(value, 'base64url');

// Begin faculty passkey enrollment after the password has been verified.
router.post('/passkey/register/options', async (req, res) => {
    try {
        const { email } = req.body;
        if (!isAuthorizedFacultyEmail(email)) {
            return res.status(403).json({ error: 'Only the authorized faculty account can enroll a passkey.' });
        }

        const existing = await pool.query('SELECT credential_id FROM faculty_passkeys WHERE email = $1', [email]);
        const options = await generateRegistrationOptions({
            rpName: 'Academic Portal',
            rpID: RP_ID,
            userName: email,
            userDisplayName: 'Faculty member',
            userID: Buffer.from(email),
            attestationType: 'none',
            excludeCredentials: existing.rows.map((credential) => ({ id: decodeCredentialId(credential.credential_id) }))
        });

        passkeyChallenges.set(`register:${email.toLowerCase()}`, options.challenge);
        res.json(options);
    } catch (err) {
        console.error('Passkey registration options error:', err);
        res.status(500).json({ error: 'Could not start biometric enrollment.' });
    }
});

router.post('/passkey/register/verify', async (req, res) => {
    try {
        const { email, response } = req.body;
        const expectedChallenge = passkeyChallenges.get(`register:${email?.toLowerCase()}`);
        if (!expectedChallenge || !response) return res.status(400).json({ error: 'Passkey enrollment expired.' });

        const verification = await verifyRegistrationResponse({
            response,
            expectedChallenge,
            expectedOrigin: ORIGIN,
            expectedRPID: RP_ID
        });
        passkeyChallenges.delete(`register:${email.toLowerCase()}`);
        if (!verification.verified) return res.status(400).json({ error: 'Biometric enrollment was not verified.' });

        const { credential } = verification.registrationInfo;
        await pool.query(
            'INSERT INTO faculty_passkeys (email, credential_id, public_key, counter) VALUES ($1, $2, $3, $4)',
            [email, encodeCredentialId(credential.id), Buffer.from(credential.publicKey).toString('base64url'), credential.counter]
        );
        res.json({ success: true });
    } catch (err) {
        console.error('Passkey registration verification error:', err);
        res.status(400).json({ error: 'Biometric enrollment failed.' });
    }
});

router.post('/passkey/login/options', async (req, res) => {
    try {
        const { email } = req.body;
        const credentials = await pool.query('SELECT credential_id FROM faculty_passkeys WHERE email = $1', [email]);
        if (!credentials.rows.length) return res.status(404).json({ error: 'No biometric login is enrolled for this faculty account.' });

        const options = await generateAuthenticationOptions({
            rpID: RP_ID,
            allowCredentials: credentials.rows.map((credential) => ({ id: decodeCredentialId(credential.credential_id) })),
            userVerification: 'required'
        });
        passkeyChallenges.set(`login:${email.toLowerCase()}`, options.challenge);
        res.json(options);
    } catch (err) {
        console.error('Passkey login options error:', err);
        res.status(500).json({ error: 'Could not start biometric login.' });
    }
});

router.post('/passkey/login/verify', async (req, res) => {
    try {
        const { email, response } = req.body;
        const expectedChallenge = passkeyChallenges.get(`login:${email?.toLowerCase()}`);
        const stored = await pool.query('SELECT * FROM faculty_passkeys WHERE credential_id = $1', [response?.id]);
        if (!expectedChallenge || !stored.rows.length) return res.status(401).json({ error: 'Biometric login could not be verified.' });

        const credential = stored.rows[0];
        const verification = await verifyAuthenticationResponse({
            response,
            expectedChallenge,
            expectedOrigin: ORIGIN,
            expectedRPID: RP_ID,
            credential: {
                id: decodeCredentialId(credential.credential_id),
                publicKey: Buffer.from(credential.public_key, 'base64url'),
                counter: credential.counter
            }
        });
        passkeyChallenges.delete(`login:${email.toLowerCase()}`);
        if (!verification.verified) return res.status(401).json({ error: 'Biometric login could not be verified.' });

        await pool.query('UPDATE faculty_passkeys SET counter = $1 WHERE credential_id = $2', [verification.authenticationInfo.newCounter, response.id]);
        const user = { email: credential.email, name: 'Faculty Member', role: 'faculty' };
        const token = jwt.sign({ id: credential.email, ...user }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ user, token });
    } catch (err) {
        console.error('Passkey login verification error:', err);
        res.status(401).json({ error: 'Biometric login failed.' });
    }
});

// POST /api/auth/signup (Student Registration)
router.post('/signup/student', async (req, res) => {
    return res.status(403).json({ error: 'Access Denied: Registration is currently disabled. Only pre-authorized accounts can access the portal.' });
    /* Existing logic below (commented out)
    try {
        const { name, email, enrollment_no, department, semester, password } = req.body;

        if (!name || !email || !password || !enrollment_no) {
            return res.status(400).json({ error: 'Required fields are missing' });
        }

        const existing = await pool.query('SELECT id FROM students WHERE email = $1 OR enrollment_no = $2', [email, enrollment_no]);
        if (existing.rows.length > 0) {
            return res.status(409).json({ error: 'Email or Enrollment Number already registered' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const result = await pool.query(
            'INSERT INTO students (name, email, enrollment_no, department, semester, password_hash) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, email',
            [name, email, enrollment_no, department, semester, passwordHash]
        );

        // Note: I'll need to add a default role to the students table or handle it in the token
        const user = { ...result.rows[0], role: 'student' };
        const token = jwt.sign({ id: user.id, email: user.email, role: 'student' }, JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({ user, token });
    } catch (err) {
        console.error('Student signup error:', err);
        res.status(500).json({ error: 'Server error' });
    }
    */
});

// POST /api/auth/signup/faculty
router.post('/signup/faculty', async (req, res) => {
    return res.status(403).json({ error: 'Access Denied: Registration is currently disabled. Only pre-authorized accounts can access the portal.' });
    /* Existing logic below (commented out)
    try {
        const { name, email, designation, password } = req.body;

        if (!name || !email || !password || !designation) {
            return res.status(400).json({ error: 'Required fields are missing' });
        }

        const existing = await pool.query('SELECT id FROM faculty WHERE email = $1', [email]);
        if (existing.rows.length > 0) {
            return res.status(409).json({ error: 'Email already registered' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const result = await pool.query(
            'INSERT INTO faculty (name, email, designation, password_hash) VALUES ($1, $2, $3, $4) RETURNING id, name, email',
            [name, email, designation, passwordHash]
        );

        const user = { ...result.rows[0], role: 'faculty' };
        const token = jwt.sign({ id: user.id, email: user.email, role: 'faculty' }, JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({ user, token });
    } catch (err) {
        console.error('Faculty signup error:', err);
        res.status(500).json({ error: 'Server error' });
    }
    */
});

router.post('/students', authenticateToken, async (req, res) => {
    if (req.user.role !== 'faculty') {
        return res.status(403).json({ error: 'Faculty access required to create student accounts.' });
    }

    try {
        const { name, email, enrollment_no, department, semester, password } = req.body;
        const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
        const enrollmentNumber = typeof enrollment_no === 'string' ? enrollment_no.trim() : '';
        const semesterNumber = Number(semester);

        if (
            typeof name !== 'string' || !name.trim()
            || !normalizedEmail || !enrollmentNumber
            || typeof department !== 'string' || !department.trim()
            || !Number.isInteger(semesterNumber) || semesterNumber < 1
            || typeof password !== 'string' || !password
        ) {
            return res.status(400).json({ error: 'Name, email, enrollment number, department, semester, and password are required.' });
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
            return res.status(400).json({ error: 'Enter a valid student email address.' });
        }
        if (password.length < 8) {
            return res.status(400).json({ error: 'Student passwords must be at least 8 characters long.' });
        }

        const existing = await pool.query(
            'SELECT id FROM students WHERE email = $1 OR enrollment_no = $2',
            [normalizedEmail, enrollmentNumber]
        );
        if (existing.rows.length) {
            return res.status(409).json({ error: 'A student with this email or enrollment number already exists.' });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const result = await pool.query(
            'INSERT INTO students (name, email, enrollment_no, department, semester, password_hash) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, email, enrollment_no, department, semester',
            [name.trim(), normalizedEmail, enrollmentNumber, department.trim(), String(semesterNumber), passwordHash]
        );
        const createdStudent = result.rows[0];
        res.status(201).json({
            id: createdStudent.id,
            name: createdStudent.name,
            email: createdStudent.email,
            enrollment_no: createdStudent.enrollment_no,
            department: createdStudent.department,
            semester: createdStudent.semester
        });
    } catch (err) {
        console.error('Faculty-created student account error:', err);
        res.status(500).json({ error: 'Could not create the student account.' });
    }
});

// GET /api/auth/profile/:email
router.get('/profile/:email', async (req, res) => {
    try {
        const { email } = req.params;
        const requestedRole = req.query.role; // e.g., 'student' or 'faculty'

        try {
            // Priority check: If a role is requested, check that table first
            if (requestedRole === 'faculty') {
                let facultyRes = await pool.query('SELECT name, email, designation FROM faculty WHERE email = $1', [email]);
                if (facultyRes.rows.length > 0) return res.json({ ...facultyRes.rows[0], role: 'faculty' });
            } else if (requestedRole === 'student') {
                let studentRes = await pool.query('SELECT name, email FROM students WHERE email = $1', [email]);
                if (studentRes.rows.length > 0) return res.json({ ...studentRes.rows[0], role: 'student' });
            }

            // Fallback: Original sequential check if no role requested or not found in requested table
            // Check students table
            let result = await pool.query('SELECT name, email FROM students WHERE email = $1', [email]);
            if (result.rows.length > 0) {
                return res.json({ ...result.rows[0], role: 'student' });
            }

            // Check faculty table
            result = await pool.query('SELECT name, email, designation FROM faculty WHERE email = $1', [email]);
            if (result.rows.length > 0) {
                return res.json({ ...result.rows[0], role: 'faculty' });
            }
        } catch (dbErr) {
            console.error('Database connection error in profile fetch:', dbErr.message);
            // Fallback for development if DB is down
            // If the frontend passed a requestedRole, trust it during fallback.
            // Otherwise try to guess based on the email.
            let fallbackRole = 'student';
            if (requestedRole === 'faculty' || requestedRole === 'student') {
                fallbackRole = requestedRole;
            } else if (email.toLowerCase().includes('faculty') || email.toLowerCase().includes('admin')) {
                fallbackRole = 'faculty';
            }

            return res.json({
                name: email.split('@')[0],
                email: email,
                role: fallbackRole,
                is_fallback: true
            });
        }

        res.status(404).json({ error: 'Profile not found' });
    } catch (err) {
        console.error('Profile fetch error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password, role } = req.body; // role: 'student' or 'faculty'

        if (!email || !password || !role) {
            return res.status(400).json({ error: 'Email, password, and role are required' });
        }
        if (!['student', 'faculty'].includes(role)) {
            return res.status(400).json({ error: 'Role must be student or faculty.' });
        }

        if (role === 'faculty' && !isAuthorizedFacultyEmail(email)) {
            return res.status(403).json({ error: 'Access Denied: Faculty portal is restricted to a single user.' });
        }

        const table = role === 'faculty' ? 'faculty' : 'students';
        const result = await pool.query(`SELECT * FROM ${table} WHERE email = $1`, [email.trim().toLowerCase()]);

        if (result.rows.length === 0) {
            if (role === 'student') {
                return res.status(403).json({ error: 'Student account not found. Ask a faculty member to create your account.' });
            }
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = result.rows[0];
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const factor = getFactor(user.email);
        if (factor?.enabled && factor.secret) {
            const challengeId = crypto.randomUUID();
            jsonDb.upsertRecord('two_factor_challenges', {
                id: challengeId,
                email: normalizeEmail(user.email),
                role,
                user_id: user.id,
                attempts: 0,
                expires_at: Date.now() + 5 * 60 * 1000
            });
            const challengeToken = jwt.sign(
                { purpose: 'two-factor', jti: challengeId, email: normalizeEmail(user.email), role },
                JWT_SECRET,
                { expiresIn: '5m' }
            );
            return res.json({ twoFactorRequired: true, challengeToken });
        }

        const token = issueSessionToken(user, role);
        res.json({
            user: { id: user.id, name: user.name, email: user.email, role: role },
            token
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/login/2fa', async (req, res) => {
    try {
        const { challengeToken, code } = req.body;
        if (!challengeToken || typeof code !== 'string') {
            return res.status(400).json({ error: 'An authentication challenge and code are required.' });
        }

        let challengeClaims;
        try {
            challengeClaims = jwt.verify(challengeToken, JWT_SECRET);
        } catch {
            return res.status(401).json({ error: 'The two-factor login challenge has expired. Sign in again.' });
        }
        if (challengeClaims.purpose !== 'two-factor' || !challengeClaims.jti
            || !['student', 'faculty'].includes(challengeClaims.role)) {
            return res.status(401).json({ error: 'The two-factor login challenge is invalid.' });
        }

        const challenge = getLoginChallenge(challengeClaims.jti);
        if (!challenge || challenge.expires_at <= Date.now()) {
            if (challenge) jsonDb.deleteRecord('two_factor_challenges', challenge.id);
            return res.status(401).json({ error: 'The two-factor login challenge has expired. Sign in again.' });
        }
        if (challenge.attempts >= 5) {
            return res.status(429).json({ error: 'Too many incorrect codes. Sign in again to retry.' });
        }

        const factor = getFactor(challenge.email);
        if (!factor?.enabled || !factor.secret) {
            jsonDb.deleteRecord('two_factor_challenges', challenge.id);
            return res.status(401).json({ error: 'Two-factor authentication is no longer enabled. Sign in again.' });
        }
        if (factor.locked_until > Date.now()) {
            return res.status(429).json({ error: 'Too many incorrect codes. Try again later.' });
        }

        const matchedCounter = matchCode(decryptSecret(factor.secret), code);
        const isReplay = matchedCounter !== null
            && factor.last_counter !== undefined
            && matchedCounter <= factor.last_counter;
        if (matchedCounter === null || isReplay) {
            const previousFailures = factor.locked_until && factor.locked_until <= Date.now()
                ? 0
                : (factor.failed_attempts || 0);
            const failedAttempts = previousFailures + 1;
            jsonDb.upsertRecord('two_factor_challenges', {
                ...challenge,
                attempts: challenge.attempts + 1
            });
            saveFactor(challenge.email, {
                failed_attempts: failedAttempts,
                locked_until: failedAttempts >= 5 ? Date.now() + 5 * 60 * 1000 : null
            });
            return res.status(401).json({ error: 'The authenticator code is invalid or expired.' });
        }

        saveFactor(challenge.email, {
            failed_attempts: 0,
            locked_until: null,
            last_counter: matchedCounter
        });
        jsonDb.deleteRecord('two_factor_challenges', challenge.id);
        const table = challenge.role === 'faculty' ? 'faculty' : 'students';
        const result = await pool.query(`SELECT id, name, email FROM ${table} WHERE email = $1`, [challenge.email]);
        if (!result.rows.length) return res.status(401).json({ error: 'The account is no longer available.' });

        const user = result.rows[0];
        res.json({
            user: { id: user.id, name: user.name, email: user.email, role: challenge.role },
            token: issueSessionToken(user, challenge.role)
        });
    } catch (err) {
        console.error('Two-factor login verification error:', err);
        res.status(500).json({ error: 'Could not verify the two-factor login code.' });
    }
});

// Update Password Endpoint
router.put('/update-password', async (req, res) => {
    try {
        const { email, currentPassword, newPassword, role } = req.body;
        if (!email || !newPassword) {
            return res.status(400).json({ error: 'Email and new password are required' });
        }

        const table = role === 'faculty' ? 'faculty' : 'students';
        const result = await pool.query(`SELECT * FROM ${table} WHERE email = $1`, [email]);

        if (result.rows.length > 0) {
            const user = result.rows[0];
            if (currentPassword && user.password_hash) {
                const valid = await bcrypt.compare(currentPassword, user.password_hash);
                if (!valid) {
                    return res.status(401).json({ error: 'Current password is incorrect' });
                }
            }

            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(newPassword, salt);
            await pool.query(`UPDATE ${table} SET password_hash = $1 WHERE email = $2`, [passwordHash, email]);
        }

        res.json({ success: true, message: 'Password updated successfully' });
    } catch (err) {
        console.error('Update password error:', err);
        res.status(500).json({ error: 'Failed to update database record' });
    }
});

module.exports = router;
