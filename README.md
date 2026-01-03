# 🍞 RotiHai - Fresh Rotis Delivered to Your Door

[![Node.js](https://img.shields.io/badge/Node.js-16%2B-green?logo=node.js)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.3-blue?logo=react)](https://react.dev/)
[![Express.js](https://img.shields.io/badge/Express-4.21-black?logo=express)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Latest-blue?logo=postgresql)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

> **RotiHai** - A modern food delivery platform specializing in fresh rotis, homestyle meals, and restaurant specials. Built with cutting-edge technology for scalability, reliability, and great user experience.

## 🎯 Project Overview

RotiHai is a **full-stack food delivery application** with:
- 🏠 **User-facing app** - Order fresh rotis and meals with real-time delivery tracking
- 👨‍💼 **Admin panel** - Manage products, chefs, orders, and deliveries
- 👨‍🍳 **Partner portal** - For chefs/restaurants to manage their offerings
- 📱 **PWA support** - Works offline and installs like a native app
- 🖼️ **Dynamic image uploads** - Upload chef and product images in real-time
- 🔐 **Role-based access control** - Super Admin, Manager, Viewer roles
- 📊 **Real-time analytics** - Dashboard with orders, revenue, delivery metrics

---

## 🏗️ Project Architecture

```
Replitrotihai/
│
├── client/                    # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/       # Reusable React components
│   │   ├── pages/            # Page components
│   │   │   ├── admin/        # Admin panel pages
│   │   │   └── ...
│   │   ├── hooks/            # Custom React hooks
│   │   ├── lib/              # Utility functions
│   │   ├── store/            # State management
│   │   └── types/            # TypeScript types
│   ├── public/               # Static assets
│   ├── index.html            # HTML entry point
│   └── vite.config.ts        # Vite configuration
│
├── server/                    # Backend (Express.js + Node.js)
│   ├── index.ts              # Express server setup
│   ├── routes.ts             # API routes
│   ├── adminRoutes.ts        # Admin API endpoints
│   ├── adminAuth.ts          # Admin authentication
│   ├── imageService.ts       # Image upload handling
│   ├── emailService.ts       # Email notifications
│   ├── storage.ts            # File storage utilities
│   └── __tests__/            # Backend tests
│
├── shared/                    # Shared code
│   ├── schema.ts             # Database schema & types
│   ├── db.ts                 # Database connection
│   └── timeFormatter.ts      # Shared utilities
│
├── migrations/               # Database migrations
│
├── scripts/                  # Utility scripts
│   ├── seed.ts              # Database seeding
│   ├── create-admin.ts      # Admin user creation
│   └── ...
│
├── package.json              # Dependencies & scripts
├── tsconfig.json             # TypeScript configuration
├── vite.config.ts            # Vite bundler config
├── drizzle.config.ts         # Database ORM config
└── README.md                 # This file
```

---

## 🛠️ Technology Stack

### **Frontend**

| Technology | Version | Purpose |
|-----------|---------|---------|
| **React** | 18.3.1 | UI library for building interactive components |
| **Vite** | 5.0+ | Lightning-fast build tool & dev server |
| **TypeScript** | 5.4+ | Type-safe JavaScript for catching errors early |
| **Tailwind CSS** | 3.4+ | Utility-first CSS framework for styling |
| **React Query** | 5.34+ | Data fetching, caching, and synchronization |
| **React Hook Form** | 7.48+ | Efficient form state management |
| **Zod** | 3.22+ | TypeScript-first schema validation |
| **Shadcn/ui** | Latest | Beautiful, accessible UI components |
| **Lucide React** | Latest | Minimal icon library |

**Why these?**
- **React**: Industry standard for building fast, interactive UIs
- **Vite**: 10x faster than Webpack, instant hot module replacement
- **TypeScript**: Catch bugs at compile-time, better IDE support
- **Tailwind**: Write CSS 80% faster with utility classes
- **React Query**: Automatic caching & background updates
- **Shadcn/ui**: Beautifully designed, fully customizable components

### **Backend**

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Express.js** | 4.21+ | Lightweight web framework for Node.js |
| **Node.js** | 16+ | JavaScript runtime for server-side code |
| **TypeScript** | 5.4+ | Type-safe backend code |
| **Drizzle ORM** | 0.28+ | Type-safe SQL query builder |
| **PostgreSQL** | 13+ | Powerful relational database |
| **Neon** | Latest | Serverless PostgreSQL hosting |
| **Multer** | 1.4+ | Middleware for file uploads |
| **Bcrypt** | 5.1+ | Password hashing for security |
| **JWT** | Latest | JSON Web Tokens for authentication |

**Why these?**
- **Express.js**: Fast, flexible, minimal web framework
- **Drizzle ORM**: Type-safe, fully automated query generation
- **PostgreSQL**: ACID compliance, powerful queries, reliability
- **Neon**: Auto-scaling serverless database, pay-per-use
- **Multer**: Secure image/file upload handling
- **JWT**: Stateless authentication, perfect for mobile apps

### **Database**

| Schema | Purpose |
|--------|---------|
| **users** | Customer accounts with wallet balance & referral |
| **chefs** | Chef/restaurant profiles with location & delivery fees |
| **products** | Food items with pricing, nutrition, customization |
| **orders** | Order history with status tracking & payments |
| **subscriptions** | Recurring meal plans with delivery schedules |
| **deliveries** | Real-time delivery tracking & partner assignments |
| **admin_users** | Admin accounts with role-based access control |
| **partner_users** | Chef/restaurant login credentials |
| **categories** | Food categories (Rotis, Meals, Specials, etc.) |
| **delivery_logs** | Detailed delivery event history |
| **reviews** | Customer ratings and reviews |

---

## 🚀 Getting Started

### Prerequisites

```bash
# Required
Node.js v16 or higher
npm or yarn
Git

# For development
PostgreSQL 13+ OR Neon account (free at neon.tech)
```

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/Replitrotihai.git
cd Replitrotihai

# 2. Install dependencies
npm install

# 3. Create .env file
cat > .env << EOF
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/rotihai

# Node environment
NODE_ENV=development

# Server
PORT=3000
API_URL=http://localhost:3000

# Admin
ADMIN_SECRET=your_secret_key_here
EOF

# 4. Set up database
npm run db:generate    # Generate migrations
npm run db:push        # Push schema to database
npm run seed           # Populate with test data (optional)

# 5. Start development servers
npm run dev:all        # Runs both frontend and backend
# OR run separately:
npm run dev            # Backend on http://localhost:3000
npm run dev:client     # Frontend on http://localhost:5173
```

### Database Setup (First Time)

```bash
# If using Neon
1. Create account at https://neon.tech
2. Create a new project
3. Copy PostgreSQL connection string
4. Add to .env as DATABASE_URL

# If using local PostgreSQL
createdb rotihai
# Then set DATABASE_URL in .env

# Create schema
npm run db:push

# Seed with sample data
npm run seed
```

---

## 📖 Available Scripts

```bash
# Development
npm run dev              # Start Express server
npm run dev:client       # Start Vite dev server
npm run dev:all          # Start both (recommended)

# Production
npm run build            # Build frontend + backend
npm start                # Start production server

# Database
npm run db:generate      # Generate new migration files
npm run db:push          # Apply migrations to database
npm run db:studio        # Open Drizzle Studio (visual DB editor)

# Testing & Validation
npm test                 # Run Jest tests
npm run check            # Run TypeScript type checking
npm run lint             # Lint code (if configured)

# Admin Setup
npx tsx scripts/create-admin.ts     # Create admin user
npx tsx scripts/create-partner.ts   # Create partner account
npx tsx scripts/backup-database.ts  # Backup database
npx tsx scripts/restore-database.ts # Restore from backup
```

---

## 🔐 Authentication & Authorization

### User Roles

| Role | Access | Features |
|------|--------|----------|
| **Customer** | Public app | Browse, order, track delivery, wallet |
| **Chef/Partner** | Partner portal | Manage products, view orders, update status |
| **Admin** | Admin panel | Full control, user management, analytics |
| **Super Admin** | Admin panel | Everything + role management |

### How Authentication Works

```
1. User logs in (email + password)
   ↓
2. Backend validates credentials
   ↓
3. Server returns JWT token
   ↓
4. Token stored in localStorage
   ↓
5. Token sent in Authorization header for all API calls
   ↓
6. Backend verifies token & checks user role
   ↓
7. Access granted or denied based on role
```

### Creating Admin Users

```bash
# Interactive CLI
npx tsx scripts/create-admin.ts

# Or manually in Drizzle Studio
1. npm run db:studio
2. Go to admin_users table
3. Add new row with:
   - username: your_admin_username
   - email: admin@example.com
   - passwordHash: (use bcrypt or create-admin script)
   - role: super_admin
```

---

## 🖼️ Image Upload System

### How It Works

```
1. Admin uploads image via form
   ↓
2. Multer validates file (type, size)
   ↓
3. Image saved to /attached_assets/uploads/
   ↓
4. Server returns URL (/uploads/filename.jpg)
   ↓
5. URL stored in database (chefs.image, products.image)
   ↓
6. Frontend displays image from URL
```

### Upload Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/upload` | POST | Upload new image (requires auth) |
| `/uploads/:filename` | GET | Retrieve uploaded image (public) |

### Upload Limits

- **File types**: JPEG, PNG, WebP, GIF
- **Max size**: 5 MB
- **Storage**: Railway persistent disk `/uploads`

---

## 🏪 Product & Chef Management

### Admin Panel Features

#### Products Management
```
- Create/edit/delete products
- Set pricing (cost vs selling price)
- Add images (upload or URL)
- Mark vegetarian/vegan
- Enable customization options
- Set availability by time
```

#### Chef Management
```
- Add/edit/remove chefs/restaurants
- Upload chef images
- Set delivery zones & fees
- Configure operating hours
- Manage menu items
- View performance metrics
```

#### Order Management
```
- View all orders with details
- Update order status
- Assign delivery partners
- Track delivery in real-time
- Handle cancellations & refunds
- Generate invoices
```

---

## 🚚 Delivery System

### Order Status Flow

```
Order Placed
    ↓
Confirmed by Chef
    ↓
Preparing
    ↓
Ready for Pickup
    ↓
Assigned to Delivery Partner
    ↓
Out for Delivery
    ↓
Delivered ✓
```

### Delivery Tracking

```typescript
// Real-time location tracking
GET /api/delivery/:orderId/status
// Returns:
{
  orderId: "123",
  status: "out_for_delivery",
  deliveryPartner: { name, phone, rating },
  latitude: 19.0728,
  longitude: 72.8826,
  estimatedArrival: "2024-01-03T14:30:00Z"
}
```

---

## 💳 Payment System

### Supported Payment Methods

- **Wallet Balance** - Prepaid customer wallet
- **Credit/Debit Card** - Through payment gateway
- **COD** - Cash on Delivery (optional)
- **UPI** - Indian payment system

### Wallet System

```typescript
// Add balance to wallet
POST /api/user/wallet/add
{ amount: 500 }

// Use wallet for order
POST /api/orders
{ paymentMethod: "wallet" }
```

---

## 📊 Admin Dashboard

### Key Metrics

```
Dashboard shows:
- Total orders today
- Revenue (today, this week, this month)
- Active delivery partners
- Average delivery time
- Customer satisfaction rating
- Top performing chefs
- Peak order times
```

### Reports

```
Available reports:
- Sales report (daily, weekly, monthly)
- Chef performance
- Delivery partner efficiency
- Customer feedback analysis
- Inventory status
```

---

## 🔧 Configuration

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@host/dbname

# Server
NODE_ENV=production
PORT=8000
API_URL=https://api.rotihai.com

# Frontend
VITE_API_URL=https://api.rotihai.com

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Admin
ADMIN_SECRET=super_secret_key_12345

# Features
ENABLE_WALLET=true
ENABLE_SUBSCRIPTIONS=true
ENABLE_REFERRALS=true
```

---

## 📱 Frontend Features

### Pages & Components

| Page | Feature |
|------|---------|
| **Home** | Hero, location detection, product search |
| **Products** | Browse, filter by category, search |
| **Chef** | View chef profile, ratings, delivery zones |
| **Cart** | Add/remove items, apply coupons |
| **Checkout** | Address, payment method, order summary |
| **Tracking** | Real-time delivery tracking with map |
| **Account** | Profile, orders, wallet, referrals |
| **Admin** | Full management dashboard |

### Key Functionality

```typescript
// Real-time features:
- Auto-update location
- Live order status
- Instant notifications
- Product availability updates
- Delivery partner tracking

// Offline support (PWA):
- Browse cached products
- View past orders
- Read store hours
- Save favorite items
```

---

## 🧪 Testing

### Running Tests

```bash
# All tests
npm test

# Specific test file
npm test -- test-delivery.ts

# Watch mode
npm test -- --watch

# Coverage report
npm test -- --coverage
```

### Test Files

```
server/__tests__/
├── auth.test.ts
├── routes.test.ts
├── delivery.test.ts
└── imageService.test.ts
```

---

## 🚀 Deployment

### Quick Deploy to Production

#### Frontend (Vercel)
```bash
# Deploy to Vercel
vercel --prod

# Or set up auto-deploy from GitHub
# Settings → GitHub integration
```

#### Backend (Railway)
```bash
# Deploy to Railway
1. Connect GitHub repo
2. Set environment variables
3. Click Deploy
```

See **DEPLOYMENT_STEPS_DETAILED.md** for complete guide.

### Production Checklist

```
- [ ] Environment variables set
- [ ] Database backups enabled
- [ ] CORS configured
- [ ] SSL certificates installed
- [ ] Error logging enabled
- [ ] Performance monitoring active
- [ ] Backup storage configured
- [ ] Email notifications working
- [ ] Admin panel accessible
- [ ] Image uploads tested
```

---

## 📊 Database Schema (Key Tables)

### Users Table
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  passwordHash TEXT NOT NULL,
  walletBalance INTEGER DEFAULT 0,
  referralCode VARCHAR(20) UNIQUE,
  createdAt TIMESTAMP DEFAULT NOW()
);
```

### Products Table
```sql
CREATE TABLE products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER,
  hotelPrice INTEGER,
  image TEXT,
  rating DECIMAL(2,1),
  isVeg BOOLEAN DEFAULT true,
  categoryId TEXT REFERENCES categories(id)
);
```

### Orders Table
```sql
CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  userId TEXT REFERENCES users(id),
  chefId TEXT REFERENCES chefs(id),
  totalAmount INTEGER,
  status TEXT,
  paymentStatus TEXT,
  createdAt TIMESTAMP,
  deliveredAt TIMESTAMP
);
```

See [shared/schema.ts](shared/schema.ts) for complete schema.

---

## 🔒 Security Features

### Implemented

- ✅ **Password Hashing** - Bcrypt with salt rounds
- ✅ **JWT Tokens** - Stateless authentication
- ✅ **Role-Based Access Control** - Different levels of authorization
- ✅ **Input Validation** - Zod schema validation
- ✅ **SQL Injection Prevention** - Parameterized queries via Drizzle
- ✅ **CORS Protection** - Configurable origins
- ✅ **Rate Limiting** - Prevent brute force attacks
- ✅ **File Upload Security** - Type & size validation

### Best Practices

```typescript
// Always validate input
const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

// Use prepared statements (Drizzle does this)
db.select().from(users).where(eq(users.id, userId))

// Hash passwords with bcrypt
const hashedPassword = await bcrypt.hash(password, 10)

// Verify JWT tokens
const decoded = jwt.verify(token, SECRET)
```

---

## 🐛 Troubleshooting

### Common Issues

#### "Database connection failed"
```bash
# Check DATABASE_URL
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1"

# For Neon, verify IP whitelist in console
```

#### "Port already in use"
```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>
```

#### "Vite build fails"
```bash
# Clear cache
rm -rf node_modules/.vite
npm run build

# Check for TypeScript errors
npm run check
```

#### "Admin login fails"
```bash
# Create new admin user
npx tsx scripts/create-admin.ts

# Or reset password
npx tsx scripts/reset-admin-password.ts
```

---

## 📚 Documentation

| File | Purpose |
|------|---------|
| [DEPLOYMENT_STEPS_DETAILED.md](DEPLOYMENT_STEPS_DETAILED.md) | Production deployment guide |
| [IMAGE_UPLOAD_GUIDE.md](IMAGE_UPLOAD_GUIDE.md) | Image upload system documentation |
| [ARCHITECTURE_DIAGRAMS.md](ARCHITECTURE_DIAGRAMS.md) | System architecture & flow diagrams |
| [shared/schema.ts](shared/schema.ts) | Complete database schema |

---

## 🤝 Contributing

### Setup Development Environment

```bash
# 1. Fork repository
# 2. Clone your fork
git clone https://github.com/YOUR_USERNAME/Replitrotihai.git

# 3. Create feature branch
git checkout -b feature/your-feature-name

# 4. Install dependencies
npm install

# 5. Start dev servers
npm run dev:all

# 6. Make changes & test
# 7. Commit with clear message
git commit -m "Add: your feature description"

# 8. Push to your fork
git push origin feature/your-feature-name

# 9. Create Pull Request on GitHub
```

### Code Style

```
- Use TypeScript for type safety
- Follow naming conventions (camelCase for vars, PascalCase for components)
- Write comments for complex logic
- Keep functions small and focused
- Use meaningful variable names
```

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💼 Authors

- **Original Developer** - Building RotiHai

## 🙏 Acknowledgments

- React & Vite communities
- Drizzle ORM team
- Shadcn/ui for beautiful components
- All contributors and testers

---

## 📞 Support & Contact

```
Email: support@rotihai.com
Phone: +91 98765 43210
Website: https://rotihai.com
```

---

## 🗺️ Roadmap

### Q1 2026
- [ ] Mobile app (React Native)
- [ ] Enhanced delivery tracking
- [ ] Subscription plans v2
- [ ] AI-powered recommendations

### Q2 2026
- [ ] Multi-city expansion
- [ ] Loyalty program
- [ ] Advanced analytics
- [ ] API for third-party integrations

### Q3 2026
- [ ] Machine learning predictions
- [ ] Voice ordering
- [ ] Virtual kitchen integration
- [ ] Blockchain receipts

---

## 📊 Project Statistics

```
├─ Frontend:       ~5,000+ lines of React/TypeScript
├─ Backend:        ~3,000+ lines of Node.js/Express
├─ Database:       ~20 tables with relationships
├─ API Endpoints:  ~50+ REST endpoints
├─ Components:     ~40+ reusable UI components
├─ Admin Pages:    ~15 management pages
└─ Test Files:     ~1,500+ lines of test code
```

---

## 🎯 Key Metrics

| Metric | Target |
|--------|--------|
| **Page Load Time** | < 2 seconds |
| **API Response** | < 200ms |
| **Uptime** | 99.9% |
| **Database Queries** | < 50ms |
| **Image Load** | < 100ms (cached) |

---

## 🎉 Getting Help

1. Check the [documentation](docs/)
2. Search [existing issues](https://github.com/YOUR_USERNAME/Replitrotihai/issues)
3. Create a new issue with details
4. Join our community discord (link)

---

**Made with ❤️ for food lovers. Ready to deliver fresh rotis to your city!** 🍞🚀

Last Updated: January 2026
