# 🍗 Fresco Fried Chicken Egypt — Full-Stack Web App (PostgreSQL)

A production-ready food ordering platform built with:
**React + Tailwind CSS** (frontend) · **Node.js + Express** (backend) · **PostgreSQL** (database)

---

## 📁 Project Structure

```
fresco/
├── backend/
│   ├── db/
│   │   ├── pool.js             # pg Pool connection (singleton)
│   │   ├── migrate.js          # Creates all tables, indexes, triggers
│   │   └── seed.js             # Inserts menu items + admin user
│   ├── middleware/auth.js       # JWT protect + adminOnly
│   ├── models/
│   │   ├── User.js             # SQL helpers for users table
│   │   ├── MenuItem.js         # SQL helpers for menu_items table
│   │   └── Order.js            # SQL helpers + transactions for orders
│   ├── routes/
│   │   ├── auth.js             # /api/auth
│   │   ├── menu.js             # /api/menu
│   │   ├── orders.js           # /api/orders
│   │   ├── admin.js            # /api/admin
│   │   └── contact.js          # /api/contact
│   ├── .env.example
│   ├── Dockerfile
│   ├── package.json
│   └── server.js
│
├── frontend/                   # React + Vite + Tailwind (unchanged)
│   └── src/...
│
├── docker-compose.yml          # postgres + backend + nginx
└── README.md
```

---

## 🗄️ PostgreSQL Schema

### users
| Column     | Type         | Notes                      |
|------------|--------------|----------------------------|
| id         | SERIAL PK    |                            |
| name       | VARCHAR(100) | NOT NULL                   |
| email      | VARCHAR(255) | UNIQUE NOT NULL            |
| password   | VARCHAR(255) | bcrypt hash                |
| phone      | VARCHAR(30)  |                            |
| street     | VARCHAR(255) |                            |
| city       | VARCHAR(100) |                            |
| area       | VARCHAR(100) |                            |
| role       | VARCHAR(20)  | 'customer' \| 'admin'      |
| is_active  | BOOLEAN      | DEFAULT TRUE               |
| created_at | TIMESTAMPTZ  | DEFAULT NOW()              |
| updated_at | TIMESTAMPTZ  | auto-updated via trigger   |

### menu_items
| Column      | Type          | Notes                              |
|-------------|---------------|------------------------------------|
| id          | SERIAL PK     |                                    |
| name        | VARCHAR(150)  | NOT NULL                           |
| description | TEXT          |                                    |
| price       | NUMERIC(10,2) | CHECK price >= 0                   |
| category    | VARCHAR(50)   | CHECK IN (...5 categories...)      |
| image       | VARCHAR(500)  |                                    |
| is_available| BOOLEAN       | DEFAULT TRUE                       |
| is_featured | BOOLEAN       | DEFAULT FALSE                      |
| spicy_level | SMALLINT      | 0–3                                |
| calories    | INTEGER       |                                    |
| tags        | TEXT[]        | PostgreSQL array                   |
| sort_order  | INTEGER       | DEFAULT 0                          |
| created_at  | TIMESTAMPTZ   |                                    |
| updated_at  | TIMESTAMPTZ   | auto-updated via trigger           |

### orders
| Column            | Type          | Notes                             |
|-------------------|---------------|-----------------------------------|
| id                | SERIAL PK     |                                   |
| order_number      | VARCHAR(20)   | UNIQUE — auto: FRE00001           |
| user_id           | INTEGER FK    | → users(id), nullable (guests)    |
| customer_name     | VARCHAR(150)  |                                   |
| customer_email    | VARCHAR(255)  |                                   |
| customer_phone    | VARCHAR(50)   |                                   |
| delivery_street   | VARCHAR(255)  |                                   |
| delivery_city     | VARCHAR(100)  |                                   |
| delivery_area     | VARCHAR(100)  |                                   |
| delivery_notes    | TEXT          |                                   |
| subtotal          | NUMERIC(10,2) |                                   |
| delivery_fee      | NUMERIC(10,2) | 0 pickup / 25 delivery            |
| discount          | NUMERIC(10,2) | DEFAULT 0                         |
| total             | NUMERIC(10,2) |                                   |
| payment_method    | VARCHAR(20)   | 'cod' \| 'online'                 |
| payment_status    | VARCHAR(20)   | pending/paid/failed/refunded      |
| order_status      | VARCHAR(30)   | placed/confirmed/.../delivered    |
| order_type        | VARCHAR(20)   | 'delivery' \| 'pickup'            |
| notes             | TEXT          |                                   |
| estimated_delivery| TIMESTAMPTZ   | set to +45 min on creation        |
| delivered_at      | TIMESTAMPTZ   |                                   |
| created_at        | TIMESTAMPTZ   |                                   |
| updated_at        | TIMESTAMPTZ   | auto-updated via trigger          |

### order_items  *(child of orders)*
| Column      | Type          | Notes                       |
|-------------|---------------|-----------------------------|
| id          | SERIAL PK     |                             |
| order_id    | INTEGER FK    | → orders(id) CASCADE DELETE |
| menu_item_id| INTEGER FK    | → menu_items(id) SET NULL   |
| name        | VARCHAR(150)  | snapshot at order time      |
| price       | NUMERIC(10,2) | snapshot at order time      |
| quantity    | INTEGER       | CHECK > 0                   |
| subtotal    | NUMERIC(10,2) |                             |

### order_status_history  *(audit log)*
| Column    | Type        | Notes                       |
|-----------|-------------|-----------------------------|
| id        | SERIAL PK   |                             |
| order_id  | INTEGER FK  | → orders(id) CASCADE DELETE |
| status    | VARCHAR(30) |                             |
| note      | TEXT        |                             |
| created_at| TIMESTAMPTZ |                             |

---

## 🚀 Local Development Setup

### Prerequisites
- **Node.js** v18+
- **PostgreSQL** v14+ running locally

#### Quick PostgreSQL setup (if not installed)

**macOS:**
```bash
brew install postgresql@16
brew services start postgresql@16
```

**Ubuntu/Debian:**
```bash
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Windows:** Download installer from https://www.postgresql.org/download/windows/

---

### Step 1 — Create the database and user

```bash
# Connect as postgres superuser
psql -U postgres

# Inside psql:
CREATE DATABASE fresco_db;
CREATE USER fresco_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE fresco_db TO fresco_user;
\q
```

---

### Step 2 — Install dependencies

```bash
cd backend  && npm install
cd ../frontend && npm install
```

---

### Step 3 — Configure environment

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:
```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=fresco_db
DB_USER=fresco_user
DB_PASSWORD=your_password

JWT_SECRET=replace_with_a_long_random_string_32_chars_min
JWT_EXPIRE=30d

ADMIN_NAME=Fresco Admin
ADMIN_EMAIL_SEED=admin@frescoegypt.com
ADMIN_PASSWORD=Admin@Fresco123
```

---

### Step 4 — Run migrations (creates all tables)

```bash
cd backend
node db/migrate.js
```

Expected output:
```
🔄 Running migrations...
  ✅ users table ready
  ✅ menu_items table ready
  ✅ orders table ready
  ✅ order_items table ready
  ✅ order_status_history table ready
  ✅ Indexes created
  ✅ updated_at triggers set

🎉 All migrations complete!
```

---

### Step 5 — Seed the database

```bash
node db/seed.js
```

Expected output:
```
🌱 Seeding database...
  🗑️  Existing seed data cleared
  ✅ 9 menu items inserted
  ✅ Admin user ready: admin@frescoegypt.com

🍗 Database seeded successfully!
```

Or run both in one go:
```bash
npm run migrate && npm run seed
```

---

### Step 6 — Start both servers

**Terminal 1 — Backend:**
```bash
cd backend && npm run dev      # → http://localhost:5000
```

**Terminal 2 — Frontend:**
```bash
cd frontend && npm run dev     # → http://localhost:3000
```

Open **http://localhost:3000** 🎉

---

## 🔑 Admin Login

| Email                 | Password        |
|-----------------------|-----------------|
| admin@frescoegypt.com | Admin@Fresco123 |

Dashboard: `/admin`

---

## 🌐 API Reference

### Auth — `/api/auth`
| Method | Path       | Auth   | Description         |
|--------|------------|--------|---------------------|
| POST   | /register  | —      | Register customer   |
| POST   | /login     | —      | Login → JWT token   |
| GET    | /me        | Bearer | Current user        |
| PUT    | /profile   | Bearer | Update profile      |

### Menu — `/api/menu`
| Method | Path   | Auth  | Description          |
|--------|--------|-------|----------------------|
| GET    | /      | —     | All available items  |
| GET    | /:id   | —     | Single item          |
| POST   | /      | Admin | Create item          |
| PUT    | /:id   | Admin | Update item          |
| DELETE | /:id   | Admin | Delete item          |

Query params: `?category=Burgers` · `?featured=true`

### Orders — `/api/orders`
| Method | Path              | Auth     | Description         |
|--------|-------------------|----------|---------------------|
| POST   | /                 | Optional | Place new order     |
| GET    | /my               | Bearer   | My order history    |
| GET    | /track/:number    | —        | Track by order #    |

### Admin — `/api/admin`
| Method | Path                | Auth  | Description            |
|--------|---------------------|-------|------------------------|
| GET    | /dashboard          | Admin | Stats overview         |
| GET    | /orders             | Admin | All orders, paginated  |
| PUT    | /orders/:id/status  | Admin | Update order status    |
| GET    | /users              | Admin | All customers          |
| GET    | /menu               | Admin | All items (incl. hidden)|

---

## 🐳 Docker Deployment

```bash
# Start PostgreSQL + backend + frontend (nginx)
docker-compose up --build -d

# Run migrations inside the container (first time only)
docker exec fresco_backend node db/migrate.js

# Seed the database (first time only)
docker exec fresco_backend node db/seed.js

# Visit http://localhost
```

Stop: `docker-compose down`
Wipe data: `docker-compose down -v`

---

## ☁️ Cloud Deployment

### Option A — Render.com

**PostgreSQL:** Render > New > PostgreSQL (free tier) → copy the **Internal Database URL**.

**Backend (Web Service):**
- Root dir: `backend`
- Build: `npm install && node db/migrate.js && node db/seed.js`
- Start: `node server.js`
- Env vars: `DATABASE_URL` (from Render), `JWT_SECRET`, `NODE_ENV=production`

**Frontend (Static Site):**
- Root dir: `frontend`
- Build: `npm install && npm run build`
- Publish: `dist`
- Env: `VITE_API_URL=https://your-backend.onrender.com/api`

### Option B — Supabase (managed Postgres) + Render/Railway backend

1. Create project at https://supabase.com — get the **connection string** (Transaction pooler).
2. Set `DATABASE_URL` in backend env.
3. Run `node db/migrate.js` once to create tables.
4. Deploy backend to Render/Railway/Fly.io.

### Option C — VPS (Ubuntu)

```bash
# Install Postgres
sudo apt install postgresql postgresql-contrib
sudo -u postgres psql -c "CREATE DATABASE fresco_db;"
sudo -u postgres psql -c "CREATE USER fresco_user WITH PASSWORD 'secure_pass';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE fresco_db TO fresco_user;"

# Deploy app
git clone https://github.com/your/fresco.git /var/www/fresco
cd /var/www/fresco/backend
npm install
# set .env then:
node db/migrate.js && node db/seed.js
pm2 start server.js --name fresco-api && pm2 save

# Build frontend
cd ../frontend && npm install && npm run build
sudo cp -r dist/* /var/www/html/

# SSL with certbot
sudo certbot --nginx -d your-domain.com
```

---

## 📦 Pre-Seeded Menu

| Item                  | Category      | Price  |
|-----------------------|---------------|--------|
| Classic Fried Chicken | Fried Chicken | EGP 70 |
| Spicy Crispy Chicken  | Fried Chicken | EGP 75 |
| Chicken Burger        | Burgers       | EGP 50 |
| Cheese Burger         | Burgers       | EGP 55 |
| Fries                 | Sides         | EGP 25 |
| Coleslaw              | Sides         | EGP 20 |
| Pepsi                 | Drinks        | EGP 15 |
| Fresh Juice           | Drinks        | EGP 20 |
| Chocolate Cake        | Desserts      | EGP 35 |

---

## 🛠️ Tech Stack

| Layer     | Technology                                       |
|-----------|--------------------------------------------------|
| Frontend  | React 18, Vite, Tailwind CSS, Framer Motion      |
| Backend   | Node.js 20, Express 4                            |
| Database  | **PostgreSQL 16** + node-postgres (`pg`)         |
| Auth      | JSON Web Tokens + bcryptjs                       |
| Security  | Helmet, express-rate-limit, express-validator    |
| Container | Docker, Docker Compose, nginx                    |

---

*Made with ❤️ and 🌶️ — Fresco Fried Chicken Egypt*
# fresco
# food-delivery
# food-delivery
