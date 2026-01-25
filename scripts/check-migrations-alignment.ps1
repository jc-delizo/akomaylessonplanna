# Check Migration Alignment with Database
# Usage: .\scripts\check-migrations-alignment.ps1 [--local|--linked]
#   --local: Check against local database
#   --linked: Check against linked remote database (default)

param(
    [switch]$Local,
    [switch]$Linked
)

$ErrorActionPreference = "Stop"

# Determine target
$target = if ($Local) { "local" } else { "linked" }
$targetFlag = if ($Local) { "--local" } else { "--linked" }

Write-Host "🔍 Checking migration alignment with $target database..." -ForegroundColor Cyan

# Step 1: Check if linked (if not using local)
if (-not $Local) {
    Write-Host "`n📝 Step 1: Checking Supabase connection..." -ForegroundColor Yellow
    
    # Try to check if we're linked
    $linkCheck = npx supabase projects list 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️  Not logged in or not linked to a project." -ForegroundColor Yellow
        Write-Host "   Attempting to link to production project..." -ForegroundColor Gray
        Write-Host "   Project Reference ID: iokinyttkzmcnmznxgza" -ForegroundColor Gray
        
        # Try to login first
        npx supabase login
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Login failed!" -ForegroundColor Red
            Write-Host "   Please ensure you have internet access and can authenticate in the browser." -ForegroundColor Yellow
            exit 1
        }
        
        # Link to production
        npx supabase link --project-ref iokinyttkzmcnmznxgza
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Linking failed!" -ForegroundColor Red
            Write-Host "   Please verify the project reference ID is correct." -ForegroundColor Yellow
            exit 1
        }
        
        Write-Host "✅ Successfully linked to production project!" -ForegroundColor Green
    } else {
        Write-Host "✅ Already connected to Supabase project" -ForegroundColor Green
    }
}

# Step 2: List migrations (shows which are applied vs local)
Write-Host "`n📋 Step 2: Checking migration list..." -ForegroundColor Yellow
Write-Host "   This shows which migrations exist locally vs which are applied in the database." -ForegroundColor Gray
Write-Host ""

npx supabase migration list $targetFlag
$migrationListExitCode = $LASTEXITCODE

if ($migrationListExitCode -ne 0) {
    Write-Host "`n⚠️  Migration list check encountered issues." -ForegroundColor Yellow
    Write-Host "   This might indicate connection problems or missing migrations." -ForegroundColor Gray
} else {
    Write-Host "`n✅ Migration list check completed!" -ForegroundColor Green
}

# Step 3: Check schema differences
Write-Host "`n🔍 Step 3: Checking schema differences..." -ForegroundColor Yellow
Write-Host "   This compares your local migration files to the actual database schema." -ForegroundColor Gray
Write-Host "   If there are differences, they will be shown below." -ForegroundColor Gray
Write-Host ""

$diffOutput = npx supabase db diff $targetFlag 2>&1
$diffExitCode = $LASTEXITCODE

if ($diffExitCode -eq 0) {
    if ($diffOutput -match "No schema differences found" -or $diffOutput -match "No differences" -or $diffOutput.Length -lt 50) {
        Write-Host "✅ No schema differences found!" -ForegroundColor Green
        Write-Host "   Your migrations are aligned with the database schema." -ForegroundColor Gray
    } else {
        Write-Host "⚠️  Schema differences detected:" -ForegroundColor Yellow
        Write-Host $diffOutput -ForegroundColor White
        Write-Host "`n💡 Tip: You can generate a migration file from these differences using:" -ForegroundColor Cyan
        Write-Host "   npx supabase db diff $targetFlag -f migration_name.sql" -ForegroundColor White
    }
} else {
    Write-Host "⚠️  Schema diff check encountered issues." -ForegroundColor Yellow
    Write-Host "   This might indicate connection problems or schema comparison errors." -ForegroundColor Gray
    Write-Host $diffOutput -ForegroundColor Red
}

# Summary
Write-Host "`n" + "="*60 -ForegroundColor Cyan
Write-Host "📊 Summary" -ForegroundColor Cyan
Write-Host "="*60 -ForegroundColor Cyan

if ($migrationListExitCode -eq 0 -and $diffExitCode -eq 0) {
    Write-Host "✅ Migration alignment check completed successfully!" -ForegroundColor Green
    Write-Host "`n📋 Next steps:" -ForegroundColor Cyan
    Write-Host "   • Review the migration list above to see applied vs local migrations" -ForegroundColor White
    Write-Host "   • If schema differences were found, consider creating a migration to align them" -ForegroundColor White
    Write-Host "   • To apply pending migrations, run: npx supabase db push" -ForegroundColor White
} else {
    Write-Host "⚠️  Some checks encountered issues. Review the output above." -ForegroundColor Yellow
    Write-Host "`n💡 Troubleshooting:" -ForegroundColor Cyan
    Write-Host "   • Ensure you're logged in: npx supabase login" -ForegroundColor White
    Write-Host "   • Ensure you're linked: npx supabase link --project-ref iokinyttkzmcnmznxgza" -ForegroundColor White
    Write-Host "   • Check Supabase Dashboard → Database → Migrations" -ForegroundColor White
}

Write-Host "`n📚 Additional Commands:" -ForegroundColor Cyan
Write-Host "   • View migration history: npx supabase migration list $targetFlag" -ForegroundColor White
Write-Host "   • Compare schemas: npx supabase db diff $targetFlag" -ForegroundColor White
Write-Host "   • Repair migration history: npx supabase migration repair --status applied <timestamp>" -ForegroundColor White
