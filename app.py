
import os, json, uuid, datetime
from functools import wraps
from flask import (Flask, render_template, request, redirect,
                   url_for, send_from_directory, flash, session, jsonify)
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
app.secret_key = "coffeenotes_secret_v4"

BASE          = os.path.dirname(__file__)
UPLOAD_FOLDER = os.path.join(BASE, "uploads")
AVATAR_FOLDER = os.path.join(BASE, "static", "avatars")
NOTES_FILE    = os.path.join(BASE, "notes.json")
USERS_FILE    = os.path.join(BASE, "users.json")

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(AVATAR_FOLDER, exist_ok=True)

MAX_PDF = 5 * 1024 * 1024
MAX_IMG = 3 * 1024 * 1024
app.config["MAX_CONTENT_LENGTH"] = MAX_PDF

ALLOWED_PDF = {"pdf"}
ALLOWED_IMG = {"png", "jpg", "jpeg", "gif", "webp"}


# ── JSON helpers ───────────────────────────────────────────────
def _load(path):
    if not os.path.exists(path): return []
    with open(path) as f:
        try:    return json.load(f)
        except: return []

def _save(path, data):
    with open(path, "w") as f: json.dump(data, f, indent=2)

def load_notes():  return _load(NOTES_FILE)
def save_notes(d): _save(NOTES_FILE, d)
def load_users():  return _load(USERS_FILE)
def save_users(d): _save(USERS_FILE, d)


# ── User helpers ───────────────────────────────────────────────
def find_by_id(uid):       return next((u for u in load_users() if u["id"] == uid), None)
def find_by_username(name):return next((u for u in load_users() if u["username"].lower() == name.lower()), None)
def find_by_email(email):  return next((u for u in load_users() if u["email"].lower() == email.lower()), None)

def current_user():
    uid = session.get("user_id")
    return find_by_id(uid) if uid else None

def safe_user(u):
    """Return user dict safe to expose to frontend (no password)."""
    if not u: return None
    return {k: v for k, v in u.items() if k != "password"}

def login_required(f):
    @wraps(f)
    def wrap(*a, **kw):
        if not session.get("user_id"):
            flash("Please log in to continue.", "error")
            return redirect(url_for("login"))
        return f(*a, **kw)
    return wrap

def ext_ok(filename, allowed):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in allowed

def get_subjects(notes):
    d = {}
    for n in notes:
        s = n["subject"].strip()
        d[s] = d.get(s, 0) + 1
    return [{"name": k, "count": v} for k, v in sorted(d.items())]

def get_flashes():
    msgs = session.pop("_flashes", [])
    return [{"cat": cat, "msg": msg} for cat, msg in msgs]

def collect_flashes():
    """Collect Flask flashed messages as list of dicts."""
    from flask import get_flashed_messages
    raw = get_flashed_messages(with_categories=True)
    return [{"cat": c, "msg": m} for c, m in raw]


# ── AUTH ───────────────────────────────────────────────────────
@app.route("/register", methods=["GET", "POST"])
def register():
    if session.get("user_id"): return redirect(url_for("index"))

    if request.method == "POST":
        name     = request.form.get("name", "").strip()
        username = request.form.get("username", "").strip()
        email    = request.form.get("email", "").strip().lower()
        pw       = request.form.get("password", "")
        pw2      = request.form.get("confirm", "")

        if not all([name, username, email, pw, pw2]):
            flash("All fields are required.", "error")
        elif len(username) < 3:
            flash("Username must be at least 3 characters.", "error")
        elif pw != pw2:
            flash("Passwords do not match.", "error")
        elif len(pw) < 6:
            flash("Password must be at least 6 characters.", "error")
        elif find_by_username(username):
            flash("Username already taken.", "error")
        elif find_by_email(email):
            flash("Email already registered.", "error")
        else:
            user = {
                "id": str(uuid.uuid4()), "name": name,
                "username": username, "email": email,
                "password": generate_password_hash(pw),
                "headline": "", "about": "", "avatar": "",
                "joined": datetime.date.today().isoformat(),
            }
            users = load_users(); users.append(user); save_users(users)
            session["user_id"] = user["id"]
            flash(f"Welcome to Coffee&Notes, {name}! ☕", "success")
            return redirect(url_for("index"))
        return redirect(url_for("register"))

    data = {"flashes": collect_flashes(), "current_user": safe_user(current_user())}
    return render_template("register.html", data=data)


@app.route("/login", methods=["GET", "POST"])
def login():
    if session.get("user_id"): return redirect(url_for("index"))

    if request.method == "POST":
        username = request.form.get("username", "").strip()
        pw       = request.form.get("password", "")
        user     = find_by_username(username)
        if not user or not check_password_hash(user["password"], pw):
            flash("Invalid username or password.", "error")
            return redirect(url_for("login"))
        session["user_id"] = user["id"]
        flash(f"Welcome back, {user['name']}!", "success")
        return redirect(url_for("index"))

    data = {"flashes": collect_flashes(), "current_user": safe_user(current_user())}
    return render_template("login.html", data=data)


@app.route("/logout")
def logout():
    session.clear()
    flash("Logged out. See you soon!", "success")
    return redirect(url_for("login"))


# ── PROFILE ────────────────────────────────────────────────────
@app.route("/profile/<username>")
def profile(username):
    user = find_by_username(username)
    if not user:
        flash("User not found.", "error")
        return redirect(url_for("index"))

    me       = current_user()
    is_owner = bool(me and me["id"] == user["id"])
    notes    = [n for n in load_notes() if n.get("user_id") == user["id"]]

    data = {
        "flashes":      collect_flashes(),
        "current_user": safe_user(me),
        "profile_user": safe_user(user),
        "is_owner":     is_owner,
        "notes":        notes,
    }
    return render_template("profile.html", data=data)


@app.route("/profile/edit", methods=["GET", "POST"])
@login_required
def edit_profile():
    me = current_user()

    if request.method == "POST":
        users = load_users()
        for u in users:
            if u["id"] != me["id"]: continue
            name     = request.form.get("name", "").strip()
            if name: u["name"] = name
            u["headline"] = request.form.get("headline", "").strip()
            u["about"]    = request.form.get("about", "").strip()

            av = request.files.get("avatar")
            if av and av.filename:
                if not ext_ok(av.filename, ALLOWED_IMG):
                    flash("Avatar must be an image file.", "error")
                    return redirect(url_for("edit_profile"))
                data = av.read()
                if len(data) > MAX_IMG:
                    flash("Avatar must be under 3 MB.", "error")
                    return redirect(url_for("edit_profile"))
                if u.get("avatar"):
                    old = os.path.join(AVATAR_FOLDER, u["avatar"])
                    if os.path.exists(old): os.remove(old)
                suffix = av.filename.rsplit(".", 1)[1].lower()
                fname  = f"{u['id']}.{suffix}"
                with open(os.path.join(AVATAR_FOLDER, fname), "wb") as f:
                    f.write(data)
                u["avatar"] = fname
            break

        save_users(users)
        flash("Profile updated!", "success")
        return redirect(url_for("profile", username=me["username"]))

    data = {
        "flashes":      collect_flashes(),
        "current_user": safe_user(me),
        "me":           safe_user(me),
    }
    return render_template("edit_profile.html", data=data)


# ── NOTES ──────────────────────────────────────────────────────
@app.route("/")
def index():
    notes    = load_notes()
    subjects = get_subjects(notes)
    q        = request.args.get("q", "").strip().lower()
    results  = []
    if q:
        results = [n for n in notes
                   if q in n["title"].lower()
                   or q in n["subject"].lower()
                   or q in n["student"].lower()]

    data = {
        "flashes":        collect_flashes(),
        "current_user":   safe_user(current_user()),
        "subjects":       subjects,
        "total_notes":    len(notes),
        "total_subjects": len(subjects),
        "search_query":   q,
        "search_results": results,
    }
    return render_template("index.html", data=data)


@app.route("/upload", methods=["GET", "POST"])
@login_required
def upload_note():
    me = current_user()

    if request.method == "POST":
        subject = request.form.get("subject", "").strip()
        title   = request.form.get("title", "").strip()
        file    = request.files.get("file")

        if not subject or not title:
            flash("Subject and title are required.", "error")
            return redirect(url_for("upload_note"))
        if not file or not file.filename:
            flash("Please select a PDF.", "error")
            return redirect(url_for("upload_note"))
        if not ext_ok(file.filename, ALLOWED_PDF):
            flash("Only PDF files allowed.", "error")
            return redirect(url_for("upload_note"))

        content = file.read()
        if len(content) > MAX_PDF:
            flash("File exceeds 5 MB limit.", "error")
            return redirect(url_for("upload_note"))
        file.seek(0)

        fname = f"{uuid.uuid4().hex}.pdf"
        file.save(os.path.join(UPLOAD_FOLDER, fname))

        notes = load_notes()
        notes.append({
            "id":                str(uuid.uuid4()),
            "user_id":           me["id"],
            "student":           me["name"],
            "username":          me["username"],
            "subject":           subject.upper(),
            "title":             title,
            "file":              fname,
            "original_filename": file.filename,
            "uploaded_at":       datetime.date.today().isoformat(),
        })
        save_notes(notes)
        flash(f'"{title}" uploaded!', "success")
        return redirect(url_for("subject_notes", subject_name=subject.upper()))

    data = {
        "flashes":      collect_flashes(),
        "current_user": safe_user(me),
        "me":           safe_user(me),
    }
    return render_template("upload_note.html", data=data)


@app.route("/subject/<subject_name>")
def subject_notes(subject_name):
    notes    = load_notes()
    filtered = [n for n in notes if n["subject"].upper() == subject_name.upper()]
    data = {
        "flashes":      collect_flashes(),
        "current_user": safe_user(current_user()),
        "subject":      subject_name.upper(),
        "notes":        filtered,
    }
    return render_template("subject.html", data=data)


@app.route("/download/<filename>")
def download_file(filename):
    return send_from_directory(UPLOAD_FOLDER, filename, as_attachment=True)


@app.route("/delete/<note_id>", methods=["POST"])
@login_required
def delete_note(note_id):
    me    = current_user()
    notes = load_notes()
    note  = next((n for n in notes if n["id"] == note_id), None)

    if not note:
        flash("Note not found.", "error")
        return redirect(url_for("index"))
    if note.get("user_id") != me["id"]:
        flash("You can only delete your own notes.", "error")
        return redirect(url_for("subject_notes", subject_name=note["subject"]))

    fp = os.path.join(UPLOAD_FOLDER, note["file"])
    if os.path.exists(fp): os.remove(fp)

    notes = [n for n in notes if n["id"] != note_id]
    save_notes(notes)
    flash(f'"{note["title"]}" deleted.', "success")

    subj = note["subject"]
    return redirect(url_for("subject_notes", subject_name=subj)
                    if any(n["subject"] == subj for n in notes)
                    else url_for("index"))


if __name__ == "__main__":
    app.run(debug=True)
