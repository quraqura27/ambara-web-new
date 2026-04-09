const { wrap } = require('./_adapter');
const { handler } = require('../netlify/functions/v1-awbs-upload');
module.exports = wrap(handler);

// Vercel config: increase body size limit for PDF uploads (base64)
module.exports.config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
};
