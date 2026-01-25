# Dev/Prod Isolated Environment Setup Guide

This guide walks you through setting up **completely isolated development and production environments** for akomaylessonplanna. This approach keeps your dev work separate from your live production site.

## Why Use Isolated Environments?

### Simple Approach (Current)
```
Local Dev → Push to GitHub → Auto-deploy to Production
```
**Risk**: Every push goes straight to production!

### Isolated Approach (This Guide)
```
Local Dev → Push to dev branch → Dev subdomain (test here)
           ↓
When ready → Merge to main → Production site
```
**Benefits**: 
- Safe testing on dev.akomaylessonplanna.com
- Production never breaks during development
- Test with real databases, email, OAuth
- Share dev site for feedback before going live

## Prerequisites

Before starting, ensure you have:

- ✅ GitHub repository: `akomaylessonplanna`
- ✅ Two Supabase projects created:
  - Dev project (for testing)
  - Prod project (for live site)
- ✅ Hostinger account with domain: `akomaylessonplanna.com`
- ✅ Vercel account (connected to GitHub)
- ✅ Basic familiarity with Git commands

## Architecture Overview

```mermaid
flowchart TD
    A[Local Development] --> B{Git Branch}
    B -->|dev branch| C[Push to GitHub dev]
    B -->|main branch| D[Push to GitHub main]
    C --> E[Vercel Project 1: Dev]
    D --> F[Vercel Project 2: Production]
    E --> G[dev.akomaylessonplanna.com]
    F --> H[akomaylessonplanna.com]
    G --> I[Dev Supabase Database]
    H --> J[Prod Supabase Database]
```

## Setup Process

### Phase 1: Create Dev Branch (5 minutes)

1. **Open Terminal in VS Code**
   ```bash
   # Create and switch to dev branch
   git checkout -b dev
   
   # Push dev branch to GitHub
   git push -u origin dev
   ```

2. **Verify on GitHub**
   - Go to your GitHub repository
   - Click the branch dropdown
   - You should see both `main` and `dev` branches

### Phase 2: Set Up Vercel Dev Project (15 minutes)

#### Step 1: Create New Vercel Project for Dev

1. **Go to Vercel Dashboard**
   - Visit https://vercel.com/dashboard
   - Click "Add New..." → "Project"

2. **Import Repository AGAIN**
   - Yes, you'll import the same `akomaylessonplanna` repository
   - Click "Import"

3. **Configure Project Settings**
   - **Project Name**: `akomaylessonplanna-dev`
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./` (leave default)
   - **Build Command**: `npm run build` (leave default)

4. **IMPORTANT: Configure Branch**
   - Before clicking Deploy, go to Git section
   - **Production Branch**: Change from `main` to `dev`
   - This ensures this project only deploys from `dev` branch

#### Step 2: Add Dev Environment Variables

Click "Environment Variables" and add these for **Production** environment:

```
NEXT_PUBLIC_SUPABASE_URL
Value: [Your DEV Supabase project URL]

NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: [Your DEV Supabase anon key]

SUPABASE_SERVICE_ROLE_KEY
Value: [Your DEV Supabase service role key]

NEXT_PUBLIC_APP_URL
Value: https://dev.akomaylessonplanna.com

RESEND_API_KEY
Value: [Your Resend API key - same as prod]

RESEND_FROM_EMAIL
Value: noreply@akomaylessonplanna.com

FACEBOOK_APP_SECRET
Value: [Your Facebook app secret - same as prod]

CRON_SECRET
Value: [Generate new one or use same as prod]
```

**How to get DEV Supabase credentials:**
- Go to your DEV Supabase project
- Settings → API
- Copy Project URL, anon key, and service_role key

5. **Deploy Dev Project**
   - Click "Deploy"
   - Wait 2-5 minutes
   - You'll get a URL like: `akomaylessonplanna-dev-xxxxx.vercel.app`
   - **Save this URL!**

### Phase 3: Configure Production Vercel Project (10 minutes)

Your existing Vercel project becomes the production project.

1. **Go to Your Existing Project**
   - Vercel Dashboard → Select `akomaylessonplanna` (your original project)

2. **Rename for Clarity (Optional but Recommended)**
   - Settings → General
   - Project Name: `akomaylessonplanna-prod`
   - Click "Save"

3. **Verify Branch Settings**
   - Settings → Git
   - **Production Branch**: Should be `main`
   - This is usually the default, just verify it

4. **Update Environment Variables**
   - Settings → Environment Variables
   - Verify `NEXT_PUBLIC_APP_URL` is set to: `https://akomaylessonplanna.com`
   - Ensure all other variables use **PROD** Supabase credentials

### Phase 4: Configure DNS for Dev Subdomain (15 minutes)

1. **Log in to Hostinger**
   - Go to https://hpanel.hostinger.com
   - Navigate to Domains → `akomaylessonplanna.com`

2. **Open DNS Zone Editor**
   - Find "DNS Zone" or "DNS Management"

3. **Add CNAME Record for Dev Subdomain**
   ```
   Type: CNAME
   Name: dev
   Target: cname.vercel-dns.com
   TTL: 3600 (or Auto)
   ```
   - Click "Add Record" or "Save"

4. **Configure Domain in Vercel Dev Project**
   - Go to Vercel → `akomaylessonplanna-dev` project
   - Settings → Domains
   - Click "Add Domain"
   - Enter: `dev.akomaylessonplanna.com`
   - Click "Add"
   - Vercel will verify DNS (may take 5-30 minutes)

5. **Wait for DNS Propagation**
   - Takes 5-30 minutes
   - Check status: `nslookup dev.akomaylessonplanna.com`
   - When ready, Vercel will show green checkmark

### Phase 5: Update OAuth Redirect URIs (20 minutes)

Add dev subdomain to all OAuth providers:

#### Google OAuth

1. **Go to Google Cloud Console**
   - https://console.cloud.google.com
   - APIs & Services → Credentials
   - Click on your OAuth 2.0 Client ID

2. **Add Dev Redirect URIs**
   - Authorized JavaScript origins:
     - Add: `https://dev.akomaylessonplanna.com`
   - Authorized redirect URIs:
     - Add: `https://dev.akomaylessonplanna.com/auth/callback`
   - Click "Save"

#### Facebook OAuth

1. **Go to Facebook Developers**
   - https://developers.facebook.com
   - Your App → Facebook Login → Settings

2. **Add Dev Redirect URIs**
   - Valid OAuth Redirect URIs:
     - Add: `https://dev.akomaylessonplanna.com/auth/callback`
   - App Domains:
     - Add: `dev.akomaylessonplanna.com`
   - Click "Save Changes"

#### Supabase Dev Project

1. **Go to Dev Supabase Project**
   - Dashboard → Authentication → URL Configuration

2. **Update Site URL and Redirects**
   - Site URL: `https://dev.akomaylessonplanna.com`
   - Redirect URLs (add these):
     - `http://localhost:3000/auth/callback`
     - `https://dev.akomaylessonplanna.com/auth/callback`
   - Click "Save"

#### Supabase Prod Project (Verify)

1. **Go to Prod Supabase Project**
   - Verify Site URL: `https://akomaylessonplanna.com`
   - Verify Redirect URLs include:
     - `https://akomaylessonplanna.com/auth/callback`

### Phase 6: Database Migration Setup (10 minutes)

Configure Supabase CLI for both environments:

1. **Install Supabase CLI** (if not already installed)
   ```bash
   npm install -g supabase
   ```

2. **Get Connection Strings**
   
   **Dev Database:**
   - Go to Dev Supabase project
   - Settings → Database
   - Copy "Connection string" (Connection Pooling - Transaction mode)
   - Format: `postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`
   
   **Prod Database:**
   - Go to Prod Supabase project
   - Copy same connection string format

3. **Save Connection Strings**
   - Create a file: `docs/supabase-connections.txt` (DO NOT commit to Git!)
   - Save both connection strings for reference

4. **Test Connection**
   ```bash
   # Test dev database
   npx supabase db push --db-url "your-dev-connection-string"
   
   # Should show: "Finished supabase db push"
   ```

## Verification Checklist

After completing all phases, verify your setup:

### Local Development
- [ ] Can run `npm run dev`
- [ ] Can connect to dev database
- [ ] OAuth login works locally

### Dev Environment (dev.akomaylessonplanna.com)
- [ ] Site loads with HTTPS
- [ ] Can create account
- [ ] Email login works
- [ ] Google OAuth works
- [ ] Facebook OAuth works
- [ ] Can create/edit products
- [ ] Connected to dev database (test data only)

### Production Environment (akomaylessonplanna.com)
- [ ] Site loads with HTTPS
- [ ] Existing users can log in
- [ ] All features work
- [ ] Connected to prod database
- [ ] No dev/test data visible

### Git Workflow
- [ ] `dev` branch exists on GitHub
- [ ] `main` branch exists on GitHub
- [ ] Can push to dev branch
- [ ] Can push to main branch
- [ ] Dev branch auto-deploys to dev subdomain
- [ ] Main branch auto-deploys to production domain

## Daily Development Workflow

Now that setup is complete, here's your new workflow:

### Working on New Features

```bash
# 1. Switch to dev branch
git checkout dev

# 2. Make your changes in VS Code

# 3. Test locally
npm run dev
# Open localhost:3000

# 4. Commit and push to dev
git add .
git commit -m "Add new feature"
git push origin dev
# → Auto-deploys to dev.akomaylessonplanna.com

# 5. Test on dev subdomain
# Open dev.akomaylessonplanna.com
# Test thoroughly with real users/data

# 6. When ready for production:
git checkout main
git merge dev
git push origin main
# → Auto-deploys to akomaylessonplanna.com
```

### Creating Database Migrations

```bash
# 1. Create migration file
npx supabase migration new feature_name

# 2. Edit the migration file in supabase/migrations/

# 3. Apply to DEV database first
npx supabase db push --db-url "dev-connection-string"

# 4. Test on dev.akomaylessonplanna.com

# 5. When ready, apply to PROD database
npx supabase db push --db-url "prod-connection-string"

# 6. Commit migration file
git add supabase/migrations/
git commit -m "Add migration: feature_name"
git push
```

### Hotfixes (Emergency Production Fixes)

If production is broken and needs immediate fix:

```bash
# 1. Switch to main branch
git checkout main

# 2. Make the fix

# 3. Test locally
npm run dev

# 4. Push directly to main
git add .
git commit -m "Hotfix: description"
git push origin main
# → Deploys to production immediately

# 5. Merge fix back to dev
git checkout dev
git merge main
git push origin dev
```

## Environment Comparison

| Aspect | Local | Dev | Production |
|--------|-------|-----|------------|
| **URL** | localhost:3000 | dev.akomaylessonplanna.com | akomaylessonplanna.com |
| **Branch** | Any | `dev` | `main` |
| **Database** | Dev or Prod | Dev Supabase | Prod Supabase |
| **Vercel Project** | N/A | akomaylessonplanna-dev | akomaylessonplanna-prod |
| **Purpose** | Development | Testing | Live users |
| **Data** | Test data | Test data | Real user data |
| **Breaking OK?** | Yes | Yes | NO! |
| **OAuth** | Works | Works | Works |
| **Emails** | Sent | Sent | Sent |

## Troubleshooting

### Dev subdomain not working

**Check DNS:**
```bash
nslookup dev.akomaylessonplanna.com
```
Should return Vercel IP. If not, wait longer (up to 1 hour) or check DNS settings.

**Check Vercel:**
- Go to dev project → Domains
- Should show green checkmark next to `dev.akomaylessonplanna.com`

### OAuth not working on dev subdomain

**Verify redirect URIs:**
- Google: Check authorized redirect URIs include dev subdomain
- Facebook: Check valid OAuth redirect URIs include dev subdomain
- Supabase: Check redirect URLs in dev project

### Wrong database connected

**Check environment variables:**
- Vercel dev project should have dev Supabase URL
- Vercel prod project should have prod Supabase URL
- `.env.local` can use either (your choice for local dev)

### Deployment going to wrong environment

**Check branch:**
```bash
git branch  # Shows current branch
```
- If on `dev` → Pushes deploy to dev subdomain
- If on `main` → Pushes deploy to production

**Check Vercel project settings:**
- Dev project → Settings → Git → Production Branch should be `dev`
- Prod project → Settings → Git → Production Branch should be `main`

### Changes not showing on dev subdomain

1. Verify you pushed to `dev` branch: `git log origin/dev`
2. Check Vercel dashboard for deployment status
3. Hard refresh browser: `Ctrl + Shift + R`
4. Check correct URL: dev.akomaylessonplanna.com (not .com)

## Migration from Simple Setup

If you're coming from a simple single-environment setup:

1. **Your current production is safe**
   - Existing Vercel project stays as-is
   - Just rename it to `akomaylessonplanna-prod`

2. **Create dev branch**
   - Branch off from current main
   - All existing code is in dev branch

3. **Import repo again for dev project**
   - Configure to use dev branch
   - Point to dev subdomain

4. **Test dev environment**
   - Make a small change on dev branch
   - Verify it deploys to dev subdomain only

5. **Continue normal workflow**
   - Develop on dev branch
   - Merge to main when ready

## Benefits Summary

✅ **Safety**: Break things on dev without affecting production
✅ **Testing**: Real environment testing before going live
✅ **Collaboration**: Share dev.akomaylessonplanna.com for feedback
✅ **Database**: Separate databases prevent data corruption
✅ **Confidence**: Know changes work before deploying
✅ **Rollback**: Easy to keep production stable
✅ **Professional**: Industry-standard development workflow

## Cost Implications

- **Vercel**: Both projects on Free tier (if under limits)
- **Supabase**: Both projects on Free tier (if under limits)
- **Hostinger**: No extra cost (just DNS CNAME record)
- **GitHub**: No extra cost (same repository)

**Total Extra Cost**: $0 (if staying within free tier limits)

## Next Steps

1. ✅ Complete this setup guide
2. 📖 Read: [CONFIGURATION-SETUP.md](./CONFIGURATION-SETUP.md) - Detailed config reference
3. 📖 Read: [ENVIRONMENT-VARIABLES.md](./ENVIRONMENT-VARIABLES.md) - Env vars for three environments
4. 📖 Read: [DEPLOYMENT-WORKFLOW.md](./DEPLOYMENT-WORKFLOW.md) - Branch-based workflow details
5. 🎯 Make first test change on dev branch
6. 🚀 Deploy to dev subdomain and verify
7. 🎉 Start using dev/prod workflow!

---

**Setup Time**: 1-2 hours (including DNS wait time)

**Difficulty**: Intermediate (requires Git and Vercel knowledge)

**Support**: If stuck, check Vercel documentation or ask for help!
