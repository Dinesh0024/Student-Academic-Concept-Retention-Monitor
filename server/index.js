require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/students');
const subjectRoutes = require('./routes/subjects');
const conceptRoutes = require('./routes/concepts');
const analyticsRoutes = require('./routes/analytics');
const facultyRoutes = require('./routes/faculty');
const dataRoutes = require('./routes/data');
const { pingMongo } = require('./mongo');

const app = express();
const PORT = process.env.PORT || 5000;
const isDev = process.env.NODE_ENV !== 'production';

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/concepts', conceptRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/data', dataRoutes);

// Health check
app.get('/api/health', async (req, res) => {
    if (!process.env.MONGODB_URI) {
        return res.json({
            status: 'ok',
            database: 'local-json',
            warning: 'MongoDB is not configured; using server/database.json.',
            timestamp: new Date().toISOString()
        });
    }

    try {
        await pingMongo();
        res.json({ status: 'ok', database: 'connected', timestamp: new Date().toISOString() });
    } catch (err) {
        console.error('MongoDB health check failed:', err.message);
        res.status(503).json({
            status: 'degraded',
            database: 'disconnected',
            error: 'MongoDB is unavailable; check connectivity and credentials.'
        });
    }
});

async function startServer() {
    if (isDev) {
        // In development, embed Vite's dev server as middleware
        // so both API and frontend are served from the same port
        const { createServer: createViteServer } = await import('vite');
        const vite = await createViteServer({
            root: path.resolve(__dirname, '..'),
            server: {
                middlewareMode: true,
                headers: {
                    'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
                },
            },
            appType: 'spa',
        });
        // Use Vite's connect-based middleware
        app.use(vite.middlewares);

        // SPA Fallback for development
        app.get(/^(?!\/api).+/, async (req, res, next) => {
            if (req.url.startsWith('/api')) return next();
            try {
                const fs = require('fs');
                let template = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf-8');
                template = await vite.transformIndexHtml(req.url, template);
                res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
            } catch (e) {
                vite.ssrFixStacktrace(e);
                next(e);
            }
        });
    } else {
        // In production, serve the pre-built static files
        app.use(express.static(path.resolve(__dirname, '../dist')));
        app.get(/^(?!\/api).+/, (req, res) => {
            res.sendFile(path.resolve(__dirname, '../dist', 'index.html'));
        });
    }

    app.listen(PORT, () => {
        console.log(`✅ Server running on http://localhost:${PORT}`);
        if (isDev) {
            console.log(`🚀 Frontend + Backend combined on single port ${PORT}`);
        }
    });
}

if (require.main === module) {
    startServer();
}

module.exports = app;
