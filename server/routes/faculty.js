const express = require('express');
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Middleware to check if user is faculty
const isFaculty = (req, res, next) => {
    if (req.user.role !== 'faculty') {
        return res.status(403).json({ error: 'Access denied. Faculty only.' });
    }
    next();
};

// GET /api/faculty/students - List all students with filters
router.get('/students', authenticateToken, isFaculty, async (req, res) => {
    try {
        const { department, semester, search } = req.query;
        let query = 'SELECT id, name, email, enrollment_no, department, semester, created_at FROM students WHERE 1=1';
        const params = [];

        if (department) {
            params.push(department);
            query += ` AND department = $${params.length}`;
        }
        if (semester) {
            params.push(semester);
            query += ` AND semester = $${params.length}`;
        }
        if (search) {
            params.push(`%${search}%`);
            query += ` AND (name ILIKE $${params.length} OR enrollment_no ILIKE $${params.length})`;
        }

        query += ' ORDER BY name ASC';
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching students:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// DELETE /api/faculty/students/:id - Delete a student
router.delete('/students/:id', authenticateToken, isFaculty, async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM students WHERE id = $1 RETURNING *', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Student not found' });
        }
        res.json({ message: 'Student deleted successfully' });
    } catch (err) {
        console.error('Error deleting student:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/faculty/stats - Dashboard statistics
router.get('/stats', authenticateToken, isFaculty, async (req, res) => {
    try {
        const studentCount = await pool.query('SELECT COUNT(*) FROM students');
        const testCount = await pool.query('SELECT COUNT(*) FROM tests');
        const conceptCount = await pool.query('SELECT COUNT(*) FROM concepts');

        res.json({
            totalStudents: parseInt(studentCount.rows[0].count),
            totalTests: parseInt(testCount.rows[0].count),
            totalConcepts: parseInt(conceptCount.rows[0].count)
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
