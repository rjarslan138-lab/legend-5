# GarmentFlow — Phase 1 MVP
> **B2B Operating System for Garment Manufacturers (Pakistan-first)**  
> End-to-end traceability from raw fabric receiving to warehouse bin, customer order fulfillment, and payment.

---

## 🏭 Core Innovation: Traceability from Yarn to Payment
Factories traditionally run on fragmented notebooks, WhatsApp chats, and disconnected Excel sheets. GarmentFlow connects every finished SKU back to its exact lineage:
```
Raw Fabric Roll/Weight (Sitara/Kohinoor) 
    ↳ Dye/Yarn Batch (e.g. B-2409) 
        ↳ Finished SKU & Size (e.g. Kids Hoodie 92204, 0–5Y) 
            ↳ Warehouse Bin/Rack (e.g. A-03 / Rack 7) 
                ↳ Customer Order (e.g. SHOP-1842) 
                    ↳ Payment Status & Cash Reconciliation (Pending / Paid)
```

---

## 🛠️ Tech Stack

### Frontend (`/client`)
- **Next.js 14** (App Router, TypeScript)
- **Redux Toolkit + RTK Query** (Auto token refresh on 401, multi-tag cache invalidation)
- **react-icons** (Industrial icons across all modules)
- **Tailwind CSS** (Industrial modern slate & deep teal design system)
- **react-hook-form + zod** (Accessible form validation)
- **Recharts** (Sales trends, top products & sizes breakdown)
- **react-hot-toast** (Status alerts)

### Backend (`/server`)
- **Node.js + Express** (TypeScript)
- **PostgreSQL + Prisma ORM** (Multi-tenant relational architecture with `organizationId` on all business models)
- **bcryptjs** (Password hashing, salt rounds 12)
- **jsonwebtoken** (15-minute access token + 7-day refresh token in `httpOnly, sameSite` cookies)
- **Zod** (Input validation middleware on every endpoint)
- **Helmet, CORS, Morgan, Express-Rate-Limit**
- **Jest + Supertest** (Auth, tenant isolation, orders & atomic stock movement tests)

---

## 🚀 Quick Setup & Installation

### 1. Prerequisites
- **Node.js** v18+ or v20+ / v24+
- A PostgreSQL database (e.g. **Neon**, **Supabase**, or local Docker / PostgreSQL service)

### 2. Configure Environment Variables

#### Backend (`server/.env`):
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
DATABASE_URL="postgresql://user:password@ep-your-neon-id.region.neon.tech/neondb?sslmode=require"
JWT_ACCESS_SECRET="garmentflow_jwt_access_secret_super_secure_key_123"
JWT_REFRESH_SECRET="garmentflow_jwt_refresh_secret_super_secure_key_456"
```

#### Frontend (`client/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

---

### 3. Install Dependencies
Run from the repository root:
```bash
npm install
```
Or separately:
```bash
cd server && npm install
cd ../client && npm install
```

---

### 4. Run Prisma Migrations & Seed Data
Push the database schema to your Neon / PostgreSQL instance and populate with realistic Pakistani garment factory data:
```bash
cd server
npx prisma db push
npm run seed
```

---

### 5. Start Development Servers
From the root directory:
```bash
npm run dev
```
- **Frontend:** [http://localhost:3000](http://localhost:3000)
- **Backend API:** [http://localhost:5000/api/v1](http://localhost:5000/api/v1)

---

## 🔑 Demo Accounts (Pre-Seeded)

All seeded accounts use password: `Password@123`

| Role | Email | Capabilities |
| :--- | :--- | :--- |
| **OWNER** | `owner@garmentflow.pk` | Full administrative control, staff accounts, all operations |
| **STOREKEEPER** | `storekeeper@garmentflow.pk` | Fabric receiving, stock intake, rack-to-rack transfers, damaged write-offs |
| **SALES** | `sales@garmentflow.pk` | Customer ledger, create & confirm orders, record payments |
| **PRODUCTION** | `production@garmentflow.pk` | Supervisor account (read-only in Phase 1 MVP) |

---

## 🎯 Testing the Investor Deck Scenario

1. Log in with **`owner@garmentflow.pk`**
2. Click **SKU Traceability** in the sidebar (or visit `/trace`)
3. The flagship card for **Product 92204** loads instantly:
   - **SKU:** `92204` (Kids Fleece Hoodie, 0–5Y, Navy Blue)
   - **Raw Fabric Lot:** `B-2409` (Heavy Fleece, Sitara Textiles Ltd, 42 kg)
   - **Warehouse Bin:** `A-03 / Rack 7`
   - **Customer Order:** `SHOP-1842` (Al-Karam Kids Boutique, Faisalabad)
   - **Payment Status:** `PENDING`

---

## 🧪 Running Automated Tests
```bash
cd server
npm test
```
The test suite validates:
- Registration, login, JWT token issuance, and strict **tenant boundary isolation** (Organization A cannot access Organization B data)
- Atomic **stock movements**, bin transfers, and prevention of negative inventory
- Order lifecycle, **automatic stock reservation/deduction on confirmation**, and payment status recalculation (`PENDING` → `PARTIAL` → `PAID`)

---

## 📡 REST API Summary (`/api/v1`)

| Method | Endpoint | Description | Role Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | Register new organization + Owner | Public |
| `POST` | `/auth/login` | Login and set httpOnly cookies | Public |
| `POST` | `/auth/refresh` | Refresh access token | Public |
| `POST` | `/auth/logout` | Clear auth cookies | Authenticated |
| `GET` | `/auth/me` | Current user profile | Authenticated |
| `GET, POST` | `/users` | List / create staff users | `OWNER` |
| `GET, POST` | `/warehouses` | List / create warehouses | Authenticated |
| `GET, POST` | `/inventory` | Fabric batches, filters, totals | Authenticated |
| `GET, POST` | `/products` | Styles, size matrices, low-stock | Authenticated |
| `GET` | `/stock` | Stock positions by rack | Authenticated |
| `POST` | `/stock/receive` | Intake finished goods into rack | `STOREKEEPER`, `OWNER` |
| `POST` | `/stock/transfer` | Move stock between two racks | `STOREKEEPER`, `OWNER` |
| `POST` | `/stock/damaged` | Record damaged pieces write-off | `STOREKEEPER`, `OWNER` |
| `GET` | `/stock/movements`| Immutable ledger audit log | Authenticated |
| `GET, POST` | `/customers` | Customers & ledger calculations | Authenticated |
| `GET, POST` | `/orders` | Create draft, list orders | Authenticated |
| `POST` | `/orders/:id/confirm` | Confirm order & deduct stock | Authenticated |
| `POST` | `/orders/:id/payments`| Record customer payment | Authenticated |
| `GET` | `/trace/sku/:sku`| **Full lineage trace for SKU** | Authenticated |
| `GET` | `/dashboard/summary` | KPIs & 6 factory answers | Authenticated |
