const { timingSafeEqual } = require('node:crypto');

function constantTimeEqual(left, right) {
  const leftBuffer = Buffer.from(String(left));
  const rightBuffer = Buffer.from(String(right));
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function isCronRequestAuthorized(event, env = process.env) {
  const configuredSecret = String(env.CRON_SECRET || '').trim();
  if (!configuredSecret) return false;

  const querySecret = String(event?.queryStringParameters?.secret || '').trim();
  const authorization = String(
    event?.headers?.authorization || event?.headers?.Authorization || '',
  ).trim();
  const bearerSecret = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
  const suppliedSecret = bearerSecret || querySecret;

  return Boolean(suppliedSecret) && constantTimeEqual(suppliedSecret, configuredSecret);
}

module.exports = { isCronRequestAuthorized };
