'use strict';
/* 95E presentation. Only knowledge-filtered news records reach HTML. */
const ArchiveUI = {
  world:null, mode:'news', filter:'',query:'',page:30,views:{},listVisible:false,
  date(r){
    const day=Number.isFinite(r?.day)?r.day:r?.born;
    if(!Number.isFinite(day)||day<0||!Number.isInteger(r?.year)||!Number.isInteger(r?.month)||r.month<1||r.month>12)return 'Tarih bilinmiyor';
    return r.year+'.'+String(r.month).padStart(2,'0')+' · gün '+Math.floor(day);
  },
  ensureWorld(){
    if(this.world===G.emps)return;
    const keepNews=this.newsReturnRecord()?this.returnNews:null;
    this.world=G.emps;this.views={};this.filter='';this.query='';this.page=30;
    this.unreadOnly=false;this.pinnedOnly=false;this.selected=null;this.scroll=0;this.listVisible=false;this.returnRecord=null;this.returnNews=keepNews;
  },
  remember(){
    if(this.world!==G.emps)return;
    if(this.listVisible)this.scroll=$('archiveRows')?.scrollTop||0;
    this.views[this.mode]={filter:this.filter,query:this.query,page:this.page,unreadOnly:!!this.unreadOnly,pinnedOnly:!!this.pinnedOnly,selected:this.selected,scroll:this.scroll||0};
  },
  shell(body,footer='',list=false,title='GALAKTİK HABER AĞI'){
    UI.openModal(`<div class="mhd"><span>${esc(title)}</span><button class="abtn" data-a="closem" aria-label="Haritaya dön">✕</button></div>
      <nav class="archiveTabs" aria-label="Haber ağı"><button class="abtn ${this.mode==='news'?'pri':''}" data-a="news" aria-pressed="${this.mode==='news'}">Haberler · ${GalacticNews.unread()}</button><button class="abtn ${this.mode==='inbox'?'pri':''}" data-a="diplomaticInbox" aria-pressed="${this.mode==='inbox'}">Gelen kutusu · ${DiplomaticInbox.pending()}</button></nav>
      ${body}${list?'':`<div class="mft">${footer}<button class="ch" data-a="closem">Haritaya dön</button></div>`}`,'archiveShell');
    $('modal').classList.add('archiveHost');this.listVisible=list;
  },
  open(mode='news'){
    this.ensureWorld();this.remember();
    if(this.mode!==mode){this.mode=mode;Object.assign(this,{filter:'',query:'',page:30,unreadOnly:false,pinnedOnly:false,selected:null,scroll:0},this.views[mode]||{});}
    DiplomaticInbox.sync();
    this.shell(`<div class="archiveControls ${mode==='news'?'archiveNewsControls':''}">
      <div class="archiveTools"><input id="archiveSearch" maxlength="160" aria-label="Bilinen kayıtlarda ara" placeholder="Bilinen kayıtlarda ara" value="${esc(this.query)}"><select id="archiveFilter" aria-label="Kategori / durum">${[['','Tümü'],...Object.entries(mode==='news'?GalacticNews.categories:DiplomaticInbox.states)].map(([k,v])=>`<option value="${k}" ${this.filter===k?'selected':''}>${esc(v)}</option>`).join('')}</select></div>
      ${mode==='news'?`<div class="archiveTools archiveFlags"><button class="abtn ${this.unreadOnly?'pri':''}" data-a="newsUnread" aria-pressed="${!!this.unreadOnly}">Okunmamış</button><button class="abtn ${this.pinnedOnly?'pri':''}" data-a="newsPinned" aria-pressed="${!!this.pinnedOnly}">★ Sabitlenen</button><button class="abtn" data-a="newsReadAll">Görünenleri okundu say</button></div>`:''}
      <div class="archiveColumns" aria-hidden="true"><span>Tarih</span><span>Tür</span><span>Devlet</span><span>Kısa açıklama</span><span>Durum</span></div></div>
      <div id="archiveRows" class="archiveRows archive95e" role="region" aria-label="${mode==='news'?'Haber':'Teklif'} listesi" tabindex="0"></div>`,'',true);
    const change=()=>{this.query=$('archiveSearch').value||'';this.filter=$('archiveFilter').value||'';this.page=30;this.scroll=0;this.rows();};
    $('archiveSearch').addEventListener('input',change);$('archiveFilter').addEventListener('change',change);this.rows();
  },
  rows(){
    let list;if(this.mode==='news')list=GalacticNews.list({category:this.filter,query:this.query,unread:this.unreadOnly,pinned:this.pinnedOnly});
    else {const q=this.query.toLocaleLowerCase('tr');list=DiplomaticInbox.state().records.filter(r=>(!this.filter||r.status===this.filter)&&[r.title,r.sub,GalacticNews.known(r.from)?r.name:''].join(' ').toLocaleLowerCase('tr').includes(q)).slice().reverse();}
    const news=this.mode==='news';
    $('archiveRows').innerHTML=(list.length?list.slice(0,this.page).map(r=>{
      const empire=news?r.empires.filter(e=>GalacticNews.known(e.id)):GalacticNews.known(r.from)?[{id:r.from,name:r.name}]:[];
      const e=empire[0],type=news?GalacticNews.categories[r.category]:DiplomaticInbox.types[r.kind];
      const state=news?(r.pinned?'★ Sabit':r.read?'Okundu':'Yeni'):DiplomaticInbox.states[r.status];
      return `<article class="archiveRow ${news&&!r.read?'unread95e':''} ${this.selected===r.id?'selected':''}" data-record="${r.id}"><span class="archiveDate">${esc(this.date(r))}</span><span class="archiveType" title="${esc(type)}">${esc(type)}</span>
        ${e?`<button class="archiveEmpire" data-a="${news?'newsEmpire':'inboxEmpire'}" data-x="${news?r.id+':'+r.empires.findIndex(x=>x.id===e.id):r.id}" title="Devleti incele">${esc(e.name)}${empire.length>1?' +'+(empire.length-1):''}</button>`:'<span class="archiveEmpire">—</span>'}
        <button class="archiveTitle" data-a="${news?'newsDetail':'diplomaticRecord'}" data-x="${r.id}" aria-label="Ayrıntı: ${esc(r.title)}"><strong>${esc(r.title)}</strong><span>${esc(news?r.text:r.sub)}</span></button><span class="archiveState">${esc(state)}${r.important?' · !':''}</span></article>`;
    }).join(''):'<div class="mini archiveEmpty">Bu filtrede bilinen kayıt yok.</div>')+
      (list.length>this.page?'<button class="abtn archiveMore" data-a="archiveMore">Daha eski kayıtları göster</button>':'');
    $('archiveRows').scrollTop=this.scroll||0;
  },
  warStatus(r){
    // Host ledger IDs are authoritative. Guest mirrors intentionally omit this ledger.
    const id=Number.isSafeInteger(r.front)?r.front:+(/^war-(?:front|end):(\d+)$/.exec(r.key||'')?.[1]||0);
    const guest=typeof MP6Stars!=='undefined'&&MP6Stars.S?.started;
    const front=!guest&&id?(G.warLedger?.fronts||[]).find(f=>f.id===id):null;
    const emps=r.empires||[{id:r.attacker,name:UI.warNoticeName(r.attacker)},{id:r.defender,name:UI.warNoticeName(r.defender)}];
    const known=emps.filter(e=>GalacticNews.known(e.id));
    const exact=front&&front.sides.every(id=>emps.some(e=>e.id===id));
    const f=exact?front:null,meta=guest?MP6Stars.S.mirror?.news?.records?.find(x=>x.key===r.key)?.warStatus:null,status=(f?warNewsReport(G.p,id):meta),active=status&&status.ended===null;
    const day=d=>Number.isFinite(d)?(2210+Math.floor(d/360))+'.'+String(Math.floor(d%360/30)+1).padStart(2,'0')+' · gün '+Math.floor(d):'kesin tarih bilinmiyor';
    const label=id=>esc(known.find(e=>e.id===id)?.name||'Bilinmeyen devlet');
    let h=`<div class="mbd archiveDetail" data-war-status="${esc(r.key||'war-front:'+id)}"><div class="mini">Olay: ${esc(r.key||'war-front:'+id)}</div><h3>${esc(r.title||'Savaş bildirimi')}</h3>`;
    h+=`<div class="row"><span>Saldıran → Savunan</span><b>${status?label(status.parties?.find(x=>x.role===0)?.id??status.sides[0])+' → '+label(status.parties?.find(x=>x.role===1)?.id??status.sides[1]):known.map(e=>esc(e.name)).join(' / ')+' · tarihsel taraf rolü kesin bilinmiyor'}</b></div>`;
    if(status){const side=f?.roles?.[f.sides.indexOf(G.p.id)];if(side===0||side===1)h+='<p>'+ (side===0?'Saldıran taraf':'Savunan taraf')+'</p>';}
    const entry=r.reason||f?.entryKind||status?.entryKind,entries={declaration:'Savaş ilanı',federation:'Federasyon savunma paktı',overlord:'Senyörün vasalını koruma yükümlülüğü',vassal:'Senyörün savunma çağrısı',promise:'Müzakerede verilen savaş sözü',independence:'Bağımsızlık savaşı',independenceSupport:'Bağımsızlığa destek sözü',event:'Gerçekleşen olay sonucu savaş'};
    if(entries[entry])h+='<p>'+esc(entries[entry])+'</p>';
    const caller=r.sponsor??f?.sponsor??status?.sponsor;if(Number.isInteger(caller)&&G.emps[caller])h+='<p>Çağıran devlet: '+esc(UI.warNoticeName(caller))+'</p>';
    h+=`<p>Başlangıç / haber tarihi: ${status&&!status.legacy?day(status.opened):this.date(r)}${status?.legacy?' · önceki başlangıç kesin bilinmiyor':''}</p>`;
    h+=status?`<p><b>${active?'AKTİF':'SONA ERDİ'}</b>${!active?' · Bitiş '+day(status.ended)+' · Neden: '+esc(WAR_END_REASONS[String(status.endReason||status.reason).split('|')[0]]||status.endReason||status.reason||'kayıtta belirtilmemiş'):''}</p>`:'<p>Bu haberin kesin savaş durumu / bitiş tarihi bilinmiyor. Güncel başka bir savaş bu tarihsel kayda bağlanmaz.</p>';
    if(status){
      h+='<p>Bilgi güncellemesi: '+day(status.asOf)+'</p>';
      const name=id=>id===G.p.id?esc(G.p.name):GalacticNews.known(id)?esc(G.emps[id]?.name||'Bilinmeyen devlet'):'Bilinmeyen devlet';
      h+='<p>Bilinen savaş ortakları: '+(status.participants||[]).map(x=>name(x.id)+' ('+(x.role===0?'saldıran':'savunan')+')').join(' · ')+'</p>';
      if(!active)h+='<p>Bitişi başlatan: '+(Number.isInteger(status.actor)?name(status.actor):String(status.reason||'').length?'Otomatik kural / aktör kaydedilmemiş':'BİLİNMİYOR')+'</p>';
      for(const x of status.parties||[]){h+='<section class="box"><b>'+name(x.id)+'</b><p>Savaş yorgunluğu: '+(Number.isFinite(x.exhaustion)?'%'+Math.round(x.exhaustion):'BİLİNMİYOR · tarihsel değer kaydedilmedi veya istihbarat yetersiz')+'</p>';
        h+='<p>Askerî güç: '+(x.power?Math.round(x.power.value)+(x.power.exact?' · kendi filo gücün':' · son gözleme dayalı, toplam güç kesin değil')+' · '+day(x.power.day):'BİLİNMİYOR')+'</p><p>Kayıtlı gemi kaybı: '+(Number.isFinite(x.shipsLost)?x.shipsLost+(x.id!==G.p.id?' · yalnız senin imha ettiklerin':''):'BİLİNMİYOR')+'</p><p>Filo kaybı: BİLİNMİYOR · ayrı sayaç yok</p></section>';}
      h+='<p>Kayıtlı kendi savaş hedeflerin: '+((status.goals||[]).map(x=>esc(x.type)+' · '+day(x.day)+(x.targets.length?' · '+x.targets.map(id=>esc(G.sys[id]?.name||'Bilinmeyen sistem')).join(', '):'')).join(' / ')||'BİLİNMİYOR')+'</p>';
      h+='<p>Bilinen aktif cepheler: '+((status.fronts||[]).map(x=>'#'+x.id+' · '+x.sides.map(name).join(' ↔ ')).join(' / ')||(active?'BİLİNMİYOR':'Bu tarihsel savaş sona erdi'))+'</p>';
      h+='<p>Kayıtlı ilerleme: '+((status.progress||[]).map(x=>esc(G.sys[x.sys]?.name||'Bilinmeyen sistem')+' · '+name(x.from)+' → '+name(x.to)+' · '+day(x.day)).join(' / ')||'BİLİNMİYOR · görünür bir ele geçirme kaydı yok')+'</p>';
    }
    h+='<p>Gizli filo konumları verilmez. Geçmiş güç ve yorgunluk anlık görüntüleri kaydedilmedi; BİLİNMİYOR alanları başka bir savaşın güncel verileriyle doldurulmaz.</p>';
    const foe=known.some(e=>e.id===G.p.id)?known.find(e=>e.id!==G.p.id):null;
    this.shell(h+'</div>',(foe?'<button class="ch" data-a="wdDiplo">'+esc(foe.name)+' · Güncel diplomasi</button>':'')+'<button class="ch" data-a="news">Haber listesine dön</button>',false,'⚔ SAVAŞ DURUMU');
    if(foe){const world=G.emps,player=G.p,marker='data-war-status="'+esc(r.key||'war-front:'+id)+'"';UI._hook('wdDiplo',()=>{if(G.emps!==world||G.p!==player||!$('modal').innerHTML.includes(marker))return;UI.closeModal();UI.selectDiplo(foe.id,'relation');});}

  },
  newsReturnRecord(){
    const n=this.returnNews;if(!n)return null;
    const j=typeof MP6Stars!=='undefined'&&MP6Stars.S?.started&&typeof MP1Join!=='undefined'?MP1Join:null;
    if(n.join?n.join!==j||n.code!==j?.code||n.player!==j?.playerId:j||n.world!==G.emps)return null;
    const r=GalacticNews.get(n.id);return r?.key===n.key?r:null;
  },
  newsBackButton(){return this.newsReturnRecord()?'<button class="abtn" data-a="newsReturn">İncelenen habere geri dön</button>':'';},
  detail(id){
    this.ensureWorld();const r=GalacticNews.get(id);if(!r)return;this.remember();this.selected=r.id;r.read=true;UI.topbar();if(r.category==='war'||r.category==='peace'&&/^war-end:\d+$/.test(r.key)){this.warStatus(r);return;}
    this.shell(`<div class="mbd archiveDetail archive95e"><h3>${esc(r.title)}</h3><div class="mini">Olay: ${esc(r.key)} · ${esc(this.date(r))} · ${esc(GalacticNews.categories[r.category])}</div><p>${esc(r.text)}</p>
      <div class="mini">Bilgi kaynağı: ${esc(r.knowledge)}</div><div class="ph">İLGİLİ DEVLETLER</div>${r.empires.map((e,i)=>GalacticNews.known(e.id)?`<button class="abtn" data-a="newsEmpire" data-x="${r.id}:${i}">${esc(e.name)}${G.emps[e.id]?.dead?' · tarihsel devlet':''}</button>`:'').join('')}
      ${r.federation?`<p>Federasyon: ${esc(r.federation.name)}</p>`:''}${GalacticNews.location(r)?`<button class="abtn" data-a="newsLocation" data-x="${r.id}">${esc(r.system.name)}${r.planet?' · '+esc(r.planet.name):''} · Konuma git</button>`:''}</div>`,
      `${r.category==='council'&&councilExists()||r.federation&&findFed(G.p)?.id===r.federation.id?`<button class="ch" data-a="newsContext" data-x="${r.id}">Güncel ${r.category==='council'?'Konsey':'federasyon'} · tarihsel haber saklanır</button>`:''}<button class="ch" data-a="newsPin" data-x="${r.id}">${r.pinned?'Sabitlemeyi kaldır':'Sabitle'}</button><button class="ch" data-a="news">Listeye dön</button>`);
  },
  decisionContext(r,f){
    let text='Kabul mevcut teklifi uygular; ret bu kaydı sonuçlandırır.';
    if(r.kind==='invite')text='Kabul: '+(f?.name||'Federasyon')+' üyeliği, anayasa yükümlülükleri ve yürürlükteki yasalar. Ret: bu davet kapanır; üyelik kurulmaz. Katılımın ek Etki bedeli yoktur.';
    if(r.kind==='pact'||r.kind==='peace'||r.kind==='aideal')text='Kabul: aşağıdaki anlaşma hükümleri mevcut işlem motoruyla uygulanır. Ret: kaynak aktarımı veya yeni anlaşma gerçekleşmez. İmza Etkisini gönderen öder; senden istenen kaynaklar kabulde kendi stokundan alınır.';
    if(r.kind==='aideal')text+=' İlk geçerli ret, aynı şartlar için 27 ay bekleme ve gönderenin sana ilişkisinde −5 değişim yaratır; aynı karar ikinci kez ceza vermez.';
    if(r.kind==='submit')text='Kabul: seçtiğin türün mevcut vasallık sözleşmesi kurulur; gönderen 90 Etki öder. Ret: sözleşme kurulmaz; gönderenin sana ilişkisi −15 değişir.';
    if(r.kind==='sqOffer')text='Kabul: mevcut statüko barışı uygulanır. Ret: savaş sürer.';
    if(r.kind==='decision'){const d=f?.decisions?.[r.token];text='Kabul: onaylı ortak savaş kararı şimdi uygulanır. Hedef: '+UI.diploName(d?.target)+'. Evet diyen üyeler: '+(d?.approved||[]).map(id=>UI.diploName(id)).join(', ')+'. Her üyenin güncel savaş/antlaşma yetkisi yeniden denetlenir. Ret: bu oyuncunun gelen kutusu kaydı kapanır; federasyon kararı geçerliliğini korur.';}
    if(r.kind==='fedfound'||r.kind==='fedfoundResult'){const p=fedFoundGet(r.note?.data);if(!p)return '<p>Kuruluş geçmişi bu kayıtta bulunmuyor.</p>';const f=p.fid?fedOf(p.fid):null;return `<div class="box"><b>${esc(FED_TYPES[p.type].n)} · ${esc(FED_BALLOTS[p.ballot].n)}</b><p>${esc(fedDutyText({type:p.type,charter:{...fedDefaultCharter(p.type),ballot:p.ballot},laws:{}}))} Üyeler arasında ittifak oluşur.</p>${p.members.map(id=>`<p>${esc(G.emps[id]?.name||'Bilinmeyen kurucu')} — ${esc(p.replies[id]?.status||'bilinmiyor')} · ${esc(p.replies[id]?.why||'')}</p>`).join('')}<p>Durum: ${esc(p.status)} · Kuruluş bedeli ${fedFoundCost(G.emps[p.by])} Etki, yalnız önerenden ve başarıda bir kez.</p>${f?`<p>${esc(f.name)} · Lider: ${esc(G.emps[f.leader].name)}</p>`:''}<button class="abtn" data-a="fedPane">FEDERASYON BÖLÜMÜ</button></div>`;}
    if(r.kind==='fedvote')return '';
    return '<div class="box"><b>KARARIN ETKİSİ</b><p class="mini">'+esc(text)+'</p></div>';
  },
  record(id){
    this.ensureWorld();DiplomaticInbox.sync();const r=DiplomaticInbox.get(id);if(!r)return;this.remember();if(this.mode!=='inbox'){this.mode='inbox';Object.assign(this,{filter:'',query:'',page:30,unreadOnly:false,pinnedOnly:false,selected:null,scroll:0},this.views.inbox||{});}this.selected=r.id;
    if(r.kind==='vassal'){UI.vsRecord(r.fid,r.id);return;}
    const gate=DiplomaticInbox.gate(r),offer=DiplomaticInbox.deal(r),f=r.fid!==undefined?fedOf(r.fid):null;
    const terms=offer?'<div class="ph">SANA VERİYOR</div>'+offer.give.map(i=>'<p>'+esc(dealLabel(i))+'</p>').join('')+'<div class="ph">SENDEN İSTİYOR</div>'+offer.want.map(i=>'<p>'+esc(dealLabel(i))+'</p>').join('')+`<div class="mini">İmza maliyeti: ${gate.quote?.cost??0} Etki · gönderen öder</div>`:r.kind==='fedvote'&&f?.vote&&fedVoteToken(f.vote)===r.token?UI.fedAgendaContext(f.vote):'';
    const counterOK=gate.ok&&r.kind==='aideal';
    this.shell(`<div class="mbd archiveDetail archive95e"><h3>KARAR · ${esc(r.title)}</h3><div class="mini">${esc(this.date(r))} · ${esc(GalacticNews.known(r.from)?r.name:'Bilinmeyen devlet')} · ${esc(DiplomaticInbox.types[r.kind])} · ${esc(DiplomaticInbox.states[r.status])}</div><p>${esc(r.sub)}</p>${this.decisionContext(r,f)}${terms}
      <div class="mini">${Math.max(0,Math.ceil(r.expires-G.day))} gün · son gün ${Math.floor(r.expires)}</div>${gate.why?'<p id="inboxReason" role="status">'+esc(gate.why)+'</p>':''}
      ${GalacticNews.known(r.from)?`<button class="abtn" data-a="inboxEmpire" data-x="${r.id}">Devleti incele · teklif saklanır</button>`:''}
      ${f?`<button class="abtn" data-a="inboxFederation" data-x="${r.id}">Federasyon bölümünü aç · karar saklanır</button>`:''}
      ${r.kind==='submit'?'<div class="mini">Himaye, seçilen vasallık türünün mevcut yükümlülüklerini getirir.</div><select id="inboxVassalType" aria-label="Vasallık türü">'+Object.entries(VASSAL_TYPES).map(([k,v])=>`<option value="${k}">${esc(v.n)} — ${esc(v.d)}</option>`).join('')+'</select>':''}</div>`,
      `${r.status==='pending'&&r.kind!=='fedrequest'?`<button id="inboxYes" data-a="inboxYes" class="ch" ${gate.ok?'':'disabled aria-describedby="inboxReason"'}>${r.kind==='fedvote'?'EVET OYU VER':r.kind==='decision'?'KARARI UYGULA':'KABUL ET'}</button><button id="inboxNo" data-a="inboxNo" class="ch">${r.kind==='fedvote'?'HAYIR OYU VER':'REDDET'}</button>${r.kind==='aideal'?`<button id="inboxCounter" data-a="inboxCounter" class="ch" ${counterOK?'':'disabled aria-describedby="inboxReason"'}>Karşı teklif hazırla</button>`:''}`:''}<button class="ch" data-a="diplomaticInbox">Listeye dön</button>`);
    const token={};UI._archiveToken=token;const world=G.emps,record=r,resolve=yes=>{if(UI._archiveToken!==token||world!==G.emps||DiplomaticInbox.get(id)!==record)return;const out=DiplomaticInbox.resolve(id,yes,$('inboxVassalType')?.value||'haracguzar',world);say(out.ok?'Diplomatik karar kaydedildi':out.why,out.ok?'win':'war');this.record(id);UI.topbar();};
    if(r.status==='pending'&&r.kind!=='fedrequest'){UI._hook('inboxYes',()=>resolve(true));UI._hook('inboxNo',()=>resolve(false));if(r.kind==='aideal')UI._hook('inboxCounter',()=>{if(UI._archiveToken!==token||world!==G.emps||DiplomaticInbox.get(id)!==record||!DiplomaticInbox.gate(record).ok)return;UI.aiDealOpen(r.note.data);UI._hooks.offCounter();});}
  },
  construction(f){
    const rows=RemoteConstruction.tasks(f),history=RemoteConstruction.state().history.filter(t=>t.fleet===f.id).slice(-4).reverse();
    return `<div class="ph">UZAKTAN İNŞAAT</div><button class="abtn pri" data-a="remoteBuild" data-x="${f.id}">Hedef ve yapı seç · kuyruğa ekle</button><div class="mini">Haritada sistem seçip bu düğmeye dönebilirsin. Kaynaklar varışta harcanır.</div>`+
      [...rows,...history].map(t=>`<article class="box news95e"><b>${esc(t.systemName)} · ${esc(STRUCTS[t.key].n)}</b><div class="mini">${esc(RemoteConstruction.labels[t.state])} · ${esc(t.why)}</div>${rows.includes(t)&&t.state!=='building'?`<button class="abtn" data-a="remoteCancel" data-x="${f.id}:${t.id}">İptal</button>`:''}</article>`).join('');
  },
  build(fid){
    const f=G.fleets.find(f=>f.id===+fid&&f.e===0&&f.ships.some(s=>s.c==='ins'));if(!f)return;
    const known=G.sys.filter(s=>pSeen(s)),selected=View.selSys&&pSeen(View.selSys)?View.selSys.id:known[0]?.id;
    UI.openModal(`<div class="mhd"><span>UZAKTAN İNŞAAT · ${esc(f.name)}</span></div><div class="mbd archive95e"><div class="archiveTools"><select id="remoteTarget" aria-label="Hedef sistem">${known.map(s=>`<option value="${s.id}" ${s.id===selected?'selected':''}>${esc(s.name)}</option>`).join('')}</select><select id="remoteStructure" aria-label="Yapı türü">${Object.entries(STRUCTS).map(([k,v])=>`<option value="${k}">${esc(v.n)}</option>`).join('')}</select></div><div id="remoteQuote"></div></div><div class="mft"><button id="remoteConfirm" data-a="remoteConfirm" class="ch">Kuyruğa eklemeyi onayla</button><button class="ch" data-a="closem">Vazgeç</button></div>`);
    const quoteToken={};UI._constructionToken=quoteToken;
    let quoteSeq=0;const quote=()=>{const seq=++quoteSeq,sys=+$('remoteTarget').value,key=$('remoteStructure').value,paint=q=>{if(UI._constructionToken!==quoteToken||seq!==quoteSeq||!$('remoteQuote')||!$('remoteConfirm'))return;$('remoteQuote').innerHTML='<p>'+esc(q.why)+'</p>'+(q.ok?'<p>'+Object.entries(q.cost).map(([k,v])=>esc(RES[k].n)+': '+v).join(' · ')+'</p><p>'+(q.hops??q.path?.length??0)+' atlama · Kaynaklar varışta harcanır.</p>':'');$('remoteConfirm').disabled=!q.ok;};
      if(globalThis.MP6Stars?.S.started){$('remoteConfirm').disabled=true;$('remoteQuote').textContent='Host önizlemesi bekleniyor…';MP6Stars.remoteQuote(f.id,sys,key,paint);}else paint(RemoteConstruction.gate(f,sys,key,{from:RemoteConstruction.tasks(f).at(-1)?.system}));};
    $('remoteTarget').value=String(selected??'');$('remoteStructure').value='bilim_ist';$('remoteTarget').addEventListener('change',quote);$('remoteStructure').addEventListener('change',quote);quote();
    const world=G.emps,token=quoteToken;UI._hook('remoteConfirm',()=>{if(UI._constructionToken!==token||world!==G.emps)return;const q=RemoteConstruction.enqueue(f,+$('remoteTarget').value,$('remoteStructure').value);say(q.ok?'İnşaat görevi kuyruğa eklendi':q.why,q.ok?'win':'war');if(q.ok){UI.closeModal();UI.refresh();}else quote();});
  },
  act(a,x){
    if(!['news','newsContext','newsReturn','diplomaticInbox','newsDetail','newsEmpire','newsLocation','newsPin','newsUnread','newsPinned','newsReadAll','archiveMore','diplomaticRecord','inboxEmpire','remoteBuild','remoteCancel','inboxReturn','inboxFederation'].includes(a))return false;
    if(a==='news'||a==='diplomaticInbox')this.open(a==='news'?'news':'inbox');
    if(a==='newsDetail')this.detail(+x);
    if(a==='newsReturn'){const r=this.newsReturnRecord();if(r)this.detail(r.id);}
    if(a==='newsContext'){const r=GalacticNews.get(+x);if(r&&(r.category==='council'&&councilExists()||r.federation&&findFed(G.p)?.id===r.federation.id)){const j=typeof MP6Stars!=='undefined'&&MP6Stars.S?.started&&typeof MP1Join!=='undefined'?MP1Join:null;this.returnNews={id:r.id,key:r.key,world:G.emps,join:j,code:j?.code,player:j?.playerId};UI.closeModal();if(r.category==='council')UI.openCouncil();else UI.openFed();}}

    if(a==='newsPin'){if(!GalacticNews.pin(x))say('En çok 20 haber sabitlenebilir');this.detail(+x);}
    if(a==='archiveMore'){this.scroll=$('archiveRows').scrollTop||0;this.page+=30;this.rows();}
    if(a==='newsUnread'){this.unreadOnly=!this.unreadOnly;this.open(this.mode);$('archiveRows').scrollTop=0;this.scroll=0;}
    if(a==='newsPinned'){this.pinnedOnly=!this.pinnedOnly;this.open(this.mode);$('archiveRows').scrollTop=0;this.scroll=0;}
    if(a==='newsReadAll'){this.scroll=$('archiveRows').scrollTop||0;for(const r of GalacticNews.list({category:this.filter,query:this.query,unread:this.unreadOnly,pinned:this.pinnedOnly}))r.read=true;this.open(this.mode);UI.topbar();}
    if(a==='newsLocation'){const r=GalacticNews.get(x),s=GalacticNews.location(r);if(s){UI.closeModal();View.center(s.x,s.y);View.ping(s);View.selSys=s;UI.tab('sistem');}}
    if(a==='newsEmpire'){const [id,index]=x.split(':').map(Number),e=GalacticNews.get(id)?.empires[index],live=e&&G.emps[e.id];if(e&&live&&!live.dead&&GalacticNews.known(e.id)){UI.closeModal();UI.openDiplo();UI.selectDiploIdentity(e.id);}else if(e&&GalacticNews.known(e.id))say(e.name+' · tarihsel devlet; güncel diplomatik temsil yok');}
    if(a==='diplomaticRecord')this.record(+x);
    if(a==='inboxEmpire'){const r=DiplomaticInbox.get(x);if(r&&GalacticNews.known(r.from)&&!G.emps[r.from]?.dead){this.remember();this.returnRecord={id:r.id,world:G.emps};UI.closeModal();UI.openDiplo();UI.selectDiploIdentity(r.from);say('Teklife dönmek için durum listesindeki Gelen kutusuna dön seçeneğini kullan');}}
    if(a==='inboxFederation'){this.remember();this.returnRecord={id:+x,world:G.emps};UI.closeModal();UI.openFed();UI.fedTab='votes';UI.openFed();}
    if(a==='inboxReturn'&&this.returnRecord?.world===G.emps)this.record(this.returnRecord.id);
    if(a==='remoteBuild')this.build(x);
    if(a==='remoteCancel'){const [fid,id]=x.split(':').map(Number),f=G.fleets.find(f=>f.id===fid&&f.e===0);if(f){const q=RemoteConstruction.cancel(f,id);if(!q.ok)say(q.why);UI.refresh();}}
    return true;
  }
};
