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

  function out(conn,obj){const text=JSON.stringify(obj);stats.out++;stats.bytesOut+=text.length;send(conn,text);return text.length;}
  function playerOf(conn){const id=S.conns.get(conn);return id?S.players.get(id):null;}
  function humanEmpire(e){return !!e&&S.slots.has(e.id);}
  function remoteHuman(e){return humanEmpire(e)&&e.id!==hostEmpireId;}

  /* ---------- filtreli görünüm (yalnız okuma) ---------- */
  function viewFor(e){
    const ctx=explorationContext(e),known=ctx.known,visible=ctx.visible;
    const sys={},lanes=[];
    for(const s of G.sys){
      const v={i:s.id,x:Math.round(s.x),y:Math.round(s.y)};                // kamu coğrafyası: tek oyunculu haritadaki soluk nokta
      if(known.has(s.id)){
        v.k=1;v.n=s.name;v.st=STARS.indexOf(s.star);
        if(s.surv.includes(e.id)){v.sv=1;v.pl=s.planets.map(p=>{const o={i:p.i,t:p.t,sz:p.sz};if(visible.has(s.id)&&p.owner>=0)o.o=p.owner;return o;});}
        if(visible.has(s.id)){v.vis=1;v.o=s.owner;}
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
        fleets[f.id]={id:f.id,own:1,s:f.sys,to:f.path.length?f.path[f.path.length-1]:(f.mv?f.mv.to:f.sys),sh};continue;}
      const seen=f.sys>=0?visible.has(f.sys):!!(f.mv&&(visible.has(f.mv.from)||visible.has(f.mv.to)));
      if(seen)fleets[f.id]={id:f.id,e:f.e,s:f.sys>=0&&visible.has(f.sys)?f.sys:-1,n:f.ships.length};
    }
    const emps={};
    for(const o of G.emps)if(o!==e&&!o.dead&&e.contact[o.id])emps[o.id]={id:o.id,n:o.name,col:o.col,war:!!e.war[o.id],rel:Math.round(e.rel[o.id]||0)};
    const me={id:e.id,n:e.name,col:e.col,dead:!!e.dead,home:e.home,res:Object.fromEntries(Object.entries(e.res).map(([k,v])=>[k,r1(v)])),
      inc:Object.fromEntries(Object.entries(e.inc||{}).map(([k,v])=>[k,r1(v)])),tech:Object.keys(e.techs).length,rq:{...e.rq}};
    const catalog={b:{}};
    for(const [k,B] of Object.entries(BUILDINGS))catalog.b[k]={n:B.n,c:buildingCost(e,k),max:B.max,ok:!B.tech||!!e.techs[B.tech]};
    catalog.f=Object.fromEntries(Object.entries(FOCUS).map(([k,F])=>[k,F.n]));
    return {me,sys,lanes,cols,fleets,emps,catalog};
  }
  function clock(){return {day:Math.floor(G.day),y:G.year,m:G.month,spd:G.speed|0};}
  const KEYED=['sys','cols','fleets','emps'];
  function diff(a,b){
    const ops={};
    for(const sec of KEYED){const up={},rm=[];
      for(const k of Object.keys(b[sec]))if(!has(a[sec],k)||JSON.stringify(a[sec][k])!==JSON.stringify(b[sec][k]))up[k]=b[sec][k];
      for(const k of Object.keys(a[sec]))if(!has(b[sec],k))rm.push(k);
      if(Object.keys(up).length)(ops.up||(ops.up={}))[sec]=up;
      if(rm.length)(ops.rm||(ops.rm={}))[sec]=rm;}
    for(const sec of ['me','lanes','catalog'])if(JSON.stringify(a[sec])!==JSON.stringify(b[sec]))(ops.set||(ops.set={}))[sec]=b[sec];
    return ops;
  }
  function publishTo(p,rev){
    if(!p.conn||p.empireId===null)return;
    const e=G.emps[p.empireId],t0=now(),view=viewFor(e);let n;
    if(!p.lastView){n=out(p.conn,{v:PROTOCOL,type:'snapshot',rev,t:clock(),you:{playerId:p.playerId,empireId:p.empireId},view});stats.snapshots++;stats.snapshotBytes.push(n);}
    else{n=out(p.conn,{v:PROTOCOL,type:'delta',rev,base:p.lastRev,t:clock(),ops:diff(p.lastView,view)});stats.deltas++;stats.deltaBytes.push(n);}
    p.lastView=view;p.lastRev=rev;stats.publishMs.push(now()-t0);
  }
  function publish(){const rev=++S.worldRevision;for(const p of S.players.values())publishTo(p,rev);return rev;}

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
      apply:(e,{sys,pl},c)=>cancelBuild(e,sys,pl,c.index)}
  });

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
    if(p.empireId===null)return result(p,conn,msg,'rejected','no-empire');
    if(has(msg,'empire')&&msg.empire!==p.empireId)return result(p,conn,msg,'rejected','forged-empire');
    if(S.paused)return result(p,conn,msg,'rejected','paused');
    const c=msg.cmd;
    if(!plain(c)||typeof c.kind!=='string'||!(c.kind in COMMANDS))return result(p,conn,msg,'rejected','unknown-kind');
    const def=COMMANDS[c.kind];
    if(!onlyKeys(c,def.keys)||!def.check(c))return result(p,conn,msg,'rejected','bad-params');
    const e=G.emps[p.empireId];
    if(!e||e.dead)return result(p,conn,msg,'rejected','empire-dead');
    const at=locate(e,c);if(at.err)return result(p,conn,msg,'rejected',at.err);
    const why=def.why(e,at,c);if(why)return result(p,conn,msg,'rejected','rules:'+why);
    const records=txCaptureGraph(def.roots(e,at)),rng=RND_STATE;let ok=false;
    try{ok=!!def.apply(e,at,c);}catch(err){txRestoreGraph(records);rndSeed(rng);return result(p,conn,msg,'rejected','error');}
    if(!ok){txRestoreGraph(records);rndSeed(rng);return result(p,conn,msg,'rejected','rules');}
    stats.applied++;S.worldRevision++;S.journal.push({rev:S.worldRevision,day:G.day,playerId:p.playerId,empireId:p.empireId,cmd:JSON.parse(JSON.stringify(c))});
    const r=result(p,conn,msg,'ok',null);stats.commandMs.push(now()-t0);
    publish();                                   // sonuç herkese kendi filtresiyle yansır
    return r;
  }

  /* ---------- ağ mesajları: yalnız bu tablo ---------- */
  const HANDLERS=table({
    hello(conn,m){
      if(!onlyKeys(m,['v','type','name','token'])||typeof m.name!=='string'||(m.token!==undefined&&(typeof m.token!=='string'||!/^[a-f0-9]{32}$/.test(m.token))))
        return out(conn,{v:PROTOCOL,type:'error',code:'bad-hello'});
      const name=m.name.replace(/[\u0000-\u001f<>]/g,'').slice(0,24)||'Oyuncu';
      let p=m.token?[...S.players.values()].find(x=>x.token===m.token):null;
      if(p){if(p.conn&&p.conn!==conn){S.conns.delete(p.conn);kick(p.conn,'replaced');}}
      else{p={playerId:'p-'+random(6),name,token:random(16),empireId:null,conn:null,lastSeq:0,results:new Map(),lastView:null,lastRev:0,wasAI:null,takeover:null,lastSeen:now()};S.players.set(p.playerId,p);}
      const prev=playerOf(conn);if(prev&&prev!==p){prev.conn=null;prev.lastView=null;}   // aynı bağlantı başka kimliğe geçerse eskisi bağsız kalır
      p.conn=conn;p.lastView=null;p.lastSeen=now();S.conns.set(conn,p.playerId);
      out(conn,{v:PROTOCOL,type:'assign',room:S.roomId,hostId:S.hostId,playerId:p.playerId,token:p.token,empireId:p.empireId,lastSeq:p.lastSeq,rev:S.worldRevision});
      if(p.empireId!==null)publishTo(p,S.worldRevision);
      if(opts.onPlayer)opts.onPlayer(p.playerId,'hello');
    },
    cmd(conn,m){
      if(!onlyKeys(m,['v','type','seq','cid','cmd','empire','base'])||!int(m.seq,1,2147483647)||typeof m.cid!=='string'||!/^[A-Za-z0-9_-]{8,40}$/.test(m.cid))
        return out(conn,{v:PROTOCOL,type:'error',code:'bad-cmd'});
      runCommand(conn,m);
    },
    resync(conn,m){const p=playerOf(conn);if(!p||p.empireId===null)return out(conn,{v:PROTOCOL,type:'error',code:'no-empire'});p.lastView=null;publishTo(p,S.worldRevision);},
    ping(conn,m){if(!int(m.t,0,Number.MAX_SAFE_INTEGER))return;out(conn,{v:PROTOCOL,type:'pong',t:m.t,day:Math.floor(G.day)});}
  });
  function onMessage(conn,text){
    stats.in++;stats.bytesIn+=text.length;
    if(text.length>MAX_IN){stats.rejected++;return out(conn,{v:PROTOCOL,type:'error',code:'too-big'});}
    let m;try{m=JSON.parse(text);}catch{stats.rejected++;return out(conn,{v:PROTOCOL,type:'error',code:'bad-json'});}
    if(!plain(m)||m.v!==PROTOCOL||typeof m.type!=='string'||!(m.type in HANDLERS)){stats.rejected++;return out(conn,{v:PROTOCOL,type:'error',code:'bad-message'});}
    HANDLERS[m.type](conn,m);
  }
  function onLeave(conn){const p=playerOf(conn);S.conns.delete(conn);if(p&&p.conn===conn){p.conn=null;p.lastView=null;p.lastSeen=now();if(opts.onPlayer)opts.onPlayer(p.playerId,'leave');}}

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
    aiNegotiate=function(a,b){if(remoteHuman(a)||remoteHuman(b)){stats.blockedAI++;return {tur:0,karar:null,uygulandi:false,why:'MP.0: insan oyuncu diplomasisi MP.2 kapsamında',karsi:null};}return neg.apply(this,arguments);};
    aiRespond=function(ai){if(remoteHuman(ai)){stats.blockedAI++;return {v:'bekle',why:'İnsan oyuncu: teklif MP.2 gelen kutusuna gider (MP.0 kapalı)'};}return resp.apply(this,arguments);};
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
  return {onMessage,onLeave,onJoin(){},publish,publishTo,assign,release,installGuards,meta,restore,viewFor,
    isHuman:humanEmpire,isRemoteHuman:remoteHuman,state:S,stats,COMMANDS,HANDLERS,clock,fnv,
    setPaused(v){S.paused=!!v;}};
}
root.StarsMP={PROTOCOL,createHost,fnv};
})(typeof globalThis!=='undefined'?globalThis:this);
