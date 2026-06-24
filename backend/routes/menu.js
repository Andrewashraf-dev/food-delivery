const express = require('express');
const router = express.Router();
const MenuItem = require('../models/MenuItem');
const { protect, adminOnly } = require('../middleware/auth');
const { getRequestLang } = require('../utils/locale');

// GET /api/menu
router.get('/', async (req, res) => {
  try {
    getRequestLang(req);
    const items = await MenuItem.findAll({
      category: req.query.category,
      featured: req.query.featured,
    });
    res.json({
      success: true,
      count: items.length,
      data: items,
      grouped: MenuItem.groupByCategory(items),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/menu/:id/related — must be before /:id
router.get('/:id/related', async (req, res) => {
  try {
    getRequestLang(req);
    const base = await MenuItem.findRawById(req.params.id);
    if (!base) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }
    const data = await MenuItem.findRelated({
      category: base.category,
      excludeId: base.id,
      limit: parseInt(req.query.limit, 10) || 4,
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/menu/:id
router.get('/:id', async (req, res) => {
  try {
    getRequestLang(req);
    const item = await MenuItem.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
    res.json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/menu — admin only
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const item = await MenuItem.create(req.body);
    res.status(201).json({ success: true, data: item });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT /api/menu/:id — admin only
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const item = await MenuItem.update(req.params.id, req.body);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
    res.json({ success: true, data: item });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE /api/menu/:id — admin only
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const deleted = await MenuItem.delete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Item not found' });
    res.json({ success: true, message: 'Item deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
