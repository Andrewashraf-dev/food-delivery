const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const multer = require('multer');
const InstapayPayment = require('../models/InstapayPayment');
const Order = require('../models/Order');
const { protect, adminOnly } = require('../middleware/auth');

// Setup multer for file uploads
const uploadsDir = path.join(__dirname, '../../public/instapay');
const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `instapay-${timestamp}${ext}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files allowed'));
    }
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 }
});

// Ensure directory exists
async function ensureDir() {
  try {
    await fs.mkdir(uploadsDir, { recursive: true });
  } catch (err) {
    console.error('Failed to create uploads directory:', err);
  }
}
ensureDir();

// Upload screenshot
router.post('/upload-screenshot', protect, upload.single('screenshot'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No screenshot' });
    }

    const { orderId, userNotes } = req.body;
    if (!orderId) {
      await fs.unlink(req.file.path).catch(() => {});
      return res.status(400).json({ success: false, error: 'Order ID required' });
    }

    const screenshotPath = `/instapay/${req.file.filename}`;
    const payment = await InstapayPayment.create({
      orderId: parseInt(orderId, 10),
      screenshotPath,
      userNotes: userNotes || null,
    });

    await Order.setInstapayScreenshotId(parseInt(orderId, 10), payment.id);

    res.json({
      success: true,
      message: 'Screenshot uploaded',
      data: payment,
    });
  } catch (err) {
    if (req.file?.path) {
      await fs.unlink(req.file.path).catch(() => {});
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get all pending (admin only) — before /:id
router.get('/admin/pending', protect, adminOnly, async (req, res) => {
  try {
    const payments = await InstapayPayment.getPending();
    res.json({ success: true, data: payments });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update payment status (admin only)
router.put('/:id/status', protect, adminOnly, async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }

    const payment = await InstapayPayment.updateStatus({
      id: parseInt(req.params.id),
      status,
      adminNotes
    });

    res.json({ success: true, data: payment });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get payment by ID (public — optional; keep after admin routes)
router.get('/:id', async (req, res) => {
  try {
    const payment = await InstapayPayment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ success: false, error: 'Payment not found' });
    }
    res.json({ success: true, data: payment });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
