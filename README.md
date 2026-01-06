# ByteForge AI

A full-stack AI chatbot web application with Django, React, Google Gemini integration, OAuth, and secure token-limited chat.

## 🚀 Tech Stack

- **Backend**: Django, Django REST Framework
- **Frontend**: React.js, Tailwind CSS, jQuery (AJAX)
- **Database**: MySQL
- **AI**: Google Gemini API
- **OAuth**: Google/GitHub/Apple/GitLab (via social-auth)
- **Auth**: JWT (SimpleJWT)

## 🏗️ Architecture

![architecture diagram](docs/architecture-diagram.png)

## ⚙️ Setup

### 1. Clone

```sh
git clone https://github.com/Arjumaan/byteforge-ai.git
cd byteforge-ai
```

### 2. Backend Setup

- Install requirements:

  ```sh
  cd backend
  python -m venv env
  source env/bin/activate
  pip install -r requirements.txt
  ```

- Copy `.env.example` to `.env` and set your secrets/keys.
- Setup MySQL and run:

  ```sh
  python manage.py makemigrations
  python manage.py migrate
  python manage.py runserver
  ```

### 3. Frontend Setup

```sh
cd frontend
npm install
npm start
```

> **Make sure REACT_APP_API_URL is set to your backend API base!**

- The app will be available at `http://localhost:3000`

### 4. Google Gemini & OAuth Setup

- [Google Gemini Studio](https://makersuite.google.com/app/apikey)
- [Google Cloud OAuth](https://console.cloud.google.com/apis/credentials)
- [GitHub Developer Settings](https://github.com/settings/developers)
- [Apple Developer](https://developer.apple.com/account/)
- [GitLab OAuth](https://gitlab.com/-/profile/applications)

Set all keys in `.env`

### 5. Database Schema

- Setup via Django `migrate`, or direct SQL from `db_schema.sql`.

## 📸 Screenshots

> _Add screenshots here for login, chat, admin, payment, etc._

## 🎬 Demo

> _Optional: Add Storylane or Loom link (demo video)_

---

## 6️⃣ **Local Development Steps (Summary)**

1. **Clone the repo**  
   `git clone https://github.com/Arjumaan/byteforge-ai.git`

2. **Create MySQL DB**  
   - Create DB: `CREATE DATABASE byteforge_db;`
   - Edit `.env` (or use `.env.example`)

3. **Backend**
   - `cd backend`
   - `python -m venv env && source env/bin/activate`
   - `pip install -r requirements.txt`
   - `python manage.py makemigrations`
   - `python manage.py migrate`
   - `python manage.py createsuperuser`
   - `python manage.py runserver`

4. **Frontend**
   - `cd frontend`
   - `npm install`
   - `npm start`
   - App at [http://localhost:3000](http://localhost:3000)

5. **Set up OAuth & Gemini keys**  
   - Put keys in your `.env`.

6. **You're ready!**

---

## 7️⃣ **You Want More?**

If you want the **full detailed code of every individual backend/frontend file**, just say:
> "Give me the code for [filename]"  
or  
> "Give me all backend (or frontend) code in order"

I will post the exact code contents per file.

---

**You can now start your local development and cross-verify every line!**

If you want a single ZIP or a gist, or if there's **any file left**, just tell me!
