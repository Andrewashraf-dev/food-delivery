const express = require('express');
const rateLimit = require('express-rate-limit');

const router = express.Router();

const geocodeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 40,
  message: { success: false, error: 'Too many address lookups. Try again in a minute.' },
});

/**
 * Proxy to Nominatim (OpenStreetMap) with Egypt bias.
 * Query: q (required), biasLat / biasLng (optional, from delivery region center).
 */
router.get('/', geocodeLimiter, async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (q.length < 3 || q.length > 400) {
    return res.status(400).json({ success: false, error: 'Invalid address query.' });
  }

  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '1');
  url.searchParams.set('q', q);
  url.searchParams.set('countrycodes', 'eg');
  url.searchParams.set('addressdetails', '1');

  const biasLat = parseFloat(String(req.query.biasLat ?? ''), 10);
  const biasLng = parseFloat(String(req.query.biasLng ?? ''), 10);
  if (Number.isFinite(biasLat) && Number.isFinite(biasLng)) {
    const d = 0.08;
    const left = biasLng - d;
    const top = biasLat + d;
    const right = biasLng + d;
    const bottom = biasLat - d;
    url.searchParams.set('viewbox', `${left},${top},${right},${bottom}`);
    url.searchParams.set('bounded', '0');
  }

  const ua =
    process.env.NOMINATIM_USER_AGENT ||
    'FrescoEgypt/1.0 (delivery checkout; https://frescoegypt.com)';

  const preferAr = String(req.query.lang || '')
    .toLowerCase()
    .startsWith('ar');
  const acceptLanguage = preferAr
    ? 'ar-EG,ar;q=0.9,en;q=0.7'
    : 'en-US,en;q=0.9,ar;q=0.8';

  try {
    const r = await fetch(url.toString(), {
      headers: {
        'User-Agent': ua,
        'Accept-Language': acceptLanguage,
      },
    });
    if (!r.ok) {
      return res.status(502).json({ success: false, error: 'Address lookup failed.' });
    }
    const rows = await r.json();
    const first = Array.isArray(rows) && rows[0];
    if (!first || !first.lat || !first.lon) {
      return res.json({ success: true, data: null });
    }
    const lat = parseFloat(first.lat, 10);
    const lng = parseFloat(first.lon, 10);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.json({ success: true, data: null });
    }
    return res.json({
      success: true,
      data: {
        lat,
        lng,
        label: first.display_name || q,
        displayName: first.display_name || '',
        address: first.address || null,
      },
    });
  } catch (e) {
    console.error('geocode:', e.message);
    return res.status(502).json({ success: false, error: 'Address lookup failed.' });
  }
});

module.exports = router;
