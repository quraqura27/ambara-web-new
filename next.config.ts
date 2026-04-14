import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Support legacy marketing site and consolidated API
  async rewrites() {
    return [
      {
        source: "/.netlify/functions/:path*",
        destination: "/api/main",
      },
      {
        source: "/api/v1/:path*",
        destination: "/api/main",
      },
      // Ensure specific internal API routes aren't intercepted if they exist
      {
        source: "/api/:path((?!^main$).*)",
        destination: "/api/main",
      },
      {
        source: "/sitemap.xml",
        destination: "/api/main",
      },
      // Legacy landing page redirects
      {
        source: "/",
        destination: "/en/index.html",
      },
      {
        source: "/en",
        destination: "/en/index.html",
      },
      {
        source: "/id",
        destination: "/id/index.html",
      },
    ];
  },
  // Ensure images from Cloudflare R2 are supported
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.r2.cloudflarestorage.com',
      },
    ],
  },
};

export default nextConfig;
