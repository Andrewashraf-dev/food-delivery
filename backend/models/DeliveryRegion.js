const { query } = require('../db/pool');

function serializeRegion(row) {
  if (!row) return null;
  const ar = row.name_ar || '';
  const en = row.name_en && String(row.name_en).trim() ? row.name_en : ar;
  const {
    name_ar: _a,
    name_en: _e,
    center_lat: _clat,
    center_lng: _clng,
    map_zoom: _mz,
    ...rest
  } = row;
  const lat = row.center_lat != null ? Number(row.center_lat) : null;
  const lng = row.center_lng != null ? Number(row.center_lng) : null;
  const zoom = row.map_zoom != null ? Number(row.map_zoom) : 18;
  return {
    ...rest,
    name: { en, ar },
    mapCenter: lat != null && lng != null ? { lat, lng } : null,
    mapZoom: Number.isFinite(zoom) ? zoom : 18,
  };
}

const DeliveryRegion = {
  serializeRegion,

  async findAll() {
    const { rows } = await query(
      `SELECT id, name_ar, name_en, delivery_fee, estimated_minutes, is_active, created_at,
              center_lat, center_lng, map_zoom
       FROM delivery_regions
       WHERE is_active = TRUE
       ORDER BY delivery_fee ASC`
    );
    return rows.map(serializeRegion);
  },

  async findById(id) {
    const { rows } = await query(
      `SELECT id, name_ar, name_en, delivery_fee, estimated_minutes, is_active,
              center_lat, center_lng, map_zoom
       FROM delivery_regions
       WHERE id = $1`,
      [id]
    );
    return rows[0] ? serializeRegion(rows[0]) : null;
  },

  async getFee(regionId) {
    const id = parseInt(regionId, 10);
    if (Number.isNaN(id)) return null;
    const { rows } = await query(
      `SELECT delivery_fee FROM delivery_regions WHERE id = $1 AND is_active = TRUE`,
      [id]
    );
    return rows[0] ? parseFloat(rows[0].delivery_fee) : null;
  },

  async getEstimatedTime(regionId) {
    const region = await query(
      `SELECT estimated_minutes FROM delivery_regions WHERE id = $1`,
      [regionId]
    );
    const row = region.rows[0];
    return row ? row.estimated_minutes : 30;
  },
};

module.exports = DeliveryRegion;
