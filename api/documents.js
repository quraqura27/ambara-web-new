const { wrap } = require('./_adapter');
const { handler } = require('../netlify/functions/documents');
module.exports = wrap(handler);

module.exports.config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
};
