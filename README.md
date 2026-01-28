# AKOMAYLESSONPLANNA

**A Digital Marketplace for Filipino K-12 Educational Resources**

AKOMAYLESSONPLANNA is a modern, full-featured marketplace platform where Filipino teachers can buy and sell high-quality educational resources including lesson plans, exams, RPMS documents, posters, and tarpaulins.

---

## 🎯 Project Overview

### What is AKOMAYLESSONPLANNA?

A specialized e-commerce platform built for the Filipino K-12 education community, enabling teachers to:

- **Buy** professionally-created educational materials
- **Sell** their own lesson plans, exams, and teaching resources
- **Connect** with other educators across the Philippines
- **Earn** through quality content creation

### Target Users

- **Buyers**: K-12 teachers looking for ready-to-use educational materials
- **Sellers**: Teachers monetizing their expertise and teaching materials
- **Administrators**: Platform moderators ensuring quality and compliance

---

## 🛠 Tech Stack

### Core Technologies

| Category | Technology | Version |
|----------|-----------|---------|
| **Framework** | Next.js | 16.1.1 |
| **Language** | TypeScript | 5.x |
| **UI Library** | React | 19.2.3 |
| **Database** | Supabase (PostgreSQL) | 15 |
| **Authentication** | Supabase Auth | Latest |
| **Storage** | Supabase Storage | Latest |
| **Styling** | Tailwind CSS | 4.x |
| **Components** | @base-ui/react + shadcn | 1.0.0 + 3.6.3 |
| **Email** | Resend | 6.7.0 |
| **Payments** | GCash + Maya | API Integration |
| **Hosting** | Vercel | Edge Network |

### Key Dependencies

```json
{
  "next": "16.1.1",
  "react": "19.2.3",
  "@supabase/ssr": "0.8.0",
  "@supabase/supabase-js": "2.90.1",
  "@base-ui/react": "1.0.0",
  "tailwindcss": "^4.0.0",
  "typescript": "^5.0.0",
  "resend": "6.7.0"
}
```

### Architecture

- **App Router**: Next.js 16 App Router with server components
- **State Management**: React hooks + Zustand (UI state)
- **Data Fetching**: Next.js server components + Supabase client
- **Component Registry**: Local shadcn/ui registry at `registry/`
- **Styling**: Tailwind CSS with custom "base-mira" design system

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+ (LTS recommended)
- Git
- A Supabase account
- A Vercel account (for deployment)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/akomaylessonplanna.git
cd akomaylessonplanna
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Email Service (Resend)
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=noreply@akomaylessonplanna.com

# Payment Integration (Optional for local dev)
GCASH_MERCHANT_ID=your_gcash_merchant_id
GCASH_SECRET_KEY=your_gcash_secret_key
MAYA_API_KEY=your_maya_api_key
MAYA_SECRET_KEY=your_maya_secret_key

# OAuth (Optional)
FACEBOOK_APP_SECRET=your_facebook_app_secret
```

See [`.env.example`](.env.example) for a complete template.

4. **Run database migrations**

```bash
npx supabase migration up
```

5. **Start the development server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```
akomaylessonplanna/
├── app/                      # Next.js 16 App Router
│   ├── (auth)/              # Authentication routes
│   ├── (buyer)/             # Buyer-facing routes
│   ├── (seller)/            # Seller dashboard
│   ├── (admin)/             # Admin panel
│   ├── api/                 # API routes
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Homepage
├── components/              # React components
│   ├── ui/                  # shadcn/ui components
│   ├── auth/                # Authentication components
│   ├── products/            # Product components
│   └── ...                  # Feature-specific components
├── lib/                     # Utility functions
│   ├── supabase/            # Supabase clients
│   ├── hooks/               # Custom React hooks
│   └── utils/               # Helper functions
├── registry/                # Local shadcn/ui registry
├── supabase/                # Database migrations
│   └── migrations/          # SQL migration files
├── docs/                    # Documentation
│   ├── implementationplan/  # Setup guides
│   └── brainstorming/       # Feature specifications
└── public/                  # Static assets
```

---

## 📚 Documentation

### Setup Guides

- **[Configuration Setup](docs/implementationplan/CONFIGURATION-SETUP.md)** - Initial project setup with Vercel and Supabase
- **[Environment Variables](docs/implementationplan/ENVIRONMENT-VARIABLES.md)** - Complete environment variables guide
- **[Dev/Prod Setup](docs/implementationplan/DEV-PROD-SETUP-GUIDE.md)** - Isolated development and production environments
- **[Deployment Workflow](docs/implementationplan/DEPLOYMENT-WORKFLOW.md)** - Branch-based deployment strategy

### OAuth Setup

- **[Google OAuth Setup](docs/GOOGLE-OAUTH-SETUP.md)** - Configure Google Sign-In
- **[Facebook OAuth Setup](docs/FACEBOOK-OAUTH-SETUP.md)** - Configure Facebook Login

### Development

- **[Master Implementation Plan](docs/implementationplan/MASTER-IMPLEMENTATION-PLAN.md)** - Complete development roadmap
- **[Database Schema](docs/implementationplan/database-schema-complete.md)** - Full database schema
- **[UI Field Styling](docs/implementationplan/UI-FIELD-STYLING.md)** - Standard input field design (authoritative)
- **[Testing Guide](TESTING-GUIDE.md)** - Testing strategies and test cases
- **[Implementation Status](IMPLEMENTATION-STATUS.md)** - Feature completion tracker

---

## ✨ Features

### Completed Features

- ✅ **Feature 03**: Product Listings & Management
- ✅ **Feature 04**: Shopping Cart & Checkout Flow
- ✅ **Feature 09**: Admin Panel & Content Moderation
- ✅ **Feature 10**: Email System (26 email types)

### Features in Development

- 🚧 **Feature 01**: Authentication & User Management
- 🚧 **Feature 02**: User Profiles & Social Features
- 🚧 **Feature 05**: Reviews & Ratings
- 🚧 **Feature 06**: Social Features (notifications, following)
- 🚧 **Feature 07**: Seller Dashboard & Analytics
- 🚧 **Feature 08**: Advanced Search & Discovery
- 🚧 **Feature 11**: Messaging System

See [IMPLEMENTATION-STATUS.md](IMPLEMENTATION-STATUS.md) for detailed status.

---

## 🧪 Testing

Run the test suite:

```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# Type checking
npm run type-check

# Linting
npm run lint
```

See [TESTING-GUIDE.md](TESTING-GUIDE.md) for comprehensive testing information.

---

## 📦 Build & Deploy

### Build for Production

```bash
npm run build
```

### Deploy to Vercel

This project uses a dev/prod isolated workflow:

- **Dev Branch** (`dev`) → Deploys to `dev.akomaylessonplanna.com`
- **Main Branch** (`main`) → Deploys to `akomaylessonplanna.com`

```bash
# Deploy to dev
git checkout dev
git push origin dev

# Deploy to production
git checkout main
git merge dev
git push origin main
```

See [Deployment Workflow](docs/implementationplan/DEPLOYMENT-WORKFLOW.md) for details.

---

## 🔐 Security

- **Row Level Security (RLS)** enabled on all Supabase tables
- **Environment variables** never committed to version control
- **OAuth** for secure third-party authentication
- **HTTPS** enforced in production
- **Rate limiting** on API endpoints
- **Input validation** with Zod schemas

---

## 🤝 Contributing

This is a solo developer project. If you'd like to contribute:

1. Read the [Master Implementation Plan](docs/implementationplan/MASTER-IMPLEMENTATION-PLAN.md)
2. Check [IMPLEMENTATION-STATUS.md](IMPLEMENTATION-STATUS.md) for available features
3. Follow the existing code patterns and conventions
4. Ensure tests pass before submitting

---

## 📄 License

Proprietary - All Rights Reserved

---

## 📞 Support

For issues or questions:

- Review the [documentation](docs/)
- Check the [TESTING-GUIDE.md](TESTING-GUIDE.md) for troubleshooting
- Review existing [implementation summaries](FEATURE-03-IMPLEMENTATION-SUMMARY.md)

---

## 🙏 Acknowledgments

Built with modern tools and best practices:

- [Next.js](https://nextjs.org/) - React framework
- [Supabase](https://supabase.com/) - Backend as a Service
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [shadcn/ui](https://ui.shadcn.com/) - Component library
- [Vercel](https://vercel.com/) - Deployment platform
- [Resend](https://resend.com/) - Email API

---

**Version**: 1.0  
**Last Updated**: January 2026  
**Status**: Active Development
