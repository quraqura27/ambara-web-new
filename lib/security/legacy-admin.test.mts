import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { isLegacyAdminPath } from "./legacy-admin.ts";

function read(path: string) {
  return readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
}

test("legacy admin paths are hard-blocked in both languages", () => {
  ["/admin", "/admin.html", "/en/admin", "/en/admin.html", "/en/admin/"].forEach((path) => {
    assert.equal(isLegacyAdminPath(path), true, path);
  });
  assert.equal(isLegacyAdminPath("/dashboard"), false);

  const proxy = read("proxy.ts");
  const config = read("next.config.js");
  assert.match(proxy, /isLegacyAdminPath/);
  assert.match(config, /legacyAdminPaths/);
});

test("legacy admin artifact no longer stores tokens or renders stored HTML", () => {
  const admin = read("public/admin.html");
  assert.equal(admin.includes("localStorage"), false);
  assert.equal(admin.includes("innerHTML"), false);
  assert.match(admin, /legacy administration interface is unavailable/i);
});
