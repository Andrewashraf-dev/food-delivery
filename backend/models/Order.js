const { query, getClient } = require('../db/pool');

const Order = {
  async create({
    customerInfo,
    items,
    subtotal,
    deliveryFee,
    total,
    paymentMethod,
    paymentStatus = 'pending',
    orderType,
    notes,
    customNotes,
    userId,
    deliveryRegionId,
    deliveryLat,
    deliveryLng,
  }) {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      const sequenceResult = await client.query("SELECT nextval('order_number_seq') as number");
      const sequentialNumber = sequenceResult.rows[0].number;
      const orderNumber = `fre${sequentialNumber}`;

      const payMethod = String(paymentMethod).toLowerCase();
      const payStatus =
        payMethod === 'cod' ? 'pending' : payMethod === 'instapay' ? 'pending' : paymentStatus;

      const { rows: [order] } = await client.query(
        `INSERT INTO orders
           (order_number, user_id, customer_name, customer_email, customer_phone,
            delivery_region_id, delivery_street, delivery_city, delivery_area,
            delivery_location_lat, delivery_location_lng,
            subtotal, delivery_fee,
            total, payment_method, payment_status, order_type, notes, custom_notes, order_status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,'placed')
         RETURNING *`,
        [
          orderNumber,
          userId || null,
          customerInfo.name,
          customerInfo.email || null,
          customerInfo.phone,
          deliveryRegionId || null,
          customerInfo.address?.street || null,
          customerInfo.address?.city || 'Cairo',
          customerInfo.address?.area || null,
          deliveryLat != null ? Number(deliveryLat) : null,
          deliveryLng != null ? Number(deliveryLng) : null,
          subtotal,
          deliveryFee,
          total,
          payMethod,
          payStatus,
          orderType,
          notes || null,
          customNotes || null,
        ]
      );

      for (const item of items) {
        await client.query(
          `INSERT INTO order_items (order_id, menu_item_id, name, price, quantity, subtotal, combo_selection, custom_notes)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [
            order.id,
            item.menuItem || null,
            item.name,
            item.price,
            item.quantity,
            item.subtotal,
            item.comboSelection || null,
            item.customNotes || null,
          ]
        );
      }

      await client.query('COMMIT');
      return order;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async updateStatus(id, orderStatus, historyNote = null) {
    const { rows } = await query(
      `UPDATE orders SET order_status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [orderStatus, id]
    );
    if (rows[0]) {
      await query(
        `INSERT INTO order_status_history (order_id, status, note) VALUES ($1, $2, $3)`,
        [id, orderStatus, historyNote]
      );
    }
    return rows[0];
  },

  async getStatusHistory(orderId) {
    const { rows } = await query(
      `SELECT id, status, note, created_at FROM order_status_history WHERE order_id = $1 ORDER BY created_at ASC`,
      [orderId]
    );
    return rows;
  },

  async findAll() {
    const { rows } = await query(
      `SELECT o.*,
       (SELECT json_agg(oi.*) FROM order_items oi WHERE oi.order_id = o.id) AS items
       FROM orders o ORDER BY o.created_at DESC LIMIT 100`
    );
    return rows;
  },

  async findByUserId(userId) {
    const { rows } = await query(
      `SELECT o.*,
       (SELECT json_agg(oi.*) FROM order_items oi WHERE oi.order_id = o.id) AS items
       FROM orders o WHERE o.user_id = $1 ORDER BY o.created_at DESC`,
      [userId]
    );
    return rows;
  },

  async findById(orderId) {
    const { rows } = await query(
      `SELECT o.*,
       (SELECT json_agg(oi.*) FROM order_items oi WHERE oi.order_id = o.id) AS items
       FROM orders o WHERE o.id = $1`,
      [orderId]
    );
    return rows[0];
  },

  async findByNumber(orderNumber) {
    const { rows } = await query(
      `SELECT o.*,
       (SELECT json_agg(oi.*) FROM order_items oi WHERE oi.order_id = o.id) AS items
       FROM orders o WHERE o.order_number = $1`,
      [orderNumber]
    );
    return rows[0];
  },

  async stats() {
    const [total, today, pending, revenue, users, menu] = await Promise.all([
      query('SELECT COUNT(*) FROM orders'),
      query('SELECT COUNT(*) FROM orders WHERE created_at >= CURRENT_DATE'),
      query("SELECT COUNT(*) FROM orders WHERE order_status NOT IN ('delivered', 'cancelled')"),
      query("SELECT SUM(total) FROM orders WHERE order_status != 'cancelled'"),
      query('SELECT COUNT(*) FROM users'),
      query('SELECT COUNT(*) FROM menu_items'),
    ]);

    return {
      totalOrders: parseInt(total.rows[0].count) || 0,
      todayOrders: parseInt(today.rows[0].count) || 0,
      pendingOrders: parseInt(pending.rows[0].count) || 0,
      totalRevenue: parseFloat(revenue.rows[0].sum) || 0,
      totalUsers: parseInt(users.rows[0].count) || 0,
      totalMenuItems: parseInt(menu.rows[0].count) || 0,
    };
  },

  async setInstapayScreenshotId(orderId, paymentId) {
    const { rows } = await query(
      `UPDATE orders SET instapay_screenshot_id = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [paymentId, orderId]
    );
    return rows[0];
  },
};

module.exports = Order;
