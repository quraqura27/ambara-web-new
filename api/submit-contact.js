const { wrap } = require('./_adapter');
const { handler } = require('../netlify/functions/submit-contact');
module.exports = wrap(handler);

