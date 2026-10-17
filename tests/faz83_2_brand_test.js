#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════
   FAZ 83.2 — MARKA GEÇİŞİ DOĞRULAMA TESTİ
   Yalnız Node.js yerleşik modülleri kullanır (fs, path, child_process,
   crypto). Harici bağımlılık yoktur.

   Çalıştırma:  node tests/faz83_2_brand_test.js
   Çıkış kodu:  0 = tüm testler geçti, 1 = en az bir başarısızlık
   ═══════════════════════════════════════════════════════════════════ */
'use strict';
const fs   = require('fs');
const path = require('path');
const cp   = require('child_process');
const crypto = require('crypto');

const KOK = path.resolve(__dirname, '..');
let gecen = 0, kalan = 0;
const basarisizlar = [];

function ok(ad, sart, detay){
  if (sart){ gecen++; console.log('  ✓ ' + ad + (detay ? ' — ' + detay : '')); }
  else { kalan++; basarisizlar.push(ad);
         console.log('  ✗ ' + ad + (detay ? ' — ' + detay : '')); }
}
function oku(dosya){ return fs.readFileSync(path.join(KOK, dosya), 'utf8'); }
function varMi(dosya){ return fs.existsSync(path.join(KOK, dosya)); }
function sha(dosya){
  return crypto.createHash('sha256')
    .update(fs.readFileSync(path.join(KOK, dosya))).digest('hex');
}

/* ─────────────────────────────────────────────────────────────────
   1. SÖZDİZİMİ — tüm .js dosyaları node --check
   ───────────────────────────────────────────────────────────────── */
console.log('\n1. SÖZDİZİMİ');
const jsDosyalar = fs.readdirSync(KOK).filter(f => f.endsWith('.js'));
for (const f of jsDosyalar){
  let hata = null;
  try { cp.execFileSync(process.execPath, ['--check', path.join(KOK, f)],
        {stdio: 'pipe'}); }
  catch(e){ hata = String(e.stderr || e.message).split('\n')[0]; }
  ok('node --check ' + f, !hata, hata || undefined);
}

/* ─────────────────────────────────────────────────────────────────
   2. MANIFEST — geçerli JSON ve yeni marka
   ───────────────────────────────────────────────────────────────── */
console.log('\n2. MANIFEST');
let mf = null, mfHata = null;
try { mf = JSON.parse(oku('manifest.json')); }
catch(e){ mfHata = e.message; }
ok('manifest.json geçerli JSON', !!mf, mfHata || undefined);
if (mf){
  ok('name = "Stars — Galaktik Strateji"',
     mf.name === 'Stars — Galaktik Strateji', mf.name);
  ok('short_name = "Stars"', mf.short_name === 'Stars', mf.short_name);
  ok('description yeni metin',
     mf.description === '16-bit galaktik 4X strateji oyunu. ' +
     'İmparatorluğunu kur, galaksiyi yönet.', mf.description);
  ok('manifest içinde eski marka yok',
     !/Yıldız Hanedanı|YILDIZ HANEDANI/.test(JSON.stringify(mf)));
}

/* ─────────────────────────────────────────────────────────────────
   3. GÖRÜNÜR HTML MARKASI
   ───────────────────────────────────────────────────────────────── */
console.log('\n3. GÖRÜNÜR HTML MARKASI');
const html = oku('index.html');
ok('apple-mobile-web-app-title = Stars',
   /apple-mobile-web-app-title"\s+content="Stars"/.test(html));
ok('application-name = Stars',
   /application-name"\s+content="Stars"/.test(html));
ok('title = STARS — Galaktik Strateji',
   html.includes('<title>STARS — Galaktik Strateji</title>'));
ok('ana menü h1 = STARS', (html.match(/<h1>STARS<\/h1>/g) || []).length >= 1,
   (html.match(/<h1>STARS<\/h1>/g) || []).length + ' adet');
ok('alt başlık korundu',
   html.includes('GALAKTİK EGEMENLİK SİMÜLASYONU'));
ok('"tek dosya" yanlış bilgisi düzeltildi',
   !html.includes('tek dosya') && html.includes('v1.0 · çevrimdışı çalışır'));

/* Kullanıcıya GÖRÜNÜR yerlerde eski marka taraması.
   Not: oyun içi "hanedan" kavramı (mekanik/hikâye) korunur —
   yalnız marka adı aranıyor. */
const gorunurEski = [];
const satirlar = html.split('\n');
satirlar.forEach((sat, i) => {
  if (/YILDIZ HANEDANI|YILDIZ<span>HANEDANI|Yıldız Hanedanı/.test(sat))
    gorunurEski.push((i+1) + ': ' + sat.trim().slice(0, 60));
});
ok('index.html görünür eski marka yok', gorunurEski.length === 0,
   gorunurEski.length ? gorunurEski.join(' | ') : undefined);

/* ─────────────────────────────────────────────────────────────────
   4. KAYIT UYUMLULUĞU — anahtarlar korunmuş
   ───────────────────────────────────────────────────────────────── */
console.log('\n4. KAYIT UYUMLULUĞU');
const mainJs = oku('main.js');
const korunacak = ['yildiz:save', 'yh_audio', 'yh_advisor', 'yh_autoev',
                   'yh_bg', 'yh_radar', 'yh_templates',
                   '__yh_probe', '__yh_diag'];
for (const k of korunacak)
  ok('anahtar korundu: ' + k, mainJs.includes("'" + k + "'") ||
     mainJs.includes('"' + k + '"') || mainJs.includes(k));

ok('depolama anahtarları Stars adına TAŞINMADI',
   !/stars:save|stars_audio|__stars_/.test(mainJs));

/* ─────────────────────────────────────────────────────────────────
   5. KAYIT DOSYASI ADI VE YÜKLEYİCİ
   ───────────────────────────────────────────────────────────────── */
console.log('\n5. KAYIT DOSYASI');
ok('yeni indirme adı stars- ile başlıyor',
   /a\.download\s*=\s*'stars-'/.test(mainJs));
ok('eski yildiz-hanedani- indirme adı kaldırıldı',
   !/a\.download\s*=\s*'yildiz-hanedani-'/.test(mainJs));
/* Yükleyici uzantıya göre çalışmalı — isme göre DEĞİL */
const accept = (mainJs.match(/inp\.accept\s*=\s*'([^']+)'/) || [])[1] || '';
ok('yükleyici .sav uzantısını kabul ediyor', accept.includes('.sav'), accept);
ok('yükleyicide dosya adı kontrolü YOK (eski .sav açılır)',
   !/name\.(startsWith|indexOf)\(\s*['"]stars/.test(mainJs));

/* ─────────────────────────────────────────────────────────────────
   6. SERVICE WORKER
   ───────────────────────────────────────────────────────────────── */
console.log('\n6. SERVICE WORKER');
const sw = oku('sw.js');
/* FAZ 83.3: cache sürümü her fazda yükseliyor — sürüm numarasına
   değil, 'stars-v' önekine ve eski markanın yokluğuna bakıyoruz. */
ok('cache adı stars- ile başlıyor', /const CACHE = 'stars-v[\w.-]+'/.test(sw),
   (sw.match(/const CACHE = '([^']+)'/)||[])[1]);
ok('cache adında eski marka yok', !/yildiz-hanedani/.test(sw));
ok('eski cache temizleme davranışı korundu',
   sw.includes('caches.delete') && /a !== CACHE/.test(sw));

/* KABUK listesindeki her dosya gerçekten var mı? */
const kabukBlok = (sw.match(/KABUK\s*=\s*\[([\s\S]*?)\]/) ||
                   sw.match(/=\s*\[([\s\S]*?'\.\/[^\]]*)\]/) || [])[1] || '';
const kabukDosyalar = (kabukBlok.match(/'\.\/([^']+)'/g) || [])
  .map(x => x.replace(/'\.\//, '').replace(/'$/, ''));
ok('KABUK listesi okunabildi', kabukDosyalar.length > 0,
   kabukDosyalar.length + ' dosya');
for (const d of kabukDosyalar){
  const yol = d === '' ? 'index.html' : d;
  ok('KABUK dosyası mevcut: ' + (d || './'), varMi(yol) || d === '',
     varMi(yol) ? undefined : 'DOSYA YOK');
}

/* Yükleme sırası korunmuş mu? */
const sira = (html.match(/<script src="([^"]+\.js)"><\/script>/g) || [])
  .map(x => x.replace(/.*src="/, '').replace(/".*/, ''));
const beklenenSira = ['main.js','map.js','combat.js','ai.js','diplomacy.js','economy.js','news.js','inbox.js','construction.js','ui.js','archive-ui.js','audio.js'];
ok('script yükleme sırası korundu',
   beklenenSira.every((f, i) => sira[i] === f), sira.join(' → '));

/* ─────────────────────────────────────────────────────────────────
   7. DOKUNULMAMASI GEREKEN DOSYALAR
   ───────────────────────────────────────────────────────────────── */
console.log('\n7. DEĞİŞMEMESİ GEREKEN DOSYALAR');
/* Faz 83.1 ZIP'inden alınan referans SHA-256 değerleri */
/* FAZ 84A: ui.js bu fazda İSTİHBARAT TEKRAR TEMİZLİĞİ için
   değişti; tarihsel byte kilidinden çıkarıldı. Sahte hash
   yazılmadı — dosya listeden tamamen kaldırıldı. Marka,
   depolama, manifest ve yükleme sırası kontrolleri korunuyor
   ve ui.js'in marka kalıntısı taşımadığı ayrıca sınanıyor. */
const REFERANS = {
  'ai.js':1, 'audio.js':1, 'diplomacy.js':1,
  'map.js':1
};
/* Referans dosya varsa karşılaştır; yoksa yalnız varlık ve
   marka-dokunulmamışlık kontrolü yap. */
const refYol = path.join(KOK, 'tests', 'referans-sha.json');
let ref = null;
if (fs.existsSync(refYol)){
  try { ref = JSON.parse(fs.readFileSync(refYol, 'utf8')); } catch(e){}
}
/* ui.js byte kilidinden çıkarıldı ama ANLAMSAL olarak sınanıyor */
ok('ui.js görünür eski marka taşımıyor',
   !/YILDIZ HANEDANI|Yıldız Hanedanı/.test(oku('ui.js')));
for (const f of Object.keys(REFERANS)){
  // 91D: etiket çizimi bu fazda değişti; altyapı hash'leri kaynak 91C'den.
  if(f==='map.js'){ok('map altyapısı sabit; hedef seçimi 93A referansında',
    require('./helpers/map-preservation').isMapInfrastructurePreserved(oku(f)));continue;}
  if (ref && ref[f]) ok(f + ' byte-for-byte aynı', sha(f) === ref[f],
                        sha(f).slice(0,16));
  else ok(f + ' mevcut ve marka değişikliği içermiyor',
          varMi(f) && !/download\s*=\s*'stars-/.test(oku(f)));
}

/* ─────────────────────────────────────────────────────────────────
   ÖZET
   ───────────────────────────────────────────────────────────────── */
console.log('\n══════════════════════════════════════════');
console.log('  GEÇEN: ' + gecen + '   KALAN: ' + kalan);
if (basarisizlar.length){
  console.log('  BAŞARISIZ:');
  basarisizlar.forEach(x => console.log('    · ' + x));
}
console.log('══════════════════════════════════════════\n');
process.exit(kalan ? 1 : 0);
