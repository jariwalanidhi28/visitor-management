@echo off
title Android Emulator Launcher
echo Starting Android Emulator: Medium_Phone_API_37.0...
start "" "%LOCALAPPDATA%\Android\Sdk\emulator\emulator.exe" -avd Medium_Phone_API_37.0
echo Emulator process launched!
timeout /t 3 >nul
exit
