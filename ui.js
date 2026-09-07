/* ═══════════════════════════════════════════════════════════════════
   STARS — ui.js
   FAZ 74: main.js 736 KB'a ulaşmıştı; arayüz katmanı buraya ayrıldı.

   İÇERİK: UI nesnesi (paneller, modallar, bildirimler, tüm
   data-a eylemleri), kurulum ekranı (renderSetup +
   setupClickHandler) ve açılış ekranı (TITLE).

   BAĞIMLILIK: main.js'teki veri tablolarını (RACES, SHIPS,
   PLANETS, PERSONAS…) ve G durumunu kullanır. Bu yüzden
   index.html'de main.js'ten SONRA yüklenir.
   Tüm bildirimler global kapsamda olduğu için modül sistemi
   gerekmiyor — fonksiyon hoisting sırayı esnetiyor, ama
   const/let bildirimleri sıra bağımlı olduğundan veri
   tabloları main.js'te bırakıldı.
   ═══════════════════════════════════════════════════════════════════ */

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
       <!-- FAZ 64: 🌌 arka plan ve ⚡ otomatik olay ikonları
            kaldırıldı — ikisi de Faz 62'de "KAYIT VE AYARLAR"
            penceresine taşınmıştı, burada tekrar duruyorlardı. -->
       <div class="toolSep"></div>
       <!-- ═══════════════════════════════════════════════════════
            FAZ 81 — TAKTİKSEL DİZİLİM
            Sıra artık kullanım sıklığına göre: zemin haritası
            (sürekli değişir) → paneller (ara sıra) → katmanlar
            (aç/kapa). Harita modları akordiyondan ÇIKARILDI ve
            doğrudan göründü — tek dokunuşla zemin değişiyor.
            ═══════════════════════════════════════════════════════ -->
       <!-- ═══ FAZ 82: TEK AKORDİYON ═══
            Beş görünüm modu (üç zemin + radar + lojistik) tek
            butonda toplandı. Sol bar dokuz düğmeden altıya indi. -->
       <div class="toolGrp" id="grpMap">
         <button class="tool grpHead" data-a="grpTog" data-x="map"
           title="Harita ve görünüm modları">🗺<i class="grpDot" id="mapDot">🌐</i></button>
         <div class="grpOut" id="outMap">
           <button class="tool mapMode" id="mm_siyasi" data-a="mapMode" data-x="siyasi"
             title="Devlet renkleri ve sınırlar">🌐<span>Siyasi</span></button>
           <button class="tool mapMode" id="mm_diplomasi" data-a="mapMode" data-x="diplomasi"
             title="Dost, düşman, tarafsız">🤝<span>Diplomatik</span></button>
           <button class="tool mapMode" id="mm_savas" data-a="mapMode" data-x="savas"
             title="Husumet ağı">🔥<span>Savaş</span></button>
           <button class="tool logiBtn" id="logiBtn" data-a="mapMode" data-x="askeri"
             title="İkmal hatları, menzil ve tedarik">⚓<span>Lojistik</span></button>
           <button class="tool radarBtn" id="radarBtn" data-a="radarTog"
             title="Filo hareketleri ve ralli hatları">🚀<span>Radar</span></button>
         </div>
       </div>

       <!-- AKORDİYON: DEVLET VE DİPLOMASİ -->
       <div class="toolGrp" id="grpEmp">
         <button class="tool grpHead" data-a="grpTog" data-x="emp"
           title="İmparatorluk">👑</button>
         <div class="grpOut" id="outEmp">
           <button class="tool" id="impBtn" data-a="globalPane" data-x="imp"
             title="Devlet">👑<span>Devlet</span></button>
           <button class="tool" id="bilimBtn" data-a="globalPane" data-x="bilim"
             title="Bilim">✦<span>Bilim</span></button>
           <button class="tool" data-a="diploPane" title="Diplomasi">🤝<span>Diplomasi</span></button>
           <button class="tool" data-a="tab" data-x="intel"
             title="İstihbarat">🕵<span>İstihbarat</span></button>
           <button class="tool" id="cncBtn" data-a="cncPane"
             title="Galaktik Konsey">🌐<span>Konsey</span></button>
           <button class="tool" id="fedBtn" data-a="fedPane"
             title="Federasyon">🏛<span>Federasyon</span></button>
           <button class="tool" data-a="marketPane"
             title="Galaktik Piyasa">💱<span>Piyasa</span></button>
         </div>
       </div>
`;
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
      /* FAZ 65: panel açılınca alt menü de kapansın */
      case 'marketPane':
        if (typeof closeAllGroups === 'function') closeAllGroups();
        this.openMarket(); break;
      case 'mktTrade': {
        const [sat, al, mik] = x.split(':');
        const r = (typeof marketTrade === 'function')
          ? marketTrade(G.p, sat, al, +mik) : {ok:false, why:'—'};
        if (!r.ok) say(r.why, 'war');
        this.openMarket();
        break;
      }
      case 'mktSel': {
        const [alan, deger] = x.split(':');
        this.mkt = this.mkt || {sat:'min', al:'ala', mik:200};
        this.mkt[alan] = (alan === 'mik') ? +deger : deger;
        if (this.mkt.sat === this.mkt.al)
          this.mkt.al = MARKET_RES.find(r => r !== this.mkt.sat);
        this.openMarket();
        break;
      }
      case 'diploPane':
        if (typeof closeAllGroups === 'function') closeAllGroups();
        this.openDiplo(); break;
      case 'globalPane':
        if (typeof closeAllGroups === 'function') closeAllGroups();
        this.openGlobal(x); break;
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
      case 'bombMode': {
        const [fid, kip] = x.split(':');
        const fl = G.fleets.find(q => q.id === +fid);
        if (fl){
          fl.bombMode = kip;
          say(kip === 'yikici'
            ? '💥 Yıkıcı bombardıman — tahkimat hızla erir, binalar yıkılır'
            : '🎯 Hassas vuruş — yavaş ama gezegen sağlam kalır',
            kip === 'yikici' ? 'war' : 'sci');
        }
        this.keepScroll = true; this.refresh();
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
      case 'radarTog': {
        RADAR_ON = !RADAR_ON;
        const rb = $('radarBtn');
        if (rb) rb.className = 'tool radarBtn' + (RADAR_ON ? ' on' : '');
        try { storeSet('yh_radar', RADAR_ON ? 'on' : 'off'); } catch(err){}
        say(RADAR_ON
          ? '🚀 Radar açık — filo hareketleri ve ralli hatları görünür'
          : '🚀 Radar kapalı');
        break;
      }
      case 'grpTog': {
        /* ═══ FAZ 64: ALT MENÜ AÇ/KAPA ═══
           Aynı anda tek grup açık kalır; ikinciye basınca ilki
           kapanır. Ekranı kapatmasın diye yana doğru açılıyor. */
        const hedef = x === 'map' ? 'outMap' : 'outEmp';
        const diger = x === 'map' ? 'outEmp' : 'outMap';
        const el2 = $(hedef), el3 = $(diger);
        const acik = el2 && el2.classList.contains('open');
        if (el3) el3.classList.remove('open');
        if (el2){
          el2.classList.toggle('open', !acik);
          /* ═══ FAZ 67: SABİT KONUM HESABI ═══
             Menü artık position:fixed (konteyner kırpmasından
             kaçmak için), bu yüzden konumu açılırken butonun
             gerçek ekran koordinatından hesaplanıyor. */
          if (!acik && el2.style){
            const btn = el2.parentElement &&
              el2.parentElement.querySelector('.grpHead');
            if (btn && btn.getBoundingClientRect){
              const r = btn.getBoundingClientRect();
              el2.style.left = (r.right + 6) + 'px';
              /* Ekran altına taşarsa yukarı kaydır */
              const yuk = el2.offsetHeight || 200;
              const ekran = window.innerHeight || 700;
              let ust = r.top;
              if (ust + yuk > ekran - 8) ust = Math.max(6, ekran - yuk - 8);
              el2.style.top = ust + 'px';
            }
          }
        }
        break;
      }
      case 'mapMode': {
        /* FAZ 81: lojistiğe ikinci basış onu kapatır */
        if (x === 'askeri' && MAP_MODE === 'askeri') x = 'siyasi';
        MAP_MODE = x;
        /* ═══ FAZ 81: LOJİSTİK ARTIK AYRI BUTONDA ═══
           Üç zemin modu üstte, lojistik en altta bağımsız duruyor.
           Aktif olan butonun kendisi işaretleniyor — rozete gerek
           kalmadı. Lojistik ikinci kez basılınca siyasiye döner
           (aç/kapa davranışı). */
        ['siyasi','diplomasi','savas'].forEach(k=>{
          const b = $('mm_' + k);
          if (b) b.className = 'tool mapMode' + (k === x ? ' on' : '');
        });
        const lb = $('logiBtn');
        if (lb) lb.className = 'tool logiBtn' + (x === 'askeri' ? ' on' : '');
        /* FAZ 82: akordiyon başlığındaki rozet aktif modu gösterir */
        const dot = $('mapDot');
        if (dot) dot.textContent = {siyasi:'🌐', diplomasi:'🤝',
                                    askeri:'⚓', savas:'🔥'}[x] || '🌐';
        /* FAZ 83: sınır dokusu ve bölge önbelleği hemen tazelensin */
        View.invalidateRenderCaches('mapMode');   // FAZ 83.1: merkezî
        if (typeof closeAllGroups === 'function') closeAllGroups();
        const ad = {siyasi:'Siyasi', diplomasi:'Diplomatik',
                    askeri:'Lojistik', savas:'Savaş'}[x] || x;
        /* FAZ 80: modun NE İŞE YARADIĞINI anlatan kısa toast */
        const aciklama = {
          siyasi   :'Kim nerede — devlet renkleri ve sınırlar',
          diplomasi:'Dost, düşman, tarafsız — bize göre duruş',
          askeri   :'İkmal hatları, menzil ve tedarik durumu',
          savas    :'Kim kiminle savaşıyor — husumet ağı'
        }[x] || '';
        if (typeof this.mapToast === 'function') this.mapToast(ad, aciklama);
        else say('🗺 ' + ad + ' harita modu');
        break;
      }
      case 'bgTog': {
        /* FAZ 62: ayarlar penceresi açıksa yenile */
        setTimeout(()=>{ if (!$('modal').className.includes('hidden') &&
          $('modal').innerHTML.includes('KAYIT VE AYARLAR')) this.saveMenu(); }, 0);
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
      case 'dirTog': {
        const [sid, pi] = x.split(':').map(Number);
        const sy = G.sys[sid], pl2 = sy && sy.planets[pi];
        if (pl2 && pl2.col){
          pl2.col.auto = !pl2.col.auto;
          delete pl2.col._dirWarn;
          say(pl2.col.auto
            ? '🏗 ' + (pl2.col.name || pl2.name) + ' otomatik inşa açıldı'
            : '⏹ ' + (pl2.col.name || pl2.name) + ' otomasyonu kapatıldı',
            pl2.col.auto ? 'win' : '');
        }
        this.keepScroll = true; this.refresh();
        break;
      }
      case 'tplSave': {
        saveTemplate().then(ad => {
          say('💾 "' + ad + '" şablonu kaydedildi');
          safeRenderSetup();
        });
        break;
      }
      case 'tplLoad': {
        const t = TEMPLATES.find(q => q && q._ad === x);
        if (t && applyTemplate(t)) say('📂 "' + x + '" şablonu yüklendi');
        else say('Şablon bulunamadı', 'war');
        safeRenderSetup();
        break;
      }
      case 'tplDel': {
        deleteTemplate(x).then(() => {
          say('Şablon silindi: ' + x);
          safeRenderSetup();
        });
        break;
      }
      case 'rallySysSet': {
        View.rallyForSys = +x;
        say('📍 Haritadan bir sistem seç — bu tersanenin ralli noktası olacak');
        this.keepScroll = true; this.refresh();
        break;
      }
      case 'rallySysCancel': {
        View.rallyForSys = undefined;
        this.keepScroll = true; this.refresh();
        break;
      }
      case 'rallySysClear': {
        const sy = G.sys[+x];
        if (sy && sy.rally) delete sy.rally[0];
        say('Ralli noktası kaldırıldı');
        this.keepScroll = true; this.refresh();
        break;
      }
      case 'loopSet': {
        const [sid, cls] = x.split(':');
        const sy = G.sys[+sid];
        if (sy){
          sy.loopBuild = cls;
          delete sy._loopWarn;
          say('🔁 ' + sy.name + ' sürekli ' + SHIPS[cls].n + ' üretecek', 'win');
        }
        this.keepScroll = true; this.refresh();
        break;
      }
      case 'loopOff': {
        const sy = G.sys[+x];
        if (sy){ delete sy.loopBuild; delete sy._loopWarn;
          say('⏹ ' + sy.name + ' üretim döngüsü durduruldu'); }
        this.keepScroll = true; this.refresh();
        break;
      }
      case 'ldrAssign': {
        const [lid, tip, hedef] = x.split(':');
        const r = assignLeader(G.p, +lid, tip,
          tip === 'amiral' ? +hedef : x.split(':').slice(2).join(':'));
        if (!r.ok) say(r.why, 'war');
        else say('👤 ' + r.leader.name + ' göreve başladı', 'win');
        this.keepScroll = true; this.refresh();
        break;
      }
      case 'ldrUnassign': {
        const L = leaderOf(G.p, +x);
        if (L){
          if (L.tip === 'amiral'){
            const f2 = G.fleets.find(q => q.id === L.post);
            if (f2) delete f2.leader;
          } else if (L.post !== undefined){
            const [si, pi2] = String(L.post).split(':').map(Number);
            const sy2 = G.sys[si], pl2 = sy2 && sy2.planets[pi2];
            if (pl2 && pl2.col) delete pl2.col.leader;
          }
          delete L.post;
          say('👤 ' + L.name + ' görevden alındı');
        }
        this.keepScroll = true; this.refresh();
        break;
      }
      case 'ldrHire': {
        /* ═══ FAZ 83: DONUK LİSTE ONARIMI ═══
           refresh() çağrılıyordu ama LİDERLER paneli bir GLOBAL
           kaplama (openGlobal) — sağ panel refresh'i onu
           tazelemiyordu. Açık kaplama varsa onu yeniden kur. */
        const r2 = recruitLeader(G.p, x);
        if (!r2.ok){ say(r2.why, 'war'); break; }
        this.keepScroll = true;
        /* LİDERLER paneli diploPane kaplamasında yaşıyor */
        const gp = $('diploPane');
        if (this.globalCur && gp && gp.classList.contains('show')){
          this.openGlobal(this.globalCur);      // kaplamayı tazele
        } else {
          this.refresh();
        }
        /* Yeni liderin portresi aynı karede boyansın */
        this.paintSprites();
        break;
      }
      case 'bmPick': { this.bmPick = +x; this.keepScroll = true; this.refresh(); break; }
      case 'bmCancel': { this.bmPick = null; this.keepScroll = true; this.refresh(); break; }
      case 'bmGo': {
        const [oid, lid] = x.split(':').map(Number);
        const r = blackmailLeader(G.p, G.emps[oid], lid);
        this.bmPick = null;
        if (!r.ok) say(r.why, 'war');
        else if (!r.basarili && !r.ifsa) say('Ajanlarımız belge bulamadı', 'war');
        this.keepScroll = true; this.refresh();
        break;
      }
      case 'fundSep': {
        const v = G.emps[+x];
        const r = fundSeparatists(G.p, v);
        if (!r.ok) say(r.why, 'war');
        this.keepScroll = true; this.refresh();
        break;
      }
      case 'mapFix': {
        /* Yalnız render onarımı — oyun durumuna dokunmaz.
           Çift dokunma korumalı: scheduleRecovery generation
           kullandığı için ikinci çağrı birinciyi iptal eder,
           iki ayrı döngü başlamaz. */
        /* ═══ FAZ 86C.4H-R1: KANONİK SIRA ═══
           ÖLÇÜLEN EKSİK: bu yol YALNIZ scheduleRecovery çağırıyordu.
           Görüntü geri geliyor ama takılı pointer / yarım pinch
           `pts` içinde kalıyordu — "harita göründü ama gezegene
           dokunulamıyor" tablosu buradan çıkıyordu.
           1) jest durumu TAM BİR KEZ sıfırlanır
           2) mevcut generation korumalı tek recovery planlanır
           3) mevcut bildirim ve modal davranışı korunur */
        if (typeof View !== 'undefined' && View.resetGesture)
          View.resetGesture();
        if (typeof scheduleRecovery === 'function')
          scheduleRecovery('manual', true);
        say('🔄 Harita yenileniyor…', 'sci');
        this.closeModal();
        break;
      }
      case 'diagShow': {
        /* FAZ 83: son 40 olay/hata — üretim ekranını kaplamaz */
        const D = (typeof DIAG !== 'undefined') ? DIAG : [];
        let dh = `<div class="mhd"><span>🩺 TANILAMA</span>
          <button class="riX" data-a="save">‹</button></div><div class="mbd">`;
        if (!D.length) dh += `<div class="lead">Kayıt yok — hiçbir hata
          veya kurtarma olayı görülmedi.</div>`;
        else {
          dh += `<div class="mini">Son ${D.length} olay (en yeni üstte):</div>
            <div class="dpList">`;
          for (let i = D.length - 1; i >= 0; i--){
            const d = D[i];
            const renk = d.tur === 'error' || d.tur === 'reject' ? '#ff5f6d'
                       : d.tur === 'ctx' ? '#ff9b3d' : '#7d90ad';
            dh += `<div class="dpRow">
              <span class="dpNm" style="font-size:10px;color:${renk}">${
                esc(d.tur)}</span>
              <span class="dpTags" style="font-size:9px">${esc(d.m)}</span></div>`;
          }
          dh += `</div>`;
        }
        /* FAZ 83.1: veri kaybetmeyen manuel kurtarma */
        dh += `</div><div class="mft">
          <button class="ch" data-a="mapFix">
            <div class="cht">🔄 HARİTAYI YENİLE</div>
            <div class="chd">Kayıt, gün ve kaynaklar korunur</div></button>
          <button class="ch" data-a="save">
            <div class="cht">Geri</div></button></div>`;
        this.openModal(dh, 'war', true);
        break;
      }
      case 'vsOpen': {
        /* FAZ 83: müzakereyi AÇ — hiçbir veri değişmez, zar atılmaz */
        const [oid, yon] = x.split(':');
        this.vs = {id: +oid, yon, tur: 'haracguzar', gonderildi: false};
        this.vsDraw();
        break;
      }
      case 'vsType': {
        if (this.vs){ this.vs.tur = x; this.vsDraw(); }
        break;
      }
      case 'vsCancel': {
        /* İPTAL: hiçbir kaynak, hiçbir diplomatik durum değişmez */
        this.vs = null;
        this.closeModal();
        break;
      }
      case 'vsSend': {
        if (!this.vs || this.vs.gonderildi) break;   // çift dokunma koruması
        this.vs.gonderildi = true;
        const o = G.emps[this.vs.id];
        const tur = this.vs.tur;
        const yon = this.vs.yon;
        this.vs = null;
        this.closeModal();
        let r;
        if (yon === 'demand'){
          r = demandVassal(G.p, o, tur);
          if (!r.ok) say(r.why, 'war');
          else if (r.kabul)
            this.eventArt('veri', 'BİAT KABUL EDİLDİ',
              o.name + ' boyun eğdi ve ' + VASSAL_TYPES[tur].n +
              ' oldu. Gelirinin %20\'si artık bize akıyor.', 'win', 'kritik', o);
          else
            this.eventArt('infaz', 'BİAT REDDEDİLDİ',
              o.name + ' teklifimizi geri çevirdi. Gurur kırıldı, ilişki ' +
              'bozuldu ve beş yıl boyunca bir daha soramayız.', 'war', 'kritik', o);
        } else {
          r = seekProtection(G.p, o, tur);
          if (!r.ok) say(r.why, 'war');
          else if (r.kabul)
            this.eventArt('veri', 'HİMAYE KABUL EDİLDİ',
              o.name + ' bizi kanatları altına aldı. Artık savunmakla ' +
              'yükümlü — ama gelirimizin bir kısmı ona akacak.', 'win', 'kritik', o);
          else
            this.eventArt('infaz', 'HİMAYE REDDEDİLDİ',
              o.name + ' talebimizi geri çevirdi. Bize harcanacak bir ' +
              'kalkan görmüyorlar.', 'war', 'kritik', o);
        }
        this.keepScroll = true; this.refresh();
        break;
      }
      case 'supIndep': {
        const o = G.emps[+x];
        const r = (typeof supportIndep === 'function')
          ? supportIndep(G.p, o) : {ok:false, why:'—'};
        if (!r.ok) say(r.why, 'war');
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
      /* ═══════════════════════════════════════════════════════
         FAZ 84A — TEK KANONİK 'incite'
         İki özdeş case vardı; JS switch'te yalnız İLKİ çalışır,
         ikincisi ölü koddu — ama doğru ifşa metnini ("KIŞKIRTMA
         İFŞA OLDU") o taşıyordu, çalışan blok yanlış metni
         ("MÜDAHALE") gösteriyordu. Tek blokta birleştirildi.

         BİLDİRİM TEKRARI: inciteRebellion() BAŞARIDA kendi
         ayrıntılı say() bildirimini üretiyor (istikrar düşüşü ve
         sayaç dahil). UI'nin ayrıca 'r.msg' basması aynı olayın
         ikinci kopyasıydı — kaldırıldı. Sessiz başarısızlıkta
         ve ifşada bildirimi UI üretiyor, çünkü motor orada
         susuyor. */
      case 'incite': {
        const o = G.emps[+x];
        const r = (typeof inciteRebellion === 'function')
          ? inciteRebellion(G.p, o) : {ok:false, why:'—'};
        if (!r.ok){
          say(r.why, 'war');                       // geçersiz işlem — tek mesaj
        } else if (r.caught){
          say('☠ ' + r.msg, 'war');
          this.eventArt('infaz', 'KIŞKIRTMA İFŞA OLDU', r.msg);
        } else if (!r.basarili){
          say('🔥 ' + r.msg, 'sci');               // sessiz başarısızlık
        }
        /* r.basarili → motor zaten bildirdi, ikinci kez basmıyoruz */
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
      case 'cncPane':
        if (typeof closeAllGroups === 'function') closeAllGroups(); this.openCouncil(); break;
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
      case 'dealBack': {
        /* FAZ 75: müzakereden çık ama diplomasi panelinde kal —
           ✕ her şeyi kapatıyordu, geri dönmek için baştan
           tıklamak gerekiyordu. */
        this.deal = null; this.dealMsg = '';
        this.openDiplo();
        break;
      }
      case 'mergeArmed': {
        /* FAZ 76: yalnız askeri filoları tek ID altında birleştir */
        const sid2 = +x;
        const sav2 = G.fleets.filter(q => q.e === 0 && q.sys === sid2 &&
                                          q.ships.length && isArmed(q));
        if (sav2.length < 2){ say('Birleşecek savaş filosu yok', 'war'); break; }
        const ana = sav2[0];
        let kac = 0;
        for (let i = 1; i < sav2.length; i++){
          ana.ships.push(...sav2[i].ships);
          if (sav2[i].ord && !ana.ord) ana.ord = sav2[i].ord;
          sav2[i].ships.length = 0;
          kac++;
        }
        G.fleets = G.fleets.filter(q => q.ships.length);
        View.sel = ana;
        say('⚑ ' + (kac+1) + ' savaş filosu birleşti — ' + esc(ana.name) +
            ' · ' + ana.ships.length + ' gemi', 'win');
        this.keepScroll = true; this.refresh();
        break;
      }
      case 'aimSet': {
        /* FAZ 76: nişangah kipi — tek gemiye hedef seçtir */
        View.aimFleet = +x;
        const af = G.fleets.find(q => q.id === +x);
        say('🎯 Haritadan hedef seç — yalnız ' +
            (af ? esc(af.name || 'bu gemi') : 'bu gemi') + ' gidecek', 'sci');
        this.keepScroll = true; this.refresh();
        break;
      }
      case 'aimCancel': {
        View.aimFleet = undefined;
        this.keepScroll = true; this.refresh();
        break;
      }
      case 'throneBuild': {
        const sy = G.sys[+x];
        const r = (typeof rebuildThrone === 'function')
          ? rebuildThrone(G.p, sy) : {ok:false, why:'—'};
        if (!r.ok) say(r.why, 'war');
        this.keepScroll = true; this.refresh();
        break;
      }
      case 'sitPick': {
        const [key, ix] = x.split(':');
        const s2 = (G.sits || []).find(q => q.key === key);
        if (!s2){ say('Durum bulunamadı', 'war'); break; }
        const r = pickSituation(s2, +ix);
        if (!r.ok) say(r.why, 'war');
        this.keepScroll = true; this.refresh();
        break;
      }
      case 'memTog': {
        this.memOpen = (this.memOpen === x) ? null : x;   // FAZ 75
        this.keepScroll = true; this.refresh();
        break;
      }
      case 'spyOpen': {
        /* FAZ 75: sağ paneli İSTİHBARAT sekmesine geçir ve
           hedefi odak yap — ayrı pencere açmaya gerek yok. */
        /* ═══════════════════════════════════════════════════════
           FAZ 83 — KRİTİK: METOT EZİLMESİ ONARIMI
           `this.tab = 'intel'` satırı UI.tab METODUNU bir metinle
           eziyordu. Zincir: casusluk düğmesi sessizce ölüyor,
           İstihbarat açılmıyor, ve o oturumdaki SONRAKİ her
           this.tab(...) çağrısı "is not a function" ile
           patlıyordu — sekme değiştirmek, filo seçmek dahil.
           Beyaz ekran şikâyetlerinin bir kısmı buradan geliyordu.
           ═══════════════════════════════════════════════════════ */
        this.spyTarget = +x;
        /* FAZ 86A: casusluk düğmesinden gelindiğinde doğrudan
           OPERASYONLAR görünümü açılır. */
        this.intelView = 'operations';
        if (typeof closeAllGroups === 'function') closeAllGroups();
        const pane2 = $('diploPane');
        if (pane2) pane2.classList.remove('show');
        this.keepScroll = false;
        this.tab('intel');            // tab() kendi refresh'ini yapar
        break;
      }
      /* FAZ 86A: `_spyOpenEski` case'i KALDIRILDI — proje çapında
         (js + html) hiçbir data-a üreticisi veya çağrısı yoktu. */
      case 'closeDeal': $('diploPane').classList.remove('show'); this.deal = null; break;
      case 'dealAdd': this.dealAdd(x); break;
      case 'dealRm': this.dealRm(x); break;
      case 'dealPact': this.dealPact(x); break;
      case 'dealSend': this.dealSend(); break;
      /* FAZ 86B: karşı teklif kartı — orijinal teklif bozulmadı. */
      case 'ctrYes': {
        const c = this.dealCounter;
        if (!c) break;
        const q = (typeof dealQuote === 'function') ? dealQuote(c) : null;
        if (q && q.ok && executeDeal(c)) say('Anlaşma imzalandı', 'win');
        else say((q && q.reasons[0]) || 'Teklif artık geçerli değil', 'war');
        this.dealCounter = null; this.deal = null;
        $('diploPane').classList.remove('show');
        this.refresh();
        break;
      }
      case 'ctrNo': {
        const c = this.dealCounter;
        if (c){ const co = G.emps[c.from];
          if (co) co.rel[0] = clamp(co.rel[0] - 5, -100, 100); }
        this.dealCounter = null;
        this.drawDeal();
        break;
      }
      case 'ctrBack': this.drawDeal(); break;
      case 'closeMarket': $('diploPane').classList.remove('show'); break;
      case 'closeDiplo': $('diploPane').classList.remove('show'); break;
      case 'spy': {
        if (assignSpy(G.p, +x)) this.openDiplo();
        else say('Boşta casusun yok — birini geri çek');
        break;
      }
      /* FAZ 86A: opsMenu ikinci bir katalog ÜRETMEZ — kanonik komuta
         merkezine yönlendirir (aynı opsCatalog renderer'ı kullanılır). */
      case 'ops': {
        this.spyTarget = +x;
        this.intelView = 'operations';
        this.keepScroll = false;
        this.tab('intel');
        break;
      }
      case 'opDone': {
        this._opPending = null;
        this.intelView = 'operations';
        this.closeModal();
        this.keepScroll = false;
        this.refresh();
        break;
      }
      case 'intelView': {
        this.intelView = String(x);
        this.keepScroll = false;
        this.refresh();
        break;
      }
      case 'intelGroup': {
        /* Aynı anda yalnız bir grup açık kalır. */
        this.intelGroup = (this.intelGroup === String(x)) ? '' : String(x);
        this.keepScroll = true;
        this.refresh();
        break;
      }
      case 'spySel': {
        this.spyTarget = +x;
        this.intelView = 'operations';
        this.keepScroll = false;
        this.refresh();
        break;
      }
      /* ═══ FAZ 86A: ONAY → TEK ÇALIŞTIRMA → SONUÇ ═══
         Düğmeye dokunmak artık operasyonu DOĞRUDAN yürütmez. */
      case 'opAsk': {
        const [aid, akey] = String(x).split(':');
        this.opConfirm(+aid, akey);
        break;
      }
      case 'opGo': {
        const [gid, gkey] = String(x).split(':');
        this.opExecute(+gid, gkey);
        break;
      }
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
        /* FAZ 86A: geriye dönük uyumluluk — doğrudan yürütme yerine
           kanonik onay ekranına yönlendirilir. Tek dokunuş = tek onay. */
        const [id, key] = String(x).split(':');
        this.opConfirm(+id, key);
        break;
      }
      case 'envoy': {
        /* FAZ 75: elçi göndermek koca diplomasi ekranını AÇMASIN.
           Oyuncu haritadan hızlıca elçi yollayıp işine dönebilsin;
           panel zaten açıksa tazelenir. */
        const id = +x;
        const o2 = G.emps[id];
        if (assignEnvoy(G.p, id)){
          say('🎓 Elçi ' + (o2 ? o2.name : '') + ' sarayına gönderildi', 'sci');
          const pane = $('diploPane');
          if (pane && pane.classList.contains('show')) this.openDiplo();
        }
        else say('Boşta elçin yok — birini geri çek', 'war');
        this.keepScroll = true; this.refresh();
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
        sci.forEach(f => {
          f.auto = !allOn;
          /* ═══ FAZ 76: MANUELE GEÇİNCE ROTAYI DA DURDUR ═══
             Eskiden yalnız bayrak düşüyordu; gemi mevcut rotasını
             sürdürüp keşfe devam ediyordu. "Manuel" demek
             "kendi başına hiçbir yere gitme" demektir. */
          if (allOn){
            f.path = [];
            delete f.stalled; delete f._stallSaid;
            if (f.ord && f.ord.t !== 'kol') f.ord = null;
          }
        });
        say(allOn
          ? '🛰 ' + sci.length + ' bilim gemisi manuele alındı — rotaları durduruldu'
          : sci.length + ' bilim gemisi otomatik keşifte', 'sci');
        this.refresh(); break;
      }
      case 'autoex': {
        const f = G.fleets.find(fl => fl.id === +x);
        if (f){
          f.auto = !f.auto;
          if (!f.auto){ f.path = []; delete f.stalled; delete f._stallSaid; }
          say(f.auto ? esc(f.name) + ' otomatik keşfe geçti'
                     : esc(f.name) + ' manuel kontrole döndü — rotası durduruldu',
              f.auto?'sci':'');
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
        /* ═══ FAZ 63: UZUN BASIŞ BİLGİSİ GENİŞLETİLDİ ═══
           Artık gemi ve uzay yapısı kartları da bilgi veriyor.
           Anahtar "ship:kru" / "struct:kapi" biçiminde gelir. */
        if (x.indexOf(':') > 0){
          const [tur, key] = x.split(':');
          if (tur === 'ship' && SHIPS[key]){
            const S = SHIPS[key];
            const satir = (ad, v, renk) => v !== undefined && v !== 0
              ? `<div class="row"><span>${ad}</span><b${renk?` style="color:${renk}"`:''}>${v}</b></div>` : '';
            this.openModal(
              `<div class="mhd"><span>${esc(S.n)}</span></div>
               <div class="mbd">
                 ${satir('Gövde', S.hull)}
                 ${satir('Kalkan', S.sh)}
                 ${satir('Hasar', S.dmg, '#ff5f6d')}
                 ${satir('Hız', S.spd)}
                 ${satir('Kapasite yükü', S.cap)}
                 ${satir('Aylık bakım', S.up, '#ff9b3d')}
                 ${S.rol ? `<div class="row"><span>Rol</span><b>${esc(S.rol)}</b></div>` : ''}
                 <div class="ph">MALİYET</div>
                 ${Object.entries(S.cost||{}).map(([r,v])=>
                   `<div class="row"><span>${RES[r].n}</span><b>${v}</b></div>`).join('')}
               </div>
               <div class="mft"><button class="ch" data-a="closem">
                 <div class="cht">Kapat</div></button></div>`);
            break;
          }
          if (tur === 'struct' && STRUCTS[key]){
            const T = STRUCTS[key];
            this.openModal(
              `<div class="mhd"><span>${T.ico||''} ${esc(T.n)}</span></div>
               <div class="mbd"><div class="lead">${esc(T.d || '')}</div>
                 <div class="ph">MALİYET</div>
                 ${Object.entries(T.c||{}).map(([r,v])=>
                   `<div class="row"><span>${RES[r].n}</span><b>${v}</b></div>`).join('')}
                 <div class="row"><span>Süre</span><b>${T.ay} ay</b></div>
                 ${T.mega ? '<div class="mini" style="color:#ff9b3d">Megayapı — inşası galaksiye duyurulur.</div>' : ''}
               </div>
               <div class="mft"><button class="ch" data-a="closem">
                 <div class="cht">Kapat</div></button></div>`);
            break;
          }
        }
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
    /* ═══ FAZ 77E: DURUMLAR SEKMESİ ONARIMI ═══
       KÖK NEDEN: beyaz liste elle yazılmıştı ve Faz 77C'de eklenen
       'durum' sekmesi listede yoktu — sekmeye basıldığı an
       this.cur 'sistem'e geri düşüyordu, panel hiç değişmiyordu.
       Artık liste TABS'tan türetiliyor: yeni sekme eklenince
       burası kendiliğinden tanır. */
    if (!TABS.some(t => t.k === this.cur)) this.cur = 'sistem';
    const el = $('panel');
    const y = el.scrollTop;
    el.innerHTML = this['p_'+this.cur] ? this['p_'+this.cur]() : '';
    if (this.keepScroll) el.scrollTop = y;
    this.keepScroll = false;
    /* FAZ 82: panel her yenilendiğinde YENİ canvas'lar doğuyor;
       done bayrağı olmayanlar hemen boyanmalı yoksa siyah kalıyor. */
    this.paintSprites();
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

    /* ═══════════════════════════════════════════════════════════
       FAZ 62 — SAĞ PANELDE DİPLOMASİ
       Yabancı bir sisteme tıklandığında diplomasi penceresini
       açmaya gerek kalmadan siyasi durum ve ana eylemler burada.
       ═══════════════════════════════════════════════════════════ */
    if (owner && owner.id !== 0 && !owner.wild && !owner.crisisSide &&
        e.contact[owner.id] &&
        !(typeof isPurifier === 'function' && isPurifier(e))){   // FAZ 73
      const rel = Math.round(e.rel[owner.id] || 0);
      const war = !!e.war[owner.id], ally = !!(e.ally && e.ally[owner.id]);
      const rc = rel >= 40 ? '#65e08a' : rel >= 0 ? '#f2d452'
               : rel >= -40 ? '#ff9b3d' : '#ff5f6d';
      const P = (typeof personaOf === 'function') ? personaOf(owner) : null;
      h += `<div class="ph">🏛 ${esc(owner.name.slice(0,22))}</div>`;
      h += `<div class="row"><span>Durum</span>
        <b style="color:${war?'#ff5f6d':ally?'#65e08a':'#7d90ad'}">${
          war ? '⚔ SAVAŞTA' : ally ? '🤝 MÜTTEFİK' : 'barış'}</b></div>`;
      h += `<div class="row"><span>İlişki</span>
        <b style="color:${rc}">${rel>0?'+':''}${rel}</b></div>`;
      if (P) h += `<div class="row"><span>Mizaç</span><b>${esc(P.n)}</b></div>`;

      /* ═══ FAZ 71: IRK VE KİMLİK DETAYI ═══ */
      {
        const ph = (typeof physioOf === 'function') ? physioOf(owner) : null;
        const rc2 = RACES[owner.race];
        h += `<div class="faceOff" style="--fo:${
          war ? '#ff5f6d' : ally ? '#65e08a' : '#24354f'};
          grid-template-columns:auto 1fr">
          <canvas class="dpPort" width="96" height="96"
            data-lk="${owner.look||'humanoid'}" data-col="${owner.col}"
            data-pers="${typeof personaKey==='function'?personaKey(owner):'yayilmaci'}"
            data-mood="${war?-1:ally?1:0}"></canvas>
          <div style="text-align:left;font-family:var(--mono);font-size:10px;
            line-height:1.5;color:#9fb6cc">
            ${ph ? ph.ico + ' <b>' + esc(ph.n) + '</b><br>' : ''}
            ${rc2 ? '🏛 ' + esc(rc2.kisa || rc2.n) + '<br>' : ''}
            ${(function(){
              const et = owner.ethics || {};
              const p2 = [];
              for (const ax in ETHICS){
                const v = et[ax] || 0;
                if (!v) continue;
                const E2 = ETHICS[ax];
                p2.push((Math.abs(v) >= 2 ? 'Fanatik ' : '') +
                        (v > 0 ? E2.a : E2.b));
              }
              return p2.length ? '⚖ ' + p2.map(esc).join(' · ') : '⚖ Tarafsız';
            })()}
          </div></div>`;
      }
      const pOK = canPeace(e, owner), wOK = canDeclareWarOn(e, owner);
      h += `<div class="act2">`;
      if (war)
        h += `<button class="abtn ${pOK?'pri':'dis'}" data-a="peace"
          data-x="${owner.id}">🕊 BARIŞ${pOK?'<br><span style="font-size:9px">30 ◈</span>':''}</button>`;
      else
        h += `<button class="abtn ${wOK.ok?'dgr':'dis'}" data-a="war"
          data-x="${owner.id}">⚔ SAVAŞ İLAN ET${
            wOK.ok?'':'<br><span style="font-size:9px">KİLİTLİ</span>'}</button>`;
      h += `<button class="abtn" data-a="deal" data-x="${owner.id}">📜 MÜZAKERE</button>
        </div>`;

      /* ═══ FAZ 70: SAĞ PANELDE TAM DİPLOMASİ ═══
         Sol menüdeki ana pencerede yapılabilen her eylem burada
         da var — oyuncu haritadan çıkmadan tüm diplomasiyi
         yürütebilir. */
      const env = !!(e.envoy && e.envoy[owner.id]);
      const kap = (typeof envoyCap === 'function') ? envoyCap(e) : 0;
      const kul = (typeof envoysUsed === 'function') ? envoysUsed(e) : 0;
      const aOK = canAlly(e, owner);
      const foe = (typeof sharedFoe === 'function') ? sharedFoe(e, owner) : false;
      let aCost = hasCivic(e,'allyCheap') ? 55 : 90;
      if (foe) aCost = Math.round(aCost * .5);

      h += `<div class="act2">
        <button class="abtn ${env?'pri':''}" data-a="envoy" data-x="${owner.id}">
          ${env ? '🎓 ELÇİ ORADA' : '🎓 ELÇİ GÖNDER'}
          <br><span style="font-size:9px">${env ? 'geri çek' : kul + '/' + kap}</span></button>
        <button class="abtn" data-a="gift" data-x="${owner.id}">🎁 HEDİYE</button>
        </div>`;

      if (!ally && !war)
        h += `<div class="act2">
          <button class="abtn ${aOK?'pri':'dis'}" data-a="ally" data-x="${owner.id}">
            ⚑ İTTİFAK<br><span style="font-size:9px">${aOK ? aCost + ' ◈' +
              (foe ? ' · ortak düşman' : '') : 'KİLİTLİ'}</span></button>
          <button class="abtn" data-a="spyOpen" data-x="${owner.id}">🕵 CASUSLUK</button>
          </div>`;
      else
        h += `<div class="act2">
          <button class="abtn" data-a="spyOpen" data-x="${owner.id}">🕵 CASUSLUK</button>
          <button class="abtn" data-a="diploPane">🤝 TÜM DİPLOMASİ</button>
          </div>`;

      /* Aktif anlaşmalar — tek bakışta */
      const anlasma = [];
      if (e.pact && e.pact[owner.id]) anlasma.push('🕊 saldırmazlık');
      if (e.passage && e.passage[owner.id]) anlasma.push('🚪 açık sınır');
      if (e.visionFrom && e.visionFrom[owner.id]) anlasma.push('👁 sensör');
      if (e.spynet && e.spynet[owner.id]) anlasma.push('🕸 casusluk ağı');
      if (typeof findFed === 'function'){
        const f1 = findFed(e), f2 = findFed(owner);
        if (f1 && f2 && f1.id === f2.id) anlasma.push('🏛 federasyon');
      }
      if (typeof isVassal === 'function'){
        if (isVassal(owner) && owner.overlord === e.id) anlasma.push('⛓ vasalın');
        if (isVassal(e) && e.overlord === owner.id) anlasma.push('⛓ senyörün');
      }
      if (anlasma.length)
        h += `<div class="mini">Yürürlükte: ${anlasma.join(' · ')}</div>`;

      /* ═══ FAZ 78: BİAT VE HİMAYE ═══ */
      /* FAZ 83: bölüm artık koşul tutmasa da görünür — kilidin
         SEBEBİ öğretici bilgidir, gizlemek değil. */
      if (typeof canDemandVassal === 'function'){
        const dv = canDemandVassal(e, owner);
        const sp = canSeekProtection(e, owner);
        {
          h += `<div class="ph">⛓ SÜZERENLİK</div>`;
          /* ═══ FAZ 83: ÖNCE MÜZAKERE, SONRA TEKLİF ═══
             Butonlar artık hiçbir veriyi değiştirmiyor; yalnız
             müzakere penceresini açıyor. Kilitli durumlar da
             SEBEBİYLE gösteriliyor ki oyuncu neyin eksik
             olduğunu arayüzden öğrenebilsin. */
          h += `<div class="act2">
            <button class="abtn ${dv.ok?'pri':'dis'}" data-a="vsOpen"
              data-x="${owner.id}:demand">⛓ BİAT İSTE</button>
            <button class="abtn ${sp.ok?'pri':'dis'}" data-a="vsOpen"
              data-x="${owner.id}:seek">🛡 KORUMA TALEP ET</button>
          </div>`;
          if (!dv.ok) h += `<div class="mini" style="color:#ff9b3d">
            ⛓ ${esc(dv.why)}</div>`;
          if (!sp.ok) h += `<div class="mini" style="color:#ff9b3d">
            🛡 ${esc(sp.why)}</div>`;
        }
      }

      /* ═══ FAZ 72: BAĞIMSIZLIĞI DESTEKLE ═══ */
      if (typeof canSupportIndep === 'function'){
        const sc = canSupportIndep(e, owner);
        const zaten = owner.indepBackers && owner.indepBackers.indexOf(0) >= 0;
        if (sc.ok || zaten){
          const lord2 = (typeof overlordOf === 'function') ? overlordOf(owner) : null;
          h += `<div class="ph">🕯 BAĞIMSIZLIK</div>
            <div class="mini">${esc(owner.name.slice(0,20))},
            <b>${lord2 ? esc(lord2.name.slice(0,20)) : '—'}</b> devletinin vasalı.
            ${zaten
              ? 'Destek sözü verdin — isyan ederlerse yanlarında savaşa girersin.'
              : 'Gizli destek isyan cesaretlerini artırır. Ama patladığında ' +
                'savaşa girmek zorundasın.'}</div>`;
          if (!zaten)
            h += `<div class="act2"><button class="abtn dgr" data-a="supIndep"
              data-x="${owner.id}">🕯 BAĞIMSIZLIĞI DESTEKLE<br>
              <span style="font-size:9px">${typeof SUPPORT_COST !== 'undefined'
                ? SUPPORT_COST : 140} ◈</span></button></div>`;
          else
            h += `<div class="mini" style="color:#6ff2c8">✓ Destekçisin</div>`;
        }
      }

      /* Anıları: neden bu ilişki? */
      if (typeof topMemories === 'function'){
        const anilar = topMemories(e, owner.id, 2);
        if (anilar.length)
          h += `<div class="mini" style="color:#7d90ad">${anilar.map(m2 =>
            m2.txt + ' (' + (m2.v > 0 ? '+' : '') + m2.v + ')').join(' · ')}</div>`;
      }
      if (!wOK.ok && !war && wOK.why)
        h += `<div class="mini" style="color:#7d90ad">${esc(wOK.why)}</div>`;
    }

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

          /* ═══ FAZ 78B: VALİ ═══ */
          if (typeof leaderPool === 'function' && pl.owner === 0){
            const vali = leaderOf(e, pl.col.leader);
            h += `<div class="ph">👤 VALİ</div>`;
            if (vali){
              const TV = LEADER_TRAITS[vali.trait];
              h += `<div class="ldrRow">
                <canvas class="ldrPort" width="72" height="72"
                  data-ldr="${vali.seed}" data-lk="${vali.look}"
                  data-col="${vali.col}" data-rank="${vali.rank}"></canvas>
                <div class="ldrInfo"><b>${esc(vali.name)}</b>
                  <span>${TV.ico} ${esc(TV.n)} — ${esc(TV.d)}</span>
                  <span style="color:#7d90ad">rütbe ${vali.rank}/4</span>
                </div></div>
                <div class="act2"><button class="abtn" data-a="ldrUnassign"
                  data-x="${vali.id}">✕ GÖREVDEN AL</button></div>`;
            } else {
              const bosV = leaderPool(e).filter(L => L.tip === 'vali' && L.post === undefined);
              if (bosV.length){
                h += `<div class="act2">`;
                bosV.slice(0, 4).forEach(L => {
                  const T3 = LEADER_TRAITS[L.trait];
                  h += `<button class="abtn" data-a="ldrAssign"
                    data-x="${L.id}:vali:${s.id}:${pl.i}">${T3.ico}
                    ${esc(L.name.slice(0,14))}
                    <br><span style="font-size:9px">${esc(T3.d)}</span></button>`;
                });
                h += `</div>`;
              } else {
                h += `<div class="mini">Boşta vali yok.</div>`;
              }
            }
          }

          /* ═══ FAZ 61: YÖNELİM OTOMASYONU ═══ */
          /* FAZ 63: odak olmasa da anahtar görünür — oyuncu önce
             otomasyonu açıp sonra odak seçebilir. */
          if (typeof directiveStatus === 'function' && pl.owner === 0){
            const st = pl.col.auto ? directiveStatus(e, pl.col) : null;
            const renk = !pl.col.auto ? '#7d90ad'
                       : (st && st.dur) ? '#ff9b3d' : '#65e08a';
            h += `<div class="row"><span>🏗 Otomatik inşa</span>
              <b style="color:${renk}">${pl.col.auto
                ? (st && st.dur ? 'BEKLİYOR' : 'AKTİF') : 'kapalı'}</b></div>`;
            if (!pl.col.f)
              h += `<div class="mini" style="color:#ff9b3d">Önce bir odak seç —
                otomasyon o odağın bina planını uygular.</div>`;
            else if (pl.col.auto && st && st.dur)
              h += `<div class="mini" style="color:#ff9b3d">${esc(st.why)}</div>`;
            else if (pl.col.auto && st && st.bina)
              h += `<div class="mini">Sırada: <b>${esc(BUILDINGS[st.bina].n)}</b>
                — boş alan açıldıkça ${esc(FOCUS[pl.col.f] ? FOCUS[pl.col.f].n : '')}
                planı uygulanır.</div>`;
            else if (!pl.col.auto)
              h += `<div class="mini">Açarsan boş yapı alanları
                <b>${esc(FOCUS[pl.col.f] ? FOCUS[pl.col.f].n : 'odak')}</b> planına
                göre kendiliğinden dolar. Kaynak azalırsa duraklar.</div>`;
            h += `<div class="act2"><button class="abtn ${pl.col.auto?'':'pri'}"
              data-a="dirTog" data-x="${s.id}:${pl.i}">${
                pl.col.auto ? '⏹ OTOMASYONU KAPAT' : '🏗 OTOMATİK İNŞAYI AÇ'}
              </button></div>`;
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
            /* FAZ 62: 'i' butonu kaldırıldı — bilgi için binaya
               UZUN BAS (data-hold). Mobilde parmak yeri kazandırır
               ve yanlışlıkla bilgi açılması biter. */
            h += `<div class="bWrap" style="flex:1;min-width:66px">
              <button class="abtn ${full||!afford?'dis':''}" data-a="build" data-hold="${k}" data-x="${s.id}:${pl.i}:${k}" style="width:100%">` +
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
      /* ═══ FAZ 77D: TAHT GEMİSİ YENİDEN İNŞASI ═══
         Yalnız doktrin sahibiyse VE gemi yok edilmişse görünür. */
      if (typeof canRebuildThrone === 'function' &&
          hasCivic(e, 'throneship') && !throneShipOf(e)){
        const tc = canRebuildThrone(e, s);
        const bedel = Object.keys(THRONE_REBUILD).map(r =>
          THRONE_REBUILD[r] + ' ' + (RES[r] ? RES[r].n : r)).join(' · ');
        h += `<div class="ph">👑 TAHT GEMİSİ</div>`;
        h += `<div class="mini">Hanedanın yüzen başkenti enkazda.
          ${e.throneLost > 0
            ? '<b style="color:#ff5f6d">Felç: ' + e.throneLost +
              ' ay kaldı</b> — üretimin yarısı kayıp.'
            : 'Yeniden inşa edilebilir.'}</div>`;
        h += `<div class="act2"><button class="abtn ${tc.ok?'pri':'dis'}"
          data-a="throneBuild" data-x="${s.id}">👑 TAHT GEMİSİ İNŞA ET
          <br><span style="font-size:9px">${esc(bedel)}</span></button></div>`;
        if (!tc.ok)
          h += `<div class="mini" style="color:#ff9b3d">${esc(tc.why)}</div>`;
      }


      /* ═══════════════════════════════════════════════════════
         FAZ 67 — TERSANE RALLİ NOKTASI
         Ralli yalnız filo panelinden atanabiliyordu. Artık
         tersanenin kendi arayüzünde: bas, haritadan sistem seç,
         bu tersaneden çıkan tüm ASKERİ gemiler oraya gitsin.
         (Sivil gemiler Faz 62'deki kural gereği yerinde kalır.)
         ═══════════════════════════════════════════════════════ */
      if (s.owner === 0){
        const ral = s.rally && s.rally[0];
        const hedefSy = ral ? (ral.sys !== undefined ? G.sys[ral.sys] : null) : null;
        const hedefFl = ral && ral.fleet !== undefined
          ? G.fleets.find(q => q.id === ral.fleet && q.ships.length) : null;
        const bekliyor = View.rallyForSys === s.id;
        h += `<div class="ph">📍 RALLİ NOKTASI</div>`;
        if (bekliyor){
          h += `<div class="mini" style="color:#6ff2c8">Haritadan bir sistem seç —
            buradan çıkan askeri gemiler oraya gidecek.</div>
            <div class="act2"><button class="abtn" data-a="rallySysCancel">
              ✕ VAZGEÇ</button></div>`;
        } else if (ral){
          h += `<div class="row"><span>Hedef</span>
            <b style="color:#6ff2c8">${hedefFl ? esc(hedefFl.name || 'Filo')
              : hedefSy ? esc(hedefSy.name) : '—'}</b></div>
            <div class="mini">Yeni askeri gemiler otomatik olarak oraya intikal
              eder${hedefFl ? ' ve filoya katılır' : ''}.</div>
            <div class="act2">
              <button class="abtn" data-a="rallySysSet" data-x="${s.id}">
                📍 DEĞİŞTİR</button>
              <button class="abtn" data-a="rallySysClear" data-x="${s.id}">
                ✕ KALDIR</button></div>`;
        } else {
          h += `<div class="mini">Bu tersaneden çıkan askeri gemiler şu an
            yerinde bekliyor. Bir toplanma noktası belirlersen doğrudan
            cepheye gidebilirler.</div>
            <div class="act2"><button class="abtn pri" data-a="rallySysSet"
              data-x="${s.id}">📍 RALLİ NOKTASI SEÇ</button></div>`;
        }
      }


      if (s.queue.length){
        /* ═══ FAZ 60: SÜREKLİ ÜRETİM DÖNGÜSÜ ═══ */
        if (typeof loopBuildStatus === 'function' && s.owner === 0){
          const lb = s.loopBuild;
          const st = lb ? loopBuildStatus(e, s) : null;
          h += `<div class="ph">🔁 SÜREKLİ ÜRETİM</div>`;
          if (!lb){
            h += `<div class="mini">Bir gemi tipi seç — tersane kaynak
              yettiği sürece durmadan üretsin. Kasa
              ${typeof LOOP_ALA_FLOOR !== 'undefined' ? LOOP_ALA_FLOOR : 400}
              alaşımın altına inerse otomatik duraklar.</div>`;
            const uygun = Object.keys(SHIPS).filter(k =>
              !SHIPS[k].crisisOnly && (typeof shipUnlocked !== 'function' ||
              shipUnlocked(e, k)));
            h += `<div class="act2">`;
            uygun.slice(0, 6).forEach(k => {
              h += `<button class="abtn" data-a="loopSet" data-x="${s.id}:${k}">
                🔁 ${esc(SHIPS[k].n)}</button>`;
            });
            h += `</div>`;
          } else {
            const renk = st && st.dur ? '#ff9b3d' : '#65e08a';
            h += `<div class="box" style="border-color:${renk}">
              <div class="bt"><span>🔁 ${esc(SHIPS[lb] ? SHIPS[lb].n : lb)}</span>
                <span class="tag ${st && st.dur ? 'e' : 'p'}">${
                  st && st.dur ? 'DURAKLADI' : 'ÜRETİYOR'}</span></div>
              <div class="bd">${st && st.dur
                ? '<b style="color:#ff9b3d">' + esc(st.why) +
                  '</b> — kaynak toparlayınca kendiliğinden devam eder.'
                : 'Kuyruk boşaldıkça otomatik yenileniyor.'}</div>
              <div class="act2"><button class="abtn" data-a="loopOff"
                data-x="${s.id}">✕ DÖNGÜYÜ DURDUR</button></div></div>`;
          }
        }

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
        h += `<button class="abtn ${locked||!afford?'dis':''}" data-a="ship" data-hold="ship:${k}" data-x="${s.id}:${k}" title="${d.n}">${d.ab}<br>` +
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
      /* ═══════════════════════════════════════════════════════════
         FAZ 76 — SİSTEM FİLO LİSTESİ (ROSTER)
         Seçili filonun bulunduğu sistemde başka filolar da varsa
         hepsi üstte listelenir; tıklayarak aralarında geçilir.
         "Tümünü birleştir" yalnız ASKERİ filoları birleştirir —
         koloni/bilim gemileri sürüye karışmaz.
         ═══════════════════════════════════════════════════════════ */
      if (f.sys >= 0){
        const ayni = mine.filter(q => q.sys === f.sys && q.ships.length);
        if (ayni.length > 1){
          const sav = ayni.filter(q => isArmed(q));
          h += `<div class="ph">📋 ${esc(G.sys[f.sys].name)} · ${ayni.length} FİLO</div>`;
          h += `<div class="dpList">`;
          ayni.forEach(q => {
            const secili = q === f;
            const tur = isArmed(q) ? '⚔' :
                        fleetHasRole(q,'bilim') ? '🛰' :
                        q.ships.some(sh=>sh.c==='ins') ? '🔧' : '🚀';
            const st2 = fleetStatus(q);
            h += `<div class="dpRow" data-a="selfleet" data-x="${q.id}"
              style="cursor:pointer;${secili?'border-left:2px solid #6ff2c8':''}">
              <span class="dpNm">${tur} ${esc((q.name||'Filo').slice(0,18))}</span>
              <span class="dpTags" style="font-size:9px;color:#7d90ad">${
                q.ships.length} gemi · ${st2.t}</span>
              <b style="font-size:10px;color:${secili?'#6ff2c8':'#9fb6cc'}">${
                isArmed(q) ? fmt(fleetPower(q)) : '—'}</b></div>`;
          });
          h += `</div>`;
          if (sav.length > 1)
            h += `<div class="act2"><button class="abtn pri" data-a="mergeArmed"
              data-x="${f.sys}">⚑ ${sav.length} SAVAŞ FİLOSUNU BİRLEŞTİR</button></div>
              <div class="mini">Sivil gemiler (koloni, bilim, inşaat) birleşmez —
                kendi görevlerinde kalırlar.</div>`;
        }
      }
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

      /* ═══ FAZ 78B: AMİRAL ═══ */
      if (typeof leaderPool === 'function' && isArmed(f)){
        const amiral = leaderOf(e, f.leader);
        h += `<div class="ph">👤 AMİRAL</div>`;
        if (amiral){
          const T = LEADER_TRAITS[amiral.trait];
          h += `<div class="ldrRow">
            <canvas class="ldrPort" width="72" height="72"
              data-ldr="${amiral.seed}" data-lk="${amiral.look}"
              data-col="${amiral.col}" data-rank="${amiral.rank}"></canvas>
            <div class="ldrInfo">
              <b>${esc(amiral.name)}</b>
              <span>${T.ico} ${esc(T.n)} — ${esc(T.d)}</span>
              <span style="color:#7d90ad">rütbe ${amiral.rank}/4 ·
                ${amiral.xp} tecrübe</span>
              ${amiral.disgraced && amiral.disgraced > (G.memAge||0)
                ? '<span style="color:#ff5f6d">🎭 İFŞA OLMUŞ — birim %' +
                  Math.round(BLACKMAIL_PENALTY*100) + ' zayıf (' +
                  (amiral.disgraced - (G.memAge||0)) + ' ay)</span>' : ''}
            </div></div>
          <div class="act2"><button class="abtn" data-a="ldrUnassign"
            data-x="${amiral.id}">✕ GÖREVDEN AL</button></div>`;
        } else {
          const bos = leaderPool(e).filter(L => L.tip === 'amiral' && L.post === undefined);
          if (bos.length){
            h += `<div class="mini">Boştaki amiraller:</div><div class="act2">`;
            bos.slice(0, 4).forEach(L => {
              const T2 = LEADER_TRAITS[L.trait];
              h += `<button class="abtn" data-a="ldrAssign"
                data-x="${L.id}:amiral:${f.id}">${T2.ico} ${esc(L.name.slice(0,16))}
                <br><span style="font-size:9px">${esc(T2.d)}</span></button>`;
            });
            h += `</div>`;
          } else {
            h += `<div class="mini">Boşta amiral yok. Devlet panelinden
              yeni lider alabilirsin.</div>`;
          }
        }
      }

      /* ═══ FAZ 76: NİŞANGAH — TEKİL EMİR ═══
         Sivil gemiler (koloni/inşaat/bilim) için. Sürü halinde
         aynı hedefe gitmelerini engeller. */
      if (!isArmed(f)){
        const bekliyor = View.aimFleet === f.id;
        h += `<div class="ph">🎯 TEKİL EMİR</div>`;
        if (bekliyor){
          h += `<div class="mini" style="color:#6ff2c8">Haritadan bir sistem
            seç — yalnız <b>${esc(f.name || 'bu gemi')}</b> yola çıkacak.</div>
            <div class="act2"><button class="abtn" data-a="aimCancel">
              ✕ VAZGEÇ</button></div>`;
        } else {
          h += `<div class="mini">Bu gemiye tek başına hedef ver — diğer
            sivil gemiler yerinde kalır.</div>
            <div class="act2"><button class="abtn pri" data-a="aimSet"
              data-x="${f.id}">🎯 HEDEF SEÇ</button></div>`;
        }
      }

      /* ═══ FAZ 73: BOMBARDIMAN KİPİ ═══
         Yalnız düşman yörüngesindeki silahlı filoda görünür. */
      if (f.sys >= 0 && isArmed(f)){
        const bs = G.sys[f.sys];
        const dusman = bs && bs.owner >= 0 && bs.owner !== 0 &&
                       e.war[bs.owner] &&
                       bs.planets.some(pl2 => pl2.col);
        if (dusman){
          const kip = f.bombMode || 'hassas';
          const orbit = (typeof orbitDefenseAlive === 'function')
            ? orbitDefenseAlive(bs, bs.owner) : 0;
          h += `<div class="ph">💥 BOMBARDIMAN</div>`;
          if (orbit > 0){
            h += `<div class="mini" style="color:#ff9b3d">⚠ AŞAMA 1 —
              yörüngede hâlâ <b>${Math.round(orbit)}</b> savunma gücü var.
              Bombardıman ancak uzay temizlenince başlar.</div>`;
          } else {
            h += `<div class="mini">Yörünge senin. Gezegenin tahkimatını
              erit — sıfırlandığında işgal edilebilir.</div>`;
          }
          h += `<div class="act2">
            <button class="abtn ${kip==='hassas'?'pri':''}" data-a="bombMode"
              data-x="${f.id}:hassas">🎯 HASSAS VURUŞ
              <br><span style="font-size:9px">yavaş · bina güvende</span></button>
            <button class="abtn ${kip==='yikici'?'dgr':''}" data-a="bombMode"
              data-x="${f.id}:yikici">💥 YIKICI
              <br><span style="font-size:9px">2.4× hızlı · bina yıkar</span></button>
          </div>`;
          if (kip === 'yikici')
            h += `<div class="mini" style="color:#ff5f6d">Yıkıcı kip binaları
              yok eder ve gezegende kalıcı istikrar yarası bırakır —
              aldığında harabe devralırsın.</div>`;
        }
      }

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
    /* ═══ FAZ 73: ARINDIRICI KİLİDİ ═══ */
    if (typeof isPurifier === 'function' && isPurifier(e)){
      const pane = $('diploPane');
      pane.innerHTML = `<div class="dpBox">
        <div class="dpHd"><span>☣ DİPLOMASİ KAPALI</span>
          <button class="riX" data-a="closeDiplo">✕</button></div>
        <div class="dpBody">
          <div class="box" style="border-color:#8b7bff">
            <div class="bt"><span>Fanatik Arındırıcılar</span></div>
            <div class="bd">Doktrinin galakside başka hiçbir iradeyi
              tanımıyor. Elçi göndermez, anlaşma imzalamaz, masaya
              oturmazsın. Tek dilin filolarındır.<br><br>
              Karşılığında gemi hasarın ve atış hızın <b>%40</b> yüksek.</div></div>
          <div class="mini">Bu kilit doktrinin bir parçasıdır — sonradan
            açılmaz.</div>
        </div></div>`;
      pane.classList.add('show');
      return;
    }
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
            /* ═══ FAZ 66: KARŞILIKLI PORTRELER ═══
               Oyuncunun ve hedefin ırk portreleri karşı karşıya.
               Çerçeve rengi ilişki durumunu anlatır: kırmızı
               husumet, yeşil ittifak, sarı nötr. */
            const cRenk = war ? '#ff5f6d' : ally ? '#65e08a'
                        : rel >= 40 ? '#4fd8c4' : rel <= -40 ? '#ff9b3d' : '#f2d452';
            const durumYazi = war ? '⚔ SAVAŞ' : ally ? '🤝 İTTİFAK'
                        : rel >= 40 ? 'DOSTANE' : rel <= -40 ? 'GERGİN' : 'NÖTR';
            h += `<div class="faceOff" style="--fo:${cRenk}">
              <canvas class="dpPort foMe" width="96" height="96"
                data-lk="${e.look||'humanoid'}" data-col="${e.col}"
                data-pers="${typeof personaKey==='function'?personaKey(e):'yayilmaci'}"
                data-mood="${war?-1:ally?1:0}"></canvas>
              <div class="foMid">
                <b style="color:${cRenk}">${durumYazi}</b>
                <span class="foRel" style="color:${cRenk}">${rel>0?'+':''}${rel}</span>
              </div>
              <canvas class="dpPort foThem" width="96" height="96"
                data-lk="${o.look||'humanoid'}" data-col="${o.col}"
                data-pers="${typeof personaKey==='function'?personaKey(o):'yayilmaci'}"
                data-mood="${war?-1:ally?1:0}"></canvas>
            </div>`;
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
      /* FAZ 78B: lider portreleri — ART.cache sayesinde bir kez üretilir */
    [...document.querySelectorAll('canvas.ldrPort')].forEach(cv=>{
      if (cv.dataset.done) return;
      cv.dataset.done = 1;
      try {
        const g3 = cv.getContext('2d');
        g3.imageSmoothingEnabled = false;
        const spr3 = ART.leaderPortrait({
          seed: +cv.dataset.ldr, look: cv.dataset.lk,
          col: cv.dataset.col, rank: +(cv.dataset.rank || 0), scale: 3
        });
        const sc3 = Math.min(cv.width/spr3.width, cv.height/spr3.height) * .92;
        g3.clearRect(0, 0, cv.width, cv.height);
        g3.drawImage(spr3, (cv.width - spr3.width*sc3)/2,
          (cv.height - spr3.height*sc3)/2, spr3.width*sc3, spr3.height*sc3);
      } catch(err){}
    });

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
        /* FAZ 66: renk noktası yerine ırk portresi */
        h += `<div class="pchip"><canvas class="dpPort chipPort" width="64" height="64"
            data-lk="${o.look||'humanoid'}" data-col="${o.col}"
            data-pers="${typeof personaKey==='function'?personaKey(o):'yayilmaci'}"></canvas>
          <div class="pi"><div class="pn" style="color:${o.col}">${esc(o.name)}${m===0?' (sen)':''}</div>
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
  /* ═══ FAZ 77C: AKTİF DURUMLAR PANELİ ═══ */
  p_durum(){
    const e = G.p;
    const list = (G.sits || []).filter(s2 => s2.emp === 0);
    if (!list.length)
      return `<div class="empty">Şu an aktif bir durum yok.<br><br>
        <span class="mini">Durumlar galakside kendiliğinden doğar —
        bir keşif, bir anomali, bir ziyaretçi. Başladığında burada
        aşama aşama ilerler ve verdiğin kararlar kalıcı iz bırakır.</span></div>`;
    let h = '';
    for (const s2 of list){
      const S = SITUATIONS[s2.key];
      if (!S) continue;
      const asama = S.asama[s2.stage - 1];
      h += `<div class="ph">${S.ico} ${esc(S.n)}</div>`;
      h += `<div class="row"><span>Aşama</span>
        <b>${s2.stage} / ${S.asama.filter(a=>a.t!=='—').length}</b></div>`;
      /* İki sayaç — çubuklu */
      for (const k in S.say){
        const C = S.say[k];
        const v = Math.round(s2.say[k] || 0);
        const max = C.max || 100;
        const oran = Math.round(v / max * 100);
        const renk = oran > 75 ? '#ff5f6d' : oran > 45 ? '#ff9b3d' : '#6ff2c8';
        h += `<div class="row"><span>${C.ico} ${C.n}</span>
          <b style="color:${renk}">${v}/${max}</b></div>
          <div class="bar"><i style="width:${oran}%;background:${renk}"></i></div>`;
      }
      h += `<div class="mini" style="margin:6px 0">${esc(asama ? asama.t : '')}</div>`;
      /* Seçenekler */
      if (asama && asama.ops){
        asama.ops.forEach((opt, ix) => {
          const acik = sitOptionOpen(e, opt, s2);
          const bedel = (typeof sitCostText === 'function')
            ? sitCostText(e, opt)
            : (opt.c ? Object.keys(opt.c).map(r =>
                opt.c[r] + ' ' + (RES[r] ? RES[r].n : r)).join(', ') : '');
          h += `<div class="box" style="border-color:${acik?'#24354f':'#3a2530'}">
            <div class="bt"><span style="${acik?'':'opacity:.55'}">${esc(opt.t)}</span>
              ${bedel ? '<span class="tag b">' + esc(bedel) + '</span>' : ''}</div>
            <div class="bd" style="${acik?'':'opacity:.55'}">${esc(opt.d || '')}</div>`;
          if (acik)
            h += `<div class="act2"><button class="abtn pri" data-a="sitPick"
              data-x="${s2.key}:${ix}">SEÇ</button></div>`;
          else
            h += `<div class="mini" style="color:#ff9b3d">🔒 ${
              esc(sitOptionWhy(e, opt))}</div>`;
          h += `</div>`;
        });
      }
      if (s2.log && s2.log.length)
        h += `<div class="mini" style="color:#7d90ad">${s2.log.length}
          karar verildi · ${Math.round(s2.age)} aydır sürüyor</div>`;
    }
    return h;
  },
  /* ═══════════════════════════════════════════════════════════════
     FAZ 86A — İSTİHBARAT KOMUTA MERKEZİ
     ÖLÇÜM (önce): p_intel tek açılışta 655 satırlık kesintisiz akış,
     17 `ph` başlığı, hedefsiz 4.387 / hedefli 7.268 karakter. OPS
     kataloğu p_intel'de HİÇ çizilmiyordu (0 runop düğmesi); yalnız
     ayrı `opsMenu` modalinde ve TABAN maliyet/riskle gösteriliyordu.
     Şimdi üç görünüm var ve YALNIZ AKTİF görünüm render edilir —
     pasif görünümün HTML'i hiç üretilmez, CSS ile gizlenmez. */
  p_intel(){
    const V = this.intelView || 'networks';
    let h = this.intelNav();
    if (V === 'operations')  h += this.intelOperations();
    else if (V === 'files')  h += this.intelFiles();
    else                     h += this.intelNetworks();
    return h;
  },
  intelNav(){
    const V = this.intelView || 'networks';
    const b = (k, ico, ad) => `<button class="ivTab ${V===k?'on':''}"
      data-a="intelView" data-x="${k}">${ico}<span>${ad}</span></button>`;
    return `<div class="ivNav">${b('networks','🕸','AĞLAR')}` +
      `${b('operations','🎯','OPERASYONLAR')}` +
      `${b('files','📁','DOSYALAR')}</div>`;
  },
  intelNetworks(){
    const e = G.p;
    let h = '';
    const cap = (typeof spyCap === 'function') ? spyCap(e) : 0;
    const kul = (typeof spiesUsed === 'function') ? spiesUsed(e) : 0;
    h += `<div class="ph">🕸 CASUS KAPASİTESİ</div>`;
    h += `<div class="row"><span>Sahada</span>
      <b style="color:${kul>=cap?'#ff9b3d':'#65e08a'}">${kul} / ${cap}</b></div>`;
    /* Kararlı sayısal ID ile seçim — aynı adlı iki devlet karışmaz. */
    const tanidiklar = G.emps.filter(o => !o.dead && !o.wild &&
      o.id !== e.id && e.contact[o.id]);
    h += `<div class="ph">TEMAS KURULAN DEVLETLER (${tanidiklar.length})</div>`;
    if (!tanidiklar.length)
      h += `<div class="mini">Henüz kimseyle temas kurmadın.</div>`;
    for (const o of tanidiklar){
      const lv = (typeof intelOf === 'function') ? intelOf(e, o.id) : 0;
      const pr = (e.intelP && e.intelP[o.id]) || 0;
      const yuzde = Math.min(100, Math.round((pr % 12) / 12 * 100));
      const cs = !!(e.spy && e.spy[o.id]);
      const sec = (this.spyTarget === o.id);
      h += `<button class="ivRow ${sec?'on':''}" data-a="spySel" data-x="${o.id}">
        <div class="ivTop"><span style="color:${o.col}">${esc(o.name.slice(0,22))}</span>
          <b class="tag ${lv>=2?'p':'b'}">${'●'.repeat(lv)}${'○'.repeat(3-lv)}</b></div>
        <div class="ivSub">ilişki <b>${Math.round(e.rel[o.id]||0)}</b>
          · ${cs?'<b style="color:#6ff2c8">casus atandı</b>':'casus yok'}
          ${lv<3?`· sonraki seviye %${yuzde}`:'· <b>tam ağ</b>'}</div></button>`;
    }
    h += `<div class="mini">Bir devlete dokun: dosyası açılır ve OPERASYONLAR
      görünümünde hedef olur. Ağ seviyesi casus atayarak ve temasta kalarak
      yükselir.</div>`;
    h += this.intelDossier();
    h += this.intelAgents();
    return h;
  },
  intelOperations(){
    const e = G.p;
    let h = '';
    const id = this.spyTarget;
    const o  = (id !== undefined && id !== null) ? G.emps[id] : null;
    if (!o || o.dead || o.wild || !e.contact[o.id]){
      h += `<div class="ph">🎯 HEDEF SEÇİLMEDİ</div>`;
      h += `<div class="mini">Operasyon yürütmek için önce bir hedef seç.
        AĞLAR görünümünde temas kurduğun devletlerden birine dokun.</div>`;
      h += `<div class="act2"><button class="abtn pri" data-a="intelView"
        data-x="networks">🕸 AĞLAR GÖRÜNÜMÜNE GİT</button></div>`;
      return h;
    }
    const lvl = (typeof intelOf === 'function') ? intelOf(e, o.id) : 0;
    h += `<div class="ph">🎯 HEDEF: ${esc(o.name.slice(0,22))}</div>`;
    h += `<div class="row"><span>İstihbarat ağı</span>
      <b class="tag ${lvl>=2?'p':'b'}">${INTEL_LEVELS[lvl].n}</b></div>`;
    h += `<div class="mini">${INTEL_LEVELS[lvl].d}</div>`;
    h += this.opsCatalog(o.id);
    h += this.intelTechTheft();
    const GRP = this.intelGroup || '';
    const grp = (k, ico, ad, gov) => {
      let s = `<button class="ivGroup ${GRP===k?'on':''}" data-a="intelGroup"
        data-x="${k}">${ico} ${ad}<span>${GRP===k?'▾':'▸'}</span></button>`;
      if (GRP === k) s += `<div class="ivBody">${gov()}</div>`;
      return s;
    };
    h += `<div class="ph">ÖZEL OPERASYONLAR</div>`;
    h += grp('siyasi', '🏛', 'SİYASİ VE LOJİSTİK', () => this.intelSenate());
    h += grp('dogrudan', '🗡', 'DOĞRUDAN VE ÇOK HEDEFLİ',
             () => this.intelSpecialOps());
    if (!GRP) h += `<div class="mini">Bir grubu açmak için üstüne dokun.</div>`;
    return h;
  },
  /* ═══ TEK KANONİK OPS KATALOĞU ═══
     opsMenu ve OPERASYONLAR görünümü AYNI renderer'ı kullanır. Maliyet
     ve ifşa riski doğrudan opQuote'tan gelir; arayüz formül kopyalamaz. */
  opsCatalog(id){
    const e = G.p, o = G.emps[id];
    if (!o) return '';
    let h = `<div class="ph">DOĞRUDAN OPERASYONLAR</div>`;
    for (const k in OPS){
      const q = (typeof opQuote === 'function') ? opQuote(e, o, k) : null;
      if (!q || !q.op) continue;
      const cost = Object.keys(q.cost).map(r =>
        (RES[r] ? RES[r].ico : r) + q.cost[r]).join(' ');
      const kilit = q.ok ? '' : q.why;
      h += `<button class="ch ${q.ok?'':'dis'}"
        ${q.ok ? `data-a="opAsk" data-x="${id}:${k}"` : ''}>
        <div class="cht">${q.op.ico} ${q.op.n}
          <span style="float:right;color:#7d90ad">${cost}</span></div>
        <div class="chd">${q.op.d}<br>
          <span style="color:${q.lvlHave>=q.lvlNeed?'#65e08a':'#ff5f6d'}">Gereken:
            ${INTEL_LEVELS[q.lvlNeed].n}</span>
          · <span style="color:#ff9b3d">İfşa riski %${q.riskPct}</span>
          ${q.viable ? ' · ' + q.viableDesc : ''}
          ${kilit ? `<br><span style="color:#ff5f6d">🔒 ${esc(kilit)}</span>` : ''}
        </div></button>`;
    }
    return h;
  },
  /* ═══ DOSYALAR GÖRÜNÜMÜ ═══
     Sana yapılanlar ve senin yaptıkların AYRI. Fail bilinmiyorsa
     hiçbir ad veya kimlik SIZDIRILMAZ. */
  intelFiles(){
    const e = G.p, simdi = G.memAge || 0;
    let h = '';
    const gelen = (e.hitLog || []).slice().reverse();
    const giden = (e.opLog  || []).slice().reverse();
    const opAd  = k => (OPS[k] && OPS[k].n) || k;
    h += `<div class="ph">📁 SANA YAPILANLAR (${gelen.length})</div>`;
    if (!gelen.length) h += `<div class="mini">Kayıtlı bir saldırı yok.</div>`;
    for (const w of gelen.slice(0, 12)){
      const yas = Math.max(0, simdi - (w.t || 0));
      const durum = w.caught ? 'suçüstü yakalandı'
                  : (w.known ? 'sonradan çözüldü' : 'açık dosya');
      const renk  = w.known ? '#65e08a' : '#ff9b3d';
      const fail  = (w.known && G.emps[w.by])
                    ? esc(G.emps[w.by].name.slice(0,18)) : 'FAİL BİLİNMİYOR';
      h += `<div class="row"><span>${esc(opAd(w.k))}</span>
        <b style="color:${renk}">${fail}</b></div>`;
      h += `<div class="mini">${yas} ay önce · ${durum}${
        w.known ? '' : ' · ' + esc(typeof opVictimHint === 'function'
          ? opVictimHint(w.k) : 'gözlemlenebilir etki')}</div>`;
    }
    h += `<div class="ph">🕵 SENİN OPERASYONLARIN (${giden.length})</div>`;
    if (!giden.length) h += `<div class="mini">Henüz operasyon yürütmedin.</div>`;
    for (const w of giden.slice(0, 12)){
      const t = G.emps[w.o];
      h += `<div class="row"><span>${esc(opAd(w.k))}</span>
        <b style="color:${w.caught?'#ff5f6d':'#65e08a'}">${
          t ? esc(t.name.slice(0,18)) : '—'}</b></div>`;
      h += `<div class="mini">${Math.max(0, simdi - (w.t || 0))} ay önce · ${
        w.caught ? 'İFŞA OLDU' : 'temiz'}${
        w.actorSummary ? ' · ' + esc(String(w.actorSummary).slice(0,70)) : ''}</div>`;
    }
    h += this.intelFileTail();
    h += `<div class="act2"><button class="abtn" data-a="opLogMenu">
      📁 TAM İSTİHBARAT DOSYASI</button></div>`;
    return h;
  },
  intelDossier(){
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
            ${ch ? `<br><span style="color:#7d90ad">Özel sabotaj başarı olasılığı</span>
              <b style="color:#65e08a">%${Math.round(ch.basari*100)}</b>
              · ifşa <b style="color:#ff5f6d">%${Math.round(ch.ifsa*100)}</b>
              <br><span style="font-size:9px;color:#7d90ad">Bu oran YALNIZ tersane/
              lojistik gibi özel sabotaj yollarına aittir. 12 OPS operasyonunda
              etki kesindir; zar yalnız ifşa için atılır.</span>` : ''}
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
                /* FAZ 84A: akordiyon anahtarı artık ID — iki devlet
                   aynı ada sahip olabilir ve ad kullanılınca
                   grupları birbirine karışıyordu. Görünen metin
                   yine ad; kimlik ID. */
                kimId: kars.id, kim: kars.name, col: kars.col,
                v: m.v || 0, t: m.t || 0
              });
            }
          }
          /* En yeni ve en ağır 15 olay */
          olaylar.sort((a, b) => (b.t - a.t) || (Math.abs(b.v) - Math.abs(a.v)));
          const son = olaylar.slice(0, 15);
          if (son.length){
            h += `<div class="ph">📜 GİZLİ DİPLOMATİK GEÇMİŞ</div>`;
            /* ═══ FAZ 75: AKORDİYON GEÇMİŞ ═══
               15 satır birden panelde çok yer kaplıyordu. Artık
               devlet başına TEK ÖZET satırı; tıklayınca o devletle
               yaşananların detayı açılıyor. */
            const gruplar = {};
            son.forEach(x => {
              const gk = String(x.kimId);          // FAZ 84A: kararlı anahtar
              (gruplar[gk] || (gruplar[gk] = {col:x.col, ad:x.kim, olay:[], net:0}))
                .olay.push(x);
              gruplar[gk].net += x.v;
            });
            h += `<div class="dpList">`;
            for (const gk in gruplar){
              const G2 = gruplar[gk];
              const kim = G2.ad;
              const acikG = String(this.memOpen) === gk;
              const iyiG = G2.net > 0;
              const enAgir = G2.olay.slice().sort((a,b)=>Math.abs(b.v)-Math.abs(a.v))[0];
              h += `<div class="dpRow" data-a="memTog" data-x="${gk}"
                style="cursor:pointer">
                <span class="dpDot" style="background:${G2.col}"></span>
                <span class="dpNm">${esc(kim.slice(0,16))} — ${
                  esc(enAgir ? enAgir.ad : '')}${G2.olay.length > 1
                    ? ' <span style="opacity:.6">+' + (G2.olay.length-1) + '</span>' : ''}</span>
                <span class="dpTags" style="font-size:10px;color:#7d90ad">${acikG?'▾':'▸'}</span>
                <b style="color:${iyiG?'#65e08a':'#ff5f6d'}">${iyiG?'+':''}${Math.round(G2.net)}</b>
              </div>`;
              if (acikG){
                G2.olay.forEach(x => {
                  const iyi = x.v > 0;
                  const yas = Math.max(0, Math.round(((G.memAge || 0) - x.t) / 12));
                  h += `<div class="dpRow" style="padding-left:18px;opacity:.85">
                    <span class="dpNm" style="font-size:10px">${esc(x.ad)}</span>
                    <span class="dpTags" style="font-size:9px;color:#7d90ad">${
                      yas ? yas + 'y' : 'yeni'}</span>
                    <b style="color:${iyi?'#65e08a':'#ff5f6d'};font-size:10px">${
                      iyi?'+':''}${Math.round(x.v)}</b></div>`;
                });
              }
            }
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
            h += `</div>`;
            /* FAZ 84A: kaldırılan ikinci bloktan taşınan özet */
            h += `<div class="mini">En yakını
              <b>${esc(iliski[0].n.slice(0,18))}</b> (${iliski[0].v>0?'+':''}${
              iliski[0].v}), en uzağı
              <b>${esc(iliski[iliski.length-1].n.slice(0,18))}</b> (${
              iliski[iliski.length-1].v>0?'+':''}${iliski[iliski.length-1].v}).</div>`;
            h += `<div class="mini">Bu tablo yalnız 3. seviye ağla görünür —
              hedefin kiminle ne kadar yakın olduğunu bilmek, kimi ona karşı
              kışkırtabileceğini de söyler.</div>`;
          }
        } else {
            /* FAZ 84A: kaldırılan ikinci bloktan taşınan kilit
               açıklaması — seviye 2'de oyuncu neyin eksik
               olduğunu görsün. */
            h += `<div class="mini" style="color:#7d90ad">🔒 Net ilişki
              puanları 3. seviye ağ gerektirir.</div>`;
          }

        /* ═══ FAZ 84A: İKİNCİ GEÇMİŞ BLOĞU KALDIRILDI ═══
           Bu blok yukarıdaki akordiyonlu uygulamanın düz-liste
           kopyasıydı: aynı başlıklar iki kez basılıyordu.
           Kanonik yol akordiyonlu olan; bu bloğun tek özgün
           katkıları (en yakın/en uzak özeti ve seviye 3 kilit
           açıklaması) oraya taşındı. */
      } else this.spyTarget = null;
    }

    return h;
  },
  intelAgents(){
    const e = G.p;
    const simdi = G.memAge || 0;
    let h = '';
    /* FAZ 86A: bölme sınırının diğer tarafında kalan özet sayacı. */
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

    }

    return h;
  },
  /* ═══ FAZ 86B — GÖREV A ═══
     TEKNOLOJİ HIRSIZLIĞI, 86A'da yapısal olarak İSTİHBARAT AĞI
     bloğunun içinde kaldığı için AĞLAR görünümünde görünüyordu.
     Bir operasyon olduğu için OPERASYONLAR görünümüne taşındı.
     İKİNCİ render veya yürütme yolu OLUŞTURULMADI: blok aynen
     taşındı; `stealTech` action'ı ve mekaniği değişmedi. */
  intelTechTheft(){
    const e = G.p;
    let h = '';
    const tanidik = G.emps.filter(o => !o.dead && !o.wild &&
      o.id !== 0 && e.contact[o.id]);
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
    return h;
  },
  intelSenate(){
    const e = G.p;
    const simdi = G.memAge || 0;
    let h = '';
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
    return h;
  },
  intelSpecialOps(){
    const e = G.p;
    const simdi = G.memAge || 0;
    let h = '';
    /* FAZ 86A: bölme sınırının diğer tarafında kalan temas listesi. */
    const tanidik = G.emps.filter(o => !o.dead && !o.wild && o.id !== 0 && e.contact[o.id]);
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

    /* ═══ FAZ 79: LİDERE ŞANTAJ / İTİBAR SUİKASTI ═══ */
    if (typeof canBlackmailLeader === 'function'){
      h += `<div class="ph">🎭 İTİBAR SUİKASTI</div>`;
      h += `<div class="mini">Rakip komutanı öldürmezsin — itibarını
        bitirirsin. İfşa olmuş ama görevde kalan bir lider birimini
        <b>%${Math.round(BLACKMAIL_PENALTY*100)}</b> zayıflatır,
        ${BLACKMAIL_MONTHS} ay boyunca.
        (${Object.keys(BLACKMAIL_COST).map(r =>
          BLACKMAIL_COST[r] + ' ' + (RES[r] ? RES[r].n : r)).join(' · ')})</div>`;
      const adaylar = tanidik.filter(o => canBlackmailLeader(e, o).ok);
      if (!adaylar.length){
        const ilk = tanidik.length ? canBlackmailLeader(e, tanidik[0]) : null;
        h += `<div class="mini" style="color:#7d90ad">${
          ilk && ilk.why ? esc(ilk.why) : 'Uygun hedef yok'}</div>`;
      } else {
        adaylar.forEach(o => {
          const c2 = canBlackmailLeader(e, o);
          const secili = this.bmPick === o.id;
          h += `<div class="box">
            <div class="bt"><span style="color:${o.col}">${esc(o.name.slice(0,20))}</span>
              <span class="tag b">${c2.hedefler.length} lider</span></div>`;
          if (!secili){
            h += `<div class="act2"><button class="abtn dgr" data-a="bmPick"
              data-x="${o.id}">🎭 HEDEF SEÇ</button></div>`;
          } else {
            h += `<div class="mini">Kimi ifşa edelim?</div><div class="act2">`;
            c2.hedefler.slice(0, 6).forEach(L => {
              const T = LEADER_TRAITS[L.trait];
              h += `<button class="abtn dgr" data-a="bmGo" data-x="${o.id}:${L.id}">
                ${T.ico} ${esc(L.name.slice(0,14))}
                <br><span style="font-size:9px">${L.tip} · R${L.rank}</span></button>`;
            });
            h += `</div><div class="act2"><button class="abtn"
              data-a="bmCancel">✕ VAZGEÇ</button></div>`;
          }
          h += `</div>`;
        });
      }
    }

    /* ═══ FAZ 78: AYRILIKÇILARI FONLA ═══
       Rakibin vasalını hedef alır: sadakati aşındırır, sıfırlanınca
       vasal kendiliğinden bağımsızlık savaşı başlatır. */
    if (typeof canFundSeparatists === 'function'){
      const vasallar = G.emps.filter(o => !o.dead && !o.wild && !o.crisisSide &&
        typeof isVassal === 'function' && isVassal(o) && o.overlord !== 0 &&
        e.contact[o.id]);
      h += `<div class="ph">🕯 AYRILIKÇILARI FONLA</div>`;
      h += `<div class="mini">Rakibinin vasalına gizlice para akıt.
        Sadakati sıfırlanırsa isyan eder ve senyörüne savaş açar —
        sen hiç savaşa girmeden arkasını yakarsın.
        (${Object.keys(FUND_SEP_COST).map(r =>
          FUND_SEP_COST[r] + ' ' + (RES[r] ? RES[r].n : r)).join(' · ')})</div>`;
      if (!vasallar.length){
        h += `<div class="mini" style="color:#7d90ad">Tanıdığın devletlerin
          vasalı yok.</div>`;
      } else {
        vasallar.forEach(v => {
          const chk = canFundSeparatists(e, v);
          const lord2 = overlordOf(v);
          const sad = vassalLoyalty(v);
          const rc = sad > 60 ? '#65e08a' : sad > 30 ? '#f2d452' : '#ff5f6d';
          h += `<div class="box">
            <div class="bt"><span style="color:${v.col}">${esc(v.name.slice(0,20))}</span>
              <span class="tag b">${lord2 ? esc(lord2.name.slice(0,14)) : '—'} vasalı</span></div>
            <div class="bd">Sadakat: <b style="color:${rc}">${sad}</b>/100
              ${v.sepFunded ? ' · <span style="color:#ff9b3d">fonlanıyor (−' +
                Math.round(v.sepFunded) + ')</span>' : ''}</div>
            <div class="act2"><button class="abtn ${chk.ok?'dgr':'dis'}"
              data-a="fundSep" data-x="${v.id}">🕯 FONLA</button></div>
            ${chk.ok ? '' : '<div class="mini" style="color:#ff9b3d">' +
              esc(chk.why) + '</div>'}</div>`;
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
          körükle: istikrar −${INCITE_STAB_HIT},
          ayrılıkçı sayaç +${INCITE_SEED} ay · huzursuzluk ${INCITE_MONTHS} ay sürer.
          İfşa olursan konsey seni kınar ve savaş nedeni doğar.
          (${INCITE_COST} ◈)</div>`;
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

    /* ═══ FAZ 84A: İKİNCİ KIŞKIRT BLOĞU KALDIRILDI ═══
       Yukarıdaki blokla birebir aynıydı: aynı başlık, aynı
       hedef kartları, aynı butonlar iki kez basılıyordu. */

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

    return h;
  },
  intelFileTail(){
    const e = G.p;
    const simdi = G.memAge || 0;
    let h = '';
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
      <div class="dpHd">
        <button class="riX" data-a="dealBack"
          title="Diplomasiye dön" style="margin-right:6px">‹</button>
        <span>MÜZAKERE · ${esc(o.name)}</span>
        <button class="riX" data-a="closeDeal">✕</button></div>
      <div class="dpBody">`;

    h += `<div class="envRow"><span>KARŞI TARAFIN TUTUMU</span>
      <b style="color:${mood.c}">${mood.t}</b></div>`;
    // değer yeterli olsa bile taraflar sözünü tutamayabilir
    /* ═══ FAZ 86C.1: TEK DOĞRULUK KAYNAĞI ═══
       Eskiden iki bağımsız canDeliver boolean'ından genel uygulanabilirlik
       uyduruluyordu; ikisi de TRUE dönerken teklif aslında geçersiz
       olabiliyordu (ölçülen beş yanlış pozitif). Artık kanonik quote'un
       alanları kullanılır. */
    const qd = (typeof dealQuote === 'function')
      ? dealQuote({from:0, to:d.to, give:d.give, want:d.want,
                   born:d.born, expires:d.expires}) : null;
    const meCan   = !qd || qd.giveFail.length === 0;
    const themCan = !qd || qd.wantFail.length === 0;
    const deliverable = !!(qd && qd.ok);
    h += `<div class="envRow"><span>DENGE</span><b style="color:${(ev.net>=0&&deliverable)?'#65e08a':'#ff5f6d'}">
      ${ev.net >= 0 ? 'teklif yeterli (+' + Math.round(ev.net) + ')' : short + ' değer eksik'}</b></div>`;
    if (!deliverable){
      const bad = [];
      if (!meCan) bad.push('senin verdiklerini karşılayamıyorsun');
      if (!themCan) bad.push(esc(o.name) + ' istediklerini veremez (savaş açamaz, sistemi yok ya da anlaşma kilitli)');
      /* Teslim dışı geçersizlikler (maliyet, ömür, redundant, plan) */
      if (qd && !qd.ok && meCan && themCan)
        for (const r of (qd.reasons || []).slice(0, 3)) bad.push(esc(r));
      if (qd && qd.expired) bad.push('teklifin süresi doldu');
      if (qd && !qd.affordable) bad.push('imzalama Etkisi yetersiz');
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
    /* FAZ 86B: `spynet` DEAL_KINDS ve applyItems'ta vardı ama hiçbir
       UI veya AI üreticisi yoktu — tamamen erişilemezdi. Masaya eklendi. */
    const pactBtns = [['peace','🕊 Barış'],['nap','🛡 Saldırmazlık'],
                      ['pact','🤝 Ticaret'],['ally','⚑ İttifak'],
                      ['spynet','🕸 Casusluk ağı']];
    const kilitNeden = {};
    for (const [k, lbl] of pactBtns){
      const inGive = d.give.some(x=>x.t===k), inWant = d.want.some(x=>x.t===k);
      /* Kilitliyse KAYBOLMAZ; nedeni aşağıda yazılır. */
      const dene = {from:0, to:d.to, give:[{t:k}], want:[]};
      const vv = (typeof dealValidity === 'function') ? dealValidity(dene) : null;
      const kilit = vv && !vv.ok ? (vv.reasons[0] || '') : '';
      if (kilit) kilitNeden[k] = kilit;
      h += `<button class="abtn ${(inGive||inWant)?'pri':(kilit?'dis':'')}"
        data-a="dealPact" data-x="${k}">${lbl}</button>`;
    }
    h += `</div><div class="mini">Simetrik antlaşmalar iki tarafı da bağlar ve
      teklifte TEK madde olarak durur.</div>`;
    for (const k in kilitNeden)
      h += `<div class="mini" style="color:#ff5f6d">🔒 ${
        DEAL_KINDS[k] ? DEAL_KINDS[k].n : k}: ${esc(kilitNeden[k])}</div>`;

    /* ═══ KANONİK ÖZET: geçerlilik + maliyet ═══
       UI formül KOPYALAMAZ; doğrudan dealQuote'tan okur. */
    const q = (typeof dealQuote === 'function')
      ? dealQuote({from:0, to:d.to, give:d.give, want:d.want}) : null;
    if (q){
      h += `<div class="ph">TEKLİF ÖZETİ</div>`;
      h += `<div class="row"><span>İmzalama maliyeti</span>
        <b style="color:${q.affordable?'#65e08a':'#ff5f6d'}">${q.cost} ◈</b></div>`;
      h += `<div class="mini">Maliyet YALNIZ imza gerçekleşirse ve teklifi
        GÖNDEREN taraftan (sen) tek kez düşer. Ret, iptal ve karşı teklifte
        Etki harcanmaz. Çok maddeli teklifte <b>en pahalı benzersiz
        antlaşma ücreti tam, diğerlerinin %25'i</b> eklenir; toplam en
        fazla <b>160 ◈</b>. Zaten yürürlükteki maddeler ücretlendirilmez.</div>`;
      /* ═══ FAZ 86C.1: normalizations / redundant / fatal AYRI ═══
         Eski `dropped` sunumu güvenli normalleştirmeyi kırmızı hata
         gibi gösteriyordu. Artık üç sınıf ayrı renk ve anlamda. */
      if (q.normalizations && q.normalizations.length)
        h += `<div class="mini" style="color:#7d90ad">✎ Düzenlendi: ${
          esc(q.normalizations.join(' · '))}</div>`;
      if (q.redundant && q.redundant.length)
        h += `<div class="mini" style="color:#ff9b3d">↺ Zaten yürürlükte
          (uygulanmayacak, ücretlendirilmeyecek): ${
          esc(q.redundant.join(' · '))}</div>`;
      if (q.fatal && q.fatal.length)
        h += `<div class="mini" style="color:#ff5f6d">⛔ ${
          esc(q.fatal.join(' · '))}</div>`;
      if (!q.ok) for (const r of q.reasons.slice(0,4))
        h += `<div class="mini" style="color:#ff5f6d">🔒 ${esc(r)}</div>`;
    }
    /* ═══ KARŞI TEKLİF KARTI ═══
       AI'nın orijinal teklifi BOZULMADAN ayrı kartta durur. */
    if (this.dealCounter){
      const co = G.emps[this.dealCounter.from];
      h += `<div class="ph">📜 ${esc(co ? co.name : '')} TEKLİFİ (saklandı)</div>`;
      h += `<div class="mini">${
        (this.dealCounter.give || []).map(dealLabel).join(', ') || '—'} →
        sana · sen → ${
        (this.dealCounter.want || []).map(dealLabel).join(', ') || '—'}</div>`;
      h += `<div class="act2">
        <button class="abtn pri" data-a="ctrYes">✔ Karşı teklifi kabul et</button>
        <button class="abtn" data-a="ctrNo">✕ Karşı teklifi reddet</button>
        <button class="abtn" data-a="ctrBack">↩ Düzenlemeye dön</button></div>`;
    }

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
    /* ═══ FAZ 86B: TEK KANONİK GÖNDERİM ═══
       Eskiden `karsi` yanıtında AI'nın istedikleri oyuncunun listesine
       SESSİZCE push ediliyordu (d.give.push) — oyuncunun teklifi
       kendiliğinden değişiyordu. Artık ayrı karşı teklif kartında
       gösterilir; orijinal liste bozulmaz. */
    const d = this.deal;
    if (!d) return;
    const e = G.p, o = G.emps[d.to];
    if (!o) return;
    const q = (typeof dealQuote === 'function') ? dealQuote(d) : null;
    if (!q || !q.ok){
      this.dealMsg = (q && q.reasons[0]) || 'Teklif geçersiz.';
      this.drawDeal(); return;
    }
    const r = aiRespond(o, q.norm);
    if (r.v === 'kabul'){
      if (executeDeal(q.norm)){
        $('diploPane').classList.remove('show');
        this.deal = null; this.dealCounter = null;
        say('ANLAŞMA İMZALANDI — ' + o.name, 'win');
        this.refresh();
        return;
      }
      this.dealMsg = 'Anlaşma uygulanamadı.';
      this.drawDeal(); return;
    }
    if (r.v === 'karsi'){
      /* AI'nın önerisi AYRI kartta; oyuncunun listesi DEĞİŞMEZ. */
      this.dealCounter = {from:o.id, to:0,
        give:(d.want || []).slice(),
        want:(d.give || []).concat(r.add || [])};
      this.dealMsg = esc(o.name) + ': "' + r.why + '" — karşı teklifi ' +
        'ayrı kartta inceleyebilirsin; senin teklifin olduğu gibi duruyor.';
      this.drawDeal(); return;
    }
    /* RET: kaynak, Etki ve RNG değişmez. */
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

  /* ═══════════════════════════════════════════════════════════════
     FAZ 86A — ONAY / TEK ÇALIŞTIRMA / SONUÇ GERİ BİLDİRİMİ
     Eskiden `runop` düğmesi doğrudan runOp çağırıyor ve yalnız geçici
     bir say() mesajı bırakıyordu; ekranda gösterilen maliyet/risk ise
     TABAN değerlerdi. Şimdi önizleme opQuote'tan gelir (aynı kanonik
     kaynak), onay tek işlem üretir ve sonuç yapılandırılmış ekranda
     gösterilir. */
  opConfirm(id, key){
    const e = G.p, o = G.emps[id];
    const q = (typeof opQuote === 'function') ? opQuote(e, o, key) : null;
    if (!q || !q.op){ say('Bilinmeyen operasyon'); return; }
    if (!q.ok){ say(q.why || 'Operasyon uygulanamaz'); return; }
    const cost = Object.keys(q.cost).map(r =>
      (RES[r] ? RES[r].ico : r) + q.cost[r]).join(' ');
    /* Tek kullanımlık onay jetonu: yalnız BU operasyon için geçerli.
       Çift dokunma / iki event ikinci bir yürütme üretemez. */
    this._opPending = id + ':' + key;
    let h = `<div class="mhd"><span>${q.op.ico} ${esc(q.op.n)}</span></div>
      <div class="mbd">
        <div class="row"><span>Hedef</span>
          <b style="color:${o.col}">${esc(o.name)}</b></div>
        <div class="row"><span>Maliyet</span><b>${cost}</b></div>
        <div class="row"><span>İfşa riski</span>
          <b style="color:#ff9b3d">%${q.riskPct}</b></div>
        <div class="ph">BEKLENEN ETKİ</div>
        <div class="mini">${q.op.d}</div>
        ${q.viableDesc ? `<div class="mini">Uygulanabilir hedef: ${esc(q.viableDesc)}</div>` : ''}
        <div class="ph">İFŞA OLURSA</div>
        <div class="mini">Karşılıklı ilişki <b style="color:#ff5f6d">−30</b>;
          hedef seni casuslukla anar. AI hedef yeterince kinlenirse savaş
          ilan edebilir.</div>
        <div class="mini" style="color:#7d90ad">Not: bu operasyonda etki
          uygulanır; zar YALNIZ ifşa için atılır. Yukarıdaki yüzde bir
          "başarı şansı" değil, yakalanma riskidir.</div>
      </div>
      <div class="mft">
        <button class="ch" data-a="opGo" data-x="${id}:${key}">
          <div class="cht">✔ ONAYLA</div>
          <div class="chd">${cost} harca · %${q.riskPct} ifşa riski</div></button>
        <button class="ch" data-a="closem"><div class="cht">✕ İPTAL</div>
          <div class="chd">Hiçbir şey harcanmaz</div></button>
      </div>`;
    this.openModal(h, 'sci');
  },
  opExecute(id, key){
    /* ÇİFT DOKUNMA KORUMASI: onay jetonu tek kullanımlıktır ve
       yürütmeden ÖNCE tüketilir. İkinci `opGo` eşleşen jeton
       bulamaz ve sessizce yok sayılır. */
    const jeton = id + ':' + key;
    if (this._opPending !== jeton) return;
    this._opPending = null;
    const e = G.p, o = G.emps[id];
    const r = (typeof runOp === 'function') ? runOp(e, o, key) : null;
    if (!r || !r.ok){
      say((r && (r.msg || r.why)) || 'Operasyon uygulanamaz');
      this.closeModal(); this.refresh();
      return;
    }
    const OP = OPS[key];
    let h = `<div class="mhd"><span>${OP.ico} OPERASYON SONUCU</span></div>
      <div class="mbd">
        <div class="row"><span>Operasyon</span><b>${esc(OP.n)}</b></div>
        <div class="row"><span>Hedef</span>
          <b style="color:${o.col}">${esc(o.name)}</b></div>
        <div class="row"><span>İfşa</span>
          <b style="color:${r.caught?'#ff5f6d':'#65e08a'}">${
            r.caught ? 'YAKALANDIN' : 'temiz — iz bırakılmadı'}</b></div>
        <div class="ph">GERÇEK SONUÇ</div>
        <div class="mini">${esc(r.msg || '—')}</div>
        ${r.caught ? `<div class="ph">DİPLOMATİK SONUÇ</div>
          <div class="mini" style="color:#ff5f6d">${esc(o.name)} ile karşılıklı
            ilişki −30 · dosyanda suçüstü kaydı açıldı.</div>` : ''}
      </div>
      <div class="mft"><button class="ch" data-a="opDone">
        <div class="cht">Kapat</div>
        <div class="chd">OPERASYONLAR görünümüne dön</div></button></div>`;
    this.openModal(h, r.caught ? 'war' : 'sci');
  },
  /* FAZ 86A: İKİNCİ OPS UYGULAMASI KALDIRILDI.
     Eskiden burada bağımsız bir katalog vardı ve TABAN maliyet
     (opCost çarpanı yok) ile TABAN riski (shadow/counter yok)
     gösteriyordu — ekrandaki sayı gerçek kesintiyle uyuşmuyordu.
     Artık kanonik komuta merkezine yönlendirir. */
  opsMenu(id){
    this.spyTarget = +id;
    this.intelView = 'operations';
    this.closeModal();
    this.keepScroll = false;
    this.tab('intel');
  },

  /* ═══ FAZ 85E: STATÜKO BARIŞI KARAR EKRANI ═══
     `sqOffer` bildiriminin tüketici rotası YOKTU: openNote bildirimi
     kuyruktan siliyor ama hiçbir modal açmıyordu — teklif sessizce
     kayboluyordu. Bu ekran yalnız mevcut kanonik `statusQuoPeace`
     yolunu çağırır; yeni barış hesabı YAZILMAZ. */
  sqOfferOpen(fromId){
    const o = G.emps[+fromId];
    const me = G.p;
    /* Teklif açılana kadar savaş bitmiş veya taraf ölmüş olabilir. */
    if (!o || o.dead || !me || me.dead || !me.war[o.id]){
      this._openNote = null;
      this.openModal(
        `<div class="mhd"><span>TEKLİF GEÇERSİZ</span></div>
         <div class="mbd"><div class="lead">Bu teklif artık geçerli değil —
           savaş sona ermiş ya da taraflardan biri yok olmuş.</div></div>
         <div class="mft"><button class="ch" data-a="closem">
           <div class="cht">Kapat</div></button></div>`, 'war');
      return;
    }
    const chk = (typeof canStatusQuo === 'function')
                ? canStatusQuo(me, o) : {ok:false, why:'—'};
    const dev = (typeof occupationMap === 'function') ? occupationMap(me, o) : [];
    const bana = dev.filter(d => d.yeni === me.id).length;
    const ona  = dev.filter(d => d.yeni === o.id).length;
    let h = `<div class="mhd"><span>🤝 STATÜKO BARIŞI · ${esc(o.name)}</span></div>
      <div class="mbd">
        <div class="lead">${esc(o.name)} cepheyi olduğu yerde dondurmayı
          öneriyor. Statüko barışında kimse tazminat ödemez; işgal edilen
          sistemler <b>fiili sahibinde kalır</b>.</div>
        <div class="ph">SAVAŞIN TARAFLARI</div>
        <div class="row"><span style="color:${me.col}">${esc(me.name)}</span>
          <b>sen</b></div>
        <div class="row"><span style="color:${o.col}">${esc(o.name)}</span>
          <b>teklifi yapan</b></div>
        <div class="ph">SINIRLAR NASIL DONACAK</div>
        <div class="row"><span>Sende kalacak işgal</span>
          <b style="color:#65e08a">${bana} sistem</b></div>
        <div class="row"><span>Onda kalacak işgal</span>
          <b style="color:${ona ? '#ff5f6d' : '#7d90ad'}">${ona} sistem</b></div>
        <div class="mini">⚠ Kabul edersen bu sahiplikler <b>kalıcı olarak
          donar</b> — geri alınmaz.</div>`;
    if (!chk.ok)
      h += `<div class="mini" style="color:#ff9b3d">Şu an uygulanamaz: ${esc(chk.why)}</div>`;
    h += `</div>
      <div class="mft">
        <button class="ch ${chk.ok ? '' : 'dis'}" ${chk.ok ? 'data-a="sqYes"' : ''}>
          <div class="cht">Kabul et</div>
          <div class="chd">Sınırları dondur, savaşı bitir</div></button>
        <button class="ch" data-a="sqNo"><div class="cht">Reddet</div>
          <div class="chd">Savaş sürsün</div></button>
        <button class="ch" data-a="sqLater"><div class="cht">Daha sonra</div>
          <div class="chd">Bildirimi kutuda tut</div></button>
      </div>`;
    this.openModal(h, 'sci');
    this._hook('sqYes', ()=>{
      /* Çift dokunuş iki barış üretmesin */
      if (this._sqBusy) return;
      this._sqBusy = true;
      const o2 = G.emps[+fromId];
      const gecerli = o2 && !o2.dead && G.p && !G.p.dead && G.p.war[o2.id] &&
        (typeof canStatusQuo !== 'function' || canStatusQuo(G.p, o2).ok);
      if (!gecerli){
        say('Teklif artık geçerli değil');
      } else {
        /* KANONİK yol — tam bir kez */
        const r = statusQuoPeace(G.p, o2);
        if (r && r.ok) say('🤝 ' + o2.name +
          ' ile STATÜKO barışı imzalandı — sınırlar donduruldu', 'win');
        else say((r && r.why) || 'Barış uygulanamadı');
      }
      this._openNote = null; this._sqBusy = false;
      this.closeModal(); this.refresh();
    });
    this._hook('sqNo', ()=>{
      /* Yeni ceza UYDURULMAZ; mevcut AI cooldown davranışı korunur. */
      this._openNote = null;
      this.closeModal(); this.refresh();
    });
    this._hook('sqLater', ()=>{
      /* Mevcut stashNote altyapısı — tek kopya olarak kutuya döner. */
      this.stashNote();
      this.closeModal(); this.refresh();
    });
  },

  /* AI'nın sana getirdiği teklif */
  aiOffer(offer){
    const o = G.emps[offer.from];
    /* ═══ FAZ 85E: TEKLİF ARTIK BİLDİRİMİN KENDİ VERİSİNDE ═══
       Eskiden şartlar tekil `UI.pendingOffer` alanında tutuluyordu;
       ikinci bir teklif geldiğinde birincisininkini EZİYORDU ve
       birinci bildirime dokunan oyuncu "Teklif geçerliliğini yitirdi"
       görüyordu. Ayrıca şartlar kayda hiç girmiyordu. Artık her
       `aideal` bildirimi kendi JSON-güvenli teklifini taşır. */
    /* FAZ 86B: her AI teklifine 18 aylık (540 gün) ömür damgası. */
    const damgali = Object.assign({}, offer);
    if (damgali.born === undefined)    damgali.born = G.day;
    if (damgali.expires === undefined)
      damgali.expires = damgali.born +
        ((typeof DEAL_OFFER_LIFE !== 'undefined') ? DEAL_OFFER_LIFE : 540);
    const kendi = (typeof encodeOffer === 'function')
                  ? encodeOffer(damgali) : null;
    if (!kendi) return;
    /* Anahtar İMZAdır: aynı devletten gelen ŞARTLARI FARKLI iki teklif
       yanlışlıkla tekilleştirilmez, birebir aynısı tekrarlanmaz. */
    const imza = (typeof offerSignature === 'function')
                 ? offerSignature(kendi) : ('aideal:' + kendi.from);
    this.notify({kind:'aideal', data:kendi, ico:'📜', pause:false,
      title:'Teklif — ' + o.name,
      sub:(kendi.want.map(dealLabel).join(', ') || 'anlaşma') + ' istiyor' +
        ((typeof dealTimeLeft === 'function' && dealTimeLeft(kendi) !== null)
          ? ' · ' + dealTimeLeft(kendi) + ' ay kaldı' : ''),
      key:'aideal:' + imza});
  },
  aiDealOpen(payload){
    /* FAZ 85E: teklif SEÇİLEN bildirimin kendi verisinden gelir.
       FAZ 86B: kabul kanonik dealQuote/executeDeal hattından geçer,
       süresi dolan teklif uygulanmaz, ret hiçbir kaynağı değiştirmez. */
    const offer = (payload && typeof payload === 'object')
      ? ((typeof encodeOffer === 'function') ? encodeOffer(payload) : payload)
      : null;
    const o = offer ? G.emps[offer.from] : null;
    if (!offer || !o || o.dead){ say('Teklif geçerliliğini yitirdi'); return; }
    const teklif = {from:offer.from, to:0, give:offer.give, want:offer.want,
                    born:offer.born, expires:offer.expires};
    const q = (typeof dealQuote === 'function') ? dealQuote(teklif) : null;
    const kalan = (typeof dealTimeLeft === 'function') ? dealTimeLeft(offer) : null;
    const bayat = !!(q && q.expired);
    this._dealBusy = false;
    const yon = (it, veren) => `<div class="dealItem"><span>${dealLabel(it)}</span>
      <b style="color:#7d90ad;font-size:9px">${veren}</b></div>`;
    this.openModal(
      `<div class="mhd"><span>TEKLİF · ${esc(o.name)}</span></div>
       <div class="mbd">
         ${kalan !== null ? `<div class="row"><span>Kalan süre</span>
           <b style="color:${bayat?'#ff5f6d':(kalan>3?'#65e08a':'#ff9b3d')}">${
             bayat ? 'SÜRESİ DOLDU' : kalan + ' ay'}</b></div>` : ''}
         <div class="ph">SANA VERİYOR</div>
         ${offer.give.length ? offer.give.map(it=>yon(it, esc(o.name)+' → sen')).join('')
                             : '<div class="mini">— hiçbir şey —</div>'}
         <div class="ph">SENDEN İSTİYOR</div>
         ${offer.want.length ? offer.want.map(it=>yon(it, 'sen → '+esc(o.name))).join('')
                             : '<div class="mini">— hiçbir şey —</div>'}
         <div class="row"><span>İmzalama maliyeti</span>
           <b>${q ? q.cost : 0} ◈ · ${esc(o.name)} öder</b></div>
         ${(q && !q.ok) ? `<div class="mini" style="color:#ff5f6d">🔒 ${
           esc(q.reasons[0] || 'Uygulanamaz')}</div>` : ''}
       </div>
       <div class="mft">
         <button class="ch ${(q && q.ok) ? '' : 'dis'}"
           ${(q && q.ok) ? 'data-a="offYes"' : ''}>
           <div class="cht">Kabul et</div>
           <div class="chd">Sana Etki'ye mal olmaz</div></button>
         <button class="ch" data-a="offCounter"><div class="cht">Masaya otur</div>
           <div class="chd">Karşı teklif hazırla · orijinal teklif korunur</div></button>
         <button class="ch" data-a="offNo"><div class="cht">Reddet</div>
           <div class="chd">Kaynak ve Etki değişmez</div></button>
       </div>`);
    this._hook('offYes', ()=>{
      if (this._dealBusy) return;          // tek dokunuş = tek uygulama
      this._dealBusy = true;
      const q2 = (typeof dealQuote === 'function') ? dealQuote(teklif) : null;
      if (!q2 || !q2.ok){
        say((q2 && q2.reasons[0]) || 'Teklif artık geçerli değil', 'war');
      } else if (executeDeal(teklif)) say('Anlaşma imzalandı — ' + o.name, 'win');
      else say('Anlaşma uygulanamadı', 'war');
      this._dealBusy = false;
      this._openNote = null;
      this.closeModal(); this.refresh();
    });
    this._hook('offCounter', ()=>{
      /* ═══ FAZ 86B: KARŞI TEKLİF ORİJİNALİ DEĞİŞTİRMEZ ═══
         AI'nın teklifi ayrı bir kartta saklanır; oyuncu düzenlemeye
         geçse bile "Düzenlemeye dön / Kabul et / Reddet" yollarıyla
         orijinaline dönebilir. */
      this.closeModal();
      this.dealCounter = {from:offer.from, to:0,
        give:offer.give.slice(), want:offer.want.slice(),
        born:offer.born, expires:offer.expires};
      this.deal = {from:0, to:offer.from,
        give:offer.want.slice(), want:offer.give.slice()};
      this.dealMsg = 'Karşı teklif hazırlıyorsun — ' + esc(o.name) +
        ' teklifi bozulmadan saklandı.';
      this._openNote = null;
      this.drawDeal();
    });
    this._hook('offNo', ()=>{
      /* RET: kaynak, Etki ve RNG değişmez. */
      o.rel[0] = clamp(o.rel[0] - 5, -100, 100);
      this._openNote = null;
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
  /* ═══════════════════════════════════════════════════════════════
     FAZ 82 — LİDERLER PANELİ
     Devlet sekmesinden ayrıldı: orada ekonomi, etik, hizip ve
     kayıt menüsüyle birlikte sıkışıyordu. Artık kendi ferah
     sekmesinde — liste, portreler ve alım butonları bir arada.
     ═══════════════════════════════════════════════════════════════ */
  p_liderler(){
    const e = G.p;
    let h = '';
    if (typeof leaderPool !== 'function')
      return `<div class="empty">Lider sistemi yüklenmedi.</div>`;
    /* ═══ FAZ 78B: LİDER HAVUZU ═══ */
    if (typeof leaderPool === 'function'){
      const hav = leaderPool(e);
      const bosta = hav.filter(L => L.post === undefined).length;
      h += `<div class="ph">👤 LİDERLER (${hav.length}/8)</div>`;
      h += `<div class="mini">Amiraller filolara, valiler gezegenlere atanır.
        Görevdeyken tecrübe kazanır ve etkileri büyür (rütbe başına +%10).
        ${bosta ? '<b>' + bosta + ' lider boşta.</b>' : 'Hepsi görevde.'}</div>`;
      if (hav.length){
        h += `<div class="dpList">`;
        hav.forEach(L => {
          const T = LEADER_TRAITS[L.trait];
          const yer = L.post === undefined ? 'boşta'
            : L.tip === 'amiral'
              ? ((G.fleets.find(q=>q.id===L.post)||{}).name || 'filo')
              : (function(){ const [si,pi]=String(L.post).split(':').map(Number);
                  const sy=G.sys[si], p2=sy&&sy.planets[pi];
                  return p2 ? (p2.col && p2.col.name || p2.name) : 'gezegen'; })();
          h += `<div class="dpRow">
            <canvas class="ldrPort" width="48" height="48"
              style="width:26px;height:26px;flex:0 0 26px"
              data-ldr="${L.seed}" data-lk="${L.look}" data-col="${L.col}"
              data-rank="${L.rank}"></canvas>
            <span class="dpNm">${T.ico} ${esc(L.name.slice(0,18))}</span>
            <span class="dpTags" style="font-size:9px;color:#7d90ad">${esc(yer)}</span>
            <b style="font-size:10px;color:${L.rank?'#6ff2c8':'#7d90ad'}">R${L.rank}</b>
          </div>`;
        });
        h += `</div>`;
      }
      h += `<div class="act2">
        <button class="abtn ${(e.res.etk||0)>=60?'pri':'dis'}" data-a="ldrHire"
          data-x="amiral">⚓ AMİRAL AL<br><span style="font-size:9px">60 ◈</span></button>
        <button class="abtn ${(e.res.etk||0)>=60?'pri':'dis'}" data-a="ldrHire"
          data-x="vali">🏛 VALİ AL<br><span style="font-size:9px">60 ◈</span></button>
      </div>`;
    }


    return h;
  },

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

    /* ═══ FAZ 84B: KANONİK VASALLIK / HEGEMONYA BÖLÜMÜ ═══
       Devlet ekranındaki TEK vasallık render yolu. Eskiden üç ayrı blok
       (hegemonya / hegemonya ve vasallık / hegemonya durumu) aynı bilgiyi
       tekrar çiziyordu ve üçü de `perks.length` koşulunun içindeydi —
       ideoloji yeteneği olmayan oyuncu senyörünü ve bağımsızlık savaşı
       düğmesini göremiyordu. Bu bölüm perk koşulunun DIŞINDADIR ve her
       değeri render başına yalnızca bir kez hesaplar. */
    if (typeof isVassal === 'function' && typeof vassalsOf === 'function'){
      const benVasal = isVassal(e);
      const vs       = vassalsOf(e);

      /* ── OYUNCU VASALSA: TEK DURUM KARTI ── */
      if (benVasal){
        const lord = (typeof overlordOf === 'function') ? overlordOf(e) : G.emps[e.overlord];
        const vt   = ((typeof vassalType === 'function') ? vassalType(e) : null)
                     || e.vassalType || 'haracguzar';
        const T    = VASSAL_TYPES[vt] || VASSAL_TYPES.haracguzar;
        /* sadakat bilgisi bir KEZ hesaplanır, tekrar tekrar çağrılmaz */
        const LI   = (typeof vassalLoyaltyInfo === 'function') ? vassalLoyaltyInfo(e) : null;
        const arzu = Math.round(e.vassalAnger || 0);
        const acik = arzu >= 70 ? '#ff5f6d' : arzu >= 45 ? '#ff9b3d' : '#7d90ad';
        const hazir = arzu >= 55;

        h += `<div class="ph">⛓ VASALLIK DURUMU</div>`;
        h += `<div class="box" style="border-color:#ff5f6d">
          <div class="bt"><span>${T.ico} ${esc(lord ? lord.name : '?')} DEVLETİNİN VASALISIN</span>
          <span class="tag b">${T.n}</span></div>
          <div class="bd">${T.d}</div>
          <div class="row"><span>Senyörün</span>
            <b style="color:${lord ? lord.col : '#7d90ad'}">${esc(lord ? lord.name : '?')}</b></div>
          <div class="row"><span>Bağımsızlık arzusu</span>
            <b style="color:${acik}">${arzu}/100</b></div>
          <div class="bar hp"><i style="width:${clamp(arzu,0,100)}%;background:${acik}"></i></div>`;
        if (LI)
          h += `<div class="row"><span>Sadakat</span>
            <b style="color:${acik}">${LI.durum} · ${LI.yon}${
            LI.kalanAy ? ' · ~' + LI.kalanAy + ' ay' : ''}</b></div>`;
        /* türüne uygun ödeme / araştırma bilgisi */
        if (vt === 'haracguzar')
          h += `<div class="row"><span>Son vergi</span>
            <b style="color:#ff9b3d">${(e.vassalPaid || 0).toFixed(1)}</b></div>`;
        else if (vt === 'akademik')
          h += `<div class="row"><span>Aktarılan araştırma</span>
            <b style="color:#8b7bff">${((e.vassalSci !== undefined ? e.vassalSci
              : e.vassalPaid) || 0).toFixed(1)}</b></div>`;
        else
          h += `<div class="row"><span>Yükümlülük</span>
            <b>Vergi yok · senyörünün savaşlarına katılırsın</b></div>`;
        h += `<div class="mini">Bağımsızlık savaşı ilan etmek için arzu en az <b>55</b>
          olmalı; <b>70</b> üstünde halk isyan eşiğindedir ve senyörün zayıfladığı anda
          bağı koparmak en kolayıdır.</div>
          <div class="act2" style="margin-top:6px">
            <button class="abtn ${hazir ? 'dgr' : 'dis'}"
              data-a="revolt">⛓ BAĞIMSIZLIK SAVAŞI İLAN ET</button></div>`;
        if (!hazir)
          h += `<div class="mini" style="color:#ff9b3d">Halkın henüz hazır değil —
            ${55 - arzu} puan eksik.</div>`;
        h += `</div>`;
      }

      /* ── OYUNCUNUN VASALLARI VARSA: TEK HEGEMONYA BÖLÜMÜ ── */
      if (vs.length){
        h += `<div class="ph">👑 HEGEMONYA — VASALLARIN (${vs.length})</div>`;
        let vergi = 0, arastirma = 0, riskli = 0;
        vs.forEach(v => {
          /* tür ve öfke döngü başına bir kez hesaplanır */
          const vt2 = ((typeof vassalType === 'function') ? vassalType(v) : null)
                      || v.vassalType || 'haracguzar';
          const T2  = VASSAL_TYPES[vt2] || VASSAL_TYPES.haracguzar;
          const of2 = Math.round(v.vassalAnger || 0);
          const rsk = of2 > 55;
          if (rsk) riskli++;
          if (vt2 === 'haracguzar')    vergi     += v.vassalPaid || 0;
          else if (vt2 === 'akademik') arastirma += (v.vassalSci !== undefined
                                                     ? v.vassalSci : v.vassalPaid) || 0;
          h += `<div class="row"><span style="color:${v.col}">${T2.ico} ${esc(v.name)}</span>
            <b style="color:${rsk ? '#ff5f6d' : '#65e08a'}">${T2.n} · öfke ${of2}${
            vt2 === 'haracguzar' ? ' · ' + Math.round(v.vassalPaid || 0) + '/ay' : ''}</b></div>`;
          if (rsk)
            h += `<div class="mini" style="color:#ff5f6d">⚠ Öfke ${of2}/100 — isyan riski</div>`;
        });
        if (vergi > 0)
          h += `<div class="row"><span>Aylık vergi geliri</span>
            <b style="color:#65e08a">${vergi.toFixed(1)}</b></div>`;
        if (arastirma > 0)
          h += `<div class="row"><span>Aylık araştırma aktarımı</span>
            <b style="color:#8b7bff">${arastirma.toFixed(1)}</b></div>`;
        const cap = (typeof vassalCapBonus === 'function') ? vassalCapBonus(e) : 0;
        if (cap)
          h += `<div class="row"><span>Bekçi filo kapasitesi</span>
            <b style="color:#6ff2c8">+${cap}</b></div>`;
        const hw = (typeof hegemonyWeight === 'function') ? hegemonyWeight(e) : 0;
        if (hw > 0)
          h += `<div class="row"><span>Konsey oy ağırlığı katkısı</span>
            <b style="color:#8b7bff">+${hw.toFixed(1)}</b></div>`;
        if (riskli)
          h += `<div class="mini" style="color:#ff5f6d">⚠ ${riskli} vasalın isyan eşiğine
            yaklaştı — öfkeyi düşürmezsen bağımsızlık savaşı açabilirler.</div>`;
      }
      /* Bağımsız ve vasalsız oyuncuya boş bölüm gösterilmez. */
    }

    // --- ETİK YETENEKLERİ ---
    const perks = perksOf(e);

    /* ═══ FAZ 84C: DEVLET-GENELİ BİLGİLER ═══
       Mizaç, galaktik itibar, diplomatik ağırlık, ambargo/Parya baskısı,
       danışman düğmesi ve Galaktik Tehdit bilgileri perk verisine DEĞİL,
       devletin kendi durumuna bağlıdır. Eskiden üçü de `perks.length`
       kapısının içindeydi; ideoloji yeteneği açmamış oyuncu bunların
       hiçbirini göremiyordu. Kapının DIŞINA alındı; sıraları korundu. */
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
    /* İdeoloji yetenekleri: gerçekten perk verisine bağlı TEK alan */
    if (perks.length){
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
        /* ═══ FAZ 77E: TEK KOLONİ GEMİSİ HARCA ═══
           KÖK NEDEN: filter TÜM 'kol' gemilerini siliyordu; üç
           koloni gemisi taşıyan filo tek yerleşimde üçünü birden
           kaybediyordu. Artık yalnız ilk bulunan çıkarılıyor. */
        const kIx = f.ships.findIndex(sh => sh.c === 'kol');
        if (kIx >= 0) f.ships.splice(kIx, 1);
        if (!f.ships.length){ G.fleets = G.fleets.filter(x=>x!==f); View.sel = null; }
      }
    } else {
      /* ═══ FAZ 76: HEDEF KİLİDİ ═══
         Başka bir koloni gemisi oraya çoktan yola çıktıysa
         ikinci gemi gönderilmez — ikisinin de heba olması biter. */
      if (typeof colonyClaimedBy === 'function' && colonyClaimedBy(pl, f.id)){
        const sahip = G.fleets.find(q => q.id === pl.colonyClaim);
        say('🚀 ' + pl.name + ' zaten hedefte — ' +
            (sahip ? esc(sahip.name) : 'başka bir gemi') +
            ' yolda. İkinci gemi boşa gitmesin.', 'war');
        this.refresh();
        return;
      }
      if (typeof claimColony === 'function') claimColony(f, sys, pi);
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
  /* ═══ FAZ 86B — GÖREV G: HIZLI DÜĞMELER ARTIK MÜZAKERE AÇAR ═══
     ÖLÇÜLEN ESKİ DAVRANIŞ: barış/ittifak/ticaret düğmeleri Etki'yi
     ZAR ATILMADAN ÖNCE kesiyordu (peace 30 · pact 40 · ally 90/55,
     sharedFoe ×0.5) ve `rnd() < chance` ile görünmez bir zar atıyordu.
     Reddedilirse Etki geri gelmiyordu — yani "ret" bedava değildi.
     ARTIK: kaynak kesilmez, RNG tüketilmez; ilgili madde önceden
     eklenmiş MÜZAKERE açılır ve imza kanonik executeDeal'den geçer. */
  diploAct(kind, id){
    const e = G.p, o = G.emps[id];
    if (!o) return;
    if (kind === 'war'){ this.warGoalMenu(o.id); return; }
    if (kind === 'peace' || kind === 'ally' || kind === 'pact'){
      /* Ön kontrol: kilitliyse nedenini söyle, müzakereyi açma. */
      if (kind === 'peace' && typeof canPeace === 'function' && !canPeace(e,o)){
        say(hasCivic(e,'blood') ? 'Kan Hukuku barışı yasaklar'
                                : 'Bu imparatorlukla barış mümkün değil', 'war');
        return;
      }
      if (kind === 'ally'){
        if (typeof canAlly === 'function' && !canAlly(e,o)){
          say('Sürgün doktrini ittifakı yasaklar', 'war'); return; }
        if (RACES[o.race] && RACES[o.race].dip <= .05){
          say(o.name + ' ittifak kavramını tanımıyor', 'war'); return; }
      }
      if (kind === 'pact' && typeof canPact === 'function' && !canPact(e,o)){
        say('Bu imparatorlukla ticaret mümkün değil', 'war'); return;
      }
      this.dealOpenWith(o.id, [{t: kind}]);
      return;
    }
    if (kind === 'unpact'){ this.unpactConfirm(o.id); return; }
    if (kind === 'gift'){
      const dipMul = 1 + e.mods.dipMul;
      if (e.res.min < 200){ say('Yetersiz mineral'); return; }
      e.res.min -= 200;
      const g = Math.round(14*dipMul);
      e.rel[o.id] = clamp(e.rel[o.id]+g,-100,100);
      o.rel[e.id] = clamp(o.rel[e.id]+g,-100,100);
      say(o.name + ' hediyeyi kabul etti (+' + g + ' ilişki)');
    }
    this.refresh();
  },
  /* Hedefe bağlı müzakereyi, maddeleri önceden ekleyerek açar. */
  dealOpenWith(id, items){
    const o = G.emps[id];
    if (!o) return;
    this.deal = {from:0, to:id, give:(items||[]).slice(), want:[]};
    this.dealCounter = null;
    this.dealMsg = '';
    const pane = $('diploPane');
    if (pane) pane.classList.add('show');
    this.drawDeal();
  },
  /* ═══ FESİH ONAYI ═══
     Eskiden `unpact` tek dokunuşta, onaysız, sonucu önceden
     gösterilmeden uygulanıyordu. */
  unpactConfirm(id){
    const e = G.p, o = G.emps[id];
    if (!o) return;
    this._unpactBusy = false;
    this.openModal(
      `<div class="mhd"><span>🤝 TİCARET ANLAŞMASINI FESHET</span></div>
       <div class="mbd">
         <div class="lead">${esc(o.name)} ile ticaret anlaşmanı tek taraflı
           bozmak üzeresin.</div>
         <div class="row"><span>İlişki sonucu</span>
           <b style="color:#ff5f6d">−10</b></div>
         <div class="row"><span>Ticaret geliri</span>
           <b style="color:#ff9b3d">bu hattan kesilir</b></div>
         <div class="mini">Fesih tek taraflıdır ve Etki harcamaz.</div>
       </div>
       <div class="mft">
         <button class="ch dgr" data-a="unpactYes"><div class="cht">Feshet</div>
           <div class="chd">İlişki −10</div></button>
         <button class="ch" data-a="closem"><div class="cht">Vazgeç</div>
           <div class="chd">Hiçbir şey değişmez</div></button>
       </div>`, 'war');
    this._hook('unpactYes', ()=>{
      if (this._unpactBusy) return;      // tek dokunuş = tek uygulama
      this._unpactBusy = true;
      breakPact(e, o);
      e.rel[o.id] = clamp(e.rel[o.id] - 10, -100, 100);
      say('Ticaret anlaşması feshedildi');
      this.closeModal(); this.refresh();
    });
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
      case 'pact':    this.pactOpen(it.data); break;   // FAZ 68
      case 'submit':  this.submitOpen(it.data); break; // FAZ 71
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
      /* FAZ 85E: sqOffer'ın tüketici case'i YOKTU — bildirim
         kuyruktan siliniyor ama hiçbir karar ekranı açılmıyordu. */
      case 'sqOffer': this.sqOfferOpen(it.data); break;
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
    /* ═══ FAZ 80: GEÇERSİZ ART ANAHTARI SESSİZ KALMASIN ═══
       Tanınmayan anahtar geldiğinde görsel katmanı zaten
       atlanıyordu (sessiz hata). Artık geliştirme aşamasında
       konsola düşüyor ve türe göre makul bir varsayılan
       seçiliyor — böylece bildirim görselsiz kalmıyor. */
    if (art && typeof ART !== 'undefined' && ART.PIXEL_ART &&
        !ART.PIXEL_ART[art]){
      console.warn('Bilinmeyen olay görseli:', art, '→ varsayılana düşüldü');
      art = (cls === 'war') ? 'infaz' : (cls === 'win') ? 'veri' : 'veri';
    }
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
  /* ═══ FAZ 66: BİLDİRİMDE IRK PORTRESİ ═══
     Devlet kimliği taşıyan bildirimlerde küçük bir portre. */
  empChip(o, boy){
    if (!o) return '';
    const d = boy || 40;
    return `<canvas class="dpPort notifPort" width="${d*2}" height="${d*2}"
      style="width:${d}px;height:${d}px"
      data-lk="${o.look||'humanoid'}" data-col="${o.col}"
      data-pers="${typeof personaKey==='function'?personaKey(o):'yayilmaci'}"></canvas>`;
  },
  eventArt(art, baslik, metin, cls, kat, emp){

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
    /* FAZ 66: kategori artık adlandırılmış parametre (kat).
       Faz 58'deki arguments[4] okuması gereksiz kaldı. */
    if (kat === undefined) kat = 'kritik';
    if (kat === 'siradan' && typeof AUTO_EVENT !== 'undefined' && AUTO_EVENT){
      const ozet = String(metin || '').replace(/\s+/g, ' ').trim();
      say('📜 ' + baslik + (ozet ? ' — ' + ozet.slice(0, 110) +
          (ozet.length > 110 ? '…' : '') : ''), cls || 'sci');
      return;
    }
    if (!$('modal').className.includes('hidden') && $('modal').innerHTML) return;
    this.openModal(
      `<div class="mhd">${emp ? this.empChip(emp, 34) : ''}<span>${esc(baslik)}</span></div>
       <div class="mbd"><div class="lead">${esc(metin)}</div></div>
       <div class="mft"><button class="ch" data-a="closem">
         <div class="cht">Anlaşıldı</div></button></div>`,
      cls || 'war', true, art);
  },
  /* ═══ FAZ 80: HARİTA MODU TOAST'I ═══
     Ekranın üst ortasında 2.6 saniye duran, tıklanamayan bir
     şerit. Sol üstteki olay akışını kirletmiyor çünkü bu bir
     olay değil, bir kip göstergesi. */
  mapToast(baslik, aciklama){
    const el = $('mapToast');
    if (!el){ say('🗺 ' + baslik); return; }
    el.innerHTML = `<b>${esc(baslik.toUpperCase())} HARİTASI</b>` +
      (aciklama ? `<span>${esc(aciklama)}</span>` : '');
    el.className = 'show';
    clearTimeout(this._toastT);
    this._toastT = setTimeout(() => { el.className = ''; }, 2600);
  },
  /* ═══════════════════════════════════════════════════════════════
     FAZ 83 — VASALLIK MÜZAKERE PENCERESİ
     Üç mevcut tip "şart paketi" olarak sunuluyor; serbest
     sözleşme motoru YOK (o ayrı bir faz). Kabul şansı burada
     GÖSTERİLİYOR ama zar atılmıyor — zar yalnız TEKLİFİ GÖNDER'de
     atılıyor ve gösterilen sayı ile aynı fonksiyondan geliyor.
     ═══════════════════════════════════════════════════════════════ */
  vsDraw(){
    const v = this.vs;
    if (!v) return;
    const e = G.p, o = G.emps[v.id];
    if (!o){ this.vs = null; return; }
    const demand = v.yon === 'demand';
    const chk = demand ? canDemandVassal(e, o) : canSeekProtection(e, o);
    const bedel = demand ? VASSAL_DEMAND_COST : VASSAL_SEEK_COST;
    /* Kabul şansı: gösterim ve çözüm AYNI fonksiyon */
    const sans = demand ? Math.round(vassalAcceptChance(e, o) * 100) : null;
    const oran = chk.oran ? chk.oran.toFixed(1) : '—';

    let h = `<div class="mhd"><span>⛓ SÜZERENLİK MÜZAKERESİ</span>
      <button class="riX" data-a="vsCancel">✕</button></div>
      <div class="mbd">
      <div class="lead">${demand
        ? '<b>' + esc(o.name) + '</b> devletini <b>vasalın yapmak</b> istiyorsun.'
        : '<b>' + esc(o.name) + '</b> devletinin <b>vasalı olmak</b> istiyorsun.'}</div>
      <div class="row"><span>Güç oranı</span><b>${oran}×</b></div>
      <div class="row"><span>Etki bedeli</span><b>${bedel} ◈</b></div>`;
    if (demand)
      h += `<div class="row"><span>Tahmini kabul şansı</span>
        <b style="color:${sans>50?'#65e08a':sans>25?'#f2d452':'#ff5f6d'}">%${sans}</b></div>`;
    h += `<div class="ph">ŞART PAKETİ</div><div class="grid g2">`;
    for (const k in VASSAL_TYPES){
      const T = VASSAL_TYPES[k];
      const on = v.tur === k;
      h += `<button class="opt ${on?'on':''}" data-a="vsType" data-x="${k}">
        ${T.ico} ${esc(T.n)}<small>${esc(T.d || '')}</small></button>`;
    }
    h += `</div>`;
    /* Seçilen paketin somut sonuçları */
    const T2 = VASSAL_TYPES[v.tur] || {};
    const odeyen = demand ? esc(o.name) : 'Sen';
    const alan   = demand ? 'sen' : esc(o.name);
    h += `<div class="box"><div class="bt"><span>${T2.ico} ${esc(T2.n||'')} — sonuçlar</span></div>
      <div class="bd">
        · <b>Vergi:</b> ${odeyen} enerji, mineral ve alaşım gelirinin
          <b>%${Math.round((VASSAL_TAX.ene||0)*100)}</b>'sini ${alan}e öder.<br>
        · <b>Savaş:</b> ${v.tur === 'bekci'
            ? 'Süzeren savaşa girince vasal <b>otomatik katılır</b>.'
            : 'Vasal savaşa çağrılabilir (⚔ emri), zorunlu değildir.'}<br>
        · <b>Bilim:</b> ${v.tur === 'akademik'
            ? 'Araştırmanın <b>%' + Math.round(VASSAL_SCI_CUT*100) + '</b>\'i süzerene akar.'
            : 'Bilim paylaşımı yok.'}<br>
        · <b>Sadakat riski:</b> Vergi ve emir yükü arttıkça sadakat düşer;
          sıfırlanırsa <b>bağımsızlık savaşı</b> çıkar. Rakipler
          ayrılıkçıları gizlice fonlayabilir.
      </div></div>`;
    if (!chk.ok)
      h += `<div class="box" style="border-color:#ff5f6d">
        <div class="bd" style="color:#ff9b3d">🔒 ${esc(chk.why)}</div></div>`;
    h += `</div><div class="mft">
      <button class="ch" data-a="vsCancel"><div class="cht">İPTAL</div>
        <div class="chd">Hiçbir şey değişmez</div></button>
      <button class="ch ${chk.ok?'':'dis'}" ${chk.ok?'data-a="vsSend"':''}>
        <div class="cht">TEKLİFİ GÖNDER</div>
        <div class="chd">${chk.ok ? bedel + ' etki harcanır' : 'Şartlar tutmuyor'}</div>
      </button></div>`;
    this.openModal(h, 'war', true);
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
  /* ═══ FAZ 68: AI PAKT TEKLİFİ ═══ */
  /* ═══ FAZ 71: SIĞINMA TALEBİ ═══ */
  submitOpen(d){
    if (!d) return;
    const o = G.emps[d.from];
    const teh = G.emps[d.tehdit];
    if (!o || o.dead) return;
    const secim = ['haracguzar','bekci','akademik'];
    let h = `<div class="mhd">${this.empChip ? this.empChip(o, 34) : ''}
      <span>⛓ SIĞINMA TALEBİ</span></div>
      <div class="mbd"><div class="lead">${esc(o.name)} himayene sığınmak
        istiyor.</div>
        ${teh ? esc(teh.name) + ' karşısında ayakta kalamayacaklarını ' +
          'biliyorlar. Vasalın olurlarsa onları savunmak zorundasın — ' +
          'ama karşılığında sana bağlanırlar.' : ''}
        <div class="row" style="margin-top:8px"><span>Güçleri</span>
          <b>${fmt(totalPower(o))}</b></div>
        <div class="row"><span>Sistemleri</span><b>${sysCount(o)}</b></div>
        <div class="ph">HANGİ TİP?</div>`;
    secim.forEach(t => {
      const T = VASSAL_TYPES[t];
      h += `<button class="ch" data-a="subYes:${t}">
        <div class="cht">${T.ico} ${esc(T.n)}</div>
        <div class="chd">${esc(T.d)}</div></button>`;
    });
    h += `<button class="ch" data-a="subNo"><div class="cht">Reddet</div>
        <div class="chd">Kaderlerine terk edilirler</div></button></div>`;
    this.openModal(h, 'sci');
    secim.forEach(t => {
      this._hook('subYes:' + t, ()=>{
        if (typeof subjugate === 'function') subjugate(G.p, o, t);
        o.rel[0] = clamp((o.rel[0] || 0) + 30, -100, 100);
        say('⛓ ' + o.name + ' vasalın oldu — ' + VASSAL_TYPES[t].n, 'win');
        this.closeModal(); this.refresh();
      });
    });
    this._hook('subNo', ()=>{
      o.rel[0] = clamp((o.rel[0] || 0) - 15, -100, 100);
      this.closeModal();
    });
  },
  pactOpen(d){
    if (!d) return;
    const o = G.emps[d.from];
    if (!o || o.dead) return;
    const spy = d.tur === 'spynet';
    const bedel = spy ? 120 : 45;
    const rel = Math.round(G.p.rel[o.id] || 0);
    this.openModal(
      `<div class="mhd">${this.empChip ? this.empChip(o, 34) : ''}<span>${
         spy ? '🕸 CASUSLUK AĞI PAKTI' : '👁 SENSÖR ANLAŞMASI'}</span></div>
       <div class="mbd"><div class="lead">${esc(o.name)} ${
         spy ? 'istihbarat ağlarını seninkiyle birleştirmek istiyor.'
             : 'harita görüşünü seninle paylaşmak istiyor.'}</div>
         ${spy
           ? 'Kabul edersen onun üçüncü devletler üzerindeki casusluk seviyesi ' +
             'senin de olur — ve seninki onun. Bu çok mahrem bir bağdır; ' +
             'savaşa girerseniz kendiliğinden kopar.'
           : 'Harita görüşleri ve radar menzilleri paylaşılır. Gizli casusluk ' +
             'bilgileri paylaşılmaz.'}
         <div class="row" style="margin-top:8px"><span>İlişki</span>
           <b style="color:${rel>=60?'#65e08a':'#f2d452'}">${rel>0?'+':''}${rel}</b></div>
         <div class="row"><span>Sana maliyeti</span><b>${bedel} ◈</b></div></div>
       <div class="mft">
         <button class="ch" data-a="pactYes"><div class="cht">Kabul et</div>
           <div class="chd">${bedel} etki harcanır</div></button>
         <button class="ch" data-a="pactNo"><div class="cht">Reddet</div>
           <div class="chd">İlişki hafif sarsılır</div></button>
       </div>`, 'sci');
    this._hook('pactYes', ()=>{
      /* ═══ FAZ 86B: KANONİK HAT ═══
         Eskiden bu yol anlaşmayı kendi eliyle uyguluyor ve maliyeti
         KABUL EDEN oyuncudan kesiyordu (intel 45 · spynet 120).
         Artık executeDeal'den geçer ve maliyeti TEKLİFİ GÖNDEREN
         (AI) öder — oyuncudan gizli kesinti yapılmaz. */
      if (this._pactBusy) return;
      this._pactBusy = true;
      const tur = spy ? 'spynet' : 'intel';
      const teklif = {from:o.id, to:0,
        give:[{t:tur}], want: spy ? [] : [{t:tur}],
        born: d && d.born, expires: d && d.expires};
      const q = (typeof dealQuote === 'function') ? dealQuote(teklif) : null;
      if (!q || !q.ok){
        say((q && q.reasons[0]) || 'Anlaşma artık geçerli değil', 'war');
        this._pactBusy = false; this.closeModal(); this.refresh(); return;
      }
      if (executeDeal(teklif))
        say(spy ? '🕸 Casusluk ağı paktı kuruldu — ' + o.name
                : '👁 Sensör anlaşması imzalandı — ' + o.name, 'win');
      else say('Anlaşma uygulanamadı', 'war');
      this._pactBusy = false;
      this.closeModal(); this.refresh();
    });
    this._hook('pactNo', ()=>{
      o.rel[0] = clamp((o.rel[0] || 0) - 6, -100, 100);
      o._pactCd = (G.memAge || 0) + 48;     // bir daha çabuk sormasın
      this.closeModal();
    });
  },
  peaceOpen(o){
    /* ═══ FAZ 86B ═══
       ÖLÇÜLEN HATA: `pyes` hook'u İKİ KEZ kaydediliyordu; ikinci
       kayıt birincisini eziyor ve makePeace HİÇ çalışmıyordu.
       Artık tek hook var ve barış kanonik executeDeal'den geçiyor. */
    const kalan = (typeof dealTimeLeft === 'function')
      ? dealTimeLeft(o._peaceOffer) : null;
    this._peaceBusy = false;
    this.openModal(
      `<div class="mhd"><span>BARIŞ TEKLİFİ</span></div>
       <div class="mbd"><div class="lead">${esc(o.name)} ateşkes istiyor.
         Elçileri sınırda bekliyor.</div>
       Savaş her iki tarafı da yıprattı. Kabul edersen sınırlar mevcut
       hâliyle donar.
       ${kalan !== null ? `<div class="row"><span>Teklifin kalan süresi</span>
         <b style="color:${kalan>3?'#65e08a':'#ff9b3d'}">${kalan} ay</b></div>` : ''}
       <div class="mini">Barışın Etki maliyeti teklifi GÖNDEREN tarafa aittir;
         kabul etmen sana Etki'ye mal olmaz.</div></div>
       <div class="mft">
         <button class="ch" data-a="pyes"><div class="cht">Barışı kabul et</div>
           <div class="chd">Savaş sona erer</div></button>
         <button class="ch" data-a="pno"><div class="cht">Reddet</div>
           <div class="chd">Savaş sürer · Etki harcanmaz</div></button>
       </div>`,'war');
    this._hook('pyes', ()=>{
      if (this._peaceBusy) return;
      this._peaceBusy = true;
      const teklif = {from:o.id, to:0, give:[{t:'peace'}], want:[],
                      born:(o._peaceOffer && o._peaceOffer.born)};
      const q = (typeof dealQuote === 'function') ? dealQuote(teklif) : null;
      if (q && q.ok && executeDeal(teklif)){
        if (o.offerRefused) delete o.offerRefused[0];
        say('Barış imzalandı — ' + o.name, 'win');
      } else say((q && q.reasons[0]) || 'Barış uygulanamadı', 'war');
      this._peaceBusy = false;
      this.closeModal(); this.refresh();
    });
    this._hook('pno', ()=>{
      /* RET: kaynak/Etki değişmez. */
      o.rel[0] -= 20;
      o.offerRefused = o.offerRefused || {};
      o.offerRefused[0] = G.day;
      this.closeModal();
    });
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
  /* ═══ FAZ 66: GALAKTİK PİYASA PANELİ ═══ */
  openMarket(){
    if (typeof marketInit !== 'function'){ say('Piyasa yok', 'war'); return; }
    const e = G.p;
    /* ═══ FAZ 78: BORSA KONSEY KARARIYLA AÇILIR ═══ */
    if (typeof marketOpen === 'function' && !marketOpen()){
      const pane0 = $('diploPane');
      const kns = (typeof councilExists === 'function' && councilExists());
      pane0.innerHTML = `<div class="dpBox">
        <div class="dpHd"><span>💱 BORSA KAPALI</span>
          <button class="riX" data-a="closeMarket">✕</button></div>
        <div class="dpBody"><div class="box" style="border-color:#ff9b3d">
          <div class="bt"><span>Galaktik Borsa henüz kurulmadı</span></div>
          <div class="bd">Ortak bir takas merkezi ancak Galaktik Konseyin
            kararıyla açılır. ${kns
              ? 'Konseyde <b>"Galaktik Borsayı Kur"</b> yasasını gündeme getir.'
              : 'Önce bir <b>Galaktik Konsey</b> kurulmalı.'}</div>
          <div class="act2"><button class="abtn pri" data-a="${
            kns ? 'cncPane' : 'globalPane'}" data-x="imp">${
            kns ? '🌐 KONSEYE GİT' : '🌐 KONSEY KUR'}</button></div>
        </div></div></div>`;
      pane0.classList.add('show');
      return;
    }
    /* FAZ 73: Arındırıcılar pazara giremez */
    if (typeof isPurifier === 'function' && isPurifier(e)){
      const pane = $('diploPane');
      pane.innerHTML = `<div class="dpBox">
        <div class="dpHd"><span>☣ PAZAR KAPALI</span>
          <button class="riX" data-a="closeMarket">✕</button></div>
        <div class="dpBody"><div class="box" style="border-color:#8b7bff">
          <div class="bt"><span>Fanatik Arındırıcılar</span></div>
          <div class="bd">Galaktik Piyasa yabancılarla alışveriş demektir.
            Doktrinin buna izin vermiyor — ihtiyacın olanı üretir ya da
            alırsın.</div></div></div></div>`;
      pane.classList.add('show');
      return;
    }
    marketInit();
    this.mkt = this.mkt || {sat:'min', al:'ala', mik:200};
    const M = this.mkt;
    const q = marketQuote(M.sat, M.al, M.mik);
    let h = `<div class="dpBox"><div class="dpHd"><span>💱 GALAKTİK PİYASA</span>
      <button class="riX" data-a="closeMarket">✕</button></div><div class="dpBody">`;
    h += `<div class="mini">Kurlar arz ve talebe göre kayar. Çok alınan
      pahalanır, çok satılan ucuzlar; zamanla taban değere döner.
      Her takasta %${Math.round(MARKET_FEE*100)} komisyon kesilir.</div>`;
    /* Kur tablosu */
    h += `<div class="ph">GÜNCEL KURLAR</div>`;
    MARKET_RES.forEach(r => {
      const mul = G.market.mul[r];
      const yon = mul > 1.05 ? {t:'▲', c:'#ff5f6d'} : mul < .95
                ? {t:'▼', c:'#65e08a'} : {t:'—', c:'#7d90ad'};
      h += `<div class="row"><span>${RES[r].ico||''} ${RES[r].n}</span>
        <b style="color:${yon.c}">${marketPrice(r).toFixed(2)} ${yon.t}
        <span style="font-size:9px;opacity:.7">(×${mul.toFixed(2)})</span></b></div>`;
    });
    /* Takas kurucu */
    h += `<div class="ph">TAKAS</div><div class="mini">VER:</div><div class="act2">`;
    MARKET_RES.forEach(r => {
      h += `<button class="abtn ${M.sat===r?'pri':''}" data-a="mktSel"
        data-x="sat:${r}">${RES[r].n}<br><span style="font-size:9px">${
          Math.round(e.res[r]||0)}</span></button>`;
    });
    h += `</div><div class="mini">AL:</div><div class="act2">`;
    MARKET_RES.filter(r => r !== M.sat).forEach(r => {
      h += `<button class="abtn ${M.al===r?'pri':''}" data-a="mktSel"
        data-x="al:${r}">${RES[r].n}</button>`;
    });
    h += `</div><div class="mini">MİKTAR:</div><div class="act2">`;
    [100, 200, 500, 1000].forEach(v => {
      h += `<button class="abtn ${M.mik===v?'pri':''}" data-a="mktSel"
        data-x="mik:${v}">${v}</button>`;
    });
    h += `</div>`;
    const yeter = (e.res[M.sat] || 0) >= M.mik;
    h += `<div class="box" style="border-color:${yeter?'#6ff2c8':'#ff5f6d'}">
      <div class="bt"><span>${M.mik} ${RES[M.sat].n}</span>
        <b style="color:#6ff2c8">→ ${q.ok?Math.round(q.alinan):0} ${RES[M.al].n}</b></div>
      <div class="bd">${q.ok
        ? 'komisyon <b>' + Math.round(q.komisyon) + '</b> ' + RES[M.al].n +
          ' · kur ' + q.kurSat.toFixed(2) + ' → ' + q.kurAl.toFixed(2)
        : esc(q.why || '')}
        ${yeter ? '' : '<br><b style="color:#ff5f6d">Yeterli kaynağın yok</b>'}</div>
      <div class="act2"><button class="abtn ${yeter?'pri':'dis'}" data-a="mktTrade"
        data-x="${M.sat}:${M.al}:${M.mik}">💱 TAKAS ET</button></div></div>`;
    h += `</div></div>`;
    const pane = $('diploPane');
    pane.innerHTML = h;
    pane.classList.add('show');
  },
  saveMenu(){
    const auto = G.autoSave !== false;
    this.openModal(
      `<div class="mhd"><span>KAYIT VE AYARLAR</span>
         <button class="riX" data-a="diagShow" title="Tanılama">🩺</button>
         <button class="riX" data-a="closem">✕</button></div>
       <div class="mbd" id="diagBox">Depolama sınanıyor…</div>
       <div class="mft">
        <button class="ch" data-a="mute"><div class="cht">${
          AUDIO_OFF ? '🔇 Ses kapalı' : '🔊 Ses açık'}</div>
          <div class="chd">FAZ 62: müzik anahtarı araç çubuğundan buraya taşındı —
            sol menüde yer açıldı</div></button>
        <button class="ch" data-a="bgTog"><div class="cht">${
          BG_OFF ? '🌌 Arka plan kapalı' : '🌌 Arka plan açık'}</div>
          <div class="chd">Yıldız alanı ve bulutsu çizimi</div></button>
        <button class="ch" data-a="autoEvent"><div class="cht">${
          AUTO_EVENT ? '⚡ Olaylar otomatik geçiliyor' : '⚡ Olaylar soruluyor'}</div>
          <div class="chd">Anomali ve rastgele olaylar; kritik bildirimler
            daima gösterilir</div></button>
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
    /* ═══════════════════════════════════════════════════════════
       FAZ 77E — SAĞ PANEL PORTRE ONARIMI
       KÖK NEDEN: dpPort canvas'ları yalnız openDiplo() ve
       openGlobal() içindeki setTimeout bloklarında boyanıyordu.
       Faz 71'de sağ panele (p_sistem) eklediğim portreler o
       döngülerin dışında kaldığı için ÇİZİLMİYORDU — oyuncu boş
       çerçeve görüyordu. paintSprites her karede çalıştığı için
       boyama buraya taşındı; hangi panelde olursa olsun dolar. */
    [...document.querySelectorAll('canvas.dpPort')].forEach(cv=>{
      if (cv.dataset.done) return;
      cv.dataset.done = 1;
      try {
        const g2 = cv.getContext('2d');
        g2.imageSmoothingEnabled = false;
        const spr2 = ART.portraitFull({
          look: cv.dataset.lk || 'humanoid',
          col:  cv.dataset.col || '#4aa8d8',
          persona: cv.dataset.pers,
          mood: +(cv.dataset.mood || 0),
          scale: 3
        });
        const sc2 = Math.min(cv.width/spr2.width, cv.height/spr2.height) * .9;
        g2.clearRect(0, 0, cv.width, cv.height);
        g2.drawImage(spr2, (cv.width - spr2.width*sc2)/2,
          (cv.height - spr2.height*sc2)/2, spr2.width*sc2, spr2.height*sc2);
      } catch(err){ /* portre çizilemedi — panel yine de çalışsın */ }
    });

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
  /* ═══ FAZ 61: ŞABLON ŞERİDİ (her sekmede üstte) ═══ */
  {
    h += `<div class="tplBar">
      <button class="tplBtn" data-a="tplSave">💾 ŞABLONU KAYDET</button>`;
    if (TEMPLATES && TEMPLATES.length){
      TEMPLATES.forEach(t => {
        if (!t || !t._ad) return;
        h += `<button class="tplBtn load" data-a="tplLoad" data-x="${esc(t._ad)}"
          title="${esc(t._ad)} şablonunu yükle">📂 ${esc(t._ad.slice(0,14))}
          <i data-a="tplDel" data-x="${esc(t._ad)}">✕</i></button>`;
      });
    } else {
      h += `<span class="mini" style="align-self:center;color:#7d90ad">
        Kayıtlı şablon yok</span>`;
    }
    h += `</div>`;
  }

  if (SETUP_STEP === 'mizac'){
    /* ═══ FAZ 78: İMPARATORLUK ADI + ZAR ═══
       KÖK NEDEN: rollName eylemi ve empName dinleyicisi kodda
       vardı ama girdi kutusu HİÇ RENDER EDİLMİYORDU — oyuncu adı
       hiç göremiyor, zar butonu da yoktu. */
    h += `<div class="sect"><h2>HANEDAN ADI</h2>
      <div class="nameRow">
        <input id="empName" class="nameInp" type="text" maxlength="30"
          value="${esc(c.name || 'Yeni Hanedan')}"
          placeholder="Hanedanının adı">
        <button class="diceBtn" data-a="rollName"
          title="Etiğine uygun rastgele ad üret">🎲</button>
      </div>
      <div class="mini">Zar, seçtiğin ideoloji eksenlerine uygun bir ad üretir —
        militarist bir devlet "Kılıç" duyar, ruhaniyetçi bir devlet "Mabet".</div>
    </div>

    <div class="sect"><h2>DOKTRİN</h2>
      <div class="mini" style="margin-bottom:8px">Mizaç, halkının dünyaya bakışıdır.
      Kin tutma hızını, savaş eşiğini, konseydeki duruşunu ve yüzünü belirler.
      Sonradan ideoloji reformuyla değiştirilebilir — ama bedeli ağırdır.</div>
      <div class="grid g2">`;
    for (const k in PERSONAS){
      const P = PERSONAS[k];
      const on = (c.mizac === k);
      /* ═══ FAZ 76: OKUNABİLİR DOKTRİN DÖKÜMÜ ═══
         "kin ×0.95" kimseye bir şey anlatmıyordu. Artık somut
         etkiler yazılıyor: hangi kaynak ne kadar artıyor,
         ne kadar azalıyor. */
        const etiket = {
          dmgMul:'Gemi hasarı', rofMul:'Atış hızı', araMul:'Araştırma',
          etkMul:'Etki', eneMul:'Enerji', tradeMul:'Ticaret',
          hullMul:'Gövde', dipMul:'Diplomasi', opCost:'Casusluk bedeli',
          stab:'İstikrar', sensor:'Sensör menzili', shipSpeed:'Gemi üretimi',
          borderMul:'Sınır büyümesi', newColStab:'Yeni koloni istikrarı'
        };
        const arti = [], eksi = [];
        for (const mk in (P.e || {})){
          const v = P.e[mk];
          if (!v) continue;
          const ad = etiket[mk] || mk;
          const yazi = (mk === 'stab' || mk === 'sensor' || mk === 'newColStab')
            ? (v > 0 ? '+' : '') + v
            : (typeof FLAT_KEYS !== 'undefined' && FLAT_KEYS[mk])
              ? (v > 0 ? '+' : '') + v                 // FAZ 82
            : (v > 0 ? '+' : '−') + Math.round(Math.abs(v) * 100) + '%';
          (v > 0 ? arti : eksi).push(ad + ' ' + yazi);
        }
        const savasEg = P.warBias > .1 ? 'savaşçı'
                      : P.warBias < -.05 ? 'barışçı' : 'dengeli';
      h += `<button class="opt ${on?'on':''}" data-a="mizacSet" data-x="${k}">${P.ico} ${P.n}
        <small>${arti.length ? '<b style="color:#65e08a">' + arti.join(' · ') + '</b>' : ''}
        ${eksi.length ? '<br><b style="color:#ff9b3d">' + eksi.join(' · ') + '</b>' : ''}
        ${(!arti.length && !eksi.length) ? 'dengeli profil' : ''}
        <br><span style="opacity:.6">dış politika: ${savasEg}</span></small></button>`;
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
      /* ═══ FAZ 77A: ŞEFFAF İSTATİSTİK ═══
         Hikâye metninin yanına net sayılar. Oyuncu ne seçtiğini
         yüzdeyle görsün. */
      const st = [];
      if (P.habBonus) st.push('Yaşanabilirlik ' + (P.habBonus>0?'+':'') +
        Math.round(P.habBonus*100) + '%');
      if (P.growMul) st.push((P.makine ? 'Montaj ' : 'Büyüme ') +
        (P.growMul>0?'+':'') + Math.round(P.growMul*100) + '%');
      for (const mk in (P.e || {})){
        const v = P.e[mk];
        if (!v) continue;
        const ad = TRAIT_LABEL[mk] || mk;
        st.push(ad + ' ' + ((typeof FLAT_KEYS !== 'undefined' && FLAT_KEYS[mk])
            ? (v>0?'+':'') + v                       // FAZ 82: düz puan
            : (v>0?'+':'−') + Math.round(Math.abs(v)*100) + '%'));
      }
      if (P.yiyer === 'enerji')  st.push('Enerjiyle beslenir');
      if (P.yiyer === 'mineral') st.push('Mineralle beslenir');
      h += `<button class="opt ${on?'on':''}" data-a="physio" data-x="${k}">
        ${P.ico} ${P.n}<small>${st.length
          ? '<b style="color:#9fdcc9">' + st.join(' · ') + '</b>' : P.art}</small></button>`;
    }
    h += `</div>`;
    const sec = PHYSIO[c.physio || 'humanoid'];
    h += `<div class="box" style="border-color:#6ff2c8;margin-top:8px">
      <div class="bt"><span>${sec.ico} ${sec.n}</span></div>
      <div class="bd">${sec.d}<br><br>
        <b>Beslenme:</b> ${
          sec.yiyer === 'mineral' ? 'mineral (yiyecek tüketmez)' :
          sec.yiyer === 'enerji'  ? 'ENERJİ (yiyecek tüketmez)' : 'yiyecek'}
        ${sec.photo ? ' + fotosentez' : ''}<br>
        <b>Yaşanabilirlik:</b> ${sec.habBonus ? (sec.habBonus>0?'+':'') +
          Math.round(sec.habBonus*100) + '%' : 'temel'}<br>
        <b>Büyüme:</b> ${sec.growMul ? (sec.growMul>0?'+':'') +
          Math.round(sec.growMul*100) + '%' : 'normal'}
        ${sec.sever ? '<br><b>Sever:</b> ' + sec.sever.map(t=>PLANETS[t]?PLANETS[t].n:t).join(', ') : ''}
        ${sec.sevmez ? '<br><b>Yaşayamaz:</b> ' + sec.sevmez.map(t=>PLANETS[t]?PLANETS[t].n:t).join(', ') : ''}
      </div></div>`;
    h += `</div>`;
  
    /* FAZ 77A: özellik ekranının sayaçları */
    const spent       = traitCost(c.traits);
    const negS        = traitNegCount(c.traits);
    const negP        = traitNegGain(c.traits);
    const gercekKalan = TRAIT_BUDGET + negP - spent;

    /* ═══ FAZ 77A: GENETİK ÖZELLİKLER BURAYA TAŞINDI ═══
       KRİTİK BULGU: bu blok SETUP_STEP === 'tur' içindeydi ve o
       sekme Faz 72'de kaldırılmıştı — 28 genetik özellik ve arma
       stili oyuncuya HİÇ GÖRÜNMÜYORDU. */
    h += `<div class="sect"><h2>GENETİK ÖZELLİKLER</h2>
      <div class="traitbar">
        <span>PUAN <b style="color:${gercekKalan<0?'#ff5f6d':'#6ff2c8'}">${
          gercekKalan}</b> / ${TRAIT_BUDGET}</span>
        <span>özellik ${c.traits.length}/${TRAIT_MAX}</span>
        <span>olumsuz ${negS}/${TRAIT_NEG_COUNT} · kazanç +${negP}/${TRAIT_NEG_MAX}</span>
      </div>
      <div class="mini" style="margin:0 0 8px">Olumsuz özellikler puan
        kazandırır ama en fazla <b>${TRAIT_NEG_COUNT}</b> tane ve toplam
        <b>+${TRAIT_NEG_MAX}</b> puan alabilirsin. Zıt özellikler birlikte
        seçilemez.</div>
      <div class="grid g2">`;
    for (const k in TRAITS){
      const t = TRAITS[k], on = c.traits.includes(k);
      const chk = on ? {ok:true} : canPickTrait(c.traits, k);
      const kilit = !on && !chk.ok;
      /* Etkileri sayıyla dök — hikâye değil, matematik */
      const etki = [];
      for (const mk in (t.e || {})){
        const v = t.e[mk];
        if (!v) continue;
        const ad = (typeof TRAIT_LABEL !== 'undefined' && TRAIT_LABEL[mk]) || mk;
        /* FAZ 82: düz puan anahtarları yüzdeye çevrilmez */
        etki.push(ad + ' ' + ((typeof FLAT_KEYS !== 'undefined' && FLAT_KEYS[mk])
          ? (v > 0 ? '+' : '') + v
          : (v > 0 ? '+' : '−') + Math.round(Math.abs(v) * 100) + '%'));
      }
      h += `<button class="tchip ${on?'on':''} ${kilit?'dis':''}"
        data-a="trait" data-x="${k}"
        ${kilit ? 'title="' + esc(chk.why || '') + '"' : ''}>
        <span class="tc" style="color:${t.c<0?'#65e08a':'#f2d452'}">${
          t.c > 0 ? '−' + t.c : '+' + (-t.c)}</span>
        <div class="tn">${t.n}</div>
        <div class="td">${etki.length
          ? '<b style="color:' + (t.c<0?'#ff9b3d':'#9fdcc9') + '">' +
            etki.join(' · ') + '</b>'
          : t.d}</div>
        ${kilit ? '<div class="td" style="color:#ff5f6d;font-size:9px">' +
          esc(chk.why || '') + '</div>' : ''}</button>`;
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
    /* ═══ FAZ 77B: YUVA GÖSTERGESİ ═══ */
    const kullanilan = civicUsed(c.civics);
    const radikalSecili = c.civics.find(k => isRadical(k));
    h += `<div class="sect"><h2>CIVIC — YÖNETİM İLKELERİ</h2>
      <div class="traitbar">
        <span>YUVA <b style="color:${kullanilan>=CIVIC_SLOTS?'#f2d452':'#6ff2c8'}">${
          kullanilan}</b> / ${CIVIC_SLOTS}</span>
        <span>⚡ radikal = 2 yuva</span>
      </div>
      <div class="mini" style="margin:0 0 8px">İki normal politika ya da
        <b>tek bir ⚡ radikal</b> seçebilirsin. Radikaller oyunun kurallarını
        büker — güçlüdürler ama ağır bir bedelle gelirler.</div>`;
    if (radikalSecili)
      h += `<div class="mini" style="color:#ff9b3d;margin-bottom:8px">
        ⚡ ${esc(CIVICS[radikalSecili].n)} iki yuvayı da kaplıyor —
        başka politika seçemezsin.</div>`;
    h += `<div class="grid g2">`;
    for (const k in CIVICS){
      const cv = CIVICS[k], on = c.civics.includes(k);
      const chk = on ? {ok:true} : canPickCivic(c.civics, k);
      const kilit = !on && !chk.ok;
      /* Sayısal etkiler — hikâye değil matematik */
      const etki = [];
      for (const mk in (cv.e || {})){
        const v = cv.e[mk];
        if (!v) continue;
        const ad = (typeof TRAIT_LABEL !== 'undefined' && TRAIT_LABEL[mk]) || mk;
        etki.push(ad + ' ' + (mk === 'sensor'
          ? (v>0?'+':'') + v
          : (typeof FLAT_KEYS !== 'undefined' && FLAT_KEYS[mk])
            ? (v>0?'+':'') + v                       // FAZ 82: düz puan
            : (v>0?'+':'−') + Math.round(Math.abs(v)*100) + '%'));
      }
      h += `<button class="card civ ${on?'on':''} ${cv.sars?'sars':''} ${kilit?'dis':''}"
        data-a="civic" data-x="${k}"
        ${kilit ? 'title="' + esc(chk.why || '') + '"' : ''}>
        <div class="cn"><span class="civIco">${cv.ico}</span>
        <span style="color:${cv.sars?'#ff9b3d':'#6ff2c8'}">${cv.n}</span>
        ${cv.sars?'<span class="sarsTag">⚡ 2 YUVA</span>':''}</div>
        <div class="cd">${cv.d}
          ${etki.length ? '<br><b style="color:#9fdcc9">' + etki.join(' · ') + '</b>' : ''}
          ${cv.bedel ? '<br><b style="color:#ff5f6d">BEDEL:</b> ' +
            '<span style="color:#ff9b3d">' + cv.bedel + '</span>' : ''}
          ${kilit ? '<br><b style="color:#ff5f6d">' + esc(chk.why||'') + '</b>' : ''}
        </div>
      </button>`;
      /* Tek Ürün seçiliyse hemen altında kaynak seçimi */
      if (on && k === 'tek_urun'){
        h += `<div class="box" style="grid-column:1/-1;border-color:#ff9b3d">
          <div class="bt"><span>💎 Hangi kaynak?</span></div>
          <div class="bd">Seçtiğin <b>+%60</b>, diğer ikisi <b>−%40</b>.</div>
          <div class="act2">`;
        [['ene','⚡ Enerji'],['min','⛏ Maden'],['yiy','🌾 Yiyecek']].forEach(([rk, ad]) => {
          h += `<button class="abtn ${(c.monoRes||'min')===rk?'pri':''}"
            data-a="monoRes" data-x="${rk}">${ad}</button>`;
        });
        h += `</div></div>`;
      }
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
  /* ═══ FAZ 80: ÖLÜ ÖZET SATIRLARI KALDIRILDI ═══
     "Tür: Sözleşme" satırı Faz 72'de silinen TÜR sekmesinden
     kalmıştı — ırk artık doktrinden türetiliyor, oyuncu bunu
     hiç seçmiyor. "İdeoloji: Tarafsız" da etik sekmesindeki
     bilgiyi tekrar ediyordu. İkisi de özetten çıkarıldı;
     doktrin/fizyoloji/etik satırları zaten aşağıda duruyor. */
  /* ═══ FAZ 61: ÖZET SATIRI SAĞLAMLAŞTIRMA ═══
     Şablondan gelen ya da elle bozulmuş bir anahtar (örn. eski
     sürümden kalma look/origin adı) burada tanımsız dönüp tüm
     kurulum ekranını çökertiyordu. Artık her arama korumalı. */
  const gv = (tbl, key, yedek) => (tbl && tbl[key] && tbl[key].n) || yedek || '—';
  h += `<div class="sumRow"><span>Civic</span><b>${c.civics.length
    ? c.civics.map(k => gv(CIVICS, k, k)).join(' · ') : '—'}</b></div>`;
  h += `<div class="sumRow"><span>Görünüş</span><b>${gv(LOOKS, c.look, 'Bilinmiyor')}</b></div>`;
  h += `<div class="sumRow"><span>Köken</span><b>${gv(ORIGINS, c.origin, 'Bilinmiyor')}</b></div>`;
  h += `<div class="sumRow"><span>Galaksi</span><b>${gv(SIZES, c.size)} · ${
    gv(SHAPES, c.shape)} · ${gv(DIFFS, c.diff)}</b></div>`;
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
  /* ═══ FAZ 67: ŞABLON BUTONLARI ═══
     KÖK NEDEN: tplSave/tplLoad/tplDel yalnız UI.act() içinde
     tanımlıydı. Kurulum ekranı UI.act'ı HİÇ ÇAĞIRMIYOR — kendi
     if/else zincirini kullanıyor. Butonlar bu yüzden ölüydü. */
  if (a === 'tplSave'){
    saveTemplate().then(ad => { say('💾 "' + ad + '" şablonu kaydedildi');
      safeRenderSetup(); });
    return;
  }
  if (a === 'tplLoad'){
    const t = TEMPLATES.find(q => q && q._ad === x);
    if (t && applyTemplate(t)) say('📂 "' + x + '" şablonu yüklendi');
    else say('Şablon bulunamadı', 'war');
    safeRenderSetup();
    return;
  }
  if (a === 'tplDel'){
    e.stopPropagation();
    deleteTemplate(x).then(() => { say('Şablon silindi: ' + x); safeRenderSetup(); });
    return;
  }
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
  else if (a === 'monoRes'){
    CFG.monoRes = x;                      // FAZ 77B: tek ürün seçimi
    safeRenderSetup();
  }
  else if (a === 'step'){ SETUP_STEP = x; $('menu').scrollTop = 0; safeRenderSetup(); }
  else if (a === 'sigil'){ CFG.sigil = x; safeRenderSetup(); }
  else if (a === 'look'){ CFG.look = x; safeRenderSetup(); }
  else if (a === 'mizacSet'){
    CFG.mizac = x;
    /* FAZ 72: doktrin ırkı da belirler (TÜR sekmesi kaldırıldı) */
    if (typeof DOCTRINE_RACE !== 'undefined' && DOCTRINE_RACE[x] &&
        RACES[DOCTRINE_RACE[x]]) CFG.race = DOCTRINE_RACE[x];
    safeRenderSetup();
  }
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
    /* FAZ 77B: yuva kuralı canPickCivic'te — radikal iki yuva kaplar */
    const i = CFG.civics.indexOf(x);
    if (i >= 0){
      CFG.civics.splice(i, 1);
      if (x === 'tek_urun') delete CFG.monoRes;
    } else {
      const chk = canPickCivic(CFG.civics, x);
      if (!chk.ok){ say(chk.why, 'war'); return; }
      CFG.civics.push(x);
      if (x === 'tek_urun' && !CFG.monoRes) CFG.monoRes = 'min';
    }
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
      /* FAZ 83.3: panel/menü yıldız alanı ölçüsü — merkezî
         yöneticiye abone. İşlev korunuyor, yalnız dinleyici
         tek noktada toplanıyor. */
      this._onResize = () => this.resize();
      if (typeof onResize === 'function') onResize('menuField', this._onResize);
      else window.addEventListener('resize', this._onResize);
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

