const assert = require('node:assert/strict');
const test = require('node:test');

const { handler } = require('../handlers/blog-api');
const { isCronRequestAuthorized } = require('./cron-auth');

function cronEvent(secret, authorization) {
  return {
    headers: authorization ? { authorization } : {},
    httpMethod: 'POST',
    queryStringParameters: { action: 'auto-publish', ...(secret ? { secret } : {}) },
  };
}

test('cron auth fails closed when the configured secret is missing', async () => {
  assert.equal(isCronRequestAuthorized(cronEvent(), {}), false);

  const original = process.env.CRON_SECRET;
  delete process.env.CRON_SECRET;
  const result = await handler(cronEvent());
  if (original === undefined) delete process.env.CRON_SECRET;
  else process.env.CRON_SECRET = original;

  assert.equal(result.statusCode, 401);
});

test('cron auth rejects invalid query and bearer secrets', async () => {
  const original = process.env.CRON_SECRET;
  process.env.CRON_SECRET = 'configured-test-cron-secret';
  assert.equal(isCronRequestAuthorized(cronEvent('wrong-secret')), false);
  assert.equal(isCronRequestAuthorized(cronEvent('', 'Bearer wrong-secret')), false);
  const result = await handler(cronEvent('wrong-secret'));
  if (original === undefined) delete process.env.CRON_SECRET;
  else process.env.CRON_SECRET = original;

  assert.equal(result.statusCode, 401);
});
