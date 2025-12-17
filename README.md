# ByteForge AI - Full Stack AI Chatbot Web Application

A complete full-stack AI chatbot web application with secure authentication, token-limited conversations, and a modern dark-themed UI.

![ByteForge AI](https://via.placeholder.com/800x400.png?text=ByteForge+AI+Dashboard)

## 🚀 Features

- **Secure Authentication**
  - Email/password registration and login
  - JWT-based session management
  - OAuth support (Google, GitHub, Apple, GitLab)
  - Protected routes and API endpoints

- **AI Chatbot Integration**
  - Powered by Google Gemini API
  - Real-time message streaming
  - Conversation history management
  - Token usage tracking and limits

- **Token Management**
  - 20,000 token limit per conversation
  - Visual token usage indicators
  - Payment system for token top-ups
  - Automatic token counting with tiktoken

- **User Dashboard**
  - Multiple conversation management
  - Message history
  - Profile customization
  - Payment history

- **Admin Dashboard**
  - Platform statistics
  - User management overview
  - Total token usage tracking
  - Payment monitoring

## 🛠️ Tech Stack

### Backend
- **Django 6.0** - Python web framework
- **Django REST Framework** - API development
- **JWT Authentication** - djangorestframework-simplejwt
- **MySQL/SQLite** - Database (SQLite for development)
- **Google Gemini API** - AI conversation engine
- **Tiktoken** - Token counting
- **Django CORS Headers** - Cross-origin resource sharing
- **Social Auth App Django** - OAuth integration

### Frontend
- **React.js** - UI library
- **React Router** - Client-side routing
- **Tailwind CSS** - Styling framework
- **jQuery** - AJAX interactions
- **Axios** - HTTP client (alternative to jQuery)

## 📋 Prerequisites

- Python 3.12+
- Node.js 20+
- npm 10+
- Google Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))

## 🔧 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Arjumaan/byteforge-ai.git
cd byteforge-ai
```

### 2. Backend Setup

#### Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

#### Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp ../.env.example ../.env
```

Edit `.env` and add your configuration:

```env
# Database (SQLite used by default)
DB_NAME=byteforge_db
DB_USER=root
DB_PASSWORD=
DB_HOST=localhost
DB_PORT=3306

# JWT
SECRET_KEY=your-secret-key-change-this-in-production
JWT_EXPIRATION_HOURS=24

# Google Gemini API (Required for AI features)
GEMINI_API_KEY=your-gemini-api-key-here

# OAuth Credentials (Optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# Django Settings
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,*
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

#### Run Database Migrations

```bash
python manage.py migrate
```

#### Create Admin User (Optional)

```bash
python manage.py createsuperuser
```

Follow the prompts to create an admin account. Set `is_admin=True` in the database for admin dashboard access.

#### Start Backend Server

```bash
python manage.py runserver
```

Backend will be available at: `http://localhost:8000`

### 3. Frontend Setup

#### Install Node Dependencies

```bash
cd ../frontend
npm install
```

#### Configure Frontend Environment

Create `.env.local` file in frontend directory:

```bash
echo "REACT_APP_API_URL=http://localhost:8000/api" > .env.local
```

#### Start Frontend Development Server

```bash
npm start
```

Frontend will be available at: `http://localhost:3000`

## 📱 Application Structure

```
byteforge-ai/
├── backend/
│   ├── byteforge/           # Django project settings
│   │   ├── settings.py      # Configuration
│   │   ├── urls.py          # Main URL routing
│   │   └── wsgi.py          # WSGI application
│   ├── authentication/      # User authentication app
│   │   ├── models.py        # User model
│   │   ├── views.py         # Auth endpoints
│   │   ├── serializers.py   # Data serialization
│   │   └── admin_views.py   # Admin dashboard API
│   ├── chat/                # Chat functionality app
│   │   ├── models.py        # Conversation & Message models
│   │   ├── views.py         # Chat endpoints
│   │   ├── serializers.py   # Data serialization
│   │   └── gemini_service.py # Gemini API integration
│   ├── payments/            # Payment system app
│   │   ├── models.py        # Payment model
│   │   ├── views.py         # Payment endpoints
│   │   └── serializers.py   # Data serialization
│   └── requirements.txt     # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   │   ├── Sidebar.js
│   │   │   ├── ChatMessage.js
│   │   │   ├── PaymentModal.js
│   │   │   └── ProtectedRoute.js
│   │   ├── pages/           # Page components
│   │   │   ├── Login.js
│   │   │   ├── Signup.js
│   │   │   ├── Dashboard.js
│   │   │   ├── Profile.js
│   │   │   └── AdminDashboard.js
│   │   ├── services/        # API services
│   │   │   └── api.js       # jQuery AJAX requests
│   │   ├── context/         # React context
│   │   │   └── AuthContext.js
│   │   ├── utils/           # Helper functions
│   │   │   └── helpers.js
│   │   └── App.js           # Main app component
│   ├── public/
│   ├── package.json
│   └── tailwind.config.js
├── .env.example
├── .gitignore
└── README.md
```

## 🔐 API Endpoints

### Authentication

```
POST   /api/auth/register        - Register new user
POST   /api/auth/login           - Login user
POST   /api/auth/logout          - Logout user
GET    /api/auth/profile         - Get user profile
PUT    /api/auth/profile/update  - Update user profile
```

### Chat

```
GET    /api/chat/conversations                      - List all conversations
POST   /api/chat/conversations                      - Create new conversation
GET    /api/chat/conversations/:id/history          - Get conversation messages
POST   /api/chat/send                               - Send message to AI
GET    /api/chat/conversations/:id/token-usage      - Get token usage
```

### Payments

```
POST   /api/payments/create      - Create payment (token top-up)
GET    /api/payments/history     - Get payment history
```

### Admin

```
GET    /api/admin/dashboard      - Get admin statistics
```

## 🎨 UI Features

### Dark Theme
- Modern dark color scheme
- Consistent across all pages
- Custom scrollbars
- Smooth transitions

### Responsive Design
- Mobile-friendly layout
- Adaptive sidebar
- Flexible grid system
- Touch-optimized controls

### Interactive Elements
- Real-time typing indicators
- Token usage progress bars
- Modal dialogs
- Toast notifications
- Form validation feedback

## 🔒 Security Features

- JWT token authentication
- Password strength validation
- CSRF protection
- CORS configuration
- SQL injection prevention
- XSS protection
- Secure password hashing (Django's built-in)

## 💳 Token System

### Default Limits
- **Free tier**: 20,000 tokens per conversation
- Token counting: Prompt + completion tokens
- Automatic truncation of old messages (optional)

### Payment Rates
- $1 = 1,000 tokens
- Instant token addition
- Mock payment system (demonstration)

## 🎯 Usage

### Creating an Account

1. Navigate to `http://localhost:3000/signup`
2. Enter email, password, and optional display name
3. Click "Sign Up" or use OAuth providers
4. Automatically logged in and redirected to dashboard

### Starting a Conversation

1. Click "New Conversation" in sidebar
2. Type your message in the input field
3. Press Enter or click "Send"
4. AI response appears in real-time
5. Token usage updates automatically

### Token Top-Up

1. When token limit is reached, modal appears
2. Enter amount to pay
3. Tokens automatically added
4. Continue conversation immediately

### Admin Access

1. Login with admin account
2. Navigate to Profile > Admin Dashboard
3. View platform statistics
4. Monitor user activity and payments

## 🐛 Troubleshooting

### Backend Issues

**Port already in use**
```bash
# Find and kill process using port 8000
lsof -ti:8000 | xargs kill -9
# Or use different port
python manage.py runserver 8001
```

**Missing Gemini API key**
- Add `GEMINI_API_KEY` to `.env` file
- Get key from [Google AI Studio](https://makersuite.google.com/app/apikey)

**Database errors**
```bash
# Reset database
rm db.sqlite3
python manage.py migrate
```

### Frontend Issues

**Module not found**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

**API connection failed**
- Ensure backend is running on port 8000
- Check `REACT_APP_API_URL` in `.env.local`
- Verify CORS settings in Django

## 📸 Screenshots

### Login Page
![Login](https://via.placeholder.com/600x400.png?text=Login+Page)

### Signup Page
![Signup](https://via.placeholder.com/600x400.png?text=Signup+Page)

### Chat Dashboard
![Dashboard](https://via.placeholder.com/600x400.png?text=Chat+Dashboard)

### Token Limit Modal
![Token Limit](https://via.placeholder.com/600x400.png?text=Token+Limit+Reached)

### Payment Interface
![Payment](https://via.placeholder.com/600x400.png?text=Payment+Modal)

### Admin Dashboard
![Admin](https://via.placeholder.com/600x400.png?text=Admin+Dashboard)

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Authors

- **Arjumaan** - [GitHub](https://github.com/Arjumaan)

## 🙏 Acknowledgments

- Google Gemini API for AI capabilities
- Django community for excellent documentation
- React team for the amazing framework
- Tailwind CSS for beautiful styling

## 📞 Support

For issues and questions:
- Open an issue on GitHub
- Email: support@byteforge.ai (example)

## 🗺️ Roadmap

- [ ] Add message export functionality
- [ ] Implement conversation sharing
- [ ] Add more AI models (GPT-4, Claude)
- [ ] Mobile app (React Native)
- [ ] Voice input/output
- [ ] Multi-language support
- [ ] Advanced admin analytics
- [ ] Real payment gateway integration

---

**Built with ❤️ using Django, React, and Google Gemini AI**
