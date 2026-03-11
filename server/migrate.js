const fs = require('fs');
const path = require('path');
const pool = require('./db');

async function migrate() {
    try {
        console.log('🚀 Starting Database Migration...');

        // Read schema.sql
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        // Execute schema
        console.log('📄 Applying schema.sql...');
        await pool.query(schemaSql);
        console.log('✅ Schema applied successfully.');

        // Optionally read and apply seed.sql
        const seedPath = path.join(__dirname, 'seed.sql');
        if (fs.existsSync(seedPath)) {
            console.log('🌱 Applying seed.sql...');
            const seedSql = fs.readFileSync(seedPath, 'utf8');
            await pool.query(seedSql);
            console.log('✅ Seed data applied successfully.');
        }

        console.log('🎯 Migration completed successfully.');
    } catch (err) {
        console.error('❌ Migration failed:');
        console.error(err);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

migrate();
