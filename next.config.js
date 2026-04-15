/** @type {import('next').NextConfig} */
const nextConfig = {
  // Support legacy marketing site and consolidated API
  async rewrites() {
    return [
      // 1. UNIVERSAL API GATEWAY (Priority - App Router)
      {
        source: "/api/:path((?!^main$).*)",
        destination: "/api/main/:path*",
      },
      // 2. BILINGUAL MARKETING (Bridge to Public Files)
      {
        source: "/en/:path*",
        destination: "/en/:path*.html",
      },
      {
        source: "/id/:path*",
        destination: "/id/:path*.html",
      },
      {
        source: "/en",
        destination: "/en/index.html",
      },
      {
        source: "/id",
        destination: "/id/index.html",
      }
    ];
  },
  // Ignore lint/ts errors on production build for legacy compatibility
  typescript: { ignoreBuildErrors: true }
};

module.exports = nextConfig;
