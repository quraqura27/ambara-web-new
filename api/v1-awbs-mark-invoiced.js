const { wrap } = require('./_adapter');
const { handler } = require('../netlify/functions/v1-awbs-mark-invoiced');
module.exports = wrap(handler);

