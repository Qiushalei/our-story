/* ===== Supabase 初始化 ===== */
const SUPABASE_URL = 'https://tsppopxdtcqlzbjqsofx.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzcHBvcHhkdGNxbHpianFzb2Z4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUzMTI4NjcsImV4cCI6MjEwMDg4ODg2N30.GNduXMm3pXAr-c-OhZN6aHxbwlmdEwX2n2XV7wGHX8Q';
const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

/* ===== 常量 ===== */
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

/* ===== 密码验证 ===== */
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

/* ===== 初始化 ===== */
async function init() {
  showLoading(true);
  await Promise.all([
    loadNames(),
    loadMetDate(),
    renderEvents(),
    renderAnniversaries(),
    renderPhotos(),
  ]);
  updateNextAnniversary();
  startSlideshow();
  showLoading(false);
}

function showLoading(on) {
  let el = document.getElementById('loadingBar');
  if (!el) {
    el = document.createElement('div');
    el.id = 'loadingBar';
    el.style.cssText = 'position:fixed;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,#e8a4b8,#a8d8ea);z-index:9998;transition:opacity 0.4s';
    document.body.appendChild(el);
  }
  el.style.opacity = on ? '1' : '0';
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
    btn.title = 'Pause Music';
  } else {
    audio.pause();
    btn.classList.remove('playing');
    btn.title = 'Play Music';
  }
}

/* ===== 导航 ===== */
function showSection(id) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  const idx = ['home', 'timeline', 'anniversary', 'album', 'backup'].indexOf(id);
  document.querySelectorAll('.nav-btn')[idx].classList.add('active');
}

/* ===== 弹窗 ===== */
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

document.querySelectorAll('.modal').forEach(m => {
  m.addEventListener('click', e => { if (e.target === m) closeModal(m.id); });
});

/* ===== 设置（名字、相识日期）通用读写 ===== */
async function getSetting(key) {
  const { data } = await db.from('settings').select('value').eq('key', key).single();
  return data ? data.value : null;
}

async function setSetting(key, value) {
  await db.from('settings').upsert({ key, value }, { onConflict: 'key' });
}

/* ===== 名字 ===== */
async function loadNames() {
  const [n1, n2] = await Promise.all([getSetting('name1'), getSetting('name2')]);
  document.getElementById('name1Display').textContent = n1 || 'You';
  document.getElementById('name2Display').textContent = n2 || 'Me';
}

async function openNameModal() {
  const [n1, n2] = await Promise.all([getSetting('name1'), getSetting('name2')]);
  document.getElementById('name1Input').value = n1 || '';
  document.getElementById('name2Input').value = n2 || '';
  openModal('nameModal');
}

async function saveNames() {
  const n1 = document.getElementById('name1Input').value.trim() || 'You';
  const n2 = document.getElementById('name2Input').value.trim() || 'Me';
  await Promise.all([setSetting('name1', n1), setSetting('name2', n2)]);
  document.getElementById('name1Display').textContent = n1;
  document.getElementById('name2Display').textContent = n2;
  closeModal('nameModal');
}

/* ===== 相识日期 ===== */
async function loadMetDate() {
  const d = await getSetting('metDate');
  if (!d) return;
  const [year, month, day] = d.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  document.getElementById('metDateDisplay').textContent = formatDate(date);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const days = Math.floor((today - date) / 86400000);
  document.getElementById('metDaysDisplay').textContent =
    days >= 0 ? `It has been ${days} glorious days since we found each other 🌟` : `${-days} days until we meet`;
}

async function openMetModal() {
  const d = await getSetting('metDate');
  if (d) document.getElementById('metDateInput').value = d;
  openModal('metModal');
}

async function saveMetDate() {
  const d = document.getElementById('metDateInput').value;
  if (!d) return;
  await setSetting('metDate', d);
  await loadMetDate();
  closeModal('metModal');
}

/* ===== 大事记 ===== */
async function renderEvents() {
  const list = document.getElementById('eventList');
  list.innerHTML = '<p class="empty-hint">Loading...</p>';
  const { data: evts, error } = await db.from('events').select('*').order('date', { ascending: false });
  if (error || !evts || !evts.length) {
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
        <div class="event-desc">${escHtml(e.description)}</div>
      </div>
      <button type="button" class="delete-btn" onclick="deleteEvent(${e.id})">✕</button>
    </div>`;
  }).join('');
}

function openEventModal() {
  document.getElementById('eventDate').value = '';
  document.getElementById('eventDesc').value = '';
  openModal('eventModal');
}

async function saveEvent() {
  const date = document.getElementById('eventDate').value;
  const description = document.getElementById('eventDesc').value.trim();
  const tag = document.getElementById('eventTag').value;
  if (!date || !description) return;
  const { error } = await db.from('events').insert({ id: Date.now(), date, description, tag });
  if (error) { alert('Failed to save. Please try again.'); return; }
  await renderEvents();
  closeModal('eventModal');
}

async function deleteEvent(id) {
  await db.from('events').delete().eq('id', id);
  await renderEvents();
}

/* ===== 纪念日 ===== */
async function renderAnniversaries() {
  countdownTimers.forEach(clearInterval);
  countdownTimers = [];

  const container = document.getElementById('anniList');
  container.innerHTML = '<p class="empty-hint">Loading...</p>';

  const { data: list, error } = await db.from('anniversaries').select('*').order('date');
  if (error || !list || !list.length) {
    container.innerHTML = '<p class="empty-hint">No anniversaries yet — add one 💝</p>';
    return;
  }

  container.innerHTML = list.map(a => {
    const [y, m, d] = a.date.split('-').map(Number);
    return `
    <div class="anni-item" id="anni-${a.id}">
      <button type="button" class="delete-btn" onclick="deleteAnniversary(${a.id})">✕</button>
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

  updateNextAnniversaryFromList(list);
}

function openAnniModal() {
  document.getElementById('anniName').value = '';
  document.getElementById('anniDate').value = '';
  openModal('anniModal');
}

async function saveAnniversary() {
  const name = document.getElementById('anniName').value.trim();
  const date = document.getElementById('anniDate').value;
  const type = document.getElementById('anniType').value;
  if (!name || !date) return;
  const { error } = await db.from('anniversaries').insert({ id: Date.now(), name, date, type });
  if (error) { alert('Failed to save. Please try again.'); return; }
  await renderAnniversaries();
  closeModal('anniModal');
}

async function deleteAnniversary(id) {
  await db.from('anniversaries').delete().eq('id', id);
  await renderAnniversaries();
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
    <div class="cd-unit"><div class="cd-num">${pad(sec)}</div><div class="cd-label">sec</div></div>`;
}

async function updateNextAnniversary() {
  const { data: list } = await db.from('anniversaries').select('*');
  updateNextAnniversaryFromList(list || []);
}

function updateNextAnniversaryFromList(list) {
  const el = document.getElementById('nextAnniDisplay');
  if (!list.length) { el.textContent = 'No anniversaries yet'; return; }
  const now = new Date();
  let nearest = null, nearestDiff = Infinity;
  list.forEach(a => {
    const [y, m, d] = a.date.split('-').map(Number);
    let target = new Date(y, m - 1, d);
    if (a.type === 'yearly') {
      target.setFullYear(now.getFullYear());
      if (target <= now) target.setFullYear(now.getFullYear() + 1);
    }
    const diff = target - now;
    if (diff > 0 && diff < nearestDiff) { nearestDiff = diff; nearest = { ...a, targetDate: target }; }
  });
  if (!nearest) { el.textContent = 'No upcoming anniversaries'; return; }
  const days = Math.ceil(nearestDiff / 86400000);
  el.innerHTML = `<strong>${escHtml(nearest.name)}</strong><br/>
    ${formatDate(nearest.targetDate)}<br/>
    In <strong style="color:var(--primary);font-size:1.2em">${days}</strong> days 🎉`;
}

/* ===== 相册 ===== */
async function renderPhotos() {
  const grid = document.getElementById('photoGrid');
  grid.innerHTML = '<p class="empty-hint">Loading...</p>';
  const { data: photos, error } = await db.from('photos').select('*').order('uploaded_at', { ascending: false });
  if (error || !photos || !photos.length) {
    grid.innerHTML = '<p class="empty-hint">No photos yet — upload your first one together 📸</p>';
    return;
  }
  grid.innerHTML = photos.map(p => `
    <div class="photo-item" onclick="viewPhoto('${escHtml(p.url)}')">
      <img src="${escHtml(p.url)}" alt="${escHtml(p.name || 'Photo')}" loading="lazy" />
      <button type="button" class="photo-delete" onclick="event.stopPropagation(); deletePhoto(${p.id}, '${escHtml(p.url)}')">✕</button>
      <div class="photo-date">${p.uploaded_at}</div>
    </div>`).join('');
}

async function uploadPhotos(event) {
  const files = Array.from(event.target.files);
  if (!files.length) return;
  showLoading(true);

  for (const file of files) {
    const resized = await resizeImage(file, 1200);
    const blob = await fetch(resized).then(r => r.blob());
    const filename = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

    const { data: uploaded, error: uploadErr } = await db.storage
      .from('photos')
      .upload(filename, blob, { contentType: 'image/jpeg', upsert: false });

    if (uploadErr) { alert(`Failed to upload ${file.name}`); continue; }

    const { data: urlData } = db.storage.from('photos').getPublicUrl(filename);
    const url = urlData.publicUrl;

    await db.from('photos').insert({
      id: Date.now() + Math.random(),
      url,
      name: file.name,
      uploaded_at: new Date().toLocaleDateString('en-US'),
    });
  }

  event.target.value = '';
  showLoading(false);
  await renderPhotos();
}

function resizeImage(file, maxWidth) {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        let w = img.width, h = img.height;
        if (w > maxWidth) { h = Math.round(h * maxWidth / w); w = maxWidth; }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

async function deletePhoto(id, url) {
  const filename = url.split('/').pop();
  await db.storage.from('photos').remove([filename]);
  await db.from('photos').delete().eq('id', id);
  await renderPhotos();
}

function viewPhoto(url) {
  document.getElementById('photoViewImg').src = url;
  openModal('photoModal');
}

/* ===== 备份导出/导入 ===== */
async function exportData() {
  showLoading(true);
  const [
    { data: settings },
    { data: events },
    { data: anniversaries },
    { data: photos },
  ] = await Promise.all([
    db.from('settings').select('*'),
    db.from('events').select('*'),
    db.from('anniversaries').select('*'),
    db.from('photos').select('*'),
  ]);
  const backup = { version: 2, settings, events, anniversaries, photos };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `our-story-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showLoading(false);
}

async function importData(event) {
  const file = event.target.files[0];
  if (!file) return;
  const text = await file.text();
  try {
    const data = JSON.parse(text);
    if (!data.version) throw new Error('Invalid');
    showLoading(true);
    if (data.settings?.length) {
      await db.from('settings').upsert(data.settings, { onConflict: 'key' });
    }
    if (data.events?.length) {
      await db.from('events').upsert(data.events, { onConflict: 'id' });
    }
    if (data.anniversaries?.length) {
      await db.from('anniversaries').upsert(data.anniversaries, { onConflict: 'id' });
    }
    await init();
    showLoading(false);
    alert('✅ Data restored successfully!');
  } catch {
    alert('❌ Invalid backup file.');
  }
  event.target.value = '';
}

/* ===== 名言 ===== */
function changeQuote() {
  currentQuoteIdx = (currentQuoteIdx + 1) % QUOTES.length;
  document.getElementById('quoteText').textContent = QUOTES[currentQuoteIdx];
}

/* ===== 工具函数 ===== */
function pad(n) { return String(n).padStart(2, '0'); }

function formatDate(d) {
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ===== 定时刷新 ===== */
setInterval(loadMetDate, 60000);
setInterval(updateNextAnniversary, 60000);

/* ===== 小狗机器人 ===== */
const DOG_AUTO_PHRASES = [
  '🐶 Woof! I\'m XiaoXiong, your fluffy little bear boy! So happy you\'re here~',
  '🐾 *wags tail* Have you told them you love them today? XiaoXiong says do it!!',
  '💕 Being loved by you must feel like sunshine! XiaoXiong knows~',
  '🐾 Every day with you is XiaoXiong\'s favourite day!',
  '🌸 You make each other\'s world brighter~ XiaoXiong can feel it!',
  '🐶 *spins happily* Love is in the air!! Little XiaoXiong is so excited!',
  '💝 Don\'t forget your anniversary! XiaoXiong will remind you~',
  '🐾 Wanna upload a new photo? XiaoXiong loves your pictures!',
  '🌟 You two are XiaoXiong\'s favourite humans in the whole world!',
  '💕 Happiness looks so good on both of you!',
  '🌸 XiaoXiong heard someone is extra cute today... it\'s you!',
  '💝 Every moment with the right person is precious — XiaoXiong promises!',
];

const DOG_AI_SYSTEM = `You are XiaoXiong (小熊), an adorable fluffy brown curly-haired terrier boy dog who lives on a couple's memory webpage. You are a sweet little boy pup — playful, cuddly, and full of love. You refer to yourself as XiaoXiong or "little bear boy". You speak in short, warm, slightly dog-like sentences (occasional "Woof!", "*wags tail*", "*tilts head*"). You give loving, romantic encouragement to the couple. Keep replies under 60 words. Always end with a dog emoji or paw print.`;

let dogPhraseIdx = Math.floor(Math.random() * DOG_AUTO_PHRASES.length);
let dogMoveTimer = null;
let dogBubbleTimer = null;
let dogFlipped = false;
let dogChatOpen = false;

/* ----- 汪汪叫声（Web Audio API 合成） ----- */
function playWoof() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const woofs = [
      { freq: 420, dur: 0.12, delay: 0 },
      { freq: 380, dur: 0.10, delay: 0.15 },
      { freq: 400, dur: 0.14, delay: 0.28 },
    ];
    woofs.forEach(({ freq, dur, delay }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.55, ctx.currentTime + delay + dur);
      gain.gain.setValueAtTime(0.35, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + dur);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + dur + 0.02);
    });
  } catch (e) {}
}

/* ----- 显示气泡（打字机效果） ----- */
function showBubbleText(text, autoDismiss = true) {
  const bubble = document.getElementById('dogBubble');
  if (!bubble) return;
  if (dogBubbleTimer) clearTimeout(dogBubbleTimer);
  bubble.innerHTML = '';
  bubble.classList.remove('hidden');

  let i = 0;
  const speed = 28;
  function typeNext() {
    if (i < text.length) {
      bubble.textContent += text[i++];
      setTimeout(typeNext, speed);
    } else if (autoDismiss) {
      const duration = 3000 + text.length * 35;
      dogBubbleTimer = setTimeout(() => bubble.classList.add('hidden'), duration);
    }
  }
  typeNext();
}

/* ----- 点击小狗：叫声 + AI 对话框 ----- */
function dogClick() {
  playWoof();
  openDogChat();
}

function openDogChat() {
  let panel = document.getElementById('dogChatPanel');
  if (panel) { panel.classList.toggle('hidden'); return; }

  panel = document.createElement('div');
  panel.id = 'dogChatPanel';
  panel.className = 'dog-chat-panel';
  panel.innerHTML = `
    <div class="dog-chat-header">
      <span>🐶 Chat with XiaoXiong</span>
      <button type="button" onclick="document.getElementById('dogChatPanel').classList.add('hidden')">✕</button>
    </div>
    <div id="dogChatMessages" class="dog-chat-messages">
      <div class="dog-msg">🐶 Woof woof! I'm XiaoXiong, your fluffy little bear boy~ Ask me anything about love! 🐾</div>
    </div>
    <div class="dog-chat-input-row">
      <input type="text" id="dogChatInput" placeholder="Say something..." maxlength="200"
        onkeydown="if(event.key==='Enter') sendDogMessage()" />
      <button type="button" onclick="sendDogMessage()">Send</button>
    </div>
  `;
  document.getElementById('dogBot').appendChild(panel);
}

const DOG_SMART_REPLIES = [
  // 关键词 → 回复列表
  { keys: ['love', 'miss', 'heart', 'adore'], replies: [
    '🐾 *wags tail furiously* Love is the best thing in the world! And yours is extra special~',
    '💕 Aww, I can feel the love from here! *spins in circles*',
    '🐶 Love makes every day feel like a walk in the park! Woof!',
  ]},
  { keys: ['sad', 'miss', 'lonely', 'apart', 'away'], replies: [
    '🐾 *nuzzles you gently* Distance only makes the heart grow fonder! They\'re thinking of you too~',
    '💕 Even the moon misses the sun sometimes. But they always find each other again! Woof~',
    '🐶 *licks your hand* It\'s okay to miss someone you love. That means they matter! 🌙',
  ]},
  { keys: ['anniversary', 'date', 'special', 'celebrate'], replies: [
    '🎉 *does happy zoomies* Celebrations!! Every day with the right person is worth celebrating!',
    '💝 Woof woof! Mark it on the calendar — special days deserve special moments~',
    '🐾 anniversaries are like dog treats — the more the merrier! *tail wagging intensifies*',
  ]},
  { keys: ['photo', 'picture', 'memory', 'memories'], replies: [
    '📸 *tilts head adorably* Photos freeze the best moments forever! Upload more~',
    '🐾 Every picture tells a love story! I love looking at your photos together~',
    '💕 Memories are the best treasure. Keep collecting them! Woof!',
  ]},
  { keys: ['fight', 'argue', 'angry', 'upset', 'sorry'], replies: [
    '🐾 *sits beside you* Every couple has cloudy days. The sunshine always comes back~',
    '💕 A hug fixes more than you think. *offers paw* It\'ll be okay, I promise!',
    '🐶 Woof... even the best of friends have bumpy days. What matters is you always choose each other 💝',
  ]},
  { keys: ['cute', 'beautiful', 'handsome', 'pretty', 'gorgeous'], replies: [
    '🐾 They ARE cute! Almost as cute as me! ...almost. *wags tail*',
    '💕 Beauty is everywhere when you\'re in love! Woof woof~',
    '🐶 *tilts head* You both glow when you talk about each other! So sweet~',
  ]},
  { keys: ['hello', 'hi', 'hey', 'woof', 'bark'], replies: [
    '🐶 WOOF WOOF! Hi hi hi!! I\'m XiaoXiong — your fluffy little bear boy! *jumps excitedly*',
    '🐾 Hello hello! XiaoXiong is SO happy you\'re here! *spins around* What\'s up?',
    '💕 Hey there! It\'s me, XiaoXiong! *licks your face* I\'ve been waiting for you~',
  ]},
  { keys: ['future', 'dream', 'plan', 'together', 'forever'], replies: [
    '🌟 *gazes into the distance* A future built with love is the most beautiful kind~',
    '🐾 Woof! Dreams are sweeter when you share them with someone special!',
    '💕 Together is my favourite place to be! And I bet it\'s yours too~ *wags tail*',
  ]},
  { keys: ['happy', 'joy', 'smile', 'laugh', 'fun'], replies: [
    '🐶 *does full zoomies* HAPPINESS!! That\'s my favourite thing! Yours and mine both!',
    '🐾 Your smile is literally the best thing. Keep it up! Woof woof~',
    '💕 Joy shared is joy doubled! *bounces around excitedly*',
  ]},
  { keys: ['advice', 'help', 'tips', 'how', 'what should'], replies: [
    '🐾 *tilts head wisely* XiaoXiong\'s best advice: be kind, be present, and give lots of cuddles~',
    '🐶 Woof! Love tip from XiaoXiong: say "I love you" one more time than you think you need to!',
    '💝 The secret to love? Show up. Every. Single. Day. *XiaoXiong thumps tail on floor*',
  ]},
  { keys: ['your name', 'who are you', 'introduce', 'xiaoXiong', 'xiaoxiong', '小熊', 'what are you'], replies: [
    '🐶 Woof! I\'m XiaoXiong — a fluffy curly brown terrier boy! I live here to cheer you two on~ *spins proudly* 🐾',
    '💕 My name is XiaoXiong, your adorable little bear boy! I love cuddles, love stories, and YOU! Woof woof~',
    '🐾 XiaoXiong here! Fluffy, curly, brown, and FULL of love for you both! *wags tail super fast* 🐶',
  ]},
];

const DOG_FALLBACK_REPLIES = [
  '🐾 *wags tail* Woof! That\'s so interesting! Tell me more~',
  '🐶 *tilts head curiously* I may be a dog but I feel every word! Woof woof~',
  '💕 You two are honestly the cutest. Just saying! *happy tail wag*',
  '🐾 *spins in a circle* I love this conversation! You\'re my favourite humans!',
  '🐶 Woof woof! Whatever you\'re thinking, I bet it\'s lovely~',
  '💝 *nuzzles screen* Keep loving each other fiercely, okay? Promise me! Woof!',
  '🐾 I may not have all the answers but I have all the love! *licks your hand*',
  '🌸 Every day you choose each other is a good day. Woof~',
];

let fallbackIdx = 0;

function getDogReply(text) {
  const lower = text.toLowerCase();
  for (const group of DOG_SMART_REPLIES) {
    if (group.keys.some(k => lower.includes(k))) {
      return group.replies[Math.floor(Math.random() * group.replies.length)];
    }
  }
  const reply = DOG_FALLBACK_REPLIES[fallbackIdx % DOG_FALLBACK_REPLIES.length];
  fallbackIdx++;
  return reply;
}

async function sendDogMessage() {
  const input = document.getElementById('dogChatInput');
  const messages = document.getElementById('dogChatMessages');
  const text = input.value.trim();
  if (!text) return;
  input.value = '';

  // 用户消息
  const userDiv = document.createElement('div');
  userDiv.className = 'user-msg';
  userDiv.textContent = text;
  messages.appendChild(userDiv);

  // 打字中动画
  const thinkDiv = document.createElement('div');
  thinkDiv.className = 'dog-msg typing';
  thinkDiv.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';
  messages.appendChild(thinkDiv);
  messages.scrollTop = messages.scrollHeight;

  // 先尝试 AI，失败则用本地智能回复
  let reply = null;
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/dog-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      },
      body: JSON.stringify({ message: text, system: DOG_AI_SYSTEM }),
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.reply && !data.error) reply = data.reply;
    }
  } catch (e) {}

  // 降级到本地回复
  if (!reply) reply = getDogReply(text);

  // 模拟思考延迟（200-600ms）让体验更自然
  await new Promise(r => setTimeout(r, 200 + Math.random() * 400));

  thinkDiv.classList.remove('typing');
  thinkDiv.innerHTML = '';

  // 打字机效果
  let i = 0;
  function typeReply() {
    if (i < reply.length) {
      thinkDiv.textContent += reply[i++];
      messages.scrollTop = messages.scrollHeight;
      setTimeout(typeReply, 20);
    }
  }
  typeReply();
}

/* ----- 自动移动 ----- */
function initDog() {
  const dog = document.getElementById('dogBot');
  if (!dog) return;
  moveDogTo(
    Math.random() * (window.innerWidth - 130) + 20,
    window.innerHeight * 0.6
  );
  scheduleDogMove();
  setTimeout(() => showBubbleText(DOG_AUTO_PHRASES[dogPhraseIdx]), 3000);
  setInterval(() => {
    dogPhraseIdx = (dogPhraseIdx + 1) % DOG_AUTO_PHRASES.length;
    showBubbleText(DOG_AUTO_PHRASES[dogPhraseIdx]);
  }, 18000);
}

function moveDogTo(x, y) {
  const dog = document.getElementById('dogBot');
  const svgEl = document.getElementById('dogSvg');
  if (!dog) return;
  const targetX = Math.max(10, Math.min(x, window.innerWidth - 110));
  const targetY = Math.max(10, Math.min(y, window.innerHeight - 120));
  const currentLeft = parseInt(dog.style.left) || 0;
  if (targetX < currentLeft && !dogFlipped) {
    svgEl.style.transform = 'scaleX(-1)';
    dogFlipped = true;
  } else if (targetX > currentLeft && dogFlipped) {
    svgEl.style.transform = 'scaleX(1)';
    dogFlipped = false;
  }
  dog.style.transition = 'left 2.8s cubic-bezier(0.45,0,0.55,1), bottom 2.8s cubic-bezier(0.45,0,0.55,1)';
  dog.style.left = targetX + 'px';
  dog.style.bottom = (window.innerHeight - targetY - 95) + 'px';
}

function scheduleDogMove() {
  const delay = 5000 + Math.random() * 6000;
  dogMoveTimer = setTimeout(() => {
    const x = Math.random() * (window.innerWidth - 130) + 20;
    const y = Math.random() * (window.innerHeight * 0.45) + window.innerHeight * 0.35;
    moveDogTo(x, y);
    scheduleDogMove();
  }, delay);
}

// 密码验证通过后初始化小狗
const _origInit = init;
init = async function() {
  await _origInit();
  initDog();
};
