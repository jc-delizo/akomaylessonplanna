# Run Migrations Now - Step by Step

Since Supabase CLI login requires browser authentication, please follow these steps:

## Step 1: Open PowerShell in Project Directory

```powershell
cd c:\Users\odvip\OneDrive\Desktop\JC\akomaylessonplanna
```

## Step 2: Login to Supabase (One-Time Setup)

This will open your browser for authentication:

```powershell
npx supabase login
```

**What happens:**
- A browser window will open
- You'll be asked to authenticate with Supabase
- Once authenticated, credentials are saved locally
- You only need to do this once

## Step 3: Link to Production Project

After login succeeds, run:

```powershell
npx supabase link --project-ref iokinyttkzmcnmznxgza
```

**Expected output:** "Linked to project iokinyttkzmcnmznxgza"

## Step 4: Push All Migrations

```powershell
npx supabase db push
```

**What happens:**
- All 16 migration files will be applied in order
- Progress will be shown in the terminal
- Each migration will be tracked in Supabase

## Step 5: Verify Success

1. Go to: https://supabase.com/dashboard
2. Select your production project
3. Go to: **Database** → **Migrations**
4. Verify all 16 migrations appear

## Alternative: Use the Helper Script

After Step 1 (login), you can run:

```powershell
.\scripts\push-migrations-prod.ps1
```

This will handle steps 3-4 automatically.

## Troubleshooting

**If login fails:**
- Ensure you have internet access
- Try running in a different terminal (Git Bash, CMD)
- Check that your browser can open

**If linking fails:**
- Verify project reference ID: `iokinyttkzmcnmznxgza`
- Ensure you have access to the production project

**If migrations fail:**
- Check the error message
- Verify earlier migrations succeeded
- Check Supabase Dashboard for detailed errors
