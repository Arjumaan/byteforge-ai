# ByteForge AI - Quick Start Guide

Get up and running with ByteForge AI in minutes!

## Prerequisites

- Python 3.12+ installed
- Node.js 20+ installed
- Google Gemini API key ([Get one free here](https://makersuite.google.com/app/apikey))

## Quick Setup (3 Steps)

### Step 1: Clone and Setup

```bash
git clone https://github.com/Arjumaan/byteforge-ai.git
cd byteforge-ai
chmod +x setup.sh
./setup.sh
```

The setup script will:
- Install all Python dependencies
- Run database migrations
- Install Node.js dependencies
- Offer to create an admin user

### Step 2: Configure API Key

Edit the `.env` file and add your Gemini API key:

```bash
# Open .env in your editor
nano .env  # or use your preferred editor

# Add your key:
GEMINI_API_KEY=your-actual-api-key-here
```

### Step 3: Start the Servers

**Terminal 1 - Backend:**
```bash
cd backend
python3 manage.py runserver
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

That's it! Open http://localhost:3000 in your browser.

## First Time Usage

### Create an Account

1. Click "Sign up" on the login page
2. Enter your email and password
3. Optional: Add a display name
4. Click "Sign Up"

### Start Your First Conversation

1. Click "New Conversation" in the sidebar
2. Type your message
3. Press Enter or click "Send"
4. Watch the AI respond!

### Monitor Token Usage

- Token usage bar shown in chat header
- Green = plenty of tokens left
- Yellow = getting close to limit
- Red = almost at limit

### Top Up Tokens (Mock Payment)

When you reach the 20,000 token limit:
1. Payment modal appears automatically
2. Enter amount (e.g., $10 for 10,000 tokens)
3. Click "Pay Now"
4. Tokens added immediately!

## Admin Dashboard

If you created an admin user:
1. Login with admin credentials
2. Click your profile icon
3. Select "Admin Dashboard"
4. View platform statistics

## Troubleshooting

**Backend won't start?**
```bash
# Make sure migrations are run
cd backend
python3 manage.py migrate
```

**Frontend won't compile?**
```bash
# Reinstall dependencies
cd frontend
rm -rf node_modules
npm install
```

**Can't get AI responses?**
- Check that GEMINI_API_KEY is set in .env
- Verify the key is valid at https://makersuite.google.com/

**Port 8000 already in use?**
```bash
# Kill the process or use different port
python3 manage.py runserver 8001
# Update REACT_APP_API_URL in frontend/.env.local
```

## Features to Try

✅ Create multiple conversations
✅ Switch between conversations
✅ Update your profile
✅ View payment history
✅ Try different message types
✅ Test token limit and payment flow

## Default Credentials

If you used the defaults during setup:
- **Email**: admin@byteforge.com
- **Password**: Admin123!

**Remember to change these in production!**

## Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Explore the API endpoints
- Customize the UI colors in `frontend/tailwind.config.js`
- Add OAuth credentials for social login

## Need Help?

- Check the main README.md
- Review backend logs in Terminal 1
- Check frontend console in browser DevTools
- Open an issue on GitHub

---

**Enjoy building with ByteForge AI!** 🚀
