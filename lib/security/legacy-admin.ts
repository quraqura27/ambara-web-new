const legacyAdminPaths = new Set([
  "/admin",
  "/admin.html",
  "/en/admin",
  "/en/admin.html",
]);

export function isLegacyAdminPath(pathname: string) {
  const normalized = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  return legacyAdminPaths.has(normalized.toLowerCase());
}
