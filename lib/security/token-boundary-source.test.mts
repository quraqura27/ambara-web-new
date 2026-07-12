import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function read(path: string) {
  return readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
}

test("native staff sessions require staff-only claims and key", () => {
  const portalAuth = read("lib/portal-auth.ts");
  const staffToken = read("lib/security/staff-token.ts");
  for (const claim of ["aud", "iss", "role", "sub", "sessionVersion"]) {
    assert.match(staffToken, new RegExp(claim));
  }
  assert.match(portalAuth, /STAFF_JWT_SECRET/);
  assert.doesNotMatch(portalAuth, /NETLIFY_DATABASE_URL_UNPOOLED\s*\|\|/);
});

test("legacy client auth uses only the client token verifier", () => {
  const clientApi = read("server/legacy-api/handlers/client-api.js");
  assert.match(clientApi, /signClientToken/);
  assert.match(clientApi, /verifyClientToken/);
  assert.doesNotMatch(clientApi, /verifyStaffToken/);
  assert.doesNotMatch(clientApi, /process\.env\.JWT_SECRET/);
});
