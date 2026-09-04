# Atelier E-Commerce RESTful API

Backend RESTful API untuk platform e-commerce yang dibangun menggunakan **NestJS**, **Prisma ORM**, **PostgreSQL**, **Redis**, dan **Resend**. Dilengkapi dengan sistem autentikasi JWT modern (Access Token & Refresh Token Family), Role-Based Access Control (RBAC) berbasis granular permission, rate limiting, serta dokumentasi interaktif **Swagger / OpenAPI**.

---

## 🚀 Fitur Utama

- **Authentication & Security**:
  - Registrasi & Login multi-identitas (username, email, atau nomor telepon).
  - JWT Authentication dengan Access Token (short-lived) dan Refresh Token Rotation.
  - **Token Family & Reuse Detection** menggunakan Redis untuk mencegah pencurian sesi refresh token.
  - Reset Password via OTP email menggunakan Resend API dengan proteksi OTP pepper & brute-force rate limit.
  - Password hashing menggunakan `bcrypt`.
- **Role-Based Access Control (RBAC)**:
  - Role: `ADMIN` dan `USER`.
  - Granular Permission Guard (`PermissionsGuard`) & Role Guard (`RolesGuard`).
- **User Management**:
  - Ambil & update profil diri (`/users/me`).
  - Manajemen akun pengguna oleh Admin (List user dengan paginasi & pencarian, detail user, update, hapus user).
- **Category Management**:
  - List kategori dengan paginasi & pencarian.
  - Create, Update, Delete kategori produk (khusus Admin).
- **Product Management**:
  - List produk dengan filter kategori, rentang harga (min & max price), paginasi, dan pencarian teks.
  - Create, Update, Delete produk (khusus Admin).
- **Rate Limiting & Caching**:
  - Rate limiting berbasis IP & identitas di Redis untuk login, permintaan OTP, dan verifikasi OTP.
- **Validation & Documentation**:
  - Validasi schema request DTO menggunakan **Zod**.
  - Dokumentasi API interaktif menggunakan **Swagger UI**.

---

## 🛠️ Tech Stack

- **Framework**: [NestJS](https://nestjs.com/) (v11) - Node.js (TypeScript, ES Modules)
- **Database**: [PostgreSQL](https://www.postgresql.org/)
- **ORM**: [Prisma ORM](https://www.prisma.io/) (v7) dengan `@prisma/adapter-pg`
- **In-Memory Store / Cache**: [Redis](https://redis.io/) (`ioredis`)
- **Email Service**: [Resend](https://resend.com/)
- **Validation**: [Zod](https://zod.dev/)
- **Documentation**: [Swagger / OpenAPI](https://swagger.io/)

---

## 📋 Prasyarat Sistem

Pastikan software berikut telah terinstal pada mesin pengembangan:
- **Node.js**: Versi 20.x atau lebih baru
- **PostgreSQL**: Port default `5432`
- **Redis**: Port default `6379`

---

## ⚙️ Instalasi & Setup

### 1. Clone Repository & Install Dependencies
```bash
git clone <repository-url>
cd atelier-api
npm install
```

### 2. Konfigurasi Environment Variable
Salin template `.env.example` ke `.env` (atau sesuaikan file `.env`):
```env
PORT=4000
HOST=localhost
NODE_ENV=development

# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/ecommerce-api?schema=public"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT Secrets & Expiry
JWT_SECRET="your-jwt-access-secret"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_SECRET="your-jwt-refresh-secret"
JWT_REFRESH_EXPIRES_IN="7d"
JWT_RESET_SECRET="your-jwt-reset-secret"

# OTP Security
OTP_PEPPER="your-secure-otp-pepper"

# Resend Email Service
RESEND_API_KEY="re_your_resend_api_key"
MAIL_FROM="Atelier <noreply@yourdomain.com>"
```

### 3. Migrasi Database & Seeding
Jalankan migrasi Prisma untuk membuat tabel database:
```bash
npx prisma migrate dev
```

Jalankan database seed untuk membuat user default **Admin**:
```bash
npx tsx prisma/seed.ts
```

> **Kredensial Default Admin:**
> - **Username**: `admin123`
> - **Password**: `Admin123!`
> - **Email**: `admin@example.com`
> - **Role**: `ADMIN`

---

## 🏃 Menjalankan Aplikasi

### Development Mode (Watch Mode)
```bash
npm run start:dev
```

### Production Mode
```bash
npm run build
npm run start:prod
```

Aplikasi akan berjalan di:
- **API Base URL**: `http://localhost:4000/api/v1`
- **Swagger Documentation**: `http://localhost:4000/api/docs`

---

## 📖 Ringkasan Endpoint API

Global URL Prefix: `/api/v1`

### 🔐 Authentication (`/auth`)
| Method | Endpoint | Deskripsi | Akses |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | Mendaftarkan user baru | Public |
| `POST` | `/auth/login` | Login menggunakan email / username / phone | Public |
| `POST` | `/auth/refresh` | Memperbarui access token dengan refresh token | Public |
| `POST` | `/auth/forgot` | Mengirim OTP reset password ke email | Public (Rate-limited) |
| `POST` | `/auth/verify-otp` | Verifikasi OTP reset password | Public (Rate-limited) |
| `POST` | `/auth/reset-password`| Mereset password dengan resetToken | Public |
| `POST` | `/auth/logout` | Logout dan mencabut sesi refresh token | Public |

### 👤 Users (`/users`)
| Method | Endpoint | Deskripsi | Akses |
| :--- | :--- | :--- | :--- |
| `GET` | `/users/me` | Mengambil profil user yang sedang login | Authenticated |
| `PATCH`| `/users/me` | Memperbarui profil user yang sedang login | Authenticated |
| `GET` | `/users` | Daftar seluruh user (paginasi & pencarian) | **Admin Only** |
| `GET` | `/users/:id` | Detail data user berdasarkan ID | **Admin Only** |
| `PATCH`| `/users/:id` | Memperbarui data user berdasarkan ID | **Admin Only** |
| `DELETE`| `/users/:id`| Menghapus user berdasarkan ID | **Admin Only** |

### 🏷️ Category (`/category`)
| Method | Endpoint | Deskripsi | Akses |
| :--- | :--- | :--- | :--- |
| `GET` | `/category` | Daftar semua kategori | Authenticated |
| `GET` | `/category/:id` | Detail kategori berdasarkan ID | Authenticated |
| `POST` | `/category` | Membuat kategori baru | **Admin Only** |
| `PATCH`| `/category/:id` | Memperbarui kategori | **Admin Only** |
| `DELETE`| `/category/:id`| Menghapus kategori | **Admin Only** |

### 📦 Product (`/product`)
| Method | Endpoint | Deskripsi | Akses |
| :--- | :--- | :--- | :--- |
| `GET` | `/product` | Daftar produk (search, filter harga & kategori) | Authenticated |
| `GET` | `/product/:id` | Detail produk berdasarkan ID | Authenticated |
| `POST` | `/product` | Membuat produk baru | **Admin Only** |
| `PATCH`| `/product/:id` | Memperbarui informasi produk | **Admin Only** |
| `DELETE`| `/product/:id` | Menghapus produk | **Admin Only** |

---

## 🛡️ Hak Akses Role & Permissions

| Fitur | Role USER | Role ADMIN |
| :--- | :---: | :---: |
| Profile (Read / Update) | ✅ | ✅ |
| Category (Read) | ✅ | ✅ |
| Category (Create / Update / Delete) | ❌ | ✅ |
| Product (Read) | ✅ | ✅ |
| Product (Create / Update / Delete) | ❌ | ✅ |
| User Management (List / Detail / Update / Delete) | ❌ | ✅ |

---

## 📂 Struktur Direktori Proyek

```plaintext
atelier-api/
├── prisma/
│   ├── schema.prisma       # Skema database PostgreSQL
│   ├── migrations/         # Riwayat migrasi database
│   └── seed.ts             # Script seed data default
├── src/
│   ├── auth/               # Modul autentikasi, JWT, OTP, & rate limiting
│   ├── category/           # Modul manajemen kategori produk
│   ├── common/             # Decorator, Guard (JWT, Role, Permission), Redis, Mail
│   ├── config/             # Validasi env, Swagger, CORS, & Helmet configuration
│   ├── prisma/             # Service Prisma database client
│   ├── product/            # Modul manajemen produk
│   ├── users/              # Modul profil & user management
│   ├── app.module.ts       # Root NestJS module
│   └── main.ts             # Entry point aplikasi
├── package.json
└── README.md
```

---

## 📄 Lisensi

Proyek ini dilisensikan di bawah lisensi [UNLICENSED](LICENSE).
