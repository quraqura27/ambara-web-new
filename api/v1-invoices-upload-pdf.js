const { wrap } = require('./_adapter');
const { handler } = require('../netlify/functions/v1-invoices-upload-pdf');
module.exports = wrap(handler);

module.exports.config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
};
