@echo off
title Push to GitHub - Visitor Management
cd /d "C:\Users\darsh\visitor-management"

echo Checking Git installation...
where git >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [INFO] Git is not installed on your system yet.
    echo Installing Git automatically via Windows Package Manager...
    echo (If a Windows prompt asks for permission, click YES)
    echo.
    winget install --id Git.Git -e --accept-package-agreements --accept-source-agreements
    echo.
    echo Git has been installed!
    echo Please restart this script (or close and re-open terminal) so Windows registers Git.
    pause
    exit /b
)

echo.
echo [1/4] Initializing Git repository...
if not exist .git (
    git init
)

echo [2/4] Setting main branch and GitHub remote...
git branch -M main
git remote remove origin 2>nul
git remote add origin https://github.com/nidhijariwala28/visitor-management.git

echo [3/4] Staging and committing project files...
git add .
git commit -m "Complete Visitor & Employee Management System"

echo [4/4] Pushing to GitHub (https://github.com/nidhijariwala28/visitor-management)...
git push -u origin main

echo.
echo ==============================================
echo Successfully pushed project to GitHub!
echo ==============================================
pause
