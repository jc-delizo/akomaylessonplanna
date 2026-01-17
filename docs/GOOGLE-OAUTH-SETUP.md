# Google OAuth Setup Guide

This guide explains how to configure Google OAuth authentication for AKOMAYLESSONPLANNA.

## Overview

Google OAuth allows users to sign up and sign in using their Google accounts. The implementation uses Supabase's built-in OAuth support, which handles the OAuth flow securely.

## Prerequisites

- A Google Cloud Platform account
- A Supabase project
- Access to your Supabase Dashboard

## Step 1: Google Cloud Console Setup

### 1.1 Create or Select a Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note your project name for reference

### 1.2 Enable Google+ API

1. Navigate to **APIs & Services** → **Library**
2. Search for "Google+ API" or "Google Identity"
3. Click on **Google Identity** or **Google+ API**
4. Click **Enable**

**Note:** Google+ API has been deprecated, but Google Identity services are still available. You may see references to "Google Identity" instead.

### 1.3 Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth 2.0 Client ID**
3. If prompted, configure the OAuth consent screen first:
   - Choose **External** (unless you have a Google Workspace account)
   - Fill in required fields:
     - App name: `AKOMAYLESSONPLANNA`
     - User support email: Your email
     - Developer contact: Your email
   - Add scopes: `email`, `profile`, `openid`
   - Add test users (if in testing mode)
   - Save and continue

4. Create OAuth 2.0 Client ID:
   - Application type: **Web application**
   - Name: `AKOMAYLESSONPLANNA Web Client`
   - **Authorized JavaScript origins** (add these):
     ```
     http://localhost:3000
     https://yourdomain.com  (for production)
     ```
   - **Authorized redirect URIs** (add ALL of these):
     ```
     https://your-project-ref.supabase.co/auth/v1/callback
     http://localhost:3000/auth/callback
     https://yourdomain.com/auth/callback  (for production)
     ```
     **Important:** Replace `your-project-ref` with your actual Supabase project reference (found in Supabase Dashboard → Settings → General → Reference ID)

5. Click **Create**
6. **Important:** Copy the **Client ID** and **Client Secret** immediately - you'll need these for Supabase

## Step 2: Supabase Dashboard Configuration

### 2.1 Enable Google Provider

1. Go to your [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Navigate to **Authentication** → **Providers**
4. Find **Google** in the list
5. Toggle **Enable Google provider**

### 2.2 Configure Google Credentials

1. In the Google provider settings:
   - **Client ID (for OAuth)**: Paste your Google Client ID
   - **Client Secret (for OAuth)**: Paste your Google Client Secret
2. Click **Save**

### 2.3 Verify Redirect URL

Supabase automatically handles the redirect URL. The format is:
```
https://your-project-ref.supabase.co/auth/v1/callback
```

Make sure this exact URL is added to your Google Cloud Console authorized redirect URIs (as done in Step 1.3).

## Step 3: Supabase Dashboard Redirect URL Configuration

1. Go to Supabase Dashboard → **Authentication** → **URL Configuration**
2. Set **Site URL**: `http://localhost:3000` (for local dev) or `https://yourdomain.com` (for production)
3. Add **Redirect URLs**:
   - `http://localhost:3000/auth/callback` (for local dev)
   - `https://yourdomain.com/auth/callback` (for production)

**Important:** These redirect URLs tell Supabase where to send users AFTER completing OAuth. The `redirectTo` option in your code must match one of these URLs.

## Step 4: Production Setup

When deploying to production:

1. Add your production domain to Google Cloud Console:
   ```
   https://yourdomain.com/auth/callback
   ```

2. Update Supabase redirect URLs in **Authentication** → **URL Configuration**:
   - Site URL: `https://yourdomain.com`
   - Redirect URLs: Add `https://yourdomain.com/auth/callback`

## Testing

### Test Sign Up Flow

1. Navigate to `/signup`
2. Click **Continue with Google**
3. You should be redirected to Google's sign-in page
4. After signing in, you should be redirected back to `/marketplace`
5. Verify in Supabase Dashboard → **Authentication** → **Users** that a new user was created

### Test Sign In Flow

1. Navigate to `/login`
2. Click **Continue with Google**
3. Select the same Google account used for sign up
4. You should be redirected to `/marketplace`
5. Verify you're logged in

### Troubleshooting

**Error: "redirect_uri_mismatch" (Error 400)**

This is the most common OAuth configuration error. Here's how to fix it:

1. **Find your Supabase project reference:**
   - Go to Supabase Dashboard → **Settings** → **General**
   - Copy your **Reference ID** (e.g., `enxtvupbiezvwrnuzwsl`)
   - Your Supabase callback URL will be: `https://[REFERENCE-ID].supabase.co/auth/v1/callback`

2. **Add the Supabase callback URL to Google Cloud Console:**
   - Go to Google Cloud Console → **APIs & Services** → **Credentials**
   - Click on your OAuth 2.0 Client ID
   - Under **Authorized redirect URIs**, add:
     ```
     https://[YOUR-REFERENCE-ID].supabase.co/auth/v1/callback
     ```
   - **This is REQUIRED** - Google must see this URL during the OAuth flow

3. **Also add your app's callback URL (for local dev):**
   - Add to **Authorized redirect URIs**:
     ```
     http://localhost:3000/auth/callback
     ```

4. **Add JavaScript origins (if not already added):**
   - Under **Authorized JavaScript origins**, add:
     ```
     http://localhost:3000
     ```

5. **Verify in Supabase Dashboard:**
   - Go to **Authentication** → **URL Configuration**
   - Make sure `http://localhost:3000/auth/callback` is in the **Redirect URLs** list

6. **Common mistakes to avoid:**
   - ❌ Only adding `http://localhost:3000/auth/callback` (missing Supabase URL)
   - ❌ Wrong project reference ID
   - ❌ Trailing slashes (`/auth/v1/callback/` vs `/auth/v1/callback`)
   - ❌ Wrong protocol (`http://` vs `https://` for Supabase URL)
   - ❌ Adding to "Authorized JavaScript origins" instead of "Authorized redirect URIs"

**Error: "invalid_client"**
- Verify Client ID and Client Secret are correct in Supabase Dashboard
- Ensure Google+ API is enabled in Google Cloud Console

**Error: "access_denied"**
- User may have cancelled the OAuth flow
- Check OAuth consent screen configuration
- Ensure test users are added if app is in testing mode

**Redirecting to root URL (`/?code=...`) instead of `/auth/callback`**

If you're being redirected to `http://localhost:3000/?code=...` instead of `/auth/callback`:

1. **Verify redirect URL in Supabase Dashboard:**
   - Go to **Authentication** → **URL Configuration**
   - Ensure `http://localhost:3000/auth/callback` is in the **Redirect URLs** list
   - Set **Site URL** to `http://localhost:3000`

2. **Code fallback handler:**
   - The app includes a fallback handler that will automatically redirect from `/?code=...` to `/auth/callback`
   - This ensures OAuth works even if Supabase redirects to the root URL

3. **If issue persists:**
   - Clear browser cache and cookies
   - Try signing in again
   - Check browser console for any errors

**User profile not created**
- Check Supabase logs for errors
- Verify database `users` table exists and has correct schema
- Check that RLS policies allow inserts

## Security Notes

1. **Never commit Client Secret to version control**
2. **Use environment variables for sensitive data** (though OAuth credentials are stored in Supabase Dashboard)
3. **Keep Google Cloud Console credentials secure**
4. **Regularly rotate credentials** if compromised
5. **Monitor OAuth usage** in Google Cloud Console for suspicious activity

## Additional Resources

- [Supabase OAuth Documentation](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Supabase Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers)

## Support

If you encounter issues:
1. Check Supabase Dashboard → **Logs** → **Auth Logs**
2. Check Google Cloud Console → **APIs & Services** → **Credentials** → **OAuth 2.0 Client IDs**
3. Review error messages in browser console
4. Check network tab for failed requests
