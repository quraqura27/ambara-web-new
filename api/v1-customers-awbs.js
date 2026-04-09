const { wrap } = require('./_adapter');
const { handler } = require('../netlify/functions/v1-customers-awbs');
module.exports = wrap(handler);

