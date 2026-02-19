@echo off
echo Starting ByteForge AI...

:: Start Backend
echo Starting Django Backend...
start "ByteForge Backend" cmd /k "cd backend && if exist venv\Scripts\activate (call venv\Scripts\activate) && python manage.py runserver 0.0.0.0:8000"

:: Start Frontend
echo Starting Frontend...
start "ByteForge Frontend" cmd /k "cd frontend && if not exist node_modules (npm install) && npm start"

echo Servers started! Keep these windows open.
pause
