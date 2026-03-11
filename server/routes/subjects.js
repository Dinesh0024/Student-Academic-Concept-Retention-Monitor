const express = require('express');
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/subjects
router.get('/', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM subjects ORDER BY name');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/subjects
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { name, code, department, semester } = req.body;
        if (!name || !code) return res.status(400).json({ error: 'Name and code required' });

        const result = await pool.query(
            'INSERT INTO subjects (name, code, department, semester) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, code, department, semester]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// PUT /api/subjects/:id
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { name, code, department, semester } = req.body;
        const result = await pool.query(
            'UPDATE subjects SET name = $1, code = $2, department = $3, semester = $4 WHERE id = $5 RETURNING *',
            [name, code, department, semester, req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Subject not found' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// DELETE /api/subjects/:id
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        await pool.query('DELETE FROM subjects WHERE id = $1', [req.params.id]);
        res.json({ message: 'Subject deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
