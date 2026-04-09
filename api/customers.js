const { wrap } = require('./_adapter');
const { handler } = require('../netlify/functions/customers');
module.exports = wrap(handler);

