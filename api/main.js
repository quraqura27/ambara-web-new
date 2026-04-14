const { wrap } = require('./adapter');

/**
 * UNIVERSAL API GATEWAY (Bypasses Vercel 12-Function Limit)
 * This router catches all requests to /api/* and dispatches them 
 * to the appropriate legacy handler in the ./handlers directory.
 */
module.exports = async (req, res) => {
  // 1. Resolve the requested function name
  const urlPath = req.url?.split('?')[0] || '';
  
  // Normalize paths: 
  // /api/shipments -> shipments
  // /.netlify/functions/shipments -> shipments
  // /api/v1-invoices -> v1-invoices
  let funcName = urlPath
    .replace(/^\/\.netlify\/functions\//, '')
    .replace(/^\/api\//, '')
    .split('/')[0];

  // If path was just /api/ we might need to look deeper
  if (!funcName) {
    return res.status(400).json({ error: "Missing function identifier" });
  }

  try {
    // 2. Load the target handler from the protected handlers directory
    const handlerModule = require(`./handlers/${funcName}`);
    
    if (!handlerModule.handler) {
      throw new Error(`Module ${funcName} does not export a 'handler' function`);
    }

    // 3. Wrap and execute via the existing Vercel adapter
    const wrappedHandler = wrap(handlerModule.handler);
    return await wrappedHandler(req, res);
    
  } catch (err) {
    console.error(`[Universal Gateway] Routing failure for: ${funcName}`, err);
    
    res.status(404).json({ 
      error: "Legacy function not found or initialization failed",
      target: funcName,
      timestamp: new Date().toISOString()
    });
  }
};
