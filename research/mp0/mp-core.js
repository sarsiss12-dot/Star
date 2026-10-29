'use strict';
/* ═══ STARS MP.0 — HOST YETKİLİ ÇEKİRDEK (izole prototip) ═══
   Bu dosya 19 runtime dosyasından biri DEĞİLDİR; yalnız MP.0 host sayfasına
   (research/mp0/server/dev-relay.js → /mp/host) ve testlere yüklenir.
   Gerçek STARS motorunun global durumunu (G) ve kurallarını kullanır:
   queueBuilding, setFocus, cancelBuild, explorationContext, txCaptureGraph.

   İlkeler
   - Tek kanonik simülasyon host'tadır; istemci dünya yürütmez.
   - Oyuncu (playerId) ≠ devlet (empireId). Eşleme yalnız host API'siyle
     (assign/release) değişir; ağdan gelen "empire" alanı güvenilmez.
   - Ağdan gelen tür adı fonksiyon adı olarak çağrılmaz: sabit, prototipsiz
     HANDLERS / COMMANDS tabloları.
   - Her komut gerçek oyun kuralından geçer; başarısızlıkta motorun kendi
     txCaptureGraph/txRestoreGraph ilkeliyle kısmi değişiklik kalmaz.
   - Komut idempotent: cid tekrarında önbellekteki sonuç döner; seq tekdüze.
   - İstemciye tam serialize() gitmez; yalnız o devletin bildiği/gördüğü
     veriden kurulan filtreli görünüm (snapshot + delta) gider.
   - Bu katman oyun RNG'sini tüketmez ve okuma dışında dünya durumuna
     dokunmaz (yalnız komut uygulaması ve devlet devri). */
(function(root){
const PROTOCOL=1;
const MAX_IN=4096;
const RESULT_CACHE=128;
const has=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
/* sıradan nesne: dizi/sınıf örneği değil; prototipi bir alemin Object.prototype'ı (vm/iframe güvenli) */
const plain=o=>{if(o===null||typeof o!=='object'||Array.isArray(o))return false;const pr=Object.getPrototypeOf(o);return pr===null||Object.getPrototypeOf(pr)===null;};
const int=(x,lo,hi)=>Number.isInteger(x)&&x>=lo&&x<=hi;
const onlyKeys=(o,keys)=>Object.keys(o).every(k=>keys.includes(k));
const r1=x=>Math.round((+x||0)*10)/10;
function table(o){const t=Object.create(null);for(const k of Object.keys(o))t[k]=o[k];return Object.freeze(t);}
/* Bütünlük bağı için küçük FNV-1a (kriptografik değil; Save8 ↔ meta eşleşmesi). */
/* MP.1 — insan aktör: motorun kendi bayrağı. Tek oyunculu oyunda yalnız devlet 0
   ai:false'tur (makeEmpire çağrılarının tamamı AI ile kuruluyor, e.ai çalışma
   sırasında değişmiyor); MP devri e.ai=false yapar ve Save8'de kalıcıdır.
   id===0 karşılaştırmasına dayanmaz. */
function isHumanActor(e){return !!e&&e.ai===false&&!e.wild&&!e.crisisSide;}
/* MP.1 — aktör-genel görüş: updateVision'ın (main.js) BFS'inin birebir kopyası,
   G.p yerine verilen devlet için. Seed 11/23/42/99/404 × 120 ayda G.p için G.vis ile
   aynı küme (tests/mp1_lobby_core_test.js). Yalnız okur. */
function actorVision(e){
  if(hasCivic(e,'panopt'))return new Set(G.sys.map(s=>s.id));
  const sensor=1+(e.mods.sensor|0),q=[];
  for(const s of G.sys)if(s.owner===e.id)q.push({id:s.id,d:0});
  for(const f of G.fleets)if(f.e===e.id&&f.sys>=0)q.push({id:f.sys,d:0});
  const seen=new Set();
  while(q.length){const {id,d}=q.shift();if(seen.has(id)&&d>0)continue;seen.add(id);
    if(d<sensor&&!G.sys[id].nebulaS)for(const l of G.sys[id].lanes)if(!seen.has(l))q.push({id:l,d:d+1});}
  return seen;
}
const TABS=['lobi','doktrin','gorunus','fizyoloji','etik','civic','koken','galaksi','oyun'];
const PALETTE=['#6ff2c8','#ff9b3d','#8b7bff','#f2d452','#ff5f6d','#4aa8d8','#e069c0','#96b13a'];
function fnv(text){let a=0x811c9dc5,b=0x01000193^0x5bd1e995;for(let i=0;i<text.length;i++){const c=text.charCodeAt(i);a=Math.imul(a^c,0x01000193)>>>0;b=Math.imul(b^c,0x5bd1e995)>>>0;}return ('0000000'+a.toString(16)).slice(-8)+('0000000'+b.toString(16)).slice(-8);}

function createHost(opts){
    const send=opts.send,kick=opts.kick||(()=>{}),random=opts.random,now=opts.now||(()=>Date.now());
  const hostEmpireId=Number.isInteger(opts.hostEmpireId)?opts.hostEmpireId:0;
  const S={roomId:opts.roomId,saveId:opts.saveId||('s-'+random(8)),worldRevision:0,hostId:'host',access:'private',
    players:new Map(),conns:new Map(),slots:new Map(),paused:false,journal:[]};   // journal: uygulanan kanonik eylemler (yeniden oynatma/denetim)
  const stats={in:0,out:0,bytesIn:0,bytesOut:0,rejected:0,applied:0,duplicate:0,stale:0,unauthorized:0,
    blockedAI:0,snapshots:0,deltas:0,snapshotBytes:[],deltaBytes:[],publishMs:[],commandMs:[]};
  /* host'un kendi oyuncusu: yerel arayüz, ağ bağlantısı yok */
  S.players.set('host',{playerId:'host',name:opts.hostName||'Host',token:null,empireId:hostEmpireId,conn:null,lastSeq:0,
    results:new Map(),lastView:null,lastRev:0,wasAI:false,takeover:null,lastSeen:now()});
  S.slots.set(hostEmpireId,'host');

  const notes=new Map();                                               // MP.2: empireId → son 12 kişisel bildirim
  function note(id,m,c){const a=notes.get(id)||[];a.push({d:Math.floor(G.day),m:String(m).replace(/<[^>]*>/g,'').slice(0,160),c:c||''});if(a.length>12)a.shift();notes.set(id,a);}
  function out(conn,obj){const text=JSON.stringify(obj);stats.out++;stats.bytesOut+=text.length;send(conn,text);return text.length;}
  function playerOf(conn){const id=S.conns.get(conn);return id?S.players.get(id):null;}
  function humanEmpire(e){return !!e&&S.slots.has(e.id);}
  function remoteHuman(e){return isHumanActor(e)&&e.id!==hostEmpireId;}
  /* ---------- MP.1 lobi durumu (opts.lobby verilmezse MP.0 davranışı) ---------- */
  const L=opts.lobby?{phase:'created',capacity:2,settings:null,galaxyRev:0,banned:new Set(),seatNext:1,rev:0,starts:0}:null;
  if(L){const h=S.players.get('host');h.seat=0;h.ready=true;h.tab='lobi';h.claim=hostEmpireId;h.color=PALETTE[0];}

  /* ---------- filtreli görünüm (yalnız okuma) ---------- */
  /* MP.2: temas kurulmamış devletin kimliği misafire gitmez (-2 = "bilinmeyen devlet"). */
  function maskOwner(e,id){return id<0||id===e.id||(e.contact&&e.contact[id])?id:-2;}
  function viewFor(e){
    const ctx=explorationContext(e),known=ctx.known,visible=ctx.visible;
    const sys={},lanes=[];
    for(const s of G.sys){
      const v={i:s.id,x:Math.round(s.x),y:Math.round(s.y)};                // kamu coğrafyası: tek oyunculu haritadaki soluk nokta
      if(known.has(s.id)){
        v.k=1;v.n=s.name;v.st=STARS.indexOf(s.star);
        if(s.surv.includes(e.id)){v.sv=1;v.pl=s.planets.map(p=>{const o={i:p.i,t:p.t,sz:p.sz};if(visible.has(s.id)&&p.owner>=0)o.o=maskOwner(e,p.owner);return o;});}
        if(visible.has(s.id)){v.vis=1;v.o=maskOwner(e,s.owner);}
      }
      sys[s.id]=v;
      for(const l of s.lanes)if(s.id<l&&(known.has(s.id)||known.has(l)))lanes.push([s.id,l]);
    }
    const cols={};
    for(const c of e.colonies){const s=G.sys[c.s],pl=s&&s.planets[c.p];if(!pl||!pl.col||pl.owner!==e.id)continue;
      const col=pl.col;
      cols[c.s+':'+c.p]={s:c.s,p:c.p,n:col.name||pl.name,pop:r1(col.pop),cap:col.cap,stab:Math.round(col.stab||0),f:col.f||null,fcd:col.fcd||0,
        b:Object.fromEntries(Object.entries(col.b).filter(([,n])=>n>0)),q:(col.q||[]).map(w=>({k:w.key,l:Math.ceil(w.left),t:w.tot,d:w.dem?1:0})),
        sl:colonySlots(col,e,pl),us:colonyUsed(col)};
    }
    const fleets={};
    for(const f of G.fleets){if(!f.ships.length)continue;
      if(f.e===e.id){const sh={};for(const x of f.ships)sh[x.c]=(sh[x.c]||0)+1;
        /* MP.2: yalnız KENDİ filon için ad, rota, hareket bacağı, güç ve durum (filo paneli + harita). */
        const st=fleetStatus(f);
        fleets[f.id]={id:f.id,own:1,s:f.sys,to:f.path.length?f.path[f.path.length-1]:(f.mv?f.mv.to:f.sys),sh,
          nm:String(f.name||('Filo '+f.id)),pa:f.path.slice(0,24),mv:f.mv?[f.mv.from,f.mv.to,Math.round(f.mv.t*100)/100]:null,
          pw:Math.round(fleetPower(f)),st:st.t,au:explorationEnabled(f)?1:0};continue;}
      const seen=f.sys>=0?visible.has(f.sys):!!(f.mv&&(visible.has(f.mv.from)||visible.has(f.mv.to)));
      /* Yabancı filo: yalnız görünür sistemde; yoldaysa görünür uçtaki sistemde gösterilir (rota/hedef gitmez).
         Temas yoksa devlet kimliği gitmez (e:null). */
      if(seen)fleets[f.id]={id:f.id,e:maskOwner(e,f.e)===-2?null:f.e,s:f.sys>=0?(visible.has(f.sys)?f.sys:-1):(visible.has(f.mv.from)?f.mv.from:f.mv.to),n:f.ships.length};
    }
    const emps={};
    for(const o of G.emps)if(o!==e&&!o.dead&&e.contact[o.id])emps[o.id]={id:o.id,n:o.name,col:o.col,war:!!e.war[o.id],rel:Math.round(e.rel[o.id]||0)};
    const me={id:e.id,n:e.name,col:e.col,dead:!!e.dead,home:e.home,res:Object.fromEntries(Object.entries(e.res).map(([k,v])=>[k,r1(v)])),
      inc:Object.fromEntries(Object.entries(e.inc||{}).map(([k,v])=>[k,r1(v)])),tech:Object.keys(e.techs).length,rq:{...e.rq}};
    const catalog={b:{}};
    for(const [k,B] of Object.entries(BUILDINGS))catalog.b[k]={n:B.n,c:buildingCost(e,k),max:B.max,ok:!B.tech||!!e.techs[B.tech]};
    catalog.f=Object.fromEntries(Object.entries(FOCUS).map(([k,F])=>[k,F.n]));
    /* MP.2 bilim: yalnız kendi devletin araştırma durumu (aktif dal, ilerleme, hedefler, plan). */
    const plan=researchPlan(e),sci={mode:researchMode(e),ara:r1(e.inc&&e.inc.ara),rq:{},rp:{},rc:{},targets:(e.research&&e.research.targets||[]).slice(),
      plan:plan.goals.map(g=>({id:g.id,ok:g.ok?1:0,x:g.extra,why:g.ok?'':g.why}))};
    for(const b of Object.keys(BRANCH)){sci.rq[b]=e.rq[b]||null;sci.rp[b]=Math.round(e.rp[b]||0);sci.rc[b]=e.rq[b]?Math.round(techCost(e,e.rq[b])):0;}
    const tech={};
    for(const [id,T] of Object.entries(TECHS)){if(!researchValidTech(id))continue;
      let st,why='';
      if(e.techs[id])st='d';else{const a=researchAccess(e,id);if(!a.ok){st='x';why=a.why;}else if(researchReady(e,id))st='r';else{const rt=researchRoute(e,id);st=rt.ok?'l':'x';why=rt.ok?'':rt.why;}}
      tech[id]={n:T.n,b:T.b,t:T.t,r:(T.r||[]).slice(),d:T.d||'',c:Math.round(techCost(e,id)),s:st,...(why?{w:why}:{})};}
    return {me,sys,lanes,cols,fleets,emps,catalog,sci,tech,log:(notes.get(e.id)||[]).slice(),dip:dipView(e)};
  }
  function clock(){return {day:Math.floor(G.day),y:G.year,m:G.month,spd:G.speed|0};}
  const KEYED=['sys','cols','fleets','emps','tech'];
  function diff(a,b){
    const ops={};
    for(const sec of KEYED){const up={},rm=[];
      for(const k of Object.keys(b[sec]))if(!has(a[sec],k)||JSON.stringify(a[sec][k])!==JSON.stringify(b[sec][k]))up[k]=b[sec][k];
      for(const k of Object.keys(a[sec]))if(!has(b[sec],k))rm.push(k);
      if(Object.keys(up).length)(ops.up||(ops.up={}))[sec]=up;
      if(rm.length)(ops.rm||(ops.rm={}))[sec]=rm;}
    for(const sec of ['me','lanes','catalog','sci','log','dip'])if(JSON.stringify(a[sec])!==JSON.stringify(b[sec]))(ops.set||(ops.set={}))[sec]=b[sec];
    return ops;
  }
  /* MP.2: görünüm salt okunur olmalı. explorationContext → borderPressure/totalPower gibi motor yolları
     günlük önbellek alanları (_powAt, _pressAt…) yazar ve bunlar Save8'e girer; yayın zamanına bağlı bir
     damga oyunun sonraki kararlarını değiştirebilirdi. aiWarBudget'ın (ai.js) yaptığı gibi bütün "_" önekli
     önbellek alanları çağrıdan önce alınır, sonra aynen geri konur. */
  function pure(fn){
    const objs=[G,...G.emps,...G.fleets,...G.sys],saved=objs.map(o=>{const d={};for(const k of Object.keys(o))if(k[0]==='_')d[k]=Object.getOwnPropertyDescriptor(o,k);return d;});
    try{return fn();}finally{objs.forEach((o,i)=>{const d=saved[i];for(const k of Object.keys(o))if(k[0]==='_'&&!has(d,k))delete o[k];for(const k in d)Object.defineProperty(o,k,d[k]);});}
  }
  function publishTo(p,rev){
    if(!p.conn||p.empireId===null)return;
    const e=G.emps[p.empireId],t0=now(),view=pure(()=>viewFor(e));let n;
    if(!p.lastView){n=out(p.conn,{v:PROTOCOL,type:'snapshot',rev,t:clock(),you:{playerId:p.playerId,empireId:p.empireId},view});stats.snapshots++;stats.snapshotBytes.push(n);}
    else{n=out(p.conn,{v:PROTOCOL,type:'delta',rev,base:p.lastRev,t:clock(),ops:diff(p.lastView,view)});stats.deltas++;stats.deltaBytes.push(n);}
    p.lastView=view;p.lastRev=rev;stats.publishMs.push(now()-t0);
  }
  function publish(){dipSweep();const rev=++S.worldRevision;for(const p of S.players.values())publishTo(p,rev);return rev;}

  /* ---------- komutlar: yalnız bu tablo ---------- */
  function locate(e,c){
    if(!int(c.sys,0,G.sys.length-1)||!int(c.planet,0,63))return {err:'bad-target'};
    const sys=G.sys[c.sys],pl=sys.planets.find(p=>p.i===c.planet);
    if(!pl||!pl.col)return {err:'bad-target'};
    if(pl.owner!==e.id)return {err:'not-owner'};
    return {sys,pl};
  }
  const COMMANDS=table({
    build:{keys:['kind','sys','planet','key'],
      check:c=>typeof c.key==='string'&&/^[a-z_]{2,16}$/.test(c.key)&&has(BUILDINGS,c.key),
      why(e,{sys,pl},c){const B=BUILDINGS[c.key],col=pl.col;
        if(B.tech&&!e.techs[B.tech])return 'tech';
        if((col.b[c.key]||0)+colonyQueuedOf(col,c.key)>=B.max)return 'max';
        if(colonyUsed(col)+colonyQueued(col)>=colonySlots(col,e,pl))return 'slots';
        const cost=buildingCost(e,c.key);for(const r in cost)if(e.res[r]<cost[r])return 'resources';return null;},
      roots:(e,{pl})=>[e.res,pl.col],
      apply:(e,{sys,pl},c)=>queueBuilding(e,sys,pl,c.key)},
    focus:{keys:['kind','sys','planet','key'],
      check:c=>typeof c.key==='string'&&has(FOCUS,c.key),
      why(e,{pl},c){if((pl.col.fcd||0)>0)return 'cooldown';if(pl.col.f===c.key)return 'same';if(hasCivic(e,'oneparty')&&pl.col.fSet)return 'oneparty';return null;},
      roots:(e,{sys,pl})=>[pl.col,sys],
      apply:(e,{sys,pl},c)=>setFocus(e,sys,pl,c.key)},
    cancel:{keys:['kind','sys','planet','index'],
      check:c=>int(c.index,0,15),
      why:(e,{pl},c)=>pl.col.q&&pl.col.q[c.index]?null:'no-job',
      roots:(e,{pl})=>[e.res,pl.col],
      apply:(e,{sys,pl},c)=>cancelBuild(e,sys,pl,c.index)},
    /* MP.2 — filo hareketi: motorun orderMove'u (rota, sınır izni, kapı ağı, sevkiyat/keşif devri).
       İstemciden rota alınmaz; yol host'ta findPath/findPathAllowed ile kurulur. Başkasının ya da
       olmayan filo aynı kodu alır (filo kimliği yoklanamaz). Tek oyunculu "sendhere" ile aynı: f.ord temizlenir. */
    move:{keys:['kind','fleet','to'],
      check:c=>int(c.fleet,0,2147483647)&&int(c.to,0,G.sys.length-1),
      locate(e,c){const f=G.fleets.find(x=>x.id===c.fleet);if(!f||f.e!==e.id||!f.ships||!f.ships.length)return {err:'not-owner'};return {f};},
      why(e,{f},c){const from=f.mv?f.mv.to:f.sys;if(!(from>=0))return 'no-position';
        if(from===c.to&&!f.path.length)return 'same';
        const p=findPath(from,c.to,e);if(!p)return 'no-route';
        if(!pathAllowed(e,f,p,from)&&!findPathAllowed(e,f,from,c.to))return 'passage';return null;},
      roots:(e,{f})=>[f,...(G.construction?[G.construction]:[])],
      apply:(e,{f},c)=>{const ok=orderMove(f,c.to,false);if(ok)f.ord=null;return ok;}},
    /* MP.2 — araştırma hedefi: motorun researchTarget'ı (erişim koşulu, ön koşul rotası, plan, dal ataması). */
    research:{keys:['kind','tech','action','position'],
      check:c=>typeof c.tech==='string'&&/^[a-z0-9_]{1,32}$/.test(c.tech)&&researchValidTech(c.tech)&&
        (c.action===undefined||c.action==='toggle'||(c.action==='move'&&int(c.position,0,63)))&&(c.action==='move'||c.position===undefined),
      locate:()=>({}),
      why(e,at,c){if(e.techs[c.tech])return 'done';const tg=(e.research&&e.research.targets)||[],i=tg.indexOf(c.tech),act=c.action||'toggle';   // salt okuma
        if(act==='move'&&(i<0||c.position>=tg.length))return 'bad-position';
        if(act==='toggle'&&i>=0)return null;                         // hedeften çıkarmak her zaman serbest
        if(!researchAccess(e,c.tech).ok)return 'access';if(!researchRoute(e,c.tech).ok)return 'route';return null;},
      roots:e=>[e.research||{},e.rq,e.rp],
      apply:(e,at,c)=>researchTarget(e,c.tech,c.action||'toggle',c.position).ok},
    researchMode:{keys:['kind','mode'],
      check:c=>['manual','semi','auto'].includes(c.mode),
      locate:()=>({}),
      why:(e,at,c)=>researchMode(e)===c.mode?'same':null,
      roots:e=>[e.research||{},e.rq,e.rp],
      apply:(e,at,c)=>setResearchMode(e,c.mode)},
    /* ═══ MP.3 — diplomasi. Yeni motor yok: dealQuote / executeDeal / aiRespond. Teklif kaydı Save8 dışında,
       oturumdadır (dipView yalnız taraflara gönderir). Taraf olmayan teklif kimliği "yok" ile aynı kodu alır. */
    offer:{keys:['kind','to','give','want'],
      check:c=>int(c.to,0,63)&&dipCheck(c),
      locate:()=>({}),
      why(e,at,c){const B=G.emps[c.to];if(!B||B===e||!dipParty(B)||!e.contact[B.id]||!B.contact[e.id])return 'no-target';
        if(D.offers.filter(r=>r.status==='pending'&&r.from===e.id).length>=DIP_PENDING_OUT)return 'too-many';
        const o=dipNew(e,B,dipItems(c.give),dipItems(c.want));
        if(D.offers.some(r=>r.status==='pending'&&r.from===e.id&&r.to===B.id&&offerSignature(dipOffer(r))===offerSignature(o)))return 'duplicate';
        return dipGate(dealQuote(o),e,B);},
      roots:()=>[],
      apply:(e,at,c)=>dipSend(e,G.emps[c.to],dipItems(c.give),dipItems(c.want),null)},
    respond:{keys:['kind','offer','action'],
      check:c=>int(c.offer,1,2147483647)&&['accept','reject'].includes(c.action),
      locate(e,c){const r=dipFind(e,c.offer);return r?{r}:{err:'no-offer'};},
      why(e,{r},c){if(r.to!==e.id)return 'not-recipient';if(r.status!=='pending')return 'closed';if(G.day>r.expires)return 'expired';
        const A=G.emps[r.from];if(!dipParty(A)||!dipParty(e))return 'invalid';
        if(c.action==='accept'){const q=dealQuote(dipOffer(r));if(!q.ok)return {code:'quote',detail:dipReasons(q,A)};}return null;},
      roots:()=>[],
      apply(e,{r},c){const A=G.emps[r.from];
        if(c.action==='reject'){r.status='rejected';r.finished=G.day;r.why='Reddedildi';dipNotify(A.id,'Teklif reddedildi — '+e.name,'war');return true;}
        if(!executeDeal(dipOffer(r)))return false;                       // motorun kendi işlemi: başarısızlıkta kendisi geri alır
        r.status='accepted';r.finished=G.day;stats.deals=(stats.deals||0)+1;
        dipNotify(A.id,'Teklif kabul edildi — '+e.name,'win');dipNotify(e.id,'Anlaşma imzalandı — '+A.name,'win');return true;}},
    counter:{keys:['kind','offer','give','want'],
      check:c=>int(c.offer,1,2147483647)&&dipCheck(c),
      locate(e,c){const r=dipFind(e,c.offer);return r?{r}:{err:'no-offer'};},
      why(e,{r},c){if(r.to!==e.id)return 'not-recipient';if(r.status!=='pending')return 'closed';if(G.day>r.expires)return 'expired';
        if(r.round>=DIP_ROUNDS)return 'round-limit';
        const B=G.emps[r.from];if(!dipParty(B)||!dipParty(e)||!e.contact[B.id]||!B.contact[e.id])return 'invalid';
        return dipGate(dealQuote(dipNew(e,B,dipItems(c.give),dipItems(c.want))),e,B);},
      roots:()=>[],
      apply:(e,{r},c)=>dipSend(e,G.emps[r.from],dipItems(c.give),dipItems(c.want),r)},
    withdraw:{keys:['kind','offer'],
      check:c=>int(c.offer,1,2147483647),
      locate(e,c){const r=dipFind(e,c.offer);return r?{r}:{err:'no-offer'};},
      why:(e,{r})=>r.from!==e.id?'not-sender':r.status!=='pending'?'closed':null,
      roots:()=>[],
      apply(e,{r}){r.status='invalid';r.why='Gönderen geri çekti';r.finished=G.day;dipNotify(r.to,'Teklif geri çekildi — '+e.name);return true;}}
  });
  /* ═══ MP.3 diplomasi durumu (oturum; Save8'e girmez — kalıcılık MP.4) ═══ */
  const DIP_ROUNDS=6,DIP_PENDING_OUT=8,DIP_KEEP=160,DIP_RES=['min','ene','yiy','ala','tuk','ara','etk'];
  const D={next:1,offers:[]};
  const dipLife=()=>typeof DEAL_OFFER_LIFE==='number'?DEAL_OFFER_LIFE:540;   // tek oyunculuyla aynı ömür (oyun günü)
  /* insanın kurabileceği maddeler: yalnız kaynak ve barış (kanonik motorun desteklediği; kaynak kataloğu RES) */
  function dipItems(list){
    if(!Array.isArray(list)||list.length>8)return null;const out=[];
    for(const it of list){if(!plain(it))return null;
      if(it.t==='res'&&onlyKeys(it,['t','r','v'])&&DIP_RES.includes(it.r)&&int(it.v,1,10000000))out.push({t:'res',r:it.r,v:it.v});
      else if(it.t==='peace'&&onlyKeys(it,['t']))out.push({t:'peace'});
      else return null;}
    return out;
  }
  function dipCheck(c){const g=dipItems(c.give),w=dipItems(c.want);return !!g&&!!w&&g.length+w.length>0&&g.length+w.length<=8;}
  const dipNew=(A,B,give,want)=>({from:A.id,to:B.id,give,want,born:G.day,expires:G.day+dipLife()});
  const dipOffer=r=>({from:r.from,to:r.to,give:r.give.map(x=>({...x})),want:r.want.map(x=>({...x})),born:r.born,expires:r.expires});
  const dipParty=o=>!!o&&!o.dead&&!o.wild&&!o.crisisSide;
  function dipFind(e,id){const r=D.offers.find(x=>x.id===id);return r&&(r.from===e.id||r.to===e.id)?r:null;}
  /* Gerekçeleri izleyicinin bakışına indir: karşı tarafın stok/teslim satırları (adıyla başlar) gönderilmez. */
  function dipReasons(q,other){const pre=String(other.name)+' → ',all=(q.reasons||[]).map(String),own=all.filter(x=>!x.startsWith(pre));
    if(own.length<all.length)own.push('Karşı taraf bu şartları şu an karşılayamıyor');return own.slice(0,4).map(x=>x.slice(0,160));}
  /* Gönderim kapısı: insan alıcıda yalnız GÖNDERENİN kendi yükümlülükleri denetlenir (karşı tarafın stoğu gizli kalır,
     kabulde dealQuote tam denetler); AI alıcıda tek oyunculu dealSend gibi tam quote. */
  function dipGate(q,A,B){
    if(isHumanActor(B)){const pre=String(B.name)+' → ',bad=(q.reasons||[]).map(String).filter(x=>!x.startsWith(pre));return bad.length?{code:'quote',detail:bad.slice(0,4)}:null;}
    return q.ok?null:{code:'quote',detail:(q.reasons||[]).slice(0,4).map(String)};
  }
  function dipNotify(id,m,c){const o=G.emps[id];if(!o)return;if(remoteHuman(o))note(id,m,c);else if(id===hostEmpireId&&opts.hostNotify)opts.hostNotify(m,c);}
  function dipTrim(){const done=D.offers.filter(r=>r.status!=='pending');if(done.length>DIP_KEEP){const drop=new Set(done.slice(0,done.length-DIP_KEEP).map(r=>r.id));D.offers=D.offers.filter(r=>!drop.has(r.id));}}
  function dipRecord(A,B,o,prev,by,status,why){
    const rec={id:D.next++,from:A.id,to:B.id,give:o.give.map(x=>({...x})),want:o.want.map(x=>({...x})),born:o.born,expires:o.expires,
      round:prev?prev.round+1:1,prev:prev?prev.id:null,status,why:why||'',by,cost:dealQuote(o).cost};
    if(status!=='pending')rec.finished=G.day;D.offers.push(rec);dipTrim();return rec;
  }
  /* Teklif/karşı teklif gönder. İnsan alıcı: bekleyen kayıt. AI alıcı: tek oyunculu UI.dealSend ile aynı yol —
     aiRespond → kabulde executeDeal, karşı teklifte AI'nın ayrı kartı (dealQuote ile denetli), retde hiçbir değişiklik. */
  function dipSend(A,B,give,want,prev){
    const o=dipNew(A,B,give,want);
    if(isHumanActor(B)){
      if(prev){prev.status='countered';prev.finished=G.day;}
      const rec=dipRecord(A,B,o,prev,'human','pending');
      dipNotify(B.id,(prev?'Karşı teklif — ':'Yeni teklif — ')+A.name,'sci');return {ok:true,extra:{offer:rec.id}};
    }
    const q=dealQuote(o),r=aiRespond(B,q.norm);
    if(r.v==='kabul'){
      if(!executeDeal(q.norm))return false;                              // dünya değişmedi; MP kaydı da yazılmaz
      if(prev){prev.status='countered';prev.finished=G.day;}
      const rec=dipRecord(A,B,o,prev,'human','accepted','Kabul edildi');stats.deals=(stats.deals||0)+1;
      dipNotify(A.id,'Anlaşma imzalandı — '+B.name,'win');return {ok:true,extra:{offer:rec.id,ai:'kabul'}};
    }
    if(prev){prev.status='countered';prev.finished=G.day;}
    if(r.v==='karsi'&&Array.isArray(r.add)&&r.add.length){
      const c={from:B.id,to:A.id,give:o.want.map(x=>({...x})),want:o.give.concat(r.add).map(x=>({...x})),born:G.day,expires:G.day+dipLife()};
      if(dealQuote(c).ok){const rec=dipRecord(A,B,o,prev,'human','countered',String(r.why||'').slice(0,240));
        const cr=dipRecord(B,A,c,rec,'ai','pending');dipNotify(A.id,'Karşı teklif — '+B.name,'sci');return {ok:true,extra:{offer:rec.id,ai:'karsi',counter:cr.id}};}
      const rec=dipRecord(A,B,o,prev,'human','rejected','Karşı teklif uygulanamıyor');return {ok:true,extra:{offer:rec.id,ai:'red'}};
    }
    const rec=dipRecord(A,B,o,prev,'human','rejected',String(r.why||'Reddedildi').slice(0,240));return {ok:true,extra:{offer:rec.id,ai:'red'}};
  }
  /* AI → uzak insan: AI'nın kendi kararıyla çağırdığı aiNegotiate burada insan kutusuna yönlendirilir; AI insan adına karar vermez. */
  function aiToHuman(a,b,give,want){
    const none={tur:0,karar:null,uygulandi:false,why:'',karsi:null};
    stats.blockedAI++;                                                    // AI'nın insan adına kararı yine engellendi; karar insana yönlendirildi
    if(!dipParty(a)||!dipParty(b)||!a.ai)return none;
    const o={from:a.id,to:b.id,give:(give||[]).map(x=>({...x})),want:(want||[]).map(x=>({...x})),born:G.day,expires:G.day+dipLife()};
    const q=dealQuote(o);if(!q.ok)return {...none,karar:'gecersiz',why:(q.reasons&&q.reasons[0])||''};
    const sig=offerSignature(o),pend=D.offers.filter(r=>r.status==='pending'&&r.from===a.id&&r.to===b.id);
    if(pend.some(r=>offerSignature(dipOffer(r))===sig)||pend.length>=3)return {...none,karar:'bekle',why:'İnsan oyuncuda bekleyen teklif var'};
    dipRecord(a,b,o,null,'ai','pending');stats.aiOffers=(stats.aiOffers||0)+1;dipNotify(b.id,'Yeni teklif — '+a.name,'sci');
    return {tur:1,karar:'bekle',uygulandi:false,why:'İnsan oyuncunun kararı bekleniyor',karsi:null};
  }
  /* oyun zamanıyla ömür ve geçerlilik süpürmesi (her yayında) */
  function dipSweep(){
    for(const r of D.offers){if(r.status!=='pending')continue;const a=G.emps[r.from],b=G.emps[r.to];
      if(G.day>r.expires){r.status='expired';r.finished=G.day;r.why='Süre doldu';dipNotify(r.from,'Teklif süresi doldu — '+(b?b.name:''));dipNotify(r.to,'Teklif süresi doldu — '+(a?a.name:''));}
      else if(!dipParty(a)||!dipParty(b)||!a.contact[b.id]||!b.contact[a.id]){r.status='invalid';r.finished=G.day;r.why='Taraflardan biri artık anlaşma yapamaz';
        dipNotify(r.from,'Teklif geçersizleşti');dipNotify(r.to,'Teklif geçersizleşti');}}
  }
  /* Oyuncuya özel diplomasi görünümü: yalnız tarafı olduğu teklifler ve temas kurduğu devletler. */
  function dipView(e){
    const nm=id=>G.emps[id]?String(G.emps[id].name):'?',lb=it=>({...it,l:String(dealLabel(it)).replace(/<[^>]*>/g,'').slice(0,90)});
    const offers=D.offers.filter(r=>r.from===e.id||r.to===e.id).slice(-40).map(r=>({id:r.id,from:r.from,to:r.to,fn:nm(r.from),tn:nm(r.to),give:r.give.map(lb),want:r.want.map(lb),
      born:Math.floor(r.born),expires:Math.floor(r.expires),round:r.round,prev:r.prev,status:r.status,why:r.why,by:r.by,cost:r.cost}));
    const contacts=G.emps.filter(o=>o!==e&&dipParty(o)&&e.contact[o.id]).map(o=>({id:o.id,h:isHumanActor(o)?1:0,war:e.war[o.id]?1:0,peace:e.war[o.id]&&canPeace(e,o)?1:0}));
    return {offers,contacts,life:dipLife(),rounds:DIP_ROUNDS};
  }

  function result(p,conn,msg,status,code,extra){
    const r={v:PROTOCOL,type:'result',seq:msg.seq,cid:msg.cid,status,code:code||null,rev:S.worldRevision,...(extra||{})};
    if(p&&typeof msg.cid==='string'){p.results.set(msg.cid,r);if(p.results.size>RESULT_CACHE)p.results.delete(p.results.keys().next().value);}
    if(status!=='ok'){stats.rejected++;if(['not-owner','forged-empire','no-empire','not-joined'].includes(code))stats.unauthorized++;}
    out(conn,r);return r;
  }
  function runCommand(conn,msg){
    const t0=now(),p=playerOf(conn);
    if(!p)return result(null,conn,msg,'rejected','not-joined');
    if(p.results.has(msg.cid)){stats.duplicate++;const old=p.results.get(msg.cid);out(conn,{...old,dup:1});return old;}
    if(msg.seq<=p.lastSeq){stats.stale++;return result(null,conn,msg,'rejected','stale-seq');}   // önbelleğe girmez: cid eskisini ezmesin
    p.lastSeq=msg.seq;p.lastSeen=now();
    if(L&&!['ingame','paused'].includes(L.phase))return result(p,conn,msg,'rejected','not-started');   // duraklatmada 'paused' (aşağıda) döner
    if(p.empireId===null)return result(p,conn,msg,'rejected','no-empire');
    if(has(msg,'empire')&&msg.empire!==p.empireId)return result(p,conn,msg,'rejected','forged-empire');
    if(S.paused)return result(p,conn,msg,'rejected','paused');
    const x=execute(p.playerId,p.empireId,msg.cmd);
    if(!x.ok)return result(p,conn,msg,'rejected',x.code,x.detail?{detail:x.detail}:undefined);
    const r=result(p,conn,msg,'ok',null,x.extra?{extra:x.extra}:undefined);stats.commandMs.push(now()-t0);
    publish();                                   // sonuç herkese kendi filtresiyle yansır
    return r;
  }
  /* Ortak komut yürütücü: ağdan gelen misafir (runCommand) ve host'un yerel paneli (local) AYNI yoldan geçer.
     MP.3: why() {code,detail} dönebilir (oyuncuya kendi bakışından gerekçe); apply() {ok,extra} dönebilir. */
  function execute(playerId,empireId,c){
    if(!plain(c)||typeof c.kind!=='string'||!(c.kind in COMMANDS))return {ok:false,code:'unknown-kind'};
    const def=COMMANDS[c.kind];
    if(!onlyKeys(c,def.keys)||!def.check(c))return {ok:false,code:'bad-params'};
    const e=G.emps[empireId];
    if(!e||e.dead)return {ok:false,code:'empire-dead'};
    const at=def.locate?def.locate(e,c):locate(e,c);if(at.err)return {ok:false,code:at.err};
    const why=def.why(e,at,c);if(why)return {ok:false,code:'rules:'+(why.code||why),detail:why.detail};
    const records=txCaptureGraph(def.roots(e,at)),rng=RND_STATE;let res;
    try{res=def.apply(e,at,c);}catch(err){txRestoreGraph(records);rndSeed(rng);return {ok:false,code:'error'};}
    if(!(res===true||(res&&res.ok))){txRestoreGraph(records);rndSeed(rng);return {ok:false,code:'rules'};}
    stats.applied++;S.worldRevision++;S.journal.push({rev:S.worldRevision,day:G.day,playerId,empireId,cmd:JSON.parse(JSON.stringify(c))});
    return {ok:true,extra:res&&res.extra};
  }
  /* MP.3: host'un kendi devleti için yerel komut (host paneli). Ağ kimliği yok; aynı kurallar, aynı denetimler. */
  function local(c){
    if(L&&!['ingame','paused'].includes(L.phase))return {ok:false,code:'not-started'};
    if(S.paused)return {ok:false,code:'paused'};
    const x=execute('host',hostEmpireId,c);if(x.ok)publish();return x;
  }

  /* ---------- ağ mesajları: yalnız bu tablo ---------- */
  const HANDLERS=table({
    hello(conn,m){
      if(!onlyKeys(m,['v','type','name','token'])||typeof m.name!=='string'||(m.token!==undefined&&(typeof m.token!=='string'||!/^[a-f0-9]{32}$/.test(m.token))))
        return out(conn,{v:PROTOCOL,type:'error',code:'bad-hello'});
      const name=m.name.replace(/[\u0000-\u001f<>]/g,'').slice(0,24)||'Oyuncu';
      let p=m.token?[...S.players.values()].find(x=>x.token===m.token):null;
      if(L){
        const deny=code=>{out(conn,{v:PROTOCOL,type:'error',code});kick(conn,code);};
        if(L.phase==='closed')return deny('room-closed');
        if(m.token&&L.banned.has(m.token))return deny('kicked');
        if(!p&&['starting','ingame','paused'].includes(L.phase))return deny('game-started');
        if(!p&&guests().length>=L.capacity-1)return deny('room-full');
      }
      if(p){if(p.conn&&p.conn!==conn){S.conns.delete(p.conn);kick(p.conn,'replaced');}}
      else{p={playerId:'p-'+random(6),name,token:random(16),empireId:null,conn:null,lastSeq:0,results:new Map(),lastView:null,lastRev:0,wasAI:null,takeover:null,lastSeen:now()};
        if(L){p.seat=L.seatNext++;p.ready=false;p.tab='lobi';p.claim=null;p.color=PALETTE[p.seat%PALETTE.length];p.rate=[];}
        S.players.set(p.playerId,p);}
      const prev=playerOf(conn);if(prev&&prev!==p){prev.conn=null;prev.lastView=null;}   // aynı bağlantı başka kimliğe geçerse eskisi bağsız kalır
      p.conn=conn;p.lastView=null;p.lastSeen=now();S.conns.set(conn,p.playerId);
      out(conn,{v:PROTOCOL,type:'assign',room:S.roomId,hostId:S.hostId,playerId:p.playerId,token:p.token,empireId:p.empireId,lastSeq:p.lastSeq,rev:S.worldRevision});
      if(p.empireId!==null)publishTo(p,S.worldRevision);
      if(L)broadcastLobby();
      if(opts.onPlayer)opts.onPlayer(p.playerId,'hello');
    },
    cmd(conn,m){
      if(!onlyKeys(m,['v','type','seq','cid','cmd','empire','base'])||!int(m.seq,1,2147483647)||typeof m.cid!=='string'||!/^[A-Za-z0-9_-]{8,40}$/.test(m.cid))
        return out(conn,{v:PROTOCOL,type:'error',code:'bad-cmd'});
      runCommand(conn,m);
    },
    resync(conn,m){const p=playerOf(conn);if(!p||p.empireId===null)return out(conn,{v:PROTOCOL,type:'error',code:'no-empire'});p.lastView=null;publishTo(p,S.worldRevision);},
    ping(conn,m){if(!int(m.t,0,Number.MAX_SAFE_INTEGER))return;out(conn,{v:PROTOCOL,type:'pong',t:m.t,day:Math.floor(G.day)});},
    /* MP.1 lobi: yalnız bağlı oyuncunun KENDİ alanları değişir; kimlik bağlantıdan */
    presence(conn,m){const p=lobbyActor(conn,m,['v','type','tab'],'presence');if(!p)return;
      if(typeof m.tab!=='string'||!TABS.includes(m.tab))return lres(conn,'presence',false,'bad-tab');
      if(p.tab!==m.tab){p.tab=m.tab;broadcastLobby();}},
    claim(conn,m){const p=lobbyActor(conn,m,['v','type','empire'],'claim');if(!p)return;
      if(!['waiting','ready'].includes(L.phase))return lres(conn,'claim',false,'phase');
      const r=setClaim(p,m.empire);lres(conn,'claim',r.ok,r.why);},
    ready(conn,m){const p=lobbyActor(conn,m,['v','type','value'],'ready');if(!p)return;
      if(typeof m.value!=='boolean')return lres(conn,'ready',false,'bad-value');
      if(!['waiting','ready'].includes(L.phase))return lres(conn,'ready',false,'phase');
      if(m.value&&p.claim===null)return lres(conn,'ready',false,'no-claim');
      const changed=p.ready!==m.value;p.ready=m.value;lres(conn,'ready',true,null);if(changed)broadcastLobby();},
    leave(conn,m){const p=lobbyActor(conn,m,['v','type'],'leave');if(!p)return;
      if(['starting','ingame','paused'].includes(L.phase))return lres(conn,'leave',false,'phase');
      S.players.delete(p.playerId);S.conns.delete(conn);lres(conn,'leave',true,null);kick(conn,'left');broadcastLobby();}
  });
  function lres(conn,action,ok,code){out(conn,{v:PROTOCOL,type:'lresult',action,ok:!!ok,code:code||null});}
  function lobbyActor(conn,m,keys,action){
    if(!L){out(conn,{v:PROTOCOL,type:'error',code:'no-lobby'});return null;}
    if(!onlyKeys(m,keys)){out(conn,{v:PROTOCOL,type:'error',code:'bad-'+action});return null;}
    const p=playerOf(conn);if(!p){lres(conn,action,false,'not-joined');return null;}
    const t=now();p.rate=(p.rate||[]).filter(x=>t-x<10000);if(p.rate.length>=30){lres(conn,action,false,'rate-limited');return null;}p.rate.push(t);
    return p;
  }
  function guests(){return [...S.players.values()].filter(p=>p.playerId!=='host');}
  function claimable(id){const e=G.emps&&G.emps[id];return !!e&&e.id!==hostEmpireId&&e.ai===true&&!e.dead&&!e.wild&&!e.crisisSide;}
  function setClaim(p,empire){
    if(empire!==null&&!Number.isInteger(empire))return {ok:false,why:'bad-empire'};
    if(empire===hostEmpireId)return {ok:false,why:'host-empire'};
    if(empire!==null&&!claimable(empire))return {ok:false,why:'not-claimable'};
    if(empire!==null&&guests().some(x=>x!==p&&x.claim===empire))return {ok:false,why:'taken'};
    if(p.claim!==empire){p.claim=empire;if(p.ready)p.ready=false;broadcastLobby();}   // devlet değişince hazır sıfırlanır
    return {ok:true};
  }
  function phaseNow(){if(!L)return 'ingame';if(L.phase==='waiting'&&canStart().ok)return 'ready';return L.phase;}
  function canStart(){
    if(!L)return {ok:false,why:'no-lobby'};
    if(!['waiting','ready'].includes(L.phase))return {ok:false,why:L.phase==='created'?'no-galaxy':'already-started'};
    const gs=guests();
    if(!gs.length)return {ok:false,why:'no-guests'};
    for(const p of gs){if(!p.conn)return {ok:false,why:'guest-offline'};if(p.claim===null)return {ok:false,why:'guest-no-empire'};if(!p.ready)return {ok:false,why:'guest-not-ready'};if(!claimable(p.claim))return {ok:false,why:'not-claimable'};}
    return {ok:true};
  }
  function empireCard(e){return {id:e.id,n:e.name,race:RACES[e.race]?RACES[e.race].n:e.race,doc:PERSONAS[e._pers||e.mizac]?PERSONAS[e._pers||e.mizac].n:null,col:e.col};}
  function prepCard(e){return {doktrin:PERSONAS[e._pers||e.mizac]?.n||null,gorunus:LOOKS[e.look]?.n||null,fizyoloji:PHYSIO[e.physio]?.n||null,etik:{...e.ethics},
    civic:(e.civics||[]).map(c=>CIVICS[c]?.n||c),koken:ORIGINS[e.origin]?.n||null,irk:RACES[e.race]?.n||null};}
  function lobbyView(viewer){
    const gs=[...S.players.values()].sort((a,b)=>a.seat-b.seat);
    /* Oyun başlayınca AI devlet listesi gitmez (temas kurulmamış devletler gizli); yalnız insanların devletleri kalır. */
    const started=['starting','ingame','paused'].includes(L.phase);
    const empires=L.galaxyRev?G.emps.filter(e=>e.id!==hostEmpireId&&!e.wild&&!e.crisisSide&&!e.dead).map(e=>({...empireCard(e),seat:(gs.find(p=>p.playerId!=='host'&&(p.claim===e.id||p.empireId===e.id))||{}).seat??null})).filter(e=>!started||e.seat!==null):[];
    /* Tohum yalnız host'ta: tohum + açık motor kodu tüm galaksiyi (konumlar, AI devletleri) yeniden kurdurur. */
    const settings=L.settings&&(viewer&&viewer.playerId==='host'?L.settings:{size:L.settings.size,aiCount:L.settings.aiCount,...(L.settings.shape!==undefined?{shape:L.settings.shape}:{})});
    const mine=viewer&&viewer.claim!==null&&G.emps&&G.emps[viewer.claim]?{empire:viewer.claim,...prepCard(G.emps[viewer.claim])}:null;
    return {v:PROTOCOL,type:'lobby',rev:L.rev,phase:phaseNow(),pause:L.pause||null,capacity:L.capacity,settings,galaxyRev:L.galaxyRev,
      you:viewer?{seat:viewer.seat}:null,canStart:canStart().ok,
      players:gs.map(p=>({seat:p.seat,name:p.name,color:p.color,host:p.playerId==='host',online:p.playerId==='host'||!!p.conn,claim:p.empireId!==null?p.empireId:p.claim,ready:!!p.ready,tab:p.tab})),
      empires,mine};
  }
  function broadcastLobby(){if(!L)return;L.rev++;for(const p of S.players.values())if(p.conn)out(p.conn,lobbyView(p));if(opts.onLobby)opts.onLobby(lobbyView(S.players.get('host')));}
  function onMessage(conn,text){
    stats.in++;stats.bytesIn+=text.length;
    if(text.length>MAX_IN){stats.rejected++;return out(conn,{v:PROTOCOL,type:'error',code:'too-big'});}
    let m;try{m=JSON.parse(text);}catch{stats.rejected++;return out(conn,{v:PROTOCOL,type:'error',code:'bad-json'});}
    if(!plain(m)||m.v!==PROTOCOL||typeof m.type!=='string'||!(m.type in HANDLERS)){stats.rejected++;return out(conn,{v:PROTOCOL,type:'error',code:'bad-message'});}
    HANDLERS[m.type](conn,m);
  }
  function onLeave(conn){const p=playerOf(conn);S.conns.delete(conn);if(p&&p.conn===conn){p.conn=null;p.lastView=null;p.lastSeen=now();if(L&&['waiting','ready'].includes(L.phase)&&p.ready)p.ready=false;if(opts.onPlayer)opts.onPlayer(p.playerId,'leave');if(L)broadcastLobby();}}

  /* ---------- devlet sahipliği (yalnız host API) ---------- */
  function assign(playerId,empireId){
    const p=S.players.get(playerId),e=G.emps[empireId];
    if(!p||playerId==='host')return {ok:false,why:'player'};
    if(!e||e.dead||e.wild||e.crisisSide)return {ok:false,why:'empire'};
    if(empireId===hostEmpireId)return {ok:false,why:'host-empire'};
    if(S.slots.has(empireId)&&S.slots.get(empireId)!==playerId)return {ok:false,why:'taken'};
    if(p.empireId!==null&&p.empireId!==empireId)return {ok:false,why:'player-has-empire'};
    if(p.empireId===empireId)return {ok:true};
    /* AI karar döngüsünden çıkış: motorun kendi bayrağı. aiTurn, aiDirectiveTick,
       ordu/terhis/ticaret AI döngüleri e.ai ister. Devralınan otomasyon kapanır,
       eski değerler AI'ya iade için saklanır. */
    p.takeover={ai:e.ai,auto:{}};
    for(const c of e.colonies){const pl=G.sys[c.s]?.planets[c.p];if(pl&&pl.col&&pl.owner===e.id){p.takeover.auto[c.s+':'+c.p]=pl.col.auto;pl.col.auto=false;}}
    p.wasAI=!!e.ai;e.ai=false;p.empireId=empireId;S.slots.set(empireId,playerId);S.journal.push({rev:S.worldRevision,day:G.day,playerId,empireId,assign:1});
    if(typeof AI_VIEW_CACHE!=='undefined')AI_VIEW_CACHE.delete(e);
    if(p.conn){p.lastView=null;out(p.conn,{v:PROTOCOL,type:'assign',room:S.roomId,hostId:S.hostId,playerId:p.playerId,token:p.token,empireId,lastSeq:p.lastSeq,rev:S.worldRevision});publishTo(p,S.worldRevision);}
    return {ok:true};
  }
  function release(empireId,toAI=true){
    const pid=S.slots.get(empireId),p=pid&&S.players.get(pid);if(!p||pid==='host')return {ok:false};
    const e=G.emps[empireId];S.slots.delete(empireId);p.empireId=null;p.lastView=null;
    if(toAI&&e){e.ai=true;for(const [k,v] of Object.entries(p.takeover?.auto||{})){const [s,i]=k.split(':').map(Number),pl=G.sys[s]?.planets[i];if(pl&&pl.col&&pl.owner===e.id)pl.col.auto=v;}}
    p.takeover=null;if(p.conn)out(p.conn,{v:PROTOCOL,type:'assign',room:S.roomId,hostId:S.hostId,playerId:p.playerId,token:p.token,empireId:null,lastSeq:p.lastSeq,rev:S.worldRevision});
    return {ok:true};
  }

  /* ---------- AI'nın insan adına karar vermesini engelleyen koruma ----------
     aiNegotiate, AI kaynaklı bütün anlaşmaların tek kapısıdır ve oyuncu (id 0)
     için zaten boş sonuç döndürür; aynı sonuç uzak insan devletine de uygulanır.
     aiRespond doğrudan çağrıldığında (host arayüzünden uzak insana teklif) karar
     verilmez. Gerçek insan gelen kutusu MP.2 kapsamıdır. */
  function installGuards(){
    if(root.__mp0Guards)return;root.__mp0Guards=true;
    const neg=aiNegotiate,resp=aiRespond;
    /* MP.2: uzak insanın araştırma bildirimleri (researchTick içindeki say) host günlüğüne değil o oyuncunun
       kendi bildirim listesine gider. Yalnız uzak insan için; tek oyunculu ve AI yolu aynen çalışır. */
    const rtick=researchTick;
    researchTick=function(e){if(!remoteHuman(e))return rtick.apply(this,arguments);
      const s0=say;say=function(m,c){note(e.id,m,c);};try{return rtick.apply(this,arguments);}finally{say=s0;}};
    /* MP.3: AI'nın uzak insana kendi kararıyla yaptığı teklif (NAP, ticaret, ittifak, stratejik…) insan kutusuna gider;
       insan adına AI karar vermez. Uzak insanın teklif eden olduğu aiNegotiate çağrısı yok sayılır (MP.0 koruması). */
    aiNegotiate=function(a,b,give,want){if(remoteHuman(b)&&a&&a.ai)return aiToHuman(a,b,give,want);
      if(remoteHuman(a)||remoteHuman(b)){stats.blockedAI++;return {tur:0,karar:null,uygulandi:false,why:'İnsan oyuncu adına AI karar vermez',karsi:null};}return neg.apply(this,arguments);};
    aiRespond=function(ai){if(remoteHuman(ai)){stats.blockedAI++;return {v:'bekle',why:'İnsan oyuncu kararı kendi gelen kutusunda verir'};}return resp.apply(this,arguments);};
  }

  /* ---------- oturum metadatası (Save8'den ayrı, sürümlü) ---------- */
  function meta(saveText){
    return {mpMeta:1,saveId:S.saveId,roomId:S.roomId,worldRevision:S.worldRevision,hostId:S.hostId,
      build:typeof BUILD_ID==='string'?BUILD_ID:null,saveVersion:8,seed:G.seed,day:G.day,speed:G.speed|0,access:S.access,
      saveHash:typeof saveText==='string'?fnv(saveText):null,
      players:[...S.players.values()].map(p=>({playerId:p.playerId,name:p.name,token:p.token,empireId:p.empireId,lastSeq:p.lastSeq,wasAI:p.wasAI,takeover:p.takeover,lastSeen:p.lastSeen}))};
  }
  function restore(m,saveText){
    if(!plain(m)||m.mpMeta!==1||m.saveVersion!==8||m.roomId!==S.roomId)return {ok:false,why:'meta'};
    if(m.saveHash!==fnv(saveText))return {ok:false,why:'save-mismatch'};
    if(typeof BUILD_ID==='string'&&m.build!==BUILD_ID)return {ok:false,why:'build'};
    for(const x of m.players)if(x.playerId!=='host'&&x.empireId!==null){const e=G.emps[x.empireId];if(!e||e.ai!==false)return {ok:false,why:'slot-state'};}
    S.saveId=m.saveId;S.worldRevision=m.worldRevision;S.players.clear();S.slots.clear();S.conns.clear();
    for(const x of m.players){S.players.set(x.playerId,{...x,conn:null,results:new Map(),lastView:null,lastRev:0});if(x.empireId!==null)S.slots.set(x.empireId,x.playerId);}
    return {ok:true};
  }
  /* MP.1 — uzak insanların keşif belleği: oyuncu için updateVision'ın yaptığını
     (görülen sisteme s.seen'e kimlik yazmak) aynı kuralla yapar. Yalnız uzak insan
     devletleri; tek oyunculu oyunda ve insan yoksa hiçbir şey yazmaz. RNG yok. */
  function observeHumans(){let n=0;
    for(const e of G.emps){if(!remoteHuman(e)||e.dead)continue;
      for(const id of actorVision(e)){const s=G.sys[id];if(s&&!s.seen.includes(e.id)){s.seen.push(e.id);n++;}}
      if(typeof AI_VIEW_CACHE!=='undefined')AI_VIEW_CACHE.delete(e);}
    return n;}
  /* ---------- MP.1 lobi host API'si (ağdan erişilemez) ---------- */
  const SETTINGS_KEYS=['size','shape','aiCount','seed'];
  function configure(set){
    if(!L)return {ok:false,why:'no-lobby'};
    if(!['created','waiting','ready'].includes(L.phase))return {ok:false,why:'phase'};
    if(!plain(set)||!onlyKeys(set,SETTINGS_KEYS))return {ok:false,why:'bad-settings'};
    if(!has(SIZES,set.size)||(set.shape!==undefined&&!has(SHAPES,set.shape))||!int(set.aiCount,1,11)||!int(set.seed,1,2147483647))return {ok:false,why:'bad-settings'};
    if(set.aiCount<L.capacity-1)return {ok:false,why:'ai-below-capacity'};
    const r=opts.lobby.generate({...set});if(!r||!r.ok)return {ok:false,why:'generate'};
    L.settings={...set};L.galaxyRev++;L.phase='waiting';
    for(const p of guests()){p.claim=null;p.ready=false;}          // ayar değişti: seçim ve hazırlar sıfır
    broadcastLobby();return {ok:true};
  }
  function setCapacity(n){
    if(!L||!['created','waiting','ready'].includes(L.phase))return {ok:false,why:'phase'};
    if(!int(n,2,4))return {ok:false,why:'bad-capacity'};
    if(guests().length>n-1)return {ok:false,why:'too-many'};
    if(L.settings&&L.settings.aiCount<n-1)return {ok:false,why:'ai-below-capacity'};
    L.capacity=n;broadcastLobby();return {ok:true};
  }
  function claimFor(pid,empire){const p=S.players.get(pid);if(!L||!p||pid==='host')return {ok:false,why:'player'};
    if(!['waiting','ready'].includes(L.phase))return {ok:false,why:'phase'};return setClaim(p,empire);}
  function setHostTab(tab){if(!L||!TABS.includes(tab))return {ok:false};const h=S.players.get('host');if(h.tab!==tab){h.tab=tab;broadcastLobby();}return {ok:true};}
  function start(){
    const c=canStart();if(!c.ok){if(L&&c.why==='already-started')L.starts++;return c;}
    L.phase='starting';L.starts++;
    const done=[];
    for(const p of guests()){const r=assign(p.playerId,p.claim);if(!r.ok){for(const d of done)release(d,true);L.phase='waiting';broadcastLobby();return {ok:false,why:'assign:'+r.why};}done.push(p.claim);}
    observeHumans();
    L.phase='ingame';broadcastLobby();publish();return {ok:true};
  }
  function kickPlayer(pid,toAI=false){
    const p=S.players.get(pid);if(!p||pid==='host')return {ok:false};
    if(p.token&&L)L.banned.add(p.token);
    if(p.empireId!==null){const eid=p.empireId;if(toAI)release(eid,true);else{S.slots.delete(eid);p.empireId=null;}}
    if(p.conn){out(p.conn,{v:PROTOCOL,type:'error',code:'kicked'});kick(p.conn,'kicked');S.conns.delete(p.conn);}
    S.players.delete(pid);broadcastLobby();return {ok:true};
  }
  function closeRoom(){if(!L)return {ok:false};L.phase='closed';broadcastLobby();for(const p of guests())if(p.conn){kick(p.conn,'room-closed');S.conns.delete(p.conn);p.conn=null;}return {ok:true};}
  return {onMessage,onLeave,onJoin(){},publish,publishTo,assign,release,installGuards,meta,restore,viewFor,local,dip:D,dipView,
    isHuman:humanEmpire,isRemoteHuman:remoteHuman,state:S,stats,COMMANDS,HANDLERS,clock,fnv,observeHumans,
    configure,setCapacity,claimFor,setHostTab,start,canStart,kick:kickPlayer,close:closeRoom,lobbyView:()=>L&&lobbyView(S.players.get('host')),lobby:L,
    /* MP.1.1: duraklatma nedeni (host-offline / host-background) misafire lobide 'pause' olarak gider; MP.0 çağrısı nedensiz kalır. */
    setPaused(v,why){S.paused=!!v;if(L&&['ingame','paused'].includes(L.phase)){const ph=v?'paused':'ingame',pw=v?(why||'host'):null;if(L.phase!==ph||L.pause!==pw){L.phase=ph;L.pause=pw;broadcastLobby();}}}};
}
root.StarsMP={PROTOCOL,createHost,fnv,isHumanActor,actorVision,TABS};
})(typeof globalThis!=='undefined'?globalThis:this);
