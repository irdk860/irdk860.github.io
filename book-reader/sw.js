// Keeps Book Reader working offline. The page itself is fetched fresh whenever there's a connection,
// so updates show up straight away; the cached copy is only used offline.
const CACHE = 'book-reader-v9';
const SHELL = [
  './', './index.html', './manifest.webmanifest', './apple-touch-icon.png', './icon-192.png', './icon-512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(SHELL.map(u => c.add(new Request(u, {cache: 'reload'})).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE && k !== 'br-flags').map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// GitHub Pages can't send these headers itself, so the service worker adds them. They make the page
// "cross-origin isolated", which lets the voice engine use several processor cores instead of one.
function isolate(r) {
  if (!r || r.type === 'opaque' || r.type === 'opaqueredirect') return r;
  const h = new Headers(r.headers);
  h.set('Cross-Origin-Opener-Policy', 'same-origin');
  h.set('Cross-Origin-Embedder-Policy', 'require-corp');
  return new Response(r.body, {status: r.status, statusText: r.statusText, headers: h});
}
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // the natural-voice model (~90 MB) is stored by the voice engine itself; don't keep a second copy
  if (/(^|\.)(huggingface\.co|hf\.co)$/.test(url.hostname)) return;
  const isPage = req.mode === 'navigate' || (url.origin === location.origin && /\.(html|webmanifest)$|\/$/.test(url.pathname));
  if (isPage) {
    // network first: always get the newest version, fall back to the cache when offline
    const nav = req.mode === 'navigate';
    e.respondWith(caches.open('br-flags').then(c => c.match('noiso')).catch(() => null).then(off => {
      const wrap = r => nav && r && !off ? isolate(r) : r;  // the page can switch isolation off if a library won't load with it
      return fetch(req, {cache: 'no-store'}).then(r => {
        if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
        return wrap(r);
      }).catch(() => caches.match(req).then(r => r || caches.match('./index.html')).then(wrap));
    }));
    return;
  }
  // everything else (library, fonts, icons): cache first, refresh in the background
  e.respondWith(caches.open(CACHE).then(async cache => {
    const hit = await cache.match(req);
    const net = fetch(req).then(r => { if (r && r.ok) cache.put(req, r.clone()); return r; }).catch(() => hit);
    return hit || net;
  }));
});
