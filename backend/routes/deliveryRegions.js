const express = require('express');
const router = express.Router();
const DeliveryRegion = require('../models/DeliveryRegion');
const { adminOnly } = require('../middleware/auth');

// Get all active delivery regions
router.get('/', async (req, res) => {
  try {
    const regions = await DeliveryRegion.findAll();
    res.json({
      success: true,
      data: regions,
      count: regions.length
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get region by ID
router.get('/:id', async (req, res) => {
  try {
    const region = await DeliveryRegion.findById(req.params.id);
    if (!region) {
      return res.status(404).json({ success: false, error: 'Region not found' });
    }
    res.json({ success: true, data: region });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get delivery fee for region
router.get('/:id/fee', async (req, res) => {
  try {
    const fee = await DeliveryRegion.getFee(req.params.id);
    res.json({ success: true, fee });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get estimated time for region
router.get('/:id/time', async (req, res) => {
  try {
    const minutes = await DeliveryRegion.getEstimatedTime(req.params.id);
    res.json({ success: true, estimatedMinutes: minutes });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
