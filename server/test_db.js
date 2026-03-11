const pool = require('./db');
async function checkDB() {
    try {
        console.log('Testing connection to student_retention...');
        const res = await pool.query('SELECT current_database(), current_user');
        console.log('Connected to:', res.rows[0]);

        console.log('Checking for admins table...');
        const tableRes = await pool.query("SELECT count(*) FROM information_schema.tables WHERE table_name = 'admins'");
        console.log('Admins table exists:', tableRes.rows[0].count > 0);

        if (tableRes.rows[0].count > 0) {
            const countRes = await pool.query('SELECT count(*) FROM admins');
            console.log('Number of admins:', countRes.rows[0].count);
        }

    } catch (err) {
        console.error('DB Error:', err.message);
    } finally {
        await pool.end();
    }
}
checkDB();
