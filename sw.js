/* ═══════════════════════════════════════════════════════════════════
   YILDIZ HANEDANI — Service Worker
   FAZ 57: PWA kurulabilirliği için asgari, hafif bir worker.

   Amaç yalnızca "Ana Ekrana Ekle" istemini tetiklemek ve oyunu
   çevrimdışı açılabilir kılmak. Agresif önbellekleme YAPMIYOR:
   geliştirme sırasında eski sürümün takılı kalması en can sıkıcı
   hata türüdür. Strateji "önce ağ, olmazsa önbellek".
   ═══════════════════════════════════════════════════════════════════ */
/* FAZ 74: dosya yapısı değişti — sürüm artırıldı ki eski
   önbellekteki tek parça main.js temizlensin. */
/* FAZ 83: sürüm yükseltildi — eski ve yeni JS dosyalarının
   karışmasını önler; activate'te eskiler siliniyor. */
const CACHE = 'stars-v96h10p57';

/* Oyunun tamamı — hepsi yerel dosya, dış bağımlılık yok */
const KABUK = [
  './',
  './index.html',
  './manifest.json',
  './main.js',
  './map.js',           /* FAZ 74: yeni modüller */
  './combat.js',
  './ui.js',
  './ai.js',
  './diplomacy.js',
  './economy.js', './commerce.js', './commerce-ui.js', './economic-ledger.js', './economy-ui.js',
  './news.js',
  './inbox.js',
  './construction.js',
  './archive-ui.js',
  './audio.js'
];

self.addEventListener('install', ev => {
  /* Kabuk TAM kurulmadan yeni worker etkinleşmemeli. Bir dosya eksikse
     install reddedilir ve çalışan eski sürüm/cache yerinde kalır. */
  ev.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(KABUK))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', ev => {
  ev.waitUntil(
    caches.keys()
      .then(adlar => Promise.all(
        /* Aynı origin'deki başka PWA/cache adlarına dokunma. */
        adlar.filter(a => a.startsWith('stars-v') && a !== CACHE)
             .map(a => caches.delete(a))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', ev => {
  const istek = ev.request;
  if (istek.method !== 'GET') return;
  const url=new URL(istek.url);
  // MP sayfaları, sürüm bilgisi ve içerik kimliği taşıyan betikler her zaman relay'den gelir.
  if(url.origin!==self.location.origin||url.pathname.startsWith('/mp/')||url.pathname.startsWith('/mp1/')||url.searchParams.has('mp-release'))return;

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
      .catch(async () => {
        const cache=await caches.open(CACHE);
        const hit=await cache.match(istek);
        if(hit)return hit;
        if(istek.mode==='navigate')return await cache.match('./index.html')||Response.error();
        return Response.error();
      })
  );
});
