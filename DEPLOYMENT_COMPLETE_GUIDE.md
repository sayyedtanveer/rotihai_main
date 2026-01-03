# 🚀 RotiHai - Complete Deployment Guide

## Project Structure
```
replitrotihai/
├── client/          ← Frontend (React + Vite) → Deploy to Vercel
├── server/          ← Backend (Express.js) → Deploy to Railway
├── shared/          ← Shared types & database schema
├── package.json     ← Monorepo package.json
└── .env             ← Environment variables
```

---

## 📋 Prerequisites

1. **GitHub Account** - Push your code to GitHub
2. **Vercel Account** - Deploy frontend
3. **Railway Account** - Deploy backend
4. **PostgreSQL Database** - Already have Neon ✅

---

## Step 1: Prepare Your Code for Deployment

### 1.1 Update `.env` for production
```bash
# server/.env (Already exists)
DATABASE_URL=your_neon_postgres_url
NODE_ENV=production
PORT=8000
```

### 1.2 Create `.env.production` for frontend
```bash
# client/.env.production
VITE_API_URL=https://your-railway-backend.up.railway.app
```

### 1.3 Verify build script
```json
// package.json - already configured ✅
"build": "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist"
```

---

## Step 2: Push to GitHub

```bash
# 1. Initialize git (if not done)
git init

# 2. Add all files
git add .

# 3. Commit
git commit -m "Initial commit - ready for deployment"

# 4. Create GitHub repo and push
git remote add origin https://github.com/YOUR_USERNAME/Replitrotihai.git
git branch -M main
git push -u origin main
```

---

## Step 3A: Deploy Frontend to Vercel

### Option 1: Vercel Dashboard (Easiest)

1. **Go to [vercel.com](https://vercel.com)**
2. **Click "New Project"**
3. **Import from GitHub**
   - Select your `Replitrotihai` repository
4. **Configure Project**
   - **Framework Preset**: Vite
   - **Root Directory**: `./client` ← IMPORTANT!
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. **Environment Variables**
   ```
   VITE_API_URL=https://your-railway-backend.up.railway.app
   ```
6. **Deploy** ✅

### Option 2: Vercel CLI

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Deploy from client folder
cd client
vercel --prod

# Follow prompts and it will auto-detect Vite
```

---

## Step 3B: Deploy Backend to Railway

### Step 1: Connect GitHub to Railway

1. **Go to [railway.app](https://railway.app)**
2. **Sign in with GitHub**
3. **Click "New Project"**
4. **Select "Deploy from GitHub repo"**
5. **Choose your `Replitrotihai` repository**

### Step 2: Configure Railway Environment

1. **After repo is selected:**
   - Railway auto-detects Node.js project ✅
   
2. **Add Environment Variables**
   - Click **Variables** tab
   - Add these variables:
   ```
   DATABASE_URL=your_neon_postgres_url
   NODE_ENV=production
   PORT=8000
   ```

3. **Configure Build Settings**
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
   - **Root Directory**: `.` (root of project)

### Step 3: Database Configuration

Railway will automatically create:
- **PostgreSQL** option (BUT you already have Neon) ✅

Since you're using **Neon Serverless PostgreSQL**:
- ✅ DATABASE_URL in environment variables points to Neon
- ✅ Drizzle ORM handles the connection
- ✅ No extra setup needed!

### Step 4: Deploy

1. **Click Deploy** button
2. **Railway builds and deploys automatically**
3. **Get your Railway backend URL**:
   ```
   https://your-app-name.up.railway.app
   ```

---

## Step 4: Update Frontend with Backend URL

After Railway deployment:

1. **In Vercel Dashboard:**
   - Go to your Vercel project
   - **Settings** → **Environment Variables**
   - Update `VITE_API_URL`:
   ```
   VITE_API_URL=https://your-railway-backend.up.railway.app
   ```

2. **Redeploy Vercel** (auto triggers with env update)

---

## Step 5: Test Deployment

### Frontend Test
```
https://your-project.vercel.app
```

Should see:
- ✅ Home page loads
- ✅ Hero section with "Ghar Ka Khana, Apno Ka Swaad"
- ✅ New favicon with gold plate shine

### Backend Test
```bash
curl https://your-railway-backend.up.railway.app/api/chefs
```

Should return:
- ✅ JSON array of chefs from database
- ✅ No CORS errors

### Database Connection Test
```bash
# In Railway console or locally
npm run db:studio
```

Should connect to your Neon database ✅

---

## 📊 Cost Breakdown (as of Jan 2026)

| Service | Cost | Notes |
|---------|------|-------|
| **Vercel** | Free tier | ✅ Good for frontend |
| **Railway** | $5-20/month | ✅ Backend + storage |
| **Neon PostgreSQL** | Free tier | ✅ Database (current) |
| **Image Storage** | ~$10/month | Railway persistent disk |
| **Total** | ~$15-30/month | Very affordable! |

---

## 🔗 Architecture Overview

```
┌─────────────────────────────────────────┐
│         Your Users (Mobile/Web)         │
└────────────────┬────────────────────────┘
                 │
        ┌────────▼────────┐
        │   Vercel CDN    │
        │   (Frontend)    │
        └────────┬────────┘
                 │ API calls to
        ┌────────▼─────────────┐
        │ Railway Backend      │
        │ Express.js Server    │
        └────────┬─────────────┘
                 │ Queries to
        ┌────────▼─────────────┐
        │  Neon PostgreSQL     │
        │  (Your Database)     │
        └──────────────────────┘
```

---

## ⚙️ Important Configuration Files

### vite.config.ts
```typescript
// Frontend API URL from env
import.meta.env.VITE_API_URL
```

### server/index.ts
```typescript
// Uses DATABASE_URL from Neon
// Listens on PORT from env (8000 in prod)
```

### drizzle.config.ts
```typescript
// Already configured to use DATABASE_URL ✅
export default defineConfig({
  schema: "./shared/schema.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

---

## 🚨 Troubleshooting

### Frontend won't load (Vercel)
- Check `VITE_API_URL` environment variable
- Redeploy after changing env vars

### Backend won't start (Railway)
- Check `DATABASE_URL` is valid (from Neon)
- Check `NODE_ENV=production`
- View Railway logs for errors

### Database connection fails
- Verify Neon connection string
- Check if Neon IP whitelist allows Railway servers
- Use `npm run db:push` to sync schema

### Image upload fails in production
- Railway needs persistent disk enabled
- Check `/api/upload` endpoint on Railway

---

## 📝 Deployment Checklist

- [ ] Push code to GitHub
- [ ] Set up Vercel project from GitHub
- [ ] Set `VITE_API_URL` in Vercel env variables
- [ ] Set up Railway project from GitHub
- [ ] Add `DATABASE_URL` in Railway variables
- [ ] Add `NODE_ENV=production` in Railway
- [ ] Deploy to Vercel
- [ ] Deploy to Railway
- [ ] Test frontend: `https://vercel-url.vercel.app`
- [ ] Test backend API: `curl https://railway-url.up.railway.app/api/chefs`
- [ ] Test image upload in admin panel
- [ ] Test chef/product CRUD operations
- [ ] Verify database data persists
- [ ] Test on mobile device

---

## 🎯 Next Steps After Deployment

1. **Set up monitoring**: Railway has built-in logs
2. **Enable auto-deploy**: Set up GitHub Actions (optional)
3. **Custom domain**: Add your custom domain to Vercel
4. **Email notifications**: Set up alerts for errors
5. **Backup database**: Enable Neon backups
6. **Performance monitoring**: Use Vercel Analytics

---

## 💡 Quick Links

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Railway Dashboard**: https://railway.app/dashboard
- **Neon Console**: https://console.neon.tech
- **Your Frontend**: https://your-project.vercel.app
- **Your Backend**: https://your-railway-app.up.railway.app

---

## 📞 Support

If something fails:
1. Check Railway logs for backend errors
2. Check Vercel logs for frontend errors
3. Verify environment variables are set correctly
4. Try redeploying after fixing

Good luck! 🍞🚀
