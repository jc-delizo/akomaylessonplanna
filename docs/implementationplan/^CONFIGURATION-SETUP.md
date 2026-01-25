# Initial Setup Configuration Guide

This guide shows you the **one-time setup** needed for each service. Follow these steps in order.

**NOTE**: This guide now includes setup for **isolated dev/prod environments**. If you want the simpler single-environment setup, see the legacy version of this guide.

## Complete Setup Flow

```mermaid
flowchart TD
    A[Start: Fresh Project Setup] --> B[STEP 0: Create Dev Branch]
    B --> C[STEP 1: Install Node.js v20+]
    C --> D[Install Git]
    D --> E[Install VS Code]
    E --> F[Create .env.local file]
    F --> G[STEP 2: Create GitHub account]
    G --> H[Create repository: akomaylessonplanna]
    H --> I[Push code to GitHub]
    I --> J[Push dev branch to GitHub]
    J --> K[STEP 3: Create TWO Supabase projects]
    K --> L[Create Supabase Dev project]
    L --> M[Create Supabase Prod project]
    M --> N[Copy credentials for both]
    N --> O[Run database migrations on both]
    O --> P[Enable OAuth providers in both]
    P --> Q[STEP 4: Create TWO Vercel projects]
    Q --> R[Import repo for DEV project - connect to dev branch]
    R --> S[Add dev environment variables]
    S --> T[Deploy dev project]
    T --> U[Import repo for PROD project - connect to main branch]
    U --> V[Add prod environment variables]
    V --> W[Deploy prod project]
    W --> X[STEP 5: Configure Hostinger DNS]
    X --> Y[Add CNAME for dev subdomain]
    Y --> Z[Point main domain to production]
    Z --> AA[Wait for DNS propagation]
    AA --> AB[STEP 6: Setup Google OAuth]
    AB --> AC[Add redirect URIs for BOTH domains]
    AC --> AD[STEP 7: Setup Facebook OAuth]
    AD --> AE[Add redirect URIs for BOTH domains]
    AE --> AF[STEP 8: Setup Resend]
    AF --> AG[STEP 9: Optional - Setup Sentry]
    AG --> AH[Setup Complete - Dev & Prod Ready!]
```

## Detailed Step-by-Step Instructions

### STEP 0: Create Dev Branch (5 minutes)

**NEW**: Before any other setup, create your dev branch for isolated environments.

1. **Open VS Code Terminal**
   - Open your project in VS Code
   - Terminal → New Terminal (or press Ctrl+`)

2. **Create Dev Branch**
   ```bash
   # Create and switch to dev branch
   git checkout -b dev
   ```

3. **Verify Branch Created**
   ```bash
   # Check current branch
   git branch
   # Should show: * dev (asterisk indicates current branch)
   ```

4. **Keep Dev Branch for Later**
   - We'll push this to GitHub in STEP 2
   - For now, just keep it locally

**Why**: Having separate `dev` and `main` branches allows isolated development and production environments.

---

### STEP 1: Local Machine Setup (15 minutes)

1. **Install Node.js**
   - Go to https://nodejs.org
   - Download LTS version (v20 or higher)
   - Install and restart your computer
   - Verify: Open terminal and run `node --version`

2. **Install Git**
   - Go to https://git-scm.com/downloads
   - Download for Windows
   - Install with default settings
   - Verify: Run `git --version`

3. **Install VS Code** (if not already installed)
   - Go to https://code.visualstudio.com
   - Download and install

4. **Open Your Project**
   - Open VS Code
   - File → Open Folder → `c:\Users\odvip\OneDrive\Desktop\JC\akomaylessonplanna`

5. **Create .env.local file**
   - In VS Code, create file: `.env.local` in project root
   - Add this content (we'll fill values later):
   ```env
   # For local development, you can use DEV Supabase
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   RESEND_API_KEY=
   RESEND_FROM_EMAIL=noreply@akomaylessonplanna.com
   ```

---

### STEP 2: GitHub Setup (10 minutes)

1. **Create GitHub Account**
   - Go to https://github.com
   - Sign up if you don't have an account

2. **Create Repository**
   - Click "+" → "New repository"
   - Name: `akomaylessonplanna`
   - Choose "Private"
   - Don't initialize with README
   - Click "Create repository"

3. **Push Main Branch to GitHub**
   ```bash
   # Initialize Git (if not already done)
   git init
   
   # Switch to main branch
   git checkout -b main
   
   # Stage all files
   git add .
   
   # Create initial commit
   git commit -m "Initial commit"
   
   # Connect to GitHub (replace YOUR_USERNAME)
   git remote add origin https://github.com/YOUR_USERNAME/akomaylessonplanna.git
   
   # Push main branch
   git push -u origin main
   ```

4. **Push Dev Branch to GitHub**
   ```bash
   # Switch to dev branch
   git checkout dev
   
   # Push dev branch
   git push -u origin dev
   ```

5. **Verify Both Branches on GitHub**
   - Go to your GitHub repository
   - Click branch dropdown (should say "main" or "dev")
   - You should see both `main` and `dev` branches listed

---

### STEP 3: Supabase Setup - TWO Projects (40 minutes)

You'll create **two separate Supabase projects**: one for development, one for production.

#### Create Dev Supabase Project

1. **Go to Supabase**
   - Visit https://supabase.com
   - Sign up with GitHub if you haven't

2. **Create Dev Project**
   - Click "New Project"
   - **Name**: `akomaylessonplanna-dev`
   - **Database password**: Create strong password, save it securely!
   - **Region**: Choose closest to Philippines (Singapore)
   - Click "Create new project" (takes 2-3 minutes)

3. **Get Dev API Keys**
   - Wait for project to finish creating
   - Go to Settings → API
   - **Copy and save these values:**
     - **Project URL** (e.g., `https://abcdefgh.supabase.co`)
     - **anon public key**
     - **service_role key** (Click "Reveal" first)
   - Save these in a secure note labeled "DEV SUPABASE CREDENTIALS"

4. **Run Migrations on Dev Database**
   ```bash
   # Get connection string from Supabase:
   # Settings → Database → Connection String (Connection Pooling)
   
   # Apply migrations
   npx supabase db push --db-url "postgresql://postgres.[dev-ref]:[dev-password]@aws-0-[region].pooler.supabase.com:6543/postgres"
   ```

5. **Enable OAuth Providers in Dev**
   - Go to Authentication → Providers
   - Toggle ON: Google
   - Toggle ON: Facebook
   - (We'll configure credentials later)

6. **Configure Redirect URLs for Dev**
   - Go to Authentication → URL Configuration
   - **Site URL**: `http://localhost:3000`
   - **Redirect URLs** (add these):
     - `http://localhost:3000/auth/callback`
     - `https://dev.akomaylessonplanna.com/auth/callback` (for later)
   - Click "Save"

#### Create Prod Supabase Project

1. **Create Production Project**
   - In Supabase, click "New Project" again
   - **Name**: `akomaylessonplanna-prod`
   - **Database password**: Create DIFFERENT strong password, save it!
   - **Region**: Same as dev (Singapore)
   - Click "Create new project" (takes 2-3 minutes)

2. **Get Prod API Keys**
   - Go to Settings → API
   - **Copy and save these values:**
     - **Project URL** (e.g., `https://iokinyttkzmcnmznxgza.supabase.co`)
     - **anon public key**
     - **service_role key**
   - Save these in a secure note labeled "PROD SUPABASE CREDENTIALS"

3. **Run Migrations on Prod Database**
   ```bash
   # Get connection string from prod project
   # Apply same migrations
   npx supabase db push --db-url "postgresql://postgres.[prod-ref]:[prod-password]@aws-0-[region].pooler.supabase.com:6543/postgres"
   ```

4. **Enable OAuth Providers in Prod**
   - Go to Authentication → Providers
   - Toggle ON: Google
   - Toggle ON: Facebook

5. **Configure Redirect URLs for Prod**
   - Go to Authentication → URL Configuration
   - **Site URL**: `https://akomaylessonplanna.com`
   - **Redirect URLs** (add these):
     - `http://localhost:3000/auth/callback`
     - `https://akomaylessonplanna.com/auth/callback`
   - Click "Save"

---

### STEP 4: Vercel Setup - TWO Projects (30 minutes)

You'll create **two separate Vercel projects** from the same repository.

#### Create Vercel Dev Project

1. **Go to Vercel**
   - Visit https://vercel.com
   - Sign up with GitHub (important!)

2. **Import Repository for Dev**
   - Click "Add New..." → "Project"
   - Find your `akomaylessonplanna` repository
   - Click "Import"

3. **Configure Dev Project Settings**
   - **Project Name**: `akomaylessonplanna-dev`
   - **Framework**: Next.js (auto-detected)
   - **Root Directory**: `./` (default)
   - **Build Command**: Leave default

4. **CRITICAL: Set Production Branch to `dev`**
   - Look for "Git" or "Branch" configuration
   - **Production Branch**: Change from `main` to `dev`
   - This ensures this project deploys from dev branch

5. **Add Dev Environment Variables**
   - Click "Environment Variables"
   - Add these **one by one**, Environment: Production

   ```
   Name: NEXT_PUBLIC_SUPABASE_URL
   Value: [Paste DEV Supabase URL from Step 3]
   
   Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
   Value: [Paste DEV anon key from Step 3]
   
   Name: SUPABASE_SERVICE_ROLE_KEY
   Value: [Paste DEV service role key from Step 3]
   
   Name: NEXT_PUBLIC_APP_URL
   Value: https://dev.akomaylessonplanna.com
   
   Name: RESEND_API_KEY
   Value: [Will add in Step 8]
   
   Name: RESEND_FROM_EMAIL
   Value: noreply@akomaylessonplanna.com
   ```

6. **Deploy Dev Project**
   - Click "Deploy"
   - Wait 2-5 minutes
   - You'll get a URL like: `akomaylessonplanna-dev-xxxxx.vercel.app`
   - **Save this URL for testing!**

#### Create Vercel Prod Project

1. **Import Repository Again for Production**
   - In Vercel, click "Add New..." → "Project" again
   - Find `akomaylessonplanna` repository again
   - Click "Import"

2. **Configure Prod Project Settings**
   - **Project Name**: `akomaylessonplanna-prod` (or just `akomaylessonplanna`)
   - **Framework**: Next.js
   - **Root Directory**: `./`

3. **Verify Production Branch is `main`**
   - **Production Branch**: Should be `main` (default)
   - Leave it as main

4. **Add Prod Environment Variables**
   - Click "Environment Variables"
   - Add these **one by one**, Environment: Production

   ```
   Name: NEXT_PUBLIC_SUPABASE_URL
   Value: [Paste PROD Supabase URL from Step 3]
   
   Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
   Value: [Paste PROD anon key from Step 3]
   
   Name: SUPABASE_SERVICE_ROLE_KEY
   Value: [Paste PROD service role key from Step 3]
   
   Name: NEXT_PUBLIC_APP_URL
   Value: https://akomaylessonplanna.com
   
   Name: RESEND_API_KEY
   Value: [Will add in Step 8]
   
   Name: RESEND_FROM_EMAIL
   Value: noreply@akomaylessonplanna.com
   ```

5. **Deploy Prod Project**
   - Click "Deploy"
   - Wait 2-5 minutes
   - You'll get a URL like: `akomaylessonplanna-xxxxx.vercel.app`
   - **Save this URL!**

#### Vercel Project Configuration Summary

After setup, you should have:

| Project | Branch | Domain (later) | Database |
|---------|--------|----------------|----------|
| **akomaylessonplanna-dev** | `dev` | dev.akomaylessonplanna.com | Dev Supabase |
| **akomaylessonplanna-prod** | `main` | akomaylessonplanna.com | Prod Supabase |

---

### STEP 5: Hostinger DNS Setup (20 minutes + 30 min wait)

Configure DNS for both production domain and dev subdomain.

1. **Log in to Hostinger**
   - Go to https://hpanel.hostinger.com
   - Log in with your account

2. **Open DNS Management**
   - Go to Domains
   - Click on `akomaylessonplanna.com`
   - Find "DNS Zone Editor" or "DNS Management"

#### Configure Production Domain (akomaylessonplanna.com)

**OPTION A: Use Vercel Nameservers (Easier)**
   - In Vercel: Go to **PROD project** → Settings → Domains
   - Add domain: `akomaylessonplanna.com`
   - Copy the nameservers shown
   - In Hostinger: Change nameservers to Vercel's
   
**OPTION B: Add DNS Records (Keep Hostinger Nameservers)**
   - Add A record:
     - Type: `A`
     - Name: `@`
     - Value: `76.76.21.21` (Vercel IP)
   - Add CNAME record for www:
     - Type: `CNAME`
     - Name: `www`
     - Value: `cname.vercel-dns.com`

#### Configure Dev Subdomain (dev.akomaylessonplanna.com)

**Add CNAME Record:**
```
Type: CNAME
Name: dev
Target: cname.vercel-dns.com
TTL: 3600 (or Auto)
```
- Click "Add Record" or "Save"

3. **Configure Custom Domains in Vercel**

   **For Dev Project:**
   - Go to `akomaylessonplanna-dev` project
   - Settings → Domains
   - Click "Add Domain"
   - Enter: `dev.akomaylessonplanna.com`
   - Click "Add"
   - Vercel will verify (may take 5-30 minutes)

   **For Prod Project:**
   - Go to `akomaylessonplanna-prod` project
   - Settings → Domains
   - Click "Add Domain"
   - Enter: `akomaylessonplanna.com`
   - Also add: `www.akomaylessonplanna.com` (redirects to main)
   - Click "Add"
   - Vercel will verify

4. **Wait for DNS Propagation**
   - Takes 5-30 minutes (sometimes up to 1 hour)
   - Check status:
     ```bash
     nslookup dev.akomaylessonplanna.com
     nslookup akomaylessonplanna.com
     ```
   - Both should return Vercel IPs

---

### STEP 6: Google OAuth Setup (25 minutes)

Configure OAuth to work with **both** dev and prod domains.

1. **Create OAuth Client**
   - Go to https://console.cloud.google.com
   - Create new project or select existing
   - Go to APIs & Services → Credentials
   - Click "Create Credentials" → "OAuth 2.0 Client ID"
   - Configure consent screen if prompted

2. **Configure OAuth Client**
   - Application type: "Web application"
   - Name: `AKOMAYLESSONPLANNA`
   
   **Authorized JavaScript origins** (add all):
   - `http://localhost:3000`
   - `https://dev.akomaylessonplanna.com`
   - `https://akomaylessonplanna.com`
   
   **Authorized redirect URIs** (add all):
   - `https://[DEV-SUPABASE-REF].supabase.co/auth/v1/callback`
   - `https://[PROD-SUPABASE-REF].supabase.co/auth/v1/callback`
   - `http://localhost:3000/auth/callback`
   - `https://dev.akomaylessonplanna.com/auth/callback`
   - `https://akomaylessonplanna.com/auth/callback`

3. **Get Your Supabase References**
   - **Dev**: Go to dev Supabase → Settings → General → Copy "Reference ID"
   - **Prod**: Go to prod Supabase → Settings → General → Copy "Reference ID"
   - Example callback: `https://iokinyttkzmcnmznxgza.supabase.co/auth/v1/callback`

4. **Save Credentials**
   - Copy **Client ID**
   - Copy **Client Secret**

5. **Add to DEV Supabase**
   - Go to DEV Supabase Dashboard
   - Authentication → Providers → Google
   - Paste Client ID
   - Paste Client Secret
   - Click "Save"

6. **Add to PROD Supabase**
   - Go to PROD Supabase Dashboard
   - Authentication → Providers → Google
   - Paste same Client ID
   - Paste same Client Secret
   - Click "Save"

---

### STEP 7: Facebook OAuth Setup (30 minutes)

Configure Facebook OAuth for **both** environments.

1. **Create Facebook App**
   - Go to https://developers.facebook.com
   - My Apps → Create App
   - Choose "Consumer"
   - App name: `AKOMAYLESSONPLANNA`

2. **Add Facebook Login**
   - Add Product → Facebook Login → Set Up
   - Choose "Web"

3. **Configure Settings**
   - Go to Facebook Login → Settings
   
   **Valid OAuth Redirect URIs** (add all):
   - `https://[DEV-SUPABASE-REF].supabase.co/auth/v1/callback`
   - `https://[PROD-SUPABASE-REF].supabase.co/auth/v1/callback`
   - `http://localhost:3000/auth/callback`
   - `https://dev.akomaylessonplanna.com/auth/callback`
   - `https://akomaylessonplanna.com/auth/callback`
   
   - Click "Save Changes"

4. **Configure App Settings**
   - Settings → Basic
   
   **App Domains** (add both):
   - `localhost`
   - `dev.akomaylessonplanna.com`
   - `akomaylessonplanna.com`
   
   **Website URL**: `https://akomaylessonplanna.com`
   
   **Data Deletion URL**: `https://akomaylessonplanna.com/api/webhooks/facebook/data-deletion`
   
   - Click "Save Changes"

5. **Get Credentials**
   - Copy **App ID**
   - Click "Show" on **App Secret**, copy it

6. **Add to DEV Supabase**
   - Go to DEV Supabase Dashboard
   - Authentication → Providers → Facebook
   - Paste App ID in "Client ID"
   - Paste App Secret in "Client Secret"
   - Click "Save"

7. **Add to PROD Supabase**
   - Go to PROD Supabase Dashboard
   - Authentication → Providers → Facebook
   - Paste same credentials
   - Click "Save"

8. **Add Secret to Vercel Projects**
   
   **Dev Project:**
   - Go to Vercel → `akomaylessonplanna-dev` → Settings → Environment Variables
   - Add: `FACEBOOK_APP_SECRET` = [Your App Secret]
   
   **Prod Project:**
   - Go to Vercel → `akomaylessonplanna-prod` → Settings → Environment Variables
   - Add: `FACEBOOK_APP_SECRET` = [Your App Secret]

---

### STEP 8: Resend Setup (15 minutes)

1. **Create Account**
   - Go to https://resend.com
   - Sign up

2. **Get API Key**
   - Go to API Keys
   - Click "Create API Key"
   - Name: `akomaylessonplanna`
   - Copy the key (you'll only see it once!)

3. **Add to Both Vercel Projects**
   
   **Dev Project:**
   - Vercel → `akomaylessonplanna-dev` → Settings → Environment Variables
   - Update/Add:
     ```
     RESEND_API_KEY = [Your API Key]
     RESEND_FROM_EMAIL = noreply@akomaylessonplanna.com
     ```
   
   **Prod Project:**
   - Vercel → `akomaylessonplanna-prod` → Settings → Environment Variables
   - Update/Add:
     ```
     RESEND_API_KEY = [Your API Key]
     RESEND_FROM_EMAIL = noreply@akomaylessonplanna.com
     ```

4. **Redeploy Both Projects**
   - Dev: Deployments → Latest → ⋯ → Redeploy
   - Prod: Deployments → Latest → ⋯ → Redeploy

5. **Optional: Verify Custom Domain**
   - In Resend: Domains → Add Domain
   - Add `akomaylessonplanna.com`
   - Add DNS records in Hostinger (SPF, DKIM, DMARC)
   - See: `docs/email-system-dns-setup.md`

---

### STEP 9: Optional - Sentry Setup (15 minutes)

1. **Create Account**
   - Go to https://sentry.io
   - Sign up

2. **Create Project**
   - Platform: "Next.js"
   - Name: `akomaylessonplanna`

3. **Get DSN**
   - Copy the DSN key shown

4. **Add to Both Vercel Projects**
   
   **Dev Project** (Optional - may not want dev errors):
   - Settings → Environment Variables
   - Add: `NEXT_PUBLIC_SENTRY_DSN` = [Your DSN]
   
   **Prod Project** (Recommended):
   - Settings → Environment Variables
   - Add: `NEXT_PUBLIC_SENTRY_DSN` = [Your DSN]

---

## Verification Checklist

After completing all steps, verify **both** environments:

### Local Development
- [ ] Can run `npm run dev`
- [ ] Can connect to database (dev or prod, your choice in .env.local)
- [ ] Can log in with email/password
- [ ] Can log in with Google
- [ ] Can log in with Facebook

### Dev Environment (dev.akomaylessonplanna.com)
- [ ] Site loads with HTTPS (green lock)
- [ ] Can create new account
- [ ] Email/password login works
- [ ] Google OAuth works
- [ ] Facebook OAuth works
- [ ] Connected to dev database (verify by checking data)
- [ ] Email notifications work

### Production Environment (akomaylessonplanna.com)
- [ ] Site loads with HTTPS (green lock)
- [ ] Can create new account
- [ ] Email/password login works
- [ ] Google OAuth works
- [ ] Facebook OAuth works
- [ ] Connected to prod database (separate from dev)
- [ ] Email notifications work
- [ ] www.akomaylessonplanna.com redirects to main domain

### Git Workflow
- [ ] Both `dev` and `main` branches exist on GitHub
- [ ] Pushing to `dev` branch deploys to dev subdomain
- [ ] Pushing to `main` branch deploys to production domain
- [ ] Can switch between branches: `git checkout dev` / `git checkout main`

### Vercel Projects
- [ ] Two separate projects in Vercel dashboard
- [ ] Dev project connected to `dev` branch
- [ ] Prod project connected to `main` branch
- [ ] Both projects have correct environment variables
- [ ] Both projects have custom domains configured

---

## Common Issues

### "Module not found" errors
```bash
# Solution:
npm install
```

### Supabase connection fails
- Verify environment variables match project
- Check .env.local has correct credentials
- Ensure Supabase project is active

### Vercel deployment fails
- Check build logs in Vercel dashboard
- Verify all environment variables are set
- Ensure no TypeScript errors

### Domain not working
- Wait 30-60 minutes for DNS propagation
- Verify DNS settings in Hostinger
- Check domain status in Vercel (should show green checkmark)

### OAuth redirect errors
- Verify redirect URIs include **both** dev and prod domains
- Check Supabase reference IDs are correct
- Ensure no trailing slashes in URLs
- Verify using correct Supabase project (dev vs prod)

### Wrong database connected
**Check environment variables:**
- Dev Vercel project should have dev Supabase credentials
- Prod Vercel project should have prod Supabase credentials
- .env.local can use either (your choice)

### Changes deploying to wrong environment
**Check current Git branch:**
```bash
git branch  # Shows * next to current branch
```
- On `dev` branch? → Deploys to dev subdomain
- On `main` branch? → Deploys to production

### Dev subdomain not loading
- Check DNS propagation: `nslookup dev.akomaylessonplanna.com`
- Verify CNAME record in Hostinger
- Check domain status in dev Vercel project

---

## Environment Summary

After setup, you have three environments:

| Environment | URL | Branch | Database | Purpose |
|-------------|-----|--------|----------|---------|
| **Local** | localhost:3000 | Any | Dev or Prod | Development |
| **Dev** | dev.akomaylessonplanna.com | `dev` | Dev | Testing |
| **Production** | akomaylessonplanna.com | `main` | Prod | Live users |

---

## Next Steps

After setup is complete:

1. ✅ Verify all checkboxes above
2. 📖 Read: [`ENVIRONMENT-VARIABLES.md`](./ENVIRONMENT-VARIABLES.md) - Understand three environments
3. 📖 Read: [`DEPLOYMENT-WORKFLOW.md`](./DEPLOYMENT-WORKFLOW.md) - Learn branch-based workflow
4. 📖 Read: [`DEV-PROD-SETUP-GUIDE.md`](./DEV-PROD-SETUP-GUIDE.md) - Master guide for dev/prod setup
5. 🎯 Make a test change on dev branch
6. 🚀 Deploy to dev subdomain and verify
7. 🎉 Merge to main and deploy to production!

---

**Setup Time**: 3-4 hours total (including DNS wait time)

**Difficulty**: Intermediate (requires Git, Vercel, and Supabase knowledge)

**Support**: Check [DEV-PROD-SETUP-GUIDE.md](./DEV-PROD-SETUP-GUIDE.md) for troubleshooting and daily workflow!
