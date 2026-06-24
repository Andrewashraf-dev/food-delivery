const express = require('express');

const router = express.Router();

// Public storefront config (no secrets)
router.get('/public', (req, res) => {
  res.json({
    success: true,
    data: {
      instapayPhone: process.env.INSTAPAY_OWNER_PHONE || process.env.OWNER_PHONE || '',
      mapDefaultLat: parseFloat(process.env.DEFAULT_MAP_LAT || '30.059', 10),
      mapDefaultLng: parseFloat(process.env.DEFAULT_MAP_LNG || '31.239', 10),
    },
  });
});

module.exports = router;
