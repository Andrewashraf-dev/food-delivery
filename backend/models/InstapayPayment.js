const { query } = require('../db/pool');
const Order = require('./Order');

const InstapayPayment = {
  // Create instapay payment record
  async create({ orderId, screenshotPath, userNotes = null }) {
    const { rows } = await query(
      `INSERT INTO instapay_payments (order_id, screenshot_path, payment_status, user_notes)
       VALUES ($1, $2, 'pending', $3)
       RETURNING id, order_id, screenshot_path, payment_status, user_notes, created_at`,
      [orderId, screenshotPath, userNotes]
    );
    return rows[0];
  },

  // Get payment by ID
  async findById(id) {
    const { rows } = await query(
      `SELECT id, order_id, screenshot_path, payment_status, admin_notes, user_notes, created_at, updated_at
       FROM instapay_payments
       WHERE id = $1`,
      [id]
    );
    return rows[0];
  },

  // Get payment by order ID
  async findByOrderId(orderId) {
    const { rows } = await query(
      `SELECT id, order_id, screenshot_path, payment_status, admin_notes, user_notes, created_at
       FROM instapay_payments
       WHERE order_id = $1`,
      [orderId]
    );
    return rows[0];
  },

  // Get all pending payments (admin view)
  async getPending() {
    const { rows } = await query(
      `SELECT p.id, p.order_id, p.screenshot_path, p.payment_status, p.user_notes, p.created_at,
              o.order_number, o.customer_name, o.customer_phone, o.total
       FROM instapay_payments p
       JOIN orders o ON p.order_id = o.id
       WHERE p.payment_status = 'pending'
       ORDER BY p.created_at DESC`
    );
    return rows;
  },

  // Update payment status (admin only)
  async updateStatus({ id, status, adminNotes = null }) {
    const { rows } = await query(
      `UPDATE instapay_payments
       SET payment_status = $1, admin_notes = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING id, order_id, payment_status, admin_notes`,
      [status, adminNotes, id]
    );
    
    // Update order payment_status and sync kitchen-facing order status for live orders
    if (rows[0]) {
      const orderId = rows[0].order_id;
      const orderPaymentStatus = status === 'approved' ? 'paid' : status === 'rejected' ? 'failed' : 'pending';
      await query(
        `UPDATE orders SET payment_status = $1, updated_at = NOW() WHERE id = $2`,
        [orderPaymentStatus, orderId]
      );
      if (status === 'approved') {
        await Order.updateStatus(orderId, 'confirmed', 'instapay_accepted');
      } else if (status === 'rejected') {
        await Order.updateStatus(orderId, 'cancelled', 'instapay_rejected');
      }
    }

    return rows[0];
  }
};

module.exports = InstapayPayment;
