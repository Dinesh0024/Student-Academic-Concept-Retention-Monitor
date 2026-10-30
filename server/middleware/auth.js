const jwt = require('jsonwebtoken');
const { getAuth } = require('firebase-admin/auth');
const { initializeApp, getApps } = require('firebase-admin/app');
const jsonDb = require('../json_db');

const JWT_SECRET = process.env.JWT_SECRET || 'studentretain_secret_key_2026';
const AUTHORIZED_FACULTY = (process.env.AUTHORIZED_FACULTY || 'smith@college.edu').trim().toLowerCase();
const firebaseApp = getApps().find((app) => app.name === 'data-api') || initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID || 'academic-cac6d'
}, 'data-api');

function isAuthorizedFacultyEmail(email) {
    const normalizedEmail = email?.trim().toLowerCase();
    if (!normalizedEmail) return false;
    return normalizedEmail === AUTHORIZED_FACULTY
        || jsonDb.getRecords('faculty').some((faculty) => faculty.email?.trim().toLowerCase() === normalizedEmail);
}

function resolveFirebaseRole(firebaseUser) {
    const email = firebaseUser.email?.trim().toLowerCase();
    if (firebaseUser.role === 'faculty' || isAuthorizedFacultyEmail(email)) return 'faculty';
    return 'student';
}

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (!err) {
            if (user.purpose === 'two-factor') {
                return res.status(401).json({ error: 'Complete two-factor authentication before accessing this resource.' });
            }
            req.user = user;
            return next();
        }

        getAuth(firebaseApp).verifyIdToken(token).then((firebaseUser) => {
            req.user = {
                id: firebaseUser.uid,
                email: firebaseUser.email,
                role: resolveFirebaseRole(firebaseUser)
            };
            next();
        }).catch(() => {
            res.status(403).json({ error: 'Invalid or expired token.' });
        });
    });
}

module.exports = { authenticateToken, JWT_SECRET, isAuthorizedFacultyEmail, resolveFirebaseRole };
