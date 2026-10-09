@echo off
rem Double-click to open the runeword roll picker in your browser (tools\runeword_picker.html).
cd /d "%~dp0"

where python >nul 2>nul
if errorlevel 1 (
    echo Python was not found. Install it from python.org, then try again.
    pause
    exit /b 1
)

python tools\gen_runeword_rolls.py --picker
if errorlevel 1 pause
