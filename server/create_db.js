const { Client } = require('pg');

async function createDatabase() {
    const client = new Client({
        user: 'postgres',
        host: 'localhost',
        database: 'postgres',
        password: 'postgres',
        port: 5432,
    });

    try {
        await client.connect();
        console.log('Connected to postgres database.');
        
        const res = await client.query("SELECT 1 FROM pg_database WHERE datname = 'student_retention'");
        if (res.rowCount === 0) {
            console.log('Creating database student_retention...');
            await client.query('CREATE DATABASE student_retention');
            console.log('Database created successfully.');
        } else {
            console.log('Database student_retention already exists.');
        }
    } catch (err) {
        console.error('Error creating database:', err.message);
    } finally {
        await client.end();
    }
}

createDatabase();
