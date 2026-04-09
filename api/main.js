const { wrap } = require('./_adapter');

const routes = {
  'auth': require('../netlify/functions/auth').handler,
  'awbs': require('../netlify/functions/awbs').handler,
  'blog-api': require('../netlify/functions/blog-api').handler,
  'client-api': require('../netlify/functions/client-api').handler,
  'content': require('../netlify/functions/content').handler,
  'customers': require('../netlify/functions/customers').handler,
  'documents': require('../netlify/functions/documents').handler,
  'public-stats': require('../netlify/functions/public-stats').handler,
  'quotes': require('../netlify/functions/quotes').handler,
  'shipments': require('../netlify/functions/shipments').handler,
  'sitemap': require('../netlify/functions/sitemap').handler,
  'submit-contact': require('../netlify/functions/submit-contact').handler,
  // submit-quote exports submit-contact, so .handler is available
  'submit-quote': require('../netlify/functions/submit-quote').handler,
  'track-shipment': require('../netlify/functions/track-shipment').handler,
  'v1-awbs-mark-invoiced': require('../netlify/functions/v1-awbs-mark-invoiced').handler,
  'v1-awbs-parse': require('../netlify/functions/v1-awbs-parse').handler,
  'v1-awbs-unmark': require('../netlify/functions/v1-awbs-unmark').handler,
  'v1-awbs-update': require('../netlify/functions/v1-awbs-update').handler,
  'v1-awbs-upload': require('../netlify/functions/v1-awbs-upload').handler,
  'v1-customers-awbs': require('../netlify/functions/v1-customers-awbs').handler,
  'v1-customers-search': require('../netlify/functions/v1-customers-search').handler,
  'v1-invoices-upload-pdf': require('../netlify/functions/v1-invoices-upload-pdf').handler,
  'v1-invoices': require('../netlify/functions/v1-invoices').handler,
  'v1-notifications': require('../netlify/functions/v1-notifications').handler,
};

module.exports = async (req, res) => {
  const urlPath = req.url.split('?')[0];

  // Route: Language Redirect (Root or empty path)
  if (urlPath === '/' || urlPath === '') {
    const acceptLang = (req.headers['accept-language'] || '').toLowerCase();
    const isIndonesian = acceptLang.startsWith('id') || /^[^,]*\bid\b/.test(acceptLang.split(',')[0]);
    const target = isIndonesian ? '/id/' : '/en/';
    res.writeHead(302, { Location: target, 'Cache-Control': 'no-cache' });
    return res.end();
  }

  // Route: Sitemap
  if (urlPath === '/sitemap.xml') {
    const handler = routes['sitemap'];
    return wrap(handler)(req, res);
  }

  // Route: API
  // Extract function name from /api/name or /api/v1-name or /api/v1/name
  let funcName = null;

  if (urlPath.startsWith('/api/v1/')) {
    const action = urlPath.replace('/api/v1/', '').split('/')[0];
    funcName = `v1-${action}`;
  } else if (urlPath.startsWith('/api/v1-')) {
    funcName = urlPath.replace('/api/', '').split('/')[0];
  } else if (urlPath.startsWith('/api/')) {
    funcName = urlPath.replace('/api/', '').split('/')[0];
  }

  if (!funcName || !routes[funcName]) {
    res.status(404).json({ error: 'Function not found', path: urlPath, funcName });
    return;
  }

  // Handle the request using our adapter
  const handler = routes[funcName];
  return wrap(handler)(req, res);
};

// Vercel config for the entire gateway to allow large PDF uploads
module.exports.config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
};
