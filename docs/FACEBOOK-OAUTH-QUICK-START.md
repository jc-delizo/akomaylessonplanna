# Facebook OAuth Quick Start Checklist

This is a quick reference checklist for setting up Facebook OAuth. For detailed instructions, see [FACEBOOK-OAUTH-SETUP.md](./FACEBOOK-OAUTH-SETUP.md).

## ✅ Code Implementation Status

- ✅ Facebook OAuth buttons in signup/login forms
- ✅ `signInWithOAuth` function supports Facebook provider
- ✅ OAuth callback route handles Facebook authentication
- ✅ Provider-agnostic error messages
- ✅ Facebook user metadata extraction implemented
- ✅ Documentation created

## 📋 Manual Setup Steps Required

### Step 1: Facebook Developer Console (15-20 minutes)

- [ ] Create Facebook App at [developers.facebook.com](https://developers.facebook.com/)
- [ ] Add "Facebook Login" product
- [ ] Configure Valid OAuth Redirect URIs:
  - `https://[YOUR-SUPABASE-REF].supabase.co/auth/v1/callback`
  - `http://localhost:3000/auth/callback`
  - `https://yourdomain.com/auth/callback` (production)
- [ ] Get App ID and App Secret
- [ ] Configure app settings (domains, privacy policy, etc.)

**Find your Supabase project reference:**
- Go to Supabase Dashboard → Settings → General
- Copy your Reference ID

### Step 2: Supabase Dashboard (5 minutes)

- [ ] Go to Authentication → Providers
- [ ] Enable Facebook provider
- [ ] Enter App ID and App Secret
- [ ] Go to Authentication → URL Configuration
- [ ] Add redirect URLs:
  - `http://localhost:3000/auth/callback`
  - `https://yourdomain.com/auth/callback` (production)

### Step 3: Testing

- [ ] Test sign up flow: `/signup` → Click "Continue with Facebook"
- [ ] Test sign in flow: `/login` → Click "Continue with Facebook"
- [ ] Verify user created in Supabase Dashboard
- [ ] Verify profile created in `users` table

## 🔗 Quick Links

- **Full Setup Guide**: [FACEBOOK-OAUTH-SETUP.md](./FACEBOOK-OAUTH-SETUP.md)
- **Google OAuth Guide**: [GOOGLE-OAUTH-SETUP.md](./GOOGLE-OAUTH-SETUP.md)
- **Facebook Developers**: https://developers.facebook.com/
- **Supabase Dashboard**: https://app.supabase.com/

## ⚠️ Important Notes

1. **Facebook requires HTTPS in production** (localhost is OK for development)
2. **Email permission is required** for user profile creation
3. **App may need review** for production use
4. **Keep App Secret secure** - never commit to version control

## 🐛 Common Issues

**"redirect_uri_mismatch"**
- Ensure Supabase callback URL is added to Facebook App's Valid OAuth Redirect URIs
- Format: `https://[YOUR-REF].supabase.co/auth/v1/callback`

**"Email permission not granted"**
- Ensure `email` permission is configured in Facebook Login settings
- May need to submit app for review in production

**User missing email**
- Some Facebook accounts don't have email addresses
- App will show error and prompt user to use email/password signup

For detailed troubleshooting, see [FACEBOOK-OAUTH-SETUP.md](./FACEBOOK-OAUTH-SETUP.md#troubleshooting).
