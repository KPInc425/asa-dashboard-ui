# ASA Management Suite - All-in-One Windows Setup Script
# This script installs and starts both the frontend dashboard and the backend API.
# Place this script in asa-servers-dashboard/scripts/.
# It will reference the ../asa-docker-control-api project for the API setup.
# Run this in PowerShell as Administrator from the dashboard/scripts directory.

Write-Host "=== ASA Management Suite: All-in-One Windows Setup ===" -ForegroundColor Cyan

# Go to dashboard root
Set-Location -Path (Split-Path -Parent $MyInvocation.MyCommand.Definition)
Set-Location ..

# Frontend setup
Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
Set-Location .\asa-servers-dashboard
if (!(Test-Path .env)) { Copy-Item env.example .env }
npm install
Write-Host "Building frontend..." -ForegroundColor Yellow
npm run build

# Backend setup
Set-Location ..\asa-docker-control-api
Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
if (!(Test-Path .env)) { Copy-Item env.example .env }
npm install

# Start backend (in new window)
Start-Process powershell -ArgumentList 'cd ..\asa-docker-control-api; npm start' -WindowStyle Minimized

# Start frontend (in new window)
Start-Process powershell -ArgumentList 'cd ..\asa-servers-dashboard; npm run dev' -WindowStyle Minimized

Write-Host "========================================="
Write-Host "ASA Management Suite is now running!" -ForegroundColor Green
Write-Host "- Backend API: http://localhost:4000"
Write-Host "- Dashboard:   http://localhost:5173"
Write-Host "Login with your admin credentials."
Write-Host "=========================================" 