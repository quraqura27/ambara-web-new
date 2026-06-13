const assert = require('node:assert/strict');
const test = require('node:test');

const { getRuntimeDatabaseUrl } = require('./db');

test('legacy runtime database URL uses NETLIFY_DATABASE_URL', () => {
  assert.equal(
    getRuntimeDatabaseUrl({ NETLIFY_DATABASE_URL: 'staging-netlify-url' }),
    'staging-netlify-url',
  );
});

test('legacy runtime database URL ignores DATABASE_URL', () => {
  assert.equal(
    getRuntimeDatabaseUrl({
      DATABASE_URL: 'production-database-url',
      NETLIFY_DATABASE_URL: 'staging-netlify-url',
    }),
    'staging-netlify-url',
  );
});

test('legacy runtime database URL fails clearly when NETLIFY_DATABASE_URL is missing', () => {
  assert.throws(
    () => getRuntimeDatabaseUrl({ DATABASE_URL: 'production-database-url' }),
    /NETLIFY_DATABASE_URL is required for database access\./,
  );
});
