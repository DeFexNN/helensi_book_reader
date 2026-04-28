@echo off
REM Script to start the Shades of Pain web reader
REM ======================================

echo.
echo ✧ Відтінки болю - Web Reader ✧
echo ======================================
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    echo.
)

REM Check if data files exist
if not exist "data\chapters.json" (
    echo Scraping content...
    call npm run scrape
    echo.
)

echo Starting server...
echo.
echo Server is running on: http://localhost:3000
echo Press Ctrl+C to stop
echo.

call npm start
