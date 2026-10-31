'use strict';
/* STARS MP.6 — misafirin gerçek STARS arayüzü için "ayna dünya" (host tarafı, saf).
   Misafir gerçek oyun sayfasını ve gerçek arayüz kodunu (map.js / ui.js / main.js) yükler; dünyayı motorun kendi
   deserialize()'ıyla kurar ama SİMÜLASYON YÜRÜTMEZ. Bu dosya host'ta her misafir için o misafirin görmeye yetkili
   olduğu dünyanın Save8 biçimli bir kopyasını üretir:
   - BEYAZ LİSTE: yalnız aşağıda adı geçen alanlar yazılır; host'un günlüğü, gelen kutusu, haberler, ekonomi geçmişi,
     AI planları, tohum ve RNG durumu, başka devletlerin kaynak/teknoloji/koloni ayrıntısı HİÇ yazılmaz.
   - GÖRÜNÜRLÜK: MP.2 viewFor kuralı (explorationContext): sistem konumu kamuya açık; ad/yıldız bilinende; gezegen
     türleri taranmışta; sahiplik ve yabancı filo görünende; koloni ayrıntısı yalnız kendi kolonisinde.
   - YENİDEN NUMARALANDIRMA: tek oyunculu arayüz ve motor ~330 yerde "oyuncu = devlet 0" varsayar. Aynada misafirin
     devleti 0, host'un devleti misafirin numarasıdır (yalnız bu iki kimlik yer değiştirir: π = (0 me)).
   G'ye yazmaz, RNG çekmez; çıktı yalnız JSON. Ayrıntı: MULTIPLAYER-MP6-MIMARI.md. */
(function(root){
const J=x=>x===undefined?undefined:JSON.parse(JSON.stringify(x));
const EMP_MAPS=['rel','war','ally','contact','nap','pact','embargo','envoy','exh','giftAt','intel','intelP','mem','smuggle','spy','spynet','visionFrom','shareVis','warPend',
  /* MP.6.2: devlet kimliğiyle anahtarlı diğer haritalar (MP.6'da yeniden numaralandırılmıyordu: host'la savaş başka devlete görünürdü) */
  'peaceAt','passage','warCause','warSince','warStart','wg','warDefense','coldWar','lastOffer','offerRefused','proxyWar','tradeFlow','routeIntel','fleetIntel','fakeTo','responses','lastSwap'];
/* kabukta misafirle ikili kamu durumları (savaş başlangıcı, savunma tarafı, barış, geçiş, soğuk savaş, ambargo) */
const SHELL_PAIR=['warSince','warStart','warDefense','peaceAt','passage','coldWar','embargo'];
const STRIP_ME=['aiIntel','aiStrategy','aiShipPlan','aiTalk','aiLastOp','_aiSpyNext','_prof','_trCache','_trSig','_press','_pressAt','_powC','_powAt','_trAt','_persAt'];
const UNKNOWN_COL='#7d90ad';
const EH_EVENTS=40;

function build(meId,o={}){
  const N=G.emps.length,me=G.emps[meId];
  const pi=id=>id===meId?0:id===0?meId:id;                       // tek yer değiştirme: π = π⁻¹
  const piN=id=>Number.isInteger(id)&&id>=0&&id<N?pi(id):id;
  const remapKeys=m=>{if(!m||typeof m!=='object')return m;const r={};for(const [k,v] of Object.entries(m)){const n=+k;r[/^\d+$/.test(k)&&n<N?pi(n):k]=J(v);}return r;};
  const ctx=explorationContext(me),known=ctx.known,visible=ctx.visible;
  const contacted=id=>id===meId||!!(me.contact&&me.contact[id]);
  const knownWar=new Set(knownWarPairs(me).map(p=>p.a+':'+p.b));
  /* ---- sistemler ---- */
  const sys=G.sys.map(s=>{
    const k=known.has(s.id),v=visible.has(s.id),surv=s.surv.includes(meId),mine=s.owner===meId;
    const x={i:s.id,x:s.x,y:s.y,n:k?s.name:'',st:k?Math.max(0,STARS.indexOf(s.star)):0,p:[],
      l:s.lanes.filter(n=>k||known.has(n)),o:v||mine?piN(s.owner):-1,sv:surv?[0]:[],se:k?[0]:[],q:mine?J(s.queue)||[]:[],
      an:surv?!!s.anom:false,ak:surv?s.anomK:'sinyal',d:v||mine?(s.def||0):0,pu:k?!!s.pulsar:false,nb:k?!!s.nebulaS:false};   // gizli alanlar motorun varsayılan biçiminde
    if(surv||mine)x.p=s.planets.map(p=>{
      const q={i:p.i,t:p.t,dep:p.dep,sz:p.sz,seed:p.seed,name:p.name,owner:-1};
      if(v||mine){q.owner=piN(p.owner);if(p.col){
        if(p.owner===meId){q.col=J(p.col);if(q.col.conflictNotice&&Number.isInteger(q.col.conflictNotice.owner))q.col.conflictNotice.owner=piN(q.col.conflictNotice.owner);}
        else q.col={pop:Math.round(p.col.pop||0),stab:0,grow:0,b:{},cap:p.col.cap||0,name:p.col.name||p.name,f:null,fcd:0,shield:p.col.shield||0,
          garrisonBase:p.col.garrisonBase||0,garrison:p.col.garrison||0,auto:false,hist:{peace:0,own:0,flips:0,sieges:0,crises:0},q:[]};}}
      return q;});
    if(mine){x.b=J(s.built);x.w=J(s.work);if(Array.isArray(x.w))for(const w of x.w)if(w&&Number.isInteger(w.e))w.e=piN(w.e);
      x.ry=J(s.rally);x.lb=J(s.loopBuild);x.yl=J(s.yardLock);}
    else if(v)x.b=J(s.built);                                       // görünen yabancı uzay yapıları haritada görünür
    return x;});
  /* ---- devletler ---- */
  const shell=e=>{
    const c=contacted(e.id),r={};for(const k of Object.keys(e.res))r[k]=0;
    const cols=e.colonies.filter(c=>visible.has(c.s)&&G.sys[c.s].surv.includes(meId)).map(c=>({s:c.s,p:c.p}));   // gezegeni aynada olan koloniler
    const s={id:pi(e.id),race:c?e.race:'insan',name:c?e.name:'Bilinmeyen devlet',ai:true,col:c?e.col:UNKNOWN_COL,traits:c?J(e.traits):[],
      res:r,inc:{},techs:{},rq:{},rp:{},colonies:cols,mods:{},cap:0,dead:!!e.dead,rel:{},war:{},ally:{},nap:{},pact:{},contact:{},
      home:c&&known.has(e.home)?e.home:me.home,assim:0,agr:0,exp:0,extra:{},ethics:c?J(e.ethics):{mil:0,aut:0,mat:0,ahl:0},civics:c?J(e.civics):[],
      origin:c?e.origin:'standart',sigil:c?e.sigil:'simetrik',monoRes:e.monoRes,emblem:c?J(e.emblem):undefined,look:c?e.look:'humanoid',physio:c?e.physio:'humanoid',
      portraitVariant:c?e.portraitVariant:0,mizac:c?e.mizac:undefined,research:{targets:[]},factions:null,unity:0,structs:{min:0,ene:0,ara:0,role:0,sensor:0,gate:[],dyson:0},
      trade:{links:[],n:0,cap:0,cut:0,foreign:0,vol:0,trips:0,raided:0,ham:0,mul:0},spy:{},envoy:{},mem:{},intel:{},intelP:{},exh:{}};
    /* ilişkileri: misafirle olan gerçek ilişkiler + temaslı devletler arası kamu savaş/ittifak (haritadaki çizgiler) */
    if(c){s.contact[0]=true;s.rel[0]=Math.round((e.rel&&e.rel[meId])||0);if(e.war&&e.war[meId])s.war[0]=J(e.war[meId]);if(e.ally&&e.ally[meId])s.ally[0]=true;
      if(e.nap&&e.nap[meId])s.nap[0]=J(e.nap[meId]);if(e.pact&&e.pact[meId])s.pact[0]=J(e.pact[meId]);
      for(const k of SHELL_PAIR)if(e[k]&&e[k][meId]!==undefined&&e[k][meId]!==null){s[k]=s[k]||{};s[k][0]=J(e[k][meId]);}
      /* üçüncü taraf savaşları motorun bilgi kuralıyla (knownWarPairs: temas + taraf ya da istihbarat ≥3); MP.6 temaslı her savaşı veriyordu */
      for(const o2 of G.emps)if(o2!==e&&o2!==me&&contacted(o2.id)){if(e.war&&e.war[o2.id]&&knownWar.has(Math.min(e.id,o2.id)+':'+Math.max(e.id,o2.id)))s.war[pi(o2.id)]=J(e.war[o2.id]);if(e.ally&&e.ally[o2.id]&&knownAllianceBond(me,e,o2))s.ally[pi(o2.id)]=true;}   // ittifak bağı da motorun bilgi kuralıyla
      if(e.overlord!=null&&contacted(e.overlord)){s.overlord=pi(e.overlord);s.vassalType=e.vassalType;}}
    return s;};
  /* MP.6.1: vasallık kayıtları (sözleşme / müzakere) — kimlik alanları yeniden numaralandırılır (restoreVassalContracts
     c.sub===sub.id, q.lord/from/to/history.by denetler). Yalnız misafirin TARAF olduğu kayıtlar aynaya girer. */
  const vasC=c=>c&&{...J(c),sub:piN(c.sub),lord:piN(c.lord)};
  const vasQ=q=>{if(!q)return q;const x=J(q);for(const k of ['sub','lord','from','to'])x[k]=piN(x[k]);
    x.history=(x.history||[]).map(h=>({...h,by:piN(h.by)}));x.paid=remapKeys(x.paid||{});
    if(x.disclosedWars)x.disclosedWars=Object.fromEntries(Object.entries(x.disclosedWars).map(([id,fr])=>[String(piN(+id)),(fr||[]).map(piN)]));return x;};
  const party=q=>!!q&&(q.lord===meId||q.sub===meId);
  const mine=J(me);for(const k of STRIP_ME)delete mine[k];
  mine.id=0;mine.ai=false;for(const k of EMP_MAPS)if(mine[k])mine[k]=remapKeys(mine[k]);
  for(const k of ['hitLog'])if(Array.isArray(mine[k]))for(const h of mine[k])if(h&&Number.isInteger(h.by))h.by=piN(h.by);
  if(Array.isArray(mine.opLog))for(const h of mine.opLog)if(h&&Number.isInteger(h.o))h.o=piN(h.o);
  if(mine.overlord!=null)mine.overlord=piN(mine.overlord);
  if(mine.vassalContract)mine.vassalContract=vasC(mine.vassalContract);
  if(mine.vassalTalk)mine.vassalTalk=vasQ(mine.vassalTalk);
  if(Array.isArray(mine.vassalTalkHistory))mine.vassalTalkHistory=mine.vassalTalkHistory.filter(party).map(vasQ);
  const emps=new Array(N);
  for(const e of G.emps){if(e===me){emps[0]=mine;continue;}const s=shell(e);
    /* misafirin vasalı (ya da senyörü): sözleşme ve misafirin taraf olduğu müzakere — gerçek STARS vasallık penceresi ve gelen kutusu */
    if(e.overlord===meId){s.overlord=0;s.vassalType=e.vassalType;if(e.vassalContract)s.vassalContract=vasC(e.vassalContract);}
    if(party(e.vassalTalk))s.vassalTalk=vasQ(e.vassalTalk);
    emps[pi(e.id)]=s;}
  /* ---- filolar ---- */
  const fl=[];
  for(const f of G.fleets){
    if(f.e===meId){const c=J(f);c.e=0;if(c.mv){c.mv.from=c.mv.from;c.mv.to=c.mv.to;}fl.push(c);continue;}
    if(!f.ships.length)continue;
    const at=f.sys>=0?f.sys:(f.mv&&visible.has(f.mv.from)?f.mv.from:f.mv?f.mv.to:-1);
    if(at<0||!visible.has(at))continue;
    const s=G.sys[at];
    fl.push({id:f.id,e:pi(f.e),sys:at,x:s.x,y:s.y,ships:f.ships.map(x=>({c:x.c})),path:[],mv:null,ord:null,name:contacted(f.e)?f.name:'Bilinmeyen filo',
      stance:'savunma',combat:0,surv:0,auto:false,repairing:0,supply:1});
  }
  /* ---- federasyonlar: kamu kabuğu (üyelik haritada görünür). MP.6.1: ÜYE misafire kendi federasyonunun oylaması,
     davetleri ve son oy sonucu (gerçek STARS federasyon penceresi ve gelen kutusu); davet edilen misafire yalnız KENDİ daveti;
     başvuran misafire yalnız kendi başvuru sonucu. AI değerlendirmeleri (assessments/reasons), hazine ve ortak savaş kararları girmez. ---- */
  const vote=v=>v&&{id:v.id,kind:v.kind,law:v.law,motion:v.motion,type:v.type,field:v.field,value:v.value,repeal:!!v.repeal,opened:v.opened,expires:v.expires,
    proposer:piN(v.proposer),target:piN(v.target),sponsor:piN(v.sponsor),yes:(v.yes||[]).map(piN),no:(v.no||[]).map(piN),...(Array.isArray(v.eligible)?{eligible:v.eligible.map(piN)}:{}),
    ...(v.ballotSnapshot?{ballotSnapshot:{mode:v.ballotSnapshot.mode,modern:!!v.ballotSnapshot.modern,source:v.ballotSnapshot.source,weights:remapKeys(v.ballotSnapshot.weights||{})}}:{})};
  const inv=x=>x&&{expires:x.expires,by:piN(x.by),terms:x.terms};
  const feds=(G.feds||[]).filter(f=>f.members.some(m=>m===meId||contacted(m))||(f.invites&&f.invites[meId])).map(f=>{
    const member=f.members.includes(meId),invites={},adm={};
    if(member)for(const [id,x] of Object.entries(f.invites||{}))invites[piN(+id)]=inv(x);else if(f.invites&&f.invites[meId])invites[0]=inv(f.invites[meId]);
    for(const [tok,row] of Object.entries(f.admissionResults||{}))if(row&&row.target===meId)adm[tok]={...J(row),target:0,...(Number.isInteger(row.by)?{by:piN(row.by)}:{})};
    const lv=member&&f.lastVote?{id:f.lastVote.id,law:f.lastVote.law,kind:f.lastVote.kind,passed:!!f.lastVote.passed,day:f.lastVote.day,why:f.lastVote.why,rule:f.lastVote.rule,
      yes:Array.isArray(f.lastVote.yes)?f.lastVote.yes.map(piN):f.lastVote.yes,no:Array.isArray(f.lastVote.no)?f.lastVote.no.map(piN):f.lastVote.no,abstain:Array.isArray(f.lastVote.abstain)?f.lastVote.abstain.map(piN):f.lastVote.abstain}:null;
    return {id:f.id,name:f.name,type:f.type,charter:J(f.charter),leader:piN(f.leader),founder:piN(f.founder),members:f.members.map(piN),laws:J(f.laws)||{},fund:{ala:0,ene:0},treasury:0,
      founded:f.founded,typeSince:f.typeSince,dutySince:{defense:0,offense:0},invites,decisions:{},dutyConsent:{},cohesion:f.cohesion,nextVote:f.nextVote,politicsVersion:f.politicsVersion,
      vote:member?vote(f.vote)||null:null,lastVote:lv,...(Object.keys(adm).length?{admissionResults:adm}:{})};});
  /* ---- kök ---- */
  const cfg={...J(G.cfg),seed:o.cosmeticSeed|0,name:me.name,race:me.race,look:me.look,physio:me.physio,sigil:me.sigil,ethics:J(me.ethics),civics:J(me.civics),
    origin:me.origin,monoRes:me.monoRes,mizac:me.mizac,traits:J(me.traits),color:me.col,portraitVariant:me.portraitVariant||0};
  /* MP.6.1: ekonomi geçmişi — yalnız misafirin KENDİ satırı (devlet 0 olarak); başka devletlerin defteri girmez */
  const EH=G.economyHistory,row=EH&&EH.empires&&EH.empires[meId];
  const economyHistory=row?{v:EH.v,started:EH.started,lastClosed:EH.lastClosed,next:EH.next,empires:{0:{...J(row),events:J(row.events.slice(-EH_EVENTS))}}}:undefined;   // son EH_EVENTS olay (boyut)
  return {v:8,cfg,day:G.day,year:G.year,month:G.month,seed:o.cosmeticSeed|0,rs:1,log:J(o.log||[]),...(economyHistory?{economyHistory}:{}),W:G.W,H:G.H,
    world:{memAge:G.memAge,cncAge:G.cncAge,council:null,feds,fedUid:G.fedUid,friction:{},rebelAlliance:null,megaWatch:[],sandbox:false},
    sys,emps,fl,nf:G.nextFleet};
}
/* MP.6.1 ekonomi geçmişi farkı: olay ve ay listeleri yalnız sona eklenir, en eskiler baştan düşer → {drop, add};
   satırın diğer alanları ve üst alanlar bütün. Tam liste yalnız bu düzen bozulursa gider. */
function seqDiff(a,b,key){const S=JSON.stringify,first=b.length?b[0][key]:null,i=first===null?a.length:a.findIndex(x=>x[key]===first);
  if(i<0)return {all:b};const keep=a.slice(i);if(S(keep)!==S(b.slice(0,keep.length)))return {all:b};
  return i||b.length>keep.length?{drop:i,add:b.slice(keep.length)}:null;}
const seqApply=(a,d)=>d.all?d.all:a.slice(d.drop).concat(d.add);
function ehDiff(a,b){const S=JSON.stringify,ra=a.empires[0],rb=b.empires[0];if(!ra||!rb)return S(a)===S(b)?null:{all:b};
  const d={};for(const k of ['v','started','lastClosed','next'])if(a[k]!==b[k])(d.top=d.top||{})[k]=b[k];
  for(const k of Object.keys(rb))if(k!=='events'&&k!=='months'&&S(ra[k])!==S(rb[k]))(d.row=d.row||{})[k]=rb[k];
  const ev=seqDiff(ra.events,rb.events,'id'),mo=seqDiff(ra.months,rb.months,'start');if(ev)d.ev=ev;if(mo)d.mo=mo;
  return Object.keys(d).length?d:null;}
function ehApply(m,d){if(d.all){m.economyHistory=d.all;return;}const x=m.economyHistory,r=x.empires[0];Object.assign(x,d.top||{});Object.assign(r,d.row||{});
  if(d.ev)r.events=seqApply(r.events,d.ev);if(d.mo)r.months=seqApply(r.months,d.mo);}
/* ayna farkı: üst alanlar bütün, sys/emps sıra, fl kimlik ile */
function diff(a,b){
  const ops={};const S=JSON.stringify;
  for(const k of Object.keys(b)){
    if(k==='sys'||k==='emps'){const up={};b[k].forEach((x,i)=>{if(S(x)!==S(a[k][i]))up[i]=x;});if(Object.keys(up).length)(ops.idx=ops.idx||{})[k]=up;}
    else if(k==='fl'){const am=new Map(a.fl.map(f=>[f.id,S(f)])),up=[],bm=new Set();for(const f of b.fl){bm.add(f.id);if(am.get(f.id)!==S(f))up.push(f);}
      const rm=a.fl.filter(f=>!bm.has(f.id)).map(f=>f.id);if(up.length||rm.length)ops.fl={up,rm,order:b.fl.map(f=>f.id)};}
    else if(k==='economyHistory'&&a[k]&&b[k]){const d=ehDiff(a[k],b[k]);if(d)ops.eh=d;}
    else if(S(a[k])!==S(b[k]))(ops.set=ops.set||{})[k]=b[k];
  }
  return ops;
}
function apply(m,ops){
  for(const [k,v] of Object.entries(ops.set||{}))m[k]=v;
  if(ops.eh)ehApply(m,ops.eh);
  for(const [k,up] of Object.entries(ops.idx||{}))for(const [i,x] of Object.entries(up))m[k][+i]=x;
  if(ops.fl){const by=new Map(m.fl.map(f=>[f.id,f]));for(const f of ops.fl.up)by.set(f.id,f);for(const id of ops.fl.rm)by.delete(id);m.fl=ops.fl.order.map(id=>by.get(id)).filter(Boolean);}
  return m;
}
root.StarsMirror={build,diff,apply};
})(typeof globalThis!=='undefined'?globalThis:this);
