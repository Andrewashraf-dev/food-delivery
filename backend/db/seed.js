require('dotenv').config();
const bcrypt = require('bcryptjs');
const { query, pool } = require('./pool');
const { createMenuAugment } = require('./seedMenuAr');
const deliveryRegions = require('./deliveryRegionsData');

// --- REUSABLE ADD-ONS (To keep the code clean!) ---
const SANDWICH_ADDONS = `Mushroom +20 EGP, Fried Cheese +30 EGP, Fajita +25 EGP, Jalapeño +15 EGP, Mozzarella Sticks (2 pcs) +25 EGP, Roast Beef +15 EGP, Smoked Turkey +15 EGP, Onion Rings +20 EGP, Bread +15 EGP, Doritos +10 EGP, Chicken Strips (1 pc) +40 EGP, Chicken Bites (1 pc) +35 EGP, Mozzarella Sauce +30 EGP. Upgrades: Coleslaw Large +20 EGP, Fries Large +25 EGP. Sides: Rice Small +20 EGP, Rice Large +30 EGP, Coleslaw Small +20 EGP, Coleslaw Large +35 EGP, Cheddar Cheese Sauce Small +25 EGP, Cheddar Cheese Sauce Large +40 EGP, Fries Small +25 EGP, Fries Large +40 EGP.`;
const SANDWICH_COMBO = `Combo Options:

* Pepsi +20 EGP

* Cheese Combo +40 EGP (Pepsi + Cheese)

* Regular Combo +40 EGP (Fries + Pepsi)`;
const STRIPS_ADDONS = `Rice / Fries Choose: Rice or Fries. Combo Options: Small Combo +30 EGP, Large Combo with 1L Pepsi +80 EGP`;
const MASAHAB_ADDONS = `Combo: Add Small Combo +30 EGP, Add Large Combo with 1L Pepsi +80 EGP`;

const menuItems = [
  // ================= PASTA =================
  { name: 'Chicken Pasta', size: 'Regular', price: 125, category: 'Pasta', description: 'Penne, white sauce, crispy chicken breasts & mozzarella cheese', image: 'https://res.cloudinary.com/dobok0qbs/image/upload/q_auto/f_auto/v1775304746/Chicken_Pasta_oonsok.png', has_spicy: true, add_ons: null },
  { name: 'Turkin Pasta', size: 'Regular', price: 120, category: 'Pasta', description: 'Penne white sauce pasta, crispy chicken breast, mozzarella, smoked turkey and beef bacon', image: 'https://res.cloudinary.com/dobok0qbs/image/upload/q_auto/f_auto/v1775304751/Turkin_Pasta_gqvyrq.png', has_spicy: true, add_ons: null },
  { name: 'Chicken Mozzarella', size: 'Regular', price: 125, category: 'Pasta', description: 'Crispy chicken breast and mozzarella cheese', image: 'https://res.cloudinary.com/dobok0qbs/image/upload/q_auto/f_auto/v1775304744/Chickenmotzarella_pasta_we61x1.png', has_spicy: true, add_ons: null },

  // ================= APPETIZERS =================
  { name: 'Mozzarella Sticks with BBQ Sauce', size: '3 STICKS', price: 45, category: 'Appetizers', description: '3 Mozzarella Sticks with BBQ Sauce', image: 'https://res.cloudinary.com/dobok0qbs/image/upload/q_auto/f_auto/v1775304641/Mozzarella_Sticks_with_BBQ_Sauce_lr5h9z.png', has_spicy: false, add_ons: null },
  { name: 'Mozzarella Sticks with BBQ Sauce', size: '6 STICKS', price: 85, category: 'Appetizers', description: '6 Mozzarella Sticks with BBQ Sauce', image: 'https://res.cloudinary.com/dobok0qbs/image/upload/q_auto/f_auto/v1775304641/Mozzarella_Sticks_with_BBQ_Sauce_lr5h9z.png', has_spicy: false, add_ons: null },
  { name: 'Mozzarella Roll', size: 'Regular', price: 75, category: 'Appetizers', description: 'Mozzarella Roll', image: 'https://res.cloudinary.com/dobok0qbs/image/upload/q_auto/f_auto/v1775304634/Mozzarella_Roll_nwqjoz.png', has_spicy: false, add_ons: null },
  { name: 'fresco Roll', size: 'Regular', price: 65, category: 'Appetizers', description: 'fresco Roll', image: 'https://res.cloudinary.com/dobok0qbs/image/upload/q_auto/f_auto/v1775304619/fressco_Roll_usm78c.png', has_spicy: false, add_ons: null },
  { name: 'Bacon Fries', size: 'Regular', price: 65, category: 'Appetizers', description: 'Bacon Fries', image: 'https://res.cloudinary.com/dobok0qbs/image/upload/q_auto/f_auto/v1775304586/Bacon_Fries_cxti1m.png', has_spicy: false, add_ons: null },
  { name: 'Rizo', size: 'Regular', price: 65, category: 'Appetizers', description: 'Rizo', image: 'https://res.cloudinary.com/dobok0qbs/image/upload/q_auto/f_auto/v1775304681/Rizo_rcnkpd.png', has_spicy: false, add_ons: null },
  { name: 'Onion Rings', size: '3 Onion Rings', price: 35, category: 'Appetizers', description: '3 Onion Rings with BBQ Sauce', image: 'https://res.cloudinary.com/dobok0qbs/image/upload/q_auto/f_auto/v1775304680/Onion_Rings_vgo3fx.png', has_spicy: false, add_ons: null },
  { name: 'Cheesy Fries with Jalapeno', size: 'Regular', price: 65, category: 'Appetizers', description: 'Cheesy Fries with Jalapeno', image: 'https://res.cloudinary.com/dobok0qbs/image/upload/q_auto/f_auto/v1775304626/Cheesy_Fries_with_Jalapeno_u57vl2.png', has_spicy: false, add_ons: null },
  { name: 'Rice', size: 'Small', price: 20, category: 'Appetizers', description: 'Rice', image: 'https://res.cloudinary.com/dobok0qbs/image/upload/q_auto/f_auto/v1775304682/Rice_puiamm.png', has_spicy: false, add_ons: null },
  { name: 'Rice', size: 'Large', price: 30, category: 'Appetizers', description: 'Rice', image: 'https://res.cloudinary.com/dobok0qbs/image/upload/q_auto/f_auto/v1775304682/Rice_puiamm.png', has_spicy: false, add_ons: null },
  { name: 'Coleslaw', size: 'Small', price: 20, category: 'Appetizers', description: 'Coleslaw', image: 'https://res.cloudinary.com/dobok0qbs/image/upload/q_auto/f_auto/v1775304684/Coleslaw_ohbpnz.png', has_spicy: false, add_ons: null },
  { name: 'Coleslaw', size: 'Large', price: 35, category: 'Appetizers', description: 'Coleslaw', image: 'https://res.cloudinary.com/dobok0qbs/image/upload/q_auto/f_auto/v1775304684/Coleslaw_ohbpnz.png', has_spicy: false, add_ons: null },
  { name: 'Fries', size: 'Small', price: 25, category: 'Appetizers', description: 'Fries', image: 'https://res.cloudinary.com/dobok0qbs/image/upload/q_auto/f_auto/v1775304631/Fries_diejyb.png', has_spicy: false, add_ons: null },
  { name: 'Fries', size: 'Large', price: 40, category: 'Appetizers', description: 'Fries', image: 'https://res.cloudinary.com/dobok0qbs/image/upload/q_auto/f_auto/v1775304631/Fries_diejyb.png', has_spicy: false, add_ons: null },
  { name: 'Chicken Fries with Cheddar Sauce', size: 'Regular', price: 90, category: 'Appetizers', description: 'Chicken Fries with Cheddar Sauce', image: 'https://res.cloudinary.com/dobok0qbs/image/upload/q_auto/f_auto/v1775304678/Chicken_Fries_with_Cheddar_Sauce_bdenqc.png', has_spicy: false, add_ons: null },
  { name: 'Cheddar Sauce', size: 'Small', price: 25, category: 'Appetizers', description: 'Small Cheddar Sauce', image: 'https://st4.depositphotos.com/6591208/23141/i/450/depositphotos_231416618-stock-photo-small-glass-bowl-yellow-sauce.jpg', has_spicy: false, add_ons: null },
  { name: 'Cheddar Sauce', size: 'Big', price: 40, category: 'Appetizers', description: 'Large Cheddar Sauce', image: 'https://st4.depositphotos.com/6591208/23141/i/450/depositphotos_231416618-stock-photo-small-glass-bowl-yellow-sauce.jpg', has_spicy: false, add_ons: null },

  // ================= SANDWICHES =================
  { name: 'Big fresco', size: 'Single', price: 115, category: 'Sandwiches', description: 'Crispy chicken breasts, lettuce, cheddar cheese sauce, mayonnaise sauce, BBQ sauce, beef bacon slice and smoked turkey slice', image: 'https://emofly.b-cdn.net/hbd_exvhac6ayb3ZKT/width:1080/plain/https://storage.googleapis.com/takesg/9c7b8c8f-486f-4361-a6f1-c84f9d1813b7.png', has_spicy: true, add_ons: SANDWICH_ADDONS},
  { name: 'Big fresco', size: 'Double', price: 145, category: 'Sandwiches', description: 'Crispy chicken breasts, lettuce, cheddar cheese sauce, mayonnaise sauce, BBQ sauce, beef bacon slice and smoked turkey slice', image: 'https://emofly.b-cdn.net/hbd_exvhac6ayb3ZKT/width:1080/plain/https://storage.googleapis.com/takesg/9c7b8c8f-486f-4361-a6f1-c84f9d1813b7.png', has_spicy: true, add_ons: SANDWICH_ADDONS , is_featured: true },
  { name: 'Big fresco', size: 'Triple', price: 175, category: 'Sandwiches', description: 'Crispy chicken breasts, lettuce, cheddar cheese sauce, mayonnaise sauce, BBQ sauce, beef bacon slice and smoked turkey slice', image: 'https://emofly.b-cdn.net/hbd_exvhac6ayb3ZKT/width:1080/plain/https://storage.googleapis.com/takesg/9c7b8c8f-486f-4361-a6f1-c84f9d1813b7.png', has_spicy: true, add_ons: SANDWICH_ADDONS },
  
  { name: 'Fresco Patty', size: 'Single', price: 125, category: 'Sandwiches', description: 'Crispy chicken breasts, lettuce, cheddar cheese sauce, mayonnaise sauce, BBQ sauce, fried cheese and beef bacon slice', image: 'https://emofly.b-cdn.net/hbd_exvhac6ayb3ZKT/width:1080/plain/https://storage.googleapis.com/takesg/ad1d4e7a-db14-41dd-9dc1-9963b47b0b80.png', has_spicy: true, add_ons: SANDWICH_ADDONS },
  { name: 'Fresco Patty', size: 'Double', price: 155, category: 'Sandwiches', description: 'Crispy chicken breasts, lettuce, cheddar cheese sauce, mayonnaise sauce, BBQ sauce, fried cheese and beef bacon slice', image: 'https://emofly.b-cdn.net/hbd_exvhac6ayb3ZKT/width:1080/plain/https://storage.googleapis.com/takesg/ad1d4e7a-db14-41dd-9dc1-9963b47b0b80.png', has_spicy: true, add_ons: SANDWICH_ADDONS },
  { name: 'Fresco Patty', size: 'Triple', price: 180, category: 'Sandwiches', description: 'Crispy chicken breasts, lettuce, cheddar cheese sauce, mayonnaise sauce, BBQ sauce, fried cheese and beef bacon slice', image: 'https://emofly.b-cdn.net/hbd_exvhac6ayb3ZKT/width:1080/plain/https://storage.googleapis.com/takesg/ad1d4e7a-db14-41dd-9dc1-9963b47b0b80.png', has_spicy: true, add_ons: SANDWICH_ADDONS },

  { name: 'Fresco Cheesy', size: 'Single', price: 130, category: 'Sandwiches', description: 'Crispy chicken breasts, lettuce, mozzarella cheese sauce, mayonnaise sauce, BBQ sauce and mozzarella sticks', image: 'https://emofly.b-cdn.net/hbd_exvhac6ayb3ZKT/width:1080/plain/https://storage.googleapis.com/takesg/a7c48d55-bec4-4e81-a043-9f75b6a0f4ea.png', has_spicy: true, add_ons: SANDWICH_ADDONS },
  { name: 'Fresco Cheesy', size: 'Double', price: 160, category: 'Sandwiches', description: 'Crispy chicken breasts, lettuce, mozzarella cheese sauce, mayonnaise sauce, BBQ sauce and mozzarella sticks', image: 'https://emofly.b-cdn.net/hbd_exvhac6ayb3ZKT/width:1080/plain/https://storage.googleapis.com/takesg/a7c48d55-bec4-4e81-a043-9f75b6a0f4ea.png', has_spicy: true, add_ons: SANDWICH_ADDONS },
  { name: 'Fresco Cheesy', size: 'Triple', price: 185, category: 'Sandwiches', description: 'Crispy chicken breasts, lettuce, mozzarella cheese sauce, mayonnaise sauce, BBQ sauce and mozzarella sticks', image: 'https://emofly.b-cdn.net/hbd_exvhac6ayb3ZKT/width:1080/plain/https://storage.googleapis.com/takesg/a7c48d55-bec4-4e81-a043-9f75b6a0f4ea.png', has_spicy: true, add_ons: SANDWICH_ADDONS },

  { name: 'Massive Fresco', size: 'Single', price: 120, category: 'Sandwiches', description: 'Crispy chicken breasts, lettuce, cheddar cheese sauce, mayonnaise sauce, BBQ sauce, beef bacon slice, smoked turkey slice, mushroom sauce, jalapeno and fire sauce', image: 'https://emofly.b-cdn.net/hbd_exvhac6ayb3ZKT/width:1080/plain/https://storage.googleapis.com/takesg/4d1aeedd-abef-4c7c-933f-f34d435d50e4.png', has_spicy: true, add_ons: SANDWICH_ADDONS },
  { name: 'Massive Fresco', size: 'Double', price: 150, category: 'Sandwiches', description: 'Crispy chicken breasts, lettuce, cheddar cheese sauce, mayonnaise sauce, BBQ sauce, beef bacon slice, smoked turkey slice, mushroom sauce, jalapeno and fire sauce', image: 'https://emofly.b-cdn.net/hbd_exvhac6ayb3ZKT/width:1080/plain/https://storage.googleapis.com/takesg/4d1aeedd-abef-4c7c-933f-f34d435d50e4.png', has_spicy: true, add_ons: SANDWICH_ADDONS, is_featured: true },
  { name: 'Massive Fresco', size: 'Triple', price: 180, category: 'Sandwiches', description: 'Crispy chicken breasts, lettuce, cheddar cheese sauce, mayonnaise sauce, BBQ sauce, beef bacon slice, smoked turkey slice, mushroom sauce, jalapeno and fire sauce', image: 'https://emofly.b-cdn.net/hbd_exvhac6ayb3ZKT/width:1080/plain/https://storage.googleapis.com/takesg/4d1aeedd-abef-4c7c-933f-f34d435d50e4.png', has_spicy: true, add_ons: SANDWICH_ADDONS },

  { name: 'Fresco Rings', size: 'Single', price: 120, category: 'Sandwiches', description: 'Crispy chicken breasts, lettuce, cheddar cheese sauce, mayonnaise sauce, BBQ sauce, beef bacon and onion ring', image: 'https://emofly.b-cdn.net/hbd_exvhac6ayb3ZKT/width:1080/plain/https://storage.googleapis.com/takesg/11a93697-1d93-4c3b-bc93-9428ec284604.png', has_spicy: true, add_ons: SANDWICH_ADDONS },
  { name: 'Fresco Rings', size: 'Double', price: 150, category: 'Sandwiches', description: 'Crispy chicken breasts, lettuce, cheddar cheese sauce, mayonnaise sauce, BBQ sauce, beef bacon and onion ring', image: 'https://emofly.b-cdn.net/hbd_exvhac6ayb3ZKT/width:1080/plain/https://storage.googleapis.com/takesg/11a93697-1d93-4c3b-bc93-9428ec284604.png', has_spicy: true, add_ons: SANDWICH_ADDONS },
  { name: 'Fresco Rings', size: 'Triple', price: 180, category: 'Sandwiches', description: 'Crispy chicken breasts, lettuce, cheddar cheese sauce, mayonnaise sauce, BBQ sauce, beef bacon and onion ring', image: 'https://emofly.b-cdn.net/hbd_exvhac6ayb3ZKT/width:1080/plain/https://storage.googleapis.com/takesg/11a93697-1d93-4c3b-bc93-9428ec284604.png', has_spicy: true, add_ons: SANDWICH_ADDONS },

  { name: 'Fresco Mexi', size: 'Single', price: 120, category: 'Sandwiches', description: 'Crispy chicken breasts, lettuce, cheddar cheese sauce, mayonnaise sauce, BBQ sauce & doritos', image: 'https://emofly.b-cdn.net/hbd_exvhac6ayb3ZKT/width:1080/plain/https://storage.googleapis.com/takesg/6297c8b5-3205-40a6-8afb-2447546d511e.png', has_spicy: true, add_ons: SANDWICH_ADDONS },
  { name: 'Fresco Mexi', size: 'Double', price: 150, category: 'Sandwiches', description: 'Crispy chicken breasts, lettuce, cheddar cheese sauce, mayonnaise sauce, BBQ sauce & doritos', image: 'https://emofly.b-cdn.net/hbd_exvhac6ayb3ZKT/width:1080/plain/https://storage.googleapis.com/takesg/6297c8b5-3205-40a6-8afb-2447546d511e.png', has_spicy: true, add_ons: SANDWICH_ADDONS },
  { name: 'Fresco Mexi', size: 'Triple', price: 180, category: 'Sandwiches', description: 'Crispy chicken breasts, lettuce, cheddar cheese sauce, mayonnaise sauce, BBQ sauce & doritos', image: 'https://emofly.b-cdn.net/hbd_exvhac6ayb3ZKT/width:1080/plain/https://storage.googleapis.com/takesg/6297c8b5-3205-40a6-8afb-2447546d511e.png', has_spicy: true, add_ons: SANDWICH_ADDONS },

  { name: 'Classic Fresco', size: 'Single', price: 110, category: 'Sandwiches', description: 'Crispy chicken breasts, lettuce, cheddar cheese sauce, mayonnaise and BBQ sauce', image: 'https://emofly.b-cdn.net/hbd_exvhac6ayb3ZKT/width:1080/plain/https://storage.googleapis.com/takesg/e7e3c4b4-450b-47af-aa06-d60f5f3017a1.png', has_spicy: true, add_ons: SANDWICH_ADDONS },

  { name: 'Fresco Fajita', size: 'Single', price: 130, category: 'Sandwiches', description: 'Crispy chicken breasts, lettuce, cheddar cheese sauce, mayonnaise sauce BBQ sauce & fajita', image: 'https://emofly.b-cdn.net/hbd_exvhac6ayb3ZKT/width:1080/plain/https://storage.googleapis.com/takesg/b6ae7b6c-1df0-45b9-9af4-c41a8b6ed4f5.png', has_spicy: true, add_ons: SANDWICH_ADDONS },
  { name: 'Fresco Fajita', size: 'Double', price: 160, category: 'Sandwiches', description: 'Crispy chicken breasts, lettuce, cheddar cheese sauce, mayonnaise sauce BBQ sauce & fajita', image: 'https://emofly.b-cdn.net/hbd_exvhac6ayb3ZKT/width:1080/plain/https://storage.googleapis.com/takesg/b6ae7b6c-1df0-45b9-9af4-c41a8b6ed4f5.png', has_spicy: true, add_ons: SANDWICH_ADDONS, is_featured: true },
  { name: 'Fresco Fajita', size: 'Triple', price: 180, category: 'Sandwiches', description: 'Crispy chicken breasts, lettuce, cheddar cheese sauce, mayonnaise sauce BBQ sauce & fajita', image: 'https://emofly.b-cdn.net/hbd_exvhac6ayb3ZKT/width:1080/plain/https://storage.googleapis.com/takesg/b6ae7b6c-1df0-45b9-9af4-c41a8b6ed4f5.png', has_spicy: true, add_ons: SANDWICH_ADDONS },

  { name: 'Hero Pizza', size: 'Single', price: 140, category: 'Sandwiches', description: 'Crispy chicken breasts, lettuce, cheddar cheese sauce, mayonnaise sauce, BBQ sauce beef bacon slice, smoked turkey slice and pizza topped with mozzarella', image: 'https://emofly.b-cdn.net/hbd_exvhac6ayb3ZKT/width:1080/plain/https://storage.googleapis.com/takesg/a3d16a88-62fd-42d5-974b-d7c93c341a95.png', has_spicy: true, add_ons: SANDWICH_ADDONS },
  { name: 'Lava Pizza', size: 'Single', price: 150, category: 'Sandwiches', description: 'Crispy chicken breasts, lettuce, cheddar cheese sauce, mayonnaise sauce, BBQ sauce, fajita & pizza layer topped with mozzarella', image: 'https://emofly.b-cdn.net/hbd_exvhac6ayb3ZKT/width:1080/plain/https://storage.googleapis.com/takesg/a3d16a88-62fd-42d5-974b-d7c93c341a95.png', has_spicy: true, add_ons: SANDWICH_ADDONS },

  { name: 'Mix Chesse', size: 'Single', price: 125, category: 'Sandwiches', description: 'Crispy chicken breast + lettuce + cheddar cheese sauce + mayonnaise sauce + BBQ sauce + a layer of mozzarella sauce', image: 'https://emofly.b-cdn.net/hbd_exvhac6ayb3ZKT/width:1080/plain/https://storage.googleapis.com/takeapp/media/clvuuuiog00090cl97ihxcea0.png', has_spicy: true, add_ons: SANDWICH_ADDONS },
  { name: 'Mix Chesse', size: 'Double', price: 155, category: 'Sandwiches', description: 'Crispy chicken breast + lettuce + cheddar cheese sauce + mayonnaise sauce + BBQ sauce + a layer of mozzarella sauce', image: 'https://emofly.b-cdn.net/hbd_exvhac6ayb3ZKT/width:1080/plain/https://storage.googleapis.com/takeapp/media/clvuuuiog00090cl97ihxcea0.png', has_spicy: true, add_ons: SANDWICH_ADDONS },
  { name: 'Mix Chesse', size: 'Triple', price: 180, category: 'Sandwiches', description: 'Crispy chicken breast + lettuce + cheddar cheese sauce + mayonnaise sauce + BBQ sauce + a layer of mozzarella sauce', image: 'https://emofly.b-cdn.net/hbd_exvhac6ayb3ZKT/width:1080/plain/https://storage.googleapis.com/takeapp/media/clvuuuiog00090cl97ihxcea0.png', has_spicy: true, add_ons: SANDWICH_ADDONS },

  { name: 'Chesse Boom', size: 'Single', price: 125, category: 'Sandwiches', description: 'Crispy chicken breast + lettuce + cheddar cheese sauce + mayonnaise sauce + BBQ sauce + cheddar cheese-stuffed patty', image: 'https://emofly.b-cdn.net/hbd_exvhac6ayb3ZKT/width:1080/plain/https://storage.googleapis.com/takeapp/media/clvuuvv09000l0dig02rf4xtp.png', has_spicy: true, add_ons: SANDWICH_ADDONS },
  { name: 'Chesse Boom', size: 'Double', price: 155, category: 'Sandwiches', description: 'Crispy chicken breast + lettuce + cheddar cheese sauce + mayonnaise sauce + BBQ sauce + cheddar cheese-stuffed patty', image: 'https://emofly.b-cdn.net/hbd_exvhac6ayb3ZKT/width:1080/plain/https://storage.googleapis.com/takeapp/media/clvuuvv09000l0dig02rf4xtp.png', has_spicy: true, add_ons: SANDWICH_ADDONS },
  { name: 'Chesse Boom', size: 'Triple', price: 185, category: 'Sandwiches', description: 'Crispy chicken breast + lettuce + cheddar cheese sauce + mayonnaise sauce + BBQ sauce + cheddar cheese-stuffed patty', image: 'https://emofly.b-cdn.net/hbd_exvhac6ayb3ZKT/width:1080/plain/https://storage.googleapis.com/takeapp/media/clvuuvv09000l0dig02rf4xtp.png', has_spicy: true, add_ons: SANDWICH_ADDONS },

  { name: 'Chesse Hot Dog', size: 'Single', price: 125, category: 'Sandwiches', description: 'Crispy chicken breast + lettuce + cheddar cheese sauce + mayonnaise sauce + BBQ sauce + fried hot dog pieces', image: 'https://emofly.b-cdn.net/hbd_exvhac6ayb3ZKT/width:1080/plain/https://storage.googleapis.com/takeapp/media/clvuuxujd000m0dig47uj506n.png', has_spicy: true, add_ons: SANDWICH_ADDONS },
  { name: 'Chesse Hot Dog', size: 'Double', price: 155, category: 'Sandwiches', description: 'Crispy chicken breast + lettuce + cheddar cheese sauce + mayonnaise sauce + BBQ sauce + fried hot dog pieces', image: 'https://emofly.b-cdn.net/hbd_exvhac6ayb3ZKT/width:1080/plain/https://storage.googleapis.com/takeapp/media/clvuuxujd000m0dig47uj506n.png', has_spicy: true, add_ons: SANDWICH_ADDONS },
  { name: 'Chesse Hot Dog', size: 'Triple', price: 185, category: 'Sandwiches', description: 'Crispy chicken breast + lettuce + cheddar cheese sauce + mayonnaise sauce + BBQ sauce + fried hot dog pieces', image: 'https://emofly.b-cdn.net/hbd_exvhac6ayb3ZKT/width:1080/plain/https://storage.googleapis.com/takeapp/media/clvuuxujd000m0dig47uj506n.png', has_spicy: true, add_ons: SANDWICH_ADDONS },
  
  { name: 'Chicken Ranch', size: 'Single', price: 130, category: 'Sandwiches', description: 'Crispy chicken breast + lettuce + cheddar cheese sauce + mayonnaise sauce + BBQ sauce + Ranch sauce + small fries and small coleslaw', image: 'https://res.cloudinary.com/dobok0qbs/image/upload/q_auto/f_auto/v1776169271/chicken_ranch_y5tokj.png', has_spicy: true, add_ons: SANDWICH_ADDONS },
  { name: 'Chicken Ranch', size: 'Double', price: 160, category: 'Sandwiches', description: 'Crispy chicken breast + lettuce + cheddar cheese sauce + mayonnaise sauce + BBQ sauce + Ranch sauce + small fries and small coleslaw', image: 'https://res.cloudinary.com/dobok0qbs/image/upload/q_auto/f_auto/v1776169271/chicken_ranch_y5tokj.png', has_spicy: true, add_ons: SANDWICH_ADDONS },
  { name: 'Chicken Ranch', size: 'Triple', price: 180, category: 'Sandwiches', description: 'Crispy chicken breast + lettuce + cheddar cheese sauce + mayonnaise sauce + BBQ sauce + Ranch sauce + small fries and small coleslaw', image: 'https://res.cloudinary.com/dobok0qbs/image/upload/q_auto/f_auto/v1776169271/chicken_ranch_y5tokj.png', has_spicy: true, add_ons: SANDWICH_ADDONS },
  
  // ================= MEALS =================
  { name: 'Strips Meal', size: '3 Pieces', price: 120, category: 'Meals', description: '3 Chicken Strips with 1 Bread and Coleslaw (all meals served with Rice or Fries and Bread)', image: 'https://res.cloudinary.com/dobok0qbs/image/upload/q_auto/f_auto/v1775304740/3strips_meal_cbiltz.png', has_spicy: true, add_ons: STRIPS_ADDONS },
  { name: 'Strips Meal', size: '5 Pieces', price: 155, category: 'Meals', description: '5 Chicken Strips with 1 Bread and Coleslaw (all meals served with Rice or Fries and Bread)', image: 'https://res.cloudinary.com/dobok0qbs/image/upload/q_auto/f_auto/v1775304757/5strips_meal_cbuur9.png', has_spicy: true, add_ons: STRIPS_ADDONS },
  { name: 'Strips Meal', size: '8 Pieces', price: 215, category: 'Meals', description: '8 Chicken Strips with 1 Bread and Coleslaw (all meals served with Rice or Fries and Bread)', image: 'https://res.cloudinary.com/dobok0qbs/image/upload/q_auto/f_auto/v1775304767/8strips_meal_n0boha.png', has_spicy: true, add_ons: STRIPS_ADDONS },
  { name: 'Strips Meal', size: '12 Pieces', price: 255, category: 'Meals', description: '12 Chicken Strips with 1 Bread and Coleslaw (all meals served with Rice or Fries and Bread)', image: 'https://res.cloudinary.com/dobok0qbs/image/upload/q_auto/f_auto/v1775304767/12strips_meal_wyvsam.png', has_spicy: true, add_ons: STRIPS_ADDONS },
  { name: 'Kids Meal', size: 'Regular', price: 90, category: 'Meals', description: '2 Chicken Strips with Bread, Fries, and Juice', image: 'https://res.cloudinary.com/dobok0qbs/image/upload/q_auto/f_auto/v1775304710/2strips_kids_vukkpa.png', has_spicy: false, add_ons: null },
  { name: 'Masahab Meal', size: '5 Pieces', price: 125, category: 'Meals', description: '5 Masahab Pices with 1 Fries, Coleslaw and Bread (all meals served with Fries, Coleslaw and Bread)', image: 'https://emofly.b-cdn.net/hbd_exvhac6ayb3ZKT/width:1080/plain/https://storage.googleapis.com/takeapp/media/clvuv4tmw000e0ckwclrgbwkc.png', has_spicy: false, add_ons: MASAHAB_ADDONS },
  { name: 'Masahab Meal', size: '7 Pieces', price: 155, category: 'Meals', description: '7 Masahab Pices with 1 Fries, Coleslaw and Bread (all meals served with Fries, Coleslaw and Bread)', image: 'https://emofly.b-cdn.net/hbd_exvhac6ayb3ZKT/width:1080/plain/https://storage.googleapis.com/takeapp/media/clvuv4tmw000e0ckwclrgbwkc.png', has_spicy: false, add_ons: MASAHAB_ADDONS , is_featured: true },
  { name: 'Masahab Meal', size: '10 Pieces', price: 185, category: 'Meals', description: '10 Masahab Pices with 1 Fries, Coleslaw and Bread (all meals served with Fries, Coleslaw and Bread)', image: 'https://emofly.b-cdn.net/hbd_exvhac6ayb3ZKT/width:1080/plain/https://storage.googleapis.com/takeapp/media/clvuv4tmw000e0ckwclrgbwkc.png', has_spicy: false, add_ons: MASAHAB_ADDONS },

  // ================= DRINKS =================
  { name: 'Pepsi Can', size: 'Can', price: 20, category: 'Drinks', description: 'Pepsi Can', image: 'https://t3.ftcdn.net/jpg/03/23/86/24/360_F_323862457_5RaEzJNg6yeYx6RjbU4WwkAl3R0yxNQt.jpg', has_spicy: false, add_ons: null },
  { name: 'Pepsi Litre', size: 'Litre', price: 30, category: 'Drinks', description: 'Pepsi Litre', image: 'https://cdn.mafrservices.com/sys-master-root/hb8/h40/16987247968286/3814_main.jpg?im=Resize=376', has_spicy: false, add_ons: null },
  { name: 'Juice', size: 'Regular', price: 15, category: 'Drinks', description: 'Juice', image: 'https://m.media-amazon.com/images/I/21IsOxzEQaL._AC_SR290,290_.jpg', has_spicy: false, add_ons: null },
];

const { augmentMenuItems } = createMenuAugment(SANDWICH_ADDONS, STRIPS_ADDONS, MASAHAB_ADDONS);
const menuRows = augmentMenuItems(menuItems);

const seed = async () => {
  console.log('🌱 Seeding database...\n');

  await query('DELETE FROM order_status_history');
  await query('DELETE FROM order_items');
  await query('DELETE FROM orders');
  await query('DELETE FROM menu_items');
  await query('DELETE FROM delivery_regions');
  await query("DELETE FROM users WHERE email = $1", [process.env.ADMIN_EMAIL_SEED || 'admin@frescoegypt.com']);
  console.log('  🗑️  Existing seed data cleared');

  for (const item of menuRows) {
    await query(
      `INSERT INTO menu_items
         (name, name_ar, size, description, description_ar, price, category, image, is_featured,
          has_spicy, add_ons, add_ons_ar, calories, tags, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
      [
        item.name,
        item.name_ar || null,
        item.size,
        item.description,
        item.description_ar || null,
        item.price,
        item.category,
        item.image,
        item.is_featured || false,
        item.has_spicy,
        item.add_ons,
        item.add_ons_ar || null,
        item.calories || null,
        item.tags || [],
        item.sort_order || 0,
      ]
    );
  }
  console.log(`  ✅ ${menuRows.length} menu items inserted`);

  // 🌍 Delivery regions — map centers from deliveryRegionsData.js (realistic Cairo / Giza points)
  for (const region of deliveryRegions) {
    await query(
      `INSERT INTO delivery_regions (name_ar, name_en, delivery_fee, center_lat, center_lng, map_zoom, is_active)
       VALUES ($1, $2, $3, $4, $5, 18, TRUE)`,
      [region.name_ar, region.name_en, region.fee, region.lat, region.lng]
    );
  }
  console.log(`  ✅ ${deliveryRegions.length} delivery regions inserted`);

  const adminEmail    = process.env.ADMIN_EMAIL_SEED || 'admin@frescoegypt.com';
  const adminPassword = process.env.ADMIN_PASSWORD   || 'Admin@Fresco123';
  const adminName     = process.env.ADMIN_NAME       || 'Fresco Admin';
  const hashed = await bcrypt.hash(adminPassword, 12);

  await query(
    `INSERT INTO users (name, email, password, role)
     VALUES ($1, $2, $3, 'admin')
     ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password, role = 'admin'`,
    [adminName, adminEmail, hashed]
  );
  console.log(`  ✅ Admin user ready: ${adminEmail}`);
  console.log('\n🍗 Database seeded successfully!\n');

  await pool.end();
};

seed().catch(err => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});