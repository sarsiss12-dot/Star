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

/* ═══ MP.4 — çok oyunculu kayıt paketi (Save8 değişmez; yanına sürümlü oturum + teklif deposu) ═══
   Bütünlük: SHA-256 (save8 ve gövdenin kanonik JSON'u) bozulma/yanlış dosyayı yakalar. Kimlik: kayıtta jeton YOK; her
   misafir için tuzlu SHA-256 özeti tutulur, yeniden katılırken misafirin cihazındaki jeton bu özetle doğrulanır.
   Host zaten oyunun otoritesidir; kayıt dosyasının kendisi bir imza değildir (belgede açıkça). */
const PKG_FORMAT='stars-mp-save',PKG_VERSION=4,MAX_PKG=32e6,MAX_SAVE8=30e6;
const K256=[0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
  0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
  0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
  0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
/* FIPS 180-4 SHA-256, UTF-8 metin girdisi; eşzamanlı (motor ve çekirdek eşzamanlı çalışır). Test vektörleriyle denetlenir. */
function sha256(str){
  str=String(str);const buf=new Uint8Array(str.length*3+72);let n=0;
  for(let i=0;i<str.length;i++){let c=str.charCodeAt(i);
    if(c<0x80)buf[n++]=c;
    else if(c<0x800){buf[n++]=0xc0|c>>6;buf[n++]=0x80|c&63;}
    else if(c>=0xd800&&c<0xdc00&&i+1<str.length&&str.charCodeAt(i+1)>=0xdc00&&str.charCodeAt(i+1)<0xe000){c=0x10000+((c-0xd800)<<10)+(str.charCodeAt(++i)-0xdc00);
      buf[n++]=0xf0|c>>18;buf[n++]=0x80|c>>12&63;buf[n++]=0x80|c>>6&63;buf[n++]=0x80|c&63;}
    else if(c>=0xd800&&c<0xe000){buf[n++]=0xef;buf[n++]=0xbf;buf[n++]=0xbd;}
    else{buf[n++]=0xe0|c>>12;buf[n++]=0x80|c>>6&63;buf[n++]=0x80|c&63;}}
  const bytes=n,hi=Math.floor(bytes/0x20000000),lo=(bytes*8)>>>0;buf[n++]=0x80;while(n%64!==56)n++;
  buf[n++]=hi>>>24&255;buf[n++]=hi>>>16&255;buf[n++]=hi>>>8&255;buf[n++]=hi&255;buf[n++]=lo>>>24&255;buf[n++]=lo>>>16&255;buf[n++]=lo>>>8&255;buf[n++]=lo&255;
  const W=new Int32Array(64),ror=(x,k)=>(x>>>k)|(x<<(32-k));
  let h0=0x6a09e667,h1=0xbb67ae85,h2=0x3c6ef372,h3=0xa54ff53a,h4=0x510e527f,h5=0x9b05688c,h6=0x1f83d9ab,h7=0x5be0cd19;
  for(let o=0;o<n;o+=64){
    for(let t=0;t<16;t++)W[t]=buf[o+4*t]<<24|buf[o+4*t+1]<<16|buf[o+4*t+2]<<8|buf[o+4*t+3];
    for(let t=16;t<64;t++){const a=W[t-15],b=W[t-2];W[t]=(W[t-16]+(ror(a,7)^ror(a,18)^(a>>>3))+W[t-7]+(ror(b,17)^ror(b,19)^(b>>>10)))|0;}
    let a=h0,b=h1,c=h2,d=h3,e=h4,f=h5,g=h6,h=h7;
    for(let t=0;t<64;t++){const t1=(h+(ror(e,6)^ror(e,11)^ror(e,25))+((e&f)^(~e&g))+K256[t]+W[t])|0,t2=((ror(a,2)^ror(a,13)^ror(a,22))+((a&b)^(a&c)^(b&c)))|0;
      h=g;g=f;f=e;e=(d+t1)|0;d=c;c=b;b=a;a=(t1+t2)|0;}
    h0=(h0+a)|0;h1=(h1+b)|0;h2=(h2+c)|0;h3=(h3+d)|0;h4=(h4+e)|0;h5=(h5+f)|0;h6=(h6+g)|0;h7=(h7+h)|0;}
  return [h0,h1,h2,h3,h4,h5,h6,h7].map(x=>('0000000'+(x>>>0).toString(16)).slice(-8)).join('');
}
/* sıralı anahtarlı JSON (bütünlük özeti için; undefined alanlar JSON'daki gibi düşer) */
function canon(v){if(Array.isArray(v))return '['+v.map(x=>x===undefined?'null':canon(x)).join(',')+']';
  if(v&&typeof v==='object')return '{'+Object.keys(v).filter(k=>v[k]!==undefined).sort().map(k=>JSON.stringify(k)+':'+canon(v[k])).join(',')+'}';return JSON.stringify(v);}
const HEX=(s,n)=>typeof s==='string'&&s.length===n&&/^[a-f0-9]+$/.test(s);
const ITEM_T=['res','peace','nap','pact','ally','intel','spynet','passage','tech','sys','lux','freight','tribute','warOn','peaceWith'];
const RES_K=['min','ene','yiy','ala','tuk','ara','etk'];
function pkgItem(it){if(!plain(it)||!ITEM_T.includes(it.t)||Object.keys(it).length>8)return 'items';
  for(const [k,v] of Object.entries(it))if(!['number','string','boolean'].includes(typeof v)||typeof v==='number'&&!Number.isFinite(v)||typeof v==='string'&&v.length>40)return 'items';
  if(it.t==='res'&&(!RES_K.includes(it.r)||!Number.isFinite(it.v)||it.v<=0||it.v>1e7))return 'amount';return null;}
/* Paketi doğrula (yan etkisiz). Metin ya da nesne alır. Önce boyut ve bütünlük, sonra şema. */
function validatePackage(input,o={}){
  const fail=(why,detail)=>({ok:false,why,...(detail?{detail}:{})});let pkg=input;
  if(typeof input==='string'){if(input.length>MAX_PKG)return fail('too-big');try{pkg=JSON.parse(input);}catch{return fail('json');}}
  if(!plain(pkg))return fail('json');
  if(pkg.mpMeta===1)return fail('legacy');
  const KEYS=['format','mpVersion','build','createdAt','saveId','session','diplomacy','display','save8','integrity'];
  if(!onlyKeys(pkg,KEYS)||KEYS.some(k=>!has(pkg,k)))return fail('fields');
  if(pkg.format!==PKG_FORMAT)return fail('format');
  if(pkg.mpVersion!==PKG_VERSION)return fail('version');
  const build=has(o,'build')?o.build:(typeof BUILD_ID==='string'?BUILD_ID:null);if(pkg.build!==build)return fail('build');
  if(typeof pkg.save8!=='string')return fail('fields');if(pkg.save8.length>MAX_SAVE8)return fail('too-big');
  if(!Number.isFinite(pkg.createdAt)||typeof pkg.saveId!=='string'||!/^s-[a-f0-9]{16}$/.test(pkg.saveId))return fail('fields');
  const I=pkg.integrity;if(!plain(I)||!onlyKeys(I,['alg','save8','body'])||I.alg!=='SHA-256'||!HEX(I.save8,64)||!HEX(I.body,64))return fail('integrity');
  if(sha256(pkg.save8)!==I.save8)return fail('integrity-save8');
  const body={};for(const k of KEYS)if(k!=='integrity')body[k]=pkg[k];body.save8=I.save8;
  if(sha256(canon(body))!==I.body)return fail('integrity-body');
  let d;try{d=JSON.parse(pkg.save8);}catch{return fail('save8-json');}
  if(!plain(d))return fail('save8-json');if(d.v!==8)return fail('save-version');
  const ss=pkg.session;
  if(!plain(ss)||!onlyKeys(ss,['roomId','worldRevision','hostEmpireId','speed','capacity','settings','players','notes']))return fail('session');
  if(!int(ss.worldRevision,0,2147483647)||!int(ss.hostEmpireId,0,63)||!int(ss.speed,0,16)||!int(ss.capacity,2,8)||typeof ss.roomId!=='string'||ss.roomId.length>40)return fail('session');
  if(ss.settings!==null&&(!plain(ss.settings)||!onlyKeys(ss.settings,['size','aiCount','shape'])||typeof ss.settings.size!=='string'||!int(ss.settings.aiCount,1,11)))return fail('session');
  if(!Array.isArray(ss.players)||ss.players.length<1||ss.players.length>8)return fail('session');
  if(ss.players.filter(x=>plain(x)&&x.playerId==='host').length!==1)return fail('host');
  const pids=new Set(),eids=new Set();let hosts=0;
  for(const x of ss.players){
    if(!plain(x)||!onlyKeys(x,['playerId','name','empireId','seat','color','lastSeq','wasAI','takeover','auth']))return fail('session');
    if(typeof x.name!=='string'||x.name.length>24||!int(x.seat,0,64)||typeof x.color!=='string'||x.color.length>16||!int(x.lastSeq,0,2147483647))return fail('session');
    if(!int(x.empireId,0,63))return fail('bad-empire');
    if(pids.has(x.playerId))return fail('dup-player');pids.add(x.playerId);
    if(eids.has(x.empireId))return fail('dup-empire');eids.add(x.empireId);
    if(x.playerId==='host'){hosts++;if(x.empireId!==ss.hostEmpireId||has(x,'auth'))return fail('host');continue;}
    if(typeof x.playerId!=='string'||!/^p-[a-f0-9]{12}$/.test(x.playerId))return fail('session');
    if(x.empireId===ss.hostEmpireId)return fail('dup-empire');
    if(!plain(x.auth)||!onlyKeys(x.auth,['salt','hash'])||!HEX(x.auth.salt,32)||!HEX(x.auth.hash,64))return fail('auth');
    if(typeof x.wasAI!=='boolean')return fail('session');
    if(x.takeover!==null&&(!plain(x.takeover)||!onlyKeys(x.takeover,['ai','auto'])||typeof x.takeover.ai!=='boolean'||!plain(x.takeover.auto)||
      Object.entries(x.takeover.auto).some(([k,v])=>!/^\d{1,4}:\d{1,2}$/.test(k)||typeof v!=='boolean')))return fail('session');
  }
  if(hosts!==1)return fail('host');if(ss.players.length>ss.capacity)return fail('session');
  if(!plain(ss.notes))return fail('session');
  for(const [k,v] of Object.entries(ss.notes))if(!/^\d{1,2}$/.test(k)||!Array.isArray(v)||v.length>12||v.some(x=>!plain(x)||!onlyKeys(x,['d','m','c'])||!Number.isFinite(x.d)||typeof x.m!=='string'||x.m.length>160||typeof x.c!=='string'||x.c.length>12))return fail('session');
  const dp=pkg.diplomacy;
  if(!plain(dp)||!onlyKeys(dp,['next','offers'])||!int(dp.next,1,2147483647)||!Array.isArray(dp.offers)||dp.offers.length>400)return fail('offers');
  const ids=new Map();
  for(const r of dp.offers){
    if(!plain(r)||!onlyKeys(r,['id','from','to','give','want','born','expires','round','prev','status','why','by','cost','finished']))return fail('offers');
    if(!int(r.id,1,dp.next-1)||ids.has(r.id)||!int(r.from,0,63)||!int(r.to,0,63)||r.from===r.to)return fail('offers');
    if(!Array.isArray(r.give)||!Array.isArray(r.want)||r.give.length+r.want.length<1||r.give.length+r.want.length>12)return fail('offers');
    for(const it of r.give.concat(r.want)){const e=pkgItem(it);if(e)return fail(e);}
    if(!Number.isFinite(r.born)||!Number.isFinite(r.expires)||r.expires<r.born||!int(r.round,1,6)||!(r.prev===null||int(r.prev,1,2147483647)))return fail('offers');
    if(!['pending','accepted','rejected','countered','expired','invalid'].includes(r.status)||typeof r.why!=='string'||r.why.length>240||!['human','ai'].includes(r.by)||
      !Number.isFinite(r.cost)||r.cost<0||(has(r,'finished')&&!Number.isFinite(r.finished)))return fail('offers');
    if(r.round===1&&r.prev!==null||r.round>1&&r.prev===null)return fail('round');
    ids.set(r.id,r);}
  for(const r of dp.offers)if(r.prev!==null&&ids.has(r.prev)){const q=ids.get(r.prev);if(q.round!==r.round-1||q.status!=='countered'||!(q.from===r.to&&q.to===r.from))return fail('round');}
  const ds=pkg.display;
  if(!plain(ds)||typeof ds.name!=='string'||ds.name.length>40||!int(ds.year,0,99999)||!int(ds.month,0,12)||!int(ds.day,0,1e7)||!int(ds.systems,1,1000)||!Array.isArray(ds.humans)||ds.humans.length>8)return fail('display');
  return {ok:true,pkg,display:ds};
}
/* Doğrulanmış paketin dünyasını yükle: motorun kendi deserialize'ı (kendi işlemiyle geri alır). Oturumdaki her insan
   devleti yüklenen dünyada insan (ai:false) değilse önceki dünya geri yüklenir. */
function loadWorld(pkg){
  let prev=null;try{if(typeof G!=='undefined'&&G&&Array.isArray(G.emps)&&G.emps.length&&Array.isArray(G.sys)&&G.sys.length)prev=serialize();}catch{prev=null;}
  let ok=false;try{ok=deserialize(pkg.save8);}catch{ok=false;}
  if(!ok)return {ok:false,why:'save8-apply'};
  const bad=pkg.session.players.some(x=>{const e=G.emps[x.empireId];return !e||e.ai!==false;});
  if(bad){if(prev){try{deserialize(prev);}catch{}}return {ok:false,why:'slot-state'};}
  return {ok:true};
}
/* Eski MP.0 meta (mpMeta:1; jeton açık, FNV özeti) → MP.4 paketi: FNV ile eşleşme denetlenir, jetonlar tuzlu özete çevrilir,
   teklif deposu boş başlar (MP.0'da yoktu). FNV kriptografik değildir; yalnız eşleşme denetimi. */
function upgradeLegacy(m,saveText,o={}){
  if(!plain(m)||m.mpMeta!==1||m.saveVersion!==8||typeof saveText!=='string')return {ok:false,why:'legacy'};
  if(m.saveHash!==fnv(saveText))return {ok:false,why:'legacy-hash'};
  const random=o.random;if(typeof random!=='function')return {ok:false,why:'legacy'};
  let d;try{d=JSON.parse(saveText);}catch{return {ok:false,why:'save8-json'};}
  const ps=(m.players||[]).filter(x=>x&&(x.playerId==='host'||x.empireId!==null));
  const players=ps.map((x,i)=>{const y={playerId:x.playerId,name:String(x.name||'Oyuncu').slice(0,24),empireId:x.empireId,seat:x.playerId==='host'?0:i,color:'',lastSeq:x.lastSeq|0};
    if(x.playerId!=='host'){const salt=random(16);y.wasAI=!!x.wasAI;y.takeover=x.takeover||null;y.auth={salt,hash:sha256(salt+':'+String(x.token||''))};}return y;});
  const body={format:PKG_FORMAT,mpVersion:PKG_VERSION,build:m.build,createdAt:Number(o.now?o.now():0),saveId:/^s-[a-f0-9]{16}$/.test(m.saveId)?m.saveId:'s-'+random(8),
    session:{roomId:String(m.roomId||'').slice(0,40),worldRevision:m.worldRevision|0,hostEmpireId:0,speed:m.speed|0,capacity:Math.max(2,players.length),settings:null,players,notes:{}},
    diplomacy:{next:1,offers:[]},display:{name:'Eski MP.0 kaydı',year:d.year|0,month:d.month|0,day:Math.floor(d.day||0),size:null,systems:Array.isArray(d.sys)?d.sys.length:1,humans:players.map(x=>({name:x.name,empire:'?',host:x.playerId==='host'?1:0}))}};
  const h8=sha256(saveText),pkg={...body,save8:saveText,integrity:{alg:'SHA-256',save8:h8,body:sha256(canon({...body,save8:h8}))}};
  return validatePackage(pkg,{build:m.build});
}
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
    return {me,sys,lanes,cols,fleets,emps,catalog,sci,tech,log:(notes.get(e.id)||[]).slice(),dip:dipView(e),pol:polView(e)};
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
    for(const sec of ['me','lanes','catalog','sci','log','dip','pol'])if(JSON.stringify(a[sec])!==JSON.stringify(b[sec]))(ops.set||(ops.set={}))[sec]=b[sec];
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
  function publish(){dipSweep();pure(polSweep);const rev=++S.worldRevision;for(const p of S.players.values())publishTo(p,rev);return rev;}

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
    /* Gönderim öncesi önizleme (salt okuma: işlem, dergi, revizyon, yayın yok). Gösterilen Etki maliyeti ve engeller
       host'un dealQuote'undan gelir; istemcide maliyet formülü yok. İnsan alıcıda karşı tarafın stoğu yine gizli. */
    quote:{keys:['kind','to','give','want'],ro:true,
      check:c=>int(c.to,0,63)&&dipCheck(c),
      locate:()=>({}),
      why(e,at,c){const B=G.emps[c.to];return !B||B===e||!dipParty(B)||!e.contact[B.id]||!B.contact[e.id]?'no-target':null;},
      roots:()=>[],
      apply(e,at,c){const B=G.emps[c.to],q=dealQuote(dipNew(e,B,dipItems(c.give),dipItems(c.want))),g=dipGate(q,e,B);
        return {ok:true,extra:{ok:!g,cost:Math.round(q.cost||0),etk:Math.floor(e.res.etk||0),life:dipLife(),reasons:g?g.detail:[]}};}},
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
      apply(e,{r}){r.status='invalid';r.why='Gönderen geri çekti';r.finished=G.day;dipNotify(r.to,'Teklif geri çekildi — '+e.name);return true;}},
    /* ═══ MP.3.1 — federasyon ve vasallık. Yeni siyasi motor yok: her komut motorun kendi işlevini çağırır
       (requestFederation, proposeFedMotion, acceptFedInvite / rejectFedInvite, castFedVote, leaveFederation, proposeFedLaw,
       foundFederation, vassalOffer, vassalReply). Bu işlevlerin kendi işlemi (fedChange / vassalTransaction) vardır; ikinci
       bir işlem katmanı açılmaz (roots boş). Kayıtlar kanonik G'dedir (Save8); MP deposuna kopyalanmaz. */
    fedRequest:{keys:['kind','via'],check:c=>int(c.via,0,63),locate:()=>({}),
      why(e,at,c){const o=G.emps[c.via];if(!o||o===e||!e.contact[o.id]||!polParty(o))return 'no-target';const q=canRequestFederation(e,o);return q.ok?null:polWhy(q);},
      roots:()=>[],apply:(e,at,c)=>requestFederation(e,G.emps[c.via])},
    fedInvite:{keys:['kind','target'],check:c=>int(c.target,0,63),locate:()=>({}),
      why(e,at,c){const o=G.emps[c.target];if(!o||o===e||!e.contact[o.id]||!polParty(o))return 'no-target';if(!findFed(e))return 'no-fed';const q=canFedMotion(e,'admit',{target:o.id});return q.ok?null:polWhy(q);},
      roots:()=>[],apply:(e,at,c)=>proposeFedMotion(e,'admit',{target:c.target})},
    fedReply:{keys:['kind','fed','action'],check:c=>int(c.fed,0,2147483647)&&['accept','reject'].includes(c.action),
      locate(e,c){const f=fedOf(c.fed),inv=f&&f.invites&&f.invites[e.id];return inv?{f,inv}:{err:'no-invite'};},   // davet edilmeyene davet "yok"
      why(e,{f,inv},c){if(inv.expires<=G.day)return 'expired';if(c.action==='reject')return null;if(inv.terms!==fedCharterKey(f))return 'changed';const g=fedAdmissionGate(f,e);return g.ok?null:polWhy(g);},
      roots:()=>[],apply:(e,{f},c)=>c.action==='accept'?acceptFedInvite(e,f.id):rejectFedInvite(e,f.id)},
    fedVote:{keys:['kind','fed','token','yes'],check:c=>int(c.fed,0,2147483647)&&typeof c.token==='string'&&c.token.length<=40&&typeof c.yes==='boolean',
      locate(e,c){const f=fedOf(c.fed);return f&&f.members.includes(e.id)?{f}:{err:'no-fed'};},       // üye olmayana federasyon "yok"
      why(e,{f},c){const v=f.vote;if(!v)return 'no-vote';if(fedVoteToken(v)!==c.token)return 'stale';if(Number.isFinite(v.expires)&&G.day>=v.expires)return 'expired';
        return fedVoteCounts(f).waiting.includes(e.id)?null:'voted';},
      roots:()=>[],apply:(e,{f},c)=>castFedVote(e,f.id,c.token,c.yes)},
    fedLeave:{keys:['kind'],check:()=>true,locate:()=>({}),why:e=>findFed(e)?null:'no-fed',roots:()=>[],apply:e=>leaveFederation(e)},
    fedLaw:{keys:['kind','law','repeal'],check:c=>typeof c.law==='string'&&(Object.hasOwn(FED_LAWS,c.law)||Object.hasOwn(FED_INNER_LAWS,c.law))&&(c.repeal===undefined||typeof c.repeal==='boolean'),
      locate:()=>({}),why(e,at,c){if(!findFed(e))return 'no-fed';const q=canFedLaw(e,c.law,!!c.repeal);return q.ok?null:polWhy(q);},
      roots:()=>[],apply:(e,at,c)=>proposeFedLaw(e,c.law,!!c.repeal)},
    fedFound:{keys:['kind','type','ballot'],check:c=>Object.hasOwn(FED_TYPES,c.type)&&Object.hasOwn(FED_BALLOTS,c.ballot),locate:()=>({}),
      why(e,at,c){const q=canFoundFed(e,c.type,c.ballot);return q.ok?null:{code:'fed',detail:(q.reasons||[q.why]).slice(0,4).map(String)};},
      roots:()=>[],apply:(e,at,c)=>foundFederation(e,c.type,c.ballot)},
    fedFoundQuote:{keys:['kind','type','ballot'],ro:true,check:c=>Object.hasOwn(FED_TYPES,c.type)&&Object.hasOwn(FED_BALLOTS,c.ballot),locate:()=>({}),why:()=>null,roots:()=>[],
      apply(e,at,c){const q=canFoundFed(e,c.type,c.ballot);return {ok:true,extra:{ok:!!q.ok,cost:q.cost,reasons:(q.reasons||[]).slice(0,6).map(String),
        candidates:(q.candidates||[]).map(x=>({id:x.id,n:polName(e,x.id),h:isHumanActor(G.emps[x.id])?1:0,ok:!!x.ok,why:String(x.why||'').slice(0,160)}))}};}},
    /* Vasallık: to = karşı taraf; mode demand (ben senyör), seek (ben vasal), renew (mevcut sözleşme), release (vasal bağımsızlık ister). */
    vassalOffer:{keys:['kind','to','mode','type','terms'],check:c=>int(c.to,0,63)&&['demand','seek','renew','release'].includes(c.mode)&&Object.hasOwn(VASSAL_TYPES,c.type)&&vasTermsShape(c.terms),
      locate:()=>({}),
      why(e,at,c){const o=G.emps[c.to];if(!o||o===e||!polParty(o)||!e.contact[o.id]&&!(o.overlord===e.id||e.overlord===o.id))return 'no-target';
        if(['renew','release'].includes(c.mode)&&!(e.overlord===o.id||o.overlord===e.id))return 'no-contract';return vassalTerms(c.type,c.terms)?null:'terms';},
      roots:()=>[],apply(e,at,c){const r=vassalOffer(e,G.emps[c.to],c.mode,c.type,c.terms);return r.ok?{ok:true,extra:{karar:r.karar,round:r.round}}:r;}},
    vassalQuote:{keys:['kind','to','mode','type','terms'],ro:true,check:c=>int(c.to,0,63)&&['demand','seek','renew','release'].includes(c.mode)&&Object.hasOwn(VASSAL_TYPES,c.type)&&vasTermsShape(c.terms),
      locate:()=>({}),why(e,at,c){const o=G.emps[c.to];return !o||o===e||!polParty(o)||!e.contact[o.id]&&!(o.overlord===e.id||e.overlord===o.id)?'no-target':null;},
      roots:()=>[],apply:(e,at,c)=>({ok:true,extra:vasQuote(e,G.emps[c.to],c.mode,c.type,c.terms)})},
    vassalReply:{keys:['kind','sub','id','round','action','terms'],check:c=>int(c.sub,0,63)&&typeof c.id==='string'&&c.id.length<=64&&int(c.round,1,3)&&['accept','reject','counter'].includes(c.action)&&
        (c.action==='counter'?vasTermsShape(c.terms):c.terms===undefined),
      locate(e,c){const s=G.emps[c.sub],q=s&&s.vassalTalk;return q&&(q.lord===e.id||q.sub===e.id)?{q}:{err:'no-offer'};},   // taraf olmayana müzakere "yok"
      why(e,{q},c){if(q.status!=='pending')return 'closed';if(q.to!==e.id)return 'not-recipient';if(q.id!==c.id||q.round!==c.round)return 'stale';if(G.day>=q.expires)return 'expired';
        if(c.action==='counter'&&!vassalTerms(q.type,c.terms))return 'terms';return null;},
      roots:()=>[],apply:(e,{q},c)=>vassalReply(e,c.sub,c.id,c.round,c.action,c.action==='counter'?c.terms:null)}
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
        dipNotify(r.from,'Teklif geçersizleşti');dipNotify(r.to,'Teklif geçersizleşti');}
      else if(r.give.concat(r.want).some(it=>it.t!=='res'&&treatyAlreadyActive(a,b,it))){r.status='invalid';r.finished=G.day;r.why='Bu anlaşma artık yürürlükte';   // ör. barış başka teklifle imzalandı
        dipNotify(r.from,'Teklif geçersizleşti — anlaşma zaten yürürlükte');dipNotify(r.to,'Teklif geçersizleşti — anlaşma zaten yürürlükte');}}
  }
  /* Oyuncuya özel diplomasi görünümü: yalnız tarafı olduğu teklifler ve temas kurduğu devletler. */
  function dipView(e){
    const nm=id=>G.emps[id]?String(G.emps[id].name):'?',lb=it=>({...it,l:String(dealLabel(it)).replace(/<[^>]*>/g,'').slice(0,90)});
    const offers=D.offers.filter(r=>r.from===e.id||r.to===e.id).slice(-40).map(r=>({id:r.id,from:r.from,to:r.to,fn:nm(r.from),tn:nm(r.to),give:r.give.map(lb),want:r.want.map(lb),
      born:Math.floor(r.born),expires:Math.floor(r.expires),round:r.round,prev:r.prev,status:r.status,why:r.why,by:r.by,cost:r.cost}));
    const contacts=G.emps.filter(o=>o!==e&&dipParty(o)&&e.contact[o.id]).map(o=>({id:o.id,n:nm(o.id),col:o.col,h:isHumanActor(o)?1:0,rel:Math.round(e.rel[o.id]||0),bl:diploBlocked(e,o)?1:0,war:e.war[o.id]?1:0,peace:e.war[o.id]&&canPeace(e,o)?1:0}));
    return {offers,contacts,life:dipLife(),rounds:DIP_ROUNDS};   // gün: clock.day (her gün dip bölümünü yeniden göndermemek için)
  }

  /* ═══ MP.3.1 federasyon / vasallık: görünüm, önizleme, bildirim ═══ */
  const polParty=o=>!!o&&!o.dead&&!o.wild&&!o.crisisSide;
  const polWhy=q=>({code:'fed',detail:[String(q.why||'').slice(0,200)]});
  const polName=(e,id)=>id===e.id||(e.contact&&e.contact[id])?String(G.emps[id]?.name||'?'):null;   // temassız devlet adı gitmez
  const VAS_KEYS=['tax','science','defense','war','autonomy','duration','renegotiate','sensors'];
  function vasTermsShape(t){
    if(!plain(t)||!onlyKeys(t,VAS_KEYS))return false;
    if(t.tax!==undefined&&(!plain(t.tax)||!onlyKeys(t.tax,['ene','min','ala','yiy','tuk'])||Object.values(t.tax).some(x=>typeof x!=='number'||!Number.isFinite(x))))return false;
    for(const k of ['science'])if(t[k]!==undefined&&(typeof t[k]!=='number'||!Number.isFinite(t[k])))return false;
    for(const k of ['defense','sensors'])if(t[k]!==undefined&&typeof t[k]!=='boolean')return false;
    for(const k of ['war','autonomy'])if(t[k]!==undefined&&typeof t[k]!=='string')return false;
    for(const k of ['duration','renegotiate'])if(t[k]!==undefined&&!Number.isSafeInteger(t[k]))return false;
    return true;
  }
  /* Arayüzün sunduğu seçenekler: küçük bir ızgara, her değer motorun vassalTerms'ünden geçenlerle süzülür (yeni sınır icat edilmez). */
  let vasLimCache=null;
  function vasLimits(){
    if(vasLimCache)return vasLimCache;const grid=[0,.05,.1,.15,.2,.25,.3],out={};
    for(const [k,T] of Object.entries(VASSAL_TYPES)){const d=vassalDefaultTerms(k),ok=t=>!!vassalTerms(k,t);
      out[k]={n:T.n,d:T.d,def:d,tax:grid.filter(x=>ok({...d,tax:{...d.tax,ene:x}})),science:grid.filter(x=>ok({...d,science:x})),
        war:['none','defense','all'].filter(w=>ok({...d,war:w})),autonomy:['free','consent'].filter(a=>ok({...d,autonomy:a})),
        duration:[0,12,24,60,120,240].filter(n=>ok({...d,duration:n})),renegotiate:[12,24,60].filter(n=>ok({...d,renegotiate:n}))};}
    return vasLimCache=out;
  }
  function vasCtr(e,c,sub){if(!c)return null;const lord=G.emps[c.lord];
    return {lord:c.lord,ln:polName(e,c.lord),sub:sub.id,sn:polName(e,sub.id),type:c.type,tn:VASSAL_TYPES[c.type]?.n||c.type,terms:c.terms,started:Math.floor(c.started),
      expires:c.expires===null?null:Math.floor(c.expires),reneg:Math.floor(c.started+c.terms.renegotiate*30),rev:c.revision||0,legacy:!!c.legacy,
      est:Object.fromEntries(Object.entries(vassalEstimate(sub,c.terms)).map(([k,v])=>[k,r1(v)])),lh:isHumanActor(lord)?1:0,sh:isHumanActor(sub)?1:0};}
  function vasTalk(e,q){
    return {id:q.id,lord:q.lord,sub:q.sub,ln:polName(e,q.lord),sn:polName(e,q.sub),kind:q.kind,mode:q.mode,type:q.type,tn:VASSAL_TYPES[q.type]?.n||q.type,terms:q.terms,
      from:q.from,to:q.to,born:Math.floor(q.born),expires:Math.floor(q.expires),round:q.round,status:q.status,why:String(q.why||'').slice(0,240),
      hist:(q.history||[]).map(h=>({day:Math.floor(h.day),by:h.by,action:h.action,why:String(h.why||'').slice(0,240),...(h.terms?{terms:h.terms}:{})})),paid:q.paid||{}};
  }
  /* Vasallık önizlemesi: yalnız motorun saf denetimleri (vassalTerms, canDemandVassal / canSeekProtection, bekleme, Etki) ve motor sabitleri.
     Son karar gönderimde vassalOffer'dadır. Karşı tarafın geliri gizlidir: tahmin yalnız vasal kendisiyse verilir. */
  function vasQuote(e,o,mode,type,raw){
    const existing=mode==='renew'||mode==='release',sub=existing?(e.overlord===o.id?e:o.overlord===e.id?o:null):mode==='demand'?o:e;
    const terms=vassalTerms(type,raw),cost=mode==='demand'?VASSAL_DEMAND_COST:mode==='seek'?VASSAL_SEEK_COST:mode==='release'?40:60,reasons=[];
    if(!terms)reasons.push('Bu vasal türü için hükümler geçersiz');
    if(existing&&!sub)reasons.push('Geçerli sözleşme yok');
    if(mode==='release'&&sub!==e)reasons.push('Barışçıl bağımsızlığı vasal talep eder');
    const c=existing&&sub?vassalContractOf(sub):null;
    if(mode==='renew'&&c&&G.day<c.started+c.terms.renegotiate*30)reasons.push('Yeniden müzakere tarihi gelmedi (gün '+Math.floor(c.started+c.terms.renegotiate*30)+')');
    if(!existing){const g=mode==='demand'?canDemandVassal(e,o):canSeekProtection(e,o);if(!g.ok)reasons.push(String(g.why));}
    else if(e.war[o.id]||isPurifier(e)||isPurifier(o))reasons.push('Savaş veya doktrin müzakereye engel');
    if(sub&&sub.vassalTalk&&sub.vassalTalk.status==='pending'&&G.day<sub.vassalTalk.expires)reasons.push('Bu vasal için zaten bekleyen müzakere var');
    if(sub&&(sub._vassalTalkAfter||0)>G.day)reasons.push('Müzakere soğuma süresi devam ediyor');
    if((e.res.etk||0)<cost)reasons.push(cost+' Etki gerekir');
    return {ok:!reasons.length,reasons:[...new Set(reasons)].slice(0,6),cost,etk:Math.floor(e.res.etk||0),terms,life:180,rounds:3,
      est:sub===e&&terms?Object.fromEntries(Object.entries(vassalEstimate(e,terms)).map(([k,v])=>[k,r1(v)])):null};
  }
  function fedVoteView(e,f){
    const v=f.vote;if(!v)return null;const c=fedVoteCounts(f),L=fedVoteLaw(v)||{n:String(v.law),d:''};
    return {token:fedVoteToken(v),n:L.n,d:L.d||'',kind:v.kind,motion:v.motion||null,repeal:!!v.repeal,target:v.target??null,tn:v.target!==undefined?polName(e,v.target):null,
      proposer:v.proposer,pn:v.proposer!==null?polName(e,v.proposer):null,opened:Math.floor(v.opened),expires:Math.floor(v.expires),
      yes:c.eligible.filter(id=>v.yes.includes(id)),no:c.eligible.filter(id=>v.no.includes(id)),waiting:c.waiting,eligible:c.eligible,w:c.weights,
      cy:c.yes,cn:c.no,total:Math.round(c.total*1000)/1000,rule:fedVoteRule(f,c),mode:v.ballotSnapshot?.mode||fedBallot(f),
      mine:c.waiting.includes(e.id)?'wait':v.yes.includes(e.id)?'yes':v.no.includes(e.id)?'no':'none'};
  }
  function polView(e){
    if(e.dead)return null;const f=findFed(e),lawName=k=>(FED_LAWS[k]||FED_INNER_LAWS[k]||{}).n||k,B=k=>({k,n:FED_BALLOTS[k]?.n||k,d:FED_BALLOTS[k]?.d||''});
    let fed=null;
    if(f){const w=f.vote?fedVoteCounts(f).weights:fedLiveWeights(f),lv=f.lastVote;
      fed={id:f.id,n:f.name,type:{k:f.type,n:fedType(f).n,d:fedType(f).d},leader:f.leader,founder:f.founder,ballot:B(fedBallot(f)),duty:fedDutyText(f),
        cohesion:Math.round(fedCohesion(f)),charter:fedCharter(f),founded:Math.floor(f.founded||0),
        members:f.members.map(id=>({id,n:polName(e,id)||'?',col:G.emps[id]?.col,h:isHumanActor(G.emps[id])?1:0,w:w[id]||1})),
        laws:Object.keys(f.laws||{}).filter(k=>f.laws[k]).map(k=>({k,n:lawName(k)})),
        lawsOpen:[...Object.keys(FED_LAWS),...Object.keys(FED_INNER_LAWS)].map(k=>{const on=!!(f.laws&&f.laws[k]),q=canFedLaw(e,k,on);return {k,n:lawName(k),d:String((FED_LAWS[k]||FED_INNER_LAWS[k]).d||'').slice(0,200),on:on?1:0,cost:fedLawCost(k,on),ok:q.ok?1:0,why:q.ok?'':String(q.why||'').slice(0,160)};}),
        vote:fedVoteView(e,f),
        last:lv?{id:lv.id,n:(fedVoteLaw(lv)||{n:String(lv.law)}).n,passed:!!lv.passed,yes:lv.yes,no:lv.no,abstain:lv.abstain,day:Math.floor(lv.day),why:String(lv.why||'').slice(0,200),rule:String(lv.rule||'').slice(0,200)}:null,
        invites:Object.entries(f.invites||{}).map(([id,inv])=>({id:+id,n:polName(e,+id),expires:Math.floor(inv.expires),by:inv.by})),
        leaveWait:720};
    }
    const invites=(G.feds||[]).filter(x=>x.invites&&x.invites[e.id]).map(x=>{const inv=x.invites[e.id],g=fedAdmissionGate(x,e);
      return {fid:x.id,n:x.name,type:fedType(x).n,ballot:B(fedBallot(x)),duty:fedDutyText(x),size:x.members.length,members:x.members.map(id=>polName(e,id)).filter(Boolean),
        expires:Math.floor(inv.expires),by:inv.by,bn:polName(e,inv.by),valid:inv.terms===fedCharterKey(x)&&inv.expires>G.day?1:0,gate:g.ok?'':String(g.why)};});
    const apps=[];for(const x of G.feds||[])for(const [tok,row] of Object.entries(x.admissionResults||{}))if(row.target===e.id)apps.push({fid:x.id,n:x.name,token:tok,status:row.status,why:String(row.why||'').slice(0,240),day:Math.floor(row.updated||0)});
    const others=f?[]:(G.feds||[]).map(x=>{const vias=x.members.filter(id=>id!==e.id&&e.contact[id]&&G.emps[id]&&!G.emps[id].dead);if(!vias.length)return null;
      return {fid:x.id,n:x.name,type:fedType(x).n,ballot:B(fedBallot(x)),size:x.members.length,
        vias:vias.map(id=>{const q=canRequestFederation(e,G.emps[id]);return {id,n:polName(e,id),ok:q.ok?1:0,why:q.ok?'':String(q.why||'').slice(0,160)};})};}).filter(Boolean);
    const lord=overlordOf(e);
    const talks=G.emps.filter(s=>s.vassalTalk&&(s.vassalTalk.lord===e.id||s.vassalTalk.sub===e.id)).map(s=>vasTalk(e,s.vassalTalk));
    const vas={lord:lord?vasCtr(e,vassalContractOf(e),e):null,subs:vassalsOf(e).map(s=>vasCtr(e,vassalContractOf(s),s)),talks,
      cand:G.emps.filter(o=>o!==e&&polParty(o)&&e.contact[o.id]).map(o=>{const d=canDemandVassal(e,o),k=canSeekProtection(e,o);
        return {id:o.id,n:o.name,h:isHumanActor(o)?1:0,demand:d.ok?'':String(d.why).slice(0,160),seek:k.ok?'':String(k.why).slice(0,160)};}),
      costs:{demand:VASSAL_DEMAND_COST,seek:VASSAL_SEEK_COST,renew:60,release:40,counter:20},lim:vasLimits(),free:Math.max(0,Math.floor(((e.freeUntil||0)-(G.memAge||0))))};
    return {fed,invites,apps,others,canFound:!f&&!isVassal(e)?{cost:fedFoundCost(e),types:Object.entries(FED_TYPES).map(([k,t])=>({k,n:t.n,d:t.d})),ballots:Object.keys(FED_BALLOTS).filter(k=>k!=='weighted').map(B)}:null,vas};
  }
  /* Kişisel siyasi bildirimler: yalnız uzak insanlar (host'unkiler motorun kendi arayüzünde). Yalnız okur; ilk geçişte sessizce tohumlanır. */
  const polSeen=new Map();
  function polSweep(){
    for(const [eid] of S.slots){const e=G.emps[eid];if(!remoteHuman(e)||e.dead)continue;
      let seen=polSeen.get(eid),first=false;if(!seen){seen=new Set();polSeen.set(eid,seen);first=true;}
      const say2=(k,m,c)=>{if(seen.has(k))return;seen.add(k);if(!first)note(eid,m,c);};
      const f=findFed(e);say2('fed:'+(f?f.id:'none')+':'+(e._fedLeaveUntil||0),f?'Federasyon üyeliği — '+f.name:'Federasyon üyeliğin yok','sci');
      if(f){const v=f.vote;if(v&&fedVoteCounts(f).waiting.includes(eid))say2('v:'+f.id+':'+fedVoteToken(v),'Federasyon oylaması başladı — '+((fedVoteLaw(v)||{}).n||v.law)+' · oyunu ver','sci');
        const lv=f.lastVote;if(lv)say2('r:'+f.id+':'+lv.id+':'+lv.day,'Oylama sonucu — '+((fedVoteLaw(lv)||{}).n||lv.law)+': '+(lv.passed?'KABUL':'RED')+' ('+lv.yes+' evet / '+lv.no+' hayır)',lv.passed?'win':'');}
      for(const x of G.feds||[]){const inv=x.invites&&x.invites[eid];if(inv)say2('i:'+x.id+':'+inv.expires,'Federasyon daveti — '+x.name,'sci');
        for(const [tok,row] of Object.entries(x.admissionResults||{}))if(row.target===eid)say2('a:'+x.id+':'+tok+':'+row.status,'Üyelik başvurusu — '+x.name+': '+row.why,row.status==='accepted'?'win':'');}
      for(const s of G.emps){const q=s.vassalTalk;if(!q||(q.lord!==eid&&q.sub!==eid))continue;const other=G.emps[q.lord===eid?q.sub:q.lord];
        if(q.status==='pending'&&q.to===eid)say2('t:'+q.id+':'+q.round,(q.kind==='release'?'Bağımsızlık talebi':q.round>1?'Vasallık karşı teklifi':'Vasallık teklifi')+' — '+(other?other.name:''),'sci');
        if(q.status!=='pending')say2('tf:'+q.id+':'+q.status,'Vasallık müzakeresi: '+({accepted:'kabul edildi',rejected:'reddedildi',expired:'süresi doldu',invalid:'geçersizleşti'}[q.status]||q.status)+' — '+(other?other.name:''),q.status==='accepted'?'win':'');}
      const lord=overlordOf(e),vc=e.vassalContract;say2('lord:'+(lord?lord.id:'none')+':'+(vc?vc.revision+':'+vc.status:''),lord?'Vasallık başladı — senyör '+lord.name:'Bağımsızsın','sci');
    }
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
    const r=result(p,conn,msg,'ok',null,x.extra?{extra:x.extra}:undefined);if(x.ro)return r;stats.commandMs.push(now()-t0);
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
    if(def.ro)return {ok:true,ro:true,extra:def.apply(e,at,c).extra};   // salt okuma: durum değişmez, dergiye girmez
    const records=txCaptureGraph(def.roots(e,at)),rng=RND_STATE;let res;
    try{res=def.apply(e,at,c);}catch(err){txRestoreGraph(records);rndSeed(rng);return {ok:false,code:'error'};}
    if(!(res===true||(res&&res.ok))){txRestoreGraph(records);rndSeed(rng);   // MP.3.1: motorun kendi gerekçesi (ör. vassalOffer) ayrıntı olarak döner
      return res&&typeof res.why==='string'?{ok:false,code:'rules:engine',detail:[res.why.slice(0,200)]}:{ok:false,code:'rules'};}
    stats.applied++;S.worldRevision++;S.journal.push({rev:S.worldRevision,day:G.day,playerId,empireId,cmd:JSON.parse(JSON.stringify(c))});
    return {ok:true,extra:res&&res.extra};
  }
  /* MP.3: host'un kendi devleti için yerel komut (host paneli). Ağ kimliği yok; aynı kurallar, aynı denetimler. */
  function local(c){
    if(L&&!['ingame','paused'].includes(L.phase))return {ok:false,code:'not-started'};
    if(S.paused)return {ok:false,code:'paused'};
    const x=execute('host',hostEmpireId,c);if(x.ok&&!x.ro)publish();return x;
  }

  /* ---------- ağ mesajları: yalnız bu tablo ---------- */
  const HANDLERS=table({
    hello(conn,m){
      if(!onlyKeys(m,['v','type','name','token'])||typeof m.name!=='string'||(m.token!==undefined&&(typeof m.token!=='string'||!/^[a-f0-9]{32}$/.test(m.token))))
        return out(conn,{v:PROTOCOL,type:'error',code:'bad-hello'});
      const name=m.name.replace(/[\u0000-\u001f<>]/g,'').slice(0,24)||'Oyuncu';
      let p=m.token?[...S.players.values()].find(x=>x.token&&x.token===m.token):null;
      /* MP.4: kayıttan dönen oyuncu. Kayıtta jeton yok, yalnız tuzlu SHA-256 özeti var; eşleşirse yeni jeton verilir. */
      if(!p&&m.token&&(!L||!L.banned.has(m.token))){p=[...S.players.values()].find(x=>x.auth&&x.auth.hash===sha256(x.auth.salt+':'+m.token))||null;
        if(p){p.token=random(16);p.auth=null;p.verified='token';}}
      if(L){
        const deny=code=>{out(conn,{v:PROTOCOL,type:'error',code});kick(conn,code);};
        if(L.phase==='closed')return deny('room-closed');
        if(m.token&&L.banned.has(m.token))return deny('kicked');
        if(!p&&['starting','ingame','paused'].includes(L.phase))return deny('game-started');
        if(!p&&L.phase==='resume'){if(guests().filter(x=>x.visitor).length>=4)return deny('room-full');}
        else if(!p&&guests().length>=L.capacity-1)return deny('room-full');
      }
      if(p){if(p.conn&&p.conn!==conn){S.conns.delete(p.conn);kick(p.conn,'replaced');}}
      else{p={playerId:'p-'+random(6),name,token:random(16),empireId:null,conn:null,lastSeq:0,results:new Map(),lastView:null,lastRev:0,wasAI:null,takeover:null,lastSeen:now()};
        if(L){p.seat=L.seatNext++;p.ready=false;p.tab='lobi';p.claim=null;p.color=PALETTE[p.seat%PALETTE.length];p.rate=[];if(L.phase==='resume')p.visitor=true;}
        S.players.set(p.playerId,p);}
      const prev=playerOf(conn);if(prev&&prev!==p){prev.conn=null;prev.lastView=null;if(prev.visitor)S.players.delete(prev.playerId);}   // aynı bağlantı başka kimliğe geçerse eskisi bağsız kalır (MP.4: doğrulanan ziyaretçi kaydı silinir)
      p.conn=conn;p.lastView=null;p.lastSeen=now();S.conns.set(conn,p.playerId);
      out(conn,{v:PROTOCOL,type:'assign',room:S.roomId,saveId:S.saveId,hostId:S.hostId,playerId:p.playerId,token:p.token,empireId:p.empireId,lastSeq:p.lastSeq,rev:S.worldRevision});
      if(p.empireId!==null)publishTo(p,S.worldRevision);
      if(p.visitor)out(conn,{v:PROTOCOL,type:'resume',saveId:S.saveId});   // MP.4: cihazında bu kayıt için jeton varsa misafir onu gönderir
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
      if(['starting','ingame','paused'].includes(L.phase)||L.phase==='resume'&&!p.visitor)return lres(conn,'leave',false,'phase');
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
    if(L.phase==='resume')return {ok:false,why:'resume'};
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
    const started=['starting','ingame','paused','resume'].includes(L.phase);
    const empires=L.galaxyRev?G.emps.filter(e=>e.id!==hostEmpireId&&!e.wild&&!e.crisisSide&&!e.dead).map(e=>({...empireCard(e),seat:(gs.find(p=>p.playerId!=='host'&&(p.claim===e.id||p.empireId===e.id))||{}).seat??null})).filter(e=>!started||e.seat!==null):[];
    /* Tohum yalnız host'ta: tohum + açık motor kodu tüm galaksiyi (konumlar, AI devletleri) yeniden kurdurur. */
    const settings=L.settings&&(viewer&&viewer.playerId==='host'?L.settings:{size:L.settings.size,aiCount:L.settings.aiCount,...(L.settings.shape!==undefined?{shape:L.settings.shape}:{})});
    const mine=viewer&&viewer.claim!==null&&G.emps&&G.emps[viewer.claim]?{empire:viewer.claim,...prepCard(G.emps[viewer.claim])}:null;
    return {v:PROTOCOL,type:'lobby',rev:L.rev,phase:phaseNow(),pause:L.pause||null,capacity:L.capacity,settings,galaxyRev:L.galaxyRev,
      you:viewer?{seat:viewer.seat}:null,canStart:canStart().ok,
      players:gs.map(p=>({seat:p.seat,name:p.name,color:p.color,host:p.playerId==='host',online:p.playerId==='host'||!!p.conn,claim:p.empireId!==null?p.empireId:p.claim,ready:!!p.ready,tab:p.tab,...(p.visitor?{visitor:1}:{})})),
      empires,mine,...(L.resume?{resume:{name:L.resume.name,year:L.resume.year,month:L.resume.month,size:L.resume.size,you:viewer&&viewer.empireId!==null&&G.emps[viewer.empireId]?G.emps[viewer.empireId].name:null}}:{})};
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
    if(p.conn){p.lastView=null;out(p.conn,{v:PROTOCOL,type:'assign',room:S.roomId,saveId:S.saveId,hostId:S.hostId,playerId:p.playerId,token:p.token,empireId,lastSeq:p.lastSeq,rev:S.worldRevision});publishTo(p,S.worldRevision);}
    return {ok:true};
  }
  function release(empireId,toAI=true){
    const pid=S.slots.get(empireId),p=pid&&S.players.get(pid);if(!p||pid==='host')return {ok:false};
    const e=G.emps[empireId];S.slots.delete(empireId);p.empireId=null;p.lastView=null;
    if(toAI&&e){e.ai=true;for(const [k,v] of Object.entries(p.takeover?.auto||{})){const [s,i]=k.split(':').map(Number),pl=G.sys[s]?.planets[i];if(pl&&pl.col&&pl.owner===e.id)pl.col.auto=v;}}
    p.takeover=null;if(p.conn)out(p.conn,{v:PROTOCOL,type:'assign',room:S.roomId,saveId:S.saveId,hostId:S.hostId,playerId:p.playerId,token:p.token,empireId:null,lastSeq:p.lastSeq,rev:S.worldRevision});
    return {ok:true};
  }

  /* ---------- AI'nın insan adına karar vermesini engelleyen koruma ----------
     aiNegotiate, AI kaynaklı bütün anlaşmaların tek kapısıdır ve oyuncu (id 0)
     için zaten boş sonuç döndürür; aynı sonuç uzak insan devletine de uygulanır.
     aiRespond doğrudan çağrıldığında (host arayüzünden uzak insana teklif) karar
     verilmez. Gerçek insan gelen kutusu MP.2 kapsamıdır. */
  function installGuards(){
    /* MP.4: aynı sayfada yeni oda ya da yüklenen kayıt yeni bir host örneği kurar. Korumalar bir kez sarılır ama
       her çağrıda ETKİN host'a yönlenir (eski odanın oyuncu tablosu kullanılmaz). */
    root.__mpCur={remoteHuman,aiToHuman,note,stats};
    root.__mpHumanVoter=id=>root.__mpCur.remoteHuman(G.emps[id]);
    if(root.__mp0Guards)return;root.__mp0Guards=true;
    const cur=()=>root.__mpCur,RH=e=>cur().remoteHuman(e),NOTE=(id,m,c)=>cur().note(id,m,c),ATH=(...a)=>cur().aiToHuman(...a),ST={get blockedAI(){return cur().stats.blockedAI;},set blockedAI(v){cur().stats.blockedAI=v;}};
    const neg=aiNegotiate,resp=aiRespond;
    /* MP.2: uzak insanın araştırma bildirimleri (researchTick içindeki say) host günlüğüne değil o oyuncunun
       kendi bildirim listesine gider. Yalnız uzak insan için; tek oyunculu ve AI yolu aynen çalışır. */
    const rtick=researchTick;
    researchTick=function(e){if(!RH(e))return rtick.apply(this,arguments);
      const s0=say;say=function(m,c){NOTE(e.id,m,c);};try{return rtick.apply(this,arguments);}finally{say=s0;}};
    /* MP.3: AI'nın uzak insana kendi kararıyla yaptığı teklif (NAP, ticaret, ittifak, stratejik…) insan kutusuna gider;
       insan adına AI karar vermez. Uzak insanın teklif eden olduğu aiNegotiate çağrısı yok sayılır (MP.0 koruması). */
    aiNegotiate=function(a,b,give,want){if(RH(b)&&a&&a.ai)return ATH(a,b,give,want);
      if(RH(a)||RH(b)){ST.blockedAI++;return {tur:0,karar:null,uygulandi:false,why:'İnsan oyuncu adına AI karar vermez',karsi:null};}return neg.apply(this,arguments);};
    aiRespond=function(ai){if(RH(ai)){ST.blockedAI++;return {v:'bekle',why:'İnsan oyuncu kararı kendi gelen kutusunda verir'};}return resp.apply(this,arguments);};
    /* MP.3.1: federasyon oylamasında motor yalnız devlet 0'ın oyunu AI değerlendirmesinden ayırıyordu; uzak insanın oyu
       aiFedVoteAssessment ile veriliyor ve rezerve RNG çekiliyordu. Motorun kendi fedOpenVote / startFedVote metni tek
       koşulla genişletilir: uzak insan seçmen, devlet 0 gibi atlanır (değerlendirme, öneri oyu ve RNG çekimi yok).
       Uzak insan yokken __mpHumanVoter hep false: davranış ve RNG birebir aynı. Metin beklenen biçimde değilse kurulum durur. */
    fedOpenVote=patchEngine(fedOpenVote,'if (id === 0) continue;','if (id === 0 || __mpHumanVoter(id)) continue;');
    startFedVote=patchEngine(startFedVote,'if(id!==0&&G.emps[id]&&!G.emps[id].dead)rnd();','if(id!==0&&!__mpHumanVoter(id)&&G.emps[id]&&!G.emps[id].dead)rnd();');
    /* Kurucu adayı: motor devlet 0 için "oyuncunun açık onayı gerekli" diyor, diğerlerine aiFedWilling uyguluyordu.
       Uzak insan da AI eğilimiyle kurucu yazılamaz. */
    const founder=fedFounderCandidate;
    fedFounderCandidate=function(e,o){if(o&&o!==e&&RH(o)){ST.blockedAI++;const why='Oyuncunun açık üyelik onayı gerekli';return {ok:false,reasons:[why],why};}return founder.apply(this,arguments);};
  }
  function patchEngine(fn,from,to){
    const src=String(fn);if(src.split(from).length!==2)throw Error('MP.3.1: motor metni beklenen biçimde değil — '+from);
    return (0,eval)('('+src.replace(from,to)+')');   // global kapsamda: motorun genel adlarını aynen görür
  }

  /* ═══ MP.4 — çok oyunculu kayıt paketi: Save8 + oturum + MP.3 teklif deposu. Jeton kayda girmez (tuzlu özet). ═══ */
  function snapshot(o={}){
    if(G._sideBuf||(typeof _dealTxActive!=='undefined'&&_dealTxActive)||(typeof _loadTxActive!=='undefined'&&_loadTxActive))return {ok:false,why:'busy'};   // yarım işlem kayda girmez
    if(L&&!['ingame','paused'].includes(L.phase))return {ok:false,why:'phase'};
    const save8=serialize(),gs=[...S.players.values()].filter(p=>p.playerId==='host'||p.empireId!==null);
    const players=gs.map(p=>{const x={playerId:p.playerId,name:String(p.name).slice(0,24),empireId:p.empireId,seat:p.seat|0,color:String(p.color||''),lastSeq:p.lastSeq|0};
      if(p.playerId!=='host'){x.wasAI=!!p.wasAI;x.takeover=p.takeover?JSON.parse(JSON.stringify(p.takeover)):null;
        if(p.token){const salt=random(16);x.auth={salt,hash:sha256(salt+':'+p.token)};}else x.auth=p.auth?{...p.auth}:null;}
      return x;});
    const hostE=G.emps[hostEmpireId],name=String(o.name||'').replace(/[\u0000-\u001f<>]/g,'').trim().slice(0,40)||(hostE?hostE.name:'Galaksi')+' · Yıl '+G.year;
    const body={format:PKG_FORMAT,mpVersion:PKG_VERSION,build:typeof BUILD_ID==='string'?BUILD_ID:null,createdAt:now(),saveId:S.saveId,
      session:{roomId:S.roomId,worldRevision:S.worldRevision,hostEmpireId,speed:G.speed|0,capacity:L?L.capacity:Math.max(2,players.length),settings:L&&L.settings?{size:L.settings.size,aiCount:L.settings.aiCount,...(L.settings.shape!==undefined?{shape:L.settings.shape}:{})}:null,
        players,notes:Object.fromEntries([...notes].map(([k,v])=>[k,v.slice(-12)]))},
      diplomacy:{next:D.next,offers:JSON.parse(JSON.stringify(D.offers))},
      display:{name,year:G.year,month:G.month,day:Math.floor(G.day),size:L&&L.settings?L.settings.size:null,systems:G.sys.length,
        humans:gs.map(p=>({name:String(p.name).slice(0,24),empire:G.emps[p.empireId]?String(G.emps[p.empireId].name):'?',host:p.playerId==='host'?1:0}))}};
    const h8=sha256(save8);
    return {ok:true,pkg:{...body,save8,integrity:{alg:'SHA-256',save8:h8,body:sha256(canon({...body,save8:h8}))}}};
  }
  /* Yüklenen kayıttan oturum: oyuncular bağlantısız ve doğrulanmamış (yalnız özet), devletleri ayrılmış, teklif deposu geri. */
  function restoreSession(pkg){
    const ss=pkg.session;S.saveId=pkg.saveId;S.worldRevision=ss.worldRevision;S.players.clear();S.slots.clear();S.conns.clear();
    for(const x of ss.players){const p={...x,token:null,conn:null,results:new Map(),lastView:null,lastRev:0,lastSeen:now(),ready:true,tab:'oyun',claim:x.empireId,rate:[]};
      if(x.playerId==='host'){p.token=null;delete p.auth;}S.players.set(p.playerId,p);if(x.empireId!==null)S.slots.set(x.empireId,x.playerId);}
    D.next=pkg.diplomacy.next;D.offers=JSON.parse(JSON.stringify(pkg.diplomacy.offers));
    notes.clear();for(const [k,v] of Object.entries(ss.notes||{}))notes.set(+k,v.slice(-12));
    if(L){L.phase='resume';L.capacity=ss.capacity;L.settings=ss.settings?{...ss.settings}:null;L.galaxyRev=1;L.seatNext=Math.max(1,...ss.players.map(x=>(x.seat|0)+1));
      L.resume={name:pkg.display.name,year:pkg.display.year,month:pkg.display.month,size:pkg.display.size,createdAt:pkg.createdAt};}
  }
  /* Devam: host açıkça başlatır. Kimliği doğrulanmamış ziyaretçiler çıkar; bekleyen koltuklar ayrılmış kalır (AI yönetmez). */
  function resumeStart(){
    if(!L||L.phase!=='resume')return {ok:false,why:'phase'};
    for(const p of guests())if(p.visitor){if(p.conn){out(p.conn,{v:PROTOCOL,type:'error',code:'game-started'});kick(p.conn,'game-started');S.conns.delete(p.conn);}S.players.delete(p.playerId);}
    L.phase='ingame';delete L.resume;broadcastLobby();publish();return {ok:true};
  }
  /* Kimlik kurtarma: yalnız host, yalnız bağlı olmayan koltuk ve bağlı bir ziyaretçi için (başka oyuncunun aktif devleti devralınamaz). */
  function recoverSeat(visitorPid,seatPid){
    const v=S.players.get(visitorPid),p=S.players.get(seatPid);
    if(!L||!['resume','ingame','paused'].includes(L.phase))return {ok:false,why:'phase'};
    if(!v||!v.visitor||!v.conn)return {ok:false,why:'visitor'};
    if(!p||seatPid==='host'||p.visitor||p.empireId===null)return {ok:false,why:'seat'};
    if(p.conn)return {ok:false,why:'seat-online'};
    const conn=v.conn;S.players.delete(visitorPid);p.conn=conn;p.token=random(16);p.auth=null;p.verified='host-recovery';p.lastView=null;p.lastSeen=now();S.conns.set(conn,p.playerId);
    S.journal.push({rev:S.worldRevision,day:G.day,playerId:seatPid,empireId:p.empireId,recover:1});
    out(conn,{v:PROTOCOL,type:'assign',room:S.roomId,saveId:S.saveId,hostId:S.hostId,playerId:p.playerId,token:p.token,empireId:p.empireId,lastSeq:p.lastSeq,rev:S.worldRevision});
    if(L.phase!=='resume')publishTo(p,S.worldRevision);broadcastLobby();return {ok:true};
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
  if(opts.resume){if(!L)throw Error('MP.4: kayıttan devam lobi kipi ister');restoreSession(opts.resume);}
  return {onMessage,onLeave,onJoin(){},publish,publishTo,assign,release,installGuards,meta,restore,viewFor,local,dip:D,dipView,polView:e=>pure(()=>polView(e)),
    snapshot,resumeStart,recoverSeat,
    isHuman:humanEmpire,isRemoteHuman:remoteHuman,state:S,stats,COMMANDS,HANDLERS,clock,fnv,observeHumans,
    configure,setCapacity,claimFor,setHostTab,start,canStart,kick:kickPlayer,close:closeRoom,lobbyView:()=>L&&lobbyView(S.players.get('host')),lobby:L,
    /* MP.1.1: duraklatma nedeni (host-offline / host-background) misafire lobide 'pause' olarak gider; MP.0 çağrısı nedensiz kalır. */
    setPaused(v,why){S.paused=!!v;if(L&&['ingame','paused'].includes(L.phase)){const ph=v?'paused':'ingame',pw=v?(why||'host'):null;if(L.phase!==ph||L.pause!==pw){L.phase=ph;L.pause=pw;broadcastLobby();}}}};
}
root.StarsMP={PROTOCOL,createHost,fnv,isHumanActor,actorVision,TABS,sha256,canon,validatePackage,loadWorld,upgradeLegacy,PKG_FORMAT,PKG_VERSION};
})(typeof globalThis!=='undefined'?globalThis:this);
