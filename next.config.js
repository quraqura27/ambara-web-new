/** @type {import('next').NextConfig} */
const serverActionOrigins = [
  "ambaraartha.com",
  "www.ambaraartha.com",
  process.env.VERCEL_URL,
  process.env.VERCEL_BRANCH_URL,
  process.env.VERCEL_PROJECT_PRODUCTION_URL,
].filter(Boolean);

const nextConfig = {
  // Support legacy marketing site and consolidated API
  async rewrites() {
    return [
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
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
      allowedOrigins: serverActionOrigins,
    },
  },
};

module.exports = nextConfig;
