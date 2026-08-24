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
    e:{dmgMul:.15, araMul:-.10},          // FAZ 72
    grudge:1.30,      // kin daha ağır birikir
    forgive:.75,      // yaraları daha yavaş unutur
    warBias:+.20,     // savaş iştahına doğrudan eklenir
    lifeSpace:.70,    // %85 kuralını .70'e çeker → çok daha erken tepki
    roomTol:1,        // yerleşecek 1 yer kalsa bile talep edebilir
    tradeVote:+.05,
    honorCare:.60,    // itibarını az önemser, ihaneti göze alır
    d:'Güç dilinden anlar. Kin tutar, komşusuna erken diş gösterir.'},
  tuccar:{n:'Tüccar', ico:'💰', col:'#f2d452',
    e:{eneMul:.20, tradeMul:.20, hullMul:-.10},   // FAZ 72
    grudge:.85, forgive:1.25, warBias:-.15, lifeSpace:.95, roomTol:0,
    tradeVote:+.55, honorCare:1.15,
    d:'Savaş masraftır. Yollar açık kaldığı sürece barış kârlıdır.'},
  pasifist:{n:'Pasifist', ico:'🕊', col:'#65e08a',
    e:{etkMul:.20, stab:20, shipSpeed:-.20},      // FAZ 72
    grudge:.55, forgive:1.60, warBias:-.30, lifeSpace:1.05, roomTol:0,
    tradeVote:+.35, honorCare:1.35,
    d:'Kin tutmakta zorlanır, verdiği sözü tutmaya özen gösterir.'},
  yayilmaci:{n:'Yayılmacı', ico:'🌱', col:'#96b13a',
    e:{borderMul:.25, newColStab:25},             // FAZ 72
    grudge:1.05, forgive:.95, warBias:+.10, lifeSpace:.85, roomTol:0,
    tradeVote:+.10, honorCare:.85,
    d:'Büyümek zorundadır. Yer kalmayınca komşusunun toprağına bakar.'},
  izolasyonist:{n:'Fanatik Arındırıcılar', ico:'☣', col:'#8b7bff',
    grudge:1.45, forgive:.55, warBias:+.35, lifeSpace:.60, roomTol:2,
    tradeVote:-99,    // ortak standartlara ASLA evet demez
    honorCare:.30, kilitli:true,     // FAZ 72: diplomasi ve pazar kapalı
    e:{dmgMul:.40, rofMul:.40, dipMul:-.90},
    d:'Galakside kendilerinden başkasına yer tanımazlar. Diplomasi ve ' +
      'pazar onlara kapalıdır — yalnız silah konuşur. Gemi hasarı ve ' +
      'atış hızı +%40.'},

  /* ═══ FAZ 72: ÜÇ YENİ DOKTRİN ═══
     Mevcut dördü (militarist, tuccar, pasifist, yayilmaci) korundu;
     izolasyonist "Fanatik Arındırıcılar" olarak yeniden tanımlandı
     (anahtar değişmedi — AI mantığı 6 yerde ona bağlı). */
  teknokrasi:{n:'Teknokrasi', ico:'🔬', col:'#5c9ef5',
    grudge:.95, forgive:1.10, warBias:-.12, lifeSpace:.95, roomTol:0,
    tradeVote:+.20, honorCare:1.05,
    e:{araMul:.30, sensor:2, shipSpeed:-.20},
    d:'Yönetim bilim insanlarının elindedir. Araştırma +%30, sensör ' +
      'menzili +2 — ama askerî gemi üretimi %20 yavaş.'},

  kriminal:{n:'Kriminal Sendika', ico:'🎭', col:'#c46bf0',
    grudge:1.15, forgive:.90, warBias:+.05, lifeSpace:.85, roomTol:1,
    tradeVote:+.10, honorCare:.35,
    e:{opCost:-.50, eneMul:.30, dipMul:-.40},
    d:'Gölgede işleyen bir ekonomi. Casusluk yarı fiyatına, enerji ' +
      '+%30 — ama masada kimse size güvenmez (diplomasi −%40).'},

  teokrasi:{n:'Kutsal Meclis', ico:'✟', col:'#f5c25c',
    grudge:1.25, forgive:.80, warBias:+.15, lifeSpace:.80, roomTol:1,
    tradeVote:-.10, honorCare:1.20, kutsal:true,
    e:{etkMul:.25, stab:15, araMul:-.20},
    d:'İnanç devletin kendisidir. Etki +%25, istikrar +15, bilim −%20. ' +
      'Kâfirlere Kutsal Savaş açmak etki gerektirmez — ama uzun barış ' +
      'halkı huzursuz eder.'}
};

/* Mizaç ırktan gelir, ama güçlü bir ideoloji onu ezer:
   kalıtım başlangıçtır, tercih sonuçtur. */
/* ═══ FAZ 72: DOKTRİN → IRK EŞLEMESİ ═══
   TÜR sekmesi kaldırıldı; ırk (yönetim biçimi) artık seçilen
   doktrinden türetiliyor. RACES verisi 41 yerde kullanıldığı için
   silinmedi — yalnız seçimi otomatikleşti. */
const DOCTRINE_RACE = {
  militarist  : 'klan',
  pasifist    : 'meclis',
  tuccar      : 'lonca',
  yayilmaci   : 'kasif',
  teknokrasi  : 'teknokrasi',
  kriminal    : 'lonca',
  teokrasi    : 'meclis',
  izolasyonist: 'klan'
};

/* ═══ FAZ 73: FANATİK ARINDIRICI KİLİDİ ═══
   Diplomasi ve pazar bu doktrine tamamen kapalıdır — hem
   oyuncu arayüzünde hem AI kararlarında. Tek kaynak burası. */
function isPurifier(e){
  if (!e) return false;
  const k = e.mizac || e._pers;
  return k === 'izolasyonist' ||
         !!(typeof PERSONAS !== 'undefined' && PERSONAS[k] && PERSONAS[k].kilitli);
}

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
  /* ═══ FAZ 72: TÜR SEKMESİNDEN TAŞINANLAR ═══ */
  hive:{
    n:'Kovan Zihni', ico:'🐝',
    d:'Tek bir irade, milyonlarca beden. Bireysel moral sorunu yoktur.',
    art:'İstikrar daima yüksek · nüfus büyümesi +%15 · diplomasi −%25',
    e:{stab:20, dipMul:-.25},
    habBonus:0, growMul:.15, yiyer:'yiyecek', kovan:true
  },
  machine:{
    n:'Makine Ağı', ico:'⚙',
    d:'Organik değil. Yiyecek yerine enerji tüketir, her dünyada çalışır.',
    art:'Enerji tüketir · her gezegende yaşar · büyüme −%20',
    e:{eneMul:-.15, hullMul:.15},
    habBonus:.35, growMul:-.20, yiyer:'enerji', makine:true
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
  /* FAZ 76: 'e5 Korsan Baskını' kaldırıldı — oyunda gerçek bir
     korsan sistemi (raidTick) zaten var; bu rastgele olay onunla
     çelişiyor ve "sınırda devriye görüldü" türü içi boş bir
     bildirim üretiyordu. */
];
/* =====================================================================
   SANAT — her piksel çalışma anında üretilir
   ===================================================================== */
/* FAZ 74: ART → map.js taşındı */
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
      /* ═══ FAZ 73: UZAY COĞRAFYASI ═══
         pulsar → kalkanlar çalışmaz, saf gövde savaşı
         nebula → hız yarıya iner, sensörler kör olur
         İkisi de nadir (%7 ve %9) ki özel kalsınlar. */
      /* FAZ 74: %7 → %10. Ölçümde 100 sistemde yalnız 3 pulsar
         çıkmıştı; taktik dar boğaz yaratacak kadar sık değildi. */
      pulsar: rnd() < .10,
      nebulaS: rnd() < .09,
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
    /* FAZ 72: doktrin anahtarları */
    etkMul:0, rofMul:0, shipSpeed:0, borderMul:0, newColStab:0,
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
  /* FAZ 72: doktrin bonusları — PERSONAS[x].e bloğu */
  if (typeof PERSONAS !== 'undefined'){
    const dk = PERSONAS[e.mizac] || PERSONAS[e._pers];
    if (dk && dk.e) add(dk.e);
  }
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
  /* FAZ 72: doktrin oyuncuya aktarılır — recalcMods bonusları
     PERSONAS[e.mizac].e bloğundan okuyor. */
  pe.mizac = cfg.mizac || 'yayilmaci';
  pe._pers = pe.mizac;
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
  /* FAZ 73: NEBULA — bulutsu içinde motorlar zorlanır, hız yarıya
     iner. Çıkışta normale döner; kalıcı bir ceza değil, coğrafya. */
  let neb = 1;
  const sid2 = f && f.sys >= 0 ? f.sys : (f && f.mv ? f.mv.to : -1);
  if (sid2 >= 0 && G.sys[sid2] && G.sys[sid2].nebulaS) neb = .5;
  return sp * 26 * (1 + e.mods.spdMul + relay) * fastDeployMul(f) * jump * neb;
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
/* ═══════════════════════════════════════════════════════════════════
   FAZ 63 — GALAKTİK GEÇİT LOJİSTİĞİ
   Kullanılabilir bir geçidi olan sistem, başkent gibi tam ikmal
   sağlar. Ağdaki geçitler arası mesafe SIFIR sayılır: bir uçtaki
   filo, diğer uçtaki tersanenin hattındaymış gibi beslenir.
   Güvenlik kilidi gateNetwork ile ortak — düşman geçidi işe yaramaz.
   ═══════════════════════════════════════════════════════════════════ */
function hasUsableGate(e, sys){
  if (!sys || !sys.built || sys.built.kapi === undefined) return false;
  if (sys.owner < 0) return false;
  if (sys.owner === e.id) return true;
  const o = G.emps[sys.owner];
  if (!o || o.dead || o.wild || o.crisisSide) return false;
  if (e.war[o.id]) return false;                       // düşman geçidi kapalı
  if (e.ally && e.ally[o.id]) return true;
  if (e.passage && e.passage[o.id]) return true;
  if (typeof isVassal === 'function'){
    if (isVassal(o) && o.overlord === e.id) return true;
    if (isVassal(e) && e.overlord === o.id) return true;
  }
  return false;
}

/* Bu devletin erişebildiği geçit sistemleri — günlük önbellekli */
function gateSupplyNodes(e){
  if (!e) return [];
  if (e._gateAt === G.day && e._gateList) return e._gateList;
  const liste = [];
  for (const sy of G.sys) if (hasUsableGate(e, sy)) liste.push(sy.id);
  e._gateAt = G.day; e._gateList = liste;
  return liste;
}

function supplyDistance(e, f){
  const sid = f.sys >= 0 ? f.sys : (f.mv ? f.mv.to : -1);
  if (sid < 0) return 0;
  if (isSupplyNode(e, G.sys[sid])) return 0;
  /* FAZ 63: geçit varsa mesafe sıfır — ağ tek nokta gibi davranır */
  const kapilar = gateSupplyNodes(e);
  if (kapilar.length){
    if (kapilar.indexOf(sid) >= 0) return 0;
    /* Geçide komşuysak da ağa bağlıyız sayılır (1 atlama) */
    const sy0 = G.sys[sid];
    if (sy0 && sy0.lanes)
      for (const l of sy0.lanes) if (kapilar.indexOf(l) >= 0) return 0;
  }
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
    /* FAZ 73: NEBULA — bulutsu içindeki bir sistemden KOMŞULARA
       bakılamaz. Sensörler yoğun gaz bulutunu delemiyor; oradaki
       filo yalnız bulunduğu sistemi görür. */
    /* DÜZELTME: `d > 0` koşulu filonun BULUNDUĞU sistemi muaf
       tutuyordu — oysa körlüğün asıl anlamı tam da orada. Bulutsu
       içindeki bir sistemden komşulara HİÇ bakılamaz. */
    const nebKor = !!G.sys[id].nebulaS;
    if (d < sensor && !nebKor)
      for (const l of G.sys[id].lanes) if (!seen.has(l)) q.push({id:l, d:d+1});
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
      /* ═══════════════════════════════════════════════════════════
         FAZ 75 — İKMAL SINIRINDA DUR
         Bilim ve inşaat gemileri keşfe çıkarken hattın dışına
         taşıp yıpranmayla kendilerini yok ediyorlardı. Artık
         SIÇRAMADAN ÖNCE bakılıyor: bir sonraki sistemde ikmal
         tamamen kopacaksa gemi durur, rotasını iptal eder ve
         oyuncuya haber verir.

         ÖLÇÜM DÜZELTMESİ: ilk eşiği %1 koymuştum ama fleetSupply
         asla SUPPLY_FLOOR'un (%40) altına inmiyor — eşik HİÇ
         tetiklenmiyordu ve gemi yine yıpranıp ölüyordu. Gerçek
         "ikmal tamamen kopuk" durumu TABANA ÇAKILMAKTIR.
         Eşik SUPPLY_FLOOR + küçük pay olarak düzeltildi.
         Savaş filoları ve kriz tarafları muaf: onlar zaten
         bilerek düşman toprağına giriyor. */
      /* ═══ FAZ 76 DÜZELTMESİ ═══
         Faz 75'te kural TÜM silahsız filolara uygulanıyordu ve
         KOLONİ/İNŞAAT gemilerini de durduruyordu. Ölçümde bir
         koloni gemisi hedefine varamadan sys 31'de takıldı —
         bu, uzak gezegenlere yerleşmeyi ve sınır genişletmeyi
         imkânsız kılıyordu.

         Oysa o gemilerin GÖREVİ zaten hattın ötesine geçmektir:
         yerleştikleri an orası ikmal noktası olur. Kural artık
         yalnız BİLİM gemilerine uygulanıyor — onların keşif
         gezisi hattı ilerletmez, yalnız yıpranır. */
      const eSup = empOf(f);
      const sivilKesif = !isArmed(f) && fleetHasRole(f, 'bilim') &&
                         !f.ships.some(sh => sh.c === 'kol' || sh.c === 'ins');
      if (eSup && !eSup.wild && !eSup.crisisSide && !f.combat &&
          typeof fleetSupply === 'function' && sivilKesif && !f.joinFleet){
        const sonra = fleetSupply(eSup, {sys: nxt, ships: f.ships, e: f.e});
        const taban = (typeof SUPPLY_FLOOR !== 'undefined') ? SUPPLY_FLOOR : .40;
        if (sonra <= taban + .015){
          f.path = [];
          f.stalled = true;
          if (!eSup.ai && !f._stallSaid){
            f._stallSaid = true;
            say('⚓ ' + (f.name || 'Filo') + ' ikmal sınırına ulaştı ve durdu — ' +
                G.sys[nxt].name + ' hattın tamamen dışında', 'war');
          }
          continue;
        }
        if (f.stalled){ delete f.stalled; delete f._stallSaid; }
      }
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
              say('⚓ İkmal ' + (ana.name || 'filoya') + ' katıldı');
            delete f.joinFleet; delete f.rallyTo;
          } else {
            /* ═══ FAZ 60: HAREKETLİ FİLOYU TAKİP ═══
               Hedef filo biz yoldayken başka sisteme gitmişse
               ikmal orada kalıp öksüz kalıyordu. Artık peşinden
               gidiyor: hedef nerede duruyorsa oraya yeni rota. */
            const izle = G.fleets.find(x => x.id === f.joinFleet && x.ships.length);
            if (izle && izle !== f){
              const varis = izle.sys >= 0 ? izle.sys : (izle.mv ? izle.mv.to : -1);
              if (varis >= 0 && varis !== f.sys && typeof orderMove === 'function'){
                orderMove(f, varis);
                f.rallyTo = varis;
                /* joinFleet korunur — varınca yine birleşmeyi dener */
              } else {
                delete f.joinFleet; delete f.rallyTo;
              }
            } else {
              delete f.joinFleet; delete f.rallyTo;   // hedef yok olmuş
            }
          }
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
      /* FAZ 75: ikmalin tamamen kesildiği yere otomatik gitme —
         orada yıpranıp yok oluyordu. Oyuncu elle yollayabilir. */
      if (typeof fleetSupply === 'function'){
        const tb = (typeof SUPPLY_FLOOR !== 'undefined') ? SUPPLY_FLOOR : .40;
        if (fleetSupply(e, {sys: sy.id, ships: f.ships, e: 0}) <= tb + .015) continue;
      }
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
      delete pl.colonyClaim;                    // FAZ 76: kilit çözüldü
      f.ships = f.ships.filter(s => s.c !== 'kol');
      if (!f.ships.length){ G.fleets = G.fleets.filter(x=>x!==f); return; }
    } else {
      /* ═══ FAZ 76: BUHARLAŞMA ONARIMI ═══
         Hedef elden gitmişse gemi YOK OLMAZ — emri düşer, yerinde
         bekler ve oyuncuya haber verilir. */
      if (pl && pl.colonyClaim === f.id) delete pl.colonyClaim;
      if (!e.ai && f.ships.some(sh => sh.c === 'kol'))
        say('🚀 ' + (f.name || 'Koloni gemisi') + ' yerleşemedi — ' +
            (pl && pl.col ? 'orası artık dolu' : 'şartlar değişti') +
            '. Gemi ' + sys.name + ' yörüngesinde bekliyor.', 'war');
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
        /* ═══ FAZ 62: SİVİL GEMİLER RALLİYE GİTMEZ ═══
           Koloni ve inşaat gemisi cepheye yollanmaz; oldukları
           yerde bekler, oyuncu onları kendi görevine yönlendirir. */
        const askeri = SHIPS[q.cls] && (SHIPS[q.cls].dmg > 0 ||
                       SHIPS[q.cls].rol === 'ordu');
        if (ral && askeri){
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

/* Yörüngede hâlâ ayakta olan SAVUNMA YAPISI gücü.
   Gezegen yüzeyindeki tahkimat buraya girmez — o ancak
   bombardıman aşamasında devreye girer (savunucu olarak). */
function orbitDefenseAlive(sys, defenderId){
  if (!sys || sys.owner !== defenderId) return 0;
  let g = 0;
  if (sys.built){
    for (const k in sys.built){
      if (sys.built[k] === undefined) continue;
      const S = STRUCTS[k];
      if (!S) continue;
      if (S.sp === 'def' || S.sp === 'yard' || k === 'platform' || k === 'kale_u')
        g += (S.def || 40) * (sys.built[k] || 1);
    }
  }
  /* Yörünge kalkanı da uzayda sayılır */
  for (const pl of sys.planets)
    if (pl.col && pl.shield > 0) g += pl.shield * .35;
  return g;
}

/* FAZ 74: battleRound → combat.js taşındı */

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
  /* ═══ FAZ 62: KALICI İNŞAAT GEMİSİ ═══
     Eskiden inşaat gemisi yapıyı kurunca YOK EDİLİYORDU — her
     istasyon için yeniden üretmek gerekiyordu, bu saf mikro-yönetim
     yüküydü. Artık gemi kalır, yalnız işin süresince meşgul
     (busy) işaretlenir; iş bitince boşa düşer ve tekrar kullanılır. */
  if (fleet){
    for (const sh of fleet.ships)
      if (sh.c === 'ins'){ sh.busy = sys.id; break; }   // biri görevlensin
    fleet.building = sys.id;
  }
  return true;
}
function structTick(dt){
  for (const sys of G.sys){
    /* FAZ 62: bu sistemde iş bittiyse inşaatçıları serbest bırak */
    if ((!sys.work || !sys.work.length)){
      for (const f of G.fleets){
        if (f.building !== sys.id) continue;
        delete f.building;
        for (const sh of f.ships) if (sh.busy === sys.id) delete sh.busy;
        const e2 = G.emps[f.e];
        if (e2 && !e2.ai)
          say('🔧 İnşaat gemisi ' + sys.name + ' görevini bitirdi — yeniden hazır', 'sci');
      }
    }
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
/* FAZ 74: View → map.js taşındı */
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

/* FAZ 74: UI → ui.js taşındı */
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
  {k:'mizac',  n:'DOKTRİN'},
  {k:'goruns', n:'GÖRÜNÜŞ'},
  {k:'fizyo',  n:'🧬 FİZYOLOJİ'},   // FAZ 52
  /* FAZ 72: TÜR sekmesi kaldırıldı — ırk artık doktrinden türetiliyor */
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

/* ═══════════════════════════════════════════════════════════════════
   FAZ 61 — KURULUM ŞABLONLARI
   Oyuncunun tasarladığı imparatorluk (tür, fizyoloji, etik, civic,
   köken, görünüş) tek tuşla kaydedilir ve yeni oyunda geri yüklenir.
   Galaksi ayarları ve tohum KASTEN dışarıda: şablon "kim olduğun"u
   saklar, "nerede oynadığın"ı değil.
   ═══════════════════════════════════════════════════════════════════ */
const TPL_KEY = 'yh_templates';
const TPL_MAX = 6;
let TEMPLATES = [];

/* Şablona giren alanlar — galaksi/tohum/zorluk hariç */
const TPL_FIELDS = ['name','race','traits','ethics','civics','origin',
                    'physio','look','sigil','monoRes','mizac','color'];

function snapshotCFG(){
  const t = {};
  for (const k of TPL_FIELDS){
    const v = CFG[k];
    t[k] = (v && typeof v === 'object') ? JSON.parse(JSON.stringify(v)) : v;
  }
  return t;
}

function applyTemplate(t){
  if (!t) return false;
  for (const k of TPL_FIELDS){
    if (t[k] === undefined) continue;
    CFG[k] = (t[k] && typeof t[k] === 'object')
      ? JSON.parse(JSON.stringify(t[k])) : t[k];
  }
  /* Bütçe aşımına karşı güvenlik: bozuk şablon oyunu kilitlemesin */
  if (typeof ethicSpent === 'function' && ethicSpent() > ETHIC_BUDGET)
    CFG.ethics = blankEthics();
  if (!Array.isArray(CFG.traits)) CFG.traits = [];
  if (!Array.isArray(CFG.civics)) CFG.civics = [];
  /* FAZ 61: eski sürümden kalan geçersiz anahtarları at */
  CFG.traits = CFG.traits.filter(k => TRAITS[k]);
  CFG.civics = CFG.civics.filter(k => CIVICS[k]);
  if (!RACES[CFG.race])     CFG.race = 'insan';
  if (!LOOKS[CFG.look])     CFG.look = 'humanoid';
  if (!ORIGINS[CFG.origin]) CFG.origin = 'standart';
  if (!PHYSIO[CFG.physio])  CFG.physio = 'humanoid';
  return true;
}

async function loadTemplates(){
  try {
    const raw = await storeGet(TPL_KEY);
    TEMPLATES = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(TEMPLATES)) TEMPLATES = [];
  } catch(e){ TEMPLATES = []; }
}

async function saveTemplate(){
  const t = snapshotCFG();
  t._ad = (CFG.name || 'Hanedan').slice(0, 24);
  t._t = Date.now();
  /* Aynı adlı varsa üzerine yaz */
  const ix = TEMPLATES.findIndex(x => x && x._ad === t._ad);
  if (ix >= 0) TEMPLATES[ix] = t;
  else {
    TEMPLATES.unshift(t);
    if (TEMPLATES.length > TPL_MAX) TEMPLATES.length = TPL_MAX;
  }
  try { await storeSet(TPL_KEY, JSON.stringify(TEMPLATES)); } catch(e){}
  return t._ad;
}

async function deleteTemplate(ad){
  TEMPLATES = TEMPLATES.filter(x => x && x._ad !== ad);
  try { await storeSet(TPL_KEY, JSON.stringify(TEMPLATES)); } catch(e){}
}

/* FAZ 74: renderSetup → ui.js taşındı */
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
/* FAZ 74: setupClickHandler → ui.js taşındı */
/* ═══ FAZ 74: GECİKMELİ BAĞLAMA ═══
   setupClickHandler artık ui.js'te; main.js ondan ÖNCE yüklendiği
   için doğrudan referans TDZ hatası veriyordu. Sarmalayıcı ile
   çözüldü: dinleyici kurulur ama fonksiyon ancak TIKLAMA ANINDA
   aranır — o zamana kadar ui.js çoktan yüklenmiş olur. */
document.addEventListener('click', function(ev){
  if (typeof setupClickHandler === 'function') setupClickHandler(ev);
});
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

/* ═══════════════════════════════════════════════════════════════════
   FAZ 65 — DIŞARI DOKUNUNCA ALT MENÜLERİ KAPAT
   Alt menüler yalnız kendi başlığına tekrar basınca kapanıyordu.
   Artık harita boşluğuna ya da menü dışındaki herhangi bir yere
   dokunmak da kapatıyor — mobilde beklenen davranış.
   Menünün KENDİ içine dokunmak kapatmaz (seçim yapılabilsin).
   ═══════════════════════════════════════════════════════════════════ */
/* ═══ FAZ 66: ESC — EKRANI TEMİZLE ═══
   Sırayla: modal → yan paneller → alt menüler. Her basış bir
   katman kapatır; hepsi kapalıysa hiçbir şey olmaz. */
document.addEventListener('keydown', ev => {
  if (ev.key !== 'Escape' && ev.key !== 'Esc') return;
  let birSey = false;
  /* FAZ 66 DÜZELTMESİ: className boş dizeyse (henüz sınıf
     atanmamışsa) eski koşul `md.className &&` yüzünden dalı
     ATLIYOR ama innerHTML doluysa modal gerçekten açıktır.
     Ölçüt innerHTML + 'hidden' sınıfının YOKLUĞU olmalı. */
  const md = document.getElementById('modal');
  const modalAcik = md && md.innerHTML && md.innerHTML.length > 40 &&
                    !(md.className || '').includes('hidden');
  if (modalAcik){
    try { UI.closeModal(); birSey = true; } catch(e){}
  }
  if (!birSey){
    for (const id of ['diploPane','fedPane','cncPane','globalPane']){
      const el = document.getElementById(id);
      if (el && el.classList && el.classList.contains('show')){
        el.classList.remove('show'); birSey = true;
      }
    }
  }
  if (!birSey) birSey = closeAllGroups();
  if (birSey) ev.preventDefault();
});

function closeAllGroups(){
  let kapandi = false;
  for (const id of ['outMap', 'outEmp']){
    const el = document.getElementById(id);
    if (el && el.classList && el.classList.contains('open')){
      el.classList.remove('open');
      kapandi = true;
    }
  }
  return kapandi;
}

document.addEventListener('pointerdown', ev => {
  /* Açık menü yoksa boşuna çalışma */
  const varMi = ['outMap','outEmp'].some(id => {
    const el = document.getElementById(id);
    return el && el.classList && el.classList.contains('open');
  });
  if (!varMi) return;
  /* Dokunulan yer bir grubun İÇİ mi ya da grup başlığı mı? */
  const t = ev.target;
  if (t && t.closest){
    if (t.closest('.toolGrp')) return;      // menünün kendisi — dokunma
  }
  closeAllGroups();
}, true);                                    // yakalama evresi: her şeyden önce

document.addEventListener('pointercancel', () => { _tapBas = null; }, {passive: true});

/* ═══════════════════════════════════════════════════════════════════
   FAZ 65 — DIŞARI TIKLAYINCA ALT MENÜLERİ KAPAT
   Açık .grpOut menüleri yalnız kendi başlığına tekrar basınca
   kapanıyordu. Artık menünün ya da başlık butonunun DIŞINDA
   herhangi bir yere dokunmak da kapatıyor — haritaya, panele,
   nereye olursa.
   ═══════════════════════════════════════════════════════════════════ */
function closeToolGroups(){
  let kapandi = false;
  const acik = document.querySelectorAll
    ? document.querySelectorAll('.grpOut.open') : [];
  for (const el of acik){ el.classList.remove('open'); kapandi = true; }
  return kapandi;
}

document.addEventListener('pointerdown', ev => {
  /* Grubun kendi içine ya da başlık butonuna dokunulduysa karışma —
     o zaten kendi mantığıyla açılıp kapanıyor. */
  const ic = ev.target.closest && ev.target.closest('.toolGrp');
  if (ic) return;
  closeToolGroups();
}, {capture: true, passive: true});

/* FAZ 64: alt menü dışına dokununca kapansın */
document.addEventListener('pointerdown', ev => {
  const grp = ev.target.closest && ev.target.closest('.toolGrp');
  if (grp) return;                        // grubun içindeyiz
  ['outMap','outEmp'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('open');
  });
}, {passive: true});

/* ═══════════════════════════════════════════════════════════════════
   FAZ 62 — UZUN BASIŞ BİLGİ (data-hold)
   Bina kartlarındaki 'i' butonu kaldırıldı. Artık karta 450 ms
   basılı tutmak bilgi penceresini açıyor — mobil standardı.
   Basış tamamlanınca normal tıklama İPTAL edilir ki bilgi
   açılırken bina da inşa edilmesin.
   ═══════════════════════════════════════════════════════════════════ */
const HOLD_MS = 450;
let _holdTimer = null, _holdFired = false;

document.addEventListener('pointerdown', ev => {
  /* ═══ FAZ 67: KURULUM EKRANI YALITIMI ═══
     Uzun basış yalnız OYUN İÇİNDE geçerli. Kurulum ekranı
     açıkken (menu görünürken) hiç çalışmaz — orada her seçim
     tek dokunuşla yapılır. */
  const menu = document.getElementById('menu');
  if (menu && !menu.classList.contains('hidden')){
    _holdFired = false;
    if (_holdTimer){ clearTimeout(_holdTimer); _holdTimer = null; }
    return;
  }
  const el = ev.target.closest && ev.target.closest('[data-hold]');
  _holdFired = false;
  if (_holdTimer){ clearTimeout(_holdTimer); _holdTimer = null; }
  if (!el) return;
  const key = el.dataset.hold;
  _holdTimer = setTimeout(() => {
    _holdFired = true;
    _holdTimer = null;
    try {
      if (typeof UI !== 'undefined' && UI.buildingInfo) UI.buildingInfo(key);
      else if (typeof UI !== 'undefined' && UI.act) UI.act('bInfo', key);
    } catch(e){}
  }, HOLD_MS);
}, {passive: true});

['pointerup','pointercancel','pointerleave'].forEach(t => {
  document.addEventListener(t, () => {
    if (_holdTimer){ clearTimeout(_holdTimer); _holdTimer = null; }
    /* Uzun basış tetiklendiyse bu dokunuşun tıklamasını yut */
    if (_holdFired) _tapBas = null;
  }, {passive: true});
});

document.addEventListener('pointerup', ev => {
  const bas = _tapBas;
  _tapBas = null;
  if (!bas) return;
  const el = ev.target.closest && ev.target.closest('[data-a]');
  if (!el || el !== bas.el) return;        // parmak başka öğeye kaydı
  const dx = Math.abs(ev.clientX - bas.x);
  const dy = Math.abs(ev.clientY - bas.y);
  if (dx > SCROLL_TOLERANS || dy > SCROLL_TOLERANS) return;   // KAYDIRMA
  /* FAZ 67: kurulum ekranında süre sınırı yok — oyuncu düşünüp
     parmağını bekletebilir, seçim yine de yapılır. */
  const menu2 = document.getElementById('menu');
  const kurulumda = menu2 && !menu2.classList.contains('hidden');
  if (!kurulumda && Date.now() - bas.t > TAP_MAX_MS) return;  // uzun basış
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
/* FAZ 63: 'savas' (husumet ağı) modu eklendi.
   FAZ 65: 'gemi' modu listeden ÇIKARILDI — artık bağımsız bir
   katman (RADAR_ON). Zemin haritası hangi modda olursa olsun
   filo hareketleri üstüne bindirilebiliyor. Birbirini dışlayan
   bir seçim olması stratejik olarak yanlıştı: oyuncu savaş
   ağını görürken filoları da görmek istiyor. */
let MAP_MODE = 'siyasi';
let RADAR_ON = false;
/* FAZ 47: küçük olayları otomatik çöz (ekonomi + minör anomali) */
let AUTO_EVENT = false;

/* Diplomatik moda göre bir devletin rengi */
function diploColor(o){
  const e = G.p;
  /* FAZ 63: savaş modunda herhangi bir savaşın içindeki devlet
     kırmızıya döner — barıştakiler soluk gri kalır. */
  if (MAP_MODE === 'savas'){
    if (!o) return '#3a4356';
    if (o.wild || o.crisisSide) return '#5a2d8f';
    let savasta = false;
    for (const w in o.war)
      if (o.war[w] && G.emps[w] && !G.emps[w].dead) savasta = true;
    if (!savasta) return '#3a4356';
    if (e.war[o.id] || o.id === e.id) return '#ff5f6d';   // bizimki parlak
    return '#a83a44';                                      // başkalarınınki koyu
  }
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
/* FAZ 65: radar katmanı tercihi kalıcı */
async function loadRadarPref(){
  try {
    const v = await storeGet('yh_radar');
    RADAR_ON = (v === 'on');
    const rb = document.getElementById('radarBtn');
    if (rb) rb.className = 'tool radarBtn' + (RADAR_ON ? ' on' : '');
  } catch(e){}
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
  if (typeof AUDIO !== 'undefined'){
    try { document.hidden ? AUDIO.suspend() : AUDIO.resume(); } catch(e){}
  }
  /* ═══════════════════════════════════════════════════════════════
     FAZ 60 — CONTEXT LOSS ONARIMI
     Mobil tarayıcılar arka plandaki sekmenin WebGL/2D bağlamını
     bellek için serbest bırakabiliyor. Oyuncu geri döndüğünde
     tuval boş kalıyordu, çünkü çizim döngüsü yalnız DEĞİŞİKLİK
     olduğunda kare basıyor — dönüşte çizilecek bir şey yoktu.
     Dönüşte tuval ölçüleri yeniden kurulup bir kare ZORLANIYOR.
     İki aşamalı: hemen bir kare, sonra yerleşim oturunca bir tane
     daha (bazı cihazlarda ilk karede boyut henüz 0 geliyor). */
  if (!document.hidden){
    /* FAZ 70: arka planda rAF durduğu için LOOP.last bayat kalıyor.
       Tazelenmezse dönüşteki ilk dt hesabı çöp değer üretir. */
    LOOP.last = (typeof performance !== 'undefined') ? performance.now() : 0;
    LOOP.acc = 0; LOOP.uiAcc = 0; LOOP.panAcc = 0;
    if (typeof camSane === 'function') camSane();
    forceRedraw();
  }
});

function forceRedraw(){
  const ciz = () => {
    try {
      if (typeof View === 'undefined' || !View.g) return;
      View.resize();                       // tuval ölçüsünü yeniden kur
      View._bolgeAt = -1;                  // bölge adı önbelleğini tazele
      if (G && G.sys && G.sys.length) View.draw(performance.now());
      if (typeof UI !== 'undefined' && UI.refresh) UI.refresh();
    } catch(e){ console.warn('forceRedraw:', e); }
  };
  ciz();
  setTimeout(ciz, 120);                    // yerleşim oturduktan sonra
  if (typeof requestAnimationFrame === 'function') requestAnimationFrame(ciz);
}

/* Bazı cihazlar sekme dönüşünde visibilitychange yerine
   pageshow/focus üretiyor — üçünü de dinliyoruz. */
window.addEventListener('pageshow', ()=>{ forceRedraw(); });
/* FAZ 63: ekran döndürme / klavye açılması / pencere boyutu
   değişimi de bağlamı bozabiliyor — agresif tetikleme. */
let _rsTimer = null;
window.addEventListener('resize', ()=>{
  if (_rsTimer) clearTimeout(_rsTimer);
  _rsTimer = setTimeout(()=>{ _rsTimer = null; forceRedraw(); }, 90);
});
window.addEventListener('orientationchange', ()=>{
  forceRedraw();
  setTimeout(forceRedraw, 300);      // dönüş animasyonu bitince
});
window.addEventListener('focus', ()=>{ if (!document.hidden) forceRedraw(); });

/* Tuval bağlamı gerçekten kaybolursa tarayıcı bunu bildirir */
(function(){
  const cv = document.getElementById('map');
  if (!cv) return;
  cv.addEventListener('contextlost', ev => {
    ev.preventDefault();                   // geri kazanıma izin ver
    console.warn('Tuval bağlamı kayboldu — geri kazanım bekleniyor');
  });
  cv.addEventListener('contextrestored', ()=>{
    console.warn('Tuval bağlamı geri geldi');
    try { View.init && View.init(); } catch(e){}
    forceRedraw();
  });
})();

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
/* ═══════════════════════════════════════════════════════════════════
   FAZ 70 — ÖLÜMSÜZ OYUN DÖNGÜSÜ
   KÖK NEDEN: eski frame() gövdesi korumasızdı ve requestAnimationFrame
   EN SONDA çağrılıyordu. View.draw() bir kez hata atarsa (arka
   plandan dönüşte tuval bağlamı kaybolmuşsa g null olabiliyor)
   o satıra HİÇ ULAŞILMIYOR — döngü kalıcı olarak ölüyordu.
   Ekran son karede donuyor, harita beyaza dönüyor, yalnız statik
   arayüz kalıyordu. Tek bir istisna tüm oyunu kilitliyordu.

   ÇÖZÜM: gövde try/catch içinde, rAF finally'de. Artık hangi
   hata olursa olsun bir sonraki kare mutlaka isteniyor.
   Ayrıca kamera değerleri her karede NaN/Infinity'ye karşı
   denetleniyor — bozulursa son sağlam değere dönülüyor.
   ═══════════════════════════════════════════════════════════════════ */
function camSane(){
  const c = View.cam;
  if (!c) return;
  const iyi = v => typeof v === 'number' && isFinite(v);
  if (!iyi(c.x) || !iyi(c.y) || !iyi(c.z)){
    console.warn('Kamera bozuldu, sıfırlanıyor:', c.x, c.y, c.z);
    const h = (G.p && G.sys[G.p.home]) ? G.sys[G.p.home] : null;
    c.x = h ? h.x : (G.W || 2000) / 2;
    c.y = h ? h.y : (G.H || 2000) / 2;
    c.z = .40;
    View._pan = null;                  // bozuk animasyonu da iptal et
  } else {
    c.z = clamp(c.z, .035, 1.9);       // güvenli aralıkta tut
    View._camOk = {x: c.x, y: c.y, z: c.z};
  }
}

let _frameHata = 0;

function frame(t){
  try {
    /* dt tavanı: arka planda geçen uzun süre devasa adım
       üretmesin (Faz 70 öncesinde de vardı, korunuyor). */
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

    camSane();
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
    _frameHata = 0;                    // sağlıklı kare: sayacı sıfırla
  } catch(err){
    _frameHata++;
    if (_frameHata < 4) console.warn('frame hatası (' + _frameHata + '):', err);
    /* Arka arkaya hata: tuval bağlamı gitmiş olabilir, yeniden kur */
    if (_frameHata === 4){
      console.warn('Ardışık kare hatası — tuval yeniden kuruluyor');
      try { View.init && View.init(); View.resize && View.resize(); } catch(e){}
      camSane();
    }
  } finally {
    /* ═══ HER KOŞULDA bir sonraki kare ═══ */
    requestAnimationFrame(frame);
  }
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
  loadRadarPref();              // FAZ 65: radar katmanı
  loadTemplates().then(()=>{    // FAZ 61: kurulum şablonları
    try { if (SETUP_STEP && $('menu') && !$('menu').classList.contains('hidden'))
      safeRenderSetup(); } catch(e){}
  });
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
/* FAZ 74: TITLE → ui.js taşındı */

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
