import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Support legacy marketing site and consolidated API
  async rewrites() {
    return [
      // 1. UNIVERSAL API GATEWAY (Priority)
      {
        source: "/.netlify/functions/:path*",
        destination: "/api/main",
      },
      {
        source: "/api/v1/:path*",
        destination: "/api/main",
      },
      // Exclude /api/main itself to avoid loops
      {
        source: "/api/:path((?!^main$).*)",
        destination: "/api/main",
      },
      
      // 2. BILINGUAL MARKETING BRIDGE
      // Maps /en/services -> /services.html
      {
        source: "/en/:path*",
        destination: "/:path.html",
      },
      // Maps /id/services -> /id/services.html
      {
        source: "/id/:path*",
        destination: "/id/:path.html",
      },
      
      // 3. LEGACY ENTRY REDIRECTS
      {
        source: "/",
        destination: "/index.html",
      },
      {
        source: "/en",
        destination: "/index.html",
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
