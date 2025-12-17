#!/bin/bash

# ByteForge AI Setup Script
echo "========================================="
echo "  ByteForge AI - Setup Script"
echo "========================================="
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is not installed"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed"
    exit 1
fi

echo "✓ Python 3 found: $(python3 --version)"
echo "✓ Node.js found: $(node --version)"
echo ""

# Backend setup
echo "Setting up backend..."
cd backend

echo "Installing Python dependencies..."
pip3 install -r requirements.txt

echo "Running database migrations..."
python3 manage.py migrate

echo "Backend setup complete!"
echo ""

# Ask to create admin user
read -p "Do you want to create an admin user? (y/n): " create_admin
if [ "$create_admin" = "y" ]; then
    python3 create_admin.py
fi

cd ..

# Frontend setup
echo ""
echo "Setting up frontend..."
cd frontend

echo "Installing Node dependencies..."
npm install

echo "Frontend setup complete!"
echo ""

cd ..

# Check .env file
if [ ! -f ".env" ]; then
    echo "⚠ Warning: .env file not found"
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo "Please edit .env and add your GEMINI_API_KEY"
fi

echo ""
echo "========================================="
echo "  Setup Complete!"
echo "========================================="
echo ""
echo "To start the application:"
echo ""
echo "1. Start backend (in terminal 1):"
echo "   cd backend"
echo "   python3 manage.py runserver"
echo ""
echo "2. Start frontend (in terminal 2):"
echo "   cd frontend"
echo "   npm start"
echo ""
echo "3. Open http://localhost:3000 in your browser"
echo ""
echo "Don't forget to add your GEMINI_API_KEY to the .env file!"
echo "Get one at: https://makersuite.google.com/app/apikey"
echo ""
