# Deployment Architecture Guide

## Overview

This document explains how all components connect: **GitHub** (code repository) → **Vercel** (hosting) → **Supabase** (database) → **Hostinger** (domain).

## Architecture Diagram

```
┌─────────────┐
│   GitHub    │  ← Your code repository
│  (Repo)     │
└──────┬──────┘
       │
       │ (Auto-deploy on push)
       │
┌──────▼──────┐
│   Vercel    │  ← Hosts your Next.js app
│  (Hosting)  │  ← Serves akomaylessonplanna.com
└──────┬──────┘
       │
       │ (API calls)
       │
┌──────▼──────┐
│  Supabase   │  ← Database, Auth, Storage
│  (Backend)  │
└─────────────┘

┌─────────────┐
│  Hostinger  │  ← Domain registrar
│  (Domain)   │  ← akomaylessonplanna.com
└──────┬──────┘
       │
       │ (DNS points to)
       │
┌──────▼──────┐
│   Vercel    │  ← Receives traffic
└─────────────┘
```

## Component Roles

### 1. **GitHub** (Code Repository)
- **Purpose:** Stores your source code
- **What it does:** Version control, code history, collaboration
- **Connection:** Vercel watches GitHub and auto-deploys when you push code

### 2. **Vercel** (Hosting Platform)
- **Purpose:** Hosts your Next.js application
- **What it does:**
  - Builds your Next.js app
  - Serves it to users via CDN
  - Handles SSL certificates automatically
  - Provides your app URL (e.g., `akomaylessonplanna.vercel.app`)
- **Connection:** 
  - Pulls code from GitHub
  - Connects to Supabase via environment variables
  - Receives traffic from your domain

### 3. **Supabase** (Backend Services)
- **Purpose:** Database, authentication, file storage
- **What it does:**
  - Stores all your data (users, products, orders, etc.)
  - Handles user authentication
  - Stores uploaded files (product images, profiles)
- **Connection:** Your Next.js app (on Vercel) connects to Supabase via API

### 4. **Hostinger** (Domain Registrar)
- **Purpose:** Owns your domain name
- **What it does:** Manages DNS records for `akomaylessonplanna.com`
- **Connection:** Points your domain to Vercel's servers

## How They Connect - Step by Step

### Step 1: GitHub → Vercel Connection

**What happens:**
1. You push code to GitHub
2. Vercel detects the push (via webhook)
3. Vercel builds your Next.js app
4. Vercel deploys the built app

**Setup:**
1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "Add New Project"
4. Import your `akomaylessonplanna` repository
5. Vercel automatically sets up webhooks

**Result:** Every time you push to `main` branch, Vercel auto-deploys

### Step 2: Vercel → Supabase Connection

**What happens:**
1. Your Next.js app (on Vercel) needs to connect to Supabase
2. Uses environment variables for credentials
3. Makes API calls to Supabase for data/auth

**Setup:**
1. In Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add these variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://iokinyttkzmcnmznxgza.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key
NEXT_PUBLIC_APP_URL=https://akomaylessonplanna.com
RESEND_API_KEY=your_resend_key
RESEND_FROM_EMAIL=noreply@akomaylessonplanna.com
```

**How to get Supabase keys:**
1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your production project (`iokinyttkzmcnmznxgza`)
3. Go to Settings → API
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (keep secret!)

**Result:** Your app can now access Supabase database and auth

### Step 3: Hostinger → Vercel Connection (Domain Setup)

**What happens:**
1. User types `akomaylessonplanna.com` in browser
2. DNS lookup finds Vercel's IP address
3. Traffic goes to Vercel
4. Vercel serves your app

**Setup in Hostinger:**

1. **Log in to Hostinger:**
   - Go to [hpanel.hostinger.com](https://hpanel.hostinger.com)
   - Navigate to your domain `akomaylessonplanna.com`

2. **Go to DNS Management:**
   - Find "DNS Zone Editor" or "DNS Management"
   - You'll see current DNS records

3. **Add DNS Records in Hostinger:**

   **Option A: Use Vercel's Nameservers (Recommended)**
   - In Vercel Dashboard → Your Project → Settings → Domains
   - Add `akomaylessonplanna.com`
   - Vercel will show you nameservers (e.g., `ns1.vercel-dns.com`)
   - In Hostinger, change nameservers to Vercel's nameservers
   - This gives Vercel full control over DNS

   **Option B: Use DNS Records (Keep Hostinger DNS)**
   - Keep Hostinger's nameservers
   - Add these DNS records in Hostinger:
   
   ```
   Type: A
   Name: @
   Value: 76.76.21.21
   TTL: 3600
   
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   TTL: 3600
   ```
   
   - Then in Vercel Dashboard → Settings → Domains → Add `akomaylessonplanna.com` and `www.akomaylessonplanna.com`
   - Vercel will verify the DNS records

4. **Wait for DNS Propagation:**
   - Can take 5 minutes to 48 hours (usually 5-30 minutes)
   - Check with: `nslookup akomaylessonplanna.com`

**Result:** Your domain points to Vercel, users can access your app

## Complete Flow Example

**User visits `akomaylessonplanna.com`:**

1. **DNS Lookup:**
   ```
   Browser → Hostinger DNS → Returns Vercel IP
   ```

2. **Request to Vercel:**
   ```
   Browser → Vercel CDN → Next.js App
   ```

3. **App Loads:**
   ```
   Next.js App → Reads env vars → Connects to Supabase
   ```

4. **Data Fetch:**
   ```
   Next.js App → Supabase API → Database → Returns data → Renders page
   ```

5. **User Sees:**
   ```
   Fully rendered page with data from Supabase
   ```

## Environment Variables Setup

### Development (Local)
**File:** `.env.local` (already exists, not committed to GitHub)

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-dev-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_dev_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_dev_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Production (Vercel)
**Set in:** Vercel Dashboard → Settings → Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://iokinyttkzmcnmznxgza.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_prod_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_prod_service_role_key
NEXT_PUBLIC_APP_URL=https://akomaylessonplanna.com
RESEND_API_KEY=your_resend_key
RESEND_FROM_EMAIL=noreply@akomaylessonplanna.com
CRON_SECRET=your_random_secret
```

**Important:** 
- `NEXT_PUBLIC_*` variables are exposed to the browser
- `SUPABASE_SERVICE_ROLE_KEY` is server-only (never exposed)
- Set variables for **Production** environment in Vercel

## Deployment Workflow

### Daily Development:

```bash
# 1. Make changes locally
git add .
git commit -m "Add new feature"

# 2. Push to GitHub
git push origin main

# 3. Vercel automatically:
#    - Detects push
#    - Builds app
#    - Deploys to production
#    - Your site updates automatically!
```

### Database Changes:

```bash
# 1. Create migration file
# supabase/migrations/017_new_feature.sql

# 2. Push to production database
npx supabase db push

# 3. Deploy code (if needed)
git push origin main
```

## Verification Checklist

After setup, verify everything works:

- [ ] **GitHub:** Code is pushed and visible
- [ ] **Vercel:** Project imported, auto-deploy enabled
- [ ] **Vercel Environment Variables:** All Supabase keys set
- [ ] **Supabase:** Production project active, migrations applied
- [ ] **Hostinger DNS:** Points to Vercel (check with `nslookup`)
- [ ] **Domain:** `akomaylessonplanna.com` loads your app
- [ ] **SSL:** HTTPS works automatically (Vercel provides SSL)
- [ ] **App Functionality:** Can sign up, login, use features

## Troubleshooting

### Domain Not Working

**Check DNS:**
```bash
# Windows PowerShell
nslookup akomaylessonplanna.com

# Should show Vercel IP addresses
```

**Common Issues:**
- DNS not propagated (wait 30 minutes)
- Wrong DNS records (check Hostinger)
- Domain not added in Vercel (add in Settings → Domains)

### App Can't Connect to Supabase

**Check:**
1. Environment variables set in Vercel?
2. Using production Supabase keys?
3. Supabase project active?
4. Check Vercel build logs for errors

### Build Fails in Vercel

**Check:**
1. Build logs in Vercel Dashboard
2. Environment variables missing?
3. TypeScript errors?
4. Missing dependencies in `package.json`?

## Security Notes

1. **Never commit `.env.local`** - Already in `.gitignore` ✓
2. **Service Role Key** - Only use server-side, never expose to browser
3. **Domain Security** - Vercel handles SSL automatically
4. **Supabase RLS** - Row Level Security protects your data

## Next Steps

1. ✅ Push code to GitHub (if not done)
2. ⏳ Connect GitHub to Vercel
3. ⏳ Set environment variables in Vercel
4. ⏳ Configure domain DNS in Hostinger
5. ⏳ Test production deployment
6. ⏳ Verify all features work

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Hostinger DNS Guide](https://www.hostinger.com/tutorials/how-to-change-dns-nameservers-for-a-domain)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
