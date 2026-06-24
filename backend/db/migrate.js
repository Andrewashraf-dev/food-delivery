require('dotenv').config();
const { query, pool } = require('./pool');
const deliveryRegionsData = require('./deliveryRegionsData');

const migrate = async () => {
  console.log('🔄 Running migrations...');

  // 🔐 CRITICAL FIX #1: Create sequence for atomic order number generation
  await query(`
    CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1 INCREMENT 1;
  `);
  console.log('  ✅ order_number_seq created');

  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id          SERIAL PRIMARY KEY,
      name        VARCHAR(100)        NOT NULL,
      email       VARCHAR(255)        UNIQUE,          -- Made optional for phone-based auth
      password    VARCHAR(255)        NOT NULL,
      phone       VARCHAR(30)         UNIQUE,          -- Added for phone-based login
      street      VARCHAR(255),
      city        VARCHAR(100),
      area        VARCHAR(100),
      role        VARCHAR(20)         NOT NULL DEFAULT 'customer'
                                      CHECK (role IN ('customer','admin')),
      is_active   BOOLEAN             NOT NULL DEFAULT TRUE,
      created_at  TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
      updated_at  TIMESTAMPTZ         NOT NULL DEFAULT NOW()
    );
  `);
  console.log('  ✅ users table ready');

  // Phone-based auth: email optional (existing DBs may still have NOT NULL from older schema)
  await query(`ALTER TABLE users ALTER COLUMN email DROP NOT NULL;`);

await query(`
    CREATE TABLE IF NOT EXISTS menu_items (
      id            SERIAL PRIMARY KEY,
      name          VARCHAR(150)        NOT NULL,
      name_ar       VARCHAR(150),       -- Arabic name for i18n
      size          VARCHAR(50),
      description   TEXT,
      description_ar TEXT,              -- Arabic description for i18n
      price         NUMERIC(10,2)       NOT NULL CHECK (price >= 0),
      category      VARCHAR(50)         NOT NULL 
                                        CHECK (category IN (
                                          'Pasta','Appetizers','Sandwiches','Meals','Drinks'
                                        )),
      image         VARCHAR(500)        DEFAULT '/images/placeholder.jpg',
      is_available  BOOLEAN             NOT NULL DEFAULT TRUE,
      is_featured   BOOLEAN             NOT NULL DEFAULT FALSE,
      has_spicy     BOOLEAN             NOT NULL DEFAULT FALSE,
      add_ons       TEXT,
      calories      INTEGER,
      tags          TEXT[]              DEFAULT '{}',
      sort_order    INTEGER             NOT NULL DEFAULT 0,
      created_at    TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
      updated_at    TIMESTAMPTZ         NOT NULL DEFAULT NOW()
    );
  `);
  console.log('  ✅ menu_items table ready');

  // 🌍 Delivery Regions Table (Arabic region names; do not drop — preserves data on re-run)
  await query(`
    CREATE TABLE IF NOT EXISTS delivery_regions (
      id                SERIAL PRIMARY KEY,
      name_ar           VARCHAR(100)        NOT NULL UNIQUE,
      delivery_fee      NUMERIC(10,2)       NOT NULL CHECK (delivery_fee >= 0),
      estimated_minutes INTEGER             NOT NULL DEFAULT 30,
      is_active         BOOLEAN             NOT NULL DEFAULT TRUE,
      created_at        TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
      updated_at        TIMESTAMPTZ         NOT NULL DEFAULT NOW()
    );
  `);
  console.log('  ✅ delivery_regions table ready');

  // 🥪 Product Customizations Table (sandwich combos)
  await query(`
    CREATE TABLE IF NOT EXISTS product_customizations (
      id                SERIAL PRIMARY KEY,
      menu_item_id      INTEGER             REFERENCES menu_items(id) ON DELETE CASCADE,
      combo_name        VARCHAR(100)        NOT NULL,
      combo_name_ar     VARCHAR(100),
      price_add         NUMERIC(10,2)       NOT NULL DEFAULT 0 CHECK (price_add >= 0),
      is_active         BOOLEAN             NOT NULL DEFAULT TRUE,
      created_at        TIMESTAMPTZ         NOT NULL DEFAULT NOW()
    );
  `);
  console.log('  ✅ product_customizations table ready');

  // Incremental column adds (safe on existing databases)
  await query(`ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS name_ar VARCHAR(150);`);
  await query(`ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS description_ar TEXT;`);
  await query(`ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS add_ons_ar TEXT;`);

  await query(`ALTER TABLE delivery_regions ADD COLUMN IF NOT EXISTS name_en VARCHAR(100);`);
  await query(`ALTER TABLE delivery_regions ADD COLUMN IF NOT EXISTS center_lat DOUBLE PRECISION;`);
  await query(`ALTER TABLE delivery_regions ADD COLUMN IF NOT EXISTS center_lng DOUBLE PRECISION;`);
  await query(`ALTER TABLE delivery_regions ADD COLUMN IF NOT EXISTS map_zoom INTEGER DEFAULT 18;`);

  // Real map centers per English name (see deliveryRegionsData.js) — fixes wrong id-based grid from older migrations
  for (const r of deliveryRegionsData) {
    await query(
      `UPDATE delivery_regions
       SET center_lat = $1, center_lng = $2, map_zoom = $3
       WHERE TRIM(COALESCE(name_en, '')) = $4 OR name_ar = $5`,
      [r.lat, r.lng, 18, r.name_en.trim(), r.name_ar]
    );
  }
  console.log('  ✅ delivery_regions map centers synced');

  await query(`
    CREATE TABLE IF NOT EXISTS orders (
      id                    SERIAL PRIMARY KEY,
      order_number          VARCHAR(20)     NOT NULL UNIQUE,
      user_id               INTEGER         REFERENCES users(id) ON DELETE SET NULL,
      customer_name         VARCHAR(150)    NOT NULL,
      customer_email        VARCHAR(255),
      customer_phone        VARCHAR(50)     NOT NULL,
      delivery_region_id    INTEGER         REFERENCES delivery_regions(id) ON DELETE SET NULL,
      delivery_street       VARCHAR(255),
      delivery_city         VARCHAR(100),
      delivery_area         VARCHAR(100),
      delivery_location_lat NUMERIC(10,8),  -- For pin confirmation
      delivery_location_lng NUMERIC(11,8),
      delivery_notes        TEXT,
      custom_notes          TEXT,           -- General order notes
      subtotal              NUMERIC(10,2)   NOT NULL,
      delivery_fee          NUMERIC(10,2)   NOT NULL DEFAULT 25,
      discount              NUMERIC(10,2)   NOT NULL DEFAULT 0,
      total                 NUMERIC(10,2)   NOT NULL,
      payment_method        VARCHAR(20)     NOT NULL CHECK (payment_method IN ('cod','online','instapay')),
      payment_status        VARCHAR(20)     NOT NULL DEFAULT 'pending'
                                            CHECK (payment_status IN ('pending','paid','failed','refunded')),
      order_status          VARCHAR(30)     NOT NULL DEFAULT 'placed'
                                            CHECK (order_status IN (
                                              'placed','confirmed','preparing',
                                              'out_for_delivery','delivered','cancelled'
                                            )),
      order_type            VARCHAR(20)     NOT NULL DEFAULT 'delivery'
                                            CHECK (order_type IN ('delivery','pickup')),
      notes                 TEXT,
      estimated_delivery    TIMESTAMPTZ,
      delivered_at          TIMESTAMPTZ,
      created_at            TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
      updated_at            TIMESTAMPTZ     NOT NULL DEFAULT NOW()
    );
  `);
  console.log('  ✅ orders table ready');

  // Optional email on orders (older DBs may have NOT NULL on customer_email)
  await query(`ALTER TABLE orders ALTER COLUMN customer_email DROP NOT NULL;`);

  // Older DBs: `CREATE TABLE IF NOT EXISTS` does not add new columns — patch schema in place
  await query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_region_id INTEGER REFERENCES delivery_regions(id) ON DELETE SET NULL;`);
  await query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_location_lat NUMERIC(10,8);`);
  await query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_location_lng NUMERIC(11,8);`);
  await query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_notes TEXT;`);
  await query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS custom_notes TEXT;`);
  console.log('  ✅ orders columns upgraded (region, map, notes)');

  // Replace legacy payment_method CHECK (older DBs may only allow cod/online — instapay must be allowed)
  await query(`
    DO $$
    DECLARE
      cname text;
    BEGIN
      FOR cname IN
        SELECT con.conname
        FROM pg_constraint con
        INNER JOIN pg_class rel ON rel.oid = con.conrelid
        WHERE rel.relname = 'orders'
          AND con.contype = 'c'
          AND pg_get_constraintdef(con.oid) LIKE '%payment_method%'
      LOOP
        EXECUTE format('ALTER TABLE orders DROP CONSTRAINT %I', cname);
      END LOOP;
    END $$;
  `);
  await query(`
    ALTER TABLE orders
      ADD CONSTRAINT orders_payment_method_check
      CHECK (payment_method IN ('cod','online','instapay'));
  `);
  console.log('  ✅ orders.payment_method check updated (cod / online / instapay)');

  await query(`
    CREATE TABLE IF NOT EXISTS order_items (
      id                SERIAL PRIMARY KEY,
      order_id          INTEGER         NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      menu_item_id      INTEGER         REFERENCES menu_items(id) ON DELETE SET NULL,
      name              VARCHAR(150)    NOT NULL,
      price             NUMERIC(10,2)   NOT NULL,
      quantity          INTEGER         NOT NULL CHECK (quantity > 0),
      subtotal          NUMERIC(10,2)   NOT NULL,
      combo_selection   VARCHAR(100),   -- Selected combo (e.g., "Pepsi", "Cheese Combo")
      custom_notes      TEXT            -- Item-level notes ("No tomato", "Extra sauce")
    );
  `);
  console.log('  ✅ order_items table ready');

  await query(`ALTER TABLE order_items ADD COLUMN IF NOT EXISTS combo_selection VARCHAR(100);`);
  await query(`ALTER TABLE order_items ADD COLUMN IF NOT EXISTS custom_notes TEXT;`);
  console.log('  ✅ order_items columns upgraded (combo, notes)');

  await query(`
    CREATE TABLE IF NOT EXISTS order_status_history (
      id         SERIAL PRIMARY KEY,
      order_id   INTEGER       NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      status     VARCHAR(30)   NOT NULL,
      note       TEXT,
      created_at TIMESTAMPTZ   NOT NULL DEFAULT NOW()
    );
  `);
  console.log('  ✅ order_status_history table ready');

  // 💳 Instapay (after orders — references orders.id)
  await query(`
    CREATE TABLE IF NOT EXISTS instapay_payments (
      id                SERIAL PRIMARY KEY,
      order_id          INTEGER             REFERENCES orders(id) ON DELETE CASCADE,
      screenshot_path   VARCHAR(500)        NOT NULL,
      payment_status    VARCHAR(20)         NOT NULL DEFAULT 'pending'
                                            CHECK (payment_status IN ('pending','approved','rejected')),
      admin_notes       TEXT,
      user_notes        TEXT,
      created_at        TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
      updated_at        TIMESTAMPTZ         NOT NULL DEFAULT NOW()
    );
  `);
  console.log('  ✅ instapay_payments table ready');

  await query(`
    ALTER TABLE orders
      ADD COLUMN IF NOT EXISTS instapay_screenshot_id INTEGER REFERENCES instapay_payments(id) ON DELETE SET NULL;
  `);
  console.log('  ✅ orders.instapay_screenshot_id ready');

  // Indexes
  await query(`CREATE INDEX IF NOT EXISTS idx_orders_status        ON orders(order_status);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_orders_email         ON orders(customer_email);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_orders_number        ON orders(order_number);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_orders_region        ON orders(delivery_region_id);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_orders_phone         ON orders(customer_phone);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_menu_category        ON menu_items(category, is_available);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_menu_featured        ON menu_items(is_featured);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_order_items_order    ON order_items(order_id);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_customizations_item  ON product_customizations(menu_item_id);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_regions_active       ON delivery_regions(is_active);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_instapay_order       ON instapay_payments(order_id);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_instapay_status      ON instapay_payments(payment_status);`);
  console.log('  ✅ Indexes created');

  // Auto-update updated_at trigger
  await query(`
    CREATE OR REPLACE FUNCTION update_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
    $$ LANGUAGE plpgsql;
  `);
  for (const tbl of ['users', 'menu_items', 'orders', 'delivery_regions', 'product_customizations', 'instapay_payments']) {
    await query(`
      DROP TRIGGER IF EXISTS set_updated_at ON ${tbl};
      CREATE TRIGGER set_updated_at
        BEFORE UPDATE ON ${tbl}
        FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    `);
  }
  console.log('  ✅ updated_at triggers set');

  console.log('\n🎉 All migrations complete!\n');
  await pool.end();
};

migrate().catch(err => {
  console.error('❌ Migration failed:', err.message);
  process.exit(1);
});
