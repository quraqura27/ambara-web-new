const { wrap } = require('./_adapter');
const { handler } = require('../netlify/functions/awbs');
module.exports = wrap(handler);

