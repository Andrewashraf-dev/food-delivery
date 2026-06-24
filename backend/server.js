const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const { rateLimit } = require('express-rate-limit');
require('dotenv').config();

const { pool } = require('./db/pool');
const app = express();

const isProd = process.env.NODE_ENV === 'production';

// --- 1. IMPORT ROUTERS ---
// ⚡ Moving these to the top prevents the "Object instead of Middleware" crash
const authRoutes = require('./routes/auth');
const menuRoutes = require('./routes/menu');
const orderRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');
const contactRoutes = require('./routes/contact');
const deliveryRegionRoutes = require('./routes/deliveryRegions');
const paymentRoutes = require('./routes/payments');
const configRoutes = require('./routes/config');
const geocodeRoutes = require('./routes/geocode');

// --- 2. SECURITY & MIDDLEWARE ---
app.use(helmet());
app.use(cors({
  origin: isProd
    ? ['https://frescoegypt.com', 'https://www.frescoegypt.com']
    : ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000'],
  credentials: true,
}));

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// Serve public directory for uploaded files
app.use(express.static(path.join(__dirname, '../public')));

// --- 3. RATE LIMITING ---

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 100 : 1000,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

const orderLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isProd ? 10 : 1000,
  message: { success: false, message: 'Order limit reached. Please try again later.' },
  skip: (req) => !isProd // ⚡ Completely disabled in dev mode for your testing
});

// 🔐 CRITICAL FIX #4: Rate limiting on auth endpoints to prevent brute force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isProd ? 5 : 100, // 5 attempts in production
  message: { success: false, error: 'Too many login attempts. Please try again in 15 minutes.' },
  skip: (req) => !isProd, // Disabled in dev mode
  keyGenerator: (req) => req.ip || req.connection.remoteAddress // Rate limit by IP
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: isProd ? 3 : 100, // 3 registration attempts in production
  message: { success: false, error: 'Too many registration attempts. Please try again in 1 hour.' },
  skip: (req) => !isProd, // Disabled in dev mode
  keyGenerator: (req) => req.ip || req.connection.remoteAddress
});

// --- 4. APPLY ROUTES ---
app.use('/api/', limiter); // Apply general limit to all /api routes

app.use('/api/auth/login', authLimiter); // 🔐 Apply strict auth limits
app.use('/api/auth/register', registerLimiter); // 🔐 Apply strict registration limits
app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderLimiter, orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/delivery-regions', deliveryRegionRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/config', configRoutes);
app.use('/api/geocode', geocodeRoutes);

// --- 5. UTILITY & ERRORS ---

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ 
      success: true, 
      message: 'Fresco API is running 🍗', 
      db: 'PostgreSQL ✅', 
      env: process.env.NODE_ENV || 'development' 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'DB connection error' });
  }
});

app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

app.use((err, req, res, next) => {
  console.error('💥 SERVER ERROR:', err.message);
  res.status(err.statusCode || 500).json({ 
    success: false, 
    message: err.message || 'Internal Server Error' 
  });
});

// --- 6. START ---
const PORT = process.env.PORT || 5000;
pool.query('SELECT NOW()')
  .then(() => {
    console.log('✅ PostgreSQL connected');
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('❌ PostgreSQL connection error:', err.message);
    process.exit(1);
  });

module.exports = app;