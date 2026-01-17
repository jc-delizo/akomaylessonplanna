# Facebook OAuth Setup Guide

This guide explains how to configure Facebook OAuth authentication for AKOMAYLESSONPLANNA.

## Overview

Facebook OAuth allows users to sign up and sign in using their Facebook accounts. The implementation uses Supabase's built-in OAuth support, which handles the OAuth flow securely.

## Prerequisites

- A Facebook Developer account
- A Supabase project
- Access to your Supabase Dashboard

## Step 1: Facebook Developer Console Setup

### 1.1 Create a Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click **My Apps** → **Create App**
3. Choose app type:
   - Select **Consumer** (for general public use) or **Business** (if you have a business account)
   - Click **Next**
4. Fill in app details:
   - **App Name**: `AKOMAYLESSONPLANNA`
   - **App Contact Email**: Your email address
   - **Business Account** (optional): Select if applicable
   - Click **Create App**

### 1.2 Add Facebook Login Product

1. In your app dashboard, find **Add Product to Your App**
2. Locate **Facebook Login** and click **Set Up**
3. Choose **Web** as your platform
4. You'll be taken to the Facebook Login settings page

### 1.3 Configure Facebook Login Settings

1. Navigate to **Facebook Login** → **Settings** in the left sidebar
2. Under **Valid OAuth Redirect URIs**, add ALL of these URLs:
   ```
   https://your-project-ref.supabase.co/auth/v1/callback
   http://localhost:3000/auth/callback
   https://yourdomain.com/auth/callback  (for production)
   ```
   **Important:** Replace `your-project-ref` with your actual Supabase project reference (found in Supabase Dashboard → Settings → General → Reference ID)

3. Under **Client OAuth Settings**:
   - Enable **Use Strict Mode for Redirect URIs** (recommended)
   - Ensure **Enforce HTTPS** is enabled for production

4. Click **Save Changes**

### 1.4 Configure App Settings

1. Go to **Settings** → **Basic** in the left sidebar
2. Fill in required information:
   - **App Domains**: Add your domains (e.g., `localhost`, `yourdomain.com`)
   - **Privacy Policy URL**: Your privacy policy URL (required for production)
   - **Terms of Service URL**: Your terms of service URL (optional)
   - **User Data Deletion**: URL for data deletion requests (optional but recommended)

3. Add **Website** platform:
   - Click **+ Add Platform** → **Website**
   - **Site URL**: `http://localhost:3000` (for dev) or `https://yourdomain.com` (for production)

4. Click **Save Changes**

### 1.5 Get App Credentials

1. Go to **Settings** → **Basic**
2. Note your **App ID** (you'll need this for Supabase)
3. Click **Show** next to **App Secret** and copy it (you'll need this for Supabase)
   - **Important:** Keep your App Secret secure and never commit it to version control

### 1.6 Configure Permissions

1. Go to **Facebook Login** → **Settings**
2. Under **Permissions and Features**, ensure these permissions are requested:
   - `email` (required for user profile creation)
   - `public_profile` (includes name, profile picture)

3. For production, you may need to submit your app for review to use certain permissions:
   - Go to **App Review** → **Permissions and Features**
   - Request access to `email` permission if not automatically approved

## Step 2: Supabase Dashboard Configuration

### 2.1 Enable Facebook Provider

1. Go to your [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Navigate to **Authentication** → **Providers**
4. Find **Facebook** in the list
5. Toggle **Enable Facebook provider**

### 2.2 Configure Facebook Credentials

1. In the Facebook provider settings:
   - **Client ID (for OAuth)**: Paste your Facebook App ID
   - **Client Secret (for OAuth)**: Paste your Facebook App Secret
2. Click **Save**

### 2.3 Verify Redirect URL

Supabase automatically handles the redirect URL. The format is:
```
https://your-project-ref.supabase.co/auth/v1/callback
```

Make sure this exact URL is added to your Facebook App's Valid OAuth Redirect URIs (as done in Step 1.3).

## Step 3: Supabase Dashboard Redirect URL Configuration

1. Go to Supabase Dashboard → **Authentication** → **URL Configuration**
2. Set **Site URL**: `http://localhost:3000` (for local dev) or `https://yourdomain.com` (for production)
3. Add **Redirect URLs**:
   - `http://localhost:3000/auth/callback` (for local dev)
   - `https://yourdomain.com/auth/callback` (for production)

**Important:** These redirect URLs tell Supabase where to send users AFTER completing OAuth. The `redirectTo` option in your code must match one of these URLs.

## Step 4: Production Setup

When deploying to production:

1. **Update Facebook App Settings:**
   - Go to Facebook Developers → Your App → **Settings** → **Basic**
   - Add production domain to **App Domains**
   - Update **Website** platform Site URL to production URL
   - Add production redirect URI: `https://yourdomain.com/auth/callback`

2. **Update Supabase redirect URLs:**
   - Go to Supabase Dashboard → **Authentication** → **URL Configuration**
   - Set **Site URL**: `https://yourdomain.com`
   - Add **Redirect URLs**: `https://yourdomain.com/auth/callback`

3. **Submit App for Review (if needed):**
   - Facebook may require app review for production use
   - Go to **App Review** → **Permissions and Features**
   - Submit `email` permission for review if required
   - Provide app description, use case, and privacy policy

## Testing

### Test Sign Up Flow

1. Navigate to `/signup`
2. Click **Continue with Facebook**
3. You should be redirected to Facebook's authorization page
4. Grant permissions (email, public_profile)
5. After authorizing, you should be redirected back to `/marketplace`
6. Verify in Supabase Dashboard → **Authentication** → **Users** that a new user was created
7. Check that user profile was created in the `users` table

### Test Sign In Flow

1. Navigate to `/login`
2. Click **Continue with Facebook**
3. If already logged into Facebook, you may be automatically authorized
4. You should be redirected to `/marketplace`
5. Verify you're logged in

### Test Edge Cases

- **Facebook account without email**: Should show error message
- **Existing user logging in**: Should successfully log in without creating duplicate
- **User profile creation**: Verify profile is created with correct name and email

## Troubleshooting

**Error: "redirect_uri_mismatch" or "Invalid OAuth Redirect URI"**

This is the most common OAuth configuration error. Here's how to fix it:

1. **Find your Supabase project reference:**
   - Go to Supabase Dashboard → **Settings** → **General**
   - Copy your **Reference ID** (e.g., `enxtvupbiezvwrnuzwsl`)
   - Your Supabase callback URL will be: `https://[REFERENCE-ID].supabase.co/auth/v1/callback`

2. **Add the Supabase callback URL to Facebook App:**
   - Go to Facebook Developers → Your App → **Facebook Login** → **Settings**
   - Under **Valid OAuth Redirect URIs**, add:
     ```
     https://[YOUR-REFERENCE-ID].supabase.co/auth/v1/callback
     ```
   - **This is REQUIRED** - Facebook must see this URL during the OAuth flow

3. **Also add your app's callback URL (for local dev):**
   - Add to **Valid OAuth Redirect URIs**:
     ```
     http://localhost:3000/auth/callback
     ```

4. **Verify in Supabase Dashboard:**
   - Go to **Authentication** → **URL Configuration**
   - Make sure `http://localhost:3000/auth/callback` is in the **Redirect URLs** list

5. **Common mistakes to avoid:**
   - ❌ Only adding `http://localhost:3000/auth/callback` (missing Supabase URL)
   - ❌ Wrong project reference ID
   - ❌ Trailing slashes (`/auth/v1/callback/` vs `/auth/v1/callback`)
   - ❌ Wrong protocol (`http://` vs `https://` for Supabase URL)
   - ❌ Not enabling "Use Strict Mode for Redirect URIs" (may cause issues)

**Error: "invalid_client" or "Invalid App ID"**

- Verify App ID and App Secret are correct in Supabase Dashboard
- Ensure App ID matches the one in Facebook Developer Console
- Check that App Secret is copied correctly (no extra spaces)

**Error: "access_denied" or "User cancelled login"**

- User may have cancelled the OAuth flow
- Check that required permissions (`email`, `public_profile`) are configured
- Verify app is not in restricted mode (check App Review status)

**Error: "Email permission not granted"**

- Facebook requires `email` permission for user profile creation
- Ensure `email` permission is requested in Facebook Login settings
- For production, you may need to submit app for review to use `email` permission
- Check App Review → Permissions and Features status

**User missing email address**

- Some Facebook accounts may not have email addresses
- The app will show an error: "Your account must have an email address..."
- User should use a different account or sign up with email/password

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
- Verify user has email address (required for profile creation)

**App in Development Mode**

- Facebook apps start in Development Mode
- Only app administrators, developers, and testers can use the app
- To make it public, go to **App Review** → **Permissions and Features** and submit for review
- For testing, add test users in **Roles** → **Test Users**

## Security Notes

1. **Never commit App Secret to version control**
2. **Use environment variables for sensitive data** (though OAuth credentials are stored in Supabase Dashboard)
3. **Keep Facebook App credentials secure**
4. **Regularly rotate credentials** if compromised
5. **Monitor OAuth usage** in Facebook App Dashboard for suspicious activity
6. **Enable HTTPS** for production (Facebook requires HTTPS for OAuth)
7. **Review Facebook's Data Use Policy** and ensure compliance

## Facebook App Review

For production use, Facebook may require app review:

1. **Go to App Review** → **Permissions and Features**
2. **Request permissions** you need (e.g., `email`)
3. **Provide required information:**
   - App description
   - Use case explanation
   - Privacy Policy URL
   - Terms of Service URL
   - Screenshots/video of OAuth flow
4. **Submit for review** (can take several days)
5. **Monitor review status** in App Review dashboard

## Additional Resources

- [Supabase Facebook OAuth Documentation](https://supabase.com/docs/guides/auth/social-login/auth-facebook)
- [Facebook Login Documentation](https://developers.facebook.com/docs/facebook-login/)
- [Facebook OAuth 2.0 Guide](https://developers.facebook.com/docs/facebook-login/guides/advanced/manual-flow)
- [Supabase Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers)

## Support

If you encounter issues:

1. Check Supabase Dashboard → **Logs** → **Auth Logs**
2. Check Facebook Developer Console → **Tools** → **Error Logs**
3. Review error messages in browser console
4. Check network tab for failed requests
5. Verify Facebook App status in App Dashboard
6. Check App Review status if permissions are restricted
