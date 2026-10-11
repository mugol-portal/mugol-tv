const CACHE_NAME = 'mugol-tv-v2';
const APP_SHELL = [
    './',
    './index.html',
    './manifest.json',
    './logo.png',
    './Logo.png',
    './icons/icon-192.png',
    './icons/icon-512.png'
];

// Kurulum: uygulama kabuğunu önbelleğe al
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => Promise.all(
                APP_SHELL.map((url) => cache.add(url).catch(() => {}))
            ))
            .then(() => self.skipWaiting())
    );
});

// Aktivasyon: eski cache sürümlerini temizle
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
        ).then(() => self.clients.claim())
    );
});

// Fetch: sadece kendi origin'imizdeki dosyalar. Önce ağ (güncel sürüm gelsin),
// internet yoksa önbellekten aç. Harici istekler (reklam, logo vb.) dokunulmaz.
self.addEventListener('fetch', (event) => {
    const req = event.request;
    if (req.method !== 'GET') return;

    const url = new URL(req.url);
    if (url.origin !== self.location.origin) return;

    event.respondWith(
        fetch(req)
            .then((res) => {
                if (res && res.status === 200) {
                    const resClone = res.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
                }
                return res;
            })
            .catch(() =>
                caches.match(req).then((cached) =>
                    cached || (req.mode === 'navigate' ? caches.match('./index.html') : undefined)
                )
            )
    );
});
