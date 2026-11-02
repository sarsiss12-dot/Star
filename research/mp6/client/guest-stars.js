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

const S={swiped:new Set(),decWait:new Map(),warQuote:{},pendingWar:null,counter:null,J:null,mirror:null,rev:0,timer:null,building:false,started:false,on:false,lastBuild:0,minGap:600,uiSent:false,seenResults:0,hostSpd:0,held:0,
  stats:{mirrors:0,deltas:0,bytes:0,builds:0,buildMs:[],resyncs:0,held:0,blocked:{},sent:{},speedMsgs:0},
  /* MP.7: oyun başlangıcı durum makinesi — her aşama yalnız gerçek olay olunca tamamlanır; eksik veri sınırlı geri çekilmeyle
     yeniden istenir (sonsuz bekleme ya da hızlı döngü yok); hata nedeni oyun verisi/jeton/oda anahtarı içermez */
  boot:{since:0,stage:null,tries:0,next:0,fails:0,err:'',failed:false,log:[]}};

/* ---- 1. eylem kapısı ---- */
/* Yalnız görünüm/gezinme (dünyayı değiştirmeyen) eylemler yerelde çalışır. MP.6.1: arşiv/gelen kutusu görünümleri, anlaşma,
   vasallık ve federasyon taslak ekranları da görünümdür (gönderim motor işlevinde MP komutuna çevrilir). */
const VIEW=new Set(['noteQuick','noteSwipe','tab','full','cameraReset','cameraFocus','home','fit','topStatus','diploPane','globalPane','advClose','advShow','advNever','planetFold',
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
  'fedLawPropose','fedLawRepeal','fedLeave','vsSend','vsReply','dealSend',
  /* MP.6.2 — savaş ve ikili siyaset: gerçek pencere açılır, son çağrı MP komutuna iner */
  'war','ally','pact','dealPact','endAlliance','unpact','embargo','unembargo','gift',
  /* MP.6.3 — ortak savaş paylaşımı penceresi (taslak/oy/uygula düğmeleri _hook; son çağrılar MP komutuna iner) */
  'shareOpen',
  /* MP.6.3 — federasyon kararları ve bağımsızlık desteği: motor işlevi MP komutuna iner */
  'fedExecute','fedGrant','supIndep',
  /* MP.6.4 — casusluk: ağ, standart operasyonlar (onay ekranı → host), özel operasyonlar; son çağrılar MP komutuna iner */
  'spy','spySel','spyOpen','spyClear','ops','opDone','runop','opAsk','opGo','saboPick','saboCancel','saboGo','incite','deepInv','ffTarget','ffPatsy','ffGo','stealTech',
  /* MP.6.4 — Galaktik Borsa (seçim görünüm, TAKAS ET → 'market') */
  'mktTrade',
  /* MP.6.4 — kalan filo / koloni işlemleri (motor işlevi MP komutuna iner) */
  'reinf','shipmentMenu','shipmentApply','shipCancel','shipCancelAll','shipCancelConfirm','rallySysSet','rallySysClear','rallySysCancel','terraform','habitat','ldrAssign','ldrHire',
  /* MP.7.1 — Ekonomi Merkezi görünüm eylemleri (runtime economy-ui.js UI.act sarmalayıcısında; kaynak seçimi, süzgeç, kendi sistemine / filosuna git) */
  'ecoPick','ecoFilter','ecoSystem','ecoFleet',
  /* MP.7.1 — salt gezinme: karşı teklif kartında "Düzenlemeye dön", eski diplomasi bağlantıları (ilişki / istihbarat sayfası) */
  'ctrBack','dTab',
  /* MP.7.2 — görünüm / pencere (yerel): elçi penceresi, filo bileşimi penceresi, ortak destek hazırlığı ve haritadan hedef seçimi,
     tekil gemi nişangâhı, eski toplanma düğmesi (yalnız bilgi), savaş bildirimi duraklatma tercihi, savaş raporunu gizleme */
  'envoy','compositionEdit','jointPrepare','jointChooseTarget','aimSet','aimCancel','rallySet','warPauseToggle','dismissBattleReport','gobattle',
  /* MP.7.2 — motor işlevi MP komutuna çevrilen gerçek düğmeler */
  'envoyTask','envoyRecall','compositionSave','compositionAuto','build2','jointRequest','jointCancel','fedWarRequest','ultimatum','patronage',
  /* MP.7.3 — Galaktik Konsey (pencere / tasarı seçimi yerel; son çağrılar motor işlevi sarmalayıcısıyla host komutuna) */
  'cncPane','billPick','bill','billTarget','cncFound','cncJoin','cncLeave','veto','permanent','throneBuild','reform','bribe','blackmail',
  /* MP.7.3 — siyasi entrikalar ve yıkıcı savaş (fısıltı seçimi, Panoptikon hedef kipi, onay pencereleri yerel) */
  'bmGo','fundSep','panoptRetarget','revolt','revoltConfirm','whisperMenu','whisperPick','whisperBlame','whisperGo','devour','devourConfirm','colFire']);
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
  /* MP.6.2: savaş hedefi seçildi → önce host'un önizlemesi (warQuote, ilan edenin kendi bilgisiyle), sonra GERÇEK STARS önizleme
     penceresi bu veriyle açılır; ONAYLA → declareWar/setWarGoal sarmalayıcısı → 'war' komutu */
  setwg:x=>{const [id,key]=String(x).split(':');const cid=send({kind:'warQuote',target:real(+id),goal:key});
    if(cid)waits[cid]=res=>{if(res.status!=='ok'){toast('Host reddetti: '+why(res),true);return;}S.warQuote[id+':'+key]=warLocal(res.extra);UI.warDeclarationPreview(+id,key);};},
  giftDo:x=>{const [id,r,v]=String(x).split(':');const cid=send({kind:'gift',target:real(+id),r,v:+v});
    if(cid)waits[cid]=res=>toast(res.status==='ok'?'Hediye gönderildi; host uyguladı.':'Host reddetti: '+why(res),res.status!=='ok');try{UI.closeModal();}catch{}},
  statuko:x=>{const cid=send({kind:'statusQuo',target:real(+x)});if(cid)waits[cid]=res=>toast(res.status==='ok'?'Statüko barışı: host uyguladı ya da teklif karşı oyuncuya gitti.':'Host reddetti: '+why(res),res.status!=='ok');},
  /* MP.6.4: motor işlevi olmayan tek oyunculu arayüz kuralları → host komutu (aynı kural, yalnız kendi nesnesi) */
  loopSet:x=>{const [s,c]=String(x).split(':');return send({kind:'loop',sys:+s,cls:String(c)});},
  loopOff:x=>send({kind:'loop',sys:+x,cls:null}),
  repairToggle:x=>send({kind:'repair',fleet:+x}),
  ldrUnassign:x=>send({kind:'leader',action:'unassign',leader:+x}),
  colonize:x=>{const [s,p]=String(x).split(':').map(Number),f=sel(),c={kind:'colonize',sys:s,planet:p};if(f&&fleetHasRole(f,'koloni'))c.fleet=f.id;return send(c);},
  /* MP.7.2: motor işlevi olmayan tek oyunculu düğmeler → host komutu (aynı işlem host'ta, yalnız kendi nesnesi) */
  mergeArmed:x=>{const f=G.fleets.find(q=>q.e===0&&q.sys===+x&&q.ships.length&&isArmed(q));return f?send({kind:'merge',fleet:f.id}):toast('Birleşecek savaş filosu yok',true);},   // MP.6.1 'merge' (aynı gruptaki savaş filoları)
  dirTog:x=>{const [s,p]=String(x).split(':').map(Number);return send({kind:'colAuto',sys:s,planet:p});},
  /* MP.7.3: konsey oyu (tek oyunculu cncYes / cncNo devlet 0'ı doğrudan oy listesine yazar) → 'councilVote'; belirteç = oylanan yasa + hedef */
  cncYes:()=>councilVote(true),cncNo:()=>councilVote(false),
  bombMode:x=>{const [f,m]=String(x).split(':');return send({kind:'bombMode',fleet:+f,mode:String(m)});}
};
function councilVote(yes){const c=G.council,v=c&&c.vote;if(!v||v.done)return toast('Açık konsey oylaması yok.',true);
  const tok=v.key+':'+(v.target===null||v.target===undefined?'':real(v.target)),cid=send({kind:'councilVote',token:tok,yes:!!yes});
  if(cid)waits[cid]=res=>toast(res.status==='ok'?'Oyun host\'ta kaydedildi ('+(yes?'EVET':'HAYIR')+').':'Host reddetti: '+why(res),res.status!=='ok');
  try{UI.closeModal();UI.openCouncil();}catch{}return cid;}
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
  /* MP.7.1: runtime UI.act'i kendisi sarıyor (ekonomi arayüzü); String(UI.act) sarmalayıcıyı verdiğinden liste boş kalıyordu
     (düğmeler engelleniyor ama soluk gösterilmiyordu). Liste yine aynı kaynaktan, gerçek act gövdesinden (/ui.js) çıkarılır. */
  const fill=src=>{try{const all=new Set([...String(src).matchAll(/case '([A-Za-z0-9_]+)'/g)].map(m=>m[1]));S.unsupported=[...all].filter(a=>!VIEW.has(a)&&!ACT[a]).sort();
    const st=doc.getElementById('mp6Disabled')||doc.head.appendChild(Object.assign(doc.createElement('style'),{id:'mp6Disabled'}));
    st.textContent=S.unsupported.length?S.unsupported.map(a=>'[data-a="'+a+'"]').join(',')+'{opacity:.42!important;filter:grayscale(.7)}':'';}catch{}};
  if(/case '/.test(String(UI.act)))fill(UI.act);
  else fetch('ui.js').then(r=>r.text()).then(t=>{const i=t.indexOf('  act(a, x, el){');if(i<0)return;const j=t.slice(i+16).search(/\n  [A-Za-z_$][\w$]*\s*\(/);fill(t.slice(i,j<0?undefined:i+16+j));}).catch(()=>{});
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
  wrap('orderMove',(o,f,target,append,automatic)=>{if(automatic||!f||f.e!==0)return false;if(S.aimCol===f.id+':'+(+target)){S.aimCol=null;return true;}return send({kind:'move',fleet:f.id,to:+target})!==null;});
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
  wrap('proposeFedMotion',(o,e,kind,opt)=>{if(!mine(e))return NOT_MP;opt=opt||{};
    if(kind==='admit')return Number.isInteger(opt.target)?r({kind:'fedInvite',target:real(opt.target)}):NOT_MP;
    /* MP.6.3: ihraç, başkan seçimi, reform, anayasa / oy rejimi, savaşa katılma, ortak savaş izni — motorun önerge yolu host'ta */
    const c={kind:'fedMotion',motion:String(kind)};for(const k of ['target','sponsor'])if(Number.isInteger(opt[k]))c[k]=real(opt[k]);
    for(const k of ['type','field','value'])if(typeof opt[k]==='string')c[k]=opt[k];return r(c);});
  /* MP.6.3: kuruluş uygunluğu (AI adaylarının kabulü) aynada hesaplanamaz (AI gözlem kaydı, rota, güven host'ta): gerçek kuruluş
     penceresi host'un motor kararını (fedFoundQuote, salt okuma) gösterir; gelince pencere yeniden çizilir. Kuruluşta host yeniden doğrular. */
  const FF={q:{},wait:{},at:0};
  wrap('canFoundFed',(o,e,type,ballot)=>{if(!mine(e))return o(e,type,ballot);const k=type+':'+ballot,c=FF.q[k];
    if(c&&Date.now()-c.at<8000)return c.v;
    if(!FF.wait[k]){const cid=send({kind:'fedFoundQuote',type:String(type),ballot:String(ballot)});if(cid){FF.wait[k]=1;waits[cid]=res=>{delete FF.wait[k];
      const x=res.status==='ok'?res.extra:{ok:false,reasons:['Host reddetti: '+why(res)],candidates:[],cost:0};
      const allies=(x.candidates||[]).filter(a=>a.ok&&!a.h).map(a=>G.emps[local(a.id)]).filter(Boolean);
      FF.q[k]={at:Date.now(),v:{ok:!!x.ok,why:(x.reasons||[])[0]||'',reasons:x.ok?[]:(x.reasons||[]),allies,candidates:x.candidates||[],cost:x.cost|0}};
      const pane=doc.getElementById('diploPane');if(Date.now()-FF.at<60000&&pane&&pane.classList.contains('show')&&!S.building)try{UI.openFed();}catch{}};}}
    return c?c.v:{ok:false,why:'Host uygunluğu denetliyor…',reasons:['Host uygunluğu denetliyor…'],allies:[],candidates:[],cost:0};});
  const of0=UI.openFed.bind(UI);UI.openFed=function(...a){if(S.on)FF.at=Date.now();return of0(...a);};
  wrap('executeFedDecision',(o,e,fid,id)=>mine(e)?r({kind:'fedExecute',fed:+fid,id:String(id)}):NOT_MP);
  wrap('grantFed',(o,e)=>mine(e)?r({kind:'fedGrant'}):NOT_MP);
  wrap('supportIndep',(o,e,sub)=>mine(e)&&sub?r({kind:'supIndep',sub:real(sub.id)}):NOT_MP);
  wrap('acceptFedInvite',(o,e,fid)=>mine(e)?r({kind:'fedReply',fed:+fid,action:'accept'}):NOT_MP);
  wrap('rejectFedInvite',(o,e,fid)=>mine(e)?r({kind:'fedReply',fed:+fid,action:'reject'}):NOT_MP);
  wrap('castFedVote',(o,e,fid,token,yes)=>mine(e)?r({kind:'fedVote',fed:+fid,token:String(token),yes:!!yes}):NOT_MP);
  wrap('leaveFederation',(o,e)=>mine(e)?r({kind:'fedLeave'}):NOT_MP);
  wrap('proposeFedLaw',(o,e,law,repeal)=>mine(e)?r({kind:'fedLaw',law:String(law),repeal:!!repeal}):NOT_MP);
  wrap('vassalOffer',(o,e,other,mode,type,terms)=>mine(e)&&other?r({kind:'vassalOffer',to:real(other.id),mode:String(mode),type:String(type),terms:vasTerms(type,terms)}):NOT_MP);
  wrap('vassalReply',(o,actor,sub,id,round,action,terms)=>mine(actor)?r({kind:'vassalReply',sub:real(+sub),id:String(id),round:round|0,action:String(action),...(action==='counter'?{terms:vasTerms(null,terms)}:{})}):NOT_MP);
  /* MP.7.2 — elçi: gerçek elçi penceresi (görev / geri çağırma) → 'envoy' (motorun setEnvoyTask / recallEnvoy'u host'ta) */
  const hostSays=(c,ok)=>{const cid=send(c);if(cid)waits[cid]=res=>toast(res.status==='ok'?(ok?ok(res):'Host uyguladı.'):'Host reddetti: '+why(res),res.status!=='ok');return cid;};
  wrap('setEnvoyTask',(o,e,id,task)=>{if(!mine(e)||!Object.prototype.hasOwnProperty.call(ENVOY_TASKS,task))return o(e,id,task);const old=e.envoy&&e.envoy[id];   // geçersiz görev: motorun kendi reddi (dünya değişmez)
    return hostSays({kind:'envoy',target:real(+id),task:String(task)},()=>'Elçi görevi host\'ta uygulandı.')?{ok:true,changed:true,action:old?'change':'send'}:{ok:false,why:'Host bağlı değil; emir gönderilmedi.'};});
  wrap('recallEnvoy',(o,e,id)=>{if(!mine(e))return o(e,id);return hostSays({kind:'envoy',target:real(+id),task:null},()=>'Elçi geri çekildi; host uyguladı.')?{ok:true,changed:true,action:'recall'}:{ok:false,why:'Host bağlı değil; emir gönderilmedi.'};});
  /* MP.7.2 — filo bileşimi: gerçek bileşim penceresi (kaydet / otomatik) → 'composition' (motorun setFleetTemplate'i host'ta) */
  wrap('setFleetTemplate',(o,e,f,counts,auto)=>{if(!mine(e)||!f)return o(e,f,counts,auto);const k={};for(const c of fleetTemplateClasses())k[c]=Math.max(0,Math.round(+counts[c]||0));
    return hostSays({kind:'composition',fleet:f.id,counts:k,auto:!!auto},()=>'Filo bileşimi host\'ta kaydedildi.')?{ok:true}:{ok:false,why:'Host bağlı değil; emir gönderilmedi.'};});
  /* MP.7.2 — inşaat gemisiyle yapı (build2) → 'struct' (motorun startStruct'ı host'ta) */
  wrap('startStruct',(o,e,sys,key,f)=>{if(!mine(e)||!sys)return o(e,sys,key,f);return !!hostSays({kind:'struct',sys:sys.id,key:String(key),fleet:f?f.id:null},()=>'İnşaat host\'ta başladı.');});
  /* MP.7.2 — ortak askerî destek: talep / iptal → 'jointRequest' / 'jointCancel'. Panel verisi (müttefikler, aynı sefer, planlar)
     host'un 'joint' görünümünden: aynada savaş defteri ve ortak sefer kaydı yok. */
  const jv=()=>{const v=hv();return v&&v.joint||{allies:[],plans:[]};};
  wrap('jointBinding',(o,a,b)=>{if(mine(a)&&b&&b.ai){const x=jv().allies.find(y=>y.id===real(b.id));return x?{kind:'mp'}:null;}return o(a,b);});
  wrap('jointView',(o,e)=>{if(!mine(e))return o(e);const L=id=>Number.isInteger(id)?local(id):id;
    return jv().plans.map(p=>({...p,requester:L(p.requester),members:p.members.map(L),responses:Object.fromEntries(Object.entries(p.responses||{}).map(([k,v])=>[L(+k),v])),
      fleets:(p.fleets||[]).map(f=>({...f,owner:L(f.owner)}))}));});
  wrap('jointRequest',(o,e,recipient,kind,target)=>{if(!mine(e))return o(e,recipient,kind,target);
    const cid=send({kind:'jointRequest',ally:real(+recipient),type:String(kind),target:+target});if(!cid)return {ok:false,why:'Host bağlı değil; talep gönderilmedi.'};
    waits[cid]=res=>{UI._jointFeedback=res.status==='ok'?'Kabul: '+((res.extra&&res.extra.why)||'Destek görevi değerlendirildi'):'Ret: '+why(res);toast(UI._jointFeedback,res.status!=='ok');try{UI.keepScroll=true;UI.refresh();}catch{}};
    setTimeout(()=>{if(UI._jointFeedback&&/^Kabul: Talep host/.test(UI._jointFeedback))return;UI._jointFeedback='Talep host\'a gönderildi; müttefikin yanıtı bekleniyor…';try{UI.keepScroll=true;UI.refresh();}catch{}},0);
    return {ok:true,why:'Talep host\'a gönderildi'};});
  wrap('jointCancel',(o,e,id)=>mine(e)?(hostSays({kind:'jointCancel',plan:+id},()=>'Destek talebi iptal edildi; gemiler korunuyor.')?{ok:true}:{ok:false,why:'Host bağlı değil.'}):o(e,id));
  /* aynı sefer denetimi aynada yapılamaz (savaş defteri yok). Misafir sayfasının CSP'si eval'e izin vermez; bu yüzden panel çizilirken
     YALNIZ o çağrı süresince motorun kendi yolu (G.warLedger → warLedgerPair → jointContext) host'un kararıyla beslenir ve sonra geri yüklenir. */
  const jp0=UI.jointPanel;
  UI.jointPanel=function(...a){if(!S.on)return jp0.apply(this,a);const shared=jv().allies.filter(x=>x.shared).map(x=>local(x.id));
    const L0=G.warLedger,P0=window.warLedgerPair,C0=window.jointContext;
    G.warLedger={v:1,next:1,fronts:[{campaign:'mp72',ended:null,sides:[0,-7],roles:[0,1]}]};
    window.warLedgerPair=(x,y)=>x===0&&y===-7||y===0&&x===-7?true:P0(x,y);
    window.jointContext=(c,...r)=>c==='mp72'?{members:[0,...shared]}:C0(c,...r);
    try{return jp0.apply(this,a);}finally{G.warLedger=L0;window.warLedgerPair=P0;window.jointContext=C0;}};
  S.jointPatched=true;
  /* MP.7.2 — federasyon savaş izni önerisi → 'fedWar' (motorun proposeFedWar'ı; insan üyelerin oyu kendi gelen kutusunda) */
  wrap('proposeFedWar',(o,a,b)=>mine(a)&&b?r({kind:'fedWar',target:real(b.id)}):o(a,b));
  /* MP.7.2 — ültimatom / himaye: hedef AI ise motor karar verir (host'ta); insan hedef host'ta reddedilir. Sonuç bildirim olarak gelir. */
  const dice=(kind,b,label)=>{const cid=send({kind,target:real(b.id)});if(!cid)return {ok:false,why:'Host bağlı değil; gönderilmedi.'};
    waits[cid]=res=>toast(res.status==='ok'?(res.extra&&res.extra.msg||'Host uyguladı.'):'Host reddetti: '+why(res),res.status!=='ok'||!(res.extra&&res.extra.kabul));
    return {ok:true,kabul:true,msg:label+' host\'a gönderildi; yanıt bildirim olarak gelecek.'};};
  wrap('sendUltimatum',(o,e,t)=>mine(e)&&t?dice('ultimatum',t,'Ültimatom'):o(e,t));
  wrap('offerPatronage',(o,e,t)=>mine(e)&&t?dice('patronage',t,'Himaye teklifi'):o(e,t));
  /* MP.7.2 — tekil gemi nişangâhı (aimSet): koloni gemisi hedefte boş gezegen bulursa 'colonize' (rota + hak talebi host'ta);
     ardından gelen aynı hedefli yerel orderMove ayrıca 'move' göndermez */
  wrap('claimColony',(o,f,sys,pi)=>{if(!f||f.e!==0||!sys||!sys.planets[pi])return false;const cid=send({kind:'colonize',sys:sys.id,planet:sys.planets[pi].i,fleet:f.id});
    if(cid)S.aimCol=f.id+':'+sys.id;return !!cid;});
  /* MP.7.3 — Galaktik Konsey: gerçek Konsey ekranının motor işlevleri → host komutları (kural, maliyet, zar host'ta) */
  wrap('foundCouncil',(o,e)=>mine(e)?r({kind:'councilFound'}):o(e));
  wrap('joinCouncil',(o,e)=>mine(e)?!!hostSays({kind:'councilJoin'},()=>'Konseye katıldın; host uyguladı.'):o(e));
  wrap('leaveCouncil',(o,e)=>mine(e)?!!hostSays({kind:'councilLeave'},()=>'Konseyden ayrıldın; host uyguladı.'):o(e));
  wrap('proposeBill',(o,e,key,t)=>mine(e)?r({kind:'bill',key:String(key),target:Number.isInteger(t)?real(t):null}):o(e,key,t));
  wrap('guardianVeto',(o,e,key)=>mine(e)?r({kind:'veto',law:String(key)}):o(e,key));
  wrap('claimPermanent',(o,e)=>{if(!mine(e))return o(e);return hostSays({kind:'permanent'},res=>res.extra&&res.extra.gecti?'👑 DAİMİ HÜKÜMDARLIK İLAN EDİLDİ':'Konsey daimi hükümdarlığı reddetti.')?{ok:true}:{ok:false,why:'Host bağlı değil.'};});
  wrap('rebuildThrone',(o,e,sys)=>mine(e)&&sys?r({kind:'throne',sys:sys.id}):o(e,sys));
  wrap('doReform',(o,e,axis,dir)=>mine(e)?r({kind:'reform',axis:String(axis),dir:+dir>0?1:-1}):o(e,axis,dir));
  wrap('bribeVote',(o,e,t,miktar,yon)=>mine(e)&&t?r({kind:'bribe',target:real(t.id),yon:yon==='no'?'no':'yes'}):o(e,t,miktar,yon));
  wrap('blackmailVote',(o,e,t,yon)=>{if(!mine(e)||!t)return o(e,t,yon);const cid=send({kind:'blackmail',target:real(t.id),yon:yon==='no'?'no':'yes'});if(!cid)return {ok:false,why:'Host bağlı değil.'};
    waits[cid]=res=>toast(res.status==='ok'?(res.extra.caught?'☠ ':'🕵 ')+res.extra.msg:'Host reddetti: '+why(res),res.status!=='ok'||res.extra.caught);
    return {ok:true,caught:false,msg:'Şantaj host\'a gönderildi; sonuç bildirim olarak gelecek.'};});
  /* MP.7.3 — siyasi entrikalar: zar ve sonuç yalnız host'ta; misafir ekranı yalnız gönderildiğini gösterir, sonuç host'tan */
  wrap('blackmailLeader',(o,e,t,lid)=>{if(!mine(e)||!t)return o(e,t,lid);const cid=send({kind:'bmLeader',target:real(t.id),leader:+lid});if(!cid)return {ok:false,why:'Host bağlı değil.'};
    waits[cid]=res=>toast(res.status==='ok'?(res.extra.basarili?'Lider şantajı başarılı.':res.extra.ifsa?'☠ Lider şantajı ifşa oldu.':'Ajanlarımız belge bulamadı.'):'Host reddetti: '+why(res),res.status!=='ok'||!res.extra.basarili);
    return {ok:true,basarili:true};});
  wrap('fundSeparatists',(o,e,v)=>mine(e)&&v?r({kind:'fundSep',target:real(v.id)}):o(e,v));
  wrap('panopticonLock',(o,e,from,to)=>mine(e)?r({kind:'panopt',from:+from,to:+to}):o(e,from,to));
  wrap('playerRevolt',o=>S.on?r({kind:'revolt'}):o());
  wrap('playerWhisper',(o,a,b,c)=>{if(!a||!b)return o(a,b,c);const cid=send({kind:'whisper',a:real(a.id),b:real(b.id),blame:c?real(c.id):null});if(!cid)return {ok:false,why:'Host bağlı değil.'};
    waits[cid]=res=>toast(res.status==='ok'?(res.extra.ifsa?'☠ Fısıltı ifşa oldu.':res.extra.basari?'Fısıltı işe yaradı.':'Fısıltı tutmadı.'):'Host reddetti: '+why(res),res.status!=='ok'||res.extra.ifsa);
    return {ok:true,basari:false,ifsa:false,cost:WHISPER_COST,msg:'Fısıltı host\'a gönderildi; sonuç bildirim olarak gelecek'};});
  /* MP.7.3 — yıkıcı savaş: onay penceresi yerel (motorun kendi önizlemesi); son çağrı host'ta yeniden denetlenir */
  wrap('devourPlanet',(o,e,sys,pl)=>mine(e)&&sys&&pl?r({kind:'devour',sys:sys.id,planet:pl.i}):o(e,sys,pl));
  wrap('colossusFire',(o,f,pl,mod)=>f&&f.e===0?!!hostSays({kind:'colFire',fleet:f.id,mod:String(mod)},()=>'Kolossus ateşlendi; host uyguladı.'):o(f,pl,mod));
  /* MP.6.2 — savaş ilanı: gerçek önizleme penceresi host'un önizlemesiyle (warQuote) çizilir; erişim ve son karar host'ta.
     declareWar yalnız hedefi işaretler; ardından gelen setWarGoal hedef+amaçla TEK 'war' komutu gönderir. */
  wrap('warDeclarationPreview',(o,actor,target,key)=>mine(actor)&&target&&S.warQuote[target.id+':'+key]?S.warQuote[target.id+':'+key]:o(actor,target,key));
  wrap('warDeclarationAccess',(o,a,b,opt)=>mine(a)&&b&&Object.keys(S.warQuote).some(k=>k.startsWith(b.id+':'))?{ok:true,why:''}:o(a,b,opt));
  wrap('declareWar',(o,a,b)=>{if(!mine(a)||!b)return false;S.pendingWar=b.id;return true;});
  wrap('setWarGoal',(o,e,foe,key)=>{if(!mine(e)||!foe||S.pendingWar!==foe.id)return false;S.pendingWar=null;delete S.warQuote[foe.id+':'+key];
    const cid=send({kind:'war',target:real(foe.id),goal:String(key)});
    if(cid)waits[cid]=res=>toast(res.status==='ok'?'Savaş ilanı host\'ta uygulandı — '+(foe.name||''):'Host reddetti: '+why(res),res.status!=='ok');return !!cid;});
  /* MP.6.2 — misafirin aynasında eksik olan veriye dayanan düğme kapıları host'un kararını kullanır (MP.2/MP.3.1 görünümü):
     statüko (işgal haritası), federasyona başvuru (aracı üyenin Etkisi) ve üye kabul önergesi (adayın ittifak bağları). */
  const hv=()=>S.J&&S.J.game&&S.J.game.view;
  wrap('canStatusQuo',(o,a,b)=>{if(mine(a)&&b){const c=hv()&&hv().dip&&hv().dip.contacts.find(x=>x.id===real(b.id));if(c&&c.sq!==undefined)return {ok:!!c.sq,why:c.sqw||''};}return o(a,b);});
  wrap('canRequestFederation',(o,e,via)=>{if(mine(e)&&via){const p=hv()&&hv().pol;const v=p&&(p.others||[]).flatMap(x=>x.vias||[]).find(x=>x.id===real(via.id));if(v)return {ok:!!v.ok,why:v.why||''};}return o(e,via);});   // aracı üyenin Etkisi kabukta yok: MP.3.1 polView kararı
  wrap('canFedMotion',(o,e,kind,opt)=>{if(mine(e)&&kind==='admit'&&opt&&Number.isInteger(opt.target)){const f=hv()&&hv().pol&&hv().pol.fed,row=f&&(f.admit||[]).find(x=>x.id===real(opt.target));if(row)return {ok:!!row.ok,why:row.why};}return o(e,kind,opt);});
  /* MP.6.3 — vasallık giriş kapıları: güç oranı ve karşı tarafın vasalları aynada eksik (kabuk) → MP.3.1 polView'daki host kararı */
  const vcand=o=>{const p=hv()&&hv().pol;return p&&p.vas&&(p.vas.cand||[]).find(x=>x.id===real(o.id));};
  wrap('canSeekProtection',(o,e,t)=>{if(mine(e)&&t){const c=vcand(t);if(c)return {ok:!c.seek,why:c.seek||''};}return o(e,t);});
  wrap('canDemandVassal',(o,e,t)=>{if(mine(e)&&t){const c=vcand(t);if(c)return {ok:!c.demand,why:c.demand||''};}return o(e,t);});
  /* MP.6.4 — casusluk. Aynada hedefin kabuğu var (teknoloji/stok/koloni gizli): onay ekranının değerleri (maliyet, ifşa yüzdesi,
     seviye, uygunluk) host'un opQuote'undan (spyQuote, salt okuma, önbellekli); zar ve sonuç yalnız host'ta (spyOp / spySpecial).
     Sonuç gelince GERÇEK STARS sonuç penceresi host'un sonucuyla çizilir (opExecute yeniden çağrılır, runOp önbellekten döner). */
  wrap('assignSpy',(o,e,id)=>{if(!mine(e))return o(e,id);return !!send({kind:'spyAssign',target:real(+id)});});
  wrap('opQuote',(o,e,t,key)=>{const q=o(e,t,key);if(!mine(e)||!t||!q||!q.op)return q;const h=spyQ(t.id),x=h&&h.ops[key];
    if(!x)return {...q,ok:false,why:'Host operasyonu denetliyor…'};
    return {...q,ok:x.ok,why:x.why,cost:x.cost,riskPct:x.riskPct,risk:x.riskPct/100,lvlHave:x.lvlHave,afford:x.afford,viable:x.viable,viableDesc:x.viableDesc};});
  const oe0=UI.opExecute.bind(UI);UI.opExecute=function(...a){if(S.on)SPY.pend=this._opPending;return oe0(...a);};
  wrap('runOp',(o,e,t,key)=>{if(!mine(e)||!t)return o(e,t,key);const k=t.id+':'+key;if(SPY.res[k]){const r=SPY.res[k];delete SPY.res[k];return r;}
    const q=opQuote(e,t,key),pend=SPY.pend;SPY.pend=null;
    const cid=send({kind:'spyOp',target:real(t.id),op:String(key),cost:JSON.stringify(q.cost||{}),riskPct:q.riskPct|0});if(!cid)return {ok:false,msg:'Host bağlı değil; operasyon gönderilmedi.'};
    waits[cid]=res=>{if(res.status!=='ok'){toast('Host reddetti: '+why(res),true);delete SPY.q[t.id];return;}
      SPY.res[k]={ok:true,msg:res.extra.msg,caught:!!res.extra.caught,key,target:t.id};
      if(pend){const tq=opQuote(G.p,G.emps[pend.id],key);UI._opPending={...pend,actor:G.p,target:G.emps[pend.id],emps:G.emps,systems:G.sys,cost:JSON.stringify(tq.cost),risk:tq.risk};
        try{UI.opExecute(pend.id,pend.key,pend.token);}catch{}}
      delete SPY.res[k];delete SPY.q[t.id];};
    return {ok:false,msg:'Operasyon host\'a gönderildi — sonuç birazdan gelecek.'};});
  wrap('canSabotage',(o,e,t,tur)=>{if(!mine(e)||!t)return o(e,t,tur);const h=spyQ(t.id),x=h&&h.sabo[tur];
    return x?{ok:x.ok,why:x.why,hedefler:x.targets.map(id=>G.sys[id]).filter(Boolean)}:{ok:false,why:'Host denetliyor…'};});
  wrap('canIncite',(o,e,t)=>{if(!mine(e)||!t)return o(e,t);const h=spyQ(t.id);return h?{...h.incite}:{ok:false,why:'Host denetliyor…'};});
  const special=(c,quiet)=>{const cid=send(c);if(!cid)return {ok:false,why:'Host bağlı değil; operasyon gönderilmedi.'};
    waits[cid]=res=>{if(res.status!=='ok'){toast('Host reddetti: '+why(res),true);return;}const x=res.extra||{};toast((x.caught?'☠ ':'')+(x.msg||'Operasyon host\'ta uygulandı.'),!!x.caught);delete SPY.q[c.target!==undefined?local(c.target):-1];};
    return {ok:true,caught:false,sys:true,basarili:true,cozuldu:false,savas:false,msg:'',...quiet};};
  wrap('doSabotage',(o,e,t,tur,sys)=>mine(e)&&t?special({kind:'spySpecial',op:'sabotage',target:real(t.id),tur:String(tur),sys:+sys}):NOT_MP);
  wrap('inciteRebellion',(o,e,t)=>mine(e)&&t?special({kind:'spySpecial',op:'incite',target:real(t.id)}):NOT_MP);
  wrap('deepInvestigate',(o,e)=>mine(e)?special({kind:'spySpecial',op:'deepInv'},{msg:'Soruşturma host\'a gönderildi.'}):NOT_MP);
  wrap('falseFlagOp',(o,e,t,p,tur)=>mine(e)&&t&&p?special({kind:'spySpecial',op:'falseFlag',target:real(t.id),patsy:real(p.id),tur:String(tur||'')},{msg:'Sahte bayrak host\'a gönderildi.'}):NOT_MP);
  wrap('stealTech',(o,e,t)=>mine(e)&&t?special({kind:'spySpecial',op:'stealTech',target:real(t.id)}):NOT_MP);
  /* MP.6.4 — kalan filo / koloni işlemleri: gerçek düğmenin motor işlevi → komut (sahiplik, maliyet, koşul host'ta) */
  wrap('reinforceFleet',(o,e,f)=>mine(e)&&f?r({kind:'reinforce',fleet:f.id}):NOT_MP);
  wrap('shipmentAction',(o,e,f,action,target)=>{if(!mine(e)||!f)return NOT_MP;const t=target&&target.fleet!==undefined?{fleet:+target.fleet}:target&&Number.isInteger(target.sys)?{sys:target.sys}:undefined;
    return r({kind:'shipment',fleet:f.id,action:String(action),...(t?{target:t}:{})});});
  wrap('cancelShipOrders',(o,e,sys,orders,all)=>{if(!mine(e)||!sys)return NOT_MP;const own=(sys.queue||[]).filter(q=>q.e===0),idx=(orders||[]).map(q=>own.indexOf(q));
    if(idx.some(i=>i<0))return {ok:false,why:'Kuyruk değişti; siparişi yeniden seç.'};const x=r({kind:'shipCancel',sys:sys.id,orders:idx,all:!!all});return x.ok?{...x,count:idx.length}:x;});
  wrap('setRally',(o,e,sys,t)=>mine(e)&&sys?r({kind:'rally',sys:sys.id,target:t===null||t===undefined?null:+t}):NOT_MP);
  wrap('startTerraform',(o,e,sys,pl)=>mine(e)&&sys&&pl&&sys.planets?r({kind:'terraform',sys:sys.id,planet:pl.i}):NOT_MP);
  wrap('buildHabitat',(o,e,sys,pl)=>mine(e)&&sys&&pl?!!send({kind:'habitat',sys:sys.id,planet:pl.i}):false);
  wrap('recruitLeader',(o,e,tip)=>mine(e)?r({kind:'leader',action:'hire',tip:String(tip)}):NOT_MP);
  wrap('assignLeader',(o,e,id,tip,t)=>{if(!mine(e))return NOT_MP;const x=r({kind:'leader',action:'assign',leader:+id,tip:String(tip),target:String(tip==='amiral'?+t:t)});
    return x.ok?{...x,leader:{name:'Lider'}}:x;});
  /* MP.6.4 — Galaktik Borsa: durum ve fiyatlar host'tan (aynada konsey yok); TAKAS ET → 'market' (beklenen sonuçla; fiyat
     değiştiyse host 'stale' ile güncel teklifi döner, işlem yapılmaz) */
  const mv=()=>hv()&&hv().mkt;
  wrap('marketOpen',o=>{const m=mv();return m?!!m.open:o();});
  wrap('marketFeeNow',o=>{const m=mv();return m&&typeof m.fee==='number'?m.fee:o();});
  wrap('marketInit',o=>{const m=mv();if(m&&m.mul){G.market={mul:{...m.mul},hist:[],acildi:0};return G.market;}return o();});
  wrap('marketTrade',(o,e,sat,al,mik)=>{if(!mine(e))return o(e,sat,al,mik);const q=marketQuote(sat,al,+mik);
    const cid=send({kind:'market',sat:String(sat),al:String(al),amount:Math.round(+mik)||0,...(q&&q.ok?{expect:Math.round(q.alinan*100)/100}:{})});
    if(!cid)return {ok:false,why:'Host bağlı değil; takas gönderilmedi.'};
    waits[cid]=res=>{toast(res.status==='ok'?'Takas host\'ta uygulandı: '+Math.round(res.extra.alinan)+' '+(RES[al]?RES[al].n:al):'Host reddetti: '+why(res),res.status!=='ok');try{if(doc.getElementById('diploPane').classList.contains('show'))UI.openMarket();}catch{}};
    return {ok:true};});
  /* MP.6.2 — ittifakı sonlandır, ticaret anlaşmasını feshet, ambargo: gerçek onay pencereleri → komut */
  wrap('endAlliance',(o,e,other)=>mine(e)&&other?r({kind:'endAlliance',target:real(other.id)}):NOT_MP);
  wrap('breakPact',(o,a,b)=>{if(!mine(a)||!b)return o(a,b);send({kind:'unpact',target:real(b.id)});});
  wrap('setEmbargo',(o,e,t,on)=>{if(!mine(e)||!t)return false;return !!send({kind:'embargo',target:real(t.id),on:!!on});});
  /* MP.6.3 — ortak savaş ganimeti paylaşımı: GERÇEK STARS penceresi (UI.openSettlement) host'un verisiyle çizilir. Aynada sefer
     kaydı yok; durum, görünürlük, uygulama kapısı ve teklif nesneleri host'un 'settle' görünümünden (yalnız katılımcıya),
     taslak önizlemesi host'un motorundan (settleQuote). Oy / sun / uygula / geri çek → MP komutu; oyu yalnız bu oyuncu verir. */
  wrap('settlementState',(o,x)=>x&&x.__mp?{state:x.state,why:x.why||''}:o(x));
  wrap('settlementVisible',(o,e,row)=>row&&row.__mp?!!row.vis:o(e,row));
  wrap('settlementOffer',(o,id)=>SET.offers.get(id)||o(id));
  wrap('settlementApplyQuote',(o,e,id)=>{const x=SET.offers.get(id);if(!x)return o(e,id);return x.apply&&x.apply.ok?{ok:true,offer:x,transfers:[]}:{ok:false,why:(x.apply&&x.apply.why)||x.why||'Uygulanabilir ortak onayı yok'};});
  wrap('settlementPreview',(o,e,campaign,assign)=>{if(!mine(e))return o(e,campaign,assign);const key=campaign+'|'+JSON.stringify(assign||null);
    if(SET.quotes[key])return SET.quotes[key];
    if(!SET.wait[key]){const a=assign?Object.fromEntries(Object.entries(assign).map(([k,v])=>[k,real(+v)])):null,cid=send({kind:'settleQuote',campaign:+campaign,assign:a});
      if(cid){SET.wait[key]=1;waits[cid]=res=>{delete SET.wait[key];SET.quotes[key]=res.status==='ok'?setQuote(res.extra):{ok:false,why:'Host reddetti: '+why(res)};
        const L=SET.last;if(L&&L[0]===campaign&&setShown())UI.openSettlement(...L);};}}
    return {ok:false,why:'Paylaşım taslağı host\'un motorundan alınıyor…'};});
  const sres=(c,okText)=>{const cid=send(c);if(!cid)return {ok:false,why:'Host bağlı değil; karar gönderilmedi.'};
    waits[cid]=res=>{toast(res.status==='ok'?okText:'Host reddetti: '+why(res),res.status!=='ok');SET.quotes={};};return {ok:true,state:'pending'};};
  wrap('settlementSubmit',(o,e,campaign,stamp,assign)=>mine(e)?sres({kind:'settleSubmit',campaign:+campaign,stamp:String(stamp),assign:assign?Object.fromEntries(Object.entries(assign).map(([k,v])=>[k,real(+v)])):null},'Paylaşım teklifi host\'ta kaydedildi; ortakların onayı bekleniyor.'):NOT_MP);
  wrap('settlementVote',(o,e,id,yes)=>mine(e)?sres({kind:'settleVote',offer:+id,yes:!!yes},yes?'Onayın host\'ta kaydedildi.':'Reddin host\'ta kaydedildi.'):NOT_MP);
  wrap('settlementApply',(o,e,id)=>mine(e)?sres({kind:'settleApply',offer:+id},'Paylaşım host\'ta uygulandı.'):NOT_MP);
  wrap('settlementWithdraw',(o,e,id)=>mine(e)?sres({kind:'settleWithdraw',offer:+id},'Teklif geri çekildi.'):NOT_MP);
  const os0=UI.openSettlement.bind(UI);UI.openSettlement=function(...a){if(S.on)SET.last=a;return os0(...a);};
  /* taslak girişi: tek oyunculuda savaş katkı kaydından (aynada sefer kaydı yok) — host'un "taslak açılabilir" listesi aynı düğmeyle */
  const sa0=UI.settlementAgenda.bind(UI);UI.settlementAgenda=function(){const h=sa0();if(!S.on)return h;const v=hv(),d=v&&v.settle?v.settle.drafts:[];
    return h+(d.length?'<details class="dcDetails" open><summary>Ortak savaş paylaşımı taslakları</summary>'+d.map(c=>'<button class="abtn" data-a="shareOpen" data-x="'+(+c)+'">⚖ Sefer '+(+c)+' · Paylaşım taslağı hazırla</button>').join('')+
      '<div class="mini">Seferdeki bütün cepheler kapandı. Taslak host\'un motorunda hazırlanır; sunmak oy vermek değildir.</div></details>':'');};
  /* MP.6.1 — gerçek anlaşma penceresi: GÖNDER → MP.3 'offer' (yalnız MP.3'ün desteklediği maddeler: kaynak ve barış).
     Karşı tarafın stoğu aynada yok; uygunluğu host denetler ve sonucu bildirir. */
  const dealSend0=UI.dealSend.bind(UI);
  UI.dealSend=function(){if(!S.on)return dealSend0();this.ensureDiploWorld();const d=this.deal;if(!d)return;
    const items=l=>(l||[]).map(i=>i&&i.t==='res'&&Number.isInteger(i.v)?{t:'res',r:i.r,v:i.v}:i&&TREATY.includes(i.t)?{t:i.t}:null);
    const give=items(d.give),want=items(d.want);
    if(give.includes(null)||want.includes(null)){this.dealMsg='Çok oyunculuda kaynak, barış ve antlaşma maddeleri (saldırmazlık, ticaret, ittifak, sensör, geçiş) gönderilebilir; teknoloji, sistem, haraç, lüks, savaş sözü ve casusluk ağı henüz yok.';this.drawDeal();return;}
    if(!give.length&&!want.length){this.dealMsg='Teklif boş.';this.drawDeal();return;}
    const ctr=S.counter&&S.counter.to===d.to?S.counter:null;
    const cid=send(ctr?{kind:'counter',offer:ctr.offer,give,want}:{kind:'offer',to:real(d.to),give,want});if(ctr)S.counter=null;
    this.dealMsg=cid?'Teklif host\'a gönderildi; yanıt gelen kutuna ve bildirimlere düşer.':'Host bağlı değil; teklif gönderilmedi.';
    if(cid)waits[cid]=res=>{const ai=res.status==='ok'&&res.extra&&res.extra.ai,R=window.MP71Dip?MP71Dip.AI_REPLY:{};
      toast(res.status==='ok'?(ai?(G.emps[d.to]?.name||'')+' '+(R[ai]||ai):'Teklif gönderildi — '+(G.emps[d.to]?.name||'')+'. Durum: Gelen kutusu → Gönderilen.'):'Host reddetti: '+(window.MP71Dip?MP71Dip.why(res):why(res)),res.status!=='ok');};
    if(cid){const to=d.to,m=this.dealMsg;this.forgetDeal(to);this.openDeal(to);this.dealMsg=m;}   // gönderilen taslak temizlenir (tek oyunculuda imzada forgetDeal)
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
  /* MP.7.4: kaydırılan kartın imzası saklanır (ayna G.inbox'ı her kurulumda yeniler) */
  if(typeof UI.noteSwipe==='function'){const ns0=UI.noteSwipe.bind(UI);UI.noteSwipe=function(uid){const it=(G.inbox||[]).find(n=>n.uid===+uid),ok=ns0(uid);if(ok&&it&&S.on)S.swiped.add(noteSig(it));return ok;};}
  const DI=DiplomaticInbox,resolve0=DI.resolve.bind(DI),gate0=DI.gate.bind(DI);
  DI.gate=function(rec){if(S.on&&rec&&(rec._mpWait||rec.mp&&S.decWait.has('respond:'+rec.mp+':')))return {ok:false,why:'Karar gönderildi; host yanıtı bekleniyor'};if(S.on&&rec&&rec.mpSq!==undefined){return rec.status==='pending'?{ok:true,why:''}:{ok:false,why:'Teklif sonuçlandı',terminal:true};}
    if(S.on&&rec&&rec.mp){if(rec.status!=='pending')return {ok:false,why:'Teklif sonuçlandı',terminal:true};return {ok:true,why:''};}return gate0(rec);};
  DI.resolve=function(id,yes,option,world){
    if(!S.on)return resolve0(id,yes,option,world);
    const rec=this.get(id);if(!rec||rec.status!=='pending')return {ok:false,why:'Teklif geçersiz'};
    let c=null;
    if(rec.mpSq!==undefined)c={kind:'statusQuoReply',from:rec.mpSq,accept:!!yes};
    else if(rec.mp)c={kind:'respond',offer:rec.mp,action:yes?'accept':'reject'};
    else if(rec.kind==='invite')c={kind:'fedReply',fed:rec.fid,action:yes?'accept':'reject'};
    else if(rec.kind==='fedvote')c={kind:'fedVote',fed:rec.fid,token:String(rec.token),yes:!!yes};
    else if(rec.kind==='vassal'){const q=G.emps[rec.fid]?.vassalTalk;if(!q)return {ok:false,why:'Müzakere bulunamadı'};c={kind:'vassalReply',sub:real(rec.fid),id:q.id,round:q.round,action:yes?'accept':'reject'};}
    if(!c)return NOT_MP;
    /* MP.7.4: çift dokunma ikinci komut göndermez — bekleyen karar komut hedefine göre tutulur (ayna kaydı yeniden kursa da) */
    const dk=decKey(c);if(S.decWait.has(dk))return {ok:false,why:'Karar gönderildi; host yanıtı bekleniyor'};
    const cid=send(c);if(cid)S.decWait.set(dk,cid);if(!cid)return {ok:false,why:'Host bağlı değil; karar gönderilmedi.'};
    /* MP.7.4: sonuç host'tan gelene kadar kayıt BEKLİYOR kalır (iyimser "kabul edildi" yok); kart ve gelen kutusu yanıtla güncellenir */
    rec._mpWait=cid;rec.why='Karar host\'a gönderildi — yanıt bekleniyor';
    waits[cid]=res=>{delete rec._mpWait;S.decWait.delete(dk);
      if(res.status==='ok'){rec.status=yes?'accepted':'rejected';rec.finished=G.day;rec.why='';G.inbox=(G.inbox||[]).filter(n=>!(rec.mp&&n.key==='mp71:'+rec.mp)&&n.rec!==rec.id&&!(rec.note&&n.uid===rec.note.uid));}
      else rec.why='Host reddetti: '+why(res);
      toast(res.status==='ok'?'Kararın host\'ta uygulandı.':'Host reddetti: '+why(res),res.status!=='ok');try{UI.drawInbox();UI.topbar();if(typeof ArchiveUI!=='undefined'&&ArchiveUI.selected===rec.id&&!doc.getElementById('modal').classList.contains('hidden'))ArchiveUI.record(rec.id);}catch{}};
    try{UI.drawInbox();}catch{}
    return {ok:true,pending:true};};
}
const TREATY=['peace','nap','pact','ally','intel','passage'];   // mp-core DIP_TREATY ile aynı
/* MP.6.3 — ortak savaş paylaşımı: host görünümü (gerçek kimlikler) → aynadaki numaralar; teklif nesneleri kimlikle kalıcı
   (pencere onay düğmeleri settlementOffer(id)===o denetler) */
const SET={offers:new Map(),quotes:{},wait:{},sig:null,last:null};
/* MP.6.4 casusluk: hedef başına host teklifi (8 s), gelince istihbarat görünümü yeniden çizilir */
const SPY={q:{},wait:{},res:{},pend:null};
function spyQ(id){const c=SPY.q[id];if(c&&Date.now()-c.at<8000)return c.v;
  if(!SPY.wait[id]&&S.J&&S.on){const cid=send({kind:'spyQuote',target:real(id)});if(cid){SPY.wait[id]=1;waits[cid]=res=>{delete SPY.wait[id];if(res.status!=='ok')return;SPY.q[id]={at:Date.now(),v:res.extra};
    if(!holdBuild()&&!S.building)try{UI.keepScroll=true;UI.refresh();}catch{}};}}
  return c?c.v:null;}
const setRow=r=>({...r,from:local(r.from),to:local(r.to),claims:(r.claims||[]).map(local),__mp:1});
const setShares=l=>(l||[]).map(x=>({...x,id:local(x.id)}));
function setQuote(q){if(!q||!q.ok)return {ok:false,why:(q&&q.why)||'Taslak yok'};return {...q,members:q.members.map(local),rows:q.rows.map(setRow),shares:setShares(q.shares)};}
function setOffer(o){return {...o,proposer:local(o.proposer),members:o.members.map(local),rows:o.rows.map(setRow),shares:setShares(o.shares),votes:o.votes.map(v=>({...v,by:local(v.by)})),
  receipt:o.receipt?{at:o.receipt.at,transfers:Array.from({length:o.receipt.n},()=>({}))}:undefined,__mp:1};}
const setShown=()=>{const m=doc.getElementById('modal');return !!(m&&!m.classList.contains('hidden')&&/PAYLAŞIM/.test((m.querySelector('.mhd')||{}).textContent||''));};
function setSync(){
  const v=S.J&&S.J.game&&S.J.game.view;if(!v||!v.settle||typeof G==='undefined'||!G)return;
  const sig=JSON.stringify(v.settle),fresh=!G.settlements||!G.settlements.__mp;if(sig===SET.sig&&!fresh)return;const changed=sig!==SET.sig;SET.sig=sig;if(changed)SET.quotes={};
  const offers=v.settle.offers.map(o=>{const n=setOffer(o),old=SET.offers.get(o.id);if(old){for(const k of Object.keys(old))delete old[k];Object.assign(old,n);return old;}SET.offers.set(o.id,n);return n;});
  if(fresh)G.settlements={v:1,next:1,offers:[],__mp:1};G.settlements.offers=offers;
  if(changed&&S.started&&setShown()&&SET.last)try{UI.openSettlement(...SET.last.slice(0,1));}catch{}   // açık paylaşım penceresi host'un yeni durumunu gösterir
}
/* host önizlemesi (gerçek kimlikler) → aynadaki numaralar; adlar host'ta ilan edenin bilgisiyle süzülmüş gelir */
function warLocal(p){const m=x=>x&&{...x,id:local(x.id)};return {...p,target:m(p.target),certain:(p.certain||[]).map(m),conditional:(p.conditional||[]).map(m)};}
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
  if(m.type==='speed'){if(Number.isFinite(m.n)){if(m.n<=(S.speedN||0)){S.stats.staleSpeed=(S.stats.staleSpeed||0)+1;return true;}S.speedN=m.n;}   // MP.6.3: eski hız iletisi yenisini ezmez
    S.hostSpd=m.spd|0;S.hostWant=Number.isInteger(m.want)?m.want:S.hostSpd;S.stats.speedMsgs++;paintSpeed();if(window.MP61)MP61.speed(m);return true;}
  return false;
}
/* ayna bekletme: yalnız gerçek onay penceresi (#modal) açıkken. MP.6.2: diplomasi sayfası açıkken de ayna uygulanır; sayfa,
   hedef ve anlaşma taslağı yeni dünyaya taşınır (ensureDiploWorld G.p kimliği değişince bunları sıfırlıyordu). */
function holdBuild(){const m=doc.getElementById('modal');return !!(m&&!m.classList.contains('hidden'));}
function schedule(){if(S.timer)return;const wait=Math.max(0,S.minGap-(Date.now()-S.lastBuild));S.timer=setTimeout(rebuild,wait);}
function rebuild(){
  S.timer=null;if(!S.mirror)return;
  /* MP.6.1: STARS penceresi açıkken ayna bekletilir (onay pencereleri dünya kimliğini denetler; tek oyunculuda da pencere açıkken dünya durur) */
  if(S.started&&holdBuild()){S.held++;S.stats.held++;S.timer=setTimeout(rebuild,250);return;}
  /* finishSaveLoad yüklemede rota kipini, dokunma hareketini ve açık bildirimi sıfırlar; canlı senkronda kullanıcının
     yarım hareketi bozulmasın diye korunur. Kamera View.cam'de; deserialize ona dokunmaz. Seçili filo kimlikle korunur. */
  const keep={route:View.route,routed:View.routed,note:UI._openNote,offer:UI.pendingOffer,sel:View.sel&&View.sel.id},rg=View.resetGesture;
  const t0=performance.now();S.building=true;let ok=false;
  /* MP.6.4: haber okundu / sabitlendi işaretleri yereldir; ayna yeniden kurulunca anahtarla geri konur */
  const nk=new Map(((typeof G!=='undefined'&&G&&G.news&&G.news.records)||[]).map(r=>[r.key,[r.read,r.pinned]]));
  const dbr=typeof G!=='undefined'&&G&&G.dismissedBattleReports?{...G.dismissedBattleReports}:null;   // MP.7.2: gizlenen savaş raporları yereldir
  let why='';try{View.resetGesture=S.started?function(){}:rg;ok=deserialize(JSON.stringify(S.mirror));if(!ok)why='kayıt doğrulaması reddetti';if(ok){inboxOffers();setSync();if(dbr)try{G.dismissedBattleReports=cleanBattleDismissals({...(G.dismissedBattleReports||{}),...dbr});}catch{}for(const r of (G.news&&G.news.records)||[]){const k=nk.get(r.key);if(k){r.read=k[0];r.pinned=k[1];}}}S.inboxSig=null;}catch(e){ok=false;why=String(e&&e.message||e).slice(0,160);}
  finally{View.resetGesture=rg;S.building=false;}
  S.lastBuild=Date.now();
  /* MP.7: bozuk/uyumsuz ayna aynı veriyle 1 s'de bir sonsuza dek yeniden kurulmuyordu-kurulmaya çalışılıyordu. Artık ayna bırakılır,
     gerçek neden kaydedilir ve host'tan TAM ayna sınırlı geri çekilmeyle (bootTick) yeniden istenir. */
  if(!ok){S.stats.fail=(S.stats.fail||0)+1;S.boot.fails++;S.boot.err='Galaksi verisi kurulamadı: '+why;bootLog('deserialize-fail');S.mirror=null;S.rev=0;S.boot.next=Date.now()+1500;return;}
  G.autoSave=false;G.speed=0;
  if(S.started&&UI._diploWorld)UI._diploWorld=G.p;   // açık diplomasi sayfası ve taslaklar korunur
  if(S.started&&UI._fedTabsWorld)UI._fedTabsWorld=G.emps;   // MP.6.4: federasyon sekmesi / açık bölümler / kaydırma canlı senkronda korunur (openFed dünya kimliği değişince GENEL'e döner)
  if(S.started){View.route=keep.route;View.routed=keep.routed;UI._openNote=keep.note;UI.pendingOffer=keep.offer;
    if(keep.sel!==null&&keep.sel!==undefined&&!View.sel){const f=G.fleets.find(x=>x.id===keep.sel);if(f)View.sel=f;}}
  const ms=performance.now()-t0;S.stats.builds++;S.stats.buildMs.push(Math.round(ms*10)/10);if(S.stats.buildMs.length>60)S.stats.buildMs.shift();
  if(!S.started)start();else{UI.keepScroll=true;try{UI.refresh();}catch{}}
  paintSpeed();
}
/* MP.6.1: MP.3 teklifleri (insan ya da AI → bu oyuncu) gerçek STARS gelen kutusuna 'aideal' kaydı olarak girer.
   Kimlikler aynadaki numaralara çevrilir; kabul/ret DiplomaticInbox.resolve → MP 'respond'. */
const decKey=c=>c.kind+':'+(c.offer??c.fed??c.from??c.sub??'')+':'+(c.token??c.id??'');
const noteSig=n=>typeof n.key==='string'&&n.key?n.key:n.kind+':'+JSON.stringify(n.data===undefined?null:n.data);
function inboxOffers(){
  const v=S.J&&S.J.game.view,me=S.J&&S.J.empireId;if(!v||!v.dip||typeof DiplomaticInbox==='undefined')return;
  /* MP.7.1: sonuçlanan teklifler de (geçmiş) gerçek gelen kutusunda; durum ve yanıt host'un teklif deposundan. Önce eskiler. */
  for(const o of v.dip.offers.slice().sort((a,b)=>a.id-b.id)){if(o.to!==me||!G.emps[local(o.from)])continue;
    const strip=l=>l.map(({l:_,...i})=>i),data={from:local(o.from),to:0,give:strip(o.give),want:strip(o.want),born:o.born,expires:o.expires};
    let rec=DiplomaticInbox.state().records.find(r=>r.mp===o.id);
    if(!rec)rec=DiplomaticInbox.capture({kind:'aideal',data,born:o.born,title:(o.round>1?'Karşı teklif':'Teklif')+' — '+o.fn,sub:'Çok oyunculu teklif · tur '+o.round});
    if(!rec)continue;rec.mp=o.id;
    if(o.status!=='pending'&&rec.status!==o.status){rec.status=Object.hasOwn(DiplomaticInbox.states,o.status)?o.status:'invalid';rec.finished=Math.min(G.day,o.expires);rec.why=String(o.why||'');
      if(window.MP71Dip&&MP71Dip.stateOf(o)==='withdrawn'&&!/geri çekti/.test(rec.sub))rec.sub='Gönderen geri çekti · '+rec.sub;}}
  /* MP.7.1: bekleyen insan / AI teklifi için host'taki gibi gerçek bildirim kartı (üstte; dokununca gelen kutusu kaydı açılır).
     Ayna her kurulumda G.inbox'ı yeniler; kartlar host'un bekleyen tekliflerinden yeniden çıkarılır, sonuçlananların kartı kalkar. */
  const live=new Set(v.dip.offers.filter(o=>o.to===me&&o.status==='pending').map(o=>'mp71:'+o.id));
  const before=(G.inbox||[]).length;G.inbox=(G.inbox||[]).filter(n=>!(typeof n.key==='string'&&n.key.startsWith('mp71:'))||live.has(n.key));let changed=G.inbox.length!==before;
  for(const o of v.dip.offers){if(!live.has('mp71:'+o.id)||G.inbox.some(n=>n.key==='mp71:'+o.id)||!G.emps[local(o.from)])continue;
    const strip=l=>l.map(({l:_,...i})=>i);G.inboxUid=(G.inboxUid||0)+1;
    const rec=DiplomaticInbox.state().records.find(r=>r.mp===o.id);
    G.inbox.push({kind:'aideal',data:{from:local(o.from),to:0,give:strip(o.give),want:strip(o.want),born:o.born,expires:o.expires},ico:'📜',cls:'sci',pause:false,uid:G.inboxUid,born:o.born,rec:rec?rec.id:undefined,
      title:(o.round>1?'Karşı teklif':'Teklif')+' — '+o.fn,sub:'Çok oyunculu teklif · '+(o.want.map(i=>i.l).join(', ')||'anlaşma')+' istiyor',key:'mp71:'+o.id});changed=true;}
  /* MP.7.3: açık konsey oylamasında oy hakkı olan misafire host'taki gibi gerçek 'KONSEY OYLAMASI' kartı (dokununca Konsey ekranı) */
  const cv=G.council&&G.council.vote,cm=G.council&&G.council.members||[];
  const canVote=cv&&!cv.done&&cm.includes(0)&&!cv.yes.includes(0)&&!cv.no.includes(0)&&!(typeof isVassal==='function'&&isVassal(G.p)&&cm.includes(G.p.overlord));
  const ckey=cv?'mp73cnc:'+cv.key+':'+(cv.target===null||cv.target===undefined?'':cv.target):null;
  const nb=G.inbox.length;G.inbox=G.inbox.filter(n=>!(typeof n.key==='string'&&n.key.startsWith('mp73cnc:'))||canVote&&n.key===ckey);if(G.inbox.length!==nb)changed=true;
  if(canVote&&!G.inbox.some(n=>n.key===ckey)){G.inboxUid=(G.inboxUid||0)+1;const R=typeof RESOLUTIONS!=='undefined'&&RESOLUTIONS[cv.key];
    G.inbox.push({kind:'cncvote',data:cv.key,ico:'🌐',cls:'sci',pause:false,uid:G.inboxUid,born:G.day,title:'KONSEY OYLAMASI',sub:R?R.n:cv.key,key:ckey});changed=true;}
  /* MP.7.4: kaydırılarak kapatılan kart ayna yenilenince geri gelmez (karar kaydı gelen kutusunda kalır) */
  if(S.swiped.size){const n2=G.inbox.length;G.inbox=G.inbox.filter(n=>!S.swiped.has(noteSig(n)));if(G.inbox.length!==n2)changed=true;}
  if(changed)try{UI.drawInbox();UI.topbar();}catch{}
  /* MP.6.2: statüko barışı teklifleri (insan ya da AI → bu oyuncu) → gerçek gelen kutusunda 'sqOffer' */
  for(const q of v.dip.sq||[]){if(q.to!==me||q.status!=='pending'||!G.emps[local(q.from)])continue;
    const rec=DiplomaticInbox.capture({kind:'sqOffer',data:local(q.from),born:q.born,key:'mpsq:'+q.from+':'+q.born,title:'Statüko barışı teklifi — '+q.fn,sub:'Sınırlar fiili durumda donar; kabul edersen host uygular.'});
    if(rec){rec.mpSq=q.from;rec.expires=q.expires;}}
}
function start(){
  if(window.MP7Setup&&MP7Setup.active)MP7Setup.close(false);   // MP.7: oyun başlarken açık kalan kurulum ekranı kaydetmeden kapanır
  S.started=true;S.on=true;gate();bootLog('ready');S.boot.stage='ready';S.boot.err='';S.boot.failed=false;
  try{leaveTitle(null);}catch{}
  doc.getElementById('menu').classList.add('hidden');doc.getElementById('game').classList.remove('hidden');ov.style.display='none';
  enterGame(true);UI.setSpeed(0);
  /* MP.7.1: insanlarla tekliflerin gönderilen / geçmiş görünümü gerçek gelen kutusunda (ayrı MP paneli yok) */
  if(window.MP71Dip)MP71Dip.attach({role:'guest',on:()=>S.on&&S.started,me:()=>S.J.empireId,offers:()=>{const v=view();return (v&&v.dip&&v.dip.offers)||[];},
    local,real,day:()=>day()||0,toast,human:id=>{const v=view(),c=v&&v.dip&&v.dip.contacts.find(x=>x.id===real(id));return !!(c&&c.h);},
    send:(c,done)=>{const cid=send(c);if(cid&&done)waits[cid]=done;return cid;},
    record:id=>{try{inboxOffers();}catch{}return DiplomaticInbox.state().records.find(r=>r.mp===id)||null;}});
  View.selSys=G.sys[G.p.home]||null;try{View.center(View.selSys.x,View.selSys.y);}catch{}
  chip();
}

/* ---- 4. host'takiyle AYNI çok oyunculu çubuk ve AYNI MP diplomasi paneli (dip-ui.js / pol-ui.js) ---- */
const V=window.MP1View,esc=V.esc;let chipEl=null,dipEl=null,dipUI=null,polUI=null,dipSeg='trade';const waits={};
function chip(text,good){
  if(!chipEl){chipEl=doc.createElement('div');chipEl.id='mp1Mini';chipEl.className='mp1-mini mp6-mini';(doc.getElementById('app')||doc.body).appendChild(chipEl);   // oyunun kök kabında (STARS katman bağlamı)
    chipEl.addEventListener('click',e=>{if(e.target.closest('[data-g6="dip"]'))dipOpen(true);
      /* MP.7.3: çubuğa dokununca telefonda görünür tanı satırı (sürüm · bağlantı · aşama · son hata kodu); jeton / oda anahtarı yok */
      else if(e.target.closest('#mp6Conn')){S.diag=!S.diag;chip(S.chipText,S.chipGood);}});}
  if(text!==undefined){S.chipText=text;S.chipGood=good;}
  const diag=V.verLine()+' · '+(online()?'host bağlı':'host yok')+(S.boot.stage?' · aşama: '+S.boot.stage:'')+' · son hata: '+(S.lastErr||'yok');
  /* MP.7.4: kapalıyken küçük düğme (👥 odadaki bağlı insan sayısı + bağlantı noktası); dokununca aynı satır + tanı açılır.
     Host bağlantısı yoksa (kritik) kendiliğinden açık. */
  const open=!!S.diag||!S.chipGood,L=S.J&&S.J.lobby,n0=L&&L.players?L.players.filter(p=>p.online!==false).length:0;
  chipEl.classList.toggle('mp74-compact',!open);
  if(S.chipText!==undefined){const n=dipCount();const h='<div class="mp3-minirow">'+(open?'<span class="mp1-mini-h mp6-conn '+(S.chipGood?'ok':'bad')+'" id="mp6Conn" role="button" aria-expanded="true"><b>ÇOK OYUNCULU</b> · '+esc(S.chipText)+'</span>':
      '<span class="mp1-mini-h mp6-conn mp74-pill" id="mp6Conn" role="button" aria-expanded="false" aria-label="Çok oyunculu — '+esc(S.chipText)+'"><i class="mp74-dot"></i>👥 '+(n0||'')+'</span>')+
      (window.MP3Dip&&window.MP7Legacy?'<button class="mp1-btn mp3-hostbtn" data-g6="dip" id="mp6DipBtn">DİPLOMASİ'+(n?' <i class="mp3-badge">'+n+'</i>':'')+'</button>':'')+'</div>'+
      (open?'<div class="mp1-sub" id="mpVer">'+esc(diag)+'</div>':'');if(chipEl.innerHTML!==h)chipEl.innerHTML=h;
    if(text!==undefined&&window.MP61)MP61.status(text,good);}
  chipEl.title=diag;
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
  else if(!S.started){ov.style.display='';const h=statusHtml+bootHtml();if(ov.innerHTML!==h)ov.innerHTML=h;}
  /* host'un reddettiği komutlar: gerçek arayüzün kendi uyarısıyla */
  for(;S.seenResults<J.results.length;S.seenResults++){const r=J.results[S.seenResults];
    if(waits[r.cid]){const w=waits[r.cid];delete waits[r.cid];try{w(r);}catch{}continue;}   // MP diplomasi paneli / gelen kutusu kendi sonucunu gösterir
    if(r.status!=='ok'&&r.code!=='rules:same')toast('Host reddetti: '+why(r),true);}
  /* MP.7.3 tanı: son reddedilen komutun KODU (içerik / jeton yok) — MP çubuğunun ipucunda */
  for(let i=J.results.length-1;i>=0&&i>=J.results.length-5;i--){const r=J.results[i];if(r.status!=='ok'&&r.code!=='rules:same'){S.lastErr=r.code;break;}}
  if(dipEl)dipTick(false);
  /* MP.6.2: bekleyen teklif G'yi değiştirmez → host yeni ayna göndermeyebilir; MP.3 'dip' görünümü değişince gerçek gelen
     kutusu ayna beklemeden güncellenir (capture tekrar eden kaydı yeniden eklemez). */
  const v=J.game&&J.game.view;if(S.started&&!S.building&&v&&v.dip){const sig=JSON.stringify([v.dip.offers.filter(o=>o.to===J.empireId).map(o=>o.id+':'+o.status),(v.dip.sq||[]).filter(q=>q.to===J.empireId&&q.status==='pending').map(q=>q.from+':'+q.born)]);
    if(sig!==S.inboxSig){S.inboxSig=sig;try{inboxOffers();}catch{}}
    try{setSync();}catch{}}
  if(S.started&&!S.building&&window.MP71Dip)try{MP71Dip.tick();}catch{}   // MP.7.1: gelen kutusundaki Gönderilen sekmesi / anlaşma sayfası kutusu
}
/* ---- MP.7: başlangıç aşamaları ve güvenli kurtarma ----
   ODAYA BAĞLANDI → DEVLET ATANDI → HOST OYUNU BAŞLATTI → GALAKSİ VERİSİ ALINDI → STARS DÜNYASI YÜKLENİYOR → OYUN HAZIR.
   Görünüm (snapshot) ya da ayna gelmezse aynı isteği (resync / ui:stars — ikisi de host'ta TAM veri üretir ve idempotenttir)
   8 s, 16 s, 32 s, 64 s aralıkla yeniden gönderir; 5 denemeden sonra durur ve YENİDEN DENE gösterir. Bağlantı yokken sayaç işlemez
   (join.js zaten yeniden bağlanır; dönüşte aynı devlet 'assign' ile gelir ve ui yeniden gönderilir). */
const BOOT_STEPS=[['room','ODAYA BAĞLANDI'],['empire','DEVLET ATANDI'],['started','HOST OYUNU BAŞLATTI'],['view','GALAKSİ VERİSİ ALINDI'],['mirror','STARS DÜNYASI YÜKLENİYOR'],['ready','OYUN HAZIR']];
const BOOT_MAX=5;
function bootLog(what){const b=S.boot;b.log.push({t:Math.round(performance.now()),what});if(b.log.length>40)b.log.shift();}
function bootStage(){const J=S.J;if(!J)return null;if(S.started)return 'ready';
  const live=J.ws&&J.ws.readyState===1;if(!live||!J.hostOnline)return J.empireId!==null&&J.screen==='game'?'started':'room';
  if(J.empireId===null)return 'room';if(J.screen!=='game')return 'empire';if(!J.game.view)return 'started';if(!S.mirror)return 'view';return 'mirror';}
function bootHtml(){
  const b=S.boot,cur=bootStage(),idx=BOOT_STEPS.findIndex(x=>x[0]===cur),J=S.J,live=J&&J.ws&&J.ws.readyState===1&&J.hostOnline;
  const rows=BOOT_STEPS.map(([k,n],i)=>'<li class="'+(i<idx?'ok':i===idx?(b.failed?'bad':'now'):'')+'">'+(i<idx?'✓ ':i===idx?(b.failed?'✗ ':'… '):'· ')+n+'</li>').join('');
  return '<div class="mp1-card mp7-boot" id="mp7Boot"><b>OYUN BAŞLIYOR</b><ol class="mp7-steps">'+rows+'</ol><div class="mp1-sub" id="mpVer">'+esc(V.verLine())+'</div>'+
    (b.failed?'<div class="mp1-status bad" id="mp7BootErr">'+esc(b.err||'Host\'tan galaksi verisi alınamadı.')+'</div><button class="mp1-btn pri" data-g7="retry" id="mp7Retry">YENİDEN DENE</button>':
      b.err?'<div class="mp1-status bad" id="mp7BootErr">'+esc(b.err)+' — yeniden isteniyor…</div>':
      !live&&J&&J.screen==='game'?'<div class="mp1-status bad">Bağlantı bekleniyor; geri gelince aynı devletine dönersin.</div>':'')+'</div>';
}
function bootAsk(){const J=S.J;if(!J||!J.ws||J.ws.readyState!==1)return;
  if(!J.game.view){J.sendRaw({v:1,type:'resync'});S.stats.resyncs++;bootLog('ask-view');}
  else{J.sendRaw({v:1,type:'ui',mode:'stars'});S.uiSent=true;bootLog('ask-mirror');}}
function bootTick(){
  const J=S.J,b=S.boot;if(!J)return;
  if(S.started||J.screen!=='game'||J.empireId===null){if(!S.started){b.since=0;b.tries=0;b.next=0;b.failed=false;b.fails=0;b.err='';}b.stage=bootStage();return;}
  const st=bootStage();if(st!==b.stage){bootLog('stage:'+st);b.stage=st;}
  const live=J.ws&&J.ws.readyState===1&&J.hostOnline;if(!live)return;   // ağ yokken deneme sayılmaz
  const now=Date.now();if(!b.since){b.since=now;b.next=now+8000;}
  if(!['started','view'].includes(st)||b.failed||S.building||S.timer)return;
  if(now<b.next)return;
  if(b.tries>=BOOT_MAX||b.fails>=3){b.failed=true;if(!b.err)b.err=st==='started'?'Host\'tan galaksi verisi gelmedi.':'Host\'tan STARS dünyası (ayna) gelmedi.';bootLog('failed');update(statusNow());return;}
  b.tries++;b.next=now+8000*2**Math.min(b.tries,3);bootAsk();
}
function statusNow(){const t=doc.getElementById('jConn');return t?t.outerHTML:'';}
setInterval(()=>{try{bootTick();if(S.J&&!S.started&&S.J.screen==='game')update(statusNow());}catch{}},1000);
doc.addEventListener('click',e=>{const el=e.target.closest('[data-g7="retry"]');if(!el)return;const b=S.boot;b.failed=false;b.tries=0;b.fails=0;b.err='';b.next=0;S.mirror=null;bootLog('retry');bootAsk();b.next=Date.now()+8000;update(statusNow());});
window.MP6Stars={SET,S,onMessage,update,screen,attach(J){S.J=J;},onAssign(){S.uiSent=false;bootLog('assign');},VIEW,ACT,boot:{stage:bootStage,tick:bootTick},dip:{open:dipOpen,seg:seg6,get ui(){return dipUI;},get pol(){return polUI;}}};
/* telefon geri tuşu: önce açık MP diplomasi onayı/paneli kapanır (join.js popstate bunu sorar) */
const prevBack=window.__mpBack;window.__mpBack=()=>{if(prevBack&&prevBack())return true;if(dipEl){dipOpen(false);return true;}return false;};
})();
