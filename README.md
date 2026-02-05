# ⚡ ByteForge AI - Advanced Intelligent Workspace

ByteForge AI is a high-performance, full-stack AI orchestration platform. Designed for developers and power users, it provides a secure, token-managed environment for interacting with cutting-edge LLMs including **Gemini 1.5 Pro/Flash**, **Claude 3.5**, and **GPT-4o**.

## ✨ Key Features

- **Multi-Model Orchestration**: Seamlessly switch between Google Gemini, Anthropic Claude, and OpenAI GPT models.
- **Ultra-Compact UI**: Optimized for high-density productivity, featuring a "glassmorphism" aesthetic and optimized spatial density.
- **Secure Token Management**: Built-in usage tracking and payment-ready architecture to manage resource consumption.
- **Native Context Optimization**: Advanced message truncation and history management for faster responses and lower latency.
- **Professional Analytics**: (Coming Soon) Dashboard for tracking usage metrics and interaction patterns.

## 🛠️ Tech Stack

- **Backend**: Python 3.11+, Django 4.x, Django REST Framework
- **Frontend**: React 18, Tailwind CSS (Custom Design System)
- **Database**: MySQL 8.0 / PostgreSQL (Render Ready)
- **AI Integration**: Google Generative AI (v1/v1beta), OpenAI SDK, Anthropic SDK
- **Authentication**: JWT (JSON Web Tokens) with Social OAuth provider support.

## 🚀 Quick Start

### 1. Prerequisites
- Python 3.11+
- Node.js 18+
- MySQL Server

### 2. Backend Installation
```bash
cd backend
python -m venv env
# Windows
.\env\Scripts\activate 
# Linux/macOS
source env/bin/activate

pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### 3. Frontend Installation
```bash
cd frontend
npm install
npm start
```

## 🌐 Deployment

The application is architected for deployment on **Render** using the provided `render.yaml` blueprint.

1. Connect your repository to Render.
2. The blueprint will automatically provision:
   - Django Web Service (Gunicorn/WhiteNoise)
   - Static Frontend (Served via WhiteNoise or Static Site)
   - Managed Database
3. Configure your `GEMINI_API_KEY`, `OPENAI_API_KEY`, etc., in the Render environment variables.

---

## 🎨 UI & UX Philosophy

ByteForge AI utilizes a **Density-First** design approach. At 100% zoom, the interface provides maximum visibility for long-form code blocks and dense technical discussions, mimicking the workspace feeling of professional IDEs while maintaining a sleek, modern aesthetic.

---
© 2026 SentraSec Systems. All rights reserved.
