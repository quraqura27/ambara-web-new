const { wrap } = require('./_adapter');
const { handler } = require('../netlify/functions/v1-invoices');
module.exports = wrap(handler);

