const { query } = require('../db/pool');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = {
  async findById(id) {
    const { rows } = await query('SELECT * FROM users WHERE id = $1', [id]);
    return rows[0] || null;
  },

  async findByEmail(email) {
    const { rows } = await query('SELECT * FROM users WHERE email = $1', [email]);
    return rows[0] || null;
  },

  async findByPhone(phone) {
    if (!phone || typeof phone !== 'string') return null;
    const normalized = phone.replace(/\s/g, '');
    const { rows } = await query(
      `SELECT * FROM users WHERE phone = $1 OR REPLACE(phone, ' ', '') = $2`,
      [phone, normalized]
    );
    return rows[0] || null;
  },

  async create({ name, email, password, phone, role = 'customer' }) {
    const hashed = await bcrypt.hash(password, 12);
    const { rows } = await query(
      `INSERT INTO users (name, email, password, phone, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, phone, role, is_active, created_at`,
      [name, email || null, hashed, phone || null, role]
    );
    return rows[0];
  },

  async update(id, fields) {
    const allowed = ['name', 'phone', 'street', 'city', 'area', 'email'];
    const sets = [];
    const vals = [];
    let i = 1;
    for (const [k, v] of Object.entries(fields)) {
      if (allowed.includes(k)) {
        sets.push(`${k} = $${i++}`);
        vals.push(v);
      }
    }
    if (!sets.length) return this.findById(id);
    vals.push(id);
    const { rows } = await query(
      `UPDATE users SET ${sets.join(', ')} WHERE id = $${i} RETURNING id, name, email, phone, street, city, area, role`,
      vals
    );
    return rows[0];
  },

  async comparePassword(plain, hashed) {
    return bcrypt.compare(plain, hashed);
  },

  generateToken(user) {
    return jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });
  },

  // Format user for API response (strip password)
  safe(user) {
    if (!user) return null;
    const { password, ...safe } = user;
    // map address fields to nested object
    safe.address = { street: user.street, city: user.city, area: user.area };
    return safe;
  },
};

module.exports = User;
