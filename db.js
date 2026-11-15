// SP03 – tiny IndexedDB helper (library, song files, cover art, playlists)
const NAME = 'sp03', VERSION = 1;
let dbp = null;

function open() {
  if (!dbp) {
    dbp = new Promise((resolve, reject) => {
      const r = indexedDB.open(NAME, VERSION);
      r.onupgradeneeded = () => {
        const d = r.result;
        if (!d.objectStoreNames.contains('tracks')) d.createObjectStore('tracks', { keyPath: 'id' });
        if (!d.objectStoreNames.contains('blobs')) d.createObjectStore('blobs');
        if (!d.objectStoreNames.contains('art')) d.createObjectStore('art');
        if (!d.objectStoreNames.contains('playlists')) d.createObjectStore('playlists', { keyPath: 'id' });
        if (!d.objectStoreNames.contains('kv')) d.createObjectStore('kv');
      };
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
  }
  return dbp;
}
const req = (r) => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });

export async function get(store, key) {
  const d = await open();
  return req(d.transaction(store).objectStore(store).get(key));
}
export async function all(store) {
  const d = await open();
  return req(d.transaction(store).objectStore(store).getAll());
}
export async function put(store, value, key) {
  const d = await open();
  const t = d.transaction(store, 'readwrite');
  const r = key === undefined ? t.objectStore(store).put(value) : t.objectStore(store).put(value, key);
  await req(r);
  return new Promise((res, rej) => { t.oncomplete = () => res(); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error); });
}
export async function del(store, key) {
  const d = await open();
  const t = d.transaction(store, 'readwrite');
  t.objectStore(store).delete(key);
  return new Promise((res, rej) => { t.oncomplete = () => res(); t.onerror = () => rej(t.error); });
}
export async function clear(store) {
  const d = await open();
  const t = d.transaction(store, 'readwrite');
  t.objectStore(store).clear();
  return new Promise((res, rej) => { t.oncomplete = () => res(); t.onerror = () => rej(t.error); });
}
