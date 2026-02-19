# ByteForge AI

ByteForge AI is a powerful, production-ready AI chat platform that provides a unified interface to **400+ advanced AI models** (GPT-4o, Claude 3.5 Sonnet, Gemini 2.0 Flash, Llama 4, DeepSeek, Mistral, and more) through a single API key via OpenRouter.

![Chat Interface](frontend/public/logo.png)

## 🚀 Features

- **Unified AI Access**: Connect to OpenRouter to access hundreds of models with one API key.
- **LMArena-Style Model Selector**: Search, filter, and compare models by provider, price, and context window.
- **Real-Time Streaming**: ChatGPT-like word-by-word streaming responses (Server-Sent Events).
- **Smart Resilience**: Automatic retry with exponential backoff and fallback chains to handle rate limits gracefully.
- **RAG Integration**: Upload documents (PDF, TXT) and chat with your knowledge base.
- **Slash Commands**: Use `/code`, `/image`, `/web` for specialized tasks.
- **Conversation Management**: Organize chats, rename titles automatically, and manage history.
- **Token Usage Tracking**: Monitor token consumption across conversations.

## 🛠️ Tech Stack

- **Frontend**: React, Tailwind CSS
- **Backend**: Django, Django REST Framework
- **Database**: PostgreSQL (Production) / SQLite (Dev)
- **AI Provider**: OpenRouter (Unified API)

## 📦 Installation & Setup

### Prerequisites

- Node.js (v18+)
- Python (v3.10+)
- [OpenRouter API Key](https://openrouter.ai/keys) (Free or Paid)

### 1. Backend Setup

```bash
cd backend
python -m venv venv
# Activate venv:
# Windows: .\venv\Scripts\activate
# Linux/Mac: source venv/bin/activate

pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Create a `.env` file in `backend/` with your keys:

```ini
# AI — OpenRouter (Single key for 400+ models)
OPENROUTER_API_KEY=sk-or-v1-your-key-here...

# Database (Optional for dev, uses SQLite by default)
# DATABASE_URL=postgres://user:pass@localhost:5432/byteforge
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm start
```

Visit `http://localhost:3000` to start chatting!

## 💡 Usage Tips

- **Model Selection**: Click the model name at the bottom of the chat to open the selector.
- **Streaming**: Responses stream instantly. If a free model hits rate limits, the system automatically retries or falls back to another model.
- **Slash Commands**: Type `/` to see available specialized agents.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License.
