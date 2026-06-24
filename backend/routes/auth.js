const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const sendToken = (user, statusCode, res) => {
  const token = User.generateToken(user);
  res.status(statusCode).json({ success: true, token, user: User.safe(user) });
};

const phoneValidators = [
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^[\d+\s\-()]+$/)
    .withMessage('Invalid phone format'),
];

// POST /api/auth/register — phone + password; email optional
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    ...phoneValidators,
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('email').optional({ values: 'falsy' }).isEmail().withMessage('Valid email required if provided'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    try {
      const { name, email, password, phone } = req.body;
      const digits = String(phone).replace(/\D/g, '');
      if (digits.length < 10) {
        return res.status(400).json({ success: false, message: 'Phone number is too short' });
      }
      const existingPhone = await User.findByPhone(phone);
      if (existingPhone) {
        return res.status(400).json({ success: false, message: 'This phone number is already registered' });
      }
      if (email) {
        const existingEmail = await User.findByEmail(email);
        if (existingEmail) {
          return res.status(400).json({ success: false, message: 'Email already registered' });
        }
      }
      const user = await User.create({ name, email: email || null, password, phone });
      sendToken(user, 201, res);
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

// POST /api/auth/login — identifier (phone OR email) + password
router.post(
  '/login',
  [
    body('identifier').trim().notEmpty().withMessage('Phone or email is required'),
    body('password').notEmpty().withMessage('Password required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    try {
      const { identifier, password } = req.body;
      const id = String(identifier).trim();
      const user = id.includes('@') ? await User.findByEmail(id) : await User.findByPhone(id);

      if (!user || !(await User.comparePassword(password, user.password))) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }
      sendToken(user, 200, res);
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

// GET /api/auth/me
router.get('/me', protect, (req, res) => {
  res.json({ success: true, user: req.user });
});

// PUT /api/auth/profile
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, phone, email, address } = req.body;
    const fields = {};
    if (name !== undefined) fields.name = name;
    if (phone !== undefined) fields.phone = phone;
    if (address?.street !== undefined) fields.street = address.street;
    if (address?.city !== undefined) fields.city = address.city;
    if (address?.area !== undefined) fields.area = address.area;
    if (email !== undefined) {
      const e = email === '' ? null : email;
      if (e) {
        const existing = await User.findByEmail(e);
        if (existing && existing.id !== req.user.id) {
          return res.status(400).json({ success: false, message: 'Email already in use' });
        }
      }
      fields.email = e;
    }
    const updated = await User.update(req.user.id, fields);
    res.json({ success: true, user: User.safe(updated) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
