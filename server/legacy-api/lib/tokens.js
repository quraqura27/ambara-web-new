const jwt = require('jsonwebtoken');

const CLIENT_TOKEN_ISSUER = 'ambara-client-portal';
const CLIENT_TOKEN_AUDIENCE = 'ambara-client-api';

function requiredSecret(name) {
  const value = String(process.env[name] || '').trim();
  if (!value) throw new Error(`${name} environment variable is not configured`);
  return value;
}

function normalizeSubject(payload) {
  const subject = String(payload?.sub ?? payload?.id ?? '').trim();
  if (!subject) throw new Error('Token subject is required');
  return subject;
}

function normalizeSessionVersion(value) {
  const sessionVersion = Number(value ?? 1);
  if (!Number.isInteger(sessionVersion) || sessionVersion < 1) {
    throw new Error('Token sessionVersion must be a positive integer');
  }
  return sessionVersion;
}

function signToken(payload, config) {
  const subject = normalizeSubject(payload);
  const role = String(config.role ?? payload?.role ?? '').trim().toLowerCase();
  const sessionVersion = normalizeSessionVersion(payload?.sessionVersion);

  return jwt.sign(
    {
      ...payload,
      aud: config.audience,
      iss: config.issuer,
      role,
      sessionVersion,
      sub: subject,
    },
    requiredSecret(config.secretName),
    { algorithm: 'HS256', expiresIn: config.expiresIn },
  );
}

function verifyToken(token, config) {
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, requiredSecret(config.secretName), {
      algorithms: ['HS256'],
      audience: config.audience,
      issuer: config.issuer,
    });

    if (!decoded || typeof decoded !== 'object') return null;
    if (!String(decoded.sub || '').trim()) return null;
    if (!String(decoded.role || '').trim()) return null;
    if (!Number.isInteger(decoded.sessionVersion) || decoded.sessionVersion < 1) return null;
    if (!config.acceptRole(decoded.role)) return null;
    return decoded;
  } catch {
    return null;
  }
}

function signClientToken(payload, options = {}) {
  return signToken(payload, {
    audience: CLIENT_TOKEN_AUDIENCE,
    expiresIn: options.expiresIn || '24h',
    issuer: CLIENT_TOKEN_ISSUER,
    role: 'client',
    secretName: 'CLIENT_JWT_SECRET',
  });
}

function verifyClientToken(token) {
  return verifyToken(token, {
    acceptRole: (role) => role === 'client',
    audience: CLIENT_TOKEN_AUDIENCE,
    issuer: CLIENT_TOKEN_ISSUER,
    secretName: 'CLIENT_JWT_SECRET',
  });
}

module.exports = {
  CLIENT_TOKEN_AUDIENCE,
  CLIENT_TOKEN_ISSUER,
  signClientToken,
  verifyClientToken,
};
