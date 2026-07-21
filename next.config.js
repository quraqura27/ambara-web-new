/** @type {import('next').NextConfig} */
const serverActionOrigins = [
  "ambaraartha.com",
  "www.ambaraartha.com",
  process.env.VERCEL_URL,
  process.env.VERCEL_BRANCH_URL,
  process.env.VERCEL_PROJECT_PRODUCTION_URL,
].filter(Boolean);

const commonSecurityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const blockedAdminCsp = "default-src 'none'; style-src 'self' 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'";
const legacyAdminPaths = ["/admin", "/admin.html", "/en/admin", "/en/admin.html"];
const portalScriptSources = process.env.NODE_ENV === "development"
  ? "'self' 'unsafe-inline' 'unsafe-eval'"
  : "'self' 'unsafe-inline'";
const portalCsp = `default-src 'self'; script-src ${portalScriptSources}; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'`;
const clientPortalCsp = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'";
const portalPaths = [
  "/dashboard/:path*",
  "/operations/:path*",
  "/shipments/:path*",
  "/customers/:path*",
  "/delivery-batches/:path*",
  "/mawbs/:path*",
  "/invoices/:path*",
  "/quotes/:path*",
  "/documents/:path*",
  "/accounts/:path*",
  "/search/:path*",
  "/portal-preview/:path*",
];

const nextConfig = {
  poweredByHeader: false,
  // Support legacy marketing site and consolidated API
  async headers() {
    return [
      { source: "/:path*", headers: commonSecurityHeaders },
      ...legacyAdminPaths.map((source) => ({
        source,
        headers: [{ key: "Content-Security-Policy", value: blockedAdminCsp }],
      })),
      ...portalPaths.map((source) => ({
        source,
        headers: [{ key: "Content-Security-Policy", value: portalCsp }],
      })),
      ...["/client", "/client.html", "/en/client", "/en/client.html"].map((source) => ({
        source,
        headers: [{ key: "Content-Security-Policy", value: clientPortalCsp }],
      })),
      {
        source: "/api/client-api",
        headers: [{ key: "Cache-Control", value: "private, no-store, max-age=0" }],
      },
    ];
  },
  async redirects() {
    return [
      ...legacyAdminPaths.map((source) => ({
        source,
        destination: "/dashboard",
        permanent: false,
      })),
      {
        source: "/finance/invoice",
        destination: "/invoices",
        permanent: false,
      },
      {
        source: "/finance/invoice.html",
        destination: "/invoices",
        permanent: false,
      },
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "ambaraartha.com",
          },
        ],
        destination: "https://www.ambaraartha.com/:path*",
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/en/index.html",
        destination: "/index.html",
      },
      {
        source: "/en/blog/:slug",
        destination: "/blog/:slug.html",
      },
      {
        source: "/en/:path+",
        destination: "/:path*.html",
      },
      {
        source: "/id",
        destination: "/id/index.html",
      },
      {
        source: "/id/",
        destination: "/id/index.html",
      },
      {
        source: "/id/blog/:slug",
        destination: "/id/blog/:slug.html",
      },
      {
        source: "/id/:path+",
        destination: "/id/:path*.html",
      },
    ];
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
      allowedOrigins: serverActionOrigins,
    },
  },
};

module.exports = nextConfig;
