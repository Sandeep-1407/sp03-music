// SP03 – read song details from the file itself:
// title, artist, album, genre, year, track no., cover art, lyrics, duration (when cheap)
// Supports ID3v1/ID3v2 (MP3, WAV, AIFF), MP4/M4A atoms, FLAC and OGG/Opus Vorbis comments.

const latin1 = new TextDecoder('windows-1252');
const utf8 = new TextDecoder('utf-8');
const utf16le = new TextDecoder('utf-16le');
const utf16be = new TextDecoder('utf-16be');

async function read(file, start, len) {
  const end = Math.min(file.size, start + len);
  if (start >= end) return new Uint8Array(0);
  return new Uint8Array(await file.slice(start, end).arrayBuffer());
}
const str = (u8, a, b) => latin1.decode(u8.subarray(a, b));
const be32 = (u8, o) => ((u8[o] << 24) >>> 0) + (u8[o + 1] << 16) + (u8[o + 2] << 8) + u8[o + 3];
const le32 = (u8, o) => (u8[o] | (u8[o + 1] << 8) | (u8[o + 2] << 16) | (u8[o + 3] << 24)) >>> 0;
const syncsafe = (u8, o) => (u8[o] << 21) | (u8[o + 1] << 14) | (u8[o + 2] << 7) | u8[o + 3];
const clean = (s) => (s || '').replace(/\0+$/g, '').replace(/\0/g, ' / ').trim();

const GENRES = ['Blues', 'Classic Rock', 'Country', 'Dance', 'Disco', 'Funk', 'Grunge', 'Hip-Hop', 'Jazz', 'Metal', 'New Age', 'Oldies', 'Other', 'Pop', 'R&B', 'Rap', 'Reggae', 'Rock', 'Techno', 'Industrial', 'Alternative', 'Ska', 'Death Metal', 'Pranks', 'Soundtrack', 'Euro-Techno', 'Ambient', 'Trip-Hop', 'Vocal', 'Jazz+Funk', 'Fusion', 'Trance', 'Classical', 'Instrumental', 'Acid', 'House', 'Game', 'Sound Clip', 'Gospel', 'Noise', 'AlternRock', 'Bass', 'Soul', 'Punk', 'Space', 'Meditative', 'Instrumental Pop', 'Instrumental Rock', 'Ethnic', 'Gothic', 'Darkwave', 'Techno-Industrial', 'Electronic', 'Pop-Folk', 'Eurodance', 'Dream', 'Southern Rock', 'Comedy', 'Cult', 'Gangsta', 'Top 40', 'Christian Rap', 'Pop/Funk', 'Jungle', 'Native American', 'Cabaret', 'New Wave', 'Psychadelic', 'Rave', 'Showtunes', 'Trailer', 'Lo-Fi', 'Tribal', 'Acid Punk', 'Acid Jazz', 'Polka', 'Retro', 'Musical', 'Rock & Roll', 'Hard Rock'];
function fixGenre(g) {
  g = clean(g);
  const m = /^\(?(\d{1,3})\)?/.exec(g);
  if (m && GENRES[+m[1]] && (g === m[0] || /^\(\d+\)$/.test(m[0]))) return GENRES[+m[1]];
  return g;
}

/* ---------- ID3v2 ---------- */
function decodeText(enc, u8) {
  if (!u8.length) return '';
  if (enc === 0) return latin1.decode(u8);
  if (enc === 3) return utf8.decode(u8);
  if (enc === 2) return utf16be.decode(u8);
  // UTF-16 with BOM
  if (u8[0] === 0xFE && u8[1] === 0xFF) return utf16be.decode(u8.subarray(2));
  if (u8[0] === 0xFF && u8[1] === 0xFE) return utf16le.decode(u8.subarray(2));
  return utf16le.decode(u8);
}
function findTerm(u8, start, enc) {
  if (enc === 1 || enc === 2) {
    for (let i = start; i + 1 < u8.length; i += 2) if (u8[i] === 0 && u8[i + 1] === 0) return i;
  } else {
    for (let i = start; i < u8.length; i++) if (u8[i] === 0) return i;
  }
  return u8.length;
}
function unsync(u8) {
  const out = []; for (let i = 0; i < u8.length; i++) { out.push(u8[i]); if (u8[i] === 0xFF && u8[i + 1] === 0x00) i++; }
  return new Uint8Array(out);
}
async function parseID3v2(file, offset, out) {
  const h = await read(file, offset, 10);
  if (h.length < 10 || str(h, 0, 3) !== 'ID3') return false;
  const ver = h[3], flags = h[5], size = syncsafe(h, 6);
  let u8 = await read(file, offset + 10, size);
  if (flags & 0x80 && ver < 4) u8 = unsync(u8);
  let p = 0;
  if (flags & 0x40) p = ver === 4 ? syncsafe(u8, 0) : be32(u8, 0) + 4;
  const idLen = ver === 2 ? 3 : 4, hdrLen = ver === 2 ? 6 : 10;
  while (p + hdrLen < u8.length) {
    const id = str(u8, p, p + idLen);
    if (!/^[A-Z0-9]+$/.test(id)) break;
    const fsize = ver === 2 ? (u8[p + 3] << 16) | (u8[p + 4] << 8) | u8[p + 5] : ver === 4 ? syncsafe(u8, p + 4) : be32(u8, p + 4);
    const fflags = ver === 2 ? 0 : u8[p + 9];
    let d = u8.subarray(p + hdrLen, p + hdrLen + fsize);
    p += hdrLen + fsize;
    if (!fsize) continue;
    if (ver === 4 && fflags & 0x02) d = unsync(d);
    if (ver === 4 && fflags & 0x01) d = d.subarray(4);
    const T = (key) => { const v = clean(decodeText(d[0], d.subarray(1))); if (v && !out[key]) out[key] = v; };
    switch (id) {
      case 'TIT2': case 'TT2': T('title'); break;
      case 'TPE1': case 'TP1': T('artist'); break;
      case 'TPE2': case 'TP2': T('albumArtist'); break;
      case 'TALB': case 'TAL': T('album'); break;
      case 'TCON': case 'TCO': T('genre'); break;
      case 'TYER': case 'TYE': case 'TDRC': T('year'); break;
      case 'TRCK': case 'TRK': T('track'); break;
      case 'USLT': case 'ULT': {
        const enc = d[0]; const e = findTerm(d, 4, enc); const skip = enc === 1 || enc === 2 ? 2 : 1;
        const txt = decodeText(enc, d.subarray(e + skip)).trim(); if (txt && !out.lyrics) out.lyrics = txt; break;
      }
      case 'APIC': case 'PIC': {
        if (out.picture) break;
        const enc = d[0]; let q, mime;
        if (id === 'PIC') { mime = 'image/' + str(d, 1, 4).toLowerCase().replace('jpg', 'jpeg'); q = 4; }
        else { const e = findTerm(d, 1, 0); mime = str(d, 1, e) || 'image/jpeg'; q = e + 1; }
        q += 1; // picture type
        const e2 = findTerm(d, q, enc); q = e2 + (enc === 1 || enc === 2 ? 2 : 1);
        if (!mime.includes('/')) mime = 'image/' + mime.toLowerCase();
        out.picture = new Blob([d.slice(q)], { type: mime }); break;
      }
    }
  }
  if (out.genre) out.genre = fixGenre(out.genre);
  return true;
}
async function parseID3v1(file, out) {
  if (file.size < 128) return;
  const u8 = await read(file, file.size - 128, 128);
  if (str(u8, 0, 3) !== 'TAG') return;
  const f = (a, b) => clean(latin1.decode(u8.subarray(a, b)));
  out.title ||= f(3, 33); out.artist ||= f(33, 63); out.album ||= f(63, 93); out.year ||= f(93, 97);
  if (!out.genre && GENRES[u8[127]]) out.genre = GENRES[u8[127]];
  if (!out.track && u8[125] === 0 && u8[126]) out.track = String(u8[126]);
}

/* ---------- MP4 / M4A ---------- */
async function parseMP4(file, out) {
  let pos = 0, moov = null;
  while (pos + 8 <= file.size) {
    const h = await read(file, pos, 16);
    let size = be32(h, 0); const type = str(h, 4, 8); let hl = 8;
    if (size === 1) { size = be32(h, 8) * 4294967296 + be32(h, 12); hl = 16; }
    else if (size === 0) size = file.size - pos;
    if (size < hl) break;
    if (type === 'moov') { if (size > 64e6) break; moov = await read(file, pos + hl, size - hl); break; }
    pos += size;
  }
  if (!moov) return;
  const boxes = (u8, a, b, cb) => {
    let p = a;
    while (p + 8 <= b) {
      const s = be32(u8, p); const t = str(u8, p + 4, p + 8);
      if (s < 8 || p + s > b) break;
      cb(t, p + 8, p + s); p += s;
    }
  };
  boxes(moov, 0, moov.length, (t, a, b) => {
    if (t === 'mvhd') {
      const v = moov[a];
      const ts = v === 1 ? be32(moov, a + 20) : be32(moov, a + 12);
      const du = v === 1 ? be32(moov, a + 24) * 4294967296 + be32(moov, a + 28) : be32(moov, a + 16);
      if (ts) out.duration = du / ts;
    }
    if (t !== 'udta') return;
    boxes(moov, a, b, (t2, a2, b2) => {
      if (t2 !== 'meta') return;
      boxes(moov, a2 + 4, b2, (t3, a3, b3) => {
        if (t3 !== 'ilst') return;
        boxes(moov, a3, b3, (key, a4, b4) => {
          boxes(moov, a4, b4, (dt, a5, b5) => {
            if (dt !== 'data') return;
            const kind = be32(moov, a5) & 0xFFFFFF; const payload = moov.subarray(a5 + 8, b5);
            const txt = () => clean(utf8.decode(payload));
            switch (key) {
              case '©nam': out.title ||= txt(); break;
              case '©ART': out.artist ||= txt(); break;
              case 'aART': out.albumArtist ||= txt(); break;
              case '©alb': out.album ||= txt(); break;
              case '©gen': out.genre ||= txt(); break;
              case 'gnre': if (!out.genre && payload.length >= 2) out.genre = GENRES[((payload[0] << 8) | payload[1]) - 1] || ''; break;
              case '©day': out.year ||= txt().slice(0, 4); break;
              case 'trkn': if (payload.length >= 4) out.track ||= String((payload[2] << 8) | payload[3]); break;
              case '©lyr': out.lyrics ||= utf8.decode(payload).trim(); break;
              case 'covr': if (!out.picture) out.picture = new Blob([payload.slice()], { type: kind === 14 ? 'image/png' : 'image/jpeg' }); break;
            }
          });
        });
      });
    });
  });
}

/* ---------- Vorbis comments (FLAC / OGG / Opus) ---------- */
function vorbisComments(u8, p, out) {
  const vlen = le32(u8, p); p += 4 + vlen;
  const n = le32(u8, p); p += 4;
  for (let i = 0; i < n && p + 4 <= u8.length; i++) {
    const len = le32(u8, p); p += 4;
    const s = utf8.decode(u8.subarray(p, p + len)); p += len;
    const eq = s.indexOf('='); if (eq < 0) continue;
    const k = s.slice(0, eq).toUpperCase(), v = s.slice(eq + 1).trim();
    if (k === 'TITLE') out.title ||= v; else if (k === 'ARTIST') out.artist ||= v; else if (k === 'ALBUM') out.album ||= v;
    else if (k === 'ALBUMARTIST') out.albumArtist ||= v; else if (k === 'GENRE') out.genre ||= v;
    else if (k === 'DATE' || k === 'YEAR') out.year ||= v.slice(0, 4); else if (k === 'TRACKNUMBER') out.track ||= v;
    else if (k === 'LYRICS' || k === 'UNSYNCEDLYRICS') out.lyrics ||= v;
    else if (k === 'METADATA_BLOCK_PICTURE' && !out.picture) {
      try { const b = Uint8Array.from(atob(v), (c) => c.charCodeAt(0)); flacPicture(b, 0, out); } catch {}
    }
  }
}
function flacPicture(u8, p, out) {
  p += 4; const ml = be32(u8, p); p += 4; const mime = str(u8, p, p + ml) || 'image/jpeg'; p += ml;
  const dl = be32(u8, p); p += 4 + dl + 16; const len = be32(u8, p); p += 4;
  out.picture = new Blob([u8.slice(p, p + len)], { type: mime });
}
async function parseFLAC(file, out) {
  let pos = 4;
  for (let guard = 0; guard < 64; guard++) {
    const h = await read(file, pos, 4); if (h.length < 4) break;
    const last = h[0] & 0x80, type = h[0] & 0x7F, len = (h[1] << 16) | (h[2] << 8) | h[3];
    if (type === 0 || type === 4 || (type === 6 && !out.picture)) {
      const d = await read(file, pos + 4, len);
      if (type === 0) {
        const sr = (d[10] << 12) | (d[11] << 4) | (d[12] >> 4);
        const total = (d[13] & 0x0F) * 4294967296 + be32(d, 14);
        if (sr && total) out.duration = total / sr;
      } else if (type === 4) vorbisComments(d, 0, out);
      else flacPicture(d, 0, out);
    }
    pos += 4 + len; if (last) break;
  }
}
async function parseOGG(file, out) {
  // Rebuild packet data from the first pages (comment header may span pages)
  const u8 = await read(file, 0, 512 * 1024);
  const chunks = []; let p = 0;
  while (p + 27 < u8.length && str(u8, p, p + 4) === 'OggS') {
    const segs = u8[p + 26]; let len = 0;
    for (let i = 0; i < segs; i++) len += u8[p + 27 + i];
    chunks.push(u8.subarray(p + 27 + segs, p + 27 + segs + len));
    p += 27 + segs + len;
  }
  const all = new Uint8Array(chunks.reduce((a, c) => a + c.length, 0)); let o = 0;
  for (const c of chunks) { all.set(c, o); o += c.length; }
  const text = latin1.decode(all.subarray(0, Math.min(all.length, 200000)));
  let i = text.indexOf('OpusTags'); if (i >= 0) { vorbisComments(all, i + 8, out); return; }
  i = text.indexOf('\x03vorbis'); if (i >= 0) vorbisComments(all, i + 7, out);
}


/* ---------- ASF (WMA / WMV) ---------- */
const hex = (u8, o) => Array.from(u8.subarray(o, o + 16), (b) => b.toString(16).padStart(2, '0')).join('');
const ASF_HEADER = '3026b2758e66cf11a6d900aa0062ce6c', ASF_CONTENT = '3326b2758e66cf11a6d900aa0062ce6c',
  ASF_EXT = '40a4d0d207e3d21197f000a0c95ea850', ASF_FILE = 'a1dcab8c47a9cf118ee400c00c205365';
const le16 = (u8, o) => u8[o] | (u8[o + 1] << 8);
const le64 = (u8, o) => le32(u8, o) + le32(u8, o + 4) * 4294967296;
const u16 = (u8, a, len) => clean(utf16le.decode(u8.subarray(a, a + len)));
async function parseASF(file, out) {
  const h = await read(file, 0, 30);
  if (hex(h, 0) !== ASF_HEADER) return;
  const size = Math.min(le64(h, 16), 16 * 1024 * 1024);
  const u8 = await read(file, 0, size);
  const n = le32(u8, 24); let p = 30;
  for (let i = 0; i < n && p + 24 <= u8.length; i++) {
    const g = hex(u8, p), osz = le64(u8, p + 16), d = p + 24;
    if (g === ASF_CONTENT) {
      const tl = le16(u8, d), al = le16(u8, d + 2); let q = d + 10;
      out.title ||= u16(u8, q, tl); q += tl; out.artist ||= u16(u8, q, al);
    } else if (g === ASF_FILE) {
      const dur = le64(u8, d + 40) / 1e7, pre = le64(u8, d + 56) / 1000;
      if (dur) out.duration = Math.max(0, dur - pre);
    } else if (g === ASF_EXT) {
      const cnt = le16(u8, d); let q = d + 2;
      for (let k = 0; k < cnt && q < d + osz; k++) {
        const nl = le16(u8, q); const name = u16(u8, q + 2, nl); q += 2 + nl;
        const vt = le16(u8, q), vl = le16(u8, q + 2); const v = u8.subarray(q + 4, q + 4 + vl); q += 4 + vl;
        const val = () => (vt === 0 ? clean(utf16le.decode(v)) : vt === 3 ? String(le32(v, 0)) : vt === 5 ? String(le16(v, 0)) : '');
        if (name === 'WM/AlbumTitle') out.album ||= val();
        else if (name === 'WM/AlbumArtist') out.albumArtist ||= val();
        else if (name === 'WM/Genre') out.genre ||= val();
        else if (name === 'WM/Year') out.year ||= val();
        else if (name === 'WM/TrackNumber' || name === 'WM/Track') out.track ||= val();
        else if (name === 'WM/Lyrics') out.lyrics ||= val();
        else if (name === 'WM/Picture' && vt === 1 && !out.picture) {
          let r = 5; let e = r; while (e + 1 < v.length && (v[e] || v[e + 1])) e += 2;
          const mime = utf16le.decode(v.subarray(r, e)) || 'image/jpeg'; r = e + 2;
          e = r; while (e + 1 < v.length && (v[e] || v[e + 1])) e += 2; r = e + 2;
          out.picture = new Blob([v.slice(r)], { type: mime });
        }
      }
    }
    if (!osz) break; p += osz;
  }
}

/* ---------- entry ---------- */
export async function readTags(file) {
  const out = {};
  try {
    const head = await read(file, 0, 16);
    const magic = str(head, 0, 4);
    if (str(head, 0, 3) === 'ID3') await parseID3v2(file, 0, out);
    else if (magic === 'fLaC') await parseFLAC(file, out);
    else if (magic === 'OggS') await parseOGG(file, out);
    else if (str(head, 4, 8) === 'ftyp') await parseMP4(file, out);
    else if (hex(head.length >= 16 ? head : await read(file, 0, 16), 0) === ASF_HEADER) await parseASF(file, out);
    else if (magic === 'RIFF' || magic === 'FORM') {
      // WAV/AIFF may carry an "id3 " chunk
      const u8 = await read(file, 12, Math.min(file.size, 4 * 1024 * 1024));
      const txt = latin1.decode(u8); const k = txt.search(/id3 |ID3 /);
      if (k >= 0) await parseID3v2(file, 12 + k + 8, out);
    }
    if (!out.title || !out.artist) await parseID3v1(file, out);
  } catch (e) { /* bad tags: fall back to file name */ }
  if (out.track) out.track = parseInt(out.track, 10) || '';
  return out;
}

/* LRC lyrics: "[mm:ss.xx] line" → [{t, text}] ; plain text → null (unsynced) */
export function parseLRC(text) {
  if (!text) return null;
  const lines = []; let offset = 0;
  for (const raw of text.replace(/\r/g, '').split('\n')) {
    const off = /^\[offset:\s*([+-]?\d+)\]/i.exec(raw); if (off) { offset = +off[1] / 1000; continue; }
    const stamps = [...raw.matchAll(/\[(\d{1,3}):(\d{1,2}(?:[.:]\d{1,3})?)\]/g)];
    if (!stamps.length) continue;
    const txt = raw.replace(/\[[^\]]*\]/g, '').trim();
    for (const s of stamps) lines.push({ t: +s[1] * 60 + parseFloat(s[2].replace(':', '.')) - offset, text: txt });
  }
  return lines.length ? lines.sort((a, b) => a.t - b.t) : null;
}
