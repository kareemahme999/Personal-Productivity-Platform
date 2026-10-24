# Starts the local PostgreSQL 16 instance for Aura development.
# Data directory: D:\FCAI\tools\pgdata   Port: 5432
$ErrorActionPreference = "Stop"

$pgBin   = "D:\FCAI\tools\pgsql\bin"
$pgData  = "D:\FCAI\tools\pgdata"
$logFile = "D:\FCAI\tools\pgdata\postgres.log"

if (-not (Test-Path "$pgBin\postgres.exe")) {
    Write-Host "PostgreSQL binaries not found at $pgBin" -ForegroundColor Red
    exit 1
}
if (-not (Test-Path "$pgData\PG_VERSION")) {
    Write-Host "PostgreSQL data directory not initialized at $pgData" -ForegroundColor Red
    exit 1
}

$existing = Get-NetTCPConnection -LocalPort 5432 -State Listen -ErrorAction SilentlyContinue
if ($existing) {
    Write-Host "PostgreSQL already running on port 5432 (PID $($existing[0].OwningProcess))." -ForegroundColor Yellow
    exit 0
}

Start-Process -FilePath "$pgBin\postgres.exe" -ArgumentList @("-D", $pgData, "-p", "5432") -WindowStyle Hidden
Start-Sleep -Seconds 2

if (Get-NetTCPConnection -LocalPort 5432 -State Listen -ErrorAction SilentlyContinue) {
    Write-Host "PostgreSQL started on port 5432." -ForegroundColor Green
} else {
    Write-Host "PostgreSQL failed to start. Check the log: $logFile" -ForegroundColor Red
    exit 1
}
