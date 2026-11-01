@echo off
echo Stopping VisitorFlow Backend Server on Port 5000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5000') do (
    taskkill /F /PID %%a 2>nul
)
echo Backend stopped successfully.
timeout /t 2 >nul
