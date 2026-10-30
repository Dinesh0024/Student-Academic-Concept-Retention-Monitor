require('dotenv').config();

const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { closeMongo, getDatabase } = require('./mongo');

async function checkLocalCrud() {
    const jsonDb = require('./json_db');
    const id = randomUUID();
    const record = { id, value: 'written' };

    try {
        assert.equal(jsonDb.insertRecord('_connection_checks', record), true, 'record should be inserted');
        assert.equal(jsonDb.getRecords('_connection_checks').find((item) => item.id === id)?.value, 'written');

        jsonDb.upsertRecord('_connection_checks', { id, value: 'updated' });
        assert.equal(jsonDb.getRecords('_connection_checks').find((item) => item.id === id)?.value, 'updated');

        assert.equal(jsonDb.deleteRecord('_connection_checks', id), true, 'record should be deleted');
        assert.equal(jsonDb.getRecords('_connection_checks').some((item) => item.id === id), false);

        console.log('Local JSON insert/read/update/delete round-trip passed.');
    } finally {
        jsonDb.deleteRecord('_connection_checks', id);
    }
}

async function checkMongoCrud() {
    let database;
    const id = randomUUID();

    try {
        database = await getDatabase();
        const collection = database.collection('_connection_checks');
        await collection.insertOne({ id, value: 'written' });

        const inserted = await collection.findOne({ id });
        assert.equal(inserted?.value, 'written', 'inserted record should be readable');

        await collection.updateOne({ id }, { $set: { value: 'updated' } });
        const updated = await collection.findOne({ id });
        assert.equal(updated?.value, 'updated', 'updated record should be readable');

        await collection.deleteOne({ id });
        const deleted = await collection.findOne({ id });
        assert.equal(deleted, null, 'deleted record should not be readable');

        console.log('MongoDB insert/read/update/delete round-trip passed.');
    } finally {
        if (database) await database.collection('_connection_checks').deleteOne({ id });
        await closeMongo();
    }
}

const checkCrud = process.env.MONGODB_URI ? checkMongoCrud : checkLocalCrud;

checkCrud().catch((err) => {
    console.error('Database CRUD round-trip failed:', err.message);
    process.exitCode = 1;
});