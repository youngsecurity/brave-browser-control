@echo off
REM Launch Brave Browser with remote debugging enabled for Claude Desktop automation
REM This allows the extension to control your existing Brave tabs and windows

echo.
echo ========================================
echo  Brave Browser - Automation Mode
echo ========================================
echo.
echo Launching Brave with remote debugging...
echo.
echo You can now use Claude Desktop to:
echo  - See your currently open tabs
echo  - Control your existing browser windows
echo  - Navigate and interact with pages
echo.

REM Try different installation paths
if exist "C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe" (
    start "" "C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe" --remote-debugging-port=9222
    goto :success
)

if exist "C:\Program Files (x86)\BraveSoftware\Brave-Browser\Application\brave.exe" (
    start "" "C:\Program Files (x86)\BraveSoftware\Brave-Browser\Application\brave.exe" --remote-debugging-port=9222
    goto :success
)

if exist "%LOCALAPPDATA%\BraveSoftware\Brave-Browser\Application\brave.exe" (
    start "" "%LOCALAPPDATA%\BraveSoftware\Brave-Browser\Application\brave.exe" --remote-debugging-port=9222
    goto :success
)

:notfound
echo ERROR: Brave Browser not found in standard installation locations.
echo.
echo Please install Brave Browser from: https://brave.com
echo Or manually run Brave with: --remote-debugging-port=9222
pause
exit /b 1

:success
echo Brave launched successfully!
echo.
echo IMPORTANT: Use this Brave window when working with Claude Desktop.
echo Close ALL other Brave windows to avoid conflicts.
echo.
timeout /t 3 /nobreak >nul
