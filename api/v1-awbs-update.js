const { wrap } = require('./_adapter');
const { handler } = require('../netlify/functions/v1-awbs-update');
module.exports = wrap(handler);

