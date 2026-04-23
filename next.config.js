/** @type {import('next').NextConfig} */
const nextConfig = {
  // Support legacy marketing site and consolidated API
  async rewrites() {
    return [
      // ENGLISH backward compat: /en/about → /about.html (files live in public/ root)
      {
        source: "/en",
        destination: "/index.html",
      },
      {
        source: "/en/",
        destination: "/index.html",
      },
      {
        source: "/en/:path+",
        destination: "/:path.html",
      },
      // INDONESIAN: /id/about → /id/about.html (files live in public/id/)
      {
        source: "/id",
        destination: "/id/index.html",
      },
      {
        source: "/id/",
        destination: "/id/index.html",
      },
      {
        source: "/id/:path+",
        destination: "/id/:path.html",
      },
    ];
  },
  // Ignore lint/ts errors on production build for legacy compatibility
  typescript: { ignoreBuildErrors: true },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
      allowedOrigins: ["ambaraartha.com", "www.ambaraartha.com"],
    },
  },
};

module.exports = nextConfig;
