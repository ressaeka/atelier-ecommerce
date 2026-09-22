# Atelier E-Commerce

Full-stack e-commerce application dengan frontend React dan backend RESTful API berbasis NestJS.

Project ini menggunakan **React + Vite** untuk frontend dan **NestJS + Prisma + PostgreSQL + Redis** untuk backend, serta Docker Compose untuk menjalankan seluruh infrastructure secara konsisten.

---

## 🚀 Tech Stack

### Frontend

* React 18
* TypeScript
* Vite
* React Router
* Axios
* Tailwind CSS

### Backend

* NestJS 11
* TypeScript
* Prisma ORM 7
* PostgreSQL
* Redis
* JWT / Passport
* Zod
* bcrypt
* Resend
* Swagger / OpenAPI

### Infrastructure

* Docker
* Docker Compose
* Nginx
* PostgreSQL 16
* Redis 7
* Node.js 22

---

## 📁 Project Structure

```text
Ecommerce/
│
├── atelier/                    # Frontend React + Vite
│   ├── src/
│   ├── public/
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
│
├── atelier-api/                # Backend NestJS
│   ├── prisma/
│   │   ├── migrations/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   │
│   ├── src/
│   │   ├── auth/
│   │   ├── category/
│   │   ├── product/
│   │   ├── users/
│   │   ├── order/
│   │   ├── cart/
│   │   ├── wishlist/
│   │   ├── address/
│   │   ├── common/
│   │   ├── config/
│   │   ├── prisma/
│   │   ├── app.module.ts
│   │   └── main.ts
│   │
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml
├── .env
└── .gitignore
```

Frontend dan backend **tetap dipisahkan sebagai dua application**, tetapi dikelola dalam satu repository.

---

# 🐳 Menjalankan dengan Docker

## Prasyarat

Pastikan sudah terinstall:

* Docker Desktop
* Git

Tidak perlu menginstall PostgreSQL atau Redis secara manual jika menggunakan Docker Compose.

---

## 1. Clone Repository

```bash
git clone <repository-url>
cd Ecommerce
```

---

## 2. Konfigurasi Environment

Buat file `.env` di root project:

```text
Ecommerce/
└── .env
```

Contoh:

```env
# PostgreSQL
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-postgres-password
POSTGRES_DB=ecommerce-api

# Application
NODE_ENV=production
HOST=0.0.0.0
PORT=4000

# Database
DATABASE_URL=postgresql://postgres:your-postgres-password@postgres:5432/ecommerce-api

# Redis
REDIS_URL=redis://redis:6379

# JWT
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=15m

JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRES_IN=7d

JWT_RESET_SECRET=your-reset-secret

# OTP
OTP_PEPPER=your-otp-pepper

# Resend
RESEND_API_KEY=your-resend-api-key
MAIL_FROM=Atelier <noreply@yourdomain.com>

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:4000/api/v1/auth/google/callback
GOOGLE_FRONTEND_URL=http://localhost:3000

# Frontend
VITE_API_URL=http://localhost:4000
```

> **Jangan commit `.env` ke repository.** Gunakan `.env.example` untuk template environment variable tanpa credential asli.

---

## 3. Jalankan Seluruh Application

Dari root project:

```bash
docker compose up -d
```

Docker Compose akan menjalankan:

```text
atelier-frontend
atelier-backend
atelier-postgres
atelier-redis
```

Untuk melihat status container:

```bash
docker compose ps
```

Untuk melihat log:

```bash
docker compose logs -f
```

Atau berdasarkan service:

```bash
docker compose logs -f backend
docker compose logs -f frontend
```

---

# 🌐 Application URLs

Setelah container berjalan:

| Service     | URL                            |
| ----------- | ------------------------------ |
| Frontend    | http://localhost:3000          |
| Backend API | http://localhost:4000/api/v1   |
| Swagger     | http://localhost:4000/api/docs |
| PostgreSQL  | localhost:5432                 |
| Redis       | localhost:6379                 |

> PostgreSQL dan Redis digunakan oleh container backend melalui Docker network menggunakan hostname `postgres` dan `redis`.

---

# 🏗️ Architecture

Secara sederhana:

```text
                    Browser
                       │
                       │
                       ▼
             ┌──────────────────┐
             │  React Frontend  │
             │    Port 3000     │
             └────────┬─────────┘
                      │
                      │ HTTP
                      ▼
             ┌──────────────────┐
             │  NestJS Backend  │
             │    Port 4000     │
             └───────┬─────┬────┘
                     │     │
             ┌───────┘     └────────┐
             ▼                      ▼
      ┌─────────────┐        ┌─────────────┐
      │ PostgreSQL  │        │    Redis    │
      │   Port 5432 │        │   Port 6379 │
      └─────────────┘        └─────────────┘
```

Frontend berkomunikasi dengan backend melalui:

```text
http://localhost:4000/api/v1
```

Sedangkan backend berkomunikasi dengan database menggunakan hostname Docker:

```text
postgres:5432
```

dan Redis:

```text
redis:6379
```

---

# 🔐 Authentication & Security

Backend menyediakan sistem authentication menggunakan JWT.

Fitur authentication meliputi:

* Register
* Login
* Refresh token
* Refresh token rotation
* Token family
* Refresh token reuse detection
* Logout
* Forgot password
* OTP verification
* Reset password
* Password hashing menggunakan bcrypt
* Rate limiting
* Redis-based session management

Authentication mendukung login menggunakan:

* Username
* Email
* Nomor telepon

---

# 👤 User Management

User dapat:

* Melihat profile sendiri
* Mengubah profile sendiri

Admin dapat:

* Melihat daftar user
* Pagination
* Search user
* Melihat detail user
* Mengubah user
* Menghapus user

---

# 🛡️ Role-Based Access Control

Terdapat dua role utama:

```text
USER
ADMIN
```

Backend menggunakan:

* `RolesGuard`
* `PermissionsGuard`
* JWT authentication guard

Contoh akses:

| Fitur           | USER | ADMIN |
| --------------- | :--: | :---: |
| Profile         |   ✅  |   ✅   |
| Read Category   |   ✅  |   ✅   |
| Manage Category |   ❌  |   ✅   |
| Read Product    |   ✅  |   ✅   |
| Manage Product  |   ❌  |   ✅   |
| User Management |   ❌  |   ✅   |

---

# 🏷️ Category

Endpoint utama:

| Method | Endpoint        | Access        |
| ------ | --------------- | ------------- |
| GET    | `/category`     | Authenticated |
| GET    | `/category/:id` | Authenticated |
| POST   | `/category`     | Admin         |
| PATCH  | `/category/:id` | Admin         |
| DELETE | `/category/:id` | Admin         |

Category mendukung pagination dan pencarian.

---

# 📦 Product

Endpoint utama:

| Method | Endpoint       | Access        |
| ------ | -------------- | ------------- |
| GET    | `/product`     | Authenticated |
| GET    | `/product/:id` | Authenticated |
| POST   | `/product`     | Admin         |
| PATCH  | `/product/:id` | Admin         |
| DELETE | `/product/:id` | Admin         |

Product mendukung:

* Pagination
* Text search
* Category filtering
* Minimum price
* Maximum price

Contoh:

```text
GET /api/v1/product
GET /api/v1/product?search=shirt
GET /api/v1/product?categoryId=1
GET /api/v1/product?minPrice=100000&maxPrice=500000
```

---

# 🛒 Cart

Cart digunakan untuk menyimpan produk yang akan dibeli oleh user.

Flow utama:

```text
Product
   ↓
Add to Cart
   ↓
Cart
   ↓
Checkout
   ↓
Order
```

Cart memiliki hubungan dengan user dan cart items.

---

# ❤️ Wishlist

User dapat menyimpan product ke wishlist.

Flow:

```text
Product
   ↓
Add to Wishlist
   ↓
Wishlist
   ↓
Remove from Wishlist
```

Wishlist bersifat user-specific.

---

# 📦 Order & Checkout

Order digunakan untuk merepresentasikan transaksi yang dibuat dari cart.

Flow dasar:

```text
Cart
 ↓
Checkout
 ↓
Order
 ↓
Payment
```

Checkout diproses menggunakan database transaction untuk menjaga konsistensi data.

Contohnya:

```text
1. Ambil cart user
2. Validasi cart
3. Validasi product
4. Membuat order
5. Membuat order items
6. Menghitung total
7. Mengubah status cart
```

---

# 📍 Address

User dapat memiliki address yang digunakan untuk kebutuhan pengiriman.

Address mendukung konsep:

```text
isDefault
```

sehingga user dapat menentukan satu alamat utama.

---

# 📧 Email

Email service menggunakan Resend.

Digunakan terutama untuk:

* Password reset
* OTP verification

API key Resend disimpan melalui environment variable:

```env
RESEND_API_KEY=...
```

---

# ⚡ Redis

Redis digunakan untuk kebutuhan yang membutuhkan data cepat dan sementara.

Penggunaan Redis meliputi:

* Refresh token session
* Token family
* Refresh token reuse detection
* OTP
* Rate limiting
* Cache

Backend terhubung ke Redis melalui:

```env
REDIS_URL=redis://redis:6379
```

ketika berjalan menggunakan Docker Compose.

---

# 🗄️ Database

Database utama menggunakan PostgreSQL dan dikelola menggunakan Prisma ORM.

Schema berada di:

```text
atelier-api/prisma/schema.prisma
```

Migration berada di:

```text
atelier-api/prisma/migrations/
```

Untuk membuat migration baru:

```bash
npx prisma migrate dev
```

Untuk generate Prisma Client:

```bash
npx prisma generate
```

---

# 📚 API Documentation

Swagger tersedia di:

```text
http://localhost:4000/api/docs
```

Swagger menyediakan dokumentasi interaktif untuk endpoint REST API.

---

# 🔌 API Base URL

Global prefix backend:

```text
/api/v1
```

Base URL:

```text
http://localhost:4000/api/v1
```

Contoh:

```http
GET http://localhost:4000/api/v1/product
```

---

# 🧪 Development Tanpa Docker

Jika ingin menjalankan backend secara langsung:

```bash
cd atelier-api
npm install
npm run start:dev
```

Frontend:

```bash
cd atelier
npm install
npm run dev
```

Pastikan PostgreSQL dan Redis tersedia secara lokal atau tetap dijalankan menggunakan Docker.

---

# 🏭 Production Build

Backend:

```bash
cd atelier-api
npm run build
npm run start:prod
```

Frontend:

```bash
cd atelier
npm run build
```

Untuk menjalankan keseluruhan application menggunakan production container:

```bash
docker compose up -d --build
```

---

# 🛑 Stop Application

Untuk menghentikan container:

```bash
docker compose down
```

Untuk menghentikan container sekaligus menghapus volume database:

```bash
docker compose down -v
```

> **Perhatian:** `docker compose down -v` akan menghapus volume PostgreSQL sehingga data database di volume tersebut ikut terhapus.

---

# 🔒 Environment & Secrets

Credential sensitif tidak boleh disimpan langsung di source code.

Contoh data yang harus dirahasiakan:

```text
DATABASE_URL
POSTGRES_PASSWORD
JWT_SECRET
JWT_REFRESH_SECRET
JWT_RESET_SECRET
OTP_PEPPER
RESEND_API_KEY
GOOGLE_CLIENT_SECRET
```

Gunakan:

```text
.env
```

untuk nilai environment lokal dan:

```text
.env.example
```

sebagai template yang aman untuk repository.

---

# 📄 License

This project is currently marked as:

```text
UNLICENSED
```
