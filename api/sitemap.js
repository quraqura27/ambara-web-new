const { wrap } = require('./_adapter');
const { handler } = require('../netlify/functions/sitemap');
module.exports = wrap(handler);

