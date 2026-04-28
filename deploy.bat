@echo off
chcp 65001 >nul

echo [*] Perevirka Git depozytoriyu...
if not exist .git (
    echo [!] Tse ne git depozytoriy. Initsializuyemo...
    git init
    git branch -M main
    git remote add origin https://github.com/DeFexNN/helensi_book_reader.git
)

echo [*] Stvoryuyemo bild (zbyrayemo statychni faily v papku public/api)...
node build.js

echo [*] Dodayemo faily do git...
git add .
echo [*] Zberihayemo zminy (Source code u hilku main)...
git commit -m "Deploy update: UI, memory and reading modes"
echo [*] Vidpravlyayemo kod na GitHub (main branch)...
git push -u origin main

echo [*] Robymo statychnyi deploy papky "public" na hilku gh-pages...
call npx -y gh-pages -d public -m "Auto-deploy static build for GitHub Pages"

echo [*] Done! Deploy zaversheno.
echo [!] PAMYATAYTE: U nalashtuvannyakh repozytoriyu (Settings -^> Pages) potribno obraty dzherelom (Source) hilku "gh-pages" ta papku "/ (root)".
pause
