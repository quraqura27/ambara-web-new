const { wrap } = require('./_adapter');
const { handler } = require('../netlify/functions/blog-api');
module.exports = wrap(handler);

