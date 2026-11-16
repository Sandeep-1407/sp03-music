// SP03 service worker: offline cache + Android "Share to SP02" receiver
const VERSION = 'sp03-v2';
const SHELL = ['./', './index.html', './app.js', './manifest.webmanifest',
  './icon-192.png', './icon-512.png', './maskable-512.png', './favicon.png',
  './db.js', './tags.js', './ffmpeg.js', './classes.js', './const.js', './errors.js', './types.js', './utils.js', './worker.js'];
const SHARE_CACHE = 'sp03-share';

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== VERSION && k !== SHARE_CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method === 'POST' && url.pathname.endsWith('/share-target')) {
    e.respondWith((async () => {
      try {
        const form = await e.request.formData();
        const files = form.getAll('audio').filter((f) => f && f.size);
        const c = await caches.open(SHARE_CACHE);
        const at = (k) => new URL(k, self.registration.scope).href;
        for (let i = 0; i < files.length; i++) {
          await c.put(at('shared-file-' + i), new Response(files[i], {
            headers: { 'Content-Type': files[i].type || 'audio/mpeg', 'X-File-Name': encodeURIComponent(files[i].name || `song${i + 1}.mp3`) }
          }));
        }
        await c.put(at('shared-count'), new Response(String(files.length)));
      } catch (err) {}
      return Response.redirect(new URL('./?shared=1', self.registration.scope).href, 303);
    })());
    return;
  }
  const isEngine = url.hostname === 'cdn.jsdelivr.net' && url.pathname.includes('/@ffmpeg/core@');
  if (e.request.method !== 'GET' || (url.origin !== location.origin && !isEngine)) return;
  if (e.request.headers.has('range')) return;            // let the browser stream media normally
  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request).then((r) => {
      const copy = r.clone(); caches.open(VERSION).then((c) => c.put('./index.html', copy)); return r;
    }).catch(() => caches.match('./index.html')));
    return;
  }
  e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request).then((r) => {
    if (r.ok) { const copy = r.clone(); caches.open(VERSION).then((c) => c.put(e.request, copy)); }
    return r;
  })));
});
