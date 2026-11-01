'use strict';
/* PERF.1 — multiplayer host maliyeti (Node vm, gerçek mp-core + ayna). Aynı Save8 host dünyası olarak yüklenir; k misafir
   (AI devletleri 1..k) bağlanır, gerçek STARS arayüzü kipine (ui:'stars') geçer. Host her oyun günü yayımlar (mp1-host'un
   250 ms döngüsündeki "gün değişti" kuralı); ayna kısıtı mirrorMs=0 (her yayında ayna = üst sınır).
   Ölçülen: ay başına simülasyon (yayın hariç), yayın (tüm misafirler: viewFor + ayna kurma + fark), giden bayt/ileti,
   komut gecikmesi (researchMode: execute + yayın), misafir tarafında tam aynanın deserialize süresi (ayrı vm).
   Kullanım: node mp-host.cjs <root> <save.json> <guests 0..3> <months> */
const path=require('path'),fs=require('fs'),crypto=require('crypto'),{performance}=require('perf_hooks');
const [rootArg,save,guests,months]=process.argv.slice(2),root=path.resolve(rootArg);
const {runtime}=require(path.join(root,'tests/helpers/runtime'));
const CORE=fs.readFileSync(path.join(root,'research/mp0/mp-core.js'),'utf8'),MIR=fs.readFileSync(path.join(root,'research/mp6/mirror.js'),'utf8');
const h=runtime({root});h.sb.performance=performance;h.sb.__save=fs.readFileSync(save,'utf8');
let n=0;h.sb.__rand=k=>crypto.createHash('sha256').update('perf1:'+(n++)).digest('hex').slice(0,k*2);
const net={bytes:0,msgs:0,full:new Map()};h.sb.__send=(c,t)=>{net.bytes+=t.length;net.msgs++;if(t.includes('"type":"mirror"'))net.full.set(c,t);};
h.run(MIR);h.run(CORE);
h.run(`var MP=StarsMP.createHost({roomId:'perf1',random:__rand,send:(c,t)=>__send(c,t),kick(){},mirrorMs:0,lobby:{generate(s){if(deserialize(__save)!==true)throw Error('load');G.autoSave=false;return {ok:true};}}});
  MP.installGuards();MP.setCapacity(${Math.max(2,+guests+1)});MP.configure({size:'ulu',aiCount:11,seed:22});
  var __ids=G.emps.filter(e=>e.ai&&!e.dead&&!e.wild&&!e.crisisSide&&e.id!==0).slice(0,${+guests}).map(e=>e.id);
  __ids.forEach((id,i)=>{const c='g'+i;MP.onMessage(c,JSON.stringify({v:1,type:'hello',name:c}));MP.onMessage(c,JSON.stringify({v:1,type:'claim',empire:id}));MP.onMessage(c,JSON.stringify({v:1,type:'ready',value:true}));});
  if(${+guests}>0&&!MP.start().ok)throw Error('start');
  __ids.forEach((id,i)=>MP.onMessage('g'+i,JSON.stringify({v:1,type:'ui',mode:'stars'})));
  var __pm=0;function __step(){const b=Math.floor(G.day/30);for(let i=0;i<60;i++){const d0=Math.floor(G.day);G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();
    let mt=false;if(Math.floor(G.day/30)>b){monthTick();mt=true;}
    if(${+guests}>0&&(mt||Math.floor(G.day)!==d0)){if(mt)MP.observeHumans();const t=performance.now();MP.publish();__pm+=performance.now()-t;}
    if(mt)break;}}`);
const rows=[];
h.run('__step()');   // ısınma
for(let m=0;m<+months;m++){const b0=net.bytes,m0=net.msgs;h.run('__pm=0');const t=performance.now();h.run('__step()');const all=performance.now()-t,pub=+h.run('__pm');rows.push({simMs:all-pub,publishMs:pub,bytes:net.bytes-b0,msgs:net.msgs-m0});}
const lat=[],latStatus=[];if(+guests>0){h.run('var __res=[];');h.sb.__send2=h.sb.__send;h.sb.__send=(c,t)=>{if(c==='g0'&&t.includes('"type":"result"'))h.sb.__last=t;h.sb.__send2(c,t);};
  for(let i=0;i<5;i++){const mode=['semi','manual','auto','semi','manual'][i];const cid='perf1g0'+String(i+1).padStart(6,'0');
    const t=performance.now();h.run(`MP.onMessage('g0',${JSON.stringify(JSON.stringify({v:1,type:'cmd',seq:i+1,cid,cmd:{kind:'researchMode',mode}}))})`);lat.push(performance.now()-t);
    latStatus.push(h.sb.__last?JSON.parse(h.sb.__last).status||JSON.parse(h.sb.__last).code:null);h.sb.__last=null;}}
let des=null,fullKB=null;const f=net.full.get('g0');
if(f){const full=JSON.parse(f).full;fullKB=Math.round(JSON.stringify(full).length/1024);const ts=[];for(let i=0;i<3;i++){const g=runtime({root});g.sb.__t=JSON.stringify(full);const t=performance.now();if(g.run('deserialize(__t)')!==true)throw Error('guest');ts.push(performance.now()-t);}ts.sort((a,b)=>a-b);des=+ts[1].toFixed(1);}
const med=k=>{const s=rows.map(r=>r[k]).sort((a,b)=>a-b);return +s[Math.floor(s.length/2)].toFixed(1);};
const stats=+guests>0?JSON.parse(h.run('JSON.stringify((()=>{const s=MP.stats||{};return {mirrors:s.mirrors||0,rejected:s.rejected||0}})())')):null;
process.stdout.write(JSON.stringify({root:path.basename(root),save:path.basename(save),guests:+guests,months:+months,
  median:{simMs:med('simMs'),publishMs:med('publishMs'),bytesKB:+(med('bytes')/1024).toFixed(1),msgs:med('msgs')},
  cmdLatencyMs:lat.length?+[...lat].sort((a,b)=>a-b)[2].toFixed(2):null,cmdStatus:latStatus,guestDeserializeMs:des,fullMirrorKB:fullKB,stats,
  heapMB:Math.round(process.memoryUsage().heapUsed/1048576),hostFinal:{save8:crypto.createHash('sha256').update(h.run('serialize()')).digest('hex'),rng:h.run('String(RND_STATE)')},rows:rows.map(r=>({simMs:+r.simMs.toFixed(1),publishMs:+r.publishMs.toFixed(1),bytes:r.bytes,msgs:r.msgs}))})+'\n');
