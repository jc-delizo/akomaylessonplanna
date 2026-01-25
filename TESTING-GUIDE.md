# Testing Guide - Phase 1 Foundation

## Prerequisites

Before testing, ensure you have:

1. **Environment Variables Set Up**
   - Create `.env.local` file in project root (if not already created)
   - Add your Supabase credentials:
     ```
     NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
     SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
     NEXT_PUBLIC_APP_URL=http://localhost:3000
     ```
   - See [.env.example](.env.example) for a complete template with all required variables

2. **Start the Development Server**
   ```bash
   npm run dev
   ```

3. **Supabase OAuth Configuration** (Optional for OAuth testing)
   - Go to Supabase Dashboard → Authentication → Providers
   - Enable Google OAuth (if you want to test Google sign-in)
   - Enable Facebook OAuth (if you want to test Facebook sign-in)
   - Configure redirect URLs: `http://localhost:3000/auth/callback`
   - **See detailed setup guide:** `docs/GOOGLE-OAUTH-SETUP.md`

---

## What You Can Test Now

### ✅ 1. Database Verification

**Test:** Verify database tables and seed data

**How:**
1. Go to Supabase Dashboard → Table Editor
2. Check these tables exist:
   - `users` (should be empty initially)
   - `grades` (should have 13 rows: Kindergarten to Grade 12)
   - `subjects` (should have 56 rows)
   - `grade_subjects` (should have 182 rows)

**Expected Result:**
- All tables visible
- Seed data populated correctly

---

### ✅ 2. Sign Up Flow (Email/Password)

**Test:** User can create account without email verification

**Steps:**
1. Navigate to `http://localhost:3000/signup`
2. Fill in the form:
   - Full Name: "Test User"
   - Email: "test@example.com"
   - Password: "password123" (min 8 characters)
3. Click "Create account"

**Expected Result:**
- ✅ Account created successfully
- ✅ Immediately redirected to `/marketplace` (NO email verification step)
- ✅ User profile created in `users` table
- ✅ User can browse marketplace immediately

**Verify in Database:**
- Go to Supabase Dashboard → Table Editor → `users`
- Should see new user with:
  - `role = 'buyer'`
  - `can_sell = false`
  - `email_verified = false`
  - `is_verified_teacher = false`

---

### ✅ 3. Login Flow

**Test:** User can log in with email/password

**Steps:**
1. Navigate to `http://localhost:3000/login`
2. Enter credentials from signup test
3. Click "Sign in"

**Expected Result:**
- ✅ Successfully logged in
- ✅ Redirected to `/marketplace`
- ✅ Session persists (can refresh page and stay logged in)

---

### ✅ 4. Route Protection

**Test:** Protected routes redirect to login when not authenticated

**Steps:**
1. Make sure you're logged out
2. Try to access:
   - `http://localhost:3000/dashboard` (should redirect to `/login`)
   - `http://localhost:3000/admin` (should redirect to `/login`)
   - `http://localhost:3000/checkout` (should redirect to `/login`)

**Expected Result:**
- ✅ All protected routes redirect to `/login`
- ✅ After login, redirects back to original route (if redirect param exists)

**Test:** Auth routes redirect when already logged in

**Steps:**
1. Log in first
2. Try to access:
   - `http://localhost:3000/login` (should redirect to `/marketplace`)
   - `http://localhost:3000/signup` (should redirect to `/marketplace`)

**Expected Result:**
- ✅ Already logged-in users can't access login/signup pages
- ✅ Redirected to marketplace

---

### ✅ 5. OAuth Buttons (UI Only - Requires Configuration)

**Test:** OAuth buttons are visible and properly styled

**Steps:**
1. Go to `/signup` or `/login`
2. Check OAuth buttons

**Expected Result:**
- ✅ Google button appears first (largest)
- ✅ Facebook button appears second
- ✅ Buttons are properly styled
- ✅ "Or continue with email" divider appears

**Note:** OAuth will only work after configuring providers in Supabase Dashboard

---

### ✅ 6. Form Validation

**Test:** Form validation works correctly

**Steps:**
1. Go to `/signup`
2. Try submitting empty form
3. Try submitting with invalid email
4. Try submitting with password < 6 characters

**Expected Result:**
- ✅ Browser validation prevents submission
- ✅ Error messages appear for invalid inputs
- ✅ Submit button disabled during loading

---

### ✅ 7. Error Handling

**Test:** Error messages display correctly

**Steps:**
1. Go to `/login`
2. Enter wrong credentials
3. Submit form

**Expected Result:**
- ✅ Error message appears: "Failed to sign in. Please check your credentials."
- ✅ Error message is styled (red background)
- ✅ Form remains accessible (can retry)

---

### ✅ 8. Marketplace Access (No Verification Required)

**Test:** Buyers can access marketplace without email verification

**Steps:**
1. Sign up with a new account
2. Immediately after signup, you should be on `/marketplace`
3. Refresh the page
4. Check if you can still access `/marketplace`

**Expected Result:**
- ✅ Can access marketplace immediately after signup
- ✅ No email verification prompt
- ✅ No blocking or restrictions
- ✅ Page loads successfully

**Verify:**
- Check browser console for any errors
- Check Network tab - should see successful API calls

---

### ✅ 9. User Profile Creation

**Test:** User profile is created correctly in database

**Steps:**
1. Sign up with a new account
2. Go to Supabase Dashboard → Table Editor → `users`
3. Find your user by email

**Expected Result:**
- ✅ User record exists
- ✅ `id` matches Supabase Auth user ID
- ✅ `email` matches signup email
- ✅ `name` matches signup name
- ✅ `username` is auto-generated from email (before @)
- ✅ `role = 'buyer'`
- ✅ `can_sell = false`
- ✅ `email_verified = false`
- ✅ `is_verified_teacher = false`
- ✅ `subscription_tier = 'free'`
- ✅ `created_at` timestamp is set

---

### ✅ 10. Session Persistence

**Test:** User session persists across page refreshes

**Steps:**
1. Log in
2. Navigate to `/marketplace`
3. Refresh the page (F5)
4. Close and reopen browser tab
5. Navigate to `/marketplace` again

**Expected Result:**
- ✅ Still logged in after refresh
- ✅ Session persists in browser
- ✅ No need to log in again

---

### ✅ 11. Logout Functionality

**Test:** User can log out

**Steps:**
1. Log in
2. Create a logout button (temporary) or use browser console:
   ```javascript
   // In browser console
   fetch('/api/auth/logout', { method: 'POST' })
   ```
3. Or implement logout in a component

**Expected Result:**
- ✅ Session cleared
- ✅ Redirected to login page
- ✅ Can't access protected routes anymore

---

## Testing Checklist

- [ ] Database tables exist and have seed data
- [ ] Sign up works (email/password)
- [ ] User profile created in database
- [ ] No email verification required for buyers
- [ ] Immediate redirect to marketplace after signup
- [ ] Login works with correct credentials
- [ ] Login fails with wrong credentials (shows error)
- [ ] Protected routes redirect to login when not authenticated
- [ ] Auth routes redirect to marketplace when already logged in
- [ ] OAuth buttons visible (Google first, Facebook second)
- [ ] Google OAuth sign up works (new user)
- [ ] Google OAuth sign in works (existing user)
- [ ] OAuth error handling works correctly
- [ ] Form validation works
- [ ] Error messages display correctly
- [ ] Marketplace accessible without verification
- [ ] Session persists across refreshes
- [ ] Logout works (if implemented)

---

## Known Limitations

1. **OAuth Configuration**
   - Google OAuth is now configured and ready to test
   - See `docs/GOOGLE-OAUTH-SETUP.md` for setup instructions
   - Facebook OAuth can be configured similarly if needed

2. **No Logout Button in UI**
   - Logout functionality exists in `useAuth` hook
   - Need to add logout button to header/navigation (future feature)

3. **Marketplace is Placeholder**
   - Currently just shows a welcome message
   - Product listings will be added in Phase 2

4. **No Forgot Password Page**
   - Link exists in login form
   - Page not created yet (can be added later)

---

## Troubleshooting

### Issue: "Failed to create account"
**Solution:**
- Check `.env.local` has correct Supabase URL and keys
- Check browser console for detailed error
- Verify RLS policy allows inserts (should be set up)

### Issue: "Redirect loop"
**Solution:**
- Clear browser cookies
- Check middleware configuration
- Verify auth state in Supabase Dashboard

### Issue: "Cannot access marketplace"
**Solution:**
- Check if user profile was created in database
- Verify RLS policies allow public read access
- Check browser console for errors

### Issue: "OAuth not working"
**Solution:**
- OAuth requires Supabase Dashboard configuration
- This is expected - OAuth is optional for now
- Email/password signup should work without OAuth

---

## Next Steps After Testing

Once all tests pass:
1. ✅ Phase 1 is complete
2. Move to Phase 2: User Profiles (Feature 02)
3. Then Product Listings (Feature 03)
4. Then Shopping Cart & Checkout (Feature 04)

---

**Happy Testing! 🚀**
