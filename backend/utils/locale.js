/**
 * Resolve request language: X-Language / X-Lang → Accept-Language → ?lang= → en
 */
function getRequestLang(req) {
  const xl = req.headers['x-language'] || req.headers['x-lang'];
  if (xl === 'ar' || xl === 'en') return xl;

  const accept = req.headers['accept-language'];
  if (accept && typeof accept === 'string') {
    const first = accept.split(',')[0].trim().toLowerCase();
    if (first.startsWith('ar')) return 'ar';
    if (first.startsWith('en')) return 'en';
  }

  if (req.query && req.query.lang === 'ar') return 'ar';
  return 'en';
}

module.exports = { getRequestLang };
