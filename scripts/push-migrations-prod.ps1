# Push Supabase Migrations to Production
# Usage: .\scripts\push-migrations-prod.ps1

$ErrorActionPreference = "Stop"

Write-Host "🚀 Pushing migrations to production..." -ForegroundColor Cyan

# Step 1: Login
Write-Host "`n📝 Step 1: Logging in to Supabase..." -ForegroundColor Yellow
Write-Host "   This will open a browser window for authentication." -ForegroundColor Gray
npx supabase login
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Login failed!" -ForegroundColor Red
    Write-Host "   Please ensure you have internet access and can authenticate in the browser." -ForegroundColor Yellow
    exit 1
}

# Step 2: Link to production
Write-Host "`n🔗 Step 2: Linking to production project..." -ForegroundColor Yellow
Write-Host "   Project Reference ID: iokinyttkzmcnmznxgza" -ForegroundColor Gray
npx supabase link --project-ref iokinyttkzmcnmznxgza
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Linking failed!" -ForegroundColor Red
    Write-Host "   Please verify the project reference ID is correct." -ForegroundColor Yellow
    exit 1
}

# Step 3: Push migrations
Write-Host "`n📤 Step 3: Pushing migrations..." -ForegroundColor Yellow
Write-Host "   This will apply all 16 migration files in order." -ForegroundColor Gray
npx supabase db push
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Migration push failed!" -ForegroundColor Red
    Write-Host "   Check the error message above for details." -ForegroundColor Yellow
    exit 1
}

Write-Host "`n✅ Successfully pushed all migrations to production!" -ForegroundColor Green
Write-Host "`n📋 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Verify migrations in Supabase Dashboard → Database → Migrations" -ForegroundColor White
Write-Host "   2. Check that all tables exist (users, products, orders, reviews, etc.)" -ForegroundColor White
Write-Host "   3. Verify storage buckets are created (products, profiles, teacher-verifications)" -ForegroundColor White
Write-Host "   4. Check RLS policies are enabled on sensitive tables" -ForegroundColor White
