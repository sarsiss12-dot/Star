/* ═══════════════════════════════════════════════════════════════════
   YILDIZ HANEDANI · economy.js — EKONOMİ
   Üretim, koloniler, ticaret ağı, ambargo, araştırma, inşa, terraform.
   ═══════════════════════════════════════════════════════════════════ */


/* ---------- koloniler ---------- */
function focusOf(col){ return (col && col.f && FOCUS[col.f]) || FOCUS_NEUTRAL; }
function focusMods(col){
  const F = focusOf(col), m = {};
  for (const k in F.e)   m[k] = (m[k]||0) + F.e[k];
  for (const k in F.pen) m[k] = (m[k]||0) + F.pen[k];
  return m;
}
function setFocus(e, sys, pl, key){
  const col = pl.col;
  if (!col || pl.owner !== e.id || !FOCUS[key]) return false;
  if ((col.fcd||0) > 0 || col.f === key) return false;
  if (hasCivic(e,'oneparty') && col.fSet) return false;   // Tek Parti: odak kalıcı
  col.f = key;
  /* FAZ 63: ODAK ARTIK OTO-İNŞAYI AÇMAZ.
     Odak yalnız üretim çarpanı verir; otomatik inşa ayrı bir
     karardır (col.auto) ve gezegen panelindeki kendi anahtarıyla
     açılır. İkisini ayırmak oyuncuya "bonus istiyorum ama binayı
     kendim seçeceğim" seçeneğini geri veriyor. */
  col.fcd = hasPerk(e,'ironWill') ? 0 : FOCUS_COOLDOWN;
  col.fSet = true;
  sys.def = sysDefense(sys);
  return true;
}
function colonyRef(e, i){ const c = e.colonies[i]; return {sys:G.sys[c.s], pl:G.sys[c.s].planets[c.p]}; }
function colonySlots(col, e, pl){
  if (pl && pl.hab) return Math.min(6, 3 + Math.floor(col.pop/3));
  // taban 5: anavatan 11 yapıyla başlıyor, eski formül daha ilk turda tıkanıyordu
  // taban 7: anavatan 11 yapıyla başlıyor. Asıl kısıt zaten işgücü —
  // her yapı 1 nüfus ister, o yüzden slot cömert olabilir.
  return Math.min(20, 7 + Math.floor(col.pop/2.2) + (e?civicSlots(e):0));
}
function colonyUsed(col){ let n=0; for(const k in col.b) n += col.b[k]; return n; }

/* Her bina 1 işçi ister. Nüfus yetmezse binalar kısmi kapasiteyle çalışır. */
function colonyStaffing(col){
  const jobs = colonyUsed(col);
  if (jobs <= 0) return 1;
  return clamp(col.pop / jobs, 0, 1);
}
function colonyOutput(e, sys, pl){
  /* ═══ FAZ 77B: RADİKAL CIVIC ÇARPANLARI ═══
     Taht Gemisi (bulunduğu sistemde +%15 / kayıpsa −%50) ve
     Yıldız Yiyen açlığı (tam açlıkta −%55) üretime burada
     giriyor — tek nokta, tüm kaynaklara aynı anda. */
  const _radikalMul = (typeof throneMul === 'function' ? throneMul(e, sys.id) : 1) *
                      (typeof hungerMul === 'function' ? hungerMul(e) : 1);
  /* ═══ FAZ 78B: VALİ ETKİSİ ═══
     Tek noktadan giriyor, tıpkı radikal civic çarpanları gibi.
     Toplamsal: (1 + valiÇarpanı) — traits/civics matematiğiyle aynı. */
  let _vMin = 0, _vAra = 0, _vYiy = 0, _vEne = 0;
  if (pl.col && pl.col.leader !== undefined && typeof leaderOf === 'function'){
    const _L = leaderOf(e, pl.col.leader);
    if (_L && LEADER_TRAITS[_L.trait] && LEADER_TRAITS[_L.trait].e){
      const _dm = (typeof disgraceMul === 'function') ? disgraceMul(_L) : 1;
      const _T = LEADER_TRAITS[_L.trait].e, _k = (1 + _L.rank * .10) * _dm;
      _vMin = (_T.minMul || 0) * _k; _vAra = (_T.araMul || 0) * _k;
      _vYiy = (_T.yiyMul || 0) * _k; _vEne = (_T.eneMul || 0) * _k;
    }
  }
  const col = pl.col, o = {min:0,ene:0,yiy:0,ala:0,ara:0,etk:0,tuk:0}, use = {min:0};
  const scale = clamp(.55 + col.pop*.045, .55, 1.7);
  const staff = colonyStaffing(col);
  const sleepMul = hasCivic(e,'sleep') ? 1.45 : 1;
  o.min += col.pop*.40*sleepMul; o.ene += col.pop*.34*sleepMul; o.ara += col.pop*.30*sleepMul; o.yiy += col.pop*.20*sleepMul;
  for (const k in col.b){
    const n = col.b[k]; if (!n) continue;
    const B = BUILDINGS[k];
    for (const r in (B.g||{})) o[r] += B.g[r]*n*scale*staff;
    for (const r in (B.u||{})) use[r] = (use[r]||0) + B.u[r]*n*staff;
  }
  if (pl.dep){
    const d = DEPOSITS.find(x=>x.id===pl.dep);
    if (d) for (const r in d.g) o[r] += d.g[r];
  }
  // özel bina etkileri
  if (col.b.kuyu){
    const hot = (pl.t === 'vol' || pl.t === 'tok' || PLANETS[pl.t].k === 'olu');
    o.ene += col.b.kuyu * (hot ? 4 : 0) * staff;      // sıcak dünyalarda ek verim
  }
  if (col.b.asansor) for (const k in o) o[k] *= 1.18;
  /* ═══ FAZ 77A: KOLONİ ŞOKU ═══
     Yeni koloni ilk yıllarda %45 verimle başlar, üç yılda
     (Öğrenen Sinapslar varsa 1.5 yılda) tam kapasiteye çıkar. */
  if (col.shock){
    const sm = colonyShockMul(e, col);
    if (sm < 1) for (const k in o) o[k] *= sm;
  }
  // gezegen karakteri
  if (typeof planetTrait === 'function'){
    const pt = planetTrait(col);
    if (pt && pt.prod) for (const k in o) o[k] *= (1 + pt.prod);
  }

  const fm = focusMods(col);
  /* FAZ 52: fizyoloji üretim çarpanı — okyanus türü sevdiği
     dünyalarda +%20, sevmediğinde zaten habOf cezası alıyor. */
  const phO = (typeof physioOf === 'function') ? physioOf(e) : null;
  if (phO && phO.sever && phO.sever.indexOf(pl.t) >= 0){
    for (const k in o) o[k] *= 1.20;
  }
  /* FAZ 78B: vali çarpanı odak çarpanıyla TOPLAMSAL birleşir */
  o.min *= (1 + (fm.minMul||0) + _vMin);
  o.ene *= (1 + (fm.eneMul||0) + _vEne);
  o.yiy *= (1 + (fm.yiyMul||0) + _vYiy);
  o.ala *= (1 + (fm.alaMul||0));
  o.ara *= (1 + (fm.araMul||0) + _vAra);
  o.tuk *= (1 + (fm.minMul||0)*.6);
  o.etk += (fm.etkFlat||0);
  if (e.home === sys.id) { for (const k in o) o[k] *= 1.30; }
  const stabMul = clamp(.55 + col.stab/130, .55, 1.2);
  for (const k in o) o[k] *= stabMul;
  /* ═══ FAZ 30: SIKIYÖNETİM VERİM CEZASI ═══
     İşgal altındaki bir dünya normal üretemez: halk direnir,
     lojistik askerîdir, uzmanlar kaçmıştır. Tek çarpan, tek satır —
     formül karmaşıklaşmıyor. */
  if (pl.martial_law > 0) for (const k in o) o[k] *= .50;
  return {o, use};
}

/* ---------- LÜKS MAL AKIŞI ----------
   Kendi kolonilerinden çıkan mallar + ticaret anlaşmalı ortakların
   fazlaları. Rota kesikse akış durur ve bonus kaybolur.          */
function ownLuxury(e){
  const own = {};
  for (const c of e.colonies){
    const pl = G.sys[c.s].planets[c.p];
    if (pl.col && pl.lux) own[pl.lux] = true;
  }
  return own;
}
function refreshLuxury(e){
  const own = ownLuxury(e);
  const got = Object.assign({}, own);
  const imported = {};
  // ticaret ortaklarından ithalat — açık bir rota gerekir
  const tr = e.trade;
  const hasOpenForeign = tr && tr.links && tr.links.some(l => l.dis && !l.bl);
  if (hasOpenForeign){
    for (const o of G.emps){
      if (o.dead || o.id === e.id || e.war[o.id]) continue;
      if (!(e.pact && e.pact[o.id])) continue;
      /* AMBARGO: kesilen ticaret lüks mal akışını da durdurur */
      if (typeof tradeBlocked === 'function' && tradeBlocked(e, o)) continue;
      const theirs = ownLuxury(o);
      for (const k in theirs) if (!got[k]){ got[k] = true; imported[k] = o.id; }
    }
  }
  e.luxury = got;
  e.luxOwn = own;
  e.luxImport = imported;
  recalcMods(e);
  return got;
}

/* ---------- ticaret ağı ---------- */
/* Aynı imparatorluğun ≤3 sıçrama uzaklıktaki koloni sistemleri arasında
   otomatik bağlantı kurulur. Yol üzerinde savaş hâlindeki bir düşman
   sistemi varsa bağlantı kesilir. */
/* ticaret merkezi = Ticaret Limanı kurulu koloni sistemi */
function tradeHubs(e){
  const out = [];
  for (const c of e.colonies){
    const pl = G.sys[c.s].planets[c.p];
    if (pl.col && (pl.col.b.liman || 0) > 0 && out.indexOf(c.s) < 0) out.push(c.s);
  }
  return out;
}
function tradeLinks(e){
  const cols = tradeHubs(e);
  // ticaret anlaşmalı imparatorlukların limanları da ağa dahil
  const foreign = {};
  for (const o of G.emps){
    if (o.dead || o.id === e.id || !(e.pact && e.pact[o.id])) continue;
    if (typeof tradeBlocked === 'function' && tradeBlocked(e, o)) continue;
    if (e.war[o.id]) continue;
    for (const h of tradeHubs(o)){ if (cols.indexOf(h) < 0){ cols.push(h); foreign[h] = o.id; } }
  }
  const colSet = new Set(cols);
  const links = [], seenPair = new Set();
  for (const start of cols){
    const q = [{id:start, d:0, bl:false}];
    const vis = new Set([start]);
    while (q.length){
      const cur = q.shift();
      if (cur.d >= 3) continue;
      for (const l of G.sys[cur.id].lanes){
        if (vis.has(l)) continue;
        vis.add(l);
        const o = G.sys[l].owner;
        const bl = cur.bl || (o >= 0 && o !== e.id && e.war[o]);
        if (colSet.has(l)){
          const key = start < l ? start+'_'+l : l+'_'+start;
          if (!seenPair.has(key)){
            seenPair.add(key);
            const raided = (G.raids && G.raids[key] && G.raids[key] > G.day);
            const route = findPath(start, l);
            links.push({a:start, b:l, bl: bl || raided, raided,
                        dis: (foreign[start] !== undefined || foreign[l] !== undefined),
                        key, vol: routeVolume(e, start, l),
                        path: route ? [start].concat(route) : [start, l]});
          }
        }
        q.push({id:l, d:cur.d+1, bl});
      }
    }
  }
  return links;
}
/* Rota hacmi: bağlı iki limanın nüfusu ve gelişmişliği taşıma
   kapasitesini belirler. Yağmalanan rota bir süre çalışmaz. */
function routeVolume(e, a, b){
  let v = 0;
  for (const sid of [a, b]){
    const sy = G.sys[sid];
    if (!sy) continue;
    for (const pl of sy.planets){
      if (!pl.col) continue;
      v += pl.col.pop * .6 + (pl.col.b.liman||0) * 4;
      if (pl.lux) v += 6;
    }
  }
  return Math.round(v);
}
/* Bir ticaret ortağının bize kazandırdığı somut değer —
   anlaşmanın "ne işe yaradığı" artık ölçülebilir. */
function pactValue(e, o){
  if (!o || o.dead) return null;
  const myHubs = tradeHubs(e), theirHubs = tradeHubs(o);
  let links = 0;
  for (const a of myHubs) for (const b of theirHubs){
    if (hopDist(a, b, 3) <= 3) links++;
  }
  const theirLux = ownLuxury(o), mine = ownLuxury(e);
  const newLux = LUX_KEYS.filter(k => theirLux[k] && !mine[k]);
  const rich = hasCivic(e,'trade');
  const enePct = links * (rich ? 7 : 4) + links * 3;   // dış bağlantı ek getirisi
  return {links, newLux, enePct, hubs:{mine:myHubs.length, theirs:theirHubs.length}};
}
/* Ticaret çarpanı doygunluk ayarları — Faz 4 dengelemesi.
   TRADE_SOFT: bu değere kadar doğrusal (erken oyun dokunulmaz)
   TRADE_CAP : asimptotik tavan; çarpan buna yaklaşır ama ulaşmaz  */
const TRADE_SOFT = 0.55;
const TRADE_CAP  = 2.00;
function softCapTrade(ham){
  if (!(ham > TRADE_SOFT)) return Math.max(0, ham);
  const alan = TRADE_CAP - TRADE_SOFT;
  return TRADE_SOFT + alan * (1 - Math.exp(-(ham - TRADE_SOFT) / alan));
}

function tradeInfo(e){
  /* Aynı ay içinde tekrar hesaplamayı önler. Anahtar yalnız güne değil,
     ticaret topolojisini değiştiren her şeye bakar — yoksa liman kurunca
     eski sonuç dönüyordu. */
  let portN = 0;
  for (const c of e.colonies){
    const pl = G.sys[c.s] && G.sys[c.s].planets[c.p];
    if (pl && pl.col) portN += (pl.col.b.liman || 0);
  }
  const sig = e.colonies.length + ':' + portN + ':' +
              Object.keys(e.pact||{}).filter(k=>e.pact[k]).length + ':' +
              Object.keys(G.raids||{}).length;
  if (e._trCache && e._trAt === G.day && e._trSig === sig) return e._trCache;
  const links = tradeLinks(e);
  const rich = hasCivic(e,'trade');
  let cap = 8 + (rich ? 4 : 0);
  for (const c of e.colonies){
    const pl = G.sys[c.s].planets[c.p];
    if (pl.col) cap += (pl.col.b.liman||0) * 2;
  }
  const open = links.filter(l => !l.bl);
  const n = Math.min(open.length, cap);
  const foreignN = open.filter(l => l.dis).length;
  const base = rich ? .07 : .04;
  /* GERÇEKÇİ TİCARET: kazanç kervanın hedefe VARMASIYLA oluşur.
     Uzun rotada sefer daha seyrek tamamlanır, dolayısıyla aylık
     getiri düşer. Kısa ve yoğun hatlar daha kârlıdır. */
  let vol = 0, tripSum = 0;
  open.slice(0, cap).forEach(l => {
    vol += l.vol;
    const hops = Math.max(1, (l.path ? l.path.length - 1 : 1));
    l.trips = 3 / hops;                 // ayda tamamlanan sefer sayısı
    l.yield = l.vol * l.trips * .0016;  // o hattın aylık getirisi
    tripSum += l.yield;
  });
  const volMul = clamp(vol / 260, 0, 1.4);
  /* ─── TİCARET DOYGUNLUĞU (soft-cap) ───────────────────────────
     Ham formül doğrusaldı: her yeni rota getiriyi aynı oranda
     artırıyordu ve geç oyunda çarpan 4,7'ye (yani +%470 enerji)
     kadar çıkıyordu. Bu, ambargoları savaştan ölümcül kılıyordu.

     Artık TRADE_SOFT eşiğine kadar hiçbir değişiklik yok — erken
     oyun aynen korunur. Eşiğin üstünde azalan verim devreye girer
     ve çarpan TRADE_CAP'e asimptotik yaklaşır, asla aşmaz.
     Ağ büyüdükçe kazanç artar ama her yeni rota bir öncekinden
     daha az getirir: gerçek bir ticaret ağı gibi doyar. */
  const ham = n * base * .5 + foreignN * .03 + volMul * .05 + tripSum;
  const mul = softCapTrade(ham);

  const out = {links, n, cap, cut: links.length - open.length,
          foreign: foreignN, vol, trips: tripSum,
          raided: links.filter(l => l.raided).length,
          ham, mul};
  e._trCache = out; e._trAt = G.day; e._trSig = sig;
  return out;
}

function empireIncome(e){
  const inc = {min:0,ene:0,yiy:0,ala:0,ara:0,etk:0,tuk:0};
  let food = 0, upk = 0, pops = 0;
  for (const c of e.colonies){
    const sys = G.sys[c.s], pl = sys.planets[c.p];
    if (!pl.col || pl.owner !== e.id) continue;
    const {o, use} = colonyOutput(e, sys, pl);
    /* FAZ 77B: radikal civic çarpanı */
    if (typeof throneMul === 'function' || typeof hungerMul === 'function'){
      const rm = (typeof throneMul === 'function' ? throneMul(e, sys.id) : 1) *
                 (typeof hungerMul === 'function' ? hungerMul(e) : 1);
      if (rm !== 1) for (const k in o) o[k] *= rm;
    }
    for (const k in o) inc[k] += o[k];
    inc.min -= (use.min||0);
    food += pl.col.pop * 1.15;                    // nüfus başına ağır beslenme yükü
    pops += pl.col.pop;
    for (const k in pl.col.b) upk += (BUILDINGS[k].up||0) * pl.col.b[k];
  }
  inc.min *= (1+e.mods.minMul);
  inc.ene *= (1+e.mods.eneMul);
  inc.yiy *= (1+e.mods.yiyMul);
  inc.ala *= (1+e.mods.alaMul);
  /* FAZ 8: donanma sürekli alaşım tüketir — filo şişmesini frenler */
  if (typeof fleetAlloyUpkeep === 'function'){
    const aBak = fleetAlloyUpkeep(e);
    e.fleetAlloyUp = aBak;
    inc.ala -= aBak;
  }
  inc.ara *= (1+e.mods.araMul);
  if (typeof structBonus === 'function'){
    const sb = structBonus(e);
    e.structs = sb;
    inc.min += sb.min; inc.ara += sb.ara;
    inc.ene += sb.ene + sb.dyson * 45;
  }
  const tr = tradeInfo(e);
  e.trade = tr;
  /* FAZ 48: DÜRÜST ekseni ticaret gelirini artırır — güvenilir
     ortakla iş yapmak herkes için ucuzdur. */
  inc.ene *= (1 + tr.mul + ((e.mods && e.mods.tradeMul) || 0));
  inc.tuk *= (1+e.mods.minMul*.5);
  inc.ene += e.mods.eneFlat;
  inc.etk += 6 + e.mods.etkFlat;      // diplomasi erişilebilir olsun

  // tüketim malı talebi: nüfusun yaşam standardı
  const cgRate = hasCivic(e,'zerowaste') ? .40 : .60;
  let cgNeed = pops * cgRate * (RACES[e.race].bio === 'makine' ? .5 : 1);
  e.cgNeed = cgNeed;
  /* ═══ FAZ 77A: SAVAŞ PANİĞİ ═══
     Savaştayken tüketim malı gideri artar — halk istifçilik yapar. */
  if (e.mods.warTuk){
    let savasta = false;
    for (const w in e.war)
      if (e.war[w] && G.emps[w] && !G.emps[w].dead) savasta = true;
    if (savasta){ cgNeed *= (1 + e.mods.warTuk); e.cgNeed = cgNeed; }
  }
  inc.tuk -= cgNeed;
  const bio = RACES[e.race].bio;
  /* ═══ FAZ 52: FİZYOLOJİ BESLENMESİ ═══
     Litoit mineral yer, makine enerji, bitkisel fotosentezle
     kendi yiyeceğinin bir kısmını üretir. */
  const ph = (typeof physioOf === 'function') ? physioOf(e) : null;
  if (bio === 'makine'){ inc.ene -= food*.55; inc.yiy = 0; }
  else if (ph && ph.yiyer === 'enerji'){
    /* FAZ 72: Makine Ağı fizyolojisi — enerji tüketir */
    inc.ene -= food * .55; inc.yiy = 0;
  }
  else if (bio === 'litoit' || (ph && ph.yiyer === 'mineral')){
    inc.min -= food*.60; inc.yiy = 0;
  }
  else {
    let ihtiyac = food;
    if (ph && ph.photo){
      /* Fotosentez: enerjinin bir kısmı yiyeceğe çevrilir.
         Soğuk dünyalarda maliyet iki katı — güneş zayıf. */
      let soguk = 0, tum = 0;
      for (const c of (e.colonies || [])){
        const sy = G.sys[c.s], pl = sy && sy.planets[c.p];
        if (!pl || !pl.col) continue;
        tum++;
        if (pl.t === 'tun' || pl.t === 'kut' || pl.t === 'buz') soguk++;
      }
      const kat = (tum && soguk / tum > .5) ? 2 : 1;
      const uretilen = Math.min(ihtiyac * .45, ihtiyac);
      inc.ene -= uretilen * .5 * kat;
      ihtiyac -= uretilen;
    }
    inc.yiy -= ihtiyac;
  }
  const fleetE = fleetUpkeep(e);
  e.fleetUp = fleetE;
  // yönetim maliyeti: imparatorluk büyüdükçe artan bürokrasi yükü
  const nCol = e.colonies.length;
  let admin = nCol * 2.2 + Math.max(0, nCol - 5) * nCol * 0.35;
  if (hasCivic(e,'slots')) admin *= .85;          // Bürokratik Verimlilik
  if (hasPerk(e,'ironWill')) admin *= .90;        // Demir İrade
  e.adminCost = admin;
  inc.ene -= upk * 1.6 + fleetE + admin;
  e.foodNeed = food;
  return inc;
}

/* ═══════════════════════════════════════════════════════════════════
   FAZ 85B — AYLIK DÜNYA İLERLEMESİ (yalnız gerçek ay geçişinde)

   KÖK NEDEN: Bu sekiz tik `economyTick(init)` içinde `if (init) continue`
   kontrolünden ÖNCE çağrılıyordu. deserialize() ve setupGame() de
   economyTick(true) çağırdığı için KAYIT AÇMAK bir ay oynatıyordu.

   ÖLÇÜLEN SONUÇ (düzeltmeden önce, tek bir economyTick(true) çağrısı):
     groundTick     → col.shield 4→8 (tüm koloniler), garrisonBase 10→13
     invasionTick   → col.siege 2→0
     repairTick     → gemi gövdesi arttı, f.repairing yazıldı, kaynak yakıldı
     colossusTick   → f.charge 3→0
     terraformTick  → pl.terraform.left 5→4
     radiationTick  → radyasyonlu sistemdeki HER filoda gövde −0.05
     panopticonTick → sys.seen ve sys.panopt yazıldı
     secessionTick  → ayrılık sayacı işlendi
     ayrıca 4 adet say() bildirimi üretildi
   Art arda yükleme kalkanı 4→8→12→16→20→22 diye şişiriyordu.

   ÇÖZÜM: aylık ilerleme burada toplandı ve YALNIZ init === false
   yolunda çağrılıyor. Sıra ve içerik economyTick(false) için birebir
   korundu — bu bir davranış değişikliği değil, yalnız yükleme
   yolundan çıkarma işlemidir. */
function advanceMonthlyWorld(){
  if (typeof groundTick === 'function') groundTick();   // FAZ 21: kalkan/garnizon
  if (typeof invasionTick === 'function') invasionTick(); // FAZ 22: kara savaşları
  if (typeof repairTick === 'function') repairTick();     // FAZ 23: filo onarımı
  if (typeof colossusTick === 'function') colossusTick(); // FAZ 24: süper silah
  if (typeof terraformTick === 'function') terraformTick(); // FAZ 35: yeniden doğuş
  if (typeof radiationTick === 'function') radiationTick(); // FAZ 37: radyasyon
  if (typeof panopticonTick === 'function') panopticonTick(); // FAZ 49: gözlem
  if (typeof secessionTick === 'function') secessionTick(); // FAZ 41: ayrılıkçılar
}

function economyTick(init){
  // ay başında önbellekleri boşalt
  for (const e of G.emps){ e._trAt = -1; e._powAt = -1; e._pressAt = -1; }
  G._structAt = -1;
  refreshReach();
  /* FAZ 85B: aylık dünya YALNIZ gerçek ay geçişinde ilerler.
     init === true (deserialize / setupGame) saf kalır: aşağıdaki
     döngü yalnız türetilmiş ekonomiyi (recalcMods, empireIncome,
     refreshLuxury) yeniden hesaplar. */
  if (!init) advanceMonthlyWorld();
  for (const e of G.emps){
    if (e.dead) continue;
    recalcMods(e);
    const inc = empireIncome(e);
    e.inc = inc;
    refreshLuxury(e);
    if (init) continue;
    for (const k in inc) e.res[k] += inc[k];
    if (inc.etk > 0) e.etkTotal = (e.etkTotal||0) + inc.etk;

    // negatif kaynak cezaları
    const bio2 = RACES[e.race].bio;
    if (e.res.tuk < 0){
      e.res.tuk = 0; e.shortage = true;
      // kıtlık üretimi de vurur: halk çalışmak istemez
      e.extra = e.extra || {};
      e.extra.shortMin = -.15; e.extra.shortAra = -.12;
    } else {
      e.shortage = false;
      if (e.extra){ delete e.extra.shortMin; delete e.extra.shortAra; }
    }
    if (e.res.ene < 0){ e.res.ene = 0; e.crisis = 'enerji'; }
    else if (bio2 === 'litoit' && e.res.min <= 0 && e.inc.min < 0){ e.crisis = 'mineral'; }
    else if (bio2 === 'organik' && e.res.yiy < 0){ e.res.yiy = 0; e.crisis = 'yiyecek'; }
    else e.crisis = null;
    if (e.res.min < 0) e.res.min = 0;
    if (e.res.ala < 0) e.res.ala = 0;
    if (e.res.etk < 0) e.res.etk = 0;

    // nüfus & istikrar
    for (const c of e.colonies){
      const sys = G.sys[c.s], pl = sys.planets[c.p];
      if (!pl.col) continue;
      const col = pl.col;
      if (col.fcd > 0) col.fcd = Math.max(0, col.fcd - 30);
      if (pl.terraJob){
        pl.terraJob.left -= 30;
        if (pl.terraJob.left <= 0){
          pl.terraJob = null;
          pl.terra = (pl.terra || 0) + 1;
          if (!e.ai) say(esc(pl.name) + ' terraform edildi — yaşanabilirlik +' + TERRA_BONUS, 'win');
        }
      }
      const fg = focusMods(col);
      const hab = habOf(e, pl);
      col.cap = pl.hab ? 7 : Math.max(4, Math.round(pl.sz * hab/100 * 1.5) + 3);
      const hive = RACES[e.race].win === 'kolonizasyon' && RACES[e.race].dip === 0;
      let target = 50 + hab*.25 + e.mods.stab + (e.home===sys.id?12:0) - (e.crisis?22:0);
      let pen = 0;
      if (e.shortage && !hasPerk(e,'faith')) pen += 26;   // Kutsal Düzen kıtlığa dayanır
      if (hasPerk(e,'ironWill')) pen *= .5;               // Demir İrade cezaları yarıya indirir
      target -= pen;
      if (typeof planetTrait === 'function'){
        const pt = planetTrait(col);
        if (pt) target += pt.stab || 0;
      }
      /* FAZ 42: kışkırtılmış halk — istikrar hedefi baskılanır */
      if (col.unrest){
        col.unrest.left--;
        target -= col.unrest.hit || 25;
        if (col.unrest.left <= 0) delete col.unrest;
      }
      /* FAZ 42: dış kışkırtma — istikrar hedefi 12 ay boyunca düşük
         tutulur, halk yatışmaz. */
      if (col.incited !== undefined){
        if (col.incited > (G.memAge || 0)){
          target -= (typeof INCITE_STAB !== 'undefined' ? INCITE_STAB : 25);
        } else {
          delete col.incited; delete col.inciteBy;
        }
      }
      /* ═══ FAZ 74: YIKIMIN İZLERİ ARTIK GEÇİCİ ═══
         Faz 73'te ceza KALICIYDI (tavan 30) — bu, alınan gezegeni
         sonsuza dek işe yaramaz kılıyordu ve oyuncuyu yıkıcı
         bombardımandan tamamen caydırıyordu. Artık yara zamanla
         kapanıyor: yılda ~1.8 puan siliniyor, bombardıman
         sürmediği sürece birkaç on yılda tamamen geçiyor. */
      if (col.scorched){
        target -= col.scorched;
        if (!col.bombed || col.bombed < (G.memAge || 0))
          col.scorched = Math.max(0, col.scorched - .15);   // ~1.8/yıl
        if (col.scorched <= 0) delete col.scorched;
      }
      /* FAZ 78B: "İlham Verici" vali istikrar hedefini yükseltir */
      if (col.leader !== undefined && typeof leaderOf === 'function'){
        const _LV = leaderOf(e, col.leader);
        if (_LV && LEADER_TRAITS[_LV.trait] && LEADER_TRAITS[_LV.trait].e &&
            LEADER_TRAITS[_LV.trait].e.stab)
          target += LEADER_TRAITS[_LV.trait].e.stab * (1 + _LV.rank * .10) *
                    ((typeof disgraceMul === 'function') ? disgraceMul(_LV) : 1);
        /* FAZ 79: ifşa edilmiş vali istikrarı ayrıca düşürür */
        if (_LV && _LV.disgraced && _LV.disgraced > (G.memAge || 0))
          target -= 12;
      }
      if (hasCivic(e,'oneparty')) target = Math.max(target, 35);
      if (hasPerk(e,'zeal')) target = Math.max(target, 60);
      if (hive) target = Math.max(target, 92);   // tek irade: moral sorunu olmaz
      /* FAZ 63: bombardıman altındaki koloni toparlanamaz —
         yalnız düşüş yönünde hareket eder. */
      if (col.bombed && col.bombed >= (G.memAge || 0)){
        col.stab += Math.min(0, clamp(target - col.stab, -3, 3));
      } else {
        if (col.bombed) delete col.bombed;
        col.stab += clamp(target - col.stab, -3, 3);
      }
      col.stab = clamp(col.stab, 0, 100);
      if (col.pop < col.cap && !e.crisis && !hasCivic(e,'sleep')){
        const ptg = (typeof planetTrait === 'function' && planetTrait(col)) ? planetTrait(col).grow : 0;
        const clinic = (col.b.klinik ? .35 : 0) + (ptg || 0);
        // yiyecek bolluğu büyümeyi hızlandırır, darlık yavaşlatır
        const foodRatio = e.foodNeed > 0 ? (e.res.yiy / (e.foodNeed * 12)) : 1;
        const foodBonus = clamp((foodRatio - .5) * .3, -.25, .20);
        /* FAZ 52: fizyoloji büyüme katsayısı (litoit −%25, kuş +%10) */
        const phG = (typeof physioOf === 'function') ? (physioOf(e).growMul || 0) : 0;
        col.grow += .30 * (1 + e.mods.growMul + phG + (fg.growMul||0) + clinic + foodBonus) * (hab/70) * clamp(col.stab/60, .3, 1.25);
        if (col.grow >= 1){ col.grow -= 1; col.pop++; }
      } else if (e.crisis === 'yiyecek' || e.crisis === 'mineral'){
        col.grow -= .25;
        if (col.grow < -1 && col.pop > 1){ col.grow = 0; col.pop--; }
      }
    }

    // araştırma
    const active = ['fiz','top','muh'].filter(b=>e.rq[b]);
    if (active.length){
      const share = e.res.ara / active.length;
      e.res.ara = 0;
      for (const b of active){
        e.rp[b] += share;
        const t = TECHS[e.rq[b]];
        const cost = techCost(e, e.rq[b]);
        if (e.rp[b] >= cost){
          e.rp[b] -= cost;
          e.techs[e.rq[b]] = true;
          /* FAZ 52: ilk keşfeden kaydı — skor ayrışması için */
          G._firstTech = G._firstTech || {};
          if (G._firstTech[e.rq[b]] === undefined) G._firstTech[e.rq[b]] = e.id;
          const done = e.rq[b];
          e.rq[b] = null;
          if (e.streakB === b) e.streakN = (e.streakN||0) + 1;
          else { e.streakB = b; e.streakN = 1; }
          const shifted = applySway(e, done);
          if (hasCivic(e,'noStock')){
            e.techMul = e.techMul || {};
            for (const k in TECHS) if (!e.techs[k]) e.techMul[k] = (e.techMul[k]||1) * .92;
            e.rp[b] = 0;
          }
          recalcMods(e);
          if (typeof facEvent === 'function') facEvent(e,'tech');
          if (!e.ai && shifted.length){
            const up = shifted.filter(x=>x.up).map(x=>TECHS[x.id].n);
            const dn = shifted.filter(x=>!x.up).map(x=>TECHS[x.id].n);
            if (dn.length) say('Yan kazanım: ' + dn.join(', ') + ' ucuzladı', 'sci');
            if (up.length) say('Ödünleşim: ' + up.join(', ') + ' pahalandı', 'sci');
          }
          if (!e.ai) say('Araştırma tamamlandı — ' + t.n, 'sci');
          if (t.unlock && !e.ai) say(SHIPS[t.unlock].n + ' inşa edilebilir', 'sci');
        }
      }
      for (const b of active) if (!e.rq[b]) autoResearch(e, b);
      if (typeof ascendTick === 'function') ascendTick(e);   // FAZ 53
      if (hasCivic(e,'noStock')) for (const b of active) e.rp[b] = Math.min(e.rp[b], 0);
    } else {
      ['fiz','top','muh'].forEach(b=>autoResearch(e,b));
      e.res.ara = 0;
    }
  }
}

/* teknoloji maliyeti: temel × çapraz etki × dal uzmanlık indirimi */
function techCost(e, id){
  const t = TECHS[id];
  if (!t) return 0;
  let mul = (e.techMul && e.techMul[id]) || 1;
  const need = hasCivic(e,'streak2') ? 2 : 3;
  if (e.streakB === t.b && (e.streakN||0) >= need) mul *= hasCivic(e,'streak2') ? .80 : .90;
  return Math.round(t.c * mul);
}
function applySway(e, id){
  const t = TECHS[id];
  if (!t || !t.sway) return [];
  e.techMul = e.techMul || {};
  const notes = [];
  let boost = hasPerk(e,'labFocus') ? 1.5 : 1;
  if (hasCivic(e,'synth')) boost *= 1.6;
  for (const k in t.sway){
    if (e.techs[k]) continue;
    const raw = t.sway[k];
    const scaled = raw > 1 ? 1 + (raw - 1) * boost : 1 - (1 - raw) * boost;
    e.techMul[k] = (e.techMul[k] || 1) * scaled;
    if (TECHS[k]) notes.push({id:k, up: t.sway[k] > 1});
  }
  return notes;
}
function availTechs(e, branch){
  const out = [];
  for (const id in TECHS){
    const t = TECHS[id];
    if (t.b !== branch || e.techs[id]) continue;
    if ((t.r||[]).some(r => !e.techs[r])) continue;
    out.push(id);
  }
  return out.sort((a,b)=>techCost(e,a)-techCost(e,b));
}
/* ═══ FAZ 53: KADİM ARAŞTIRMA ═══
   Ağaç tükendiğinde araştırma puanı boşa gitmez; giderek
   pahalılaşan bir döngüye akar. Bilim zaferinin son şartı. */
function ascendTick(e){
  if (!e || e.dead) return;
  const total = Object.keys(TECHS).length;
  const done = Object.keys(e.techs || {}).filter(t => TECHS[t]).length;
  if (done < total) return;
  e.ascend = e.ascend || 0;
  e.ascendP = e.ascendP || 0;
  let gelir = 0;
  for (const b of ['fiz','top','muh']){
    if (!e.rq[b]){ gelir += (e.rp[b] || 0); e.rp[b] = 0; }
  }
  if (gelir <= 0) return;
  e.ascendP += gelir;
  const bedel = 4200 * Math.pow(1.35, e.ascend);
  if (e.ascendP >= bedel){
    e.ascendP -= bedel;
    e.ascend++;
    if (e.id === 0)
      say('✦ KADİM ARAŞTIRMA ' + e.ascend + '/' +
          (typeof ASCEND_NEED !== 'undefined' ? ASCEND_NEED : 12) +
          ' tamamlandı', 'sci');
  }
}

function autoResearch(e, branch){
  const av = availTechs(e, branch);
  if (!av.length){ e.rq[branch] = null; return; }
  if (e.ai){
    const race = RACES[e.race];
    const scored = av.map(id => {
      const t = TECHS[id]; let s = 1/Math.sqrt(techCost(e,id));
      const pr = (typeof aiProfile === 'function') ? aiProfile(e) : {war:race.agr, sci:.5, eco:.5};
      if (t.unlock) s *= 1.8 + pr.war * .9;               // gemi sınıfı açan tekno savaşçıya çok değerli
      if (t.e.dmgMul || t.e.hullMul || t.e.shMul) s *= (.6 + pr.war * 1.5);
      if (t.e.eDmgMul || t.e.eShMul) s *= (.6 + pr.war * 1.3);
      if (t.e.dipMul) s *= (.4 + race.dip);
      if (t.e.araMul) s *= (.7 + pr.sci * .9);
      if (t.e.minMul || t.e.alaMul || t.e.eneMul) s *= 1.25 + pr.eco * .4;
      if (t.e.capFlat) s *= (.8 + pr.war * .8);

      /* ═══ FAZ 27: SÜPER SİLAH TEKNOLOJİSİ ═══
         AI hiç Colossus üretemiyordu; kök neden m_yildiz'ın
         araştırma sırasında hiç seçilmemesiydi (skoru düşük,
         maliyeti devasa). Militarist ve alaşım zengini AI için
         ağırlık ×10'a çıkarılıyor. */
      /* FAZ 36: Gaia Mühendisliği — kriz sonrası ölü dünyaları
         dirilten AI için değerli. Enkaz varsa ağırlık artar. */
      if (id === 'm_gaia'){
        let enkaz = 0;
        for (const sy of G.sys){
          if (sy.owner !== e.id) continue;
          for (const pl of sy.planets) if (pl.shattered) enkaz++;
        }
        /* FAZ 41: ×1.8/enkaz yetmiyordu (100 yılda 0 terraform).
           Enkazı olan AI için Gaia Mühendisliği artık ezici
           öncelik — ölü dünya sayısıyla katlanarak artıyor. */
        if (enkaz) s *= (1 + enkaz * 6.5);
      }
      if (typeof SHIPS !== 'undefined' && SHIPS.col_s &&
          SHIPS.col_s.tech === id){
        const P = (typeof personaOf === 'function') ? personaOf(e) : null;
        const militarist = (P && P.n === 'Militarist') || pr.war > .70;
        const zengin = (e.inc && e.inc.ala || 0) > 60;
        if (militarist || zengin){
          s *= 10;
          /* İkisi birden ise daha da öncelikli */
          if (militarist && zengin) s *= 1.6;
        }
      }
      return {id, s};
    }).sort((a,b)=>b.s-a.s);
    e.rq[branch] = scored[0].id;
  } else {
    e.rq[branch] = av[0];
  }
}

/* ---------- inşa ---------- */
function canBuildShip(e, cls){
  const d = SHIPS[cls];
  if (d.tech && !e.techs[d.tech]) return false;
  for (const r in d.cost) if (e.res[r] < shipCost(e,cls)[r]) return false;
  return true;
}
function shipCost(e, cls){
  const d = SHIPS[cls], out = {};
  let disc = (cls === 'kol') ? (1 + e.mods.colCost) : 1;
  /* FAZ 54: Kriz Hazırlığı tasarısı gemi maliyetini düşürür */
  disc *= (1 + ((e.mods && e.mods.shipCost) || 0));
  for (const r in d.cost) out[r] = Math.max(1, Math.round(d.cost[r]*disc));
  return out;
}
function hasYard(sys){
  if (typeof hasStructYard === 'function' && hasStructYard(sys)) return true;
  return sys.planets.some(p => p.col && p.col.b.tersane > 0);
}
/* sistemdeki toplam tersane sayısı — aynı anda kaç gemi yapılabilir */
function yardCount(sys){
  let n = 0;
  for (const p of sys.planets) if (p.col) n += (p.col.b.tersane || 0);
  if (typeof hasStructYard === 'function' && hasStructYard(sys)) n += 2;
  return n;
}
/* ═══════════════════════════════════════════════════════════════════
   FAZ 47 — DONANMA İNŞA UYKUSU
   Oyuncunun kasası tükenirken ya da filo kapasitesi dolmuşken
   otomatik gemi kuyruğu ekonomiyi boğuyordu. Bu iki eşikte
   otomatik inşa uykuya geçer; ELLE inşa daima serbesttir.
   ═══════════════════════════════════════════════════════════════════ */
const NAVY_SLEEP_ALA = 500;      // kasa alaşımı bu değerin altındaysa
const NAVY_SLEEP_CAP = .90;      // kapasite doluluk oranı

function navyAsleep(e){
  if (!e) return false;
  if ((e.res.ala || 0) < NAVY_SLEEP_ALA) return {uyku:true, why:'kasa'};
  const kul = (typeof fleetUsage === 'function') ? fleetUsage(e) : 0;
  const cap = Math.max(1, e.cap || 1);
  if (kul / cap >= NAVY_SLEEP_CAP) return {uyku:true, why:'kapasite'};
  return {uyku:false};
}

function queueShip(e, sys, cls, oto){
  /* ═══ FAZ 59: SABOTE EDİLMİŞ TERSANE ═══
     Kilitli tezgâhta gemi üretilemez — oyuncu da AI da. */
  if (sys && sys.yardLock && sys.yardLock > (G.memAge || 0)){
    if (e && e.id === 0 && !oto)
      say('⚓ ' + sys.name + ' tersanesi sabote edilmiş — ' +
          (sys.yardLock - (G.memAge || 0)) + ' ay kapalı', 'war');
    return false;
  }
  /* FAZ 47: yalnız OTOMATİK çağrılar uykuya tabidir */
  if (oto){
    const uy = navyAsleep(e);
    if (uy.uyku) return false;
  }
  /* FAZ 34: organik sürü gemileri yalnız krize aittir */
  if (SHIPS[cls] && SHIPS[cls].crisisOnly && !e.crisisSide) return false;
  /* ═══ FAZ 32: SÜPER SİLAH YASAĞI ═══
     Konseyden geçtiyse üyeler Colossus inşa edemez. */
  if (cls === 'col_s' && typeof councilExists === 'function' && councilExists() &&
      G.council.laws.colYasak && typeof inCouncil === 'function' && inCouncil(e)){
    if (e.id === 0) say('Süper Silah Yasağı yürürlükte — Colossus inşa edilemez', 'war');
    return false;
  }
  if (!hasYard(sys) || sys.owner !== e.id) return false;
  const c = shipCost(e, cls);
  for (const r in c) if (e.res[r] < c[r]) return false;
  for (const r in c) e.res[r] -= c[r];
  const days = Math.round((SHIPS[cls].sz*14 + 16) / (1 + e.mods.buildMul));
  sys.queue.push({cls, e:e.id, left:days, tot:days});
  return true;
}
/* ═══════════════════════════════════════════════════════════════════
   FAZ 13 — ZAMANLI İNŞAAT KUYRUĞU
   Bina artık anında bitmiyor. sys.work (uzay yapıları) ile aynı
   kalıbı izler: col.q dizisine girer, colonyBuildTick her gün
   ilerletir. Kuyruktaki işler slot ve max sınırlarına dahildir,
   yoksa aynı binadan sınırsız sıraya alınabilirdi.
   ═══════════════════════════════════════════════════════════════════ */

/* Kuyruktaki işler dahil dolu slot sayısı */
function colonyQueued(col){
  if (!col.q || !col.q.length) return 0;
  /* Yıkım işleri slot DOLDURMAZ — tersine boşaltacaklar */
  let n = 0;
  for (const w of col.q) if (!w.dem) n++;
  return n;
}
/* Kuyruktaki toplam iş (inşa + yıkım) — arayüz sayacı için */
function colonyJobs(col){ return (col.q && col.q.length) || 0; }
function colonyQueuedOf(col, key){
  if (!col.q) return 0;
  let n = 0;
  for (const w of col.q) if (w.key === key && !w.dem) n++;
  return n;
}

/* İnşa süresi (gün): maliyet ne kadar ağırsa o kadar uzun,
   imparatorluğun inşa gücü (buildMul) kısaltır. */
function buildDays(e, key){
  const B = BUILDINGS[key];
  let agirlik = 0;
  for (const r in B.c) agirlik += B.c[r] * (r === 'ala' ? 2.2 : r === 'ene' ? .8 : 1);
  /* 120 mineral ≈ 60 gün (2 ay); taban 30 gün, tavan 360 gün */
  let gun = 30 + agirlik * .42;
  const hiz = 1 + ((e.mods && e.mods.buildMul) || 0);
  gun = gun / Math.max(.35, hiz);
  return clamp(Math.round(gun), 20, 360);
}

function queueBuilding(e, sys, pl, key){
  const B = BUILDINGS[key], col = pl.col;
  if (!col || pl.owner !== e.id) return false;
  /* Kuyruktakiler de sayılır: aynı binadan max'ı aşacak sipariş verilemez */
  if ((col.b[key]||0) + colonyQueuedOf(col, key) >= B.max) return false;
  if (colonyUsed(col) + colonyQueued(col) >= colonySlots(col, e, pl)) return false;
  for (const r in B.c) if (e.res[r] < B.c[r]) return false;

  /* Kaynak PEŞİN alınır — iptal edilirse birebir iade edilir */
  const odenen = {};
  for (const r in B.c){ e.res[r] -= B.c[r]; odenen[r] = B.c[r]; }

  const gun = buildDays(e, key);
  col.q = col.q || [];
  col.q.push({key, left: gun, tot: gun, paid: odenen, s: sys.id, p: pl.i});
  return true;
}

/* Günlük ilerleme — dailyTick çağırır (structTick ile aynı ritim) */
function colonyBuildTick(dt){
  for (const sys of G.sys){
    for (const pl of sys.planets){
      const col = pl.col;
      if (!col || !col.q || !col.q.length) continue;
      const e = G.emps[pl.owner];
      if (!e || e.dead){ col.q.length = 0; continue; }

      /* Yalnızca en öndeki iş ilerler — kuyruk gerçekten SIRA */
      const w = col.q[0];
      w.left -= dt;
      if (w.left > 0) continue;

      col.q.shift();
      const B = BUILDINGS[w.key];

      /* ── YIKIM İŞİ ── */
      if (w.dem){
        if ((col.b[w.key] || 0) <= 0) continue;          // bina zaten yok
        col.b[w.key]--;
        if (col.b[w.key] <= 0) delete col.b[w.key];
        for (const r in (w.refund || {})) e.res[r] = (e.res[r]||0) + w.refund[r];
        sys.def = sysDefense(sys);
        recalcMods(e);
        if (pl.owner === 0){
          const hurda = Object.keys(w.refund || {})
            .map(r => RES[r].ico + w.refund[r]).join(' ');
          say(B.n + ' yıkıldı — ' + (col.name || pl.name) +
              (hurda ? ' · hurda ' + hurda : ''), 'win');
        }
        continue;
      }

      /* Bitiş anında slot hâlâ uygun mu? (nüfus düşmüş olabilir) */
      if ((col.b[w.key]||0) >= B.max ||
          colonyUsed(col) >= colonySlots(col, e, pl)){
        /* Yer kalmadı: kaynak iade edilir, inşaat düşer */
        for (const r in w.paid) e.res[r] = (e.res[r]||0) + w.paid[r];
        if (pl.owner === 0)
          say(B.n + ' tamamlanamadı — yer kalmadı, kaynak iade edildi', 'war');
        continue;
      }
      col.b[w.key] = (col.b[w.key]||0) + 1;
      sys.def = sysDefense(sys);
      if (pl.owner === 0) say(B.n + ' tamamlandı — ' + (col.name || pl.name), 'win');
    }
  }
}

/* ── FAZ 14: BİNA YIKIMI ──
   Yıkım da bir İŞTİR: aynı col.q kuyruğuna girer, inşaattan kısa
   sürer ve tamamlanınca slotu boşaltır. Sökülen malzemenin bir
   kısmı geri kazanılır. */
function demolishDays(e, key){
  /* Yıkım inşaatın ~%40'ı kadar sürer, taban 15 gün */
  return clamp(Math.round(buildDays(e, key) * .40), 15, 120);
}
function demolishRefund(key){
  const B = BUILDINGS[key];
  const out = {};
  for (const r in B.c) out[r] = Math.round(B.c[r] * .35);   // %35 hurda değeri
  return out;
}

function queueDemolish(e, sys, pl, key){
  const col = pl.col;
  if (!col || pl.owner !== e.id) return false;
  if (!BUILDINGS[key]) return false;
  /* Zaten yıkım sırasında olanları düş */
  let sirada = 0;
  if (col.q) for (const w of col.q) if (w.dem && w.key === key) sirada++;
  if ((col.b[key] || 0) - sirada <= 0) return false;
  /* Son santral yıkılamaz — koloni tamamen ölmesin */
  if (key === 'santral' && (col.b.santral || 0) - sirada <= 1) return false;

  const gun = demolishDays(e, key);
  col.q = col.q || [];
  col.q.push({key, left: gun, tot: gun, dem: true,
              paid: {}, refund: demolishRefund(key), s: sys.id, p: pl.i});
  return true;
}

/* İptal: kaynak ANINDA ve BİREBİR iade edilir */
function cancelBuild(e, sys, pl, idx){
  const col = pl.col;
  if (!col || !col.q || !col.q[idx]) return false;
  if (pl.owner !== e.id) return false;
  const w = col.q[idx];
  /* Çift iade koruması: kayıt kuyruktan ÖNCE düşürülür */
  col.q.splice(idx, 1);
  if (w.refunded) return false;
  w.refunded = true;
  /* Yıkım emrinde peşin ödeme yoktur — iade de yoktur */
  if (w.dem){
    if (e.id === 0) say(BUILDINGS[w.key].n + ' yıkım emri iptal edildi');
    return true;
  }
  for (const r in w.paid) e.res[r] = (e.res[r]||0) + w.paid[r];
  if (e.id === 0){
    const dokum = Object.keys(w.paid).map(r => RES[r].ico + Math.round(w.paid[r])).join(' ');
    say(BUILDINGS[w.key].n + ' iptal edildi — ' + dokum + ' iade edildi');
  }
  return true;
}

/* ---------- TERRAFORM & HABİTAT ---------- */
function terraLevelMax(e){
  if (e.techs && e.techs.t_terra2) return 3;
  if (e.techs && e.techs.t_terra1) return 1;
  return 0;
}
function canTerraform(e, pl){
  if (!pl.col || pl.owner !== e.id) return false;
  if (PLANETS[pl.t].k !== 'hab') return false;
  if (pl.terraJob) return false;
  const lvl = pl.terra || 0;
  return lvl < terraLevelMax(e) && lvl < TERRA_STEPS.length;
}
function startTerraform(e, pl){
  if (!canTerraform(e, pl)) return false;
  const step = TERRA_STEPS[pl.terra || 0];
  if (e.res.min < step.min || e.res.ene < step.ene) return false;
  e.res.min -= step.min; e.res.ene -= step.ene;
  pl.terraJob = {left: step.ay * 30, tot: step.ay * 30};
  return true;
}
/* habitat: yaşanamaz gezegene küçük yerleşim */
function canHabitat(e, sys, pl){
  if (!e.techs || !e.techs.t_habitat) return false;
  if (pl.owner >= 0 || pl.col) return false;
  if (PLANETS[pl.t].k === 'hab') return false;        // yaşanabilir dünyaya gerek yok
  if (PLANETS[pl.t].k === 'ast') return false;
  if (sys.owner >= 0 && sys.owner !== e.id) return false;
  const claim = claimOf(sys);
  if (claim >= 0 && claim !== e.id && !e.war[claim]){
    // Açık Sınırlar doktrinine sahip komşunun bölgesine serbestçe yerleşilir
    if (!hasCivic(G.emps[claim], 'openborder')) return false;
  }
  return true;
}
function buildHabitat(e, sys, pl){
  if (!canHabitat(e, sys, pl)) return false;
  const c = BUILDINGS.habitat.c;
  for (const r in c) if (e.res[r] < c[r]) return false;
  for (const r in c) e.res[r] -= c[r];
  pl.owner = e.id;
  pl.hab = true;                                       // habitat kolonisi
  /* FAZ 21: kara savaşı altyapısı — shield (0-100) ve garrison.
     Bu fazda YALNIZCA veri; muharebe matematiği yazılmadı. */
  pl.col = {pop:2, stab:55, grow:0, b:{santral:1}, cap:5,
            name:pl.name + ' Habitatı', f:'sanayi', fcd:0,
            shield:0, garrison:0};
  /* FAZ 77A: koloni şoku — Öğrenen Sinapslar süreyi kısaltır */
  {
    const kisalt = 1 + ((e.mods && e.mods.colShock) || 0);   // -0.50 → yarı
    const ay = Math.max(0, Math.round(COL_SHOCK_MONTHS * kisalt));
    if (ay > 0){ pl.col.shock = (G.memAge || 0) + ay; pl.col.shockTot = ay; }
  }
  if (sys.owner < 0) sys.owner = e.id;
  e.colonies.push({s:sys.id, p:pl.i});
  recalcMods(e);
  if (!e.ai) say('Habitat kuruldu — ' + pl.name, 'win');
  return true;
}

/* ---------- kolonizasyon ---------- */
/* ═══════════════════════════════════════════════════════════════════
   FAZ 76 — KOLONİ HEDEF KİLİDİ
   İki koloni gemisi aynı gezegene yollanınca ikisi de heba
   oluyordu. Artık gemi yola çıkarken gezegen pl.colonyClaim ile
   işaretleniyor; başka gemi orayı hedefleyemiyor. Kilidi koyan
   filo ölürse kilit kendiliğinden düşer.
   ═══════════════════════════════════════════════════════════════════ */
function colonyClaimedBy(pl, benimId){
  if (!pl || pl.colonyClaim === undefined) return false;
  if (pl.colonyClaim === benimId) return false;          // kendi kilidim
  const sahip = G.fleets.find(q => q.id === pl.colonyClaim && q.ships.length);
  if (!sahip){ delete pl.colonyClaim; return false; }    // sahibi ölmüş
  return true;
}

function claimColony(f, sys, pIdx){
  const pl = sys.planets[pIdx];
  if (!pl) return false;
  if (colonyClaimedBy(pl, f.id)) return false;
  /* Eski hedefimin kilidini bırak */
  if (f.ord && f.ord.t === 'kol'){
    const eski = G.sys[f.ord.s];
    const ep = eski && eski.planets[f.ord.p];
    if (ep && ep.colonyClaim === f.id) delete ep.colonyClaim;
  }
  pl.colonyClaim = f.id;
  return true;
}

function canColonize(e, sys, pl){
  /* FAZ 24: Parçalanmış dünya bir daha kolonileştirilemez */
  if (pl.shattered) return false;
  if (pl.owner >= 0 || habOf(e, pl) < 35) return false;
  if (sys.owner >= 0 && sys.owner !== e.id) return false;
  // başka bir imparatorluğun sınırları içindeyse, savaş yoksa yerleşemezsin
  const claim = claimOf(sys);
  if (claim >= 0 && claim !== e.id && !e.war[claim]) return false;
  return true;
}
/* ═══ FAZ 77A: KOLONİ ŞOKU ═══
   Yeni koloni hemen tam verim vermez; birkaç yıl ayak uydurur.
   "Öğrenen Sinapslar" bu süreyi yarıya indirir. */
const COL_SHOCK_MONTHS = 36;

function colonyShockMul(e, col){
  if (!col || !col.shock) return 1;
  const kalan = col.shock - (G.memAge || 0);
  if (kalan <= 0){ delete col.shock; return 1; }
  const toplam = col.shockTot || COL_SHOCK_MONTHS;
  /* 0.45 → 1.0 arası doğrusal toparlanma */
  return clamp(1 - (kalan / toplam) * .55, .45, 1);
}

function doColonize(e, sys, pl){
  pl.owner = e.id;
  pl.col = {pop: (hasCivic(e,'seedPop') ? 7 : 3) + (hasPerk(e,'migration') ? 3 : 0), stab:50, grow:0,
            b:{maden:1, santral:1, ciftlik:1}, cap:8, name:pl.name, f:'sanayi', fcd:0,
            shield:0, garrison:0};
  if (sys.owner < 0) sys.owner = e.id;
  e.colonies.push({s:sys.id, p:pl.i});
  recalcMods(e);
  if (typeof facEvent === 'function') facEvent(e,'colony');
  if (!e.ai) say('Koloni kuruldu — ' + pl.name, 'win');
}

/* ---------- TİCARET AKIŞI ----------
   Ticaret anlaşmalı taraflar fazla kaynaklarını takas eder: bolluğu
   olan verir, kıtlığı olan alır ve satan taraf enerji kârı yapar. */
function tradeFlowTick(){
  for (const a of G.emps){
    if (a.dead || a.wild || !a.pact) continue;
    for (const bid in a.pact){
      if (!a.pact[bid]) continue;
      const b = G.emps[bid];
      if (!b || b.dead || a.war[b.id]) continue;
      if (typeof tradeBlocked === 'function' && tradeBlocked(a, b)) continue;
      if (+bid < a.id) continue;                 // her çifti bir kez işle
      const tr = a.trade;
      if (!tr || !tr.links || !tr.links.some(l => l.dis && !l.bl)) continue;
      const vol = clamp((tr.vol || 0) / 90, .4, 3);
      let moved = 0;
      /* GERÇEK TAKAS: her taraf fazlasını verir, eksiğini alır.
         Enerji kârı yok — mal karşılığı mal. */
      const RES_K = ['min','ene','yiy','ala','tuk'];
      const surplusA = [], surplusB = [], needA = [], needB = [];
      for (const r of RES_K){
        const ai = (a.inc && a.inc[r]) || 0, bi = (b.inc && b.inc[r]) || 0;
        if (ai > 5) surplusA.push({r, v:ai}); else if (ai < 2) needA.push(r);
        if (bi > 5) surplusB.push({r, v:bi}); else if (bi < 2) needB.push(r);
      }
      surplusA.sort((x,y)=>y.v-x.v); surplusB.sort((x,y)=>y.v-x.v);
      // A'nın fazlası B'nin ihtiyacıysa takas kur; karşılığında B'nin fazlasından al
      const pairs = [];
      for (const sA of surplusA){
        if (!needB.includes(sA.r)) continue;
        const sB = surplusB.find(x => needA.includes(x.r) && x.r !== sA.r);
        if (!sB) continue;
        pairs.push([sA, sB]);
        if (pairs.length >= 2) break;
      }
      for (const [sA, sB] of pairs){
        const give = Math.min(sA.v * .16, 10) * vol;
        const take = Math.min(sB.v * .16, 10) * vol;
        a.res[sA.r] = Math.max(0, (a.res[sA.r]||0) - give);
        b.res[sA.r] = (b.res[sA.r]||0) + give;
        b.res[sB.r] = Math.max(0, (b.res[sB.r]||0) - take);
        a.res[sB.r] = (a.res[sB.r]||0) + take;
        moved += give + take;
        a.lastSwap = a.lastSwap || {};
        a.lastSwap[b.id] = RES[sA.r].ico + '→ ' + RES[sB.r].ico;
        b.lastSwap = b.lastSwap || {};
        b.lastSwap[a.id] = RES[sB.r].ico + '→ ' + RES[sA.r].ico;
      }
      // fazlası olan hiç yoksa: lüks mal erişimi tek yönlü akar (mevcut sistem)
      if (!pairs.length) moved = 0;
      a.tradeFlow = a.tradeFlow || {}; b.tradeFlow = b.tradeFlow || {};
      a.tradeFlow[b.id] = moved; b.tradeFlow[a.id] = moved;
    }
  }
}

/* aylık haraç akışı */
function tributeTick(){
  for (const e of G.emps){
    if (e.dead || !e.tribute || !e.tribute.length) continue;
    for (let i = e.tribute.length - 1; i >= 0; i--){
      const t = e.tribute[i];
      if (G.day > t.until){ e.tribute.splice(i, 1); continue; }
      const to = G.emps[t.to];
      if (!to || to.dead){ e.tribute.splice(i, 1); continue; }
      const pay = Math.min(t.v, e.res[t.r] || 0);
      e.res[t.r] = (e.res[t.r] || 0) - pay;
      to.res[t.r] = (to.res[t.r] || 0) + pay;
    }
  }
}


/* ═══════════════════════════════════════════════════════════════════
   FAZ 21 — KARA SAVAŞI VERİ TEMELİ
   Yalnızca DURUM hesabı. Muharebe, zar atımı, işgal akışı YOK —
   onlar bir sonraki fazın konusu. Buradaki iki değer gezegenin
   yerden savunulabilirliğini tanımlar:
     shield   0-100  Gezegen Kalkanı. Yörüngeden bombardımanı ve
                     çıkarmayı engeller; enerji ve yapıyla beslenir.
     garrison 0-...  Garnizon Gücü. Yüzeyde bekleyen kuvvet;
                     nüfus, istikrar ve savunma yapılarıyla artar.
   ═══════════════════════════════════════════════════════════════════ */

/* Kalkanın ulaşabileceği tavan — yapı ve teknolojiye bağlı */
function shieldCap(col, e, pl){
  if (!col) return 0;
  /* Gerçek bina listesine göre: 'kalkan'/'karakol' diye bina YOK.
     Kalkanı Savunma Üssü ve Uzay Asansörü besliyor; kalkan
     teknolojisi (shMul) tavanı yükseltiyor. */
  let cap = 0;
  if (col.b.kale)    cap += 42 * col.b.kale;
  if (col.b.asansor) cap += 18 * col.b.asansor;
  if (col.b.habitat) cap += 10 * col.b.habitat;
  if (e && pl && e.home === pl.s) cap += 22;        // başkent korunaklı
  if (e && e.mods && e.mods.shMul) cap *= (1 + e.mods.shMul);
  return clamp(Math.round(cap), 0, 100);
}

/* Garnizon gücü: yüzeyde kimin durduğu */
function garrisonOf(col, e, pl){
  if (!col) return 0;
  let g = col.pop * 1.6;                       // halk direnişi
  g *= .55 + (col.stab / 100) * .75;           // istikrarsız halk savaşmaz
  if (col.b.kale)    g += 38 * col.b.kale;
  if (col.b.klinik)  g += 12 * col.b.klinik;       // gen klinikleri asker yetiştirir
  if (e){
    /* ═══ FAZ 53: KARA SAVUNMASI FİZYOLOJİSİ ═══
       ÖLÇÜM: bonus yalnız groundPower()'a (istila) eklenmişti;
       garrisonOf() economy.js'te olduğu için savunma tarafı
       etkilenmiyordu — üç fizyolojide de garnizon 19 çıktı.
       Kayaç taş etli (+%20 zırh), kuş hafif kemikli (−%15). */
    if (typeof physioOf === 'function'){
      const phG = physioOf(e);
      if (phG){
        if (phG.groundArmor) g *= (1 + phG.groundArmor);
        if (phG.groundFrail) g *= (1 - phG.groundFrail);
      }
    }
    if (typeof hasCivic === 'function'){
      if (hasCivic(e, 'warFury'))  g *= 1.25;
      if (hasCivic(e, 'fortress')) g *= 1.35;
    }
    /* FAZ 32: Sınır Güvenliği Paktı — konsey üyelerine garnizon bonusu */
    if (typeof councilExists === 'function' && councilExists() &&
        G.council.laws.sinirGuv && typeof inCouncil === 'function' && inCouncil(e))
      g *= 1.20;
    if (e.mods && e.mods.dmgMul) g *= (1 + e.mods.dmgMul * .5);
    /* ═══ FAZ 53: KARA SAVUNMASI FİZYOLOJİSİ ═══
       ÖLÇÜM: bonuslar yalnız groundPower()'a (istila gücü)
       bağlanmıştı; garnizon SAVUNMASI üç fizyolojide de aynı
       19 çıkıyordu. Görev "istila/savunma" diyordu — savunma
       yarısı eksikti.
         Kayaç  → taş etli, +%20 zırh
         Kuş    → hafif kemikli, −%15 kırılgan */
    if (typeof physioOf === 'function'){
      const ph = physioOf(e);
      if (ph){
        if (ph.groundArmor) g *= (1 + ph.groundArmor);
        if (ph.groundFrail) g *= (1 - ph.groundFrail);
      }
    }
  }
  return Math.max(0, Math.round(g));
}

/* Aylık güncelleme — economyTick içinden çağrılır.
   Kalkan tavana doğru yavaşça dolar, kuşatmada erir (erime
   mekaniği sonraki fazda; şu an yalnız doluş). */
function groundTick(){
  for (const e of G.emps){
    if (e.dead || e.wild) continue;
    for (const c of e.colonies){
      const sys = G.sys[c.s];
      if (!sys) continue;
      const pl = sys.planets[c.p];
      if (!pl || !pl.col) continue;
      const col = pl.col;
      /* ═══ FAZ 29: SIKIYÖNETİM ═══
         El değiştiren gezegende 24 ay boyunca istikrar 40'ın
         altına inemez ve garnizon hızla toparlanır. Böylece filo
         çekilse bile gezegen anında geri teslim olmaz.
         ÖLÇÜM (tohum 4242): bir gezegen 60 yılda 7 kez el
         değiştiriyordu — ping-pong'un kaynağı buydu. */
      if (pl.martial_law > 0){
        if (col.stab < 40) col.stab = 40;
        col.martialActive = true;
      } else if (col.martialActive) {
        delete col.martialActive;
      }
      const cap = shieldCap(col, e, {s:sys.id, i:pl.i});
      if (col.shield === undefined) col.shield = 0;
      /* Enerji varsa kalkan onarılır; yoksa yavaşça söner */
      const enerjiVar = (e.inc && e.inc.ene >= 0) || (e.res.ene || 0) > 50;
      if (col.shield < cap && enerjiVar) col.shield = Math.min(cap, col.shield + 4);
      else if (col.shield > cap) col.shield = Math.max(cap, col.shield - 3);
      else if (!enerjiVar) col.shield = Math.max(0, col.shield - 2);
      /* GARNİZON YENİDEN TOPLANIR, IŞINLANMAZ.
         Eskiden her ay garrisonOf() değerine SIFIRLANIYORDU; yani
         bombardımanın verdiği hasar bir sonraki ay siliniyor ve
         kuşatma asla ilerlemiyordu. Artık tabana doğru ayda %12
         toparlanıyor — hasar kalıcı, kuşatma anlamlı. */
      const taban = garrisonOf(col, e, pl);
      col.garrisonBase = taban;
      if (col.garrison === undefined) col.garrison = taban;
      if (col.garrison < taban){
        /* Kuşatma altındaysa toparlanma durur */
        const kusatmaVar = (col.siege || 0) > 0;
        /* Sıkıyönetimde garnizon üç kat hızlı toparlanır */
        const hiz = (pl.martial_law > 0) ? .36 : .12;
        if (!kusatmaVar) col.garrison = Math.min(taban, col.garrison + taban * hiz + 2);
      } else if (col.garrison > taban){
        col.garrison = taban;               // takviye kalkmışsa fazlalık düşer
      }
    }
  }
}


/* ═══════════════════════════════════════════════════════════════════
   FAZ 22 — KARA SAVAŞLARI
   Dört ayak, tek aylık tik (invasionTick):
     1. SAVUNMA DESTEĞİ — dost yörüngedeki ordu garnizona eklenir
     2. YÖRÜNGE BOMBARDIMANI — savaş filoları kalkanı, sonra
        garnizonu döver. Yalnız ateşle düşen gezegen KATASTROF yaşar.
     3. YÜZEY SAVAŞI — taarruz ordusu garnizonla çarpışır
     4. TEMİZ İŞGAL — ordu kazanırsa binalar ve halk korunur,
        kalan güç yeni garnizon olur.
   Bireysel asker objesi YOK; her şey filo düzeyinde sayısal.
   ═══════════════════════════════════════════════════════════════════ */

/* Bir sistemdeki, verilen imparatorluğa ait filoları tek geçişte topla.
   invasionTick sıcak döngü olduğu için her sistem için bir kez çağrılır. */
/* ═══════════════════════════════════════════════════════════════════
   FAZ 25 — TAKTİKSEL ATEŞKES
   Bir sisteme dost taarruz ordusu YOLDAYSA, oradaki bombardıman
   garnizonu sıfırlamaz; %8 seviyesinde bırakır. Böylece gezegen
   katastrofla değil, ordu varınca TEMİZ İŞGAL ile düşer.
   Faz 24 tanısı: ordular hazırdı ama cephe penceresi ortalama
   2 ay sürüyor ve bombardıman önce bitiriyordu.
   ═══════════════════════════════════════════════════════════════════ */
const TRUCE_FLOOR = .08;        // garnizonun bırakılacağı taban oranı

/* Bu sisteme, verilen imparatorluğun (ya da müttefikinin) taarruz
   ordusu intikal halinde mi? Varış süresi de döner. */
function incomingArmy(sysId, empId){
  const e = G.emps[empId];
  if (!e) return null;
  let enYakin = null;
  for (const f of G.fleets){
    if (!f.ships || !f.ships.length) continue;
    if (f.e !== empId && !(e.ally && e.ally[f.e])) continue;
    if (typeof isTransport !== 'function' || !isTransport(f)) continue;
    /* Zaten oradaysa ateşkese gerek yok — çıkarma başlar */
    if (f.sys === sysId && !f.mv) continue;
    const varis = f.mv ? f.mv.to
                : (f.path && f.path.length ? f.path[f.path.length - 1] : -1);
    if (varis !== sysId) continue;
    /* Kaba varış tahmini: kalan yol / hız */
    const kalan = (f.path ? f.path.length : 1) + (f.mv ? 1 : 0);
    const skor = kalan;
    if (!enYakin || skor < enYakin.mesafe) enYakin = {f, mesafe: skor};
  }
  return enYakin;
}

/* ═══ FAZ 41 OPTİMİZASYONU ═══
   PROFİL: invasionTick, economyTick'in en pahalı alt tikiydi.
   orbitForces her sistem için TÜM filo dizisini tarıyordu:
   100 sistem × 82 filo = 8200 iterasyon/ay. Artık filolar ayda
   bir kez sisteme göre indeksleniyor (tek geçiş) ve her sistem
   kendi kovasını okuyor. */
let _orbitIdx = null, _orbitIdxAt = -1;

function orbitIndex(){
  if (_orbitIdxAt === G.day && _orbitIdx) return _orbitIdx;
  const idx = {};
  for (const f of G.fleets){
    if (f.sys < 0 || !f.ships || !f.ships.length) continue;
    (idx[f.sys] || (idx[f.sys] = [])).push(f);
  }
  _orbitIdx = idx; _orbitIdxAt = G.day;
  return idx;
}

function orbitForces(sys){
  const out = {};
  const liste = orbitIndex()[sys.id];
  if (!liste) return out;
  for (const f of liste){
    if (!f.ships.length) continue;
    let o = out[f.e];
    if (!o) o = out[f.e] = {war:0, ground:0, wf:[], tf:[]};
    if (typeof isTransport === 'function' && isTransport(f)){
      o.ground += groundPower(f);
      o.tf.push(f);
    }
    if (typeof isArmed === 'function' && isArmed(f)){
      o.war += fleetPower(f);
      o.wf.push(f);
    }
  }
  return out;
}

/* KATASTROF: gezegen yalnız bombardımanla düştü. Kazanan enkaz alır. */
function bombardCatastrophe(sys, pl, byId){
  const col = pl.col;
  if (!col) return;
  /* Binaların rastgele yarısı yıkılır — en az biri hep kalır */
  const keys = Object.keys(col.b);
  let yikilan = 0;
  for (const k of keys){
    for (let i = col.b[k]; i > 0; i--){
      if (rnd() < .5){ col.b[k]--; yikilan++; }
    }
    if (col.b[k] <= 0) delete col.b[k];
  }
  if (!Object.keys(col.b).length) col.b = {santral:1};
  /* Nüfus kırılır, istikrar dibe vurur */
  const oncePop = col.pop;
  col.pop = Math.max(1, Math.round(col.pop * .35));
  col.stab = 8;
  col.shield = 0;
  col.garrison = 0;
  col.scorched = (G.memAge || 0);          // enkaz damgası
  pl.recent_conquest = 36;                 // FAZ 27: dokunulmazlık
  pl.martial_law = 24;                     // FAZ 29: sıkıyönetim
  /* Kuyruktaki inşaatlar da yanar */
  if (col.q && col.q.length) col.q.length = 0;
  sys.def = sysDefense(sys);

  const kazanan = G.emps[byId];
  if (byId === 0)
    say('KATASTROF — ' + (col.name || pl.name) + ' teslim oldu ama harabe: ' +
        yikilan + ' yapı yıkıldı, nüfus ' + Math.round(oncePop) + ' → ' + col.pop, 'war');
  else if (pl.owner === 0)
    say('GEZEGENİN BOMBALANDI — ' + (col.name || pl.name) + ' harabeye döndü', 'war');
  else if (kazanan)
    say(kazanan.name + ', ' + (col.name || pl.name) + ' gezegenini bombalayarak aldı', 'war');

  /* Galaksi bunu affetmez: bombardımanla fetih itibar kaybettirir */
  if (kazanan && !kazanan.wild){
    for (const x of G.emps){
      if (x.dead || x.wild || x.id === byId) continue;
      x.rel[byId] = clamp(x.rel[byId] - 10, -100, 100);
      if (typeof remember === 'function') remember(x, byId, 'sistemAldi');
    }
    kazanan.threat = (kazanan.threat || 0) + 12;
  }
}

function invasionTick(){
  _orbitIdxAt = -1;                      // FAZ 41: indeksi bu ay için tazele
  for (const sys of G.sys){
    /* Hızlı eleme: koloni yoksa ya da filo yoksa geç */
    let kolVar = false;
    for (const pl of sys.planets) if (pl.col){ kolVar = true; break; }
    if (!kolVar) continue;

    const kuv = orbitForces(sys);
    const idler = Object.keys(kuv);
    if (!idler.length) continue;

    for (const pl of sys.planets){
      const col = pl.col;
      if (!col || pl.owner < 0) continue;
      const sahip = G.emps[pl.owner];
      if (!sahip || sahip.dead) continue;

      /* ── 1. SAVUNMA DESTEĞİ ──
         Dost yörüngedeki taarruz orduları garnizona eklenir.
         Kalıcı değil: her ay yeniden hesaplanır (col.garrison
         groundTick'te tabana sıfırlanır, burada takviye edilir). */
      let takviye = 0;
      for (const id of idler){
        const oe = G.emps[id];
        if (!oe || oe.dead) continue;
        if (+id !== pl.owner && !(oe.ally && oe.ally[pl.owner])) continue;
        takviye += kuv[id].ground;
      }
      if (takviye){
        col.garrison = (col.garrison || 0) + takviye;
        col.reinforced = takviye;
      } else if (col.reinforced) {
        col.reinforced = 0;
      }
      /* Garnizon ayaktaysa kuşatma sayacı sıfırlanır */
      if ((col.garrison || 0) > 0 && col.siege) col.siege = 0;

      /* Saldırganlar: bu gezegenin sahibiyle savaşta olanlar */
      for (const id of idler){
        const atk = G.emps[id];
        if (!atk || atk.dead || +id === pl.owner) continue;
        if (!atk.war[pl.owner] && !atk.wild) continue;
        const K = kuv[id];

        /* ── FAZ 27: KALKAN SABOTAJI ──
           Kuşatma sürerken istihbarat devreye girer. Başarılıysa
           kalkan anında çöker ve çıkarma yolu açılır. */
        if (K.war > 0 && (col.shield || 0) > 5 && typeof trySabotage === 'function')
          trySabotage(atk, sys, pl);

        /* ── 2. YÖRÜNGE BOMBARDIMANI ── */
        if (K.war > 0){
          /* Filo gücünün küçük bir oranı yüzeye iner. Katsayı bilinçli
             düşük: kuşatma birkaç ay sürsün, oyuncu kalkan ve
             garnizon barlarının erimesini izleyebilsin. */
          let atis = K.war * .011;
          /* ═══ FAZ 34: SÜRÜ KRALİÇESİ KALKAN ERİTİR ═══
             Kraliçe yörüngedeyse gezegen kalkanı doğrudan çözülür —
             sürünün kuşatması dakikalar değil, saatler sürer. */
          if (atk.crisisSide){
            let kralice = 0;
            for (const wf of K.wf)
              for (const sh of wf.ships)
                if (SHIPS[sh.c] && SHIPS[sh.c].shieldEat) kralice++;
            if (kralice && (col.shield || 0) > 0){
              col.shield = Math.max(0, col.shield - 25 * kralice);
              if (pl.owner === 0 && col.shield <= 0)
                say('KALKAN ERİDİ — Sürü Kraliçesi ' + (col.name || pl.name) +
                    ' savunmasını çözdü', 'war');
            }
            /* ═══ FAZ 35: ANINDA YUTMA (garnizon şartıyla) ═══
               Kraliçe kalkanı indirdiği an yutar — AMA yüzeyde hâlâ
               direniş varsa önce onu kırması gerekir.
               ÖLÇÜM: şartsız anında yutma dengeyi bozdu; bir tohumda
               36 koloninin 34'ü yutuldu (galaksi silindi). Garnizon
               şartı savunmaya anlam veriyor: kale kuran hayatta
               kalıyor, çıplak koloni anında gidiyor. */
            if (kralice && (col.shield || 0) <= 0){
              const direnis = col.garrison || 0;
              /* Kraliçeler garnizonu hızla eritir ama sıfırlamadan yutamaz */
              if (direnis > 0){
                col.garrison = Math.max(0, direnis - 45 * kralice);
                if (col.garrison <= 0 && pl.owner === 0)
                  say('YÜZEY DİRENİŞİ KIRILDI — ' + (col.name || pl.name) +
                      ' savunmasız', 'war');
              } else if (typeof swarmDevour === 'function'){
                swarmDevour(sys, pl);
                break;
              }
            }
            atis *= 1.8;                    // sürü acımasız
          }
          if (typeof hasCivic === 'function' && hasCivic(atk, 'blood')) atis *= 1.35;
          /* Önce kalkan emer */
          if ((col.shield || 0) > 0){
            const emilen = Math.min(col.shield, atis * .55);
            col.shield -= emilen;
            atis -= emilen * 1.8;         // kalkan ateşi verimsizleştirir
          }
          if (atis > 0 && (col.shield || 0) <= 0){
            /* SİPERE GİRMİŞ DİRENİŞ:
               Yörüngeden ateş garnizonu BASTIRIR ama kolay kolay
               yok edemez. Son %25'lik dilime inildikçe her atış
               dörtte bir etki eder — savunmacılar yer altına iner.
               Bu, taarruz ordusunu gerçekten değerli kılıyor:
               ölçümde AI %95 bombardımanla fethediyordu, ordular
               yetişemeden gezegen düşüyordu. */
            const taban = col.garrison || 0;
            const dipEsik = (col.garrisonBase || taban) * .25;
            /* ── TAKTİKSEL ATEŞKES ──
               Ordumuz yoldaysa son direnişi kırmayız; çıkarmayı
               bekleriz. Bombardımanla alınan gezegen enkaz olur,
               orduyla alınan sağlam kalır. */
            const geliyor = (typeof incomingArmy === 'function')
              ? incomingArmy(sys.id, +id) : null;
            /* ATEŞKES SÜRE SINIRI: ordu 18 ay içinde gelmezse
               ateşkes kalkar ve bombardıman işini bitirir. Aksi
               hâlde gezegen süresiz olarak %8'de asılı kalıyor —
               ne düşüyor ne kurtuluyor. */
            if (geliyor){
              col.truceAge = (col.truceAge || 0) + 1;
              if (col.truceAge > 18){ delete col.truce; }
              else col.truce = geliyor.mesafe;
            } else {
              delete col.truce; col.truceAge = 0;
            }
            const ateskesTabani = (col.truce !== undefined)
              ? (col.garrisonBase || taban) * TRUCE_FLOOR : 0;
            /* ═══════════════════════════════════════════════════
               FAZ 73 — BOMBARDIMAN TİPLERİ
               Kuşatan filonun seçtiği kip etkiyi belirler:
                 hassas  → tahkimatı yavaş eritir, binalara dokunmaz
                 yikici  → çok hızlı erir ama bina yıkar ve kalıcı
                           istikrar cezası bırakır
               Kip filoda saklanır (f.bombMode); sistemdeki en
               agresif kip geçerli sayılır. */
            let kip = 'hassas';
            for (const bf of G.fleets){
              if (bf.sys !== sys.id || bf.e !== +id) continue;
              if (bf.bombMode === 'yikici'){ kip = 'yikici'; break; }
            }
            let etki = atis * (kip === 'yikici' ? 2.4 : 1);
            if (taban <= dipEsik) etki *= .22;
            else if (taban - etki < dipEsik){
              const ustKisim = taban - dipEsik;
              etki = ustKisim + (etki - ustKisim) * .22;
            }
            /* Ateşkes tabanının altına inilmez */
            col.garrison = Math.max(ateskesTabani, taban - etki);
            /* Bombardıman halkı da kırar */
            if (rnd() < .25) col.pop = Math.max(1, col.pop - .12);
            /* ═══ FAZ 63: İSTİKRAR HATASI ═══
               ÖLÇÜM (Faz 62): garnizon 60 → 9 eriyordu ama istikrar
               80 → 100'e FIRLIYORDU. Sebep: bombardım −0.8 veriyor,
               aynı ay istikrar hedefe doğru +3 topluyordu; net +2.2.
               Artık damga konuyor — pasif yenilenme durur ve
               istikrar her ay hızla sıfıra iner. */
            col.bombed = (G.memAge || 0) + 1;
            col.bombKip = kip;
            col.stab = clamp(col.stab - (kip === 'yikici' ? 16 : 9), 0, 100);

            /* ═══ YIKICI BOMBARDIMANIN BEDELİ ═══
               Bina yıkar ve kalıcı iz bırakır. Aldığın gezegen
               harabe olur — hızlı zafer, uzun toparlanma. */
            if (kip === 'yikici'){
              if (rnd() < .16 && col.b){
                const binalar = Object.keys(col.b).filter(k2 => col.b[k2] > 0);
                if (binalar.length){
                  const kurban = binalar[Math.floor(rnd() * binalar.length)];
                  col.b[kurban]--;
                  if (col.b[kurban] <= 0) delete col.b[kurban];
                  if (sys.owner === 0)
                    say('💥 ' + (col.name || pl.name) + ': ' +
                        (BUILDINGS[kurban] ? BUILDINGS[kurban].n : kurban) +
                        ' bombardımanda yıkıldı', 'war');
                }
              }
              /* Kalıcı yara — işgalden sonra da sürer */
              /* FAZ 74: tavan 30 → 22, birikim de yavaşlatıldı */
              col.scorched = Math.min(22, (col.scorched || 0) + .4);
              if (rnd() < .35) col.pop = Math.max(1, col.pop - .18);
            }
          }
        }

        /* ── 3. YÜZEY SAVAŞI ── */
        if (K.ground > 0 && (col.shield || 0) <= 5){
          /* Ordu ile garnizon karşılıklı erir. Kalkan inmeden
             çıkarma yapılamaz — bu yüzden bombardıman şart. */
          const savunma = col.garrison || 0;
          const saldiri = K.ground;
          /* Kayıp oranı: güçlü taraf az kaybeder */
          const oran = saldiri / Math.max(1, saldiri + savunma);
          const garnKayip = saldiri * .34 * (0.6 + oran * .8);
          const orduKayip = savunma * .30 * (1.4 - oran * .8);

          col.garrison = Math.max(0, savunma - garnKayip);

          /* Kaybı transport filolarına dağıt */
          let kalanKayip = orduKayip;
          for (const tf of K.tf){
            if (kalanKayip <= 0) break;
            for (let i = tf.ships.length - 1; i >= 0 && kalanKayip > 0; i--){
              const S = SHIPS[tf.ships[i].c];
              if (!S.ground) continue;
              const birim = S.ground * tf.ships[i].h;
              if (kalanKayip >= birim){
                kalanKayip -= birim;
                tf.ships.splice(i, 1);
              } else {
                tf.ships[i].h -= kalanKayip / S.ground;
                kalanKayip = 0;
                if (tf.ships[i].h <= .05) tf.ships.splice(i, 1);
              }
            }
          }
          G.fleets = G.fleets.filter(f => f.ships.length || f.e !== +id);

          /* ── 4. TEMİZ İŞGAL ── */
          if (col.garrison <= 0){
            const kalanGuc = K.tf.reduce((t, f) => t + groundPower(f), 0);
            /* Taarruz filoları görevini tamamlar ve dağılır */
            for (const tf of K.tf) tf.ships.length = 0;
            G.fleets = G.fleets.filter(f => f.ships.length);

            const eskiSahip = pl.owner;
            /* captureSystem nüfusu %30 kırıyor (fetih kaybı). Temiz
               işgalin bütün anlamı bunu ÖNLEMEK — değeri önce
               saklıyor, sonra geri koyuyoruz. */
            const popKoru = col.pop;
            const binaKoru = JSON.parse(JSON.stringify(col.b));
            if (typeof captureSystem === 'function' && sys.owner !== +id)
              captureSystem(sys, +id);
            else if (typeof planetFlip === 'function'){
              planetFlip(pl); pl.owner = +id;
            }
            col.pop = popKoru;
            col.b = binaKoru;
            col.stab = 35;
            col.shield = 0;
            col.garrison = Math.max(10, Math.round(kalanGuc * .6));
            col.occupied = (G.memAge || 0);
            pl.recent_conquest = 36;         // FAZ 27: dokunulmazlık
            pl.martial_law = 24;             // FAZ 29: sıkıyönetim
            if (typeof recordFall === 'function') recordFall('temiz');
            if (+id === 0)
              say('TEMİZ İŞGAL — ' + (col.name || pl.name) + ' sağlam ele geçirildi · ' +
                  'garnizon ' + col.garrison, 'win');
            else if (eskiSahip === 0)
              say((col.name || pl.name) + ' işgal edildi — ' + atk.name, 'war');
            break;                     // bu gezegen için tur bitti
          }
        }

        /* ── KATASTROF: yalnız ateşle düştü ──
           SÜREKLİLİK ŞARTI: garnizon sıfırlansa bile gezegen hemen
           teslim olmaz; kuşatmanın 3 ay sürmesi gerekir. Bu pencere
           taarruz ordularına yetişme şansı verir. Ölçümde bu şart
           olmadan AI fetihlerinin tamamı bombardımanla oluyordu. */
        if (K.ground <= 0 && (col.garrison || 0) <= 0 && K.war > 0 &&
            (col.shield || 0) <= 0){
          /* FAZ 25: kuşatma penceresi 3 → 6 ay. Ordulara varış
             için daha geniş zaman; bombardıman son çare olmalı. */
          col.siege = (col.siege || 0) + 1;
          if (col.siege < 6) continue;

          /* ═══ FAZ 27 HATA DÜZELTMESİ: SONSUZ KATASTROF ═══
             Vahşiler (korsanlar) sistem sahiplenemez — captureSystem
             onlar için erken döner. Gezegen el değiştirmediği için
             kuşatma sayacı dolu kalıyor ve katastrof HER AY yeniden
             tetikleniyordu. Ölçüm: 3 tohumda 2351 katastrof.
             Korsanlar artık yağmalar, fethetmez. */
          /* ═══ FAZ 34: HİÇLİK SÜRÜSÜ YUTAR ═══
             Kriz tarafı gezegen sahiplenmez; yer ve büyür. */
          if (atk.crisisSide){
            if (typeof swarmDevour === 'function') swarmDevour(sys, pl);
            break;
          }
          if (atk.wild){
            const yagma = Math.min((col.pop || 1) * 12, 260);
            atk.res.min = (atk.res.min || 0) + yagma;
            col.stab = clamp(col.stab - 6, 0, 100);
            col.siege = 0;
            if (pl.owner === 0)
              say('Korsanlar ' + (col.name || pl.name) + ' gezegenini yağmaladı', 'war');
            break;
          }

          const eski = pl.owner;
          if (typeof captureSystem === 'function' && sys.owner !== +id)
            captureSystem(sys, +id);
          else if (typeof planetFlip === 'function'){
            planetFlip(pl); pl.owner = +id;
          }
          /* Sahiplik gerçekten geçmediyse enkaz üretme — döngünün
             ikinci kapısı. */
          if (pl.owner !== +id){ col.siege = 0; break; }
          if (typeof recordFall === 'function') recordFall('katastrof');
          bombardCatastrophe(sys, pl, +id);
          break;
        }
      }
    }
  }
}


/* ═══════════════════════════════════════════════════════════════════
   FAZ 23 — LOJİSTİK VE FİLO ONARIMI
   Hiyerarşi:
     düşman bölgesi / boş düğüm ..... %0   (tamir yok)
     kendi ya da müttefik sistemi ... %5   (bedava, pasif)
     yörüngede tersane .............. %15  (kaynak yakar)
   Sıcak çatışma varsa tamir tamamen durur.
   ═══════════════════════════════════════════════════════════════════ */

/* Bu filo nerede, ne kadar tamir olabilir?
   Döner: {oran, tur, sebep} — arayüz de bunu okur. */
function repairContext(f){
  const bos = {oran:0, tur:'yok', sebep:'Dost bölgede değil'};
  if (!f || !f.ships || !f.ships.length) return bos;
  const e = G.emps[f.e];
  if (!e || e.dead) return bos;

  if (f.combat)                    return {oran:0, tur:'catisma', sebep:'Çatışma sürüyor'};
  if (f.sys < 0 || f.mv)           return {oran:0, tur:'yolda',   sebep:'Yolda'};

  const sys = G.sys[f.sys];
  if (!sys) return bos;

  /* Yörüngede düşman savaş filosu varsa tamir yapılamaz —
     "sıcak çatışma kilidi" f.combat bayrağından önce devreye girer. */
  for (const o of G.fleets){
    if (o.e === f.e || !o.ships.length || o.sys !== f.sys) continue;
    const oe = G.emps[o.e];
    if (!oe || (!oe.war[f.e] && !oe.wild)) continue;
    if (typeof isArmed === 'function' && isArmed(o))
      return {oran:0, tur:'catisma', sebep:'Yörüngede düşman filosu'};
  }

  /* Bölge dost mu? */
  const sahip = sys.owner >= 0 ? sys.owner : -1;
  const dost = sahip === f.e || (sahip >= 0 && e.ally && e.ally[sahip]);
  if (!dost) return bos;

  if (typeof hasYard === 'function' && hasYard(sys) && sahip === f.e)
    return {oran:.15, tur:'tersane', sebep:'Yörünge tersanesi'};
  return {oran:.05, tur:'pasif', sebep:'Dost yörünge'};
}

/* Aylık onarım — economyTick çağırır */
function repairTick(){
  for (const f of G.fleets){
    if (!f.ships || !f.ships.length) continue;
    if (f.repairOff){ f.repairing = 0; continue; }

    const ctx = repairContext(f);
    if (ctx.oran <= 0){ f.repairing = 0; continue; }

    /* Hasarlı gemileri bul */
    let hasarli = 0;
    for (const sh of f.ships) if (sh.h < .999) hasarli++;
    if (!hasarli){ f.repairing = 0; continue; }

    const e = G.emps[f.e];
    let oran = ctx.oran;
    if (e.mods && e.mods.buildMul) oran *= (1 + e.mods.buildMul * .35);

    if (ctx.tur === 'tersane'){
      /* Tersane tamiri KAYNAK YAKAR: her %5'lik dilim için bedel.
         Bedel gövde büyüklüğüyle orantılı — zırhlı onarmak pahalı. */
      let ihtiyacEne = 0, ihtiyacMin = 0;
      for (const sh of f.ships){
        if (sh.h >= .999) continue;
        const eksik = Math.min(oran, 1 - sh.h);
        const sz = SHIPS[sh.c].sz || 1;
        ihtiyacEne += (eksik / .05) * sz * 2.2;
        ihtiyacMin += (eksik / .05) * sz * 3.4;
      }
      /* Kaynak yetmiyorsa kısmi tamir — ekonomiyi eksiye sokmaz */
      let pay = 1;
      if (ihtiyacEne > 0 && (e.res.ene || 0) < ihtiyacEne)
        pay = Math.min(pay, (e.res.ene || 0) / ihtiyacEne);
      if (ihtiyacMin > 0 && (e.res.min || 0) < ihtiyacMin)
        pay = Math.min(pay, (e.res.min || 0) / ihtiyacMin);
      pay = clamp(pay, 0, 1);
      if (pay <= 0.02){
        f.repairing = 0;
        f.repairStarved = true;
        continue;
      }
      f.repairStarved = (pay < .95);
      e.res.ene = Math.max(0, (e.res.ene || 0) - ihtiyacEne * pay);
      e.res.min = Math.max(0, (e.res.min || 0) - ihtiyacMin * pay);
      oran *= pay;
    } else {
      f.repairStarved = false;
    }

    let onarilan = 0;
    for (const sh of f.ships){
      if (sh.h >= .999) continue;
      sh.h = Math.min(1, sh.h + oran);
      onarilan++;
    }
    f.repairing = onarilan ? oran : 0;
  }
}

/* Filonun ortalama gövde sağlığı — arayüz için */
function fleetHull(f){
  if (!f || !f.ships || !f.ships.length) return 1;
  let t = 0;
  for (const sh of f.ships) t += (sh.h !== undefined ? sh.h : 1);
  return t / f.ships.length;
}


/* ═══════════════════════════════════════════════════════════════════
   FAZ 24 — SÜPER SİLAH: COLOSSUS
   ⚠ SİSTEM DÜĞÜMÜ ASLA SİLİNMEZ. G.sys dizisinden hiçbir öğe
   çıkarılmaz, hiper yollar (s.lanes) hiç değiştirilmez. Yalnızca
   GEZEGENİN özellikleri sıfırlanır. Böylece yön bulma ve çizim
   motorları hiçbir şeyin değiştiğini fark etmez.
   ═══════════════════════════════════════════════════════════════════ */

const COLOSSUS_CHARGE = 6;      // ay

/* Colossus filosunun ateşlenebileceği hedef gezegen var mı? */
function colossusTarget(f){
  if (!f || f.sys < 0 || typeof isColossus !== 'function' || !isColossus(f)) return null;
  const e = G.emps[f.e];
  const sys = G.sys[f.sys];
  if (!e || !sys) return null;
  for (const pl of sys.planets){
    if (!pl.col || pl.owner < 0 || pl.owner === f.e) continue;
    if (pl.shattered) continue;
    const o = G.emps[pl.owner];
    if (!o || o.dead) continue;
    /* ═══ FAZ 31 SON DÜZELTME ═══
       ÖLÇÜM: Colossus hedefe VARIYOR ama "hedefVar ✗" dönüyordu.
       Sebep: sevk (aiColossusTick) SOĞUK DÜŞMANLIĞA göre yapılıyor,
       bu kontrol ise SICAK SAVAŞ arıyordu. Colossus yolculuk
       sırasında savaş bitince hedefini kaybediyor ve şarj hiç
       başlamıyordu. İki ölçüt artık aynı. */
    if (e.ally && e.ally[pl.owner]) continue;
    const dusman = e.war[pl.owner] || o.wild ||
      (e.rel[pl.owner] || 0) < -40 ||
      (typeof grudgeOf === 'function' && grudgeOf(e, pl.owner) > 35);
    if (!dusman) continue;
    return pl;
  }
  return null;
}

/* Aylık şarj — economyTick çağırır */
function colossusTick(){
  for (const f of G.fleets){
    if (!f.ships || !f.ships.length) continue;
    if (typeof isColossus !== 'function' || !isColossus(f)) continue;
    const hedef = colossusTarget(f);
    if (!hedef){ f.charge = 0; continue; }
    /* ═══ FAZ 31 DÜZELTMESİ ═══
       f.combat şarjı SIFIRLIYORDU. Ama Colossus zaten düşman
       yörüngesinde duruyor ve orada neredeyse her ay çatışma var —
       sayaç bu yüzden hiç dolmuyordu (ölçüm: en yüksek şarj 3/6,
       ateşleme 0). Çatışma artık şarjı sıfırlamaz, YAVAŞLATIR.
       Silah hâlâ korunmak zorunda: koruma filosu dağılırsa
       Colossus zaten yok ediliyor. */
    if (f.combat){
      if ((G.memAge || 0) % 2 === 0) continue;      // yarı hızda şarj
    }
    f.charge = (f.charge || 0) + 1;
    if (f.charge === 1 && (f.e === 0 || hedef.owner === 0))
      say('⚠ COLOSSUS ATEŞLEME SAYACI BAŞLADI — ' + (hedef.col.name || hedef.name) +
          ' · ' + COLOSSUS_CHARGE + ' ay', 'war');
    /* AI hazır olduğunda kendi kararını verir */
    if (f.charge >= COLOSSUS_CHARGE && G.emps[f.e] && G.emps[f.e].ai)
      aiColossusFire(f, hedef);
  }
}

/* Ateşleme — mod: 'catlat' | 'notron' */
function colossusFire(f, pl, mod){
  if (!f || !pl || !pl.col) return false;
  if ((f.charge || 0) < COLOSSUS_CHARGE) return false;
  const e = G.emps[f.e];
  const sys = G.sys[f.sys];
  if (!e || !sys) return false;
  const eskiSahip = pl.owner;
  const ad = pl.col.name || pl.name;

  /* Sahibin koloni kaydını düş — GEZEGEN yerinde kalır */
  const eski = G.emps[eskiSahip];
  if (eski) eski.colonies = eski.colonies.filter(c => !(c.s === sys.id && c.p === pl.i));

  if (mod === 'catlat'){
    /* ── GEZEGEN ÇATLATAN ── */
    pl.col = null;
    pl.owner = -1;
    pl.shattered = true;
    pl.hab = 0;
    pl.t = 'ast';                       // parçalanmış kütle
    /* Yörüngede devasa mineral kaynağı */
    pl.dep = {r:'min', v:14};
    pl.name = pl.name + ' (Parçalanmış)';
    sys._shat = true;                   // çizim önbelleğini güncelle
    /* ═══ FAZ 37: RADYASYON FIRTINASI ═══
       Colossus parçalaması çekirdeği açığa çıkarır. %30 ihtimalle
       sistem kalıcı bir radyasyon kuşağına dönüşür: içinden geçen
       her filo aylık gövde kaybeder. (Sürü yutması organiktir,
       radyasyon bırakmaz.) */
    if (rnd() < .30){
      sys.radiation = true;
      say('☢ RADYASYON FIRTINASI — ' + sys.name +
          ' sistemi artık ölümcül bir kuşak', 'war');
    }
    say('☄ GEZEGEN ÇATLATILDI — ' + ad + ' artık bir enkaz halkası', 'war');
    if (typeof UI !== 'undefined' && UI.eventArt && (e.id === 0 || eskiSahip === 0))
      UI.eventArt('catlak', 'PARÇALANMIŞ DÜNYA',
        ad + ' Colossus ateşiyle ikiye ayrıldı. Milyarlarca can bir anda söndü; ' +
        'geriye yalnızca bir enkaz halkası kaldı. Galaksi bunu asla unutmayacak.');
    if ((e.id === 0 || eskiSahip === 0) && typeof UI !== 'undefined' && UI.eventArt)
      UI.eventArt('catlak', 'GEZEGEN ÇATLATILDI',
        (e.id === 0
          ? '<b>' + ad + '</b> artık yok. Colossus\'un ışını kabuğu ikiye ayırdı; ' +
            'geriye dönen bir enkaz halkası kaldı. Galaksideki her devlet bunu gördü ' +
            've bir daha asla unutmayacak.'
          : '<b>' + ad + '</b> yok edildi. ' + e.name + ' gezegeni parçaladı. ' +
            'Milyarlarca can, bir ışın darbesiyle söndü.'), 'war');
    /* Kalıcı ve ağır diplomatik ceza */
    for (const x of G.emps){
      if (x.dead || x.wild || x.id === e.id) continue;
      x.rel[e.id] = -100;
      if (typeof remember === 'function'){
        remember(x, e.id, 'ihanet');
        remember(x, e.id, 'sistemAldi');
      }
    }
    e.threat = (e.threat || 0) + 90;
    e.shatterCount = (e.shatterCount || 0) + 1;
  } else {
    /* ── NÖTRON SÜPÜRÜCÜSÜ ── */
    pl.col.pop = 0;
    pl.col.garrison = 0;
    pl.col.shield = 0;
    pl.col.stab = 0;
    pl.col.q = [];
    pl.col = null;                      // koloni biter, YAPI ayakta kalır
    pl.owner = -1;
    pl.neutroned = (G.memAge || 0);
    say('☢ NÖTRON SÜPÜRÜLDÜ — ' + ad + ' bomboş, yapılar sağlam', 'war');
    for (const x of G.emps){
      if (x.dead || x.wild || x.id === e.id) continue;
      x.rel[e.id] = clamp(x.rel[e.id] - 45, -100, 100);
      if (typeof remember === 'function') remember(x, e.id, 'sistemAldi');
    }
    e.threat = (e.threat || 0) + 45;
  }

  /* Sistem sahipliği: gezegeni kalmayan sistem sahipsiz düşer.
     DÜĞÜM VE HİPER YOLLAR AYNEN DURUR. */
  const kalan = sys.planets.some(p2 => p2.col);
  if (!kalan && sys.owner === eskiSahip) sys.owner = -1;
  sys.def = sysDefense(sys);
  if (eski) recalcMods(eski);
  recalcMods(e);

  /* ═══ FAZ 32: YASAĞA RAĞMEN ATEŞLEME ═══
     Konsey yasakladıysa ateşleyen doğrudan Galaktik Parya olur. */
  if (typeof councilExists === 'function' && councilExists() &&
      G.council.laws.colYasak){
    G.council.targeted = G.council.targeted || {};
    if (typeof addPariah === 'function') addPariah(e.id);   // FAZ 37: çoklu parya
    e.threat = (e.threat || 0) + 60;
    for (const x of G.emps){
      if (x.dead || x.wild || x.id === e.id) continue;
      x.rel[e.id] = -100;
      if (typeof remember === 'function') remember(x, e.id, 'ihanet');
      if (typeof breakPact === 'function') breakPact(e, x);
    }
    e._trAt = -1;
    G.emps.forEach(x => { if (!x.dead) recalcMods(x); });
    if (e.id === 0)
      say('YASAĞI ÇİĞNEDİN — GALAKTİK PARYA İLAN EDİLDİN. Tüm ticaretin kesildi.', 'war');
    else
      say(e.name + ' Süper Silah Yasağı\'nı çiğnedi — GALAKTİK PARYA', 'war');
  }
  if (typeof recordFall === 'function') recordFall('colossus');
  f.charge = 0;
  return true;
}

/* ═══ FAZ 25: AI ATEŞLEME KARARI ═══
   İki soru sorulur:
     "Bu gezegeni İSTİYOR muyum?"  → nüfus yüksekse NÖTRON:
        yapılar sağlam kalır, temiz kolonizasyon için boşalır.
     "Bu düşmandan NEFRET mi ediyorum?" → kin çok yüksekse
        ÇATLATAN: gezegen bir daha kimseye yaramaz.
   Nefret, açgözlülüğü yener. */
function aiColossusFire(f, pl){
  const e = G.emps[f.e];
  if (!e || !pl || !pl.col) return;
  const sahip = G.emps[pl.owner];
  const kin = (typeof grudgeOf === 'function' && sahip) ? grudgeOf(e, sahip.id) : 0;
  const nufus = pl.col.pop || 0;
  const yapi = (typeof colonyUsed === 'function') ? colonyUsed(pl.col) : 0;

  /* 1. AÇGÖZLÜLÜK — dolu ve gelişmiş bir dünya nötronla alınır */
  let notronIstek = .30;
  if (nufus >= 15) notronIstek += .35;
  else if (nufus >= 8) notronIstek += .18;
  if (yapi >= 10) notronIstek += .15;
  /* Yaşam alanı bize uygunsa daha da cazip */
  if (typeof habOf === 'function' && habOf(e, pl) >= 55) notronIstek += .20;

  /* 2. NEFRET — çatlatma isteği */
  let catlatIstek = .10;
  if (kin >= 80) catlatIstek += .55;
  else if (kin >= 60) catlatIstek += .30;
  const P = (typeof personaOf === 'function') ? personaOf(e) : null;
  const mz = P ? P.n : '';
  if (mz === 'Militarist') catlatIstek += .25;
  else if (mz === 'Pasifist') catlatIstek -= .15;
  if (typeof hasCivic === 'function' && hasCivic(e, 'blood')) catlatIstek += .25;
  /* Zaten paryaysa kaybedecek itibarı yok */
  if (typeof isPariah === 'function' && isPariah(e)) catlatIstek += .25;
  /* İhanet gördüysek affetmeyiz */
  if (sahip && e.mem && e.mem[sahip.id] &&
      e.mem[sahip.id].some(m => m.k === 'ihanet' || m.k === 'sahteBayrak'))
    catlatIstek += .30;

  const mod = (catlatIstek > notronIstek) ? 'catlat' : 'notron';
  colossusFire(f, pl, mod);
}


/* ═══════════════════════════════════════════════════════════════════
   FAZ 34 — GEZEGEN YUTMA
   Hiçlik Sürüsü fethetmez, yer. Yutulan gezegen Colossus'un
   "Gezegen Çatlatan" moduyla aynı sona uğrar: shattered, hab 0,
   nüfus sıfır. Karşılığında sürü yeni bir filo doğurur —
   KAR TOPU: sürü besledikçe büyür.
   ⚠ Sistem düğümü ASLA silinmez (Faz 24 kuralı).
   ═══════════════════════════════════════════════════════════════════ */
function swarmDevour(sys, pl){
  const col = pl && pl.col;
  if (!col) return false;
  const c = G.emps[G.crisisId];
  if (!c) return false;

  const eskiSahip = pl.owner;
  const ad = col.name || pl.name;
  const nufus = col.pop || 0;

  /* Sahibin koloni kaydını düş */
  const eski = G.emps[eskiSahip];
  if (eski) eski.colonies = eski.colonies.filter(x => !(x.s === sys.id && x.p === pl.i));

  /* ── YUTULDU ── */
  pl.col = null;
  pl.owner = -1;
  pl.shattered = true;
  pl.devoured = (G.memAge || 0);
  pl.hab = 0;
  pl.t = 'ast';
  pl.name = pl.name + ' (Yutulmuş)';
  sys._shat = true;                        // çizim önbelleği (Faz 25)
  sys._shatBio = true;                     // FAZ 35: biyolojik enkaz

  /* Sistem sahipsiz düşer, DÜĞÜM VE HİPER YOLLAR DURUR */
  const kalan = sys.planets.some(p2 => p2.col);
  if (!kalan && sys.owner === eskiSahip) sys.owner = -1;
  sys.def = sysDefense(sys);
  if (eski) recalcMods(eski);

  /* FAZ 35: sahibi panik listesine girer — inatçı AI akıllanır.
     DİKKAT: (G.memAge || 0) oyunun ilk ayında 0 döner ve 0 falsy
     olduğu için "gezegenim yutuldu" kontrolü sessizce başarısız
     oluyordu (testte yakınlık hep 0 çıktı). +1 ile daima truthy. */
  if (eski) eski._devoured = (G.memAge || 0) + 1;
  if (eskiSahip === 0)
    say('☣ ' + ad + ' YUTULDU — Hiçlik Sürüsü gezegeni tamamen tüketti', 'war');
  else
    say('☣ Hiçlik Sürüsü ' + ad + ' gezegenini yuttu', 'war');
  if (typeof recordFall === 'function') recordFall('yutuldu');

  /* ── KAR TOPU: beslenme yeni filo doğurur ── */
  swarmSpawnFromFeeding(sys, nufus);
  return true;
}

/* Yutulan nüfusla orantılı yeni sürü filosu. Tavan swarmCap ile
   korunuyor — bellek şişmez. */
function swarmSpawnFromFeeding(sys, nufus){
  const c = G.emps[G.crisisId];
  if (!c) return;
  /* Beslenme gücü: nüfus + aşama */
  const stage = (G.crisis && G.crisis.stage) || 1;
  const guc = Math.max(3, Math.round(nufus * .9 + stage * 4));

  const ships = [];
  if (nufus >= 12) ships.push({c:'swarm_queen'});      // şölen kraliçe doğurur
  const dron = Math.min(SWARM_FLEET_SHIPS - ships.length, guc);
  for (let i = 0; i < dron; i++) ships.push({c:'swarm_drone'});
  if (!ships.length) return;

  const f = newFleet(c, sys.id, ships, 'Sürü Yavrusu');
  f.crisis = true;
  f.stance = 'agresif';
  if (typeof swarmCap === 'function') swarmCap();
}


/* ═══════════════════════════════════════════════════════════════════
   FAZ 35 — YENİDEN TERRAFORM
   Kriz geçtikten sonra ölü dünyaları diriltme projesi. Çok pahalı,
   çok uzun — ama galaksinin yaralarını sarmak geç oyuna bir amaç
   verir. Yalnızca kriz ÇÖZÜLDÜKTEN sonra başlatılabilir.
   ═══════════════════════════════════════════════════════════════════ */
const TERRAFORM_COST = {ala: 2200, min: 3600, ene: 1800};
const TERRAFORM_MONTHS = 60;      // 5 yıl

function canTerraform(e, sys, pl){
  if (!pl || !pl.shattered) return {ok:false, why:'Bu gezegen zaten yaşanabilir'};
  if (pl.terraform) return {ok:false, why:'Terraform zaten sürüyor'};
  /* Kriz sürerken diriltme yapılmaz */
  if (typeof crisisActive === 'function' && crisisActive())
    return {ok:false, why:'Kriz sürerken terraform yapılamaz'};
  if (G.crisis && !G.crisis.over && G.crisis.stage > 0)
    return {ok:false, why:'Kriz sürerken terraform yapılamaz'};
  /* Sistem bizim ya da sahipsiz olmalı */
  if (sys.owner >= 0 && sys.owner !== e.id)
    return {ok:false, why:'Sistem başka bir devletin elinde'};
  /* Teknoloji: gezegen mühendisliği */
  if (typeof TECHS !== 'undefined' && TECHS.m_gaia && !(e.techs && e.techs.m_gaia))
    return {ok:false, why:'Gaia Mühendisliği teknolojisi gerekir'};
  for (const r in TERRAFORM_COST)
    if ((e.res[r] || 0) < TERRAFORM_COST[r])
      return {ok:false, why:'Yetersiz kaynak: ' + TERRAFORM_COST[r] + ' ' + r};
  return {ok:true};
}

function startTerraform(e, sys, pl){
  const chk = canTerraform(e, sys, pl);
  if (!chk.ok) return chk;
  for (const r in TERRAFORM_COST) e.res[r] -= TERRAFORM_COST[r];
  /* ═══ FAZ 36: UYUYAN KRALİÇE ═══
     Biyolojik enkazın çekirdeğinde bir şey uyuyor olabilir.
     %25 ihtimalle proje sırasında uyanır. Risk BAŞLANGIÇTA
     belirlenir ama oyuncuya söylenmez — sürpriz olmalı. */
  const uyuyanVar = (pl.devoured !== undefined) && rnd() < .25;
  pl.terraform = {by: e.id, left: TERRAFORM_MONTHS, total: TERRAFORM_MONTHS,
                  sleeper: uyuyanVar,
                  wakeAt: uyuyanVar
                    ? Math.floor(TERRAFORM_MONTHS * (.25 + rnd() * .55)) : 0};
  if (e.id === 0)
    say('🌱 TERRAFORM BAŞLADI — ' + pl.name + ' · ' +
        Math.round(TERRAFORM_MONTHS / 12) + ' yıl', 'sci');
  return {ok:true};
}

/* Aylık ilerleme — economyTick çağırır. Tek geçiş, ucuz. */
function terraformTick(){
  for (const sy of G.sys){
    for (const pl of sy.planets){
      if (!pl.terraform) continue;
      const tf = pl.terraform;
      tf.left--;

      /* ═══ UYUYAN KRALİÇE UYANIYOR ═══ */
      if (tf.sleeper && !tf.woke && (tf.total - tf.left) >= tf.wakeAt){
        tf.woke = true;
        const c = (typeof ensureCrisisEmpire === 'function')
          ? ensureCrisisEmpire() : G.emps[G.crisisId];
        if (c){
          const ships = [{c:'swarm_queen'}];
          const n2 = 3 + Math.floor(rnd() * 4);
          for (let i = 0; i < n2; i++) ships.push({c:'swarm_drone'});
          const f = newFleet(c, sy.id, ships, 'Uyuyan Kraliçe');
          f.crisis = true;
          f.stance = 'agresif';
          tf.sleeperFleet = f.id;
          if (tf.by === 0)
            say('☣ UYUYAN KRALİÇE UYANDI — ' + pl.name + ' çekirdeğinden bir ' +
                'Sürü kalıntısı çıktı! Projeyi korumazsan iptal olacak.', 'war');
          else
            say('Bir terraform projesinde uyuyan Sürü kalıntısı uyandı', 'war');
          if (typeof UI !== 'undefined' && UI.eventArt && tf.by === 0)
            UI.eventArt('catlak', 'UYUYAN KRALİÇE',
              pl.name + ' gezegeninin çekirdeğinde uyuyan mutasyona uğramış bir ' +
              'Sürü Kraliçesi uyandı. Yörüngeye savaş filosu göndermezsen ' +
              'milyonlarca kaynak harcadığın proje çöker.');
        }
      }

      /* ═══ PROJE SABOTAJI ═══
         Kraliçe hâlâ yörüngedeyse ve koruyan filo yoksa proje çöker. */
      if (tf.woke && tf.sleeperFleet !== undefined){
        const kral = G.fleets.find(f => f.id === tf.sleeperFleet && f.ships.length);
        if (kral && kral.sys === sy.id){
          /* Koruyan savaş filosu var mı? */
          let koruma = false;
          for (const g of G.fleets){
            if (!g.ships || !g.ships.length || g.sys !== sy.id) continue;
            const ge = G.emps[g.e];
            if (!ge || ge.crisisSide || ge.wild) continue;
            if (typeof isArmed === 'function' && isArmed(g)){ koruma = true; break; }
          }
          if (!koruma){
            tf.sabotajAy = (tf.sabotajAy || 0) + 1;
            /* 3 ay korumasız kalırsa proje çöker */
            if (tf.sabotajAy >= 3){
              const sahip = G.emps[tf.by];
              delete pl.terraform;
              pl.shattered = true;
              sy._shat = true; sy._shatBio = true;
              if (tf.by === 0)
                say('💀 TERRAFORM ÇÖKTÜ — ' + pl.name + ' yeniden biyolojik ' +
                    'enkaza döndü. Harcanan kaynaklar boşa gitti.', 'war');
              else if (sahip)
                say(sahip.name + ' terraform projesi Sürü kalıntısına yenildi', 'war');
              continue;
            }
          } else tf.sabotajAy = 0;
        } else {
          /* Kraliçe öldü ya da çekildi — tehlike geçti */
          tf.woke = false; tf.sleeper = false;
          delete tf.sleeperFleet;
          tf.sabotajAy = 0;
          if (tf.by === 0)
            say('✓ Uyuyan Kraliçe yok edildi — terraform güvende', 'win');
        }
      }

      if (tf.left > 0) continue;

      /* ── DİRİLİŞ ── */
      const e = G.emps[pl.terraform.by];
      delete pl.terraform;
      delete pl.shattered;
      delete pl.devoured;
      pl.hab = 100;
      /* PLANETS anahtarı 'gay' — 'gaia' DEĞİL. Yanlış anahtar
         habOf()'u çökertiyordu (testte yakalandı). */
      pl.t = 'gay';
      pl.dep = null;
      pl.name = pl.name.replace(/ \((Yutulmuş|Parçalanmış)\)$/, '') + ' (Yeniden Doğmuş)';
      sy._shat = undefined;                  // çizim önbelleğini tazele
      sy._shatBio = undefined;               // FAZ 36: biyolojik damga da silinir
      if (e && !e.dead && e.id === 0)
        say('🌱 ' + pl.name + ' YENİDEN DOĞDU — %100 yaşanabilir', 'win');
      else if (e && !e.dead)
        say(e.name + ' ölü bir dünyayı diriltti: ' + pl.name, 'sci');
    }
  }
}


/* ═══════════════════════════════════════════════════════════════════
   FAZ 37 — RADYASYON HASARI
   Radyasyonlu sistemde bulunan ya da içinden geçen her filo aylık
   %5 gövde kaybeder. Tek geçiş, ucuz.
   ═══════════════════════════════════════════════════════════════════ */
function radiationTick(){
  for (const f of G.fleets){
    if (!f.ships || !f.ships.length) continue;
    /* Bulunduğu ya da gittiği sistem radyasyonlu mu? */
    let vuruldu = false;
    if (f.sys >= 0 && G.sys[f.sys] && G.sys[f.sys].radiation) vuruldu = true;
    else if (f.mv && G.sys[f.mv.to] && G.sys[f.mv.to].radiation) vuruldu = true;
    if (!vuruldu) continue;

    let oldu = false;
    for (let i = f.ships.length - 1; i >= 0; i--){
      const sh = f.ships[i];
      sh.h = (sh.h !== undefined ? sh.h : 1) - .05;
      if (sh.h <= 0){ f.ships.splice(i, 1); oldu = true; }
    }
    if (f.e === 0 && f.ships.length)
      say('☢ ' + (f.name || 'Filo') + ' radyasyon kuşağında gövde kaybediyor', 'war');
    else if (f.e === 0 && oldu)
      say('☢ Radyasyon bir filonu yok etti', 'war');
  }
  G.fleets = G.fleets.filter(f => f.ships && f.ships.length);
}


/* ═══════════════════════════════════════════════════════════════════
   FAZ 41 — AYRILIKÇI FRAKSİYONLAR (EVRENSEL İÇ SAVAŞ)
   Balkanizasyon artık Koruyucu'ya özel değil. Büyük bir
   imparatorlukta uzun süre istikrarsız kalan koloni ayrılıkçı
   sayaç biriktirir; sayaç dolduğunda çevresindeki sistemlerle
   birlikte kopup bağımsız, agresif bir devlete dönüşür.
   ═══════════════════════════════════════════════════════════════════ */
/* ÖLÇÜM (780 ay, tohum 4242): koloni-aylarının %98'i istikrar 80+
   seviyesinde. 25 eşiğinin altına yalnız 28 koloni-ay düştü ve en
   yüksek sayaç 20/48'de kaldı — isyan hiç tetiklenmedi.
   Eşik gerçek dağılıma göre 40'a çekildi (koloni-ayların ~%3'ü),
   süre 36 aya indi. Böylece kronik istikrarsızlık cezalandırılıyor
   ama sağlıklı imparatorluk bölünmüyor. */
const SECESSION_SIZE = 6;         // en az kaç sistemli imparatorlukta
const SECESSION_STAB = 40;        // bu istikrarın altında sayaç işler
/* ÖLÇÜM: 60 yıllık koşuda sayaç 32'ye çıkıp durdu (limit 36) —
   ayrılık kıl payı kaçırılıyordu. İstikrar dalgalandığı için
   sayaç −3 ile geriliyor ve eşiğe varamıyor. 30'a çekildi. */
const SECESSION_LIMIT = 30;       // 2.5 yıl

function secessionTick(){
  for (const e of G.emps){
    if (e.dead || e.wild || e.crisisSide) continue;
    /* Küçük devletler kendiliğinden bölünmez — zaten dağılırlar.
       ═══ FAZ 43 DÜZELTMESİ ═══
       AMA dış kışkırtma bu kuralı deler. ÖLÇÜM: 4 sistemli bir
       devletin kolonisinde sayaç 130'a çıkmıştı (AI 20 kez üst üste
       kışkırtmıştı) ama secessionTick o imparatorluğu hiç işlemediği
       için ayrılık olmuyordu. Kışkırtılmış koloniler boyuttan
       bağımsız işlenir — dış müdahale iç dinamikten güçlüdür. */
    let sysN = 0;
    for (const sy of G.sys) if (sy.owner === e.id) sysN++;
    const kucuk = sysN < SECESSION_SIZE;
    if (kucuk){
      let kiskirtilanVar = false;
      for (const c of (e.colonies || [])){
        const sy2 = G.sys[c.s];
        const pl2 = sy2 && sy2.planets[c.p];
        if (pl2 && pl2.col && pl2.col.unrest){ kiskirtilanVar = true; break; }
      }
      if (!kiskirtilanVar) continue;
    }

    for (const c of (e.colonies || [])){
      const sys = G.sys[c.s];
      const pl = sys && sys.planets[c.p];
      if (!pl || !pl.col) continue;
      const col = pl.col;

      /* Sıkıyönetim ve yeni fetih dokunulmazlığı sayacı dondurur */
      if (pl.martial_law > 0 || (pl.recent_conquest || 0) > 0){
        if (col.secede) col.secede = Math.max(0, col.secede - 2);
        continue;
      }
      /* Başkent ayrılamaz */
      if (e.home === sys.id) continue;

      /* Küçük devlette yalnız dışarıdan kışkırtılmış koloni kopar */
      if (kucuk && !col.unrest){
        if (col.secede) col.secede = Math.max(0, col.secede - 2);
        continue;
      }

      if (col.stab < SECESSION_STAB){
        /* Sayaç tavanı: kışkırtma üst üste binerse şişmesin */
        col.secede = Math.min(SECESSION_LIMIT + 4, (col.secede || 0) + 1);
        /* Oyuncuya uyarı — müdahale şansı */
        if (e.id === 0 && col.secede === Math.round(SECESSION_LIMIT * .5))
          say('⚠ AYRILIKÇI HAREKET — ' + (col.name || pl.name) +
              ' halkı kopmaktan söz ediyor. İstikrarı düzelt!', 'war');
        if (col.secede >= SECESSION_LIMIT){
          secede(e, sys, pl);
          break;                          // ayda bir kopma yeter
        }
      } else if (col.secede){
        /* İstikrar düzelirse hareket söner — ama yavaş, çünkü
           güven bir kez sarsıldı. */
        const onceki = col.secede;
        col.secede = Math.max(0, col.secede - 2);
        /* ═══ FAZ 44: İSYAN BASTIRILDI BİLDİRİMİ ═══
           Sayaç sıfıra indiği AN bildirilir — oyuncu istikrarı
           toparlamak için harcadığı emeğin karşılığını görsün. */
        if (onceki > 0 && col.secede === 0 && e.id === 0)
          say('✓ İSYAN BASTIRILDI — ' + (col.name || pl.name) +
              ' güvenliği sağlandı', 'win');
      }
    }
  }
}

/* Kopuş: gezegen + çevresindeki 1-2 sistem yeni bir devlet olur */
function secede(e, sys, pl){
  /* ═══ FAZ 43: MİNNET BAĞI ═══
     Bu isyan dış bir elin eseriyse, doğan devlet onu hamisi bilir. */
  const fonlayan = (pl.col && pl.col.unrest && pl.col.unrest.by !== undefined)
    ? pl.col.unrest.by
    /* ═══ FAZ 44 DÜZELTMESİ ═══
       inciteRebellion fonlayanı `col.unrest.by` içinde saklıyor;
       burada `col.inciteBy` aranıyordu ve minnet bağı hiç
       kurulmuyordu (testte founder=undefined çıktı). İki alan da
       kontrol ediliyor. */
    : (pl.col && pl.col.unrest && pl.col.unrest.by !== undefined
        ? pl.col.unrest.by
        : (pl.col && pl.col.inciteBy !== undefined ? pl.col.inciteBy : undefined));
  const id = G.emps.length;
  const ad = (typeof SUCCESSOR_NAMES !== 'undefined')
    ? SUCCESSOR_NAMES[Math.floor(rnd() * SUCCESSOR_NAMES.length)]
    : 'Ayrılıkçı Cumhuriyet';
  const yeni = makeEmpire(id, e.race, ad + ' (' + (pl.col.name || pl.name) + ')',
    true, rnd, []);
  /* Ayrılıkçılar agresif ve otoriter doğar — hayatta kalma refleksi */
  /* ═══ FAZ 61: İDEOLOJİK ZITLIK ═══
     Ayrılıkçılar rastgele değil, ana gövdenin TAM ZIDDI olarak
     doğar — çünkü bölünmenin sebebi zaten o ideolojidir.
     Militarist bir devletten kopanlar pasifist, otoriter bir
     devletten kopanlar özgürlükçü olur. */
  yeni.ethics = schismEthics(e);
  if (typeof shiftColor === 'function') yeni.col = shiftColor(e.col);
  G.emps.push(yeni);

  /* Çekirdek gezegen */
  const devret = (sy2, pl2) => {
    if (!pl2.col || pl2.owner !== e.id) return false;
    pl2.owner = yeni.id;
    yeni.colonies.push({s: sy2.id, p: pl2.i});
    e.colonies = e.colonies.filter(c => !(c.s === sy2.id && c.p === pl2.i));
    pl2.col.stab = 50;
    pl2.col.secede = 0;
    pl2.recent_conquest = 24;
    const kalan = sy2.planets.some(p3 => p3.col && p3.owner === e.id);
    if (!kalan) sy2.owner = yeni.id;
    return true;
  };
  devret(sys, pl);

  /* Komşu 1-2 sistem de katılabilir (istikrarsızsa) */
  let ek = 0;
  for (const l of sys.lanes){
    if (ek >= 2) break;
    const o2 = G.sys[l];
    if (!o2 || o2.owner !== e.id) continue;
    for (const pl2 of o2.planets){
      if (ek >= 2) continue;
      if (!pl2.col || pl2.owner !== e.id) continue;
      if (e.home === o2.id) continue;
      if (pl2.col.stab >= 45) continue;          // memnun halk kopmaz
      if (devret(o2, pl2)) ek++;
    }
  }
  if (yeni.colonies.length) yeni.home = yeni.colonies[0].s;

  /* Diplomatik doğuş + ebedi dava */
  for (const x of G.emps){
    if (x.dead || x.id === yeni.id || x.wild || x.crisisSide) continue;
    yeni.contact[x.id] = true; x.contact[yeni.id] = true;
    if (yeni.rel[x.id] === undefined) yeni.rel[x.id] = 0;
    if (x.rel[yeni.id] === undefined) x.rel[yeni.id] = 0;
  }
  yeni.sundered = e.id;
  e.sundered = yeni.id;                    // çift taraflı Yeniden Birleşme CB
  yeni.rel[e.id] = -70;
  e.rel[yeni.id] = -70;

  /* ═══ MİNNET VE HİMAYE PAKTI ═══
     Kışkırtmayı fonlayan devlet, yeni doğan devletin kurtarıcısıdır. */
  if (fonlayan !== undefined && G.emps[fonlayan] && !G.emps[fonlayan].dead &&
      fonlayan !== e.id){
    const hami = G.emps[fonlayan];
    yeni.founder = hami.id;
    yeni.rel[hami.id] = 80;
    hami.rel[yeni.id] = 60;
    yeni.contact[hami.id] = true; hami.contact[yeni.id] = true;
    if (typeof remember === 'function') remember(yeni, hami.id, 'yardimEtti');
    /* Otomatik savunma paktı — kurtarıcıya sırt dönülmez */
    yeni.ally = yeni.ally || {}; hami.ally = hami.ally || {};
    yeni.ally[hami.id] = true; hami.ally[yeni.id] = true;
    /* Ortak düşman: ana gövde */
    if (hami.rel[e.id] === undefined) hami.rel[e.id] = 0;
    hami.rel[e.id] = clamp(hami.rel[e.id] - 15, -100, 100);
    if (hami.id === 0)
      say('🤝 MİNNET BAĞI — ' + yeni.name + ' senin desteğinle doğdu ve ' +
          'savunma paktı imzaladı.', 'win');
    else if (e.id === 0)
      say('🤝 ' + yeni.name + ', ' + hami.name + ' himayesinde doğdu — ' +
          'isyanın arkasında onlar vardı.', 'war');
    else
      say(yeni.name + ' bağımsızlığını ' + hami.name + ' desteğiyle kazandı');
  }

  recalcMods(yeni); recalcMods(e);
  if (typeof refreshReach === 'function') refreshReach();
  if (e.id === 0)
    say('🏴 AYRILIKÇI İSYAN — ' + yeni.name + ' bağımsızlığını ilan etti! ' +
        yeni.colonies.length + ' dünyanı kaybettin.', 'war');
  else
    say('🏴 ' + e.name + ' bölündü — ' + yeni.name + ' ayrıldı', 'war');
  if (typeof recordFall === 'function') recordFall('ayrilik');
  return yeni;
}


/* ═══════════════════════════════════════════════════════════════════
   FAZ 49 — PANOPTİKON: DERİN UZAY GÖZLEM İSTASYONU
   Hedef sisteme kilitlenir; o sistem ve 2 hiperyol derinliğindeki
   komşular canlı görünür (FoW kalkar, filolar ve tersaneler açık).
   PERFORMANS: menzil her karede değil, kilit değişince ya da ayda
   bir BFS ile hesaplanıp _panopticonCached içinde tutulur.
   ═══════════════════════════════════════════════════════════════════ */
const PANOPT_DEPTH = 2;

/* Hedef sistemden PANOPT_DEPTH derinliğe kadar BFS — önbellekli */
function panopticonRange(sysId){
  const cache = G._panopticonCached || (G._panopticonCached = {});
  const c = cache[sysId];
  if (c && c.at === G.day) return c.list;

  const gorulen = {}, kuyruk = [[sysId, 0]];
  gorulen[sysId] = true;
  while (kuyruk.length){
    const [u, d] = kuyruk.shift();
    if (d >= PANOPT_DEPTH) continue;
    const sy = G.sys[u];
    if (!sy) continue;
    for (const v of sy.lanes){
      if (gorulen[v]) continue;
      gorulen[v] = true;
      kuyruk.push([v, d + 1]);
    }
  }
  const list = Object.keys(gorulen).map(Number);
  cache[sysId] = {at: G.day, list};
  return list;
}

/* Bir sistem oyuncu tarafından panoptikonla izleniyor mu? */
function panopticonWatched(e, sysId){
  if (!e || !e.panoptLock) return false;
  for (const kaynak in e.panoptLock){
    const kilit = e.panoptLock[kaynak];
    if (!kilit || kilit.blindUntil > (G.memAge || 0)) continue;   // körlenmiş
    if (panopticonRange(kilit.target).indexOf(sysId) >= 0) return true;
  }
  return false;
}

/* Panoptikonu bir hedefe kilitle */
function panopticonLock(e, kaynakSysId, hedefSysId){
  if (!e) return {ok:false, why:'Devlet yok'};
  const kay = G.sys[kaynakSysId], hed = G.sys[hedefSysId];
  if (!kay || !hed) return {ok:false, why:'Sistem yok'};
  if (!kay.built || kay.built.panopt === undefined)
    return {ok:false, why:'Bu sistemde Panoptikon yok'};
  if (kaynakSysId === hedefSysId)
    return {ok:false, why:'Kendi sistemine kilitlenemez'};
  e.panoptLock = e.panoptLock || {};
  e.panoptLock[kaynakSysId] = {target: hedefSysId, at: G.memAge || 0,
                               blindUntil: 0, hp: 100};
  if (G._panopticonCached) delete G._panopticonCached[hedefSysId];
  if (e.id === 0)
    say('🛰 PANOPTİKON KİLİTLENDİ — ' + hed.name + ' ve çevresi canlı izlemede', 'sci');
  return {ok:true, kapsam: panopticonRange(hedefSysId).length};
}

/* Aylık: izlenen sistemlerin sisini kaldır + gözlenen tarafa ipucu */
function panopticonTick(){
  for (const e of G.emps){
    if (e.dead || e.wild || e.crisisSide || !e.panoptLock) continue;
    for (const kaynak in e.panoptLock){
      const kilit = e.panoptLock[kaynak];
      if (!kilit) continue;
      /* Kaynak sistem hâlâ bizde ve yapı ayakta mı? */
      const kay = G.sys[kaynak];
      if (!kay || kay.owner !== e.id || !kay.built ||
          kay.built.panopt === undefined){
        delete e.panoptLock[kaynak];
        continue;
      }
      if (kilit.blindUntil > (G.memAge || 0)) continue;      // körlenmiş
      if ((kilit.hp || 100) <= 0) continue;                   // hasarlı

      for (const sid of panopticonRange(kilit.target)){
        const sy = G.sys[sid];
        if (!sy) continue;
        if (sy.seen.indexOf(e.id) < 0) sy.seen.push(e.id);
        sy.panopt = sy.panopt || {};
        sy.panopt[e.id] = G.day;                    // canlı görüş damgası

        /* ── KARŞI İSTİHBARAT İPUCU ──
           Gözlenen taraf 2. seviye ağ kurduysa fark eder. */
        if (sy.owner >= 0 && sy.owner !== e.id){
          const hedef = G.emps[sy.owner];
          if (hedef && !hedef.dead && typeof intelOf === 'function' &&
              intelOf(hedef, e.id) >= 2){
            hedef.panoptSeen = hedef.panoptSeen || {};
            if (!hedef.panoptSeen[e.id]){
              hedef.panoptSeen[e.id] = {sys: +kaynak, at: G.memAge || 0};
              if (hedef.id === 0)
                say('🛰 PANOPTİKON TESPİT EDİLDİ — ' + e.name +
                    ' sistemlerimizi izliyor. İstihbarat panelinden karşılık ver.', 'war');
            }
          }
        }
      }
    }
  }
}


/* ═══════════════════════════════════════════════════════════════════
   FAZ 60 — TERSANE ÜRETİM OTOMASYONU
   Tersane bir gemi tipine kilitlenip sürekli üretir. Kaynak
   kritik sınırın altına inince kuyruk KENDİLİĞİNDEN duraklar —
   otomasyon oyuncuyu iflasa sürüklemez.
   ═══════════════════════════════════════════════════════════════════ */
const LOOP_ALA_FLOOR = 400;    // bu alaşımın altında otomasyon uyur
const LOOP_ENE_FLOOR = 250;    // enerji tabanı (bakım ödenemezse anlamsız)
const LOOP_CAP_LIMIT = .92;    // filo kapasitesi bu oranı aşarsa dur

/* Otomasyon şu an üretebilir mi? Neden olmasın? */
function loopBuildStatus(e, sys){
  if (!sys || !sys.loopBuild) return {aktif:false};
  const cls = sys.loopBuild;
  if (sys.yardLock && sys.yardLock > (G.memAge || 0))
    return {aktif:true, dur:true, why:'Tersane sabote edilmiş'};
  if ((e.res.ala || 0) < LOOP_ALA_FLOOR)
    return {aktif:true, dur:true, why:'Alaşım ' + LOOP_ALA_FLOOR + ' altında'};
  if ((e.res.ene || 0) < LOOP_ENE_FLOOR)
    return {aktif:true, dur:true, why:'Enerji ' + LOOP_ENE_FLOOR + ' altında'};
  const kap = Math.max(1, Math.round(e.cap || 1));
  const kul = (typeof fleetUsage === 'function') ? fleetUsage(e) : 0;
  if (kul / kap >= LOOP_CAP_LIMIT)
    return {aktif:true, dur:true, why:'Filo kapasitesi %' +
      Math.round(kul / kap * 100) + ' dolu'};
  const S = SHIPS[cls];
  if (S && S.cost){
    for (const r in S.cost)
      if ((e.res[r] || 0) < S.cost[r] * 1.5)
        return {aktif:true, dur:true, why:'Kaynak yetersiz (' + r + ')'};
  }
  return {aktif:true, dur:false, cls};
}

/* Aylık: boş kalan döngü tersanelerini yeniden doldur */
function loopBuildTick(){
  for (const sys of G.sys){
    if (!sys.loopBuild) continue;
    const e = G.emps[sys.owner];
    if (!e || e.dead) { delete sys.loopBuild; continue; }
    /* Kuyrukta iş varsa karışma */
    if (sys.queue && sys.queue.length) continue;

    const st = loopBuildStatus(e, sys);
    if (st.dur){
      /* Ayda bir uyar, spam yapma */
      if (e.id === 0 && sys._loopWarn !== (G.memAge || 0)){
        sys._loopWarn = G.memAge || 0;
        say('⏸ ' + sys.name + ' döngüsü duraklatıldı — ' + st.why, 'war');
      }
      continue;
    }
    if (queueShip(e, sys, st.cls, true) !== false && e.id === 0)
      sys._loopWarn = -1;
  }
}


/* ═══════════════════════════════════════════════════════════════════
   FAZ 61 — YÖNELİM OTOMASYONU (DIRECTIVES)
   Odak yalnız çarpan veriyordu; artık boş yapı alanı açıldığında
   o odağa uygun binayı KENDİ diker. Mikro-yönetim biter, ama
   bütçe kilidi oyuncuyu iflasa sürüklemez.
   ═══════════════════════════════════════════════════════════════════ */
const DIRECTIVE_PLAN = {
  sanayi  : ['maden', 'dokum', 'santral', 'fabrika'],
  arastir : ['lab', 'arsiv', 'santral', 'maden'],
  garnizon: ['kale', 'tersane', 'santral', 'maden'],
  tarim   : ['ciftlik', 'klinik', 'santral', 'maden'],
  yonetim : ['liman', 'arsiv', 'santral', 'ciftlik']
};
const DIRECTIVE_ALA_FLOOR = 300;   // bu altında otomasyon uyur
const DIRECTIVE_MIN_FLOOR = 400;

/* Bu koloni şu an otomatik bina dikebilir mi? */
function directiveStatus(e, col){
  if (!col || !col.auto) return {aktif:false};
  const plan = DIRECTIVE_PLAN[col.f];
  if (!plan) return {aktif:true, dur:true, why:'Bu odağın planı yok'};
  if (col.q && col.q.length) return {aktif:true, dur:true, why:'Zaten inşa sürüyor'};
  const bos = (col.cap || 0) - colonyUsed(col);
  if (bos < 1) return {aktif:true, dur:true, why:'Boş yapı alanı yok'};
  if ((e.res.min || 0) < DIRECTIVE_MIN_FLOOR)
    return {aktif:true, dur:true, why:'Mineral ' + DIRECTIVE_MIN_FLOOR + ' altında'};
  if ((e.res.ala || 0) < DIRECTIVE_ALA_FLOOR)
    return {aktif:true, dur:true, why:'Alaşım ' + DIRECTIVE_ALA_FLOOR + ' altında'};

  /* Plandaki ilk uygun binayı seç: az olandan çoğa doğru tamamla */
  for (const k of plan){
    const B = BUILDINGS[k];
    if (!B) continue;
    const mevcut = (col.b && col.b[k]) || 0;
    if (B.max && mevcut >= B.max) continue;
    /* Aynı binadan 3'ten fazlasını yığma — çeşitlilik korunur */
    if (mevcut >= 3) continue;
    if (B.c){
      let yeter = true;
      for (const r in B.c)
        if ((e.res[r] || 0) < B.c[r] * 1.6) yeter = false;
      if (!yeter) continue;
    }
    return {aktif:true, dur:false, bina:k};
  }
  return {aktif:true, dur:true, why:'Plandaki binalar tamam'};
}

/* Aylık: yönelim verilmiş kolonilerde otomatik inşa */
function directiveTick(){
  for (const e of G.emps){
    if (e.dead || e.wild || e.crisisSide) continue;
    for (const c of (e.colonies || [])){
      const sys = G.sys[c.s];
      const pl = sys && sys.planets[c.p];
      if (!pl || !pl.col || !pl.col.auto) continue;

      const st = directiveStatus(e, pl.col);
      if (st.dur){
        /* Yalnız kaynak sıkıntısını bildir, "alan yok"u değil */
        if (e.id === 0 && st.why && /altında/.test(st.why) &&
            pl.col._dirWarn !== (G.memAge || 0)){
          pl.col._dirWarn = G.memAge || 0;
          say('⏸ ' + (pl.col.name || pl.name) + ' otomasyonu bekliyor — ' +
              st.why, 'war');
        }
        continue;
      }
      if (typeof queueBuilding === 'function'){
        const r = queueBuilding(e, sys, pl, st.bina);
        if (r !== false && e.id === 0)
          say('🏗 ' + (pl.col.name || pl.name) + ' · ' +
              BUILDINGS[st.bina].n + ' otomatik sıraya alındı', 'sci');
      }
    }
  }
}


/* ═══════════════════════════════════════════════════════════════════
   FAZ 61 — İDEOLOJİK BÖLÜNME (SCHISM)
   ═══════════════════════════════════════════════════════════════════ */

/* Ana gövdenin zıttı bir etik profili üret */
function schismEthics(e){
  const ana = (e && e.ethics) || {};
  const yeni = {};
  let guclu = null, guclV = 0;
  for (const ax in ETHICS){
    const v = ana[ax] || 0;
    /* Zıt işaret, benzer şiddet — ama tavanı aşma */
    yeni[ax] = clamp(-Math.sign(v) * Math.min(Math.abs(v) || 1, 2),
                     -ETHIC_MAX, ETHIC_MAX);
    if (Math.abs(v) > guclV){ guclV = Math.abs(v); guclu = ax; }
  }
  /* Ana gövde tamamen nötrse bölünme yine de bir kimlik seçer:
     baskıya karşı özgürlükçü + pasifist bir damar. */
  if (!guclu || guclV === 0){ yeni.mil = -1; yeni.aut = -2; }
  else {
    /* En güçlü eksende zıtlık FANATİK olur — kopuşun sebebi odur */
    yeni[guclu] = clamp(-Math.sign(ana[guclu]) * 2, -ETHIC_MAX, ETHIC_MAX);
  }
  return yeni;
}

/* Bölünme eşiği: uzun süreli düşük istikrar ya da casusluk baskısı */
const SCHISM_STAB   = 25;    // bu istikrarın altı huzursuzluk sayılır
const SCHISM_MONTHS = 48;    // bu kadar ay sürerse bölünme
const SCHISM_MIN_SYS = 4;    // altında bölünecek gövde yok

function schismTick(){
  for (const e of G.emps){
    if (e.dead || e.wild || e.crisisSide) continue;
    let sysN = 0;
    for (const sy of G.sys) if (sy.owner === e.id) sysN++;
    if (sysN < SCHISM_MIN_SYS){ e.schism = 0; continue; }

    /* İmparatorluk genelinde ortalama istikrar */
    let top = 0, n = 0, enKotu = null, enKotuV = 999;
    for (const c of (e.colonies || [])){
      const sys = G.sys[c.s];
      const pl = sys && sys.planets[c.p];
      if (!pl || !pl.col) continue;
      top += pl.col.stab; n++;
      if (pl.col.stab < enKotuV && sys.id !== e.home){
        enKotuV = pl.col.stab; enKotu = {sys, pl};
      }
    }
    if (!n){ e.schism = 0; continue; }
    const ort = top / n;

    /* Casusluk baskısı: kışkırtılmış koloni sayacı hızlandırır */
    let kiskirtma = 0;
    for (const c of (e.colonies || [])){
      const sys = G.sys[c.s];
      const pl = sys && sys.planets[c.p];
      if (pl && pl.col && pl.col.unrest) kiskirtma++;
    }

    if (ort < SCHISM_STAB){
      e.schism = (e.schism || 0) + 1 + Math.min(2, kiskirtma);
      /* Oyuncuya yarı yolda uyarı */
      if (e.id === 0 && e.schism === Math.round(SCHISM_MONTHS * .5))
        say('⚠ İMPARATORLUK BÖLÜNMENİN EŞİĞİNDE — halkın yarısı ' +
            'yönetimi reddediyor. İstikrarı toparlamazsan ideolojik ' +
            'bir kopuş yaşanacak.', 'war');
    } else {
      e.schism = Math.max(0, (e.schism || 0) - 2);
      continue;
    }

    if (e.schism >= SCHISM_MONTHS && enKotu){
      e.schism = 0;
      const yeni = secede(e, enKotu.sys, enKotu.pl);
      if (yeni){
        /* ═══ YÜKSEK HUSUMET ═══ İdeolojik kopuş affedilmez */
        yeni.rel[e.id] = -100;
        e.rel[yeni.id] = -100;
        yeni.schismOf = e.id;
        if (typeof remember === 'function'){
          remember(yeni, e.id, 'ihanet');
          remember(e, yeni.id, 'ihanet');
        }
        if (typeof recalcMods === 'function'){ recalcMods(yeni); recalcMods(e); }
        const et = yeni.ethics || {};
        const tarif = [];
        if (et.mil > 0) tarif.push('militarist'); else if (et.mil < 0) tarif.push('pasifist');
        if (et.aut > 0) tarif.push('otoriter');   else if (et.aut < 0) tarif.push('özgürlükçü');
        if (e.id === 0 && typeof UI !== 'undefined')
          UI.eventArt('veri', 'İDEOLOJİK BÖLÜNME',
            yeni.name + ' bağımsızlığını ilan etti. Kopanlar senin ' +
            'yönetim anlayışını reddediyor ve tam zıttı bir düzen ' +
            'kuruyorlar' + (tarif.length ? ' (' + tarif.join(', ') + ')' : '') +
            '. Aranızda uzlaşma yok — bu bir husumet, bir anlaşmazlık değil.');
        else if (typeof say === 'function')
          say('⚡ ' + e.name + ' ideolojik olarak bölündü: ' + yeni.name, 'war');
      }
    }
  }
}


/* ═══════════════════════════════════════════════════════════════════
   FAZ 66 — GALAKTİK PİYASA
   Üç kaynak arasında takas. Kur SABİT DEĞİL: her işlem arz-talebi
   kaydırır. Çok alınan pahalanır, çok satılan ucuzlar. Fiyatlar
   zamanla taban değere geri süzülür (mean reversion) — böylece
   piyasa ne donar ne de sonsuza kadar bozulur.
   ═══════════════════════════════════════════════════════════════════ */
const MARKET_RES = ['ene', 'min', 'ala'];
/* Taban değerler: alaşım en kıymetli, enerji en bol */
const MARKET_BASE = {ene: 1.0, min: 1.4, ala: 3.2};
const MARKET_FEE  = .08;      // %8 komisyon — takas bedava değil
const MARKET_DRIFT = .04;     // aylık taban değere dönüş oranı
const MARKET_IMPACT = .00018; // birim başına fiyat kayması
const MARKET_MIN = .35, MARKET_MAX = 3.0;   // taban çarpanı sınırları

/* ═══ FAZ 78: BORSA KONSEY KARARIYLA AÇILIR ═══
   Oyun başında borsa YOK. Galaktik Konsey "Galaktik Borsayı Kur"
   yasasını geçirene kadar hiçbir devlet takas yapamaz. */
function marketOpen(){
  return !!(typeof councilExists === 'function' && councilExists() &&
            G.council.laws && G.council.laws.borsaKur);
}

function marketInit(){
  if (G.market) return G.market;
  G.market = {mul: {ene: 1, min: 1, ala: 1}, hist: [], acildi: G.memAge || 0};
  return G.market;
}

/* Bir kaynağın güncel birim fiyatı */
function marketPrice(r){
  const m = marketInit();
  return (MARKET_BASE[r] || 1) * (m.mul[r] || 1);
}

/* miktar kadar `sat` verip `al` almak kaç birim getirir? */
function marketQuote(sat, al, miktar){
  if (!MARKET_RES.includes(sat) || !MARKET_RES.includes(al) || sat === al)
    return {ok: false, why: 'Geçersiz takas'};
  if (!(miktar > 0)) return {ok: false, why: 'Miktar geçersiz'};
  const deger = miktar * marketPrice(sat);
  const brut = deger / marketPrice(al);
  /* FAZ 72: Piyasa Regülasyonu yasası komisyonu düşürür */
  const fee = (typeof marketFeeNow === 'function') ? marketFeeNow() : MARKET_FEE;
  const net = brut * (1 - fee);
  return {ok: true, alinan: net, komisyon: brut - net,
          kurSat: marketPrice(sat), kurAl: marketPrice(al)};
}

function marketTrade(e, sat, al, miktar){
  /* FAZ 78: borsa kurulmadan takas yok */
  if (!marketOpen())
    return {ok:false, why:'Galaktik Borsa henüz kurulmadı — konseyin ' +
            'karar vermesi gerekiyor'};
  const q = marketQuote(sat, al, miktar);
  if (!q.ok) return q;
  if ((e.res[sat] || 0) < miktar)
    return {ok: false, why: 'Yeterli ' + (RES[sat] ? RES[sat].n : sat) + ' yok'};

  e.res[sat] -= miktar;
  e.res[al] = (e.res[al] || 0) + q.alinan;

  /* ═══ ARZ-TALEP KAYMASI ═══
     Sattığın bollaşır → ucuzlar. Aldığın kıtlaşır → pahalanır. */
  const m = marketInit();
  m.mul[sat] = clamp(m.mul[sat] * (1 - miktar * MARKET_IMPACT), MARKET_MIN, MARKET_MAX);
  m.mul[al]  = clamp(m.mul[al]  * (1 + q.alinan * MARKET_IMPACT), MARKET_MIN, MARKET_MAX);

  if (e.id === 0)
    say('💱 ' + Math.round(miktar) + ' ' + (RES[sat] ? RES[sat].n : sat) +
        ' → ' + Math.round(q.alinan) + ' ' + (RES[al] ? RES[al].n : al) +
        ' (komisyon %' + Math.round(MARKET_FEE * 100) + ')', 'sci');
  return {ok: true, alinan: q.alinan};
}

/* Aylık: fiyatlar taban değere doğru süzülür + AI işlemleri
   piyasayı hafifçe kıpırdatır (piyasa yalnız oyuncunun değil) */
function marketTick(){
  if (!marketOpen()) return;        // FAZ 78: kapalı borsada fiyat oynamaz
  const m = marketInit();
  for (const r of MARKET_RES){
    m.mul[r] += (1 - m.mul[r]) * MARKET_DRIFT;
    m.mul[r] = clamp(m.mul[r], MARKET_MIN, MARKET_MAX);
  }
  /* Galaktik arz: darlık çeken kaynağın fiyatı yükselir */
  const stok = {ene: 0, min: 0, ala: 0};
  let n = 0;
  for (const e of G.emps){
    if (e.dead || e.wild || e.crisisSide) continue;
    n++;
    for (const r of MARKET_RES) stok[r] += (e.res[r] || 0);
  }
  if (n){
    const ort = (stok.ene + stok.min + stok.ala) / 3 || 1;
    for (const r of MARKET_RES){
      const oran = stok[r] / ort;           // 1 = dengede
      if (oran < .7) m.mul[r] = clamp(m.mul[r] * 1.012, MARKET_MIN, MARKET_MAX);
      else if (oran > 1.4) m.mul[r] = clamp(m.mul[r] * .990, MARKET_MIN, MARKET_MAX);
    }
  }
  /* Grafik için son 40 ay */
  m.hist.push({t: G.memAge || 0, ene: m.mul.ene, min: m.mul.min, ala: m.mul.ala});
  if (m.hist.length > 40) m.hist.shift();
}

/* ═══════════════════════════════════════════════════════════════════
   FAZ 77B — ⚡ TAHT GEMİSİ
   Başkent bir gezegen değil, bir gemidir. Bulunduğu sistemdeki
   kolonilere +%15 üretim saçar. Yok edilirse imparatorluk 12 ay
   felç olur (−%50 üretim).
   ═══════════════════════════════════════════════════════════════════ */
const THRONE_BUFF   = .15;
const THRONE_PENALTY = .50;
const THRONE_MONTHS = 12;

function throneShipOf(e){
  if (!e || !hasCivic(e, 'throneship')) return null;
  for (const f of G.fleets){
    if (f.e !== e.id || !f.ships) continue;
    if (f.ships.some(sh => sh.throne)) return f;
  }
  return null;
}

/* Aylık: taht gemisi yaşıyor mu, felç sayacı işliyor mu? */
function throneTick(){
  for (const e of G.emps){
    if (e.dead || e.wild || e.crisisSide) continue;
    if (!hasCivic(e, 'throneship')) continue;

    const gemi = throneShipOf(e);
    if (gemi){
      e.throneSys = gemi.sys;
      if (e.throneLost){
        delete e.throneLost;
        if (!e.ai) say('👑 Taht Gemisi yeniden inşa edildi — hanedan ayakta', 'win');
      }
      continue;
    }

    /* Gemi yok: felç dönemi */
    if (e.throneLost === undefined){
      e.throneLost = THRONE_MONTHS;
      delete e.throneSys;
      if (!e.ai && typeof UI !== 'undefined')
        UI.eventArt('infaz', 'TAHT GEMİSİ YOK EDİLDİ',
          'Hanedanın yüzen başkenti enkaza döndü. ' + THRONE_MONTHS +
          ' ay boyunca üretimin yarıya iner — imparatorluk felç oldu. ' +
          'Yeni bir taht gemisi inşa edene kadar bu böyle sürecek.',
          'war', 'kritik', e);
      else if (G.p && G.p.contact && G.p.contact[e.id])
        say('👑 ' + e.name + ' taht gemisini kaybetti', 'war');
    } else if (e.throneLost > 0){
      e.throneLost--;
      if (e.throneLost === 0 && !e.ai)
        say('👑 Felç dönemi bitti — ama taht gemin hâlâ yok', 'war');
    }
  }
}

/* Üretim çarpanı: taht gemisi varsa buff, kayıpsa ceza */
function throneMul(e, sysId){
  if (!hasCivic(e, 'throneship')) return 1;
  if (e.throneLost > 0) return 1 - THRONE_PENALTY;
  if (e.throneSys !== undefined && e.throneSys === sysId) return 1 + THRONE_BUFF;
  return 1;
}

/* ═══════════════════════════════════════════════════════════════════
   FAZ 77B — ⚡ YILDIZ YİYEN EKONOMİ
   Maden istasyonları %40 verimle çalışır. Karşılığında gezegen
   tüketilebilir: haritadan silinir, devasa kaynak verir.
   Açlık sayacı her yıl artar; beslenmezse üretim ve ateş hızı çöker.
   ═══════════════════════════════════════════════════════════════════ */
const DEVOUR_MINE_EFF = .40;    // maden istasyonu verimi
const HUNGER_PER_YEAR = 8;      // yıllık açlık artışı
const HUNGER_MAX      = 100;

function canDevour(e, sys, pl){
  if (!hasCivic(e, 'devourer')) return {ok:false, why:'Bu doktrin sende yok'};
  if (!pl) return {ok:false, why:'Gezegen yok'};
  if (pl.devoured) return {ok:false, why:'Bu gezegen zaten tüketilmiş'};
  if (pl.col && pl.owner !== e.id)
    return {ok:false, why:'Başkasının kolonisi — önce işgal et'};
  if (sys.owner >= 0 && sys.owner !== e.id && !e.war[sys.owner])
    return {ok:false, why:'Yabancı toprakta tüketim savaş gerektirir'};
  /* Yörüngede filo şart — yutacak bir şey lazım */
  const filo = G.fleets.some(f => f.e === e.id && f.sys === sys.id && f.ships.length);
  if (!filo) return {ok:false, why:'Sistemde filon yok'};
  return {ok:true};
}

function devourPlanet(e, sys, pl){
  const chk = canDevour(e, sys, pl);
  if (!chk.ok) return chk;

  /* Verim: gezegen boyutu ve türü belirler */
  const boy = pl.size || 10;
  const kazanc = {
    min: Math.round(boy * 140 + rnd() * 400),
    ala: Math.round(boy * 55  + rnd() * 160),
    ene: Math.round(boy * 90  + rnd() * 260)
  };
  /* Koloniyse nüfus da yutulur — ağır bir suç */
  let pop = 0;
  if (pl.col){
    pop = Math.round(pl.col.pop || 0);
    const sahip = G.emps[pl.owner];
    if (sahip){
      const ix = sahip.colonies.findIndex(c => c.s === sys.id && c.p === pl.i);
      if (ix >= 0) sahip.colonies.splice(ix, 1);
    }
    delete pl.col;
    pl.owner = -1;
    /* Galaksi bunu unutmaz */
    for (const o of G.emps){
      if (o.dead || o.wild || o.crisisSide || o.id === e.id) continue;
      if (!o.contact[e.id]) continue;
      o.rel[e.id] = clamp((o.rel[e.id] || 0) - 30, -100, 100);
      if (typeof remember === 'function') remember(o, e.id, 'katliam');
    }
    e.threat = (e.threat || 0) + 25;
  }

  for (const r in kazanc) e.res[r] = (e.res[r] || 0) + kazanc[r];
  pl.devoured = true;
  pl.t = 'enkaz';
  e.hunger = Math.max(0, (e.hunger || 0) - 30);   // açlık diner

  if (!e.ai && typeof UI !== 'undefined')
    UI.eventArt('catlak', 'GEZEGEN TÜKETİLDİ',
      pl.name + ' artık yok. Kabuğu söküldü, çekirdeği emildi. ' +
      '+' + kazanc.min + ' mineral, +' + kazanc.ala + ' alaşım, +' +
      kazanc.ene + ' enerji' +
      (pop ? '. ' + pop + ' milyar canlı da onunla gitti — galaksi bunu duyacak.' : '.'),
      'war', 'kritik', e);
  return {ok:true, kazanc, pop};
}

/* Aylık: açlık büyür, doyurulmazsa ceza ağırlaşır */
function hungerTick(){
  for (const e of G.emps){
    if (e.dead || e.wild || e.crisisSide) continue;
    if (!hasCivic(e, 'devourer')) continue;
    e.hunger = Math.min(HUNGER_MAX, (e.hunger || 0) + HUNGER_PER_YEAR / 12);
    if (!e.ai){
      if (e.hunger >= 70 && e._hungerWarn !== 'kritik'){
        e._hungerWarn = 'kritik';
        say('🌟 AÇLIK KRİTİK (%' + Math.round(e.hunger) +
            ') — üretimin ve ateş hızın çöküyor. Bir gezegen tüket.', 'war');
      } else if (e.hunger < 40 && e._hungerWarn) delete e._hungerWarn;
    }
  }
}

/* Açlık çarpanı: 0 açlıkta 1.0, tam açlıkta 0.45 */
function hungerMul(e){
  if (!hasCivic(e, 'devourer')) return 1;
  return 1 - ((e.hunger || 0) / HUNGER_MAX) * .55;
}

/* ═══════════════════════════════════════════════════════════════════
   FAZ 77C — SITUATIONS (DURUMLAR) MOTORU
   Tek tıkla biten olay değil; aylık işleyen, aşama atlayan,
   iki sayaçla ilerleyen ve kaynak akışını sürekli etkileyen
   uzun soluklu hikâye zincirleri.

   PERFORMANS VE BELLEK:
   · Aynı anda en çok SIT_MAX_ACTIVE (3) durum açık kalabilir.
   · Tick yalnız AKTİF durumlar üzerinde döner — SITUATIONS
     kataloğu taranmaz. Boş listede maliyet sıfır.
   · Tetikleme denemesi ayda bir, %6 şansla ve yalnız oyuncu
     için yapılır (AI'lar durum yaşamaz — 10 devlet × 4 zincir
     yerine 1 devlet × 4 zincir).
   · Biten durumlar diziden SİLİNİR, `done` bayrağıyla arşivde
     birikmez; yalnız G.sitDone içine anahtarı yazılır ki aynı
     zincir tekrar başlamasın. Bu bir dizi değil nesne — O(1).
   · Durum objesi harita nesnelerine REFERANS tutmaz, yalnız
     id saklar (sys id, emp id). Böylece silinen bir sistem
     bellekte asılı kalmaz.
   ═══════════════════════════════════════════════════════════════════ */
const SIT_MAX_ACTIVE = 3;
const SIT_TRY_CHANCE = .06;
const SIT_MIN_YEAR   = 8;      // ilk 8 yıl sakin geçsin

/* Bir seçenek şu an açık mı? Doktrin/fizyoloji kilidi. */
function sitOptionOpen(e, opt){
  if (!opt) return false;
  if (opt.dokt && (e.mizac || e._pers) !== opt.dokt) return false;
  if (opt.fizyo && (e.physio || 'humanoid') !== opt.fizyo) return false;
  if (opt.civic && !hasCivic(e, opt.civic)) return false;
  if (opt.minSay && (opt.minSay.k !== undefined)){
    /* sayaç eşiği: {k:'korku', v:60, yon:'ust'} */
    const s = arguments[2];
    if (s){
      const deger = s.say[opt.minSay.k] || 0;
      if (opt.minSay.yon === 'alt' ? deger > opt.minSay.v : deger < opt.minSay.v)
        return false;
    }
  }
  return true;
}

function sitOptionWhy(e, opt){
  if (opt.dokt) return (PERSONAS[opt.dokt] ? PERSONAS[opt.dokt].n : opt.dokt) +
                       ' doktrini gerekir';
  if (opt.fizyo) return (PHYSIO[opt.fizyo] ? PHYSIO[opt.fizyo].n : opt.fizyo) +
                        ' fizyolojisi gerekir';
  if (opt.civic) return 'Uygun sivil politika gerekir';
  if (opt.minSay) return 'Sayaç eşiği tutmuyor';
  return 'Şu an seçilemez';
}

/* Yeni durum başlat */
function startSituation(e, key){
  const S = SITUATIONS[key];
  if (!S) return null;
  G.sits = G.sits || [];
  G.sitDone = G.sitDone || {};
  if (G.sitDone[key]) return null;
  if (G.sits.some(x => x.key === key)) return null;
  if (G.sits.length >= SIT_MAX_ACTIVE) return null;

  const s = {
    key, emp: e.id, stage: 1, age: 0,
    say: {},                       // sayaçlar
    log: [],                       // oyuncunun verdiği kararlar
    data: {}                       // zincire özel durum (sys id vb.)
  };
  for (const k in S.say) s.say[k] = S.say[k].bas;
  if (S.kur) { try { S.kur(e, s); } catch(err){ console.warn('sit kur:', err); } }
  G.sits.push(s);
  if (e.id === 0 && typeof UI !== 'undefined' && UI.eventArt)
    UI.eventArt(S.art || 'veri', S.n, S.giris, 'sci', 'kritik');
  return s;
}

/* Durumu bitir — dizi temizlenir, anahtar arşive yazılır */
function endSituation(s, sonucMetin, art){
  const S = SITUATIONS[s.key];
  G.sitDone = G.sitDone || {};
  G.sitDone[s.key] = {t: G.memAge || 0, son: s.stage};
  const e = G.emps[s.emp];
  if (e && e.id === 0 && typeof UI !== 'undefined' && UI.eventArt)
    UI.eventArt(art || 'veri', S.n + ' — SON', sonucMetin, 'win', 'kritik');
  else if (typeof say === 'function') say('📜 ' + S.n + ' sona erdi', 'sci');
  G.sits = (G.sits || []).filter(x => x !== s);
}

/* ═══ ANA DÖNGÜ — monthTick çağırır ═══ */
function situationsTick(){
  G.sits = G.sits || [];
  G.sitDone = G.sitDone || {};

  /* 1) Aktif durumları işle */
  for (let i = G.sits.length - 1; i >= 0; i--){
    const s = G.sits[i];
    const S = SITUATIONS[s.key];
    const e = G.emps[s.emp];
    if (!S || !e || e.dead){ G.sits.splice(i, 1); continue; }
    s.age++;

    /* Sayaçlar ilerler */
    for (const k in S.say){
      const C = S.say[k];
      let d = (typeof C.ay === 'function') ? C.ay(e, s) : (C.ay || 0);
      s.say[k] = clamp((s.say[k] || 0) + d, 0, C.max || 100);
    }

    /* Aylık bedel — kaynak akışını sürekli etkiler */
    if (S.bedel){
      const b = S.bedel(e, s);
      if (b) for (const r in b) e.res[r] = Math.max(0, (e.res[r] || 0) + b[r]);
    }

    /* Zincire özel aylık iş (harita nesnesi hareketi vb.) */
    if (S.tick) { try { S.tick(e, s); } catch(err){ console.warn('sit tick:', err); } }

    /* Aşama ilerlemesi */
    const asama = S.asama[s.stage - 1];
    if (asama && asama.gec && asama.gec(e, s) && s.stage < S.asama.length){
      s.stage++;
      s.age = 0;
      if (e.id === 0 && typeof UI !== 'undefined' && UI.eventArt){
        const yeni = S.asama[s.stage - 1];
        UI.eventArt(S.art || 'veri', S.n + ' · Aşama ' + s.stage,
          yeni.t, 'sci', 'kritik');
      }
    }
    /* Zaman aşımı finali */
    if (S.zamanAsimi && s.age > S.zamanAsimi.ay){
      S.zamanAsimi.f(e, s);
      continue;
    }
  }

  /* 2) Yeni durum tetikleme — yalnız oyuncu, seyrek */
  const p = G.p;
  if (!p || p.dead) return;
  if (G.year < (G.startYear || 2200) + SIT_MIN_YEAR) return;
  if (G.sits.length >= SIT_MAX_ACTIVE) return;
  if (rnd() > SIT_TRY_CHANCE) return;

  const adaylar = [];
  for (const k in SITUATIONS){
    if (G.sitDone[k]) continue;
    if (G.sits.some(x => x.key === k)) continue;
    const S = SITUATIONS[k];
    if (S.sart && !S.sart(p)) continue;
    adaylar.push(k);
  }
  if (!adaylar.length) return;
  startSituation(p, adaylar[Math.floor(rnd() * adaylar.length)]);
}

/* ═══════════════════════════════════════════════════════════════════
   FAZ 77D — DİNAMİK BEDEL
   Sabit sayılar oyunun her evresinde aynı acıyı vermiyordu:
   erken oyunda 600 alaşım yıkıcı, geç oyunda bahşiş.
   Artık bedel AYLIK GELİRE oranlanabiliyor: {ay:{ala:10}} =
   10 aylık alaşım geliri.

   NEGATİF GELİR TUZAĞI: gelir eksiyse çarpım da eksi çıkar ve
   oyuncuya KAYNAK VERİRDİ — bu bir istismardı. İki katmanlı
   koruma var: gelir Math.max(0, ...) ile taban alınıyor ve
   sonuç asla `taban` değerinin altına inemiyor. Yani ekonomisi
   çökmüş oyuncu da en az taban kadar öder.
   ═══════════════════════════════════════════════════════════════════ */
function sitCost(e, opt){
  if (!opt) return null;
  if (opt.c && !opt.ay) return opt.c;              // düz sabit
  if (!opt.ay) return null;
  const out = {};
  for (const r in opt.ay){
    const gelir = Math.max(0, (e.inc && e.inc[r]) || 0);   // negatif gelir 0 sayılır
    const taban = (opt.c && opt.c[r]) || 0;                // asgari bedel
    out[r] = Math.max(taban, Math.round(gelir * opt.ay[r]));
    if (out[r] <= 0) out[r] = taban || 1;                  // sıfır bedel olmasın
  }
  return out;
}

/* Arayüzde gösterilecek bedel metni */
function sitCostText(e, opt){
  const b = sitCost(e, opt);
  if (!b) return '';
  return Object.keys(b).map(r =>
    Math.round(b[r]) + ' ' + (RES[r] ? RES[r].n : r)).join(' · ');
}

/* Oyuncunun bir seçeneği seçmesi */
function pickSituation(s, ix){
  const S = SITUATIONS[s.key];
  const e = G.emps[s.emp];
  if (!S || !e) return {ok:false, why:'Durum yok'};
  const asama = S.asama[s.stage - 1];
  if (!asama || !asama.ops || !asama.ops[ix]) return {ok:false, why:'Seçenek yok'};
  const opt = asama.ops[ix];
  if (!sitOptionOpen(e, opt, s)) return {ok:false, why:sitOptionWhy(e, opt)};
  const bedel = sitCost(e, opt);
  if (bedel){
    for (const r in bedel)
      if ((e.res[r] || 0) < bedel[r])
        return {ok:false, why:'Yetersiz ' + (RES[r] ? RES[r].n : r) +
                ' (' + Math.round(bedel[r]) + ' gerekir)'};
    for (const r in bedel) e.res[r] -= bedel[r];
  }
  s.log.push({stage: s.stage, ix, t: G.memAge || 0});
  const sonuc = opt.f ? opt.f(e, s) : '';
  if (sonuc && e.id === 0) say('📜 ' + sonuc, 'sci');
  return {ok:true, msg: sonuc};
}

/* ═══════════════════════════════════════════════════════════════════
   FAZ 77C — HİKÂYE ZİNCİRLERİ
   Her zincir: 2 sayaç · 5 aşama · doktrin/fizyoloji kilitli
   seçenekler · aylık bedel · kalıcı sonuçlu finaller.
   ═══════════════════════════════════════════════════════════════════ */
const SITUATIONS = {

/* ───────────────────── 1. KARANLIK ORMAN ───────────────────── */
karanlik_orman:{
  n:'Karanlık Orman Paranoyası', ico:'🌑', art:'veri',
  giris:'Keşif filomuz camlaşmış bir gezegen buldu. Bir zamanlar orada ' +
        'milyarlar yaşıyordu; hiçbiri savaşarak ölmemiş. Yörüngede tek bir ' +
        'enkaz yok — sadece bir kere ateş edilmiş ve her şey bitmiş. ' +
        'Haber sızdı. Halk geceleri gökyüzüne bakmıyor artık.',
  say:{
    korku       :{n:'Korku', ico:'😰', bas:20, max:100,
                  ay:(e,s)=> 1.4 + s.stage * .5},
    radikallesme:{n:'Radikalleşme', ico:'🔥', bas:5, max:100,
                  ay:(e,s)=> (s.say.korku > 55 ? 1.8 : .4)}
  },
  sart:(e)=> G.sys.length > 10,
  kur:(e,s)=>{
    const aday = G.sys.filter(sy => sy.owner < 0 && !sy.ruin);
    if (aday.length) s.data.sys = aday[Math.floor(rnd()*aday.length)].id;
  },
  bedel:(e,s)=>{
    /* Korku istikrarı ve etkiyi yer */
    const k = s.say.korku;
    return {etk: -(k * .04)};
  },
  tick:(e,s)=>{
    for (const c of (e.colonies || [])){
      const sy = G.sys[c.s], pl = sy && sy.planets[c.p];
      if (pl && pl.col) pl.col.stab = clamp(pl.col.stab - s.say.korku * .012, 0, 100);
    }
  },
  asama:[
    {t:'SESSİZ ÇIĞLIK — Kalıntılarda tek bir kurşun deliği yok. ' +
        'Ne siper kazılmış ne sığınak açılmış. Milyarlarca kişi ' +
        'öleceğini öğrenecek kadar bile yaşamamış. Halkımız bunu ' +
        'öğrendi ve geceleri artık perdeler kapalı.',
     gec:(e,s)=> s.say.korku >= 35,
     ops:[
       {t:'Bulguları mühürle', d:'Arşiv kapatılır, korku yavaşlar — ' +
          'ama sızarsa güven biter',
        ay:{etk:6}, c:{etk:40},
        f:(e,s)=>{ s.say.korku -= 18;
          return 'Kayıtlar mühürlendi. Bilenler sayıldı, listeye yazıldı.'; }},
       {t:'Halka açıkla', d:'Şeffaflık bilim getirir, korkuyu da',
        f:(e,s)=>{ e.res.ara += 60; s.say.korku += 12;
          return 'Yayın bitince sokaklar sessizdi. Bir çocuk sordu: ' +
                 '"Bize de mi yapacaklar?"'; }},
       {t:'Nedensellik Testi', d:'⚙ Teknokrasi — camlaşmanın imzasını çöz',
        dokt:'teknokrasi',
        f:(e,s)=>{ e.res.ara += 240; s.say.korku -= 14; s.say.radikallesme += 6;
          return 'Isı imzası tek bir noktadan geliyor. Bu bir kaza değildi; ' +
                 'bir tetikti. Korkuyu bilgi bastırdı — şimdilik.'; }},
       {t:'Panik Satışı', d:'🎭 Kriminal Sendika — korkudan servet',
        dokt:'kriminal',
        f:(e,s)=>{
          const kar = Math.max(600, Math.round(Math.max(0, (e.inc.ene||0)) * 14));
          e.res.ene += kar; s.say.korku += 10;
          for (const c of (e.colonies || [])){
            const sy = G.sys[c.s], pl = sy && sy.planets[c.p];
            if (pl && pl.col) pl.col.stab = clamp(pl.col.stab - 6, 0, 100);
          }
          return 'Sığınak hisseleri tavan yaptı: +' + kar + ' enerji. ' +
                 'İstikrar düştü ama kasa doldu. Korku iyi iş.'; }}
     ]},
    {t:'Sığınak tarikatları kuruldu. Gökyüzüne bakmak yasak sayılıyor.',
     gec:(e,s)=> s.say.korku >= 60 || s.say.radikallesme >= 30,
     ops:[
       {t:'Tarikatları dağıt', d:'−60 etki · radikalleşme düşer',
        c:{etk:60}, f:(e,s)=>{ s.say.radikallesme -= 20; return 'Meydanlar boşaltıldı.'; }},
       {t:'Sessizlik protokolü', d:'Yayınları kes · korku −25',
        f:(e,s)=>{ s.say.korku -= 25; e.res.ara -= 60;
          return 'Galaksiye yaydığımız her sinyali kestik.'; }},
       {t:'Kutsal savaş çağrısı', d:'Kutsal Meclis · radikalleşme +30',
        dokt:'teokrasi',
        f:(e,s)=>{ s.say.radikallesme += 30; e.res.etk += 120;
          return 'Karanlık bir sınavdır. Halk arkanda toplandı.'; }}
     ]},
    {t:'Filolar gökyüzünü tarıyor. Her sessiz sistem bir tehdit sayılıyor.',
     gec:(e,s)=> s.say.radikallesme >= 55,
     ops:[
       {t:'Savunma hattı kur', d:'−600 alaşım · korku −30',
        c:{ala:600}, f:(e,s)=>{ s.say.korku -= 30;
          for (const sy of G.sys) if (sy.owner === e.id) sy.def = sysDefense(sy);
          return 'Sınırlar dikenli tellerle örüldü.'; }},
       {t:'İlk temas protokolü', d:'Radikalleşme −25 · diplomasi',
        f:(e,s)=>{ s.say.radikallesme -= 25; e.res.etk += 60;
          return 'Belki de konuşmayı denemeliyiz.'; }}
     ]},
    {t:'Karar vakti. Halk bir cevap istiyor — ve iki cevap var.',
     gec:(e,s)=> s.say.radikallesme >= 80 || s.say.korku >= 90,
     ops:[
       {t:'AVCI OL', d:'⚡ "Onlar bizi yok etmeden biz herkesi yok edeceğiz." ' +
          'Doktrin zorla Fanatik Arındırıcılar olur — diplomasi kapanır.',
        f:(e,s)=>{
          e.mizac = 'izolasyonist'; e._pers = 'izolasyonist';
          recalcMods(e);
          for (const o of G.emps){
            if (o.dead || o.wild || o.id === e.id) continue;
            o.rel[e.id] = clamp((o.rel[e.id] || 0) - 60, -100, 100);
          }
          endSituation(s, 'Karanlıkta avcı olmayan av olur. Diplomasi ' +
            'kapandı, gemi hasarımız +%40. Artık biz sessizliğiz.', 'infaz');
          return 'AVCI OLDUK.';
        }},
       {t:'SESSİZ KARANLIK', d:'⚡ "Karanlıkta saklanmalıyız." Doktrin ' +
          'zorla Pasifist olur — savaş açamayız ama gezegenler kaleye döner.',
        f:(e,s)=>{
          e.mizac = 'pasifist'; e._pers = 'pasifist';
          recalcMods(e);
          for (const c of (e.colonies || [])){
            const sy = G.sys[c.s], pl = sy && sy.planets[c.p];
            if (pl && pl.col){
              /* FAZ 77D: %50 savunma kalkanı — mevcut değerin üstüne */
              pl.col.garrison = Math.round((pl.col.garrison || 0) * 1.5 + 60);
              pl.shield = Math.max(pl.shield || 0, 55);
            }
          }
          endSituation(s, 'Sesimizi kestik ve kabuğumuza çekildik. Savaş ' +
            'açamayız — ama gezegenlerimiz artık birer kale.', 'veri');
          return 'SESSİZLİĞİ SEÇTİK.';
        }}
     ]},
    {t:'—'}
  ]
},

/* ───────────────────── 2. GÖÇEN GÜNEŞ ───────────────────── */
gocen_gunes:{
  n:'Göçen Güneşin Ağıdı', ico:'☄', art:'catlak',
  giris:'Bir yıldız hareket ediyor. Yörüngesinden kopmuş değil — ' +
        'yönlendiriliyor. Arkasında hiper yolları bir halı gibi ' +
        'sürüklüyor; geçtiği yerde galaksinin haritası değişiyor.',
  say:{
    rezonans:{n:'Rezonans', ico:'〰', bas:10, max:100,
              ay:(e,s)=> 1.2 + (s.data.yakin ? 2.5 : 0)},
    sapma   :{n:'Yörünge Sapması', ico:'🌀', bas:0, max:100,
              ay:(e,s)=> .9 + s.stage * .4}
  },
  sart:(e)=> G.sys.length > 14,
  kur:(e,s)=>{
    const aday = G.sys.filter(sy => sy.owner < 0);
    if (aday.length){
      const sec = aday[Math.floor(rnd()*aday.length)];
      s.data.sys = sec.id;
      sec.wander = true;              // FAZ 77D: haritada görünsün
    }
    s.data.hedef = -1;
  },
  bedel:(e,s)=> ({ene: -(s.say.rezonans * .35)}),
  tick:(e,s)=>{
    /* Yıldız komşu sisteme "göç eder": hiper yol bağlantısı taşınır */
    if (s.age % 18 !== 0) return;
    const sy = G.sys[s.data.sys];
    if (!sy || !sy.lanes || !sy.lanes.length) return;
    const yeni = sy.lanes[Math.floor(rnd() * sy.lanes.length)];
    const hedefSys = G.sys[yeni];
    if (!hedefSys) return;
    s.data.sys = yeni;
    s.data.yakin = (hedefSys.owner === e.id);
    hedefSys.wander = true;
    hedefSys.wanderFrom = sy.id;      // FAZ 77D: kuyruk çizimi için
    delete sy.wander;
    delete sy.wanderFrom;
    if (e.id === 0)
      say('☄ Göçen Güneş ' + hedefSys.name + ' sistemine kaydı', 'war');
  },
  asama:[
    {t:'Yıldız yaklaşıyor. Rezonans gemi reaktörlerini zorluyor.',
     gec:(e,s)=> s.say.rezonans >= 30,
     ops:[
       {t:'Rezonansı ölç', d:'+150 araştırma',
        f:(e,s)=>{ e.res.ara += 150; return 'Titreşim bir dil gibi düzenli.'; }},
       {t:'Tanrı ilan et', d:'Kutsal Meclis · +200 etki',
        dokt:'teokrasi',
        f:(e,s)=>{ e.res.etk += 200; s.say.rezonans += 15;
          return 'Göklerde yürüyen ateş kutsandı.'; }},
       {t:'Maden üssü kur', d:'Yayılmacı · −400 mineral, +alaşım akışı',
        dokt:'yayilmaci', c:{min:400},
        f:(e,s)=>{ s.data.maden = true;
          return 'Hareketli bir yıldıza kazma vurduk. Kimse bunu yapmamıştı.'; }}
     ]},
    {t:'YOLUNDAKİ KOLONİLER — Yıldız artık bir merak değil, bir takvim. ' +
        'Yörüngesindeki her dünya kaç ay kaldığını biliyor. Tahliye ' +
        'gemileri limanlarda bekliyor; kimse ilk binmek istemiyor, ' +
        'çünkü ilk binen kaçtığını kabul etmiş olur.',
     gec:(e,s)=> s.say.sapma >= 35,
     ops:[
       {t:'Rotaları yeniden çiz', d:'Kaptanlara yeni haritalar — sapma azalır',
        ay:{ene:8}, c:{ene:300},
        f:(e,s)=>{ s.say.sapma -= 22;
          return 'Her kaptan yeni yıldız haritasını ezberledi. Eskisini yaktık.'; }},
       {t:'Ortak Gözlem Konseyi', d:'🕊 Pasifist — riski galaksiyle paylaş',
        dokt:'pasifist',
        f:(e,s)=>{
          s.say.sapma -= 30; e.res.etk += 150;
          for (const o of G.emps){
            if (o.dead || o.wild || o.crisisSide || o.id === e.id) continue;
            if (!e.contact[o.id]) continue;
            o.rel[e.id] = clamp((o.rel[e.id] || 0) + 12, -100, 100);
          }
          return 'Yedi devletin gözlemcisi aynı masaya oturdu. Yıldız hepimizin ' +
                 'sorunu oldu — ve bu, yükü hafifletti.'; }},
       {t:'Kalıcı Çekim Halkası', d:'💰 Tüccar — devasa alaşım, kalıcı enerji',
        dokt:'tuccar', ay:{ala:20}, c:{ala:800},
        f:(e,s)=>{ s.say.rezonans += 20; s.data.kontrol = true;
          e.extra = e.extra || {}; e.extra.eneMul = (e.extra.eneMul||0) + .12;
          recalcMods(e);
          return 'Yıldızın belini çelik bir kuşak sardı. Enerji +%12 kalıcı. ' +
                 'Yıldız artık bizi dinliyor... sanırım.'; }},
       {t:'Yönlendirmeyi dene', d:'Ağır alaşım bedeli · kontrol kazanılır',
        ay:{ala:24}, c:{ala:900},
        f:(e,s)=>{ s.say.rezonans += 20; s.data.kontrol = true;
          return 'Çekim halkaları kuruldu. İlk itki verildi ve yıldız — ' +
                 'bir an için — duraksadı.'; }}
     ]},
    {t:'Yıldız kontrol edilebilir hale geliyor. Ne yapacağız?',
     gec:(e,s)=> s.say.rezonans >= 65,
     ops:[
       {t:'SIĞINAK GÜNEŞ', d:'Haritanın kenarında dost bir ışık uygarlığı ' +
          'doğar · kalıcı enerji +%45',
        f:(e,s)=>{
          e.extra = e.extra || {}; e.extra.eneMul = (e.extra.eneMul || 0) + .45;
          recalcMods(e);
          /* Kenarda dost bir ışık uygarlığı */
          try {
            const dost = makeEmpire(G.emps.length, e.race, 'Işık Sürgünleri',
                                    true, rnd, []);
            dost.wild = true; dost.lightfolk = true; dost.col = '#ffd98a';
            G.emps.push(dost);
            const sy2 = G.sys[s.data.sys];
            if (sy2) newFleet(dost, sy2.id, [{c:'kru'}], 'Işık Kervanı');
          } catch(err){ console.warn('lightfolk:', err); }
          endSituation(s, 'Yıldızı bir jeneratöre çevirdik ve etrafında ' +
            'yaşamaya başlayanlar oldu — ısıyla beslenen, konuşmayan, ' +
            'zarar vermeyen bir halk. Enerjimiz kalıcı +%45. ' +
            'Ağıt bir ilahiye dönüştü.', 'veri');
          return 'SIĞINAK GÜNEŞ KURULDU.';
        }},
       {t:'TAÇLANMIŞ GEZGİN', d:'⚔ Yıldızı zincirle ve düşmanın üstüne sür ' +
          '— mobil bir kale, yürüyen bir infaz',
        f:(e,s)=>{
          if (!s.data.kontrol) return 'Yıldız üzerinde kontrolümüz yok — önce çekim halkaları gerek.';
          let kurban = null;
          for (const o of G.emps){
            if (o.dead || o.wild || o.crisisSide || o.id === e.id) continue;
            if (e.war[o.id]){ kurban = o; break; }
          }
          if (!kurban) return 'Savaştığın kimse yok — silah boşa yanar.';
          let yutulan = 0;
          for (const sy of G.sys){
            if (sy.owner !== kurban.id) continue;
            if (yutulan >= 2) break;
            for (const pl of sy.planets) if (pl.col){ pl.col = null; pl.owner = -1; yutulan++; }
            sy.owner = -1;
          }
          kurban.rel[e.id] = -100;
          endSituation(s, kurban.name + ' devletinin ' + yutulan +
            ' dünyası yıldızın yolunda buharlaştı. Galaksi bunu unutmayacak.', 'catlak');
          return 'YILDIZ ATEŞLENDİ.';
        }}
     ]},
    {t:'Sapma kritik. Yıldız kontrolden çıkmak üzere.', gec:()=>false, ops:[
       {t:'Bırak gitsin', d:'Durum sona erer',
        f:(e,s)=>{ endSituation(s, 'Yıldız galaksinin karanlığına doğru ' +
          'süzüldü. Arkasında değişmiş bir harita bıraktı.', 'veri');
          return 'Onu serbest bıraktık.'; }}
     ]},
    {t:'—'}
  ],
  zamanAsimi:{ay:240, f:(e,s)=> endSituation(s,
    'Göçen Güneş menzilimizden çıktı. Bir daha görülmedi.', 'veri')}
},

/* ───────────────────── 3. YARINKİ TAHTIN ELÇİLERİ ───────────────────── */
yarinki_taht:{
  n:'Yarınki Tahtın Elçileri', ico:'⏳', art:'veri',
  giris:'Sınırda bir filo belirdi. Gemilerinde bizim armamız var — ama ' +
        'üç yüz yıl sonrasının tasarımıyla. Komutanları kendini bizim ' +
        'soyumuzdan ilan ediyor ve tahtı istiyor. Kayıtlarımızda böyle ' +
        'bir isim yok. Henüz.',
  say:{
    paradoks:{n:'Paradoks', ico:'⧗', bas:15, max:100,
              ay:(e,s)=> 1.1 + s.stage * .6},
    sadakat :{n:'Sadakat', ico:'⚑', bas:70, max:100,
              ay:(e,s)=> -(s.say.paradoks * .035)}
  },
  sart:(e)=> (e.colonies || []).length >= 3,
  kur:(e,s)=>{ s.data.tur = 0; },
  bedel:(e,s)=> ({etk: -(s.say.paradoks * .05)}),
  tick:(e,s)=>{
    if (s.say.sadakat < 30){
      for (const c of (e.colonies || [])){
        const sy = G.sys[c.s], pl = sy && sy.planets[c.p];
        if (pl && pl.col) pl.col.stab = clamp(pl.col.stab - .35, 0, 100);
      }
    }
  },
  asama:[
    {t:'Elçiler görüşme istiyor. Halkın yarısı onlara inanıyor.',
     gec:(e,s)=> s.age > 8 || s.say.paradoks >= 35,
     ops:[
       {t:'Kabul et, dinle', d:'+200 araştırma · paradoks +12',
        f:(e,s)=>{ e.res.ara += 200; s.say.paradoks += 12;
          return 'Anlattıkları hem tanıdık hem imkânsız.'; }},
       {t:'Filoya saldır', d:'Militarist · sadakat +20, paradoks +25',
        dokt:'militarist',
        f:(e,s)=>{ s.say.sadakat += 20; s.say.paradoks += 25;
          return 'Taht istemeye gelen, tahtın gücünü görür.'; }},
       {t:'Sahte peygamber ilan et', d:'Kutsal Meclis · sadakat +30',
        dokt:'teokrasi',
        f:(e,s)=>{ s.say.sadakat += 30; s.say.paradoks += 8;
          return 'Kürsüden okundu: gelecek Tanrı’nın tekelindedir.'; }}
     ]},
    {t:'HAFIZA YAĞMURU — Elçilerin anıları sisteme sızıyor. İnsanlar ' +
        'yaşamadıkları savaşları hatırlamaya başladı: bir kuşatma, ' +
        'bir ihanet, tahtta oturan tanımadıkları bir yüz. Arşivciler ' +
        'henüz yazılmamış belgeleri dosyalıyor.',
     gec:(e,s)=> s.say.paradoks >= 55,
     ops:[
       {t:'Anıları arşivle', d:'Yaşanmamış tarihi kayda geçir',
        f:(e,s)=>{ e.res.ara += 800; s.say.paradoks += 25;
          return 'Anlamadığımız şeyleri kopyaladık. Bir arşivci kendi ' +
                 'ölüm tarihini okuyunca istifa etti.'; }},
       {t:'Reddet ve mühürle', d:'Paradoks düşer, sadakat toparlanır',
        f:(e,s)=>{ s.say.paradoks -= 30; s.say.sadakat += 15;
          return 'Gelecek, geleceğe kalsın. Kapılar kapatıldı.'; }},
       {t:'Gelecek Zihnini Ağa Bağla', d:'⚙ Makine Ağı — geçici devasa ' +
          'bilim, paradoks fırlar',
        fizyo:'machine',
        f:(e,s)=>{ e.res.ara += 1600; s.say.paradoks += 35;
          e.extra = e.extra || {}; e.extra.araMul = (e.extra.araMul||0) + .18;
          recalcMods(e);
          return 'Üç yüz yıllık hafızayı ağa yükledik. Araştırma +%18. ' +
                 'Bazı düğümler kendi kapatılma emrini gördü ve donakaldı.'; }},
       {t:'Tanıkları Ortadan Kaldır', d:'⚔ Militarist — acımasızca sustur',
        dokt:'militarist',
        f:(e,s)=>{ s.say.paradoks -= 40; s.say.sadakat += 25;
          for (const c of (e.colonies || [])){
            const sy = G.sys[c.s], pl = sy && sy.planets[c.p];
            if (pl && pl.col) pl.col.stab = clamp(pl.col.stab - 10, 0, 100);
          }
          return 'Hatırlayanlar sustu. Paradoks çözüldü, vicdan değil.'; }}
     ]},
    {t:'Zaman çizgisi geriliyor. Bir karar verilmezse kırılacak.',
     gec:(e,s)=> s.say.paradoks >= 80 || s.say.sadakat <= 20,
     ops:[
       {t:'İKİZ HANEDANLAR', d:'⚡ Kopyanla masaya otur — müttefik bir ' +
          'kardeş devlet doğar',
        f:(e,s)=>{
          let ikiz = null;
          try {
            ikiz = makeEmpire(G.emps.length, e.race, 'İkiz ' + e.name, true, rnd, []);
            ikiz.col = (typeof shiftColor === 'function') ? shiftColor(e.col) : e.col;
            ikiz.techs = Object.assign({}, e.techs);
            ikiz.mizac = e.mizac; ikiz._pers = e._pers;
            ikiz.look = e.look; ikiz.sigil = e.sigil;
            ikiz.twinOf = e.id;
            G.emps.push(ikiz);
            recalcMods(ikiz);
            const bos = G.sys.find(sy => sy.owner < 0 && sy.planets.some(p2 => !p2.col));
            if (bos){
              bos.owner = ikiz.id; ikiz.home = bos.id;
              const pl = bos.planets.find(p2 => !p2.col);
              if (pl && typeof doColonize === 'function') doColonize(ikiz, bos, pl);
              newFleet(ikiz, bos.id, [{c:'zir'},{c:'zir'}], null);
            }
            e.contact[ikiz.id] = true; ikiz.contact[e.id] = true;
            ikiz.rel[e.id] = 85; e.rel[ikiz.id] = 85;
            e.ally = e.ally || {}; ikiz.ally = ikiz.ally || {};
            e.ally[ikiz.id] = true; ikiz.ally[e.id] = true;
          } catch(err){ console.warn('ikiz:', err); }
          endSituation(s, (ikiz ? ikiz.name : 'İkiz hanedan') + ' tahtı ' +
            'paylaşmayı kabul etti. İki hanedan, tek soy — ve bir ittifak. ' +
            'Aynadaki yüz artık arkanı kolluyor.', 'veri');
          return 'İKİZ HANEDANLAR KURULDU.';
        }},
       {t:'ENTEGRE ET', d:'Teknolojileri devral, elçiler tarihe karışır',
        f:(e,s)=>{
          const kilitsiz = Object.keys(TECHS).filter(t => !e.techs[t]);
          let n = 0;
          for (const t of kilitsiz){ if (n >= 4) break; e.techs[t] = true; n++; }
          recalcMods(e);
          endSituation(s, 'Elçiler tahtın gölgesinde eridi; bilgileri kaldı. ' +
            n + ' teknoloji anında açıldı. Gelecek artık bizim.', 'veri');
          return 'ENTEGRE EDİLDİ.';
        }},
       {t:'KIRIK ZAMAN', d:'⚡ Kopyan haritada DÜŞMAN bir devlet olarak ' +
          'doğar ve tahtı silahla ister',
        f:(e,s)=>{
          let ikiz = null;
          try {
            ikiz = makeEmpire(G.emps.length, e.race, 'İkinci ' + e.name, true, rnd, []);
            ikiz.col = shiftColor ? shiftColor(e.col) : e.col;
            ikiz.techs = Object.assign({}, e.techs);
            ikiz.mizac = e.mizac; ikiz._pers = e._pers;
            ikiz.look = e.look; ikiz.sigil = e.sigil;
            ikiz.twinOf = e.id;
            G.emps.push(ikiz);
            recalcMods(ikiz);
            /* Sınırda bir sisteme yerleştir */
            const bos = G.sys.find(sy => sy.owner < 0 && sy.planets.some(p2 => !p2.col));
            if (bos){
              bos.owner = ikiz.id;
              ikiz.home = bos.id;
              const pl = bos.planets.find(p2 => !p2.col);
              if (pl && typeof doColonize === 'function') doColonize(ikiz, bos, pl);
              newFleet(ikiz, bos.id, [{c:'zir'},{c:'zir'},{c:'kru'}], null);
            }
            e.contact[ikiz.id] = true; ikiz.contact[e.id] = true;
            /* KIRIK ZAMAN: kopya düşman doğar ve savaş açar */
            ikiz.rel[e.id] = -100; e.rel[ikiz.id] = -100;
            ikiz.war[e.id] = true; e.war[ikiz.id] = true;
            ikiz.warSince = {}; ikiz.warSince[e.id] = G.day;
            ikiz.warCause = {}; ikiz.warCause[e.id] = 'Taht İddiası';
            recalcMods(e);
          } catch(err){ console.warn('ikiz:', err); }
          endSituation(s, 'Zaman çizgisi çatladı. ' +
            (ikiz ? ikiz.name : 'İkiz hanedan') + ' galakside kendi tahtını ' +
            'kurdu ve bize savaş ilan etti — bizim teknolojimiz, bizim ' +
            'yüzümüz, bizim armamız. Aynada kendine ateş etmek gibi bir şey ' +
            'bu; kim kazanırsa kaybeden yine biziz.', 'catlak');
          return 'ÇİZGİ KIRILDI — SAVAŞ BAŞLADI.';
        }}
     ]},
    {t:'—'}, {t:'—'}
  ],
  zamanAsimi:{ay:180, f:(e,s)=> endSituation(s,
    'Elçiler geldiği gibi sessizce çekildi. Kayıtlar mühürlendi.', 'veri')}
},

/* ───────────────────── 4. CAM BAHÇELER ───────────────────── */
cam_bahce:{
  n:'Cam Bahçelerin Uyanışı', ico:'💠', art:'veri',
  giris:'Çorak bir dünyada kristal tohumlar çatladı. Ölü kaya, saat ' +
        'içinde damarlanan saydam bir ormana dönüştü. Yapı organik ' +
        'değil ama büyüyor; mineral değil ama katı. Ve bize doğru ' +
        'yayılıyor.',
  say:{
    yayilim:{n:'Yayılım', ico:'🌿', bas:12, max:100,
             ay:(e,s)=> 1.5 + s.stage * .55},
    uyum   :{n:'Uyum', ico:'🔗', bas:8, max:100,
             ay:(e,s)=> (s.data.dost ? 2.2 : .3)}
  },
  sart:(e)=> G.sys.length > 12,
  kur:(e,s)=>{
    const aday = G.sys.filter(sy => sy.planets.some(p2 => !p2.col));
    if (aday.length){
      const sy = aday[Math.floor(rnd()*aday.length)];
      s.data.sys = sy.id;
      const pl = sy.planets.find(p2 => !p2.col);
      s.data.p = pl ? pl.i : 0;
    }
  },
  bedel:(e,s)=> ({min: -(s.say.yayilim * .30)}),
  asama:[
    {t:'Kristal orman büyüyor. Yakındaki madenlerimiz tıkanıyor.',
     gec:(e,s)=> s.say.yayilim >= 35,
     ops:[
       {t:'Numune al', d:'+200 araştırma',
        f:(e,s)=>{ e.res.ara += 200; return 'Kristaller ışığı hafızaya çeviriyor.'; }},
       {t:'Yakarak temizle', d:'−500 enerji · yayılım −30',
        c:{ene:500}, f:(e,s)=>{ s.say.yayilim -= 30; s.say.uyum -= 15;
          return 'Ateş işe yaradı. Ama bahçe çığlık attı — hepimiz duyduk.'; }},
       {t:'Sanal veri bahçesi', d:'Makine Ağı · uyum +35',
        fizyo:'machine',
        f:(e,s)=>{ s.data.dost = true; s.say.uyum += 35; e.res.ara += 400;
          return 'Kristal kafesi bir veri merkezine çevirdik. Düşünüyor.'; }},
       {t:'Kristalleri bedene aşıla', d:'Kayaç · kalıcı gövde bonusu',
        fizyo:'lithoid',
        f:(e,s)=>{ s.data.dost = true; s.say.uyum += 25;
          e.extra = e.extra || {}; e.extra.hullMul = (e.extra.hullMul||0) + .12;
          recalcMods(e);
          return 'Halkımızın derisi artık ışığı kırıyor. Gövde +%12.'; }},
       {t:'Ağı zihne bağla', d:'Kovan Zihni · uyum +45',
        fizyo:'hive',
        f:(e,s)=>{ s.data.dost = true; s.say.uyum += 45;
          return 'Bahçe kovanın bir uzvu oldu. Tek irade büyüdü.'; }}
     ]},
    {t:'İLK ÇİÇEKLENEN DÜNYA — Gezegen uyandı. Kristal damarlar ' +
        'yüzeyin altında nabız gibi atıyor ve her atışta gezegenin ' +
        'kabuğu biraz daha inceliyor. Sondaj ekibimiz aşağıdan bir ' +
        'ses kaydetti: bizim dilimizde, ama kimse konuşmamıştı.',
     gec:(e,s)=> s.say.yayilim >= 60 || s.say.uyum >= 55,
     ops:[
       {t:'Hasat et', d:'Kristal ormanı biç — büyük mineral, uyum çöker',
        f:(e,s)=>{
          const kar = Math.max(1500, Math.round(Math.max(0,(e.inc.min||0)) * 30));
          e.res.min += kar; s.say.uyum -= 40;
          return 'Kristal ormanı biçtik: +' + kar + ' mineral. Kesilen her ' +
                 'damar bir nota çıkardı. Kâr yüksek, vicdan ağır.'; }},
       {t:'Yükselişine yardım et', d:'İskeleyi biz kuralım — uyum yükselir',
        ay:{ala:16}, c:{ala:600},
        f:(e,s)=>{ s.say.uyum += 30; s.data.dost = true;
          return 'İskeleyi biz kurduk. Bahçe kalkacak — ve bunu unutmayacak.'; }},
       {t:'Cam Kökleri Aşıla', d:'💎 Kayaç — gemi zırhı artar, büyüme düşer',
        fizyo:'lithoid',
        f:(e,s)=>{ s.data.dost = true; s.say.uyum += 20;
          e.extra = e.extra || {};
          e.extra.hullMul = (e.extra.hullMul||0) + .18;
          e.extra.growMul = (e.extra.growMul||0) - .10;
          recalcMods(e);
          return 'Kristal kökler tersanelerimize aşılandı: gövde +%18, ' +
                 'büyüme −%10. Gemilerimiz artık ışığı kırıyor.'; }},
       {t:'Sanal Veri Bahçesi', d:'⚙ Makine Ağı — devasa bilim hasadı',
        fizyo:'machine',
        f:(e,s)=>{ s.data.dost = true; s.say.uyum += 30;
          const kar = Math.max(1200, Math.round(Math.max(0,(e.inc.ara||0)) * 25));
          e.res.ara += kar;
          return 'Bahçenin kristal kafesini bir veri merkezine çevirdik: +' +
                 kar + ' araştırma. Kafes düşünüyor ve düşüncesi bizim.'; }},
       {t:'Ana Gangliona Bağla', d:'🐝 Kovan Zihni — uyum tavana çıkar',
        fizyo:'hive',
        f:(e,s)=>{ s.data.dost = true; s.say.uyum = 100;
          return 'Bahçe kovanın bir uzvu oldu. Uyum %100. Tek irade ' +
                 'bir dünya kadar büyüdü ve bunu fark etmedi bile.'; }}
     ]},
    {t:'Bahçe ayrılmaya hazır. Son karar bizde.',
     gec:(e,s)=> s.say.yayilim >= 85 || s.say.uyum >= 80,
     ops:[
       {t:'GALAKTİK ARK', d:'⚡ Gezegen haritadan kopar ve tarafsız, ' +
          'gezen bir Dünya-Gemi olur',
        f:(e,s)=>{
          const sy = G.sys[s.data.sys];
          const pl = sy && sy.planets[s.data.p];
          if (pl){ pl.devoured = true; pl.col = null; pl.owner = -1; }
          /* Tarafsız gezgin fraksiyon */
          try {
            const wg = makeEmpire(G.emps.length, e.race, 'Cam Bahçe', true, rnd, []);
            wg.wild = true; wg.worldship = true;
            wg.col = '#7fe6d8';
            G.emps.push(wg);
            if (sy) newFleet(wg, sy.id, [{c:'zir'},{c:'zir'}], 'Dünya-Gemi');
          } catch(err){ console.warn('worldship:', err); }
          e.extra = e.extra || {}; e.extra.araMul = (e.extra.araMul||0) + .10;
          recalcMods(e);
          endSituation(s, 'Cam Bahçe kabuğunu kırdı ve galaksiye açıldı. ' +
            'Artık kimsenin toprağı değil — gezen bir dünya. Bize veda ' +
            'armağanı bıraktı: araştırma +%10.', 'veri');
          return 'BAHÇE YÜKSELDİ.';
        }},
       {t:'CAM SİMBİYONT', d:'⚡ Gezegen kalıcı Cam Bahçe olur — ' +
          'halkımıza pasif gıda ve uyum akıtır',
        f:(e,s)=>{
          const sy = G.sys[s.data.sys];
          const pl = sy && sy.planets[s.data.p];
          if (pl){
            pl.glassGarden = true;
            /* Sahipsizse bize bağlanır */
            if (sy.owner < 0) sy.owner = e.id;
            if (!pl.col && typeof doColonize === 'function'){
              try { doColonize(e, sy, pl); } catch(err){}
            }
            if (pl.col){ pl.col.glass = true; pl.col.stab = Math.min(100, pl.col.stab + 25); }
          }
          e.extra = e.extra || {};
          e.extra.yiyMul = (e.extra.yiyMul||0) + .25;
          e.extra.stab   = (e.extra.stab||0) + 8;
          recalcMods(e);
          endSituation(s, 'Bahçe kalmayı seçti. Kökleri şehirlerimizin ' +
            'altından geçiyor, meyveleri camdan ama besliyor. Yiyecek ' +
            'üretimimiz kalıcı +%25, istikrar +8. Artık iki tür tek ' +
            'gezegeni paylaşıyor.', 'veri');
          return 'CAM SİMBİYONT KURULDU.';
        }},
       {t:'KÖKLERİNİ KES', d:'Bahçe ölür, depolar dolar — geri dönüşü yok',
        f:(e,s)=>{
          const kar = Math.max(3000, Math.round(Math.max(0,(e.inc.min||0)) * 55));
          e.res.min += kar;
          const sy = G.sys[s.data.sys];
          const pl = sy && sy.planets[s.data.p];
          if (pl) pl.scorchedWorld = true;
          endSituation(s, 'Bahçeyi söktük: +' + kar + ' mineral. Depolarımız ' +
            'doldu, gökyüzü sessizleşti. Son damar kesilirken çıkan ses ' +
            'kayıtlarda duruyor — kimse bir daha dinlemedi. Bazı kararlar ' +
            'kâr hanesine yazılmaz.', 'infaz');
          return 'KÖKLER KESİLDİ.';
        }}
     ]},
    {t:'—'}, {t:'—'}
  ],
  zamanAsimi:{ay:200, f:(e,s)=> endSituation(s,
    'Cam Bahçe büyümesini durdurdu ve taşlaştı. Sessiz bir anıt kaldı.', 'veri')}
}
};

/* ═══════════════════════════════════════════════════════════════════
   FAZ 77D — TAHT GEMİSİ YENİDEN İNŞASI
   Felç dönemi bittikten sonra tersaneden çok ağır bir bedelle
   yeni bir taht gemisi çıkarılabilir. Bedel kasten yüksek:
   bu civic'in bedeli gemiyi kaybetmenin acısıdır, ucuz bir
   yedek parça değil.
   ═══════════════════════════════════════════════════════════════════ */
const THRONE_REBUILD = {ala: 5000, ene: 2500};

function canRebuildThrone(e, sys){
  if (!hasCivic(e, 'throneship'))
    return {ok:false, why:'Taht Gemisi doktrinine sahip değilsin'};
  if (throneShipOf(e))
    return {ok:false, why:'Taht Gemin zaten yaşıyor'};
  if (!sys || sys.owner !== e.id)
    return {ok:false, why:'Kendi tersanende inşa edilir'};
  if (typeof hasYard === 'function' && !hasYard(sys))
    return {ok:false, why:'Bu sistemde tersane yok'};
  if (sys.yardLock && sys.yardLock > (G.memAge || 0))
    return {ok:false, why:'Tersane sabote edilmiş'};
  if (e.throneLost > 0)
    return {ok:false, why:'Enkaz hâlâ yanıyor — ' + e.throneLost +
            ' ay sonra inşaya başlanabilir'};
  for (const r in THRONE_REBUILD)
    if ((e.res[r] || 0) < THRONE_REBUILD[r])
      return {ok:false, why:'Yetersiz ' + (RES[r] ? RES[r].n : r) +
              ' (' + THRONE_REBUILD[r] + ' gerekir)'};
  return {ok:true};
}

function rebuildThrone(e, sys){
  const chk = canRebuildThrone(e, sys);
  if (!chk.ok) return chk;
  for (const r in THRONE_REBUILD) e.res[r] -= THRONE_REBUILD[r];

  const f = newFleet(e, sys.id, [{c:'zir'}, {c:'zir'}, {c:'kru'}],
                     e.ai ? null : 'TAHT GEMİSİ');
  if (f && f.ships.length) f.ships[0].throne = true;
  delete e.throneLost;
  e.throneSys = sys.id;
  if (!e.ai && typeof UI !== 'undefined')
    UI.eventArt('veri', 'YENİ TAHT KURULDU',
      sys.name + ' tersanesinde yeni Taht Gemisi suya indirildi. ' +
      'Hanedanın yüzen başkenti geri döndü — felç sona erdi.',
      'win', 'kritik', e);
  return {ok:true};
}

/* ═══════════════════════════════════════════════════════════════════
   FAZ 78B — LİDERLER (AMİRAL VE VALİ)
   Her liderin kalıcı bir seed'i var: portresi, adı ve özelliği
   ondan türüyor. Amiral bir filoya, vali bir koloniye atanır.
   Etkileri doğrudan o birime uygulanır — imparatorluk geneline
   değil, ki atama kararı anlamlı olsun.
   ═══════════════════════════════════════════════════════════════════ */
const LEADER_TRAITS = {
  lojistik  :{n:'Lojistik Uzmanı', ico:'⚓', tip:'amiral',
              d:'Filo bakımı −%15', e:{upMul:-.15}},
  taktikci  :{n:'Taktikçi',        ico:'⚔', tip:'amiral',
              d:'Filo hasarı +%12', e:{dmgMul:.12}},
  zirhci    :{n:'Zırh Ustası',     ico:'🛡', tip:'amiral',
              d:'Gövde +%15',      e:{hullMul:.15}},
  seyyah    :{n:'Seyyah',          ico:'🧭', tip:'amiral',
              d:'Filo hızı +%20',  e:{spdMul:.20}},
  korkak    :{n:'İhtiyatlı',       ico:'🐢', tip:'amiral',
              d:'Hasar −%8 ama gövde +%20', e:{dmgMul:-.08, hullMul:.20}},

  ilham     :{n:'İlham Verici',    ico:'✨', tip:'vali',
              d:'İstikrar +10',    e:{stab:10}},
  sanayici  :{n:'Sanayici',        ico:'🏭', tip:'vali',
              d:'Mineral +%15',    e:{minMul:.15}},
  alim      :{n:'Âlim',            ico:'📚', tip:'vali',
              d:'Araştırma +%15',  e:{araMul:.15}},
  ciftci    :{n:'Toprak Adamı',    ico:'🌾', tip:'vali',
              d:'Yiyecek +%20',    e:{yiyMul:.20}},
  yolsuz    :{n:'Yolsuz',          ico:'💰', tip:'vali',
              d:'Gelirin %10 kadarını çalar', e:{minMul:-.10, eneMul:-.10}}
};

const LEADER_NAMES = ['Vex','Ardan','Kessa','Torin','Nyla','Draven','Sora','Kael',
  'Imra','Zephyr','Rhea','Auren','Mira','Cassian','Vela','Orin','Thessa','Lyr',
  'Kavon','Serai','Doran','Ilke','Bora','Ferran','Yaren','Sena','Altay','Deniz'];
const LEADER_TITLES = {amiral:['Amiral','Komodor','Filo Beyi','Deniz Beyi'],
                       vali:['Vali','Yönetici','Sancak Beyi','Muhafız']};

let LEADER_ID = 1;

function makeLeader(e, tip, rnd2){
  const R2 = rnd2 || rnd;
  const seed = Math.floor(R2() * 2147483647) || 1;
  /* Özellik havuzu tipe göre süzülür */
  const havuz = Object.keys(LEADER_TRAITS).filter(k => LEADER_TRAITS[k].tip === tip);
  const trait = havuz[Math.floor(R2() * havuz.length)];
  const ad = LEADER_NAMES[Math.floor(R2() * LEADER_NAMES.length)];
  const unvan = LEADER_TITLES[tip][Math.floor(R2() * LEADER_TITLES[tip].length)];
  return {
    id: LEADER_ID++, seed, tip, trait,
    name: unvan + ' ' + ad,
    emp: e.id, rank: 0, xp: 0,
    look: e.look || 'humanoid',
    col: e.col || '#6ff2c8',
    since: G.memAge || 0
  };
}

/* Havuzu doldur — oyuncu buradan atama yapar */
/* ═══════════════════════════════════════════════════════════════════
   FAZ 83.4 — OKUMA SAF, YAZMA AÇIK
   ESKİ DAVRANIŞ: leaderPool okurken bile `e.leaders = []` yazıyordu.
   Lider panelini AÇMAK bile imparatorluk nesnesini değiştiriyor,
   serialize çıktısını 13 bayt büyütüyordu (Faz 83.3'te ölçüldü).
   UI.refresh'in veri değiştirmesi mimari olarak yanlıştı.

   Artık iki ayrı yol var:
     leaderPool(e)       — SAF okuma. Havuz yoksa DONDURULMUŞ boş
                           dizi döner; e'ye hiçbir alan yazılmaz.
     ensureLeaderPool(e) — mutasyon. Yalnız gerçekten lider
                           eklenecekken çağrılır ve kalıcı diziyi
                           orada başlatır.
   Boş görünüm dondurulmuş: yanlışlıkla ona push edilirse sessizce
   kaybolmak yerine hemen belli olur (strict mod'da hata atar).
   ═══════════════════════════════════════════════════════════════════ */
const BOS_LIDER_HAVUZU = Object.freeze([]);

function leaderPool(e){
  return (e && Array.isArray(e.leaders)) ? e.leaders : BOS_LIDER_HAVUZU;
}

function ensureLeaderPool(e){
  if (!e) return BOS_LIDER_HAVUZU;
  if (!Array.isArray(e.leaders)) e.leaders = [];
  return e.leaders;
}

function recruitLeader(e, tip){
  const bedel = {etk: 60};
  for (const r in bedel)
    if ((e.res[r] || 0) < bedel[r])
      return {ok:false, why:bedel[r] + ' etki gerekir'};
  /* FAZ 83.4: önce SAF okumayla sınırı sına — reddedilirse
     hiçbir alan oluşmasın. Kalıcı dizi ancak gerçekten lider
     eklenecekken açılıyor. */
  if (leaderPool(e).length >= 8) return {ok:false, why:'Havuz dolu (8 lider)'};
  for (const r in bedel) e.res[r] -= bedel[r];
  const L = makeLeader(e, tip);
  const havuz = ensureLeaderPool(e);        // gerçek mutasyon burada
  havuz.push(L);
  if (e.id === 0) say('👤 ' + L.name + ' hizmete alındı — ' +
    LEADER_TRAITS[L.trait].ico + ' ' + LEADER_TRAITS[L.trait].n, 'win');
  return {ok:true, leader:L};
}

function assignLeader(e, leaderId, hedefTip, hedefId){
  const havuz = leaderPool(e);
  const L = havuz.find(x => x.id === leaderId);
  if (!L) return {ok:false, why:'Lider bulunamadı'};
  if (L.tip !== hedefTip)
    return {ok:false, why:L.tip === 'amiral' ? 'Bu bir amiral, filoya atanır'
                                             : 'Bu bir vali, gezegene atanır'};
  /* Eski görevden al */
  if (L.post !== undefined){
    if (L.tip === 'amiral'){
      const eski = G.fleets.find(f => f.id === L.post);
      if (eski) delete eski.leader;
    } else {
      for (const c of (e.colonies || [])){
        const sy = G.sys[c.s], pl = sy && sy.planets[c.p];
        if (pl && pl.col && pl.col.leader === L.id) delete pl.col.leader;
      }
    }
  }
  if (hedefTip === 'amiral'){
    const f = G.fleets.find(q => q.id === hedefId && q.e === e.id);
    if (!f) return {ok:false, why:'Filo yok'};
    /* O filoda başka amiral varsa görevden al */
    if (f.leader !== undefined){
      const onc = havuz.find(x => x.id === f.leader);
      if (onc) delete onc.post;
    }
    f.leader = L.id; L.post = f.id;
  } else {
    const [sid, pi] = String(hedefId).split(':').map(Number);
    const sy = G.sys[sid], pl = sy && sy.planets[pi];
    if (!pl || !pl.col || pl.owner !== e.id) return {ok:false, why:'Koloni yok'};
    if (pl.col.leader !== undefined){
      const onc2 = havuz.find(x => x.id === pl.col.leader);
      if (onc2) delete onc2.post;
    }
    pl.col.leader = L.id; L.post = sid + ':' + pi;
  }
  return {ok:true, leader:L};
}

function leaderOf(e, id){
  /* FAZ 83.4: zaten saftı (`e.leaders || []` yazma yapmıyor),
     ama tutarlılık için ortak okuma yolundan geçiyor. */
  if (id === undefined || !e) return null;
  return leaderPool(e).find(x => x.id === id) || null;
}

/* Bir filonun amiral çarpanı */
function fleetLeaderMul(f, anahtar){
  const e = G.emps[f.e];
  if (!e || f.leader === undefined) return 0;
  const L = leaderOf(e, f.leader);
  if (!L) return 0;
  const T = LEADER_TRAITS[L.trait];
  if (!T || !T.e) return 0;
  const v = T.e[anahtar] || 0;
  /* Deneyim kazandıkça etki büyür: rank 0-4 → ×1 … ×1.4
     FAZ 79: ifşa edilmiş lider %25 zayıf çalışır. */
  const dm = (typeof disgraceMul === 'function') ? disgraceMul(L) : 1;
  return v * (1 + L.rank * .10) * dm;
}

/* Bir koloninin vali çarpanı */
function colonyLeaderMul(col, anahtar){
  if (!col || col.leader === undefined) return 0;
  const e = G.emps[col._empId !== undefined ? col._empId : 0];
  for (const emp of G.emps){
    if (emp.dead) continue;
    const L = leaderOf(emp, col.leader);
    if (L){
      const T = LEADER_TRAITS[L.trait];
      if (!T || !T.e) return 0;
      return (T.e[anahtar] || 0) * (1 + L.rank * .10);
    }
  }
  return 0;
}

/* Aylık: deneyim ve terfi */
function leaderTick(){
  for (const e of G.emps){
    if (e.dead || e.wild || e.crisisSide || !e.leaders) continue;
    for (const L of e.leaders){
      if (L.post === undefined) continue;          // boşta olan öğrenmez
      let kazanc = 1;
      if (L.tip === 'amiral'){
        const f = G.fleets.find(q => q.id === L.post);
        if (f && f.combat) kazanc = 4;             // muharebe hızlı öğretir
      }
      L.xp += kazanc;
      const gerek = 40 + L.rank * 55;
      if (L.xp >= gerek && L.rank < 4){
        L.xp = 0; L.rank++;
        if (e.id === 0)
          say('👤 ' + L.name + ' terfi etti — rütbe ' + L.rank + '/4', 'win');
      }
    }
  }
}

/* ═══════════════════════════════════════════════════════════════════
   FAZ 79 — LİDERE ŞANTAJ / İTİBAR SUİKASTI
   Lideri ÖLDÜRMEZ — itibarını yok eder. Ölüm temiz bir sondur;
   ifşa olmuş ama görevde kalan bir komutan hem kendi birimini
   zehirler hem devletini utandırır. Rakip lideri görevden almak
   zorunda kalır ya da bedelini öder.
   ═══════════════════════════════════════════════════════════════════ */
const BLACKMAIL_COST = {etk: 110, ene: 450};
const BLACKMAIL_MONTHS = 36;      // ifşanın ömrü
const BLACKMAIL_PENALTY = .25;    // −%25 filo gücü / koloni istikrarı

function canBlackmailLeader(e, o){
  if (!e || !o || o.dead) return {ok:false, why:'Hedef yok'};
  if (o.id === e.id) return {ok:false, why:'Kendi liderine şantaj yapılmaz'};
  if (o.wild || o.crisisSide) return {ok:false, why:'Bu tarafın lideri yok'};
  if (!e.contact[o.id]) return {ok:false, why:'Temas yok'};
  if (typeof isPurifier === 'function' && isPurifier(e))
    return {ok:false, why:'Doktrinin gizli operasyonlara kapalı'};
  const lvl = (typeof intelOf === 'function') ? intelOf(e, o.id) : 0;
  if (lvl < 2) return {ok:false, why:'En az 2. seviye istihbarat gerekir'};
  const hedefler = (o.leaders || []).filter(L => L.post !== undefined &&
    !(L.disgraced && L.disgraced > (G.memAge || 0)));
  if (!hedefler.length)
    return {ok:false, why:'Görevde, ifşa edilmemiş lideri yok'};
  for (const r in BLACKMAIL_COST)
    if ((e.res[r] || 0) < BLACKMAIL_COST[r])
      return {ok:false, why:'Yetersiz ' + (RES[r] ? RES[r].n : r) +
              ' (' + BLACKMAIL_COST[r] + ' gerekir)'};
  return {ok:true, hedefler, lvl};
}

function blackmailLeader(e, o, leaderId){
  const chk = canBlackmailLeader(e, o);
  if (!chk.ok) return chk;
  const L = (o.leaders || []).find(x => x.id === leaderId) ||
            chk.hedefler[Math.floor(rnd() * chk.hedefler.length)];
  if (!L) return {ok:false, why:'Lider seçilemedi'};
  for (const r in BLACKMAIL_COST) e.res[r] -= BLACKMAIL_COST[r];

  const ch = (typeof sabotageChance === 'function')
    ? sabotageChance(e, o) : {basari:.4, ifsa:.3};
  /* İtibar suikastı sabotajdan kolaydır: fiziksel erişim gerekmez,
     yalnız doğru belgeyi doğru kişiye ulaştırmak yeter. */
  const basari = clamp(ch.basari * 1.15, .08, .82);
  const ifsa   = clamp(ch.ifsa * .85, .04, .55);

  if (rnd() < basari){
    L.disgraced = (G.memAge || 0) + BLACKMAIL_MONTHS;
    L.disgraceBy = e.id;
    /* Rütbe düşer — itibar geri kazanılması gereken bir şey */
    if (L.rank > 0){ L.rank--; L.xp = 0; }
    /* Devletin geneline hafif utanç */
    for (const c of (o.colonies || [])){
      const sy = G.sys[c.s], pl = sy && sy.planets[c.p];
      if (pl && pl.col) pl.col.stab = clamp(pl.col.stab - 4, 0, 100);
    }
    if (o.factions) for (const f of o.factions) f.mood = clamp(f.mood - 5, 5, 95);

    o.hitLog = o.hitLog || [];
    o.hitLog.push({t: G.memAge || 0, k: 'blackmail', by: e.id,
                   caught: false, known: false});

    if (e.id === 0 && typeof UI !== 'undefined')
      UI.eventArt('veri', 'İTİBAR SUİKASTI',
        L.name + ' hakkındaki belgeler doğru ellere ulaştı. ' +
        o.name + ' onu görevden almadı — alamıyor, yerine kimse yok. ' +
        'Artık emrindeki herkes ona farklı bakıyor. ' + BLACKMAIL_MONTHS +
        ' ay boyunca birimi %' + Math.round(BLACKMAIL_PENALTY * 100) +
        ' zayıf çalışacak.', 'sci', 'kritik', o);
    else if (o.id === 0 && typeof UI !== 'undefined')
      UI.eventArt('infaz', 'KOMUTANIMIZ İFŞA OLDU',
        L.name + ' hakkında bilinmeyen belgeler ortaya çıktı. Suçlamalar ' +
        'ağır ve zamanlaması şüpheli. Birimi ' + BLACKMAIL_MONTHS +
        ' ay boyunca gölge altında çalışacak.', 'war', 'kritik');
    return {ok:true, basarili:true, leader:L};
  }

  if (rnd() < ifsa){
    o.rel[e.id] = clamp((o.rel[e.id] || 0) - 40, -100, 100);
    if (typeof remember === 'function') remember(o, e.id, 'komplo');
    o._lastCB = {n:'İtibar Suikastı', w:1.15};
    if (e.id === 0)
      say('⚠ Şantaj belgeleri bize kadar izlendi — ' + o.name + ' öfkeli', 'war');
    else if (o.id === 0 && typeof UI !== 'undefined')
      UI.eventArt('infaz', 'ŞANTAJ GİRİŞİMİ İFŞA OLDU',
        e.name + ' komutanlarımızdan birine kumpas kurmaya çalıştı. ' +
        'Belgeler sahteydi ve izi kaynağına kadar sürdük.', 'war', 'kritik', e);
    return {ok:true, basarili:false, ifsa:true};
  }
  return {ok:true, basarili:false, ifsa:false};
}

/* İfşa edilmiş lider hâlâ görevde mi? Çarpanı burada uygulanır. */
function disgraceMul(L){
  if (!L || !L.disgraced) return 1;
  if (L.disgraced <= (G.memAge || 0)) return 1;
  return 1 - BLACKMAIL_PENALTY;
}

/* Aylık: süresi dolan ifşalar temizlenir */
function disgraceTick(){
  for (const e of G.emps){
    if (e.dead || !e.leaders) continue;
    for (const L of e.leaders){
      if (!L.disgraced) continue;
      if (L.disgraced > (G.memAge || 0)) continue;
      delete L.disgraced; delete L.disgraceBy;
      if (e.id === 0)
        say('👤 ' + L.name + ' itibarını geri kazandı', 'win');
    }
  }
}
