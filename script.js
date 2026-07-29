/* ===== Constants ===== */
const PASSWORD = '040121';
const QUOTES = [
  'Every morning I wake up grateful for the day I met you.',
  'Loving you is the bravest thing I have ever done.',
  'I want to share every sunrise and sunset with you.',
  'You are the person I want to tell everything to.',
  'The world is big, and I am so glad I found you.',
  'Because of you, even the ordinary days shine.',
  'Meeting you was the best accident of my life.',
  'Your smile is the most beautiful thing I have ever seen.',
  'May every day ahead have you in it.',
  'Wherever we are together, that is home.',
];

let currentQuoteIdx = 0;
let countdownTimers = [];

/* ===== Safe localStorage helpers ===== */
function lsGet(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v === null ? fallback : v;
  } catch (e) {
    return fallback;
  }
}

function lsSet(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    // Storage full — try to free space from photos then retry
    if (key !== 'photos') {
      try {
        const photos = JSON.parse(lsGet('photos', '[]'));
        if (photos.length > 0) {
          photos.splice(Math.floor(photos.length / 2)); // drop half
          localStorage.setItem('photos', JSON.stringify(photos));
          localStorage.setItem(key, value);
          alert('Storage was almost full. Some older photos were removed to save your data.');
          renderPhotos();
          return true;
        }
      } catch (e2) {}
    }
    alert('Storage is full. Please export a backup and clear some photos.');
    return false;
  }
}

function lsGetJSON(key, fallback) {
  try {
    return JSON.parse(lsGet(key, null)) ?? fallback;
  } catch (e) {
    return fallback;
  }
}

/* ===== Password ===== */
function checkPassword() {
  const val = document.getElementById('pwdInput').value.trim();
  if (val === PASSWORD) {
    document.getElementById('lockScreen').style.display = 'none';
    init();
  } else {
    const err = document.getElementById('pwdError');
    err.textContent = 'Wrong password, please try again ✗';
    document.getElementById('pwdInput').value = '';
    setTimeout(() => { err.textContent = ''; }, 2500);
  }
}

document.getElementById('pwdInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') checkPassword();
});

/* ===== Init ===== */
function init() {
  loadNames();
  loadMetDate();
  renderEvents();
  renderAnniversaries();
  renderPhotos();
  startSlideshow();
  updateNextAnniversary();
}

/* ===== Slideshow ===== */
function startSlideshow() {
  const slides = document.querySelectorAll('.slide');
  let current = 0;
  setInterval(() => {
    slides[current].classList.remove('active');
    current = (current + 1) % slides.length;
    slides[current].classList.add('active');
  }, 6000);
}

/* ===== Music ===== */
function toggleMusic() {
  const audio = document.getElementById('bgMusic');
  const btn = document.getElementById('musicBtn');
  if (audio.paused) {
    audio.play().catch(() => {});
    btn.classList.add('playing');
    btn.title = 'Pause Music';
  } else {
    audio.pause();
    btn.classList.remove('playing');
    btn.title = 'Play Music';
  }
}

/* ===== Navigation ===== */
function showSection(id) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  const idx = ['home', 'timeline', 'anniversary', 'album', 'backup'].indexOf(id);
  document.querySelectorAll('.nav-btn')[idx].classList.add('active');
}

/* ===== Modals ===== */
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

document.querySelectorAll('.modal').forEach(m => {
  m.addEventListener('click', e => { if (e.target === m) closeModal(m.id); });
});

/* ===== Names ===== */
function loadNames() {
  const n1 = lsGet('name1', 'You');
  const n2 = lsGet('name2', 'Me');
  document.getElementById('name1Display').textContent = n1;
  document.getElementById('name2Display').textContent = n2;
}

function openNameModal() {
  document.getElementById('name1Input').value = lsGet('name1', '');
  document.getElementById('name2Input').value = lsGet('name2', '');
  openModal('nameModal');
}

function saveNames() {
  const n1 = document.getElementById('name1Input').value.trim() || 'You';
  const n2 = document.getElementById('name2Input').value.trim() || 'Me';
  lsSet('name1', n1);
  lsSet('name2', n2);
  document.getElementById('name1Display').textContent = n1;
  document.getElementById('name2Display').textContent = n2;
  closeModal('nameModal');
}

/* ===== Met Date ===== */
function loadMetDate() {
  const d = lsGet('metDate', null);
  if (!d) return;
  // Parse as local date to avoid timezone shifting
  const [year, month, day] = d.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  document.getElementById('metDateDisplay').textContent = formatDate(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.floor((today - date) / 86400000);
  document.getElementById('metDaysDisplay').textContent =
    days >= 0 ? `Together for ${days} days 🌟` : `${-days} days until we meet`;
}

function openMetModal() {
  const d = lsGet('metDate', null);
  if (d) document.getElementById('metDateInput').value = d;
  openModal('metModal');
}

function saveMetDate() {
  const d = document.getElementById('metDateInput').value;
  if (!d) return;
  lsSet('metDate', d);
  loadMetDate();
  closeModal('metModal');
}

/* ===== Events / Memories ===== */
function getEvents() { return lsGetJSON('events', []); }
function saveEvents(evts) { lsSet('events', JSON.stringify(evts)); }

function openEventModal() {
  document.getElementById('eventDate').value = '';
  document.getElementById('eventDesc').value = '';
  openModal('eventModal');
}

function saveEvent() {
  const date = document.getElementById('eventDate').value;
  const desc = document.getElementById('eventDesc').value.trim();
  const tag  = document.getElementById('eventTag').value;
  if (!date || !desc) return;
  const evts = getEvents();
  evts.push({ id: Date.now(), date, desc, tag });
  evts.sort((a, b) => new Date(b.date) - new Date(a.date));
  saveEvents(evts);
  renderEvents();
  closeModal('eventModal');
}

function deleteEvent(id) {
  saveEvents(getEvents().filter(e => e.id !== id));
  renderEvents();
}

function renderEvents() {
  const list = document.getElementById('eventList');
  const evts = getEvents();
  if (!evts.length) {
    list.innerHTML = '<p class="empty-hint">No memories yet — add your first one ✨</p>';
    return;
  }
  list.innerHTML = evts.map(e => {
    const [y, m, d] = e.date.split('-').map(Number);
    return `
    <div class="event-item">
      <div class="event-tag">${e.tag}</div>
      <div class="event-info">
        <div class="event-date">${formatDate(new Date(y, m - 1, d))}</div>
        <div class="event-desc">${escHtml(e.desc)}</div>
      </div>
      <button class="delete-btn" onclick="deleteEvent(${e.id})">✕</button>
    </div>`;
  }).join('');
}

/* ===== Anniversaries ===== */
function getAnniversaries() { return lsGetJSON('anniversaries', []); }
function saveAnniversaries(list) { lsSet('anniversaries', JSON.stringify(list)); }

function openAnniModal() {
  document.getElementById('anniName').value = '';
  document.getElementById('anniDate').value = '';
  openModal('anniModal');
}

function saveAnniversary() {
  const name = document.getElementById('anniName').value.trim();
  const date = document.getElementById('anniDate').value;
  const type = document.getElementById('anniType').value;
  if (!name || !date) return;
  const list = getAnniversaries();
  list.push({ id: Date.now(), name, date, type });
  saveAnniversaries(list);
  renderAnniversaries();
  updateNextAnniversary();
  closeModal('anniModal');
}

function deleteAnniversary(id) {
  saveAnniversaries(getAnniversaries().filter(a => a.id !== id));
  countdownTimers.forEach(clearInterval);
  countdownTimers = [];
  renderAnniversaries();
  updateNextAnniversary();
}

function renderAnniversaries() {
  countdownTimers.forEach(clearInterval);
  countdownTimers = [];

  const container = document.getElementById('anniList');
  const list = getAnniversaries();

  if (!list.length) {
    container.innerHTML = '<p class="empty-hint">No anniversaries yet — add one 💝</p>';
    return;
  }

  container.innerHTML = list.map(a => {
    const [y, m, d] = a.date.split('-').map(Number);
    return `
    <div class="anni-item" id="anni-${a.id}">
      <button class="delete-btn" onclick="deleteAnniversary(${a.id})">✕</button>
      <div class="anni-name">💝 ${escHtml(a.name)}</div>
      <div class="anni-date">${formatDate(new Date(y, m - 1, d))} · ${a.type === 'yearly' ? 'Every Year' : 'Once Only'}</div>
      <div class="countdown-display" id="cd-${a.id}"></div>
    </div>`;
  }).join('');

  list.forEach(a => {
    updateCountdown(a);
    const timer = setInterval(() => updateCountdown(a), 1000);
    countdownTimers.push(timer);
  });
}

function updateCountdown(anni) {
  const el = document.getElementById(`cd-${anni.id}`);
  if (!el) return;

  const now = new Date();
  const [y, m, d] = anni.date.split('-').map(Number);
  let target = new Date(y, m - 1, d);

  if (anni.type === 'yearly') {
    target.setFullYear(now.getFullYear());
    if (target <= now) target.setFullYear(now.getFullYear() + 1);
  }

  const diff = target.getTime() - now.getTime();

  if (diff < 0 && anni.type === 'once') {
    el.innerHTML = `<span class="cd-passed">${Math.abs(Math.floor(diff / 86400000))} days ago</span>`;
    return;
  }

  if (Math.abs(diff) < 1000) {
    el.innerHTML = '<span class="cd-passed">🎉 Today is the day!</span>';
    return;
  }

  const totalSec = Math.floor(diff / 1000);
  const days = Math.floor(totalSec / 86400);
  const hrs  = Math.floor((totalSec % 86400) / 3600);
  const min  = Math.floor((totalSec % 3600) / 60);
  const sec  = totalSec % 60;

  el.innerHTML = `
    <div class="cd-unit"><div class="cd-num">${days}</div><div class="cd-label">days</div></div>
    <div class="cd-unit"><div class="cd-num">${pad(hrs)}</div><div class="cd-label">hrs</div></div>
    <div class="cd-unit"><div class="cd-num">${pad(min)}</div><div class="cd-label">min</div></div>
    <div class="cd-unit"><div class="cd-num">${pad(sec)}</div><div class="cd-label">sec</div></div>
  `;
}

function updateNextAnniversary() {
  const el = document.getElementById('nextAnniDisplay');
  const list = getAnniversaries();
  if (!list.length) { el.textContent = 'No anniversaries yet'; return; }

  const now = new Date();
  let nearest = null;
  let nearestDiff = Infinity;

  list.forEach(a => {
    const [y, m, d] = a.date.split('-').map(Number);
    let target = new Date(y, m - 1, d);
    if (a.type === 'yearly') {
      target.setFullYear(now.getFullYear());
      if (target <= now) target.setFullYear(now.getFullYear() + 1);
    }
    const diff = target - now;
    if (diff > 0 && diff < nearestDiff) {
      nearestDiff = diff;
      nearest = { ...a, targetDate: target };
    }
  });

  if (!nearest) { el.textContent = 'No upcoming anniversaries'; return; }
  const days = Math.ceil(nearestDiff / 86400000);
  el.innerHTML = `<strong>${escHtml(nearest.name)}</strong><br/>
    ${formatDate(nearest.targetDate)}<br/>
    In <strong style="color:var(--primary);font-size:1.2em">${days}</strong> days 🎉`;
}

/* ===== Photos ===== */
function getPhotos() { return lsGetJSON('photos', []); }

function savePhotos(photos) {
  // Compress: keep max 100 photos to stay within localStorage limits
  const capped = photos.slice(0, 100);
  return lsSet('photos', JSON.stringify(capped));
}

function uploadPhotos(event) {
  const files = Array.from(event.target.files);
  if (!files.length) return;

  let processed = 0;
  const photos = getPhotos();

  files.forEach(file => {
    // Resize large images before storing to reduce size
    const reader = new FileReader();
    reader.onload = e => {
      resizeImage(e.target.result, 1200, result => {
        photos.unshift({
          id: Date.now() + Math.random(),
          src: result,
          date: new Date().toLocaleDateString('en-US'),
          name: file.name,
        });
        processed++;
        if (processed === files.length) {
          const ok = savePhotos(photos);
          if (ok) renderPhotos();
        }
      });
    };
    reader.readAsDataURL(file);
  });

  event.target.value = '';
}

function resizeImage(dataUrl, maxWidth, callback) {
  const img = new Image();
  img.onload = () => {
    let w = img.width, h = img.height;
    if (w > maxWidth) { h = Math.round(h * maxWidth / w); w = maxWidth; }
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    canvas.getContext('2d').drawImage(img, 0, 0, w, h);
    callback(canvas.toDataURL('image/jpeg', 0.75));
  };
  img.src = dataUrl;
}

function deletePhoto(id) {
  savePhotos(getPhotos().filter(p => p.id !== id));
  renderPhotos();
}

function viewPhoto(src) {
  document.getElementById('photoViewImg').src = src;
  openModal('photoModal');
}

function renderPhotos() {
  const grid = document.getElementById('photoGrid');
  const photos = getPhotos();

  if (!photos.length) {
    grid.innerHTML = '<p class="empty-hint">No photos yet — upload your first one together 📸</p>';
    return;
  }

  grid.innerHTML = photos.map(p => `
    <div class="photo-item" onclick="viewPhoto('${p.src.replace(/'/g, "\\'")}')">
      <img src="${p.src}" alt="${escHtml(p.name || 'Photo')}" loading="lazy" />
      <button class="photo-delete" onclick="event.stopPropagation(); deletePhoto(${p.id})">✕</button>
      <div class="photo-date">${p.date}</div>
    </div>
  `).join('');
}

/* ===== Backup: Export & Import ===== */
function exportData() {
  const data = {
    version: 1,
    name1: lsGet('name1', ''),
    name2: lsGet('name2', ''),
    metDate: lsGet('metDate', ''),
    events: getEvents(),
    anniversaries: getAnniversaries(),
    photos: getPhotos(),
  };
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `our-story-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      if (!data.version) throw new Error('Invalid backup file');
      if (data.name1) lsSet('name1', data.name1);
      if (data.name2) lsSet('name2', data.name2);
      if (data.metDate) lsSet('metDate', data.metDate);
      if (data.events) lsSet('events', JSON.stringify(data.events));
      if (data.anniversaries) lsSet('anniversaries', JSON.stringify(data.anniversaries));
      if (data.photos) savePhotos(data.photos);
      init();
      alert('✅ Data restored successfully!');
    } catch (err) {
      alert('❌ Failed to restore: invalid backup file.');
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

/* ===== Quotes ===== */
function changeQuote() {
  currentQuoteIdx = (currentQuoteIdx + 1) % QUOTES.length;
  document.getElementById('quoteText').textContent = QUOTES[currentQuoteIdx];
}

/* ===== Helpers ===== */
function pad(n) { return String(n).padStart(2, '0'); }

function formatDate(d) {
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function escHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

setInterval(loadMetDate, 60000);
setInterval(updateNextAnniversary, 60000);
