/* ===== 常量与状态 ===== */
const PASSWORD = '040121';
const QUOTES = [
  '每一天醒来，第一件事就是感谢遇见你。',
  '爱你，是我做过最勇敢的事。',
  '愿与你共赴每一个日出日落。',
  '你是我最想分享每件小事的人。',
  '世界那么大，幸好遇见了你。',
  '因为有你，所有平凡的日子都闪闪发光。',
  '在所有相遇里，遇见你是最好的意外。',
  '你笑起来的样子，是我见过最美的风景。',
  '愿未来的每一天，都有你在身旁。',
  '和你在一起，哪里都是家。',
];

let currentQuoteIdx = 0;
let countdownTimers = [];

/* ===== 密码验证 ===== */
function checkPassword() {
  const val = document.getElementById('pwdInput').value.trim();
  if (val === PASSWORD) {
    document.getElementById('lockScreen').style.display = 'none';
    init();
  } else {
    const err = document.getElementById('pwdError');
    err.textContent = '密码错误，请重试 ✗';
    document.getElementById('pwdInput').value = '';
    setTimeout(() => { err.textContent = ''; }, 2500);
  }
}

document.getElementById('pwdInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') checkPassword();
});

/* ===== 初始化 ===== */
function init() {
  loadNames();
  loadMetDate();
  renderEvents();
  renderAnniversaries();
  renderPhotos();
  startSlideshow();
  updateNextAnniversary();
}

/* ===== 背景幻灯片 ===== */
function startSlideshow() {
  const slides = document.querySelectorAll('.slide');
  let current = 0;
  setInterval(() => {
    slides[current].classList.remove('active');
    current = (current + 1) % slides.length;
    slides[current].classList.add('active');
  }, 6000);
}

/* ===== 音乐 ===== */
function toggleMusic() {
  const audio = document.getElementById('bgMusic');
  const btn = document.getElementById('musicBtn');
  if (audio.paused) {
    audio.play().catch(() => {});
    btn.classList.add('playing');
    btn.title = '暂停音乐';
  } else {
    audio.pause();
    btn.classList.remove('playing');
    btn.title = '播放音乐';
  }
}

/* ===== 导航切换 ===== */
function showSection(id) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  const idx = ['home','timeline','anniversary','album'].indexOf(id);
  document.querySelectorAll('.nav-btn')[idx].classList.add('active');
}

/* ===== 弹窗 ===== */
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

document.querySelectorAll('.modal').forEach(m => {
  m.addEventListener('click', e => { if (e.target === m) closeModal(m.id); });
});

/* ===== 情侣名字 ===== */
function loadNames() {
  const n1 = localStorage.getItem('name1') || 'Ta';
  const n2 = localStorage.getItem('name2') || 'Ta';
  document.getElementById('name1Display').textContent = n1;
  document.getElementById('name2Display').textContent = n2;
}

function openNameModal() {
  document.getElementById('name1Input').value = localStorage.getItem('name1') || '';
  document.getElementById('name2Input').value = localStorage.getItem('name2') || '';
  openModal('nameModal');
}

function saveNames() {
  const n1 = document.getElementById('name1Input').value.trim() || 'Ta';
  const n2 = document.getElementById('name2Input').value.trim() || 'Ta';
  localStorage.setItem('name1', n1);
  localStorage.setItem('name2', n2);
  document.getElementById('name1Display').textContent = n1;
  document.getElementById('name2Display').textContent = n2;
  closeModal('nameModal');
}

/* ===== 相识日期 ===== */
function loadMetDate() {
  const d = localStorage.getItem('metDate');
  if (!d) return;
  const date = new Date(d);
  document.getElementById('metDateDisplay').textContent = formatDate(date);
  const days = Math.floor((Date.now() - date.getTime()) / 86400000);
  document.getElementById('metDaysDisplay').textContent =
    days >= 0 ? `已相识 ${days} 天 🌟` : `还有 ${-days} 天相识`;
}

function openMetModal() {
  const d = localStorage.getItem('metDate');
  if (d) document.getElementById('metDateInput').value = d;
  openModal('metModal');
}

function saveMetDate() {
  const d = document.getElementById('metDateInput').value;
  if (!d) return;
  localStorage.setItem('metDate', d);
  loadMetDate();
  closeModal('metModal');
}

/* ===== 大事记 ===== */
function getEvents() {
  return JSON.parse(localStorage.getItem('events') || '[]');
}

function saveEvents(evts) {
  localStorage.setItem('events', JSON.stringify(evts));
}

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
  const evts = getEvents().filter(e => e.id !== id);
  saveEvents(evts);
  renderEvents();
}

function renderEvents() {
  const list = document.getElementById('eventList');
  const evts = getEvents();
  if (!evts.length) {
    list.innerHTML = '<p class="empty-hint">还没有大事记，点击上方按钮添加吧 ✨</p>';
    return;
  }
  list.innerHTML = evts.map(e => `
    <div class="event-item">
      <div class="event-tag">${e.tag}</div>
      <div class="event-info">
        <div class="event-date">${formatDate(new Date(e.date))}</div>
        <div class="event-desc">${escHtml(e.desc)}</div>
      </div>
      <button class="delete-btn" onclick="deleteEvent(${e.id})">✕</button>
    </div>
  `).join('');
}

/* ===== 纪念日 ===== */
function getAnniversaries() {
  return JSON.parse(localStorage.getItem('anniversaries') || '[]');
}

function saveAnniversaries(list) {
  localStorage.setItem('anniversaries', JSON.stringify(list));
}

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
  const list = getAnniversaries().filter(a => a.id !== id);
  saveAnniversaries(list);
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
    container.innerHTML = '<p class="empty-hint">还没有纪念日，点击上方按钮添加吧 💝</p>';
    return;
  }

  container.innerHTML = list.map(a => `
    <div class="anni-item" id="anni-${a.id}">
      <button class="delete-btn" onclick="deleteAnniversary(${a.id})">✕</button>
      <div class="anni-name">💝 ${escHtml(a.name)}</div>
      <div class="anni-date">${formatDate(new Date(a.date))} · ${a.type === 'yearly' ? '每年重复' : '仅一次'}</div>
      <div class="countdown-display" id="cd-${a.id}"></div>
    </div>
  `).join('');

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
  let target = new Date(anni.date);

  if (anni.type === 'yearly') {
    // 找下一次发生的年份
    target.setFullYear(now.getFullYear());
    if (target <= now) target.setFullYear(now.getFullYear() + 1);
  }

  const diff = target.getTime() - now.getTime();

  if (diff < 0 && anni.type === 'once') {
    el.innerHTML = `<span class="cd-passed">已经过去 ${Math.abs(Math.floor(diff / 86400000))} 天</span>`;
    return;
  }

  if (diff === 0 || (diff > -1000 && diff < 1000)) {
    el.innerHTML = '<span class="cd-passed">🎉 就是今天！</span>';
    return;
  }

  const totalSec = Math.floor(diff / 1000);
  const d  = Math.floor(totalSec / 86400);
  const h  = Math.floor((totalSec % 86400) / 3600);
  const m  = Math.floor((totalSec % 3600) / 60);
  const s  = totalSec % 60;

  el.innerHTML = `
    <div class="cd-unit"><div class="cd-num">${d}</div><div class="cd-label">天</div></div>
    <div class="cd-unit"><div class="cd-num">${pad(h)}</div><div class="cd-label">时</div></div>
    <div class="cd-unit"><div class="cd-num">${pad(m)}</div><div class="cd-label">分</div></div>
    <div class="cd-unit"><div class="cd-num">${pad(s)}</div><div class="cd-label">秒</div></div>
  `;
}

function updateNextAnniversary() {
  const el = document.getElementById('nextAnniDisplay');
  const list = getAnniversaries();
  if (!list.length) { el.textContent = '暂无纪念日'; return; }

  const now = new Date();
  let nearest = null;
  let nearestDiff = Infinity;

  list.forEach(a => {
    let target = new Date(a.date);
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

  if (!nearest) { el.textContent = '暂无即将到来的纪念日'; return; }
  const days = Math.ceil(nearestDiff / 86400000);
  el.innerHTML = `<strong>${escHtml(nearest.name)}</strong><br/>
    ${formatDate(nearest.targetDate)}<br/>
    还有 <strong style="color:var(--primary);font-size:1.2em">${days}</strong> 天 🎉`;
}

/* ===== 相册 ===== */
function getPhotos() {
  return JSON.parse(localStorage.getItem('photos') || '[]');
}

function savePhotos(photos) {
  localStorage.setItem('photos', JSON.stringify(photos));
}

function uploadPhotos(event) {
  const files = Array.from(event.target.files);
  if (!files.length) return;

  let processed = 0;
  const photos = getPhotos();

  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = e => {
      photos.unshift({
        id: Date.now() + Math.random(),
        src: e.target.result,
        date: new Date().toLocaleDateString('zh-CN'),
        name: file.name,
      });
      processed++;
      if (processed === files.length) {
        // 限制最多 200 张以防 localStorage 溢出
        if (photos.length > 200) photos.splice(200);
        savePhotos(photos);
        renderPhotos();
      }
    };
    reader.readAsDataURL(file);
  });

  event.target.value = '';
}

function deletePhoto(id) {
  const photos = getPhotos().filter(p => p.id !== id);
  savePhotos(photos);
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
    grid.innerHTML = '<p class="empty-hint">还没有照片，上传你们的第一张合照吧 📸</p>';
    return;
  }

  grid.innerHTML = photos.map(p => `
    <div class="photo-item" onclick="viewPhoto('${p.src.replace(/'/g,"\\'")}')">
      <img src="${p.src}" alt="${escHtml(p.name || '照片')}" loading="lazy" />
      <button class="photo-delete" onclick="event.stopPropagation(); deletePhoto(${p.id})">✕</button>
      <div class="photo-date">${p.date}</div>
    </div>
  `).join('');
}

/* ===== 名言 ===== */
function changeQuote() {
  currentQuoteIdx = (currentQuoteIdx + 1) % QUOTES.length;
  document.getElementById('quoteText').textContent = QUOTES[currentQuoteIdx];
}

/* ===== 工具函数 ===== */
function pad(n) { return String(n).padStart(2, '0'); }

function formatDate(d) {
  return `${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日`;
}

function escHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ===== 每分钟更新相识天数 ===== */
setInterval(loadMetDate, 60000);
setInterval(updateNextAnniversary, 60000);
