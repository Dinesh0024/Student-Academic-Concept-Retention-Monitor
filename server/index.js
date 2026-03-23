const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/students');
const subjectRoutes = require('./routes/subjects');
const conceptRoutes = require('./routes/concepts');
const analyticsRoutes = require('./routes/analytics');
const facultyRoutes = require('./routes/faculty');

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

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
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

startServer();
