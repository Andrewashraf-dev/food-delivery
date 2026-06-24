const { query } = require('../db/pool');

/** Public API shape: name/description/add_ons as { en, ar } */
function serializeMenuItem(row) {
  if (!row) return null;
  const nameEn = row.name || '';
  const nameAr = row.name_ar || nameEn;
  const descEn = row.description ?? '';
  const descAr = row.description_ar || descEn;
  const addEn = row.add_ons ?? null;
  const addAr = row.add_ons_ar != null && row.add_ons_ar !== '' ? row.add_ons_ar : addEn;

  const {
    name: _n,
    name_ar: _na,
    description: _d,
    description_ar: _da,
    add_ons: _ao,
    add_ons_ar: _aoa,
    ...rest
  } = row;

  return {
    ...rest,
    name: { en: nameEn, ar: nameAr },
    description: { en: descEn, ar: descAr },
    add_ons: { en: addEn, ar: addAr },
  };
}

const MenuItem = {
  serializeMenuItem,

  async findAll({ category, featured } = {}) {
    let sql = 'SELECT * FROM menu_items WHERE is_available = TRUE';
    const params = [];
    let i = 1;
    if (category) {
      sql += ` AND category = $${i++}`;
      params.push(category);
    }
    if (featured === 'true') sql += ' AND is_featured = TRUE';
    sql += ' ORDER BY category, sort_order, name';
    const { rows } = await query(sql, params);
    return rows.map((r) => serializeMenuItem(r));
  },

  async findAllAdmin() {
    const { rows } = await query('SELECT * FROM menu_items ORDER BY category, sort_order, name');
    return rows.map((r) => serializeMenuItem(r));
  },

  async findRawById(id) {
    const { rows } = await query('SELECT * FROM menu_items WHERE id = $1', [id]);
    return rows[0] || null;
  },

  async findById(id) {
    const row = await this.findRawById(id);
    return serializeMenuItem(row);
  },

  async findRelated({ category, excludeId, limit = 4 }) {
    const { rows } = await query(
      `SELECT * FROM menu_items
       WHERE is_available = TRUE AND category = $1 AND id <> $2
       ORDER BY RANDOM()
       LIMIT $3`,
      [category, excludeId, limit]
    );
    return rows.map((r) => serializeMenuItem(r));
  },

  async create(data) {
    const {
      name,
      name_ar,
      description,
      description_ar,
      price,
      category,
      image,
      is_available = true,
      is_featured = false,
      has_spicy = false,
      size,
      add_ons,
      add_ons_ar,
      calories,
      tags = [],
      sort_order = 0,
    } = data;
    const { rows } = await query(
      `INSERT INTO menu_items (name, name_ar, size, description, description_ar, price, category, image, is_available, is_featured, has_spicy, add_ons, add_ons_ar, calories, tags, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *`,
      [
        name,
        name_ar || null,
        size || null,
        description || null,
        description_ar || null,
        price,
        category,
        image || '/images/placeholder.jpg',
        is_available,
        is_featured,
        has_spicy,
        add_ons || null,
        add_ons_ar || null,
        calories || null,
        tags,
        sort_order,
      ]
    );
    return serializeMenuItem(rows[0]);
  },

  async update(id, data) {
    const allowed = [
      'name',
      'name_ar',
      'description',
      'description_ar',
      'price',
      'category',
      'image',
      'is_available',
      'is_featured',
      'has_spicy',
      'size',
      'add_ons',
      'add_ons_ar',
      'calories',
      'tags',
      'sort_order',
    ];
    const sets = [];
    const vals = [];
    let i = 1;
    for (const [k, v] of Object.entries(data)) {
      const snakeKey = k.replace(/([A-Z])/g, '_$1').toLowerCase();
      if (allowed.includes(snakeKey)) {
        sets.push(`${snakeKey} = $${i++}`);
        vals.push(v);
      } else if (allowed.includes(k)) {
        sets.push(`${k} = $${i++}`);
        vals.push(v);
      }
    }
    if (!sets.length) return this.findById(id);
    vals.push(id);
    const { rows } = await query(`UPDATE menu_items SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, vals);
    return rows[0] ? serializeMenuItem(rows[0]) : null;
  },

  async delete(id) {
    const { rowCount } = await query('DELETE FROM menu_items WHERE id = $1', [id]);
    return rowCount > 0;
  },

  groupByCategory(items) {
    return items.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {});
  },
};

module.exports = MenuItem;
