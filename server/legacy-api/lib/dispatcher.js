/**
 * ASYNC API DISPATCHER
 * This version uses dynamic imports to ensure peak compatibility 
 * with the Next.js App Router and Vercel bundling.
 */

const dispatcher = {
  "auth": () => import("../handlers/auth"),
  "awbs": () => import("../handlers/awbs"),
  "blog-api": () => import("../handlers/blog-api"),
  "client-api": () => import("../handlers/client-api"),
  "content": () => import("../handlers/content"),
  "customers": () => import("../handlers/customers"),
  "documents": () => import("../handlers/documents"),
  "public-stats": () => import("../handlers/public-stats"),
  "quotes": () => import("../handlers/quotes"),
  "shipments": () => import("../handlers/shipments"),
  "sitemap": () => import("../handlers/sitemap"),
  "submit-contact": () => import("../handlers/submit-contact"),
  "submit-quote": () => import("../handlers/submit-quote"),
  "track-shipment": () => import("../handlers/track-shipment"),
  "v1-awbs-mark-invoiced": () => import("../handlers/v1-awbs-mark-invoiced"),
  "v1-awbs-parse": () => import("../handlers/v1-awbs-parse"),
  "v1-awbs-unmark": () => import("../handlers/v1-awbs-unmark"),
  "v1-awbs-update": () => import("../handlers/v1-awbs-update"),
  "v1-awbs-upload": () => import("../handlers/v1-awbs-upload"),
  "v1-customers-awbs": () => import("../handlers/v1-customers-awbs"),
  "v1-customers-search": () => import("../handlers/v1-customers-search"),
  "v1-invoices-upload-pdf": () => import("../handlers/v1-invoices-upload-pdf"),
  "v1-invoices": () => import("../handlers/v1-invoices"),
  "v1-notifications": () => import("../handlers/v1-notifications"),
  "ping": async () => ({ default: async (event) => ({ statusCode: 200, body: JSON.stringify({ status: "pong" }) }) })
};

export default dispatcher;
