const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || undefined,
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'student_retention',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
    ssl: process.env.DATABASE_URL
        ? { rejectUnauthorized: false }
        : false,
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
});

module.exports = pool;
