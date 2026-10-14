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
rem Runeword roll tags: picks file (e.g. saved from the runeword picker page) -> generated section
python tools\gen_runeword_rolls.py
if errorlevel 1 goto failed
python tools\build.py --stamp
if errorlevel 1 goto failed
rem Unique/set tier page for players (Erazure-Unique-Set-Tiers.html, read from the filter's rules): after the
rem stamp, because its footer shows the date
python tools\tier_map.py
if errorlevel 1 goto failed
rem Non-magic bases page for players (Erazure-Non-Magic-Bases.html, read from the filter's rules)
python tools\base_map.py
if errorlevel 1 goto failed
rem Magic and rare items pages for players (Erazure-Magic-Items.html, Erazure-Rare-Items.html, from the filter's rules)
python tools\magic_rare_map.py
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
