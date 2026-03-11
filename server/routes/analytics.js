const express = require('express');
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/analytics/overview
router.get('/overview', authenticateToken, async (req, res) => {
    try {
        const studentsCount = await pool.query('SELECT COUNT(*) FROM students');
        const avgRetention = await pool.query('SELECT COALESCE(AVG(score), 0) as avg FROM retention_scores');
        const weakConcepts = await pool.query('SELECT COUNT(*) FROM retention_scores WHERE score < 50');
        const topStudents = await pool.query('SELECT COUNT(DISTINCT student_id) FROM retention_scores WHERE score >= 90');

        res.json({
            totalStudents: parseInt(studentsCount.rows[0].count),
            avgRetention: Math.round(parseFloat(avgRetention.rows[0].avg)),
            weakConcepts: parseInt(weakConcepts.rows[0].count),
            topStudents: parseInt(topStudents.rows[0].count),
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/analytics/retention-trend
router.get('/retention-trend', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(`
      SELECT DATE_TRUNC('month', calculated_at) as month, AVG(score) as avg_score
      FROM retention_scores
      GROUP BY month
      ORDER BY month
      LIMIT 12
    `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/analytics/subject-performance
router.get('/subject-performance', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(`
      SELECT s.name, COALESCE(AVG(rs.score), 0) as avg_score
      FROM subjects s
      LEFT JOIN retention_scores rs ON s.id = rs.subject_id
      GROUP BY s.id, s.name
      ORDER BY avg_score DESC
    `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/analytics/at-risk
router.get('/at-risk', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(`
      SELECT st.*, AVG(rs.score) as avg_score
      FROM students st
      JOIN retention_scores rs ON st.id = rs.student_id
      GROUP BY st.id
      HAVING AVG(rs.score) < 50
      ORDER BY avg_score ASC
    `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
