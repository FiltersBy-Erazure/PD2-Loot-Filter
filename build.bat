@echo off
rem Double-click to publish-build: stamps today's date into the Horadric Cube,
rem builds all 8 filters from sections\, then verifies them.
cd /d "%~dp0"

where python >nul 2>nul
if errorlevel 1 (
    echo Python was not found. Install it from python.org, then try again.
    goto failed
)

rem Unique/set roll tags: picks file (e.g. saved from the roll picker page) -> generated section
python tools\gen_unique_rolls.py
if errorlevel 1 goto failed
python tools\build.py --stamp
if errorlevel 1 goto failed
python tools\build.py --check
if errorlevel 1 goto failed

echo.
echo BUILD OK
goto end

:failed
echo.
echo BUILD FAILED - see the message above.

:end
echo.
pause
