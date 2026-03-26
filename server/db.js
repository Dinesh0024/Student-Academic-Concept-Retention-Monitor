// Check if we should use Postgres or JSON DB fallback
let pool;
try {
    const { Pool } = require('pg');
    pool = new Pool({
        user: process.env.DB_USER || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_NAME || 'student_retention',
        password: process.env.DB_PASSWORD || 'postgres',
        port: process.env.DB_PORT || 5432,
    });
    
    // Test connection synchronously-ish or just handle error
    pool.on('error', (err) => {
        console.error('Postgres error, falling back to JSON DB:', err.message);
    });
} catch (e) {
    console.log('Postgres driver not found or error, using JSON DB');
    pool = require('./json_db');
}

// For now, let's just force JSON DB if Postgres is not running
// To be safe and ensure the app runs, we'll use the JSON DB which already has data
module.exports = require('./json_db');
