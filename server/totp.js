const crypto = require('crypto');

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function generateSecret(byteLength = 20) {
    const bytes = crypto.randomBytes(byteLength);
    let bits = '';
    for (const byte of bytes) bits += byte.toString(2).padStart(8, '0');

    let secret = '';
    for (let index = 0; index < bits.length; index += 5) {
        secret += BASE32_ALPHABET[parseInt(bits.slice(index, index + 5).padEnd(5, '0'), 2)];
    }
    return secret;
}

function decodeBase32(secret) {
    const normalized = secret.replace(/=+$/, '').toUpperCase();
    let bits = '';
    for (const character of normalized) {
        const value = BASE32_ALPHABET.indexOf(character);
        if (value === -1) throw new Error('Invalid base32 secret.');
        bits += value.toString(2).padStart(5, '0');
    }

    const bytes = [];
    for (let index = 0; index + 8 <= bits.length; index += 8) {
        bytes.push(parseInt(bits.slice(index, index + 8), 2));
    }
    return Buffer.from(bytes);
}

function generateCode(secret, time = Date.now()) {
    const counter = Math.floor(time / 30000);
    const counterBuffer = Buffer.alloc(8);
    counterBuffer.writeBigUInt64BE(BigInt(counter));
    const digest = crypto.createHmac('sha1', decodeBase32(secret)).update(counterBuffer).digest();
    const offset = digest[digest.length - 1] & 0x0f;
    const value = digest.readUInt32BE(offset) & 0x7fffffff;
    return String(value % 1000000).padStart(6, '0');
}

function matchCode(secret, code, time = Date.now()) {
    if (typeof code !== 'string' || !/^\d{6}$/.test(code)) return null;
    const supplied = Buffer.from(code);
    for (const timeOffset of [-30000, 0, 30000]) {
        const expected = Buffer.from(generateCode(secret, time + timeOffset));
        if (crypto.timingSafeEqual(supplied, expected)) return Math.floor((time + timeOffset) / 30000);
    }
    return null;
}

function verifyCode(secret, code, time = Date.now()) {
    return matchCode(secret, code, time) !== null;
}

module.exports = { generateSecret, generateCode, matchCode, verifyCode };
