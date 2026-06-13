# 🍞 RotiHai - Fresh Rotis Delivered to Your Door

[![Node.js](https://img.shields.io/badge/Node.js-16%2B-green?logo=node.js)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.3-blue?logo=react)](https://react.dev/)
[![Express.js](https://img.shields.io/badge/Express-4.21-black?logo=express)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Latest-blue?logo=postgresql)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

> **RotiHai** - A modern food delivery platform specializing in fresh rotis, homestyle meals, and restaurant specials. Built with cutting-edge technology for scalability, reliability, and great user experience.

---

## 🎯 Project Overview

RotiHai is a **full-stack food delivery application** with:
- 🏠 **Customer App** - Order fresh rotis and meals with real-time delivery tracking
- 👨‍💼 **Admin Panel** - Manage products, chefs, orders, deliveries, subscriptions, and analytics
- 👨‍🍳 **Partner Portal** - For chefs/restaurants to manage their offerings and orders
- 🚚 **Delivery Dashboard** - For delivery personnel to accept and complete deliveries
- 📱 **PWA Support** - Works offline and installs like a native app
- 🖼️ **Cloudinary Image Uploads** - Cloud-based image storage for product and chef images
- 🔐 **Role-Based Access Control** - Super Admin, Manager, Viewer, Partner, Delivery roles
- 📊 **Real-time Analytics** - Dashboard with orders, revenue, delivery metrics, visitor tracking
- 🔔 **Multi-channel Notifications** - Push, WhatsApp, Email notifications
- 💳 **GPay/UPI Payment Verification** - Automated payment confirmation via UPI

---

## 🌐 Hosting & Deployment

| Service | Platform | URL |
|---------|----------|-----|
| **Backend (API + SSR)** | Render (Web Service) | https://rotihai-backend.onrender.com |
| **Frontend (Static)** | Served from same Render backend | (bundled with backend) |
| **Database (Production)** | Neon (Serverless PostgreSQL) | `rotihai_prod` on Neon |
| **Database (Development)** | Local PostgreSQL or Neon Dev | `rotihai_dev` on Neon |
| **Image Storage** | Cloudinary | Cloud CDN URLs |
| **Email Service** | Resend | API-based transactional emails |
| **WhatsApp Notifications** | Meta Cloud API (Graph API v21.0) | Template-based messages |
| **Push Notifications** | Web Push (VAPID) | Browser-native push |
| **Monitoring/Keepalive** | UptimeRobot + Self-ping | Prevents Render spindown |

### Deployment Notes
- Backend runs on Render's free tier with a 15-min spindown. Self-ping every 14 min + UptimeRobot every 5 min keep it alive.
- Frontend is built with Vite and served as static files from the Express server (no separate frontend deploy).
- Database uses Neon's serverless PostgreSQL with connection pooling.
- `ENABLE_VITE=true` in `.env` = local dev mode (Vite HMR). Omit or `false` = production mode (serve static build).

---

## 🏗️ Project Architecture

```
Replitrotihai/
│
├── client/                          # Frontend (React + Vite + TypeScript)
│   ├── src/
│   │   ├── components/             # Reusable UI components
│   │   │   ├── admin/              # Admin-specific components
│   │   │   ├── ui/                 # Shadcn/ui primitives
│   │   │   ├── CartSidebar.tsx     # Shopping cart
│   │   │   ├── CheckoutDialog.tsx  # Checkout flow
│   │   │   ├── PaymentQRDialog.tsx # UPI QR payment
│   │   │   ├── ImageUploader.tsx   # Cloudinary image upload
│   │   │   └── ...
│   │   ├── pages/
│   │   │   ├── admin/              # Admin panel (30+ pages)
│   │   │   ├── partner/            # Chef/Partner portal
│   │   │   ├── delivery/           # Delivery personnel dashboard
│   │   │   ├── Home.tsx            # Customer home page
│   │   │   ├── MyOrders.tsx        # Order history
│   │   │   ├── MySubscriptions.tsx # Subscription management
│   │   │   ├── OrderTracking.tsx   # Live order tracking
│   │   │   └── ...
│   │   ├── hooks/                  # Custom React hooks
│   │   ├── contexts/               # React context providers
│   │   ├── store/                  # Zustand state management
│   │   ├── lib/                    # Utility functions
│   │   ├── types/                  # TypeScript type definitions
│   │   └── utils/                  # Helper utilities
│   ├── public/
│   │   └── sw.js                   # Service Worker (PWA offline support)
│   └── index.html
│
├── server/                          # Backend (Express.js + Node.js + TypeScript)
│   ├── index.ts                    # Server entry point, Express setup, middleware
│   ├── routes.ts                   # Main API routes (orders, subscriptions, users, etc.)
│   ├── adminRoutes.ts              # Admin panel API endpoints
│   ├── adminAuth.ts                # Admin JWT authentication
│   ├── partnerAuth.ts              # Partner/Chef JWT authentication
│   ├── deliveryAuth.ts             # Delivery personnel JWT authentication
│   ├── userAuth.ts                 # Customer authentication
│   ├── deliveryRoutes.ts           # Delivery partner API endpoints
│   ├── storage.ts                  # Database abstraction layer (Drizzle ORM queries)
│   ├── imageService.ts             # Cloudinary image upload/delete/serve
│   ├── emailService.ts             # Resend email service (transactional emails)
│   ├── whatsappService.ts          # WhatsApp Cloud API integration
│   ├── pushService.ts              # Web Push notifications (VAPID)
│   ├── websocket.ts                # WebSocket server for real-time updates
│   ├── cronJobs.ts                 # Scheduled background tasks
│   ├── analytics.ts                # Revenue, visitor, and order analytics
│   ├── reports.ts                  # Report generation (revenue, chef, customer)
│   ├── cache.ts                    # In-memory TTL cache (500 entries max)
│   ├── env.ts                      # Environment variable loader (dotenv)
│   ├── vite.ts                     # Vite dev server / static file serving
│   ├── routes/
│   │   └── gpay-verification.ts    # GPay payment verification route
│   ├── services/
│   │   ├── gpayVerificationService.ts  # UPI payment verification logic
│   │   └── chefUnavailabilityService.ts # Chef unavailability management
│   └── utils/
│       └── restaurantStatus.ts     # Restaurant open/close schedule logic
│
├── shared/                          # Shared code (used by both frontend & backend)
│   ├── schema.ts                   # Drizzle ORM database schema (all tables)
│   ├── db.ts                       # PostgreSQL connection pool (pg + Drizzle)
│   ├── deliveryUtils.ts            # Delivery fee calculation (Haversine distance)
│   └── timeFormatter.ts            # Date/time formatting utilities
│
├── migrations/                      # SQL migration files (Drizzle Kit)
│
├── scripts/                         # Utility & maintenance scripts
│   ├── seed.ts                     # Database seeding (sample data)
│   ├── create-admin.ts             # Create admin user
│   ├── create-partner.ts           # Create partner account
│   ├── backup-database.ts          # Database backup
│   ├── restore-database.ts         # Database restore
│   ├── seed-admin-neon.ts          # Seed admin on Neon
│   ├── seed-delivery-slots.ts      # Seed delivery time slots
│   ├── migrate-delivery-areas.ts   # Delivery area migration
│   └── ...                         # Various test & migration scripts
│
├── attached_assets/                 # Static image assets
│   ├── generated_images/           # AI-generated marketing images
│   ├── seed_images/                # Seed data images
│   └── uploads/                    # Legacy local uploads
│
├── package.json                     # Dependencies & npm scripts
├── tsconfig.json                    # TypeScript configuration
├── vite.config.ts                   # Vite bundler config (frontend build)
├── drizzle.config.ts                # Drizzle Kit config (migrations)
└── README.md                        # This file
```

---

## 🛠️ Technology Stack

### Frontend

| Technology | Purpose |
|-----------|---------|
| **React 18.3** | UI library |
| **Vite 5** | Build tool & dev server with HMR |
| **TypeScript 5.9** | Type-safe code |
| **Tailwind CSS 3.4** | Utility-first styling |
| **Shadcn/ui + Radix** | Accessible UI component library |
| **React Query (TanStack) 5** | Server state, caching, background refetching |
| **React Hook Form + Zod** | Form management & schema validation |
| **Zustand** | Client state management |
| **Wouter** | Lightweight routing |
| **Recharts** | Dashboard charts & analytics |
| **Leaflet + React Leaflet** | Map-based delivery tracking |
| **Framer Motion** | UI animations |
| **Lucide React** | Icon library |

### Backend

| Technology | Purpose |
|-----------|---------|
| **Express.js 4.21** | HTTP server & REST API |
| **Node.js 16+** | JavaScript runtime |
| **TypeScript 5.9** | Type-safe backend |
| **Drizzle ORM 0.45** | Type-safe PostgreSQL query builder |
| **pg (node-postgres)** | PostgreSQL connection pool |
| **Multer 2** | Multipart file upload handling |
| **Cloudinary SDK 2.9** | Cloud image storage & CDN |
| **jsonwebtoken** | JWT-based authentication |
| **bcryptjs** | Password hashing |
| **ws** | WebSocket server for real-time features |
| **web-push** | VAPID-based push notifications |
| **Resend** | Transactional email API |
| **node-cron (setInterval)** | Background scheduled tasks |
| **cookie-parser** | HTTP cookie handling |
| **esbuild** | Server bundle for production |

### Database & Storage

| Service | Purpose |
|---------|---------|
| **PostgreSQL 13+** | Primary relational database |
| **Neon** | Serverless PostgreSQL hosting (production) |
| **Local PostgreSQL** | Development database |
| **Cloudinary** | Image CDN & upload storage |
| **Drizzle Kit** | Schema migrations |

---

## 📡 Server Modules (Detailed)

### `server/index.ts` — Main Entry Point
- Express app initialization with middleware (JSON, cookies, CORS, logging)
- Multer file upload configuration (5MB limit, image types only)
- Cache-Control headers (dev = no-cache, prod = intelligent caching per file type)
- Image upload endpoint (`POST /api/upload` → Cloudinary)
- Image serving endpoint (`GET /uploads/:filename`)
- Health check endpoint (`GET /api/health` with optional DB check)
- Auto-creates default admin user on startup
- Partner auth routes (login, refresh, profile, password change)
- Vite dev server setup (when `ENABLE_VITE=true`) or static file serving (production)
- Starts cron jobs and push notification service
- Self-ping keep-alive for Render (every 14 min)
- Runs on port 5000 (configurable via `PORT` env var)

### `server/routes.ts` — Main API Routes
- Customer authentication (register, login, OTP)
- Product & category browsing
- Cart & checkout flow
- Order placement & tracking
- Subscription management (plans, creation, delivery logs, pause/resume)
- Wallet operations (add balance, use for payment)
- Referral system
- Delivery fee calculation (distance-based using Haversine formula)
- Coupon validation & application
- GPay/UPI payment verification
- Visitor tracking
- Newsletter subscriptions

### `server/adminRoutes.ts` — Admin Panel API
- Full CRUD for products, categories, chefs, users
- Order management (status updates, assignment, cancellation)
- Delivery partner management & payouts
- Subscription oversight
- Coupon & promotional banner management
- Analytics & reporting endpoints
- Settings management (delivery, wallet, payment, roti, cart)
- Admin user management (create, roles, password reset)
- Delivery area configuration
- Chef performance metrics
- Notification settings (WhatsApp, push)

### `server/deliveryRoutes.ts` — Delivery Partner API
- Delivery partner login/auth
- View available deliveries
- Claim/accept delivery orders
- Update delivery status (picked up, out for delivery, delivered)
- View delivery history & earnings

### `server/websocket.ts` — Real-Time Communication
- WebSocket server for live updates
- Connected client tracking (admin, chef, delivery, customer)
- Event broadcasting:
  - New order notifications to chefs & admins
  - Order status updates to customers
  - Payment initiated notifications
  - Delivery assignment notifications
  - Subscription delivery broadcasts
  - Chef status updates (available/unavailable)
  - Product availability changes
  - Wallet balance updates
  - Custom subscription request notifications
- Pending broadcast queue for offline clients
- Auto-assignment timeout for delivery orders (broadcasts to all available delivery personnel)

### `server/cronJobs.ts` — Background Scheduled Tasks
Runs every 60 seconds and handles:
- **GPay payment verification** — Re-checks pending UPI payments
- **Subscription auto-resume** — Resumes paused subscriptions on scheduled dates
- **Daily delivery log generation** — Creates subscription delivery entries for today
- **Next delivery date updates** — Calculates next delivery dates
- **2-hour order reminders** — Sends WhatsApp reminders before scheduled deliveries
- **Stale delivery marking** — Marks undelivered orders as "missed" after cutoff
- **Pending payment expiry** — Cancels orders with unconfirmed payments after timeout
- **Auto-schedule transitions** — Manages subscription status based on schedule

### `server/imageService.ts` — Cloudinary Image Management
- Upload images to Cloudinary with auto-optimization
- File validation (type: JPEG/PNG/WebP/GIF, size: max 5MB)
- Delete images from Cloudinary by public_id
- Image URL resolution (Cloudinary URLs or legacy local paths)
- Replace image (upload new, delete old)

### `server/emailService.ts` — Email Notifications (Resend)
- Welcome emails
- Password reset emails (customer & admin)
- Order confirmation emails (customer & admin)
- Missed delivery notification emails
- HTML email templates with inline styling

### `server/whatsappService.ts` — WhatsApp Notifications (Meta Cloud API)
- Template-based messages via Graph API v21.0
- Text message sending
- Notifications: order placed, payment initiated, chef assignment, delivery available
- Delivery completed & missed notifications
- Scheduled delivery reminders (2 hours before)
- Chef unavailability alerts to admin
- Platform skip notifications to customers

### `server/pushService.ts` — Web Push Notifications (VAPID)
- Lazy VAPID initialization (reads env on first request)
- Push to specific user (by userId + userType)
- Push to all admins (broadcast)
- Auto-cleanup of expired subscriptions (HTTP 410)
- 10-second timeout per notification send

### `server/analytics.ts` — Analytics Engine
- Revenue metrics (total, average order, growth comparison)
- Period-based comparison (today vs yesterday, week vs last week, etc.)
- Order status breakdown
- Customer metrics (new, returning, lifetime value)
- Revenue trend charts (daily/weekly/monthly)
- Top selling items & top delivery areas
- Visitor analytics (page views, unique visitors, session tracking)

### `server/reports.ts` — Report Generation
- Revenue report (with daily breakdown chart data)
- Completed orders report
- Cancelled orders report (with reason breakdown)
- Customer report (top customers, spending patterns)
- Chef performance report (acceptance rate, revenue generated)

### `server/cache.ts` — In-Memory Cache
- Simple Map-based TTL cache
- 500 entry limit with FIFO eviction
- Prefix-based cache invalidation
- Used for hot paths (product listings, settings, etc.)

### `server/services/gpayVerificationService.ts` — Payment Verification
- Verifies UPI/GPay payments against expected amounts
- Phone number matching for payment source validation
- Retry logic for pending payments
- Verification logging for audit trail

### `server/services/chefUnavailabilityService.ts` — Chef Unavailability
- Mark chef unavailable today or set on leave (date range)
- Count affected subscription deliveries
- Pending action queue (reassign or platform-skip)
- Reassign deliveries to available chefs
- Platform skip with customer notifications
- Admin notification on chef unavailability

### `server/utils/restaurantStatus.ts` — Restaurant Schedule
- Open/closed status calculation based on schedule config
- Manual override (force close until time)
- Next scheduled opening time calculation
- Time validation and formatting

---

## 🗄️ Database Schema (All Tables)

| Table | Purpose |
|-------|---------|
| `sessions` | Express session storage |
| `users` | Customer accounts (name, phone, email, wallet, location) |
| `admin_users` | Admin accounts (username, email, role: super_admin/manager/viewer) |
| `partner_users` | Chef/restaurant login accounts |
| `categories` | Food categories (name, icon, display order, delivery slot requirement) |
| `chefs` | Chef/restaurant profiles (location, delivery config, FSSAI, pincodes) |
| `products` | Menu items (name, price, hotel price, image, chef, category, customizations) |
| `delivery_personnel` | Delivery partner accounts (name, phone, status, password) |
| `orders` | All orders (items, totals, status, payment, delivery tracking, timestamps) |
| `payment_verification_log` | UPI payment verification audit trail |
| `delivery_settings` | Distance-based delivery fee slabs |
| `delivery_partner_payouts` | Delivery partner payout configuration |
| `cart_settings` | Per-category cart config (min order, max quantity) |
| `coupons` | Discount coupon definitions |
| `coupon_usages` | Coupon usage tracking per user |
| `referrals` | Referral relationships (referrer → referee) |
| `wallet_transactions` | Wallet credit/debit history |
| `wallet_settings` | Wallet configuration (max usage, signup bonus, referral amounts) |
| `payment_settings` | UPI merchant config (phone, UPI ID, fees) |
| `payout_transactions` | Chef payout transaction records |
| `referral_rewards` | Referral reward configuration |
| `subscription_plans` | Available subscription plans (daily, alternate, weekly, etc.) |
| `subscriptions` | Active user subscriptions (plan, schedule, status, dates) |
| `subscription_delivery_logs` | Daily delivery tracking for subscriptions |
| `chef_unavailability` | Chef leave/unavailability records |
| `promotional_banners` | Homepage promotional banners |
| `delivery_time_slots` | Available delivery time windows |
| `roti_settings` | Order time restrictions (morning/evening block times, cutoffs) |
| `visitors` | App visitor tracking for analytics |
| `delivery_areas` | Configurable delivery zones (name, pincodes, coordinates) |
| `admin_settings` | Key-value admin configurations |
| `push_subscriptions` | Browser push notification endpoints |
| `newsletter_subscribers` | Email newsletter signups |
| `pending_broadcasts` | Queued messages for offline chefs/delivery |
| `pending_checkouts` | Saved checkout state before payment confirmation |
| `custom_subscription_requests` | Custom meal plan requests from users |

---

## 🔐 Authentication System

### Four Auth Modules

| Module | File | Users | Token Expiry |
|--------|------|-------|-------------|
| **Admin Auth** | `server/adminAuth.ts` | Admin panel users | Standard JWT |
| **User Auth** | `server/userAuth.ts` | Customers | Standard JWT |
| **Partner Auth** | `server/partnerAuth.ts` | Chefs/Restaurants | Access + Refresh (30d cookie) |
| **Delivery Auth** | `server/deliveryAuth.ts` | Delivery personnel | 90-day persistent sessions |

All modules use:
- **bcryptjs** for password hashing (salt rounds: 10)
- **jsonwebtoken** for token generation & verification
- Shared `JWT_SECRET` from environment (fallback: `mysecretkey123`)

### Role Hierarchy

```
Super Admin → Full access, user management, role assignment
Manager     → Product/order management, limited settings
Viewer      → Read-only access to admin panel
Partner     → Chef-specific order & product management
Delivery    → Delivery-specific routes only
Customer    → Public app access, orders, subscriptions
```

---

## 🔧 Environment Variables

### Required

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/rotihai

# Authentication
JWT_SECRET=your-secure-jwt-secret

# Image Storage (Cloudinary)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Optional (Features)

```bash
# Development Mode
ENABLE_VITE=true                    # Enables Vite dev server with HMR
ALLOW_PROD_DB_IN_DEV=true          # Allow connecting to prod DB locally

# Email (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxx

# WhatsApp (Meta Cloud API)
WHATSAPP_API_URL=https://graph.facebook.com/v21.0
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id
WHATSAPP_API_TOKEN=your_api_token
WHATSAPP_TEMPLATE_ORDER_ADMIN=new_order_admin_alert
WHATSAPP_TEMPLATE_LANGUAGE=en_US

# Push Notifications (VAPID)
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_EMAIL=admin@rotihai.com

# Google Maps
GOOGLE_MAPS_API_KEY=your_google_maps_key

# Server
PORT=5000                           # Server port (default: 5000)
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js v16+
- npm
- PostgreSQL 13+ (local) OR a Neon account
- Cloudinary account (for image uploads)

### Installation

```bash
# Clone
git clone https://github.com/YOUR_USERNAME/Replitrotihai.git
cd Replitrotihai

# Install dependencies
npm install

# Create .env (copy from .env.example and fill in values)
# At minimum set: DATABASE_URL, JWT_SECRET, CLOUDINARY_* vars

# Push schema to database
npm run db:push

# (Optional) Seed sample data
npm run seed

# Start development (backend on :5000, frontend HMR on :5173)
npm run dev
```

### Development Mode

When `ENABLE_VITE=true` is set:
- Express backend runs on port 5000
- Vite dev server provides HMR for the frontend
- API requests from frontend are proxied to backend
- No caching (all responses are `no-cache`)

### Production Build

```bash
# Build both frontend (Vite) and backend (esbuild)
npm run build

# Start production server
npm start
# or
npm run start:prod
```

Production build:
- Frontend → `dist/public/` (static assets with content hashes)
- Backend → `dist-server/index.js` (single bundled ESM file)
- Express serves both API and static frontend from the same port

---

## 📖 Available Scripts

```bash
# Development
npm run dev              # Start Express server with tsx (port 5000)
npm run dev:client       # Start Vite dev server only (port 5173)
npm run dev:all          # Start both concurrently
npm run dev:mobile       # Dev with custom HMR host (for mobile testing)

# Production
npm run build            # Build client (Vite) + server (esbuild)
npm run build:client     # Build frontend only
npm run build:server     # Bundle server only
npm start                # Run production server
npm run start:prod       # Run with NODE_ENV=production

# Database
npm run db:push          # Push schema to database (via drizzle-kit)
npm run db:generate      # Generate migration SQL files
npm run db:studio        # Open Drizzle Studio (visual DB editor)

# Seeding
npm run seed             # Seed local database
npm run seed:admin:neon  # Seed admin on Neon
npm run seed:data:neon   # Seed sample data on Neon
npm run seed:delivery-slots  # Seed delivery time slots

# Testing
npm test                 # Run Jest tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report

# Utilities
npx tsx scripts/create-admin.ts      # Create admin user
npx tsx scripts/create-partner.ts    # Create partner account
npx tsx scripts/backup-database.ts   # Backup database
npx tsx scripts/restore-database.ts  # Restore from backup
```

---

## 📱 Frontend Pages & Features

### Customer Pages

| Page | Features |
|------|----------|
| **Home** | Hero banner, location detection, category grid, product listings, search |
| **Landing** | Marketing landing page |
| **My Orders** | Order history with status, reorder |
| **Order Tracking** | Live delivery tracking with map |
| **My Subscriptions** | Active subscriptions, pause/resume, delivery calendar |
| **Custom Subscription** | Request custom meal plans |
| **Profile** | Account details, addresses, password change |
| **Invite & Earn** | Referral program with sharing |
| **Privacy Policy** | Legal page |

### Admin Pages (30+)

| Page | Features |
|------|----------|
| **Dashboard** | Revenue, orders, visitors, growth charts |
| **Products** | CRUD products with images, pricing, customization |
| **Categories** | Manage food categories |
| **Chefs** | Chef profiles, FSSAI compliance, delivery zones |
| **Orders** | Order management, status updates, assignment |
| **Subscriptions** | All subscriptions, delivery logs, status management |
| **Custom Subscriptions** | Review & respond to custom requests |
| **Delivery Settings** | Distance-based fee slabs |
| **Delivery Areas** | Zone management with coordinates |
| **Delivery Time Slots** | Available delivery windows |
| **Partners** | Chef login account management |
| **Payments** | Payment verification, payout management |
| **Payment Settings** | UPI config, fees, verification settings |
| **Users** | Customer management, wallet balance |
| **Coupons** | Discount coupon CRUD |
| **Referrals** | Referral tracking & rewards config |
| **Wallet Logs** | Transaction history |
| **Wallet Settings** | Wallet configuration |
| **Reports** | Revenue, chef, customer, cancellation reports |
| **Visitor Analytics** | Page views, sessions, traffic sources |
| **Cart Settings** | Min order, max quantity per category |
| **Roti Settings** | Time-block restrictions |
| **Promotional Banners** | Homepage banner management |
| **Notifications** | Push notification management |
| **Notification Settings** | Channel configuration |
| **SMS Settings** | WhatsApp template config |
| **Inventory** | Stock management |
| **Chef Performance** | Chef metrics & ratings |
| **Admin Management** | Admin user CRUD & role assignment |
| **Settings** | Global app settings |
| **Pending Checkouts** | Abandoned checkout tracking |

### Partner Portal

| Page | Features |
|------|----------|
| **Login** | Partner authentication |
| **Dashboard** | Today's orders, active deliveries, earnings |
| **Profile** | Partner profile & password management |

### Delivery Dashboard

| Page | Features |
|------|----------|
| **Login** | Delivery personnel authentication |
| **Dashboard** | Available orders, active delivery, history, earnings |

---

## 💳 Payment System

### GPay/UPI Payment Flow

```
1. Customer places order → Order status: "pending_payment"
2. QR code displayed with UPI deep link (merchant phone + amount)
3. Customer pays via GPay/PhonePe/UPI app
4. Backend cron job verifies payment (every 60s)
5. GPayVerificationService checks transaction against expected amount
6. On match → Order confirmed, notifications sent
7. On timeout → Order auto-cancelled after expiry period
```

### Payment Settings (Admin-Configurable)
- Merchant phone number
- UPI ID
- Platform fees (percentage or fixed)
- Verification retry logic

### Wallet System
- Prepaid wallet balance per customer
- Credits: signup bonus, referral rewards, admin credits
- Debits: order payment (partial or full)
- Configurable max wallet usage per order

---

## 🚚 Delivery System

### Distance-Based Fee Calculation

```
1. User location (GPS/manual) + Chef location → Haversine distance
2. Raw distance × Road Multiplier (default 1.5x) = Adjusted distance
3. Match against admin-configured distance slabs
4. Apply free delivery threshold (per slab or per chef)
5. Return fee or "Outside delivery zone"
```

### Delivery Flow

```
Order Placed → Confirmed by Chef → Preparing → Ready for Pickup
→ Broadcast to available delivery partners (WebSocket)
→ Delivery partner claims order
→ Out for Delivery → Delivered ✓
```

### Auto-Assignment Logic
- When order is ready, broadcast to all available delivery personnel via WebSocket
- First to claim gets the delivery
- If unclaimed after timeout → notify admin for manual assignment
- Pending broadcasts queued for offline delivery personnel

---

## 🔄 Subscription System

### How It Works
- Customers subscribe to meal plans (daily, alternate days, weekly, custom)
- System generates daily delivery logs based on frequency & delivery days
- Cron job creates today's delivery entries each morning
- Chef gets notified of upcoming deliveries
- Delivery partner assigned per delivery log entry

### Features
- Multiple plan types (pre-configured or custom)
- Pause/resume with auto-resume on scheduled date
- Skip individual deliveries (platform skip or customer skip)
- Chef unavailability handling (reassign or skip)
- Delivery calendar view
- Custom subscription requests (user submits → admin reviews)

---

## 🔔 Notification Channels

| Channel | When Used |
|---------|-----------|
| **WebSocket** | Real-time in-app updates (order status, new orders, delivery) |
| **Push (VAPID)** | When user is offline/app closed (admin order alerts) |
| **WhatsApp** | Order confirmations, delivery reminders, chef alerts |
| **Email** | Welcome, password reset, order confirmation, missed delivery |

---

## 📊 Analytics & Reporting

### Dashboard Metrics
- Revenue: today, 7-day, 30-day, 90-day with growth %
- Orders: total, completed, cancelled, pending
- Average order value
- Top selling items
- Top delivery areas
- Visitor metrics (page views, unique, sessions)
- Chef performance rankings

### Reports (Exportable)
- Revenue report with daily chart
- Completed orders breakdown
- Cancelled orders with reason analysis
- Customer report (top spenders, new vs returning)
- Chef performance report (acceptance rate, earnings)

---

## 🧪 Testing

```bash
npm test                 # Run all Jest tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report
```

Test files located in:
- `server/__tests__/` — Backend unit/integration tests
- `client/src/components/__tests__/` — Frontend component tests
- `server/services/gpayVerification.test.ts` — Payment verification tests

---

## 🔒 Security Features

- ✅ Password hashing with bcryptjs (10 salt rounds)
- ✅ JWT authentication with configurable secret
- ✅ Role-based access control (4 auth modules)
- ✅ Input validation with Zod schemas
- ✅ SQL injection prevention (Drizzle ORM parameterized queries)
- ✅ CORS with dynamic origin
- ✅ File upload validation (type + size)
- ✅ Database safety check (prevents dev connecting to prod DB accidentally)
- ✅ Cookie-based refresh tokens (httpOnly, secure in production)
- ✅ Directory traversal prevention on file serving

---

## 🐛 Troubleshooting

### "Cloudinary not configured"
```
Your .env is missing CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET.
Copy these from your Render environment variables.
```

### "Database connection failed"
```bash
# Check your DATABASE_URL in .env
# For local: postgresql://postgres:password@localhost:5432/rotihai
# For Neon: get connection string from Neon dashboard
```

### "CRITICAL ERROR: DEV SERVER IS USING PRODUCTION DATABASE"
```
Remove ALLOW_PROD_DB_IN_DEV=true from .env, or switch DATABASE_URL to dev database.
```

### "Push notifications disabled"
```
Set VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_EMAIL in .env.
Generate keys with: npx web-push generate-vapid-keys
```

### "Vite build fails"
```bash
rm -rf node_modules/.vite
npm run build:client
```

---

## 📝 License

MIT License - see [LICENSE](LICENSE) file.

---

**Made with ❤️ for food lovers. Ready to deliver fresh rotis to your city!** 🍞🚀

Last Updated: June 2026
