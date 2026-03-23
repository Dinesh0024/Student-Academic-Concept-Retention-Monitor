const express = require('express');
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/results - Get all test results with student and test info
router.get('/', authenticateToken, async (req, res) => {
    try {
        const query = `
            SELECT 
                ta.id,
                ta.score,
                ta.teacher_feedback as "teacherFeedback",
                ta.ai_drawbacks as "aiDrawbacks",
                ta.ai_solutions as "aiSolutions",
                ta.completed_at as timestamp,
                s.name as "studentName",
                s.email as "studentEmail",
                t.name as "testName"
            FROM test_attempts ta
            JOIN students s ON ta.student_id = s.id
            JOIN tests t ON ta.test_id = t.id
            WHERE ta.completed_at IS NOT NULL
            ORDER BY ta.completed_at DESC
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching results:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// PATCH /api/results/:id/feedback - Update teacher feedback
router.patch('/:id/feedback', authenticateToken, async (req, res) => {
    try {
        const { feedback } = req.body;
        const result = await pool.query(
            'UPDATE test_attempts SET teacher_feedback = $1 WHERE id = $2 RETURNING *',
            [feedback, req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Result not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating feedback:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
