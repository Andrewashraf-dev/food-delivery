const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const { protect, adminOnly } = require('../middleware/auth');
const { query } = require('../db/pool');

function formatAdminOrder(r) {
  return {
    id: r.id,
    orderNumber: r.order_number,
    orderStatus: r.order_status,
    paymentMethod: r.payment_method,
    paymentStatus: r.payment_status,
    customerInfo: {
      name: r.customer_name,
      phone: r.customer_phone,
      email: r.customer_email,
      address: r.delivery_street,
    },
    total: r.total,
    created_at: r.created_at,
    items: Array.isArray(r.items) ? r.items : [],
  };
}

// 🔐 CRITICAL FIX #2: Validate order status to prevent invalid statuses
const VALID_ORDER_STATUSES = ['placed', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];

const validateOrderStatus = (status) => {
  if (!status || typeof status !== 'string') {
    return { valid: false, error: 'Order status is required' };
  }
  if (!VALID_ORDER_STATUSES.includes(status.toLowerCase())) {
    return {
      valid: false,
      error: `Invalid status "${status}". Must be one of: ${VALID_ORDER_STATUSES.join(', ')}`
    };
  }
  return { valid: true };
};

router.use(protect, adminOnly);

router.get('/dashboard', async (req, res) => {
  try {
    const stats = await Order.stats();
    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 🔐 CRITICAL FIX #7: Add pagination to prevent performance issues with large datasets
router.get('/orders', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100); // Max 100 per page

    if (page < 1) {
      return res.status(400).json({ success: false, error: 'Page must be >= 1' });
    }

    // Get total count
    const countResult = await query('SELECT COUNT(*) as total FROM orders');
    const total = parseInt(countResult.rows[0].total);

    // Get paginated orders
    const offset = (page - 1) * limit;
    const { rows } = await query(
      `SELECT o.*,
              json_agg(oi.*) as items
       FROM orders o
       LEFT JOIN order_items oi ON oi.order_id = o.id
       GROUP BY o.id
       ORDER BY o.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const formatted = rows.map((r) => formatAdminOrder(r));

    res.json({
      success: true,
      data: formatted,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (err) {
    console.error('Admin orders error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch orders' });
  }
});

router.get('/orders/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ success: false, error: 'Invalid order id' });
    }
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    const statusHistory = await Order.getStatusHistory(id);
    res.json({
      success: true,
      data: { ...formatAdminOrder(order), statusHistory },
    });
  } catch (err) {
    console.error('Admin order detail error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch order' });
  }
});

router.put('/orders/:id/status', async (req, res) => {
  try {
    const { orderStatus } = req.body;

    // 🔐 Validate status before updating
    const validation = validateOrderStatus(orderStatus);
    if (!validation.valid) {
      return res.status(400).json({ success: false, error: validation.error });
    }

    // Get current order first
    const currentOrder = await Order.findById(parseInt(req.params.id));
    if (!currentOrder) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    // Update with validated, lowercase status
    const updatedOrder = await Order.updateStatus(req.params.id, orderStatus.toLowerCase());
    if (!updatedOrder) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    res.json({ success: true, data: updatedOrder });
  } catch (err) {
    console.error('Status update error:', err);
    res.status(500).json({ success: false, error: 'Failed to update status' });
  }
});

module.exports = router;