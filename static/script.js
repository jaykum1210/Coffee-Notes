'use strict';
/* ================================================================
   Coffee&Notes — script.js
   Shared across all pages. Each page has DATA = { ... } injected.
   Provides: escHtml, emptyState, makeNoteCard, renderNav,
             renderFlashes, animateCount, stampIcons, initStrips,
             and all UI interactions (theme, nav, modal, dropzone…)
================================================================ */

// ── Utilities ─────────────────────────────────────────────────

function escHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function emptyState(icon, title, desc, actionHtml) {
  return `
    <div class="empty">
      <div class="empty-box">${icon}</div>
      <h3>${escHtml(title)}</h3>
      <p>${desc}</p>
      ${actionHtml || ''}
    </div>`;
}

// ── Note card builder ─────────────────────────────────────────
// is_owner_of_note: true only when viewing own profile page
function makeNoteCard(note, current_user, is_owner_of_note) {
  const card = document.createElement('div');
  card.className = 'note-card';

  const initial = (note.student || '?')[0].toUpperCase();

  const authorInner = note.username
    ? `<a href="/profile/${encodeURIComponent(note.username)}"
          style="display:flex;align-items:center;gap:6px;color:inherit;">
         <div class="ava">${escHtml(initial)}</div>${escHtml(note.student)}
       </a>`
    : `<div class="ava">${escHtml(initial)}</div>${escHtml(note.student)}`;

  const dateBadge = note.uploaded_at
    ? `<span class="tag" style="border-color:var(--ink-3);color:var(--ink-3);">${escHtml(note.uploaded_at)}</span>`
    : '';

  // Delete: show if on profile page (is_owner_of_note) OR current_user is note owner
  const isNoteOwner = is_owner_of_note ||
    (current_user && current_user.id && current_user.id === note.user_id);

  const deleteBtn = isNoteOwner
    ? `<button type="button" class="btn btn-danger delete-btn"
               data-note-id="${escHtml(note.id)}"
               data-note-title="${escHtml(note.title)}">🗑 Delete</button>`
    : '';

  card.innerHTML = `
    <div class="nc-top">
      <div class="pdf-block">
        <span class="pdf-block-icon">📄</span>
        <span class="pdf-block-label">PDF</span>
      </div>
      <div class="nc-text">
        <div class="nc-title">${escHtml(note.title)}</div>
        <div class="nc-author">${authorInner}</div>
      </div>
    </div>
    <div class="nc-tags">
      <span class="tag">${escHtml(note.subject)}</span>
      ${dateBadge}
    </div>
    <div class="nc-actions">
      <a href="/download/${encodeURIComponent(note.file)}" class="btn btn-primary" download>⬇ Download</a>
      ${deleteBtn}
    </div>
  `;
  return card;
}

// ── Nav renderer ──────────────────────────────────────────────
function renderNav(current_user, current_page) {
  const list = document.getElementById('navLinks');
  if (!list) return;

  // Rebuild entirely to prevent duplicates
  list.innerHTML = '';

  // Home link
  const homeLi = document.createElement('li');
  homeLi.innerHTML = `<a href="/" ${current_page === 'home' ? 'class="active"' : ''}>Home</a>`;
  list.appendChild(homeLi);

  if (current_user) {
    // Upload CTA
    const uploadLi = document.createElement('li');
    uploadLi.innerHTML = `<a href="/upload" class="btn-nav-cta">+ Upload</a>`;
    list.appendChild(uploadLi);

    // Avatar dropdown
    const avatarHtml = current_user.avatar
      ? `<img src="/static/avatars/${escHtml(current_user.avatar)}" class="nav-avatar" alt="${escHtml(current_user.name)}" />`
      : `<div class="nav-avatar-init">${escHtml(current_user.name[0].toUpperCase())}</div>`;

    const userLi = document.createElement('li');
    userLi.className = 'nav-user-wrap';
    userLi.innerHTML = `
      <button class="nav-user-btn" id="userMenuBtn" type="button">
        ${avatarHtml}
        <span class="nav-username">${escHtml(current_user.username)}</span>
        <span class="nav-caret">▾</span>
      </button>
      <div class="user-dropdown" id="userDropdown">
        <a href="/profile/${encodeURIComponent(current_user.username)}">&#128100; My Profile</a>
        <a href="/profile/edit">&#9999;&#65039; Edit Profile</a>
        <div class="dropdown-divider"></div>
        <a href="/logout" class="dropdown-danger">&#8617; Logout</a>
      </div>
    `;
    list.appendChild(userLi);

  } else {
    // Show Login unless already on login page
    if (current_page !== 'login') {
      const loginLi = document.createElement('li');
      loginLi.innerHTML = `<a href="/login" ${current_page === 'login' ? 'class="active"' : ''}>Login</a>`;
      list.appendChild(loginLi);
    }
    // Show Register unless already on register page
    if (current_page !== 'register') {
      const regLi = document.createElement('li');
      regLi.innerHTML = `<a href="/register" class="btn-nav-cta">Register</a>`;
      list.appendChild(regLi);
    }
  }
}

// ── Flash messages renderer ───────────────────────────────────
function renderFlashes(flashes) {
  const mount = document.getElementById('flashesMount');
  if (!mount || !flashes || !flashes.length) return;

  const wrap = document.createElement('div');
  wrap.className = 'flashes';

  flashes.forEach(f => {
    const el = document.createElement('div');
    el.className = `flash ${escHtml(f.cat)}`;
    el.textContent = (f.cat === 'success' ? '✓ ' : '! ') + f.msg;
    wrap.appendChild(el);

    setTimeout(() => {
      el.style.transition = 'opacity 0.4s, transform 0.4s';
      el.style.opacity = '0';
      el.style.transform = 'translateY(-8px)';
      setTimeout(() => el.remove(), 420);
    }, 3200);
  });

  mount.appendChild(wrap);
}

// ── Animated counter ──────────────────────────────────────────
function animateCount(el, target, duration) {
  if (!el) return;
  duration = duration || 900;
  const start = performance.now();
  function step(now) {
    const p    = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(target * ease);
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// ── Subject icon map ──────────────────────────────────────────
function subjectIcon(name) {
  name = (name || '').toLowerCase();
  const map = [
    [['dsa','data struct','algorithm','linked','tree','graph'], '🌳'],
    [['math','calculus','algebra','trig','stat','prob'],        '📐'],
    [['physics','mechanics','electro','quantum'],               '⚛️'],
    [['chem','organic','inorganic'],                            '🧪'],
    [['bio','genetics','cell','anatomy','ecology'],             '🧬'],
    [['history','ancient','medieval','modern','civil'],         '🏛️'],
    [['geo','map','climate','plate'],                           '🗺️'],
    [['econ','finance','macro','micro','trade'],                '📈'],
    [['english','liter','essay','grammar','poetry'],            '📖'],
    [['computer','os','operating'],                             '🖥️'],
    [['network','tcp','http','protocol'],                       '🌐'],
    [['database','sql','nosql','mongo'],                        '🗄️'],
    [['web','html','css','react','angular'],                    '🕸️'],
    [['java','spring'],                                         '☕'],
    [['python','django','flask','numpy'],                       '🐍'],
    [['ai','ml','deep','neural','machine'],                     '🤖'],
    [['design','ui','ux','figma','graphic'],                    '🎨'],
    [['android','ios','mobile','flutter'],                      '📱'],
    [['cloud','aws','azure','docker','devops'],                 '☁️'],
  ];
  for (const [keys, emoji] of map) {
    if (keys.some(k => name.includes(k))) return emoji;
  }
  return '📒';
}

function stampIcons() {
  document.querySelectorAll('[data-subject-icon]').forEach(el => {
    el.textContent = subjectIcon(el.dataset.subjectIcon);
  });
}

// ── Progress strips ───────────────────────────────────────────
function initStrips() {
  document.querySelectorAll('.sc-strip-fill[data-pct]').forEach(el => {
    const pct = parseFloat(el.dataset.pct) || 0;
    setTimeout(() => { el.style.width = pct + '%'; }, 400);
  });
}

// ── Theme ─────────────────────────────────────────────────────
const THEME_KEY = 'ns-theme-v3';

function applyTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  const btn = document.getElementById('themeBtn');
  if (btn) btn.textContent = t === 'dark' ? '☀️' : '🌙';
}

function toggleTheme() {
  const next = (localStorage.getItem(THEME_KEY) || 'light') === 'dark' ? 'light' : 'dark';
  localStorage.setItem(THEME_KEY, next);
  applyTheme(next);
  showToast(next === 'dark' ? '🌙 Dark mode on' : '☀️ Light mode on', 'info');
}

applyTheme(localStorage.getItem(THEME_KEY) || 'light');

// ── Toast ─────────────────────────────────────────────────────
let _toastWrap = null;
function getToastWrap() {
  if (!_toastWrap) {
    _toastWrap = document.createElement('div');
    _toastWrap.className = 'toast-wrap';
    document.body.appendChild(_toastWrap);
  }
  return _toastWrap;
}

function showToast(msg, type, duration) {
  type = type || 'info'; duration = duration || 2800;
  const wrap  = getToastWrap();
  const toast = document.createElement('div');
  toast.className = 'toast ' + type;
  toast.textContent = msg;
  wrap.appendChild(toast);
  setTimeout(() => {
    toast.style.transition = 'opacity 0.3s, transform 0.3s';
    toast.style.opacity    = '0';
    toast.style.transform  = 'translateX(16px)';
    setTimeout(() => toast.remove(), 320);
  }, duration);
}

// ── Mobile nav ────────────────────────────────────────────────
function initMobileNav() {
  const burger = document.getElementById('burger');
  const list   = document.getElementById('navLinks');
  if (!burger || !list) return;

  burger.addEventListener('click', () => {
    const open = list.classList.toggle('open');
    const spans = burger.querySelectorAll('span');
    if (open) {
      spans[0].style.transform = 'translateY(6px) rotate(45deg)';
      spans[1].style.opacity   = '0';
      spans[2].style.transform = 'translateY(-6px) rotate(-45deg)';
    } else {
      spans.forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
    }
  });

  document.addEventListener('click', e => {
    if (!burger.contains(e.target) && !list.contains(e.target)) {
      list.classList.remove('open');
      burger.querySelectorAll('span').forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
    }
  });
}

// ── User dropdown ─────────────────────────────────────────────
function initUserDropdown() {
  document.addEventListener('click', e => {
    const btn  = document.getElementById('userMenuBtn');
    const drop = document.getElementById('userDropdown');
    if (!btn || !drop) return;
    if (btn.contains(e.target)) { drop.classList.toggle('open'); return; }
    drop.classList.remove('open');
  });
}

// ── Scroll top ────────────────────────────────────────────────
function initScrollTop() {
  const btn = document.getElementById('scrollTop');
  if (!btn) return;
  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 280);
  }, { passive: true });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

// ── Delete modal ──────────────────────────────────────────────
function initDeleteModal() {
  const overlay  = document.getElementById('deleteModal');
  const confirmB = document.getElementById('modalConfirm');
  const cancelB  = document.getElementById('modalCancel');
  if (!overlay) return;

  let pendingId    = null;
  let pendingTitle = null;

  document.addEventListener('click', e => {
    const btn = e.target.closest('.delete-btn');
    if (!btn) return;
    pendingId    = btn.dataset.noteId;
    pendingTitle = btn.dataset.noteTitle;
    overlay.classList.add('open');
  });

  const close = () => { overlay.classList.remove('open'); pendingId = null; };

  cancelB  && cancelB.addEventListener('click', close);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });

  confirmB && confirmB.addEventListener('click', () => {
    if (!pendingId) return;
    confirmB.textContent = 'Deleting…';
    confirmB.disabled    = true;

    // Submit a hidden form via POST
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/delete/' + encodeURIComponent(pendingId);
    document.body.appendChild(form);
    form.submit();
  });
}

// ── Drop zone ─────────────────────────────────────────────────
function initDropZone() {
  const zone  = document.getElementById('dropZone');
  const input = document.getElementById('fileInput');
  const label = document.getElementById('dzFilename');
  const icon  = document.getElementById('dzIcon');
  if (!zone || !input) return;

  function showFile(file) {
    zone.classList.add('has-file');
    if (label) { label.textContent = '✅  ' + file.name; label.classList.add('show'); }
    if (icon)  icon.textContent = '📄';
  }

  input.addEventListener('change', () => { if (input.files[0]) showFile(input.files[0]); });
  zone.addEventListener('dragover',  e => { e.preventDefault(); zone.classList.add('dragover'); });
  zone.addEventListener('dragleave', e => { if (!zone.contains(e.relatedTarget)) zone.classList.remove('dragover'); });
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('dragover');
    const file = e.dataTransfer && e.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
      const dt = new DataTransfer();
      dt.items.add(file);
      input.files = dt.files;
      showFile(file);
    } else {
      zone.animate([
        {transform:'translateX(0)'},{transform:'translateX(-8px)'},
        {transform:'translateX(8px)'},{transform:'translateX(0)'}
      ], {duration:300});
      showToast('⚠️ PDF files only!', 'error');
    }
  });
}

// ── Upload form ───────────────────────────────────────────────
function initUploadForm() {
  const form = document.getElementById('uploadForm');
  const sub  = form && form.querySelector('[type="submit"]');
  if (!form) return;
  form.addEventListener('submit', e => {
    const fi = document.getElementById('fileInput');
    if (!fi || !fi.files.length) {
      e.preventDefault();
      const zone = document.getElementById('dropZone');
      if (zone) zone.animate([
        {transform:'translateX(0)'},{transform:'translateX(-8px)'},
        {transform:'translateX(8px)'},{transform:'translateX(0)'}
      ], {duration:300});
      showToast('⚠️ Please select a PDF file', 'error');
      return;
    }
    if (sub) { sub.textContent = '⏳ Uploading…'; sub.disabled = true; }
  });
}

// ── Password toggle ───────────────────────────────────────────
function initPasswordToggle() {
  document.querySelectorAll('.toggle-pw').forEach(btn => {
    btn.addEventListener('click', () => {
      const inp = document.getElementById(btn.dataset.target);
      if (!inp) return;
      inp.type = inp.type === 'password' ? 'text' : 'password';
      btn.textContent = inp.type === 'password' ? '👁' : '🙈';
    });
  });
}

// ── Password strength ─────────────────────────────────────────
function initPasswordStrength() {
  const pw    = document.getElementById('password');
  const fill  = document.getElementById('pwFill');
  const label = document.getElementById('pwLabel');
  if (!pw || !fill || !label) return;
  pw.addEventListener('input', () => {
    const v = pw.value;
    let score = 0;
    if (v.length >= 6)            score++;
    if (v.length >= 10)           score++;
    if (/[A-Z]/.test(v))          score++;
    if (/[0-9]/.test(v))          score++;
    if (/[^a-zA-Z0-9]/.test(v))   score++;
    const pct   = (score / 5) * 100;
    const color = score <= 1 ? '#ff4d6d' : score <= 3 ? '#ff6b2b' : '#c8f135';
    const text  = score <= 1 ? 'Weak'    : score <= 3 ? 'Fair'    : 'Strong';
    fill.style.width      = pct + '%';
    fill.style.background = color;
    label.textContent     = v.length ? text : '—';
    label.style.color     = v.length ? color : 'var(--ink-3)';
  });
}

// ── Confirm password match ────────────────────────────────────
function initConfirmPassword() {
  const form    = document.getElementById('registerForm');
  const pw      = document.getElementById('password');
  const confirm = document.getElementById('confirm');
  if (!form || !pw || !confirm) return;
  form.addEventListener('submit', e => {
    if (pw.value !== confirm.value) {
      e.preventDefault();
      confirm.style.outline = '2px solid var(--coral)';
      showToast('⚠️ Passwords do not match', 'error');
    }
  });
  confirm.addEventListener('input', () => {
    confirm.style.outline = pw.value === confirm.value ? '' : '2px solid var(--coral)';
  });
}

// ── Avatar preview ────────────────────────────────────────────
function initAvatarPreview() {
  const input   = document.getElementById('avatarInput');
  const preview = document.getElementById('avatarPreview');
  const fname   = document.getElementById('avatarFileName');
  if (!input || !preview) return;
  input.addEventListener('change', () => {
    const file = input.files[0];
    if (!file) return;
    if (fname) fname.textContent = '📎 ' + file.name;
    const reader = new FileReader();
    reader.onload = e => {
      preview.innerHTML = `<img src="${e.target.result}"
        style="width:72px;height:72px;border-radius:50%;border:2px solid var(--ink);
               box-shadow:var(--shadow-sm);object-fit:cover;" alt="Preview" />`;
    };
    reader.readAsDataURL(file);
  });
}

// ── About char counter ────────────────────────────────────────
function initAboutCounter() {
  const ta  = document.getElementById('about');
  const cnt = document.getElementById('aboutCount');
  if (!ta || !cnt) return;
  ta.addEventListener('input', () => { cnt.textContent = ta.value.length + '/500'; });
}

// ── Ripple effect ─────────────────────────────────────────────
function initRipples() {
  const style = document.createElement('style');
  style.textContent = `@keyframes rpl{to{transform:translate(-50%,-50%) scale(60);opacity:0}}`;
  document.head.appendChild(style);
  document.addEventListener('click', e => {
    const btn = e.target.closest('.btn');
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    const s = document.createElement('span');
    s.style.cssText = `position:absolute;width:8px;height:8px;border-radius:50%;
      background:rgba(255,255,255,0.4);pointer-events:none;
      left:${e.clientX-r.left}px;top:${e.clientY-r.top}px;
      transform:translate(-50%,-50%) scale(0);animation:rpl 0.5s ease forwards;`;
    if (getComputedStyle(btn).position === 'static') btn.style.position = 'relative';
    btn.style.overflow = 'hidden';
    btn.appendChild(s);
    s.addEventListener('animationend', () => s.remove());
  });
}

// ── Scroll reveal ─────────────────────────────────────────────
function initReveal() {
  const style = document.createElement('style');
  style.textContent = `
    .subject-card,.note-card,.stat-block,.form-card,.tips-box{
      opacity:0;transform:translateY(16px);
      transition:opacity .5s cubic-bezier(.16,1,.3,1),transform .5s cubic-bezier(.16,1,.3,1);
    }
    .revealed{opacity:1!important;transform:translateY(0)!important;}
  `;
  document.head.appendChild(style);
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('revealed'); obs.unobserve(e.target); } });
  }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });
  document.querySelectorAll('.subject-card,.note-card,.stat-block,.form-card,.tips-box').forEach((el, i) => {
    el.style.transitionDelay = (i % 8) * 0.06 + 's';
    obs.observe(el);
  });
}

// ── Card tilt ─────────────────────────────────────────────────
function initCardTilt() {
  if (window.matchMedia('(pointer:coarse)').matches) return;
  document.querySelectorAll('.note-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width  - 0.5;
      const y = (e.clientY - r.top)  / r.height - 0.5;
      card.style.transform = `translate(-3px,-3px) rotateY(${x*6}deg) rotateX(${-y*6}deg)`;
    });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; });
  });
}

// ── Page fade in ──────────────────────────────────────────────
function initPageFade() {
  document.body.style.opacity    = '0';
  document.body.style.transition = 'opacity 0.25s ease';
  requestAnimationFrame(() => requestAnimationFrame(() => { document.body.style.opacity = '1'; }));
}

// ── Boot ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  applyTheme(localStorage.getItem(THEME_KEY) || 'light');

  const d = typeof DATA !== 'undefined' ? DATA : {};

  // Render nav and flashes from DATA
  renderNav(d.current_user || null, d.current_page || '');
  renderFlashes(d.flashes   || []);

  // Wire up theme toggle
  const themeBtn = document.getElementById('themeBtn');
  if (themeBtn) themeBtn.addEventListener('click', toggleTheme);

  initPageFade();
  initScrollTop();
  initMobileNav();
  initUserDropdown();
  initDeleteModal();
  initDropZone();
  initUploadForm();
  initPasswordToggle();
  initPasswordStrength();
  initConfirmPassword();
  initAvatarPreview();
  initAboutCounter();
  initRipples();

  // Defer reveal/tilt until DOM is fully painted
  setTimeout(() => { initReveal(); initCardTilt(); initStrips(); stampIcons(); }, 50);
});
