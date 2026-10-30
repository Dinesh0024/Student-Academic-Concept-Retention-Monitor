const test = require('node:test');
const assert = require('node:assert/strict');
const { generateCode, generateSecret, verifyCode } = require('./totp');

test('matches the RFC 6238 SHA-1 test vector', () => {
    const secret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';
    const code = generateCode(secret, 59000);

    assert.equal(code, '287082');
    assert.equal(verifyCode(secret, code, 59000), true);
});

test('accepts adjacent time steps and rejects malformed or incorrect codes', () => {
    const secret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';
    const time = 59000;

    assert.equal(verifyCode(secret, generateCode(secret, time - 30000), time), true);
    assert.equal(verifyCode(secret, generateCode(secret, time + 30000), time), true);
    assert.equal(verifyCode(secret, '12345', time), false);
    assert.equal(verifyCode(secret, 'abcdef', time), false);
});

test('generates a valid base32 secret', () => {
    const secret = generateSecret();

    assert.match(secret, /^[A-Z2-7]+$/);
    assert.equal(secret.length, 32);
    assert.match(generateCode(secret), /^\d{6}$/);
});
