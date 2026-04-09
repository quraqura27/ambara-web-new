const { wrap } = require('./_adapter');
const { handler } = require('../netlify/functions/auth');
module.exports = wrap(handler);

