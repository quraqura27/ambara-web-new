import assert from "node:assert/strict";
import test from "node:test";

import {
  buildLoginThrottleKey,
  isLoginThrottleActive,
  loginThrottlePolicy,
} from "./login-throttle.ts";

test("login throttle keys are stable, normalized, and do not expose identity", () => {
  const first = buildLoginThrottleKey(" Staff@Example.com ", " 203.0.113.10 ", "test-salt");
  const second = buildLoginThrottleKey("staff@example.com", "203.0.113.10", "test-salt");
  assert.equal(first, second);
  assert.equal(first.length, 64);
  assert.doesNotMatch(first, /staff|example|203/);
});

test("login throttle blocks only while the deadline is in the future", () => {
  const now = new Date("2026-07-12T10:00:00.000Z");
  assert.equal(isLoginThrottleActive("2026-07-12T10:01:00.000Z", now), true);
  assert.equal(isLoginThrottleActive("2026-07-12T09:59:00.000Z", now), false);
  assert.equal(loginThrottlePolicy.maxAttempts, 5);
});
