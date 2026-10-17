'use strict';
/* 95E presentation. Only knowledge-filtered news records reach HTML. */
const ArchiveUI = {
  world:null, mode:'news', filter:'',query:'',page:30,
  date(r){return r.year+'.'+String(r.month).padStart(2,'0')+' · gün '+Math.floor(r.day);},
  open(mode='news'){
    if(this.world!==G.emps){this.world=G.emps;this.filter='';this.query='';}
    this.mode=mode;this.page=30;DiplomaticInbox.sync();
    UI.openModal(`<div class="mhd"><span>${mode==='news'?'GALAKTİK HABERLER':'DİPLOMATİK GELEN KUTUSU'}</span></div><div class="mbd archive95e">
      <div class="archiveTools"><button class="abtn" data-a="news">Haberler · ${GalacticNews.unread()} okunmamış</button><button class="abtn" data-a="diplomaticInbox">Gelen kutusu · ${DiplomaticInbox.pending()} bekliyor</button></div>
      <div class="archiveTools"><input id="archiveSearch" maxlength="160" aria-label="Bilinen kayıtlarda ara" placeholder="Bilinen kayıtlarda ara" value="${esc(this.query)}"><select id="archiveFilter" aria-label="Kategori / durum">${[['','Tümü'],...Object.entries(mode==='news'?GalacticNews.categories:DiplomaticInbox.states)].map(([k,v])=>`<option value="${k}" ${this.filter===k?'selected':''}>${esc(v)}</option>`).join('')}</select></div>
      ${mode==='news'?'<div class="archiveTools"><button class="abtn" data-a="newsUnread">Okunmamışlar</button><button class="abtn" data-a="newsPinned">Sabitlenenler</button><button class="abtn" data-a="newsReadAll">Görünenleri okundu say</button></div>':''}
      <div id="archiveRows"></div></div><div class="mft"><button class="ch" data-a="closem">Haritaya dön</button></div>`);
    const change=()=>{this.query=$('archiveSearch').value||'';this.filter=$('archiveFilter').value||'';this.page=30;this.rows();};
    $('archiveSearch').addEventListener('input',change);$('archiveFilter').addEventListener('change',change);this.rows();
  },
  rows(){
    let list;if(this.mode==='news')list=GalacticNews.list({category:this.filter,query:this.query,unread:this.unreadOnly,pinned:this.pinnedOnly});
    else {const q=this.query.toLocaleLowerCase('tr');list=DiplomaticInbox.state().records.filter(r=>(!this.filter||r.status===this.filter)&&[r.title,r.sub,r.name].join(' ').toLocaleLowerCase('tr').includes(q)).slice().reverse();}
    $('archiveRows').innerHTML=(list.length?list.slice(0,this.page).map(r=>this.mode==='news'?`<article class="box news95e ${r.read?'':'unread95e'}"><div class="mini">${esc(this.date(r))} · ${esc(GalacticNews.categories[r.category])}${r.important?' · ÖNEMLİ':''}${r.pinned?' · ★':''}</div><button class="abtn" data-a="newsDetail" data-x="${r.id}">${esc(r.title)}</button><p>${esc(r.text)}</p></article>`:
      `<article class="box news95e"><div class="mini">${esc(this.date(r))} · ${esc(DiplomaticInbox.states[r.status])}</div><button class="abtn" data-a="diplomaticRecord" data-x="${r.id}">${esc(r.title)}</button><p>${esc(r.name)} · ${esc(DiplomaticInbox.types[r.kind])}</p><div class="mini">${r.status==='pending'?Math.max(0,Math.ceil(r.expires-G.day))+' gün kaldı · ':''}Son gün: ${Math.floor(r.expires)}</div></article>`).join(''):'<div class="mini">Bu filtrede bilinen kayıt yok.</div>')+
      (list.length>this.page?'<button class="abtn" data-a="archiveMore">Daha eski kayıtları göster</button>':'');
  },
  detail(id){
    const r=GalacticNews.get(id);if(!r)return;r.read=true;UI.topbar();
    UI.openModal(`<div class="mhd"><span>${esc(r.title)}</span></div><div class="mbd archive95e"><div class="mini">${esc(this.date(r))} · ${esc(GalacticNews.categories[r.category])}</div><p>${esc(r.text)}</p>
      <div class="mini">Bilgi kaynağı: ${esc(r.knowledge)}</div><div class="ph">İLGİLİ DEVLETLER</div>${r.empires.map((e,i)=>`<button class="abtn" data-a="newsEmpire" data-x="${r.id}:${i}">${esc(e.name)}${G.emps[e.id]?.dead?' · tarihsel devlet':''}</button>`).join('')}
      ${r.federation?`<p>Federasyon: ${esc(r.federation.name)}</p>`:''}${r.system?`<button class="abtn" data-a="newsLocation" data-x="${r.id}">${esc(r.system.name)}${r.planet?' · '+esc(r.planet.name):''} · Konuma git</button>`:''}
      </div><div class="mft"><button class="ch" data-a="newsPin" data-x="${r.id}">${r.pinned?'Sabitlemeyi kaldır':'Sabitle'}</button><button class="ch" data-a="news">Haber arşivine dön</button></div>`);
  },
  record(id){
    DiplomaticInbox.sync();const r=DiplomaticInbox.get(id);if(!r)return;const gate=DiplomaticInbox.gate(r),offer=DiplomaticInbox.deal(r),f=r.fid!==undefined?fedOf(r.fid):null;
    const terms=offer?'<div class="ph">SANA VERİYOR</div>'+offer.give.map(i=>'<p>'+esc(dealLabel(i))+'</p>').join('')+'<div class="ph">SENDEN İSTİYOR</div>'+offer.want.map(i=>'<p>'+esc(dealLabel(i))+'</p>').join('')+`<div class="mini">İmza maliyeti: ${gate.quote?.cost??0} Etki · gönderen öder</div>`:r.kind==='fedvote'&&f?.vote?UI.fedAgendaContext(f.vote):'';
    UI.openModal(`<div class="mhd"><span>${esc(r.title)}</span></div><div class="mbd archive95e"><div class="mini">${esc(r.name)} · ${esc(DiplomaticInbox.types[r.kind])} · ${esc(DiplomaticInbox.states[r.status])}</div><p>${esc(r.sub)}</p>${terms}
      <div class="mini">${Math.max(0,Math.ceil(r.expires-G.day))} gün · son gün ${Math.floor(r.expires)}</div>${gate.why?'<p>'+esc(gate.why)+'</p>':''}
      <button class="abtn" data-a="inboxEmpire" data-x="${r.id}">Devleti incele · teklif saklanır</button>
      ${r.kind==='submit'?'<div class="mini">Himaye, seçilen vasallık türünün mevcut yükümlülüklerini getirir.</div><select id="inboxVassalType" aria-label="Vasallık türü">'+Object.entries(VASSAL_TYPES).map(([k,v])=>`<option value="${k}">${esc(v.n)} — ${esc(v.d)}</option>`).join('')+'</select>':''}</div>
      <div class="mft">${r.status==='pending'?`<button id="inboxYes" class="ch" ${gate.ok?'':'disabled'}>Kabul et</button><button id="inboxNo" class="ch">Reddet</button>${r.kind==='aideal'?'<button id="inboxCounter" class="ch">Karşı teklif hazırla</button>':''}`:''}<button class="ch" data-a="diplomaticInbox">Gelen kutusuna dön</button></div>`);
    const token={};UI._archiveToken=token;const world=G.emps,record=r,resolve=yes=>{if(UI._archiveToken!==token||world!==G.emps||DiplomaticInbox.get(id)!==record)return;const out=DiplomaticInbox.resolve(id,yes,$('inboxVassalType')?.value||'haracguzar',world);say(out.ok?'Diplomatik karar kaydedildi':out.why,out.ok?'win':'war');this.record(id);UI.topbar();};
    if(r.status==='pending'){UI._hook('inboxYes',()=>resolve(true));UI._hook('inboxNo',()=>resolve(false));if(r.kind==='aideal')UI._hook('inboxCounter',()=>{if(UI._archiveToken!==token||world!==G.emps)return;UI.aiDealOpen(r.note.data);UI._hooks.offCounter();});}
  },
  construction(f){
    const rows=RemoteConstruction.tasks(f),history=RemoteConstruction.state().history.filter(t=>t.fleet===f.id).slice(-4).reverse();
    return `<div class="ph">UZAKTAN İNŞAAT</div><button class="abtn pri" data-a="remoteBuild" data-x="${f.id}">Hedef ve yapı seç · kuyruğa ekle</button><div class="mini">Haritada sistem seçip bu düğmeye dönebilirsin. Kaynaklar varışta harcanır.</div>`+
      [...rows,...history].map(t=>`<article class="box news95e"><b>${esc(t.systemName)} · ${esc(STRUCTS[t.key].n)}</b><div class="mini">${esc(RemoteConstruction.labels[t.state])} · ${esc(t.why)}</div>${rows.includes(t)&&t.state!=='building'?`<button class="abtn" data-a="remoteCancel" data-x="${f.id}:${t.id}">İptal</button>`:''}</article>`).join('');
  },
  build(fid){
    const f=G.fleets.find(f=>f.id===+fid&&f.e===0&&f.ships.some(s=>s.c==='ins'));if(!f)return;
    const known=G.sys.filter(s=>pSeen(s)),selected=View.selSys&&pSeen(View.selSys)?View.selSys.id:known[0]?.id;
    UI.openModal(`<div class="mhd"><span>UZAKTAN İNŞAAT · ${esc(f.name)}</span></div><div class="mbd archive95e"><div class="archiveTools"><select id="remoteTarget" aria-label="Hedef sistem">${known.map(s=>`<option value="${s.id}" ${s.id===selected?'selected':''}>${esc(s.name)}</option>`).join('')}</select><select id="remoteStructure" aria-label="Yapı türü">${Object.entries(STRUCTS).map(([k,v])=>`<option value="${k}">${esc(v.n)}</option>`).join('')}</select></div><div id="remoteQuote"></div></div><div class="mft"><button id="remoteConfirm" class="ch">Kuyruğa eklemeyi onayla</button><button class="ch" data-a="closem">Vazgeç</button></div>`);
    const quote=()=>{const q=RemoteConstruction.gate(f,+$('remoteTarget').value,$('remoteStructure').value,{from:RemoteConstruction.tasks(f).at(-1)?.system});$('remoteQuote').innerHTML=`<p>${esc(q.why)}</p>`+(q.ok?'<p>'+Object.entries(q.cost).map(([k,v])=>esc(RES[k].n)+': '+v).join(' · ')+'</p><div class="mini">'+q.path.length+' atlama · '+RemoteConstruction.tasks(f).length+'/16 görev · iptal edilen bekleyen görevlerde harcama/iade yok.</div>':'');$('remoteConfirm').disabled=!q.ok;};
    $('remoteTarget').value=String(selected??'');$('remoteStructure').value='bilim_ist';$('remoteTarget').addEventListener('change',quote);$('remoteStructure').addEventListener('change',quote);quote();
    const world=G.emps,token={};UI._constructionToken=token;UI._hook('remoteConfirm',()=>{if(UI._constructionToken!==token||world!==G.emps)return;const q=RemoteConstruction.enqueue(f,+$('remoteTarget').value,$('remoteStructure').value);say(q.ok?'İnşaat görevi kuyruğa eklendi':q.why,q.ok?'win':'war');if(q.ok){UI.closeModal();UI.refresh();}else quote();});
  },
  act(a,x){
    if(!['news','diplomaticInbox','newsDetail','newsEmpire','newsLocation','newsPin','newsUnread','newsPinned','newsReadAll','archiveMore','diplomaticRecord','inboxEmpire','remoteBuild','remoteCancel','inboxReturn'].includes(a))return false;
    if(a==='news'||a==='diplomaticInbox'){if(this.mode!==(a==='news'?'news':'inbox')){this.filter='';this.query='';}this.open(a==='news'?'news':'inbox');}
    if(a==='newsDetail')this.detail(+x);
    if(a==='newsPin'){if(!GalacticNews.pin(x))say('En çok 20 haber sabitlenebilir');this.detail(+x);}
    if(a==='archiveMore'){this.page+=30;this.rows();}
    if(a==='newsUnread'){this.unreadOnly=!this.unreadOnly;this.rows();}
    if(a==='newsPinned'){this.pinnedOnly=!this.pinnedOnly;this.rows();}
    if(a==='newsReadAll'){for(const r of GalacticNews.list({category:this.filter,query:this.query,unread:this.unreadOnly,pinned:this.pinnedOnly}))r.read=true;this.rows();UI.topbar();}
    if(a==='newsLocation'){const r=GalacticNews.get(x),s=GalacticNews.location(r);if(s){UI.closeModal();View.center(s.x,s.y);View.ping(s);View.selSys=s;UI.tab('sistem');}}
    if(a==='newsEmpire'){const [id,index]=x.split(':').map(Number),e=GalacticNews.get(id)?.empires[index],live=e&&G.emps[e.id];if(e&&live&&!live.dead&&GalacticNews.known(e.id)){UI.closeModal();UI.openDiplo();UI.selectDiploIdentity(e.id);}else if(e)say(e.name+' · tarihsel devlet; güncel diplomatik temsil yok');}
    if(a==='diplomaticRecord')this.record(+x);
    if(a==='inboxEmpire'){const r=DiplomaticInbox.get(x);if(r&&GalacticNews.known(r.from)&&!G.emps[r.from]?.dead){this.returnRecord={id:r.id,world:G.emps};UI.closeModal();UI.openDiplo();UI.selectDiploIdentity(r.from);say('Teklife dönmek için durum listesindeki Gelen kutusuna dön seçeneğini kullan');}}
    if(a==='inboxReturn'&&this.returnRecord?.world===G.emps)this.record(this.returnRecord.id);
    if(a==='remoteBuild')this.build(x);
    if(a==='remoteCancel'){const [fid,id]=x.split(':').map(Number),f=G.fleets.find(f=>f.id===fid&&f.e===0);if(f){const q=RemoteConstruction.cancel(f,id);if(!q.ok)say(q.why);UI.refresh();}}
    return true;
  }
};
