const { wrap } = require('./_adapter');
const { handler } = require('../netlify/functions/track-shipment');
module.exports = wrap(handler);

