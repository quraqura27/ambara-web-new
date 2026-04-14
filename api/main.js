const { wrap } = require('./lib/adapter');
const dispatcher = require('./lib/dispatcher');

/**
 * UNIVERSAL API GATEWAY (Bypasses Vercel 12-Function Limit)
 * This router catches all requests to /api/* and dispatches them 
 * to the appropriate legacy handler using a static manifest.
 */
module.exports = async (req, res) => {
  // 1. Resolve the requested function name
  const urlPath = req.url?.split('?')[0] || '';
  
  // Normalize paths: 
  // /api/shipments -> shipments
  // /.netlify/functions/shipments -> shipments
  let funcName = urlPath
    .replace(/^\/\.netlify\/functions\//, '')
    .replace(/^\/api\//, '')
    .split('/')[0];

  // If path was just /api/ we might need to look deeper
  if (!funcName) {
    return res.status(400).json({ error: "Missing function identifier" });
  }

  try {
    // 2. Lookup the target handler from the static manifest
    const handlerModule = dispatcher[funcName];
    
    if (!handlerModule || !handlerModule.handler) {
      throw new Error(`Migration error: Function '${funcName}' not found in dispatcher`);
    }

    // 3. Wrap and execute via the path-aware adapter
    // Passing funcName ensures event.path remains correct for the handler
    const wrappedHandler = wrap(handlerModule.handler, funcName);
    return await wrappedHandler(req, res);
    
  } catch (err) {
    console.error(`[Universal Gateway] Routing failure for: ${funcName}`, err);
    
    res.status(404).json({ 
      error: "Legacy function not found or failed to load",
      target: funcName,
      timestamp: new Date().toISOString()
    });
  }
};
