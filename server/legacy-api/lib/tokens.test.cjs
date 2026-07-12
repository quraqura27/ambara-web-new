const assert = require('node:assert/strict');
const test = require('node:test');
const jwt = require('jsonwebtoken');

const { handler: clientHandler } = require('../handlers/client-api');
const { authorizeLegacyRequest } = require('./access-policy');
const {
  CLIENT_TOKEN_AUDIENCE,
  CLIENT_TOKEN_ISSUER,
  signClientToken,
  verifyClientToken,
} = require('./tokens');

const STAFF_TOKEN_AUDIENCE = 'ambara-staff-api';
const STAFF_TOKEN_ISSUER = 'ambara-portal';

const originalStaffSecret = process.env.STAFF_JWT_SECRET;
const originalClientSecret = process.env.CLIENT_JWT_SECRET;
process.env.STAFF_JWT_SECRET = 'test-staff-boundary-secret-32-bytes';
process.env.CLIENT_JWT_SECRET = 'test-client-boundary-secret-32-bytes';

test.after(() => {
  if (originalStaffSecret === undefined) delete process.env.STAFF_JWT_SECRET;
  else process.env.STAFF_JWT_SECRET = originalStaffSecret;
  if (originalClientSecret === undefined) delete process.env.CLIENT_JWT_SECRET;
  else process.env.CLIENT_JWT_SECRET = originalClientSecret;
});

function event(token, action, method = 'POST') {
  return {
    body: '{}',
    headers: token ? { authorization: `Bearer ${token}` } : {},
    httpMethod: method,
    queryStringParameters: { action },
  };
}

function syntheticStaffToken(id, role = 'admin') {
  return jwt.sign({
    aud: STAFF_TOKEN_AUDIENCE,
    email: `${role}@example.test`,
    id,
    iss: STAFF_TOKEN_ISSUER,
    name: role,
    role,
    sessionVersion: 1,
    sub: String(id),
  }, process.env.STAFF_JWT_SECRET, { algorithm: 'HS256', expiresIn: '8h' });
}

test('client tokens carry mandatory client-only claims', () => {
  const clientToken = signClientToken({ id: 20, name: 'Client', role: 'client', sessionVersion: 2 });
  const clientClaims = jwt.decode(clientToken);

  assert.equal(clientClaims.iss, CLIENT_TOKEN_ISSUER);
  assert.equal(clientClaims.aud, CLIENT_TOKEN_AUDIENCE);
  assert.equal(clientClaims.role, 'client');
  assert.equal(clientClaims.sub, '20');
  assert.equal(clientClaims.sessionVersion, 2);
});

test('client API rejects a valid staff-audience token', async () => {
  const staffToken = syntheticStaffToken(10);
  const result = await clientHandler(event(staffToken, 'verify', 'GET'));
  assert.equal(result.statusCode, 401);
});

test('client tokens cannot revive the retired credential endpoint', async () => {
  const clientToken = signClientToken({ id: 20, role: 'client', sessionVersion: 1 });

  assert.equal((await authorizeLegacyRequest('client-api', event(clientToken, 'set-password'))).status, 410);
});

test('obsolete staff and destructive handler families are retired for every token type', async () => {
  const clientToken = signClientToken({ id: 20, role: 'client', sessionVersion: 1 });
  const adminToken = syntheticStaffToken(32);
  const retiredTargets = [
    'auth',
    'awbs',
    'quotes',
    'customers',
    'documents',
    'shipments',
    'v1-awbs-mark-invoiced',
    'v1-awbs-parse',
    'v1-awbs-unmark',
    'v1-awbs-update',
    'v1-awbs-upload',
    'v1-customers-awbs',
    'v1-customers-search',
    'v1-invoices-upload-pdf',
    'v1-invoices',
    'v1-notifications',
  ];

  for (const target of retiredTargets) {
    assert.equal((await authorizeLegacyRequest(target, event(clientToken, 'delete'))).status, 410, target);
    assert.equal((await authorizeLegacyRequest(target, event(adminToken, 'delete'))).status, 410, target);
  }
  assert.equal((await authorizeLegacyRequest('content', event(adminToken, 'delete'))).status, 410);
  assert.equal((await authorizeLegacyRequest('blog-api', event(adminToken, 'delete'))).status, 410);
});

test('legacy customer credential mutation is retired for every staff role', async () => {
  const viewerToken = syntheticStaffToken(30, 'viewer');
  const financeToken = syntheticStaffToken(31, 'finance');
  const adminToken = syntheticStaffToken(32);

  assert.equal((await authorizeLegacyRequest('client-api', event(viewerToken, 'set-password'))).status, 410);
  assert.equal((await authorizeLegacyRequest('client-api', event(financeToken, 'set-password'))).status, 410);
  assert.equal((await authorizeLegacyRequest('client-api', event(adminToken, 'set-password'))).status, 410);
});
