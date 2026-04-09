const { wrap } = require('./_adapter');
const { handler } = require('../netlify/functions/v1-awbs-unmark');
module.exports = wrap(handler);

