/* ═══════════════════════════════════════════════════════════════════
   YILDIZ HANEDANI · diplomacy.js — DİPLOMASİ VE ENTRİKA
   Onur/Güven endeksi, Casus Belli, savaş ilanı, ittifaklar, casusluk,
   fraksiyonlar, federasyon, Galaktik Konsey.
   ═══════════════════════════════════════════════════════════════════ */


/* ---------- SINIRLAR / ETKİ ALANI ----------
   Her sistemin bir "erişim" yarıçapı var: koloni nüfusu, kaleler ve
   teknoloji büyüttükçe sınırlar genişler. Bölgeler haritada renkle ayrılır. */
function borderReach(sys){
  if (sys.owner < 0) return 0;
  const e = G.emps[sys.owner];
  if (!e || e.dead) return 0;
  let r = 210;                                   // taban etki
  for (const p of sys.planets){
    if (!p.col) continue;
    r += 26 * Math.sqrt(p.col.pop);              // nüfus sınırı iter
    r += (p.col.b.kale||0) * 55;                 // kaleler alanı genişletir
    r += (p.col.b.liman||0) * 22;
    if (focusOf(p.col).e.defFlat) r += 45;       // garnizon odağı
  }
  if (e.home === sys.id) r += 130;               // başkent güçlü yayılır
  r *= 1 + (e.mods.sensor||0) * .10;
  if (hasCivic(e,'fortress')) r *= 1.18;
  if (hasCivic(e,'panopt'))   r *= 1.10;
  return r;
}
/* Sınır baskısı: filo gücü ve koloni sayısı yüksek imparatorluklar
   rakiplerinin etki alanını geriye iter. Ancak bir sistemin kendi
   yakın çevresi (çekirdek) asla itilemez — kolonilerin güvendedir. */
const CORE_RADIUS = 165;
function borderPressure(e){
  if (!e || e.dead) return 1;
  if (e._press !== undefined && e._pressAt === G.day) return e._press;
  const pow = totalPower(e);
  const p = clamp(.78 + Math.log(1 + pow/1800) * .17 + e.colonies.length * .011, .70, 1.55);
  e._press = p; e._pressAt = G.day;
  return p;
}
function influenceAt(wx, wy){
  let best = -1, bestScore = Infinity;
  for (const s of G.sys){
    if (s.owner < 0) continue;
    const reach = s._reach || 0;
    if (!reach) continue;
    const dx = s.x - wx, dy = s.y - wy;
    const d2 = dx*dx + dy*dy;
    if (d2 > reach*reach) continue;
    const d = Math.sqrt(d2);
    // çekirdek bölge: sistemin hemen çevresi tartışmasız sahibinindir
    if (d < CORE_RADIUS) return s.owner;
    const score = (d / reach) / borderPressure(G.emps[s.owner]);
    if (score < bestScore){ bestScore = score; best = s.owner; }
  }
  return best;
}
function refreshReach(){
  for (const s of G.sys) s._reach = borderReach(s);
}
/* sahipsiz bir sistem kimin sınırları içinde kalıyor? */
function claimOf(sys){
  if (sys.owner >= 0) return sys.owner;
  return influenceAt(sys.x, sys.y);
}

/* ---------- SINIR SÜRTÜŞMESİ ----------
   Sınırları birbirine değen imparatorluklar arasında ilişki yavaşça
   aşınır. Uzun süren sürtüşme olaylara ve savaşa zemin hazırlar. */
function borderContacts(){
  // her imparatorluk çifti için "temas uzunluğu" (kaba örnekleme)
  const N = 46, cw = G.W/N, ch = G.H/N;
  const own = new Int16Array(N*N).fill(-1);
  const best = new Float32Array(N*N).fill(2);
  for (const s of G.sys){
    if (s.owner < 0 || !s._reach) continue;
    const r = s._reach;
    const x0 = Math.max(0, Math.floor((s.x-r)/cw)), x1 = Math.min(N-1, Math.ceil((s.x+r)/cw));
    const y0 = Math.max(0, Math.floor((s.y-r)/ch)), y1 = Math.min(N-1, Math.ceil((s.y+r)/ch));
    for (let y=y0;y<=y1;y++) for (let x=x0;x<=x1;x++){
      const dx = s.x-(x+.5)*cw, dy = s.y-(y+.5)*ch;
      const d = Math.sqrt(dx*dx+dy*dy);
      if (d > r) continue;
      const sc = d/r, i = y*N+x;
      if (own[i] < 0 || sc < best[i]){ own[i] = s.owner; best[i] = sc; }
    }
  }
  const pairs = {};
  for (let y=0;y<N;y++) for (let x=0;x<N-1;x++){
    const a = own[y*N+x], b = own[y*N+x+1];
    if (a >= 0 && b >= 0 && a !== b){
      const k = a < b ? a+'_'+b : b+'_'+a;
      pairs[k] = (pairs[k]||0) + 1;
    }
  }
  for (let y=0;y<N-1;y++) for (let x=0;x<N;x++){
    const a = own[y*N+x], b = own[(y+1)*N+x];
    if (a >= 0 && b >= 0 && a !== b){
      const k = a < b ? a+'_'+b : b+'_'+a;
      pairs[k] = (pairs[k]||0) + 1;
    }
  }
  return pairs;
}

function borderFriction(){
  refreshReach();
  const pairs = borderContacts();
  G.friction = G.friction || {};
  const seen = {};
  for (const k in pairs){
    const [a, b] = k.split('_').map(Number);
    const ea = G.emps[a], eb = G.emps[b];
    if (!ea || !eb || ea.dead || eb.dead) continue;
    if (ea.ally[b]) continue;                       // müttefikler sürtüşmez
    if (hasCivic(ea,'outpost') || hasCivic(eb,'outpost')) continue;
    if ((ea.treaty && ea.treaty[b]) || (eb.treaty && eb.treaty[a])) continue;
    seen[k] = true;
    const len = pairs[k];
    G.friction[k] = (G.friction[k] || 0) + 1;       // kaç aydır temas
    const wear = -clamp(.15 + len * .045, .15, 1.1);
    ea.rel[b] = clamp(ea.rel[b] + wear, -100, 100);
    eb.rel[a] = clamp(eb.rel[a] + wear, -100, 100);

    // uzun süren sürtüşme → olay
    if (!ea.war[b] && G.friction[k] > 10 && rnd() < .06){
      if (a === 0 || b === 0){
        const other = (a === 0) ? eb : ea;
        UI.borderEvent(other, len);
      } else if (rnd() < .25){
        // iki AI arasında: gerginlik savaşa dönebilir
        if (ea.rel[b] < -55 && totalPower(ea) > totalPower(eb)*1.15) declareWar(ea, eb);
      }
    }
  }
  // teması kesilen çiftlerin sayacı sıfırlansın
  for (const k in G.friction) if (!seen[k]) G.friction[k] = 0;
}

/* ---------- diplomasi ---------- */
function declareWar(a, b){
  if (a.war[b.id]) return false;
  if (hasCivic(a,'shadow')){
    if (a.id === 0) say('Gölge Konseyi resmî savaş ilan etmez — operasyonları kullan', 'war');
    return false;
  }
  if (hasCivic(a,'universal')){
    if (a.id === 0) say('Evrensel Barış doktrini savaş ilanını yasaklar', 'war');
    return false;
  }
  // Galaktik Konsey savaş yasağı — çiğnemek ağır bedel
  if (typeof councilBlocksWar === 'function' && councilBlocksWar(a, b)){
    if (a.id === 0){
      say('KONSEY YASAĞI: ' + b.name + ' korunuyor. Yine de saldırırsan konsey sana döner.', 'war');
      // oyuncu bilinçli çiğneyebilsin diye engellemiyoruz, cezalandırıyoruz
      a.war[b.id] = true; b.war[a.id] = true;
  a.warSince = a.warSince || {}; b.warSince = b.warSince || {};
  a.warSince[b.id] = G.day; b.warSince[a.id] = G.day;   // FAZ 48
      councilPunish(a);
      return true;
    }
    if (rnd() < .75) return false;                 // AI genelde uyar
    councilPunish(a);
  }
  if (!canDeclareWarOn(a,b)){
    if (a.id === 0) say(b.name + ' kendini galaksiden soyutlamış — savaş ilan edilemiyor');
    return false;
  }
  if (hasCivic(a,'warFury')){ a.furyUntil = G.day + 24*30; recalcMods(a); }
  if (hasCivic(a,'mobilize')){
    a.extra = a.extra || {};
    a.extra.dmgMul = (a.extra.dmgMul||0) + .30;
    recalcMods(a);
    if (a.id === 0) say('Sonsuz Seferberlik: filolarına kalıcı +%30 güç eklendi', 'win');
  }
  /* ── HAFIZA ── mağdur bunu unutmaz; söz çiğnemek galaksiye yayılır */
  const wasAlly = a.ally[b.id] && b.ally[a.id];
  const hadNap  = !!(a.nap && a.nap[b.id] > G.day);
  remember(b, a.id, wasAlly ? 'ihanet' : hadNap ? 'paktBozdu' : 'savasIlan');
  if (wasAlly || hadNap){
    for (const x of G.emps){
      if (x.dead || x.wild || x.id === a.id || x.id === b.id) continue;
      remember(x, a.id, 'paktBozdu');
      x.rel[a.id] = clamp(x.rel[a.id] - 14, -100, 100);
    }
    if (a.id === 0) say('İHANET — tüm galaksi bunu gördü, itibarın çöktü', 'war');
    else if (b.id === 0) say(a.name + ' verdiği sözü çiğnedi!', 'war');
  }
  const _cb = a._lastCB; a._lastCB = null;
  a.warCause = a.warCause || {};
  if (_cb){
    a.warCause[b.id] = _cb.n;
    if (b.id === 0) say('Gerekçeleri: "' + _cb.n + '"', 'war');
  }

  a.war[b.id] = true; b.war[a.id] = true;
  a.warSince = a.warSince || {}; b.warSince = b.warSince || {};
  a.warSince[b.id] = G.day; b.warSince[a.id] = G.day;   // FAZ 48
  breakPact(a, b);
  a.warStart = a.warStart || {}; b.warStart = b.warStart || {};
  a.warStart[b.id] = G.day; b.warStart[a.id] = G.day;
  a.ally[b.id] = false; b.ally[a.id] = false;
  a.rel[b.id] = Math.min(a.rel[b.id], -60);
  b.rel[a.id] = Math.min(b.rel[a.id], -60);
  if (hasPerk(b,'condemn')){
    for (const x of G.emps){
      if (x.dead || x.wild || x.id === a.id) continue;
      x.rel[a.id] = clamp(x.rel[a.id] - 20, -100, 100);
      a.rel[x.id] = clamp(a.rel[x.id] - 8, -100, 100);
    }
    if (b.id === 0) say('Galaktik Kınama: ' + a.name + ' tüm galakside itibar kaybetti', 'win');
  }
  if (typeof facEvent === 'function'){ facEvent(a,'war'); facEvent(b,'war'); }
  if (a.id === 0 || b.id === 0){
    const foe = (a.id === 0) ? b : a;
    const byThem = (b.id === 0);
    say('SAVAŞ İLAN EDİLDİ — ' + foe.name, 'war');
    if (byThem && UI && UI.warDeclared) UI.warDeclared(foe);
  }
  if (typeof fedDefend === 'function') fedDefend(a, b);
  if (typeof overlordDefend === 'function') overlordDefend(a, b);
  if (typeof judgeCasusBelli === 'function') judgeCasusBelli(a, b);
  return true;
}
function peaceAlwaysAccepted(a, b){
  return hasPerk(a,'peaceAlways') || hasPerk(b,'peaceAlways');
}
function canPeace(a, b){
  return !hasCivic(a,'blood') && !hasCivic(b,'blood') &&
         !hasCivic(a,'exile') && !hasCivic(b,'exile');
}
function canAlly(a, b){
  return !hasCivic(a,'exile') && !hasCivic(b,'exile');
}
function canDeclareWarOn(a, b){
  if (hasCivic(b,'exile')) return false;          // sürgüne kimse savaş açamaz
  if (!a || !a.ai) return true;                   // oyuncu kendi kararını verir
  if (G._dealAuth) return true;                   // anlaşmada verilmiş söz
  /* ESKİ GÜÇ MANTIĞI DEVRE DIŞI: aiTurn içindeki "ondan güçlüysem
     saldırırım" bloğu ve borderFriction'ın kendiliğinden savaşı artık
     buradan geçemez. AI savaşları YALNIZCA aiWarReview() üzerinden,
     yani hafıza ve Casus Belli değerlendirmesiyle açılır. */
  return G._warAuth === (a.id + '>' + b.id);
}
/* Bir tarafın "senin için" girdiği vekil savaşlar, asıl savaş bitince
   kendiliğinden sona erer. Aksi hâlde müttefikin savaşta kalıp kalıyordu. */
function resolveProxyWars(a, b){
  for (const x of G.emps){
    if (x.dead || x.wild || !x.proxyWar) continue;
    // x, a adına b ile savaşa girmişti mi?
    if (x.proxyWar[b.id] === a.id && x.war[b.id]){
      x.war[b.id] = false; b.war[x.id] = false;
      x.peaceAt = x.peaceAt || {}; b.peaceAt = b.peaceAt || {};
      x.peaceAt[b.id] = G.day; b.peaceAt[x.id] = G.day;
      delete x.proxyWar[b.id];
      if (x.id === 0 || b.id === 0)
        say('Vekil savaş sona erdi — ' + (x.id===0 ? b.name : x.name) + ' ile barış', 'win');
    }
    // x, b adına a ile savaşa girmişti mi?
    if (x.proxyWar[a.id] === b.id && x.war[a.id]){
      x.war[a.id] = false; a.war[x.id] = false;
      x.peaceAt = x.peaceAt || {}; a.peaceAt = a.peaceAt || {};
      x.peaceAt[a.id] = G.day; a.peaceAt[x.id] = G.day;
      delete x.proxyWar[a.id];
      if (x.id === 0 || a.id === 0)
        say('Vekil savaş sona erdi — ' + (x.id===0 ? a.name : x.name) + ' ile barış', 'win');
    }
  }
}
function makePeace(a, b){
  if (!canPeace(a,b)) return false;
  a.war[b.id] = false; b.war[a.id] = false;
  if (a.proxyWar) delete a.proxyWar[b.id];
  if (b.proxyWar) delete b.proxyWar[a.id];
  a.peaceAt = a.peaceAt || {}; b.peaceAt = b.peaceAt || {};
  a.peaceAt[b.id] = G.day; b.peaceAt[a.id] = G.day;
  /* FAZ 18: BAĞIMSIZLIK SAVAŞI BEYAZ BARIŞLA BİTERSE
     vasal özgür kalır ve bir süre yeniden boyunduruk altına
     alınamaz — kazanılmış bağımsızlık kolay geri alınmasın. */
  const bagimsizlik = (a.warCause && a.warCause[b.id] === 'Bağımsızlık Savaşı') ||
                      (b.warCause && b.warCause[a.id] === 'Bağımsızlık Savaşı');
  if (bagimsizlik){
    const isyanci = (a.warCause && a.warCause[b.id] === 'Bağımsızlık Savaşı') ? a : b;
    const eskiLord = (isyanci === a) ? b : a;
    if (isyanci.overlord === eskiLord.id) freeVassal(isyanci, 'barış');
    isyanci.freeUntil = (G.memAge || 0) + 60;      // 5 yıl dokunulmazlık
    if (isyanci.id === 0) say('BAĞIMSIZLIĞIN TANINDI — artık kimsenin vasalı değilsin', 'win');
    else if (eskiLord.id === 0) say(isyanci.name + ' bağımsızlığını kazandı', 'war');
    else say(isyanci.name + ', ' + eskiLord.name + ' boyunduruğundan kurtuldu');
  }
  if (a.warCause) delete a.warCause[b.id];
  if (b.warCause) delete b.warCause[a.id];
  remember(a, b.id, 'barisImzala');
  remember(b, a.id, 'barisImzala');
  resolveProxyWars(a, b);
  if (typeof facEvent === 'function'){ facEvent(a,'peace'); facEvent(b,'peace'); }
  a.rel[b.id] = Math.max(a.rel[b.id], -10);
  b.rel[a.id] = Math.max(b.rel[a.id], -10);
  if (a.id === 0 || b.id === 0) say('Barış imzalandı — ' + (a.id===0?b.name:a.name), 'win');
  return true;
}
/* ---------- ELÇİLER ----------
   Etki biriktirip zar atmak yerine elçi atarsın. Elçi orada durdukça
   ilişki her ay artar. Elçi sayısı sınırlıdır — kimi kazanacağını seç. */
function envoyCap(e){
  let n = 2;
  if (e.mods.dipMul > .25) n++;
  if (e.mods.dipMul > .60) n++;
  if (hasCivic(e,'allyCheap')) n++;
  for (const c of e.colonies){
    const pl = G.sys[c.s].planets[c.p];
    if (pl.col && pl.col.b.arsiv) { n++; break; }
  }
  return n;
}
function envoysUsed(e){
  let n = 0;
  for (const k in (e.envoy||{})) if (e.envoy[k]) n++;
  return n;
}
function assignEnvoy(e, id){
  e.envoy = e.envoy || {};
  if (e.envoy[id]) { e.envoy[id] = false; return true; }   // geri çek
  if (envoysUsed(e) >= envoyCap(e)) return false;
  e.envoy[id] = true;
  return true;
}
function envoyTick(){
  for (const e of G.emps){
    if (e.dead || e.wild || !e.envoy) continue;
    for (const k in e.envoy){
      if (!e.envoy[k]) continue;
      const o = G.emps[k];
      if (!o || o.dead || o.wild) { e.envoy[k] = false; continue; }
      // savaşta elçi çalışmaz
      if (e.war[o.id]) continue;
      /* FAZ 30: Elçi ayda +2.2 ile kutuplaşmayı tek başına eziyordu
         (ölçüm: 12 turda +11.71). Artık ilişki iyileştikçe getirisi
         azalıyor — diplomasi sonsuz dostluk üretmiyor, sadece
         düşmanlığı yumuşatıyor. */
      const mevcut = e.rel[o.id] || 0;
      /* Doygunluk: ilişki +40'ta yarıya, +70'te sıfıra yaklaşır.
         Diplomasi düşmanlığı yumuşatır ama sonsuz dostluk üretmez. */
      const doygun = clamp(1 - Math.max(0, mevcut) / 55, .05, 1);
      const gain = 2.2 * (1 + e.mods.dipMul) * doygun;
      e.rel[o.id] = clamp(e.rel[o.id] + gain, -100, 100);
      o.rel[e.id] = clamp(o.rel[e.id] + gain * .6, -100, 100);
    }
  }
}
/* ortak düşman varsa anlaşmalar çok daha kolay */
function sharedFoe(a, b){
  for (const x of G.emps){
    if (x.dead || x.wild || x.id === a.id || x.id === b.id) continue;
    if (a.war[x.id] && b.war[x.id]) return true;
  }
  return false;
}

/* ticaret anlaşması */
function canPact(a, b){
  if (!a || !b || a.dead || b.dead) return false;
  if (a.war[b.id]) return false;
  if (hasCivic(a,'exile') || hasCivic(b,'exile')) return false;
  return true;
}
function makePact(a, b){
  if (!canPact(a,b)) return false;
  a.pact = a.pact || {}; b.pact = b.pact || {};
  a.pact[b.id] = true; b.pact[a.id] = true;
  a.rel[b.id] = clamp(a.rel[b.id] + 15, -100, 100);
  b.rel[a.id] = clamp(b.rel[a.id] + 15, -100, 100);
  return true;
}
function breakPact(a, b){
  if (a.pact) a.pact[b.id] = false;
  if (b.pact) b.pact[a.id] = false;
}
/* =====================================================================
   MÜZAKERE MASASI — teklif / değerlendirme / karşı teklif
   ===================================================================== */

/* Masaya konabilecek öğe türleri. Her biri iki tarafa da konabilir. */
const DEAL_KINDS = {
  res    :{n:'Kaynak',            ico:'◆'},
  tribute:{n:'Aylık Ödeme (10 yıl)',ico:'⏳'},
  sys    :{n:'Yıldız Sistemi',    ico:'★'},
  tech   :{n:'Teknoloji',         ico:'✦'},
  lux    :{n:'Lüks Mal Erişimi',  ico:'❖'},
  peace  :{n:'Barış',             ico:'🕊'},
  nap    :{n:'Saldırmazlık Paktı',ico:'🛡'},
  pact   :{n:'Ticaret Anlaşması', ico:'🤝'},
  ally   :{n:'İttifak',           ico:'⚑'},
  warOn  :{n:'Üçüncü Tarafa Savaş',ico:'⚔'},
  peaceWith:{n:'Üçüncü Tarafla Barış',ico:'🤲'},
  intel  :{n:'İstihbarat Paylaşımı',ico:'👁'},
  passage:{n:'Sınır Geçiş İzni',ico:'🚪'}
};

function dealLabel(it){
  switch(it.t){
    case 'res':     return RES[it.r].ico + ' ' + it.v + ' ' + RES[it.r].n;
    case 'tribute': return '⏳ ' + it.v + ' ' + RES[it.r].n + '/ay · 10 yıl';
    case 'sys':     return '★ ' + (G.sys[it.id] ? G.sys[it.id].name : '?') + ' sistemi';
    case 'tech':    return '✦ ' + (TECHS[it.id] ? TECHS[it.id].n : '?');
    case 'lux':     return (LUXURY[it.k] ? LUXURY[it.k].ico + ' ' + LUXURY[it.k].n : '❖') + ' erişimi';
    case 'peace':   return '🕊 Barış';
    case 'nap':     return '🛡 Saldırmazlık paktı';
    case 'pact':    return '🤝 Ticaret anlaşması';
    case 'ally':    return '⚑ İttifak';
    case 'warOn':   return '⚔ ' + (G.emps[it.target] ? G.emps[it.target].name : '?') + '\'a savaş ilanı';
    case 'peaceWith': return '🤲 ' + (G.emps[it.target] ? G.emps[it.target].name : '?') + ' ile barış';
    case 'intel':   return '👁 İstihbarat paylaşımı';
    case 'passage': return '🚪 Sınır geçiş izni';
  }
  return '?';
}

/* --------------------------------------------------------------------
   DEĞERLENDİRME — bir öğe "alan" taraf için ne kadar kıymetli?
   Değerler kabaca "etki puanı" biriminde tutulur.
   -------------------------------------------------------------------- */
function itemValue(e, it, other){
  const need = k => {
    // kaynağı ne kadar acil istiyor? (stok ve gelir düşükse kıymetli)
    const stock = e.res[k] || 0, inc = (e.inc && e.inc[k]) || 0;
    let m = 1;
    if (stock < 300) m += .6;
    if (inc < 0) m += .8;
    else if (inc < 5) m += .3;
    return m;
  };
  switch(it.t){
    case 'res':     return it.v * .38 * need(it.r);
    case 'tribute': return it.v * 16 * need(it.r);         // 10 yıllık akış
    case 'sys': {
      const sy = G.sys[it.id];
      if (!sy) return 0;
      let v = 55;
      for (const p of sy.planets){
        if (p.col) v += 45 + p.col.pop * 4;
        if (p.lux) v += 60;
        if (habOf(e, p) >= 50) v += 25;
      }
      // kendi sınırına yakınsa daha kıymetli
      if (claimOf(sy) === e.id) v *= 1.4;
      return v;
    }
    case 'tech': {
      const t = TECHS[it.id];
      if (!t || e.techs[it.id]) return 0;
      const ready = (t.r||[]).every(r => e.techs[r]);
      return (t.c * .07) * (ready ? 1 : .45);
    }
    case 'lux': {
      if (!LUXURY[it.k]) return 0;
      return (e.luxury && e.luxury[it.k]) ? 8 : 95;
    }
    case 'peace': {
      if (!e.war[other.id]) return 0;
      const ratio = totalPower(e) / (totalPower(other) + 1);
      let v = clamp(240 / Math.max(.35, ratio), 40, 700);
      // savaş yorgunluğu barışı çok daha kıymetli yapar
      if (typeof exhOf === 'function') v += exhOf(e, other.id) * 4.5;
      // karşı taraf savaş hedefine ulaştıysa barış onun için ucuzlar
      if (typeof warLeverage === 'function') v = Math.max(20, v - warLeverage(other, e.id) * .6);
      return v;
    }
    case 'nap':   return e.war[other.id] ? 0 : 60 + (e.rel[other.id] < 0 ? 40 : 0);
    case 'pact': {
      if (e.pact && e.pact[other.id]) return 0;
      const theirLux = ownLuxury(other);
      let v = 55;
      for (const k in theirLux) if (!(e.luxOwn && e.luxOwn[k])) v += 45;
      return v;
    }
    case 'ally': {
      if (e.ally[other.id]) return 0;
      const rel = e.rel[other.id];
      let v = 40 + rel * 1.6;
      if (sharedFoe(e, other)) v += 160;
      if (RACES[e.race].dip <= .05) v = -120;      // kovan ittifakı sevmez
      return v;
    }
    case 'warOn': {
      const tgt = G.emps[it.target];
      if (!tgt || tgt.dead || e.war[tgt.id]) return 0;
      // düşmanına saldıracaksa değerli, dostuna saldıracaksa maliyet
      let v = -140;
      if (e.rel[tgt.id] < -40) v = 90;
      if (e.ally[tgt.id]) v = -400;
      return v;
    }
    case 'peaceWith': {
      const t = G.emps[it.target];
      if (!t || t.dead || !e.war[t.id]) return 0;
      const ratio = totalPower(e) / (totalPower(t) + 1);
      // kaybediyorsa barış kıymetli, kazanıyorsa fedakârlık
      return ratio < 1 ? clamp(180 / Math.max(.35, ratio), 40, 500) : -90 * (ratio - 1);
    }
    case 'passage': {
      // sınırını açmak risklidir: güçlü komşuya izin vermek pahalı
      if (e.passage && e.passage[other.id]) return 0;
      const ratio = totalPower(other) / (totalPower(e) + 1);
      return -60 * clamp(ratio, .4, 2.5);
    }
    case 'intel': return 45;
  }
  return 0;
}

/* teklifin AI gözünden net değeri */
function evalOffer(ai, offer){
  const other = G.emps[offer.from];
  let gain = 0, cost = 0;
  for (const it of offer.give) gain += itemValue(ai, it, other);
  for (const it of offer.want) cost += itemValue(ai, it, other);
  // ilişki ve kişilik teklifi renklendirir
  const rel = ai.rel[other.id] || 0;
  const prof = ai.ai ? aiProfile(ai) : {dip:.5, war:.5};
  const trust = 1 + rel / 220 + (prof.dip - .5) * .18;
  const greed = 1 + (prof.war - .5) * .22;          // savaşçı AI daha çok ister
  return {gain: gain * trust, cost: cost * greed, net: gain * trust - cost * greed};
}

/* teklifin uygulanabilirliği — taraflar sözünü tutabiliyor mu? */
function canDeliver(e, items, other){
  for (const it of items){
    switch(it.t){
      case 'res':     if ((e.res[it.r]||0) < it.v) return false; break;
      case 'tribute': {
        const inc = (e.inc && e.inc[it.r]) || 0;
        const stock = e.res[it.r] || 0;
        // ya düzenli gelirin yeter, ya da en az 2 yıllık stokun vardır
        if (inc < it.v * .5 && stock < it.v * 24) return false;
        break;
      }
      case 'sys': {
        const sy = G.sys[it.id];
        if (!sy || sy.owner !== e.id) return false;
        if (e.home === it.id) return false;                 // başkent verilemez
        break;
      }
      case 'tech':  if (!e.techs[it.id]) return false; break;
      case 'lux':   if (!(e.luxOwn && e.luxOwn[it.k])) return false; break;
      case 'peace': if (!e.war[other.id]) return false; break;
      case 'ally':  if (!canAlly(e, other)) return false; break;
      case 'pact':  if (!canPact(e, other)) return false; break;
      case 'warOn': {
        const t = G.emps[it.target];
        if (!t || t.dead || !canDeclareWarOn(e, t)) return false;
        if (hasCivic(e,'shadow')) return false;
        break;
      }
      case 'peaceWith': {
        const t = G.emps[it.target];
        if (!t || t.dead || !e.war[t.id] || !canPeace(e, t)) return false;
        break;
      }
    }
  }
  return true;
}

/* --------------------------------------------------------------------
   UYGULAMA — anlaşma kabul edilince maddeleri yürürlüğe koy
   -------------------------------------------------------------------- */
function applyItems(giver, taker, items){
  for (const it of items){
    switch(it.t){
      case 'res':
        giver.res[it.r] = Math.max(0, (giver.res[it.r]||0) - it.v);
        taker.res[it.r] = (taker.res[it.r]||0) + it.v;
        break;
      case 'tribute':
        giver.tribute = giver.tribute || [];
        taker.tribute = taker.tribute || [];
        giver.tribute.push({to: taker.id, r: it.r, v: it.v, until: G.day + 3600});
        break;
      case 'sys': {
        const sy = G.sys[it.id];
        if (sy && sy.owner === giver.id) captureSystem(sy, taker.id);
        break;
      }
      case 'tech':
        if (giver.techs[it.id]){
          taker.techs[it.id] = true; recalcMods(taker);
          remember(taker, giver.id, 'teknolojiVer');
        }
        break;
      case 'lux':
        taker.luxGrant = taker.luxGrant || {};
        taker.luxGrant[it.k] = giver.id;
        break;
      case 'peace': makePeace(giver, taker); break;
      case 'nap':
        giver.nap = giver.nap || {}; taker.nap = taker.nap || {};
        giver.nap[taker.id] = G.day + 3600; taker.nap[giver.id] = G.day + 3600;
        break;
      case 'pact':
        makePact(giver, taker);
        remember(taker, giver.id, 'ticaretActi');
        remember(giver, taker.id, 'ticaretActi');
        break;
      case 'ally':
        // ittifak savaşı sona erdirir — aksi hâlde müttefikler savaşta kalıyordu
        if (giver.war[taker.id] || taker.war[giver.id]){
          giver.war[taker.id] = false; taker.war[giver.id] = false;
          giver.peaceAt = giver.peaceAt || {}; taker.peaceAt = taker.peaceAt || {};
          giver.peaceAt[taker.id] = G.day; taker.peaceAt[giver.id] = G.day;
          if (typeof resolveProxyWars === 'function') resolveProxyWars(giver, taker);
        }
        giver.ally[taker.id] = true; taker.ally[giver.id] = true;
        giver.rel[taker.id] = Math.max(giver.rel[taker.id], 55);
        taker.rel[giver.id] = Math.max(taker.rel[giver.id], 55);
        break;
      case 'warOn': {
        const t = G.emps[it.target];
        if (t && !t.dead && declareWar(giver, t)){
          // bu savaş "taker adına" açıldı: taker barışırsa bu da biter
          giver.proxyWar = giver.proxyWar || {};
          giver.proxyWar[t.id] = taker.id;
        }
        break;
      }
      case 'peaceWith': {
        const t = G.emps[it.target];
        if (t && !t.dead && giver.war[t.id]) makePeace(giver, t);
        break;
      }
      case 'intel':
        taker.intel = taker.intel || {};
        taker.intel[giver.id] = Math.max(taker.intel[giver.id] || 0, 2);
        /* ═══ FAZ 48: PAYLAŞILAN GÖRÜŞ (SHARED VISION) ═══
           Pakt kalıcı bir bağ kurar: veren tarafın keşifleri ve
           görüş alanı her ay alıcıya kopyalanır (visionTick).
           Anında bir kez de uygulanır ki oyuncu farkı görsün. */
        taker.visionFrom = taker.visionFrom || {};
        taker.visionFrom[giver.id] = true;
        if (typeof shareVision === 'function') shareVision(giver, taker);
        break;
      case 'passage':
        // veren taraf kendi sınırını alana açar
        giver.passage = giver.passage || {};
        giver.passage[taker.id] = true;
        break;
    }
  }
}

function executeDeal(offer){
  const a = G.emps[offer.from], b = G.emps[offer.to];
  if (!a || !b) return false;
  if (!canDeliver(a, offer.give, b) || !canDeliver(b, offer.want, a)) return false;
  G._dealAuth = true;
  try {
    applyItems(a, b, offer.give);
    applyItems(b, a, offer.want);
  } finally { G._dealAuth = false; }
  a.rel[b.id] = clamp(a.rel[b.id] + 6, -100, 100);
  b.rel[a.id] = clamp(b.rel[a.id] + 6, -100, 100);
  recalcMods(a); recalcMods(b);
  return true;
}

/* =====================================================================
   FEDERASYON VE KONSEY
   ===================================================================== */
const FED_LAWS = {
  savunma :{n:'Savunma Paktı', ico:'🛡',
    d:'Bir üyeye savaş açılırsa tüm üyeler otomatik savaşa girer.'},
  arastirma:{n:'Ortak Araştırma Fonu', ico:'🔬',
    d:'Üyeler araştırma çıktısının %10\'unu paylaşır.'},
  ticaret :{n:'Ticaret Birliği', ico:'🤝',
    d:'Üye limanları otomatik olarak birbirine bağlanır.'},
  filo    :{n:'Ortak Filo', ico:'⚑',
    d:'Üyeler ayda 4 alaşım bağışlar; federasyon savunma filosu büyür.'}
};

function findFed(e){
  if (!G.feds) return null;
  return G.feds.find(f => f.members.includes(e.id)) || null;
}
function fedOf(id){
  if (!G.feds) return null;
  return G.feds.find(f => f.id === id) || null;
}
function fedName(rnd2){
  const a = ['Yıldız','Kuzey','Kadim','Özgür','Birleşik','Altın','Sonsuz'];
  const b = ['Anlaşması','Birliği','Konseyi','Sözleşmesi','Paktı'];
  return a[Math.floor((rnd2||rnd)()*a.length)] + ' ' + b[Math.floor((rnd2||rnd)()*b.length)];
}

/* Oyuncu/AI kendi federasyonunu kurabilir: müttefikleri davet eder,
   üyeler otomatik birbirine müttefik olur. Etki maliyeti vardır. */
function fedFoundCost(e){
  return hasCivic(e,'council') ? 130 : 220;
}
function canFoundFed(e){
  if (findFed(e)) return {ok:false, why:'Zaten bir federasyonun var.'};
  if (hasCivic(e,'exile')) return {ok:false, why:'Sürgün doktrini federasyonu yasaklar.'};
  const allies = G.emps.filter(o => !o.dead && !o.wild && o.id !== e.id &&
                                    e.ally[o.id] && !findFed(o));
  if (allies.length < 2)
    return {ok:false, why:'En az 2 bağımsız müttefik gerekir (şu an ' + allies.length + ').'};
  const cost = fedFoundCost(e);
  if ((e.res.etk||0) < cost) return {ok:false, why:cost + ' etki gerekir.', cost, allies};
  return {ok:true, allies, cost};
}
function foundFederation(e){
  const chk = canFoundFed(e);
  if (!chk.ok) return chk;
  e.res.etk -= chk.cost;
  const members = [e.id].concat(chk.allies.map(o=>o.id));
  for (const a of members) for (const b of members){
    if (a === b) continue;
    G.emps[a].ally[b] = true;
    G.emps[a].war[b] = false;
    G.emps[a].rel[b] = Math.max(G.emps[a].rel[b], 55);
  }
  G.feds = G.feds || [];
  const f = {id:(G.fedUid = (G.fedUid||0)+1), name: fedName(), members,
             laws:{}, treasury:0, nextVote: G.day + 60, vote:null, founder: e.id};
  G.feds.push(f);
  if (e.id === 0) say('FEDERASYON KURULDU — ' + f.name, 'win');
  if (typeof facEvent === 'function') facEvent(e, 'ally');
  return {ok:true, fed:f};
}

/* ittifak ağından federasyon oluştur */
function updateFederations(){
  G.feds = G.feds || [];
  // dağılmış federasyonları temizle
  for (let i = G.feds.length - 1; i >= 0; i--){
    const f = G.feds[i];
    f.members = f.members.filter(id => G.emps[id] && !G.emps[id].dead);
    // ittifakı kopan veya üyelerle savaşa giren üye federasyondan düşer
    let changed = true;
    while (changed && f.members.length){
      changed = false;
      for (let k = f.members.length - 1; k >= 0; k--){
        const id = f.members[k];
        const me = G.emps[id];
        const others = f.members.filter(x => x !== id);
        // en az bir üyeyle ittifakı sürüyorsa ve hiçbir üyeyle savaşta değilse kalır
        const stillBound = others.length > 0 &&
          others.some(x => me.ally[x]) &&
          others.every(x => !me.war[x]);
        if (!stillBound){
          f.members.splice(k, 1);
          changed = true;
          if (id === 0) say('Federasyondan ayrıldın — ' + f.name, 'war');
        }
      }
    }
    if (f.members.length < 3){
      if (f.members.includes(0)) say('Federasyon dağıldı — ' + f.name, 'war');
      G.feds.splice(i, 1);
    }
  }
  const inFed = new Set();
  G.feds.forEach(f => f.members.forEach(m => inFed.add(m)));

  /* MEVCUT FEDERASYONA KATILIM: tüm üyelerle karşılıklı ittifakı olan
     dışarıdaki imparatorluk federasyona dahil olur ve o ana kadar
     kabul edilmiş TÜM yasalara tabi olur. */
  for (const f of G.feds){
    for (const o of G.emps){
      if (o.dead || o.wild || inFed.has(o.id)) continue;
      if (hasCivic(o,'exile') || hasCivic(o,'pirateking')) continue;
      const bound = f.members.every(m =>
        G.emps[m] && o.ally[m] && G.emps[m].ally[o.id] && !o.war[m]);
      if (!bound) continue;
      f.members.push(o.id);
      inFed.add(o.id);
      const lawList = Object.keys(f.laws).filter(k => f.laws[k]);
      if (o.id === 0){
        say('FEDERASYONA KATILDIN — ' + f.name +
            (lawList.length ? ' · yürürlükteki yasalar geçerli' : ''), 'win');
      } else if (f.members.includes(0)){
        say(o.name + ' federasyona katıldı' +
            (lawList.length ? ' ve mevcut yasalara tabi oldu' : ''), 'win');
      }
      G.emps.forEach(x=>{ if (!x.dead) recalcMods(x); });
    }
  }

  // 3+ karşılıklı ittifaklı küme ara
  for (const e of G.emps){
    if (e.dead || e.wild || inFed.has(e.id)) continue;
    // merkezî topoloji: kurucunun müttefikleri yeterli (birbirlerine
    // müttefik olmaları şart değil, federasyon onları bir araya getirir)
    const group = [e.id];
    for (const o of G.emps){
      if (o.dead || o.wild || o.id === e.id || inFed.has(o.id)) continue;
      if (!e.ally[o.id] || e.war[o.id]) continue;
      group.push(o.id);
    }
    if (group.length >= 3){
      // federasyona giren üyeler otomatik olarak birbirine müttefik olur
      for (const a of group) for (const b of group){
        if (a === b) continue;
        G.emps[a].ally[b] = true;
        G.emps[a].war[b] = false;
        G.emps[a].rel[b] = Math.max(G.emps[a].rel[b], 45);
      }
      const f = {id: (G.fedUid = (G.fedUid||0)+1), name: fedName(),
                 members: group, laws: {}, treasury: 0, nextVote: G.day + 90,
                 vote: null};
      G.feds.push(f);
      group.forEach(m => inFed.add(m));
      if (group.includes(0)) say('FEDERASYON KURULDU — ' + f.name, 'win');
    }
  }
}

/* GÜVENLİK AĞI: ittifak ve savaş aynı anda var olamaz.
   Herhangi bir yol bu çelişkiyi üretirse ay tikinde temizlenir. */
function fixDiploConflicts(){
  for (const a of G.emps){
    if (a.dead || a.wild) continue;
    for (const b of G.emps){
      if (b.dead || b.wild || b.id === a.id) continue;
      if (a.ally[b.id] && a.war[b.id]){
        // ittifak kazanır: savaş iptal
        a.war[b.id] = false; b.war[a.id] = false;
        a.peaceAt = a.peaceAt || {}; b.peaceAt = b.peaceAt || {};
        a.peaceAt[b.id] = G.day; b.peaceAt[a.id] = G.day;
        if (a.id === 0 || b.id === 0)
          say('İttifak savaşı geçersiz kıldı — ' + (a.id===0?b.name:a.name), 'win');
      }
      // tek yönlü ittifak da düzeltilir
      if (a.ally[b.id] !== b.ally[a.id]){
        const v = a.ally[b.id] && b.ally[a.id];
        a.ally[b.id] = v; b.ally[a.id] = v;
      }
    }
  }
}

/* federasyon yasalarının etkileri */
function fedTick(){
  fixDiploConflicts();
  updateFederations();
  if (!G.feds) return;
  for (const f of G.feds){
    // ortak filo bağışı
    if (f.laws.filo){
      for (const id of f.members){
        const e = G.emps[id];
        if (!e || e.dead) continue;
        const give = Math.min(4, e.res.ala);
        e.res.ala -= give; f.treasury += give;
      }
    }
    // ortak araştırma fonu
    if (f.laws.arastirma){
      let pool = 0;
      for (const id of f.members){
        const e = G.emps[id];
        if (!e || e.dead) continue;
        const cut = (e.inc.ara || 0) * .10;
        pool += cut;
      }
      const share = pool / Math.max(1, f.members.length);
      for (const id of f.members){
        const e = G.emps[id];
        if (e && !e.dead) e.res.ara += share;
      }
    }
    // oylama zamanı
    if (G.day >= f.nextVote){
      f.nextVote = G.day + 180;   // sonraki oylamalar 6 ayda bir
      startFedVote(f);
    }
  }
}

function startFedVote(f){
  const open = Object.keys(FED_LAWS).filter(k => !f.laws[k]);
  if (!open.length) return;
  const law = open[Math.floor(rnd()*open.length)];
  f.vote = {law, yes: [], no: [], done: false};

  // AI üyeler oy verir
  for (const id of f.members){
    const e = G.emps[id];
    if (!e || e.dead || id === 0) continue;
    const prof = aiProfile(e);
    let want = .4;
    if (law === 'savunma')   want += prof.war * .35 + prof.dip * .2;
    if (law === 'arastirma') want += prof.sci * .5;
    if (law === 'ticaret')   want += prof.eco * .5;
    if (law === 'filo')      want += prof.war * .45 - .1;
    (rnd() < want ? f.vote.yes : f.vote.no).push(id);
  }
  if (f.members.includes(0)) UI.fedVote(f);
  else finishFedVote(f);
}

function finishFedVote(f){
  if (!f.vote || f.vote.done) return;
  f.vote.done = true;
  let yes = f.vote.yes.length, no = f.vote.no.length;
  // Konsey Mimarı civic'i oyu iki kat sayar
  for (const id of f.vote.yes) if (hasCivic(G.emps[id], 'council')) yes++;
  for (const id of f.vote.no)  if (hasCivic(G.emps[id], 'council')) no++;
  const passed = yes > no;
  if (passed) f.laws[f.vote.law] = true;
  if (f.members.includes(0)){
    say('Federasyon oylaması: ' + FED_LAWS[f.vote.law].n + ' — ' +
        (passed ? 'KABUL' : 'RED') + ' (' + yes + '/' + (yes+no) + ')', passed ? 'win' : '');
  }
  f.vote = null;
}

/* savunma paktı: bir üyeye savaş açılırsa hepsi girer */
function fedDefend(attacker, victim){
  const f = findFed(victim);
  if (!f || !f.laws.savunma) return;
  for (const id of f.members){
    if (id === victim.id) continue;
    const m = G.emps[id];
    if (!m || m.dead || m.war[attacker.id]) continue;
    if (m.ally[attacker.id]) continue;          // müttefikine savaş açtırmayız
    if (m.id === attacker.id) continue;
    m._lastCB = {n:'Savunma Paktı Yükümlülüğü'};
    warAuthorize(m, attacker, m._lastCB);
    declareWar(m, attacker);
    warAuthClear();
    if (id === 0) say('Federasyon savunma paktı seni savaşa soktu — ' + attacker.name, 'war');
  }
}
/* =====================================================================
   CASUSLUK VE İSTİHBARAT
   ===================================================================== */
const INTEL_LEVELS = [
  {n:'YABANCI',  d:'Sadece adını ve kaç sistemi olduğunu biliyorsun. Filo gücü tahmini çok kaba.'},
  {n:'TANIDIK',  d:'Filo gücünü ±%25 bandında görürsün, koloni sayısını bilirsin.'},
  {n:'İZLENİYOR',d:'Teknolojileri, civic\'leri ve lüks malları görünür. Operasyon yapabilirsin.'},
  {n:'SIZILMIŞ', d:'Savaş planlarını, kaynak durumunu ve hedeflerini görürsün.'}
];

const OPS = {
  calTech :{n:'Teknoloji Çal',      ico:'✦', lvl:2, cost:{etk:60},  risk:.35,
            d:'Rastgele bir teknolojisini kopyalar.'},
  sabotaj :{n:'Tersane Sabotajı',   ico:'💥', lvl:2, cost:{etk:50, ala:120}, risk:.40,
            d:'Bir sistemindeki üretim kuyruğunu ve savunmasını felç eder.'},
  isyan   :{n:'İsyan Kışkırt',      ico:'🔥', lvl:3, cost:{etk:110}, risk:.50,
            d:'Bir kolonisinin istikrarını çökertir.'},
  yalan   :{n:'Sahte İstihbarat',   ico:'🎭', lvl:2, cost:{etk:70},  risk:.25,
            d:'Gücünü olduğundan farklı gösterir; AI kararlarını buna göre alır.'},
  kervan  :{n:'Kervan İstihbaratı', ico:'🚚', lvl:1, cost:{etk:40},  risk:.20,
            d:'Ticaret rotalarını öğrenirsin; yağma şansın belirgin artar.'},

  /* ── FAZ 10: DERİN OPERASYONLAR ──
     Mevcut runOp/intelOf/spyCap altyapısını kullanır; yeni sistem
     kurulmaz. Hepsi stratejik seçim gerektirir, hepsinin bedeli var. */
  hazine  :{n:'Hazine Baskını',     ico:'💰', lvl:2, cost:{etk:55},  risk:.38,
            d:'Hedefin kaynak stoğunun bir kısmını çalar. Zengin düşmanı fakirleştirir.'},
  filoPlan:{n:'Filo Planlarını Çal', ico:'📡', lvl:2, cost:{etk:65},  risk:.30,
            d:'Filolarının konumu ve gücü 5 yıl boyunca sana açık kalır; ' +
              'muharebede ilk atışı sen yaparsın.'},
  suikast :{n:'Suikast',            ico:'🗡', lvl:3, cost:{etk:130}, risk:.58,
            d:'Bir fraksiyon liderini ortadan kaldırır: hedefin iç siyaseti ' +
              'kaosa sürüklenir, istikrar ve etki üretimi çöker.'},
  ambargoKir:{n:'Ambargo Kaçakçılığı', ico:'📦', lvl:1, cost:{etk:45}, risk:.22,
            d:'Sana uygulanan ambargolardan birini 4 yıl boyunca delersin; ' +
              'o hattan ticaret yeniden akar.'},
  sorusturma:{n:'Derin Soruşturma', ico:'🔎', lvl:1, cost:{etk:70}, risk:.10,
            d:'HEDEFİN üstüne yıkılmış bir iftirayı çöz. Gerçek fail ortaya ' +
              'çıkarsa kin ona döner ve hedefle aran düzelir. Kendi açık ' +
              'dosyalarını da aydınlatabilir.'},
  sahteKanit:{n:'Sahte Kanıt Yerleştir', ico:'🎭', lvl:2, cost:{etk:85}, risk:.42,
            d:'Galakside faili meçhul kalmış eski bir operasyonun suçunu HEDEFİN ' +
              'üstüne yık. Mağdur devlet hedefe kin duyar ve savaş nedeni kazanır. ' +
              'İfşa olursa üç devlet birden sana düşman kesilir.'},
  tersaneVir:{n:'Tersane Virüsü',   ico:'🦠', lvl:3, cost:{etk:95, ala:80}, risk:.45,
            d:'Gemi inşa hızını 3 yıl boyunca yarıya düşürür. ' +
              'Savaş öncesi hazırlığı çökertmenin en sessiz yolu.'}
};

function intelOf(e, id){
  if (!e.intel) e.intel = {};
  return clamp(e.intel[id] || 0, 0, 3);
}
function spyCap(e){
  let n = 1;
  if (e.mods.sensor > 0) n++;
  if (hasCivic(e, 'shadow')) n += 2;
  if (hasCivic(e, 'panopt')) n++;
  return n;
}
function spiesUsed(e){
  let n = 0;
  for (const k in (e.spy||{})) if (e.spy[k]) n++;
  return n;
}
function assignSpy(e, id){
  e.spy = e.spy || {};
  if (e.spy[id]){ e.spy[id] = false; return true; }
  if (spiesUsed(e) >= spyCap(e)) return false;
  e.spy[id] = true;
  return true;
}

/* aylık istihbarat ilerlemesi */
function spyTick(){
  for (const e of G.emps){
    if (e.dead || e.wild) continue;
    e.intel = e.intel || {};
    e.intelP = e.intelP || {};
    for (const o of G.emps){
      if (o.dead || o.wild || o.id === e.id) continue;
      let rate = 0;
      if (e.contact[o.id]) rate += .28;                       // temas yavaşça öğretir
      if (e.envoy && e.envoy[o.id]) rate += .35;              // elçi gözlem yapar
      if (e.spy && e.spy[o.id]) rate += 1.5;                  // casus hızlı
      if (hasCivic(e, 'shadow')) rate *= 1.5;
      // karşı istihbarat savunması
      if (hasCivic(o, 'counter')) rate *= .35;
      const sensors = o.mods.sensor || 0;
      rate *= clamp(1 - sensors * .12, .4, 1);
      if (rate <= 0) continue;
      e.intelP[o.id] = (e.intelP[o.id] || 0) + rate;
      const need = 12;
      while (e.intelP[o.id] >= need && intelOf(e, o.id) < 3){
        e.intelP[o.id] -= need;
        e.intel[o.id] = intelOf(e, o.id) + 1;
        if (e.id === 0) say('İstihbarat seviyesi arttı — ' + o.name + ' (' +
                            INTEL_LEVELS[e.intel[o.id]].n + ')', 'sci');
      }
      // casus yakalanma riski
      if (e.spy && e.spy[o.id] && !hasCivic(e, 'shadow') && rnd() < .035){
        e.spy[o.id] = false;
        e.rel[o.id] = clamp(e.rel[o.id] - 25, -100, 100);
        o.rel[e.id] = clamp(o.rel[e.id] - 25, -100, 100);
        remember(o, e.id, 'casusYakalan');
        if (e.id === 0) say('CASUSUN YAKALANDI — ' + o.name + ' (ilişki −25)', 'war');
        else if (o.id === 0) say(e.name + ' casusu yakalandı', 'win');
      }
    }
  }
}

/* görünen güç — istihbarat seviyesine ve sahte bilgiye göre bulanık */
function shownPower(viewer, target){
  const real = totalPower(target);
  /* FAZ 10: Filo Planlarını Çal — çalınmış planlar sahte istihbaratı
     etkisiz kılar ve gerçek gücü kesin olarak gösterir. */
  if (viewer.fleetIntel && viewer.fleetIntel[target.id] > G.day)
    return {v: Math.round(real), exact: true, band: 0};
  const lvl = intelOf(viewer, target.id);
  // hedef bize sahte bilgi yediriyorsa çarpıt
  const fake = target.fakeTo && target.fakeTo[viewer.id];
  const bias = fake ? fake.mul : 1;
  if (lvl >= 3) return {v: Math.round(real * bias), exact: !fake, band: 0};
  const band = lvl === 2 ? .12 : lvl === 1 ? .25 : .6;
  const seed = (target.id * 7919 + viewer.id * 131 + Math.floor(G.day / 90)) % 1000;
  const jitter = ((seed / 1000) - .5) * 2 * band;
  return {v: Math.round(real * bias * (1 + jitter)), exact: false, band};
}
function powerLabel(viewer, target){
  const s = shownPower(viewer, target);
  if (s.exact) return fmt(s.v);
  const lo = Math.round(s.v * (1 - s.band)), hi = Math.round(s.v * (1 + s.band));
  return intelOf(viewer, target.id) === 0 ? '≈' + fmt(s.v) + ' ?' : fmt(lo) + '–' + fmt(hi);
}

/* operasyon yürüt */
function runOp(e, target, key){
  const OP = OPS[key];
  if (!OP) return {ok:false, msg:'Bilinmeyen operasyon'};
  if (intelOf(e, target.id) < OP.lvl)
    return {ok:false, msg:'Yetersiz istihbarat seviyesi (' + INTEL_LEVELS[OP.lvl].n + ' gerekli)'};
  /* FAZ 48: DÜRÜST ekseni casusluğu pahalılaştırır */
  const opKat = 1 + ((e.mods && e.mods.opCost) || 0);
  for (const r in OP.cost) if ((e.res[r]||0) < Math.round(OP.cost[r] * opKat))
    return {ok:false, msg:'Yetersiz kaynak'};
  for (const r in OP.cost) e.res[r] -= Math.round(OP.cost[r] * opKat);  // FAZ 48

  let risk = OP.risk;
  if (hasCivic(e, 'shadow')) risk *= .4;
  if (hasCivic(target, 'counter')) risk = Math.min(.9, risk * 1.8);
  const caught = rnd() < risk;

  let msg = '';
  switch(key){
    case 'calTech': {
      const av = Object.keys(target.techs || {}).filter(t => !e.techs[t] && TECHS[t]);
      if (!av.length){ msg = 'Çalınacak yeni teknoloji bulunamadı.'; break; }
      const id = av[Math.floor(rnd()*av.length)];
      e.techs[id] = true; recalcMods(e);
      msg = TECHS[id].n + ' teknolojisi çalındı!';
      break;
    }
    case 'sabotaj': {
      const owned = G.sys.filter(sy => sy.owner === target.id && (sy.queue.length || sysDefense(sy) > 0));
      if (!owned.length){ msg = 'Sabote edilecek tesis bulunamadı.'; break; }
      const sy = owned[Math.floor(rnd()*owned.length)];
      sy.queue.length = 0;
      for (const p of sy.planets) if (p.col && p.col.b.kale) p.col.b.kale = Math.max(0, p.col.b.kale - 1);
      sy.def = sysDefense(sy);
      msg = sy.name + ' sistemindeki üretim ve savunma felç edildi.';
      break;
    }
    case 'isyan': {
      const cols = target.colonies.filter(c => G.sys[c.s].planets[c.p].col);
      if (!cols.length){ msg = 'Hedef koloni yok.'; break; }
      const c = cols[Math.floor(rnd()*cols.length)];
      const pl = G.sys[c.s].planets[c.p];
      pl.col.stab = clamp(pl.col.stab - 45, 0, 100);
      msg = pl.col.name + ' kolonisinde isyan patladı (istikrar −45).';
      break;
    }
    case 'yalan': {
      e.fakeTo = e.fakeTo || {};
      const mul = rnd() < .5 ? .45 : 1.9;
      e.fakeTo[target.id] = {mul, until: G.day + 720};
      msg = mul < 1 ? 'Zayıf görünüyorsun — saldırıya davetiye çıkardın.'
                    : 'Güçlü görünüyorsun — sana saldırmaya cesaret edemeyecekler.';
      break;
    }
    case 'kervan': {
      e.routeIntel = e.routeIntel || {};
      e.routeIntel[target.id] = G.day + 1080;
      msg = target.name + ' ticaret rotaları haritalandı — yağma şansın arttı.';
      break;
    }

    /* ── FAZ 10 OPERASYONLARI ── */
    case 'hazine': {
      const alinabilir = ['min','ene','ala','ara'];
      let toplam = 0, dokum = [];
      for (const r of alinabilir){
        const stok = target.res[r] || 0;
        if (stok < 60) continue;
        /* Stoğun %12-20'si; hedef ne kadar zenginse o kadar çok */
        const pay = stok * (.12 + rnd() * .08);
        target.res[r] -= pay;
        e.res[r] = (e.res[r] || 0) + pay;
        toplam += pay;
        dokum.push(Math.round(pay) + ' ' + (RES[r] ? RES[r].n : r));
      }
      msg = toplam > 0
        ? 'Hazine basıldı: ' + dokum.join(', ') + ' ele geçirildi.'
        : 'Hazineleri zaten boştu — alacak bir şey yok.';
      break;
    }
    case 'filoPlan': {
      e.fleetIntel = e.fleetIntel || {};
      e.fleetIntel[target.id] = G.day + 1800;      // 5 yıl
      msg = target.name + ' filo planları ele geçirildi — konumları ve ' +
            'gerçek güçleri sana açık, muharebede ilk atış senin.';
      break;
    }
    case 'suikast': {
      if (!target.factions || !target.factions.length){
        msg = 'Hedefin örgütlü bir siyasi yapısı yok.'; break;
      }
      /* En güçlü fraksiyonun lideri hedef alınır */
      const fac = target.factions.slice().sort((a,b) => b.pow - a.pow)[0];
      const eskiAd = fac.lider || 'lider';
      if (typeof facLeaderName === 'function') fac.lider = facLeaderName(target);
      fac.mood = clamp(fac.mood - 30, 0, 100);
      /* Suikast tüm fraksiyonları sarsar: iç siyaset kilitlenir */
      for (const f2 of target.factions) f2.mood = clamp(f2.mood - 12, 0, 100);
      target.stabHit = (target.stabHit || 0) + 18;
      target.res.etk = Math.max(0, (target.res.etk || 0) * .55);
      for (const c of target.colonies){
        const pl = G.sys[c.s] && G.sys[c.s].planets[c.p];
        if (pl && pl.col) pl.col.stab = clamp(pl.col.stab - 22, 0, 100);
      }
      msg = eskiAd + ' suikaste kurban gitti — ' + target.name +
            ' iç siyaseti kaosa sürüklendi (istikrar −22, etki yarılandı).';
      break;
    }
    case 'ambargoKir': {
      /* Bize ambargo uygulayanlardan birini seç ve o hattı aç */
      /* Zaten delinmiş hattı tekrar delmeye çalışma */
      const uygulayan = G.emps.filter(o => !o.dead && !o.wild &&
        typeof embargoOn === 'function' && embargoOn(o, e.id) &&
        !(e.smuggle && e.smuggle[o.id] > G.day));
      if (!uygulayan.length){ msg = 'Sana ambargo uygulayan yok.'; break; }
      const kim = uygulayan[Math.floor(rnd() * uygulayan.length)];
      e.smuggle = e.smuggle || {};
      e.smuggle[kim.id] = G.day + 1440;            // 4 yıl
      e._trAt = -1; kim._trAt = -1;
      msg = kim.name + ' ambargosu delindi — o hattan ticaret yeniden akıyor.';
      break;
    }
    /* ── FAZ 16: DERİN SORUŞTURMA ──
       w.framed verisini açığa çıkarır. Faz 15'te kurduğumuz iftira
       zincirinin karşı hamlesi: gerçek fail ortaya çıkar, kin yön
       değiştirir. Kendi dosyalarımızı da aydınlatabilir. */
    case 'sorusturma': {
      /* Önce KENDİ dosyalarımızda hedefe atılmış iftira var mı? */
      let dosya = null, magdur = null;
      const benimIftira = (e.hitLog || []).filter(w =>
        w.known && w.by === target.id && w.framed !== undefined && w.framed !== e.id);
      if (benimIftira.length){
        dosya = benimIftira[Math.floor(rnd() * benimIftira.length)];
        magdur = e;
      } else {
        /* Başka bir devletin, hedefe yıkılmış iftirasını çöz */
        const adaylar = [];
        for (const v of G.emps){
          if (v.dead || v.wild || v.id === e.id) continue;
          for (const w of (v.hitLog || []))
            if (w.known && w.by === target.id && w.framed !== undefined && w.framed !== v.id)
              adaylar.push({v, w});
        }
        if (adaylar.length){
          const sec = adaylar[Math.floor(rnd() * adaylar.length)];
          dosya = sec.w; magdur = sec.v;
        }
      }

      if (!dosya){
        /* İftira yok — hiç değilse kendi açık dosyalarımızdan birini çöz */
        const acik = (e.hitLog || []).filter(w => !w.known);
        if (!acik.length){ msg = 'Soruşturulacak şüpheli dosya bulunamadı.'; break; }
        const d2 = acik[Math.floor(rnd() * acik.length)];
        if (d2.by === undefined){ msg = 'Dosya soğuk — iz bulunamadı.'; break; }
        d2.known = true; d2.foundAt = G.memAge || 0;
        const fail = G.emps[d2.by];
        if (fail) remember(e, fail.id, 'komplo');
        msg = fail ? ('Açık dosya çözüldü — fail ' + fail.name) : 'Dosya çözüldü.';
        break;
      }

      /* İFTİRA ÇÖZÜLDÜ — gerçek fail ortaya çıkıyor */
      const gercek = G.emps[dosya.framed];
      dosya.by = dosya.framed;
      delete dosya.framed;
      dosya.foundAt = G.memAge || 0;

      /* Kin yön değiştirir: iftiraya uğrayan temize çıkar */
      if (magdur.mem && magdur.mem[target.id])
        magdur.mem[target.id] = magdur.mem[target.id].filter(m => m.k !== 'komplo');
      magdur.rel[target.id] = clamp(magdur.rel[target.id] + 28, -100, 100);
      if (gercek && !gercek.dead){
        remember(magdur, gercek.id, 'sahteBayrak');
        magdur.rel[gercek.id] = clamp(magdur.rel[gercek.id] - 34, -100, 100);
        /* Gerçeği ortaya çıkaran taraf itibar kazanır */
        target.rel[e.id] = clamp(target.rel[e.id] + 18, -100, 100);
        if (typeof remember === 'function') remember(target, e.id, 'yardimEtti');
      }
      msg = (gercek ? gercek.name : 'Biri') + ' iftira atmış — ' +
            target.name + ' suçsuz çıktı' +
            (magdur.id === 0 ? ' (senin dosyandı)' : ', ' + magdur.name + ' gerçeği öğrendi');
      if (magdur.id === 0 && gercek)
        say('GERÇEK ORTAYA ÇIKTI — asıl fail ' + gercek.name + ', ' +
            target.name + ' değilmiş', 'win');
      break;
    }

    /* ── FAZ 15: SAHTE KANIT ──
       Yeni bir komplo kurmaz; ZATEN OLMUŞ ama faili bulunamamış bir
       dosyayı hedefin üstüne yıkar. Mevcut hitLog altyapısını
       kullanır — sıfırdan kayıt sistemi kurulmaz. */
    case 'sahteKanit': {
      /* Kimin açık dosyası var? Hedefi tanıyan ve bize düşman olmayan
         bir devletin çözülmemiş kaydını arıyoruz. */
      const magdurlar = G.emps.filter(v => !v.dead && !v.wild &&
        v.id !== e.id && v.id !== target.id &&
        v.contact[target.id] && (v.hitLog || []).some(w => !w.known));
      if (!magdurlar.length){
        msg = 'Galakside üstüne yıkılacak açık dosya bulunamadı.';
        break;
      }
      /* En inandırıcı mağdur: hedeften zaten hoşlanmayan */
      magdurlar.sort((a, b) => (a.rel[target.id] || 0) - (b.rel[target.id] || 0));
      const magdur = magdurlar[0];
      const acik = (magdur.hitLog || []).filter(w => !w.known);
      const dosya = acik[Math.floor(rnd() * acik.length)];

      /* Kanıt yerleştirildi: dosya "çözülmüş" görünür, fail HEDEFTİR */
      dosya.known = true;
      dosya.by = target.id;
      dosya.foundAt = G.memAge || 0;
      dosya.framed = e.id;                      // gerçeği yalnız biz biliriz

      const OPad = (typeof OPS !== 'undefined' && OPS[dosya.k]) ? OPS[dosya.k].n : 'bir operasyon';
      remember(magdur, target.id, 'komplo');
      magdur.rel[target.id] = clamp(magdur.rel[target.id] - 32, -100, 100);
      target.rel[magdur.id] = clamp(target.rel[magdur.id] - 10, -100, 100);

      if (magdur.id === 0)
        say('İSTİHBARAT: ' + OPad + ' dosyası çözüldü — fail ' + target.name, 'war');
      msg = magdur.name + ' artık o eski ' + OPad + ' operasyonunun failinin ' +
            target.name + ' olduğuna inanıyor.';
      break;
    }
    case 'tersaneVir': {
      target.virusUntil = G.day + 1080;            // 3 yıl
      recalcMods(target);
      msg = target.name + ' tersanelerine virüs bulaştırıldı — ' +
            'gemi inşa hızı 3 yıl boyunca yarı yarıya düştü.';
      break;
    }
  }
  /* ── FAZ 11: MAĞDUR KAYDI ──
     e.opLog faili tutuyordu; mağdur tarafında hiçbir iz yoktu.
     Artık hedef de kayıt tutar — ama YAKALANMADIYSA failin kimliği
     gizli kalır (bilinmeyen sabotaj). Karşı istihbarat sonradan
     çözebilir; bu, Faz 4'teki counterIntel mantığıyla aynı ruhtadır. */
  target.hitLog = target.hitLog || [];
  target.hitLog.push({
    t: (G.memAge || 0), k: key, by: e.id,
    caught: caught, known: caught          // yakalandıysa fail bilinir
  });
  if (target.hitLog.length > 30) target.hitLog.shift();

  if (caught){
    /* Sahte kanıt ifşası en ağır suçtur: iftiraya uğrayan hedef ve
       kandırılan mağdur birlikte gerçeği öğrenir. */
    if (key === 'sahteKanit'){
      remember(target, e.id, 'sahteBayrak');
      for (const v of G.emps){
        if (v.dead || v.wild || v.id === e.id) continue;
        const yalan = (v.hitLog || []).filter(w => w.framed === e.id);
        if (!yalan.length) continue;
        for (const w of yalan){ w.known = false; delete w.by; delete w.framed; }
        remember(v, e.id, 'sahteBayrak');
        v.rel[e.id] = clamp(v.rel[e.id] - 30, -100, 100);
        if (v.mem && v.mem[target.id])
          v.mem[target.id] = v.mem[target.id].filter(m => m.k !== 'komplo');
        if (v.id === 0) say('SAHTE KANIT ORTAYA ÇIKTI — asıl fail ' + e.name, 'war');
      }
    }
    remember(target, e.id, key === 'sabotaj' ? 'sabotaj' : 'casusYakalan');
    e.rel[target.id] = clamp(e.rel[target.id] - 30, -100, 100);
    target.rel[e.id] = clamp(target.rel[e.id] - 30, -100, 100);
    msg += ' Ancak operasyon ifşa oldu — ilişki −30.';
    if (target.id === 0)
      say('CASUSLUK YAKALANDI — ' + e.name + ' sana "' + OP.n + '" operasyonu çekti', 'war');
    if (target.ai && target.rel[e.id] < -60 && rnd() < .3) declareWar(target, e);
  } else if (target.id === 0){
    /* Oyuncu bir şeyler olduğunu sezer ama kimin yaptığını bilmez */
    say('Bir şeyler ters gidiyor — bilinmeyen bir el işin içinde', 'war');
  }
  return {ok:true, msg, caught};
}

/* sahte bilgi süresi dolunca temizle */
function fakeTick(){
  for (const e of G.emps){
    if (!e.fakeTo) continue;
    for (const k in e.fakeTo) if (e.fakeTo[k].until < G.day) delete e.fakeTo[k];
  }
}
/* =====================================================================
   FRAKSİYONLAR — İÇ POLİTİKA
   Oyuncu fraksiyonları YÖNETMEZ. Memnuniyet asla kendiliğinden
   değişmez; yalnızca somut eylemlerden etkilenir ve her değişimin
   sebebi kaydedilir. Fraksiyonlar ceza vermez, SEÇİM yaptırır.
   ===================================================================== */
const FACTIONS = {
  asker:{n:'Askerî Kurul', ico:'⚔', col:'#ff5f6d',
    ister:'Savaş, fetih, güçlü donanma',
    good:{dmgMul:.12, hullMul:.06, capFlat:14},
    bad :{dmgMul:-.08, upMul:.10},
    d:'Filoların büyümesini ve düşmanların ezilmesini bekler.'},
  bilim:{n:'Bilim Konseyi', ico:'🔬', col:'#8b7bff',
    ister:'Araştırma, keşif, anomali',
    good:{araMul:.14, sensor:1},
    bad :{araMul:-.10},
    d:'Bilginin her şeyden önce geldiğine inanır.'},
  tuccar:{n:'Tüccar Loncası', ico:'💰', col:'#f2d452',
    ister:'Ticaret, koloni, barış',
    good:{eneMul:.14, minMul:.06},
    bad :{eneMul:-.10, upMul:.08},
    d:'Kâr eden bir imparatorluk isterler; savaş masraftır.'},
  halk:{n:'Halk Meclisi', ico:'🏛', col:'#65e08a',
    ister:'İstikrar, refah, tüketim malı',
    good:{growMul:.14, stab:8, yiyMul:.08},
    bad :{stab:-12, growMul:-.08},
    d:'Halkın karnı doysun, kolonilerde huzur olsun.'},
  inanc:{n:'İnanç Düzeni', ico:'⛪', col:'#ff9b3d',
    ister:'Etki, birlik, ruhani üstünlük',
    good:{etkFlat:2.2, stab:6, dipMul:.10},
    bad :{etkFlat:-1.2, stab:-8},
    d:'İmparatorluğun kutsal bir amacı olduğuna inanır.'}
};

const FAC_LEADER_A = ['Yüce','Kıdemli','Baş','Kadim','Onurlu','Sert','Bilge','Yüksek'];
const FAC_LEADER_B = ['Vorn','Kessa','Thal','Miren','Zoltan','Aeryn','Draka','Vesh','Oram','Lyssa','Karn','Ish'];

function facLeaderName(){
  return pick(rnd, FAC_LEADER_A) + ' ' + pick(rnd, FAC_LEADER_B);
}

/* ---------------------------------------------------------------
   Hangi fraksiyonlar doğar? Irkın etiğine göre belirlenir —
   militarist bir devlette Askerî Kurul kaçınılmazdır, Halk Meclisi
   ise egaliter devletlerde güçlüdür.
   --------------------------------------------------------------- */
function initFactions(e){
  const race = RACES[e.race];
  // kovan zihni ve makine zekâsında fraksiyon olmaz: tek irade
  if (race.dip === 0 || race.bio === 'makine'){
    e.factions = null;
    e.unity = 70;
    return;
  }
  const et = e.ethics || {mil:0, aut:0, mat:0};
  const score = {
    asker : 30 + (et.mil||0)*14,
    bilim : 28 + (et.mat||0)*13,
    tuccar: 28 + (race.win === 'ekonomi' ? 22 : 0) - (et.mil||0)*5,
    halk  : 28 - (et.aut||0)*13,
    inanc : 26 - (et.mat||0)*13
  };
  const keys = Object.keys(score).sort((a,b)=>score[b]-score[a]).slice(0,3);
  const raw = keys.map(k=>Math.max(12, score[k]));
  const tot = raw.reduce((a,b)=>a+b,0);
  const baseMood = 50 + (hasPerk(e,'consensus') ? 20 : 0);
  e.factions = keys.map((k,i)=>({
    k, pow: Math.round(raw[i]/tot*100), mood: baseMood,
    leader: facLeaderName(), demand: null, log: []
  }));
  // toplam tam 100 olsun
  const diff = 100 - e.factions.reduce((a,f)=>a+f.pow,0);
  e.factions[0].pow += diff;
  return e.factions;
}

function facPowerMul(e){
  // Mutlak Otorite fraksiyonları bastırır
  return hasPerk(e,'noCoup') ? .6 : 1;
}

/* memnuniyeti SEBEBİYLE birlikte değiştir */
function facShift(e, key, amount, reason){
  if (!e.factions) return;
  const f = e.factions.find(x=>x.k===key);
  if (!f) return;
  let amt = amount;
  if (amount < 0 && hasPerk(e,'consensus')) amt *= .6;   // Uzlaşı Kültürü
  f.mood = clamp(f.mood + amt, 0, 100);
  f.log.unshift({t:reason, v:Math.round(amt), d:G.day});
  if (f.log.length > 6) f.log.pop();
  if (e.id === 0 && Math.abs(amt) >= 6){
    say(FACTIONS[key].n + ' ' + (amt>0?'+':'') + Math.round(amt) + ' — ' + reason,
        amt > 0 ? 'win' : 'war');
  }
}

/* imparatorluk eylemlerini fraksiyonlara duyur */
function facEvent(e, kind, extra){
  if (!e || !e.factions) return;
  switch(kind){
    case 'war':
      facShift(e, 'asker', +10, 'savaş ilanı');
      facShift(e, 'tuccar', -8, 'savaş ticareti vurur');
      facShift(e, 'halk', -6, 'halk savaş istemiyor');
      break;
    case 'peace':
      facShift(e, 'asker', -7, 'barış imzalandı');
      facShift(e, 'tuccar', +8, 'ticaret yolları açıldı');
      facShift(e, 'halk', +7, 'halk barışa sevindi');
      break;
    case 'colony':
      facShift(e, 'tuccar', +6, 'yeni koloni kuruldu');
      facShift(e, 'halk', +3, 'yeni yurt');
      break;
    case 'tech':
      facShift(e, 'bilim', +6, 'araştırma tamamlandı');
      break;
    case 'conquest':
      facShift(e, 'asker', +9, 'sistem fethedildi');
      facShift(e, 'inanc', +4, 'zafer kutsandı');
      break;
    case 'lost':
      facShift(e, 'asker', -10, 'sistem kaybedildi');
      facShift(e, 'halk', -8, 'halk paniğe kapıldı');
      facShift(e, 'inanc', -6, 'inanç sarsıldı');
      break;
    case 'ally':
      facShift(e, 'tuccar', +7, 'ittifak ticareti güçlendirir');
      facShift(e, 'asker', -4, 'askerler bağımlılık sevmez');
      break;
    case 'shortage':
      facShift(e, 'halk', -7, 'tüketim malı kıtlığı');
      break;
    case 'influence':
      facShift(e, 'inanc', +5, 'etki birikti');
      break;
    case 'fleetLoss':
      facShift(e, 'asker', -8, 'filo yok edildi');
      break;
    case 'struct':
      facShift(e, 'bilim', +4, 'uzay yapısı tamamlandı');
      facShift(e, 'tuccar', +3, 'altyapı yatırımı');
      break;
  }
}

/* fraksiyon modifikatörleri: güç payı × memnuniyet */
function facMods(e){
  const out = {};
  if (!e.factions) return out;
  const pm = facPowerMul(e);
  for (const f of e.factions){
    const F = FACTIONS[f.k];
    const w = (f.pow / 100) * pm;
    if (f.mood >= 60){
      const s = w * ((f.mood - 60) / 40);
      for (const k in F.good) out[k] = (out[k]||0) + F.good[k]*s;
    } else if (f.mood <= 35){
      const s = w * ((35 - f.mood) / 35);
      for (const k in F.bad) out[k] = (out[k]||0) + F.bad[k]*s;
    }
  }
  return out;
}

/* ---------------------------------------------------------------
   Aylık fraksiyon tiki: güç payı memnuniyete göre kayar,
   kızgın ve güçlü fraksiyon dayatma yapar, çok güçlenirse darbe.
   --------------------------------------------------------------- */
function facTick(){
  for (const e of G.emps){
    if (e.dead || e.wild) continue;
    if (!e.factions){
      // kovan/makine: tek eksenli uyum
      if (e.unity === undefined) e.unity = 70;
      const target = 70 + (e.crisis ? -25 : 0) + (e.shortage ? -12 : 0);
      e.unity = clamp(e.unity + clamp(target - e.unity, -2, 2), 0, 100);
      continue;
    }
    // memnuniyet güç payını çeker: memnun fraksiyon güçlenir
    let shift = 0;
    for (const f of e.factions){
      const pull = (f.mood - 50) * .012;
      f.pow = clamp(f.pow + pull, 5, 80);
      shift += pull;
    }
    // toplamı 100'e normalize et
    const tot = e.factions.reduce((a,f)=>a+f.pow, 0) || 1;
    e.factions.forEach(f => f.pow = Math.round(f.pow / tot * 100));

    // dayatma: kızgın VE güçlü fraksiyon talep iletir
    for (const f of e.factions){
      if (f.demand){
        f.demand.left -= 1;
        if (f.demand.left <= 0){
          const done = facCheckDemand(e, f);
          if (done){ facShift(e, f.k, +18, 'talep karşılandı'); }
          else { facShift(e, f.k, -14, 'talep karşılanmadı'); }
          f.demand = null;
        }
        continue;
      }
      if (f.mood < 32 && f.pow > 24 && rnd() < .16){
        f.demand = facMakeDemand(e, f);
        if (f.demand && e.id === 0) UI.facDemand(f);
      }
    }

    // darbe: çok güçlü ve çok kızgın → ideoloji zorla kayar
    if (!hasPerk(e,'noCoup')){
      const rebel = e.factions.find(f => f.pow >= 55 && f.mood <= 20);
      if (rebel && rnd() < .12) facCoup(e, rebel);
    }
    recalcMods(e);
  }
}

function facMakeDemand(e, f){
  const now = G.day;
  switch(f.k){
    case 'asker': {
      const target = fleetUsage(e) + 12;
      return {t:'fleet', v:target, left:36, txt:'Filo gücünü ' + target + ' birime çıkar'};
    }
    case 'bilim': {
      const target = Object.keys(e.techs).length + 3;
      return {t:'tech', v:target, left:36, txt:target + ' teknolojiye ulaş'};
    }
    case 'tuccar': {
      const target = e.colonies.length + 2;
      return {t:'colony', v:target, left:48, txt:target + ' koloniye ulaş'};
    }
    case 'halk': {
      return {t:'stab', v:60, left:36, txt:'Tüm kolonilerde istikrarı 60 üstüne çıkar'};
    }
    case 'inanc': {
      const target = Math.round(e.res.etk + 250);
      return {t:'etk', v:target, left:36, txt:target + ' etki biriktir'};
    }
  }
  return null;
}
function facCheckDemand(e, f){
  const d = f.demand;
  if (!d) return false;
  switch(d.t){
    case 'fleet':  return fleetUsage(e) >= d.v;
    case 'tech':   return Object.keys(e.techs).length >= d.v;
    case 'colony': return e.colonies.length >= d.v;
    case 'etk':    return e.res.etk >= d.v;
    case 'stab': {
      let ok = true;
      for (const c of e.colonies){
        const pl = G.sys[c.s].planets[c.p];
        if (pl.col && pl.col.stab < d.v) ok = false;
      }
      return ok;
    }
  }
  return false;
}

/* darbe: fraksiyon ideolojiyi kendi yönüne çeker */
function facCoup(e, f){
  const et = e.ethics || {mil:0, aut:0, mat:0};
  let axis = 'aut', dir = 1, label = '';
  switch(f.k){
    case 'asker':  axis='mil'; dir= 1; label='militarist'; break;
    case 'halk':   axis='aut'; dir=-1; label='egaliter';   break;
    case 'bilim':  axis='mat'; dir= 1; label='materyalist';break;
    case 'inanc':  axis='mat'; dir=-1; label='ruhani';     break;
    case 'tuccar': axis='mil'; dir=-1; label='pasifist';   break;
  }
  const before = et[axis] || 0;
  et[axis] = clamp(before + dir * 2, -ETHIC_MAX, ETHIC_MAX);
  // bütçe aşımını başka eksenden düş
  let spent = Math.abs(et.mil) + Math.abs(et.aut) + Math.abs(et.mat);
  const others = ['mil','aut','mat'].filter(a=>a!==axis);
  for (const a of others){
    while (spent > ETHIC_BUDGET && et[a] !== 0){ et[a] -= Math.sign(et[a]); spent--; }
  }
  e.ethics = et;
  f.mood = 55;
  f.pow = clamp(f.pow + 10, 5, 80);
  // diğer fraksiyonlar öfkelenir
  for (const o of e.factions) if (o !== f) o.mood = clamp(o.mood - 18, 0, 100);
  recalcMods(e);
  if (e.id === 0){
    UI.facCoup(f, label);
  } else {
    say(e.name + ' iç darbe yaşadı — yönetim ' + label + ' çizgiye kaydı', 'war');
  }
}

/* ---------- İDEOLOJİ REFORMU ----------
   Oyuncu büyük bir etki maliyetiyle ideolojisini kaydırabilir.
   Darbeye cevap vermenin ve gönüllü taviz vermenin yolu budur. */
const REFORM_COST = 400;
const REFORM_COOLDOWN = 10 * 360;      // 10 yıl

function canReform(e){
  if ((e.res.etk||0) < REFORM_COST)
    return {ok:false, why:REFORM_COST + ' etki gerekir (şu an ' + Math.round(e.res.etk) + ').'};
  const last = (e.lastReform === undefined) ? -99999 : e.lastReform;   // 0 falsy tuzağı
  const left = Math.ceil((last + REFORM_COOLDOWN - G.day) / 360);
  if (left > 0) return {ok:false, why:'Bir sonraki reform için ' + left + ' yıl beklemelisin.'};
  return {ok:true};
}
function doReform(e, axis, dir){
  const chk = canReform(e);
  if (!chk.ok) return chk;
  const et = e.ethics || {mil:0, aut:0, mat:0};
  const cur = et[axis] || 0;
  const next = clamp(cur + dir, -ETHIC_MAX, ETHIC_MAX);
  if (next === cur) return {ok:false, why:'Bu eksen zaten uçta.'};
  // bütçe kontrolü
  let spent = Math.abs(next) + Math.abs(et.mil) + Math.abs(et.aut) + Math.abs(et.mat) - Math.abs(cur);
  if (spent > ETHIC_BUDGET){
    // başka eksenden düşür
    const others = ['mil','aut','mat'].filter(a=>a!==axis)
      .sort((a,b)=>Math.abs(et[a]) - Math.abs(et[b]));
    for (const a of others){
      while (spent > ETHIC_BUDGET && et[a] !== 0){ et[a] -= Math.sign(et[a]); spent--; }
    }
  }
  if (spent > ETHIC_BUDGET) return {ok:false, why:'İdeoloji bütçesi yetersiz.'};
  et[axis] = next;
  e.ethics = et;
  e.res.etk -= REFORM_COST;
  e.lastReform = G.day;
  // fraksiyonlar tepki verir
  if (e.factions){
    const like = {asker:'mil', halk:'aut', bilim:'mat', inanc:'mat', tuccar:'mil'};
    const wantDir = {asker:1, halk:-1, bilim:1, inanc:-1, tuccar:-1};
    for (const f of e.factions){
      if (like[f.k] !== axis) continue;
      const good = (wantDir[f.k] === dir);
      facShift(e, f.k, good ? +20 : -16, 'ideoloji reformu');
    }
  }
  recalcMods(e);
  return {ok:true, from:cur, to:next};
}

/* fraksiyon özeti — arayüz için */
function facSummary(e){
  if (!e.factions) return null;
  return e.factions.map(f=>({
    ...f, def:FACTIONS[f.k],
    state: f.mood >= 60 ? 'memnun' : f.mood <= 35 ? 'kızgın' : 'kararsız'
  }));
}
/* =====================================================================
   SAVAŞ HEDEFLERİ · SAVAŞ YORGUNLUĞU · GEZEGEN KARAKTERİ
   ===================================================================== */

/* ---------- SAVAŞ HEDEFLERİ (Casus Belli) ----------
   Savaş ilan ederken ne için savaştığını seçersin. Hedefe yaklaştıkça
   "savaş puanı" birikir; müzakerede karşı taraf bunu tanır ve barışa
   daha yatkın olur. Hedefsiz savaş amaçsız sürüklenir.            */
const WAR_GOALS = {
  boyun:{n:'Boyun Eğdirme', ico:'👑', etk:45,
    d:'Düşmanı yok etme, boyunduruk altına al. Başkentini kuşat ve ' +
      'filosunu yarıya indir — sonra vasalın olur.',
    setup(e, foe){ return {home: foe.home, base: Math.max(1, totalPower(foe))}; },
    prog(e, foe, g){
      const sy = G.sys[g.home];
      let p = 0;
      /* Yarısı askerî çöküş, yarısı başkent baskısı */
      /* Askerî çöküş (yarıya inen filo) tek başına %50 ilerleme sağlar.
         Başkenti FETHETMEK şart değil — KUŞATMAK da yeter; yoksa
         toplam puan 0.8'de takılıyor ve boyunduruk asla kurulamıyordu. */
      const now = totalPower(foe);
      p += clamp(1 - now / Math.max(1, g.base * .5), 0, 1) * .5;
      if (sy){
        if (sy.owner === e.id) p += .6;
        else if (G.fleets.some(f => f.e === e.id && f.sys === g.home && isArmed(f))) p += .5;
      }
      return clamp(p, 0, 1);
    },
    txt(e, foe, g){
      const sy = G.sys[g.home];
      const now = totalPower(foe);
      const askeri = Math.round(clamp(1 - now / Math.max(1, g.base), 0, 1) * 100);
      const bas = sy && sy.owner === e.id ? 'başkent alındı'
                : (sy && G.fleets.some(f => f.e === e.id && f.sys === g.home && isArmed(f)))
                  ? 'başkent kuşatmada' : 'başkent serbest';
      return 'filo −%' + askeri + ' · ' + bas;
    }},
  fetih:{n:'Fetih', ico:'⚔', etk:25,
    d:'Düşmanın sınır sistemlerini ele geçir. Hedef: 3 sistem.',
    setup(e, foe){
      const cand = G.sys.filter(sy => sy.owner === foe.id && sy.id !== foe.home)
        .sort((a,b)=>{
          const da = Math.min(...G.sys.filter(x=>x.owner===e.id).map(x=>dist(x,a)).concat([9e9]));
          const db = Math.min(...G.sys.filter(x=>x.owner===e.id).map(x=>dist(x,b)).concat([9e9]));
          return da - db;
        }).slice(0, 3).map(sy=>sy.id);
      // düşmanın başkent dışında sistemi yoksa başkent hedef olur
      if (!cand.length && G.sys[foe.home]) cand.push(foe.home);
      return {targets: cand};
    },
    prog(e, foe, g){
      if (!g.targets || !g.targets.length) return 0;
      const got = g.targets.filter(id => G.sys[id] && G.sys[id].owner === e.id).length;
      return got / g.targets.length;
    },
    txt(e, foe, g){
      const got = (g.targets||[]).filter(id => G.sys[id] && G.sys[id].owner === e.id).length;
      return got + '/' + (g.targets||[]).length + ' sistem alındı';
    }},
  harac:{n:'Haraç', ico:'💰', etk:20,
    d:'Düşmanı yıllık ödemeye zorla. Filosunu %40 imha etmek yeter.',
    setup(e, foe){ return {base: totalPower(foe) || 1}; },
    prog(e, foe, g){
      const now = totalPower(foe);
      return clamp(1 - now / Math.max(1, g.base * .6), 0, 1);
    },
    txt(e, foe, g){
      const now = totalPower(foe);
      const pct = Math.round(clamp(1 - now / Math.max(1, g.base), 0, 1) * 100);
      return 'düşman filosu %' + pct + ' zayıfladı';
    }},
  bilgi:{n:'Bilgi', ico:'✦', etk:20,
    d:'Bir teknolojisini zorla al. Başkentini kuşatmak yeter.',
    setup(e, foe){ return {home: foe.home}; },
    prog(e, foe, g){
      const sy = G.sys[g.home];
      if (!sy) return 0;
      if (sy.owner === e.id) return 1;
      const sieging = G.fleets.some(f => f.e === e.id && f.sys === g.home && isArmed(f));
      return sieging ? .6 : 0;
    },
    txt(e, foe, g){
      const sy = G.sys[g.home];
      if (sy && sy.owner === e.id) return 'başkent ele geçirildi';
      const sieging = G.fleets.some(f => f.e === e.id && f.sys === g.home && isArmed(f));
      return sieging ? 'başkent kuşatma altında' : 'başkente ulaşılmadı';
    }},
  yikim:{n:'Yıkım', ico:'🔥', etk:15,
    d:'Donanmasını kır. Filo gücünün %70\'ini imha et.',
    setup(e, foe){ return {base: Math.max(1, totalPower(foe))}; },
    prog(e, foe, g){
      const now = totalPower(foe);
      return clamp((1 - now / g.base) / .70, 0, 1);
    },
    txt(e, foe, g){
      const now = totalPower(foe);
      return 'filo gücü ' + fmt(g.base) + ' → ' + fmt(now);
    }},
  yoketme:{n:'Yok Etme', ico:'☠', etk:90,
    d:'İmparatorluğu tarihten sil. Çok pahalı; tüm galakside itibar kaybettirir.',
    setup(e, foe){
      for (const o of G.emps){
        if (o.dead || o.wild || o.id === e.id) continue;
        o.rel[e.id] = clamp(o.rel[e.id] - 22, -100, 100);
      }
      return {};
    },
    prog(e, foe){ return foe.dead ? 1 : clamp(1 - sysCount(foe) / 4, 0, .95); },
    txt(e, foe){ return foe.dead ? 'imparatorluk yok edildi' : sysCount(foe) + ' sistemi kaldı'; }}
};

/* Savaş Kahramanı: hedef tamamlanınca tüm fraksiyonlar sevinir.
   Sonsuz Seferberlik: her savaş ilanı kalıcı güç biriktirir. */
/* Boyun eğdirme hedefi dolduğunda vasallık kurulur */
function checkSubjugation(e, foeId){
  if (!e.wg || !e.wg[foeId] || e.wg[foeId].t !== 'boyun') return false;
  if (e.wg[foeId].done) return false;
  if (warGoalProgress(e, foeId) < 1) return false;
  const foe = G.emps[foeId];
  if (!foe || foe.dead) return false;
  e.wg[foeId].done = true;
  /* Tür seçimi: sınır komşusuysa tampon bekçi, uzaksa haraçgüzar */
  const komsu = G.sys.some(sy => sy.owner === foe.id &&
    sy.lanes.some(l => G.sys[l].owner === e.id));
  const prof = e.ai ? aiProfile(e) : {war:.5, eco:.5};
  const tur = (komsu && prof.war > prof.eco) ? 'bekci' : 'haracguzar';
  return subjugate(e, foe, tur);
}

function warGoalCheckReward(e, foeId){
  if (!e.wg || !e.wg[foeId] || e.wg[foeId].rewarded) return;
  if (warGoalProgress(e, foeId) < 1) return;
  e.wg[foeId].rewarded = true;
  if (hasCivic(e,'warhero') && e.factions)
    e.factions.forEach(f => facShift(e, f.k, +15, 'savaş hedefi tamamlandı'));
  if (e.id === 0) say('SAVAŞ HEDEFİ TAMAMLANDI — barış masasında güçlüsün', 'win');
}
function setWarGoal(e, foe, key){
  const G2 = WAR_GOALS[key];
  if (!G2) return false;
  if ((e.res.etk || 0) < G2.etk && !hasPerk(e,'freeWar')) return false;
  if (!hasPerk(e,'freeWar')) e.res.etk -= G2.etk;
  e.wg = e.wg || {};
  const extra = G2.setup ? G2.setup(e, foe) : {};
  e.wg[foe.id] = Object.assign({t:key, start:G.day}, extra);
  return true;
}
function warGoalProgress(e, foeId){
  if (!e.wg || !e.wg[foeId]) return 0;
  const foe = G.emps[foeId];
  if (!foe) return 0;
  const g = e.wg[foeId];
  const G2 = WAR_GOALS[g.t];
  if (!G2) return 0;
  return clamp(G2.prog(e, foe, g), 0, 1);
}
function warGoalText(e, foeId){
  if (!e.wg || !e.wg[foeId]) return '';
  const foe = G.emps[foeId], g = e.wg[foeId], G2 = WAR_GOALS[g.t];
  if (!foe || !G2) return '';
  return G2.txt(e, foe, g);
}
/* hedefe ulaşan taraf barış masasında avantajlıdır */
function warLeverage(e, foeId){
  const p = warGoalProgress(e, foeId);
  return Math.round(p * 260);
}

/* ---------- SAVAŞ YORGUNLUĞU ----------
   Uzun savaş halkı ve orduyu yorar. %100'e ulaşan taraf barışa
   mecbur kalır. Militarist devletler yarı hızda yorulur.        */
function exhOf(e, foeId){
  if (!e.exh) e.exh = {};
  return e.exh[foeId] || 0;
}
function addExh(e, foeId, amt, reason){
  e.exh = e.exh || {};
  let m = 1;
  if (hasPerk(e,'freeWar')) m = .5;              // Militarist 2
  if (hasPerk(e,'peaceAlways')) m = 1.4;         // Pasifist barışa itilir
  if (RACES[e.race].dip === 0) m *= .6;          // kovan zihni yorulmaz
  if (RACES[e.race].bio === 'makine') m *= .7;
  /* FAZ 15: Çarpanlar üst üste binince (militarist + kovan + makine)
     m 0.21'e düşüyor ve yorgunluk pratikte hiç dolmuyordu — ölçümde
     528 ay (44 yıl) süren savaşlar çıktı. Taban güvence: hiçbir
     doktrin savaşı sonsuz kılamaz. */
  m = Math.max(m, .45);
  e.exh[foeId] = clamp((e.exh[foeId] || 0) + amt * m, 0, 100);
  if (reason && e.id === 0 && amt >= 4)
    say('Savaş yorgunluğu +' + Math.round(amt*m) + ' — ' + reason, 'war');
}
function warExhTick(){
  // savaş hedefi ödülleri ve boyun eğdirme
  for (const e of G.emps){
    if (e.dead || e.wild || !e.wg) continue;
    for (const k in e.wg) if (e.war[k]){
      warGoalCheckReward(e, +k);
      if (typeof checkSubjugation === 'function') checkSubjugation(e, +k);
    }
  }
  for (const e of G.emps){
    if (e.dead || e.wild) continue;
    e.exh = e.exh || {};
    for (const o of G.emps){
      if (o.dead || o.wild || o.id === e.id) continue;
      if (!e.war[o.id]){
        // barışta yorgunluk yavaşça iyileşir
        if (e.exh[o.id]) e.exh[o.id] = Math.max(0, e.exh[o.id] - 2.5);
        continue;
      }
      let amt = 1.3;
      /* FAZ 16: PARYA'ya karşı savaşmak meşru bir dava sayılır —
         halk daha az yorulur. Paryanın kendisi ise yalnız
         savaştığı için daha hızlı yorulur. */
      if (typeof isPariah === 'function'){
        if (isPariah(o)) amt *= .45;          // ben paryaya saldırıyorum
        if (isPariah(e)) amt *= 1.5;          // ben paryayım, herkes üstüme geliyor
      }
      // kuşatılan koloniler yorgunluğu hızlandırır
      let besieged = 0;
      for (const c of e.colonies){
        const sy = G.sys[c.s];
        if (G.fleets.some(f => f.e === o.id && f.sys === sy.id && isArmed(f))) besieged++;
      }
      amt += besieged * .8;
      // hedefine ulaşamamış uzun savaş daha çok yorar
      /* Savaş uzadıkça yorgunluk HIZLANIR: 3 yıldan sonra her yıl
         biraz daha ağır gelir, 8 yıldan sonra halk dayanamaz. */
      const wsMonths = (G.day - ((e.warStart && e.warStart[o.id] !== undefined)
        ? e.warStart[o.id] : G.day)) / 30;
      if (wsMonths > 36) amt += .8 + (wsMonths - 36) * .035;
      if (wsMonths > 96) amt += 2.0;
      addExh(e, o.id, amt);

      // fraksiyonlar yorgunluktan etkilenir
      if (e.factions && e.exh[o.id] > 60 && rnd() < .2)
        facShift(e, 'halk', -3, 'savaş yorgunluğu');

      /* %100: ZORLA BARIŞ.
         canPeace() soğuma/kilit döndürebiliyordu ve o durumda savaş
         sonsuza dek sürüyordu. Yorgunluk doruğa vurduğunda ordu
         zaten savaşamaz: kilit ne olursa olsun barış dayatılır. */
      if (e.exh[o.id] >= 100){
        if (!canPeace(e, o)){
          /* Kilidi kır: savaş hedefi ve vekil savaş kayıtları düşer */
          if (e.wg) delete e.wg[o.id];
          if (o.wg) delete o.wg[e.id];
          if (e.proxyWar) delete e.proxyWar[o.id];
          if (o.proxyWar) delete o.proxyWar[e.id];
          e.war[o.id] = false; o.war[e.id] = false;
          e.peaceAt = e.peaceAt || {}; o.peaceAt = o.peaceAt || {};
          e.peaceAt[o.id] = G.day; o.peaceAt[e.id] = G.day;
          if (typeof remember === 'function'){
            remember(e, o.id, 'barisImzala');
            remember(o, e.id, 'barisImzala');
          }
          if (e.id === 0 || o.id === 0)
            say('ORDU SAVAŞAMIYOR — ' + (e.id===0?o.name:e.name) +
                ' ile çatışma kendiliğinden durdu', 'war');
        } else makePeace(e, o);
        e.exh[o.id] = 55; o.exh = o.exh || {}; o.exh[e.id] = Math.min(o.exh[e.id]||0, 55);
        if (e.id === 0) say('SAVAŞ YORGUNLUĞU DORUKTA — ' + o.name + ' ile barış zorunlu oldu', 'war');
        else if (o.id === 0) say(e.name + ' savaştan çekildi — barış imzalandı', 'win');
      }
    }
  }
}
/* =====================================================================
   GALAKTİK KONSEY — "Birleşmiş Milletler"
   Pasifist bir imparatorluk kurar; tüm galaksi üye olabilir.
   Kararlar galaksi çapında bağlayıcıdır ve ihlal edenin bedeli vardır.
   ===================================================================== */

const COUNCIL_COST = 350;

/* oylama sıklığı — kurulum ekranından seçilir */
/* Meclis artık pasif değil: AI'lar mizaçlarına göre düzenli yasa
   teklif ediyor. Aralık AY (tur) cinsinden tutulur. */
const COUNCIL_PACE = {
  kapali:{n:'KAPALI', yil:0, ay:0,  d:'Konsey diplomasisi devre dışı'},
  sik   :{n:'SIK',    yil:1, ay:12, d:'12 turda bir oylama · yoğun meclis'},
  normal:{n:'NORMAL', yil:2, ay:18, d:'18 turda bir oylama · dengeli'},
  seyrek:{n:'SEYREK', yil:3, ay:30, d:'30 turda bir oylama · nadir ama ağır kararlar'}
};
function councilPaceMonths(){
  const k = (G.cfg && G.cfg.council) || 'normal';
  const p = COUNCIL_PACE[k];
  return p ? p.ay : 18;
}
function councilPaceYears(){
  const k = (G.cfg && G.cfg.council) || 'normal';
  const p = COUNCIL_PACE[k];
  return p ? p.yil : 5;
}

/* ---------- KARARLAR ---------- */
const COUNCIL_FOUND_TURN = 100;      // konsey bu turda kendiliğinden doğar

const RESOLUTIONS = {
  birlesme:{n:'Krize Karşı Birleşme', ico:'🛡', hedefli:false,
    d:'Galaktik kriz sürerken üyeler arasındaki tüm savaşlar dondurulur ve ' +
      'sınırlar karşılıklı açılır. Yalnızca kriz aktifken önerilebilir.',
    lean:{dip:1, war:.3}},
  parya   :{n:'Galaktik Parya Yaptırımı', ico:'⛔', hedefli:true,
    d:'Hedef devletin galaksiyle tüm ticareti kesilir ve üretimi %30 düşer. ' +
      'Yalnızca onuru −50 altına düşmüş devletler için önerilebilir.',
    lean:{dip:1}},
  ticaretStd:{n:'Evrensel Ticaret Standardı', ico:'⚖', hedefli:false,
    d:'Ortak ölçüler, ortak limanlar, tek muhasebe dili. Tüm üyelerin ticaret geliri %10 artar.',
    lean:{eco:1}},
  silahsiz:{n:'Silahsızlanma Antlaşması', ico:'🕊', hedefli:false,
    d:'Tüm üyelerin filo kapasitesi −%30. İhlal eden (kapasiteyi aşan) her ay itibar kaybeder.',
    lean:{mil:-1}},
  serbest :{n:'Serbest Ticaret Bölgesi', ico:'🤝', hedefli:false,
    d:'Üyeler arası tüm limanlar bağlanır; ticaret geliri +%50.',
    lean:{eco:1}},
  bilim   :{n:'Bilim Ortaklığı', ico:'🔬', hedefli:false,
    d:'Tüm üyeler +%20 araştırma. Bilgi paylaşılır.',
    lean:{sci:1}},
  seferber:{n:'Kriz Seferberliği', ico:'🌋', hedefli:false,
    d:'Kriz filolarına karşı +%40 hasar. Üyeler ortak savunma hazinesine katkı verir.',
    lean:{war:.5}},
  muhafiz :{n:'Konsey Muhafızları', ico:'⚑', hedefli:false,
    d:'Üyeler ayda 6 alaşım bağışlar; konsey kendi filosunu kurar ve kararları uygular.',
    lean:{war:1}},
  savasYasak:{n:'Savaş Yasağı', ico:'🚫', hedefli:true,
    d:'Hedef imparatorluğa savaş açmak yasaklanır. İhlal eden TÜM konseyin düşmanı olur.',
    lean:{dip:1}},
  yaptirim :{n:'Yaptırım', ico:'⛔', hedefli:true,
    d:'Hedefin ticareti kesilir ve üretimi −%25 düşer. Diplomatik tecrit.',
    lean:{dip:.5, war:.5}},
  ihrac    :{n:'Konseyden İhraç', ico:'🚪', hedefli:true,
    d:'Hedef üyelikten atılır ve konsey ayrıcalıklarını kaybeder.',
    lean:{dip:.3}},

  /* ═══ FAZ 32: YENİ YASALAR ═══ */
  colYasak :{n:'Süper Silah Yasağı', ico:'☄', hedefli:false,
    d:'Colossus sınıfı gemilerin inşası yasaklanır. Yasağa rağmen ateşleyen ' +
      'devlet doğrudan Galaktik Parya ilan edilir.',
    lean:{dip:1, war:-.6}},
  arastirma:{n:'Araştırma Bütçeleri', ico:'🔬', hedefli:false,
    d:'Üyeler bilime yatırım yapmak zorunda: araştırma +%15, enerji −%10.',
    lean:{sci:1, eco:-.2}},
  sinirGuv :{n:'Sınır Güvenliği Paktı', ico:'🛡', hedefli:false,
    d:'Ortak savunma standardı: garnizon +%20, ticaret geliri −%15.',
    lean:{war:.6, eco:-.4}},
  casusInfaz:{n:'Casusluk İnfaz Yasası', ico:'⚖', hedefli:false,
    d:'Yakalanan ajanlar infaz edilir; mağdur devlet otomatik savaş nedeni kazanır ' +
      've casusluk riski tüm galakside artar.',
    lean:{dip:.5, war:.3}},
  gocSerbest:{n:'Serbest Göç Yasası', ico:'🚀', hedefli:false,
    d:'Üyeler arası nüfus akışı serbest: koloni büyümesi +%20, istikrar −5.',
    lean:{eco:.6, dip:.4}},
  /* ═══ FAZ 54: TİCARET AMBARGOSU ═══
     Hedefli tasarı: seçilen devletin enerji ve mineral üretimi
     düşer. Konseyin en sert ekonomik silahı. */
  ticAmbargo:{n:'Ticaret Ambargosu', ico:'🚫', hedefli:true,
    d:'Hedef devletin galaktik pazara erişimi kesilir: enerji ve ' +
      'mineral üretimi −%20. Konsey üyeleri onunla ticaret yapamaz.',
    lean:{eco:.4, dip:-.3}},

  /* ═══ FAZ 54: KRİZ HAZIRLIĞI ═══
     Galaksi tehdidi sezdiğinde tersaneler seferber olur. */
  krizHazir:{n:'Kriz Hazırlığı', ico:'🛠', hedefli:false,
    d:'Üyeler ortak üretim standardına geçer: gemi maliyetleri −%15, ' +
      'ama araştırma −%8 (mühendisler tezgâha kayar).',
    lean:{war:.5, sci:-.3}},
  madenTekel:{n:'Maden Tekeli', ico:'⛏', hedefli:false,
    d:'Konsey madenciliği düzenler: mineral +%18, araştırma −%8.',
    lean:{eco:1, sci:-.3}},

  /* ═══ FAZ 35: GALAKTİK SAVUNMA PAKTI ═══ */
  savunmaPakti:{n:'Galaktik Savunma Paktı', ico:'🛡', hedefli:false,
    d:'Hiçlik Sürüsü\'ne karşı ortak savunma: üyelerin filo kapasitesi +25, ' +
      'gemi bakımı −%20 ve krize karşı savaşan filolar +%15 hasar verir. ' +
      'Yalnızca kriz sırasında önerilebilir.',
    lean:{dip:.8, war:.5, sci:.3}}
};

function councilExists(){ return !!(G.council && !G.council.dead); }
function inCouncil(e){ return councilExists() && G.council.members.includes(e.id); }
function councilName(){
  const a = ['Galaktik','Yıldızlar','Evrensel','Büyük','Kadim'];
  const b = ['Konsey','Meclis','Birliği','Divanı','Forumu'];
  return pick(rnd, a) + ' ' + pick(rnd, b);
}
/* ═══════════════════════════════════════════════════════════════════
   DİPLOMATİK AĞIRLIK
   Konseyde söz hakkı yalnız topraktan gelmez. Sözünde durmayan bir
   imparatorluğun kürsüsü sessizleşir; küçük ama saygın bir devlet
   dev bir hainden daha gür konuşur.

     maddi  = 1 + √sistem×2,2 + √nüfus×0,55 + min(4, etki/500)
     çarpan = clamp(1 + onur/100 , 0,25 … 2,00)
     ağırlık = maddi × çarpan  (+ ideoloji ve civic bonusları)

   Karekök ölçek kasıtlıdır: doğrusal ölçekte 24 sistemli bir devlet
   tek sistemliyi 9 kat eziyor ve onurun hükmü kalmıyordu.
   ═══════════════════════════════════════════════════════════════════ */
function voteWeight(e){
  if (!e || e.dead) return 0;

  let pop = 0;
  for (const c of e.colonies){
    const pl = G.sys[c.s] && G.sys[c.s].planets[c.p];
    if (pl && pl.col) pop += pl.col.pop;
  }
  /* MADDÎ TABAN — karekök ölçekli.
     Doğrusal ölçekte 24 sistemli bir imparatorluk tek sistemliyi
     9 kat eziyordu ve onurun hiçbir hükmü kalmıyordu. Karekök,
     büyüklüğü hâlâ ödüllendirir ama tek başına belirleyici kılmaz. */
  const maddi = 1
    + Math.sqrt(sysCount(e)) * 2.2
    + Math.sqrt(Math.max(0, pop)) * .55
    + Math.min(4, (e.res.etk || 0) / 500);

  /* ONUR ÇARPANI — asıl belirleyici.
     −100 onur → ×0.25 (söz hakkı erir)
        0 onur → ×1.00
     +100 onur → ×2.00 (küçük ama saygın devlet kürsüde büyür) */
  const hon = (typeof honorOf === 'function') ? honorOf(e) : 0;
  const onurCarpan = clamp(1 + hon / 100, .25, 2.00);

  let w = maddi * onurCarpan;

  const mil = (e.ethics && e.ethics.mil) || 0;
  if (mil < 0) w += Math.abs(mil) * .8;              // pasifistler kürsüde güçlü
  if (hasCivic(e,'council')) w *= 2;                 // Konsey Mimarı
  if (hasCivic(e,'universal')) w *= 1.6;             // Evrensel Barış
  if (G.council && G.council.president === e.id) w *= 1.35;
  /* FAZ 37: Galaksinin Koruyucusu — krizi bitirenin sözü ağır basar */
  if (e.guardian) w *= 1.5;
  /* FAZ 48: reddedilen tasarı ağırlığı 5 yıl kırar */
  if (e._billPenalty && e._billPenalty > (G.memAge || 0)) w *= .75;
  return Math.max(.2, w);                            // hiç kimse tamamen susturulmaz
}
/* Arayüz için ayrıntı dökümü */
function voteWeightBreakdown(e){
  let pop = 0;
  for (const c of e.colonies){
    const pl = G.sys[c.s] && G.sys[c.s].planets[c.p];
    if (pl && pl.col) pop += pl.col.pop;
  }
  const hon = (typeof honorOf === 'function') ? honorOf(e) : 0;
  const maddi = 1 + Math.sqrt(sysCount(e)) * 2.2 + Math.sqrt(Math.max(0,pop)) * .55
              + Math.min(4, (e.res.etk||0) / 500);
  return {
    sistem: sysCount(e), nufus: Math.round(pop), etki: Math.round(e.res.etk||0),
    onur: hon, maddi: maddi.toFixed(1),
    carpan: clamp(1 + hon/100, .25, 2.00).toFixed(2),
    toplam: voteWeight(e).toFixed(1)
  };
}
function canFoundCouncil(e){
  if (councilExists()) return {ok:false, why:'Galaktik Konsey zaten kurulmuş.'};
  if (councilPaceYears() === 0) return {ok:false, why:'Bu galakside konsey devre dışı.'};
  const mil = (e.ethics && e.ethics.mil) || 0;
  if (mil > -2) return {ok:false, why:'Konseyi yalnızca Pasifist 2 veya üstü bir devlet kurabilir.'};
  const known = G.emps.filter(o=>!o.dead && !o.wild && o.id!==e.id && e.contact[o.id]).length;
  if (known < 2) return {ok:false, why:'En az 2 imparatorlukla temas gerekir (şu an ' + known + ').'};
  if ((e.res.etk||0) < COUNCIL_COST) return {ok:false, why:COUNCIL_COST + ' etki gerekir.'};
  return {ok:true};
}
function foundCouncil(e){
  const chk = canFoundCouncil(e);
  if (!chk.ok) return chk;
  e.res.etk -= COUNCIL_COST;
  const members = [e.id];
  // barış hâlindeki tanıdıklar kurucu üye olur
  for (const o of G.emps){
    if (o.dead || o.wild || o.id === e.id) continue;
    if (!e.contact[o.id] || e.war[o.id]) continue;
    if (RACES[o.race].dip <= .02) continue;          // kovan zihni katılmaz
    if (hasCivic(o,'exile') || hasCivic(o,'pirateking')) continue;
    members.push(o.id);
  }
  G.council = {
    name: councilName(), founder: e.id, members,
    laws: {}, targeted: {}, treasury: 0,
    president: e.id, termStart: G.day, terms: {},
    voteIn: 12, vote: null, dead: false
  };
  G.council.terms[e.id] = 1;
  G.council.firstLaw = 'ticaretStd';       // ilk gündem daima ortak ticaret
  say('GALAKTİK KONSEY KURULDU — ' + G.council.name + ' · ' + members.length + ' üye', 'win');
  if (typeof facEvent === 'function') facEvent(e, 'ally');
  return {ok:true};
}
function joinCouncil(e){
  if (!councilExists() || inCouncil(e)) return false;
  if (e.wild || e.crisisSide) return false;      // Hiçlik Sürüsü diplomasi tanımaz
  if (G.council.targeted.ihrac === e.id) return false;
  G.council.members.push(e.id);
  return true;
}
function leaveCouncil(e){
  if (!inCouncil(e)) return false;
  G.council.members = G.council.members.filter(m => m !== e.id);
  // ayrılmak itibar kaybettirir
  for (const m of G.council.members){
    const o = G.emps[m];
    if (o) { o.rel[e.id] = clamp(o.rel[e.id] - 18, -100, 100); }
  }
  if (G.council.members.length < 2) G.council.dead = true;
  return true;
}

/* ---------- KARAR ETKİLERİ ---------- */
function councilMods(e){
  const m = {};
  if (!councilExists()) return m;
  const c = G.council;
  const member = inCouncil(e);
  if (member){
    /* Evrensel Ticaret Standardı: ticaret gelirinin %10'u kadar ek enerji.
       tr.mul zaten ticaretin gelire katkısı olduğundan, onun %10'unu
       eklemek tam olarak "ticaret geliri +%10" demektir. */
    if (c.laws.ticaretStd){
      const tr = e.trade;
      if (tr && tr.mul) m.eneMul = (m.eneMul||0) + tr.mul * .10;
    }
    if (c.laws.silahsiz) m.capFlat = (m.capFlat||0) - 30;
    if (c.laws.bilim)    m.araMul  = (m.araMul||0) + .20;
    if (c.laws.serbest)  m.eneMul  = (m.eneMul||0) + .12;
    /* ═══ FAZ 32 YASALARI ═══ */
    if (c.laws.arastirma){ m.araMul = (m.araMul||0) + .15; m.eneMul = (m.eneMul||0) - .10; }
    if (c.laws.sinirGuv){                       // garnizon etkisi groundTick'te
      const tr2 = e.trade;
      if (tr2 && tr2.mul) m.eneMul = (m.eneMul||0) - tr2.mul * .15;
    }
    if (c.laws.gocSerbest){ m.growMul = (m.growMul||0) + .20; m.stab = (m.stab||0) - 5; }
    if (c.laws.madenTekel){ m.minMul = (m.minMul||0) + .18; m.araMul = (m.araMul||0) - .08; }
    if (c.laws.krizHazir){ m.shipCost = (m.shipCost||0) - .15; m.araMul = (m.araMul||0) - .08; }
    /* FAZ 54: ambargo yalnız HEDEFİ vurur */
    if (c.targeted && c.targeted.ticAmbargo === e.id){
      m.eneMul = (m.eneMul||0) - .20;
      m.minMul = (m.minMul||0) - .20;
    }
    if (c.laws.savunmaPakti){
      m.capFlat = (m.capFlat||0) + 25;
      m.upMul = (m.upMul||0) - .20;
      m.crisisDmg = (m.crisisDmg||0) + .15;    // yalnız Sürü'ye karşı
    }
  }
  // yaptırım hedefi ağır bedel öder
  if (c.targeted.yaptirim === e.id){
    m.minMul = (m.minMul||0) - .25;
    m.eneMul = (m.eneMul||0) - .25;
    m.araMul = (m.araMul||0) - .25;
  }
  return m;
}
/* savaş yasağı kontrolü — declareWar buna bakar */
function councilBlocksWar(a, b){
  if (!councilExists()) return false;
  const c = G.council;
  if (c.laws.savasYasak && c.targeted.savasYasak === b.id && inCouncil(a)) return true;
  return false;
}
/* yasağı çiğneyen tüm konseyin düşmanı olur */
function councilPunish(breaker){
  if (!councilExists()) return;
  const c = G.council;
  for (const m of c.members){
    if (m === breaker.id) continue;
    const o = G.emps[m];
    if (!o || o.dead) continue;
    o.rel[breaker.id] = clamp(o.rel[breaker.id] - 45, -100, 100);
    remember(o, breaker.id, 'konseyIhlal');
    if (!o.war[breaker.id] && rnd() < .55){
      o._lastCB = {n:'Konsey Kararını Uygula'};
      warAuthorize(o, breaker, o._lastCB);
      declareWar(o, breaker);
      warAuthClear();
    }
  }
  c.members = c.members.filter(m => m !== breaker.id);
  if (breaker.id === 0) say('KONSEY KARARINI ÇİĞNEDİN — üyelikten atıldın ve konsey sana savaş açıyor', 'war');
  else say(breaker.name + ' konsey kararını çiğnedi — konsey ona karşı harekete geçti', 'war');
}

/* ---------- OYLAMA ---------- */
function startCouncilVote(kampanya){
  const c = G.council;
  if (!c || c.dead || c.vote) return;
  /* Parya yasası yalnızca gerçekten onursuz bir devlet varsa gündeme
     gelebilir — konseyin en ağır silahı keyfî kullanılmaz. */
  const paryaAday = (typeof pariahCandidate === 'function') ? pariahCandidate() : null;
  const krizVar = (typeof crisisActive === 'function') && crisisActive();
  const open = Object.keys(RESOLUTIONS).filter(k => {
    const R = RESOLUTIONS[k];
    if (k === 'parya'){
      /* FAZ 37: çoklu parya — aday zaten parya değilse önerilebilir */
      if (!paryaAday) return false;
      const map = (typeof pariahMap === 'function') ? pariahMap() : {};
      return !map[paryaAday.id];
    }
    if (k === 'birlesme') return krizVar && !c.laws.birlesme;
    if (k === 'savunmaPakti') return krizVar && !c.laws.savunmaPakti;
    if (R.hedefli) return true;                 // hedefliler tekrar önerilebilir
    return !c.laws[k];
  });
  if (!open.length) return;
  /* Konsey kurulduktan sonraki İLK oylama daima Evrensel Ticaret
     Standardı'dır — galaksinin ilk ortak sınavı. */
  /* ═══ FAZ 32: GÜNDEM KUYRUĞU ═══
     Rastgele sponsor kaldırıldı. Masaya, kuyrukta arkasında en çok
     diplomatik ağırlık biriken teklif gelir. Sponsor = ilk öneren. */
  const kuyruk = kampanya ? kampanya.agenda
    : ((typeof topAgenda === 'function') ? topAgenda() : null);
  let sponsor = (kampanya && kampanya.sponsor !== null && kampanya.sponsor !== undefined)
    ? G.emps[kampanya.sponsor]
    : (kuyruk ? G.emps[kuyruk.by] : null);
  if (sponsor && (sponsor.dead || sponsor.id === 0)) sponsor = null;
  /* Sponsorun mizacına göre tercih sırası */
  const sponsorTercih = (sp) => {
    if (!sp) return [];
    const P = (typeof personaOf === 'function') ? personaOf(sp) : null;
    const nm = P ? P.n : '';
    if (nm === 'Tüccar')       return ['ticaretStd','serbest','bilim'];
    if (nm === 'Pasifist')     return ['silahsiz','savasYasak','bilim','ticaretStd'];
    if (nm === 'Militarist')   return ['muhafiz','seferber','yaptirim'];
    if (nm === 'İzolasyonist') return ['yaptirim','muhafiz','silahsiz'];
    if (nm === 'Yayılmacı')    return ['bilim','seferber','serbest'];
    return ['bilim','ticaretStd'];
  };

  let key;
  if (kampanya && open.includes(kampanya.key)){
    key = kampanya.key;
    if (c.firstLaw === key) c.firstLaw = null;
    if (kuyruk) c.agenda = (c.agenda || []).filter(a => a !== kuyruk);
  }
  else if (c.firstLaw && open.includes(c.firstLaw)){ key = c.firstLaw; c.firstLaw = null; }
  /* Varoluşsal gündemler kuyruğu ezer */
  else if (krizVar && open.includes('birlesme')) key = 'birlesme';
  else if (paryaAday && open.includes('parya')) key = 'parya';
  else if (kuyruk && open.includes(kuyruk.key)){
    key = kuyruk.key;
    /* Masaya gelen teklif kuyruktan düşer */
    c.agenda = (c.agenda || []).filter(a => a !== kuyruk);
  }
  else {
    const tercih = sponsorTercih(sponsor).filter(k => open.includes(k));
    key = tercih.length ? tercih[0] : open[Math.floor(rnd()*open.length)];
  }
  const R = RESOLUTIONS[key];
  let target = null;
  if (key === 'parya' && paryaAday){
    target = paryaAday.id;
  } else if (R.hedefli){
    const cands = G.emps.filter(o=>!o.dead && !o.wild && !o.crisisSide &&
      (key === 'ihrac' ? c.members.includes(o.id) : true) && o.id !== c.president);
    if (!cands.length) return;
    if (key === 'ticAmbargo'){
      /* ═══ FAZ 55: AMBARGO ZİRVEYİ HEDEFLER ═══
         Ticaret ambargosu bir kıskançlık aracıdır: konsey, önünde
         koşan devleti frenlemek için kullanır. Bu yüzden hedef
         "en savaşçı" değil, SKORU EN YÜKSEK olan devlettir.
         (Faz 54 şartnamesinde istenmişti; genel hedefleme
          kuralına düşüyordu.) */
      cands.sort((a,b)=>{
        const sa = (typeof scoreCard === 'function' && scoreCard(a))
          ? scoreCard(a).toplam : totalPower(a);
        const sb2 = (typeof scoreCard === 'function' && scoreCard(b))
          ? scoreCard(b).toplam : totalPower(b);
        return sb2 - sa;
      });
    } else {
      // hedef: en çok savaş açan veya en güçlü dış imparatorluk
      cands.sort((a,b)=>{
        const wa = Object.values(a.war||{}).filter(Boolean).length;
        const wb = Object.values(b.war||{}).filter(Boolean).length;
        return (wb*40 + totalPower(b)/100) - (wa*40 + totalPower(a)/100);
      });
    }
    target = cands[0].id;
  }
  c.vote = {key, target, yes:[], no:[], speeches:[], done:false, age:0,
            sponsor: sponsor ? sponsor.id : null};
  /* Sponsor kendi teklifine oy verir */
  if (sponsor) c.vote.yes.push(sponsor.id);
  /* Kuyrukta bu teklifi destekleyenler de evet der — kampanya
     dönemi boyunca fikirlerini değiştirmezler. */
  if (kuyruk && kuyruk.key === key){
    for (const b of kuyruk.backers){
      if (b === 0 || (sponsor && b === sponsor.id)) continue;
      if (!G.emps[b] || G.emps[b].dead) continue;
      if (c.vote.yes.indexOf(b) < 0 && c.vote.no.indexOf(b) < 0) c.vote.yes.push(b);
    }
  }

  // AI üyeleri oy verir ve konuşur
  for (const id of c.members){
    if (id === 0) continue;
    if (sponsor && id === sponsor.id) continue;      // teklifi veren zaten evet dedi
    const o = G.emps[id];
    if (!o || o.dead) continue;
    /* HEGEMONYA: vasal bağımsız oy kullanamaz — senyörü adına susar,
       ağırlığı finishCouncilVote'ta senyörün oyuna eklenir. */
    if (typeof isVassal === 'function' && isVassal(o) &&
        c.members.includes(o.overlord)) continue;
    const p = aiProfile(o);
    let want = .35;
    const lean = R.lean || {};
    for (const k in lean) want += (p[k] || 0) * lean[k] * .55;

    /* ── GİZLİ MİZAÇ OYU ──
       İzolasyonistler ortak standartlara ilke gereği HAYIR der;
       tüccarlar ticaret yasalarını coşkuyla destekler. */
    const P = (typeof personaOf === 'function') ? personaOf(o) : null;
    if (P && key === 'ticaretStd') want += P.tradeVote;
    if (P && P.n === 'İzolasyonist' && !R.hedefli) want -= .30;
    if (P && P.n === 'Militarist' && key === 'silahsiz') want -= .60;
    if (P && P.n === 'Pasifist'   && key === 'silahsiz') want += .45;

    /* ═══ FAZ 35: KRİZ TEPKİSİ — İNAT VE PANİK ═══
       Pasifist ve bilimci tehdidi hemen görür. Militarist ve
       izolasyonist "biz kendi başımıza hallederiz" der — ta ki
       Sürü kapıya dayanana kadar. */
    if (key === 'savunmaPakti' || key === 'birlesme'){
      const tehlike = (typeof crisisProximity === 'function')
        ? crisisProximity(o) : 0;

      if (P){
        if (P.n === 'Pasifist')      want += 1.10;   // hemen evet
        else if (P.n === 'Tüccar')   want += .45;
        else if (P.n === 'Militarist')   want -= .95;   // "orduma güvenirim"
        else if (P.n === 'İzolasyonist') want -= 1.15;  // "bizi ilgilendirmez"
      }
      /* Bilimci profil tehdidi anlar.
         (Bu blokta profil değişkeni `p` — `prof` DEĞİL. Hotfix 23.1'de
          aynı türden bir kapsam hatası siyah ekrana yol açmıştı.) */
      if (p.sci > .6) want += .55;

      /* ── PANİK ──
         tehlike: 0 = uzak, 1 = sınırda, 2 = sistemim yutuldu.
         İnat ne kadar sertse panik o kadar sert kırılır. */
      if (tehlike >= 2) want += 3.0;               // gezegenim yutuldu
      else if (tehlike >= 1) want += 1.8;          // Sürü sınırımda
      else if (G.crisis && G.crisis.stage >= 3) want += 1.0;  // galaksi yanıyor

      /* Kendi filosu Sürü karşısında eriyorsa da akıllanır */
      if (typeof totalPower === 'function' && G.crisisId !== undefined){
        const sr = G.emps[G.crisisId];
        if (sr && totalPower(sr) > totalPower(o) * 2.2) want += .9;
      }
    }

    /* ═══ FAZ 32: SÜPER SİLAH YASAĞI — HAYATTA KALMA REFLEKSİ ═══
       Colossus'u olan ya da yapmayı planlayan asla evet demez;
       düşmanında Colossus olan çaresizce ister. */
    if (key === 'colYasak'){
      const benimVar = G.fleets.some(f => f.e === o.id && f.ships.length &&
        typeof isColossus === 'function' && isColossus(f));
      if (benimVar || (o.colossusReserve || 0) > 0) want -= 1.5;
      else {
        let tehdit = false;
        for (const f of G.fleets){
          if (!f.ships.length || f.e === o.id) continue;
          if (typeof isColossus !== 'function' || !isColossus(f)) continue;
          if (o.war[f.e] || (o.rel[f.e] || 0) < -30){ tehdit = true; break; }
        }
        if (tehdit) want += 1.2;
        if (P && P.n === 'Pasifist') want += .45;
        if (P && P.n === 'Militarist') want -= .35;
      }
    }

    /* FAZ 16: PARYA oylaması — tehdit puanı yüksekse kimse itiraz etmez */
    if (key === 'parya' && target !== null && G.emps[target]){
      const hedef = G.emps[target];
      const th = hedef.threat || 0;
      want += clamp(th / 90, 0, 1.1);                 // suç ne kadar açıksa o kadar evet
      if (o.war[hedef.id]) want += .45;               // düşmanımı cezalandırmak iyi
      if (o.ally[hedef.id]) want -= .9;               // müttefiğimi koruyorum
      if (typeof isVassal === 'function' && isVassal(hedef) &&
          hedef.overlord === o.id) want -= 1.2;       // vasalım, ben korurum
      if (P && P.n === 'Pasifist') want += .25;
      if (P && P.n === 'Tüccar') want -= .15;         // ticaret kesilmesi zararına
    }

    /* ── KRİZE KARŞI BİRLEŞME: varoluşsal tehdit mizaçları büker ──
       Ortak düşman herkesi masaya çeker, ama farklı sebeplerle. */
    if (key === 'birlesme' && P){
      if (P.n === 'İzolasyonist'){
        /* Sınır açmak doktrinlerine aykırı — ilkesel direnç. Ama
           kriz onların da kapısını çalıyorsa direnç kırılır. */
        want -= .45;
        if (typeof crisisPressure === 'function') want += crisisPressure(o) * .85;
      }
      else if (P.n === 'Militarist'){
        /* "Bu savaş bizim savaşımız" — düşman varken birleşmeyi sever,
           ama komuta bağımsızlığından ödün vermek istemez. */
        want += .30;
        if (typeof crisisPressure === 'function') want += crisisPressure(o) * .60;
        /* Aktif bir savaşı varsa onu bırakmak istemez */
        let acikSavas = 0;
        for (const w in o.war) if (o.war[w] && G.emps[w] && !G.emps[w].crisisSide) acikSavas++;
        want -= acikSavas * .28;
      }
      else if (P.n === 'Pasifist')  want += .40;
      else if (P.n === 'Tüccar')    want += .25;   // savaş ticareti bozar
      else if (P.n === 'Yayılmacı') want += .10;
    }

    /* Onursuz bir imparatorluğun önerisine güven duyulmaz */
    if (target !== null && typeof honorOf === 'function'){
      const th = honorOf(G.emps[target]);
      if (th < -25) want += .25;                    // itibarsız hedefe yaptırım kolay
    }
    if (target === id) want -= .9;                     // kendini hedefleyen karara hayır
    if (target !== null && o.war[target]) want += .35; // düşmanına yaptırım iyi gelir
    if (target !== null && o.ally[target]) want -= .5;
    /* ── KESİN İLKE ──
       İzolasyonist bir imparatorluk ortak standart yasalarına ilke
       gereği HAYIR der; bu bir olasılık değil, karakterdir. */
    /* ═══ FAZ 32: OY MANİPÜLASYONU ═══
       Rüşvet ve şantaj oyuncunun tarafına çeker. Rüşvet ölçülü,
       şantaj sert — ama ifşa riski taşır. */
    if (kampanya){
      /* ÖLÇÜM: tipik oylamada evet/hayır farkı toplam ağırlığın
         %48'i. Eski katsayılar (.85 / 1.10) bir üyeyi bile zor
         çeviriyordu. Manipülasyon gerçekten belirleyici olmalı —
         ama pahalı ve riskli olduğu için dengeli kalıyor. */
      const rusvet = kampanya.bribed[id];
      if (rusvet) want += rusvet * 1.6;
      const sn = kampanya.blackmailed.find(b =>
        (b.id !== undefined ? b.id : b) === id);
      if (sn) want += (sn.yon !== undefined ? sn.yon : 1) * 2.2;
    }

    /* FAZ 35: ultimatoma boyun eğen pakta evet demek zorunda */
    if ((key === 'savunmaPakti' || key === 'birlesme') && o._paktSoz !== undefined)
      want += 3.5;

    let yes;
    if (P && P.n === 'İzolasyonist' && (key === 'ticaretStd' || key === 'serbest')) yes = false;
    else if (target === id) yes = false;                // kimse kendini hedefleyene evet demez
    else yes = rnd() < clamp(want, .05, .95);
    (yes ? c.vote.yes : c.vote.no).push(id);
    if (c.vote.speeches.length < 4 && rnd() < .6)
      c.vote.speeches.push({id, txt: aiSpeech(o), yes});
  }
  if (c.members.includes(0) && G.emps[0] && !G.emps[0].dead) UI.councilVote();
  else finishCouncilVote();
}
function finishCouncilVote(){
  const c = G.council;
  if (!c || !c.vote || c.vote.done) return;
  c.vote.done = true;
  let yw = 0, nw = 0;
  /* Senyörün oyu, konseydeki vasallarının ağırlığını da taşır */
  const hg = id => voteWeight(G.emps[id]) +
    ((typeof hegemonyWeight === 'function') ? hegemonyWeight(G.emps[id]) : 0);
  for (const id of c.vote.yes) yw += hg(id);
  for (const id of c.vote.no)  nw += hg(id);
  // Evrensel Barış civic'i tek başına karar geçirir
  const uni = c.vote.yes.some(id => hasCivic(G.emps[id],'universal'));
  const passed = uni || yw > nw;
  const R = RESOLUTIONS[c.vote.key];
  /* FAZ 48: oyuncu tasarısı reddedildiyse bedel öder */
  if (!passed && c.vote.sponsor !== null && c.vote.sponsor !== undefined){
    const sp = G.emps[c.vote.sponsor];
    if (sp && !sp.dead && sp._billPending &&
        sp._billPending.key === c.vote.key && typeof billRejected === 'function'){
      billRejected(sp, c.vote.key);
      delete sp._billPending;
    }
  } else if (passed){
    const sp2 = G.emps[c.vote.sponsor];
    if (sp2 && sp2._billPending) delete sp2._billPending;
  }
  if (passed){
    if (R.hedefli){
      /* ═══ FAZ 56: DİNAMİK AMBARGO HEDEFİ ═══
         Ticaret Ambargosu 3 aylık kampanya boyunca oylanır. O süre
         içinde skor lideri değişebilir — eski lidere vurmak
         ambargonun amacını (zirveyi frenlemek) boşa çıkarır.
         Bu yüzden hedef, tasarı MECLİSTEN GEÇTİĞİ AN yeniden
         hesaplanır. Diğer hedefli tasarılar oylanan hedefte kalır:
         orada oyuncular bilinçli bir devlete oy vermiştir. */
      if (c.vote.key === 'ticAmbargo'){
        const adaylar = G.emps.filter(o => !o.dead && !o.wild && !o.crisisSide &&
          o.id !== c.president);
        if (adaylar.length){
          adaylar.sort((a, b) => {
            const sa = (typeof scoreCard === 'function' && scoreCard(a))
              ? scoreCard(a).toplam : totalPower(a);
            const sb2 = (typeof scoreCard === 'function' && scoreCard(b))
              ? scoreCard(b).toplam : totalPower(b);
            return sb2 - sa;
          });
          const yeni = adaylar[0].id;
          if (yeni !== c.vote.target){
            const eski = G.emps[c.vote.target];
            say('🚫 Ambargo hedefi güncellendi — kampanya sırasında ' +
                adaylar[0].name + ' zirveye çıktı' +
                (eski ? ' (' + eski.name + ' yerine)' : ''), 'sci');
            c.vote.target = yeni;
          }
        }
      }
      c.targeted[c.vote.key] = c.vote.target;
      if (c.vote.key === 'parya'){
        if (typeof addPariah === 'function') addPariah(c.vote.target);  // FAZ 37
        const t = G.emps[c.vote.target];
        if (t){
          /* Parya ilan edilen devletin tüm ticaret anlaşmaları düşer */
          for (const o of G.emps){
            if (o.dead || o.wild || o.id === t.id) continue;
            if (typeof breakPact === 'function') breakPact(t, o);
            if (typeof remember === 'function') remember(t, o.id, 'yaptirim');
          }
          t._trAt = -1;
          if (t.id === 0)
            say('GALAKTİK PARYA İLAN EDİLDİN — tüm ticaretin kesildi, üretimin −%30', 'war');
          else
            say('GALAKTİK PARYA: ' + t.name + ' galaksiden dışlandı', 'war');
        }
      }
      if (c.vote.key === 'ihrac'){
        c.members = c.members.filter(m => m !== c.vote.target);
      }
    } else {
      c.laws[c.vote.key] = true;
      if (c.vote.key === 'birlesme' && typeof applyUnity === 'function') applyUnity();
    }
    G.emps.forEach(x=>{ if (!x.dead) recalcMods(x); });
  }
  if (c.members.includes(0)){
    const tName = c.vote.target !== null && G.emps[c.vote.target] ? ' · ' + G.emps[c.vote.target].name : '';
    const spName = (c.vote.sponsor !== null && G.emps[c.vote.sponsor])
      ? G.emps[c.vote.sponsor].name + ' teklif etti · ' : '';
    say('Konsey: ' + spName + R.n + tName + ' — ' + (passed ? 'KABUL' : 'RED') +
        ' (' + Math.round(yw) + '/' + Math.round(yw+nw) + ' ağırlık)', passed?'win':'');
  }
  c.vote = null;
}

/* ---------- DÖNEM VE BAŞKANLIK ---------- */
/* ═══════════════════════════════════════════════════════════════════
   GALAKTİK KONSEY'İN DOĞUŞU
   100. turda galaksi kendiliğinden masaya oturur. Kimse kurmasa da
   konsey doğar; kurucu, o an diplomatik ağırlığı en yüksek olandır.
   Sürgün ve Korsan Krallığı doktrinleri dışarıda kalır.
   ═══════════════════════════════════════════════════════════════════ */
function foundCouncilByConvention(){
  if (councilExists()) return false;
  if (typeof councilPaceYears === 'function' && councilPaceYears() === 0) return false;

  const uygun = G.emps.filter(o =>
    !o.dead && !o.wild &&
    !hasCivic(o,'exile') && !hasCivic(o,'pirateking') &&
    G.emps.some(x => !x.dead && !x.wild && x.id !== o.id && o.contact[x.id]));
  if (uygun.length < 3) return false;               // meclis için en az üç taraf

  uygun.sort((a,b) => voteWeight(b) - voteWeight(a));
  const baskan = uygun[0];

  G.council = {
    name: (typeof councilName === 'function') ? councilName() : 'Galaktik Konsey',
    founder: baskan.id, members: uygun.map(o => o.id),
    laws: {}, targeted: {}, treasury: 0,
    president: baskan.id, terms: {}, termAge: 0,
    voteIn: 2, vote: null, dead: false, byConvention: true
  };
  G.council.terms[baskan.id] = 1;

  say('GALAKTİK KONSEY KURULDU — ' + G.council.name + ' · ' +
      uygun.length + ' üye · başkan ' + baskan.name, 'win');
  if (typeof UI !== 'undefined' && UI.councilFounded) UI.councilFounded(baskan);

  /* İlk yasa gündemi hazır: Evrensel Ticaret Standardı */
  G.council.firstLaw = 'ticaretStd';
  return true;
}

function councilTick(){
  if (!councilExists()){
    /* Turu gelen konsey her hâlükârda doğar; gelmediyse pasifist bir
       imparatorluk erken kurabilir (aiTryFoundCouncil). */
    if ((G.memAge || 0) >= COUNCIL_FOUND_TURN){
      if (!foundCouncilByConvention()) aiTryFoundCouncil();
    } else {
      aiTryFoundCouncil();
    }
    return;
  }
  const c = G.council;
  c.members = c.members.filter(m => G.emps[m] && !G.emps[m].dead);
  if (c.members.length < 2){ c.dead = true; return; }
  if (typeof agendaTick === 'function') agendaTick();   // FAZ 32: gündem kuyruğu

  // Konsey Muhafızları: hazine
  if (c.laws.muhafiz){
    for (const m of c.members){
      const o = G.emps[m];
      if (!o || o.dead) continue;
      const give = Math.min(6, o.res.ala);
      o.res.ala -= give; c.treasury += give;
    }
  }
  // Silahsızlanma ihlali
  if (c.laws.silahsiz){
    for (const m of c.members){
      const o = G.emps[m];
      if (!o || o.dead) continue;
      if (fleetUsage(o) > o.cap){
        for (const x of c.members){
          if (x === m) continue;
          const q = G.emps[x];
          if (q) q.rel[m] = clamp(q.rel[m] - 3, -100, 100);
        }
        if (m === 0) say('Silahsızlanma antlaşmasını aşıyorsun — konsey rahatsız', 'war');
      }
    }
  }
  /* ═══ FAZ 51: BAŞKANLIK DÖNEMİ 15 YIL ═══
     Daimi hükümdarlık ilan edilmişse seçim yapılmaz — taht
     sabittir ve Diplomatik Hegemonya zaferinin ön şartı sağlanır. */
  c.termAge = (c.termAge || 0) + 1;
  if (c.permanent !== undefined && c.permanent !== null){
    c.president = c.permanent;
    c.termAge = 0;
  }
  else if (c.termAge >= PRESIDENT_TERM){
    c.termAge = 0;
    let best = c.members[0], bw = -1;
    for (const m of c.members){
      const w = voteWeight(G.emps[m]);
      if (w > bw){ bw = w; best = m; }
    }
    const changed = best !== c.president;
    c.president = best;
    c.terms[best] = (c.terms[best] || 0) + 1;
    if (c.members.includes(0)){
      const nm = G.emps[best] ? G.emps[best].name : '?';
      say('Konsey başkanlığı: ' + nm + (best===0?' (sen)':'') +
          ' · ' + c.terms[best] + '. dönem', best===0?'win':'');
    }
    if (best === 0 && typeof checkVictory === 'function') checkVictory(G.p, 'council');
  }
  // açık oylama zaman aşımı — oyuncu oy kullanmazsa 24 ayda kapanır
  if (c.vote && !c.vote.done){
    c.vote.age = (c.vote.age || 0) + 1;
    if (c.vote.age > 24) finishCouncilVote();
  }
  // oylama zamanı (ay sayacı — gün senkronuna bağlı değil)
  if (!c.vote){
    c.voteIn = (c.voteIn === undefined ? 12 : c.voteIn) - 1;
    /* ═══ FAZ 32: KAMPANYA DÖNEMİ ═══
       Oylama iki aşamalı: önce gündem ilan edilir ve 3 ay kampanya
       yürütülür (rüşvet/şantaj penceresi), sonra oylar toplanır. */
    if (c.campaign){
      if (typeof aiCampaignTick === 'function') aiCampaignTick();  // FAZ 33
      c.campaign.left--;
      if (c.campaign.left <= 0){
        const kmp = c.campaign;
        c.campaign = null;
        startCouncilVote(kmp);
      }
    } else if (c.voteIn <= 0){
      c.voteIn = Math.max(6, councilPaceMonths());
      prepareCouncilVote();
    }
  }
  // AI'lar ara ara katılır — pasifistler daha istekli
  for (const o of G.emps){
    if (o.dead || o.wild || inCouncil(o)) continue;
    if (RACES[o.race].dip <= .02) continue;
    if (hasCivic(o,'exile') || hasCivic(o,'pirateking')) continue;
    if (o.id === 0) continue;
    const pmil = (o.ethics && o.ethics.mil) || 0;
    const eager = .04 + (pmil < 0 ? .10 : 0) + (aiProfile(o).dip * .06);
    if (rnd() < eager){
      joinCouncil(o);
      if (c.members.includes(0)) say(o.name + ' Galaktik Konsey\'e katıldı');
    }
  }
}

/* Konsey Hâkimiyeti zaferi için ilerleme */
function councilDominance(e){
  if (!councilExists()) return 0;
  const c = G.council;
  const terms = (c.terms && c.terms[e.id]) || 0;
  const share = c.members.length ? voteWeight(e) / c.members.reduce((a,m)=>a+voteWeight(G.emps[m]),0) : 0;
  return Math.min(terms/3, share/.45);
}


/* ═══════════════════════════════════════════════════════════════════
   FAZ 1 — ONUR/GÜVEN ENDEKSİ, CASUS BELLI VE SOĞUK SAVAŞ
   ═══════════════════════════════════════════════════════════════════ */

/* Güven endeksi: −100 (kan davası) … +100 (kardeşlik) */
function trustOf(e, id){
  if (!e || !e.mem || !e.mem[id]) return 0;
  let sum = 0;
  for (const m of e.mem[id]) sum += m.v;
  /* ═══ FAZ 48: DİPLOMATİK AHLAK ═══
     DÜRÜST devletin güven tavanı yükselir (sözü daha çok değer
     taşır); SAHTEKÂR devlete karşı başlangıç güveni düşüktür. */
  const hedef = G.emps[id];
  const tavan = 100 + ((hedef && hedef.mods && hedef.mods.trustCap) || 0);
  const taban = ((hedef && hedef.mods && hedef.mods.trustStart) || 0);
  return clamp(sum + taban, -100, tavan);
}
function grudgeOf(e, id){ return Math.max(0, -trustOf(e, id)); }

/* ONUR: galaksinin bu imparatorluk hakkındaki ORTAK kanaati.
   Sözünde duran yükselir, ihanet eden çöker. */
function honorOf(e){
  if (!e) return 0;
  if (e.wild || e.crisisSide) return 0;          // krizin onuru yoktur
  /* ÖNEMLİ: yalnızca HAKKINDA KANAATİ OLAN imparatorluklar sayılır.
     Eskiden tarafsızlar da ortalamaya giriyordu ve tek bir ihanet
     (−95) beş imparatorluklu galakside −19'a kadar sulanıyordu;
     onur pratikte hiç kıpırdamıyordu. Artık kanaat sahipleri
     üzerinden ortalanır, ama tek bir öfkeli komşu tüm galaksiyi
     temsil etmesin diye payda en az 2 kabul edilir. */
  let sum = 0, n = 0;
  for (const o of G.emps){
    if (o.dead || o.wild || o.id === e.id) continue;
    const t = trustOf(o, e.id);
    if (t === 0) continue;
    sum += t; n++;
  }
  if (!n) return 0;
  return Math.round(sum / Math.max(2, n));
}

/* Arayüzde gösterilecek en ağır anılar */
function topMemories(e, id, n){
  if (!e || !e.mem || !e.mem[id]) return [];
  return e.mem[id].slice()
    .sort((a,b)=>Math.abs(b.v) - Math.abs(a.v))
    .slice(0, n || 3)
    .map(m => ({txt: (typeof MEM_KINDS !== 'undefined' && MEM_KINDS[m.k]) ? MEM_KINDS[m.k].n : m.k,
                v: Math.round(m.v)}));
}

/* İki imparatorluk kaç aydır sınır teması yaşıyor? */
function frictionMonths(aId, bId){
  if (!G.friction) return 0;
  return Math.max(G.friction[aId + '_' + bId] || 0, G.friction[bId + '_' + aId] || 0);
}

/* ─── SOĞUK SAVAŞ ───
   İttifak bozulduktan sonra taraflar 3 tur (ay) birbirine savaş
   açamaz. Bu süre oyuncuya hazırlık ve diplomatik onarım şansı verir. */
const COLD_WAR_TURNS = 3;
function setColdWar(a, b, turns){
  a.coldWar = a.coldWar || {}; b.coldWar = b.coldWar || {};
  const until = (G.memAge || 0) + (turns || COLD_WAR_TURNS);
  a.coldWar[b.id] = until; b.coldWar[a.id] = until;
}
function inColdWar(a, b){
  return !!(a.coldWar && a.coldWar[b.id] > (G.memAge || 0));
}
function coldWarLeft(a, b){
  if (!inColdWar(a, b)) return 0;
  return a.coldWar[b.id] - (G.memAge || 0);
}

/* ─── CASUS BELLI ───
   AI sebepsiz savaş açamaz. Sebep bu kaynaklardan gelir. */
function casusBelliOf(e, o){
  if (!e || !o) return null;

  /* ═══ FAZ 40: YENİDEN BİRLEŞME ═══
     Balkanizasyonla ayrılan iki taraf birbirini meşru saymaz.
     Ardıl devlet "asıl varisim ben" der, ana gövde "isyancı
     eyaletim" der. Bu CB kalıcıdır — barış imzalansa bile
     yeniden savaş açmak için gerekçe hazır bekler. */
  if ((e.sundered && e.sundered === o.id) || (o.sundered && o.sundered === e.id))
    return {k:'reunify', w:1.20, n:'Yeniden Birleşme'};

  /* FAZ 40: ZAFER GANİMETİ — Özgürlük Savaşı'nın galipleri
     yıkılmış zalimden toprak talep edebilir (10 yıllık pencere). */
  {
    const ra = G.rebelAlliance;
    if (ra && ra.done && ra.wonAt !== undefined && ra.target === o.id &&
        (G.memAge || 0) - ra.wonAt <= 120 &&
        (ra.members.indexOf(e.id) >= 0 || e.id === 0))
      return {k:'ganimet', w:.95, n:'Zafer Ganimeti'};
  }

  /* FAZ 29: Geç oyunda derinleşen düşmanlık başlı başına gerekçedir.
     Kutuplaşma ilişkiyi −70'in altına indirmişse "Uzlaşmaz Husumet"
     savaş nedeni doğar — galaksi donmaz. */
  if ((G.year || 2210) - 2210 >= POLARIZE_YEAR && (e.rel[o.id] || 0) <= -70)
    return {k:'husumet', w:.75, n:'Uzlaşmaz Husumet'};

  let border = false;
  for (const s of G.sys){
    if (s.owner !== o.id) continue;
    for (const l of s.lanes) if (G.sys[l].owner === e.id){ border = true; break; }
    if (border) break;
  }
  /* Kovan zihni ve Sürgün doktrini: diplomasi kavramları yok,
     sınır komşuluğu tek başına yeterli sebeptir. */
  const noDiplo = (RACES[e.race] && RACES[e.race].dip <= .02) || hasCivic(e, 'exile');
  if (noDiplo && border) return {k:'dogal', w:.85, n:'Yayılma Doktrini'};

  const g  = grudgeOf(e, o.id);
  const fm = frictionMonths(e.id, o.id);
  const mem = (e.mem && e.mem[o.id]) || [];
  const has = k => mem.some(m => m.k === k);

  /* En ağır sebepten en hafife */
  if (has('ihanet'))      return {k:'ihanet',    w:1.30, n:'İhanetin Bedeli'};
  /* FAZ 4: ortaya çıkan komplo, çiğnenen sözden bile ağırdır —
     entrikacı yıllarca sinsi davranmıştır, affı yoktur. */
  /* Sahte bayrak ifşası, ihanetten bile ağır sayılır: yalnız saldırmadı,
     suçunu masum birine yıkmaya çalıştı. */
  if (has('sahteBayrak')) return {k:'sahteBayrak', w:1.35, n:'İstihbarat Sabotajı — Sahte Bayrak'};
  if (has('komplo'))      return {k:'komplo',    w:1.20, n:'İstihbarat Sabotajı'};
  if (has('paktBozdu'))   return {k:'yalanci',   w:1.10, n:'Çiğnenen Söz'};
  if (has('sistemAldi'))  return {k:'irredanta', w:1.00, n:'Kayıp Topraklar'};

  /* ── ÖNLEYİCİ MÜDAHALE (Megayapı Kıskançlığı) ──
     Bir devlet galaksiyi değiştirecek bir harika inşa ediyorsa,
     rakipleri tamamlanmadan durdurmak ister. Militarist ve
     Yayılmacı mizaçlar bu baskıya en açık olanlardır. */
  if (typeof megaBuilds === 'function'){
    const mb = megaBuilds(o);
    if (mb.length){
      const P = (typeof personaOf === 'function') ? personaOf(e) : null;
      const mz = P ? (P.n === 'Militarist' ? 1.00 :
                      P.n === 'Yayılmacı'  ? .85  :
                      P.n === 'Tüccar'     ? .55  :
                      P.n === 'İzolasyonist'? .45 : .30) : .55;
      /* Tamamlanmaya ne kadar yakınsa panik o kadar büyük */
      let yakinlik = 0;
      for (const w of mb) yakinlik = Math.max(yakinlik, 1 - (w.left / Math.max(1, w.tot)));
      const agirlik = .55 + mz * .60 + yakinlik * .35;
      if (agirlik >= .78)
        return {k:'onleyici', w: Math.min(1.45, agirlik), n:'Önleyici Müdahale'};
    }
  }

  if (has('konseyIhlal')) return {k:'konsey',    w:.95, n:'Konsey Kararını Uygula'};
  if (has('sabotaj'))     return {k:'sabotaj',   w:.85, n:'Gizli Savaşa Karşılık'};
  if (g >= 35)            return {k:'kin',       w:.80, n:'Kan Davası'};
  if (fm >= 18 && e.rel[o.id] < -20) return {k:'sinir', w:.70, n:'Sınır Anlaşmazlığı'};
  if (has('kervanYagma') || has('yaptirim')) return {k:'korsan', w:.60, n:'Ticaret Yollarını Koru'};
  if (g >= 15 && fm >= 8) return {k:'gerginlik', w:.55, n:'Süregelen Gerginlik'};

  /* YAŞAM ALANI KURALI (%85)
     Yerleşecek yeri kalmamış imparatorluk, kendisinden en az %85
     büyüklükteki komşusunun toprağına göz diker. */
  if (border && typeof colonizeTargets === 'function'){
    const room = colonizeTargets(e).length;
    /* MİZAÇ: taban eşik %85; militarist bunu %59,5'e çeker ve elinde
       hâlâ bir yerleşim yeri varken bile talepte bulunabilir. */
    const P = (typeof personaOf === 'function') ? personaOf(e) : null;
    const esik = 0.85 * (P ? P.lifeSpace : 1);
    const tol  = P ? P.roomTol : 0;
    if (room <= tol && sysCount(o) >= sysCount(e) * esik && e.rel[o.id] < 10)
      return {k:'yasamalani', w:.62 + (P && P.warBias > 0 ? .08 : 0), n:'Yaşam Alanı Talebi'};
  }

  /* İç politika da bir savaş sebebidir */
  if (e.factions){
    for (const f of e.factions)
      if (f.k === 'asker' && f.pow >= 45 && f.mood <= 30 && border)
        return {k:'ordu', w:.65, n:'Ordunun Talebi'};
  }
  return null;
}

/* Savaş iştahı: fırsat + sebep + kimlik − frenler */
function warAppetite(e, o){
  const prof = aiProfile(e);
  const ratio = totalPower(e) / (totalPower(o) + 1);
  const opportunity = clamp((ratio - 1.05) * .85, -1, 1.1);

  const cb = casusBelliOf(e, o);
  const cause = cb ? cb.w : 0;
  const grudge = grudgeOf(e, o.id) / 100;

  let identity = prof.war * .50;
  if (e.factions) for (const f of e.factions){
    if (f.k === 'asker'  && f.mood < 40) identity += (f.pow / 100) * .45;
    if (f.k === 'halk'   && f.mood > 65) identity -= .25;
    if (f.k === 'tuccar' && f.mood > 60) identity -= .20;
  }

  let brake = 0;
  if (typeof exhOf === 'function') brake += (exhOf(e, o.id) / 100) * .85;
  let openWars = 0;
  for (const w in e.war) if (e.war[w]) openWars++;
  if (openWars >= 2) brake += .55;
  if (e.pact && e.pact[o.id]) brake += .35;
  if (e.nap && e.nap[o.id] > G.day) brake += 1.30;
  if ((e.inc && e.inc.ene || 0) < 0) brake += .40;
  const _P = (typeof personaOf === 'function') ? personaOf(e) : null;
  if (honorOf(e) > 25) brake += .30 * (_P ? _P.honorCare : 1);
  if (typeof councilExists === 'function' && councilExists() &&
      inCouncil(e) && inCouncil(o)) brake += .45;
  /* Müttefike saldırmak neredeyse imkânsız — AI önce ittifakı bozar */
  if (e.ally[o.id]) brake += 2.20 - Math.min(1.1, grudge * 1.4);

  /* ═══ FAZ 40: GANİMET İŞTAHI ═══
     İki ayrı açgözlülük kaynağı: */
  let ganimet = 0;

  /* 1. YENİDEN BİRLEŞME — ayrılmış kardeşe karşı ebedi dava.
     Uysal bir ardıl devlet istemiyoruz; iki taraf da diğerini
     yutmak ister. */
  if ((e.sundered && e.sundered === o.id) || (o.sundered && o.sundered === e.id)){
    ganimet += .70;
    if (_P && _P.n === 'Militarist') ganimet += .30;
  }

  /* 2. ZAFER GANİMETİ — Özgürlük Savaşı biter bitmez eski
     isyancılar yıkılmış zalimin üstüne çullanır. Fırsat penceresi
     10 yıl; militarist ve yayılmacı karakterler daha hevesli. */
  const ra = G.rebelAlliance;
  if (ra && ra.done && ra.wonAt !== undefined && ra.target === o.id){
    const gecen = (G.memAge || 0) - ra.wonAt;
    if (gecen <= 120 && (ra.members.indexOf(e.id) >= 0 || e.id === 0)){
      const taze = 1 - gecen / 120;             // zamanla soğur
      let istah = .55 * taze;
      if (_P){
        if (_P.n === 'Militarist') istah *= 1.9;
        else if (_P.n === 'Yayılmacı') istah *= 1.7;
        else if (_P.n === 'Tüccar') istah *= .8;
        else if (_P.n === 'Pasifist') istah *= .25;
      }
      if (prof.war > .6) istah *= 1.4;
      ganimet += istah;
    }
  }

  return {score: opportunity * .55 + cause * .90 + grudge * .55 + identity +
                 ganimet - brake,
          ratio, cause, cb, grudge, brake, ganimet};
}

/* Hafızadaki yara savaş HEDEFİNİ belirler */
function pickCasusBelli(e, o){
  const mem = (e.mem && e.mem[o.id]) || [];
  const has = k => mem.some(m => m.k === k);

  /* ── BOYUN EĞDİRME ──
     Yok etmek yerine boyunduruk altına almak: ezici üstünlük varken,
     hedef hâlâ yaşayabilir durumdayken ve etki yeterliyken tercih
     edilir. Militarist hegemonya kurmayı, Tüccar vergi almayı sever;
     ihanet gibi affedilmez suçlarda ise yok etme öne geçer. */
  if (!has('ihanet') && !has('sahteBayrak') && (e.res.etk || 0) >= 45){
    const oran = totalPower(e) / (totalPower(o) + 1);
    if (oran > 1.6 && sysCount(o) >= 2){
      const P = (typeof personaOf === 'function') ? personaOf(e) : null;
      let istek = .35;
      if (P){
        if (P.n === 'Militarist') istek += .30;
        else if (P.n === 'Tüccar') istek += .28;
        else if (P.n === 'Yayılmacı') istek += .10;
        else if (P.n === 'İzolasyonist') istek -= .20;
      }
      /* Zaten vasalı çoksa daha da hevesli olur (hegemonya hırsı) */
      if (typeof vassalsOf === 'function') istek += vassalsOf(e).length * .10;
      if (rnd() < clamp(istek, 0, .80)) return 'boyun';
    }
  }

  /* ── BOYUN EĞDİRME ──
     Ezici üstünlük varsa yok etmek yerine boyunduruk altına almak
     daha kârlıdır: vergi, kapasite ve konseyde ikinci oy demektir.
     Ama pahalıdır (45 etki) ve yalnızca gerçekten güçlüyken mantıklı. */
  const oran = totalPower(e) / (totalPower(o) + 1);
  if (oran > 1.8 && (e.res.etk || 0) >= 45 && !isVassal(o) && !isVassal(e)){
    const P = (typeof personaOf === 'function') ? personaOf(e) : null;
    let istek = .35;
    if (P){
      if (P.n === 'Yayılmacı') istek += .30;      // hegemonya kurmayı sever
      else if (P.n === 'Tüccar') istek += .25;    // vergi cazip
      else if (P.n === 'Militarist') istek -= .05;
      else if (P.n === 'İzolasyonist') istek -= .20;
      else if (P.n === 'Pasifist') istek += .15;  // yok etmektense boyun eğdir
    }
    /* İhanete uğramışsan affetmezsin, yok edersin */
    if (has('ihanet') || has('sahteBayrak')) istek -= .45;
    if (rnd() < clamp(istek, 0, .75)) return 'boyun';
  }

  /* ── BOYUN EĞDİRME ──
     Yok etmek pahalı ve itibar yakıcıdır; boyunduruk hem kalıcı gelir
     hem konseyde oy demektir. Güçlü ve hegemonyacı devletler bunu
     yok etmeye tercih eder. */
  if (typeof isVassal === 'function' && !isVassal(o) &&
      !has('ihanet') && !has('sahteBayrak')){
    const oran = totalPower(e) / (totalPower(o) + 1);
    const P = (typeof personaOf === 'function') ? personaOf(e) : null;
    let hevesli = .30;
    if (P){
      if (P.n === 'Militarist')      hevesli += .30;   // boyunduruk sever
      else if (P.n === 'Tüccar')     hevesli += .25;   // vergi sever
      else if (P.n === 'Yayılmacı')  hevesli += .15;
      else if (P.n === 'Pasifist')   hevesli -= .15;
      else if (P.n === 'İzolasyonist') hevesli -= .20;
    }
    /* Konsey varsa hegemonya siyaseten daha değerli */
    if (typeof councilExists === 'function' && councilExists() &&
        inCouncil(e) && inCouncil(o)) hevesli += .25;
    /* Zaten vasalı olan devlet imparatorluk kurmayı sürdürür */
    if (typeof vassalsOf === 'function' && vassalsOf(e).length) hevesli += .20;
    /* Ezici üstünlük gerekiyor: boyun eğdirmek uzun bir savaştır */
    if (oran > 1.35 && rnd() < clamp(hevesli, 0, .85) &&
        (e.res.etk || 0) >= (WAR_GOALS.boyun ? WAR_GOALS.boyun.etk : 45))
      return 'boyun';
  }
  if (has('ihanet') || has('paktBozdu')) return 'yoketme';
  if (has('sahteBayrak'))                return 'yoketme'; // affedilmez
  if (has('komplo'))                     return 'yikim';   // ağını dağıt
  if (has('sistemAldi'))                 return 'fetih';
  if (has('sabotaj') || has('casusYakalan')) return 'bilgi';
  if (has('kervanYagma') || has('yaptirim')) return 'harac';
  const prof = aiProfile(e);
  if (prof.war > .90) return 'yikim';
  if (prof.eco > .70) return 'harac';
  if (prof.sci > .80) return 'bilgi';
  return 'fetih';
}

/* ─── YETKİ PROTOKOLÜ ───
   AI savaşları yalnızca aiWarReview veya yükümlülük yoluyla açılır. */
function warAuthorize(a, b, why){ G._warAuth = a.id + '>' + b.id; G._warWhy = why || null; }
function warAuthClear(){ G._warAuth = null; G._warWhy = null; }

/* ─── AYLIK SAVAŞ MECLİSİ ───
   Tüm AI savaş kararlarının tek kapısı. */
function aiWarReview(){
  for (const e of G.emps){
    if (e.dead || e.wild || !e.ai) continue;
    if (hasCivic(e,'shadow') || hasCivic(e,'universal')) continue;

    let open = 0;
    for (const w in e.war) if (e.war[w] && G.emps[w] && !G.emps[w].wild) open++;
    if (open >= 2) continue;                      // ikiden fazla cephe açma

    let best = null;
    for (const o of G.emps){
      if (o.dead || o.wild || o.id === e.id) continue;
      if (!e.contact[o.id] || e.war[o.id]) continue;
      if (hasCivic(o, 'exile')) continue;
      if (inColdWar(e, o)) continue;              // 3 turluk soğuk savaş
      /* FAZ 16: kriz kapıdayken iç hesaplaşma ertelenir */
      if (typeof crisisActive === 'function' && crisisActive() &&
          typeof crisisPressure === 'function' && crisisPressure(e) > .35 &&
          !o.crisisSide) continue;
      /* Senyör vasalına, vasal senyörüne savaş açmaz (isyan ayrı yoldan) */
      if (typeof isVassal === 'function' &&
          (o.overlord === e.id || e.overlord === o.id)) continue;
      /* Aynı senyörün vasalları birbiriyle savaşmaz */
      if (e.overlord !== undefined && e.overlord !== null &&
          e.overlord === o.overlord) continue;
      /* Galaktik Odak: birleşme yasası üye-içi savaşı yasaklar */
      if (typeof unityActive === 'function' && unityActive() &&
          councilExists() && G.council.members.includes(e.id) &&
          G.council.members.includes(o.id)) continue;

      const g = grudgeOf(e, o.id);
      const lastPeace = (e.peaceAt && e.peaceAt[o.id] !== undefined) ? e.peaceAt[o.id] : -9999;
      if (G.day - lastPeace < 720 - g * 5) continue;

      const ap = warAppetite(e, o);
      if (!ap.cb) continue;                       // SEBEP YOK → SAVAŞ YOK
      if (ap.score < .92 - ap.grudge * .45) continue;
      if (ap.ratio < .55 && ap.grudge < .80) continue;

      if (!best || ap.score > best.ap.score) best = {o, ap};
    }
    if (!best) continue;

    /* Karar aylara yayılır: savaş patlamaz, gerginlik birikir. */
    const chance = clamp((best.ap.score - .92 + best.ap.grudge * .55) * .20, .015, .34);
    if (rnd() > chance) continue;

    if (typeof setWarGoal === 'function' && typeof WAR_GOALS !== 'undefined'){
      const key = pickCasusBelli(e, best.o);
      const cost = WAR_GOALS[key] ? WAR_GOALS[key].etk : 999;
      setWarGoal(e, best.o, (e.res.etk >= cost) ? key : 'fetih');
    }
    e._lastCB = best.ap.cb;
    warAuthorize(e, best.o, best.ap.cb);
    declareWar(e, best.o);
    warAuthClear();
  }
}

/* ─── İTTİFAK GÖZDEN GEÇİRME ───
   AI ani ihanet etmez: önce ittifakı bozar, 3 turluk soğuk savaş
   başlar, ancak ondan sonra savaş açabilir. Oyuncuya uyarıdır. */
function aiReviewAlliances(){
  for (const e of G.emps){
    if (e.dead || e.wild || !e.ai) continue;
    const prof = aiProfile(e);
    for (const o of G.emps){
      if (o.dead || o.wild || o.id === e.id || !e.ally[o.id]) continue;

      let bound = 0;
      if (typeof findFed === 'function'){
        const fe = findFed(e), fo = findFed(o);
        if (fe && fo && fe === fo) bound += 40;
      }
      if (typeof councilExists === 'function' && councilExists() &&
          inCouncil(e) && inCouncil(o)) bound += 15;
      for (const x of G.emps)
        if (!x.dead && !x.wild && x.id !== e.id && x.id !== o.id &&
            e.war[x.id] && o.war[x.id]) bound += 35;

      const strain = (-trustOf(e, o.id)) + (-e.rel[o.id] * .4) - bound + (prof.war - .5) * 20;
      if (strain > 45 && rnd() < .05){
        e.ally[o.id] = false; o.ally[e.id] = false;
        e.rel[o.id] = clamp(e.rel[o.id] - 15, -100, 100);
        o.rel[e.id] = clamp(o.rel[e.id] - 15, -100, 100);
        remember(o, e.id, 'paktBozdu');
        for (const w of G.emps){
          if (w.dead || w.wild || w.id === e.id || w.id === o.id) continue;
          if (rnd() < .5) remember(w, e.id, 'paktBozdu');
        }
        setColdWar(e, o, COLD_WAR_TURNS);
        if (o.id === 0)
          say('İTTİFAK BOZULDU — ' + e.name + ' anlaşmayı feshetti (' +
              COLD_WAR_TURNS + ' tur soğuk savaş)', 'war');
        else if (e.id !== 0)
          say(e.name + ' ile ' + o.name + ' arasındaki ittifak dağıldı');
      }
    }
  }
}

/* Aylık diplomasi tiki — monthTick buradan çağırır */
function diploTick(){
  if (typeof memTick === 'function') memTick();
  embargoTick();                 // güven çökünce ticaret kesilir
  pariahReview();
  if (typeof guardianTick === 'function') guardianTick();   // FAZ 37
  if (typeof rebelTick === 'function') rebelTick();         // FAZ 38: isyancı ittifakı
  if (typeof rebelVictoryCheck === 'function') rebelVictoryCheck(); // FAZ 39: balkanizasyon                // itibar onarılırsa parya statüsü kalkar
  aiReviewAlliances();
  if (typeof whisperTick === 'function') whisperTick();          // fısıltı ağları
  if (typeof counterIntelTick === 'function') counterIntelTick(); // gecikmeli ifşa
  unityTick();                                                   // galaktik odak
  megaWatchTick();                                               // harika izleme
  threatTick();                                                  // galaktik tehdit erimesi
  polarizeTick();                                                // FAZ 29: geç oyun kutuplaşması
  hegemonyTick();                                                // FAZ 30: güç korkusu
  crisisDiplomacyTick();                                         // kriz diplomasisi
  if (typeof aiStructTick === 'function') aiStructTick();
  if (typeof aiForwardBaseTick === 'function') aiForwardBaseTick();  // FAZ 56        // AI uzay inşaatı
  if (typeof aiLogisticsTick === 'function') aiLogisticsTick();  // ikmal geri çekilmesi
  vassalTick();                                                  // vergi, öfke, isyan
  if (typeof aiDisbandTick === 'function') aiDisbandTick();       // ekonomik terhis
  if (typeof aiOpsTick === 'function') aiOpsTick();               // AI casusluk operasyonları
  if (typeof aiArmyTick === 'function') aiArmyTick();             // FAZ 22: ordu komutası
  if (typeof aiFalseFlagTick === 'function') aiFalseFlagTick();   // FAZ 34: AI sahte bayrak
  if (typeof aiTerraformTick === 'function') aiTerraformTick();   // FAZ 36: AI diriliş
  if (typeof aiPatronageTick === 'function') aiPatronageTick();   // FAZ 45: AI himayesi
  if (typeof aiStatusQuoTick === 'function') aiStatusQuoTick();   // FAZ 49: statüko refleksi
  if (typeof fedFundTick === 'function') fedFundTick();           // FAZ 49: federal fon
  if (typeof sabotageTick === 'function') sabotageTick();          // FAZ 59
  if (typeof warSubsidyTick === 'function') warSubsidyTick();     // FAZ 45: savaş yardımı
  if (typeof visionTick === 'function') visionTick();             // FAZ 48: paylaşılan görüş
  if (typeof colossusGuardLock === 'function') colossusGuardLock(); // FAZ 31: koruma kilidi
  if (typeof aiColossusTick === 'function') aiColossusTick();     // FAZ 25: süper silah sevki
  if (typeof hitLogTick === 'function') hitLogTick();             // soğuk dosya soruşturması
  aiWarReview();
}


/* ═══════════════════════════════════════════════════════════════════
   FAZ 3 — EKONOMİK SAVAŞ: AMBARGOLAR VE GALAKTİK PARYA
   Savaş artık cepheden önce masada başlar. Güven çökünce ticaret
   kesilir; onur çökünce galaksi devleti topluca dışlar.
   ═══════════════════════════════════════════════════════════════════ */

/* Ambargonun devreye girdiği güven eşiği — mizaca göre değişir.
   Tüccar parayı sever, ticareti son ana kadar sürdürür. */
const EMBARGO_TRUST = -40;
function embargoThreshold(e){
  const P = (typeof personaOf === 'function') ? personaOf(e) : null;
  if (!P) return EMBARGO_TRUST;
  if (P.n === 'Tüccar')       return -60;   // kâr uğruna daha çok dayanır
  if (P.n === 'İzolasyonist') return -30;   // zaten kapalı, çabuk keser
  if (P.n === 'Militarist')   return -35;
  return EMBARGO_TRUST;
}

function embargoOn(e, id){
  if (!e) return false;
  if (G.council && (typeof pariahMap === 'function') && pariahMap()[id] &&
      e.id !== id) return true;              // parya ile kimse ticaret yapamaz
  return !!(e.embargo && e.embargo[id]);
}
/* İki taraf arasında ticaret akabiliyor mu? */
/* FAZ 10: Kaçakçılık ağı — Ambargo Kaçakçılığı operasyonu bir hattı
   geçici olarak yeniden açar. Savaş hâli delinemez. */
function smuggling(a, b){
  if (!a || !b) return false;
  return !!(a.smuggle && a.smuggle[b.id] > G.day) ||
         !!(b.smuggle && b.smuggle[a.id] > G.day);
}
function tradeBlocked(a, b){
  if (!a || !b) return true;
  if (a.war[b.id]) return true;
  const kesik = embargoOn(a, b.id) || embargoOn(b, a.id);
  if (kesik && smuggling(a, b)) return false;    // kaçakçılık hattı açık tutar
  return kesik;
}

function setEmbargo(e, target, on, sebep){
  if (!e || !target) return false;
  e.embargo = e.embargo || {};
  if (on){
    if (e.embargo[target.id]) return false;
    e.embargo[target.id] = true;
    if (typeof breakPact === 'function') breakPact(e, target);
    if (typeof remember === 'function') remember(target, e.id, 'yaptirim');
    target.rel[e.id] = clamp(target.rel[e.id] - 12, -100, 100);
    if (target.id === 0) say(e.name + ' sana TİCARİ AMBARGO uyguladı' +
      (sebep ? ' — ' + sebep : ''), 'war');
    else if (e.id === 0) say(target.name + ' imparatorluğuna ambargo uygulandı', 'war');
  } else {
    if (!e.embargo[target.id]) return false;
    delete e.embargo[target.id];
    if (target.id === 0) say(e.name + ' ambargoyu kaldırdı', 'win');
  }
  /* ticaret önbelleklerini geçersiz kıl */
  e._trAt = -1; target._trAt = -1;
  return true;
}

/* Kaç imparatorluk hedefe ambargo uyguluyor ve ne kadar ağır? */
function embargoPressure(target){
  let n = 0, weight = 0;
  for (const o of G.emps){
    if (o.dead || o.wild || o.id === target.id) continue;
    if (embargoOn(o, target.id)){
      n++;
      weight += 1 + sysCount(o) * .15 + (o.trade && o.trade.vol ? o.trade.vol / 260 : 0);
    }
  }
  return {n, weight};
}
/* Ambargonun üretime yansıması — recalcMods buradan besleniyor */
function embargoMods(e){
  const out = {};
  const parya = (typeof isPariah === 'function') && isPariah(e);

  /* GALAKTİK PARYA konseyin en ağır silahıdır ve TEK BAŞINA uygulanır:
     zaten "tüm galaksiyle ticaret kesik" demek olduğundan üstüne bir de
     tek tek ambargo cezası binmez — yoksa ceza −%48'e kadar çıkıyordu. */
  if (parya){
    out.eneMul = -.30; out.minMul = -.30;
    out.araMul = -.30; out.alaMul = -.30;
    return out;
  }
  const p = embargoPressure(e);
  if (p.n){
    /* Asıl acı, kesilen ticaret ağının kendisidir (rota + lüks mal
       kaybı). Buradaki modifikatör yalnızca ek sürtünmedir; sert
       olmamalı. Tavan %18: üç dört devlet birden ambargo uygularsa
       ekonomi zorlanır ama çökmez. */
    const bite = clamp(p.weight * .020, 0, .18);
    out.eneMul = -bite;
    out.minMul = -bite * .6;
    out.araMul = -bite * .5;
  }
  return out;
}
function isPariah(e){
  if (!e || !G.council) return false;
  const map = (typeof pariahMap === 'function') ? pariahMap() : null;
  return !!(map && map[e.id]);
}

/* ─────────────────────────────────────────────────────────────
   OTOMATİK AMBARGO — soğuk ekonomik savaş
   Güven eşiğin altına düşünce ticaret kendiliğinden kesilir;
   güven onarılınca kendiliğinden geri açılır.
   ───────────────────────────────────────────────────────────── */
function embargoTick(){
  for (const e of G.emps){
    if (e.dead || e.wild) continue;
    for (const o of G.emps){
      if (o.dead || o.wild || o.id === e.id) continue;
      if (!e.contact[o.id]) continue;

      const t   = (typeof trustOf === 'function') ? trustOf(e, o.id) : 0;
      const esik = embargoThreshold(e);
      const acik = embargoOn(e, o.id);

      /* Müttefikler ve federasyon ortakları ambargo uygulamaz */
      let bagli = e.ally[o.id];
      if (!bagli && typeof findFed === 'function'){
        const fe = findFed(e), fo = findFed(o);
        if (fe && fo && fe === fo) bagli = true;
      }

      if (!acik && !bagli && t <= esik){
        setEmbargo(e, o, true, 'güven ' + Math.round(t));
        /* Ambargo karşılıklıdır: hedef de misilleme yapar */
        if (!embargoOn(o, e.id) && !o.ally[e.id] && o.ai)
          setEmbargo(o, e, true, 'misilleme');
      }
      /* Güven onarıldıysa ambargo kalkar (parya yasası hariç) */
      else if (acik && e.embargo && e.embargo[o.id] && t > esik + 18){
        setEmbargo(e, o, false);
      }
    }
  }
}

/* ─────────────────────────────────────────────────────────────
   GALAKTİK PARYA YASASI
   Onuru −50'nin altına düşen devlet konseyin gündemine girer.
   Kabul edilirse tüm galaksiyle ticareti kesilir ve üretimi −%30.
   ───────────────────────────────────────────────────────────── */
const PARIAH_HONOR = -50;
const PARIAH_THREAT = 70;      // FAZ 16: gerekçesiz savaş eşiği

/* Parya adaylığının İKİ yolu var:
   a) onur çöküşü (sözünü tutmayan)  b) galaktik tehdit (gerekçesiz
   savaş açan). İkincisi Faz 15'te eklenen e.threat üzerinden gelir. */
function pariahCandidate(){
  if (!councilExists()) return null;
  let worst = null, skor = 0;
  for (const o of G.emps){
    if (o.dead || o.wild) continue;
    const h = honorOf(o);
    const t = o.threat || 0;
    const onurSuclu  = h <= PARIAH_HONOR;
    const tehditSuclu = t >= PARIAH_THREAT;
    if (!onurSuclu && !tehditSuclu) continue;
    /* Ağırlıklı suç puanı: ikisi birden varsa çok daha ağır */
    const s2 = (onurSuclu ? (PARIAH_HONOR - h) : 0) + (tehditSuclu ? (t - PARIAH_THREAT) * 1.2 : 0);
    if (!worst || s2 > skor){ worst = o; skor = s2; }
  }
  return worst;
}
/* Bu devlet neden parya adayı? Arayüz ve konsey konuşmaları için. */
function pariahReason(o){
  if (!o) return null;
  const h = honorOf(o), t = o.threat || 0;
  if (h <= PARIAH_HONOR && t >= PARIAH_THREAT) return 'onursuzluk ve gerekçesiz savaş';
  if (t >= PARIAH_THREAT) return 'gerekçesiz savaş';
  if (h <= PARIAH_HONOR) return 'onursuzluk';
  return null;
}
/* ═══════════════════════════════════════════════════════════════════
   FAZ 36 — GALAKTİK AF
   ÖLÇÜM (Faz 35): AI sahte bayrak 158 denemede 39 fiyasko verdi;
   her fiyasko bir parya ilanı. Parya statüsünden tek çıkış yolu
   itibar onarımıydı — ama fiyasko tehdit puanını +75 yaptığı için
   pratikte erişilemezdi. Galakside parya enflasyonu oluşuyordu.

   ÇÖZÜM: AI'nın risk alma iştahına DOKUNULMADI. Bunun yerine
   parya statüsüne 120 aylık (10 yıl) bir sayaç konuldu. Süre
   dolunca af çıkar: ambargolar kalkar, statü düşer — ama
   ilişkiler ve anılar SIFIRLANMAZ. Galaksi affeder, unutmaz.
   ═══════════════════════════════════════════════════════════════════ */
const PARIAH_AMNESTY_MONTHS = 120;

function pariahReview(){
  const c = G.council;
  if (!c) return;
  const map = pariahMap();
  if (!map) return;
  let degisti = false;

  /* FAZ 37: HER PARYA BAĞIMSIZ DEĞERLENDİRİLİR */
  for (const key of Object.keys(map)){
    const id = +key;
    const t = G.emps[id];
    if (!t || t.dead){ removePariah(id); degisti = true; continue; }

    const gecen = (G.memAge || 0) - (map[key].since || 0);

    /* YOL 1 — İTİBAR ONARIMI (erken çıkış) */
    if (honorOf(t) > PARIAH_HONOR + 25 && (t.threat || 0) < PARIAH_THREAT - 25){
      removePariah(id);
      degisti = true;
      if (id === 0) say('PARYA STATÜSÜ KALKTI — itibarını onardın, ticaret yolların açıldı', 'win');
      else say(t.name + ' parya statüsünden çıktı');
      continue;
    }

    /* YOL 2 — GALAKTİK AF (10 yıl sonra otomatik) */
    if (gecen >= PARIAH_AMNESTY_MONTHS){
      removePariah(id);
      degisti = true;
      for (const x of G.emps){
        if (x.dead || x.wild || x.crisisSide || x.id === id) continue;
        if (x.embargo) delete x.embargo[id];
      }
      t.threat = Math.round((t.threat || 0) * .5);
      t._amnesty = (G.memAge || 0);
      if (id === 0)
        say('GALAKTİK AF — 10 yıllık dışlanma bitti. Ambargolar kalktı, ' +
            'ama kimse yaptığını unutmadı.', 'win');
      else
        say(t.name + ' galaktik afla parya statüsünden çıktı');
    }
  }
  if (degisti) G.emps.forEach(x => { if (!x.dead) recalcMods(x); });
}

/* Arayüz için: belirli bir devletin affına ne kadar kaldı? */
function pariahAmnestyLeft(id){
  const map = pariahMap();
  if (!map) return null;
  const hedef = (id !== undefined) ? id
    : (G.council && G.council.targeted ? G.council.targeted.parya : undefined);
  if (hedef === undefined || !map[hedef]) return null;
  return Math.max(0, PARIAH_AMNESTY_MONTHS -
    ((G.memAge || 0) - (map[hedef].since || 0)));
}


/* ═══════════════════════════════════════════════════════════════════
   FAZ 5 — GALAKTİK ODAK: KRİZE KARŞI BİRLEŞME
   Kriz varken konsey üyeleri arasındaki savaşlar dondurulur ve
   sınırlar açılır. Kriz biterse yasa kendiliğinden düşer.
   ═══════════════════════════════════════════════════════════════════ */

/* Kriz bu devleti ne kadar sıkıştırıyor? 0 (uzak) … 1 (kapıda).
   İzolasyonistin ilkesini kıran, militaristi coşturan şey budur. */
function crisisPressure(e){
  if (!e || e.dead || e.wild) return 0;
  if (typeof crisisActive !== 'function' || !crisisActive()) return 0;
  if (G.crisisId === undefined) return 0;

  let bask = 0;
  /* Kriz filoları benim sistemlerime ne kadar yakın? */
  const mine = G.sys.filter(sy => sy.owner === e.id);
  if (!mine.length) return .5;
  for (const f of G.fleets){
    if (f.e !== G.crisisId || !f.ships.length) continue;
    let enYakin = 1e9;
    for (const sy of mine) enYakin = Math.min(enYakin, dist(f, sy));
    if (enYakin < 260) bask += .5;
    else if (enYakin < 620) bask += .22;
    else bask += .05;
  }
  /* Krizle fiilen savaşıyorsam baskı zaten yüksektir */
  if (e.war[G.crisisId]) bask += .3;
  /* Aşama ilerledikçe herkes hisseder */
  bask += ((G.crisis && G.crisis.stage) || 0) * .12;
  return clamp(bask, 0, 1);
}

function unityActive(){
  return !!(councilExists() && G.council.laws.birlesme &&
            typeof crisisActive === 'function' && crisisActive());
}

/* Yasa kabul edildiği anda uygulanır: savaşlar biter, sınırlar açılır */
function applyUnity(){
  const c = G.council;
  if (!c) return;
  let barisan = 0, acilan = 0;
  for (const idA of c.members){
    const a = G.emps[idA];
    if (!a || a.dead || a.wild) continue;
    for (const idB of c.members){
      if (idA === idB) continue;
      const b = G.emps[idB];
      if (!b || b.dead || b.wild) continue;
      /* Savaşları dondur */
      if (a.war[b.id] && typeof canPeace === 'function' && canPeace(a, b)){
        if (typeof makePeace === 'function' && makePeace(a, b)) barisan++;
      }
      /* Sınırları karşılıklı aç */
      a.passage = a.passage || {};
      if (!a.passage[b.id]){ a.passage[b.id] = true; acilan++; }
    }
  }
  say('KRİZE KARŞI BİRLEŞME yürürlükte — ' + Math.round(barisan/2) +
      ' savaş donduruldu, sınırlar açıldı', 'win');
}

/* Aylık denetim: yasa yürürlükteyken üyeler birbirine savaş açamaz;
   kriz bitince yasa düşer ve açılan sınırlar kapanır. */
function unityTick(){
  const c = G.council;
  if (!c || !c.laws.birlesme) return;

  if (typeof crisisActive === 'function' && !crisisActive()){
    delete c.laws.birlesme;
    for (const id of c.members){
      const e = G.emps[id];
      if (e) e.unityPass = null;
    }
    say('Krize Karşı Birleşme sona erdi — galaksi eski hâline döndü');
    return;
  }
  /* Yasa sürerken üye-içi savaş çıkmışsa derhal dondurulur */
  for (const idA of c.members){
    const a = G.emps[idA];
    if (!a || a.dead || a.wild) continue;
    a.unityPass = true;
    for (const idB of c.members){
      if (idA === idB) continue;
      const b = G.emps[idB];
      if (!b || b.dead || b.wild) continue;
      if (a.war[b.id] && typeof canPeace === 'function' && canPeace(a, b))
        makePeace(a, b);
      a.passage = a.passage || {};
      a.passage[b.id] = true;
    }
  }
}


/* ═══════════════════════════════════════════════════════════════════
   FAZ 6 — MEGAYAPI KISKANÇLIĞI
   Galaksiyi değiştirecek bir harikanın inşası diplomatik krizdir.
   ═══════════════════════════════════════════════════════════════════ */

/* Bu devletin inşa hâlindeki mega yapıları */
function megaBuilds(e){
  const out = [];
  if (!e || e.dead) return out;
  for (const sy of G.sys){
    if (!sy.work || !sy.work.length) continue;
    for (const w of sy.work){
      if (w.e !== e.id) continue;
      const S = (typeof STRUCTS !== 'undefined') ? STRUCTS[w.key] : null;
      if (S && S.mega) out.push({sys:sy, key:w.key, left:w.left, tot:w.tot, S});
    }
  }
  return out;
}
/* Tamamlanmış mega yapı sayısı — kalıcı kıskançlık kaynağı */
function megaOwned(e){
  let n = 0;
  for (const sy of G.sys){
    if (!sy.built) continue;
    for (const k in sy.built){
      if (sy.built[k] !== e.id) continue;
      const S = (typeof STRUCTS !== 'undefined') ? STRUCTS[k] : null;
      if (S && S.mega) n++;
    }
  }
  return n;
}

/* Galaksiye duyuru + kıskançlık tohumu.
   startStruct bir mega yapı başlattığında çağrılır. */
function announceMega(builder, sys, key){
  const S = (typeof STRUCTS !== 'undefined') ? STRUCTS[key] : null;
  if (!S || !S.mega) return;
  G.megaWatch = G.megaWatch || [];
  G.megaWatch.push({e:builder.id, sys:sys.id, key, at:(G.memAge || 0)});

  for (const o of G.emps){
    if (o.dead || o.wild || o.id === builder.id) continue;
    o.contact[builder.id] = true;                 // böyle bir şey gizlenemez
    builder.contact[o.id] = true;
    /* Kıskançlık: mizaca göre ilişki aşınır */
    const P = (typeof personaOf === 'function') ? personaOf(o) : null;
    let kis = 12;
    if (P){
      if (P.n === 'Militarist') kis = 22;
      else if (P.n === 'Yayılmacı') kis = 18;
      else if (P.n === 'Tüccar') kis = 10;
      else if (P.n === 'Pasifist') kis = 6;
    }
    if (o.ally[builder.id]) kis *= .4;            // müttefikine sevinir
    o.rel[builder.id] = clamp(o.rel[builder.id] - kis, -100, 100);
    if (typeof remember === 'function' && kis >= 18)
      remember(o, builder.id, 'sinirGergin');
  }
  if (builder.id === 0)
    say('GALAKSİ İNŞAATINI GÖRDÜ — ' + S.n + ' başladı, rakiplerin tedirgin', 'war');
  else
    say('⚠ ' + builder.name + ' bir HARİKA inşa ediyor: ' + S.n +
        ' — ' + sys.name, 'war');
}

/* İnşaat tamamlanınca veya iptal olunca izleme kaydı düşer */
function megaWatchTick(){
  if (!G.megaWatch || !G.megaWatch.length) return;
  G.megaWatch = G.megaWatch.filter(w => {
    const sy = G.sys[w.sys];
    if (!sy) return false;
    const sur = sy.work && sy.work.some(x => x.key === w.key && x.e === w.e);
    return !!sur;
  });
}


/* ═══════════════════════════════════════════════════════════════════
   FAZ 8 — VASALLIK VE HEGEMONYA
   Savaş artık yok etme aracı olmaktan çıkıp politik baskıya dönüşür.
   Kazanan, kaybedeni haritadan silmek yerine boyunduruk altına alır.
   ═══════════════════════════════════════════════════════════════════ */

const VASSAL_TYPES = {
  haracguzar:{n:'Haraçgüzar', ico:'💰',
    d:'Senyörüne her tur enerji, mineral ve alaşım vergisi öder. ' +
      'Bağımsız dış politikası kısıtlıdır.'},
  bekci     :{n:'Sınır Bekçisi', ico:'🛡',
    d:'Vergi ödemez; senyörünün filo kapasitesini artırır ve onun ' +
      'savaşlarına otomatik katılır.'}
};

/* Temel ilişki sorguları */
function isVassal(e){ return !!(e && e.overlord !== undefined && e.overlord !== null && G.emps[e.overlord] && !G.emps[e.overlord].dead); }
function overlordOf(e){ return isVassal(e) ? G.emps[e.overlord] : null; }
function vassalsOf(e){
  if (!e) return [];
  return G.emps.filter(o => !o.dead && !o.wild && o.overlord === e.id);
}
function vassalType(e){ return isVassal(e) ? (e.vassalType || 'haracguzar') : null; }

/* Boyun eğdirme: savaş hedefi tamamlandığında uygulanır */
function subjugate(lord, sub, tur){
  if (!lord || !sub || lord.id === sub.id) return false;
  if (sub.dead || sub.wild || lord.dead || lord.wild) return false;
  /* Yeni kazanılmış bağımsızlık 5 yıl korunur */
  if (sub.freeUntil && sub.freeUntil > (G.memAge || 0)) return false;
  if (isVassal(lord) && lord.overlord === sub.id) return false;   // döngü olmasın
  /* Zincirleme vasallık yok: yeni senyör, eski vasalları devralır */
  for (const v of vassalsOf(sub)) v.overlord = lord.id;

  sub.overlord = lord.id;
  sub.vassalType = (tur === 'bekci') ? 'bekci' : 'haracguzar';
  sub.vassalSince = G.memAge || 0;
  sub.vassalAnger = 0;

  /* Savaş biter, ittifak benzeri bir bağ kurulur */
  if (lord.war[sub.id]){
    lord.war[sub.id] = false; sub.war[lord.id] = false;
    lord.peaceAt = lord.peaceAt || {}; sub.peaceAt = sub.peaceAt || {};
    lord.peaceAt[sub.id] = G.day; sub.peaceAt[lord.id] = G.day;
    if (typeof resolveProxyWars === 'function') resolveProxyWars(lord, sub);
  }
  /* Sınır bekçisi senyörünün savaşlarına katılır */
  if (sub.vassalType === 'bekci') vassalJoinWars(lord, sub);

  /* Hafıza: boyunduruk unutulmaz, ama ihanet kadar ağır değildir */
  if (typeof remember === 'function') remember(sub, lord.id, 'sistemAldi');
  sub.rel[lord.id] = clamp(sub.rel[lord.id] - 25, -100, 100);

  /* Galaksi bunu görür: hegemonya kurmak itibar meselesidir */
  for (const x of G.emps){
    if (x.dead || x.wild || x.id === lord.id || x.id === sub.id) continue;
    x.rel[lord.id] = clamp(x.rel[lord.id] - 8, -100, 100);
  }
  const T = VASSAL_TYPES[sub.vassalType];
  if (sub.id === 0) say('BOYUN EĞDİRİLDİN — ' + lord.name + ' senyörün oldu (' + T.n + ')', 'war');
  else if (lord.id === 0) say('VASAL KAZANDIN — ' + sub.name + ' artık ' + T.n, 'win');
  else say(lord.name + ', ' + sub.name + ' devletini ' + T.n + ' yaptı');
  return true;
}

/* Bağımsızlık: vasal bağı kopar */
function freeVassal(sub, sebep){
  if (!isVassal(sub)) return false;
  const lord = overlordOf(sub);
  sub.overlord = null;
  sub.vassalType = null;
  sub.vassalAnger = 0;
  if (lord){
    sub.rel[lord.id] = clamp(sub.rel[lord.id] - 10, -100, 100);
    if (sub.id === 0) say('BAĞIMSIZLIK — ' + lord.name + ' boyunduruğundan çıktın' +
      (sebep ? ' (' + sebep + ')' : ''), 'win');
    else if (lord.id === 0) say(sub.name + ' vasallıktan çıktı' + (sebep ? ' — ' + sebep : ''), 'war');
  }
  return true;
}

/* Sınır bekçisi senyörünün savaşlarına katılır */
function vassalJoinWars(lord, sub){
  for (const o of G.emps){
    if (o.dead || o.wild || o.id === sub.id || o.id === lord.id) continue;
    if (!lord.war[o.id] || sub.war[o.id]) continue;
    if (typeof warAuthorize === 'function'){
      sub._lastCB = {n:'Senyörün Çağrısı'};
      warAuthorize(sub, o, sub._lastCB);
      declareWar(sub, o);
      warAuthClear();
    }
  }
}

/* ── VERGİ VE HEGEMONYA TİKİ ── */
const VASSAL_TAX = {min:.14, ene:.14, ala:.10};   // gelirin oranı

function vassalTick(){
  for (const sub of G.emps){
    if (sub.dead || sub.wild || !isVassal(sub)) continue;
    const lord = overlordOf(sub);
    if (!lord || lord.dead){ freeVassal(sub, 'senyör yok oldu'); continue; }

    /* GÜVENLİK AĞI — koruma yükümlülüğü.
       declareWar içindeki iç içe çağrı bazı yollarda (savaş sözü,
       konsey cezası, isyan) atlanabiliyor. Burada her ay denetlenir:
       vasalıma saldıran biri varsa ve ben savaşta değilsem, girerim. */
    for (const o of G.emps){
      if (o.dead || o.wild || o.id === lord.id || o.id === sub.id) continue;
      if (!sub.war[o.id]) continue;                    // vasal onunla savaşta değil
      if (lord.war[o.id]) continue;                    // senyör zaten savaşta
      if (isVassal(o) && o.overlord === lord.id) continue;  // iki vasalım arasında
      if (typeof overlordDefend === 'function') overlordDefend(o, sub);
    }

    /* Haraçgüzar vergi öder — gelirinin bir oranı senyöre akar */
    if (vassalType(sub) === 'haracguzar'){
      let toplam = 0;
      for (const r in VASSAL_TAX){
        const gelir = Math.max(0, (sub.inc && sub.inc[r]) || 0);
        const vergi = Math.min(gelir * VASSAL_TAX[r], (sub.res[r] || 0));
        if (vergi <= 0) continue;
        sub.res[r] = (sub.res[r] || 0) - vergi;
        lord.res[r] = (lord.res[r] || 0) + vergi;
        toplam += vergi;
      }
      sub.vassalPaid = toplam;
    } else {
      sub.vassalPaid = 0;
      /* Sınır bekçisi senyörünün yeni savaşlarına da katılır */
      vassalJoinWars(lord, sub);
    }

    /* ═══ FAZ 18: BAĞIMSIZLIK ARZUSU ═══
       Öfke artık tek bir sayı değil, dört kaynaktan besleniyor:
       güç dengesi, senyörün itibarı, vasallığın süresi ve mizaç.
       vassalLiberty() bunu tek noktadan hesaplıyor. */
    const guc = totalPower(lord) / (totalPower(sub) + 1);
    sub.vassalAnger = clamp((sub.vassalAnger || 0) + vassalLiberty(sub, lord), 0, 100);

    /* Oyuncu vasalsa eşiği geçince uyarılır — kararı kendi verir */
    if (sub.id === 0 && sub.vassalAnger >= 70 && !sub._libWarned){
      sub._libWarned = true;
      say('HALKIN BAĞIMSIZLIK İSTİYOR — DEVLET panelinden isyan edebilirsin', 'war');
    }
    if (sub.id === 0 && sub.vassalAnger < 55) sub._libWarned = false;

    /* İsyan: öfke dolduğunda ve senyör zayıfladığında */
    if (sub.vassalAnger >= 70 && sub.ai && guc < 1.35 && rnd() < .07){
      const eskiLord = lord;
      freeVassal(sub, 'isyan');
      if (typeof remember === 'function') remember(sub, eskiLord.id, 'sistemAldi');
      if (typeof warAuthorize === 'function'){
        sub._lastCB = {n:'Bağımsızlık Savaşı'};
        warAuthorize(sub, eskiLord, sub._lastCB);
        declareWar(sub, eskiLord);
        warAuthClear();
      }
      if (eskiLord.id === 0) say('VASALIN İSYAN ETTİ — ' + sub.name, 'war');
    }
  }
}

/* Senyörün filo kapasitesine bekçi katkısı — recalcMods kullanır */
function vassalCapBonus(e){
  let n = 0;
  for (const v of vassalsOf(e))
    if (v.vassalType === 'bekci') n += 10 + sysCount(v) * 2;
  return n;
}

/* ── KONSEY HEGEMONYASI ──
   Vasal bağımsız oy kullanamaz; ağırlığı senyörüne eklenir. */
function hegemonyWeight(e){
  let w = 0;
  for (const v of vassalsOf(e)){
    if (!councilExists() || !G.council.members.includes(v.id)) continue;
    w += voteWeight(v) * (v.vassalType === 'bekci' ? .75 : .90);
  }
  return w;
}


/* ═══════════════════════════════════════════════════════════════════
   FAZ 8.5 — SENYÖRÜN KORUMA YÜKÜMLÜLÜĞÜ
   Vasallık tek yönlü bir sömürü değildir: vasal senyörünün
   savaşlarına katılıyorsa, senyör de vasalını korumak zorundadır.
   Aksi hâlde vasallık kimse için cazip olmaz.
   ═══════════════════════════════════════════════════════════════════ */
function overlordDefend(attacker, victim){
  if (!attacker || !victim) return;
  if (typeof isVassal !== 'function' || !isVassal(victim)) return;

  const lord = overlordOf(victim);
  if (!lord || lord.dead || lord.wild) return;
  if (lord.id === attacker.id) return;          // senyörün kendisi saldırıyorsa geçersiz
  if (lord.war[attacker.id]) return;            // zaten savaşta
  if (isVassal(attacker) && attacker.overlord === lord.id) return;  // iki vasalı arasında

  /* Senyör yükümlülüğü yerine getirir — bu bir tercih değil, borçtur */
  lord._lastCB = {n:'Senyörlük Yükümlülüğü'};
  if (typeof warAuthorize === 'function'){
    warAuthorize(lord, attacker, lord._lastCB);
    const oldu = declareWar(lord, attacker);
    warAuthClear();
    if (oldu){
      /* Korunan vasalın öfkesi diner: koruma boyunduruğu meşrulaştırır */
      victim.vassalAnger = clamp((victim.vassalAnger || 0) - 25, 0, 100);
      victim.rel[lord.id] = clamp(victim.rel[lord.id] + 10, -100, 100);
      if (typeof remember === 'function') remember(victim, lord.id, 'yardimEtti');

      if (victim.id === 0)
        say('SENYÖRÜN SENİ KORUYOR — ' + lord.name + ', ' + attacker.name + ' devletine savaş açtı', 'win');
      else if (lord.id === 0)
        say('VASALIN SALDIRIYA UĞRADI — yükümlülüğün gereği ' + attacker.name + ' ile savaştasın', 'war');
      else if (attacker.id === 0)
        say('DİKKAT: ' + victim.name + ' bir vasal — senyörü ' + lord.name + ' savaşa girdi', 'war');
    }
  }
  /* Senyörün diğer sınır bekçileri de seferber olur */
  for (const v of vassalsOf(lord)){
    if (v.id === victim.id || v.vassalType !== 'bekci') continue;
    if (v.war[attacker.id] || v.dead) continue;
    v._lastCB = {n:'Senyörün Çağrısı'};
    if (typeof warAuthorize === 'function'){
      warAuthorize(v, attacker, v._lastCB);
      declareWar(v, attacker);
      warAuthClear();
    }
  }
}


/* ═══════════════════════════════════════════════════════════════════
   FAZ 15 — GALAKTİK TEHDİT
   AI zaten Casus Belli olmadan savaş açamıyordu (aiWarReview kapısı).
   Ama OYUNCU açabiliyordu ve bedeli yoktu. Artık nedensiz savaş
   galaksinin gözünde suçtur: itibar çöker, herkes cephe alır.
   ═══════════════════════════════════════════════════════════════════ */

const THREAT_DECAY = 0.55;      // ayda erime

/* Bu savaşın meşru bir gerekçesi var mıydı? */
function warHadCause(a, b){
  /* Yükümlülük savaşları daima meşrudur */
  const yuk = a.warCause && a.warCause[b.id];
  if (yuk === 'Savunma Paktı Yükümlülüğü' || yuk === 'Senyörlük Yükümlülüğü' ||
      yuk === 'Konsey Kararını Uygula' || yuk === 'Senyörün Çağrısı' ||
      yuk === 'Bağımsızlık Savaşı') return true;
  /* Savunmaya geçen taraf suçlu sayılmaz */
  if (b.war[a.id] && !a.war[b.id]) return true;
  return !!casusBelliOf(a, b);
}

function judgeCasusBelli(a, b){
  if (!a || !b || a.wild || b.wild) return;
  if (typeof casusBelliOf !== 'function') return;
  if (warHadCause(a, b)) return;

  /* NEDENSİZ SAVAŞ — galaksi bunu affetmez */
  a.threat = (a.threat || 0) + 34;
  a.warCause = a.warCause || {};
  a.warCause[b.id] = 'Gerekçesiz Saldırı';

  for (const x of G.emps){
    if (x.dead || x.wild || x.id === a.id) continue;
    x.rel[a.id] = clamp(x.rel[a.id] - 16, -100, 100);
    if (typeof remember === 'function') remember(x, a.id, 'paktBozdu');
  }
  if (a.id === 0)
    say('GEREKÇESİZ SALDIRI — galaksi seni tehdit olarak görüyor (itibar çöktü)', 'war');
  else
    say(a.name + ' gerekçesiz savaş açtı — galaksi tedirgin', 'war');
}

/* Galaktik Tehdit puanı üretime ve diplomasiye yansır */
function threatMods(e){
  const t = (e && e.threat) || 0;
  if (t < 20) return {};
  const bite = clamp(t / 260, 0, .30);
  return {etkFlat: -bite * 6, dipMul: -bite, eneMul: -bite * .35};
}
function threatLabel(t){
  return t >= 80 ? 'GALAKTİK TEHDİT' : t >= 45 ? 'tehlikeli'
       : t >= 20 ? 'şaibeli' : null;
}

/* Aylık erime — diploTick çağırır */
function threatTick(){
  for (const e of G.emps){
    if (e.dead || e.wild || !e.threat) continue;
    /* Barışçıl davranış lekeyi yavaşça siler; savaştayken silinmez */
    let savasta = false;
    for (const w in e.war) if (e.war[w]) savasta = true;
    if (!savasta) e.threat = Math.max(0, e.threat - THREAT_DECAY);
    if (e.threat <= 0) delete e.threat;
  }
}


/* ═══════════════════════════════════════════════════════════════════
   FAZ 16 — KRİZ DİPLOMASİSİ
   Hiçlik Sürüsü sahnedeyken galaksi eski hesaplarını askıya alır.
   Kinler SİLİNMEZ — dondurulur; kriz bitince yeniden ısınır. Bu,
   "ortak düşman" hissini verirken tarihi de yok saymaz.
   ═══════════════════════════════════════════════════════════════════ */

function crisisDiplomacyTick(){
  if (typeof crisisActive !== 'function' || !crisisActive()) {
    /* Kriz bitti: askıya alınmış lekeler geri döner (yarısı bağışlanır) */
    for (const e of G.emps){
      if (e.dead || e.wild || e.threatFrozen === undefined) continue;
      e.threat = (e.threat || 0) + e.threatFrozen * .5;
      delete e.threatFrozen;
      if (e.id === 0) say('Kriz bitti — galaksi eski hesapları hatırlamaya başladı');
    }
    return;
  }

  const bask = {};
  for (const e of G.emps){
    if (e.dead || e.wild || e.crisisSide) continue;
    bask[e.id] = (typeof crisisPressure === 'function') ? crisisPressure(e) : .5;
  }

  for (const e of G.emps){
    if (e.dead || e.wild || e.crisisSide) continue;
    const p = bask[e.id] || 0;

    /* 1. GALAKTİK TEHDİT ASKIYA ALINIR
       Kriz varken kimse birbirinin eski suçunu konuşmaz. */
    if ((e.threat || 0) > 0 && e.threatFrozen === undefined){
      e.threatFrozen = e.threat;
      e.threat = 0;
      recalcMods(e);
      if (e.id === 0) say('Kriz karşısında geçmiş suçların askıya alındı', 'win');
    }

    /* 2. KİNLER YUMUŞAR — kriz baskısıyla orantılı */
    if (e.mem){
      for (const id in e.mem){
        const o = G.emps[id];
        if (!o || o.crisisSide) continue;          // krize duyulan kin sönmez
        for (const m of e.mem[id]) if (m.v < 0) m.v *= (1 - .035 * (0.4 + p));
      }
    }

    /* 3. İNSANLAR BİRBİRİNE YAKLAŞIR */
    for (const o of G.emps){
      if (o.dead || o.wild || o.crisisSide || o.id === e.id) continue;
      if (!e.contact[o.id]) continue;
      e.rel[o.id] = clamp(e.rel[o.id] + .55 * (0.5 + p), -100, 100);

      /* 4. AMBARGOLAR GEVŞER — kriz varken ekonomik savaş lüks */
      if (typeof embargoOn === 'function' && embargoOn(e, o.id) && e.embargo &&
          e.embargo[o.id] && rnd() < .10 + p * .18){
        if (typeof setEmbargo === 'function') setEmbargo(e, o, false);
        if (o.id === 0 || e.id === 0)
          say((e.id===0?'Ambargonu kaldırdın':e.name + ' ambargoyu kaldırdı') +
              ' — kriz herkesi masaya çağırıyor');
      }

      /* 5. SINIRLAR AÇILIR — kriz filoları serbestçe geçebilsin */
      if (p > .25 && !e.ally[o.id]){
        e.passage = e.passage || {};
        if (!e.passage[o.id] && rnd() < .12){
          e.passage[o.id] = true;
          if (o.id === 0) say(e.name + ' kriz için sınırlarını sana açtı', 'win');
        }
      }
    }

    /* 6. SAVAŞLARI BIRAKMA EĞİLİMİ — kriz kapıdaysa iç savaş anlamsız */
    if (!e.ai || p < .30) continue;
    for (const o of G.emps){
      if (o.dead || o.wild || o.crisisSide || !e.war[o.id]) continue;
      if (rnd() > .10 + p * .22) continue;
      if (typeof canPeace === 'function' && canPeace(e, o)){
        if (makePeace(e, o) && (e.id === 0 || o.id === 0))
          say('Kriz yüzünden barış — ortak düşman kapıda', 'win');
      } else {
        /* Kilit varsa bile kriz baskısı savaşı durdurur */
        e.war[o.id] = false; o.war[e.id] = false;
        e.peaceAt = e.peaceAt || {}; o.peaceAt = o.peaceAt || {};
        e.peaceAt[o.id] = G.day; o.peaceAt[e.id] = G.day;
        if (e.id === 0 || o.id === 0)
          say('Ateşkes — galaksi ortak düşmana döndü', 'win');
      }
    }
  }
}


/* ═══════════════════════════════════════════════════════════════════
   FAZ 18 — VASAL SADAKATİ
   Bağımsızlık arzusunun aylık artış hızı. Dört kaynak:
     1. GÜÇ DENGESİ — vasal efendisine yaklaştıkça cesaretlenir
     2. SENYÖRÜN İTİBARI — onursuz/tehditkâr efendiye boyun eğilmez
     3. SÜRE — uzun boyunduruk yorar (ama koruma bunu dengeler)
     4. MİZAÇ — militarist ve izolasyonist daha çabuk küser
   ═══════════════════════════════════════════════════════════════════ */
function vassalLiberty(sub, lord){
  if (!sub || !lord) return 0;
  const guc = totalPower(lord) / (totalPower(sub) + 1);

  /* 1. GÜÇ DENGESİ — asıl belirleyici */
  let d = 1.0;
  if (guc > 3)      d -= .85;      // ezici efendi: boyun eğilir
  else if (guc > 2) d -= .60;
  else if (guc > 1.4) d -= .25;
  else if (guc < 1)   d += .80;    // vasal daha güçlü: isyan yakın
  else if (guc < 1.15) d += .40;

  /* 2. SENYÖRÜN İTİBARI — Faz 15/16'daki onur ve tehdit */
  if (typeof honorOf === 'function'){
    const h = honorOf(lord);
    if (h <= -40) d += .55;        // hain bir efendiye kimse sadık kalmaz
    else if (h <= -15) d += .25;
    else if (h >= 35) d -= .30;    // saygın efendi boyunduruğu meşrulaştırır
  }
  const th = lord.threat || 0;
  if (th >= 70) d += .60;          // parya adayı efendinin yanında olmak tehlikeli
  else if (th >= 30) d += .25;
  if (typeof isPariah === 'function' && isPariah(lord)) d += .70;

  /* ═══ FAZ 46: KUKLA GÜÇLENMESİ VE HAMİ ZAYIFLIĞI ═══
     Kışkırtmayla doğan kuklalar minnet duyar ama güçlendikçe
     bağımsızlık ister. Filo gücü haminin %70'ini aşarsa istek
     hızla tırmanır; hami savaşta yıpranmışsa fırsat doğar. */
  const oranTers = totalPower(sub) / Math.max(1, totalPower(lord));
  if (oranTers >= .70) d += clamp((oranTers - .70) * 1.6, 0, .70);
  /* Hami savaş yorgunu mu? */
  let lordSavas = 0;
  for (const w in lord.war)
    if (lord.war[w] && G.emps[w] && !G.emps[w].wild) lordSavas++;
  if (lordSavas >= 2) d += .35;
  else if (lordSavas === 1) d += .15;
  if ((lord.warExh || 0) > 50) d += .30;
  /* Minnet bağı frenler — ama sonsuza dek değil */
  if (sub.founder === lord.id){
    const yas = ((G.memAge || 0) - (sub._bornAt || 0)) / 12;
    d -= clamp(.55 - yas * .05, 0, .55);
  }

  /* 3. SÜRE — uzun boyunduruk yıpratır */
  const yil = ((G.memAge || 0) - (sub.vassalSince || 0)) / 12;
  d += clamp(yil * .045, 0, .55);

  /* 4. MİZAÇ */
  if (typeof personaOf === 'function'){
    const P = personaOf(sub);
    if (P.n === 'Militarist') d += .50;
    else if (P.n === 'İzolasyonist') d += .40;
    else if (P.n === 'Tüccar') d -= .20;
    else if (P.n === 'Pasifist') d -= .15;
  }

  /* Sınır bekçisi vergi vermediği için daha az küser */
  if (vassalType(sub) === 'bekci') d *= .70;
  /* Senyörle aynı federasyondaysa boyunduruk ortaklığa dönüşür */
  if (typeof findFed === 'function'){
    const fs = findFed(sub), fl = findFed(lord);
    if (fs && fl && fs === fl) d *= .55;
  }
  /* Ortak düşman varken iç hesap kapanır */
  if (typeof crisisActive === 'function' && crisisActive()) d *= .35;

  return clamp(d * .85, -1.2, 3.0);
}

/* Arayüz için: sadakat durumu ve kalan süre tahmini */
function vassalLoyaltyInfo(sub){
  if (!isVassal(sub)) return null;
  const lord = overlordOf(sub);
  const hiz = vassalLiberty(sub, lord);
  const arzu = sub.vassalAnger || 0;
  const kalan = hiz > .02 ? Math.ceil((70 - arzu) / hiz) : null;
  return {
    arzu, hiz,
    kalanAy: (arzu >= 70) ? 0 : kalan,
    durum: arzu >= 70 ? 'İSYAN EŞİĞİNDE' : arzu >= 45 ? 'huzursuz'
         : arzu >= 20 ? 'gergin' : 'sadık',
    yon: hiz > .5 ? 'hızla artıyor' : hiz > .05 ? 'artıyor'
       : hiz < -.05 ? 'azalıyor' : 'durgun'
  };
}

/* Oyuncunun kendi isyanı — DEVLET panelinden tetiklenir */
function playerRevolt(){
  const e = G.p;
  if (!isVassal(e)) return {ok:false, why:'Vasal değilsin'};
  if ((e.vassalAnger || 0) < 55)
    return {ok:false, why:'Halkın henüz hazır değil (bağımsızlık arzusu 55 gerekir)'};
  const lord = overlordOf(e);
  freeVassal(e, 'isyan');
  if (typeof remember === 'function') remember(e, lord.id, 'sistemAldi');
  e._lastCB = {n:'Bağımsızlık Savaşı'};
  if (typeof warAuthorize === 'function'){
    warAuthorize(e, lord, e._lastCB);
    declareWar(e, lord);
    warAuthClear();
  }
  /* Bağımsızlık savaşı meşrudur: Galaktik Tehdit cezası YOK */
  if (e.threat) e.threat = Math.max(0, e.threat - 34);
  say('BAĞIMSIZLIK SAVAŞI İLAN EDİLDİ — ' + lord.name, 'war');
  return {ok:true};
}


/* ═══════════════════════════════════════════════════════════════════
   FAZ 27 — KALKAN SABOTAJI
   Uzun kuşatmaları kırmanın istihbarat yolu. Kuşatma altındaki bir
   gezegende, saldıranın istihbarat gücü yeterse ajanlar kalkan
   jeneratörünü çökertir. Başarısızlık ağır: ajan infaz edilir,
   kurban haklı savaş nedeni kazanır.
   Mevcut intelOf / counterIntel / remember altyapısını kullanır.
   ═══════════════════════════════════════════════════════════════════ */

const SABOTAGE_COOLDOWN = 24;      // ay — aynı gezegene tekrar denenmez

function sabotageChance(e, target){
  if (!e || !target) return {basari:0, ifsa:0};
  const lvl = (typeof intelOf === 'function') ? intelOf(e, target.id) : 0;
  const prof = (typeof aiProfile === 'function') ? aiProfile(e) : {dip:.5, sci:.5};
  let basari = .10 + lvl * .16 + prof.dip * .12 + prof.sci * .08;
  if (typeof hasCivic === 'function'){
    if (hasCivic(e, 'shadow')) basari += .22;
    if (hasCivic(e, 'counter')) basari += .05;
  }
  /* FAZ 48: SAHTEKÂR ekseni — gölgede ustalık */
  if (e.mods){
    basari += (e.mods.opBonus || 0);
  }
  /* Hedefin karşı istihbaratı sabotajı zorlaştırır */
  const ci = (typeof counterIntel === 'function') ? counterIntel(target) : 0;
  basari -= ci * .18;
  /* FAZ 38: İsyancı İttifakı üyeleri zalime karşı daha etkili —
     gizli ağ, ortak istihbarat, içeriden yardım. */
  if (typeof rebelOpBonus === 'function') basari += rebelOpBonus(e, target);
  let ifsa = .30 - lvl * .05 + ci * .20;
  /* FAZ 48: SAHTEKÂR ekseni ajanı gizler, DÜRÜST açığa çıkarır */
  if (e.mods) ifsa += (e.mods.opRisk || 0);
  if (typeof hasCivic === 'function' && hasCivic(e, 'shadow')) ifsa *= .55;
  return {basari: clamp(basari, .04, .72), ifsa: clamp(ifsa, .05, .60)};
}

/* ═══════════════════════════════════════════════════════════════════
   FAZ 30 — TEKNOLOJİ HIRSIZLIĞI
   Hedefin bildiği ama bizim bilmediğimiz bir teknolojinin
   maliyetinin %50'si araştırma puanı olarak eklenir. Kilit
   doğrudan açılmaz — yarı yolu kısaltır.
   ═══════════════════════════════════════════════════════════════════ */
function stealTech(e, target){
  if (!e || !target) return {ok:false, why:'Hedef yok'};
  if (typeof intelOf !== 'function') return {ok:false, why:'—'};
  const lvl = intelOf(e, target.id);
  if (lvl < 2) return {ok:false, why:'En az 2. seviye istihbarat gerekir'};
  if ((e.res.etk || 0) < 90) return {ok:false, why:'90 etki gerekir'};

  /* Onda olan, bizde olmayan teknolojiler */
  const adaylar = [];
  for (const id in (target.techs || {})){
    if (e.techs && e.techs[id]) continue;
    if (!TECHS[id]) continue;
    adaylar.push(id);
  }
  if (!adaylar.length) return {ok:false, why:'Çalınacak yeni teknolojisi yok'};

  e.res.etk -= 90;
  const c = sabotageChance(e, target);
  /* Teknoloji çalmak sabotajdan daha zor, daha riskli */
  const basari = clamp(c.basari * .85, .04, .65);
  const ifsa   = clamp(c.ifsa * 1.25, .06, .70);

  if (rnd() < basari){
    /* En pahalı olanı çal — istihbarat seçici davranır */
    adaylar.sort((a, b) => (TECHS[b].c || 0) - (TECHS[a].c || 0));
    const id = adaylar[Math.floor(rnd() * Math.min(3, adaylar.length))];
    const kazanc = Math.round((TECHS[id].c || 0) * .5);
    e.res.ara = (e.res.ara || 0) + kazanc;
    if (typeof recordSabotage === 'function') recordSabotage('tech');
    const msg = TECHS[id].n + ' araştırma verileri çalındı — +' + kazanc + ' araştırma';
    if (e.id === 0){
      say('📡 ' + msg, 'sci');
      if (typeof UI !== 'undefined' && UI.eventArt)
        UI.eventArt('veri', 'VERİ ELE GEÇİRİLDİ',
          target.name + ' arşivlerinden <b>' + TECHS[id].n + '</b> araştırma ' +
          'verileri kopyalandı. Laboratuvarlarımız yolun yarısını atladı: ' +
          '<b style="color:#6ff2c8">+' + kazanc + ' araştırma</b>.', 'sci');
    }
    else if (target.id === 0)
      say('VERİ SIZINTISI — ' + e.name + ' arşivlerimizden ' + TECHS[id].n + ' çaldı', 'war');
    return {ok:true, caught:false, msg, tech:id, kazanc};
  }

  if (rnd() < ifsa){
    if (typeof recordSabotage === 'function') recordSabotage('ifsa');
    if (typeof remember === 'function') remember(target, e.id, 'sabotaj');
    target.rel[e.id] = clamp(target.rel[e.id] - 45, -100, 100);
    target._lastCB = {n:'Teknoloji Hırsızlığı', w:1.30};
    for (const x of G.emps){
      if (x.dead || x.wild || x.id === e.id || x.id === target.id) continue;
      x.rel[e.id] = clamp(x.rel[e.id] - 6, -100, 100);
    }
    const msg = 'Ajan infaz edildi — ' + target.name + ' hırsızlığı ifşa etti';
    if (e.id === 0){
      say('☠ ' + msg, 'war');
      if (typeof UI !== 'undefined' && UI.eventArt)
        UI.eventArt('infaz', 'AJANIMIZ İNFAZ EDİLDİ',
          target.name + ' arşivlerine sızma girişimimizi yakaladı. Ajanımız ' +
          'idam edildi ve elimizdeki kanıtlar onlara geçti.', 'war');
    }
    else if (target.id === 0)
      say('☠ TEKNOLOJİ HIRSIZI YAKALANDI — ' + e.name + ' arşivlerimize sızmaya çalıştı', 'win');
    return {ok:true, caught:true, msg};
  }

  if (typeof recordSabotage === 'function') recordSabotage('sessiz');
  return {ok:true, caught:false, msg:'Sızma sonuçsuz kaldı — veri bulunamadı'};
}

/* Aylık deneme — invasionTick sırasında kuşatma varsa çağrılır */
function trySabotage(e, sys, pl){
  const col = pl && pl.col;
  if (!col || !e) return false;
  if ((col.shield || 0) <= 5) return false;                 // zaten inik
  const sahip = G.emps[pl.owner];
  if (!sahip || sahip.dead) return false;
  if (col.sabCd && col.sabCd > (G.memAge || 0)) return false;

  /* İstihbarat eşiği: en az temas düzeyi gerekir */
  const lvl = (typeof intelOf === 'function') ? intelOf(e, sahip.id) : 0;
  if (lvl < 1) return false;
  if ((e.res.etk || 0) < 30) return false;

  /* Denenme sıklığı — her ay değil */
  if (rnd() > .16 + lvl * .05) return false;

  col.sabCd = (G.memAge || 0) + SABOTAGE_COOLDOWN;
  e.res.etk = Math.max(0, (e.res.etk || 0) - 30);
  const c = sabotageChance(e, sahip);

  if (rnd() < c.basari){
    /* ── BAŞARI: kalkan çöker ── */
    col.shield = 0;
    col.sabotaged = (G.memAge || 0);
    if (typeof recordSabotage === 'function') recordSabotage('basari');
    if (e.id === 0)
      say('🔇 Kalkan jeneratörü sabote edildi — ' + (col.name || pl.name) +
          ' savunmasız', 'sci');
    else if (pl.owner === 0)
      say('KALKANIMIZ ÇÖKTÜ — ' + (col.name || pl.name) + ' sabotaja uğradı', 'war');
    return true;
  }

  if (rnd() < c.ifsa){
    /* ═══ FAZ 28: ÇİFT TARAFLI AJAN ═══
       İfşaların %18'inde ajan infaz edilmez, DÖNDÜRÜLÜR. Saldırgana
       "sabotaj başarılı" yalanı gider; oysa kalkan ayaktadır ve
       yörüngeye giren filolar pusuya düşer (+%25 hasar alır).
       En sinsi sonuç: oyuncu kazandığını sanarak tuzağa yürür. */
    if (rnd() < .18){
      col.ambush = (G.memAge || 0) + 12;      // 1 yıl pusu penceresi
      col.ambushBy = sahip.id;
      if (typeof recordSabotage === 'function') recordSabotage('cift');
      /* Savunan taraf gerçeği bilir */
      if (pl.owner === 0)
        say('🎭 AJANI DÖNDÜRDÜK — ' + e.name + ' sabotajın başarılı olduğunu sanıyor. ' +
            'Yörüngemize girerlerse pusuya düşecekler.', 'win');
      /* Saldırgana SAHTE başarı bildirimi */
      if (e.id === 0)
        say('🔇 Kalkan jeneratörü sabote edildi — ' + (col.name || pl.name) +
            ' savunmasız', 'sci');
      return true;                             // "başarılı" görünür
    }

    /* ── KRİTİK HATA: ajan yakalandı ── */
    if (typeof recordSabotage === 'function') recordSabotage('ifsa');
    if (typeof remember === 'function') remember(sahip, e.id, 'sabotaj');
    sahip.rel[e.id] = clamp(sahip.rel[e.id] - 40, -100, 100);
    e.res.etk = Math.max(0, (e.res.etk || 0) - 40);
    /* Kurban haklı savaş nedeni kazanır */
    sahip._lastCB = {n:'Sabotaj İfşası', w:1.25};
    /* Galaksi de duyar — sabotaj kirli iştir */
    for (const x of G.emps){
      if (x.dead || x.wild || x.id === e.id || x.id === sahip.id) continue;
      x.rel[e.id] = clamp(x.rel[e.id] - 8, -100, 100);
    }
    if (e.id === 0){
      say('☠ AJANIMIZ İNFAZ EDİLDİ — ' + sahip.name +
          ' sabotajı ifşa etti, itibarın zedelendi', 'war');
      if (typeof UI !== 'undefined' && UI.eventArt)
        UI.eventArt('infaz', 'AJANIMIZ İNFAZ EDİLDİ',
          sahip.name + ' kalkan sabotajımızı ifşa etti. Ajanımız yakalandı ve ' +
          'idam edildi. Galaksinin gözünde itibarımız zedelendi; ' +
          'karşı taraf artık haklı bir savaş nedenine sahip.', 'war');
    }
    else if (pl.owner === 0)
      say('☠ SABOTAJCI YAKALANDI — ' + e.name +
          ' kalkanımızı çökertmeye çalıştı, elimizde kanıt var', 'win');
    return false;
  }

  /* Sessiz başarısızlık: ne kalkan düştü ne ajan yakalandı */
  if (typeof recordSabotage === 'function') recordSabotage('sessiz');
  if (e.id === 0) say('Sabotaj girişimi sonuçsuz kaldı', '');
  return false;
}


/* ═══════════════════════════════════════════════════════════════════
   FAZ 29 — GALAKTİK KUTUPLAŞMA
   ÖLÇÜM (Faz 28): 60. yılda AI'lar arasında hiç savaş kalmıyordu;
   e.war bayrağı yalnız korsanlarla doluydu. Galaksi donuyor ve
   Colossus gibi geç oyun mekanikleri hiç tetiklenmiyor.
   Çözüm: 40. yıldan sonra sınır sürtüşmesi ve ideolojik uçurum
   her ay biraz daha derinleşir. Kimse zorlanmaz — nefret
   kendiliğinden birikir ve savaş doğal olarak çıkar.
   ═══════════════════════════════════════════════════════════════════ */
const POLARIZE_YEAR = 40;        // oyun yılı (başlangıç 2210 → 2250)
const POLARIZE_FLOOR = -85;      // ilişkinin inebileceği taban

function ideologyGap(a, b){
  const ea = a.ethics || {}, eb = b.ethics || {};
  let d = Math.abs((ea.mil||0) - (eb.mil||0)) +
          Math.abs((ea.aut||0) - (eb.aut||0)) * .7 +
          Math.abs((ea.mat||0) - (eb.mat||0)) * .6;
  /* Mizaç zıtlığı da sayılır */
  if (typeof personaOf === 'function'){
    const pa = personaOf(a).n, pb = personaOf(b).n;
    if ((pa === 'Militarist' && pb === 'Pasifist') ||
        (pa === 'Pasifist' && pb === 'Militarist')) d += 3;
    else if (pa !== pb) d += 1;
  }
  return d;
}

function polarizeTick(){
  const yil = (G.year || 2210) - 2210;
  if (yil < POLARIZE_YEAR) return;
  /* Kriz varken galaksi birleşir, kutuplaşma durur */
  if (typeof crisisActive === 'function' && crisisActive()) return;

  /* ÖLÇÜM: %1-2'lik baskı diğer diplomasi mekanikleri (elçi, ticaret,
     ortak düşman, konsey) tarafından eziliyordu — 40→60. yıl arası
     ortalama ilişki 74'ten 92'ye ÇIKMIŞTI. Baskı, iyileşme hızını
     aşacak seviyeye çekildi. */
  const siddet = clamp(.10 + (yil - POLARIZE_YEAR) * .006, .10, .25);

  for (const a of G.emps){
    if (a.dead || a.wild || a.crisisSide) continue;
    for (const b of G.emps){
      if (b.dead || b.wild || b.crisisSide || b.id <= a.id) continue;
      if (!a.contact[b.id]) continue;
      /* Müttefikler ve federasyon ortakları kutuplaşmaz */
      if (a.ally && a.ally[b.id]) continue;
      if (typeof findFed === 'function'){
        const fa = findFed(a), fb = findFed(b);
        if (fa && fb && fa === fb) continue;
      }
      /* Vasal-senyör bağı da korunur */
      if (typeof isVassal === 'function' &&
          ((isVassal(a) && a.overlord === b.id) ||
           (isVassal(b) && b.overlord === a.id))) continue;

      /* 1. SINIR SÜRTÜŞMESİ — komşuluk arttıkça gerilim */
      let komsu = 0;
      for (const sy of G.sys){
        if (sy.owner !== a.id) continue;
        for (const l of sy.lanes)
          if (G.sys[l] && G.sys[l].owner === b.id){ komsu++; break; }
      }
      /* 2. İDEOLOJİK UÇURUM */
      const gap = ideologyGap(a, b);

      /* Taban baskı: komşu olmasa bile ideolojik uçurum yeter */
      const baski = (1.2 + komsu * 1.6 + gap * 1.1) * siddet;
      if (baski <= 0) continue;
      a.rel[b.id] = clamp((a.rel[b.id] || 0) - baski, POLARIZE_FLOOR, 100);
      b.rel[a.id] = clamp((b.rel[a.id] || 0) - baski, POLARIZE_FLOOR, 100);
    }
  }
}


/* ═══════════════════════════════════════════════════════════════════
   FAZ 30 — HEGEMONYA GERİLİMİ (GÜÇ KORKUSU)
   ÖLÇÜM (izole, 40. yıl sonrası, AI çifti başına 12 tur):
     envoyTick (elçi) ... +11.71   ← baskın
     polarizeTick ....... −3.36
     borderFriction ..... −2.70
   Elçi mekaniği tek başına iki kötüleştiriciyi ezip geçiyordu.
   Suni ilişki tavanı koymak yerine ORGANİK bir korku ekliyoruz:
   yalnızca DEV olan korkutur. Küçük ve pasifist devletler
   bundan hiç etkilenmez — barışçıl oynayış cezalandırılmaz.
   ═══════════════════════════════════════════════════════════════════ */
const HEGEMON_RATIO = 1.6;       // galaktik ortalamanın kaç katı "dev"

/* Bir imparatorluğun galaktik ölçekteki ağırlığı: askerî güç,
   toprak ve nüfusun bileşimi. */
function hegemonWeight(e){
  if (!e || e.dead || e.wild) return 0;
  const filo = (typeof totalPower === 'function') ? totalPower(e) : 0;
  const sistem = (typeof sysCount === 'function') ? sysCount(e) : 0;
  let pop = 0;
  for (const c of (e.colonies || [])){
    const sy = G.sys[c.s];
    const pl = sy && sy.planets[c.p];
    if (pl && pl.col) pop += pl.col.pop;
  }
  return filo * .55 + sistem * 42 + pop * 7;
}

function hegemonyTick(){
  const canli = G.emps.filter(e => !e.dead && !e.wild && !e.crisisSide);
  if (canli.length < 3) return;

  /* Galaktik ortalama */
  let toplam = 0;
  const agirlik = {};
  for (const e of canli){ agirlik[e.id] = hegemonWeight(e); toplam += agirlik[e.id]; }
  const ort = toplam / canli.length;
  if (ort <= 0) return;

  for (const dev of canli){
    const oran = agirlik[dev.id] / ort;
    if (oran < HEGEMON_RATIO) { delete dev.hegemonFear; continue; }

    /* Ne kadar devsen o kadar korkutucusun. 1.6× → .35, 3× → 1.4 */
    const korku = clamp((oran - HEGEMON_RATIO) * .75, 0, 1.6);
    dev.hegemonFear = korku;

    for (const o of canli){
      if (o.id === dev.id) continue;
      if (!o.contact[dev.id]) continue;
      /* Müttefikler ve federasyon ortakları korkmaz */
      if (o.ally && o.ally[dev.id]) continue;
      if (typeof findFed === 'function'){
        const fa = findFed(o), fb = findFed(dev);
        if (fa && fb && fa === fb) continue;
      }
      /* Vasalı zaten boyun eğmiş */
      if (typeof isVassal === 'function' && isVassal(o) && o.overlord === dev.id) continue;

      /* KÜÇÜK VE PASİFİST DEVLETLER ETKİLENMEZ:
         korku, korkanın kendi büyüklüğüyle ölçeklenir. Cüce bir
         devlet devle boy ölçüşmeyi düşünmez; onun korkusu
         diplomatik değil, varoluşsaldır ve savaşa dönüşmez. */
      const benimOran = agirlik[o.id] / ort;
      let carpan = clamp(benimOran, .25, 1.4);
      if (typeof personaOf === 'function'){
        const P = personaOf(o);
        if (P.n === 'Pasifist') carpan *= .35;        // pasifist korkmaz, kaçınır
        else if (P.n === 'Militarist') carpan *= 1.35;
        else if (P.n === 'İzolasyonist') carpan *= 1.15;
      }
      const dusus = korku * carpan;
      if (dusus <= 0) continue;
      o.rel[dev.id] = clamp((o.rel[dev.id] || 0) - dusus, -100, 100);
    }
  }
}


/* ═══════════════════════════════════════════════════════════════════
   FAZ 32 — SENATO GÜNDEM KUYRUĞU
   Rastgele sponsor kaldırıldı. Her üye kendi ideolojisine ve
   ihtiyacına uyan bir yasayı kuyruğa önerir; oylama vakti geldiğinde
   arkasında EN ÇOK DİPLOMATİK AĞIRLIK duran teklif masaya gelir.
   Kuyruk aylık tikte tek geçişle taranır — derin döngü yok.
   ═══════════════════════════════════════════════════════════════════ */

/* Bir üyenin bir yasaya duyduğu ihtiyaç (0–2 arası). Oylama
   sırasındaki `want` ile aynı ruhu taşır ama teklif AŞAMASINDA
   kullanılır: "bunu ben gündeme getirmek ister miyim?" */
function agendaDesire(e, key){
  const R = RESOLUTIONS[key];
  if (!R) return 0;
  const p = aiProfile(e);
  const P = (typeof personaOf === 'function') ? personaOf(e) : null;
  const mz = P ? P.n : '';
  let d = .25;
  const lean = R.lean || {};
  for (const k in lean) d += (p[k] || 0) * lean[k] * .7;

  /* ── SOMUT İHTİYAÇ: yasa benim eksiğimi kapatıyor mu? ── */
  const inc = e.inc || {};
  if (key === 'arastirma'  && (inc.ara || 0) < 60)  d += .55;
  if (key === 'madenTekel' && (inc.min || 0) < 40)  d += .55;
  if (key === 'ticaretStd' || key === 'serbest'){
    if (e.trade && e.trade.mul > 1.2) d += .40;      // ticareti güçlü olan ister
  }
  if (key === 'gocSerbest'){
    let dolu = 0;
    for (const c of e.colonies){
      const pl = G.sys[c.s] && G.sys[c.s].planets[c.p];
      if (pl && pl.col && pl.col.pop < pl.col.cap * .7) dolu++;
    }
    if (dolu >= 2) d += .45;                          // büyüyecek yerim var
  }
  if (key === 'sinirGuv'){
    let tehdit = 0;
    for (const o of G.emps) if (!o.dead && !o.wild && e.war[o.id]) tehdit++;
    d += Math.min(.8, tehdit * .35);
  }
  if (key === 'silahsiz'){
    /* Zayıf olan silahsızlanmayı ister, güçlü olan istemez */
    const ort = (typeof hegemonWeight === 'function') ? hegemonWeight(e) : totalPower(e);
    let toplam = 0, n = 0;
    for (const o of G.emps){
      if (o.dead || o.wild) continue;
      toplam += (typeof hegemonWeight === 'function') ? hegemonWeight(o) : totalPower(o);
      n++;
    }
    const oran = n ? ort / (toplam / n) : 1;
    d += clamp((1 - oran) * .9, -.7, .7);
  }
  if (key === 'casusInfaz'){
    /* Casusluğa uğrayan bunu ister */
    const magdur = (e.hitLog || []).length;
    d += Math.min(.7, magdur * .12);
    if (typeof hasCivic === 'function' && hasCivic(e, 'shadow')) d -= .8;  // casus devlet istemez
  }
  if (key === 'colYasak'){
    /* HAYATTA KALMA REFLEKSİ: Colossus'u olan ya da yapmayı
       planlayan asla istemez; olmayan ve korkan çok ister. */
    const benim = G.fleets.some(f => f.e === e.id && f.ships.length &&
      typeof isColossus === 'function' && isColossus(f));
    if (benim || (e.colossusReserve || 0) > 0) d -= 1.6;
    else {
      let dusmandaVar = false;
      for (const f of G.fleets){
        if (!f.ships.length || f.e === e.id) continue;
        if (typeof isColossus !== 'function' || !isColossus(f)) continue;
        if (e.war[f.e] || (e.rel[f.e] || 0) < -30) { dusmandaVar = true; break; }
      }
      if (dusmandaVar) d += 1.3;                       // düşmanımda var, yasaklayalım
      if (mz === 'Pasifist') d += .5;
    }
  }

  /* FAZ 35: kriz tepkisi teklif AŞAMASINDA da geçerli — inatçı
     devlet pakta ancak paniğe kapılınca sponsor olur. */
  if (key === 'savunmaPakti' || key === 'birlesme'){
    const yakin = (typeof crisisProximity === 'function') ? crisisProximity(e) : 0;
    if (mz === 'Militarist')        d -= .95;
    else if (mz === 'İzolasyonist') d -= 1.15;
    else if (mz === 'Pasifist')     d += 1.10;
    if (yakin >= 2) d += 3.0;
    else if (yakin >= 1) d += 1.8;
  }

  /* Mizaç renkleri */
  if (mz === 'Tüccar' && (key === 'ticaretStd' || key === 'serbest' || key === 'madenTekel')) d += .45;
  if (mz === 'Pasifist' && (key === 'silahsiz' || key === 'savasYasak')) d += .5;
  if (mz === 'Militarist' && (key === 'muhafiz' || key === 'sinirGuv')) d += .45;
  if (mz === 'Militarist' && key === 'silahsiz') d -= .9;
  if (mz === 'İzolasyonist' && (key === 'ticaretStd' || key === 'serbest' || key === 'gocSerbest')) d -= .8;
  if (mz === 'Yayılmacı' && key === 'gocSerbest') d += .5;
  return d;
}

/* Aylık: her üye kuyruğa bir teklif koyar ya da mevcut bir teklifi
   destekler. Kuyruk uzunluğu sınırlı, eski teklifler solar. */
function agendaTick(){
  if (!councilExists()) return;
  const c = G.council;
  c.agenda = c.agenda || [];

  /* Solma: desteklenmeyen teklif zamanla düşer */
  for (let i = c.agenda.length - 1; i >= 0; i--){
    c.agenda[i].age++;
    if (c.agenda[i].age > 36) c.agenda.splice(i, 1);
  }

  /* Ayda bir üye söz alır — döngü ağırlaşmasın */
  const uyeler = c.members.filter(m => G.emps[m] && !G.emps[m].dead &&
    !G.emps[m].wild && m !== 0 &&
    !(typeof isVassal === 'function' && isVassal(G.emps[m]) && c.members.includes(G.emps[m].overlord)));
  if (!uyeler.length) return;
  const konusan = G.emps[uyeler[Math.floor(rnd() * uyeler.length)]];
  if (!konusan) return;

  const acik = openResolutions();
  if (!acik.length) return;

  /* En çok istediği yasayı bul */
  let enIyi = null, enD = .45;                 // eşik: kayıtsızsa susar
  for (const k of acik){
    const d = agendaDesire(konusan, k);
    if (d > enD){ enD = d; enIyi = k; }
  }
  if (!enIyi) return;

  const mevcut = c.agenda.find(a => a.key === enIyi);
  if (mevcut){
    if (!mevcut.backers.includes(konusan.id)) mevcut.backers.push(konusan.id);
    mevcut.age = 0;
  } else {
    if (c.agenda.length >= 6) c.agenda.shift();     // kuyruk tavanı
    c.agenda.push({key: enIyi, backers: [konusan.id], age: 0,
                   target: null, by: konusan.id});
  }
}

/* Şu an önerilebilir yasalar */
function openResolutions(){
  const c = G.council;
  if (!c) return [];
  const paryaAday = (typeof pariahCandidate === 'function') ? pariahCandidate() : null;
  const krizVar = (typeof crisisActive === 'function') && crisisActive();
  return Object.keys(RESOLUTIONS).filter(k => {
    const R = RESOLUTIONS[k];
    if (k === 'parya'){
      /* FAZ 37: çoklu parya — aday zaten parya değilse önerilebilir */
      if (!paryaAday) return false;
      const map = (typeof pariahMap === 'function') ? pariahMap() : {};
      return !map[paryaAday.id];
    }
    if (k === 'birlesme') return krizVar && !c.laws.birlesme;
    if (R.hedefli) return true;
    return !c.laws[k];
  });
}

/* Kuyruktan en güçlü destekli teklifi seç */
function topAgenda(){
  const c = G.council;
  if (!c || !c.agenda || !c.agenda.length) return null;
  const acik = openResolutions();
  let en = null, enW = 0;
  for (const a of c.agenda){
    if (acik.indexOf(a.key) < 0) continue;         // artık geçersiz
    let w = 0;
    for (const b of a.backers){
      const o = G.emps[b];
      if (o && !o.dead) w += voteWeight(o);
    }
    if (w > enW){ enW = w; en = a; }
  }
  return en;
}


/* ═══════════════════════════════════════════════════════════════════
   FAZ 32 — KAMPANYA DÖNEMİ
   Gündem ilan edilir, 3 ay boyunca oylar açık kalır. Bu pencerede
   oyuncu rüşvet ve şantajla `want` puanlarını manipüle edebilir.
   Süre dolunca startCouncilVote(kampanya) çağrılır.
   ═══════════════════════════════════════════════════════════════════ */
const CAMPAIGN_MONTHS = 3;

function prepareCouncilVote(){
  const c = G.council;
  if (!c || c.dead || c.vote || c.campaign) return;

  const open = openResolutions();
  if (!open.length) return;

  /* Gündemi şimdiden belirle — kampanya neyin üstüne yürüyecek? */
  const paryaAday = (typeof pariahCandidate === 'function') ? pariahCandidate() : null;
  const krizVar = (typeof crisisActive === 'function') && crisisActive();
  const kuyruk = (typeof topAgenda === 'function') ? topAgenda() : null;

  let key = null, sponsorId = null;
  if (c.firstLaw && open.includes(c.firstLaw)) key = c.firstLaw;
  else if (krizVar && open.includes('birlesme')) key = 'birlesme';
  else if (paryaAday && open.includes('parya')) key = 'parya';
  else if (kuyruk && open.includes(kuyruk.key)){ key = kuyruk.key; sponsorId = kuyruk.by; }
  else key = open[Math.floor(rnd() * open.length)];

  c.campaign = {key, sponsor: sponsorId, left: CAMPAIGN_MONTHS,
                bribed: {}, blackmailed: [], agenda: kuyruk || null};

  const R = RESOLUTIONS[key];
  if (c.members.includes(0) && G.emps[0] && !G.emps[0].dead){
    say('SENATO GÜNDEMİ AÇILDI — ' + R.ico + ' ' + R.n +
        ' · ' + CAMPAIGN_MONTHS + ' ay kampanya', 'sci');
  }
}

/* ── OY MANİPÜLASYONU ──
   İkisi de yalnız kampanya penceresinde çalışır. */

/* Rüşvet: şeffaf, risksiz, pahalı. Etki hedefin açgözlülüğüne bağlı. */
function bribeVote(e, target, miktar, yon){
  const c = G.council;
  if (!c || !c.campaign) return {ok:false, why:'Kampanya dönemi değil'};
  if (!target || target.dead) return {ok:false, why:'Hedef yok'};
  if (!c.members.includes(target.id)) return {ok:false, why:'Hedef konsey üyesi değil'};
  if (c.campaign.bribed[target.id]) return {ok:false, why:'Bu devlete zaten teklif yaptın'};
  miktar = Math.max(50, Math.round(miktar || 200));
  if ((e.res.min || 0) < miktar) return {ok:false, why:miktar + ' mineral gerekir'};

  e.res.min -= miktar;
  target.res.min = (target.res.min || 0) + miktar;

  /* Etki: miktar / hedefin büyüklüğü. Dev bir devlet kolay satın
     alınmaz; küçük bir devlet için aynı para servettir. */
  const olcek = Math.max(1, (typeof hegemonWeight === 'function')
    ? hegemonWeight(target) / 300 : 1);
  let guc = miktar / (260 * olcek);
  const P = (typeof personaOf === 'function') ? personaOf(target) : null;
  if (P){
    if (P.n === 'Tüccar') guc *= 1.45;            // para konuşur
    else if (P.n === 'Pasifist') guc *= .75;
    else if (P.n === 'İzolasyonist') guc *= .60;  // rüşvet onları rahatsız eder
  }
  /* FAZ 33 DÜZELTMESİ: clamp mizaç çarpanından ÖNCE uygulanıyordu,
     Tüccar'da 1.1 × 1.45 = 1.59 ile tavan aşılıyordu (ölçümde
     görüldü). Artık sınır en sonda — para tek başına oylamayı
     satın alamaz. */
  guc = clamp(guc, .05, 1.1);
  /* ═══ YÖN ═══
     Manipülasyon oyuncunun İSTEDİĞİ tarafa iter. Bir yasayı
     engellemek istiyorsan hayır yönünde rüşvet verirsin.
     (Tasarım hatasıydı: her şey "evet"e itiyordu ve muhalefet
      oynamak imkânsızdı.) */
  c.campaign.bribed[target.id] = (yon === 'no') ? -guc : guc;
  /* Küçük bir iyi niyet — para dostluk da getirir */
  target.rel[e.id] = clamp((target.rel[e.id] || 0) + 4, -100, 100);
  return {ok:true, guc, miktar};
}

/* Şantaj: istihbarat gerektirir, çok etkili, ifşa olursa yıkıcı. */
function blackmailVote(e, target, yon){
  const c = G.council;
  if (!c || !c.campaign) return {ok:false, why:'Kampanya dönemi değil'};
  if (!target || target.dead) return {ok:false, why:'Hedef yok'};
  if (!c.members.includes(target.id)) return {ok:false, why:'Hedef konsey üyesi değil'};
  if (c.campaign.blackmailed.some(b => (b.id !== undefined ? b.id : b) === target.id))
    return {ok:false, why:'Bu devlete zaten şantaj yaptın'};
  const lvl = (typeof intelOf === 'function') ? intelOf(e, target.id) : 0;
  if (lvl < 2) return {ok:false, why:'En az 2. seviye istihbarat gerekir'};
  if ((e.res.etk || 0) < 60) return {ok:false, why:'60 etki gerekir'};

  /* Elimizde gerçekten kirli bir sır var mı? */
  const kirli = (target.threat || 0) > 15 ||
    (typeof honorOf === 'function' && honorOf(target) < -10) ||
    (target.opLog || []).some(w => !w.caught);
  if (!kirli) return {ok:false, why:'Elinde kullanılabilir bir sır yok'};

  e.res.etk -= 60;
  const ch = (typeof sabotageChance === 'function')
    ? sabotageChance(e, target) : {basari:.4, ifsa:.3};

  if (rnd() < ch.basari){
    c.campaign.blackmailed.push({id: target.id, yon: yon === 'no' ? -1 : 1});
    return {ok:true, caught:false,
      msg: target.name + ' sessiz kalmayı seçti — oyu bizim tarafımızda'};
  }

  /* İFŞA: ajan yakalandı */
  if (typeof remember === 'function') remember(target, e.id, 'sabotaj');
  target.rel[e.id] = clamp(target.rel[e.id] - 50, -100, 100);
  target._lastCB = {n:'Senato Şantajı', w:1.35};
  /* Konsey bunu duyar — tüm üyeler tepki gösterir */
  for (const m of c.members){
    if (m === e.id || m === target.id) continue;
    const o = G.emps[m];
    if (o && !o.dead) o.rel[e.id] = clamp(o.rel[e.id] - 12, -100, 100);
  }
  if (typeof recordSabotage === 'function') recordSabotage('ifsa');
  return {ok:true, caught:true,
    msg: 'ŞANTAJ İFŞA OLDU — ' + target.name + ' senatoya kanıtları sundu'};
}


/* ═══════════════════════════════════════════════════════════════════
   FAZ 33 — AI KAMPANYA BÜTÇESİ
   Faz 32'de yalnız oyuncu manipüle edebiliyordu; asimetrikti.
   Artık AI da kampanya döneminde kendi çıkarına olan yasa için
   rüşvet basıyor. Bütçe sınırlı: stoğun küçük bir dilimi.
   ═══════════════════════════════════════════════════════════════════ */
function aiCampaignTick(){
  const c = G.council;
  if (!c || c.dead || !c.campaign) return;
  const key = c.campaign.key;

  for (const m of c.members){
    const e = G.emps[m];
    if (!e || e.dead || e.wild || !e.ai) continue;
    /* Ayda tek girişim, kampanya başına da tek */
    if (c.campaign.aiSpent && c.campaign.aiSpent[e.id]) continue;

    const istek = (typeof agendaDesire === 'function') ? agendaDesire(e, key) : 0;
    /* Kayıtsızsa para harcamaz — eşik hem evet hem hayır yönünde */
    if (Math.abs(istek - .5) < .45) continue;
    const yon = istek > .5 ? 1 : -1;

    /* BÜTÇE: mineral stoğunun en fazla %12'si, tavan 600.
       Ekonomiyi çökertmemeli. */
    const butce = Math.min(600, Math.floor((e.res.min || 0) * .12));
    if (butce < 120) continue;

    /* Ters yönde duran, ucuz (düşük ağırlıklı) bir üye seç */
    let hedef = null, enUcuz = 1e9;
    for (const m2 of c.members){
      const o = G.emps[m2];
      if (!o || o.dead || o.wild || o.id === e.id) continue;
      if (c.campaign.bribed[o.id]) continue;               // zaten alınmış
      if (o.ally && o.ally[e.id]) continue;                // müttefik zaten yanımızda
      const oIstek = (typeof agendaDesire === 'function') ? agendaDesire(o, key) : .5;
      /* Bizimle aynı fikirdeyse rüşvete gerek yok */
      if ((oIstek > .5 ? 1 : -1) === yon) continue;
      const w = (typeof voteWeight === 'function') ? voteWeight(o) : 1;
      if (w < enUcuz){ enUcuz = w; hedef = o; }
    }
    if (!hedef) continue;

    const r = bribeVote(e, hedef, butce, yon > 0 ? 'yes' : 'no');
    if (r.ok){
      c.campaign.aiSpent = c.campaign.aiSpent || {};
      c.campaign.aiSpent[e.id] = butce;
      /* Oyuncu üye ise ve hedef oyuncuysa haber verilir */
      if (hedef.id === 0)
        say(e.name + ' senato oyun için ' + butce + ' mineral teklif etti', 'sci');
    }
  }
}


/* ═══════════════════════════════════════════════════════════════════
   FAZ 33 — SAHTE BAYRAK OPERASYONU
   En riskli istihbarat hamlesi: hedefe saldırırken suçu masum bir
   üçüncü devletin üstüne yıkarsın.
     KRİTİK BAŞARI  → hedef, masum devlete savaş ilan eder
     NORMAL BAŞARI  → iş görülür, suç masuma yazılır (savaş yok)
     FİYASKO        → suçüstü yakalanırsın: GALAKTİK PARYA,
                      konseyden ihraç, sınır kalkanları %50 zayıflar
   Faz 15'teki w.framed altyapısını kullanır — Derin Soruşturma
   bu iftirayı sonradan ortaya çıkarabilir.
   ═══════════════════════════════════════════════════════════════════ */

function falseFlagCost(){ return {etk: 140}; }

/* Uygun mu? Hem hedef hem günah keçisi gerekir. */
function canFalseFlag(e, target, patsy){
  if (!e || !target || !patsy) return {ok:false, why:'Hedef ve günah keçisi gerekir'};
  if (target.id === patsy.id) return {ok:false, why:'Aynı devlet olamaz'};
  if (target.id === e.id || patsy.id === e.id) return {ok:false, why:'Kendini seçemezsin'};
  if (target.dead || patsy.dead) return {ok:false, why:'Devlet yok'};
  const lvl = (typeof intelOf === 'function') ? intelOf(e, target.id) : 0;
  if (lvl < 2) return {ok:false, why:'Hedefte en az 2. seviye istihbarat gerekir'};
  if (!e.contact[patsy.id]) return {ok:false, why:'Günah keçisiyle temasın yok'};
  if ((e.res.etk || 0) < falseFlagCost().etk)
    return {ok:false, why:falseFlagCost().etk + ' etki gerekir'};
  /* İnandırıcılık: hedef zaten günah keçisinden nefret ediyorsa iş kolay */
  return {ok:true};
}

/* tur: 'sabotaj' (konsey oyu) veya 'tekno' (teknoloji hırsızlığı) */
function falseFlagOp(e, target, patsy, tur){
  const chk = canFalseFlag(e, target, patsy);
  if (!chk.ok) return chk;
  e.res.etk -= falseFlagCost().etk;

  const ch = (typeof sabotageChance === 'function')
    ? sabotageChance(e, target) : {basari:.4, ifsa:.3};
  /* Sahte bayrak normal operasyondan zor: iki katmanlı yalan */
  const basari = clamp(ch.basari * .75, .04, .60);
  const fiyasko = clamp(ch.ifsa * 1.45, .08, .68);

  /* İNANDIRICILIK: hedefin günah keçisine bakışı */
  const husumet = -(target.rel[patsy.id] || 0);          // negatif ilişki = artı
  const inandirici = clamp(.25 + husumet / 90, .1, 1);

  if (rnd() < basari){
    /* ── İŞ GÖRÜLDÜ ── */
    let sonuc = '';
    if (tur === 'tekno'){
      const adaylar = [];
      for (const id in (target.techs || {}))
        if (!(e.techs && e.techs[id]) && TECHS[id]) adaylar.push(id);
      if (adaylar.length){
        adaylar.sort((a, b) => (TECHS[b].c || 0) - (TECHS[a].c || 0));
        const id = adaylar[Math.floor(rnd() * Math.min(3, adaylar.length))];
        const kazanc = Math.round((TECHS[id].c || 0) * .5);
        e.res.ara = (e.res.ara || 0) + kazanc;
        sonuc = TECHS[id].n + ' çalındı (+' + kazanc + ' araştırma)';
      } else sonuc = 'Çalınacak veri bulunamadı';
    } else {
      /* Konsey oyu sabotajı: hedefin oyu bizim tarafa kayar */
      const c = G.council;
      if (c && c.campaign){
        c.campaign.blackmailed.push({id: target.id, yon: 1});
        sonuc = target.name + ' senatoda susturuldu';
      } else sonuc = 'Hedefin diplomatik ağı sarsıldı';
      target.res.etk = Math.max(0, (target.res.etk || 0) - 80);
    }

    /* SUÇ GÜNAH KEÇİSİNE YAZILIR — Faz 15 kalıbı */
    target.hitLog = target.hitLog || [];
    target.hitLog.push({t: G.memAge || 0, k: tur === 'tekno' ? 'teknoCal' : 'sabotaj',
                        by: patsy.id, framed: e.id, caught: false, known: true});
    if (typeof remember === 'function') remember(target, patsy.id, 'sabotaj');
    target.rel[patsy.id] = clamp((target.rel[patsy.id] || 0) - 45, -100, 100);

    /* ── KRİTİK BAŞARI: hedef masuma savaş açar ── */
    let savas = false;
    if (rnd() < inandirici * .55 && !target.war[patsy.id] &&
        typeof warAuthorize === 'function'){
      target._lastCB = {n: 'Sahte Bayrak Kanıtı', w: 1.30};
      warAuthorize(target, patsy, target._lastCB);
      declareWar(target, patsy);
      if (typeof warAuthClear === 'function') warAuthClear();
      savas = true;
    }
    if (typeof recordSabotage === 'function') recordSabotage('falseflag');
    return {ok:true, caught:false, savas, sonuc,
      msg: sonuc + ' — suç ' + patsy.name + ' üstüne yıkıldı' +
           (savas ? '. ' + target.name + ' ona SAVAŞ İLAN ETTİ!' : '')};
  }

  if (rnd() < fiyasko){
    /* ── FİYASKO: SUÇÜSTÜ ── */
    if (typeof remember === 'function'){
      remember(target, e.id, 'sahteBayrak');
      remember(patsy, e.id, 'sahteBayrak');
    }
    target.rel[e.id] = -100;
    patsy.rel[e.id] = -100;

    /* GALAKTİK PARYA */
    e.threat = (e.threat || 0) + 75;
    for (const x of G.emps){
      if (x.dead || x.wild || x.id === e.id) continue;
      x.rel[e.id] = clamp((x.rel[e.id] || 0) - 55, -100, 100);
      /* Sınırlar kapanır */
      if (x.passage) delete x.passage[e.id];
      if (e.passage) delete e.passage[x.id];
    }
    /* Konseyden ihraç */
    const c = G.council;
    if (c && !c.dead && c.members.includes(e.id)){
      c.members = c.members.filter(m => m !== e.id);
      c.targeted = c.targeted || {};
      if (typeof addPariah === 'function') addPariah(e.id);   // FAZ 37: çoklu
    }
    /* CEZA: sınır sistemlerindeki kalkanlar bu tur %50 zayıflar */
    let vurulan = 0;
    for (const c2 of (e.colonies || [])){
      const sy = G.sys[c2.s];
      if (!sy) continue;
      /* Sınır sistemi: komşusunda yabancı var mı? */
      let sinir = false;
      for (const l of sy.lanes){
        const o2 = G.sys[l];
        if (o2 && o2.owner >= 0 && o2.owner !== e.id){ sinir = true; break; }
      }
      if (!sinir) continue;
      const pl = sy.planets[c2.p];
      if (pl && pl.col && pl.col.shield > 0){
        pl.col.shield = Math.round(pl.col.shield * .5);
        vurulan++;
      }
    }
    if (typeof recalcMods === 'function') G.emps.forEach(x => { if (!x.dead) recalcMods(x); });
    if (typeof recordSabotage === 'function') recordSabotage('ifsa');
    return {ok:true, caught:true, vurulan,
      msg: 'SUÇÜSTÜ YAKALANDIN — GALAKTİK PARYA İLAN EDİLDİN. Konseyden ihraç ' +
           'edildin, tüm sınırlar kapandı ve ' + vurulan +
           ' sınır dünyasının kalkanı yarıya düştü.'};
  }

  /* Sessiz başarısızlık */
  if (typeof recordSabotage === 'function') recordSabotage('sessiz');
  return {ok:true, caught:false, msg:'Operasyon sonuçsuz kaldı — iz bırakılmadı'};
}


/* ═══════════════════════════════════════════════════════════════════
   FAZ 34 — KENDİ ÜZERİMİZDEKİ KOMPLOYU ÇÖZ
   OPS.sorusturma bir HEDEF gerektiriyor ("şu devletin üstündeki
   iftirayı çöz"). Ama oyuncu çoğu zaman şunu sorar: "bana neden
   savaş açıldı, perde arkasında kim var?"
   Bu fonksiyon hedefsiz çalışır: kendi hitLog'umuzdaki iftiralı
   ve çözülmemiş dosyaları tarar, kuklacıyı bulur.
   ═══════════════════════════════════════════════════════════════════ */
const DEEP_INVESTIGATE_COST = 90;

/* Elimizde soruşturulacak bir şey var mı? Arayüz bunu okur. */
function deepInvestigateInfo(e){
  const log = e.hitLog || [];
  const iftirali = log.filter(w => w.framed !== undefined);
  const acik = log.filter(w => !w.known);
  /* Parya isek ya da sebepsiz savaştaysak şüphe güçlüdür */
  let supheliSavas = 0;
  for (const o of G.emps){
    if (o.dead || o.wild || o.crisisSide || !e.war[o.id]) continue;
    const cb = (o.warCause && o.warCause[e.id]) || '';
    if (cb === 'Sahte Bayrak Kanıtı' || cb === 'Sabotaj İfşası' ||
        cb === 'Teknoloji Hırsızlığı' || cb === 'Senato Şantajı') supheliSavas++;
  }
  return {
    iftirali: iftirali.length,
    acik: acik.length,
    supheliSavas,
    varMi: (iftirali.length + acik.length) > 0,
    maliyet: DEEP_INVESTIGATE_COST
  };
}

function deepInvestigate(e){
  if (!e) return {ok:false, why:'—'};
  if ((e.res.etk || 0) < DEEP_INVESTIGATE_COST)
    return {ok:false, why:DEEP_INVESTIGATE_COST + ' etki gerekir'};
  const bilgi = deepInvestigateInfo(e);
  if (!bilgi.varMi)
    return {ok:false, why:'Soruşturulacak şüpheli dosya yok — kimse sana komplo kurmamış'};

  e.res.etk -= DEEP_INVESTIGATE_COST;

  /* Başarı: kendi ajanlarımızın gücü + karşı tarafın gizleme becerisi */
  const prof = (typeof aiProfile === 'function') ? aiProfile(e) : {dip:.5, sci:.5};
  let sans = .38 + prof.dip * .18 + prof.sci * .12;
  if (typeof hasCivic === 'function'){
    if (hasCivic(e, 'shadow')) sans += .20;
    if (hasCivic(e, 'counter')) sans += .15;
  }
  sans = clamp(sans, .20, .88);
  if (rnd() > sans)
    return {ok:true, cozuldu:false, msg:'Soruşturma çıkmaza girdi — izler silinmiş'};

  /* ── ÖNCELİK: İFTİRALI DOSYA (gerçek kuklacı) ── */
  const iftirali = (e.hitLog || []).filter(w => w.framed !== undefined);
  if (iftirali.length){
    const d = iftirali[Math.floor(rnd() * iftirali.length)];
    const sucsuz = G.emps[d.by];              // suçu üstüne yıkılan
    const gercek = G.emps[d.framed];          // asıl fail
    d.by = d.framed;
    delete d.framed;
    d.known = true;
    d.foundAt = G.memAge || 0;

    /* Masuma karşı kin siliniyor, ilişki onarılıyor */
    if (sucsuz && !sucsuz.dead){
      if (e.mem && e.mem[sucsuz.id])
        e.mem[sucsuz.id] = e.mem[sucsuz.id].filter(m =>
          m.k !== 'komplo' && m.k !== 'sabotaj');
      e.rel[sucsuz.id] = clamp((e.rel[sucsuz.id] || 0) + 35, -100, 100);
      sucsuz.rel[e.id] = clamp((sucsuz.rel[e.id] || 0) + 20, -100, 100);
      if (typeof remember === 'function') remember(sucsuz, e.id, 'yardimEtti');
    }
    /* Kin gerçek faile dönüyor + savaş nedeni */
    if (gercek && !gercek.dead){
      if (typeof remember === 'function') remember(e, gercek.id, 'sahteBayrak');
      e.rel[gercek.id] = clamp((e.rel[gercek.id] || 0) - 55, -100, 100);
      e._lastCB = {n:'İfşa Edilmiş Komplo', w:1.40};
      /* Galaksi de öğrenir — iftiracının itibarı gider */
      for (const x of G.emps){
        if (x.dead || x.wild || x.crisisSide || x.id === gercek.id || x.id === e.id) continue;
        x.rel[gercek.id] = clamp((x.rel[gercek.id] || 0) - 18, -100, 100);
      }
      /* Tehdit puanı tavanlı: üst üste ifşalar sonsuz birikmesin
         (testte 60 soruşturmada 975'e çıkmıştı). */
      gercek.threat = Math.min(120, (gercek.threat || 0) + 25);
    }
    return {ok:true, cozuldu:true, kuklaci: gercek ? gercek.id : null,
      sucsuz: sucsuz ? sucsuz.id : null,
      msg: (gercek ? gercek.name : 'Bilinmeyen bir el') + ' perde arkasındaydı' +
           (sucsuz ? ' — ' + sucsuz.name + ' suçsuzmuş' : '') +
           '. Galaksi gerçeği öğrendi ve elimizde artık meşru bir savaş nedeni var.'};
  }

  /* ── İKİNCİL: FAİLİ MEÇHUL DOSYA ── */
  const acik = (e.hitLog || []).filter(w => !w.known);
  if (acik.length){
    const d = acik[Math.floor(rnd() * acik.length)];
    if (d.by === undefined)
      return {ok:true, cozuldu:false, msg:'Dosya soğuk — iz kalmamış'};
    d.known = true;
    d.foundAt = G.memAge || 0;
    const fail = G.emps[d.by];
    if (fail && !fail.dead){
      if (typeof remember === 'function') remember(e, fail.id, 'komplo');
      e.rel[fail.id] = clamp((e.rel[fail.id] || 0) - 30, -100, 100);
    }

    /* ═══ FAZ 43: KIŞKIRTMA İFŞASI ═══
       Halkı ayaklandırmak sıradan bir sabotaj değil — iç işlere
       müdahaledir. Galaksi duyar, mağdur savaş nedeni kazanır. */
    if (d.k === 'kiskirt' && fail && !fail.dead){
      e.rel[fail.id] = clamp((e.rel[fail.id] || 0) - 25, -100, 100);
      e._lastCB = {n:'İç İşlerine Müdahale', w:1.28};
      fail.threat = Math.min(120, (fail.threat || 0) + 20);
      for (const x of G.emps){
        if (x.dead || x.wild || x.crisisSide) continue;
        if (x.id === fail.id || x.id === e.id) continue;
        x.rel[fail.id] = clamp((x.rel[fail.id] || 0) - 14, -100, 100);
      }
      /* Kışkırtılan koloninin huzursuzluğu kırılır: halk kandırıldığını anlar */
      const sy2 = (d.sys !== undefined) ? G.sys[d.sys] : null;
      const pl2 = sy2 && (d.pi !== undefined) ? sy2.planets[d.pi] : null;
      if (pl2 && pl2.col){
        if (pl2.col.unrest) delete pl2.col.unrest;
        pl2.col.secede = Math.max(0, (pl2.col.secede || 0) - 8);
      }
      const ad2 = (pl2 && pl2.col) ? (pl2.col.name || pl2.name) : 'bir dünyamız';
      say('🔍 KOMPLO ÇÖZÜLDÜ — ' + fail.name + ', ' + ad2 +
          ' halkını ayaklandıran eldi. Galaksi gerçeği öğrendi.', 'win');
      return {ok:true, cozuldu:true, kuklaci: fail.id, kiskirtma:true,
        msg: fail.name + ' halkımızı ayaklandıran eldi — ' + ad2 +
             ' isyanı dış kışkırtmaydı. Artık meşru bir savaş nedenimiz var.'};
    }

    return {ok:true, cozuldu:true, kuklaci: fail ? fail.id : null,
      msg: fail ? (fail.name + ' bu operasyonun arkasındaydı') : 'Dosya çözüldü'};
  }
  return {ok:true, cozuldu:false, msg:'Soruşturma sonuçsuz kaldı'};
}


/* ═══════════════════════════════════════════════════════════════════
   FAZ 35 — KRİZ YAKINLIĞI
   Bir devlet Sürü'yü ne kadar yakından hissediyor?
     0 = uzak, haberi bile yok
     1 = Sürü filosu sınır sistemine dayandı
     2 = kendi gezegeni yutuldu
   İnatçı AI'ların panik eşiği buna bağlı.
   ═══════════════════════════════════════════════════════════════════ */
function crisisProximity(e){
  if (!e || G.crisisId === undefined) return 0;
  if (!crisisActive || !crisisActive()) return 0;

  /* 2 — kendi gezegenim yutuldu mu? */
  if (e._devoured) return 2;

  /* 1 — Sürü filosu benim ya da komşumun sisteminde mi? */
  const benim = {};
  for (const c of (e.colonies || [])) benim[c.s] = 1;
  for (const sy of G.sys) if (sy.owner === e.id) benim[sy.id] = 1;

  for (const f of G.fleets){
    if (f.e !== G.crisisId || !f.ships || !f.ships.length) continue;
    const sid = f.sys >= 0 ? f.sys : (f.mv ? f.mv.to : -1);
    if (sid < 0) continue;
    if (benim[sid]) return 1;
    const sy = G.sys[sid];
    if (!sy) continue;
    for (const l of sy.lanes) if (benim[l]) return 1;
  }
  return 0;
}

/* ═══════════════════════════════════════════════════════════════════
   FAZ 35 — ULTİMATOM
   "Ya pakta katılırsın ya da seni biz yok ederiz."
   Reddedilirse savaş nedeni doğar. Kabul edilirse hedef pakta
   evet oyu vermeye mecbur kalır.
   ═══════════════════════════════════════════════════════════════════ */
const ULTIMATUM_COST = 110;

function canUltimatum(e, target){
  if (!e || !target || target.dead) return {ok:false, why:'Hedef yok'};
  if (target.id === e.id) return {ok:false, why:'Kendine ultimatom veremezsin'};
  if (!crisisActive || !crisisActive())
    return {ok:false, why:'Yalnızca galaktik kriz sırasında'};
  if (target.wild || target.crisisSide)
    return {ok:false, why:'Sürü müzakere etmez'};
  if (!e.contact[target.id]) return {ok:false, why:'Temasın yok'};
  if (e.war[target.id]) return {ok:false, why:'Zaten savaştasınız'};
  if (target._ultimatum && target._ultimatum.by === e.id)
    return {ok:false, why:'Bu devlete zaten ultimatom verdin'};
  if ((e.res.etk || 0) < ULTIMATUM_COST)
    return {ok:false, why:ULTIMATUM_COST + ' etki gerekir'};
  /* Hedef zaten pakta evet demişse anlamsız */
  const c = G.council;
  if (c && c.laws && c.laws.savunmaPakti && c.members.includes(target.id))
    return {ok:false, why:'Zaten pakta bağlı'};
  return {ok:true};
}

function sendUltimatum(e, target){
  const chk = canUltimatum(e, target);
  if (!chk.ok) return chk;
  e.res.etk -= ULTIMATUM_COST;
  target._ultimatum = {by: e.id, at: G.memAge || 0};

  /* Boyun eğme kararı: güç farkı + kriz yakınlığı + mizaç */
  const gucFark = totalPower(e) / Math.max(1, totalPower(target));
  const tehlike = crisisProximity(target);
  const P = (typeof personaOf === 'function') ? personaOf(target) : null;
  let boyun = .18 + clamp((gucFark - 1) * .35, -.25, .55) + tehlike * .22;
  if (P){
    if (P.n === 'Pasifist') boyun += .25;
    else if (P.n === 'Militarist') boyun -= .28;
    else if (P.n === 'İzolasyonist') boyun -= .18;
  }
  /* Zaten dostsak daha kolay ikna olur */
  boyun += clamp((target.rel[e.id] || 0) / 220, -.25, .25);
  boyun = clamp(boyun, .05, .90);

  if (rnd() < boyun){
    /* ── KABUL ── */
    target._paktSoz = e.id;                 // oylamada evet demeye mecbur
    target.rel[e.id] = clamp((target.rel[e.id] || 0) - 18, -100, 100);
    if (typeof remember === 'function') remember(target, e.id, 'tehdit');
    return {ok:true, kabul:true,
      msg: target.name + ' boyun eğdi — Savunma Paktı\'na katılacak'};
  }

  /* ── RET: savaş nedeni ── */
  e._lastCB = {n:'Reddedilen Ultimatom', w:1.15};
  target.rel[e.id] = clamp((target.rel[e.id] || 0) - 35, -100, 100);
  if (typeof remember === 'function') remember(target, e.id, 'tehdit');
  /* Galaksi bunu hoş karşılamaz: kriz varken iç savaş çıkarmak */
  for (const x of G.emps){
    if (x.dead || x.wild || x.crisisSide || x.id === e.id || x.id === target.id) continue;
    x.rel[e.id] = clamp((x.rel[e.id] || 0) - 8, -100, 100);
  }
  return {ok:true, kabul:false,
    msg: target.name + ' ultimatomu REDDETTİ — savaş nedeni doğdu'};
}


/* ═══════════════════════════════════════════════════════════════════
   FAZ 37 — ÇOKLU PARYA
   ÖLÇÜM (Faz 36): c.targeted.parya TEK bir ID tutuyordu. Yeni parya
   ilan edilince eskisi sessizce serbest kalıyordu — 60 yılda 22
   parya döneminin 17'si "devir" ile bitmişti, af hiç dolmuyordu.
   Artık c.pariahs = {empId: {since}} sözlüğü. Her devletin af
   sayacı BAĞIMSIZ işler.
   Eski c.targeted.parya alanı geriye dönük uyumluluk için
   korunuyor (en son ilan edilen paryayı gösterir).
   ═══════════════════════════════════════════════════════════════════ */

/* Parya sözlüğünü hazırla + eski kayıtları taşı */
function pariahMap(){
  const c = G.council;
  if (!c) return null;
  if (!c.pariahs){
    c.pariahs = {};
    /* Eski tek-slot kaydı varsa taşı (kayıt uyumluluğu) */
    if (c.targeted && c.targeted.parya !== undefined)
      c.pariahs[c.targeted.parya] = {since: c.pariahSince !== undefined
        ? c.pariahSince : (G.memAge || 0)};
  }
  return c.pariahs;
}

function addPariah(id){
  const c = G.council;
  if (!c) return false;
  const map = pariahMap();
  if (map[id]) return false;                    // zaten parya
  map[id] = {since: G.memAge || 0};
  c.targeted = c.targeted || {};
  c.targeted.parya = id;                        // uyumluluk: son ilan
  return true;
}

function removePariah(id){
  const c = G.council;
  if (!c) return;
  const map = pariahMap();
  delete map[id];
  if (c.targeted && c.targeted.parya === id){
    const kalan = Object.keys(map);
    if (kalan.length) c.targeted.parya = +kalan[kalan.length - 1];
    else delete c.targeted.parya;
  }
}

function pariahList(){
  const map = pariahMap();
  if (!map) return [];
  return Object.keys(map).map(Number).filter(id => G.emps[id] && !G.emps[id].dead);
}

function pariahCount(){ return pariahList().length; }


/* ═══════════════════════════════════════════════════════════════════
   FAZ 37 — GÜÇ YOZLAŞMASI
   Koruyucu unvanı bir ödüldür ama militarist/otoriter bir devlette
   iştah açar. Kriz bittikten birkaç yıl sonra yetkiyi devretmeyi
   reddedip "Yeni Düzen" ilan edebilir: unvan kalıcı olur, ama
   galaksi ona sırtını döner.
   ═══════════════════════════════════════════════════════════════════ */
const GUARDIAN_TERM = 60;        // 5 yıl sonra devretme zamanı
const GUARDIAN_VETO_GAP = 180;   // 15 yılda bir veto hakkı

function guardianTick(){
  for (const e of G.emps){
    if (e.dead || e.wild || e.crisisSide || !e.guardian) continue;
    const g = e.guardian;
    const gecen = (G.memAge || 0) - g.since;

    /* Yeni Düzen ilan edilmişse artık karar verilmiş */
    if (g.newOrder) continue;

    if (gecen < GUARDIAN_TERM) continue;

    /* ── DEVRETME KARARI ── */
    const P = (typeof personaOf === 'function') ? personaOf(e) : null;
    const mz = P ? P.n : '';
    const otoriter = (e.ethics && (e.ethics.aut || 0) >= 1);
    const militarist = (mz === 'Militarist') || (e.ethics && (e.ethics.mil || 0) >= 1);

    if (!militarist && !otoriter){
      /* Onurlu devir */
      delete e.guardian;
      if (e.id === 0)
        say('Koruyucu yetkilerini konseye devrettin — galaksi minnettar', 'win');
      else
        say(e.name + ' Koruyucu yetkilerini konseye devretti');
      for (const x of G.emps){
        if (x.dead || x.wild || x.crisisSide || x.id === e.id) continue;
        x.rel[e.id] = clamp((x.rel[e.id] || 0) + 15, -100, 100);
      }
      G.emps.forEach(x => { if (!x.dead) recalcMods(x); });
      continue;
    }

    /* ── YENİ DÜZEN ──
       Yetki bırakılmıyor. Unvan kalıcı, bedeli ağır. */
    if (e.ai && rnd() > .55) continue;         // AI biraz tereddüt eder
    g.newOrder = true;
    g.declaredAt = G.memAge || 0;
    e.threat = (e.threat || 0) + 85;
    for (const x of G.emps){
      if (x.dead || x.wild || x.crisisSide || x.id === e.id) continue;
      x.rel[e.id] = clamp((x.rel[e.id] || 0) - 60, -100, 100);
      if (typeof remember === 'function') remember(x, e.id, 'ihanet');
    }
    if (e.id === 0)
      say('👑 YENİ DÜZEN İLAN ETTİN — Koruyucu yetkilerin kalıcı. ' +
          'Galaksi sana sırtını döndü.', 'war');
    else
      say('👑 ' + e.name + ' YENİ DÜZEN ilan etti — Koruyucu yetkilerini ' +
          'bırakmayı reddediyor!', 'war');
    G.emps.forEach(x => { if (!x.dead) recalcMods(x); });
  }
}

/* Koruyucu veto hakkı: 15 yılda bir yürürlükteki bir yasayı iptal */
function guardianCanVeto(e){
  if (!e || !e.guardian) return false;
  const son = e.guardian.vetoAt || 0;
  return (G.memAge || 0) - son >= GUARDIAN_VETO_GAP;
}

function guardianVeto(e, key){
  if (!guardianCanVeto(e)) return {ok:false, why:'Veto hakkın henüz dolmadı'};
  const c = G.council;
  if (!c || !c.laws || !c.laws[key]) return {ok:false, why:'Bu yasa yürürlükte değil'};
  delete c.laws[key];
  e.guardian.vetoAt = G.memAge || 0;
  G.emps.forEach(x => { if (!x.dead) recalcMods(x); });
  const R = RESOLUTIONS[key];
  say((e.id === 0 ? 'VETO ETTİN' : e.name + ' veto etti') + ' — ' +
      (R ? R.n : key) + ' yürürlükten kalktı', 'war');
  /* Veto galaksiyi rahatsız eder */
  for (const x of G.emps){
    if (x.dead || x.wild || x.crisisSide || x.id === e.id) continue;
    x.rel[e.id] = clamp((x.rel[e.id] || 0) - 10, -100, 100);
  }
  return {ok:true};
}


/* ═══════════════════════════════════════════════════════════════════
   FAZ 38 — İSYANCI İTTİFAKI (GÖLGELER SAVAŞI)
   Yozlaşmış bir Koruyucu "Yeni Düzen" ilan ettiğinde, ona düşman
   devletler gizlice birleşir. Önce gölgede kalıp casuslukla
   yıpratırlar; güçleri yettiği an açığa çıkıp Özgürlük Savaşı
   ilan ederler.
   G.rebelAlliance = {target, members:[], since, revealed}
   ═══════════════════════════════════════════════════════════════════ */

/* Yozlaşmış koruyucu var mı? */
function corruptGuardian(){
  for (const e of G.emps){
    if (e.dead || e.wild || e.crisisSide) continue;
    if (e.guardian && e.guardian.newOrder) return e;
  }
  return null;
}

function inRebelAlliance(e){
  const ra = G.rebelAlliance;
  return !!(ra && !ra.done && e && ra.members.indexOf(e.id) >= 0);
}

/* İttifakın toplam askerî gücü */
function rebelPower(){
  const ra = G.rebelAlliance;
  if (!ra || ra.done) return 0;
  let p = 0;
  for (const id of ra.members){
    const e = G.emps[id];
    if (e && !e.dead) p += totalPower(e);
  }
  return p;
}

function rebelTick(){
  const zalim = corruptGuardian();

  /* Koruyucu düştüyse ittifak dağılır */
  if (!zalim){
    if (G.rebelAlliance && !G.rebelAlliance.done){
      G.rebelAlliance.done = true;
      if (G.rebelAlliance.members.indexOf(0) >= 0)
        say('İsyancı İttifakı dağıldı — zalim artık yok', 'win');
    }
    return;
  }

  /* İttifakı kur */
  if (!G.rebelAlliance || G.rebelAlliance.target !== zalim.id || G.rebelAlliance.done){
    G.rebelAlliance = {target: zalim.id, members: [], since: G.memAge || 0,
                       revealed: false, done: false};
  }
  const ra = G.rebelAlliance;

  /* ── ÜYE TOPLAMA ──
     Koruyucudan nefret eden, vasalı olmayan, ondan bağımsız
     devletler gizlice katılır. */
  for (const e of G.emps){
    if (e.dead || e.wild || e.crisisSide || e.id === zalim.id) continue;
    if (ra.members.indexOf(e.id) >= 0) continue;
    /* Vasalı isyan edemez */
    if (typeof isVassal === 'function' && isVassal(e) && e.overlord === zalim.id) continue;
    /* Müttefiki de katılmaz */
    if (e.ally && e.ally[zalim.id]) continue;
    /* ═══ FAZ 39: KATILIM EŞİĞİ GEVŞETİLDİ ═══
       ÖLÇÜM: −35 eşiğiyle 60 yıllık koşuda ittifak 1-2 üyede
       kalıyordu; Yeni Düzen −60 ilişki cezası verse de zaman
       içinde ilişkiler onarılıyor. Zalim yalnız nefretle değil,
       KORKUYLA da düşman toplar: tehdidi büyükse tarafsızlar da
       katılır. */
    const rel = e.rel[zalim.id] || 0;
    const korku = (zalim.threat || 0) >= 60;
    const esik = korku ? -10 : -35;
    if (rel > esik) continue;
    /* Oyuncu kendi kararını verir — otomatik katılmaz */
    if (e.id === 0) continue;
    ra.members.push(e.id);
    if (G.p && !G.p.dead && e.id !== 0 && ra.members.length === 1)
      say('Gölgelerde bir şey kıpırdıyor — ' + zalim.name +
          ' karşıtı devletler fısıldaşıyor', 'sci');
  }

  if (!ra.members.length) return;

  /* ── TOPYEKÛN İSYAN ──
     İttifakın gücü zalimi aştığı an gölgeden çıkılır.
     ÖLÇÜM: eşik ×1.05 iken ittifak kurulur kurulmaz açığa
     çıkıyordu (6 devletin toplamı tek devleti zaten aşıyor).
     Gölgeler Savaşı hiç yaşanmıyordu. Artık iki şart var:
     ezici üstünlük (×1.8) VE en az 2 yıllık hazırlık. */
  if (!ra.revealed){
    const bizim = rebelPower();
    const onun = totalPower(zalim);
    const hazirlik = (G.memAge || 0) - (ra.since || 0);
    if (bizim > onun * 1.8 && hazirlik >= 24){
      ra.revealed = true;
      ra.revealedAt = G.memAge || 0;
      for (const id of ra.members){
        const e = G.emps[id];
        if (!e || e.dead || e.war[zalim.id]) continue;
        const cb = {n:'Özgürlük Savaşı', w:1.45};
        e._lastCB = cb;
        if (typeof warAuthorize === 'function'){
          warAuthorize(e, zalim, cb);
          declareWar(e, zalim);
          if (typeof warAuthClear === 'function') warAuthClear();
        }
        /* CB kaydı declareWar sonrası silinebiliyor — geri yaz */
        e.warCause = e.warCause || {};
        e.warCause[zalim.id] = 'Özgürlük Savaşı';
      }
      /* İsyancılar birbirleriyle barışır — ortak düşman */
      for (const a of ra.members){
        for (const b of ra.members){
          if (a >= b) continue;
          const ea = G.emps[a], eb = G.emps[b];
          if (!ea || !eb || ea.dead || eb.dead) continue;
          if (ea.war[b] && typeof makePeace === 'function') makePeace(ea, eb);
          ea.rel[b] = clamp((ea.rel[b] || 0) + 30, -100, 100);
          eb.rel[a] = clamp((eb.rel[a] || 0) + 30, -100, 100);
        }
      }
      say('⚔ ÖZGÜRLÜK SAVAŞI — ' + ra.members.length +
          ' devlet ' + zalim.name + ' zulmüne karşı ayaklandı!', 'war');
      if (typeof UI !== 'undefined' && UI.eventArt)
        UI.eventArt('infaz', 'ÖZGÜRLÜK SAVAŞI',
          zalim.name + ' Yeni Düzen\'ini yıkmak için ' + ra.members.length +
          ' devlet gölgelerden çıktı. Galaktik iç savaş başladı.');
    }
  }
}

/* İsyancıların casusluk avantajı — sabotageChance içinden okunur */
function rebelOpBonus(e, target){
  if (!inRebelAlliance(e)) return 0;
  const ra = G.rebelAlliance;
  if (!ra || target.id !== ra.target) return 0;
  return .30;                                   // +%30 başarı
}


/* ═══════════════════════════════════════════════════════════════════
   FAZ 39 — İMPARATORLUĞUN PARÇALANMASI (BALKANİZASYON)
   Özgürlük Savaşı topyekûn fetihle değil, BAŞKENTİN düşmesiyle
   biter. Zalim yıkıldığında elinde kalan gezegenlerin yarısı
   ayrılıp yepyeni bağımsız bir devlet kurar.
   ═══════════════════════════════════════════════════════════════════ */

const SUCCESSOR_NAMES = [
  'Özgür Dünyalar Birliği', 'Yeni Cumhuriyet', 'Ardıl Hanedan',
  'Bağımsız Kolonyal Lig', 'Küllerden Doğan Konfederasyon',
  'Hür Yıldızlar Meclisi', 'Devrik Rejim Kalıntıları',
  'Sınır Dünyaları İttifakı'
];

/* Başkent düştü mü? Her ay kontrol edilir. */
function rebelVictoryCheck(){
  const ra = G.rebelAlliance;
  if (!ra || ra.done) return;
  /* ═══ FAZ 39: GİZLİ İTTİFAK DA ZAFERİ GÖRÜR ═══
     ÖLÇÜM: tohum 99'da zalimin başkenti düştü ama balkanizasyon
     tetiklenmedi — çünkü kontrol yalnız `revealed` iken çalışıyordu.
     Zalim başka bir savaşta başkentini kaybettiyse Yeni Düzen yine
     çökmüş demektir; ittifak açılmasa bile zafer sayılır. */
  if (!ra.revealed){
    const z0 = G.emps[ra.target];
    const b0 = z0 && G.sys[z0.home];
    if (!z0 || z0.dead || !b0 || b0.owner === z0.id) return;
  }
  const zalim = G.emps[ra.target];
  if (!zalim || zalim.dead){ ra.done = true; return; }

  /* ═══ FAZ 39: İSYAN SÜRDÜRÜCÜ ═══
     ÖLÇÜM: 60 yıllık koşuda isyancılar zalimden 45 KAT güçlüydü
     ama "savaşan 0" çıktı — savaşlar yorgunlukla bitmiş ve kimse
     yeniden başlatmamıştı. Başkent hiç düşmedi, balkanizasyon
     tetiklenmedi. Özgürlük Savaşı bir davadır: zalim yıkılana
     kadar yeniden ilan edilir. */
  for (const id of (ra.revealed ? ra.members : [])){
    const e = G.emps[id];
    if (!e || e.dead || e.crisisSide) continue;
    if (e.war[zalim.id]) continue;
    /* Barış imzalamışsa 2 yıl bekle, sonra tekrar ayaklan */
    const barisAy = (e.peaceAt && e.peaceAt[zalim.id]) ? e.peaceAt[zalim.id] : -999;
    if (G.day - barisAy < 720) continue;
    const cb = {n:'Özgürlük Savaşı', w:1.45};
    e._lastCB = cb;
    if (typeof warAuthorize === 'function'){
      warAuthorize(e, zalim, cb);
      declareWar(e, zalim);
      if (typeof warAuthClear === 'function') warAuthClear();
    }
    e.warCause = e.warCause || {};
    e.warCause[zalim.id] = 'Özgürlük Savaşı';
  }

  const bas = G.sys[zalim.home];
  if (!bas) return;
  /* Başkent hâlâ onunsa savaş sürer */
  if (bas.owner === zalim.id) return;
  /* ═══ FAZ 39: ZAFER KOŞULU GENİŞLETİLDİ ═══
     ÖLÇÜM (tohum 99, 720 ay): başkent 47 ay SAHİPSİZ kaldı ve
     124 ay ittifak dışı birinin elindeydi — ama zafer bir kez bile
     tetiklenmedi. Eski koşul "başkenti bir ittifak üyesi almalı"
     diyordu; oysa zalimin başkentini KAYBETMESİ Yeni Düzen'in
     çökmesi için yeterlidir. Kim aldığı ikincildir. */
  const alan = bas.owner;
  if (alan === zalim.id) return;             // hâlâ onda

  /* ═══ ÖZGÜRLÜK SAVAŞI KAZANILDI ═══ */
  ra.done = true;
  ra.wonAt = G.memAge || 0;

  const eskiAd = zalim.name;
  delete zalim.guardian;                      // unvan anında düşer
  zalim.threat = Math.max(0, (zalim.threat || 0) - 60);

  /* Savaşlar biter */
  for (const id of ra.members){
    const e = G.emps[id];
    if (!e || e.dead) continue;
    if (e.war[zalim.id] && typeof makePeace === 'function') makePeace(e, zalim);
    e.rel[zalim.id] = clamp((e.rel[zalim.id] || 0) + 25, -100, 100);
  }
  if (G.p && !G.p.dead && G.p.war[zalim.id] && typeof makePeace === 'function')
    makePeace(G.p, zalim);

  const alanE = (alan >= 0) ? G.emps[alan] : null;
  const uyeAldi = alanE && (ra.members.indexOf(alan) >= 0 || alan === 0);
  say('⚔ ÖZGÜRLÜK SAVAŞI KAZANILDI — ' + eskiAd + ' başkenti düştü' +
      (uyeAldi ? ' (' + alanE.name + ' ele geçirdi)' : '') +
      ', Yeni Düzen yıkıldı!', 'win');

  const yeni = balkanize(zalim);
  if (typeof UI !== 'undefined' && UI.eventArt)
    UI.eventArt('veri', 'İMPARATORLUK PARÇALANDI',
      eskiAd + ' başkenti düştü ve Yeni Düzen çöktü.' +
      (yeni ? ' Kalan dünyaların yarısı ayrılarak ' + yeni.name +
              ' adıyla bağımsızlığını ilan etti.' : ''));
}

/* Kalan gezegenlerin yarısını yeni bir devlete devret */
function balkanize(zalim){
  const koloniler = (zalim.colonies || []).slice();
  if (koloniler.length < 2) return null;      // bölünecek kadar yok

  /* Ayrılacak yarı — başkent hariç, uzaktakiler önce */
  const bas = G.sys[zalim.home];
  koloniler.sort((a, b) => {
    const sa = G.sys[a.s], sb2 = G.sys[b.s];
    if (!bas || !sa || !sb2) return 0;
    return dist(sb2, bas) - dist(sa, bas);    // uzaktan yakına
  });
  const ayrilan = koloniler.slice(0, Math.floor(koloniler.length / 2));
  if (!ayrilan.length) return null;

  /* Yeni imparatorluk */
  const id = G.emps.length;
  const ad = SUCCESSOR_NAMES[Math.floor(rnd() * SUCCESSOR_NAMES.length)];
  const yeni = makeEmpire(id, zalim.race, ad, true, rnd, []);
  /* Devrik rejimin tersi bir kimlik: özgürlükçü */
  yeni.ethics = {mil: -1, aut: -2, mat: (zalim.ethics && zalim.ethics.mat) || 0};
  yeni.col = shiftColor(zalim.col);
  G.emps.push(yeni);

  /* Gezegen devri */
  for (const c of ayrilan){
    const sy = G.sys[c.s];
    const pl = sy && sy.planets[c.p];
    if (!pl || !pl.col) continue;
    pl.owner = yeni.id;
    yeni.colonies.push({s: c.s, p: c.p});
    /* Sistem sahipliği: o sistemde zalimin başka kolonisi yoksa devret */
    const kalanBaska = sy.planets.some(p2 =>
      p2.col && p2.owner === zalim.id);
    if (!kalanBaska) sy.owner = yeni.id;
    pl.col.stab = 45;
    pl.recent_conquest = 24;
  }
  zalim.colonies = zalim.colonies.filter(c =>
    !ayrilan.some(a => a.s === c.s && a.p === c.p));
  if (yeni.colonies.length) yeni.home = yeni.colonies[0].s;

  /* Diplomatik doğuş: herkesle temas, zalimle düşman */
  for (const x of G.emps){
    if (x.dead || x.id === yeni.id) continue;
    if (x.wild || x.crisisSide) continue;
    yeni.contact[x.id] = true; x.contact[yeni.id] = true;
    yeni.rel[x.id] = 0; x.rel[yeni.id] = 0;
  }
  yeni.rel[zalim.id] = -75;
  zalim.rel[yeni.id] = -75;
  /* FAZ 40: kalıcı yeniden birleşme davası — iki taraf da
     diğerini kendi toprağı sayar. Uysal bir ardıl devlet yerine
     ebedi rakip. */
  yeni.sundered = zalim.id;
  zalim.sundered = yeni.id;
  if (typeof remember === 'function'){
    remember(yeni, zalim.id, 'sistemAldi');
    remember(zalim, yeni.id, 'sistemAldi');
  }
  /* İsyancılar yeni devleti sever */
  const ra = G.rebelAlliance;
  if (ra) for (const id2 of ra.members){
    const e = G.emps[id2];
    if (!e || e.dead) continue;
    e.rel[yeni.id] = 30; yeni.rel[e.id] = 30;
  }

  recalcMods(yeni); recalcMods(zalim);
  if (typeof refreshReach === 'function') refreshReach();
  say('🏴 ' + ad + ' bağımsızlığını ilan etti — ' + ayrilan.length +
      ' dünya ' + zalim.name + ' egemenliğinden ayrıldı', 'win');
  return yeni;
}

/* Yeni devlete ayırt edilebilir bir renk üret */
function shiftColor(hex){
  if (!hex || hex[0] !== '#') return '#8fa8c8';
  const r = parseInt(hex.substr(1,2),16), g2 = parseInt(hex.substr(3,2),16),
        b = parseInt(hex.substr(5,2),16);
  const mix = v => Math.max(40, Math.min(235, Math.round(v * .55 + 110)));
  const h = v => v.toString(16).padStart(2,'0');
  return '#' + h(mix(b)) + h(mix(r)) + h(mix(g2));   // kanalları kaydır
}


/* ═══════════════════════════════════════════════════════════════════
   FAZ 39 — OYUNCUNUN İSYANA KATILIMI
   Oyuncu otomatik katılmaz (kendi kararı). Katıldığında gücü
   ittifak toplamına eklenir ve isyan eşiğini doğrudan etkiler.
   ═══════════════════════════════════════════════════════════════════ */
function canJoinRebellion(e){
  const ra = G.rebelAlliance;
  if (!ra || ra.done) return {ok:false, why:'Ortada bir isyancı ittifakı yok'};
  const zalim = G.emps[ra.target];
  if (!zalim || zalim.dead) return {ok:false, why:'Hedef artık yok'};
  if (e.id === ra.target) return {ok:false, why:'Zalim sensin'};
  if (ra.members.indexOf(e.id) >= 0) return {ok:false, why:'Zaten üyesin'};
  if (e.ally && e.ally[zalim.id]) return {ok:false, why:'Zalimin müttefikisin'};
  if (typeof isVassal === 'function' && isVassal(e) && e.overlord === zalim.id)
    return {ok:false, why:'Zalimin vasalısın — önce bağımsızlığını kazan'};
  if ((e.rel[zalim.id] || 0) > -20)
    return {ok:false, why:'Ona yeterince düşman değilsin (ilişki −20 altı gerekir)'};
  return {ok:true};
}

function joinRebellion(e){
  const chk = canJoinRebellion(e);
  if (!chk.ok) return chk;
  const ra = G.rebelAlliance;
  ra.members.push(e.id);
  /* Diğer isyancılarla yakınlaşma */
  for (const id of ra.members){
    if (id === e.id) continue;
    const o = G.emps[id];
    if (!o || o.dead) continue;
    e.rel[id] = clamp((e.rel[id] || 0) + 25, -100, 100);
    o.rel[e.id] = clamp((o.rel[e.id] || 0) + 25, -100, 100);
  }
  /* İttifak zaten açıksa hemen savaşa gir */
  if (ra.revealed){
    const zalim = G.emps[ra.target];
    if (zalim && !e.war[zalim.id]){
      e._lastCB = {n:'Özgürlük Savaşı', w:1.45};
      if (typeof warAuthorize === 'function'){
        warAuthorize(e, zalim, e._lastCB);
        declareWar(e, zalim);
        if (typeof warAuthClear === 'function') warAuthClear();
      }
      e.warCause = e.warCause || {};
      e.warCause[zalim.id] = 'Özgürlük Savaşı';
    }
  }
  return {ok:true, revealed: ra.revealed};
}

function leaveRebellion(e){
  const ra = G.rebelAlliance;
  if (!ra || ra.done) return {ok:false, why:'İttifak yok'};
  const i = ra.members.indexOf(e.id);
  if (i < 0) return {ok:false, why:'Üye değilsin'};
  if (ra.revealed) return {ok:false, why:'Savaş başladı — artık geri dönüş yok'};
  ra.members.splice(i, 1);
  /* Diğer isyancılar bunu hoş karşılamaz */
  for (const id of ra.members){
    const o = G.emps[id];
    if (o && !o.dead) o.rel[e.id] = clamp((o.rel[e.id] || 0) - 20, -100, 100);
  }
  return {ok:true};
}


/* ═══════════════════════════════════════════════════════════════════
   FAZ 42 — İSYANI KIŞKIRT
   Düşmanı içeriden bölme operasyonu. Hedefin en kırılgan SINIR
   kolonisinde istikrarı çökertir ve ayrılıkçı sayacı ateşler.
   Faz 41'de kurduğum secessionTick altyapısını kullanır.
   ═══════════════════════════════════════════════════════════════════ */
const INCITE_COST = 120;
const INCITE_STAB_HIT = 25;       // istikrar düşüşü
const INCITE_MONTHS = 12;         // etki süresi
const INCITE_SEED = 10;           // sayaca eklenen ay

/* Kışkırtılabilecek en zayıf sınır kolonisi. Arayüz de bunu okur. */
function incitablePlanet(e, target){
  if (!target || target.dead) return null;
  let en = null, enSkor = -1;
  for (const c of (target.colonies || [])){
    const sys = G.sys[c.s];
    const pl = sys && sys.planets[c.p];
    if (!pl || !pl.col) continue;
    /* Başkent kışkırtılamaz — merkez sadıktır */
    if (target.home === sys.id) continue;
    if (pl.martial_law > 0) continue;           // sıkıyönetim engelliyor
    /* SINIR mı? Komşusunda yabancı olmalı */
    let sinir = false;
    for (const l of sys.lanes){
      const o2 = G.sys[l];
      if (o2 && o2.owner >= 0 && o2.owner !== target.id){ sinir = true; break; }
    }
    if (!sinir) continue;
    /* En düşük istikrarlı olan en kırılgandır */
    const skor = 100 - (pl.col.stab || 0) + (pl.col.secede || 0) * 2;
    if (skor > enSkor){ enSkor = skor; en = {sys, pl}; }
  }
  return en;
}

function canIncite(e, target){
  if (!e || !target) return {ok:false, why:'Hedef yok'};
  if (target.id === e.id) return {ok:false, why:'Kendini kışkırtamazsın'};
  if (target.dead || target.wild || target.crisisSide)
    return {ok:false, why:'Bu devletle casusluk yapılamaz'};
  const lvl = (typeof intelOf === 'function') ? intelOf(e, target.id) : 0;
  if (lvl < 2) return {ok:false, why:'En az 2. seviye istihbarat gerekir'};
  if ((e.res.etk || 0) < INCITE_COST)
    return {ok:false, why:INCITE_COST + ' etki gerekir'};
  const hedef = incitablePlanet(e, target);
  if (!hedef) return {ok:false, why:'Kışkırtılabilecek sınır dünyası yok'};
  return {ok:true, hedef};
}

function inciteRebellion(e, target){
  const chk = canIncite(e, target);
  if (!chk.ok) return chk;
  e.res.etk -= INCITE_COST;

  const {sys, pl} = chk.hedef;
  const ch = (typeof sabotageChance === 'function')
    ? sabotageChance(e, target) : {basari:.4, ifsa:.3};
  /* Halk ayaklandırmak sabotajdan zor: yerel destek gerekir */
  const basari = clamp(ch.basari * .88, .05, .70);
  const ifsa   = clamp(ch.ifsa * 1.20, .06, .65);

  if (rnd() < basari){
    /* ── BAŞARI ── */
    const col = pl.col;
    col.unrest = {left: INCITE_MONTHS, hit: INCITE_STAB_HIT, by: e.id};
    col.stab = clamp(col.stab - INCITE_STAB_HIT, 0, 100);
    /* FAZ 43: tavan — üst üste kışkırtma sayacı şişirmesin
       (ölçümde 130/30 görüldü). */
    const tavan = (typeof SECESSION_LIMIT !== 'undefined') ? SECESSION_LIMIT + 4 : 34;
    col.secede = Math.min(tavan, (col.secede || 0) + INCITE_SEED);
    if (typeof recordSabotage === 'function') recordSabotage('kiskirt');
    /* ═══ FAZ 43: FAİLİ MEÇHUL KAYIT ═══
       Kurban bir şeylerin döndüğünü sezer ama faili bilmez.
       Derin Soruşturma bu dosyayı açabilir.
       (Faz 42'de bu kayıt kurgulanmıştı ama koda düşmemiş —
        testte hitLog 0 çıkınca yakalandı.) */
    target.hitLog = target.hitLog || [];
    target.hitLog.push({t: G.memAge || 0, k: 'kiskirt', by: e.id,
                        sys: sys.id, pi: pl.i,
                        caught: false, known: false});
    const ad = col.name || pl.name;
    if (e.id === 0)
      say('🔥 İSYAN KIŞKIRTILDI — ' + ad + ' halkı ayaklandı · istikrar −' +
          INCITE_STAB_HIT + ', ayrılıkçı sayaç ' + col.secede, 'sci');
    else if (target.id === 0)
      say('🔥 AYAKLANMA — ' + ad + ' halkı sokağa döküldü. Dış bir el var.', 'war');
    /* FAZ 42: alan adı `koloni` — arayüz ve testler bunu okuyor
       (kısa `ad` adı çağıran tarafta karışıklık yaratıyordu). */
    return {ok:true, caught:false, koloni: ad, basarili: true,
      msg: ad + ' halkı ayaklandı — istikrar çöktü, ayrılıkçı sayaç ' + col.secede};
  }

  if (rnd() < ifsa){
    /* ── İFŞA ── */
    if (typeof remember === 'function') remember(target, e.id, 'sabotaj');
    target.rel[e.id] = clamp(target.rel[e.id] - 45, -100, 100);
    target._lastCB = {n:'İç İşlerine Müdahale', w:1.30};
    /* Konsey bunu ağır bulur */
    e.threat = (e.threat || 0) + 15;
    for (const x of G.emps){
      if (x.dead || x.wild || x.crisisSide || x.id === e.id || x.id === target.id) continue;
      x.rel[e.id] = clamp((x.rel[e.id] || 0) - 15, -100, 100);
    }
    if (typeof recordSabotage === 'function') recordSabotage('ifsa');
    return {ok:true, caught:true,
      msg: 'Ajan infaz edildi — ' + target.name +
           ' iç işlerine müdahaleyi ifşa etti. Konseyde itibarın sarsıldı.'};
  }

  if (typeof recordSabotage === 'function') recordSabotage('sessiz');
  return {ok:true, caught:false, msg:'Halk kıpırdamadı — kışkırtma tutmadı'};
}


/* ═══════════════════════════════════════════════════════════════════
   FAZ 44 — HİMAYE TEKLİFİ (KUKLA DEVLET VASALLIĞI)
   Kışkırtmayla doğan ve minnet bağı olan devlete hami doğrudan
   vasallık teklif edebilir. +80 ilişki ve 'yardimEtti' anısı
   sayesinde kabul olasılığı yüksek — ama garanti değil:
   agresif doğan ayrılıkçılar bağımsızlığa da düşkün.
   ═══════════════════════════════════════════════════════════════════ */
const PATRONAGE_COST = 150;

function canOfferPatronage(e, target){
  if (!e || !target || target.dead) return {ok:false, why:'Hedef yok'};
  if (target.id === e.id) return {ok:false, why:'Kendine teklif edemezsin'};
  if (target.wild || target.crisisSide) return {ok:false, why:'Bu taraf müzakere etmez'};
  if (target.founder !== e.id)
    return {ok:false, why:'Bu devlet senin desteğinle doğmadı'};
  if (typeof isVassal === 'function' && isVassal(target))
    return {ok:false, why:'Zaten bir senyöre bağlı'};
  if (e.war[target.id]) return {ok:false, why:'Onunla savaştasın'};
  if ((e.res.etk || 0) < PATRONAGE_COST)
    return {ok:false, why:PATRONAGE_COST + ' etki gerekir'};
  if (target._patronageCd && target._patronageCd > (G.memAge || 0))
    return {ok:false, why:'Yakın zamanda reddettiler — biraz bekle'};
  return {ok:true};
}

/* Kabul olasılığı — arayüz de bunu gösterir */
function patronageChance(e, target){
  let p = .30;
  p += clamp((target.rel[e.id] || 0) / 160, -.4, .55);      // minnet ağır basar
  /* Güç farkı: zayıf devlet korunmaya muhtaç */
  const oran = totalPower(e) / Math.max(1, totalPower(target));
  p += clamp((oran - 1) * .12, -.15, .30);
  /* Tehdit altındaysa himaye cazip */
  let dusman = 0;
  for (const o of G.emps){
    if (o.dead || o.wild || o.crisisSide || o.id === target.id) continue;
    if (target.war[o.id]) dusman++;
  }
  p += Math.min(.25, dusman * .12);
  /* Ayrılıkçı gururu: yeni kazanılan bağımsızlık kolay bırakılmaz */
  const yas = (G.memAge || 0) - (target._bornAt || 0);
  if (yas < 36) p -= .20;
  const P = (typeof personaOf === 'function') ? personaOf(target) : null;
  if (P){
    if (P.n === 'İzolasyonist') p -= .25;
    else if (P.n === 'Militarist') p -= .15;
    else if (P.n === 'Tüccar') p += .10;
  }
  return clamp(p, .05, .92);
}

function offerPatronage(e, target){
  const chk = canOfferPatronage(e, target);
  if (!chk.ok) return chk;
  e.res.etk -= PATRONAGE_COST;
  const sans = patronageChance(e, target);

  if (rnd() < sans){
    if (typeof subjugate === 'function') subjugate(e, target, 'haracguzar');
    else { target.overlord = e.id; target.vassalType = 'haracguzar'; }
    target.rel[e.id] = clamp((target.rel[e.id] || 0) + 10, -100, 100);
    if (typeof remember === 'function') remember(target, e.id, 'yardimEtti');
    if (e.id === 0)
      say('🤝 HİMAYE KABUL EDİLDİ — ' + target.name + ' vasalın oldu', 'win');
    return {ok:true, kabul:true,
      msg: target.name + ' himayeni kabul etti ve vasalın oldu'};
  }

  /* Ret: gurur kırılmaz ama ilişki hafif sarsılır */
  target._patronageCd = (G.memAge || 0) + 36;
  target.rel[e.id] = clamp((target.rel[e.id] || 0) - 8, -100, 100);
  return {ok:true, kabul:false,
    msg: target.name + ' bağımsızlığını korumayı seçti — teklifin reddedildi'};
}


/* ═══════════════════════════════════════════════════════════════════
   FAZ 48 — STATÜKO BARIŞI (UTI POSSIDETIS)
   "Elinde ne varsa senindir." Yorgunluk tavana vurduğunda ya da
   savaş çok uzadığında taraflar fiili durumu tanıyıp sınırları
   dondurur. İşgal edilmiş sistemler işgalcinin toprağı olur.
   ═══════════════════════════════════════════════════════════════════ */
const STATUS_QUO_EXH = 85;        // bu yorgunluktan sonra masaya gelinir
const STATUS_QUO_MONTHS = 96;     // ya da 8 yıl sürmüşse

function canStatusQuo(a, b){
  if (!a || !b || a.dead || b.dead) return {ok:false, why:'Taraf yok'};
  if (!a.war[b.id]) return {ok:false, why:'Savaşta değilsiniz'};
  const exhA = (a.exh && a.exh[b.id]) || 0;
  const exhB = (b.exh && b.exh[a.id]) || 0;
  const bas = (a.warSince && a.warSince[b.id]) !== undefined
    ? a.warSince[b.id] : null;
  const ay = bas !== null ? Math.floor((G.day - bas) / 30) : 0;
  if (exhA < STATUS_QUO_EXH && exhB < STATUS_QUO_EXH && ay < STATUS_QUO_MONTHS)
    return {ok:false, why:'Henüz iki taraf da yeterince yorulmadı (' +
      Math.round(Math.max(exhA, exhB)) + '/' + STATUS_QUO_EXH + ')'};
  return {ok:true, exhA, exhB, ay};
}

/* Fiili işgal haritası: her sistemin GERÇEK sahibi kim?
   Bir sistem, orada koloni sahibi olan devletindir; koloni yoksa
   yörüngeyi tutan devletindir. */
function occupationMap(a, b){
  const sonuc = [];
  for (const sy of G.sys){
    /* Yalnız iki tarafın da ilgilendiği sistemler */
    let kolA = false, kolB = false;
    for (const pl of sy.planets){
      if (!pl.col) continue;
      if (pl.owner === a.id) kolA = true;
      if (pl.owner === b.id) kolB = true;
    }
    if (!kolA && !kolB && sy.owner !== a.id && sy.owner !== b.id) continue;
    /* Gerçek hâkim: koloni sahibi öncelikli */
    let gercek = -1;
    if (kolA && !kolB) gercek = a.id;
    else if (kolB && !kolA) gercek = b.id;
    else if (kolA && kolB) gercek = sy.owner;      // karışık: mevcut kalır
    else gercek = sy.owner;
    /* ═══ FAZ 48 DÜZELTMESİ: FİİLİ YÖRÜNGE HAKİMİYETİ ═══
       ÖLÇÜM: kolonisiz bir sistemi filoyla tutan taraf statükoda
       hiç toprak kazanmıyordu — kod yalnız `sy.orbitHeld`
       damgasına bakıyordu, o da her savaşta düşmüyor. Artık
       yörüngedeki SİLAHLI FİLO doğrudan sayılıyor: kim orada
       duruyorsa fiili hâkim odur (uti possidetis'in özü). */
    if (!kolA && !kolB){
      let fA = 0, fB = 0;
      for (const f of G.fleets){
        if (!f.ships || !f.ships.length || f.sys !== sy.id) continue;
        if (typeof isArmed === 'function' && !isArmed(f)) continue;
        if (f.e === a.id) fA += fleetPower(f);
        else if (f.e === b.id) fB += fleetPower(f);
      }
      if (fA > fB && fA > 0) gercek = a.id;
      else if (fB > fA && fB > 0) gercek = b.id;
      else if (sy.orbitHeld !== undefined) gercek = sy.orbitHeld;
    }
    if (gercek >= 0 && gercek !== sy.owner) sonuc.push({sys:sy, yeni:gercek});
  }
  return sonuc;
}

function statusQuoPeace(a, b){
  const chk = canStatusQuo(a, b);
  if (!chk.ok) return chk;

  /* Sınırları fiili duruma göre dondur */
  const devir = occupationMap(a, b);
  let n = 0;
  for (const d of devir){
    if (d.yeni !== a.id && d.yeni !== b.id) continue;
    d.sys.owner = d.yeni;
    n++;
  }

  /* Barışı imzala — normal makePeace tüm bağları temizler */
  a.war[b.id] = false; b.war[a.id] = false;
  a.peaceAt = a.peaceAt || {}; b.peaceAt = b.peaceAt || {};
  a.peaceAt[b.id] = G.day; b.peaceAt[a.id] = G.day;
  if (a.exh) a.exh[b.id] = Math.max(0, (a.exh[b.id] || 0) - 40);
  if (b.exh) b.exh[a.id] = Math.max(0, (b.exh[a.id] || 0) - 40);
  /* Statüko onurlu bir sondur — kin azalır */
  a.rel[b.id] = clamp((a.rel[b.id] || 0) + 18, -100, 100);
  b.rel[a.id] = clamp((b.rel[a.id] || 0) + 18, -100, 100);
  if (typeof remember === 'function'){
    remember(a, b.id, 'barisImzaladi');
    remember(b, a.id, 'barisImzaladi');
  }
  if (typeof refreshReach === 'function') refreshReach();
  G.emps.forEach(x => { if (!x.dead) recalcMods(x); });

  const mesaj = 'STATÜKO BARIŞI — ' + a.name + ' ve ' + b.name +
    ' fiili sınırları tanıdı' + (n ? ' (' + n + ' sistem el değiştirdi)' : '');
  if (a.id === 0 || b.id === 0) say('🕊 ' + mesaj, 'win');
  else say(mesaj);
  return {ok:true, devredilen:n};
}


/* ═══════════════════════════════════════════════════════════════════
   FAZ 48 — İSTİHBARAT PAYLAŞIMI PAKTI
   ═══════════════════════════════════════════════════════════════════ */
const SHAREVIS_COST = 60;

function canShareVision(e, o){
  if (!e || !o || o.dead) return {ok:false, why:'Hedef yok'};
  if (o.id === e.id) return {ok:false, why:'Kendinle paylaşamazsın'};
  if (o.wild || o.crisisSide) return {ok:false, why:'Bu taraf müzakere etmez'};
  if (!e.contact[o.id]) return {ok:false, why:'Temasın yok'};
  if (e.war[o.id]) return {ok:false, why:'Savaştasınız'};
  if (e.shareVis && e.shareVis[o.id]) return {ok:false, why:'Zaten paylaşımdasınız'};
  if ((e.res.etk || 0) < SHAREVIS_COST)
    return {ok:false, why:SHAREVIS_COST + ' etki gerekir'};
  /* Güven şartı: kimse haritasını yabancıya açmaz */
  const t = (typeof trustOf === 'function') ? trustOf(o, e.id) : 0;
  const rel = o.rel[e.id] || 0;
  if (rel < 20 && t < 15)
    return {ok:false, why:'Yeterince güvenmiyorlar (ilişki ' + Math.round(rel) + ')'};
  return {ok:true};
}

function offerShareVision(e, o){
  const chk = canShareVision(e, o);
  if (!chk.ok) return chk;
  e.res.etk -= SHAREVIS_COST;
  /* Kabul: ilişki + güven + dürüstlük */
  let p = .35 + clamp((o.rel[e.id] || 0) / 120, -.3, .45);
  if (e.mods) p += (e.mods.trustCap || 0) / 100;      // DÜRÜST bonusu
  if (o.ally && o.ally[e.id]) p += .30;
  const P = (typeof personaOf === 'function') ? personaOf(o) : null;
  if (P && P.n === 'İzolasyonist') p -= .30;
  if (rnd() < clamp(p, .05, .95)){
    e.shareVis = e.shareVis || {}; o.shareVis = o.shareVis || {};
    e.shareVis[o.id] = true; o.shareVis[e.id] = true;
    if (typeof remember === 'function') remember(o, e.id, 'yardimEtti');
    return {ok:true, kabul:true, msg: o.name + ' istihbarat paylaşımını kabul etti'};
  }
  return {ok:true, kabul:false, msg: o.name + ' haritasını paylaşmayı reddetti'};
}

function endShareVision(e, o){
  if (e.shareVis) delete e.shareVis[o.id];
  if (o.shareVis) delete o.shareVis[e.id];
  o.rel[e.id] = clamp((o.rel[e.id] || 0) - 8, -100, 100);
  return {ok:true};
}

/* ═══════════════════════════════════════════════════════════════════
   FAZ 48 — FEDERASYON ÜYELİK OYLAMASI
   Kabul artık otomatik değil: mevcut üyeler oy verir.
   ═══════════════════════════════════════════════════════════════════ */
function fedMemberVote(fed, aday){
  const evet = [], hayir = [];
  for (const mid of fed.members){
    const m = G.emps[mid];
    if (!m || m.dead) continue;
    if (m.id === 0){ evet.push(m.id); continue; }   // oyuncu davet ettiyse evet
    let ist = .30;
    ist += clamp((m.rel[aday.id] || 0) / 110, -.5, .5);
    if (m.war[aday.id]) ist -= .9;
    if (m.ally && m.ally[aday.id]) ist += .35;
    /* Ortak düşman birleştirir */
    let ortak = 0;
    for (const o of G.emps){
      if (o.dead || o.wild) continue;
      if (m.war[o.id] && aday.war[o.id]) ortak++;
    }
    ist += Math.min(.35, ortak * .18);
    /* Güçlü aday hem cazip hem tehdit */
    const oran = totalPower(aday) / Math.max(1, totalPower(m));
    ist += clamp((oran - 1) * .10, -.20, .25);
    if (typeof isPariah === 'function' && isPariah(aday)) ist -= .8;
    (rnd() < clamp(ist, .05, .95) ? evet : hayir).push(m.id);
  }
  return {evet, hayir, gecti: evet.length > hayir.length};
}

function fedInvite(fed, aday){
  if (!fed || !aday || aday.dead) return {ok:false, why:'Hedef yok'};
  if (fed.members.includes(aday.id)) return {ok:false, why:'Zaten üye'};
  const v = fedMemberVote(fed, aday);
  if (v.gecti){
    fed.members.push(aday.id);
    for (const mid of fed.members){
      const m = G.emps[mid];
      if (!m || m.dead || m.id === aday.id) continue;
      m.rel[aday.id] = clamp((m.rel[aday.id] || 0) + 15, -100, 100);
      aday.rel[m.id] = clamp((aday.rel[m.id] || 0) + 15, -100, 100);
    }
    say('🏛 ' + aday.name + ' federasyona kabul edildi (' +
        v.evet.length + ' evet / ' + v.hayir.length + ' hayır)', 'win');
  } else {
    aday.rel[fed.members[0]] = clamp((aday.rel[fed.members[0]] || 0) - 10, -100, 100);
    say('🏛 ' + aday.name + ' federasyon üyeliğine kabul edilmedi (' +
        v.evet.length + ' evet / ' + v.hayir.length + ' hayır)', 'war');
  }
  return {ok:true, gecti:v.gecti, evet:v.evet.length, hayir:v.hayir.length};
}

/* ═══════════════════════════════════════════════════════════════════
   FAZ 48 — OYUNCU KONSEY TASARISI
   120 etki ile gündeme doğrudan yasa sokma. Reddedilirse prestij
   ve diplomatik ağırlık bedeli var.
   ═══════════════════════════════════════════════════════════════════ */
const BILL_COST = 120;

function canProposeBill(e){
  if (!councilExists()) return {ok:false, why:'Galaktik Konsey kurulmamış'};
  const c = G.council;
  if (!c.members.includes(e.id)) return {ok:false, why:'Konsey üyesi değilsin'};
  if (c.vote) return {ok:false, why:'Halihazırda bir oylama sürüyor'};
  if (c.campaign) return {ok:false, why:'Kampanya dönemi sürüyor'};
  if ((e.res.etk || 0) < BILL_COST)
    return {ok:false, why:BILL_COST + ' etki gerekir'};
  if (e._billCd && e._billCd > (G.memAge || 0))
    return {ok:false, why:'Yakında tasarı sundun — ' +
      (e._billCd - (G.memAge || 0)) + ' ay bekle'};
  return {ok:true};
}

function proposeBill(e, key, targetId){
  const chk = canProposeBill(e);
  if (!chk.ok) return chk;
  const R = RESOLUTIONS[key];
  if (!R) return {ok:false, why:'Bilinmeyen tasarı'};
  if (R.hedefli && (targetId === undefined || targetId === null))
    return {ok:false, why:'Bu tasarı bir hedef gerektirir'};

  e.res.etk -= BILL_COST;
  e._billCd = (G.memAge || 0) + 36;
  e._billPending = {key, target: targetId};

  const c = G.council;
  c.campaign = {key, sponsor: e.id, left: (typeof CAMPAIGN_MONTHS !== 'undefined'
    ? CAMPAIGN_MONTHS : 3), bribed:{}, blackmailed:[], agenda:null,
    target: targetId, byPlayer: e.id === 0};
  if (targetId !== undefined && targetId !== null) c.campaign.hedefId = targetId;
  say('📜 TASARI SUNULDU — ' + R.ico + ' ' + R.n +
      ' · ' + c.campaign.left + ' ay kampanya', 'sci');
  return {ok:true};
}

/* Tasarı reddedilirse sunan bedel öder — finishCouncilVote çağırır */
function billRejected(e, key){
  if (!e) return;
  e.prestige = Math.max(0, (e.prestige || 0) - 10);
  e._billFail = (e._billFail || 0) + 1;
  /* Diplomatik ağırlık cezası: 5 yıl sürer */
  e._billPenalty = (G.memAge || 0) + 60;
  for (const x of G.emps){
    if (x.dead || x.wild || x.crisisSide || x.id === e.id) continue;
    x.rel[e.id] = clamp((x.rel[e.id] || 0) - 5, -100, 100);
  }
  if (e.id === 0)
    say('📜 Tasarın reddedildi — konseydeki ağırlığın 5 yıl boyunca azaldı', 'war');
}


/* ═══════════════════════════════════════════════════════════════════
   FAZ 48 — PAYLAŞILAN GÖRÜŞ
   İstihbarat paylaşımı paktı olan devletin keşfettiği sistemler
   ve gördüğü alan alıcının haritasına kopyalanır. Tek geçiş,
   ayda bir çalışır.
   ═══════════════════════════════════════════════════════════════════ */
function shareVision(giver, taker){
  if (!giver || !taker || giver.dead || taker.dead) return 0;
  let yeni = 0;
  for (const sy of G.sys){
    if (!sy.seen) continue;
    /* Veren gördüyse alan da görür */
    if (sy.seen.indexOf(giver.id) >= 0 && sy.seen.indexOf(taker.id) < 0){
      sy.seen.push(taker.id);
      yeni++;
    }
    /* Anlık görüş alanı (fog) — varsa kopyala */
    if (sy.vis && sy.vis.indexOf(giver.id) >= 0 && sy.vis.indexOf(taker.id) < 0)
      sy.vis.push(taker.id);
  }
  return yeni;
}

function visionTick(){
  for (const e of G.emps){
    if (e.dead || e.wild || e.crisisSide || !e.visionFrom) continue;
    for (const gid in e.visionFrom){
      const g = G.emps[gid];
      if (!g || g.dead){ delete e.visionFrom[gid]; continue; }
      /* Savaş çıkarsa paylaşım biter — kimse düşmanına göz vermez */
      if (e.war[g.id]){ delete e.visionFrom[gid]; continue; }
      shareVision(g, e);
    }
  }
}


/* ═══════════════════════════════════════════════════════════════════
   FAZ 49 — PANOPTİKON KARŞI İSTİHBARATI
   Gözlendiğini fark eden devlet iki yolla karşılık verir:
     SENSÖR KÖRLEME  → 24 ay karanlık, ucuz, düşük risk
     AŞIRI YÜKLEME   → yapıya kalıcı hasar, pahalı, yüksek risk
   ═══════════════════════════════════════════════════════════════════ */
const BLIND_COST = 80;
const OVERLOAD_COST = 140;
const BLIND_MONTHS = 24;

function panopticonTargets(e){
  if (!e || !e.panoptSeen) return [];
  const out = [];
  for (const oid in e.panoptSeen){
    const o = G.emps[oid];
    if (!o || o.dead) continue;
    const kayit = e.panoptSeen[oid];
    const kilit = o.panoptLock && o.panoptLock[kayit.sys];
    if (!kilit) continue;                       // yapı yıkılmış
    out.push({emp:o, sys:kayit.sys, kilit});
  }
  return out;
}

function canCounterPanopt(e, o, tur){
  if (!e || !o || o.dead) return {ok:false, why:'Hedef yok'};
  const lvl = (typeof intelOf === 'function') ? intelOf(e, o.id) : 0;
  if (lvl < 2) return {ok:false, why:'2. seviye istihbarat gerekir'};
  const hedefler = panopticonTargets(e).filter(x => x.emp.id === o.id);
  if (!hedefler.length) return {ok:false, why:'Tespit edilmiş bir Panoptikon yok'};
  const bedel = tur === 'overload' ? OVERLOAD_COST : BLIND_COST;
  if ((e.res.etk || 0) < bedel) return {ok:false, why:bedel + ' etki gerekir'};
  return {ok:true, hedef: hedefler[0]};
}

function counterPanopticon(e, o, tur){
  const chk = canCounterPanopt(e, o, tur);
  if (!chk.ok) return chk;
  const bedel = tur === 'overload' ? OVERLOAD_COST : BLIND_COST;
  e.res.etk -= bedel;

  const ch = (typeof sabotageChance === 'function')
    ? sabotageChance(e, o) : {basari:.4, ifsa:.3};
  /* Aşırı yükleme daha zor ve daha riskli */
  const basari = tur === 'overload'
    ? clamp(ch.basari * .70, .05, .60) : clamp(ch.basari * .95, .08, .80);
  const ifsa = tur === 'overload'
    ? clamp(ch.ifsa * 1.35, .06, .60) : clamp(ch.ifsa * .85, .04, .45);

  const kilit = chk.hedef.kilit;
  if (rnd() < basari){
    if (tur === 'overload'){
      kilit.hp = Math.max(0, (kilit.hp || 100) - 60);
      if (kilit.hp <= 0){
        /* Yapı çöktü: kilit tamamen silinir */
        delete o.panoptLock[chk.hedef.sys];
        const sy = G.sys[chk.hedef.sys];
        if (sy && sy.built) delete sy.built.panopt;
        if (e.id === 0)
          say('💥 PANOPTİKON ÇÖKTÜ — ' + o.name + ' gözlem istasyonunu kaybetti', 'win');
        else if (o.id === 0)
          say('💥 PANOPTİKONUMUZ AŞIRI YÜKLENDİ VE ÇÖKTÜ', 'war');
      } else if (e.id === 0)
        say('⚡ İstasyon hasar aldı (kalan bütünlük %' + kilit.hp + ')', 'sci');
    } else {
      kilit.blindUntil = (G.memAge || 0) + BLIND_MONTHS;
      if (e.id === 0)
        say('🌑 SENSÖRLER KÖRLENDİ — ' + o.name + ' ' + BLIND_MONTHS +
            ' ay boyunca bizi göremeyecek', 'win');
      else if (o.id === 0)
        say('🌑 Panoptikon sensörlerimiz körlendi — ' + BLIND_MONTHS + ' ay karanlık', 'war');
    }
    if (typeof recordSabotage === 'function') recordSabotage('basari');
    return {ok:true, caught:false,
      msg: tur === 'overload' ? 'İstasyon aşırı yüklendi' : 'Sensörler körlendi'};
  }

  if (rnd() < ifsa){
    if (typeof remember === 'function') remember(o, e.id, 'sabotaj');
    o.rel[e.id] = clamp((o.rel[e.id] || 0) - 40, -100, 100);
    o._lastCB = {n:'Sensör Sabotajı', w:1.20};
    if (typeof recordSabotage === 'function') recordSabotage('ifsa');
    return {ok:true, caught:true,
      msg: 'AJANIMIZ YAKALANDI — ' + o.name + ' sabotajı ifşa etti'};
  }
  if (typeof recordSabotage === 'function') recordSabotage('sessiz');
  return {ok:true, caught:false, msg:'Operasyon sonuçsuz kaldı'};
}

/* ═══════════════════════════════════════════════════════════════════
   FAZ 49 — FEDERAL DONANMA
   Üyelerin alaşım gelirinden %5 ortak fona akar. Başkan bu fonla
   filo kapasitesi HARCAMADAN gemi basar; bakım da fondan çıkar.
   Liderlik el değiştirince donanma yeni başkana geçer.
   ═══════════════════════════════════════════════════════════════════ */
const FED_TITHE = .05;

function fedFundTick(){
  if (typeof G.feds === 'undefined' || !G.feds) return;
  for (const f of G.feds){
    if (!f || f.dead || !f.members || !f.members.length) continue;
    f.fund = f.fund || {ala:0, ene:0};

    /* ── ÖŞÜR ── */
    for (const id of f.members){
      const e = G.emps[id];
      if (!e || e.dead) continue;
      const ala = Math.max(0, ((e.inc && e.inc.ala) || 0) * FED_TITHE);
      const ene = Math.max(0, ((e.inc && e.inc.ene) || 0) * FED_TITHE);
      if (ala > 0 && (e.res.ala || 0) > ala){ e.res.ala -= ala; f.fund.ala += ala; }
      if (ene > 0 && (e.res.ene || 0) > ene){ e.res.ene -= ene; f.fund.ene += ene; }
    }

    /* ── FEDERAL FİLO KOMUTASI ──
       Başkan değiştiyse donanma yeni başkana geçer. */
    const baskan = G.emps[f.leader];
    if (baskan && !baskan.dead){
      for (const fl of G.fleets){
        if (!fl.federal || fl.fedId !== f.id) continue;
        if (fl.e !== f.leader){
          fl.e = f.leader;
          if (f.leader === 0)
            say('🏛 Federal donanma komutası sana geçti', 'sci');
        }
      }
    }

    /* ── BAKIM FONDAN ── */
    let bakim = 0;
    for (const fl of G.fleets){
      if (!fl.federal || fl.fedId !== f.id || !fl.ships) continue;
      for (const sh of fl.ships)
        bakim += (SHIPS[sh.c] && SHIPS[sh.c].up) || 0;
    }
    if (bakim > 0){
      /* ═══ FAZ 50: FON TÜKENME UYARISI ═══
         Rezerv 3 aylık bakımın altına düşünce başkana kırmızı
         uyarı. Sessizce filo dağıtmak yerine önceden haber ver. */
      const kalanAy = bakim > 0 ? Math.floor(f.fund.ene / bakim) : 99;
      if (kalanAy <= 3 && f.leader === 0 && f._uyariAt !== (G.memAge || 0)){
        f._uyariAt = G.memAge || 0;
        say('⚠ FEDERAL FON TÜKENİYOR — gemiler ' + Math.max(0, kalanAy) +
            ' ay içinde dağıtılacak! Acil hibe gönder.', 'war');
      }
      f.fund.ene -= bakim;
      if (f.fund.ene < 0){
        /* Fon tükendi: en zayıf federal filo dağıtılır */
        f.fund.ene = 0;
        let en = null;
        for (const fl of G.fleets){
          if (!fl.federal || fl.fedId !== f.id || !fl.ships.length) continue;
          if (!en || fl.ships.length < en.ships.length) en = fl;
        }
        if (en){
          en.ships.length = 0;
          if (f.leader === 0) say('⚠ Federal fon tükendi — bir donanma dağıtıldı', 'war');
        }
        G.fleets = G.fleets.filter(x => x.ships && x.ships.length);
      }
    }
  }
}

function canBuildFederal(e, cls){
  const f = (typeof findFed === 'function') ? findFed(e) : null;
  if (!f) return {ok:false, why:'Bir federasyona üye değilsin'};
  if (f.leader !== e.id) return {ok:false, why:'Yalnız federasyon başkanı basabilir'};
  const S = SHIPS[cls];
  if (!S) return {ok:false, why:'Bilinmeyen gemi'};
  f.fund = f.fund || {ala:0, ene:0};
  const bedel = (S.cost && S.cost.ala) ? S.cost.ala * 1.15 : 100;
  if (f.fund.ala < bedel)
    return {ok:false, why:'Federal fon yetersiz (' + Math.round(f.fund.ala) +
      '/' + Math.round(bedel) + ' alaşım)'};
  return {ok:true, fed:f, bedel};
}

function buildFederalShip(e, sysId, cls){
  const chk = canBuildFederal(e, cls);
  if (!chk.ok) return chk;
  const sy = G.sys[sysId];
  if (!sy) return {ok:false, why:'Sistem yok'};
  chk.fed.fund.ala -= chk.bedel;
  const fl = newFleet(e, sysId, [{c:cls}], 'Federal Donanma');
  fl.federal = true;
  fl.fedId = chk.fed.id;
  if (e.id === 0)
    say('🏛 Federal donanmaya ' + SHIPS[cls].n + ' katıldı (kapasite harcanmadı)', 'sci');
  return {ok:true};
}


/* ═══════════════════════════════════════════════════════════════════
   FAZ 50 — ACİL HİBE
   Başkan şahsi kasasından federal fona tek tıkla aktarım yapar.
   ═══════════════════════════════════════════════════════════════════ */
const GRANT_ALA = 500, GRANT_ENE = 1000;

function canGrantFed(e){
  const f = (typeof findFed === 'function') ? findFed(e) : null;
  if (!f) return {ok:false, why:'Bir federasyona üye değilsin'};
  if (f.leader !== e.id) return {ok:false, why:'Yalnız başkan hibe gönderebilir'};
  if ((e.res.ala || 0) < GRANT_ALA || (e.res.ene || 0) < GRANT_ENE)
    return {ok:false, why:GRANT_ALA + ' alaşım ve ' + GRANT_ENE + ' enerji gerekir'};
  return {ok:true, fed:f};
}

function grantFed(e){
  const chk = canGrantFed(e);
  if (!chk.ok) return chk;
  const f = chk.fed;
  f.fund = f.fund || {ala:0, ene:0};
  e.res.ala -= GRANT_ALA; e.res.ene -= GRANT_ENE;
  f.fund.ala += GRANT_ALA; f.fund.ene += GRANT_ENE;
  if (e.id === 0)
    say('🏛 ACİL HİBE — federal fona ' + GRANT_ALA + ' alaşım, ' +
        GRANT_ENE + ' enerji aktarıldı', 'win');
  return {ok:true};
}

/* Fon durumu — arayüz okur */
function fedFundStatus(f){
  if (!f) return null;
  f.fund = f.fund || {ala:0, ene:0};
  let bakim = 0;
  for (const fl of G.fleets){
    if (!fl.federal || fl.fedId !== f.id || !fl.ships) continue;
    for (const sh of fl.ships) bakim += (SHIPS[sh.c] && SHIPS[sh.c].up) || 0;
  }
  const kalanAy = bakim > 0 ? Math.floor(f.fund.ene / bakim) : 99;
  return {bakim, kalanAy, kritik: bakim > 0 && kalanAy <= 3,
          ala: f.fund.ala, ene: f.fund.ene};
}


/* ═══════════════════════════════════════════════════════════════════
   FAZ 51 — DAİMİ KONSEY HÜKÜMDARLIĞI
   Başkan 200 etki harcayarak seçimleri kaldırma tasarısı sunar.
   Geçerse taht kalıcı olur ve Diplomatik Hegemonya zaferinin
   ön şartı tamamlanır. Reddedilirse ağır bedel: galaksi bir
   diktatör adayını unutmaz.
   ═══════════════════════════════════════════════════════════════════ */
const PRESIDENT_TERM = 180;        // 15 yıl
const PERMANENT_COST = 200;

function canClaimPermanent(e){
  if (typeof councilExists !== 'function' || !councilExists())
    return {ok:false, why:'Galaktik Konsey kurulmamış'};
  const c = G.council;
  if (c.permanent !== undefined && c.permanent !== null)
    return {ok:false, why:'Daimi hükümdarlık zaten ilan edilmiş'};
  if (c.president !== e.id)
    return {ok:false, why:'Yalnız dönem başkanı sunabilir'};
  if (c.vote || c.campaign)
    return {ok:false, why:'Halihazırda bir oylama sürüyor'};
  if ((e.res.etk || 0) < PERMANENT_COST)
    return {ok:false, why:PERMANENT_COST + ' etki gerekir'};
  /* En az bir tam dönem başkanlık yapmış olmalı */
  if (((c.terms && c.terms[e.id]) || 0) < 1)
    return {ok:false, why:'Önce bir tam dönem başkanlık yapmalısın'};
  return {ok:true};
}

function claimPermanent(e){
  const chk = canClaimPermanent(e);
  if (!chk.ok) return chk;
  const c = G.council;
  e.res.etk -= PERMANENT_COST;

  /* Oylama: her üye kendi çıkarına bakar */
  let evet = 0, hayir = 0;
  for (const m of c.members){
    const o = G.emps[m];
    if (!o || o.dead) continue;
    const w = voteWeight(o);
    if (m === e.id){ evet += w; continue; }
    let want = .12;                                    // taban: kimse taht istemez
    want += clamp((o.rel[e.id] || 0) / 190, -.35, .40);
    if (typeof isVassal === 'function' && isVassal(o) && o.overlord === e.id) want += .55;
    if (o.ally && o.ally[e.id]) want += .25;
    if (o.war[e.id]) want -= .45;
    const P = (typeof personaOf === 'function') ? personaOf(o) : null;
    if (P){
      if (P.n === 'İzolasyonist') want -= .20;
      else if (P.n === 'Pasifist') want -= .15;
    }
    /* Otoriter devletler tahta daha sıcak bakar */
    if ((o.ethics && (o.ethics.aut || 0)) > 0) want += .18;
    else if ((o.ethics && (o.ethics.aut || 0)) < 0) want -= .22;
    if (rnd() < clamp(want, .03, .92)) evet += w; else hayir += w;
  }

  if (evet > hayir){
    c.permanent = e.id;
    c.president = e.id;
    c.termAge = 0;
    for (const x of G.emps){
      if (x.dead || x.wild || x.crisisSide || x.id === e.id) continue;
      x.rel[e.id] = clamp((x.rel[e.id] || 0) - 12, -100, 100);
    }
    if (e.id === 0)
      say('👑 DAİMİ KONSEY HÜKÜMDARLIĞI İLAN EDİLDİ — seçimler kaldırıldı', 'win');
    else
      say('👑 ' + e.name + ' Daimi Konsey Hükümdarı oldu', 'war');
    if (typeof checkVictory === 'function') checkVictory(e, 'hegemonya');
    return {ok:true, gecti:true, evet, hayir};
  }

  /* RET: diktatör adayı damgası */
  e.threat = (e.threat || 0) + 30;
  e._billPenalty = (G.memAge || 0) + 60;
  for (const x of G.emps){
    if (x.dead || x.wild || x.crisisSide || x.id === e.id) continue;
    x.rel[e.id] = clamp((x.rel[e.id] || 0) - 22, -100, 100);
  }
  if (e.id === 0)
    say('Daimi hükümdarlık tasarın REDDEDİLDİ — galaksi seni diktatör adayı olarak gördü', 'war');
  return {ok:true, gecti:false, evet, hayir};
}


/* ═══════════════════════════════════════════════════════════════════
   FAZ 59 — AGRESİF SABOTAJLAR
   İki yeni operasyon. İkisi de 2. seviye ağ ister ve hedef SİSTEM
   seçimi gerektirir — imparatorluk geneline değil, tek bir noktaya
   vururlar. Bu yüzden cerrahi: savaş açmadan cepheyi zayıflatırsın.
   ═══════════════════════════════════════════════════════════════════ */
const SABO_YARD_COST  = 110;   // tersane sabotajı
const SABO_SUPPLY_COST = 130;  // lojistik hack (daha pahalı: daha yıkıcı)
const SABO_YARD_MONTHS = 12;
const SABO_SUPPLY_MONTHS = 6;

/* Hedef devletin sabote edilebilecek sistemleri */
function sabotageTargets(e, o, tur){
  if (!e || !o || o.dead) return [];
  const liste = [];
  for (const sy of G.sys){
    if (sy.owner !== o.id) continue;
    if (sy.seen.indexOf(e.id) < 0) continue;        // görmediğin yeri vuramazsın
    if (tur === 'yard'){
      const n = (typeof yardCount === 'function') ? yardCount(sy) : 0;
      if (!n) continue;
      if (sy.yardLock && sy.yardLock > (G.memAge || 0)) continue;
      liste.push({sy, bilgi: n + ' tersane'});
    } else {
      if (sy.supplyHack && sy.supplyHack > (G.memAge || 0)) continue;
      /* Filo varsa cazip */
      let filo = 0;
      for (const f of G.fleets)
        if (f.e === o.id && f.sys === sy.id && f.ships) filo += f.ships.length;
      liste.push({sy, bilgi: filo ? filo + ' gemi konuşlu' : 'boş sistem'});
    }
  }
  return liste;
}

function canSabotage(e, o, tur){
  if (!e || !o || o.dead) return {ok:false, why:'Hedef yok'};
  if (o.id === e.id) return {ok:false, why:'Kendini sabote edemezsin'};
  if (o.wild || o.crisisSide) return {ok:false, why:'Bu tarafın altyapısı yok'};
  const lvl = (typeof intelOf === 'function') ? intelOf(e, o.id) : 0;
  if (lvl < 2) return {ok:false, why:'En az 2. seviye istihbarat gerekir'};
  const bedel = tur === 'yard' ? SABO_YARD_COST : SABO_SUPPLY_COST;
  if ((e.res.etk || 0) < bedel) return {ok:false, why:bedel + ' etki gerekir'};
  const hedefler = sabotageTargets(e, o, tur);
  if (!hedefler.length)
    return {ok:false, why: tur === 'yard'
      ? 'Görebildiğin, sabote edilmemiş tersanesi yok'
      : 'Görebildiğin, hacklenmemiş sistemi yok'};
  return {ok:true, hedefler};
}

function doSabotage(e, o, tur, sysId){
  const chk = canSabotage(e, o, tur);
  if (!chk.ok) return chk;
  const sy = G.sys[sysId];
  if (!sy || sy.owner !== o.id) return {ok:false, why:'Sistem geçersiz'};

  const bedel = tur === 'yard' ? SABO_YARD_COST : SABO_SUPPLY_COST;
  e.res.etk -= bedel;

  const ch = (typeof sabotageChance === 'function')
    ? sabotageChance(e, o) : {basari:.4, ifsa:.3};
  /* Altyapı sabotajı casus sokmaktan zor: fiziksel erişim gerekir */
  const basari = clamp(ch.basari * (tur === 'yard' ? .90 : .80), .05, .78);
  const ifsa   = clamp(ch.ifsa   * (tur === 'yard' ? 1.10 : 1.25), .06, .70);

  if (rnd() < basari){
    if (tur === 'yard'){
      sy.yardLock = (G.memAge || 0) + SABO_YARD_MONTHS;
      /* Sıradaki üretim de iptal — tezgâh kapandı */
      if (sy.queue) sy.queue.length = 0;
      if (typeof recordSabotage === 'function') recordSabotage('yardSabo');
      if (e.id === 0 && typeof UI !== 'undefined')
        UI.eventArt('veri', 'TERSANE SABOTE EDİLDİ',
          sy.name + ' tersanesinde kontrol sistemleri çöktü. ' +
          SABO_YARD_MONTHS + ' ay boyunca tek bir gemi bile inşa edilemeyecek. ' +
          'Tezgâhtaki siparişler de iptal oldu.');
      else if (o.id === 0 && typeof UI !== 'undefined')
        UI.eventArt('infaz', 'TERSANEMİZ SABOTE EDİLDİ',
          sy.name + ' tersanesi ' + SABO_YARD_MONTHS +
          ' ay devre dışı. Failin kim olduğunu bilmiyoruz.');
    } else {
      sy.supplyHack = (G.memAge || 0) + SABO_SUPPLY_MONTHS;
      sy.supplyHackBy = e.id;
      if (typeof recordSabotage === 'function') recordSabotage('supplyHack');
      if (e.id === 0 && typeof UI !== 'undefined')
        UI.eventArt('veri', 'LOJİSTİK AĞI ÇÖKERTİLDİ',
          sy.name + ' sisteminin ikmal ağı ' + SABO_SUPPLY_MONTHS +
          ' ay boyunca karanlıkta. Oradaki filolar tedariksiz kalacak ' +
          've ciddi güç kaybı yaşayacak.');
      else if (o.id === 0 && typeof UI !== 'undefined')
        UI.eventArt('infaz', 'LOJİSTİK AĞIMIZ ÇÖKTÜ',
          sy.name + ' sisteminde ikmal hatları kesildi. Filolarımız ' +
          SABO_SUPPLY_MONTHS + ' ay boyunca tedariksiz savaşacak.');
    }
    /* Hedef bir şeyler döndüğünü sezer, faili bilmez */
    o.hitLog = o.hitLog || [];
    o.hitLog.push({t: G.memAge || 0, k: tur === 'yard' ? 'yardSabo' : 'supplyHack',
                   by: e.id, caught: false, known: false, sys: sy.id});
    return {ok:true, caught:false, sys:sy.name,
      msg: sy.name + ' vuruldu — ' + (tur === 'yard'
        ? 'tersane ' + SABO_YARD_MONTHS + ' ay kapalı'
        : 'lojistik ' + SABO_SUPPLY_MONTHS + ' ay çökük')};
  }

  if (rnd() < ifsa){
    if (typeof remember === 'function') remember(o, e.id, 'sabotaj');
    o.rel[e.id] = clamp((o.rel[e.id] || 0) - 45, -100, 100);
    o._lastCB = {n:'Altyapı Sabotajı', w:1.25};
    e.threat = (e.threat || 0) + 18;
    for (const x of G.emps){
      if (x.dead || x.wild || x.crisisSide || x.id === e.id || x.id === o.id) continue;
      x.rel[e.id] = clamp((x.rel[e.id] || 0) - 10, -100, 100);
    }
    if (typeof recordSabotage === 'function') recordSabotage('ifsa');
    if (e.id === 0 && typeof UI !== 'undefined')
      UI.eventArt('infaz', 'SABOTAJ EKİBİ YAKALANDI',
        o.name + ' ekibimizi ' + sy.name + ' yörüngesinde yakaladı. ' +
        'Kanıtlar galaksiye yayıldı; ellerinde meşru bir savaş nedeni var.');
    return {ok:true, caught:true,
      msg: 'Ekibimiz yakalandı — ' + o.name + ' savaş nedeni kazandı'};
  }

  if (typeof recordSabotage === 'function') recordSabotage('sessiz');
  return {ok:true, caught:false, msg:'Ekip hedefe sızamadı, sessizce çekildi'};
}

/* Aylık temizlik: süresi dolan kilitler kalkar */
function sabotageTick(){
  const simdi = G.memAge || 0;
  for (const sy of G.sys){
    if (sy.yardLock && sy.yardLock <= simdi){
      delete sy.yardLock;
      if (sy.owner === 0)
        say('⚓ ' + sy.name + ' tersanesi yeniden faal', 'win');
    }
    if (sy.supplyHack && sy.supplyHack <= simdi){
      delete sy.supplyHack; delete sy.supplyHackBy;
      if (sy.owner === 0)
        say('📦 ' + sy.name + ' lojistik ağı onarıldı', 'win');
    }
  }
}
