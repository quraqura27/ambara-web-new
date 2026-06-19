import assert from "node:assert/strict";
import test from "node:test";

import { getRuntimeDatabaseUrl } from "./env.ts";

test("runtime database URL uses NETLIFY_DATABASE_URL", () => {
  assert.equal(
    getRuntimeDatabaseUrl({ NETLIFY_DATABASE_URL: "staging-netlify-url" }),
    "staging-netlify-url",
  );
});

test("runtime database URL falls back to the Preview unpooled URL", () => {
  assert.equal(
    getRuntimeDatabaseUrl({
      NETLIFY_DATABASE_URL_UNPOOLED: "preview-unpooled-url",
    }),
    "preview-unpooled-url",
  );
});

test("runtime database URL prefers the pooled URL when both are available", () => {
  assert.equal(
    getRuntimeDatabaseUrl({
      NETLIFY_DATABASE_URL: "pooled-url",
      NETLIFY_DATABASE_URL_UNPOOLED: "unpooled-url",
    }),
    "pooled-url",
  );
});

test("runtime database URL ignores DATABASE_URL", () => {
  assert.equal(
    getRuntimeDatabaseUrl({
      DATABASE_URL: "production-database-url",
      NETLIFY_DATABASE_URL: "staging-netlify-url",
    }),
    "staging-netlify-url",
  );
});

test("runtime database URL fails clearly when NETLIFY_DATABASE_URL is missing", () => {
  assert.throws(
    () => getRuntimeDatabaseUrl({ DATABASE_URL: "production-database-url" }),
    /NETLIFY_DATABASE_URL or NETLIFY_DATABASE_URL_UNPOOLED is required for database access\./,
  );
});
