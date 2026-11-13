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

  jointPanel(recipient=null,surface='fleet'){
    if(this._jointWorld!==G.sys){this._jointWorld=G.sys;this._jointFeedback='';this._jointExpanded={};}
    const previous=document.querySelector('.jointOps[data-surface="'+surface+'"]');
    if(previous)this._jointExpanded[surface]=previous.open;
    const expanded=!!this._jointExpanded[surface];
    const e=G.p,plans=jointView(e),names={capture:'Sistemi ele geçir',defend:'Bölgeyi savun',follow:'Filomu izle / destekle'},
      states={gather:'Toplanıyor',march:'Yola çıktı',defend:'Savunuyor',done:'Görev tamamlandı',cancelled:'Görev iptal edildi'};
    const allies=G.emps.filter(o=>o.id!==e.id&&o.ai&&e.contact[o.id]&&jointBinding(e,o)&&
      (recipient===null||recipient===o.id));
    const fleet=View.sel&&View.sel.e===e.id&&isArmed(View.sel)?View.sel:null;
    const sys=View.selSys&&View.selSys.seen.includes(e.id)?View.selSys:null;
    let h=`<details class="dcDetails jointOps" data-surface="${surface}" data-recipient="${recipient??''}" ${expanded?'open':''} style="overflow-wrap:anywhere;max-width:100%"><summary style="min-height:44px;padding:10px 0">⚔ Ortak askerî koordinasyon</summary>
      <div class="mini">Bu emirler destek talebidir; yabancı filoların kontrolü müttefikte kalır. 1. Haritadan kendi savaş filonu veya bilinen sistemi seç. 2. Aşağıdan müttefik ve talep türünü seç. 3. Hedefi incele ve talebi gönder. Müttefik yalnız aynı kabul edilmiş savaş seferinde, savunması ve ikmali uygunsa katılır.</div>
      <button class="abtn" data-a="jointChooseTarget">HARİTADAN FİLO / SİSTEM SEÇ</button>
      ${allies.length?'':'<div class="mini">Uygun askerî destek bağı bulunan, tanıdığın AI müttefik yok. İttifak / federasyon tek başına aynı savaşa katılım sayılmaz.</div>'}`;
    if(this._jointFeedback)h+=`<div class="box" role="status">${esc(this._jointFeedback)}</div>`;
    for(const o of allies){
      const shared=(G.warLedger?.fronts||[]).some(f=>f.ended===null&&f.sides.includes(e.id)&&warLedgerPair(...f.sides)&&
        jointContext(f.campaign,f.roles[f.sides.indexOf(e.id)],e.id,f.sides.find(id=>id!==e.id))?.members.includes(o.id));
      if(!shared){h+=`<div class="box"><b>${esc(o.name)}</b><div class="mini">Aynı geçerli savaş seferinde değil; talep gönderilemez.</div></div>`;continue;}
      const known=sys&&aiKnownSystem(e,sys),enemy=known&&e.war[known.owner];
      h+=`<div class="box"><b>${esc(o.name)}</b><div class="act2">
        <button class="abtn" style="min-height:44px;white-space:normal" data-a="jointPrepare" data-x="${o.id}:follow:${fleet?fleet.id:-1}" ${fleet?'':'disabled'}>FİLOMU DESTEKLE</button>
        <button class="abtn" style="min-height:44px;white-space:normal" data-a="jointPrepare" data-x="${o.id}:capture:${sys?sys.id:-1}" ${enemy?'':'disabled'}>SİSTEMİ ELE GEÇİR</button>
        <button class="abtn" style="min-height:44px;white-space:normal" data-a="jointPrepare" data-x="${o.id}:defend:${sys?sys.id:-1}" ${known&&known.owner>=0&&jointBinding(e,G.emps[known.owner])?'':'disabled'}>BÖLGEYİ SAVUN</button>
      </div><div class="mini">Filo: ${fleet?esc(fleet.name||'Seçili filo'):'kendi savaş filonu seç'} · Sistem: ${sys?esc(sys.name):'bilinen sistem seç'}</div>
      <div class="mini">${fleet?'':'Filoyu desteklemek için kendi savaş filonu seç. '}${enemy?'':'Ele geçirmek için bilinen düşman sistemi seç. '}${known&&known.owner>=0&&jointBinding(e,G.emps[known.owner])?'':'Savunmak için dost sistemi seç.'}</div></div>`;
    }
    for(const p of plans){
      if(recipient!==null&&!p.members.includes(recipient))continue;
      const where=id=>id===null?'Bilinen konum bildirilmedi':esc(G.sys[id].name);
      h+=`<div class="box"><b>${names[p.kind]} · ${states[p.state]}</b>
        <div class="mini">Hedef: ${where(p.target)} · Toplanma: ${where(p.rally)}</div>
        <div class="mini">${esc(p.reason)}</div><div class="mini">Bilinen ortaklar: ${p.members.map(id=>esc(G.emps[id].name)).join(', ')}</div>
        ${Object.entries(p.responses).map(([id,r])=>`<div class="mini">${esc(G.emps[id].name)}: ${esc(r)}</div>`).join('')}
        ${p.fleets.map(f=>`<div class="mini">${esc(G.emps[f.owner].name)} · ${esc(f.name)}${f.waiting?' · Müttefik bekleniyor':''}${f.eta===null?' · ETA bildirilmedi':' · Yaklaşık '+Math.ceil(f.eta)+' oyun günü'}</div>`).join('')}
        <div class="mini">Yalnız sensörlerinde görülen destek filoları listelenir. Gizli filo konumu, kesin gücü ve ETA gösterilmez.</div>
        ${p.requester===0&&!['done','cancelled'].includes(p.state)?`<button class="abtn" style="min-height:44px;white-space:normal" data-a="jointCancel" data-x="${p.id}">DESTEK TALEBİNİ İPTAL ET</button>`:''}</div>`;
    }
    return h+'</details>';
  },

  jointPrepare(x){
    if(this._jointWorld!==G.sys)return;
    const [id,kind,target]=String(x).split(':'),other=G.emps[+id];
    if(!other||!['follow','capture','defend'].includes(kind))return;
    const fleet=kind==='follow'?G.fleets.find(f=>f.id===+target&&f.e===G.p.id&&isArmed(f)):null;
    const sys=kind==='follow'?null:G.sys[+target];
    if(kind==='follow'?!fleet:!sys?.seen.includes(G.p.id))return;
    const world=G.sys,player=G.p,token={};this._jointSendToken=token;
    this.openModal(`<div class="mhd">MÜTTEFİK DESTEK TALEBİ</div><div class="mbd"><div class="row"><span>Müttefik</span><b>${esc(other.name)}</b></div>
      <div class="row"><span>Talep</span><b>${{follow:'Filomu destekle',capture:'Sistemi ele geçir',defend:'Bölgeyi savun'}[kind]}</b></div>
      <div class="row"><span>Hedef</span><b>${esc(fleet?.name||sys?.name||'Filo')}</b></div>
      <div class="mini">Bu bir koordinasyon talebidir. Gönderildiğinde gerçek güç, rota, ikmal ve savaş yükümlülüğü yeniden değerlendirilir. Ret / hazırlık gerekçesi ortak askerî koordinasyon bölümünde görünür.</div></div>
      <div class="mft"><button class="ch" data-a="jointSend">TALEBİ GÖNDER</button><button class="ch" data-a="closem">VAZGEÇ</button></div>`);
    this._jointSendToken=token;
    this._hook('jointSend',()=>{if(this._jointSendToken!==token||G.sys!==world||G.p!==player)return;this._jointSendToken=null;this.closeModal();this.act('jointRequest',x);});
  },
  refreshJointPanels(){
    const pane=$('diploPane');if(!pane.classList.contains('show'))return;
    const block=pane.querySelector('.jointOps');if(!block)return;
    const key=[Math.floor(G.day/5),G.jointOps?.next,View.sel?.id,View.selSys?.id,block.dataset.surface,block.dataset.recipient].join(':');
    if(this._jointRenderKey===key&&this._jointRenderWorld===G.sys)return;
    this._jointRenderKey=key;this._jointRenderWorld=G.sys;
    const body=pane.querySelector('.dcBody'),scroll=body?body.scrollTop:0;
    block.outerHTML=this.jointPanel(block.dataset.recipient===''?null:+block.dataset.recipient,block.dataset.surface);
    if(body)body.scrollTop=scroll;
  },
  planetFolds(){
    if(this._planetWorld!==G.sys){this._planetWorld=G.sys;this._planetFolds=new Set();}
    return this._planetFolds;
  },
  fleetCompositionMenu(f){
    if(!f || fleetDeliveryTarget(G.p,f)===null || hasShipment(f) || f.federal || f.guardLocked)return;
    const token=this._compositionSeq=(this._compositionSeq||0)+1;
    const counts=f.composition?{...f.composition.counts}:{};
    if(!f.composition)for(const sh of f.ships)if(fleetTemplateClasses().includes(sh.c))counts[sh.c]=(counts[sh.c]||0)+1;
    const speed=G.speed;
    this.openModal(`<div class="mhd">FİLO BİLEŞİMİ · ${esc(f.name||'Filo')}</div><div class="mbd">
      <div class="mini">Her sınıfın hedef sayısını yaz. Toplam en fazla ${FLEET_TEMPLATE_LIMIT} gemi.
      Kaydetmek sipariş vermez. Tek takviye emri en fazla 30 gemi sipariş eder. Mevcut gemiler ve ödenmiş siparişler korunur; fazlalık varken yeni üretim yapılmaz.</div>
      <div class="mini">Kilitli sınıfı gelecekteki hedef olarak yazabilirsin; araştırması açılmadan yeni üretime alınmaz. Sınıflar otomatik ikame edilmez. Başlangıç / eski kayıttaki mevcut gemiler korunur.</div>
      ${fleetTemplateClasses().map(c=>{const access=shipBuildAccess(G.p,c);return `<div class="box">
        <label for="fc-${c}" class="row"><span>${esc(SHIPS[c].n)}</span>
        <input id="fc-${c}" type="number" inputmode="numeric" min="0" max="${FLEET_TEMPLATE_LIMIT}" step="1"
          value="${counts[c]||0}" style="width:80px;min-height:44px;font-size:16px" aria-label="${esc(SHIPS[c].n)} hedef sayısı"></label>
        ${access.ok?'<div class="mini">Yeni üretime açık</div>':'<div class="mini">🔒 Yeni üretim kapalı · '+esc(access.why)+'</div>'}</div>`;}).join('')}
      <label style="display:flex;gap:10px;align-items:center;min-height:44px"><input id="fc-auto" type="checkbox"
        ${f.composition&&f.composition.auto?'checked':''}> Otomatik takviye</label>
      <div class="mini">Açıkken eksikler küçük partilerle tamamlanır. Kasa / donanma kapasitesi sınırında bekler.
      Kapatmak verilmiş siparişleri iptal etmez.</div>
      </div><div class="mft"><button class="ch" data-a="closem">VAZGEÇ</button>
      <button class="ch" style="min-height:44px" data-a="compositionSave" data-x="${token}">BİLEŞİMİ KAYDET</button></div>`);
    this._compositionPending={token,f,speed,world:G.sys};
  },
  compositionPanel(f,r){
    if(!r.rows)return '';
    return `<div class="ph">SINIF BAZLI BİLEŞİM</div>`+r.rows.filter(x=>x.target||x.current||x.queued||x.inTransit).map(x=>
      `<div class="box"><div class="bt"><span>${esc(SHIPS[x.cls].n)}</span><b>${x.current} / ${x.target}</b></div>
       <div class="mini">Üretimde / sırada: ${x.queued} · Yolda / bekliyor: ${x.inTransit}${x.waiting?' ('+x.waiting+' bekliyor)':''}</div>
       <div class="mini">Eksik: ${x.missing}${x.excess?' · Fazla: '+x.excess:''}${x.missing&&!x.buildable?' · '+esc(x.why):''}</div></div>`).join('')+
      `<div class="mini">${esc(r.auto?(f.composition?.reason||'Otomatik takviye hazırlanıyor'):'Otomatik üretim kapalı')}</div><button class="abtn" style="min-height:44px" data-a="compositionAuto" data-x="${f.id}">OTOMATİK TAKVİYE: ${r.auto?'AÇIK':'KAPALI'}</button>
       <div class="mini">Otomatik üretim kasa / kapasite sınırında bekler. Siparişler ve bekleyen sevkiyatlar eksikten düşülür.</div>`;
  },
  shipmentMenu(f){
    if(!f || f.e!==0 || !G.fleets.includes(f) || !hasShipment(f))return;
    const token=this._shipmentSeq=(this._shipmentSeq||0)+1;
    const choices=[];
    for(const x of G.fleets)if(x!==f && x.e===0 && x.ships.length && !hasShipment(x))
      choices.push({target:{fleet:x.id},label:'Filo: '+(x.name||x.id)});
    for(const x of G.sys)if(x.seen.includes(0))choices.push({target:{sys:x.id},label:'Sistem: '+x.name});
    const speed=G.speed;
    this.openModal(`<div class="mhd">SEVKİYATI YÖNET</div><div class="mbd">
      ${this.shipmentRow(f,false)}
      <div class="mini">İptal, tamamlanmış gemileri korur; kaynak iadesi yapmaz. Yolculuk başladıysa mevcut bacak tamamlanır. Yeni hedefe giden rota kapalıysa gemiler bekler.</div>
      <button class="abtn" data-a="shipmentApply" data-x="${token}:retry">YENİDEN DENE</button>
      <button class="abtn" data-a="shipmentApply" data-x="${token}:cancel">SEVKİYATI İPTAL ET</button>
      <div class="ph">YENİ HEDEF</div>
      ${choices.map((c,i)=>`<button class="abtn" data-a="shipmentApply" data-x="${token}:${i}">${esc(c.label)}</button>`).join('')}
      </div><div class="mft"><button class="ch" data-a="closem">VAZGEÇ</button></div>`);
    this._shipmentPending={token,f,choices,speed,world:G.sys};
  },
  queueDeliveryText(sys,q){
    const d=Object.hasOwn(q,'delivery')?q.delivery:sys.rally?.[q.e];
    const target=d?.fleet!==undefined?G.fleets.find(f=>f.id===d.fleet&&f.e===q.e&&f.ships.length):null;
    const label=d?.fleet!==undefined?(target?.name||'Hedef filo bulunamadı'):d?.sys!==undefined?(G.sys[d.sys]?.name||'Geçersiz sistem'):'Tersanede kalır';
    const access=shipBuildAccess(G.emps[q.e],q.cls);
    return 'Kaynak tersane: '+sys.name+' · Hedef: '+label+' · '+(d?.hold?'BEKLETİLİYOR — ödenmiş sipariş korunuyor':access.ok?'Üretim sürüyor':access.why)+(d?.fleet!==undefined?' · Özel filo hedefi; genel ralli gerekmez':'');
  },
  shipmentRow(f,action=true){
    const d=f.shipment||{},target=d.fleet??f.joinFleet,main=G.fleets.find(x=>x.id===target&&x.e===f.e&&x.ships.length);
    const label=target!==undefined?(main?.name||'Hedef filo bulunamadı'):(G.sys[d.sys??f.rallyTo]?.name||'Geçersiz sistem');
    return `<div class="box shipmentInfo"><div class="mini">Kaynak tersane: ${esc(G.sys[d.origin]?.name||'Eski kayıtta kaynak belirtilmemiş')} · Hedef: ${esc(label)}</div>
      <div class="mini">${f.ships.length} gemi · ${esc(shipmentStatus(f))}</div>${action?`<button class="abtn" data-a="shipmentMenu" data-x="${f.id}">SEVKİYATI YÖNET</button><div class="mini">Yeniden dene · hedef değiştir · iptal et</div>`:''}</div>`;
  },
  reinforcementJobs(f){
    let h='';
    for(const sys of G.sys){
      const groups=new Map();
      for(const q of sys.queue||[]){const d=Object.hasOwn(q,'delivery')?q.delivery:sys.rally?.[f.e];
        if(q.e!==f.e||d?.fleet!==f.id)continue;
        const group=groups.get(q.cls)||{q,n:0};group.n++;groups.set(q.cls,group);
      }
      for(const {q,n} of groups.values())h+=`<div class="box"><b>${n} × ${esc(SHIPS[q.cls].n)}</b><div class="mini">${esc(this.queueDeliveryText(sys,q))}</div></div>`;
    }
    return h;
  },
  shipCancelDialog(sys,orders,all){
    const quote=shipCancellationQuote(G.p,sys,orders);
    if(!quote.ok){say(quote.why,'war');return;}
    const token=this._shipCancelConfirmSeq=(this._shipCancelConfirmSeq||0)+1;
    const speed=G.speed;
    const refund=Object.entries(quote.refund).map(([r,v])=>RES[r].ico+' '+v).join(' · ')||'Yok';
    this.openModal(`<div class="mhd"><span>GEMİ ÜRETİMİNİ İPTAL ET</span></div>
      <div class="mbd"><div class="lead">${quote.count} geminin üretimi iptal edilecek.</div>
      <div class="row"><span>Kaynak iadesi</span><b>${esc(refund)}</b></div>
      <div class="mini">Yeni siparişlerin ödenmiş bedeli tamamen iade edilir; üretim ilerlemesi kaybolur.</div>
      ${quote.legacy?'<div class="mini" style="color:#ff9b3d">'+quote.legacy+' eski siparişin ödeme kaydı yok. Bu işler iptal edilirse kaynak iadesi yapılmaz.</div>':''}
      ${all?'<div class="mini">Bu tersanenin sürekli üretim döngüsü de kapanır. Diğer tersaneler ve yoldaki gemiler etkilenmez.</div>':''}</div>
      <div class="mft"><button class="ch" data-a="closem"><div class="cht">Vazgeç</div></button>
      <button class="ch" data-a="shipCancelConfirm" data-x="${token}"><div class="cht">${all?'TÜMÜNÜ':'SİPARİŞİ'} İPTAL ET</div></button></div>`);
    this._shipCancelPending={token,sys,orders:orders.slice(),all,speed};
  },

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
       <!-- ═══ FAZ 82 + 86C.4H-R2: TEK AKORDİYON ═══
            ÜÇ ANA MOD (aynı anda yalnız biri) ve bağımsız
            KATMAN (her biri ayrı aç/kapat) açıkça ayrıldı.
            Savaş + Radar + Lojistik aynı anda açık olabilir. -->
       <div class="toolGrp" id="grpMap">
         <button class="tool grpHead" data-a="grpTog" data-x="map"
           title="Harita ve görünüm modları">🗺<i class="grpDot" id="mapDot">🌐</i></button>
         <div class="grpOut" id="outMap">
           <div class="modeHdr" id="mainModeHdr">ANA MOD</div>
           <button class="tool mapMode" id="mm_siyasi" data-a="mapMode" data-x="siyasi"
             title="Devlet renkleri ve sınırlar">🌐<span>Siyasi</span></button>
           <button class="tool mapMode" id="mm_diplomasi" data-a="mapMode" data-x="diplomasi"
             title="Dost, düşman, tarafsız">🤝<span>Diplomatik</span></button>
           <button class="tool mapMode" id="mm_savas" data-a="mapMode" data-x="savas"
             title="Husumet ağı">🔥<span>Savaş</span></button>
           <div class="mini" style="max-width:170px;white-space:normal" title="Yalnız taranmış son gözlem; uygunluk en az %35. Görünmeyen güncel durum bilinmez.">◇ Uygun boş dünya · ■ Yerleşilmiş uygun dünya</div>
           <div class="modeHdr" id="layerHdr">KATMANLAR (bağımsız)</div>
           <button class="tool${FED_LINKS_ON?' on':''}" id="fedLinksBtn" data-a="fedLinksToggle" aria-pressed="${FED_LINKS_ON}" title="Bilinen federasyon üyelikleri · altın kesik çizgi">⬡<span>Federasyonlar</span></button>
           <button class="tool${ALLY_LINKS_ON?' on':''}" id="allyLinksBtn" data-a="allyLinksToggle" aria-pressed="${ALLY_LINKS_ON}" title="Bilinen ittifaklar · yeşil kesik çizgi">↔<span>İttifaklar</span></button>
           <button class="tool warLinksBtn${WAR_LINKS_ON?' on':''}" id="warLinksBtn" data-a="warLinksToggle"
             aria-pressed="${WAR_LINKS_ON}" title="Savaş bağlantı çizgileri — Savaşlar harita renginden bağımsız aç/kapat">⚔<span>Savaş hatları</span></button>
           <button class="tool logiBtn" id="logiBtn" data-a="logiToggle"
             title="İkmal hatları, menzil ve tedarik — ana moddan bağımsız aç/kapat">⚓<span>Lojistik</span></button>
           <button class="tool radarBtn" id="radarBtn" data-a="radarTog"
             title="Filo hareketleri ve ralli hatları — ana moddan bağımsız aç/kapat">🚀<span>Radar</span></button>
           <button class="tool fleetNamesBtn${FLEET_NAMES_ON?' on':''}" id="fleetNamesBtn" data-a="fleetNamesToggle"
             aria-pressed="${FLEET_NAMES_ON}" title="Görünen filoların hangi devlete ait olduğunu göster — bağımsız aç/kapat">🏷<span>Filo sahipleri</span></button>
         </div>
       </div>

       <!-- AKORDİYON: DEVLET VE DİPLOMASİ -->
       <div class="toolGrp" id="grpEmp">
         <button class="tool grpHead" data-a="grpTog" data-x="emp"
           title="İmparatorluk">👑</button>
         <div class="grpOut" id="outEmp">
           <button class="tool" id="impBtn" data-a="globalPane" data-x="imp"
             title="Devlet">👑<span>Devlet</span></button>
           <button class="tool" id="coloniesBtn" data-a="colonies" title="Gezegenler / Habitatlar">🌍<span>Gezegenler / Habitatlar</span></button>
           <button class="tool" id="bilimBtn" data-a="globalPane" data-x="bilim"
             title="Bilim">✦<span>Bilim</span></button>
           <button class="tool" data-a="news" title="Galaktik Haberler">📰<span>Haberler</span></button>
           <button class="tool" data-a="diplomaticInbox" title="Kalıcı diplomatik gelen kutusu">✉<span>Gelen kutusu</span></button>
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
      if (!el || el.disabled) return;
      if(this.constructionClickBlocked(el,e)){e.preventDefault();e.stopImmediatePropagation();return;}
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
      this.seltag();
    });
    // Register once with boot; resizing a map surface does not add UI listeners.
    const placeMenus = () => this.positionToolMenus();
    onResize('tool-menus', placeMenus);
    $('tools').addEventListener('scroll', placeMenus, {passive:true});
    if (window.visualViewport && window.visualViewport.addEventListener){
      window.visualViewport.addEventListener('resize', placeMenus, {passive:true});
      window.visualViewport.addEventListener('scroll', placeMenus, {passive:true});
    }
    this.bindTopbarInput();
    this.tab('sistem');
  },

  /* 86C.5.1: menus fit between the resource bar and bottom controls.
     Use CSS geometry only; this never resizes or redraws the map canvas. */
  positionToolMenus(){
    const vv = window.visualViewport;
    const vx = vv ? (vv.offsetLeft || 0) : 0;
    const vy = vv ? (vv.offsetTop || 0) : 0;
    const vw = vv && vv.width > 0 ? vv.width : window.innerWidth;
    const vh = vv && vv.height > 0 ? vv.height : window.innerHeight;
    if (!(vw > 0 && vh > 0)) return;
    const margin = 8;
    for (const [menuId, groupId] of [['outMap','grpMap'], ['outEmp','grpEmp']]){
      const menu = $(menuId), group = $(groupId);
      if (!menu || !menu.classList.contains('open') || !group) continue;
      const button = group.querySelector('.grpHead');
      if (!button) continue;
      const r = button.getBoundingClientRect();
      // MP.8.9: DOM rectangles are screen CSS pixels; fixed flyouts inherit the tools' local zoom.
      const zoom = this.getUIScale ? this.getUIScale().effective / 100 : 1;
      let top = vy + margin, bottom = vy + vh - margin;
      const bar = $('topbar');
      if (bar){
        const b = bar.getBoundingClientRect();
        if (b.height > 0 && b.bottom > vy && b.top < bottom)
          top = Math.max(top, b.bottom + margin);
      }
      const left = Math.max(vx + margin, Math.min(r.right + 6, vx + vw - 56));
      menu.style.maxWidth = Math.max(1, vx + vw - margin - left) / zoom + 'px';
      const width = menu.offsetWidth * zoom;
      for (const id of ['timepod','seltag']){
        const control = $(id);
        if (!control || control.classList.contains('hidden')) continue;
        const b = control.getBoundingClientRect();
        if (b.width > 0 && b.height > 0 && b.right > left &&
            b.left < left + width && b.top > top && b.top < bottom)
          bottom = b.top - margin;
      }
      menu.style.maxHeight = Math.max(1, bottom - top) / zoom + 'px';
      const height = menu.offsetHeight * zoom;
      // Center the flyout around its button instead of extending down from it.
      menu.style.left = left / zoom + 'px';
      menu.style.top = Math.max(top, Math.min(r.top + r.height/2 - height/2,
                                             bottom - height)) / zoom + 'px';
    }
  },

  act(a, x, el){
    if(typeof WarCenterUI!=='undefined'&&WarCenterUI.act(a,x))return;
    if(typeof ColonyUI!=='undefined'&&ColonyUI.act(a,x))return;
    if(typeof ArchiveUI!=='undefined'&&ArchiveUI.act(a,x,el))return;
    /* FAZ 19: her arayüz eylemi yumuşak bir dokunuş sesi verir.
       Mute butonu hariç — kendi geri bildirimini kendi veriyor. */
    if (typeof AUDIO !== 'undefined' && a !== 'mute'){
      try { AUDIO.play('tap'); } catch(err){}
    }
    switch(a){
      case 'tab': if($('diploPane').classList.contains('show'))this.act('closeDiplo');this.tab(x); break;
      case 'spd': this.setSpeed(+x); break;
      case 'full': forceFullscreen(); break;   // FAZ 54: senkron yol
      case 'cameraReset': View.resetCamera(); this.saveMenu(); break;
      case 'cameraFocus': if(!View.focusSelection())this.alert('Önce bir sistem veya filo seç'); break;
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
      case 'topStatus': this.openTopStatus();break;
      case 'dismissBattleReport': {
        const s=G.sys[+x],key=battleReportViewKey(s);
        if(key&&pSeen(s)&&el?.dataset.report===key){G.dismissedBattleReports=cleanBattleDismissals({...G.dismissedBattleReports,[s.id]:key});this.refresh();}
        break;
      }
      case 'activeWars': WarCenterUI.open(); break;   // MP.7.5
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
      case 'compositionEdit': this.fleetCompositionMenu(G.fleets.find(f=>f.id===+x));break;
      case 'compositionSave': {
        const p=this._compositionPending;
        if(!p || String(p.token)!==String(x) || p.world!==G.sys)break;
        const counts={};for(const c of fleetTemplateClasses())counts[c]=Number($('fc-'+c).value);
        const r=setFleetTemplate(G.p,p.f,counts,!!$('fc-auto').checked);
        if(!r.ok){say(r.why,'war');break;}
        this.closeModal();say('Filo bileşimi kaydedildi');this.keepScroll=true;this.refresh();break;
      }
      case 'compositionAuto': {
        const f=G.fleets.find(f=>f.id===+x);
        if(f&&f.composition){const r=setFleetTemplate(G.p,f,f.composition.counts,!f.composition.auto);if(!r.ok)say(r.why,'war');}
        this.keepScroll=true;this.refresh();break;
      }
      case 'reinf': {
        const fl=G.fleets.find(q=>q.id===+x),r=reinforceFleet(G.p,fl);
        if(!r.ok)say(r.why,'war');
        else {
          const summary={};for(const q of r.orders)summary[q.cls]=(summary[q.cls]||0)+1;
          say('⚓ Takviye siparişi — '+Object.entries(summary).map(([c,n])=>n+' × '+SHIPS[c].n).join(', ')+
            (r.kalan?' · kalan eksik '+r.kalan:' · tüm eksikler siparişte/yolda'),'sci');
          this._reinforcementReceipt={f:fl,world:G.sys,orders:r.orders};
        }
        this.keepScroll=true;this.refresh();break;
      }
      case 'planetFold': {
        const [sid,pid]=String(x).split(':').map(Number),sys=G.sys[sid];
        if(!sys || !sys.planets.some(p=>p.i===pid&&p.col))break;
        const key=sid+':'+pid,folds=this.planetFolds();
        if(folds.has(key))folds.delete(key);else folds.add(key);
        this.keepScroll=true;this.refresh();break;
      }
      case 'shipmentMenu': this.shipmentMenu(G.fleets.find(f=>f.id===+x)); break;
      case 'shipmentApply': {
        const [token,choice]=String(x).split(':'),p=this._shipmentPending;
        if(!p || String(p.token)!==token || p.world!==G.sys)break;
        const target=p.choices[+choice];
        const r=shipmentAction(G.p,p.f,choice==='retry'||choice==='cancel'?choice:'retarget',target&&target.target);
        this._shipmentPending=null;
        this.closeModal();this.setSpeed(p.speed);
        if(!r.ok)say(r.why,'war');
        this.refresh();break;
      }
      case 'shipCancel': {
        const item=this._shipCancelRefs&&this._shipCancelRefs.get(String(x));
        if(item)this.shipCancelDialog(item.sys,[item.order],false);
        else say('Kuyruk değişti; siparişi yeniden seç.','war');
        break;
      }
      case 'shipCancelAll': {
        const sys=G.sys[+x];
        if(sys)this.shipCancelDialog(sys,sys.queue.filter(q=>q.e===G.p.id),true);
        break;
      }
      case 'shipCancelConfirm': {
        const pending=this._shipCancelPending;
        if(!pending || String(pending.token)!==String(x))break;
        const r=cancelShipOrders(G.p,pending.sys,pending.orders,pending.all);
        this.closeModal();
        say(r.ok?r.count+' gemi siparişi iptal edildi.':r.why,r.ok?'sci':'war');
        this.keepScroll=true;this.refresh();break;
      }
      case 'rallySet': {
        // Eski düğme/kısayol: filoya bağlı siparişin hedefi zaten filodur.
        View.rallyFor=undefined;
        say('Takviye bu filoyu izler; sabit toplanma noktası tersane panelinden seçilir.','sci');
        this.keepScroll=true;this.refresh();break;
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
      case 'fleetNamesToggle': {
        FLEET_NAMES_ON=!FLEET_NAMES_ON;FLEET_NAMES_REV++;
        const b=$('fleetNamesBtn');
        if(b){b.className='tool fleetNamesBtn'+(FLEET_NAMES_ON?' on':'');
          b.setAttribute('aria-pressed',String(FLEET_NAMES_ON));}
        try { storeSet('yh_fleetnames',FLEET_NAMES_ON?'on':'off'); } catch(e){}
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
          if (!acik){ el2.scrollTop = 0; this.positionToolMenus(); }
        }
        break;
      }
      /* ═══ FAZ 86C.4H-R2: LOJİSTİK AYRI AKSİYON ═══
         Lojistik artık ana modu DEĞİŞTİRMEZ; kendi aç/kapat
         durumunu çevirir ve tercihi kalıcı yazar. */
      case 'fedLinksToggle':
      case 'allyLinksToggle': {
        if(a==='fedLinksToggle')FED_LINKS_ON=!FED_LINKS_ON;else ALLY_LINKS_ON=!ALLY_LINKS_ON;
        DIPLO_LINKS_REV++;refreshIdentityLayerButtons();
        try{storeSet('yh_diplolayers',JSON.stringify({federations:FED_LINKS_ON,alliances:ALLY_LINKS_ON}));}catch(ignore){}
        if(typeof forceRedraw==='function')forceRedraw('diplo-layers');break;
      }
      case 'warLinksToggle': {
        WAR_LINKS_ON=!WAR_LINKS_ON;WAR_LINKS_REV++;
        const b=$('warLinksBtn');if(b){b.className='tool warLinksBtn'+(WAR_LINKS_ON?' on':'');b.setAttribute('aria-pressed',String(WAR_LINKS_ON));}
        try{storeSet('yh_warlinks',WAR_LINKS_ON?'on':'off');}catch(e){}
        if(WAR_LINKS_ON&&!warMapConnections().length)say('Bilinen savaşlar için keşfedilmiş iki taraf bağlantı noktası gerekiyor.');
        if(typeof forceRedraw==='function')forceRedraw('war-links');
        this.refresh();break;
      }
      case 'warPauseToggle':
        WAR_PAUSE_ON=!WAR_PAUSE_ON;WAR_PAUSE_REV++;
        try{storeSet('yh_warpause',WAR_PAUSE_ON?'on':'off');}catch(e){}
        this.saveMenu();break;
      case 'logiToggle': {
        LOGI_ON = !LOGI_ON;
        const lb0 = $('logiBtn');
        if (lb0) lb0.className = 'tool logiBtn' + (LOGI_ON ? ' on' : '');
        try { storeSet('yh_logi', LOGI_ON ? 'on' : 'off'); } catch(e){}
        this.refresh();
        break;
      }
      case 'mapMode': {
        /* FAZ 86C.4H-R2: 'askeri' artık bir ANA MOD değil. Eski
           düğmelerden/kayıtlardan gelirse bağımsız katmana çevrilir
           ve ana mod DEĞİŞMEZ. */
        if (x === 'askeri'){
          LOGI_ON = !LOGI_ON;
          const lb1 = $('logiBtn');
          if (lb1) lb1.className = 'tool logiBtn' + (LOGI_ON ? ' on' : '');
          try { storeSet('yh_logi', LOGI_ON ? 'on' : 'off'); } catch(e){}
          this.refresh();
          break;
        }
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
        /* Lojistik düğmesi ana mod değişiminden ETKİLENMEZ. */
        const lb = $('logiBtn');
        if (lb) lb.className = 'tool logiBtn' + (LOGI_ON ? ' on' : '');
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
          savas    :'Savaştaki devletlerin renkleri · bağlantı çizgileri için Savaş hatları düğmesi'
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
      case 'diploView': // eski görünüm düğmesi: tek devlet listesi
        this.diploPage='states';this.openDiplo();break;
      case 'diploPick':
      case 'diploRelation': this.selectDiplo(+x,'relation');break;
      case 'diploNav':
        if (['states','relation','deal'].includes(x)){
          if (x==='deal' && this.diploKnown(this.diploTarget)) this.openDeal(this.diploTarget);
          else {this.stashDiploDraft();this.diploPage=x;this.openDiplo();}
        }
        break;
      case 'diploFilter':
        if (['all','war','ally','envoy'].includes(x)){
          this.diploFilter=x;this.diploPage='states';this.openDiplo();
        }
        break;
      case 'dealDiscard':
        this.ensureDiploWorld();
        if (this.deal){const id=this.deal.to;this.forgetDeal(id);this.openDeal(id);}
        break;
      case 'physio': {
        CFG.physio = x;
        safeRenderSetup();
        break;
      }
      case 'rollName': rollSetupName();break;
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
        const source=G.sys[+x];
        if(!source||source.owner!==G.p.id){say('Kendi tersane sistemini seç','war');break;}
        View.rallyFor=undefined;View.route=false;View.routed=false;
        View.aimFleet=undefined;View.panoptFor=undefined;
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
        const result=setRally(G.p,sy,null);
        say(result.ok?'Ralli noktası kaldırıldı':result.why,result.ok?'sci':'war');
        this.keepScroll = true; this.refresh();
        break;
      }
      case 'loopSet': {
        const [sid, cls] = x.split(':');
        const sy = G.sys[+sid];
        if (sy && sy.owner === G.p.id && shipBuildAccess(G.p, cls).ok){
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
      /* ═══ FAZ 86C.4H-R4: TANI RAPORUNU DIŞA AKTAR ═══
         Tek işlem: önce panoya, desteklenmezse dosya indirme. */
      case 'diagCopy': {
        if (this._diagCopyBusy) return;
        this._diagCopyBusy = true;
        return (async () => {
          try {
            let metin = '';
            try {
              metin = 'STARS tanı raporu — build ' +
                ((typeof BUILD_ID !== 'undefined') ? BUILD_ID : '?') + '\n';
              if (typeof renderReport === 'function')
                metin += '\n[ANLIK]\n' + renderReportText(renderReport('rapor', null, true)) + '\n';
              if (typeof SON_GIRIS !== 'undefined' && SON_GIRIS)
                metin += '\n[SON KURTARMA ÖNCESİ]\n' + renderReportText(SON_GIRIS) + '\n';
              if (typeof ILK_HATA !== 'undefined' && ILK_HATA)
                metin += '\n[İLK BAŞARISIZLIK]\n' + renderReportText(ILK_HATA) + '\n';
              if (typeof ONCEKI_HATA !== 'undefined' && ONCEKI_HATA)
                metin += '\n[ÖNCEKİ OTURUM]\n' + renderReportText(ONCEKI_HATA) + '\n';
              const D2 = (typeof DIAG !== 'undefined') ? DIAG : [];
              metin += '\n[SON ' + D2.length + ' KAYIT]\n';
              for (let i = D2.length - 1; i >= 0; i--)
                metin += new Date(D2[i].t).toISOString() + ' ' + D2[i].tur + ': ' + D2[i].m + '\n';
            } catch(e){ metin += '\nrapor hatası: ' + (e && e.message); }
            try {
              if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText){
                await navigator.clipboard.writeText(metin);
                say('📋 Tanı raporu panoya kopyalandı', 'sci');
                return true;
              }
            } catch(e){}
            let a = null, url = null;
            try {
              const blob = new Blob([metin], {type:'text/plain'});
              a = document.createElement('a');
              url = URL.createObjectURL(blob);
              a.href = url;
              a.download = 'stars-tani.txt';
              document.body.appendChild(a);
              a.click();
              say('📋 Tanı raporu indirme başlatıldı', 'sci');
              return true;
            } catch(e){
              logDiag('diagnostics', 'rapor aktarımı: ' + (e && e.message));
              say('Rapor alınamadı; Tanılama ekranından tekrar deneyebilirsin', 'war');
              return false;
            } finally {
              setTimeout(() => {
                try { if (url) URL.revokeObjectURL(url); if (a) a.remove(); } catch(e){}
              }, 1500);
            }
          } finally { this._diagCopyBusy = false; }
        })();
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
        /* ═══ FAZ 86C.4H-R4: ANLIK TANI ÖZETİ ═══
           Oyuncu tek dokunuşla raporu alabilsin; ADB, konsol veya
           uzun teknik işlem istenmiyor. */
        try {
          if (typeof renderReport === 'function'){
            const R = renderReport('manuel', null, true);
            dh += `<div class="mini" style="color:#6ff2c8">ANLIK DURUM</div>
              <div class="mini" style="word-break:break-all">${
                esc(renderReportText(R))}</div>`;
          }
          if (typeof ILK_HATA !== 'undefined' && ILK_HATA){
            dh += `<div class="mini" style="color:#ff9b3d">İLK BAŞARISIZLIK
              (korunan iz)</div>
              <div class="mini" style="word-break:break-all">${
                esc(renderReportText(ILK_HATA))}</div>`;
          }
          if (typeof ONCEKI_HATA !== 'undefined' && ONCEKI_HATA){
            dh += `<div class="mini">ÖNCEKİ OTURUMUN HATA KAYDI
              (${esc(ONCEKI_HATA.build)}) — TANI RAPORUNU AL ile paylaşılır.</div>`;
          }
        } catch(e){}
        /* FAZ 83.1: veri kaybetmeyen manuel kurtarma */
        dh += `</div><div class="mft">
          <button class="ch" data-a="diagCopy">
            <div class="cht">📋 TANI RAPORUNU AL</div>
            <div class="chd">Panoya kopyalar; olmazsa dosya indirir</div></button>
          <button class="ch" data-a="mapFix">
            <div class="cht">🔄 HARİTAYI YENİLE</div>
            <div class="chd">Kayıt, gün ve kaynaklar korunur</div></button>
          <button class="ch" data-a="save">
            <div class="cht">Geri</div></button></div>`;
        this.openModal(dh, 'war', true);
        break;
      }
      case 'vsOpen': {
        const [oid,yon]=String(x).split(':'),o=G.emps[+oid];if(!o)break;
        const sub=isVassal(G.p)&&G.p.overlord===o.id?G.p:o.overlord===G.p.id?o:null,c=sub&&vassalContractOf(sub);
        this.vs={id:o.id,yon,tur:c?.type||'haracguzar',world:G.emps,gonderildi:false,drafts:Object.fromEntries(Object.keys(VASSAL_TYPES).map(t=>[t,c?.type===t?JSON.parse(JSON.stringify(c.terms)):vassalDefaultTerms(t)])),edit:yon==='renew'};this.vsDraw();break;
      }
      case 'vsCurrent': if(isVassal(G.p))this.openModal('<div class="mhd">YÜRÜRLÜKTEKİ SÖZLEŞMEN</div><div class="mbd">'+this.vsContract(G.p)+'</div><div class="mft"><button class="ch" data-a="closem">KAPAT</button></div>','sci',false);break;
      case 'vsInspect': this.vsRecord(+x);break;
      case 'vsType': if(this.vs){this.vsRead();this.vs.tur=x;this.vsDraw();}break;
      case 'vsEdit': if(this.vs){this.vsRead();this.vs.tur=x;this.vs.edit=true;this.vsDraw();}break;
      case 'vsBack': if(this.vs){this.vsRead();this.vs.edit=false;this.vsDraw();}break;
      case 'vsReply': {
        const t=this._vsRecord;if(!t||t.world!==G.emps)break;
        const r=vassalReply(G.p,t.sub,t.id,t.round,x,null,t.world);if(!r.ok)say(r.why,'war');this.vsRecord(t.sub);break;
      }
      case 'vsCounter': {
        const t=this._vsRecord,q=t&&G.emps[t.sub]?.vassalTalk;if(!q||t.world!==G.emps||q.id!==t.id||q.round!==t.round||q.to!==G.p.id)break;
        this.vs={id:q.from,yon:'counter',tur:q.type,world:G.emps,gonderildi:false,edit:true,drafts:{[q.type]:JSON.parse(JSON.stringify(q.terms))},record:t};this.vsDraw();break;
      }
      case 'vsCancel': {
        /* İPTAL: hiçbir kaynak, hiçbir diplomatik durum değişmez */
        this.vs = null;
        this.closeModal();
        break;
      }
      case 'vsSend': {
        if (!this.vs || this.vs.gonderildi) break;
        const v=this.vs;if(v.world&&v.world!==G.emps){say('Oyun kaydı değişti; müzakereyi yeniden aç','war');break;}
        this.vsRead();const terms=v.drafts[v.tur];if(!vassalTerms(v.tur,terms)){if($('vsError'))$('vsError').textContent='Oranlar ve hükümler bu vasal türünün sınırları içinde olmalı.';break;}
        v.gonderildi=true;let r;const o=G.emps[v.id];
        if(v.yon==='counter'){const t=v.record;r=vassalReply(G.p,t.sub,t.id,t.round,'counter',terms,t.world);}
        else if(v.yon==='demand')r=demandVassal(G.p,o,v.tur,terms);
        else if(v.yon==='seek')r=seekProtection(G.p,o,v.tur,terms);
        else r=vassalOffer(G.p,o,v.yon,v.tur,terms);
        if(!r.ok){v.gonderildi=false;if($('vsError'))$('vsError').textContent=r.why;break;}
        const sub=v.yon==='counter'?G.emps[v.record.sub]:v.yon==='demand'?o:v.yon==='seek'?G.p:isVassal(G.p)?G.p:o;
        this.vs=null;this.closeModal();if(sub?.vassalTalk)this.vsRecord(sub.id);break;
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
          specialOpNotify(r.why, 'war');           // geçersiz işlem — tek mesaj
        } else if (r.caught){
          specialOpNotify('☠ ' + r.msg, 'war', ['infaz', 'KIŞKIRTMA İFŞA OLDU', r.msg]);
        } else if (!r.basarili){
          specialOpNotify('🔥 ' + r.msg, 'sci');   // sessiz başarısızlık
        }
        /* r.basarili → motor zaten bildirdi, ikinci kez basmıyoruz */
        this.keepScroll = true; specialOpPresent('refresh', ()=>this.refresh());
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
        if (!r.ok) specialOpNotify(r.why, 'war');
        else if (r.msg && !r.caught && r.tech === undefined) specialOpNotify(r.msg);
        this.keepScroll = true; specialOpPresent('refresh', ()=>this.refresh());
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
        if(!isVassal(G.p))break;
        this.openModal('<div class="mhd">BAĞIMSIZLIK SAVAŞI</div><div class="mbd">Bu karar mevcut vasallık bağını koparıp senyörüne savaş açar. Barışçıl talep ve yeniden müzakere seçeneklerini önce diplomasi ekranında inceleyebilirsin.</div><div class="mft"><button class="ch" data-a="revoltConfirm">SAVAŞI AÇIKÇA ONAYLA</button><button class="ch" data-a="closem">VAZGEÇ</button></div>','war',false);this._revoltConsent={world:G.emps,lord:G.p.overlord};break;
      }
      case 'revoltConfirm': {
        const t=this._revoltConsent;this._revoltConsent=null;if(!t||t.world!==G.emps||G.p.overlord!==t.lord)break;
        const r=playerRevolt();if(!r.ok)say(r.why,'war');this.closeModal();this.refresh();break;
      }
      case 'jointPrepare': this.jointPrepare(x);break;
      case 'jointChooseTarget':
        $('diploPane').classList.remove('show');this.closeModal();
        View.route=false;View.routed=false;
        this._jointExpanded={fleet:true,system:true,fed:true,diplo:true};
        document.querySelectorAll('.jointOps').forEach(el=>{el.open=true;});
        say('Haritada kendi filona veya bilinen sisteme dokun; sağ panelde Ortak askerî koordinasyon bölümünü aç.','sci');break;
      case 'jointRequest': {
        if(this._jointWorld!==G.sys)break;
        const fedSurface=!!el?.closest('.fedBox')||$('diploPane').classList.contains('show')&&!!$('diploPane').querySelector('.fedBox .jointOps');
        const [id,kind,target]=String(x).split(':');
        const r=jointRequest(G.p,+id,kind,+target);
        this._jointFeedback=(r.ok?'Kabul: ':'Ret: ')+(r.why||'Destek görevi değerlendirildi');
        say(this._jointFeedback,r.ok?'sci':'war');this.keepScroll=true;this.refresh();
        if(fedSurface)this.openFed();break;
      }
      case 'jointCancel': {
        if(this._jointWorld!==G.sys)break;
        const fedSurface=!!el?.closest('.fedBox')||$('diploPane').classList.contains('show')&&!!$('diploPane').querySelector('.fedBox .jointOps');
        const r=jointCancel(G.p,+x);this._jointFeedback=r.ok?'Destek talebi iptal edildi; gemiler korunuyor.':r.why;
        say(this._jointFeedback);this.keepScroll=true;this.refresh();if(fedSurface)this.openFed();break;
      }
      case 'fedPane': this.openFed(); break;
      case 'shareOpen': this.openSettlement(+x); break;
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
      case 'cncYes':
      case 'cncNo': {
        const r=castCouncilVote(G.p,a==='cncYes',x===undefined?councilVoteToken(G.council?.vote):x);
        if(!r.ok)this.alert(r.why,'war');
        else this.alert('Oy kaydedildi: '+(a==='cncYes'?'EVET':'HAYIR'));
        const pane=$('diploPane');if(pane.classList.contains('show')&&pane._surfaceKey==='council')this.openCouncil(true);
        break;
      }
      case 'fedBallot': {
        if(Object.hasOwn(FED_BALLOTS,x)&&x!=='weighted')this.fedBallotChoice=x;
        this.openFed();break;
      }
      case 'noteOptions':{const n=G.inbox.find(n=>n.uid===+x);if(!this.noteChoiceData(n))break;if(this._noteOptionsWorld!==G.emps){this._noteOptionsWorld=G.emps;this._noteOptions=new Set();}if(this._noteOptions.has(+x))this._noteOptions.delete(+x);else this._noteOptions.add(+x);this.drawInbox();break;}
      case 'noteChoice':{const [uid,index]=String(x).split(':').map(Number),n=G.inbox.find(n=>n.uid===uid);const r=this.applyEventChoice(n,index);if(!r.ok)say(r.why,'war');break;}
      case 'fedFoundType':this.fedFoundType=x;this.openFed();break;
      case 'fedFoundSelect':{const ids=this.fedFoundSelected||(this.fedFoundSelected=[]),i=ids.indexOf(+x);if(i<0)ids.push(+x);else ids.splice(i,1);this.openFed();break;}
      case 'fedFoundStart':{const r=fedFoundPropose(G.p,this.fedFoundType||'askeri',this.fedBallotChoice||'equal',this.fedFoundSelected||[]);say(r.ok?'Kuruluş davetleri gönderildi; açık yanıtlar ve son onay bekleniyor':r.why,r.ok?'sci':'war');this.openFed();break;}
      case 'fedFoundEdit':{const p=fedFoundGet(+x);if(p?.by!==G.p.id||p.status!=='pending')break;this.fedFoundEditing={id:p.id,revision:p.revision||0};this.fedFoundType=p.type;this.fedBallotChoice=p.ballot;this.fedFoundSelected=p.members.filter(id=>id!==G.p.id);this.openFed();break;}
      case 'fedFoundEditStop':this.fedFoundEditing=null;this.openFed();break;
      case 'fedFoundUpdate':{const d=this.fedFoundEditing;if(!d)break;const r=fedFoundUpdate(G.p,d.id,d.revision,this.fedFoundType,this.fedBallotChoice||'equal',this.fedFoundSelected||[]);say(r.ok?'Güncel davetler gönderildi; eski rızalar geçmişte saklandı':r.why,r.ok?'sci':'war');if(r.ok)this.fedFoundEditing=null;this.openFed();break;}
      case 'fedFoundReply':{const [id,answer,revision]=String(x).split(':');const r=fedFoundReply(G.p,+id,answer==='yes',+revision||0);say(r.ok?'Karar gönderildi / kaydedildi':r.why,r.ok?'sci':'war');this.openFed();break;}
      case 'fedFoundCancel':case 'fedFoundFinish':{const r=a==='fedFoundCancel'?fedFoundCancel(G.p,+x):fedFoundFinish(G.p,+String(x).split(':')[0],+String(x).split(':')[1]||0);say(r.ok?'Kuruluş işlemi kaydedildi':r.why,r.ok?'sci':'war');this.openFed();break;}
      case 'foundFed': {
        const [type,ballot]=String(x||'askeri').split(':');
        const r = foundFederation(G.p,type,ballot||this.fedBallotChoice||'equal');
        if (!r.ok) say(r.why || 'Federasyon kurulamadı', 'war');
        this.openFed();
        break;
      }
      case 'fedDipInvite':
      case 'fedDipRequest': {
        const out=a==='fedDipInvite'?proposeFedMotion(G.p,'admit',{target:+x}):requestFederation(G.p,G.emps[+x]);
        say(out.ok?'Federasyon işlemi kaydedildi; sonucu gelen kutusundan izle.':out.why,out.ok?'sci':'war');
        if(typeof DiplomaticInbox!=='undefined')DiplomaticInbox.sync();this.openDiplo();break;
      }
      case 'fleetFilter': this.fleetFilter=String(x);this.keepScroll=true;this.refresh();break;
      case 'fedTab': this.fedTab=String(x);this.openFed();break;
      case 'borderDiplo': if(this.diploKnown(+x)){this.openDiplo();this.selectDiploIdentity(+x);}break;
      case 'fedMember': this.closeModal();this.openDiplo();this.selectDiploIdentity(+x);break;
      case 'fedLeave': this.confirmFedLeave();break;
      case 'fedMotion': {
        const [kind,value,extra]=String(x).split(':');
        const opts=kind==='reform'?{type:value}:kind==='charter'?{field:value,value:extra}:kind==='joinWar'?{target:+value,sponsor:+extra}:{target:+value};
        const r=proposeFedMotion(G.p,kind,opts);if(!r.ok)say(r.why,'war');this.openFed();break;
      }
      case 'fedAgendaWithdraw': {const [fid,id]=String(x).split(':').map(Number);const r=withdrawFedAgenda(G.p,fid,id);if(!r.ok)say(r.why,'war');this.openFed();break;}
      case 'fedInviteAccept': {const r=acceptFedInvite(G.p,+x);if(!r.ok)say(r.why,'war');this.openFed();break;}
      case 'fedInviteReject': {rejectFedInvite(G.p,+x);this.openFed();break;}
      case 'fedExecute': {const [fid,id]=String(x).split(':');const r=executeFedDecision(G.p,+fid,id);if(!r.ok)say(r.why,'war');this.openFed();break;}
      case 'fedVoteYes': {
        const f = findFed(G.p);
        if (f && f.vote) this.fedVoteOpen(f.id);
        break;
      }
      case 'fedVoteNo': {
        const f = findFed(G.p);
        if (f && f.vote) this.fedVoteOpen(f.id);
        break;
      }
      case 'fedLawPropose':
      case 'fedLawRepeal': {
        const r = proposeFedLaw(G.p, x, a === 'fedLawRepeal');
        if (!r.ok) say(r.why, 'war');
        this.openFed(); break;
      }
      case 'fedWarRequest': {
        const r = proposeFedWar(G.p, G.emps[+x]);
        if (!r.ok) say(r.why, 'war');
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
      case 'dealBack':
        this.stashDiploDraft();this.diploPage='relation';this.openDiplo();break;
      case 'mergeArmed': {
        /* FAZ 76: yalnız askeri filoları tek ID altında birleştir */
        const sid2 = +x;
        const sav2 = G.fleets.filter(q => q.e === 0 && q.sys === sid2 &&
                                          q.ships.length && isArmed(q));
        if (sav2.length < 2){ say('Birleşecek savaş filosu yok', 'war'); break; }
        const ana = sav2[0];
        const kac=sav2.length-1,result=mergeFleetInto(G.p,ana,sav2.slice(1));
        if(!result.ok){say(result.why,'war');break;}
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
      case 'devour': {
        const [sid,pid]=String(x).split(':').map(Number),sys=G.sys[sid],pl=sys?.planets.find(p=>p.i===pid),q=canDevour(G.p,sys,pl);
        if(!q.ok){say(q.why,'war');break;}
        this.openModal(`<div class="mhd">GEZEGENİ TÜKET</div><div class="mbd"><b>${esc(pl.name)}</b><p>Gezegen kalıcı olarak yaşanamaz enkaza dönüşür. ${pl.col?'Koloni, nüfus ve yapılar kaybedilir; diplomatik bedeli vardır.':'Kaynak yatağı ve lüks kaynak kaybedilir.'}</p><p>Açlık 30 azalır; boyuta göre maden, alaşım ve enerji elde edilir.</p></div><div class="mft"><button class="ch" data-a="devourConfirm">Tüketmeyi onayla</button><button class="ch" data-a="closem">Vazgeç</button></div>`,'war');
        this._devourPending={world:G.sys,actor:G.p,sys,pl};break;
      }
      case 'devourConfirm': {
        const p=this._devourPending;this._devourPending=null;
        if(!p||p.world!==G.sys||p.actor!==G.p){say('Kayıt veya seçim değişti; gezegeni yeniden aç','war');break;}
        this.closeModal();const q=devourPlanet(G.p,p.sys,p.pl);if(!q.ok)say(q.why,'war');this.keepScroll=true;this.refresh();break;
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
      case 'closeDeal': this.stashDiploDraft();$('diploPane').classList.remove('show');break;
      case 'dealAdd': this.dealAdd(x); break;
      case 'dealRm': this.dealRm(x); break;
      case 'dealPact': this.dealPact(x); break;
      case 'dealSend': this.dealSend(); break;
      /* FAZ 86B: karşı teklif kartı — orijinal teklif bozulmadı. */
      case 'ctrYes': {
        this.ensureDiploWorld();
        const c = this.dealCounter;
        if (!c) break;
        const q = (typeof dealQuote === 'function') ? dealQuote(c) : null;
        if (this.diploKnown(c.from) && q && q.ok && executeDeal(c)) say('Anlaşma imzalandı', 'win');
        else say((q && q.reasons[0]) || 'Teklif artık geçerli değil', 'war');
        this.forgetDeal(c.from);
        $('diploPane').classList.remove('show');
        this.refresh();
        break;
      }
      case 'ctrNo': {
        this.ensureDiploWorld();
        const c = this.dealCounter;
        if (c){ const co = G.emps[c.from];
          if (co && recordPlayerOfferRefusal(c)) co.rel[0] = clamp(co.rel[0] - 5, -100, 100); }
        this.dealCounter = null;
        this.drawDeal();
        break;
      }
      case 'ctrBack': this.drawDeal(); break;
      case 'closeMarket': $('diploPane').classList.remove('show'); break;
      case 'closeDiplo': this.stashDiploDraft();$('diploPane').classList.remove('show');break;
      case 'spy': {
        const q = spyAssignQuote(G.p, +x);
        if (q.ok && assignSpy(G.p, +x)){
          this.spyTarget = +x;
          this.keepScroll = true;
          this.refresh();
        } else say(q.why || 'Casus ataması uygulanamadı');
        break;
      }
      /* FAZ 86A: opsMenu ikinci bir katalog ÜRETMEZ — kanonik komuta
         merkezine yönlendirir (aynı opsCatalog renderer'ı kullanılır). */
      case 'ops': {
        this._spyEpoch=(this._spyEpoch||0)+1;this._opPending=null;this.spyTarget = +x;
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
      case 'intelView': {this._spyEpoch=(this._spyEpoch||0)+1;this._opPending=null;
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
      case 'spyTargetSet': {this._spyEpoch=(this._spyEpoch||0)+1;this._opPending=null;this.spyTarget=+x;this.keepScroll=false;this.refresh();break;}
      case 'intelCategory':this.intelCategory=x;this.refresh();break;
      case 'spySel': {
        this._spyEpoch=(this._spyEpoch||0)+1;this._opPending=null;this.spyTarget = +x;
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
        const [gid, gkey, token] = String(x).split(':');
        this.opExecute(+gid, gkey, token);
        break;
      }
      case 'setwg': {
        const [id,key]=String(x).split(':');this.warDeclarationPreview(+id,key);break;
      }
      case 'runop': {
        /* FAZ 86A: geriye dönük uyumluluk — doğrudan yürütme yerine
           kanonik onay ekranına yönlendirilir. Tek dokunuş = tek onay. */
        const [id, key] = String(x).split(':');
        this.opConfirm(+id, key);
        break;
      }
      case 'envoy': this.openEnvoyMenu(+x); break;
      case 'envoyTask':
      case 'envoyRecall': {
        const [key,task]=String(x).split(':');
        const id=+key, o=G.emps[id];
        const result=a==='envoyRecall' ? recallEnvoy(G.p,id) : setEnvoyTask(G.p,id,task);
        if (!result.ok){say(result.why,'war');break;}
        this.closeModal();
        if (result.changed){
          const msg=result.action==='recall' ? 'Elçi geri çekildi' :
            ENVOY_TASKS[task].n + (result.action==='change'?' görevi başladı; kıdem sıfırlandı':' görevi başladı');
          say('🎓 '+(o?o.name:'Devlet')+' — '+msg,'sci');
        }
        const pane=$('diploPane');
        if (pane&&pane.classList.contains('show')) this.openDiplo();
        this.keepScroll=true;this.refresh();
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
          delete f.explore;
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
          delete f.explore;
          f.auto = !f.auto;
          if (!f.auto){ f.path = []; delete f.stalled; delete f._stallSaid; }
          say(f.auto ? esc(f.name) + ' otomatik keşfe geçti'
                     : esc(f.name) + ' manuel kontrole döndü — rotası durduruldu',
              f.auto?'sci':'');
        }
        this.refresh(); break;
      }
      case 'route': {
        if (!View.sel?.ships.length) break;
        View.route = !View.route;
        View.routed = false;
        if (View.route) {
          View.rallyForSys = View.rallyFor = undefined;
          View.aimFleet = View.panoptFor = undefined;
        }
        this.refresh(true);
        break;
      }
      case 'stop': if (View.sel && View.sel.e===0){ cancelExploration(View.sel); if(hasShipment(View.sel))shipmentAction(G.p,View.sel,'cancel');else View.sel.path=[]; View.sel.ord=null; } this.refresh(); break;
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
      case 'fedShip': this.buildFedShip(x); break;   // BETA-FED-FLEET.0
      case 'scienceTab': case 'scienceNode': case 'scienceFocus': case 'scienceFilter':
      case 'scienceMode': case 'scienceQueue': case 'scienceRoute': case 'scienceMove': case 'scienceRemove': case 'scienceZoom':
        this.scienceAction(a,x);break;
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
      case 'dTab': { // eski bağlantılar tek ilişki/istihbarat yoluna gider
        const [id,tab]=String(x).split(':');
        if (tab==='istihbarat') this.act('spyOpen',id);
        else this.selectDiplo(+id,'relation');
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
        if (this.wC !== null && this.wC !== undefined && !c){
          say('Suçlanacak devlet artık bulunamıyor', 'war'); this.whisperMenu(); break;
        }
        const r = playerWhisper(a, b, c);
        if (!r.ok){ say(r.why, 'war'); this.whisperMenu(); break; }
        this.wA = null; this.wB = null; this.wC = null;
        this.closeModal();
        say(r.msg + ' · ' + r.cost + ' ◈ harcandı', r.ifsa ? 'war' : (r.basari ? 'sci' : ''));
        this.openDiplo();
        break;
      }
      case 'pact': this.diploAct('pact', +x); break;
      case 'endAlliance': this.confirmAllianceEnd(+x); break;
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
        const cost = Object.entries(buildingCost(G.p,x)).map(([r,v])=>
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
             <div class="row"><span>Enerji</span><b style="color:#ff5f6d">−${Math.round((B.up||0)*1.6*100)/100}/ay</b></div>
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
      case 'instNote': this.instInfoOpen(x); break;   // BETA-EVENT-UX.0
      case 'instDecide': this.instDecide(x); break;   // BETA-EVENT-UX.1
      case 'noteQuick': this.noteQuickAct(x); break;   // MP.7.4
      case 'noteSwipe': return this.noteSwipe(x);      // MP.7.4
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
    this.spyWidthApply();   // BETA-EVENT-UX.0
    this.refresh();
  },
  /* BETA-EVENT-UX.0 (#55) — CASUSLUK PANELİ GENİŞLİĞİ
     Yalnız İSTİHBARAT sekmesi açıkken sağ panelin haritaya bakan kenarında sürükleme kolu görünür. Mevcut yerleşim değişkeni (--sb)
     yalnız #game üzerinde, yalnız bu sekmede ezilir; sekme değişince kaldırılır → SİSTEM / FİLO ve öteki paneller standart genişlikte
     kalır, ikinci bir kenar çubuğu motoru yok. Genişlik yalnız yerel arayüz tercihi (localStorage 'stars:spyWidth'): Save8, RNG ve ağ
     verisine girmez. Sınırlar: en az standart genişlik, en çok "haritaya en az 220 px kalsın" ve görünür alanın %75'i. Fare, dokunma
     (pointer capture; harita seçimine / rotaya sızmaz) ve klavye (← → Home End). */
  spyWidthLimits(){
    const g=$('game'),sb=$('sidebar');if(!g||!sb)return null;
    const scale=sb.offsetWidth?sb.getBoundingClientRect().width/sb.offsetWidth:1,vw=window.innerWidth/(scale||1);
    const prev=g.style.getPropertyValue('--sb');if(prev)g.style.removeProperty('--sb');const base=sb.offsetWidth||302;if(prev)g.style.setProperty('--sb',prev);
    return {base,min:base,max:Math.max(base,Math.min(Math.round(vw*.75),Math.round(vw-220))),scale:scale||1};
  },
  spyWidthGet(){if(Number.isFinite(this._spyW))return this._spyW;let v=NaN;try{v=parseInt(localStorage.getItem('stars:spyWidth'),10);}catch{}return this._spyW=Number.isFinite(v)?v:null;},
  spyWidthSet(w,save,lim){const L=lim||this.spyWidthLimits();if(!L)return;w=Math.round(Math.max(L.min,Math.min(L.max,w)));this._spyW=w;$('game').style.setProperty('--sb',w+'px');
    const h=$('sbResize');if(h){h.setAttribute('aria-valuenow',String(w));h.setAttribute('aria-valuemin',String(L.min));h.setAttribute('aria-valuemax',String(L.max));}
    if(save)try{localStorage.setItem('stars:spyWidth',String(w));}catch{}},
  spyWidthApply(){
    const g=$('game'),sb=$('sidebar');if(!g||!sb||!g.style||typeof g.style.removeProperty!=='function'||!g.classList)return;   // DOM'suz ortam (Node testleri, eski tarayıcı): dokunma
    const on=this.cur==='intel';g.classList.toggle('spyPane',on);
    let h=$('sbResize');
    if(!on){g.style.removeProperty('--sb');return;}
    if(!h){h=document.createElement('div');h.id='sbResize';h.tabIndex=0;h.setAttribute('role','separator');h.setAttribute('aria-orientation','vertical');
      h.setAttribute('aria-label','Casusluk paneli genişliği — sürükle ya da ← → tuşları');h.title='Casusluk panelini genişlet / daralt';sb.appendChild(h);this.spyWidthBind(h);}
    const w=this.spyWidthGet();if(Number.isFinite(w))this.spyWidthSet(w,false);else{g.style.removeProperty('--sb');const L=this.spyWidthLimits();if(L)h.setAttribute('aria-valuenow',String(L.base));}
  },
  spyWidthBind(h){
    let drag=null;
    const stop=e=>{if(!drag||e.pointerId!==drag.id)return;const drag0=drag;drag=null;h.classList.remove('drag');try{h.releasePointerCapture(e.pointerId);}catch{}if(Number.isFinite(this._spyW))this.spyWidthSet(this._spyW,true,drag0.L);};
    h.addEventListener('pointerdown',e=>{if(e.button>0)return;e.preventDefault();e.stopPropagation();const L=this.spyWidthLimits();if(!L)return;
      drag={id:e.pointerId,x:e.clientX,w:$('sidebar').offsetWidth,scale:L.scale,L};h.classList.add('drag');try{h.setPointerCapture(e.pointerId);}catch{}});
    h.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;e.preventDefault();e.stopPropagation();this.spyWidthSet(drag.w+(drag.x-e.clientX)/drag.scale,false,drag.L);});
    h.addEventListener('pointerup',stop);h.addEventListener('pointercancel',stop);
    for(const t of ['click','touchstart'])h.addEventListener(t,e=>e.stopPropagation(),{passive:t==='touchstart'});
    h.addEventListener('keydown',e=>{const L=this.spyWidthLimits();if(!L)return;const cur=$('sidebar').offsetWidth;let w=null;
      if(e.key==='ArrowLeft')w=cur+24;else if(e.key==='ArrowRight')w=cur-24;else if(e.key==='Home')w=L.max;else if(e.key==='End')w=L.min;
      if(w===null)return;e.preventDefault();this.spyWidthSet(w,true,L);});
    window.addEventListener('resize',()=>{if(this.cur==='intel')this.spyWidthApply();});
  },

  setSpeed(i){
    G.speed = i;
    [...document.querySelectorAll('.sp')].forEach(b=>b.classList.toggle('on', +b.dataset.x===i));
  },

  /* ---------- üst bar ---------- */
  minimizedEvent(){
    if(!G.minNote)return null;
    if(G.minNote==='_raw')return G.minRaw&&this._minRawWorld===G.emps?{raw:true}:null;
    const note=(G.inbox||[]).find(n=>n.uid===G.minNote);if(!note)return null;
    if(typeof DiplomaticInbox!=='undefined'&&DiplomaticInbox.supported(note.kind)){
      const r=DiplomaticInbox.state().records.find(r=>r.note?.uid===note.uid);
      if(!r||r.status!=='pending'||r.expires<=G.day)return null;
    }
    return note;
  },
  topStatusItems(){
    const e=G.p,items=[],battles=battleCount(),wars=G.emps.filter(o=>!o.dead&&o.id!==e.id&&e.war[o.id]).length;
    const add=(label,action,count=1,x)=>items.push({label,action,count,x});
    if(battles)add('⚔ '+battles+' çatışma','gobattle');
    if(wars)add('⚔ '+wars+' savaş · Diplomasi','diploPane');
    add('⚔ Savaş Merkezi · '+wars+' düşman','activeWars',0);   // MP.7.5: sayaçla aynı kanonik liste (temas yoksa "Bilinmeyen düşman")
    const pending=typeof DiplomaticInbox!=='undefined'?DiplomaticInbox.pending():0;
    if(pending)add('✉ '+pending+' bekleyen diplomatik teklif','diplomaticInbox',pending);
    if(typeof ArchiveUI!=='undefined'&&ArchiveUI.newsReturnRecord())add('📰 İncelenen habere geri dön','newsReturn',0);
    if(typeof ArchiveUI!=='undefined'&&ArchiveUI.returnRecord?.world===G.emps)add('✉ İncelenen teklife geri dön','inboxReturn',0);
    const minimized=this.minimizedEvent(),keys=new Set();
    for(const n of G.inbox||[]){
      if(typeof DiplomaticInbox!=='undefined'&&DiplomaticInbox.supported(n.kind))continue;
      if(!n.pause&&!n.hidden&&!['warstart','wardec','criswarn','crisis','facdem','faccoup','cncvote'].includes(n.kind)&&n.uid!==minimized?.uid)continue;   // MP.7.5: gizlenen olay listede kalır
      const key=n.key||n.uid;if(keys.has(key))continue;keys.add(key);
      add('▣ '+n.title,n.uid===minimized?.uid?'restoreModal':'openNote',1,String(n.uid));
    }
    if(minimized&&(minimized.raw||typeof DiplomaticInbox!=='undefined'&&DiplomaticInbox.supported(minimized.kind)))add('▣ Küçültülen olay / karar · geri aç','restoreModal',minimized.raw?1:0);
    if(crisisActive())add('🌋 Galaktik kriz · aşama '+G.crisis.stage,'crisInfo');
    if(typeof upheavalActive==='function'&&upheavalActive()){
      const U=upheavalInfo();add(U.ico+' '+U.n+' · '+G.upheaval.left+' tur','upInfo');
    }
    const risk=internalRiskSummary(e),n=risk.colonies.length;
    const riskLabels=[...(n?[n+' KOLONİDE İSYAN RİSKİ']:[]),...(risk.schism.counter?['İDEOLOJİK BÖLÜNME']:[]),...(risk.subjects.length||risk.ownVassal?.anger>=50?['VASAL BAĞIMSIZLIK RİSKİ']:[])];
    if(riskLabels.length)add('⚠ '+riskLabels.join(' · ')+' · İç istikrar','internalRisk',Math.max(1,n));
    const recover=this.fleetRecoverySummary();if(recover.length)add('⚠ '+recover.length+' kayıp takviye hedefi · Toplu kurtarma','fleetRecovery',recover.length);else if(G.fleetJournal?.some(r=>r.owner===0))add('⚓ Son filo işlemleri / takviye kurtarma','fleetRecovery',0);
    if(e.crisis)add('⚠ '+e.crisis.toUpperCase()+' KRİZİ');
    if(e.shortage)add('⚠ Mal kıtlığı · ekonomi / kaynak üretimini kontrol et');
    // Navigation survives, ordinary galactic news is never an urgent count.
    add('📰 Galaktik Haber Ağı','news',0);
    return {items,wars,battles,count:items.reduce((n,i)=>n+i.count,0),minimized:!!minimized};
  },
  openTopStatus(){
    const {items,minimized}=this.topStatusItems();
    if(minimized){this.restoreModal();return;}
    this.pickList('Savaşlar, olaylar ve durumlar',items.map(x=>esc(x.label)),i=>{const item=items[i];if(item?.action)this.act(item.action,item.x);});
  },
  bindTopbarInput(){
    if(this._topInputBound)return;this._topInputBound=true;
    const bar=$('topbar');
    bar.addEventListener('pointerdown',ev=>{this._topPointer={id:ev.pointerId,x:ev.clientX,y:ev.clientY};ev.stopPropagation();},{passive:true});
    bar.addEventListener('pointermove',ev=>{const p=this._topPointer;if(p&&p.id===ev.pointerId&&Math.hypot(ev.clientX-p.x,ev.clientY-p.y)>8){this._topDragUntil=Date.now()+450;}},{passive:true});
    const end=()=>{this._topPointer=null;};
    document.addEventListener('pointerup',end,{passive:true});document.addEventListener('pointercancel',end,{passive:true});
    bar.addEventListener('click',ev=>{if((this._topDragUntil||0)>Date.now()){ev.preventDefault();ev.stopImmediatePropagation();}},true);
  },
  topbar(){
    if(this._topPointer)return; // Preserve native scrolling and the pressed target until release.
    const e=G.p,r=e.res,inc=e.inc,{count,minimized,wars,battles}=this.topStatusItems();
    const previous=$('resourceStrip'),left=previous?previous.scrollLeft:0;
    const cell=k=>{const d=RES[k],v=inc[k]||0;return `<div class="res" title="${d.n}"><em style="color:${d.c}">${d.ico}</em><u style="color:${d.c}">${d.k}</u><b>${fmt(r[k])}</b><s class="${v>=0?'p':'n'}">${sgn(v)}</s></div>`;};
    const risk=internalRiskSummary(e),riskCount=risk.colonies.length+Number(risk.schism.counter>0)+risk.subjects.length+Number(risk.ownVassal?.anger>=50);
    const html=`<div id="resourceStrip" aria-label="Kaynaklar; yatay kaydırılabilir" tabindex="0">`+
      ['min','ene','yiy','tuk','ala','etk'].map(cell).join('<div class="tsep"></div>')+
      `<div class="tsep"></div><div class="res" title="Aylık araştırma: ${inc.ara}"><em style="color:${RES.ara.c}">${RES.ara.ico}</em><u>ARŞ</u><b>${fmt(inc.ara)}</b><s>/ay</s></div>
      <div class="tsep"></div><div class="res" title="Filo kapasitesi"><em>⛴</em><u>FİLO</u><b>${fleetUsage(e)}/${Math.round(e.cap)}</b></div></div>
      <button id="topStatusBtn" class="topStatusBtn ${wars||battles?'hot':''} ${minimized?'hasMinimized':''}" data-a="topStatus" aria-label="${count} önemli durum${minimized?'; küçültülen olayı geri aç':'; listeyi aç'}" title="Savaş, olay ve kriz listesi">${riskCount?'⚠ '+riskCount+' KRİZ':(wars||battles?'⚔':'☰')+' +'+count}</button>`;
    const bar=$('topbar');if(bar._topHTML!==html||!bar.querySelector('#topStatusBtn')){bar.innerHTML=html;bar._topHTML=html;}
    $('resourceStrip').scrollLeft=left;
  },

  /* Stable live surfaces: reconcile changed nodes, never replace a scroller
     merely because a game day elapsed. Pause DOM writes during native touch,
     momentum scrolling and typing; simulation and data collection continue. */
  surfaceInput(){
    if(this._surfaceBound)return;this._surfaceBound=true;this._surfaceDirty=new WeakSet();
    this._surfacePointers=new Set();
    const relevant=t=>t?.closest?.('#diploPane,#panel,#modal,#inbox,#seltag');
    document.addEventListener('pointerdown',e=>{if(relevant(e.target))this._surfacePointers.add(e.pointerId);},{passive:true});
    const end=e=>{this._surfacePointers.delete(e.pointerId);this._surfaceUntil=Date.now()+220;};
    document.addEventListener('pointerup',end,{passive:true});document.addEventListener('pointercancel',end,{passive:true});
    document.addEventListener('scroll',e=>{if(relevant(e.target))this._surfaceUntil=Date.now()+220;},{capture:true,passive:true});
    for(const type of ['input','change'])document.addEventListener(type,e=>{if(relevant(e.target)){this._surfaceDirty.add(e.target);this._surfaceUntil=Date.now()+500;}},{passive:true});
    window.addEventListener('blur',()=>this._surfacePointers.clear());
  },
  // BETA-P0.1: every replacement takes ownership of the shared panel.
  surfaceReplace(el,html,key){
    if(el?.id==='diploPane'&&key!=='colony-workspace'){el.classList.remove('colonyWorkspace');el.style.width='';}
    if(el._surfaceTimer)clearTimeout(el._surfaceTimer);
    el._surfaceTimer=null;el._surfacePending=null;
    el._surfaceKey=key;el._surfaceWorld=G.emps;el._surfaceHTML=html;
    el.innerHTML=html;
  },
  surfaceRender(el,html,key,automatic=false){
    if(!el)return false;
    if(el.id==='diploPane'&&key!=='colony-workspace'){el.classList.remove('colonyWorkspace');el.style.width='';}
    // Non-browser regression hosts do not implement a native DOM parser.
    if(!document.createElement('template').content){el.innerHTML=html;return true;}
    this.surfaceInput();
    const same=el._surfaceKey===key&&el._surfaceWorld===G.emps;
    if(same&&el._surfaceHTML===html)return false;
    if(same&&automatic&&(this._surfacePointers.size||Date.now()<(this._surfaceUntil||0)||el.contains(document.activeElement)&&document.activeElement.matches('select'))){
      el._surfacePending={html,key,world:G.emps};
      if(!el._surfaceTimer)el._surfaceTimer=setTimeout(()=>{el._surfaceTimer=null;const p=el._surfacePending;el._surfacePending=null;if(p&&p.world===G.emps&&p.key===el._surfaceKey)this.surfaceRender(el,p.html,p.key,true);},250);
      return false;
    }
    el._surfacePending=null;
    const positions=this._surfacePositions||(this._surfacePositions=new Map());
    const scrollers=()=>[el,...el.querySelectorAll('.dpBody,.mbd,[id],details')].filter(n=>n.scrollTop||n.scrollLeft);
    if(!same&&el._surfaceKey)positions.set(el._surfaceKey,scrollers().map(n=>({id:n.id,cls:n.className,y:n.scrollTop,x:n.scrollLeft})));
    if(!same){el.innerHTML=html;el._surfaceKey=key;el._surfaceWorld=G.emps;for(const p of positions.get(key)||[]){const n=p.id?el.querySelector('#'+p.id):el.querySelector('.'+String(p.cls).trim().split(/\s+/).join('.'));if(n){n.scrollTop=p.y;n.scrollLeft=p.x;}}}
    else {
      const template=document.createElement('template');template.innerHTML=html;
      const token=n=>n.nodeType!==1?'#'+n.nodeType:n.id?'id:'+n.id:n.hasAttribute('data-a')?n.tagName+':'+n.dataset.a+':'+(n.dataset.x||''):n.tagName==='DETAILS'?'details:'+n.querySelector('summary')?.textContent:n.matches('h3,.ph')?n.tagName+':heading:'+n.textContent:n.matches('tr,.row,.ecoLine')?n.tagName+':row:'+(n.querySelector('th,span')?.textContent||'').replace(/⚠/g,''):n.tagName;
      const saved=scrollers().map(n=>{
        const rect=n.getBoundingClientRect(),anchors=[...n.querySelectorAll('h3,.ph,summary,tr,.row,.ecoLine,article')];
        const anchor=anchors.find(a=>{const r=a.getBoundingClientRect();return r.height>0&&r.bottom>rect.top&&r.top<rect.bottom;});
        return {n,y:n.scrollTop,x:n.scrollLeft,anchor,offset:anchor?anchor.getBoundingClientRect().top-rect.top:null};
      });
      const patch=(a,b)=>{
        if(a.nodeType!==1){if(a.nodeValue!==b.nodeValue)a.nodeValue=b.nodeValue;return;}
        const form=a.matches('input,textarea,select'),dirty=this._surfaceDirty.has(a)||a===document.activeElement;
        for(const attr of [...a.attributes])if(!b.hasAttribute(attr.name)&&!(a.tagName==='DETAILS'&&attr.name==='open')&&!(form&&dirty&&['value','checked','selected'].includes(attr.name)))a.removeAttribute(attr.name);
        for(const attr of [...b.attributes])if(!(a.tagName==='DETAILS'&&attr.name==='open')&&!(form&&dirty&&['value','checked','selected'].includes(attr.name))&&a.getAttribute(attr.name)!==attr.value)a.setAttribute(attr.name,attr.value);
        if(a.tagName==='CANVAS')return; // keep already painted pixels and context
        const value=form?a.value:null,checked=form?a.checked:null;
        children(a,b);
        if(form&&dirty){a.value=value;if(a.tagName==='INPUT')a.checked=checked;}
      };
      const children=(a,b)=>{
        let cursor=a.firstChild;
        for(const next of [...b.childNodes]){
          const id=token(next);let current=cursor;
          if(!current||token(current)!==id){current=[...a.childNodes].slice(cursor?[...a.childNodes].indexOf(cursor):a.childNodes.length).find(n=>token(n)===id&&n.nodeType===next.nodeType&&n.nodeName===next.nodeName);if(current)a.insertBefore(current,cursor);else{current=next.cloneNode(true);a.insertBefore(current,cursor);}}
          if(current.nodeType===next.nodeType&&current.nodeName===next.nodeName)patch(current,next);
          cursor=current.nextSibling;
        }
        while(cursor){const next=cursor.nextSibling;cursor.remove();cursor=next;}
      };
      children(el,template.content);
      for(const p of saved)if(p.n.isConnected){
        let y=p.y;
        if(p.anchor?.isConnected&&p.n.contains(p.anchor))y=p.n.scrollTop+p.anchor.getBoundingClientRect().top-p.n.getBoundingClientRect().top-p.offset;
        if(Math.abs(p.n.scrollTop-y)>.5)p.n.scrollTop=y;
        if(p.n.scrollLeft!==p.x)p.n.scrollLeft=p.x;
      }
    }
    el._surfaceHTML=html;return true;
  },
  refreshCouncilPanel(){
    const pane=$('diploPane');if(!pane.classList.contains('show')||pane._surfaceKey!=='council')return;
    const key=JSON.stringify([Math.floor(G.day),G.council,G.p.res.etk,G.p.inc?.etk,G.p.ethics]);
    if(this._councilKey!==key){this.openCouncil(true);this._councilKey=key;}
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
    this.refreshScience();
    this.refreshFedPanel();
    this.refreshCouncilPanel();
    this.refreshJointPanels();
    this.seltag();
  },
  refresh(immediateSelection = false){
    if (this._diploWorld && this._diploWorld!==G.p){
      this.ensureDiploWorld();
      if (G.p && $('diploPane').classList.contains('show')) this.openDiplo();
    }
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
    this.surfaceRender(el,this['p_'+this.cur] ? this['p_'+this.cur]() : '', 'sidebar:'+this.cur, this.keepScroll);
    if (this.keepScroll) el.scrollTop = y;
    this.keepScroll = false;
    /* FAZ 82: panel her yenilendiğinde YENİ canvas'lar doğuyor;
       done bayrağı olmayanlar hemen boyanmalı yoksa siyah kalıyor. */
    this.paintSprites();
    this.seltag(!immediateSelection);
    if(typeof ColonyUI!=='undefined')ColonyUI.refresh();
    if(typeof WarCenterUI!=='undefined')WarCenterUI.refresh();
    this.positionToolMenus();
    $('stardate').textContent = G.year + '.' + String(G.month).padStart(2,'0');
  },

  seltag(automatic = true){
    const t = $('seltag');
    if (!View.sel){ t.classList.add('hidden'); return; }
    const f = View.sel;
    t.classList.remove('hidden');
    const label = `${esc(f.name)} · ${isArmed(f)?fmt(fleetPower(f))+' güç':f.ships.length+' gemi'}`;
    const html = `<span title="${label}">${label}</span>` +
      `<button data-a="route" class="${View.route?'on':''}" aria-pressed="${!!View.route}">${View.route?(View.routed?'+DURAK':'HEDEF SEÇ'):'ROTA'}</button>` +
      `<button data-a="stop">DUR</button>` +
      (f.sys >= 0 ? `<button data-a="selsys" data-x="${f.sys}" aria-label="Sistem paneli"><span class="systemText">SİSTEM </span><span aria-hidden="true">›</span></button>` : '');
    this.surfaceRender(t,html,'selection:'+f.id,automatic);
    // Screen rectangles and UI-local CSS pixels must use the same zoom conversion.
    const zoom=this.getUIScale?this.getUIScale().effective/100:1,side=$('sidebar'),sr=side?.getBoundingClientRect(),pod=$('timepod')?.getBoundingClientRect();
    const right=side&&!side.classList.contains('off')&&sr?.width>0?Math.min(window.innerWidth,sr.left,window.innerWidth-sr.width):window.innerWidth;
    const left=pod?.width>0?Math.max(8,pod.right+8):8,available=right-left-8;
    // Prefer the space beside the time controls. On a very narrow map use a second row above them.
    const narrow=available<230,L=narrow?8:left,R=Math.max(L+1,right-8),width=(R-L)/zoom;
    t.style.width=width+'px';t.style.maxWidth=width+'px';t.style.left=((L+R)/2/zoom)+'px';
    t.style.bottom=(narrow&&pod?.height>0?window.innerHeight-pod.top+8:8)/zoom+'px';

  },

  /* =============== SİSTEM =============== */
  p_sistem(){
    const s = View.selSys || (View.sel && View.sel.sys>=0 ? G.sys[View.sel.sys] : G.sys[G.p.home]);
    if (!s) return `<div class="empty">Haritadan bir sistem seç.</div>`;
    View.selSys = s;
    const e = G.p;
    const owner = s.owner>=0 ? G.emps[s.owner] : null;
    const ownerInfo = pSeen(s) ? territoryOwnerInfo(s.owner) : null;
    const surv = pSurv(s);
    let h = this.jointPanel(null,'system')+`<div class="ph">${esc(s.name)}</div>`;
    h += `<div class="row"><span>Yıldız</span><b style="color:${s.star.c}">${s.star.n}</b></div>`;
    h += `<div class="row"><span>Sistem hâkimiyeti</span><b style="color:${ownerInfo?ownerInfo.col:'#7d90ad'}">${ownerInfo?esc(ownerInfo.name):pSeen(s)?'Sahipsiz':'Bilinmiyor'}</b></div>`;
    if(s.owner<0&&pSeen(s)){
      const neighbors=[...new Set(s.lanes.map(id=>{const n=G.sys[id];return pVis(n)?n.owner:G.p.mapOwners?.[id]??-1;}))].filter(id=>id>=0&&id!==e.id&&e.contact[id]&&G.emps[id]&&!G.emps[id].dead);
      if(neighbors.length)h+='<div class="mini">Bilinen sınır komşuları</div>'+neighbors.map(id=>`<button class="abtn" data-a="borderDiplo" data-x="${id}">DİPLOMASİ · ${esc(this.diploName(id))}</button>`).join('');
    }
    const colonyOwners = territoryColonyOwners(s);
    if (colonyOwners.some(o=>o.id!==s.owner)){
      h += `<div class="box"><div class="bt">KARMA HÂKİMİYET</div>
        <div class="bd">Sistem hâkimiyeti bütün gezegenlerin aynı devlete ait olduğu anlamına gelmez.</div>`;
      for(const o of colonyOwners)h += `<div class="row"><span style="color:${o.col}">${esc(o.name)}</span><b>${o.count} koloni</b></div>`;
      h += `</div>`;
    }
    h += `<div class="row"><span>Hiper yol</span><b>${s.lanes.length} bağlantı</b></div>`;

    /* 86E: sağ panel kısa özet; ayrıntılı kararlar tek ilişki sayfasında. */
    if (owner && this.diploKnown(owner.id)){
      h+=this.diploIdentity(e,owner);
      h+=this.diploTreaties(e,owner);
      h+=this.envoySummary(e,owner.id);
      h+=`<div class="act2">
        <button class="abtn pri" data-a="diploRelation" data-x="${owner.id}">🤝 İLİŞKİ VE EYLEMLER</button>
        <button class="abtn" data-a="spyOpen" data-x="${owner.id}">🕵 CASUSLUK</button></div>`;
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
          <b>%${yuzde}</b> hasarla savaşır; kalkanı %${Math.round(Math.max(.30,sup*.85)*100)} çalışır.
          Gövde dayanımı değişmez. Yakınına karakol ya da tersane kurmak
          hattı ileri taşır.</div>`;
    }
    if(playerHabitatMark(s))h+=`<div class="mini">Harita: ◇ uygun boş dünya · ■ yerleşilmiş uygun dünya. Son taranmış gözlem; güncel görünmeyen durum değişebilir.</div>`;
    if (typeof battleReportForPlayer==='function'){
      const br=battleReportForPlayer(s);
      if (br && (br.active || G.dismissedBattleReports?.[s.id]!==battleReportViewKey(s))){
        const foe=G.emps[br.enemy.id];
        const foeName=foe && this.diploKnown(foe.id) ? esc(foe.name) : 'Tanımlanamayan düşman';
        const durum=br.active ? 'SÜRÜYOR' : br.winner===0 ? 'ZAFER' :
          br.winner===null ? 'SONUÇSUZ' : 'YENİLGİ';
        const col=br.active?'#ff9b3d':br.winner===0?'#65e08a':'#ff5f6d';
        h += `<div class="box" style="border-color:${col}"><div class="bt">
          <span>⚔ MUHAREBE RAPORU</span><span class="battleReportActions"><b style="color:${col}">${durum}</b>${!br.active?`<button class="battleReportClose" data-a="dismissBattleReport" data-x="${s.id}" data-report="${esc(battleReportViewKey(s))}" aria-label="Bu tamamlanmış muharebe raporunu gizle" title="Yalnız bu raporu gizle">✕</button>`:''}</span></div>
          <div class="row"><span>Rakip</span><b>${foeName}</b></div>
          <div class="row"><span>Kayıplar</span><b>Biz ${br.mine.loss} · Düşman ${br.enemy.loss}</b></div>
          <div class="row"><span>Ricat eden filo</span><b>Biz ${br.mine.retreat} · Düşman ${br.enemy.retreat}</b></div>`;
        if (br.mine.dealt!==null){
          h += `<div class="row"><span>Son tur gerçek gövde hasarı</span>
            <b>Verdik ${fmt(br.mine.dealt)} · Aldık ${fmt(br.enemy.dealt)}</b></div>
            <div class="row"><span>Tur başında ateş açabilen / toplam gemi</span>
            <b>Biz ${br.mine.ready}/${br.mine.ships} · Düşman ${br.enemy.ready}/${br.enemy.ships}</b></div>
            <div class="mini">${RANGE_NAMES[br.band]||''} · ${br.rounds}. tur ·
              bizim ikmal %${Math.round(br.mine.supply*100)}</div>`;
        }
        h += `</div>`;
      }
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
        <b style="color:#65e08a">+260 alaşım, +180 mineral, +40 etki</b> kazanırsın.
        <br>Korsanlara savaş ilanı gerekmez. Silahlı filon yuvaya ulaşınca saldırır;
        yol üzerindeki diğer devletlerin geçiş izinleri geçerlidir.</div>`;
      if (myPow > 0){
        const br = s.battleReport;
        const engaged = br && !br.done && [br.a,br.b].includes(0) &&
          [br.a,br.b].includes(G.wildId) && here.some(f=>f.combat);
        h += `<div class="mini" style="color:#6ff2c8">⚔ ${engaged ? 'Filon korsanlarla savaşıyor' :
          'Filon yuvanın bulunduğu sistemde'} — güç ${fmt(myPow)}</div>`;
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

    const conflicts=planetConflictStates(s);
    if(conflicts.length){h+='<section class="box warStatus"><div class="bt">⚔ GEZEGEN SAVAŞI</div>';
      for(const x of conflicts){const pl=s.planets.find(p=>p.i===x.planet);
        h+=`<div class="bd"><b>${esc(pl.name)} — ${x.kind==='invasion'?'⚑ İşgal sürüyor':'💥 Bombardıman'}</b><br>${esc(G.emps[x.attacker].name)} → ${esc(G.emps[x.defender].name)}<br>Kalkan ${fmt(x.shield)} · Garnizon ${fmt(x.garrison)}${x.siege?' · Kuşatma '+x.siege+'/6 ay':''}</div>`;
      }h+='</section>';
    }
    if(pVis(s)||s.planets.some(p=>p.owner===0))for(const pl of s.planets){const last=pl.col&&pl.col.lastWarResult;
      if(last&&G.day-last.day<=90)h+=`<div class="mini">⚑ ${esc(pl.name)}: kontrol ${esc(G.emps[last.from]?.name||'Bilinmiyor')} → ${esc(G.emps[last.to]?.name||'Bilinmiyor')}</div>`;
    }
    h += `<div class="ph">GEZEGENLER</div>`;
    const folds=this.planetFolds();
    for (const pl of s.planets){
      const def = PLANETS[pl.t];
      const hab = habOf(e, pl);
      const dep = pl.dep ? DEPOSITS.find(d=>d.id===pl.dep) : null;
      const mine = pl.owner === 0;
      h += `<div class="box" data-colony-planet="${s.id}:${pl.i}">`;
      if(hasCivic(e,'devourer')){const q=canDevour(e,s,pl);h+=`<button class="abtn dgr" data-a="devour" data-x="${s.id}:${pl.i}" ${q.ok?'':'disabled'}>🌟 Gezegeni Tüket</button><div class="mini">${esc(q.ok?'Kalıcı işlem; onay ekranında kayıpları incele.':q.why)}</div>`;}
      if(pl.col){
        const folded=folds.has(s.id+':'+pl.i),owner=territoryOwnerInfo(pl.owner);
        h+=`<button class="planetFoldHeader" data-a="planetFold" data-x="${s.id}:${pl.i}"
          aria-expanded="${!folded}" aria-label="${esc(pl.name)}: ${folded?'ayrıntıları aç':'ayrıntıları küçült'}">
          <span>${folded?'▸':'▾'}</span><b class="planetFoldName">${esc(pl.name)}</b>
          ${folded?`<span class="planetFoldStats">Nüfus ${Math.floor(pl.col.pop)} · Moral ${Math.round(pl.col.stab)}${pl.col.q&&pl.col.q.length?' · İnşa '+pl.col.q.length:''}</span>`:''}
          ${owner?`<span class="flag" title="${esc(owner.name)}" style="background:${owner.col}"></span>`:''}</button>`;
        if(folded){h+='</div>';continue;}
      }
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
      h += `<div class="bt"><span>${pl.col?'':esc(pl.name)}${sym}</span>${!pl.col&&pl.owner>=0?`<span class="flag" style="background:${G.emps[pl.owner].col}"></span>`:''}</div>`;
      h += `<div class="bd">${def.n}${def.k==='hab'?` · yaşanabilirlik <b style="color:${hab>=60?'#65e08a':hab>=35?'#ff9b3d':'#ff5f6d'}">%${hab}</b>`:''}${pl.sz?` · boyut ${pl.sz}`:''}</div>`;
      if(typeof ColonyUI!=='undefined')h+=ColonyUI.planet(e,s,pl);
      if(pl.col){
        const colonyOwner=territoryOwnerInfo(pl.owner);
        h += `<div class="mini">Koloni sahibi: <b style="color:${colonyOwner?colonyOwner.col:'#8b98ad'}">${colonyOwner?esc(colonyOwner.name):'Bilinmiyor'}</b></div>`;
      }
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
        if(mine&&typeof ColonyUI!=='undefined')h+=ColonyUI.stabilityNote(e,s,pl);
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
                  ? 'mevcut sıkıyönetim/fetih koruması: ayda −2'
                  : 'normal ilerlemede '+Math.max(0,lim-sc)+' sayaç adımı kaldı; koşullar değişebilir'}</div>
              <div class="mini" style="grid-column:1/-1;margin:1px 0 0">
                ${(e.hitLog||[]).some(w=>w.k==='kiskirt'&&!w.known&&w.sys===s.id&&w.pi===pl.i)?'🔍 DIŞ MÜDAHALE ŞÜPHESİ — İstihbarattan Derin Soruşturma yap.<br>':''}
                İstikrarı ${typeof SECESSION_STAB !== 'undefined' ? SECESSION_STAB : 40}
                üstüne çıkar; mevcut müdahale seçeneklerini incele. İşlenen sağlıklı ayda sayaç −2 geriler.</div>
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
                ? (st && st.dur ? 'AÇIK · BEKLİYOR' : 'AÇIK · AKTİF') : 'KAPALI · Manuel yönetim'}</b></div>`;
            if (!pl.col.f)h+='<div class="mini">Temel sanayi planı; ekonomik odak bonusu değiştirilmez.</div>';
            if (pl.col.auto && st && st.dur)
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
          h += `<div class="act2 buildingGrid">`;
          for (const k in BUILDINGS){
            const B = BUILDINGS[k], n = c.b[k]||0;
            const queued=colonyQueuedOf(c,k);
            const full = (B.tech&&!e.techs[B.tech]) || n+queued >= B.max || colonyUsed(c)+colonyQueued(c) >= colonySlots(c, e, pl);
            const cost=buildingCost(e,k),afford=Object.keys(cost).every(r=>e.res[r]>=cost[r]);
            /* FAZ 62: 'i' butonu kaldırıldı — bilgi için binaya
               UZUN BAS (data-hold). Mobilde parmak yeri kazandırır
               ve yanlışlıkla bilgi açılması biter. */
            const label={maden:'Maden',santral:'Santral',ciftlik:'Çiftlik',lab:'Laboratuvar',dokum:'Dökümhane',tersane:'Tersane',kale:'Savunma',arsiv:'Arşiv',klinik:'Klinik',kuyu:'Termal Kuyu',asansor:'Uzay Asansörü',habitat:'Habitat',fabrika:'Tüketim',liman:'Ticaret Limanı',iktisat_b:'İktisat',sinod_e:'Sinod Evi',oto_lab:'Otomasyon',birlik_k:'Birlik',sentetik_h:'Üretim Hücresi',sinaps_m:'Sinaps',derin_s:'Derin Sondaj',biyom_b:'Biyom'}[k]||B.n;
            h += `<div class="bWrap ${n>0?'has-dem':''}" data-building="${k}">
              <button class="abtn ${full||!afford?'dis':''}" data-a="build" data-hold="${k}" data-x="${s.id}:${pl.i}:${k}" title="${esc(B.n+' — '+B.d)}" aria-label="${esc(B.n)} inşa et · ${n}/${B.max}">` +
                 `<span class="buildingName">${B.tech&&!e.techs[B.tech]?'🔒 ':''}${esc(label)}</span><span class="buildingMeta"><span class="buildingCount">${n}/${B.max}${queued?' +'+queued:''}</span><span class="buildingCost">` +
                 Object.entries(cost).map(([r,v])=>`<span style="color:${e.res[r]>=v?RES[r].c:'#ff5f6d'}">${RES[r].ico}${v}</span>`).join(' ') +
                 `</span></span></button>` +
                 /* FAZ 14: mevcut binayı yıkma tuşu */
                 (n > 0 ? `<button class="demX" data-a="demolish" data-x="${s.id}:${pl.i}:${k}"
                    aria-label="${esc(B.n)} yık" title="${esc(B.n)} yık — onay gerekir"><span class="demIcon" aria-hidden="true">⌫</span></button>` : '') +
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
          ? G.fleets.find(q => q.id === ral.fleet && q.e===G.p.id && q.ships.length) : null;
        const bekliyor = View.rallyForSys === s.id;
        h += `<div class="ph">📍 RALLİ NOKTASI</div>`;
        if (bekliyor){
          h += `<div class="mini" style="color:#6ff2c8">Haritadan bir sistem seç —
            buradan çıkan askeri gemiler oraya gidecek.</div>
            <div class="act2"><button class="abtn" data-a="rallySysCancel">
              ✕ VAZGEÇ</button></div>`;
        } else if (ral){
          h += `<div class="row"><span>Hedef</span>
            <b style="color:#6ff2c8">${ral.fleet!==undefined ? (hedefFl ? 'Filo: '+esc(hedefFl.name||'Filo') : 'Hedef filo artık yok')
              : hedefSy ? 'Sistem: '+esc(hedefSy.name) : 'Geçersiz sistem'}</b></div>
            <div class="mini">${ral.fleet!==undefined ? 'Eski filo hedefi korunuyor; Değiştir ile sabit sistem seçebilirsin.' : 'Genel askeri üretim bu sisteme gider.'}
            Özel takviye siparişleri kendi hedef filosunu izler. Sivil gemiler yerinde kalır.</div>
            <div class="act2">
              <button class="abtn" data-a="rallySysSet" data-x="${s.id}">
                📍 DEĞİŞTİR</button>
              <button class="abtn" data-a="rallySysClear" data-x="${s.id}">
                ✕ KALDIR</button></div>`;
        } else {
          h += `<div class="mini">Bu tersaneden çıkan askeri gemiler şu an
            genel üretimde yerinde kalır. Filo şablonu / takviye siparişleri hedef filosuna otomatik gider; her tersaneye ralli ataman gerekmez.</div>
            <div class="act2"><button class="abtn pri" data-a="rallySysSet"
              data-x="${s.id}">📍 RALLİ NOKTASI SEÇ</button></div>`;
        }
      }


      let shipQueueHtml='';
      if (s.queue.length){
        /* ═══ FAZ 60: SÜREKLİ ÜRETİM DÖNGÜSÜ ═══ */
        if (typeof loopBuildStatus === 'function' && s.owner === 0){
          const lb = s.loopBuild;
          const st = lb ? loopBuildStatus(e, s) : null;
          shipQueueHtml += `<div class="ph">🔁 SÜREKLİ ÜRETİM</div>`;
          if (!lb){
            shipQueueHtml += `<div class="mini">Bir gemi tipi seç — tersane kaynak
              yettiği sürece durmadan üretsin. Kasa
              ${typeof LOOP_ALA_FLOOR !== 'undefined' ? LOOP_ALA_FLOOR : 400}
              alaşımın altına inerse otomatik duraklar.</div>`;
            const uygun = Object.keys(SHIPS).filter(k =>
              !SHIPS[k].crisisOnly && shipBuildAccess(e, k).ok);
            shipQueueHtml += `<div class="act2">`;
            uygun.slice(0, 6).forEach(k => {
              shipQueueHtml += `<button class="abtn" data-a="loopSet" data-x="${s.id}:${k}">
                🔁 ${esc(SHIPS[k].n)}</button>`;
            });
            shipQueueHtml += `</div>`;
          } else {
            const renk = st && st.dur ? '#ff9b3d' : '#65e08a';
            shipQueueHtml += `<div class="box" style="border-color:${renk}">
              <div class="bt"><span>🔁 ${esc(SHIPS[lb] ? SHIPS[lb].n : lb)}</span>
                <span class="tag ${st && st.dur ? 'e' : 'p'}">${
                  st && st.dur ? 'DURAKLADI' : 'ÜRETİYOR'}</span></div>
              <div class="bd">${st && st.dur
                ? '<b style="color:#ff9b3d">' + esc(st.why) +
                  '</b> — üretim koşulları sağlanınca kendiliğinden devam eder.'
                : 'Kuyruk boşaldıkça otomatik yenileniyor.'}</div>
              <div class="act2"><button class="abtn" data-a="loopOff"
                data-x="${s.id}">✕ DÖNGÜYÜ DURDUR</button></div></div>`;
          }
        }

        const slots = yardCount(s);
        const totDays = Math.ceil(s.queue.reduce((a,q)=>a+q.left,0));
        shipQueueHtml += `<div class="row"><span>Tersane yuvası</span><b style="color:#6ff2c8">${slots} paralel</b></div>`;
        shipQueueHtml += `<div class="row"><span>Kuyrukta</span><b>${s.queue.length} gemi</b></div>`;
        shipQueueHtml += `<button class="abtn" data-a="shipCancelAll" data-x="${s.id}">✕ BU TERSANEDEKİ TÜM SİPARİŞLERİ İPTAL ET</button>`;
        shipQueueHtml += `<div class="qbox">`;
        this._shipCancelRefs=new Map();
        const active = activeShipQueue(s);
        s.queue.forEach((q,i)=>{
          const access = shipBuildAccess(G.emps[q.e], q.cls);
          const act = active.includes(i);
          const cancelToken=shipOrderToken(q);
          this._shipCancelRefs.set(cancelToken,{sys:s,order:q});
          shipQueueHtml += `<div class="box" style="${act?'border-color:#ff9b3d':''}">
                <div class="bt"><span>${act?'▸ ':''}${SHIPS[q.cls].n}${q.fed!==undefined?' <b class="fedTag" style="color:#8fd3ff">FEDERAL</b>':''}</span>
                <span class="mono" style="color:${act?'#ff9b3d':'#7d90ad'}">${Math.ceil(q.left)}g</span>
                ${q.e===G.p.id?`<button class="sBtn shipCancelBtn" data-a="shipCancel" data-x="${cancelToken}" aria-label="${esc(SHIPS[q.cls].n)} siparişini iptal et">✕</button>`:''}</div>
                <div class="bar em"><i style="width:${(1-q.left/q.tot)*100}%"></i></div>
                <div class="mini">${q.fed!==undefined?esc('Federal sipariş · '+Math.round(q.fedPaid?.ala||0)+' alaşım ortak fondan ödendi · kalan '+Math.ceil(q.left)+' gün · iptalde fona döner'):esc(this.queueDeliveryText(s,q))}</div>
                ${!access.ok ? '<div class="mini">BEKLİYOR · '+esc(access.why)+'</div>' : ''}</div>`;
        });
        shipQueueHtml += `</div>`;
      }
      const shipments=G.fleets.filter(f=>f.e===0&&f.ships.length&&f.shipment?.origin===s.id);
      if(shipments.length)h+='<details class="dcDetails"><summary>Bu tersanenin sevkiyatları · '+shipments.length+'</summary>'+shipments.map(f=>this.shipmentRow(f)).join('')+'</details>';
      h += `<div class="act2">`;
      for (const k in SHIPS){
        if (SHIPS[k].crisisOnly) continue;      // FAZ 34: organik sürü gemileri gizli
        const d = SHIPS[k];
        const access = shipBuildAccess(e, k);
        const locked = !access.ok;
        const cost = shipCost(e,k);
        const afford = Object.keys(cost).every(r=>e.res[r]>=cost[r]);
        h += `<button class="abtn ${locked||!afford?'dis':''}" ${locked||!afford?'disabled':''} data-a="ship" data-hold="ship:${k}" data-x="${s.id}:${k}" title="${esc(locked?access.why:d.n)}">${d.ab}<br>` +
             `<span style="font-size:9px">${locked?'<span style="color:#7d90ad">KİLİTLİ</span>':
               Object.entries(cost).map(([r,v])=>`<span style="color:${e.res[r]>=v?RES[r].c:'#ff5f6d'}">${RES[r].ico}${v}</span>`).join(' ')}</span></button>`;
      }
      h += `</div>`+this.fedOrderHtml(s)+shipQueueHtml;
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
      if(typeof ArchiveUI!=='undefined'&&View.sel?.e===0&&View.sel.ships.some(sh=>sh.c==='ins'))h+=`<button class="abtn pri" data-a="remoteBuild" data-x="${View.sel.id}">Seçili gemiyle bu sisteme uzaktan inşaat</button>`;
      const builders = G.fleets.filter(f=>f.e===0 && fleetHasRole(f,'insaat') && f.sys===s.id);
      if(G.cfg.gates===false)h+='<div class="mini">Yıldız kapıları bu galakside kapalı: yeni inşa, geçiş ve kapı ikmali yok. Eski kapılar korunur; önceden ödenmiş işler ek bedel/iade olmadan tamamlanır ve pasif kalır.</div>';
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
    this._jointSurface='fleet';
    if(View.sel&&View.sel.e!==0&&G.fleets.includes(View.sel)&&View.fleetVisible(View.sel)){
      const f=View.sel,e=G.emps[f.e],ratio=clamp(fleetHealth(f),0,1),groups={};for(const ship of f.ships)(groups[ship.c]??=[]).push(ship);
      return `<div class="ph">${esc(e?.name||'Bilinmeyen devlet')} · ${esc(f.name)}</div><div class="row"><span>Görülen gövde bütünlüğü</span><b>%${Math.round(ratio*100)}</b></div><div class="bar hp"><i style="width:${ratio*100}%"></i></div>`+Object.entries(groups).map(([c,ships])=>`<div class="box"><b>${esc(SHIPS[c]?.n||c)} ×${ships.length}</b><div class="mini">Gövde %${Math.round(ships.reduce((n,s)=>n+(Number.isFinite(s.h)?s.h:1),0)/ships.length*100)}</div></div>`).join('')+'<div class="mini">Görünen hasar durumu. Yabancı devletin özel kalkan, silah yükseltmeleri ve emirleri açıklanmaz.</div>';
    }
    const mine = G.fleets.filter(f=>f.e===0);
    let h = this.jointPanel();
    const f = View.sel && View.sel.e===0 ? View.sel : null;
    if (f && f.ships.length){
      const e = G.p;
      if(f.ships.some(sh=>sh.c==='ins')&&typeof ArchiveUI!=='undefined')h+=ArchiveUI.construction(f);
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
          if(ayni.length>5)h+=`<details class="dcDetails"><summary>${esc(G.sys[f.sys].name)} · ${ayni.length} filo · sistem listesini aç</summary>`;
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
          if(ayni.length>5)h+='</details>';
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
          h += `<div class="mini" style="color:${col}">⚠ Aylık ~%${kayip} gövde yıpranması ·
            bakım ×${(1 + (1 - sup) * 2.2).toFixed(1)}</div>`;
        }
        if (f.retreating) h += `<div class="mini" style="color:#ff9b3d">↩ İkmale çekiliyor</div>`;
      }
      h += `<div class="row"><span>Stratejik filo gücü</span><b style="color:#6ff2c8">${fmt(fleetPower(f))}</b></div>`;
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

      if(hasShipment(f)){
        const d=f.shipment || {},ana=G.fleets.find(x=>x.id===(d.fleet??f.joinFleet)&&x.e===0);
        const sid=d.sys??f.rallyTo;
        const label=d.fleet!==undefined||f.joinFleet!==undefined ? (ana?ana.name:'Kayıp filo') : (G.sys[sid]?G.sys[sid].name:'Geçersiz hedef');
        h+=`<div class="ph">SEVKİYAT</div>`+this.shipmentRow(f);
      }
      /* 93A: mevcut / üretimde / yolda / yeni sipariş ayrı gösterilir. */
      const reinforcement=fleetReinforcementStatus(G.p,f);
      if(reinforcement.current!==undefined){
        const r=reinforcement;
        h+=`<div class="ph">FİLO TAKVİYESİ</div>
          <div class="row"><span>Kadro</span><b>${r.current} / ${r.target}</b></div>
          <div class="row"><span>Üretimde / sırada</span><b>${r.queued}</b></div>
          <div class="row"><span>Filoya katılmak üzere yolda / bekliyor</span><b>${r.inTransit}</b></div>
          <div class="row"><span>Yeni sipariş gereken</span><b>${r.missing}</b></div>
          <div class="mini">Takviye gemileri bu filonun hareketini izler; tersanenin genel toplanma noktasını değiştirmez.
          ${r.cls?'Sipariş sınıfı: '+esc(SHIPS[r.cls].n)+' (filodaki baskın savaş sınıfı).':''}
          Bu işlem yeni gemi üretir; mevcut gemilerin gövdesini veya erzağını doldurmaz.</div>
          ${r.ok?'':'<div class="mini">'+esc(r.why)+'</div>'}
          <button class="abtn ${r.ok?'pri':'dis'}" ${r.ok?'':'disabled'} data-a="reinf" data-x="${f.id}">
          ⚓ TAKVİYE SİPARİŞİ${r.ok?' · '+Math.min(30,r.missing)+' gemi':''}</button>`;
        h+=this.reinforcementJobs(f);
      }
      if(!hasShipment(f) && !f.federal && !f.guardLocked){
        h+=this.compositionPanel(f,reinforcement);
        h+=`<button class="abtn" style="min-height:44px" data-a="compositionEdit" data-x="${f.id}">BİLEŞİMİ ${f.composition?'DÜZENLE':'OLUŞTUR'}</button>`;
        const receipt=this._reinforcementReceipt;
        if(receipt && receipt.f===f && receipt.world===G.sys){
          const groups={};for(const q of receipt.orders){const k=q.sys+':'+q.cls;
            if(!groups[k])groups[k]={...q,n:0};groups[k].n++;groups[k].eta=Math.max(groups[k].eta,q.eta);}
          h+=`<div class="ph">SON TAKVİYE PLANI</div><div class="mini">Sipariş anındaki yaklaşık son teslim süresi. Hedef hareketi, savaş ve yeni sabotaj süreyi değiştirebilir.</div>`;
          for(const q of Object.values(groups))h+=`<div class="box"><div class="mini">${esc(G.sys[q.sys].name)} · ${q.n} × ${esc(SHIPS[q.cls].n)} · ~${Math.ceil(q.eta)} gün</div></div>`;
        }
      }
      for(const delivery of mine.filter(x=>x!==f && x.joinFleet===f.id && x.ships.length)){
        h+=this.shipmentRow(delivery);
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
          <div class="bd">ortalama gövde ${Math.round(d.hull*(1+G.p.mods.hullMul)*avg)}/${Math.round(d.hull*(1+G.p.mods.hullMul))} · kalkan kapasitesi ${Math.round(d.sh*(1+G.p.mods.shMul))} · hasar ${Math.round(d.dmg*(1+G.p.mods.dmgMul))}</div>
          ${shipBuildAccess(G.p,c).ok?'':`<div class="mini">Mevcut gemi korunuyor · yeni üretim: ${esc(shipBuildAccess(G.p,c).why)}. Bu gemi başlangıçtan, önceki üretimden veya eski kayıttan gelebilir.</div>`}
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
    const filters={all:'Tümü',war:'Savaş',science:'Bilim',colony:'Koloni',build:'İnşaat',idle:'Bekleyen'};
    const waiting=fl=>fl.sys>=0&&!fl.path.length&&!fl.combat&&!fl.auto&&!fl.surv&&!hasShipment(fl);
    const fits=(fl,k)=>k==='all'||k==='war'&&isArmed(fl)||k==='science'&&fleetHasRole(fl,'bilim')||k==='colony'&&fleetHasRole(fl,'koloni')||k==='build'&&fleetHasRole(fl,'insaat')||k==='idle'&&waiting(fl);
    const filter=Object.hasOwn(filters,this.fleetFilter)?this.fleetFilter:'all';
    h+='<nav class="fleetFilters" aria-label="Filo filtreleri">'+Object.entries(filters).map(([k,n])=>`<button class="abtn ${filter===k?'pri':''}" data-a="fleetFilter" data-x="${k}" aria-pressed="${filter===k}">${n} (${mine.filter(fl=>fl.ships.length&&fits(fl,k)).length})</button>`).join('')+'</nav>';
    const groups=new Map();
    for(const fl of mine.filter(fl=>fl.ships.length&&fits(fl,filter))){const key=waiting(fl)?fl.sys+':'+(isArmed(fl)?'war':fleetGroup(fl)):'single:'+fl.id;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(fl);}
    for(const group of groups.values()){
    if(group.length>1)h+=`<details class="dcDetails fleetGroup" ${group.includes(f)?'open':''}><summary>${esc(G.sys[group[0].sys].name)} · ${isArmed(group[0])?'savaş':'sivil'} · ${group.length} bekleyen filo / ${group.reduce((n,fl)=>n+fl.ships.length,0)} gemi</summary><div class="mini">Yalnız görsel grup; filolar ve emirleri ayrıdır.</div>`;
    group.forEach(fl=>{
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
    if(group.length>1)h+='</details>';
    }
    return h;
  },

  /* =============== BİLİM =============== */
  scienceState(){
    if(this._scienceWorld!==G.p){
      this._scienceWorld=G.p;
      this._science={tab:'fiz',focus:null,zoom:1,positions:{},queueOpen:true,filter:'all',route:false};
    }
    return this._science;
  },
  scienceSignature(){
    const e=G.p;
    return JSON.stringify([e.techs,e.rq,e.rp,e.research,e.techMul,e.streakB,e.streakN,e.inc.ara,e.ascend,e.ascendP,e.ethics,e.mizac,e.persLock,e.physio]);
  },
  scienceLayout(branch){
    const ids=Object.keys(TECHS).filter(id=>TECHS[id].b===branch),depth={},visiting=new Set();
    const layer=id=>{
      if(depth[id]!==undefined)return depth[id];
      if(visiting.has(id))return 0;
      visiting.add(id);
      const parents=(Array.isArray(TECHS[id].r)?TECHS[id].r:[]).filter(k=>researchValidTech(k)&&TECHS[k].b===branch);
      const d=Math.max(Math.max(0,TECHS[id].t-1),...parents.map(k=>layer(k)+1));
      visiting.delete(id);return depth[id]=d;
    };
    const rows={},nodes={};
    for(const id of ids){const d=layer(id);(rows[d]||(rows[d]=[])).push(id);}
    let height=128,width=212;
    for(const d of Object.keys(rows).sort((a,b)=>a-b)){
      rows[d].forEach((id,i)=>{nodes[id]={x:16+Number(d)*212,y:14+i*120};});
      height=Math.max(height,rows[d].length*120+24);width=Math.max(width,(Number(d)+1)*212+16);
    }
    return {nodes,width,height};
  },

  scienceStatus(id,plan){
    const e=G.p;
    if(e.techs[id])return ['done','Tamamlandı'];
    if(!researchAccess(e,id).ok)return ['locked',researchAccess(e,id).why];
    if(e.rq[TECHS[id].b]===id)return ['active','Araştırılıyor'];
    if(plan.order.includes(id))return ['planned',plan.goals.some(g=>g.id===id)?'Ana hedef':'Ön koşul planı'];
    return researchReady(e,id)?['ready','Seçilebilir']:['locked','Kilitli · hedef seçilebilir'];
  },
  scienceBenefits(id){
    const b=techBenefits(id),t=TECHS[id];
    let text=[...b.effects,...b.unlocks].map(esc).join(' · ')||'Doğrudan sayısal kazanım yok';
    if(t.sway)text+='<br>↯ '+Object.entries(t.sway).filter(([k])=>TECHS[k]).map(([k,v])=>esc(TECHS[k].n)+' temel maliyeti '+(v<1?'−':'+')+'%'+Math.round(Math.abs(v-1)*100)).join(' · ')+' (uygarlık etkileri uygulanır)';
    return text;
  },
  p_bilim(){
    const e=G.p,s=this.scienceState(),plan=researchPlan(e);
    let h='<div class="scienceRoot"><header class="scHeader"><nav class="scTabs" aria-label="Bilim dalları">';
    for(const [b,B] of Object.entries(BRANCH))h+=`<button data-a="scienceTab" data-x="${b}" aria-pressed="${s.tab===b}" class="${s.tab===b?'on':''}">${B.n}</button>`;
    h+=`<button data-a="scienceTab" data-x="history" aria-pressed="${s.tab==='history'}" class="${s.tab==='history'?'on':''}">Geçmiş</button></nav>`;
    h+='<div class="scFilters" aria-label="Araştırma modu">'+[['manual','Manuel'],['semi','Yarı otomatik'],['auto','Otomatik']].map(([key,label])=>`<button data-a="scienceMode" data-x="${key}" aria-pressed="${researchMode(e)===key}" class="${researchMode(e)===key?'on':''}">${label}</button>`).join('')+'</div>';
    h+='<p class="scModeHelp">'+({manual:'Yalnız hedefler ve zorunlu ön koşullar. Plan bitince puanlar birikir.',semi:'Hedefler öncelikli; boş dallarda uygarlığına uygun otomatik seçim.',auto:'Seçimi otomasyon yönetir. Kayıtlı hedeflerin korunur; bu modda uygulanmaz.'}[researchMode(e)])+'</p>';
    h+=`<div class="scMonthly" data-monthly-research="${e.inc.ara}" title="Ekonominin net aylık araştırması: ${e.inc.ara}">Aylık araştırma: ${e.inc.ara>=0?'+':''}${Number(e.inc.ara||0).toLocaleString('tr-TR',{maximumFractionDigits:2})} ✦</div><div class="scIncomeHelp">Ekonomide hesaplanan net üretim; etkin bilim dalları arasında paylaşılır.</div>`;
    h+=`<details class="scSummary"><summary>Araştırmalar · ${Object.keys(TECHS).filter(id=>e.techs[id]).length}/${Object.keys(TECHS).length} tamamlandı${e.ascend?' · Kadim '+e.ascend:''}</summary>`;
    for(const [b,B] of Object.entries(BRANCH)){
      const id=e.rq[b];h+=`<div>${B.n}: ${id?esc(TECHS[id].n)+' · '+fmt(e.rp[b])+'/'+fmt(techCost(e,id))+' ✦':'Tamamlandı / bekliyor'}</div>`;
    }
    h+='</details></header>';
    if(s.tab==='history'){
      h+='<div class="scHistory"><div class="scFilters" aria-label="Geçmiş filtresi">';
      for(const [b,n] of [['all','Tümü'],...Object.entries(BRANCH).map(([k,v])=>[k,v.n])])h+=`<button data-a="scienceFilter" data-x="${b}" aria-pressed="${s.filter===b}" class="${s.filter===b?'on':''}">${n}</button>`;
      h+='</div>';
      const rows=researchHistory(e,s.filter),sources={research:'Araştırma',trade:'Teknoloji takası',espionage:'Casusluk',event:'Olay',ruin:'Kadim kalıntı',origin:'Köken',legacy:'Eski kayıt'};
      for(const row of rows){const t=TECHS[row.id],o=techOrigin(row.id);
        h+=`<article class="scHistoryItem"><b>${esc(t.n)}</b><small>${BRANCH[t.b].n} · ${row.year?row.year+'.'+String(row.month).padStart(2,'0'):'Tarih bilinmiyor'} · ${sources[row.source]||'Bilinmeyen kaynak'}</small><p>${this.scienceBenefits(row.id)}</p>${o?`<small>${o.icon} ${esc(o.label)}${o.condition?' · '+esc(o.condition):''}</small>`:''}</article>`;
      }
      if(!rows.length)h+='<p class="empty">Bu filtrede tamamlanan araştırma yok.</p>';
      h+='</div>';
    }else{
      const layout=this.scienceLayout(s.tab);
      h+=`<div class="scTools"><span>Dokun: hedef ekle / çıkar</span><button data-a="scienceZoom" data-x="-0.15" aria-label="Bilim ağacını uzaklaştır">−</button><button data-a="scienceZoom" data-x="reset" aria-label="Yakınlaştırmayı sıfırla">%${Math.round(s.zoom*100)}</button><button data-a="scienceZoom" data-x="0.15" aria-label="Bilim ağacını yakınlaştır">+</button></div>`;
      h+=`<div class="scViewport" tabindex="0" aria-label="${BRANCH[s.tab].n} teknoloji ağacı; kaydırılabilir"><div class="scExtent" style="width:${layout.width*s.zoom}px;height:${layout.height*s.zoom}px"><div class="scScene" style="width:${layout.width}px;height:${layout.height}px;transform:scale(${s.zoom})"><svg class="scLinks" width="${layout.width}" height="${layout.height}" aria-hidden="true">`;
      for(const [id,p] of Object.entries(layout.nodes))for(const dep of Array.isArray(TECHS[id].r)?TECHS[id].r:[]){
        const q=layout.nodes[dep];if(!q)continue;
        h+=`<path class="${e.techs[dep]?'done':''}" d="M ${q.x+180} ${q.y+52} C ${q.x+198} ${q.y+52}, ${p.x-18} ${p.y+52}, ${p.x} ${p.y+52}"/>`;
      }
      h+='</svg>';
      for(const [id,p] of Object.entries(layout.nodes)){
        const t=TECHS[id],goal=plan.goals.find(g=>g.id===id),[status,label]=this.scienceStatus(id,plan),o=techOrigin(id),benefit=techBenefits(id);
        const cross=(Array.isArray(t.r)?t.r:[]).filter(k=>researchValidTech(k)&&TECHS[k].b!==t.b);
        h+=`<button class="scNode ${status} ${s.focus===id?'focused':''}" data-a="scienceNode" data-x="${id}" data-tech="${id}" aria-pressed="${!!goal}" style="left:${p.x}px;top:${p.y}px" aria-label="${esc(t.n)}; ${label}${goal?'; hedef '+goal.number+'; '+goal.extra+' eksik ön koşul':''}"><small>K${t.t} · ${fmt(techCost(e,id))} ✦ ${o?o.icon:''}</small><b>${goal?goal.number+' · +'+goal.extra+' ':''}${!researchReady(e,id)&&!e.techs[id]?'🔒 ':''}${esc(t.n)}</b><span>${esc(label)}${cross.length?' · ↗ '+cross.map(k=>BRANCH[TECHS[k].b].n).join(', '):''}</span><em>${esc([...benefit.effects,...benefit.unlocks].join(' · ')||t.d)}</em></button>`;
      }
      h+='</div></div></div>';
      if(s.focus&&researchValidTech(s.focus)){
        const id=s.focus,t=TECHS[id],o=techOrigin(id),route=researchRoute(e,id),goal=plan.goals.find(g=>g.id===id);
        const progress=e.rq[t.b]===id?e.rp[t.b]:(e.research&&e.research.bank[id]||0);
        h+=`<details class="scDetail" ${s.detailOpen?'open':''}><summary>${esc(t.n)} · K${t.t} · ${fmt(progress)}/${fmt(techCost(e,id))} ✦ · ${Math.max(0,route.order.length-1)} ön koşul</summary><div>${this.scienceBenefits(id)}</div>`;
        if(o)h+=`<div>${o.icon} ${esc(o.condition)}</div>`;
        if(!researchAccess(e,id).ok)h+=`<p role="alert">${esc(researchAccess(e,id).why)} · Yatırılan puan korunur.</p>`;
        if(Array.isArray(t.r)&&t.r.length)h+='<div>Ön koşullar: '+t.r.map(k=>researchValidTech(k)?`<button data-a="scienceFocus" data-x="${k}">${esc(TECHS[k].n)}</button>`:esc(k)).join(' ')+'</div>';
        if(goal)h+=`<div class="scTargetEdit"><button data-a="scienceMove" data-x="${id}:-1">← Öne al</button><button data-a="scienceMove" data-x="${id}:1">Sona al →</button><button data-a="scienceRemove" data-x="${id}">Kaldır</button></div>`;
        h+=`<button data-a="scienceNode" data-x="${id}">${goal?'Hedefi kaldır':'Hedefe ekle'}</button> <button data-a="scienceRoute">${s.route?'Rotayı gizle':'Otomatik rotayı göster'}</button>${goal?' <span>'+goal.number+'. hedef · +'+goal.extra+' yeni ön koşul</span>':''}`;
        if(s.route)h+=route.ok?'<ol class="scRoute">'+route.order.map(k=>`<li>${esc(TECHS[k].n)} · ${BRANCH[TECHS[k].b].n}${k===id?' · ANA HEDEF':''}</li>`).join('')+'</ol>':`<p role="alert">${esc(route.why)}</p>`;
        h+='</details>';
      }
    }
    h+=`<section class="scQueue"><button class="scQueueToggle" data-a="scienceQueue" aria-expanded="${s.queueOpen}">${s.queueOpen?'▾':'▸'} Kuyruk · ${plan.goals.length}</button>`;
    if(s.queueOpen){
      h+='<div class="scQueueTrack">';
      for(const g of plan.goals){const t=TECHS[g.id];
        const step=researchRoute(e,g.id).order.find(k=>!e.techs[k]&&e.rq[TECHS[k].b]===k),active=step&&TECHS[step],progress=active?e.rp[active.b]:0;
        const rate=active?Math.max(0,e.inc.ara)/Math.max(1,Object.keys(BRANCH).filter(b=>researchReady(e,e.rq[b])).length):0;
        const eta=active&&rate>0?Math.ceil(Math.max(0,techCost(e,step)-progress)/rate):null;
        const first=g.number===1&&active?` · ${fmt(progress)}/${fmt(techCost(e,step))} ✦ · ${eta===null?'bekliyor':'~'+eta+' ay'}${step!==g.id?' (ön koşul)':''}`:'';
        h+=`<div class="scGoal"><button class="scGoalFocus" data-a="scienceFocus" data-x="${g.id}"><b>${g.number} · +${g.extra} ${esc(t.n)}</b><small>${BRANCH[t.b].n} · ${g.ok?this.scienceStatus(g.id,plan)[1]:esc(g.why)}${first}</small></button></div>`;
      }
      if(!plan.goals.length)h+='<p class="scQueueEmpty">Ağaçtan uzak hedefleri de seçebilirsin. Boş kuyruk davranışı seçili araştırma moduna bağlıdır.</p>';
      h+='</div>';
    }
    return h+'</section></div>';
  },
  scienceRemember(){
    const v=$('diploPane').querySelector('.scViewport'),s=this.scienceState();
    if(v)s.positions[s.tab]={x:v.scrollLeft,y:v.scrollTop};
    const pane=$('diploPane'),q=pane.querySelector('.scQueueTrack'),d=pane.querySelector('.scDetail');
    if(q)s.queueX=q.scrollLeft;if(d)s.detailOpen=d.open;
  },
  openScience(focus=false){
    const s=this.scienceState(),pane=$('diploPane');this.globalCur='bilim';
    this.surfaceReplace(pane,`<div class="dpBox scienceBox"><div class="dpHd"><span>✦ BİLİM</span><button class="riX" data-a="closeDiplo" aria-label="Bilim ekranını kapat">✕</button></div>${this.p_bilim()}</div>`,'science');
    pane.classList.add('show');this._scienceSig=this.scienceSignature();
    const q=pane.querySelector('.scQueueTrack');if(q)q.scrollLeft=s.queueX||0;
    const v=pane.querySelector('.scViewport');
    if(!v)return;
    const pos=s.positions[s.tab]||{x:0,y:0};v.scrollLeft=pos.x;v.scrollTop=pos.y;
    if(focus&&s.focus){const p=this.scienceLayout(s.tab).nodes[s.focus];if(p){v.scrollLeft=Math.max(0,p.x*s.zoom-(v.clientWidth-180*s.zoom)/2);v.scrollTop=Math.max(0,p.y*s.zoom-(v.clientHeight-104*s.zoom)/2);}}
    // Native one-finger scrolling; only two-finger pinch cancels browser handling.
    let start=null,moved=false,pinch=null;
    v.addEventListener('touchstart',ev=>{
      const t=ev.touches;start=t.length?{x:t[0].clientX,y:t[0].clientY}:null;if(t.length===1)moved=false;else moved=true;
      if(t.length===2){pinch={distance:Math.hypot(t[0].clientX-t[1].clientX,t[0].clientY-t[1].clientY),zoom:s.zoom};moved=true;}
    },{passive:true});
    v.addEventListener('touchmove',ev=>{
      const t=ev.touches;
      if(start&&t.length&&Math.hypot(t[0].clientX-start.x,t[0].clientY-start.y)>8)moved=true;
      if(t.length===2&&pinch&&pinch.distance>0){ev.preventDefault();this.scienceApplyZoom(pinch.zoom*Math.hypot(t[0].clientX-t[1].clientX,t[0].clientY-t[1].clientY)/pinch.distance);}
    },{passive:false});
    v.addEventListener('touchend',()=>{pinch=null;},{passive:true});
    v.addEventListener('touchcancel',()=>{pinch=null;moved=true;},{passive:true});
    v.addEventListener('click',ev=>{if(moved){ev.preventDefault();ev.stopPropagation();moved=false;}},{capture:true});
  },
  scienceApplyZoom(value){
    const s=this.scienceState(),v=$('diploPane').querySelector('.scViewport');
    const z=clamp(value,.7,1.6),old=s.zoom;s.zoom=z;
    if(!v)return;
    const scene=v.querySelector('.scScene'),extent=v.querySelector('.scExtent'),layout=this.scienceLayout(s.tab);
    if(scene&&extent){scene.style.transform=`scale(${z})`;extent.style.width=layout.width*z+'px';extent.style.height=layout.height*z+'px';v.scrollLeft=(v.scrollLeft+v.clientWidth/2)*z/old-v.clientWidth/2;v.scrollTop=(v.scrollTop+v.clientHeight/2)*z/old-v.clientHeight/2;}
    const reset=$('diploPane').querySelector('[data-a="scienceZoom"][data-x="reset"]');if(reset)reset.textContent='%'+Math.round(z*100);
  },
  scienceAction(action,x){
    const s=this.scienceState();this.scienceRemember();let focus=false,result;
    if(action==='scienceTab'&&(BRANCH[x]||x==='history'))s.tab=x;
    else if(action==='scienceFilter'&&(BRANCH[x]||x==='all'))s.filter=x;
    else if(action==='scienceMode'){setResearchMode(G.p,x);}
    else if(action==='scienceQueue')s.queueOpen=!s.queueOpen;
    else if(action==='scienceRoute')s.route=!s.route;
    else if(action==='scienceZoom'){this.scienceApplyZoom(x==='reset'?1:s.zoom+Number(x));return;}
    else if(action==='scienceMove'){
      const [id,delta]=x.split(':'),at=(G.p.research&&G.p.research.targets||[]).indexOf(id);
      result=researchTarget(G.p,id,'move',at+Number(delta));
    }else if(researchValidTech(x)){
      if(s.focus!==x)s.detailOpen=false;s.focus=x;s.tab=TECHS[x].b;
      if(action==='scienceNode'||action==='scienceRemove'){if(!G.p.techs[x])result=researchTarget(G.p,x);}
      else if(action==='scienceFocus')focus=true;
    }
    if(result&&!result.ok)say(result.why,'war');
    if(action==='scienceRoute'||action==='scienceFocus')s.detailOpen=true;
    this.openScience(focus);
    if(action==='scienceRoute'||action==='scienceFocus'){const d=$('diploPane').querySelector('.scDetail');if(d)d.open=true;}
  },
  refreshScience(){
    const pane=$('diploPane');
    if(!pane.classList.contains('show')||!pane.querySelector('.scienceRoot'))return;
    if(this._scienceSig!==this.scienceSignature()){this.scienceRemember();this.openScience();}
  },

  /* =============== 86E DİPLOMASİ KOMUTA MERKEZİ =============== */
  diploKnown(id){
    const e=G.p,o=G.emps&&G.emps[id];
    return e && Number.isInteger(id) && o && o!==e && !o.dead && !o.wild &&
      !o.crisisSide && e.contact && e.contact[id] ? o : null;
  },
  diploName(id){
    const o=G.emps[id];
    return o&&(o===G.p||this.diploKnown(id))?o.name:'Bilinmeyen devlet';
  },
  ensureDiploWorld(){
    if (this._diploWorld && this._diploWorld!==G.p){
      this._diploDrafts={};this.deal=null;this.dealCounter=null;this.dealMsg='';
      this.diploTarget=null;this.diploPage='states';this._dcScroll={};
    }
    this._diploWorld=G.p;
    this._diploDrafts=this._diploDrafts||{};
    this._dcScroll=this._dcScroll||{};
  },
  stashDiploDraft(){
    if (this.deal && this._diploWorld===G.p){
      this._diploDrafts[this.deal.to]={deal:this.deal,counter:this.dealCounter||null,msg:this.dealMsg||''};
    }
  },
  forgetDeal(id){
    if (this._diploDrafts) delete this._diploDrafts[id];
    if (this.deal&&this.deal.to===id){this.deal=null;this.dealMsg='';}
    if (this.dealCounter&&this.dealCounter.from===id) this.dealCounter=null;
  },
  selectDiplo(id,page){
    this.ensureDiploWorld();
    if (!this.diploKnown(id)) return;
    this.stashDiploDraft();this.diploTarget=id;this.diploPage=page;
    if (page==='deal') this.openDeal(id);else this.openDiplo();
  },
  diploHeader(page,o){
    return `<div class="dpBox dcBox"><div class="dpHd"><span>DİPLOMASİ${o?' · <canvas class="identityBadge" data-identity="state" data-id="'+o.id+'" width="28" height="28"></canvas> '+esc(o.name):''}</span>
      <button class="riX" data-a="closeDiplo" aria-label="Diplomasiyi kapat">✕</button></div>
      <div class="dcNav" role="tablist" aria-label="Diplomasi bölümleri">`+
      [['states','DEVLETLER'],['relation','İLİŞKİ'],['deal','MÜZAKERE']].map(([key,label])=>
        `<button role="tab" aria-selected="${page===key}" class="${page===key?'on':''}"
          data-a="diploNav" data-x="${key}" ${key!=='states'&&!o?'disabled':''}>${label}</button>`).join('')+
      `</div><div class="dpBody dcBody" role="tabpanel">`;
  },
  renderDiplo(html,key){
    const pane=$('diploPane'),old=pane.querySelector?pane.querySelector('.dcBody'):null;
    if (old&&this._dcKey) this._dcScroll[this._dcKey]=old.scrollTop;
    const gen=(this._dcGen||0)+1;this._dcGen=gen;this._dcKey=key;
    this.surfaceReplace(pane,html,'diplo:'+key);pane.classList.add('show');
    const body=pane.querySelector?pane.querySelector('.dpBody'):null;
    if (body){
      body.scrollTop=this._dcScroll[key]||0;
      body.addEventListener('scroll',()=>{
        if (this._dcGen===gen) this._dcScroll[key]=body.scrollTop;
      });
    }
    setTimeout(()=>{
      if (this._dcGen!==gen||!pane.classList.contains('show')) return;
      this.paintLeaderPortraits();this.paintSprites();paintEmblems();
    },0);
  },
  diploIdentity(e,o){
    const lvl=intelOf(e,o.id),rel=Math.round(e.rel[o.id]||0);
    const P=lvl>=2?personaOf(o):null;
    const strategic=typeof aiStrategicIntel==='function'?aiStrategicIntel(e,o):null;
    const f=findFed(o),knownFed=f&&knownFederationBond(e,f,o.id);
    const federation=knownFed?`<div class="mini"><canvas class="identityBadge" data-identity="federation" data-id="${f.id}" width="28" height="28"></canvas> ${esc(f.name)} · ${esc(fedType(f).n)}</div>`:'';
    return `<div class="dcIdentity">
      <canvas class="dpPort" width="60" height="72" data-ps="${statePortraitSeed(o)}" data-lk="${esc(o.look||'humanoid')}"
        data-col="${esc(o.col)}" data-pers="${P?esc(personaKey(o)):'yayilmaci'}"
        data-mood="${rel}"></canvas><div><b>${esc(o.name)}</b>
      <div class="mini">${sysCount(o)} sistem · ${INTEL_LEVELS[lvl].n}</div>
      <div class="mini">Filo gücü: ${powerLabel(e,o)}</div>
      ${P?'<div class="mini">Mizaç: '+esc(P.n)+'</div>':''}${federation}${strategic?`<div class="mini" title="${esc(strategic.confidence)}">${esc(strategic.text)}</div>`:''}</div></div>
      <div class="row"><span>İlişkin</span><b>${rel>0?'+':''}${rel}</b></div>`;
  },
  diploTreaties(e,o){
    const tags=[];
    const atWar=!!(e.war[o.id]||o.war[e.id]);
    if (atWar) tags.push('⚔ Savaş');
    /* 86G savunması: eski/haricen bozulmuş durumda bile savaş ve NAP
       aynı anda gösterilmez. deserialize ayrıca kalıcı alanı temizler. */
    if (!atWar&&e.nap&&e.nap[o.id]>G.day) tags.push('🛡 Saldırmazlık · '+Math.ceil((e.nap[o.id]-G.day)/30)+' ay');
    if (!atWar&&e.pact&&e.pact[o.id]) tags.push('🤝 Ticaret paktı');
    if (!atWar&&e.ally&&e.ally[o.id]) tags.push('⚑ İttifak');
    if (o.passage&&o.passage[e.id]) tags.push('🚪 Onun sınırı sana açık');
    if (e.passage&&e.passage[o.id]) tags.push('🚪 Senin sınırın ona açık');
    if (e.visionFrom&&e.visionFrom[o.id]) tags.push('👁 Sana sensör paylaşımı');
    if (e.spynet&&e.spynet[o.id]) tags.push('🕸 Casusluk ağı');
    const fed=findFed(e),otherFed=findFed(o);
    if (fed&&otherFed&&fed.id===otherFed.id) tags.push('🏛 Aynı federasyon');
    /* FAZ 8: vasallık ilişkisi — kendi bağlarının yönetim özeti korunur. */
    if (isVassal(o)&&o.overlord===e.id){
      const t=vassalType(o),v=VASSAL_TYPES[t];
      tags.push('👑 SENİN VASALIN · '+v.n+' · öfke '+Math.round(o.vassalAnger||0)+'/100'+
        (t==='haracguzar'?' · vergi '+Math.round(o.vassalPaid||0)+'/ay':''));
    } else if (isVassal(o)) tags.push('⛓ '+this.diploName(o.overlord)+' vasalı');
    if (isVassal(e)&&e.overlord===o.id) tags.push('⛓ SENYÖRÜN · öfken '+Math.round(e.vassalAnger||0)+'/100');
    if (embargoOn(e,o.id)) tags.push(isPariah(o)?'⛔ Konsey yaptırımı: ticaret yasak':'🚫 Sen ambargo uyguluyorsun');
    if (embargoOn(o,e.id)) tags.push(isPariah(e)?'⛔ Konsey sana yaptırım uyguluyor':'🚫 Sana ambargo uyguluyor');
    const sub=sovereignPair(e,o)?(o.overlord===e.id?o:e):null;
    if(sub){const lord=overlordOf(sub),info=vassalLoyaltyInfo(sub);
      tags.push('Sadakat '+vassalLoyalty(sub)+'/100 · bağımsızlık arzusu '+Math.round(sub.vassalAnger||0)+'/100 · '+(info.hiz>=0?'+':'')+info.hiz.toFixed(2)+'/ay');
      tags.push('Vasalın senyöre ilişkisi '+Math.round(sub.rel[lord.id]||0)+' · emir yükü '+Object.keys(sub.edicts||{}).length);
      tags.push('İlişki sadakati etkiler; bağımsızlık arzusu ayrıca güç, itibar ve süreye bağlıdır. Vasallık tek başına sınır izni vermez.');
    }
    if (isPariah(o)) tags.push('⛔ Galaktik parya');
    return `<div class="dcTreaties">${tags.length?tags.map(t=>'<span>'+esc(t)+'</span>').join(''):
      '<span>Yürürlükte ortak antlaşma yok</span>'}</div>`;
  },
  p_diplo(){
    const e=G.p,known=G.emps.filter(o=>this.diploKnown(o.id));
    return `<div class="row"><span>Etki</span><b>${fmt(e.res.etk)}</b></div>
      <div class="row"><span>Elçi</span><b>${envoysUsed(e)} / ${envoyCap(e)}</b></div>
      <div class="row"><span>Temas kurulan devlet</span><b>${known.length}</b></div>
      <button class="abtn pri" data-a="diploPane">🤝 DİPLOMASİ MERKEZİNİ AÇ</button>
      <div class="mini">Devlet seç, ilişkinizi incele, teklifini müzakere masasında hazırla.</div>`;
  },
  diploDirectory(){
    const e=G.p,known=G.emps.filter(o=>this.diploKnown(o.id));
    const filter=this.diploFilter||'all';
    const shown=known.filter(o=>filter==='all'||(filter==='war'&&(e.war[o.id]||o.war[e.id]))||
      (filter==='ally'&&e.ally[o.id])||(filter==='envoy'&&envoyRecord(e,o.id)));
    let h=`<div class="dcOverview"><span>${known.length} temas</span><span>${fmt(e.res.etk)} ◈</span>
      <span>Elçi ${envoysUsed(e)}/${envoyCap(e)}</span></div><div class="dcFilters">`;
    h+=[['all','Tümü'],['war','Savaş'],['ally','Müttefik'],['envoy','Elçi var']].map(([k,n])=>
      `<button class="abtn ${filter===k?'pri':''}" aria-pressed="${filter===k}" data-a="diploFilter" data-x="${k}">${n}</button>`).join('');
    h+='</div>'+this.settlementAgenda()+'<div class="dpList">';
    for (const o of shown){
      const rel=Math.round(e.rel[o.id]||0),war=e.war[o.id]||o.war[e.id];
      h+=`<article class="dcState ${war?'war':''}"><button class="dcSelect" data-a="diploPick" data-x="${o.id}">
        <b>${esc(o.name)}</b><span>${war?'⚔ Savaş':e.ally[o.id]?'⚑ Müttefik':'Barış'} · ${rel>0?'+':''}${rel} ›</span></button>
        ${this.envoySummary(e,o.id)}</article>`;
    }
    if (!shown.length) h+=`<div class="empty">${known.length?'Bu filtreye uygun devlet yok.':'Henüz temas kurulmadı. Keşif gemilerini yeni sistemlere gönder.'}</div>`;
    h+='</div><div class="ph">GALAKTİK İŞLER</div><div class="act2">';
    h+='<button class="abtn" data-a="fedPane">🏛 FEDERASYON</button><button class="abtn" data-a="cncPane">🌐 KONSEY</button></div>';
    h+='<details class="dcDetails"><summary>Gizli diplomasi</summary><div class="act2">'+
      '<button class="abtn" data-a="whisperMenu">🕸 FISILTI AĞI</button>'+
      '<button class="abtn" data-a="opLogMenu">📁 İSTİHBARAT DOSYASI</button></div></details>';
    const fed=findFed(e);
    if (fed) h+=`<div class="mini">Federasyonun: ${esc(fed.name)} · ${fed.members.length} üye</div>`;
    h+='<details class="dcDetails"><summary>Lüks mal ağın</summary><div class="luxRow">';
    for (const k of LUX_KEYS){const L=LUXURY[k],own=e.luxOwn&&e.luxOwn[k],imp=e.luxImport&&e.luxImport[k]!==undefined;
      h+=`<span class="luxChip ${own?'have':imp?'imp':'miss'}">${L.ico} ${esc(L.n)} · ${own?'yerli':imp?'ithal':'yok'}</span>`;}
    return h+'</div></details>';
  },
  diploSovereignty(e,owner){
    let h=sovereignPair(e,owner)?this.vsContract(e.overlord===owner.id?e:owner):'';
    const talkSub=G.emps.find(s=>s.vassalTalk&&[s.vassalTalk.lord,s.vassalTalk.sub].includes(e.id)&&[s.vassalTalk.lord,s.vassalTalk.sub].includes(owner.id));if(talkSub)h+=`<button class="abtn" data-a="vsInspect" data-x="${talkSub.id}">VASALLIK MÜZAKERESİNİ / YANITI İNCELE</button>`;
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
            ⛓ ${esc(intelOf(e,owner.id)<3&&dv.why.startsWith('Yeterince güçlü değilsin (')?'Güç üstünlüğü koşulu sağlanmıyor; en az 1.6× gerekir.':dv.why)}</div>`;
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
            <b>${lord2 ? esc(this.diploName(lord2.id)) : '—'}</b> devletinin vasalı.
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


    return h;
  },
  warContribution(e,o){
    const v=warLedgerView(e,o.id);if(!v)return '';
    const m=v.mine;
    const partners=v.partners.map(id=>esc(G.emps[id].name)).join(', ');
    const waiting=(G.settlements?.offers||[]).some(x=>x.campaign===v.campaign&&x.members.includes(e.id)&&
      settlementState(x).state==='pending'&&!x.votes.some(y=>y.by===e.id));
    return `<details class="dcDetails"><summary>Savaş katkı kaydı · ${v.active?'sürüyor':'sona erdi'}</summary>
      <div class="mini">Bu cephedeki katkın. ${v.legacy?'Kısmi kayıt: önceki katkılar bilinmiyor.':'Savaş başlangıcından beri kaydediliyor.'}</div>
      <div class="row"><span>Kaybedilen / imha edilen gemi</span><b>${m.shipsLost} / ${m.shipsDestroyed}</b></div>
      <div class="row"><span>Verilen gövde hasarı</span><b>${Math.round(m.damageDealt)}</b></div>
      <div class="row"><span>Çıkarmada kaybedilen taarruz / kırılan garnizon</span><b>${Math.round(m.groundLost)} / ${Math.round(m.garrisonReduced)}</b></div>
      <div class="row"><span>Ele geçirilen farklı sistem / koloni</span><b>${m.systems.length} / ${m.planets.length}</b></div>
      ${partners?'<div class="mini">Aynı seferde destek veren tanıdık devletler: '+partners+'</div>':''}
      <div class="mini">Ele geçirme sayısı bugünkü sahiplik veya paylaşım hakkı değildir. Paylaşım bütün ortakların onayını gerektirir.</div>
      <button class="abtn" data-a="shareOpen" data-x="${v.campaign}">⚖ ${waiting?'PAYLAŞIM · OYUN BEKLENİYOR':'PAYLAŞIM TASLAĞI'}</button></details>`;
  },
  federationDiplomacy(e,o){
    const own=findFed(e),other=findFed(o);
    let h='<div class="ph">FEDERASYON DİPLOMASİSİ</div>';
    const button=(action,label,q)=>`<button class="abtn" data-a="${action}" data-x="${o.id}" ${q.ok?'':'disabled'}>${label}</button><div class="mini">${esc(q.why||(action==='fedDipInvite'?'Üyeler oy verir; aday ayrıca daveti kabul eder. 60 ◈.':'Üyeler oy verir; onaydan sonra yükümlülükleri kabul ederek katıl. 60 ◈.'))}</div>`;
    if(own&&other===own)return h+'<div class="mini">Aynı federasyonun üyesisiniz.</div><button class="abtn" data-a="fedPane">Federasyonu Yönet</button>';
    if(own&&!other){const q=canFedMotion(e,'admit',{target:o.id});h+=button('fedDipInvite','Federasyonuma Davet Et',q);if(q.ok){const a=aiFedWilling(o,e,own.type,own);h+=`<div class="mini">Adayın eğilimi: ${a.ok?'Olumlu':'Olumsuz'} · ${esc(a.why)}</div>`;}}
    else if(!own&&other)h+=button('fedDipRequest','Federasyonuna Katılma Talebi Gönder',canRequestFederation(e,o));
    else if(!own&&!other)h+='<button class="abtn" data-a="fedPane">Federasyon Kurma Teklifi</button><div class="mini">Mevcut kuruluş ekranında türü seç. En az iki uygun ve kabul eden AI müttefik ile kuruluş Etkisi gerekir.</div>';
    else h+='<div class="mini">Farklı federasyonlara üyesiniz. Yeni üyelik için önce bağımsız olmak gerekir.</div>';
    return h;
  },
  diploRelationship(e,o){
    this._jointSurface='diplo';
    const lvl=intelOf(e,o.id),blocked=diploBlocked(e,o),war=!!(e.war[o.id]||o.war[e.id]);
    let h=this.diploIdentity(e,o)+this.diploTreaties(e,o);
    if(e.ally[o.id]||o.ally[e.id]){
      const gate=canEndAlliance(e,o);
      h+=`<button class="abtn dgr" data-a="endAlliance" data-x="${o.id}" ${gate.ok?'':'disabled'}>⚑ İTTİFAKI SONLANDIR…</button>`;
      if(!gate.ok)h+='<div class="mini">'+esc(gate.why)+'</div>'+(gate.federation?'<button class="abtn" data-a="fedPane">Federasyon Yönetimini aç</button>':'');
    }
    if(isVassal(o)&&o.overlord===e.id)h+='<div class="ph">VASSAL YÖNETİMİ</div>'+this.vsContract(o);
    h+=this.federationDiplomacy(e,o);
    h+=this.warContribution(e,o);
    h+=this.jointPanel(o.id,'diplo');
    h+=`<button class="abtn" data-a="commerceNew" data-x="${o.id}">▱ Kaynak sözleşmesi</button><button class="abtn" data-a="commerce">Ticaret / konvoylar</button>`;
    if (e.pact&&e.pact[o.id]) h+=`<div class="mini">Son ay gerçek kargo teslimatın: ${esc((e.lastSwap&&e.lastSwap[o.id])||'—')}
      · ${((e.tradeFlow&&e.tradeFlow[o.id])||0).toFixed(1)} birim/ay</div>`;
    h+='<div class="ph">NEDEN BU İLİŞKİ?</div>';
    const memories=topMemories(e,o.id,4);
    h+=memories.length ? memories.map(m=>`<div class="row"><span>${esc(m.txt)}</span><b>${m.v>0?'+':''}${m.v}</b></div>`).join(''):
      '<div class="mini">Kendi diplomatik hafızanda belirgin bir olay yok.</div>';
    h+='<div class="mini">Bunlar senin hafızandaki olaylardır; ilişki puanının bütün bileşenleri veya karşı tarafın gizli değerlendirmesi değildir.</div>';
    h+=this.envoySummary(e,o.id);
    if (blocked) h+='<div class="empty">Doktrin bu devletle elçi ve anlaşma görüşmesini yasaklıyor. İstihbarat ayrı işler.</div>';
    h+=`<div class="act2">
      <button class="abtn pri" data-a="deal" data-x="${o.id}" ${blocked?'disabled':''}>📜 MÜZAKERE MASASI</button>
      <button class="abtn" data-a="spyOpen" data-x="${o.id}">🕵 İSTİHBARAT MERKEZİ</button>`;
    if (!blocked) h+=`<button class="abtn" data-a="envoy" data-x="${o.id}">${envoyRecord(e,o.id)?'🎓 ELÇİ GÖREVİ':'🎓 ELÇİ GÖNDER'}</button>
      <button class="abtn" data-a="gift" data-x="${o.id}">🎁 HEDİYE</button>`;
    h+='</div>';
    if (war){
      h+=`<div class="ph">SAVAŞ DURUMU</div><div class="row"><span>Savaş yorgunluğun</span><b>%${Math.round(exhOf(e,o.id))}</b></div>`;
      if (lvl>=3) h+=`<div class="row"><span>Karşı tarafın yorgunluğu</span><b>%${Math.round(exhOf(o,e.id))}</b></div>`;
      const wg=e.wg&&e.wg[o.id];
      if (wg&&WAR_GOALS[wg.t]) h+=`<div class="mini">Hedefin: ${esc(WAR_GOALS[wg.t].n)} · ${esc(warGoalText(e,o.id))}</div>`;
      if (!blocked){const sq=canStatusQuo(e,o);
        h+=`<button class="abtn" data-a="statuko" data-x="${o.id}" ${sq.ok?'':'disabled'}>⚖ STATÜKO BARIŞI</button>
          <div class="mini">${sq.ok?'Statüko koşulları sağlandı.':'Statüko koşulları henüz sağlanmadı.'} Diğer barış koşullarını müzakere masasında hazırlayabilirsin.</div>`;}
    } else {
      const canWar=canDeclareWarOn(e,o);
      const w=typeof canWar==='object'?canWar:{ok:!!canWar};
      h+=`<details class="dcDetails"><summary>Savaş ve baskı</summary>
        <button class="abtn dgr" data-a="war" data-x="${o.id}" ${w.ok?'':'disabled'}>⚔ SAVAŞ HEDEFİ SEÇ</button>
        ${w.ok?'':'<div class="mini">'+esc(w.why||'Savaş ilanı şu an mümkün değil')+'</div>'}`;
      if (fedHasLaw(e,'savasOnay') && !fedWarAllowed(e,o)){
        const gate = canFedWarRequest(e,o);
        h += `<button class="abtn" data-a="fedWarRequest" data-x="${o.id}" ${gate.ok?'':'disabled'}>⚖ SAVAŞ İZNİ ÖNER</button>
          <div class="mini">${esc(gate.ok ? 'Kabul savaş başlatmaz; hedefi sonra seçersin.' : gate.why)}</div>`;
      }
      if (!blocked && !protectedDiplomaticPair(e,o) && !(typeof pariahMap==='function'&&(pariahMap()||{})[o.id])) h+=`<button class="abtn" data-a="${embargoOn(e,o.id)?'unembargo':'embargo'}" data-x="${o.id}">
        ${embargoOn(e,o.id)?'AMBARGOYU KALDIR':'AMBARGO UYGULA'}</button>`;
      h+='</details>';
    }
    if (!blocked && e.pact&&e.pact[o.id]) h+=`<details class="dcDetails"><summary>Ticaret paktını yönet</summary>
      <div class="mini">Fesih etkilerini onay ekranında inceleyebilirsin.</div>
      <button class="abtn dgr" data-a="unpact" data-x="${o.id}">PAKTI FESHET…</button></details>`;
    if (!blocked) h+='<details class="dcDetails"><summary>Biat, koruma ve bağımsızlık</summary>'+this.diploSovereignty(e,o)+'</details>';
    h+='<details class="dcDetails"><summary>İstihbarat dosyası · '+INTEL_LEVELS[lvl].n+'</summary>';
    if (lvl>=1) h+=`<div class="mini">Koloni sayısı: ${o.colonies.length}</div>`;
    if (lvl>=2){
      h+=`<div class="mini">Teknolojiler: ${Object.keys(o.techs||{}).filter(k=>TECHS[k]).map(k=>esc(TECHS[k].n)).join(', ')||'—'}</div>
        <div class="mini">Civic: ${(o.civics||[]).filter(k=>CIVICS[k]).map(k=>esc(CIVICS[k].n)).join(', ')||'—'}</div>
        <div class="mini">Lüks: ${Object.keys(ownLuxury(o)).filter(k=>LUXURY[k]).map(k=>esc(LUXURY[k].n)).join(', ')||'—'}</div>`;
    }
    if (lvl>=3){
      h+=`<div class="mini">Kaynaklar: ${['min','ene','ala','tuk','yiy','etk'].map(k=>RES[k].ico+' '+fmt(o.res[k]||0)).join(' · ')}</div>`;
      h+=`<div class="mini">Savaştığı devletler: ${G.emps.filter(x=>!x.dead&&o.war[x.id]).map(x=>esc(this.diploName(x.id))).join(', ')||'—'}</div>`;
    } else h+='<div class="mini">Kaynaklar ve savaş planları için SIZILMIŞ düzeyi gerekir.</div>';
    return h+'</details>';
  },
  openDiplo(){
    if (!G.p) return;
    this.ensureDiploWorld();
    if (this._diploFocus!==undefined){
      if (this.diploKnown(this._diploFocus)){this.diploTarget=this._diploFocus;this.diploPage='relation';}
      this._diploFocus=undefined;
    }
    let o=this.diploKnown(this.diploTarget);
    if (!o){this.diploTarget=null;this.diploPage='states';}
    const page=this.diploPage||'states';
    if (page==='deal'&&o){this.openDeal(o.id);return;}
    let h=this.diploHeader(page,o);
    h+=page==='relation'&&o?this.diploRelationship(G.p,o):this.diploDirectory();
    this.renderDiplo(h+'</div></div>',page==='states'?'states:'+(this.diploFilter||'all'):'relation:'+o.id);
  },

  refreshFedPanel(){
    const pane=$('diploPane'),box=pane.querySelector('.fedBox');
    if(!pane.classList.contains('show')||!box)return;
    const key=JSON.stringify([Math.floor(G.day),G.p.res.etk,G.fedFounding,findFed(G.p),G.feds?.map(f=>[f.id,f.members,f.invites?.[G.p.id]])]);
    if(this._fedRefreshKey===key&&this._fedRefreshWorld===G.sys)return;
    this.openFed(true);this._fedRefreshKey=key;this._fedRefreshWorld=G.sys;
  },
  /* =============== FEDERASYON PANELİ =============== */
  confirmAllianceEnd(id){
    const player=G.p,other=G.emps[id],gate=canEndAlliance(player,other);
    if(!gate.ok){say(gate.why,'war');return;}
    const world=G.emps,token={};
    this.openModal(`<div class="mhd"><span>İTTİFAKI SONLANDIR · ${esc(other.name)}</span></div><div class="mbd">
      <p>${esc(other.name)} ile karşılıklı ittifak tek taraflı sona erecek. Kaynak bedeli yok.</p>
      <p>İki tarafın ilişki puanı 15 azalır (alt sınır −100). Karşı devlet ve mevcut motorun seçtiği diğer devletler seni “pakt bozdu” diye hatırlayabilir; bu güveni etkiler.</p>
      <p>${COLD_WAR_TURNS} ay soğuk savaş kaydı başlar. AI bu süre içinde sana normal savaş değerlendirmesinden savaş açmaz. Yeniden ittifak için ayrıca sabit bir bekleme süresi uygulanmaz; anlaşma kabul koşulları geçerlidir.</p>
      <p>Yeni ittifak savunma ve ortak saldırı taahhütleri biter. Mevcut savaşlar sürer; yeni savaş başlamaz. Mevcut ortak sefer emirleri bu işlemle iptal edilmez.</p>
      <p>İttifaka dayalı askerî sınır geçişi biter. Açık sınırlar ve bağımsız geçiş izinleri kendi kurallarıyla sürer. Ayrı sensör paylaşımı, ticaret paktları, kaynak sözleşmeleri ve saldırmazlık anlaşmaları korunur.</p>
      </div><div class="mft"><button class="ch" data-a="closem">VAZGEÇ</button><button id="allianceEndConfirm" class="ch" data-a="allianceEndConfirm">SONLANDIRMAYI ONAYLA</button></div>`,'war');
    this._archiveToken=token;
    this._hook('allianceEndConfirm',()=>{
      if(this._archiveToken!==token||G.emps!==world||G.p!==player||G.emps[id]!==other)return;
      this._archiveToken=null;
      const result=endAlliance(player,other);if(!result.ok)say(result.why,'war');
      this.closeModal();this.openDiplo();if(!other.dead)this.selectDiploIdentity(id);this.topbar();
    });
  },
  confirmFedLeave(){
    const f=findFed(G.p);if(!f)return;
    const world=G.emps,player=G.p,token={};
    const laws=Object.keys(f.laws||{}).filter(k=>f.laws[k]).map(k=>(FED_LAWS[k]||FED_INNER_LAWS[k])?.n||k);
    this.openModal(`<div class="mhd"><span>FEDERASYONDAN AYRIL · ${esc(f.name)}</span></div><div class="mbd"><p>${esc(fedType(f).n)} üyeliğin ve üyeliğe bağlı bonuslar sona erer.</p><p>Yürürlükteki yasalar: ${esc(laws.join(', ')||'yok')}. Kalan üyelerle karşılıklı ittifakların sonlanır.</p><p>Yeniden federasyon üyeliği için 24 ay beklenir. Devam eden savaşların ve mevcut bağımsız sözleşmelerin bu işlemle sona ermez.</p><p>Yeni federasyon savunma/saldırı yükümlülüklerin biter. Federal gemiler federasyonda kalır; başkansan mevcut ardıllık kuralı uygulanır. Federasyon iki üyeden az kalırsa dağılır; federal gemilerin özel statüsü kaldırılır.</p></div><div class="mft"><button class="ch" data-a="closem">VAZGEÇ</button><button id="fedLeaveConfirm" data-a="fedLeaveConfirm" class="ch">AYRILMAYI ONAYLA</button></div>`);
    this._archiveToken=token;
    this._hook('fedLeaveConfirm',()=>{if(this._archiveToken!==token||world!==G.emps||player!==G.p||findFed(player)!==f)return;const q=leaveFederation(player);if(!q.ok)say(q.why,'war');this.closeModal();this.openFed();});
  },
  fedMotionButton(kind,opts,label){
    const q=canFedMotion(G.p,kind,opts),x=kind==='reform'?kind+':'+opts.type:kind==='charter'?kind+':'+opts.field+':'+opts.value:kind==='joinWar'?kind+':'+opts.target+':'+opts.sponsor:kind+':'+opts.target;
    return `<button class="abtn" data-a="fedMotion" data-x="${esc(x)}" ${q.ok?'':'disabled'}>${esc(label)}</button>${q.ok?'':`<div class="mini">${esc(q.why)}</div>`}`;
  },
  fedMembers(f){
    const counts=f.vote?fedVoteCounts(f):null,w=counts?counts.weights:fedLiveWeights(f);
    let h='<div class="mini">İhraç hedefi kendi ihracında oy kullanamaz; hedef dışında en az iki üye gerekir. Öneri 80 ◈; ret halinde bedel iade edilmez.</div><table class="fedTable"><thead><tr><th>Devlet</th><th>Durum</th><th>Oy ağırlığı</th><th>İşlem</th></tr></thead><tbody>';
    for(const id of f.members){const o=G.emps[id];if(!o)continue;h+=`<tr><td><button class="abtn" data-a="fedMember" data-x="${id}" ${id===G.p.id?'disabled':''}>${esc(o.name)}${id===G.p.id?' (sen)':''}</button></td><td>${id===f.leader?'Başkan':'Üye'}</td><td>${counts&&!counts.eligible.includes(id)?'Bu gündemde oy yok':w[id]||1}</td><td>${id!==G.p.id?this.fedMotionButton('expel',{target:id},'İHRAÇ ÖNER · 80 ◈')+this.fedMotionButton('elect',{target:id},'Başkan öner · 50 ◈'):''}</td></tr>`;}
    h+='</tbody></table><details class="dcDetails"><summary>Üyelik önerisi gönder</summary>';
    for(const o of G.emps.filter(o=>o!==G.p&&G.p.contact[o.id]&&!o.dead&&!o.wild&&!findFed(o)))h+=`<div class="box"><b>${esc(o.name)}</b>${this.fedMotionButton('admit',{target:o.id},'Üyelik öner · 60 ◈')}</div>`;
    return h+'</details>';
  },
  fedFoundPanel(){
    if(this._fedFoundWorld!==G.emps){this._fedFoundWorld=G.emps;this.fedFoundEditing=null;this.fedFoundSelected=[];this.fedFoundType='askeri';}
    const e=G.p,type=Object.hasOwn(FED_TYPES,this.fedFoundType)?this.fedFoundType:'askeri',ballot=Object.hasOwn(FED_BALLOTS,this.fedBallotChoice)&&this.fedBallotChoice!=='weighted'?this.fedBallotChoice:'equal',selected=this.fedFoundSelected||[],q=fedFoundQuote(e,type,ballot,selected);
    const labels={pending:'BEKLİYOR',accepted:'KABUL EDİLDİ',rejected:'REDDEDİLDİ',founded:'KURULDU',cancelled:'İPTAL',expired:'SÜRESİ DOLDU',invalid:'GEÇERSİZ'};
    let h='<div class="ph">FEDERASYON KURULUŞU</div><div class="mini">İki açık rızalı insan yeterlidir. Tek insanlı oyunda en az iki AI ortak gerekir. Yalnız seçtiğin ortaklar davet edilir; ücret son onayda bir kez kesilir.</div>';
    for(const p of G.fedFounding?.proposals||[]){if(!p.members.includes(e.id))continue;const own=p.by===e.id,r=p.replies[e.id];
      h+=`<div class="box fedFoundation" data-founding="${p.id}"><b>${esc(FED_TYPES[p.type].n)} · ${esc(FED_BALLOTS[p.ballot].n)} · ${labels[p.status]}</b><div class="mini">Öneren: ${esc(G.emps[p.by].name)} · ${Math.max(0,Math.ceil((p.expires-G.day)/30))} ay · ${fedFoundCost(G.emps[p.by])} Etki · yalnız kurucudan</div><div class="mini">${esc(fedDutyText({type:p.type,charter:{...fedDefaultCharter(p.type),ballot:p.ballot},laws:{}}))} Üyeler arasında ittifak oluşur. Önceki savaşlar sessizce kapatılmaz.</div>`;
      for(const id of p.members)h+=`<div class="mini">${esc(G.emps[id]?.name||'Bilinmeyen kurucu')} — ${labels[p.replies[id]?.status]||'GEÇERSİZ'} · ${esc(p.replies[id]?.why||'')}</div>`;
      if(p.revision)h+=`<div class="mini">Şart sürümü ${p.revision}; önceki kabuller değişen kadroyu onaylamaz. ${p.revisions.map(v=>'Sürüm '+v.revision+': '+(v.replies[e.id]?.status||'kurucu geçmişi')).join(' · ')}</div>`;
      if(p.why)h+=`<div role="status">${esc(p.why)}</div>`;
      if(p.status==='pending'){
        if(own)h+=`<button class="abtn" data-a="fedFoundEdit" data-x="${p.id}">TASLAĞI DÜZENLE</button><button class="abtn pri" data-a="fedFoundFinish" data-x="${p.id}${p.revision?':'+p.revision:''}" ${p.members.every(id=>p.replies[id]?.status==='accepted')?'':'disabled'}>SON KURULUŞ ONAYI · ${fedFoundCost(e)} ◈</button><button class="abtn" data-a="fedFoundCancel" data-x="${p.id}">SÜRECİ İPTAL ET</button>`;
        else if(r?.status==='pending')h+=`<button class="abtn pri" data-a="fedFoundReply" data-x="${p.id}:yes${p.revision?':'+p.revision:''}">ŞARTLARI KABUL ET</button><button class="abtn" data-a="fedFoundReply" data-x="${p.id}:no${p.revision?':'+p.revision:''}">REDDET</button>`;
      }
      h+='</div>';
    }
    h+='<div class="ph">TÜR</div>';
    for(const [key,T]of Object.entries(FED_TYPES))h+=`<button class="abtn ${key===type?'pri':''}" data-a="fedFoundType" data-x="${key}">${T.ico} ${esc(T.n)}</button>`;
    h+='<div class="ph">OY REJİMİ</div>';
    for(const [key,B]of Object.entries(FED_BALLOTS))if(key!=='weighted')h+=`<button class="abtn ${key===ballot?'pri':''}" data-a="fedBallot" data-x="${key}">${esc(B.n)}</button>`;
    h+=`<p class="mini">${esc(FED_TYPES[type].d)} ${esc(FED_BALLOTS[ballot].d)} ${esc(fedDutyText({type,charter:{...fedDefaultCharter(type),ballot},laws:{}}))} Kuruluşta seçilen üyeler birbirleriyle ittifak kurar. Açık taslak düzenlenebilir. Kadro/tür/oy rejimi değişirse eski kabuller geçmişte kalır; güncel rıza yeniden gerekir. Süre uzatılmaz.</p><div class="ph">KURUCU ORTAKLAR · ${selected.length} SEÇİLİ</div>`;
    for(const c of q.candidates){const o=G.emps[c.id];if(!o)continue;h+=`<div class="box"><button class="abtn ${selected.includes(c.id)?'pri':''}" data-a="fedFoundSelect" data-x="${c.id}" aria-pressed="${selected.includes(c.id)}" ${c.ok?'':'disabled'}>${selected.includes(c.id)?'☑':'☐'} ${esc(o.name)}</button><div class="mini">${c.h?'İnsan — açık yanıt gerekli':'AI — stratejik karar davette verilir'} · İlişki ${Math.round(e.rel[c.id]||0)} · ${esc(c.ok?'Yapısal olarak uygun':c.why)}</div>${c.approach?`<div class="mini">Tür / oy rejimi yaklaşımı: ${esc(c.approach)}</div>`:''}</div>`;}
    h+=`<div class="mini" role="status">${esc(q.why||'Seçilen şartlar davete uygun')} · ${q.cost} ◈</div>${this.fedFoundEditing?'<p>Güncelleme maddi şartları değiştirir: kalan bütün kurucu ortaklar yeni rızaya çağrılır. Hiçbir ücret henüz kesilmez.</p>':''}<button class="abtn pri" data-a="${this.fedFoundEditing?'fedFoundUpdate':'fedFoundStart'}" ${q.ok?'':'disabled'}>${this.fedFoundEditing?'GÜNCEL DAVETLERİ GÖNDER':'KURULUŞ DAVETLERİNİ GÖNDER'}</button>${this.fedFoundEditing?'<button class="abtn" data-a="fedFoundEditStop">DÜZENLEMEDEN VAZGEÇ</button>':''}`;
    return h;
  },
  fedAgendaList(f){
    const a=f.agenda,rows=fedAgendaOrder(f),status={active:'Oylama açıldı',resolved:'Sonuçlandı',invalid:'Geçersiz',expired:'Süresi doldu',withdrawn:'Geri çekildi'};
    const title=r=>fedAgendaLabel(r),who=id=>id===G.p.id?'Sen':this.diploName(id);
    let h='<div class="ph">GÜNDEM KUYRUĞU</div><p class="mini">Tek aktif oylama; olağan öneriler FIFO. Gerçek acil savunma sırayı öne alır; aktif oy kesilmez. Olağan öneri beklerken en fazla iki acil açılış; sonra olağan sıra. En fazla 12 öneri, kişi başına 3. Bekleme sınırı 360 gün. Kuyrukta bedel kesilmez; sıra geldiğinde koşullar ve bütçe yeniden denetlenir. Savaş kararı ayrıca yetkili uygulama gerektirir.</p>';
    h+=rows.map((r,i)=>`<div class="box"><b>${r.position||i+1}. ${r.defenseFront?'🚨 ACİL SAVUNMA · ':''}${esc(title(r))}</b><div class="mini">${r.defenseFront?'Kaynak cephe #'+r.defenseFront+' · ':''}Öneren: ${esc(who(r.by))}${Number.isInteger(r.options.target)?' · Hedef: '+esc(this.diploName(r.options.target)):''} · ${Math.max(0,Math.ceil(r.expires-G.day))} gün · Açılış bedeli ${r.kind==='law'?fedLawCost(r.law,!!r.options.repeal):r.kind==='war'?0:r.kind==='application'?60:FED_MOTIONS[r.options.kind]?.c||0} ◈</div>${r.by===G.p.id?`<button class="abtn" data-a="fedAgendaWithdraw" data-x="${f.id}:${r.id}">ÖNERİYİ GERİ ÇEK</button>`:''}</div>`).join('')||'<div class="mini">Bekleyen öneri yok.</div>';
    for(const r of (a?.history||[]).slice(-8).reverse())h+=`<div class="mini">${esc(title(r))} · ${esc(status[r.status]||r.status)} · ${esc(r.why||'')}</div>`;
    return h;
  },
  fedAgendaCards(){
    if(!G.p)return;for(const f of G.feds||[]){if(!f.members.includes(G.p.id)&&!f.agenda?.history.some(r=>r.by===G.p.id))continue;
      for(const r of f.agenda?.history||[]){if(r.by!==G.p.id)continue;const key='agenda:'+f.id+':'+r.id+':'+r.status;
        if(DiplomaticInbox.state().records.some(n=>n.key===key))continue;
        const title='FEDERASYON GÜNDEMİ · '+fedAgendaLabel(r),sub=r.why||r.status;
        DiplomaticInbox.source('fedagenda',key,r.by,f.id,String(r.id),G.day+180,title,sub);
        const rec=DiplomaticInbox.state().records.find(n=>n.key===key);if(rec){rec.status='accepted';rec.finished=r.updated??G.day;}
        if(!this.fedResultSeen(key))this.notify({kind:'fedagenda',data:f.id,key,title,sub,pause:false,ico:'🏛'});
      }
    }
  },
  fedResultSeen(key){this._fedResultsSeen=this._fedResultsSeen||new Set();const seen=this._fedResultsSeen.has(key);this._fedResultsSeen.add(key);if(this._fedResultsSeen.size>256)this._fedResultsSeen.delete(this._fedResultsSeen.values().next().value);return seen;},
  fedFoundCards(){
    if(this._fedFoundSync||!G.p)return;if(this._fedNoticeWorld!==G.emps){this._fedNoticeWorld=G.emps;this._fedFoundDismissed=new Set();this._fedResultsSeen=new Set();}this._fedFoundSync=true;
    try{for(const r of DiplomaticInbox.state().records){if(r.kind!=='fedfound'||r.status!=='pending')continue;const p=fedFoundGet(r.note?.data);if(!p||!p.members.includes(G.p.id)||fedFoundRecordRevision(r)!==(p.revision||0)){r.status='invalid';r.why='Kuruluş kadrosu veya şart sürümü değişti';r.finished=G.day;G.inbox=G.inbox.filter(n=>n.key!==r.key);}}for(const p of G.fedFounding?.proposals||[]){if(!p.members.includes(G.p.id))continue;const me=G.p.id,reply=p.replies[me],key='fedfound:'+p.id+(p.revision?':'+p.revision:''),st=DiplomaticInbox.state();
      let rec=st.records.find(r=>r.key===key);
      const summary=FED_TYPES[p.type].n+' · '+p.members.length+' kurucu · '+FED_BALLOTS[p.ballot].n+' · '+fedDutyText({type:p.type,charter:{...fedDefaultCharter(p.type),ballot:p.ballot},laws:{}});
      if(p.by!==me&&!rec){this.notify({kind:'fedfound',data:p.id,key,ico:'🏛',pause:false,title:'FEDERASYON KURULUŞ DAVETİ — '+G.emps[p.by].name,sub:summary});rec=st.records.find(r=>r.key===key);}
      if(rec){rec.expires=p.expires;if(p.status!=='pending'||reply?.status!=='pending'){rec.status=p.status==='expired'?'expired':reply?.status==='accepted'?'accepted':reply?.status==='rejected'?'rejected':'invalid';rec.finished=p.finished||reply?.day||G.day;rec.why=p.why||reply?.why||p.status;G.inbox=(G.inbox||[]).filter(n=>n.key!==key);}else if(!G.inbox.some(n=>n.key===key)&&!this._fedFoundDismissed?.has(key)&&!(globalThis.MP6Stars?.S.swiped.has(key))){this.notify({kind:'fedfound',data:p.id,key,ico:'🏛',pause:false,title:'FEDERASYON KURULUŞ DAVETİ — '+G.emps[p.by].name,sub:summary});}}
      const stateKey='fedfound-result:'+p.id+(p.revision?':r'+p.revision:'')+':'+p.status+':'+p.members.map(id=>p.replies[id]?.status||'').join(',');
      if(!st.records.some(r=>r.key===stateKey)){
        /* BETA-EVENT-UX.1 kök neden (taban p24'te yeniden üretildi): her ara durum (1/2 onay, 2/2 onay, KURULDU) ayrı kart doğuruyor ve eskisi
           hiç kalkmıyordu → kurucunun çubuğunda aynı kuruluş için birikip takılı kalan kartlar. Aynı önerinin daha eski sonuç kartı yenisi
           doğarken kalkar; kayıtları Gelen kutusu geçmişinde kalır. */
        G.inbox=(G.inbox||[]).filter(n=>!(n.kind==='fedfoundResult'&&n.data===p.id&&n.key!==stateKey));
        const count=p.members.filter(id=>p.replies[id]?.status==='accepted').length,f=p.fid?fedOf(p.fid):null;
        const item={kind:'fedfoundResult',data:p.id,key:stateKey,ico:'🏛',pause:false,title:p.status==='founded'?'FEDERASYON KURULDU — '+(f?.name||'Federasyon'):'KURULUŞ SONUCU · '+count+'/'+p.members.length+' onay',sub:summary+(f?' · Lider: '+G.emps[f.leader].name:' · '+p.members.filter(id=>id!==p.by).map(id=>G.emps[id].name+': '+(p.replies[id]?.status==='accepted'?'kabul':p.replies[id]?.status==='rejected'?'ret':'bekliyor')).join(' · '))};
        if(!this.fedResultSeen(stateKey))this.notify(item);else DiplomaticInbox.capture({...item,uid:++G.inboxUid,born:G.day});
        const r=st.records.find(r=>r.key===stateKey);if(r){r.status='accepted';r.finished=G.day;}
      }
    }}finally{this._fedFoundSync=false;}
  },
  openFed(automatic=false){
    const old=$('diploPane').querySelector('.fedTabBody');
    if(this._fedTabsWorld!==G.emps){this._fedTabsWorld=G.emps;this._fedOpen={};this._fedScroll={};this.fedTab='general';this._fedRenderedTab=null;}
    if(old&&this._fedRenderedTab){this._fedScroll[this._fedRenderedTab]=old.scrollTop;this._fedOpen[this._fedRenderedTab]=[...old.querySelectorAll('details[open]')].map(d=>d.querySelector('summary')?.textContent);}
    const tabs={general:'GENEL',members:'ÜYELER',votes:'OYLAMALAR',laws:'YASALAR',military:'ASKERÎ',manage:'YÖNETİM'};
    const tab=Object.hasOwn(tabs,this.fedTab)?this.fedTab:'general';
    this._jointSurface='fed';
    const e = G.p;
    const f = findFed(e);
    let h = `<div class="dpBox dcBox fedBox">
      <div class="dpHd"><span>🏛 FEDERASYON</span>
        <button class="riX" data-a="closeFed">✕</button></div>
      ${f?`<nav class="fedTabs" aria-label="Federasyon bölümleri">${Object.entries(tabs).map(([k,n])=>`<button class="abtn ${tab===k?'pri':''}" data-a="fedTab" data-x="${k}" aria-pressed="${tab===k}">${n}</button>`).join('')}</nav>`:''}
      <div class="dpBody dcBody ${f?'fedTabBody':''}" data-fed-tab="${tab}">`;

    h+=typeof ArchiveUI!=='undefined'?ArchiveUI.newsBackButton():'';
    if (!f){
      const allies=G.emps.filter(o=>o!==e&&!o.dead&&!o.wild&&e.ally[o.id]);
      h+=this.fedFoundPanel();
      for(const invitation of G.feds||[]){const inv=invitation.invites?.[e.id];if(!inv||inv.expires<=G.day)continue;h+=`<div class="box"><b>${esc(invitation.name)} · ${fedType(invitation).n}</b><div class="mini">${fedType(invitation).d} Oy rejimi: ${esc(FED_BALLOTS[fedBallot(invitation)]?.n||fedBallot(invitation))}. ${fedDutyText(invitation)} Mevcut yasalar: ${Object.keys(invitation.laws||{}).map(k=>esc((FED_LAWS[k]||FED_INNER_LAWS[k]||{}).n||k)).join(', ')||'yok'}. ${Math.ceil(inv.expires-G.day)} gün kaldı.</div><button class="abtn" data-a="fedInviteAccept" data-x="${invitation.id}">YÜKÜMLÜLÜKLERİ KABUL ET VE KATIL</button><button class="abtn" data-a="fedInviteReject" data-x="${invitation.id}">REDDET</button></div>`;}
      for(const other of G.feds||[])if(other.agenda?.items.some(r=>r.by===e.id))h+=this.fedAgendaList(other);
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
      if(tab==='general'){
      h+=`<div class="envRow"><span>${esc(f.name)} · ${esc(fedType(f).n)}</span><b>${f.members.length} üye</b></div><div class="mini">Başkan: ${esc(G.emps[f.leader]?.name||'—')} · Oy rejimi: ${esc(FED_BALLOTS[fedBallot(f)]?.n||'—')}</div><p class="mini">${esc(fedDutyText(f))}</p><div class="mini">Üyelik: üye oylaması ve adayın ayrı rızası; önce bütün üyelerle ittifak gerekmez. Eski doğrudan davet koşulu: ${fedCharter(f).admission==='allies'?'ortak müttefikler':'temaslı bağımsız adaylar'} · savunma ${fedCharter(f).defense==='auto'?'otomatik':'oylama'} · saldırı ${fedCharter(f).offense==='auto'?'onaylı taahhüt':'oylama'}.</div><button class="abtn" data-a="fedTab" data-x="votes">${f.vote?'BEKLEYEN OYLAMAYI İNCELE':'Oylamalar ve son karar'}</button>`;
      const enemies=G.emps.filter(o=>!o.dead&&!o.wild&&f.members.some(id=>G.emps[id]?.war[o.id]));
      h+=`<div class="ph">AKTİF SAVAŞLAR</div><div class="mini">${enemies.map(o=>esc(this.diploName(o.id))).join(', ')||'Yok'}</div>`;
      /* ═══ FAZ 50: FEDERAL FON PANELİ ═══ */
      if (typeof fedFundStatus === 'function'){
        const fs2 = fedFundStatus(f);
        if (fs2){
          const renk = fs2.kritik ? '#ff5f6d' : fs2.kalanAy < 8 ? '#ff9b3d' : '#65e08a';
          h += `<div class="ph">FEDERAL FON</div>`;
          h += `<div class="box" id="fedFundBox" style="border-color:${renk}">
            <div class="bt"><span>⚙ Ortak fon</span>
              <b style="color:${renk}">${Math.round(fs2.ala)} ala · ${Math.round(fs2.ene)} ene</b></div>
            <div class="bd">Katkı: gelirin %${Math.round(fs2.rate*100)}'i${fs2.filoLaw?' + Ortak Filo yasası (üye başına ayda ≤ 4 alaşım)':''} ·
              harcanabilir <b>${Math.floor(fs2.spendAla)}</b> ala / <b>${Math.floor(fs2.spendEne)}</b> ene (3 aylık bakım rezervi ayrıldı)<br>
              Federal donanma ${fs2.ships} gemi${fs2.queued?' + '+fs2.queued+' kuyrukta':''} / sınır ${fs2.cap} · aylık bakım <b>${Math.round(fs2.bakim)}</b> ene + <b>${Math.round(fs2.bakimA*10)/10}</b> ala (fondan) ·
              ${(fs2.bakim > 0 || fs2.bakimA > 0)
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

      }
      if(tab==='members')h+=this.fedMembers(f);
      if(tab==='manage')h+=this.fedGovernance(f,'manage')+`<button class="abtn dgr" data-a="fedLeave">FEDERASYONDAN AYRIL…</button>`;
      if(tab==='military'){
        const navy=G.fleets.filter(fl=>fl.federal&&fl.fedId===f.id);
        h+=`<p class="mini">${esc(fedDutyText(f))}</p><div class="row"><span>Federal donanma</span><b>${navy.length} filo · ${navy.reduce((n,fl)=>n+fl.ships.length,0)} gemi</b></div><div class="mini">Yönetim: ${esc(G.emps[f.leader]?.name||'—')}. Savaş sonrası yeni vassalların bağımsız cepheleri ve sözleşmeleri ilgili devletin Vassal Yönetimi bölümünde görünür.</div>`+this.fedGovernance(f,'military')+this.jointPanel(null,'fed');
        if(f.laws.filo)h+=`<div class="row"><span>Ortak Filo katkısı</span><b>federal fona</b></div>`;
      }
      if(tab==='laws'){
      h += `<div class="ph">YASALAR</div>`;
      h += `<div class="mini">Federasyona sonradan katılan üyeler de yürürlükteki
        tüm yasalara tabi olur — geçmiş oylamaları yeniden yapmaya gerek yoktur.</div>`;
      h+='<table class="fedTable fedLawTable"><thead><tr><th>Yasa / ayrıntı</th><th>Durum</th><th>İşlem</th></tr></thead><tbody>';
      for(const k in FED_LAWS){const L=FED_LAWS[k],on=!!f.laws[k],q=canFedLaw(e,k,on);
        h+=`<tr><td><details><summary>${L.ico} ${esc(L.n)}</summary><p class="mini">${esc(L.d)}</p></details></td><td>${on?'Yürürlükte':'Oylanmadı'}</td><td><button class="abtn" data-a="${on?'fedLawRepeal':'fedLawPropose'}" data-x="${k}" ${q.ok?'':'disabled'}>${on?'Kaldırmayı öner · 30 ◈':'Öner · 60 ◈'}</button>${q.ok?'':`<div class="mini">${esc(q.why)}</div>`}</td></tr>`;
      }
      h+='</tbody></table>';

      h += `<div class="ph">İÇ YASA ÖNERİLERİ · UYUM %${fedCohesion(f)}</div>
        <div class="mini">Öneri bedeli oylama açılırken bir kez ödenir, ret halinde iade edilmez. Kuyrukta bedel kesilmez. Oyunu ayrıca kullanırsın.
        Süre 90 gün; kullanılmayan oy çekimserdir. Eşitlikte öneri reddedilir.</div>`;
      for (const category of [...new Set(Object.values(FED_INNER_LAWS).map(L=>L.cat))]){
        const keys = Object.keys(FED_INNER_LAWS).filter(k=>FED_INNER_LAWS[k].cat===category);
        h += `<details class="dcDetails"><summary>${esc(category)} · ${keys.filter(k=>f.laws[k]).length}/${keys.length} yürürlükte</summary>`;
        for (const k of keys){
          const L = FED_INNER_LAWS[k], on = !!f.laws[k], gate = canFedLaw(e,k,on);
          const conflicts = fedLawConflicts(f,k);
          h += `<div class="box"><div class="bt"><span>${L.ico} ${L.n}</span>
            <b>${on ? 'YÜRÜRLÜKTE' : L.c + ' ◈'}</b></div><div class="bd">${L.d}</div>
            ${!on && conflicts.length ? `<div class="mini">Kabul edilirse yerine geçer: ${conflicts.map(k=>esc(FED_INNER_LAWS[k].n)).join(', ')}</div>` : ''}
            <button class="abtn ${gate.ok ? 'pri' : 'dis'}" data-a="${on?'fedLawRepeal':'fedLawPropose'}" data-x="${k}"
              ${gate.ok ? '' : 'disabled'}>${on?'KALDIRMAYI ÖNER · '+fedLawCost(k,true)+' ◈':'YASA ÖNER'}</button>
            ${gate.ok ? '' : `<div class="mini">${esc(gate.why)}</div>`}</div>`;
        }
        h += '</details>';
      }
      }
      if (tab==='military'&&f.laws.savasOnay){
        h += '<details class="dcDetails"><summary>⚔ Savaş izni önerileri</summary><div class="mini">İzin önerisi ücretsizdir. Aynı hedef için 90 gün beklenir. Kabul savaşı başlatmaz.</div>';
        for (const target of G.emps.filter(o=>!o.dead && !o.wild && !o.crisisSide && !f.members.includes(o.id) && e.contact[o.id])){
          const gate = canFedWarRequest(e,target), p = f.warPermits && f.warPermits[e.id+'>'+target.id];
          h += `<div class="box"><b>${esc(target.name)}</b><div class="mini">${p && p.expires>G.day ? 'İzin: '+(p.expires-G.day)+' gün kaldı' : esc(gate.why || 'Federasyonun onayına sun')}</div>
            <button class="abtn" data-a="fedWarRequest" data-x="${target.id}" ${gate.ok?'':'disabled'}>İZİN ÖNER</button></div>`;
        }
        h += '</details>';
      }
      if(tab==='votes'){
      h+=this.fedAgendaList(f);
      if(typeof ArchiveUI!=='undefined'&&ArchiveUI.returnRecord?.world===G.emps)h+='<button class="abtn" data-a="inboxReturn">KARARA GERİ DÖN</button>';
      h+=this.fedRepresentation(f);
      if (f.lastVote){
        const L = fedVoteLaw(f.lastVote);
        h += `<div class="mini">Son sonuç: ${esc(L ? L.n : f.lastVote.law)} ${f.lastVote.repeal?'(kaldırma)':''} —
          ${f.lastVote.passed ? 'KABUL' : 'RED'} · ${f.lastVote.yes} evet / ${f.lastVote.no} hayır /
          ${f.lastVote.abstain || 0} çekimser ${esc(f.lastVote.invalid || '')}</div><div class="mini">${esc(f.lastVote.why||'')}</div>${this.fedAgendaContext(f.lastVote)}`;
      }
      if (f.laws.filo)
        h += `<div class="row"><span>Ortak Filo katkısı</span><b>federal fona (${Math.round((f.fund&&f.fund.ala)||0)} ala)</b></div>`;

      h += `<div class="ph">OYLAMA</div>`;
      if (f.vote){
        const L = fedVoteLaw(f.vote) || {ico:'🏛', n:'Eski gündem', d:'Bu gündem desteklenmiyor.'};
        const tally = fedVoteCounts(f);
        h += `<div class="box" style="border-color:#ff9b3d">
          <div class="bt"><span>${L.ico} ${L.n}</span><span class="tag e">AÇIK</span></div>
          <div class="bd">${L.d}</div>${this.fedAgendaContext(f.vote)}<div class="mini">${esc(fedVoteRule(f,tally))}</div>
          <div class="row"><span>Ağırlıklı oylar</span><b><span style="color:#65e08a">${tally.yes} evet</span>
            · <span style="color:#ff5f6d">${tally.no} hayır</span></b></div>
          <div class="mini">${tally.waiting.length} üyenin oyu bekleniyor ·
            ${Number.isFinite(f.vote.expires) ? Math.max(0, f.vote.expires-G.day) + ' gün kaldı' : 'Eski kayıt: süre sınırı yok'}</div>
          <div class="act2"><button class="abtn pri" data-a="fedVoteNow" data-x="${f.id}">OY KULLAN</button></div></div>`;
      } else {
        const ay = Math.max(0, Math.ceil((f.nextVote - G.day)/30));
        h += `<div class="row"><span>Sonraki oylama</span><b>${ay} ay sonra</b></div>`;
        h += `<div class="mini">Oylama açıldığında bildirim gelir; buradan da oy kullanabilirsin.</div>`;
      }
      }
      if (tab==='votes'&&hasCivic(e,'council')&&fedBallot(f)==='weighted')
        h += `<div class="mini" style="color:#6ff2c8">✧ Konsey Mimarı: oyun iki kat ağırlıkta sayılıyor</div>`;
    }
    h += `</div></div>`;
    this.surfaceRender($('diploPane'),h,'federation:'+tab,automatic);
    const body=$('diploPane').querySelector('.fedTabBody');if(body){for(const d of body.querySelectorAll('details'))d.open=(this._fedOpen[tab]||[]).includes(d.querySelector('summary')?.textContent);body.scrollTop=this._fedScroll[tab]||0;}
    this._fedRenderedTab=tab;
    paintEmblems();
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
    const e=G.p,known=G.emps.filter(o=>spyTargetCheck(e,o).ok),side=known.map(o=>'<button class="ivRow '+(this.spyTarget===o.id?'on':'')+'" data-a="spyTargetSet" data-x="'+o.id+'">'+esc(o.name)+'<br><small>Ağ '+intelOf(e,o.id)+'/3 · '+(e.spy?.[o.id]?'Casus sahada':'Casus yok')+'</small></button>').join('');
    return '<div class="spyWorkspace"><aside aria-label="İstihbarat hedefleri">'+side+'</aside><main>'+h+'</main></div>';
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
    h+='<p>Soldan tek hedef seç; seçimin Ağlar, Operasyonlar ve Dosyalar arasında korunur. Operasyon etkisi ve ifşa riski ayrı gösterilir.</p>';
    h += this.intelDossier();
    h += this.intelAgents();
    return h;
  },
  intelOperations(){
    const e = G.p;
    let h = '';

    const id = this.spyTarget;
    const o  = (id !== undefined && id !== null) ? G.emps[id] : null;
    if (!spyTargetCheck(e, o).ok){
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
    const agent = spyAssignQuote(e, o.id);
    h += `<button class="abtn ${agent.ok?'pri':'dis'}" ${agent.ok?
      `data-a="spy" data-x="${o.id}"`:'disabled'}>${agent.withdraw?
      '↩ CASUSU GERİ ÇEK':'🕵 CASUS ATA'}</button>`;
    h += `<div class="mini">Sahada ${spiesUsed(e)} / ${spyCap(e)} · ${
      agent.ok ? 'Casus ağ seviyesini zamanla yükseltir; operasyon ayrıca onaylanır.' : esc(agent.why)}</div>`;
    h += this.opEffects(o);
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
    if (!spyTargetCheck(e, o).ok) return '';
    let h = `<div class="ph">DOĞRUDAN OPERASYONLAR</div>
      <div class="mini">Bu 12 operasyon onayda hemen uygulanır; bekleyen görev
      kuyruğu yoktur. İfşa yüzdesi başarı şansı değildir. Özel operasyonların
      başarı koşulları aşağıdaki ayrı gruplardadır.</div>`;
    const categories={all:'Tümü',economy:'Ekonomi / lojistik',politics:'Siyasi baskı',intel:'Bilgi / teknoloji'};h+='<div class="spyCategories">'+Object.entries(categories).map(([k,n])=>'<button class="abtn" data-a="intelCategory" data-x="'+k+'">'+n+'</button>').join('')+'</div>';
    for (const k in OPS){const category=['isyan','suikast','sahteKanit'].includes(k)?'politics':['calTech','yalan','filoPlan','sorusturma'].includes(k)?'intel':'economy';if(this.intelCategory&&this.intelCategory!=='all'&&this.intelCategory!==category)continue;
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
  opEffects(o){
    const effects = opActiveEffects(G.p, o);
    let h = '<div class="ph">SÜRELİ KAZANIMLARIN</div>';
    if (!effects.length) return h + '<div class="mini">Bu hedefte aktif süreli kazanım yok. Anlık sonuçlar DOSYALAR bölümündedir.</div>';
    for (const effect of effects)
      h += `<div class="row"><span>${esc(effect.name)}</span><b>${effect.days} gün kaldı</b></div>`;
    return h;
  },
  /* ═══ DOSYALAR GÖRÜNÜMÜ ═══
     Sana yapılanlar ve senin yaptıkların AYRI. Fail bilinmiyorsa
     hiçbir ad veya kimlik SIZDIRILMAZ. */
  opRecordName(key){
    return ({stealTech:'Teknoloji Verisi Hırsızlığı', incite:'İsyan Kışkırtma',
      whisper:'Fısıltı Ağı', whisperFrame:'Fısıltı Ağı · İftira',
      falseFlag:'Sahte Bayrak', teknoCal:'Teknoloji Verisi Hırsızlığı',
      kiskirt:'İsyan Kışkırtma'})[key] || (OPS[key] && OPS[key].n) || key;
  },
  opOutcomeLabel(w){
    if (w.outcome === 'basari-ifsa') return 'BAŞARILI · aynı denemede İFŞA OLDU';
    if (w.outcome === 'basari') return 'BAŞARILI · ifşa edilmedi';
    if (w.outcome === 'ifsa') return 'İFŞA OLDU · etki oluşmadı';
    if (w.outcome === 'sonucsuz') return 'SONUÇSUZ · ifşa edilmedi';
    // Eski kayıtta yakalanmamış olmak başarı kanıtı değildir.
    return w.caught ? 'İFŞA OLDU' : (w.actorSummary ? 'ifşa edilmedi' : 'ifşa edilmedi · sonuç kaydedilmemiş');
  },
  intelFiles(){
    const e = G.p, simdi = G.memAge || 0;
    let h = '';
    if (Number.isFinite(e.virusUntil) && e.virusUntil > G.day)
      h += `<div class="ph">⚠ DEVAM EDEN ZARAR</div><div class="mini">Tersane virüsü:
        gemi inşa hızın düşürüldü · ${Math.ceil(e.virusUntil-G.day)} gün kaldı.
        Fail bilgisi aşağıdaki dosyanın çözülme durumuna bağlıdır.</div>`;
    const gelen = (e.hitLog || []).slice().reverse();
    const giden = (e.opLog  || []).slice().reverse();
    const opAd = k => this.opRecordName(k);
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
        w.outcome === 'ifsa' ? ' · girişim engellendi' : ''}${
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
        esc(this.opOutcomeLabel(w))}${Number.isFinite(w.cost) ? ' · ' + w.cost + ' ◈ harcandı' : ''}${
        w.actorSummary ? ' · ' + esc(String(w.actorSummary)) : ''}</div>`;
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
    if(key==='bilim'){this.openScience();return;}
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

    this.surfaceReplace($('diploPane'),`<div class="dpBox">
      <div class="dpHd"><span>${P.ico} ${P.n}</span>
        <button class="riX" data-a="closeDiplo">✕</button></div>
      ${sekme}
      <div class="dpBody">${govde}</div></div>`,'global:'+key);
    $('diploPane').classList.add('show');
    /* Panel içindeki canvas'lar (amblem, portre, gezegen) çizilsin */
    setTimeout(()=>{ try{ paintEmblems(); }catch(err){} }, 0);
  },

  /* =============== GALAKTİK KONSEY =============== */
  openCouncil(automatic=false){
    const pane=$('diploPane');
    if(automatic&&(!pane.classList.contains('show')||pane._surfaceKey!=='council'))return;
    const e = G.p;
    let h = `<div class="dpBox">
      <div class="dpHd"><span>🌐 GALAKTİK KONSEY</span>
        <button class="riX" data-a="closeDiplo">✕</button></div>
      <div class="dpBody">`;

    h+=typeof ArchiveUI!=='undefined'?ArchiveUI.newsBackButton():'';
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
        const token=councilVoteToken(c.vote),voted=c.vote.yes.includes(e.id)||c.vote.no.includes(e.id);
        const pending=this._councilPending?.token===token,acked=this._councilAck?.token===token;
        const disabled=c.vote.done||voted||pending||acked;
        if (mem) h += `<div class="act2">
          <button class="abtn pri" data-a="cncYes" data-x="${esc(token)}" ${disabled?'disabled':''}>EVET</button>
          <button class="abtn dgr" data-a="cncNo" data-x="${esc(token)}" ${disabled?'disabled':''}>HAYIR</button></div>
          <div role="status" id="councilVoteStatus">${pending?'Oy host yanıtı bekliyor…':voted?'Oyun kaydedildi: '+(c.vote.yes.includes(e.id)?'EVET':'HAYIR'):this._councilMessage?.token===token?esc(this._councilMessage.text):c.vote.done?'Oylama sona erdi.':''}</div>`;
        else h += `<div class="mini" style="color:#ff9b3d">Üye olmadığın için oy kullanamazsın.</div>`;
        h += `</div>`;
      } else {
        if(c.lastVote){const v=c.lastVote,names=a=>(a||[]).map(id=>id===e.id?'Sen':e.contact[id]&&G.emps[id]?esc(G.emps[id].name):'Bilinmeyen üye').join(' · ')||'—';
          h+=`<div class="box" data-council-result="${esc(v.eventKey)}"><div class="bt">SON OYLAMA · ${esc(RESOLUTIONS[v.key]?.n||v.key)} · ${v.passed?'KABUL':'RED'}</div><div class="mini">Gün ${Math.floor(v.ended)}${v.expired?' · Oy süresi doldu':''}</div><p>EVET (${Number(v.weight.yes).toFixed(1)}): ${names(v.yes)}</p><p>HAYIR (${Number(v.weight.no).toFixed(1)}): ${names(v.no)}</p></div>`;
        }
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
          <canvas class="dpPort" data-ps="${statePortraitSeed(o)}" data-lk="${o.look||'humanoid'}" data-col="${o.col}"
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
    this.surfaceRender($('diploPane'),h,'council',automatic);
    paintEmblems();
    $('diploPane').classList.add('show');
    setTimeout(()=>{
      [...document.querySelectorAll('canvas.dpPort')].forEach(cv=>{
        const g = cv.getContext('2d');
        g.imageSmoothingEnabled = false;
        const spr = ART.portraitFull({
          look: cv.dataset.lk, seed:+cv.dataset.ps||0, col: cv.dataset.col,
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
    this.ensureDiploWorld();id=+id;
    if (!this.diploKnown(id)) return;
    this.stashDiploDraft();
    this.diploTarget=id;this.diploPage='deal';
    const saved=this._diploDrafts[id];
    this.deal=saved?saved.deal:{from:0,to:id,give:[],want:[]};
    this.dealCounter=saved?saved.counter:null;this.dealMsg=saved?saved.msg:'';
    this.drawDeal();
  },
  drawDeal(){
    this.ensureDiploWorld();
    const d = this.deal;
    if (!d) return;
    const e=G.p, o=this.diploKnown(d.to);
    if (!o){this.forgetDeal(d.to);this.diploTarget=null;this.diploPage='states';this.openDiplo();return;}
    this.diploTarget=o.id;this.diploPage='deal';
    let h=this.diploHeader('deal',o);
    h+=`<div class="mini">Taslak bu oturumda saklanır; sekme değiştirirken kaybolmaz.
      Yalnız TEKLİFİ SUN düğmesi karşı tarafa gönderir.</div>`;
    const wcJoin=d.give.concat(d.want).find(i=>i.t==='warJoin');if(wcJoin)h+=`<p class="mini">${wcJoin.plan?'KOŞULLU KABUL: Son savaş onayına kadar ödeme, geçiş veya savaş yok. Kaynaklar rezerve edilmez.':'Kabulde belirli cepheye katılım ve ödeme birlikte uygulanır.'} Geçiş maddesi mevcut süresiz sınır iznidir; savaş bitince otomatik kalkmaz.</p>`;
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
    if (intelOf(e,o.id)>=2 && deliverable){
      const ev=evalOffer(o,d);
      const mood=ev.net>0?'Olumlu eğilim':ev.net>-150?'Kararsız eğilim':'Olumsuz eğilim';
      h+=`<div class="envRow"><span>TUTUM TAHMİNİ</span><b>${mood}</b></div>
        <div class="mini">İstihbarat tahmini; kesin yanıt değildir. Elçi desteği kabul garantisi vermez.</div>`;
    } else h+=`<div class="mini">${deliverable?'Tutum tahmini için en az İZLENİYOR düzeyinde istihbarat gerekir.':'Teklif hazır değil; tutum tahmini yapılmadı.'}</div>`;
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
      <button class="abtn" data-a="dealAdd" data-x="want:tech" ${intelOf(e,o.id)<2?'disabled title="İZLENİYOR istihbaratı gerekir"':''}>✦ Teknoloji</button>
      <button class="abtn" data-a="dealAdd" data-x="want:sys">★ Sistem</button>
      <button class="abtn" data-a="dealAdd" data-x="want:tribute">⏳ Haraç</button>
      <button class="abtn" data-a="dealAdd" data-x="want:lux" ${intelOf(e,o.id)<2?'disabled title="İZLENİYOR istihbaratı gerekir"':''}>❖ Lüks mal</button>
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
    const q = qd;
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
      <button class="abtn pri" data-a="dealSend" ${deliverable?'':'disabled'}>TEKLİFİ SUN</button>
      <button class="abtn" data-a="dealDiscard">TASLAĞI TEMİZLE</button></div>`;
    h += `</div></div>`;
    this.renderDiplo(h,'deal:'+o.id);
  },

  dealAdd(x){
    const [side, kind] = String(x).split(':');
    this.ensureDiploWorld();
    const d=this.deal;
    if (!d || !['give','want'].includes(side)) return;
    const e=G.p,o=this.diploKnown(d.to);
    if (!o) return;
    const src=side==='give'?e:o, list=side==='give'?d.give:d.want;
    const lvl=intelOf(e,o.id), own=side==='give';
    if (!own && ['tech','lux'].includes(kind) && lvl<2){
      say('Bu maddeler için en az İZLENİYOR istihbaratı gerekir','sci');return;
    }
    const choose=(title,labels,fn)=>this.pickList(title,labels,i=>{
      if (G.p!==e || this.deal!==d || !this.diploKnown(d.to)) return;
      fn(i);
    });
    if (kind === 'res' || kind === 'tribute'){
      const opts = ['min','ene','yiy','ala','tuk','etk'].map(r=>({
        lbl: RES[r].ico + ' ' + RES[r].n + ((own||lvl>=3)?' ('+fmt(src.res[r]||0)+')':' (stok bilinmiyor)'), r}));
      choose('Hangi kaynak?', opts.map(x2=>x2.lbl), i=>{
        const r = opts[i].r;
        this.dealAmount(d,side,kind,r);

      });
      return;
    }
    if (kind === 'tech'){
      const mine = Object.keys(src.techs || {});
      const theirs = (side === 'give') ? o : e;
      const av = mine.filter(t => TECHS[t] && ((own&&lvl<2)||!theirs.techs[t]));
      if (!av.length){ say('Paylaşılabilecek teknoloji yok'); return; }
      choose('Hangi teknoloji?', av.map(t=>TECHS[t].n), i=>{
        list.push({t:'tech', id: av[i]}); this.drawDeal();
      });
      return;
    }
    if (kind === 'sys'){
      const systems = G.sys.filter(sy => sy.owner===src.id && src.home!==sy.id &&
        (own||lvl>=3||(sy.seen||[]).includes(e.id)));
      if (!systems.length){ say('Devredilebilir sistem yok'); return; }
      const top = systems;
      choose('Hangi sistem?', top.map(sy=>sy.name + ' (' +
        ((own||lvl>=1)?sy.planets.filter(p=>p.col).length+' koloni':'koloni bilgisi yok') + ')' ), i=>{
        list.push({t:'sys', id: top[i].id}); this.drawDeal();
      });
      return;
    }
    if (kind === 'lux'){
      const own = ownLuxury(src);
      const keys = Object.keys(own);
      if (!keys.length){ say('Bu tarafın lüks malı yok'); return; }
      choose('Hangi mal?', keys.map(k=>LUXURY[k].ico + ' ' + LUXURY[k].n), i=>{
        list.push({t:'lux', k: keys[i]}); this.drawDeal();
      });
      return;
    }
    if (kind === 'intel'){ list.push({t:'intel'}); this.drawDeal(); return; }
    if (kind === 'passage'){ list.push({t:'passage'}); this.drawDeal(); return; }
    if (kind === 'warOn'){
      const cands = G.emps.filter(x=>!x.dead && !x.wild && x.id !== 0 && x.id !== d.to && !x.crisisSide && e.contact[x.id] && (!own||!src.war[x.id]));
      if (!cands.length){ say('Savaş ilan edilecek uygun hedef yok'); return; }
      choose('Kime savaş ilan edilsin?', cands.map(x=>x.name), i=>{
        list.push({t:'warOn', target: cands[i].id}); this.drawDeal();
      });
      return;
    }
    if (kind === 'peaceWith'){
      // src'nin savaşta olduğu taraflar
      const cands = G.emps.filter(x=>!x.dead && !x.wild && !x.crisisSide && x.id !== src.id && (x.id===e.id||e.contact[x.id]) &&
        (own?src.war[x.id]:lvl>=3?src.war[x.id]:true));
      if (!cands.length){ say(side==='give' ? 'Savaşta olduğun kimse yok' : 'Onun savaşta olduğu kimse yok'); return; }
      choose('Kiminle barışılsın?', cands.map(x=>x.name + (x.id===0?' (sen)':'')), i=>{
        list.push({t:'peaceWith', target: cands[i].id}); this.drawDeal();
      });
      return;
    }
  },
  dealAmount(d,side,kind,r){
    const world=G.sys,player=G.p,src=side==='give'?player:G.emps[d.to];
    if(!src||!RES[r]||!['res','tribute'].includes(kind))return;
    const known=side==='give'||intelOf(player,d.to)>=3;
    const limit=known?Math.floor(kind==='res'?Math.min(DEAL_AMOUNT_LIMIT,src.res[r]||0):dealMonthlyCapacity(src,r)):DEAL_AMOUNT_LIMIT;
    const presets=[10,50,100,250,500,1000,5000].filter(v=>v<=limit);
    const token={};this._amountToken=token;
    const alive=()=>this._amountToken===token&&G.sys===world&&G.p===player&&this.deal===d;
    this.openModal(`<div class="mhd">${kind==='res'?'Tek seferlik teslimat':'Aylık ödeme · 10 yıl'} · ${esc(RES[r].n)}</div>
      <div class="mbd"><div class="mini">${known?'Mevcut üst sınır: '+limit:'Karşı tarafın stoku / geliri bilinmiyor; uygulanabilirlik teklif sunulurken doğrulanır.'}
      ${kind==='tribute'?' Mevcut aylık yükümlülükler hesaba katılır; stok biterse yalnız mevcut kaynak ödenir.':' İmzalama Etkisi ve taslaktaki diğer teslimatlar da son kontrolde hesaba katılır.'}</div>
      <label for="dealAmountInput">${kind==='tribute'?'Her ay':'Bir kez'} verilecek miktar</label>
      <div class="amountControls"><button class="abtn" data-a="amountDown" aria-label="Miktarı 10 azalt">−10</button>
      <input id="dealAmountInput" type="number" inputmode="numeric" min="1" max="${Math.max(0,limit)}" step="1" value="${presets[0]||1}" aria-label="Kaynak miktarı">
      <button class="abtn" data-a="amountUp" aria-label="Miktarı 10 artır">+10</button></div>
      <div class="act2">${presets.map(v=>`<button class="abtn" data-a="amountPreset" data-x="${v}">${v.toLocaleString('tr-TR')}</button>`).join('')}</div>
      <div id="dealAmountError" class="mini" role="status"></div></div><div class="mft">
      <button class="ch" data-a="amountApply" ${limit<1?'disabled':''}>TASLAĞA EKLE</button><button class="ch" data-a="closem">VAZGEÇ</button></div>`);
    this._amountToken=token;
    const adjust=delta=>{if(!alive())return;const input=$('dealAmountInput');input.value=String(clamp((Number(input.value)||0)+delta,1,Math.max(1,limit)));};
    this._hook('amountDown',()=>adjust(-10));this._hook('amountUp',()=>adjust(10));
    this._hook('amountPreset',v=>{if(alive()&&v>0&&v<=limit)$('dealAmountInput').value=String(v);});
    this._hook('amountApply',()=>{
      if(!alive())return;const v=Number($('dealAmountInput').value);
      const current=known?Math.floor(kind==='res'?Math.min(DEAL_AMOUNT_LIMIT,src.res[r]||0):dealMonthlyCapacity(src,r)):DEAL_AMOUNT_LIMIT;
      if(!Number.isSafeInteger(v)||v<1||v>current){$('dealAmountError').textContent='Pozitif tam sayı gerekli; güncel üst sınır '+current+'.';return;}
      d[side].push({t:kind,r,v});this._amountToken=null;this.closeModal();this.drawDeal();
    });
  },
  dealPact(k){
    this.ensureDiploWorld();
    const d = this.deal;
    if (!d || !['peace','nap','pact','ally','spynet'].includes(k)) return;
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
    this.ensureDiploWorld();
    if (!this.deal) return;
    const [side, i] = String(x).split(':');
    if (!['give','want'].includes(side)||!Number.isInteger(+i)||+i<0) return;
    const list = (side === 'give') ? this.deal.give : this.deal.want;
    if (+i>=list.length) return;
    list.splice(+i, 1);
    this.drawDeal();
  },
  dealSend(){
    this.ensureDiploWorld();
    /* ═══ FAZ 86B: TEK KANONİK GÖNDERİM ═══
       Eskiden `karsi` yanıtında AI'nın istedikleri oyuncunun listesine
       SESSİZCE push ediliyordu (d.give.push) — oyuncunun teklifi
       kendiliğinden değişiyordu. Artık ayrı karşı teklif kartında
       gösterilir; orijinal liste bozulmaz. */
    const d = this.deal;
    if (!d) return;
    const e = G.p, o = this.diploKnown(d.to);
    if (!o){this.drawDeal();return;}
    const q = (typeof dealQuote === 'function') ? dealQuote(d) : null;
    if (!q || !q.ok){
      this.dealMsg = (q && q.reasons[0]) || 'Teklif geçersiz.';
      this.drawDeal(); return;
    }
    const r = aiRespond(o, q.norm);
    if (r.v === 'kabul'){
      if (executeDeal(q.norm)){
        $('diploPane').classList.remove('show');
        this.forgetDeal(d.to);
        say((d.give.concat(d.want).some(i=>i.t==='warJoin'&&i.plan)?'KOŞULLU KABUL — Savaş Merkezi son onayını bekliyor · ':'ANLAŞMA İMZALANDI — ') + o.name, 'win');
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
      const counterGate=dealQuote(this.dealCounter);
      if(!counterGate.ok){this.dealCounter=null;this.dealMsg='Karşı teklif uygulanamıyor: '+counterGate.reasons.join(' · ');this.drawDeal();return;}
      this.dealMsg = o.name + ': "' + r.why + '" — karşı teklifi ' +
        'ayrı kartta inceleyebilirsin; senin teklifin olduğu gibi duruyor.';
      this.drawDeal(); return;
    }
    /* RET: kaynak, Etki ve RNG değişmez. */
    this.dealMsg = o.name + ': "' + r.why + '"';
    this.drawDeal();
  },

  selectDiploIdentity(id){
    if(id===G.p.id){this.tab('devlet');this.refresh();return;}
    this.selectDiplo(id,'relation');
  },
  warDeclarationPreview(id,key){
    const p=warDeclarationPreview(G.p,G.emps[id],key);if(!p.target)return;
    const group=(title,items)=>`<div class="ph">${title}</div>${items.length?items.map(v=>`<div class="mini">${esc(v.name)} · ${esc(v.side==='defense'?'Hedefin yanında':'Senin yanında')} · ${esc(v.why)}</div>`).join(''):'<div class="mini">Bilinen katılımcı yok.</div>'}`;
    this.openModal(`<div class="mhd">SAVAŞ İLANI ÖNİZLEMESİ</div><div class="mbd"><div class="lead">Hedef: ${esc(p.target.name)} · ${esc(WAR_GOALS[key]?.n||'Geçersiz hedef')}</div>
      <div class="mini">Etki bedeli: ${p.cost} ◈. Son onaya kadar savaş başlamaz. İttifak tek başına otomatik savaş katılımı değildir.</div>
      <details><summary>İsteğe bağlı: Müttefikleri savaşa çağır</summary><p class="mini">İlan sonrasında seçilenlere ayrı gönüllü destek teklifi gönderilir. Ret, ilanını geri almaz. En fazla 8 davet.</p>${G.emps.filter(e=>e.id!==G.p.id&&e.id!==id&&!e.dead&&!e.wild&&!e.crisisSide&&G.p.contact[e.id]).map(e=>`<label class="row"><span>${esc(e.name)}</span><input type="checkbox" data-war-invite="${e.id}"></label>`).join('')}</details>
      ${group('KESİN KATILACAKLAR',p.certain)}${group('KOŞULLU KATILABİLECEKLER',p.conditional)}
      <div class="ph">BİLİNMEYENLER</div><div class="mini">İstihbarat kapsamı dışındaki siyasi bağlantılar ve gizli taahhütler belirlenemez. Bu bölüm gizli devlet sayısını göstermez.</div>
      ${p.risks.map(v=>`<div class="mini">⚠ ${esc(v)}</div>`).join('')}${p.blockers.map(v=>`<div class="mini">Engel: ${esc(v)}</div>`).join('')}
      </div><div class="mft"><button class="ch" data-a="warPrepare" data-x="${id}:${key}" ${p.ok?'':'disabled'}>ÖNCE KOALİSYON HAZIRLA</button><button id="warFinalConfirm" data-a="warFinalConfirm" class="ch" ${p.ok?'':'disabled'}>ONAYLA · SAVAŞ İLAN ET</button><button class="ch" data-a="closem">Vazgeç</button></div>`,'war');
    const pending={world:G.sys,player:G.p,id,key,signature:p.signature};this._warPreview=pending;
    this._hook('warFinalConfirm',()=>{
      if(this._warPreview!==pending||G.sys!==pending.world||G.p!==pending.player)return;
      const invites=[...document.querySelectorAll('[data-war-invite]:checked')].map(e=>+e.dataset.warInvite);if(invites.length>8){say('En fazla 8 davet seç');return;}this._warInvites=invites;
      this._devourPending=null;
    this._warPreview=null;const current=warDeclarationPreview(G.p,G.emps[id],key);
      if(current.signature!==pending.signature||!current.ok){this.warDeclarationPreview(id,key);say('Koşullar değişti; güncel önizlemeyi yeniden onayla.','war');return;}
      // Synchronous final validation precedes both declaration and goal payment.
      const actor=G.p,target=G.emps[id];
      if(!warDeclarationAccess(actor,target).ok||!declareWar(actor,target)){say('Savaş ilanı uygulanamadı; koşullar değişti.','war');return;}
      if(setWarGoal(actor,target,key))say('Savaş hedefi: '+WAR_GOALS[key].n,'war');
      if(!(typeof MP6Stars!=='undefined'&&MP6Stars.S?.started)){this._warInvites=null;const f=warLedgerFind(actor.id,target.id);if(f)WarCenterUI.sendInvites(f.id,target.id,invites);}
      this.closeModal();this.openDiplo();
    });
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
    const C = (this.wC !== null && this.wC !== undefined) ? G.emps[this.wC] : null;
    const totalCost = bedel + (C ? FALSE_FLAG_EXTRA : 0);
    const hazir = !!(A && B);
    const zatenSavas = hazir && A.war[B.id];

    let h = `<div class="mhd"><span>🕸 FISILTI AĞI</span></div>
      <div class="mbd"><div class="lead">İki imparatorluğun arasına kin ek. Kaynak görünmez
      kalır — ama sonsuza dek değil.</div>
      <div class="row"><span>Etkin</span><b style="color:${e.res.etk>=totalCost?'#6ff2c8':'#ff5f6d'}">${fmt(e.res.etk)} / ${totalCost} ◈</b></div>`;

    if (typeof whisperSuccessChance === 'function'){
      const sans = Math.round(whisperSuccessChance(e) * (C ? .88 : 1) * 100);
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

    const toplam = bedel + (C ? ffEk : 0);
    const yeter = e.res.etk >= toplam;
    const check = hazir ? whisperCheck(e,A,B,C) : {ok:false};
    const gecerli = hazir && !zatenSavas && yeter && check.ok;
    if (hazir && !check.ok && check.why) h += `<div class="mini">${esc(check.why)}</div>`;
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
        const fail = w.known ? G.emps[w.by] : null;
        const ad = fail ? `<span style="color:${fail.col}">${esc(fail.name)}</span>`
                        : `<span style="color:#7d90ad">FAİL BİLİNMİYOR</span>`;
        const durum = w.caught ? '<span class="tag b">SUÇÜSTÜ</span>'
                    : w.known  ? '<span class="tag e">SONRADAN ÇÖZÜLDÜ</span>'
                               : '<span class="tag">AÇIK DOSYA</span>';
        h += `<div class="box" style="border-color:${w.known?'#ff5f6d':'#3a4560'}">
          <div class="bt"><span>${esc(this.opRecordName(w.k))}</span>${durum}</div>
          <div class="bd">${ad} · ${yasStr(w.t)}${
            w.foundAt !== undefined ? ' · dosya ' + yasStr(w.foundAt) + ' çözüldü' : ''}${
            w.outcome === 'ifsa' ? ' · girişim engellendi' : ''}</div></div>`;
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
        const hedef = G.emps[w.o];
        h += `<div class="box" style="border-color:${w.caught?'#ff9b3d':'#2b3a55'}">
          <div class="bt"><span>${esc(this.opRecordName(w.k))}</span><span class="tag ${w.caught?'b':''}">${
            esc(this.opOutcomeLabel(w))}</span></div>
          <div class="bd">${hedef ? `<span style="color:${hedef.col}">${esc(hedef.name)}</span>` : '?'}
            · ${yasStr(w.t)}${Number.isFinite(w.cost) ? ' · ' + w.cost + ' ◈ harcandı' : ''}</div>${w.actorSummary ?
              `<div class="mini">${esc(String(w.actorSummary))}</div>` :
              '<div class="mini">Bu eski/özel kayıtta ayrıntılı sonuç saklanmamış.</div>'}</div>`;
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
    this._opPending = null;
    const e = G.p, o = G.emps[id];
    const q = (typeof opQuote === 'function') ? opQuote(e, o, key) : null;
    if (!q || !q.op){ say('Bilinmeyen operasyon'); return; }
    if (!q.ok){ say(q.why || 'Operasyon uygulanamaz'); return; }
    const cost = Object.keys(q.cost).map(r =>
      (RES[r] ? RES[r].ico : r) + q.cost[r]).join(' ');
    /* 87A: aynı hedef/operasyon yeniden açılsa da eski düğme kullanılamaz.
       Onay dünya nesnelerine ve görülen maliyet/risk koşullarına bağlıdır. */
    const token = String(this._opSerial = (this._opSerial || 0) + 1);
    const pending = {id, key, token, actor:e, target:o, emps:G.emps,
      systems:G.sys, cost:JSON.stringify(q.cost), risk:q.risk};
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
        <button class="ch" data-a="opGo" data-x="${id}:${key}:${token}">
          <div class="cht">✔ ONAYLA</div>
          <div class="chd">${cost} harca · %${q.riskPct} ifşa riski</div></button>
        <button class="ch" data-a="closem"><div class="cht">✕ İPTAL</div>
          <div class="chd">Hiçbir şey harcanmaz</div></button>
      </div>`;
    this.openModal(h, 'sci');
    this._opPending = pending;
  },
  opExecute(id, key, token){
    /* ÇİFT DOKUNMA KORUMASI: onay jetonu tek kullanımlıktır ve
       yürütmeden ÖNCE tüketilir. İkinci `opGo` eşleşen jeton
       bulamaz ve sessizce yok sayılır. */
    const pending = this._opPending;
    if (!pending || pending.id !== id || pending.key !== key || pending.token !== token) return;
    this._opPending = null;
    const e = G.p, o = G.emps[id];
    if (e !== pending.actor || o !== pending.target || G.emps !== pending.emps || G.sys !== pending.systems){
      say('Oyun dünyası değişti — operasyonu yeniden açıp onayla');
      this.closeModal(); this.refresh(); return;
    }
    const q = opQuote(e, o, key);
    if (!q.ok || JSON.stringify(q.cost) !== pending.cost || q.risk !== pending.risk){
      say(q.ok ? 'Maliyet veya ifşa riski değişti — yeniden onayla' : q.why);
      this.closeModal(); this.refresh(); return;
    }
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
            r.caught ? 'YAKALANDIN' : 'İFŞA EDİLMEDİ'}</b></div>
        ${!r.caught ? '<div class="mini">Kimliğin şimdi bilinmiyor; dosya sonraki soruşturmalarla çözülebilir.</div>' : ''}
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
    const o = offer && G.emps[offer.from];
    if (!o || o.dead || o.wild || o.id===0 || playerOfferWait(offer)>0) return false;
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
    if (!kendi || kendi.to!==0 || !dealQuote(kendi).ok) return false;
    const termsKey = playerOfferTermsKey(kendi);
    const same = n => n.kind==='aideal' && playerOfferTermsKey(n.data)===termsKey;
    if ((G.inbox || []).some(n=>same(n) && !dealExpired(n.data))) return false;
    if(typeof DiplomaticInbox!=='undefined'&&DiplomaticInbox.state().records.some(r=>r.kind==='aideal'&&r.status==='pending'&&r.expires>G.day&&playerOfferTermsKey(r.note?.data)===termsKey))return false;
    G.inbox = (G.inbox || []).filter(n=>!same(n) || !dealExpired(n.data));
    /* Anahtar İMZAdır: aynı devletten gelen ŞARTLARI FARKLI iki teklif
       yanlışlıkla tekilleştirilmez, birebir aynısı tekrarlanmaz. */
    const imza = (typeof offerSignature === 'function')
                 ? offerSignature(kendi) : ('aideal:' + kendi.from);
    const delivered=this.notify({kind:'aideal', data:kendi, ico:'📜', pause:false,
      title:'Teklif — ' + o.name,
      sub:(kendi.want.map(dealLabel).join(', ') || 'anlaşma') + ' istiyor' +
        ((typeof dealTimeLeft === 'function' && dealTimeLeft(kendi) !== null)
          ? ' · ' + dealTimeLeft(kendi) + ' ay kaldı' : ''),
      key:'aideal:' + imza});
    return delivered!==false;
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
    const world = G.emps, player = G.p, token = {};
    let settled = false;
    const claim = () => {
      if (settled || this._aiDealToken!==token || G.emps!==world || G.p!==player) return false;
      settled = true;
      return true;
    };
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
           esc(q.reasons.join(' · ') || 'Uygulanamaz')+' · Teklif gönderildikten sonra kaynaklar, yaptırımlar veya anlaşmalar değişmiş olabilir.'}</div>` : ''}
       </div>
       <div class="mft">
         <button class="ch ${(q && q.ok) ? '' : 'dis'}"
           ${(q && q.ok) ? 'data-a="offYes"' : ''}>
           <div class="cht">Kabul et</div>
           <div class="chd">Sana Etki'ye mal olmaz</div></button>
         <button class="ch" data-a="offCounter"><div class="cht">Masaya otur</div>
           <div class="chd">Karşı teklif hazırla · orijinal teklif korunur</div></button>
         <button class="ch" data-a="offNo"><div class="cht">Reddet</div>
           <div class="chd">Kaynak ve Etki değişmez · aynı şartlar 27 ay tekrar gönderilmez</div></button>
       </div>`);
    this._aiDealToken = token;
    this._hook('offYes', ()=>{
      if (!claim()) return;
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
      if (!claim()) return;
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
      if (!claim()) return;
      /* RET: kaynak, Etki ve RNG değişmez. */
      if (recordPlayerOfferRefusal(offer)) o.rel[0] = clamp(o.rel[0] - 5, -100, 100);
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

  settlementAgenda(){
    const latest=new Map();
    for(const o of G.settlements?.offers||[])if(o.members.includes(G.p.id))latest.set(o.campaign,o);
    if(!latest.size)return '';
    const label={pending:'Oyun bekleniyor',approved:'Onaylandı · Uygula',applied:'Tamamlandı',
      rejected:'Reddedildi',expired:'Süresi doldu',invalid:'Koşullar değişti',withdrawn:'Geri çekildi'};
    const items=[...latest.values()].map(o=>({o,s:settlementState(o).state}));
    items.sort((a,b)=>Number(['pending','approved'].includes(b.s))-Number(['pending','approved'].includes(a.s))||b.o.id-a.o.id);
    return '<details class="dcDetails" open><summary>Ortak savaş paylaşımları</summary>'+items.slice(0,12).map(({o,s})=>
      `<button class="abtn" data-a="shareOpen" data-x="${o.campaign}">⚖ Sefer ${o.campaign} · ${label[s]||'İncele'}</button>`).join('')+
      '<div class="mini">Oy vermek tek başına devir yapmaz. Onaylanan paylaşımı ayrıca uygula. Son 12 gündem gösterilir.</div></details>';
  },
  openSettlement(campaign,assignments=null,expectedStamp=null,newDraft=false){
    const player=G.p,store=G.settlements;
    const current=()=>G.p===player&&G.settlements===store;
    const q=settlementPreview(player,campaign,assignments);
    const o=!newDraft&&(G.settlements?.offers||[]).filter(x=>x.campaign===campaign&&x.members.includes(player.id)).slice(-1)[0];
    const state=o&&settlementState(o);
    if(!o&&(!q.ok||expectedStamp!==null&&q.stamp!==expectedStamp)){
      this.openModal(`<div class="mhd"><span>PAYLAŞIM TASLAĞI</span></div><div class="mbd">${esc(q.ok?'Taslak eskidi; yeniden açıp incele.':q.why)}</div>
        <div class="mft"><button class="ch" data-a="closem">Kapat</button></div>`);return;
    }
    const proposal=o||q;
    const name=id=>id===player.id||player.contact[id]?esc(G.emps[id]?.name||'Ayrılmış devlet'):'Bilinmeyen ortak';
    const rows=proposal.rows.map((r,i)=>{
      const s=G.sys[r.sys],pl=r.planet===null?null:s?.planets[r.planet],visible=settlementVisible(player,r);
      const title=visible?(r.planet===null?s.name:(pl.col?.name||pl.name)+' · '+s.name):'Keşif bilgisi yetersiz';
      return `<div class="lrow"><b>${esc(title)}</b><div class="mini">${name(r.from)} → ${name(r.to)} · ağırlık ${r.value}</div>
        <div class="mini">${visible?esc(r.why):'Kabul için bu toprağı incelemelisin.'}</div>
        ${!o?`<button class="abtn" data-a="shareNext" data-x="${i}">Alıcıyı değiştir</button>`:''}</div>`;
    }).join('');
    const labels={pending:'Ortakların onayı bekleniyor',approved:'Oybirliğiyle onaylandı · uygulanmayı bekliyor',applied:'Paylaşım uygulandı',rejected:'Reddedildi',expired:'Süresi doldu',invalid:'Bilgiler değişti · teklif geçersiz',withdrawn:'Geri çekildi'};
    const application=o&&state.state==='approved'?settlementApplyQuote(player,o.id):null;
    const canVote=o&&state.state==='pending'&&!o.votes.some(v=>v.by===player.id);
    const visible=proposal.rows.every(r=>settlementVisible(player,r))&&proposal.members.every(id=>id===player.id||player.contact[id]);
    const summary=proposal.shares.map(s=>`<div class="row"><span>${name(s.id)} · katkı ${s.points}</span><b>${s.held} → ${s.allocated}</b></div>`).join('');
    this.openModal(`<div class="mhd"><span>ORTAK SAVAŞ PAYLAŞIMI</span></div><div class="mbd">
      <div class="lead">${o?labels[state.state]:'İncelenecek taslak'}</div>
      <div class="mini">Öneri ücretsiz. Ağırlıklar kaynak değildir: koloni 3, boş sistem 1.
      Mevcut kontrol → önerilen pay aşağıda. Oybirliğinden sonra bir ortak Uygula düğmesine basar.
      Koloni devri yörüngeyi veya filoları devretmez; nüfus ve yapılar korunur.
      Vali eski devletinde kalır, otomatik inşa kapanır. Son koloni verilemez.</div>
      ${summary}${rows}${o?'<div class="mini">'+esc(state.why||'')+'</div>'+o.votes.map(v=>
        '<div class="mini">'+name(v.by)+': '+(v.yes?'EVET':'HAYIR')+' — '+esc(v.why)+'</div>').join(''):''}
      ${application&&!application.ok?'<div class="mini">Uygulanamıyor: '+esc(application.why)+'</div>':''}
      ${o&&state.state==='applied'?'<div class="mini">'+o.receipt.transfers.length+' devir tamamlandı · oyun günü '+o.receipt.at+'</div>':''}
      <div class="mini">Gövde hasarı, imha, çıkarma ve farklı ele geçirmeler katkı ağırlığını belirler.
      Fetih hedefi ve mevcut kontrol öneriyi etkiler. Bütün yaşayan ortakların açık onayı gerekir.</div></div>
      <div class="mft">${!o?`<button class="ch" data-a="shareSend" ${visible?'':'disabled'}>Taslağı onaylayıp sun</button>`:''}
      ${canVote?`<button class="ch" data-a="shareYes" ${visible?'':'disabled'}>Paylaşımı onayla</button><button class="ch" data-a="shareNo">Reddet</button>`:''}
      ${application?`<button class="ch" data-a="shareApply" ${application.ok?'':'disabled'}>Onaylı paylaşımı uygula</button>`:''}
      ${o&&o.proposer===player.id&&['pending','approved'].includes(state.state)?'<button class="ch" data-a="shareWithdraw">Teklifi geri çek</button>':''}
      ${o&&!['pending','approved','applied'].includes(state.state)?'<button class="ch" data-a="shareNew">Yeni taslak</button>':''}
      <button class="ch" data-a="closem">Kapat</button></div>`);
    const result=r=>{if(!r.ok)say(r.why,'war');this.openSettlement(campaign);};
    this._hook('shareNext',i=>{
      if(!current()||o||!q.rows[i])return;
      const a=Object.fromEntries(q.rows.map(r=>[r.key,r.to])),r=q.rows[i];
      a[r.key]=q.members[(q.members.indexOf(r.to)+1)%q.members.length];
      this.openSettlement(campaign,a,q.stamp,true);
    });
    this._hook('shareSend',()=>{if(current()&&!o)result(settlementSubmit(player,campaign,q.stamp,Object.fromEntries(q.rows.map(r=>[r.key,r.to]))));});
    this._hook('shareYes',()=>{if(current()&&canVote&&settlementOffer(o.id)===o)result(settlementVote(player,o.id,true));});
    this._hook('shareNo',()=>{if(current()&&canVote&&settlementOffer(o.id)===o)result(settlementVote(player,o.id,false));});
    this._hook('shareApply',()=>{if(current()&&o&&settlementOffer(o.id)===o)result(settlementApply(player,o.id));});
    this._hook('shareWithdraw',()=>{if(current()&&o&&settlementOffer(o.id)===o)result(settlementWithdraw(player,o.id));});
    this._hook('shareNew',()=>{if(current())this.openSettlement(campaign,null,null,true);});
  },

  /* =============== FEDERASYON OYLAMASI =============== */
  fedGovernance(f,section='all'){
    const e=G.p,T=fedType(f),charter=fedCharter(f);
    const button=(kind,opts,label)=>{const q=canFedMotion(e,kind,opts);const x=kind==='reform'?kind+':'+opts.type:kind==='charter'?kind+':'+opts.field+':'+opts.value:kind==='joinWar'?kind+':'+opts.target+':'+opts.sponsor:kind+':'+opts.target;
      return `<button class="abtn" data-a="fedMotion" data-x="${esc(x)}" ${q.ok?'':'disabled'}>${esc(label)}</button>${q.ok?'':`<div class="mini">${esc(q.why)}</div>`}`;};
    let h='';if(section!=='military'){
    h+=`<div class="box"><b>${T.ico} ${T.n}</b><div class="mini">${T.d}</div><div class="mini">Başkan: ${esc(G.emps[f.leader]?.name||'İlk bakımda belirlenir')}</div><div class="mini">${fedDutyText(f)}</div></div>`;
    h+=this.fedRepresentation(f);
    if(f.reform)h+=`<div class="box"><b>Bekleyen reform: ${FED_TYPES[f.reform.type].n}</b><div class="mini">${Math.ceil(Math.max(0,f.reform.at-G.day)/30)} ay kaldı. Yeni avantaj/yükümlülükler geçiş tamamlanınca başlar.</div></div>`;
    h+=`<details class="dcDetails"><summary>Anayasa ve tür reformu</summary><div class="mini">Reform/anayasa: uygun üyelerin %75’i. Yeni kararlar: mutlak üye çoğunluğu ve ağırlıklı evet üstünlüğü. Oylar 90 gün. Oyuncu kendi önerisinde ayrıca oy verir. Başkan tek başına yasa, üye veya savaş kararı dayatamaz.</div>`;
    for(const field of ['defense','offense','admission','ballot']){
      const dict={defense:{auto:'Otomatik savunma',vote:'Savunma oylaması'},offense:{auto:'Açık onaylı saldırı taahhüdü',vote:'Saldırı oylaması'},admission:{allies:'Yalnız ortak müttefik kabulü',contact:'Temaslı bağımsız adaylar'},ballot:Object.fromEntries(Object.entries(FED_BALLOTS).map(([k,v])=>[k,v.n]))};
      h+=`<div class="mini">${esc(dict[field][charter[field]]||charter[field])}</div>`;for(const value of Object.keys(dict[field]).filter(k=>k!==charter[field]&&(field!=='ballot'||k!=='weighted')))h+=button('charter',{field,value},dict[field][value]+' öner · 100 ◈');
    }
    for(const type of Object.keys(FED_TYPES).filter(k=>k!==(f.type||'askeri')))h+=button('reform',{type},FED_TYPES[type].n+' reformu · 150 ◈');
    h+='<div class="mini">Tür reformu: 12 ay geçiş, kabulden sonra 120 ay yeni reform beklemesi. Eski yasalar korunur; geçmiş savaşlara yeni katılım yükümlülüğü uygulanmaz. Saldırı taahhüdüne hayır/çekimser kalan oyuncu otomatik katılmaz.</div></details>';
    }
    if(section!=='manage'){
    h+='<details class="dcDetails"><summary>Ortak savaş kararları</summary><div class="mini">Onay savaş başlatmaz. Yalnız evet oyu veren üyeler uygulama listesine girer; uygulamada antlaşma, Konsey, vasallık ve hedef yeniden denetlenir.</div>';
    for(const target of G.emps.filter(o=>e.contact[o.id]&&!o.dead&&!o.wild&&!o.crisisSide&&!f.members.includes(o.id))){
      h+=`<div class="box"><b>${esc(target.name)}</b>`;
      if(!e.war[target.id])h+=button('newWar',{target:target.id},'Ortak savaş izni öner');
      for(const id of f.members)if(G.emps[id].war[target.id]&&(id===e.id||intelOf(e,id)>=3))h+=button('joinWar',{target:target.id,sponsor:id},G.emps[id].name+' savaşına destek öner');h+='</div>';
    }
    for(const d of Object.values(f.decisions||{}))if(d.state==='ready')h+=`<div class="box"><b>${d.kind==='newWar'?'Ortak savaş izni':'Mevcut savaşa destek'} · ${esc(e.contact[d.target]?G.emps[d.target]?.name:'Temassız hedef')}</b><div class="mini">${Math.ceil(Math.max(0,d.expires-G.day))} gün geçerli. Katılımcılar kendi evet oylarını verdi.</div><button class="abtn" data-a="fedExecute" data-x="${f.id}:${d.id}" ${e.id===f.leader||e.id===d.by?'':'disabled'}>KARARI UYGULA</button></div>`;
    h+='</details>';
    }
    return h;
  },
  fedRepresentation(f){
    const counts=f.vote?fedVoteCounts(f):null,weights=counts?.weights||fedLiveWeights(f),mode=f.vote?.ballotSnapshot?.mode||fedBallot(f);
    let h=`<div class="box fedPolitics"><b>${esc(FED_BALLOTS[mode]?.n||mode)}</b><div class="mini">${esc(FED_BALLOTS[mode]?.d||'')}</div><div class="mini">${counts?'Bu gündemin ağırlıkları açılışta sabitlendi.':'Üyeler aylık temsil beyanını paylaşır; depo/filo konumu veya kapalı harita paylaşılmaz.'}</div>`;
    for(const id of counts?.eligible||f.members){const vote=f.vote?(f.vote.yes.includes(id)?'EVET':f.vote.no.includes(id)?'HAYIR':'BEKLİYOR'):'';h+=`<div class="row"><span>${esc(G.emps[id]?.name||'Ayrılmış üye')}${id===G.p.id?' · SEN':''}</span><b>${weights[id]||1} oy ${vote}</b></div>`;if(f.vote?.reasons?.[id])h+=`<div class="mini">${esc(f.vote.reasons[id])}</div>`;}
    if(counts)h+=`<div class="mini">${esc(fedVoteRule(f,counts))}</div><div class="mini">Senin oyun: ${counts.waiting.includes(G.p.id)?'Bekleniyor — açık onayın gerekli':counts.eligible.includes(G.p.id)?'Kullanıldı':'Bu gündemde oy hakkın yok'}.</div>`;
    for(const row of Object.values(f.admissionResults||{}).slice(-5))h+=`<div class="mini">Üyelik: ${esc(G.emps[row.target]?.name||'Tarihsel aday')} — ${esc(({pending:'Bekliyor',accepted:'Kabul edildi',rejected:'Reddedildi',expired:'Süresi doldu',invalid:'Geçersiz'})[row.status]||row.status)} · ${esc(row.why)}</div>`;
    return h+'</div>';
  },
  fedAgendaContext(v){
    if(!v)return '';
    const f=findFed(G.p),label=fedVoteLaw(v),name=id=>esc(id===G.p.id||G.p.contact[id]||f?.members.includes(id)?G.emps[id]?.name||'Ayrılmış üye':'Temassız devlet');
    let effect=v.repeal?'Yasa kaldırılır; etkileri sona erer.':label?.d||'';
    if(v.kind==='motion')effect=({admit:'Üyelik daveti açılır; adayın ayrıca yükümlülükleri kabul etmesi gerekir.',expel:'Hedefin üyeliği ve üye ittifakları sonlanır; mevcut savaşları sürer. Yeniden üyelik 24 ay bekler.',elect:'Başkanlık ve mevcut federal gemilerin yönetimi seçilen üyeye geçer.',newWar:'Onay tek başına savaş başlatmaz. Ayrı uygulamada yalnız evet oyu veren uygun üyeler katılır.',joinWar:'Mevcut savaşa destek kararı hazırlanır. Ayrı uygulamada yalnız evet oyu veren uygun üyeler katılır.'})[v.motion]||effect;
    if(v.motion==='charter'){
      const choices={defense:{auto:'Yeni saldırılarda otomatik federasyon savunması',vote:'Savunma için oylama'},offense:{auto:'Açık onay veren üyelerin yeni saldırı savaşlarına katılım taahhüdü',vote:'Saldırıya katılım için oylama'},admission:{allies:'Yalnız bütün üyelerle karşılıklı müttefik adayların kabulü',contact:'Temaslı bağımsız adayların oylamayla kabulü'},ballot:Object.fromEntries(Object.entries(FED_BALLOTS).map(([k,b])=>[k,b.n]))};
      effect='Anayasa değişikliği: '+(choices[v.field]?.[v.value]||v.value)+'. '+effect;
    }
    if(v.motion==='reform')effect=(FED_TYPES[v.type]?.n||'Federasyon türü')+' türüne reform. '+effect;
    if(v.kind==='war')effect='Öneren devletin bu hedefe savaş açmasına geçici izin verilir. Onay savaşı başlatmaz; üyelerin katılımı mevcut anayasa ve yükümlülüklere bağlıdır.';
    let h=`<div class="box"><b>KABUL EDİLİRSE</b><p class="mini">${esc(effect)}</p><div class="mini">Öneren: ${name(v.proposer)}${Number.isInteger(v.target)?' · Hedef: '+name(v.target):''}${f?' · Federasyon: '+esc(f.name):''}</div><div class="mini">Hayır oyu öneriye karşıdır; sonuç mevcut çoğunluk hesabıyla belirlenir. Oy kullanmak için ek kaynak bedeli yoktur; öneri bedeli önerenden alınmıştır.</div>`;
    if(f&&f.vote===v){const c=fedVoteCounts(f);h+=`<div class="mini">${esc(fedVoteRule(f,c))}</div><div class="mini">Destekleyenler: ${(Array.isArray(v.yes)?v.yes:[]).map(name).join(', ')||'yok'} · Karşı çıkanlar: ${(Array.isArray(v.no)?v.no:[]).map(name).join(', ')||'yok'} · Beklenen: ${c.waiting.map(name).join(', ')||'yok'}</div>`;}
    if(f&&(v.kind==='war'||['newWar','joinWar'].includes(v.motion)))h+=`<div class="mini">${esc(fedDutyText(f))} Üyeler: ${f.members.map(name).join(', ')}</div>`;
    return h+'</div>';
  },
  /* BETA-EVENT-UX.1: oy kartı alt yazısı — üyelik başvurusu / ihraç / başkan seçimi gibi hedefli önergede hedef devlet adıyla */
  fedVoteSub(f){const v=f.vote,L=fedVoteLaw(v),t=v&&Number.isInteger(v.target)&&G.emps[v.target]?G.emps[v.target].name:null;
    return (v&&v.motion==='admit'&&t?'Üyelik başvurusu — '+t:(L?L.n:'Karar')+(t&&v.kind==='motion'?' — '+t:''))+(v&&v.repeal?' — kaldırma':'');},
  fedVote(f){
    const L = fedVoteLaw(f.vote);
    if (!L) return;
    this.notify({kind:'fedvote', data:f.id, ico:'🏛', pause:true,
      title:'Federasyon oylaması', sub:this.fedVoteSub(f), key:'fed:'+f.id+':'+fedVoteToken(f.vote)});
  },
  fedVoteOpen(fid){
    const f = fedOf(fid);
    if (!f || !f.vote || !f.members.includes(G.p.id)){ return; }
    if(typeof ArchiveUI!=='undefined'&&typeof DiplomaticInbox!=='undefined'){
      DiplomaticInbox.sync();const rec=DiplomaticInbox.state().records.find(r=>r.kind==='fedvote'&&r.fid===fid&&r.token===fedVoteToken(f.vote));
      if(rec){ArchiveUI.record(rec.id);return;}
    }
    const L = fedVoteLaw(f.vote);
    if (!L) return;
    const token = fedVoteToken(f.vote), counts = fedVoteCounts(f);
    const {yes, no} = counts;
    const canVote = counts.waiting.includes(G.p.id) &&
      !(Number.isFinite(f.vote.expires) && G.day >= f.vote.expires);
    this.openModal(
      `<div class="mhd"><span>${esc(f.name)}</span></div>
       <div class="mbd"><div class="lead">${L.ico} ${L.n}</div>${L.d}${this.fedAgendaContext(f.vote)}${this.fedRepresentation(f)}
       <div class="row" style="margin-top:10px"><span>Mevcut oylar</span>
         <b><span style="color:#65e08a">${yes} evet</span> · <span style="color:#ff5f6d">${no} hayır</span></b></div>
       <div class="mini">Seçmenler: ${counts.eligible.map(m=>esc(G.emps[m].name)+' ('+(f.vote.yes.includes(m)?'evet':f.vote.no.includes(m)?'hayır':'bekliyor')+')').join(' · ')}</div>
       <div class="mini">${canVote ? 'Oyun bekleniyor.' : 'Oy kullandın veya bu gündemde oy hakkın yok.'}
         ${Number.isFinite(f.vote.expires) ? Math.max(0,f.vote.expires-G.day)+' gün kaldı.' : ''}
         Eşitlikte ret; süre sonunda kullanılmayan oylar çekimser.</div></div>
       <div class="mft">
         <button class="ch" data-a="fedYes" ${canVote ? '' : 'disabled'}><div class="cht">EVET oy ver</div></button>
         <button class="ch" data-a="fedNo" ${canVote ? '' : 'disabled'}><div class="cht">HAYIR oy ver</div></button>
       </div>`);
    const vote = yes => {
      if (fedOf(fid) !== f){ this.closeModal(); return; } // yüklemeden kalan modal
      const r = castFedVote(G.p, fid, token, yes);
      if (!r.ok) say(r.why, 'war');
      this.closeModal(); this.refresh();
      if ($('diploPane').classList.contains('show')) this.openFed();
    };
    this._hook('fedYes', ()=>vote(true));
    this._hook('fedNo', ()=>vote(false));
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
          <div class="bd">${e.vassalContract?this.vsTermsText(vt,e.vassalContract.terms,e):esc(T.d)}</div><button class="abtn" data-a="vsCurrent">SÖZLEŞMEM · BAĞIMSIZLIK / YENİDEN MÜZAKERE</button>
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
            <b>${e.vassalContract?({none:"Zorunlu savaş yok",defense:"Senyörün savunma savaşları",all:"Senyörün bütün savaşları"}[e.vassalContract.terms.war]):"Vergi yok · senyörünün savaşlarına katılırsın"}</b></div>`;
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
      h += `<div class="row"><span>Köken</span><b>${ORIGINS[e.origin].ico} ${ORIGINS[e.origin].n}</b></div><div class="box"><div class="mini">${esc(ORIGINS[e.origin].story||'')}</div><div class="mini">${esc(originEffectText(e))}</div><div class="mini">Bunlar başlangıç koşullarıdır; mevcut nüfus, gemi ve üretim zamanla değişir. Tür, doktrin, sivil politika ve zorluk ayrıca uygulanır.</div></div>`;
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

    h += `<div class="ph">AYLIK BİLANÇO</div><details><summary>Enerji ve alaşım yetersizliği</summary><p class="mini">Enerji stoku 0 altına inmez. Net üretim negatifse borç birikmez; aylık kapanışta karşılanamayan enerji tüketimi enerji krizini başlatır. Kriz sürerken istikrar hedefi 22 puan düşer ve nüfus artışı durur. Bu bir aylık hedef etkisidir, anında 22 nüfus/istikrar kaybı değildir.</p><p class="mini">Alaşım stoku da 0 altına inmez. Otomatik donanma üretimi ${NAVY_SLEEP_ALA} alaşımın altında uyur; manuel sipariş ve takviye gerçek kaynak koşullarına tabidir. Önceden ödenmiş siparişin bedeli yeniden kesilmez. İkmalsizlik ve radyasyon kaynaklı gemi kayıpları ayrı mekaniklerdir.</p></details>`;
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
    h += `<div class="row"><span>Liman/ağ üretim katkısı</span><b style="color:#65e08a">+%${Math.round(tr.mul*100)}</b></div>`;
    if (tr.vol) h += `<div class="row"><span>Yol kapasitesi</span><b>${Math.round(tr.vol)}</b></div>`;
    {
      const eneBase = e.inc.ene || 0;
      const gainPct = Math.round((tr.mul||0) * 100);
      const eneGain = eneBase * (tr.mul||0) / Math.max(.0001, 1 + (tr.mul||0));
      h += `<div class="row"><span>Ticaret katkısı</span><b style="color:#65e08a">+%${gainPct} enerji</b></div>`;
      h += `<div class="mini">Bu yüzde liman/ağ üretim katkısıdır. Gerçek kargo ve ödeme yalnız konvoy varışında teslim edilir; tahmini sefer geliri eklenmez.</div><button class="abtn" data-a="commerce">▱ Kaynak sözleşmeleri ve konvoylar</button>`;

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
  // A second real tap must not fall through a closing demolition dialog.
  // Keep this transient and local to the release point; keyboard and engine
  // actions, and deliberate taps elsewhere, retain their existing behavior.
  constructionClickBlocked(el,event){
    if(!event.detail)return false;
    const now=Date.now(),last=this._constructionRelease;
    if(last&&now<last.until&&Math.hypot(event.clientX-last.x,event.clientY-last.y)<24)return true;
    if(el.dataset.a==='demolishConfirm'||el.dataset.a==='closem'&&this._demolitionToken)
      this._constructionRelease={x:event.clientX,y:event.clientY,until:now+450};
    return false;
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
    const sys=G.sys[+sid],pl=sys?.planets[+pi],B=BUILDINGS[k],col=pl?.col,player=G.p,world=G.sys;
    const available=(col?.b[k]||0)-(col?.q||[]).filter(w=>w.dem&&w.key===k).length;
    if(!B||!col||pl.owner!==player.id||available<=0||k==='santral'&&available<=1){say('Bu bina yıkılamıyor','war');return;}
    const token={};
    const refund=Object.entries(demolishRefund(k)).map(([r,v])=>RES[r].ico+' '+v).join(' · ');
    this.openModal(`<div class="mhd">BİNA YIKIMINI ONAYLA</div><div class="mbd"><div class="lead">${esc(B.n)} · ${esc(pl.name)}</div>
      <div class="mini">Bir bina yıkım sırasına alınacak. Yapı ve üretimi yıkım tamamlanana kadar korunur. Emri inşaat kuyruğundan iptal edebilirsin.</div>
      <div class="row"><span>Tamamlanınca hurda</span><b>${esc(refund)}</b></div>
      <div class="row"><span>Süre</span><b>~${Math.ceil(demolishDays(player,k)/30)} ay</b></div></div>
      <div class="mft"><button class="ch" data-a="closem">VAZGEÇ</button><button class="ch" data-a="demolishConfirm">YIKIM EMRİ VER</button></div>`);
    this._demolitionToken=token;
    this._hook('demolishConfirm',()=>{
      if(this._demolitionToken!==token||G.sys!==world||G.p!==player||sys.planets[+pi]!==pl||pl.col!==col)return;
      this._demolitionToken=null;this.closeModal();
      if(queueDemolish(player,sys,pl,k))say(B.n+' yıkım emri verildi — ~'+Math.ceil(demolishDays(player,k)/30)+' ay');
      else say('Bu bina yıkılamıyor','war');
      this.keepScroll=true;this.refresh();
    });
  },
  cancelBuild(x){
    const [sid, pi, qi] = x.split(':');
    const sys = G.sys[+sid], pl = sys.planets[+pi];
    if (typeof cancelBuild === 'function') cancelBuild(G.p, sys, pl, +qi);
    this.keepScroll = true; this.refresh();
  },
  buildShip(x){
    const [sid,k] = x.split(':');
    const access = shipBuildAccess(G.p, k);
    if (!access.ok){ say(access.why, 'war'); return; }
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
  /* BETA-FED-FLEET.0: başkanın tersanesinde federal sipariş (aynı motor yolu: orderFederalShip; MP misafirinde host komutu) */
  buildFedShip(x){
    const [sid,k] = x.split(':');
    const r = (typeof orderFederalShip === 'function') ? orderFederalShip(G.p, +sid, k) : {ok:false, why:'—'};
    if (r && r.ok === false && r.why) say(r.why, 'war');
    this.keepScroll = true; this.refresh();
  },
  fedOrderHtml(s){
    const f = typeof findFed === 'function' ? findFed(G.p) : null;
    if (!f || f.leader !== G.p.id || typeof fedShipQuote !== 'function' || s.owner !== G.p.id) return '';
    const st = fedFundStatus(f);
    let h = `<div class="ph">FEDERAL SİPARİŞ · ${esc(f.name)}</div><div class="mini" id="fedOrderInfo">Ortak fon ${Math.floor(st.ala)} alaşım · ${Math.floor(st.ene)} enerji · donanma ${st.ships + st.queued}/${st.cap} gemi (kuyruk ${st.queued}) · ${st.monthUsed ? 'bu ay sipariş verildi' : 'bu ay 1 sipariş hakkı'} · bakım ${Math.round(st.bakim)} ene + ${Math.round(st.bakimA*10)/10} ala / ay</div><div class="act2">`;
    let firstWhy = '';
    for (const k of FED_FLEET.classes){
      const d = SHIPS[k], q = fedShipQuote(G.p, s.id, k), cost = fedShipCost(k);
      if (!q.ok && !firstWhy) firstWhy = q.why;
      h += `<button class="abtn ${q.ok?'':'dis'}" ${q.ok?'':'disabled'} data-a="fedShip" data-x="${s.id}:${k}" title="${esc(q.ok?d.n+' · federal':q.why)}">🏛 ${d.ab}<br><span style="font-size:9px">▰${cost.ala} fon</span></button>`;
    }
    return h + `</div>` + (firstWhy ? `<div class="mini" id="fedOrderWhy" style="color:#ff9b3d">${esc(firstWhy)}</div>` : '');
  },
  setTech(x){
    const [b,id] = x.split(':');
    if(!researchValidTech(id)||TECHS[id].b!==b)return;
    const result=researchTarget(G.p,id);
    if(!result.ok)say(result.why,'war');
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
        if (kIx >= 0){if(f.ships.length===1)fleetLost(f,'colonization');f.ships.splice(kIx, 1);}
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
    if(hasShipment(f)){say('Önce sevkiyatı iptal et');return;}
    const grp = fleetGroup(f);
    const others = G.fleets.filter(x=>x!==f && x.e===0 && x.sys===f.sys && !hasShipment(x) && fleetGroup(x)===grp);
    if (!others.length){
      say(grp === 'sav' ? 'Bu sistemde birleşecek başka savaş filosu yok'
                        : 'Bu sistemde birleşecek başka sivil filo yok');
      return;
    }
    const result=mergeFleetInto(G.p,f,others);if(!result.ok){say(result.why,'war');return;}
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
    if (kind === 'war'){
      if (!fedWarAllowed(e,o)){ this.openFed(); return; }
      this.warGoalMenu(o.id); return;
    }
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
    this.ensureDiploWorld();
    if (!this.diploKnown(+id)) return;
    this.stashDiploDraft();this.diploTarget=+id;this.diploPage='deal';
    this.deal={from:0,to:+id,give:(items||[]).slice(),want:[]};
    this.dealCounter=null;this.dealMsg='';
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
  chain(id,e=G.p){
    if(e!==G.p)return enqueueDecision(e,'chain',id);
    const c = CHAINS[id];
    if (!c) return;
    this.notify({kind:'chain', data:id, ico:'📖', cls:'sci', pause:true,
      title:c.n, sub:(c.t||'').slice(0,64) + '…', key:'chain:'+id});
  },
  event(ev,e=G.p){
    if(e!==G.p)return enqueueDecision(e,'event',ev.id);
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
  anomaly(a, sys,e=G.p){
    if(e!==G.p){const r=enqueueDecision(e,'anomaly',a.id,sys.id);if(!r.ok&&r.why==='Bekleyen olay sınırı')sys.anom=true;return r;}
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
       <div class="mini" style="margin-top:8px">Mevcut memnuniyetle karşılarsan +${Math.round(facMoodDelta(G.p, f.mood, 18))}; karşılamazsan ${Math.round(facMoodDelta(G.p, f.mood, -14))} memnuniyet.
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
    recordNews({category:'crisis',scope:'player',empires:[0],key:'crisis-stage:'+stage+':'+G.crisis?.atMonth,title:'Galaktik kriz — aşama '+stage,text:'Galaktik kriz bildirimi alındı',important:true});
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
    recordNews({category:'crisis',scope:'player',empires:[0],key:'crisis-end:'+G.crisis?.atMonth,title:'Galaktik kriz sona erdi',text:'Ortak tehdit sona erdi',important:true});
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
  warNoticeName(id){
    const e=G.emps[id],p=G.p;
    return e&&p&&(id===p.id||p.contact&&p.contact[id]||p.war[id])?e.name:'Bilinmeyen devlet';
  },
  warDeclared(data){
    // Legacy callers/queued wardec notes remain readable; new declarations use warstart.
    if(Number.isInteger(data.id)){
      this.notify({kind:'wardec',data:data.id,ico:'⚔',cls:'war',pause:WAR_PAUSE_ON,
        title:'SAVAŞ İLANI',sub:data.name,key:'wd:'+data.id});return;
    }
    if(!warNoticeData(data))return;
    this.notify({kind:'warstart',data,ico:'⚔',cls:'war',pause:WAR_PAUSE_ON,
      title:'SAVAŞA DAHİLSİN',sub:this.warNoticeName(data.attacker)+' → '+this.warNoticeName(data.defender)+' · '+
        ({federation:'Federasyon yükümlülüğü',overlord:'Senyörlük koruması',vassal:'Vasal çağrısı',promise:'Savaş taahhüdü',independence:'Bağımsızlık',independenceSupport:'Bağımsızlık desteği',event:'Oyun olayı (başlatma ayrıntısı kaydedilmemiş)'}[data.reason]||'Yeni savaş ilanı')+
        (data.sponsor!==null?' · Çağıran: '+this.warNoticeName(data.sponsor):''),
      key:'war:'+data.front});
  },
  warStartOpen(d){
    if(!warNoticeData(d))return;
    ArchiveUI.warStatus(d);
  },
  warDecOpen(id){
    const o=G.emps[id];if(!o)return;
    this.openModal(`<div class="mhd"><span>⚔ ÖNCEKİ SAVAŞ BİLDİRİMİ</span></div>
      <div class="mbd">${esc(this.warNoticeName(id))}<div class="mini">Bu eski kayıtta ilan ve katılım ayrıntıları bulunmuyor.</div></div>
      <div class="mft"><button class="ch" data-a="wdDiplo"><div class="cht">Diplomasi</div></button>
      <button class="ch" data-a="closem"><div class="cht">Kapat</div></button></div>`,'war');
    this._hook('wdDiplo',()=>{this.closeModal();this.selectDiplo(id,'relation');});
  },
  borderEvent(){return false;}, // 94D.1: retired random incident; legacy API is harmless.

  /* ---------- BİLDİRİM KUTUSU ----------
     Olaylar artık ekrana fırlamıyor. Üstte tıklanabilir bir kart
     belirir; oyuncu hazır olduğunda açar. Önemli olaylar oyunu
     duraklatır, küçük bildirimler oyunu bölmez. */
  notify(item){
    G.inbox = G.inbox || [];
    if (item.key && G.inbox.some(x => x.key === item.key)) return;
    item.uid = (G.inboxUid = (G.inboxUid || 0) + 1);
    item.born = G.day;
    if(typeof DiplomaticInbox!=='undefined'&&DiplomaticInbox.supported(item.kind)&&!DiplomaticInbox.capture(item)){say('Gelen kutusu kapasitesi dolu; yeni teklif alınmadı','war');return false;}
    G.inbox.push(item);
    // kutu şişmesin: en eski duraklatmayan bildirimler düşer
    while (G.inbox.filter(n=>!n.hidden).length > 6){
      let i = G.inbox.findIndex(x => !x.pause&&!x.hidden&&x.uid!==G.minNote);   // MP.7.5: gizlenen karar olayı önce düşmez
      if (i < 0) i = G.inbox.findIndex(x => !x.pause&&!x.hidden&&x.uid!==G.minNote);
      const fallback=G.inbox.findIndex(x=>!x.hidden&&x.uid!==G.minNote);
      const chosen=i>=0?i:fallback;if(this.noteChoiceData(G.inbox[chosen]))G.inbox[chosen].hidden=true;else G.inbox.splice(chosen,1);
    }
    if (item.pause && G.speed > 0){
      this.prePause = G.speed;
      this.setSpeed(0);
    }
    this.drawInbox();
  },
  drawInbox(){
    if(this._deferInbox)return;this.fedFoundCards();this.fedAgendaCards();
    G.inbox=(G.inbox||[]).filter(n=>{if(n.kind==='cncvote')return this.cncVoteOpenFor();if(!['invite','fedvote','fedfound','decision'].includes(n.kind))return true;if(n.kind==='fedvote'){const f=fedOf(n.data);if(!f?.vote||n.key!=='fed:'+f.id+':'+fedVoteToken(f.vote)||!fedVoteCounts(f).waiting.includes(G.p.id))return false;}const r=DiplomaticInbox.state().records.find(r=>r.key===n.key||r.note?.key===n.key||r.note?.uid===n.uid);return !r||r.status==='pending'&&!DiplomaticInbox.gate(r).terminal;});
    const box = $('inbox');
    if (!box) return;
    const list = (G.inbox || []).filter(n=>!n.hidden);   // MP.7.5: kaydırılarak gizlenen olay kartı çizilmez
    const info=this.instInfo();   // BETA-EVENT-UX.0: federasyon / Konsey bilgi kartları (Save8 ve G.inbox dışında)
    if (!list.length&&!info.length){this.surfaceReplace(box,'','inbox');box._inboxMarkup96d=null;box.classList.add('hidden');return; }
    box.classList.remove('hidden');
    const markup = list.map(it =>{const brief=this.diplomaticBrief(it);return `<button class="nCard ${it.cls||''}" data-a="openNote" data-x="${it.uid}">
         <span class="nIco">${it.ico||'✉'}</span>
         <span class="nTxt"><b>${esc(brief?.title||it.title)}</b><i>${esc(brief?.sub||it.sub||'')}</i></span>
         <span class="nGo">›</span>
       </button>${this.noteQuick(it)}`;}).join('')+info.map(r=>`<button class="nCard nInfo sci" data-a="instNote" data-x="${r.id}">
         <span class="nIco">${r.ico}</span>
         <span class="nTxt"><b>${esc(r.title)}</b><i>${esc(r.sub)}</i></span>
         <span class="nGo">›</span>
       </button>${r.decision?(r.wait?`<div class="nQuick"><span class="nqWait">Karar gönderildi — yanıt bekleniyor…</span></div>`:`<div class="nQuick"><button class="nq ok" data-a="instDecide" data-x="${r.id}:y">KABUL</button><button class="nq no" data-a="instDecide" data-x="${r.id}:n">REDDET</button></div>`):''}`).join('');
    // Keep an unchanged decision's DOM node and entrance animation stable during refresh.
    this.surfaceRender(box,markup,'inbox',true);box._inboxMarkup96d=markup;
    this.noteSwipeBind(box);
  },
  /* MP.7.4: KAYDIRILABİLİR BİLDİRİM + KARTTAN HIZLI KARAR
     Yeni bildirim / karar motoru yok: kart düğmeleri Gelen kutusu penceresinin
     yolunu kullanır (DiplomaticInbox.resolve, karşı teklifte aiDealOpen).
     Kaydırmak yalnız kartı ekrandan kaldırır: karar vermez, kaydı silmez. */
  diplomaticBrief(it){
    if(it.kind!=='aideal'||!it.data)return null;const o=it.data,all=[...(o.give||[]),...(o.want||[])],types=[...new Set(all.map(i=>i.t))];
    const kind=types.includes('peace')?'Barış teklifi':types.includes('ally')?'İttifak teklifi':types.includes('nap')?'Saldırmazlık teklifi':'Diplomatik teklif';
    const label=l=>l.slice(0,2).map(i=>dealLabel(i)).join(', ')||'yok',extra=Math.max(0,(o.give||[]).length-2)+Math.max(0,(o.want||[]).length-2),duty=types.includes('ally')?' · Karşılıklı ittifak yükümlülüğü':'';
    return {title:this.diploName(o.from)+' · '+kind,sub:'Veriyor: '+label(o.give||[])+' · İstiyor: '+label(o.want||[])+duty+(extra?' · +'+extra+' koşul · Ayrıntıları gör':'')+(Number.isFinite(o.expires)?' · '+Math.max(0,Math.ceil((o.expires-G.day)/30))+' ay':'')};
  },
  noteChoiceData(it){
    if(!it)return null;if(it.kind==='event')return EVENTS.find(e=>e.id===it.data?.id)||null;
    if(it.kind==='chain')return CHAINS[it.data]||null;
    if(it.kind==='anomaly')return ANOMALIES.find(a=>a.id===it.data?.a?.id)||null;
    return null;
  },
  eventDecisionAuthority(){return true;},
  choiceExplanation(c){if(c.next&&!c.f){const intent={grev2a:'Kurtarma çalışmaları öncelik kazanır.',grev2b:'Üretim öncelikli tutulur; sendikalarla sonraki karar beklenir.',grev2c:'Kazanın sorumluları araştırılır; sonraki aşamada rapora karar verilir.'}[c.next]||c.d||c.t;return intent+' · Bu aşamada kaynak/ödül uygulanmaz. '+(CHAINS[c.next]?.n||'Sonraki bölüm')+' aşamasındaki seçim sonucu belirler.';}return (c.d||'Sonuç koşullara bağlı')+(c.uncertain||/risk|bilinmeyen|ihtimal|şans/i.test(c.d||'')?' · Sonuç belirsiz':'');},
  noteChoiceMenu(it){
    const ev=this.noteChoiceData(it);if(!ev)return '';
    if(it.decisionId&&this.eventChoiceWaiting?.(it.decisionId))return '<div class="nOptions" role="status">Karar gönderildi — host yanıtı bekleniyor…</div>';
    if(!this.eventDecisionAuthority())return '<div class="nOptions"><span class="mini">Bu olayın kararı host yetkisi gerektirir; yerel ödül uygulanmaz.</span></div>';
    if(this._noteOptionsWorld!==G.emps){this._noteOptionsWorld=G.emps;this._noteOptions=new Set();}
    const open=this._noteOptions.has(it.uid),toggle=`<button class="abtn" data-a="noteOptions" data-x="${it.uid}" aria-expanded="${open}">${open?'SEÇENEKLERİ GİZLE ▴':'SEÇENEKLER ▾'}</button>`;
    if(!open)return '<div class="nOptions">'+toggle+'</div>';
    return `<div class="nOptions expanded">${ev.ch.map((c,i)=>`<button class="ch" data-a="noteChoice" data-x="${it.uid}:${i}"><b>${esc(c.t)}</b><small>${esc(this.choiceExplanation(c))}</small></button>`).join('')}${toggle}</div>`;
  },
  applyEventChoice(note,index,world=G.emps){
    if(!this.eventDecisionAuthority())return {ok:false,why:'Kararı yalnız yetkili host uygular'};
    const data=this.noteChoiceData(note),live=(G.inbox||[]).find(n=>n===note||n.uid===note?.uid&&n.key===note?.key&&n.kind===note?.kind);
    if(world!==G.emps||G.p.dead||G.over||Number.isFinite(note?.expires)&&G.day>=note.expires||!data||!Number.isInteger(index)||!data.ch[index]||(!live&&this._openNote!==note))return {ok:false,why:'Olay artık beklemiyor veya oyun kaydı değişti'};
    const opt=data.ch[index],tx=dealTxBegin(),wasOpen=this._openNote;
    let result='';
    try{
      G.inbox=(G.inbox||[]).filter(n=>n!==live);if(this._openNote===note)this._openNote=null;if(G.minNote===note.uid)G.minNote=null;
      // Exactly the same authored choice callback and random source formerly
      // used by the full window. Rendering never executes this path.
      result=authoredDecision(G.p,note.kind,note.kind==='chain'?note.data:note.kind==='event'?note.data.id:note.data.a.id,index,note.data?.sys?.id);
    }catch(error){dealTxRollback(tx);this._openNote=wasOpen;return {ok:false,why:'Olay uygulanamadı; durum korundu: '+String(error.message||error).slice(0,160)};}
    this._noteOptions?.delete(note.uid);
    this.openModal(`<div class="mhd"><span>SONUÇ</span></div><div class="mbd">${result||'Karar uygulandı.'}</div><div class="mft"><button class="ch" data-a="closem"><div class="cht">Kapat</div></button></div>`,note.kind==='event'?'':'sci');
    this.drawInbox();this.refresh();return {ok:true};
  },
  noteRecord(it){
    if(!it||typeof DiplomaticInbox==='undefined'||!DiplomaticInbox.supported(it.kind))return null;
    const byId=Number.isInteger(it.rec)?DiplomaticInbox.get(it.rec):null;   // çok oyunculu kartın kayıt bağı
    if(byId)return byId.status==='pending'?byId:null;
    const st=DiplomaticInbox.state().records,hit=st.find(r=>r.status==='pending'&&r.note&&(r.note.uid===it.uid||typeof it.key==='string'&&r.note.key===it.key));if(hit)return hit;
    /* BETA-EVENT-UX.1: oylama kaydı Gelen kutusu eşitlemesiyle (DiplomaticInbox.sync) karttan önce doğduysa kaydın notunda kartın
       uid/anahtarı yok; kart → kayıt bağı hızlı EVET/HAYIR'ı kaybediyordu (misafirde Gelen kutusu açıldıktan sonra gelen oy). Kayıt
       anahtarı oylamanın kendisinden türetilir (aynı capture kuralı: 'vote:'+federasyon+':'+oy kimliği). */
    const m=it.kind==='fedvote'&&typeof it.key==='string'&&/^fed:(\d+):(.+)$/.exec(it.key);
    return m?st.find(r=>r.status==='pending'&&r.key==='vote:'+m[1]+':'+m[2])||null:null;
  },
  /* BETA-EVENT-UX.0 — FEDERASYON / KONSEY BİLGİ KARTLARI
     Kurum olaylarının çoğu yalnız günlük satırı ve haberdi; üst çubukta görünmüyordu. Yeni olay motoru yok: kartlar oyuncunun ZATEN
     yetkili olduğu veriden türetilir — kendi haber kayıtları (federasyon / Konsey kategorisi; misafirde host'un o oyuncu için süzdüğü
     haberler) ve üyesi olduğu federasyonun son oylama sonucu (f.lastVote; misafire yalnız üyeye gider). Kartlar G.inbox'a girmez:
     Save8, inboxUid, RNG ve hız değişmez, duraklatma yoktur. Tekillik: sabit anahtar + bu oturumun "görüldü" kümesi. İlk taramada
     (yeni sayfa, yüklenen kayıt, oyun günü geri ya da 400 günden çok ileri sıçrayınca) var olan kayıtlar görüldü sayılır → yeniden bağlanma,
     ayna yenilemesi ya da kayıt yükleme eski olayı yeniden doğurmaz. En çok 3 kart, 60 oyun gününden eskisi düşer; geçmiş haberlerde. */
  /* BETA-EVENT-UX.1: oyuncuya yönelik metinde kesirli oyun günü (motor metni "gün 9.4065…") yalnız GÖSTERİMDE tam güne yuvarlanır (G.day / kayıt değişmez) */
  dayText(t){return String(t==null?'':t).replace(/\bgün (\d+)\.\d+/g,'gün $1');},
  instInfoRows(){
    const out=[],p=G.p;if(!p)return out;
    const founding=new Set((G.fedFounding?.proposals||[]).map(x=>x.fid).filter(Number.isInteger));
    for(const r of (G.news&&G.news.records)||[]){if(r.category!=='federation'&&r.category!=='council')continue;
      const m=/^fed:(\d+):([A-Za-z]+):/.exec(r.key||''),ev=m&&m[2],fid=m&&+m[1],txt=String(r.text||''),fedName=txt.split(' — ')[0];
      /* BETA-EVENT-UX.1: aynı olay iki kart olmasın — açık kuruluş süreciyle kurulan federasyonun sonucu fedfoundResult kartında; başkan değişimi ayrı izlenir */
      if(ev==='founded'&&founding.has(fid))continue;
      const kind=ev==='motion'?txt.slice(fedName.length+3):null;if(kind==='elect')continue;
      const sub=ev==='motion'&&typeof FED_MOTIONS!=='undefined'&&FED_MOTIONS[kind]?fedName+' · '+FED_MOTIONS[kind].n:ev==='reformComplete'&&typeof FED_TYPES!=='undefined'&&FED_TYPES[kind=txt.slice(fedName.length+3)]?fedName+' · '+FED_TYPES[kind].n:ev?fedName:this.dayText(txt);
      out.push({key:'n:'+r.key,day:r.day,ico:r.category==='council'?'🌐':'🏛',title:String(r.title||'').slice(0,90),sub:String(sub).slice(0,140),news:r.id});}
    for(const f of G.feds||[]){const v=f.lastVote;if(!v||!(f.members||[]).includes(p.id)||!Number.isFinite(v.day))continue;
      const L=typeof fedVoteLaw==='function'?fedVoteLaw(v):null;
      out.push({key:'v:'+f.id+':'+v.id+':'+v.day,day:v.day,ico:'🏛',title:'Federasyon oylaması sonuçlandı — '+f.name,sub:(L?L.n:'Karar')+(v.repeal?' (kaldırma)':'')+': '+(v.passed?'KABUL':'RED')+(v.why?' · '+String(v.why).slice(0,80):''),fed:f.id});}
    /* BETA-EVENT-UX.1: üyelik başvurusunun sonucu başvurana (motorun admissionResults satırı; misafire aynada yalnız kendi satırı gider) */
    for(const f of G.feds||[])for(const [tok,row] of Object.entries(f.admissionResults||{})){if(!row||row.target!==p.id)continue;
      const iv=f.invites&&f.invites[p.id];if(row.status==='pending'&&iv&&(iv.vote===undefined?iv.admission==='vote':String(iv.vote)===String(tok))){out.push({key:'a:'+f.id+':'+tok+':consent',grp:'a:'+f.id+':'+tok,day:G.day,hide:true});continue;}   // oy kabul edildi, rıza bekleniyor: karar DAVET kartında; eski "oylamada" kartı kalkar
      const lbl={pending:'oylamada',accepted:'kabul edildi',rejected:'reddedildi',expired:'süresi doldu',invalid:'geçersiz'}[row.status]||row.status;
      out.push({key:'a:'+f.id+':'+tok+':'+row.status,grp:'a:'+f.id+':'+tok,day:Number.isFinite(row.updated)?row.updated:G.day,ico:'🏛',title:'Üyelik başvurun '+lbl+' — '+f.name,sub:String(row.why||'').slice(0,140),fed:f.id});}
    return out;
  },
  /* BETA-EVENT-UX.1: aynı başkan değişimi tek kart; federasyon başkanı (üyeye) ve Konsey başkanı (üyeye). Motor yalnız günlük satırı yazıyordu. */
  instLeaderRows(st){
    const out=[],p=G.p;
    for(const f of G.feds||[]){if(!(f.members||[]).includes(p.id))continue;const was=st.lead.get(f.id);st.lead.set(f.id,f.leader);
      if(was!==undefined&&was!==f.leader&&G.emps[f.leader])out.push({key:'L:'+f.id+':'+f.leader+':'+Math.floor(G.day),day:G.day,ico:'🏛',title:'Federasyon başkanı değişti — '+f.name,sub:'Yeni başkan: '+G.emps[f.leader].name,fed:f.id});}
    const c=G.council,pres=c&&!c.dead?c.president:null,was=st.pres;st.pres=pres;
    if(c&&!c.dead&&(c.members||[]).includes(p.id)&&was!==undefined&&was!==null&&pres!==was&&G.emps[pres])
      out.push({key:'P:'+pres+':'+Math.floor(G.day),day:G.day,ico:'🌐',title:'Konsey başkanlığı değişti',sub:'Yeni başkan: '+G.emps[pres].name+' · '+(c.name||'Galaktik Konsey'),council:true});
    /* yürürlükteki yasanın kalkması (motorda yalnız Koruyucu vetosu; haber üretilmiyordu) — kabul haberleri zaten motorun Konsey kararı haberi */
    const laws=new Set(c&&!c.dead?Object.keys(c.laws||{}).filter(k=>c.laws[k]):[]),wasL=st.claws;st.claws=laws;
    if(wasL&&c&&!c.dead&&(c.members||[]).includes(p.id))for(const k of wasL)if(!laws.has(k))
      out.push({key:'R:'+k+':'+Math.floor(G.day),day:G.day,ico:'🌐',title:'Konsey yasası yürürlükten kalktı',sub:((typeof RESOLUTIONS!=='undefined'&&RESOLUTIONS[k]?.n)||k)+' · '+(c.name||'Galaktik Konsey'),council:true});
    return out;
  },
  /* BETA-EVENT-UX.1: federasyona katılım daveti (doğrudan davet ya da üyelik oyundan sonra adayın ayrı rızası). Kayıt motorun
     DiplomaticInbox'ında zaten vardı ama üst çubukta kart yoktu. Kart G.inbox dışında (Save8 / inboxUid değişmez); KABUL / RET
     tam Gelen kutusu penceresiyle aynı DiplomaticInbox.resolve yolu (misafirde host fedReply). */
  instInviteRows(){
    const out=[],p=G.p;if(!p||typeof findFed==='function'&&findFed(p))return out;
    for(const f of G.feds||[]){const inv=f.invites&&f.invites[p.id];if(!inv||!(inv.expires>G.day))continue;
      out.push({key:'I:'+f.id+':'+inv.expires,rec:'invite:'+f.id+':'+inv.expires,fid:f.id,inv,ico:'🏛',decision:true,title:'FEDERASYON DAVETİ — '+f.name,sub:(inv.admission==='vote'?'Üyelik oyu kabul edildi; katılman için onayın gerekiyor':'Katılım daveti')+' · '+(typeof fedType==='function'?fedType(f).n:'')});}
    return out;
  },
  instInviteRecord(r){
    if(typeof DiplomaticInbox==='undefined')return null;const st=DiplomaticInbox.state();let rec=st.records.find(x=>x.key===r.rec);
    const f=fedOf(r.fid);if(!rec&&f&&G.emps[r.inv.by])DiplomaticInbox.source('invite',r.rec,r.inv.by,f.id,String(r.inv.expires),r.inv.expires,'Federasyona katılım — '+f.name,fedType(f).n+' · '+fedType(f).d);
    rec=st.records.find(x=>x.key===r.rec);return rec&&rec.status==='pending'?rec:null;
  },
  instDecide(x){
    const [id,c]=String(x).split(':'),st=this._instInfo,r=st&&st.dec.find(d=>d.id===id);if(!r||(c!=='y'&&c!=='n'))return;
    if(r.wait){say('Karar gönderildi — yanıt bekleniyor','sci');return;}
    const rec=this.instInviteRecord(r);if(!rec){say('Davet artık geçerli değil','war');this.drawInbox();return;}
    const out=DiplomaticInbox.resolve(rec.id,c==='y','haracguzar',G.emps);if(out.ok&&out.pending)r.wait=true;
    say(out.ok?(out.pending?'Karar gönderildi — yanıt bekleniyor':(c==='y'?'Federasyona katıldın':'Davet reddedildi')):(out.why||'Karar verilemedi'),out.ok?'win':'war');
    this.drawInbox();this.topbar();
  },
  instInfo(){
    if(!G||!G.p)return [];
    const day=G.day,sig=(G.cfg&&G.cfg.seed)+'|'+G.p.name,rows=this.instInfoRows();let st=this._instInfo;
    if(!st||st.sig!==sig||day<st.day-1||day>st.day+400){st=this._instInfo={sig,day,seen:new Set(rows.map(r=>r.key)),live:[],next:st?st.next:1,lead:new Map(),pres:undefined,dec:[]};this.instLeaderRows(st);}
    else{st.day=day;
      for(const r of rows.concat(this.instLeaderRows(st)))if(!st.seen.has(r.key)){st.seen.add(r.key);if(r.grp)st.live=st.live.filter(x=>x.grp!==r.grp);   // aynı başvurunun eski durum kartı yenisiyle değişir
        if(r.day>=day-60&&!r.hide)st.live.push({...r,id:'i'+(st.next++)});}
      st.live=st.live.filter(r=>day-r.day<=60).slice(-3);}
    /* karar kartları: koşul sürdükçe görünür (60 gün kuralı yok); aynı anahtar tek kart, bekleme durumu korunur */
    const inv=this.instInviteRows(),old=new Map((st.dec||[]).map(d=>[d.key,d]));st.dec=inv.map(r=>old.get(r.key)||{...r,id:'i'+(st.next++)});
    return st.dec.concat(st.live);
  },
  instInfoDismiss(id){const st=this._instInfo;if(!st)return false;const n=st.live.length;st.live=st.live.filter(r=>r.id!==String(id));if(st.live.length!==n)this.drawInbox();return st.live.length!==n;},
  instInfoOpen(id){
    const st=this._instInfo,d=st&&st.dec.find(x=>x.id===String(id));if(d){const rec=this.instInviteRecord(d);if(rec&&typeof ArchiveUI!=='undefined'){ArchiveUI.open('inbox');ArchiveUI.record(rec.id);}else this.openFed();return;}
    const r=st&&st.live.find(x=>x.id===String(id));if(!r)return;this.instInfoDismiss(id);
    if(r.council){this.openCouncil();return;}
    if(Number.isInteger(r.news)&&typeof ArchiveUI!=='undefined'&&typeof GalacticNews!=='undefined'&&GalacticNews.get(r.news)){ArchiveUI.open('news');ArchiveUI.detail(r.news);return;}
    if(Number.isInteger(r.fed)&&fedOf(r.fed)){this.openFed();return;}
    if(typeof ArchiveUI!=='undefined')ArchiveUI.open('news');
  },
  /* BETA-EVENT-UX.0 — Konsey oy kartında hızlı EVET / HAYIR. Ayrı karar yolu yok: tam Konsey penceresinin cncYes / cncNo eylemi
     (tek oyunculu ve host'ta castCouncilVote; misafirde aynı eylem councilVote komutuna iner). Kart oylama simgesini (token) çizim anında
     tutar; oylama değiştiyse eski karttan oy gitmez. Oy verilmiş ya da kapanmış oylamanın kartı kutuda kalmaz. */
  cncVoteOpenFor(e=G.p){const c=G.council,v=c&&c.vote;return !!(e&&v&&!v.done&&(c.members||[]).includes(e.id)&&!(v.yes||[]).includes(e.id)&&!(v.no||[]).includes(e.id)&&!(typeof isVassal==='function'&&isVassal(e)&&(c.members||[]).includes(e.overlord)));},
  cncQuick(it){
    if(!this.cncVoteOpenFor())return '';const tok=councilVoteToken(G.council.vote);it._cncToken=tok;
    if(this._councilPending&&this._councilPending.token===tok)return `<div class="nQuick" data-uid="${it.uid}"><span class="nqWait">Oy gönderildi — host yanıtı bekleniyor…</span></div>`;
    return `<div class="nQuick" data-uid="${it.uid}"><button class="nq ok" data-a="noteQuick" data-x="${it.uid}:y">EVET</button><button class="nq no" data-a="noteQuick" data-x="${it.uid}:n">HAYIR</button></div>`;
  },
  noteQuick(it){
    if(this.noteChoiceData(it))return this.noteChoiceMenu(it);
    if(it.kind==='cncvote')return this.cncQuick(it);   // BETA-EVENT-UX.0
    if(!['aideal','pact','invite','fedvote','fedfound'].includes(it.kind))return '';
    const r=this.noteRecord(it);if(!r)return '';
    if(r._mpWait||it.kind==='fedfound'&&this.fedFoundWaiting?.(it.data)||it.kind==='fedvote'&&this.fedVoteWaiting?.(r.fid,r.token))return `<div class="nQuick" data-uid="${it.uid}"><span class="nqWait">Karar gönderildi — yanıt bekleniyor…</span></div>`;
    const v=it.kind==='fedvote';
    return `<div class="nQuick" data-uid="${it.uid}"><button class="nq ok" data-a="noteQuick" data-x="${it.uid}:y">${v?'EVET':'KABUL'}</button>`+
      `<button class="nq no" data-a="noteQuick" data-x="${it.uid}:n">${v?'HAYIR':'REDDET'}</button>`+
      (it.kind==='aideal'?`<button class="nq" data-a="noteQuick" data-x="${it.uid}:c">KARŞI TEKLİF</button>`:'')+'</div>';
  },
  noteQuickAct(x){
    const [u,c]=String(x).split(':'),it=(G.inbox||[]).find(n=>n.uid===+u);if(!it)return;
    if(it.kind==='cncvote'){if(c!=='y'&&c!=='n')return;const tok=it._cncToken,cur=councilVoteToken(G.council?.vote);
      if(!tok||tok!==cur){say('Oylama değişti; Konsey panelinden güncel oylamayı aç','war');this.drawInbox();return;}
      this.act(c==='y'?'cncYes':'cncNo',tok);this.noteResume();this.drawInbox();this.topbar();return;}
    const r=this.noteRecord(it);if(!r){this.openNote(it.uid);return;}
    if(c==='c'){
      if(r.kind!=='aideal')return;const g=DiplomaticInbox.gate(r);
      if(!g.ok){say(g.why||'Karşı teklif hazırlanamaz','war');return;}
      this.aiDealOpen(r.note.data);if(this._hooks&&this._hooks.offCounter)this._hooks.offCounter();return;
    }
    if(c!=='y'&&c!=='n')return;
    const out=DiplomaticInbox.resolve(r.id,c==='y','haracguzar',G.emps);
    say(out.ok?(out.pending?'Karar gönderildi — yanıt bekleniyor':'Diplomatik karar kaydedildi'):(out.why||'Karar verilemedi'),out.ok?'win':'war');
    this.noteResume();this.drawInbox();this.topbar();
  },
  noteSwipe(uid){
    if(/^i\d+$/.test(String(uid)))return this.instInfoDismiss(uid);
    const list=G.inbox||[],i=list.findIndex(n=>n.uid===+uid);if(i<0)return false;
    const it=list[i],dip=typeof DiplomaticInbox!=='undefined'&&DiplomaticInbox.supported(it.kind);
    if(!dip&&!['wardec','warstart','crisend','cncnew'].includes(it.kind)){
      /* MP.7.5: karar bekleyen olay silinmez — kart gizlenir, olay ☰ durum listesinde kalır ve oradan aynı karar penceresiyle açılır
         (pencere kind + data'dan yeniden kurulur; geçici callback yok). Karar değişmez. */
      it.hidden=true;if(G.minNote===it.uid){G.minNote=null;this.topbar();}
      say('Olay gizlendi — karar bekliyor; üstteki ☰ listesinden aç','sci');this.noteResume();this.drawInbox();this.topbar();return true;
    }
    if(it.kind==='fedfound'){if(!this._fedFoundDismissed)this._fedFoundDismissed=new Set();this._fedFoundDismissed.add(it.key);}
    if(dip&&!DiplomaticInbox.capture(it)&&!this.noteRecord(it)){say('Gelen kutusu dolu; bildirim kaldırılmadı','war');this.drawInbox();return false;}
    list.splice(i,1);if(G.minNote===it.uid){G.minNote=null;this.topbar();}
    say(dip?'Bildirim kaldırıldı — karar Gelen kutusunda bekliyor':'Bildirim kaldırıldı');
    this.noteResume();this.drawInbox();return true;
  },
  noteResume(){
    // Kartın duraklattığı oyun, duraklatan başka kart ve açık pencere kalmayınca önceki hıza döner.
    const m=$('modal');if(!this.prePause||G.speed>0||(G.inbox||[]).some(n=>n.pause&&!n.hidden)||m&&m.innerHTML&&!m.classList.contains('hidden'))return;
    const back=this.prePause;this.prePause=0;this.setSpeed(back);
  },
  noteSwipeBind(box){
    if(box._swipe74)return;box._swipe74=true;let st=null;
    const card=e=>e.target.closest&&e.target.closest('.nCard');
    box.addEventListener('pointerdown',e=>{const c=card(e);if(!c||e.button>0)return;st={c,x:e.clientX,y:e.clientY,dx:0,on:false,id:e.pointerId};},{passive:true});
    box.addEventListener('pointermove',e=>{
      if(!st||e.pointerId!==st.id)return;const dx=e.clientX-st.x,dy=e.clientY-st.y;
      if(!st.on){if(Math.abs(dy)>12&&Math.abs(dy)>Math.abs(dx)){st=null;return;}if(Math.abs(dx)<12||Math.abs(dx)<Math.abs(dy)*1.5)return;st.on=true;try{st.c.setPointerCapture(e.pointerId);}catch{}}
      st.dx=dx;st.c.style.transition='none';st.c.style.transform='translateX('+dx+'px)';st.c.style.opacity=String(Math.max(.25,1-Math.abs(dx)/260));
    },{passive:true});
    const end=e=>{
      if(!st||e.pointerId!==st.id)return;const s=st;st=null;if(!s.on)return;box._swipeAt74=Date.now();
      const w=s.c.getBoundingClientRect().width||240,go=Math.abs(s.dx)>=Math.max(80,w*.35);
      s.c.style.transition='transform .18s ease,opacity .18s ease';
      if(go){s.c.style.transform='translateX('+(s.dx>0?w:-w)+'px)';s.c.style.opacity='0';setTimeout(()=>{if(!UI.act('noteSwipe',s.c.dataset.x)){s.c.style.transform='';s.c.style.opacity='';}},170);}
      else{s.c.style.transform='';s.c.style.opacity='';}
    };
    box.addEventListener('pointerup',end);box.addEventListener('pointercancel',end);
    box.addEventListener('click',e=>{if(box._swipeAt74&&Date.now()-box._swipeAt74<400&&card(e)){e.stopPropagation();e.preventDefault();}},true);
  },
  /* END MP.7.4 NOTICES */
  /* MP.7.5: AKTİF SAVAŞLAR — üst ⚔ sayacının saydığı G.p.war listesinin kendisi (yeni savaş motoru yok).
     Sayaç her canlı düşmanı sayar; diplomasi listesi yalnız temas kurulanları gösterir. Burada hepsi görünür:
     temas kurulmamış düşman "Bilinmeyen düşman", kriz / vahşi taraf kendi adıyla (gizli bilgi açılmaz). */
  activeWarsList(){
    const e=G.p,fronts=(G.warLedger&&G.warLedger.fronts||[]).filter(f=>f.ended===null&&f.sides.includes(e.id));
    return G.emps.filter(o=>o&&!o.dead&&o.id!==e.id&&e.war[o.id]).map(o=>{
      const known=!!this.diploKnown(o.id),f=fronts.find(x=>x.sides.includes(o.id)),since=e.warSince&&e.warSince[o.id];
      const camp=f?fronts.filter(x=>x.campaign===f.campaign&&x!==f):[];
      const allies=new Set();for(const x of camp)x.sides.forEach((id,i)=>{if(id!==o.id&&id!==e.id&&x.roles[i]===f.roles[f.sides.indexOf(e.id)])allies.add(id);});
      const pend=typeof DiplomaticInbox!=='undefined'?DiplomaticInbox.state().records.filter(r=>r.status==='pending'&&r.from===o.id&&['peace','sqOffer'].includes(r.kind)).length:0;
      const sq=typeof canStatusQuo==='function'?canStatusQuo(e,o):null;
      return {id:o.id,name:o.crisisSide||o.wild?o.name:known?o.name:'Bilinmeyen düşman',known:known&&!o.wild&&!o.crisisSide,special:!!(o.crisisSide||o.wild),
        cause:known&&e.warCause&&e.warCause[o.id]||'',months:Number.isFinite(since)?Math.max(0,Math.floor((G.day-since)/30)):null,
        mutual:!!o.war[e.id],front:!!f,allies:[...allies].filter(id=>this.diploKnown(id)).map(id=>this.diploName(id)),pend,
        peace:typeof canPeace==='function'?canPeace(e,o):true,sq:sq?(sq.ok?'':sq.why):''};});
  },
  activeWarsOpen(){
    const L=this.activeWarsList(),unknown=L.filter(w=>!w.known&&!w.special).length,fronts=L.filter(w=>w.front).length;
    const row=w=>`<div class="box"><div class="bt"><span>⚔ ${esc(w.name)}</span>${w.pend?`<span class="tag p">${w.pend} barış teklifi</span>`:''}</div>
      <div class="mini">${w.months!==null?w.months+' aydır savaşta':'Süre bilinmiyor'}${w.cause?' · '+esc(w.cause):''}${w.front?' · aktif cephe':' · cephe kaydı yok'}${w.mutual?'':' · tek taraflı savaş durumu'}</div>
      ${w.allies.length?`<div class="mini">Aynı seferdeki ortakların: ${w.allies.map(esc).join(', ')}</div>`:''}
      <div class="mini">${!w.peace?'Barış bu devletle mümkün değil (kan hukuku / sürgün kuralı).':w.sq?'Statüko barışı: '+esc(w.sq):'Statüko barışı koşulları sağlanıyor.'}</div>
      ${w.known?`<div class="act2"><button class="abtn" data-a="activeWarDiplo" data-x="${w.id}">Diplomasi · barış görüşmesi</button></div>`:''}</div>`;
    this.openModal(`<div class="mhd"><span>⚔ AKTİF SAVAŞLAR</span><button class="riX" data-a="closem">✕</button></div>
      <div class="mbd"><div class="row"><span>Savaştığın devlet</span><b>${L.length}</b></div><div class="row"><span>Aktif savaş cephesi</span><b>${fronts}</b></div>
      ${unknown?`<div class="mini">${unknown} düşmanla henüz temas kurulmadı; adları ve ayrıntıları gizli kalır.</div>`:''}
      ${L.length?L.map(row).join(''):'<p>Şu anda savaşta değilsin.</p>'}</div>
      <div class="mft"><button class="ch" data-a="diplomaticInbox">GELEN KUTUSU</button><button class="ch" data-a="closem">KAPAT</button></div>`,'war');
    this._hook('activeWarDiplo',x=>{const id=+x;this.closeModal();if(typeof closeAllGroups==='function')closeAllGroups();this.openDiplo();this.selectDiplo(id,'relation');});
  },
  /* END MP.7.5 WARS */
  /* MP.7.5: DOKUNMATİK MİKTAR DÜĞMELERİ — pencere içindeki her sayı alanının altına (klavye açmadan) artır / azalt / sıfırla / MAKS.
     Yalnız alanın değerini değiştirir ve alanın kendi input/change olaylarını tetikler: onay yine gerçek STARS düğmesiyle. Sınırlar
     alanın min / max özniteliğidir (motorun üst sınırı). Filo bileşimi ±10/±50, diğer miktarlar ±10/±100. */
  stepperize(root){
    if(!root||!root.querySelectorAll)return;
    for(const inp of root.querySelectorAll('input[type="number"]')){
      if(inp.dataset.stepped)continue;inp.dataset.stepped='1';
      if(inp.parentElement&&inp.parentElement.querySelector('button'))continue;   // pencerenin kendi miktar düğmeleri var (ör. anlaşma miktarı ±10 / hazır değerler)
      const fleet=/^fc-/.test(inp.id||''),pct=/^vs/.test(inp.id||''),steps=fleet?[-50,-10,10,50]:pct?[-5,-1,1,5]:[-100,-10,10,100];
      const wrap=document.createElement('div');wrap.className='qtySteps';wrap.setAttribute('role','group');wrap.setAttribute('aria-label','Miktar');
      const mk=(t,fn,label)=>{const b=document.createElement('button');b.type='button';b.className='qtyStep';b.textContent=t;b.setAttribute('aria-label',label||t);
        b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();fn();},true);b.addEventListener('mousedown',e=>e.preventDefault());wrap.appendChild(b);};
      const lim=k=>{const v=parseFloat(inp.getAttribute(k));return Number.isFinite(v)?v:null;};
      const set=v=>{const lo=lim('min'),hi=lim('max');let n=Math.round(v);if(lo!==null)n=Math.max(lo,n);else n=Math.max(0,n);if(hi!==null)n=Math.min(hi,n);
        if(String(n)===inp.value)return;inp.value=String(n);inp.dispatchEvent(new Event('input',{bubbles:true}));inp.dispatchEvent(new Event('change',{bubbles:true}));};
      const cur=()=>{const v=parseFloat(inp.value);return Number.isFinite(v)?v:0;};
      mk('SIFIR',()=>set(lim('min')??0),'Sıfırla');
      for(const d of steps)mk((d>0?'+':'−')+Math.abs(d),()=>set(cur()+d));
      if(lim('max')!==null)mk('MAKS',()=>set(lim('max')),'En yüksek');
      (inp.closest('label')||inp).insertAdjacentElement('afterend',wrap);
    }
  },
  /* END MP.7.5 QTY */
  openNote(uid){
    const list = G.inbox || [];
    const i = list.findIndex(x => x.uid === +uid);
    if (i < 0) return;
    const it = list[i];
    if(G.minNote===it.uid){G.minNote=null;this.topbar();}
    if(typeof DiplomaticInbox!=='undefined'&&DiplomaticInbox.supported(it.kind)&&typeof ArchiveUI!=='undefined'){
      /* BETA-EVENT-UX.1: kuruluş SONUCU yalnız bilgidir (kaydı zaten kapalı); açılınca kart kalkar, kayıt Gelen kutusu geçmişinde kalır.
         Önceden açılsa da çubukta kalıyordu (takılı kart). */
      if(it.kind==='fedfoundResult'){list.splice(i,1);this.drawInbox();}
      const rec=DiplomaticInbox.capture(it);if(rec){ArchiveUI.record(rec.id);return;}
    }
    list.splice(i, 1);
    this._openNote = it;               // geri koyabilmek için sakla
    this.drawInbox();
    switch(it.kind){
      case 'internalrisk': InternalUI.risks();break;
      case 'chain':   this.chainOpen(it.data); break;
      case 'event':   this.eventOpen(it.data); break;
      case 'anomaly': this.anomalyOpen(it.data.a, it.data.sys); break;
      case 'peace':   this.peaceOpen(G.emps[it.data]); break;
      case 'pact':    this.pactOpen(it.data); break;   // FAZ 68
      case 'submit':  this.submitOpen(it.data); break; // FAZ 71
      case 'border':  this.borderOpen(G.emps[it.data.id], it.data.len); break;
      case 'fedagenda': this.fedTab='votes';this.openFed();break;
      case 'fedvote': this.fedVoteOpen(it.data); break;
      case 'wardec':  this.warDecOpen(it.data); break;
      case 'warstart': this.warStartOpen(it.data); break;
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
    if(this.minimizedEvent()&&G.minNote!==it?.uid){say('Önce üst bardaki küçültülmüş olaya dön; mevcut karar açık tutuldu.');return false;}
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
      // Only informational HTML can be restored without rebuilding a typed decision.
      if(!box||box.querySelector('input,select,textarea,canvas')||Array.from(box.querySelectorAll('[data-a]')).some(b=>!['closem','minModal'].includes(b.dataset.a))){say('Bu karar güvenle küçültülemiyor; açık pencereyi kullan.');return false;}
      this._minRawWorld=G.emps;
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
    if (!this.minimizedEvent()){G.minNote=null;G.minRaw=null;this.topbar();return false;}
    if (G.minNote === '_raw' && G.minRaw){
      const r = G.minRaw;
      G.minNote = null; G.minRaw = null;
      this.openModal(r.html.replace(/<button[^>]*data-a="minModal"[^>]*>.*?<\/button>/g,''), r.cls, true);
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

  /* 86D: menü açmak görev atamaz; aynı kapı bütün elçi düğmelerini besler. */
  envoySummary(e,id){
    const st=envoyStatus(e,id);
    if (!st.record) return '';
    return `<div class="mini" style="margin:6px 0">🎓 ${esc(st.task.n)} · ${st.record.months} aktif ay · ${st.rankName}`+
      (st.active ? ` · uygun faydaya en fazla +%${Math.round(st.bonus*100)}` :
        ` · <b>Duraklatıldı: ${esc(st.why)}</b>`) + `</div>`;
  },
  openEnvoyMenu(id){
    const e=G.p, o=G.emps[id];
    if (!e||!o||id===e.id) return;
    const st=envoyStatus(e,id), gate=envoyGate(e,id);
    const room=!!st.record||envoysUsed(e)<envoyCap(e);
    const reason=!gate.ok?gate.why:!room?'Boşta elçin yok — önce bir elçiyi geri çek':'';
    let h=`<div class="mhd"><span>🎓 ELÇİ GÖREVİ · ${esc(o.name)}</span>
      <button class="riX" data-a="closem" aria-label="Kapat">✕</button></div><div class="mbd">`;
    h+=this.envoySummary(e,id);
    h+=`<div class="mini">${Math.max(0,envoyCap(e)-envoysUsed(e))} boşta / ${envoyCap(e)} toplam elçi.
      Atama Etki harcamaz. 12 aktif ayda Kıdemli, 36 aktif ayda Uzman olur.
      Görevi değiştirmek kıdemi sıfırlar. Savaşta görev ve kıdem durur, barışta devam eder.</div>`;
    if (reason) h+=`<div class="mini" style="margin:8px 0;color:#ff9b3d">${esc(reason)}</div>`;
    for (const [task,def] of Object.entries(ENVOY_TASKS)){
      const same=st.record&&st.record.task===task;
      const rank=same?st.rank:0, bonus=def.bonus+rank*def.rankBonus;
      h+=`<button class="abtn ${same?'pri':''}" style="width:100%;margin-top:8px;text-align:left;white-space:normal"
        data-a="envoyTask" data-x="${id}:${task}" ${reason?'disabled':''}>
        <b>${esc(def.n)}${same?' · MEVCUT GÖREV':''}</b><br>
        <span class="mini">İlişki tabanı +${(def.relation*(1+rank*.1)).toFixed(2)}/ay ·
        uygun faydaya +%${Math.round(bonus*100)} (uzmanlıkta +%${Math.round((def.bonus+2*def.rankBonus)*100)})<br>
        ${esc(def.scope)}</span></button>`;
    }
    h+=`<div class="mini" style="margin-top:10px">İlişki kazancı diplomasi yeteneğine göre değişir,
      ilişki iyileştikçe azalır. Karşı tarafa %60'ı yansır. Aktif elçi gözlem katkısı +0,35/aydır;
      karşı istihbarat bunu azaltabilir. Teklif desteği olumlu maddelerin değeri oranında işler;
      iki elçinin katkısı toplanmaz, kabul garantisi vermez.</div></div><div class="mft">`;
    if (st.record) h+=`<button class="ch" data-a="envoyRecall" data-x="${id}">
      <div class="cht">ELÇİYİ GERİ ÇEK</div><div class="chd">Yer açılır; bu görevdeki kıdem silinir.</div></button>`;
    h+=`<button class="ch" data-a="closem"><div class="cht">KAPAT</div></button></div>`;
    const speed=this._envoyMenuSpeed===undefined?G.speed:this._envoyMenuSpeed;
    this.openModal(h,'sci',false);
    this._envoyMenuSpeed=speed;
  },

  openModal(html, cls, stashable, art){
    const modalSurface=$('modal');if(modalSurface._surfaceTimer)clearTimeout(modalSurface._surfaceTimer);modalSurface._surfaceTimer=null;modalSurface._surfacePending=null;modalSurface._surfaceKey=null;modalSurface._surfaceHTML=null;
    this._demolitionToken=null;this._riskDecision=null;
    this._warPreview=null;
    this._amountToken=null;this._jointSendToken=null;
    this._shipCancelPending=null;
    this._shipmentPending=null;
    this._aiDealToken = null;this._archiveToken=null;this._constructionToken=null;
    this._opPending = null;
    delete this._envoyMenuSpeed;
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
    this.stepperize($('modal'));   // MP.7.5: dokunmatik miktar düğmeleri
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
      data-ps="${statePortraitSeed(o)}" data-lk="${o.look||'humanoid'}" data-col="${o.col}"
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
     sözleşme motoru YOK (o ayrı bir faz). 86E: yeterli istihbaratta
     kanonik kabul hesabından kaba eğilim gösterilir; gizli yüzde
     verilmez. Zar yalnız TEKLİFİ GÖNDER'de atılır.
     ═══════════════════════════════════════════════════════════════ */
  vsTermsText(type,t,sub=null){
    const tax=VASSAL_RESOURCES.filter(k=>t.tax[k]>0).map(k=>RES[k].n+' %'+Math.round(t.tax[k]*100)).join(' · ')||'Yok';
    const own=sub&&(sub===G.p||intelOf(G.p,sub.id)>=3),estimate=own?vassalEstimate(sub,t):null;
    return `<div class="mini"><b>Vergi:</b> ${esc(tax)}<br><b>Araştırma:</b> %${Math.round(t.science*100)}<br><b>Koruma:</b> ${t.defense?'Senyör vasalı savunur':'Senyörün otomatik savunma yükümlülüğü yok'}<br><b>Vasalın savaşa katılımı:</b> ${{none:'Zorunlu katılım yok',defense:'Senyöre saldırıldığında savunma',all:'Senyörün bütün savaşları'}[t.war]}<br><b>Diplomasi:</b> ${t.autonomy==='free'?'Bağımsız dış savaş kararı':'Yeni saldırı savaşı için senyörün mevcut cephesi veya federasyon savunma yetkisi gerekir'}<br><b>Süre:</b> ${t.duration?t.duration+' ay; bitişte barışçıl bağımsızlık':'Süresiz'} · <b>Yeniden müzakere:</b> ${t.renegotiate} ay sonra<br><b>Sensörler:</b> ${t.sensors?'Karşılıklı keşif ve yerel sensörler; casus ağı yok':'Paylaşılmaz'}</div>${estimate?'<div class="mini">Mevcut üretim ve stokla aylık aktarım tahmini: '+Object.entries(estimate).filter(([k,n])=>n>0).map(([k,n])=>RES[k].n+' '+fmt(n)).join(' · ')+'. Sabit gelir garantisi değildir; yalnız gerçek stoktan ödenir.</div>':'<div class="mini">Karşı tarafın özel geliri bilinmiyor; aylık tutar gösterilmez.</div>'}`;
  },
  vsContract(sub){
    const c=vassalContractOf(sub);if(!c)return '';
    const lord=overlordOf(sub),other=sub===G.p?lord:sub,ready=G.day>=c.started+c.terms.renegotiate*30;
    return `<section class="box"><div class="bt">YÜRÜRLÜKTEKİ VASALLIK SÖZLEŞMESİ · ${esc(VASSAL_TYPES[c.type].n)}</div><div class="mini">${c.source==='forced'?'Savaşla kazanılmış vasallık: ilişki düşebilir; düşük sadakat tek başına sözleşmeyi sona erdirmez.':'Karşılıklı sözleşme / eski kayıt hükümleri.'} Sadakat ${Math.round(vassalLoyalty(sub))} · bağımsızlık arzusu ${Math.round(sub.vassalAnger||0)}. İlişki ${Math.round(sub.rel[lord.id]||0)}; sadakat güç dengesi, süre ve emirlerden de etkilenir.</div><div class="mini">${esc(sub.name)} → ${esc(lord.name)} · başlangıç gün ${Math.floor(c.started)} · ${c.expires===null?'süresiz':'bitiş gün '+Math.floor(c.expires)}${c.legacy?' · eski kaydın fiilî hükümleri':''}</div>${this.vsTermsText(c.type,c.terms,sub)}<div class="mini">Devam eden savaşlar: ${G.emps.filter(o=>!o.dead&&sub.war[o.id]).map(o=>esc(this.diploName(o.id))).join(', ')||'yok'}. Bağımsız cepheler sözleşmeyle kendiliğinden kapanmaz. ${c.terms.defense?'Koruma yükümlülüğü yeni senyördedir.':'Sözleşmede otomatik koruma yoktur.'}</div><div class="act2"><button class="abtn" data-a="vsOpen" data-x="${other.id}:renew" ${ready?'':'disabled'}>SÖZLEŞMEYİ YENİDEN MÜZAKERE ET</button>${sub===G.p?`<button class="abtn" data-a="vsOpen" data-x="${lord.id}:release">BARIŞÇIL BAĞIMSIZLIK TALEBİ</button><button class="abtn dgr" data-a="revolt">BAĞIMSIZLIK SAVAŞI…</button>`:''}</div><div class="mini">${ready?'Yeniden müzakere hakkı açık':'Yeniden müzakere için '+Math.ceil((c.started+c.terms.renegotiate*30-G.day)/30)+' ay kaldı'}. Yeniden müzakere 60 ◈ · bağımsızlık talebi 40 ◈ · teklif gönderimi aktarımı başlatmaz.</div></section>`;
  },
  vsRead(){
    const v=this.vs;if(!v?.edit||!$('vsClauses'))return;
    const t={tax:{},science:+$('vsScience').value/100,defense:$('vsDefense').value==='yes',war:$('vsWar').value,autonomy:$('vsAutonomy').value,duration:+$('vsDuration').value,renegotiate:+$('vsRenegotiate').value,sensors:$('vsSensors').checked};
    for(const r of VASSAL_RESOURCES)t.tax[r]=+$('vsTax_'+r).value/100;
    v.drafts[v.tur]=t;
  },
  vsDraw(){
    const v=this.vs;if(!v||v.world&&v.world!==G.emps)return;
    const e=G.p,o=G.emps[v.id];if(!o)return;
    v.drafts=v.drafts||Object.fromEntries(Object.keys(VASSAL_TYPES).map(type=>[type,vassalDefaultTerms(type)]));
    const sub=v.yon==='demand'?o:v.yon==='seek'?e:isVassal(e)?e:o,type=v.tur,t=v.drafts[type]||vassalDefaultTerms(type),existing=v.yon==='renew'||v.yon==='release',counter=v.yon==='counter';
    const gate=counter?{ok:true}:existing?{ok:!!vassalContractOf(sub)}:v.yon==='demand'?canDemandVassal(e,o):canSeekProtection(e,o);
    let h=`<div class="mhd"><span>⛓ VASALLIK SÖZLEŞMESİ · ${esc(o.name)}</span><button class="riX" data-a="vsCancel">✕</button></div><div class="mbd" id="vsScroll"><div class="lead">${v.yon==='release'?'Barışçıl bağımsızlık talebi. Kabul edilene kadar mevcut sözleşme sürer.':counter?'Karşı teklif · son sözü karşı taraf söyler.':existing?'Yürürlükteki sözleşmeyi değiştir. Yeni hükümler yalnız karşılıklı kabulde yürürlüğe girer.':v.yon==='demand'?'Bu devletin senyörü olmayı teklif et.':'Bu devletin himayesine girmeyi teklif et.'}</div>`;
    if(!v.edit&&!counter&&v.yon!=='release'){
      for(const [k,T]of Object.entries(VASSAL_TYPES))h+=`<section class="box"><div class="bt">${T.ico} ${esc(T.n)}</div><div class="mini">${esc(T.d)}</div>${this.vsTermsText(k,v.drafts[k],sub)}<button class="abtn ${type===k?'pri':''}" data-a="vsEdit" data-x="${k}">ŞARTLARI DÜZENLE</button><button class="abtn" data-a="vsType" data-x="${k}" aria-pressed="${type===k}">${type===k?'✓ SEÇİLİ':'BU TÜRÜ SEÇ'}</button></section>`;
    }else if(v.yon!=='release'){
      const max=type==='haracguzar'?30:10,maxSci=type==='akademik'?30:10;
      const select=(id,label,options,value)=>`<label class="vsField">${label}<select id="${id}">${options.map(([k,n])=>`<option value="${k}" ${String(value)===String(k)?'selected':''}>${n}</option>`).join('')}</select></label>`;
      h+=`<h3>${esc(VASSAL_TYPES[type].n)} · şartlar</h3><div id="vsClauses">`;
      for(const r of VASSAL_RESOURCES)h+=`<label class="vsField">${RES[r].n} vergisi (%)<input id="vsTax_${r}" type="number" inputmode="decimal" min="0" max="${max}" step="1" value="${Math.round(t.tax[r]*100)}"></label>`;
      h+=`<label class="vsField">Araştırma payı (%)<input id="vsScience" type="number" min="${type==='akademik'?5:0}" max="${maxSci}" step="1" value="${Math.round(t.science*100)}"></label>`;
      h+=select('vsDefense','Senyörün savunma yükümlülüğü',[['yes','Vasala saldırılırsa savunur'],['no','Otomatik savunma yok']],t.defense?'yes':'no');
      h+=select('vsWar','Vasalın savaş yükümlülüğü',[...(type==='bekci'?[]:[['none','Zorunlu katılım yok']]),['defense','Senyörün savunma savaşları'],...(type==='akademik'?[]:[['all','Senyörün bütün savaşları']])],t.war);
      h+=select('vsAutonomy','Diplomatik özerklik',[['free','Bağımsız dış savaş kararı'],['consent','Yeni saldırı savaşları kısıtlı']],t.autonomy);
      h+=select('vsDuration','Sözleşme süresi',[[0,'Süresiz'],[12,'12 ay'],[60,'60 ay'],[120,'120 ay'],[240,'240 ay']],t.duration);
      h+=select('vsRenegotiate','Yeniden müzakere',[[12,'12 ay sonra'],[24,'24 ay sonra'],[60,'60 ay sonra']],t.renegotiate);
      h+=`<label class="vsField">Karşılıklı yerel sensör paylaşımı<input id="vsSensors" type="checkbox" ${t.sensors?'checked':''}></label></div><details><summary>Seçilen hükümler ve aylık tahmin</summary>${this.vsTermsText(type,t,sub)}</details><button class="abtn" data-a="vsBack">TÜRLERE DÖN · TASLAĞI SAKLA</button>`;
    }
    if(v.yon==='release')h+=this.vsContract(sub);
    const cost=counter?20:v.yon==='demand'?160:v.yon==='seek'?90:v.yon==='release'?40:60;
    h+=`<p class="mini">${cost} ◈ görüşme bedeli · en fazla 3 tur · her tur 180 gün · kapanıştan sonra 12 ay soğuma. Ret ve süre sonunda görüşme bedeli geri verilmez; uygulanamayan işlem geri alınır. Mevcut savaşlar sözleşme değişince kendiliğinden sona ermez.</p>${!gate.ok?'<p class="mini n">'+esc(intelOf(e,o.id)<3&&gate.why?.startsWith('Yeterince güçlü değilsin (')?'Güç üstünlüğü koşulu sağlanmıyor':gate.why||'Sözleşme bağı yok')+'</p>':''}<div id="vsError" role="status"></div></div><div class="mft"><button class="ch" data-a="vsCancel">VAZGEÇ</button><button class="ch" data-a="vsSend" ${gate.ok?'':'disabled'}>${counter?'KARŞI TEKLİFİ GÖNDER':'TEKLİFİ GÖNDER'} · ${cost} ◈</button></div>`;
    this.openModal(h,'sci',false);
  },
  vsRecord(subId,recordId=null){
    const sub=G.emps[subId],record=recordId&&DiplomaticInbox.get(recordId),ref=record?.token?.split(':').slice(0,-1).join(':'),q=ref&&sub?.vassalTalk?.id!==ref?sub?.vassalTalkHistory?.find(q=>q.id===ref):sub?.vassalTalk;if(!q||![q.lord,q.sub].includes(G.p.id))return;
    const token={world:G.emps,id:q.id,round:q.round,sub:subId};this._vsRecord=token;
    const archived=!!record&&(record.token!==q.id+':'+q.round||q!==sub.vassalTalk);
    const gate=vassalTalkValid(q),can=!archived&&q.status==='pending'&&q.to===G.p.id&&gate.ok;
    let h=`<div class="mhd"><span>VASALLIK MÜZAKERESİ · ${esc(DiplomaticInbox.states[q.status]||q.status)}</span><button class="riX" data-a="closem">✕</button></div><div class="mbd">${archived?'<p class="mini">Tamamlanan tur / tarihsel müzakere. Aşağıdaki hükümler son kayıtlı turu gösterir; bu ekrandan karar verilmez.</p>':''}<h3>${q.kind==='release'?'Barışçıl bağımsızlık':esc(VASSAL_TYPES[q.type].n)}</h3><div class="mini">Teklifte tarafların bildirdiği mevcut cepheler: ${Object.entries(q.disclosedWars||{}).map(([id,fronts])=>esc(this.diploName(+id))+': '+(fronts.map(id=>esc(this.diploName(id))).join(', ')||'yok')).join(' · ')}. Yeni savaşlar mevcut yetkilendirmeden geçer.</div><div class="mini">Tur ${q.round}/3 · son gün ${Math.floor(q.expires)} · ${q.from===G.p.id?'Karşı tarafın yanıtı bekleniyor':'Sana gönderildi'}</div>${q.kind==='release'?'<p>Yalnız kabul edilirse vasallık barışçıl sona erer; savaş başlatılmaz.</p>':this.vsTermsText(q.type,q.terms,sub)}<details><summary>Müzakere kararları ve gerçek bedeller</summary>${q.history.map(r=>'<p class="mini">Gün '+Math.floor(r.day)+' · '+esc(G.emps[r.by]?.name||'Tarihsel taraf')+' · '+esc(r.action)+' · '+esc(r.why)+'</p>').join('')}<p class="mini">Ödenen görüşme bedelleri: ${Object.entries(q.paid).map(([id,n])=>esc(G.emps[id]?.name||id)+' '+n+' ◈').join(' · ')}</p></details><p>${esc(q.why||gate.why||'Şartlar karşılıklı onay bekliyor')}</p>${q.status==='accepted'&&isVassal(sub)?this.vsContract(sub):''}</div><div class="mft">${can?`<button class="ch" data-a="vsReply" data-x="accept">KABUL ET</button><button class="ch" data-a="vsReply" data-x="reject">REDDET</button><button class="ch" data-a="vsCounter" ${q.round<3?'':'disabled'}>KARŞI TEKLİF HAZIRLA</button>`:''}<button class="ch" data-a="diplomaticInbox">GELEN KUTUSU</button></div>`;
    this.openModal(h,'sci',false);this._vsRecord=token;
  },

  closeModal(){
    const modalSurface=$('modal');if(modalSurface._surfaceTimer)clearTimeout(modalSurface._surfaceTimer);modalSurface._surfaceTimer=null;modalSurface._surfacePending=null;modalSurface._surfaceKey=null;modalSurface._surfaceHTML=null;
    this._demolitionToken=null;this._riskDecision=null;
    this._warPreview=null;
    this._amountToken=null;this._jointSendToken=null;
    // 94D.1: acknowledged war/retired incident cards must not be saved as still open.
    if(this._openNote&&['warstart','wardec','border','criswarn','crisis','crisend','cncnew'].includes(this._openNote.kind))this._openNote=null;
    const shipCancelSpeed=this._shipCancelPending&&this._shipCancelPending.speed;
    const shipmentSpeed=this._shipmentPending&&this._shipmentPending.speed;
    const compositionSpeed=this._compositionPending&&this._compositionPending.speed;
    this._compositionPending=null;
    this._shipCancelPending=null;
    this._shipmentPending=null;
    this._aiDealToken = null;this._archiveToken=null;this._constructionToken=null;
    this._opPending = null;
    const envoySpeed=this._envoyMenuSpeed;
    delete this._envoyMenuSpeed;
    $('modal').className = 'hidden';
    $('modal').innerHTML = '';
    if (G.over) return;
    const back = shipCancelSpeed!==null && shipCancelSpeed!==undefined ? shipCancelSpeed
      : compositionSpeed!==null && compositionSpeed!==undefined ? compositionSpeed
      : shipmentSpeed!==null && shipmentSpeed!==undefined ? shipmentSpeed
      : envoySpeed===undefined ? (this.prePause || (Number.isFinite(this.modalPrevSpeed)?this.modalPrevSpeed:1)) : envoySpeed;
    this.prePause = 0;
    this.setSpeed(back);
  },
  anomalyOpen(a, sys){
    const note=this._openNote,world=G.emps;let resolved=false;
    this._an = {a, sys};
    this.openModal(
      `<div class="mhd"><span>ANOMALİ · ${esc(sys.name)}</span></div>
       <div class="mbd"><div class="lead">${a.t}</div><b>${a.n}</b></div>
       <div class="mft">${a.ch.map((c,i)=>
         `<button class="ch" data-a="anomch" data-x="${i}"><div class="cht">${c.t}</div><div class="chd">${esc(this.choiceExplanation(c))}</div></button>`
       ).join('')}</div>`, 'sci', true);
    this._hook('anomch', i=>{const r=this.applyEventChoice(note,i,world);if(!r.ok)say(r.why,'war');});
  },
  /* olay metnindeki {KOLONI} {SISTEM} {IRK} yer tutucularını doldur
     ve olayın geçtiği yeri haritada göstermek için hedef sakla */
  fillEventText(txt){
    const e = G.p;
    this.evTarget = null;
    const metin = String(txt);
    const cosmetic=mulberry32(identityHash('event-text:'+G.seed+':'+(this._openNote?.key||'')+':'+(this._openNote?.born??G.day)+':'+metin));
    /* FAZ 12 DÜZELTMESİ: "Haritada Göster" metinde ADI GEÇEN yeri
       odaklamalı. Eskiden hedef daima rastgele bir KOLONİ sistemiydi;
       olay "{SISTEM}" anlatıyorsa buton bambaşka bir yere götürüyordu.
       Artık hangi yer adı kullanıldıysa hedef odur. */
    let colName = 'Bir', colSys = -1;
    if (e.colonies.length){
      const c = e.colonies[Math.floor(cosmetic()*e.colonies.length)];
      const pl = G.sys[c.s].planets[c.p];
      if (pl.col){ colName = pl.col.name || pl.name; colSys = c.s; }
    }
    let sysName = '—', namedSys = -1;
    const seen = G.sys.filter(sy => sy.seen.includes(0));
    if (seen.length){
      const sy = seen[Math.floor(cosmetic()*seen.length)];
      sysName = sy.name; namedSys = sy.id;
    }
    /* Öncelik: metin bir SİSTEM adı geçiriyorsa o, yoksa koloni */
    let sysId = metin.indexOf('{SISTEM}') >= 0 ? namedSys
              : metin.indexOf('{KOLONI}') >= 0 ? colSys
              : (colSys >= 0 ? colSys : namedSys);
    if (sysId < 0) sysId = (colSys >= 0 ? colSys : namedSys);
    let raceName = '—';
    const known = G.emps.filter(o=>!o.dead && !o.wild && o.id!==0 && e.contact[o.id]);
    if (known.length) raceName = known[Math.floor(cosmetic()*known.length)].name;
    this.evTarget = sysId;
    return metin
      .replace(/\{KOLONI\}/g, colName)
      .replace(/\{SISTEM\}/g, sysName)
      .replace(/\{IRK\}/g, raceName);
  },

  /* zincirleme hikâye olayı — seçim sonraki bölümü açabilir */
  chainOpen(id){
    const note=this._openNote,world=G.emps;let resolved=false;
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
          <div class="chd">${esc(this.choiceExplanation(c))}</div></button>`
       ).join('')}</div>`, 'sci', true);
    this._hook('chch', i=>{const r=this.applyEventChoice(note,i,world);if(!r.ok)say(r.why,'war');});
  },
  eventOpen(ev){
    const note=this._openNote,world=G.emps;let resolved=false;
    const body = this.fillEventText(ev.t);
    const tgt = this.evTarget;
    this.openModal(
      `<div class="mhd"><span>OLAY</span></div>
       <div class="mbd"><div class="lead">${body}</div><b>${ev.n}</b>
       ${tgt >= 0 ? `<button class="abtn" data-a="showEv" data-x="${tgt}" style="margin-top:8px">
         🔍 HARİTADA GÖSTER</button>` : ''}</div>
       <div class="mft">${ev.ch.map((c,i)=>
         `<button class="ch" data-a="evch" data-x="${i}"><div class="cht">${c.t}</div><div class="chd">${esc(this.choiceExplanation(c))}</div></button>`
       ).join('')}</div>`, '', true);
    this._hook('evch', i=>{const r=this.applyEventChoice(note,i,world);if(!r.ok)say(r.why,'war');});
  },
  borderOpen(other, len){
    // Old Save v8 notes can still be opened, but cannot grant/spend resources or alter relations.
    this.openModal(`<div class="mhd"><span>ESKİ SINIR BİLDİRİMİ</span></div>
      <div class="mbd">Rastgele sınır olayı kaldırıldı. Bu eski bildirim artık karar veya kaynak etkisi oluşturmaz.</div>
      <div class="mft"><button class="ch" data-a="closem"><div class="cht">Kapat</div></button></div>`);
  },
  /* ═══ FAZ 68: AI PAKT TEKLİFİ ═══ */
  /* ═══ FAZ 71: SIĞINMA TALEBİ ═══ */
  submitOpen(d){
    if (!d) return;
    const o = G.emps[d.from];
    const teh = G.emps[d.tehdit];
    if (!o || o.dead) return;
    const access=aiProtection(o,G.p);
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
        <div class="mini">${esc(access.why)}${access.ok?' · Tahmini yardım: '+Math.ceil(access.eta)+' gün':''}</div>
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
        const legal=aiProtection(o,G.p);
        if(!legal.ok||isVassal(o)||!(o.res.etk>=VASSAL_SEEK_COST)){say(legal.why||'Sığınma koşulları değişti','war');this.closeModal();return;}
        if(typeof subjugate!=='function'||!subjugate(G.p,o,t)){say('Sığınma artık geçerli değil','war');this.closeModal();return;}
        o.res.etk-=VASSAL_SEEK_COST;
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
      this.surfaceReplace(pane0,`<div class="dpBox">
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
        </div></div></div>`,'market');
      pane0.classList.add('show');
      return;
    }
    /* FAZ 73: Arındırıcılar pazara giremez */
    if (typeof isPurifier === 'function' && isPurifier(e)){
      const pane = $('diploPane');
      this.surfaceReplace(pane,`<div class="dpBox">
        <div class="dpHd"><span>☣ PAZAR KAPALI</span>
          <button class="riX" data-a="closeMarket">✕</button></div>
        <div class="dpBody"><div class="box" style="border-color:#8b7bff">
          <div class="bt"><span>Fanatik Arındırıcılar</span></div>
          <div class="bd">Galaktik Piyasa yabancılarla alışveriş demektir.
            Doktrinin buna izin vermiyor — ihtiyacın olanı üretir ya da
            alırsın.</div></div></div></div>`,'market');
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
    this.surfaceReplace(pane,h,'market');
    pane.classList.add('show');
  },
  confirmSaveLoad(txt, kaynak){
    const q = inspectSaveText(txt);
    if (!q.ok){
      say((kaynak === 'cihaz' ? 'Cihazdaki kayıt' : 'Dosya') +
          ' geçerli bir kayıt değil — açık oyun korunuyor', 'war');
      return false;
    }
    this._pendingSaveLoad = {txt, kaynak:kaynak || 'dosya'};
    const mevcut = (G && G.p && G.sys && G.sys.length)
      ? `${esc(G.p.name || 'Hanedan')} · ${G.year}.${String(G.month).padStart(2,'0')}`
      : 'açık oyun yok';
    this.openModal(`<div class="mhd"><span>KAYDI YÜKLE</span></div>
      <div class="mbd"><div class="box"><div class="bt"><span>Seçilen kayıt</span>
        <b>${esc(q.name)}</b></div><div class="bd">Yıl ${q.year}.${String(q.month).padStart(2,'0')}</div></div>
        <div class="mini" style="margin-top:10px">Mevcut oyun: ${mevcut}<br>
        Onaylarsan açık dünya seçilen kayıtla değiştirilir.</div></div>
      <div class="mft"><button class="ch" data-a="loadConfirm"><div class="cht">YÜKLE</div></button>
      <button class="ch" data-a="save"><div class="cht">VAZGEÇ</div></button></div>`);
    this._hook('loadConfirm', async ()=>{
      if (this._loadApplying || !this._pendingSaveLoad) return;
      this._loadApplying = true;
      const p = this._pendingSaveLoad;
      this._pendingSaveLoad = null;
      try {
        let ok = false;
        try { ok = deserialize(p.txt); } catch(e){ ok = false; }
        if (!ok){
          say('Kayıt uygulanamadı', 'war');
          this.saveMenu(); return;
        }
        const durable=await storeSet('yildiz:save', p.txt);
        this.closeModal(); this.refresh();
        say(p.kaynak === 'cihaz' ? 'Kayıt cihazdan yüklendi'
          : 'Kayıt dosyadan yüklendi', 'win');
        if(!durable)say('Yüklendi; kalıcı kopya yazılamadı. Dosya / metin yedeğini koru.','war');
      } finally { this._loadApplying = false; }
    });
    return true;
  },
  saveMenu(){
    this._pendingSaveLoad = null;
    const auto = G.autoSave !== false;
    this.openModal(
      `<div class="mhd"><span>KAYIT VE AYARLAR</span>
         <button class="riX" data-a="diagShow" title="Tanılama">🩺</button>
         <button class="riX" data-a="closem">✕</button></div>
       <div class="mbd" style="padding:4px 16px"><button class="abtn" data-a="cameraReset">Kamerayı sıfırla</button></div>
       <div class="mbd" style="padding:4px 16px"><button class="abtn" data-a="warPauseToggle" aria-pressed="${WAR_PAUSE_ON}">Savaşa katılınca duraklat: ${WAR_PAUSE_ON?'AÇIK':'KAPALI'}</button></div>
       <div class="mbd alertOpacity"><label for="alertOpacity">Geçici bildirim opaklığı</label><output for="alertOpacity" id="alertOpacityValue"></output>
         <input id="alertOpacity" type="range" min="25" max="100" step="5"></div>
       <div class="mbd">${typeof AUDIO!=='undefined'?AUDIO.controls():''}</div>
       <div class="mbd" id="diagBox">Depolama sınanıyor…</div>
       <div class="mft">
        <button class="ch" data-a="mute"><div class="cht">${
          AUDIO_OFF ? '🔇 Ses kapalı' : '🔊 Ses açık'}</div>
          <div class="chd">Ana sesi kapatır; müzik ve efekt tercihleri yukarıda ayrı ayarlanır.</div></button>
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

    this.bindAlertOpacity?.();

    /* MP.8.9: local presentation controls; hooks remain visible to the guest gate. */
    if(this.uiScaleControls){
      this.uiScaleControls();
      this._hook('uiScaleDown',()=>this.stepUIScale(-1));
      this._hook('uiScaleUp',()=>this.stepUIScale(1));
      this._hook('uiScaleReset',()=>this.setUIScale(100));
    }
    /* END MP.8.9 SAVE CONTROLS */
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
      uploadSave((txt, durum)=>{
        if (durum === 'cancel') return;
        if (durum !== 'ok'){
          say('Dosya okunamadı — açık oyun korunuyor', 'war'); return;
        }
        this.confirmSaveLoad(txt, 'dosya');
      });
    });
    this._hook('autotog', ()=>{ G.autoSave = !(G.autoSave !== false); this.saveMenu(); });
    this._hook('dosave', ()=>{ saveGame().then(ok=>{
      this.openModal(`<div class="mhd"><span>KAYIT</span></div><div class="mbd">${ok?'Oyun kalıcı depolamaya kaydedildi.':'Kalıcı kayıt başarısız — bu deneme yalnız oturum belleğinde tutuldu. Önceki kalıcı kayıt varsa korunur. Depolama engellenmiş veya kota dolmuş olabilir.'}
        <div class="mini" style="margin-top:8px">Kalıcı olduğundan emin olmak için "Dosyaya kaydet"i kullan.</div></div>
      <div class="mft"><button class="ch" data-a="closem"><div class="cht">Kapat</div></button></div>`);
    }); });
    this._hook('doload', async ()=>{
      let txt = null;
      try { txt = await storeGet('yildiz:save'); } catch(e){}
      if (txt){ this.confirmSaveLoad(txt, 'cihaz'); return; }
      this.openModal(`<div class="mhd"><span>KAYIT</span></div><div class="mbd">Kayıt bulunamadı.</div>
      <div class="mft"><button class="ch" data-a="closem"><div class="cht">Kapat</div></button></div>`);
    });
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
      this._hook('applyimp', async ()=>{
        const b = $('impBox');
        const txt = b ? b.value.trim() : '';
        let ok = false;
        try { ok = txt && deserialize(txt); } catch(e){ ok = false; }
        if (ok){ const durable=await storeSet('yildiz:save', txt); this.closeModal(); this.refresh(); say(durable?'Yedek yüklendi ve kalıcı kopyası yazıldı':'Yedek oturuma yüklendi; kalıcı kayıt başarısız. Metin yedeğini koru.', durable?'win':'war'); }
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
        if (!el || el.disabled) return;
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

  /* One painter for governors, admirals and the leaders list. Mark complete
     only after pixels were drawn; failed contexts can be retried. */
  paintLeaderPortraits(){
    for (const cv of document.querySelectorAll('canvas.ldrPort')){
      const d = cv.dataset;
      const key = [d.ldr, d.lk, d.col, d.rank, cv.width, cv.height].join('|');
      if (d.done && cv._leaderPortraitKey === key) continue;
      try {
        const g = cv.getContext('2d');
        if (!g || !(cv.width > 0 && cv.height > 0) ||
            (typeof g.isContextLost === 'function' && g.isContextLost())) continue;
        const spr = ART.leaderPortrait({seed:+d.ldr, look:d.lk, col:d.col,
          rank:+(d.rank || 0), scale:3});
        const sc = Math.min(cv.width/spr.width, cv.height/spr.height) * .92;
        g.imageSmoothingEnabled = false;
        g.clearRect(0, 0, cv.width, cv.height);
        g.drawImage(spr, (cv.width-spr.width*sc)/2, (cv.height-spr.height*sc)/2,
          spr.width*sc, spr.height*sc);
        cv._leaderPortraitKey = key;
        d.done = '1';
        delete cv._leaderPortraitError;
      } catch(err){
        delete d.done;
        if (!cv._leaderPortraitError){
          cv._leaderPortraitError = true;
          logDiag('portrait', String(err && err.message || err));
        }
      }
    }
  },

  /* gezegen küçük resimlerini panelde çiz */
  paintSprites(){
    this.paintLeaderPortraits();
    const pc = $('empPortrait');
    if (pc && !pc.dataset.done){
      pc.dataset.done = 1;
      const g = pc.getContext('2d');
      g.imageSmoothingEnabled = false;
      const spr = ART.portraitFull({look:G.p.look||'humanoid',col:G.p.col,seed:statePortraitSeed(G.p),scale:3});
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
          look: cv.dataset.lk || 'humanoid', seed:+cv.dataset.ps||0,
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

function setupHumanSlots(){return window.MP7Setup?.active&&window.MP7Setup.role==='host'?(window.MP1Host?.lobby?.capacity||1):1;}
function setupSelectionError(c){
 const why=setupConfigError(c);if(why)return why;
 const humans=setupHumanSlots();
 if(humans>1&&aiCountFor(c)+humans>49)return 'Bu oturumda en fazla '+(49-humans)+' AI seçilebilir; insanlarla birlikte en fazla 49 normal devlet.';
 if(aiCountFor(c)+humans>SIZES[c.size].sys)return 'Seçilen galaksi bu kadar devleti güvenli yerleştirmek için çok küçük. Yıldız sayısını artır veya AI sayısını azalt.';
 return '';
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
          title="Seçtiğin doktrine uygun iki kelimeli ad üret">🎲</button>
      </div>
      <div id="setupNameStatus" class="mini" role="status" aria-live="polite">${esc(SETUP_NAMING.warning)}</div>
      <div class="mini">Önce doktrinini seç. Zar, özgün bir kök ve uygun devlet unvanı üretir; doktrin değişikliği mevcut adını değiştirmez.</div>
    </div>

    <div class="sect"><h2>DOKTRİN</h2>
      <div class="mini" style="margin-bottom:8px">Mizaç, halkının dünyaya bakışıdır.
      Kin tutma hızını, savaş eşiğini, konseydeki duruşunu ve yüzünü belirler.
      Sonradan ideoloji reformuyla değiştirilebilir — ama bedeli ağırdır.</div>
      <div class="grid g2">`;
    for (const k in PERSONAS){
      const P = PERSONAS[k];
      const on = (SETUP_NAMING.selected === k && c.mizac === k);
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
      h += `<button class="opt ${on?'on':''}" data-a="mizacSet" data-x="${k}" aria-pressed="${on}">${P.ico} ${P.n}
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
      <div class="mini" style="margin-bottom:8px">Tür silueti, yüz ve kıyafet varyasyonu devletinin kimliğini oluşturur.
      Dostane, nötr ve düşman çerçeveleri aynı kimliği korur.</div>`;

    /* önizleme: dost · nötr · düşman */
    h += `<div class="grid g3" style="margin-bottom:10px">`;
    [[60,'DOSTANE'],[0,'NÖTR'],[-60,'DÜŞMAN']].forEach(pair=>{
      h += `<div style="text-align:center">
        <canvas class="setPort" data-ps="${statePortraitSeed({id:0,look:c.look,portraitVariant:normalizePortraitVariant(c.portraitVariant)})}" data-lk="${c.look||'humanoid'}" data-pers="${pk}"
          data-mood="${pair[0]}" width="72" height="98"></canvas>
        <div class="mini">${pair[1]}</div></div>`;
    });
    h += `</div>`;

    h += `<div class="portraitVariation96d"><span>Portre varyasyonu <b id="portraitVariantValue">${normalizePortraitVariant(c.portraitVariant)+1}</b>/256</span><button class="abtn" data-a="portraitVariant" data-x="-1" aria-label="Önceki portre varyasyonu">◂</button><button class="abtn" data-a="portraitVariant" data-x="1" aria-label="Sonraki portre varyasyonu">▸</button></div><div class="mini">Yalnız görünüş değişir; devletin mekaniği ve oyun tohumu değişmez.</div>`;
    h += `<div class="ph">TÜR SİLUETİ</div><div class="grid g3">`;
    for (const k in LOOKS){
      const on = (c.look === k);
      h += `<button class="opt ${on?'on':''}" data-a="look" data-x="${k}">${LOOKS[k].n}
        <small>${LOOKS[k].d}</small></button>`;
    }
    h += `</div>`;

    h += `<div class="ph">RENK</div><div class="grid g4">`;
    EMP_COLORS.forEach((col,index)=>{
      const on = (c.color === col);
      h += `<button class="opt ${on?'on':''}" data-a="color" data-x="${encodeURIComponent(col)}" aria-label="Devlet rengi ${index+1}: ${col}" title="${col}"
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
    const gercekKalan = TRAIT_BUDGET - spent;

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
      const chk = on ? {ok:true} : canPickTrait(c.traits, k,c);
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
    h += `<div class="mini">Devlet amblemini GÖRÜNÜŞ sekmesinde şekil, sembol, desen ve renkleriyle düzenle.</div>`;
  }

  if(SETUP_STEP==='goruns'){
    const em=normalizeEmblem(c.emblem,c.color||RACES[c.race].col,'setup');
    h+=`<div class="sect emblemEditor"><h2>DEVLET AMBLEMİ</h2><div class="emblemPreview"><canvas data-identity="setup" width="80" height="80" aria-label="Amblem önizlemesi"></canvas><button class="btn" data-a="randomEmblem">🎲 RASTGELE AMBLEM</button></div><div class="emblemFields">`;
    for(const [key,label,pool] of [['shape','Ana şekil',EMBLEM_SHAPES],['symbol','İç sembol',EMBLEM_SYMBOLS],['pattern','Desen',EMBLEM_PATTERNS]])h+=`<label>${label}<select data-emblem-field="${key}">${Object.entries(pool).map(([k,n])=>`<option value="${k}" ${em[key]===k?'selected':''}>${n}</option>`).join('')}</select></label>`;
    for(const [key,label] of [['primary','Ana renk'],['secondary','İkincil renk']])h+=`<label>${label}<input type="color" data-emblem-field="${key}" value="${em[key]}"></label>`;
    h+=`</div><div class="mini">Ana renk devletin siyasi rengidir. Rastgele düğmesi şekil, sembol, desen ve iki rengi birlikte değiştirir. Seçimin yeni oyuna ve kayda aktarılır.</div></div>`;
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
      const chk = on ? {ok:true} : canPickCivic(c.civics, k,c);
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
        <div class="cd">${esc(o.d)}</div><small>${esc(o.difficulty)}</small></button>`;
    }
    const detail=ORIGINS[c.origin]||ORIGINS.standart;
    h += `</div><article class="originDetails96d" id="originDetails"><h3>${detail.ico} ${esc(detail.n)}</h3><p>${esc(detail.story)}</p><div class="mini">${esc(detail.style)} · <b>${esc(detail.difficulty)}</b></div><div class="originColumns"><div><b>Avantajlar</b><ul>${detail.pros.map(t=>`<li>${esc(t)}</li>`).join('')}</ul></div><div><b>Dezavantajlar</b><ul>${detail.cons.map(t=>`<li>${esc(t)}</li>`).join('')}</ul></div></div><p class="mini">${esc(detail.special)}</p><details><summary>Gerçek başlangıç dökümü</summary><p class="mini">${esc(originEffectText({origin:c.origin}))}</p></details></article></div>`;
  }

  /* ================= 5. GALAKSİ ================= */
  if (SETUP_STEP === 'galaksi'){
    /* ═══ FAZ 53: GALAKSİ ÖZELLİK ANAHTARLARI ═══ */
    h += `<div class="sect"><h2>🌌 GALAKSİ ÖZELLİKLERİ</h2>
      <div class="mini">Bu anahtarlar galaksinin karakterini belirler.
        Her ayar yalnız aşağıda belirtilen sistemi etkiler; savaş, diplomasi ve diğer tehditler kendi kurallarıyla sürer.</div>`;
    const tog = (etiket, aciklama, alan, acikMi) => `
      <button class="opt ${acikMi?'on':''}" data-a="${alan}">
        ${etiket}<small>${aciklama} — <b>${acikMi?'AÇIK':'KAPALI'}</b></small></button>`;
    h += `<div class="grid g2">`;
    h += tog('AI Devletlerine Rastgele Köken', 'AI kökenleri dengeli havuzdan seçilir. Altın Çağ gibi aşırı güçlü başlangıçlar rastgele dağıtılmaz.', 'togAIOrigins', c.aiOrigins !== false);
    h += tog('☠ Korsan Tehdidi', 'Korsan yuvaları, filoları ve baskınları. Kapalıyken kalıntılar, canavarlar ve ayrı kriz ayarı etkilenmez',
             'togPirate', c.pirates !== false);
    h += tog('🌀 Yıldız Kapıları', 'Hazır ağ vermez. Açıkken devletler kapı inşa edebilir; izinli kapılar hızlı ulaşım ve ikmal sağlar. Kapalıyken yeni inşa ve kullanım yok',
             'togGate', c.gates !== false);
    h += tog('🎲 Rastgele Olaylar',
      'Maden kazası, salgın, tesadüfi hikâye zincirleri ve galaktik çalkantılar; diplomasi, casusluk, savaş ve keşif devam eder',
      'togRandomEvents', c.randomEvents !== false);
    h+='</div><div class="mini">AI özel köken ihtimali · '+(c.aiOrigins===false?'Kapalı':aiOriginChance(c)+'%')+'</div><div class="grid g2">';
    for(const [chance,label]of [[20,'Düşük'],[35,'Normal'],[60,'Yüksek'],[100,'Her devlet']])h+=`<button class="opt ${aiOriginChance(c)===chance?'on':''}" data-a="aiOriginChance" data-x="${chance}" ${c.aiOrigins===false?'disabled':''}>${label} · %${chance}</button>`;
    h += `</div>`;
    h += `<div class="ph">☣ KRİZ ŞİDDETİ</div><div class="grid g3">`;
    [['kapali','KAPALI','Hiçlik Sürüsü hiç gelmez'],
     ['normal','NORMAL ×1','Dengeli kıyamet'],
     ['acimasiz','ACIMASIZ ×2','Dalga gücü bütçesi ×2; gemi sınırları korunur']].forEach(k => {
      const on = (c.crisisPower || 'normal') === k[0];
      h += `<button class="opt ${on?'on':''}" data-a="crisisPower" data-x="${k[0]}">
        ${k[1]}<small>${k[2]}</small></button>`;
    });
    h += `</div><div class="mini">Şiddet veya zamanlama KAPALI ise yeni kriz başlamaz. Zamanlama yeniden açılırsa kapalı şiddet NORMAL olur. Özel AI köken zarları bağımsızdır; oyuncunun kökeni değişmez.</div></div>`;
    const count=SIZES[c.size]?.sys||0,steps=availableGalaxySteps(),idx=steps.indexOf(count),mpHumans=setupHumanSlots()>1?setupHumanSlots():0;
    h += `<div class="sect"><h2>YILDIZ SİSTEMİ SAYISI</h2><div class="btnrow"><button class="btn" data-a="sizeStep" data-x="-1" ${idx<=0?'disabled':''}>−</button><b id="systemCountValue" style="font-size:26px;min-width:80px;text-align:center">${count}</b><button class="btn" data-a="sizeStep" data-x="1" ${idx>=steps.length-1?'disabled':''}>+</button></div><div class="grid g4">`;
    for(const n of [30,45,60,80,100,200,300,500,1000]){const k=setupSizeKey(n),v=SIZES[k];h+=`<button class="opt ${c.size===k?'on':''}" data-a="size" data-x="${k}" ${v.available===false?'disabled':''}>${n}<small>${v.available===false?'Deneysel · kabul edilmedi':'sistem'}</small></button>`;}
    h+=`</div>${count>100?'<div class="mini">Büyük PC galaksisi: ay hesabı saniyeler sürebilir; 240 aylık kabul ve fiziksel cihaz performansı henüz doğrulanmadı.</div>':''}<div class="mini">📱 Android için önerilen: yaklaşık 100 yıldız sistemi ve en fazla 9 AI devleti. Daha büyük galaksiler PC için önerilir. Performans cihazın gücüne göre değişebilir.</div>`;
    h += `<h2>AI DEVLET SAYISI</h2><div class="btnrow"><button class="btn" data-a="aiCount" data-x="-1" ${aiCountFor(c)<=1?'disabled':''} aria-label="AI sayısını azalt">−</button><b id="aiCountValue" style="font-size:22px;min-width:90px;text-align:center">${aiCountFor(c)} AI</b><button class="btn" data-a="aiCount" data-x="1" ${aiCountFor(c)>=SCALE_ACCEPTANCE.maxAI?'disabled':''} aria-label="AI sayısını artır">+</button></div><div class="mini" id="aiCountHelp">${mpHumans?`${aiCountFor(c)} AI + en fazla ${mpHumans} insan; toplam ${aiCountFor(c)+mpHumans} normal devlet. Bu sürümde en fazla 16 AI; kimlik tavanı toplam 49.`:`Oyuncu dahil ${aiCountFor(c)+1} normal devlet. 1–16 doğrulanmış AI.`} Korsanlar ve sonradan doğan devletler hariç.</div><div class="btnrow">${[5,9,16,24,32,48].map(n=>`<button class="btn ghost" data-a="aiPick" data-x="${n}" ${n>SCALE_ACCEPTANCE.maxAI?'disabled':''}>${n}${n>SCALE_ACCEPTANCE.maxAI?' · deneysel':''}</button>`).join('')}</div>${setupSelectionError(c)?`<div class="mini" role="alert">${esc(setupSelectionError(c))}</div>`:''}${aiCountFor(c)+1>SIZES[c.size].sys/4?'<div class="mini">Yoğun galaksi: başkent mesafeleri daralabilir; komşu başlangıçlar oluşabilir.</div>':''}<div class="grid g3" style="margin-top:8px">`;
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
      Güç; filo, üretim ve yerleşimle ölçeklenir. Gösterilen ay aralığında başlar; oyuncunun Altın Çağ kökeni takvimi en erken 72. aya kadar öne çekebilir.</div></div>`;

    h += `<div class="sect"><h2>GALAKTİK KONSEY</h2><div class="grid g4">`;
    for (const k in COUNCIL_PACE){
      const P = COUNCIL_PACE[k];
      h += `<button class="opt ${c.council===k?'on':''}" data-a="councilSet" data-x="${k}">${P.n}<small>${P.d}</small></button>`;
    }
    h += `</div><div class="mini" style="margin-top:6px">Konsey kararları galaksi çapında bağlayıcıdır:
      silahsızlanma, yaptırım, savaş yasağı. Erken kuruluş için Pasifist 2, temas ve etki gerekir. 100. aydan itibaren en az üç temaslı devlet varsa kongreyle de kurulabilir. KAPALI, kuruluşu devre dışı bırakır; SIK/NORMAL/SEYREK oylama aralığını belirler.</div></div>`;

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
  h += `<div class="sumRow"><span>AI devlet sayısı</span><b>${aiCountFor(c)} AI · ${setupHumanSlots()} insan ile ${aiCountFor(c)+setupHumanSlots()} normal devlet</b></div>`;
  h += `<div class="sumRow"><span>AI kökenleri</span><b>${c.aiOrigins===false?'KAPALI':'AÇIK · %'+aiOriginChance(c)}</b></div>`;
  h += `<div class="sumRow"><span>Rastgele olaylar</span><b>${c.randomEvents===false?'KAPALI':'AÇIK'}</b></div>`;
  h += `</div>`;

  if(UI.setupError)h+=`<div class="mini" role="alert">${esc(UI.setupError)}</div>`;
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
  for(const input of document.querySelectorAll('[data-emblem-field]'))input.addEventListener('change',()=>{
    const em=normalizeEmblem(CFG.emblem,CFG.color||RACES[CFG.race].col,'setup'),key=input.dataset.emblemField;
    if(['shape','symbol','pattern','primary','secondary'].includes(key))em[key]=input.value;
    if(key==='primary')CFG.color=em.primary;CFG.emblem=em;safeRenderSetup();
  });
  const inp = $('empName');
  if (inp) inp.addEventListener('input', e => { CFG.name = e.target.value || 'Yeni Hanedan'; });
  paintEmblems();
}

function setupClickHandler(e){
  const el = e.target.closest('[data-a]');
  if (!el || $('menu').classList.contains('hidden')) return;
  // Pointerup can redraw the button before its synthesized click arrives.
  // Match the action, not the replaced DOM node; genuine next taps still act.
  const now=Date.now(),key=el.dataset.a+':'+(el.dataset.x||'');
  if(e.type==='click'&&e.detail!==0&&setupClickHandler._pointerKey===key&&now-setupClickHandler._pointerAt<700)return;
  if(e.type==='pointerup'||e.type==='pointerdown'){
    setupClickHandler._pointerKey=key;setupClickHandler._pointerAt=now;
  }
  const a = el.dataset.a, x = el.dataset.x;
  /* ═══ FAZ 67: ŞABLON BUTONLARI ═══
     KÖK NEDEN: tplSave/tplLoad/tplDel yalnız UI.act() içinde
     tanımlıydı. Kurulum ekranı UI.act'ı HİÇ ÇAĞIRMIYOR — kendi
     if/else zincirini kullanıyor. Butonlar bu yüzden ölüydü. */
  if(a==='randomEmblem'){randomizeSetupEmblem();safeRenderSetup();return;}
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
    const check=canPickTrait(CFG.traits,x,CFG);if(!check.ok){say(check.why,'war');return;}
    const i=CFG.traits.indexOf(x);if(i>=0)CFG.traits.splice(i,1);else CFG.traits.push(x);
    safeRenderSetup();
  }
  else if (a === 'monoRes'){
    CFG.monoRes = x;                      // FAZ 77B: tek ürün seçimi
    safeRenderSetup();
  }
  else if (a === 'step'){ SETUP_STEP = x; $('menu').scrollTop = 0; safeRenderSetup(); }
  else if (a === 'sigil'){ CFG.sigil = x; safeRenderSetup(); }
  else if (a === 'look'){ CFG.look = x; safeRenderSetup(); }
  else if (a === 'portraitVariant'){ CFG.portraitVariant=(normalizePortraitVariant(CFG.portraitVariant)+(+x||1)+256)%256;safeRenderSetup(); }
  else if (a === 'mizacSet'){
    if(!Object.hasOwn(PERSONAS,x))return;
    CFG.mizac = x;selectSetupDoctrine(x);
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
  else if (a === 'togAIOrigins'){ CFG.aiOrigins=CFG.aiOrigins===false;safeRenderSetup(); }
  else if (a === 'aiOriginChance'){ if([20,35,60,100].includes(+x))CFG.aiOriginChance=+x;safeRenderSetup(); }
  else if (a === 'togPirate'){ CFG.pirates = (CFG.pirates === false); safeRenderSetup(); }
  else if (a === 'togGate'){ CFG.gates = (CFG.gates === false); safeRenderSetup(); }
  else if (a === 'togRandomEvents'){ CFG.randomEvents = (CFG.randomEvents === false); safeRenderSetup(); }
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
  else if (a === 'rollName'){ rollSetupName(); }
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
      if (!Number.isInteger(val)||Math.abs(val)>ETHIC_MAX) return;
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
      const chk = canPickCivic(CFG.civics, x,CFG);
      if (!chk.ok){ say(chk.why, 'war'); return; }
      CFG.civics.push(x);
      if (x === 'tek_urun' && !CFG.monoRes) CFG.monoRes = 'min';
    }
    safeRenderSetup();
  }
  else if (a === 'mono'){ CFG.monoRes = x; safeRenderSetup(); }
  else if (a === 'origin'){ CFG.origin = Object.hasOwn(ORIGINS,x)?x:'standart'; safeRenderSetup();requestAnimationFrame(()=>document.getElementById('originDetails')?.scrollIntoView?.({block:'nearest'})); }
  else if (a === 'councilSet'){ CFG.council = x; safeRenderSetup(); }
  else if (a === 'crisisSet'){ CFG.crisis = x;if(x==='kapali')CFG.crisisPower='kapali';else if(CFG.crisisPower==='kapali')CFG.crisisPower='normal';safeRenderSetup(); }
  else if (a === 'ruinSet'){ CFG.ruins = x; safeRenderSetup(); }
  else if (a === 'aiCount'){ CFG.aiCount=Math.max(1,Math.min(SCALE_ACCEPTANCE.maxAI,aiCountFor(CFG)+Number(x)));safeRenderSetup(); }
  else if(a==='aiPick'){if(Number.isInteger(+x)&&+x>=1&&+x<=SCALE_ACCEPTANCE.maxAI)CFG.aiCount=+x;safeRenderSetup();}
  else if(a==='sizeStep'){const steps=availableGalaxySteps(),i=steps.indexOf(SIZES[CFG.size]?.sys),n=steps[i+Number(x)];if(n){CFG.aiCount=aiCountFor(CFG);CFG.size=setupSizeKey(n);}safeRenderSetup();}
  else if (a === 'size'){ if(!SIZES[x]||SIZES[x].available===false)return;CFG.aiCount=aiCountFor(CFG);CFG.size = x; safeRenderSetup(); }
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

/* MP.8.9: device-local UI scale. Never touches G, View, Save8 or the mirror. */
(()=>{
  const root=document.documentElement;
  if(!root?.style?.setProperty)return;
  const values=[80,90,100,110,120,125],key='stars:uiScale';
  let preferred=100,effective=100,revision=0,writes=Promise.resolve(false);
  const small=()=>innerWidth<1000||innerHeight<600;
  const valid=v=>values.includes(Number(v))?Number(v):100;
  function controls(){
    const box=document.getElementById('uiScaleControls');if(!box)return;
    box.querySelector('select').value=String(effective);
    for(const option of box.querySelectorAll('option'))option.disabled=small()&&Number(option.value)!==100;
    box.querySelector('[data-a="uiScaleDown"]').disabled=small()||preferred===80;
    box.querySelector('[data-a="uiScaleUp"]').disabled=small()||preferred===125;
    box.querySelector('output').textContent='%'+effective;
    box.querySelector('.scaleHint').textContent=small()?'Bu ekran boyutunda güvenli ölçek %100.':'Harita yakınlaştırması değişmez. Yalnız bu cihazda saklanır.';
  }
  function apply(){
    effective=small()?100:preferred;
    root.style.setProperty('--ui-scale',effective/100);
    root.toggleAttribute('data-ui-scaled',effective!==100);
    controls();UI.positionToolMenus();UI.seltag();if(typeof ColonyUI!=='undefined')ColonyUI.layout();
  }
  UI.getUIScale=()=>({preferred,effective,limited:small()});
  UI.setUIScale=value=>{
    preferred=small()?100:valid(value);revision++;apply();
    const stored=String(preferred);
    writes=writes.catch(()=>false).then(()=>storeSet(key,stored));
    return writes;
  };
  UI.stepUIScale=delta=>UI.setUIScale(values[Math.max(0,Math.min(values.length-1,values.indexOf(preferred)+delta))]);
  UI.uiScaleControls=()=>{
    const modal=document.getElementById('modal'),body=modal?.querySelector('.mbd');if(!body)return;
    const box=document.createElement('section');box.id='uiScaleControls';box.className='uiScaleControls';
    box.innerHTML='<label for="uiScaleSelect">Arayüz Ölçeği</label><div class="scaleRow"><button type="button" data-a="uiScaleDown" aria-label="Arayüzü küçült">−</button><output aria-live="polite"></output><button type="button" data-a="uiScaleUp" aria-label="Arayüzü büyüt">+</button><select id="uiScaleSelect" aria-label="Arayüz Ölçeği">'+values.map((v,i)=>'<option value="'+v+'">%'+v+' — '+['Çok küçük','Küçük','Varsayılan','Büyük','Çok büyük','Ekstra büyük'][i]+'</option>').join('')+'</select><button type="button" data-a="uiScaleReset">Varsayılana döndür</button></div><div class="scaleHint"></div>';
    body.prepend(box);controls();
    box.querySelector('select').addEventListener('change',e=>UI.setUIScale(e.target.value));
  };
  addEventListener('resize',apply);
  apply();
  const initial=revision;
  UI.uiScaleReady=storeGet(key).then(v=>{if(revision===initial){preferred=valid(v);apply();}}).catch(()=>{});
})();
/* END MP.8.9 UI SCALE */

(()=>{
  const root=document.documentElement;
  if(!root?.style?.setProperty)return;
  const key='stars:alertOpacity';
  let opacity=100, edited=false;
  function apply(){
    root.style.setProperty('--alert-opacity',opacity/100);
    const input=$('alertOpacity'),output=$('alertOpacityValue');
    if(input&&output){input.value=String(opacity);output.textContent='%'+opacity;}
  }
  UI.bindAlertOpacity=()=>{
    const input=$('alertOpacity');
    if(!input)return;
    apply();
    input.addEventListener('input',()=>{edited=true;opacity=Number(input.value);apply();});
    input.addEventListener('change',()=>storeSet(key,String(opacity)).catch(()=>{}));
  };
  storeGet(key).then(value=>{
    const stored=Number(value);
    if(!edited&&stored>=25&&stored<=100&&stored%5===0){opacity=stored;apply();}
  }).catch(()=>{});
})();

/* BETA-STABILITY-AI.0 — the same recovery panel for host and guest; mutations await the host ACK. */
Object.assign(UI,{
  fleetRecoverySummary(){
    const c=this._fleetRecoveryCache,now=performance.now();
    if(c&&c.world===G.emps&&c.fleets===G.fleets&&now-c.at<1000)return c.rows;
    const rows=fleetRecoveryGroups(G.p);this._fleetRecoveryCache={world:G.emps,fleets:G.fleets,at:now,rows};return rows;
  },
  fleetRecoveryOpen(id){
    this._fleetRecoveryCache=null;
    const rows=fleetRecoveryGroups(G.p),g=rows.find(g=>g.id===+id)||rows[0],token=(this._fleetRecoverySeq=(this._fleetRecoverySeq||0)+1);
    const history=(G.fleetJournal||[]).filter(r=>r.owner===0).slice(-32).reverse();
    if(!g){this.openModal('<div class="mhd">TAKVİYE KURTARMA</div><div class="mbd">Kayıp hedefli sevkiyat / sipariş yok.'+history.map(r=>`<div class="box">Gün ${Math.floor(r.day)} · Filo ${r.fleet}: ${esc(({merge:'Birleşme',split:'Tam ayırma',combat:'Savaşta tam kayıp',attrition:'İkmalsizlik',disband:'Terhis',colonization:'Koloni gemisi kullanıldı',radiation:'Radyasyon',rule:'Oyun kuralı','empty-cleanup':'Boş filo temizliği — önceki neden bilinmiyor'})[r.reason]||r.reason)}${r.detail?' · '+esc(r.detail):''}${r.replacement!==undefined?' → '+r.replacement:''} · ${r.ships} gemi · ${Math.round(r.power)} güç · ${r.jobs} sipariş / ${r.shipments} sevkiyat</div>`).join('')+'</div><div class="mft"><button class="ch" data-a="closem">KAPAT</button></div>');return;}
    const choices=G.fleets.filter(f=>f.e===0&&f.ships.length&&!hasShipment(f)).map(f=>({label:'Filo: '+f.name+' (#'+f.id+')',target:{fleet:f.id}}));
    for(const s of G.sys)if(s.owner===0&&s.seen.includes(0))choices.push({label:'Toplanma: '+s.name,target:{sys:s.id}});
    const last=history.find(r=>r.fleet===g.id),cause=last?({merge:'Birleşme',split:'Tam ayırma',combat:'Savaşta tam kayıp',attrition:'İkmalsizlik',disband:'Terhis',colonization:'Koloni gemisi kullanıldı',radiation:'Radyasyon',rule:'Oyun kuralı','empty-cleanup':'Boş filo temizliği; önceki neden bilinmiyor'})[last.reason]||last.reason:null;
    const paid={};for(const {q} of g.jobs)for(const [k,v] of Object.entries(q.paid||{}))if(RES[k]&&Number.isFinite(v)&&v>=0)paid[k]=(paid[k]||0)+v;
    this.openModal(`<div class="mhd">⚠ ANA FİLO BULUNAMADI · #${g.id}</div><div class="mbd">
      <div class="mini">${cause?'Kayıtlı neden: '+esc(cause)+(last.detail?' · '+esc(last.detail):'')+' · Gün '+Math.floor(last.day)+' · '+last.ships+' gemi / '+Math.round(last.power)+' güç.':'Eski filonun kayıp nedeni kayıtta yok; kesin neden bilinmiyor.'} Mevcut gemiler korunur; eski filo yeniden yaratılmaz.</div>
      ${rows.map(x=>`<button class="ch" data-a="fleetRecovery" data-x="${x.id}">Hedef #${x.id} · ${x.ships.reduce((n,f)=>n+f.ships.length,0)} gemi / ${x.jobs.length} sipariş</button>`).join('')}
      <div class="box">${g.ships.length} sevkiyat · ${g.ships.reduce((n,f)=>n+f.ships.length,0)} gemi · ${g.jobs.length} ödenmiş üretim siparişi<br>
      Kayıtlı ödeme: ${esc(Object.entries(paid).map(([k,v])=>k+' '+Math.round(v)).join(' · ')||'Makbuz yok')}<br>
      ${esc([...new Set(g.ships.map(f=>G.sys[f.sys]?.name||'Yolda'))].join(' · '))}</div>
      <div class="mini">Yeni hedef seçmek ödeme yapmaz. Siparişlerin ilerlemesi korunur. Kapalı rotada gemiler bekler; başlamış yol bacağı tamamlanır. Toplanma yalnız bilinen kendi sistemlerinden seçilir.</div>
      <button class="abtn" data-a="fleetRecoveryDo" data-x="${token}:hold">HEPSİNİ BEKLET</button>
      <button class="abtn" data-a="fleetRecoveryDo" data-x="${token}:merge">AYNI SİSTEMDE DURAN TAKVİYELERİ BİRLEŞTİR</button>
      <div class="ph">YENİ HEDEF</div>
      ${choices.map((x,i)=>`<button class="abtn" data-a="fleetRecoveryDo" data-x="${token}:${i}">${esc(x.label)}</button>`).join('')}
      <div id="fleetRecoveryResult" class="mini" role="status"></div></div><div class="mft"><button class="ch" data-a="closem">KAPAT</button></div>`);
    this._fleetRecoveryPending={token,id:g.id,stamp:fleetRecoveryStamp(g),choices,busy:false};
  },
  fleetRecoveryDo(value){
    const [token,choice]=String(value).split(':'),p=this._fleetRecoveryPending;
    if(!p||+token!==p.token||p.busy)return;
    const target=p.choices[+choice]?.target,action=['hold','merge'].includes(choice)?choice:'retarget';
    if(action==='retarget'&&!target)return;
    p.busy=true;const box=$('fleetRecoveryResult');box.textContent='Host doğrulaması bekleniyor…';
    const done=r=>{if(this._fleetRecoveryPending!==p||!box.isConnected)return;p.busy=false;this._fleetRecoveryCache=null;
      box.textContent=r.ok?'UYGULANDI — gemiler ve ödenmiş siparişler korundu.':r.why||'İşlem reddedildi';
      if(r.ok){p.busy=true;box.insertAdjacentHTML('beforeend','<button class="abtn" data-a="fleetRecovery">GÜNCEL DURUMU AÇ</button>');}};
    if(window.MP6Stars?.S.on&&MP6Stars.S.started){
      if(!MP6Stars.fleetRecovery({id:p.id,action,stamp:p.stamp,...(target?{target}: {})},done)){p.busy=false;box.textContent='Host bağlı değil; işlem uygulanmadı.';}
    }else done(fleetRecoveryAction(G.p,p.id,action,target,p.stamp));
  }
});
const stabilityFleetAct=UI.act;
UI.act=function(a,x){if(a==='fleetRecovery')return this.fleetRecoveryOpen(x);if(a==='fleetRecoveryDo')return this.fleetRecoveryDo(x);return stabilityFleetAct.call(this,a,x);};
