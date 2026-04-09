const { wrap } = require('./_adapter');
const { handler } = require('../netlify/functions/v1-customers-search');
module.exports = wrap(handler);

