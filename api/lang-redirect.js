// Language-based redirect — replaces Netlify's conditions-based redirect
module.exports = (req, res) => {
  const acceptLang = (req.headers['accept-language'] || '').toLowerCase();
  // Check if Indonesian is the primary language
  const isIndonesian = acceptLang.startsWith('id') || /^[^,]*\bid\b/.test(acceptLang.split(',')[0]);
  const target = isIndonesian ? '/id/' : '/en/';
  res.writeHead(302, { Location: target, 'Cache-Control': 'no-cache' });
  res.end();
};
