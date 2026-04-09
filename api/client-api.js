const { wrap } = require('./_adapter');
const { handler } = require('../netlify/functions/client-api');
module.exports = wrap(handler);

