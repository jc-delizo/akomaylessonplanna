# Branch-Based Deployment Workflow Guide

This guide shows you the **dev/prod branch workflow** for making changes safely. Develop on `dev` branch, test on dev subdomain, then deploy to production when ready!

## Branch Strategy Overview

```mermaid
flowchart TD
    A[Start Development] --> B{Which branch am I on?}
    B -->|dev branch| C[Make changes on dev]
    B -->|main branch| D[Switch to dev first!]
    D --> C
    C --> E[Test locally: npm run dev]
    E --> F{Works?}
    F -->|No| C
    F -->|Yes| G[Commit changes]
    G --> H[Push to dev branch]
    H --> I[git push origin dev]
    I --> J[Auto-deploys to dev.akomaylessonplanna.com]
    J --> K[Test on dev subdomain]
    K --> L{Everything works?}
    L -->|No| C
    L -->|Yes| M[Ready for production]
    M --> N[Switch to main branch]
    N --> O[Merge dev into main]
    O --> P[Push to main]
    P --> Q[Auto-deploys to akomaylessonplanna.com]
    Q --> R[Verify on production]
    R --> S[Success! Feature is live]
```

## Branch-Based Workflow Diagram

```mermaid
gitGraph
    commit id: "Initial setup"
    branch dev
    checkout dev
    commit id: "Add new feature"
    commit id: "Fix bugs"
    commit id: "Test on dev"
    checkout main
    merge dev tag: "Deploy v1.0"
    checkout dev
    commit id: "Another feature"
    commit id: "More changes"
    checkout main
    merge dev tag: "Deploy v1.1"
```

## Understanding the Two Branches

### `dev` Branch
- **Purpose**: Development and testing
- **Deploys to**: dev.akomaylessonplanna.com
- **Database**: Dev Supabase (test data)
- **Safety**: Can break things, no problem!
- **When to use**: All new development work

### `main` Branch
- **Purpose**: Production - live users
- **Deploys to**: akomaylessonplanna.com
- **Database**: Prod Supabase (real data)
- **Safety**: NEVER break this!
- **When to use**: Only when dev is tested and ready

---

## Daily Development Workflow

### Starting New Work

**ALWAYS start on dev branch!**

```bash
# 1. Check current branch
git branch
# If you see: * dev → You're good!
# If you see: * main → Switch to dev:

# 2. Switch to dev branch
git checkout dev

# 3. Get latest changes (if working with team)
git pull origin dev

# 4. Verify you're on dev
git branch
# Should show: * dev
```

---

### Making Changes

1. **Open VS Code**
   - Make your code changes
   - Edit files, add features, fix bugs

2. **Save Files**
   - Ctrl+S to save

3. **Test Locally**
   ```bash
   npm run dev
   ```
   - Open http://localhost:3000
   - Test your changes thoroughly
   - Fix any issues

4. **Commit Changes**
   ```bash
   # Stage all changes
   git add .
   
   # Commit with descriptive message
   git commit -m "Add user profile edit feature"
   ```
   
   **Good commit message examples:**
   - ✅ "Add product image upload"
   - ✅ "Fix cart total calculation bug"
   - ✅ "Update homepage hero section"
   - ✅ "Improve checkout flow UX"
   - ❌ "changes" (too vague)
   - ❌ "fix" (what was fixed?)

---

### Deploying to Dev Environment

```bash
# Push to dev branch
git push origin dev
```

**What happens:**
1. Code pushed to GitHub `dev` branch
2. GitHub triggers Vercel webhook
3. Vercel dev project starts building
4. Deploys to dev.akomaylessonplanna.com
5. Takes 2-5 minutes

**Monitor deployment:**
- Go to https://vercel.com/dashboard
- Select `akomaylessonplanna-dev` project
- Watch build status:
  - 🟡 Building...
  - ✅ Deployed
  - ❌ Failed (check logs)

---

### Testing on Dev Subdomain

1. **Open dev site**
   - Go to https://dev.akomaylessonplanna.com
   - Hard refresh: Ctrl+Shift+R

2. **Test thoroughly**
   - Create test accounts
   - Test all new features
   - Try to break things!
   - Test OAuth login
   - Test email notifications
   - Check database (dev Supabase)

3. **Share with others** (optional)
   - Send link to dev.akomaylessonplanna.com
   - Get feedback before production

4. **If issues found**
   ```bash
   # Make fixes
   # Edit code in VS Code
   
   # Commit and push again
   git add .
   git commit -m "Fix issue with user profile"
   git push origin dev
   
   # Test again on dev subdomain
   ```

---

### Deploying to Production

**Only do this when dev is perfect!**

```bash
# 1. Ensure you're on dev branch with latest changes
git checkout dev
git status
# Should show: "nothing to commit, working tree clean"

# 2. Switch to main branch
git checkout main

# 3. Get latest main (if working with team)
git pull origin main

# 4. Merge dev into main
git merge dev

# 5. Push to main
git push origin main
```

**What happens:**
1. Code pushed to GitHub `main` branch
2. GitHub triggers Vercel webhook
3. Vercel prod project starts building
4. Deploys to akomaylessonplanna.com
5. Takes 2-5 minutes
6. **LIVE FOR REAL USERS!**

---

### Verifying Production Deployment

```bash
# After pushing to main, wait 3-5 minutes

# Then verify:
# 1. Open https://akomaylessonplanna.com
# 2. Hard refresh: Ctrl+Shift+R
# 3. Test critical features:
#    - Login works
#    - New feature works
#    - No errors in console (F12)
# 4. Check Vercel dashboard for success

# If everything works:
# Success! Feature is live!

# If something broke:
# See "Emergency Rollback" section below
```

---

### Syncing Branches After Production Deploy

After deploying to production, sync dev branch:

```bash
# Switch back to dev
git checkout dev

# Merge main into dev (keep branches in sync)
git merge main

# Push updated dev
git push origin dev

# Now dev and main are in sync
```

**Why?** Keeps dev branch up-to-date with production state.

---

## Complete Workflow Example

### Example 1: Adding a New Feature

```bash
# ============================================
# STEP 1: Start Development
# ============================================
git checkout dev
git pull origin dev

# Make changes in VS Code:
# - Add new "Favorites" feature
# - Create FavoriteButton component
# - Update product page

npm run dev
# Test at localhost:3000
# Looks good!

# ============================================
# STEP 2: Deploy to Dev
# ============================================
git add .
git commit -m "Add favorites feature to product pages"
git push origin dev

# Wait 3 minutes...
# Open dev.akomaylessonplanna.com
# Test favorites feature
# Works perfectly!

# ============================================
# STEP 3: Deploy to Production
# ============================================
git checkout main
git merge dev
git push origin main

# Wait 3 minutes...
# Open akomaylessonplanna.com
# Test favorites feature
# Live for users!

# ============================================
# STEP 4: Sync Branches
# ============================================
git checkout dev
git merge main
git push origin dev

# Done! Ready for next feature
```

---

### Example 2: Fixing a Bug

```bash
# ============================================
# Bug found on production!
# ============================================
# User reports: "Cart total is wrong"

# STEP 1: Reproduce and fix on dev
git checkout dev

# Find and fix the bug in VS Code
# components/CartTotal.tsx - fixed calculation

npm run dev
# Test locally - bug fixed!

# ============================================
# STEP 2: Deploy to Dev
# ============================================
git add .
git commit -m "Fix cart total calculation bug"
git push origin dev

# Test on dev.akomaylessonplanna.com
# Verified fixed!

# ============================================
# STEP 3: Deploy to Production ASAP
# ============================================
git checkout main
git merge dev
git push origin main

# Wait 3 minutes
# Test on akomaylessonplanna.com
# Bug fixed in production!

# ============================================
# STEP 4: Sync branches
# ============================================
git checkout dev
git merge main
git push origin dev
```

---

### Example 3: Multiple Changes in One Day

```bash
# ============================================
# Morning: Add search filters
# ============================================
git checkout dev

# Make changes...
git add .
git commit -m "Add category filters to search"
git push origin dev
# Deploys to dev subdomain

# ============================================
# Afternoon: Fix styling issue
# ============================================
# Still on dev branch
# Make changes...
git add .
git commit -m "Fix mobile menu styling"
git push origin dev
# Deploys to dev subdomain again

# ============================================
# Evening: Ready to deploy both changes
# ============================================
git checkout main
git merge dev  # Merges BOTH commits
git push origin main
# Both features deploy to production together

# Sync dev
git checkout dev
git merge main
git push origin dev
```

---

## Database Migration Workflow

When you need to update the database structure:

### Creating and Testing Migrations

```bash
# ============================================
# STEP 1: Create Migration
# ============================================
# Switch to dev branch
git checkout dev

# Create new migration file
npx supabase migration new add_favorites_table

# Edit the migration file:
# supabase/migrations/XXXXXXXXXX_add_favorites_table.sql

# Add SQL:
# CREATE TABLE favorites (
#   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
#   user_id UUID REFERENCES auth.users(id),
#   product_id UUID REFERENCES products(id),
#   created_at TIMESTAMPTZ DEFAULT NOW()
# );

# ============================================
# STEP 2: Apply to Dev Database
# ============================================
# Get dev connection string from Supabase
npx supabase db push --db-url "postgresql://postgres.[dev-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres"

# Migration applied to dev database!

# ============================================
# STEP 3: Test on Dev
# ============================================
# Update code to use new table
# Test locally
npm run dev

# Commit and deploy to dev
git add .
git commit -m "Add favorites table migration"
git push origin dev

# Test on dev.akomaylessonplanna.com
# Verify favorites feature works with new table

# ============================================
# STEP 4: Apply to Prod Database
# ============================================
# When ready, apply to production database
npx supabase db push --db-url "postgresql://postgres.[prod-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres"

# Migration applied to prod database!

# ============================================
# STEP 5: Deploy Code to Production
# ============================================
git checkout main
git merge dev
git push origin main

# Code deployed to production
# Now uses new favorites table

# ============================================
# STEP 6: Sync branches
# ============================================
git checkout dev
git merge main
git push origin dev
```

### Migration Best Practices

✅ **DO**:
- Always test migrations on dev database first
- Commit migration files with your code changes
- Apply to dev → test → then apply to prod
- Make migrations backwards compatible when possible
- Keep migrations focused and small

❌ **DON'T**:
- Never apply untested migrations to production
- Don't skip dev testing
- Don't modify existing migration files (create new ones)
- Don't delete migration files
- Don't apply migrations manually without supabase CLI

---

## Hotfix Workflow (Emergency Production Fixes)

When production is broken and needs **immediate** fix:

```bash
# ============================================
# EMERGENCY: Production site is down!
# ============================================

# OPTION 1: Quick fix on main (fastest)
# ============================================
git checkout main

# Make the fix in VS Code
# Fix the critical bug

# Test locally if possible
npm run dev

# Push directly to main
git add .
git commit -m "HOTFIX: Fix critical login bug"
git push origin main

# Deploys to production immediately (2-3 minutes)

# IMPORTANT: Sync fix back to dev!
git checkout dev
git merge main
git push origin dev

# ============================================
# OPTION 2: Fix on dev, fast-track to prod
# ============================================
git checkout dev

# Make the fix
git add .
git commit -m "HOTFIX: Fix critical payment bug"
git push origin dev

# Verify quickly on dev subdomain

# Immediately deploy to prod
git checkout main
git merge dev
git push origin main

# Sync branches
git checkout dev
git merge main
git push origin dev
```

**When to use each option:**
- **Option 1** (direct to main): Site is completely broken, users can't access
- **Option 2** (through dev): Less critical, can afford 5 minutes to test on dev

---

## Rollback Strategies

### If Something Breaks After Deploy

#### Quick Rollback in Vercel (Fastest)

1. **Go to Vercel Dashboard**
   - https://vercel.com/dashboard
   - Select `akomaylessonplanna-prod` project

2. **Find Previous Working Deployment**
   - Go to Deployments
   - Find the last deployment that worked
   - Click "..." menu

3. **Promote to Production**
   - Click "Promote to Production"
   - Confirms immediately (30 seconds)
   - Site reverted to previous version

**Pros**: Instant rollback
**Cons**: Doesn't fix Git branches

---

#### Git Revert (Proper Way)

```bash
# ============================================
# Revert the bad commit
# ============================================
git checkout main

# See recent commits
git log --oneline
# Example output:
# abc1234 Add broken feature
# def5678 Previous working version

# Revert the bad commit
git revert abc1234

# This creates a NEW commit that undoes the bad one
# Push to main
git push origin main

# Deploys fixed version (2-3 minutes)

# ============================================
# Sync to dev
# ============================================
git checkout dev
git merge main
git push origin dev
```

**Pros**: Keeps Git history clean
**Cons**: Takes 3-5 minutes

---

#### Reset to Previous Commit (Use with Caution!)

```bash
# ============================================
# CAUTION: This rewrites history!
# Only use if you haven't pushed yet
# ============================================
git checkout main

# See commits
git log --oneline

# Reset to previous commit
git reset --hard def5678

# Force push (required)
git push -f origin main

# Update dev
git checkout dev
git reset --hard main
git push -f origin dev
```

**⚠️ WARNING**: Only use if:
- You just pushed and immediately noticed problem
- No one else is working on the repo
- You understand the risks

**Never use** if:
- Other people are using the repo
- More than 5 minutes have passed
- You're unsure about Git

---

## Common Git Commands Reference

### Branch Management

```bash
# See all branches
git branch

# See current branch
git branch --show-current

# Switch to dev
git checkout dev

# Switch to main
git checkout main

# Create new feature branch (advanced)
git checkout -b feature-name

# Delete branch (after merged)
git branch -d feature-name
```

---

### Checking Status

```bash
# See what files changed
git status

# See what code changed
git diff

# See recent commits
git log --oneline

# See commits on specific branch
git log --oneline dev

# See difference between branches
git diff main..dev
```

---

### Syncing with Remote

```bash
# Get latest changes from GitHub
git pull origin dev

# Push your changes to GitHub
git push origin dev

# Push all branches
git push --all origin

# See remote URLs
git remote -v
```

---

### Undoing Changes

```bash
# Undo uncommitted changes to a file
git checkout -- filename.js

# Undo all uncommitted changes (careful!)
git reset --hard

# Undo last commit but keep changes
git reset --soft HEAD~1

# See what commit you're on
git log -1
```

---

## Monitoring Deployments

### Vercel Dashboard

**Dev Deployments:**
- Project: `akomaylessonplanna-dev`
- Triggered by: Pushes to `dev` branch
- Deploys to: dev.akomaylessonplanna.com

**Prod Deployments:**
- Project: `akomaylessonplanna-prod`
- Triggered by: Pushes to `main` branch
- Deploys to: akomaylessonplanna.com

**Deployment Status:**
- 🟡 **Building** - In progress (1-5 minutes)
- ✅ **Ready** - Deployed successfully
- ❌ **Error** - Build failed (check logs)

### Viewing Build Logs

If deployment fails:

1. Click on the failed deployment
2. Click "View Function Logs" or "Building" status
3. Look for red error messages
4. Common errors:
   - TypeScript errors → Fix in code
   - Missing env vars → Add in Vercel settings
   - Build timeout → Optimize build
5. Fix the issue and push again

---

## Troubleshooting

### "fatal: not a git repository"

**Solution**: Initialize Git
```bash
git init
git add .
git commit -m "Initial commit"
```

---

### "Permission denied (publickey)"

**Solution**: Set up GitHub authentication
```bash
# Option 1: Use GitHub CLI
gh auth login

# Option 2: Use HTTPS instead of SSH
git remote set-url origin https://github.com/username/akomaylessonplanna.git
```

---

### "Your branch is behind 'origin/dev'"

**Solution**: Pull first
```bash
git pull origin dev
# Then push
git push origin dev
```

---

### "Merge conflict"

**Solution for beginners:**
```bash
# Option 1: Abort the merge
git merge --abort

# Option 2: Accept all incoming changes
git checkout --theirs .
git add .
git commit

# Option 3: Learn to resolve conflicts (recommended)
# Open conflicted files in VS Code
# VS Code will show options to accept current/incoming/both
# Choose appropriate option for each conflict
# Save files
git add .
git commit
```

---

### "Can't push - rejected"

**Solution**:
```bash
# Someone else pushed first
git pull origin dev
# Resolve any conflicts
git push origin dev
```

---

### "Wrong branch - pushed to main instead of dev!"

**Solution**:
```bash
# If you just pushed (within 5 minutes):
git checkout main
git reset --hard HEAD~1
git push -f origin main

# Switch to dev and apply changes there
git checkout dev
# Make your changes
git add .
git commit -m "Your changes"
git push origin dev

# If it's been longer, just continue with main
# and sync back to dev:
git checkout dev
git merge main
git push origin dev
```

---

### "Dev and main are out of sync"

**Solution**: Bring them back in sync
```bash
# If dev is ahead:
git checkout main
git merge dev
git push origin main

# If main is ahead:
git checkout dev
git merge main
git push origin dev

# If both have different changes (complex):
# Get help or use GitHub pull requests
```

---

## Best Practices

### DO ✓

- ✓ Always develop on `dev` branch
- ✓ Test locally before pushing
- ✓ Test on dev subdomain before production
- ✓ Write clear commit messages
- ✓ Keep commits small and focused
- ✓ Sync branches after production deploys
- ✓ Use Vercel rollback for emergencies
- ✓ Test migrations on dev database first
- ✓ Monitor Vercel dashboard after deploys

### DON'T ✗

- ✗ Never develop directly on `main` branch
- ✗ Never push untested code to main
- ✗ Never skip dev testing
- ✗ Never push secrets/passwords to Git
- ✗ Never force push without understanding consequences
- ✗ Never apply migrations directly to prod
- ✗ Don't use vague commit messages like "fix stuff"
- ✗ Don't make huge commits (hard to debug/revert)

---

## Workflow Comparison

### Old Simple Workflow (Single Environment)
```
Edit code → Push → Production (immediately!)
```
**Risk**: Every push goes directly to live site

### New Branch-Based Workflow (Isolated Environments)
```
Edit code → Push to dev → Test on dev subdomain → Push to main → Production
```
**Benefit**: Safe testing before going live

---

## Quick Reference Cards

### Card 1: Starting New Work

```
┌──────────────────────────────────────┐
│  STARTING NEW WORK                   │
├──────────────────────────────────────┤
│  1. git checkout dev                 │
│  2. git pull origin dev              │
│  3. Make changes in VS Code          │
│  4. npm run dev (test locally)       │
│  5. git add .                        │
│  6. git commit -m "description"      │
│  7. git push origin dev              │
│  8. Test dev.akomay...               │
└──────────────────────────────────────┘
```

---

### Card 2: Deploying to Production

```
┌──────────────────────────────────────┐
│  DEPLOYING TO PRODUCTION             │
├──────────────────────────────────────┤
│  1. git checkout main                │
│  2. git pull origin main             │
│  3. git merge dev                    │
│  4. git push origin main             │
│  5. Wait 3-5 minutes                 │
│  6. Test akomay...                   │
│  7. git checkout dev                 │
│  8. git merge main                   │
│  9. git push origin dev              │
└──────────────────────────────────────┘
```

---

### Card 3: Emergency Hotfix

```
┌──────────────────────────────────────┐
│  EMERGENCY HOTFIX                    │
├──────────────────────────────────────┤
│  1. git checkout main                │
│  2. Fix the critical bug             │
│  3. git add .                        │
│  4. git commit -m "HOTFIX: ..."      │
│  5. git push origin main             │
│  6. git checkout dev                 │
│  7. git merge main                   │
│  8. git push origin dev              │
└──────────────────────────────────────┘
```

---

## Summary: Your Branch-Based Workflow

1. **Develop** → Work on `dev` branch
2. **Commit** → `git add . && git commit -m "message"`
3. **Deploy to Dev** → `git push origin dev`
4. **Test** → Check dev.akomaylessonplanna.com
5. **Deploy to Prod** → `git checkout main && git merge dev && git push origin main`
6. **Verify** → Check akomaylessonplanna.com
7. **Sync** → `git checkout dev && git merge main && git push origin dev`

**This workflow keeps production safe while allowing fearless development on dev!**

---

**Related Guides**:
- [Configuration Setup](./CONFIGURATION-SETUP.md) - Initial setup with two Vercel projects
- [Environment Variables](./ENVIRONMENT-VARIABLES.md) - Three environments explained
- [Dev/Prod Setup Guide](./DEV-PROD-SETUP-GUIDE.md) - Complete setup walkthrough

**External Resources**:
- [GitHub Git Cheat Sheet](https://education.github.com/git-cheat-sheet-education.pdf)
- [Git Branching Tutorial](https://learngitbranching.js.org/)
- [Vercel Deployment Docs](https://vercel.com/docs/deployments/overview)
