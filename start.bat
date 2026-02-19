    @echo off
echo Starting ByteForge AI...

:: Start Backend
echo Starting Django Backend...
start "ByteForge Backend" cmd /k "cd backend && python manage.py runserver 8000"

:: Start Frontend
echo Starting Frontend...
start "ByteForge Frontend" cmd /k "cd frontend && npm start"

echo Servers started!
