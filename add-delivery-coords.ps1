# Script to add missing columns to delivery_areas table
# PowerShell version for Windows
# Usage: powershell -ExecutionPolicy Bypass -File add-delivery-coords.ps1

param(
    [string]$DbHost = "localhost",
    [string]$DbPort = "5432",
    [string]$DbName = "rotihai_db",
    [string]$DbUser = "rotihai_user",
    [string]$DbPassword = $env:DB_PASSWORD
)

Write-Host "🔄 Adding coordinates to delivery_areas table..." -ForegroundColor Cyan
Write-Host ""

# SQL migration script
$sqlScript = @"
-- Add missing columns if they don't exist
ALTER TABLE delivery_areas
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Update Kurla West coordinates
UPDATE delivery_areas 
SET latitude = 19.07448, longitude = 72.8869815
WHERE (name ILIKE '%Kurla%' OR area_name ILIKE '%Kurla%') AND latitude IS NULL;

-- Update Bandra coordinates
UPDATE delivery_areas 
SET latitude = 19.0501, longitude = 72.8329
WHERE (name ILIKE '%Bandra%' OR area_name ILIKE '%Bandra%') AND latitude IS NULL;

-- Update Worli coordinates
UPDATE delivery_areas 
SET latitude = 19.0176, longitude = 72.8298
WHERE (name ILIKE '%Worli%' OR area_name ILIKE '%Worli%') AND latitude IS NULL;

-- Update Marine Drive coordinates
UPDATE delivery_areas 
SET latitude = 18.9630, longitude = 72.8295
WHERE (name ILIKE '%Marine%' OR area_name ILIKE '%Marine%') AND latitude IS NULL;

-- Verify changes
SELECT id, name, area_name, latitude, longitude, pincodes FROM delivery_areas ORDER BY name;
"@

# Connection string
$connString = "Host=$DbHost;Port=$DbPort;Database=$DbName;Username=$DbUser;Password=$DbPassword"

try {
    # Install NpgsqlDataProvider if needed (optional, can use psql instead)
    Write-Host "⏳ Connecting to database..." -ForegroundColor Yellow
    
    # Use psql command line tool
    $pgEnv = @{PGPASSWORD = $DbPassword}
    $sqlTempFile = [System.IO.Path]::GetTempFileName()
    Set-Content -Path $sqlTempFile -Value $sqlScript
    
    $psqlArgs = @(
        "-h", $DbHost,
        "-p", $DbPort,
        "-U", $DbUser,
        "-d", $DbName,
        "-f", $sqlTempFile
    )
    
    $processInfo = New-Object System.Diagnostics.ProcessStartInfo
    $processInfo.FileName = "psql"
    $processInfo.Arguments = $psqlArgs -join " "
    $processInfo.UseShellExecute = $false
    $processInfo.RedirectStandardOutput = $true
    $processInfo.RedirectStandardError = $true
    $processInfo.Environment["PGPASSWORD"] = $DbPassword
    
    $process = [System.Diagnostics.Process]::Start($processInfo)
    $output = $process.StandardOutput.ReadToEnd()
    $error = $process.StandardError.ReadToEnd()
    $process.WaitForExit()
    
    if ($process.ExitCode -eq 0) {
        Write-Host "✅ Migration completed successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📊 Result:" -ForegroundColor Cyan
        Write-Host $output
    } else {
        Write-Host "❌ Migration failed!" -ForegroundColor Red
        Write-Host $error
        exit 1
    }
    
    Remove-Item $sqlTempFile -Force
    
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
    exit 1
}
