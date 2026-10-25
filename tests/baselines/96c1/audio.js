/* ═══════════════════════════════════════════════════════════════════
   YILDIZ HANEDANI · audio.js — İŞLEMSEL SES
   Hiçbir ses dosyası yok. Her şey Web Audio API ile matematiksel
   üretilir: ADSR zarfları, alçak geçiren filtreler ve yumuşak
   dalga biçimleriyle. Ham kare dalga kullanılmaz — kulak yorulmaz.

   YÜKLEME SIRASI: main.js'ten SONRA (storeSet/storeGet kullanır).
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

const AUDIO = (function(){

  let ctx = null;              // AudioContext (kullanıcı etkileşiminde doğar)
  let master = null;           // ana ses yolu
  let musicBus = null;         // müzik kanalı
  let sfxBus = null;           // efekt kanalı
  let convolver = null;        // yankı (prosedürel impulse)
  let started = false;
  let muted = false;
  let musicTimer = null;

  /* ── AYARLAR ── */
  /* FAZ 24: seviyeler 3 katına çıkarıldı. Tavan 1.0'ı aşmamalı
     (kırpılma/distorsiyon olur), bu yüzden master 0.95'te
     sınırlandı ve kanallar orantılı yükseltildi. */
  const VOL_MASTER = 0.95;      // 0.55 → ×1.73 (1.0 tavanı)
  const VOL_MUSIC  = 0.90;      // 0.30 → ×3.0
  const VOL_SFX    = 1.00;      // 0.42 → ×2.4
  /* Efektif kazanç master × kanal: müzik 0.86 (önce 0.165, ×5.2),
     efekt 0.95 (önce 0.231, ×4.1). Kulakta net yükselme. */

  /* ── MÜZİKAL ÖLÇEK ──
     C Dorian: uzay teması için melankolik ama umutsuz olmayan bir
     kip. Minör üçlü + majör altılı; ne fazla neşeli ne matem.
     Frekanslar iki oktava yayılır ki melodi tekdüze olmasın. */
  const SCALE = [
    130.81, 146.83, 155.56, 174.61, 196.00, 220.00, 233.08,   // C3 Dorian
    261.63, 293.66, 311.13, 349.23, 392.00, 440.00, 466.16,   // C4
    523.25, 587.33, 622.25                                     // C5 (üst uç)
  ];
  /* Pedal (dem) notaları — arka planda duran kök sesler */
  const DRONE = [65.41, 98.00];    // C2, G2

  /* ── YARDIMCILAR ── */
  function now(){ return ctx ? ctx.currentTime : 0; }

  /* Prosedürel yankı: rastgele gürültünün üstel sönümü.
     Dosya yok, iki saniyelik tampon matematikle doldurulur. */
  function makeImpulse(sn, decay){
    const rate = ctx.sampleRate;
    const len = Math.floor(rate * sn);
    const buf = ctx.createBuffer(2, len, rate);
    for (let ch = 0; ch < 2; ch++){
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++){
        /* Erken yansımalar seyrek, kuyruk yoğun — salon hissi */
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
      }
    }
    return buf;
  }

  function init(){
    if (ctx) return true;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    try { ctx = new AC(); } catch(e){ return false; }

    master = ctx.createGain();
    master.gain.value = muted ? 0 : VOL_MASTER;
    master.connect(ctx.destination);

    /* Yankı yolu — sesler hem kuru hem ıslak olarak karışır */
    convolver = ctx.createConvolver();
    convolver.buffer = makeImpulse(2.6, 2.4);
    const wet = ctx.createGain();
    wet.gain.value = 0.40;
    convolver.connect(wet);
    wet.connect(master);

    musicBus = ctx.createGain();
    musicBus.gain.value = VOL_MUSIC;
    musicBus.connect(master);
    musicBus.connect(convolver);

    sfxBus = ctx.createGain();
    sfxBus.gain.value = VOL_SFX;
    sfxBus.connect(master);
    sfxBus.connect(convolver);
    return true;
  }

  /* ═══════════════════════════════════════════════════════════════
     ÇEKİRDEK SENTEZLEYİCİ — ADSR + alçak geçiren filtre
     Her ses burada doğar. Sert başlangıç (click) olmaması için
     attack asla 0 değil; bitişte kuyruk bırakılır.
     ═══════════════════════════════════════════════════════════════ */
  function voice(o){
    if (!ctx || muted) return;
    const t0 = now() + (o.delay || 0);
    const wave = o.wave || 'sine';
    const freq = o.freq || 220;
    const A = o.a !== undefined ? o.a : 0.02;
    const D = o.d !== undefined ? o.d : 0.18;
    const S = o.s !== undefined ? o.s : 0.0;
    const R = o.r !== undefined ? o.r : 0.35;
    const hold = o.hold !== undefined ? o.hold : 0.05;
    /* FAZ 46: ses güçlendirmesi. VOL_MASTER zaten 0.95 tavanındaydı;
       asıl kısıtlama NOTA seviyesindeydi (varsayılan tepe .25 ve
       gain değerleri .05–.22). Tepe .34'e, tüm gain'ler ×1.55'e
       çıkarıldı (tavan .40 — kırpılma olmasın). */
    const peak = o.gain !== undefined ? o.gain : 0.34;
    const bus = o.bus || sfxBus;

    const osc = ctx.createOscillator();
    osc.type = wave;
    osc.frequency.setValueAtTime(freq, t0);
    if (o.glide) osc.frequency.exponentialRampToValueAtTime(
      Math.max(20, o.glide), t0 + A + D + hold);

    /* Alçak geçiren filtre: yüksek harmonikleri keser, ses yumuşar.
       Filtre de zarflanır — nota açılırken "nefes alır". */
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    const fc = o.cut || (freq * 4 + 400);
    lp.frequency.setValueAtTime(Math.max(180, fc * 0.55), t0);
    lp.frequency.linearRampToValueAtTime(Math.min(12000, fc), t0 + A + D * 0.6);
    lp.frequency.exponentialRampToValueAtTime(
      Math.max(180, fc * 0.35), t0 + A + D + hold + R);
    lp.Q.value = o.q !== undefined ? o.q : 0.7;

    /* ADSR kazanç zarfı */
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t0 + A);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak * (S || 0.28)),
                                        t0 + A + D);
    const relStart = t0 + A + D + hold;
    g.gain.setValueAtTime(Math.max(0.0002, peak * (S || 0.28)), relStart);
    g.gain.exponentialRampToValueAtTime(0.0001, relStart + R);

    osc.connect(lp); lp.connect(g); g.connect(bus);
    osc.start(t0);
    osc.stop(relStart + R + 0.05);

    /* Hafif detune ikinci osilatör — tek sinüs "ince" durur,
       ikilisi enstrüman gibi doluluk verir. */
    if (o.thick){
      const o2 = ctx.createOscillator();
      o2.type = wave;
      o2.frequency.setValueAtTime(freq * 1.0035, t0);
      const g2 = ctx.createGain();
      g2.gain.setValueAtTime(0.0001, t0);
      g2.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak * 0.55), t0 + A * 1.4);
      g2.gain.exponentialRampToValueAtTime(0.0001, relStart + R * 1.1);
      o2.connect(lp); g2.connect(bus); o2.connect(g2);
      o2.start(t0); o2.stop(relStart + R * 1.1 + 0.05);
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     ETKİLEŞİM SESLERİ
     Hepsi kısa, yumuşak ve düşük kazançlı. Tıklama sesi bir
     "uzay çanı": temel nota + oktav üstü kısa parıltı.
     ═══════════════════════════════════════════════════════════════ */
  const SFX = {
    /* Genel dokunuş — hafif ksilofon/çan */
    tap(){
      const f = SCALE[7 + Math.floor(Math.random() * 4)];
      voice({freq:f, wave:'sine', a:.006, d:.16, s:.0, r:.30, hold:0,
             gain:0.248, cut:f*5+900});
      voice({freq:f*2, wave:'sine', a:.004, d:.09, s:.0, r:.18, hold:0,
             gain:0.085, cut:f*7+1200, delay:.012});
    },
    /* Onay / başarı — yükselen üçlü */
    ok(){
      const b = SCALE[7];
      [0, 2, 4].forEach((s, i) =>
        voice({freq:SCALE[7 + s], wave:'sine', a:.008, d:.20, s:.10, r:.45,
               hold:.02, gain:0.217, delay:i * .075, cut:2600, thick:true}));
    },
    /* Hata / reddedilme — inen küçük ikili, sert değil */
    nope(){
      voice({freq:196.00, wave:'triangle', a:.010, d:.16, s:.06, r:.34,
             hold:.03, gain:0.202, cut:900, glide:174.61});
    },
    /* Olay penceresi — merak uyandıran yumuşak açılış */
    event(){
      voice({freq:SCALE[4], wave:'sine', a:.09, d:.35, s:.22, r:.90,
             hold:.15, gain:0.232, cut:1500, thick:true});
      voice({freq:SCALE[9], wave:'sine', a:.14, d:.40, s:.18, r:1.1,
             hold:.10, gain:0.155, cut:2200, delay:.16});
    },
    /* Savaş / kriz — tok, çello-brass arası uyarı. Gerilimli ama
       tırmalamıyor: triangle + ağır alçak geçiren + uzun release. */
    alarm(){
      voice({freq:98.00, wave:'triangle', a:.05, d:.45, s:.34, r:1.4,
             hold:.35, gain:0.341, cut:620, q:1.1, thick:true});
      voice({freq:146.83, wave:'triangle', a:.07, d:.50, s:.26, r:1.5,
             hold:.30, gain:0.232, cut:780, delay:.09, thick:true});
      /* Üstte çok hafif bir gerilim notası (minör ikili) */
      voice({freq:155.56, wave:'sine', a:.20, d:.60, s:.20, r:1.6,
             hold:.20, gain:0.116, cut:900, delay:.22});
    },
    /* Keşif / anomali — parıltılı, yukarı doğru */
    discover(){
      [0, 3, 5, 7].forEach((s, i) =>
        voice({freq:SCALE[7 + s], wave:'sine', a:.012, d:.22, s:.08, r:.55,
               hold:.02, gain:0.171, delay:i * .055, cut:3200}));
    },
    /* Zafer / büyük olumlu */
    win(){
      [0, 4, 7, 11].forEach((s, i) =>
        voice({freq:SCALE[Math.min(SCALE.length-1, 7 + s)], wave:'sine',
               a:.02, d:.30, s:.24, r:1.3, hold:.10, gain:0.232,
               delay:i * .12, cut:2800, thick:true}));
    }
  };

  /* ═══════════════════════════════════════════════════════════════
     ÜRETKEN AMBİYANS
     Brian Eno tarzı: sabit bir döngü YOK. Her nota rastgele
     seçiliyor ama üç kural kulağı koruyor:
       1. ARALIK KİLİDİ — ardışık notalar birbirinden en fazla
          4 derece uzak; melodi zıplamıyor, akıyor.
       2. SESLİLİK TAVANI — aynı anda en fazla 3 nota duyuluyor.
          Sayaç dolduysa yeni nota atlanıyor (üst üste binme yok).
       3. NEFES ARALIĞI — notalar arası 2.6–7.4 sn rastgele.
          Bazen tam sessizlik geliyor; kulak dinleniyor.
     ═══════════════════════════════════════════════════════════════ */
  let lastIdx = 7;
  const MAX_VOICES = 3;
  /* Aktif nota takibi ZAMANA dayalı, sayaca değil.
     Sayaç setTimeout ile azaltılıyordu; sekme arka plana alınıp
     zamanlayıcı kısıldığında sayaç takılı kalıyor ve müzik
     tamamen susuyordu. Artık bitiş anları saklanıyor ve geçmiş
     olanlar kendiliğinden ayıklanıyor — kendi kendini onarır. */
  let noteEnds = [];
  function activeVoices(){
    const t = now();
    noteEnds = noteEnds.filter(x => x > t);
    return noteEnds.length;
  }

  /* Pedal (dem) sesi de ses bütçesine dahildir. Eskiden sayıma
     girmiyordu ve nota + pedal üst üste binebiliyordu; uzun ömrü
     (19 sn) yüzünden bulanıklık yapabilirdi. */
  function droneOnce(){
    if (!ctx || muted) return;
    if (activeVoices() >= MAX_VOICES) return;
    const f = DRONE[Math.floor(Math.random() * DRONE.length)];
    const omur = 3.2 + 2.0 + 7.0 + 6.5;
    noteEnds.push(now() + omur);
    voice({freq:f, wave:'sine', a:3.2, d:2.0, s:.55, r:6.5, hold:7.0,
           gain:0.132, cut:340, bus:musicBus, thick:true});
  }

  function noteOnce(){
    if (!ctx || muted) return;
    if (activeVoices() >= MAX_VOICES) return;   // seslilik tavanı

    /* Aralık kilidi: son notadan en fazla ±4 derece */
    let step = Math.floor(Math.random() * 9) - 4;
    let idx = lastIdx + step;
    if (idx < 0) idx = Math.abs(idx);
    if (idx >= SCALE.length) idx = SCALE.length - 1 - (idx - SCALE.length + 1);
    idx = Math.max(0, Math.min(SCALE.length - 1, idx));
    lastIdx = idx;

    const f = SCALE[idx];
    /* Uzun attack + çok uzun release = notalar birbirine yumuşakça
       karışır, kesik kesik durmaz. */
    /* Ömür, ortalama nota aralığına (≈5 sn) yakın tutulur: notalar
       birbirine karışsın ama yığılmasın. Toplam ömür 4.6–9.4 sn. */
    const A = 0.7 + Math.random() * 1.3;
    const R = 2.4 + Math.random() * 3.4;
    const hold = 0.4 + Math.random() * 1.0;

    const omur = A + 1.2 + hold + R;
    noteEnds.push(now() + omur);
    voice({freq:f, wave:'sine', a:A, d:1.2, s:.42, r:R, hold:hold,
           gain:0.155 + Math.random() * .05, cut:f * 3 + 700,
           bus:musicBus, thick:Math.random() < .45});

    /* Ara sıra bir beşli eşlik — armoni hissi, ama %30 ihtimalle.
       Beşli uyumlu bir aralık; üst üste binse bile tırmalamaz. */
    if (Math.random() < .30 && activeVoices() < MAX_VOICES){
      const j = Math.min(SCALE.length - 1, idx + 4);
      const omur2 = A * 1.3 + 1.4 + hold + R * 1.1;
      noteEnds.push(now() + omur2);
      voice({freq:SCALE[j], wave:'sine', a:A * 1.3, d:1.4, s:.30, r:R * 1.1,
             hold:hold, gain:0.093, cut:SCALE[j] * 3 + 600,
             bus:musicBus, delay:.35 + Math.random() * .8});
    }
  }

  function scheduleNext(){
    if (musicTimer) clearTimeout(musicTimer);
    /* Nefes aralığı — bazen uzun sessizlik */
    const bekle = 2600 + Math.random() * 4800;
    musicTimer = setTimeout(() => {
      if (!muted && ctx && ctx.state === 'running'){
        noteOnce();
        if (Math.random() < .16) droneOnce();   // ara sıra pedal ses
      }
      scheduleNext();
    }, bekle);
  }

  /* ═══════════════════════════════════════════════════════════════
     DIŞ ARAYÜZ
     ═══════════════════════════════════════════════════════════════ */
  return {
    /* Tarayıcı politikası: yalnızca kullanıcı etkileşiminde çağrılır */
    start(){
      if (started) { this.resume(); return; }
      if (!init()) return;
      started = true;
      if (ctx.state === 'suspended') ctx.resume().catch(()=>{});
      droneOnce();
      scheduleNext();
    },
    resume(){
      if (ctx && ctx.state === 'suspended') ctx.resume().catch(()=>{});
    },
    suspend(){
      if (ctx && ctx.state === 'running') ctx.suspend().catch(()=>{});
      noteEnds = [];        // askıya alınca aktif nota kaydı sıfırlanır
    },
    isOn(){ return started && !muted; },
    isMuted(){ return muted; },
    setMuted(v){
      muted = !!v;
      if (master && ctx){
        const t = now();
        master.gain.cancelScheduledValues(t);
        master.gain.setValueAtTime(master.gain.value, t);
        master.gain.linearRampToValueAtTime(muted ? 0.0001 : VOL_MASTER, t + 0.25);
      }
      return muted;
    },
    toggle(){ return this.setMuted(!muted); },

    /* Efekt oynatıcı — bilinmeyen ad sessizce yutulur */
    play(name){
      if (!started || muted || !ctx) return;
      const f = SFX[name];
      if (f) { try { f(); } catch(e){} }
    },

    /* main.js say() içinden çağrılır: log sınıfına göre ses seçer */
    forLog(cls){
      if (cls === 'war') this.play('alarm');
      else if (cls === 'win') this.play('win');
      else if (cls === 'sci') this.play('discover');
    },
    SCALE, SFX
  };
})();
