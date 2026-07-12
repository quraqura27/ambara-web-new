import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

import {
  createStaffToken,
  STAFF_TOKEN_AUDIENCE,
  STAFF_TOKEN_ISSUER,
  verifyStaffToken,
} from "./staff-token.ts";

const require = createRequire(import.meta.url);
const clientTokens = require("../../server/legacy-api/lib/tokens.js") as {
  signClientToken: (payload: Record<string, unknown>) => string;
  verifyClientToken: (token: string) => Record<string, unknown> | null;
};
const staffSecret = "test-native-staff-secret-at-least-32-bytes";
const originalClientSecret = process.env.CLIENT_JWT_SECRET;
process.env.CLIENT_JWT_SECRET = "test-client-boundary-secret-32-bytes";

test.after(() => {
  if (originalClientSecret === undefined) delete process.env.CLIENT_JWT_SECRET;
  else process.env.CLIENT_JWT_SECRET = originalClientSecret;
});

test("native staff token carries mandatory isolated claims", () => {
  const token = createStaffToken({
    email: "staff@example.test",
    id: 10,
    name: "Staff",
    role: "admin",
    sessionVersion: 3,
  }, staffSecret, 1_700_000_000);
  const claims = verifyStaffToken(token, staffSecret, 1_700_000_001);
  assert.equal(claims?.iss, STAFF_TOKEN_ISSUER);
  assert.equal(claims?.aud, STAFF_TOKEN_AUDIENCE);
  assert.equal(claims?.role, "admin");
  assert.equal(claims?.sub, "10");
  assert.equal(claims?.sessionVersion, 3);
});

test("staff and client audiences cannot cross token verifiers", () => {
  const staffToken = createStaffToken({
    email: "staff@example.test",
    id: 10,
    name: "Staff",
    role: "admin",
    sessionVersion: 1,
  }, staffSecret);
  const clientToken = clientTokens.signClientToken({ id: 20, name: "Client", sessionVersion: 1 });

  assert.ok(verifyStaffToken(staffToken, staffSecret));
  assert.ok(clientTokens.verifyClientToken(clientToken));
  assert.equal(verifyStaffToken(clientToken, staffSecret), null);
  assert.equal(clientTokens.verifyClientToken(staffToken), null);
});

test("staff tokens reject expired or future-issued sessions", () => {
  const expired = createStaffToken({ email: "staff@example.test", id: 10, name: "Staff", role: "admin", sessionVersion: 1 }, staffSecret, 1_700_000_000);
  const future = createStaffToken({ email: "staff@example.test", id: 10, name: "Staff", role: "admin", sessionVersion: 1 }, staffSecret, 1_700_100_000);
  assert.equal(verifyStaffToken(expired, staffSecret, 1_700_000_000 + 8 * 60 * 60), null);
  assert.equal(verifyStaffToken(future, staffSecret, 1_700_000_000), null);
});
