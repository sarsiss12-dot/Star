/* ═══════════════════════════════════════════════════════════════════
   YILDIZ HANEDANI — combat.js
   FAZ 74: muharebe çözümleyicisi.

   İÇERİK: battleRound — bir tur uzay çatışması. Menzil bantları,
   kalkan azaltması, duruş çarpanları, yörünge savunması
   (Faz 73 iki aşamalı kuşatma) ve pulsar kalkan sıfırlaması
   burada çözülür.

   BAĞIMLILIK: sideStats, SHIPS, G. main.js'ten SONRA yüklenir.
   ═══════════════════════════════════════════════════════════════════ */

function battleRound(sys, A, fa, B, fb, def, band){
  band = band || 1;
  const ea = G.emps[A], eb = G.emps[B];
  const sa = sideStats(ea, fa, eb, band);
  const sb = sideStats(eb, fb, ea, band);
  /* ═══════════════════════════════════════════════════════════
     FAZ 73 — İKİ AŞAMALI KUŞATMA
     AŞAMA 1 (YÖRÜNGE ÜSTÜNLÜĞÜ): gezegen savunmaları artık
     uzaydaki filolara DOĞRUDAN ateş edemez. Yalnız savunma
     istasyonları (uzay yapıları) savaşır. Önce onlar temizlenir.

     Eski davranışta gezegen bataryaları her mesafeden filoya
     hasar veriyordu; işgal "kıyma makinesi"ne dönüşüyordu.
     Artık gezegenin katkısı yalnız YÖRÜNGEDE HÂLÂ savunma yapısı
     varsa geçerli — ve o da azaltılmış oranda.
     ═══════════════════════════════════════════════════════════ */
  const orbitDef = (typeof orbitDefenseAlive === 'function')
    ? orbitDefenseAlive(sys, B) : def;
  if (orbitDef > 0){
    sb.dmg += orbitDef*.08; sb.hull += orbitDef*.5;
  }

  /* FAZ 73: PULSAR — iki tarafın da kalkanı çalışmaz.
     Yıldızın manyetik darbesi enerji perdelerini söndürür;
     yalnız zırh ve gövde konuşur. */
  if (sys && sys.pulsar){ sa.sh = 0; sb.sh = 0; }
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

