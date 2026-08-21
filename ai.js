/* ═══════════════════════════════════════════════════════════════════
   YILDIZ HANEDANI · ai.js — YAPAY ZEKÂ
   Karar ağacı ve HAFIZA mekanizması (kin/güven kayıtları).
   ═══════════════════════════════════════════════════════════════════ */

/* =====================================================================
   YAPAY ZEKÂ
   ===================================================================== */
/* ---------------------------------------------------------------
   Kişilik profili: ırk + etik + civic'ten türetilir.
   AI artık kendi ideolojisine göre farklı oynar.
   --------------------------------------------------------------- */
function aiProfile(e){
  if (e._prof) return e._prof;
  const r = RACES[e.race], et = e.ethics || {};
  /* Gizli mizaç profili doğrudan büker: kalıtım + ideoloji */
  const P = (typeof personaOf === 'function') ? personaOf(e) : null;
  const pw = P ? P.warBias : 0;
  const p = {
    war:  clamp(r.agr + pw + (et.mil||0)*.10 + (hasCivic(e,'blood')?.25:0) + (hasCivic(e,'warFury')?.15:0), 0, 1.4),
    exp:  clamp(r.exp + (et.aut||0)*.04, .2, 1.3),
    sci:  clamp((r.win==='bilim'?.9:.5) + (et.mat||0)*.08 + (hasCivic(e,'streak2')?.2:0), .2, 1.2),
    eco:  clamp((r.win==='ekonomi'?.9:.5) + (hasCivic(e,'trade')?.25:0), .2, 1.2),
    dip:  clamp(r.dip - pw*.5 - (et.mil||0)*.08 + (hasCivic(e,'allyCheap')?.25:0) - (hasCivic(e,'exile')?1:0), 0, 1.2),
    turtle: clamp((hasCivic(e,'fortress')?.6:.2) - (et.mil||0)*.05, 0, 1)
  };
  e._prof = p;
  return p;
}
/* Bir sistemin AI için tehdit skoru: yakındaki düşman filo gücü */
function threatAt(e, sysId){
  let t = 0;
  const s = G.sys[sysId];
  for (const f of G.fleets){
    if (f.e === e.id || !isArmed(f)) continue;
    if (!e.war[f.e]) continue;
    const fs = f.sys >= 0 ? f.sys : (f.mv ? f.mv.to : -1);
    if (fs < 0) continue;
    if (fs === sysId) t += fleetPower(f);
    else if (s.lanes.includes(fs)) t += fleetPower(f) * .5;
  }
  return t;
}
/* Filonun menzil dengesi — AI dengeli filo kursun diye */
function fleetRangeMix(e){
  const mix = {1:0, 2:0, 3:0};
  for (const f of G.fleets){
    if (f.e !== e.id) continue;
    for (const sh of f.ships){
      const rg = SHIPS[sh.c].rng;
      if (rg) mix[rg] = (mix[rg]||0) + 1;
    }
  }
  return mix;
}

/* ---------------------------------------------------------------
   VAHŞİ TARAF — korsan yuvaları ve uzay canavarları
   --------------------------------------------------------------- */
function wildTurn(e){
  // yuvalar düzenli olarak akıncı üretir
  for (const nid of (G.nests || [])){
    const sy = G.sys[nid];
    if (!sy || !sy.nest) continue;
    sy.nest.timer -= 30;
    if (sy.nest.timer > 0) continue;
    sy.nest.timer = 130 + Math.floor(rnd()*140);
    const here = G.fleets.filter(f => f.e === e.id && f.sys === nid);
    if (here.length > 3) continue;
    const tier = 1 + Math.floor(G.year - 2210) / 12;
    const ships = [{c:'kor'},{c:'kor'}];
    if (tier > 1.6) ships.push({c:'muh'});
    if (tier > 2.6) ships.push({c:'muh'}, {c:'kru'});
    newFleet(e, nid, ships, 'Korsan Akıncısı');
  }

  // seyrek olarak bir uzay canavarı doğar
  G.monsterAt = G.monsterAt || 0;
  if (G.year > 2215 && G.day - G.monsterAt > 1800 && rnd() < .05){
    const wildSys = G.sys.filter(sy => sy.owner < 0);
    if (wildSys.length){
      const sy = wildSys[Math.floor(rnd()*wildSys.length)];
      const f = newFleet(e, sy.id, [{c:'zir'},{c:'kru'},{c:'kru'}], 'Yırtıcı');
      f.monster = true;
      G.monsterAt = G.day;
      if (sy.seen.includes(0)) say('Uzayda devasa bir yırtıcı belirdi — ' + sy.name, 'war');
    }
  }

  // akıncılar en yakın zayıf koloniye saldırır, canavarlar rastgele dolaşır
  for (const f of G.fleets){
    if (f.e !== e.id || f.combat || f.path.length || f.mv || f.sys < 0) continue;
    if (f.name === 'Korsan Muhafızı') continue;          // yuvayı bekler
    const from = f.sys;
    if (f.monster){
      const opts = G.sys[from].lanes;
      if (opts.length) orderMove(f, opts[Math.floor(rnd()*opts.length)]);
      continue;
    }
    const targets = G.sys.filter(sy => sy.owner >= 0 && !G.emps[sy.owner].wild);
    if (!targets.length) continue;
    const myPow = fleetPower(f);
    targets.sort((a,b)=>{
      const da = dist(G.sys[from], a) + sysDefense(a)*1.4;
      const db = dist(G.sys[from], b) + sysDefense(b)*1.4;
      return da - db;
    });
    const tgt = targets.find(sy => sysDefense(sy) < myPow * .9) || targets[0];
    if (tgt) orderMove(f, tgt.id);
  }
}

/* Kriz filoları: en yakın kolonili sisteme acımasızca yürür */
function crisisFleetTurn(e){
  for (const f of G.fleets){
    if (f.e !== e.id || f.combat || f.path.length || f.mv || f.sys < 0) continue;
    const targets = G.sys.filter(sy => sy.owner >= 0 && !G.emps[sy.owner].wild &&
                                       sy.planets.some(p => p.col));
    if (!targets.length) continue;
    targets.sort((a,b)=> dist(G.sys[f.sys], a) - dist(G.sys[f.sys], b));
    // en yakın üç hedeften birini seç (öngörülemez olsun)
    const pick2 = targets[Math.floor(rnd() * Math.min(3, targets.length))];
    orderMove(f, pick2.id);
  }
}

function aiTurn(e){
  if (e.dead) return;
  if (e.crisisSide){ crisisFleetTurn(e); return; }
  if (e.wild){ wildTurn(e); return; }
  const race = RACES[e.race];
  const prof = aiProfile(e);
  const my = G.sys.filter(s => s.owner === e.id);
  /* HOTFIX 23.1: wild/crisis zaten yukarıda ayrılıyor ama bu satır
     ikinci bir ölüm kapısıydı — güvence olarak burada da korunuyor. */
  if (!my.length && !e.colonies.length){
    if (!e.wild && !e.crisisSide){
      e.dead = true;
      /* FAZ 30: Bu ölüm yolu purgeEmpire çağırmıyordu; ölen
         imparatorluğun filoları haritada öksüz kalıyordu.
         (Regresyon testi: "öksüz filo: 2") */
      if (typeof purgeEmpire === 'function') purgeEmpire(e);
    }
    return;
  }

  /* --- 0. koloni odakları --- */
  const atWarNow = Object.keys(e.war).some(k => e.war[k]);
  for (const c of e.colonies){
    const sys = G.sys[c.s], pl = sys.planets[c.p];
    if (!pl.col || (pl.col.fcd||0) > 0) continue;
    const border = sys.lanes.some(l => G.sys[l].owner >= 0 && G.sys[l].owner !== e.id);
    let want;
    if (e.home === sys.id) want = 'yonetim';
    else if ((atWarNow && border) || (prof.turtle > .5 && border && threatAt(e, sys.id) > 0)) want = 'garnizon';
    else if (e.crisis === 'yiyecek' || (e.inc.yiy < 3 && RACES[e.race].bio === 'organik')) want = 'tarim';
    else if (e.crisis === 'mineral') want = 'sanayi';
    else if (e.inc.ara < 18 + prof.sci*22) want = 'arastir';
    else want = 'sanayi';
    if (pl.col.f !== want) setFocus(e, sys, pl, want);
  }

  /* --- 1. yapılar --- */
  for (const c of e.colonies){
    const sys = G.sys[c.s], pl = sys.planets[c.p];
    if (!pl.col) continue;
    /* FAZ 14: Slot doluysa eskiden koloni tamamen ATLANIYORDU ve
       aşağıdaki yıkım mantığına HİÇ ulaşılmıyordu (ölçüm: 6 tohumda
       0 yıkım emri). Artık atlanmıyor; slot doluysa yıkım
       değerlendirmesi yapılıp inşa kısmı kendiliğinden boşa düşüyor. */
    const slotsNow = colonySlots(pl.col, e, pl);
    const doluNow = colonyUsed(pl.col) +
      ((typeof colonyQueued === 'function') ? colonyQueued(pl.col) : 0) >= slotsNow;
    const need = [];
    // kriz varsa her şeyin önüne geçer
    if (e.crisis === 'enerji') need.push('santral', 'santral');
    if (e.crisis === 'yiyecek') need.push('ciftlik', 'ciftlik');
    if (e.inc.yiy < 4 && RACES[e.race].bio === 'organik') need.push('ciftlik');
    if (e.inc.ene < 6) need.push('santral');
    if (e.inc.min < 10) need.push('maden');
    // alaşım darboğazı: mineral yığılıyorsa mutlaka dökümhane kur
    /* ALAŞIM REFORMU: mineral fazlası artık dökümhaneyle alaşıma
       çevrilebiliyor. AI mineral biriktirip alaşımsız kalmamalı. */
    if (e.inc.ala < 4) need.push('dokum');
    if (e.res.min > 1500 && e.inc.ala < 25) need.unshift('dokum', 'dokum');
    if (e.res.min > 6000 && e.inc.ala < 60) need.unshift('dokum', 'dokum', 'dokum');
    if (e.res.ala < 150 && e.inc.ala < 20) need.unshift('dokum');
    /* Mineral dağı büyüyorsa sanayi odağına geç */
    if (e.res.min > 9000 && e.inc.ala < 80) need.unshift('dokum');
    if (e.inc.tuk < 1 || e.shortage) need.unshift('fabrika');
    if ((pl.col.b.liman||0) < (prof.eco > .7 ? 2 : 1)) need.push('liman');
    // bilimci profiller laboratuvarı ciddiye alır, savaşçılar dökümhaneyi
    if (prof.sci > .7) need.push('lab', 'lab');
    else need.push(rnd() < .35 + prof.sci*.40 ? 'lab' : 'maden');
    if (prof.war > .8 && e.inc.ala < 12) need.push('dokum');
    if (!hasYard(sys) && e.colonies.length > 1 && rnd()<.35) need.unshift('tersane');
    if (atWarNow && threatAt(e, sys.id) > 0 && rnd() < .5 + prof.turtle*.4) need.unshift('kale');
    /* FAZ 13: kuyruk dolu değilse sipariş ver.
       Kontrol artık KUYRUKTAKİLERİ de sayıyor — aksi hâlde AI aynı
       binayı defalarca sıraya alıp kaynağını kilitliyordu. Ayrıca
       kuyruk 2'yi geçmesin: uzun sıra ekonomiyi dondurur. */
    const kuyruk = (typeof colonyQueued === 'function') ? colonyQueued(pl.col) : 0;

    /* ── FAZ 14: AI YIKIM KARARI ──
       Slot dolduğunda ve gerçekten ihtiyaç duyduğu bina engellendiğinde
       AI en işe yaramaz binayı söker. Kilitlenmeyi önlemek için:
       kuyrukta yıkım varsa yenisi verilmez ve her ay en fazla bir emir. */
    const jobs = (typeof colonyJobs === 'function') ? colonyJobs(pl.col) : kuyruk;
    const slotDolu = colonyUsed(pl.col) + kuyruk >= colonySlots(pl.col, e, pl);
    if (slotDolu && jobs === 0 && need.length && typeof queueDemolish === 'function'){
      /* İhtiyaç listesindeki hiçbir bina kurulamıyorsa yer açalım */
      /* Slot dolu olduğu için kurulamayan İLK ihtiyacı bul.
         Eskiden yalnızca need[0]'a bakılıyordu; o bina zaten max'ta
         olduğunda yıkım hiç tetiklenmiyordu. */
      let istenen = null;
      for (const k of need){
        if (!BUILDINGS[k]) continue;
        const kq = (typeof colonyQueuedOf === 'function') ? colonyQueuedOf(pl.col, k) : 0;
        if ((pl.col.b[k] || 0) + kq < BUILDINGS[k].max){ istenen = k; break; }
      }
      if (istenen){
        /* En düşük öncelikli mevcut binayı seç: ihtiyaç listesinde
           olmayan ve birden fazla kopyası bulunan */
        /* Yalnızca EN ÖNCELİKLİ ihtiyaç korunur. Eskiden `need`
           listesindeki her bina muaf tutuluyordu; ama AI'nın çok
           kopyası olan binalar zaten o listede olduğu için hiçbir
           aday kalmıyor ve yıkım hiç tetiklenmiyordu (ölçüm: 6
           tohumda 0 emir). */
        let hedef = null, enCok = 1;
        for (const k in pl.col.b){
          if (k === istenen) continue;                       // asıl istediğimiz
          if (k === 'santral' || k === 'ciftlik') continue;  // hayati altyapı
          if (pl.col.b[k] > enCok){ enCok = pl.col.b[k]; hedef = k; }
        }
        if (hedef && rnd() < .18) queueDemolish(e, sys, pl, hedef);
      }
    }

    if (kuyruk < 2){
      for (const k of need){
        const kuyruktaki = (typeof colonyQueuedOf === 'function')
          ? colonyQueuedOf(pl.col, k) : 0;
        if ((pl.col.b[k]||0) + kuyruktaki < BUILDINGS[k].max){
          if (queueBuilding(e, sys, pl, k)) break;
        }
      }
    }
  }

  /* --- 2. gemi inşası --- */
  const yards = my.filter(hasYard);
  if (yards.length){
    const yard = yards[Math.floor(rnd()*yards.length)];
    const usage = fleetUsage(e);
    const atWar = Object.keys(e.war).some(k => e.war[k]);
    // AI barışta da ciddi donanma tutar — ama ekonomisini boğmadan.
    const diffMul = (G.cfg && DIFFS[G.cfg.diff]) ? DIFFS[G.cfg.diff].aiAgr : 1;
    let milTarget = (atWar ? .82 : .52 + prof.war*.28) * diffMul;
    // enerji açığı varsa donanma büyütmeyi durdur
    if ((e.inc.ene || 0) < 0) milTarget = Math.min(milTarget, .28);
    else if ((e.inc.ene || 0) < 10) milTarget = Math.min(milTarget, .48);
    if (e.crisis) milTarget = Math.min(milTarget, .30);   // kriz varken donanma büyütme
    const sci = G.fleets.filter(f=>f.e===e.id && fleetHasRole(f,'bilim')).length;
    const col = G.fleets.filter(f=>f.e===e.id && fleetHasRole(f,'koloni')).length;
    const targets = colonizeTargets(e);

    // genişleme fırsatı varken erken oyunda önce yayıl
    if (targets.length && e.colonies.length < 5) milTarget = Math.min(milTarget, .50);
    const wantMil = e.cap * clamp(milTarget, .25, 1.05);

    // genişleme her zaman önce gelir: hedef varsa koloni gemisi kuyruğa girer
    const wantCol = Math.min(e.colonies.length < 6 ? 3 : 2, targets.length);
    /* Koşullar artık GERÇEK maliyete bakıyor. Eskiden 'min > 200' deniyordu
       ama koloni gemisi 265 mineral istiyor: AI sürekli deneyip başarısız
       oluyor ve zincirdeki diğer gemileri hiç sıraya alamıyordu. */
    /* Harika projesi ilan edilmişse alaşımın bir kısmı rezerve edilir;
       AI aksi hâlde tüm alaşımı gemiye harcayıp mega yapıyı hiç
       başlatamıyordu (ölçüm: 380k mineral, 697 alaşım). */
    /* FAZ 28: Colossus bütçesi de alaşım rezervine eklenir.
       Süper silah kuyruğa girdiğinde normal gemi üretimi onun
       payını harcayamaz. */
    /* ═══ FAZ 47: DONANMA UYKUSU ═══
       Kasa 500 alaşımın altındaysa ya da kapasite %90'ı aştıysa
       AI yeni gemi basmaz — ekonomiyi kendi eliyle boğmasın.
       (Faz 41'de terhis mantığını düzeltmiştim; bu onun önleyici
        tarafı: önce hiç aşıma girme.) */
    const kulAI = (typeof fleetUsage === 'function') ? fleetUsage(e) : 0;
    const kapAI = Math.max(1, Math.round(e.cap || 1));
    if ((e.res.ala || 0) < 500 || kulAI / kapAI >= .90){
      e._navySleep = true;
    } else e._navySleep = false;

    const rez = (e.megaReserve || 0) + (e.colossusReserve || 0);
    const canAfford = cls => {
      /* Colossus'un kendisi rezervden muaftır */
      const muaf = (cls === 'col_s');
      const c2 = shipCost(e, cls);
      return Object.keys(c2).every(r => {
        const stok = (e.res[r]||0) - ((r === 'ala' && !muaf) ? rez : 0);
        return stok >= c2[r];
      });
    };
    /* ═══ FAZ 22: TAARRUZ ORDUSU ÜRETİMİ ═══
       AI orduyu iki sebeple ister: savunma yastığı ve fetih aracı.
       Kaba bombardımanla gezegen almak enkaz bırakır ve itibar
       yakar; ordu ile temiz işgal daha kârlıdır. */
    const orduN = G.fleets.filter(f => f.e === e.id &&
      typeof isTransport === 'function' && isTransport(f)).length;
    let wantOrdu = 0;
    if (!SHIPS.ord.tech || e.techs[SHIPS.ord.tech]){
      /* FAZ 24: taban artırıldı — ordu artık temel askerî araç */
      /* Taban: her 4 koloni için 1 savunma ordusu */
      wantOrdu = Math.min(4, 1 + Math.floor(e.colonies.length / 3));
      if (atWar){
        /* Savaşta fetih için ek ordu — savaşçı profil daha çok ister */
        wantOrdu += 1 + Math.round(prof.war * 2);
        /* Düşman gezegeni yakınlarda mı? Varsa yatırım anlamlı */
        let hedefVar = false;
        for (const sy of G.sys){
          if (sy.owner < 0 || !e.war[sy.owner]) continue;
          if (sy.planets.some(p2 => p2.col)){ hedefVar = true; break; }
        }
        if (!hedefVar) wantOrdu = Math.min(wantOrdu, 1);
      }
      if ((e.inc.ene || 0) < 0) wantOrdu = Math.min(wantOrdu, 1);
      wantOrdu = Math.min(wantOrdu, 5);
    }

    if (col < wantCol && canAfford('kol') && yard.queue.length < 3) queueShip(e, yard, 'kol');
    else if (sci < 2 && canAfford('bil') && yard.queue.length < 2) queueShip(e, yard, 'bil');
    else if (orduN < wantOrdu && canAfford('ord') && yard.queue.length < 3)
      queueShip(e, yard, 'ord');
    /* ═══ FAZ 25: AI COLOSSUS ═══
       Çok nadir olmalı — galaksiyi düşman eden bir silah.
       Beş koşulun HEPSİ gerekir:
         1. teknoloji (m_yildiz)
         2. devasa stok (alaşım 3000+, mineral 4500+) — tavan yapmış
         3. güçlü ekonomi (alaşım geliri 120+)
         4. agresif karakter (militarist mizaç ya da savaşçı profil)
         5. gerçek bir baş düşman (kin 60+) ve zaten savaşta
       Ve hepsi sağlansa bile ayda %4 şans. Zaten bir tane varsa
       ikincisi yapılmaz. */
    else if (SHIPS.col_s && (!SHIPS.col_s.tech || e.techs[SHIPS.col_s.tech])){
      const varOlan = G.fleets.filter(f => f.e === e.id && f.ships.length &&
        typeof isColossus === 'function' && isColossus(f)).length;
      const kuyrukta = yard.queue.filter(q => q.cls === 'col_s').length;
      /* ═══ ÖZEL COLOSSUS BÜTÜNÇESİ ═══
         Şartları sağlayan AI, alaşım 1000'i geçince Colossus
         tamamlanana kadar biriktirmeye başlar: normal gemi üretimi
         o payı harcayamaz. */
      const P0 = (typeof personaOf === 'function') ? personaOf(e) : null;
      const agresif0 = (P0 && P0.n === 'Militarist') || prof.war > .72;
      if (!varOlan && agresif0 && (e.res.ala || 0) > 1000){
        e.colossusReserve = SHIPS.col_s.cost.ala;
      } else if (varOlan){
        e.colossusReserve = 0;
      }
      /* FAZ 32: yasak varsa AI hiç denemez */
      const yasakVar = (typeof councilExists === 'function' && councilExists() &&
        G.council.laws.colYasak && typeof inCouncil === 'function' && inCouncil(e));
      if (!yasakVar && !varOlan && !kuyrukta && canAfford('col_s') &&
          /* FAZ 26: eşikler gevşetildi — 3000/4500 hiç tetiklenmiyordu
             (6 tohumda 0 üretim). Geç oyunda ulaşılabilir seviye. */
          (e.res.ala || 0) > 2000 && (e.res.min || 0) > 2500 &&
          (e.inc.ala || 0) > 80){
        const P = (typeof personaOf === 'function') ? personaOf(e) : null;
        const agresif = (P && P.n === 'Militarist') || prof.war > .72;
        /* ═══ FAZ 28: BAŞ DÜŞMAN SEÇİMİ ═══
           ÖLÇÜM: 60 yıl sonunda Vorrak Klan Birliği yedi koşulun
           altısını sağlıyordu (tekno ✓ alaşım 65197 ✓ mineral 144239 ✓
           gelir 133 ✓ savaşta ✓ militarist ✓) ve tek engel kin ≥45'ti.
           Sorun: grudgeOf yalnız SOMUT ZARAR anılarını (ihanet,
           sabotaj, sistem kaybı) sayıyor; uzun süren bir savaş tek
           başına kin üretmiyor ve savaştaki AI'ların kini 0 kalıyor.
           Çözüm: düşmanlık ölçütü kin YERİNE savaş ağırlığı +
           tehdit + kin bileşimi. */
        /* ÖLÇÜM (Faz 28): 60. yılda AI'lar arasında savaş kalmıyor;
           e.war bayrağı yalnız KORSANLARLA dolu. "Savaşta ol" koşulu
           bu yüzden hiç sağlanmıyordu. Artık düşman aranırken savaş
           şartı yerine SOĞUK DÜŞMANLIK da sayılıyor: kin, kötü
           ilişki, galaktik tehdit. Colossus caydırıcı bir silahtır;
           savaş çıkmadan da inşa edilebilir. */
        let basDusman = null, enSkor = 0;
        for (const o of G.emps){
          if (o.dead || o.wild || o.id === e.id) continue;
          if (!e.contact[o.id]) continue;
          if (e.ally && e.ally[o.id]) continue;
          const savasVar = !!e.war[o.id];
          const dusmanlik = savasVar || (e.rel[o.id] || 0) < -25 ||
                            (typeof grudgeOf === 'function' && grudgeOf(e, o.id) > 20);
          if (!dusmanlik) continue;
          const kin = (typeof grudgeOf === 'function') ? grudgeOf(e, o.id) : 0;
          /* Savaş ne kadar uzun sürdüyse o kadar köklü düşmanlık */
          const yorgun = (typeof exhOf === 'function') ? exhOf(e, o.id) : 0;
          /* Güçlü düşman daha çok hak eder */
          const guc = clamp(totalPower(o) / (totalPower(e) + 1), 0, 2.5);
          /* Kötü ilişki de düşmanlık ölçüsüdür; savaş varsa ağırlaşır */
          const soguk = Math.max(0, -(e.rel[o.id] || 0)) * .45;
          const skor = (kin + yorgun * .8 + guc * 25 +
                        (o.threat ? o.threat * .3 : 0) + soguk) * (savasVar ? 1.4 : 1);
          if (skor > enSkor){ enSkor = skor; basDusman = o; }
        }
        if (agresif && basDusman && enSkor >= 45 && rnd() < .10){
          queueShip(e, yard, 'col_s');
          e.colossusTarget = basDusman.id;
        }
      }
    }
    else if (usage < wantMil && yard.queue.length < 3){
      const unlocked = ['zir','kru','muh','kor'].filter(c => !SHIPS[c].tech || e.techs[SHIPS[c].tech]);
      const best = unlocked[0];
      const mix = fleetRangeMix(e);
      const tot = (mix[1]||0) + (mix[2]||0) + (mix[3]||0) + 1;
      // dengeli filo: ~%25 uzak, ~%35 orta, ~%40 yakın
      let cls = best;
      const wantLong  = (mix[3]||0) / tot < .25;
      const wantMid   = (mix[2]||0) / tot < .35;
      if (wantLong && unlocked.includes('zir') && e.res.ala > SHIPS.zir.cost.ala*1.3) cls = 'zir';
      else if (wantMid && unlocked.includes('kru') && e.res.ala > SHIPS.kru.cost.ala*1.3) cls = 'kru';
      else if (unlocked.includes('muh') && e.res.ala > SHIPS.muh.cost.ala*1.6) cls = 'muh';
      else cls = 'kor';
      if (!canAfford(cls)) cls = 'kor';
      /* FAZ 47: donanma uykusu — savaşta değilsek ve kasa/kapasite
         eşiğe dayandıysa yeni savaş gemisi basma. Savaşta uyku
         geçersiz: hayatta kalmak öncelikli. */
      let savasVar = false;
      for (const w in e.war) if (e.war[w] && G.emps[w] && !G.emps[w].wild) savasVar = true;
      if (e._navySleep && !savasVar) return;
      if (canAfford(cls)) queueShip(e, yard, cls);
    }
  }

  /* --- 3. keşif --- */
  for (const f of G.fleets){
    if (f.e !== e.id || f.path.length || f.mv || f.combat) continue;
    if (fleetHasRole(f,'bilim')){
      const from = f.sys;
      let best = null;
      for (const s of G.sys){
        if (s.surv.includes(e.id)) continue;
        if (s.owner >= 0 && s.owner !== e.id && e.war[s.owner]) continue;
        const d = dist(G.sys[from], s);
        if (!best || d < best.d) best = {s, d};
      }
      if (best) orderMove(f, best.s.id);
    }
  }

  /* --- 4. kolonizasyon --- */
  const targets = colonizeTargets(e);
  if (targets.length){
    const taken = new Set(G.fleets.filter(f=>f.e===e.id && f.ord && f.ord.t==='kol')
                                  .map(f=>f.ord.s+':'+f.ord.p));
    for (const f of G.fleets){
      if (f.e !== e.id || f.combat || !fleetHasRole(f,'koloni')) continue;
      if (f.ord && f.ord.t === 'kol') continue;
      const from = f.sys >= 0 ? f.sys : (f.mv ? f.mv.to : e.home);
      const free = targets.filter(t => !taken.has(t.s+':'+t.p));
      if (!free.length) break;
      free.sort((a,b)=> (dist(G.sys[from],G.sys[a.s]) - a.h*22) - (dist(G.sys[from],G.sys[b.s]) - b.h*22));
      // ulaşılamayan hedefi atla, sıradakini dene
      let placed = false;
      for (const t of free.slice(0, 5)){
        if (orderMove(f, t.s)){
          taken.add(t.s+':'+t.p);
          f.ord = {t:'kol', s:t.s, p:t.p};
          placed = true;
          break;
        }
      }
      if (!placed) continue;
    }
  }

  /* --- 4b. aynı sistemdeki boştaki savaş filolarını birleştir --- */
  const byS = {};
  for (const f of G.fleets){
    if (f.e !== e.id || f.combat || f.mv || f.path.length || f.sys < 0) continue;
    if (!isArmed(f)) continue;
    (byS[f.sys] = byS[f.sys] || []).push(f);
  }
  for (const k in byS){
    const arr = byS[k];
    if (arr.length < 2) continue;
    const main = arr.reduce((a,b)=> a.ships.length >= b.ships.length ? a : b);
    for (const f of arr) if (f !== main && main.ships.length < 26){
      main.ships.push(...f.ships); f.ships = [];
    }
    G.fleets = G.fleets.filter(f => f.ships.length);
  }

  /* --- 5. savaş kararı --- */
  const myPow = totalPower(e);
  for (const o of G.emps){
    if (o.dead || o.id === e.id || !e.contact[o.id] || e.war[o.id] || e.ally[o.id]) continue;
    if (!canDeclareWarOn(e, o)) continue;              // sürgüne dokunulmaz
    const oPow = totalPower(o) + 1;
    const border = G.sys.some(s => s.owner === o.id && s.lanes.some(l => G.sys[l].owner === e.id));
    // kovan/diplomasisiz ırklar sınır komşusuna er ya da geç saldırır
    if (prof.dip <= 0.02 && border && rnd() < .22 + prof.war*.18){ declareWar(e, o); continue; }
    if (!border) continue;
    // barıştan sonra en az 2 yıl bekle (savaş-barış döngüsünü kırar)
    const lastPeace = (e.peaceAt && e.peaceAt[o.id] !== undefined) ? e.peaceAt[o.id] : -9999;
    if (G.day - lastPeace < 720) continue;
    const ratio = myPow/oPow;
    // zayıf ve zengin komşu daha çekici
    const juicy = clamp(sysCount(o) / (sysCount(e)+1), .4, 2.4);
    // zaten savaşta olan komşu ek fırsat: iki cepheye bölünmüş düşman
    const busy = G.emps.some(x => !x.dead && x.id !== e.id && o.war[x.id]) ? .35 : 0;
    const want = prof.war * (ratio - 1.02) * juicy + (e.rel[o.id] < -40 ? .35 : 0) + busy;
    if (ratio > 1.14 && rnd() < want*.50){
      // AI kişiliğine göre savaş hedefi seçer
      if (typeof setWarGoal === 'function'){
        const opts = prof.war > .9 ? ['fetih','yikim','yoketme']
                   : prof.eco > .7 ? ['harac','fetih']
                   : prof.sci > .8 ? ['bilgi','fetih'] : ['fetih','yikim'];
        const pick2 = opts.find(k => e.res.etk >= WAR_GOALS[k].etk) || 'fetih';
        setWarGoal(e, o, pick2);
      }
      declareWar(e, o);
    }
  }

  /* --- 6. barış --- */
  for (const o of G.emps){
    if (o.dead || !e.war[o.id]) continue;
    if (!canPeace(e, o)) continue;                     // Kan Hukuku / Sürgün
    // savaş ilan edip hemen barış istemesin: en az 10 ay savaşsın
    const since = G.day - (e.warStart && e.warStart[o.id] || 0);
    if (since < 300) continue;
    const oPow = totalPower(o)+1;
    const myExh = (typeof exhOf === 'function') ? exhOf(e, o.id) : 0;
    const losing = myPow/oPow < .55 || myExh > 55;
    const tired  = sysCount(e) < sysCount(o) * .6;
    if (peaceAlwaysAccepted(e, o)){ makePeace(e, o); continue; }
    if (!(losing || tired)) continue;
    if (rnd() > .22 + prof.dip*.15) continue;
    if (o.ai){ makePeace(e, o); continue; }
    // oyuncuya teklif: en fazla 15 ayda bir
    e.lastOffer = e.lastOffer || {};
    const lastOff = (e.lastOffer[o.id] !== undefined) ? e.lastOffer[o.id] : -9999;
    if (G.day - lastOff < 450) continue;
    e.lastOffer[o.id] = G.day;
    UI.peaceOffer(e);
  }

  /* --- 6-öncesi. elçi yerleştirme --- */
  e.envoy = e.envoy || {};
  if (envoysUsed(e) < envoyCap(e)){
    const cands = G.emps.filter(o => !o.dead && !o.wild && o.id !== e.id &&
      e.contact[o.id] && !e.war[o.id] && !e.envoy[o.id]);
    if (cands.length){
      // en çok fayda: ya zaten iyi ilişki (ittifak yolu) ya da lüks malı olan
      cands.sort((a,b)=>{
        const la = LUX_KEYS.filter(k => ownLuxury(a)[k] && !ownLuxury(e)[k]).length;
        const lb = LUX_KEYS.filter(k => ownLuxury(b)[k] && !ownLuxury(e)[k]).length;
        return (lb*20 + e.rel[b.id]) - (la*20 + e.rel[a.id]);
      });
      if (rnd() < .4 + prof.dip*.4) e.envoy[cands[0].id] = true;
    }
  }

  /* --- 6-0. oyuncuya müzakere teklifi --- */
  if (e.contact[0] && !G.emps[0].dead && rnd() < .05){
    e.lastProp = e.lastProp || 0;
    if (G.day - e.lastProp > 540){
      const off = aiProposeTo(e, G.emps[0]);
      if (off && canDeliver(e, off.give, G.emps[0])){
        e.lastProp = G.day;
        UI.aiOffer(off);
      }
    }
  }

  /* --- 6a. ticaret anlaşmaları --- */
  if (e.res.etk > 120 && prof.eco > .35){
    for (const o of G.emps){
      if (o.dead || o.id === e.id || e.war[o.id]) continue;
      if (!e.contact[o.id] || (e.pact && e.pact[o.id])) continue;
      if (!canPact(e, o)) continue;
      const luxWant = LUX_KEYS.filter(k => ownLuxury(o)[k] && !ownLuxury(e)[k]).length;
      if (rnd() < .10 + prof.eco*.16 + (e.rel[o.id]+40)/400 + luxWant*.09){
        if (o.id === 0){
          // oyuncuya onay için teklif gönder, tek taraflı kurma
          e.lastProp = e.lastProp || 0;
          if (G.day - e.lastProp > 420){
            e.lastProp = G.day;
            const give = [];
            const r = (e.res.min > e.res.ene) ? 'min' : 'ene';
            const amt = Math.round(Math.min(e.res[r] * .18, 400) / 50) * 50;
            if (amt >= 100) give.push({t:'res', r, v: amt});
            UI.aiOffer({from:e.id, to:0, give, want:[{t:'pact'}]});
          }
        } else {
          e.res.etk -= 70;
          makePact(e, o);
        }
        break;
      }
    }
  }

  /* --- 6b. ittifak arayışı (diplomatik AI'lar) --- */
  if (prof.dip > .55 && e.res.etk > 200){
    for (const o of G.emps){
      if (o.dead || o.id === e.id || e.ally[o.id] || e.war[o.id]) continue;
      if (!e.contact[o.id] || !canAlly(e, o)) continue;
      if (RACES[o.race].dip <= .05) continue;
      // ortak düşman varsa ittifak cazip
      const commonFoe = G.emps.some(x => !x.dead && e.war[x.id] && o.war[x.id]);
      const chance = clamp((e.rel[o.id]+30)/180 * prof.dip + (commonFoe?.25:0), 0, .7);
      if (rnd() < chance){
        if (o.id === 0){
          // ittifak da artık onayına bağlı
          e.lastAllyProp = e.lastAllyProp || 0;
          if (G.day - e.lastAllyProp > 540){
            e.lastAllyProp = G.day;
            UI.aiOffer({from:e.id, to:0, give:[{t:'intel'}], want:[{t:'ally'}]});
          }
        } else {
          e.res.etk -= 150;
          if (e.war[o.id] || o.war[e.id]){
            e.war[o.id] = false; o.war[e.id] = false;
            if (typeof resolveProxyWars === 'function') resolveProxyWars(e, o);
          }
          e.ally[o.id] = true; o.ally[e.id] = true;
          e.rel[o.id] = Math.max(e.rel[o.id], 55); o.rel[e.id] = Math.max(o.rel[e.id], 55);
        }
        break;
      }
    }
  }

  /* --- 7. askerî hareket --- */
  const wars = G.emps.filter(o => !o.dead && e.war[o.id]);
  const armed = G.fleets.filter(f => f.e === e.id && isArmed(f) && !f.combat);

  /* --- duruş seçimi: güç dengesine göre --- */
  for (const f of armed){
    const here = f.sys >= 0 ? threatAt(e, f.sys) : 0;
    const mine2 = fleetPower(f);
    if (here > mine2 * 1.25) f.stance = 'savunma';       // ezileceksen korun
    else if (prof.war > .7 || mine2 > here * 1.6) f.stance = 'agresif';
    else f.stance = prof.turtle > .5 ? 'savunma' : 'agresif';
  }

  if (wars.length && armed.length){
    const total = armed.reduce((a,f)=>a+fleetPower(f),0);
    const enemySys = G.sys.filter(s => wars.some(o => s.owner === o.id));
    // kriz filolarının bulunduğu sistemler de hedef sayılır
    if (G.crisisId !== undefined && e.war[G.crisisId]){
      for (const cf of G.fleets){
        if (cf.e !== G.crisisId || cf.sys < 0) continue;
        const sy = G.sys[cf.sys];
        if (sy && !enemySys.includes(sy)) enemySys.push(sy);
      }
    }
    // savunulması gereken kendi sistemlerimiz (tehdide göre sıralı)
    const threatened = my.map(s => ({s, t: threatAt(e, s.id)}))
                         .filter(x => x.t > 0)
                         .sort((a,b) => b.t - a.t);
    for (const f of armed){
      if (f.path.length || f.mv) continue;
      const from = f.sys;
      const pow = fleetPower(f);

      // zayıf filo ana orduya katılsın
      if (pow < total*.35 && armed.length > 1){
        const big = armed.reduce((a,b)=>fleetPower(a)>fleetPower(b)?a:b);
        if (big !== f && big.sys >= 0 && big.sys !== from){ orderMove(f, big.sys); continue; }
      }

      // en çok tehdit altındaki sistemi savun (gücümüz yetiyorsa)
      if (threatened.length){
        const tgt = threatened[0];
        if (pow > tgt.t * .8 || prof.turtle > .5){
          if (tgt.s.id !== from){ orderMove(f, tgt.s.id); continue; }
          continue;   // zaten oradaysa bekle
        }
      }

      // güçlü ve boşta filo: korsan yuvası veya kalıntı temizle
      if (!threatened.length && pow > 900){
        const prizes = [];
        for (const sy of G.sys){
          if (!sy.seen.includes(e.id)) continue;
          if (sy.nest && sy.nest.hp > 0) prizes.push({sy, need: sy.nest.hp * .35, kind:'yuva'});
          else if (sy.ruin && sy.ruin.hp > 0) prizes.push({sy, need: sy.ruin.hp * .55, kind:'kalinti'});
        }
        const doable = prizes.filter(p2 => pow > p2.need)
          .sort((a,b)=> dist(G.sys[from], a.sy) - dist(G.sys[from], b.sy));
        if (doable.length && rnd() < .5){
          if (orderMove(f, doable[0].sy.id)) continue;
        }
      }

      // saldırı hedefi: zayıf savunmalı, yakın ve değerli sistem
      if (enemySys.length){
        const scored = enemySys.map(sy => {
          const d = dist(G.sys[from], sy);
          const def = sysDefense(sy) + threatAt(e, sy.id);
          let value = sy.planets.filter(pp => pp.col).length * 400 +
            (G.emps[sy.owner] && G.emps[sy.owner].home === sy.id ? 900 : 0);
          /* ═══ FAZ 39: İSYANCININ TEK HEDEFİ ═══
             Özgürlük Savaşı başkentle biter. İsyancı için zalimin
             başkenti diğer her şeyin önündedir.
             ÖLÇÜM: isyancılar 45 kat güçlüyken bile başkenti hiç
             hedeflemiyor, sınır sistemlerinde oyalanıyorlardı. */
          if (typeof inRebelAlliance === 'function' && inRebelAlliance(e) &&
              G.rebelAlliance && sy.owner === G.rebelAlliance.target){
            value += 600;
            if (G.emps[sy.owner] && G.emps[sy.owner].home === sy.id) value += 4000;
          }
          /* ═══ FAZ 55: LOJİSTİK FARKINDALIĞI ═══
             ÖLÇÜM (Faz 54): tedarik cezası muharebeyi %63→%24
             etkiliyor ama AI hedef seçerken bunu hiç hesaba
             katmıyordu — uzaktaki düşmanın peşinden aç bir
             orduyla gidiyordu. Artık ulaşılacak sistemin tedarik
             durumu değeri düşürüyor: kendi hattına yakın hedefler
             öncelikli. */
          let lojistik = 0;
          if (typeof fleetSupply === 'function'){
            const sup = fleetSupply(e, {sys: sy.id, ships: f.ships, e: e.id});
            if (sup < 1){
              lojistik = (1 - sup) * 2600;   // %40 tedarik → −1560
              /* ═══ FAZ 56: İPTAL EDİLEN HEDEFİ HATIRLA ═══
                 Lojistik yüzünden vazgeçilen hedef unutulmaz; AI o
                 yöne ileri üs kurmayı dener (aiForwardBaseTick). */
              if (value > 300 && (!e._blocked || value > e._blocked.value))
                e._blocked = {sys: sy.id, value, at: G.memAge || 0};
            }
          }
          return {sy, score: value - d*1.2 - def*1.8 - lojistik};
        }).sort((a,b) => b.score - a.score);
        const pick2 = scored[0];
        // gücümüz savunmayı aşmıyorsa saldırma, bekle ve büyü
        if (pick2 && pow > (sysDefense(pick2.sy) + threatAt(e, pick2.sy.id)) * .75){
          orderMove(f, pick2.sy.id);
        }
      }
    }
  } else {
    // barışta: önce ödül avı, sonra devriye
    for (const f of armed){
      if (f.path.length || f.mv) continue;
      const pw = fleetPower(f);
      if (pw > 900 && rnd() < .35){
        const prizes = [];
        for (const sy of G.sys){
          if (!sy.seen.includes(e.id)) continue;
          if (sy.nest && sy.nest.hp > 0 && pw > sy.nest.hp * .35) prizes.push(sy);
          else if (sy.ruin && sy.ruin.hp > 0 && pw > sy.ruin.hp * .55) prizes.push(sy);
        }
        if (prizes.length){
          prizes.sort((a,b)=>dist(G.sys[f.sys], a) - dist(G.sys[f.sys], b));
          if (orderMove(f, prizes[0].id)) continue;
        }
      }
      if (rnd() > .25) continue;
      const border = my.filter(s => s.lanes.some(l => G.sys[l].owner !== e.id));
      if (border.length) orderMove(f, border[Math.floor(rnd()*border.length)].id);
    }
  }

  /* --- 8. ilişki sürüklenmesi --- */
  for (const o of G.emps){
    if (o.dead || o.id === e.id) continue;
    if (e.war[o.id]) e.rel[o.id] = clamp(e.rel[o.id]-2, -100, 100);
    else e.rel[o.id] = clamp(e.rel[o.id] + (race.dip>.5?1.2:0.3), -100, 100);
  }
}

function colonizeTargets(e){
  const out = [];
  for (const s of G.sys){
    if (!s.surv.includes(e.id)) continue;
    if (s.owner >= 0 && s.owner !== e.id) continue;
    for (const p of s.planets){
      if (p.owner >= 0) continue;
      const h = habOf(e, p);
      if (h >= 40) out.push({s:s.id, p:p.i, h});
    }
  }
  return out.sort((a,b)=>b.h-a.h);
}

/* --------------------------------------------------------------------
   AI YANITI — kabul / karşı teklif / red
   -------------------------------------------------------------------- */
function aiRespond(ai, offer){
  const ev = evalOffer(ai, offer);
  if (!canDeliver(ai, offer.want, G.emps[offer.from]))
    return {v:'red', why:'İstediğin şeyleri veremeyiz.'};

  if (ev.net > 0) return {v:'kabul', ev};

  /* Eksiği GERÇEKTEN kapatan bir karşı teklif kur.
     Önceki sürüm yetersiz miktar önerip sonsuz döngüye giriyordu:
     artık ya açığı tam kapatır ya da açıkça imkânsız olduğunu söyler. */
  let gap = -ev.net * 1.06;                    // küçük güvenlik payı
  const from = G.emps[offer.from];
  const extra = [];
  /* evalOffer kazancı 'trust' ile ölçekler; karşı teklif hesabı da
     aynı ölçeği kullanmalı. Aksi hâlde AI kendi istediği miktarı
     ekledikten sonra bile "yetersiz" diyordu. */
  const relT = ai.rel[from.id] || 0;
  const profT = ai.ai ? aiProfile(ai) : {dip:.5, war:.5};
  const trustT = Math.max(.35, 1 + relT / 220 + (profT.dip - .5) * .18);

  // teklifte hâlihazırda ne kadar kaynak var? (üst üste yığmayı engelle)
  const already = {};
  for (const it of offer.give) if (it.t === 'res') already[it.r] = (already[it.r]||0) + it.v;

  const order = ['ala','min','ene','tuk'];
  for (const r of order){
    if (gap <= 0) break;
    const have = Math.max(0, (from.res[r]||0) - (already[r]||0));
    if (have < 80) continue;
    const unit = itemValue(ai, {t:'res', r, v:100}, from) / 100 * trustT;   // birim değer
    if (unit <= 0) continue;
    const needAmt = Math.ceil(gap / unit);
    const canGive = Math.floor(have * .80);
    const take = Math.min(needAmt, canGive);
    if (take < 20) continue;
    // YUKARI yuvarla — aşağı yuvarlamak minik bir açık bırakıp
    // sonraki kalemlerin "çok küçük" diye atlanmasına yol açıyordu
    const rounded = Math.min(canGive, Math.max(20, Math.ceil(take / 10) * 10));
    extra.push({t:'res', r, v: rounded});
    gap -= rounded * unit;
  }

  // hâlâ açık varsa teknolojiyle kapatmayı dene
  if (gap > 0){
    const av = Object.keys(from.techs || {}).filter(t => !ai.techs[t] && TECHS[t]);
    av.sort((a,b)=>TECHS[b].c - TECHS[a].c);
    for (const id of av){
      if (gap <= 0) break;
      const v = itemValue(ai, {t:'tech', id}, from) * trustT;
      if (v <= 0) continue;
      extra.push({t:'tech', id});
      gap -= v;
    }
  }

  if (gap <= 2) gap = 0;                 // yuvarlama artığını yok say
  if (gap <= 0 && extra.length){
    const list = extra.map(dealLabel).join(', ');
    return {v:'karsi', add: extra, ev,
            why:'Şunları da eklersen kabul ederiz: ' + list};
  }

  // açık kapatılamıyor — ne kadar eksik olduğunu net söyle
  const short = Math.round(Math.max(gap, -ev.net));
  const askMain = offer.want.map(i => dealLabel(i)).join(', ') || 'bu anlaşma';
  return {v:'red', ev,
          why: askMain + ' için elindekiler yetersiz. Yaklaşık ' + short +
               ' değerinde daha fazlasını masaya koymalısın — ya da daha az şey istemelisin.'};
}

/* AI'nın oyuncuya kendiliğinden teklif kurması */
function aiProposeTo(ai, target){
  const give = [], want = [];
  if (ai.war[target.id]){
    const ratio = totalPower(ai) / (totalPower(target) + 1);
    want.push({t:'peace'});
    if (ratio < .6){
      // kaybediyor: tazminat öner
      const r = (ai.res.min > ai.res.ene) ? 'min' : 'ene';
      const amt = Math.round(Math.min(ai.res[r] * .3, 600) / 50) * 50;
      if (amt >= 100) give.push({t:'res', r, v: amt});
    } else if (ratio > 1.7){
      // kazanıyor: haraç iste
      want.push({t:'tribute', r:'ene', v: 8});
    }
  } else {
    const theirLux = ownLuxury(target);
    const wantLux = LUX_KEYS.filter(k => theirLux[k] && !(ai.luxOwn && ai.luxOwn[k]));
    if (wantLux.length && !(ai.pact && ai.pact[target.id])){
      want.push({t:'pact'});
      const r = 'min';
      const amt = Math.round(Math.min(ai.res[r] * .2, 400) / 50) * 50;
      if (amt >= 100) give.push({t:'res', r, v: amt});
    } else if (sharedFoe(ai, target) && !ai.ally[target.id] && canAlly(ai, target)){
      want.push({t:'ally'});
      give.push({t:'intel'});
    } else {
      // müttefikimiz bizim için savaşta kaldıysa onu kurtarmayı teklif et
      // sınırını kapalı tutan komşudan geçiş izni iste
      if (!(target.passage && target.passage[ai.id]) && !ai.ally[target.id] && rnd() < .4){
        want.push({t:'passage'});
        const r = 'min';
        const amt = Math.round(Math.min(ai.res[r] * .2, 400) / 50) * 50;
        if (amt >= 100) give.push({t:'res', r, v: amt});
        return {from: ai.id, to: target.id, give, want};
      }
      const stuck = G.emps.find(x => !x.dead && !x.wild && x.id !== ai.id &&
        x.proxyWar && x.proxyWar[target.id] === ai.id && x.war[target.id]);
      if (stuck && ai.ally[stuck.id]){
        want.push({t:'peaceWith', target: stuck.id});
        const r = 'min';
        const amt = Math.round(Math.min(ai.res[r] * .25, 500) / 50) * 50;
        if (amt >= 100) give.push({t:'res', r, v: amt});
      }
    }
  }
  if (!want.length) return null;
  return {from: ai.id, to: target.id, give, want};
}

/* ---------- MECLİS KONUŞMALARI ---------- */
const SPEECH = {
  war:['Barış güzeldir ama sınırlarımız kanla çizildi.',
       'Zayıflık davettir. Bu meclis güçlüye saygı duymalı.',
       'Silahlarımızı bırakırsak bizi kim koruyacak?'],
  dip:['Bu masada oturmak bile bir zaferdir. Onu harcamayalım.',
       'Galaksi savaşla değil sözle birleşir.',
       'Komşumuzun derdi bizim derdimizdir.'],
  eco:['Ticaret yolları kapalıyken kimse zengin olmaz.',
       'Bu kararın maliyetini kim ödeyecek? Rakamları konuşalım.',
       'Refah paylaşıldıkça büyür.'],
  sci:['Bilgi saklandığında çürür. Paylaşılmalı.',
       'Bu sorunun cevabı laboratuvarda, mecliste değil.',
       'Geleceği anlayan onu yönetir.'],
  turtle:['Sınırlarımızı savunmak saldırganlık değildir.',
       'Kalelerimiz kimseyi tehdit etmiyor.',
       'Biz kimseye gitmeyiz; kimse de bize gelmesin.']
};
function aiSpeech(e){
  const p = aiProfile(e);
  const best = ['war','dip','eco','sci','turtle'].reduce((a,b)=> (p[b]||0) > (p[a]||0) ? b : a, 'dip');
  const lines = SPEECH[best] || SPEECH.dip;
  return lines[Math.floor(rnd()*lines.length)];
}
/* ---------- AI KONSEY KURMA ----------
   Pasifist bir AI yeterince temas ve etki biriktirdiğinde konseyi
   kendi kurar. Oyuncu kurmazsa galakside yine de bir meclis doğar. */
function aiTryFoundCouncil(){
  if (councilExists()) return;
  if (councilPaceYears() === 0) return;
  // erken oyunda kimse kurmaz — ay sayacı, gün/yıl senkronundan bağımsız
  G.cncAge = (G.cncAge || 0) + 1;
  if (G.cncAge < 60) return;                   // ~5 yıl
  const cands = G.emps.filter(e => {
    if (e.dead || e.wild || !e.ai) return false;
    const mil = (e.ethics && e.ethics.mil) || 0;
    if (mil > -2) return false;
    if (hasCivic(e,'exile') || hasCivic(e,'pirateking')) return false;
    if (RACES[e.race].dip <= .02) return false;
    return canFoundCouncil(e).ok;
  });
  if (!cands.length) return;
  // en diplomatik ve en zengin aday öne çıkar
  cands.sort((a,b)=>{
    const pa = aiProfile(a), pb = aiProfile(b);
    return (pb.dip * 400 + b.res.etk) - (pa.dip * 400 + a.res.etk);
  });
  const founder = cands[0];
  if (rnd() > .18) return;                    // her ay değil, zamanla
  const r = foundCouncil(founder);
  if (r.ok && UI && UI.councilFounded) UI.councilFounded(founder);
}


/* ─────────────────────────────────────────────────────────────
   HAFIZA MEKANİZMASI
   AI geçmişi hatırlar: kim ihanet etti, kim sözünde durdu.
   Her olayın ağırlığı (w) ve unutulma hızı (fade) farklıdır —
   ihanet neredeyse hiç unutulmaz, yağmalanan kervan çabuk geçer.
   ───────────────────────────────────────────────────────────── */
const MEM_KINDS = {
  ihanet      :{n:'ittifakı bozup saldırdı', w:-95, fade:.03},
  komplo      :{n:'gizlice aramızı bozdu',    w:-42, fade:.04},
  sahteBayrak :{n:'suçunu bize yıkmaya çalıştı', w:-70, fade:.02},
  paktBozdu   :{n:'verdiği sözü çiğnedi',    w:-62, fade:.05},
  konseyIhlal :{n:'konsey kararını çiğnedi', w:-52, fade:.07},
  savasIlan   :{n:'sana savaş ilan etti',    w:-46, fade:.11},
  sistemAldi  :{n:'toprağını işgal etti',    w:-40, fade:.07},
  sabotaj     :{n:'tesisini sabote etti',    w:-42, fade:.13},
  casusYakalan:{n:'sınırına casus soktu',    w:-30, fade:.18},
  yaptirim    :{n:'sana ambargo uyguladı',   w:-26, fade:.20},
  kervanYagma :{n:'kervanını yağmaladı',     w:-18, fade:.26},
  sinirGergin :{n:'sınırında asker yığıyor', w:-14, fade:.30},

  yardimEtti  :{n:'savaşta yanında durdu',   w:+58, fade:.05},
  ittifakKurdu:{n:'seninle ittifak kurdu',   w:+42, fade:.10},
  teknolojiVer:{n:'sana teknoloji verdi',    w:+28, fade:.17},
  ticaretActi :{n:'ticaret yollarını açtı',  w:+22, fade:.21},
  konseyDestek:{n:'konseyde seni destekledi',w:+20, fade:.23},
  barisImzala :{n:'seninle barış imzaladı',  w:+18, fade:.25},
  gecisIzni   :{n:'sınırını sana açtı',      w:+16, fade:.27},
  hediye      :{n:'sana hediye gönderdi',    w:+14, fade:.31}
};

/* Bir olayı hafızaya yaz. subject = HATIRLAYAN, aboutId = HAKKINDA. */
function remember(subject, aboutId, kind){
  if (!subject || subject.dead || subject.wild) return;
  if (aboutId === undefined || aboutId === null || aboutId === subject.id) return;
  const K = MEM_KINDS[kind];
  if (!K) return;
  /* MİZAÇ: militarist kini ağır yaşar, pasifist zor tutar.
     Yalnız olumsuz anılar ölçeklenir — iyilik herkeste aynı sayılır. */
  const P = (typeof personaOf === 'function') ? personaOf(subject) : null;
  const w0 = (K.w < 0 && P) ? K.w * P.grudge : K.w;
  subject.mem = subject.mem || {};
  const list = subject.mem[aboutId] || (subject.mem[aboutId] = []);
  const now = G.memAge || 0;
  /* Aynı türden taze kayıt varsa yenisini açma, mevcudu derinleştir:
     beş kez kervan yağmalamak beş anı değil, tek derin yara olsun. */
  let recent = null;
  for (const m of list) if (m.k === kind && now - m.t < 12) recent = m;
  if (recent){
    recent.v = clamp(recent.v + w0 * .35, -150, 150);
    recent.t = now;
  } else {
    list.push({k:kind, v:w0, t:now});
    if (list.length > 14) list.shift();
  }
}

/* Aylık solma + sınır gerginliğinin kendiliğinden anı üretmesi */
function memTick(){
  G.memAge = (G.memAge || 0) + 1;
  for (const e of G.emps){
    if (e.dead || e.wild) continue;
    /* aiProfile sonsuza kadar önbellekteydi: ideoloji reformu ve darbe
       sonrası profil güncellenmiyordu. Aylık tazeliyoruz. */
    e._prof = null;

    const P = (typeof personaOf === 'function') ? personaOf(e) : null;
    const forgive = P ? P.forgive : 1;
    if (e.mem){
      for (const id in e.mem){
        const list = e.mem[id];
        for (let j = list.length - 1; j >= 0; j--){
          const K = MEM_KINDS[list[j].k];
          /* Pasifist yaraları çabuk kapatır, militarist kanatır */
          const fd = (K ? K.fade : .2) * (list[j].v < 0 ? forgive : 1);
          list[j].v *= (1 - fd * .06);
          if (Math.abs(list[j].v) < 1.2) list.splice(j, 1);
        }
        if (!list.length) delete e.mem[id];
      }
    }
    for (const o of G.emps){
      if (o.dead || o.wild || o.id === e.id) continue;
      /* Uzun sınır teması gerginliğe dönüşür — savaşın tohumu budur */
      const fm = frictionMonths(e.id, o.id);
      if (fm > 9 && !e.ally[o.id] && !e.war[o.id] &&
          !(e.treaty && e.treaty[o.id]) && !(o.treaty && o.treaty[e.id])){
        if (rnd() < .10 * (P ? P.grudge : 1)) remember(e, o.id, 'sinirGergin');
      }
      /* Hafıza ilişkiyi kendine çeker */
      const t = trustOf(e, o.id);
      if (t) e.rel[o.id] = clamp(e.rel[o.id] + clamp(t * .012, -.9, .9), -100, 100);
    }
  }
}


/* ═══════════════════════════════════════════════════════════════════
   FISILTI AĞLARI — zayıfın silahı
   Doğrudan savaşamayacak kadar küçük ama diplomatik olarak becerikli
   devletler, Etki puanını kullanarak İKİ BAŞKA devletin arasını bozar.
   Amaç hayatta kalmak: iki devi birbirine düşür, sen nefes al.
   ═══════════════════════════════════════════════════════════════════ */

const WHISPER_COST = 45;          // etki bedeli
const FALSE_FLAG_EXTRA    = 35;   // sahte bayrağın ek etki bedeli
const FALSE_FLAG_RISK_MUL = 1.55; // sahte iz bırakmak ifşa riskini artırır
const WHISPER_BASE = .05;         // taban aylık deneme şansı

/* Bu devlet fısıltı yapabilir mi ve ne kadar isteklidir? */
function whisperAptitude(e){
  if (!e || e.dead || e.wild || !e.ai) return 0;
  if (e.res.etk < WHISPER_COST) return 0;
  const prof = (typeof aiProfile === 'function') ? aiProfile(e) : {dip:.5, war:.5, sci:.5};
  const P    = (typeof personaOf === 'function') ? personaOf(e) : null;

  /* Diplomatik beceri temel yetenektir */
  let apt = prof.dip * .8 + prof.sci * .2;

  /* Mizaç: entrika zayıfın ve tüccarın işidir, militarist küçümser */
  if (P){
    if (P.n === 'Tüccar')       apt *= 1.45;
    else if (P.n === 'Pasifist')apt *= 1.35;
    else if (P.n === 'İzolasyonist') apt *= 1.10;
    else if (P.n === 'Militarist')   apt *= .45;   // "kılıcım varken niye fısıldayayım"
  }
  /* Gölge Konseyi ve Panoptikon doktrinleri entrikayı meslek edinir */
  if (typeof hasCivic === 'function'){
    if (hasCivic(e, 'shadow')) apt *= 1.8;
    if (hasCivic(e, 'panopt')) apt *= 1.3;
  }
  /* ZAYIFLIK ÇARPANI — asıl motivasyon budur.
     Galaksinin ortalamasından zayıfsan entrikaya muhtaçsın. */
  let ortalama = 0, n = 0;
  for (const o of G.emps){
    if (o.dead || o.wild) continue;
    ortalama += totalPower(o); n++;
  }
  ortalama = n ? ortalama / n : 1;
  const benim = totalPower(e) + 1;
  const zayiflik = clamp(ortalama / benim, .5, 3.0);
  return apt * zayiflik;
}

/* Hedef çifti seç: bana en çok tehdit olan İKİ devlet, birbirine
   ne kadar yakınsa fısıltı o kadar değerli. */
function whisperTarget(e){
  const cands = G.emps.filter(o =>
    !o.dead && !o.wild && o.id !== e.id && e.contact[o.id] && !e.ally[o.id]);
  if (cands.length < 2) return null;

  let best = null;
  for (let i = 0; i < cands.length; i++){
    for (let j = i + 1; j < cands.length; j++){
      const a = cands[i], b = cands[j];
      if (a.war[b.id]) continue;                    // zaten savaştalar

      /* Tehdit algısı: ikisi de benden güçlüyse ve bana yakınsa tehlike */
      const myPow = totalPower(e) + 1;
      const tA = clamp(totalPower(a) / myPow, 0, 4);
      const tB = clamp(totalPower(b) / myPow, 0, 4);
      let skor = (tA + tB) * .55;

      /* Aralarındaki yakınlık büyükse bozmak daha kıymetli */
      const aralari = (typeof trustOf === 'function') ? trustOf(a, b.id) : 0;
      if (a.ally[b.id]) skor += 1.4;                // ittifaklarını bozmak en kârlısı
      skor += clamp(aralari / 60, -.5, 1.0);

      /* Bana düşmansa onu birine bulaştırmak ekstra değerli */
      if (a.war[e.id] || b.war[e.id]) skor += .9;
      if ((typeof grudgeOf === 'function') &&
          (grudgeOf(e, a.id) > 30 || grudgeOf(e, b.id) > 30)) skor += .5;

      /* Militarist devleti kışkırtmak daha kolay: barut zaten kuru */
      if (typeof personaOf === 'function'){
        if (personaOf(a).n === 'Militarist') skor += .45;
        if (personaOf(b).n === 'Militarist') skor += .45;
      }
      /* Sınır komşusu olmayan ikiliyi kavga ettirmek zordur */
      const komsu = G.sys.some(sy => sy.owner === a.id &&
        sy.lanes.some(l => G.sys[l].owner === b.id));
      if (!komsu) skor -= .8;

      if (!best || skor > best.skor) best = {a, b, skor};
    }
  }
  return (best && best.skor > .9) ? best : null;
}

/* Fısıltı operasyonu: iki devletin arasına kin ek */
/* ── Fısıltı olasılıkları ──
   Hem AI hem OYUNCU aynı formülleri kullanır; arayüz bu iki
   fonksiyonu çağırarak oyuncuya gerçek oranları gösterir. */
function whisperSuccessChance(e){
  const prof = (typeof aiProfile === 'function') ? aiProfile(e) : {dip:.5, sci:.5};
  /* Diplomasi ikna eder, bilim izleri temizler */
  return clamp(.45 + prof.dip * .28 + prof.sci * .12, .20, .88);
}
function whisperExposureRisk(e, a, b){
  const prof = (typeof aiProfile === 'function') ? aiProfile(e) : {dip:.5, sci:.5};
  let risk = .18;
  if (typeof hasCivic === 'function'){
    if (hasCivic(e, 'shadow')) risk = .04;                 // Gölge Konseyi
    if (hasCivic(e, 'panopt')) risk -= .03;
    if (a && hasCivic(a, 'counter')) risk += .11;
    if (b && hasCivic(b, 'counter')) risk += .11;
  }
  risk -= prof.dip * .05 + prof.sci * .04;
  /* Hedefin sensör ağı da iz bırakır */
  const sens = ((a && a.mods && a.mods.sensor) || 0) + ((b && b.mods && b.mods.sensor) || 0);
  risk += sens * .03;
  return clamp(risk, .02, .60);
}

/* blame verilirse SAHTE BAYRAK: kurbanlar suçu üçüncü tarafta bilir.
   Kazanç büyük — ama ifşa olursa üç devlet birden düşman kesilir. */
function runWhisper(e, a, b, blame){
  e.res.etk -= WHISPER_COST + (blame ? FALSE_FLAG_EXTRA : 0);
  let ifsaRisk = whisperExposureRisk(e, a, b);
  if (blame) ifsaRisk *= FALSE_FLAG_RISK_MUL;      // iz gizlemek zordur
  ifsaRisk = clamp(ifsaRisk, .02, .75);
  const basari = rnd() < whisperSuccessChance(e) * (blame ? .88 : 1);
  /* SAHTE BAYRAK: kurbanlar öfkelerini masum üçüncü tarafa yöneltir */
  if (basari && blame && typeof remember === 'function' &&
      blame.id !== a.id && blame.id !== b.id && blame.id !== e.id){
    remember(a, blame.id, 'komplo');
    remember(b, blame.id, 'komplo');
    a.rel[blame.id] = clamp(a.rel[blame.id] - 18, -100, 100);
    b.rel[blame.id] = clamp(b.rel[blame.id] - 18, -100, 100);
    if (blame.id === 0)
      say('İKİ DEVLET SENİ SUÇLUYOR — yapmadığın bir komplo üstüne yıkıldı', 'war');
  }
  if (basari && typeof remember === 'function'){
    /* İki taraf da diğerini suçlar — kaynak görünmez kalır */
    remember(a, b.id, 'sinirGergin');
    remember(b, a.id, 'sinirGergin');
    a.rel[b.id] = clamp(a.rel[b.id] - 9, -100, 100);
    b.rel[a.id] = clamp(b.rel[a.id] - 9, -100, 100);
    /* İttifakları varsa çatlatmaya çalış */
    if (a.ally[b.id] && rnd() < .25){
      a.ally[b.id] = false; b.ally[a.id] = false;
      if (typeof setColdWar === 'function') setColdWar(a, b, 3);
      if (a.id === 0 || b.id === 0)
        say('İTTİFAKIN ÇATLADI — arkasında bir el olabilir', 'war');
    }
  }
  /* İfşa: kaynak ortaya çıkarsa iki taraf da fısıldayana kin tutar */
  if (rnd() < ifsaRisk){
    if (typeof remember === 'function'){
      /* Sahte bayrak ifşası çok daha ağırdır: suçu yıkılmak istenen
         taraf da olayı öğrenir ve üç devlet birden düşman kesilir. */
      const kind = blame ? 'sahteBayrak' : 'casusYakalan';
      remember(a, e.id, kind);
      remember(b, e.id, kind);
      if (blame && blame.id !== e.id){
        remember(blame, e.id, 'sahteBayrak');
        blame.rel[e.id] = clamp(blame.rel[e.id] - 35, -100, 100);
        /* yıkılmak istenen taraf temize çıkar */
        if (a.mem && a.mem[blame.id]) a.mem[blame.id] = a.mem[blame.id].filter(m => m.k !== 'komplo');
        if (b.mem && b.mem[blame.id]) b.mem[blame.id] = b.mem[blame.id].filter(m => m.k !== 'komplo');
        if (blame.id === 0) say('ADIN TEMİZE ÇIKTI — komployu ' + e.name + ' kurmuş', 'win');
      }
    }
    a.rel[e.id] = clamp(a.rel[e.id] - 22, -100, 100);
    b.rel[e.id] = clamp(b.rel[e.id] - 22, -100, 100);
    if (a.id === 0 || b.id === 0)
      say('FISILTI AĞI İFŞA OLDU — ' + e.name + ' arayı bozmaya çalışıyormuş', 'war');
    return {ok:basari, ifsa:true};
  }
  return {ok:basari, ifsa:false};
}

/* ── OYUNCU FISILTISI ──
   Oyuncu da aynı riske tabidir: aynı başarı formülü, aynı ifşa riski,
   aynı gecikmeli komplo ifşası ve aynı "İstihbarat Sabotajı" savaş
   nedeni. Entrika yapan bedelini öder — oyuncu dahil. */
function playerWhisper(a, b, blame){
  const e = G.p;
  if (!a || !b || a.id === b.id) return {ok:false, why:'İki farklı hedef seç'};
  if (a.id === 0 || b.id === 0) return {ok:false, why:'Kendi aranı bozamazsın'};
  if (a.wild || b.wild) return {ok:false, why:'Bu taraf diplomasi tanımıyor'};
  if (!e.contact[a.id] || !e.contact[b.id]) return {ok:false, why:'Her iki tarafla da temas gerekir'};
  if (a.war[b.id]) return {ok:false, why:'Zaten savaştalar — bozacak bir şey yok'};
  const bedel = WHISPER_COST + (blame ? FALSE_FLAG_EXTRA : 0);
  if ((e.res.etk || 0) < bedel) return {ok:false, why:bedel + ' etki gerekir'};
  if (blame){
    if (blame.wild || blame.dead) return {ok:false, why:'Bu taraf suçlanamaz'};
    if (blame.id === a.id || blame.id === b.id || blame.id === 0)
      return {ok:false, why:'Suçu yıkacağın taraf hedeflerden farklı olmalı'};
    if (!a.contact[blame.id] || !b.contact[blame.id])
      return {ok:false, why:'Hedefler suçlanan tarafı tanımıyor — inandırıcı olmaz'};
  }

  const r = runWhisper(e, a, b, blame);
  e.whisperLog = e.whisperLog || [];
  e.whisperLog.push({a:a.id, b:b.id, ok:r.ok, ifsa:r.ifsa,
                     blame: blame ? blame.id : undefined,
                     t:(G.memAge || 0), found:r.ifsa});
  if (e.whisperLog.length > 40) e.whisperLog.shift();
  return {ok:true, basari:r.ok, ifsa:r.ifsa};
}

/* ── SAHTE BAYRAK HEDEFİ ──
   Suçu kime yıkmalı? En kârlısı, kurbanların zaten şüphelendiği ve
   bizim de zayıflatmak istediğimiz güçlü bir üçüncü taraftır.
   Yalnız becerikli entrikacılar dener: Gölge Konseyi ve Tüccarlar. */
function pickBlameTarget(e, a, b){
  if (e.res.etk < WHISPER_COST + FALSE_FLAG_EXTRA) return null;
  const P = (typeof personaOf === 'function') ? personaOf(e) : null;
  let egilim = 0;
  if (typeof hasCivic === 'function' && hasCivic(e, 'shadow')) egilim += .55;
  if (P){
    if (P.n === 'Tüccar')            egilim += .42;
    else if (P.n === 'İzolasyonist') egilim += .26;
    else if (P.n === 'Pasifist')     egilim += .22;
    else if (P.n === 'Militarist')   egilim -= .10;   // dolambaçlı yolu sevmez
  }
  if (rnd() > clamp(egilim, 0, .70)) return null;

  const cands = G.emps.filter(o => !o.dead && !o.wild &&
    o.id !== e.id && o.id !== a.id && o.id !== b.id &&
    a.contact[o.id] && b.contact[o.id] && !e.ally[o.id]);
  if (!cands.length) return null;

  let best = null;
  for (const o of cands){
    /* Taban inandırıcılık: her devletin gizli ajandası olduğu varsayılır */
    let skor = .40;
    /* Kurbanlar ondan zaten hoşlanmıyorsa suç kolay yapışır */
    skor += clamp((-a.rel[o.id] - b.rel[o.id]) / 160, -.25, .90);
    /* Kârlılık: güçlü bir rakibi düşman etmek işimize gelir */
    skor += clamp(totalPower(o) / (totalPower(e) + 1), 0, 3) * .28;
    if (typeof grudgeOf === 'function') skor += grudgeOf(e, o.id) / 140;
    /* Komşuluk iftirayı inandırıcı kılar */
    const komsu = G.sys.some(sy => sy.owner === o.id &&
      sy.lanes.some(l => G.sys[l].owner === a.id || G.sys[l].owner === b.id));
    if (komsu) skor += .30;
    /* Harika inşa eden devlet zaten şüphe çeker — günah keçisi olmaya hazır */
    if (typeof megaBuilds === 'function' && megaBuilds(o).length) skor += .35;
    if (!best || skor > best.skor) best = {o, skor};
  }
  return (best && best.skor > .70) ? best.o : null;
}

/* Aylık fısıltı turu — diploTick çağırır */
function whisperTick(){
  for (const e of G.emps){
    if (e.dead || e.wild || !e.ai) continue;
    const apt = whisperAptitude(e);
    if (apt <= 0) continue;
    if (rnd() > clamp(WHISPER_BASE * apt, .005, .22)) continue;

    const t = whisperTarget(e);
    if (!t) continue;
    const blame = pickBlameTarget(e, t.a, t.b);
    const r = runWhisper(e, t.a, t.b, blame);
    e.whisperLog = e.whisperLog || [];
    /* found: sonradan çözüldü mü? Faz 4'te karşı istihbarat bu kaydı
       yıllar sonra ortaya çıkarabilir. İfşa olmuş operasyon zaten
       bilindiğinden yeniden çözülmez. */
    e.whisperLog.push({a:t.a.id, b:t.b.id, ok:r.ok, ifsa:r.ifsa,
                       blame: blame ? blame.id : undefined,
                       t:(G.memAge||0), found:r.ifsa});
    /* Kayıt defteri ifşa penceresinden (CI_MAX_AGE = 20 yıl) kısa
       olmamalı. 24 kayıtla sınırlıyken çok aktif bir fısıltıcının eski
       operasyonları daha çözülemeden siliniyor, yani entrika cezasız
       kalıyordu. Artık önce soğumuş dosyalar (çözülmüş ya da ifşa
       penceresini geçmiş) budanır; çözülmemiş taze izler korunur. */
    const simdiW = G.memAge || 0;
    if (e.whisperLog.length > 24){
      const taze = e.whisperLog.filter(w => !w.found && w.ok &&
                                            (simdiW - w.t) <= CI_MAX_AGE);
      const soguk = e.whisperLog.filter(w => !(!w.found && w.ok &&
                                            (simdiW - w.t) <= CI_MAX_AGE));
      /* önce soğuk dosyaları at; hâlâ taşıyorsa en eski taze izi bırak */
      e.whisperLog = soguk.slice(Math.max(0, soguk.length - Math.max(0, 40 - taze.length)))
                          .concat(taze);
      if (e.whisperLog.length > 40) e.whisperLog = e.whisperLog.slice(-40);
    }
  }
}


/* ═══════════════════════════════════════════════════════════════════
   KARŞI İSTİHBARAT — GECİKMELİ İFŞA
   Bir fısıltı operasyonu anında yakalanmadıysa iz bırakır. Bilimi ve
   diplomasisi güçlü devletler bu izi aylar, hatta yıllar sonra
   tesadüfen çözebilir. Entrika unutulmaz; sadece gecikir.
   ═══════════════════════════════════════════════════════════════════ */

const CI_BASE      = .012;   // aylık taban çözme şansı
const CI_MAX_AGE   = 240;    // 20 yıldan eski izler soğur

/* Bir devletin komplo çözme gücü */
function counterIntel(e){
  if (!e || e.dead || e.wild) return 0;
  const prof = (typeof aiProfile === 'function') ? aiProfile(e) : {sci:.5, dip:.5};
  let ci = prof.sci * .65 + prof.dip * .35;
  if (typeof hasCivic === 'function'){
    if (hasCivic(e, 'counter')) ci *= 2.2;      // Karşı İstihbarat doktrini
    if (hasCivic(e, 'panopt'))  ci *= 1.4;      // Panoptikon
    if (hasCivic(e, 'shadow'))  ci *= 1.3;      // gölgeyi gölge tanır
  }
  ci *= 1 + (e.mods && e.mods.sensor ? e.mods.sensor * .18 : 0);
  return ci;
}

/* Aylık tarama: mağdurlar geçmişteki komployu çözebilir mi? */
function counterIntelTick(){
  const simdi = G.memAge || 0;
  for (const casus of G.emps){
    if (casus.dead || casus.wild || !casus.whisperLog) continue;

    for (const w of casus.whisperLog){
      if (w.found || !w.ok) continue;            // zaten bilinen ya da başarısız
      const yas = simdi - w.t;
      if (yas < 2 || yas > CI_MAX_AGE) continue; // taze iz yok, çok eski iz soğuk

      const a = G.emps[w.a], b = G.emps[w.b];
      if (!a || !b || a.dead || b.dead) continue;

      /* İki mağdurdan güçlü olanı soruşturmayı yürütür */
      const ciA = counterIntel(a), ciB = counterIntel(b);
      const ci  = Math.max(ciA, ciB);
      if (ci <= 0) continue;

      /* İz zamanla soğur, ama casus hakkında istihbaratın varsa
         bağlantıyı kurmak kolaylaşır */
      const soguma = clamp(1 - yas / CI_MAX_AGE, .15, 1);
      let sans = CI_BASE * ci * soguma;
      if (typeof intelOf === 'function'){
        const lvl = Math.max(intelOf(a, casus.id), intelOf(b, casus.id));
        sans *= 1 + lvl * .45;                   // sızmış olmak delil verir
      }
      if (typeof hasCivic === 'function' && hasCivic(casus, 'shadow')) sans *= .35;

      if (rnd() > clamp(sans, 0, .30)) continue;

      /* ─── KOMPLO ORTAYA ÇIKTI ─── */
      w.found = true;
      w.foundAt = simdi;
      if (typeof remember === 'function'){
        /* Sahte bayraksa ceza katmerlidir: suçu yıkılmak istenen
           taraf da gerçeği öğrenir ve üç devlet birden düşman olur. */
        const sahte = (w.blame !== undefined) ? G.emps[w.blame] : null;
        const kind = sahte ? 'sahteBayrak' : 'komplo';
        remember(a, casus.id, kind);
        remember(b, casus.id, kind);
        if (sahte && !sahte.dead && sahte.id !== casus.id){
          remember(sahte, casus.id, 'sahteBayrak');
          sahte.rel[casus.id] = clamp(sahte.rel[casus.id] - 35, -100, 100);
          /* iftira temizlenir */
          if (a.mem && a.mem[sahte.id]) a.mem[sahte.id] = a.mem[sahte.id].filter(m => m.k !== 'komplo');
          if (b.mem && b.mem[sahte.id]) b.mem[sahte.id] = b.mem[sahte.id].filter(m => m.k !== 'komplo');
          if (sahte.id === 0)
            say('ADIN TEMİZE ÇIKTI — o komployu ' + casus.name + ' kurmuş', 'win');
          else if (casus.id === 0)
            say('SAHTE BAYRAĞIN ÇÖKTÜ — ' + sahte.name + ' de gerçeği öğrendi', 'war');
        }
      }
      a.rel[casus.id] = clamp(a.rel[casus.id] - 30, -100, 100);
      b.rel[casus.id] = clamp(b.rel[casus.id] - 30, -100, 100);
      /* Mağdurlar birbirine ısınır: ortak bir düşman buldular */
      a.rel[b.id] = clamp(a.rel[b.id] + 12, -100, 100);
      b.rel[a.id] = clamp(b.rel[a.id] + 12, -100, 100);

      /* Komplo galaksinin geri kalanında da itibar aşındırır */
      for (const x of G.emps){
        if (x.dead || x.wild || x.id === casus.id || x.id === a.id || x.id === b.id) continue;
        if (rnd() < .4) x.rel[casus.id] = clamp(x.rel[casus.id] - 8, -100, 100);
      }

      const yil = Math.round(yas / 12);
      if (a.id === 0 || b.id === 0)
        say('KOMPLO ORTAYA ÇIKTI — ' + casus.name + ', ' + yil +
            ' yıl önce ' + (a.id === 0 ? b.name : a.name) + ' ile aramızı bozmuş!', 'war');
      else if (casus.id === 0)
        say('FISILTIN AÇIĞA ÇIKTI — ' + a.name + ' ve ' + b.name +
            ' ' + yil + ' yıl önceki operasyonunu çözdü', 'war');
      break;                                     // ayda bir devlet, bir komplo
    }
  }
}


/* ═══════════════════════════════════════════════════════════════════
   FAZ 6 — AI UZAY İNŞAATI VE HARİKA HIRSI
   AI daha önce hiç uzay yapısı kurmuyordu; bu yüzden Megayapı
   Kıskançlığı yalnızca oyuncu inşa ettiğinde tetikleniyordu.
   Artık yapay zekâ da altyapı kurar ve zenginleşince harikaya soyunur.
   ═══════════════════════════════════════════════════════════════════ */

/* Bu sistemde hangi yapı mantıklı? Mega yapı yalnız zengin ve
   gelişmiş imparatorlukların hırsıdır. */
function aiPickStruct(e, sys){
  if (typeof STRUCTS === 'undefined' || typeof structAllowed !== 'function') return null;
  const izinli = Object.keys(STRUCTS).filter(k => structAllowed(e, sys, k));
  if (!izinli.length) return null;

  const karsilar = k => {
    const c = structCost(e, k);
    const pay = STRUCTS[k].mega ? 1.02 : 1.25;   // harikada tam bütçe yeter
    return Object.keys(c).every(r => (e.res[r] || 0) >= c[r] * pay);
  };
  const P = (typeof personaOf === 'function') ? personaOf(e) : null;
  const prof = aiProfile(e);

  /* ── HARİKA HIRSI ──
     Yeterince zengin ve teknolojik AI, galaksiyi değiştirecek bir
     yapıya soyunur. Zaten bir harika inşa ediyorsa ikinciye kalkmaz. */
  const zatenMega = (typeof megaBuilds === 'function') ? megaBuilds(e).length : 0;
  if (!zatenMega){
    const tek = Object.keys(e.techs || {}).length;
    const zengin = (e.res.min || 0) > 2100 && (e.res.ala || 0) > 720;
    if (zengin && tek >= 11){
      /* Materyalist/Bilimci ve Yayılmacılar harikaya daha isteklidir */
      let hirs = .30 + prof.sci * .35 + prof.eco * .20;
      if (P){
        if (P.n === 'Yayılmacı') hirs += .20;
        else if (P.n === 'İzolasyonist') hirs -= .15;
        else if (P.n === 'Militarist') hirs -= .10;
      }
      if (typeof hasCivic === 'function' && hasCivic(e, 'megaeng')) hirs += .35;
      /* Karar aiStructTick'te bir kez verilir (e.megaWill); burada
         zar atmak hedef seçimi ile inşaat anını çelişkiye düşürüyordu. */
      if (e.megaWill){
        const megalar = izinli.filter(k => STRUCTS[k].mega && karsilar(k));
        if (megalar.length) return megalar[Math.floor(rnd() * megalar.length)];
      }
    }
  }

  /* Sıradan altyapı: ihtiyaca göre öncelik */
  const oncelik = [];
  if ((e.inc && e.inc.min || 0) < 25) oncelik.push('maden_ist');
  if ((e.inc && e.inc.ara || 0) < 30) oncelik.push('bilim_ist');
  if (prof.war > .7) oncelik.push('platform', 'tersane_h');
  if (prof.eco > .6) oncelik.push('tic_ist');
  if (prof.sci > .7) oncelik.push('sensor', 'bilim_ist');
  oncelik.push('role', 'karakol', 'maden_ist', 'bilim_ist');

  for (const k of oncelik)
    if (izinli.includes(k) && !STRUCTS[k].mega && karsilar(k)) return k;
  return null;
}

/* İnşaatçı için hedef sistem seç: kendi bölgemizde, güvenli ve
   henüz yapısı olmayan bir yer. */
function aiStructTarget(e, f){
  let best = null;
  for (const sy of G.sys){
    if (sy.nest || sy.ruin) continue;                    // tehlikeli bölge
    if (sy.work && sy.work.length) continue;             // zaten inşaat var
    const sahip = sy.owner >= 0 ? sy.owner : (typeof claimOf === 'function' ? claimOf(sy) : -1);
    if (sahip >= 0 && sahip !== e.id) continue;          // yabancı toprak
    if (!aiPickStruct(e, sy)) continue;
    const d = (f.sys >= 0) ? dist(G.sys[f.sys], sy) : 0;
    /* Kendi sistemimiz tercih edilir, uzaklık cezalandırılır */
    const skor = (sy.owner === e.id ? 400 : 0) - d;
    if (!best || skor > best.skor) best = {sy, skor};
  }
  return best ? best.sy : null;
}

/* Aylık uzay inşaatı turu */
function aiStructTick(){
  if (typeof startStruct !== 'function') return;
  for (const e of G.emps){
    if (e.dead || e.wild || !e.ai) continue;

    /* ── HARİKA PROJESİ ──
       Zengin ve teknolojik bir AI hedefini ilan eder ve o andan
       itibaren alaşımını gemiye değil harikaya ayırır. */
    const tekno = Object.keys(e.techs || {}).length;
    const insaEdiyor = (typeof megaBuilds === 'function') ? megaBuilds(e).length : 0;
    if (insaEdiyor){
      e.megaReserve = 0;                       // proje başladı, rezerve gerek yok
    } else if (tekno >= 11 && (e.res.min || 0) > 1900){
      const prof0 = aiProfile(e);
      const P0 = (typeof personaOf === 'function') ? personaOf(e) : null;
      let hirs0 = .30 + prof0.sci * .35 + prof0.eco * .20;
      if (P0){
        if (P0.n === 'Yayılmacı') hirs0 += .20;
        else if (P0.n === 'İzolasyonist') hirs0 -= .15;
        else if (P0.n === 'Militarist') hirs0 -= .10;
      }
      /* Hırs bir kez belirlenir ve kalıcıdır — her ay zar atılmaz */
      if (e.megaWill === undefined) e.megaWill = rnd() < clamp(hirs0, 0, .85);
      e.megaReserve = e.megaWill ? 780 : 0;   // 700 maliyet + küçük pay
    } else {
      e.megaReserve = 0;
    }

    const builders = G.fleets.filter(f => f.e === e.id &&
      typeof fleetHasRole === 'function' && fleetHasRole(f, 'insaat'));

    /* 1) Yerinde bekleyen inşaatçı varsa yapıyı kur */
    for (const f of builders){
      if (f.sys < 0 || (f.path && f.path.length) || f.mv || f.combat) continue;
      const sys = G.sys[f.sys];
      const key = aiPickStruct(e, sys);
      if (key && startStruct(e, sys, key, f)) break;      // ayda bir inşaat
    }

    /* 2) Boştaki inşaatçıya hedef ata */
    for (const f of G.fleets){
      if (f.e !== e.id || !fleetHasRole(f, 'insaat')) continue;
      if ((f.path && f.path.length) || f.mv || f.combat) continue;
      if (f.sys >= 0 && aiPickStruct(e, G.sys[f.sys])) continue;   // zaten uygun yerde
      const hedef = aiStructTarget(e, f);
      if (hedef && hedef.id !== f.sys && typeof orderMove === 'function')
        orderMove(f, hedef.id);
    }

    /* 3) İnşaatçı yoksa ve ekonomi elveriyorsa üret */
    if (builders.length < 2 && (e.res.min || 0) > 700 && (e.res.ala || 0) > 260){
      const yard = G.sys.find(sy => sy.owner === e.id &&
        typeof hasYard === 'function' && hasYard(sy) &&
        (!sy.queue || sy.queue.length < 3));
      if (yard && typeof queueShip === 'function' && rnd() < .30)
        queueShip(e, yard, 'ins');
    }
  }
}


/* ═══════════════════════════════════════════════════════════════════
   FAZ 7 — LOJİSTİK FARKINDALIĞI
   AI ikmal hattının koptuğunu fark eder ve filosunu geri çeker.
   Bu, "sonsuz derin sefer" davranışını kırar; savaşlar sınır
   bölgelerinde yoğunlaşır, galaksinin öbür ucuna dalış biter.
   ═══════════════════════════════════════════════════════════════════ */

/* Filonun sığınabileceği en yakın ikmal düğümü */
function nearestSupplySystem(e, f){
  const sid = f.sys >= 0 ? f.sys : (f.mv ? f.mv.to : -1);
  if (sid < 0) return null;
  const gorulen = new Set([sid]);
  let sinir = [sid];
  for (let d = 1; d <= 10; d++){
    const sonraki = [];
    for (const id of sinir){
      for (const l of G.sys[id].lanes){
        if (gorulen.has(l)) continue;
        gorulen.add(l);
        if (typeof isSupplyNode === 'function' && isSupplyNode(e, G.sys[l])) return G.sys[l];
        sonraki.push(l);
      }
    }
    if (!sonraki.length) break;
    sinir = sonraki;
  }
  return null;
}

function aiLogisticsTick(){
  if (typeof fleetSupply !== 'function') return;
  for (const f of G.fleets){
    if (!f.ships || !f.ships.length) continue;
    const e = G.emps[f.e];
    if (!e || e.dead || e.wild || !e.ai) continue;
    if (f.combat) continue;                       // çatışmadan kaçamaz

    if (typeof guardLocked === 'function' && guardLocked(f)) continue;  // FAZ 31
    const sup = fleetSupply(e, f);
    /* Hat sağlamsa bir şey yapma */
    if (sup > .55){ f.retreating = false; continue; }

    /* Zaten geri çekiliyorsa hedefe varana kadar karışma */
    if (f.retreating && (f.path && f.path.length)) continue;

    /* Filo ne kadar yıpranmış? Yaralı filo daha çabuk döner. */
    let saglik = 0, n = 0;
    for (const sh of f.ships){ saglik += sh.h; n++; }   // sh.h zaten 0–1 oran
    saglik = n ? saglik / n : 1;

    /* Karar: ikmal ne kadar kopuksa ve filo ne kadar yıpranmışsa
       geri çekilme isteği o kadar güçlü. Savaşçı AI biraz daha inatçı. */
    const prof = aiProfile(e);
    const inat = prof.war * .25;
    const cekilmeIstegi = (1 - sup) * .8 + (1 - saglik) * .5 - inat;
    if (cekilmeIstegi < .35) continue;

    const hedef = nearestSupplySystem(e, f);
    if (!hedef || hedef.id === f.sys) continue;
    /* Koridor hakkı rota hesaplanmadan ÖNCE verilmeli */
    f.retreating = true;
    if (typeof orderMove === 'function' && orderMove(f, hedef.id)){
      f.ord = null;
    } else {
      f.retreating = false;                  // gerçekten kapana kısılmış
    }
  }
}


/* ═══════════════════════════════════════════════════════════════════
   FAZ 8.5 — FİLO TERHİSİ
   Faz 8'de bakım maliyetleri arttı ve bazı AI'lar enerji gelirini
   eksiye düşürüp hazinesini tüketiyordu. Artık batmakta olan bir
   imparatorluk savaşta değilken en ucuz gemilerini terhis edip
   ekonomisini toparlıyor.
   ═══════════════════════════════════════════════════════════════════ */

/* En ucuzdan pahalıya: önce korvetler gider */
const DISBAND_ORDER = ['kor', 'muh', 'kru', 'zir'];

function aiDisbandTick(){
  for (const e of G.emps){
    if (e.dead || e.wild || !e.ai) continue;

    const gelir = (e.inc && e.inc.ene) || 0;
    const stok  = e.res.ene || 0;
    /* Kaç ay dayanır? Gelir eksiyse stok erir. */
    const kalanAy = gelir >= 0 ? 999 : stok / Math.max(1, -gelir);

    /* Savaşta olmak terhisi zorlaştırır ama imkânsız kılmaz:
       tamamen iflas etmektense küçülmek yeğdir. */
    let savasta = false;
    for (const w in e.war) if (e.war[w]) savasta = true;

    /* ═══ FAZ 37: KAPASİTE AŞIMI DA TERHİS SEBEBİ ═══
       ÖLÇÜM (Faz 36 şüphesi doğrulandı ama farklı yönden):
       terhis yalnız ENERJİ krizine bakıyordu. Pakt feshinde
       kapasite 71→46 düşünce AI'lar aşıma giriyor, aşım cezası
       enerjiyi eritiyor ve ancak o zaman tepki veriyorlardı —
       geç ve aşırı (72→15). Artık aşımı doğrudan görüyorlar. */
    const kul = (typeof fleetUsage === 'function') ? fleetUsage(e) : 0;
    const kapasite = Math.round(e.cap || 0);
    const asim = Math.max(0, kul - kapasite);

    const kriz  = kalanAy < 6  || stok < 40;
    const sikinti = kalanAy < 18;
    if (!sikinti && !asim) { e.disbandStreak = 0; continue; }
    if (savasta && !kriz && !asim) continue;     // savaşta yalnız kriz/aşımda terhis

    /* Ne kadar küçülmeli? Açığı kapatacak kadar. */
    let hedefKesinti = gelir < 0 ? -gelir * 1.25 : 0;
    if (stok < 40) hedefKesinti = Math.max(hedefKesinti, 12);
    /* Aşım varsa öncelik onda: ceza katlanarak arttığı için
       önce kapasiteye inmek gerekir. */
    const asimHedef = asim > 0 ? asim : 0;
    if (hedefKesinti <= 0 && asimHedef <= 0) continue;

    let kesilen = 0, sayi = 0, kesilenSz = 0;
    for (const cls of DISBAND_ORDER){
      if (kesilen >= hedefKesinti && kesilenSz >= asimHedef) break;
      for (const f of G.fleets){
        if (f.e !== e.id || !f.ships.length) continue;
        if (f.combat) continue;                  // çatışmadaki filo dağıtılmaz
        for (let i = f.ships.length - 1; i >= 0; i--){
          /* İKİ HEDEF: bakım açığı VE kapasite aşımı. İkisi de
             kapandıysa dur — aşırı terhis ekonomiyi savunmasız
             bırakıyordu (ölçümde 72→15 düşüş görüldü). */
          if (kesilen >= hedefKesinti && kesilenSz >= asimHedef) break;
          if (f.ships[i].c !== cls) continue;
          /* Savaştaysa son savunma gücünü tamamen eritme */
          if (savasta && fleetPower(f) < 400) break;
          const sz = SHIPS[cls].sz || 1;
          f.ships.splice(i, 1);
          kesilen += SHIPS[cls].up * (1 + (e.mods ? e.mods.upMul : 0));
          kesilenSz += sz;
          sayi++;
        }
      }
    }
    /* Boşalan filoları temizle */
    G.fleets = G.fleets.filter(f => f.e !== e.id || f.ships.length);

    if (sayi){
      e.disbandStreak = (e.disbandStreak || 0) + 1;
      /* Terhis edilen gemilerin bir kısmı alaşım olarak geri döner */
      e.res.ala = (e.res.ala || 0) + sayi * 6;
      if (e.id === 0)
        say(sayi + ' gemi terhis edildi — bakım yükü hafifledi', 'war');
    }
  }
}


/* ═══════════════════════════════════════════════════════════════════
   FAZ 10 — AI CASUSLUK OPERASYONLARI
   Denetimde ortaya çıktı: runOp yalnızca oyuncu tarafından
   çağrılıyordu. AI istihbarat topluyor ama hiç kullanmıyordu.
   Artık mizacına ve stratejik ihtiyacına göre operasyon seçiyor.
   ═══════════════════════════════════════════════════════════════════ */

/* Hangi operasyon şu an mantıklı? Puanlar ihtiyaca göre verilir. */
function aiPickOp(e, o){
  if (typeof OPS === 'undefined' || typeof intelOf !== 'function') return null;
  const lvl = intelOf(e, o.id);
  const prof = aiProfile(e);
  const P = (typeof personaOf === 'function') ? personaOf(e) : null;
  const mz = P ? P.n : '';
  const savasta = !!e.war[o.id];
  const kin = (typeof grudgeOf === 'function') ? grudgeOf(e, o.id) : 0;

  const puan = {};
  const ekle = (k, v) => {
    if (k === 'stealTech' || k === 'incite'){ puan[k] = (puan[k] || 0) + v; return; }
    if (OPS[k] && lvl >= OPS[k].lvl) puan[k] = (puan[k] || 0) + v;
  };

  /* Teknoloji açığı varsa çalmak en kârlısı */
  const benimTek = Object.keys(e.techs || {}).length;
  const onunTek  = Object.keys(o.techs || {}).length;
  if (onunTek > benimTek + 2) ekle('calTech', 1.2 + (onunTek - benimTek) * .05);
  ekle('calTech', prof.sci * .5);

  /* Fakirsem hazine baskını */
  const zenginlik = (o.res.min || 0) + (o.res.ene || 0) + (o.res.ala || 0) * 2;
  const benimZ = (e.res.min || 0) + (e.res.ene || 0) + (e.res.ala || 0) * 2;
  if (zenginlik > benimZ * 1.4) ekle('hazine', .9 + prof.eco * .5);

  /* Savaş öncesi/sırası hazırlık */
  if (savasta){
    ekle('filoPlan', 1.3);
    ekle('sabotaj', 1.0 + prof.war * .4);
    ekle('tersaneVir', .9);
  } else if (kin > 35){
    /* Savaşa hazırlanıyorum: önce tersanesini çökert */
    ekle('tersaneVir', .8 + kin / 120);
    ekle('filoPlan', .7);
  }

  /* Ambargo altındaysam kaçakçılık hayat kurtarır — ama yalnızca
     HENÜZ DELİNMEMİŞ bir hat varsa. Aksi hâlde AI aynı ambargoyu
     tekrar tekrar deliyor ve etkisini çöpe atıyordu (ölçümde
     operasyonların %66'sı buraydı). */
  if (typeof embargoOn === 'function'){
    let acikHat = 0;
    for (const x of G.emps){
      if (x.dead || x.wild || x.id === e.id) continue;
      if (embargoOn(x, e.id) && !(e.smuggle && e.smuggle[x.id] > G.day)) acikHat++;
    }
    if (acikHat) ekle('ambargoKir', .70 + acikHat * .18);
  }

  /* ═══ FAZ 38: İSYANCI ÖNCELİĞİ ═══
     İttifak üyesi zalim Koruyucu'yu önce içeriden çökertmeye
     çalışır: her operasyon türü daha cazip hale gelir. */
  let rebelKat = 1;
  if (typeof inRebelAlliance === 'function' && inRebelAlliance(e) &&
      G.rebelAlliance && G.rebelAlliance.target === o.id){
    rebelKat = 2.2;
    ekle('sabotaj', .8); ekle('hazine', .5); ekle('filoPlan', .6);
    ekle('tersaneVir', .5); ekle('suikast', .4);
  }

  /* ═══ FAZ 42: İSYANI KIŞKIRT ═══
     Sinsi AI'lar düşmanı içeriden bölmeyi sever. Hedefin sınır
     dünyası ne kadar kırılgansa istek o kadar büyür. */
  if (typeof canIncite === 'function' && lvl >= 2){
    const chk = canIncite(e, o);
    if (chk.ok && chk.hedef){
      const col = chk.hedef.pl.col;
      let ist = .30;
      /* Zaten çatlamış bir dünya en kârlı hedeftir */
      if (col.stab < 40) ist += .45;
      if (col.stab < 25) ist += .35;
      /* ═══ FAZ 43: ISRARCI AI — KOKU ALAN YIRTICI ═══
         Sayaç 10'u geçtiyse av yaralı demektir: AI diğer
         operasyonları bırakıp 24 ay boyunca aynı gezegene yüklenir. */
      const sc = col.secede || 0;
      if (sc >= 10){
        ist += 1.40;                              // ezici öncelik
        e._lockTarget = {e: o.id, sys: chk.hedef.sys.id, pi: chk.hedef.pl.i,
                         until: (G.memAge || 0) + 24};
      } else if (sc > 0) ist += .50;              // sayaç işliyorsa son darbe
      /* Kilitli hedefimizse sadakat: başka devlete yönelme */
      if (e._lockTarget && e._lockTarget.until > (G.memAge || 0)){
        if (e._lockTarget.e === o.id) ist += .80;
        else ist -= .60;
      }
      if (typeof hasCivic === 'function' && hasCivic(e, 'shadow')) ist += .40;
      if (mz === 'İzolasyonist') ist += .25;
      if (prof.dip > .55) ist += .20;
      /* Savaştaysak daha da cazip */
      if (e.war[o.id]) ist += .30;
      ekle('incite', ist);
    }
  }

  /* ═══ FAZ 49: SAHTEKÂR AI ENTRİKAYA YÖNELİR ═══
     Dördüncü etik ekseni artık operasyon seçimini de etkiliyor:
     sahtekâr devletler kışkırtma, şantaj ve sahte bayrağı
     önceliklendirir; dürüst devletler bu işlerden kaçınır. */
  {
    const ahl = (e.ethics && e.ethics.ahl) || 0;
    if (ahl < 0){
      const kat = Math.min(1, Math.abs(ahl) / 2);
      ekle('incite', .35 * kat);
      ekle('sabotaj', .30 * kat);
      ekle('hazine', .25 * kat);
      ekle('sahteKanit', .30 * kat);
    } else if (ahl > 0){
      /* Dürüst devlet gölgeden hoşlanmaz — tüm puanlar kırpılır */
      const ceza = Math.min(1, ahl / 2);
      for (const k2 in puan) puan[k2] *= (1 - .35 * ceza);
    }
  }

  /* FAZ 30: Teknoloji hırsızlığı — bilim açığı varsa en kârlı yol */
  if (typeof stealTech === 'function' && lvl >= 2){
    let acik = 0;
    for (const id in (o.techs || {}))
      if (!(e.techs && e.techs[id]) && typeof TECHS !== 'undefined' && TECHS[id]) acik++;
    if (acik >= 3){
      let ist = .45 + Math.min(.5, acik * .05);
      if (prof.sci > .6) ist += .25;
      if (mz === 'İzolasyonist') ist += .15;
      ekle('stealTech', ist);
    }
  }

  /* FAZ 16: Derin Soruşturma — üstüne iftira atılmış bir dosta
     yardım etmek ya da kendi adını temizlemek. Ucuz ve düşük riskli,
     ama yalnızca çözülecek bir iftira varsa anlamlı. */
  if (OPS.sorusturma && lvl >= 1){
    let iftira = 0;
    /* Kendi üstüme atılan iftira var mı? */
    iftira += (e.hitLog || []).filter(w => w.known && w.framed !== undefined).length * 2;
    /* Hedefe atılmış iftira (onu temize çıkarıp dost kazanırım) */
    for (const v of G.emps){
      if (v.dead || v.wild || v.id === e.id) continue;
      iftira += (v.hitLog || []).filter(w => w.known && w.by === o.id &&
        w.framed !== undefined).length;
    }
    if (iftira){
      let ist = .60 + Math.min(.6, iftira * .18);
      if (prof.sci > .6) ist += .20;                 // bilimci soruşturmayı sever
      if (mz === 'Pasifist') ist += .18;
      if (mz === 'Militarist') ist -= .12;
      if (e.rel[o.id] > 20) ist += .20;              // dostumu temize çıkarırım
      ekle('sorusturma', ist);
    }
  }

  /* FAZ 15: Sahte kanıt — entrikacı mizaçların silahı. Yalnızca
     galakside üstüne yıkılacak açık dosya varsa mantıklı. */
  if (OPS.sahteKanit && lvl >= 2){
    let acikDosya = 0;
    for (const v of G.emps){
      if (v.dead || v.wild || v.id === e.id || v.id === o.id) continue;
      if (!v.contact[o.id]) continue;
      acikDosya += (v.hitLog || []).filter(w => !w.known).length;
    }
    if (acikDosya){
      let ist = .55 + Math.min(.5, acikDosya * .08);
      if (mz === 'Tüccar') ist += .25;
      else if (mz === 'İzolasyonist') ist += .20;
      else if (mz === 'Militarist') ist -= .15;
      if (typeof hasCivic === 'function' && hasCivic(e, 'shadow')) ist += .40;
      /* Güçlü bir rakibi galaksiye düşman etmek en kârlısı */
      if (totalPower(o) > totalPower(e)) ist += .25;
      ekle('sahteKanit', ist);
    }
  }

  /* Zayıfsam sahte istihbarat ve isyan; güçlüysem suikast */
  const oran = totalPower(e) / (totalPower(o) + 1);
  if (oran < .8) ekle('yalan', 1.0);
  if (kin > 50) ekle('isyan', .7 + kin / 150);
  if (kin > 60 && oran > 1.1) ekle('suikast', .6 + kin / 180);

  /* Mizaç eğilimleri */
  if (mz === 'Tüccar'){ ekle('hazine', .45); ekle('kervan', .5); ekle('ambargoKir', .4); }
  if (mz === 'Militarist'){ ekle('sabotaj', .5); ekle('filoPlan', .4); }
  if (mz === 'İzolasyonist'){ ekle('yalan', .4); ekle('tersaneVir', .3); }
  if (mz === 'Pasifist'){ ekle('calTech', .35); ekle('yalan', .3); }
  if (typeof hasCivic === 'function' && hasCivic(e, 'shadow')){
    for (const k in puan) puan[k] *= 1.35;         // Gölge Konseyi her operasyonda usta
  }

  /* ── ETKİSİ SÜREN OPERASYONU TEKRARLAMA ──
     AI aynı hedefe defalarca aynı operasyonu yapıp etkiyi çöpe
     atıyordu (ölçüm: Tersane Virüsü tüm operasyonların %48'i).
     Süreli etkiler bitmeden yenisi önerilmez. */
  if (o.virusUntil && o.virusUntil > G.day) delete puan.tersaneVir;
  if (e.fleetIntel && e.fleetIntel[o.id] > G.day) delete puan.filoPlan;
  if (e.routeIntel && e.routeIntel[o.id] > G.day) delete puan.kervan;
  if (e.fakeTo && e.fakeTo[o.id] && e.fakeTo[o.id].until > G.day) delete puan.yalan;
  /* Aynı hedefe son 24 turda yapılan operasyon tekrarlanmaz */
  if (e.opLog){
    const yakin = e.opLog.filter(w => w.o === o.id && (G.memAge || 0) - w.t < 24);
    for (const w of yakin) delete puan[w.k];
  }

  /* Karşılanabilir mi? */
  /* İsyancı katsayısı tüm puanlara uygulanır */
  if (rebelKat !== 1) for (const k in puan) puan[k] *= rebelKat;

  let best = null;
  for (const k in puan){
    if (k === 'stealTech'){
      if ((e.res.etk || 0) >= 90 * 1.4 && (!best || puan[k] > best.p))
        best = {k, p: puan[k]};
      continue;
    }
    if (k === 'incite'){
      const bedel = (typeof INCITE_COST !== 'undefined') ? INCITE_COST : 120;
      if ((e.res.etk || 0) >= bedel * 1.4 && (!best || puan[k] > best.p))
        best = {k, p: puan[k]};
      continue;
    }
    const OP = OPS[k];
    let karsilar = true;
    for (const r in OP.cost) if ((e.res[r] || 0) < OP.cost[r] * 1.4) karsilar = false;
    if (!karsilar) continue;
    if (!best || puan[k] > best.p) best = {k, p: puan[k]};
  }
  return (best && best.p > .75) ? best.k : null;
}

/* Aylık operasyon turu — diploTick çağırır */
function aiOpsTick(){
  if (typeof runOp !== 'function') return;
  for (const e of G.emps){
    if (e.dead || e.wild || !e.ai) continue;
    /* FAZ 43: süresi dolan hedef kilidini bırak */
    if (e._lockTarget && e._lockTarget.until <= (G.memAge || 0)) delete e._lockTarget;
    if ((e.res.etk || 0) < 40) continue;

    /* Operasyon sıklığı: diplomatik beceri ve mizaç belirler */
    const prof = aiProfile(e);
    let sans = .06 + prof.dip * .05;
    if (typeof hasCivic === 'function' && hasCivic(e, 'shadow')) sans *= 2.2;
    if (typeof personaOf === 'function'){
      const P = personaOf(e);
      if (P.n === 'İzolasyonist') sans *= 1.3;
      else if (P.n === 'Militarist') sans *= .7;
    }
    /* ═══ FAZ 50: AHLAK EKSENİ OPERASYON İŞTAHINA BAĞLANDI ═══
       ÖLÇÜM (60 yıl × 3 tohum): sahtekâr AI 53.8 op/devlet,
       DÜRÜST AI 92.8 — tam ters! Sebep: opCost/opBonus yalnız
       maliyet ve başarı oranına giriyordu, AI'nın operasyon
       BAŞLATMA isteğine hiç dokunmuyordu. Dürüst devletler
       gölgede daha çok çalışıyor görünüyordu.
       Artık ahlak ekseni doğrudan iştahı belirliyor. */
    const ahl = (e.ethics && e.ethics.ahl) || 0;
    if (ahl <= -2) sans *= 2.0;          // koyu sahtekâr: entrika onun dili
    else if (ahl <= -1) sans *= 1.5;
    else if (ahl >= 2) sans *= .35;      // koyu dürüst: gölgeden kaçınır
    else if (ahl >= 1) sans *= .60;
    if (rnd() > clamp(sans, .01, .34)) continue;

    /* Gölge Konseyi ayda iki operasyon çevirir */
    const kota = (typeof hasCivic === 'function' && hasCivic(e, 'shadow')) ? 2 : 1;
    let yapilan = 0;

    /* Hedef: temas kurulmuş, müttefik olmayan devletler */
    const adaylar = G.emps.filter(o => !o.dead && !o.wild && o.id !== e.id &&
      e.contact[o.id] && !e.ally[o.id]);
    if (!adaylar.length) continue;

    /* En yüksek istihbarata sahip olduğum ve en çok kin duyduğum hedef */
    adaylar.sort((a, b) => {
      const ka = (typeof grudgeOf === 'function') ? grudgeOf(e, a.id) : 0;
      const kb = (typeof grudgeOf === 'function') ? grudgeOf(e, b.id) : 0;
      return (intelOf(e, b.id) * 30 + kb) - (intelOf(e, a.id) * 30 + ka);
    });

    for (const o of adaylar.slice(0, 4)){
      const key = aiPickOp(e, o);
      if (!key) continue;
      const r = (key === 'stealTech' && typeof stealTech === 'function')
        ? stealTech(e, o)
        : (key === 'incite' && typeof inciteRebellion === 'function')
        ? inciteRebellion(e, o) : runOp(e, o, key);
      if (r && r.ok){
        e.opLog = e.opLog || [];
        e.opLog.push({t: G.memAge || 0, k: key, o: o.id, caught: !!r.caught});
        if (e.opLog.length > 20) e.opLog.shift();
        yapilan++;
      }
      /* FAZ 11: Gölge Konseyi doktrini ayda İKİ operasyon çevirebilir.
         İstihbarat baskısı artık hissedilir olmalı. */
      if (yapilan >= kota) break;
    }
  }
}


/* ═══════════════════════════════════════════════════════════════════
   FAZ 11 — SOĞUK DOSYA SORUŞTURMASI
   hitLog'daki FAİLİ BİLİNMEYEN operasyonlar zamanla çözülebilir.
   Faz 4'teki counterIntel gücünü yeniden kullanır; yeni bir
   istihbarat sistemi kurulmaz.
   ═══════════════════════════════════════════════════════════════════ */
function hitLogTick(){
  if (typeof counterIntel !== 'function') return;
  const simdi = G.memAge || 0;
  for (const e of G.emps){
    if (e.dead || e.wild || !e.hitLog || !e.hitLog.length) continue;
    const ci = counterIntel(e);
    if (ci <= 0) continue;

    for (const w of e.hitLog){
      if (w.known) continue;
      const yas = simdi - w.t;
      if (yas < 2 || yas > CI_MAX_AGE) continue;         // taze/soğumuş dosya
      /* Failin üzerimizdeki istihbaratı yüksekse izini gizlemesi kolay */
      const fail = G.emps[w.by];
      let gizlilik = 1;
      if (fail && typeof hasCivic === 'function' && hasCivic(fail, 'shadow')) gizlilik = .35;
      const sans = clamp(CI_BASE * ci * gizlilik * (1 - yas / CI_MAX_AGE), .002, .25);
      if (rnd() > sans) continue;

      w.known = true;
      w.foundAt = simdi;
      if (fail && !fail.dead){
        if (typeof remember === 'function') remember(e, fail.id, 'komplo');
        e.rel[fail.id] = clamp(e.rel[fail.id] - 20, -100, 100);
        if (e.id === 0)
          say('SOĞUK DOSYA ÇÖZÜLDÜ — o operasyonun arkasında ' + fail.name + ' varmış', 'war');
        else if (fail.id === 0)
          say(e.name + ' eski bir operasyonunun izini sürdü — kimliğin ifşa oldu', 'war');
      }
      break;                                             // ayda bir dosya
    }
  }
}


/* ═══════════════════════════════════════════════════════════════════
   FAZ 22 — AI TAARRUZ ORDUSU KOMUTASI
   İki refleks:
     SAVUNMA — barışta ya da tehdit altında ordu kendi en değerli
       gezegeninin yörüngesinde bekler ve garnizona eklenir.
     TAARRUZ — savaşta, kendi savaş filosunun ZATEN bastırdığı bir
       düşman gezegenine gönderilir. Ordu tek başına gitmez;
       kalkan inmeden çıkarma yapılamaz.
   ═══════════════════════════════════════════════════════════════════ */
/* FAZ 31: Colossus koruma filosu kilitli — şarj sürerken başka
   göreve gönderilmez. Ölçümde koruma filosu dağılınca Colossus
   savunmasız kalıyordu. */
function guardLocked(f){
  if (!f || f.guardColossus === undefined || f.guardColossus === false) return false;
  const sysId = f.guardColossus;
  for (const c of G.fleets){
    if (c.e !== f.e || !c.ships.length) continue;
    if (typeof isColossus !== 'function' || !isColossus(c)) continue;
    const cs = c.sys >= 0 ? c.sys : (c.mv ? c.mv.to : -1);
    if (cs === sysId) return true;            // Colossus hâlâ orada
  }
  f.guardColossus = false;                    // görev bitti
  return false;
}

/* FAZ 31: Colossus şarj olurken koruma filosu o sistemden ayrılamaz.
   Ölçümde şarj hiç 1'i geçmiyordu; koruma çekilince hedef kaybolup
   sayaç sıfırlanıyordu. Bu kilit tüm AI filo emirlerinden ÖNCE
   uygulanır. */
function colossusGuardLock(){
  if (typeof isColossus !== 'function') return;
  /* Hangi sistemlerde şarj olan Colossus var? */
  const kilit = {};
  for (const f of G.fleets){
    if (!f.ships || !f.ships.length || !isColossus(f)) continue;
    if (f.sys < 0 || f.mv) continue;
    if (typeof colossusTarget === 'function' && colossusTarget(f))
      kilit[f.sys] = f.e;
  }
  for (const g of G.fleets){
    if (!g.ships || !g.ships.length) continue;
    if (g.sys < 0) continue;
    if (kilit[g.sys] !== g.e) { if (g.guardLocked) delete g.guardLocked; continue; }
    if (typeof isArmed === 'function' && !isArmed(g)) continue;
    /* Bu filo koruma görevinde: emirleri iptal edilir */
    g.guardLocked = true;
    if (g.path && g.path.length) g.path.length = 0;
    g.ord = null;
  }
}

function aiArmyTick(){
  if (typeof isTransport !== 'function') return;
  for (const e of G.emps){
    if (e.dead || e.wild || !e.ai) continue;

    const ordular = G.fleets.filter(f => f.e === e.id && f.ships.length &&
      isTransport(f) && !f.mv && (!f.path || !f.path.length));
    if (!ordular.length) continue;

    const savasta = Object.keys(e.war).some(k => e.war[k]);
    const prof = aiProfile(e);

    /* Kendi savaş filolarımın bulunduğu sistemler — çıkarma ancak
       oralarda mantıklı. Bir kez toplanır. */
    /* Savaş filolarımın bulunduğu VE GİTTİĞİ sistemler.
       Eskiden yalnız `f.sys` sayılıyordu: filo yoldayken ordu hedefi
       göremiyor, filo varınca bombardıman 6 ayda işi bitiriyor ve
       ordu hiç yola çıkmıyordu. Artık ordu filoyla AYNI ANDA yola
       çıkabiliyor — Hızlı İntikal de bu sayede anlam kazanıyor. */
    const bastirilan = {};
    if (savasta){
      for (const f of G.fleets){
        if (f.e !== e.id || !f.ships.length || !isArmed(f)) continue;
        const guc = fleetPower(f);
        if (f.sys >= 0) bastirilan[f.sys] = (bastirilan[f.sys] || 0) + guc;
        /* Yoldaki filonun varış noktası da hedef sayılır */
        const varis = f.mv ? f.mv.to
                    : (f.path && f.path.length ? f.path[f.path.length - 1] : -1);
        if (varis >= 0 && varis !== f.sys)
          bastirilan[varis] = (bastirilan[varis] || 0) + guc * .85;
      }
    }

    for (const ordu of ordular){
      if (guardLocked(ordu)) continue;             // FAZ 31: koruma görevi
      /* ── TAARRUZ ── */
      let hedef = null;
      if (savasta){
        let enIyi = 0;
        for (const sysId in bastirilan){
          const sy = G.sys[sysId];
          if (!sy) continue;
          /* KRİTİK: sistem sahipliği UZAY muharebesiyle anında el
             değiştiriyor (captureSystem), ama GEZEGENLER eski
             sahibinde kalıyor. Eskiden sy.owner'a bakıyordum ve
             koşul hiç sağlanmıyordu — 600 turluk tanıda 461
             fırsatın SIFIRINDA ordu sevk edilebilmişti.
             Doğru soru: bu sistemde düşman GEZEGENİ var mı? */
          let dusmanGezegen = false;
          for (const pl of sy.planets){
            if (!pl.col || pl.owner < 0 || pl.owner === e.id) continue;
            if (e.war[pl.owner] || (G.emps[pl.owner] && G.emps[pl.owner].wild)){
              dusmanGezegen = true; break;
            }
          }
          if (!dusmanGezegen) continue;
          /* Ordu YOLA ÇIKARKEN kalkanın inmiş olması gerekmez —
             yolculuk aylar sürüyor ve filo bu sırada kalkanı
             indiriyor. Eski koşul (shield<=12) orduyu geç
             gönderiyordu; ölçümde AI'nın fetihlerinin %95'i
             bombardımanla oluyor, ordular hiç yetişmiyordu. */
          let deger = 0, hazir = false;
          for (const pl of sy.planets){
            if (!pl.col || pl.owner < 0 || pl.owner === e.id) continue;
            if (!e.war[pl.owner] && !(G.emps[pl.owner] && G.emps[pl.owner].wild)) continue;
            /* Kalkan zaten iniyorsa ya da düşükse hedef geçerli */
            if ((pl.col.shield || 0) <= 55) hazir = true;
            deger += pl.col.pop * 2 + colonyUsed(pl.col) * 3;
          }
          if (!hazir || deger <= 0) continue;
          /* Filo üstünlüğü var mı? */
          const guc = bastirilan[sysId];
          if (guc < (sy.def || 0) * .8) continue;
          const skor = deger + guc * .02 - (ordu.sys >= 0 ? dist(G.sys[ordu.sys], sy) * .04 : 0);
          if (skor > enIyi){ enIyi = skor; hedef = sy; }
        }
      }

      /* ── FAZ 24: ÖN MEVZİLENME (CEPHE EŞLEŞMESİ) ──
         Tanı şunu gösterdi: cephe (kendi filomun düşman gezegenli
         sistemde bulunması) 1800 imparatorluk-ayın yalnız 25'inde
         açıktı ve ordular o anda ana vatanda bekliyordu. Cephe
         kapanmadan yetişmek imkânsızdı.
         Çözüm: savaşta ordular ANA VATANDA değil, DÜŞMANA KOMŞU
         kendi sınır sistemimizde bekler. Cephe açıldığı anda
         1-2 sıçrama uzaktadırlar ve Hızlı İntikal devreye girer. */
      if (!hedef && savasta){
        let enIyi = -1, sinir = null;
        for (const sy of G.sys){
          if (sy.owner !== e.id) continue;
          /* Bu sistem düşman bölgesine komşu mu? */
          let komsuDusman = 0;
          for (const l of sy.lanes){
            const o2 = G.sys[l];
            if (!o2) continue;
            if (o2.owner >= 0 && o2.owner !== e.id && e.war[o2.owner]) komsuDusman++;
            /* Düşman gezegeni olan sistem daha değerli hedef */
            for (const pl of o2.planets)
              if (pl.col && pl.owner >= 0 && pl.owner !== e.id && e.war[pl.owner])
                komsuDusman += 2;
          }
          if (!komsuDusman) continue;
          let skor = komsuDusman * 30;
          /* Kendi savaş filomun yakınlığı — birlikte hareket */
          for (const f2 of G.fleets){
            if (f2.e !== e.id || !f2.ships.length || !isArmed(f2)) continue;
            const fs2 = f2.sys >= 0 ? f2.sys : (f2.mv ? f2.mv.to : -1);
            if (fs2 === sy.id) skor += 60;
            else if (fs2 >= 0 && sy.lanes.indexOf(fs2) >= 0) skor += 25;
          }
          /* Aynı sınıra iki ordu yığma */
          const zaten = G.fleets.some(f3 => f3 !== ordu && f3.e === e.id &&
            f3.sys === sy.id && isTransport(f3));
          if (zaten) skor *= .4;
          if (skor > enIyi){ enIyi = skor; sinir = sy; }
        }
        if (sinir) hedef = sinir;
      }

      /* ── SAVUNMA ──
         Hedef yoksa en değerli ya da en tehdit altındaki kolonide bekle. */
      if (!hedef){
        let enIyi = -1;
        for (const c of e.colonies){
          const sy = G.sys[c.s];
          const pl = sy && sy.planets[c.p];
          if (!pl || !pl.col) continue;
          let skor = pl.col.pop * 1.5 + colonyUsed(pl.col) * 2;
          if (e.home === sy.id) skor += 40;
          /* Tehdit altındaki sınır dünyaları öncelikli */
          if (typeof threatAt === 'function') skor += threatAt(e, sy.id) * .04;
          /* Aynı yere iki ordu yığma */
          const zaten = G.fleets.some(f => f !== ordu && f.e === e.id &&
            f.sys === sy.id && isTransport(f));
          if (zaten) skor *= .35;
          if (skor > enIyi){ enIyi = skor; hedef = sy; }
        }
      }

      if (hedef && hedef.id !== ordu.sys && typeof orderMove === 'function'){
        orderMove(ordu, hedef.id);
        ordu.ord = null;
      }
    }
  }
}


/* ═══════════════════════════════════════════════════════════════════
   FAZ 25 — AI COLOSSUS SEVKİ
   Süper silah kendi başına yol bulmaz: baş düşmanın en değerli
   gezegenine, kendi filosunun koruması altında gönderilir.
   Silahsız olduğu için yalnız gitmez.
   ═══════════════════════════════════════════════════════════════════ */
function aiColossusTick(){
  if (typeof isColossus !== 'function') return;
  for (const f of G.fleets){
    if (!f.ships || !f.ships.length || !isColossus(f)) continue;
    const e = G.emps[f.e];
    if (!e || e.dead || !e.ai) continue;
    if (f.mv || (f.path && f.path.length)) continue;

    /* Zaten hedefte ve şarj oluyorsa karışma */
    if (typeof colossusTarget === 'function' && colossusTarget(f)) continue;

    /* ═══ FAZ 31: HEDEF ARAMA DÜZELTMESİ ═══
       ÖLÇÜM: 4 Colossus izlendi, hepsi 99-466 ay boyunca DURGUN
       kaldı, hiçbirinin hedefi olmadı ("düşman gezegenli sistem: 0
       · savaşta: 1"). Sebep: o tek savaş KORSANLARLAydı — korsanın
       gezegeni yok, dolayısıyla hedef de yok. Üretim koşulu soğuk
       düşmanlığı kabul ediyordu ama sevk koşulu hâlâ sıcak savaş
       arıyordu; ikisi tutarsızdı.
       Artık hedef ararken de soğuk düşmanlık geçerli. */
    let hedef = null, enIyi = -1;
    for (const sy of G.sys){
      let deger = 0;
      for (const pl of sy.planets){
        if (!pl.col || pl.owner < 0 || pl.owner === e.id || pl.shattered) continue;
        const o2 = G.emps[pl.owner];
        if (!o2 || o2.wild) continue;                 // korsanın gezegeni yok zaten
        if (e.ally && e.ally[pl.owner]) continue;
        const dusman = e.war[pl.owner] ||
          (e.rel[pl.owner] || 0) < -40 ||
          (typeof grudgeOf === 'function' && grudgeOf(e, pl.owner) > 35);
        if (!dusman) continue;
        deger += pl.col.pop * 3 + colonyUsed(pl.col) * 2;
        if (e.war[pl.owner]) deger *= 1.5;            // sıcak savaş öncelikli
        if (e.colossusTarget !== undefined && pl.owner === e.colossusTarget) deger *= 1.8;
      }
      if (deger <= 0) continue;
      /* Koruma: filom orada olmasa da gidebilir — koruma filosu
         Colossus yola çıktıktan SONRA çağrılıyor (aşağıda).
         Sadece ezici bir savunmaya körlemesine dalmayı engelle. */
      let koruma = 0;
      for (const f2 of G.fleets){
        if (f2.e !== e.id || !f2.ships.length || !isArmed(f2)) continue;
        const fs2 = f2.sys >= 0 ? f2.sys : (f2.mv ? f2.mv.to : -1);
        if (fs2 === sy.id) koruma += fleetPower(f2);
      }
      /* Toplam filo gücüm savunmayı aşıyorsa yeter — hepsi orada
         olmak zorunda değil */
      if (koruma <= 0 && totalPower(e) < (sy.def || 0) * 1.2) continue;
      const skor = deger + koruma * .01 -
        (f.sys >= 0 ? dist(G.sys[f.sys], sy) * .05 : 0);
      if (skor > enIyi){ enIyi = skor; hedef = sy; }
    }

    if (hedef && hedef.id !== f.sys && typeof orderMove === 'function'){
      /* ═══ FAZ 31: KORUMA ÖNCE GİDER ═══
         ÖLÇÜM: Colossus hedefe vardığı anda yok oluyordu (ships:[]).
         Silahsız (dmg:0) olduğu için gezegen savunmasına tek başına
         dayanamıyor. Artık koruma filosu ÖNCE sevk ediliyor;
         Colossus ancak yeterli koruma yola çıktıktan sonra hareket
         eder. */
      /* ═══ FAZ 31 DÜZELTMESİ: KİLİTLENME ═══
         ÖLÇÜM: 1197 Colossus-ayın hepsinde hedef bulunuyordu ama
         Colossus 1-2 ay sonra duruyordu. Sebep: koruma filosu
         hedefe VARANA kadar korumaYolda sıfır kalıyor, Colossus
         "koruma yetersiz" diye sonsuza dek bekliyordu. Ama koruma
         da yolda olduğu için asla varamıyordu — çift kilit.
         Artık YOLDAKİ koruma da sayılıyor ve bir kez muhafız
         gönderildiyse Colossus onu takip eder. */
      let korumaYolda = 0;
      for (const g of G.fleets){
        if (g.e !== e.id || !g.ships.length || !isArmed(g)) continue;
        const gs = g.sys >= 0 ? g.sys : (g.mv ? g.mv.to : -1);
        if (gs === hedef.id) korumaYolda += fleetPower(g);   // varmış ya da yolda
      }
      const gerekli = (hedef.def || 0) * 1.3 + 300;
      /* ═══ FAZ 31 SON DÜZELTME ═══
         ÖLÇÜM: Colossus hedefe VARIYOR ama gemi sayısı sıfırlanıyor —
         gezegen savunması (sys.def) onu tek başına imha ediyor.
         Muhafız henüz yoldayken Colossus önden varıyordu çünkü
         sıçrama motoru onu ×3 hızlandırıyor, muhafız ise normal hızda.
         Çözüm: muhafızın VARMIŞ olması şart; yola çıkmış olması
         yetmez. Colossus asla önden gitmez. */
      let korumaVardi = 0;
      for (const g of G.fleets){
        if (g.e !== e.id || !g.ships.length || !isArmed(g)) continue;
        if (g.sys === hedef.id && !g.mv) korumaVardi += fleetPower(g);
      }

      /* SABIR SINIRI: muhafız 24 ay içinde varmazsa Colossus tek
         başına gider. Aksi hâlde tam simülasyonda muhafız başka
         cepheye çekilip Colossus sonsuza dek bekliyordu
         (ölçüm: kontrollü testte ateşliyor, 60 yıllık koşuda 0). */
      f.waitGuard = (f.waitGuard || 0) + 1;
      if (korumaVardi >= gerekli) f.waitGuard = 0;

      if (korumaVardi < gerekli && f.waitGuard < 24){
        /* Önce muhafız yolla, Colossus yerinde bekler */
        let en = null, enG = 0;
        for (const g of G.fleets){
          if (g.e !== e.id || !g.ships.length || !isArmed(g) || g.combat) continue;
          if (guardLocked(g)) continue;
          const gs = g.sys >= 0 ? g.sys : (g.mv ? g.mv.to : -1);
          if (gs === hedef.id) continue;
          const p2 = fleetPower(g);
          if (p2 > enG){ enG = p2; en = g; }
        }
        if (en){
          orderMove(en, hedef.id);
          en.ord = null;
          en.guardColossus = hedef.id;
        }
        f.jumpDrive = false;
        continue;                       // Colossus bu ay hareket etmez
      }

      orderMove(f, hedef.id);
      f.ord = null;
      /* SIÇRAMA MOTORU — Colossus hızı 1.1 (en yavaş gemi).
         Ateşleme emri alınca üç kat hızlanır. */
      f.jumpDrive = true;
    }
    if (!hedef) f.jumpDrive = false;
  }

  /* ═══ FAZ 29: COLOSSUS KORUMASI ═══
     Colossus silahsızdır (dmg:0) ve 6 ay şarj olurken savunmasız
     kalır. AI artık ana savaş filosunu onun yörüngesine çeker;
     aksi hâlde süper silah şarj bitmeden yok ediliyordu.
     ÖLÇÜM (Faz 28): 1 Colossus üretildi, 0 ateşleme. */
  for (const f of G.fleets){
    if (!f.ships || !f.ships.length || !isColossus(f)) continue;
    if (f.sys < 0 || f.mv) continue;                  // yolda değil, yerinde
    const e = G.emps[f.e];
    if (!e || e.dead || !e.ai) continue;
    /* Yalnızca gerçekten şarj oluyorsa koruma çağır */
    if (typeof colossusTarget !== 'function' || !colossusTarget(f)) continue;

    const hedefSys = f.sys;
    /* Orada ne kadar korumam var? */
    let mevcut = 0;
    for (const g of G.fleets){
      if (g.e !== e.id || !g.ships.length || !isArmed(g)) continue;
      const gs = g.sys >= 0 ? g.sys : (g.mv ? g.mv.to : -1);
      if (gs === hedefSys) mevcut += fleetPower(g);
    }
    const gerek = (G.sys[hedefSys].def || 0) * 1.4 + 400;
    if (mevcut >= gerek) continue;

    /* En güçlü boştaki filoyu çağır */
    let cagrilan = null, enGuc = 0;
    for (const g of G.fleets){
      if (g.e !== e.id || !g.ships.length || !isArmed(g)) continue;
      if (g.combat) continue;
      if (guardLocked(g)) continue;                   // başka Colossus'u koruyor
      const gs = g.sys >= 0 ? g.sys : (g.mv ? g.mv.to : -1);
      if (gs === hedefSys) continue;                  // zaten orada/gidiyor
      const p2 = fleetPower(g);
      if (p2 > enGuc){ enGuc = p2; cagrilan = g; }
    }
    if (cagrilan && typeof orderMove === 'function'){
      orderMove(cagrilan, hedefSys);
      cagrilan.ord = null;
      cagrilan.guardColossus = hedefSys;      // hangi sistemi koruyor
    }
  }
}


/* ═══════════════════════════════════════════════════════════════════
   FAZ 34 — AI SAHTE BAYRAK
   Koşul: elinde birbirine düşman EN AZ İKİ hedef olmalı ve
   ikisinden birine 2. seviye istihbaratı bulunmalı. Sinsi mizaçlar
   (İzolasyonist, Gölge Konseyi civic'i) daha sık dener.
   Nadir bir hamle: ayda %3 taban.
   ═══════════════════════════════════════════════════════════════════ */
function aiFalseFlagTick(){
  if (typeof falseFlagOp !== 'function' || typeof canFalseFlag !== 'function') return;
  for (const e of G.emps){
    if (e.dead || e.wild || e.crisisSide || !e.ai) continue;
    if ((e.res.etk || 0) < 260) continue;              // bütçe payı bırak
    if (e._ffCd && e._ffCd > (G.memAge || 0)) continue;

    const prof = aiProfile(e);
    const P = (typeof personaOf === 'function') ? personaOf(e) : null;
    const mz = P ? P.n : '';
    let sans = .03;
    if (mz === 'İzolasyonist') sans += .03;
    if (typeof hasCivic === 'function' && hasCivic(e, 'shadow')) sans += .05;
    if (prof.dip > .6) sans += .02;
    if (rnd() > sans) continue;

    /* Hedef: istihbaratımız olan bir düşman */
    const hedefler = G.emps.filter(o => !o.dead && !o.wild && !o.crisisSide &&
      o.id !== e.id && e.contact[o.id] &&
      (typeof intelOf === 'function' ? intelOf(e, o.id) : 0) >= 2 &&
      !(e.ally && e.ally[o.id]));
    if (!hedefler.length) continue;

    /* Günah keçisi: hedefin ZATEN nefret ettiği üçüncü devlet.
       İkisi birbirine ne kadar düşmansa iftira o kadar tutar. */
    let enIyi = null, enSkor = 0;
    for (const t of hedefler){
      for (const p2 of G.emps){
        if (p2.dead || p2.wild || p2.crisisSide) continue;
        if (p2.id === e.id || p2.id === t.id) continue;
        if (!e.contact[p2.id]) continue;
        if (e.ally && e.ally[p2.id]) continue;          // dostumuzu yakmayız
        const husumet = -(t.rel[p2.id] || 0);
        if (husumet < 25) continue;                     // inandırıcı değil
        /* İkisi de bize düşmansa birbirine düşürmek en kârlısı */
        const bizeDusman = ((e.rel[t.id] || 0) < -20 ? 1 : 0) +
                           ((e.rel[p2.id] || 0) < -20 ? 1 : 0);
        let skor = husumet + bizeDusman * 40;
        /* FAZ 38: İsyancı için zalim Koruyucu en cazip hedef */
        if (typeof inRebelAlliance === 'function' && inRebelAlliance(e) &&
            G.rebelAlliance && G.rebelAlliance.target === t.id) skor += 120;
        if (skor > enSkor){ enSkor = skor; enIyi = {t, p2}; }
      }
    }
    if (!enIyi) continue;

    e._ffCd = (G.memAge || 0) + 48;                     // 4 yıl bekleme
    const tur = rnd() < .5 ? 'tekno' : 'sabotaj';
    const r = falseFlagOp(e, enIyi.t, enIyi.p2, tur);
    if (r && r.ok && r.caught && G.p && !G.p.dead)
      say(e.name + ' sahte bayrak operasyonunda suçüstü yakalandı — PARYA', 'war');
  }
}


/* ═══════════════════════════════════════════════════════════════════
   FAZ 36 — AI TERRAFORM
   Zengin ve teknolojik bir AI ölü dünyaları diriltir. Ayrıca
   Uyuyan Kraliçe uyanırsa projesini filoyla KORUR — aksi hâlde
   milyonlarca kaynak boşa gider.
   ═══════════════════════════════════════════════════════════════════ */
function aiTerraformTick(){
  if (typeof startTerraform !== 'function') return;

  for (const e of G.emps){
    if (e.dead || e.wild || e.crisisSide || !e.ai) continue;

    /* ── 1. PROJE KORUMASI (öncelikli) ──
       Uyanmış bir kraliçe varsa filoyu oraya yolla. */
    for (const sy of G.sys){
      for (const pl of sy.planets){
        const tf = pl.terraform;
        if (!tf || tf.by !== e.id || !tf.woke) continue;
        /* Zaten koruma var mı? */
        let koruma = false;
        for (const g of G.fleets){
          if (g.e !== e.id || !g.ships.length) continue;
          const gs = g.sys >= 0 ? g.sys : (g.mv ? g.mv.to : -1);
          if (gs === sy.id && isArmed(g)){ koruma = true; break; }
        }
        if (koruma) continue;
        /* En güçlü boştaki filoyu gönder */
        let en = null, enG = 0;
        for (const g of G.fleets){
          if (g.e !== e.id || !g.ships.length || !isArmed(g) || g.combat) continue;
          if (g.guardLocked) continue;
          const p2 = fleetPower(g);
          if (p2 > enG){ enG = p2; en = g; }
        }
        if (en && typeof orderMove === 'function'){
          orderMove(en, sy.id);
          en.ord = null;
          en.guardTerraform = sy.id;
        }
      }
    }

    /* ── 2. YENİ PROJE ── */
    /* ═══ FAZ 41: TERRAFORM EŞİKLERİ GEVŞETİLDİ ═══
       ÖLÇÜM: 100 yıllık doğal koşuda 0 terraform yapıldı. Eşik
       5000/5000 idi ve kriz sonrası AI'lar bu seviyeye çıkamıyordu.
       Enkazı olan AI için eşik yarıya iniyor — yarasını sarmak
       lüks değil, öncelik. */
    if (!e.techs || !e.techs.m_gaia) continue;
    let enkazVar = 0;
    for (const sy of G.sys){
      if (sy.owner !== e.id) continue;
      for (const pl of sy.planets) if (pl.shattered && !pl.terraform) enkazVar++;
    }
    const esik = enkazVar >= 2 ? 2600 : 3800;
    if ((e.res.ala || 0) < esik || (e.res.min || 0) < esik) continue;
    /* Zaten bir proje sürüyorsa ikincisini başlatma */
    let sureyor = false;
    for (const sy of G.sys){
      for (const pl of sy.planets)
        if (pl.terraform && pl.terraform.by === e.id){ sureyor = true; break; }
      if (sureyor) break;
    }
    if (sureyor) continue;

    /* Sınırlarımdaki en değerli ölü dünyayı seç */
    let hedef = null, enIyi = -1;
    for (const sy of G.sys){
      if (sy.owner !== e.id) continue;
      for (const pl of sy.planets){
        if (!pl.shattered || pl.terraform) continue;
        /* Biyolojik enkaz önceliklidir (Sürü yarası) */
        let skor = (pl.devoured !== undefined) ? 60 : 40;
        skor += (pl.sz || 1) * 8;
        if (e.home === sy.id) skor += 30;
        if (skor > enIyi){ enIyi = skor; hedef = {sy, pl}; }
      }
    }
    if (!hedef) continue;
    const r = startTerraform(e, hedef.sy, hedef.pl);
    if (r && r.ok && G.p && !G.p.dead)
      say(e.name + ' ölü bir dünyayı diriltmeye başladı', 'sci');
  }
}


/* ═══════════════════════════════════════════════════════════════════
   FAZ 45 — AI HİMAYE TEKLİFİ
   Faz 44'te yalnız oyuncu kukla devletlerini vasallaştırabiliyordu.
   Artık AI da kendi kışkırtmasıyla doğan devlete himaye teklif
   ediyor — asimetri kapandı.
   ═══════════════════════════════════════════════════════════════════ */
function aiPatronageTick(){
  if (typeof canOfferPatronage !== 'function') return;
  const bedel = (typeof PATRONAGE_COST !== 'undefined') ? PATRONAGE_COST : 150;

  for (const e of G.emps){
    if (e.dead || e.wild || e.crisisSide || !e.ai) continue;
    /* Etki bütçesi: teklif sonrası elinde pay kalmalı */
    if ((e.res.etk || 0) < bedel * 1.5) continue;
    if (e._patronCd && e._patronCd > (G.memAge || 0)) continue;

    /* Kendi doğurduğu kuklalar */
    for (const k of G.emps){
      if (k.dead || k.wild || k.crisisSide) continue;
      if (k.founder !== e.id || k.id === e.id) continue;
      if (typeof isVassal === 'function' && isVassal(k)) continue;
      const chk = canOfferPatronage(e, k);
      if (!chk.ok) continue;
      /* İlişki yeterince iyi mi? Minnet solmuşsa zorlamaz. */
      if ((k.rel[e.id] || 0) < 35) continue;
      /* Kabul şansı düşükse etki boşa gitmesin */
      const sans = (typeof patronageChance === 'function') ? patronageChance(e, k) : .5;
      if (sans < .40) continue;

      const r = offerPatronage(e, k);
      e._patronCd = (G.memAge || 0) + 24;
      if (r && r.ok && G.p && !G.p.dead && r.kabul)
        say(e.name + ' · ' + k.name.slice(0, 24) + ' devletini himayesine aldı', 'sci');
      break;                                  // ayda bir teklif yeter
    }
  }
}

/* ═══════════════════════════════════════════════════════════════════
   FAZ 45 — SAVAŞ YARDIMI (SUBSIDIES)
   Kukla devlet eski ana gövdesiyle savaşırken hami her ay kasasına
   alaşım ve enerji aktarır. Hami kendi ihtiyacından fedakârlık
   eder — bedava değil.
   ═══════════════════════════════════════════════════════════════════ */
function warSubsidyTick(){
  for (const k of G.emps){
    if (k.dead || k.wild || k.crisisSide) continue;
    if (k.founder === undefined || k.founder === null) continue;
    const hami = G.emps[k.founder];
    if (!hami || hami.dead || hami.wild) continue;
    /* Kukla, ana gövdesiyle savaşta mı? (sundered = eski gövde) */
    const anaGovde = k.sundered;
    if (anaGovde === undefined || anaGovde === null) continue;
    if (!k.war[anaGovde]) continue;
    /* Hami de savaşta olmalı ya da en azından dost kalmalı */
    if (hami.war[k.id]) continue;

    /* Yardım: haminin stoğunun küçük bir dilimi, tavanlı */
    const ala = Math.min(40, Math.floor((hami.res.ala || 0) * .04));
    const ene = Math.min(60, Math.floor((hami.res.ene || 0) * .04));
    if (ala < 5 && ene < 5) continue;

    hami.res.ala = Math.max(0, (hami.res.ala || 0) - ala);
    hami.res.ene = Math.max(0, (hami.res.ene || 0) - ene);
    k.res.ala = (k.res.ala || 0) + ala;
    k.res.ene = (k.res.ene || 0) + ene;
    k._subsidyAt = G.memAge || 0;

    /* Minnet tazelenir */
    k.rel[hami.id] = clamp((k.rel[hami.id] || 0) + .6, -100, 100);

    if (hami.id === 0 && (G.memAge || 0) % 12 === 0)
      say('📦 SAVAŞ YARDIMI — ' + k.name.slice(0, 24) + ' devletine ' +
          ala + ' alaşım, ' + ene + ' enerji gönderildi', 'sci');
  }
}


/* ═══════════════════════════════════════════════════════════════════
   FAZ 49 — AI STATÜKO BARIŞI REFLEKSİ
   Faz 48'de statüko mekaniğini kurmuştum ama AI kendiliğinden
   teklif etmiyordu. Artık uzun ve yorucu savaşlarda masaya
   geliyor — özellikle elinde işgal toprağı varsa, çünkü statüko
   o toprakları kalıcı kılar (uti possidetis).
   ═══════════════════════════════════════════════════════════════════ */
function aiStatusQuoTick(){
  if (typeof canStatusQuo !== 'function' || typeof statusQuoPeace !== 'function') return;

  for (const e of G.emps){
    if (e.dead || e.wild || e.crisisSide || !e.ai) continue;
    if (e._sqCd && e._sqCd > (G.memAge || 0)) continue;

    for (const w in e.war){
      if (!e.war[w]) continue;
      const o = G.emps[w];
      if (!o || o.dead || o.wild || o.crisisSide) continue;

      const chk = canStatusQuo(e, o);
      if (!chk.ok) continue;

      /* ── KARAR ──
         İstek: kendi yorgunluğu + işgal kazancı − kaybı. */
      const benimExh = (e.exh && e.exh[o.id]) || 0;
      let istek = clamp((benimExh - 60) / 60, 0, 1) * .7;

      /* Fiili durumda ne kazanıp ne kaybediyorum? */
      let kazanc = 0, kayip = 0;
      if (typeof occupationMap === 'function'){
        for (const z of occupationMap(e, o)){
          if (z.yeni === e.id) kazanc++;
          else if (z.yeni === o.id) kayip++;
        }
      }
      istek += kazanc * .30;              // elimdekini mühürlemek cazip
      istek -= kayip * .35;               // kaybettiğimi kabullenmek zor

      /* Kazanan taraf savaşı sürdürmek ister */
      const gucOran = totalPower(e) / Math.max(1, totalPower(o));
      istek -= clamp((gucOran - 1) * .35, -.4, .5);

      /* Mizaç */
      const P = (typeof personaOf === 'function') ? personaOf(e) : null;
      if (P){
        if (P.n === 'Pasifist') istek += .35;
        else if (P.n === 'Tüccar') istek += .25;
        else if (P.n === 'Militarist') istek -= .30;
      }
      /* Başka cephede savaşıyorsa bir cepheyi kapatmak ister */
      let cephe = 0;
      for (const w2 in e.war) if (e.war[w2] && G.emps[w2] && !G.emps[w2].wild) cephe++;
      if (cephe >= 2) istek += .30;

      if (istek < .55) continue;

      /* Karşı taraf da kabul etmeli */
      let karsi = clamp((((o.exh && o.exh[e.id]) || 0) - 60) / 60, 0, 1) * .7;
      karsi -= clamp((totalPower(o) / Math.max(1, totalPower(e)) - 1) * .35, -.4, .5);
      if (o.id === 0){
        /* Oyuncuya teklif edilir — karar onun */
        if (typeof UI !== 'undefined' && UI.notify){
          e._sqCd = (G.memAge || 0) + 24;
          UI.notify({kind:'sqOffer', data:e.id, ico:'🤝', cls:'sci', pause:true,
            title:'STATÜKO BARIŞI TEKLİFİ', sub:e.name + ' sınırların donmasını öneriyor',
            key:'sq:' + e.id});
        }
        continue;
      }
      if (karsi < .40) continue;

      const r = statusQuoPeace(e, o);
      e._sqCd = (G.memAge || 0) + 24;
      o._sqCd = (G.memAge || 0) + 24;
      if (r && r.ok && G.p && !G.p.dead)
        say('🤝 ' + e.name.slice(0,18) + ' ile ' + o.name.slice(0,18) +
            ' STATÜKO barışı imzaladı — sınırlar donduruldu', 'sci');
      break;                              // ayda bir barış yeter
    }
  }
}


/* ═══════════════════════════════════════════════════════════════════
   FAZ 56 — İLERİ ÜS REFLEKSİ
   ÖLÇÜM (bu faz): AI zaten sahipsiz sistemlerde yapı kuruyor
   (35 sistemde 85 yapı) ve tedarik açığı neredeyse yok (2/84).
   Yani genel üs kurma davranışı vardı — EKSİK OLAN REAKTİF
   OLANIYDI: lojistik yüzünden bir hedeften vazgeçtiğinde O YÖNE
   doğru hattı ilerletme refleksi yoktu.
   Artık _blocked damgası okunuyor: engellenen hedefe giden yol
   üzerindeki ilk uygun sisteme karakol/tersane dikiliyor.
   ═══════════════════════════════════════════════════════════════════ */
function aiForwardBaseTick(){
  if (typeof startStruct !== 'function' || typeof fleetSupply !== 'function') return;

  for (const e of G.emps){
    if (e.dead || e.wild || e.crisisSide || !e.ai) continue;
    if (!e._blocked) continue;
    /* Damga bayatladıysa bırak */
    if ((G.memAge || 0) - e._blocked.at > 24){ delete e._blocked; continue; }
    /* Ayda bir deneme yeter */
    if (e._fwdCd && e._fwdCd > (G.memAge || 0)) continue;

    const hedefSys = G.sys[e._blocked.sys];
    if (!hedefSys){ delete e._blocked; continue; }

    /* Bütçe: karakol + tersane payı kalmalı */
    if ((e.res.min || 0) < 700) continue;

    /* Hedefe giden yol üzerinde, tedarik hattımızın UCUNDAKİ
       ilk uygun sistemi bul: dost sınıra ≤3 atlama, sahipsiz
       ya da bizim, üzerinde henüz yapı yok. */
    let aday = null, enIyi = 1e9;
    for (const sy of G.sys){
      if (sy.owner >= 0 && sy.owner !== e.id) continue;
      const mesafe = supplyDistance(e, {sys: sy.id, ships: [1], e: e.id});
      if (mesafe > 3) continue;                    // ulaşamayacağımız yer
      /* Zaten hattın içindeyse yeni üs bir şey kazandırmaz */
      if (mesafe === 0 && sy.owner === e.id) continue;
      const d = dist(sy, hedefSys);
      if (d < enIyi){ enIyi = d; aday = sy; }
    }
    if (!aday) continue;

    /* Ne kuralım? Sahipsizse önce hak iddiası, bizimse tersane. */
    let yapi = null;
    if (aday.owner < 0) yapi = 'karakol';
    else if (typeof hasStructYard === 'function' && !hasStructYard(aday)) yapi = 'tersane_h';
    else yapi = 'platform';

    if (typeof structAllowed === 'function' && !structAllowed(e, aday, yapi)) continue;
    if (typeof structCost === 'function'){
      const c = structCost(e, yapi);
      if (!Object.keys(c).every(r => (e.res[r] || 0) >= c[r] * 1.2)) continue;
    }

    const r = startStruct(e, aday, yapi);
    if (r !== false){
      e._fwdCd = (G.memAge || 0) + 12;
      e._fwdLast = {sys: aday.id, yapi, at: G.memAge || 0};
      if (G.p && !G.p.dead && G.p.contact && G.p.contact[e.id])
        say(e.name + ' sınırında ileri üs kuruyor: ' + aday.name, 'war');
    }
  }
}
