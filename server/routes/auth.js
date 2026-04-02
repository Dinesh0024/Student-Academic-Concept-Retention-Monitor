const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

const AUTHORIZED_STUDENT = process.env.AUTHORIZED_STUDENT || 'test@example.com';
const AUTHORIZED_FACULTY = process.env.AUTHORIZED_FACULTY || 'smith@college.edu';

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

        // Apply single-user restriction
        if (role === 'student' && email.toLowerCase() !== AUTHORIZED_STUDENT.toLowerCase()) {
            return res.status(403).json({ error: 'Access Denied: Student portal is restricted to a single user.' });
        }
        if (role === 'faculty' && email.toLowerCase() !== AUTHORIZED_FACULTY.toLowerCase()) {
            return res.status(403).json({ error: 'Access Denied: Faculty portal is restricted to a single user.' });
        }

        const table = role === 'faculty' ? 'faculty' : 'students';
        const result = await pool.query(`SELECT * FROM ${table} WHERE email = $1`, [email]);

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = result.rows[0];
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate Token
        const token = jwt.sign(
            { id: user.id, email: user.email, role: role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            user: { id: user.id, name: user.name, email: user.email, role: role },
            token
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
