const { query } = require('../db/pool');

const ProductCustomization = {
  // Get combos for a product
  async findByProductId(productId) {
    const { rows } = await query(
      `SELECT id, menu_item_id, combo_name, combo_name_ar, price_add, is_active
       FROM product_customizations
       WHERE menu_item_id = $1 AND is_active = TRUE
       ORDER BY price_add ASC`,
      [productId]
    );
    return rows;
  },

  // Get combo by ID
  async findById(id) {
    const { rows } = await query(
      `SELECT id, menu_item_id, combo_name, combo_name_ar, price_add
       FROM product_customizations
       WHERE id = $1 AND is_active = TRUE`,
      [id]
    );
    return rows[0];
  },

  // Create combo (admin only)
  async create({ menuItemId, comboName, comboNameAr, priceAdd }) {
    const { rows } = await query(
      `INSERT INTO product_customizations (menu_item_id, combo_name, combo_name_ar, price_add, is_active)
       VALUES ($1, $2, $3, $4, TRUE)
       RETURNING id, menu_item_id, combo_name, combo_name_ar, price_add`,
      [menuItemId, comboName, comboNameAr, priceAdd || 0]
    );
    return rows[0];
  },

  // Get sandwich combo options (pre-defined for Sandwiches category)
  async getSandwichCombos() {
    return [
      { id: 1, name: 'Pepsi', name_ar: 'بيبسي', price: 20 },
      { id: 2, name: 'Cheese Combo', name_ar: 'كومبو الجبن', price: 40, description: 'Pepsi + Cheese' },
      { id: 3, name: 'Regular Combo', name_ar: 'كومبو عادي', price: 40, description: 'Fries + Pepsi' }
    ];
  }
};

module.exports = ProductCustomization;
