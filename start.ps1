#!/usr/bin/env pwsh

Write-Host ""
Write-Host "✧• Відтінки болю - Web Reader •✧" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Gray
Write-Host ""

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
    Write-Host ""
}

# Check if data files exist
if (-not (Test-Path "data\chapters.json")) {
    Write-Host "🔄 Scraping content from Telegraph and Telegram..." -ForegroundColor Yellow
    npm run scrape
    Write-Host ""
}

Write-Host "🚀 Starting server..." -ForegroundColor Green
Write-Host ""
Write-Host "📖 Server is running on:" -ForegroundColor Cyan
Write-Host "   http://localhost:3000" -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C to stop" -ForegroundColor Gray
Write-Host ""

npm start
