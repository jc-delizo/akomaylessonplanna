# AKOMAYLESSONPLANNA - System Architecture Diagram

This document provides a comprehensive visual overview of the application architecture, showing all services, environments, and data flows.

## Complete System Architecture

```mermaid
flowchart TB
    subgraph DevEnv["🔧 DEVELOPMENT ENVIRONMENT"]
        LocalDev["`**Local Development**
        Next.js App
        localhost:3000
        .env.local`"]
        LocalGit["`**Git Commands**
        git push
        git commit`"]
    end

    subgraph VCS["📦 VERSION CONTROL"]
        GitHub["`**GitHub Repository**
        akomaylessonplanna
        Main Branch
        PR Branches`"]
    end

    subgraph Hosting["☁️ HOSTING & DEPLOYMENT"]
        VercelProd["`**Vercel Production**
        akomaylessonplanna.com
        Auto-deploy on push
        Environment Variables`"]
        VercelPreview["`**Vercel Preview**
        PR Deployments
        Preview URLs`"]
    end

    subgraph Domain["🌐 DOMAIN MANAGEMENT"]
        Hostinger["`**Hostinger**
        Domain Registrar
        DNS Management
        akomaylessonplanna.com`"]
    end

    subgraph Backend["🗄️ BACKEND SERVICES"]
        Supabase["`**Supabase**
        PostgreSQL Database
        Authentication
        File Storage
        Real-time Subscriptions
        RLS Policies`"]
        SupabaseDev["`**Supabase Dev**
        Development Project
        Local Migrations`"]
        SupabaseProd["`**Supabase Prod**
        Production Project
        iokinyttkzmcnmznxgza`"]
    end

    subgraph Auth["🔐 AUTHENTICATION PROVIDERS"]
        GoogleOAuth["`**Google OAuth**
        Google Cloud Console
        OAuth 2.0 Client ID
        Redirect URIs`"]
        FacebookOAuth["`**Facebook OAuth**
        Facebook Developer
        App ID & Secret
        Data Deletion Webhook`"]
    end

    subgraph Email["📧 EMAIL SERVICES"]
        Resend["`**Resend**
        Transactional Emails
        Email Queue System
        Template Management
        Webhook Events`"]
    end

    subgraph Monitoring["📊 MONITORING & TRACKING"]
        Sentry["`**Sentry**
        Error Tracking
        Performance Monitoring
        Production Alerts`"]
    end

    subgraph Users["👥 USERS"]
        Browser["`**User Browser**
        HTTPS Requests
        OAuth Redirects`"]
        UserEmail["`**User Email**
        Receives Emails`"]
    end

    %% Development Flow
    LocalDev -->|"git push"| LocalGit
    LocalGit -->|"Push to main"| GitHub
    GitHub -->|"Webhook Trigger"| VercelProd
    GitHub -->|"PR Created"| VercelPreview

    %% Domain Flow
    Browser -->|"DNS Lookup"| Hostinger
    Hostinger -->|"Points to Vercel IP"| VercelProd
    Browser -->|"HTTPS Request"| VercelProd
    Browser -->|"HTTPS Request"| VercelPreview

    %% Application to Backend
    VercelProd -->|"API Calls<br/>NEXT_PUBLIC_SUPABASE_URL"| SupabaseProd
    VercelPreview -->|"API Calls<br/>Dev/Preview Config"| SupabaseDev
    LocalDev -->|"API Calls<br/>Local Config"| SupabaseDev
    SupabaseProd --> Supabase
    SupabaseDev --> Supabase

    %% OAuth Flows
    Browser -->|"1. Initiate OAuth"| VercelProd
    VercelProd -->|"2. Redirect to Provider"| GoogleOAuth
    VercelProd -->|"2. Redirect to Provider"| FacebookOAuth
    GoogleOAuth -->|"3. OAuth Callback"| Supabase
    FacebookOAuth -->|"3. OAuth Callback"| Supabase
    Supabase -->|"4. Exchange Code"| VercelProd
    VercelProd -->|"5. Create Session"| Browser

    %% Email Flow
    VercelProd -->|"Send Email Request"| Resend
    VercelPreview -->|"Send Email Request"| Resend
    LocalDev -->|"Send Email Request"| Resend
    Resend -->|"Deliver Email"| UserEmail
    Resend -->|"Webhook Events<br/>/api/webhooks/resend"| VercelProd

    %% Facebook Webhook
    FacebookOAuth -->|"Data Deletion Request<br/>/api/webhooks/facebook/data-deletion"| VercelProd

    %% Error Tracking
    VercelProd -->|"Error Reports"| Sentry
    VercelPreview -->|"Error Reports"| Sentry
    LocalDev -.->|"Optional Dev Errors"| Sentry

    %% Styling
    classDef devStyle fill:#e1f5ff,stroke:#01579b,stroke-width:2px
    classDef prodStyle fill:#c8e6c9,stroke:#2e7d32,stroke-width:2px
    classDef serviceStyle fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef authStyle fill:#f3e5f5,stroke:#6a1b9a,stroke-width:2px
    classDef emailStyle fill:#e8f5e9,stroke:#388e3c,stroke-width:2px
    classDef monitoringStyle fill:#fce4ec,stroke:#c2185b,stroke-width:2px

    class LocalDev,LocalGit,SupabaseDev devStyle
    class VercelProd,SupabaseProd prodStyle
    class GitHub,Hostinger,VercelPreview serviceStyle
    class GoogleOAuth,FacebookOAuth authStyle
    class Resend,UserEmail emailStyle
    class Sentry monitoringStyle
```

## Architecture Components

### 1. Development Environment
- **Local Development**: Next.js app running on `localhost:3000`
- **Environment Variables**: Stored in `.env.local` (not committed to Git)
- **Development Database**: Separate Supabase project for testing

### 2. Version Control (GitHub)
- **Repository**: `akomaylessonplanna`
- **Main Branch**: Auto-deploys to Vercel Production
- **PR Branches**: Auto-deploy to Vercel Preview environments

### 3. Hosting (Vercel)
- **Production**: `akomaylessonplanna.com` (custom domain)
- **Preview**: Automatic deployments for pull requests
- **Environment Variables**: Configured per environment (Production/Preview/Development)
- **Auto-Deploy**: Triggered on every push to main branch

### 4. Domain Management (Hostinger)
- **DNS Configuration**: Points domain to Vercel servers
- **Options**: 
  - Use Vercel nameservers (recommended)
  - Or add DNS A/CNAME records in Hostinger

### 5. Backend Services (Supabase)
- **PostgreSQL Database**: All application data
- **Authentication**: User auth with OAuth support
- **File Storage**: Product images, user avatars, documents
- **Real-time**: Subscriptions for live updates
- **RLS Policies**: Row-level security for data access

### 6. Authentication Providers

#### Google OAuth
- **Configuration**: Google Cloud Console
- **Flow**: User → Google → Supabase → App
- **Redirect URIs**: 
  - `https://[supabase-ref].supabase.co/auth/v1/callback`
  - `http://localhost:3000/auth/callback` (dev)
  - `https://akomaylessonplanna.com/auth/callback` (prod)

#### Facebook OAuth
- **Configuration**: Facebook Developer Console
- **Flow**: User → Facebook → Supabase → App
- **Webhook**: Data deletion callback at `/api/webhooks/facebook/data-deletion`
- **Redirect URIs**: Same as Google OAuth

### 7. Email Service (Resend)
- **Purpose**: Transactional emails (order confirmations, notifications, etc.)
- **Queue System**: Priority-based email queue with retry logic
- **Templates**: React Email templates with variable substitution
- **Webhooks**: Email events (delivered, opened, clicked, bounced)
- **Endpoint**: `/api/webhooks/resend`

### 8. Error Tracking (Sentry)
- **Purpose**: Production error monitoring and performance tracking
- **Integration**: Next.js SDK
- **Environment**: Configured via `NEXT_PUBLIC_SENTRY_DSN`
- **Note**: Currently planned, not fully implemented

## Data Flow Examples

### User Authentication Flow (OAuth)
1. User clicks "Sign in with Google/Facebook"
2. App redirects to OAuth provider (Google/Facebook)
3. User authorizes on provider's site
4. Provider redirects to Supabase callback URL
5. Supabase exchanges code for session
6. Supabase redirects to app callback (`/auth/callback`)
7. App creates user profile if needed
8. User is logged in and redirected to marketplace

### Email Sending Flow
1. Application event triggers email (e.g., order placed)
2. Email added to queue in Supabase database
3. Cron job processes queue (`/api/cron/process-email-queue`)
4. Email sent via Resend API
5. Resend delivers email to user
6. Resend webhook updates delivery status in database

### Deployment Flow
1. Developer makes changes locally
2. Commits and pushes to GitHub
3. GitHub webhook triggers Vercel
4. Vercel builds Next.js application
5. Vercel deploys to production (or preview for PRs)
6. Application connects to Supabase using environment variables
7. Domain (via Hostinger DNS) routes traffic to Vercel

## Environment Variables

### Development (Local)
```env
NEXT_PUBLIC_SUPABASE_URL=https://[dev-project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[dev-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[dev-service-role-key]
NEXT_PUBLIC_APP_URL=http://localhost:3000
RESEND_API_KEY=[resend-key]
RESEND_FROM_EMAIL=noreply@akomaylessonplanna.com
```

### Production (Vercel)
```env
NEXT_PUBLIC_SUPABASE_URL=https://iokinyttkzmcnmznxgza.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[prod-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[prod-service-role-key]
NEXT_PUBLIC_APP_URL=https://akomaylessonplanna.com
RESEND_API_KEY=[resend-key]
RESEND_FROM_EMAIL=noreply@akomaylessonplanna.com
CRON_SECRET=[random-secret]
NEXT_PUBLIC_SENTRY_DSN=[sentry-dsn]
FACEBOOK_APP_SECRET=[facebook-secret]
```

## Key Integration Points

### Supabase Integration
- **Client-side**: `@supabase/ssr` for browser client
- **Server-side**: `@supabase/ssr` for server components and API routes
- **Auth Helpers**: Automatic session management

### OAuth Configuration
- **Supabase Dashboard**: Provider credentials stored securely
- **Redirect URLs**: Must match in both Supabase and OAuth provider settings
- **Callback Handler**: `/app/auth/callback/route.ts` processes OAuth responses

### Resend Integration
- **Client**: Singleton pattern in `lib/emails/resend-client.ts`
- **Queue System**: Database-backed queue with processor
- **Webhooks**: Secure webhook endpoint for email events

### Vercel Integration
- **Git Integration**: Automatic deployments from GitHub
- **Environment Variables**: Per-environment configuration
- **Cron Jobs**: Scheduled tasks for email queue processing
- **Custom Domain**: Automatic SSL certificate management

## Security Considerations

1. **Environment Variables**: Never commit secrets to Git
2. **OAuth Secrets**: Stored in Supabase Dashboard, not in code
3. **Service Role Key**: Server-side only, never exposed to client
4. **Webhook Security**: Signature verification for Resend and Facebook webhooks
5. **RLS Policies**: Database-level security for all data access
6. **HTTPS**: Enforced in production via Vercel SSL

## Monitoring & Observability

- **Vercel Analytics**: Built-in performance metrics
- **Supabase Dashboard**: Database metrics and logs
- **Sentry**: Error tracking and performance monitoring (planned)
- **Resend Dashboard**: Email delivery metrics
- **Application Logs**: Vercel function logs for debugging

---

**Last Updated**: January 2025
**Maintained By**: Development Team
