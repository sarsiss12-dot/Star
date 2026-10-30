'use strict';
/* STARS MP.6 / MP.6.1 — misafir telefonda GERÇEK STARS arayüzü.
   Bu sayfa tek oyunculu oyunla aynı index.html'dir (aynı 19 runtime dosyası, aynı harita/menü/panel kodu). Fark:
   - Dünya host'tan gelen "ayna dünya"dır (research/mp6/mirror.js): yetkiye göre süzülmüş, misafirin devleti 0 numaralı.
     Motorun kendi deserialize()'ı kurar. Misafir SİMÜLASYON YÜRÜTMEZ: yerel hız hep 0, tik yok.
   - Eylemler host'a gider. Üç yol:
     1. Motor eylem işlevleri (orderMove, queueBuilding, queueShip, queueDemolish, cancelBuild, setFocus, researchTarget,
        setResearchMode, federasyon ve vasallık işlevleri) MP komutuna çevrilir: gerçek STARS penceresi, onayı ve uyarıları
        olduğu gibi çalışır; dünyayı değiştiren son çağrı host'a gider.
     2. Dünyayı doğrudan değiştiren düğmeler (dur, duruş, böl/birleştir, otomatik keşif, kolonileştir, hız) UI.act
        kapısında MP komutuna çevrilir.
     3. Gerçek gelen kutusu (DiplomaticInbox) kararları MP komutuna çevrilir; MP.3 insan/AI teklifleri gerçek gelen kutusuna girer.
     Desteklenmeyen eylemler soluk görünür, dokununca açık uyarı verir. Yerelde kalan bir değişiklik bir sonraki aynada
     host'un gerçeğiyle ezilir; host'a yalnız MP komutu ulaşır ve host kendi kurallarıyla denetler.
   - MP.6.1: bir STARS penceresi açıkken gelen ayna bekletilir (tek oyunculu oyunda pencere açıkken dünya değişmez; onay
     pencereleri dünyanın kimliğini denetler). Pencere kapanınca uygulanır. Komutlar beklemeden gider.
   - Lobi ve bağlantı join.js'tedir (aynı modül); bu dosya oyun ekranını gerçek arayüzle değiştirir. */
(function(){
const doc=document;
/* join.js lobisi için katman (oyun başlayınca gizlenir) */
const ov=doc.createElement('div');ov.id='mp6App';ov.className='mp1-overlay mp6-join';ov.innerHTML='<div class="mp1-status">Yükleniyor…</div>';
(doc.body||doc.documentElement).appendChild(ov);

const S={counter:null,J:null,mirror:null,rev:0,timer:null,building:false,started:false,on:false,lastBuild:0,minGap:600,uiSent:false,seenResults:0,hostSpd:0,held:0,
  stats:{mirrors:0,deltas:0,bytes:0,builds:0,buildMs:[],resyncs:0,held:0,blocked:{},sent:{},speedMsgs:0}};

/* ---- 1. eylem kapısı ---- */
/* Yalnız görünüm/gezinme (dünyayı değiştirmeyen) eylemler yerelde çalışır. MP.6.1: arşiv/gelen kutusu görünümleri, anlaşma,
   vasallık ve federasyon taslak ekranları da görünümdür (gönderim motor işlevinde MP komutuna çevrilir). */
const VIEW=new Set(['tab','full','cameraReset','cameraFocus','home','fit','topStatus','diploPane','globalPane','advClose','advShow','advNever','planetFold',
  'radarTog','fleetNamesToggle','grpTog','fedLinksToggle','allyLinksToggle','warLinksToggle','logiToggle','mapMode','bgTog','diploView','diploPick',
  'diploRelation','diploNav','diploFilter','bmPick','bmCancel','vsCurrent','vsInspect','vsType','vsEdit','vsBack','fleetFilter','fedTab','fedMember',
  'closeFed','closeDeal','closeMarket','closeDiplo','memTog','intelView','intelGroup','upInfo','crisInfo','selsys','selfleet','route','fedPane',
  'scienceTab','scienceNode','scienceFocus','scienceFilter','scienceMode','scienceQueue','scienceRoute','scienceMove','scienceRemove','scienceZoom',
  'tech','build','sInfo','bInfo','showEv','minModal','restoreModal','openNote','closem','marketPane','mktSel','mute','save','diagShow','opLogMenu',
  /* MP.6.1 — görünüm / taslak */
  'news','diplomaticInbox','newsDetail','newsEmpire','newsLocation','newsPin','newsUnread','newsPinned','newsReadAll','archiveMore','diplomaticRecord',
  'inboxEmpire','inboxReturn','inboxFederation','deal','dealAdd','dealRm','dealDiscard','dealBack','peace','vsOpen','vsCancel','vsCounter','fedBallot',
  'fedVoteYes','fedVoteNo','fedVoteNow',
  /* MP.6.1 — motor işlevi MP komutuna çevrilen gerçek düğmeler */
  'sendhere','ship','focus','cancelBuild','demolish','foundFed','fedDipInvite','fedDipRequest','fedMotion','fedInviteAccept','fedInviteReject',
  'fedLawPropose','fedLawRepeal','fedLeave','vsSend','vsReply','dealSend']);
/* MP.6.1 — UI.act kapısında doğrudan MP komutuna çevrilen düğmeler (tek oyunculu kodları dünyayı yerelde değiştirir) */
const sel=()=>View.sel&&View.sel.e===0&&G.fleets.includes(View.sel)?View.sel:null;
const ACT={
  spd:x=>send({kind:'speed',value:+x|0}),
  stop:()=>{const f=sel();return f&&send({kind:'stop',fleet:f.id});},
  stance:()=>{const f=sel();return f&&send({kind:'stance',fleet:f.id});},
  merge:()=>{const f=sel();return f&&send({kind:'merge',fleet:f.id});},
  split:()=>{const f=sel();return f&&send({kind:'split',fleet:f.id});},
  splitOne:x=>{const f=sel();return f&&send({kind:'splitType',fleet:f.id,cls:String(x),all:false});},
  splitAll:x=>{const f=sel();return f&&send({kind:'splitType',fleet:f.id,cls:String(x),all:true});},
  autoex:x=>send({kind:'explore',fleet:+x}),
  autoAll:()=>send({kind:'exploreAll'}),
  /* MP teklifine karşı teklif kartı: kabul / ret = MP 'respond' (tek oyunculuda AI karşı teklifini yerelde uygular) */
  ctrYes:()=>S.counter?respond(true):blocked('ctrYes'),
  ctrNo:()=>S.counter?respond(false):blocked('ctrNo'),
  colonize:x=>{const [s,p]=String(x).split(':').map(Number),f=sel(),c={kind:'colonize',sys:s,planet:p};if(f&&fleetHasRole(f,'koloni'))c.fleet=f.id;return send(c);}
};
function respond(yes){const c=S.counter;const cid=send({kind:'respond',offer:c.offer,action:yes?'accept':'reject'});
  if(cid)waits[cid]=res=>toast(res.status==='ok'?(yes?'Teklif kabul edildi — host uyguladı.':'Teklif reddedildi.'):'Host reddetti: '+why(res),res.status!=='ok');
  S.counter=null;try{UI.dealCounter=null;UI.closeDiplo?UI.closeDiplo():doc.getElementById('diploPane').classList.remove('show');}catch{}}
const WHY={toTitle:'Odadan ayrılmak için telefonun geri tuşunu kullan.'};
function blocked(a){S.stats.blocked[a]=(S.stats.blocked[a]||0)+1;toast(WHY[a]||'Bu işlem çok oyunculu misafirde henüz yok (MP.6.1). Host yetkili komut sistemi bu eylemi desteklemiyor.',true);}
function toast(m,bad){try{UI.alert(m,bad?'war':'');}catch{}}
/* host'taki gerçek kimlik: aynada misafir 0, host'un devleti misafirin numarası (π = (0 me)) */
const real=id=>{const me=S.J?S.J.empireId:0;return id===0?me:id===me?0:id;};
const local=real;                                                     // π kendi tersi
const NOT_MP={ok:false,why:'Bu karar çok oyunculuda henüz desteklenmiyor (MP.6.2).'};
function gate(){
  /* desteklenmeyen kontroller görsel olarak da devre dışı: gerçek UI.act'in eylem listesinden misafirde izinli olmayanlar soluk gösterilir
     (dokununca açık uyarı). Liste arayüz kodundan okunur; yeni eylem eklenirse kendiliğinden kapsanır. */
  try{const all=new Set([...String(UI.act).matchAll(/case '([A-Za-z0-9_]+)'/g)].map(m=>m[1]));S.unsupported=[...all].filter(a=>!VIEW.has(a)&&!ACT[a]).sort();
    const st=doc.createElement('style');st.id='mp6Disabled';st.textContent=S.unsupported.map(a=>'[data-a="'+a+'"]').join(',')+'{opacity:.42!important;filter:grayscale(.7)}';doc.head.appendChild(st);}catch{}
  /* onay/seçim düğmeleri (_hook) kendi dinleyicisiyle çalışır; UI.act'te karşılığı yoktur (boş geçer). Adları arayüz kaynağından:
     yalnız izinli bir pencereden açılabilirler ve dünyayı değiştiren son çağrıları yukarıdaki MP sarmalayıcılarına iner. */
  S.hooks=new Set();for(const o of [UI,typeof ArchiveUI!=='undefined'?ArchiveUI:null].filter(Boolean))   // ArchiveUI sözcüksel const (window'da yok)
    for(const k of Object.keys(o))if(typeof o[k]==='function')for(const m of String(o[k]).matchAll(/_hook\('([A-Za-z0-9_]+)'/g))S.hooks.add(m[1]);
  const act=UI.act.bind(UI);
  UI.act=function(a,x,el){if(!S.on)return act(a,x,el);if(ACT[a]){ACT[a](x);return;}if(VIEW.has(a)||S.hooks.has(a))return act(a,x,el);return blocked(a);};
  /* misafirde yerel zaman hep durur (tik yok); hız düğmeleri host'un GERÇEK ortak hızını gösterir */
  UI.setSpeed=function(){G.speed=0;paintSpeed();};
  /* motor eylemleri → MP komutu (yalnız misafirin kendi devleti: aynada 0) */
  const wrap=(name,fn)=>{const o=window[name];if(typeof o!=='function')return;window[name]=function(...a){if(!S.on||S.building)return o.apply(this,a);return fn(o,...a);};};
  const mine=e=>e&&e.id===0;
  wrap('orderMove',(o,f,target,append,automatic)=>{if(automatic||!f||f.e!==0)return false;return send({kind:'move',fleet:f.id,to:+target})!==null;});
  wrap('queueBuilding',(o,e,sys,pl,k)=>{if(!mine(e)||!sys||!pl)return false;return send({kind:'build',sys:sys.id,planet:pl.i,key:String(k)})!==null;});
  wrap('researchTarget',(o,e,id,action,position)=>{if(!mine(e))return {ok:false,why:'—'};const c={kind:'research',tech:String(id)};
    if(action&&action!=='toggle'){c.action=action;c.position=position|0;}return send(c)?{ok:true}:{ok:false,why:'Host bağlı değil'};});
  wrap('setResearchMode',(o,e,mode)=>{if(!mine(e))return false;return !!send({kind:'researchMode',mode:String(mode)});});
  /* MP.6.1 — koloni / tersane */
  wrap('queueShip',(o,e,sys,cls,oto)=>{if(oto||!mine(e)||!sys)return false;return send({kind:'ship',sys:sys.id,key:String(cls)})!==null;});
  wrap('queueDemolish',(o,e,sys,pl,k)=>{if(!mine(e)||!sys||!pl)return false;return send({kind:'demolish',sys:sys.id,planet:pl.i,key:String(k)})!==null;});
  wrap('cancelBuild',(o,e,sys,pl,idx)=>{if(!mine(e)||!sys||!pl)return false;return send({kind:'cancel',sys:sys.id,planet:pl.i,index:idx|0})!==null;});
  wrap('setFocus',(o,e,sys,pl,k)=>{if(!mine(e)||!sys||!pl)return false;return send({kind:'focus',sys:sys.id,planet:pl.i,key:String(k)})!==null;});
  /* MP.6.1 — federasyon ve vasallık: gerçek STARS pencereleri → MP.3.1 komutları (host motorun kendi işlevini çağırır) */
  const r=c=>send(c)?{ok:true}:{ok:false,why:'Host bağlı değil; karar gönderilmedi.'};
  wrap('foundFederation',(o,e,type,ballot)=>mine(e)?r({kind:'fedFound',type:String(type),ballot:String(ballot)}):NOT_MP);
  wrap('requestFederation',(o,e,via)=>mine(e)&&via?r({kind:'fedRequest',via:real(via.id)}):NOT_MP);
  wrap('proposeFedMotion',(o,e,kind,opt)=>mine(e)&&kind==='admit'&&opt&&Number.isInteger(opt.target)?r({kind:'fedInvite',target:real(opt.target)}):NOT_MP);
  wrap('acceptFedInvite',(o,e,fid)=>mine(e)?r({kind:'fedReply',fed:+fid,action:'accept'}):NOT_MP);
  wrap('rejectFedInvite',(o,e,fid)=>mine(e)?r({kind:'fedReply',fed:+fid,action:'reject'}):NOT_MP);
  wrap('castFedVote',(o,e,fid,token,yes)=>mine(e)?r({kind:'fedVote',fed:+fid,token:String(token),yes:!!yes}):NOT_MP);
  wrap('leaveFederation',(o,e)=>mine(e)?r({kind:'fedLeave'}):NOT_MP);
  wrap('proposeFedLaw',(o,e,law,repeal)=>mine(e)?r({kind:'fedLaw',law:String(law),repeal:!!repeal}):NOT_MP);
  wrap('vassalOffer',(o,e,other,mode,type,terms)=>mine(e)&&other?r({kind:'vassalOffer',to:real(other.id),mode:String(mode),type:String(type),terms:vasTerms(type,terms)}):NOT_MP);
  wrap('vassalReply',(o,actor,sub,id,round,action,terms)=>mine(actor)?r({kind:'vassalReply',sub:real(+sub),id:String(id),round:round|0,action:String(action),...(action==='counter'?{terms:vasTerms(null,terms)}:{})}):NOT_MP);
  /* MP.6.1 — gerçek anlaşma penceresi: GÖNDER → MP.3 'offer' (yalnız MP.3'ün desteklediği maddeler: kaynak ve barış).
     Karşı tarafın stoğu aynada yok; uygunluğu host denetler ve sonucu bildirir. */
  const dealSend0=UI.dealSend.bind(UI);
  UI.dealSend=function(){if(!S.on)return dealSend0();this.ensureDiploWorld();const d=this.deal;if(!d)return;
    const items=l=>(l||[]).map(i=>i&&i.t==='res'&&Number.isInteger(i.v)?{t:'res',r:i.r,v:i.v}:i&&i.t==='peace'?{t:'peace'}:null);
    const give=items(d.give),want=items(d.want);
    if(give.includes(null)||want.includes(null)){this.dealMsg='Çok oyunculuda şimdilik yalnız kaynak ve barış maddeleri gönderilebilir (MP.6.2).';this.drawDeal();return;}
    if(!give.length&&!want.length){this.dealMsg='Teklif boş.';this.drawDeal();return;}
    const ctr=S.counter&&S.counter.to===d.to?S.counter:null;
    const cid=send(ctr?{kind:'counter',offer:ctr.offer,give,want}:{kind:'offer',to:real(d.to),give,want});if(ctr)S.counter=null;
    this.dealMsg=cid?'Teklif host\'a gönderildi; yanıt gelen kutuna ve bildirimlere düşer.':'Host bağlı değil; teklif gönderilmedi.';
    if(cid)waits[cid]=res=>toast(res.status==='ok'?'Teklif gönderildi — '+(G.emps[d.to]?.name||''):'Host reddetti: '+why(res),res.status!=='ok');
    this.drawDeal();};
  /* anlaşma penceresinin yerel önizlemesi: karşı tarafın stoğu aynada yok (kabuk). MP.3 dipGate ile aynı kural: misafirde yalnız
     KENDİ yükümlülükleri denetlenir, karşı tarafın kaynak satırları ("Ad → …") düşer; kesin denetim host'ta (offer / respond). */
  wrap('dealQuote',(o,offer)=>{const q=o(offer);if(!q||!offer||offer.from!==0||!G.emps[offer.to])return q;
    const pre=String(G.emps[offer.to].name)+' → ',wf=[],reasons=(q.reasons||[]).filter(r=>!String(r).startsWith(pre));   // wantFail = karşı tarafın satırları
    if(!(q.wantFail||[]).length&&reasons.length===(q.reasons||[]).length)return q;
    return {...q,wantFail:wf,reasons,ok:!(q.giveFail||[]).length&&!wf.length&&!reasons.length};});
  /* gelen kutusundaki MP teklifi için "Karşı teklif hazırla" (aiDealOpen → offCounter): karşı teklif bağlamı hatırlanır, GÖNDER → 'counter' */
  const aiDealOpen0=UI.aiDealOpen.bind(UI);
  UI.aiDealOpen=function(p){if(S.on&&p){const v=S.J&&S.J.game.view,o=v&&v.dip&&v.dip.offers.find(x=>x.status==='pending'&&x.to===S.J.empireId&&local(x.from)===p.from&&x.born===p.born);
    S.counter=o?{offer:o.id,to:p.from}:null;}return aiDealOpen0(p);};
  /* misafirde anlaşma YEREL uygulanmaz (ayna bir sonraki turda ezer; host'a ulaşmaz): yanlış "imzalandı" gösterilmesin */
  wrap('executeDeal',()=>{toast('Çok oyunculuda anlaşma kararı gelen kutusundan verilir; host uygular.',true);return false;});
  /* MP.6.1 — gerçek gelen kutusu: karar → MP komutu. MP.3 tekliflerinde uygunluğu host denetler (karşı tarafın stoğu aynada yok). */
  const DI=DiplomaticInbox,resolve0=DI.resolve.bind(DI),gate0=DI.gate.bind(DI);
  DI.gate=function(rec){if(S.on&&rec&&rec.mp){if(rec.status!=='pending')return {ok:false,why:'Teklif sonuçlandı',terminal:true};return {ok:true,why:''};}return gate0(rec);};
  DI.resolve=function(id,yes,option,world){
    if(!S.on)return resolve0(id,yes,option,world);
    const rec=this.get(id);if(!rec||rec.status!=='pending')return {ok:false,why:'Teklif geçersiz'};
    let c=null;
    if(rec.mp)c={kind:'respond',offer:rec.mp,action:yes?'accept':'reject'};
    else if(rec.kind==='invite')c={kind:'fedReply',fed:rec.fid,action:yes?'accept':'reject'};
    else if(rec.kind==='fedvote')c={kind:'fedVote',fed:rec.fid,token:String(rec.token),yes:!!yes};
    else if(rec.kind==='vassal'){const q=G.emps[rec.fid]?.vassalTalk;if(!q)return {ok:false,why:'Müzakere bulunamadı'};c={kind:'vassalReply',sub:real(rec.fid),id:q.id,round:q.round,action:yes?'accept':'reject'};}
    if(!c)return NOT_MP;
    const cid=send(c);if(!cid)return {ok:false,why:'Host bağlı değil; karar gönderilmedi.'};
    waits[cid]=res=>toast(res.status==='ok'?'Kararın host\'ta uygulandı.':'Host reddetti: '+why(res),res.status!=='ok');
    rec.status=yes?'accepted':'rejected';rec.finished=G.day;rec.why='Karar host\'a gönderildi';   // iyimser; bir sonraki ayna host'un gerçeğini getirir
    return {ok:true};};
}
const vasTerms=(type,t)=>{const o={};for(const k of ['tax','science','defense','war','autonomy','duration','renegotiate','sensors'])if(t&&t[k]!==undefined)o[k]=JSON.parse(JSON.stringify(t[k]));return o;};
function why(res){const d=res.detail&&res.detail.length?' — '+res.detail.join(' · '):'';return (MP1View.ERR[res.code]||res.code)+d;}
function send(cmd){const J=S.J;if(!J)return null;const r=J.cmd(cmd);S.stats.sent[cmd.kind]=(S.stats.sent[cmd.kind]||0)+1;
  if(!r.ok){toast(r.why==='host-yok'?'Host bağlı değil; emir gönderilmedi.':'Emir gönderilemedi.',true);return null;}return r.cid;}

/* ---- 2. ortak oyun hızı (MP.6.1): yerel hız 0, düğmeler host'un gerçek hızını gösterir ---- */
function paintSpeed(){for(const b of doc.querySelectorAll('#timepod .sp'))b.classList.toggle('on',+b.dataset.x===S.hostSpd);}

/* ---- 3. ayna dünya → motorun kendi deserialize'ı ---- */
function onMessage(m){
  if(m.type==='mirror'){S.mirror=m.full;S.rev=m.rev;S.stats.mirrors++;schedule();return true;}
  if(m.type==='mirrorDelta'){if(!S.mirror||m.base!==S.rev){S.stats.resyncs++;S.J&&S.J.sendRaw({v:1,type:'resync'});return true;}
    StarsMirror.apply(S.mirror,m.ops);S.rev=m.rev;S.stats.deltas++;schedule();return true;}
  if(m.type==='speed'){S.hostSpd=m.spd|0;S.stats.speedMsgs++;paintSpeed();if(window.MP61)MP61.speed(m);return true;}
  return false;
}
/* ayna bekletme: gerçek onay penceresi (#modal) ya da diplomasi/federasyon sayfası açıkken (taslaklar G.p kimliğine bağlı).
   Bilim ekranı (aynı #diploPane) canlı güncellenir: tek oyunculuda da açıkken oyun sürer. */
function holdBuild(){const m=doc.getElementById('modal'),d=doc.getElementById('diploPane');
  return !!(m&&!m.classList.contains('hidden'))||!!(d&&d.classList.contains('show')&&UI.globalCur!=='bilim');}
function schedule(){if(S.timer)return;const wait=Math.max(0,S.minGap-(Date.now()-S.lastBuild));S.timer=setTimeout(rebuild,wait);}
function rebuild(){
  S.timer=null;if(!S.mirror)return;
  /* MP.6.1: STARS penceresi açıkken ayna bekletilir (onay pencereleri dünya kimliğini denetler; tek oyunculuda da pencere açıkken dünya durur) */
  if(S.started&&holdBuild()){S.held++;S.stats.held++;S.timer=setTimeout(rebuild,250);return;}
  /* finishSaveLoad yüklemede rota kipini, dokunma hareketini ve açık bildirimi sıfırlar; canlı senkronda kullanıcının
     yarım hareketi bozulmasın diye korunur. Kamera View.cam'de; deserialize ona dokunmaz. Seçili filo kimlikle korunur. */
  const keep={route:View.route,routed:View.routed,note:UI._openNote,offer:UI.pendingOffer,sel:View.sel&&View.sel.id},rg=View.resetGesture;
  const t0=performance.now();S.building=true;let ok=false;
  try{View.resetGesture=S.started?function(){}:rg;ok=deserialize(JSON.stringify(S.mirror));if(ok)inboxOffers();}catch{ok=false;}
  finally{View.resetGesture=rg;S.building=false;}
  S.lastBuild=Date.now();
  if(!ok){S.stats.fail=(S.stats.fail||0)+1;S.timer=setTimeout(rebuild,1000);return;}
  G.autoSave=false;G.speed=0;
  if(S.started){View.route=keep.route;View.routed=keep.routed;UI._openNote=keep.note;UI.pendingOffer=keep.offer;
    if(keep.sel!==null&&keep.sel!==undefined&&!View.sel){const f=G.fleets.find(x=>x.id===keep.sel);if(f)View.sel=f;}}
  const ms=performance.now()-t0;S.stats.builds++;S.stats.buildMs.push(Math.round(ms*10)/10);if(S.stats.buildMs.length>60)S.stats.buildMs.shift();
  if(!S.started)start();else{UI.keepScroll=true;try{UI.refresh();}catch{}}
  paintSpeed();
}
/* MP.6.1: MP.3 teklifleri (insan ya da AI → bu oyuncu) gerçek STARS gelen kutusuna 'aideal' kaydı olarak girer.
   Kimlikler aynadaki numaralara çevrilir; kabul/ret DiplomaticInbox.resolve → MP 'respond'. */
function inboxOffers(){
  const v=S.J&&S.J.game.view,me=S.J&&S.J.empireId;if(!v||!v.dip||typeof DiplomaticInbox==='undefined')return;
  for(const o of v.dip.offers){if(o.to!==me||o.status!=='pending'||!G.emps[local(o.from)])continue;
    const strip=l=>l.map(({l:_,...i})=>i),data={from:local(o.from),to:0,give:strip(o.give),want:strip(o.want),born:o.born,expires:o.expires};
    const rec=DiplomaticInbox.capture({kind:'aideal',data,born:o.born,title:(o.round>1?'Karşı teklif':'Teklif')+' — '+o.fn,sub:'Çok oyunculu teklif · tur '+o.round});
    if(rec)rec.mp=o.id;}
}
function start(){
  S.started=true;S.on=true;gate();
  try{leaveTitle(null);}catch{}
  doc.getElementById('menu').classList.add('hidden');doc.getElementById('game').classList.remove('hidden');ov.style.display='none';
  enterGame(true);UI.setSpeed(0);
  View.selSys=G.sys[G.p.home]||null;try{View.center(View.selSys.x,View.selSys.y);}catch{}
  chip();
}

/* ---- 4. host'takiyle AYNI çok oyunculu çubuk ve AYNI MP diplomasi paneli (dip-ui.js / pol-ui.js) ---- */
const V=window.MP1View,esc=V.esc;let chipEl=null,dipEl=null,dipUI=null,polUI=null,dipSeg='trade';const waits={};
function chip(text,good){
  if(!chipEl){chipEl=doc.createElement('div');chipEl.id='mp1Mini';chipEl.className='mp1-mini mp6-mini';(doc.getElementById('app')||doc.body).appendChild(chipEl);   // oyunun kök kabında (STARS katman bağlamı)
    chipEl.addEventListener('click',e=>{if(e.target.closest('[data-g6="dip"]'))dipOpen(true);});}
  if(text!==undefined){const n=dipCount();const h='<div class="mp3-minirow"><span class="mp1-mini-h mp6-conn '+(good?'ok':'bad')+'" id="mp6Conn"><b>ÇOK OYUNCULU</b> · '+esc(text)+'</span>'+
      (window.MP3Dip?'<button class="mp1-btn mp3-hostbtn" data-g6="dip" id="mp6DipBtn">DİPLOMASİ'+(n?' <i class="mp3-badge">'+n+'</i>':'')+'</button>':'')+'</div>';if(chipEl.innerHTML!==h)chipEl.innerHTML=h;
    if(window.MP61)MP61.status(text,good);}
  chipEl.style.display=S.started?'':'none';
}
const view=()=>S.J&&S.J.game.view,day=()=>((S.J&&S.J.game.clock)||{}).day,online=()=>!!(S.J&&S.J.hostOnline);
const sendF=(cmd,done)=>{const r=S.J.cmd(cmd);if(r.ok)waits[r.cid]=done;return r;};
function dipCount(){const v=view();if(!v||!v.dip)return 0;return v.dip.offers.filter(o=>o.to===v.me.id&&o.status==='pending').length+(polUI?polUI.pending():0);}
function dipToast(t,bad){toast(t,bad);}
function dipOpen(on){
  if(!window.MP3Dip)return;
  if(!on){if(dipEl){if(dipUI)dipUI.close();if(polUI)polUI.close();dipEl.remove();dipEl=null;dipUI=null;polUI=null;}return;}
  if(dipEl)return;
  dipEl=doc.createElement('div');dipEl.className='mp3-host';dipEl.id='mp3Host';
  const seg=window.MP31Pol?'<div class="mp31-seg">'+[['trade','TİCARET'],['fed','FEDERASYON'],['vas','VASALLIK']].map(([k,n])=>'<button data-hs="'+k+'">'+n+'</button>').join('')+'</div>':'';
  dipEl.innerHTML='<div class="mp3-host-h"><span>ÇOK OYUNCULU DİPLOMASİ</span><button class="mp1-btn" data-h="close">KAPAT</button></div><div class="mp3-host-b" id="mp3HostBody">'+seg+'<div id="mp3HostT"></div><div id="mp3HostP" hidden></div></div>';
  doc.body.appendChild(dipEl);
  dipEl.querySelector('[data-h="close"]').addEventListener('click',()=>dipOpen(false));
  dipUI=MP3Dip.create({root:doc.getElementById('mp3HostT'),esc,color:V.color,data:()=>({dip:view().dip,me:view().me,day:day()}),online,toast:dipToast,send:sendF});
  if(window.MP31Pol){polUI=MP31Pol.create({root:doc.getElementById('mp3HostP'),esc,color:V.color,data:()=>({pol:view().pol,dip:view().dip,me:view().me,day:day()}),online,toast:dipToast,send:sendF});
    MP31Pol.addCloser(dipUI.close);dipEl.querySelector('.mp31-seg').addEventListener('click',e=>{const b=e.target.closest('[data-hs]');if(b)seg6(b.dataset.hs);});}
  seg6(dipSeg);
}
function seg6(s){dipSeg=s;const T=doc.getElementById('mp3HostT'),P=doc.getElementById('mp3HostP');if(!T)return;T.hidden=s!=='trade';if(P)P.hidden=s==='trade';
  if(dipUI)dipUI.close();if(polUI){polUI.close();if(s!=='trade')polUI.U.sec=s;}dipTick(true);}
function dipTick(force){
  if(dipUI&&dipSeg==='trade')dipUI.render(force);if(polUI&&dipSeg!=='trade')polUI.render(force);
  if(polUI&&dipEl){const c=polUI.counts(),t=dipUI?dipUI.incoming().length:0;for(const [k,n,x] of [['trade','TİCARET',t],['fed','FEDERASYON',c.fed],['vas','VASALLIK',c.vas]]){const b=dipEl.querySelector('[data-hs="'+k+'"]');
    if(!b)continue;const h=n+(x?' <i class="mp3-badge">'+x+'</i>':'');if(b.innerHTML!==h)b.innerHTML=h;b.classList.toggle('on',dipSeg===k);}}
}
function screen(name){
  /* oyun dışı ekranlar (giriş, lobi, oda kapandı) join.js katmanında */
  if(name!=='game'&&S.started){ov.style.display='';doc.getElementById('game').classList.add('hidden');S.on=false;S.started=false;S.mirror=null;chip();}
  else if(name!=='game')ov.style.display='';
}
function update(statusHtml){
  const J=S.J;if(!J)return;
  if(!S.uiSent&&J.empireId!==null&&J.ws&&J.ws.readyState===1){S.uiSent=true;J.sendRaw({v:1,type:'ui',mode:'stars'});}
  const tmp=doc.createElement('div');tmp.innerHTML=statusHtml;const s=tmp.firstChild;
  if(S.started&&s)chip(s.textContent,/\bok\b/.test(s.className));
  else if(!S.started){ov.style.display='';ov.innerHTML=statusHtml+'<div class="mp1-status">Galaksi verisi bekleniyor…</div>';}
  /* host'un reddettiği komutlar: gerçek arayüzün kendi uyarısıyla */
  for(;S.seenResults<J.results.length;S.seenResults++){const r=J.results[S.seenResults];
    if(waits[r.cid]){const w=waits[r.cid];delete waits[r.cid];try{w(r);}catch{}continue;}   // MP diplomasi paneli / gelen kutusu kendi sonucunu gösterir
    if(r.status!=='ok'&&r.code!=='rules:same')toast('Host reddetti: '+why(r),true);}
  if(dipEl)dipTick(false);
}
window.MP6Stars={S,onMessage,update,screen,attach(J){S.J=J;},onAssign(){S.uiSent=false;},VIEW,ACT,dip:{open:dipOpen,seg:seg6,get ui(){return dipUI;},get pol(){return polUI;}}};
/* telefon geri tuşu: önce açık MP diplomasi onayı/paneli kapanır (join.js popstate bunu sorar) */
const prevBack=window.__mpBack;window.__mpBack=()=>{if(prevBack&&prevBack())return true;if(dipEl){dipOpen(false);return true;}return false;};
})();
