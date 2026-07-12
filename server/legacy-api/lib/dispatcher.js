const dispatcher = {
  "blog-api": () => import("../handlers/blog-api"),
  "client-api": () => import("../handlers/client-api"),
  "content": () => import("../handlers/content"),
  "public-stats": () => import("../handlers/public-stats"),
  "sitemap": () => import("../handlers/sitemap"),
  "submit-contact": () => import("../handlers/submit-contact"),
  "submit-quote": () => import("../handlers/submit-quote"),
  "track-shipment": () => import("../handlers/track-shipment"),
  "ping": async () => ({ default: async () => ({ statusCode: 200, body: JSON.stringify({ status: "pong" }) }) }),
};

export default dispatcher;
