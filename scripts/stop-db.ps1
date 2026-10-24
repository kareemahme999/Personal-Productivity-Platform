# Stops the local PostgreSQL instance for Aura development (port 5432).
$ErrorActionPreference = "Stop"

$conn = Get-NetTCPConnection -LocalPort 5432 -State Listen -ErrorAction SilentlyContinue
if (-not $conn) {
    Write-Host "PostgreSQL is not running on port 5432." -ForegroundColor Yellow
    exit 0
}

foreach ($proc in ($conn.OwningProcess | Select-Object -Unique)) {
    Stop-Process -Id $proc -Force -ErrorAction SilentlyContinue
}

Start-Sleep -Milliseconds 800
if (Get-NetTCPConnection -LocalPort 5432 -State Listen -ErrorAction SilentlyContinue) {
    Write-Host "Failed to stop PostgreSQL." -ForegroundColor Red
    exit 1
}

Write-Host "PostgreSQL stopped." -ForegroundColor Green
