const { wrap } = require('./_adapter');
const { handler } = require('../netlify/functions/v1-notifications');
module.exports = wrap(handler);

