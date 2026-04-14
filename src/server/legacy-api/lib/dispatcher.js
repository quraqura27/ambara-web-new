/**
 * STATIC API MANIFEST
 * This file explicitly requires all legacy handlers to ensure they are 
 * traced and bundled by Vercel into the single 'main' serverless function.
 */

const dispatcher = {
  get "auth"() { return require("../handlers/auth"); },
  get "awbs"() { return require("../handlers/awbs"); },
  get "blog-api"() { return require("../handlers/blog-api"); },
  get "client-api"() { return require("../handlers/client-api"); },
  get "content"() { return require("../handlers/content"); },
  get "customers"() { return require("../handlers/customers"); },
  get "documents"() { return require("../handlers/documents"); },
  get "public-stats"() { return require("../handlers/public-stats"); },
  get "quotes"() { return require("../handlers/quotes"); },
  get "shipments"() { return require("../handlers/shipments"); },
  get "sitemap"() { return require("../handlers/sitemap"); },
  get "submit-contact"() { return require("../handlers/submit-contact"); },
  get "submit-quote"() { return require("../handlers/submit-quote"); },
  get "track-shipment"() { return require("../handlers/track-shipment"); },
  get "v1-awbs-mark-invoiced"() { return require("../handlers/v1-awbs-mark-invoiced"); },
  get "v1-awbs-parse"() { return require("../handlers/v1-awbs-parse"); },
  get "v1-awbs-unmark"() { return require("../handlers/v1-awbs-unmark"); },
  get "v1-awbs-update"() { return require("../handlers/v1-awbs-update"); },
  get "v1-awbs-upload"() { return require("../handlers/v1-awbs-upload"); },
  get "v1-customers-awbs"() { return require("../handlers/v1-customers-awbs"); },
  get "v1-customers-search"() { return require("../handlers/v1-customers-search"); },
  get "v1-invoices-upload-pdf"() { return require("../handlers/v1-invoices-upload-pdf"); },
  get "v1-invoices"() { return require("../handlers/v1-invoices"); },
  get "v1-notifications"() { return require("../handlers/v1-notifications"); },
  get "ping"() { return async (event) => ({ statusCode: 200, body: JSON.stringify({ status: "pong", timestamp: new Date().toISOString() }) }); }
};

module.exports = dispatcher;
