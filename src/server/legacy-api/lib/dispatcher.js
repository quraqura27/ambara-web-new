/**
 * STATIC API MANIFEST
 * This file explicitly requires all legacy handlers to ensure they are 
 * traced and bundled by Vercel into the single 'main' serverless function.
 */

module.exports = {
  "auth": require("../handlers/auth"),
  "awbs": require("../handlers/awbs"),
  "blog-api": require("../handlers/blog-api"),
  "client-api": require("../handlers/client-api"),
  "content": require("../handlers/content"),
  "customers": require("../handlers/customers"),
  "documents": require("../handlers/documents"),
  "public-stats": require("../handlers/public-stats"),
  "quotes": require("../handlers/quotes"),
  "shipments": require("../handlers/shipments"),
  "sitemap": require("../handlers/sitemap"),
  "submit-contact": require("../handlers/submit-contact"),
  "submit-quote": require("../handlers/submit-quote"),
  "track-shipment": require("../handlers/track-shipment"),
  "v1-awbs-mark-invoiced": require("../handlers/v1-awbs-mark-invoiced"),
  "v1-awbs-parse": require("../handlers/v1-awbs-parse"),
  "v1-awbs-unmark": require("../handlers/v1-awbs-unmark"),
  "v1-awbs-update": require("../handlers/v1-awbs-update"),
  "v1-awbs-upload": require("../handlers/v1-awbs-upload"),
  "v1-customers-awbs": require("../handlers/v1-customers-awbs"),
  "v1-customers-search": require("../handlers/v1-customers-search"),
  "v1-invoices-upload-pdf": require("../handlers/v1-invoices-upload-pdf"),
  "v1-invoices": require("../handlers/v1-invoices"),
  "v1-notifications": require("../handlers/v1-notifications")
};
