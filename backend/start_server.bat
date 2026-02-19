@echo off
echo Starting ByteForge AI Backend...
cd /d "%~dp0"
if not exist "env\Scripts\activate.bat" (
    echo Virtual environment not found!
    echo Please run: python -m venv env
    echo and install requirements.
    pause
    exit /b
)
call env\Scripts\activate
python manage.py runserver
pause
