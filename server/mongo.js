const { MongoClient } = require('mongodb');

let clientPromise;

async function getDatabase() {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI is not configured. Set it in your environment or .env file.');

    if (!clientPromise) {
        const client = new MongoClient(uri);
        clientPromise = client.connect().catch((err) => {
            clientPromise = undefined;
            throw err;
        });
    }

    const client = await clientPromise;
    return client.db(process.env.MONGODB_DB || 'academic');
}

async function pingMongo() {
    const database = await getDatabase();
    await database.command({ ping: 1 });
}

async function closeMongo() {
    if (!clientPromise) return;
    const client = await clientPromise;
    await client.close();
    clientPromise = undefined;
}

module.exports = { getDatabase, pingMongo, closeMongo };