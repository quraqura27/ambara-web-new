const { wrap } = require('./_adapter');
const { handler } = require('../netlify/functions/submit-quote');
module.exports = wrap(handler);

