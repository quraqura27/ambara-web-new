/**
 * STATIC API MANIFEST
 * This file explicitly requires all legacy handlers to ensure they are 
 * traced and bundled by Vercel into the single 'main' serverless function.
 */

module.exports = {
  "auth": require("../_handlers/auth"),
  "awbs": require("../_handlers/awbs"),
  "blog-api": require("../_handlers/blog-api"),
  "client-api": require("../_handlers/client-api"),
  "content": require("../_handlers/content"),
  "customers": require("../_handlers/customers"),
  "documents": require("../_handlers/documents"),
  "public-stats": require("../_handlers/public-stats"),
  "quotes": require("../_handlers/quotes"),
  "shipments": require("../_handlers/shipments"),
  "sitemap": require("../_handlers/sitemap"),
  "submit-contact": require("../_handlers/submit-contact"),
  "submit-quote": require("../_handlers/submit-quote"),
  "track-shipment": require("../_handlers/track-shipment"),
  "v1-awbs-mark-invoiced": require("../_handlers/v1-awbs-mark-invoiced"),
  "v1-awbs-parse": require("../_handlers/v1-awbs-parse"),
  "v1-awbs-unmark": require("../_handlers/v1-awbs-unmark"),
  "v1-awbs-update": require("../_handlers/v1-awbs-update"),
  "v1-awbs-upload": require("../_handlers/v1-awbs-upload"),
  "v1-customers-awbs": require("../_handlers/v1-customers-awbs"),
  "v1-customers-search": require("../_handlers/v1-customers-search"),
  "v1-invoices-upload-pdf": require("../_handlers/v1-invoices-upload-pdf"),
  "v1-invoices": require("../_handlers/v1-invoices"),
  "v1-notifications": require("../_handlers/v1-notifications")
};
