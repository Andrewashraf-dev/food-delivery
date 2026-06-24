const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');

// POST /api/contact
router.post('/', [
  body('name').notEmpty().withMessage('Name required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('message').notEmpty().isLength({ min: 10 }).withMessage('Message must be at least 10 characters'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  // In production, send email via nodemailer
  const { name, email, subject, message } = req.body;
  console.log(`📩 Contact form from ${name} <${email}>: ${subject} - ${message}`);

  res.json({ success: true, message: 'Message received! We will get back to you shortly.' });
});

module.exports = router;
