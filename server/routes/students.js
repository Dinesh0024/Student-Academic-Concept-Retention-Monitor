const express = require('express');
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/students
router.get('/', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM students ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching students:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/students/:id
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM students WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Student not found' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/students
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { name, email, enrollment_no, department, semester } = req.body;
        if (!name || !email) return res.status(400).json({ error: 'Name and email are required' });

        const result = await pool.query(
            'INSERT INTO students (name, email, enrollment_no, department, semester) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [name, email, enrollment_no, department, semester]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating student:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// PUT /api/students/:id
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { name, email, enrollment_no, department, semester } = req.body;
        const result = await pool.query(
            'UPDATE students SET name = $1, email = $2, enrollment_no = $3, department = $4, semester = $5 WHERE id = $6 RETURNING *',
            [name, email, enrollment_no, department, semester, req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Student not found' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// DELETE /api/students/:id
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM students WHERE id = $1 RETURNING *', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Student not found' });
        res.json({ message: 'Student deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
