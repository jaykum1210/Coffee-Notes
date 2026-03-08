# 📚 NoteShare — Student Collaborative Notes Platform

A modern, beginner-friendly Flask web app where students can upload, share, and download PDF notes organised by subject.

---

## 🚀 How to Run

### 1. Install Python (3.8+)
Make sure Python is installed: https://python.org

### 2. Install Flask
```bash
pip install flask
```

### 3. Start the app
```bash
python app.py
```

### 4. Open in your browser
```
http://127.0.0.1:5000
```

---

## 📁 Folder Structure

```
student-notes/
│
├── app.py              ← Flask backend (routes + logic)
├── notes.json          ← Note metadata storage (auto-created)
├── README.md           ← This file
│
├── uploads/            ← PDF files are saved here
│
├── templates/
│   ├── base.html       ← Shared layout (navbar, footer, modals)
│   ├── index.html      ← Home page (subjects grid + search)
│   ├── upload_note.html← Upload form page
│   └── subject.html    ← Notes list for a single subject
│
└── static/
    ├── style.css       ← All styles (light/dark mode, responsive)
    └── script.js       ← Theme toggle, scroll-top, drag-drop, modals
```

---

## 🗄️ notes.json Structure

Notes are stored as a JSON array. Example:

```json
[
  {
    "id": "a1b2c3d4...",
    "student": "Jay",
    "subject": "DSA",
    "title": "Linked List Basics",
    "file": "a1b2c3d4abc.pdf",
    "original_filename": "linked_list.pdf"
  },
  {
    "id": "e5f6g7h8...",
    "student": "Ananya",
    "subject": "PHYSICS",
    "title": "Laws of Motion",
    "file": "e5f6g7h8xyz.pdf",
    "original_filename": "newton_laws.pdf"
  }
]
```

- `id` — unique identifier (UUID) used for deletion
- `file` — renamed file stored in `uploads/` (UUID-based, avoids name collisions)
- `original_filename` — the original name the student gave the file

---

## ✨ Features

| Feature | Details |
|---|---|
| **Home Page** | Subjects appear dynamically as notes are uploaded |
| **Stats Counter** | Live count of total subjects and total notes |
| **Upload Notes** | Name + Subject + Title + PDF (max 5 MB) |
| **PDF Storage** | Saved in `uploads/` with unique UUID filename |
| **Subject Pages** | All notes for a subject with download + delete |
| **Delete Note** | Removes from `notes.json` AND deletes the PDF |
| **Search** | Search by title, subject, or student name |
| **Dark/Light Mode** | Toggle button; preference saved in localStorage |
| **Scroll to Top** | Floating button that appears after scrolling |
| **Mobile Responsive** | Works on desktop, tablet, and phone |
| **Drag & Drop Upload** | Drag a PDF into the upload zone |
| **Delete Confirmation** | Modal confirmation before deleting a note |

---

## 🛡️ Validations

- **PDF only** — only `.pdf` files are accepted
- **Max 5 MB** — larger files are rejected with an error message
- **All fields required** — Name, Subject, and Title must be filled

---

## 🎨 Design

- **Fonts**: Syne (display) + DM Sans (body)
- **Palette**: Warm cream background with orange-red accent
- **Dark mode**: Deep charcoal with warm accent
- **Animations**: Card hover lifts, staggered grid reveal, flash dismiss
