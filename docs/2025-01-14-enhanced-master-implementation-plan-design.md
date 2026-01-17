# Enhanced Master Implementation Plan - Design Document

**Date:** January 14, 2026
**Project:** AKOMAYLESSONPLANNA
**Goal:** Transform MASTER-IMPLEMENTATION-PLAN from passive reference to active, error-resistant execution guide
**Status:** ✅ Design Complete - Ready for Implementation

---

## Executive Summary

This document provides the complete design for transforming the `MASTER-IMPLEMENTATION-PLAN.md` into an instruction-based, error-resistant guide that prevents common AI-assisted development errors.

**Key Changes:**
1. References brainstorming files as PRIMARY source of truth
2. Provides tech stack verification upfront
3. Includes pre-flight checks before each phase
4. Gives step-by-step INSTRUCTIONS (not code to copy)
5. Tells Cursor WHAT to do, WHAT to check, WHAT to reference
6. Includes post-validation commands
7. Prevents common errors with upfront warnings

**Critical Principle:** The plan should provide **instructions on HOW to complete tasks**, not the code itself. This keeps the plan maintainable, flexible, and actually usable by AI assistants.

---

## Problem Statement

Current `docs/implementationplan/MASTER-IMPLEMENTATION-PLAN.md` causes frequent errors when used by Cursor/AI assistants:

### Identified Issues

1. **Tech Stack Mismatches**
   - References TanStack Query/Router
   - Codebase actually uses Next.js 16
   - Causes installation and import errors

2. **Missing Schema Verification**
   - Doesn't verify database structure before implementation
   - Example: "missing email column in users table" error
   - No pre-flight checks for tables/columns

3. **No Pre-flight Checks**
   - Doesn't verify prerequisites exist
   - Doesn't check dependencies installed
   - Doesn't confirm previous features complete

4. **Design Misalignment**
   - Doesn't reference brainstorming files
   - Brainstorming files contain actual design decisions
   - Example: Plan says "Email verification" but brainstorming says "No email verification for buyers"

5. **AI Hallucinations**
   - Cursor suggests outdated patterns
   - Recommends wrong packages
   - Creates components not in registry

6. **Implementation Drift**
   - Code doesn't match design requirements
   - Constraints not enforced
   - Requirements misunderstood

7. **Includes Code Instead of Instructions**
   - Contains full code blocks to copy
   - Gets outdated quickly
   - Cursor copy-pastes without understanding
   - Hard to maintain as codebase evolves

### Example Error

**Feature 01 Authentication:**
- **Master plan says:** "Email verification"
- **Brainstorming file #2 line 19 says:** "No email verification upfront. Email verification required ONLY for sellers before uploading first product."
- **Result:** Implementation misalignment, broken signup flow

---

## Solution Overview

Transform MASTER-IMPLEMENTATION-PLAN into an **instructional execution guide** that:

✅ **References brainstorming files as PRIMARY source of truth**
✅ **Provides tech stack verification upfront**
✅ **Includes pre-flight checks before each phase**
✅ **Gives step-by-step INSTRUCTIONS (not code to copy)**
✅ **Tells Cursor WHAT to do, WHAT to check, WHAT to reference**
✅ **Includes post-validation commands**
✅ **Prevents common errors with upfront warnings**
✅ **Uses code examples only as reference, not for copying**

---

## Core Design Principles

### Principle 1: Instructions Over Code

**The plan should provide INSTRUCTIONS, not IMPLEMENTATION.**

#### ❌ WRONG Approach (Current)

```markdown
### Step 3.2: Create Signup Page

Create `app/(auth)/signup/page.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: { user }, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role: 'buyer',
            can_sell: false,
          }
        }
      })

      if (error) throw error

      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: user!.id,
          email,
          name,
          username: email.split('@')[0],
          role: 'buyer',
          is_verified_teacher: false,
          can_sell: false,
        })

      if (profileError) throw profileError

      router.push('/marketplace')

    } catch (error) {
      console.error('Signup error:', error)
      alert('Signup failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleSignup} className="max-w-md w-full space-y-4">
        <h1>Create Account</h1>

        <button type="button" className="w-full py-3 text-lg">
          Continue with Google
        </button>

        <button type="button" className="w-full py-2">
          Continue with Facebook
        </button>

        <div className="relative">
          <hr />
          <span>or</span>
          <hr />
        </div>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <input
          type="text"
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? 'Creating account...' : 'Sign Up'}
        </button>
      </form>
    </div>
  )
}
```

**Why this FAILS:**
- Code gets outdated quickly (Next.js updates, API changes)
- Cursor copy-pastes without understanding requirements
- Doesn't teach Cursor WHAT to check or verify
- Doesn't reference design decisions
- Hard to maintain when codebase evolves
- No verification of prerequisites
- No validation against design requirements

#### ✅ CORRECT Approach (New)

```markdown
### Step 3.2: Create Buyer Signup Page (WITHOUT Email Verification)

**📋 Reference:**
- **Design:** `docs/brainstorming/2-feature-01-authentication-user-management.md` lines 19-33
- **Similar component:** `registry/default/auth-login-block/auth-login-block.tsx` (for pattern reference)
- **Database schema:** `docs/implementationplan/database-schema-complete.md` lines 95-150

**🔍 Pre-Flight Checks:**

```bash
# Verify auth route group exists
test -d app/\(auth\) || mkdir -p app/\(auth\)/signup

# Check similar component exists for pattern reference
test -f registry/default/auth-login-block/auth-login-block.tsx || echo "❌ Reference component missing"

# Verify users table has required columns
supabase db inspect --table users --column email || echo "❌ Schema not ready: email column missing"
supabase db inspect --table users --column username || echo "❌ Schema not ready: username column missing"
supabase db inspect --table users --column role || echo "❌ Schema not ready: role column missing"
supabase db inspect --table users --column is_verified_teacher || echo "❌ Schema not ready: is_verified_teacher column missing"
supabase db inspect --table users --column can_sell || echo "❌ Schema not ready: can_sell column missing"

# If any checks fail, STOP and fix issues first
```

**📝 Instructions for Cursor:**

1. **Create the signup page** at `app/(auth)/signup/page.tsx`:
   - Add `'use client'` directive (it's a Client Component)
   - Use `registry/default/auth-login-block/auth-login-block.tsx` as pattern reference for structure
   - **DO NOT** require email verification for buyers (per brainstorming line 19)
   - **DO** redirect to `/marketplace` immediately after successful signup
   - **DO NOT** block access until email verified

2. **Implement the signup form** with these elements:
   - Email input (type="email", required, validate format)
   - Password input (type="password", required, min 6 characters)
   - Full Name input (type="text", required)
   - OAuth buttons in this order (per brainstorming line 41):
     * Google button (largest, first)
     * Facebook button (medium, second)
     * OR "Sign up with email" link
   - Submit button with loading state
   - Information: "No email verification required. Start browsing immediately!"

3. **Handle form submission**:
   - Prevent default form submission
   - Call `supabase.auth.signUp()` with email, password, and user metadata (name, role: 'buyer')
   - After successful auth signup, create profile in `public.users` table:
     * Set `id = user.id` from auth response
     * Set `email, name` from form
     * Set `username = email.split('@')[0]` (temporary, until username field added)
     * Set `role = 'buyer'`
     * Set `is_verified_teacher = false`
     * Set `can_sell = false`
   - On success, redirect to `/marketplace` using Next.js router
   - On error, display user-friendly error message (not alert)

4. **⚠️ CRITICAL CONSTRAINTS** (from brainstorming file):
   - ❌ **DO NOT** add email confirmation step
   - ❌ **DO NOT** block marketplace access until verified
   - ❌ **DO NOT** create profile in `auth.users` (use `public.users`)
   - ✅ **DO** allow immediate browsing after signup
   - ✅ **DO** set `role='buyer'` and `can_sell=false`
   - ✅ **DO** redirect to `/marketplace` immediately

**✅ Verify After Implementation:**

```bash
# Check file exists
test -f app/\(auth\)/signup/page.tsx && echo "✅ File created" || echo "❌ File missing"

# Check it's a Client Component
grep -q "'use client'" app/\(auth\)/signup/page.tsx && echo "✅ Client Component" || echo "❌ Missing 'use client'"

# Verify NO email verification logic (buyers skip verification)
grep -i "email_confirm\|verify.*email" app/\(auth\)/signup/page.tsx && echo "❌ Has email verification (WRONG)" || echo "✅ No email verification (CORRECT)"

# Verify redirects to marketplace
grep -q "marketplace" app/\(auth\)/signup/page.tsx && echo "✅ Redirects correctly" || echo "❌ Wrong redirect"

# Verify creates profile in public.users (not auth.users)
grep -q "from('users')" app/\(auth\)/signup/page.tsx && echo "✅ Uses public.users" || echo "❌ Wrong table"

# Check TypeScript compiles
npx tsc --noEmit app/\(auth\)/signup/page.tsx && echo "✅ TypeScript valid" || echo "❌ TypeScript errors"
```

**⚠️ Common Pitfalls:**

1. **Adding email verification for buyers**
   - **Problem:** Brainstorming line 19 explicitly says NO email verification for buyers
   - **Detection:** Run `grep -i "email_confirm" app/(auth)/signup/page.tsx`
   - **Prevention:** Read brainstorming file first, note constraints

2. **Wrong OAuth button order**
   - **Problem:** Google must be first/largest (brainstorming line 41)
   - **Detection:** Check button order in form
   - **Prevention:** Reference auth-login-block for button ordering pattern

3. **Creating profile in wrong table**
   - **Problem:** Must use `public.users`, NOT `auth.users`
   - **Detection:** Check for `.from('users')` not `.from('auth.users')`
   - **Prevention:** Understand auth vs public table separation

4. **Blocking access until email verified**
   - **Problem:** Buyers should get immediate marketplace access
   - **Detection:** Check for verification redirects or blocking logic
   - **Prevention:** Review brainstorming requirements for buyer flow
```

**Why this WORKS:**
- Tells Cursor **WHAT** to do, not **HOW** to write every line
- References existing patterns (auth-login-block) for consistency
- Includes verification commands to catch errors immediately
- Explains constraints clearly with ✅/❌ markers
- Points to brainstorming file as source of requirements
- Keeps instructions maintainable and stable even as code evolves
- Validates implementation against design decisions
- Prevents common pitfalls with upfront warnings

---

### Principle 2: Three-Tier Source Hierarchy

Establish clear document priority. Cursor should always consult documents in this order:

#### Tier 1: Brainstorming Files (PRIMARY - Source of Truth)

**Purpose:** Contains actual design decisions made during feature discussions

**How to Identify:**
- Lines marked with ✅ = final decision
- Lines marked with ⚠️ = warnings/constraints
- File names: `docs/brainstorming/[XX]-feature-name.md`

**Usage:**
- **ALWAYS read first** before implementing any feature
- Extract key decisions and constraints
- Master plan REFERENCES these, doesn't replace them

**Example:**
```
Brainstorming file #2 line 19: "✅ No email verification upfront. Email verification required ONLY for sellers before uploading first product."

This is THE requirement. Master plan explains HOW to implement this, but doesn't change the requirement.
```

#### Tier 2: Design Summary (CONSOLIDATED)

**File:** `docs/brainstorming/2025-01-09-akomaylessonplanna-complete-design-summary.md`

**Purpose:**
- Overall architecture and complete feature overview
- Cross-feature dependencies
- System-wide decisions

**Usage:**
- Understanding how features connect
- Reviewing complete feature list
- Understanding platform architecture

#### Tier 3: Database Schema (STRUCTURE)

**File:** `docs/implementationplan/database-schema-complete.md`

**Purpose:**
- Complete table definitions
- Column types, relationships, indexes
- RLS policies

**Usage:**
- Before any database operations
- Verify schema before querying
- Understand table relationships

#### Tier 4: Master Plan (EXECUTION GUIDE)

**File:** `docs/implementationplan/MASTER-IMPLEMENTATION-PLAN.md` (this document)

**Purpose:**
- Step-by-step implementation INSTRUCTIONS
- Pre-flight checks and validation
- Error prevention guidance

**Usage:**
- During implementation
- Follow steps with verification
- Reference Tiers 1-3 for requirements

**⚠️ Critical Rule:**
If there's a conflict between this plan and brainstorming files, **the BRAINSTORMING FILE wins**. The brainstorming files contain the actual design decisions.

---

### Principle 3: Verification-First Approach

Every major implementation step follows this pattern:

#### Pre-Flight (Before Implementation)

```bash
# Verify prerequisites exist
# Check database schema is ready
# Confirm dependencies are installed
# Verify previous steps are complete
# Fail fast if anything missing
```

**Purpose:** Catch missing dependencies BEFORE starting implementation

#### Instructions (During Implementation)

```markdown
1. Do X, referencing Y for pattern
2. Implement Z with these constraints
3. Ensure W condition is met
4. Handle edge case V
```

**Purpose:** Provide clear, actionable guidance without prescribing exact code

#### Post-Validation (After Implementation)

```bash
# Verify implementation works
# Check alignment with design decisions
# Run automated tests
# Validate constraints were respected
# Fail if validation fails
```

**Purpose:** Ensure implementation actually meets requirements

---

## Enhanced Master Plan Structure

### New Section 0: Design Alignment & Source Documents

Insert this immediately after the Table of Contents.

```markdown
## 0. Design Alignment & Source Documents

### ⚠️ Critical Rule

**ALWAYS read the brainstorming file BEFORE implementing any feature.**

The master plan is an execution **GUIDE** - the brainstorming files contain the actual **REQUIREMENTS**.

### Source Documents Hierarchy

| Tier | Document | Purpose | When to Use |
|------|----------|---------|-------------|
| 1 (PRIMARY) | `docs/brainstorming/*.md` | Actual design decisions | FIRST - before any feature |
| 2 | `docs/brainstorming/2025-01-09-*-complete-design-summary.md` | Overall architecture | Understanding cross-features |
| 3 | `docs/implementationplan/database-schema-complete.md` | Database structure | Before any DB operations |
| 4 | This document | Execution instructions | During implementation |

### Brainstorming Files Reference Table

| Feature | Brainstorming File | Key Decisions | Last Updated |
|---------|-------------------|---------------|--------------|
| Planning | `1-project-planning-mcp-setup-and-development-strategy.md` | 7 phases, MCP servers, 8-10 mo timeline | Jan 10, 2026 |
| Feature 01 | `2-feature-01-authentication-user-management.md` | No email verification for buyers (line 19) | Jan 11, 2026 |
| Feature 02 | `3-feature-02-user-profiles-and-profile-management.md` | Open profiles, badge system | Jan 11, 2026 |
| Feature 02 Align | `4-feature-02-design-alignment-and-documentation-review.md` | Username field added (line 98), responsive specs | Jan 11, 2026 |
| Feature 03 | `5-feature-03-product-listings-and-management.md` | 5-step upload wizard | TBD |
| Feature 04 | `6-feature-04-shopping-cart-and-checkout-flow.md` | One copy per product limit | TBD |
| Feature 05 | `7-feature-05-reviews-and-ratings.md` | 5-star system, moderation | TBD |
| Feature 06 | `8-feature-06-social-features.md` | Notifications, sharing | TBD |
| Feature 07 | `9-feature-07-seller-dashboard-and-analytics.md` | Dashboard, analytics, earnings | TBD |
| Feature 08 | `10-feature-08-advanced-search-and-discovery.md` | Full-text search, filters | TBD |
| Feature 09 | `11-feature-09-admin-panel-and-content-moderation.md` | Moderation, user management | TBD |
| Feature 12 | `12-feature-10-email-system-transactional-and-notification-emails.md` | 26 email types | TBD |
| Feature 13 | `13-feature-11-messaging-system.md` | Buyer-seller messaging | TBD |

### Mandatory Workflow

**Before implementing ANY feature, follow this workflow:**

```
Step 1: READ the brainstorming file
   → Understand what was decided
   → Note lines with ✅ (decisions) and ⚠️ (warnings)
   → Extract constraints and requirements

Step 2: CHECK the database schema
   → Verify tables exist: `supabase db inspect --table <table>`
   → Verify columns exist: `supabase db inspect --table <table> --column <column>`
   → Review RLS policies if needed

Step 3: FOLLOW this master plan
   → Execute with pre-flight checks
   → Follow step-by-step instructions
   → Run verification commands

Step 4: VALIDATE against brainstorming
   → Ensure implementation matches decisions
   → Run post-implementation checks
   → Test all constraints are respected
```

### Conflict Resolution

**⚠️ If there's a conflict between this master plan and brainstorming files:**

1. **The BRAINSTORMING FILE wins** - it contains the actual design decisions
2. Update the master plan to align with brainstorming
3. Document the discrepancy for future reference

**Common conflicts to watch for:**
- Email verification requirements (buyers vs sellers)
- OAuth button order
- Component choice (local registry vs online)
- Database table usage (public vs auth)
```

### New Section 1: Tech Stack Verification

Insert this after Section 0.

```markdown
## 1. Tech Stack Verification

### Actual Stack (from package.json)

**Framework:**
- Next.js 16.1.1 (App Router)
- React 19.2.3
- React DOM 19.2.3

**UI Components:**
- @base-ui/react 1.0.0 (NOT Radix UI)
- shadcn 3.6.3
- Local registry at `registry/` (NOT online)

**Styling:**
- Tailwind CSS 4
- @tailwindcss/postcss 4
- tw-animate-css 1.4.0

**Icons:**
- lucide-react 0.562.0

**Utilities:**
- class-variance-authority 0.7.1
- clsx 2.1.1
- tailwind-merge 3.4.0

### ⚠️ Common Stack Confusions (AVOID THESE)

| ❌ WRONG | ✅ CORRECT | How to Verify |
|---------|-----------|---------------|
| TanStack Query | Next.js `fetch` / `use server` | `cat package.json \| grep next` |
| TanStack Router | Next.js App Router | `ls app/` - see route groups |
| @radix-ui/* | @base-ui/react | `cat components.json` |
| Online shadcn registry | Local registry at `registry/` | `ls registry/registry.json` |
| React Query patterns | Server Components | Check for `async function` |
| Radix primitives | @base-ui/react primitives | Check imports |

### Verification Commands

```bash
# Verify actual installed packages
cat package.json | grep -A 20 "dependencies"

# Check for WRONG packages (should return nothing or error)
npm list @tanstack/react-query 2>/dev/null && echo "❌ WRONG: TanStack Query installed" || echo "✅ Correct: Not using TanStack"
npm list @tanstack/router 2>/dev/null && echo "❌ WRONG: TanStack Router installed" || echo "✅ Correct: Using Next.js"
npm list @radix-ui/react-button 2>/dev/null && echo "❌ WRONG: Radix UI installed" || echo "✅ Correct: Using @base-ui/react"

# Verify local registry exists
test -f registry/registry.json && echo "✅ Local registry exists" || echo "❌ Local registry missing"

# Check components.json for style
cat components.json | grep '"style"' && echo "Should show 'base-mira' or similar"
```

### Data Fetching Pattern

**✅ CORRECT: Next.js Server Components**

```typescript
// app/products/page.tsx (Server Component)
async function getProducts() {
  const supabase = createClient()
  const { data } = await supabase.from('products').select('*')
  return data
}

export default async function ProductsPage() {
  const products = await getProducts()
  return <ProductList products={products} />
}
```

**❌ WRONG: TanStack Query Pattern**

```typescript
// DON'T DO THIS (TanStack Query not installed)
// const { data } = useQuery(['products'], fetchProducts)
```

### Component Pattern

**✅ CORRECT: Using Local Registry**

```bash
# Install from LOCAL registry
npx shadcn@latest add button --registry ./registry/registry.json

# Then import
import { Button } from '@/components/ui/button'
```

**❌ WRONG: Using Online Registry**

```bash
# DON'T DO THIS
# npx shadcn@latest add button  # Uses online registry
```

### Instruction Pattern for Cursor

**When implementing ANY feature, ALWAYS:**

1. **Check dependencies first** - Run `cat package.json` to see what's installed
2. **Verify components exist** - Run `ls components/ui/` and `ls registry/default/`
3. **Use local registry** - Run `npx shadcn add <name> --registry ./registry/registry.json`
4. **Reference existing patterns** - Check similar components before creating new ones
5. **Verify database schema** - Run `supabase db inspect --table <table>` before querying
6. **Read brainstorming file** - Always read design requirements first
```

### Enhanced Feature Section Template

Replace each feature section with this structure:

```markdown
## Feature XX: [Feature Name]

**📋 Design Source:**
- **Primary:** `docs/brainstorming/[XX-filename].md`
- **Related:** `docs/brainstorming/[related-filename].md` (if applicable)
- **Database:** `docs/implementationplan/database-schema-complete.md` lines [XX-YY]

**🎯 Key Design Decisions (from brainstorming):**
1. ✅ [Decision 1] (line XX)
2. ✅ [Decision 2] (line XX)
3. ✅ [Decision 3] (line XX)

**⚠️ Implementation Constraints:**
- ✅ MUST: [What must be done]
- ✅ MUST: [Another requirement]
- ❌ MUST NOT: [What must NOT be done]
- ❌ MUST NOT: [Another prohibition]

**📦 Database Dependencies:**

```bash
# Verify these tables exist before starting:
supabase db inspect --table table_name || echo "❌ Table missing"
supabase db inspect --table table_name --column column_name || echo "❌ Column missing"

# Required migration file:
supabase/migrations/XXX_feature_XX_name.sql
```

**🔗 Dependency Chain:**
```
[Previous Feature] → Feature XX → [Next Feature]
```

### Pre-Flight Checklist

**Run these BEFORE starting implementation:**

```bash
# 1. Verify design doc exists and has been read
test -f docs/brainstorming/[XX-filename].md || echo "❌ Read brainstorming file first"

# 2. Verify database schema is ready
supabase db inspect --table table_name || echo "❌ Run migrations first"
supabase db inspect --table table_name --column column_name || echo "❌ Column missing"

# 3. Verify dependencies are installed
npm list package-name 2>/dev/null || echo "❌ Install dependencies first"

# 4. Verify components exist (if needed)
test -f components/ui/component-name.tsx || echo "❌ Install component from registry first"

# 5. Verify previous features are complete
test -f app/previous-feature/page.tsx || echo "❌ Complete previous feature first"

# If any check fails, STOP and fix issues before proceeding
```

### Implementation Instructions

#### Step XX.1: [Task Name]

**📋 Reference:**
- **Design:** `docs/brainstorming/[filename].md` lines [XX-YY]
- **Similar implementation:** `path/to/similar/component.tsx` (use for pattern reference)
- **Database:** `docs/implementationplan/database-schema-complete.md` lines [XX-YY]

**🔍 Pre-Flight Checks:**

```bash
# [Specific checks for this step]
```

**📝 Instructions for Cursor:**

1. **[Main task description]**
   - Detail step 1
   - Detail step 2
   - Include specific requirements

2. **[Secondary task]**
   - Check for [condition]
   - Handle [edge case]
   - Apply [constraint]

3. **[Validation/verification task]**
   - Ensure [result]
   - Verify [condition met]

**⚠️ Critical Constraints:**
- ✅ DO: [required action]
- ✅ DO: [another required action]
- ❌ DON'T: [forbidden action]
- ❌ DON'T: [another prohibition]
- ⚠️ WATCH: [common pitfall to avoid]

**✅ Verify After Implementation:**

```bash
# Check file/folder created
test -f path/to/file.tsx && echo "✅ Created" || echo "❌ Missing"

# Verify no forbidden patterns
grep -r "wrong-pattern" path/ && echo "❌ Has wrong pattern" || echo "✅ Correct"

# Check TypeScript compiles
npx tsc --noEmit path/to/file.tsx && echo "✅ TypeScript valid" || echo "❌ TypeScript errors"

# Verify against design decisions
# [Design-specific checks]
```

**⚠️ Common Pitfalls:**

1. **[Pitfall name]**
   - **Problem:** [Description]
   - **Detection:** [Command to detect]
   - **Prevention:** [How to avoid]

2. **[Another pitfall]**
   - **Problem:** [Description]
   - **Detection:** [Command to detect]
   - **Prevention:** [How to avoid]

#### [Repeat for each step...]
```

---

## Prevention & Troubleshooting Guide

Add comprehensive Section 8 to master plan covering:

### 8.1 Database & Supabase Issues

#### Missing Columns/Tables

**Symptom:** `column "email" does not exist` or `relation "users" does not exist`

**Prevention:**
```bash
# Pre-flight: Always verify schema before implementing
supabase db inspect --table users
supabase db inspect --table users --column email
```

**Detection:**
```bash
# After database operations
supabase db remote commit
```

**Resolution:**
```bash
# Identify missing migration
supabase migration list

# Apply missing migrations
supabase db push
```

#### RLS Blocking Access

**Symptom:** Queries return empty results despite data existing

**Prevention:**
```bash
# Check RLS status
supabase db inspect --policy users
```

**Detection:**
```typescript
if (error?.message.includes('policy')) {
  console.error('❌ RLS policy issue')
}
```

**Resolution:**
```sql
-- Add missing policy
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);
```

### 8.2 Frontend & React Issues

#### Server vs Client Component Confusion

**Symptom:** `useState is not defined` or interactivity not working

**Prevention:**
```typescript
// Rule: Need useState/useEffect? → Must be Client Component
// Just displaying data? → Can be Server Component
```

**Detection:**
```bash
npx tsc --noEmit
```

**Resolution:**
```typescript
// Split into Server + Client components
// Server: fetch data
// Client: handle interactivity
```

#### Wrong shadcn Component Import

**Symptom:** Component not found

**Prevention:**
```bash
# Verify component exists
ls components/ui/button.tsx

# Install from local registry
npx shadcn add button --registry ./registry/registry.json
```

#### @base-ui vs Radix Confusion

**Symptom:** Import errors, wrong API

**Prevention:**
```typescript
// Check components.json
// Should show "base-mira" style using @base-ui/react
```

**Detection:**
```bash
npm list @radix-ui/react-button  # Should error (not installed)
```

### 8.3 Server & Backend Issues

#### API Route Not Found

**Symptom:** 404 errors

**Prevention:**
```typescript
// Routes must be: app/api/feature/route.ts
// Dynamic routes: app/api/feature/[id]/route.ts
// Export named functions: GET, POST, PUT, DELETE
```

**Detection:**
```bash
test -f app/api/products/route.ts || echo "❌ Route missing"
curl -X GET http://localhost:3000/api/products
```

#### Environment Variables Missing

**Symptom:** `undefined` values, API calls failing

**Prevention:**
```typescript
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL not set')
}
```

### 8.4 File Storage Issues

#### File Upload Fails

**Symptom:** Upload returns error

**Prevention:**
```bash
# Check bucket exists
supabase storage list

# Create if missing
supabase storage create --name products
```

#### Signed URLs Not Working

**Symptom:** Download links don't work

**Prevention:**
```typescript
// Use longer validity (60 seconds is default)
createSignedUrl(filePath, 3600)  // 1 hour
```

### 8.5 AI Hallucination Prevention

#### Cursor Suggests Outdated Patterns

**Prevention:**
```markdown
## Cursor Instructions

**CRITICAL: Always verify tech stack before suggesting code**

1. CHECK package.json FIRST
2. USE LOCAL REGISTRY
3. VERIFY components exist
4. CHECK database schema
5. READ brainstorming file

**This project uses:**
- ✅ Next.js 16 (NOT TanStack)
- ✅ @base-ui/react (NOT Radix)
- ✅ Local registry (NOT online)
```

**Detection:**
```bash
grep -r "from '@tanstack" app/ components/
# If found: ❌ AI hallucinated
```

### 8.6 Implementation Drift Prevention

#### Code Doesn't Match Design

**Prevention:**
```markdown
## Before Implementing:

1. Read brainstorming file
2. Extract key decisions (✅ lines)
3. Note constraints (⚠️ lines)
4. Implement following decisions
5. Validate against requirements
```

**Detection:**
```bash
# Automated checks
grep -r "email_confirm" app/marketplace && echo "❌ FAIL" || echo "✅ PASS"
```

### 8.7 File Organization Prevention

#### Files in Wrong Locations

**Prevention:**
```markdown
## Project Structure Rules

1. Route groups: Use parentheses `(auth)`, `(buyer)`, `(seller)`, `(admin)`
2. API routes: MUST be `app/api/*/route.ts`
3. Dynamic routes: Use brackets `[id]`, `[username]`
4. UI components: Install from local registry, don't create manually
5. Custom components: Organize by feature in `components/<feature>/`
```

**Detection:**
```bash
test -f app/\(auth\)/login/page.tsx || echo "❌ Auth page missing"
```

### 8.8 Integration Issues Prevention

#### Breaking Changes When Adding Features

**Prevention:**
```bash
# Before adding new feature
npm test

# After adding new feature
npm test

# Compare results
```

---

## Implementation Steps

### Phase 1: Add New Sections (Priority: HIGH)

**Time Estimate:** 1-2 hours

1. **Insert Section 0** after Table of Contents
   - Add "Design Alignment & Source Documents"
   - Include source hierarchy table
   - Add brainstorming files reference
   - Include mandatory workflow

2. **Insert Section 1** after Section 0
   - Add "Tech Stack Verification"
   - Include common confusions table
   - Add verification commands
   - Include instruction patterns

3. **Renumber existing sections**
   - Old Section 1 → Section 2 (Architecture Overview)
   - Old Section 2 → Section 3 (Implementation Order)
   - Continue through all sections

### Phase 2: Update Feature Sections (Priority: HIGH)

**Time Estimate:** 4-6 hours

For each of the 13 features:

1. **Add standardized header** with:
   - Design source references
   - Key decisions with line numbers
   - Implementation constraints
   - Database dependencies
   - Dependency chain

2. **Convert code examples to instructions:**
   - Remove full code blocks
   - Replace with step-by-step instructions
   - Keep short reference snippets only
   - Add "what to do" guidance

3. **Add pre-flight checklists:**
   - Database schema verification
   - Component existence checks
   - Dependency verification
   - Previous feature completion

4. **Add post-validation:**
   - File existence checks
   - Pattern verification (grep commands)
   - TypeScript compilation
   - Design alignment checks

5. **Add common pitfalls:**
   - Known issues for feature
   - Detection commands
   - Prevention tips

### Phase 3: Fix Tech Stack References (Priority: HIGH)

**Time Estimate:** 1 hour

Search and replace throughout document:

- `@tanstack/react-query` → `Next.js built-in fetch/use server`
- `TanStack Query` → `Next.js Server Components`
- `@tanstack/router` → `Next.js App Router`
- `React Query` → `Next.js data fetching`
- References to online shadcn → `./registry/registry.json`
- Any Radix UI imports → @base-ui/react equivalents

### Phase 4: Add Prevention Guide (Priority: MEDIUM)

**Time Estimate:** 2-3 hours

Add comprehensive Section 8 covering:
- Database/Supabase issues
- Frontend/React issues
- Server/Backend issues
- File storage issues
- AI hallucination prevention
- Implementation drift prevention
- File organization prevention
- Integration issues prevention

Each includes:
- Symptom description
- Prevention strategies
- Detection methods
- Resolution steps

### Phase 5: Quality Assurance (Priority: HIGH)

**Time Estimate:** 1 hour

Run validation commands:

```bash
# Check all brainstorming files referenced
grep -r "docs/brainstorming" docs/implementationplan/MASTER-IMPLEMENTATION-PLAN.md

# Verify no TanStack references remain
grep -i "tanstack" docs/implementationplan/MASTER-IMPLEMENTATION-PLAN.md

# Check pre-flight sections exist
grep -c "Pre-Flight Checklist" docs/implementationplan/MASTER-IMPLEMENTATION-PLAN.md

# Verify each feature has design source
grep -c "📋 Design Source:" docs/implementationplan/MASTER-IMPLEMENTATION-PLAN.md

# Check for common pitfall sections
grep -c "⚠️ Common Pitfalls:" docs/implementationplan/MASTER-IMPLEMENTATION-PLAN.md
```

---

## Success Criteria

Updated MASTER-IMPLEMENTATION-PLAN will be successful when:

### Quality Metrics

✅ **Zero tech stack errors**
- Clear verification prevents TanStack/Next.js confusion
- Local registry references prevent online registry confusion

✅ **Zero schema errors**
- Pre-flight checks catch missing tables/columns
- Database verification before all operations

✅ **Design alignment**
- All features reference brainstorming files
- Line number citations for all decisions
- Constraints clearly documented

✅ **Instruction-based**
- Plans tell WHAT to do, not provide code to copy
- Step-by-step guidance without prescribing implementation
- References to existing patterns for consistency

✅ **Self-validating**
- Commands verify each step succeeds
- Pre-flight checks fail fast
- Post-validation catches misalignment

✅ **Error-resistant**
- Common pitfalls documented upfront
- Detection commands provided
- Prevention strategies included

✅ **Cursor-friendly**
- Clear step-by-step instructions
- References to all sources
- Verification commands included
- Constraints clearly marked

✅ **Maintainable**
- Instructions stay stable as code evolves
- Design decisions separated from implementation
- Easy to update when requirements change

### Test Case

**Give updated plan to Cursor to implement Feature 01. Should complete without:**
- ❌ Missing column errors
- ❌ Tech stack confusion
- ❌ Email verification misalignment
- ❌ File creation in wrong locations
- ❌ Wrong package imports
- ❌ RLS permission errors

---

## Files to Create/Update

### 1. Design Document (This File)

**Location:** `docs/plans/2025-01-14-enhanced-master-implementation-plan-design.md`
**Status:** ✅ Complete (you are reading it)
**Purpose:** Document the solution design and rationale
**Audience:** Developer reference, architecture record

### 2. Master Implementation Plan (UPDATE)

**Location:** `docs/implementationplan/MASTER-IMPLEMENTATION-PLAN.md`
**Status:** ⏳ Pending Update
**Changes Required:**
- Add Section 0: Design Alignment
- Add Section 1: Tech Stack Verification
- Renumber existing sections (1→2, 2→3, etc.)
- Update all 13 feature sections with new template
- Convert code examples to instructions
- Add verification commands throughout
- Add Section 8: Prevention & Troubleshooting

### 3. Quick Reference (OPTIONAL)

**Location:** `docs/implementationplan/CURSOR-QUICK-REFERENCE.md`
**Status:❌ Not Created
**Purpose:** One-page summary for Cursor/AI assistants
**Contents:**
- Document hierarchy (4 tiers)
- Tech stack summary
- Common commands
- Critical rules
- Error prevention checklist
- Quick troubleshooting guide

---

## Timeline & Effort Estimate

### Total Time: 9-13 hours

**Breakdown:**
- Phase 1: Add new sections - 1-2 hours
- Phase 2: Update 13 feature sections - 4-6 hours
- Phase 3: Fix tech stack references - 1 hour
- Phase 4: Add prevention guide - 2-3 hours
- Phase 5: Quality assurance - 1 hour

### Implementation Strategy

**Option A: Incremental (Recommended)**
1. Update Phase 1 + Feature 01 first (test case)
2. Test with Cursor to verify improvements
3. Continue with remaining features incrementally
4. Add prevention guide last
5. Final validation

**Option B: Complete Update**
1. Create backup of current master plan
2. Complete all phases at once
3. Comprehensive testing
4. Deploy updated version

**Recommendation:** Option A for safer, validated approach

---

## Next Steps

### Immediate Actions

1. ✅ **Review this design document** - Ensure approach aligns with your needs
2. ⏳ **Create backup** of current MASTER-IMPLEMENTATION-PLAN.md
   ```bash
   cp docs/implementationplan/MASTER-IMPLEMENTATION-PLAN.md docs/implementationplan/MASTER-IMPLEMENTATION-PLAN.md.backup
   ```
3. ⏳ **Begin Phase 1** - Add Section 0 and Section 1
4. ⏳ **Update Feature 01** - As test case for new format
5. ⏳ **Test with Cursor** - Verify improvements work in practice
6. ⏳ **Continue with remaining features** - Incremental updates
7. ⏳ **Add prevention guide** - Last step (Section 8)
8. ⏳ **Final validation** - Comprehensive review and testing

### Validation Checklist

Before considering the update complete:

- [ ] All brainstorming files referenced in Section 0
- [ ] Tech stack section matches package.json
- [ ] All TanStack references replaced
- [ ] Each feature has design source header
- [ ] Each feature lists key decisions
- [ ] Each feature has implementation constraints
- [ ] Pre-flight checklists added before major sections
- [ ] Post-validation commands added after features
- [ ] Database schema references included (with line numbers)
- [ ] Dependency chains documented
- [ ] Common pitfalls sections added
- [ ] Prevention guide complete (Section 8)
- [ ] All validation commands pass
- [ ] Tested with Cursor on at least one feature

---

## Conclusion

This design document provides a comprehensive approach to transforming the MASTER-IMPLEMENTATION-PLAN from a passive reference document into an active, error-resistant execution guide.

**Key Achievements:**
✅ Clear instruction-over-code principle
✅ Three-tier source hierarchy with brainstorming files as primary
✅ Verification-first approach with pre-flight and post-validation
✅ Comprehensive prevention and troubleshooting guide
✅ Detailed implementation plan with phases and timelines
✅ Success criteria and validation approach

**Expected Outcomes:**
- Drastically reduced errors when Cursor uses the master plan
- Better alignment between design and implementation
- More maintainable documentation
- Clear guidance for AI-assisted development
- Prevention of common pitfalls

**The master plan will tell Cursor WHAT to do, WHAT to check, and WHAT to reference - not prescribe exact code to copy.**

---

**Document Status:** ✅ Design Complete
**Ready for Implementation:** Yes
**Last Updated:** January 14, 2026
**Version:** 1.0

**Questions or feedback before proceeding with implementation?**
