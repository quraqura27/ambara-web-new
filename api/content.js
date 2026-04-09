const { wrap } = require('./_adapter');
const { handler } = require('../netlify/functions/content');
module.exports = wrap(handler);

