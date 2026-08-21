/* ═══════════════════════════════════════════════════════════════════
   YILDIZ HANEDANI — Service Worker
   FAZ 57: PWA kurulabilirliği için asgari, hafif bir worker.

   Amaç yalnızca "Ana Ekrana Ekle" istemini tetiklemek ve oyunu
   çevrimdışı açılabilir kılmak. Agresif önbellekleme YAPMIYOR:
   geliştirme sırasında eski sürümün takılı kalması en can sıkıcı
   hata türüdür. Strateji "önce ağ, olmazsa önbellek".
   ═══════════════════════════════════════════════════════════════════ */
const CACHE = 'yildiz-hanedani-v1';

/* Oyunun tamamı — hepsi yerel dosya, dış bağımlılık yok */
const KABUK = [
  './',
  './index.html',
  './manifest.json',
  './main.js',
  './ai.js',
  './diplomacy.js',
  './economy.js',
  './audio.js'
];

self.addEventListener('install', ev => {
  /* Yeni sürüm hemen devreye girsin — beklemede kalmasın */
  self.skipWaiting();
  ev.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(KABUK))
      .catch(() => {})          // bir dosya eksikse kurulum yine de sürsün
  );
});

self.addEventListener('activate', ev => {
  ev.waitUntil(
    caches.keys()
      .then(adlar => Promise.all(
        adlar.filter(a => a !== CACHE).map(a => caches.delete(a))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', ev => {
  const istek = ev.request;
  if (istek.method !== 'GET') return;

  /* ÖNCE AĞ: her zaman en güncel dosya gelir. Ağ yoksa
     önbellekten servis edilir — oyun çevrimdışı da açılır. */
  ev.respondWith(
    fetch(istek)
      .then(yanit => {
        if (yanit && yanit.status === 200 && yanit.type === 'basic'){
          const kopya = yanit.clone();
          caches.open(CACHE).then(c => c.put(istek, kopya)).catch(() => {});
        }
        return yanit;
      })
      .catch(() => caches.match(istek).then(v => v || caches.match('./index.html')))
  );
});
