const express = require('express');
const { randomUUID } = require('crypto');
const { getDatabase } = require('../mongo');
const jsonDb = require('../json_db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const collections = new Set(['students', 'subjects', 'concepts', 'tests', 'results']);

router.use(authenticateToken);

router.param('collection', (req, res, next, collection) => {
    if (!collections.has(collection)) return res.status(404).json({ error: 'Collection not found' });
    req.collectionName = collection;
    next();
});

router.get('/:collection', async (req, res) => {
    try {
        if (req.collectionName === 'students' && req.user.role !== 'faculty') {
            return res.status(403).json({ error: 'Faculty access required' });
        }
        if (!process.env.MONGODB_URI) {
            let records = jsonDb.getRecords(req.collectionName);
            if (req.collectionName === 'students') {
                records = records.map((student) => {
                    const safeStudent = { ...student };
                    delete safeStudent.password_hash;
                    return safeStudent;
                });
            }
            if (req.collectionName === 'results' && req.user.role !== 'faculty') {
                records = records.filter((record) => record.studentEmail === req.user.email);
            } else if (req.collectionName === 'results' && req.query.studentEmail) {
                records = records.filter((record) => record.studentEmail === req.query.studentEmail);
            }
            records.sort((a, b) => {
                for (const key of ['timestamp', 'created_at']) {
                    const difference = new Date(b[key] || 0) - new Date(a[key] || 0);
                    if (difference) return difference;
                }
                return String(a.name || '').localeCompare(String(b.name || ''));
            });
            return res.json(records);
        }
        const database = await getDatabase();
        const filter = {};
        if (req.collectionName === 'results' && req.user.role !== 'faculty') {
            filter.studentEmail = req.user.email;
        } else if (req.collectionName === 'results' && req.query.studentEmail) {
            filter.studentEmail = req.query.studentEmail;
        }

        const records = await database.collection(req.collectionName)
            .find(filter, { projection: { _id: 0, ...(req.collectionName === 'students' ? { password_hash: 0 } : {}) } })
            .sort({ timestamp: -1, created_at: -1, name: 1 })
            .toArray();
        res.json(records);
    } catch (err) {
        console.error(`Error reading ${req.collectionName}:`, err.message);
        res.status(503).json({ error: 'Database unavailable' });
    }
});

router.post('/:collection', async (req, res) => {
    try {
        const facultyOnly = ['students', 'subjects', 'concepts', 'tests'].includes(req.collectionName);
        if (facultyOnly && req.user.role !== 'faculty') {
            return res.status(403).json({ error: 'Faculty access required' });
        }
        if (req.collectionName === 'results' && req.user.role !== 'faculty' && req.body.studentEmail !== req.user.email) {
            return res.status(403).json({ error: 'You can only submit your own result' });
        }

        const record = { ...req.body };
        delete record._id;
        record.id = String(record.id || randomUUID());
        record.created_at = record.created_at || new Date().toISOString();
        if (req.collectionName === 'results') record.timestamp = new Date().toISOString();

        if (!process.env.MONGODB_URI) {
            if (!jsonDb.insertRecord(req.collectionName, record)) {
                return res.status(409).json({ error: 'Record already exists' });
            }
            return res.status(201).json(record);
        }

        const database = await getDatabase();
        await database.collection(req.collectionName).insertOne(record);
        res.status(201).json(record);
    } catch (err) {
        console.error(`Error creating ${req.collectionName}:`, err.message);
        res.status(err.code === 11000 ? 409 : 503).json({ error: err.code === 11000 ? 'Record already exists' : 'Database unavailable' });
    }
});

router.put('/:collection/:id', async (req, res) => {
    try {
        const facultyOnly = req.collectionName !== 'results';
        if (facultyOnly && req.user.role !== 'faculty') {
            return res.status(403).json({ error: 'Faculty access required' });
        }

        const changes = { ...req.body };
        delete changes._id;
        delete changes.id;
        delete changes.created_at;
        if (req.collectionName === 'results' && req.user.role !== 'faculty') {
            const allowed = Object.keys(changes).every((key) => ['isFeedbackRead', 'studentFeedback'].includes(key));
            if (!allowed) return res.status(403).json({ error: 'Faculty access required' });
            if ('studentFeedback' in changes) {
                if (typeof changes.studentFeedback !== 'string') {
                    return res.status(400).json({ error: 'Feedback must be text.' });
                }
                changes.studentFeedback = changes.studentFeedback.trim();
                const wordCount = changes.studentFeedback.split(/\s+/).filter(Boolean).length;
                if (wordCount < 4 || changes.studentFeedback.length > 2000) {
                    return res.status(400).json({ error: 'Feedback must contain at least four words and no more than 2000 characters.' });
                }
            }
            changes.studentEmail = req.user.email;
        }

        if (!process.env.MONGODB_URI) {
            const existing = jsonDb.getRecords(req.collectionName)
                .find((record) => String(record.id) === String(req.params.id)
                    && (req.collectionName !== 'results' || req.user.role === 'faculty' || record.studentEmail === req.user.email));
            if (!existing && !facultyOnly) return res.status(404).json({ error: 'Record not found' });
            const record = jsonDb.upsertRecord(req.collectionName, {
                ...changes,
                id: req.params.id,
                created_at: existing?.created_at || new Date().toISOString()
            });
            return res.json(record);
        }

        const database = await getDatabase();
        const filter = { id: req.params.id };
        if (req.collectionName === 'results' && req.user.role !== 'faculty') filter.studentEmail = req.user.email;
        const update = { $set: changes };
        if (req.collectionName !== 'results') {
            update.$setOnInsert = {
                id: req.params.id,
                created_at: new Date().toISOString()
            };
        }
        const result = await database.collection(req.collectionName).findOneAndUpdate(
            filter,
            update,
            { upsert: facultyOnly, returnDocument: 'after', includeResultMetadata: false }
        );
        if (!result) return res.status(404).json({ error: 'Record not found' });
        res.json(result);
    } catch (err) {
        console.error(`Error updating ${req.collectionName}:`, err.message);
        res.status(503).json({ error: 'Database unavailable' });
    }
});

router.delete('/:collection/:id', async (req, res) => {
    if (req.user.role !== 'faculty') return res.status(403).json({ error: 'Faculty access required' });
    if (!process.env.MONGODB_URI) {
        if (!jsonDb.deleteRecord(req.collectionName, req.params.id)) {
            return res.status(404).json({ error: 'Record not found' });
        }
        return res.json({ success: true });
    }
    try {
        const database = await getDatabase();
        const result = await database.collection(req.collectionName).deleteOne({ id: req.params.id });
        if (!result.deletedCount) return res.status(404).json({ error: 'Record not found' });
        res.json({ success: true });
    } catch (err) {
        console.error(`Error deleting ${req.collectionName}:`, err.message);
        res.status(503).json({ error: 'Database unavailable' });
    }
});

module.exports = router;