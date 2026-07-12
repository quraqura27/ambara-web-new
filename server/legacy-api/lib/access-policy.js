function actionValue(event) {
  return String(event?.queryStringParameters?.action || '').trim().toLowerCase();
}

function isPublicRequest(targetFunc, event) {
  const action = actionValue(event);
  const method = String(event?.httpMethod || 'GET').toUpperCase();
  if (method === 'OPTIONS') return true;
  if (['ping', 'public-stats', 'sitemap', 'submit-contact', 'submit-quote', 'track-shipment'].includes(targetFunc)) return true;
  if (targetFunc === 'content' && method === 'GET') return true;
  if (targetFunc === 'blog-api' && method === 'GET' && ['list', 'post', ''].includes(action)) return true;
  if (targetFunc === 'blog-api' && action === 'auto-publish') return true;
  if (targetFunc === 'client-api' && action !== 'set-password') return true;
  return false;
}

function deny(status, message) {
  return { allowed: false, message, status };
}

async function authorizeLegacyRequest(targetFunc, event) {
  const action = actionValue(event);
  if (String(event?.httpMethod || '').toUpperCase() === 'OPTIONS') return { allowed: true };
  if ([
    'auth',
    'awbs',
    'customers',
    'documents',
    'quotes',
    'shipments',
    'v1-awbs-mark-invoiced',
    'v1-awbs-parse',
    'v1-awbs-unmark',
    'v1-awbs-update',
    'v1-awbs-upload',
    'v1-customers-awbs',
    'v1-customers-search',
    'v1-invoices-upload-pdf',
    'v1-invoices',
    'v1-notifications',
  ].includes(targetFunc)) return deny(410, 'This legacy staff API is retired. Use the native portal.');
  if (targetFunc === 'content' && String(event?.httpMethod || 'GET').toUpperCase() !== 'GET') {
    return deny(410, 'Legacy content management is retired.');
  }
  if (targetFunc === 'blog-api' && !isPublicRequest(targetFunc, event)) {
    return deny(410, 'Legacy blog management is retired.');
  }
  if (targetFunc === 'client-api' && action === 'set-password') {
    return deny(410, 'Legacy customer credential management is retired. Use the native portal.');
  }
  if (isPublicRequest(targetFunc, event)) return { allowed: true };
  return deny(404, 'Handler not found');
}

module.exports = { authorizeLegacyRequest, isPublicRequest };
