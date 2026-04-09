const { wrap } = require('./_adapter');
const { handler } = require('../netlify/functions/public-stats');
module.exports = wrap(handler);

