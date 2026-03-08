# ☕ Coffee&Notes — Student Collaborative Notes Platform

A Flask web app where students can register, log in, upload PDF notes, browse by subject, and manage their profile.

---

## 🚀 Run Locally

```bash
pip install -r requirements.txt
python app.py
```
Open http://127.0.0.1:5000

---

## 🌐 Deploy on Render

1. Push this folder to a GitHub repo
2. Go to https://render.com → New → Web Service
3. Connect your repo
4. Set these fields:
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn app:app`
   - **Environment:** Python 3

> ⚠️ Render's filesystem is ephemeral — uploaded files reset on redeploy.

---

## 📁 Project Structure

```
coffee-notes/
├── app.py
├── requirements.txt        ← pip dependencies (flask, werkzeug, gunicorn)
├── Procfile                ← gunicorn start command for Render
├── notes.json              ← auto-created on first run
├── users.json              ← auto-created on first run
├── uploads/                ← PDF files
├── static/
│   ├── style.css
│   ├── script.js
│   ├── favicon.svg
│   └── avatars/
└── templates/              ← standalone HTML files (1 line of Jinja2 each)
```
