/* ===== Supabase 初始化 ===== */
const SUPABASE_URL = 'https://tsppopxdtcqlzbjqsofx.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzcHBvcHhkdGNxbHpianFzb2Z4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUzMTI4NjcsImV4cCI6MjEwMDg4ODg2N30.GNduXMm3pXAr-c-OhZN6aHxbwlmdEwX2n2XV7wGHX8Q';
let db = null;

function getDb() {
  if (!db) {
    if (typeof supabase === 'undefined') {
      console.error('Supabase SDK not loaded');
      return null;
    }
    db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  }
  return db;
}

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
  initDog();
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
    dogGoHome();
  } else {
    audio.pause();
    btn.classList.remove('playing');
    btn.title = 'Play Music';
    dogResumeRoam();
  }
}

function dogGoHome() {
  if (dogMoveTimer) { clearTimeout(dogMoveTimer); dogMoveTimer = null; }
  const player = document.getElementById('musicPlayer');
  const svgEl = document.getElementById('dogSvg');
  const dog = document.getElementById('dogBot');
  if (!player || !dog) return;

  const rect = player.getBoundingClientRect();
  // 站在狗窝左侧
  const targetX = Math.max(10, rect.left - 100);
  const targetY = Math.max(10, window.innerHeight - rect.bottom + 10);

  dog.classList.add('at-kennel');
  dog.style.transition = 'left 1.8s cubic-bezier(0.45,0,0.55,1), bottom 1.8s cubic-bezier(0.45,0,0.55,1)';
  dog.style.left = targetX + 'px';
  dog.style.bottom = targetY + 'px';

  if (svgEl) {
    svgEl.style.transform = 'scaleX(-1)';
    dogFlipped = true;
  }

  setTimeout(() => {
    if (svgEl) svgEl.classList.add('dancing');
    showBubbleText('🎵 摇尾巴~ 小熊超喜欢这首歌！汪汪~', false);
  }, 1900);
}

function dogResumeRoam() {
  const svgEl = document.getElementById('dogSvg');
  const dog = document.getElementById('dogBot');
  if (svgEl) svgEl.classList.remove('dancing');
  if (dog) dog.classList.remove('at-kennel');
  const bubble = document.getElementById('dogBubble');
  if (bubble) bubble.classList.add('hidden');
  showBubbleText('🐾 音乐停了……小熊去到处转转~');
  scheduleDogMove();
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
  const { data } = await getDb().from('settings').select('value').eq('key', key).single();
  return data ? data.value : null;
}

async function setSetting(key, value) {
  await getDb().from('settings').upsert({ key, value }, { onConflict: 'key' });
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
  const { data: evts, error } = await getDb().from('events').select('*').order('date', { ascending: false });
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
  const { error } = await getDb().from('events').insert({ id: Date.now(), date, description, tag });
  if (error) { alert('Failed to save. Please try again.'); return; }
  await renderEvents();
  closeModal('eventModal');
}

async function deleteEvent(id) {
  await getDb().from('events').delete().eq('id', id);
  await renderEvents();
}

/* ===== 纪念日 ===== */
async function renderAnniversaries() {
  countdownTimers.forEach(clearInterval);
  countdownTimers = [];

  const container = document.getElementById('anniList');
  container.innerHTML = '<p class="empty-hint">Loading...</p>';

  const { data: list, error } = await getDb().from('anniversaries').select('*').order('date');
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
  const { error } = await getDb().from('anniversaries').insert({ id: Date.now(), name, date, type });
  if (error) { alert('Failed to save. Please try again.'); return; }
  await renderAnniversaries();
  closeModal('anniModal');
}

async function deleteAnniversary(id) {
  await getDb().from('anniversaries').delete().eq('id', id);
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
  const { data: list } = await getDb().from('anniversaries').select('*');
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
  const { data: photos, error } = await getDb().from('photos').select('*').order('uploaded_at', { ascending: false });
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

    const { data: uploaded, error: uploadErr } = await getDb().storage
      .from('photos')
      .upload(filename, blob, { contentType: 'image/jpeg', upsert: false });

    if (uploadErr) { alert(`Failed to upload ${file.name}`); continue; }

    const { data: urlData } = getDb().storage.from('photos').getPublicUrl(filename);
    const url = urlData.publicUrl;

    await getDb().from('photos').insert({
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
  await getDb().storage.from('photos').remove([filename]);
  await getDb().from('photos').delete().eq('id', id);
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
    getDb().from('settings').select('*'),
    getDb().from('events').select('*'),
    getDb().from('anniversaries').select('*'),
    getDb().from('photos').select('*'),
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
      await getDb().from('settings').upsert(data.settings, { onConflict: 'key' });
    }
    if (data.events?.length) {
      await getDb().from('events').upsert(data.events, { onConflict: 'id' });
    }
    if (data.anniversaries?.length) {
      await getDb().from('anniversaries').upsert(data.anniversaries, { onConflict: 'id' });
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
  '🐶 汪！我是小熊，你们的小卷毛男孩！好开心你来了~',
  '🐾 今天有没有跟对方说"我爱你"呀？小熊督促你去说！！',
  '💕 被你们这样爱着，一定像晒太阳一样暖呢，小熊感受到了~',
  '🐾 跟你们在一起的每一天，都是小熊最喜欢的一天！',
  '🌸 你们让彼此的世界变得更亮了呢~ 小熊都感受到啦！',
  '🐶 空气里都是爱的味道！！小熊好激动好激动！',
  '💝 纪念日要记得哦！小熊会帮你提醒的~',
  '🐾 要不要上传一张新照片？小熊最喜欢看你们的合照啦！',
  '🌟 你们是小熊全世界最喜欢的两个人！',
  '💕 幸福写在你们脸上，好好看哦！',
  '🌸 小熊听说今天有人特别可爱……就是你啦！',
  '💝 和对的人在一起的每个瞬间都很珍贵，小熊保证！',
];

const DOG_AI_SYSTEM = `你是小熊，一只住在情侣纪念网页上的可爱棕色卷毛梗犬小男孩。你活泼、爱撒娇、充满爱意。你用"小熊"称呼自己。你说话温柔、俏皮，偶尔夹杂"汪！"或动作描述（如"摇尾巴"）。请用中文回复，给这对情侣温暖浪漫的鼓励。回复不超过50字，最后带一个狗狗表情。`;

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

/* ----- 点击小狗：叫声 + 互动面板 ----- */
function dogClick() {
  playWoof();
  openInteractionPanel();
}

function openDogChat() {
  let panel = document.getElementById('dogChatPanel');
  if (panel) { panel.classList.toggle('hidden'); return; }

  panel = document.createElement('div');
  panel.id = 'dogChatPanel';
  panel.className = 'dog-chat-panel';
  panel.innerHTML = `
    <div class="dog-chat-header">
      <span>🐶 和小熊聊天</span>
      <button type="button" onclick="document.getElementById('dogChatPanel').classList.add('hidden')">✕</button>
    </div>
    <div id="dogChatMessages" class="dog-chat-messages">
      <div class="dog-msg">🐶 汪汪！我是小熊，你们的小卷毛男孩~ 有什么想说的都可以告诉我！🐾</div>
    </div>
    <div class="dog-chat-input-row">
      <input type="text" id="dogChatInput" placeholder="跟小熊说点什么..." maxlength="200"
        onkeydown="if(event.key==='Enter') sendDogMessage()" />
      <button type="button" onclick="sendDogMessage()">发送</button>
    </div>
  `;
  document.getElementById('dogBot').appendChild(panel);
}

const DOG_SMART_REPLIES = [
  { keys: ['爱', '喜欢', '爱你', '心动', 'love', 'heart', 'adore'], replies: [
    '🐾 爱是世界上最美好的事！你们的爱更是特别的那种~ 小熊摇尾巴！',
    '💕 汪！小熊都感受到爱意了，好幸福哦，转圈圈！',
    '🐶 爱让每天都像春天一样！汪汪！',
  ]},
  { keys: ['难过', '伤心', '想你', '孤独', '分开', '异地', 'sad', 'miss', 'lonely'], replies: [
    '🐾 小熊轻轻蹭蹭你~ 思念是爱的证明，对方也在想你呢！',
    '💕 就算月亮和太阳分开，也总会再相遇的。汪~',
    '🐶 想念一个爱的人，说明那个人很重要。小熊陪着你 🌙',
  ]},
  { keys: ['纪念日', '周年', '日期', '庆祝', 'anniversary', 'celebrate'], replies: [
    '🎉 要庆祝！每一天和对的人在一起都值得庆祝！小熊转圈圈！',
    '💝 汪汪！特别的日子要认真对待，小熊帮你记着~',
    '🐾 纪念日就像狗狗零食，越多越好！小熊使劲摇尾巴！',
  ]},
  { keys: ['照片', '相册', '拍照', '记忆', '回忆', 'photo', 'picture', 'memory'], replies: [
    '📸 小熊歪头~ 照片把最美的瞬间永远留住了，多上传一点嘛！',
    '🐾 每张照片都是一个爱情故事，小熊最喜欢看你们的合照！',
    '💕 回忆是最好的宝藏，要好好收集哦！汪！',
  ]},
  { keys: ['吵架', '生气', '闹别扭', '对不起', '抱歉', 'fight', 'argue', 'angry', 'sorry'], replies: [
    '🐾 小熊坐在你身边~ 每对情侣都会有阴天，阳光很快就回来啦！',
    '💕 抱一个能解决好多事的。小熊伸出爪爪，会没事的！',
    '🐶 汪…好朋友也会有磕磕碰碰，重要的是你们总选择彼此 💝',
  ]},
  { keys: ['可爱', '好看', '帅', '漂亮', 'cute', 'beautiful', 'pretty'], replies: [
    '🐾 对方确实可爱！几乎和小熊一样可爱……差一点点。摇尾巴~',
    '💕 恋爱中的人眼里到处都是美！汪汪~',
    '🐶 你们说起对方的时候眼睛都在发光，好甜哦~',
  ]},
  { keys: ['你好', '嗨', '在吗', '小熊', '汪', 'hello', 'hi', 'hey'], replies: [
    '🐶 汪汪汪！你来啦！！我是小熊，你们的小卷毛男孩！超开心！',
    '🐾 你好你好！小熊超开心你来找我玩！有什么想说的吗？',
    '💕 是你呀！小熊一直在等你呢~ 舔一口表示欢迎！',
  ]},
  { keys: ['未来', '梦想', '计划', '一起', '永远', 'future', 'dream', 'together', 'forever'], replies: [
    '🌟 用爱建造的未来是最美的那种~ 小熊遥望远方！',
    '🐾 汪！和特别的人一起做梦，梦都是甜的！',
    '💕 "在一起"是小熊最喜欢的词！你们也一样吧~ 摇尾巴！',
  ]},
  { keys: ['开心', '高兴', '快乐', '笑', '好玩', 'happy', 'joy', 'smile', 'laugh'], replies: [
    '🐶 开心！！这是小熊最爱的事！你们开心小熊也开心！转圈圈！',
    '🐾 你们的笑容是世界上最好看的东西。要保持！汪汪~',
    '💕 快乐分享了就变成两份！小熊跳起来！',
  ]},
  { keys: ['建议', '怎么办', '如何', '帮我', 'advice', 'help', 'how'], replies: [
    '🐾 小熊歪头思考~ 小熊的建议：温柔、专心、多抱抱！',
    '🐶 汪！恋爱小技巧：比你觉得需要的多说一句"我爱你"！',
    '💝 爱情的秘诀？每一天都选择出现。小熊拍爪子！',
  ]},
  { keys: ['你叫什么', '你是谁', '介绍', '小熊', 'xiaoxiong', 'who are you'], replies: [
    '🐶 汪！我是小熊，蓬松的棕色卷毛梗犬小男孩！住在这里为你们加油~ 转圈！🐾',
    '💕 我叫小熊，你们的可爱小男孩！喜欢抱抱、爱情故事，还有你！汪汪~',
    '🐾 小熊报到！蓬蓬的、卷卷的、棕棕的，满满都是爱！使劲摇尾巴 🐶',
  ]},
];

const DOG_FALLBACK_REPLIES = [
  '🐾 摇尾巴~ 好有意思！小熊想听你多说一点~',
  '🐶 小熊歪头~ 虽然是只小狗，但每句话小熊都认真感受了！汪汪~',
  '💕 你们真的是小熊见过最可爱的两个人，就这样说了！',
  '🐾 转圈圈~ 小熊超喜欢和你聊天！你是小熊最喜欢的人类！',
  '🐶 汪汪！不管你在想什么，小熊觉得一定很美好~',
  '💝 要好好相爱哦，拉钩！汪！',
  '🐾 小熊不一定什么都懂，但小熊的爱是满满的！舔一口~',
  '🌸 每一天选择彼此，就是最好的一天。汪~',
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
      signal: (typeof AbortSignal.timeout === 'function') ? AbortSignal.timeout(8000) : undefined,
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
    const audio = document.getElementById('bgMusic');
    if (!audio || audio.paused) {
      const x = Math.random() * (window.innerWidth - 130) + 20;
      const y = Math.random() * (window.innerHeight * 0.45) + window.innerHeight * 0.35;
      moveDogTo(x, y);
      scheduleDogMove();
    }
  }, delay);
}

/* ===== 互动游戏面板 ===== */
let interactionLocked = false;

function openInteractionPanel() {
  let panel = document.getElementById('dogInteractPanel');
  if (panel) { panel.classList.toggle('hidden'); return; }

  panel = document.createElement('div');
  panel.id = 'dogInteractPanel';
  panel.className = 'dog-interact-panel';
  panel.innerHTML = `
    <div class="interact-header">
      <span>🐾 和小熊玩耍！</span>
      <button type="button" onclick="document.getElementById('dogInteractPanel').classList.add('hidden')">✕</button>
    </div>
    <div class="interact-buttons">
      <button type="button" class="interact-btn" onclick="dogInteract('frisbee')">🥏 扔飞盘</button>
      <button type="button" class="interact-btn" onclick="dogInteract('bone')">🦴 喂骨头</button>
      <button type="button" class="interact-btn" onclick="dogInteract('water')">💧 喂水</button>
      <button type="button" class="interact-btn" onclick="dogInteract('pet')">🤚 摸摸小熊</button>
    </div>
    <div id="interactStatus" class="interact-status"></div>
    <button type="button" class="interact-chat-btn" onclick="document.getElementById('dogInteractPanel').classList.add('hidden'); openDogChat()">💬 和小熊聊天</button>
  `;
  document.getElementById('dogBot').appendChild(panel);
}

const INTERACT_RESPONSES = {
  frisbee: {
    messages: [
      '🥏 汪汪！！接到了！！再扔一次好不好！！',
      '🥏 小熊跑得超快的！你看到了吗！尾巴转转转！',
      '🥏 接住啦！！再来再来再来！！',
    ],
    dogAnim: 'dogRun',
    duration: 3200,
    emoji: '😆',
    prop: 'frisbee',
  },
  bone: {
    messages: [
      '🦴 骨头！！小熊最爱的！！咔嚓咔嚓好香哦！',
      '🦴 嗯嗯嗯……这是小熊吃过最好吃的骨头！！',
      '🦴 先藏起来，留着慢慢吃~ 这个很珍贵的！',
    ],
    dogAnim: 'dogRoll',
    duration: 2800,
    emoji: '😊',
    prop: 'bone',
  },
  water: {
    messages: [
      '💧 哗哗哗！小熊好渴好渴！谢谢你~',
      '💧 喝饱了！！现在小熊精力充沛！要去跑圈圈了！',
      '💧 嗯嗯好喝~ 甩甩头……哎呀溅到了！对不起！汪！',
    ],
    dogAnim: 'dogShake',
    duration: 2400,
    emoji: '😌',
    prop: 'water',
  },
  pet: {
    messages: [
      '🐾 哦……就这里……小熊要融化了~ 太舒服了 💕',
      '🐾 对对对就是这个地方！！小熊好幸福！！',
      '🤚 你摸小熊的方式是全世界最好的。小熊爱你！',
    ],
    dogAnim: 'dogRoll',
    duration: 3200,
    emoji: '❤️',
    prop: 'pet',
  },
};

const PROP_ICONS = { frisbee: '🥏', bone: '🦴', water: '🫙', pet: '🤚' };

function spawnProp(type, dog) {
  const rect = dog.getBoundingClientRect();
  const dogCX = rect.left + rect.width / 2;
  const dogCY = rect.top + rect.height / 2;

  const el = document.createElement('div');
  el.className = `prop-anim prop-${type}`;
  el.textContent = PROP_ICONS[type];
  document.body.appendChild(el);

  if (type === 'frisbee') {
    const startX = window.innerWidth * 0.15;
    const startY = window.innerHeight * 0.5;
    el.style.left = startX + 'px';
    el.style.top  = startY + 'px';
    const txMid = (dogCX - startX) * 0.5;
    const txEnd = dogCX - startX - 20;
    el.style.setProperty('--tx-mid', txMid + 'px');
    el.style.setProperty('--tx-end', txEnd + 'px');
  } else if (type === 'bone') {
    el.style.left = (dogCX - 20) + 'px';
    el.style.top  = (dogCY - 80) + 'px';
  } else if (type === 'water') {
    el.style.left = (dogCX - 20) + 'px';
    el.style.top  = (dogCY + 30) + 'px';
    el.style.fontSize = '2.8rem';
  } else if (type === 'pet') {
    el.style.left = (dogCX - 18) + 'px';
    el.style.top  = (rect.top - 20) + 'px';
  }

  setTimeout(() => el.remove(), 2000);
}

function showDogEmoji(emoji) {
  const body = document.getElementById('dogBody');
  if (!body) return;
  document.querySelectorAll('.dog-emoji-reaction').forEach(e => e.remove());
  const el = document.createElement('div');
  el.className = 'dog-emoji-reaction';
  el.textContent = emoji;
  body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

function dogInteract(type) {
  if (interactionLocked) return;
  interactionLocked = true;

  const config = INTERACT_RESPONSES[type];
  const msg = config.messages[Math.floor(Math.random() * config.messages.length)];
  const svgEl = document.getElementById('dogSvg');
  const dog = document.getElementById('dogBot');

  const panel = document.getElementById('dogInteractPanel');
  if (panel) panel.classList.add('hidden');

  playWoof();
  showBubbleText(msg, false);

  // 1. 先显示道具动画
  spawnProp(config.prop, dog);

  // 2. 短延迟后触发小狗身体反应
  setTimeout(() => {
    if (svgEl) svgEl.classList.add(config.dogAnim);
    if (config.dogAnim === 'dogRun') runAcrossScreen();
  }, 400);

  // 3. 互动结束后弹出表情包
  setTimeout(() => {
    if (svgEl) svgEl.classList.remove(config.dogAnim);
    showDogEmoji(config.emoji);
    const bubble = document.getElementById('dogBubble');
    if (bubble) bubble.classList.add('hidden');
    interactionLocked = false;
  }, config.duration);
}

function runAcrossScreen() {
  const dog = document.getElementById('dogBot');
  const svgEl = document.getElementById('dogSvg');
  if (!dog) return;

  if (dogMoveTimer) { clearTimeout(dogMoveTimer); dogMoveTimer = null; }

  const startX = parseInt(dog.style.left) || 100;
  const goRight = startX < window.innerWidth / 2;
  const endX = goRight ? window.innerWidth - 130 : 20;

  dog.style.transition = 'left 1.1s linear';
  if (svgEl) { svgEl.style.transform = goRight ? 'scaleX(1)' : 'scaleX(-1)'; dogFlipped = !goRight; }
  dog.style.left = endX + 'px';

  setTimeout(() => {
    const returnX = goRight ? 20 : window.innerWidth - 130;
    dog.style.transition = 'left 1.1s linear';
    if (svgEl) { svgEl.style.transform = goRight ? 'scaleX(-1)' : 'scaleX(1)'; dogFlipped = goRight; }
    dog.style.left = returnX + 'px';
    setTimeout(() => {
      const audio = document.getElementById('bgMusic');
      if (!audio || audio.paused) scheduleDogMove();
    }, 1200);
  }, 1150);
}

