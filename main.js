'use strict';
/* =====================================================================
   YILDIZ HANEDANI — çekirdek veriler
   ===================================================================== */

/* ---------- yardımcılar ---------- */
/* ═══════════════════════════════════════════════════════════════════
   YILDIZ HANEDANI · main.js — ÇEKİRDEK
   Sabitler, galaksi üretimi, filolar, muharebe, çizim, arayüz, ana döngü.
   İLK yüklenmelidir: tüm veri sabitleri burada tanımlanır.
   ═══════════════════════════════════════════════════════════════════ */

const $  = id => document.getElementById(id);
const clamp = (v,a,b) => v<a?a:v>b?b:v;
const lerp  = (a,b,t) => a+(b-a)*t;
const dist  = (a,b) => Math.hypot(a.x-b.x, a.y-b.y);
const fmt = n => {
  n = Math.round(n);
  if (Math.abs(n) >= 1e6) return (n/1e6).toFixed(1)+'M';
  if (Math.abs(n) >= 10000) return (n/1000).toFixed(1)+'K';
  return ''+n;
};
const sgn = n => (n>=0?'+':'') + (Math.abs(n)<10 ? n.toFixed(1) : Math.round(n));
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

function mulberry32(a){
  return function(){
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a>>>15, 1 | a);
    t = t + Math.imul(t ^ t>>>7, 61 | t) ^ t;
    return ((t ^ t>>>14) >>> 0) / 4294967296;
  };
}
function hash2(x,y,s){
  let h = x*374761393 + y*668265263 + s*1274126177;
  h = (h ^ (h>>>13)) >>> 0;
  h = Math.imul(h, 1274126177);
  return ((h ^ (h>>>16)) >>> 0) / 4294967296;
}
function vnoise(x,y,s){
  const xi=Math.floor(x), yi=Math.floor(y), xf=x-xi, yf=y-yi;
  const u=xf*xf*(3-2*xf), v=yf*yf*(3-2*yf);
  const a=hash2(xi,yi,s), b=hash2(xi+1,yi,s), c=hash2(xi,yi+1,s), d=hash2(xi+1,yi+1,s);
  return lerp(lerp(a,b,u), lerp(c,d,u), v);
}
function fbm(x,y,s,oct){
  let v=0, amp=.5, f=1, tot=0;
  for(let i=0;i<(oct||4);i++){ v+=vnoise(x*f,y*f,s+i*37)*amp; tot+=amp; amp*=.5; f*=2; }
  return v/tot;
}
/* --- tohumlanabilir küresel rastgelelik (deterministik oyun + test) --- */
let RND_STATE = 1;
function rndSeed(v){ RND_STATE = (v|0) || 1; }
function rnd(){
  RND_STATE = RND_STATE + 0x6D2B79F5 | 0;
  let t = Math.imul(RND_STATE ^ RND_STATE>>>15, 1 | RND_STATE);
  t = t + Math.imul(t ^ t>>>7, 61 | t) ^ t;
  return ((t ^ t>>>14) >>> 0) / 4294967296;
}

function pick(rnd, arr){ return arr[Math.floor(rnd()*arr.length)|0]; }
function shuffle(rnd, arr){
  for(let i=arr.length-1;i>0;i--){ const j=Math.floor(rnd()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]]; }
  return arr;
}

/* ---------- kaynaklar ---------- */
const RES = {
  min:{n:'Mineral',   k:'MİN', c:'#c98d4a', ico:'◆'},
  ene:{n:'Enerji',    k:'ENJ', c:'#f2d452', ico:'⚡'},
  yiy:{n:'Yiyecek',   k:'YİY', c:'#65e08a', ico:'❋'},
  ala:{n:'Alaşım',    k:'ALŞ', c:'#9fb6cc', ico:'▰'},
  ara:{n:'Araştırma', k:'ARŞ', c:'#8b7bff', ico:'✦'},
  tuk:{n:'Tüketim Malı', k:'TÜK', c:'#e0a8ff', ico:'❖'},
  etk:{n:'Etki',      k:'ETK', c:'#6ff2c8', ico:'◈'}
};
/* kaynak rozeti — her yerde aynı görünsün */
function resTag(r, v){
  const d = RES[r];
  return '<span class="rt" style="color:'+d.c+'">'+d.ico+(v!==undefined?' '+v:'')+'</span>';
}

/* ---------- gezegen türleri ---------- */
/* ═══════════════════════════════════════════════════════════════════
   FAZ 59 — CSS GEZEGEN KÜRESİ
   Eski yol 26–34 px'lik bir sprite'ı büyütüyordu (imageSmoothing
   kapalı) — pikselli ve bulanık görünüyordu. Artık gezegen saf CSS:
     · radial-gradient  → küresel gölgelendirme, sol üstten ışık
     · ikinci gradient  → yüzey lekeleri (kıta/bulut hissi)
     · box-shadow       → atmosfer ışıması + iç terminatör (gece yüzü)
   Vektörel olduğu için her ölçekte pürüzsüz; dış dosya yok,
   canvas yok, çizim maliyeti sıfır.
   ═══════════════════════════════════════════════════════════════════ */
function planetOrb(tip, seed, boyut){
  const P = PLANETS[tip];
  const d = boyut || 34;
  if (!P || !P.pal) return `<span style="display:inline-block;width:${d}px;height:${d}px"></span>`;
  const pal = P.pal;
  const koyu = pal[0], orta = pal[2] || pal[1], acik = pal[4] || pal[3] || pal[2];

  /* Tohumdan sabit bir "yüzey dönüşü" — aynı gezegen hep aynı görünür */
  const sd = ((seed || 0) * 2654435761) >>> 0;
  const ax = 28 + (sd % 22);              // ışık kaynağı x (%)
  const ay = 24 + ((sd >> 5) % 18);       // ışık kaynağı y (%)
  const lx = 30 + ((sd >> 9) % 44);       // leke merkezi
  const ly = 34 + ((sd >> 14) % 38);

  /* Gaz devi ve yıldız türleri için farklı doku */
  const gaz = P.k === 'gaz' || tip === 'gaz';
  const leke = gaz
    ? `radial-gradient(120% 32% at 50% ${ly}%, ${acik}44 0 18%, transparent 19%),
       radial-gradient(120% 26% at 50% ${(ly+26)%80+10}%, ${koyu}55 0 16%, transparent 17%),`
    : `radial-gradient(38% 30% at ${lx}% ${ly}%, ${acik}55 0 40%, transparent 62%),
       radial-gradient(30% 24% at ${(lx+38)%80+8}% ${(ly+30)%70+12}%, ${koyu}66 0 44%, transparent 66%),`;

  return `<span class="pOrb" style="
    width:${d}px;height:${d}px;
    background:
      ${leke}
      radial-gradient(circle at ${ax}% ${ay}%,
        ${acik} 0%, ${orta} 38%, ${pal[1]} 62%, ${koyu} 88%, #01030a 100%);
    box-shadow:
      inset ${Math.round(-d*0.18)}px ${Math.round(-d*0.10)}px ${Math.round(d*0.34)}px rgba(2,4,10,.86),
      inset ${Math.round(d*0.08)}px ${Math.round(d*0.06)}px ${Math.round(d*0.18)}px ${acik}22,
      0 0 ${Math.round(d*0.30)}px ${orta}4d,
      0 0 ${Math.round(d*0.10)}px ${acik}33;
  "></span>`;
}

const PLANETS = {
  col :{n:'Çöl',        k:'hab', ik:'kuru',  pal:['#3a2a17','#7a5a2c','#c99a4e','#e8c079','#f7e6b4'], f:'land'},
  kur :{n:'Kurak',      k:'hab', ik:'kuru',  pal:['#3d2b20','#7d5237','#b8794a','#d9a271','#f0cd9f'], f:'land'},
  sav :{n:'Savan',      k:'hab', ik:'kuru',  pal:['#2b3318','#57682b','#8a9b45','#b6c271','#e3e7ae'], f:'ocean'},
  oky :{n:'Okyanus',    k:'hab', ik:'islak', pal:['#07243f','#0d4470','#1f74ab','#4aa8d8','#b1e6f7'], f:'ocean'},
  tro :{n:'Tropik',     k:'hab', ik:'islak', pal:['#0b2a24','#155c3d','#2f8c4a','#63b562','#bde79f'], f:'ocean'},
  sul :{n:'Sulakalan',  k:'hab', ik:'islak', pal:['#141f18','#2c4a34','#4d7549','#79a06a','#c3d8a6'], f:'ocean'},
  tun :{n:'Tundra',     k:'hab', ik:'soguk', pal:['#1b2430','#38495a','#5f7285','#93a5b4','#dde8f1'], f:'ice'},
  kut :{n:'Kutup',      k:'hab', ik:'soguk', pal:['#20303f','#3d5b73','#7297ae','#aac9db','#f2fcff'], f:'ice'},
  alp :{n:'Alpin',      k:'hab', ik:'soguk', pal:['#1d2a26','#37514a','#5b7b6c','#8fae96','#e0efe3'], f:'ice'},
  gay :{n:'Gaia',       k:'hab', ik:'gaia',  pal:['#0a2b2a','#12674f','#2fa062','#7ad07a','#dcf6c0'], f:'ocean', rare:1},
  mak :{n:'Makine Dünyası',k:'hab',ik:'makine',pal:['#12161c','#2b333f','#4c5a6b','#7b8fa3','#d5e8f6'],f:'city', rare:1},
  cor :{n:'Çorak',      k:'olu', pal:['#231d18','#4a3d31','#786351','#a08872','#d0bba3'], f:'crater'},
  buz :{n:'Buzul',      k:'olu', pal:['#1a222c','#37485b','#61798f','#9ab3c6','#e6f4fd'], f:'crater'},
  vol :{n:'Volkanik',   k:'olu', pal:['#1a0d09','#4a1a10','#8c2c12','#d9541a','#ffbf55'], f:'lava'},
  tok :{n:'Toksik',     k:'olu', pal:['#151f0f','#31491a','#5f7d1f','#96b13a','#d9e588'], f:'lava'},
  gaz :{n:'Gaz Devi',   k:'gaz', pal:['#2a1c10','#6b4520','#ab7133','#d9a55c','#f6dfab'], f:'bands'},
  bzd :{n:'Buz Devi',   k:'gaz', pal:['#0e2130','#1d4a63','#2e7d9b','#63b1c9','#caf0f7'], f:'bands'},
  ast :{n:'Asteroit Kuşağı',k:'ast', pal:['#1a1713','#3a332b','#5e5346','#857763','#b8aa94'], f:'belt'}
};
const HAB_TYPES = Object.keys(PLANETS).filter(k=>PLANETS[k].k==='hab' && !PLANETS[k].rare);
const DEAD_TYPES = ['cor','buz','vol','tok'];
const CLIMATES = {kuru:'Kuru', islak:'Islak', soguk:'Soğuk', gaia:'Gaia', makine:'Makine'};

/* ---------- LÜKS MALLAR ----------
   Galakside her mal yalnızca birkaç gezegende bulunur. Koloni kurunca
   otomatik üretilir (bina gerekmez). Bonus tekel mantığıyla çalışır:
   aynı maldan 5 tane olması bonusu artırmaz — ÇEŞİT toplarsın.
   Elinde olmayanı ticaret anlaşmasıyla dışarıdan alırsın.        */
const LUXURY = {
  zerrin :{n:'Zerrin Baharatı', ico:'✿', c:'#ff9b3d', e:{stab:9},
           d:'Halk mutlu: tüm kolonilerde +9 istikrar'},
  kristal:{n:'Canlı Kristal',   ico:'❈', c:'#8b7bff', e:{araMul:.09},
           d:'Bilim atılımı: +%9 araştırma'},
  mercan :{n:'Yankı Mercanı',   ico:'❋', c:'#6ff2c8', e:{dipMul:.16, etkFlat:.7},
           d:'Diplomatik hediye: +%16 ikna, +0.7 etki'},
  filiz  :{n:'Yıldız Filizi',   ico:'✤', c:'#65e08a', e:{yiyMul:.14, growMul:.06},
           d:'Bereket: +%14 yiyecek, +%6 nüfus artışı'},
  cevher :{n:'Işıyan Cevher',   ico:'◆', c:'#f2d452', e:{eneMul:.13},
           d:'Enerji yoğun: +%13 enerji'},
  ipek   :{n:'Vakum İpeği',     ico:'≋', c:'#e0a8ff', e:{minMul:.10, alaMul:.08},
           d:'Endüstriyel dokuma: +%10 mineral, +%8 alaşım'},
  ozsu   :{n:'Kadim Özsu',      ico:'❂', c:'#ff5f6d', e:{hullMul:.10, spdMul:.08},
           d:'Gemi kaplaması: +%10 gövde, +%8 filo hızı'},
  tuz    :{n:'Boşluk Tuzu',     ico:'✦', c:'#a9d4ff', e:{shMul:.12, upMul:-.10},
           d:'Kalkan katalizörü: +%12 kalkan, −%10 filo bakımı'}
};
const LUX_KEYS = Object.keys(LUXURY);

/* ---------- yeraltı yatakları ---------- */
const DEPOSITS = [
  {id:'zengin_maden', n:'Zengin Mineral Damarı', g:{min:5}, w:14, on:['olu','ast','hab']},
  {id:'kristal',      n:'Kristal Oluşumu',       g:{min:3,ara:2}, w:8,  on:['olu','ast']},
  {id:'ergi_kaynagi', n:'Ergitilebilir Cevher',  g:{ala:2}, w:7,  on:['olu','ast']},
  {id:'gaz_kuyusu',   n:'Egzotik Gaz Kuyusu',    g:{ene:6}, w:12, on:['gaz']},
  {id:'jeotermal',    n:'Jeotermal Yarık',       g:{ene:4}, w:11, on:['olu','hab']},
  {id:'kalinti',      n:'Antik Kalıntı',         g:{ara:4}, w:6,  on:['olu','hab']},
  {id:'bereket',      n:'Bereketli Ovalar',      g:{yiy:5}, w:10, on:['hab']},
  {id:'nadir',        n:'Nadir Element Yatağı',  g:{min:2,ala:2}, w:6, on:['olu','gaz','ast']}
];

/* ---------- gemi sınıfları ---------- */
const SHIPS = {
  kor:{n:'Korvet',      ab:'KRV', rng:1, hull:70,  sh:18,  dmg:16,  spd:3.2, cost:{ala:32},           up:6.8, upA:.77, rol:'sav', sz:1},
  muh:{n:'Muhrip',      ab:'MHR', rng:1, hull:155, sh:48,  dmg:35,  spd:2.7, cost:{ala:72},           up:15.9, upA:1.68, rol:'sav', sz:2, tech:'m_muhrip'},
  kru:{n:'Kruvazör',    ab:'KRV2',rng:2, hull:340, sh:115, dmg:76,  spd:2.2, cost:{ala:155},          up:35.8, upA:3.64, rol:'sav', sz:3, tech:'m_kruvazor'},
  zir:{n:'Zırhlı',      ab:'ZRH', rng:3, hull:740, sh:270, dmg:168, spd:1.7, cost:{ala:330},          up:78.3, upA:7.84, rol:'sav', sz:4, tech:'m_zirhli'},
  bil:{n:'Bilim Gemisi',ab:'BLM', rng:0, hull:45,  sh:0,   dmg:0,   spd:3.7, cost:{ala:24},           up:2.6, rol:'bilim',sz:1},
  kol:{n:'Koloni Gemisi',ab:'KLN',rng:0, hull:60,  sh:0,   dmg:0,   spd:2.2, cost:{ala:60,min:265},   up:0,  rol:'koloni',sz:2},
  ins:{n:'İnşaat Gemisi',ab:'İNŞ',rng:0, hull:55,  sh:0,   dmg:0,   spd:2.4, cost:{ala:45,min:90},    up:1.4, rol:'insaat',sz:1},
  /* FAZ 22: TAARRUZ ORDUSU — yörüngeden inen kara kuvveti.
     dmg:0 çünkü uzay muharebesinde savaşmaz; gücü `ground` alanında.
     Bireysel asker objesi YOK: bir gemi = bir tümen. */
  ord:{n:'Taarruz Ordusu',ab:'ORD',rng:0, hull:120, sh:10,  dmg:0,   spd:2.0, cost:{ala:70,min:120},   up:5.2, upA:.6, rol:'ordu', sz:2, ground:55},
  /* FAZ 24: SÜPER SİLAH. Silahsız (dmg:0) — uzay muharebesinde
     savunmasızdır, korunması gerekir. Yavaş, çok pahalı ve
     ateşlenmesi 6 ay sürer: düşmana durdurma şansı verir. */
  /* FAZ 31: Gövde 900→3200, kalkan 180→900. ÖLÇÜM: Colossus yola
     çıktığı İLK AY yok oluyordu — silahsız (dmg:0) olduğu için
     tek bir temasta imha ediliyor ve hiç hedefe varamıyordu.
     Artık dayanıklı bir kale: vuramaz ama kolay kolay ölmez. */
  col_s:{n:'Colossus',   ab:'CLS', rng:0, hull:3200, sh:900, dmg:0,   spd:1.1, cost:{ala:1400,min:2200}, up:120, upA:14, rol:'super', sz:5, tech:'m_yildiz'},

  /* ═══════════════════════════════════════════════════════════════
     FAZ 34 — HİÇLİK SÜRÜSÜ ORGANİK GEMİLERİ
     Yalnızca kriz tarafı kullanır (crisisOnly). Oyuncu ya da AI
     bunları inşa edemez; üretim menüsünde görünmezler.
     Tasarım zıtlığı: sürü dronu kalkansız ama etli, kraliçe ise
     yavaş ve devasa — kalkanları eritmek için yaratılmış.
     ═══════════════════════════════════════════════════════════════ */
  swarm_drone:{n:'Sürü Dronu', ab:'DRN', rng:0, hull:260, sh:0,   dmg:22, spd:4.4,
    cost:{ala:1}, up:0, rol:'sav', sz:1, crisisOnly:true, organik:true},
  swarm_queen:{n:'Sürü Kraliçesi', ab:'KRL', rng:0, hull:4800, sh:260, dmg:190, spd:1.3,
    cost:{ala:1}, up:0, rol:'sav', sz:5, crisisOnly:true, organik:true, shieldEat:true}
  /* FAZ 24: 't_doktrin' teknoloji kapısı KALDIRILDI. Tanıda
     1800 imparatorluk-ayın yalnız 260'ında AI o teknolojiye
     sahipti; ordular bu yüzden neredeyse hiç üretilmiyordu.
     Taarruz ordusu temel bir askerî araç olmalı. */
};

/* ---------- yapılar ---------- */
const FOCUS = {
  yonetim :{n:'Yönetim',  ico:'🏛', e:{etkFlat:1.5},           pen:{minMul:-.05,eneMul:-.05,yiyMul:-.05,alaMul:-.05,araMul:-.05}, d:'Etki +1.5/ay, tüm çıktı −%5. Başkent tipi koloni.'},
  sanayi  :{n:'Sanayi',   ico:'⚒', e:{minMul:.25,alaMul:.40,eneMul:.15}, pen:{yiyMul:-.12}, d:'Mineral +%25, alaşım +%40, enerji +%15, yiyecek −%12.'},
  arastir :{n:'Araştırma',ico:'🔬', e:{araMul:.30},             pen:{minMul:-.10}, d:'Araştırma +%30, mineral −%10.'},
  tarim   :{n:'Tarım',    ico:'🌾', e:{yiyMul:.30,growMul:.10}, pen:{}, d:'Yiyecek +%30, nüfus artışı +%10.'},
  garnizon:{n:'Garnizon', ico:'⚔', e:{defFlat:180},            pen:{minMul:-.05,alaMul:-.05,araMul:-.05,yiyMul:-.05,eneMul:-.05}, d:'Sistem savunması +180, tüm çıktı −%5. Sınır kolonisi.'}
};
/* terraform kademeleri: her kademe +12 yaşanabilirlik */
const TERRA_STEPS = [
  {min:420,  ene:260, ay:14},
  {min:760,  ene:480, ay:20},
  {min:1250, ene:820, ay:28}
];
const TERRA_BONUS = 12;

const FOCUS_NEUTRAL = {n:'Serbest', ico:'○', e:{}, pen:{}, d:'Henüz odak belirlenmedi.'};
const FOCUS_COOLDOWN = 30; // odak değişince 1 ay soğuma

const BUILDINGS = {
  maden  :{n:'Maden Ocağı',        c:{min:120}, up:1, g:{min:6},        max:6, d:'Kabuktan mineral çıkarır.'},
  santral:{n:'Enerji Santrali',    c:{min:110}, up:0, g:{ene:6},        max:6, d:'Yıldız enerjisini şebekeye aktarır.'},
  ciftlik:{n:'Hidroponik Çiftlik', c:{min:110}, up:1, g:{yiy:7},        max:5, d:'Nüfusu besler.'},
  lab    :{n:'Araştırma Laboratuvarı',c:{min:190},up:3,g:{ara:6},       max:6, d:'Bilim çıktısı üretir.'},
  dokum  :{n:'Alaşım Dökümhanesi', c:{min:210}, up:2, g:{ala:4.5}, u:{min:11}, max:6, d:'Mineralleri gemi alaşımına dönüştürür. Mineral yakar, alaşım verir.'},
  tersane:{n:'Tersane',            c:{min:260,ala:45}, up:2, g:{}, max:3, sp:'yard', d:'Bu sistemde gemi inşasına izin verir.'},
  kale   :{n:'Savunma Üssü',       c:{min:230,ala:70}, up:2, g:{}, max:4, sp:'def',  d:'Sisteme +180 savunma gücü ekler.'},
  arsiv  :{n:'Büyük Arşiv',       c:{min:280, ala:40}, up:3, g:{ara:4, etk:.8}, max:1,
           d:'Bilgi ve kültür merkezi: araştırma ve etki üretir.'},
  klinik :{n:'Genetik Klinik',    c:{min:230}, up:2, g:{}, max:1, sp:'grow',
           d:'Bu kolonide nüfus artışı +%35 hızlanır.'},
  kuyu   :{n:'Termal Kuyu',       c:{min:200}, up:1, g:{ene:9}, max:4, sp:'hot',
           d:'Volkanik ve ölü dünyalarda çok verimli enerji kaynağı.'},
  asansor:{n:'Uzay Asansörü',     c:{min:520, ala:140}, up:4, g:{}, max:1, sp:'lift',
           d:'Yörüngeye ucuz erişim: bu kolonideki tüm üretim +%18.'},
  habitat:{n:'Yörünge Habitatı', c:{min:340, ala:90}, up:3, g:{}, max:1, sp:'hab',
           d:'Yaşanamaz bir dünyanın yörüngesinde küçük bir yerleşim açar.'},
  fabrika:{n:'Tüketim Fabrikası', c:{min:170}, up:2, g:{tuk:6}, u:{min:4}, max:5,
           d:'Nüfusun ihtiyaç duyduğu tüketim mallarını üretir.'},
  liman  :{n:'Ticaret Limanı',     c:{min:180}, up:0, g:{ene:4,etk:.4}, max:3, d:'Enerji ve etki üretir, ticaret ağı kapasitesini +2 artırır.'}
};

/* ---------- teknoloji ---------- */
const TECHS = {
  /* --- FİZİK --- */
  f_reaktor  :{b:'fiz',t:1,n:'Verimli Reaktörler',   c:580,  e:{eneMul:.15},        d:'+%15 enerji üretimi'},
  f_lazer1   :{b:'fiz',t:1,n:'Lazer Bataryaları',    c:670, sway:{f_kalkan1:1.20},  e:{dmgMul:.12},        d:'+%12 gemi hasarı'},
  f_kalkan1  :{b:'fiz',t:2,n:'Deflektör Kalkanları', c:1300, sway:{f_lazer2:1.15},  e:{shMul:.20},         d:'+%20 kalkan', r:['f_lazer1']},
  f_sensor   :{b:'fiz',t:2,n:'Derin Uzay Sensörleri',c:1190,  e:{sensor:1},          d:'+1 sistem menzil algılama', r:['f_reaktor']},
  f_lazer2   :{b:'fiz',t:3,n:'Parçacık Topları',     c:2840,  e:{dmgMul:.18},        d:'+%18 gemi hasarı', r:['f_lazer1']},
  f_kalkan2  :{b:'fiz',t:3,n:'Hiperkalkan Matrisi',  c:3320,  e:{shMul:.25},         d:'+%25 kalkan', r:['f_kalkan1']},
  f_delici   :{b:'fiz',t:3,n:'Kalkan Delici Işınlar',c:3520, sway:{f_kalkan2:1.25},  e:{eShMul:-.28},       d:'DÜŞMAN kalkanı -%28', r:['f_kalkan1']},
  f_harp     :{b:'fiz',t:4,n:'Elektronik Harp',      c:6390, e:{eDmgMul:-.20},      d:'DÜŞMAN hasarı -%20', r:['f_lazer2','f_sensor']},
  f_tunel    :{b:'fiz',t:4,n:'Sıfır Nokta Enerjisi', c:7500, e:{eneMul:.30,araMul:.10}, d:'+%30 enerji, +%10 araştırma', r:['f_reaktor','f_kalkan2']},
  f_sing     :{b:'fiz',t:5,n:'Tekillik Silahları',   c:16180, e:{dmgMul:.30,eShMul:-.15}, d:'+%30 hasar, düşman kalkanı -%15', r:['f_lazer2','f_delici']},

  /* --- TOPLUM --- */
  t_tarim    :{b:'top',t:1,n:'Tarım Devrimi',        c:520,  e:{yiyMul:.20},        d:'+%20 yiyecek'},
  t_yonetim  :{b:'top',t:1,n:'Merkezî Yönetim',      c:630,  e:{etkFlat:1},         d:'+1 etki/ay'},
  t_koloni   :{b:'top',t:2,n:'Kolonizasyon Protokolü',c:1250, sway:{t_doktrin:1.20,t_genetik:0.85}, e:{colCost:-.25,growMul:.15}, d:'Koloni gemisi -%25, büyüme +%15', r:['t_tarim']},
  t_diplo    :{b:'top',t:2,n:'Diplomatik Teamüller', c:1340,  e:{dipMul:.30},        d:'+%30 diplomatik ikna', r:['t_yonetim']},
  t_doktrin  :{b:'top',t:2,n:'Askerî Doktrin',       c:1430, sway:{t_koloni:1.20,m_muhrip:0.85},  e:{capFlat:24},        d:'+24 filo kapasitesi'},
  t_habitat  :{b:'top',t:2,n:'Yörünge Habitatları',  c:1340, e:{}, unlockHab:1,
               d:'Yaşanamaz dünyalara habitat kurulabilir (küçük, sınırlı koloni)', r:['t_koloni']},
  t_terra1   :{b:'top',t:3,n:'İklim Mühendisliği',   c:2610, e:{}, terra:1,
               d:'Gezegenleri terraform etmeye başla (+12 yaşanabilirlik / kademe)', r:['t_habitat']},
  t_terra2   :{b:'top',t:4,n:'Gezegen Şekillendirme',c:5950, e:{}, terra:2,
               d:'Terraform 3. kademeye kadar sürdürülebilir', r:['t_terra1']},
  t_genetik  :{b:'top',t:3,n:'Genetik Uyarlama',     c:3070,  e:{habFlat:15},        d:'+%15 yaşanabilirlik', r:['t_koloni']},
  t_moral    :{b:'top',t:3,n:'Birlik Ritüelleri',    c:2840,  e:{etkFlat:1.5,stab:10}, d:'+1.5 etki, +10 istikrar', r:['t_yonetim']},
  t_lojistik :{b:'top',t:4,n:'Galaktik Lojistik',    c:5930, e:{capFlat:40,upMul:-.15}, d:'+40 kapasite, bakım -%15', r:['t_doktrin']},
  t_yukselis :{b:'top',t:4,n:'Yükseliş Teorisi',     c:7040, e:{araMul:.20,growMul:.20}, d:'+%20 araştırma ve büyüme', r:['t_genetik','t_moral']},
  t_federasyon:{b:'top',t:5,n:'Federasyon Anayasası',c:15170, e:{dipMul:.40,etkFlat:3}, d:'+%40 ikna, +3 etki', r:['t_diplo','t_lojistik']},

  /* --- MÜHENDİSLİK --- */
  m_robot    :{b:'muh',t:1,n:'Robotik İşçiler',      c:540, sway:{t_tarim:1.18,m_dokum:0.88},  e:{minMul:.20},        d:'+%20 mineral'},
  m_zirh1    :{b:'muh',t:1,n:'Sıkıştırılmış Zırh',   c:650,  e:{hullMul:.15},       d:'+%15 gövde'},
  m_muhrip   :{b:'muh',t:2,n:'Muhrip Gövdesi',       c:1250, sway:{m_zirh2:0.88},  e:{}, unlock:'muh',    d:'Muhrip sınıfı açılır', r:['m_zirh1']},
  m_dokum    :{b:'muh',t:2,n:'Gelişmiş Dökümhane',   c:1210, sway:{f_kalkan1:1.15,m_tezgah:0.85},  e:{alaMul:.45},        d:'+%45 alaşım', r:['m_robot']},
  m_warp     :{b:'muh',t:2,n:'Warp Sürücüleri',      c:1340,  e:{spdMul:.25},        d:'+%25 filo hızı'},
  m_zirh2    :{b:'muh',t:3,n:'Neutronyum Plaka',     c:3000,  e:{hullMul:.22},       d:'+%22 gövde', r:['m_zirh1']},
  m_kruvazor :{b:'muh',t:3,n:'Kruvazör Gövdesi',     c:3390,  e:{}, unlock:'kru',    d:'Kruvazör sınıfı açılır', r:['m_muhrip']},
  m_tezgah   :{b:'muh',t:3,n:'Otomatik Tezgâhlar',   c:3160,  e:{buildMul:.30,minMul:.12}, d:'İnşa +%30 hızlı, +%12 mineral', r:['m_dokum']},
  m_zirhli   :{b:'muh',t:4,n:'Zırhlı Gövdesi',       c:8380, e:{}, unlock:'zir',    d:'Zırhlı sınıfı açılır', r:['m_kruvazor','m_zirh2']},
  m_nanit    :{b:'muh',t:5,n:'Nanit Onarım Sistemleri',c:15660,e:{hullMul:.30,eDmgMul:-.10}, d:'+%30 gövde, düşman hasarı -%10', r:['m_zirhli']},

  /* --- 6. KADEME: geç oyun. Pahalı ve güçlü; ağacın erken bitmesini önler --- */
  f_boyut    :{b:'fiz',t:6,n:'Boyutlar Arası Fizik',  c:36080,  e:{dmgMul:.35, shMul:.25},
               d:'+%35 hasar, +%25 kalkan', r:['f_sing']},
  f_zaman    :{b:'fiz',t:6,n:'Zaman Bükücü Alanlar',  c:50600, e:{spdMul:.40, eDmgMul:-.15},
               d:'+%40 filo hızı, düşman hasarı −%15', r:['f_boyut']},
  t_yukselen :{b:'top',t:6,n:'Yükselen Uygarlık',     c:37840,  e:{araMul:.25, growMul:.20, stab:12},
               d:'+%25 araştırma, +%20 nüfus, +12 istikrar', r:['t_federasyon']},
  t_galaktik :{b:'top',t:6,n:'Galaktik Yönetişim',    c:52360, e:{etkFlat:5, dipMul:.35, capFlat:30},
               d:'+5 etki, +%35 ikna, +30 filo kapasitesi', r:['t_yukselen']},
  m_kuantum  :{b:'muh',t:6,n:'Kuantum Tersaneler',    c:38720,  e:{buildMul:.45, alaMul:.50},
               d:'İnşa +%45, alaşım +%50', r:['m_nanit']},
  m_yildiz   :{b:'muh',t:6,n:'Yıldız Mühendisliği',   c:56320, e:{hullMul:.35, eneMul:.35},
               d:'+%35 gövde, +%35 enerji', r:['m_kuantum']},
  /* FAZ 35: ölü dünyaları diriltmenin anahtarı — geç oyun amacı */
  m_gaia     :{b:'muh',t:6,n:'Gaia Mühendisliği',     c:62400, e:{growMul:.20, yiyMul:.25},
               d:'+%20 büyüme, +%25 yiyecek · parçalanmış dünyalar TERRAFORM edilebilir',
               r:['m_yildiz']}
};
const STANCE = {
  agresif :{n:'AGRESİF', ico:'⚔', dmg:1.15, take:1.10, kac:0,   d:'Hasar +%15, alınan hasar +%10. Asla geri çekilmez.'},
  savunma :{n:'SAVUNMA', ico:'🛡', dmg:0.90, take:0.80, kac:.25, d:'Hasar −%10, alınan hasar −%20. Gövde %25 altına düşerse ricat eder.'}
};
const RANGE_NAMES = {3:'UZAK MENZİL', 2:'ORTA MENZİL', 1:'YAKIN MUHAREBE'};

const BRANCH = {fiz:{n:'FİZİK',c:'#8b7bff'}, top:{n:'TOPLUM',c:'#6ff2c8'}, muh:{n:'MÜHENDİSLİK',c:'#ff9b3d'}};

/* ---------- karakter özellikleri ---------- */
const TRAITS = {
  ustun_zeka   :{n:'Üstün Zekâ',        c:2, e:{araMul:.15},  d:'+%15 araştırma'},
  endustriyel  :{n:'Endüstriyel',       c:2, e:{minMul:.15},  d:'+%15 mineral'},
  verimli      :{n:'Verimli Metabolizma',c:1,e:{yiyMul:.15},  d:'+%15 yiyecek'},
  savascı      :{n:'Savaşçı Ruh',       c:2, e:{dmgMul:.12},  d:'+%12 gemi hasarı'},
  dayanikli    :{n:'Dayanıklı',         c:2, e:{hullMul:.15}, d:'+%15 gövde'},
  hizli_ureyen :{n:'Hızlı Üreyen',      c:2, e:{growMul:.25}, d:'+%25 nüfus artışı'},
  uyumlu       :{n:'Uyumlu',            c:2, e:{habFlat:10},  d:'+%10 yaşanabilirlik'},
  karizmatik   :{n:'Karizmatik',        c:2, e:{dipMul:.25,etkFlat:.5}, d:'+%25 ikna, +0.5 etki'},
  tuccar       :{n:'Tüccar Kanı',       c:2, e:{eneMul:.18},  d:'+%18 enerji'},
  gocebe       :{n:'Göçebe',            c:1, e:{spdMul:.15},  d:'+%15 filo hızı'},
  kirilgan     :{n:'Kırılgan',          c:-2,e:{hullMul:-.15},d:'−%15 gövde'},
  yavas_ureyen :{n:'Yavaş Üreyen',      c:-2,e:{growMul:-.25},d:'−%25 nüfus artışı'},
  obur         :{n:'Obur',              c:-1,e:{yiyMul:-.15}, d:'−%15 yiyecek'},
  itici        :{n:'İtici',             c:-2,e:{dipMul:-.30}, d:'−%30 ikna'},
  savurgan     :{n:'Savurgan',          c:-1,e:{eneMul:-.15}, d:'−%15 enerji'}
};

/* ---------- ETİK EKSENLERİ (ideoloji) ----------
   Her eksen -3..+3. Pozitif tarafta 'ea', negatif tarafta 'eb' etkileri
   kaydırma miktarıyla çarpılarak uygulanır.                            */
const ETHICS = {
  mil:{n:'ASKERÎ DURUŞ', a:'MİLİTARİST', b:'PASİFİST',
       da:'Savaş bir sanattır. Filo güçlü, dil sivri.',
       db:'Silah son çaredir. Masada kazanılan savaş, kazanılmamış sayılmaz.',
       ea:{dmgMul:.055, hullMul:.030, dipMul:-.070},
       eb:{dmgMul:-.030, dipMul:.110, stab:2, etkFlat:.15}},
  aut:{n:'YÖNETİM BİÇİMİ', a:'OTORİTER', b:'EGALİTER',
       da:'Tek el, tek yön. İtaat istikrar getirir.',
       db:'Her ses sayılır. Özgür halk daha hızlı çoğalır ve düşünür.',
       ea:{stab:4.5, growMul:-.035, etkFlat:.22, minMul:.020},
       eb:{growMul:.055, araMul:.030, stab:-2, yiyMul:.020}},
  mat:{n:'DÜNYA GÖRÜŞÜ', a:'MATERYALİST', b:'RUHANİ',
       da:'Evren ölçülebilir. Yeterince veri, yeterince güç demektir.',
       db:'Yıldızların ardında bir irade var. Ona hizmet eden güçlenir.',
       ea:{araMul:.065, etkFlat:-.18, alaMul:.020},
       eb:{etkFlat:.55, araMul:-.030, stab:2.5, growMul:.020}},
  /* ═══════════════════════════════════════════════════════════
     FAZ 48 — DÖRDÜNCÜ EKSEN: DİPLOMATİK AHLAK
     Dürüst devlet masada kazanır, gölgede kaybeder.
     Sahtekâr devlet gölgede kazanır, masada bedel öder.
     ═══════════════════════════════════════════════════════════ */
  ahl:{n:'DİPLOMATİK AHLAK', a:'DÜRÜST', b:'SAHTEKÂR',
       da:'Sözümüz senettir. Güven en sağlam zırhtır.',
       db:'Gerçek, işine yaradığı kadar gerçektir.',
       ea:{trustCap:15, tradeMul:.10, opCost:.15},
       eb:{opBonus:.10, opRisk:-.05, trustStart:-15}}
};
/* ---------- ETİK EŞİK YETENEKLERİ ----------
   Kaydırma 2 veya 3'e ulaştığında oyun KURALLARINI değiştiren
   yetenekler açılır. Etikler artık sadece çarpan değil.        */
const ETHIC_PERKS = {
  mil:{
    pos:[  // MİLİTARİST
      {lvl:2, k:'freeWar',   n:'Savaş Hakkı',       d:'Savaş ilanı etki maliyeti yok; savaş yorgunluğu yarı hızda birikir.'},
      {lvl:3, k:'warEconomy',n:'Savaş Ekonomisi',   d:'Filo kapasitesi +%25; savaştayken alaşım üretimi +%20.'}
    ],
    neg:[  // PASİFİST
      {lvl:2, k:'peaceAlways',n:'Barış Doktrini',   d:'Barış teklifin ASLA reddedilmez; savunmada +%20 gövde.'},
      {lvl:3, k:'condemn',    n:'Galaktik Kınama',  d:'Sana savaş açan herkes tüm galakside −20 ilişki kaybeder.'}
    ]},
  aut:{
    pos:[  // OTORİTER
      {lvl:2, k:'ironWill', n:'Demir İrade',        d:'İstikrar cezaları yarıya iner; koloni odağı anında değişir.'},
      {lvl:3, k:'noCoup',   n:'Mutlak Otorite',     d:'Fraksiyon gücü −%40; darbe olamaz.'}
    ],
    neg:[  // EGALİTER
      {lvl:2, k:'migration',n:'Serbest Göç',        d:'Yeni koloniler +3 nüfusla kurulur; nüfus artışı +%10.'},
      {lvl:3, k:'consensus',n:'Uzlaşı Kültürü',     d:'Tüm fraksiyonlar +20 memnuniyetle başlar ve daha yavaş kızar.'}
    ]},
  mat:{
    pos:[  // MATERYALİST
      {lvl:2, k:'labFocus', n:'Laboratuvar Devleti',d:'Teknoloji çapraz etkileri (sway) %50 daha güçlü; anomali şansı +%50.'},
      {lvl:3, k:'overclock',n:'Aşırı Hızlandırma',  d:'Bir araştırma dalını iki katına hızlandırabilirsin (diğerleri yavaşlar).'}
    ],
    neg:[  // RUHANİ
      {lvl:2, k:'faith',    n:'Kutsal Düzen',       d:'Etki üretimi +%60; mal kıtlığı istikrarı vurmaz.'},
      {lvl:3, k:'zeal',     n:'Kutsal Coşku',       d:'Tüm kolonilerde istikrar tabanı 60; kuşatmada moral düşmez.'}
    ]},
  /* ═══ ONARIM: DÖRDÜNCÜ EKSENİN EŞİK YETENEKLERİ ═══
     ÇÖKME KÖK NEDENİ: Faz 48'de ETHICS'e dördüncü eksen (ahl)
     eklendi ama ETHIC_PERKS'e eklenmedi. Etik sekmesi her eksen
     için ETHIC_PERKS[ax].pos okuduğundan, kullanıcı ahl ekseninde
     SIFIR DIŞI bir değer seçer seçmez
       "Cannot read properties of undefined (reading 'pos')"
     fırlatıp render'ı yarıda kesiyordu. Sekme boş kalıyor,
     sonraki geçişler de kilitleniyordu.
     Sıfırdayken hata çıkmadığı için ilk açılışta sorun görünmüyordu. */
  ahl:{
    pos:[  // DÜRÜST
      {lvl:2, k:'openBooks',  n:'Açık Defterler',
       d:'Anlaşmaların ASLA bozulmaz sayılır: müttefiklerinle ilişki ayda +1 artar.'},
      {lvl:3, k:'wordIsBond', n:'Sözün Senedin',
       d:'Güven tavanı +30; sana yapılan casusluk ifşa olduğunda galaksi seni destekler.'}
    ],
    neg:[  // SAHTEKÂR
      {lvl:2, k:'ghostNet',   n:'Hayalet Ağ',
       d:'Ajanların yakalanma riski −%10; ifşa olsan bile fail belirsiz kalabilir.'},
      {lvl:3, k:'puppetMaster',n:'Kuklacı',
       d:'Sahte bayrak operasyonlarında inandırıcılık +%40; şantaj bedeli yarıya iner.'}
    ]}
};
/* bir imparatorluk belirli bir etik yeteneğine sahip mi? */
function hasPerk(e, key){
  if (!e || !e.ethics) return false;
  for (const ax in ETHIC_PERKS){
    const v = e.ethics[ax] || 0;
    /* ZIRH: eksen ETHIC_PERKS'te tanımlı değilse sessizce atla */
    const PK = ETHIC_PERKS[ax];
    const side = !PK ? null : (v > 0 ? PK.pos : v < 0 ? PK.neg : null);
    if (!side) continue;
    const n = Math.abs(v);
    for (const pk of side) if (pk.k === key && n >= pk.lvl) return true;
  }
  return false;
}
function perksOf(e){
  const out = [];
  if (!e || !e.ethics) return out;
  for (const ax in ETHIC_PERKS){
    const v = e.ethics[ax] || 0;
    if (!v) continue;
    const PK2 = ETHIC_PERKS[ax];
    if (!PK2) continue;                       // ZIRH
    const side = v > 0 ? PK2.pos : PK2.neg;
    const n = Math.abs(v);
    for (const pk of side) if (n >= pk.lvl) out.push(pk);
  }
  return out;
}

const ETHIC_MAX = 3;      // eksen başına uç değer
/* FAZ 52: doktrin havuzu 4 puan. 1+1+1+1, 2+1+1 ve 2+2
   kombinasyonlarına izin verir; 4 eksen × 2 seviye. */
const ETHIC_BUDGET = 4;   // toplam mutlak kaydırma bütçesi

/* ---------- CIVIC'LER ----------
   e{}   : doğrudan modifikatör
   flag  : oyun kurallarını değiştiren özel mekanik
   sars  : oyun tarzını kökten değiştiren "sarsıcı" civic          */
const CIVICS = {
  /* --- güçlendirme odaklı --- */
  savas_oncu :{n:'Savaş Öncüleri', ico:'⚔', e:{dmgMul:.06},
    flag:'warFury', d:'Savaş ilan ettikten sonraki ilk 2 yıl filoların +%25 hasar verir.'},
  burokrasi  :{n:'Bürokratik Verimlilik', ico:'🏛', e:{buildMul:.10, etkFlat:.6},
    flag:'slots', d:'Her koloniye +2 yapı slotu, inşa +%10 hızlı, +0.6 etki.'},
  tuccar_cum :{n:'Tüccar Cumhuriyeti', ico:'💰', e:{eneMul:.08},
    flag:'trade', d:'Ticaret bağlantıları %4 yerine %7 enerji verir, ağ kapasitesi +4.'},
  gen_oncu   :{n:'Gen Öncüleri', ico:'🧬', e:{growMul:.10},
    flag:'seedPop', d:'Yeni koloniler 3 yerine 7 nüfusla kurulur.'},
  sinyal_avci:{n:'Sinyal Avcısı', ico:'📡', e:{sensor:1, spdMul:.10},
    flag:'scan', d:'Tarama %45 hızlı, anomali bulma şansı belirgin artar.'},
  kale_dok   :{n:'Kale Doktrini', ico:'🛡', e:{hullMul:.06},
    flag:'fortress', d:'Kale maliyeti −%40, tüm sistem savunması +%50.'},
  kultur_hak :{n:'Kültürel Hâkimiyet', ico:'🎭', e:{dipMul:.20, etkFlat:.5},
    flag:'allyCheap', d:'İttifak maliyeti −%45, ilişkiler her ay kendiliğinden düzelir.'},
  ar_kolektif:{n:'Araştırma Kolektifi', ico:'🔬', e:{araMul:.08},
    flag:'streak2', d:'Dal uzmanlık indirimi iki katı (−%20) ve 2 araştırmada devreye girer.'},

  /* --- sarsıcı: oyun tarzını değiştirir --- */
  olumsuz_imp:{n:'Ölümsüz İmparator', ico:'⚰', sars:1, e:{minMul:.08, eneMul:.08, araMul:.08, alaMul:.08},
    flag:'leader', d:'Tüm üretim +%8. ANCAK anavatanın düşerse önder ölür: 6 yıl boyunca tüm üretim −%40.'},
  surgun     :{n:'Galaktik Sürgün', ico:'🌌', sars:1, e:{araMul:.12, eneMul:.10},
    flag:'exile', d:'İttifak kuramaz, barış imzalayamazsın. Karşılığında hiçbir imparatorluk SANA savaş açamaz.'},
  kan_hukuku :{n:'Kan Hukuku', ico:'🩸', sars:1, e:{dmgMul:.18, hullMul:.08, dipMul:-.40},
    flag:'blood', d:'Barış teklif edemez/kabul edemezsin — savaş biri bitene dek sürer. Fethettiğin nüfus hiç azalmaz.'},
  hafiza_sil :{n:'Hafıza Silinmesi', ico:'🧠', sars:1, e:{},
    flag:'noStock', d:'Araştırma puanı biriktiremezsin (her ay sıfırlanır). Ama biten HER teknoloji diğer tümünü −%8 ucuzlatır.'},
  tek_urun   :{n:'Tek Ürün Ekonomisi', ico:'💎', sars:1, e:{},
    flag:'mono', d:'Seçtiğin tek kaynakta +%55, diğer üretimlerde −%50. Eksiğini ticaret ve diplomasiyle kapatırsın.'},
  golge_kons :{n:'Gölge Konseyi', ico:'🏴', sars:1, e:{etkFlat:1.2},
    flag:'shadow', d:'RESMİ SAVAŞ İLAN EDEMEZSİN. Karşılığında +2 casus, operasyon riski −%60, casusun asla yakalanmaz ve istihbarat %50 hızlı toplanır.'},
  karsi_ist  :{n:'Karşı İstihbarat', ico:'🛰', e:{sensor:1, stab:6},
    flag:'counter', d:'Sana yönelik istihbarat %65 yavaşlar, düşman operasyonlarının ifşa olma riski %80 artar.'},
  korsan_avci:{n:'Korsan Avcısı', ico:'🏹', e:{dmgMul:.05},
    flag:'corsair', d:'Yok ettiğin her korsan yuvası +50 ek etki verir; korsan avında ganimet artar.'},
  konsey_mim :{n:'Konsey Mimarı', ico:'🤝', e:{dipMul:.15, etkFlat:.8},
    flag:'council', d:'Federasyon oylamalarında oyun iki kat ağırlıkta sayılır.'},
  sifir_atik :{n:'Sıfır Atık', ico:'🌾', e:{},
    flag:'zerowaste', d:'Nüfusun tüketim malı ihtiyacı −%30. Kıtlık krizine çok daha geç düşersin.'},
  sinir_kara :{n:'Sınır Karakolu Doktrini', ico:'🚧', e:{},
    flag:'outpost', d:'Komşularla sınır sürtüşmesi yaşamazsın (ilişki aşınması yok).'},
  suikast    :{n:'Suikast Ağı', ico:'🗡', sars:1, e:{},
    flag:'assassin', d:'Casusluk menüsünden düşman fraksiyon liderlerini öldürebilirsin. Kendi liderini de değiştirebilirsin.'},
  savas_kahra:{n:'Savaş Kahramanı', ico:'🎖', e:{dmgMul:.05},
    flag:'warhero', d:'Savaş hedefini tamamlayınca TÜM fraksiyonlar +15 memnuniyet kazanır.'},
  kriz_kahin :{n:'Kriz Kâhini', ico:'🔮', e:{araMul:.05, sensor:1},
    flag:'seer', d:'Galaktik krizi 6 yıl önceden görürsün; kriz filolarına +%20 hasar.'},
  kriz_miras :{n:'Kriz Mirasçısı', ico:'🌋', sars:1, e:{hullMul:.06},
    flag:'crisisheir', d:'Krizi kendin erken tetikleyebilirsin — erken kriz daha zayıftır ama hazır değilsen felaket olur.'},
  kadim_miras:{n:'Kadim Miras', ico:'📜', e:{stab:5},
    flag:'heritage', d:'Gezegen karakteri iki kat hızlı olgunlaşır — Kadim ve Sadık dünyalar erken doğar.'},
  sentez_lab :{n:'Sentez Laboratuvarı', ico:'⚗', e:{araMul:.06},
    flag:'synth', d:'Teknoloji çapraz etkileri (sway) senin için %60 daha güçlü işler — büyük kazanç, büyük risk.'},
  mega_muh   :{n:'Mega-Mühendisler', ico:'🏗', e:{buildMul:.10},
    flag:'megaeng', d:'Mega yapılar %40 ucuz ve hızlı; uzay yapısı inşaatı genel olarak hızlanır.'},
  kartel     :{n:'Kartel', ico:'💎', e:{eneMul:.06},
    flag:'cartel', d:'Bir lüks malın galakside tek üreticisiysen o malın bonusu iki katına çıkar.'},
  derin_uyku :{n:'Derin Uyku', ico:'🧊', sars:1, e:{},
    flag:'sleep', d:'Kolonilerin BÜYÜMEZ — nüfus yalnızca fetihle artar. Karşılığında her nüfus birimi %45 daha verimli.'},
  sonsuz_sef :{n:'Sonsuz Seferberlik', ico:'💀', sars:1, e:{},
    flag:'mobilize', d:'Barışta filo bakımı iki katı. Ama her savaş ilanında filolarına KALICI +%30 güç eklenir (birikimli).'},
  tek_parti  :{n:'Tek Parti', ico:'👑', sars:1, e:{stab:8},
    flag:'oneparty', d:'İstikrar asla 35 altına düşmez. ANCAK koloni odağı kurulduktan sonra DEĞİŞTİRİLEMEZ.'},
  acik_sinir :{n:'Açık Sınırlar', ico:'🗽', sars:1, e:{growMul:.08, dipMul:.10},
    flag:'openborder', d:'Savaşta olduğun imparatorluklarla bile ticaret yapabilirsin. AMA sınırların düşmana kapanmaz — bölgene serbestçe koloni kurabilirler.'},
  korsan_kral:{n:'Korsan Krallığı', ico:'☠', sars:1, e:{dmgMul:.10, spdMul:.10},
    flag:'pirateking', d:'Diplomasi tamamen kapalı — herkesle savaştasın. Karşılığında korsan yuvalarını üs olarak kullanır, fetihte %40 fazla yağma alırsın.'},
  evrensel_b :{n:'Evrensel Barış', ico:'🕊', sars:1, e:{etkFlat:2, dipMul:.25},
    flag:'universal', d:'ASLA savaş ilan edemezsin. Karşılığında federasyon oylamalarında tek başına karar geçirebilirsin.'},
  panoptikon :{n:'Panoptikon', ico:'👁', sars:1, e:{sensor:2, araMul:.05},
    flag:'panopt', d:'Tüm galaksiyi baştan görürsün. Ama senin sistemlerin de herkese açıktır — sürpriz yapamazsın.'}
};
const CIVIC_SLOTS = 3;

/* ---------- KÖKENLER ---------- */
const ORIGINS = {
  standart:{n:'Standart Başlangıç', ico:'◆',
    d:'Gelişmiş bir anavatan, tersane ve üç filo. Dengeli ve öngörülebilir.'},
  kalinti :{n:'Antik Kalıntı', ico:'🏛',
    d:'Anavatanın bir ölü uygarlığın üstüne kurulmuş. Başlangıçta +900 araştırma ve kalıntı yatağı.'},
  kapali  :{n:'Sıkı Sınırlar', ico:'🚧',
    d:'Kapalı toplum: +%25 başlangıç kaynağı ve anavatanda 2 kale. Ama tüm komşular sana −25 ilişkiyle başlar.'},
  kusatilmis:{n:'Kuşatılmış', ico:'🎯',
    d:'Üç rakip seni çevrelemiş halde başlarsın — ama 2 kale, +%40 filo ve savaş deneyimi vardır.'},
  son_umut:{n:'Son Umut', ico:'💀',
    d:'Yıkılmış bir medeniyetin kalıntısısın: tek koloni, çok az kaynak — ama tüm 1. kademe teknolojiler bedava.'},
  altin_cag:{n:'Altın Çağ', ico:'👑',
    d:'Üç kolonili güçlü bir imparatorlukla başlarsın. Ama herkes seni kıskanır (−30 ilişki) ve kriz erken gelir.'},
  golgeden:{n:'Gölgeden', ico:'🌑',
    d:'Kimse seni bilmiyor: hiç temas yok, sınırların görünmez. Karşılığında istihbarat toplamada bir basamak öndesin.'},
  gocebe  :{n:'Göçebe Filosu', ico:'🚀',
    d:'Anavatanın yok edildi. Küçük bir kolonide, fazladan 2 koloni gemisi ve güçlü bir filoyla yeniden başlıyorsun.'}
};

/* ---------- TÜR GÖRÜNÜŞLERİ ---------- */
const LOOKS = {
  humanoid:{n:'Hümanoid',   d:'İki ayaklı, simetrik, alet kullanan'},
  bocek   :{n:'Böceksi',    d:'Eklem bacaklı, kitin zırhlı'},
  surungen:{n:'Sürüngen',   d:'Pullu, soğukkanlı, sabırlı'},
  kristal :{n:'Kristalin',  d:'Silikon temelli, ışık kıran'},
  makine  :{n:'Sentetik',   d:'Metal gövde, ışıklı sensörler'},
  amorf   :{n:'Amorf',      d:'Şekilsiz, akışkan doku'},
  kanatli :{n:'Kanatlı',    d:'Uçucu, hafif kemikli'},
  akuatik :{n:'Akuatik',    d:'Solungaçlı, derin su kökenli'}
};
const EMP_COLORS = ['#4aa8d8','#ff5f6d','#96b13a','#8b7bff','#f2d452','#ff9b3d',
                    '#c98d4a','#6ff2c8','#e069c0','#5fd0b0','#ff7b5c','#a9d4ff'];

/* ---------- ARMA STİLLERİ ---------- */
const SIGILS = {
  simetrik:{n:'Simetrik', d:'Dengeli, klasik hanedan arması'},
  dikey   :{n:'Dikey',    d:'Uzun, sancak benzeri'},
  dairesel:{n:'Dairesel', d:'Mühür biçimli'},
  keskin  :{n:'Keskin',   d:'Köşeli, agresif hatlar'}
};

/* ---------- ırk arketipleri ---------- */
/* ═══════════════════════════════════════════════════════════════════
   GİZLİ ETİKLER (KİŞİLİKLER)
   Her imparatorluğun görünmeyen bir mizacı vardır. Oyuncu bunu
   doğrudan göremez — ancak istihbarat seviyesi 2'ye ulaşınca öğrenir.
   Bu değerler AI'ın kin matematiğini ve konsey oylarını belirler.
   ═══════════════════════════════════════════════════════════════════ */
const PERSONAS = {
  militarist:{n:'Militarist', ico:'⚔', col:'#ff5f6d',
    grudge:1.30,      // kin daha ağır birikir
    forgive:.75,      // yaraları daha yavaş unutur
    warBias:+.20,     // savaş iştahına doğrudan eklenir
    lifeSpace:.70,    // %85 kuralını .70'e çeker → çok daha erken tepki
    roomTol:1,        // yerleşecek 1 yer kalsa bile talep edebilir
    tradeVote:+.05,
    honorCare:.60,    // itibarını az önemser, ihaneti göze alır
    d:'Güç dilinden anlar. Kin tutar, komşusuna erken diş gösterir.'},
  tuccar:{n:'Tüccar', ico:'💰', col:'#f2d452',
    grudge:.85, forgive:1.25, warBias:-.15, lifeSpace:.95, roomTol:0,
    tradeVote:+.55, honorCare:1.15,
    d:'Savaş masraftır. Yollar açık kaldığı sürece barış kârlıdır.'},
  pasifist:{n:'Pasifist', ico:'🕊', col:'#65e08a',
    grudge:.55, forgive:1.60, warBias:-.30, lifeSpace:1.05, roomTol:0,
    tradeVote:+.35, honorCare:1.35,
    d:'Kin tutmakta zorlanır, verdiği sözü tutmaya özen gösterir.'},
  yayilmaci:{n:'Yayılmacı', ico:'🌱', col:'#96b13a',
    grudge:1.05, forgive:.95, warBias:+.10, lifeSpace:.85, roomTol:0,
    tradeVote:+.10, honorCare:.85,
    d:'Büyümek zorundadır. Yer kalmayınca komşusunun toprağına bakar.'},
  izolasyonist:{n:'İzolasyonist', ico:'🚧', col:'#8b7bff',
    grudge:1.00, forgive:1.00, warBias:-.05, lifeSpace:1.00, roomTol:0,
    tradeVote:-99,    // ortak standartlara ASLA evet demez
    honorCare:.95,
    d:'Kimseye karışmaz, kimsenin karışmasını istemez. Ortak kurallara kapalıdır.'}
};

/* Mizaç ırktan gelir, ama güçlü bir ideoloji onu ezer:
   kalıtım başlangıçtır, tercih sonuçtur. */
function personaOf(e){
  if (!e) return PERSONAS.yayilmaci;
  if (e._persAt === G.memAge && e._pers) return PERSONAS[e._pers];
  const et = e.ethics || {};
  /* Kurulumda bilinçli seçilmiş mizaç ırk çıkarımını ezer */
  let k = e.persLock || (RACES[e.race] && RACES[e.race].pers) || 'yayilmaci';
  if (hasCivic(e, 'exile') || hasCivic(e, 'pirateking')) k = 'izolasyonist';
  else if (hasCivic(e, 'trade') || hasCivic(e, 'cartel')) k = 'tuccar';
  else if ((et.mil || 0) >= 2) k = 'militarist';
  else if ((et.mil || 0) <= -2) k = 'pasifist';
  /* ═══ FAZ 49: SAHTEKÂR EKSENİ MİZACA BAĞLANDI ═══
     Faz 48'de eklediğim dördüncü eksen AI davranışını hiç
     etkilemiyordu. Koyu sahtekâr (ahl ≤ −2) bir devlet gölgede
     çalışmayı seçer: izolasyonist kabuğuna çekilir ve entrikayla
     iş görür. Militarist/pasifist kilidi bozulmaz — o eksenler
     daha güçlü bir kimlik tanımı. */
  else if ((et.ahl || 0) <= -2) k = 'izolasyonist';
  e._pers = k; e._persAt = G.memAge;
  return PERSONAS[k];
}
function personaKey(e){ personaOf(e); return e._pers; }
/* Oyuncunun kurulumda seçtiği mizaç kalıcı olarak sabitlenir;
   personaOf bu alanı ırk/civic çıkarımından önce dikkate alır. */
function applyChosenPersona(e, key){
  if (!e || !key || typeof PERSONAS === 'undefined' || !PERSONAS[key]) return;
  e.persLock = key;
}

/* ═══════════════════════════════════════════════════════════════════
   FAZ 52 — TÜR FİZYOLOJİLERİ
   Beş kök biyoloji. Irktan BAĞIMSIZ bir eksen: her ırk bir
   fizyolojiye sahip, oyuncu kurulumda seçebilir.
   Mekanik farklar habOf(), colonyOutput() ve büyüme hızında.
   ═══════════════════════════════════════════════════════════════════ */
const PHYSIO = {
  humanoid:{
    n:'İnsansı / Memeli', ico:'🧬',
    d:'Dengeli temel tür. Gezegen tercihi esnek, diplomatik güven tavanı yüksek.',
    art:'Her dünyada idare eder, hiçbirinde zirve yapmaz.',
    e:{trustCap:10},
    habBonus:0, growMul:0, yiyer:'yiyecek'
  },
  lithoid:{
    n:'Kayaç (Litoit)', ico:'💎',
    d:'Taştan doğdu, taş yer. Yiyecek tüketmez — mineral tüketir.',
    art:'Her gezegende +%50 yaşanabilirlik · büyüme −%25 · kara zırhı +%20',
    e:{minMul:-.10},                 // mineral yiyor: net üretim düşer
    habBonus:.50, growMul:-.25, yiyer:'mineral', groundArmor:.20
  },
  aquatic:{
    n:'Okyanus Canlısı', ico:'🌊',
    d:'Suya bağımlı. Okyanus ve tundrada muhteşem, çölde ölümcül.',
    art:'Okyanus/Tundra +%20 üretim ve moral · Çöl/Kurak −%35',
    e:{},
    habBonus:0, growMul:0, yiyer:'yiyecek',
    sever:['oky','sul','tun'], sevmez:['col','kur']
  },
  avian:{
    n:'Kuş Benzeri', ico:'🪶',
    d:'Hafif kemikli, hızlı. Uzayda çevik, yüzeyde kırılgan.',
    art:'Filo kaçınma +%10 · koloni kurma hızlı · kara savunması −%15',
    e:{spdMul:.10, colCost:-.15},
    habBonus:0, growMul:.10, yiyer:'yiyecek', evasion:.10, groundFrail:.15
  },
  plantoid:{
    n:'Bitkisel', ico:'🌱',
    d:'Fotosentezle beslenir. Işık bol olduğunda kendi kendine yeter.',
    art:'Enerjiden pasif yiyecek üretir · soğuk dünyalarda enerji ×2',
    e:{yiyMul:.15},
    habBonus:.10, growMul:-.10, yiyer:'yiyecek', photo:true
  }
};

/* Bir devletin fizyolojisi — ırkın bio alanından türetilir,
   kurulumda cfg.physio ile geçersiz kılınabilir. */
function physioOf(e){
  if (!e) return PHYSIO.humanoid;
  if (e.physio && PHYSIO[e.physio]) return PHYSIO[e.physio];
  const bio = RACES[e.race] ? RACES[e.race].bio : 'organik';
  if (bio === 'litoit') return PHYSIO.lithoid;
  if (bio === 'makine') return PHYSIO.humanoid;   // makineler ayrı sistemde
  return PHYSIO.humanoid;
}

const RACES = {
  insan:{
    n:'Birleşik Yıldız Cumhuriyeti', kisa:'Cumhuriyet', sifat:'Barışçıl · Demokratik',
    d:'Oylar sayılır, anlaşmalar imzalanır, filolar yalnızca son çare olarak yakılır. Galaksiyi kılıçla değil masayla birleştirmek isterler.',
    col:'#4aa8d8', ik:'islak', bio:'organik',
    e:{araMul:.10, dipMul:.35, etkFlat:1, dmgMul:-.05},
    dip:1, agr:.25, exp:.6, pers:'pasifist', eth:{mil:-2, aut:-2, mat:1}, ozel:'Organik: yiyecekle beslenir. Diplomasi ve ittifak odaklı; savaşta zayıf.',
    win:'diplomasi', winD:'Federasyon kur ve galaksinin %40\'ını müttefiklerinle birlikte kontrol et.'
  },
  klan:{
    n:'Vorrak Klan Birliği', kisa:'Klanlar', sifat:'Militarist · Yayılmacı',
    d:'Onur çelikle ölçülür. Her yeni yıldız, ele geçirilmesi gereken bir meydan okumadır.',
    col:'#ff5f6d', ik:'kuru', bio:'organik',
    e:{dmgMul:.18, hullMul:.10, buildMul:.25, dipMul:-.35, araMul:-.08},
    dip:.3, agr:.9, exp:.8, pers:'militarist', eth:{mil:3, aut:2, mat:0}, ozel:'Organik: yiyecekle beslenir. Gemi inşası hızlı, diplomasi neredeyse imkânsız.',
    win:'fetih', winD:'Galaksideki yıldız sistemlerinin %55\'ini fethet.'
  },
  suru:{
    n:'Zhal Sürü Zihni', kisa:'Sürü', sifat:'Kovan Zihni · Yayılmacı',
    d:'Tek bir irade, milyarlarca beden. Sürü konuşmaz; büyür.',
    col:'#96b13a', ik:'islak', bio:'organik',
    e:{growMul:.35, yiyMul:.25, minMul:.10, colCost:-.20, dipMul:-1},
    dip:0, agr:.7, exp:1, pers:'yayilmaci', eth:{mil:1, aut:3, mat:-1}, ozel:'KOVAN ZİHNİ: tek irade — kolonilerde istikrar hiç düşmez (min %92). Diplomasi yoktur.',
    win:'kolonizasyon', winD:'Yaşanabilir dünyaların %50\'sini kolonize et.'
  },
  makine:{
    n:'Sentetik Uyum Kolektifi', kisa:'Kolektif', sifat:'Makine Zekâsı · Asimilasyoncu',
    d:'Organik hata payını hesaplarlar. Fethettikleri her nüfusu devreye alır, kusurlarını siler.',
    col:'#8b7bff', ik:'makine', bio:'makine',
    e:{minMul:.30, alaMul:.20, stab:25, growMul:-.15, dipMul:-.80},
    dip:.05, agr:.75, exp:.7, pers:'izolasyonist', eth:{mil:1, aut:2, mat:2}, ozel:'MAKİNE: yiyecek yerine ENERJİ tüketir. Her gezegende %60 yaşanabilirlik. Fethettiği nüfusu asimile eder.',
    win:'asimilasyon', winD:'40 nüfus birimini asimile et ve sistemlerin %45\'ini ele geçir.'
  },
  meclis:{
    n:'Kutsal Amarant Meclisi', kisa:'Meclis', sifat:'Ruhaniyetçi · Teokratik',
    d:'Yıldızlar tanrıların gözleridir. Meclis, galaksiyi tek bir inanç altında toplamayı görev bilir.',
    col:'#f2d452', ik:'kuru', bio:'organik',
    e:{etkFlat:2.5, araMul:.08, dipMul:.20, growMul:.10, alaMul:-.10},
    dip:.7, agr:.5, exp:.65, pers:'pasifist', eth:{mil:0, aut:2, mat:-3}, ozel:'Organik: yiyecekle beslenir. Etki üretimi çok yüksek, alaşım üretimi zayıf.',
    win:'etki', winD:'Toplam 900 etki biriktir ve sistemlerin %35\'ini kontrol et.'
  },
  lonca:{
    n:'Kaskad Ticaret Loncası', kisa:'Lonca', sifat:'Megakorporasyon · Tüccar',
    d:'Her savaş bir maliyet kalemidir. Lonca, galaksiyi satın almayı yeğler.',
    col:'#ff9b3d', ik:'kuru', bio:'organik',
    e:{eneMul:.40, minMul:.12, dipMul:.15, upMul:-.15, dmgMul:-.08},
    dip:.6, agr:.4, exp:.7, pers:'tuccar', eth:{mil:-1, aut:-2, mat:2}, ozel:'Organik: yiyecekle beslenir. Enerji ve ticaret devi; filo bakımı ucuz.',
    win:'ekonomi', winD:'Aylık 220 net enerji üretimine ulaş ve 10 koloni işlet.'
  },
  /* ═══ FAZ 53: GEOID → TEKNOKRASİ ═══
     "Geoid" bir YÖNETİM biçimi değil, bir TÜR FİZYOLOJİSİ (Faz 52).
     Yönetim listesinden çıkarıldı; yerine araştırma odaklı bir
     rejim geldi. Kayaç yaşamı isteyen oyuncu 3. sekmeden
     💎 Kayaç fizyolojisini seçer — hangi yönetimle olursa. */
  teknokrasi:{
    n:'Aksiyom Teknokrasisi', kisa:'Teknokrasi', sifat:'Bilimsel · Liyakat',
    d:'Yönetim kurulunda oy hakkı yayınlanmış makaleyle kazanılır. Duygu değil veri karar verir; hata kabul edilebilir, cehalet edilemez.',
    col:'#4bb8f0', ik:'islak', bio:'organik',
    e:{araMul:.30, buildMul:.12, etkFlat:-1, dmgMul:-.08},
    /* pers: PERSONAS içinde 'bilimci' yok — tanımlı beş mizaçtan
       teknokrasiye en yakın olan 'tuccar' (hesapçı, üretim odaklı). */
    dip:.6, agr:.35, exp:.65, pers:'tuccar', eth:{mil:-1, aut:0, mat:2},
    ozel:'TEKNOKRASİ: +%30 araştırma ve +%12 inşa hızı. Diplomatik etki üretimi düşük, filoları zayıf vurur.',
    win:'bilim', winD:'Teknoloji ağacının tamamını ve tüm zirve teknolojileri tamamla.'
  },
  kasif:{
    n:'Ilyari Keşif Sözleşmesi', kisa:'Sözleşme', sifat:'Bilimci · Kâşif',
    d:'Bilinmeyen bir hakarettir. Sözleşme, galaksinin her sırrını kataloglamaya yeminlidir.',
    col:'#6ff2c8', ik:'soguk', bio:'organik',
    e:{araMul:.35, spdMul:.20, sensor:1, dmgMul:-.10, minMul:-.08},
    dip:.65, agr:.3, exp:.75, pers:'yayilmaci', eth:{mil:-2, aut:-1, mat:3}, ozel:'Organik: yiyecekle beslenir. Araştırma ve keşif hızı en yüksek; muharebede zayıf.',
    win:'bilim', winD:'Tüm 5. kademe teknolojileri tamamla (Tekillik, Federasyon, Nanit).'
  }
};

/* ---------- ZAFER YOLLARI ----------
   Artık HER imparatorluk her yolu deneyebilir. Kendi ırkının doğal
   yolunda eşik %20 daha düşük (uzmanlık avantajı), diğer yollarda
   tam eşik geçerli. Ayrıca hiçbir zafer MIN_WIN_YEAR'dan önce
   sayılmaz ve koşul HOLD_MONTHS boyunca korunmalıdır.            */
/* FAZ 52: 2238 → 2255. Bilim zaferi 27. yılda tetikleniyordu;
   galaksinin siyasi dokusu oturmadan zafer ilan edilmemeli. */
const MIN_WIN_YEAR = 2255;   // ilk 45 yıl zafer kilitli
/* FAZ 53: ağaç bitince açılan tekrarlanabilir döngü. Her tur
   giderek pahalılaşır; bilim zaferi artık uzun soluklu bir
   yatırım. 12 tur ≈ 25-35 yıl. */
const ASCEND_NEED = 12;
const HOLD_MONTHS  = 18;     // koşul 1.5 yıl korunmalı

/* FAZ 50: askerî hakimiyet payı — kendi sistemleri + vasallarınki */
/* ═══ FAZ 50: SKOR DÖKÜMÜ ═══
   Dört eksende galaksi ortalamasına oran. 1.0 = ortalama. */
function scoreCard(e){
  if (!e) return null;
  const canli = G.emps.filter(x => !x.dead && !x.wild && !x.crisisSide);
  const ort = (fn) => {
    let t = 0, n = 0;
    for (const x of canli){ t += fn(x); n++; }
    return n ? Math.max(.01, t / n) : .01;
  };
  const askeri = (x) => (typeof totalPower === 'function') ? totalPower(x) : 0;
  /* ═══ FAZ 52: TEKNOLOJİ SKORU AYRIŞMASI ═══
     ÖLÇÜM (Faz 51): herkes 40 teknolojide eşitlenip ×1.00
     üretiyordu — skorda hiç ayrım yoktu. Artık logaritmik ölçek
     (son teknolojiler daha değerli) + İLK KEŞFEDEN bonusu. */
  const tekno = (x) => {
    const n = Object.keys(x.techs || {}).filter(t => TECHS[t]).length;
    if (!n) return 0;
    /* Logaritmik taban: 10 tekno = 33, 40 tekno = 100 */
    let v = Math.log(1 + n) / Math.log(41) * 100;
    /* İlk keşfeden bonusu: G._firstTech sözlüğü */
    let ilk = 0;
    for (const t in (G._firstTech || {})) if (G._firstTech[t] === x.id) ilk++;
    v += ilk * 6;
    return v;
  };
  const ekonomi= (x) => {
    let v = 0; for (const c of (x.colonies || [])){
      const pl = G.sys[c.s] && G.sys[c.s].planets[c.p];
      if (pl && pl.col) v += (pl.col.pop || 0) + colonyUsed(pl.col) * 2;
    } return v;
  };
  const casus  = (x) => {
    let v = 0;
    for (const k in (x.intel || {})) v += x.intel[k] || 0;
    v += (x.opLog || []).filter(w => !w.caught).length * 2;
    return v;
  };
  const satir = [
    {n:'Askerî Güç',  ico:'⚔', c:'#ff5f6d', v:askeri(e),  oran:askeri(e)/ort(askeri)},
    {n:'Teknoloji',   ico:'🔬', c:'#5c9ef5', v:tekno(e),   oran:tekno(e)/ort(tekno)},
    {n:'Ekonomi',     ico:'⛏', c:'#f5c25c', v:ekonomi(e), oran:ekonomi(e)/ort(ekonomi)},
    {n:'Casusluk',    ico:'🕵', c:'#d65cf5', v:casus(e),   oran:casus(e)/ort(casus)}
  ];
  let toplam = satir.reduce((a, r) => a + r.oran * 250, 0);
  /* FAZ 51: kriz kahramanlığı ayrı bir onur satırı */
  if (e.crisisScore){
    satir.push({n:'Kriz Kahramanlığı', ico:'🛡', c:'#6ff2c8',
      v:e.crisisScore, oran: Math.min(2, e.crisisScore / 400)});
    toplam += Math.min(500, e.crisisScore * .8);
  }
  return {satir, toplam};
}

function askeriPay(e){
  if (!e) return 0;
  let n = sysCount(e);
  for (const o of G.emps){
    if (o.dead || o.wild || o.crisisSide || o.id === e.id) continue;
    if (typeof isVassal === 'function' && isVassal(o) && o.overlord === e.id)
      n += sysCount(o);
  }
  return n / Math.max(1, G.sys.length);
}

const WIN_TYPES = {
  fetih:{
    n:'FETİH', ico:'⚔',
    d:'Galaksideki yıldız sistemlerinin çoğunluğunu ele geçir.',
    esik:.60,
    /* FAZ 50: vasal sistemleri de sayılır — "fethetmek VEYA vasal
       yapmak". Boyun eğdirmek de bir fetih biçimidir. */
    olc(e, k){ return askeriPay(e) / k; },
    txt(e, k){ return Math.round(askeriPay(e) * G.sys.length * k) +
      ' / ' + Math.ceil(G.sys.length*k) + ' sistem (vasal dahil)'; }
  },
  /* ═══ FAZ 50: DİPLOMATİK HEGEMONYA ═══
     Konseyde daimi başkan olmak VE oyların %55'ini elinde tutmak.
     Tek kurşun atmadan galaksiyi yönetmenin yolu. */
  hegemonya:{
    n:'HEGEMONYA', ico:'🏛',
    d:'Galaktik Konsey\'de daimi başkan ol ve oyların çoğunluğunu elinde tut.',
    esik:.55,
    olc(e, k){
      if (typeof councilExists !== 'function' || !councilExists()) return 0;
      const c = G.council;
      if (!c.members.includes(e.id)) return 0;
      if (c.president !== e.id) return 0;
      let toplam = 0, benim = 0;
      for (const m of c.members){
        const o = G.emps[m];
        if (!o || o.dead) continue;
        const w = (typeof voteWeight === 'function') ? voteWeight(o) : 1;
        toplam += w;
        if (m === e.id) benim += w;
      }
      if (toplam <= 0) return 0;
      return (benim / toplam) / k;
    },
    txt(e, k){
      if (typeof councilExists !== 'function' || !councilExists()) return 'konsey yok';
      const c = G.council;
      if (c.president !== e.id) return 'başkan değilsin';
      let toplam = 0, benim = 0;
      for (const m of c.members){
        const o = G.emps[m];
        if (!o || o.dead) continue;
        const w = (typeof voteWeight === 'function') ? voteWeight(o) : 1;
        toplam += w; if (m === e.id) benim += w;
      }
      return '%' + Math.round(benim / Math.max(.01, toplam) * 100) +
        ' oy · hedef %' + Math.round(k * 100);
    }
  },
  diplomasi:{
    n:'FEDERASYON', ico:'🕊',
    d:'En az 3 müttefikle birlikte galaksinin çoğunluğunu kontrol et.',
    esik:.58,
    olc(e, k){
      let allied = sysCount(e), n = 0;
      for (const o of G.emps) if (!o.dead && !o.wild && o.id !== e.id && e.ally[o.id]){ allied += sysCount(o); n++; }
      const terr = allied / Math.max(1,G.sys.length) / k;
      return Math.min(terr, n/3);
    },
    txt(e, k){
      let allied = sysCount(e), n = 0;
      for (const o of G.emps) if (!o.dead && !o.wild && o.id !== e.id && e.ally[o.id]){ allied += sysCount(o); n++; }
      return n + '/3 müttefik · ' + allied + '/' + Math.ceil(G.sys.length*k) + ' sistem';
    }
  },
  kolonizasyon:{
    n:'YAYILMA', ico:'🌱',
    d:'Galaksideki yaşanabilir dünyaların çoğunu kolonize et.',
    esik:.55,
    olc(e, k){
      let hab = 0, mine = 0;
      for (const s of G.sys) for (const p of s.planets)
        if (PLANETS[p.t].k === 'hab'){ hab++; if (p.owner === e.id) mine++; }
      return hab ? mine/hab/k : 0;
    },
    txt(e, k){
      let hab = 0, mine = 0;
      for (const s of G.sys) for (const p of s.planets)
        if (PLANETS[p.t].k === 'hab'){ hab++; if (p.owner === e.id) mine++; }
      return mine + ' / ' + Math.ceil(hab*k) + ' yaşanabilir dünya';
    }
  },
  asimilasyon:{
    n:'ASİMİLASYON', ico:'⚙',
    d:'Fethettiğin nüfusu devreye al ve galaksinin yarısını tut.',
    esik:.50, hedef:70,
    olc(e, k){ return Math.min((e.assim||0)/(70*k), sysCount(e)/Math.max(1,G.sys.length)/k); },
    txt(e, k){ return Math.round(e.assim||0) + ' / ' + Math.ceil(70*k) + ' asimile nüfus · ' +
      sysCount(e) + '/' + Math.ceil(G.sys.length*k) + ' sistem'; }
  },
  etki:{
    n:'HÂKİMİYET', ico:'◈',
    d:'Devasa bir etki birikimiyle galaksiye sözünü geçir.',
    esik:.42, hedef:1600,
    olc(e, k){ return Math.min(e.etkTotal/(1600*k), sysCount(e)/Math.max(1,G.sys.length)/k); },
    txt(e, k){ return Math.round(e.etkTotal||0) + ' / ' + Math.ceil(1600*k) + ' toplam etki'; }
  },
  ekonomi:{
    n:'EKONOMİ', ico:'💰',
    d:'Galaktik ekonomiyi ele geçir: dev bir enerji akışı ve geniş bir koloni ağı.',
    esik:1, hedef:300,
    olc(e, k){ return Math.min((e.inc.ene||0)/(300*k), e.colonies.length/(14*k)); },
    txt(e, k){ return Math.round(e.inc.ene||0) + '/' + Math.ceil(300*k) + ' enerji · ' +
                      e.colonies.length + '/' + Math.ceil(14*k) + ' koloni'; }
  },
  konsey:{
    n:'KONSEY HÂKİMİYETİ', ico:'🏛',
    d:'Galaktik Konsey\'e 3 dönem başkanlık et ve oylarda ağırlığı elinde tut.',
    esik:1,
    olc(e, k){ return (typeof councilDominance === 'function') ? councilDominance(e) / k : 0; },
    txt(e, k){
      if (typeof councilExists !== 'function' || !councilExists()) return 'konsey kurulmadı';
      const c = G.council;
      const terms = (c.terms && c.terms[e.id]) || 0;
      return terms + '/3 dönem başkanlık' + (c.president === e.id ? ' · şu an başkansın' : '');
    }},
  bilim:{
    n:'BİLİM', ico:'✦',
    d:'Teknoloji ağacının TAMAMINI tüket ve zirve teknolojilere ulaş.',
    esik:1,
    olc(e, k){
      const total = Object.keys(TECHS).length;
      const done = Object.keys(e.techs).filter(t=>TECHS[t]).length;
      /* ═══ FAZ 52: BİLİM ZAFERİ DENGELEMESİ ═══
         ÖLÇÜM (Faz 51): zafer 27. yılda tetikleniyordu — teknoloji
         sayısı tavana çok hızlı vuruyor. İki düzeltme:
         a) zirve listesine m_gaia eklendi (Faz 35'te eklenmiş ama
            listeye girmemişti) — artık 4 zirve teknoloji gerekiyor
         b) ağacın TAMAMI şartı: done/total oranı k ile değil
            doğrudan 1'e karşı ölçülüyor, yani tek eksik teknoloji
            bile zaferi bloke eder. */
      const peakList = ['f_zaman','t_galaktik','m_yildiz','m_gaia'];
      const peak = peakList.filter(t => TECHS[t] && e.techs[t]).length;
      const peakN = peakList.filter(t => TECHS[t]).length || 1;
      /* ═══ FAZ 53: KADİM ARAŞTIRMA ŞARTI ═══
         ÖLÇÜM (100 yıl × 3 tohum): ağaç 14-17. yılda tükeniyordu
         ve MIN_WIN_YEAR kilidi yalnız GECİKTİRİYORDU — üç tohumda
         da bilim zaferi çıktı (yıl 44, 47, 71).
         Artık ağacın tamamı YETMİYOR: 40 teknolojiden sonra açılan
         "Kadim Araştırma" döngüsünden ASCEND_NEED tur tamamlanmalı.
         Bu, bilimi bir varış değil sürekli bir yatırım yapıyor. */
      const kadim = Math.min(1, (e.ascend || 0) / ASCEND_NEED);
      return Math.min(done/total, peak/peakN, kadim);
    },
    txt(e, k){
      const total = Object.keys(TECHS).length;
      const doneT = Object.keys(e.techs).filter(t=>TECHS[t]).length;
      if (doneT >= total)
        return 'Kadim Araştırma ' + (e.ascend || 0) + ' / ' + ASCEND_NEED;
      const done = Object.keys(e.techs).filter(t=>TECHS[t]).length;
      const peak = ['f_zaman','t_galaktik','m_yildiz'].filter(t=>e.techs[t]).length;
      return done + '/' + total + ' teknoloji · ' + peak + '/3 zirve';
    }
  }
};
/* Tüm ırklar tüm zafer yollarında AYNI eşiği aşmak zorundadır.
   Irka özel indirim kaldırıldı — kendi yolun sadece bir eğilim,
   ayrıcalık değil. */
function winScale(e, type){
  return 1;
}

/* ---------- zorluk ---------- */
const DIFFS = {
  kolay :{n:'KOLAY',  d:'Yapay zekâ ihtiyatlı',  aiMul:.75, aiAgr:.7,  start:1.35},
  normal:{n:'NORMAL', d:'Dengeli galaksi',       aiMul:1,   aiAgr:1,   start:1},
  zor   :{n:'ZOR',    d:'Rakipler acımasız',     aiMul:1.35,aiAgr:1.3, start:.85},
  kabus :{n:'KÂBUS',  d:'Galaksi seni istemiyor',aiMul:1.8, aiAgr:1.6, start:.7}
};
/* ═══════════════════════════════════════════════════════════════════
   FAZ 32 — GENİŞLETİLMİŞ EVREN
   ÖLÇÜM: "sys:88" tanımlıydı ama gerçekte 58 sistem üretiliyordu.
   Sebep: harita alanı (G.W) sabit 4200 ve minD oranı sabit; yıldızlar
   sığmayınca yerleştirme döngüsü sessizce vazgeçiyordu.
   Çözüm: harita alanı sistem sayısına göre ölçekleniyor (galaxyScale).
   ═══════════════════════════════════════════════════════════════════ */
const SIZES = {
  kucuk :{n:'KÜÇÜK',  sys:30,  ai:3,  d:'30 sistem · 4 imparatorluk'},
  orta  :{n:'ORTA',   sys:45,  ai:5,  d:'45 sistem · 6 imparatorluk'},
  buyuk :{n:'BÜYÜK',  sys:60,  ai:7,  d:'60 sistem · 8 imparatorluk'},
  devasa:{n:'DEVASA', sys:80,  ai:9,  d:'80 sistem · 10 imparatorluk'},
  ulu   :{n:'ULU',    sys:100, ai:11, d:'100 sistem · 12 imparatorluk · ağır'}
};
/* Harita kenarı: 30 sistem → 4200, 100 sistem → ~7670.
   Yıldız yoğunluğu (px/sistem) tüm boyutlarda benzer kalır. */
function galaxyScale(sysN){
  return Math.round(4200 * Math.sqrt(Math.max(30, sysN) / 30) * .78 + 900);
}
const SHAPES = {
  sarmal :{n:'SARMAL',  d:'Kollu galaksi'},
  halka  :{n:'HALKA',   d:'Merkezi boş'},
  kume   :{n:'KÜME',    d:'Dağınık öbekler'}
};

/* ---------- yıldız sınıfları ---------- */
const STARS = [
  {n:'M Kırmızı Cüce', c:'#ff7b5c', r:4.5, w:30},
  {n:'K Turuncu',      c:'#ffab5c', r:5,   w:22},
  {n:'G Sarı',         c:'#ffe9a8', r:5.5, w:20},
  {n:'F Beyaz-Sarı',   c:'#fff6e0', r:6,   w:12},
  {n:'A Beyaz',        c:'#dff0ff', r:6.5, w:8},
  {n:'B Mavi',         c:'#a9d4ff', r:7.5, w:4},
  {n:'Nötron Yıldızı', c:'#e2f7ff', r:3,   w:2, ozel:1},
  {n:'Kara Delik',     c:'#1a1030', r:4,   w:2, ozel:1}
];

/* ---------- isim üreteci ---------- */
const SYL_A = ['Ar','Bel','Cyn','Dra','El','Fen','Gal','Hyd','Ith','Jor','Kal','Lyr','Mor','Nex','Orr','Pyr','Quo','Rha','Sol','Tar','Ulv','Ver','Wyn','Xan','Yel','Zor','Ath','Cor','Dun','Esh'];
const SYL_B = ['a','e','i','o','u','ae','ia','oo','ei','ya'];
const SYL_C = ['dor','nex','tar','mir','vos','kar','lith','ran','deth','zil','phor','gath','rus','ven','tyr','sha','krim','pol','dex','nar'];
const ROMAN = ['I','II','III','IV','V','VI','VII','VIII','IX','X'];

function starName(rnd){
  let s = pick(rnd,SYL_A);
  if (rnd()<.55) s += pick(rnd,SYL_B);
  s += pick(rnd,SYL_C);
  if (rnd()<.22) s += '-' + (Math.floor(rnd()*9)+1) + (Math.floor(rnd()*9)+1);
  return s;
}

/* ---------- olaylar (anomali) ---------- */
/* ═══════════════════════════════════════════════════════════════════
   FAZ 17 — ANOMALİ TÜRLERİ
   Her anomali bir SINIFA ait: haritada farklı simge ve renkle
   görünür, böylece oyuncu neyi taradığını önceden sezer.
   ═══════════════════════════════════════════════════════════════════ */
const ANOM_KINDS = {
  sinyal:{n:'Bilinmeyen Sinyal', ico:'≋', col:'#8b7bff',
    d:'Kaynağı belirsiz bir yayın. Genelde bilgi, bazen tuzak.'},
  kalinti:{n:'Antik Kalıntı', ico:'⌘', col:'#ff9b3d',
    d:'Kayıp bir uygarlıktan kalan yapı. Zengin ama uyandırılmamalı.'},
  megayapi:{n:'Terk Edilmiş Megayapı', ico:'◎', col:'#6ff2c8',
    d:'Devasa, sahipsiz bir inşa. İçinde ne olduğu bilinmiyor.'},
  dogal:{n:'Doğal Olgu', ico:'✦', col:'#65e08a',
    d:'Evrenin kendi tuhaflığı. Ölçüm değerli, yaklaşmak riskli.'}
};

const ANOMALIES = [
  {id:'a1', k:'megayapi', n:'Terk Edilmiş İstasyon', t:'Yörüngede sürüklenen kadim bir liman. Işıkları hâlâ yanıyor ama içeride kimse yok.',
   ch:[{t:'Sistemleri tara', d:'+180 araştırma', f:g=>{g.p.res.ara+=180; return 'Veri bankaları çözüldü: +180 araştırma.';}},
       {t:'Gövdeyi sök', d:'+220 mineral, +60 alaşım', f:g=>{g.p.res.min+=220; g.p.res.ala+=60; return 'İstasyon hurdaya ayrıldı: +220 mineral, +60 alaşım.';}}]},
  {id:'a2', k:'dogal', n:'Kristal Mezarlık', t:'Buzun altında, düzenli sıralar hâlinde dizilmiş devasa kristal sütunlar.',
   ch:[{t:'Örnek al', d:'+150 araştırma', f:g=>{g.p.res.ara+=150; return 'Kristal kafes yapısı çözümlendi: +150 araştırma.';}},
       {t:'Madencilik başlat', d:'+300 mineral', f:g=>{g.p.res.min+=300; return 'Kristal hasadı yapıldı: +300 mineral.';}}]},
  {id:'a3', k:'sinyal', n:'Sessiz Sinyal', t:'Gezegenin çekirdeğinden ritmik bir darbe geliyor. Hiçbir dile benzemiyor.',
   ch:[{t:'Sinyali yanıtla', d:'Riskli: bilinmeyen sonuç', f:(g,r)=>{ if(r()<.5){g.p.res.ara+=320; return 'Sinyal bir arşivdi. Kütüphane açıldı: +320 araştırma.';} g.p.res.etk-=25; return 'Yanıt bir alarmdı. Bilinmeyen bir şey uyandı ve komşuların paniğe kapıldı: −25 etki.';}},
       {t:'Kayıt al ve uzaklaş', d:'+90 araştırma', f:g=>{g.p.res.ara+=90; return 'Sinyal arşivlendi: +90 araştırma.';}}]},
  {id:'a4', k:'megayapi', n:'Savaş Enkazı', t:'Kimliği belirsiz iki filo burada birbirini yok etmiş. Enkaz hâlâ soğumamış.',
   ch:[{t:'Silah sistemlerini incele', d:'+200 araştırma', f:g=>{g.p.res.ara+=200; return 'Yabancı silah mimarisi çözüldü: +200 araştırma.';}},
       {t:'Alaşımı topla', d:'+140 alaşım', f:g=>{g.p.res.ala+=140; return 'Enkaz eritildi: +140 alaşım.';}}]},
  {id:'a5', k:'dogal', n:'Yaşam İzleri', t:'Atmosferde işlenmiş organik bileşikler var. Burada bir şey yaşıyordu.',
   ch:[{t:'Biyosferi haritala', d:'+130 araştırma, +80 yiyecek', f:g=>{g.p.res.ara+=130; g.p.res.yiy+=80; return 'Biyosfer kataloglandı: +130 araştırma, +80 yiyecek.';}},
       {t:'Karantinaya al', d:'+1.5 etki', f:g=>{g.p.res.etk+=15; return 'İhtiyat komşularınca takdir edildi: +15 etki.';}}]},
  {id:'a6', k:'megayapi', n:'Yörünge Deposu', t:'Otomatik bir kargo deposu, yüklerini teslim edeceği imparatorluğu bekliyor. O imparatorluk artık yok.',
   ch:[{t:'Depoyu boşalt', d:'+260 mineral, +120 enerji', f:g=>{g.p.res.min+=260; g.p.res.ene+=120; return 'Kargo devralındı: +260 mineral, +120 enerji.';}},
       {t:'Yazılımı çöz', d:'+170 araştırma', f:g=>{g.p.res.ara+=170; return 'Depo zekâsı incelendi: +170 araştırma.';}}]},
  {id:'a7', k:'dogal', n:'Boşluk Balinası İskeleti', t:'Kilometrelerce uzunlukta, uzayda yüzerek ölmüş bir canlının kalıntısı.',
   ch:[{t:'Kemik yapısını incele', d:'+240 araştırma', f:g=>{g.p.res.ara+=240; return 'Biyo-mühendislik dersleri alındı: +240 araştırma.';}},
       {t:'Cesedi hasat et', d:'+200 yiyecek, +90 mineral', f:g=>{g.p.res.yiy+=200; g.p.res.min+=90; return 'Hasat tamamlandı: +200 yiyecek, +90 mineral.';}}]},
  {id:'a8', k:'megayapi', n:'Yörüngesel Ayna', t:'Yıldızın ışığını gezegene odaklayan devasa bir yapay ayna. Kim, neden?',
   ch:[{t:'Aynayı devral', d:'+3 aylık enerji (kalıcı)', f:g=>{g.p.extra.eneFlat=(g.p.extra.eneFlat||0)+3; recalcMods(g.p); return 'Ayna şebekeye bağlandı: kalıcı +3 enerji/ay.';}},
       {t:'Yapımcıyı ara', d:'+210 araştırma', f:g=>{g.p.res.ara+=210; return 'Yapımcının izi bulunamadı ama teknolojisi anlaşıldı: +210 araştırma.';}}]},
  {id:'a9', k:'kalinti', n:'Kapalı Kapı', t:'Gezegenin yüzeyinde, hiçbir bilinen malzemeden yapılmamış bir kapı. Kilitli.',
   ch:[{t:'Kapıyı zorla', d:'Riskli', f:(g,r)=>{ if(r()<.45){ g.p.res.ara+=420; return 'Kapı açıldı. İçerideki arşiv paha biçilemez: +420 araştırma.';} g.p.res.min-=60; return 'Kapı ekibi yuttu. Sondaj takımı kayıp: −60 mineral.';}},
       {t:'Mühürlü bırak', d:'+120 araştırma', f:g=>{g.p.res.ara+=120; return 'Kapı belgelendi ve mühürlü bırakıldı: +120 araştırma.';}}]},
  {id:'a10', k:'megayapi', n:'Terkedilmiş Tersane', t:'Yörüngede, yarım kalmış bir gemi iskeletiyle birlikte duran otomatik bir tersane.',
   ch:[{t:'Tersaneyi kurtar', d:'+180 alaşım', f:g=>{g.p.res.ala+=180; return 'Tersane sökülüp taşındı: +180 alaşım.';}},
       {t:'İnşa planlarını al', d:'+260 araştırma', f:g=>{g.p.res.ara+=260; return 'Gemi mimarisi arşivlendi: +260 araştırma.';}}]},

  /* ── FAZ 17: RİSKLİ ANOMALİLER ──
     Her seçim ödül değil. Açgözlülük bedel ödetir; temkin ödülü
     küçültür. Keşif artık gerçek bir karar. */
  {id:'a11', k:'sinyal', n:'Bilinmeyen Sinyal', t:'Sistemin derinliğinden düzenli aralıklarla bir çağrı geliyor. Kaynağı hiçbir kayıtta yok.',
   ch:[{t:'Sinyale karşılık ver', d:'büyük ödül · risk var', f:g=>{
        if (rnd() < .55){ g.p.res.ara += 420; return 'Karşılık verildi: kadim bir zekâ bize bilgi bıraktı — +420 araştırma.'; }
        for (const c of g.p.colonies){ const pl = G.sys[c.s].planets[c.p];
          if (pl.col) pl.col.stab = clamp(pl.col.stab - 14, 0, 100); }
        return 'Sinyal bir çağrıymış. Halk arasında kâbuslar başladı: tüm kolonilerde istikrar −14.';}},
       {t:'Kaydet ve uzaklaş', d:'+140 araştırma', f:g=>{g.p.res.ara+=140; return 'Sinyal arşivlendi, temas kurulmadı: +140 araştırma.';}}]},

  {id:'a12', k:'megayapi', n:'Terk Edilmiş Megayapı', t:'Bir gezegeni saran, yarısı çökmüş devasa bir halka. İnşa edenler geri dönmemiş.',
   ch:[{t:'İçeri dal ve söktür', d:'çok mineral · gemi riski', f:g=>{
        if (rnd() < .62){ g.p.res.min += 640; g.p.res.ala += 150;
          return 'Halkanın omurgası söküldü: +640 mineral, +150 alaşım.'; }
        const f2 = G.fleets.filter(x => x.e === 0 && x.ships.length);
        if (f2.length){ const ff = f2[Math.floor(rnd()*f2.length)];
          const kayip = Math.max(1, Math.floor(ff.ships.length * .35));
          ff.ships.splice(0, kayip);
          return 'Yapı çöktü — ' + kayip + ' gemi enkazın altında kaldı.'; }
        return 'Yapı çöktü, kıl payı kurtulduk.';}},
       {t:'Dıştan haritala', d:'+300 araştırma', f:g=>{g.p.res.ara+=300; return 'Mimarisi tarandı: +300 araştırma.';}}]},

  {id:'a13', k:'kalinti', n:'Antik Kalıntı Mezarlığı', t:'Yüzeyde binlerce yıl önce gömülmüş bir uygarlığın izleri. Bazı mezarlar mühürlü.',
   ch:[{t:'Mühürleri kır', d:'ödül ya da salgın', f:g=>{
        if (rnd() < .58){ g.p.res.ara += 340; g.p.res.etk += 60;
          return 'Mezarlar bir arşiv çıktı: +340 araştırma, +60 etki.'; }
        for (const c of g.p.colonies){ const pl = G.sys[c.s].planets[c.p];
          if (pl.col && pl.col.pop > 3) pl.col.pop -= 1; }
        return 'Mühürler bir patojeni serbest bıraktı. Kolonilerde nüfus kaybı.';}},
       {t:'Saygıyla belgele', d:'+180 araştırma, +40 etki', f:g=>{
        g.p.res.ara+=180; g.p.res.etk+=40;
        return 'Mezarlığa dokunulmadı, kayıt altına alındı: +180 araştırma, +40 etki.';}}]},
  {id:'a14', k:'kalinti', n:'Mühürlü Lahit',
   t:'Asteroidin göbeğine oyulmuş, dışarıdan mühürlenmiş bir oda. Mühürler İÇERİDEN değil, dışarıdan vurulmuş.',
   ch:[{t:'Mührü kırma, uzaktan tara', d:'+140 araştırma · güvenli',
        f:g=>{ g.p.res.ara += 140; return 'Taramalar tamamlandı, mühre dokunulmadı: +140 araştırma.'; }},
       {t:'Mührü kır', d:'+700 mineral · TEHLİKELİ',
        f:g=>{ g.p.res.min += 700;
          if (rnd() < .45){
            g.p.crisis = 'salgin'; g.p.crisisAt = G.day;
            for (const c of g.p.colonies){
              const pl = G.sys[c.s].planets[c.p];
              if (pl.col) pl.col.stab = clamp(pl.col.stab - 20, 0, 100);
            }
            return 'Lahit açıldı: +700 mineral — ama içeriden bir şey çıktı. Kolonilerinde salgın başladı.';
          }
          return 'Lahit boştu: +700 mineral. Mühürleri kimin vurduğu bilinmiyor.'; }}]},
  {id:'a15', k:'sinyal', n:'Tekrarlayan Çağrı',
   t:'Aynı 11 saniyelik ses döngüsü, 4.000 yıldır boşluğa yayınlanıyor. Sinyal bir konum bildiriyor.',
   ch:[{t:'Sinyali çöz', d:'+260 araştırma, +80 etki',
        f:g=>{ g.p.res.ara += 260; g.p.res.etk += 80;
          return 'Çağrı bir yol tarifiydi. Arşivlendi: +260 araştırma, +80 etki.'; }},
       {t:'Sinyali yanıtla', d:'??? · TEHLİKELİ',
        f:g=>{ if (rnd() < .55){
            g.p.res.ara += 620; g.p.res.etk += 140;
            return 'Karşılık geldi — dost bir arşiv zekâsı. Bilgi paylaşıldı: +620 araştırma, +140 etki.';
          }
          const dusman = G.emps.filter(x => !x.dead && x.id !== 0 && x.contact[0]);
          if (dusman.length){
            const d = dusman[Math.floor(rnd() * dusman.length)];
            d.rel[0] = clamp(d.rel[0] - 35, -100, 100);
            if (typeof remember === 'function') remember(d, 0, 'casusYakalan');
            return 'Yanıtını ' + d.name + ' dinledi ve konumunu öğrendi. Aranız bozuldu.';
          }
          return 'Yanıt verdin. Karanlıktan cevap gelmedi... henüz.'; }}]},
  {id:'a16', k:'megayapi', n:'Dönen Halka',
   t:'Yıldızın etrafında hâlâ dönen, kilometrelerce çaplı bir halka. Yüzeyinde tek bir çizik bile yok.',
   ch:[{t:'Malzemeyi incele', d:'+320 araştırma, +90 alaşım',
        f:g=>{ g.p.res.ara += 320; g.p.res.ala += 90;
          return 'Alaşım bileşimi çözüldü: +320 araştırma, +90 alaşım.'; }},
       {t:'Sökmeye çalış', d:'+900 mineral · TEHLİKELİ',
        f:g=>{ if (rnd() < .40){
            const f2 = G.fleets.filter(x => x.e === 0 && x.ships.length);
            if (f2.length){
              const kurban = f2[Math.floor(rnd() * f2.length)];
              const kayip = Math.max(1, Math.floor(kurban.ships.length * .5));
              kurban.ships.splice(0, kayip);
              if (!kurban.ships.length) G.fleets = G.fleets.filter(x => x !== kurban);
              return 'Halka kendini savundu — ' + kayip + ' gemi kaybedildi. Mineral alınamadı.';
            }
          }
          g.p.res.min += 900;
          return 'Bir parça koparıldı: +900 mineral. Halka dönmeye devam ediyor.'; }}]}
];

/* ---------- ZİNCİRLEME HİKÂYE OLAYLARI ----------
   Bir seçim sonraki bölümü tetikler (ch[].next). Bunlar araştırmaya
   bağlı değildir; kendiliğinden başınıza gelir.                    */
const CHAINS = {
  /* === SESSİZ GEMİ === */
  hayalet1:{n:'Sessiz Gemi', bas:1, w:10,
    t:'{SISTEM} sınırında, hiçbir imparatorluğa ait olmayan devasa bir gemi sürükleniyor. Motorları soğuk, ama iç ışıkları hâlâ yanıyor.',
    ch:[
      {t:'İçeri ekip gönder', d:'Riskli — büyük ödül olabilir', next:'hayalet2a'},
      {t:'Uzaktan tara ve bırak', d:'+180 araştırma, risk yok',
       f:g=>{ g.p.res.ara += 180; return 'Gemi taranıp arşivlendi: +180 araştırma.'; }},
      {t:'Yörüngeden imha et', d:'+120 alaşım, komşular tedirgin olur',
       f:g=>{ g.p.res.ala += 120; g.emps.forEach(o=>{ if(o.id) g.p.rel[o.id] = clamp(g.p.rel[o.id]-4,-100,100); });
              return 'Gemi parçalandı: +120 alaşım. Komşular bu aceleciliği not etti.'; }}
    ]},
  hayalet2a:{n:'Sessiz Gemi — Güverte', bas:0,
    t:'Ekip içeri girdi. Koridorlar boş; mürettebatın izi yok ama her şey yerli yerinde. Köprüde hâlâ çalışan bir veri çekirdeği var.',
    ch:[
      {t:'Çekirdeği söküp getir', d:'+420 araştırma, ama gemi tepki verebilir', next:'hayalet3a'},
      {t:'Gemiyi olduğu gibi çek', d:'+260 alaşım, +90 mineral',
       f:g=>{ g.p.res.ala += 260; g.p.res.min += 90; return 'Gemi tersaneye çekildi: +260 alaşım, +90 mineral.'; }},
      {t:'Ekibi geri çağır', d:'+60 araştırma, güvenli',
       f:g=>{ g.p.res.ara += 60; return 'Ekip döndü. Kayıtlar arşivlendi: +60 araştırma.'; }}
    ]},
  hayalet3a:{n:'Sessiz Gemi — Uyanış', bas:0,
    t:'Çekirdek söküldüğü an gemi uyandı. Bir ses tüm frekanslardan tek bir cümle tekrarlıyor: kendi dilimizde, ama kimse ona bu dili öğretmedi.',
    ch:[
      {t:'Cevap ver', d:'Bilinmeyen sonuç',
       f:(g,r)=>{ if (r() < .55){ g.p.res.ara += 700; g.p.extra.araMul = (g.p.extra.araMul||0)+.05; recalcMods(g.p);
                    return 'Gemi bir öğretmendi. Arşivi açıldı: +700 araştırma ve kalıcı +%5 araştırma.'; }
                  g.p.res.ara += 200; g.p.res.min -= 150;
                  return 'Gemi kendini imha etti. Ekip son anda kaçtı: +200 araştırma, −150 mineral.'; }},
      {t:'Çekirdeği geri tak ve kaç', d:'Güvenli çıkış',
       f:g=>{ g.p.res.ara += 300; return 'Gemi tekrar sustu. Elde kalan veri yine de değerli: +300 araştırma.'; }}
    ]},

  /* === MADEN GREVİ / İŞÇİ HAREKETİ === */
  grev1:{n:'Derin Maden Kazası', bas:1, w:9,
    t:'{KOLONI} kolonisinde bir maden galerisi çöktü. Kurtarma sürüyor, ama işçiler çalışma koşullarının yıllardır göz ardı edildiğini söylüyor.',
    ch:[
      {t:'Kurtarmaya her şeyi yığ', d:'−200 mineral, halk minnettar kalır', next:'grev2a'},
      {t:'Üretimi sürdür, kurtarmayı sınırla', d:'+150 mineral, istikrar düşer', next:'grev2b'},
      {t:'Bağımsız soruşturma başlat', d:'−80 etki, uzun vadeli kazanç', next:'grev2c'}
    ]},
  grev2a:{n:'Kurtarma', bas:0,
    t:'Bütün ekipman sahaya sürüldü. 200 madenci kurtarıldı; haber tüm imparatorlukta yankılandı.',
    ch:[
      {t:'Madencileri onurlandır', d:'+40 etki, kolonilerde istikrar +8',
       f:g=>{ g.p.res.min -= 200; g.p.res.etk += 40;
              g.p.colonies.forEach(c=>{ const pl = g.sys[c.s].planets[c.p]; if (pl.col) pl.col.stab = clamp(pl.col.stab+8,0,100); });
              return 'Kurtarma başarılı. Halk gurur duyuyor: +40 etki, tüm kolonilerde istikrar arttı.'; }}
    ]},
  grev2b:{n:'Sessizlik', bas:0,
    t:'Üretim durmadı. Kayıp sayısı açıklanmadı ama herkes biliyor. Madenci sendikaları örgütleniyor.',
    ch:[
      {t:'Sendikaları dağıt', d:'İstikrar −14, +250 mineral',
       f:g=>{ g.p.res.min += 250;
              g.p.colonies.forEach(c=>{ const pl = g.sys[c.s].planets[c.p]; if (pl.col) pl.col.stab = clamp(pl.col.stab-14,0,100); });
              return 'Sendikalar dağıtıldı. Üretim rekor kırdı ama halk küstü.'; }},
      {t:'Geç de olsa taviz ver', d:'−120 enerji, istikrar toparlanır',
       f:g=>{ g.p.res.ene -= 120; g.p.res.min += 150;
              return 'Taviz kabul edildi. Kriz atlatıldı ama güven yıprandı.'; }}
    ]},
  grev2c:{n:'Soruşturma', bas:0,
    t:'Soruşturma, kazanın önlenebilir olduğunu ve raporların yıllardır saklandığını ortaya çıkardı. Sorumlular üst kademede.',
    ch:[
      {t:'Sorumluları yargıla', d:'+70 etki, kalıcı +%4 mineral',
       f:g=>{ g.p.res.etk += 70; g.p.extra.minMul = (g.p.extra.minMul||0)+.04; recalcMods(g.p);
              return 'Adalet işledi. Yeni güvenlik standartları verimliliği artırdı: kalıcı +%4 mineral.'; }},
      {t:'Raporu kapat', d:'+220 mineral, istikrar −10',
       f:g=>{ g.p.res.min += 220;
              g.p.colonies.forEach(c=>{ const pl = g.sys[c.s].planets[c.p]; if (pl.col) pl.col.stab = clamp(pl.col.stab-10,0,100); });
              return 'Rapor rafa kalktı. Kimse inanmadı ama kimse de konuşmuyor.'; }}
    ]},

  /* === YABANCI SİNYAL === */
  sinyal1:{n:'Derin Uzay Sinyali', bas:1, w:8,
    t:'{SISTEM} dinleme istasyonumuz galaksinin dışından bir yayın yakaladı. Tekrarlanan bir matematik dizisi — kasıtlı olarak gönderilmiş.',
    ch:[
      {t:'Diziyi çöz', d:'Araştırma yatırımı gerekir', next:'sinyal2a'},
      {t:'Yanıt gönder', d:'Cesur — sonuçları bilinmiyor', next:'sinyal2b'},
      {t:'Frekansı karart', d:'+30 etki, konu kapanır',
       f:g=>{ g.p.res.etk += 30; return 'Yayın bastırıldı. Bazı bilim insanları istifa etti.'; }}
    ]},
  sinyal2a:{n:'Sinyal — Çözüm', bas:0,
    t:'Dizi bir haritaydı. Galaksinin kenarında, hiçbir yıldız katalogunda olmayan bir koordinatı işaret ediyor.',
    ch:[
      {t:'Keşif filosu yolla', d:'+520 araştırma, +2 sensör menzili',
       f:g=>{ g.p.res.ara += 520; g.p.extra.sensor = (g.p.extra.sensor||0)+1; recalcMods(g.p);
              return 'Koordinatta terk edilmiş bir gözlem ağı bulundu: +520 araştırma, sensör menzili +1.'; }},
      {t:'Koordinatı gizli tut', d:'+180 etki',
       f:g=>{ g.p.res.etk += 180; return 'Harita devlet sırrı ilan edildi: +180 etki.'; }}
    ]},
  sinyal2b:{n:'Sinyal — Yanıt', bas:0,
    t:'Yanıtımız gönderildi. Sekiz ay sonra karşılık geldi: bu kez bir görüntü. Kendi galaksimizin haritası — ama üzerinde hiç bilmediğimiz sınırlar çizili.',
    ch:[
      {t:'Sınırları incele', d:'Riskli bilgi',
       f:(g,r)=>{ if (r()<.5){ g.p.res.ara += 600; return 'Harita gelecekteki bir galaksiyi gösteriyordu. Anlamı belirsiz: +600 araştırma.'; }
                  g.emps.forEach(o=>{ if(o.id) g.p.rel[o.id] = clamp(g.p.rel[o.id]-12,-100,100); });
                  return 'Harita sızdı. Diğer imparatorluklar bizim onlarla ilgili planlar yaptığımızı düşünüyor: ilişkiler bozuldu.'; }},
      {t:'İletişimi kes', d:'+250 araştırma',
       f:g=>{ g.p.res.ara += 250; return 'Kanal kapatıldı. Eldeki veri yine de öğretici: +250 araştırma.'; }}
    ]},

  /* === SALGIN === */
  salgin1:{n:'Bilinmeyen Salgın', bas:1, w:9,
    t:'{KOLONI} kolonimizde hızla yayılan bir hastalık ortaya çıktı. Kaynağı belirsiz; tıbbi ekipler daha önce böyle bir şey görmedi.',
    ch:[
      {t:'Koloniyi karantinaya al', d:'Üretim durur ama yayılma engellenir', next:'salgin2a'},
      {t:'Aşı araştırmasına yüklen', d:'−300 araştırma, hızlı çözüm şansı', next:'salgin2b'},
      {t:'Görmezden gel', d:'Tehlikeli', next:'salgin2c'}
    ]},
  salgin2a:{n:'Karantina', bas:0,
    t:'Koloni mühürlendi. Salgın kontrol altında ama içeride yaşam durdu.',
    ch:[
      {t:'Karantinayı sürdür', d:'İstikrar −8, salgın biter',
       f:g=>{ const c = g.p.colonies[0];
              if (c){ const pl = g.sys[c.s].planets[c.p]; if (pl.col) pl.col.stab = clamp(pl.col.stab-8,0,100); }
              return 'Salgın söndü. Karantina kalktı, ama izler kaldı.'; }},
      {t:'Erken aç, üretime dön', d:'Risk: nüfus kaybı',
       f:(g,r)=>{ const c = g.p.colonies[0];
              if (r()<.45 && c){ const pl = g.sys[c.s].planets[c.p]; if (pl.col) pl.col.pop = Math.max(1, pl.col.pop-3);
                return 'Salgın geri döndü: 3 nüfus kaybedildi.'; }
              g.p.res.min += 180; return 'Risk tuttu. Üretim erken başladı: +180 mineral.'; }}
    ]},
  salgin2b:{n:'Aşı', bas:0,
    t:'Laboratuvarlar gece gündüz çalıştı. Aşı bulundu — ve beklenmedik bir yan etkisi var: bağışıklık sistemini kalıcı güçlendiriyor.',
    ch:[
      {t:'Herkese uygula', d:'Kalıcı +%6 nüfus artışı',
       f:g=>{ g.p.res.ara -= 300; g.p.extra.growMul = (g.p.extra.growMul||0)+.06; recalcMods(g.p);
              return 'Aşı imparatorluk geneline yayıldı: kalıcı +%6 nüfus artışı.'; }},
      {t:'Formülü sat', d:'+400 enerji, +60 ilişki',
       f:g=>{ g.p.res.ara -= 300; g.p.res.ene += 400;
              g.emps.forEach(o=>{ if(o.id) g.p.rel[o.id] = clamp(g.p.rel[o.id]+10,-100,100); });
              return 'Formül komşulara satıldı: +400 enerji ve iyi niyet.'; }}
    ]},
  salgin2c:{n:'Yayılma', bas:0,
    t:'Salgın diğer kolonilere sıçradı. Artık geç kaldık.',
    ch:[
      {t:'Acil müdahale', d:'−500 enerji, hasarı sınırla',
       f:g=>{ g.p.res.ene -= 500;
              g.p.colonies.forEach(c=>{ const pl = g.sys[c.s].planets[c.p]; if (pl.col) pl.col.stab = clamp(pl.col.stab-6,0,100); });
              return 'Salgın büyük maliyetle durduruldu.'; }},
      {t:'Doğal seyrine bırak', d:'Ağır nüfus kaybı',
       f:g=>{ g.p.colonies.forEach(c=>{ const pl = g.sys[c.s].planets[c.p];
                if (pl.col) pl.col.pop = Math.max(1, pl.col.pop - 2); });
              return 'Salgın kendiliğinden söndü — ama her kolonide 2 nüfus kaybedildi.'; }}
    ]},

  /* === KAYIP KOLONİ === */
  kayip1:{n:'Kayıp Koloni Sinyali', bas:1, w:9,
    t:'{SISTEM} yakınlarından, kayıtlarımızda olmayan bir koloniden imdat çağrısı geliyor. Bizim dilimizi konuşuyorlar ve bizden olduklarını söylüyorlar.',
    ch:[
      {t:'Kurtarma filosu yolla', d:'Kim oldukları anlaşılacak', next:'kayip2a'},
      {t:'Önce kimlik doğrula', d:'Temkinli yaklaşım', next:'kayip2b'},
      {t:'Sinyali yok say', d:'+40 etki, konu kapanır',
       f:g=>{ g.p.res.etk += 40; return 'Çağrı cevapsız kaldı. Bir süre sonra sustu.'; }}
    ]},
  kayip2a:{n:'Kayıp Koloni — Karşılaşma', bas:0,
    t:'Koloni gerçek. Yüzyıllar önce yolunu kaybetmiş bir yerleşim gemisinin torunları. Teknolojileri ilkel ama kendi çözümlerini geliştirmişler — bazıları bizimkinden farklı ve zekice.',
    ch:[
      {t:'İmparatorluğa kat', d:'Anavatanda +5 nüfus, teknolojilerini öğren',
       f:g=>{ const c = g.p.colonies[0];
              if (c){ const pl = g.sys[c.s].planets[c.p]; if (pl.col) pl.col.pop += 5; }
              g.p.res.ara += 350;
              return 'Koloni katıldı: +5 nüfus, +350 araştırma. Farklı düşünme biçimleri kayıt altına alındı.'; }},
      {t:'Bağımsız bırak, ittifak kur', d:'+120 etki, kalıcı +%5 diplomasi',
       f:g=>{ g.p.res.etk += 120; g.p.extra.dipMul = (g.p.extra.dipMul||0)+.05; recalcMods(g.p);
              return 'Bağımsızlıkları tanındı. Bu jest galakside konuşuluyor: kalıcı +%5 ikna gücü.'; }}
    ]},
  kayip2b:{n:'Kayıp Koloni — Doğrulama', bas:0,
    t:'Doğrulama beklenmedik bir sonuç verdi: sinyal bir koloniden değil, otomatik bir tuzak vericiden geliyor. Etrafında enkaz var — daha önce cevap verenlerin enkazı.',
    ch:[
      {t:'Tuzağı imha et', d:'+180 alaşım, bölge güvenli',
       f:g=>{ g.p.res.ala += 180; return 'Verici yok edildi. Enkazdan +180 alaşım toplandı.'; }},
      {t:'Tuzağı incele', d:'Kim kurdu?',
       f:(g,r)=>{ if (r()<.6){ g.p.res.ara += 480; return 'Verici çok eski bir avcı türüne ait. Teknolojisi çözüldü: +480 araştırma.'; }
                  g.p.res.ala -= 60; return 'İnceleme sırasında verici patladı: −60 alaşım.'; }}
    ]},

  /* === İÇ SİYASET === */
  siyaset1:{n:'Muhalefet Yükseliyor', bas:1, w:8,
    t:'{KOLONI} başta olmak üzere kolonilerde yönetim biçimimizi sorgulayan bir hareket büyüyor. Talepleri açık: daha fazla söz hakkı.',
    ch:[
      {t:'Reform yap', d:'İstikrar artar, merkezî güç azalır', next:'siyaset2a'},
      {t:'Hareketi bastır', d:'Kısa vadeli düzen, uzun vadeli risk', next:'siyaset2b'},
      {t:'Referandum ilan et', d:'Halk karar versin', next:'siyaset2c'}
    ]},
  siyaset2a:{n:'Reform', bas:0,
    t:'Yerel meclisler kuruldu. Karar alma yavaşladı ama halk yönetime güveniyor.',
    ch:[
      {t:'Reformu derinleştir', d:'Kalıcı +%8 nüfus artışı, −%4 mineral',
       f:g=>{ g.p.extra.growMul = (g.p.extra.growMul||0)+.08;
              g.p.extra.minMul = (g.p.extra.minMul||0)-.04; recalcMods(g.p);
              g.p.colonies.forEach(c=>{ const pl=g.sys[c.s].planets[c.p]; if(pl.col) pl.col.stab=clamp(pl.col.stab+12,0,100); });
              return 'Yeni düzen kuruldu: nüfus daha hızlı artıyor, üretim biraz yavaşladı.'; }},
      {t:'Burada dur', d:'İstikrar +10',
       f:g=>{ g.p.colonies.forEach(c=>{ const pl=g.sys[c.s].planets[c.p]; if(pl.col) pl.col.stab=clamp(pl.col.stab+10,0,100); });
              return 'Reform sınırlı kaldı ama huzur sağlandı.'; }}
    ]},
  siyaset2b:{n:'Bastırma', bas:0,
    t:'Hareket dağıtıldı. Sokaklar sessiz. Ama sessizliğin altında bir şey birikiyor.',
    ch:[
      {t:'Denetimi artır', d:'Kalıcı +%6 mineral, −%10 araştırma',
       f:g=>{ g.p.extra.minMul = (g.p.extra.minMul||0)+.06;
              g.p.extra.araMul = (g.p.extra.araMul||0)-.10; recalcMods(g.p);
              return 'Sıkı denetim üretimi artırdı ama özgür düşünce kurudu.'; }},
      {t:'Af ilan et', d:'İstikrar +14, +50 etki',
       f:g=>{ g.p.res.etk += 50;
              g.p.colonies.forEach(c=>{ const pl=g.sys[c.s].planets[c.p]; if(pl.col) pl.col.stab=clamp(pl.col.stab+14,0,100); });
              return 'Af beklenmiyordu. Halk şaşkın ama minnettar.'; }}
    ]},
  siyaset2c:{n:'Referandum', bas:0,
    t:'Sonuçlar çok yakın çıktı. İmparatorluk neredeyse ikiye bölünmüş durumda.',
    ch:[
      {t:'Sonuca uy', d:'İstikrar +18, −60 etki',
       f:g=>{ g.p.res.etk -= 60;
              g.p.colonies.forEach(c=>{ const pl=g.sys[c.s].planets[c.p]; if(pl.col) pl.col.stab=clamp(pl.col.stab+18,0,100); });
              return 'Halk iradesi tanındı. Meşruiyet güçlendi, merkezî otorite zayıfladı.'; }},
      {t:'Sonucu iptal et', d:'+140 etki, istikrar −20',
       f:g=>{ g.p.res.etk += 140;
              g.p.colonies.forEach(c=>{ const pl=g.sys[c.s].planets[c.p]; if(pl.col) pl.col.stab=clamp(pl.col.stab-20,0,100); });
              return 'Referandum geçersiz sayıldı. Otorite korundu, güven kaybedildi.'; }}
    ]},

  /* === TEKNOLOJİ ÖDÜLLÜ: TERK EDİLMİŞ LABORATUVAR === */
  lab1:{n:'Yörüngedeki Laboratuvar', bas:1, w:8,
    t:'{SISTEM} sisteminde, hâlâ enerji üreten kapalı bir araştırma istasyonu bulundu. Kimin olduğu belirsiz.',
    ch:[
      {t:'İstasyonu aç', d:'İçeride ne var?', next:'lab2a'},
      {t:'Uzaktan enerji imzasını incele', d:'+240 araştırma, güvenli',
       f:g=>{ g.p.res.ara += 240; return 'Enerji imzası çözümlendi: +240 araştırma.'; }}
    ]},
  lab2a:{n:'Laboratuvar — İçeride', bas:0,
    t:'İstasyon bir silah laboratuvarıymış. Deneyler yarım kalmış; ama notlar eksiksiz. Burada tamamlanmamış bir teknoloji var.',
    ch:[
      {t:'Silah araştırmasını tamamla', d:'Bir mühendislik teknolojisi bedava',
       f:g=>{ const av = availTechs(g.p, 'muh');
              if (av.length){ const id = av[0]; g.p.techs[id] = true; recalcMods(g.p);
                return 'Notlar tamamlandı — ' + TECHS[id].n + ' bedava kazanıldı!'; }
              g.p.res.ara += 500; return 'Araştıracak yeni bir şey kalmamış: +500 araştırma.'; }},
      {t:'Fizik verilerini al', d:'Bir fizik teknolojisi bedava',
       f:g=>{ const av = availTechs(g.p, 'fiz');
              if (av.length){ const id = av[0]; g.p.techs[id] = true; recalcMods(g.p);
                return 'Veriler çözüldü — ' + TECHS[id].n + ' bedava kazanıldı!'; }
              g.p.res.ara += 500; return 'Veriler zaten bildiklerimizdi: +500 araştırma.'; }},
      {t:'İstasyonu mühürle', d:'+90 etki — bazı bilgiler tehlikelidir',
       f:g=>{ g.p.res.etk += 90; return 'İstasyon mühürlendi. Bazı kapılar kapalı kalmalı.'; }}
    ]},

  /* === YABANCI KAÇAK === */
  kacak1:{n:'Sığınmacı Bilim İnsanı', bas:1, w:7,
    t:'{IRK} imparatorluğundan kaçan bir bilim insanı sınırımıza sığındı. Yanında şifreli veri modülleri var.',
    ch:[
      {t:'Sığınma hakkı ver', d:'Veriler bizim olur, komşu öfkelenir', next:'kacak2a'},
      {t:'Geri iade et', d:'İlişki +25, veriler gider',
       f:g=>{ const o = g.emps.find(x=>x.id && !x.dead);
              if (o){ g.p.rel[o.id] = clamp(g.p.rel[o.id]+25,-100,100); o.rel[0] = clamp(o.rel[0]+25,-100,100); }
              return 'Bilim insanı iade edildi. Komşumuz bu jesti unutmayacak.'; }},
      {t:'Verileri al, kendisini iade et', d:'İki tarafı da idare et',
       f:(g,r)=>{ g.p.res.ara += 320;
              if (r()<.5){ const o = g.emps.find(x=>x.id && !x.dead);
                if (o){ g.p.rel[o.id] = clamp(g.p.rel[o.id]-30,-100,100); o.rel[0] = clamp(o.rel[0]-30,-100,100); }
                return 'Veriler kopyalandı ama komşumuz öğrendi: +320 araştırma, ilişki bozuldu.'; }
              return 'Kimse fark etmedi: +320 araştırma ve temiz bir sicil.'; }}
    ]},
  kacak2a:{n:'Sığınmacı — Modüller', bas:0,
    t:'Modüller açıldı. İçinde komşumuzun gizli filo tasarımları ve bir de kişisel bir mesaj var: "Bunları kullanmayın. Sadece yok edin."',
    ch:[
      {t:'Tasarımları kullan', d:'Kalıcı +%8 gemi hasarı, ilişki −40',
       f:g=>{ g.p.extra.dmgMul = (g.p.extra.dmgMul||0)+.08; recalcMods(g.p);
              g.emps.forEach(o=>{ if(o.id) g.p.rel[o.id] = clamp(g.p.rel[o.id]-15,-100,100); });
              return 'Tasarımlar donanmamıza uyarlandı: kalıcı +%8 gemi hasarı. Galakside güvenilirliğimiz sarsıldı.'; }},
      {t:'Uyarıya uy ve imha et', d:'+200 etki, kalıcı +%4 kalkan',
       f:g=>{ g.p.res.etk += 200; g.p.extra.shMul = (g.p.extra.shMul||0)+.04; recalcMods(g.p);
              return 'Modüller yok edildi. Bilim insanı karşılığında savunma teknolojisi paylaştı: kalıcı +%4 kalkan.'; }}
    ]}
};

/* ---------- imparatorluk olayları ---------- */
const EVENTS = [
  {id:'e1', n:'Bilim Konseyi Talebi', t:'Baş bilimcin, riskli bir hızlandırılmış araştırma programı için bütçe istiyor.',
   ok:g=>g.p.res.min>150,
   ch:[{t:'Fonu onayla', d:'−150 mineral, +260 araştırma', f:g=>{g.p.res.min-=150; g.p.res.ara+=260; return 'Program başladı: +260 araştırma.';}},
       {t:'Reddet', d:'−8 etki', f:g=>{g.p.res.etk-=8; return 'Bilim konseyi küstü: −8 etki.';}}]},
  {id:'e2', n:'Göçmen Filosu', t:'Yersiz yurtsuz bir mülteci filosu sınırlarında beliriyor. Sığınma istiyorlar.',
   ch:[{t:'Kabul et', d:'+2 nüfus, −60 yiyecek', f:g=>{ const c=g.p.colonies[0]; if(c){ const pl=g.sys[c.s].planets[c.p]; if(pl.col) pl.col.pop+=2; } g.p.res.yiy-=60; return 'Mülteciler yerleştirildi: +2 nüfus.';}},
       {t:'Geri çevir', d:'+40 etki, −10 itibar', f:g=>{g.p.res.etk+=40; g.emps.forEach(o=>{ if(o.id) g.p.rel[o.id]=clamp(g.p.rel[o.id]-6,-100,100); }); return 'Sınırlar kapatıldı: +40 etki, komşular soğudu.';}}]},
  {id:'e3', n:'Alaşım Grevi', t:'Dökümhane işçileri üretimi durdurdu. Talepleri pahalı ama makul.',
   ch:[{t:'Talepleri karşıla', d:'−120 enerji', f:g=>{g.p.res.ene-=120; return 'Grev sona erdi.';}},
       {t:'Üretimi zorla', d:'−40 alaşım, −6 etki', f:g=>{g.p.res.ala-=40; g.p.res.etk-=6; return 'Zorlama işe yaramadı: −40 alaşım, −6 etki.';}}]},
  {id:'e4', n:'Kayıp Sonda', t:'Yıllar önce fırlatılan bir sonda geri döndü. Hafızası şaşırtıcı derecede dolu.',
   ch:[{t:'Verileri işle', d:'+200 araştırma', f:g=>{g.p.res.ara+=200; return 'Sonda verileri çözüldü: +200 araştırma.';}},
       {t:'Halka aç', d:'+35 etki', f:g=>{g.p.res.etk+=35; return 'Keşif halkı coşturdu: +35 etki.';}}]},
  {id:'e5', n:'Korsan Baskını', t:'Sınır sistemlerinde tanımlanamayan gemiler ticaret yollarını vuruyor.',
   ch:[{t:'Devriye gönder', d:'−80 alaşım, tehdit biter', f:g=>{g.p.res.ala-=80; return 'Korsanlar dağıtıldı.';}},
       {t:'Görmezden gel', d:'−140 enerji', f:g=>{g.p.res.ene-=140; return 'Ticaret kaybı ağır oldu: −140 enerji.';}}]}
];
/* =====================================================================
   SANAT — her piksel çalışma anında üretilir
   ===================================================================== */
const ART = (() => {
  const cache = new Map();
  function cv(w,h){
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    return {c,g};
  }
  function hex(h){
    h = h.replace('#','');
    return [parseInt(h.substr(0,2),16), parseInt(h.substr(2,2),16), parseInt(h.substr(4,2),16)];
  }
  function shade(rgb, m){
    return [clamp(rgb[0]*m,0,255)|0, clamp(rgb[1]*m,0,255)|0, clamp(rgb[2]*m,0,255)|0];
  }
  function mix(a,b,t){ return [lerp(a[0],b[0],t)|0, lerp(a[1],b[1],t)|0, lerp(a[2],b[2],t)|0]; }

  /* yüzey renk şemaları (ana palete ek) */
  const SURF = {
    oky:['#1d5c33','#2f8348','#63ad6b'], tro:['#6d4f27','#9b7638','#c2a25e'],
    sav:['#2f5a86','#3f7fb0','#6aa8cf'], sul:['#1e3f5e','#2f6d8f','#57a0b8'],
    gay:['#154f8a','#2a7cc0','#6cc0e8'], col:['#8a6a34','#d8b06a','#f0dcae'],
    kur:['#5f3f2b','#a06a42','#d0a375'], tun:['#2a3b2c','#3f5a42','#617f60'],
    kut:['#e9f6ff','#ffffff','#cfe6f5'], alp:['#3a4a44','#56705f','#88a78f'],
    mak:['#6ff2c8','#3fb894','#a8ffe6']
  };

  /* --------------------------------------------------------------
     GEZEGEN — küresel gölgelendirme + türe özgü yüzey
     -------------------------------------------------------------- */
  function planet(type, seed, R){
    R = R || 26;
    const key = 'p'+type+'_'+seed+'_'+R;
    if (cache.has(key)) return cache.get(key);
    const def = PLANETS[type] || PLANETS.cor;
    const pal = def.pal.map(hex);
    const sur = (SURF[type]||['#555','#777','#999']).map(hex);
    const {c,g} = cv(R,R);
    const img = g.createImageData(R,R);
    const D = img.data;
    const cx = (R-1)/2, cy = (R-1)/2, rad = R/2 - .5;
    const lx = -.52, ly = -.55, lz = .66;       // ışık yönü
    const S = seed*7919 % 100000;
    const isBelt = def.f === 'belt';

    for (let y=0;y<R;y++) for (let x=0;x<R;x++){
      const i = (y*R+x)*4;
      const ux = (x-cx)/rad, uy = (y-cy)/rad;
      const d2 = ux*ux + uy*uy;

      if (isBelt){
        // asteroit kuşağı: elips üzerine dağılmış kayalar
        const ey = uy*2.6;
        const rr = Math.sqrt(ux*ux + ey*ey);
        const nz = hash2(x*3, y*3, S);
        if (rr > .55 && rr < 1.02 && nz > .62){
          const lum = .45 + nz*.75;
          const col = shade(pal[2 + ((nz*3)|0) % 3], lum);
          D[i]=col[0]; D[i+1]=col[1]; D[i+2]=col[2]; D[i+3]=255;
        }
        continue;
      }

      if (d2 > 1){ continue; }
      const nz = Math.sqrt(Math.max(0, 1-d2));
      let lum = ux*lx + uy*ly + nz*lz;          // -1..1
      lum = clamp(lum*.9 + .34, 0, 1.25);

      // küre üzerine sözde-küresel doku eşlemesi
      const sx = ux/(nz*.55+.5), sy = uy/(nz*.55+.5);
      let col;

      switch(def.f){
        case 'ocean': {
          const n = fbm(sx*2.6+S*.01, sy*2.6, S, 4);
          if (n > .52){
            const t = clamp((n-.52)/.30, 0, 1);
            col = mix(sur[0], sur[2], t);
            if (n > .74) col = mix(col, pal[4], .35);
          } else {
            const t = clamp(n/.52, 0, 1);
            col = mix(pal[0], pal[2], t);
            if (nz > .82 && n < .3) col = mix(col, [255,255,255], .16); // yansıma
          }
          const ice = Math.abs(uy);
          if (ice > .74) col = mix(col, [235,248,255], clamp((ice-.74)/.24,0,.9));
          break;
        }
        case 'land': {
          const n = fbm(sx*3.4, sy*3.4, S, 4)*.7 + fbm(sx*9, sy*9, S+11, 2)*.3;
          const idx = clamp(Math.floor(n*4.6), 0, 4);
          col = pal[idx];
          if (n > .66) col = mix(col, sur[2], .35);
          break;
        }
        case 'ice': {
          const n = fbm(sx*3.0, sy*3.0, S, 4);
          col = mix(pal[1], pal[3], clamp(n*1.5-.15,0,1));
          const ice = Math.abs(uy);
          if (ice > .52) col = mix(col, hex('#f3fbff'), clamp((ice-.52)/.38,0,.92));
          if (n > .70) col = mix(col, sur[0], .30);
          break;
        }
        case 'city': {
          const n = fbm(sx*4, sy*4, S, 3);
          col = mix(pal[1], pal[3], clamp(n*1.4,0,1));
          const grid = (Math.abs((sx*13)%1-.5)<.09 || Math.abs((sy*13)%1-.5)<.09);
          if (grid && n>.42){
            const night = clamp(1-lum*1.35, 0, 1);
            col = mix(col, sur[0], .30 + night*.62);
          }
          break;
        }
        case 'crater': {
          let n = fbm(sx*3.2, sy*3.2, S, 3);
          for (let k=0;k<5;k++){
            const ox = (hash2(k,1,S)-.5)*1.5, oy = (hash2(k,2,S)-.5)*1.5;
            const cr = .12 + hash2(k,3,S)*.24;
            const dd = Math.hypot(sx-ox, sy-oy);
            if (dd < cr) n += (1 - dd/cr) * (dd < cr*.62 ? -.30 : .26);
          }
          col = pal[clamp(Math.floor(n*4.8),0,4)];
          break;
        }
        case 'lava': {
          const n = fbm(sx*3.4, sy*3.4, S, 4);
          const crack = Math.abs(fbm(sx*5.5, sy*5.5, S+31, 3) - .5);
          col = mix(pal[0], pal[2], clamp(n*1.3,0,1));
          if (crack < .055){
            const hot = 1 - crack/.055;
            col = mix(col, pal[4], .35 + hot*.62);
            D[i]=col[0]; D[i+1]=col[1]; D[i+2]=col[2]; D[i+3]=255;  // ışık saçar
            continue;
          }
          break;
        }
        case 'bands': {
          const warp = fbm(sx*1.5, sy*5.0, S, 3)*.22;
          const b = (sy + warp)*3.6;
          const n = (Math.sin(b*3.0)*.5+.5)*.6 + fbm(sx*1.2, sy*7, S+7, 3)*.4;
          col = pal[clamp(Math.floor(n*4.8),0,4)];
          // büyük fırtına
          const sxo = sx - .34, syo = (sy + .18)*2.1;
          const sd = Math.hypot(sxo, syo);
          if (sd < .30) col = mix(col, pal[4], clamp(1-sd/.30,0,1)*.85);
          break;
        }
        default: col = pal[2];
      }

      col = shade(col, lum);
      // kenar atmosfer parıltısı
      if (def.k === 'hab' && d2 > .80){
        const rim = clamp((Math.sqrt(d2)-.895)/.105, 0, 1);
        col = mix(col, hex('#9fd8ff'), rim*.42);
      }
      D[i]=col[0]; D[i+1]=col[1]; D[i+2]=col[2]; D[i+3]=255;
    }
    g.putImageData(img,0,0);

    // gaz devlerine halka
    if (def.k === 'gaz' && (seed % 3 === 0)){
      g.save();
      g.translate(R/2, R/2); g.scale(1, .28); g.rotate(-.24);
      g.strokeStyle = 'rgba(230,215,185,.55)'; g.lineWidth = 1.1;
      g.beginPath(); g.arc(0,0,R*.62,0,Math.PI*2); g.stroke();
      g.strokeStyle = 'rgba(230,215,185,.28)';
      g.beginPath(); g.arc(0,0,R*.74,0,Math.PI*2); g.stroke();
      g.restore();
    }
    cache.set(key,c);
    return c;
  }

  /* --------------------------------------------------------------
     YILDIZ — çekirdek + halo
     -------------------------------------------------------------- */
  function star(colr, r){
    const key = 's'+colr+'_'+r;
    if (cache.has(key)) return cache.get(key);
    const R = Math.ceil(r*6)*2;
    const {c,g} = cv(R,R);
    const m = R/2;
    const gr = g.createRadialGradient(m,m,0,m,m,m);
    gr.addColorStop(0, colr);
    gr.addColorStop(.14, colr);
    gr.addColorStop(.30, colr+'aa');
    gr.addColorStop(.62, colr+'33');
    gr.addColorStop(1, colr+'00');
    g.fillStyle = gr;
    g.beginPath(); g.arc(m,m,m,0,Math.PI*2); g.fill();
    g.fillStyle = '#fff';
    g.globalAlpha = .85;
    g.beginPath(); g.arc(m,m,Math.max(1,r*.5),0,Math.PI*2); g.fill();
    cache.set(key,c);
    return c;
  }

  /* --------------------------------------------------------------
     GEMİLER — piksel şablonları
     -------------------------------------------------------------- */
  const ART_MAP = {
    kor:['..#..','.#C#.','.#W#.','#CCC#','#C#C#','.E.E.'],
    muh:['...#...','..#C#..','..#W#..','.#CCC#.','.#CCC#.','#CC#CC#','#C#.#C#','#E#.#E#','.E...E.'],
    kru:['....#....','...#C#...','...#W#...','..#CCC#..','..#CCC#..','.#CC#CC#.','.#CCCCC#.','#CC#C#CC#','#C#...#C#','#E#...#E#','.E#...#E.','..E...E..'],
    zir:['.....#.....','....#C#....','....#W#....','...#CCC#...','...#CCC#...','..#CC#CC#..','..#CCCCC#..','.#CC#C#CC#.','.#CCCCCCC#.','#CC#CCC#CC#','#C#CCCCC#C#','#C#.#C#.#C#','#E#.#E#.#E#','.E..#E#..E.','.....E.....'],
    bil:['..###..','.#WWW#.','.#WWW#.','..#C#..','.#CCC#.','#CCCCC#','#C###C#','.#...#.','..E.E..'],
    kol:['..###..','.#CCC#.','#CWWWC#','#CCCCC#','#C###C#','#CCCCC#','#C#.#C#','#CCCCC#','.#E.E#.','..E.E..']
  };
  function ship(cls, colr, scale){
    scale = scale || 1;
    const key = 'v'+cls+'_'+colr+'_'+scale;
    if (cache.has(key)) return cache.get(key);
    const art = ART_MAP[cls] || ART_MAP.kor;
    const w = art[0].length, h = art.length;
    const {c,g} = cv(w*scale, h*scale);
    const base = hex(colr);
    const dark = '#0a1120';
    const light = 'rgb('+shade(base,1.45).join(',')+')';
    const mid   = 'rgb('+base.join(',')+')';
    for (let y=0;y<h;y++) for (let x=0;x<w;x++){
      const ch = art[y][x];
      if (ch === '.') continue;
      g.fillStyle = ch==='#' ? dark : ch==='C' ? mid : ch==='L' ? light :
                    ch==='W' ? '#bfeaff' : '#ffb45a';
      g.fillRect(x*scale, y*scale, scale, scale);
    }
    cache.set(key,c);
    return c;
  }

  /* --------------------------------------------------------------
     ARMA — ırka özgü geometrik mühür
     -------------------------------------------------------------- */
  function emblem(seedStr, colr, R, style){
    R = R || 22;
    style = style || 'simetrik';
    const key = 'e'+seedStr+'_'+colr+'_'+R+'_'+style;
    if (cache.has(key)) return cache.get(key);
    let s = 0; for (let i=0;i<seedStr.length;i++) s = (s*31 + seedStr.charCodeAt(i))|0;
    const rnd = mulberry32(Math.abs(s)+1);
    const {c,g} = cv(R,R);
    const N = 11, px = R/N, half = Math.ceil(N/2);
    const base = hex(colr);
    const grid = [];
    for (let y=0;y<N;y++){ grid[y]=[]; for (let x=0;x<half;x++) grid[y][x] = rnd() < (y>1&&y<N-2?.55:.34); }
    const mid = (N-1)/2;
    for (let y=0;y<N;y++) for (let x=0;x<N;x++){
      let v = grid[y][x<half ? x : N-1-x];
      if (style === 'dikey'){
        // dar ve uzun sancak: kenar sütunları boşalt
        if (x < 2 || x > N-3) v = false;
        if (y > N-2) v = false;
      } else if (style === 'dairesel'){
        const d = Math.hypot(x-mid, y-mid);
        if (d > mid*.98) v = false;
        else if (d < mid*.30) v = true;
      } else if (style === 'keskin'){
        // köşeli: eşkenar dörtgen maskesi
        if (Math.abs(x-mid) + Math.abs(y-mid) > mid*1.12) v = false;
        if (y === Math.round(mid)) v = true;
      }
      if (!v) continue;
      const m = .62 + (y/N)*.72;
      g.fillStyle = 'rgb('+shade(base,m).join(',')+')';
      g.fillRect(Math.round(x*px), Math.round(y*px), Math.ceil(px), Math.ceil(px));
    }
    cache.set(key,c);
    return c;
  }

  /* --------------------------------------------------------------
     PORTRE — tür siluetleri (16-bit)
     -------------------------------------------------------------- */
  const PORTRAIT = {
    humanoid:['....####....','...######...','..##WW##W#..','..########..','...##..##...','....####....','..###..###..','.##..##..##.','.#...##...#.','.....##.....','....#..#....','...##..##...'],
    bocek   :['..#......#..','...#....#...','..W#....#W..','..###..###..','.##########.','##..####..##','#.##....##.#','..##....##..','.#..####..#.','#..######..#','..#..##..#..','.#.#....#.#.'],
    surungen:['...######...','..##WWWW##..','.###....###.','.##..##..##.','.##########.','..########..','...######...','..##....##..','.#..####..#.','#..######..#','..##....##..','.#........#.'],
    kristal :['.....##.....','....####....','...##WW##...','..##W..W##..','.####..####.','##...##...##','.####..####.','..##....##..','...######...','....####....','.....##.....','......#.....'],
    makine  :['.##########.','.#WW####WW#.','.##########.','.#.######.#.','.##########.','..#.####.#..','.##########.','.#..####..#.','.##########.','.#.#....#.#.','.#.#....#.#.','.###....###.'],
    amorf   :['...######...','..########..','.##W####W##.','.##########.','##########.#','.##########.','..########..','.#########..','..#######...','...######...','....####....','.....##.....'],
    kanatli :['#..######..#','##.##WW##.##','.####..####.','..########..','#.########.#','##..####..##','.#..####..#.','....####....','...##..##...','..##....##..','.##......##.','.#........#.'],
    akuatik :['....####....','...##WW##...','..########..','.##..##..##.','.##########.','..##..##..#.','.####..####.','#..######..#','.#.######.#.','..##....##..','.#..#..#..#.','#...#..#...#']
  };
  function portrait(type, colr, scale){
    scale = scale || 3;
    const key = 'q'+type+'_'+colr+'_'+scale;
    if (cache.has(key)) return cache.get(key);
    const art = PORTRAIT[type] || PORTRAIT.humanoid;
    const w = art[0].length, h = art.length;
    const {c,g} = cv(w*scale, h*scale);
    const base = hex(colr);
    for (let y=0;y<h;y++) for (let x=0;x<w;x++){
      const ch = art[y][x];
      if (ch === '.') continue;
      if (ch === 'W'){ g.fillStyle = '#bfeaff'; }
      else {
        const m = .55 + (1 - y/h) * .75;
        g.fillStyle = 'rgb('+shade(base,m).join(',')+')';
      }
      g.fillRect(x*scale, y*scale, scale, scale);
    }
    cache.set(key,c);
    return c;
  }

  /* ═══════════════════════════════════════════════════════════════
     FAZ 31 — PİKSEL SANAT MOTORU
     Hiçbir görsel dosya yok. Her sembol 16×16 sayısal matris;
     0 = boş, 1 = ana renk, 2 = vurgu, 3 = üçüncü ton.
     Çizim tek geçişli fillRect — modal açılışında bir kez.
     ═══════════════════════════════════════════════════════════════ */
  const PIXEL_ART = {
    /* AJAN İNFAZ EDİLDİ — kurukafa */
    infaz: {
      c: ['', '#c8ccd8', '#ff5f6d', '#6a7285'],
      m: [
        [0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0],
        [0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0],
        [0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
        [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
        [0,1,1,2,2,2,1,1,1,1,2,2,2,1,1,0],
        [0,1,1,2,2,2,1,1,1,1,2,2,2,1,1,0],
        [0,1,1,2,2,2,1,1,1,1,2,2,2,1,1,0],
        [0,1,1,1,1,1,1,3,3,1,1,1,1,1,1,0],
        [0,1,1,1,1,1,1,3,3,1,1,1,1,1,1,0],
        [0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
        [0,0,1,1,3,1,3,1,3,1,3,1,1,1,0,0],
        [0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0],
        [0,0,0,0,1,3,1,3,1,3,1,1,0,0,0,0],
        [0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0],
        [0,0,0,0,0,2,2,0,0,2,2,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
      ]
    },
    /* TEKNOLOJİ ÇALINDI — veri çipi */
    veri: {
      c: ['', '#6ff2c8', '#8b7bff', '#0d3b34'],
      m: [
        [0,0,2,0,0,2,0,0,0,0,2,0,0,2,0,0],
        [0,0,2,0,0,2,0,0,0,0,2,0,0,2,0,0],
        [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
        [0,1,3,3,3,3,3,3,3,3,3,3,3,3,1,0],
        [2,1,3,1,1,1,3,3,3,1,1,1,3,3,1,2],
        [2,1,3,1,3,1,3,3,3,1,3,1,3,3,1,2],
        [0,1,3,1,1,1,3,3,3,1,1,1,3,3,1,0],
        [0,1,3,3,3,3,3,3,3,3,3,3,3,3,1,0],
        [0,1,3,3,1,1,1,1,1,1,1,1,3,3,1,0],
        [2,1,3,3,3,3,3,3,3,3,3,3,3,3,1,2],
        [2,1,3,1,1,1,1,3,3,1,1,1,1,3,1,2],
        [0,1,3,3,3,3,3,3,3,3,3,3,3,3,1,0],
        [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
        [0,0,2,0,0,2,0,0,0,0,2,0,0,2,0,0],
        [0,0,2,0,0,2,0,0,0,0,2,0,0,2,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
      ]
    },
    /* PARÇALANMIŞ DÜNYA — ikiye çatlamış gezegen */
    catlak: {
      c: ['', '#ff9b3d', '#ffe08a', '#8a3410'],
      m: [
        [0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0],
        [0,0,0,1,1,1,1,3,2,1,1,1,1,0,0,0],
        [0,0,1,1,1,1,3,2,0,2,3,1,1,1,0,0],
        [0,1,1,1,1,3,2,0,0,0,2,3,1,1,1,0],
        [0,1,1,1,3,2,0,0,0,0,2,3,1,1,1,0],
        [1,1,1,3,2,0,0,0,0,0,0,2,3,1,1,1],
        [1,1,3,2,0,0,0,0,0,0,0,0,2,3,1,1],
        [1,1,2,0,0,0,0,0,0,0,0,0,0,2,1,1],
        [1,1,3,2,0,0,0,0,0,0,0,0,2,3,1,1],
        [1,1,1,3,2,0,0,0,0,0,0,2,3,1,1,1],
        [0,1,1,1,3,2,0,0,0,0,2,3,1,1,1,0],
        [0,1,1,1,1,3,2,0,0,2,3,1,1,1,1,0],
        [0,0,1,1,1,1,3,2,2,3,1,1,1,1,0,0],
        [0,0,0,1,1,1,1,3,3,1,1,1,1,0,0,0],
        [0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
      ]
    }
  };

  /* Matrisi bir canvas bağlamına çizer. Tek geçiş, fillRect. */
  function drawPixelArt(g, key, boyut){
    const A = PIXEL_ART[key];
    if (!A || !g) return false;
    const B = boyut || 128;
    const n = A.m.length;
    const px = Math.max(1, Math.floor(B / n));
    const off = Math.floor((B - px * n) / 2);
    g.clearRect(0, 0, B, B);
    for (let y = 0; y < n; y++){
      const row = A.m[y];
      for (let x = 0; x < row.length; x++){
        const v = row[x];
        if (!v) continue;
        g.fillStyle = A.c[v] || '#fff';
        g.fillRect(off + x * px, off + y * px, px, px);
      }
    }
    return true;
  }

  /* ═══════════════════════════════════════════════════════════════
     FAZ 9 — KATMANLI PORTRE
     Üç katman: ARKA PLAN · ZIRH/KIYAFET · KAFA
     Hiçbir resim dosyası yok; her şey prosedürel çizilir ve önbelleğe
     alınır. Önbellek anahtarı ruh hâlini de içerir, böylece ilişki
     değiştiğinde yeniden çizilir ama her karede değil.
     ═══════════════════════════════════════════════════════════════ */

  /* Zırh/kıyafet siluetleri — 12 sütun, 5 satır. Mizaca göre değişir.
     'a' = agresif varyant (ilişki −30 altına düşünce devreye girer) */
  const ARMOR = {
    militarist  :{ n:['..#......#..','.###....###.','.##########.','.#.######.#.','.##########.'],
                   a:['.##......##.','###A....A###','.##########.','##.######.##','.##########.'] },
    tuccar      :{ n:['....####....','..########..','.####..####.','.##########.','..########..'],
                   a:['...######...','..########..','.###.##.###.','.##########.','..########..'] },
    pasifist    :{ n:['.....##.....','....####....','..########..','.##########.','..########..'],
                   a:['....####....','..########..','.####..####.','.##########.','..########..'] },
    yayilmaci   :{ n:['...#....#...','..##....##..','.##########.','.#.######.#.','.##########.'],
                   a:['..#A....A#..','.###....###.','.##########.','##.######.##','.##########.'] },
    izolasyonist:{ n:['..########..','.##########.','.##########.','.#.######.#.','.##########.'],
                   a:['.##########.','###A####A###','.##########.','##.######.##','.##########.'] }
  };
  const PERSONA_KEYS = ['militarist','tuccar','pasifist','yayilmaci','izolasyonist'];

  /* Arka plan: ruh hâline göre renklenen radyal alan + yıldız tozu */
  function drawBackdrop(g, W, H, base, mood, seed){
    /* mood: 1 dostane · 0 nötr · −1 düşman */
    let c1, c2;
    if (mood < 0){        c1 = [58, 10, 14];  c2 = [120, 22, 26]; }
    else if (mood > 0){   c1 = [10, 34, 40];  c2 = [20, 74, 70];  }
    else {                c1 = [12, 16, 30];  c2 = [30, 38, 62];  }
    const gr = g.createRadialGradient(W/2, H*.62, 2, W/2, H*.55, W*.78);
    gr.addColorStop(0, 'rgb(' + c2.join(',') + ')');
    gr.addColorStop(1, 'rgb(' + c1.join(',') + ')');
    g.fillStyle = gr;
    g.fillRect(0, 0, W, H);

    /* Prosedürel yıldız tozu — tohumlu, her portre için sabit */
    let r = (seed | 0) || 7;
    const nxt = () => { r = (r * 1664525 + 1013904223) >>> 0; return r / 4294967296; };
    const n = Math.round(W * H / 420);
    for (let i = 0; i < n; i++){
      const x = Math.floor(nxt() * W), y = Math.floor(nxt() * H);
      const a = .10 + nxt() * .30;
      g.fillStyle = 'rgba(255,255,255,' + a.toFixed(2) + ')';
      g.fillRect(x, y, 1, 1);
    }
    /* Düşmanlıkta alt taraftan yükselen kızıl sis */
    if (mood < 0){
      const gg = g.createLinearGradient(0, H, 0, H * .35);
      gg.addColorStop(0, 'rgba(190,40,36,0.42)');
      gg.addColorStop(1, 'rgba(190,40,36,0)');
      g.fillStyle = gg;
      g.fillRect(0, 0, W, H);
    }
  }

  /* ASCII ızgarayı boyar; 'W' göz parıltısı, 'A' agresif vurgu */
  function paintGrid(g, art, ox, oy, scale, base, mood, karart){
    const h = art.length;
    for (let y = 0; y < h; y++){
      const row = art[y];
      for (let x = 0; x < row.length; x++){
        const ch = row[x];
        if (ch === '.') continue;
        if (ch === 'W'){
          g.fillStyle = mood < 0 ? '#ffd0c4' : '#bfeaff';
        } else if (ch === 'A'){
          g.fillStyle = mood < 0 ? '#ff5f6d' : '#8b7bff';
        } else {
          const m = (.55 + (1 - y / h) * .75) * (karart || 1);
          g.fillStyle = 'rgb(' + shade(base, m).join(',') + ')';
        }
        g.fillRect(ox + x * scale, oy + y * scale, scale, scale);
      }
    }
  }

  /* Katmanlı portre. opts: {look, col, persona, mood, scale}
     mood sayısal ilişki (−100..100) ya da −1/0/1 olabilir. */
  function portraitFull(opts){
    opts = opts || {};
    const look    = opts.look || 'humanoid';
    const colr    = opts.col || '#6ff2c8';
    const persona = PERSONA_KEYS.indexOf(opts.persona) >= 0 ? opts.persona : 'yayilmaci';
    const scale   = opts.scale || 3;
    /* Ruh hâlini üç kovaya indir: önbellek patlamasın */
    const raw  = (opts.mood === undefined) ? 0 : opts.mood;
    const mood = raw <= -30 ? -1 : raw >= 30 ? 1 : 0;

    const key = 'pf_' + look + '_' + colr + '_' + persona + '_' + mood + '_' + scale;
    if (cache.has(key)) return cache.get(key);

    const head = PORTRAIT[look] || PORTRAIT.humanoid;
    const arm  = ARMOR[persona] || ARMOR.yayilmaci;
    const armArt = (mood < 0) ? arm.a : arm.n;

    const cols = 12;
    const pad  = 1;                                   // hücre cinsinden kenar payı
    const rows = head.length + armArt.length - 2;     // zırh kafanın altına biner
    const W = (cols + pad * 2) * scale;
    const H = (rows + pad * 2) * scale;
    const { c, g } = cv(W, H);
    g.imageSmoothingEnabled = false;

    const base = hex(colr);
    /* 1. KATMAN — arka plan */
    let sd = 0;
    for (let i = 0; i < look.length; i++) sd = (sd * 31 + look.charCodeAt(i)) >>> 0;
    for (let i = 0; i < colr.length; i++) sd = (sd * 31 + colr.charCodeAt(i)) >>> 0;
    drawBackdrop(g, W, H, base, mood, sd);

    /* 2. KATMAN — zırh / kıyafet (kafanın altında, biraz koyu) */
    const armY = (pad + head.length - 2) * scale;
    paintGrid(g, armArt, pad * scale, armY, scale, base, mood, .62);

    /* 3. KATMAN — kafa */
    paintGrid(g, head, pad * scale, pad * scale, scale, base, mood, 1);

    /* Düşmanlıkta ince kızıl çerçeve — durum bir bakışta okunsun */
    if (mood < 0){
      g.strokeStyle = 'rgba(255,95,109,.85)';
      g.lineWidth = Math.max(1, scale / 3);
      g.strokeRect(g.lineWidth / 2, g.lineWidth / 2, W - g.lineWidth, H - g.lineWidth);
    } else if (mood > 0){
      g.strokeStyle = 'rgba(101,224,138,.55)';
      g.lineWidth = Math.max(1, scale / 3);
      g.strokeRect(g.lineWidth / 2, g.lineWidth / 2, W - g.lineWidth, H - g.lineWidth);
    }
    cache.set(key, c);
    return c;
  }

  /* --------------------------------------------------------------
     BULUTSU — galaksi arka planı
     -------------------------------------------------------------- */
  function nebula(seed, W, H){
    const {c,g} = cv(W,H);
    const img = g.createImageData(W,H);
    const D = img.data;
    const tints = [hex('#3a2a6b'), hex('#1d4a63'), hex('#5b2340'), hex('#1f5a4a')];
    const rnd = mulberry32(seed);
    const blobs = [];
    for (let i=0;i<5;i++) blobs.push({
      x: rnd()*W, y: rnd()*H, r: (.18+rnd()*.30)*W, t: tints[(rnd()*tints.length)|0]
    });
    for (let y=0;y<H;y++) for (let x=0;x<W;x++){
      const i = (y*W+x)*4;
      let r=0,gg=0,b=0,a=0;
      const n = fbm(x*.045, y*.045, seed, 5);
      for (const bl of blobs){
        const d = Math.hypot(x-bl.x, y-bl.y)/bl.r;
        if (d < 1){
          const f = Math.pow(1-d, 2.1) * (n*.85+.25);
          r += bl.t[0]*f; gg += bl.t[1]*f; b += bl.t[2]*f; a += f;
        }
      }
      if (a > .01){
        D[i]=clamp(r,0,255)|0; D[i+1]=clamp(gg,0,255)|0; D[i+2]=clamp(b,0,255)|0;
        D[i+3]=clamp(a*150,0,120)|0;
      }
    }
    g.putImageData(img,0,0);
    return c;
  }

  return {planet, star, ship, emblem, portrait, portraitFull, nebula, cache,
          PORTRAIT, ARMOR, hexOf: hex, drawPixelArt, PIXEL_ART};
})();
/* =====================================================================
   GALAKSİ ÜRETİMİ
   ===================================================================== */
const G = {
  W: 4200, H: 4200,
  sys: [], emps: [], fleets: [], nextFleet: 1,
  day: 0, year: 2210, month: 1,
  speed: 0, running: false,
  cfg: null, seed: 0, p: null, nebula: null,
  log: [], over: null
};

/* iki sistem arası hiper yol sıçrama sayısı (max ile sınırlı BFS) */
function hopDist(a, b, max){
  if (a === b) return 0;
  const seen = new Set([a]);
  let frontier = [a];
  for (let d = 1; d <= max; d++){
    const next = [];
    for (const id of frontier){
      const sy = G.sys[id];
      if (!sy) continue;
      for (const l of sy.lanes){
        if (l === b) return d;
        if (seen.has(l)) continue;
        seen.add(l); next.push(l);
      }
    }
    frontier = next;
    if (!frontier.length) break;
  }
  return 99;
}

function pickStar(rnd){
  const tot = STARS.reduce((a,s)=>a+s.w,0);
  let r = rnd()*tot;
  for (const s of STARS){ r -= s.w; if (r<=0) return s; }
  return STARS[0];
}

function genPlanets(rnd, starDef, sysIdx){
  const n = 1 + Math.floor(rnd()*4) + (rnd()<.25?1:0);
  const out = [];
  for (let i=0;i<n;i++){
    let t;
    const roll = rnd();
    if (starDef.ozel){ t = roll<.6 ? pick(rnd,['cor','buz','ast']) : pick(rnd,['gaz','bzd','tok']); }
    else if (i === 0 && roll < .42) t = pick(rnd, HAB_TYPES);
    else if (roll < .28) t = pick(rnd, HAB_TYPES);
    else if (roll < .30) t = pick(rnd, ['gaz','bzd']);
    else if (roll < .38) t = 'ast';
    else t = pick(rnd, DEAD_TYPES);
    if (rnd() < .020) t = 'gay';
    const def = PLANETS[t];
    let dep = null;
    if (rnd() < .34){
      const ok = DEPOSITS.filter(d => d.on.includes(def.k));
      if (ok.length){
        const tot = ok.reduce((a,d)=>a+d.w,0); let r = rnd()*tot;
        for (const d of ok){ r -= d.w; if (r<=0){ dep = d.id; break; } }
      }
    }
    out.push({
      i, t, dep, sz: def.k==='gaz' ? 24+Math.floor(rnd()*12) : def.k==='ast' ? 0 : 10+Math.floor(rnd()*11),
      seed: (sysIdx*131 + i*17 + 3)|0,
      owner: -1, col: null, name: null
    });
  }
  return out;
}

function generateGalaxy(cfg){
  const rnd = mulberry32(cfg.seed);
  G._adlar = {};                     // FAZ 44: isim tekrarını önler
  G._palet = assignPalette(rnd);     // FAZ 46: ayrık renkler
  G._paletIx = 0;
  const N = SIZES[cfg.size].sys;
  /* FAZ 32: harita alanı sistem sayısıyla büyür — yıldızlar sıkışmaz
     ve istenen sistem sayısı gerçekten üretilir. */
  G.W = G.H = galaxyScale(N);
  const pts = [];
  const R = G.W*.46, cx = G.W/2, cy = G.H/2;
  /* minD artık alana göre normalize: yoğunluk her ölçekte sabit */
  /* ÖLÇÜM: .30 katsayısıyla 80 istenen sistemin ancak 50'si
     yerleşiyordu. Sarmal/halka dağılımlarda noktalar kollara
     toplandığı için efektif alan teorikten küçük — katsayı
     ampirik olarak .30 → .19'a çekildi. */
  const minD = R * .19 * Math.sqrt(30 / Math.max(30, N));

  let guard = 0;
  while (pts.length < N && guard++ < N*400){
    let x, y;
    if (cfg.shape === 'sarmal'){
      const arm = Math.floor(rnd()*3);
      const t = Math.pow(rnd(), .62);
      const ang = arm*(Math.PI*2/3) + t*3.1 + (rnd()-.5)*.62;
      const rr = t*R + (rnd()-.5)*R*.16;
      x = cx + Math.cos(ang)*rr; y = cy + Math.sin(ang)*rr;
    } else if (cfg.shape === 'halka'){
      const ang = rnd()*Math.PI*2;
      const rr = R*(.52 + rnd()*.46);
      x = cx + Math.cos(ang)*rr; y = cy + Math.sin(ang)*rr;
    } else {
      const nk = 4 + Math.floor(N/16);
      const k = Math.floor(rnd()*nk);
      const ka = (k/nk)*Math.PI*2 + .4, kr = R*(.30 + (k%3)*.24);
      const kx = cx+Math.cos(ka)*kr, ky = cy+Math.sin(ka)*kr;
      const a2 = rnd()*Math.PI*2, r2 = Math.pow(rnd(),.6)*R*.30;
      x = kx + Math.cos(a2)*r2; y = ky + Math.sin(a2)*r2;
    }
    x = clamp(x, 140, G.W-140); y = clamp(y, 140, G.H-140);
    let ok = true;
    for (const p of pts) if (Math.hypot(p.x-x,p.y-y) < minD){ ok = false; break; }
    if (ok) pts.push({x,y});
  }

  const used = new Set();
  G.sys = pts.map((p,i) => {
    const sd = pickStar(rnd);
    let nm; let t=0;
    do { nm = starName(rnd); } while (used.has(nm) && t++ < 40);
    used.add(nm);
    return {
      id:i, x:p.x, y:p.y, name:nm, star:sd,
      planets: genPlanets(rnd, sd, i),
      lanes: [], owner:-1, surv:[], seen:[], def:0,
      queue:[], anom: rnd()<.42,
      /* FAZ 17: anomali türü üretimde sabitlenir — haritada
         hangi sınıf olduğu taramadan önce görünür. */
      anomK: pick(rnd, ['sinyal','kalinti','megayapi','dogal'])
    };
  });
  G.sys.forEach(s => s.planets.forEach(pl => pl.name = s.name + ' ' + ROMAN[pl.i]));

  /* --- hiper yolları --- */
  const maxLane = minD*2.5;
  for (const a of G.sys){
    const near = G.sys.filter(b=>b!==a).map(b=>({b, d:dist(a,b)}))
                      .sort((p,q)=>p.d-q.d);
    const k = 2 + (rnd()<.5?1:0);
    for (let i=0;i<Math.min(k, near.length); i++){
      if (near[i].d > maxLane && a.lanes.length>0) break;
      link(a, near[i].b);
    }
  }
  // bağlantısız kümeleri birleştir
  let comps = components();
  guard = 0;
  while (comps.length > 1 && guard++ < 200){
    const A = comps[0], B = comps[1];
    let best = null;
    for (const ia of A) for (const ib of B){
      const d = dist(G.sys[ia], G.sys[ib]);
      if (!best || d < best.d) best = {a:ia, b:ib, d};
    }
    link(G.sys[best.a], G.sys[best.b]);
    comps = components();
  }

  function link(a,b){
    if (a.lanes.includes(b.id)) return;
    a.lanes.push(b.id); b.lanes.push(a.id);
  }
  function components(){
    const seen = new Set(), out = [];
    for (const s of G.sys){
      if (seen.has(s.id)) continue;
      const st=[s.id], comp=[];
      seen.add(s.id);
      while (st.length){
        const c = st.pop(); comp.push(c);
        for (const l of G.sys[c].lanes) if (!seen.has(l)){ seen.add(l); st.push(l); }
      }
      out.push(comp);
    }
    return out.sort((a,b)=>b.length-a.length);
  }

  // --- lüks mal yataklarını dağıt: her mal galakside 2-3 gezegende ---
  {
    const spots = [];
    for (const sy of G.sys) for (const pl of sy.planets)
      if (PLANETS[pl.t].k === 'hab' || PLANETS[pl.t].k === 'gaz') spots.push({sy, pl});
    shuffle(rnd, spots);
    let si = 0;
    for (const key of LUX_KEYS){
      const copies = 2 + (rnd() < .45 ? 1 : 0);
      for (let c = 0; c < copies && si < spots.length; c++, si++){
        spots[si].pl.lux = key;
      }
    }
  }

  G.seed = cfg.seed;
  G.nebula = ART.nebula(cfg.seed, 128, 128);
  return rnd;
}

/* =====================================================================
   MODİFİKATÖRLER
   ===================================================================== */
/* bir imparatorluk belirli bir civic yeteneğine sahip mi? */
function hasCivic(e, flag){
  if (!e || !e.civics) return false;
  for (const c of e.civics) if (CIVICS[c] && CIVICS[c].flag === flag) return true;
  return false;
}
function civicSlots(e){ return hasCivic(e,'slots') ? 2 : 0; }
function recalcMods(e){
  const m = {
    minMul:0, eneMul:0, yiyMul:0, alaMul:0, araMul:0, etkFlat:0, eneFlat:0,
    dmgMul:0, shMul:0, hullMul:0, spdMul:0, growMul:0, habFlat:0, dipMul:0,
    capFlat:0, upMul:0, buildMul:0, colCost:0, stab:0, sensor:0,
    eDmgMul:0, eShMul:0,
    /* FAZ 48: diplomatik ahlak ekseni */
    trustCap:0, tradeMul:0, opCost:0, opBonus:0, opRisk:0, trustStart:0,
    /* FAZ 36: Galaktik Savunma Paktı bonusu. recalcMods'taki add()
       yalnız BURADA TANIMLI anahtarları kabul ediyor; listede
       olmadığı için crisisDmg sessizce yok sayılıyordu (ölçümde
       "+%0" olarak yakalandı). */
    crisisDmg:0,
    shipCost:0            // FAZ 54: Kriz Hazırlığı tasarısı
  };
  const add = src => { for (const k in src) if (k in m) m[k] += src[k]; };
  add(RACES[e.race].e);
  (e.traits||[]).forEach(t => TRAITS[t] && add(TRAITS[t].e));
  // etik eksenleri
  const et = e.ethics || {};
  for (const ax in ETHICS){
    const v = et[ax] || 0;
    if (!v) continue;
    const src = v > 0 ? ETHICS[ax].ea : ETHICS[ax].eb;
    const n = Math.abs(v);
    for (const k in src) if (k in m) m[k] += src[k] * n;
  }
  // civic'ler
  (e.civics||[]).forEach(c => CIVICS[c] && add(CIVICS[c].e));
  // lüks mallar — tekel mantığı: her çeşit yalnız bir kez sayılır
  const lux = e.luxury || {};
  const cartel = hasCivic(e,'cartel');
  for (const k in lux){
    if (!lux[k] || !LUXURY[k]) continue;
    add(LUXURY[k].e);
    // Kartel: galakside o malın tek üreticisiysen bonus iki katı
    if (cartel && e.luxOwn && e.luxOwn[k]){
      let others = 0;
      for (const o of G.emps){
        if (o.dead || o.wild || o.id === e.id) continue;
        for (const c of o.colonies){
          const pl = G.sys[c.s] && G.sys[c.s].planets[c.p];
          if (pl && pl.lux === k && pl.col){ others++; break; }
        }
        if (others) break;
      }
      if (!others) add(LUXURY[k].e);
    }
  }
  for (const t in e.techs) if (e.techs[t] && TECHS[t]) add(TECHS[t].e);
  if (e.extra){
    add(e.extra);
    if (e.extra.shortMin) m.minMul += e.extra.shortMin;
    if (e.extra.shortAra) m.araMul += e.extra.shortAra;
  }
  // --- ETİK EŞİK YETENEKLERİ ---
  if (hasPerk(e,'warEconomy')){
    m.capFlat += 30;
    if (Object.keys(e.war||{}).some(k=>e.war[k])) m.alaMul += .20;
  }
  if (hasPerk(e,'peaceAlways')) m.hullMul += .20;
  if (hasPerk(e,'migration'))   m.growMul += .10;
  if (hasPerk(e,'faith'))       m.etkFlat += 3.5;
  if (hasPerk(e,'labFocus'))    m.araMul += .06;
  if (hasPerk(e,'ironWill'))    m.stab += 6;
  /* FAZ 10: Tersane Virüsü — sabotaj operasyonunun kalıcı etkisi */
  if (e.virusUntil && e.virusUntil > G.day) m.buildMul -= .50;
  if (e.extra && e.extra.megaBoost) m.buildMul += .15;
  if (hasCivic(e,'megaeng')) m.buildMul += .12;
  // Galaktik Tehdit lekesi: nedensiz savaş açanın üretimi ve diplomasisi çöker
  if (typeof threatMods === 'function'){
    const tm = threatMods(e);
    for (const k in tm) if (k in m) m[k] += tm[k];
  }
  // dinamik galaktik çalkantılar (göç, çöküş, salgın, altın çağ...)
  if (typeof upheavalMods === 'function'){
    const um = upheavalMods(e);
    for (const k in um) if (k in m) m[k] += um[k];
  }
  // ticari ambargo ve Galaktik Parya baskısı
  if (typeof embargoMods === 'function'){
    const em = embargoMods(e);
    for (const k in em) if (k in m) m[k] += em[k];
  }
  // Galaktik Konsey kararları
  if (typeof councilMods === 'function'){
    const cm = councilMods(e);
    for (const k in cm) if (k in m) m[k] += cm[k];
  }
  // fraksiyon etkileri
  if (typeof facMods === 'function'){
    const fm = facMods(e);
    for (const k in fm) if (k in m) m[k] += fm[k];
  }
  // savaş coşkusu (Savaş Öncüleri) — ilan sonrası 24 ay
  if (hasCivic(e,'warFury') && e.furyUntil && G.day < e.furyUntil) m.dmgMul += .25;
  // önder kaybı çöküşü (Ölümsüz İmparator)
  if (e.collapseUntil && G.day < e.collapseUntil){
    m.minMul -= .40; m.eneMul -= .40; m.araMul -= .40; m.alaMul -= .40;
  }
  // tek ürün ekonomisi
  if (hasCivic(e,'mono') && e.monoRes){
    for (const k of ['minMul','eneMul','araMul','alaMul']) m[k] -= .50;
    const key = e.monoRes + 'Mul';
    if (key in m) m[key] += 1.05;   // −50 iptal + net +55
  }
  e.mods = m;
  /* Sınır bekçisi vasallar senyörün donanma tavanını yükseltir */
  const vasalCap = (typeof vassalCapBonus === 'function') ? vassalCapBonus(e) : 0;
  e.cap = 40 + m.capFlat + e.colonies.length*6 + vasalCap;
  return m;
}

function habOf(e, pl){
  const def = PLANETS[pl.t];
  if (def.k !== 'hab') return 0;
  const race = RACES[e.race];
  let h;
  if (race.bio === 'makine') h = (pl.t==='mak') ? 100 : 60;
  else if (pl.t === 'gay') h = 100;
  else if (pl.t === 'mak') h = 20;
  else h = (def.ik === race.ik) ? 78 : 38;
  /* ═══ FAZ 52: FİZYOLOJİ ETKİSİ ═══ */
  const ph = (typeof physioOf === 'function') ? physioOf(e) : null;
  if (ph){
    if (ph.habBonus) h *= (1 + ph.habBonus);
    if (ph.sever && ph.sever.indexOf(pl.t) >= 0) h += 18;
    if (ph.sevmez && ph.sevmez.indexOf(pl.t) >= 0) h -= 35;
  }
  h += e.mods.habFlat;
  h += (pl.terra || 0) * TERRA_BONUS;
  return clamp(Math.round(h), 0, 100);
}

/* =====================================================================
   İMPARATORLUK KURULUMU
   ===================================================================== */
/* ═══════════════════════════════════════════════════════════════════
   FAZ 44 — PROSEDÜREL İMPARATORLUK İSİMLERİ
   Sabit ırk adları yerine her oyunda etik ve rejime göre üretilen
   isimler. Aynı oyunda tekrar etmez (kullanılanlar işaretlenir).
   ═══════════════════════════════════════════════════════════════════ */
const NAME_PREFIX = {
  /* Otoriter (aut > 0) */
  aut:  ['Kutsal', 'Yüce', 'Göksel', 'Kadim', 'Ebedi', 'Muhteşem', 'Mutlak'],
  /* Özgürlükçü (aut < 0) */
  lib:  ['Birleşik', 'Otonom', 'Hür', 'Özgür', 'Bağımsız', 'Egemen'],
  /* Militarist (mil > 0) */
  mil:  ['Kızıl', 'Demir', 'Çelik', 'Fatih', 'Yenilmez', 'Amansız'],
  /* Pasifist (mil < 0) */
  pac:  ['Aydınlanmış', 'Huzurlu', 'Bilge', 'Uyumlu', 'Kardeş'],
  /* Materyalist / Ruhçu */
  mat:  ['Primordial', 'Sentetik', 'Analitik', 'Kuantum'],
  spi:  ['Ruhani', 'Kutsanmış', 'Vahiy', 'Ezeli'],
  none: ['Büyük', 'Eski', 'Uzak', 'Yıldız']
};
const NAME_ROOT = [
  "Xel'Naga", 'Drakis', 'Aethel', 'Zephyr', 'Solari', 'Vael', 'Krynn',
  'Thalor', 'Myrrh', 'Ondris', 'Kaevar', 'Tessaly', 'Nyx', 'Orinth',
  'Zharn', 'Veyra', 'Sombra', 'Ilkhan', 'Qadesh', 'Ereth', 'Vantia',
  'Morrigan', 'Sylph', 'Tarkun', 'Auren', 'Belrun', 'Cyrix', 'Draven'
];
const NAME_SUFFIX = {
  aut:  ['Hanedanlığı', 'İmparatorluğu', 'Sultanlığı', 'Tahtı', 'Otoritesi'],
  lib:  ['Konfederasyonu', 'Meclisi', 'Cumhuriyeti', 'Birliği', 'Federasyonu'],
  mil:  ['Klan Birliği', 'Savaş Konseyi', 'Lejyonu', 'Ordusu', 'Hanedanlığı'],
  pac:  ['Meclisi', 'Uyum Konseyi', 'Birliği', 'Topluluğu'],
  mat:  ['Kolektifi', 'Zihni', 'Ağı', 'Konsorsiyumu'],
  spi:  ['Tarikatı', 'Mabedi', 'Vahiy Konseyi', 'İnancı'],
  none: ['Devleti', 'Birliği', 'Hanedanı']
};
const WILD_NAMES = [
  'Nebula Yağmacıları', 'Kara Yıldız Korsanları', 'Kızıl Pençe Çetesi',
  'Boşluk Akbabaları', 'Enkaz Avcıları', 'Sönmüş Güneş Haydutları',
  'Demir Dişli Sürüsü', 'Kayıp Filo Yağmacıları'
];
const CRISIS_NAMES = [
  'Hiçlik Sürüsü', 'Gölge Kovanı', 'Sessiz Kıyamet', 'Aç Karanlık',
  'Boşluk Yiyenler', 'Son Sürü', 'Kadim Açlık'
];

/* ═══════════════════════════════════════════════════════════════════
   FAZ 46 — AYRIK RENK PALETİ
   Irk renkleri birbirine yakın düşebiliyordu (iki mavi, iki yeşil).
   Bu palet HSL çemberinde 40° aralıklarla dizilmiş, doygunluk ve
   parlaklık dengelenmiş renkler verir; her imparatorluk kesin
   ayırt edilir. Sıra karıştırılır ki her oyun farklı görünsün.
   ═══════════════════════════════════════════════════════════════════ */
/* ═══════════════════════════════════════════════════════════════════
   FAZ 47 — ÜÇ EKSENLİ HSL PALETİ
   Faz 46'da 12 rengi yalnız TON ekseninde dağıtmaya çalıştım ve
   22°'de takıldım (hedef 30°). Matematiksel sebep: 12 renk × 360°
   = ortalama 30°, rastgele sıralamayla altına düşüyor.
   ÇÖZÜM: 6 ton × 2 varyant. Aynı tondaki iki renk parlaklıkta
   %24, doygunlukta %46 ayrışıyor; farklı tonlar zaten 40°+.
   ÖLÇÜM: en yakın çift 36.0 (metrik: dHue + dSat×120 + dLight×120).
   ═══════════════════════════════════════════════════════════════════ */
const EMP_PALETTE = [
  /* ── PARLAK KATMAN (s .88, l .66) ── */
  '#f5665c',  //   4° mercan
  '#f5c25c',  //  40° kehribar
  '#b2f55c',  //  86° limon
  '#5cf5d6',  // 168° akuamarin
  '#5c9ef5',  // 214° gök
  '#d65cf5',  // 288° orkide
  /* ── KOYU KATMAN (s .42, l .42) — ton 18° kaydırılmış ── */
  '#985f3e',  //  22° kızıl kahve
  '#98953e',  //  58° hardal
  '#56983e',  // 104° zeytin
  '#3e8f98',  // 186° petrol
  '#3e4a98',  // 232° lacivert
  '#983e8f'   // 306° erguvan
];

function assignPalette(rnd){
  /* Fisher-Yates: her oyunda farklı sıra */
  const p = EMP_PALETTE.slice();
  for (let i = p.length - 1; i > 0; i--){
    const j = Math.floor(rnd() * (i + 1));
    const t = p[i]; p[i] = p[j]; p[j] = t;
  }
  return p;
}

function empireName(rnd, ethics, kullanilan){
  const et = ethics || {};
  /* Baskın eksene göre ön/son ek havuzu seç */
  const havuz = [];
  if ((et.aut || 0) > 0) havuz.push('aut');
  if ((et.aut || 0) < 0) havuz.push('lib');
  if ((et.mil || 0) > 0) havuz.push('mil');
  if ((et.mil || 0) < 0) havuz.push('pac');
  if ((et.mat || 0) > 0) havuz.push('mat');
  if ((et.mat || 0) < 0) havuz.push('spi');
  if (!havuz.length) havuz.push('none');

  for (let deneme = 0; deneme < 40; deneme++){
    const k1 = havuz[Math.floor(rnd() * havuz.length)];
    const k2 = havuz[Math.floor(rnd() * havuz.length)];
    const on = NAME_PREFIX[k1][Math.floor(rnd() * NAME_PREFIX[k1].length)];
    const kok = NAME_ROOT[Math.floor(rnd() * NAME_ROOT.length)];
    const son = NAME_SUFFIX[k2][Math.floor(rnd() * NAME_SUFFIX[k2].length)];
    /* %25 ihtimalle ön ek atlanır — çeşitlilik */
    const ad = (rnd() < .25) ? (kok + ' ' + son) : (on + ' ' + kok + ' ' + son);
    if (!kullanilan || !kullanilan[ad]){
      if (kullanilan) kullanilan[ad] = 1;
      return ad;
    }
  }
  /* Havuz tükendiyse köke sayı ekle */
  const kok2 = NAME_ROOT[Math.floor(rnd() * NAME_ROOT.length)];
  return kok2 + ' ' + NAME_SUFFIX.none[Math.floor(rnd() * NAME_SUFFIX.none.length)];
}

function makeEmpire(id, raceKey, name, ai, rnd, traits){
  const race = RACES[raceKey];
  const e = {
    id, race:raceKey, name: name || race.n, ai,
    col: race.col, traits: traits || [],
    res:{min:400, ene:300, yiy:180, ala:220, ara:0, tuk:150, etk:70},
    inc:{min:0,ene:0,yiy:0,ala:0,ara:0,tuk:0,etk:0},
    techs:{}, rq:{fiz:null, top:null, muh:null}, rp:{fiz:0, top:0, muh:0},
    colonies:[], mods:{}, cap:40, dead:false,
    rel:{}, war:{}, ally:{},
    home:-1, assim:0, contact:{},
    agr: race.agr, exp: race.exp, extra:{},
    ethics:{mil:0, aut:0, mat:0, ahl:0},   /* 4 eksen — blankEthics() ile senkron */
  civics:[], origin:'standart',
    sigil:'simetrik', monoRes:null, furyUntil:0, collapseUntil:0, warPend:{}
  };
  recalcMods(e);
  return e;
}

function colorFor(i, rnd){
  const pool = ['#4aa8d8','#ff5f6d','#96b13a','#8b7bff','#f2d452','#ff9b3d','#c98d4a','#6ff2c8','#e069c0','#5fd0b0'];
  return pool[i % pool.length];
}

function setupGame(cfg){
  G.cfg = cfg;
  rndSeed(cfg.seed ^ 0x5f3a91);
  const rnd = generateGalaxy(cfg);
  const nAI = SIZES[cfg.size].ai;
  G.emps = [];
  G.fleets = []; G.nextFleet = 1;
  G.day = 0; G.year = 2210; G.month = 1; G.log = []; G.over = null;
  G.memAge = 0;                    // hafıza/soğuk savaş tur sayacı
  // yeni oyunda konsey/kriz sayaçları sıfırlanmalı
  G.cncAge = 0; G.council = null; G.feds = []; G.inbox = []; G.chainQueue = [];
  G.raids = {}; G.friction = {}; G.fx = [];
  G.fallStats = {uzay:0, teslim:0, katastrof:0, temiz:0, colossus:0, yutuldu:0, ayrilik:0};
  G.sabStats = {basari:0, ifsa:0, sessiz:0, cift:0, tech:0, kiskirt:0, falseflag:0};

  // oyuncu
  const pe = makeEmpire(0, cfg.race, cfg.name, false, rnd, cfg.traits);
  /* FAZ 46: oyuncu renk seçmediyse paletin ilkini alır — AI'lar
     kalanlardan devam eder, çakışma olmaz. */
  /* FAZ 52: fizyoloji aktarımı — habOf, beslenme ve büyüme
     hesapları physioOf(e) üzerinden bunu okur. */
  pe.physio = cfg.physio || 'humanoid';
  if (PHYSIO[pe.physio] && PHYSIO[pe.physio].e)
    pe.extra = Object.assign(pe.extra || {}, PHYSIO[pe.physio].e);
  if (cfg.color) pe.col = cfg.color;
  else if (G._palet && G._paletIx < G._palet.length) pe.col = G._palet[G._paletIx++];
  else pe.col = RACES[cfg.race].col;
  pe.ethics = Object.assign({mil:0, aut:0, mat:0, ahl:0}, cfg.ethics || {});
  pe.civics = (cfg.civics || []).slice(0, CIVIC_SLOTS);
  pe.origin = cfg.origin || 'standart';
  pe.sigil  = cfg.sigil  || 'simetrik';
  pe.look   = cfg.look   || 'humanoid';
  pe.monoRes = cfg.monoRes || 'min';
  recalcMods(pe);
  G.emps.push(pe);
  G.p = pe;

  // rakipler
  const others = shuffle(rnd, Object.keys(RACES).filter(k=>true));
  for (let i=0;i<nAI;i++){
    const rk = others[i % others.length];
    const ai = makeEmpire(i+1, rk, RACES[rk].n, true, rnd, []);
    ai.col = colorFor(i+1, rnd);
    if (ai.col === pe.col) ai.col = colorFor(i+5, rnd);
    ai.agr *= DIFFS[cfg.diff].aiAgr;
    ai.extra = {minMul:(DIFFS[cfg.diff].aiMul-1)*.8, araMul:(DIFFS[cfg.diff].aiMul-1)*.8,
                alaMul:(DIFFS[cfg.diff].aiMul-1)*.8};
    // rakipler de ideoloji ve civic taşısın — her oyun farklı komşular
    const R = RACES[rk];
    // ırkın doğal ideolojisi temel alınır, hafif rastgele sapma eklenir
    const base = R.eth || {mil:0, aut:0, mat:0, ahl:0};
    ai.ethics = {
      mil: clamp(Math.round((base.mil||0) + (rnd()-.5)*1.6), -ETHIC_MAX, ETHIC_MAX),
      aut: clamp(Math.round((base.aut||0) + (rnd()-.5)*1.6), -ETHIC_MAX, ETHIC_MAX),
      mat: clamp(Math.round((base.mat||0) + (rnd()-.5)*1.6), -ETHIC_MAX, ETHIC_MAX)
    };
    // bütçeyi aşarsa en zayıf ekseni kırp
    let spent = Math.abs(ai.ethics.mil) + Math.abs(ai.ethics.aut) + Math.abs(ai.ethics.mat);
    const axes = ['mil','aut','mat'].sort((x,y)=>Math.abs(ai.ethics[x]) - Math.abs(ai.ethics[y]));
    for (const ax of axes){
      while (spent > ETHIC_BUDGET && ai.ethics[ax] !== 0){
        ai.ethics[ax] -= Math.sign(ai.ethics[ax]);
        spent--;
      }
    }
    const civPool = Object.keys(CIVICS).filter(c => !CIVICS[c].sars || rnd() < .35);
    shuffle(rnd, civPool);
    ai.civics = civPool.slice(0, CIVIC_SLOTS);
    if (hasCivic(ai,'mono')) ai.monoRes = pick(rnd, ['min','ene','ara','ala']);
    ai.sigil = pick(rnd, Object.keys(SIGILS));
    ai.look = R.bio === 'makine' ? 'makine' : R.bio === 'litoit' ? 'kristal'
              : pick(rnd, ['humanoid','bocek','surungen','amorf','kanatli','akuatik']);
    /* FAZ 44: isim etik ve civic'ler kesinleştikten SONRA üretilir —
       böylece "Kızıl Drakis Lejyonu" gibi karaktere uyan adlar çıkar. */
    /* ═══ FAZ 53: AI FİZYOLOJİ DAĞITIMI ═══
       AI'lar tek tip biyolojiye kilitlenmiyor. Irkın bio alanı
       tematik bir ağırlık verir (litoit ırk büyük olasılıkla
       kayaç kalır) ama kalanı rastgele — her galakside farklı
       biyolojiler karşımıza çıkar. */
    {
      const bio = RACES[ai.race] ? RACES[ai.race].bio : 'organik';
      const havuz = (bio === 'litoit')
        ? ['lithoid','lithoid','lithoid','humanoid','plantoid']
        : (bio === 'makine')
        ? ['humanoid','humanoid','lithoid']
        : ['humanoid','lithoid','aquatic','avian','plantoid'];
      ai.physio = havuz[Math.floor(rnd() * havuz.length)];
      if (PHYSIO[ai.physio] && PHYSIO[ai.physio].e)
        ai.extra = Object.assign(ai.extra || {}, PHYSIO[ai.physio].e);
    }
    ai.name = empireName(rnd, ai.ethics, G._adlar);
    /* FAZ 46: paletten sıradaki ayrık renk */
    if (G._palet && G._paletIx < G._palet.length)
      ai.col = G._palet[G._paletIx++];
    recalcMods(ai);
    G.emps.push(ai);
  }

  // --- VAHŞİ TARAF: korsanlar ve uzay canavarları ---
  const wild = makeEmpire(G.emps.length, 'klan',
    WILD_NAMES[Math.floor(rnd() * WILD_NAMES.length)], true, rnd, []);
  /* FAZ 46: korsan rengi sabit koyu bordo idi ve palet kızılıyla
     5° farkla çakışıyordu. Nötr kurşuni griye alındı — korsanlar
     zaten bir devlet değil, haritada ayrı bir doku olmalı. */
  wild.col = '#7a8596';
  wild.wild = true;
  wild.ethics = {mil:3, aut:0, mat:0};
  wild.civics = [];
  wild.look = 'amorf';
  recalcMods(wild);
  G.wildId = wild.id;
  G.emps.push(wild);

  // Konsey açıksa galakside en az bir pasifist devlet bulunsun
  if ((cfg.council || 'normal') !== 'kapali'){
    const anyPacifist = G.emps.some(x => !x.wild && ((x.ethics && x.ethics.mil) || 0) <= -2);
    if (!anyPacifist){
      const cand = G.emps.filter(x => !x.wild && x.ai && RACES[x.race].dip > .3);
      const pick2 = cand.length ? cand[0] : G.emps.find(x => !x.wild && x.ai);
      if (pick2){
        pick2.ethics = {mil:-2, aut:-1, mat:0};
        pick2.agr *= .5;
        recalcMods(pick2);
      }
    }
  }

  // ilişkiler
  for (const a of G.emps) for (const b of G.emps){
    if (a!==b){ a.rel[b.id] = 0; a.war[b.id] = false; a.ally[b.id] = false; a.contact[b.id] = false; }
  }

  // anavatanlar — hem uzak hem de hiper yolla ayrık olmalı
  // (iki başkent asla komşu olmasın: aralarında en az 2 sistem)
  const cands = G.sys.slice().sort(()=>rnd()-.5);
  const need = G.emps.length;
  let homes = [];
  for (let minHop = 3; minHop >= 2 && homes.length < need; minHop--){
    let minSep = G.W*.42;
    while (homes.length < need && minSep > 40){
      homes = [];
      for (const s of cands){
        const farEnough = homes.every(h => dist(G.sys[h], s) > minSep);
        const hopOK = homes.every(h => hopDist(h, s.id, minHop) > minHop);
        if (farEnough && hopOK){
          homes.push(s.id);
          if (homes.length === need) break;
        }
      }
      minSep *= .86;
    }
  }
  // son çare: sıçrama şartını gevşet ama komşuluğu yine engelle
  if (homes.length < need){
    homes = [];
    for (const s of cands){
      if (homes.every(h => !G.sys[h].lanes.includes(s.id) && h !== s.id)){
        homes.push(s.id);
        if (homes.length === need) break;
      }
    }
  }
  while (homes.length < need) homes.push(cands[homes.length % cands.length].id);

  /* HOTFIX 23.1 — KORSANLAR TARAFSIZ BAŞLAR
     Eskiden oyunun ilk karesinde herkese savaş ilan edilmiş
     sayılıyordu; üst barda "1 SAVAŞ" görünüyor ve daha kimse
     kimseyi görmeden çatışma başlıyordu. Artık korsanlar
     düşmandır ama SAVAŞ HÂLİ DEĞİLDİR — ilk yağma girişimiyle
     (raidTick) fiilî çatışma doğar. */
  for (const o of G.emps){
    if (o.id === wild.id) continue;
    wild.rel[o.id] = -100; o.rel[wild.id] = -100;
    /* Temas da kurulmaz: korsanı görmek için karşılaşmak gerekir */
  }

  G.emps.forEach((e,i) => {
    if (e.wild) return;               // vahşilerin anavatanı yok
    const sid = homes[i % homes.length];
    const s = G.sys[sid];
    e.home = sid;
    s.owner = e.id;
    if (!s.surv.includes(e.id)) s.surv.push(e.id);
    if (!s.seen.includes(e.id)) s.seen.push(e.id);
    s.anom = false;

    // ana gezegeni ırka uygun hale getir
    const race = RACES[e.race];
    let hw = s.planets.find(p => PLANETS[p.t].k==='hab');
    if (!hw){ hw = s.planets[0]; }
    hw.t = race.bio==='makine' ? 'mak' :
           (HAB_TYPES.filter(t=>PLANETS[t].ik===race.ik)[Math.floor(rnd()*3)%2] || 'oky');
    hw.sz = 18; hw.dep = 'bereket';
    hw.owner = e.id;
    hw.col = {
      pop: 12, stab: 60, grow: 0,
      b: {maden:2, santral:2, ciftlik:2, lab:1, dokum:1, fabrika:2, tersane:1, kale:0, liman:0},
      cap: 16, name: hw.name, f: 'yonetim', fcd: 0
    };
    e.colonies.push({s:sid, p:hw.i});
    const st = DIFFS[cfg.diff].start;
    if (!e.ai){ for (const k in e.res) e.res[k] = Math.round(e.res[k]*st); }

    // --- köken etkileri ---
    const org = e.origin || 'standart';
    if (org === 'kalinti'){
      e.res.ara += 900;
      hw.dep = 'kalinti';
      s.anom = true;
    } else if (org === 'kapali'){
      for (const k in e.res) e.res[k] = Math.round(e.res[k] * 1.25);
      hw.col.b.kale = 2;
      s.def = sysDefense(s);
      e.startPenalty = -25;
    } else if (org === 'gocebe'){
      hw.col.pop = 6;
      hw.col.b = {maden:1, santral:1, ciftlik:1, tersane:1};
      e.res.min = Math.round(e.res.min * 1.15);
      e.res.ala = Math.round(e.res.ala * 1.6);
    }
    else if (org === 'kusatilmis'){
      hw.col.b.kale = 2;
      s.def = sysDefense(s);
      e.res.ala = Math.round(e.res.ala * 1.4);
      e.siegedStart = true;
    } else if (org === 'son_umut'){
      hw.col.pop = 5;
      hw.col.b = {maden:1, santral:1, ciftlik:1, tersane:1};
      for (const k in e.res) e.res[k] = Math.round(e.res[k] * .45);
      // tüm 1. kademe teknolojiler bedava
      for (const tid in TECHS) if (TECHS[tid].t === 1) e.techs[tid] = true;
      recalcMods(e);
    } else if (org === 'altin_cag'){
      hw.col.pop = 18;
      hw.col.b = {maden:3, santral:3, ciftlik:3, lab:2, dokum:2, fabrika:2, tersane:2, liman:1};
      for (const k in e.res) e.res[k] = Math.round(e.res[k] * 1.5);
      e.startPenalty = -30;
      e.goldenAge = true;
    } else if (org === 'golgeden'){
      e.hidden = true;
      e.intel = {};
      for (const o of G.emps){
        if (o.id === e.id) continue;
        e.intel[o.id] = 1;                       // bir basamak önde başla
      }
    }
    if (hasCivic(e,'seedPop')) hw.col.pop += 2;
    if (hasCivic(e,'fortress')){ hw.col.b.kale = (hw.col.b.kale||0) + 1; s.def = sysDefense(s); }

    // komşu sistemleri gör
    s.lanes.forEach(l => { if(!G.sys[l].seen.includes(e.id)) G.sys[l].seen.push(e.id); });

    // başlangıç filoları
    const guardShips = (e.origin === 'gocebe')
      ? [{c:'kor'},{c:'kor'},{c:'kor'},{c:'kor'},{c:'kor'}]
      : [{c:'kor'},{c:'kor'},{c:'kor'}];
    newFleet(e, sid, guardShips, e.ai?null:'1. Muhafız Filosu');
    const sci1 = newFleet(e, sid, [{c:'bil'}], e.ai?null:'Kâşif Vela');
    if (!e.ai) sci1.auto = true;
    newFleet(e, sid, [{c:'kol'}], e.ai?null:'Yerleşim Konvoyu');
    if (e.origin === 'gocebe'){
      newFleet(e, sid, [{c:'kol'}], e.ai?null:'2. Yerleşim Konvoyu');
      newFleet(e, sid, [{c:'bil'}], e.ai?null:'Kâşif Nova');
    }
    if (e.origin === 'kusatilmis'){
      newFleet(e, sid, [{c:'kor'},{c:'kor'},{c:'muh'}], e.ai?null:'Kuşatma Kırıcı');
    }
    if (e.origin === 'altin_cag'){
      // komşu sistemlerde iki ek koloni
      let planted = 0;
      for (const l of s.lanes){
        if (planted >= 2) break;
        const sy2 = G.sys[l];
        if (sy2.owner >= 0) continue;
        const pl2 = sy2.planets.find(pp => PLANETS[pp.t].k === 'hab' && pp.owner < 0);
        if (!pl2) continue;
        pl2.owner = e.id;
        pl2.col = {pop:9, stab:60, grow:0, b:{maden:2, santral:2, ciftlik:1, fabrika:1},
                   cap:12, name:pl2.name, f:'sanayi', fcd:0};
        sy2.owner = e.id;
        e.colonies.push({s:sy2.id, p:pl2.i});
        planted++;
      }
      recalcMods(e);
    }
    recalcMods(e);
  });

  // ilk araştırmalar
  G.emps.forEach(e => {
    ['fiz','top','muh'].forEach(b => autoResearch(e,b));
  });

  // --- korsan yuvaları: anavatanlardan uzak, sahipsiz sistemlere ---
  const nestCount = Math.max(2, Math.round(G.sys.length / 18));
  const free = G.sys.filter(sy => sy.owner < 0 &&
    G.emps.every(em => em.wild || em.home < 0 || hopDist(em.home, sy.id, 2) > 2));
  shuffle(rnd, free);
  G.nests = [];
  for (let i = 0; i < Math.min(nestCount, free.length); i++){
    const sy = free[i];
    sy.nest = {hp: 900 + Math.floor(rnd()*500), timer: 60 + Math.floor(rnd()*120)};
    G.nests.push(sy.id);
    // yuvayı koruyan başlangıç filosu
    newFleet(wild, sy.id, [{c:'kor'},{c:'kor'},{c:'muh'}], 'Korsan Muhafızı');
  }

  // kayıp uygarlık kalıntıları ve kriz zamanlayıcısı
  if (typeof initRuins === 'function') initRuins(cfg, rnd);
  if (typeof initCrisis === 'function') initCrisis();

  // Gölgeden kökeni: hiç temas kurulmamış başlar
  for (const e of G.emps){
    if (e.origin !== 'golgeden') continue;
    for (const o of G.emps){
      if (o.id === e.id) continue;
      e.contact[o.id] = false; o.contact[e.id] = false;
    }
  }
  // Altın Çağ: kriz erken gelir
  for (const e of G.emps){
    if (e.goldenAge && G.crisis) G.crisis.at = Math.max(2216, G.crisis.at - 10);
  }

  // köken kaynaklı ilişki cezaları
  for (const e of G.emps){
    if (!e.startPenalty) continue;
    for (const o of G.emps){
      if (o.id === e.id) continue;
      e.rel[o.id] = clamp(e.rel[o.id] + e.startPenalty, -100, 100);
      o.rel[e.id] = clamp(o.rel[e.id] + e.startPenalty, -100, 100);
    }
  }
  // fraksiyonları kur
  for (const e of G.emps){
    if (e.wild) continue;
    if (typeof initFactions === 'function') initFactions(e);
    recalcMods(e);
  }
  updateVision();
  economyTick(true);
  return true;
}
/* =====================================================================
   SİMÜLASYON
   ===================================================================== */

/* ═══════════════════════════════════════════════════════════════════
   FAZ 21 — GÖRSEL EFEKT OBJE HAVUZU
   Muharebe sırasında saniyede onlarca efekt doğup ölüyordu; her biri
   yeni bir nesne sabiti ve her ölüm bir splice demekti. Çöp toplayıcı
   bunu düzenli aralıklarla temizlerken kare atlamaları oluyordu.
   Artık ölü efektler HAVUZDA bekletilip yeniden kullanılıyor:
   sıcak döngüde sıfır tahsis, sıfır splice.
   ═══════════════════════════════════════════════════════════════════ */
/* Korsan/yırtıcı filo tavanı — cihaz belleğini korur */
const WILD_FLEET_CAP = 24;

const FX_POOL = [];
const FX_MAX = 90;
const FX_POOL_MAX = 140;      // havuz tavanı — bellek şişmesin

function fx(o){
  if (!G.fx) G.fx = [];
  if (G.fx.length >= FX_MAX) return;
  /* Havuzdan geri dönüştür; yoksa yeni nesne (yalnız ilk turlarda) */
  const e = FX_POOL.pop() || {};
  e.k = o.k; e.x = o.x; e.y = o.y;
  e.life = o.life || 24;
  e.age = 0;
  e.c = o.c; e.r = o.r; e.dx = o.dx; e.dy = o.dy;
  e.dead = false;
  G.fx.push(e);
}

/* Ölü efektleri havuza iade et ve diziyi splice'sız sıkıştır.
   splice O(n) kaydırma yapıyordu; bu yerinde filtre O(n) tek geçiş. */
function fxCompact(){
  const arr = G.fx;
  if (!arr || !arr.length) return;
  let w = 0;
  for (let i = 0; i < arr.length; i++){
    const e = arr[i];
    if (e.dead){
      if (FX_POOL.length < FX_POOL_MAX) FX_POOL.push(e);
    } else {
      arr[w++] = e;
    }
  }
  arr.length = w;
}

function say(msg, cls){
  /* FAZ 19: bildirim sınıfı sesi belirler (savaş/zafer/keşif) */
  if (typeof AUDIO !== 'undefined') { try { AUDIO.forLog(cls); } catch(err){} }
  G.log.push({m:msg, c:cls||'', d:G.day});
  if (G.log.length > 60) G.log.shift();
  UI.alert(msg, cls);
}

/* ---------- filolar ---------- */
function newFleet(e, sysId, ships, name){
  const s = G.sys[sysId];
  const f = {
    id: G.nextFleet++, e: e.id, sys: sysId, x: s.x, y: s.y,
    ships: ships.map(o => ({c:o.c, h:1})),
    path: [], mv: null, ord: null, name: name || null,
    stance: 'agresif', combat: 0, surv: 0
  };
  if (!f.name) f.name = (e.ai?'':'') + fleetAutoName(e, f);
  G.fleets.push(f);
  return f;
}
function fleetAutoName(e, f){
  const r = f.ships[0] && SHIPS[f.ships[0].c].rol;
  const n = G.fleets.filter(x=>x.e===e.id).length + 1;
  if (r === 'bilim') return 'Araştırma ' + n;
  if (r === 'koloni') return 'Yerleşim ' + n;
  return n + '. Filo';
}
function empOf(f){ return G.emps[f.e]; }
/* filo ne yapıyor — arayüz ve harita etiketleri için tek kaynak */
function fleetStatus(f){
  if (!f.ships.length)             return {t:'YOK',     c:'id'};
  if (f.combat)                    return {t:'ÇATIŞMA', c:'ft'};
  if (f.surv > 0)                  return {t:'TARIYOR ' + Math.ceil(f.surv) + 'g', c:'wk'};
  if (f.ord && f.ord.t === 'kol'){
    const nm = G.sys[f.ord.s] ? G.sys[f.ord.s].name : '';
    return {t: (f.path.length || f.mv) ? 'YERLEŞİME GİDİYOR' : 'YERLEŞİYOR', c:'wk', d:nm};
  }
  if (f.mv || f.path.length){
    const dest = f.path.length ? G.sys[f.path[f.path.length-1]] : (f.mv ? G.sys[f.mv.to] : null);
    return {t:'YOLDA', c:'go', d: dest ? dest.name : ''};
  }
  if (fleetHasRole(f,'bilim'))     return {t:'BOŞTA · TARAMA BEKLİYOR', c:'id'};
  if (fleetHasRole(f,'koloni'))    return {t:'BOŞTA · HEDEF BEKLİYOR', c:'id'};
  return {t:'BEKLİYOR', c:'id'};
}
function fleetHealth(f){
  if (!f.ships.length) return 0;
  return f.ships.reduce((a,s)=>a+s.h, 0) / f.ships.length;
}
function isArmed(f){ return f.ships.some(s => SHIPS[s.c].dmg > 0); }
/* ═══ FAZ 22: TAARRUZ ORDUSU YARDIMCILARI ═══ */
function isTransport(f){ return !!f && f.ships.some(s => SHIPS[s.c].rol === 'ordu'); }
function isColossus(f){ return !!f && f.ships.some(s => SHIPS[s.c].rol === 'super'); }
/* Filodaki toplam kara gücü — gövde hasarıyla orantılı azalır */
function groundPower(f){
  if (!f || !f.ships) return 0;
  const e = G.emps[f.e];
  let g = 0;
  for (const sh of f.ships){
    const S = SHIPS[sh.c];
    if (!S.ground) continue;
    g += S.ground * (sh.h !== undefined ? sh.h : 1);
  }
  if (e && e.mods && e.mods.dmgMul) g *= (1 + e.mods.dmgMul * .6);
  if (e && typeof hasCivic === 'function'){
    if (hasCivic(e, 'warFury')) g *= 1.20;
    if (hasCivic(e, 'blood'))   g *= 1.15;
  }
  /* ═══ FAZ 53: KARA MUHAREBESİ FİZYOLOJİSİ ═══
     Kayaç türler taş etli: istila ve savunmada +%20 zırh.
     Kuş benzeri hafif kemikli: yüzeyde −%15 kırılgan. */
  if (e && typeof physioOf === 'function'){
    const ph = physioOf(e);
    if (ph){
      if (ph.groundArmor) g *= (1 + ph.groundArmor);
      if (ph.groundFrail) g *= (1 - ph.groundFrail);
    }
  }
  return Math.round(g);
}
function fleetHasRole(f, r){ return f.ships.some(s => SHIPS[s.c].rol === r); }
/* filo sınıfı: savaş mı sivil mi? birleştirme bunu ayırır */
function fleetGroup(f){
  return f.ships.some(s => SHIPS[s.c].dmg > 0) ? 'sav' : 'sivil';
}
/* belirli bir gemi türünü filodan ayırıp yeni filo kurar */
function splitType(e, f, cls, count){
  if (!f || f.sys < 0) return null;
  const taken = [];
  for (let i = f.ships.length - 1; i >= 0 && taken.length < count; i--){
    if (f.ships[i].c === cls) taken.push(f.ships.splice(i, 1)[0]);
  }
  if (!taken.length) return null;
  const nf = newFleet(e, f.sys, taken.map(s=>({c:s.c})));
  taken.forEach((s,i)=>{ if (nf.ships[i]) nf.ships[i].h = s.h; });
  nf.stance = f.stance;
  if (!f.ships.length) G.fleets = G.fleets.filter(x => x !== f);
  return nf;
}

function maxHull(cls, e){ return SHIPS[cls].hull * (1 + e.mods.hullMul); }
function fleetPower(f){
  const e = empOf(f); let p = 0;
  for (const s of f.ships){
    const d = SHIPS[s.c];
    p += d.dmg*(1+e.mods.dmgMul)*4 + d.hull*(1+e.mods.hullMul)*s.h*.5 + d.sh*(1+e.mods.shMul)*.6;
  }
  return Math.round(p);
}
/* ═══════════════════════════════════════════════════════════════════
   FAZ 23 — HIZLI İNTİKAL
   Taarruz ordusu, kendi savaş filosunun ZATEN bastırdığı bir hedefe
   gidiyorsa üç kat hızlanır. Gerekçe: yol açık, koridor güvenli,
   yörüngeden iniş noktası hazırlanmış.
   Bu, Faz 22'nin asıl sorununu çözüyor — ordular kalkan düştüğünde
   hâlâ yoldaydı ve bombardıman işi bitiriyordu.
   Yön bulma algoritması YOK; yalnız hız çarpanı.
   ═══════════════════════════════════════════════════════════════════ */
function fastDeployMul(f){
  if (!f || typeof isTransport !== 'function' || !isTransport(f)) return 1;
  /* Hedef: hareket halindeyse varış, değilse rota sonu */
  let hedef = -1;
  if (f.mv) hedef = f.mv.to;
  else if (f.path && f.path.length) hedef = f.path[f.path.length - 1];
  if (hedef < 0) return 1;

  const sys = G.sys[hedef];
  if (!sys) return 1;
  const e = G.emps[f.e];
  if (!e) return 1;
  /* Sistem sahipliği uzay muharebesiyle anında değişiyor; asıl
     ölçüt orada düşman GEZEGENİ olup olmadığı. */
  let dusmanGezegen = false;
  for (const pl of sys.planets){
    if (!pl.col || pl.owner < 0 || pl.owner === f.e) continue;
    if (e.war[pl.owner] || (G.emps[pl.owner] && G.emps[pl.owner].wild)){
      dusmanGezegen = true; break;
    }
  }
  if (!dusmanGezegen) return 1;

  /* Orada kendi savaş filom var mı? */
  let bastiran = false;
  for (const o of G.fleets){
    if (o.e !== f.e || o.sys !== hedef || !o.ships.length) continue;
    if (typeof isArmed === 'function' && isArmed(o)){ bastiran = true; break; }
  }
  if (!bastiran) return 1;

  /* Kalkan iniyor mu ya da inmiş mi? İniyorsa koridor açılıyor. */
  let hazir = false;
  for (const pl of sys.planets){
    if (!pl.col || pl.owner < 0 || pl.owner === f.e) continue;
    if (!e.war[pl.owner] && !(G.emps[pl.owner] && G.emps[pl.owner].wild)) continue;
    const cap = (typeof shieldCap === 'function')
      ? shieldCap(pl.col, G.emps[pl.owner], pl) : 100;
    if ((pl.col.shield || 0) <= Math.max(12, cap * .5)){ hazir = true; break; }
  }
  return hazir ? 3 : 1;
}

function fleetSpeed(f){
  const e = empOf(f);
  let sp = 99;
  for (const s of f.ships) sp = Math.min(sp, SHIPS[s.c].spd);
  const relay = (e.structs && e.structs.role > 0) ? .40 : 0;
  /* FAZ 31: Colossus sıçrama motoru — ateşleme emri aldığında ×3 */
  const jump = (f && f.jumpDrive) ? 3 : 1;
  return sp * 26 * (1 + e.mods.spdMul + relay) * fastDeployMul(f) * jump;
}
/* Kendi sınırları içindeki filolar yarı bakım öder — ikmal hatları kısa. */
function fleetInHome(e, f){
  const sid = f.sys >= 0 ? f.sys : (f.mv ? f.mv.to : -1);
  if (sid < 0) return false;
  const sys = G.sys[sid];
  if (sys.owner === e.id) return true;
  return claimOf(sys) === e.id;
}

/* ═══════════════════════════════════════════════════════════════════
   DERİN LOJİSTİK — İKMAL HATTI VE YIPRANMA
   Menzil sistemi genişletildi: bir filonun en yakın DOSTU sisteme
   kaç sıçrama uzakta olduğu ikmal seviyesini belirler. Hat koptukça
   bakım katlanır ve gemiler her ay erir.
   ═══════════════════════════════════════════════════════════════════ */
const SUPPLY_FREE  = 2;    // bu kadar sıçrama ücretsiz (ileri karakol payı)
const SUPPLY_LIMIT = 6;    // BFS tarama sınırı
const SUPPLY_STEP  = .15;  // FAZ 54: atlama başına ceza
const SUPPLY_FLOOR = .40;  // FAZ 54: taban güç (en fazla −%60)

/* Bir sistem bu imparatorluk için ikmal kaynağı sayılır mı?
   Kendi toprağı, müttefik toprağı, geçiş izni verilmiş bölge ve
   kendi uzay yapısı olan sistemler ikmal düğümüdür. */
function isSupplyNode(e, sys){
  if (!sys) return false;
  if (sys.owner === e.id) return true;
  if (typeof claimOf === 'function' && claimOf(sys) === e.id) return true;
  if (sys.owner >= 0){
    const o = G.emps[sys.owner];
    if (o && !o.dead){
      if (e.ally[o.id]) return true;                       // müttefik limanı
      if (o.passage && o.passage[e.id]) return true;       // geçiş izni ikmal sağlar
      if (typeof unityActive === 'function' && unityActive() &&
          typeof councilExists === 'function' && councilExists() &&
          G.council.members.includes(e.id) &&
          G.council.members.includes(o.id)) return true;   // Galaktik Odak
    }
  }
  /* Kendi uzay yapısı ileri üs sayılır */
  if (sys.built) for (const k in sys.built)
    if (sys.built[k] === e.id) return true;
  return false;
}

/* Filonun en yakın ikmal düğümüne sıçrama uzaklığı (BFS, sınırlı) */
function supplyDistance(e, f){
  const sid = f.sys >= 0 ? f.sys : (f.mv ? f.mv.to : -1);
  if (sid < 0) return 0;
  if (isSupplyNode(e, G.sys[sid])) return 0;
  const gorulen = new Set([sid]);
  let sinir = [sid];
  for (let d = 1; d <= SUPPLY_LIMIT + 1; d++){
    const sonraki = [];
    for (const id of sinir){
      for (const l of G.sys[id].lanes){
        if (gorulen.has(l)) continue;
        gorulen.add(l);
        if (isSupplyNode(e, G.sys[l])) return d;
        sonraki.push(l);
      }
    }
    if (!sonraki.length) break;
    sinir = sonraki;
  }
  return SUPPLY_LIMIT + 2;
}

/* 1 = tam ikmal … 0 = hat tamamen kopuk */
function fleetSupply(e, f){
  if (!f || !f.ships || !f.ships.length) return 1;
  /* ═══ FAZ 59: LOJİSTİK HACK ═══
     Hacklenmiş sistemdeki filo tedarik tabanına düşer — hattın
     içinde olsa bile ikmal alamaz. */
  const bs = f.sys >= 0 ? G.sys[f.sys] : null;
  if (bs && bs.supplyHack && bs.supplyHack > (G.memAge || 0) &&
      bs.supplyHackBy !== f.e)
    return SUPPLY_FLOOR;
  const d = supplyDistance(e, f);
  if (d <= SUPPLY_FREE) return 1;
  /* ═══ FAZ 54: KADEMELİ CEZA ═══
     Eski formül SUPPLY_LIMIT'te sıfıra iniyordu — filo tamamen
     işlevsiz kalıyordu. Artık atlama başına −%15, taban %40:
     uzaktaki ordu zayıflar ama savaşamaz hâle gelmez.
       2 atlama → %100 · 3 → %85 · 4 → %70 · 5 → %55 · 6+ → %40 */
  const asim = d - SUPPLY_FREE;
  return clamp(1 - asim * SUPPLY_STEP, SUPPLY_FLOOR, 1);
}

/* Aylık yıpranma: ikmalsiz filo erir. Gövde bazlı, orantısal. */
function attritionTick(){
  for (const f of G.fleets){
    if (!f.ships || !f.ships.length) continue;
    const e = G.emps[f.e];
    if (!e || e.dead) continue;
    if (e.wild || e.crisisSide) continue;          // kriz/korsan lojistik tanımaz

    const sup = fleetSupply(e, f);
    f.supply = sup;
    if (sup >= 1) continue;

    /* Kayıp oranı hattın kopukluğuyla orantılı: %1 … %9 / ay */
    let oran = (1 - sup) * .09;
    /* Göçebe Filosu bir KÖKEN'dir (e.origin), civic değil — hasCivic
       ile sorgulanınca hiç eşleşmiyordu ve bu köken hiçbir yıpranma
       direnci sağlamıyordu. Kökeni yıldızlar arasında geçen bir halk
       ikmalsizliğe doğal olarak dayanıklı olmalı. */
    if (e.origin === 'gocebe') oran *= .5;
    if (typeof hasCivic === 'function' && hasCivic(e, 'mobilize')) oran *= .8;
    if (e.mods && e.mods.hullMul) oran /= (1 + e.mods.hullMul * .5);

    /* sh.h 0–1 arası ORANDIR (mutlak gövde değil); doğrudan azaltılır.
       Gövde teknolojisi dayanıklılık kazandırır. */
    let kayip = 0;
    for (let i = f.ships.length - 1; i >= 0; i--){
      const sh = f.ships[i];
      sh.h -= oran;
      if (sh.h <= .06){ f.ships.splice(i, 1); kayip++; }
    }
    if (kayip && f.e === 0)
      say('İKMAL KOPUK — ' + esc(f.name) + ' filosunda ' + kayip + ' gemi kaybedildi', 'war');
    if (!f.ships.length){
      if (f.e === 0) say(esc(f.name) + ' filosu ikmalsizlikten dağıldı', 'war');
      G.fleets = G.fleets.filter(x => x !== f);
    }
  }
}
/* Filonun ALAŞIM bakımı — Faz 8 dengelemesi.
   Alaşım bollaştığı için filolar şişiyordu; artık donanma yalnız
   enerji değil sürekli alaşım da yer (yedek parça, tersane bakımı). */
function fleetAlloyUpkeep(e){
  let a = 0;
  for (const f of G.fleets){
    if (f.e !== e.id || !f.ships.length) continue;
    const sup = (typeof fleetSupply === 'function') ? fleetSupply(e, f) : 1;
    const lojistik = 1 + (1 - sup) * 1.4;
    for (const s of f.ships) a += (SHIPS[s.c].upA || 0) * lojistik;
  }
  return a * (1 + (e.mods.upMul || 0));
}
function fleetUpkeep(e){
  let u = 0;
  // civic ve savaş durumu döngü içinde değil, bir kez hesaplanır
  let mobMul = 1;
  if (hasCivic(e,'mobilize')){
    const atWar = Object.keys(e.war||{}).some(k => e.war[k]);
    if (!atWar) mobMul = 2;                       // barışta ağır seferberlik yükü
  }
  for (const f of G.fleets){
    if (f.e !== e.id || !f.ships.length) continue;
    /* İKMAL HATTI: hat uzadıkça bakım katlanır (×0.5 … ×3.2) */
    const sup = (typeof fleetSupply === 'function') ? fleetSupply(e, f) : 1;
    const lojistik = 1 + (1 - sup) * 2.2;
    const mul = (fleetInHome(e, f) ? .5 : 1) * mobMul * lojistik;
    for (const s of f.ships) u += SHIPS[s.c].up * mul;
  }
  return u * (1 + e.mods.upMul);
}
function fleetUsage(e){
  let u = 0;
  for (const f of G.fleets){
    if (f.e !== e.id) continue;
    /* FAZ 49: federal donanma kapasiteden SAYILMAZ — bakımı
       federasyon fonundan karşılanır, komutası başkandadır. */
    if (f.federal) continue;
    for (const s of f.ships) u += SHIPS[s.c].sz;
  }
  return u;
}

/* ---------- yol bulma ---------- */
/* ═══════════════════════════════════════════════════════════════════
   FAZ 47 — YILDIZ KAPISI AĞI
   Kapı sahibi devletlerin sistemleri toplanır. Bir kapı yalnızca
   yolcu devletin KENDİ kapısı, müttefikinin kapısı ya da sınırı
   açık bir devletin kapısıysa kullanılabilir.
   ═══════════════════════════════════════════════════════════════════ */
function gateNetwork(traveler){
  /* FAZ 53: yıldız kapıları kapalıysa ağ hiç kurulmaz */
  if (G.cfg && G.cfg.gates === false) return {list:[], ok:()=>false};
  if (!G._structIdx) return {list:[], ok:()=>false};
  const izin = {};
  for (const oid in G._structIdx){
    const b = G._structIdx[oid];
    if (!b.gate || !b.gate.length) continue;
    const id = +oid;
    let acik = false;
    if (!traveler) acik = false;
    else if (id === traveler.id) acik = true;
    else {
      const o = G.emps[id];
      if (o && !o.dead && !o.wild && !o.crisisSide){
        if (traveler.war[id]) acik = false;
        else if (traveler.ally && traveler.ally[id]) acik = true;
        else if (traveler.passage && traveler.passage[id]) acik = true;
        else if (typeof isVassal === 'function' &&
                 ((isVassal(o) && o.overlord === traveler.id) ||
                  (isVassal(traveler) && traveler.overlord === id))) acik = true;
      }
    }
    if (acik) for (const sid of b.gate) izin[sid] = 1;
  }
  const list = Object.keys(izin).map(Number);
  return {list, ok:(sid)=>!!izin[sid]};
}

/* ═══ FAZ 47: OTOMATİK ÇÖZÜM YARDIMCILARI ═══ */
/* ÖLÇÜM: gerçek EVENTS kategorileri {megayapi, dogal, sinyal, kalinti}.
   'eko/ekonomi' diye bir kategori yokmuş — varsayımla yazmıştım.
   Otomatik çözülebilenler: doğal olaylar, sinyaller, kalıntılar.
   Megayapı olayları oyuncuya bırakılır (stratejik karar). */
const AUTO_SAFE_KINDS = {dogal:1, sinyal:1, kalinti:1};
/* FAZ 58: EVENTS dizisindeki 5 rastgele olayın hiçbirinde 'k'
   alanı yok; autoSolvable onları hep reddediyordu, yani "rastgele
   galaktik olaylar" oto-geç kapsamına HİÇ girmiyordu. Bu dizinin
   tamamı sıradan iç işleyiş olayı (bütçe talebi, grev, göçmen
   filosu) olduğu için kimliği id önekinden tanınıyor. */
function isRandomEvent(ev){
  return !!(ev && typeof ev.id === 'string' && /^e\d+$/.test(ev.id));
}

function autoSolvable(ev){
  if (!ev) return false;
  /* FAZ 58: rastgele galaktik olaylar da kapsamda */
  if (isRandomEvent(ev)) return true;
  /* Kriz/savaş kategorileri asla otomatik çözülmez */
  if (ev.k && !AUTO_SAFE_KINDS[ev.k]) return false;
  if (!ev.k) return false;
  /* Metinde varoluşsal uyarı varsa oyuncuya sor */
  const t = ((ev.n || '') + ' ' + (ev.t || '')).toLowerCase();
  if (/savaş|kriz|isyan|filo|saldır|ölüm|yok ol/.test(t)) return false;
  return true;
}

/* En güvenli şık: 'riskli' etiketi olmayan, en az kaynak isteyen */
function safestChoice(ev){
  let en = -1, enSkor = 1e9;
  for (let i = 0; i < ev.ch.length; i++){
    const c = ev.ch[i];
    const d = (c.d || '').toLowerCase();
    const t2 = (c.t || '').toLowerCase();
    /* Riskli şıklar elenir */
    if (/riskli|tehlike|kumar|zorla/.test(d + ' ' + t2)) continue;
    /* Maliyet: açıklamadaki eksi sayıların toplamı */
    let maliyet = 0;
    const m = (c.d || '').match(/[−-]\s?(\d+)/g);
    if (m) for (const x of m) maliyet += parseInt(x.replace(/[^\d]/g, ''), 10) || 0;
    if (maliyet < enSkor){ enSkor = maliyet; en = i; }
  }
  return en;
}

function findPath(from, to, traveler){
  if (from === to) return [];
  const gw = traveler ? gateNetwork(traveler) : null;
  const gateList = gw ? gw.list : null;
  const gateOk = gw ? gw.ok : (()=>false);
  const dd = new Array(G.sys.length).fill(Infinity);
  const prev = new Array(G.sys.length).fill(-1);
  const vis = new Array(G.sys.length).fill(false);
  dd[from] = 0;
  for (let k=0;k<G.sys.length;k++){
    let u = -1, best = Infinity;
    for (let i=0;i<G.sys.length;i++) if (!vis[i] && dd[i] < best){ best = dd[i]; u = i; }
    if (u < 0) break;
    if (u === to) break;
    vis[u] = true;
    for (const v of G.sys[u].lanes){
      /* FAZ 37: radyasyonlu sistem 4 kat pahalı sayılır — yön bulma
         mümkünse kaçınır, ama tek yol oysa yine de geçer (tıkanma
         olmaz). Hedefin kendisiyse ceza uygulanmaz. */
      const rad = (G.sys[v].radiation && v !== to) ? 4 : 1;
      const nd = dd[u] + dist(G.sys[u], G.sys[v]) * rad;
      if (nd < dd[v]){ dd[v] = nd; prev[v] = u; }
    }
    /* ═══ FAZ 47: YILDIZ KAPISI SANAL HİPER YOLLARI ═══
       Aktif kapılar arası neredeyse bedava (0.1 maliyet). Güvenlik
       kilidi: yalnız KENDİ, müttefik ya da sınırı açık devletlerin
       kapıları kullanılabilir — düşman kapısı kapalıdır. */
    if (gateList && gateList.length && gateOk(u)){
      for (const v2 of gateList){
        if (v2 === u || !gateOk(v2)) continue;
        const nd2 = dd[u] + 0.1;
        if (nd2 < dd[v2]){ dd[v2] = nd2; prev[v2] = u; }
      }
    }
  }
  if (dd[to] === Infinity) return null;
  const path = []; let c = to;
  while (c !== from && c >= 0){ path.unshift(c); c = prev[c]; }
  return path;
}

/* Sınır geçiş hakkı: bilim ve inşaat gemileri serbest, savaş ve
   koloni filoları izin ister. İzin müzakereden alınır. */
function canEnter(e, sys){
  if (!sys) return false;
  // vahşi taraflar (korsan, canavar, kriz sürüsü) sınır tanımaz
  if (e && (e.wild || e.crisisSide)) return true;
  const owner = sys.owner >= 0 ? sys.owner : claimOf(sys);
  if (owner < 0 || owner === e.id) return true;
  const o = G.emps[owner];
  if (!o || o.dead) return true;
  if (e.war[owner]) return true;                    // savaştaysan zaten girersin
  if (e.ally[owner]) return true;                   // müttefik sınırı açıktır
  if (hasCivic(o, 'openborder')) return true;       // Açık Sınırlar doktrini
  if (o.passage && o.passage[e.id]) return true;    // verilmiş geçiş izni
  return false;
}
function fleetNeedsPass(f){
  /* Yalnızca SİLAHLI filolar geçiş izni ister. Bilim, inşaat ve
     koloni gemileri sivildir ve serbest dolaşır — aksi hâlde
     sınırlar kesişince kimse genişleyemiyordu. */
  return f.ships.some(s => SHIPS[s.c].dmg > 0);
}
function pathAllowed(e, f, path){
  if (!fleetNeedsPass(f)) return true;
  /* GERİ ÇEKİLME KORİDORU: ikmali kesilmiş, dağılmakta olan bir filo
     kendi bölgesine dönerken sınırlardan geçebilir. Kimse savaşacak
     hâli kalmamış bir orduyu durdurmaz — ve durdurmak, filoyu yabancı
     toprakta yok olmaya mahkûm ederdi. */
  if (f && f.retreating) return true;
  for (const id of path) if (!canEnter(e, G.sys[id])) return false;
  return true;
}
function orderMove(f, target, append){
  const start = f.path.length ? f.path[f.path.length-1] : (f.mv ? f.mv.to : f.sys);
  if (!append) f.path = [];
  const from = append ? start : (f.mv ? f.mv.to : f.sys);
  /* FAZ 47: kapı ağı yolcuya göre değişir — kendi/müttefik/açık
     sınır kapıları kısayol, düşman kapıları kapalı. */
  let p = findPath(from, target, empOf(f));
  if (!p) return false;
  const e = empOf(f);
  if (e && !pathAllowed(e, f, p)){
    // kısa yol kapalı — yalnızca girebildiğimiz sistemlerden geçen rota ara
    const alt = findPathAllowed(e, f, from, target);
    if (alt){
      p = alt;
      if (f.e === 0) say('Kapalı sınır aşıldı — filon uzun yoldan gidiyor');
    } else {
      if (f.e === 0) say('Rota kapalı: yabancı bölgeden geçiş izni gerekli', 'war');
      return false;
    }
  }
  f.path = append ? f.path.concat(p) : p;
  return true;
}
/* yalnız girilebilir sistemlerden geçen en kısa yol (Dijkstra) */
function findPathAllowed(e, f, from, to){
  if (from === to) return [];
  const N = G.sys.length;
  const dd = new Array(N).fill(Infinity);
  const prev = new Array(N).fill(-1);
  const vis = new Array(N).fill(false);
  dd[from] = 0;
  for (let k = 0; k < N; k++){
    let u = -1, best = Infinity;
    for (let i = 0; i < N; i++) if (!vis[i] && dd[i] < best){ best = dd[i]; u = i; }
    if (u < 0) break;
    if (u === to) break;
    vis[u] = true;
    for (const v of G.sys[u].lanes){
      // hedefe girmek serbest (saldırı/varış), ara duraklar izinli olmalı
      if (v !== to && !canEnter(e, G.sys[v])) continue;
      const nd = dd[u] + dist(G.sys[u], G.sys[v]);
      if (nd < dd[v]){ dd[v] = nd; prev[v] = u; }
    }
  }
  if (dd[to] === Infinity) return null;
  const path = []; let c = to;
  while (c !== from && c >= 0){ path.unshift(c); c = prev[c]; }
  return path;
}

/* ---------- görüş ---------- */
function updateVision(){
  if (hasCivic(G.p,'panopt')){
    G.vis = new Set(G.sys.map(s=>s.id));
    for (const s of G.sys) if (!s.seen.includes(0)) s.seen.push(0);
    return;
  }
  const sensor = 1 + (G.p.mods.sensor|0);
  const front = [];
  for (const s of G.sys){
    if (s.owner === 0) front.push({id:s.id, d:0});
  }
  for (const f of G.fleets) if (f.e === 0 && f.sys >= 0) front.push({id:f.sys, d:0});
  const seen = new Set();
  const q = front.slice();
  while (q.length){
    const {id,d} = q.shift();
    if (seen.has(id) && d>0) continue;
    seen.add(id);
    if (d < sensor) for (const l of G.sys[id].lanes) if (!seen.has(l)) q.push({id:l, d:d+1});
  }
  G.vis = seen;
  /* FAZ 48: paylaşım paktı olan devletlerin görüşünü de topla.
     Ayda bir hesaplanır, her karede taranmaz. */
  const sv = G.p && G.p.shareVis;
  if (sv){
    const paylas = new Set();
    for (const id in sv){
      if (!sv[id]) continue;
      const o = G.emps[id];
      if (!o || o.dead) continue;
      /* Ortağın kolonileri ve filoları çevresi */
      for (const c of (o.colonies || [])) paylas.add(c.s);
      for (const f of G.fleets){
        if (f.e !== o.id || !f.ships.length) continue;
        const sid = f.sys >= 0 ? f.sys : (f.mv ? f.mv.to : -1);
        if (sid >= 0){
          paylas.add(sid);
          const sy = G.sys[sid];
          if (sy) for (const l of sy.lanes) paylas.add(l);
        }
      }
    }
    G._shareVisSet = paylas;
  } else G._shareVisSet = null;
  for (const id of seen) if (!G.sys[id].seen.includes(0)) G.sys[id].seen.push(0);
}
/* ═══ FAZ 48: İSTİHBARAT PAYLAŞIMI ═══
   Paylaşım paktı olan devletlerin keşifleri ve görüşü oyuncunun
   haritasına kopyalanır — savaş sisi ortak açılır. */
function pSeen(s){
  if (s.seen.includes(0)) return true;
  const sv = G.p && G.p.shareVis;
  if (sv) for (const id in sv) if (sv[id] && s.seen.includes(+id)) return true;
  return false;
}
function pVis(s){
  if (G.vis && G.vis.has(s.id)) return true;
  const sv = G.p && G.p.shareVis;
  if (sv && G._shareVisSet) return G._shareVisSet.has(s.id);
  return false;
}
function pSurv(s){ return s.surv.includes(0); }
function sysDefense(sys){
  let d = 0;
  for (const p of sys.planets) if (p.col){
    d += (p.col.b.kale||0) * 180;
    d += (focusOf(p.col).e.defFlat || 0);
  }
  if (typeof structDefense === 'function') d += structDefense(sys);
  if (sys.nest) d += Math.max(0, sys.nest.hp) * .25;      // korsan yuvası savunma sayılır
  if (typeof ruinDefense === 'function') d += ruinDefense(sys);
  if (typeof planetTrait === 'function'){
    let bonus = 0;
    for (const p of sys.planets) if (p.col){
      const pt = planetTrait(p.col);
      if (pt && pt.def) bonus += pt.def;
    }
    if (bonus) d *= (1 + bonus);
  }
  if (d && sys.owner >= 0 && G.emps[sys.owner] && hasCivic(G.emps[sys.owner],'fortress')) d *= 1.5;
  return Math.round(d);
}

/* ---------- keşif / anomali ---------- */
function doSurvey(f, sys){
  const e = empOf(f);
  if (!sys.surv.includes(e.id)) sys.surv.push(e.id);
  if (sys.anom && !e.ai){
    sys.anom = false;
    /* Haritada gösterilen TÜRE uyan bir anomali seçilir — vaat
       edilen şeyle karşılaşılan şey tutarlı olsun. */
    const havuz = ANOMALIES.filter(x => !sys.anomK || x.k === sys.anomK);
    const a = (havuz.length ? havuz : ANOMALIES)[Math.floor(rnd() * (havuz.length || ANOMALIES.length))];
    UI.anomaly(a, sys);
  } else if (sys.anom && e.ai){
    sys.anom = false;
    /* FAZ 17: AI de gerçekten keşfeder. Türe göre farklı ödül alır,
       ve riskli seçimlerde bazen zarar görür — düz +120 değil. */
    const k = sys.anomK || 'sinyal';
    const prof = (typeof aiProfile === 'function') ? aiProfile(e) : {sci:.5, eco:.5, war:.5};
    const atak = prof.war * .5 + prof.eco * .3;      // riskli seçim eğilimi
    let odul = '';
    if (k === 'kalinti'){
      if (rnd() < .30 + atak * .35){
        e.res.min += 520; odul = 'kalıntı yağmaladı';
        if (rnd() < .30){                             // mühür kırıldı
          for (const c of e.colonies){
            const pl = G.sys[c.s].planets[c.p];
            if (pl.col) pl.col.stab = clamp(pl.col.stab - 12, 0, 100);
          }
          odul = 'kalıntıyı uyandırdı';
        }
      } else { e.res.ara += 200; odul = 'kalıntıyı inceledi'; }
    } else if (k === 'megayapi'){
      if (rnd() < .25 + atak * .30){
        e.res.min += 640; e.res.ala += 70; odul = 'megayapıyı söktü';
      } else { e.res.ara += 280; e.res.ala += 40; odul = 'megayapıyı inceledi'; }
    } else if (k === 'dogal'){
      e.res.ara += 180 + Math.round(prof.sci * 160); odul = 'olguyu ölçtü';
    } else {
      e.res.ara += 150; e.res.etk += 30; odul = 'sinyali çözdü';
      if (rnd() < .12 * (1 + atak)){                  // sinyale yanıt verdi
        for (const o of G.emps){
          if (o.dead || o.wild || o.id === e.id || !o.contact[e.id]) continue;
          o.rel[e.id] = clamp(o.rel[e.id] - 10, -100, 100);
        }
        odul = 'sinyale yanıt verdi — konumu ifşa oldu';
      }
    }
    /* Oyuncu görüyorsa haberdar olsun: galakside keşif yarışı var */
    if (typeof pSeen === 'function' && pSeen(sys))
      say(e.name + ' ' + sys.name + ' anomalisini araştırdı — ' + odul, 'sci');
  } else if (!e.ai){
    say(sys.name + ' taraması tamamlandı', 'sci');
  }
}

/* ---------- hareket & günlük döngü ---------- */
function stepFleets(dt){
  for (let i=G.fleets.length-1;i>=0;i--){
    const f = G.fleets[i];
    if (!f.ships.length){ G.fleets.splice(i,1); continue; }
    if (f.combat > 0) continue;

    // tarama görevi
    if (f.surv > 0){
      f.surv -= dt;
      if (f.surv <= 0){ f.surv = 0; doSurvey(f, G.sys[f.sys]); }
      continue;
    }

    if (!f.mv && f.path.length){
      const nxt = f.path[0];
      if (G.sys[f.sys].lanes.includes(nxt)) f.mv = {from:f.sys, to:nxt, t:0};
      else { const p = findPath(f.sys, nxt, empOf(f)); if (p) f.path = p.concat(f.path.slice(1)); else f.path = []; }
    }
    if (f.mv){
      const a = G.sys[f.mv.from], b = G.sys[f.mv.to];
      const len = dist(a,b);
      f.mv.t += fleetSpeed(f)*dt/len;
      if (f.mv.t >= 1){
        f.sys = f.mv.to;
        /* FAZ 48: ikmal filosu hedefe vardı — ana filoya katıl */
        if (f.joinFleet !== undefined){
          const ana = G.fleets.find(x => x.id === f.joinFleet &&
            x.ships.length && x.sys === f.sys && !x.combat);
          if (ana && ana !== f){
            ana.ships.push(...f.ships);
            f.ships.length = 0;
            if (empOf(f) && !empOf(f).ai)
              say('İkmal ' + (ana.name || 'filoya') + ' katıldı');
          }
          delete f.joinFleet; delete f.rallyTo;
        } f.mv = null; f.path.shift();
        arrive(f, G.sys[f.sys]);
      } else {
        f.x = lerp(a.x,b.x,f.mv.t); f.y = lerp(a.y,b.y,f.mv.t);
        f.sys = -1;
      }
    } else if (f.sys >= 0){
      f.x = G.sys[f.sys].x; f.y = G.sys[f.sys].y;
    }
  }
}

/* Otomatik keşif: boşta kalan bilim gemisi en yakın taranmamış
   güvenli sisteme kendiliğinden gider. */
function autoExploreTick(){
  for (const f of G.fleets){
    if (f.e !== 0 || !f.auto) continue;
    if (!fleetHasRole(f, 'bilim')) continue;
    if (f.combat || f.surv > 0 || f.path.length || f.mv || f.sys < 0) continue;
    const e = G.p;
    let best = null;
    for (const sy of G.sys){
      if (sy.surv.includes(0)) continue;
      // savaş hâlindeki rakibin bölgesine ve kalıntı/yuvaya girme
      if (sy.owner >= 0 && sy.owner !== 0 && e.war[sy.owner]) continue;
      if (sy.ruin || sy.nest) continue;
      const claim = claimOf(sy);
      if (claim >= 0 && claim !== 0 && e.war[claim]) continue;
      const d = dist(G.sys[f.sys], sy);
      if (!best || d < best.d) best = {sy, d};
    }
    if (best){
      orderMove(f, best.sy.id);
      f.ord = null;
    } else {
      f.auto = false;
      say(esc(f.name) + ' taranacak yer bulamadı — otomatik keşif kapandı');
    }
  }
}

function arrive(f, sys){
  const e = empOf(f);
  if (!sys.seen.includes(e.id)) sys.seen.push(e.id);
  // ilk temas
  for (const o of G.emps){
    if (o.id === e.id || o.dead) continue;
    const there = sys.owner === o.id || G.fleets.some(x=>x.e===o.id && x.sys===sys.id);
    if (there && !e.contact[o.id]){
      e.contact[o.id] = true; o.contact[e.id] = true;
      if (!e.ai) say('İlk temas: ' + o.name, 'sci');
    }
  }
  if (f.path.length) return;
  // görev tamamlama
  if (f.ord && f.ord.t === 'kol' && f.ord.s === sys.id){
    const pl = sys.planets[f.ord.p];
    if (pl && canColonize(e, sys, pl)){
      doColonize(e, sys, pl);
      f.ships = f.ships.filter(s => s.c !== 'kol');
      if (!f.ships.length){ G.fleets = G.fleets.filter(x=>x!==f); return; }
    }
    f.ord = null;
  }
  if (fleetHasRole(f,'bilim') && !sys.surv.includes(e.id)) f.surv = hasCivic(e,'scan') ? 17 : 29;
}

function dailyTick(dt){
  stepFleets(dt);
  // tersane kuyrukları
  for (const sys of G.sys){
    if (!sys.queue.length) continue;
    const slots = yardCount(sys);
    if (slots <= 0) continue;                 // tersane yıkıldıysa üretim durur
    // her tersane ayrı bir gemi üzerinde çalışır
    for (let qi = 0; qi < Math.min(slots, sys.queue.length); qi++) sys.queue[qi].left -= dt;
    const doneIdx = [];
    for (let qi = 0; qi < Math.min(slots, sys.queue.length); qi++)
      if (sys.queue[qi].left <= 0) doneIdx.push(qi);
    for (let d = doneIdx.length - 1; d >= 0; d--){
      const q = sys.queue[doneIdx[d]];
      sys.queue.splice(doneIdx[d], 1);
      const e = G.emps[q.e];
      if (e && !e.dead && sys.owner === e.id){
        const grp = c => SHIPS[c].rol === 'sav' ? 'sav' : SHIPS[c].rol;
        let host = G.fleets.find(f => f.e===e.id && f.sys===sys.id && !f.combat && f.ships.length &&
          grp(f.ships[0].c) === grp(q.cls) && f.ships.length < 24);
        /* ═══ FAZ 48: İKMAL VE TOPLANMA NOKTASI ═══
           Sistemde bu devlete ait bir rally kaydı varsa gemi
           doğrudan hedefe yollanır; ikmal siparişiyse belirtilen
           filoya katılmak üzere yola çıkar. */
        const ral = sys.rally && sys.rally[e.id];
        if (ral){
          /* İkmal hedefi filo ise ve o filo hâlâ buradaysa doğrudan kat */
          const hedefFilo = ral.fleet !== undefined
            ? G.fleets.find(f2 => f2.id === ral.fleet && f2.ships.length) : null;
          if (hedefFilo && hedefFilo.sys === sys.id){
            hedefFilo.ships.push({c:q.cls, h:1});
          } else {
            const nf3 = newFleet(e, sys.id, [{c:q.cls}]);
            const varis = (hedefFilo && hedefFilo.sys >= 0) ? hedefFilo.sys : ral.sys;
            if (varis !== undefined && varis !== sys.id &&
                typeof orderMove === 'function'){
              orderMove(nf3, varis);
              nf3.rallyTo = varis;
              nf3.joinFleet = ral.fleet;
            }
          }
          if (!e.ai) say(SHIPS[q.cls].n + ' hazır — ' + sys.name + ' · toplanma noktasına sevk');
        }
        else if (host) host.ships.push({c:q.cls, h:1});
        else {
          const nf2 = newFleet(e, sys.id, [{c:q.cls}]);
          if (!e.ai && SHIPS[q.cls].rol === 'bilim') nf2.auto = true;
        }
        if (!e.ai && !ral) say(SHIPS[q.cls].n + ' hazır — ' + sys.name);
      }
    }
  }
  combatTick(dt);
}

/* ---------- TİCARET SAVAŞI ----------
   Rota üzerindeki düşman veya korsan filoları kervan yağmalar:
   rota bir süre kapanır, yağmalayan ganimet alır. */
function raidTick(){
  /* FAZ 53: korsan tehdidi kapalıysa hiç yağma olmaz */
  if (G.cfg && G.cfg.pirates === false) return;
  G.raids = G.raids || {};
  /* ═══ FAZ 28 OPTİMİZASYONU ═══
     Profil: monthTick 23.7 ms, içinde raidTick 4.2 ms (2. sırada).
     Üç iç içe döngü vardı: imparatorluk × ticaret hattı × TÜM FİLOLAR,
     her kombinasyonda isArmed() ve hypot(). 73 filo × ~40 hat = 2900+
     mesafe hesabı/ay.
     Çözüm: silahlı filolar bir kez süzülüp önbelleğe alınıyor;
     hypot yerine kareli mesafe (karekök yok); mesafe testi
     isArmed'dan ÖNCE yapılıyor. */
  const armed = [];
  for (const f of G.fleets){
    if (f.combat || !f.ships.length) continue;
    if (!isArmed(f)) continue;
    armed.push(f);
  }
  if (!armed.length) return;
  const R2 = 320 * 320;

  for (const e of G.emps){
    if (e.dead || e.wild || !e.trade || !e.trade.links) continue;
    for (const L of e.trade.links){
      if (L.bl && !L.raided) continue;                 // zaten kesik
      const mx = (G.sys[L.a].x + G.sys[L.b].x)/2, my = (G.sys[L.a].y + G.sys[L.b].y)/2;
      const mid = {x:mx, y:my};
      for (const f of armed){
        if (f.e === e.id) continue;
        const dx = f.x - mx, dy = f.y - my;
        if (dx*dx + dy*dy > R2) continue;              // karekök yok
        const hostileF = e.war[f.e] || (G.emps[f.e] && G.emps[f.e].wild);
        if (!hostileF) continue;
        if (rnd() > .16) continue;
        // yağma!
        G.raids[L.key] = G.day + 90 + Math.floor(rnd()*120);
        const loot = Math.round(30 + L.vol * 1.6);
        const raider = G.emps[f.e];
        if (raider){ raider.res.ene += loot; raider.res.min += Math.round(loot*.4); }
        e.res.ene = Math.max(0, e.res.ene - loot);
        fx({k:'boom', x:mid.x, y:mid.y, life:30});
        if (typeof remember === 'function' && G.emps[f.e] && !G.emps[f.e].wild)
          remember(e, f.e, 'kervanYagma');
        if (e.id === 0) say('KERVAN YAĞMALANDI — ' + G.sys[L.a].name + '↔' + G.sys[L.b].name + ' (−' + loot + ' enerji)', 'war');
        else if (f.e === 0) say('Kervan yağmalandı: +' + loot + ' enerji ganimet', 'win');
        break;
      }
    }
  }
  // süresi dolan yağmalar temizlenir
  for (const k in G.raids) if (G.raids[k] <= G.day) delete G.raids[k];
}

/* ---------- muharebe ---------- */
/* görünür çatışma sayısı — arayüz uyarısı için */
function battleCount(){
  let n = 0;
  for (const s of G.sys) if (s.cr > 0 && s.seen.includes(0)) n++;
  return n;
}
function hostile(a, b){
  if (a === b) return false;
  return G.emps[a].war[b];
}
function combatTick(dt){
  const bySys = {};
  for (const f of G.fleets){
    if (f.sys < 0) continue;
    (bySys[f.sys] = bySys[f.sys] || []).push(f);
  }
  let dirty = false;
  for (const sid in bySys){
    const sys = G.sys[sid], list = bySys[sid];
    const emps = [...new Set(list.map(f=>f.e))];
    let A = null, B = null;
    outer:
    for (const a of emps) for (const b of emps) if (hostile(a,b)){ A=a; B=b; break outer; }
    // sistem savunması
    const def = sysDefense(sys);
    if (A === null && sys.owner >= 0){
      for (const a of emps) if (hostile(a, sys.owner) && def > 0){ A = a; B = sys.owner; break; }
    }
    // kayıp uygarlık kalıntısı: silahlı filo girince uyanır ve savaşır
    if (A === null && sys.ruin && sys.ruin.hp > 0 && G.wildId !== undefined){
      for (const a of emps){
        if (a === G.wildId) continue;
        if (!list.some(f => f.e === a && isArmed(f))) continue;
        sys.ruin.awake = true;
        A = a; B = G.wildId;
        break;
      }
    }
    // korsan yuvası: sahipsiz sistemde bile kuşatılabilir
    if (A === null && sys.nest && sys.nest.hp > 0 && G.wildId !== undefined){
      for (const a of emps){
        if (a === G.wildId) continue;
        if (!hostile(a, G.wildId)) continue;
        if (!list.some(f => f.e === a && isArmed(f))) continue;
        A = a; B = G.wildId;
        break;
      }
    }
    if (A === null) { list.forEach(f=>f.combat=0); sys.cr = 0; continue; }

    const fa = list.filter(f=>f.e===A), fb = list.filter(f=>f.e===B);
    fa.concat(fb).forEach(f=>{ f.combat = 2; f.mv = null; });
    // mesafe: muharebe uzaktan başlar, her turda yakınlaşır
    if (!sys.cr) sys.cr = 3;
    battleRound(sys, A, fa, B, fb, def, sys.cr);
    if (sys.cr > 1) sys.cr -= 1;
    dirty = true;
  }
  if (dirty) G.fleets = G.fleets.filter(f => f.ships.length);
}

/* band: o turdaki muharebe mesafesi (3 uzak → 1 yakın).
   Sadece menzili banda yeten gemiler ateş eder; gövde/kalkan hep sayılır. */
function sideStats(e, fleets, enemy, band){
  let dmg=0, hull=0, sh=0, n=0, ready=0;
  for (const f of fleets){
    const st = STANCE[f.stance] || STANCE.agresif;
    /* ═══ FAZ 54: TEDARİK HATTI MUHAREBEYE BAĞLANDI ═══
       fleetSupply() yıpranmada ve arayüzde kullanılıyordu ama
       MUHAREBE GÜCÜNE hiç girmiyordu — uzaktaki filo tam güçle
       dövüşüyordu. Artık hem hasar hem savunma tedarikle çarpılır.
       Kalkanlar daha sert etkilenir (yedek parça ve enerji hattı
       kopunca ilk düşen onlardır). */
    const sup = (typeof fleetSupply === 'function' && !e.wild && !e.crisisSide)
      ? fleetSupply(e, f) : 1;
    f.supply = sup;
    const supSh = sup < 1 ? Math.max(.30, sup * .85) : 1;
    for (const s of f.ships){
      const d = SHIPS[s.c];
      const rg = d.rng || 0;
      if (d.dmg > 0 && rg >= (band||1)){
        dmg += d.dmg * (1 + e.mods.dmgMul + (enemy?enemy.mods.eDmgMul:0)) * st.dmg * sup;
        ready++;
      }
      hull += d.hull*(1+e.mods.hullMul)*s.h;
      sh += d.sh*(1+e.mods.shMul+(enemy?enemy.mods.eShMul:0)) * supSh;
      n++;
    }
  }
  return {dmg:Math.max(0,dmg), hull, sh:Math.max(0,sh), n, ready};
}
/* filonun aldığı hasar duruşuna göre ölçeklenir */
function sideTakeMul(fleets){
  if (!fleets.length) return 1;
  let t = 0, c = 0;
  for (const f of fleets){
    const st = STANCE[f.stance] || STANCE.agresif;
    t += st.take * f.ships.length; c += f.ships.length;
  }
  return c ? t/c : 1;
}

function applyDamage(e, fleets, amount){
  const targets = [];
  for (const f of fleets) for (let i=0;i<f.ships.length;i++) targets.push({f, i});
  if (!targets.length) return 0;
  let killed = 0;
  // öncelik: silahlı gemiler
  targets.sort((a,b)=> (SHIPS[b.f.ships[b.i].c].dmg||0) - (SHIPS[a.f.ships[a.i].c].dmg||0));
  let left = amount, guard = 0;
  while (left > 0 && targets.length && guard++ < 500){
    const t = targets[Math.floor(rnd()*Math.min(4,targets.length))];
    const s = t.f.ships[t.i];
    if (!s){ targets.splice(targets.indexOf(t),1); continue; }
    const mh = maxHull(s.c, e);
    const take = Math.min(left, mh*s.h);
    s.h -= take/mh; left -= take;
    if (s.h <= .001){ s.dead = true; killed++; targets.splice(targets.indexOf(t),1); }
  }
  for (const f of fleets) f.ships = f.ships.filter(s => !s.dead);
  return killed;
}

function battleRound(sys, A, fa, B, fb, def, band){
  band = band || 1;
  const ea = G.emps[A], eb = G.emps[B];
  const sa = sideStats(ea, fa, eb, band);
  const sb = sideStats(eb, fb, ea, band);
  // sistem savunma üsleri her mesafede ateş eder
  sb.dmg += def*.08; sb.hull += def*.5;

  const mitA = clamp(sa.sh/(sa.sh+sa.hull+1), 0, .55);
  const mitB = clamp(sb.sh/(sb.sh+sb.hull+1), 0, .55);
  const takeA = sideTakeMul(fa), takeB = sideTakeMul(fb);
  const toB = sa.dmg * (1-mitB) * takeB * (.85 + rnd()*.3);
  const toA = sb.dmg * (1-mitA) * takeA * (.85 + rnd()*.3);

  /* ═══ FAZ 28: PUSU BONUSU ═══
     Çift taraflı ajan tuzağı: kalkanın düştüğünü sanan saldırgan
     yörüngeye girince savunan taraf %25 fazla hasar vurur. */
  let ambA = 1, ambB = 1;
  if (sys && sys.planets){
    const simdi = G.memAge || 0;
    for (const pl of sys.planets){
      if (!pl.col || !pl.col.ambush || pl.col.ambush < simdi) continue;
      if (pl.col.ambushBy === ea.id) ambA = 1.25;      // A savunuyor
      if (pl.col.ambushBy === eb.id) ambB = 1.25;      // B savunuyor
    }
  }
  /* ═══ FAZ 53: MUHAREBE FİZYOLOJİSİ ═══
     Kuş benzeri türler çeviktir: gelen hasarın bir kısmını
     kaçınmayla savuşturur. Fizyoloji artık dövüş motoruna bağlı. */
  let evA = 1, evB = 1;
  if (typeof physioOf === 'function'){
    const pa = physioOf(ea), pb = physioOf(eb);
    if (pa && pa.evasion) evA = 1 - pa.evasion;   // A'ya gelen hasar azalır
    if (pb && pb.evasion) evB = 1 - pb.evasion;
  }

  /* FAZ 35: Galaktik Savunma Paktı — yalnız Sürü'ye karşı hasar bonusu */
  let paktA = 1, paktB = 1;
  if (eb.crisisSide && ea.mods && ea.mods.crisisDmg) paktA += ea.mods.crisisDmg;
  if (ea.crisisSide && eb.mods && eb.mods.crisisDmg) paktB += eb.mods.crisisDmg;
  const kb = applyDamage(eb, fb, toB * ambA * paktA * evB);
  const ka = applyDamage(ea, fa, toA * ambB * paktB * evA);

  /* FAZ 15: KAYIP ORANTILI SAVAŞ YORGUNLUĞU
     Yorgunluk artık yalnız zamana ve kuşatmaya değil, DÖKÜLEN KANA
     da bağlı. Kaybettiğin her gemi halkını biraz daha yoruyor;
     büyük gemiler daha çok. Bu, kanlı ama kısa savaşları da
     bitirebilir hâle getiriyor. */
  if (typeof addExh === 'function'){
    if (ka > 0) addExh(ea, eb.id, ka * 1.6, 'gemi kaybı');
    if (kb > 0) addExh(eb, ea.id, kb * 1.6, 'gemi kaybı');
    /* Kazanan taraf da bir miktar yorulur — savaş kimseye bedava değil */
    if (kb > 0) addExh(ea, eb.id, kb * .25, 'sefer yükü');
    if (ka > 0) addExh(eb, ea.id, ka * .25, 'sefer yükü');
  }

  // --- görsel: atış izleri ve patlamalar ---
  const pickPos = arr => { const f = arr[Math.floor(rnd()*arr.length)]; return f ? {x:f.x, y:f.y} : {x:sys.x, y:sys.y}; };
  if (fa.length && fb.length){
    const shots = Math.min(4, 1 + Math.floor((sa.n + sb.n)/6));
    for (let i=0;i<shots;i++){
      const p1 = pickPos(fa), p2 = pickPos(fb);
      fx({k:'shot', x:p1.x + (rnd()-.5)*12, y:p1.y + (rnd()-.5)*12,
                    x2:p2.x + (rnd()-.5)*12, y2:p2.y + (rnd()-.5)*12, c:ea.col, life:16});
      fx({k:'shot', x:p2.x + (rnd()-.5)*12, y:p2.y + (rnd()-.5)*12,
                    x2:p1.x + (rnd()-.5)*12, y2:p1.y + (rnd()-.5)*12, c:eb.col, life:16});
    }
  }
  for (let i=0;i<Math.min(kb,4);i++){ const p = pickPos(fb); fx({k:'boom', x:p.x+(rnd()-.5)*16, y:p.y+(rnd()-.5)*16, life:26}); }
  for (let i=0;i<Math.min(ka,4);i++){ const p = pickPos(fa); fx({k:'boom', x:p.x+(rnd()-.5)*16, y:p.y+(rnd()-.5)*16, life:26}); }
  if (def > 0 && sa.dmg > 0) fx({k:'shield', x:sys.x, y:sys.y, life:20});

  // korsan yuvası savunmaya katkı yapar ve saldırı altında yıpranır
  if (sys.nest){
    // vahşi taraf muharebede yoksa da yuvayı kuşatan taraf hasar verir
    let wildSide = (G.emps[A] && G.emps[A].wild) ? A : (G.emps[B] && G.emps[B].wild) ? B : -1;
    if (wildSide < 0 && G.wildId !== undefined) wildSide = G.wildId;
    if (wildSide >= 0){
      const atkDmg = (wildSide === A) ? sb.dmg : sa.dmg;
      sys.nest.hp -= atkDmg * .35;
      if (sys.nest.hp <= 0){
        const killer = (wildSide === A) ? B : A;
        sys.nest = null;
        sys.def = sysDefense(sys);
        G.nests = (G.nests || []).filter(x => x !== sys.id);
        const ke = G.emps[killer];
        if (ke && !ke.wild){
          ke.res.ala += 260; ke.res.min += 180; ke.res.etk += 40;
          if (hasCivic(ke,'corsair')) ke.res.etk += 50;
          if (killer === 0) say('KORSAN YUVASI YOK EDİLDİ — ' + sys.name + ' (+260 alaşım, +180 mineral)', 'win');
        }
        fx({k:'boom', x:sys.x, y:sys.y, life:34});
      }
    }
  }

  // kalıntı savunması hasar alır ve yıkılırsa ödül verir
  if (sys.ruin && sys.ruin.hp > 0){
    let wildSide2 = (G.emps[A] && G.emps[A].wild) ? A : (G.emps[B] && G.emps[B].wild) ? B : -1;
    if (wildSide2 < 0 && G.wildId !== undefined) wildSide2 = G.wildId;
    if (wildSide2 >= 0){
      const atk = (wildSide2 === A) ? sb.dmg : sa.dmg;
      sys.ruin.hp -= atk * .30;
      if (sys.ruin.hp <= 0){
        const killer = (wildSide2 === A) ? B : A;
        const ke = G.emps[killer];
        const wasRuin = sys.ruin;
        sys.ruin = null;
        sys.def = sysDefense(sys);
        G.ruins = (G.ruins || []).filter(x => x !== sys.id);
        if (ke && !ke.wild && typeof ruinReward === 'function'){
          sys.ruin = wasRuin;
          ruinReward(ke, sys);
          sys.ruin = null;
        }
        fx({k:'boom', x:sys.x, y:sys.y, life:40});
      }
    }
  }

  // kuşatma altındaki koloniler moral kaybeder
  for (const p of sys.planets) if (p.col && p.owner >= 0){
    const besieged = (p.owner === A) ? fb.some(isArmed) : (p.owner === B) ? fa.some(isArmed) : false;
    const oe = G.emps[p.owner];
    if (besieged && !(oe && hasPerk(oe,'zeal'))) p.col.stab = clamp(p.col.stab - .8, 0, 100);
  }

  // savunma üssü aşınması
  if (def > 0 && sa.dmg > 0){
    for (const p of sys.planets) if (p.col && p.col.b.kale){
      if (rnd() < .10){ p.col.b.kale--; sys.def = sysDefense(sys); }
    }
  }

  // --- savunma duruşundaki ezilmiş filolar ricat eder ---
  for (const side of [fa, fb]){
    for (const f of side){
      if (!f.ships.length || !f.combat) continue;
      const st = STANCE[f.stance] || STANCE.agresif;
      if (!st.kac) continue;
      if (fleetHealth(f) > st.kac) continue;
      const me = G.emps[f.e];
      const home = G.sys[f.sys] ? G.sys[f.sys].lanes
        .map(l=>G.sys[l])
        .filter(sy => sy.owner === f.e || sy.owner < 0)
        .sort((a,b)=> (a.owner===f.e?0:1) - (b.owner===f.e?0:1))[0] : null;
      if (home){
        f.combat = 0;
        f.ord = null;
        orderMove(f, home.id);
        fx({k:'shield', x:f.x, y:f.y, life:18});
        if (f.e === 0) say(esc(f.name) + ' ricat etti — ' + home.name, 'war');
      }
    }
  }
  fa = fa.filter(f => f.ships.length && f.combat);
  fb = fb.filter(f => f.ships.length && f.combat);

  // --- moral çöküşü: kuşatma altındaki zayıf koloniler teslim olabilir ---
  const defender = (sys.owner === A) ? A : (sys.owner === B) ? B : -1;
  if (defender >= 0){
    const attacker = (defender === A) ? B : A;
    const atkFleets = (defender === A) ? fb : fa;
    if (atkFleets.some(isArmed)){
      /* ═══ FAZ 27: TESLİMİYET SINIRI VE DOKUNULMAZLIK ═══
         Faz 26 ölçümü: 40 yılda 726 teslimiyet. Eşik (istikrar<28,
         ayda %5+) çok gevşekti ve kuşatma zaten istikrarı düşürdüğü
         için gezegenler ping-pong gibi el değiştiriyordu.
         Yeni kural: istikrar 15 ALTINDA **ve** garnizon SIFIR olmalı,
         ayrıca 36 aylık işgal dokunulmazlığı dolmuş olmalı. */
      let worst = 100, colonies = 0, garnizonVar = false, korumali = false;
      for (const p of sys.planets) if (p.col && p.owner === defender){
        colonies++; worst = Math.min(worst, p.col.stab);
        if ((p.col.garrison || 0) > 0) garnizonVar = true;
        if ((p.recent_conquest || 0) > 0) korumali = true;
        if ((p.martial_law || 0) > 0) korumali = true;   // FAZ 29
      }
      /* FAZ 34: Sürüye teslim olunmaz — yutulmaktan başka son yok */
      const krizSaldiran = G.emps[attacker] && G.emps[attacker].crisisSide;
      if (!krizSaldiran && colonies && !garnizonVar && !korumali && worst < 15 &&
          rnd() < .02 + (15 - worst) * .004){
        const de = G.emps[defender];
        const hive = de && RACES[de.race].dip === 0;   // kovan zihni asla teslim olmaz
        if (!hive){
          /* Teslimiyet YÜZEY olayıdır (halk direnmeyi bıraktı),
             bu yüzden sahiplik devri meşrudur. Tanıya kaydedilir. */
          if (typeof recordFall === 'function') recordFall('teslim');
          captureSystem(sys, attacker);
          [...fa, ...fb].forEach(f => f.combat = 0);
          sys.cr = 0;
          if (defender === 0) say(sys.name + ' teslim oldu — halk direnmeyi bıraktı', 'war');
          else if (attacker === 0) say(sys.name + ' teslim oldu!', 'win');
          return;
        }
      }
    }
  }

  const liveA = fa.filter(f=>f.ships.length), liveB = fb.filter(f=>f.ships.length);
  const armA = liveA.some(isArmed), armB = liveB.some(isArmed) || sysDefense(sys) > 0;

  if (!armA || !armB){
    // bitiş
    const winner = armA ? A : B;
    const loser  = armA ? B : A;
    const lf = armA ? liveB : liveA;
    for (const f of lf){
      // silahsız kalanlar imha
      f.ships = [];
    }
    G.fleets = G.fleets.filter(f => f.ships.length);
    [...fa, ...fb].forEach(f => f.combat = 0);
    sys.cr = 0;
    const loserE = G.emps[loser];
    if (loserE && loserE.crisisSide && typeof crisisCredit === 'function'){
      crisisCredit(winner, 100);
    }
    if (loserE && loserE.wild){
      const we = G.emps[winner];
      if (we && !we.wild){
        we.res.ala += 90; we.res.ara += 120;
        if (winner === 0) say('Korsanlar püskürtüldü — ganimet: +90 alaşım, +120 araştırma', 'win');
      }
    }
    /* FAZ 26: Kolonisi olan sistemde yörünge zaferi sahiplik
       getirmez — filo yörüngede kalır, kuşatma economyTick'te
       (invasionTick) yürür. Boş sistem anında el değiştirir. */
    if (armA && sys.owner === B && !hasDefendedColony(sys, A)) captureSystem(sys, A);
    if (armB && sys.owner === A && !hasDefendedColony(sys, B)) captureSystem(sys, B);
    /* Yörünge üstünlüğü kaydı — arayüz ve tanı için */
    if (hasDefendedColony(sys, winner)){
      sys.orbitHeld = winner;
      if (winner === 0 || (G.emps[winner] && !G.emps[winner].ai))
        say(sys.name + ' yörüngesi ele geçirildi — yüzey hâlâ direniyor', 'win');
    }
    if (A === 0 || B === 0){
      const we = (winner === 0);
      say((we?'ZAFER':'YENİLGİ') + ' — ' + sys.name + ' muharebesi', we?'win':'war');
    }
  }
}

/* ═══════════════════════════════════════════════════════════════════
   HOTFIX 23.1 — ÖKSÜZ VERİ TEMİZLİĞİ
   Bir imparatorluk öldüğünde arkasında filolar, savaş kayıtları,
   ittifaklar ve konsey üyeliği kalıyordu. Bunlar çizim ve diplomasi
   döngülerinde beklenmedik durumlara yol açıyor.
   ═══════════════════════════════════════════════════════════════════ */
function purgeEmpire(e){
  if (!e) return;
  /* Filoları haritadan kaldır */
  G.fleets = G.fleets.filter(f => f.e !== e.id);
  /* Diplomatik bağları sil */
  for (const o of G.emps){
    if (!o || o.id === e.id) continue;
    if (o.war)     delete o.war[e.id];
    if (o.ally)    delete o.ally[e.id];
    if (o.pact)    delete o.pact[e.id];
    if (o.passage) delete o.passage[e.id];
    if (o.embargo) delete o.embargo[e.id];
    if (o.spy)     delete o.spy[e.id];
    if (o.envoy)   delete o.envoy[e.id];
    if (o.exh)     delete o.exh[e.id];
  }
  /* Vasallık bağı koparılır */
  if (typeof vassalsOf === 'function'){
    for (const v of vassalsOf(e)) { v.overlord = null; v.vassalType = null; }
  }
  if (e.overlord !== undefined) e.overlord = null;
  /* Konsey üyeliği */
  if (G.council && G.council.members)
    G.council.members = G.council.members.filter(m => m !== e.id);
  /* Sistem sahipliği boşa düşer */
  for (const sy of G.sys) if (sy.owner === e.id) sy.owner = -1;
}

/* ═══════════════════════════════════════════════════════════════════
   FAZ 26 — YÖRÜNGE / YÜZEY AYRIMI
   Uzay muharebesini kazanmak artık gezegeni VERMEZ. Kolonisi olan
   bir sistem yalnızca yüzey yoluyla düşer:
     · taarruz ordusuyla  → TEMİZ İŞGAL
     · uzun bombardımanla → KATASTROF
   Boş sistem (koloni yok) eskisi gibi anında el değiştirir.
   Faz 25 teşhisi buydu: captureSystem tüm kuşatma sistemini kısa
   devre yapıyor, ne ateşkes ne ordu iş görüyordu.
   ═══════════════════════════════════════════════════════════════════ */
/* ═══ FAZ 26: DÜŞÜŞ TANI SAYACI ═══
   Bir gezegen/sistem hangi yolla el değiştirdi? Faz 25'te
   ölçemediğim için kör atış yapmıştım; artık sayılıyor.
   G.fallStats üzerinden okunur, kayıtta saklanmaz. */
function recordSabotage(tur){
  if (!G.sabStats) G.sabStats = {basari:0, ifsa:0, sessiz:0, cift:0, tech:0, kiskirt:0, falseflag:0};
  if (G.sabStats[tur] !== undefined) G.sabStats[tur]++;
}
function recordFall(tur){
  if (!G.fallStats) G.fallStats = {uzay:0, teslim:0, katastrof:0, temiz:0, colossus:0, yutuldu:0, ayrilik:0};
  if (G.fallStats[tur] !== undefined) G.fallStats[tur]++;
}
function fallReport(){
  const f = G.fallStats || {uzay:0, teslim:0, katastrof:0, temiz:0, colossus:0};
  const t = f.uzay + f.teslim + f.katastrof + f.temiz + f.colossus;
  return {...f, toplam:t,
    temizOran: t ? Math.round(f.temiz / t * 100) : 0};
}

function hasDefendedColony(sys, byId){
  if (!sys || !sys.planets) return false;
  for (const pl of sys.planets){
    if (!pl.col || pl.owner < 0) continue;
    if (pl.owner !== byId) return true;
  }
  return false;
}

function captureSystem(sys, byId){
  /* FAZ 34: Hiçlik Sürüsü sistem sahiplenmez — yalnız yutar. */
  if (G.emps[byId] && G.emps[byId].crisisSide) return;
  const e = G.emps[byId];
  const old = sys.owner;
  if (e && e.wild) return;                  // vahşiler sistem sahiplenmez
  if (old === byId) return;
  sys.owner = byId;
  /* Kolonisi olmayan sistemin devri "uzay" sayılır */
  if (typeof recordFall === 'function' && !sys.planets.some(p2 => p2.col))
    recordFall('uzay');
  for (const pl of sys.planets){
    if (!pl.col) continue;
    const oe = G.emps[pl.owner];
    if (oe){
      oe.colonies = oe.colonies.filter(c => !(c.s===sys.id && c.p===pl.i));
      recalcMods(oe);
    }
    if (typeof planetFlip === 'function') planetFlip(pl);
    pl.owner = byId;
    pl.col.stab = 25;
    pl.recent_conquest = 36;          // FAZ 27: 3 yıl dokunulmazlık
    pl.martial_law = 24;              // FAZ 29: sıkıyönetim
    /* ═══ FAZ 52: ASİMİLASYON SAYACI ONARIMI ═══
       ÖLÇÜM (Faz 51, 100 yıl): asimilasyon ilerlemesi %0'da
       kilitliydi. Sebep: e.assim YALNIZCA ırkın zafer türü
       'asimilasyon' olan tek bir ırk için artıyordu — diğer
       herkeste sonsuza dek 0 kalıyordu, dolayısıyla o zafer
       yolu pratikte yoktu.
       Artık her devlet fethettiği nüfusu asimile eder; ırk
       uyumu yalnızca VERİMİ belirler (özel ırk tam puan alır,
       diğerleri yarım). */
    const asimIrk = RACES[e.race].win === 'asimilasyon';
    e.assim = (e.assim || 0) + pl.col.pop * (asimIrk ? 1 : .5);
    if (!asimIrk && !hasCivic(e,'blood'))
      pl.col.pop = Math.max(1, Math.round(pl.col.pop*.7));
    if (hasCivic(e,'pirateking')){ e.res.min += 140; e.res.ala += 60; }
    e.colonies.push({s:sys.id, p:pl.i});
  }
  sys.def = sysDefense(sys);
  recalcMods(e);
  if (old >= 0 && G.emps[old] && hasCivic(G.emps[old],'leader') && G.emps[old].home === sys.id){
    const oe = G.emps[old];
    oe.collapseUntil = G.day + 6*360;
    recalcMods(oe);
    if (old === 0) say('ÖNDER ÖLDÜ — imparatorluk 6 yıl yasta, üretim çöktü', 'war');
    else say(oe.name + ' önderini kaybetti', 'war');
  }
  if (typeof facEvent === 'function'){ facEvent(e,'conquest'); if (G.emps[old]) facEvent(G.emps[old],'lost'); }
  if (old >= 0 && G.emps[old] && typeof remember === 'function')
    remember(G.emps[old], byId, 'sistemAldi');
  if (typeof addExh === 'function' && old >= 0){
    addExh(G.emps[old], byId, 6, 'sistem kaybı');
    addExh(e, old, 1.5);
  }
  if (byId === 0) say('Sistem ele geçirildi — ' + sys.name, 'win');
  else if (old === 0) say('Sistem kaybedildi — ' + sys.name, 'war');
  if (old >= 0 && G.emps[old].colonies.length === 0 &&
      !G.emps[old].wild && !G.emps[old].crisisSide){
    G.emps[old].dead = true;
    say(G.emps[old].name + ' yok oldu', 'war');
    /* FAZ 30: Fetihle ölen imparatorluğun filoları haritada
       öksüz kalıyordu (regresyon: "öksüz filo: 2"). purgeEmpire
       artık ÜÇ ölüm yolunun hepsinde çağrılıyor. */
    if (typeof purgeEmpire === 'function') purgeEmpire(G.emps[old]);
  }
}
function totalPower(e){
  if (e._powAt === G.day && e._powC !== undefined) return e._powC;
  let p = 0;
  for (const f of G.fleets) if (f.e === e.id && f.ships.length) p += fleetPower(f);
  e._powC = p; e._powAt = G.day;
  return p;
}
function sysCount(e){ return G.sys.filter(s=>s.owner===e.id).length; }

/* ---------- zafer ---------- */
/* Artık her imparatorluk her yolu deneyebilir. Kendi ırkının yolunda
   eşik %20 düşük. Koşul HOLD_MONTHS boyunca korunmalı ve oyun
   MIN_WIN_YEAR'dan önce bitemez. */
function victoryProgressOf(e, type){
  const W = WIN_TYPES[type];
  if (!W) return 0;
  const k = W.esik * winScale(e, type);
  return clamp(W.olc(e, k), 0, 2);
}
function bestVictory(e){
  let best = null;
  for (const t in WIN_TYPES){
    const p = victoryProgressOf(e, t);
    if (!best || p > best.p) best = {t, p};
  }
  return best;
}
function checkVictory(e, why){
  if (G.sandbox) return;                    // FAZ 50: serbest oyun
  if (G.over || !e || e.dead || e.wild) return;
  /* ═══ FAZ 51: KRİZ ZAFER KİLİDİ ═══
     Hiçlik Sürüsü galaksiyi yerken kimse "ekonomik zafer" ilan
     edemez. Yalnız krizi bitirmek (kriz zaferi) sayılır — o da
     crisisResolved üzerinden gelir. */
  if (typeof crisisActive === 'function' && crisisActive()) return;
  if (!e.winHold) e.winHold = {};

  for (const t in WIN_TYPES){
    const p = victoryProgressOf(e, t);
    if (p >= 1){
      e.winHold[t] = (e.winHold[t] || 0) + 1;
    } else {
      e.winHold[t] = 0;
      continue;
    }
    // yıl kilidi ve koruma süresi
    if (G.year < MIN_WIN_YEAR) continue;
    if (e.winHold[t] < HOLD_MONTHS) continue;

    const W = WIN_TYPES[t];
    const own = RACES[e.race].win === t;
    G.over = {
      e, type: t,
      txt: W.d + (own ? ' Bu, türünün doğasında olan yoldu.'
                      : ' Kimse bu türden bunu beklemiyordu.'),
      win: e.id === 0
    };
    G.speed = 0;
    UI.gameOver();
    return;
  }
}

/* ---------- rastgele imparatorluk olayları ---------- */
function maybeEvent(){
  G.seenChains = G.seenChains || {};
  // önce hikâye zinciri şansı — bunlar araştırmaya bağlı değil
  if (rnd() < .11){
    const pool = [];
    for (const k in CHAINS){
      const c = CHAINS[k];
      if (!c.bas || G.seenChains[k]) continue;
      for (let i=0;i<(c.w||5);i++) pool.push(k);
    }
    if (pool.length){
      const pickK = pool[Math.floor(rnd()*pool.length)];
      G.seenChains[pickK] = true;
      UI.chain(pickK);
      return;
    }
  }
  if (rnd() > .16) return;
  const ok = EVENTS.filter(ev => !ev.ok || ev.ok(G));
  if (!ok.length) return;
  UI.event(ok[Math.floor(rnd()*ok.length)]);
}

/* =====================================================================
   UZAY İNŞAATI — inşaat gemisi ve yapılar
   ===================================================================== */
const STRUCTS = {
  maden_ist :{n:'Madencilik İstasyonu', ico:'⛏', c:{min:220, ala:40}, ay:8,
              on:['ast','gaz'], g:{min:7},
              d:'Asteroit kuşağı veya gaz devinde koloni olmadan kaynak çıkarır.'},
  bilim_ist :{n:'Araştırma İstasyonu',  ico:'🔬', c:{min:250, ala:50}, ay:9,
              on:['any'], g:{ara:6},
              d:'Yörüngeden bilimsel gözlem yapar.'},
  role     :{n:'Hiper Röle',            ico:'📡', c:{min:300, ala:80}, ay:10,
              on:['sys'], sp:'role',
              d:'Röle ağındaki filoların hızını +%40 artırır.'},
  karakol  :{n:'Sınır Karakolu',        ico:'🚩', c:{min:180, ala:30}, ay:6,
              on:['sys'], sp:'claim',
              d:'Sahipsiz sistemi sahiplenir ve sınır erişimini genişletir.'},
  platform :{n:'Savunma Platformu',     ico:'🛡', c:{min:260, ala:110}, ay:8,
              on:['sys'], sp:'def', def:220,
              d:'Koloni olmasa bile sisteme +220 savunma ekler.'},
  tic_ist  :{n:'Ticaret İstasyonu',     ico:'🏪', c:{min:280, ala:60}, ay:9,
              on:['sys'], sp:'trade',
              d:'Rota düğümü: bu sistemden geçen ticaret hacmi +%30, yağmaya karşı korunur.'},
  sensor   :{n:'Sensör Dizisi',         ico:'👁', c:{min:240, ala:70}, ay:8,
              on:['sys'], sp:'sensor',
              d:'Geniş görüş sağlar ve düşman casuslarını yavaşlatır.'},
  tersane_h:{n:'Tersane Halkası',       ico:'⚓', c:{min:420, ala:160}, ay:12,
              on:['sys'], sp:'yard',
              d:'Koloni olmadan bu sistemde gemi inşa yuvası açar.'},
  kapi     :{n:'Yıldız Kapısı',         ico:'🌀', c:{min:900, ala:380}, ay:20,
              on:['sys'], sp:'gate', mega:1,
              d:'MEGA YAPI · İki kapı arasında filolar anında geçer.'},
  /* ═══ FAZ 49: PANOPTİKON ═══ */
  panopt   :{n:'Panoptikon',            ico:'🛰', c:{min:1400, ala:520, ara:600}, ay:26,
              on:['sys'], sp:'panopt', mega:1,
              d:'MEGA YAPI · Uzak bir sisteme kilitlenir: o sistem ve 2 hiperyol ' +
                'mesafesindeki her şey canlı görünür. Gözlenen taraf fark ederse ' +
                'sensörleri körleyebilir.'},
  dyson    :{n:'Dyson Küresi',          ico:'☀', c:{min:1800, ala:700}, ay:30,
              on:['star'], sp:'dyson', mega:1,
              d:'MEGA YAPI · Yıldızı kuşatır, devasa enerji üretir (+45 enerji).'}
};

function structAllowed(e, sys, key){
  const S = STRUCTS[key];
  if (!S) return false;
  if (sys.built && sys.built[key] !== undefined) return false;
  // sahiplik: karakol dışındaki yapılar kendi ya da sahipsiz sistemde
  if (sys.owner >= 0 && sys.owner !== e.id) return false;
  if (key === 'karakol' && sys.owner >= 0) return false;
  const claim = claimOf(sys);
  if (claim >= 0 && claim !== e.id && !e.war[claim]) return false;
  if (S.on.includes('sys') || S.on.includes('any')) return true;
  if (S.on.includes('star')) return !sys.star.ozel;
  // gezegen türü gerektirenler
  return sys.planets.some(p => S.on.includes(PLANETS[p.t].k));
}
function structCost(e, key){
  const S = STRUCTS[key], out = {};
  for (const r in S.c) out[r] = Math.round(S.c[r] * (1 - (e.mods.buildMul || 0) * .3));
  return out;
}
function startStruct(e, sys, key, fleet){
  if (!structAllowed(e, sys, key)) return false;
  const c = structCost(e, key);
  for (const r in c) if ((e.res[r]||0) < c[r]) return false;
  for (const r in c) e.res[r] -= c[r];
  const S = STRUCTS[key];
  const days = Math.round(S.ay * 30 / (1 + (e.mods.buildMul || 0)));
  sys.work = sys.work || [];
  sys.work.push({key, e:e.id, left:days, tot:days});
  /* FAZ 6: harika inşası gizlenemez — galaksi görür ve tedirgin olur */
  if (S.mega && typeof announceMega === 'function') announceMega(e, sys, key);
  if (fleet){
    fleet.ships = fleet.ships.filter(sh => sh.c !== 'ins');
    if (!fleet.ships.length) G.fleets = G.fleets.filter(f => f !== fleet);
  }
  return true;
}
function structTick(dt){
  for (const sys of G.sys){
    if (!sys.work || !sys.work.length) continue;
    for (let i = sys.work.length - 1; i >= 0; i--){
      const w = sys.work[i];
      w.left -= dt;
      if (w.left > 0) continue;
      sys.work.splice(i, 1);
      const e = G.emps[w.e];
      if (!e || e.dead) continue;
      sys.built = sys.built || {};
      sys.built[w.key] = e.id;
      G._structAt = -1;                     // indeks geçersiz
      const S = STRUCTS[w.key];
      if (S.sp === 'claim' && sys.owner < 0) sys.owner = e.id;
      if (S.sp === 'def') sys.def = sysDefense(sys);
      recalcMods(e);
      if (w.e === 0) say(S.n + ' tamamlandı — ' + sys.name, 'win');
    }
  }
}
/* Yapıların imparatorluk geneli etkileri.
   Eskiden her imparatorluk için TÜM galaksi taranıyordu (9×88 geçiş).
   Artık ay başına tek geçişte hepsi birden hesaplanıp önbelleğe alınır. */
function rebuildStructIndex(){
  const idx = {};
  for (const sys of G.sys){
    if (!sys.built) continue;
    for (const k in sys.built){
      const owner = sys.built[k];
      if (owner === undefined) continue;
      const S = STRUCTS[k];
      if (!S) continue;
      const b = idx[owner] || (idx[owner] = {min:0, ene:0, ara:0, role:0, sensor:0, gate:[], dyson:0});
      if (S.g) for (const r in S.g) b[r] = (b[r]||0) + S.g[r];
      if (S.sp === 'role') b.role++;
      if (S.sp === 'sensor') b.sensor++;
      if (S.sp === 'gate') b.gate.push(sys.id);
      if (S.sp === 'panopt') b.panopt = (b.panopt || []).concat([sys.id]);
      if (S.sp === 'dyson') b.dyson++;
    }
  }
  G._structIdx = idx;
  G._structAt = G.day;
  return idx;
}
const EMPTY_STRUCT = {min:0, ene:0, ara:0, role:0, sensor:0, gate:[], dyson:0};
function structBonus(e){
  if (G._structAt !== G.day || !G._structIdx) rebuildStructIndex();
  return G._structIdx[e.id] || EMPTY_STRUCT;
}
function structDefense(sys){
  let d = 0;
  if (sys.built) for (const k in sys.built){
    if (sys.built[k] === undefined) continue;
    const S = STRUCTS[k];
    if (S && S.def) d += S.def;
  }
  return d;
}
/* ═══════════════════════════════════════════════════════════════════
   FAZ 47 — TERSANE SAYISI
   Kendi sistemlerinde her zaman, yabancı sistemlerde yalnız 2.
   seviye istihbaratla görünür. Askerî planlama için kritik bilgi.
   ═══════════════════════════════════════════════════════════════════ */
function yardCount(sys){
  if (!sys || !sys.built) return 0;
  let n = 0;
  for (const k in sys.built){
    if (sys.built[k] === undefined) continue;
    if (STRUCTS[k] && STRUCTS[k].sp === 'yard') n += (sys.built[k] || 1);
  }
  return n;
}

/* Oyuncu bu sistemin tersanelerini görebiliyor mu? */
function yardVisible(sys){
  if (!sys || sys.owner < 0) return false;
  if (sys.owner === 0) return true;
  const lvl = (typeof intelOf === 'function') ? intelOf(G.p, sys.owner) : 0;
  return lvl >= 2;
}

/* ═══════════════════════════════════════════════════════════════════
   FAZ 48 — FİLO LOJİSTİĞİ
   İkmal: filodaki kayıpları en yakın tersanelere sipariş eder.
   Rally: yeni gemiler toplanma noktasına otomatik intikal eder.
   ═══════════════════════════════════════════════════════════════════ */
const FLEET_SOFT_CAP = 30;        // "tam filo" referansı

/* Filonun eksiği: en kalabalık gemi sınıfına göre tamamlanır */
function reinforceFleet(e, f){
  if (!e || !f || !f.ships) return {ok:false, why:'Filo yok'};
  const hedefN = Math.min(FLEET_SOFT_CAP, f.capTarget || FLEET_SOFT_CAP);
  const eksik = hedefN - f.ships.length;
  if (eksik <= 0) return {ok:false, why:'Filo zaten dolu'};

  /* Hangi sınıftan? Filodaki baskın savaş gemisi sınıfı */
  const say = {};
  for (const sh of f.ships) say[sh.c] = (say[sh.c] || 0) + 1;
  let cls = null, en = 0;
  for (const k in say){
    if (SHIPS[k] && SHIPS[k].rol === 'sav' && !SHIPS[k].crisisOnly &&
        say[k] > en){ en = say[k]; cls = k; }
  }
  if (!cls) cls = 'kor';

  /* Tersaneler — filoya en yakından başlayarak */
  const kaynak = f.sys >= 0 ? G.sys[f.sys] : (f.mv ? G.sys[f.mv.to] : null);
  /* ÖLÇÜM: hasStructYard() STRUCTS (megayapı) tablosuna bakıyor,
     ama normal tersane BUILDINGS'te ve koloni binası olarak
     sayılıyor. yardCount() ikisini de doğru topluyor — ikmal
     onu kullanmalı, yoksa "hiç tersanen yok" der. */
  const yardlar = G.sys.filter(sy => sy.owner === e.id && yardCount(sy) > 0);
  if (!yardlar.length) return {ok:false, why:'Hiç tersanen yok'};
  if (kaynak) yardlar.sort((x, y) => dist(x, kaynak) - dist(y, kaynak));

  let siparis = 0;
  for (let i = 0; i < eksik; i++){
    const yard = yardlar[i % yardlar.length];
    if (!queueShip(e, yard, cls)) break;        // kaynak bitti
    /* Yeni gemi bu filoya katılsın */
    yard.rally = yard.rally || {};
    yard.rally[e.id] = {fleet: f.id, sys: kaynak ? kaynak.id : yard.id};
    siparis++;
  }
  if (!siparis) return {ok:false, why:'Kaynak yetersiz'};
  return {ok:true, siparis, cls, eksik};
}

/* Toplanma noktası: sistemde üretilen gemiler oraya gider */
function setRally(e, sys, hedefSysId){
  if (!sys) return {ok:false, why:'Sistem yok'};
  sys.rally = sys.rally || {};
  if (hedefSysId === null || hedefSysId === undefined){
    delete sys.rally[e.id];
    return {ok:true, temizlendi:true};
  }
  sys.rally[e.id] = {sys: hedefSysId};
  return {ok:true, hedef: hedefSysId};
}

function hasStructYard(sys){
  if (!sys.built) return false;
  return Object.keys(sys.built).some(k =>
    sys.built[k] !== undefined && STRUCTS[k] && STRUCTS[k].sp === 'yard');
}

/* ---------- GEZEGEN KARAKTERİ ----------
   Koloniler sessizce tarih biriktirir. Belli eşiklerde tek bir
   karakter etiketi kazanırlar. Oyuncu yönetmez, sadece görür.   */
const PLANET_TRAITS = {
  sadik  :{n:'Sadık',        ico:'🕊', d:'40+ yıl kesintisiz barış: +12 istikrar, isyan olmaz.',
           stab:12, prod:0,   grow:0,   def:0},
  celik  :{n:'Çelikleşmiş',  ico:'⚔', d:'3+ kuşatma atlattı: savunma +%30, üretim −%5.',
           stab:4,  prod:-.05,grow:0,   def:.30},
  asi    :{n:'Asi',          ico:'🔥', d:'2+ kez el değiştirdi: istikrar −10, üretim +%10.',
           stab:-10,prod:.10, grow:0,   def:0},
  kadim  :{n:'Kadim',        ico:'🏛', d:'60+ yıl aynı sahipte: tüm üretim +%12.',
           stab:6,  prod:.12, grow:0,   def:.10},
  lanetli:{n:'Lanetli',      ico:'☠', d:'3+ kriz/salgın yaşadı: nüfus artışı −%15.',
           stab:-4, prod:0,   grow:-.15,def:0}
};

function planetHist(col){
  if (!col.hist) col.hist = {peace:0, own:0, flips:0, sieges:0, crises:0};
  return col.hist;
}
function planetTrait(col){
  return (col && col.pt && PLANET_TRAITS[col.pt]) ? PLANET_TRAITS[col.pt] : null;
}
/* aylık birikim ve etiket ataması */
function planetCharTick(){
  const fast = {};
  for (const e of G.emps) if (!e.dead) fast[e.id] = hasCivic(e,'heritage') ? 2 : 1;
  for (const sy of G.sys){
    for (const pl of sy.planets){
      if (!pl.col || pl.owner < 0) continue;
      const h = planetHist(pl.col);
      const mult = fast[pl.owner] || 1;
      h.own += mult;
      const underSiege = G.fleets.some(f => f.e !== pl.owner && f.sys === sy.id &&
                          isArmed(f) && G.emps[f.e] && G.emps[f.e].war[pl.owner]);
      if (underSiege){ h.peace = 0; h.siegeRun = (h.siegeRun||0) + 1; }
      else {
        h.peace += mult;
        if (h.siegeRun){ h.sieges++; h.siegeRun = 0; }
      }
      // etiket ataması — tek etiket, en güçlü koşul kazanır
      if (h.flips >= 2)            pl.col.pt = 'asi';
      else if (h.crises >= 3)      pl.col.pt = 'lanetli';
      else if (h.sieges >= 3)      pl.col.pt = 'celik';
      else if (h.own >= 720)       pl.col.pt = 'kadim';    // 60 yıl
      else if (h.peace >= 480)     pl.col.pt = 'sadik';    // 40 yıl
    }
  }
}
/* sistem/koloni el değiştirince ve kriz yaşanınca çağrılır */
function planetFlip(pl){
  if (!pl.col) return;
  const h = planetHist(pl.col);
  h.flips++; h.peace = 0; h.own = 0;
  if (h.flips >= 2) pl.col.pt = 'asi';
}
function planetCrisis(pl){
  if (!pl || !pl.col) return;
  const h = planetHist(pl.col);
  h.crises++;
  if (h.crises >= 3 && pl.col.pt !== 'asi') pl.col.pt = 'lanetli';
}
/* =====================================================================
   OYUN SONU KRİZİ VE KAYIP UYGARLIK KALINTILARI
   İkisi de kurulum ekranından ayarlanabilir.
   ===================================================================== */

/* FAZ 39: test bayrağı — Koruyucu'yu zorla zalim yapar. Varsayılan KAPALI. */
let DEBUG_FORCE_TYRANT = false;

const CRISIS_TIMING = {
  kapali:{n:'KAPALI', yil:0,  d:'Kriz hiç gelmez — saf inşa oyunu'},
  erken :{n:'ERKEN',  yil:16, d:'Yıl 2226 civarı · hazırlanmak için az zaman'},
  normal:{n:'NORMAL', yil:26, d:'Yıl 2236 civarı · dengeli'},
  gec   :{n:'GEÇ',    yil:38, d:'Yıl 2248 civarı · uzun barış dönemi'},
  /* FAZ 33: oyun sonu krizi — imparatorluklar zirveye ulaşsın,
     konsey otursun, sonra Hiçlik Sürüsü gelsin. */
  sonoyun:{n:'OYUN SONU', yil:80, d:'Yıl 2290 civarı · galaksi olgunlaşır, sonra yok oluş'}
};
const RUIN_LEVELS = {
  yok  :{n:'YOK',   say:0, d:'Kalıntı yok'},
  az   :{n:'AZ',    say:2, d:'2 kalıntı · nadir ve özel'},
  orta :{n:'ORTA',  say:4, d:'4 kalıntı · dengeli'},
  cok  :{n:'ÇOK',   say:7, d:'7 kalıntı · galaksi bir mezarlık'}
};

/* ---------- KAYIP UYGARLIK KALINTILARI ----------
   Uykuda ama çok güçlü savunma sistemleri. Erken oyunda geçilmez,
   geç oyunda değerli hedef. Yıkan büyük ödül alır.              */
const RUIN_REWARDS = [
  {k:'tech',   n:'Kayıp Arşiv',      d:'İki teknoloji bedava'},
  {k:'mega',   n:'Mega Yapı Planı',  d:'Mega yapılar %50 ucuz ve hızlı (kalıcı)'},
  {k:'fleet',  n:'Hayalet Donanma',  d:'Terk edilmiş savaş filosu senin olur'},
  {k:'boost',  n:'Kadim Motorlar',   d:'Kalıcı +%15 filo hızı ve +%10 gövde'},
  {k:'wealth', n:'Hazine Odası',     d:'Büyük kaynak yığını'}
];

function initRuins(cfg, rnd){
  G.ruins = [];
  const lvl = RUIN_LEVELS[cfg.ruins || 'orta'];
  if (!lvl || !lvl.say) return;
  // anavatanlardan uzak, sahipsiz sistemler
  const free = G.sys.filter(sy => sy.owner < 0 && !sy.nest &&
    G.emps.every(em => em.wild || em.home < 0 || hopDist(em.home, sy.id, 2) > 2));
  shuffle(rnd, free);
  for (let i = 0; i < Math.min(lvl.say, free.length); i++){
    const sy = free[i];
    const rw = RUIN_REWARDS[Math.floor(rnd()*RUIN_REWARDS.length)];
    sy.ruin = {hp: 2600 + Math.floor(rnd()*1800), max: 0, rw: rw.k, awake: false};
    sy.ruin.max = sy.ruin.hp;
    G.ruins.push(sy.id);
  }
}
function ruinDefense(sys){
  if (!sys.ruin) return 0;
  // uyandırılmamış kalıntı da caydırıcıdır
  return Math.max(0, sys.ruin.hp) * (sys.ruin.awake ? .55 : .35);
}
function ruinReward(e, sys){
  const key = sys.ruin ? sys.ruin.rw : null;
  const rw = RUIN_REWARDS.find(r => r.k === key);
  let msg = '';
  switch(key){
    case 'tech': {
      let got = [];
      for (const b of ['fiz','top','muh']){
        const av = availTechs(e, b);
        if (av.length && got.length < 2){ e.techs[av[0]] = true; got.push(TECHS[av[0]].n); }
      }
      recalcMods(e);
      msg = got.length ? 'Kayıp arşiv açıldı: ' + got.join(', ') + ' bedava kazanıldı.'
                       : 'Arşiv bildiklerimizi doğruladı: +900 araştırma.';
      if (!got.length) e.res.ara += 900;
      break;
    }
    case 'mega':
      e.extra = e.extra || {};
      e.extra.megaBoost = true;
      msg = 'Mega yapı planları çözüldü: Yıldız Kapısı ve Dyson Küresi %50 ucuz ve hızlı.';
      break;
    case 'fleet': {
      const ships = [{c:'zir'},{c:'kru'},{c:'kru'},{c:'muh'},{c:'muh'}];
      newFleet(e, sys.id, ships, e.ai ? null : 'Hayalet Donanma');
      msg = 'Terk edilmiş bir donanma devralındı: 1 Zırhlı, 2 Kruvazör, 2 Muhrip.';
      break;
    }
    case 'boost':
      e.extra = e.extra || {};
      e.extra.spdMul = (e.extra.spdMul||0) + .15;
      e.extra.hullMul = (e.extra.hullMul||0) + .10;
      recalcMods(e);
      msg = 'Kadim motor teknolojisi: kalıcı +%15 filo hızı, +%10 gövde.';
      break;
    case 'wealth':
      e.res.min += 2200; e.res.ala += 700; e.res.ene += 1500; e.res.ara += 600;
      msg = 'Hazine odası boşaltıldı: +2200 mineral, +700 alaşım, +1500 enerji, +600 araştırma.';
      break;
  }
  if (e.id === 0) say('KALINTI ÇÖZÜLDÜ — ' + (rw ? rw.n : '') + ': ' + msg, 'win');
  else say((rw?rw.n:'Bir kalıntı') + ' ' + e.name + ' tarafından ele geçirildi', 'war');
}

/* ---------- OYUN SONU KRİZİ ---------- */
function crisisYear(){
  const t = CRISIS_TIMING[(G.cfg && G.cfg.crisis) || 'normal'];
  return t ? t.yil : 40;
}
function crisisActive(){ return !!(G.crisis && G.crisis.stage > 0 && !G.crisis.over); }

/* Krizin doğuş penceresi TUR (ay) cinsindendir; her oyunda pencere
   içinde rastgele bir noktada belirir, böylece tarih ezberlenemez.
   Faz 5 hedefi: normal ayarda 150–200. tur arası. */
const CRISIS_WINDOW = {
  erken : [110, 150],
  normal: [150, 200],
  gec   : [230, 290],
  sonoyun: [930, 1020]        // FAZ 33: 77–85. yıl arası
};
function initCrisis(){
  const key = (G.cfg && G.cfg.crisis) || 'normal';
  if (key === 'kapali' || !crisisYear()){ G.crisis = null; return; }
  const w = CRISIS_WINDOW[key] || CRISIS_WINDOW.normal;
  const atMonth = w[0] + Math.floor(rnd() * (w[1] - w[0] + 1));
  G.crisis = {stage:0, at: 2210 + Math.round(atMonth / 12), atMonth, age: 0,
              kills:0, need:0, over:false, warned:false, contrib:{}};
}
/* galaksinin toplam gücüne göre ölçeklenir */
/* Krizin ölçeği yalnız filo gücüne değil, galaksinin ÜRETİM
   kapasitesine de bakar: donanmasını dağıtmış ama ekonomisi dev bir
   galaksi krizi kolay yenmemelidir. Ayrıca kriz artık 150. turda
   geldiği için, galaksinin o ana kadarki gelişimine göre telafi
   çarpanı uygulanır — erken gelen kriz cılız kalmasın. */
function crisisScale(){
  let filo = 0, uretim = 0, sistem = 0;
  for (const e of G.emps){
    if (e.dead || e.wild || e.id === G.crisisId) continue;
    filo += totalPower(e);
    sistem += sysCount(e);
    if (e.inc) uretim += (e.inc.min || 0) + (e.inc.ene || 0) +
                         (e.inc.ala || 0) * 2.5 + (e.inc.ara || 0);
  }
  /* Ekonomi, filoya çevrilebilecek gizli güçtür */
  /* Ekonomi filoya çevrilebilecek gizli güçtür — ama birebir değil.
     Katsayı 6 iken kriz galaksinin 6 katına çıkıyor ve savaş
     kazanılamaz hâle geliyordu; kalibre edildi. */
  const ekonomik = uretim * 1.2;
  const taban = Math.max(1, filo + ekonomik);

  /* Teknoloji telafisi: ileri galakside kriz de ileri gelir */
  let tekno = 0, n = 0;
  for (const e of G.emps){
    if (e.dead || e.wild || e.id === G.crisisId) continue;
    tekno += Object.keys(e.techs || {}).length; n++;
  }
  const tekMul = 1 + (n ? (tekno / n) / 70 : 0);          // ~30 tech → ×1.43

  /* Yayılma telafisi: geniş galakside tehdit de geniş olmalı */
  const yayMul = 1 + clamp(sistem / 90, 0, .40);

  return taban * tekMul * yayMul;
}
function ensureCrisisEmpire(){
  if (G.crisisId !== undefined && G.emps[G.crisisId]) return G.emps[G.crisisId];
  const c = makeEmpire(G.emps.length, 'klan',
    CRISIS_NAMES[Math.floor(rnd() * CRISIS_NAMES.length)], true, rnd, []);
  c.col = '#c026d3';
  c.wild = true; c.crisisSide = true;
  c.look = 'amorf';
  c.ethics = {mil:3, aut:3, mat:0};
  c.civics = [];
  recalcMods(c);
  G.crisisId = c.id;
  G.emps.push(c);
  for (const o of G.emps){
    if (o.id === c.id) continue;
    c.war[o.id] = true; o.war[c.id] = true;
    c.contact[o.id] = true; o.contact[c.id] = true;
    c.rel[o.id] = -100; o.rel[c.id] = -100;
  }
  return c;
}
/* ═══════════════════════════════════════════════════════════════════
   FAZ 34 — SÜRÜ TAVANI
   Kar topu etkisi belleği şişirmesin: sürü filo sayısı ve filo
   başına gemi sayısı sınırlı. Tavan aşılırsa EN ZAYIF filolar
   birleştirilir (yok edilmez — sürü zayıflamamalı, sadece
   veri yapısı sadeleşmeli).
   ═══════════════════════════════════════════════════════════════════ */
const SWARM_FLEET_CAP = 26;        // aynı anda en fazla filo
const SWARM_FLEET_SHIPS = 60;      // filo başına gemi tavanı

function swarmCap(){
  if (G.crisisId === undefined) return;
  const mine = G.fleets.filter(f => f.e === G.crisisId && f.ships && f.ships.length);
  if (mine.length <= SWARM_FLEET_CAP) return;
  /* En zayıftan başlayarak birleştir */
  mine.sort((a, b) => a.ships.length - b.ships.length);
  const fazla = mine.length - SWARM_FLEET_CAP;
  const kurban = mine.slice(0, fazla);
  const kalan = mine.slice(fazla);
  for (const k of kurban){
    /* En yakın kalan filoya kat — sistemi aynı olan tercih edilir */
    let hedef = kalan.find(x => x.sys === k.sys) || kalan[0];
    if (hedef && hedef.ships.length < SWARM_FLEET_SHIPS){
      const yer = SWARM_FLEET_SHIPS - hedef.ships.length;
      hedef.ships.push(...k.ships.slice(0, yer));
    }
    k.ships.length = 0;
  }
  G.fleets = G.fleets.filter(f => f.ships && f.ships.length);
}

function spawnCrisisWave(stage){
  const c = ensureCrisisEmpire();
  const scale = crisisScale();
  // aşamaya göre dalga gücü
  /* Aşama ağırlıkları yükseltildi: kriz 150. turda geldiği için
     galaksinin savunmasını gerçekten zorlaması gerekiyor. */
  const zor = (G.cfg && DIFFS[G.cfg.diff] && DIFFS[G.cfg.diff].aiAgr) || 1;
  /* Aşama ağırlıkları: 3. dalga galaksinin toplam filosunun ~1.7 katı
     olmalı — tek başına yenilemez, federasyon gerektirir, ama
     imkânsız da değil. */
  /* FAZ 53: kriz şiddeti anahtarı — acımasız modda çift bütçe */
  const siddet = (G.cfg && G.cfg.crisisPower === 'acimasiz') ? 2 : 1;
  const budget = scale * (stage === 1 ? .17 : stage === 2 ? .38 : .62) *
    clamp(zor, .85, 1.30) * siddet;
  // galaksinin kenarındaki sahipsiz sistemlerden gir
  const cx = G.W/2, cy = G.H/2;
  const edge = G.sys.filter(sy => Math.hypot(sy.x-cx, sy.y-cy) > G.W*.30)
                    .sort((a,b)=>Math.hypot(b.x-cx,b.y-cy) - Math.hypot(a.x-cx,a.y-cy));
  const entry = edge.slice(0, Math.max(1, 2 + stage));
  const perFleet = budget / Math.max(1, entry.length);
  for (const sy of entry){
    /* FAZ 34: artık organik sürü gemileri. Her filoda bir kraliçe
       (kalkan eritici) ve etrafında dron bulutu. */
    const ships = [];
    let acc = 0;
    if (stage >= 2){
      ships.push({c:'swarm_queen'});
      acc += SHIPS.swarm_queen.dmg * 4 + SHIPS.swarm_queen.hull * .5;
    }
    while (acc < perFleet && ships.length < SWARM_FLEET_SHIPS){
      ships.push({c:'swarm_drone'});
      acc += SHIPS.swarm_drone.dmg * 4 + SHIPS.swarm_drone.hull * .5;
    }
    if (!ships.length) ships.push({c:'swarm_drone'});
    const f = newFleet(c, sy.id, ships, 'Hiçlik Dalgası ' + stage);
    f.crisis = true;
    f.stance = 'agresif';
  }
  G.crisis.need = Math.round(budget * 1.1);
  if (typeof swarmCap === 'function') swarmCap();
}
function crisisTick(){
  if (!G.crisis || G.crisis.over) return;
  // ay sayacı: yıl/gün senkronuna bağlı kalmaz
  G.crisis.age = (G.crisis.age || 0) + 1;
  const due = G.crisis.atMonth !== undefined ? G.crisis.atMonth : crisisYear() * 12;
  // uyarı: Kriz Kâhini civic'i 6 yıl önceden bilir
  if (!G.crisis.warned){
    const seer = hasCivic(G.p, 'seer');
    if (seer && G.crisis.age >= due - 72){
      G.crisis.warned = true;
      UI.crisisWarn(G.crisis.at);
    }
  }
  if (G.crisis.stage === 0){
    if (G.crisis.age < due) return;
    G.crisis.stage = 1;
    spawnCrisisWave(1);
    UI.crisisPhase(1);
    // fraksiyonlar ortak tehdide karşı birleşir
    for (const e of G.emps){
      if (e.dead || e.wild || !e.factions) continue;
      e.factions.forEach(f => facShift(e, f.k, +14, 'ortak tehdit'));
    }
    // federasyonlar acil savunma oylaması başlatır
    if (G.feds) for (const f of G.feds){ f.nextVote = G.day + 30; }
    return;
  }
  // aşama ilerlemesi: mevcut dalga temizlenirse sonraki gelir
  const alive = G.fleets.filter(f => f.e === G.crisisId && f.ships.length).length;
  G.crisis.timer = (G.crisis.timer || 0) + 1;
  if (alive === 0){
    if (G.crisis.stage >= 3){
      crisisResolved();
      return;
    }
    G.crisis.stage++;
    spawnCrisisWave(G.crisis.stage);
    UI.crisisPhase(G.crisis.stage);
    return;
  }
  // uzun süre temizlenmezse yeni takviye
  if (G.crisis.timer % 24 === 0 && G.crisis.stage < 3){
    G.crisis.stage++;
    spawnCrisisWave(G.crisis.stage);
    UI.crisisPhase(G.crisis.stage);
  }
}
function crisisResolved(){
  G.crisis.over = true;
  /* ═══ FAZ 36: SOĞUK SAVAŞ GERİ DÖNÜYOR ═══
     Ortak düşman yok olunca ittifak da çözülür. Savunma Paktı ve
     Krize Karşı Birleşme feshedilir; kapasite bonusu bir anda
     silinir. Sınırına kadar filo basmış devletler aşırı kapasite
     bakımına düşer — kazanan taraf bile sarsılır. */
  if (typeof councilExists === 'function' && councilExists()){
    const c = G.council;
    let feshedilen = [];
    if (c.laws.savunmaPakti){ delete c.laws.savunmaPakti; feshedilen.push('Galaktik Savunma Paktı'); }
    if (c.laws.birlesme){ delete c.laws.birlesme; feshedilen.push('Krize Karşı Birleşme'); }
    if (feshedilen.length){
      G.emps.forEach(x => { if (!x.dead) recalcMods(x); });
      say('⚠ ' + feshedilen.join(' ve ') + ' feshedildi — ortak düşman yok, ' +
          'filo kapasiteleri düştü', 'war');
      /* Kapasite aşımı olan devletlere uyarı */
      for (const x of G.emps){
        if (x.dead || x.wild || x.crisisSide) continue;
        const kul = (typeof fleetUsage === 'function') ? fleetUsage(x) : 0;
        if (kul > (x.cap || 0) && x.id === 0)
          say('FİLO KAPASİTESİ AŞILDI — bakım maliyetin fırladı, gemi terhis et', 'war');
      }
    }
  }
  // en çok katkı yapan büyük ödül alır
  let best = -1, bestV = 0;
  for (const k in G.crisis.contrib){
    /* FAZ 38: Korsanlar ve kriz tarafı Koruyucu olamaz — diplomatik
       varlıkları yok, konseyde oy kullanamaz, "Yeni Düzen" ilan
       edemezler. Ölçümde tohum 4242'de Koruyucu unvanı korsanlara
       gitmiş ve isyancı ittifakı hiç kurulamamıştı. */
    const aday = G.emps[+k];
    if (!aday || aday.dead || aday.wild || aday.crisisSide) continue;
    if (G.crisis.contrib[k] > bestV){ bestV = G.crisis.contrib[k]; best = +k; }
  }
  const win = G.emps[best];
  if (win && !win.dead){
    win.res.etk += 600; win.res.ara += 1200; win.res.ala += 900;
    win.extra = win.extra || {};
    win.extra.dmgMul = (win.extra.dmgMul||0) + .10;
    /* ═══ FAZ 37: GALAKSİNİN KORUYUCUSU ═══
       Krizi bitiren devlet konseyde +%50 oy ağırlığı ve 15 yılda
       bir veto hakkı kazanır. Ama güç yozlaştırır — militarist ya
       da otoriter bir koruyucu yetkiyi bırakmak istemeyebilir. */
    win.guardian = {since: G.memAge || 0, vetoAt: 0, newOrder: false};
    /* FAZ 51: kriz kahramanına kalıcı skor bonusu — galaksiyi
       kurtarmak tarih kitabında ayrı bir satırdır. */
    win.crisisScore = (win.crisisScore || 0) + Math.round(bestV);
    /* ═══════════════════════════════════════════════════════════
       FAZ 39 — TEST ZORLAMASI (DEBUG_FORCE_TYRANT)
       Yeni Düzen senaryosu doğal oyunda nadir: Koruyucu'nun
       militarist ya da otoriter çıkması gerekiyor ve Faz 38'de
       iki tohumda da çıkmadı. Bu bayrak açıkken Koruyucu ZORLA
       zalim yapılır, böylece İsyancı İttifakı zinciri ölçülebilir.
       ⚠ Normal oyunda KAPALI olmalı — yalnız test içindir. */
    if (typeof DEBUG_FORCE_TYRANT !== 'undefined' && DEBUG_FORCE_TYRANT){
      win.ethics = win.ethics || {};
      win.ethics.mil = 2;
      win.ethics.aut = 2;
      win._forcedTyrant = true;
      recalcMods(win);
    }
    if (win.id === 0)
      say('🛡 GALAKSİNİN KORUYUCUSU ilan edildin — konseyde oy ağırlığın ' +
          '+%50, 15 yılda bir yasa veto edebilirsin', 'win');
    else
      say(win.name + ' GALAKSİNİN KORUYUCUSU ilan edildi', 'win');
    recalcMods(win);
  }
  UI.crisisEnd(win);
  // vahşi kriz filoları temizlenir
  G.fleets = G.fleets.filter(f => f.e !== G.crisisId);
}
/* kriz filosu yok edildiğinde katkı kaydı */
function crisisCredit(empId, amount){
  if (!G.crisis || !G.crisis.contrib) return;
  G.crisis.contrib[empId] = (G.crisis.contrib[empId] || 0) + amount;
}
/* =====================================================================
   GÖRÜNTÜLEME
   ===================================================================== */
const View = {
  cam:{x:2100, y:2100, z:.30}, vw:0, vh:0, dpr:1,
  sel:null, selSys:null, route:false, routed:false, hl:null, stars:[], flash:[],
  cv:null, g:null,

  init(){
    this.cv = $('map'); this.g = this.cv.getContext('2d');
    this.resize();
    if (this._inited) return;
    this._inited = true;
    /* ═══ FAZ 46: ARKA PLAN YAYILIMI ═══
       ÖLÇÜM: yıldızlar G.W×1.3 alanında üretiliyordu ama paralaks
       çarpanı (p: 0.30–0.75) onları ekran merkezinde dar bir kutuya
       sıkıştırıyordu — kenarlarda boş siyah bant kalıyordu.
       Alan ±G.W×1.5'e yayıldı ve paralaks tabanı yükseltildi. */
    const rnd = mulberry32(9182);
    this.stars = [];
    for (let i=0;i<520;i++) this.stars.push({
      x: rnd()*G.W*3.0 - G.W*1.0, y: rnd()*G.H*3.0 - G.H*1.0,
      r: rnd()<.85 ? 1 : 2, a: .25 + rnd()*.6, p: .55 + rnd()*.40
    });
    window.addEventListener('resize', ()=>this.resize());
    this.bind();
  },
  resize(){
    this.dpr = Math.min(2, window.devicePixelRatio||1);
    this.vw = window.innerWidth; this.vh = window.innerHeight;
    this.cv.width = this.vw*this.dpr; this.cv.height = this.vh*this.dpr;
    this.cv.style.width = this.vw+'px'; this.cv.style.height = this.vh+'px';
    this.g.setTransform(this.dpr,0,0,this.dpr,0,0);
    this.g.imageSmoothingEnabled = false;
    UI.checkOrient();
  },
  fit(){
    const pad = 120;
    const z = Math.min((this.vw-320)/(G.W+pad), (this.vh-90)/(G.H+pad));
    this.cam.z = clamp(z, .035, .5);
    const h = G.sys[G.p.home];
    if (h){ this.cam.x = h.x; this.cam.y = h.y; this.cam.z = .40; }
  },
  w2s(x,y){ return {x:(x-this.cam.x)*this.cam.z + this.vw/2, y:(y-this.cam.y)*this.cam.z + this.vh/2}; },
  /* ═══ FAZ 47: YUMUŞAK KAYDIRMA + PING ═══
     Zoom'a DOKUNULMAZ. Kamera hedefe animasyonla süzülür. */
  panTo(x, y){
    this._pan = {x0:this.cam.x, y0:this.cam.y, x1:x, y1:y, t0:Date.now(), ms:520};
  },
  panStep(){
    const p = this._pan;
    if (!p) return;
    const k = Math.min(1, (Date.now() - p.t0) / p.ms);
    /* easeOutCubic — sonda yumuşak durur */
    const e = 1 - Math.pow(1 - k, 3);
    this.cam.x = p.x0 + (p.x1 - p.x0) * e;
    this.cam.y = p.y0 + (p.y1 - p.y0) * e;
    if (k >= 1) this._pan = null;
  },
  ping(sy){
    if (!sy) return;
    this._pings = this._pings || [];
    this._pings.push({x:sy.x, y:sy.y, t0:Date.now(), ms:4000});
    if (this._pings.length > 4) this._pings.shift();
  },
  drawPings(g, t){
    if (!this._pings || !this._pings.length) return;
    const now = Date.now();
    for (let i = this._pings.length - 1; i >= 0; i--){
      const pg = this._pings[i];
      const k = (now - pg.t0) / pg.ms;
      if (k >= 1){ this._pings.splice(i, 1); continue; }
      /* FAZ 47: ping ekran dışındaysa atlanır — ama frustum
         payı dar olduğu için kaydırma sürerken halka kaybolmasın
         diye geniş bir pay kullanılır. */
      const pp = this.w2s(pg.x, pg.y);
      if (pp.x < -80 || pp.y < -80 || pp.x > this.vw+80 || pp.y > this.vh+80) continue;
      const p = pp;
      /* Üç iç içe halka, dışa doğru genişleyip sönüyor */
      g.save();
      for (let q = 0; q < 3; q++){
        const faz = (k * 3 + q * .33) % 1;
        const r = 12 + faz * 34;
        const a = (1 - faz) * (1 - k) * .9;
        if (a <= .02) continue;
        g.strokeStyle = 'rgba(111,242,200,' + a.toFixed(2) + ')';
        g.lineWidth = 2.2;
        g.beginPath(); g.arc(p.x, p.y, r, 0, Math.PI*2); g.stroke();
      }
      /* Merkez nokta — nabız */
      const nb = .5 + .5 * Math.sin(t / 120);
      g.fillStyle = 'rgba(111,242,200,' + (nb * (1-k)).toFixed(2) + ')';
      g.beginPath(); g.arc(p.x, p.y, 3.5, 0, Math.PI*2); g.fill();
      g.restore();
    }
  },

  /* ---------- SINIR KATMANI ----------
     Dünya bir ızgaraya bölünür, her hücrenin sahibi bulunur ve
     bölgeler imparatorluk renginde doldurulup kenarları çizilir. */
  bcache:null, bkey:'',
  rgbOf(hexs){
    const h = hexs.replace('#','');
    return [parseInt(h.substr(0,2),16), parseInt(h.substr(2,2),16), parseInt(h.substr(4,2),16)];
  },
  buildBorders(){
    const N = 240;
    let key = '';
    for (const s of G.sys) key += s.owner + ':' + ((s._reach|0)/10|0) + ':' + (pSeen(s)?1:0) + ',';
    if (this.bkey === key && this.bcache) return this.bcache;

    const c = document.createElement('canvas');
    c.width = N; c.height = N;
    const g = c.getContext('2d');
    const img = g.createImageData(N,N);
    const D = img.data;
    const own = new Int16Array(N*N).fill(-1);
    const best = new Float32Array(N*N).fill(2);
    const cw = G.W/N, chh = G.H/N;

    // yalnızca sahipli sistemleri gez (hızlı)
    const list = [];
    // yalnızca KEŞFEDİLMİŞ sistemlerin sınırları görünür (savaş sisi)
    for (const s of G.sys) if (s.owner >= 0 && s._reach > 0 && pSeen(s)) list.push(s);

    for (const s of list){
      const r = s._reach;
      const x0 = Math.max(0, Math.floor((s.x-r)/cw)),  x1 = Math.min(N-1, Math.ceil((s.x+r)/cw));
      const y0 = Math.max(0, Math.floor((s.y-r)/chh)), y1 = Math.min(N-1, Math.ceil((s.y+r)/chh));
      for (let y=y0;y<=y1;y++) for (let x=x0;x<=x1;x++){
        const wx = (x+.5)*cw, wy = (y+.5)*chh;
        const dx = s.x-wx, dy = s.y-wy;
        const d = Math.sqrt(dx*dx+dy*dy);
        // organik kenar: yarıçapı gürültüyle dalgalandır (yuvarlak baloncuk hissini kırar)
        const wob = .84 + fbm(wx*.0035, wy*.0035, 1337, 3) * .34;
        const rr = r * wob;
        if (d > rr) continue;
        const score = d/rr;
        const idx = y*N+x;
        if (own[idx] < 0 || score < best[idx]){
          own[idx] = s.owner;
          best[idx] = score;
        }
      }
    }

    for (let y=0;y<N;y++) for (let x=0;x<N;x++){
      const idx = y*N+x, o = own[idx];
      if (o < 0) continue;
      const emp = G.emps[o];
      if (!emp) continue;
      const col = this.rgbOf(emp.col);
      // kaç komşu farklı? kenar yumuşaklığı buna göre ayarlanır
      let diff = 0, checked = 0;
      if (x > 0){   checked++; if (own[idx-1] !== o) diff++; }
      if (x < N-1){ checked++; if (own[idx+1] !== o) diff++; }
      if (y > 0){   checked++; if (own[idx-N] !== o) diff++; }
      if (y < N-1){ checked++; if (own[idx+N] !== o) diff++; }
      if (checked < 4) diff = Math.max(diff, 1);
      const sc = best[idx];                    // 0 merkez → 1 kenar
      const i = idx*4;
      D[i]=col[0]; D[i+1]=col[1]; D[i+2]=col[2];
      if (diff > 0){
        D[i+3] = Math.min(255, 150 + diff*38); // sınır çizgisi
      } else {
        // merkeze doğru hafifçe koyulaşan yumuşak dolgu
        D[i+3] = 24 + Math.round((1 - sc) * 26);
      }
    }
    g.putImageData(img,0,0);

    // iki geçişli yumuşatma: küçük tuvale küçültüp geri büyütmek kenarları eritir
    try {
      const soft = document.createElement('canvas');
      soft.width = N; soft.height = N;
      const sg = soft.getContext('2d');
      sg.imageSmoothingEnabled = true;
      sg.imageSmoothingQuality = 'high';
      sg.drawImage(c, 0, 0, N*0.5, N*0.5);
      sg.clearRect(0, 0, N, N);
      sg.drawImage(c, 0, 0, N*0.5, N*0.5);
      g.clearRect(0, 0, N, N);
      g.imageSmoothingEnabled = true;
      g.drawImage(soft, 0, 0, N*0.5, N*0.5, 0, 0, N, N);
    } catch(e){}
    this.bcache = c; this.bkey = key;
    return c;
  },
  s2w(x,y){ return {x:(x-this.vw/2)/this.cam.z + this.cam.x, y:(y-this.vh/2)/this.cam.z + this.cam.y}; },

  /* ---------- girdi ---------- */
  bind(){
    const cv = this.cv;
    let pts = new Map(), last = null, moved = 0, t0 = 0, pinch = null;
    const pos = ev => ({x:ev.clientX, y:ev.clientY});

    cv.addEventListener('pointerdown', ev => {
      cv.setPointerCapture(ev.pointerId);
      pts.set(ev.pointerId, pos(ev));
      if (pts.size === 1){ last = pos(ev); moved = 0; t0 = performance.now(); }
      else if (pts.size === 2){
        const [a,b] = [...pts.values()];
        pinch = {d: Math.hypot(a.x-b.x, a.y-b.y), z: this.cam.z,
                 mx:(a.x+b.x)/2, my:(a.y+b.y)/2};
      }
    });
    cv.addEventListener('pointermove', ev => {
      if (!pts.has(ev.pointerId)) return;
      pts.set(ev.pointerId, pos(ev));
      if (pts.size === 2 && pinch){
        const [a,b] = [...pts.values()];
        const d = Math.hypot(a.x-b.x, a.y-b.y);
        /* FAZ 44: pinch-zoom mobilde asıl kullanılan yol —
           tekerlekle aynı sınıra çekildi (0.07 → 0.035). */
        const nz = clamp(pinch.z * (d/pinch.d), .035, 1.9);
        const mid = this.s2w((a.x+b.x)/2, (a.y+b.y)/2);
        this.cam.z = nz;
        const mid2 = this.s2w((a.x+b.x)/2, (a.y+b.y)/2);
        this.cam.x += mid.x-mid2.x; this.cam.y += mid.y-mid2.y;
        moved = 99;
      } else if (pts.size === 1 && last){
        const p = pos(ev);
        const dx = p.x-last.x, dy = p.y-last.y;
        moved += Math.hypot(dx,dy);
        this.cam.x -= dx/this.cam.z; this.cam.y -= dy/this.cam.z;
        /* ═══ FAZ 44: KAMERA SERBESTİSİ ═══
           ÖLÇÜM: ±400 pan sınırı ULU/halka haritalarda kenardaki
           sistemleri kutu gibi kesiyordu. Sınır artık harita
           boyutuyla ölçekleniyor (en az 1000 px dışarı). */
        const panPad = Math.max(1000, G.W * .18);
        this.cam.x = clamp(this.cam.x, -panPad, G.W + panPad);
        this.cam.y = clamp(this.cam.y, -panPad, G.H + panPad);
        last = p;
      }
    });
    const up = ev => {
      if (pts.size === 1 && moved < 14 && performance.now()-t0 < 420){
        this.tap(pos(ev));
      }
      pts.delete(ev.pointerId);
      if (pts.size < 2) pinch = null;
      if (pts.size === 1) last = [...pts.values()][0];
      if (pts.size === 0) last = null;
    };
    cv.addEventListener('pointerup', up);
    cv.addEventListener('pointercancel', ev => { pts.delete(ev.pointerId); pinch = null; });
    cv.addEventListener('wheel', ev => {
      ev.preventDefault();
      const before = this.s2w(ev.clientX, ev.clientY);
      /* FAZ 44: min zoom 0.07 → 0.035. ULU halka haritada tüm
         galaksiyi tek ekranda görmek 0.061 gerektiriyordu. */
      this.cam.z = clamp(this.cam.z * (ev.deltaY < 0 ? 1.14 : .88), .035, 1.9);
      const after = this.s2w(ev.clientX, ev.clientY);
      this.cam.x += before.x-after.x; this.cam.y += before.y-after.y;
    }, {passive:false});
  },

  hit(sp){
    const w = this.s2w(sp.x, sp.y);
    const R = 34/this.cam.z;
    // dokunma menzilindeki TÜM filolar (üst üste duranlar dahil)
    const near = [];
    for (const f of G.fleets){
      if (!f.ships.length) continue;
      if (f.e !== 0 && !this.fleetVisible(f)) continue;
      const d = Math.hypot(f.x-w.x, f.y-w.y);
      if (d < R) near.push({f, d});
    }
    near.sort((a,b)=>{
      const oa = (a.f.e === 0) ? 0 : 1, ob = (b.f.e === 0) ? 0 : 1;
      return (oa - ob) || (a.d - b.d);
    });
    let bf = near.length ? near[0].f : null;
    // aynı noktada birden fazla filo varsa her dokunuşta sıradakine geç
    if (near.length > 1 && this.sel){
      const idx = near.findIndex(n => n.f === this.sel);
      if (idx >= 0) bf = near[(idx + 1) % near.length].f;
    }
    this.hitCount = near.length;
    let bs = null, bsd = R;
    for (const s of G.sys){
      if (!pSeen(s)) continue;
      const d = Math.hypot(s.x-w.x, s.y-w.y);
      if (d < bsd){ bsd = d; bs = s; }
    }
    return {f:bf, s:bs};
  },
  fleetVisible(f){
    if (f.e === 0) return true;
    if (f.sys >= 0) return pVis(G.sys[f.sys]);
    return f.mv && (pVis(G.sys[f.mv.from]) || pVis(G.sys[f.mv.to]));
  },

  tap(sp){
    const {f, s} = this.hit(sp);
    const now = performance.now();
    const dbl = (now - (this._lastTap||0) < 320) && this._lastPt &&
                Math.hypot(sp.x-this._lastPt.x, sp.y-this._lastPt.y) < 26;
    this._lastTap = now; this._lastPt = {x:sp.x, y:sp.y};

    // çift dokunuş: filoları atla, doğrudan sistem paneline gir
    if (dbl && s && !this.route){
      this.selSys = s;
      UI.tab('sistem');
      UI.refresh();
      return;
    }
    /* FAZ 50: Panoptikon yeniden hedefleme */
    if (this.panoptFor !== undefined && s){
      const kay = this.panoptFor;
      this.panoptFor = undefined;
      const r = (typeof panopticonLock === 'function')
        ? panopticonLock(G.p, kay, s.id) : {ok:false, why:'—'};
      if (!r.ok) say(r.why, 'war');
      UI.refresh();
      return;
    }

    /* ═══ FAZ 48: TOPLANMA NOKTASI SEÇİMİ ═══
       rallyFor açıkken haritadan seçilen sistem o filonun
       toplanma noktası olur; üretilen gemiler oraya intikal eder. */
    if (this.rallyFor !== undefined && s){
      const fl = G.fleets.find(q => q.id === this.rallyFor);
      this.rallyFor = undefined;
      if (fl){
        fl.rallyAt = s.id;
        /* Filonun bulunduğu/gittiği sistemin tersanelerine kaydet */
        const kaynak = fl.sys >= 0 ? G.sys[fl.sys] : (fl.mv ? G.sys[fl.mv.to] : null);
        if (kaynak && typeof setRally === 'function') setRally(G.p, kaynak, s.id);
        for (const sy of G.sys){
          if (sy.owner !== 0) continue;
          if (typeof hasStructYard === 'function' && !hasStructYard(sy) &&
              !(sy.built && sy.built.tersane)) continue;
          sy.rally = sy.rally || {};
          sy.rally[0] = {fleet: fl.id, sys: s.id};
        }
        say('📍 Toplanma noktası: ' + s.name + ' — yeni gemiler oraya gidecek', 'sci');
      }
      UI.refresh();
      return;
    }

    if (this.sel && this.route && s){
      if (orderMove(this.sel, s.id, this.routed)){
        if (!this.routed) this.sel.ord = null;
        this.routed = true;
        UI.pulse(s);
        UI.refresh();
      }
      return;
    }
    if (f && f.e === 0){
      this.sel = f; this.selSys = null;
      if (this.hitCount > 1) UI.alert(this.hitCount + ' filo üst üste — tekrar dokun, sıradakine geç');
      UI.tab('filo'); UI.refresh(); return;
    }
    if (s){ this.selSys = s; if (!this.route) this.sel = null; UI.tab('sistem'); UI.refresh(); return; }
    this.sel = null; this.selSys = null; this.route = false; UI.refresh();
  },

  center(x,y){ this.cam.x = x; this.cam.y = y; },

  /* ---------- çizim ---------- */
  /* ═══ FAZ 21: GÖRÜŞ ALANI (FRUSTUM CULLING) ═══
     Kameranın dışındaki sistemlere hiç çizim komutu gönderilmez.
     Sınırlar DÜNYA koordinatında bir kez hesaplanır; her sistem
     için ekran dönüşümü yapmak yerine ucuz bir kutu testi yapılır.
     Pay (margin) kenardaki halkalar ve etiketler kırpılmasın diye. */
  updateFrustum(){
    const z = this.cam.z;
    /* ═══════════════════════════════════════════════════════════
       FAZ 45 — SİYASİ HARİTA MODU (LOD)
       ÖLÇÜM: kamera 0.035'e açılınca ekrana daha çok sistem
       giriyor ve çizim yükü ARTIYORDU (0.167 → 0.533 ms,
       45 → 808 çizim komutu). Faz 44'te kamerayı serbest
       bıraktım, şimdi bedelini ödüyorum.
       z < 0.05'te detaylar kapanır, yalnız çekirdek noktalar ve
       hakimiyet renkleri kalır — galaksi bir siyasi haritaya
       dönüşür. */
    this.politik = z < .05;
    const pay = 90 / Math.max(.02, z);        // dünya birimi cinsinden pay
    const halfW = this.vw / 2 / Math.max(.02, z);
    const halfH = this.vh / 2 / Math.max(.02, z);
    this.fx0 = this.cam.x - halfW - pay;
    this.fx1 = this.cam.x + halfW + pay;
    this.fy0 = this.cam.y - halfH - pay;
    this.fy1 = this.cam.y + halfH + pay;
    this.culled = 0; this.drawn = 0;
  },
  inView(x, y){
    return x >= this.fx0 && x <= this.fx1 && y >= this.fy0 && y <= this.fy1;
  },
  /* Yol testi: iki uçtan biri görünürse çiz. İkisi de dışarıdaysa
     ama yol ekranı KESİYORSA da çizilmeli — kaba kutu kesişimi. */
  laneInView(a, b){
    if (this.inView(a.x, a.y) || this.inView(b.x, b.y)) return true;
    const lx0 = Math.min(a.x, b.x), lx1 = Math.max(a.x, b.x);
    const ly0 = Math.min(a.y, b.y), ly1 = Math.max(a.y, b.y);
    return !(lx1 < this.fx0 || lx0 > this.fx1 || ly1 < this.fy0 || ly0 > this.fy1);
  },

  draw(t){
    const g = this.g;
    this.panStep();                     // FAZ 47: yumuşak kaydırma
    const z = this.cam.z;
    this.updateFrustum();
    g.fillStyle = '#05070f';
    g.fillRect(0,0,this.vw,this.vh);

    // bulutsu
    if (G.nebula && !BG_OFF){
      const a = this.w2s(0,0), b = this.w2s(G.W,G.H);
      g.globalAlpha = .55;
      g.imageSmoothingEnabled = true;
      g.drawImage(G.nebula, a.x, a.y, b.x-a.x, b.y-a.y);
      g.imageSmoothingEnabled = false;
      g.globalAlpha = 1;
    }
    // yıldız tozu (paralaks)
    if (!BG_OFF) for (const s of this.stars){
      const px = (s.x-this.cam.x)*z*s.p + this.vw/2;
      const py = (s.y-this.cam.y)*z*s.p + this.vh/2;
      if (px<-4||py<-4||px>this.vw+4||py>this.vh+4) continue;
      g.fillStyle = 'rgba(200,225,255,'+s.a+')';
      g.fillRect(px|0, py|0, s.r, s.r);
    }

    // imparatorluk sınırları (renkli bölgeler + kenar çizgileri)
    const bmap = this.buildBorders();
    if (bmap){
      const a0 = this.w2s(0,0), b0 = this.w2s(G.W,G.H);
      g.save();
      g.imageSmoothingEnabled = true;
      g.globalAlpha = .92;
      g.drawImage(bmap, a0.x, a0.y, b0.x-a0.x, b0.y-a0.y);
      g.globalAlpha = 1;
      g.imageSmoothingEnabled = false;
      g.restore();
    }

    // imparatorluk adları — kendi renkli bölgesinin merkezinde
    if (z > .10){
      const cen = {};
      for (const sy of G.sys){
        if (sy.owner < 0 || !pSeen(sy)) continue;
        const o = cen[sy.owner] || (cen[sy.owner] = {x:0, y:0, n:0});
        o.x += sy.x; o.y += sy.y; o.n++;
      }
      for (const id in cen){
        const c2 = cen[id];
        if (c2.n < 1) continue;
        const emp = G.emps[id];
        if (!emp) continue;
        const p2 = this.w2s(c2.x/c2.n, c2.y/c2.n);
        if (p2.x < -80 || p2.y < -40 || p2.x > this.vw+80 || p2.y > this.vh+40) continue;
        // az sistem görünüyorsa yalnızca kısaltma yaz
        const wide = z > .26 && c2.n >= 2;
        const label = wide ? emp.name.toUpperCase()
                           : (RACES[emp.race] ? RACES[emp.race].kisa.toUpperCase() : '?');
        const fs = wide ? Math.round(clamp(11 + z*8, 11, 17)) : Math.round(clamp(10 + z*6, 10, 14));
        g.save();
        g.font = 'bold ' + fs + 'px ui-monospace,monospace';
        g.textAlign = 'center';
        g.letterSpacing = '2px';
        // arkasına koyu gölge, okunabilirlik için
        g.lineWidth = 4;
        g.strokeStyle = 'rgba(5,7,15,.85)';
        g.strokeText(label, p2.x, p2.y);
        g.fillStyle = emp.col;
        g.globalAlpha = .78;
        g.fillText(label, p2.x, p2.y);
        g.globalAlpha = 1;
        g.restore();
      }
    }

    // hiper yollar
    g.lineWidth = Math.max(.6, 1.1*Math.min(1,z*3));
    for (const s of G.sys){
      for (const l of s.lanes){
        if (l < s.id) continue;
        const o = G.sys[l];
        if (!this.laneInView(s, o)) continue;      // FAZ 21: culling
        const seenA = pSeen(s), seenB = pSeen(o);
        if (!seenA && !seenB) continue;
        const a = this.w2s(s.x,s.y), b = this.w2s(o.x,o.y);
        if ((a.x<0&&b.x<0)||(a.y<0&&b.y<0)||(a.x>this.vw&&b.x>this.vw)||(a.y>this.vh&&b.y>this.vh)) continue;
        const both = seenA && seenB;
        if (s.owner >= 0 && s.owner === o.owner && both){
          g.strokeStyle = G.emps[s.owner].col + '55';
        } else g.strokeStyle = both ? 'rgba(120,150,190,.24)' : 'rgba(90,110,140,.10)';
        g.beginPath(); g.moveTo(a.x,a.y); g.lineTo(b.x,b.y); g.stroke();
      }
    }

    // ticaret hatları (yalnız oyuncunun)
    if (G.p && G.p.trade && G.p.trade.links && z > .13){
      for (const L of G.p.trade.links){
        // rota hiper yolları takip eder — uzak sistemler arası düz atlama yok
        const nodes = (L.path && L.path.length > 1) ? L.path : [L.a, L.b];
        const pts = nodes.map(id => this.w2s(G.sys[id].x, G.sys[id].y));
        const a = pts[0], b = pts[pts.length-1];
        if ((a.x<0&&b.x<0)||(a.y<0&&b.y<0)||(a.x>this.vw&&b.x>this.vw)||(a.y>this.vh&&b.y>this.vh)) continue;
        g.save();
        g.lineWidth = 2.4;
        if (L.raided){
          g.strokeStyle = 'rgba(255,95,109,.55)';
          g.setLineDash([2,3]);
        } else if (L.bl){
          g.strokeStyle = 'rgba(255,95,109,.42)';
          g.setLineDash([3,4]);
        } else {
          const heavy = (L.vol || 0) > 40;
          g.strokeStyle = heavy ? 'rgba(242,212,82,.46)' : 'rgba(242,212,82,.28)';
          g.lineWidth = heavy ? 3.2 : 2.4;
          g.setLineDash([]);
        }
        g.beginPath();
        pts.forEach((q,qi)=>{ qi ? g.lineTo(q.x,q.y) : g.moveTo(q.x,q.y); });
        g.stroke();
        if (L.bl){
          const midP = pts[Math.floor(pts.length/2)] || a;
          const mx = midP.x, my = midP.y;
          g.setLineDash([]);
          g.strokeStyle = '#ff5f6d'; g.lineWidth = 1.8;
          g.beginPath();
          g.moveTo(mx-4,my-4); g.lineTo(mx+4,my+4);
          g.moveTo(mx+4,my-4); g.lineTo(mx-4,my+4);
          g.stroke();
        } else if (z > .22){
          // hat üzerinde gidip gelen sivil ticaret konvoyları
          const seed = (L.a*37 + L.b*11) % 100;
          const hops = (L.path ? L.path.length - 1 : 1);
          const per = (3400 + (seed % 7) * 500) * Math.max(1, hops * .8);
          const cars = (L.vol||0) > 60 ? 3 : (L.vol||0) > 25 ? 2 : 1;
          for (let k=0;k<cars;k++){
            let tt = ((t + seed*90 + k*per/cars) % per) / per;
            const fwd = k === 0;
            const u = clamp(fwd ? tt : 1 - tt, 0, 1);
            const segs = Math.max(1, pts.length - 1);
            const fpos = u * segs;
            const si = Math.min(segs - 1, Math.floor(fpos));
            const sf = fpos - si;
            const q1 = pts[si], q2 = pts[si+1] || pts[si];
            const px = lerp(q1.x, q2.x, sf), py = lerp(q1.y, q2.y, sf);
            g.setLineDash([]);
            g.fillStyle = 'rgba(242,212,82,.95)';
            g.fillRect(px-1.5, py-1.5, 3, 3);
            g.fillStyle = 'rgba(242,212,82,.28)';
            g.fillRect(px-3, py-3, 6, 6);
          }
        }
        g.restore();
      }
      g.setLineDash([]);
    }

    // seçili filo rotası
    if (this.sel){
      const f = this.sel;
      const nodes = [];
      if (f.mv) nodes.push({x:f.x, y:f.y});
      else if (f.sys>=0) nodes.push({x:G.sys[f.sys].x, y:G.sys[f.sys].y});
      f.path.forEach(id => nodes.push({x:G.sys[id].x, y:G.sys[id].y}));
      if (nodes.length > 1){
        g.strokeStyle = '#6ff2c8'; g.lineWidth = 1.4;
        g.setLineDash([5,5]); g.lineDashOffset = -(t/26)%10;
        g.beginPath();
        nodes.forEach((n,i)=>{ const p = this.w2s(n.x,n.y); i?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y); });
        g.stroke(); g.setLineDash([]);
        const last = this.w2s(nodes[nodes.length-1].x, nodes[nodes.length-1].y);
        g.strokeStyle = '#6ff2c8';
        g.beginPath(); g.arc(last.x,last.y,9,0,Math.PI*2); g.stroke();
      }
    }

    // sistemler
    const showName = z > .22;
    /* ═══════════════════════════════════════════════════════════
       FAZ 45 — SİYASİ HARİTA MODU (LOD)
       ÖLÇÜM: kamera 0.035'e açıldığında tüm sistemler kadraja
       giriyor ve kare başına 919 çizim işlemi birikiyordu
       (0.192 → 0.633 ms). Bu eşiğin altında detay çizilmez;
       yalnız çekirdek nokta + hakimiyet rengi kalır ve harita
       temiz bir siyasi görünüme döner. */
    const politik = z < .05;
    for (const s of G.sys){
      /* FAZ 21: dünya-uzayı testi ÖNCE — w2s dönüşümü bile yapılmaz.
         Eskiden her sistem için w2s hesaplanıp sonra eleniyordu. */
      if (!this.inView(s.x, s.y)){ this.culled++; continue; }
      const p = this.w2s(s.x,s.y);
      this.drawn++;
      const seen = pSeen(s), vis = pVis(s);
      if (!seen){
        g.fillStyle = 'rgba(90,110,150,.22)';
        g.beginPath(); g.arc(p.x,p.y,2,0,Math.PI*2); g.fill();
        continue;
      }
      const sr = Math.max(2.2, s.star.r*z*1.5);

      /* ═══ FAZ 45: SİYASİ HARİTA — ERKEN ÇIKIŞ ═══
         Bu eşiğin altında sistem tek bir noktadır. Sahipliyse
         imparatorluk renginde ve biraz büyük çizilir; böylece
         galaksinin siyasi dokusu tek bakışta okunur. Halkalar,
         enkaz işaretleri, bina/işçi göstergeleri, moral rozetleri
         ve filo modelleri hepsi atlanır. */
      if (politik){
        const sahip = s.owner >= 0 ? G.emps[s.owner] : null;
        if (sahip && !sahip.dead){
          /* FAZ 47: diplomatik modda renk ilişkiden gelir */
          if (MAP_MODE === 'diplomasi'){
            const dc = diploColor(sahip);
            const yanip = G.p.war[sahip.id]
              ? (.55 + .45 * Math.sin(t / 260)) : 1;
            g.globalAlpha = yanip;
            g.fillStyle = dc + '38';
            g.beginPath(); g.arc(p.x, p.y, 7, 0, Math.PI*2); g.fill();
            g.fillStyle = dc;
            g.beginPath(); g.arc(p.x, p.y, 2.6, 0, Math.PI*2); g.fill();
            g.globalAlpha = 1;
            continue;
          }
          /* Hakimiyet halesi — sınırları belirginleştirir */
          g.fillStyle = sahip.col + '38';
          g.beginPath(); g.arc(p.x, p.y, 7, 0, Math.PI*2); g.fill();
          g.fillStyle = sahip.col;
          g.beginPath(); g.arc(p.x, p.y, 2.6, 0, Math.PI*2); g.fill();
        } else {
          g.fillStyle = 'rgba(150,175,210,.55)';
          g.beginPath(); g.arc(p.x, p.y, 1.8, 0, Math.PI*2); g.fill();
        }
        continue;
      }

      /* ═══ FAZ 25: KIRIK DÜNYA İŞARETİ ═══
         Colossus ile parçalanmış gezegeni olan sistem, kızıl ve
         kesikli bir enkaz halkasıyla işaretlenir. Ucuz: tek arc +
         tek stroke, yalnız yakınlaştırmada ve yalnız o sistemlerde.
         s._shat önbelleği sayesinde gezegen dizisi her karede
         taranmaz — sadece bir kez, sonra bayrak okunur. */
      if (s._shat === undefined){
        s._shat = false;
        for (const pl2 of s.planets) if (pl2.shattered){ s._shat = true; break; }
      }
      /* ═══ FAZ 38: RADYASYON TEHLİKE HALKASI ═══
         Neon sarı-yeşil, kesikli, yavaşça dönen halka. Tek arc +
         tek stroke; z > .15 altında hiç çizilmiyor. Bayrak doğrudan
         sistem nesnesinde (s.radiation), önbellek taraması yok. */
      if (s.radiation && z > .15){
        const rr2 = sr + 9;
        g.save();
        g.strokeStyle = 'rgba(214,240,60,.80)';
        g.lineWidth = Math.max(1, z * 1.3);
        g.setLineDash([4, 5]);
        g.lineDashOffset = -(t / 160) % 9;      // yavaş dönüş
        g.beginPath(); g.arc(p.x, p.y, rr2, 0, Math.PI * 2); g.stroke();
        g.setLineDash([]);
        /* İç titreşim — nabız gibi */
        const nabiz = .18 + .12 * Math.sin(t / 420 + s.id);
        g.fillStyle = 'rgba(160,220,70,' + nabiz.toFixed(2) + ')';
        g.beginPath(); g.arc(p.x, p.y, rr2 * .60, 0, Math.PI * 2); g.fill();
        g.restore();
      }

      if (s._shat && z > .22){
        /* ═══ FAZ 35: İKİ TÜR ENKAZ ═══
           Colossus enkazı kızıl ve kesikli (patlama).
           Sürü enkazı mor-yeşil ve dalgalı (biyolojik çürüme).
           Ayrım önbellekte tutuluyor, her karede taranmıyor. */
        if (s._shatBio === undefined){
          s._shatBio = false;
          for (const pl2 of s.planets)
            if (pl2.devoured !== undefined){ s._shatBio = true; break; }
        }
        const rr = sr + 6;
        g.save();
        if (s._shatBio){
          /* Biyolojik enkaz: mor halka + yeşil spor bulutu */
          g.strokeStyle = 'rgba(160,60,200,.85)';
          g.lineWidth = Math.max(1, z * 1.2);
          g.setLineDash([2, 3]);
          g.beginPath(); g.arc(p.x, p.y, rr, 0, Math.PI * 2); g.stroke();
          g.setLineDash([]);
          g.fillStyle = 'rgba(70,150,90,.20)';
          g.beginPath(); g.arc(p.x, p.y, rr * .74, 0, Math.PI * 2); g.fill();
          /* Dışa saçılan sporlar — üç kısa çizgi, ucuz */
          g.strokeStyle = 'rgba(120,220,140,.45)';
          g.lineWidth = Math.max(1, z * .7);
          for (let q = 0; q < 3; q++){
            const a2 = (t / 900 + q * 2.09 + s.id) % 6.283;
            g.beginPath();
            g.moveTo(p.x + Math.cos(a2) * rr * .8, p.y + Math.sin(a2) * rr * .8);
            g.lineTo(p.x + Math.cos(a2) * rr * 1.25, p.y + Math.sin(a2) * rr * 1.25);
            g.stroke();
          }
        } else {
          g.strokeStyle = 'rgba(190,70,60,.85)';
          g.lineWidth = Math.max(1, z * 1.1);
          g.setLineDash([3, 4]);
          g.beginPath(); g.arc(p.x, p.y, rr, 0, Math.PI * 2); g.stroke();
          g.setLineDash([]);
          g.fillStyle = 'rgba(120,55,50,.22)';
          g.beginPath(); g.arc(p.x, p.y, rr * .72, 0, Math.PI * 2); g.fill();
        }
        g.restore();
      }

      const spr = ART.star(s.star.c, s.star.r);
      const sz = spr.width * clamp(z*1.5, .28, 1.5);
      g.globalAlpha = vis ? 1 : .48;
      g.imageSmoothingEnabled = true;
      g.drawImage(spr, p.x-sz/2, p.y-sz/2, sz, sz);
      g.imageSmoothingEnabled = false;

      if (s.owner >= 0){
        g.strokeStyle = G.emps[s.owner].col; g.lineWidth = 1.4;
        g.beginPath(); g.arc(p.x,p.y, sr+6, 0, Math.PI*2); g.stroke();
      }
      // taranmamış işareti
      if (!pSurv(s) && z > .2){
        g.fillStyle = 'rgba(139,123,255,.9)';
        g.font = 'bold 9px ui-monospace,monospace'; g.textAlign='center';
        g.fillText('?', p.x, p.y - sr - 7);
      }
      /* FAZ 17: ANOMALİ İŞARETİ
         Anomali yalnızca sistem GÖRÜLDÜĞÜNDE ama HENÜZ TARANMADIĞINDA
         belli olur — keşif merakını canlı tutar. Nabız gibi atar. */
      if (s.anom && pSeen(s) && !pSurv(s) && z > .18){
        const puls = .55 + .45 * Math.sin(t / 380 + s.id);
        /* Tür rengi: oyuncu neyle karşılaşacağını sezsin */
        const AK = (typeof ANOM_KINDS !== 'undefined' && ANOM_KINDS[s.anomK])
          ? ANOM_KINDS[s.anomK] : null;
        /* HOTFIX 23.1 — SİYAH EKRANIN SEBEBİ BURASIYDI.
           hex() ART modülünün IIFE kapsamı içinde tanımlı; View.draw
           içinden erişilemiyor ve "hex is not defined" fırlatıyordu.
           Hata yalnızca GÖRÜLMÜŞ ama TARANMAMIŞ bir anomali ekranda
           olduğunda tetiklendiği için oyunun 3-4. ayında ortaya
           çıkıyor ve o karede tüm çizimi öldürüyordu.
           ART.hexOf üzerinden güvenli erişim + yedek renk. */
        let arc = [255, 155, 61];
        if (AK && AK.col){
          if (typeof ART !== 'undefined' && typeof ART.hexOf === 'function')
            arc = ART.hexOf(AK.col) || arc;
        }
        g.strokeStyle = 'rgba(' + arc.join(',') + ',' + (puls * .9).toFixed(2) + ')';
        g.lineWidth = 1.4;
        g.beginPath(); g.arc(p.x, p.y, sr + 9, 0, Math.PI * 2); g.stroke();
        if (z > .30){
          g.fillStyle = 'rgba(255,155,61,' + puls.toFixed(2) + ')';
          g.font = 'bold 10px ui-monospace,monospace'; g.textAlign = 'center';
          g.fillText('◈', p.x, p.y + sr + (showName ? 24 : 12));
        }
      }
      if (s.queue.length && s.owner===0 && z>.22){
        g.fillStyle = '#ff9b3d';
        g.fillRect(p.x+sr+3, p.y-2, 3, 4);
      }
      if (showName){
        g.font = '9px ui-monospace,monospace'; g.textAlign = 'center';
        /* FAZ 47: sistem adı da diplomatik moda uyar */
        g.fillStyle = s.owner>=0
          ? ((MAP_MODE === 'diplomasi') ? diploColor(G.emps[s.owner]) : G.emps[s.owner].col)
          : 'rgba(190,210,235,.72)';
        g.fillText(s.name, p.x, p.y + sr + 13);
        if (pSurv(s) && z > .42){
          const hab = s.planets.filter(pl=>PLANETS[pl.t].k==='hab').length;
          if (hab){
            g.fillStyle = 'rgba(101,224,138,.85)'; g.font='8px ui-monospace,monospace';
            g.fillText('◍'.repeat(Math.min(hab,4)), p.x, p.y + sr + 22);
          }
        }
      }
      // sistem dayanıklılığı: savunma + koloni morali
      const sdef = sysDefense(s);
      if (seen && z > .19 && (sdef > 0 || s.cr > 0)){
        let stabSum = 0, cols = 0;
        for (const pp of s.planets) if (pp.col){ stabSum += pp.col.stab; cols++; }
        const morale = cols ? stabSum/cols/100 : 1;
        const bw = 30, bx = p.x - bw/2;
        let by = p.y - sr - 16;
        // savunma çubuğu
        if (sdef > 0){
          const full = clamp(sdef/720, 0, 1);
          g.fillStyle = 'rgba(5,7,15,.9)'; g.fillRect(bx-1, by-1, bw+2, 5);
          g.fillStyle = '#6ff2c8'; g.fillRect(bx, by, bw*full, 3);
          g.strokeStyle = 'rgba(120,150,190,.55)'; g.lineWidth = .6;
          g.strokeRect(bx-1, by-1, bw+2, 5);
          if (z > .4){
            g.font = '7px ui-monospace,monospace'; g.textAlign = 'right';
            g.fillStyle = '#6ff2c8'; g.fillText('KLK', bx-3, by+4);
          }
          by -= 7;
        }
        // moral çubuğu — çatışmada veya moral düşükken görünür
        if (cols && (s.cr > 0 || morale < .55)){
          g.fillStyle = 'rgba(5,7,15,.9)'; g.fillRect(bx-1, by-1, bw+2, 5);
          g.fillStyle = morale > .55 ? '#65e08a' : morale > .28 ? '#ff9b3d' : '#ff5f6d';
          g.fillRect(bx, by, bw*clamp(morale,0,1), 3);
          g.strokeStyle = 'rgba(120,150,190,.55)'; g.lineWidth = .6;
          g.strokeRect(bx-1, by-1, bw+2, 5);
          if (z > .4){
            g.font = '7px ui-monospace,monospace'; g.textAlign = 'right';
            g.fillStyle = g.fillStyle; g.fillText('MRL', bx-3, by+4);
          }
          if (morale < .28 && s.cr > 0 && z > .3){
            g.font = 'bold 8px ui-monospace,monospace'; g.textAlign = 'center';
            g.fillStyle = '#ff5f6d';
            g.fillText('TESLİM RİSKİ', p.x, by - 4);
          }
        }
        g.textAlign = 'center';
      }
      /* ═══ FAZ 47: TERSANE GÖSTERGESİ ═══
         Kendi sistemlerinde daima; yabancı sistemlerde yalnız
         2. seviye istihbaratla görünür. Tersane sayısı gemi
         inşa kapasitesini gösterir — düşmanın nerede filo
         basabildiğini bilmek stratejik bilgidir. */
      if (seen && z > .26){
        let yard = 0;
        for (const pl2 of s.planets)
          if (pl2.col && pl2.col.b && pl2.col.b.tersane) yard += pl2.col.b.tersane;
        if (yard > 0){
          const bizim = s.owner === 0;
          const lvl2 = bizim ? 3
            : (typeof intelOf === 'function' && s.owner >= 0 ? intelOf(G.p, s.owner) : 0);
          if (bizim || lvl2 >= 2){
            g.font = '10px ui-monospace,monospace';
            g.textAlign = 'right';
            g.fillStyle = bizim ? 'rgba(111,242,200,.85)' : 'rgba(255,155,61,.85)';
            g.fillText('⚓×' + yard, p.x - sr - 5, p.y - 3);
            g.textAlign = 'center';
          }
        }
      }

      // uzay yapıları rozeti
      /* ═══ FAZ 47: TERSANE GÖSTERGESİ ═══
         Sistem adının sağ üstünde ⚓ ×N. Kendi sistemlerimizde
         daima, yabancıda 2. seviye istihbaratla. */
      if (seen && z > .20 && typeof yardCount === 'function'){
        const yn = yardCount(s);
        if (yn > 0 && yardVisible(s)){
          g.save();
          g.font = '10px ui-monospace,monospace';
          g.textAlign = 'left';
          const yazi = '⚓×' + yn;
          const w = g.measureText(yazi).width;
          g.fillStyle = 'rgba(6,10,18,.70)';
          g.fillRect(p.x + sr + 3, p.y - sr - 12, w + 6, 13);
          g.fillStyle = s.owner === 0 ? '#6ff2c8' : '#ff9b3d';
          g.fillText(yazi, p.x + sr + 6, p.y - sr - 2);
          g.restore();
          g.textAlign = 'center';
        }
      }

      if (seen && z > .22 && (s.built || (s.work && s.work.length))){
        const items = [];
        if (s.built) for (const k in s.built) if (STRUCTS[k] && s.built[k] !== undefined) items.push({ico:STRUCTS[k].ico, done:true, own:s.built[k]});
        if (s.work) s.work.forEach(w=>{ if (STRUCTS[w.key]) items.push({ico:STRUCTS[w.key].ico, done:false}); });
        g.font = '10px ui-monospace,monospace'; g.textAlign = 'left';
        items.slice(0,4).forEach((it,ix)=>{
          g.globalAlpha = it.done ? 1 : .55;
          g.fillStyle = it.done ? (G.emps[it.own] ? G.emps[it.own].col : '#6ff2c8') : '#ff9b3d';
          g.fillText(it.ico, p.x + sr + 5, p.y - 4 + ix*10);
        });
        g.globalAlpha = 1;
        g.textAlign = 'center';
      }
      // kayıp uygarlık kalıntısı
      if (s.ruin && seen){
        const ph3 = (Math.sin(t/420)+1)/2;
        g.strokeStyle = 'rgba(139,123,255,' + (.45+ph3*.4) + ')';
        g.lineWidth = 2;
        g.beginPath(); g.arc(p.x, p.y, sr+13, 0, Math.PI*2); g.stroke();
        if (z > .2){
          g.font = 'bold 12px ui-monospace,monospace'; g.textAlign = 'center';
          g.fillStyle = s.ruin.awake ? '#ff5f6d' : '#8b7bff';
          g.fillText('🏺', p.x, p.y - sr - 6);
        }
      }
      // korsan yuvası işareti
      if (s.nest && seen){
        const ph2 = (Math.sin(t/320)+1)/2;
        g.strokeStyle = 'rgba(138,47,63,' + (.5+ph2*.4) + ')';
        g.lineWidth = 2;
        g.beginPath(); g.arc(p.x, p.y, sr+11, 0, Math.PI*2); g.stroke();
        if (z > .2){
          g.font = 'bold 12px ui-monospace,monospace'; g.textAlign = 'center';
          g.fillStyle = '#ff5f6d';
          g.fillText('☠', p.x, p.y - sr - 6);
        }
      }
      // ÇATIŞMA İŞARETİ — sistemde savaş varsa çok belirgin göster
      if (s.cr > 0 && seen){
        const ph = (Math.sin(t/150)+1)/2;
        const rr = sr + 16 + ph*7;
        g.strokeStyle = 'rgba(255,95,109,' + (.55 + ph*.45) + ')';
        g.lineWidth = 2.4;
        g.beginPath(); g.arc(p.x, p.y, rr, 0, Math.PI*2); g.stroke();
        g.strokeStyle = 'rgba(255,155,61,' + (.25 + ph*.35) + ')';
        g.lineWidth = 1.4;
        g.beginPath(); g.arc(p.x, p.y, rr + 8, 0, Math.PI*2); g.stroke();
        if (z > .16){
          g.font = 'bold 15px ui-monospace,monospace';
          g.textAlign = 'center';
          g.fillStyle = 'rgba(255,95,109,' + (.7 + ph*.3) + ')';
          g.fillText('⚔', p.x, p.y - sr - 15);
          g.font = 'bold 8px ui-monospace,monospace';
          g.fillStyle = '#ff9b3d';
          g.fillText(RANGE_NAMES[s.cr] || '', p.x, p.y - sr - 27);
        }
      }
      if (this.selSys === s){
        g.strokeStyle = '#6ff2c8'; g.lineWidth = 1.6;
        const rr = sr+11 + Math.sin(t/260)*1.8;
        g.beginPath(); g.arc(p.x,p.y,rr,0,Math.PI*2); g.stroke();
      }
      g.globalAlpha = 1;
    }

    /* ═══════════════════════════════════════════════════════════
       FAZ 47 — ASKERİ MOD: İSTİHBARAT KADEMELİ ROTA VEKTÖRLERİ
       Seviye 0-1 → yalnız nokta, rota gizli
       Seviye 2   → hedef sistem + kesikli ok
       Seviye 3   → güç ve varış süresi (ETA) de listelenir
       Yalnız EKRANDA GÖRÜNEN hareketli filolar taranır. */
    if (MAP_MODE === 'askeri'){
      g.save();
      g.textAlign = 'left';
      g.textBaseline = 'middle';
      for (const f of G.fleets){
        if (!f.mv || !f.ships || !f.ships.length) continue;
        if (!this.fleetVisible(f)) continue;
        const p0 = this.w2s(f.x, f.y);
        if (p0.x < -60 || p0.y < -60 || p0.x > this.vw+60 || p0.y > this.vh+60) continue;

        const kendi = f.e === 0;
        const lvl = kendi ? 3
          : (typeof intelOf === 'function' ? intelOf(G.p, f.e) : 0);
        if (lvl < 2) continue;              // seviye 0-1: rota gizli

        const hedef = G.sys[f.mv.to];
        if (!hedef) continue;
        const p1 = this.w2s(hedef.x, hedef.y);
        const fe = G.emps[f.e];
        const renk = fe && !fe.dead ? fe.col : '#8fa8c8';

        /* Kesikli rota çizgisi */
        g.strokeStyle = renk;
        g.globalAlpha = .70;
        g.lineWidth = 1.3;
        g.setLineDash([4, 4]);
        g.lineDashOffset = -(t / 55) % 8;
        g.beginPath(); g.moveTo(p0.x, p0.y); g.lineTo(p1.x, p1.y); g.stroke();
        g.setLineDash([]);

        /* Ok ucu */
        const ang = Math.atan2(p1.y - p0.y, p1.x - p0.x);
        const ux = p1.x - Math.cos(ang) * 12, uy = p1.y - Math.sin(ang) * 12;
        g.fillStyle = renk;
        g.beginPath();
        g.moveTo(ux + Math.cos(ang)*8, uy + Math.sin(ang)*8);
        g.lineTo(ux + Math.cos(ang+2.6)*7, uy + Math.sin(ang+2.6)*7);
        g.lineTo(ux + Math.cos(ang-2.6)*7, uy + Math.sin(ang-2.6)*7);
        g.closePath(); g.fill();
        g.globalAlpha = 1;

        /* Etiket */
        if (z > .06){
          let etiket = (f.name || 'Filo') + ' ➔ ' + hedef.name;
          if (lvl >= 3){
            const guc = Math.round(fleetPower(f));
            const hiz = fleetSpeed(f);
            const kalan = Math.hypot(hedef.x - f.x, hedef.y - f.y);
            const eta = hiz > 0 ? Math.max(1, Math.round(kalan / hiz / 30)) : 0;
            etiket += '  ⚔' + guc + ' · ' + eta + ' ay';
          }
          /* ═══ FAZ 55: ROTA ÜSTÜNDE TEDARİK ═══
             Kendi filolarımızda daima; düşmanda 3. seviye
             istihbaratla. Zayıf hat kırmızı yazılır. */
          let supRenk = null;
          if (typeof fleetSupply === 'function' && (kendi || lvl >= 3)){
            const sup = fleetSupply(fe, f);
            if (sup < 1){
              etiket += '  📦%' + Math.round(sup * 100);
              supRenk = sup >= .7 ? '#f2d452' : sup >= .55 ? '#ff9b3d' : '#ff5f6d';
            }
          }
          g.font = '10px ui-monospace,monospace';
          const w = g.measureText(etiket).width;
          g.fillStyle = 'rgba(6,10,18,.72)';
          g.fillRect(p0.x + 9, p0.y - 8, w + 8, 15);
          /* Tedarik zayıfsa etiket uyarı renginde yazılır */
          g.fillStyle = supRenk || renk;
          g.fillText(etiket, p0.x + 13, p0.y);
        }
      }
      g.restore();
      g.textAlign = 'center';
      g.textBaseline = 'alphabetic';
    }

    /* ═══ FAZ 46: BÖLGE ADLARI ═══
       Siyasi haritada her imparatorluğun hakimiyet ağırlık
       merkezine TAM adı saydam yazılır. Ağırlık merkezi ayda
       bir hesaplanıp önbelleğe alınır — her karede sistem
       taraması yapılmaz. */
    if (politik && z > .022){
      if (this._bolgeAt !== G.day){
        this._bolgeAt = G.day;
        const acc = {};
        for (const sy of G.sys){
          if (sy.owner < 0) continue;
          const a = acc[sy.owner] || (acc[sy.owner] = {x:0, y:0, n:0});
          a.x += sy.x; a.y += sy.y; a.n++;
        }
        this._bolge = [];
        for (const id in acc){
          const a = acc[id], em = G.emps[id];
          if (!em || em.dead || em.wild || em.crisisSide) continue;
          if (a.n < 2) continue;               // tek sistemli devlete etiket yok
          this._bolge.push({x:a.x/a.n, y:a.y/a.n, name:em.name, col:em.col, n:a.n});
        }
      }
      if (this._bolge && this._bolge.length){
        g.save();
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        for (const b of this._bolge){
          if (!this.inView(b.x, b.y)) continue;
          const p2 = this.w2s(b.x, b.y);
          const fs = clamp(9 + b.n * .55, 10, 19);
          g.font = '600 ' + fs.toFixed(0) + 'px ui-monospace,monospace';
          /* Okunurluk için koyu dış hat + saydam dolgu */
          g.lineWidth = 3;
          g.strokeStyle = 'rgba(6,10,18,.75)';
          g.strokeText(b.name, p2.x, p2.y);
          g.fillStyle = b.col + 'cc';
          g.fillText(b.name, p2.x, p2.y);
        }
        g.restore();
      }
    }

    // filolar
    for (const f of G.fleets){
      if (!this.fleetVisible(f)) continue;
      const p = this.w2s(f.x, f.y);
      if (p.x<-40||p.y<-40||p.x>this.vw+40||p.y>this.vh+40) continue;
      /* FAZ 45: siyasi haritada filo modelleri çizilmez — bu
         zoom'da zaten birkaç piksel. Yalnız hareket hâlindekiler
         renkli birer nokta olarak görünür ki cepheler okunsun. */
      if (politik){
        if (!f.mv) continue;
        const fe = G.emps[f.e];
        g.fillStyle = fe && !fe.dead ? fe.col : '#8fa8c8';
        g.fillRect(p.x - 1.5, p.y - 1.5, 3, 3);
        continue;
      }
      /* Tek bir filonun hatası haritayı karartmasın */
      try { this.drawFleet(g, f, p, t); }
      catch(err){ if (!this._fxWarn){ this._fxWarn = 1; console.warn('drawFleet:', err); } }
    }

    this.drawPings(g, t);               // FAZ 47: bildirim ping halkası

    // rota işaretleri
    for (let i=this.flash.length-1;i>=0;i--){
      const fl = this.flash[i];
      fl.t += 1;
      const p = this.w2s(fl.x, fl.y);
      const a = 1 - fl.t/fl.life;
      if (a <= 0){ this.flash.splice(i,1); continue; }
      g.strokeStyle = 'rgba(255,'+(120+a*120|0)+',80,'+a+')';
      g.lineWidth = 2;
      g.beginPath(); g.arc(p.x,p.y, (1-a)*26+4, 0, Math.PI*2); g.stroke();
    }

    // muharebe efektleri: atış izleri, patlamalar, kalkan darbeleri
    if (G.fx && G.fx.length){
      let oldu = false;
      for (let i=G.fx.length-1;i>=0;i--){
        const e2 = G.fx[i];
        e2.age++;
        const a = 1 - e2.age/e2.life;
        /* FAZ 21: splice yok — ölü işaretlenir, sonra tek geçişte
           havuza iade edilir. */
        if (a <= 0){ e2.dead = true; oldu = true; continue; }
        const p = this.w2s(e2.x, e2.y);
        if (p.x < -60 || p.y < -60 || p.x > this.vw+60 || p.y > this.vh+60) continue;
        if (e2.k === 'shot'){
          const q = this.w2s(e2.x2, e2.y2);
          const t = clamp(1-a, 0, 1);
          const hx = lerp(p.x, q.x, t), hy = lerp(p.y, q.y, t);
          const tx = lerp(p.x, q.x, Math.max(0,t-.22)), ty = lerp(p.y, q.y, Math.max(0,t-.22));
          g.strokeStyle = (e2.c || '#ffffff') + 'cc';
          g.lineWidth = 1.8;
          g.beginPath(); g.moveTo(tx,ty); g.lineTo(hx,hy); g.stroke();
        } else if (e2.k === 'boom'){
          const r = (1-a)*18 + 3;
          g.strokeStyle = 'rgba(255,'+(140+a*100|0)+',70,'+a+')';
          g.lineWidth = 2.2;
          g.beginPath(); g.arc(p.x,p.y,r,0,Math.PI*2); g.stroke();
          g.fillStyle = 'rgba(255,220,150,'+(a*.5)+')';
          g.beginPath(); g.arc(p.x,p.y,r*.35,0,Math.PI*2); g.fill();
        } else if (e2.k === 'shield'){
          g.strokeStyle = 'rgba(111,242,200,'+(a*.7)+')';
          g.lineWidth = 2;
          g.beginPath(); g.arc(p.x,p.y,(1-a)*30+12,0,Math.PI*2); g.stroke();
        }
      }
      if (oldu) fxCompact();      // FAZ 21: ölüleri havuza iade et
    }
  },

  drawFleet(g, f, p, t){
    /* HOTFIX 23.1: öksüz/bozuk filo çizimi tüm kareyi öldürmesin */
    if (!f || !f.ships || !f.ships.length) return;
    const e = G.emps[f.e];
    if (!e) return;
    /* FAZ 22: taarruz ordusu savaş filosundan ayrı okunsun —
       altına turuncu bir çıkarma çengeli çizilir. */
    const ordu = (typeof isTransport === 'function') && isTransport(f);
    const n = f.ships.length;
    const z = clamp(this.cam.z*2.4, .7, 2.2);
    const cls = f.ships.reduce((a,s)=> SHIPS[s.c].sz > SHIPS[a].sz ? s.c : a, f.ships[0].c);
    const spr = ART.ship(cls, e.col, 1);
    const sc = z * (this.sel===f ? 1.25 : 1);
    const w = spr.width*sc, h = spr.height*sc;
    let ang = 0;
    if (f.mv){
      const a = G.sys[f.mv.from], b = G.sys[f.mv.to];
      ang = Math.atan2(b.y-a.y, b.x-a.x) + Math.PI/2;
    }
    if (ordu){
      const r = Math.max(3, 5 * z);
      g.strokeStyle = '#ff9b3d';
      g.lineWidth = Math.max(1, z * .9);
      g.globalAlpha = .85;
      /* Aşağı bakan üçgen: "yüzeye inecek kuvvet" */
      g.beginPath();
      g.moveTo(p.x - r, p.y + r * .5);
      g.lineTo(p.x + r, p.y + r * .5);
      g.lineTo(p.x, p.y + r * 1.6);
      g.closePath(); g.stroke();
      g.globalAlpha = 1;
    }
    const drawOne = (ox,oy,s) => {
      g.save(); g.translate(p.x+ox, p.y+oy); g.rotate(ang);
      g.drawImage(spr, -w*s/2, -h*s/2, w*s, h*s); g.restore();
    };
    if (f.combat){
      g.strokeStyle = 'rgba(255,95,109,'+(.5+Math.sin(t/90)*.35)+')';
      g.lineWidth = 1.6;
      g.beginPath(); g.arc(p.x,p.y, 15, 0, Math.PI*2); g.stroke();
    }
    if (n <= 1) drawOne(0,0,1);
    else if (n <= 4){ drawOne(-w*.55,h*.2,.9); drawOne(w*.55,h*.2,.9); drawOne(0,-h*.25,1); }
    else { drawOne(-w*.8,h*.35,.8); drawOne(w*.8,h*.35,.8); drawOne(-w*.4,-h*.05,.9); drawOne(w*.4,-h*.05,.9); drawOne(0,-h*.5,1.05); }

    if (this.sel === f){
      g.strokeStyle = '#6ff2c8'; g.lineWidth = 1.5;
      const r = 14 + Math.sin(t/240)*2;
      g.beginPath(); g.arc(p.x,p.y,r,0,Math.PI*2); g.stroke();
    }
    // panelden işaretlenmiş filolar nabız gibi parlar
    if (this.hl && this.hl.has(f.id)){
      const ph = (Math.sin(t/180)+1)/2;
      g.strokeStyle = 'rgba(139,123,255,'+(.35+ph*.55)+')';
      g.lineWidth = 2;
      g.beginPath(); g.arc(p.x, p.y, 15 + ph*9, 0, Math.PI*2); g.stroke();
      g.strokeStyle = 'rgba(139,123,255,'+(.18+ph*.3)+')';
      g.beginPath(); g.arc(p.x, p.y, 24 + ph*13, 0, Math.PI*2); g.stroke();
    }
    if (this.cam.z > .18){
      const armed = isArmed(f);
      // gövde bütünlüğü barı — hasar görmüşse veya çatışmadaysa
      const hp = fleetHealth(f);
      if (hp < .995 || f.combat){
        const bw = Math.max(16, w*1.1), bx = p.x - bw/2, by = p.y + h*.9 + 2;
        g.fillStyle = 'rgba(5,7,15,.85)';
        g.fillRect(bx-1, by-1, bw+2, 5);
        g.fillStyle = hp > .6 ? '#65e08a' : hp > .3 ? '#ff9b3d' : '#ff5f6d';
        g.fillRect(bx, by, bw*clamp(hp,0,1), 3);
        g.strokeStyle = 'rgba(120,150,190,.5)'; g.lineWidth = .6;
        g.strokeRect(bx-1, by-1, bw+2, 5);
      }
      g.font = 'bold 9px ui-monospace,monospace'; g.textAlign = 'center';
      g.fillStyle = e.col;
      const label = armed ? fmt(fleetPower(f)) : (fleetHasRole(f,'bilim')?'BİL':'KOL');
      g.fillText(label, p.x, p.y + h*.9 + 16);
      if (f.e === 0 && this.cam.z > .34){
        const st = fleetStatus(f);
        if (st.c !== 'id'){
          g.font = '8px ui-monospace,monospace';
          g.fillStyle = st.c === 'ft' ? '#ff5f6d' : st.c === 'wk' ? '#8b7bff' : '#6ff2c8';
          g.fillText(st.t, p.x, p.y + h*.9 + 25);
        }
      }
    }
  },

  boom(x,y){ this.flash.push({x,y,t:0,life:26}); }
};
/* =====================================================================
   ARAYÜZ
   ===================================================================== */
/* Tempo makro-strateji için yavaşlatıldı (eski: [0,1.5,3.5,8,18]) */
const SPEEDS = [0, 0.8, 2.0, 4.5, 10];
/* ═══════════════════════════════════════════════════════════════════
   FAZ 12 — ARAYÜZ AYRIMI
   SAĞ PANEL: yalnızca haritada SEÇTİĞİN şeyi gösterir (gezegen,
   koloni, yapılar, filo). Bir "inceleme camı"dır.
   SOL ÇUBUK: galaksi çapındaki genel ekranlar (bilim, diplomasi,
   devlet, federasyon, konsey) tam ekran kaplama olarak açılır.
   ═══════════════════════════════════════════════════════════════════ */
const TABS = [
  {k:'sistem', n:'SİSTEM'}, {k:'filo', n:'FİLO'}, {k:'intel', n:'İSTİHBARAT'}
];
/* Sol çubuğa taşınan genel ekranlar — hepsi diploPane kaplamasını
   paylaşır, ayrı bir pencere sistemi kurulmaz. */
const GLOBAL_PANES = {
  bilim:{ico:'✦', n:'BİLİM',   fn:'p_bilim'},
  imp  :{ico:'👑', n:'DEVLET',  fn:'p_imp'}
};

const UI = {
  cur:'sistem', modalPrevSpeed:1, alerts:[],

  boot(){
    if (this._booted) { this.tab('sistem'); return; }
    this._booted = true;
    $('tabs').innerHTML = TABS.map(t=>`<button class="tab" data-a="tab" data-x="${t.k}">${t.n}</button>`).join('');
    $('timepod').innerHTML =
      `<span id="stardate" class="mono">—</span>` +
      [['0','⏸'],['1','▸'],['2','▸▸'],['3','▸▸▸'],['4','▸▸▸▸']]
        .map(([i,s])=>`<button class="sp" data-a="spd" data-x="${i}">${s}</button>`).join('');
    $('tools').innerHTML =
      `<button class="tool" id="btnFullscreen" onclick="forceFullscreen()" title="Tam ekran">⛶</button>
       <button class="tool" data-a="home" title="Anavatan">⌂</button>
       <button class="tool" data-a="fit" title="Galaksi">✧</button>
       <button class="tool" data-a="save" title="Kaydet">▤</button>
       <button class="tool" id="bgBtn" data-a="bgTog"
         title="Arka planı aç/kapat">🌌</button>
       <button class="tool" id="autoEvBtn" data-a="autoEvent"
         title="Olayları otomatik geç — pencere açılmaz">⚡</button>
       <div class="toolSep"></div>
       <button class="tool mapMode" id="mm_siyasi" data-a="mapMode" data-x="siyasi"
         title="Siyasi harita">🌐</button>
       <button class="tool mapMode" id="mm_diplomasi" data-a="mapMode" data-x="diplomasi"
         title="Diplomatik harita">🤝</button>
       <button class="tool mapMode" id="mm_askeri" data-a="mapMode" data-x="askeri"
         title="Askeri harita — filo rotaları">⚔</button>
       <div class="toolSep"></div>
       <button class="tool" id="bilimBtn" data-a="globalPane" data-x="bilim" title="Bilim">✦</button>
       <button class="tool" id="impBtn" data-a="globalPane" data-x="imp" title="Devlet">👑</button>
       <button class="tool" data-a="diploPane" title="Diplomasi">🤝</button>
       <div class="toolSep"></div>
       <button class="tool" id="muteBtn" data-a="mute"
         title="Sesi aç/kapat">${AUDIO_OFF ? '🔇' : '🔊'}</button>
       <button class="tool" id="fedBtn" data-a="fedPane" title="Federasyon">🏛</button>
       <button class="tool" id="cncBtn" data-a="cncPane" title="Galaktik Konsey">🌐</button>`;
    document.body.addEventListener('click', e=>{
      const el = e.target.closest('[data-a]');
      if (!el) return;
      this.act(el.dataset.a, el.dataset.x, el);
    });
    /* ═══════════════════════════════════════════════════════════
       FAZ 54 — TAM EKRAN: DELEGATION DIŞI SAF DİNLEYİCİ
       Mobil tarayıcılar fullscreen isteğini yalnız "kullanıcı
       etkinleştirmesi" (user activation) bağlamında kabul eder.
       document seviyesindeki delegation bu bağlamı bazı
       WebView'larda (Acode dahil) kaybediyordu.
       Çözüm: butonun KENDİSİNE doğrudan click dinleyicisi.
       Toolbar bir kez çizildiği için yeniden bağlamaya gerek yok.
       ═══════════════════════════════════════════════════════════ */
    const fsBtn = $('btnFullscreen');
    if (fsBtn){
      fsBtn.addEventListener('click', ev => {
        ev.preventDefault();
        ev.stopPropagation();
        /* Çift tetikleme kalkanı (delegation da yakalarsa) */
        const now = Date.now();
        if (window._fullAt && now - window._fullAt < 500) return;
        window._fullAt = now;
        forceFullscreen();
      });
      /* iOS Safari bazı sürümlerde click üretmiyor — touchend yedeği */
      fsBtn.addEventListener('touchend', ev => {
        ev.preventDefault();
        const now = Date.now();
        if (window._fullAt && now - window._fullAt < 500) return;
        window._fullAt = now;
        forceFullscreen();
      }, {passive:false});
    }

    $('sbToggle').addEventListener('click', ()=>{
      $('sidebar').classList.toggle('off');
      $('sbToggle').classList.toggle('off');
      $('sbToggle').textContent = $('sidebar').classList.contains('off') ? '‹' : '›';
    });
    this.tab('sistem');
  },

  act(a, x, el){
    /* FAZ 19: her arayüz eylemi yumuşak bir dokunuş sesi verir.
       Mute butonu hariç — kendi geri bildirimini kendi veriyor. */
    if (typeof AUDIO !== 'undefined' && a !== 'mute'){
      try { AUDIO.play('tap'); } catch(err){}
    }
    switch(a){
      case 'tab': this.tab(x); break;
      case 'spd': this.setSpeed(+x); break;
      case 'full': forceFullscreen(); break;   // FAZ 54: senkron yol
      case 'home': { const h=G.sys[G.p.home]; View.center(h.x,h.y); View.cam.z=Math.max(View.cam.z,.4); View.selSys=h; this.tab('sistem'); break; }
      case 'fit': View.fit(); break;
      case 'save': this.saveMenu(); break;
      case 'diploPane': this.openDiplo(); break;
      case 'globalPane': this.openGlobal(x); break;
      case 'advClose': this.closeModal(); break;
      case 'advNever': {
        ADVISOR_OFF = true;
        try { storeSet('yh_advisor', 'off'); } catch(err){}
        this.closeModal();
        say('Danışman kapatıldı — DEVLET panelinden yeniden açabilirsin');
        break;
      }
      case 'advShow': this.advisorOpen(); break;
      case 'terraform': {
        const [sid, pi] = String(x).split(':');
        const sy = G.sys[+sid], pl2 = sy && sy.planets[+pi];
        const r = (typeof startTerraform === 'function')
          ? startTerraform(G.p, sy, pl2) : {ok:false, why:'—'};
        if (!r.ok) say(r.why, 'war');
        this.keepScroll = true; this.refresh();
        break;
      }
      case 'joinRebel': {
        const r = (typeof joinRebellion === 'function')
          ? joinRebellion(G.p) : {ok:false, why:'—'};
        if (!r.ok) say(r.why, 'war');
        else if (r.revealed) say('⚑ İSYANA KATILDIN — savaş çoktan başlamıştı', 'war');
        else say('⚑ Gölgelerdeki ittifaka katıldın — gücün toplama eklendi', 'sci');
        this.openCouncil();
        break;
      }
      case 'leaveRebel': {
        const r = (typeof leaveRebellion === 'function')
          ? leaveRebellion(G.p) : {ok:false, why:'—'};
        if (!r.ok) say(r.why, 'war');
        else say('İttifaktan çekildin — diğer isyancılar bunu unutmayacak');
        this.openCouncil();
        break;
      }
      case 'veto': {
        const kor = G.p;
        const r = (typeof guardianVeto === 'function')
          ? guardianVeto(kor, x) : {ok:false, why:'—'};
        if (!r.ok) say(r.why, 'war');
        this.openCouncil();
        break;
      }
      case 'ultimatum': {
        const o = G.emps[+x];
        const r = (typeof sendUltimatum === 'function')
          ? sendUltimatum(G.p, o) : {ok:false, why:'—'};
        if (!r.ok) say(r.why, 'war');
        else if (r.kabul) say('⚠ ' + r.msg, 'win');
        else {
          say('⚠ ' + r.msg, 'war');
          this.eventArt('infaz', 'ULTİMATOM REDDEDİLDİ', r.msg +
            '. Kriz sürerken iç savaş çıkarmak galakside hoş karşılanmadı.');
        }
        this.keepScroll = true; this.refresh();
        break;
      }
      case 'statuko': {
        const o = G.emps[+x];
        const r = (typeof statusQuoPeace === 'function')
          ? statusQuoPeace(G.p, o) : {ok:false, why:'—'};
        if (!r.ok) say(r.why, 'war');
        else {
          say('⚖ STATÜKO BARIŞI — sınırlar fiili durumda donduruldu' +
              (r.devredilen ? ' (' + r.devredilen + ' sistem el değiştirdi)' : ''), 'win');
          this.eventArt('veri', 'STATÜKO BARIŞI',
            o.name + ' ile savaş bitti. Kim nereyi tutuyorsa orası onun kaldı.' +
            (r.devredilen ? ' ' + r.devredilen + ' sistem kalıcı olarak el değiştirdi.' : ''));
        }
        this.openDiplo();
        break;
      }
      case 'bill': {
        const r = (typeof proposeBill === 'function')
          ? proposeBill(G.p, x) : {ok:false, why:'—'};
        if (!r.ok) say(r.why, 'war');
        this.billKey = null;
        this.openCouncil();
        break;
      }
      case 'billPick': {
        this.billKey = x;
        this.openCouncil();
        break;
      }
      case 'billTarget': {
        const r = (typeof proposeBill === 'function')
          ? proposeBill(G.p, this.billKey, +x) : {ok:false, why:'—'};
        if (!r.ok) say(r.why, 'war');
        this.billKey = null;
        this.openCouncil();
        break;
      }
      case 'reinf': {
        const fl = G.fleets.find(q => q.id === +x);
        const r = (typeof reinforceFleet === 'function')
          ? reinforceFleet(G.p, fl) : {ok:false, why:'—'};
        if (!r.ok) say(r.why, 'war');
        else say('⚓ İkmal siparişi verildi — ' + r.siparis + ' × ' +
                 SHIPS[r.cls].n + ' (eksik ' + r.eksik + ')', 'sci');
        this.keepScroll = true; this.refresh();
        break;
      }
      case 'rallySet': {
        /* Haritadan hedef seç: rota verme kipini kullan */
        View.rallyFor = +x;
        View.route = false;
        say('📍 Toplanma noktası için haritadan bir sistem seç');
        this.keepScroll = true; this.refresh();
        break;
      }
      case 'mapMode': {
        MAP_MODE = x;
        ['siyasi','diplomasi','askeri'].forEach(k=>{
          const b = $('mm_' + k);
          if (b) b.className = 'tool mapMode' + (k === x ? ' on' : '');
        });
        const ad = x === 'siyasi' ? 'Siyasi' : x === 'diplomasi' ? 'Diplomatik' : 'Askeri';
        say('🗺 ' + ad + ' harita modu');
        break;
      }
      case 'bgTog': {
        BG_OFF = !BG_OFF;
        const bb = $('bgBtn'); if (bb) bb.className = 'tool' + (BG_OFF ? '' : ' on');
        storeSet('yh_bg', BG_OFF ? 'off' : 'on');
        say(BG_OFF ? '🌌 Arka plan kapatıldı' : '🌌 Arka plan açıldı');
        this.refresh();
        break;
      }
      case 'autoEvent': {
        AUTO_EVENT = !AUTO_EVENT;
        const ab = $('autoEvBtn'); if (ab) ab.className = 'tool' + (AUTO_EVENT ? ' on' : '');
        storeSet('yh_autoev', AUTO_EVENT ? 'on' : 'off');
        say(AUTO_EVENT ? '⚡ Olaylar otomatik geçilecek — pencere açılmayacak'
                       : '⚡ Otomatik olay çözücü kapatıldı');
        this.refresh();
        break;
      }
      case 'diploView': {
        this.diploList = !this.diploList;
        this._diploScroll = 0;            // görünüm değişince başa dön
        this.openDiplo();
        break;
      }
      case 'diploPick': {
        /* ═══ FAZ 50: AKORDEON ═══
           Kart moduna GEÇMEZ. Yalnız dokunulan satır açılır,
           diğerleri listede kalır. Tekrar dokunulunca kapanır.
           Scroll konumu korunur — ekran hiç sıçramaz. */
        this.diploOpen = (this.diploOpen === +x) ? null : +x;
        this.openDiplo();
        break;
      }
      case 'physio': {
        CFG.physio = x;
        safeRenderSetup();
        break;
      }
      case 'rollName': {
        /* FAZ 45: kurulum ekranı isim üreteci — Faz 44'teki
           empireName() aynı etik girdisiyle çalıştırılır. */
        const inp2 = $('empName');
        if (inp2 && inp2.value !== undefined) CFG.name = inp2.value;
        const yeni = (typeof empireName === 'function')
          ? empireName(Math.random, CFG.ethics || {}, null)
          : CFG.name;
        CFG.name = yeni;
        if (inp2) inp2.value = yeni;
        safeRenderSetup();
        break;
      }
      case 'patronage': {
        const o = G.emps[+x];
        const r = (typeof offerPatronage === 'function')
          ? offerPatronage(G.p, o) : {ok:false, why:'—'};
        if (!r.ok) say(r.why, 'war');
        else if (r.kabul) say('🤝 ' + r.msg, 'win');
        else say(r.msg, 'war');
        this.keepScroll = true; this.refresh();
        break;
      }
      case 'saboPick': {
        const [tur, id] = x.split(':');
        this.saboPick = {tur, emp: +id};
        this.keepScroll = true; this.refresh();
        break;
      }
      case 'saboCancel': {
        this.saboPick = null;
        this.keepScroll = true; this.refresh();
        break;
      }
      case 'saboGo': {
        const [tur, id, sid] = x.split(':');
        const o = G.emps[+id];
        const r = (typeof doSabotage === 'function')
          ? doSabotage(G.p, o, tur, +sid) : {ok:false, why:'—'};
        this.saboPick = null;
        if (!r.ok) say(r.why, 'war');
        else if (!r.caught && !r.sys) say(r.msg, 'war');
        this.keepScroll = true; this.refresh();
        break;
      }
      case 'incite': {
        const o = G.emps[+x];
        const r = (typeof inciteRebellion === 'function')
          ? inciteRebellion(G.p, o) : {ok:false, why:'—'};
        if (!r.ok) say(r.why, 'war');
        else if (r.caught){
          say('☠ ' + r.msg, 'war');
          this.eventArt('infaz', 'MÜDAHALE İFŞA OLDU', r.msg);
        } else say('🔥 ' + r.msg, 'sci');
        this.keepScroll = true; this.refresh();
        break;
      }
      case 'incite': {
        const o = G.emps[+x];
        const r = (typeof inciteRebellion === 'function')
          ? inciteRebellion(G.p, o) : {ok:false, why:'—'};
        if (!r.ok) say(r.why, 'war');
        else if (r.caught){
          say('☠ ' + r.msg, 'war');
          this.eventArt('infaz', 'KIŞKIRTMA İFŞA OLDU', r.msg);
        } else say('🔥 ' + r.msg, 'sci');
        this.keepScroll = true; this.refresh();
        break;
      }
      case 'deepInv': {
        const r = (typeof deepInvestigate === 'function')
          ? deepInvestigate(G.p) : {ok:false, why:'—'};
        if (!r.ok) say(r.why, 'war');
        else if (r.cozuldu){
          say('🔎 ' + r.msg, 'win');
          this.eventArt('veri', 'PERDE ARKASI',  r.msg);
        } else say(r.msg);
        this.keepScroll = true; this.refresh();
        break;
      }
      case 'ffTarget': {
        this.ffTarget = (this.ffTarget === +x) ? undefined : +x;
        if (this.ffPatsy === this.ffTarget) this.ffPatsy = undefined;
        this.keepScroll = true; this.refresh();
        break;
      }
      case 'ffPatsy': {
        this.ffPatsy = (this.ffPatsy === +x) ? undefined : +x;
        this.keepScroll = true; this.refresh();
        break;
      }
      case 'ffGo': {
        const t2 = G.emps[this.ffTarget], p2 = G.emps[this.ffPatsy];
        const r = (typeof falseFlagOp === 'function')
          ? falseFlagOp(G.p, t2, p2, x) : {ok:false, why:'—'};
        if (!r.ok) say(r.why, 'war');
        else if (r.caught){
          say('☠ ' + r.msg, 'war');
          this.eventArt('infaz', 'SAHTE BAYRAK İFŞA OLDU', r.msg);
          this.ffTarget = this.ffPatsy = undefined;
        } else {
          say('🎭 ' + r.msg, r.savas ? 'win' : 'sci');
          if (r.savas) this.eventArt('veri', 'İFTİRA TUTTU',
            t2.name + ', ' + p2.name + ' devletine savaş ilan etti. ' +
            'Gerçeği yalnız sen biliyorsun — ve Derin Soruşturma yaparlarsa öğrenirler.');
          this.ffTarget = this.ffPatsy = undefined;
        }
        this.keepScroll = true; this.refresh();
        break;
      }
      case 'bribe': {
        const [bid, byon] = String(x).split(':');
        const o = G.emps[+bid];
        const r = (typeof bribeVote === 'function')
          ? bribeVote(G.p, o, 200, byon) : {ok:false, why:'—'};
        if (!r.ok) say(r.why, 'war');
        else say(o.name + ' rüşveti kabul etti — ' +
          (byon === 'no' ? 'RET' : 'KABUL') + ' yönünde oy verecek');
        this.keepScroll = true; this.refresh();
        break;
      }
      case 'blackmail': {
        const [sid, syon] = String(x).split(':');
        const o = G.emps[+sid];
        const r = (typeof blackmailVote === 'function')
          ? blackmailVote(G.p, o, syon) : {ok:false, why:'—'};
        if (!r.ok) say(r.why, 'war');
        else if (r.caught){
          say('☠ ' + r.msg, 'war');
          this.eventArt('infaz', 'ŞANTAJ İFŞA OLDU',
            o.name + ' senatoya kanıtları sundu. Ajanımız yakalandı, tüm konsey ' +
            'öğrendi ve ellerinde artık meşru bir savaş nedeni var.');
        } else say('🕵 ' + r.msg, 'sci');
        this.keepScroll = true; this.refresh();
        break;
      }
      case 'stealTech': {
        const o = G.emps[+x];
        const r = (typeof stealTech === 'function') ? stealTech(G.p, o) : {ok:false, why:'—'};
        if (!r.ok) say(r.why, 'war');
        else if (r.msg && !r.caught && r.tech === undefined) say(r.msg);
        this.keepScroll = true; this.refresh();
        break;
      }
      case 'colFire': {
        const [fid, mod] = x.split(':');
        const f3 = G.fleets.find(z => z.id === +fid);
        const hedef = f3 && typeof colossusTarget === 'function' ? colossusTarget(f3) : null;
        if (f3 && hedef && typeof colossusFire === 'function'){
          if (colossusFire(f3, hedef, mod)) this.closeModal();
        } else say('Ateşleme koşulları sağlanmıyor', 'war');
        this.refresh();
        break;
      }
      case 'repairToggle': {
        const f2 = G.fleets.find(z => z.id === +x);
        if (f2){
          f2.repairOff = !f2.repairOff;
          say(f2.repairOff ? 'Onarım durduruldu — kaynak harcanmayacak'
                           : 'Onarım başlatıldı');
        }
        this.keepScroll = true; this.refresh();
        break;
      }
      case 'toTitle': {
        this.closeModal();
        if (typeof backToTitle === 'function') backToTitle();
        break;
      }
      case 'mute': {
        if (typeof AUDIO === 'undefined') break;
        AUDIO_OFF = AUDIO.toggle();
        try { storeSet('yh_audio', AUDIO_OFF ? 'off' : 'on'); } catch(err){}
        const b = $('muteBtn');
        if (b) b.textContent = AUDIO_OFF ? '🔇' : '🔊';
        say(AUDIO_OFF ? 'Ses kapatıldı' : 'Ses açıldı');
        if (!AUDIO_OFF) AUDIO.play('ok');
        break;
      }
      case 'revolt': {
        const r = (typeof playerRevolt === 'function') ? playerRevolt() : {ok:false, why:'—'};
        if (!r.ok) say(r.why, 'war');
        this.refresh();
        break;
      }
      case 'fedPane': this.openFed(); break;
      case 'cncPane': this.openCouncil(); break;
      case 'cncFound': {
        const r = foundCouncil(G.p);
        if (!r.ok) say(r.why, 'war');
        this.openCouncil(); break;
      }
      case 'cncJoin': {
        if (joinCouncil(G.p)) say('Galaktik Konsey\'e katıldın', 'win');
        else say('Katılamadın');
        this.openCouncil(); break;
      }
      case 'cncLeave': {
        if (leaveCouncil(G.p)) say('Konseyden ayrıldın — üyeler küstü', 'war');
        this.openCouncil(); break;
      }
      case 'cncYes': {
        const c = G.council;
        if (c && c.vote){ c.vote.yes.push(0); finishCouncilVote(); }
        this.closeModal(); this.openCouncil(); break;
      }
      case 'cncNo': {
        const c = G.council;
        if (c && c.vote){ c.vote.no.push(0); finishCouncilVote(); }
        this.closeModal(); this.openCouncil(); break;
      }
      case 'foundFed': {
        const r = foundFederation(G.p);
        if (!r.ok) say(r.why || 'Federasyon kurulamadı', 'war');
        this.openFed();
        break;
      }
      case 'fedLeave': {
        const f = findFed(G.p);
        if (f){
          f.members.filter(m=>m!==0).forEach(m=>{ G.p.ally[m] = false; G.emps[m].ally[0] = false; });
          updateFederations();
          say('Federasyondan ayrıldın', 'war');
        }
        this.openFed();
        break;
      }
      case 'fedVoteYes': {
        const f = findFed(G.p);
        if (f && f.vote){ f.vote.yes.push(0); finishFedVote(f); }
        this.openFed(); break;
      }
      case 'fedVoteNo': {
        const f = findFed(G.p);
        if (f && f.vote){ f.vote.no.push(0); finishFedVote(f); }
        this.openFed(); break;
      }
      case 'closeFed': $('diploPane').classList.remove('show'); break;
      case 'fedVoteNow': { const f = fedOf(+x); if (f && f.vote) this.fedVoteOpen(f.id); break; }
      case 'deal': this.openDeal(x); break;
      case 'permanent': {
        const r = (typeof claimPermanent === 'function')
          ? claimPermanent(G.p) : {ok:false, why:'—'};
        if (!r.ok) say(r.why, 'war');
        else if (r.gecti) this.eventArt('veri', 'DAİMİ HÜKÜMDARLIK',
          'Konsey seçimleri kaldırdı. Taht artık senin — kalıcı olarak. ' +
          'Diplomatik Hegemonya zaferinin yolu açıldı.');
        this.openCouncil();
        break;
      }
      case 'spyClear': {
        this.spyTarget = null;
        this.keepScroll = true; this.refresh();
        break;
      }
      case 'panoptRetarget': {
        View.panoptFor = +x;
        say('🎯 Panoptikon için haritadan yeni hedef seç');
        this.keepScroll = true; this.refresh();
        break;
      }
      case 'fedGrant': {
        const r = (typeof grantFed === 'function') ? grantFed(G.p) : {ok:false, why:'—'};
        if (!r.ok) say(r.why, 'war');
        this.openFed();
        break;
      }
      case 'sandbox': {
        /* FAZ 50: zafer sonrası serbest oyun — zafer kontrolü kapanır */
        G.sandbox = true;
        G.over = null;
        this.closeModal();
        say('🌌 SANDBOX MODU — galaksi senin, zafer koşulları artık kapalı', 'win');
        this.refresh();
        break;
      }
      case 'spyOpen': {
        /* ═══ FAZ 51: DERİN BAĞLANTI ═══
           Yalnız sekmeyi açmakla kalmaz, o devleti aktif casusluk
           hedefi yapar ve paneli ona odaklar. */
        this.spyTarget = +x;
        this.closeDiplo();
        this.tab('intel');
        const o2 = G.emps[+x];
        if (o2) say('🕵 İstihbarat hedefi: ' + o2.name, 'sci');
        break;
      }
      case 'closeDeal': $('diploPane').classList.remove('show'); this.deal = null; break;
      case 'dealAdd': this.dealAdd(x); break;
      case 'dealRm': this.dealRm(x); break;
      case 'dealPact': this.dealPact(x); break;
      case 'dealSend': this.dealSend(); break;
      case 'closeDiplo': $('diploPane').classList.remove('show'); break;
      case 'spy': {
        if (assignSpy(G.p, +x)) this.openDiplo();
        else say('Boşta casusun yok — birini geri çek');
        break;
      }
      case 'ops': this.opsMenu(+x); break;
      case 'setwg': {
        const [id, k] = x.split(':');
        const o = G.emps[+id];
        if (setWarGoal(G.p, o, k)){
          declareWar(G.p, o);
          say('Savaş hedefi: ' + WAR_GOALS[k].n, 'war');
        } else say('Yetersiz etki');
        this.closeModal();
        this.openDiplo();
        break;
      }
      case 'runop': {
        const [id, key] = x.split(':');
        const o = G.emps[+id];
        const r = runOp(G.p, o, key);
        say(r.msg || 'Operasyon başarısız', r.caught ? 'war' : 'sci');
        this.closeModal();
        this.openDiplo();
        break;
      }
      case 'envoy': {
        const id = +x;
        if (assignEnvoy(G.p, id)) this.openDiplo();
        else say('Boşta elçin yok — birini geri çek');
        break;
      }
      case 'upInfo': {
        const U = (typeof upheavalInfo === 'function') ? upheavalInfo() : null;
        if (!U) break;
        const gecen = G.upheaval.total - G.upheaval.left;
        const yuzde = Math.round(gecen / Math.max(1, G.upheaval.total) * 100);
        const etki = [];
        const ad = {eneMul:'Enerji', minMul:'Mineral', araMul:'Araştırma',
                    yiyMul:'Yiyecek', alaMul:'Alaşım', stab:'İstikrar', etkFlat:'Etki'};
        for (const k in (U.mods||{})){
          const v = U.mods[k];
          const yaz = (k === 'stab' || k === 'etkFlat')
            ? (v>0?'+':'') + v
            : (v>0?'+':'') + Math.round(v*100) + '%';
          etki.push(`<div class="row"><span>${ad[k]||k}</span>
            <b style="color:${v>0?'#65e08a':'#ff5f6d'}">${yaz}</b></div>`);
        }
        /* Mizacına göre kişisel fark */
        let kisisel = '';
        if (typeof upheavalMods === 'function' && typeof personaOf === 'function'){
          const um = upheavalMods(G.p);
          const P = personaOf(G.p);
          const farklar = [];
          for (const k in um){
            const genel = (U.mods && U.mods[k]) || 0;
            if (Math.abs(um[k] - genel) < .001) continue;
            const d = um[k] - genel;
            const yaz = (k === 'stab' || k === 'etkFlat')
              ? (d>0?'+':'') + Math.round(d) : (d>0?'+':'') + Math.round(d*100) + '%';
            farklar.push((ad[k]||k) + ' ' + yaz);
          }
          if (farklar.length)
            kisisel = `<div class="mini" style="color:#8b7bff">${P.ico} ${P.n} olduğun için:
              ${farklar.join(' · ')}</div>`;
        }
        this.openModal(
          `<div class="mhd"><span>${U.ico} ${esc(U.n)}</span></div>
           <div class="mbd"><div class="lead">${U.d}</div>
           <div class="row"><span>Kalan süre</span><b>${G.upheaval.left} tur</b></div>
           <div class="row"><span>İlerleme</span><b>%${yuzde}</b></div>
           <div class="ph">GALAKSİ ÇAPINDA ETKİ</div>${etki.join('')}${kisisel}</div>
           <div class="mft"><button class="ch" data-a="closem"><div class="cht">Kapat</div></button></div>`,
          'sci');
        break;
      }
      case 'crisInfo': if (G.crisis) this.crisisOpen(G.crisis.stage); break;
      case 'trigCrisis': {
        if (G.crisis && G.crisis.stage === 0){
          G.crisis.at = G.year;
          G.crisis.atMonth = 0;                 // hemen tetikle
          crisisTick();
          say('Krizi erken tetikledin — gelen dalga zayıf ama gerçek', 'war');
        }
        this.refresh(); break;
      }
      case 'gobattle': {
        const list = G.sys.filter(sy => sy.cr > 0 &&
          G.fleets.some(f => f.e === 0 && f.sys === sy.id));
        const any = list.length ? list : G.sys.filter(sy => sy.cr > 0 && pSeen(sy));
        if (any.length){
          const sy = any[(this._bIdx = ((this._bIdx||0)+1) % any.length)];
          View.selSys = sy; View.center(sy.x, sy.y);
          View.cam.z = Math.max(View.cam.z, .55);
          this.tab('sistem');
        } else say('Görünür çatışma yok');
        break;
      }
      case 'selsys': View.selSys = G.sys[+x]; View.center(G.sys[+x].x, G.sys[+x].y); this.tab('sistem'); break;
      case 'selfleet': {
        const f = G.fleets.find(f=>f.id===+x);
        if (f){ View.sel=f; View.center(f.x,f.y); this.tab('filo'); }
        break;
      }
      case 'sendhere': {
        const [fid, sid] = x.split(':').map(Number);
        const f = G.fleets.find(f=>f.id===fid);
        if (f && orderMove(f, sid)){ f.ord = null; View.sel = f; say(esc(f.name)+' → '+G.sys[sid].name); }
        this.refresh(); break;
      }
      case 'autoAll': {
        const sci = G.fleets.filter(f=>f.e===0 && fleetHasRole(f,'bilim'));
        const allOn = sci.length && sci.every(f=>f.auto);
        sci.forEach(f=>f.auto = !allOn);
        say(allOn ? 'Tüm bilim gemileri manuel' : sci.length + ' bilim gemisi otomatik keşifte', 'sci');
        this.refresh(); break;
      }
      case 'autoex': {
        const f = G.fleets.find(fl => fl.id === +x);
        if (f){
          f.auto = !f.auto;
          say(f.auto ? esc(f.name) + ' otomatik keşfe geçti'
                     : esc(f.name) + ' manuel kontrole döndü', f.auto?'sci':'');
        }
        this.refresh(); break;
      }
      case 'route': View.route = !View.route; View.routed = false; this.refresh(); break;
      case 'stop': if (View.sel){ View.sel.path=[]; View.sel.ord=null; } this.refresh(); break;
      case 'stance': if (View.sel) View.sel.stance = View.sel.stance==='agresif'?'savunma':'agresif'; this.refresh(); break;
      case 'merge': this.mergeFleets(); break;
      case 'split': this.splitFleet(); break;
      case 'splitOne': {
        const nf = splitType(G.p, View.sel, x, 1);
        if (nf){ say(SHIPS[x].n + ' ayrıldı — ' + esc(nf.name)); View.sel = nf; }
        else say('Ayırma başarısız');
        this.refresh(); break;
      }
      case 'splitAll': {
        const f = View.sel;
        const n = f ? f.ships.filter(s=>s.c===x).length : 0;
        const nf = splitType(G.p, f, x, n);
        if (nf){ say(SHIPS[x].n + ' ×' + n + ' ayrıldı — ' + esc(nf.name)); View.sel = nf; }
        else say('Ayırma başarısız');
        this.refresh(); break;
      }
      case 'colonize': this.doColonizeOrder(x); break;
      case 'survey': this.doSurveyOrder(); break;
      case 'terra': {
        const [sid, pi] = x.split(':').map(Number);
        const pl = G.sys[sid].planets[pi];
        if (startTerraform(G.p, pl)) say('Terraform başladı — ' + pl.name, 'sci');
        else say('Terraform başlatılamadı');
        this.keepScroll = true; this.refresh(); break;
      }
      case 'habitat': {
        const [sid, pi] = x.split(':').map(Number);
        const sys = G.sys[sid], pl = sys.planets[pi];
        if (!buildHabitat(G.p, sys, pl)) say('Habitat kurulamadı — kaynak yetersiz');
        this.keepScroll = true; this.refresh(); break;
      }
      case 'reform': {
        const [ax, d] = x.split(':');
        const r = doReform(G.p, ax, +d);
        say(r.ok ? 'İdeoloji reformu tamamlandı — ' + ETHICS[ax].n
                 : (r.why || 'Reform yapılamadı'), r.ok ? 'win' : 'war');
        this.keepScroll = true; this.refresh(); break;
      }
      case 'focus': this.setColonyFocus(x); break;
      case 'build': this.build(x); break;
      case 'cancelBuild': this.cancelBuild(x); break;
      case 'demolish': this.demolish(x); break;
      case 'ship': this.buildShip(x); break;
      case 'tech': this.setTech(x); break;
      case 'war': this.diploAct('war', +x); break;
      case 'peace': this.diploAct('peace', +x); break;
      case 'ally': this.diploAct('ally', +x); break;
      case 'gift': this.giftMenu(+x); break;
      case 'giftDo': {
        const [id, r, v] = x.split(':');
        const o = G.emps[+id], e = G.p;
        const amt = +v;
        if ((e.res[r]||0) < amt){ say('Yetersiz ' + RES[r].n); break; }
        e.res[r] -= amt;
        o.res[r] = (o.res[r]||0) + amt;
        // değer ve ihtiyaç ilişkiyi belirler
        const base = itemValue(o, {t:'res', r, v:amt}, e);
        const gain = clamp(Math.round(base * .10 * (1 + e.mods.dipMul)), 3, 45);
        e.rel[o.id] = clamp(e.rel[o.id] + gain, -100, 100);
        o.rel[e.id] = clamp(o.rel[e.id] + gain, -100, 100);
        say(o.name + ' hediyeyi kabul etti (+' + gain + ' ilişki)', 'win');
        this.closeModal();
        this.openDiplo();
        break;
      }
      case 'embargo': {
        const o = G.emps[+x];
        if (typeof setEmbargo === 'function' && setEmbargo(G.p, o, true, 'kararın')){
          G.emps.forEach(z => { if (!z.dead) recalcMods(z); });
        }
        this.openDiplo(); break;
      }
      case 'unembargo': {
        const o = G.emps[+x];
        if (typeof setEmbargo === 'function' && setEmbargo(G.p, o, false)){
          G.emps.forEach(z => { if (!z.dead) recalcMods(z); });
        }
        this.openDiplo(); break;
      }
      case 'dTab': {
        const [oid, k] = x.split(':');
        this.dTab = this.dTab || {};
        this.dTab[oid] = k;
        this.openDiplo();
        break;
      }
      case 'whisperMenu': this.whisperMenu(); break;
      case 'opLogMenu': this.opLogMenu(); break;
      case 'whisperPick': {
        const id = +x;
        if (this.wA === null || this.wA === undefined){ this.wA = id; }
        else if (this.wA === id){ this.wA = null; }
        else if (this.wB === id){ this.wB = null; }
        else { this.wB = id; }
        this.whisperMenu(); break;
      }
      case 'whisperBlame': {
        const id = +x;
        this.wC = (this.wC === id) ? null : id;
        this.whisperMenu(); break;
      }
      case 'whisperGo': {
        const a = G.emps[this.wA], b = G.emps[this.wB];
        const c = (this.wC !== null && this.wC !== undefined) ? G.emps[this.wC] : null;
        const r = playerWhisper(a, b, c);
        if (!r.ok){ say(r.why, 'war'); this.whisperMenu(); break; }
        this.wA = null; this.wB = null; this.wC = null;
        this.closeModal();
        say(r.basari
          ? (c ? 'Fısıltı yayıldı — suç ' + esc(c.name) + ' üstünde kaldı'
               : 'Fısıltı yayıldı — ' + esc(a.name) + ' ile ' + esc(b.name) + ' arası bozuldu')
          : 'Fısıltı tutmadı — kimse yutmadı', r.basari ? 'sci' : '');
        if (r.ifsa) say(c ? 'SAHTE BAYRAK ÇÖKTÜ — üç devlet birden seni biliyor!'
                          : 'AĞIN İFŞA OLDU — her iki taraf da senden biliyor!', 'war');
        this.openDiplo();
        break;
      }
      case 'pact': this.diploAct('pact', +x); break;
      case 'unpact': this.diploAct('unpact', +x); break;
      case 'build2': {
        const [sid, k] = x.split(':');
        const sys = G.sys[+sid];
        const f = G.fleets.find(f=>f.e===0 && fleetHasRole(f,'insaat') && f.sys===+sid);
        if (startStruct(G.p, sys, k, f)) say(STRUCTS[k].n + ' inşaatı başladı — ' + sys.name, 'win');
        else say('İnşaat başlatılamadı — kaynak veya konum uygun değil');
        this.keepScroll = true; this.refresh(); break;
      }
      case 'sInfo': {
        const S = STRUCTS[x];
        if (!S) break;
        const c = structCost(G.p, x);
        this.openModal(
          `<div class="mhd"><span>${S.ico} ${esc(S.n)}</span></div>
           <div class="mbd">${esc(S.d)}
             <div class="ph">İNŞA BEDELİ</div>
             ${Object.entries(c).map(([r,v])=>`<div class="row"><span>${RES[r].n}</span><b>${v}</b></div>`).join('')}
             <div class="row"><span>Süre</span><b>${S.ay} ay</b></div>
             <div class="row"><span>Gereken</span><b>1 İnşaat Gemisi (tüketilir)</b></div>
             ${S.g ? `<div class="ph">ÜRETİM</div>` + Object.entries(S.g).map(([r,v])=>
               `<div class="row"><span>${RES[r].n}</span><b style="color:#65e08a">+${v}/ay</b></div>`).join('') : ''}
             ${S.mega ? `<div class="mini" style="color:#ff9b3d;margin-top:8px">⚠ MEGA YAPI — uzun sürer ve düşman yıkabilir.</div>` : ''}
           </div>
           <div class="mft"><button class="ch" data-a="closem"><div class="cht">Kapat</div></button></div>`);
        break;
      }
      case 'bInfo': {
        const B = BUILDINGS[x];
        if (!B) break;
        const gain = Object.entries(B.g||{}).map(([r,v])=>
          `<div class="row"><span>${RES[r].n}</span><b style="color:#65e08a">+${v}/ay</b></div>`).join('') || '';
        const uses = Object.entries(B.u||{}).map(([r,v])=>
          `<div class="row"><span>${RES[r].n} tüketimi</span><b style="color:#ff5f6d">−${v}/ay</b></div>`).join('') || '';
        const cost = Object.entries(B.c).map(([r,v])=>
          `<div class="row"><span>${RES[r].n}</span><b>${v}</b></div>`).join('');
        const spec = B.sp === 'yard' ? 'Bu sistemde gemi inşasına izin verir. Her tersane bir gemi üzerinde paralel çalışır.'
                   : B.sp === 'def'  ? 'Sisteme +180 savunma gücü ekler (Kale Doktrini ile +%50).'
                   : B.sp === 'hot'  ? 'Volkanik, toksik ve ölü dünyalarda ek +4 enerji üretir.'
                   : B.sp === 'lift' ? 'Bu kolonideki TÜM üretimi +%18 artırır.'
                   : B.sp === 'grow' ? 'Bu kolonide nüfus artışını +%35 hızlandırır.'
                   : B.sp === 'hab'  ? 'Yaşanamaz bir dünyada küçük yerleşim açar.'
                   : '';
        this.openModal(
          `<div class="mhd"><span>${esc(B.n)}</span></div>
           <div class="mbd">${esc(B.d)}
             ${spec ? `<div class="mini" style="color:#6ff2c8;margin-top:6px">${spec}</div>` : ''}
             <div class="ph">İNŞA BEDELİ</div>${cost}
             <div class="ph">AYLIK BAKIM</div>
             <div class="row"><span>Enerji</span><b style="color:#ff5f6d">−${B.up||0}/ay</b></div>
             <div class="row"><span>İşgücü</span><b style="color:#ff9b3d">1 nüfus</b></div>
             ${gain ? `<div class="ph">KAZANÇ</div>${gain}` : ''}
             ${uses ? uses : ''}
             <div class="ph">SINIR</div>
             <div class="row"><span>Koloni başına en fazla</span><b>${B.max}</b></div>
             <div class="mini">Üretim, kolonideki işgücü oranına göre ölçeklenir.</div>
           </div>
           <div class="mft"><button class="ch" data-a="closem"><div class="cht">Kapat</div></button></div>`);
        break;
      }
      case 'showEv': {
        const sy = G.sys[+x];
        /* FAZ 12: olay küçültülür (kaybolmaz), harita hedefe odaklanır.
           Karar penceresi üst bardaki rozetten geri açılabilir. */
        this.minimizeModal();
        if (sy){
          View.selSys = sy;
          /* ═══ FAZ 47: ZOOM KORUNUR ═══
             Eskiden cam.z zorla .55'e çekiliyordu; galaksi genelini
             izleyen oyuncu her bildirimde yakınlaşmış buluyordu
             kendini. Artık yalnız KAYDIRMA yapılır. */
          View.panTo(sy.x, sy.y);
          View.ping(sy);
          this.tab('sistem');
        } else {
          say('Hedef sistem bulunamadı', 'war');
        }
        this.refresh();
        break;
      }
      case 'minModal': this.minimizeModal(); break;
      case 'restoreModal': this.restoreModal(); break;
      case 'stashNote': {
        const back = this.stashNote();
        $('modal').className = 'hidden';
        $('modal').innerHTML = '';
        if (back) say('Karar bildirimlerde bekliyor');
        this.refresh();
        break;
      }
      case 'openNote': this.openNote(x); break;
      case 'closem': this.closeModal(); break;
      case 'restart': location.reload(); break;
    }
  },

  tab(k){
    if (k !== 'sistem') View.hl = null;
    this.cur = k;
    [...document.querySelectorAll('.tab')].forEach(t=>t.classList.toggle('on', t.dataset.x===k));
    $('sidebar').classList.remove('off');
    $('sbToggle').classList.remove('off');
    $('sbToggle').textContent = '›';
    this.refresh();
  },

  setSpeed(i){
    G.speed = i;
    [...document.querySelectorAll('.sp')].forEach(b=>b.classList.toggle('on', +b.dataset.x===i));
  },

  /* ---------- üst bar ---------- */
  topbar(){
    const e = G.p, r = e.res, inc = e.inc;
    const cell = k => {
      const d = RES[k];
      const v = inc[k]||0;
      return `<div class="res" title="${d.n}"><em style="color:${d.c}">${d.ico}</em>` +
             `<u style="color:${d.c}">${d.k}</u><b>${fmt(r[k])}</b>` +
             `<s class="${v>=0?'p':'n'}">${sgn(v)}</s></div>`;
    };
    const usage = fleetUsage(e);
    /* ── FAZ 11: ÇALKANTI ROZETİ ──
       Aktif galaktik çalkantı üst barda kalan tur sayısıyla durur.
       Sayaç doğrudan G.upheaval.left'i okur; upheavalTick her ay
       bunu azalttığı için rozet tik döngüsüyle kendiliğinden
       senkron kalır — ayrı bir zamanlayıcı YOK. */
    let rozet = '';
    if (typeof upheavalActive === 'function' && upheavalActive()){
      const U = upheavalInfo();
      const kalan = G.upheaval.left;
      const oran = kalan / Math.max(1, G.upheaval.total);
      /* Son çeyrekte sönümlenen renk: bitmek üzere olduğu anlaşılsın */
      const renk = oran > .5 ? '#ff9b3d' : oran > .25 ? '#e8c46a' : '#7d90ad';
      const iyi = U.mods && ((U.mods.araMul || 0) > 0 || (U.mods.minMul || 0) > 0 ||
                             (U.mods.stab || 0) > 0);
      rozet = `<div class="tsep"></div>` +
        `<div class="res upBadge" title="${esc(U.n)} — ${esc(U.d)}"` +
        ` style="border-left:2px solid ${iyi ? '#65e08a' : renk}">` +
        `<em style="color:${iyi ? '#65e08a' : renk}">${U.ico}</em>` +
        `<u style="color:${iyi ? '#65e08a' : renk}">ÇALK</u>` +
        `<b>${kalan}</b><s>tur</s></div>`;
    }
    /* FAZ 12: küçültülmüş olay penceresi rozeti — dokununca geri açılır */
    if (G.minNote){
      let baslik = 'Bekleyen karar';
      if (G.minNote !== '_raw' && G.inbox){
        const it = G.inbox.find(x => x.uid === G.minNote);
        if (it) baslik = (it.title || 'Olay') + (it.sub ? ' · ' + it.sub : '');
      }
      rozet += `<div class="tsep"></div>` +
        `<div class="res upBadge minBadge" data-a="restoreModal"` +
        ` title="${esc(baslik)} — geri aç"` +
        ` style="border-left:2px solid #8b7bff;cursor:pointer">` +
        `<em style="color:#8b7bff">▣</em><u style="color:#8b7bff">OLAY</u>` +
        `<b>AÇ</b></div>`;
    }

    /* Hiçlik Sürüsü aktifse o da rozet alır — tehdit gizlenemez */
    if (typeof crisisActive === 'function' && crisisActive()){
      rozet += `<div class="tsep"></div>` +
        `<div class="res upBadge" title="Hiçlik Sürüsü — galaktik kriz"` +
        ` style="border-left:2px solid #ff5f6d">` +
        `<em style="color:#ff5f6d">🌌</em><u style="color:#ff5f6d">KRİZ</u>` +
        `<b>${G.crisis.stage}</b><s>aşama</s></div>`;
    }

    $('topbar').innerHTML =
      ['min','ene','yiy','tuk','ala','etk'].map(cell).join('<div class="tsep"></div>') + rozet +
      `<div class="tsep"></div><div class="res" title="Araştırma"><em style="color:${RES.ara.c}">${RES.ara.ico}</em><u style="color:${RES.ara.c}">ARŞ</u><b>${fmt(inc.ara)}</b><s>/ay</s></div>` +
      `<div class="tsep"></div><div class="res" title="Filo kapasitesi"><em style="color:#9fb6cc">⛴</em><u style="color:#9fb6cc">FİLO</u><b>${usage}/${Math.round(e.cap)}</b></div>` +
      (e.crisis?`<div class="tsep"></div><div class="res" style="color:#ff5f6d"><b>⚠ ${e.crisis.toUpperCase()} KRİZİ</b></div>`:'') +
      (e.shortage?`<div class="tsep"></div><div class="res" style="color:#e0a8ff"><b>⚠ MAL KITLIĞI</b></div>`:'') +
      (battleCount()?`<div class="tsep"></div><button class="res warnBtn" data-a="gobattle" style="color:#ff5f6d"><b>⚔ ${battleCount()} ÇATIŞMA</b></button>`:'') +
      (crisisActive()?`<div class="tsep"></div><button class="res warnBtn" data-a="crisInfo" style="color:#c026d3"><b>🌋 KRİZ A${G.crisis.stage}</b></button>`:'') +
      /* FAZ 11: aktif galaktik çalkantı rozeti — kalan tur sayısıyla */
      (()=>{ if (typeof upheavalActive !== 'function' || !upheavalActive()) return '';
             const U = upheavalInfo();
             if (!U) return '';
             const kalan = G.upheaval.left;
             const iyi = !!(U.mods && ((U.mods.araMul||0) > 0 || (U.mods.minMul||0) > 0 ||
                                       (U.mods.stab||0) > 0));
             const col = iyi ? '#65e08a' : '#ff9b3d';
             return `<div class="tsep"></div><button class="res warnBtn" data-a="upInfo"
               style="color:${col}" title="${esc(U.n)}"><b>${U.ico} ${kalan} TUR</b></button>`; })() +
      (()=>{ const w = G.emps.filter(o=>!o.dead && o.id!==0 && e.war[o.id]);
             return w.length ? `<div class="tsep"></div><button class="res warnBtn" data-a="diploPane" style="color:#ff9b3d"><b>⚔ ${w.length} SAVAŞ</b></button>` : ''; })();
  },

  /* ---------- panel yönlendirme ---------- */

  tick(){
    this.topbar();
    this.drawInbox();
    const fb = $('fedBtn');
    if (fb){
      const myFed = findFed(G.p);
      fb.classList.toggle('hot', !!(myFed && myFed.vote));
      fb.classList.toggle('on', !!myFed);
    }
    $('stardate').textContent = G.year + '.' + String(G.month).padStart(2,'0');
    this.seltag();
  },
  refresh(){
    this.topbar();
    /* FAZ 12: bilim/diplo/imp artık sağ panelde değil — eski kayıtlı
       sekme seçimi varsa sisteme düşülür (kayıt uyumluluğu). */
    if (this.cur !== 'sistem' && this.cur !== 'filo' && this.cur !== 'intel')
      this.cur = 'sistem';
    const el = $('panel');
    const y = el.scrollTop;
    el.innerHTML = this['p_'+this.cur] ? this['p_'+this.cur]() : '';
    if (this.keepScroll) el.scrollTop = y;
    this.keepScroll = false;
    this.seltag();
    $('stardate').textContent = G.year + '.' + String(G.month).padStart(2,'0');
  },

  seltag(){
    const t = $('seltag');
    if (!View.sel){ t.classList.add('hidden'); return; }
    const f = View.sel;
    t.classList.remove('hidden');
    t.innerHTML = `<span>${esc(f.name)} · ${isArmed(f)?fmt(fleetPower(f))+' güç':f.ships.length+' gemi'}</span>` +
      `<button data-a="route" class="${View.route?'on':''}">${View.route?(View.routed?'+DURAK':'HEDEF SEÇ'):'ROTA'}</button>` +
      `<button data-a="stop">DUR</button>` +
      (f.sys >= 0 ? `<button data-a="selsys" data-x="${f.sys}">SİSTEM ›</button>` : '');
  },

  /* =============== SİSTEM =============== */
  p_sistem(){
    const s = View.selSys || (View.sel && View.sel.sys>=0 ? G.sys[View.sel.sys] : G.sys[G.p.home]);
    if (!s) return `<div class="empty">Haritadan bir sistem seç.</div>`;
    View.selSys = s;
    const e = G.p;
    const owner = s.owner>=0 ? G.emps[s.owner] : null;
    const surv = pSurv(s);
    let h = `<div class="ph">${esc(s.name)}</div>`;
    h += `<div class="row"><span>Yıldız</span><b style="color:${s.star.c}">${s.star.n}</b></div>`;
    h += `<div class="row"><span>Hâkimiyet</span><b style="color:${owner?owner.col:'#7d90ad'}">${owner?esc(owner.name):'Sahipsiz'}</b></div>`;
    h += `<div class="row"><span>Hiper yol</span><b>${s.lanes.length} bağlantı</b></div>`;

    /* ═══ FAZ 56: LOJİSTİK KAPSAM GÖSTERGESİ ═══
       Haritada rota üstünde ve filo panelinde tedarik vardı ama
       SİSTEM panelinde yoktu — oyuncu "buraya filo yollarsam ne
       olur?" sorusunu tıklamadan yanıtlayamıyordu. */
    if (typeof fleetSupply === 'function' && typeof supplyDistance === 'function'){
      const sahte = {sys: s.id, ships: [{c:'kru', h:1}], e: e.id};
      const mes = supplyDistance(e, sahte);
      const sup = fleetSupply(e, sahte);
      const yuzde = Math.round(sup * 100);
      const renk = sup >= 1 ? '#65e08a' : sup >= .7 ? '#f2d452'
                 : sup >= .55 ? '#ff9b3d' : '#ff5f6d';
      const durum = sup >= 1
        ? (mes === 0 ? 'Kapsamda — dost toprak' : 'Kapsamda — ' + mes + ' atlama')
        : 'Kapsam dışı — ' + mes + ' atlama';
      h += `<div class="row"><span>📦 Lojistik ağ</span>
        <b style="color:${renk}">${durum} (%${yuzde})</b></div>`;
      if (sup < 1)
        h += `<div class="mini" style="color:${renk}">Buraya gönderilen filo
          <b>%${yuzde}</b> güçte savaşır. Yakınına karakol ya da tersane kurmak
          hattı ileri taşır.</div>`;
    }
    if (s.ruin){
      const pct = clamp(s.ruin.hp / s.ruin.max * 100, 0, 100);
      const rw = RUIN_REWARDS.find(r=>r.k===s.ruin.rw);
      h += `<div class="box" style="border-color:#8b7bff"><div class="bt">
        <span>🏺 KAYIP UYGARLIK KALINTISI</span>
        <span class="mono" style="color:#8b7bff">${Math.max(0,Math.round(s.ruin.hp))}</span></div>
        <div class="bar pl"><i style="width:${pct}%"></i></div>
        <div class="bd">${s.ruin.awake ? '⚠ Savunma sistemleri UYANDI ve ateş ediyor.'
          : 'Uykuda ama çok güçlü. Silahlı filo girerse uyanır.'}
          <br>Ödül: <b style="color:#8b7bff">${rw ? rw.n + ' — ' + rw.d : 'bilinmiyor'}</b></div>`;
      const armed2 = G.fleets.filter(f=>f.e===0 && isArmed(f));
      const hereP = armed2.filter(f=>f.sys===s.id).reduce((a,f)=>a+fleetPower(f),0);
      if (hereP > 0) h += `<div class="mini" style="color:#6ff2c8">⚔ Kuşatma sürüyor — güç ${fmt(hereP)}</div>`;
      else if (armed2.length) h += `<div class="act2">` + armed2.slice(0,3).map(f=>
        `<button class="abtn" data-a="sendhere" data-x="${f.id}:${s.id}">${esc(f.name)} (${fmt(fleetPower(f))}) → SALDIR</button>`).join('') + `</div>`;
      h += `</div>`;
    }
    if (s.nest){
      const here = G.fleets.filter(f=>f.e===0 && f.sys===s.id && isArmed(f));
      const myPow = here.reduce((a,f)=>a+fleetPower(f),0);
      h += `<div class="box" style="border-color:#8a2f3f"><div class="bt"><span>☠ KORSAN YUVASI</span>
        <span class="mono" style="color:#ff5f6d">${Math.max(0,Math.round(s.nest.hp))} dayanım</span></div>
        <div class="bar hp"><i style="width:${clamp(s.nest.hp/1400*100,0,100)}%"></i></div>
        <div class="bd">Düzenli akıncı gönderiyor. Yok edilirse bölge güvenli olur ve
        <b style="color:#65e08a">+260 alaşım, +180 mineral, +40 etki</b> kazanırsın.</div>`;
      if (myPow > 0){
        h += `<div class="mini" style="color:#6ff2c8">⚔ Filon kuşatmayı sürdürüyor — güç ${fmt(myPow)}</div>`;
      } else {
        const armed = G.fleets.filter(f=>f.e===0 && isArmed(f));
        h += armed.length
          ? `<div class="mini">Yuvayı yıkmak için savaş filosu gönder:</div><div class="act2">` +
            armed.slice(0,3).map(f=>`<button class="abtn dgr" data-a="sendhere" data-x="${f.id}:${s.id}">${esc(f.name)} (${fmt(fleetPower(f))}) → SALDIR</button>`).join('') + `</div>`
          : `<div class="mini" style="color:#ff9b3d">Savaş filon yok — yuvaya saldıramazsın.</div>`;
      }
      h += `</div>`;
    }
    if (sysDefense(s)) h += `<div class="row"><span>Savunma</span><b style="color:#ff9b3d">${sysDefense(s)}</b></div>`;

    if (!surv){
      h += `<div class="empty">Bu sistem taranmadı.<br>Gezegen verileri bilinmiyor.<br><br>Bir bilim gemisi gönder.</div>`;
      const sci = G.fleets.filter(f=>f.e===0 && fleetHasRole(f,'bilim'));
      View.hl = new Set(sci.map(f=>f.id));   // haritada nabız gibi parlasınlar
      if (sci.length){
        h += `<div class="act2">${sci.map(f=>{
          const st = fleetStatus(f);
          return `<button class="abtn pri" data-a="sendhere" data-x="${f.id}:${s.id}">${esc(f.name)} → TARA` +
                 `<br><span class="stt ${st.c}" style="border:none;padding:0">${st.t}</span></button>`;
        }).join('')}</div>`;
        h += `<div class="mini">Bilim gemilerin haritada işaretlendi.</div>`;
      }
      else h += `<div class="mini" style="color:#ff9b3d">Bilim gemin yok — tersanede inşa et.</div>`;
      return h;
    }

    h += `<div class="ph">GEZEGENLER</div>`;
    for (const pl of s.planets){
      const def = PLANETS[pl.t];
      const hab = habOf(e, pl);
      const dep = pl.dep ? DEPOSITS.find(d=>d.id===pl.dep) : null;
      const mine = pl.owner === 0;
      h += `<div class="box">`;
      h += `<div style="display:flex;gap:9px;align-items:flex-start">`;
      h += planetOrb(pl.t, pl.seed, 34);   // FAZ 59: CSS küre
      h += `<div style="flex:1;min-width:0">`;
      let sym = '';
      if (pl.col && pl.owner === 0){
        const freeSlots = colonySlots(pl.col, e, pl) - colonyUsed(pl.col);
        const freeJobs = pl.col.pop - colonyUsed(pl.col);
        if (freeSlots > 0 && freeJobs > 0)
          sym = `<span class="buildSym" title="İnşa edilebilir yer ve işgücü var">🔨 ${freeSlots}</span>`;
        else if (freeSlots > 0)
          sym = `<span class="buildSym" style="color:#ff9b3d" title="Yer var ama işgücü yetersiz">🔨 ${freeSlots} ⚠</span>`;
      }
      h += `<div class="bt"><span>${esc(pl.name)}${sym}</span>${pl.owner>=0?`<span class="flag" style="background:${G.emps[pl.owner].col}"></span>`:''}</div>`;
      h += `<div class="bd">${def.n}${def.k==='hab'?` · yaşanabilirlik <b style="color:${hab>=60?'#65e08a':hab>=35?'#ff9b3d':'#ff5f6d'}">%${hab}</b>`:''}${pl.sz?` · boyut ${pl.sz}`:''}</div>`;
      const pTrait = pl.col ? planetTrait(pl.col) : null;
      if (pTrait) h += `<div class="mini" style="color:#6ff2c8">${pTrait.ico} ${pTrait.n} — ${pTrait.d}</div>`;

      /* ═══ FAZ 35: ÖLÜ DÜNYA VE TERRAFORM ═══ */
      if (pl.shattered){
        const bio = pl.devoured !== undefined;
        h += `<div class="mini" style="color:${bio?'#a03cc8':'#ff5f6d'}">
          ${bio ? '☣ Biyolojik enkaz — Sürü tarafından yutuldu'
                : '☄ Parçalanmış dünya — Colossus enkazı'}</div>`;
        if (pl.terraform){
          const tf = pl.terraform;
          const yuzde = Math.round((1 - tf.left / tf.total) * 100);
          h += `<div class="gDef"><div class="gRow">
            <span class="gIco" style="color:#65e08a">🌱</span>
            <div class="gBarW"><div class="gBar" style="width:${yuzde}%;
              background:#65e08a"></div></div>
            <b style="color:#65e08a">%${yuzde}</b></div>
            <div class="mini" style="grid-column:1/-1">Terraform sürüyor ·
              ${Math.ceil(tf.left / 12)} yıl kaldı</div></div>`;
        } else if (typeof canTerraform === 'function'){
          const chk = canTerraform(e, s, pl);
          const C = (typeof TERRAFORM_COST !== 'undefined') ? TERRAFORM_COST : {};
          const bedel = Object.keys(C).map(r =>
            `<span style="color:${(e.res[r]||0) >= C[r] ? RES[r].c : '#ff5f6d'}">${
              RES[r].ico}${C[r]}</span>`).join(' ');
          h += `<div class="act2"><button class="abtn ${chk.ok?'pri':'dis'}"
            data-a="terraform" data-x="${s.id}:${pl.i}">🌱 TERRAFORM
            <br><span style="font-size:9px">${bedel} · ${
              typeof TERRAFORM_MONTHS !== 'undefined' ? Math.round(TERRAFORM_MONTHS/12) : 5
            } yıl</span></button></div>`;
          if (!chk.ok) h += `<div class="mini" style="color:#7d90ad">${esc(chk.why)}</div>`;
        }
      }
      if (pl.lux){
        const L = LUXURY[pl.lux];
        h += `<div class="mini" style="color:${L.c}">${L.ico} ${L.n} — ${L.d}${pl.col?'':' (koloni kurulunca üretilir)'}</div>`;
      }
      if (pl.terra) h += `<div class="mini" style="color:#65e08a">🌍 Terraform kademe ${pl.terra} (+${pl.terra*TERRA_BONUS} yaşanabilirlik)</div>`;
      if (dep) h += `<div class="mini" style="color:#6ff2c8">◈ ${dep.n} (${Object.entries(dep.g).map(([k,v])=>'+'+v+' '+RES[k].n).join(', ')})</div>`;
      h += `</div></div>`;

      if (pl.col){
        const c = pl.col;
        /* FAZ 46: float küsuratı — 22.719999999999999 gibi değerler
           panelde ham çıkıyordu. Nüfus tam sayı gösterilir. */
        h += `<div class="row" style="margin-top:6px"><span>Nüfus</span><b>${Math.floor(c.pop)} / ${c.cap}</b></div>`;
        h += `<div class="bar"><i style="width:${clamp(c.pop/c.cap*100,0,100)}%"></i></div>`;
        h += `<div class="row"><span>İstikrar / moral</span><b style="color:${c.stab>55?'#65e08a':c.stab>28?'#ff9b3d':'#ff5f6d'}">${Math.round(c.stab)}</b></div>`;
        h += `<div class="bar ${c.stab>55?'':'hp'}"><i style="width:${clamp(c.stab,0,100)}%;background:${c.stab>55?'#65e08a':c.stab>28?'#ff9b3d':'#ff5f6d'}"></i></div>`;
        if (c.stab < 28) h += `<div class="mini" style="color:#ff5f6d">⚠ Moral çökük — kuşatma altında teslim olabilir</div>`;
        if (mine){
          const F = focusOf(c), cd = c.fcd||0;
          h += `<div class="mini">ODAK — ${F.ico} ${F.n}${cd>0?` <span style="color:#ff9b3d">(${Math.ceil(cd/30)} ay kilitli)</span>`:''}</div>`;
          h += `<div class="act2">`;
          for (const k in FOCUS){
            const on = c.f === k;
            h += `<button class="abtn ${on?'pri':''} ${cd>0&&!on?'dis':''}" data-a="focus" data-x="${s.id}:${pl.i}:${k}" title="${esc(FOCUS[k].d)}">${FOCUS[k].ico}<br><span style="font-size:9px">${FOCUS[k].n}</span></button>`;
          }
          h += `</div>`;
          h += `<div class="mini" style="color:#7d90ad">${esc(F.d)}</div>`;
          const staff = colonyStaffing(c);
          const jobs = colonyUsed(c);
          h += `<div class="row"><span>İşgücü</span><b style="color:${staff>=1?'#65e08a':'#ff5f6d'}">${Math.floor(c.pop)} / ${jobs} iş</b></div>`;
          if (staff < 1)
            h += `<div class="mini" style="color:#ff5f6d">⚠ Nüfus yetersiz — yapılar %${Math.round(staff*100)} kapasiteyle çalışıyor</div>`;
          const slotsN = colonySlots(c, e, pl), usedN = colonyUsed(c);
          const slotFull = usedN >= slotsN;
          /* ═══ FAZ 47: DONANMA UYKUSU UYARISI ═══ */
      if (pl.col && pl.col.b && pl.col.b.tersane && typeof navyAsleep === 'function'){
        const uy = navyAsleep(e);
        if (uy.uyku){
          const sebep = uy.why === 'kasa'
            ? 'Kasa alaşımı ' + Math.round(e.res.ala) + ' (' +
              (typeof NAVY_SLEEP_ALA !== 'undefined' ? NAVY_SLEEP_ALA : 500) + ' altı)'
            : 'Filo kapasitesi %' + Math.round(fleetUsage(e) / Math.max(1, e.cap) * 100);
          h += `<div class="mini" style="color:#ff9b3d">💤 OTOMATİK DONANMA UYKUDA —
            ${esc(sebep)}. Elle inşa serbest.</div>`;
        }
      }

      /* ═══ FAZ 42: AYRILIKÇI HAREKET GÖSTERGESİ ═══
             Sayaç işlemeye başlayınca belirir, istikrar düzelip
             sayaç sıfırlanınca kendiliğinden kaybolur. */
          if (pl.col.secede > 0 && typeof SECESSION_LIMIT !== 'undefined'){
            const sc = pl.col.secede;
            const lim = SECESSION_LIMIT;
            const yuzde = Math.min(100, Math.round(sc / lim * 100));
            /* Sayaç ilerledikçe turuncudan kırmızıya */
            const renk = yuzde >= 75 ? '#ff5f6d' : yuzde >= 45 ? '#ff9b3d' : '#d6c04a';
            const donmus = (pl.martial_law > 0) || ((pl.recent_conquest || 0) > 0);
            h += `<div class="gDef" style="border-color:${renk}">
              <div class="gRow">
                <span class="gIco" style="color:${renk}">⚠</span>
                <div class="gBarW"><div class="gBar" style="width:${yuzde}%;
                  background:${renk}"></div></div>
                <b style="color:${renk}">${sc}/${lim}</b></div>
              <div class="mini" style="grid-column:1/-1;margin:2px 0 0;color:${renk}">
                AYRILIKÇI İSYAN — ${donmus
                  ? 'sıkıyönetim sayacı donduruyor'
                  : lim - sc + ' ay içinde kopabilir'}</div>
              <div class="mini" style="grid-column:1/-1;margin:1px 0 0">
                İstikrarı ${typeof SECESSION_STAB !== 'undefined' ? SECESSION_STAB : 25}
                üstüne çıkar ya da sıkıyönetim ilan et — hareket söner.</div>
            </div>`;
          }

          /* ═══ FAZ 42: AYRILIKÇI HAREKET GÖSTERGESİ ═══
             Sayaç işlemeye başlayınca beliriyor, istikrar düzelip
             sayaç sıfırlanınca kendiliğinden kayboluyor. */
          if ((pl.col.secede || 0) > 0 && typeof SECESSION_LIMIT !== 'undefined'){
            const sc = pl.col.secede;
            const yuzde = Math.min(100, Math.round(sc / SECESSION_LIMIT * 100));
            /* Sarıdan kızıla: %60 üstü tehlike bölgesi */
            const renk = yuzde >= 80 ? '#ff5f6d' : yuzde >= 50 ? '#ff9b3d' : '#d6c04a';
            const kalan = Math.max(0, SECESSION_LIMIT - sc);
            h += `<div class="gDef" style="border-color:${renk}">
              <div class="gRow">
                <span class="gIco" style="color:${renk}">⚠</span>
                <div class="gBarW"><div class="gBar" style="width:${yuzde}%;
                  background:${renk}"></div></div>
                <b style="color:${renk}">${sc}/${SECESSION_LIMIT}</b></div>
              <div class="mini" style="grid-column:1/-1;margin:2px 0 0;color:${renk}">
                ${(() => {
                  /* FAZ 43: bu gezegende çözülmemiş kışkırtma var mı? */
                  const supheli = (e.hitLog || []).some(w =>
                    w.k === 'kiskirt' && !w.known &&
                    w.sys === s.id && w.pi === pl.i);
                  return supheli
                    ? '<span style="color:#8b7bff">🔍 DIŞ MÜDAHALE ŞÜPHESİ</span> — ' +
                      'bu isyan doğal olmayabilir. İstihbarat sekmesinden ' +
                      '<b>Derin Soruşturma</b> yap.<br>' : '';
                })()}
                AYRILIKÇI İSYAN — ${kalan} ay içinde istikrarı
                ${typeof SECESSION_STAB !== 'undefined' ? SECESSION_STAB : 40}
                üstüne çıkarmazsan bu dünya kopacak.</div>
              <div class="mini" style="grid-column:1/-1">
                Sıkıyönetim sayacı dondurur · istikrar düzelirse ayda −3 geriler
                ${pl.martial_law > 0 ? '<br><b style="color:#65e08a">⚖ Sıkıyönetim aktif — sayaç donduruldu</b>' : ''}
              </div></div>`;
          }

          /* ═══ FAZ 21: GEZEGEN SAVUNMASI ═══
             Kalkan ve garnizon, nüfus/binaların hemen üstünde.
             İki ince bar — dar ekranda taşmaz, flex ile büzülür. */
          const kalkan = Math.round(pl.col.shield || 0);
          const kCap = (typeof shieldCap === 'function')
            ? shieldCap(pl.col, e, {s:s.id, i:pl.i}) : 0;
          const garn = Math.round(pl.col.garrison || 0);
          h += `<div class="gDef">
            <div class="gRow">
              <span class="gIco" style="color:${kalkan>0?'#8b7bff':'#3a4560'}">⬡</span>
              <div class="gBarW"><div class="gBar" style="width:${kalkan}%;
                background:${kalkan>=60?'#8b7bff':kalkan>0?'#6a5fd0':'#3a4560'}"></div></div>
              <b style="color:${kalkan>0?'#8b7bff':'#7d90ad'}">${kalkan}${
                kCap>kalkan?'<span style="color:#4d5b78">/'+kCap+'</span>':''}</b>
            </div>
            <div class="gRow">
              <span class="gIco" style="color:${garn>0?'#ff9b3d':'#3a4560'}">⚔</span>
              <div class="gBarW"><div class="gBar" style="width:${
                Math.min(100, garn/2.2)}%;background:#ff9b3d"></div></div>
              <b style="color:#ff9b3d">${garn}</b>
            </div>
            ${pl.col.reinforced ? `<div class="mini" style="grid-column:1/-1;
              margin:1px 0 0;color:#65e08a">⛊ Yörüngedeki ordulardan
              +${Math.round(pl.col.reinforced)} takviye</div>` : ''}
            ${pl.col.scorched !== undefined ? `<div class="mini" style="grid-column:1/-1;
              margin:1px 0 0;color:#ff5f6d">☠ Bombardıman harabesi</div>` : ''}
            <div class="mini" style="grid-column:1/-1;margin:2px 0 0">
              Kalkan yörüngeden çıkarmayı engeller · Garnizon yüzeyde savaşır</div>
          </div>`;

          const kuyrukN = (typeof colonyQueued === 'function') ? colonyQueued(pl.col) : 0;
          h += `<div class="mini" style="color:${slotFull?'#ff5f6d':'#7d90ad'}">YAPILAR ${usedN}${
            kuyrukN?`<span style="color:#ff9b3d">+${kuyrukN}</span>`:''}/${slotsN}${pl.hab?' (habitat)':''}</div>`;
          if (slotFull)
            h += `<div class="mini" style="color:#ff5f6d">⚠ Yapı slotu dolu — nüfus arttıkça açılır (her 2.2 nüfus = 1 slot)</div>`;
          else if (staff < 1)
            h += `<div class="mini" style="color:#ff9b3d">⚠ Yeni yapı kurabilirsin ama işgücü yetmiyor — önce nüfus büyümeli</div>`;
          h += `<div class="act2">`;
          for (const k in BUILDINGS){
            const B = BUILDINGS[k], n = c.b[k]||0;
            const full = n >= B.max || colonyUsed(c) >= colonySlots(c, e, pl);
            const afford = Object.keys(B.c).every(r => e.res[r] >= B.c[r]);
            h += `<div class="bWrap" style="flex:1;min-width:66px">
              <button class="bInfo" data-a="bInfo" data-x="${k}">i</button>
              <button class="abtn ${full||!afford?'dis':''}" data-a="build" data-x="${s.id}:${pl.i}:${k}" style="width:100%">` +
                 `${B.n.split(' ')[0]} ${n}/${B.max}<br><span style="font-size:9px">` +
                 Object.entries(B.c).map(([r,v])=>`<span style="color:${e.res[r]>=v?RES[r].c:'#ff5f6d'}">${RES[r].ico}${v}</span>`).join(' ') +
                 `</span></button>` +
                 /* FAZ 14: mevcut binayı yıkma tuşu */
                 (n > 0 ? `<button class="demX" data-a="demolish" data-x="${s.id}:${pl.i}:${k}"
                    title="${esc(B.n)} yık — slot boşalır, %35 hurda geri döner">⌫</button>` : '') +
                 `</div>`;
          }
          h += `</div>`;

          /* ═══ FAZ 13: İNŞAAT KUYRUĞU ═══
             Sıradaki işler, kalan süre ve iptal tuşu. Yalnızca en
             öndeki iş ilerler; diğerleri sırada bekler. */
          const q = pl.col.q || [];
          if (q.length){
            h += `<div class="mini" style="margin-top:6px;color:#ff9b3d">
              🔨 İNŞAAT KUYRUĞU (${q.length})</div>`;
            q.forEach((w, qi) => {
              const B2 = BUILDINGS[w.key];
              const yuzde = Math.round((1 - w.left / Math.max(1, w.tot)) * 100);
              const kalanAy = Math.max(0, Math.ceil(w.left / 30));
              const aktif = qi === 0;
              const iade = Object.keys(w.dem ? (w.refund||{}) : (w.paid||{}))
                .map(r => RES[r].ico + Math.round((w.dem?w.refund:w.paid)[r])).join(' ');
              h += `<div class="bq ${aktif?'on':''} ${w.dem?'dem':''}">
                <div class="bqBar" style="width:${aktif?yuzde:0}%"></div>
                <div class="bqTxt">
                  <b>${w.dem ? '⌫ ' : ''}${esc(B2.n)}${w.dem ? ' <span style="color:#ff5f6d">yıkım</span>' : ''}</b>
                  <i>${aktif ? '%' + yuzde + ' · ' + kalanAy + ' ay' : 'sırada ' + qi}</i>
                </div>
                <button class="bqX" data-a="cancelBuild" data-x="${s.id}:${pl.i}:${qi}"
                  title="${w.dem ? 'Yıkım emrini iptal et' : 'İptal et — ' + iade + ' iade edilir'}">✕</button>
              </div>`;
            });
          }
        }
        if (mine && PLANETS[pl.t].k === 'hab'){
          const lvl = pl.terra || 0, max = terraLevelMax(e);
          if (pl.terraJob){
            h += `<div class="mini" style="color:#6ff2c8">🌍 TERRAFORM SÜRÜYOR — ${Math.ceil(pl.terraJob.left/30)} ay</div>
                  <div class="bar"><i style="width:${(1-pl.terraJob.left/pl.terraJob.tot)*100}%"></i></div>`;
          } else if (max === 0){
            h += `<div class="mini">Terraform için İklim Mühendisliği araştır.</div>`;
          } else if (lvl >= Math.min(max, TERRA_STEPS.length)){
            h += `<div class="mini" style="color:#65e08a">🌍 Terraform kademesi ${lvl} — bu teknolojiyle sınırda</div>`;
          } else {
            const st = TERRA_STEPS[lvl];
            const afford = e.res.min >= st.min && e.res.ene >= st.ene;
            h += `<div class="act2"><button class="abtn ${afford?'pri':'dis'}" data-a="terra" data-x="${s.id}:${pl.i}">
              🌍 TERRAFORM (kademe ${lvl+1})<br><span style="font-size:9px">
              <span style="color:${e.res.min>=st.min?RES.min.c:'#ff5f6d'}">${RES.min.ico}${st.min}</span>
              <span style="color:${e.res.ene>=st.ene?RES.ene.c:'#ff5f6d'}">${RES.ene.ico}${st.ene}</span>
              · ${st.ay} ay · +${TERRA_BONUS} yaşanabilirlik</span></button></div>`;
          }
        }
      } else if (canColonize(e, s, pl)){
        const ships = G.fleets.filter(f=>f.e===0 && fleetHasRole(f,'koloni'));
        h += ships.length
          ? `<div class="act2"><button class="abtn pri" data-a="colonize" data-x="${s.id}:${pl.i}">KOLONİ KUR</button></div>`
          : `<div class="mini" style="color:#ff9b3d">Koloni gemisi yok</div>`;
      } else if (canHabitat(e, s, pl)){
        const c2 = BUILDINGS.habitat.c;
        const afford = Object.keys(c2).every(r=>e.res[r]>=c2[r]);
        h += `<div class="act2"><button class="abtn ${afford?'pri':'dis'}" data-a="habitat" data-x="${s.id}:${pl.i}">
          🛰 HABİTAT KUR<br><span style="font-size:9px">` +
          Object.entries(c2).map(([r,v])=>`<span style="color:${e.res[r]>=v?RES[r].c:'#ff5f6d'}">${RES[r].ico}${v}</span>`).join(' ') +
          ` · küçük yerleşim</span></button></div>`;
      } else if (def.k === 'hab' && pl.owner < 0){
        h += `<div class="mini" style="color:#ff5f6d">Yaşanabilirlik çok düşük (%${hab})</div>`;
        if (!e.techs.t_habitat) h += `<div class="mini">Yörünge Habitatları teknolojisi bu tür dünyaları açar.</div>`;
      }
      h += `</div>`;
    }

    if (s.owner === 0 && hasYard(s)){
      h += `<div class="ph">TERSANE</div>`;
      if (s.queue.length){
        const slots = yardCount(s);
        const totDays = Math.ceil(s.queue.reduce((a,q)=>a+q.left,0));
        h += `<div class="row"><span>Tersane yuvası</span><b style="color:#6ff2c8">${slots} paralel</b></div>`;
        h += `<div class="row"><span>Kuyrukta</span><b>${s.queue.length} gemi</b></div>`;
        h += `<div class="qbox">`;
        s.queue.forEach((q,i)=>{
          const act = i < slots;
          h += `<div class="box" style="${act?'border-color:#ff9b3d':''}">
                <div class="bt"><span>${act?'▸ ':''}${SHIPS[q.cls].n}</span>
                <span class="mono" style="color:${act?'#ff9b3d':'#7d90ad'}">${Math.ceil(q.left)}g</span></div>
                <div class="bar em"><i style="width:${(1-q.left/q.tot)*100}%"></i></div></div>`;
        });
        h += `</div>`;
      }
      h += `<div class="act2">`;
      for (const k in SHIPS){
        if (SHIPS[k].crisisOnly) continue;      // FAZ 34: organik sürü gemileri gizli
        const d = SHIPS[k];
        const locked = d.tech && !e.techs[d.tech];
        const cost = shipCost(e,k);
        const afford = Object.keys(cost).every(r=>e.res[r]>=cost[r]);
        h += `<button class="abtn ${locked||!afford?'dis':''}" data-a="ship" data-x="${s.id}:${k}" title="${d.n}">${d.ab}<br>` +
             `<span style="font-size:9px">${locked?'<span style="color:#7d90ad">KİLİTLİ</span>':
               Object.entries(cost).map(([r,v])=>`<span style="color:${e.res[r]>=v?RES[r].c:'#ff5f6d'}">${RES[r].ico}${v}</span>`).join(' ')}</span></button>`;
      }
      h += `</div>`;
    } else if (s.owner === 0){
      h += `<div class="mini" style="margin-top:8px">Gemi inşası için bu sistemde Tersane gerekli.</div>`;
    }

    // --- UZAY YAPILARI ---
    if (surv){
      h += `<div class="ph">UZAY YAPILARI</div>`;
      if (s.built && Object.keys(s.built).length){
        for (const k in s.built){
          if (s.built[k] === undefined || !STRUCTS[k]) continue;
          const S = STRUCTS[k], ow = G.emps[s.built[k]];
          h += `<div class="box"><div class="bt"><span>${S.ico} ${S.n}</span>
            <span class="flag" style="background:${ow?ow.col:'#555'}"></span></div>
            <div class="bd">${S.d}</div></div>`;
        }
      }
      if (s.work && s.work.length){
        s.work.forEach(w=>{
          const S = STRUCTS[w.key];
          h += `<div class="box" style="border-color:#ff9b3d"><div class="bt"><span>${S.ico} ${S.n}</span>
            <span class="mono" style="color:#ff9b3d">${Math.ceil(w.left/30)} ay</span></div>
            <div class="bar em"><i style="width:${(1-w.left/w.tot)*100}%"></i></div></div>`;
        });
      }
      const builders = G.fleets.filter(f=>f.e===0 && fleetHasRole(f,'insaat') && f.sys===s.id);
      const avail = Object.keys(STRUCTS).filter(k=>structAllowed(e, s, k));
      if (builders.length && avail.length){
        h += `<div class="mini" style="color:#6ff2c8">🔧 İnşaat gemisi burada — yapı seçebilirsin</div>`;
        h += `<div class="act2">`;
        for (const k of avail){
          const S = STRUCTS[k], c = structCost(e, k);
          const afford = Object.keys(c).every(r=>e.res[r]>=c[r]);
          h += `<div class="bWrap" style="flex:1;min-width:80px">
            <button class="bInfo" data-a="sInfo" data-x="${k}">i</button>
            <button class="abtn ${afford?(S.mega?'pri':''):'dis'}" data-a="build2" data-x="${s.id}:${k}" style="width:100%">
            ${S.ico} ${S.n.split(' ')[0]}<br><span style="font-size:9px">` +
            Object.entries(c).map(([r,v])=>`<span style="color:${e.res[r]>=v?RES[r].c:'#ff5f6d'}">${RES[r].ico}${v}</span>`).join(' ') +
            ` · ${S.ay}ay</span></button></div>`;
        }
        h += `</div>`;
      } else if (!builders.length){
        const anyB = G.fleets.filter(f=>f.e===0 && fleetHasRole(f,'insaat'));
        h += anyB.length
          ? `<div class="act2">${anyB.slice(0,3).map(f=>`<button class="abtn pri" data-a="sendhere" data-x="${f.id}:${s.id}">${esc(f.name)} → BURAYA</button>`).join('')}</div>`
          : `<div class="mini">Uzay yapısı için İnşaat Gemisi gerekir (tersanede İNŞ).</div>`;
      }
    }

    // buradaki filolar
    const here = G.fleets.filter(f=>f.sys===s.id && View.fleetVisible(f));
    if (here.length){
      h += `<div class="ph">YÖRÜNGEDE</div>`;
      here.forEach(f=>{
        if (!f.ships.length) return;
        const fe = G.emps[f.e];
        const ost = fleetStatus(f);
        h += `<div class="pchip" data-a="${f.e===0?'selfleet':'x'}" data-x="${f.id}">
          <span class="flag" style="background:${fe.col}"></span>
          <div class="pi"><div class="pn">${esc(f.name)}</div>
          <div class="pm">${f.ships.length} gemi · ${isArmed(f)?fmt(fleetPower(f))+' güç':'sivil'}</div>
          ${f.e===0?`<div style="margin-top:3px"><span class="stt ${ost.c}">${ost.t}</span></div>`:''}</div>
          ${f.combat?'<span class="tag b">ÇATIŞMA</span>':''}</div>`;
      });
    }
    return h;
  },

  /* =============== FİLO =============== */
  p_filo(){
    const mine = G.fleets.filter(f=>f.e===0);
    let h = '';
    const f = View.sel && View.sel.e===0 ? View.sel : null;
    if (f && f.ships.length){
      const e = G.p;
      h += `<div class="ph">${esc(f.name)}</div>`;
      const st = fleetStatus(f);
      h += `<div class="row"><span>Durum</span><b><span class="stt ${st.c}">${st.t}</span></b></div>`;
      if (st.d) h += `<div class="row"><span>Hedef</span><b>${esc(st.d)}</b></div>`;
      h += `<div class="row"><span>Konum</span><b>${f.sys>=0?esc(G.sys[f.sys].name):'transit'}</b></div>`;
      const hp = fleetHealth(f);
      h += `<div class="row"><span>Gövde bütünlüğü</span><b style="color:${hp>.7?'#65e08a':hp>.35?'#ff9b3d':'#ff5f6d'}">%${Math.round(hp*100)}</b></div>`;
      h += `<div class="bar hp"><i style="width:${hp*100}%;background:${hp>.7?'#65e08a':hp>.35?'#ff9b3d':'#ff5f6d'}"></i></div>`;
      /* ═══ FAZ 23: ONARIM DURUMU VE ANAHTARI ═══
         Buton yalnızca HASARLI filolarda görünür. Durum her
         çizimde repairContext'ten okunur — anlık ve doğru. */
      /* ═══ FAZ 24: COLOSSUS ATEŞLEME ═══ */
      if (typeof isColossus === 'function' && isColossus(f)){
        const hedef = (typeof colossusTarget === 'function') ? colossusTarget(f) : null;
        const sarj = f.charge || 0;
        const tam = (typeof COLOSSUS_CHARGE !== 'undefined') ? COLOSSUS_CHARGE : 6;
        h += `<div class="gDef">
          <div class="gRow"><span class="gIco" style="color:#ff5f6d">☄</span>
            <div class="gBarW"><div class="gBar" style="width:${Math.min(100, sarj/tam*100)}%;
              background:#ff5f6d"></div></div>
            <b style="color:#ff5f6d">${sarj}/${tam}</b></div>
          <div class="mini" style="grid-column:1/-1">${
            !hedef ? 'Hedef yok — düşman gezegeninin yörüngesine gir'
            : sarj >= tam ? '<b style="color:#ff5f6d">ATEŞLEMEYE HAZIR</b> — '
              + esc(hedef.col.name || hedef.name)
            : 'Şarj oluyor · hedef ' + esc(hedef.col.name || hedef.name)
              + ' · ' + (tam - sarj) + ' ay'}</div></div>`;
        if (hedef && sarj >= tam){
          h += `<div class="act2">
            <button class="abtn dgr" data-a="colFire" data-x="${f.id}:catlat">☄ GEZEGENİ ÇATLAT
              <br><span style="font-size:9px">kalıcı yıkım · TÜM GALAKSİ DÜŞMAN OLUR</span></button>
            <button class="abtn dgr" data-a="colFire" data-x="${f.id}:notron">☢ NÖTRON SÜPÜR
              <br><span style="font-size:9px">nüfus buharlaşır · yapılar kalır</span></button></div>`;
        }
      }

      if (typeof repairContext === 'function'){
        const hull = (typeof fleetHull === 'function') ? fleetHull(f) : 1;
        const hasarli = hull < .999;
        if (hasarli){
          const rc = repairContext(f);
          const kapali = !!f.repairOff;
          const aktif = !kapali && rc.oran > 0;
          const renk = aktif ? (f.repairStarved ? '#ff9b3d' : '#65e08a')
                     : rc.tur === 'catisma' ? '#ff5f6d' : '#7d90ad';
          const durum = kapali ? 'DURDURULDU'
                      : rc.tur === 'catisma' ? 'ÇATIŞMADA — tamir yok'
                      : rc.oran <= 0 ? rc.sebep
                      : (f.repairStarved ? 'KAYNAK KISITLI' : 'TAMİR EDİLİYOR');
          h += `<div class="row"><span>🔧 Gövde onarımı</span>
            <b style="color:${renk}">${durum}</b></div>`;
          h += `<div class="mini">Gövde %${Math.round(hull*100)} · ${esc(rc.sebep)}${
            rc.oran > 0 ? ' · ayda %' + Math.round(rc.oran*100) : ''}${
            rc.tur === 'tersane' ? ' (enerji + mineral yakar)' : ''}</div>`;
          /* Anahtar yalnız tamir MÜMKÜNSE anlamlı */
          if (rc.oran > 0 || kapali){
            h += `<div class="act2"><button class="abtn ${kapali?'':'pri'}"
              data-a="repairToggle" data-x="${f.id}">${
              kapali ? '🔧 TAMİRİ BAŞLAT' : '⏸ TAMİRİ DURDUR'}</button></div>`;
          }
        }
      }

      if (typeof isTransport === 'function' && isTransport(f)){
        const gp = groundPower(f);
        h += `<div class="row"><span>⚔ Kara gücü</span>
          <b style="color:#ff9b3d">${gp}</b></div>`;
        const sy2 = f.sys >= 0 ? G.sys[f.sys] : null;
        const dost = sy2 && (sy2.owner === e.id ||
          (sy2.owner >= 0 && e.ally[sy2.owner]));
        h += `<div class="mini" style="color:${dost?'#65e08a':'#7d90ad'}">${
          dost ? '⛊ Bu yörüngede savunma desteği veriyor'
               : 'Dost yörüngede beklerse gezegen savunmasına eklenir'}</div>`;
        if (typeof fastDeployMul === 'function' && fastDeployMul(f) > 1)
          h += `<div class="mini" style="color:#ff9b3d">⚡ HIZLI İNTİKAL ×3 —
            filon hedefte koridoru açtı</div>`;
      }
      if (typeof fleetSupply === 'function'){
        const sup = fleetSupply(e, f);
        /* FAZ 54: tedarik yüzdesi ve muharebe etkisi */
        {
          const yuzde = Math.round(sup * 100);
          const renk = sup >= 1 ? '#65e08a' : sup >= .7 ? '#f2d452'
                     : sup >= .5 ? '#ff9b3d' : '#ff5f6d';
          const mesafe = (typeof supplyDistance === 'function')
            ? supplyDistance(e, f) : 0;
          h += `<div class="row"><span>📦 Tedarik</span>
            <b style="color:${renk}">%${yuzde}</b></div>`;
          if (sup < 1)
            h += `<div class="mini" style="color:${renk}">Dost sınırdan
              <b>${mesafe}</b> atlama uzakta — hasar %${yuzde}, kalkanlar
              %${Math.round(Math.max(.30, sup*.85)*100)} güçte. Yakında
              üs kurmak ya da müttefik sınırına yaklaşmak toparlar.</div>`;
        }
        const d = (typeof supplyDistance === 'function') ? supplyDistance(e, f) : 0;
        const col = sup >= 1 ? '#65e08a' : sup > .5 ? '#ff9b3d' : '#ff5f6d';
        const lbl = sup >= 1 ? 'TAM İKMAL' : sup > .5 ? 'HAT UZUYOR' : 'HAT KOPUK';
        h += `<div class="row"><span>İkmal hattı</span>
          <b style="color:${col}">${lbl} (${d} sıçrama)</b></div>`;
        if (sup < 1){
          const kayip = Math.round((1 - sup) * 9);
          h += `<div class="mini" style="color:${col}">⚠ Aylık ~%${kayip} gemi yıpranması ·
            bakım ×${(1 + (1 - sup) * 2.2).toFixed(1)}</div>`;
        }
        if (f.retreating) h += `<div class="mini" style="color:#ff9b3d">↩ İkmale çekiliyor</div>`;
      }
      h += `<div class="row"><span>Muharebe gücü</span><b style="color:#6ff2c8">${fmt(fleetPower(f))}</b></div>`;
      h += `<div class="row"><span>Hız</span><b>${fleetSpeed(f).toFixed(0)} bg/gün</b></div>`;
      const stc = STANCE[f.stance] || STANCE.agresif;
      h += `<div class="row"><span>Duruş</span><b style="color:${f.stance==='agresif'?'#ff5f6d':'#6ff2c8'}">${stc.ico} ${stc.n}</b></div>`;
      h += `<div class="mini">${stc.d}</div>`;
      if (f.combat && f.sys>=0 && G.sys[f.sys].cr)
        h += `<div class="row"><span>Mesafe</span><b style="color:#ff9b3d">${RANGE_NAMES[G.sys[f.sys].cr]||''}</b></div>`;
      if (f.path.length) h += `<div class="row"><span>Rota</span><b>${f.path.map(i=>G.sys[i].name).slice(0,3).join(' → ')}${f.path.length>3?' …':''}</b></div>`;
      h += `<div class="act2">
        ${fleetHasRole(f,'bilim') ? `<button class="abtn ${f.auto?'pri':''}" data-a="autoex" data-x="${f.id}">
          ${f.auto?'🔄 OTOMATİK AÇIK':'🔄 OTOMATİK KEŞİF'}</button>` : ''}
        <button class="abtn ${View.route?'pri':''}" data-a="route">${View.route?'HEDEFİ SEÇ':'ROTA VER'}</button>
        <button class="abtn" data-a="stop">DURDUR</button>
        <button class="abtn" data-a="stance">DURUŞ</button>
        <button class="abtn" data-a="merge">BİRLEŞTİR</button>
        <button class="abtn" data-a="split">AYIR</button></div>`;

      /* ═══ FAZ 48: LOJİSTİK ═══ */
      if (typeof reinforceFleet === 'function'){
        const hedefN = Math.min(
          typeof FLEET_SOFT_CAP !== 'undefined' ? FLEET_SOFT_CAP : 30,
          f.capTarget || (typeof FLEET_SOFT_CAP !== 'undefined' ? FLEET_SOFT_CAP : 30));
        const eksik = hedefN - f.ships.length;
        const ral = f.rallyAt !== undefined ? G.sys[f.rallyAt] : null;
        h += `<div class="ph">LOJİSTİK</div>`;
        h += `<div class="row"><span>Kadro</span>
          <b style="color:${eksik>0?'#ff9b3d':'#65e08a'}">${f.ships.length} / ${hedefN}</b></div>`;
        if (eksik > 0)
          h += `<div class="mini">Eksik <b>${eksik}</b> gemi en yakın tersanelere
            sipariş edilir ve tamamlanınca filoya katılır.</div>`;
        h += `<div class="act2">
          <button class="abtn ${eksik>0?'pri':'dis'}" data-a="reinf" data-x="${f.id}">
            ⚓ İKMALİ TAMAMLA${eksik>0?'<br><span style="font-size:9px">'+eksik+' gemi</span>':''}</button>
          <button class="abtn ${ral?'pri':''}" data-a="rallySet" data-x="${f.id}">
            📍 TOPLANMA NOKTASI${ral?'<br><span style="font-size:9px">'+esc(ral.name)+'</span>':''}</button>
          </div>`;
      }
      if (f.combat) h += `<div class="mini" style="color:#ff5f6d;margin-top:6px">⚔ ÇATIŞMA SÜRÜYOR</div>`;
      if (f.surv > 0) h += `<div class="mini" style="color:#8b7bff;margin-top:6px">TARAMA: ${Math.ceil(f.surv)} gün</div>`;

      h += `<div class="ph">GEMİLER</div>`;
      const groups = {};
      f.ships.forEach(s=>{ (groups[s.c]=groups[s.c]||[]).push(s); });
      for (const c in groups){
        const arr = groups[c], d = SHIPS[c];
        const avg = arr.reduce((a,s)=>a+s.h,0)/arr.length;
        const rgTxt = d.rng ? (RANGE_NAMES[d.rng]||'') : 'SİLAHSIZ';
        const rgCol = d.rng===3?'#8b7bff':d.rng===2?'#6ff2c8':d.rng===1?'#ff9b3d':'#7d90ad';
        const many = arr.length > 1, docked = f.sys >= 0;
        h += `<div class="box"><div class="bt"><span>${d.n} ×${arr.length}</span>
            <span style="display:flex;gap:4px;align-items:center">
              <span class="mono" style="color:#7d90ad">${d.ab}</span>
              ${docked ? `<button class="sBtn" data-a="splitOne" data-x="${c}" title="1 gemi ayır">⊟1</button>` : ''}
              ${docked && many ? `<button class="sBtn" data-a="splitAll" data-x="${c}" title="Bu türün tamamını ayır">⊟${arr.length}</button>` : ''}
            </span></div>
          <div class="bd">gövde ${Math.round(d.hull*(1+G.p.mods.hullMul))} · kalkan ${Math.round(d.sh*(1+G.p.mods.shMul))} · hasar ${Math.round(d.dmg*(1+G.p.mods.dmgMul))}</div>
          <div class="mini" style="color:${rgCol}">◎ ${rgTxt}</div>
          <div class="bar hp"><i style="width:${avg*100}%"></i></div></div>`;
      }
      if (fleetHasRole(f,'koloni') && f.sys>=0){
        const s = G.sys[f.sys];
        const opts = s.planets.filter(p=>canColonize(G.p,s,p));
        if (opts.length){
          h += `<div class="ph">YERLEŞİM</div><div class="act2">` +
            opts.map(p=>`<button class="abtn pri" data-a="colonize" data-x="${s.id}:${p.i}">${esc(p.name)} %${habOf(G.p,p)}</button>`).join('') + `</div>`;
        }
      }
      h += `<div class="ph">TÜM FİLOLAR</div>`;
      const sciAll = mine.filter(x=>fleetHasRole(x,'bilim'));
      if (sciAll.length > 1){
        const allOn = sciAll.every(x=>x.auto);
        h += `<div class="act2"><button class="abtn ${allOn?'pri':''}" data-a="autoAll">
          🔄 TÜM BİLİM GEMİLERİ ${allOn?'MANUEL':'OTOMATİK'}</button></div>`;
      }
    }
    if (!mine.length) return h + `<div class="empty">Filon yok.</div>`;
    mine.forEach(fl=>{
      if (!fl.ships.length) return;
      const sel = fl===f;
      const fst = fleetStatus(fl);
      h += `<div class="pchip" style="${sel?'border-color:#6ff2c8':''}" data-a="selfleet" data-x="${fl.id}">
        <span class="flag" style="background:${G.p.col}"></span>
        <div class="pi"><div class="pn">${esc(fl.name)}</div>
        <div class="pm">${fl.sys>=0?esc(G.sys[fl.sys].name):'transit'} · ${fl.ships.length} gemi</div>
        <div style="margin-top:3px"><span class="stt ${fst.c}">${fst.t}</span>${fl.auto?'<span class="stt wk">🔄 OTO</span>':''}</div></div>
        <span class="tag ${isArmed(fl)?'p':''}">${isArmed(fl)?fmt(fleetPower(fl)):SHIPS[fl.ships[0].c].ab}</span></div>`;
    });
    return h;
  },

  /* =============== BİLİM =============== */
  p_bilim(){
    const e = G.p;
    let h = `<div class="row"><span>Aylık araştırma</span><b style="color:#8b7bff">${fmt(e.inc.ara)}</b></div>`;
    for (const b in BRANCH){
      const B = BRANCH[b];
      h += `<div class="ph" style="color:${B.c}">${B.n}</div>`;
      const cur = e.rq[b];
      if (cur){
        const t = TECHS[cur];
        const cc = techCost(e, cur);
        const pct = clamp(e.rp[b]/cc*100,0,100);
        const per = e.inc.ara/3;
        const eta = per>0 ? Math.ceil((cc-e.rp[b])/per) : 99;
        h += `<div class="box"><div class="bt"><span>${t.n}</span><span class="mono" style="color:${B.c}">${eta} ay</span></div>
          <div class="bd">${t.d}</div><div class="bar pl"><i style="width:${pct}%;background:${B.c}"></i></div></div>`;
      }
      const av = availTechs(e,b).filter(id=>id!==cur);
      if (!av.length) h += `<div class="mini">Bu dalda araştırılacak yeni teknoloji yok.</div>`;
      av.slice(0,6).forEach(id=>{
        const t = TECHS[id];
        const cc = techCost(e, id), base = t.c;
        const diff = cc/base;
        const tagc = diff > 1.02 ? '#ff5f6d' : diff < .98 ? '#65e08a' : '#7d90ad';
        const mark = diff > 1.02 ? ' ▲' : diff < .98 ? ' ▼' : '';
        h += `<div class="box act" data-a="tech" data-x="${b}:${id}">
          <div class="bt"><span style="font-weight:600">${t.n}</span><span class="mono" style="color:${tagc}">${fmt(cc)}✦${mark}</span></div>
          <div class="bd">${t.d}${t.sway?'<br><span style="color:#8b7bff">↯ diğer araştırmaların fiyatını değiştirir</span>':''}</div></div>`;
      });
    }
    const done = Object.keys(e.techs).length;
    h += `<div class="ph">ARŞİV</div><div class="row"><span>Tamamlanan</span><b>${done} / ${Object.keys(TECHS).length}</b></div>`;
    if (e.streakB && (e.streakN||0) > 0){
      const bn = BRANCH[e.streakB] ? BRANCH[e.streakB].n : '';
      h += `<div class="row"><span>Uzmanlık serisi</span><b style="color:${(e.streakN>=3)?'#65e08a':'#d7e3f4'}">${bn} ×${e.streakN}${e.streakN>=3?' (−%10)':''}</b></div>`;
      if (e.streakN < 3) h += `<div class="mini">Aynı dalda ${3-e.streakN} araştırma daha → o dal −%10 ucuzlar.</div>`;
    }
    return h;
  },

  /* =============== DİPLOMASİ =============== */
  p_diplo(){
    // dar sekme yalnızca özet gösterir; ayrıntı geniş panelde
    const eSum = G.p;
    let sum = `<div class="row"><span>Etki</span><b style="color:#6ff2c8">${fmt(eSum.res.etk)}</b></div>`;
    sum += `<div class="row"><span>Elçi</span><b>${envoysUsed(eSum)} / ${envoyCap(eSum)}</b></div>`;
    sum += `<div class="act2"><button class="abtn pri" data-a="diploPane">🤝 DİPLOMASİ PANELİNİ AÇ</button></div>`;
    sum += `<div class="mini">Geniş panelde elçiler, lüks mal ağı ve tüm anlaşmalar bir arada.</div>`;
    return sum + this.p_diploOld();
  },
  p_diploOld(){
    const e = G.p;
    const known = G.emps.filter(o=>!o.dead && !o.wild && o.id!==0 && e.contact[o.id]);
    let h = `<div class="row"><span>Etki</span><b style="color:#6ff2c8">${fmt(e.res.etk)}</b></div>`;
    if (RACES[e.race].dip <= .02)
      h += `<div class="empty" style="border-color:#ff5f6d;color:#ff9b3d">Bu imparatorluk diplomasi yürütmez.<br>Yalnızca savaş ilan edebilir.</div>`;
    if (!known.length) return h + `<div class="empty">Henüz kimseyle temas kurulmadı.<br><br>Bilim gemilerini uzağa gönder.</div>`;
    known.forEach(o=>{
      const rel = Math.round(e.rel[o.id]);
      const war = e.war[o.id], ally = e.ally[o.id];
      const pow = totalPower(o), mine = totalPower(e);
      h += `<div class="box">
        <div class="bt"><span><span class="flag" style="background:${o.col}"></span> ${esc(o.name)}</span>
        ${war?'<span class="tag b">SAVAŞ</span>':ally?'<span class="tag p">MÜTTEFİK</span>':'<span class="tag">BARIŞ</span>'}</div>
        <div class="bd">${RACES[o.race].sifat} · ${sysCount(o)} sistem</div>
        <div class="row"><span>İlişki</span><b style="color:${rel>20?'#65e08a':rel<-20?'#ff5f6d':'#d7e3f4'}">${rel>0?'+':''}${rel}</b></div>
        <div class="bar ${rel>=0?'':'hp'}"><i style="width:${clamp((rel+100)/2,0,100)}%"></i></div>
        <div class="row"><span>Filo gücü</span><b style="color:${pow>mine?'#ff5f6d':'#65e08a'}">${fmt(pow)} <span style="color:#7d90ad">/ ${fmt(mine)}</span></b></div>
        <div class="act2">`;
      const pOK = canPeace(e,o), aOK = canAlly(e,o), wOK = canDeclareWarOn(e,o);
      const aCost = hasCivic(e,'allyCheap') ? 85 : 150;
      const pact = !!(e.pact && e.pact[o.id]);
      const myPass = !!(e.passage && e.passage[o.id]);
      const theirPass = !!(o.passage && o.passage[e.id]);
      const pv = pactValue(e, o);
      if (pact){
        const tflow = (e.tradeFlow && e.tradeFlow[o.id]) || 0;
        h += `<div class="mini" style="color:#f2d452">🤝 Ticaret anlaşması aktif — ${pv?pv.links:0} bağlantı, +%${pv?pv.enePct:0} enerji${
          tflow > 0 ? ` · takas: ${(e.lastSwap && e.lastSwap[o.id]) || ''} ${tflow.toFixed(1)} birim` : ''}</div>`;
        if (pv && pv.newLux.length)
          h += `<div class="mini" style="color:#e0a8ff">İthal edilen: ${pv.newLux.map(k=>LUXURY[k].ico+' '+LUXURY[k].n).join(', ')}</div>`;
      } else if (pv){
        const worth = pv.links > 0 || pv.newLux.length;
        h += `<div class="mini" style="color:${worth?'#65e08a':'#7d90ad'}">Anlaşma getirisi: ${
          pv.links} rota (+%${pv.enePct} enerji)${pv.newLux.length?' · '+pv.newLux.length+' yeni lüks mal':''}${
          !worth?' — liman kurmadan getiri yok':''}</div>`;
      }
      if (war){
        h += `<button class="abtn ${pOK?'pri':'dis'}" data-a="peace" data-x="${o.id}">BARIŞ İSTE<br><span style="font-size:9px;color:#7d90ad">${pOK?'50◈':'KİLİTLİ'}</span></button>`;
        /* ═══ FAZ 48: STATÜKO BARIŞI ═══
           İki taraf da yorulduysa sınırlar fiili durumda donar. */
        if (typeof canStatusQuo === 'function'){
          const sq = canStatusQuo(e, o);
          h += `<button class="abtn ${sq.ok?'pri':'dis'}" data-a="statuko" data-x="${o.id}">
            ⚖ STATÜKO BARIŞI<br><span style="font-size:9px;color:#7d90ad">${
              sq.ok ? 'işgal ettiğin yerler senin kalır' : 'henüz erken'}</span></button>`;
          if (!sq.ok && sq.why)
            h += `<div class="mini" style="color:#7d90ad">${esc(sq.why)}</div>`;
        }
      }
      else {
        h += `<button class="abtn dgr ${wOK?'':'dis'}" data-a="war" data-x="${o.id}">SAVAŞ İLAN ET${wOK?'':'<br><span style="font-size:9px">SÜRGÜN — DOKUNULMAZ</span>'}</button>`;
        if (!ally) h += `<button class="abtn ${aOK?'':'dis'}" data-a="ally" data-x="${o.id}">İTTİFAK<br><span style="font-size:9px;color:#7d90ad">${aOK?aCost+'◈':'KİLİTLİ'}</span></button>`;
        h += pact
          ? `<button class="abtn dgr" data-a="unpact" data-x="${o.id}">ANLAŞMAYI BOZ</button>`
          : `<button class="abtn" data-a="pact" data-x="${o.id}">TİCARET ANLAŞMASI<br><span style="font-size:9px;color:#7d90ad">70◈</span></button>`;
        h += `<button class="abtn" data-a="gift" data-x="${o.id}">🎁 HEDİYE<br><span style="font-size:9px;color:#7d90ad">seç</span></button>`;
      }
      h += `</div></div>`;
    });
    return h;
  },

  /* =============== GENİŞ DİPLOMASİ PANELİ =============== */
  openDiplo(){
    const e = G.p;
    const known = G.emps.filter(o=>!o.dead && !o.wild && o.id!==0 && e.contact[o.id]);
    const cap = envoyCap(e), used = envoysUsed(e);

    let h = `<div class="dpBox">
      <div class="dpHd"><span>DİPLOMASİ</span>
        <button class="riX" data-a="closeDiplo">✕</button></div>
      <div class="dpBody">`;

    h += `<div class="envRow"><span>🎓 ELÇİLER</span>
      <span><b>${cap - used}</b> boşta / ${cap} toplam</span></div>`;
    const scap = spyCap(e), sused = spiesUsed(e);
    /* FAZ 5: oyuncu entrikası */
    if (typeof whisperSuccessChance === 'function'){
      const sans = Math.round(whisperSuccessChance(e) * 100);
      const bedel = (typeof WHISPER_COST !== 'undefined') ? WHISPER_COST : 45;
      h += `<div class="envRow"><span>🕸 FISILTI AĞI</span>
        <span>başarı <b>%${sans}</b> · ${bedel} ◈</span></div>`;
      h += `<div class="mini" style="margin-bottom:8px">İki imparatorluğun arasını gizlice boz.
        Başarı diplomasi ve bilim seviyene bağlıdır. <b style="color:#ff9b3d">Risk:</b>
        operasyon yıllar sonra çözülürse iki mağdur da sana devasa kin duyar ve
        "İstihbarat Sabotajı" savaş nedeni kazanır.</div>`;
      const acikDosya = (e.hitLog || []).filter(w => !w.known).length;
      const toplamHit = (e.hitLog || []).length;
      h += `<div class="act2" style="margin-bottom:10px">
        <button class="abtn ${e.res.etk >= bedel ? 'pri' : 'dis'}" data-a="whisperMenu">
        🕸 FISILTI OPERASYONU BAŞLAT</button>
        <button class="abtn" data-a="opLogMenu">🕵 İSTİHBARAT DOSYASI${
          toplamHit ? '<br><span style="font-size:9px;color:' +
          (acikDosya ? '#ff9b3d' : '#7d90ad') + '">' + toplamHit + ' kayıt' +
          (acikDosya ? ' · ' + acikDosya + ' açık' : '') + '</span>' : ''}</button></div>`;
    }
    h += `<div class="envRow"><span>🕵 CASUSLAR</span>
      <span><b>${scap - sused}</b> boşta / ${scap} toplam</span></div>`;
    h += `<div class="mini" style="margin-bottom:10px">Elçi atadığın imparatorlukla ilişki her ay
      kendiliğinden artar. Savaşta elçiler çalışmaz.</div>`;

    // federasyon durumu
    const myFed = findFed(e);
    if (myFed){
      h += `<div class="ph">🏛 ${esc(myFed.name)}</div>`;
      h += `<div class="mini">Üyeler: ${myFed.members.map(m=>esc(G.emps[m].name)).join(' · ')}</div>`;
      const laws = Object.keys(myFed.laws).filter(k=>myFed.laws[k]);
      h += laws.length
        ? `<div class="luxRow">` + laws.map(k=>`<span class="luxChip have">${FED_LAWS[k].ico} ${FED_LAWS[k].n}</span>`).join('') + `</div>`
        : `<div class="mini">Henüz yasa kabul edilmedi.</div>`;
      if (myFed.laws.filo) h += `<div class="row"><span>Ortak filo hazinesi</span><b>${Math.round(myFed.treasury)} ▰</b></div>`;
      h += `<div class="mini">Sonraki oylama: ${Math.max(0, Math.ceil((myFed.nextVote - G.day)/30))} ay sonra</div>`;
      h += `<div class="mini" style="margin-top:6px;color:#7d90ad">Federasyon kendiliğinden işler:
        her 6 ayda bir yasa oylaması bildirim olarak gelir, oy verirsin. Kabul edilen yasalar
        kalıcı etki yaratır. Üyelerle ittifakın bozulursa federasyondan düşersin.</div>`;
      if (myFed.vote) h += `<div class="mini" style="color:#ff9b3d">⚑ Şu an açık bir oylama var — bildirimlere bak!</div>`;
    } else {
      h += `<div class="mini" style="margin-bottom:10px">3 imparatorlukla karşılıklı ittifak kurarsan bir federasyon doğar.</div>`;
    }

    // lüks mal panosu
    h += `<div class="ph">LÜKS MAL AĞIN</div><div class="luxRow">`;
    for (const k of LUX_KEYS){
      const L = LUXURY[k];
      const own = e.luxOwn && e.luxOwn[k];
      const imp = e.luxImport && e.luxImport[k] !== undefined;
      const cls = own ? 'have' : imp ? 'imp' : 'miss';
      const from = imp ? ' ← ' + (G.emps[e.luxImport[k]] ? G.emps[e.luxImport[k]].name.split(' ')[0] : '') : '';
      h += `<span class="luxChip ${cls}" title="${esc(L.d)}">
        <span style="color:${L.c}">${L.ico}</span>${L.n}${from}</span>`;
    }
    h += `</div><div class="mini" style="margin-top:5px">
      Yeşil = kendi kolonin · Turuncu = ticaretle ithal · Soluk = elinde yok.
      Aynı maldan birden fazlası bonusu artırmaz.</div>`;

    if (!known.length){
      h += `<div class="empty" style="margin-top:14px">Henüz kimseyle temas kurulmadı.</div>`;
    } else {
      /* ═══ FAZ 46: LİSTE / KART GÖRÜNÜM TOGGLE ═══ */
      const liste = this.diploList;
      h += `<div class="ph" style="display:flex;justify-content:space-between;
        align-items:center">İMPARATORLUKLAR
        <button class="viewTog" data-a="diploView">${
          liste ? '⊞ KART' : '☰ LİSTE'}</button></div>`;

      if (liste){
        /* Kompakt tek satır: renk şeridi, ad, ilişki, durum rozetleri */
        h += `<div class="dpList">`;
        known.forEach(o=>{
          const rel = Math.round(e.rel[o.id]);
          const war = e.war[o.id], ally = e.ally[o.id];
          const env = !!(e.envoy && e.envoy[o.id]);
          const vas = typeof isVassal === 'function' && isVassal(o) && o.overlord === e.id;
          const rc = rel >= 40 ? '#65e08a' : rel >= 0 ? '#f2d452'
                   : rel >= -40 ? '#ff9b3d' : '#ff5f6d';
          const acik = this.diploOpen === o.id;
          h += `<div class="dpRow ${war?'war':ally?'ally':''} ${acik?'open':''}"
            data-a="diploPick" data-x="${o.id}">
            <span class="dpDot" style="background:${o.col}"></span>
            <span class="dpNm">${esc(o.name)}</span>
            <span class="dpTags">${war?'⚔':''}${ally?'🤝':''}${env?'🎓':''}${vas?'⛓':''}</span>
            <b style="color:${rc}">${rel > 0 ? '+' : ''}${rel}</b>
          </div>`;

          /* ═══ FAZ 50: AKORDEON GÖVDESİ ═══
             Satırın hemen altına açılır; liste yerinde kalır. */
          if (acik){
            const pOK2 = canPeace(e,o), wOK2 = canDeclareWarOn(e,o);
            const lvl2 = (typeof intelOf === 'function') ? intelOf(e, o.id) : 0;
            h += `<div class="dpAcc">
              <div class="mini">${esc((typeof personaOf==='function'
                ? personaOf(o).n : ''))} · istihbarat ${'●'.repeat(lvl2)}${'○'.repeat(Math.max(0,3-lvl2))}
                ${vas ? ' · <b style="color:#65e08a">vasalın</b>' : ''}</div>
              <div class="act2">
                <button class="abtn" data-a="deal" data-x="${o.id}">📜 MÜZAKERE</button>
                <button class="abtn" data-a="spyOpen" data-x="${o.id}">🕵 CASUSLUK</button>
              </div>
              <div class="act2">
                ${war
                  ? `<button class="abtn ${pOK2?'pri':'dis'}" data-a="peace" data-x="${o.id}">
                      🕊 BARIŞ${pOK2?'':'<br><span style="font-size:9px">KİLİTLİ</span>'}</button>`
                  : `<button class="abtn ${wOK2.ok?'dgr':'dis'}" data-a="war" data-x="${o.id}">
                      ⚔ SAVAŞ${wOK2.ok?'':'<br><span style="font-size:9px">KİLİTLİ</span>'}</button>`}
                <button class="abtn" data-a="gift" data-x="${o.id}">🎁 HEDİYE</button>
              </div></div>`;
          }
        });
        h += `</div><div class="mini">Bir devlete dokun — satır açılır, liste yerinde kalır.</div>`;
      } else {
      h += `<div class="dpGrid">`;
      known.forEach(o=>{
        const rel = Math.round(e.rel[o.id]);
        const war = e.war[o.id], ally = e.ally[o.id], pact = !!(e.pact && e.pact[o.id]);
        const env = !!(e.envoy && e.envoy[o.id]);
        const foe = sharedFoe(e, o);
        const pOK = canPeace(e,o), aOK = canAlly(e,o), wOK = canDeclareWarOn(e,o);
        let aCost = hasCivic(e,'allyCheap') ? 55 : 90;
        if (foe) aCost = Math.round(aCost*.5);
        h += `<div class="dpCard ${war?'war':ally?'ally':''}" id="dpc${o.id}">
          <div class="dpTop">
            <canvas class="dpPort" data-lk="${o.look||'humanoid'}" data-col="${o.col}"
              data-pers="${typeof personaKey==='function'?personaKey(o):'yayilmaci'}"
              data-mood="${Math.round((G.p.rel && G.p.rel[o.id])||0)}" width="42" height="58"></canvas>
            <div class="dpName"><b style="color:${o.col}">${esc(o.name)}</b>
              <i>${RACES[o.race].sifat} · ${sysCount(o)} sistem</i></div>
            ${war?'<span class="tag b">SAVAŞ</span>':ally?'<span class="tag p">MÜTTEFİK</span>':pact?'<span class="tag e">TİCARET</span>':'<span class="tag">BARIŞ</span>'}
          </div>
          <div class="row"><span>İlişki</span><b style="color:${rel>20?'#65e08a':rel<-20?'#ff5f6d':'#d7e3f4'}">${rel>0?'+':''}${rel}</b></div>
          <div class="bar ${rel>=0?'':'hp'}"><i style="width:${clamp((rel+100)/2,0,100)}%"></i></div>
          <div class="row"><span>İstihbarat</span><b style="color:${['#7d90ad','#d7e3f4','#6ff2c8','#65e08a'][intelOf(e,o.id)]}">${INTEL_LEVELS[intelOf(e,o.id)].n}</b></div>
          <div class="row"><span>Filo gücü</span><b>${powerLabel(e, o)}</b></div>`;
        if (war){
          const myEx = exhOf(e, o.id), theirEx = exhOf(o, e.id);
          h += `<div class="row"><span>Savaş yorgunluğu</span><b style="color:${myEx>70?'#ff5f6d':myEx>40?'#ff9b3d':'#65e08a'}">sen ${Math.round(myEx)} · o ${Math.round(theirEx)}</b></div>`;
          h += `<div class="bar ${myEx>60?'hp':''}"><i style="width:${myEx}%;background:${myEx>70?'#ff5f6d':'#ff9b3d'}"></i></div>`;
          const wg = e.wg && e.wg[o.id];
          if (wg && WAR_GOALS[wg.t]){
            const pr = warGoalProgress(e, o.id);
            h += `<div class="row"><span>Hedef: ${WAR_GOALS[wg.t].ico} ${WAR_GOALS[wg.t].n}</span>
              <b style="color:${pr>=1?'#65e08a':'#6ff2c8'}">%${Math.round(pr*100)}</b></div>`;
            h += `<div class="mini">${esc(warGoalText(e, o.id))}${pr>=1?' — HEDEF TAMAM, barış masasında güçlüsün':''}</div>`;
          }
          if (theirEx > 65) h += `<div class="mini" style="color:#65e08a">Düşman yoruldu — barış teklifin kabul görebilir</div>`;
        }
        if (intelOf(e,o.id) >= 2 && typeof personaOf === 'function'){
          const P = personaOf(o);
          h += `<div class="row"><span>Mizaç</span>
            <b style="color:${P.col}">${P.ico} ${P.n}</b></div>`;
          h += `<div class="mini">${P.d}</div>`;
        }
        if (intelOf(e,o.id) >= 2){
          const tc = Object.keys(o.techs||{}).length;
          h += `<div class="mini">Teknoloji: ${tc} · Civic: ${(o.civics||[]).map(c=>CIVICS[c]?CIVICS[c].n:'').filter(Boolean).join(', ')||'—'}</div>`;
        }
        if (intelOf(e,o.id) >= 3){
          const foes = G.emps.filter(x=>!x.dead && o.war[x.id]).map(x=>x.name);
          h += `<div class="mini" style="color:#ff9b3d">Savaştığı taraflar: ${foes.join(', ')||'—'} · Kaynak: ${RES.min.ico}${fmt(o.res.min)} ${RES.ala.ico}${fmt(o.res.ala)}</div>`;
        }
        // lüks mal karşılaştırması
        const theirs = ownLuxury(o);
        const wanted = LUX_KEYS.filter(k => theirs[k] && !(e.luxOwn && e.luxOwn[k]));
        if (wanted.length) h += `<div class="mini" style="color:#f2d452">Onda olup sende olmayan: ${
          wanted.map(k=>LUXURY[k].ico + ' ' + LUXURY[k].n).join(', ')}</div>`;
        const passIn  = !!(o.passage && o.passage[e.id]);   // onun bölgesine girebilir miyim
        const passOut = !!(e.passage && e.passage[o.id]);   // benim bölgeme girebilir mi
        h += `<div class="mini" style="color:${passIn?'#65e08a':'#7d90ad'}">🚪 Sınır geçişi:
        ${passIn?'onun bölgesine girebilirsin':'onun bölgesine <b>giremezsin</b>'} ·
        ${passOut?'senin bölgene girebilir':'senin bölgene giremez'}</div>`;
        /* FAZ 3: ekonomik savaş durumu */
        if (typeof embargoOn === 'function'){
          const ambBana = embargoOn(o, 0), ambOna = embargoOn(e, o.id);
          if (ambBana || ambOna)
            h += `<div class="mini" style="color:#ff5f6d">⛔ Ticaret kesik:
              ${ambBana ? 'sana ambargo uyguluyor' : ''}${ambBana && ambOna ? ' · ' : ''}${
              ambOna ? 'sen ona ambargo uyguluyorsun' : ''}</div>`;
          if (typeof isPariah === 'function' && isPariah(o))
            h += `<div class="mini" style="color:#ff5f6d">⛔ GALAKTİK PARYA — konsey onu dışladı</div>`;
        }
        /* FAZ 8: vasallık ilişkisi */
        if (typeof isVassal === 'function'){
          if (isVassal(o) && o.overlord === 0)
            h += `<div class="mini" style="color:#65e08a">👑 SENİN VASALIN —
              ${VASSAL_TYPES[vassalType(o)].ico} ${VASSAL_TYPES[vassalType(o)].n}
              · öfke ${Math.round(o.vassalAnger||0)}/100${
              vassalType(o)==='haracguzar' ? ' · vergi '+Math.round(o.vassalPaid||0)+'/ay' : ''}</div>`;
          else if (isVassal(o))
            h += `<div class="mini" style="color:#8b7bff">⛓ ${esc(G.emps[o.overlord].name)} vasalı
              (${VASSAL_TYPES[vassalType(o)].n})</div>`;
          if (isVassal(e) && e.overlord === o.id)
            h += `<div class="mini" style="color:#ff5f6d">⛓ SENYÖRÜN — öfken ${Math.round(e.vassalAnger||0)}/100</div>`;
          const vs = vassalsOf(o);
          if (vs.length) h += `<div class="mini" style="color:#8b7bff">👑 ${vs.length} vasalı var
            (konseyde ekstra ${hegemonyWeight(o).toFixed(1)} ağırlık)</div>`;
        }
        /* FAZ 6: harika inşası — kıskançlık ve önleyici savaş uyarısı */
        if (typeof megaBuilds === 'function'){
          const mb = megaBuilds(o);
          if (mb.length){
            const w0 = mb[0];
            const yuzde = Math.round((1 - w0.left / Math.max(1, w0.tot)) * 100);
            h += `<div class="mini" style="color:#ff5f6d">⚠ HARİKA İNŞA EDİYOR:
              ${w0.S.ico} ${w0.S.n} — %${yuzde} tamam</div>`;
          }
          const sahipM = (typeof megaOwned === 'function') ? megaOwned(o) : 0;
          if (sahipM) h += `<div class="mini" style="color:#8b7bff">✦ ${sahipM} harika tamamlamış</div>`;
        }
      /* FAZ 14: buradaki üçüncü vasallık bloğu KALDIRILDI — aynı
         bilgi yukarıda iki kez daha basılıyordu (Faz 8'de kopyalanmış). */
        /* FAZ 15/16: Galaktik Tehdit ve parya adaylığı */
        if (typeof threatLabel === 'function'){
          const tl = threatLabel(o.threat || 0);
          if (tl) h += `<div class="mini" style="color:#ff5f6d">⚠ ${tl}
            (${Math.round(o.threat)}) — gerekçesiz savaş açtı</div>`;
          if (typeof PARIAH_THREAT !== 'undefined' && (o.threat || 0) >= PARIAH_THREAT)
            h += `<div class="mini" style="color:#ff5f6d">⛔ PARYA ADAYI — konsey gündemine girebilir</div>`;
          if (o.threatFrozen !== undefined)
            h += `<div class="mini" style="color:#8b7bff">⏸ Suçları kriz boyunca askıda
              (${Math.round(o.threatFrozen)})</div>`;
        }
        /* Savaş yorgunluğu — iki taraf da görünsün */
        if (war && typeof exhOf === 'function'){
          const be = Math.round(exhOf(e, o.id)), oe2 = Math.round(exhOf(o, e.id));
          h += `<div class="mini">⏳ Yorgunluk — sen <b style="color:${
            be>70?'#ff5f6d':be>40?'#ff9b3d':'#7d90ad'}">%${be}</b> ·
            o <b style="color:${oe2>70?'#65e08a':'#7d90ad'}">%${oe2}</b>
            ${be>=85||oe2>=85?' · barış yakın':''}</div>`;
        }
      if (foe) h += `<div class="mini" style="color:#6ff2c8">⚔ Ortak düşmanınız var — ittifak yarı fiyat ve iki kat kolay</div>`;
        if (o.proxyWar){
          const forMe = Object.keys(o.proxyWar).filter(k => o.proxyWar[k] === 0 && o.war[k]);
          if (forMe.length) h += `<div class="mini" style="color:#ff9b3d">⚠ Senin için ${
            forMe.map(k=>esc(G.emps[k].name)).join(', ')} ile savaşta — barıştırma maddesiyle kurtarabilirsin</div>`;
        }
        /* ═══ FAZ 14: EYLEM SEKMELERİ ═══
           Tek uzun liste yerine üç sekme. Varsayılan sekme ilişkinin
           durumuna göre seçilir: savaştaysan BASKI, değilsen ANLAŞMA. */
        const dtab = (this.dTab && this.dTab[o.id]) || (war ? 'baski' : 'anlasma');
        h += `<div class="dTabs">` +
          [['anlasma','📜','ANLAŞMA'],['istihbarat','🕵','İSTİHBARAT'],['baski','⚔','BASKI']]
            .map(([k,i2,nm]) => `<button class="dTab ${dtab===k?'on':''}"
              data-a="dTab" data-x="${o.id}:${k}">${i2} ${nm}</button>`).join('') +
          `</div><div class="act2">`;

        if (dtab === 'anlasma'){
          h += `<button class="abtn pri" data-a="deal" data-x="${o.id}">📜 MÜZAKERE MASASI</button>
            <button class="abtn ${env?'pri':''}" data-a="envoy" data-x="${o.id}">${env?'🎓 ELÇİ ORADA':'🎓 ELÇİ GÖNDER'}</button>`;
        }
        else if (dtab === 'istihbarat'){
          h += `<button class="abtn ${(e.spy&&e.spy[o.id])?'pri':''}" data-a="spy" data-x="${o.id}">${(e.spy&&e.spy[o.id])?'🕵 CASUS ORADA':'🕵 CASUS YOLLA'}</button>
            <button class="abtn ${intelOf(e,o.id)>=1?'':'dis'}" data-a="ops" data-x="${o.id}">🎯 OPERASYONLAR</button>
            <button class="abtn" data-a="whisperMenu">🕸 FISILTI AĞI</button>
            <button class="abtn" data-a="opLogMenu">📁 İSTİHBARAT DOSYASI</button>`;
        }
        else {
          if (typeof embargoOn === 'function')
            h += embargoOn(e, o.id)
              ? `<button class="abtn pri" data-a="unembargo" data-x="${o.id}">⛔ AMBARGOYU KALDIR</button>`
              : `<button class="abtn dgr" data-a="embargo" data-x="${o.id}">⛔ AMBARGO UYGULA</button>`;
        }
        if (dtab !== 'baski' && dtab !== 'anlasma'){ /* istihbarat sekmesi: savaş tuşları yok */ }
        else if (war) h += `<button class="abtn ${pOK?'pri':'dis'}" data-a="peace" data-x="${o.id}">BARIŞ<br><span style="font-size:9px;color:#7d90ad">${pOK?'30◈':'KİLİTLİ'}</span></button>`;
        else {
          if (!ally) h += `<button class="abtn ${aOK?'':'dis'}" data-a="ally" data-x="${o.id}">İTTİFAK<br><span style="font-size:9px;color:#7d90ad">${aOK?aCost+'◈':'KİLİTLİ'}</span></button>`;
          h += pact
            ? `<button class="abtn dgr" data-a="unpact" data-x="${o.id}">TİCARETİ BOZ</button>`
            : `<button class="abtn" data-a="pact" data-x="${o.id}">TİCARET<br><span style="font-size:9px;color:#7d90ad">40◈</span></button>`;
          h += `<button class="abtn" data-a="gift" data-x="${o.id}">🎁 HEDİYE<br><span style="font-size:9px;color:#7d90ad">seç</span></button>`;
          h += `<button class="abtn dgr ${wOK?'':'dis'}" data-a="war" data-x="${o.id}">SAVAŞ</button>`;
        }
        h += `</div></div>`;
      });
      h += `</div>`;
      }                                   // FAZ 46: liste/kart else kapanışı
    }
    h += `</div></div>`;
    /* ═══ FAZ 46: SCROLL HAFIZASI ═══
       Casusluk/anlaşma/baskı tıklandığında panel yeniden çizilir
       ve liste başa sarıyordu. Yeniden çizimden ÖNCE scrollTop
       okunup sonra geri yazılır. */
    const pane = $('diploPane');
    const body0 = pane.querySelector ? pane.querySelector('.dpBody') : null;
    const eskiScroll = this._diploScroll !== undefined
      ? this._diploScroll : (body0 ? body0.scrollTop : 0);
    pane.innerHTML = h;
    pane.classList.add('show');
    const body1 = pane.querySelector ? pane.querySelector('.dpBody') : null;
    if (body1 && eskiScroll){
      body1.scrollTop = eskiScroll;
      /* Tarayıcı yerleşimi tamamlayınca bir kez daha uygula */
      setTimeout(()=>{ if (body1) body1.scrollTop = eskiScroll; }, 0);
    }
    /* FAZ 47: odaklanacak kart varsa oraya kaydır */
    if (this._diploFocus !== undefined && body1){
      const kart = document.getElementById('dpc' + this._diploFocus);
      if (kart && kart.offsetTop !== undefined){
        const hedef = Math.max(0, kart.offsetTop - 12);
        body1.scrollTop = hedef;
        setTimeout(()=>{ if (body1) body1.scrollTop = hedef; }, 0);
        this._diploScroll = hedef;
      }
      this._diploFocus = undefined;
    }
    if (body1 && !body1._scrollBound){
      body1._scrollBound = true;          // listener yığılmasın
      body1.addEventListener('scroll', ()=>{ this._diploScroll = body1.scrollTop; });
    }
    setTimeout(()=>{
      [...document.querySelectorAll('canvas.dpPort')].forEach(cv=>{
        const g = cv.getContext('2d');
        g.imageSmoothingEnabled = false;
        const spr = ART.portraitFull({
          look: cv.dataset.lk, col: cv.dataset.col,
          persona: cv.dataset.pers, mood: +(cv.dataset.mood || 0), scale: 3
        });
        const sc = Math.min(cv.width/spr.width, cv.height/spr.height) * .9;
        g.drawImage(spr, (cv.width-spr.width*sc)/2, (cv.height-spr.height*sc)/2, spr.width*sc, spr.height*sc);
      });
    }, 0);
  },

  /* =============== FEDERASYON PANELİ =============== */
  openFed(){
    const e = G.p;
    const f = findFed(e);
    let h = `<div class="dpBox" style="width:min(640px,94%)">
      <div class="dpHd"><span>🏛 FEDERASYON</span>
        <button class="riX" data-a="closeFed">✕</button></div>
      <div class="dpBody">`;

    if (!f){
      const allies = G.emps.filter(o=>!o.dead && !o.wild && o.id!==0 && e.ally[o.id]);
      h += `<div class="envRow"><span>DURUM</span><b style="color:#ff9b3d">FEDERASYON YOK</b></div>`;
      const chk = canFoundFed(e);
      h += `<div class="mini">Federasyon iki yolla doğar: müttefiklerin <b>birbirleriyle de</b>
        ittifaklıysa kendiliğinden kurulur — ya da <b>sen kurarsın</b> ve üyeleri birbirine
        bağlarsın. İkinci yol etkiye mal olur ama beklemek gerekmez.</div>`;
      h += `<div class="box" style="${chk.ok?'border-color:#6ff2c8':''}">
        <div class="bt"><span>🏛 FEDERASYON KUR</span>
          <span class="mono" style="color:${(e.res.etk>=fedFoundCost(e))?'#6ff2c8':'#ff5f6d'}">${fedFoundCost(e)} ◈</span></div>
        <div class="bd">Müttefiklerini tek bir birlik altında topla. Üyeler anında birbirine
          müttefik olur ve ilk oylama 2 ay içinde başlar.</div>
        ${chk.ok ? '' : `<div class="mini" style="color:#ff9b3d">${esc(chk.why)}</div>`}
        <div class="act2"><button class="abtn ${chk.ok?'pri':'dis'}" data-a="foundFed">
          ${chk.ok ? 'ŞİMDİ KUR' : 'KOŞULLAR EKSİK'}</button></div></div>`;
      h += `<div class="ph">MEVCUT İTTİFAKLARIN — ${allies.length} / 3</div>`;
      h += `<div class="bar"><i style="width:${clamp(allies.length/3*100,0,100)}%"></i></div>`;
      h += allies.length
        ? allies.map(o=>`<div class="pchip"><span class="flag" style="background:${o.col}"></span>
            <div class="pi"><div class="pn">${esc(o.name)}</div>
            <div class="pm">${sysCount(o)} sistem · ilişki ${Math.round(e.rel[o.id])}</div></div></div>`).join('')
        : `<div class="empty">Henüz müttefikin yok.</div>`;
      const cands = G.emps.filter(o=>!o.dead && !o.wild && o.id!==0 && !e.ally[o.id] &&
                                     e.contact[o.id] && !e.war[o.id] && canAlly(e,o));
      if (cands.length){
        h += `<div class="ph">İTTİFAK ADAYLARI</div>`;
        cands.forEach(o=>{
          const cost = hasCivic(e,'allyCheap') ? 55 : 90;
          const foe = sharedFoe(e, o);
          h += `<div class="dpCard"><div class="dpTop">
            <div class="dpName"><b style="color:${o.col}">${esc(o.name)}</b>
              <i>ilişki ${Math.round(e.rel[o.id])}${foe?' · ortak düşman':''}</i></div></div>
            <div class="act2">
              <button class="abtn pri" data-a="ally" data-x="${o.id}">⚑ İTTİFAK · ${foe?Math.round(cost*.5):cost}◈</button>
              <button class="abtn" data-a="envoy" data-x="${o.id}">🎓 ELÇİ</button>
            </div></div>`;
        });
      }
    } else {
      h += `<div class="envRow"><span>${esc(f.name)}</span>
        <b style="color:#6ff2c8">${f.members.length} üye</b></div>`;

      /* ═══ FAZ 50: FEDERAL FON PANELİ ═══ */
      if (typeof fedFundStatus === 'function'){
        const fs2 = fedFundStatus(f);
        if (fs2){
          const renk = fs2.kritik ? '#ff5f6d' : fs2.kalanAy < 8 ? '#ff9b3d' : '#65e08a';
          h += `<div class="ph">FEDERAL FON</div>`;
          h += `<div class="box" style="border-color:${renk}">
            <div class="bt"><span>⚙ Rezerv</span>
              <b style="color:${renk}">${Math.round(fs2.ala)} ala · ${Math.round(fs2.ene)} ene</b></div>
            <div class="bd">Aylık bakım <b>${Math.round(fs2.bakim)}</b> enerji ·
              ${fs2.bakim > 0
                ? `<b style="color:${renk}">${fs2.kalanAy} ay</b> yeter`
                : 'federal donanma yok'}
              ${fs2.kritik
                ? '<br><b style="color:#ff5f6d">⚠ FON TÜKENİYOR — gemiler dağıtılacak!</b>'
                : ''}</div></div>`;
          if (f.leader === 0 && typeof canGrantFed === 'function'){
            const gk = canGrantFed(e);
            h += `<div class="act2"><button class="abtn ${gk.ok?(fs2.kritik?'dgr':'pri'):'dis'}"
              data-a="fedGrant">🏛 ACİL HİBE
              <br><span style="font-size:9px">500 ala · 1000 ene</span></button></div>`;
            if (!gk.ok) h += `<div class="mini" style="color:#7d90ad">${esc(gk.why)}</div>`;
          }
        }
      }

      h += `<div class="ph">ÜYELER</div>`;
      f.members.forEach(m=>{
        const o = G.emps[m];
        if (!o) return;
        h += `<div class="pchip"><span class="flag" style="background:${o.col}"></span>
          <div class="pi"><div class="pn">${esc(o.name)}${m===0?' (sen)':''}</div>
          <div class="pm">${sysCount(o)} sistem · filo ${fmt(totalPower(o))}</div></div></div>`;
      });

      h += `<div class="ph">YASALAR</div>`;
      h += `<div class="mini">Federasyona sonradan katılan üyeler de yürürlükteki
        tüm yasalara tabi olur — geçmiş oylamaları yeniden yapmaya gerek yoktur.</div>`;
      for (const k in FED_LAWS){
        const L = FED_LAWS[k], on = !!f.laws[k];
        h += `<div class="box" style="${on?'border-color:#6ff2c8':''}">
          <div class="bt"><span>${L.ico} ${L.n}</span>
            <span class="tag ${on?'p':''}">${on?'YÜRÜRLÜKTE':'oylanmadı'}</span></div>
          <div class="bd">${L.d}</div></div>`;
      }

      if (f.laws.filo)
        h += `<div class="row"><span>Ortak filo hazinesi</span><b>${Math.round(f.treasury)} ▰</b></div>`;

      h += `<div class="ph">OYLAMA</div>`;
      if (f.vote){
        const L = FED_LAWS[f.vote.law];
        h += `<div class="box" style="border-color:#ff9b3d">
          <div class="bt"><span>${L.ico} ${L.n}</span><span class="tag e">AÇIK</span></div>
          <div class="bd">${L.d}</div>
          <div class="row"><span>Oylar</span><b><span style="color:#65e08a">${f.vote.yes.length} evet</span>
            · <span style="color:#ff5f6d">${f.vote.no.length} hayır</span></b></div>
          <div class="act2"><button class="abtn pri" data-a="fedVoteNow" data-x="${f.id}">OY KULLAN</button></div></div>`;
      } else {
        const ay = Math.max(0, Math.ceil((f.nextVote - G.day)/30));
        h += `<div class="row"><span>Sonraki oylama</span><b>${ay} ay sonra</b></div>`;
        h += `<div class="mini">Oylama açıldığında bildirim gelir; buradan da oy kullanabilirsin.</div>`;
      }
      if (hasCivic(e,'council'))
        h += `<div class="mini" style="color:#6ff2c8">✧ Konsey Mimarı: oyun iki kat ağırlıkta sayılıyor</div>`;
    }
    h += `</div></div>`;
    $('diploPane').innerHTML = h;
    $('diploPane').classList.add('show');
  },

  /* ═══════════════════════════════════════════════════════════════
     FAZ 29 — İSTİHBARAT SEKMESİ
     Aktif ajan operasyonları, sabotaj bekleme süreleri ve
     istihbarat geçmişi tek ekranda. Mobil için grid tabanlı,
     taşmayan yerleşim.
     ═══════════════════════════════════════════════════════════════ */
  p_intel(){
    const e = G.p;
    const simdi = G.memAge || 0;
    let h = '';

    /* ═══ FAZ 51: ODAKLI HEDEF ═══
       Diplomasi akordeonundan gelindiyse o devletin istihbarat
       özeti en üstte açılır — arama yapmaya gerek kalmaz. */
    if (this.spyTarget !== undefined && this.spyTarget !== null){
      const o = G.emps[this.spyTarget];
      if (o && !o.dead && !o.wild && e.contact[o.id]){
        const lvl = (typeof intelOf === 'function') ? intelOf(e, o.id) : 0;
        const ci  = (typeof counterIntel === 'function') ? counterIntel(o) : 0;
        const ch  = (typeof sabotageChance === 'function') ? sabotageChance(e, o) : null;
        h += `<div class="ph" style="display:flex;justify-content:space-between;
          align-items:center">🎯 ODAK: ${esc(o.name.slice(0,20))}
          <button class="viewTog" data-a="spyClear">✕ BIRAK</button></div>`;
        h += `<div class="box" style="border-color:${o.col}">
          <div class="bt"><span style="color:${o.col}">${esc(o.name)}</span>
            <span class="tag ${lvl>=2?'p':'b'}">AĞ ${'●'.repeat(lvl)}${'○'.repeat(Math.max(0,3-lvl))}</span></div>
          <div class="bd">ilişki <b>${Math.round(e.rel[o.id]||0)}</b> ·
            karşı istihbarat <b style="color:${ci>1?'#ff5f6d':'#7d90ad'}">${ci.toFixed(1)}</b>
            ${ch ? `<br>operasyon başarı <b style="color:#65e08a">%${Math.round(ch.basari*100)}</b>
              · ifşa <b style="color:#ff5f6d">%${Math.round(ch.ifsa*100)}</b>` : ''}
          </div></div>`;
        if (lvl < 2)
          h += `<div class="mini" style="color:#ff9b3d">Çoğu operasyon 2. seviye ağ
            gerektirir — önce istihbarat ağını genişlet.</div>`;

        /* ═══════════════════════════════════════════════════════
           FAZ 56 — GİZLİ DİPLOMATİK GEÇMİŞ
           Seviye 2: hedefin son 15 büyük olayı (kime karşı ne
           hissettiği, ne yaşadığı).
           Seviye 3: diğer devletlerle NET ilişki puanları —
           kimin dostu, kimin düşmanı, sayısal olarak.
           ═══════════════════════════════════════════════════════ */
        if (lvl >= 2 && o.mem){
          const olaylar = [];
          for (const kid in o.mem){
            const kars = G.emps[kid];
            if (!kars || kars.wild) continue;
            for (const m of o.mem[kid]){
              const MK = (typeof MEM_KINDS !== 'undefined') ? MEM_KINDS[m.k] : null;
              olaylar.push({
                ad: MK ? MK.n : m.k,
                kim: kars.name, col: kars.col,
                v: m.v || 0, t: m.t || 0
              });
            }
          }
          /* En yeni ve en ağır 15 olay */
          olaylar.sort((a, b) => (b.t - a.t) || (Math.abs(b.v) - Math.abs(a.v)));
          const son = olaylar.slice(0, 15);
          if (son.length){
            h += `<div class="ph">📜 GİZLİ DİPLOMATİK GEÇMİŞ</div>`;
            h += `<div class="dpList">`;
            son.forEach(x => {
              const iyi = x.v > 0;
              const yas = Math.max(0, Math.round(((G.memAge || 0) - x.t) / 12));
              h += `<div class="dpRow">
                <span class="dpDot" style="background:${x.col}"></span>
                <span class="dpNm">${esc(x.ad)} — ${esc(x.kim.slice(0,16))}</span>
                <span class="dpTags" style="font-size:10px;color:#7d90ad">${
                  yas ? yas + 'y' : 'yeni'}</span>
                <b style="color:${iyi?'#65e08a':'#ff5f6d'}">${iyi?'+':''}${Math.round(x.v)}</b>
              </div>`;
            });
            h += `</div>`;
          } else {
            h += `<div class="mini" style="color:#7d90ad">Kayda değer bir
              diplomatik geçmiş bulunamadı.</div>`;
          }
        }

        if (lvl >= 3){
          const iliski = [];
          for (const x of G.emps){
            if (x.dead || x.wild || x.crisisSide || x.id === o.id) continue;
            if (o.rel[x.id] === undefined) continue;
            iliski.push({n:x.name, col:x.col, v:Math.round(o.rel[x.id]),
                         savas: !!o.war[x.id],
                         ally: !!(o.ally && o.ally[x.id])});
          }
          iliski.sort((a,b) => b.v - a.v);
          if (iliski.length){
            h += `<div class="ph">🔓 NET İLİŞKİ TABLOSU <span class="tag p">SEVİYE 3</span></div>`;
            h += `<div class="dpList">`;
            iliski.forEach(x => {
              const rc = x.v >= 40 ? '#65e08a' : x.v >= 0 ? '#f2d452'
                       : x.v >= -40 ? '#ff9b3d' : '#ff5f6d';
              h += `<div class="dpRow">
                <span class="dpDot" style="background:${x.col}"></span>
                <span class="dpNm">${esc(x.n)}</span>
                <span class="dpTags">${x.savas?'⚔':''}${x.ally?'🤝':''}</span>
                <b style="color:${rc}">${x.v>0?'+':''}${x.v}</b>
              </div>`;
            });
            h += `</div><div class="mini">Bu tablo yalnız 3. seviye ağla görünür —
              hedefin kiminle ne kadar yakın olduğunu bilmek, kimi ona karşı
              kışkırtabileceğini de söyler.</div>`;
          }
        }

        /* ═══ FAZ 56: GİZLİ DİPLOMATİK GEÇMİŞ ═══
           2. seviyede hedefin son 15 büyük olayı, 3. seviyede
           ayrıca diğer devletlerle NET ilişki puanları. Casusluk
           ağının asıl ödülü bu: rakibin kimden nefret ettiğini
           bilmek, kime yaklaşacağını bilmektir. */
        if (lvl >= 2 && typeof MEM_KINDS !== 'undefined'){
          const olaylar = [];
          for (const hid in (o.mem || {})){
            const kim = G.emps[hid];
            if (!kim) continue;
            for (const m of o.mem[hid]){
              const K = MEM_KINDS[m.k];
              if (!K) continue;
              olaylar.push({t:m.t, v:m.v, ad:K.n || m.k, kim, ico:K.ico || '•'});
            }
          }
          olaylar.sort((a,b) => b.t - a.t);
          h += `<div class="ph">📜 GİZLİ DİPLOMATİK GEÇMİŞ</div>`;
          if (!olaylar.length){
            h += `<div class="mini">Kayda değer bir olay bulunamadı — bu devlet
              galaksinin sessiz köşesinde yaşıyor.</div>`;
          } else {
            const simdiA = G.memAge || 0;
            h += `<div class="dpList">`;
            olaylar.slice(0, 15).forEach(m => {
              const yil = Math.max(0, Math.round((simdiA - m.t) / 12));
              const renk = m.v > 0 ? '#65e08a' : m.v < 0 ? '#ff5f6d' : '#7d90ad';
              h += `<div class="dpRow">
                <span class="dpDot" style="background:${m.kim.col}"></span>
                <span class="dpNm">${m.ico} ${esc(m.ad)} — ${esc(m.kim.name.slice(0,16))}</span>
                <span class="dpTags" style="color:#7d90ad;font-size:9px">${
                  yil ? yil + ' yıl önce' : 'bu yıl'}</span>
                <b style="color:${renk}">${m.v > 0 ? '+' : ''}${Math.round(m.v)}</b>
              </div>`;
            });
            h += `</div>`;
            if (olaylar.length > 15)
              h += `<div class="mini">…ve ${olaylar.length - 15} olay daha.</div>`;
          }

          if (lvl >= 3){
            h += `<div class="ph">🔓 NET İLİŞKİ TABLOSU</div>`;
            const iliski = [];
            for (const x of G.emps){
              if (x.dead || x.wild || x.crisisSide || x.id === o.id) continue;
              if (o.rel[x.id] === undefined) continue;
              iliski.push({x, v: o.rel[x.id]});
            }
            iliski.sort((a,b) => b.v - a.v);
            if (!iliski.length){
              h += `<div class="mini">Bu devletin kayıtlı ilişkisi yok.</div>`;
            } else {
              h += `<div class="dpList">`;
              iliski.forEach(r => {
                const rc = r.v >= 40 ? '#65e08a' : r.v >= 0 ? '#f2d452'
                         : r.v >= -40 ? '#ff9b3d' : '#ff5f6d';
                const etiket = o.war[r.x.id] ? '⚔'
                  : (o.ally && o.ally[r.x.id]) ? '🤝' : '';
                h += `<div class="dpRow">
                  <span class="dpDot" style="background:${r.x.col}"></span>
                  <span class="dpNm">${esc(r.x.name)}${r.x.id === 0 ? ' (SEN)' : ''}</span>
                  <span class="dpTags">${etiket}</span>
                  <b style="color:${rc}">${r.v > 0 ? '+' : ''}${Math.round(r.v)}</b>
                </div>`;
              });
              h += `</div>`;
              h += `<div class="mini">En yakını <b>${esc(iliski[0].x.name.slice(0,18))}</b>,
                en uzağı <b>${esc(iliski[iliski.length-1].x.name.slice(0,18))}</b>.</div>`;
            }
          } else {
            h += `<div class="mini" style="color:#7d90ad">🔒 Net ilişki puanları
              3. seviye ağ gerektirir.</div>`;
          }
        }
      } else this.spyTarget = null;
    }

    /* ═══ FAZ 32: SENATO KAMPANYASI ═══
       Kampanya penceresi açıkken en üstte durur — süre kısıtlı,
       oyuncu kaçırmasın. */
    const kmp = (typeof G.council !== 'undefined' && G.council) ? G.council.campaign : null;
    if (kmp && typeof RESOLUTIONS !== 'undefined' && RESOLUTIONS[kmp.key]){
      const R = RESOLUTIONS[kmp.key];
      const uyeyim = (typeof inCouncil === 'function') && inCouncil(e);
      h += `<div class="ph">🏛 SENATO KAMPANYASI</div>`;
      h += `<div class="box" style="border-color:#8b7bff">
        <div class="bt"><span>${R.ico} ${esc(R.n)}</span>
          <span class="tag p">${kmp.left} AY</span></div>
        <div class="bd">${esc(R.d)}</div></div>`;

      if (!uyeyim){
        h += `<div class="mini">Konsey üyesi değilsin — oylamaya
          müdahale edemezsin.</div>`;
      } else {
        /* Mevcut eğilim: kim ne düşünüyor? */
        const uyeler = G.council.members
          .map(m => G.emps[m])
          .filter(o => o && !o.dead && !o.wild && o.id !== 0);
        h += `<div class="mini">Oyları rüşvet ya da şantajla çevirebilirsin.
          Rüşvet güvenli ama pahalı; şantaj çok etkili, ifşa olursa yıkıcı.</div>`;
        uyeler.forEach(o => {
          const rusvet = kmp.bribed[o.id];
          const santaj = kmp.blackmailed.some(b =>
            (b.id !== undefined ? b.id : b) === o.id);
          const lvl = (typeof intelOf === 'function') ? intelOf(e, o.id) : 0;
          const w = (typeof voteWeight === 'function') ? voteWeight(o) : 1;
          let durum = '';
          if (santaj) durum = '<span class="tag p">ŞANTAJ ALTINDA</span>';
          else if (rusvet) durum = '<span class="tag">RÜŞVET ALDI</span>';
          h += `<div class="box">
            <div class="bt"><span style="color:${o.col}">${esc(o.name)}</span>${durum}</div>
            <div class="bd">oy ağırlığı <b>${w.toFixed(1)}</b> ·
              istihbarat <b style="color:${lvl>=2?'#6ff2c8':'#7d90ad'}">${
                '●'.repeat(lvl)+'○'.repeat(Math.max(0,3-lvl))}</b></div>`;
          if (!rusvet && !santaj){
            const paraVar = (e.res.min || 0) >= 200;
            const casusVar = lvl >= 2 && (e.res.etk || 0) >= 60;
            /* Yön seçimi: oyuncu yasayı geçirmek de engellemek de
               isteyebilir. data-x formatı "id:yon". */
            h += `<div class="mini" style="margin:3px 0 1px">EVET yönünde:</div>
              <div class="act2">
              <button class="abtn ${paraVar?'':'dis'}" data-a="bribe" data-x="${o.id}:yes">
                💰 RÜŞVET<br><span style="font-size:9px">200 mineral</span></button>
              <button class="abtn ${casusVar?'dgr':'dis'}" data-a="blackmail" data-x="${o.id}:yes">
                🕵 ŞANTAJ<br><span style="font-size:9px">60 ◈ · seviye 2</span></button></div>
              <div class="mini" style="margin:3px 0 1px">HAYIR yönünde:</div>
              <div class="act2">
              <button class="abtn ${paraVar?'':'dis'}" data-a="bribe" data-x="${o.id}:no">
                💰 RÜŞVET<br><span style="font-size:9px">200 mineral</span></button>
              <button class="abtn ${casusVar?'dgr':'dis'}" data-a="blackmail" data-x="${o.id}:no">
                🕵 ŞANTAJ<br><span style="font-size:9px">60 ◈ · seviye 2</span></button></div>`;
          }
          h += `</div>`;
        });
      }
    }

    /* ── ÖZET ── */
    const sab = G.sabStats || {basari:0, ifsa:0, sessiz:0, cift:0};
    h += `<div class="ph">AJAN FAALİYETİ</div>`;
    h += `<div class="gDef">
      <div class="gRow"><span class="gIco" style="color:#6ff2c8">✓</span>
        <div class="gBarW"><div class="gBar" style="width:${
          Math.min(100, sab.basari * 12)}%;background:#6ff2c8"></div></div>
        <b style="color:#6ff2c8">${sab.basari}</b></div>
      <div class="gRow"><span class="gIco" style="color:#ff5f6d">☠</span>
        <div class="gBarW"><div class="gBar" style="width:${
          Math.min(100, sab.ifsa * 12)}%;background:#ff5f6d"></div></div>
        <b style="color:#ff5f6d">${sab.ifsa}</b></div>
      <div class="mini" style="grid-column:1/-1;margin:2px 0 0">
        ${sab.basari} başarılı sabotaj · ${sab.ifsa} ifşa · ${sab.sessiz} sonuçsuz</div>
    </div>`;

    /* ── AKTİF OPERASYONLAR (kuşatma altındaki hedefler) ── */
    const aktif = [];
    for (const sy of G.sys){
      for (const pl of sy.planets){
        const col = pl.col;
        if (!col || pl.owner < 0 || pl.owner === 0) continue;
        if (!e.war[pl.owner]) continue;
        /* Yörüngemde filom var mı? */
        let bizVarız = false;
        for (const f of G.fleets)
          if (f.e === 0 && f.sys === sy.id && f.ships.length){ bizVarız = true; break; }
        if (!bizVarız) continue;
        aktif.push({sy, pl, col});
      }
    }
    h += `<div class="ph">AKTİF CEPHELER (${aktif.length})</div>`;
    if (!aktif.length){
      h += `<div class="mini">Düşman yörüngesinde filon yok. Sabotaj ancak
        kuşatma sırasında yapılabilir.</div>`;
    } else {
      aktif.slice(0, 8).forEach(a => {
        const o = G.emps[a.pl.owner];
        const bekleme = (a.col.sabCd && a.col.sabCd > simdi)
          ? Math.ceil(a.col.sabCd - simdi) : 0;
        const kalkan = Math.round(a.col.shield || 0);
        const durum = kalkan <= 5 ? '<span class="tag p">KALKAN İNİK</span>'
                    : bekleme ? `<span class="tag">BEKLEME ${bekleme} ay</span>`
                    : '<span class="tag e">SABOTAJA AÇIK</span>';
        h += `<div class="box" style="border-color:${kalkan<=5?'#65e08a':'#3a4560'}">
          <div class="bt"><span>${esc(a.col.name || a.pl.name)}</span>${durum}</div>
          <div class="bd"><span style="color:${o?o.col:'#7d90ad'}">${esc(o?o.name:'?')}</span>
            · kalkan <b style="color:${kalkan>0?'#8b7bff':'#65e08a'}">${kalkan}</b>
            · garnizon <b style="color:#ff9b3d">${Math.round(a.col.garrison||0)}</b>
            ${a.col.sabotaged !== undefined ? '<br><span style="color:#6ff2c8">✓ sabote edildi</span>' : ''}
            ${a.col.truce !== undefined ? '<br><span style="color:#ff9b3d">⏸ ateşkes — ordu bekleniyor</span>' : ''}
            ${a.pl.martial_law > 0 ? '<br><span style="color:#ff5f6d">⚖ sıkıyönetim ' + a.pl.martial_law + ' ay</span>' : ''}
          </div></div>`;
      });
      if (aktif.length > 8)
        h += `<div class="mini">…ve ${aktif.length - 8} cephe daha</div>`;
    }

    /* ── İSTİHBARAT SEVİYELERİ ── */
    h += `<div class="ph">İSTİHBARAT AĞI</div>`;
    const tanidik = G.emps.filter(o => !o.dead && !o.wild && o.id !== 0 && e.contact[o.id]);
    if (!tanidik.length){
      h += `<div class="mini">Henüz kimseyle temas kurulmadı.</div>`;
    } else {
      tanidik.forEach(o => {
        const lvl = (typeof intelOf === 'function') ? intelOf(e, o.id) : 0;
        const casus = !!(e.spy && e.spy[o.id]);
        const dots = '●'.repeat(lvl) + '○'.repeat(Math.max(0, 3 - lvl));
        h += `<div class="row"><span style="color:${o.col}">${esc(o.name)}</span>
          <b style="color:${lvl>=2?'#6ff2c8':lvl>=1?'#ff9b3d':'#7d90ad'}">${dots}${
            casus ? ' <span style="color:#8b7bff">🕵</span>' : ''}</b></div>`;
      });
      h += `<div class="mini">Casus yollamak istihbarat seviyesini yükseltir;
        seviye sabotaj başarısını doğrudan artırır.</div>`;

      /* ═══ FAZ 30: TEKNOLOJİ HIRSIZLIĞI ═══ */
      const hedefler = tanidik.filter(o => {
        const lvl = (typeof intelOf === 'function') ? intelOf(e, o.id) : 0;
        if (lvl < 2) return false;
        for (const id in (o.techs || {}))
          if (!(e.techs && e.techs[id]) && TECHS[id]) return true;
        return false;
      });
      h += `<div class="ph">TEKNOLOJİ HIRSIZLIĞI</div>`;
      if (!hedefler.length){
        h += `<div class="mini">2. seviye istihbarat ve bizde olmayan
          teknolojisi olan bir hedef gerekir.</div>`;
      } else {
        h += `<div class="mini">Maliyetin %50'si araştırma puanı olarak gelir.
          İfşa olursa ajan infaz edilir ve hedef savaş nedeni kazanır. (90 ◈)</div>`;
        hedefler.forEach(o => {
          let n2 = 0;
          for (const id in (o.techs || {}))
            if (!(e.techs && e.techs[id]) && TECHS[id]) n2++;
          const yeter = (e.res.etk || 0) >= 90;
          h += `<div class="act2"><button class="abtn ${yeter?'dgr':'dis'}"
            data-a="stealTech" data-x="${o.id}">📡 ${esc(o.name)}
            <br><span style="font-size:9px">${n2} bilinmeyen teknoloji</span></button></div>`;
        });
      }
    }

    /* ═══ FAZ 35: ULTİMATOM ═══
       Kriz sırasında pakta direnen devletleri zorla. */
    if (typeof canUltimatum === 'function' && typeof crisisActive === 'function' &&
        crisisActive()){
      h += `<div class="ph">⚠ ULTİMATOM</div>`;
      const c2 = G.council;
      const direnenler = G.emps.filter(o => !o.dead && !o.wild && !o.crisisSide &&
        o.id !== 0 && e.contact[o.id] && canUltimatum(e, o).ok);
      if (!direnenler.length){
        h += `<div class="mini">Ultimatom verilebilecek devlet yok — herkes
          pakta bağlı ya da zaten savaştasın.</div>`;
      } else {
        h += `<div class="mini">"Ya Sürü'ye karşı pakta katılırsın ya da seni
          biz yok ederiz." Reddedilirse savaş nedeni doğar ve galaksi
          seni kınar. (${typeof ULTIMATUM_COST !== 'undefined' ? ULTIMATUM_COST : 110} ◈)</div>`;
        direnenler.forEach(o => {
          const yakin = (typeof crisisProximity === 'function') ? crisisProximity(o) : 0;
          const etiket = yakin >= 2 ? '<span class="tag p">GEZEGENİ YUTULDU</span>'
                       : yakin >= 1 ? '<span class="tag">SÜRÜ SINIRINDA</span>'
                       : '<span class="tag b">UZAKTA — İNATÇI</span>';
          const guc = totalPower(e) / Math.max(1, totalPower(o));
          h += `<div class="box">
            <div class="bt"><span style="color:${o.col}">${esc(o.name)}</span>${etiket}</div>
            <div class="bd">güç oranımız <b style="color:${guc>1.3?'#65e08a':'#ff9b3d'}">
              ×${guc.toFixed(1)}</b>${o._paktSoz !== undefined ?
              ' · <span style="color:#65e08a">söz verdi</span>' : ''}</div>
            <div class="act2"><button class="abtn dgr" data-a="ultimatum" data-x="${o.id}">
              ⚠ ULTİMATOM GÖNDER</button></div></div>`;
        });
      }
    }

    /* ═══ FAZ 50: GÖZLEM İSTASYONLARI AĞI ═══ */
    if (typeof panopticonRange === 'function' && e.panoptLock &&
        Object.keys(e.panoptLock).length){
      h += `<div class="ph">🛰 GÖZLEM İSTASYONLARI</div>`;
      for (const kaynak in e.panoptLock){
        const kilit = e.panoptLock[kaynak];
        if (!kilit) continue;
        const ksy = G.sys[kaynak], hsy = G.sys[kilit.target];
        if (!ksy) continue;
        const kor = (kilit.blindUntil || 0) > (G.memAge || 0);
        const kalanKor = kor ? kilit.blindUntil - (G.memAge || 0) : 0;
        const hp = kilit.hp !== undefined ? kilit.hp : 100;
        const durum = kor ? {t:`${kalanKor} AY KÖRLEŞTİ`, c:'#5a2d8f'}
                    : hp < 100 ? {t:`HASARLI %${hp}`, c:'#ff9b3d'}
                    : {t:'CANLI İZLEME', c:'#6ff2c8'};
        const menzil = hsy ? panopticonRange(kilit.target).length : 0;
        h += `<div class="box" style="border-color:${durum.c}">
          <div class="bt"><span>🛰 ${esc(ksy.name)}</span>
            <span class="tag ${kor?'e':'p'}">${durum.t}</span></div>
          <div class="bd">hedef <b style="color:${durum.c}">${
            hsy ? esc(hsy.name) : 'yok'}</b> · menzil <b>${menzil}</b> sistem
            ${hp < 100 ? `<br>bütünlük %${hp}` : ''}</div>
          <div class="act2">
            <button class="abtn" data-a="panoptRetarget" data-x="${kaynak}">
              🎯 HEDEFİ DEĞİŞTİR</button></div></div>`;
      }
      h += `<div class="mini">Hedefi değiştirmek için butona bas, sonra haritadan
        bir sistem seç. Menzil o sistemin 2 hiperyol çevresidir.</div>`;
    }

    /* ═══ FAZ 44: HİMAYE TEKLİFİ ═══ */
    if (typeof canOfferPatronage === 'function'){
      const kuklalar = G.emps.filter(o => !o.dead && !o.wild && !o.crisisSide &&
        o.founder === e.id && o.id !== e.id);
      if (kuklalar.length){
        h += `<div class="ph">🤝 HİMAYE</div>`;
        h += `<div class="mini">Senin desteğinle doğan devletlere vasallık
          teklif edebilirsin. Minnet bağı kabul şansını yükseltir.</div>`;
        kuklalar.forEach(o => {
          const chk = canOfferPatronage(e, o);
          const sans = (typeof patronageChance === 'function')
            ? Math.round(patronageChance(e, o) * 100) : 0;
          const vasalMi = typeof isVassal === 'function' && isVassal(o);
          h += `<div class="box">
            <div class="bt"><span style="color:${o.col}">${esc(o.name.slice(0,26))}</span>
              ${vasalMi ? '<span class="tag p">VASALIN</span>'
                        : `<span class="tag b">%${sans} KABUL</span>`}</div>
            <div class="bd">ilişki <b style="color:#65e08a">${
              Math.round(o.rel[e.id] || 0)}</b>${
              vasalMi ? '' : ' · minnet bağı ile doğdu'}</div>`;
          if (!vasalMi){
            if (chk.ok)
              h += `<div class="act2"><button class="abtn pri" data-a="patronage"
                data-x="${o.id}">🤝 HİMAYE TEKLİF ET<br>
                <span style="font-size:9px">${typeof PATRONAGE_COST !== 'undefined'
                  ? PATRONAGE_COST : 150} ◈</span></button></div>`;
            else h += `<div class="mini" style="color:#7d90ad">${esc(chk.why)}</div>`;
          }
          h += `</div>`;
        });
      }
    }

    /* ═══ FAZ 59: AGRESİF SABOTAJLAR ═══ */
    if (typeof canSabotage === 'function'){
      [['yard','⚓ TERSANEYİ SABOTE ET',
        'Hedef sistemde gemi üretimi 12 ay durur, tezgâhtaki siparişler iptal olur.',
        typeof SABO_YARD_COST !== 'undefined' ? SABO_YARD_COST : 110],
       ['supply','📦 LOJİSTİK AĞI HACKLE',
        'Hedef sistemin ikmal hattı 6 ay çöker; oradaki filolar %40 güçte kalır.',
        typeof SABO_SUPPLY_COST !== 'undefined' ? SABO_SUPPLY_COST : 130]
      ].forEach(([tur, baslik, aciklama, bedel]) => {
        h += `<div class="ph">${baslik}</div>`;
        h += `<div class="mini">${aciklama} (${bedel} ◈)</div>`;
        const uygun = tanidik.filter(o => canSabotage(e, o, tur).ok);
        if (!uygun.length){
          const ilk = tanidik.length ? canSabotage(e, tanidik[0], tur) : null;
          h += `<div class="mini" style="color:#7d90ad">${
            ilk && ilk.why ? esc(ilk.why) : 'Uygun hedef yok'}</div>`;
          return;
        }
        uygun.forEach(o => {
          const hd = canSabotage(e, o, tur).hedefler;
          const secili = this.saboPick && this.saboPick.tur === tur &&
                         this.saboPick.emp === o.id;
          h += `<div class="box">
            <div class="bt"><span style="color:${o.col}">${esc(o.name.slice(0,24))}</span>
              <span class="tag b">${hd.length} hedef</span></div>`;
          if (!secili){
            h += `<div class="act2"><button class="abtn dgr"
              data-a="saboPick" data-x="${tur}:${o.id}">HEDEF SEÇ</button></div>`;
          } else {
            h += `<div class="mini">Vurulacak sistemi seç:</div><div class="act2">`;
            hd.slice(0, 8).forEach(x => {
              h += `<button class="abtn dgr" data-a="saboGo"
                data-x="${tur}:${o.id}:${x.sy.id}">${esc(x.sy.name.slice(0,14))}
                <br><span style="font-size:9px">${esc(x.bilgi)}</span></button>`;
            });
            h += `</div><div class="act2"><button class="abtn"
              data-a="saboCancel">✕ VAZGEÇ</button></div>`;
          }
          h += `</div>`;
        });
      });
    }

    /* ═══ FAZ 42: İSYANI KIŞKIRT ═══ */
    if (typeof canIncite === 'function'){
      h += `<div class="ph">🔥 İSYANI KIŞKIRT</div>`;
      const adaylar = tanidik.filter(o => canIncite(e, o).ok);
      if (!adaylar.length){
        h += `<div class="mini">2. seviye istihbaratı olan ve kışkırtılabilecek
          sınır dünyası bulunan bir hedef gerekir.</div>`;
      } else {
        h += `<div class="mini">Hedefin en zayıf sınır dünyasında huzursuzluk
          körükle: istikrar −${typeof INCITE_STAB !== 'undefined' ? INCITE_STAB : 25},
          ayrılıkçı sayaç +${typeof INCITE_HEADSTART !== 'undefined' ? INCITE_HEADSTART : 10} ay.
          İfşa olursan konsey seni kınar ve savaş nedeni doğar.
          (${typeof INCITE_COST !== 'undefined' ? INCITE_COST : 100} ◈)</div>`;
        adaylar.forEach(o => {
          const chk = canIncite(e, o);
          const hd = chk.hedef;
          const stab = hd ? Math.round(hd.pl.col.stab) : 0;
          const sc = hd ? (hd.pl.col.secede || 0) : 0;
          const renk = stab < 40 ? '#65e08a' : stab < 60 ? '#ff9b3d' : '#7d90ad';
          h += `<div class="box">
            <div class="bt"><span style="color:${o.col}">${esc(o.name)}</span>
              <span class="tag ${stab<40?'p':'b'}">${stab<40?'ZEMİN HAZIR':'DİRENÇLİ'}</span></div>
            <div class="bd">hedef: <b>${esc(hd ? (hd.pl.col.name || hd.pl.name) : '—')}</b>
              · istikrar <b style="color:${renk}">${stab}</b>${
                sc ? ' · sayaç <b style="color:#ff9b3d">' + sc + '</b>' : ''}</div>
            <div class="act2"><button class="abtn dgr" data-a="incite" data-x="${o.id}">
              🔥 İSYANI KIŞKIRT</button></div></div>`;
        });
      }
    }

    /* ═══ FAZ 34: DERİN SORUŞTURMA ═══
       "Bana neden savaş açıldı? Perde arkasında kim var?" */
    if (typeof deepInvestigateInfo === 'function'){
      const di = deepInvestigateInfo(e);
      h += `<div class="ph">🔎 DERİN SORUŞTURMA</div>`;
      if (!di.varMi){
        h += `<div class="mini">Şüpheli dosyan yok. Sana komplo kurulduğunda
          burada belirir.</div>`;
      } else {
        h += `<div class="box" style="border-color:${di.iftirali?'#ff5f6d':'#ff9b3d'}">
          <div class="bt"><span>Açık dosyalar</span>
            <b style="color:#ff9b3d">${di.iftirali + di.acik}</b></div>
          <div class="bd">
            ${di.iftirali ? `<span style="color:#ff5f6d">${di.iftirali} dosyada
              iftira şüphesi</span> — biri seni kandırıyor olabilir.<br>` : ''}
            ${di.acik ? `${di.acik} faili meçhul operasyon.<br>` : ''}
            ${di.supheliSavas ? `<span style="color:#ff5f6d">${di.supheliSavas}
              devlet sana şüpheli bir gerekçeyle savaş açtı.</span>` : ''}
          </div></div>`;
        const yeter = (e.res.etk || 0) >= di.maliyet;
        h += `<div class="act2"><button class="abtn ${yeter?'pri':'dis'}"
          data-a="deepInv">🔎 SORUŞTURMA BAŞLAT
          <br><span style="font-size:9px">${di.maliyet} ◈ · kuklacıyı bul</span></button></div>`;
      }
    }

    /* ═══ FAZ 42: İSYANI KIŞKIRT ═══ */
    if (typeof canIncite === 'function'){
      h += `<div class="ph">🔥 İSYANI KIŞKIRT</div>`;
      const adaylar = tanidik.filter(o => canIncite(e, o).ok);
      if (!adaylar.length){
        h += `<div class="mini">2. seviye istihbaratı olan ve kırılgan bir sınır
          dünyası bulunan hedef yok. Sıkıyönetim altındaki gezegenler
          kışkırtılamaz.</div>`;
      } else {
        h += `<div class="mini">Hedefin en zayıf sınır dünyasında halkı ayaklandır:
          istikrar −${typeof INCITE_STAB_HIT !== 'undefined' ? INCITE_STAB_HIT : 25}
          (${typeof INCITE_MONTHS !== 'undefined' ? INCITE_MONTHS : 12} ay) ve
          ayrılıkçı sayaç +${typeof INCITE_SEED !== 'undefined' ? INCITE_SEED : 10} ay.
          İfşa olursa savaş nedeni doğar ve konseyde itibarın düşer.
          (${typeof INCITE_COST !== 'undefined' ? INCITE_COST : 120} ◈)</div>`;
        adaylar.forEach(o => {
          const hd = incitablePlanet(e, o);
          if (!hd) return;
          const col = hd.pl.col;
          const sc = col.secede || 0;
          h += `<div class="box">
            <div class="bt"><span style="color:${o.col}">${esc(o.name)}</span>
              <span class="tag ${col.stab < 40 ? 'e' : 'b'}">${
                esc((col.name || hd.pl.name).slice(0, 16))}</span></div>
            <div class="bd">istikrar <b style="color:${
              col.stab < 40 ? '#ff9b3d' : '#7d90ad'}">${Math.round(col.stab)}</b>${
              sc ? ` · ayrılıkçı sayaç <b style="color:#ff5f6d">${sc}</b>` : ''}</div>
            <div class="act2"><button class="abtn dgr" data-a="incite" data-x="${o.id}">
              🔥 İSYANI KIŞKIRT</button></div></div>`;
        });
      }
    }

    /* ═══ FAZ 33: SAHTE BAYRAK OPERASYONU ═══ */
    if (typeof canFalseFlag === 'function'){
      h += `<div class="ph">🎭 SAHTE BAYRAK</div>`;
      const ffHedef = this.ffTarget !== undefined ? G.emps[this.ffTarget] : null;
      const ffPatsy = this.ffPatsy !== undefined ? G.emps[this.ffPatsy] : null;
      h += `<div class="mini">Hedefe saldırırken suçu üçüncü bir devlete yık.
        Başarırsan ikisi birbirine düşer. <b style="color:#ff5f6d">Suçüstü
        yakalanırsan Galaktik Parya olursun</b> — konseyden atılır, sınırların
        kapanır, sınır kalkanların yarıya düşer. (${
          typeof falseFlagCost === 'function' ? falseFlagCost().etk : 140} ◈)</div>`;

      const uygunlar = tanidik.filter(o => {
        const lv = (typeof intelOf === 'function') ? intelOf(e, o.id) : 0;
        return lv >= 2;
      });
      if (!uygunlar.length){
        h += `<div class="mini">2. seviye istihbaratı olan bir hedef gerekir.</div>`;
      } else {
        h += `<div class="mini" style="margin-top:4px">HEDEF (saldırılacak):</div>
          <div class="act2">`;
        uygunlar.forEach(o => {
          h += `<button class="abtn ${this.ffTarget===o.id?'pri':''}"
            data-a="ffTarget" data-x="${o.id}">${esc(o.name.slice(0,14))}</button>`;
        });
        h += `</div>`;
        if (ffHedef){
          h += `<div class="mini" style="margin-top:4px">GÜNAH KEÇİSİ (suç yıkılacak):</div>
            <div class="act2">`;
          tanidik.filter(o => o.id !== ffHedef.id).forEach(o => {
            const husumet = -(ffHedef.rel[o.id] || 0);
            const renk = husumet > 40 ? '#65e08a' : husumet > 0 ? '#ff9b3d' : '#7d90ad';
            h += `<button class="abtn ${this.ffPatsy===o.id?'pri':''}"
              data-a="ffPatsy" data-x="${o.id}">${esc(o.name.slice(0,12))}
              <br><span style="font-size:9px;color:${renk}">husumet ${Math.round(husumet)}</span></button>`;
          });
          h += `</div>`;
          h += `<div class="mini">Hedef, günah keçisinden ne kadar nefret ediyorsa
            iftira o kadar inandırıcı olur.</div>`;
        }
        if (ffHedef && ffPatsy){
          const chk = canFalseFlag(e, ffHedef, ffPatsy);
          if (!chk.ok) h += `<div class="mini" style="color:#ff5f6d">${esc(chk.why)}</div>`;
          else h += `<div class="act2">
            <button class="abtn dgr" data-a="ffGo" data-x="tekno">📡 TEKNOLOJİ ÇAL
              <br><span style="font-size:9px">suç ${esc(ffPatsy.name.slice(0,10))}'e</span></button>
            <button class="abtn dgr" data-a="ffGo" data-x="sabotaj">🏛 SENATO SABOTAJI
              <br><span style="font-size:9px">suç ${esc(ffPatsy.name.slice(0,10))}'e</span></button></div>`;
        }
      }
    }

    /* ── DOSYA GEÇMİŞİ ── */
    const gelen = (e.hitLog || []).length;
    if (gelen){
      const acik = (e.hitLog || []).filter(w => !w.known).length;
      h += `<div class="ph">DOSYALAR</div>`;
      h += `<div class="row"><span>Sana yapılan operasyon</span><b>${gelen}</b></div>`;
      h += `<div class="row"><span>Faili bilinmeyen</span>
        <b style="color:${acik?'#ff9b3d':'#7d90ad'}">${acik}</b></div>`;
      h += `<div class="act2"><button class="abtn" data-a="opLogMenu">
        📁 İSTİHBARAT DOSYASINI AÇ</button></div>`;
    }
    return h;
  },

  /* ═══════════════════════════════════════════════════════════════
     FAZ 18 — AKILLI DANIŞMAN
     Yeni oyuncuyu üç cümleyle yönlendirir. Ekranı kilitlemez:
     Faz 12'nin küçültülebilir modal altyapısını kullanır, istenirse
     kalıcı olarak susturulur (tercih storeSet ile saklanır).
     ═══════════════════════════════════════════════════════════════ */
  advisorOpen(){
    const h = `<div class="mhd"><span>🛰 DANIŞMAN</span></div>
      <div class="mbd">
        <div class="lead">Hoş geldin, ${esc(G.p.name)}. Üç şeyi bilirsen gerisi gelir.</div>

        <div class="row"><span style="color:#6ff2c8">▲ ÜST BAR</span><b>EKONOMİ</b></div>
        <div class="mini">Mineral, enerji, yiyecek, alaşım ve etki. Yanındaki
          küçük sayı aylık gelirin — <b style="color:#ff5f6d">eksiye düşerse</b>
          stokun erimeye başlar. Kriz ve olay rozetleri de burada belirir.</div>

        <div class="row"><span style="color:#8b7bff">◀ SOL ÇUBUK</span><b>İMPARATORLUK</b></div>
        <div class="mini">Bilim ✦, Devlet 👑, Diplomasi 🤝, Federasyon 🏛 ve
          Galaktik Konsey 🌐 buradan açılır. Bunlar galaksi çapındaki
          kararlarındır. <b>Bir ikonun ne olduğunu öğrenmek için üstüne
          basılı tut.</b></div>

        <div class="row"><span style="color:#ff9b3d">▶ SAĞ PANEL</span><b>SEÇİM</b></div>
        <div class="mini">Haritadan bir yıldıza ya da filoya dokun; sağdaki panel
          onu gösterir. Gezegen kolonileştirme, bina kurma ve gemi inşası
          hep buradan yapılır.</div>

        <div class="mini" style="margin-top:8px;color:#65e08a">İpucu: turuncu nabızla
          yanıp sönen sistemler <b>anomali</b> barındırır. Oraya bilim gemisi
          yollamak keşif ve kaynak getirir — ama bazıları tehlikelidir.</div>
      </div>
      <div class="mft">
        <button class="ch" data-a="advClose"><div class="cht">Anladım</div>
          <div class="chd">Danışman bir sonraki oyunda yine görünür</div></button>
        <button class="ch" data-a="advNever"><div class="cht">Anladım, bir daha gösterme</div>
          <div class="chd">Tercih kalıcı olarak kaydedilir</div></button>
      </div>`;
    this.openModal(h, 'sci', true);
    /* Danışman ilk kullanıcı jestinden sonra açılır — ses hazırdır */
    if (typeof AUDIO !== 'undefined') { try { AUDIO.start(); AUDIO.play('event'); } catch(err){} }
  },

  /* ═══════════════════════════════════════════════════════════════
     FAZ 12 — GENEL EKRAN KAPLAMASI
     Bilim ve Devlet ekranları sağ panelden çıkarıldı; artık sol
     çubuktan tam ekran kaplama olarak açılıyorlar. Mevcut panel
     üreticileri (p_bilim / p_imp) aynen kullanılır — yeni içerik
     yazılmaz, yalnızca YERİ değişir.
     ═══════════════════════════════════════════════════════════════ */
  openGlobal(key){
    const P = GLOBAL_PANES[key];
    if (!P) return;
    this.globalCur = key;
    let govde = '';
    try { govde = this[P.fn]() || ''; }
    catch(err){ govde = `<div class="empty">Panel yüklenemedi.</div>`; }

    /* Kaplama içinde ekranlar arası hızlı geçiş şeridi */
    let sekme = `<div class="gpTabs">`;
    for (const k in GLOBAL_PANES){
      const Q = GLOBAL_PANES[k];
      sekme += `<button class="gpTab ${k===key?'on':''}" data-a="globalPane" data-x="${k}">
        ${Q.ico} ${Q.n}</button>`;
    }
    sekme += `<button class="gpTab" data-a="diploPane">🤝 DİPLOMASİ</button>`;
    sekme += `</div>`;

    $('diploPane').innerHTML = `<div class="dpBox">
      <div class="dpHd"><span>${P.ico} ${P.n}</span>
        <button class="riX" data-a="closeDiplo">✕</button></div>
      ${sekme}
      <div class="dpBody">${govde}</div></div>`;
    $('diploPane').classList.add('show');
    /* Panel içindeki canvas'lar (amblem, portre, gezegen) çizilsin */
    setTimeout(()=>{ try{ paintEmblems(); }catch(err){} }, 0);
  },

  /* =============== GALAKTİK KONSEY =============== */
  openCouncil(){
    const e = G.p;
    let h = `<div class="dpBox">
      <div class="dpHd"><span>🌐 GALAKTİK KONSEY</span>
        <button class="riX" data-a="closeDiplo">✕</button></div>
      <div class="dpBody">`;

    if (G.cfg && G.cfg.council === 'kapali'){
      h += `<div class="empty">Bu galakside Galaktik Konsey devre dışı bırakıldı.</div>`;
    } else if (!councilExists()){
      const chk = canFoundCouncil(e);
      const mil = (e.ethics && e.ethics.mil) || 0;
      h += `<div class="envRow"><span>DURUM</span><b style="color:#7d90ad">KONSEY YOK</b></div>`;
      h += `<div class="mini" style="margin-bottom:10px">Galaktik Konsey, tüm galaksiyi bağlayan
        kararlar alan bir meclistir: silahsızlanma, serbest ticaret, yaptırım, savaş yasağı.
        Yalnızca <b>Pasifist 2 veya üstü</b> bir devlet kurabilir — barışı savunanlar masayı kurar.</div>`;
      h += `<div class="row"><span>Senin askerî duruşun</span>
        <b style="color:${mil<=-2?'#65e08a':'#ff5f6d'}">${mil<0?'PASİFİST '+Math.abs(mil):mil>0?'MİLİTARİST '+mil:'DENGELİ'}</b></div>`;
      h += `<div class="row"><span>Kuruluş bedeli</span><b>${COUNCIL_COST} ◈</b></div>`;
      h += `<div class="row"><span>Etkin</span><b>${fmt(e.res.etk)} ◈</b></div>`;
      if (!chk.ok) h += `<div class="mini" style="color:#ff9b3d">${esc(chk.why)}</div>`;
      h += `<div class="act2"><button class="abtn ${chk.ok?'pri':'dis'}" data-a="cncFound">
        🌐 KONSEYİ KUR</button></div>`;
      h += `<div class="mini" style="margin-top:8px">Kurulduğunda barış hâlindeki tüm tanıdıkların
        kurucu üye olur. İdeolojini Pasifist'e çekmek için DEVLET panelindeki reformu kullanabilirsin.</div>`;
    } else {
      const c = G.council;
      const mem = inCouncil(e);
      const pres = G.emps[c.president];
      h += `<div class="envRow"><span>${esc(c.name)}</span>
        <b style="color:#6ff2c8">${c.members.length} üye</b></div>`;
      h += `<div class="row"><span>Başkan</span>
        <b style="color:${pres?pres.col:'#fff'}">${pres?esc(pres.name):'—'}${c.president===0?' (sen)':''}</b></div>`;
      h += `<div class="row"><span>Başkanlık dönemin</span><b>${(c.terms&&c.terms[0])||0} / 3</b></div>`;
      h += `<div class="row"><span>Oy ağırlığın</span><b style="color:#6ff2c8">${voteWeight(e).toFixed(1)}</b></div>`;
      h += `<div class="mini">Oy ağırlığı toprak, etki ve pasifist ideolojiyle artar.
        3 dönem başkanlık = <b>Konsey Hâkimiyeti zaferi</b>.</div>`;

      /* ═══ FAZ 33: KAMPANYA + GÜNDEM SIRASI ═══ */
      if (c.campaign && RESOLUTIONS[c.campaign.key]){
        const CR = RESOLUTIONS[c.campaign.key];
        const sp = G.emps[c.campaign.sponsor];
        h += `<div class="ph">KAMPANYA DÖNEMİ</div>`;
        h += `<div class="box" style="border-color:#8b7bff">
          <div class="bt"><span>${CR.ico} ${CR.n}</span>
            <span class="tag p">${c.campaign.left} AY</span></div>
          <div class="bd">${CR.d}
            ${sp ? `<br><span style="color:${sp.col}">${esc(sp.name)}</span> önerdi` : ''}
          </div></div>`;
        const rN = Object.keys(c.campaign.bribed || {}).length;
        const sN = (c.campaign.blackmailed || []).length;
        if (rN || sN)
          h += `<div class="mini">Perde arkası: ${rN} rüşvet · ${sN} şantaj</div>`;
        h += `<div class="mini">Oyları çevirmek için <b>İSTİHBARAT</b> sekmesini aç.</div>`;
      }

      /* Kuyrukta bekleyen teklifler */
      const kuyruk = (c.agenda || []).slice().sort((a, b) => {
        const w = x => x.backers.reduce((t, id) => {
          const o = G.emps[id]; return t + (o && !o.dead ? voteWeight(o) : 0); }, 0);
        return w(b) - w(a);
      });
      if (kuyruk.length){
        h += `<div class="ph">GÜNDEM SIRASI (${kuyruk.length})</div>`;
        kuyruk.forEach((a, i) => {
          const AR = RESOLUTIONS[a.key];
          if (!AR) return;
          let w = 0;
          a.backers.forEach(id => {
            const o = G.emps[id]; if (o && !o.dead) w += voteWeight(o); });
          const isim = a.backers.map(id => G.emps[id])
            .filter(o => o && !o.dead)
            .map(o => `<span style="color:${o.col}">${esc(o.name)}</span>`).join(', ');
          h += `<div class="box" style="${i===0?'border-color:#6ff2c8':''}">
            <div class="bt"><span>${AR.ico} ${AR.n}</span>
              <b style="color:${i===0?'#6ff2c8':'#7d90ad'}">${w.toFixed(1)}</b></div>
            <div class="bd">${isim || '—'}${i===0?' · <b style="color:#6ff2c8">sıradaki</b>':''}</div>
          </div>`;
        });
        h += `<div class="mini">Arkasında en çok diplomatik ağırlık biriken
          teklif bir sonraki oylamaya gelir.</div>`;
      }

      // açık oylama
      if (c.vote){
        const R = RESOLUTIONS[c.vote.key];
        const tgt = c.vote.target !== null && G.emps[c.vote.target] ? G.emps[c.vote.target] : null;
        h += `<div class="ph">AÇIK OYLAMA</div>`;
        h += `<div class="box" style="border-color:#ff9b3d">
          <div class="bt"><span>${R.ico} ${R.n}</span>${tgt?`<span class="tag b">${esc(tgt.name)}</span>`:''}</div>
          <div class="bd">${R.d}</div>`;
        if (c.vote.speeches && c.vote.speeches.length){
          h += `<div class="ph" style="margin-top:8px">MECLİS KÜRSÜSÜ</div>`;
          c.vote.speeches.forEach(sp=>{
            const so = G.emps[sp.id];
            h += `<div class="mini" style="border-left:2px solid ${so?so.col:'#555'};padding-left:8px;margin:5px 0">
              <b style="color:${so?so.col:'#fff'}">${so?esc(so.name):'?'}</b>
              <span class="tag ${sp.yes?'p':'b'}">${sp.yes?'EVET':'HAYIR'}</span><br>
              <i>"${esc(sp.txt)}"</i></div>`;
          });
        }
        if (mem) h += `<div class="act2">
          <button class="abtn pri" data-a="cncYes">EVET</button>
          <button class="abtn dgr" data-a="cncNo">HAYIR</button></div>`;
        else h += `<div class="mini" style="color:#ff9b3d">Üye olmadığın için oy kullanamazsın.</div>`;
        h += `</div>`;
      } else {
        const leftM = Math.max(0, c.voteIn === undefined ? 12 : c.voteIn);
        h += `<div class="row"><span>Sonraki oylama</span><b>${leftM} ay sonra</b></div>`;
      }

      if (typeof unityActive === 'function' && unityActive()){
        h += `<div class="box" style="border-color:#65e08a">
          <div class="bt"><span>🛡 GALAKTİK ODAK YÜRÜRLÜKTE</span></div>
          <div class="bd">Kriz sürerken üyeler arasındaki savaşlar dondurulmuş,
          sınırlar karşılıklı açılmış durumda. Kriz biterse bu düzen sona erer.</div></div>`;
      }
      /* ═══ FAZ 38: GALAKTİK KORUYUCU ═══ */
      let koruyucu = null;
      for (const x of G.emps){
        if (x.dead || x.wild || x.crisisSide) continue;
        if (x.guardian){ koruyucu = x; break; }
      }
      if (koruyucu){
        const yozlasmis = koruyucu.guardian.newOrder;
        const benim = koruyucu.id === 0;
        h += `<div class="ph">🛡 GALAKSİNİN KORUYUCUSU</div>`;
        h += `<div class="box" style="border-color:${yozlasmis?'#ff5f6d':'#6ff2c8'}">
          <div class="bt"><span style="color:${koruyucu.col}">${esc(koruyucu.name)}${
            benim?' (SEN)':''}</span>
            <span class="tag ${yozlasmis?'e':'p'}">${
              yozlasmis?'YENİ DÜZEN':'KORUYUCU'}</span></div>
          <div class="bd">${yozlasmis
            ? 'Yetkilerini bırakmayı reddetti. Unvan kalıcı, galaksi ona düşman.'
            : 'Krizi bitiren devlet. Konseyde oy ağırlığı +%50, 15 yılda bir veto hakkı.'}
          </div></div>`;

        /* VETO BUTONU — yalnız oyuncu koruyucuysa */
        if (benim && typeof guardianCanVeto === 'function'){
          const hazir = guardianCanVeto(koruyucu);
          const gap = (typeof GUARDIAN_VETO_GAP !== 'undefined') ? GUARDIAN_VETO_GAP : 180;
          const kalan = Math.max(0, gap - ((G.memAge || 0) - (koruyucu.guardian.vetoAt || 0)));
          const yasalar = Object.keys(c.laws).filter(k => c.laws[k] && RESOLUTIONS[k]);
          if (!hazir){
            h += `<div class="mini">⏳ Veto hakkı ${Math.ceil(kalan/12)} yıl sonra
              tazelenecek (${kalan} ay).</div>`;
          } else if (!yasalar.length){
            h += `<div class="mini">Veto hakkın hazır ama yürürlükte yasa yok.</div>`;
          } else {
            h += `<div class="mini" style="color:#ff9b3d">⚡ VETO HAKKIN HAZIR —
              bir yasayı tek başına yürürlükten kaldırabilirsin. Galaksi bunu
              hoş karşılamaz (−10 itibar).</div><div class="act2">`;
            yasalar.forEach(k => {
              h += `<button class="abtn dgr" data-a="veto" data-x="${k}">⛔ ${
                RESOLUTIONS[k].ico} ${esc(RESOLUTIONS[k].n.slice(0,18))}</button>`;
            });
            h += `</div>`;
          }
        }
      }

      /* ═══ FAZ 49: DİPLOMATİK AĞIRLIK ROZETİ ═══ */
      if (typeof voteWeight === 'function'){
        const w = voteWeight(e);
        const cezaVar = e._billPenalty && e._billPenalty > (G.memAge || 0);
        let cezaMik = 0, kalanAy = 0;
        if (cezaVar){
          kalanAy = e._billPenalty - (G.memAge || 0);
          const yedek = e._billPenalty;
          e._billPenalty = 0;
          cezaMik = voteWeight(e) - w;
          e._billPenalty = yedek;
        }
        h += `<div class="ph">DİPLOMATİK AĞIRLIĞIN</div>`;
        h += `<div class="row"><span>Oy ağırlığı</span>
          <b style="color:${cezaVar?'#ff9b3d':'#6ff2c8'}">${w.toFixed(1)}</b></div>`;
        if (cezaVar)
          h += `<div class="box" style="border-color:#ff5f6d">
            <div class="bt"><span>📜 TASARI RET CEZASI</span>
              <span class="tag e">−${cezaMik.toFixed(1)} AĞIRLIK</span></div>
            <div class="bd">${kalanAy} ay kaldı (${Math.ceil(kalanAy/12)} yıl).
              Reddedilen tasarın konseydeki sözünü zayıflattı.</div></div>`;
        if (e.guardian)
          h += `<div class="mini" style="color:#6ff2c8">🛡 Koruyucu bonusu: ×1.5</div>`;
      }

      /* ═══ FAZ 51: KONSEY BAŞKANLIĞI ═══ */
      {
        const bsk = c.president !== undefined ? G.emps[c.president] : null;
        const daimi = c.permanent !== undefined && c.permanent !== null;
        const kalan = daimi ? 0 : Math.max(0,
          (typeof PRESIDENT_TERM !== 'undefined' ? PRESIDENT_TERM : 180) - (c.termAge || 0));
        h += `<div class="ph">🏛 KONSEY BAŞKANLIĞI</div>`;
        h += `<div class="box" style="border-color:${daimi?'#d65cf5':'#6ff2c8'}">
          <div class="bt"><span style="color:${bsk?bsk.col:'#7d90ad'}">${
            bsk ? esc(bsk.name) + (bsk.id===0?' (SEN)':'') : 'boş'}</span>
            <span class="tag ${daimi?'e':'p'}">${daimi?'DAİMİ HÜKÜMDAR':'DÖNEM BAŞKANI'}</span></div>
          <div class="bd">${daimi
            ? 'Seçimler kaldırıldı. Taht kalıcı.'
            : `Seçime <b>${Math.ceil(kalan/12)}</b> yıl (${kalan} ay) ·
               dönem ${(c.terms && c.terms[c.president]) || 1}`}</div></div>`;
        if (typeof canClaimPermanent === 'function' && !daimi){
          const pk = canClaimPermanent(e);
          if (pk.ok){
            h += `<div class="mini">Seçimleri kaldırıp tahtı kalıcı kıl.
              <b style="color:#ff9b3d">Risk:</b> reddedilirse galaksi seni diktatör
              adayı sayar (−22 ilişki, +30 tehdit, 5 yıl ağırlık cezası).</div>
              <div class="act2"><button class="abtn dgr" data-a="permanent">
              👑 DAİMİ HÜKÜMDARLIK<br><span style="font-size:9px">${
                typeof PERMANENT_COST !== 'undefined' ? PERMANENT_COST : 200} ◈</span>
              </button></div>`;
          } else if (c.president === e.id){
            h += `<div class="mini" style="color:#7d90ad">${esc(pk.why)}</div>`;
          }
        }
      }

      /* ═══ FAZ 48: TASARI SUNMA ═══ */
      if (typeof canProposeBill === 'function'){
        const chk = canProposeBill(e);
        h += `<div class="ph">📜 TASARI SUN</div>`;
        if (!chk.ok){
          h += `<div class="mini" style="color:#7d90ad">${esc(chk.why)}</div>`;
        } else {
          const bedel = (typeof BILL_COST !== 'undefined') ? BILL_COST : 120;
          h += `<div class="mini">Konseye kendi tasarını sun (${bedel} ◈).
            <b style="color:#ff9b3d">Risk:</b> reddedilirse prestij kaybedersin
            ve 5 yıl boyunca konseydeki ağırlığın azalır.</div>`;
          const acik = (typeof openResolutions === 'function') ? openResolutions() : [];
          const sunulabilir = acik.filter(k => RESOLUTIONS[k] && !RESOLUTIONS[k].hedefli);
          if (sunulabilir.length){
            h += `<div class="act2">`;
            sunulabilir.slice(0, 6).forEach(k => {
              const R = RESOLUTIONS[k];
              h += `<button class="abtn" data-a="bill" data-x="${k}">
                ${R.ico} ${esc(R.n.slice(0,20))}</button>`;
            });
            h += `</div>`;
          }
          /* Hedefli tasarılar: tehdit ilanı */
          const hedefli = acik.filter(k => RESOLUTIONS[k] && RESOLUTIONS[k].hedefli);
          if (hedefli.length && this.billKey && RESOLUTIONS[this.billKey] &&
              RESOLUTIONS[this.billKey].hedefli){
            h += `<div class="mini" style="margin-top:4px">HEDEF SEÇ:</div><div class="act2">`;
            c.members.forEach(m => {
              const o = G.emps[m];
              if (!o || o.dead || o.id === 0) return;
              h += `<button class="abtn dgr" data-a="billTarget" data-x="${o.id}">
                ${esc(o.name.slice(0,14))}</button>`;
            });
            h += `</div>`;
          } else if (hedefli.length){
            h += `<div class="act2">`;
            hedefli.slice(0, 3).forEach(k => {
              const R = RESOLUTIONS[k];
              h += `<button class="abtn dgr" data-a="billPick" data-x="${k}">
                ${R.ico} ${esc(R.n.slice(0,18))}<br>
                <span style="font-size:9px">hedef seç</span></button>`;
            });
            h += `</div>`;
          }
        }
      }

      /* ═══ FAZ 38: İSYANCI İTTİFAKI ═══ */
      if (typeof corruptGuardian === 'function'){
        const ra = G.rebelAlliance;
        const zalim = corruptGuardian();
        if (zalim && ra && !ra.done && ra.members.length){
          const benUye = ra.members.indexOf(0) >= 0;
          const guc = (typeof rebelPower === 'function') ? rebelPower() : 0;
          const onun = totalPower(zalim);
          const oran = onun > 0 ? guc / onun : 0;
          h += `<div class="ph">${ra.revealed ? '⚔ ÖZGÜRLÜK SAVAŞI' : '🕯 GÖLGELERDEKİ İTTİFAK'}</div>`;
          h += `<div class="box" style="border-color:${ra.revealed?'#ff5f6d':'#8b7bff'}">
            <div class="bt"><span>${ra.members.length} devlet · hedef ${esc(zalim.name)}</span>
              <span class="tag ${ra.revealed?'e':'b'}">${ra.revealed?'AÇIK SAVAŞ':'GİZLİ'}</span></div>
            <div class="gRow" style="margin-top:4px">
              <span class="gIco" style="color:#8b7bff">⚔</span>
              <div class="gBarW"><div class="gBar" style="width:${
                Math.min(100, oran*100)}%;background:${oran>=1?'#65e08a':'#8b7bff'}"></div></div>
              <b style="color:${oran>=1?'#65e08a':'#8b7bff'}">×${oran.toFixed(2)}</b></div>
            <div class="bd">${ra.revealed
              ? 'İttifak gölgeden çıktı ve savaş ilan etti.'
              : 'Güçleri zalimi <b>1.8 katı</b> aştığında ve 2 yıllık hazırlık ' +
                'dolduğunda ayaklanacaklar. Şu an casuslukla yıpratıyorlar.'}
              ${benUye ? '<br><span style="color:#65e08a">⚑ Bu ittifakın üyesisin — ' +
                'gücün toplama dahil.</span>' : ''}
            </div></div>`;

          /* ═══ FAZ 39: OYUNCU KATILIMI ═══ */
          if (typeof canJoinRebellion === 'function'){
            if (!benUye){
              const chk = canJoinRebellion(e);
              if (chk.ok){
                const benimGuc = totalPower(e);
                const yeniOran = onun > 0 ? (guc + benimGuc) / onun : 0;
                h += `<div class="mini">Katılırsan gücün (${Math.round(benimGuc)})
                  toplama eklenir → oran <b style="color:${
                    yeniOran >= 1.8 ? '#65e08a' : '#ff9b3d'}">×${yeniOran.toFixed(2)}</b>${
                    yeniOran >= 1.8 && oran < 1.8
                      ? ' — <b style="color:#65e08a">isyanı sen başlatabilirsin</b>' : ''}</div>`;
                h += `<div class="act2"><button class="abtn dgr" data-a="joinRebel">
                  ⚑ İSYANCI İTTİFAKINA KATIL</button></div>`;
              } else {
                h += `<div class="mini" style="color:#7d90ad">${esc(chk.why)}</div>`;
              }
            } else if (!ra.revealed){
              h += `<div class="act2"><button class="abtn" data-a="leaveRebel">
                ◂ İTTİFAKTAN ÇEKİL<br><span style="font-size:9px">diğerleri kırılır</span>
                </button></div>`;
            }
          }
        }
      }

      h += `<div class="ph">YÜRÜRLÜKTEKİ KARARLAR</div>`;
      const active = Object.keys(c.laws).filter(k=>c.laws[k]);
      /* FAZ 38: parya artık çoklu — ayrı listelenir */
      const targeted = Object.keys(c.targeted).filter(k =>
        k !== 'parya' && c.targeted[k] !== undefined && c.targeted[k] !== null);
      const paryalar = (typeof pariahList === 'function') ? pariahList() : [];
      if (!active.length && !targeted.length && !paryalar.length)
        h += `<div class="mini">Henüz karar alınmadı.</div>`;
      active.forEach(k=>{
        const R = RESOLUTIONS[k];
        h += `<div class="box" style="border-color:#6ff2c8"><div class="bt">
          <span>${R.ico} ${R.n}</span><span class="tag p">YÜRÜRLÜKTE</span></div>
          <div class="bd">${R.d}</div></div>`;
      });
      targeted.forEach(k=>{
        const R = RESOLUTIONS[k], t = G.emps[c.targeted[k]];
        if (!t) return;
        const me = t.id === 0;
        h += `<div class="box" style="border-color:${me?'#ff5f6d':'#ff9b3d'}"><div class="bt">
          <span>${R.ico} ${R.n}</span><span class="tag ${me?'b':'e'}">${esc(t.name)}${me?' (SEN)':''}</span></div>
          <div class="bd">${R.d}</div></div>`;
      });

      /* ═══ ÇOKLU PARYA LİSTESİ ═══ */
      if (paryalar.length){
        h += `<div class="ph">⛔ GALAKTİK PARYALAR (${paryalar.length})</div>`;
        paryalar.forEach(id => {
          const t = G.emps[id];
          if (!t) return;
          const me = id === 0;
          const kalan = (typeof pariahAmnestyLeft === 'function')
            ? pariahAmnestyLeft(id) : null;
          h += `<div class="box" style="border-color:${me?'#ff5f6d':'#ff9b3d'}">
            <div class="bt"><span style="color:${t.col}">${esc(t.name)}${me?' (SEN)':''}</span>
              <span class="tag ${me?'b':'e'}">PARYA</span></div>
            <div class="bd">Ticaret kesik, sınırlar kapalı.${
              kalan !== null ? `<br>Galaktik affa <b>${kalan} ay</b> (${
                Math.ceil(kalan/12)} yıl)` : ''}</div></div>`;
        });
      }

      h += `<div class="ph">ÜYELER</div>`;
      const sorted = c.members.slice().sort((a,b)=>voteWeight(G.emps[b])-voteWeight(G.emps[a]));
      sorted.forEach(m=>{
        const o = G.emps[m];
        if (!o) return;
        h += `<div class="dpCard"><div class="dpTop">
          <canvas class="dpPort" data-lk="${o.look||'humanoid'}" data-col="${o.col}"
            data-pers="${typeof personaKey==='function'?personaKey(o):'yayilmaci'}"
            data-mood="${Math.round(e.rel[o.id]||0)}" width="34" height="46"></canvas>
          <div class="dpName"><b style="color:${o.col}">${esc(o.name)}${m===0?' (sen)':''}</b>
          <i>${RACES[o.race].sifat} · oy ağırlığı ${voteWeight(o).toFixed(1)}</i></div>
          ${m===c.president?'<span class="tag p">BAŞKAN</span>':''}</div></div>`;
      });

      h += `<div class="act2" style="margin-top:12px">`;
      if (mem) h += `<button class="abtn dgr" data-a="cncLeave">KONSEYDEN AYRIL</button>`;
      else h += `<button class="abtn pri" data-a="cncJoin">KONSEYE KATIL</button>`;
      h += `</div>`;
      if (c.laws.muhafiz)
        h += `<div class="row"><span>Konsey Muhafız hazinesi</span><b>${Math.round(c.treasury)} ▰</b></div>`;
    }
    h += `</div></div>`;
    $('diploPane').innerHTML = h;
    $('diploPane').classList.add('show');
    setTimeout(()=>{
      [...document.querySelectorAll('canvas.dpPort')].forEach(cv=>{
        const g = cv.getContext('2d');
        g.imageSmoothingEnabled = false;
        const spr = ART.portraitFull({
          look: cv.dataset.lk, col: cv.dataset.col,
          persona: cv.dataset.pers, mood: +(cv.dataset.mood || 0), scale: 3
        });
        const sc = Math.min(cv.width/spr.width, cv.height/spr.height) * .9;
        g.drawImage(spr, (cv.width-spr.width*sc)/2, (cv.height-spr.height*sc)/2, spr.width*sc, spr.height*sc);
      });
    }, 0);
  },
  councilFounded(founder){
    this.notify({kind:'cncnew', data:founder.id, ico:'🌐', cls:'sci', pause:true,
      title:'GALAKTİK KONSEY KURULDU',
      sub:founder.name + ' galaksiyi masaya çağırdı', key:'cncnew'});
  },
  councilNewOpen(fid){
    const f = G.emps[fid];
    const c = G.council;
    const mem = c && c.members.includes(0);
    this.openModal(
      `<div class="mhd"><span>🌐 GALAKTİK KONSEY</span></div>
       <div class="mbd"><div class="lead">${f?esc(f.name):'Bir imparatorluk'} tüm galaksiyi
       tek bir masaya çağırdı: <b>${c?esc(c.name):'Konsey'}</b> kuruldu.</div>
       Konsey kararları galaksi çapında bağlayıcıdır — silahsızlanma, yaptırım, savaş yasağı.
       Oy ağırlığı toprak, etki ve pasifist ideolojiyle artar.
       ${mem ? '<br><br><b style="color:#65e08a">Kurucu üyeler arasındasın.</b>'
             : '<br><br><b style="color:#ff9b3d">Üye değilsin</b> — katılmazsan kararlarda söz hakkın olmaz ama yaptırımlardan da etkilenebilirsin.'}
       </div>
       <div class="mft">
        <button class="ch" data-a="cncOpenFromNote"><div class="cht">Konsey panelini aç</div></button>
        <button class="ch" data-a="closem"><div class="cht">Kapat</div></button>
       </div>`, 'sci');
    this._hook('cncOpenFromNote', ()=>{ this.closeModal(); this.openCouncil(); });
  },
  councilVote(){
    const c = G.council;
    if (!c || !c.vote) return;
    const R = RESOLUTIONS[c.vote.key];
    this.notify({kind:'cncvote', data:c.vote.key, ico:'🌐', cls:'sci', pause:true,
      title:'KONSEY OYLAMASI', sub:R.n, key:'cnc'+G.day});
  },
  councilVoteOpen(){
    this.closeModal();
    this.openCouncil();
  },

  /* =============== MÜZAKERE MASASI =============== */
  openDeal(id){
    this.deal = {from:0, to:+id, give:[], want:[]};
    this.dealMsg = '';
    this.drawDeal();
  },
  drawDeal(){
    const d = this.deal;
    if (!d) return;
    const e = G.p, o = G.emps[d.to];
    const ev = evalOffer(o, d);
    const mood = ev.net > 40 ? {t:'MEMNUN', c:'#65e08a'} :
                 ev.net > 0  ? {t:'İKNA OLDU', c:'#6ff2c8'} :
                 ev.net > -150 ? {t:'KARARSIZ', c:'#ff9b3d'} : {t:'REDDEDER', c:'#ff5f6d'};
    const short = ev.net < 0 ? Math.round(-ev.net) : 0;

    let h = `<div class="dpBox" style="width:min(760px,96%)">
      <div class="dpHd"><span>MÜZAKERE · ${esc(o.name)}</span>
        <button class="riX" data-a="closeDeal">✕</button></div>
      <div class="dpBody">`;

    h += `<div class="envRow"><span>KARŞI TARAFIN TUTUMU</span>
      <b style="color:${mood.c}">${mood.t}</b></div>`;
    // değer yeterli olsa bile taraflar sözünü tutamayabilir
    const meCan = canDeliver(e, d.give, o);
    const themCan = canDeliver(o, d.want, e);
    const deliverable = meCan && themCan;
    h += `<div class="envRow"><span>DENGE</span><b style="color:${(ev.net>=0&&deliverable)?'#65e08a':'#ff5f6d'}">
      ${ev.net >= 0 ? 'teklif yeterli (+' + Math.round(ev.net) + ')' : short + ' değer eksik'}</b></div>`;
    if (!deliverable){
      const bad = [];
      if (!meCan) bad.push('senin verdiklerini karşılayamıyorsun');
      if (!themCan) bad.push(esc(o.name) + ' istediklerini veremez (savaş açamaz, sistemi yok ya da anlaşma kilitli)');
      h += `<div class="envRow wrapRow" style="border-color:#ff5f6d"><span>UYGULANABİLİRLİK</span>
        <b style="color:#ff5f6d">${bad.join(' · ')}</b></div>`;
    }
    if (this.dealMsg) h += `<div class="mini" style="color:#ff9b3d;margin-bottom:8px">${esc(this.dealMsg)}</div>`;

    h += `<div class="dealCols">`;
    // --- sen ne veriyorsun ---
    h += `<div class="dealCol"><div class="ph">SEN VERİYORSUN</div>`;
    h += d.give.length
      ? d.give.map((it,i)=>`<div class="dealItem"><span>${dealLabel(it)}</span>
          <button data-a="dealRm" data-x="give:${i}">✕</button></div>`).join('')
      : `<div class="mini">— boş —</div>`;
    h += `<div class="act2">
      <button class="abtn" data-a="dealAdd" data-x="give:res">${RES.min.ico} Kaynak</button>
      <button class="abtn" data-a="dealAdd" data-x="give:tech">✦ Teknoloji</button>
      <button class="abtn" data-a="dealAdd" data-x="give:sys">★ Sistem</button>
      <button class="abtn" data-a="dealAdd" data-x="give:tribute">⏳ Haraç</button>
      <button class="abtn" data-a="dealAdd" data-x="give:lux">❖ Lüks mal</button>
      <button class="abtn" data-a="dealAdd" data-x="give:intel">👁 İstihbarat</button>
      <button class="abtn" data-a="dealAdd" data-x="give:warOn">⚔ Savaş sözü</button>
      <button class="abtn" data-a="dealAdd" data-x="give:peaceWith">🤲 Barıştırma</button>
      <button class="abtn" data-a="dealAdd" data-x="give:passage">🚪 Geçiş izni</button>
    </div></div>`;

    // --- ne istiyorsun ---
    h += `<div class="dealCol"><div class="ph">SEN İSTİYORSUN</div>`;
    h += d.want.length
      ? d.want.map((it,i)=>`<div class="dealItem"><span>${dealLabel(it)}</span>
          <button data-a="dealRm" data-x="want:${i}">✕</button></div>`).join('')
      : `<div class="mini">— boş —</div>`;
    h += `<div class="act2">
      <button class="abtn" data-a="dealAdd" data-x="want:res">${RES.min.ico} Kaynak</button>
      <button class="abtn" data-a="dealAdd" data-x="want:tech">✦ Teknoloji</button>
      <button class="abtn" data-a="dealAdd" data-x="want:sys">★ Sistem</button>
      <button class="abtn" data-a="dealAdd" data-x="want:tribute">⏳ Haraç</button>
      <button class="abtn" data-a="dealAdd" data-x="want:lux">❖ Lüks mal</button>
      <button class="abtn" data-a="dealAdd" data-x="want:intel">👁 İstihbarat</button>
      <button class="abtn" data-a="dealAdd" data-x="want:warOn">⚔ Savaş sözü</button>
      <button class="abtn" data-a="dealAdd" data-x="want:peaceWith">🤲 Barıştırma</button>
      <button class="abtn" data-a="dealAdd" data-x="want:passage">🚪 Geçiş izni</button>
    </div></div></div>`;

    // --- anlaşma türleri ---
    h += `<div class="ph">ANLAŞMA MADDELERİ</div><div class="act2">`;
    const pactBtns = [['peace','🕊 Barış'],['nap','🛡 Saldırmazlık'],['pact','🤝 Ticaret'],['ally','⚑ İttifak']];
    for (const [k, lbl] of pactBtns){
      const inGive = d.give.some(x=>x.t===k), inWant = d.want.some(x=>x.t===k);
      h += `<button class="abtn ${(inGive||inWant)?'pri':''}" data-a="dealPact" data-x="${k}">${lbl}</button>`;
    }
    h += `</div><div class="mini">Anlaşma maddeleri iki tarafı da bağlar.</div>`;

    h += `<div class="act2" style="margin-top:14px">
      <button class="abtn pri" data-a="dealSend">TEKLİFİ SUN</button>
      <button class="abtn" data-a="closeDeal">VAZGEÇ</button></div>`;
    h += `</div></div>`;
    $('diploPane').innerHTML = h;
    $('diploPane').classList.add('show');
  },

  dealAdd(x){
    const [side, kind] = x.split(':');
    const d = this.deal;
    const e = G.p, o = G.emps[d.to];
    const src = (side === 'give') ? e : o;
    const list = (side === 'give') ? d.give : d.want;

    if (kind === 'res' || kind === 'tribute'){
      const opts = ['min','ene','ala','tuk'].map(r=>({
        lbl: RES[r].ico + ' ' + RES[r].n + ' (' + fmt(src.res[r]||0) + ')', r}));
      this.pickList('Hangi kaynak?', opts.map(x2=>x2.lbl), i=>{
        const r = opts[i].r;
        if (kind === 'res'){
          const max = Math.floor((src.res[r]||0) * .8);
          const amts = [100, 250, 500, 1000].filter(a=>a <= Math.max(100, max));
          this.pickList('Ne kadar?', amts.map(a=>fmt(a) + ' ' + RES[r].n), j=>{
            list.push({t:'res', r, v: amts[j]}); this.drawDeal();
          });
        } else {
          const amts = [5, 10, 20];
          this.pickList('Aylık ne kadar? (10 yıl)', amts.map(a=>a + ' ' + RES[r].n + '/ay'), j=>{
            list.push({t:'tribute', r, v: amts[j]}); this.drawDeal();
          });
        }
      });
      return;
    }
    if (kind === 'tech'){
      const mine = Object.keys(src.techs || {});
      const theirs = (side === 'give') ? o : e;
      const av = mine.filter(t => !theirs.techs[t] && TECHS[t]);
      if (!av.length){ say('Paylaşılabilecek teknoloji yok'); return; }
      this.pickList('Hangi teknoloji?', av.map(t=>TECHS[t].n), i=>{
        list.push({t:'tech', id: av[i]}); this.drawDeal();
      });
      return;
    }
    if (kind === 'sys'){
      const own = G.sys.filter(sy => sy.owner === src.id && src.home !== sy.id);
      if (!own.length){ say('Devredilebilir sistem yok'); return; }
      const top = own.slice(0, 12);
      this.pickList('Hangi sistem?', top.map(sy=>sy.name + ' (' +
        sy.planets.filter(p=>p.col).length + ' koloni)'), i=>{
        list.push({t:'sys', id: top[i].id}); this.drawDeal();
      });
      return;
    }
    if (kind === 'lux'){
      const own = ownLuxury(src);
      const keys = Object.keys(own);
      if (!keys.length){ say('Bu tarafın lüks malı yok'); return; }
      this.pickList('Hangi mal?', keys.map(k=>LUXURY[k].ico + ' ' + LUXURY[k].n), i=>{
        list.push({t:'lux', k: keys[i]}); this.drawDeal();
      });
      return;
    }
    if (kind === 'intel'){ list.push({t:'intel'}); this.drawDeal(); return; }
    if (kind === 'passage'){ list.push({t:'passage'}); this.drawDeal(); return; }
    if (kind === 'warOn'){
      const cands = G.emps.filter(x=>!x.dead && !x.wild && x.id !== 0 && x.id !== d.to && !src.war[x.id]);
      if (!cands.length){ say('Savaş ilan edilecek uygun hedef yok'); return; }
      this.pickList('Kime savaş ilan edilsin?', cands.map(x=>x.name), i=>{
        list.push({t:'warOn', target: cands[i].id}); this.drawDeal();
      });
      return;
    }
    if (kind === 'peaceWith'){
      // src'nin savaşta olduğu taraflar
      const cands = G.emps.filter(x=>!x.dead && !x.wild && x.id !== src.id && src.war[x.id]);
      if (!cands.length){ say(side==='give' ? 'Savaşta olduğun kimse yok' : 'Onun savaşta olduğu kimse yok'); return; }
      this.pickList('Kiminle barışılsın?', cands.map(x=>x.name + (x.id===0?' (sen)':'')), i=>{
        list.push({t:'peaceWith', target: cands[i].id}); this.drawDeal();
      });
      return;
    }
  },
  dealPact(k){
    const d = this.deal;
    const has = d.give.some(x=>x.t===k) || d.want.some(x=>x.t===k);
    if (has){
      d.give = d.give.filter(x=>x.t!==k);
      d.want = d.want.filter(x=>x.t!==k);
    } else {
      d.want.push({t:k});
    }
    this.drawDeal();
  },
  dealRm(x){
    const [side, i] = x.split(':');
    const list = (side === 'give') ? this.deal.give : this.deal.want;
    list.splice(+i, 1);
    this.drawDeal();
  },
  dealSend(){
    const d = this.deal;
    const e = G.p, o = G.emps[d.to];
    if (!d.give.length && !d.want.length){ say('Masada bir şey yok'); return; }
    if (!canDeliver(e, d.give, o)){ this.dealMsg = 'Verdiklerini karşılayamıyorsun.'; this.drawDeal(); return; }
    const r = aiRespond(o, d);
    if (r.v === 'kabul'){
      if (executeDeal(d)){
        $('diploPane').classList.remove('show');
        this.deal = null;
        say('ANLAŞMA İMZALANDI — ' + o.name, 'win');
        this.refresh();
      } else this.dealMsg = 'Anlaşma uygulanamadı.';
      this.drawDeal && this.deal && this.drawDeal();
      return;
    }
    if (r.v === 'karsi'){
      this.dealMsg = esc(o.name) + ': "' + r.why + '" — masaya eklendi: ' +
                     r.add.map(dealLabel).join(', ');
      r.add.forEach(it => d.give.push(it));
      this.drawDeal();
      return;
    }
    this.dealMsg = esc(o.name) + ': "' + r.why + '"';
    this.drawDeal();
  },

  /* savaş hedefi seçim ekranı — savaş artık amaçsız değil */
  warGoalMenu(id){
    const e = G.p, o = G.emps[id];
    let h = `<div class="mhd"><span>⚔ SAVAŞ HEDEFİ · ${esc(o.name)}</span></div>
      <div class="mbd"><div class="lead">Ne için savaşıyorsun? Hedefe ulaşmak barış
      masasında sana koz verir; hedefsiz savaş sadece yorgunluk biriktirir.</div>
      <div class="row"><span>Etkin</span><b style="color:#6ff2c8">${fmt(e.res.etk)}</b></div>
      ${hasPerk(e,'freeWar')?'<div class="mini" style="color:#65e08a">✧ Savaş Hakkı: hedef bedava</div>':''}
      </div><div class="mft">`;
    for (const k in WAR_GOALS){
      const W = WAR_GOALS[k];
      const free = hasPerk(e,'freeWar');
      const afford = free || e.res.etk >= W.etk;
      h += `<button class="ch" data-a="${afford?'setwg':'x'}" data-x="${id}:${k}" style="${afford?'':'opacity:.4'}">
        <div class="cht">${W.ico} ${W.n} <span style="float:right;color:#7d90ad">${free?'bedava':W.etk+'◈'}</span></div>
        <div class="chd">${W.d}</div></button>`;
    }
    h += `<button class="ch" data-a="closem"><div class="cht">Vazgeç</div></button></div>`;
    this.openModal(h, 'war');
  },
  /* hediye ekranı — ne göndereceğini ve ne kadar olduğunu seçersin */
  giftMenu(id){
    const e = G.p, o = G.emps[id];
    let h = `<div class="mhd"><span>🎁 HEDİYE · ${esc(o.name)}</span></div>
      <div class="mbd"><div class="lead">Hediyenin değeri, karşı tarafın o kaynağa ne kadar
      ihtiyaç duyduğuna göre değişir. Sıkıntı çektiği kaynak çok daha fazla ilişki kazandırır.</div>`;
    // AI'nın neye ihtiyacı var?
    const needs = ['min','ene','ala','tuk','yiy'].map(r=>({
      r, inc:(o.inc && o.inc[r]) || 0, stock:o.res[r]||0
    })).sort((a,b)=>a.inc-b.inc);
    const worst = needs[0];
    h += `<div class="mini" style="color:#f2d452">En çok ihtiyacı olan: ${RES[worst.r].ico} ${RES[worst.r].n}
      (${worst.inc >= 0 ? '+' : ''}${worst.inc.toFixed(1)}/ay)</div></div><div class="mft">`;
    for (const r of ['min','ene','ala','tuk','yiy']){
      const have = Math.floor(e.res[r]||0);
      if (have < 100) continue;
      const opts = [200, 500, 1000].filter(v => v <= have);
      for (const v of opts){
        const val = itemValue(o, {t:'res', r, v}, e);
        const gain = clamp(Math.round(val * .10 * (1 + e.mods.dipMul)), 3, 45);
        h += `<button class="ch" data-a="giftDo" data-x="${id}:${r}:${v}">
          <div class="cht"><span style="color:${RES[r].c}">${RES[r].ico} ${v} ${RES[r].n}</span>
            <span style="float:right;color:#65e08a">+${gain} ilişki</span></div>
          <div class="chd">Elinde ${fmt(have)} var</div></button>`;
      }
    }
    h += `<button class="ch" data-a="closem"><div class="cht">Vazgeç</div></button></div>`;
    this.openModal(h);
  },
  /* FAZ 5: oyuncunun fısıltı operasyonu — iki hedef seçimi */
  whisperMenu(){
    const e = G.p;
    const bedel = (typeof WHISPER_COST !== 'undefined') ? WHISPER_COST : 45;
    const known = G.emps.filter(o => !o.dead && !o.wild && o.id !== 0 && e.contact[o.id]);
    if (this.wA === undefined) this.wA = null;
    if (this.wB === undefined) this.wB = null;
    /* seçilen ikili geçerli mi? */
    if (this.wA !== null && this.wB !== null && this.wA === this.wB) this.wB = null;

    const A = this.wA !== null ? G.emps[this.wA] : null;
    const B = this.wB !== null ? G.emps[this.wB] : null;
    const hazir = !!(A && B);
    const zatenSavas = hazir && A.war[B.id];

    let h = `<div class="mhd"><span>🕸 FISILTI AĞI</span></div>
      <div class="mbd"><div class="lead">İki imparatorluğun arasına kin ek. Kaynak görünmez
      kalır — ama sonsuza dek değil.</div>
      <div class="row"><span>Etkin</span><b style="color:${e.res.etk>=bedel?'#6ff2c8':'#ff5f6d'}">${fmt(e.res.etk)} / ${bedel} ◈</b></div>`;

    if (typeof whisperSuccessChance === 'function'){
      const sans = Math.round(whisperSuccessChance(e) * 100);
      h += `<div class="row"><span>Başarı şansın</span><b style="color:#65e08a">%${sans}</b></div>`;
      if (hazir){
        const ffMul = (this.wC !== null && this.wC !== undefined &&
          typeof FALSE_FLAG_RISK_MUL !== 'undefined') ? FALSE_FLAG_RISK_MUL : 1;
        const risk = Math.round(Math.min(.75, whisperExposureRisk(e, A, B) * ffMul) * 100);
        h += `<div class="row"><span>Anında ifşa riski</span><b style="color:${risk>30?'#ff5f6d':'#ff9b3d'}">%${risk}</b></div>`;
        h += `<div class="mini">Anında ifşa olmasa bile operasyon <b>20 yıl boyunca</b>
          çözülebilir. Karşı istihbaratı güçlü hedefler izi daha kolay bulur.</div>`;
      }
    }
    h += `</div><div class="mft">`;

    if (!known.length){
      h += `<div class="mini" style="padding:10px">Henüz kimseyle temas kurulmadı.</div>`;
    } else {
      h += `<div class="mini" style="padding:6px 10px">${
        !A ? 'Birinci hedefi seç' : !B ? 'İkinci hedefi seç' : 'Hedefler hazır'}</div>`;
      known.forEach(o => {
        const sec = (this.wA === o.id) ? '① ' : (this.wB === o.id) ? '② ' : '';
        const on = sec ? 'pri' : '';
        h += `<button class="ch ${on}" data-a="whisperPick" data-x="${o.id}">
          <div class="cht">${sec}<span style="color:${o.col}">${esc(o.name)}</span></div>
          <div class="chd">${RACES[o.race].sifat} · ${sysCount(o)} sistem${
            typeof personaOf==='function' ? ' · ' + personaOf(o).n : ''}</div></button>`;
      });
    }
    if (hazir && zatenSavas)
      h += `<div class="mini" style="color:#ff5f6d;padding:6px 10px">Bu ikili zaten savaşta — bozacak bir şey yok.</div>`;

    /* ── SAHTE BAYRAK: suçu üçüncü bir tarafa yıkma ── */
    const ffEk = (typeof FALSE_FLAG_EXTRA !== 'undefined') ? FALSE_FLAG_EXTRA : 35;
    if (hazir && !zatenSavas){
      const suclanabilir = known.filter(o => o.id !== this.wA && o.id !== this.wB &&
        A.contact[o.id] && B.contact[o.id]);
      h += `<div class="mini" style="padding:8px 10px;border-top:1px solid var(--line)">
        <b style="color:#ff9b3d">SAHTE BAYRAK (isteğe bağlı, +${ffEk} ◈)</b><br>
        Suçu üçüncü bir devlete yık: kurbanlar öfkelerini ona yöneltir.
        <b style="color:#ff5f6d">Ama ifşa olursa üç devlet birden sana düşman kesilir
        ve "Sahte Bayrak" savaş nedeni kazanır.</b></div>`;
      if (!suclanabilir.length){
        h += `<div class="mini" style="padding:0 10px 8px">Her iki hedefin de tanıdığı
          uygun bir üçüncü taraf yok.</div>`;
      } else {
        suclanabilir.forEach(o => {
          const sec = (this.wC === o.id);
          h += `<button class="ch ${sec?'pri':''}" data-a="whisperBlame" data-x="${o.id}">
            <div class="cht">${sec?'🎭 ':''}Suçu <span style="color:${o.col}">${esc(o.name)}</span> üstüne yık</div>
            <div class="chd">${sec ? 'seçili — ifşa riski ×1.55' : 'ek bedel ' + ffEk + ' ◈'}</div></button>`;
        });
      }
    }

    const C = (this.wC !== null && this.wC !== undefined) ? G.emps[this.wC] : null;
    const toplam = bedel + (C ? ffEk : 0);
    const yeter = e.res.etk >= toplam;
    const gecerli = hazir && !zatenSavas && yeter;
    h += `<button class="ch ${gecerli ? '' : 'dis'}" data-a="${gecerli ? 'whisperGo' : 'x'}">
      <div class="cht">${C ? '🎭 SAHTE BAYRAK OPERASYONU' : '🕸 OPERASYONU BAŞLAT'} (${toplam} ◈)</div>
      <div class="chd">${hazir ? esc(A.name) + ' ↔ ' + esc(B.name) +
        (C ? ' · suç: ' + esc(C.name) : '') : 'iki hedef seçilmeli'}</div></button>`;
    h += `<button class="ch" data-a="closem"><div class="cht">Vazgeç</div></button></div>`;
    this.openModal(h, 'sci');
  },

  /* ═══════════════════════════════════════════════════════════════
     FAZ 11 — "KİM BANA NE YAPTI?" İSTİHBARAT DOSYASI
     e.hitLog (mağdur kaydı) ve e.opLog (kendi operasyonlarım)
     arayüze bağlanır. Faili bilinmeyen dosyalar ANONİM görünür;
     karşı istihbarat çözdükçe isim ortaya çıkar (hitLogTick).
     ═══════════════════════════════════════════════════════════════ */
  opLogMenu(){
    const e = G.p;
    const simdi = G.memAge || 0;
    const yasStr = t => {
      const d = simdi - t;
      if (d < 1) return 'bu ay';
      if (d < 12) return d + ' ay önce';
      const y = Math.floor(d / 12);
      return y + ' yıl önce';
    };

    const gelen = (e.hitLog || []).slice().reverse();
    const giden = (e.opLog  || []).slice().reverse();

    let h = `<div class="mhd"><span>🕵 İSTİHBARAT DOSYASI</span></div><div class="mbd">`;

    /* Özet: kaç saldırı, kaçı çözülmüş */
    const cozulmemis = gelen.filter(w => !w.known).length;
    h += `<div class="row"><span>Sana yapılan operasyon</span>
      <b style="color:${gelen.length?'#ff5f6d':'#65e08a'}">${gelen.length}</b></div>`;
    h += `<div class="row"><span>Faili bilinmeyen dosya</span>
      <b style="color:${cozulmemis?'#ff9b3d':'#7d90ad'}">${cozulmemis}</b></div>`;
    if (typeof counterIntel === 'function')
      h += `<div class="row"><span>Karşı istihbarat gücün</span>
        <b style="color:#6ff2c8">${counterIntel(e).toFixed(2)}</b></div>`;
    h += `<div class="mini">Bilinmeyen failler zamanla çözülebilir. Bilim ve diplomasi
      seviyeni yükseltmek, Karşı İstihbarat civic'i almak soruşturmayı hızlandırır.</div>`;
    h += `</div><div class="mft">`;

    /* ── SANA YAPILANLAR ── */
    h += `<div class="ph" style="padding:6px 10px">SANA YAPILANLAR</div>`;
    if (!gelen.length){
      h += `<div class="mini" style="padding:0 10px 8px">Bilinen bir operasyon yok.</div>`;
    } else {
      gelen.slice(0, 14).forEach(w => {
        const OP = (typeof OPS !== 'undefined' && OPS[w.k]) ? OPS[w.k] : null;
        const fail = w.known ? G.emps[w.by] : null;
        const ad = fail ? `<span style="color:${fail.col}">${esc(fail.name)}</span>`
                        : `<span style="color:#7d90ad">FAİL BİLİNMİYOR</span>`;
        const durum = w.caught ? '<span class="tag b">SUÇÜSTÜ</span>'
                    : w.known  ? '<span class="tag e">SONRADAN ÇÖZÜLDÜ</span>'
                               : '<span class="tag">AÇIK DOSYA</span>';
        h += `<div class="box" style="border-color:${w.known?'#ff5f6d':'#3a4560'}">
          <div class="bt"><span>${OP ? OP.ico + ' ' + OP.n : w.k}</span>${durum}</div>
          <div class="bd">${ad} · ${yasStr(w.t)}${
            w.foundAt !== undefined ? ' · dosya ' + yasStr(w.foundAt) + ' çözüldü' : ''}</div></div>`;
      });
      if (gelen.length > 14)
        h += `<div class="mini" style="padding:0 10px">…ve ${gelen.length - 14} eski kayıt</div>`;
    }

    /* ── SENİN YAPTIKLARIN ── */
    h += `<div class="ph" style="padding:6px 10px">SENİN OPERASYONLARIN</div>`;
    if (!giden.length){
      h += `<div class="mini" style="padding:0 10px 8px">Henüz operasyon düzenlemedin.</div>`;
    } else {
      giden.slice(0, 10).forEach(w => {
        const OP = (typeof OPS !== 'undefined' && OPS[w.k]) ? OPS[w.k] : null;
        const hedef = G.emps[w.o];
        h += `<div class="box" style="border-color:${w.caught?'#ff9b3d':'#2b3a55'}">
          <div class="bt"><span>${OP ? OP.ico + ' ' + OP.n : w.k}</span>${
            w.caught ? '<span class="tag b">İFŞA OLDU</span>' : '<span class="tag p">TEMİZ</span>'}</div>
          <div class="bd">${hedef ? `<span style="color:${hedef.col}">${esc(hedef.name)}</span>` : '?'}
            · ${yasStr(w.t)}</div></div>`;
      });
    }
    h += `<button class="ch" data-a="closem"><div class="cht">Kapat</div></button></div>`;
    this.openModal(h, 'sci');
  },

  opsMenu(id){
    const e = G.p, o = G.emps[id];
    const lvl = intelOf(e, id);
    let h = `<div class="mhd"><span>🎯 OPERASYONLAR · ${esc(o.name)}</span></div>
      <div class="mbd">
        <div class="row"><span>İstihbarat seviyesi</span><b style="color:#6ff2c8">${INTEL_LEVELS[lvl].n}</b></div>
        <div class="mini">${INTEL_LEVELS[lvl].d}</div>
      </div><div class="mft">`;
    for (const k in OPS){
      const OP = OPS[k];
      const okLvl = lvl >= OP.lvl;
      const cost = Object.entries(OP.cost).map(([r,v])=>RES[r].ico + v).join(' ');
      const afford = Object.keys(OP.cost).every(r=>(e.res[r]||0) >= OP.cost[r]);
      h += `<button class="ch" data-a="${okLvl&&afford?'runop':'x'}" data-x="${id}:${k}"
        style="${okLvl&&afford?'':'opacity:.4'}">
        <div class="cht">${OP.ico} ${OP.n} <span style="float:right;color:#7d90ad">${cost}</span></div>
        <div class="chd">${OP.d}<br>
          <span style="color:${okLvl?'#65e08a':'#ff5f6d'}">Gereken: ${INTEL_LEVELS[OP.lvl].n}</span>
          · <span style="color:#ff9b3d">İfşa riski %${Math.round(OP.risk*100)}</span></div></button>`;
    }
    h += `<button class="ch" data-a="closem"><div class="cht">Kapat</div></button></div>`;
    this.openModal(h, 'sci');
  },

  /* AI'nın sana getirdiği teklif */
  aiOffer(offer){
    const o = G.emps[offer.from];
    this.pendingOffer = offer;
    this.notify({kind:'aideal', data:offer.from, ico:'📜', pause:false,
      title:'Teklif — ' + o.name,
      sub:(offer.want.map(dealLabel).join(', ') || 'anlaşma') + ' istiyor',
      key:'aideal:'+offer.from});
  },
  aiDealOpen(fromId){
    const offer = this.pendingOffer;
    if (!offer || offer.from !== +fromId){ say('Teklif geçerliliğini yitirdi'); return; }
    const o = G.emps[offer.from];
    this.openModal(
      `<div class="mhd"><span>TEKLİF · ${esc(o.name)}</span></div>
       <div class="mbd">
         <div class="ph">SANA VERİYOR</div>
         ${offer.give.length ? offer.give.map(it=>`<div class="dealItem"><span>${dealLabel(it)}</span></div>`).join('')
                             : '<div class="mini">— hiçbir şey —</div>'}
         <div class="ph">SENDEN İSTİYOR</div>
         ${offer.want.length ? offer.want.map(it=>`<div class="dealItem"><span>${dealLabel(it)}</span></div>`).join('')
                             : '<div class="mini">— hiçbir şey —</div>'}
       </div>
       <div class="mft">
         <button class="ch" data-a="offYes"><div class="cht">Kabul et</div></button>
         <button class="ch" data-a="offCounter"><div class="cht">Masaya otur</div>
           <div class="chd">Teklifi düzenleyip karşı teklif ver</div></button>
         <button class="ch" data-a="offNo"><div class="cht">Reddet</div></button>
       </div>`);
    this._hook('offYes', ()=>{
      // AI'nın teklifi: o veriyor (give), ben veriyorum (want)
      const mirrored = {from: offer.from, to: 0, give: offer.give, want: offer.want};
      if (executeDeal(mirrored)) say('Anlaşma imzalandı — ' + o.name, 'win');
      else say('Anlaşma uygulanamadı');
      this.pendingOffer = null;
      this.closeModal(); this.refresh();
    });
    this._hook('offCounter', ()=>{
      this.closeModal();
      this.deal = {from:0, to:offer.from, give:offer.want.slice(), want:offer.give.slice()};
      this.dealMsg = 'Karşı teklif hazırlıyorsun.';
      this.pendingOffer = null;
      this.drawDeal();
    });
    this._hook('offNo', ()=>{
      o.rel[0] = clamp(o.rel[0] - 5, -100, 100);
      this.pendingOffer = null;
      this.closeModal(); this.refresh();
    });
  },

  /* basit seçim listesi (müzakere için) */
  pickList(title, labels, cb){
    this._pick = cb;
    this.openModal(
      `<div class="mhd"><span>${esc(title)}</span></div>
       <div class="mft">${labels.map((l,i)=>
         `<button class="ch" data-a="pickOne" data-x="${i}"><div class="cht">${l}</div></button>`
       ).join('')}<button class="ch" data-a="closem"><div class="cht">Vazgeç</div></button></div>`);
    this._hook('pickOne', i=>{
      this.closeModal();
      const f = this._pick; this._pick = null;
      if (f) f(+i);
    });
  },

  /* =============== FEDERASYON OYLAMASI =============== */
  fedVote(f){
    this.notify({kind:'fedvote', data:f.id, ico:'🏛', pause:true,
      title:'Federasyon oylaması', sub:FED_LAWS[f.vote.law].n, key:'fed:'+f.id});
  },
  fedVoteOpen(fid){
    const f = fedOf(fid);
    if (!f || !f.vote){ return; }
    const L = FED_LAWS[f.vote.law];
    const yes = f.vote.yes.length, no = f.vote.no.length;
    this.openModal(
      `<div class="mhd"><span>${esc(f.name)}</span></div>
       <div class="mbd"><div class="lead">${L.ico} ${L.n}</div>${L.d}
       <div class="row" style="margin-top:10px"><span>Mevcut oylar</span>
         <b><span style="color:#65e08a">${yes} evet</span> · <span style="color:#ff5f6d">${no} hayır</span></b></div>
       <div class="mini">Üyeler: ${f.members.map(m=>esc(G.emps[m].name)).join(' · ')}</div></div>
       <div class="mft">
         <button class="ch" data-a="fedYes"><div class="cht">EVET oy ver</div></button>
         <button class="ch" data-a="fedNo"><div class="cht">HAYIR oy ver</div></button>
       </div>`);
    this._hook('fedYes', ()=>{ f.vote.yes.push(0); finishFedVote(f); this.closeModal(); this.refresh(); });
    this._hook('fedNo',  ()=>{ f.vote.no.push(0);  finishFedVote(f); this.closeModal(); this.refresh(); });
  },

  /* =============== DEVLET =============== */
  p_imp(){
    const e = G.p, race = RACES[e.race];
    let h = `<div class="ph">${esc(e.name)}</div>`;
    h += `<div style="display:flex;gap:10px;align-items:center;margin-bottom:8px">
      <canvas id="empPortrait" width="46" height="46" style="image-rendering:pixelated;flex:0 0 46px;
        background:var(--void);border:1px solid ${e.col}"></canvas>
      <div style="flex:1;min-width:0">
        <div class="mono" style="font-size:11px;color:${e.col}">${LOOKS[e.look||'humanoid'].n}</div>
        <div class="mini">${esc(LOOKS[e.look||'humanoid'].d)}</div>
        <div class="mini">Sınır erişimi: <b style="color:#6ff2c8">${Math.round(G.sys.filter(sy=>sy.owner===e.id).reduce((a,sy)=>a+(sy._reach||0),0)/Math.max(1,sysCount(e)))}</b> bg</div>
      </div></div>`;
    h += `<div class="row"><span>Tür</span><b>${race.sifat}</b></div>`;
    const eth = [];
    for (const ax in ETHICS){
      const v = (e.ethics||{})[ax] || 0;
      if (v) eth.push(`<span style="color:${v>0?'#ff9b3d':'#6ff2c8'}">${v>0?ETHICS[ax].a:ETHICS[ax].b} ${Math.abs(v)}</span>`);
    }
    if (eth.length) h += `<div class="row"><span>İdeoloji</span><b>${eth.join(' · ')}</b></div>`;
    if (e.civics && e.civics.length){
      h += `<div class="ph">CIVIC</div>`;
      e.civics.forEach(k=>{
        const cv = CIVICS[k]; if (!cv) return;
        h += `<div class="box"><div class="bt"><span>${cv.ico} ${cv.n}</span>${cv.sars?'<span class="tag e">⚡</span>':''}</div>
              <div class="bd">${cv.d}</div></div>`;
      });
      if (hasCivic(e,'mono') && e.monoRes)
        h += `<div class="mini">Tek ürün: <span style="color:${RES[e.monoRes].c}">${RES[e.monoRes].ico} ${RES[e.monoRes].n}</span></div>`;
      if (e.furyUntil && G.day < e.furyUntil)
        h += `<div class="mini" style="color:#ff9b3d">⚔ Savaş coşkusu aktif — ${Math.ceil((e.furyUntil-G.day)/30)} ay</div>`;
      if (e.collapseUntil && G.day < e.collapseUntil)
        h += `<div class="mini" style="color:#ff5f6d">⚰ Önder yasında — ${Math.ceil((e.collapseUntil-G.day)/30)} ay</div>`;
    }
    // --- KRİZ DURUMU ---
    if (G.crisis){
      h += `<div class="ph">GALAKTİK KRİZ</div>`;
      if (G.crisis.over){
        h += `<div class="mini" style="color:#65e08a">✓ Kriz atlatıldı — galaksi hayatta kaldı.</div>`;
      } else if (G.crisis.stage === 0){
        const due = G.crisis.atMonth !== undefined ? G.crisis.atMonth : 480;
        const leftM = Math.max(0, due - (G.crisis.age||0));
        const leftY = Math.ceil(leftM/12);
        h += `<div class="row"><span>Beklenen</span><b>${leftM > 0 ? leftY + ' yıl sonra' : 'her an'}</b></div>`;
        h += `<div class="mini">${leftM > 0 ? 'Donanma ve kale hazırlığı yap.' : 'Kriz çok yakın.'}</div>`;
      } else {
        const foes = G.fleets.filter(f=>f.e===G.crisisId);
        const pow = foes.reduce((a,f)=>a+fleetPower(f),0);
        h += `<div class="row"><span>Aşama</span><b style="color:#c026d3">${G.crisis.stage} / 3</b></div>`;
        h += `<div class="row"><span>Düşman gücü</span><b style="color:#ff5f6d">${fmt(pow)}</b></div>`;
        h += `<div class="row"><span>Katkın</span><b>${Math.round((G.crisis.contrib&&G.crisis.contrib[0])||0)}</b></div>`;
      }
    }
    if (G.crisis && !G.crisis.over && G.crisis.stage === 0 && hasCivic(e,'crisisheir')){
      h += `<div class="box" style="border-color:#c026d3">
        <div class="bt"><span>🌋 KRİZİ ERKEN TETİKLE</span></div>
        <div class="bd">Kriz Mirasçısı olarak krizi şimdi başlatabilirsin. Erken kriz
        daha zayıf gelir — ama hazır değilsen felaket olur.</div>
        <div class="act2"><button class="abtn dgr" data-a="trigCrisis">ŞİMDİ BAŞLAT</button></div></div>`;
    }
    if (G.ruins && G.ruins.length){
      h += `<div class="row"><span>Çözülmemiş kalıntı</span><b style="color:#8b7bff">${G.ruins.length}</b></div>`;
    }

    // --- ETİK YETENEKLERİ ---
    const perks = perksOf(e);
    if (perks.length){
      /* ── GİZLİ MİZAÇ, ONUR VE DİPLOMATİK AĞIRLIK ── */
      if (typeof personaOf === 'function'){
        const P = personaOf(e);
        h += `<div class="ph">MİZAÇ VE İTİBAR</div>`;
        h += `<div class="row"><span>Mizacın</span><b style="color:${P.col}">${P.ico} ${P.n}</b></div>`;
        h += `<div class="mini">${P.d}</div>`;
      }
      if (typeof honorOf === 'function'){
        const hn = honorOf(e);
        const hl = hn > 30 ? 'SAYGIN' : hn > 5 ? 'güvenilir'
                 : hn < -40 ? 'HAİN' : hn < -15 ? 'tehlikeli' : 'tarafsız';
        h += `<div class="row"><span>Galaktik itibar</span>
          <b style="color:${hn>5?'#65e08a':hn<-15?'#ff5f6d':'#7d90ad'}">${hl} (${hn>0?'+':''}${hn})</b></div>`;
        h += `<div class="bar ${hn>=0?'':'hp'}"><i style="width:${clamp((hn+100)/2,0,100)}%"></i></div>`;
        h += `<div class="mini">Sözünde durmak yükseltir, ihanet çökertir.
          İtibar konseydeki söz hakkını doğrudan belirler.</div>`;
      }
      if (typeof councilExists === 'function' && councilExists() &&
          typeof voteWeightBreakdown === 'function'){
        const B = voteWeightBreakdown(e);
        h += `<div class="row"><span>Diplomatik ağırlık</span>
          <b style="color:${B.onur>=0?'#65e08a':'#ff5f6d'}">${B.toplam}</b></div>`;
        h += `<div class="mini">${B.sistem} sistem · ${B.nufus} nüfus · ${B.etki} etki
          = maddi taban ${B.maddi} → onur ${B.onur>0?'+':''}${B.onur} ile ×${B.carpan}</div>`;
        if (B.onur <= -30)
          h += `<div class="mini" style="color:#ff5f6d">⚠ İtibarın kürsüdeki sesini kısıyor</div>`;
        else if (B.onur >= 30)
          h += `<div class="mini" style="color:#65e08a">✦ İtibarın konseyde ağırlığını artırıyor</div>`;
      }

      /* FAZ 8: hegemonya */
      if (typeof vassalsOf === 'function'){
        const vs = vassalsOf(e);
        if (isVassal(e)){
          const lo = overlordOf(e);
          const T = VASSAL_TYPES[e.vassalType || 'haracguzar'];
          h += `<div class="box" style="border-color:#ff5f6d">
            <div class="bt"><span>⛓ VASALSIN — ${esc(lo ? lo.name : '?')}</span>
            <span class="tag b">${T.n}</span></div>
            <div class="bd">${T.d}
            <br>Bağımsızlık arzusu: <b>${Math.round(e.vassalAnger || 0)}/100</b>${
              (typeof vassalLoyaltyInfo === 'function' && vassalLoyaltyInfo(e))
                ? ' · <b style="color:' + (vassalLoyaltyInfo(e).arzu >= 70 ? '#ff5f6d'
                  : vassalLoyaltyInfo(e).arzu >= 45 ? '#ff9b3d' : '#7d90ad') + '">' +
                  vassalLoyaltyInfo(e).durum + '</b> (' + vassalLoyaltyInfo(e).yon + ')' +
                  (vassalLoyaltyInfo(e).kalanAy ? ' · ~' + vassalLoyaltyInfo(e).kalanAy + ' ay' : '')
                : ''} —
            70'i aşarsa ve senyörün zayıflarsa isyan edebilirsin.</div></div>`;
        }
        if (vs.length){
          h += `<div class="ph">👑 HEGEMONYA — ${vs.length} VASAL</div>`;
          let vergi = 0;
          vs.forEach(v => {
            const T = VASSAL_TYPES[v.vassalType || 'haracguzar'];
            vergi += v.vassalPaid || 0;
            h += `<div class="row"><span>${T.ico} ${esc(v.name)}</span>
              <b style="color:${(v.vassalAnger||0) > 60 ? '#ff5f6d' : '#65e08a'}">${T.n} · öfke ${Math.round(v.vassalAnger||0)}</b></div>`;
          });
          if (vergi > 0) h += `<div class="row"><span>Aylık vergi geliri</span>
            <b style="color:#65e08a">${vergi.toFixed(1)}</b></div>`;
          const cap = (typeof vassalCapBonus === 'function') ? vassalCapBonus(e) : 0;
          if (cap) h += `<div class="row"><span>Bekçi kapasite katkısı</span><b>+${cap}</b></div>`;
          if (typeof hegemonyWeight === 'function'){
            const hw = hegemonyWeight(e);
            if (hw > 0) h += `<div class="mini" style="color:#8b7bff">🏛 Konseyde vasallarının
              ${hw.toFixed(1)} ek oy ağırlığını sen kullanıyorsun</div>`;
          }
        }
      }
      /* FAZ 8: hegemonya ve vasallık */
      if (typeof vassalsOf === 'function'){
        const vs = vassalsOf(e);
        if (vs.length){
          h += `<div class="ph">HEGEMONYA</div>`;
          vs.forEach(v => {
            const T = VASSAL_TYPES[vassalType(v)];
            h += `<div class="row"><span style="color:${v.col}">${T.ico} ${esc(v.name)}</span>
              <b>${T.n}${vassalType(v)==='haracguzar' ? ' · '+Math.round(v.vassalPaid||0)+'/ay' : ''}</b></div>`;
            if ((v.vassalAnger||0) > 55)
              h += `<div class="mini" style="color:#ff5f6d">⚠ Öfke ${Math.round(v.vassalAnger)}/100 — isyan riski</div>`;
          });
          const cap = vassalCapBonus(e);
          if (cap) h += `<div class="mini">Sınır bekçileri filo kapasitene +${cap} katıyor</div>`;
          h += `<div class="mini">Konseyde vasallarının ağırlığı senin oyuna ekleniyor
            (+${hegemonyWeight(e).toFixed(1)})</div>`;
        }
        if (isVassal(e)){
          const lord = overlordOf(e);
          const T = VASSAL_TYPES[vassalType(e)];
          h += `<div class="box" style="border-color:#ff5f6d">
            <div class="bt"><span>⛓ ${T.ico} ${T.n}</span><span class="tag b">${esc(lord.name)}</span></div>
            <div class="bd">${T.d}<br>Öfken: <b>${Math.round(e.vassalAnger||0)}/100</b>.
            Senyörün zayıflarsa ve öfke 70'i geçerse bağımsızlık savaşı açabilirsin.</div></div>`;
        }
      }
      /* FAZ 3: üzerimdeki ekonomik baskı */
      if (typeof embargoPressure === 'function'){
        const ep = embargoPressure(e);
        if (typeof isPariah === 'function' && isPariah(e)){
          h += `<div class="box" style="border-color:#ff5f6d">
            <div class="bt"><span>⛔ GALAKTİK PARYA</span></div>
            <div class="bd">Konsey seni galaksiden dışladı: hiçbir devletle ticaret yapamazsın
            ve tüm üretimin −%30. İtibarını onarırsan yaptırım kalkar.</div></div>`;
        } else if (ep.n){
          h += `<div class="row"><span>Ambargo baskısı</span>
            <b style="color:#ff5f6d">${ep.n} devlet</b></div>`;
          h += `<div class="mini" style="color:#ff9b3d">Ticaret yolların kesik — gelirin düşük.
            Güveni onarmak ambargoları kaldırır.</div>`;
        }
      }
      /* FAZ 18: danışmanı yeniden aç */
      h += `<div class="act2" style="margin-bottom:8px">
        <button class="abtn" data-a="advShow">🛰 DANIŞMANI AÇ</button></div>`;

      /* FAZ 8: hegemonya durumu */
      if (typeof isVassal === 'function'){
        if (isVassal(e)){
          const L = G.emps[e.overlord];
          const T = VASSAL_TYPES[e.vassalType] || VASSAL_TYPES.haracguzar;
          if (L) h += `<div class="box" style="border-color:#ff9b3d">
            <div class="bt"><span>${T.ico} ${esc(L.name)} DEVLETİNİN VASALISIN</span></div>
            <div class="bd">${T.d}<br>Boyunduruk öfkesi: <b>${Math.round(e.vassalAnger||0)}/100</b>
            ${e.vassalPaid ? '· son vergi ' + Math.round(e.vassalPaid) : ''}<br>
            Öfke dolduğunda ve senyörün zayıfladığında bağımsızlık savaşı açabilirsin.</div>
            <div class="act2" style="margin-top:6px">
              <button class="abtn ${(e.vassalAnger||0) >= 55 ? 'dgr' : 'dis'}"
                data-a="revolt">⛓ BAĞIMSIZLIK SAVAŞI İLAN ET</button></div></div>`;
        }
        const vs = vassalsOf(e);
        if (vs.length){
          h += `<div class="ph">VASALLARIN (${vs.length})</div>`;
          vs.forEach(v => {
            const T = VASSAL_TYPES[v.vassalType] || VASSAL_TYPES.haracguzar;
            h += `<div class="row"><span style="color:${v.col}">${T.ico} ${esc(v.name)}</span>
              <b>${T.n} · öfke ${Math.round(v.vassalAnger||0)}</b></div>`;
          });
          h += `<div class="mini">Konsey ağırlığına vasal katkısı:
            <b style="color:#6ff2c8">+${hegemonyWeight(e).toFixed(1)}</b>${
            vassalCapBonus(e) ? ' · filo kapasitesi +' + vassalCapBonus(e) : ''}</div>`;
        }
      }
      if (typeof threatLabel === 'function'){
        if (e.threatFrozen !== undefined)
          h += `<div class="mini" style="color:#8b7bff">⏸ Galaktik Tehdit lekesi kriz
            boyunca askıda (${Math.round(e.threatFrozen)}) — kriz bitince yarısı geri gelir</div>`;
        if (typeof PARIAH_THREAT !== 'undefined' && (e.threat||0) >= PARIAH_THREAT)
          h += `<div class="box" style="border-color:#ff5f6d">
            <div class="bt"><span>⛔ PARYA ADAYISIN</span></div>
            <div class="bd">Tehdit puanın ${Math.round(e.threat)}. Konsey seni Galaktik
            Parya ilan edebilir: tüm galaksiyle ticaretin kesilir ve üretimin −%30 düşer.
            Barış içinde kalarak lekeyi silebilirsin.</div></div>`;
        const tl = threatLabel(e.threat || 0);
        if (tl) h += `<div class="box" style="border-color:#ff5f6d">
          <div class="bt"><span>⚠ ${tl}</span><b>${Math.round(e.threat)}</b></div>
          <div class="bd">Gerekçesiz savaş açtın. Tüm galaksi sana karşı temkinli:
          etki, diplomasi ve enerji üretimin düşük. Barış içinde kaldıkça
          bu leke yavaşça silinir.</div></div>`;
      }
      h += `<div class="ph">İDEOLOJİ YETENEKLERİ</div>`;
      perks.forEach(pk=>{
        h += `<div class="box"><div class="bt"><span>✧ ${pk.n}</span></div>
              <div class="bd">${pk.d}</div></div>`;
      });
    } else {
      h += `<div class="mini">Bir etik eksenini 2 veya 3'e taşırsan özel yetenekler açılır.</div>`;
    }

    // --- İDEOLOJİ REFORMU ---
    {
      const chk = canReform(e);
      h += `<div class="ph">İDEOLOJİ REFORMU</div>`;
      h += `<div class="mini">Büyük bir etki bedeliyle ideolojini kaydırabilirsin. Fraksiyonlar
        tepki verir: yönüne uyan memnun olur, karşı olan küser. ${REFORM_COST} etki · 10 yılda bir.</div>`;
      if (!chk.ok) h += `<div class="mini" style="color:#ff9b3d">${esc(chk.why)}</div>`;
      for (const ax in ETHICS){
        const E2 = ETHICS[ax], v = e.ethics ? (e.ethics[ax]||0) : 0;
        h += `<div class="box"><div class="bt"><span>${E2.n}</span>
          <span class="mono" style="color:${v>0?'#ff9b3d':v<0?'#6ff2c8':'#7d90ad'}">${
            v>0?E2.a+' '+v : v<0?E2.b+' '+Math.abs(v) : 'DENGELİ'}</span></div>
          <div class="act2">
            <button class="abtn ${chk.ok?'':'dis'}" data-a="reform" data-x="${ax}:-1">◄ ${E2.b}</button>
            <button class="abtn ${chk.ok?'':'dis'}" data-a="reform" data-x="${ax}:1">${E2.a} ►</button>
          </div></div>`;
      }
    }

    // --- FRAKSİYONLAR ---
    const fac = facSummary(e);
    if (fac){
      h += `<div class="ph">FRAKSİYONLAR</div>`;
      h += `<div class="mini">Memnuniyet yalnızca senin kararlarından değişir. Güçlü ve memnun
        fraksiyon bonus verir; güçlü ve kızgın olan üretimi baltalar.</div>`;
      fac.forEach(f=>{
        const F = f.def;
        const col = f.mood>=60?'#65e08a':f.mood<=35?'#ff5f6d':'#ff9b3d';
        h += `<div class="box" style="border-color:${f.mood<=20?'#ff5f6d':'var(--line)'}">
          <div class="bt"><span>${F.ico} ${F.n}</span>
            <span class="mono" style="color:${F.col}">güç %${f.pow}</span></div>
          <div class="mini">${esc(f.leader)} · ${F.ister}</div>
          <div class="row"><span>Memnuniyet</span><b style="color:${col}">${Math.round(f.mood)} · ${f.state}</b></div>
          <div class="bar"><i style="width:${f.mood}%;background:${col}"></i></div>`;
        if (f.demand)
          h += `<div class="mini" style="color:#ff9b3d">📋 TALEP: ${esc(f.demand.txt)} — ${f.demand.left} ay</div>`;
        if (f.log && f.log.length)
          h += `<div class="mini">${f.log.slice(0,3).map(l=>
            `<span style="color:${l.v>0?'#65e08a':'#ff5f6d'}">${l.v>0?'+':''}${l.v}</span> ${esc(l.t)}`).join(' · ')}</div>`;
        if (f.pow >= 55 && f.mood <= 25)
          h += `<div class="mini" style="color:#ff5f6d">⚠ DARBE RİSKİ — bu fraksiyon yönetimi ele geçirebilir</div>`;
        h += `</div>`;
      });
    } else if (e.unity !== undefined){
      h += `<div class="ph">UYUM</div>`;
      h += `<div class="row"><span>Kolektif uyum</span><b style="color:${e.unity>60?'#65e08a':'#ff9b3d'}">${Math.round(e.unity)}</b></div>`;
      h += `<div class="bar"><i style="width:${e.unity}%"></i></div>`;
      h += `<div class="mini">Tek irade: bu imparatorlukta fraksiyon yoktur.</div>`;
    }

    if (e.origin && ORIGINS[e.origin])
      h += `<div class="row"><span>Köken</span><b>${ORIGINS[e.origin].ico} ${ORIGINS[e.origin].n}</b></div>`;
    h += `<div class="row"><span>Sistem</span><b>${sysCount(e)} / ${G.sys.length}</b></div>`;
    h += `<div class="row"><span>Koloni</span><b>${e.colonies.length}</b></div>`;
    /* FAZ 46: float birikimi — 22.719999999999999 yerine tam sayı */
    h += `<div class="row"><span>Nüfus</span><b>${Math.floor(e.colonies.reduce((a,c)=>{const p=G.sys[c.s].planets[c.p];return a+(p.col?p.col.pop:0);},0))}</b></div>`;
    h += `<div class="row"><span>Filo gücü</span><b style="color:#6ff2c8">${fmt(totalPower(e))}</b></div>`;

    h += `<div class="ph">ZAFER YOLLARI</div>`;
    h += `<div class="mini">Her yol herkese açık ve <b>eşikler herkes için aynı</b>.
      Türünün eğilimi sadece nereye doğal olarak yöneldiğini gösterir, avantaj vermez.</div>`;
    if (G.year < MIN_WIN_YEAR)
      h += `<div class="mini" style="color:#ff9b3d">Zafer ${MIN_WIN_YEAR} yılına kadar kilitli (${MIN_WIN_YEAR - G.year} yıl)</div>`;
    const rows = [];
    for (const t in WIN_TYPES){
      const W = WIN_TYPES[t], own = race.win === t;
      const k = W.esik * winScale(e, t);
      const p = victoryProgressOf(e, t);
      const hold = (e.winHold && e.winHold[t]) || 0;
      rows.push({t, W, own, p, hold, k});
    }
    rows.sort((a,b)=> b.p - a.p);
    rows.forEach(r=>{
      const pct = clamp(r.p*100, 0, 100);
      const col = r.p >= 1 ? '#65e08a' : r.own ? '#6ff2c8' : '#7d90ad';
      h += `<div class="box" style="${r.own?'border-color:#2b5c50':''}">
        <div class="bt"><span>${r.W.ico} ${r.W.n}${r.own?' <span class="tag">EĞİLİMİN</span>':''}</span>
        <span class="mono" style="color:${col}">%${Math.round(pct)}</span></div>
        <div class="bd">${r.W.txt(e, r.k)}</div>
        <div class="bar"><i style="width:${pct}%;background:${col}"></i></div>
        ${r.p>=1 ? `<div class="mini" style="color:#65e08a">Koşul sağlandı — ${HOLD_MONTHS-r.hold>0?(HOLD_MONTHS-r.hold)+' ay daha koru':'zafer yakın!'}</div>` : ''}
      </div>`;
    });

    h += `<div class="ph">AYLIK BİLANÇO</div>`;
    for (const k of ['min','ene','yiy','ala','ara','etk']){
      const v = e.inc[k]||0;
      h += `<div class="row"><span><span class="flag" style="background:${RES[k].c}"></span> ${RES[k].n}</span>
            <b style="color:${v>=0?'#65e08a':'#ff5f6d'}">${sgn(v)}</b></div>`;
    }
    const away = G.fleets.filter(f=>f.e===0 && f.ships.length && !fleetInHome(e,f)).length;
    const homeF = G.fleets.filter(f=>f.e===0 && f.ships.length && fleetInHome(e,f)).length;
    h += `<div class="row"><span>Filo bakımı</span><b style="color:#ff5f6d">−${fleetUpkeep(e).toFixed(1)}</b></div>`;
    h += `<div class="mini">${homeF} filo sınır içinde (yarı bakım) · <span style="color:${away?'#ff9b3d':'#7d90ad'}">${away} filo dışarıda (tam bakım)</span></div>`;
    if (e.fleetAlloyUp > 0)
      h += `<div class="row"><span>Filo alaşım bakımı</span>
        <b style="color:#ff5f6d">−${e.fleetAlloyUp.toFixed(1)}</b></div>`;
    h += `<div class="row"><span>Yönetim maliyeti</span><b style="color:#ff5f6d">−${(e.adminCost||0).toFixed(1)}</b></div>`;
    h += `<div class="mini">${e.colonies.length} koloni · imparatorluk büyüdükçe bürokrasi yükü hızlanır</div>`;
    const tr = e.trade || {n:0, cap:8, cut:0, mul:0};
    h += `<div class="ph">TİCARET AĞI</div>`;
    h += `<div class="row"><span>Aktif bağlantı</span><b style="color:#6ff2c8">${tr.n} / ${tr.cap}</b></div>`;
    h += `<div class="bar"><i style="width:${clamp(tr.n/tr.cap*100,0,100)}%"></i></div>`;
    h += `<div class="row"><span>Enerji katkısı</span><b style="color:#65e08a">+%${Math.round(tr.mul*100)}</b></div>`;
    if (tr.vol) h += `<div class="row"><span>Taşınan hacim</span><b>${Math.round(tr.vol)}</b></div>`;
    {
      const eneBase = e.inc.ene || 0;
      const gainPct = Math.round((tr.mul||0) * 100);
      const eneGain = eneBase * (tr.mul||0) / Math.max(.0001, 1 + (tr.mul||0));
      h += `<div class="row"><span>Ticaret katkısı</span><b style="color:#65e08a">+%${gainPct} enerji</b></div>`;
      h += `<div class="mini">Kazanç kervan hedefe <b>vardığında</b> oluşur: kısa hatlar ayda
        daha çok sefer tamamlar, uzak ortaklar daha seyrek kazandırır.</div>`;
      if (tr.links && tr.links.length){
        const best = tr.links.filter(l=>!l.bl).sort((a,b)=>(b.yield||0)-(a.yield||0)).slice(0,3);
        if (best.length) h += `<div class="mini">En kârlı hatlar: ` + best.map(l=>
          `${esc(G.sys[l.a].name)}↔${esc(G.sys[l.b].name)} <span style="color:#f2d452">${
            ((l.trips||0)).toFixed(1)} sefer/ay</span>`).join(' · ') + `</div>`;
      }
    }
    if (tr.foreign) h += `<div class="row"><span>Dış ticaret</span><b style="color:#f2d452">${tr.foreign} yabancı liman</b></div>`;
    if (tr.raided) h += `<div class="mini" style="color:#ff5f6d">☠ ${tr.raided} rota yağmalandı — bir süre kapalı</div>`;
    const lx = Object.keys(e.luxury||{}).length;
    h += `<div class="row"><span>Lüks mal çeşidi</span><b style="color:#e0a8ff">${lx} / ${LUX_KEYS.length}</b></div>`;
    if (lx) h += `<div class="luxRow">` + Object.keys(e.luxury).map(k=>
      `<span class="luxChip ${(e.luxOwn&&e.luxOwn[k])?'have':'imp'}"><span style="color:${LUXURY[k].c}">${LUXURY[k].ico}</span>${LUXURY[k].n}</span>`).join('') + `</div>`;
    if (tr.cut) h += `<div class="mini" style="color:#ff5f6d">⚠ ${tr.cut} rota düşman kontrolünde kesik</div>`;
    else if (tr.n === 0) h += `<div class="mini">Ticaret için kolonilere <b>Ticaret Limanı</b> kur. Limanlar 3 sıçrama içinde birbirine bağlanır; diplomasiden ticaret anlaşması yaparak yabancı limanlara da bağlanabilirsin.</div>`;

    h += `<div class="ph">ÖZELLİKLER</div><div class="mini" style="line-height:1.8">`;
    const ms = e.mods, list = [];
    const show = {minMul:'Mineral',eneMul:'Enerji',yiyMul:'Yiyecek',alaMul:'Alaşım',araMul:'Araştırma',
      dmgMul:'Gemi hasarı',hullMul:'Gövde',shMul:'Kalkan',spdMul:'Filo hızı',growMul:'Nüfus artışı',
      dipMul:'İkna',buildMul:'İnşa hızı',eDmgMul:'DÜŞMAN hasarı',eShMul:'DÜŞMAN kalkanı'};
    for (const k in show) if (Math.abs(ms[k])>.001)
      list.push(`<span style="color:${ms[k]>0?(k.startsWith('e')&&k.length>6?'#6ff2c8':'#65e08a'):'#ff5f6d'}">${show[k]} ${ms[k]>0?'+':''}%${Math.round(ms[k]*100)}</span>`);
    if (ms.habFlat) list.push(`<span style="color:#65e08a">Yaşanabilirlik +%${ms.habFlat}</span>`);
    if (ms.etkFlat) list.push(`<span style="color:#65e08a">Etki +${ms.etkFlat}</span>`);
    h += list.join(' · ') + `</div>`;

    h += `<div class="ph">KOLONİLER</div>`;
    if (!e.colonies.length) h += `<div class="empty">Koloni yok.</div>`;
    e.colonies.forEach(c=>{
      const sys = G.sys[c.s], pl = sys.planets[c.p];
      if (!pl.col) return;
      h += `<div class="pchip" data-a="selsys" data-x="${sys.id}">
        ${planetOrb(pl.t, pl.seed, 26)}
        <div class="pi"><div class="pn">${esc(pl.name)}</div>
        <div class="pm">${PLANETS[pl.t].n} · nüfus ${Math.floor(pl.col.pop)}</div></div></div>`;
    });

    h += `<div class="ph">GÜNLÜK</div>`;
    const lg = G.log.slice(-14).reverse();
    h += lg.length ? lg.map(l=>`<div class="mini" style="padding:3px 0;border-bottom:1px solid #182338">${esc(l.m)}</div>`).join('')
                   : `<div class="mini">Kayıt yok.</div>`;
    h += `<div class="act2" style="margin-top:12px"><button class="abtn" data-a="save">KAYIT MENÜSÜ</button></div>`;
    return h;
  },


  /* ---------- eylemler ---------- */
  setColonyFocus(x){
    const [sid, pi, k] = x.split(':');
    const sys = G.sys[+sid], pl = sys.planets[+pi];
    if (setFocus(G.p, sys, pl, k)) say(esc(pl.name) + ' odağı: ' + FOCUS[k].n);
    else if ((pl.col && pl.col.fcd) > 0) say('Odak henüz değiştirilemez');
    this.keepScroll = true; this.refresh();
  },
  build(x){
    const [sid,pi,k] = x.split(':');
    const sys = G.sys[+sid], pl = sys.planets[+pi];
    if (queueBuilding(G.p, sys, pl, k)){
      const gun = (typeof buildDays === 'function') ? buildDays(G.p, k) : 0;
      say(BUILDINGS[k].n + ' kuyruğa alındı — ' + pl.name +
          ' · ~' + Math.ceil(gun / 30) + ' ay');
    }
    this.keepScroll = true; this.refresh();
  },
  demolish(x){
    const [sid, pi, k] = x.split(':');
    const sys = G.sys[+sid], pl = sys.planets[+pi];
    if (typeof queueDemolish === 'function' && queueDemolish(G.p, sys, pl, k)){
      const gun = demolishDays(G.p, k);
      say(BUILDINGS[k].n + ' yıkım emri verildi — ~' + Math.ceil(gun / 30) + ' ay');
    } else {
      say('Bu bina yıkılamıyor', 'war');
    }
    this.keepScroll = true; this.refresh();
  },
  cancelBuild(x){
    const [sid, pi, qi] = x.split(':');
    const sys = G.sys[+sid], pl = sys.planets[+pi];
    if (typeof cancelBuild === 'function') cancelBuild(G.p, sys, pl, +qi);
    this.keepScroll = true; this.refresh();
  },
  buildShip(x){
    const [sid,k] = x.split(':');
    /* ═══ FAZ 47: DONANMA UYKUSU UYARISI ═══
       Kasa alaşımı 500 altına düştüğünde ya da filo kapasitesi
       %90'ı aştığında oyuncuyu uyar — inşa yine de yapılabilir,
       ama körlemesine değil. */
    const e = G.p;
    const kul = (typeof fleetUsage === 'function') ? fleetUsage(e) : 0;
    const kap = Math.max(1, Math.round(e.cap || 1));
    const doluluk = kul / kap;
    if ((e.res.ala || 0) < 500)
      say('⚠ Alaşım stoğu düşük (' + Math.round(e.res.ala) + ') — inşa ekonomiyi zorlayacak', 'war');
    else if (doluluk >= .90)
      say('⚠ Filo kapasitesi %' + Math.round(doluluk*100) + ' dolu — aşımda bakım fırlar', 'war');
    if (queueShip(e, G.sys[+sid], k)) say(SHIPS[k].n + ' tezgâha kondu');
    this.keepScroll = true; this.refresh();
  },
  setTech(x){
    const [b,id] = x.split(':');
    G.p.rq[b] = id; G.p.rp[b] = 0;
    this.refresh();
  },
  doColonizeOrder(x0){
    const x = typeof x0 === 'string' ? x0 : String(x0);
    const [sid,pi] = x.split(':').map(Number);
    const sys = G.sys[sid], pl = sys.planets[pi];
    const pool = G.fleets.filter(f => f.e===0 && f.ships.length && fleetHasRole(f,'koloni'));
    let f = null;
    if (View.sel && pool.includes(View.sel)) f = View.sel;              // seçili gemi
    if (!f) f = pool.find(x => x.sys === sid);                           // zaten oradaki
    if (!f && pool.length){                                              // en yakın
      f = pool.slice().sort((a,b)=>{
        const pa = a.sys>=0 ? G.sys[a.sys] : {x:a.x, y:a.y};
        const pb = b.sys>=0 ? G.sys[b.sys] : {x:b.x, y:b.y};
        return dist(pa, sys) - dist(pb, sys);
      })[0];
    }
    if (!f){ say('Koloni gemisi yok'); return; }
    if (f.sys === sid){
      if (canColonize(G.p, sys, pl)){
        doColonize(G.p, sys, pl);
        f.ships = f.ships.filter(s=>s.c!=='kol');
        if (!f.ships.length){ G.fleets = G.fleets.filter(x=>x!==f); View.sel = null; }
      }
    } else {
      orderMove(f, sid);
      f.ord = {t:'kol', s:sid, p:pi};
      View.sel = f;
      say(esc(f.name) + ' → ' + pl.name);
    }
    this.refresh();
  },
  mergeFleets(){
    const f = View.sel; if (!f || f.sys<0) return;
    const grp = fleetGroup(f);
    const others = G.fleets.filter(x=>x!==f && x.e===0 && x.sys===f.sys && fleetGroup(x)===grp);
    if (!others.length){
      say(grp === 'sav' ? 'Bu sistemde birleşecek başka savaş filosu yok'
                        : 'Bu sistemde birleşecek başka sivil filo yok');
      return;
    }
    others.forEach(o=>{ f.ships.push(...o.ships); if(o.ord&&!f.ord) f.ord=o.ord; });
    G.fleets = G.fleets.filter(x=>x===f || !others.includes(x));
    say('Filolar birleşti — ' + f.ships.length + ' gemi');
    this.refresh();
  },
  splitFleet(){
    const f = View.sel; if (!f || f.ships.length<2 || f.sys<0) return;
    const half = f.ships.splice(0, Math.floor(f.ships.length/2));
    const nf = newFleet(G.p, f.sys, half.map(s=>({c:s.c})));
    half.forEach((s,i)=>nf.ships[i].h = s.h);
    say('Filo ayrıldı');
    this.refresh();
  },
  diploAct(kind, id){
    const e = G.p, o = G.emps[id];
    const dipMul = 1 + e.mods.dipMul;
    if (kind === 'war'){ this.warGoalMenu(o.id); return; }
    else if (kind === 'peace'){
      if (!canPeace(e,o)){
        say(hasCivic(e,'blood') ? 'Kan Hukuku barışı yasaklar' : 'Bu imparatorlukla barış mümkün değil', 'war');
        return;
      }
      if (e.res.etk < 30){ say('Yetersiz etki'); return; }
      e.res.etk -= 30;
      let chance = clamp(.25*dipMul + (totalPower(e)/(totalPower(o)+1)-1)*.25, .05, .95);
      if (peaceAlwaysAccepted(e, o)) chance = 1;      // Barış Doktrini
      if (rnd() < chance) makePeace(e,o);
      else say(o.name + ' barışı reddetti', 'war');
    } else if (kind === 'ally'){
      if (!canAlly(e,o)){ say('Sürgün doktrini ittifakı yasaklar', 'war'); return; }
      let cost = hasCivic(e,'allyCheap') ? 55 : 90;
      if (sharedFoe(e, o)) cost = Math.round(cost * .5);
      if (e.res.etk < cost){ say('Yetersiz etki'); return; }
      if (RACES[o.race].dip <= .05){ say(o.name + ' ittifak kavramını tanımıyor', 'war'); return; }
      e.res.etk -= cost;
      let chance = clamp((e.rel[o.id]+40)/130 * dipMul, .05, .95);
      if (sharedFoe(e, o)) chance = clamp(chance * 2, .1, .97);
      if (rnd() < chance){
        if (e.war[o.id] || o.war[e.id]){
          e.war[o.id] = false; o.war[e.id] = false;
          if (typeof resolveProxyWars === 'function') resolveProxyWars(e, o);
        }
        e.ally[o.id] = true; o.ally[e.id] = true;
        e.rel[o.id] = Math.max(e.rel[o.id], 55); o.rel[e.id] = Math.max(o.rel[e.id], 55);
        say('İTTİFAK KURULDU — ' + o.name, 'win');
      } else say(o.name + ' ittifakı reddetti');
    } else if (kind === 'pact'){
      if (!canPact(e, o)){ say('Bu imparatorlukla ticaret mümkün değil', 'war'); return; }
      if (e.res.etk < 40){ say('Yetersiz etki'); return; }
      e.res.etk -= 40;
      const chance = clamp(.35 * dipMul + (e.rel[o.id]+50)/220, .1, .95);
      if (rnd() < chance){
        makePact(e, o);
        const pv = pactValue(e, o);
        say('TİCARET ANLAŞMASI — ' + o.name + (pv && pv.links ? ' (+%' + pv.enePct + ' enerji)' : ''), 'win');
        if (pv && !pv.links)
          say('Uyarı: bağlantı yok — kolonilerine Ticaret Limanı kur', 'war');
      }
      else say(o.name + ' ticaret teklifini reddetti (ilişki ' + Math.round(e.rel[o.id]) + ')');
    } else if (kind === 'unpact'){
      breakPact(e, o);
      e.rel[o.id] = clamp(e.rel[o.id] - 10, -100, 100);
      say('Ticaret anlaşması feshedildi');
    } else if (kind === 'gift'){
      if (e.res.min < 200){ say('Yetersiz mineral'); return; }
      e.res.min -= 200;
      const g = Math.round(14*dipMul);
      e.rel[o.id] = clamp(e.rel[o.id]+g,-100,100);
      o.rel[e.id] = clamp(o.rel[e.id]+g,-100,100);
      say(o.name + ' hediyeyi kabul etti (+' + g + ' ilişki)');
    }
    this.refresh();
  },

  /* ---------- olay giriş noktaları (bildirim üretir) ---------- */
  chain(id){
    const c = CHAINS[id];
    if (!c) return;
    this.notify({kind:'chain', data:id, ico:'📖', cls:'sci', pause:true,
      title:c.n, sub:(c.t||'').slice(0,64) + '…', key:'chain:'+id});
  },
  event(ev){
    /* ═══ FAZ 47: OTOMATİK OLAY ÇÖZÜCÜ ═══
       Yalnız KÜÇÜK olaylar (ekonomi, minör anomali/kalıntı).
       Kriz, savaş ve zincir olayları daima oyuncuya sorulur.
       Seçim ölçütü: risk kelimesi içermeyen, en az kaynak
       harcayan şık. */
    if (AUTO_EVENT && ev && ev.ch && ev.ch.length && autoSolvable(ev)){
      const sec = safestChoice(ev);
      if (sec >= 0){
        const r = ev.ch[sec].f ? ev.ch[sec].f(G, rnd) : '';
        say('📜 [' + ev.n + ']: ' + ev.ch[sec].t +
            (ev.ch[sec].d ? ' (' + ev.ch[sec].d + ')' : ''), 'sci');
        if (typeof recalcMods === 'function') recalcMods(G.p);
        return;
      }
    }
    this.notify({kind:'event', data:ev, ico:'❗', pause:true,
      title:ev.n, sub:(ev.t||'').slice(0,64) + '…', key:'ev:'+ev.id});
  },
  anomaly(a, sys){
    /* ═══ FAZ 47: OTOMATİK ÇÖZÜM — MİNÖR ANOMALİLER ═══
       ÖLÇÜM: kategoriler (dogal/sinyal/kalinti/megayapi) EVENTS'te
       değil ANOMALIES dizisindeymiş; ilk yazdığım kanca yanlış
       akıştaydı. Megayapı anomalileri stratejik olduğu için
       daima oyuncuya sorulur. */
    if (AUTO_EVENT && a && a.ch && a.ch.length && autoSolvable(a)){
      const sec = safestChoice(a);
      if (sec >= 0){
        const r = a.ch[sec].f ? a.ch[sec].f(G, rnd) : '';
        say('📜 [' + a.n + ']: ' + a.ch[sec].t +
            (a.ch[sec].d ? ' (' + a.ch[sec].d + ')' : ''), 'sci');
        if (typeof recalcMods === 'function') recalcMods(G.p);
        return;
      }
    }
    this.notify({kind:'anomaly', data:{a, sys}, ico:'🔬', cls:'sci', pause:true,
      title:'Anomali — ' + sys.name, sub:a.n, key:'an:'+sys.id});
  },
  peaceOffer(o){
    // savaş bölünmesin: duraklatmaz, sadece bildirir
    this.notify({kind:'peace', data:o.id, ico:'🕊', cls:'war', pause:false,
      title:'Ateşkes teklifi', sub:o.name + ' savaşı bitirmek istiyor', key:'peace:'+o.id});
  },
  facDemand(f){
    const F = FACTIONS[f.k];
    this.notify({kind:'facdem', data:f.k, ico:F.ico, cls:'war', pause:false,
      title:F.n + ' talep iletti', sub:f.demand.txt, key:'fd:'+f.k});
  },
  facDemandOpen(key){
    const e = G.p;
    const f = (e.factions||[]).find(x=>x.k===key);
    if (!f || !f.demand) return;
    const F = FACTIONS[f.k];
    this.openModal(
      `<div class="mhd"><span>${F.ico} ${F.n}</span></div>
       <div class="mbd"><div class="lead">${esc(f.leader)}: "Sabrımız tükeniyor. ${f.demand.txt}."</div>
       <div class="row"><span>Fraksiyon gücü</span><b style="color:${F.col}">%${f.pow}</b></div>
       <div class="row"><span>Memnuniyet</span><b style="color:#ff5f6d">${Math.round(f.mood)}</b></div>
       <div class="row"><span>Süre</span><b>${f.demand.left} ay</b></div>
       <div class="mini" style="margin-top:8px">Karşılarsan +18 memnuniyet; karşılamazsan −14.
       Bu fraksiyonu görmezden gelmek diğerlerini güçlendirir — bir seçim, ceza değil.</div></div>
       <div class="mft"><button class="ch" data-a="closem"><div class="cht">Anlaşıldı</div></button></div>`, 'war');
  },
  facCoup(f, label){
    const F = FACTIONS[f.k];
    this.notify({kind:'faccoup', data:label, ico:'🔥', cls:'war', pause:true,
      title:'İÇ DARBE — ' + F.n, sub:'Yönetim ' + label + ' çizgiye kaydı', key:'coup:'+G.day});
  },
  facCoupOpen(label){
    this.openModal(
      `<div class="mhd"><span>🔥 İÇ DARBE</span></div>
       <div class="mbd"><div class="lead">Kızgın ve güçlü bir fraksiyon yönetimi ele geçirdi.
       İmparatorluğun ideolojisi zorla <b>${esc(label)}</b> çizgiye kaydı.</div>
       Etik eksenlerin değişti — yeteneklerin ve modifikatörlerin farklı olabilir.
       DEVLET panelinden yeni durumunu gözden geçir.</div>
       <div class="mft"><button class="ch" data-a="closem"><div class="cht">Kabul et</div></button></div>`, 'war');
  },
  crisisWarn(year){
    this.notify({kind:'criswarn', data:year, ico:'🔮', cls:'sci', pause:true,
      title:'KEHANET', sub:'Yıl ' + year + ' civarı galaksiye bir tehdit gelecek', key:'cw'});
  },
  crisisWarnOpen(year){
    this.openModal(
      `<div class="mhd"><span>🔮 KRİZ KEHANETİ</span></div>
       <div class="mbd"><div class="lead">Kâhinlerimiz galaksinin dışından yaklaşan bir şey
       görüyor. Yıl <b>${year}</b> civarında gelecek.</div>
       Bu bilgi sende ve yalnızca sende. Donanmanı hazırlamak, kaleler kurmak ve
       düşmanlarınla barışmak için zamanın var.</div>
       <div class="mft"><button class="ch" data-a="closem"><div class="cht">Hazırlanmaya başla</div></button></div>`, 'sci');
  },
  crisisPhase(stage){
    const t = stage === 1 ? 'HİÇLİK SÜRÜSÜ GÖRÜLDÜ'
            : stage === 2 ? 'İSTİLA BÜYÜYOR' : 'ANA DALGA GELDİ';
    this.notify({kind:'crisis', data:stage, ico:'🌋', cls:'war', pause:true,
      title:t, sub:'Aşama ' + stage + ' · galaksi tehdit altında', key:'cr'+stage});
  },
  crisisOpen(stage){
    const c = G.crisis || {};
    const foes = G.fleets.filter(f => f.e === G.crisisId).length;
    const pow = G.fleets.filter(f => f.e === G.crisisId)
                        .reduce((a,f)=>a+fleetPower(f), 0);
    const txt = stage === 1
      ? 'Galaksinin kenarında tanımlanamayan filolar belirdi. Hiçbir imparatorluğa ait değiller ve durmuyorlar.'
      : stage === 2
      ? 'Sürü büyüyor. Sınır sistemleri düşmeye başladı. Bu artık bir keşif değil, istila.'
      : 'Ana dalga geldi. Bu güç tek bir imparatorluğun kaldırabileceğinden fazla.';
    this.openModal(
      `<div class="mhd"><span>🌋 GALAKTİK KRİZ · AŞAMA ${stage}</span></div>
       <div class="mbd"><div class="lead">${txt}</div>
       <div class="row"><span>Düşman filosu</span><b style="color:#ff5f6d">${foes} filo · ${fmt(pow)} güç</b></div>
       <div class="row"><span>Senin gücün</span><b>${fmt(totalPower(G.p))}</b></div>
       <div class="mini" style="margin-top:8px">Kriz süresince tüm imparatorluklar barışa çok
       daha isteklidir. Federasyonlar acil savunma oylaması başlatır. En çok katkı yapan
       imparatorluk kriz sonunda büyük ödül alır.</div></div>
       <div class="mft">
         <button class="ch" data-a="crisDiplo"><div class="cht">Diplomasi panelini aç</div>
           <div class="chd">Düşmanlarınla acil barış yap</div></button>
         <button class="ch" data-a="closem"><div class="cht">Savaşa hazırlan</div></button>
       </div>`, 'war');
    this._hook('crisDiplo', ()=>{ this.closeModal(); this.openDiplo(); });
  },
  crisisEnd(winner){
    const me = winner && winner.id === 0;
    this.notify({kind:'crisend', data:winner?winner.id:-1, ico:'🏆', cls:'win', pause:true,
      title:'KRİZ SONA ERDİ', sub:winner ? (me?'En büyük katkı senin':winner.name+' öne çıktı') : 'Galaksi hayatta kaldı', key:'ce'});
  },
  crisisEndOpen(wid){
    const w = G.emps[wid];
    const me = wid === 0;
    this.openModal(
      `<div class="mhd"><span>🏆 KRİZ SONA ERDİ</span></div>
       <div class="mbd"><div class="lead">Hiçlik Sürüsü kırıldı. Galaksi hayatta kaldı.</div>
       ${w ? `<b style="color:${w.col}">${esc(w.name)}</b> en büyük katkıyı yaptı ve
         +600 etki, +1200 araştırma, +900 alaşım ve kalıcı +%10 gemi hasarı kazandı.
         ${me?'<br><br>Bu sensin — galaksi borcunu biliyor.':''}`
          : 'Kimse öne çıkmadı; zafer paylaşıldı.'}</div>
       <div class="mft"><button class="ch" data-a="closem"><div class="cht">Devam et</div></button></div>`, 'win');
  },
  warDeclared(foe){
    this.notify({kind:'wardec', data:foe.id, ico:'⚔', cls:'war', pause:false,
      title:'SAVAŞ İLAN EDİLDİ', sub:foe.name + ' sana savaş açtı', key:'wd:'+foe.id});
  },
  warDecOpen(id){
    const o = G.emps[id];
    if (!o) return;
    const mine = totalPower(G.p), theirs = totalPower(o);
    this.openModal(
      `<div class="mhd"><span>⚔ SAVAŞ İLANI</span></div>
       <div class="mbd"><div class="lead">${esc(o.name)} imparatorluğu sana savaş ilan etti.</div>
       <div class="row"><span>Onun filo gücü</span><b style="color:${theirs>mine?'#ff5f6d':'#65e08a'}">${fmt(theirs)}</b></div>
       <div class="row"><span>Senin filo gücün</span><b>${fmt(mine)}</b></div>
       <div class="row"><span>Sınır sistemleri</span><b>${G.sys.filter(sy=>sy.owner===o.id &&
         sy.lanes.some(l=>G.sys[l].owner===0)).length}</b></div>
       <div class="mini" style="margin-top:8px">Sınır sistemlerinde garnizon odağına geçmek ve
       kale kurmak savunmanı hızla güçlendirir.</div></div>
       <div class="mft">
        <button class="ch" data-a="wdDiplo"><div class="cht">Diplomasi panelini aç</div>
          <div class="chd">Müzakere ile savaşı erken bitirmeyi dene</div></button>
        <button class="ch" data-a="closem"><div class="cht">Anlaşıldı</div></button>
       </div>`, 'war');
    this._hook('wdDiplo', ()=>{ this.closeModal(); this.openDiplo(); });
  },
  borderEvent(other, len){
    this.notify({kind:'border', data:{id:other.id, len}, ico:'🚧', cls:'war', pause:true,
      title:'Sınır olayı', sub:other.name + ' devriyeleri sınırda', key:'bd:'+other.id});
  },

  /* ---------- BİLDİRİM KUTUSU ----------
     Olaylar artık ekrana fırlamıyor. Üstte tıklanabilir bir kart
     belirir; oyuncu hazır olduğunda açar. Önemli olaylar oyunu
     duraklatır, küçük bildirimler oyunu bölmez. */
  notify(item){
    G.inbox = G.inbox || [];
    if (item.key && G.inbox.some(x => x.key === item.key)) return;
    item.uid = (G.inboxUid = (G.inboxUid || 0) + 1);
    item.born = G.day;
    G.inbox.push(item);
    // kutu şişmesin: en eski duraklatmayan bildirimler düşer
    while (G.inbox.length > 6){
      const i = G.inbox.findIndex(x => !x.pause);
      G.inbox.splice(i >= 0 ? i : 0, 1);
    }
    if (item.pause && G.speed > 0){
      this.prePause = G.speed;
      this.setSpeed(0);
    }
    this.drawInbox();
  },
  drawInbox(){
    const box = $('inbox');
    if (!box) return;
    const list = G.inbox || [];
    if (!list.length){ box.innerHTML = ''; box.classList.add('hidden'); return; }
    box.classList.remove('hidden');
    box.innerHTML = list.map(it =>
      `<button class="nCard ${it.cls||''}" data-a="openNote" data-x="${it.uid}">
         <span class="nIco">${it.ico||'✉'}</span>
         <span class="nTxt"><b>${esc(it.title)}</b><i>${esc(it.sub||'')}</i></span>
         <span class="nGo">›</span>
       </button>`).join('');
  },
  openNote(uid){
    const list = G.inbox || [];
    const i = list.findIndex(x => x.uid === +uid);
    if (i < 0) return;
    const it = list[i];
    list.splice(i, 1);
    this._openNote = it;               // geri koyabilmek için sakla
    this.drawInbox();
    switch(it.kind){
      case 'chain':   this.chainOpen(it.data); break;
      case 'event':   this.eventOpen(it.data); break;
      case 'anomaly': this.anomalyOpen(it.data.a, it.data.sys); break;
      case 'peace':   this.peaceOpen(G.emps[it.data]); break;
      case 'border':  this.borderOpen(G.emps[it.data.id], it.data.len); break;
      case 'fedvote': this.fedVoteOpen(it.data); break;
      case 'wardec':  this.warDecOpen(it.data); break;
      case 'facdem':  this.facDemandOpen(it.data); break;
      case 'faccoup': this.facCoupOpen(it.data); break;
      case 'criswarn': this.crisisWarnOpen(it.data); break;
      case 'crisis':   this.crisisOpen(it.data); break;
      case 'crisend':  this.crisisEndOpen(it.data); break;
      case 'cncvote':  this.councilVoteOpen(); break;
      case 'cncnew':   this.councilNewOpen(it.data); break;
      case 'aideal':  this.aiDealOpen(it.data); break;
    }
  },

  /* Açık olan olayı bildirim kuyruğuna geri koyar — oyuncu haritaya
     bakıp sonra karara dönebilsin diye. Oyun duraklı kalır. */
  stashNote(){
    const it = this._openNote;
    this._openNote = null;
    if (!it) return false;
    G.inbox = G.inbox || [];
    if (!G.inbox.some(x => x.uid === it.uid)) G.inbox.push(it);
    this.drawInbox();
    return true;
  },

  /* ═══════════════════════════════════════════════════════════════
     FAZ 12 — OLAY PENCERESİ KÜÇÜLTME
     Pencere kapanmaz, ÜST BARA rozet olarak iner. Harita serbestçe
     incelenebilir; rozete dokununca pencere aynen geri açılır.
     Mevcut stashNote/openNote akışını yeniden kullanır — yeni bir
     pencere sistemi kurulmaz. Oyun duraklı kalır.
     ═══════════════════════════════════════════════════════════════ */
  minimizeModal(){
    const it = this._openNote;
    /* Bildirim kaynaklı olay: kuyruğa geri koy ve rozet olarak işaretle */
    if (it){
      this._openNote = null;
      G.inbox = G.inbox || [];
      if (!G.inbox.some(x => x.uid === it.uid)) G.inbox.push(it);
      G.minNote = it.uid;
    } else {
      /* Bildirimsiz modal (ör. doğrudan açılan bir karar penceresi):
         ham HTML saklanır, rozetten aynen geri getirilir. */
      const box = $('modal').firstElementChild;
      G.minRaw = box ? {html: box.innerHTML, cls: box.className.replace('mbox','').trim()} : null;
      if (!G.minRaw) return false;
      G.minNote = '_raw';
    }
    $('modal').className = 'hidden';
    $('modal').innerHTML = '';
    this.topbar();
    say('Olay küçültüldü — üst bardaki rozetten geri açabilirsin');
    return true;
  },

  restoreModal(){
    if (!G.minNote) return false;
    if (G.minNote === '_raw' && G.minRaw){
      const r = G.minRaw;
      G.minNote = null; G.minRaw = null;
      this.openModal(r.html, r.cls, true);
      this.topbar();
      return true;
    }
    const uid = G.minNote;
    G.minNote = null;
    this.topbar();
    /* openNote modalı yeniden kurar ve kuyruktan düşürür */
    if (typeof this.openNote === 'function'){ this.openNote(uid); return true; }
    return false;
  },

  /* ---------- modaller ---------- */
  /* ═══ FAZ 31: PİKSEL GÖRSELLİ OLAY PENCERESİ ═══
     Üç kritik olay için 128×128 sembol. Görsel modal açıldıktan
     sonra tek seferlik çizilir; kare döngüsüne yük binmez. */
  eventModal(art, baslik, metin, cls){
    const h = `<div class="mhd"><span>${esc(baslik)}</span></div>
      <div class="mbd">
        <div class="evArt"><canvas id="eventCanvas" width="128" height="128"></canvas></div>
        <div class="lead" style="text-align:center">${metin}</div>
      </div>
      <div class="mft">
        <button class="ch" data-a="closem"><div class="cht">Anlaşıldı</div></button>
      </div>`;
    this.openModal(h, cls || 'war', true);
    /* Canvas DOM'a girdikten sonra çiz */
    setTimeout(()=>{
      try {
        const cv = $('eventCanvas');
        if (cv && ART.drawPixelArt) ART.drawPixelArt(cv.getContext('2d'), art, 128);
      } catch(err){}
    }, 0);
  },

  openModal(html, cls, stashable, art){
    /* FAZ 19: pencere türüne göre giriş sesi */
    if (typeof AUDIO !== 'undefined'){
      try { AUDIO.play(cls === 'war' ? 'alarm' : 'event'); } catch(err){}
    }
    this.modalPrevSpeed = G.speed;
    this.setSpeed(0);
    $('modal').className = '';
    // stashable modaller köşeden kapatılıp bildirime geri konabilir
    /* FAZ 12: köşedeki tuş artık pencereyi YOK ETMEZ, üst bara indirir */
    const extra = stashable
      ? `<button class="mClose" data-a="minModal" title="Küçült — üst bara indir">▁</button>` : '';
    /* ═══ FAZ 31: OLAY PİKSEL SANATI ═══
       art anahtarı verilirse pencerenin üstüne 128×128 canvas
       eklenir ve matris fillRect ile çizilir. Görsel dosya yok. */
    const sanat = (art && typeof ART !== 'undefined' && ART.PIXEL_ART && ART.PIXEL_ART[art])
      ? `<div class="evArt"><canvas id="eventCanvas" width="128" height="128"></canvas></div>` : '';
    $('modal').innerHTML = `<div class="mbox ${cls||''}">${extra}${sanat}${html}</div>`;
    if (sanat){
      const cv = $('eventCanvas');
      if (cv){
        try {
          const g = cv.getContext('2d');
          g.imageSmoothingEnabled = false;
          const A = ART.PIXEL_ART[art];
          ART.drawPixelArt(g, A.m, A.c, 128, 128);
        } catch(err){}
      }
    }
  },
  /* FAZ 31: Kritik olaylar için görselli pencere açar. Zaten bir
     modal açıksa üstüne binmez — oyuncunun kararını bölmeyiz. */
  eventArt(art, baslik, metin, cls){
    /* ═══════════════════════════════════════════════════════════
       FAZ 58 — AKILLI FİLTRE (VARSAYILAN: GEÇME)
       ÖLÇÜM: eventArt'ın 17 çağrı noktasının TAMAMI casusluk,
       diplomasi ya da kriz bildirimi çıktı. Rastgele olaylar ve
       anomaliler bu fonksiyondan hiç geçmiyor — onlar UI.event()
       ve UI.anomaly() üzerinden akıyor.
       Yani Faz 57'de buraya koyduğum bastırma kısmen değil,
       BAŞTAN SONA yanlıştı: kritik bildirimleri susturuyordu.

       Yeni kural VARSAYILAN-REDDET: bir bildirim ancak beşinci
       parametreyle açıkça 'siradan' işaretlenirse geçilebilir.
       Böylece ileride eklenecek yeni çağrı noktaları da yanlışlıkla
       susturulmaz — unutulursa kritik sayılır. */
    const kat = arguments.length > 4 ? arguments[4] : 'kritik';
    if (kat === 'siradan' && typeof AUTO_EVENT !== 'undefined' && AUTO_EVENT){
      const ozet = String(metin || '').replace(/\s+/g, ' ').trim();
      say('📜 ' + baslik + (ozet ? ' — ' + ozet.slice(0, 110) +
          (ozet.length > 110 ? '…' : '') : ''), cls || 'sci');
      return;
    }
    if (!$('modal').className.includes('hidden') && $('modal').innerHTML) return;
    this.openModal(
      `<div class="mhd"><span>${esc(baslik)}</span></div>
       <div class="mbd"><div class="lead">${esc(metin)}</div></div>
       <div class="mft"><button class="ch" data-a="closem">
         <div class="cht">Anlaşıldı</div></button></div>`,
      cls || 'war', true, art);
  },
  closeModal(){
    $('modal').className = 'hidden';
    $('modal').innerHTML = '';
    if (G.over) return;
    const back = this.prePause || this.modalPrevSpeed || 1;
    this.prePause = 0;
    this.setSpeed(back);
  },
  anomalyOpen(a, sys){
    this._an = {a, sys};
    this.openModal(
      `<div class="mhd"><span>ANOMALİ · ${esc(sys.name)}</span></div>
       <div class="mbd"><div class="lead">${a.t}</div><b>${a.n}</b></div>
       <div class="mft">${a.ch.map((c,i)=>
         `<button class="ch" data-a="anomch" data-x="${i}"><div class="cht">${c.t}</div><div class="chd">${c.d}</div></button>`
       ).join('')}</div>`, 'sci', true);
    this._hook('anomch', i=>{
      const res = a.ch[i].f(G, Math.random);
      this.openModal(`<div class="mhd"><span>SONUÇ</span></div><div class="mbd">${res}</div>
        <div class="mft"><button class="ch" data-a="closem"><div class="cht">Kapat</div></button></div>`,'sci');
      this.refresh();
    });
  },
  /* olay metnindeki {KOLONI} {SISTEM} {IRK} yer tutucularını doldur
     ve olayın geçtiği yeri haritada göstermek için hedef sakla */
  fillEventText(txt){
    const e = G.p;
    this.evTarget = null;
    const metin = String(txt);
    /* FAZ 12 DÜZELTMESİ: "Haritada Göster" metinde ADI GEÇEN yeri
       odaklamalı. Eskiden hedef daima rastgele bir KOLONİ sistemiydi;
       olay "{SISTEM}" anlatıyorsa buton bambaşka bir yere götürüyordu.
       Artık hangi yer adı kullanıldıysa hedef odur. */
    let colName = 'Bir', colSys = -1;
    if (e.colonies.length){
      const c = e.colonies[Math.floor(rnd()*e.colonies.length)];
      const pl = G.sys[c.s].planets[c.p];
      if (pl.col){ colName = pl.col.name || pl.name; colSys = c.s; }
    }
    let sysName = '—', namedSys = -1;
    const seen = G.sys.filter(sy => sy.seen.includes(0));
    if (seen.length){
      const sy = seen[Math.floor(rnd()*seen.length)];
      sysName = sy.name; namedSys = sy.id;
    }
    /* Öncelik: metin bir SİSTEM adı geçiriyorsa o, yoksa koloni */
    let sysId = metin.indexOf('{SISTEM}') >= 0 ? namedSys
              : metin.indexOf('{KOLONI}') >= 0 ? colSys
              : (colSys >= 0 ? colSys : namedSys);
    if (sysId < 0) sysId = (colSys >= 0 ? colSys : namedSys);
    let raceName = '—';
    const known = G.emps.filter(o=>!o.dead && !o.wild && o.id!==0 && e.contact[o.id]);
    if (known.length) raceName = known[Math.floor(rnd()*known.length)].name;
    this.evTarget = sysId;
    return metin
      .replace(/\{KOLONI\}/g, colName)
      .replace(/\{SISTEM\}/g, sysName)
      .replace(/\{IRK\}/g, raceName);
  },

  /* zincirleme hikâye olayı — seçim sonraki bölümü açabilir */
  chainOpen(id){
    const ev = CHAINS[id];
    if (!ev) return;
    const body = this.fillEventText(ev.t);
    const tgt = this.evTarget;
    this.openModal(
      `<div class="mhd"><span>${esc(ev.n)}</span></div>
       <div class="mbd"><div class="lead">${body}</div>
       ${tgt >= 0 ? `<button class="abtn" data-a="showEv" data-x="${tgt}" style="margin-top:8px">
         🔍 OLAYIN GEÇTİĞİ YERİ HARİTADA GÖSTER</button>` : ''}</div>
       <div class="mft">${ev.ch.map((c,i)=>
         `<button class="ch" data-a="chch" data-x="${i}"><div class="cht">${c.t}</div>
          <div class="chd">${c.d||''}</div></button>`
       ).join('')}</div>`, 'sci', true);
    this._hook('chch', i=>{
      const opt = ev.ch[i];
      if (!opt) return;
      let res = '';
      if (opt.f){ try { res = opt.f(G, rnd) || ''; } catch(err){ res = ''; } }
      if (opt.next && CHAINS[opt.next]){
        // devamı hemen açılmaz — birkaç ay sonra bildirim olarak gelir
        const wait = 60 + Math.floor(rnd()*120);          // 2-6 ay
        G.chainQueue = G.chainQueue || [];
        G.chainQueue.push({id: opt.next, at: G.day + wait});
        this.openModal(
          `<div class="mhd"><span>SONUÇ</span></div>
           <div class="mbd">${res || 'Karar uygulandı.'}</div>
           <div class="mft"><button class="ch" data-a="closem"><div class="cht">Kapat</div></button></div>`,'sci');
      } else {
        this.openModal(`<div class="mhd"><span>SONUÇ</span></div><div class="mbd">${res||'Karar uygulandı.'}</div>
          <div class="mft"><button class="ch" data-a="closem"><div class="cht">Kapat</div></button></div>`,'sci');
      }
      this.refresh();
    });
  },
  eventOpen(ev){
    const body = this.fillEventText(ev.t);
    const tgt = this.evTarget;
    this.openModal(
      `<div class="mhd"><span>OLAY</span></div>
       <div class="mbd"><div class="lead">${body}</div><b>${ev.n}</b>
       ${tgt >= 0 ? `<button class="abtn" data-a="showEv" data-x="${tgt}" style="margin-top:8px">
         🔍 HARİTADA GÖSTER</button>` : ''}</div>
       <div class="mft">${ev.ch.map((c,i)=>
         `<button class="ch" data-a="evch" data-x="${i}"><div class="cht">${c.t}</div><div class="chd">${c.d}</div></button>`
       ).join('')}</div>`, '', true);
    this._hook('evch', i=>{
      const res = ev.ch[i].f(G, Math.random);
      this.openModal(`<div class="mhd"><span>SONUÇ</span></div><div class="mbd">${res}</div>
        <div class="mft"><button class="ch" data-a="closem"><div class="cht">Kapat</div></button></div>`);
      this.refresh();
    });
  },
  borderOpen(other, len){
    const tense = len > 6;
    this.openModal(
      `<div class="mhd"><span>SINIR OLAYI</span></div>
       <div class="mbd"><div class="lead">${esc(other.name)} devriyeleri sınır bölgemizde görüldü.
       ${tense ? 'İki taraf da bu hattı kendi toprağı sayıyor ve gerginlik tırmanıyor.'
               : 'Küçük bir ihlal, ama halk huzursuz.'}</div>
       Sınırlarımız ${len} noktada birbirine değiyor. Bu temas her ay ilişkileri aşındırıyor.</div>
       <div class="mft">
         <button class="ch" data-a="bdBack"><div class="cht">Devriyeleri geri çek</div>
           <div class="chd">İlişki +12, ama halk zayıflık olarak görür: −10 etki</div></button>
         <button class="ch" data-a="bdStand"><div class="cht">Hattı savun</div>
           <div class="chd">İlişki −15, +20 etki. Sınır bölgende +1 ay garnizon coşkusu</div></button>
         <button class="ch" data-a="bdTreaty"><div class="cht">Sınır anlaşması öner</div>
           <div class="chd">60 etki — kabul edilirse bu komşuyla sürtüşme kalıcı olarak durur</div></button>
       </div>`, tense ? 'war' : '', true);
    this._hook('bdBack', ()=>{
      G.p.rel[other.id] = clamp(G.p.rel[other.id]+12, -100, 100);
      other.rel[0] = clamp(other.rel[0]+12, -100, 100);
      G.p.res.etk -= 10;
      this.closeModal(); this.refresh();
      say('Devriyeler geri çekildi', 'win');
    });
    this._hook('bdStand', ()=>{
      G.p.rel[other.id] = clamp(G.p.rel[other.id]-15, -100, 100);
      other.rel[0] = clamp(other.rel[0]-15, -100, 100);
      G.p.res.etk += 20;
      this.closeModal(); this.refresh();
      say('Sınır hattı savunuldu', 'war');
    });
    this._hook('bdTreaty', ()=>{
      if (G.p.res.etk < 60){ say('Yetersiz etki'); return; }
      G.p.res.etk -= 60;
      const chance = clamp(.30 + (G.p.rel[other.id]+60)/220 + G.p.mods.dipMul*.4, .1, .92);
      if (rnd() < chance){
        G.p.treaty = G.p.treaty || {};
        G.p.treaty[other.id] = true;
        other.treaty = other.treaty || {};
        other.treaty[0] = true;
        G.p.rel[other.id] = clamp(G.p.rel[other.id]+20, -100, 100);
        other.rel[0] = clamp(other.rel[0]+20, -100, 100);
        say('SINIR ANLAŞMASI imzalandı — ' + other.name, 'win');
      } else {
        say(other.name + ' anlaşmayı reddetti', 'war');
      }
      this.closeModal(); this.refresh();
    });
  },
  peaceOpen(o){
    this.openModal(
      `<div class="mhd"><span>BARIŞ TEKLİFİ</span></div>
       <div class="mbd"><div class="lead">${esc(o.name)} ateşkes istiyor. Elçileri sınırda bekliyor.</div>
       Savaş her iki tarafı da yıprattı. Kabul edersen sınırlar mevcut hâliyle donar.</div>
       <div class="mft">
         <button class="ch" data-a="pyes"><div class="cht">Barışı kabul et</div><div class="chd">Savaş sona erer</div></button>
         <button class="ch" data-a="pno"><div class="cht">Reddet</div><div class="chd">Savaş sürer</div></button>
       </div>`,'war');
    this._hook('pyes', ()=>{ makePeace(G.p,o); this.closeModal(); this.refresh(); });
    this._hook('pno', ()=>{ o.rel[0] -= 20; this.closeModal(); });
  },
  gameOver(){
    const w = G.over;
    const win = w.win;
    const W = w.type && WIN_TYPES[w.type] ? WIN_TYPES[w.type] : null;
    /* ═══ FAZ 50: SKOR TABLOSU ═══
       Dört sütun: askerî güç, teknoloji, ekonomi, casusluk.
       Her biri galaksi ortalamasına göre normalize edilir. */
    const skor = (typeof scoreCard === 'function') ? scoreCard(G.p) : null;
    let sk = '';
    if (skor){
      sk = `<div class="ph">SKOR DÖKÜMÜ</div><div class="gDef">`;
      skor.satir.forEach(r => {
        const yuzde = Math.min(100, Math.round(r.oran * 50));
        sk += `<div class="gRow">
          <span class="gIco" style="color:${r.c}">${r.ico}</span>
          <div class="gBarW"><div class="gBar" style="width:${yuzde}%;
            background:${r.c}"></div></div>
          <b style="color:${r.c}">${Math.round(r.v)}</b></div>
          <div class="mini" style="grid-column:1/-1;margin:-2px 0 3px">${r.n}
            · galaksi ortalamasının ${r.oran.toFixed(1)}katı</div>`;
      });
      sk += `</div><div class="row" style="margin-top:6px">
        <span>TOPLAM PUAN</span><b style="color:#6ff2c8">${Math.round(skor.toplam)}</b></div>`;
    }
    this.openModal(
      `<div class="mhd"><span>${win?'ZAFER':'OYUN BİTTİ'}${W?' · '+W.ico+' '+W.n:''}</span></div>
       <div class="mbd"><div class="lead">${w.txt}</div>
       <b style="color:${w.e.col}">${esc(w.e.name)}</b> galaksinin kaderini belirledi.<br>
       Yıl ${G.year}. ${win?'Senin adın yıldız haritalarına kazındı.':'Bir başkası tarihi yazdı.'}
       ${sk}</div>
       <div class="mft"><button class="ch" data-a="restart"><div class="cht">Ana menüye dön</div></button>
       <button class="ch" data-a="sandbox"><div class="cht">Galaksiyi yönetmeye devam et
         <small style="opacity:.7">Sandbox modu</small></div></button></div>`,
       win?'':'war');
  },
  saveMenu(){
    const auto = G.autoSave !== false;
    this.openModal(
      `<div class="mhd"><span>KAYIT</span></div>
       <div class="mbd" id="diagBox">Depolama sınanıyor…</div>
       <div class="mft">
        <button class="ch" data-a="dlsave"><div class="cht">📥 Dosyaya kaydet</div>
          <div class="chd">İndirilenler klasörüne .sav dosyası yazar — en güvenilir yöntem</div></button>
        <button class="ch" data-a="ulsave"><div class="cht">📤 Dosyadan yükle</div>
          <div class="chd">Daha önce indirdiğin .sav dosyasını seç</div></button>
        <button class="ch" data-a="dosave"><div class="cht">Cihaza kaydet</div>
          <div class="chd">Hızlı kayıt (tarayıcı izin veriyorsa kalıcı)</div></button>
        <button class="ch" data-a="doload"><div class="cht">Cihazdan yükle</div></button>
        <button class="ch" data-a="autotog"><div class="cht">Otomatik kayıt: ${auto?'AÇIK':'KAPALI'}</div>
          <div class="chd">Her yıl ve oyundan çıkarken dener</div></button>
        <button class="ch" data-a="doexport"><div class="cht">Metin olarak kopyala</div></button>
        <button class="ch" data-a="doimport"><div class="cht">Metinden yapıştır</div></button>
        <button class="ch" data-a="toTitle"><div class="cht">◂ Ana menüye dön</div>
          <div class="chd">Kaydetmeyi unutma — mevcut oyun bellekte kalmaz</div></button>
        <button class="ch" data-a="closem"><div class="cht">Kapat</div></button>
       </div>`);

    storageDiag().then(d=>{
      const box = $('diagBox');
      if (!box) return;
      const ok = d.host || d.local;
      box.innerHTML =
        `<div class="row"><span>Uygulama deposu</span><b style="color:${d.host?'#65e08a':'#7d90ad'}">${d.host?'çalışıyor':'yok'}</b></div>
         <div class="row"><span>Tarayıcı deposu</span><b style="color:${d.local?'#65e08a':'#ff5f6d'}">${d.local?'çalışıyor':'engelli'}</b></div>` +
        (ok ? `<div class="mini" style="color:#65e08a;margin-top:8px">Hızlı kayıt kalıcı olacak.</div>`
            : `<div class="mini" style="color:#ff9b3d;margin-top:8px">Bu adreste tarayıcı deposu kapalı${d.why?' — '+esc(d.why):''}.
               Tarayıcı JavaScript'i kendi klasörüne dosya yazamaz (güvenlik kuralı), bu yüzden
               <b style="color:#6ff2c8">Dosyaya kaydet</b> seçeneğini kullan.</div>`);
    });

    this._hook('dlsave', ()=>{
      const ok = downloadSave();
      say(ok ? 'Kayıt dosyası indirildi' : 'İndirme başarısız', ok?'win':'war');
      if (ok) this.closeModal();
    });
    this._hook('ulsave', ()=>{
      uploadSave(txt=>{
        if (!txt){ say('Dosya okunamadı'); return; }
        let ok = false;
        try { ok = deserialize(txt); } catch(e){ ok = false; }
        if (ok){ storeSet('yildiz:save', txt); this.closeModal(); this.refresh(); say('Kayıt dosyadan yüklendi', 'win'); }
        else say('Dosya geçerli bir kayıt değil', 'war');
      });
    });
    this._hook('autotog', ()=>{ G.autoSave = !(G.autoSave !== false); this.saveMenu(); });
    this._hook('dosave', ()=>{ saveGame().then(ok=>{
      this.openModal(`<div class="mhd"><span>KAYIT</span></div><div class="mbd">${ok?'Oyun kaydedildi.':'Kayıt yapılamadı.'}
        <div class="mini" style="margin-top:8px">Kalıcı olduğundan emin olmak için "Dosyaya kaydet"i kullan.</div></div>
      <div class="mft"><button class="ch" data-a="closem"><div class="cht">Kapat</div></button></div>`);
    }); });
    this._hook('doload', ()=>{ loadGame().then(ok=>{
      if (ok){ this.closeModal(); this.refresh(); say('Kayıt yüklendi'); }
      else this.openModal(`<div class="mhd"><span>KAYIT</span></div><div class="mbd">Kayıt bulunamadı.</div>
      <div class="mft"><button class="ch" data-a="closem"><div class="cht">Kapat</div></button></div>`);
    }); });
    this._hook('doexport', ()=>{
      const txt = serialize();
      this.openModal(
        `<div class="mhd"><span>YEDEK METNİ</span></div>
         <div class="mbd"><span style="font-size:11px;color:#7d90ad">Kutuya uzun bas, tümünü seç, kopyala.</span>
         <textarea id="expBox" readonly style="width:100%;height:150px;margin-top:8px;background:#05070f;
           color:#6ff2c8;border:1px solid #2b3c5c;font-family:var(--mono);font-size:9px;
           padding:6px;-webkit-user-select:text;user-select:text">${esc(txt)}</textarea></div>
         <div class="mft"><button class="ch" data-a="copyexp"><div class="cht">Panoya kopyala</div></button>
         <button class="ch" data-a="closem"><div class="cht">Kapat</div></button></div>`);
      this._hook('copyexp', ()=>{
        const b = $('expBox');
        if (b){ b.select(); try { document.execCommand('copy'); say('Panoya kopyalandı'); } catch(e){ say('Kopyalanamadı, elle seç'); } }
      });
    });
    this._hook('doimport', ()=>{
      this.openModal(
        `<div class="mhd"><span>YEDEĞİ GERİ YÜKLE</span></div>
         <div class="mbd"><textarea id="impBox" placeholder="yedek metnini buraya yapıştır" style="width:100%;height:150px;
           background:#05070f;color:#d7e3f4;border:1px solid #2b3c5c;font-family:var(--mono);font-size:9px;
           padding:6px;-webkit-user-select:text;user-select:text"></textarea></div>
         <div class="mft"><button class="ch" data-a="applyimp"><div class="cht">Yükle</div></button>
         <button class="ch" data-a="closem"><div class="cht">Vazgeç</div></button></div>`);
      this._hook('applyimp', ()=>{
        const b = $('impBox');
        const txt = b ? b.value.trim() : '';
        let ok = false;
        try { ok = txt && deserialize(txt); } catch(e){ ok = false; }
        if (ok){ storeSet('yildiz:save', txt); this.closeModal(); this.refresh(); say('Yedek yüklendi', 'win'); }
        else say('Metin okunamadı');
      });
    });
  },
  _hook(action, fn){
    if (!this._hooks) this._hooks = {};
    this._hooks[action] = fn;
    if (!this._hooked){
      this._hooked = true;
      document.body.addEventListener('click', e=>{
        const el = e.target.closest('[data-a]');
        if (!el) return;
        const f = this._hooks && this._hooks[el.dataset.a];
        if (f) f(+el.dataset.x || 0);
      });
    }
  },

  /* ---------- uyarılar ---------- */
  alert(msg, cls){
    const box = $('alerts');
    const d = document.createElement('div');
    d.className = 'alert ' + (cls||'');
    d.textContent = msg;
    box.appendChild(d);
    setTimeout(()=>{ d.style.transition='opacity .4s'; d.style.opacity=0;
      setTimeout(()=>d.remove(), 400); }, 4600);
    let guard = 0;
    while (box.childElementCount > 4 && guard++ < 12){
      const first = box.firstElementChild;
      if (!first) break;
      first.remove();
      if (box.firstElementChild === first) break;
    }
  },
  pulse(s){ View.boom(s.x, s.y); },
  checkOrient(){
    const bad = window.innerHeight > window.innerWidth * 1.05 && window.innerWidth < 620;
    $('rotate').classList.toggle('show', bad && !$('game').classList.contains('hidden'));
  },

  /* gezegen küçük resimlerini panelde çiz */
  paintSprites(){
    const pc = $('empPortrait');
    if (pc && !pc.dataset.done){
      pc.dataset.done = 1;
      const g = pc.getContext('2d');
      g.imageSmoothingEnabled = false;
      const spr = ART.portrait(G.p.look || 'humanoid', G.p.col, 3);
      const sc = Math.min(pc.width/spr.width, pc.height/spr.height) * .92;
      g.clearRect(0,0,pc.width,pc.height);
      g.drawImage(spr, (pc.width-spr.width*sc)/2, (pc.height-spr.height*sc)/2, spr.width*sc, spr.height*sc);
    }
    [...document.querySelectorAll('canvas.pspr')].forEach(c=>{
      if (c.dataset.done) return;
      c.dataset.done = 1;
      const spr = ART.planet(c.dataset.t, +c.dataset.s, 26);
      const g = c.getContext('2d');
      g.imageSmoothingEnabled = false;
      g.clearRect(0,0,c.width,c.height);
      g.drawImage(spr, 0, 0, c.width, c.height);
    });
  }
};
/* =====================================================================
   KURULUM MENÜSÜ + ANA DÖNGÜ
   ===================================================================== */
const CFG = {
  name:'Yeni Hanedan', race:'insan', traits:[], size:'orta',
  shape:'sarmal', diff:'normal', seed:(Math.random()*1e9)|0, color:null,
  ethics:{mil:0, aut:0, mat:0, ahl:0}, civics:[], origin:'standart',
  sigil:'simetrik', monoRes:'min', look:'humanoid', mizac:'yayilmaci',
  crisis:'normal', ruins:'orta', council:'normal',
  physio:'humanoid',                // FAZ 52: tür fizyolojisi
  pirates:true, gates:true, crisisPower:'normal'   // FAZ 53: galaksi anahtarları
};
/* ═══ FAZ 57: CFG.autoResolveEvents ═══
   Şartnamedeki ad. Tek gerçek kaynak AUTO_EVENT — bu bir takma ad,
   böylece iki yerde ayrı durum tutulup senkron kaçmıyor. */
Object.defineProperty(CFG, 'autoResolveEvents', {
  get(){ return typeof AUTO_EVENT !== 'undefined' ? AUTO_EVENT : false; },
  set(v){
    AUTO_EVENT = !!v;
    try { storeSet('yh_autoev', AUTO_EVENT ? 'on' : 'off'); } catch(e){}
  },
  configurable: true, enumerable: false
});
/* FAZ 9: hiyerarşi MİZAÇ → GÖRÜNÜŞ → istatistik detayları.
   Oyuncu önce "nasıl bir halkım?" sorusunu yanıtlar, sonra yüzünü
   görür, en sonda sayılarla uğraşır. */
const STEPS = [
  {k:'mizac',  n:'MİZAÇ'},
  {k:'goruns', n:'GÖRÜNÜŞ'},
  {k:'fizyo',  n:'🧬 FİZYOLOJİ'},   // FAZ 52
  {k:'tur',    n:'TÜR'},
  {k:'etik',   n:'ETİK'},
  {k:'civic',  n:'CIVIC'},
  {k:'koken',  n:'KÖKEN'},
  {k:'galaksi',n:'GALAKSİ'}
];
let SETUP_STEP = 'mizac';
function ethicSpent(){
  /* ═══ FAZ 52 DÜZELTMESİ ═══
     Faz 48'de dördüncü eksen (ahl — Dürüst/Sahtekâr) eklendi ama
     bütçe hesabına girmemişti: oyuncu o eksende BEDAVA puan
     harcayabiliyordu. Ölçümde 1+1+1+1 kombinasyonu 3 çıktı.
     Artık tüm eksenler ETHICS üzerinden dolaşılıyor — yeni bir
     eksen eklendiğinde burayı güncellemek gerekmez. */
  /* ZIRH: eksik/bozuk state ana thread'i durdurmasın */
  try {
    if (!CFG.ethics || typeof CFG.ethics !== 'object') CFG.ethics = blankEthics();
    const e = CFG.ethics;
    let t = 0;
    for (const ax in ETHICS){
      const v = +e[ax];
      t += Number.isFinite(v) ? Math.abs(v) : 0;
    }
    return t;
  } catch(err){
    console.warn('ethicSpent:', err);
    return 0;
  }
}

/* Dört eksenin tamamı sıfır — tek kaynak. Yeni bir eksen
   eklendiğinde burayı güncellemek gerekmez. */
function blankEthics(){
  const o = {};
  for (const ax in ETHICS) o[ax] = 0;
  return o;
}
const TRAIT_BUDGET = 3;

function traitCost(list){ return list.reduce((a,t)=>a+TRAITS[t].c,0); }

/* ═══ ZIRH 3: SEKME GEÇİŞİ KALKANI ═══
   Bir sekmenin çizimi hata verse bile arayüz kilitlenmez:
   hata konsola yazılır, kullanıcıya anlaşılır bir mesaj gösterilir
   ve diğer sekmelere geçiş çalışmaya devam eder. */
function safeRenderSetup(){
  try {
    renderSetup();
  } catch(err){
    console.error('renderSetup hatası (' + SETUP_STEP + '):', err);
    try {
      const el2 = $('setup');
      if (el2) el2.innerHTML =
        '<div class="sect"><h2>⚠ BU ADIM ÇİZİLEMEDİ</h2>' +
        '<div class="mini">Bu sekmede bir sorun oluştu ama oyun çalışmaya ' +
        'devam ediyor. Başka bir adıma geçebilir ya da bu adımı varsayılan ' +
        'değerlerle bırakabilirsin.</div>' +
        '<div class="act2"><button class="abtn" data-a="stepReset">' +
        '↺ BU ADIMI SIFIRLA</button></div></div>';
    } catch(e2){}
  }
}

function renderSetup(){
  /* ═══ ZIRH 1: GÜVENLİ BAŞLANGIÇ STATE ═══
     ETHICS'teki her eksen CFG.ethics'te sayısal olarak var olmalı.
     Kayıttan dönüş, sürüm yükseltme ya da yeni eksen eklenmesi
     durumunda eksik anahtar kalmaz. */
  if (!CFG.ethics || typeof CFG.ethics !== 'object') CFG.ethics = blankEthics();
  for (const ax in ETHICS){
    const v = +CFG.ethics[ax];
    CFG.ethics[ax] = Number.isFinite(v) ? v : 0;
  }
  const c = CFG;
  let h = '';

  /* --- adım şeridi --- */
  h += `<div class="steps">`;
  STEPS.forEach((st,i)=>{
    h += `<button class="stp ${SETUP_STEP===st.k?'on':''}" data-a="step" data-x="${st.k}">
            <b>${i+1}</b><span>${st.n}</span></button>`;
  });
  h += `</div>`;

  /* ================= 1. MİZAÇ ================= */
  if (SETUP_STEP === 'mizac'){
    h += `<div class="sect"><h2>HALKININ MİZACI</h2>
      <div class="mini" style="margin-bottom:8px">Mizaç, halkının dünyaya bakışıdır.
      Kin tutma hızını, savaş eşiğini, konseydeki duruşunu ve yüzünü belirler.
      Sonradan ideoloji reformuyla değiştirilebilir — ama bedeli ağırdır.</div>
      <div class="grid g2">`;
    for (const k in PERSONAS){
      const P = PERSONAS[k];
      const on = (c.mizac === k);
      h += `<button class="opt ${on?'on':''}" data-a="mizacSet" data-x="${k}">${P.ico} ${P.n}
        <small>kin ×${P.grudge.toFixed(2)} · affetme ×${P.forgive.toFixed(2)} ·
        savaş ${P.warBias>=0?'+':''}${P.warBias.toFixed(2)}</small></button>`;
    }
    h += `</div>`;
    if (c.mizac && PERSONAS[c.mizac]){
      const P = PERSONAS[c.mizac];
      h += `<div class="mini" style="margin-top:8px">
        <b>${P.ico} ${P.n}</b> — yaşam alanı eşiği %${Math.round(85*P.lifeSpace)} ·
        ${P.tradeVote < -90 ? 'ortak ticaret yasalarına <b>daima hayır</b>'
          : 'ticaret oyu ' + (P.tradeVote>=0?'+':'') + P.tradeVote.toFixed(2)}</div>`;
    }
    h += `</div>`;
  }

  /* ================= 2. GÖRÜNÜŞ ================= */
  else if (SETUP_STEP === 'goruns'){
    const pk = c.mizac || 'yayilmaci';
    h += `<div class="sect"><h2>HALKININ YÜZÜ</h2>
      <div class="mini" style="margin-bottom:8px">Portre üç katmandan çizilir:
      arka plan, zırh/kıyafet ve tür siluetı. Zırh mizacına göre şekillenir;
      diplomaside ilişkin bozulunca duruş sertleşir ve fon kızıla döner.</div>`;

    /* önizleme: dost · nötr · düşman */
    h += `<div class="grid g3" style="margin-bottom:10px">`;
    [[60,'DOSTANE'],[0,'NÖTR'],[-60,'DÜŞMAN']].forEach(pair=>{
      h += `<div style="text-align:center">
        <canvas class="setPort" data-lk="${c.look||'humanoid'}" data-pers="${pk}"
          data-mood="${pair[0]}" width="72" height="98"></canvas>
        <div class="mini">${pair[1]}</div></div>`;
    });
    h += `</div>`;

    h += `<div class="ph">TÜR SİLUETİ</div><div class="grid g3">`;
    for (const k in LOOKS){
      const on = (c.look === k);
      h += `<button class="opt ${on?'on':''}" data-a="look" data-x="${k}">${LOOKS[k].n}
        <small>${LOOKS[k].d}</small></button>`;
    }
    h += `</div>`;

    h += `<div class="ph">RENK</div><div class="grid g4">`;
    EMP_COLORS.forEach(col=>{
      const on = (c.color === col);
      h += `<button class="opt ${on?'on':''}" data-a="color" data-x="${encodeURIComponent(col)}"
        style="border-color:${on?col:''}"><span style="color:${col}">████</span></button>`;
    });
    h += `</div></div>`;
  }

  /* ================= 3. TÜR ================= */
  /* ═══ FAZ 52: TÜR FİZYOLOJİSİ SEKMESİ ═══ */
  else if (SETUP_STEP === 'fizyo'){
    h += `<div class="sect"><h2>🧬 TÜR FİZYOLOJİSİ</h2>
      <div class="mini">Biyolojin nasıl beslendiğini, hangi dünyalarda
        yaşayabildiğini ve ne hızla çoğaldığını belirler. Yönetim şeklinden
        bağımsızdır — bir kayaç cumhuriyeti de kurabilirsin.</div>`;
    h += `<div class="grid g2">`;
    for (const k in PHYSIO){
      const P = PHYSIO[k];
      const on = (c.physio || 'humanoid') === k;
      h += `<button class="opt ${on?'on':''}" data-a="physio" data-x="${k}">
        ${P.ico} ${P.n}<small>${P.art}</small></button>`;
    }
    h += `</div>`;
    const sec = PHYSIO[c.physio || 'humanoid'];
    h += `<div class="box" style="border-color:#6ff2c8;margin-top:8px">
      <div class="bt"><span>${sec.ico} ${sec.n}</span></div>
      <div class="bd">${sec.d}<br><br>
        <b>Beslenme:</b> ${sec.yiyer === 'mineral' ? 'mineral (yiyecek tüketmez)' : 'yiyecek'}
        ${sec.photo ? ' + fotosentez' : ''}<br>
        <b>Yaşanabilirlik:</b> ${sec.habBonus ? (sec.habBonus>0?'+':'') +
          Math.round(sec.habBonus*100) + '%' : 'temel'}<br>
        <b>Büyüme:</b> ${sec.growMul ? (sec.growMul>0?'+':'') +
          Math.round(sec.growMul*100) + '%' : 'normal'}
        ${sec.sever ? '<br><b>Sever:</b> ' + sec.sever.map(t=>PLANETS[t]?PLANETS[t].n:t).join(', ') : ''}
        ${sec.sevmez ? '<br><b>Yaşayamaz:</b> ' + sec.sevmez.map(t=>PLANETS[t]?PLANETS[t].n:t).join(', ') : ''}
      </div></div>`;
    h += `</div>`;
  }
  else if (SETUP_STEP === 'tur'){
    h += `<div class="sect"><h2>HANEDAN ADI</h2>
      <div class="nameRow">
        <input type="text" id="empName" maxlength="26" value="${esc(c.name)}">
        <button class="diceBtn" data-a="rollName" title="Rastgele isim üret">🎲</button>
      </div>
      <div class="mini">Zar, seçtiğin etik ve rejime uygun bir isim üretir.</div></div>`;

    h += `<div class="sect"><h2>TÜR VE YÖNETİM</h2><div class="grid g2">`;
    for (const k in RACES){
      const r = RACES[k];
      h += `<div class="card ${c.race===k?'on':''}" data-a="race" data-x="${k}">
        <button class="infoBtn" data-a="raceinfo" data-x="${k}" title="Ayrıntılar">i</button>
        <div class="cn"><canvas class="sig" data-emb="${k}" data-col="${r.col}" width="22" height="22"></canvas>
        <span style="color:${r.col}">${r.kisa}</span></div>
        <div class="ct">${r.sifat}</div>
        <div class="cd">${r.d}</div>
        <div class="cw">ZAFER: ${r.winD}</div>
      </div>`;
    }
    h += `</div></div>`;

    const spent = traitCost(c.traits);
    h += `<div class="sect"><h2>GENETİK ÖZELLİKLER</h2>
      <div class="traitbar"><span>PUAN <b>${TRAIT_BUDGET-spent}</b> / ${TRAIT_BUDGET}</span>
      <span>en fazla 4 özellik</span></div><div class="grid g2">`;
    for (const k in TRAITS){
      const t = TRAITS[k], on = c.traits.includes(k);
      h += `<button class="tchip ${on?'on':''}" data-a="trait" data-x="${k}">
        <span class="tc">${t.c>0?t.c:t.c}</span><div class="tn">${t.n}</div>
        <div class="td">${t.d}</div></button>`;
    }
    h += `</div></div>`;

    /* FAZ 14: "GÖRÜNÜŞ" ve "İMPARATORLUK RENGİ" bölümleri buradan
       KALDIRILDI — ikisi de 2. sekmede (GÖRÜNÜŞ) seçiliyor ve burada
       tekrar edip kafa karıştırıyordu. Arma stili burada kalıyor
       çünkü türle birlikte kimlik oluşturuyor. */
    h += `<div class="sect"><h2>ARMA STİLİ</h2><div class="grid g4">`;
    for (const k in SIGILS){
      h += `<button class="opt ${c.sigil===k?'on':''}" data-a="sigil" data-x="${k}">
        <canvas class="sigPrev" data-sg="${k}" data-col="${c.color||RACES[c.race].col}" width="26" height="26"></canvas>
        <small>${SIGILS[k].n}</small></button>`;
    }
    h += `</div></div>`;
  }

  /* ================= 2. ETİK ================= */
  if (SETUP_STEP === 'etik'){
    const spent = ethicSpent();
    h += `<div class="sect"><h2>İDEOLOJİ EKSENLERİ</h2>
      <div class="traitbar"><span>KAYDIRMA
        <b id="ethBudget">${ETHIC_BUDGET-spent}</b> / ${ETHIC_BUDGET}</span>
      <span>eksen başına en fazla ${ETHIC_MAX}</span></div>`;
    for (const ax in ETHICS){
      const E = ETHICS[ax], v = c.ethics[ax]||0;
      const side = v>0 ? E.a : v<0 ? E.b : 'DENGELİ';
      const col  = v>0 ? '#ff9b3d' : v<0 ? '#6ff2c8' : '#7d90ad';
      h += `<div class="axis">
        <div class="axHd"><span>${E.n}</span>
          <b id="axSide_${ax}" style="color:${col}">${side}${v?' '+Math.abs(v):''}</b></div>
        <div class="axLbl"><i>◄ ${E.b}</i><i>${E.a} ►</i></div>
        <div class="axRow">`;
      for (let i=-ETHIC_MAX;i<=ETHIC_MAX;i++){
        const on = v===i;
        h += `<button class="axDot ${on?'on':''} ${i===0?'mid':''}"
          id="axd_${ax}_${i}" data-ax="${ax}" data-a="ethic"
          data-x="${ax}:${i}">${i===0?'○':Math.abs(i)}</button>`;
      }
      h += `</div><div class="axDesc" id="axDesc_${ax}">${v>0?E.da:v<0?E.db:'Bu eksende tarafsızsın — iki yönün de bonusu yok.'}</div>`;
      /* ═══ FAZ 52: SAYISAL BONUS DÖKÜMÜ ═══
         Her iki yönün 1. ve 2. seviye etkisi açıkça listelenir. */
      {
        const adlar = {
          minMul:'mineral', eneMul:'enerji', yiyMul:'yiyecek', alaMul:'alaşım',
          araMul:'araştırma', etkFlat:'etki', eneFlat:'enerji (sabit)',
          dmgMul:'gemi hasarı', shMul:'kalkan', hullMul:'gövde', spdMul:'hız',
          growMul:'nüfus büyümesi', habFlat:'yaşanabilirlik', dipMul:'diplomasi',
          capFlat:'filo kapasitesi', upMul:'bakım', buildMul:'inşa hızı',
          colCost:'koloni maliyeti', stab:'istikrar', sensor:'sensör',
          trustCap:'güven tavanı', tradeMul:'ticaret', opCost:'operasyon maliyeti',
          opBonus:'operasyon başarısı', opRisk:'ifşa riski', trustStart:'başlangıç güveni',
          eDmgMul:'düşman hasarı', eShMul:'düşman kalkanı', crisisDmg:'krize karşı hasar'
        };
        const fmtE = (bl) => {
          const p2 = [];
          for (const k2 in bl){
            const val = bl[k2];
            const ad = adlar[k2] || k2;
            const yuzde = Math.abs(val) < 1 && val !== 0;
            const gos = yuzde ? (val>0?'+':'') + Math.round(val*100) + '%'
                              : (val>0?'+':'') + val;
            p2.push(ad + ' ' + gos);
          }
          return p2.length ? p2.join(' · ') : 'etki yok';
        };
        h += `<div class="ethMx">
          <div class="ethMxRow"><b style="color:#ff9b3d">${E.a}</b>
            <span>1️⃣ ${esc(fmtE(E.ea))}</span>
            <span>2️⃣ ${esc(fmtE(E.ea))} <i>(iki katı)</i></span></div>
          <div class="ethMxRow"><b style="color:#6ff2c8">${E.b}</b>
            <span>1️⃣ ${esc(fmtE(E.eb))}</span>
            <span>2️⃣ ${esc(fmtE(E.eb))} <i>(iki katı)</i></span></div>
        </div>`;
      }
      // eşik yetenekleri
      const PK3 = ETHIC_PERKS[ax];
      const perkSide = !PK3 ? null : (v > 0 ? PK3.pos : v < 0 ? PK3.neg : null);
      /* Kutu her zaman var: nokta cerrahisi içini doldurup boşaltır */
      if (!perkSide) h += `<div class="perkBox" id="axPerk_${ax}"></div>`;
      if (perkSide){
        const n = Math.abs(v);
        h += `<div class="perkBox" id="axPerk_${ax}">`;
        perkSide.forEach(pk=>{
          const on = n >= pk.lvl;
          h += `<div class="perkRow ${on?'on':''}">
            <b>${on?'✧':'○'} ${pk.n}</b> <i>(${pk.lvl} kaydırma)</i>
            <span>${pk.d}</span></div>`;
        });
        h += `</div>`;
      }
      h += `</div>`;
    }
    h += `</div>`;
  }

  /* ================= 3. CIVIC ================= */
  if (SETUP_STEP === 'civic'){
    h += `<div class="sect"><h2>CIVIC — YÖNETİM İLKELERİ</h2>
      <div class="traitbar"><span>SEÇİLEN <b>${c.civics.length}</b> / ${CIVIC_SLOTS}</span>
      <span>⚡ işaretliler oyun tarzını değiştirir</span></div><div class="grid g2">`;
    for (const k in CIVICS){
      const cv = CIVICS[k], on = c.civics.includes(k);
      h += `<button class="card civ ${on?'on':''} ${cv.sars?'sars':''}" data-a="civic" data-x="${k}">
        <div class="cn"><span class="civIco">${cv.ico}</span>
        <span style="color:${cv.sars?'#ff9b3d':'#6ff2c8'}">${cv.n}</span>
        ${cv.sars?'<span class="sarsTag">⚡</span>':''}</div>
        <div class="cd">${cv.d}</div>
      </button>`;
    }
    h += `</div>`;
    if (c.civics.some(k=>CIVICS[k] && CIVICS[k].flag==='mono')){
      h += `<div class="sect"><h2>TEK ÜRÜN SEÇİMİ</h2><div class="grid g4">`;
      for (const r of ['min','ene','ara','ala']){
        h += `<button class="opt ${c.monoRes===r?'on':''}" data-a="mono" data-x="${r}">
          <span style="color:${RES[r].c};font-size:15px">${RES[r].ico}</span><small>${RES[r].n}</small></button>`;
      }
      h += `</div></div>`;
    }
    h += `</div>`;
  }

  /* ================= 4. KÖKEN ================= */
  if (SETUP_STEP === 'koken'){
    h += `<div class="sect"><h2>KÖKEN — NASIL BAŞLIYORSUN</h2><div class="grid g2">`;
    for (const k in ORIGINS){
      const o = ORIGINS[k];
      h += `<button class="card ${c.origin===k?'on':''}" data-a="origin" data-x="${k}">
        <div class="cn"><span class="civIco">${o.ico}</span><span>${o.n}</span></div>
        <div class="cd">${o.d}</div></button>`;
    }
    h += `</div></div>`;
  }

  /* ================= 5. GALAKSİ ================= */
  if (SETUP_STEP === 'galaksi'){
    /* ═══ FAZ 53: GALAKSİ ÖZELLİK ANAHTARLARI ═══ */
    h += `<div class="sect"><h2>🌌 GALAKSİ ÖZELLİKLERİ</h2>
      <div class="mini">Bu anahtarlar galaksinin karakterini belirler.
        Kapalı özellikler oyunda hiç görünmez.</div>`;
    const tog = (etiket, aciklama, alan, acikMi) => `
      <button class="opt ${acikMi?'on':''}" data-a="${alan}">
        ${etiket}<small>${aciklama} — <b>${acikMi?'AÇIK':'KAPALI'}</b></small></button>`;
    h += `<div class="grid g2">`;
    h += tog('☠ Korsan Tehdidi', 'Yağmacı filolar ve korsan yuvaları',
             'togPirate', c.pirates !== false);
    h += tog('🌀 Yıldız Kapıları', 'Uzak sistemler arası kısayol ağı',
             'togGate', c.gates !== false);
    h += `</div>`;
    h += `<div class="ph">☣ KRİZ ŞİDDETİ</div><div class="grid g3">`;
    [['kapali','KAPALI','Hiçlik Sürüsü hiç gelmez'],
     ['normal','NORMAL ×1','Dengeli kıyamet'],
     ['acimasiz','ACIMASIZ ×2','İki kat filo, iki kat açlık']].forEach(k => {
      const on = (c.crisisPower || 'normal') === k[0];
      h += `<button class="opt ${on?'on':''}" data-a="crisisPower" data-x="${k[0]}">
        ${k[1]}<small>${k[2]}</small></button>`;
    });
    h += `</div></div>`;
    h += `<div class="sect"><h2>GALAKSİ</h2><div class="grid g4">`;
    for (const k in SIZES) h += `<button class="opt ${c.size===k?'on':''}" data-a="size" data-x="${k}">${SIZES[k].n}<small>${SIZES[k].d}</small></button>`;
    h += `</div><div class="grid g3" style="margin-top:8px">`;
    for (const k in SHAPES) h += `<button class="opt ${c.shape===k?'on':''}" data-a="shape" data-x="${k}">${SHAPES[k].n}<small>${SHAPES[k].d}</small></button>`;
    h += `</div></div>`;

    h += `<div class="sect"><h2>ZORLUK</h2><div class="grid g4">`;
    for (const k in DIFFS) h += `<button class="opt ${c.diff===k?'on':''}" data-a="diff" data-x="${k}">${DIFFS[k].n}<small>${DIFFS[k].d}</small></button>`;
    h += `</div></div>`;

    h += `<div class="sect"><h2>OYUN SONU KRİZİ</h2><div class="grid g4">`;
    for (const k in CRISIS_TIMING){
      const C = CRISIS_TIMING[k];
      h += `<button class="opt ${c.crisis===k?'on':''}" data-a="crisisSet" data-x="${k}">${C.n}<small>${C.d}</small></button>`;
    }
    h += `</div><div class="mini" style="margin-top:6px">Galaksinin dışından gelen bir istila.
      Gücü, o andaki toplam filo gücüne göre ölçeklenir — güçlüysen daha sert gelir.</div></div>`;

    h += `<div class="sect"><h2>GALAKTİK KONSEY</h2><div class="grid g4">`;
    for (const k in COUNCIL_PACE){
      const P = COUNCIL_PACE[k];
      h += `<button class="opt ${c.council===k?'on':''}" data-a="councilSet" data-x="${k}">${P.n}<small>${P.d}</small></button>`;
    }
    h += `</div><div class="mini" style="margin-top:6px">Konsey kararları galaksi çapında bağlayıcıdır:
      silahsızlanma, yaptırım, savaş yasağı. Yalnızca <b>Pasifist 2+</b> bir devlet kurabilir —
      sen kurmazsan bir yapay zekâ kurar. Başkanlık ayrı bir zafer yoludur.</div></div>`;

    h += `<div class="sect"><h2>KAYIP UYGARLIK KALINTILARI</h2><div class="grid g4">`;
    for (const k in RUIN_LEVELS){
      const R2 = RUIN_LEVELS[k];
      h += `<button class="opt ${c.ruins===k?'on':''}" data-a="ruinSet" data-x="${k}">${R2.n}<small>${R2.d}</small></button>`;
    }
    h += `</div><div class="mini" style="margin-top:6px">Uykuda ama çok güçlü savunma sistemleri.
      Erken oyunda geçilmez; yıkan büyük ödül alır.</div></div>`;

    h += `<div class="sect"><h2>TOHUM</h2>
      <div class="row" style="font-family:var(--mono)"><span>Galaksi tohumu</span><b>${c.seed}</b></div>
      <div class="btnrow"><button class="btn ghost" data-a="seed">YENİ TOHUM</button>
      <button class="btn ghost" data-a="loadsave">SON KAYDI YÜKLE</button></div></div>`;
  }

  /* --- özet + başlat --- */
  h += `<div class="summary">`;
  const eth = [];
  for (const ax in ETHICS){
    const v = c.ethics[ax]||0;
    if (v) eth.push((v>0?ETHICS[ax].a:ETHICS[ax].b) + ' ' + Math.abs(v));
  }
  h += `<div class="sumRow"><span>Tür</span><b style="color:${c.color||RACES[c.race].col}">${RACES[c.race].kisa}</b></div>`;
  h += `<div class="sumRow"><span>İdeoloji</span><b>${eth.length?eth.join(' · '):'Tarafsız'}</b></div>`;
  h += `<div class="sumRow"><span>Civic</span><b>${c.civics.length?c.civics.map(k=>CIVICS[k].n).join(' · '):'—'}</b></div>`;
  h += `<div class="sumRow"><span>Görünüş</span><b>${LOOKS[c.look].n}</b></div>`;
  h += `<div class="sumRow"><span>Köken</span><b>${ORIGINS[c.origin].n}</b></div>`;
  h += `<div class="sumRow"><span>Galaksi</span><b>${SIZES[c.size].n} · ${SHAPES[c.shape].n} · ${DIFFS[c.diff].n}</b></div>`;
  h += `<div class="sumRow"><span>Kriz · Kalıntı</span><b>${CRISIS_TIMING[c.crisis].n} · ${RUIN_LEVELS[c.ruins].n}</b></div>`;
  h += `<div class="sumRow"><span>Konsey</span><b>${COUNCIL_PACE[c.council]?COUNCIL_PACE[c.council].n:'NORMAL'}</b></div>`;
  h += `</div>`;

  const idx = STEPS.findIndex(x=>x.k===SETUP_STEP);
  h += `<div class="btnrow" style="margin-top:10px">`;
  if (idx > 0) h += `<button class="btn ghost" data-a="step" data-x="${STEPS[idx-1].k}">‹ GERİ</button>`;
  if (idx < STEPS.length-1) h += `<button class="btn" data-a="step" data-x="${STEPS[idx+1].k}">İLERİ ›</button>`;
  else h += `<button class="btn" data-a="start">GALAKSİYİ YARAT</button>`;
  h += `</div>`;
  if (idx < STEPS.length-1)
    h += `<button class="btn ghost" data-a="start" style="margin-top:6px">VARSAYILANLARLA BAŞLA</button>`;

  h += `<div class="mini" style="text-align:center;margin-top:10px;color:#7d90ad">
        Yatay tut · oyun içinde ⛶ ile tam ekrana geç</div>`;

  $('setup').innerHTML = h;
  const inp = $('empName');
  if (inp) inp.addEventListener('input', e => { CFG.name = e.target.value || 'Yeni Hanedan'; });
  paintEmblems();
}
function paintEmblems(){
  [...document.querySelectorAll('canvas[data-emb]')].forEach(cv=>{
    const g = cv.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.clearRect(0,0,cv.width,cv.height);
    g.drawImage(ART.emblem(cv.dataset.emb, cv.dataset.col, 22, CFG.sigil), 0, 0);
  });
  [...document.querySelectorAll('canvas[data-lk]')].forEach(cv=>{
    const g = cv.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.clearRect(0,0,cv.width,cv.height);
    /* Her canvas kendi mizacını ve ruh hâlini taşıyabilir; taşımıyorsa
       kurulum ayarları kullanılır. Görünüş adımındaki üç önizleme
       bu sayede dost/nötr/düşman olarak farklı çizilir. */
    const spr = ART.portraitFull({
      look: cv.dataset.lk,
      col:  cv.dataset.col || CFG.color || (RACES[CFG.race] ? RACES[CFG.race].col : '#6ff2c8'),
      persona: cv.dataset.pers || CFG.mizac,
      mood: cv.dataset.mood !== undefined ? +cv.dataset.mood : 0,
      scale: 3});
    const sc = Math.min(cv.width/spr.width, cv.height/spr.height);
    g.drawImage(spr, (cv.width-spr.width*sc)/2, (cv.height-spr.height*sc)/2, spr.width*sc, spr.height*sc);
  });
  [...document.querySelectorAll('canvas[data-sg]')].forEach(cv=>{
    const g = cv.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.clearRect(0,0,cv.width,cv.height);
    g.drawImage(ART.emblem(CFG.race, cv.dataset.col, 26, cv.dataset.sg), 0, 0);
  });
}

/* ═══ FAZ 20: ANA MENÜ EYLEMLERİ ═══
   Kurulum zincirinden ÖNCE çalışır. Her tıklama aynı zamanda
   AudioContext kilidini açar (tarayıcı otomatik oynatma politikası). */
document.addEventListener('click', e=>{
  const el = e.target.closest('[data-a]');
  if (!el) return;
  const t = $('title');
  if (!t || t.classList.contains('hidden')) return;
  const a = el.dataset.a;
  if (a !== 'tNew' && a !== 'tCont' && a !== 'tOpt' && a !== 'tMute'
      && a !== 'tAdvReset' && a !== 'tBack') return;

  /* Ses kilidi: menüdeki İLK tıklama ambiyansı başlatır */
  if (typeof AUDIO !== 'undefined'){
    try { if (!AUDIO_OFF) AUDIO.start(); AUDIO.play('tap'); } catch(err){}
  }

  /* FAZ 24: müzik doğrudan bu iki butonun tıklamasında başlar.
     Autoplay politikası için en güvenilir an burası: gerçek bir
     kullanıcı jesti ve AudioContext henüz askıda değil. */
  if (a === 'tNew'){
    if (typeof AUDIO !== 'undefined' && !AUDIO_OFF){
      try { AUDIO.start(); AUDIO.resume(); } catch(err){}
    }
    leaveTitle('setup'); return;
  }

  if (a === 'tCont'){
    if (typeof AUDIO !== 'undefined' && !AUDIO_OFF){
      try { AUDIO.start(); AUDIO.resume(); } catch(err){}
    }
    loadGame().then(ok => {
      if (!ok){ refreshContinueBtn(); return; }
      leaveTitle(null);
      $('menu').classList.add('hidden');
      $('game').classList.remove('hidden');
      enterGame(true);                       // kayıttan giriş
      say('Kayıt yüklendi — yıl ' + G.year, 'win');
    });
    return;
  }

  if (a === 'tOpt'){
    const alt = $('tOptBox');
    if (alt) alt.remove();
    const box = document.createElement('div');
    box.id = 'tOptBox';
    box.className = 'tBtns';
    box.style.marginTop = '4px';
    box.innerHTML =
      `<button class="tBtn" data-a="tMute">SES: ${AUDIO_OFF ? 'KAPALI' : 'AÇIK'}
         <small>Uzay ambiyansı ve arayüz sesleri</small></button>
       <button class="tBtn" data-a="tAdvReset">REHBER: ${ADVISOR_OFF ? 'KAPALI' : 'AÇIK'}
         <small>Yeni oyunda danışman penceresi</small></button>
       <button class="tBtn" data-a="tBack">◂ GERİ</button>`;
    el.parentElement.appendChild(box);
    return;
  }

  if (a === 'tMute'){
    if (typeof AUDIO !== 'undefined'){
      AUDIO_OFF = AUDIO.toggle();
      try { storeSet('yh_audio', AUDIO_OFF ? 'off' : 'on'); } catch(err){}
      el.innerHTML = `SES: ${AUDIO_OFF ? 'KAPALI' : 'AÇIK'}
        <small>Uzay ambiyansı ve arayüz sesleri</small>`;
      if (!AUDIO_OFF) AUDIO.play('ok');
    }
    return;
  }
  if (a === 'tAdvReset'){
    ADVISOR_OFF = !ADVISOR_OFF;
    try { storeSet('yh_advisor', ADVISOR_OFF ? 'off' : 'on'); } catch(err){}
    el.innerHTML = `REHBER: ${ADVISOR_OFF ? 'KAPALI' : 'AÇIK'}
      <small>Yeni oyunda danışman penceresi</small>`;
    return;
  }
  if (a === 'tBack'){
    const box = $('tOptBox');
    if (box) box.remove();
    return;
  }
}, true);

/* ═══ FAZ 53: KURULUM DELEGATION — click + pointerdown ═══
   Mobilde bazı tarayıcılar hızlı dokunuşta click üretmiyor
   (özellikle Acode WebView). Aynı işleyici iki olaya bağlanıyor;
   çift tetiklemeyi _setupBusy damgası engelliyor. */
function setupClickHandler(e){
  const el = e.target.closest('[data-a]');
  if (!el || $('menu').classList.contains('hidden')) return;
  /* Aynı dokunuşun click+pointerdown ikilisini bir kez işle */
  const stamp = (e.type === 'pointerdown') ? 'p' : 'c';
  const now = Date.now();
  if (setupClickHandler._at && now - setupClickHandler._at < 320 &&
      setupClickHandler._el === el && setupClickHandler._t !== stamp) return;
  setupClickHandler._at = now;
  setupClickHandler._el = el;
  setupClickHandler._t = stamp;
  const a = el.dataset.a, x = el.dataset.x;
  if (a === 'raceinfo'){ e.stopPropagation(); raceInfo(x); return; }
  if (a === 'closeinfo'){ closeRaceInfo(); return; }
  if (a === 'pickrace'){ CFG.race = x; CFG.color = RACES[x].col; closeRaceInfo(); safeRenderSetup(); return; }
  if (a === 'race'){
    CFG.race = x;
    // ırkın doğal ideolojisini varsayılan olarak yükle
    if (RACES[x].eth && !CFG.ethLocked) CFG.ethics = Object.assign({mil:0,aut:0,mat:0}, RACES[x].eth);
    if (!CFG.colorLocked) CFG.color = RACES[x].col;
    if (RACES[x].bio === 'makine') CFG.look = 'makine';
    else if (RACES[x].bio === 'litoit') CFG.look = 'kristal';
    safeRenderSetup();
  }
  else if (a === 'trait'){
    const i = CFG.traits.indexOf(x);
    if (i >= 0) CFG.traits.splice(i,1);
    else {
      if (CFG.traits.length >= 4) return;
      if (traitCost(CFG.traits) + TRAITS[x].c > TRAIT_BUDGET) return;
      CFG.traits.push(x);
    }
    safeRenderSetup();
  }
  else if (a === 'step'){ SETUP_STEP = x; $('menu').scrollTop = 0; safeRenderSetup(); }
  else if (a === 'sigil'){ CFG.sigil = x; safeRenderSetup(); }
  else if (a === 'look'){ CFG.look = x; safeRenderSetup(); }
  else if (a === 'mizacSet'){ CFG.mizac = x; safeRenderSetup(); }
  /* ═══════════════════════════════════════════════════════════════
     FAZ 53 — KURULUM DELEGATION ONARIMI
     KÖK NEDEN: Faz 52'de 'physio' ve 'rollName' eylemlerini UI.act()
     içine eklemiştim. Ama kurulum ekranı KENDİ ayrı delegation
     zincirini kullanıyor (bu blok) ve UI.act() oyun içi panellere
     bakıyor. Tıklamalar sessizce düşüyordu.
     Testim UI.act()'i doğrudan çağırdığı için hatayı görmedi —
     el ile tıklama yolunu hiç denememişti. Ders: arayüz testi
     DOM yolundan geçmeli.
     ═══════════════════════════════════════════════════════════════ */
  else if (a === 'togPirate'){ CFG.pirates = (CFG.pirates === false); safeRenderSetup(); }
  else if (a === 'togGate'){ CFG.gates = (CFG.gates === false); safeRenderSetup(); }
  else if (a === 'crisisPower'){
    CFG.crisisPower = x;
    /* Kapalı seçildiyse kriz zamanlamasını da kapat */
    if (x === 'kapali') CFG.crisis = 'kapali';
    else if (CFG.crisis === 'kapali') CFG.crisis = 'normal';
    safeRenderSetup();
  }
  else if (a === 'physio'){
    if (PHYSIO[x]){ CFG.physio = x; CFG.physioLocked = true; }
    safeRenderSetup();
  }
  else if (a === 'rollName'){
    /* Kutudaki elle yazılmış değeri kaybetmeden üret ve senkronla */
    const inp = $('empName');
    if (inp && inp.value !== undefined && inp.value !== '') CFG.name = inp.value;
    CFG.name = (typeof empireName === 'function')
      ? empireName(Math.random, CFG.ethics || {}, null)
      : CFG.name;
    if (inp) inp.value = CFG.name;
    safeRenderSetup();
    /* renderSetup DOM'u yeniden kurduğu için input'u tekrar yaz */
    const inp2 = $('empName');
    if (inp2) inp2.value = CFG.name;
  }
  else if (a === 'color'){ CFG.color = decodeURIComponent(x); CFG.colorLocked = true; safeRenderSetup(); }
  else if (a === 'ethic'){
    /* ═══ ZIRH 2: TAM RE-RENDER YOK, NOKTA CERRAHİSİ ═══
       Eskiden her tıklamada safeRenderSetup() çağrılıp tüm sekme
       innerHTML ile baştan çiziliyordu. Bu hem titremeye hem de
       (bir alt fonksiyon hata verirse) sekmenin tamamen boş
       kalmasına yol açıyordu. Artık yalnız üç şey değişiyor:
       aktif nokta sınıfı, bütçe sayısı ve o eksenin açıklaması. */
    try {
      const [ax, valRaw] = x.split(':');
      if (!ETHICS[ax]) return;
      const val = parseInt(valRaw, 10);
      if (!Number.isFinite(val)) return;
      if (!CFG.ethics || typeof CFG.ethics !== 'object') CFG.ethics = blankEthics();
      const cur = +CFG.ethics[ax] || 0;
      const other = ethicSpent() - Math.abs(cur);
      if (other + Math.abs(val) > ETHIC_BUDGET) return;   // bütçe kalkanı

      const yeni = (cur === val) ? 0 : val;
      CFG.ethics[ax] = yeni;
      CFG.ethLocked = true;

      /* a) aktif nokta */
      for (let i = -ETHIC_MAX; i <= ETHIC_MAX; i++){
        const b = $('axd_' + ax + '_' + i);
        if (b) b.classList.toggle('on', i === yeni);
      }
      /* b) bütçe sayacı */
      const bt = $('ethBudget');
      if (bt) bt.textContent = String(ETHIC_BUDGET - ethicSpent());
      /* c) eksen başlığı ve açıklaması */
      const E2 = ETHICS[ax];
      const yan = $('axSide_' + ax);
      if (yan){
        yan.textContent = yeni > 0 ? E2.a + ' ' + yeni
                        : yeni < 0 ? E2.b + ' ' + Math.abs(yeni) : 'DENGELİ';
        yan.style.color = yeni > 0 ? '#ff9b3d' : yeni < 0 ? '#6ff2c8' : '#7d90ad';
      }
      const acik = $('axDesc_' + ax);
      if (acik) acik.textContent = yeni > 0 ? E2.da : yeni < 0 ? E2.db
        : 'Bu eksende tarafsızsın — iki yönün de bonusu yok.';
      /* d) eşik yetenekleri: yalnız bu eksenin kutusu */
      const pkBox = $('axPerk_' + ax);
      if (pkBox){
        const PK = ETHIC_PERKS[ax];
        const yon = !PK ? null : (yeni > 0 ? PK.pos : yeni < 0 ? PK.neg : null);
        if (!yon) pkBox.innerHTML = '';
        else {
          const nn = Math.abs(yeni);
          pkBox.innerHTML = yon.map(pk =>
            '<div class="perkRow ' + (nn >= pk.lvl ? 'on' : '') + '">' +
            '<b>' + (nn >= pk.lvl ? '✧' : '○') + ' ' + pk.n + '</b> ' +
            '<i>(' + pk.lvl + ' kaydırma)</i><span>' + pk.d + '</span></div>').join('');
        }
      }
    } catch(err){
      console.warn('ethic tıklaması:', err);
    }
  }
  else if (a === 'civic'){
    const i = CFG.civics.indexOf(x);
    if (i >= 0) CFG.civics.splice(i,1);
    else { if (CFG.civics.length >= CIVIC_SLOTS) return; CFG.civics.push(x); }
    safeRenderSetup();
  }
  else if (a === 'mono'){ CFG.monoRes = x; safeRenderSetup(); }
  else if (a === 'origin'){ CFG.origin = x; safeRenderSetup(); }
  else if (a === 'councilSet'){ CFG.council = x; safeRenderSetup(); }
  else if (a === 'crisisSet'){ CFG.crisis = x; safeRenderSetup(); }
  else if (a === 'ruinSet'){ CFG.ruins = x; safeRenderSetup(); }
  else if (a === 'size'){ CFG.size = x; safeRenderSetup(); }
  else if (a === 'shape'){ CFG.shape = x; safeRenderSetup(); }
  else if (a === 'diff'){ CFG.diff = x; safeRenderSetup(); }
  else if (a === 'seed'){ CFG.seed = (Math.random()*1e9)|0; safeRenderSetup(); }
  else if (a === 'start'){ startGame(); }
  else if (a === 'loadsave'){ loadGame().then(ok => { if (ok) enterGame(); else UI.alert('Kayıt bulunamadı'); }); }
}
document.addEventListener('click', setupClickHandler);
/* ═══════════════════════════════════════════════════════════════════
   FAZ 59 — KAYDIRMA/TIKLAMA AYRIMI
   SORUN: setupClickHandler doğrudan 'pointerdown'a bağlıydı, yani
   parmak DEĞER DEĞMEZ seçim yapıyordu. Civic listesi gibi uzun
   sekmelerde oyuncu aşağı kaydırmak için dokununca istemeden
   ilkeleri aç/kapa yapıyordu — kaydırmaya hiç şans yoktu.

   ÇÖZÜM: pointerdown yalnız başlangıç noktasını KAYDEDER. Karar
   pointerup'ta verilir: parmak SCROLL_TOLERANS pikselden fazla
   kaydıysa bu bir kaydırmadır, tıklama iptal edilir.
   Süre de bakılır — uzun basış (>700 ms) da tıklama sayılmaz.
   ═══════════════════════════════════════════════════════════════════ */
const SCROLL_TOLERANS = 12;      // px — bu kadarı titreme sayılır
const TAP_MAX_MS      = 700;     // ms — daha uzunu basılı tutmadır

let _tapBas = null;

document.addEventListener('pointerdown', ev => {
  const el = ev.target.closest && ev.target.closest('[data-a]');
  if (!el) { _tapBas = null; return; }
  const menu = $('menu');
  if (!menu || menu.classList.contains('hidden')) { _tapBas = null; return; }
  _tapBas = {x: ev.clientX, y: ev.clientY, t: Date.now(), el};
}, {passive: true});

document.addEventListener('pointercancel', () => { _tapBas = null; }, {passive: true});

document.addEventListener('pointerup', ev => {
  const bas = _tapBas;
  _tapBas = null;
  if (!bas) return;
  const el = ev.target.closest && ev.target.closest('[data-a]');
  if (!el || el !== bas.el) return;        // parmak başka öğeye kaydı
  const dx = Math.abs(ev.clientX - bas.x);
  const dy = Math.abs(ev.clientY - bas.y);
  if (dx > SCROLL_TOLERANS || dy > SCROLL_TOLERANS) return;   // KAYDIRMA
  if (Date.now() - bas.t > TAP_MAX_MS) return;                // uzun basış
  setupClickHandler(ev);
}, {passive: true});

/* ═══════════════════════════════════════════════════════════════════
   FAZ 53 — TAM EKRAN BUTONU MOBİL ONARIMI
   Bazı mobil WebView'lar (Acode dahil) araç çubuğundaki küçük
   butonlarda 'click' üretmiyor ya da fullscreen isteğini yalnız
   'pointerdown'daki kullanıcı jestinde geçerli sayıyor.
   Bu dinleyici doğrudan pointerdown'da çalışır ve native API
   reddedilse bile fauxFullOn() ile CSS katmanını devreye sokar.
   ═══════════════════════════════════════════════════════════════════ */


/* ---------- ırk ayrıntı paneli ---------- */
const MOD_LABELS = {
  minMul:'Mineral', eneMul:'Enerji', yiyMul:'Yiyecek', alaMul:'Alaşım', araMul:'Araştırma',
  dmgMul:'Gemi hasarı', hullMul:'Gövde', shMul:'Kalkan', spdMul:'Filo hızı',
  growMul:'Nüfus artışı', dipMul:'Diplomatik ikna', buildMul:'İnşa hızı',
  upMul:'Filo bakımı', colCost:'Koloni gemisi maliyeti', stab:'İstikrar',
  habFlat:'Yaşanabilirlik', etkFlat:'Etki/ay', capFlat:'Filo kapasitesi', sensor:'Sensör menzili'
};
function raceInfo(key){
  const r = RACES[key];
  if (!r) return;
  const pos = [], neg = [];
  for (const m in r.e){
    const v = r.e[m];
    const lbl = MOD_LABELS[m] || m;
    let txt;
    if (m === 'stab' || m === 'habFlat' || m === 'etkFlat' || m === 'capFlat' || m === 'sensor')
      txt = lbl + ' ' + (v>0?'+':'') + v;
    else txt = lbl + ' ' + (v>0?'+':'−') + '%' + Math.abs(Math.round(v*100));
    // maliyet ve bakım için düşük olan iyidir
    const iyi = (m === 'colCost' || m === 'upMul') ? v < 0 : v > 0;
    (iyi ? pos : neg).push(txt);
  }
  const climate = CLIMATES[r.ik] || r.ik;
  const bioName = r.bio === 'makine' ? 'Makine zekâsı' : r.bio === 'litoit' ? 'Litoit (kayaç)' : 'Organik';
  const feed = r.bio === 'makine' ? 'Enerji' : r.bio === 'litoit' ? 'Mineral' : 'Yiyecek';

  $('raceInfo').innerHTML =
    `<div class="riBox">
       <div class="riHd">
         <span style="color:${r.col}">${esc(r.n)}</span>
         <button class="riX" data-a="closeinfo">✕</button>
       </div>
       <div class="riBody">
         <div class="riTag">${r.sifat}</div>
         <p class="riQuote">${esc(r.d)}</p>

         <div class="riSec">TÜR YETENEĞİ</div>
         <p class="riSpec">${esc(r.ozel || '')}</p>

         <div class="riSec">TEMEL BİLGİ</div>
         <div class="riRow"><span>Biyoloji</span><b>${bioName}</b></div>
         <div class="riRow"><span>Beslenme</span><b style="color:#ff9b3d">${feed}</b></div>
         <div class="riRow"><span>Tercih iklimi</span><b>${climate}</b></div>
         <div class="riRow"><span>Saldırganlık</span><b>${Math.round(r.agr*100)}%</b></div>
         <div class="riRow"><span>Diplomasi yeteneği</span><b>${r.dip<=0.02?'YOK':Math.round(r.dip*100)+'%'}</b></div>

         <div class="riSec" style="color:#65e08a">AVANTAJLAR</div>
         ${pos.length ? pos.map(x=>`<div class="riLi ok">▲ ${x}</div>`).join('') : '<div class="riLi">—</div>'}

         <div class="riSec" style="color:#ff5f6d">DEZAVANTAJLAR</div>
         ${neg.length ? neg.map(x=>`<div class="riLi bad">▼ ${x}</div>`).join('') : '<div class="riLi">—</div>'}

         <div class="riSec">ZAFER KOŞULU</div>
         <p class="riSpec" style="color:#ff9b3d">${esc(r.winD)}</p>
       </div>
       <div class="riFt">
         <button class="btn" data-a="pickrace" data-x="${key}">BU TÜRÜ SEÇ</button>
       </div>
     </div>`;
  $('raceInfo').classList.add('show');
}
function closeRaceInfo(){
  $('raceInfo').classList.remove('show');
  setTimeout(()=>{ const el=$('raceInfo'); if(el && !el.classList.contains('show')) el.innerHTML=''; }, 240);
}

/* ---------- menü arka planı ---------- */
function menuStars(){
  const cv = $('menuStars');
  if (!cv) return;
  const g = cv.getContext('2d');
  const fit = ()=>{ cv.width = cv.offsetWidth; cv.height = cv.offsetHeight; };
  fit(); window.addEventListener('resize', fit);
  const rnd = mulberry32(4242);
  const st = [];
  for (let i=0;i<160;i++) st.push({x:rnd(), y:rnd(), r:rnd()<.8?1:2, a:.2+rnd()*.7, s:.02+rnd()*.06});
  (function loop(t){
    if ($('menu').classList.contains('hidden')) return;
    g.clearRect(0,0,cv.width,cv.height);
    g.fillStyle = '#05070f'; g.fillRect(0,0,cv.width,cv.height);
    for (const s of st){
      const y = (s.y + (t*.00002*s.s*40)) % 1;
      g.fillStyle = 'rgba(180,215,255,'+(s.a*(.6+Math.sin(t/900+s.x*10)*.4))+')';
      g.fillRect((s.x*cv.width)|0, (y*cv.height)|0, s.r, s.r);
    }
    requestAnimationFrame(loop);
  })(0);
}

/* ═══════════════════════════════════════════════════════════════════
   FAZ 46 — KESİN TAM EKRAN
   Acode ve bazı Android WebView'ları native Fullscreen API'sini
   reddediyor. Artık iki katmanlı:
     1) Native (standart + webkit prefix)
     2) Başarısızsa CSS Faux-Fullscreen: konteyner position:fixed
        ile tüm görünüm alanına yayılır.
   Her iki yolda da resize tetiklenir ki Canvas yeni boyuta uysun.
   ═══════════════════════════════════════════════════════════════════ */
let FAUX_FULL = false;

function fauxFullOn(){
  document.documentElement.classList.add('fauxFull');
  if (document.body) document.body.classList.add('fauxFull');
  /* FAZ 54: oyun konteynerini de doğrudan hedefle */
  const gc = document.getElementById('game');
  if (gc) gc.classList.add('faux-fullscreen');
  FAUX_FULL = true;
}
function fauxFullOff(){
  const gc0 = document.getElementById('game');
  if (gc0) gc0.classList.remove('faux-fullscreen');
  document.documentElement.classList.remove('fauxFull');
  if (document.body) document.body.classList.remove('fauxFull');
  FAUX_FULL = false;
}
function isFullNow(){
  return !!(document.fullscreenElement || document.webkitFullscreenElement || FAUX_FULL);
}

/* ═══════════════════════════════════════════════════════════════════
   FAZ 54 — forceFullscreen()
   SENKRON çalışır: requestFullscreen çağrısı ile kullanıcı jesti
   arasına HİÇBİR await girmez. Promise döndürürse .then/.catch ile
   yakalanır — böylece user activation bağlamı korunur.
   Native reddedilirse CSS katmanı anında devreye girer.
   ═══════════════════════════════════════════════════════════════════ */
function forceFullscreen(){
  /* Zaten açıksa kapat */
  if (isFullNow()){
    try {
      const ex = document.exitFullscreen || document.webkitExitFullscreen;
      if (ex && (document.fullscreenElement || document.webkitFullscreenElement))
        ex.call(document);
    } catch(e){}
    fauxFullOff();
    setTimeout(()=>{ try{ View.resize(); }catch(e){} }, 260);
    return;
  }

  /* CSS katmanını HEMEN aç — native gelirse üstüne biner, gelmezse
     zaten tam ekran görüntüsü sağlanmış olur. Bekleme yok. */
  fauxFullOn();

  let istek = null;
  try {
    const el = document.documentElement;
    const fn = el.requestFullscreen || el.webkitRequestFullscreen ||
               el.mozRequestFullScreen || el.msRequestFullscreen;
    /* KRİTİK: doğrudan çağrı, await YOK */
    if (fn) istek = fn.call(el, {navigationUI:'hide'});
  } catch(e){ istek = null; }

  if (istek && typeof istek.then === 'function'){
    istek.then(()=>{
      /* Native başarılı: yönelim kilidi denenebilir */
      try {
        if (screen.orientation && screen.orientation.lock)
          screen.orientation.lock('landscape').catch(()=>{});
      } catch(e){}
    }).catch(()=>{
      /* Native reddedildi — CSS katmanı zaten açık, sorun yok */
    });
  }
  setTimeout(()=>{ try{ View.resize(); }catch(e){} }, 260);
}

async function toggleFull(){
  const acik = isFullNow();
  if (acik){
    /* ── ÇIKIŞ ── */
    try {
      const fn = document.exitFullscreen || document.webkitExitFullscreen;
      if (fn && (document.fullscreenElement || document.webkitFullscreenElement))
        await fn.call(document);
    } catch(e){}
    fauxFullOff();
    setTimeout(()=>View.resize(), 260);
    return;
  }

  /* ── GİRİŞ: önce native ── */
  let native = false;
  try{
    const el = document.documentElement;
    const fn = el.requestFullscreen || el.webkitRequestFullscreen;
    if (fn){
      await fn.call(el, {navigationUI:'hide'});
      native = !!(document.fullscreenElement || document.webkitFullscreenElement);
    }
    if (native && screen.orientation && screen.orientation.lock){
      try { await screen.orientation.lock('landscape'); } catch(e){}
    }
  } catch(e){ native = false; }

  /* ── Native reddedildiyse CSS yedeği ── */
  if (!native) fauxFullOn();
  setTimeout(()=>View.resize(), 260);
}

/* ---------- kayıt ---------- */
/* Depolama katmanı — ortama göre otomatik seçim:
   1) window.storage  : Claude artifact ortamı
   2) localStorage    : dosya tarayıcıda tek başına açıldığında
   3) bellek          : ikisi de yoksa (en azından oturum içinde çalışır)
   Ayrıca metin olarak dışa/içe aktarma her ortamda çalışır.        */
let MEM_SAVE = null;
/* FAZ 18: danışman tercihi — kalıcı depoda saklanır */
let ADVISOR_OFF = false;
/* FAZ 19: ses tercihi. Ses ancak kullanıcı etkileşiminde başlar
   (tarayıcı otomatik oynatma politikası), tercih kalıcı saklanır. */
let AUDIO_OFF = false;
/* FAZ 46: arka plan (yıldız tozu + bulutsu) açma/kapama */
let BG_OFF = false;
/* ═══════════════════════════════════════════════════════════════════
   FAZ 47 — HARİTA MODLARI
   'siyasi'    → imparatorluk sınır renkleri (varsayılan)
   'diplomasi' → oyuncuya göre ilişki renkleri
   'askeri'    → istihbarata göre kademeli filo rota vektörleri
   ═══════════════════════════════════════════════════════════════════ */
let MAP_MODE = 'siyasi';
/* FAZ 47: küçük olayları otomatik çöz (ekonomi + minör anomali) */
let AUTO_EVENT = false;

/* Diplomatik moda göre bir devletin rengi */
function diploColor(o){
  const e = G.p;
  if (!o || !e || o.id === e.id) return '#6ff2c8';
  if (o.wild) return '#7a8596';
  if (o.crisisSide) return '#5a2d8f';
  if (typeof isPariah === 'function' && isPariah(o)) return '#5a2d8f';
  if (e.war[o.id]) return '#ff5f6d';
  if (e.ally && e.ally[o.id]) return '#65e08a';
  if (typeof isVassal === 'function' && isVassal(o) && o.overlord === e.id) return '#65e08a';
  if ((e.pact && e.pact[o.id]) || (e.passage && e.passage[o.id])) return '#4fd8c4';
  return '#f2d452';
}
/* FAZ 46: arka plan tercihi kalıcı */
/* FAZ 47: otomatik olay tercihi kalıcı */
async function loadAutoEventPref(){
  try { const v = await storeGet('yh_autoev'); AUTO_EVENT = (v === 'on'); } catch(e){}
}
async function loadBgPref(){
  try {
    const v = await storeGet('yh_bg');
    BG_OFF = (v === 'off');
  } catch(e){}
}
async function loadAudioPref(){
  try {
    const v = await storeGet('yh_audio');
    AUDIO_OFF = (v === 'off');
    if (typeof AUDIO !== 'undefined') AUDIO.setMuted(AUDIO_OFF);
  } catch(err){ AUDIO_OFF = false; }
}
async function loadAdvisorPref(){
  try { const v = await storeGet('yh_advisor'); ADVISOR_OFF = (v === 'off'); }
  catch(err){ ADVISOR_OFF = false; }
}
function hasHostStore(){
  return !!(typeof window !== 'undefined' && window.storage &&
            typeof window.storage.set === 'function' &&
            typeof window.storage.get === 'function');
}
let _localOK = null;
function hasLocalStore(){
  if (_localOK !== null) return _localOK;
  _localOK = false;
  try {
    const ls = window.localStorage;
    if (ls){ ls.setItem('__yh_probe','1'); ls.removeItem('__yh_probe'); _localOK = true; }
  } catch(e){ _localOK = false; }
  return _localOK;
}
function storageKind(){
  if (hasHostStore()) return 'uygulama belleği';
  if (hasLocalStore()) return 'tarayıcı belleği';
  return 'yalnızca oturum';
}
async function storeSet(k,v){
  MEM_SAVE = v;
  let ok = false;
  if (hasHostStore()){
    try { await window.storage.set(k, v); ok = true; } catch(e){}
  }
  if (!ok && hasLocalStore()){
    try { window.localStorage.setItem(k, v); ok = true; } catch(e){}
  }
  return ok || !!MEM_SAVE;
}
async function storeGet(k){
  if (hasHostStore()){
    try { const r = await window.storage.get(k); if (r && r.value) return r.value; } catch(e){}
  }
  if (hasLocalStore()){
    try { const v = window.localStorage.getItem(k); if (v) return v; } catch(e){}
  }
  return MEM_SAVE;
}

function serialize(){
  return JSON.stringify({
    v:3, cfg:G.cfg, day:G.day, year:G.year, month:G.month, seed:G.seed, log:G.log, rs:RND_STATE,
    sys: G.sys.map(s=>({i:s.id, x:s.x, y:s.y, n:s.name, st:STARS.indexOf(s.star),
      p:s.planets, l:s.lanes, o:s.owner, sv:s.surv, se:s.seen, q:s.queue, an:s.anom, ak:s.anomK, d:s.def})),
    emps: G.emps, fl: G.fleets, nf: G.nextFleet
  });
}
function deserialize(txt){
  const d = JSON.parse(txt);
  if (!d || !d.sys) return false;
  G.cfg = d.cfg; G.day = d.day; G.year = d.year; G.month = d.month;
  G.seed = d.seed; G.log = d.log || [];
  if (typeof d.rs === 'number') rndSeed(d.rs);
  G.sys = d.sys.map(s=>({
    id:s.i, x:s.x, y:s.y, name:s.n, star:STARS[s.st]||STARS[0], planets:s.p,
    lanes:s.l, owner:s.o, surv:s.sv, seen:s.se, queue:s.q, anom:s.an,
    anomK:s.ak || 'sinyal', def:s.d||0
  }));
  G.emps = d.emps; G.fleets = d.fl; G.nextFleet = d.nf;
  G.p = G.emps[0];
  View.sel = null; View.selSys = null; View.route = false; View.routed = false;
  G.over = null; G.speed = 0;
  G.nebula = ART.nebula(G.seed, 128, 128);
  G.emps.forEach(x=>{ x._prof = null; recalcMods(x); });
  updateVision();
  economyTick(true);
  return true;
}
/* --- kaydı gerçek dosya olarak indir (her ortamda çalışır) --- */
function downloadSave(){
  try {
    const txt = serialize();
    const blob = new Blob([txt], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'yildiz-hanedani-' + G.year + '-' + String(G.month).padStart(2,'0') + '.sav';
    document.body.appendChild(a);
    a.click();
    setTimeout(()=>{ try{ URL.revokeObjectURL(url); a.remove(); }catch(e){} }, 1500);
    return true;
  } catch(e){ return false; }
}
/* --- dosyadan yükle --- */
function uploadSave(cb){
  try {
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = '.sav,.json,.txt,application/json,text/plain';
    inp.style.display = 'none';
    inp.addEventListener('change', ()=>{
      const f = inp.files && inp.files[0];
      if (!f){ cb(null); return; }
      const r = new FileReader();
      r.onload = ()=> cb(String(r.result||''));
      r.onerror = ()=> cb(null);
      r.readAsText(f);
      setTimeout(()=>{ try{ inp.remove(); }catch(e){} }, 2000);
    });
    document.body.appendChild(inp);
    inp.click();
  } catch(e){ cb(null); }
}
/* --- depolamanın gerçekten çalışıp çalışmadığını sına --- */
async function storageDiag(){
  const out = {host:false, local:false, why:''};
  if (hasHostStore()){
    try {
      await window.storage.set('__yh_diag', 'x');
      const r = await window.storage.get('__yh_diag');
      out.host = !!(r && r.value === 'x');
    } catch(e){ out.why = 'uygulama deposu reddetti'; }
  }
  try {
    window.localStorage.setItem('__yh_diag','x');
    out.local = window.localStorage.getItem('__yh_diag') === 'x';
    window.localStorage.removeItem('__yh_diag');
  } catch(e){
    out.why = out.why || 'tarayıcı deposu kapalı (dosya content:// adresinden açılmış olabilir)';
  }
  return out;
}

async function saveGame(){
  try { return await storeSet('yildiz:save', serialize()); }
  catch(e){ return false; }
}
async function loadGame(){
  try {
    const t = await storeGet('yildiz:save');
    if (!t) return false;
    return deserialize(t);
  } catch(e){ return false; }
}

/* ---------- oyunu başlat ---------- */
function startGame(){
  setupGame({...CFG});
  if (CFG.mizac) applyChosenPersona(G.p, CFG.mizac);   // seçilen mizacı sabitle
  enterGame();
}
function enterGame(fromSave){
  $('menu').classList.add('hidden');
  $('game').classList.remove('hidden');
  View.init();
  View.fit();
  UI.boot();
  UI.setSpeed(2);
  View.selSys = G.sys[G.p.home];
  UI.refresh();
  UI.checkOrient();
  if (!fromSave) say('Yıl ' + G.year + ' — ' + G.p.name + ' yıldızlara açılıyor', 'win');
  /* FAZ 18: ilk turda danışman. Oyunu duraklatır ama kilitlemez —
     küçültülebilir, kapatılabilir, kalıcı susturulabilir. */
  /* Kayıttan girişte danışman açılmaz — oyuncu zaten oyunu biliyor */
  if (!ADVISOR_OFF && !fromSave && G.day < 1){
    setTimeout(()=>{ try { UI.advisorOpen(); } catch(err){} }, 420);
  }
  if (!LOOP.on){ LOOP.on = true; requestAnimationFrame(frame); }
}

/* ---------- ana döngü ---------- */
const LOOP = {on:false, last:0, acc:0, uiAcc:0, panAcc:0, touch:0, aiIdx:0};
/* ═══════════════════════════════════════════════════════════════════
   FAZ 17 — DOKUNMATİK ARAÇ İPUCU
   Fare olmayan cihazlarda hover çalışmaz. Basılı tutunca (450 ms)
   title metni balon olarak açılır, bırakınca kapanır. Mevcut
   pointer olay zincirine eklenir — yeni dinleyici katmanı kurulmaz. */
(function(){
  let hintEl = null, hintTimer = null;
  const kapat = () => {
    if (hintTimer){ clearTimeout(hintTimer); hintTimer = null; }
    if (hintEl){ hintEl.classList.remove('hint', 'hintL'); hintEl = null; }
  };
  document.addEventListener('pointerdown', ev => {
    /* Yalnızca dokunmatikte; farede zaten hover var */
    if (ev.pointerType === 'mouse') return;
    const t = ev.target && ev.target.closest ? ev.target.closest('[title]') : null;
    if (!t || !t.getAttribute('title')) return;
    hintTimer = setTimeout(() => {
      hintEl = t;
      /* Ekranın sağ yarısındaysa balon sola açılsın — taşmasın */
      const r = t.getBoundingClientRect();
      if (r.left > window.innerWidth * .55) t.classList.add('hintL');
      t.classList.add('hint');
    }, 450);
  }, {passive:true});
  ['pointerup','pointercancel','pointerleave','scroll'].forEach(ev =>
    document.addEventListener(ev, kapat, {passive:true, capture:true}));
})();

/* ═══════════════════════════════════════════════════════════════════
   FAZ 19 — TARAYICI OTOMATİK OYNATMA POLİTİKASI
   AudioContext yalnızca gerçek bir kullanıcı jestiyle başlatılabilir.
   İlk dokunuş/tıklama/tuş bunu tetikler ve dinleyici kendini söker.
   Kurulum menüsündeki ilk tıklama da buna dahil — yani oyuncu daha
   Danışman'ı görmeden ses hazır olur. */
(function(){
  const uyandir = () => {
    if (typeof AUDIO === 'undefined') return;
    try { if (!AUDIO_OFF) AUDIO.start(); else AUDIO.setMuted(true); } catch(e){}
    ['pointerdown','keydown','touchstart'].forEach(ev =>
      document.removeEventListener(ev, uyandir, true));
  };
  ['pointerdown','keydown','touchstart'].forEach(ev =>
    document.addEventListener(ev, uyandir, true));
})();

/* Sekme arkaplandayken sesi askıya al — pil ve CPU tasarrufu */
document.addEventListener('visibilitychange', ()=>{
  if (typeof AUDIO === 'undefined') return;
  try { document.hidden ? AUDIO.suspend() : AUDIO.resume(); } catch(e){}
});

document.addEventListener('pointerdown', ()=>{ LOOP.touch = performance.now(); }, true);

/* ═══════════════════════════════════════════════════════════════════
   FAZ 17 — DOKUNMATİK ARAÇ İPUCU
   Fare yoksa hover çalışmaz; araç çubuğu butonlarının ne işe
   yaradığı mobilde görünmüyordu. Basılı tutunca ipucu belirir,
   bırakınca kaybolur. Fareli cihazlarda bu kod hiç devreye girmez.
   ═══════════════════════════════════════════════════════════════════ */
(function(){
  let tipTimer = null, tipEl = null;
  const kapat = () => {
    if (tipTimer){ clearTimeout(tipTimer); tipTimer = null; }
    if (tipEl){ tipEl.classList.remove('tipOn'); tipEl = null; }
  };
  document.addEventListener('pointerdown', ev => {
    /* Yalnızca dokunmatik girişte ve yalnızca title'ı olan araçlarda */
    if (ev.pointerType === 'mouse') return;
    const t = ev.target && ev.target.closest ? ev.target.closest('.tool[title]') : null;
    if (!t) return;
    kapat();
    tipEl = t;
    tipTimer = setTimeout(() => { if (tipEl) tipEl.classList.add('tipOn'); }, 380);
  }, true);
  ['pointerup','pointercancel','pointerleave','scroll'].forEach(ev =>
    document.addEventListener(ev, kapat, true));
})();
function frame(t){
  const dt = Math.min(.06, (t - LOOP.last)/1000) || 0;
  LOOP.last = t;

  if (G.speed > 0 && !G.over){
    const days = SPEEDS[G.speed] * dt;
    const prevMonth = Math.floor(G.day/30);
    G.day += days;
    dailyTick(days);
    structTick(days);
    colonyBuildTick(days);          // FAZ 13: gezegen inşaat kuyruğu
    autoExploreTick();
    if (Math.floor(G.day/30) > prevMonth) monthTick();
  }

  View.draw(t);
  UI.paintSprites();

  if (View.sel && G.fleets.indexOf(View.sel) < 0) View.sel = null;

  LOOP.uiAcc += dt; LOOP.panAcc += dt;
  if (!$('game').classList.contains('hidden')){
    if (LOOP.uiAcc > .40){ LOOP.uiAcc = 0; UI.tick(); }
    if (LOOP.panAcc > 2.2 && performance.now() - LOOP.touch > 1600){
      LOOP.panAcc = 0; UI.keepScroll = true; UI.refresh();
    }
  }
  requestAnimationFrame(frame);
}

function monthTick(){
  G.month++;
  if (G.month > 12){ G.month = 1; G.year++; }
  economyTick(false);
  raidTick();
  envoyTick();
  /* FAZ 27: işgal dokunulmazlığı sayacı. Tek geçiş, çok ucuz. */
  for (const sy of G.sys)
    for (const pl of sy.planets){
      if (pl.recent_conquest > 0) pl.recent_conquest--;
      if (pl.martial_law > 0) pl.martial_law--;      // FAZ 29
    }
  attritionTick();                // ikmal hattı yıpranması
  upheavalTick();                 // galaktik çalkantılar
  diploTick();                    // hafıza + ittifak gözden geçirme + savaş meclisi
  spyTick();
  fakeTick();
  facTick();
  councilTick();
  crisisTick();
  warExhTick();
  planetCharTick();
  tributeTick();
  tradeFlowTick();
  fedTick();
  borderFriction();
  updateVision();
  // yapay zekâ — her ay bir imparatorluk (yük dağıtımı)
  const ais = G.emps.filter(e=>e.ai && !e.dead);
  for (const e of ais) aiTurn(e);
  // bekleyen hikâye bölümleri zamanı gelince bildirilir
  if (G.chainQueue && G.chainQueue.length){
    for (let i = G.chainQueue.length - 1; i >= 0; i--){
      if (G.day >= G.chainQueue[i].at){
        const q = G.chainQueue.splice(i, 1)[0];
        UI.chain(q.id);
      }
    }
  }
  if (G.month % 2 === 0) maybeEvent();
  if (G.month === 1 && G.autoSave !== false && G.year > 2210){
    saveGame().then(ok => { if (ok) say('Otomatik kayıt — ' + G.year); });
  }
  /* HOTFIX 23.1 — KORSAN KORUMASI
     Korsanlar ve Yırtıcılar TANIM GEREĞİ gezegensiz doğar; koloni
     sayısına bakan silme kuralı onları daha ilk aylarda yok ediyor
     ve haritada öksüz filolar bırakıyordu. Kriz tarafı (Hiçlik
     Sürüsü) de aynı sebeple korunmalı. */
  /* ═══ FAZ 24: KORSAN FİLO TAVANI ═══
     Hotfix 23.1'de korsanlar ölmekten kurtuldu ve bir tohumda
     278 filoya kadar çıktılar — bellek ve tik maliyeti şişiyordu.
     Katı tavan: en zayıf filolar dağıtılır, korsanlık sürer. */
  if (typeof WILD_FLEET_CAP !== 'undefined'){
    for (const w of G.emps){
      if (!w.wild || w.dead) continue;
      const mine = G.fleets.filter(f => f.e === w.id && f.ships.length);
      if (mine.length <= WILD_FLEET_CAP) continue;
      mine.sort((a, b) => fleetPower(a) - fleetPower(b));
      const kes = mine.length - WILD_FLEET_CAP;
      const dagit = new Set(mine.slice(0, kes));
      G.fleets = G.fleets.filter(f => !dagit.has(f));
    }
  }

  for (const e of G.emps){
    if (e.dead || e.id === 0) continue;
    if (e.wild || e.crisisSide) continue;        // gezegensiz yaşarlar
    if (e.colonies.length) continue;
    e.dead = true;
    say(e.name + ' tarih sahnesinden silindi', 'war');
    /* Ölen imparatorluğun arkasında öksüz veri bırakma */
    if (typeof purgeEmpire === 'function') purgeEmpire(e);
  }
  if (!G.p.colonies.length && !G.over){
    G.over = {e:G.p, txt:'Son kolonin de düştü. Hanedanın sona erdi.', win:false};
    UI.gameOver();
    return;                 // FAZ 53: oyun bitti, AI taramasına gerek yok
  }
  /* ═══ FAZ 51: AI ZAFERLERİ ═══
     ÖLÇÜM (100 yıl, tohum 4242): üç AI zafer eşiğini aşmıştı
     (HEGEMONYA %105, KONSEY %129, BİLİM %100) ama winHold hep
     0/18 kalıyordu — checkVictory YALNIZ OYUNCU için çağrılıyordu.
     AI'lar hiçbir zaman kazanamıyordu; oyun 100 yıl boyunca
     sonuçsuz sürüyordu. Artık herkes yarışta. */
  checkVictory(G.p, 'tick');
  if (!G.over) for (const x of G.emps){
    if (x.dead || x.wild || x.crisisSide || x.id === 0) continue;
    checkVictory(x, 'tick');
    if (G.over) break;
  }
}

/* ---------- açılış ---------- */
window.addEventListener('pagehide', ()=>{
  try {
    if (G.p && G.sys.length && G.autoSave !== false){
      const txt = serialize();
      MEM_SAVE = txt;
      if (!hasHostStore() && hasLocalStore()) window.localStorage.setItem('yildiz:save', txt);
    }
  } catch(e){}
});
document.addEventListener('visibilitychange', ()=>{
  if (document.visibilityState === 'hidden' && G.p && G.sys.length && G.autoSave !== false){
    try { saveGame(); } catch(e){}
  }
});

window.addEventListener('load', ()=>{
  loadAdvisorPref();               // FAZ 18: danışman tercihini oku
  loadAudioPref();
  loadBgPref();                 // FAZ 19: ses tercihini oku
  loadAutoEventPref();          // FAZ 47: otomatik olay tercihi
  /* FAZ 20: önce ANA MENÜ. Kurulum ekranı arkada hazır bekler. */
  $('menu').classList.add('hidden');
  TITLE.start();
  refreshContinueBtn();
  document.addEventListener('fullscreenchange', ()=>setTimeout(()=>View.cv&&View.resize(),200));
  window.addEventListener('orientationchange', ()=>setTimeout(()=>{ View.cv&&View.resize(); UI.checkOrient(); },320));
});

/* ═══════════════════════════════════════════════════════════════════
   FAZ 10 — DİNAMİK GALAKTİK ÇALKANTILAR
   Mevcut kriz altyapısını (G.crisis / crisisTick) taklit etmez, onun
   YANINDA çalışır: Hiçlik Sürüsü tek ve nihai tehdittir; çalkantılar
   ise orta oyunu canlı tutan, geçici ve galaksi çapında olaylardır.
   Her biri belli bir süre yürürlükte kalır ve recalcMods üzerinden
   ekonomiyi, göç yoluyla nüfusu ya da diplomasiyi büker.
   ═══════════════════════════════════════════════════════════════════ */

const UPHEAVALS = {
  goc:{
    n:'Büyük Göç Dalgası', ico:'🚀', sure:[36, 72],
    d:'Sınır bölgelerinden kaçan milyonlar yerleşik dünyalara akıyor. ' +
      'Nüfus hızla artıyor ama istikrar sarsılıyor.',
    mods:{ stab:-8 },
    /* Her ay küçük nüfus artışı — göç, koloni büyümesini hızlandırır */
    tick(e){
      for (const c of e.colonies){
        const pl = G.sys[c.s] && G.sys[c.s].planets[c.p];
        if (!pl || !pl.col) continue;
        /* col.cap mevcut nüfus tavanı — economy.js'in kullandığı alan */
        if (pl.col.pop < pl.col.cap) pl.col.pop += 0.055;
      }
    }
  },
  cokus:{
    n:'Galaktik Ekonomik Çöküş', ico:'📉', sure:[30, 60],
    d:'Ticaret ağları çöktü, krediler dondu. Tüm galakside enerji ve ' +
      'tüketim malı üretimi düştü; kervanlar yollarda bekliyor.',
    mods:{ eneMul:-.22, minMul:-.10, araMul:-.08 }
  },
  salgin:{
    n:'Yıldızlararası Salgın', ico:'☣', sure:[24, 48],
    d:'Yeni bir patojen gemi rotalarını izleyerek yayılıyor. ' +
      'Yiyecek üretimi ve nüfus artışı sekteye uğradı.',
    mods:{ yiyMul:-.25, stab:-6 },
    tick(e){
      /* Kalabalık koloniler daha çok kaybeder */
      for (const c of e.colonies){
        const pl = G.sys[c.s] && G.sys[c.s].planets[c.p];
        if (!pl || !pl.col || pl.col.pop < 4) continue;
        if (rnd() < .04) pl.col.pop = Math.max(1, pl.col.pop - 0.35);
      }
    }
  },
  altincag:{
    n:'Bilimsel Altın Çağ', ico:'✦', sure:[36, 60],
    d:'Paylaşılan bir keşif galaksiyi ateşledi. Araştırma çıktısı ' +
      'her yerde arttı; laboratuvarlar gece gündüz çalışıyor.',
    mods:{ araMul:.30, etkFlat:1 }
  },
  madenpat:{
    n:'Mineral Patlaması', ico:'⛏', sure:[30, 54],
    d:'Yeni damar tespit yöntemi yayıldı; madenler beklenenin ' +
      'çok üstünde veriyor. Alaşım tersaneleri dolup taşıyor.',
    mods:{ minMul:.28, alaMul:.15 }
  },
  korsanCagi:{
    n:'Korsan Çağı', ico:'☠', sure:[36, 66],
    d:'Merkezî otoritenin zayıfladığı yerlerde korsanlık patladı. ' +
      'Ticaret kervanları çok daha sık yağmalanıyor.',
    mods:{ eneMul:-.12 },
    /* Korsan yuvaları güçlenir; mevcut raid sistemine bağlanır */
    onStart(){
      for (const sy of G.sys){
        if (sy.nest && rnd() < .5) sy.nestPow = (sy.nestPow || 1) * 1.6;
      }
    }
  },
  dinicoskus:{
    n:'Ruhani Uyanış', ico:'✧', sure:[30, 54],
    d:'Galaksi çapında bir inanç dalgası yayılıyor. İstikrar yükseldi, ' +
      'ama materyalist devletler huzursuz.',
    mods:{ stab:10, etkFlat:2 }
  }
};

/* Çalkantı ne zaman başlayabilir? Orta oyun ve sonrası. */
const UPHEAVAL_FIRST = 90;      // ilk çalkantı için en erken tur
const UPHEAVAL_GAP   = 48;      // iki çalkantı arasında en az bu kadar tur

function upheavalActive(){ return !!(G.upheaval && G.upheaval.left > 0); }
function upheavalInfo(){
  return upheavalActive() ? UPHEAVALS[G.upheaval.k] : null;
}

/* recalcMods buradan besleniyor — mevcut modifier boru hattına girer */
function upheavalMods(e){
  const U = upheavalInfo();
  if (!U || !U.mods) return {};
  const out = {};
  for (const k in U.mods) out[k] = U.mods[k];

  /* Mizaç, çalkantıyı farklı yaşar — aynı olay herkese aynı gelmez */
  if (typeof personaOf === 'function'){
    const P = personaOf(e);
    if (G.upheaval.k === 'cokus'){
      /* Tüccar krizde daha çok kaybeder, izolasyonist daha az */
      if (P.n === 'Tüccar')            out.eneMul = (out.eneMul || 0) - .08;
      else if (P.n === 'İzolasyonist') out.eneMul = (out.eneMul || 0) + .12;
    }
    if (G.upheaval.k === 'goc'){
      /* Açık sınırlı devletler göçten kazanır, kapalılar zorlanır */
      if (P.n === 'İzolasyonist') out.stab = (out.stab || 0) - 5;
      else if (P.n === 'Tüccar')   out.stab = (out.stab || 0) + 4;
    }
    if (G.upheaval.k === 'dinicoskus' && P.n === 'Tüccar')
      out.stab = (out.stab || 0) - 6;
  }
  return out;
}

/* Aylık çalkantı tiki — monthTick çağırır */
function upheavalTick(){
  G.upAge = (G.upAge || 0) + 1;

  /* Yürürlükteki çalkantı */
  if (upheavalActive()){
    const U = UPHEAVALS[G.upheaval.k];
    if (U && U.tick){
      for (const e of G.emps){
        if (e.dead || e.wild) continue;
        U.tick(e);
      }
    }
    G.upheaval.left--;
    if (G.upheaval.left <= 0){
      const bitti = UPHEAVALS[G.upheaval.k];
      G.upheaval = null;
      G.upLast = G.upAge;
      G.emps.forEach(x => { if (!x.dead) recalcMods(x); });
      say((bitti ? bitti.ico + ' ' + bitti.n : 'Çalkantı') + ' sona erdi — galaksi normale dönüyor');
    }
    return;
  }

  /* Yeni çalkantı doğabilir mi? */
  if (G.upAge < UPHEAVAL_FIRST) return;
  if (G.upLast !== undefined && G.upAge - G.upLast < UPHEAVAL_GAP) return;
  /* Hiçlik Sürüsü sahnedeyken galaksinin başka derdi olmaz */
  if (typeof crisisActive === 'function' && crisisActive()) return;
  if (rnd() > .035) return;                       // ayda ~%3,5

  const keys = Object.keys(UPHEAVALS);
  const k = keys[Math.floor(rnd() * keys.length)];
  const U = UPHEAVALS[k];
  const sure = U.sure[0] + Math.floor(rnd() * (U.sure[1] - U.sure[0] + 1));
  G.upheaval = {k, left: sure, total: sure, at: G.upAge};
  if (U.onStart) U.onStart();
  G.emps.forEach(x => { if (!x.dead) recalcMods(x); });
  say(U.ico + ' ' + U.n.toUpperCase() + ' — ' + U.d, 'win');
}


/* ═══════════════════════════════════════════════════════════════════
   FAZ 20 — SİNEMATİK ANA MENÜ
   Arka planda gerçek bir galaksi ağı yavaşça döner. Oyunun asıl
   render motoru KULLANILMAZ (o UI'a bağımlı); menüye özel, hafif
   ve tek seferlik üretilen bir yıldız ağı çizilir.

   PERFORMANS: 4GB RAM'li cihaz gözetildi.
     · Yıldız ve bağlantılar BİR KEZ üretilir, her karede yeniden
       hesaplanmaz — yalnızca döndürme matrisi uygulanır.
     · Kare hızı 30 FPS'e sınırlandı (menüde 60 FPS gereksiz).
     · Menü kapanınca döngü DURUR (rAF iptal edilir) ve tampon
       serbest bırakılır.
     · Sekme arka plandayken çizim atlanır.
   ═══════════════════════════════════════════════════════════════════ */
const TITLE = {
  raf: 0, cv: null, g: null, sys: [], lanes: [], last: 0, running: false,

  build(){
    const rnd = mulberry32(20240709);
    this.sys = []; this.lanes = [];
    /* Sarmal kollu bir galaksi — oyunun kendi üretimini taklit eder */
    const N = 130, KOL = 3;
    for (let i = 0; i < N; i++){
      const t = i / N;
      const kol = i % KOL;
      const a = t * 5.4 + kol * (Math.PI * 2 / KOL) + (rnd() - .5) * .34;
      const r = .10 + t * .82 + (rnd() - .5) * .09;
      this.sys.push({
        a, r,
        s: .55 + rnd() * 1.5,                       // yıldız yarıçapı
        c: rnd() < .13 ? '#ff9b3d' : rnd() < .22 ? '#8b7bff'
          : rnd() < .34 ? '#6ff2c8' : '#d7e3f4',
        tw: rnd() * 6.28                            // parıltı fazı
      });
    }
    /* Bağlantılar: yalnızca yakın komşular, bir kez hesaplanır */
    for (let i = 0; i < N; i++){
      for (let j = i + 1; j < N; j++){
        const A = this.sys[i], B = this.sys[j];
        const dx = Math.cos(A.a) * A.r - Math.cos(B.a) * B.r;
        const dy = Math.sin(A.a) * A.r - Math.sin(B.a) * B.r;
        if (dx * dx + dy * dy < .020) this.lanes.push([i, j]);
      }
    }
  },

  start(){
    this.cv = $('titleSky');
    if (!this.cv) return;
    this.g = this.cv.getContext('2d', {alpha: false});
    if (!this.sys.length) this.build();
    this.resize();
    if (!this._onResize){
      this._onResize = () => this.resize();
      window.addEventListener('resize', this._onResize);
    }
    this.running = true;
    this.last = 0;
    const loop = (t) => {
      if (!this.running) return;
      this.raf = requestAnimationFrame(loop);
      if (document.hidden) return;                  // arka planda çizme
      if (t - this.last < 33) return;               // ~30 FPS tavan
      this.last = t;
      this.draw(t);
    };
    this.raf = requestAnimationFrame(loop);
  },

  stop(){
    this.running = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
    /* Belleği bırak — oyun başlarken menü verisi tutulmasın */
    this.sys = []; this.lanes = [];
    if (this._onResize){
      window.removeEventListener('resize', this._onResize);
      this._onResize = null;
    }
    this.g = null; this.cv = null;
  },

  resize(){
    if (!this.cv) return;
    /* Yüksek DPI'da tam çözünürlük pahalı; 1.5 ile sınırlanıyor */
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    this.cv.width  = Math.max(1, Math.floor(this.cv.offsetWidth  * dpr));
    this.cv.height = Math.max(1, Math.floor(this.cv.offsetHeight * dpr));
    this.dpr = dpr;
  },

  draw(t){
    const g = this.g, W = this.cv.width, H = this.cv.height;
    if (!g || !W || !H) return;
    g.fillStyle = '#04060d';
    g.fillRect(0, 0, W, H);

    /* Çok yavaş dönüş: tam tur ≈ 4 dakika. Sinematik, baş döndürmez. */
    const rot = t * 0.000026;
    const cx = W / 2, cy = H / 2;
    const R = Math.min(W, H) * .46;
    /* Hafif eliptik izdüşüm — galaksiye eğik bakıyormuşuz gibi */
    const sy = 0.42;

    /* Konumlar bir kez hesaplanıp iki geçişte kullanılır */
    const px = new Float32Array(this.sys.length);
    const py = new Float32Array(this.sys.length);
    for (let i = 0; i < this.sys.length; i++){
      const s = this.sys[i];
      const a = s.a + rot;
      px[i] = cx + Math.cos(a) * s.r * R;
      py[i] = cy + Math.sin(a) * s.r * R * sy;
    }

    /* 1. KATMAN — hiper yollar */
    g.strokeStyle = 'rgba(60,92,140,.20)';
    g.lineWidth = Math.max(1, this.dpr * .7);
    g.beginPath();
    for (const [i, j] of this.lanes){
      g.moveTo(px[i], py[i]);
      g.lineTo(px[j], py[j]);
    }
    g.stroke();

    /* 2. KATMAN — yıldızlar (tek geçiş, gölge yok) */
    for (let i = 0; i < this.sys.length; i++){
      const s = this.sys[i];
      const tw = .55 + .45 * Math.sin(t / 1100 + s.tw);
      g.fillStyle = s.c;
      g.globalAlpha = tw * .9;
      const r = s.s * this.dpr;
      g.fillRect(px[i] - r, py[i] - r, r * 2, r * 2);
    }
    g.globalAlpha = 1;

    /* 3. KATMAN — merkez çekirdeğin sıcak parıltısı */
    const gr = g.createRadialGradient(cx, cy, 0, cx, cy, R * .30);
    gr.addColorStop(0, 'rgba(255,190,120,.16)');
    gr.addColorStop(1, 'rgba(255,190,120,0)');
    g.fillStyle = gr;
    g.fillRect(cx - R * .35, cy - R * .35 * sy - 20, R * .7, R * .7 * sy + 40);
  }
};

/* Kayıt var mı? Ana menü açılırken bir kez sorulur ve sonuç
   saklanır — buton her karede depoyu yoklamaz. */
async function refreshContinueBtn(){
  const btn = $('tContBtn'), sub = $('tContSub');
  if (!btn) return false;
  let bilgi = null;
  try {
    const t = await storeGet('yildiz:save');
    if (t){
      /* Kaydı ÇÖZMEDEN başlığını oku — hızlı ve güvenli */
      const d = JSON.parse(t);
      bilgi = {yil: d.year, ad: (d.emps && d.emps[0] && d.emps[0].name) || 'Hanedan'};
    }
  } catch(e){ bilgi = null; }
  if (bilgi){
    btn.disabled = false;
    if (sub) sub.textContent = bilgi.ad + ' · yıl ' + bilgi.yil;
  } else {
    btn.disabled = true;
    if (sub) sub.textContent = 'Kayıtlı oyun bulunamadı';
  }
  return !!bilgi;
}

/* Ana menüyü kapat ve hedef ekrana geç */
/* Oyundan ana menüye dön — TITLE yeniden kurulur */
function backToTitle(){
  if (typeof TITLE === 'undefined') return;
  $('game').classList.add('hidden');
  $('menu').classList.add('hidden');
  const el = $('title');
  if (el) el.classList.remove('hidden');
  TITLE.start();
  refreshContinueBtn();
}

function leaveTitle(hedef){
  TITLE.stop();
  const el = $('title');
  if (el) el.classList.add('hidden');
  if (hedef === 'setup'){
    $('menu').classList.remove('hidden');
    $('game').classList.add('hidden');
    safeRenderSetup();
    menuStars();
  }
}
