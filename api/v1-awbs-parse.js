const { wrap } = require('./_adapter');
const { handler } = require('../netlify/functions/v1-awbs-parse');
module.exports = wrap(handler);

