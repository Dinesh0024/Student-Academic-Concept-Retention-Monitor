const express = require('express');
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/concepts
router.get('/', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(`
      SELECT c.*, s.name as subject_name 
      FROM concepts c 
      LEFT JOIN subjects s ON c.subject_id = s.id 
      ORDER BY c.name
    `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/concepts
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { subject_id, name, description } = req.body;
        if (!name) return res.status(400).json({ error: 'Concept name required' });

        const result = await pool.query(
            'INSERT INTO concepts (subject_id, name, description) VALUES ($1, $2, $3) RETURNING *',
            [subject_id, name, description]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/concepts/:id/test — Record test result and calculate retention
router.post('/:id/test', authenticateToken, async (req, res) => {
    try {
        const { student_id, correct_answers, total_questions } = req.body;
        if (!student_id || !correct_answers || !total_questions) {
            return res.status(400).json({ error: 'All test fields required' });
        }

        // Record performance
        await pool.query(
            'INSERT INTO student_concept_performance (student_id, concept_id, correct_answers, total_questions) VALUES ($1, $2, $3, $4)',
            [student_id, req.params.id, correct_answers, total_questions]
        );

        // Calculate retention score
        const score = Math.round((correct_answers / total_questions) * 100);
        let level = 'Needs Improvement';
        if (score >= 90) level = 'Excellent';
        else if (score >= 70) level = 'Good';
        else if (score >= 50) level = 'Moderate';

        // Get subject_id from concept
        const concept = await pool.query('SELECT subject_id FROM concepts WHERE id = $1', [req.params.id]);
        const subjectId = concept.rows[0]?.subject_id;

        // Upsert retention score
        await pool.query(`
      INSERT INTO retention_scores (student_id, subject_id, score, level)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (student_id, subject_id) 
      DO UPDATE SET score = $3, level = $4, calculated_at = NOW()
    `, [student_id, subjectId, score, level]);

        res.json({ score, level });
    } catch (err) {
        console.error('Error recording test:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// DELETE /api/concepts/:id
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        await pool.query('DELETE FROM concepts WHERE id = $1', [req.params.id]);
        res.json({ message: 'Concept deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
