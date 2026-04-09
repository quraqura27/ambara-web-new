const { wrap } = require('./_adapter');
const { handler } = require('../netlify/functions/quotes');
module.exports = wrap(handler);

