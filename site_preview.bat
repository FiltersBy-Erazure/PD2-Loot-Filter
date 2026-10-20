@echo off
rem Double-click to preview the website (website\, MkDocs with the Material theme) in your browser at
rem http://127.0.0.1:8000/PD2-Loot-Filter/ . It reloads when you edit a page in website\docs\ or when build.bat
rem rewrites the tier page. Close this window to stop it.
cd /d "%~dp0"

where python >nul 2>nul
if errorlevel 1 (
    echo Python was not found. Install it from python.org, then try again.
    goto failed
)

if not exist tools\.cache\mkdocs-venv\Scripts\python.exe (
    echo First run: installing MkDocs Material into tools\.cache\mkdocs-venv ...
    python -m venv tools\.cache\mkdocs-venv
    if errorlevel 1 goto failed
    tools\.cache\mkdocs-venv\Scripts\python.exe -m pip install --quiet --disable-pip-version-check mkdocs-material==9.7.7
    if errorlevel 1 goto failed
)

rem open the browser once the server has had a few seconds to start
start "" cmd /c "timeout /t 4 >nul & start http://127.0.0.1:8000/PD2-Loot-Filter/"
set PYTHONIOENCODING=utf-8
tools\.cache\mkdocs-venv\Scripts\python.exe -m mkdocs serve -f website\mkdocs.yml
if errorlevel 1 goto failed
goto end

:failed
echo.
echo PREVIEW FAILED - see the message above.
pause

:end
