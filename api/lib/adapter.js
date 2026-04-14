// Netlify-to-Vercel Adapter
// Wraps a Netlify Function handler (event => response) to work with Vercel's (req, res) API.

function wrap(netlifyHandler, forcedFuncName) {
  return async (req, res) => {
    // Build Netlify-compatible event object from Vercel's req
    const queryStringParameters = req.query || {};

    // Vercel auto-parses JSON bodies; Netlify expects a string
    let body = null;
    if (req.body !== undefined && req.body !== null) {
      body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    }

    // Build a Netlify-compatible `path`.
    const urlPath = req.url?.split('?')[0] || '';
    // Use the forced function name if provided, otherwise derive from URL
    const funcName = forcedFuncName || urlPath.replace(/^\/api\//, '').split('/')[0];

    const event = {
      httpMethod: req.method,
      headers: req.headers,
      queryStringParameters,
      body,
      path: `/.netlify/functions/${funcName}`,
      rawUrl: `https://${req.headers.host || 'localhost'}${req.url}`,
      isBase64Encoded: false,
    };

    try {
      const result = await netlifyHandler(event);

      // Set response headers
      if (result.headers) {
        Object.entries(result.headers).forEach(([key, value]) => {
          res.setHeader(key, String(value));
        });
      }

      res.status(result.statusCode || 200).send(result.body || '');
    } catch (error) {
      console.error('Function error:', error);
      res.status(500).json({ error: error.message });
    }
  };
}

module.exports = { wrap };

