import * as db from './db.js';
import { readTags, parseLRC } from './tags.js';
import { FFmpeg } from './ffmpeg.js';

/* =========================================================
   SP03 – Music Player
   Library in the browser (IndexedDB), plays in the background
   with lock-screen controls, effects through Web Audio.
   ========================================================= */

/* ---------------- Language ---------------- */
const I18N = {
  en: {
    tagline: 'Music Player', install: 'Install', songs: 'Songs', albums: 'Albums', artists: 'Artists', playlists: 'Playlists', genres: 'Genres', folders: 'Folders',
    eq: 'Equalizer', lyrics: 'Lyrics', queue: 'Queue', sleep: 'Sleep', viz: 'Visualizer', search: 'Search songs, artists, albums',
    heroTitle: 'All your music,<br><span>one player</span>', heroSub: 'Plays in the background with lock-screen controls. Nothing is uploaded.',
    addMusic: 'Add music', addFolder: 'Add a folder (PC)', bgTip: 'Tip: install the app so music keeps playing when the screen is off.',
    b1: '🎧 Background play', b2: '🎚 10-band EQ', b3: '🔊 Bass + 3D', b4: '📃 Lyrics', b5: '🔀 Crossfade', b6: '⏾ Sleep timer', b7: '📂 Playlists', b8: '🎵 Any format',
    found: 'songs found', saveQ: 'Save them to your library? Saved songs stay in the app even after closing.', saveLib: '💾 Save to library', justPlay: '▶ Just play now',
    saveNote: 'Uses the same space on your phone as the songs.', reading: 'Reading songs…', saved: 'saved to library', play: 'Play',
    playAll: 'Play', shuffleAll: 'Shuffle', sortTitle: 'A–Z', sortArtist: 'Artist', sortAdded: 'Newest', sortPlays: 'Most played',
    unknownArtist: 'Unknown artist', unknownAlbum: 'Unknown album', unknownGenre: 'Unknown', device: 'This device',
    favs: 'Favourites', recent: 'Recently played', most: 'Most played', newest: 'Recently added', newPl: '➕ New playlist', plName: 'Playlist name',
    create: 'Create', rename: 'Rename', delete: 'Delete', deleted: 'Deleted', addedTo: 'Added to', empty: 'Nothing here yet',
    playNext: 'Play next', addQueue: 'Add to queue', addPl: 'Add to playlist', fav: 'Favourite', unfav: 'Remove favourite', goAlbum: 'Go to album', goArtist: 'Go to artist',
    info: 'Song info', share: 'Share', removeLib: 'Remove from library', removed: 'Removed', queued: 'Added to queue', next: 'Will play next',
    nowPlaying: 'Now playing', from: 'Playing from', clearQ: 'Clear queue', upNext: 'Up next',
    fxOn: 'Sound effects', presets: 'Presets', bass: 'Bass boost', surround: '3D surround', balance: 'Balance', boost: 'Volume boost', leveler: 'Volume leveler (same loudness)',
    speed: 'Speed', pitch: 'Pitch changes with speed', crossfade: 'Crossfade', sec: 's', off: 'Off', abRepeat: 'A-B repeat', abA: 'Set A', abB: 'Set B', abClear: 'Clear A-B',
    sleepEnd: 'End of song', min: 'min', sleepSet: 'Music will stop in', sleepDone: 'Sleep timer: music stopped',
    noLyrics: 'No lyrics for this song.', addLrc: '📄 Add lyrics file (.lrc / .txt)', lyricsAdded: 'Lyrics added',
    settings: 'Settings', language: 'Language', resume: 'Continue last song when opening', storage: 'Storage used', folderRescan: '🔄 Re-scan PC folders',
    clearLib: '🗑 Clear whole library', clearSure: 'Tap again to delete all songs', cleared: 'Library cleared',
    needPerm: 'Allow SP03 to read this folder again', allow: 'Allow', converting: 'Making this song playable…', convertNote: 'This format is converted on your device once.',
    errPlay: 'Could not play this song.', errEngine: 'Converter could not load. Connect to the internet once and try again.',
    file: 'File', size: 'Size', duration: 'Duration', format: 'Format', year: 'Year', track: 'Track', plays: 'Plays', path: 'Folder', where: 'Stored',
    whereSaved: 'In app library', whereFolder: 'PC folder (linked)', whereSession: 'Only this session',
    noResults: 'No results', lrcMatched: 'lyrics files matched', resumed: 'Continue', of: 'of',
  },
  hi: {
    tagline: 'म्यूज़िक प्लेयर', install: 'इंस्टॉल', songs: 'गाने', albums: 'एल्बम', artists: 'कलाकार', playlists: 'प्लेलिस्ट', genres: 'शैली', folders: 'फ़ोल्डर',
    eq: 'इक्वलाइज़र', lyrics: 'बोल', queue: 'कतार', sleep: 'स्लीप', viz: 'विज़ुअलाइज़र', search: 'गाना, कलाकार, एल्बम खोजें',
    heroTitle: 'आपका सारा संगीत,<br><span>एक प्लेयर</span>', heroSub: 'स्क्रीन बंद होने पर भी चलता है, लॉक स्क्रीन पर कंट्रोल। कुछ भी अपलोड नहीं होता।',
    addMusic: 'गाने जोड़ें', addFolder: 'फ़ोल्डर जोड़ें (PC)', bgTip: 'सुझाव: ऐप इंस्टॉल करें ताकि स्क्रीन बंद होने पर भी गाना चलता रहे।',
    b1: '🎧 बैकग्राउंड प्ले', b2: '🎚 10-बैंड EQ', b3: '🔊 बास + 3D', b4: '📃 बोल (Lyrics)', b5: '🔀 क्रॉसफ़ेड', b6: '⏾ स्लीप टाइमर', b7: '📂 प्लेलिस्ट', b8: '🎵 हर फ़ॉर्मेट',
    found: 'गाने मिले', saveQ: 'इन्हें लाइब्रेरी में सेव करें? सेव किए गाने ऐप बंद करने के बाद भी रहेंगे।', saveLib: '💾 लाइब्रेरी में सेव करें', justPlay: '▶ अभी बस चलाएँ',
    saveNote: 'फ़ोन में गानों जितनी ही जगह लगेगी।', reading: 'गाने पढ़े जा रहे हैं…', saved: 'लाइब्रेरी में सेव', play: 'चलाएँ',
    playAll: 'चलाएँ', shuffleAll: 'शफ़ल', sortTitle: 'A–Z', sortArtist: 'कलाकार', sortAdded: 'नए', sortPlays: 'ज़्यादा सुने',
    unknownArtist: 'अज्ञात कलाकार', unknownAlbum: 'अज्ञात एल्बम', unknownGenre: 'अज्ञात', device: 'यह डिवाइस',
    favs: 'पसंदीदा', recent: 'हाल में सुने', most: 'सबसे ज़्यादा सुने', newest: 'हाल में जोड़े', newPl: '➕ नई प्लेलिस्ट', plName: 'प्लेलिस्ट का नाम',
    create: 'बनाएँ', rename: 'नाम बदलें', delete: 'हटाएँ', deleted: 'हटा दिया', addedTo: 'इसमें जोड़ा', empty: 'अभी यहाँ कुछ नहीं है',
    playNext: 'इसके बाद चलाएँ', addQueue: 'कतार में जोड़ें', addPl: 'प्लेलिस्ट में जोड़ें', fav: 'पसंदीदा', unfav: 'पसंदीदा से हटाएँ', goAlbum: 'एल्बम पर जाएँ', goArtist: 'कलाकार पर जाएँ',
    info: 'गाने की जानकारी', share: 'शेयर', removeLib: 'लाइब्रेरी से हटाएँ', removed: 'हटा दिया', queued: 'कतार में जोड़ा', next: 'अगला यही चलेगा',
    nowPlaying: 'अभी चल रहा', from: 'यहाँ से चल रहा', clearQ: 'कतार खाली करें', upNext: 'आगे',
    fxOn: 'साउंड इफ़ेक्ट', presets: 'प्रीसेट', bass: 'बास बूस्ट', surround: '3D सराउंड', balance: 'बैलेंस', boost: 'आवाज़ बूस्ट', leveler: 'आवाज़ बराबर (सब गाने एक जैसी आवाज़)',
    speed: 'स्पीड', pitch: 'स्पीड के साथ सुर भी बदले', crossfade: 'क्रॉसफ़ेड', sec: 'से.', off: 'बंद', abRepeat: 'A-B रिपीट', abA: 'A सेट', abB: 'B सेट', abClear: 'A-B हटाएँ',
    sleepEnd: 'गाना खत्म होने पर', min: 'मिनट', sleepSet: 'संगीत रुकेगा', sleepDone: 'स्लीप टाइमर: संगीत रोक दिया',
    noLyrics: 'इस गाने के बोल नहीं हैं।', addLrc: '📄 बोल की फ़ाइल लगाएँ (.lrc / .txt)', lyricsAdded: 'बोल लग गए',
    settings: 'सेटिंग', language: 'भाषा', resume: 'खोलने पर पिछला गाना जारी रखें', storage: 'जगह इस्तेमाल', folderRescan: '🔄 PC फ़ोल्डर दोबारा पढ़ें',
    clearLib: '🗑 पूरी लाइब्रेरी हटाएँ', clearSure: 'सब गाने हटाने के लिए दोबारा दबाएँ', cleared: 'लाइब्रेरी खाली',
    needPerm: 'SP03 को यह फ़ोल्डर दोबारा पढ़ने दें', allow: 'अनुमति दें', converting: 'गाना चलने लायक बनाया जा रहा है…', convertNote: 'यह फ़ॉर्मेट एक बार आपके डिवाइस पर बदला जाता है।',
    errPlay: 'यह गाना नहीं चल पाया।', errEngine: 'कन्वर्टर लोड नहीं हुआ। एक बार इंटरनेट चालू करके दोबारा करें।',
    file: 'फ़ाइल', size: 'साइज़', duration: 'समय', format: 'फ़ॉर्मेट', year: 'साल', track: 'ट्रैक', plays: 'कितनी बार सुना', path: 'फ़ोल्डर', where: 'कहाँ रखा',
    whereSaved: 'ऐप लाइब्रेरी में', whereFolder: 'PC फ़ोल्डर (जुड़ा हुआ)', whereSession: 'सिर्फ़ इस बार',
    noResults: 'कुछ नहीं मिला', lrcMatched: 'बोल फ़ाइलें मिलीं', resumed: 'जारी रखें', of: 'में से',
  },
};
const store = {
  get(k, d) { try { const v = localStorage.getItem('sp03-' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('sp03-' + k, JSON.stringify(v)); } catch {} },
};
const DEF = { lang: 'hi', shuffle: false, repeat: 'off', crossfade: 0, speed: 1, pitch: false, fx: true, eq: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], bass: 0, width: 1, balance: 0, boost: 1, leveler: false, viz: false, sort: 'title', resume: true };
const S = Object.assign({}, DEF, store.get('settings', {}));
const saveS = () => store.set('settings', S);
const t = (k) => I18N[S.lang][k] ?? I18N.en[k] ?? k;
const $ = (s) => document.querySelector(s);
function applyI18n() {
  document.documentElement.lang = S.lang;
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  $('#search').placeholder = t('search');
}

/* ---------------- Helpers ---------------- */
const esc = (x) => String(x ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = (s) => { if (!isFinite(s) || s < 0) s = 0; const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = Math.floor(s % 60); return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(x).padStart(2, '0'); };
const fmtSize = (b) => b >= 1e9 ? (b / 1e9).toFixed(2) + ' GB' : b >= 1e6 ? (b / 1e6).toFixed(1) + ' MB' : Math.round(b / 1e3) + ' KB';
const extOf = (n) => { const m = /\.([a-z0-9]{2,5})$/i.exec(n || ''); return m ? m[1].toLowerCase() : ''; };
const baseOf = (n) => (n || '').replace(/\.[^.]+$/, '');
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const AUDIO_EXT = /^(mp3|m4a|m4b|aac|flac|wav|ogg|oga|opus|wma|amr|ac3|ape|aiff|aif|mka|wv|mpc|3gp|webm|caf|dsf|alac|mp2)$/;
const isAudio = (f) => /^audio\//.test(f.type) || AUDIO_EXT.test(extOf(f.name));
const isLyricFile = (f) => /^(lrc|txt)$/.test(extOf(f.name));
function hashId(f) {
  let h = 0x811c9dc5; const s = `${f.name}|${f.size}|${f.lastModified || 0}`;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return 't' + (h >>> 0).toString(36) + f.size.toString(36);
}
function toast(msg, ms = 2600, btn, onBtn) {
  const el = $('#toast');
  el.innerHTML = `<span>${esc(msg)}</span>` + (btn ? `<button>${esc(btn)}</button>` : '');
  if (btn) el.querySelector('button').onclick = () => { el.classList.add('hidden'); onBtn(); };
  el.classList.remove('hidden'); clearTimeout(toast._t); toast._t = setTimeout(() => el.classList.add('hidden'), ms);
}
function busy(on, title, sub) { $('#busy').classList.toggle('hidden', !on); if (title != null) $('#busyT').textContent = title; $('#busyS').textContent = sub || ''; }
const shuffleArr = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const ICON = {
  play: 'M8 5v14l11-7z', pause: 'M6 19h4V5H6v14zm8-14v14h4V5h-4z', more: 'M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z',
  back: 'M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z',
};
const svg = (p, st = '') => `<svg class="i" viewBox="0 0 24 24" ${st}><path d="${p}"/></svg>`;

/* ---------------- Library state ---------------- */
const lib = new Map();          // id -> track
const session = new Map();      // id -> File (not saved)
const sessionArt = new Map();   // id -> Blob
let playlists = [];

async function loadLibrary() {
  try {
    for (const tr of await db.all('tracks')) lib.set(tr.id, tr);
    playlists = (await db.all('playlists')).sort((a, b) => a.created - b.created);
  } catch (e) { console.warn('library', e); }
}
const persist = (tr) => { if (tr.source !== 'session') db.put('tracks', tr).catch(() => {}); };
const allTracks = () => [...lib.values()];

/* ---------------- Cover art ---------------- */
const artURLs = new Map();
async function artURL(id) {
  if (artURLs.has(id)) return artURLs.get(id);
  const tr = lib.get(id); if (!tr || !tr.hasArt) { artURLs.set(id, null); return null; }
  let b = sessionArt.get(id);
  if (!b) try { b = await db.get('art', id); } catch {}
  const u = b ? URL.createObjectURL(b) : null; artURLs.set(id, u); return u;
}
const artIO = new IntersectionObserver((ents) => {
  for (const e of ents) {
    if (!e.isIntersecting) continue;
    artIO.unobserve(e.target);
    const id = e.target.dataset.art;
    artURL(id).then((u) => { if (u) { e.target.style.backgroundImage = `url("${u}")`; e.target.textContent = ''; } });
  }
}, { rootMargin: '200px' });
function hookArt(root) { root.querySelectorAll('[data-art]').forEach((el) => artIO.observe(el)); }
const firstArtId = (ids) => ids.find((id) => lib.get(id)?.hasArt) || ids[0];

/* ---------------- Import ---------------- */
async function measureDuration(blob) {
  return new Promise((res) => {
    const a = new Audio(); const u = URL.createObjectURL(blob); let done = false;
    const fin = (d) => { if (done) return; done = true; URL.revokeObjectURL(u); a.removeAttribute('src'); res(isFinite(d) ? d : 0); };
    a.preload = 'metadata'; a.onloadedmetadata = () => fin(a.duration); a.onerror = () => fin(0); setTimeout(() => fin(0), 4000); a.src = u;
  });
}
function askImport(files) {
  files = [...(files || [])];
  const audio = files.filter(isAudio), lrc = files.filter(isLyricFile);
  if (!audio.length && lrc.length) { matchLyrics(lrc); return; }
  if (!audio.length) return;
  openSheet(`🎵 ${audio.length} ${t('found')}`, `
    <p class="info" style="margin:0 2px 12px">${esc(t('saveQ'))}</p>
    <button class="btn primary" data-a="save">${esc(t('saveLib'))}</button>
    <p class="info" style="text-align:center;font-size:12px">${esc(t('saveNote'))}</p>
    <button class="btn ghost" data-a="play">${esc(t('justPlay'))}</button>`, (s) => {
    s.querySelector('[data-a=save]').onclick = () => { closeSheet(); doImport(audio, lrc, 'saved'); };
    s.querySelector('[data-a=play]').onclick = () => { closeSheet(); doImport(audio, lrc, 'session', true); };
  });
}
async function doImport(files, lrcFiles, source, playNow) {
  const lrcMap = new Map(); for (const f of lrcFiles) lrcMap.set(baseOf(f.name).toLowerCase(), f);
  const ids = []; let n = 0;
  if (source === 'saved') navigator.storage?.persist?.().catch(() => {});
  busy(true, t('reading'), `0 / ${files.length}`);
  for (const f of files) {
    n++; if (n % 3 === 0 || n === files.length) busy(true, t('reading'), `${n} / ${files.length}`);
    try { ids.push(await addOne(f, source, lrcMap)); } catch (e) { console.warn('import', f.name, e); }
  }
  busy(false);
  render();
  if (playNow) playList(ids, 0);
  else if (source === 'saved') toast(`✅ ${ids.length} ${t('saved')}`, 5000, t('play'), () => playList(ids, 0));
}
async function addOne(f, source, lrcMap, handle, folder) {
  const id = hashId(f);
  const existing = lib.get(id);
  if (existing && (existing.source !== 'session' || source === 'session')) { if (existing.source === 'session') session.set(id, f); return id; }
  const tags = await readTags(f);
  const tr = {
    id, name: f.name, title: tags.title || baseOf(f.name), artist: tags.artist || tags.albumArtist || '', album: tags.album || '',
    albumArtist: tags.albumArtist || '', genre: tags.genre || '', year: tags.year || '', trackNo: tags.track || 0,
    duration: tags.duration || 0, size: f.size, type: f.type || '', folder: folder || (f.webkitRelativePath ? f.webkitRelativePath.split('/').slice(0, -1).join('/') : ''),
    source, hasArt: !!tags.picture, lyrics: tags.lyrics || '', fav: false, plays: 0, lastPlayed: 0, addedAt: Date.now(), converted: false,
  };
  const l = lrcMap?.get(baseOf(f.name).toLowerCase()); if (l) tr.lyrics = await l.text();
  if (!tr.duration) tr.duration = await measureDuration(f);
  if (handle) tr.handle = handle;
  if (source === 'saved') await db.put('blobs', f, id);
  if (tags.picture) { if (source === 'session') sessionArt.set(id, tags.picture); else await db.put('art', tags.picture, id); }
  if (source === 'session') session.set(id, f); else await db.put('tracks', tr);
  lib.set(id, tr);
  return id;
}
async function matchLyrics(files) {
  let n = 0;
  const byName = new Map(allTracks().map((tr) => [baseOf(tr.name).toLowerCase(), tr]));
  for (const f of files) {
    const tr = byName.get(baseOf(f.name).toLowerCase()); if (!tr) continue;
    tr.lyrics = await f.text(); persist(tr); n++;
  }
  toast(`📃 ${n} ${t('lrcMatched')}`);
  if (curTrack()) renderLyrics(true);
}

/* PC folders (Chrome/Edge desktop) */
async function addFolder() {
  try {
    const dir = await window.showDirectoryPicker({ id: 'sp03-music', mode: 'read' });
    const folders = (await db.get('kv', 'folders')) || [];
    if (!folders.some((h) => h.name === dir.name)) { folders.push(dir); await db.put('kv', folders, 'folders'); }
    await scanFolder(dir);
  } catch (e) { if (e?.name !== 'AbortError') console.warn(e); }
}
async function scanFolder(dir) {
  const audio = [], lrc = new Map();
  async function walk(d, path, depth) {
    for await (const h of d.values()) {
      if (h.kind === 'directory' && depth < 6) await walk(h, path ? path + '/' + h.name : h.name, depth + 1);
      else if (h.kind === 'file') {
        const e = extOf(h.name);
        if (AUDIO_EXT.test(e)) audio.push({ h, path }); else if (e === 'lrc') lrc.set(baseOf(h.name).toLowerCase(), await h.getFile());
      }
    }
  }
  busy(true, t('reading'), dir.name);
  await walk(dir, dir.name, 0);
  let n = 0;
  for (const { h, path } of audio) {
    n++; if (n % 5 === 0) busy(true, t('reading'), `${n} / ${audio.length}`);
    try { await addOne(await h.getFile(), 'folder', lrc, h, path); } catch (e) { console.warn(e); }
  }
  busy(false); render();
  toast(`✅ ${audio.length} ${t('saved')}`);
}
async function rescanFolders() {
  const folders = (await db.get('kv', 'folders')) || [];
  for (const d of folders) {
    try { if ((await d.queryPermission({ mode: 'read' })) !== 'granted' && (await d.requestPermission({ mode: 'read' })) !== 'granted') continue; await scanFolder(d); } catch {}
  }
}

/* ---------------- Getting the audio data ---------------- */
async function getBlob(tr) {
  if (tr.source === 'session') return session.get(tr.id);
  if (tr.converted) { const c = await db.get('blobs', tr.id + '#c'); if (c) return c; }
  if (tr.source === 'saved') return db.get('blobs', tr.id);
  if (tr.source === 'folder') {
    let p = await tr.handle.queryPermission({ mode: 'read' });
    if (p !== 'granted') { try { p = await tr.handle.requestPermission({ mode: 'read' }); } catch { p = 'denied'; } }
    if (p !== 'granted') throw new Error('perm');
    return tr.handle.getFile();
  }
  return null;
}

/* ---------------- Audio engine ---------------- */
const A = [$('#a1'), $('#a2')];
let ai = 0;
const cur = () => A[ai], oth = () => A[1 - ai];
const urls = [null, null];
let ctx = null, elGains = [], N = {};
const EQF = [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
const PRESETS = {
  Normal: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], Bass: [6, 5, 4, 2, 0, 0, 0, 0, 0, 0], Bollywood: [4, 3, 1, 0, 1, 2, 2, 1, 2, 3], Pop: [-1, 1, 3, 4, 3, 0, -1, -1, 0, 1],
  Rock: [4, 3, 2, 0, -1, -1, 0, 2, 3, 4], Classical: [4, 3, 2, 1, 0, 0, 0, 1, 2, 3], Jazz: [3, 2, 1, 2, -1, -1, 0, 1, 2, 3], Vocal: [-2, -2, -1, 1, 3, 4, 3, 1, 0, -1],
  'Hip-Hop': [5, 4, 1, 2, -1, -1, 1, 0, 2, 3], Electronic: [5, 4, 1, 0, -2, 1, 0, 2, 4, 5], Treble: [-2, -2, -1, 0, 0, 1, 3, 5, 6, 6], Headphones: [3, 2, 1, 0, 0, 0, 1, 2, 3, 3],
};
function ensureGraph() {
  if (ctx) return true;
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: 'playback' });
    N.input = ctx.createGain(); N.input.channelCount = 2; N.input.channelCountMode = 'explicit'; N.input.channelInterpretation = 'speakers';
    elGains = A.map((el) => { const s = ctx.createMediaElementSource(el); const g = ctx.createGain(); s.connect(g); g.connect(N.input); return g; });
    N.bass = ctx.createBiquadFilter(); N.bass.type = 'lowshelf'; N.bass.frequency.value = 90;
    N.eq = EQF.map((f, i) => { const b = ctx.createBiquadFilter(); b.type = i === 0 ? 'lowshelf' : i === 9 ? 'highshelf' : 'peaking'; b.frequency.value = f; b.Q.value = 1.2; return b; });
    // 3D / stereo width: L' = aL + bR, R' = aR + bL
    N.split = ctx.createChannelSplitter(2); N.merge = ctx.createChannelMerger(2);
    N.gLL = ctx.createGain(); N.gLR = ctx.createGain(); N.gRR = ctx.createGain(); N.gRL = ctx.createGain();
    N.split.connect(N.gLL, 0); N.split.connect(N.gLR, 0); N.split.connect(N.gRR, 1); N.split.connect(N.gRL, 1);
    N.gLL.connect(N.merge, 0, 0); N.gRL.connect(N.merge, 0, 0); N.gRR.connect(N.merge, 0, 1); N.gLR.connect(N.merge, 0, 1);
    N.pan = ctx.createStereoPanner();
    N.comp = ctx.createDynamicsCompressor(); Object.assign(N.comp, {}); N.comp.threshold.value = -26; N.comp.knee.value = 24; N.comp.ratio.value = 4; N.comp.attack.value = 0.005; N.comp.release.value = 0.3;
    N.makeup = ctx.createGain(); N.makeup.gain.value = 1.6;
    N.master = ctx.createGain(); N.fade = ctx.createGain();
    N.an = ctx.createAnalyser(); N.an.fftSize = 256; N.an.smoothingTimeConstant = 0.8;
    let node = N.input; node.connect(N.bass); node = N.bass;
    for (const b of N.eq) { node.connect(b); node = b; }
    node.connect(N.split); N.merge.connect(N.pan);
    N.comp.connect(N.makeup);
    N.master.connect(N.fade); N.fade.connect(N.an); N.an.connect(ctx.destination);
    wireLeveler(); applyFx();
    return true;
  } catch (e) { console.warn('audio graph', e); ctx = null; return false; }
}
function wireLeveler() {
  if (!ctx) return;
  try { N.pan.disconnect(); N.makeup.disconnect(); } catch {}
  if (S.fx && S.leveler) { N.pan.connect(N.comp); N.makeup.connect(N.master); } else N.pan.connect(N.master);
}
function applyFx() {
  saveS();
  if (!ctx) { A.forEach((el) => { el.volume = 1; }); return; }
  const on = S.fx;
  N.bass.gain.value = on ? S.bass : 0;
  N.eq.forEach((b, i) => { b.gain.value = on ? S.eq[i] : 0; });
  const w = on ? S.width : 1, a = (1 + w) / 2, b = (1 - w) / 2;
  N.gLL.gain.value = a; N.gRR.gain.value = a; N.gLR.gain.value = b; N.gRL.gain.value = b;
  N.pan.pan.value = on ? S.balance : 0;
  N.master.gain.value = on ? S.boost : 1;
  wireLeveler();
}
const elVol = (k, v) => { if (ctx) elGains[k].gain.value = v; else A[k].volume = clamp(v, 0, 1); };
function rampEl(k, from, to, secs) {
  if (ctx) { const g = elGains[k].gain; const now = ctx.currentTime; g.cancelScheduledValues(now); g.setValueAtTime(from, now); g.linearRampToValueAtTime(to, now + secs); return; }
  const el = A[k], t0 = performance.now();
  clearInterval(el._ramp);
  el._ramp = setInterval(() => { const p = Math.min(1, (performance.now() - t0) / (secs * 1000)); el.volume = clamp(from + (to - from) * p, 0, 1); if (p >= 1) clearInterval(el._ramp); }, 50);
}
function setSrc(k, blob) {
  if (urls[k]) URL.revokeObjectURL(urls[k]);
  urls[k] = URL.createObjectURL(blob);
  A[k].src = urls[k];
  A[k].playbackRate = S.speed; A[k].preservesPitch = !S.pitch;
}

/* ---------------- Queue & playback ---------------- */
let queue = [], qi = -1, unshuffled = null, fromLabel = '';
let loadTok = 0, fading = false, counted = false, prepared = null, pendingResume = null;
const curId = () => queue[qi];
const curTrack = () => lib.get(curId());
function saveQueue() {
  const keep = queue.filter((id) => lib.get(id)?.source !== 'session');
  const cid = curId();
  store.set('last', { queue: keep, qi: Math.max(0, keep.indexOf(cid)), pos: cur().currentTime || 0, from: fromLabel });
}
function nextIndex(auto) {
  if (!queue.length) return null;
  if (qi + 1 < queue.length) return qi + 1;
  return S.repeat === 'all' || !auto ? 0 : null;
}
function playList(ids, start = 0, label = '') {
  ids = ids.filter((id) => lib.has(id)); if (!ids.length) return;
  fromLabel = label;
  if (S.shuffle) { const first = ids[start]; const rest = ids.filter((_, i) => i !== start); unshuffled = ids.slice(); queue = [first, ...shuffleArr(rest)]; playAt(0); }
  else { unshuffled = null; queue = ids.slice(); playAt(start); }
}
async function playAt(i, opt = {}) {
  const { fade = false, startAt = 0, autoplay = true } = opt;
  if (i == null || i < 0 || i >= queue.length) return;
  const tr = lib.get(queue[i]); if (!tr) return;
  const tok = ++loadTok;
  pendingResume = null; prepared = null;
  let blob;
  try { blob = await getBlob(tr); }
  catch (e) {
    fading = false;
    if (e.message === 'perm') toast(t('needPerm'), 8000, t('allow'), () => playAt(i, opt));
    else toast(t('errPlay'));
    return;
  }
  if (tok !== loadTok || !blob) { if (tok === loadTok) fading = false; return; }
  if (autoplay) { ensureGraph(); ctx?.resume?.(); }
  const doFade = fade && S.crossfade > 0 && !cur().paused;
  if (!doFade) fading = false;
  const k = doFade ? 1 - ai : ai, oldK = 1 - k;
  if (!doFade) { A[oldK].pause(); clearInterval(A[oldK]._ramp); }
  qi = i; counted = false; ab = { a: null, b: null }; renderAB();
  setSrc(k, blob);
  if (startAt) A[k].addEventListener('loadedmetadata', () => { A[k].currentTime = startAt; }, { once: true });
  if (doFade) { elVol(k, 0); } else elVol(k, 1);
  if (autoplay) {
    try { await A[k].play(); }
    catch (err) { if (err.name === 'NotSupportedError') { convertAndPlay(tr, i); return; } if (err.name !== 'AbortError') toast(t('errPlay')); }
  }
  if (doFade) {
    fading = true;
    rampEl(k, 0, 1, S.crossfade); rampEl(oldK, 1, 0, S.crossfade);
    setTimeout(() => { A[oldK].pause(); elVol(oldK, 1); fading = false; }, S.crossfade * 1000 + 80);
  }
  ai = k;
  onTrackChange(tr);
  saveQueue();
}
function togglePlay() {
  if (!queue.length) { const all = sortedSongs(); if (all.length) playList(all.map((x) => x.id), 0); return; }
  const el = cur();
  if (!el.src || pendingResume) { playAt(qi, { startAt: pendingResume?.pos || 0 }); return; }
  if (el.paused) { ensureGraph(); ctx?.resume?.(); el.play().catch(() => {}); } else el.pause();
}
function next(auto = false, fade = false) {
  const n = nextIndex(auto);
  if (n == null) { cur().pause(); return; }
  playAt(n, { fade });
}
function prev() {
  if (cur().currentTime > 3) { cur().currentTime = 0; return; }
  playAt(qi > 0 ? qi - 1 : (S.repeat === 'all' ? queue.length - 1 : 0));
}
function setShuffle(on) {
  S.shuffle = on; saveS();
  const id = curId();
  if (on && queue.length) { unshuffled = queue.slice(); const rest = queue.filter((x) => x !== id); queue = id ? [id, ...shuffleArr(rest)] : shuffleArr(rest); qi = id ? 0 : -1; }
  else if (!on && unshuffled) { queue = unshuffled; unshuffled = null; qi = Math.max(0, queue.indexOf(id)); }
  updateButtons(); saveQueue();
}
function cycleRepeat() { S.repeat = { off: 'all', all: 'one', one: 'off' }[S.repeat]; saveS(); updateButtons(); }
function enqueue(id, nextUp) {
  if (!queue.length) { playList([id], 0); return; }
  const pos = nextUp ? qi + 1 : queue.length;
  queue.splice(pos, 0, id); if (unshuffled) unshuffled.push(id);
  toast(nextUp ? t('next') : t('queued')); saveQueue();
}

// Events on both audio elements (only the active one drives the UI)
A.forEach((el, k) => {
  el.addEventListener('timeupdate', () => { if (k === ai) onTime(); });
  el.addEventListener('play', () => { if (k === ai) updatePlayState(); });
  el.addEventListener('pause', () => { if (k === ai) { updatePlayState(); saveQueue(); } });
  el.addEventListener('ended', () => { if (k === ai) onEnded(); });
  el.addEventListener('error', () => {
    if (k !== ai || !el.src) return;
    const tr = curTrack(); if (tr && !tr.converted && el.error && (el.error.code === 4 || el.error.code === 3)) convertAndPlay(tr, qi);
  });
});
function onEnded() {
  const tr = curTrack();
  if (sleepEnd) { sleepEnd = false; toast(t('sleepDone')); updateButtons(); return; }
  if (S.repeat === 'one') { cur().currentTime = 0; cur().play(); return; }
  const n = nextIndex(true);
  if (n == null) { updatePlayState(); return; }
  if (prepared && prepared.idx === n && prepared.k === 1 - ai) {
    // gapless: next song is already loaded in the other player
    qi = n; ai = prepared.k; prepared = null; counted = false; ab = { a: null, b: null };
    elVol(ai, 1); cur().play().catch(() => {}); onTrackChange(curTrack()); saveQueue(); return;
  }
  void tr; next(true);
}
async function prepareNext() {
  const n = nextIndex(true); if (n == null || S.repeat === 'one') return;
  if (prepared && prepared.idx === n) return;
  prepared = { idx: n, k: 1 - ai, loading: true };
  const tr = lib.get(queue[n]); if (!tr) { prepared = null; return; }
  try {
    const b = await getBlob(tr); if (!b || !prepared || prepared.idx !== n) return;
    const k = prepared.k; setSrc(k, b); A[k].load(); elVol(k, 1); prepared.loading = false;
  } catch { prepared = null; }
}

/* ---------------- Time updates ---------------- */
let lastPos = 0;
function onTime() {
  const el = cur(), d = el.duration, c = el.currentTime;
  if (!seeking) { $('#cur').textContent = fmt(c); $('#dur').textContent = fmt(d); if (isFinite(d) && d) { const p = c / d * 1000; $('#seek').value = p; $('#seek').style.setProperty('--p', p / 10 + '%'); $('#miniBar').style.width = p / 10 + '%'; } }
  const tr = curTrack();
  if (tr && !counted && (c > 30 || (isFinite(d) && c > d * 0.5))) { counted = true; tr.plays = (tr.plays || 0) + 1; tr.lastPlayed = Date.now(); persist(tr); }
  if (ab.a != null && ab.b != null && c >= ab.b) el.currentTime = ab.a;
  if (isFinite(d)) {
    const left = d - c;
    if (S.crossfade > 0 && !fading && left <= S.crossfade && left > 0.3 && S.repeat !== 'one' && !sleepEnd && nextIndex(true) != null) { fading = true; next(true, true); }
    else if (S.crossfade === 0 && left < 12 && left > 0.5) prepareNext();
  }
  checkSleep();
  if (Math.abs(c - lastPos) > 1) { lastPos = c; setPosState(); }
  renderLyricsTime(c);
}

/* ---------------- UI: player ---------------- */
function updatePlayState() {
  const playing = !cur().paused;
  document.querySelectorAll('.pp').forEach((p) => p.setAttribute('d', playing ? ICON.pause : ICON.play));
  if ('mediaSession' in navigator) navigator.mediaSession.playbackState = playing ? 'playing' : 'paused';
  if (playing && S.viz && !$('#np').classList.contains('hidden')) startViz();
}
function updateButtons() {
  $('#shufBtn').classList.toggle('on', S.shuffle);
  $('#repBtn').classList.toggle('on', S.repeat !== 'off'); $('#repDot').textContent = S.repeat === 'one' ? '1' : '';
  $('#vizBtn').classList.toggle('on', S.viz); $('#sleepBtn').classList.toggle('on', !!(sleepAt || sleepEnd));
  $('#eqBtn').classList.toggle('on', S.fx && (S.eq.some(Boolean) || S.bass || S.width !== 1 || S.boost !== 1 || S.leveler));
  const tr = curTrack(); $('#favBtn').classList.toggle('on', !!tr?.fav);
}
const artistOf = (tr) => tr.artist || t('unknownArtist');
const albumOf = (tr) => tr.album || t('unknownAlbum');
async function onTrackChange(tr) {
  if (!tr) return;
  $('#mini').classList.remove('hidden');
  $('#miniTitle').textContent = tr.title; $('#miniSub').textContent = artistOf(tr);
  $('#npTitle').textContent = tr.title; $('#npSub').textContent = `${artistOf(tr)} · ${albumOf(tr)}`;
  $('#npFrom').textContent = fromLabel ? `${t('from')} ${fromLabel}` : t('nowPlaying');
  const u = await artURL(tr.id);
  for (const el of [$('#miniArt'), $('#npArt')]) { el.style.backgroundImage = u ? `url("${u}")` : ''; el.textContent = u ? '' : '♪'; }
  $('#npBg').style.backgroundImage = u ? `url("${u}")` : '';
  document.title = `${tr.title} · SP03`;
  updateButtons(); updatePlayState(); renderLyrics(true);
  document.querySelectorAll('.row.playing').forEach((r) => r.classList.remove('playing'));
  document.querySelectorAll(`.row[data-id="${tr.id}"]`).forEach((r) => r.classList.add('playing'));
  if ('mediaSession' in navigator) {
    const art = u ? [{ src: u, sizes: '512x512', type: 'image/jpeg' }] : [{ src: 'icon-512.png', sizes: '512x512', type: 'image/png' }];
    navigator.mediaSession.metadata = new MediaMetadata({ title: tr.title, artist: artistOf(tr), album: albumOf(tr), artwork: art });
  }
}
function setPosState() {
  const el = cur();
  if ('mediaSession' in navigator && navigator.mediaSession.setPositionState && isFinite(el.duration) && el.duration > 0) {
    try { navigator.mediaSession.setPositionState({ duration: el.duration, playbackRate: el.playbackRate, position: Math.min(el.currentTime, el.duration) }); } catch {}
  }
}
if ('mediaSession' in navigator) {
  const ms = navigator.mediaSession;
  const h = (a, f) => { try { ms.setActionHandler(a, f); } catch {} };
  h('play', () => togglePlay()); h('pause', () => cur().pause());
  h('previoustrack', prev); h('nexttrack', () => next());
  h('seekbackward', (d) => { cur().currentTime = Math.max(0, cur().currentTime - (d.seekOffset || 10)); });
  h('seekforward', (d) => { cur().currentTime = Math.min(cur().duration || 0, cur().currentTime + (d.seekOffset || 10)); });
  h('seekto', (d) => { cur().currentTime = d.seekTime; setPosState(); });
  h('stop', () => { cur().pause(); cur().currentTime = 0; });
}

let seeking = false;
$('#seek').oninput = (e) => { seeking = true; const d = cur().duration; if (isFinite(d)) $('#cur').textContent = fmt(e.target.value / 1000 * d); e.target.style.setProperty('--p', e.target.value / 10 + '%'); };
$('#seek').onchange = (e) => { const d = cur().duration; if (isFinite(d)) cur().currentTime = e.target.value / 1000 * d; seeking = false; setPosState(); };
$('#playBtn').onclick = togglePlay; $('#miniPlay').onclick = (e) => { e.stopPropagation(); togglePlay(); };
$('#nextBtn').onclick = () => next(); $('#miniNext').onclick = (e) => { e.stopPropagation(); next(); };
$('#prevBtn').onclick = prev; $('#miniPrev').onclick = (e) => { e.stopPropagation(); prev(); };
$('#shufBtn').onclick = () => setShuffle(!S.shuffle);
$('#repBtn').onclick = cycleRepeat;
$('#miniOpen').onclick = () => openNP();
$('#npClose').onclick = () => { $('#np').classList.add('hidden'); history.state?.np && history.back(); };
function openNP() { $('#np').classList.remove('hidden'); history.pushState({ np: 1 }, ''); if (S.viz) startViz(); renderLyrics(true); }
window.addEventListener('popstate', () => { if (!$('#sheet').classList.contains('hidden')) closeSheet(); else $('#np').classList.add('hidden'); });
$('#favBtn').onclick = () => { const tr = curTrack(); if (tr) toggleFav(tr); };
function toggleFav(tr) { tr.fav = !tr.fav; persist(tr); updateButtons(); toast(tr.fav ? '❤ ' + t('fav') : t('unfav')); if (view.tab === 'playlists') render(); }

/* ---------------- A-B repeat ---------------- */
let ab = { a: null, b: null };
function abStep() {
  const c = cur().currentTime;
  if (ab.a == null) ab.a = c; else if (ab.b == null) { if (c > ab.a + 0.5) ab.b = c; } else ab = { a: null, b: null };
  renderAB(); toast(ab.a == null ? t('abClear') : ab.b == null ? `A ${fmt(ab.a)}` : `A-B ${fmt(ab.a)} → ${fmt(ab.b)}`);
}
function renderAB() {
  const m = $('#abMark'), d = cur().duration;
  if (ab.a == null || !isFinite(d)) { m.classList.add('hidden'); return; }
  const b = ab.b ?? cur().currentTime;
  m.style.left = ab.a / d * 100 + '%'; m.style.width = Math.max(0.5, (b - ab.a) / d * 100) + '%'; m.classList.remove('hidden');
}

/* ---------------- Sleep timer ---------------- */
let sleepAt = null, sleepEnd = false, sleepFading = false;
function checkSleep() {
  if (!sleepAt) return;
  const left = (sleepAt - Date.now()) / 1000;
  if (left <= 20 && left > 0) { sleepFading = true; const v = Math.max(0.05, left / 20); if (ctx) N.fade.gain.value = v; else cur().volume = v; }
  if (left <= 0) {
    sleepAt = null; cur().pause(); toast(t('sleepDone'));
    if (ctx) N.fade.gain.value = 1; else cur().volume = 1; sleepFading = false; updateButtons();
  }
}
setInterval(checkSleep, 1000);
$('#sleepBtn').onclick = () => {
  const label = sleepAt ? fmt((sleepAt - Date.now()) / 1000) : sleepEnd ? t('sleepEnd') : t('off');
  openSheet(`⏾ ${t('sleep')} · ${label}`, chips([['0', t('off')], ['5', '5'], ['10', '10'], ['15', '15'], ['30', '30'], ['45', '45'], ['60', '60'], ['90', '90'], ['120', '120'], ['end', t('sleepEnd')]].map(([v, l]) => [v, /^\d+$/.test(l) && v !== '0' ? `${l} ${t('min')}` : l]), sleepEnd ? 'end' : '', 'sl'), (s) => {
    s.querySelectorAll('[data-sl]').forEach((b) => b.onclick = () => {
      const v = b.dataset.sl; sleepAt = null; sleepEnd = false; if (ctx) N.fade.gain.value = 1;
      if (v === 'end') sleepEnd = true; else if (+v) { sleepAt = Date.now() + (+v) * 60000; toast(`⏾ ${t('sleepSet')} ${v} ${t('min')}`); }
      updateButtons(); closeSheet();
    });
  });
};

/* ---------------- Lyrics ---------------- */
let lyrLines = null, lyrIdx = -1, lyrOn = false;
function renderLyrics(force) {
  const box = $('#lyr'), tr = curTrack();
  box.classList.toggle('hidden', !lyrOn); $('#npArt').classList.toggle('hidden', lyrOn && !!tr); $('#lyrBtn').classList.toggle('on', lyrOn);
  if (!lyrOn || !tr) return;
  if (!force && box.dataset.id === tr.id) return;
  box.dataset.id = tr.id; lyrIdx = -1;
  lyrLines = parseLRC(tr.lyrics);
  if (lyrLines) { box.classList.remove('plain'); box.innerHTML = lyrLines.map((l, i) => `<p data-i="${i}">${esc(l.text) || '♪'}</p>`).join(''); }
  else if (tr.lyrics) { box.classList.add('plain'); box.innerHTML = tr.lyrics.split('\n').map((l) => `<p>${esc(l) || '&nbsp;'}</p>`).join(''); box.style.paddingTop = '10%'; }
  else { box.classList.add('plain'); box.innerHTML = `<p>${esc(t('noLyrics'))}</p><button class="tbtn gold" id="lrcAdd" style="margin-top:10px">${esc(t('addLrc'))}</button>`; box.querySelector('#lrcAdd').onclick = pickLyricsForCurrent; }
  if (lyrLines) box.style.paddingTop = '30%';
  renderLyricsTime(cur().currentTime);
}
function renderLyricsTime(c) {
  if (!lyrOn || !lyrLines) return;
  let i = -1; for (let k = 0; k < lyrLines.length; k++) { if (lyrLines[k].t <= c + 0.15) i = k; else break; }
  if (i === lyrIdx) return;
  const box = $('#lyr'); box.querySelector('p.on')?.classList.remove('on');
  lyrIdx = i; if (i < 0) return;
  const p = box.querySelector(`p[data-i="${i}"]`); if (p) { p.classList.add('on'); box.scrollTo({ top: p.offsetTop - box.clientHeight / 2 + p.clientHeight / 2, behavior: 'smooth' }); }
}
$('#lyr').addEventListener('click', (e) => { const p = e.target.closest('p[data-i]'); if (p && lyrLines) cur().currentTime = lyrLines[+p.dataset.i].t; });
$('#lyrBtn').onclick = () => { lyrOn = !lyrOn; renderLyrics(true); };
function pickLyricsForCurrent() {
  const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.lrc,.txt';
  inp.onchange = async () => { const f = inp.files[0]; const tr = curTrack(); if (!f || !tr) return; tr.lyrics = await f.text(); persist(tr); toast('📃 ' + t('lyricsAdded')); renderLyrics(true); };
  inp.click();
}

/* ---------------- Visualizer ---------------- */
let vizRAF = null;
function startViz() {
  const cv = $('#viz'); cv.classList.toggle('hidden', !S.viz);
  if (!S.viz || vizRAF) return;
  if (!ensureGraph()) return;
  const g = cv.getContext('2d'); const data = new Uint8Array(N.an.frequencyBinCount);
  const draw = () => {
    if (!S.viz || $('#np').classList.contains('hidden')) { vizRAF = null; return; }
    vizRAF = requestAnimationFrame(draw);
    const w = cv.clientWidth * devicePixelRatio, h = cv.clientHeight * devicePixelRatio;
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
    N.an.getByteFrequencyData(data); g.clearRect(0, 0, w, h);
    const bars = 48, bw = w / bars; const grad = g.createLinearGradient(0, h, 0, 0); grad.addColorStop(0, '#c9962e'); grad.addColorStop(1, '#ffe08c');
    g.fillStyle = grad;
    for (let i = 0; i < bars; i++) { const v = data[Math.floor(i * data.length * 0.75 / bars)] / 255; const bh = Math.max(2, v * v * h); g.fillRect(i * bw + bw * 0.15, h - bh, bw * 0.7, bh); }
  };
  draw();
}
$('#vizBtn').onclick = () => { S.viz = !S.viz; saveS(); updateButtons(); if (!S.viz) $('#viz').classList.add('hidden'); startViz(); };

/* ---------------- Sheets ---------------- */
function openSheet(title, html, bind) {
  const s = $('#sheet');
  s.innerHTML = `<h3>${esc(title)}<button class="x" aria-label="close">✕</button></h3>${html}`;
  s.querySelector('.x').onclick = closeSheet;
  s.classList.remove('hidden'); $('#sheetBg').classList.remove('hidden');
  bind && bind(s);
}
function closeSheet() { $('#sheet').classList.add('hidden'); $('#sheetBg').classList.add('hidden'); }
$('#sheetBg').onclick = closeSheet;
const chips = (items, curV, attr) => `<div class="chips">${items.map(([v, l]) => `<button class="chip ${String(v) === String(curV) ? 'on' : ''}" data-${attr}="${esc(v)}">${esc(l)}</button>`).join('')}</div>`;
const sw = (id, on) => `<label class="sw"><input type="checkbox" id="${id}" ${on ? 'checked' : ''}><span></span></label>`;

$('#eqBtn').onclick = openEq;
function openEq() {
  ensureGraph();
  openSheet('🎚 ' + t('eq'), `
    <div class="row2"><span style="flex:1">${esc(t('fxOn'))}</span>${sw('fxOn', S.fx)}</div>
    <div class="sec">${esc(t('presets'))}</div>${chips(Object.keys(PRESETS).map((k) => [k, k]), presetName(), 'pre')}
    <div class="eq">${EQF.map((f, i) => `<label><b style="font-size:10px;color:var(--gold2)" id="eqv${i}">${S.eq[i] > 0 ? '+' : ''}${S.eq[i]}</b><input type="range" min="-12" max="12" step="1" value="${S.eq[i]}" data-band="${i}"><span>${f >= 1000 ? f / 1000 + 'k' : f}</span></label>`).join('')}</div>
    <div class="row2">🔊 ${esc(t('bass'))}<input type="range" id="bassR" min="0" max="15" step="1" value="${S.bass}"><b id="bassV">${S.bass} dB</b></div>
    <div class="row2">🎧 ${esc(t('surround'))}<input type="range" id="widR" min="0" max="200" step="5" value="${Math.round(S.width * 100)}"><b id="widV">${Math.round(S.width * 100)}%</b></div>
    <div class="row2">⚖ ${esc(t('balance'))}<input type="range" id="balR" min="-100" max="100" step="5" value="${Math.round(S.balance * 100)}"><b id="balV">${balLabel(S.balance)}</b></div>
    <div class="row2">📢 ${esc(t('boost'))}<input type="range" id="bstR" min="100" max="200" step="5" value="${Math.round(S.boost * 100)}"><b id="bstV">${Math.round(S.boost * 100)}%</b></div>
    <div class="row2"><span style="flex:1">${esc(t('leveler'))}</span>${sw('levSw', S.leveler)}</div>`, (s) => {
    s.querySelector('#fxOn').onchange = (e) => { S.fx = e.target.checked; applyFx(); updateButtons(); };
    s.querySelectorAll('[data-pre]').forEach((b) => b.onclick = () => { S.eq = PRESETS[b.dataset.pre].slice(); applyFx(); updateButtons(); openEq(); });
    s.querySelectorAll('[data-band]').forEach((r) => r.oninput = () => { const i = +r.dataset.band; S.eq[i] = +r.value; s.querySelector('#eqv' + i).textContent = (S.eq[i] > 0 ? '+' : '') + S.eq[i]; applyFx(); updateButtons(); s.querySelectorAll('[data-pre]').forEach((c) => c.classList.toggle('on', c.dataset.pre === presetName())); });
    const bind = (id, vid, fn, lbl) => { s.querySelector(id).oninput = (e) => { fn(+e.target.value); s.querySelector(vid).textContent = lbl(+e.target.value); applyFx(); updateButtons(); }; };
    bind('#bassR', '#bassV', (v) => { S.bass = v; }, (v) => v + ' dB');
    bind('#widR', '#widV', (v) => { S.width = v / 100; }, (v) => v + '%');
    bind('#balR', '#balV', (v) => { S.balance = v / 100; }, (v) => balLabel(v / 100));
    bind('#bstR', '#bstV', (v) => { S.boost = v / 100; }, (v) => v + '%');
    s.querySelector('#levSw').onchange = (e) => { S.leveler = e.target.checked; applyFx(); updateButtons(); };
  });
}
const presetName = () => Object.keys(PRESETS).find((k) => PRESETS[k].every((v, i) => v === S.eq[i])) || '';
const balLabel = (b) => (b === 0 ? 'C' : b < 0 ? 'L ' + Math.round(-b * 100) : 'R ' + Math.round(b * 100));

$('#qBtn').onclick = openQueue;
function openQueue() {
  const rows = queue.map((id, i) => {
    const tr = lib.get(id); if (!tr) return '';
    return `<div class="qrow ${i === qi ? 'on' : ''}"><div class="art" data-art="${tr.id}" style="width:40px;height:40px">♪</div><div class="txt" data-play="${i}"><div class="t1">${i === qi ? '▶ ' : ''}${esc(tr.title)}</div><div class="t2">${esc(artistOf(tr))}</div></div>
      <button class="ib" data-up="${i}" ${i === 0 ? 'disabled style="opacity:.3"' : ''}>⬆</button><button class="ib" data-dn="${i}" ${i === queue.length - 1 ? 'disabled style="opacity:.3"' : ''}>⬇</button><button class="ib" data-rm="${i}">✕</button></div>`;
  }).join('');
  openSheet(`${t('queue')} · ${queue.length}`, `<div>${rows || `<p class="info">${esc(t('empty'))}</p>`}</div>${queue.length ? `<button class="btn ghost" id="clrQ">${esc(t('clearQ'))}</button>` : ''}`, (s) => {
    hookArt(s);
    s.querySelectorAll('[data-play]').forEach((b) => b.onclick = () => { playAt(+b.dataset.play); closeSheet(); });
    const mv = (i, j) => { const id = curId(); [queue[i], queue[j]] = [queue[j], queue[i]]; qi = queue.indexOf(id); saveQueue(); openQueue(); };
    s.querySelectorAll('[data-up]').forEach((b) => b.onclick = () => mv(+b.dataset.up, +b.dataset.up - 1));
    s.querySelectorAll('[data-dn]').forEach((b) => b.onclick = () => mv(+b.dataset.dn, +b.dataset.dn + 1));
    s.querySelectorAll('[data-rm]').forEach((b) => b.onclick = () => {
      const i = +b.dataset.rm; if (i === qi) return; const id = curId(); queue.splice(i, 1); qi = queue.indexOf(id); saveQueue(); openQueue();
    });
    s.querySelector('#clrQ')?.addEventListener('click', () => { const id = curId(); queue = id ? [id] : []; qi = id ? 0 : -1; unshuffled = null; saveQueue(); openQueue(); });
    s.querySelector('.qrow.on')?.scrollIntoView({ block: 'center' });
  });
}

$('#npMore').onclick = () => {
  const tr = curTrack();
  openSheet(t('nowPlaying'), `
    <div class="sec">${esc(t('speed'))}</div>${chips([0.5, 0.75, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2].map((x) => [x, x + 'x']), S.speed, 'sp')}
    <div class="row2"><span style="flex:1">${esc(t('pitch'))}</span>${sw('pitchSw', S.pitch)}</div>
    <div class="sec">${esc(t('crossfade'))}</div>${chips([0, 2, 4, 6, 8, 10, 12].map((x) => [x, x ? x + ' ' + t('sec') : t('off')]), S.crossfade, 'cf')}
    <div style="margin-top:10px">
      <button class="mi" data-a="ab"><span class="e">🔁</span>${esc(t('abRepeat'))}<small style="margin-left:auto">${ab.a == null ? t('abA') : ab.b == null ? t('abB') : t('abClear')}</small></button>
      ${tr ? songMenuItems(tr, true) : ''}
    </div>`, (s) => {
    s.querySelectorAll('[data-sp]').forEach((b) => b.onclick = () => { S.speed = +b.dataset.sp; A.forEach((el) => { el.playbackRate = S.speed; }); saveS(); setPosState(); $('#npMore').click(); });
    s.querySelector('#pitchSw').onchange = (e) => { S.pitch = e.target.checked; A.forEach((el) => { el.preservesPitch = !S.pitch; }); saveS(); };
    s.querySelectorAll('[data-cf]').forEach((b) => b.onclick = () => { S.crossfade = +b.dataset.cf; saveS(); $('#npMore').click(); });
    s.querySelector('[data-a=ab]').onclick = () => { abStep(); closeSheet(); };
    if (tr) bindSongMenu(s, tr);
  });
};

/* ---------------- Song menu ---------------- */
function songMenuItems(tr, inNP) {
  const it = (a, e, l) => `<button class="mi" data-m="${a}"><span class="e">${e}</span>${esc(l)}</button>`;
  return [
    inNP ? '' : it('next', '⏭', t('playNext')), inNP ? '' : it('queue', '➕', t('addQueue')),
    it('pl', '📂', t('addPl')), it('fav', tr.fav ? '💔' : '❤', tr.fav ? t('unfav') : t('fav')),
    it('album', '💿', t('goAlbum')), it('artist', '🎤', t('goArtist')), it('lrc', '📃', t('addLrc').replace(/^📄 /, '')),
    it('info', 'ℹ', t('info')), navigator.canShare ? it('share', '📤', t('share')) : '', it('rm', '🗑', t('removeLib')),
  ].join('');
}
function bindSongMenu(s, tr) {
  const on = (a, f) => { const b = s.querySelector(`[data-m="${a}"]`); if (b) b.onclick = f; };
  on('next', () => { closeSheet(); enqueue(tr.id, true); });
  on('queue', () => { closeSheet(); enqueue(tr.id, false); });
  on('pl', () => openAddToPlaylist([tr.id]));
  on('fav', () => { closeSheet(); toggleFav(tr); });
  on('album', () => { closeSheet(); $('#np').classList.add('hidden'); openDetail('album', albumKey(tr)); });
  on('artist', () => { closeSheet(); $('#np').classList.add('hidden'); openDetail('artist', artistOf(tr)); });
  on('lrc', () => {
    closeSheet();
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.lrc,.txt';
    inp.onchange = async () => { const f = inp.files[0]; if (!f) return; tr.lyrics = await f.text(); persist(tr); toast('📃 ' + t('lyricsAdded')); if (curId() === tr.id) renderLyrics(true); };
    inp.click();
  });
  on('info', () => {
    const where = { saved: t('whereSaved'), folder: t('whereFolder'), session: t('whereSession') }[tr.source];
    const rows = [[t('file'), tr.name], [t('size'), fmtSize(tr.size)], [t('duration'), fmt(tr.duration)], [t('format'), (extOf(tr.name) || '?').toUpperCase() + (tr.converted ? ' → AAC' : '')],
      [t('artists'), artistOf(tr)], [t('albums'), albumOf(tr)], [t('genres'), tr.genre || '–'], [t('year'), tr.year || '–'], [t('track'), tr.trackNo || '–'], [t('plays'), tr.plays || 0], [t('where'), where], [t('path'), tr.folder || t('device')]];
    openSheet(t('info'), `<div class="info">${rows.map(([a, b]) => `<b>${esc(a)}:</b> ${esc(b)}`).join('<br>')}</div>`);
  });
  on('share', async () => {
    closeSheet();
    try { const b = await getBlob(tr); const f = new File([b], tr.name, { type: b.type || tr.type || 'audio/mpeg' }); if (navigator.canShare({ files: [f] })) await navigator.share({ files: [f], title: tr.title }); } catch {}
  });
  on('rm', async () => {
    closeSheet();
    lib.delete(tr.id); session.delete(tr.id);
    try { await db.del('tracks', tr.id); await db.del('blobs', tr.id); await db.del('blobs', tr.id + '#c'); await db.del('art', tr.id); } catch {}
    for (const p of playlists) if (p.ids.includes(tr.id)) { p.ids = p.ids.filter((x) => x !== tr.id); db.put('playlists', p); }
    const id = curId(); queue = queue.filter((x) => x !== tr.id); qi = queue.indexOf(id);
    toast(t('removed')); render();
  });
}
function openSongMenu(id) {
  const tr = lib.get(id); if (!tr) return;
  openSheet(tr.title, songMenuItems(tr, false), (s) => bindSongMenu(s, tr));
}

/* ---------------- Playlists ---------------- */
function openAddToPlaylist(ids) {
  openSheet(t('addPl'), `
    <input class="input" id="plNew" placeholder="${esc(t('plName'))}"><button class="btn primary" id="plCreate" style="margin-top:0">${esc(t('create'))}</button>
    <div style="margin-top:12px">${playlists.map((p) => `<button class="mi" data-pl="${p.id}"><span class="e">📂</span>${esc(p.name)}<small style="margin-left:auto">${p.ids.length}</small></button>`).join('')}</div>`, (s) => {
    const add = async (p) => { for (const id of ids) if (!p.ids.includes(id)) p.ids.push(id); await db.put('playlists', p); closeSheet(); toast(`${t('addedTo')} ${p.name}`); if (view.tab === 'playlists') render(); };
    s.querySelector('#plCreate').onclick = async () => { const p = await newPlaylist(s.querySelector('#plNew').value); if (p) add(p); };
    s.querySelectorAll('[data-pl]').forEach((b) => b.onclick = () => add(playlists.find((p) => p.id === b.dataset.pl)));
  });
}
async function newPlaylist(name) {
  name = (name || '').trim(); if (!name) return null;
  const p = { id: 'p' + Date.now().toString(36), name, ids: [], created: Date.now() };
  playlists.push(p); await db.put('playlists', p); return p;
}
function editPlaylist(p) {
  openSheet(p.name, `
    <input class="input" id="plRen" value="${esc(p.name)}"><button class="btn ghost" id="plRenB" style="margin-top:0">${esc(t('rename'))}</button>
    <div style="margin-top:12px">${p.ids.map((id, i) => { const tr = lib.get(id); return tr ? `<div class="qrow"><div class="txt"><div class="t1">${esc(tr.title)}</div><div class="t2">${esc(artistOf(tr))}</div></div><button class="ib" data-up="${i}">⬆</button><button class="ib" data-dn="${i}">⬇</button><button class="ib" data-rm="${i}">✕</button></div>` : ''; }).join('')}</div>
    <button class="btn ghost" id="plDel">🗑 ${esc(t('delete'))}</button>`, (s) => {
    const save = async () => { await db.put('playlists', p); editPlaylist(p); render(); };
    s.querySelector('#plRenB').onclick = () => { const v = s.querySelector('#plRen').value.trim(); if (v) { p.name = v; save(); } };
    s.querySelectorAll('[data-up]').forEach((b) => b.onclick = () => { const i = +b.dataset.up; if (i > 0) { [p.ids[i - 1], p.ids[i]] = [p.ids[i], p.ids[i - 1]]; save(); } });
    s.querySelectorAll('[data-dn]').forEach((b) => b.onclick = () => { const i = +b.dataset.dn; if (i < p.ids.length - 1) { [p.ids[i + 1], p.ids[i]] = [p.ids[i], p.ids[i + 1]]; save(); } });
    s.querySelectorAll('[data-rm]').forEach((b) => b.onclick = () => { p.ids.splice(+b.dataset.rm, 1); save(); });
    s.querySelector('#plDel').onclick = async () => { playlists = playlists.filter((x) => x !== p); await db.del('playlists', p.id); closeSheet(); toast(t('deleted')); view.detail = null; render(); };
  });
}

/* ---------------- Library views ---------------- */
const view = { tab: 'songs', detail: null, q: '' };
let listCtx = [];   // ids of the song list on screen (for "play from here")
const albumKey = (tr) => albumOf(tr) + '\u0001' + (tr.albumArtist || artistOf(tr));
const byTitle = (a, b) => a.title.localeCompare(b.title, undefined, { numeric: true, sensitivity: 'base' });
function sortedSongs(list = allTracks()) {
  const s = list.slice();
  if (S.sort === 'artist') s.sort((a, b) => artistOf(a).localeCompare(artistOf(b)) || byTitle(a, b));
  else if (S.sort === 'added') s.sort((a, b) => b.addedAt - a.addedAt);
  else if (S.sort === 'plays') s.sort((a, b) => (b.plays || 0) - (a.plays || 0) || byTitle(a, b));
  else s.sort(byTitle);
  return s;
}
function groupBy(keyFn) {
  const m = new Map();
  for (const tr of allTracks()) { const k = keyFn(tr); if (!m.has(k)) m.set(k, []); m.get(k).push(tr); }
  return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0], undefined, { sensitivity: 'base' }));
}
const songRow = (tr) => `<div class="row ${curId() === tr.id ? 'playing' : ''}" data-id="${tr.id}"><div class="art" data-art="${tr.id}">♪</div><div class="txt"><div class="t1">${esc(tr.title)}</div><div class="t2">${tr.fav ? '❤ ' : ''}${esc(artistOf(tr))} · ${esc(albumOf(tr))}</div></div><span class="dur">${fmt(tr.duration)}</span><button class="ib" data-menu="${tr.id}" aria-label="menu">${svg(ICON.more)}</button></div>`;
function songList(tracks, label) {
  listCtx = tracks.map((x) => x.id); listLabel = label || '';
  return `<div class="list">${tracks.map(songRow).join('')}</div>`;
}
let listLabel = '';
const playBar = (n, extra = '') => `<div class="toolbar"><span class="grow">${n} ${esc(t('songs'))}</span>${extra}<button class="tbtn" data-act="shuf">🔀 ${esc(t('shuffleAll'))}</button><button class="tbtn gold" data-act="playall">▶ ${esc(t('playAll'))}</button></div>`;

function renderEmpty() {
  return `<div class="empty"><img src="icon-512.png" alt=""><h2>${t('heroTitle')}</h2><p>${esc(t('heroSub'))}</p>
    <div class="features">${['b1', 'b2', 'b3', 'b4', 'b5', 'b6', 'b7', 'b8'].map((k) => `<span class="badge">${esc(t(k))}</span>`).join('')}</div>
    <button class="btn primary" data-act="add">🎵 ${esc(t('addMusic'))}</button>
    ${'showDirectoryPicker' in window ? `<button class="btn ghost" data-act="folder">📁 ${esc(t('addFolder'))}</button>` : ''}
    <p style="margin-top:16px;font-size:13px">${esc(t('bgTip'))}</p></div>`;
}
function render() {
  document.querySelectorAll('.tab').forEach((b) => b.classList.toggle('on', b.dataset.tab === view.tab));
  const V = $('#view');
  if (!lib.size) { V.innerHTML = renderEmpty(); return; }
  if (view.q) { V.innerHTML = renderSearch(); hookArt(V); return; }
  if (view.detail) { V.innerHTML = renderDetail(); hookArt(V); return; }
  let html = '';
  if (view.tab === 'songs') {
    const all = sortedSongs();
    html = playBar(all.length, `<select class="tbtn" id="sortSel">${[['title', t('sortTitle')], ['artist', t('sortArtist')], ['added', t('sortAdded')], ['plays', t('sortPlays')]].map(([v, l]) => `<option value="${v}" ${S.sort === v ? 'selected' : ''} style="color:#000">${esc(l)}</option>`).join('')}</select>`) + songList(all, t('songs'));
  } else if (view.tab === 'albums') {
    const g = groupBy(albumKey);
    html = `<div class="grid">${g.map(([k, trs]) => { const [alb, art] = k.split('\u0001'); return `<div class="gcard" data-open="album" data-key="${esc(k)}"><div class="art" data-art="${firstArtId(trs.map((x) => x.id))}">💿</div><div class="t1">${esc(alb)}</div><div class="t2">${esc(art)} · ${trs.length}</div></div>`; }).join('')}</div>`;
  } else if (view.tab === 'artists' || view.tab === 'genres' || view.tab === 'folders') {
    const kind = view.tab.slice(0, -1);
    const kf = { artist: artistOf, genre: (tr) => tr.genre || t('unknownGenre'), folder: (tr) => tr.folder || t('device') }[kind];
    const icon = { artist: '🎤', genre: '🎼', folder: '📁' }[kind];
    html = `<div class="list">${groupBy(kf).map(([k, trs]) => `<div class="row" data-open="${kind}" data-key="${esc(k)}"><div class="art ${kind === 'artist' ? 'round' : ''}" ${kind === 'artist' ? `data-art="${firstArtId(trs.map((x) => x.id))}"` : ''}>${icon}</div><div class="txt"><div class="t1">${esc(k)}</div><div class="t2">${trs.length} ${esc(t('songs'))}</div></div></div>`).join('')}</div>`;
  } else if (view.tab === 'playlists') {
    const smart = [['fav', '❤', t('favs'), allTracks().filter((x) => x.fav).length], ['recent', '🕘', t('recent'), allTracks().filter((x) => x.lastPlayed).length], ['most', '🔥', t('most'), allTracks().filter((x) => x.plays).length], ['newest', '🆕', t('newest'), Math.min(50, lib.size)]];
    html = `<div class="toolbar"><span class="grow"></span><button class="tbtn gold" data-act="newpl">${esc(t('newPl'))}</button></div><div class="list">
      ${smart.map(([k, e, l, n]) => `<div class="row" data-open="smart" data-key="${k}"><div class="art">${e}</div><div class="txt"><div class="t1">${esc(l)}</div><div class="t2">${n} ${esc(t('songs'))}</div></div></div>`).join('')}
      ${playlists.map((p) => `<div class="row" data-open="playlist" data-key="${p.id}"><div class="art" ${p.ids.length ? `data-art="${firstArtId(p.ids)}"` : ''}>📂</div><div class="txt"><div class="t1">${esc(p.name)}</div><div class="t2">${p.ids.length} ${esc(t('songs'))}</div></div></div>`).join('')}</div>`;
  }
  V.innerHTML = html; hookArt(V);
  V.querySelector('#sortSel')?.addEventListener('change', (e) => { S.sort = e.target.value; saveS(); render(); });
}
function detailTracks(kind, key) {
  const all = allTracks();
  if (kind === 'album') return all.filter((x) => albumKey(x) === key).sort((a, b) => (a.trackNo || 999) - (b.trackNo || 999) || byTitle(a, b));
  if (kind === 'artist') return all.filter((x) => artistOf(x) === key).sort(byTitle);
  if (kind === 'genre') return all.filter((x) => (x.genre || t('unknownGenre')) === key).sort(byTitle);
  if (kind === 'folder') return all.filter((x) => (x.folder || t('device')) === key).sort(byTitle);
  if (kind === 'playlist') { const p = playlists.find((x) => x.id === key); return p ? p.ids.map((id) => lib.get(id)).filter(Boolean) : []; }
  if (kind === 'smart') {
    if (key === 'fav') return all.filter((x) => x.fav).sort(byTitle);
    if (key === 'recent') return all.filter((x) => x.lastPlayed).sort((a, b) => b.lastPlayed - a.lastPlayed).slice(0, 100);
    if (key === 'most') return all.filter((x) => x.plays).sort((a, b) => b.plays - a.plays).slice(0, 100);
    if (key === 'newest') return all.sort((a, b) => b.addedAt - a.addedAt).slice(0, 50);
  }
  return [];
}
function detailTitle(kind, key) {
  if (kind === 'album') return key.split('\u0001');
  if (kind === 'playlist') return [playlists.find((x) => x.id === key)?.name || '', t('playlists')];
  if (kind === 'smart') return [{ fav: t('favs'), recent: t('recent'), most: t('most'), newest: t('newest') }[key], t('playlists')];
  return [key, t(kind + 's')];
}
function renderDetail() {
  const { kind, key } = view.detail;
  const trs = detailTracks(kind, key);
  const [title, sub] = detailTitle(kind, key);
  const dur = trs.reduce((a, x) => a + (x.duration || 0), 0);
  const artId = firstArtId(trs.map((x) => x.id));
  return `<div class="toolbar"><button class="tbtn" data-act="back">${svg(ICON.back, 'style="width:18px;height:18px"')}</button><span class="grow"></span>${kind === 'playlist' ? `<button class="tbtn" data-act="editpl">✏️ ${esc(t('rename'))}</button>` : ''}</div>
    <div class="detailHead"><div class="art" ${artId ? `data-art="${artId}"` : ''}>♪</div><div><h2>${esc(title)}</h2><p>${esc(sub)} · ${trs.length} ${esc(t('songs'))} · ${fmt(dur)}</p></div></div>
    ${trs.length ? playBar(trs.length) + songList(trs, title) : `<p class="empty">${esc(t('empty'))}</p>`}`;
}
function renderSearch() {
  const q = view.q.toLowerCase();
  const hit = (s) => (s || '').toLowerCase().includes(q);
  const songs = sortedSongs(allTracks().filter((x) => hit(x.title) || hit(x.artist) || hit(x.album) || hit(x.name)));
  const albums = groupBy(albumKey).filter(([k]) => hit(k.split('\u0001')[0])).slice(0, 12);
  const artists = groupBy(artistOf).filter(([k]) => hit(k)).slice(0, 12);
  if (!songs.length && !albums.length && !artists.length) return `<p class="empty">${esc(t('noResults'))}</p>`;
  return `${artists.length ? `<div class="sec">${esc(t('artists'))}</div><div class="list">${artists.map(([k, trs]) => `<div class="row" data-open="artist" data-key="${esc(k)}"><div class="art round" data-art="${firstArtId(trs.map((x) => x.id))}">🎤</div><div class="txt"><div class="t1">${esc(k)}</div><div class="t2">${trs.length} ${esc(t('songs'))}</div></div></div>`).join('')}</div>` : ''}
    ${albums.length ? `<div class="sec">${esc(t('albums'))}</div><div class="list">${albums.map(([k, trs]) => `<div class="row" data-open="album" data-key="${esc(k)}"><div class="art" data-art="${firstArtId(trs.map((x) => x.id))}">💿</div><div class="txt"><div class="t1">${esc(k.split('\u0001')[0])}</div><div class="t2">${esc(k.split('\u0001')[1])}</div></div></div>`).join('')}</div>` : ''}
    ${songs.length ? `<div class="sec">${esc(t('songs'))}</div>${songList(songs, view.q)}` : ''}`;
}
function openDetail(kind, key) { view.detail = { kind, key }; view.q = ''; $('#search').value = ''; render(); scrollTo(0, 0); }

$('#view').addEventListener('click', (e) => {
  const menu = e.target.closest('[data-menu]'); if (menu) { e.stopPropagation(); openSongMenu(menu.dataset.menu); return; }
  const act = e.target.closest('[data-act]')?.dataset.act;
  if (act === 'add') { $('#fileIn').click(); return; }
  if (act === 'folder') { addFolder(); return; }
  if (act === 'playall') { playList(listCtx, 0, listLabel); openNP(); return; }
  if (act === 'shuf') { if (!S.shuffle) setShuffle(true); playList(listCtx, Math.floor(Math.random() * listCtx.length), listLabel); openNP(); return; }
  if (act === 'back') { view.detail = null; render(); return; }
  if (act === 'newpl') { openSheet(t('newPl'), `<input class="input" id="plN" placeholder="${esc(t('plName'))}"><button class="btn primary" id="plC" style="margin-top:0">${esc(t('create'))}</button>`, (s) => { s.querySelector('#plN').focus(); s.querySelector('#plC').onclick = async () => { if (await newPlaylist(s.querySelector('#plN').value)) { closeSheet(); render(); } }; }); return; }
  if (act === 'editpl') { const p = playlists.find((x) => x.id === view.detail.key); if (p) editPlaylist(p); return; }
  const open = e.target.closest('[data-open]'); if (open) { openDetail(open.dataset.open, open.dataset.key); return; }
  const row = e.target.closest('.row[data-id]');
  if (row) { const i = listCtx.indexOf(row.dataset.id); playList(listCtx, Math.max(0, i), listLabel); }
});
$('#tabs').addEventListener('click', (e) => { const b = e.target.closest('[data-tab]'); if (!b) return; view.tab = b.dataset.tab; view.detail = null; view.q = ''; $('#search').value = ''; render(); });
$('#searchBtn').onclick = () => { const r = $('#searchRow'); r.classList.toggle('hidden'); if (!r.classList.contains('hidden')) $('#search').focus(); else { view.q = ''; $('#search').value = ''; render(); } };
$('#search').oninput = (e) => { view.q = e.target.value.trim(); render(); };
$('#addBtn').onclick = () => {
  if (!('showDirectoryPicker' in window)) { $('#fileIn').click(); return; }
  openSheet(t('addMusic'), `<button class="mi" data-a="f"><span class="e">🎵</span>${esc(t('addMusic'))}</button><button class="mi" data-a="d"><span class="e">📁</span>${esc(t('addFolder'))}</button>`, (s) => {
    s.querySelector('[data-a=f]').onclick = () => { closeSheet(); $('#fileIn').click(); };
    s.querySelector('[data-a=d]').onclick = () => { closeSheet(); addFolder(); };
  });
};
$('#fileIn').onchange = (e) => { const fs = [...e.target.files]; e.target.value = ''; askImport(fs); };
document.addEventListener('dragover', (e) => e.preventDefault());
document.addEventListener('drop', (e) => { e.preventDefault(); askImport(e.dataTransfer?.files); });

/* Settings */
$('#setBtn').onclick = async () => {
  let used = '';
  try { const est = await navigator.storage.estimate(); used = `${fmtSize(est.usage || 0)} / ${fmtSize(est.quota || 0)}`; } catch {}
  let sure = false;
  openSheet('⚙ ' + t('settings'), `
    <div class="sec">${esc(t('language'))}</div>${chips([['hi', 'हिंदी'], ['en', 'English']], S.lang, 'lg')}
    <div class="row2" style="margin-top:14px"><span style="flex:1">${esc(t('resume'))}</span>${sw('resSw', S.resume)}</div>
    <div class="sec">${esc(t('crossfade'))}</div>${chips([0, 2, 4, 6, 8, 10, 12].map((x) => [x, x ? x + ' ' + t('sec') : t('off')]), S.crossfade, 'cf')}
    <div class="sec">${esc(t('storage'))}</div><p class="info">${esc(used)} · ${lib.size} ${esc(t('songs'))}</p>
    ${'showDirectoryPicker' in window ? `<button class="mi" data-a="rescan"><span class="e">🔄</span>${esc(t('folderRescan').replace('🔄 ', ''))}</button>` : ''}
    <button class="mi" data-a="clear"><span class="e">🗑</span><span id="clrTxt">${esc(t('clearLib').replace('🗑 ', ''))}</span></button>
    <p class="info" style="margin-top:12px;font-size:12px;text-align:center">SP03 · v1</p>`, (s) => {
    s.querySelectorAll('[data-lg]').forEach((b) => b.onclick = () => { S.lang = b.dataset.lg; saveS(); applyI18n(); render(); $('#setBtn').click(); });
    s.querySelector('#resSw').onchange = (e) => { S.resume = e.target.checked; saveS(); };
    s.querySelectorAll('[data-cf]').forEach((b) => b.onclick = () => { S.crossfade = +b.dataset.cf; saveS(); s.querySelectorAll('[data-cf]').forEach((c) => c.classList.toggle('on', c === b)); });
    s.querySelector('[data-a=rescan]')?.addEventListener('click', () => { closeSheet(); rescanFolders(); });
    s.querySelector('[data-a=clear]').onclick = async () => {
      if (!sure) { sure = true; s.querySelector('#clrTxt').textContent = t('clearSure'); return; }
      cur().pause(); for (const st of ['tracks', 'blobs', 'art', 'playlists', 'kv']) await db.clear(st).catch(() => {});
      lib.clear(); session.clear(); playlists = []; queue = []; qi = -1; store.set('last', null);
      $('#mini').classList.add('hidden'); closeSheet(); toast(t('cleared')); render();
    };
  });
};

/* Keyboard (PC) */
document.addEventListener('keydown', (e) => {
  if (/INPUT|SELECT|TEXTAREA/.test(document.activeElement?.tagName)) return;
  if (e.key === ' ') { e.preventDefault(); togglePlay(); }
  else if (e.key === 'ArrowRight' && e.shiftKey) next();
  else if (e.key === 'ArrowLeft' && e.shiftKey) prev();
  else if (e.key === 'ArrowRight') cur().currentTime += 5;
  else if (e.key === 'ArrowLeft') cur().currentTime -= 5;
  else if (e.key === 'l') { lyrOn = !lyrOn; renderLyrics(true); }
  else if (e.key === 's') setShuffle(!S.shuffle);
  else if (e.key === 'r') cycleRepeat();
});

/* ---------------- Converter for formats the browser can't play ---------------- */
const CORE_BASE = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? new URL('core/', location.href).href : 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm/';
let ff = null, ffReady = null, converting = null;
function ensureEngine() {
  if (!ffReady) {
    ff = new FFmpeg();
    ffReady = ff.load({ coreURL: CORE_BASE + 'ffmpeg-core.js', wasmURL: CORE_BASE + 'ffmpeg-core.wasm' }).catch((e) => { ffReady = null; ff = null; throw e; });
  }
  return ffReady;
}
async function convertAndPlay(tr, i) {
  if (converting === tr.id) return; converting = tr.id;
  busy(true, t('converting'), t('convertNote'));
  try {
    try { await ensureEngine(); } catch { throw new Error(t('errEngine')); }
    const src = tr.source === 'session' ? session.get(tr.id) : tr.source === 'saved' ? await db.get('blobs', tr.id) : await tr.handle.getFile();
    const inFile = new File([src], 'in.' + (extOf(tr.name) || 'bin'));
    try { await ff.createDir('/in'); } catch {}
    let mounted = false, path;
    try { await ff.mount('WORKERFS', { files: [inFile] }, '/in'); mounted = true; path = '/in/' + inFile.name; }
    catch { path = '/' + inFile.name; await ff.writeFile(path, new Uint8Array(await inFile.arrayBuffer())); }
    const code = await ff.exec(['-i', path, '-vn', '-map', '0:a:0', '-c:a', 'aac', '-b:a', '192k', '-ac', '2', '-movflags', '+faststart', '/out.m4a']);
    if (mounted) { try { await ff.unmount('/in'); } catch {} } else { try { await ff.deleteFile(path); } catch {} }
    if (code !== 0) throw new Error(t('errPlay'));
    const data = await ff.readFile('/out.m4a'); try { await ff.deleteFile('/out.m4a'); } catch {}
    const blob = new Blob([data.buffer], { type: 'audio/mp4' });
    tr.converted = true;
    if (tr.source === 'session') session.set(tr.id, new File([blob], baseOf(tr.name) + '.m4a', { type: 'audio/mp4' }));
    else await db.put('blobs', blob, tr.id + '#c');
    if (!tr.duration) tr.duration = await measureDuration(blob);
    persist(tr);
    busy(false); converting = null;
    playAt(i);
  } catch (e) { busy(false); converting = null; toast(String(e?.message || e).slice(0, 120), 5000); }
}

/* ---------------- Open with / Share ---------------- */
if ('launchQueue' in window) window.launchQueue.setConsumer(async (p) => { if (p.files?.length) askImport(await Promise.all(p.files.map((h) => h.getFile()))); });
async function receiveShared() {
  if (!new URLSearchParams(location.search).has('shared')) return;
  history.replaceState(null, '', location.pathname);
  try {
    const c = await caches.open('sp03-share'); const cntKey = new URL('shared-count', location.href).href;
    const cr = await c.match(cntKey); const n = cr ? parseInt(await cr.text(), 10) || 0 : 0; const files = [];
    for (let i = 0; i < n; i++) {
      const key = new URL('shared-file-' + i, location.href).href; const res = await c.match(key); if (!res) continue;
      const blob = await res.blob(); files.push(new File([blob], decodeURIComponent(res.headers.get('X-File-Name') || `song${i + 1}.mp3`), { type: blob.type, lastModified: 0 }));
      await c.delete(key);
    }
    await c.delete(cntKey); askImport(files);
  } catch {}
}

/* ---------------- Install ---------------- */
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredPrompt = e; $('#installBtn').classList.remove('hidden'); });
$('#installBtn').onclick = async () => { if (!deferredPrompt) return; deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt = null; $('#installBtn').classList.add('hidden'); };
window.addEventListener('appinstalled', () => $('#installBtn').classList.add('hidden'));
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {});
setInterval(() => { if (!cur().paused) saveQueue(); }, 5000);
window.addEventListener('pagehide', saveQueue);

/* ---------------- Start ---------------- */
(async () => {
  applyI18n(); updateButtons();
  await loadLibrary();
  render();
  const last = store.get('last', null);
  if (S.resume && last?.queue?.length) {
    queue = last.queue.filter((id) => lib.has(id)); fromLabel = last.from || '';
    if (queue.length) {
      qi = clamp(last.qi || 0, 0, queue.length - 1); pendingResume = { pos: last.pos || 0 };
      const tr = curTrack(); await onTrackChange(tr);
      $('#cur').textContent = fmt(pendingResume.pos); $('#dur').textContent = fmt(tr.duration);
      if (tr.duration) { const p = pendingResume.pos / tr.duration * 1000; $('#seek').value = p; $('#seek').style.setProperty('--p', p / 10 + '%'); $('#miniBar').style.width = p / 10 + '%'; }
    }
  }
  receiveShared();
})();

// Small read-only hook used by automated tests
window.__sp03 = { get state() { const el = cur(); return { lib: lib.size, queue: queue.length, qi, id: curId(), title: curTrack()?.title, t: el.currentTime, paused: el.paused, ai, graph: !!ctx, playlists: playlists.length, converted: !!curTrack()?.converted }; } };
