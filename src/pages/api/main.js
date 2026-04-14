const dispatcher = require("../../server/legacy-api/lib/dispatcher");
const adapter = require("../../server/legacy-api/lib/adapter");

/**
 * UNIVERSAL API GATEWAY (CommonJS Version)
 * This unified function routes all incoming /api requests to their
 * respective legacy handlers while staying under Vercel Hobby plan limits.
 */
module.exports = async function handler(req, res) {
  // Extract path from query (Next.js provides this for both Pages and App Router)
  const { path } = req.query;
  
  // Extract the function name from the path if provided as an array (Next.js catch-all)
  // or use the last segment of the URL
  const pathArray = Array.isArray(path) ? path : (path ? [path] : []);
  const lastSegment = pathArray[pathArray.length - 1] || "";
  
  console.log(`[Gateway] Incoming request for: ${lastSegment}`);

  // Resolve the handler from the static manifest
  const legacyHandler = dispatcher[lastSegment];

  if (!legacyHandler) {
    console.warn(`[Gateway] Handler not found for segment: ${lastSegment}`);
    return res.status(404).json({ 
      error: "Handler not found", 
      path: lastSegment,
      available_endpoints: Object.keys(dispatcher)
    });
  }

  try {
    // Wrap the legacy handler to spoof the external environment and execute
    const wrapped = adapter.wrap(legacyHandler.handler || legacyHandler, lastSegment);
    return await wrapped(req, res);
  } catch (error) {
    console.error(`[Gateway Error] ${lastSegment}:`, error);
    return res.status(500).json({ 
      error: "Internal Gateway Error", 
      message: error.message,
      handler: lastSegment
    });
  }
};
