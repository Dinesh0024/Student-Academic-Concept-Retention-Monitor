const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const express = require('express');
const { generateCode, verifyCode } = require('./totp');

test('password login requires a verified TOTP before issuing a session token', async (t) => {
    const secretKey = 'two-factor-test-secret';
    const account = {
        id: 21,
        name: 'Test Student',
        email: 'student@example.test',
        role: 'student',
        password_hash: await bcrypt.hash('correct-password', 4)
    };
    const records = {};
    const jsonDb = {
        getRecords: (collection) => records[collection] || [],
        upsertRecord: (collection, record) => {
            const rows = records[collection] || (records[collection] = []);
            const index = rows.findIndex((row) => row.id === record.id);
            if (index === -1) rows.push(record);
            else rows[index] = { ...rows[index], ...record };
            return rows[index === -1 ? rows.length - 1 : index];
        },
        deleteRecord: (collection, id) => {
            const rows = records[collection] || [];
            const remaining = rows.filter((row) => row.id !== id);
            records[collection] = remaining;
            return remaining.length !== rows.length;
        }
    };
    const pool = {
        query: async (sql, params) => {
            const table = sql.includes('faculty') ? 'faculty' : 'students';
            const isAccountTable = table === `${account.role === 'faculty' ? 'faculty' : 'students'}`;
            const rows = isAccountTable && params[0] === account.email ? [{ ...account }] : [];
            return { rows };
        }
    };
    const authenticateToken = (req, res, next) => {
        const token = req.headers.authorization?.split(' ')[1];
        try {
            const claims = jwt.verify(token, secretKey);
            if (claims.purpose === 'two-factor') {
                return res.status(401).json({ error: 'Complete two-factor authentication before accessing this resource.' });
            }
            req.user = claims;
            next();
        } catch {
            res.status(401).json({ error: 'Invalid token.' });
        }
    };

    const authPath = require.resolve('./routes/auth');
    const originalLoad = Module._load;
    Module._load = function (request, parent, isMain) {
        if (parent?.filename === authPath) {
            if (request === '../db') return pool;
            if (request === '../json_db') return jsonDb;
            if (request === '../middleware/auth') {
                return {
                    JWT_SECRET: secretKey,
                    authenticateToken,
                    isAuthorizedFacultyEmail: () => true
                };
            }
        }
        return originalLoad.call(this, request, parent, isMain);
    };
    let router;
    try {
        router = require('./routes/auth');
    } finally {
        Module._load = originalLoad;
    }

    const app = express();
    app.use(express.json());
    app.use('/api/auth', router);
    const server = await new Promise((resolve) => {
        const runningServer = app.listen(0, '127.0.0.1', () => resolve(runningServer));
    });
    t.after(() => new Promise((resolve) => server.close(resolve)));

    const baseUrl = `http://127.0.0.1:${server.address().port}/api/auth`;
    const accessToken = jwt.sign({ id: account.id, email: account.email, role: account.role }, secretKey);
    const authorizedHeaders = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' };
    const post = (path, body, headers = authorizedHeaders) => fetch(`${baseUrl}${path}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
    });

    const initialStatus = await fetch(`${baseUrl}/2fa/status`, { headers: authorizedHeaders });
    assert.deepEqual(await initialStatus.json(), { enabled: false });

    const setup = await post('/2fa/setup', { password: 'correct-password' });
    assert.equal(setup.status, 200);
    const { secret } = await setup.json();

    const enabled = await post('/2fa/enable', { code: generateCode(secret) });
    assert.deepEqual(await enabled.json(), { enabled: true });

    const passwordLogin = await post('/login', {
        email: account.email,
        password: 'correct-password',
        role: account.role
    });
    const pending = await passwordLogin.json();
    assert.equal(pending.twoFactorRequired, true);
    assert.equal(pending.token, undefined);
    assert.equal(pending.user, undefined);

    const pendingAccess = await fetch(`${baseUrl}/2fa/status`, {
        headers: { Authorization: `Bearer ${pending.challengeToken}` }
    });
    assert.equal(pendingAccess.status, 401);

    let invalidCode = '000000';
    while (verifyCode(secret, invalidCode)) {
        invalidCode = String((Number(invalidCode) + 1) % 1000000).padStart(6, '0');
    }
    const rejected = await post('/login/2fa', { challengeToken: pending.challengeToken, code: invalidCode });
    assert.equal(rejected.status, 401);

    const verified = await post('/login/2fa', {
        challengeToken: pending.challengeToken,
        code: generateCode(secret)
    });
    const session = await verified.json();
    assert.equal(verified.status, 200);
    assert.equal(session.user.email, account.email);
    assert.equal(jwt.decode(session.token).purpose, undefined);

    const repeatedLogin = await post('/login', {
        email: account.email,
        password: 'correct-password',
        role: account.role
    });
    const repeatedChallenge = await repeatedLogin.json();
    for (let attempt = 0; attempt < 5; attempt += 1) {
        const rejectedCode = await post('/login/2fa', {
            challengeToken: repeatedChallenge.challengeToken,
            code: invalidCode
        });
        assert.equal(rejectedCode.status, 401);
    }
    const lockedChallenge = await post('/login/2fa', {
        challengeToken: repeatedChallenge.challengeToken,
        code: generateCode(secret)
    });
    assert.equal(lockedChallenge.status, 429);

    const newPasswordLogin = await post('/login', {
        email: account.email,
        password: 'correct-password',
        role: account.role
    });
    const newChallenge = await newPasswordLogin.json();
    const accountLockedCode = await post('/login/2fa', {
        challengeToken: newChallenge.challengeToken,
        code: generateCode(secret)
    });
    assert.equal(accountLockedCode.status, 429);

    const disable = await post('/2fa/disable', {
        password: 'correct-password',
        code: generateCode(secret)
    }, { Authorization: `Bearer ${session.token}`, 'Content-Type': 'application/json' });
    assert.deepEqual(await disable.json(), { enabled: false });

    const passwordOnlyLogin = await post('/login', {
        email: account.email,
        password: 'correct-password',
        role: account.role
    });
    assert.ok((await passwordOnlyLogin.json()).token);
});

test('protected API middleware rejects a pending two-factor challenge token', async () => {
    const { authenticateToken, JWT_SECRET } = require('./middleware/auth');
    const challengeToken = jwt.sign({
        purpose: 'two-factor',
        email: 'student@example.test',
        role: 'student'
    }, JWT_SECRET, { expiresIn: '5m' });

    const result = await new Promise((resolve) => {
        const response = {
            statusCode: 200,
            status(statusCode) {
                this.statusCode = statusCode;
                return this;
            },
            json(body) {
                resolve({ status: this.statusCode, body });
            }
        };
        authenticateToken({
            headers: { authorization: `Bearer ${challengeToken}` }
        }, response, () => resolve({ status: 200, next: true }));
    });

    assert.equal(result.status, 401);
    assert.match(result.body.error, /Complete two-factor authentication/);
});
