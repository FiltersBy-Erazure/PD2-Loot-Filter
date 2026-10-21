@echo off
rem Double-click to open the minimap icon preview in your browser (tools\icon_preview.py serves it at
rem http://127.0.0.1:8765/). Edit a color code in sections\ and save: the icon changes on the page within a second.
rem Close this window to stop it.
cd /d "%~dp0"

where python >nul 2>nul
if errorlevel 1 (
    echo Python was not found. Install it from python.org, then try again.
    pause
    exit /b 1
)

python tools\icon_preview.py
if errorlevel 1 pause
