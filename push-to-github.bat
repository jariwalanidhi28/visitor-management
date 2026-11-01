@echo off
title Push to GitHub - Visitor Management
cd /d "C:\Users\darsh\visitor-management"

set PATH=%LOCALAPPDATA%\Programs\Git\cmd;%PATH%

echo ==============================================
echo Pushing Visitor Management to GitHub
echo Repo: https://github.com/nidhijariwala28/visitor-management.git
echo ==============================================
echo.

git branch -M main
git remote remove origin 2>nul
git remote add origin https://github.com/nidhijariwala28/visitor-management.git
git add .
git commit -m "feat: complete visitor and employee management system" 2>nul

echo.
echo Pushing to GitHub... (if a browser pops up, click Authorize/Sign in)
git push -u origin main

echo.
echo ==============================================
echo Done! Check your repository on GitHub.
echo ==============================================
pause
