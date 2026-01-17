# Pre-Development Preparation Checklist

**Project:** AKOMAYLESSONPLANNA - Filipino Teacher Lesson Plan Marketplace
**Purpose:** Complete all preparations BEFORE writing any application code
**Estimated Time:** 1-2 weeks (can be done parallel with initial setup)
**Status:** 📋 NOT STARTED

---

## Overview

This checklist ensures all accounts, services, and configurations are ready BEFORE starting development. Completing these tasks prevents interruptions and delays during coding.

**Why This Matters:**
- Payment API approvals can take 1-4 weeks
- Domain setup requires DNS configuration
- Database setup affects architecture decisions
- Environment variables need to be configured locally
- Service accounts are harder to add mid-development

**Completion Target:** All tasks marked ✅ before Day 1 of Phase 1

---

## Section 1: Developer Accounts & Registrations

### 1.1 Supabase Account (HIGH PRIORITY - IMMEDIATE)

**Purpose:** Backend database, authentication, file storage, real-time features

**Steps:**
1. Go to https://supabase.com
2. Click "Start your project"
3. Sign up with GitHub OR Google (recommended for speed)
4. Verify email address
5. Complete onboarding tour
6. Navigate to https://supabase.com/dashboard

**Information to Prepare:**
- Email: Use your primary development email
- Organization name: "AKOMAYLESSONPLANNA" or "AKOMAY LP"
- Project name: "akomaylessonplanna-prod" (for production)

**Free Tier Limits (Start Here):**
- 500 MB database storage
- 1 GB file storage
- 2 GB bandwidth/month
- 50,000 MAU (monthly active users)
- Enough for MVP and launch!

**✅ Completion Criteria:**
- [ ] Account created and verified
- [ ] Can access Supabase dashboard
- [ ] Organization created
- [ ] Note down your Supabase project URL and anon key (keep secure!)

**Time Required:** 15 minutes

---

### 1.2 GCash Developer Account (HIGH PRIORITY - START IMMEDIATELY)

**Purpose:** Primary payment method for buyers (80%+ of transactions)

**Why Start Now:** Approval takes 1-4 weeks depending on documentation

**Steps:**
1. Go to https://developers.gcash.app/
2. Click "Register" or "Sign Up"
3. Choose account type:
   - **Individual**: If you don't have business registration yet
   - **Business**: If you have DTI/BIR registration
4. Fill in required information:
   - Full name (as valid ID)
   - Email address
   - Mobile number (must be GCash registered)
   - Valid ID details (prepare scanned copy)
5. Submit application

**Documents Needed:**
- Valid government ID (UMID, Passport, Driver's License, etc.)
- Proof of income or business (if individual)
- DTI/BIR registration (if business - not required initially)
- Tax Identification Number (TIN)

**Approval Process:**
- Submission → Review (3-5 business days) → Email response
- If approved: You'll get API keys and sandbox access
- If rejected: They'll explain what's missing

**✅ Completion Criteria:**
- [ ] Application submitted
- [ ] Application reference number saved
- [ ] Check email regularly for updates
- [ ] Once approved: Save API keys in secure password manager

**Time Required:** 30 minutes to apply, 1-4 weeks for approval

**Notes:**
- Can start development with sandbox/test mode without approval
- Need approval before going live to production
- Keep approval email for records

---

### 1.3 Maya Business Developer Account (MEDIUM PRIORITY - START AFTER GCASH)

**Purpose:** Secondary payment method (backup option for buyers)

**Why Secondary:** Apply after GCash to have at least one payment option ready

**Steps:**
1. Go to https://developers.maya.ph/
2. Click "Get Started" or "Register"
3. Create business account:
   - Business name
   - Business type (Sole Proprietorship if no registration yet)
   - Business email
   - Business contact number
   - Business address
4. Upload documents (similar to GCash)
5. Submit application

**Documents Needed:**
- Valid ID
- DTI Registration (if available)
- Mayor's Permit (if available)
- Proof of address (utility bill)

**✅ Completion Criteria:**
- [ ] Application submitted
- [ ] Reference number saved
- [ ] Monitoring email for approval

**Time Required:** 30 minutes to apply, 1-3 weeks for approval

---

### 1.4 Domain Registration (HIGH PRIORITY - DO THIS WEEK)

**Purpose:** Custom domain for your marketplace (professional branding)

**Recommended Domains (in order of preference):**
1. `akomaylessonplanna.com` (exact match)
2. `akomay-lessonplanna.com` (with hyphen)
3. `akomaylp.com` (shorter)
4. `akomaymarketplace.com` (alternative)

**Domain Registrars (Philippines-friendly):**
- **Namecheap** (~$10-12/year) - Recommended
- **Cloudflare Registrar** (~$8-10/year) - No markup
- **GoDaddy** (~$12-15/year)
- **Netlify** (free with domain purchase)

**Steps:**
1. Check domain availability at https://www.namecheap.com/domains/registration/
2. Add available domain to cart
3. Create account (or sign in)
4. Complete purchase (use PayPal or GCash if available)
5. Enable WHOIS privacy protection (usually free)
6. Save domain login credentials

**DNS Configuration (Do This After Purchase):**
- Log in to domain registrar (Namecheap, etc.)
- Find "DNS" or "Nameservers" section
- Keep default nameservers for now (we'll update when deploying to Vercel)

**✅ Completion Criteria:**
- [ ] Domain purchased and owned by you
- [ ] Domain login credentials saved
- [ ] WHOIS privacy enabled
- [ ] Domain expires 1+ year from now (auto-renew enabled)
- [ ] Note down exact domain name for .env files

**Time Required:** 20 minutes

**Cost:** ₱600-800/year (~$10-12)

---

### 1.5 Vercel Account (HIGH PRIORITY - IMMEDIATE)

**Purpose:** Hosting and deployment for Next.js application

**Steps:**
1. Go to https://vercel.com
2. Click "Sign Up"
3. Sign up with GitHub (STRONGLY RECOMMENDED)
   - Why? Easy deployment, automatic previews, CI/CD
4. Authorize Vercel to access your GitHub
5. Choose username (e.g., your name or "akomaylessonplanna")
6. Verify email address
7. Navigate to dashboard

**Free Tier Limits (Plenty for MVP):**
- Unlimited projects
- 100 GB bandwidth/month
- 100 GB hours of serverless execution
- Automatic HTTPS
- Global CDN
- Preview deployments for every Git branch

**✅ Completion Criteria:**
- [ ] Account created with GitHub
- [ ] Can access Vercel dashboard
- [ ] GitHub repository connected (can do later)

**Time Required:** 10 minutes

---

### 1.6 GitHub Repository (HIGH PRIORITY - IMMEDIATE)

**Purpose:** Version control, backup, collaboration, Vercel deployment

**Steps:**
1. Go to https://github.com
2. Sign in or create account
3. Click "+" → "New repository"
4. Repository name: `akomaylessonplanna`
5. Description: "Filipino Teacher Lesson Plan Marketplace"
6. Choose visibility: **Private** (recommended until launch)
7. Initialize with:
   - [x] Add a README file
   - [ ] Add .gitignore (Next.js template will add this)
   - [ ] Choose a license (can add later)
8. Click "Create repository"

**After Creating Repo:**
1. Copy repository URL: `https://github.com/YOUR_USERNAME/akomaylessonplanna.git`
2. Save this URL - we'll use it to push local code

**✅ Completion Criteria:**
- [ ] Repository created on GitHub
- [ ] Repository URL saved
- [ ] Repository is private (until launch)

**Time Required:** 5 minutes

---

### 1.7 Sentry Account (OPTIONAL - RECOMMENDED)

**Purpose:** Error tracking and monitoring (catch production bugs)

**Steps:**
1. Go to https://sentry.io
2. Click "Start Free" or "Sign Up"
3. Sign up with GitHub or email
4. Create new project:
   - Platform: "Next.js"
   - Project name: "akomaylessonplanna-frontend"
5. Get DSN (Data Source Name) key

**Free Tier:**
- 5,000 errors/month
- Enough for development and launch
- Upgrade later if needed

**✅ Completion Criteria:**
- [ ] Sentry account created
- [ ] Project created
- [ ] DSN key saved (for .env files)

**Time Required:** 10 minutes

---

### 1.8 Resend Account (OPTIONAL - FOR EMAIL)

**Purpose:** Transactional emails (welcome, order confirmations, password reset)

**Steps:**
1. Go to https://resend.com
2. Click "Sign Up"
3. Create account
4. Verify email domain (can use your domain or Gmail initially)
5. Get API key

**Free Tier:**
- 3,000 emails/month
- Enough for MVP and launch

**Alternative:** SendGrid (similar free tier), or Supabase emails (built-in)

**✅ Completion Criteria:**
- [ ] Resend account created
- [ ] API key saved
- [ ] Email domain verified (or use default)

**Time Required:** 10 minutes

---

## Section 2: Business & Legal (Can Do During Development)

### 2.1 DTI Business Registration

**Purpose:** Legally register business name

**When:** Before official launch (can wait until Month 4-5)

**Process:**
1. Go to https://bnrs.dti.gov.ph
2. Check business name availability
3. Online application via DTI BNRS portal
4. Payment (₱200-₱1,000 depending on scope)
5. Receive DTI certificate (PDF)

**Documents Needed:**
- Valid ID
- TIN (if available)
- Proof of address

**Cost:** ₱200-₱1,000

**Time Required:** 1-3 days (online)

**Note:** Can apply for GCash/Maya as individual first, register business later

---

### 2.2 BIR Registration

**Purpose:** Tax compliance

**When:** When earning consistent income (Month 3+ or ₱10,000+ revenue)

**Process:**
1. Register as professional or sole proprietor
2. Go to nearest BIR district office
3. Bring valid IDs, DTI certificate, proof of address
4. File Form 1901 (application for registration)
5. Pay registration fee (₱500-₱1,000)
6. Get TIN and Certificate of Registration

**Cost:** ₱500-₱1,500

**Time Required:** 1-2 days

**Note:** Can operate without BIR initially, but must register once earning

---

### 2.3 Mayor's Permit

**Purpose:** Local business permit

**When:** After DTI/BIR registration (Month 5+)

**Process:**
1. Go to city/municipal hall where you live
2. Business permit section
3. Bring DTI and BIR certificates
4. Fill out application form
5. Pay fee (₱2,000-₱5,000 depending on city)

**Cost:** ₱2,000-₱5,000/year

**Time Required:** 3-5 days

---

## Section 3: Technical Setup (Before Coding)

### 3.1 Local Environment Setup

**Prerequisites:**
- [ ] Node.js 18+ installed (check with `node --version`)
- [ ] npm or yarn installed (check with `npm --version`)
- [ ] Git installed (check with `git --version`)
- [ ] VS Code or Cursor installed
- [ ] Supabase CLI installed (optional but recommended)

**If Missing:**

**Install Node.js:**
1. Go to https://nodejs.org
2. Download LTS version (18.x or 20.x)
3. Run installer

**Install Git:**
1. Go to https://git-scm.com/downloads
2. Download Windows installer
3. Run installer with default options

**Install Supabase CLI (Optional):**
```bash
npm install -g supabase
```

**✅ Completion Criteria:**
- [ ] Node.js 18+ installed
- [ ] npm/yarn working
- [ ] Git configured with your name and email
- [ ] Cursor/VS Code installed

**Time Required:** 30 minutes

---

### 3.2 Create Supabase Project

**Steps:**
1. Log in to https://supabase.com/dashboard
2. Click "New Project"
3. Fill in:
   - **Name**: `akomaylessonplanna-prod`
   - **Database Password**: Generate strong password (SAVE THIS!)
   - **Region**: Southeast Asia (Singapore) - closest to Philippines
   - **Pricing Plan**: Free (for now)
4. Click "Create new project"
5. Wait 2-3 minutes for project to be ready

**After Project Creation:**
1. Note down:
   - Project URL: `https://xxxxx.supabase.co`
   - `anon` public key: `eyJhbGc...`
   - `service_role` key (keep secret - never expose!)
2. Store these in password manager (Bitwarden, 1Password, etc.)

**✅ Completion Criteria:**
- [ ] Supabase project created
- [ ] Project URL saved
- [ ] anon key saved
- [ ] service_role key saved securely
- [ ] Database password saved securely

**Time Required:** 10 minutes

---

### 3.3 Configure Supabase Database

**In Supabase Dashboard:**

1. Go to **SQL Editor** (left sidebar)
2. Click "New Query"
3. Run this test query:
```sql
SELECT 'Database is ready!' as status;
```
4. You should see result: "Database is ready!"

**Enable Extensions:**
1. Go to **Database** → **Extensions**
2. Search and enable these extensions:
   - [ ] `pgcrypto` (for encryption)
   - [ ] `uuid-ossp` (for UUID generation)
   - [ ] `pgjwt` (for JWT auth)

**✅ Completion Criteria:**
- [ ] Database accessible via SQL Editor
- [ ] Test query successful
- [ ] Extensions enabled

**Time Required:** 15 minutes

---

### 3.4 Set Up GitHub Repository Locally

**In Your Terminal:**

```bash
# Navigate to project directory
cd C:\Users\odvip\OneDrive\Desktop\JC\akomaylessonplanna

# Initialize git if not already
git init

# Add all files
git add .

# Commit initial state
git commit -m "Initial commit from shadcn template"

# Add remote repository (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/akomaylessonplanna.git

# Push to GitHub
git push -u origin master
```

**✅ Completion Criteria:**
- [ ] Local repository initialized
- [ ] Code pushed to GitHub
- [ ] Can see code at github.com/YOUR_USERNAME/akomaylessonplanna

**Time Required:** 5 minutes

---

### 3.5 Create Environment Variables Template

**Create file:** `.env.local.example`

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# GCash Payment (when approved)
NEXT_PUBLIC_GCASH_CLIENT_ID=your_gcash_client_id
GCASH_CLIENT_SECRET=your_gcash_client_secret
GCASH_WEBHOOK_SECRET=your_gcash_webhook_secret

# Maya Payment (when approved)
NEXT_PUBLIC_MAYA_CLIENT_ID=your_maya_client_id
MAYA_CLIENT_SECRET=your_maya_client_secret
MAYA_WEBHOOK_SECRET=your_maya_webhook_secret

# Sentry (error tracking)
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
SENTRY_AUTH_TOKEN=your_sentry_auth_token

# Resend (email)
RESEND_API_KEY=your_resend_api_key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

**✅ Completion Criteria:**
- [ ] `.env.local.example` created in project root
- [ ] `.env.local` created with actual values (DO NOT COMMIT THIS FILE)
- [ ] `.env.local` added to `.gitignore`

**Time Required:** 10 minutes

---

### 3.6 Install Supabase Client Libraries

**In Project Root:**

```bash
# Install Supabase client
npm install @supabase/supabase-js

# Install Supabase auth helpers for Next.js
npm install @supabase/auth-helpers-nextjs

# Install Supabase storage for file uploads
npm install @supabase/storage-js
```

**✅ Completion Criteria:**
- [ ] All Supabase packages installed
- [ ] No errors in `npm install` output

**Time Required:** 3 minutes

---

### 3.7 Configure Git Repository

**Create/Edit:** `.gitignore`

Ensure these lines are present:

```
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/

# Production
build/
dist/
.next/
out/

# Misc
.DS_Store
*.pem

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env*.local
.env.production

# Vercel
.vercel

# TypeScript
*.tsbuildinfo
next-env.d.ts

# Supabase
.supabase/

# Cursor
.cursorrules
.cursorhints

# IDE
.vscode/
.idea/
*.swp
*.swo
```

**✅ Completion Criteria:**
- [ ] `.gitignore` updated
- [ ] Sensitive files excluded from git

**Time Required:** 2 minutes

---

## Section 4: Development Tools Configuration

### 4.1 Configure Cursor AI (if using Cursor)

**Cursor Rules (`.cursorrules`):**

```
You are building AKOMAYLESSONPLANNA, a Filipino teacher lesson plan marketplace.

Tech Stack:
- Next.js 16 with App Router
- TypeScript
- Tailwind CSS v4
- Supabase (PostgreSQL, Auth, Storage)
- shadcn/ui components

Key Principles:
1. Use TypeScript strictly - no `any` types
2. Follow shadcn/ui patterns for components
3. Server Components by default, Client Components only when needed
4. Supabase Row Level Security (RLS) for all data access
5. Watermark all downloadable files with buyer email
6. All prices in Philippine Peso (₱)
7. Optimize for mobile (70%+ of Filipino users)

Code Style:
- Use functional components with hooks
- Prefer async/await over promises
- Use Tailwind for all styling
- Keep components < 300 lines
- Extract reusable logic to hooks

Security:
- Never expose service_role keys on client
- Validate all inputs server-side
- Use Supabase auth middleware
- Sanitize user content

Performance:
- Use Next.js Image for all images
- Implement pagination (max 50 items per page)
- Lazy load heavy components
- Optimize database queries

Testing:
- Write tests for critical business logic
- Test payment flows thoroughly
- Test file upload/download with watermarks
```

**✅ Completion Criteria:**
- [ ] `.cursorrules` file created
- [ ] Cursor configured for this project

**Time Required:** 5 minutes

---

### 4.2 Set Up ESLint and Prettier

**Install Prettier:**
```bash
npm install -D prettier eslint-config-prettier
```

**Create:** `.prettierrc`
```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

**✅ Completion Criteria:**
- [ ] Prettier installed
- [ ] Prettier config created
- [ ] Format on save enabled in editor

**Time Required:** 3 minutes

---

## Section 5: Planning & Documentation

### 5.1 Create Project Folder Structure

```
akomaylessonplanna/
├── app/                    # Next.js app directory
│   ├── (auth)/            # Auth group (login, signup)
│   ├── (dashboard)/       # Dashboard group (seller, buyer)
│   ├── (public)/          # Public pages (home, browse)
│   ├── api/               # API routes
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── forms/            # Form components
│   ├── layouts/          # Layout components
│   └── features/         # Feature-specific components
├── lib/                  # Utility functions
│   ├── supabase/        # Supabase client
│   ├── utils/           # Helper functions
│   └── validations/     # Zod schemas
├── types/               # TypeScript types
├── hooks/               # Custom React hooks
├── docs/                # Documentation
│   ├── dev/            # Development plans
│   └── 2025-01-09-*    # Design docs
├── public/              # Static assets
└── tests/               # Tests (when ready)
```

**✅ Completion Criteria:**
- [ ] Folder structure understood
- [ ] Empty folders created for missing structure

**Time Required:** 5 minutes

---

### 5.2 Create Development Log

**Create file:** `docs/DEVELOPMENT-LOG.md`

```markdown
# Development Log

Track daily progress, blockers, and decisions.

## Format

### [Date] - [Phase/Feature]

**Completed:**
- [ ] Task 1
- [ ] Task 2

**Blocked On:**
- Issue description

**Decisions Made:**
- Decision and rationale

**Tomorrow:**
- Next tasks

---

## Entries

### [Current Date] - Pre-Development

**Completed:**
- [ ] All pre-development checklist items

**Started:**
- [ ] Phase 1: Foundation

**Notes:**
- Initial setup complete
```

**✅ Completion Criteria:**
- [ ] Development log created
- [ ] Ready to track daily progress

**Time Required:** 5 minutes

---

## Summary Checklist

### MUST COMPLETE BEFORE CODING (Week 1)

- [ ] Supabase account and project created
- [ ] Domain registered
- [ ] Vercel account created
- [ ] GitHub repository created and pushed
- [ ] Local environment setup (Node, Git, Cursor)
- [ ] Environment variables template created
- [ ] Supabase client libraries installed
- [ ] Git repository configured
- [ ] `.cursorrules` configured
- [ ] Development log created

### SHOULD COMPLETE SOON (Week 1-2)

- [ ] GCash developer application submitted
- [ ] Maya developer application submitted (after GCash)
- [ ] Sentry account created (optional)
- [ ] Resend account created (optional)

### CAN DO DURING DEVELOPMENT (Month 3-5)

- [ ] DTI business registration
- [ ] BIR registration
- [ ] Mayor's permit

---

## Next Steps After This Checklist

1. **Review all implementation plans in `docs/dev/`**
2. **Start Phase 1: Foundation** (following detailed feature plans)
3. **Join Discord/community** for support (optional)
4. **Set up weekly progress reviews**

---

## Troubleshooting

**Issue: GCash application taking too long**
- **Solution:** Start development with sandbox/test mode, don't wait for approval

**Issue: Domain DNS not working**
- **Solution:** Use Vercel's default domain (vercel.app) during development

**Issue: Supabase project limits reached**
- **Solution:** Free tier is enough for MVP. Upgrade only after 50k MAU

**Issue: Can't decide on business registration**
- **Solution:** Apply as individual first, register business when earning

---

## Resources

**Useful Links:**
- Supabase Docs: https://supabase.com/docs
- Next.js Docs: https://nextjs.org/docs
- shadcn/ui: https://ui.shadcn.com
- Vercel Deployment: https://vercel.com/docs
- GCash Developers: https://developers.gcash.app
- Maya Developers: https://developers.maya.ph

**Communities:**
- Supabase Discord: https://supabase.com/community-discord
- Next.js Discord: https://discord.com/invite/nextjs
- r/nextjs on Reddit
- r/FilipinoProgrammers on Reddit

---

**Status:** 📋 Ready to execute
**Last Updated:** 2025-01-10
**Version:** 1.0

**Remember:** Completing these preparations BEFORE coding prevents interruptions and ensures smooth development!
