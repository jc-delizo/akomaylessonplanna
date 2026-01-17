# Vercel Setup Guide - Step by Step

Complete guide to deploy your app to Vercel and connect everything.

## Prerequisites

- ✅ GitHub repository with your code
- ✅ Supabase production project created
- ✅ Domain purchased (akomaylessonplanna.com)
- ✅ All migrations pushed to Supabase

## Step 1: Push Code to GitHub

If you haven't already:

```powershell
# Navigate to project
cd c:\Users\odvip\OneDrive\Desktop\JC\akomaylessonplanna

# Initialize git (if not done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Production ready"

# Add remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/akomaylessonplanna.git

# Push
git branch -M main
git push -u origin main
```

## Step 2: Connect GitHub to Vercel

1. **Go to Vercel:**
   - Visit [vercel.com](https://vercel.com)
   - Click "Sign Up" or "Log In"
   - **Important:** Sign in with GitHub (not email)

2. **Import Project:**
   - Click "Add New..." → "Project"
   - You'll see your GitHub repositories
   - Find `akomaylessonplanna` and click "Import"

3. **Configure Project:**
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** `./` (default)
   - **Build Command:** `npm run build` (default)
   - **Output Directory:** `.next` (default)
   - **Install Command:** `npm install` (default)

4. **Environment Variables (DO THIS NOW):**
   - Before deploying, click "Environment Variables"
   - Add these one by one:

   ```
   Name: NEXT_PUBLIC_SUPABASE_URL
   Value: https://iokinyttkzmcnmznxgza.supabase.co
   Environment: Production, Preview, Development
   
   Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
   Value: [Get from Supabase Dashboard → Settings → API → anon public]
   Environment: Production, Preview, Development
   
   Name: SUPABASE_SERVICE_ROLE_KEY
   Value: [Get from Supabase Dashboard → Settings → API → service_role]
   Environment: Production, Preview, Development
   ⚠️ Keep this secret!
   
   Name: NEXT_PUBLIC_APP_URL
   Value: https://akomaylessonplanna.com
   Environment: Production
   
   Name: RESEND_API_KEY
   Value: [Your Resend API key]
   Environment: Production, Preview
   
   Name: RESEND_FROM_EMAIL
   Value: noreply@akomaylessonplanna.com
   Environment: Production, Preview
   ```

   **How to get Supabase keys:**
   1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
   2. Select project: `iokinyttkzmcnmznxgza`
   3. Go to: **Settings** → **API**
   4. Copy:
      - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
      - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
      - **service_role** → `SUPABASE_SERVICE_ROLE_KEY`

5. **Deploy:**
   - Click "Deploy"
   - Wait 2-5 minutes for build
   - You'll get a URL like: `akomaylessonplanna-xxxxx.vercel.app`

## Step 3: Configure Custom Domain

1. **In Vercel Dashboard:**
   - Go to your project
   - Click **Settings** → **Domains**
   - Click "Add Domain"
   - Enter: `akomaylessonplanna.com`
   - Click "Add"
   - Also add: `www.akomaylessonplanna.com`

2. **Vercel will show DNS instructions:**
   - You'll see DNS records to add
   - **Option A:** Use Vercel nameservers (easiest)
   - **Option B:** Add DNS records manually

## Step 4: Configure DNS in Hostinger

### Option A: Use Vercel Nameservers (Recommended)

1. **In Vercel:** Copy the nameservers shown (e.g., `ns1.vercel-dns.com`)

2. **In Hostinger:**
   - Log in to [hpanel.hostinger.com](https://hpanel.hostinger.com)
   - Go to **Domains** → Select `akomaylessonplanna.com`
   - Find **Nameservers** section
   - Change from Hostinger nameservers to Vercel's nameservers
   - Save

3. **Wait:** DNS propagation takes 5-30 minutes

### Option B: Add DNS Records (Keep Hostinger Nameservers)

1. **In Hostinger:**
   - Go to **DNS Zone Editor** or **DNS Management**
   - Add these records:

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

2. **Wait:** DNS propagation takes 5-30 minutes

## Step 5: Verify Domain

1. **Check DNS Propagation:**
   ```powershell
   nslookup akomaylessonplanna.com
   ```
   Should show Vercel IP addresses

2. **Check in Vercel:**
   - Go to Settings → Domains
   - Status should show "Valid Configuration"
   - SSL certificate will be issued automatically

3. **Test Website:**
   - Visit `https://akomaylessonplanna.com`
   - Should load your app
   - HTTPS should work automatically

## Step 6: Configure Supabase for Production Domain

1. **Update Supabase Auth Settings:**
   - Go to Supabase Dashboard → Your Project
   - **Authentication** → **URL Configuration**
   - **Site URL:** `https://akomaylessonplanna.com`
   - **Redirect URLs:** Add:
     - `https://akomaylessonplanna.com/auth/callback`
     - `https://www.akomaylessonplanna.com/auth/callback`

2. **Update Email Templates (if using custom domain):**
   - Authentication → Email Templates
   - Update links to use `akomaylessonplanna.com`

## Step 7: Test Everything

### Test Checklist:

- [ ] **Domain loads:** `https://akomaylessonplanna.com` works
- [ ] **HTTPS works:** SSL certificate active
- [ ] **Sign up works:** Can create account
- [ ] **Login works:** Can sign in
- [ ] **Database works:** Can see data from Supabase
- [ ] **Storage works:** Can upload files
- [ ] **Email works:** Receives emails (if configured)

## Step 8: Set Up Automatic Deployments

**Already done!** Vercel automatically:
- Watches your GitHub `main` branch
- Deploys on every push
- Creates preview deployments for pull requests

**To deploy updates:**
```bash
git add .
git commit -m "Update feature"
git push origin main
# Vercel automatically deploys!
```

## Troubleshooting

### Domain Not Working

**Symptoms:** Domain shows error or doesn't load

**Solutions:**
1. Check DNS propagation: `nslookup akomaylessonplanna.com`
2. Verify DNS records in Hostinger
3. Check domain status in Vercel Dashboard
4. Wait 30 minutes for DNS propagation

### Build Fails

**Symptoms:** Vercel build shows errors

**Solutions:**
1. Check build logs in Vercel Dashboard
2. Verify environment variables are set
3. Check for TypeScript errors locally: `npm run build`
4. Ensure all dependencies in `package.json`

### Can't Connect to Supabase

**Symptoms:** App loads but can't fetch data

**Solutions:**
1. Verify environment variables in Vercel
2. Check Supabase project is active
3. Verify RLS policies allow access
4. Check browser console for errors

### SSL Certificate Issues

**Symptoms:** HTTPS doesn't work

**Solutions:**
1. Wait 5-10 minutes (Vercel issues SSL automatically)
2. Check domain status in Vercel Dashboard
3. Verify DNS is pointing to Vercel
4. Clear browser cache

## Environment Variables Reference

### Required for Production:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://iokinyttkzmcnmznxgza.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key

# App
NEXT_PUBLIC_APP_URL=https://akomaylessonplanna.com

# Email (if using Resend)
RESEND_API_KEY=your_resend_key
RESEND_FROM_EMAIL=noreply@akomaylessonplanna.com

# Cron (for email queue processing)
CRON_SECRET=your_random_secret_string
```

### Where to Set:

- **Vercel Dashboard** → Your Project → Settings → Environment Variables
- Set for **Production** environment
- Optionally set for **Preview** and **Development**

## Next Steps After Deployment

1. **Monitor:**
   - Check Vercel Analytics
   - Monitor Supabase Dashboard for usage
   - Set up error tracking (optional)

2. **Optimize:**
   - Enable Vercel Analytics
   - Set up caching strategies
   - Monitor performance

3. **Backup:**
   - Regular database backups (Supabase handles this)
   - Keep code in GitHub
   - Document important configurations

## Support Resources

- **Vercel Docs:** https://vercel.com/docs
- **Supabase Docs:** https://supabase.com/docs
- **Hostinger Support:** https://www.hostinger.com/contact
