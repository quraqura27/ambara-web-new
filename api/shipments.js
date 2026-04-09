const { wrap } = require('./_adapter');
const { handler } = require('../netlify/functions/shipments');
module.exports = wrap(handler);

