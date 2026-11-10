'use strict';
/* MP.8 — uzun oyun dayanıklılığı, host/misafir senkronizasyonu, kayıt/kurtarma, ağ kopması (GERÇEK STARS misafir arayüzü /mp/play).
   Üretim kipi relay AYRI SÜREÇ (MP1_BIND 0.0.0.0, MP1_TRUST_PROXY=1, https MP1_ORIGINS) + büyük çerçeveleri parçalayan TLS vekili (MP.7)
   + oyuncu başına kesilebilir TCP hattı (MP.5 "lane"). Her oyuncu ayrı Chromium süreci ve ayrı kalıcı profil (IndexedDB/localStorage).
   Lobi = MP.7 tasarım kipi (her oyuncu kendi devletini gerçek kurulum ekranında tasarlar). Yatay telefon görünümleri.
   Zaman: host sayfasında deterministik ilerletme (her oyun günü yayın; PERF.1/MP.7.5 adımları). Komutlar misafir sayfasından
   misafirin GERÇEK WebSocket'i ve MP komut yoluyla (MP1Join.cmd) gider; host motorunun kapıları karar verir, zorla başarı yok.
   Senkron denetimi: misafirin farklarla kurduğu ayna = host'un o misafire son gönderdiği ayna (rev + kanonik SHA-256);
   misafirin kurduğu dünya ↔ host gerçek durumu (kaynak, koloni, filo, teknoloji, savaş/ittifak, gün, hız, sahiplik); gizlilik.
   Senaryolar (MP8_SCEN): A orta/2 insan+5 AI/s11/120 ay · B büyük/2+8/s404/240 ay · C büyük/3+6/s23/120 ay ·
   R kayıt → tüm tarayıcılar + relay kapanır → yeni relay + yeni oda → aynı devletler · N ağ kopmaları (5 s, 30 s, başlarken, teklif
   açıkken, komuttan hemen sonra, host, relay, iki sekme). BU FİZİKSEL ANDROID / GERÇEK İNTERNET TESTİ DEĞİLDİR. */
const fs=require('fs'),path=require('path'),os=require('os'),net=require('net'),crypto=require('crypto'),assert=require('assert/strict'),{execSync,spawn}=require('child_process'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),{selfSigned,startProxy}=require('./helpers/mp11-tls-proxy.js');
const SCEN=(process.env.MP8_SCEN||'A').toUpperCase(),out=path.resolve(process.env.STARS_OUTPUT||path.join(root,'../evidence/mp8'),SCEN);fs.mkdirSync(out,{recursive:true});
const CONF={A:{size:'orta',ai:5,seed:11,months:120,guests:1,every:6},B:{size:'buyuk',ai:8,seed:404,months:240,guests:1,every:12},
  C:{size:'buyuk',ai:6,seed:23,months:120,guests:2,every:6},R:{size:'orta',ai:5,seed:11,months:60,guests:2,every:6},N:{size:'orta',ai:5,seed:22,months:4,guests:2,every:2}}[SCEN];
if(!CONF)throw Error('MP8_SCEN A|B|C|R|N');
if(process.env.FEDAI0_R==='1'||process.env.ER0_R==='1')CONF.ai=8;
if(process.env.SCALE0_MP){const c=JSON.parse(process.env.SCALE0_MP);Object.assign(CONF,c);}
const MONTHS=+(process.env.MP8_MONTHS||CONF.months);
const results=[],errors=[],metrics={scen:SCEN,conf:{...CONF,months:MONTHS},sync:[],cmds:[],perf:[],notes:[],net:{},resume:{}};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function test(name,fn){if(process.env.MP8_ONLY&&!new RegExp(process.env.MP8_ONLY).test(name)){console.log('NOT RUN '+name);return;}const t0=Date.now();try{await fn();results.push({name,status:'PASS',ms:Date.now()-t0});console.log('PASS '+name);}
  catch(e){results.push({name,status:'FAIL',error:String(e&&e.stack||e).slice(0,2400)});console.log('FAIL '+name+'\n'+(e&&e.stack||e));}}
const PHONE=(w,h)=>({viewport:{width:w,height:h},isMobile:true,hasTouch:true,deviceScaleFactor:2,serviceWorkers:'allow'});
const VIEW={H:[844,390],B:[800,360],C:[915,412],X:[844,390]};
const freePort=()=>new Promise(r=>{const s=net.createServer().listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>r(p));});});
const wait=(p,fn,arg,timeout=30000)=>p.waitForFunction(fn,arg,{timeout,polling:100});
const shot=(p,n)=>p.screenshot({path:path.join(out,n+'.png')}).catch(()=>{});
const tap=async(p,sel)=>{const l=p.locator(sel).first();await l.scrollIntoViewIfNeeded().catch(()=>{});const end=process.env.MP89_MENU_DIAG==='1'&&sel==='#mp1Btn'?await require('./helpers/mp89-menu-diag.cjs')(p,out):null;let error;try{await l.tap({timeout:10000});}catch(e){error=e;throw e;}finally{if(end)await end(error);}};

/* ---- "ağ": her oyuncu kendi TCP yolundan TLS vekiline gider (MP.5 ile aynı); kes = bütün soketler RST + dinleme kapanır ---- */
function lane(target){let srv=null,port=0;const pairs=new Set();
  const up=()=>new Promise(r=>{srv=net.createServer(c=>{const u=net.connect(target,'127.0.0.1');const p={c,u};pairs.add(p);c.pipe(u);u.pipe(c);
      const k=()=>{c.destroy();u.destroy();pairs.delete(p);};c.on('error',k);u.on('error',k);c.on('close',k);u.on('close',k);});
    srv.listen(port,'127.0.0.1',()=>{port=srv.address().port;r(port);});});
  return {up,get port(){return port;},down:()=>new Promise(r=>{for(const p of pairs){p.c.destroy();p.u.destroy();}pairs.clear();srv.close(()=>r());}),
    /* sessiz ölüm (MP.5 ile aynı): mevcut soketlerde veri akmaz, FIN/RST yok — istemci bağlı sanır, gönderdiği kaybolur */
    freeze(){for(const p of pairs){p.c.unpipe(p.u);p.u.unpipe(p.c);p.c.pause();p.u.pause();}}};}

let relayProc=null,relayPort,tlsK,px,launch,lanes={},origin={},dirs={},ctx={},pg={},code=null;
async function startRelay(){
  const env={MP1_BIND:'0.0.0.0',MP1_TRUST_PROXY:'1',MP1_ORIGINS:Object.values(origin).join(',')};const e={...process.env};for(const k of Object.keys(e))if(k.startsWith('MP1_'))delete e[k];
  relayProc=spawn(process.execPath,[path.join(root,'research/mp1/server/relay.js')],{env:{...e,...env,MP1_PORT:String(relayPort)},stdio:['ignore','pipe','pipe']});
  let startupStderr='',startupError=null,lastHealth=null;relayProc.on('error',e=>{startupError=String(e);});
  relayProc.stderr.on('data',d=>{startupStderr+=String(d);metrics.notes.push('relay stderr: '+String(d).slice(0,200));});
  const t0=Date.now();for(;;){const ok=await new Promise(r=>require('http').get({host:'127.0.0.1',port:relayPort,path:'/healthz'},x=>{x.resume();lastHealth={status:x.statusCode};r(x.statusCode===200);}).on('error',e=>{lastHealth={error:e.message};r(false);}));if(ok)break;
    if(Date.now()-t0>20000)throw Error('relay did not start: '+JSON.stringify({pid:relayProc.pid,exitCode:relayProc.exitCode,signal:relayProc.signalCode,startupError,startupStderr,lastHealth}));await sleep(50);}return relayProc.pid;}
async function stopRelay(){if(!relayProc)return;const p=relayProc;relayProc=null;p.kill('SIGTERM');await new Promise(r=>p.on('exit',r));}
async function open(n){const c=await chromium.launchPersistentContext(dirs[n],{...launch,...PHONE(...VIEW[n])});const p=c.pages()[0]||await c.newPage();
  p.on('pageerror',e=>errors.push(n+': '+e.message));ctx[n]=c;pg[n]=p;return p;}
const guestNames=()=>CONF.guests===2?['B','C']:['B'];

/* kanonik özet (iki sayfada aynı işlev): anahtar sırasından bağımsız JSON + SHA-256 */
const CANON=`window.__canon=v=>JSON.stringify(v,function(k,x){if(x&&typeof x==='object'&&!Array.isArray(x)){const o={};for(const q of Object.keys(x).sort())o[q]=x[q];return o;}return x;});
  window.__sha=async s=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))).map(b=>b.toString(16).padStart(2,'0')).join('');`;

/* ---- kurulum (MP.7 tasarım lobisi, gerçek kurulum ekranı) ---- */
async function design(p,o){const vp=p.viewportSize();if(vp.width>vp.height)await p.setViewportSize({width:vp.height,height:vp.width});
  try{await wait(p,()=>!document.getElementById('menu').classList.contains('hidden')&&document.querySelector('#setup [data-a="mizacSet"]'));
    await p.fill('#empName',o.name);await tap(p,'#setup [data-a="mizacSet"][data-x="'+o.mizac+'"]');
    await tap(p,'#setup [data-a="step"][data-x="etik"]');for(const x of o.ethics)await tap(p,'#setup [data-a="ethic"][data-x="'+x+'"]');
    await tap(p,'#setup [data-a="step"][data-x="civic"]');for(const c of o.civics)await tap(p,'#setup [data-a="civic"][data-x="'+c+'"]');
    await tap(p,'#setup [data-a="step"][data-x="koken"]');await tap(p,'#setup [data-a="origin"][data-x="'+o.origin+'"]');
    await tap(p,'#setup [data-a="start"]');await wait(p,()=>document.getElementById('menu').classList.contains('hidden'),undefined,10000);}
  finally{await p.setViewportSize(vp);}}
const DESIGNS={H:{name:'Kızıl Muhafız',mizac:'militarist',origin:'standart',ethics:['mil:2'],civics:['kale_dok']},
  B:{name:'Saf Akıl Ağı',mizac:'teknokrasi',origin:'standart',ethics:['mat:2','mil:-1'],civics:['sinyal_avci']},
  C:{name:'Yeşil Birlik',mizac:'tuccar',origin:'standart',ethics:['aut:-1','mat:1'],civics:['maden_lonca']}};
async function guestGo(n,c,name){const p=pg[n];await p.goto(origin[n]+'/mp/play?code='+c);await wait(p,()=>window.MP1Join&&document.getElementById('jName'));
  if(name)await p.fill('#jName',name);await tap(p,'[data-j="go"]');}
async function room({cutAtStart}={}){
  const H=pg.H;await H.goto(origin.H+'/');await wait(H,()=>typeof setupGame==='function'&&document.getElementById('mp1Btn')&&window.MP7Setup);
  await tap(H,'#mp1Btn');await tap(H,'[data-m="create"]');await wait(H,()=>MP1Host.lobby&&MP1Host.lobby.mode==='design'&&MP1Host.lobby.phase==='waiting');
  if(CONF.guests>1){await H.selectOption('#mp7Cap',String(CONF.guests+1));await wait(H,c=>MP1Host.lobby.capacity===c,CONF.guests+1);}
  {const r=await H.evaluate(c=>{Object.assign(CFG,{size:c.size,aiCount:c.ai,seed:c.seed});return MP1Host.host.configure({size:c.size,aiCount:c.ai,seed:c.seed});},CONF);if(!r.ok)throw Error('configure '+JSON.stringify(r));}
  await tap(H,'#mp7EditMe');await design(H,DESIGNS.H);code=await H.evaluate(()=>MP1Host.code);
  for(const n of guestNames()){const p=pg[n];await guestGo(n,code,n==='B'?'Bora':'Cem');
    await wait(p,()=>MP1Join.screen==='lobby'&&MP1Join.lobby&&MP1Join.lobby.mode==='design'&&document.getElementById('jEditMe'),undefined,40000);
    await tap(p,'#jEditMe');await wait(p,()=>document.getElementById('mp7Head'));await design(p,DESIGNS[n]);
    await wait(p,()=>/kaydedildi/.test(document.getElementById('jDraft').textContent));await tap(p,'#jReady');}
  await wait(H,()=>MP1Host.host.canStart().ok);await H.waitForTimeout(300);
  await tap(H,'[data-m="start"]');
  if(cutAtStart){await lanes[cutAtStart].down();metrics.net.cutAtStart={who:cutAtStart,at:Date.now()};await sleep(3000);await lanes[cutAtStart].up();}
  for(const n of guestNames())await wait(pg[n],()=>window.MP6Stars&&MP6Stars.S.started&&!document.getElementById('game').classList.contains('hidden'),undefined,60000);
  await H.evaluate(CANON);for(const n of guestNames())await pg[n].evaluate(CANON);
  await H.evaluate(HOSTLIB);
  /* fikstür (açıkça): insan devletler arasında temas — insan–insan diplomasisini sınayabilmek için; kaynak/teknoloji eklenmez */
  await H.evaluate(()=>{const hs=__mp8.humans();for(const a of hs)for(const b of hs)if(a!==b){G.emps[a].contact[b]=true;G.emps[a].rel[b]=Math.max(G.emps[a].rel[b]||0,20);}
    MP1Host.host.local({kind:'speed',value:0});MP1Host.host.publish();});
  await closeAll();if(process.env.SCALE0_MP)metrics.scale0=await require('./helpers/beta-scale0-mp.cjs')(H,pg.B,out);return code;}

/* host sayfası kitaplığı: insan koltukları, aday komut planı (motorun KENDİ kapılarıyla), etki yoklaması, durum özeti */
const HOSTLIB=`window.__mp8={
  seats(){return [...MP1Host.host.state.players.values()].filter(p=>p.playerId!=='host'&&p.empireId!==null&&p.empireId!==undefined).map(p=>({pid:p.playerId,e:p.empireId,rev:p.mirrorRev||0,conn:!!p.conn}));},
  humans(){return [0,...this.seats().map(s=>s.e)];},
  why(e,c){const C=MP1Host.host.COMMANDS[c.kind];try{if(C.check&&!C.check(c))return 'check';const at=C.locate?C.locate(e,c):(c.sys!==undefined&&c.planet!==undefined&&G.sys[c.sys]?{sys:G.sys[c.sys],pl:G.sys[c.sys].planets[c.planet]}:{});if(at&&at.err)return at.err;const w=C.why?C.why(e,at,c):null;return w?(w.code||w):null;}catch(x){return 'throw:'+x.message;}},
  plan(id,round){const e=G.emps[id],out=[],hs=this.humans();if(!e||e.dead)return out;
    {const t=Object.keys(TECHS).find(k=>!e.techs[k]&&!((e.research&&e.research.targets)||[]).includes(k)&&this.why(e,{kind:'research',tech:k})===null);if(t)out.push({k:'research',cmd:{kind:'research',tech:t}});}
    {const fs=G.fleets.filter(f=>f.e===id&&f.ships.length&&!f.mv&&!f.path.length&&f.sys>=0&&!f.combat);
     for(const f of fs){const to=G.sys[f.sys].lanes.find(l=>this.why(e,{kind:'move',fleet:f.id,to:l})===null);if(to!==undefined){out.push({k:'move',cmd:{kind:'move',fleet:f.id,to}});break;}}}
    {let done=false;for(const c of e.colonies){if(done)break;const sys=G.sys[c.s],pl=sys&&sys.planets[c.p];if(!pl||!pl.col||pl.owner!==id)continue;
      for(const key of Object.keys(BUILDINGS)){const cmd={kind:'build',sys:sys.id,planet:pl.i,key};if(this.why(e,cmd)===null){out.push({k:'build',cmd});done=true;break;}}}}
    {let done=false;for(const sys of G.sys){if(done||sys.owner!==id||!hasYard(sys))continue;for(const key of Object.keys(SHIPS)){const cmd={kind:'ship',sys:sys.id,key};if(this.why(e,cmd)===null){out.push({k:'ship',cmd});done=true;break;}}}}
    for(const h of hs)if(h!==id){const cmd={kind:'offer',to:h,give:[{t:'res',r:'min',v:5+round}],want:[{t:'res',r:'ene',v:5}]};const w=this.why(e,cmd);out.push(w===null?{k:'offerHuman',cmd}:{k:'offerHuman',skip:w});break;}
    {const ai=G.emps.find(o=>o.ai&&!o.dead&&!o.wild&&!o.crisisSide&&e.contact[o.id]&&o.contact[id]);if(ai){const cmd={kind:'offer',to:ai.id,give:[{t:'res',r:'min',v:20}],want:[{t:'res',r:'ene',v:10}]};const w=this.why(e,cmd);out.push(w===null?{k:'offerAI',cmd}:{k:'offerAI',skip:w});}}
    return out;},
  warPlan(id){const e=G.emps[id];for(const o of G.emps){if(!o.ai||o.dead||o.wild||o.crisisSide||!e.contact[o.id]||e.war[o.id]||e.ally[o.id])continue;
      for(const g of Object.keys(WAR_GOALS)){const cmd={kind:'war',target:o.id,goal:g};if(this.why(e,cmd)===null)return {k:'war',cmd};}}return {k:'war',skip:'no-eligible-target'};},
  peacePlan(id,t){const e=G.emps[id];if(!e.war[t])return {k:'peaceAI',skip:'not-at-war'};const cmd={kind:'offer',to:t,give:[{t:'peace'}],want:[]};const w=this.why(e,cmd);return w===null?{k:'peaceAI',cmd}:{k:'peaceAI',skip:w};},
  fedPlan(id){const e=G.emps[id];if(findFed(e))return {k:'fedFound',skip:'member'};for(const type of Object.keys(FED_TYPES))for(const ballot of Object.keys(FED_BALLOTS)){const cmd={kind:'fedFound',type,ballot};if(this.why(e,cmd)===null)return {k:'fedFound',cmd};}
    return {k:'fedFound',skip:this.why(e,{kind:'fedFound',type:Object.keys(FED_TYPES)[0],ballot:Object.keys(FED_BALLOTS)[0]})};},
  councilPlan(id){const e=G.emps[id],c=G.council;if(!c||!c.members||!c.members.includes(id))return {k:'councilVote',skip:'no-council'};const v=c.vote;if(!v||v.done)return {k:'councilVote',skip:'no-vote'};
    const cmd={kind:'councilVote',token:v.key+':'+(v.target===null||v.target===undefined?'':v.target),yes:true};const w=this.why(e,cmd);return w===null?{k:'councilVote',cmd}:{k:'councilVote',skip:w};},
  inboxPlan(id){const D=MP1Host.host.dip,r=D.offers.find(x=>x.status==='pending'&&x.to===id&&G.day<=x.expires);if(!r)return {k:'respond',skip:'none'};
    const cmd={kind:'respond',offer:r.id,action:'accept'};const w=this.why(G.emps[id],cmd);return w===null?{k:'respond',cmd,from:r.from,peace:r.give.concat(r.want).some(x=>x.t==='peace')}:{k:'respond',skip:w,id:r.id};},
  probe(id,c){const e=G.emps[id],D=MP1Host.host.dip;switch(c.kind){
    case 'research':return ((e.research&&e.research.targets)||[]).includes(c.tech);
    case 'move':{const f=G.fleets.find(x=>x.id===c.fleet);return f?((f.path.length&&f.path[f.path.length-1]===c.to)||(f.mv&&f.mv.to===c.to)||f.sys===c.to):'gone';}
    case 'build':{const pl=G.sys[c.sys].planets[c.planet];return pl.col?colonyQueuedOf(pl.col,c.key):-1;}
    case 'ship':return (G.sys[c.sys].queue||[]).filter(q=>q.e===id&&q.cls===c.key).length;
    case 'offer':return D.offers.filter(r=>r.from===id&&r.to===c.to).length;
    case 'respond':{const r=D.offers.find(x=>x.id===c.offer);return r?r.status:'gone';}
    case 'war':return !!(e.war[c.target]&&G.emps[c.target].war[id]);
    case 'fedFound':return !!findFed(e);
    case 'councilVote':return G.council&&G.council.vote?(G.council.vote.yes.filter(x=>x===id).length+G.council.vote.no.filter(x=>x===id).length):-1;}return null;},
  truth(id){const e=G.emps[id];const fl=G.fleets.filter(f=>f.e===id&&f.ships.length).map(f=>f.id+'@'+(f.sys>=0?f.sys:'m'+(f.mv?f.mv.to:'?'))+'#'+f.ships.length).sort();
    return {day:Math.floor(G.day),speed:G.speed|0,name:e.name,res:Object.fromEntries(Object.entries(e.res).map(([k,v])=>[k,Math.floor(v)])),cols:e.colonies.length,techs:Object.keys(e.techs).filter(k=>e.techs[k]).sort(),fleets:fl,
      war:Object.keys(e.war).filter(k=>e.war[k]&&G.emps[k]&&!G.emps[k].dead).map(Number).sort((a,b)=>a-b),ally:Object.keys(e.ally).filter(k=>e.ally[k]).map(Number).sort((a,b)=>a-b),fed:findFed(e)?findFed(e).id:null,dead:!!e.dead};},
  async mirrorOf(id){const p=[...MP1Host.host.state.players.values()].find(x=>x.empireId===id);if(!p||!p.lastMirror)return null;return {rev:p.mirrorRev,sha:await __sha(__canon(p.lastMirror)),conn:!!p.conn};},
  tokens(){return [...MP1Host.host.state.players.values()].map(p=>p.token).filter(Boolean);},
  state(){const D=MP1Host.host.dip;return {day:Math.floor(G.day),r:String(RND_STATE),offers:D.offers.map(o=>o.id+':'+o.status+':'+o.from+'>'+o.to).join(','),
    wars:this.humans().map(h=>h+':'+Object.keys(G.emps[h].war).filter(k=>G.emps[h].war[k]).join('.')).join('|'),
    feds:(G.feds||[]).map(f=>f.id+':'+f.members.join('.')+':'+(f.vote?JSON.stringify(f.vote):'')).join('|'),council:G.council?JSON.stringify({m:G.council.members,v:G.council.vote}):'',
    vassal:G.emps.map(e=>e.overlord===undefined||e.overlord===null?'':e.id+'<'+e.overlord).filter(Boolean).join(','),
    humans:this.humans().map(h=>h+':'+G.emps[h].name+':ai='+!!G.emps[h].ai+':col='+G.emps[h].colonies.length+':fl='+G.fleets.filter(f=>f.e===h&&f.ships.length).length).join('|'),speed:G.speed|0,
    inbox:((G.diplomaticInbox&&G.diplomaticInbox.records)||[]).filter(x=>x.status==='pending').length};}};
  /* ölçüm: ay adımı + yayın */
  (()=>{if(window.__mp8T)return;const T=window.__mp8T={month:[],publish:[],long:[]};try{new PerformanceObserver(l=>{for(const x of l.getEntries())T.long.push(Math.round(x.duration));}).observe({entryTypes:['longtask']});}catch{}
    const mt=window.monthTick;window.monthTick=function(){const t=performance.now();try{return mt.apply(this,arguments);}finally{T.month.push(performance.now()-t);}};
    const h=MP1Host.host,pb=h.publish;h.publish=function(){const t=performance.now();try{return pb.apply(this,arguments);}finally{T.publish.push(performance.now()-t);}};})();`;
/* misafir ölçüm kancaları + sayaçlar (zamanlayıcı / DOM) */
const GUESTLIB=`(()=>{if(window.__mp8T)return;const T=window.__mp8T={refresh:[],long:[]};try{new PerformanceObserver(l=>{for(const x of l.getEntries())T.long.push(Math.round(x.duration));}).observe({entryTypes:['longtask']});}catch{}
  const rf=UI.refresh;UI.refresh=function(){const t=performance.now();try{return rf.apply(this,arguments);}finally{T.refresh.push(performance.now()-t);}};})();`;
/* her sayfa yüklenmeden önce: etkin zamanlayıcı sayacı (setInterval/setTimeout kayıt — davranışa dokunmaz) */
const TIMERS=`(()=>{const si=setInterval,ci=clearInterval,st=setTimeout,ct=clearTimeout;const live={iv:new Set(),to:new Set()};window.__timers=live;
  window.setInterval=function(f,ms,...a){const id=si(f,ms,...a);live.iv.add(id);return id;};window.clearInterval=function(id){live.iv.delete(id);return ci(id);};
  window.setTimeout=function(f,ms,...a){let id;id=st(function(){live.to.delete(id);return typeof f==='function'?f.apply(this,arguments):undefined;},ms,...a);live.to.add(id);return id;};
  window.clearTimeout=function(id){live.to.delete(id);return ct(id);};})();`;

/* ---- zaman ve eşitleme ---- */
async function closeAll(){for(const n of Object.keys(pg))await pg[n].evaluate(()=>{const m=document.getElementById('modal');if(m&&!m.classList.contains('hidden')&&typeof UI!=='undefined'){const s=G.speed;UI.closeModal();try{UI.setSpeed(s);}catch{}}}).catch(()=>{});}
async function advance(days){/* host: deterministik gün adımları + her oyun günü yayın (mp1-host 250 ms döngüsündeki "gün değişti" kuralı) */
  let left=days;while(left>0){const d=Math.min(30,left);await pg.H.evaluate(d=>{MP1Host.host.local({kind:'speed',value:0});const m=document.getElementById('modal');if(m&&!m.classList.contains('hidden'))UI.closeModal();
      const end=G.day+d;while(G.day<end-1e-9){const b=Math.floor(G.day/30),d0=Math.floor(G.day);G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();if(Math.floor(G.day/30)>b)monthTick();if(Math.floor(G.day)!==d0)MP1Host.host.publish();}
      return G.day;},d);left-=d;await pg.H.waitForTimeout(20);}}
async function settle(label){/* host yayınlar; her bağlı misafirin son aynası host'un gönderdiğiyle aynı rev'e ulaşır ve misafir dünyayı bu aynadan kurar */
  await closeAll();const t0=Date.now();await pg.H.evaluate(()=>MP1Host.host.publish());
  /* mp-core aynayı en sık mirrorMs'de (700 ms) bir yollar; son durum ertelenmiş zamanlayıcıyla MUTLAKA gider. O gönderim bitene kadar bekle. */
  await wait(pg.H,()=>[...MP1Host.host.state.players.values()].every(p=>!p.mirrorTimer),undefined,20000);const res={};
  for(const n of guestNames()){const p=pg[n];const e=await p.evaluate(()=>MP1Join.empireId);const hm=await pg.H.evaluate(e=>__mp8.mirrorOf(e),e);if(!hm)throw Error(label+': host has no mirror for '+n);
    await wait(p,r=>MP6Stars.S.rev===r,hm.rev,45000);const t1=Date.now();
    /* kurulum: ayna rev'i geldikten sonra misafir dünyasını (G) kurar; gün host günüyle eşleşene kadar bekle */
    const hd=await pg.H.evaluate(()=>Math.floor(G.day));await wait(p,d=>Math.floor(G.day)===d&&!MP6Stars.S.boot.err,hd,45000);
    res[n]={e,rev:hm.rev,revMs:t1-t0,buildMs:Date.now()-t0};}
  return res;}
async function syncCheck(label){const s=await settle(label);const H=pg.H;const tokens=await H.evaluate(()=>__mp8.tokens());
  for(const n of guestNames()){const p=pg[n],e=s[n].e;
    const hm=await H.evaluate(e=>__mp8.mirrorOf(e),e),gm=await p.evaluate(async()=>({rev:MP6Stars.S.rev,sha:await __sha(__canon(MP6Stars.S.mirror)),json:JSON.stringify(MP6Stars.S.mirror)}));
    const ht=await H.evaluate(e=>__mp8.truth(e),e);
    const gt=await p.evaluate(()=>{const e=G.emps[0];const fl=G.fleets.filter(f=>f.e===0&&f.ships.length).map(f=>f.id+'@'+(f.sys>=0?f.sys:'m'+(f.mv?f.mv.to:'?'))+'#'+f.ships.length).sort();
      const me=MP1Join.empireId,re=k=>+k===0?me:+k===me?0:+k;   /* π: misafirde 0 ↔ kendi gerçek kimliği */
      return {day:Math.floor(G.day),speed:G.speed|0,name:e.name,res:Object.fromEntries(Object.entries(e.res).map(([k,v])=>[k,Math.floor(v)])),cols:e.colonies.length,techs:Object.keys(e.techs).filter(k=>e.techs[k]).sort(),fleets:fl,
        war:Object.keys(e.war).filter(k=>e.war[k]&&G.emps[k]&&!G.emps[k].dead).map(re).sort((a,b)=>a-b),ally:Object.keys(e.ally).filter(k=>e.ally[k]).map(re).sort((a,b)=>a-b),dead:!!e.dead,
        foreign:G.emps.filter(o=>o.id!==0).map(o=>({id:o.id,res:Object.values(o.res||{}).reduce((a,b)=>a+Math.abs(+b||0),0),techs:Object.keys(o.techs||{}).length,rq:(o.rq||[]).length}))};});
    const row={label,who:n,e,rev:[hm.rev,gm.rev],mirrorEq:hm.sha===gm.sha,revMs:s[n].revMs,buildMs:s[n].buildMs,diff:[]};
    for(const k of ['day','speed','name','cols','dead'])if(ht[k]!==gt[k])row.diff.push(k+': host '+ht[k]+' / misafir '+gt[k]);
    for(const k of ['techs','fleets','war','ally'])if(JSON.stringify(ht[k])!==JSON.stringify(gt[k]))row.diff.push(k+': host '+JSON.stringify(ht[k]).slice(0,200)+' / misafir '+JSON.stringify(gt[k]).slice(0,200));
    for(const r of Object.keys(ht.res))if(Math.abs((ht.res[r]||0)-(gt.res[r]||0))>1)row.diff.push('res.'+r+': host '+ht.res[r]+' / misafir '+gt.res[r]);
    const own=await p.evaluate(()=>MP1Join.empireId);if(own!==e)row.diff.push('sahiplik: '+own+' ≠ '+e);
    row.leak=[];for(const f of gt.foreign)if(f.res>0||f.techs>0||f.rq>0)row.leak.push('devlet '+f.id+' res/tech/rq '+f.res+'/'+f.techs+'/'+f.rq);
    for(const t of tokens)if(gm.json.includes(t))row.leak.push('jeton aynada');
    {const real=await H.evaluate(()=>G.cfg.seed);const m=JSON.parse(gm.json);if(m.seed===real||(m.cfg&&m.cfg.seed===real))row.leak.push('gerçek galaksi tohumu aynada');if(m.rs!==1)row.leak.push('RNG durumu aynada');}
    metrics.sync.push(row);console.log('SYNC '+JSON.stringify(row));
    assert(row.mirrorEq&&hm.rev===gm.rev,label+' '+n+': mirror differs (rev '+hm.rev+'/'+gm.rev+')');assert.deepEqual(row.diff,[],label+' '+n+' state');assert.deepEqual(row.leak,[],label+' '+n+' privacy');}
  return s;}
async function cmd(n,c,timeout=20000){const p=pg[n];const r=await p.evaluate(c=>MP1Join.cmd(c),c);if(!r.ok)return {status:'local',code:r.why};
  try{await wait(p,cid=>MP1Join.results.some(x=>x.cid===cid),r.cid,timeout);}catch{return {status:'no-reply',cid:r.cid};}
  return p.evaluate(cid=>{const x=MP1Join.results.filter(y=>y.cid===cid).at(-1);return {status:x.status,code:x.code||null,ms:x.ms,cid};},r.cid);}
/* bir eylemi uygula ve host gerçeğini doğrula: ok → etki tam bir kez; red → etki yok */
async function doAct(n,e,a,label){if(a.skip!==undefined){metrics.cmds.push({label,who:n,k:a.k,status:'skip',why:a.skip});return null;}
  const before=await pg.H.evaluate(([e,c])=>__mp8.probe(e,c),[e,a.cmd]);const r=await cmd(n,a.cmd);const after=await pg.H.evaluate(([e,c])=>__mp8.probe(e,c),[e,a.cmd]);
  const row={label,who:n,k:a.k,status:r.status,code:r.code,ms:r.ms,before,after};metrics.cmds.push(row);
  if(r.status==='ok'){switch(a.cmd.kind){
      case 'build':case 'ship':case 'offer':case 'councilVote':assert.equal(after,before+1,label+' '+a.k+' exactly once');break;
      case 'research':assert.notEqual(after,before,label+' research toggled');break;
      case 'move':assert.equal(after,true,label+' move');break;
      case 'respond':assert.equal(after,'accepted',label+' respond');break;
      case 'war':case 'fedFound':assert.equal(after,true,label+' '+a.k);break;}}
  else if(r.status!=='no-reply'&&r.status!=='local')assert.deepEqual(after,before,label+' '+a.k+' rejected → no effect ('+r.code+')');
  return r;}
async function perfRow(label){const h=await pg.H.evaluate(()=>{const T=window.__mp8T;return {month:T.month.splice(0),publish:T.publish.splice(0),long:T.long.splice(0),heap:performance.memory?Math.round(performance.memory.usedJSHeapSize/1048576):null,
    dom:document.getElementsByTagName('*').length,iv:window.__timers?window.__timers.iv.size:null,to:window.__timers?window.__timers.to.size:null,offers:MP1Host.host.dip.offers.length,notes:(G.notes||[]).length,
    inbox:((G.diplomaticInbox&&G.diplomaticInbox.records)||[]).length,log:(G.log||[]).length,news:(G.news&&G.news.records||[]).length,stats:{mirrors:MP1Host.host.stats.mirrors||0}};});
  const st=a=>{if(!a||!a.length)return {n:0};const s=[...a].sort((x,y)=>x-y),q=k=>+s[Math.min(s.length-1,Math.floor(s.length*k))].toFixed(1);return {n:a.length,med:q(.5),p95:q(.95),max:+s[s.length-1].toFixed(1)};};
  const row={label,month:Math.floor((await pg.H.evaluate(()=>G.day))/30),host:{monthTick:st(h.month),publish:st(h.publish),longtask:st(h.long),heapMB:h.heap,dom:h.dom,intervals:h.iv,timeouts:h.to,offers:h.offers,notes:h.notes,inbox:h.inbox,log:h.log,news:h.news},guests:{}};
  for(const n of guestNames()){const g=await pg[n].evaluate(()=>{const T=window.__mp8T,S=MP6Stars.S;return {refresh:T.refresh.splice(0),long:T.long.splice(0),build:S.stats.buildMs.splice(0),builds:S.stats.builds,deltas:S.stats.deltas,resyncs:S.stats.resyncs||0,
      minGap:S.minGap,heap:performance.memory?Math.round(performance.memory.usedJSHeapSize/1048576):null,dom:document.getElementsByTagName('*').length,iv:window.__timers?window.__timers.iv.size:null,to:window.__timers?window.__timers.to.size:null,
      notes:(G.notes||[]).length,results:MP1Join.results.length,packets:(MP1Join.packets||[]).length,errors:MP1Join.errors.length};});
    row.guests[n]={build:st(g.build),refresh:st(g.refresh),longtask:st(g.long),builds:g.builds,deltas:g.deltas,resyncs:g.resyncs,minGap:g.minGap,heapMB:g.heap,dom:g.dom,intervals:g.iv,timeouts:g.to,notes:g.notes,results:g.results,packets:g.packets,joinErrors:g.errors};}
  metrics.perf.push(row);console.log('PERF '+JSON.stringify(row));return row;}

/* ---- kampanya: her CONF.every ayda her misafir planlanan eylemleri gönderir; host kapıları karar verir ---- */
const warOf={};
async function campaignRound(round,label){
  /* host oyuncu (devlet 0) da insandır: kendi komut yolu host.local → aynı COMMANDS kapıları; misafire insan teklifi */
  {const a=await pg.H.evaluate(r=>(__mp8.plan(0,r).find(x=>x.k==='offerHuman')||{k:'offerHuman',skip:'none'}),round);
    if(a.skip!==undefined)metrics.cmds.push({label,who:'H',k:a.k,status:'skip',why:a.skip});
    else{const r=await pg.H.evaluate(([c])=>{const b=__mp8.probe(0,c),x=MP1Host.host.local(c),a=__mp8.probe(0,c);return {b,a,x:x&&(x.status||x.ok)};},[a.cmd]);
      metrics.cmds.push({label,who:'H',k:a.k,status:r.a===r.b+1?'ok':'rejected',before:r.b,after:r.a,res:r.x});assert(r.a===r.b||r.a===r.b+1,'host offer at most once');}}
  for(const n of guestNames()){const e=await pg[n].evaluate(()=>MP1Join.empireId);
    const plan=await pg.H.evaluate(([e,r])=>__mp8.plan(e,r),[e,round]);for(const a of plan)await doAct(n,e,a,label);
    /* gelen kutusu: bekleyen bir teklif (insan → insan, AI → insan barış dahil) kabul edilir; barışta savaş gerçekten biter */
    const ib=await pg.H.evaluate(e=>__mp8.inboxPlan(e),e);const r=await doAct(n,e,ib,label);
    if(r&&r.status==='ok'&&ib.peace){const st=await pg.H.evaluate(([e,f])=>({war:!!(G.emps[e].war[f]||G.emps[f].war[e]),pend:MP1Host.host.dip.offers.filter(o=>o.status==='pending'&&((o.from===f&&o.to===e)||(o.from===e&&o.to===f))&&o.give.concat(o.want).some(x=>x.t==='peace')).length}),[e,ib.from]);
      metrics.notes.push(label+' '+n+': AI→insan barış kabul → savaş '+(st.war?'SÜRÜYOR':'bitti')+', aynı çift bekleyen barış '+st.pend);assert.equal(st.war,false,'peace accepted → war over');assert.equal(st.pend,0,'no stale pending peace');}
    if(round>=2&&n==='B'&&!warOf[n]){const w=await pg.H.evaluate(e=>__mp8.warPlan(e),e);const r2=await doAct(n,e,w,label);if(r2&&r2.status==='ok')warOf[n]={t:w.cmd.target,round};}
    if(warOf[n]&&round===warOf[n].round+2){const pp=await pg.H.evaluate(([e,t])=>__mp8.peacePlan(e,t),[e,warOf[n].t]);const r3=await doAct(n,e,pp,label);
      if(r3&&r3.status==='ok'){const o=await pg.H.evaluate(([e,t])=>{const D=MP1Host.host.dip,r=D.offers.filter(x=>x.from===e&&x.to===t).at(-1);return {status:r&&r.status,war:!!(G.emps[e].war[t]||G.emps[t].war[e])};},[e,warOf[n].t]);
        metrics.notes.push(label+' '+n+': insan→AI barış teklifi → '+o.status+', savaş '+(o.war?'sürüyor':'bitti'));if(o.status==='accepted')assert.equal(o.war,false,'accepted peace ends the war');}}
    if(round%3===1){await doAct(n,e,await pg.H.evaluate(e=>__mp8.fedPlan(e),e),label);}
    await doAct(n,e,await pg.H.evaluate(e=>__mp8.councilPlan(e),e),label);}}

async function campaign(fromMonth,toMonth){let round=Math.floor(fromMonth/CONF.every);
  for(let m=fromMonth;m<toMonth;m+=CONF.every){round++;const step=Math.min(CONF.every,toMonth-m);await advance(step*30);const label='m'+(m+step);
    await campaignRound(round,label);await syncCheck(label);if((m+step)%(CONF.every*2)===0||m+step===toMonth)await perfRow(label);}}

(async()=>{tlsK=selfSigned();try{
  relayPort=await freePort();const pport=await freePort();
  px=await startProxy({target:relayPort,cert:tlsK.cert,key:tlsK.key,port:pport,fragment:4096});
  for(const n of ['H','B','C','X']){lanes[n]=lane(pport);await lanes[n].up();origin[n]='https://localhost:'+lanes[n].port;dirs[n]=fs.mkdtempSync(path.join(os.tmpdir(),'mp8-'+n+'-'));}
  metrics.relayPid1=await startRelay();
  const spki=execSync(`openssl x509 -in ${tlsK.cert} -pubkey -noout | openssl pkey -pubin -outform der | openssl dgst -sha256 -binary | base64`).toString().trim();
  launch={executablePath:process.env.STARS_CHROMIUM_PATH||undefined,args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--enable-precise-memory-info','--ignore-certificate-errors-spki-list='+spki]};
  for(const n of ['H',...guestNames()]){const p=await open(n);await p.addInitScript(TIMERS);}

  await test(SCEN+'0 kurulum: üretim relay süreci + TLS vekili + oyuncu başına hat; MP.7 tasarım lobisi; '+(CONF.guests+1)+' insan + '+CONF.ai+' AI, '+CONF.size+', seed '+CONF.seed+'; misafir gerçek STARS arayüzünde',async()=>{
    await room(SCEN==='N'?{cutAtStart:'C'}:{});for(const n of guestNames())await pg[n].evaluate(GUESTLIB);
    metrics.actualWorld=await pg.H.evaluate(()=>({seed:G.seed,size:G.cfg.size,systems:G.sys.length,states:G.emps.filter(e=>!e.wild).length}));
    assert.equal(metrics.actualWorld.seed,CONF.seed,'gerçek seed yapılandırmayla eşleşmeli');assert.equal(metrics.actualWorld.size,CONF.size,'gerçek boyut yapılandırmayla eşleşmeli');
    const seats=await pg.H.evaluate(()=>__mp8.seats());metrics.seats=seats.map(s=>({e:s.e,conn:s.conn}));assert.equal(seats.length,CONF.guests);
    assert.equal(new Set(seats.map(s=>s.e)).size,CONF.guests,'distinct empires');
    for(const n of guestNames()){const g=await pg[n].evaluate(()=>({e:MP1Join.empireId,name:G.p.name,url:location.pathname,engineRuns:G.speed}));
      assert.equal(g.url,'/mp/play');assert.equal(g.engineRuns,0,'guest runs no simulation');assert.equal(g.name,DESIGNS[n].name,'guest designed its own empire');}
    if(SCEN==='N')metrics.notes.push('C başlarken 3 s kesildi; C kendi devletiyle oyuna girdi');
    await syncCheck('m0');await perfRow('m0');await shot(pg.B,'b-start');});

  if(['A','B','C'].includes(SCEN))await test(SCEN+'1 kampanya: '+MONTHS+' ay; her '+CONF.every+' ayda misafir(ler) araştırma, filo, bina, gemi, insan/AI teklifi, gelen kutusu, savaş/barış, federasyon, konsey; her turda host ↔ misafir senkron + gizlilik',async()=>{
    await campaign(0,MONTHS);await shot(pg.H,'host-end');for(const n of guestNames())await shot(pg[n],n+'-end');
    const ok=metrics.cmds.filter(c=>c.status==='ok').length,rej=metrics.cmds.filter(c=>!['ok','skip'].includes(c.status));metrics.cmdSummary={ok,rejected:rej.length,skip:metrics.cmds.filter(c=>c.status==='skip').length,
      byKind:metrics.cmds.reduce((m,c)=>{const k=c.k+':'+c.status+(c.code?':'+c.code:'');m[k]=(m[k]||0)+1;return m;},{})};
    assert(!metrics.cmds.some(c=>c.status==='no-reply'),'every command got a reply');assert(ok>=6,'commands applied: '+ok);});

  if(SCEN==='B')await test('B2 240. ay: 4× CPU yavaşlatma (host + misafir, CDP) — 2 ay adımı + eşitleme süresi; fiziksel cihaz DEĞİL',async()=>{
    const cdps=[];for(const n of ['H',...guestNames()]){const c=await pg[n].context().newCDPSession(pg[n]);await c.send('Emulation.setCPUThrottlingRate',{rate:4});cdps.push(c);}
    try{const t0=Date.now();await advance(60);metrics.throttle={advance60dMs:Date.now()-t0};const s=await syncCheck('m'+(MONTHS+2)+'-cpu4');metrics.throttle.settle=s;await perfRow('cpu4');}
    finally{for(const c of cdps)await c.send('Emulation.setCPUThrottlingRate',{rate:1}).catch(()=>{});}});

  if(SCEN==='R'){const saved={};let resumeVerified=false;
    await test(`R1 ${MONTHS} ay kampanya + bekleyen insan teklifi (C → B), savaş, federasyon/konsey denemeleri; senkron`,async()=>{
      await campaign(0,MONTHS);const e={B:await pg.B.evaluate(()=>MP1Join.empireId),C:await pg.C.evaluate(()=>MP1Join.empireId)};saved.e=e;
      if(process.env.MP89_R_STATE==='1')metrics.resume.explicitFixture=await require('./helpers/mp89-resume-fixture.cjs')(pg.H);
      if(process.env.WARFIX0_HISTORY==='1')await pg.H.evaluate(b=>{const enemy=G.emps.find(x=>x.ai&&!x.dead&&!x.wild&&!x.crisisSide&&!x.war[b]&&!x.ally[b]);if(!enemy)throw Error('private history needs a live AI');warAuthorize(enemy,G.emps[b],{n:'Kayıtlı misafir savaş geçmişi'});try{if(!declareWar(enemy,G.emps[b]))throw Error('guest history war rejected');}finally{warAuthClear();}MP1Host.host.publish();},e.B);
      if(process.env.STABILITY0_R==='1')saved.stability=await require('./helpers/beta-stability0-resume.cjs').prepare(pg.H,pg.B,pg.C,e);
      if(process.env.ER0_R==='1')saved.er0=await require('./helpers/beta-er0-resume.cjs').prepare(pg.H,pg.B,pg.C,e);
      if(process.env.FEDAI0_R==='1')saved.fedAI0=await require('./helpers/beta-fed-ai0-resume.cjs').prepare(pg.H,pg.B,pg.C,e);
      if(process.env.BOARD1_R==='1')saved.board1=await require('./helpers/beta-board1-resume.cjs').prepare(pg.H,e);
      if(process.env.WAR_CENTER0_R==='1')saved.warCenter=await require('./helpers/beta-war-center0-resume.cjs').prepare(pg.H,pg.B,pg.C,e);
      if(process.env.BOARD2_R==='1')saved.board2=await require('./helpers/beta-board2-resume.cjs').prepare(pg.H,pg.B,e);
      if(process.env.MPP0_R==='1')saved.personal=await require('./helpers/mp-p0-resume.cjs').prepare(pg.H,e);
      if(process.env.FEDFOUND0_R==='1')saved.founding=await require('./helpers/beta-fed-found0-resume.cjs').prepare(pg.H);
      const r=await cmd('C',{kind:'offer',to:e.B,give:[{t:'res',r:'min',v:7}],want:[{t:'res',r:'ene',v:3}]});metrics.resume.pendingOffer=r;
      saved.pending=r.status==='ok'?await pg.H.evaluate(([b,c])=>MP1Host.host.dip.offers.filter(o=>o.status==='pending'&&o.from===c&&o.to===b).map(o=>o.id),[e.B,e.C]):[];
      assert(saved.pending.length>0,'R requires a pending human offer');
      await syncCheck('m'+MONTHS+'-pre-save');});
    await test('R2 kayıt: OYUNU KAYDET (IndexedDB); Save8/RNG değişmez; misafir cihazında kayıt kimliği; tüm tarayıcı süreçleri + relay süreci kapanır',async()=>{
      saved.state=await pg.H.evaluate(()=>__mp8.state());saved.speed=saved.state.speed;
      if(process.env.MP89_R_STATE==='1')saved.records=await pg.H.evaluate(()=>{const s=JSON.parse(serialize());return {dip:JSON.parse(JSON.stringify(MP1Host.host.dip)),feds:s.world.feds,warLedger:s.warLedger,relations:s.emps.map(e=>({id:e.id,war:e.war,ally:e.ally,nap:e.nap,pact:e.pact,overlord:e.overlord,vassalType:e.vassalType,vassalContract:e.vassalContract}))};});
      await pg.H.evaluate(()=>MP1Host.mp4.saveNow('manual'));await wait(pg.H,()=>MP1Host.lastSave&&MP1Host.lastSave.ok);
      assert.deepEqual(await pg.H.evaluate(()=>__mp8.state()),saved.state,'saving changes nothing');
      saved.saveId=await pg.H.evaluate(async()=>(await MP4Save.list())[0].saveId);
      for(const n of guestNames()){const s=await pg[n].evaluate(id=>JSON.parse(localStorage.getItem('mp4:save:'+id)||'null'),saved.saveId);assert(s&&s.empire===saved.e[n],n+' keeps its save identity');}
      const tokens=await pg.H.evaluate(()=>__mp8.tokens());const pkg=await pg.H.evaluate(()=>JSON.stringify(MP1Host.host.snapshot({}).pkg));for(const t of tokens)assert(!pkg.includes(t),'no token in the package');
      metrics.resume.pkgBytes=pkg.length;
      for(const n of Object.keys(ctx))await ctx[n].close();await stopRelay();metrics.relayPid2=await startRelay();assert.notEqual(metrics.relayPid1,metrics.relayPid2);});
    await test('R3 devam: yeni host süreci aynı profil → KAYITLI OYUNA DEVAM ET → yeni oda; misafirler yeni kodla gerçek STARS arayüzünden döner → aynı devletler; dünya, teklifler, savaşlar, federasyon, konsey, hız aynı',async()=>{
      const H=await open('H');await H.addInitScript(TIMERS);await H.goto(origin.H+'/');await wait(H,()=>typeof setupGame==='function'&&document.getElementById('mp1Btn'));
      await tap(H,'#mp1Btn');await wait(H,()=>MP1Host.screen==='menu');await tap(H,'[data-m="saves"][data-mode="resume"]');await wait(H,()=>document.querySelector('#mp1 [data-save]'));
      await tap(H,'#mp1 [data-save] [data-m="resume"]');await wait(H,()=>document.getElementById('mp1Sheet'));await tap(H,'#mp1Sheet [data-m="sheetOk"]');
      await wait(H,()=>MP1Host.lobby&&MP1Host.lobby.phase==='resume'&&document.getElementById('mp4Seats'));const code1=await H.evaluate(()=>MP1Host.code);assert.notEqual(code1,code,'new room code');
      await H.evaluate(CANON);await H.evaluate(HOSTLIB);
      for(const n of guestNames()){const p=await open(n);await p.addInitScript(TIMERS);await guestGo(n,code1,null);
        await wait(p,e=>MP1Join.screen==='lobby'&&MP1Join.lobby&&MP1Join.lobby.phase==='resume'&&MP1Join.empireId===e,saved.e[n],40000);}
      await tap(H,'[data-m="resumeGo"]');const sh=await H.$('#mp1Sheet [data-m="sheetOk"]');if(sh)await tap(H,'#mp1Sheet [data-m="sheetOk"]');
      await wait(H,()=>MP1Host.started&&MP1Host.host.lobby.phase==='ingame');
      for(const n of guestNames()){await wait(pg[n],()=>window.MP6Stars&&MP6Stars.S.started&&!document.getElementById('game').classList.contains('hidden'),undefined,60000);await pg[n].evaluate(CANON);await pg[n].evaluate(GUESTLIB);}
      code=code1;const now=await H.evaluate(()=>__mp8.state());metrics.resume.after=now;metrics.resume.before=saved.state;
      for(const k of ['day','r','offers','wars','feds','council','vassal','humans','speed'])assert.equal(now[k],saved.state[k],'resume keeps '+k);
      if(saved.records){const after=await H.evaluate(()=>{const s=JSON.parse(serialize());return {dip:JSON.parse(JSON.stringify(MP1Host.host.dip)),feds:s.world.feds,warLedger:s.warLedger,relations:s.emps.map(e=>({id:e.id,war:e.war,ally:e.ally,nap:e.nap,pact:e.pact,overlord:e.overlord,vassalType:e.vassalType,vassalContract:e.vassalContract}))};});
        fs.writeFileSync(path.join(out,'resume-records.json'),JSON.stringify({before:saved.records,after},null,2));assert.deepEqual(after,saved.records,'full offer/federation/war/diplomatic records preserved');metrics.resume.fullRecordsEqual=true;}
      await syncCheck('resume');if(saved.personal)await require('./helpers/mp-p0-resume.cjs').verify(H,pg.B,pg.C,saved.personal,out);if(saved.founding)await require('./helpers/beta-fed-found0-resume.cjs').verify(H,pg.B,saved.founding,out);if(process.env.SCALE0_MP){const f=metrics.scale0.fixture,st=await H.evaluate(f=>{const c=G.sys[f.sys].planets[f.planet].col;return{auto:c.auto,deadline:c.autoAfter}},f);assert.equal(st.auto,false);assert.equal(st.deadline,metrics.scale0.start.deadline);metrics.scale0.resume=st;}if(process.env.WARFIX0_HISTORY==='1'){const rows=[];for(const n of guestNames()){const eid=saved.e[n],data=await H.evaluate(eid=>({expected:G.warLedger.fronts.filter(f=>f.sides.includes(eid)&&(!f.legacy||f.entryKind==='event')&&f.sides.every(id=>id===eid||G.emps[eid].contact[id])).map(f=>'war-front:'+f.id),records:MP1Host.host.newsOf(eid)}),eid);const keys=await pg[n].evaluate(()=>G.news.records.map(r=>r.key));for(const key of data.expected){assert(data.records.some(r=>r.key===key),'host private history missing '+key);assert(keys.includes(key),'guest cold history missing '+key);}for(const r of data.records)if(/^(war-front:|war-end:|crisis-war:)/.test(r.key))assert(r.empires.some(e=>e.id===eid),'foreign private history leaked');rows.push({guest:n,eid,...data,guestKeys:keys});}assert(rows.some(r=>r.expected.length>0),'zero history coverage');fs.writeFileSync(path.join(out,'cold-war-history.json'),JSON.stringify(rows,null,2));metrics.resume.warHistory=true;}if(saved.warCenter)await require('./helpers/beta-war-center0-resume.cjs').verify(H,pg.B,pg.C,saved.warCenter,out);if(saved.board2)await require('./helpers/beta-board2-resume.cjs').verify(H,pg.B,pg.C,saved.board2,out);if(saved.board1)await require('./helpers/beta-board1-resume.cjs').verify(H,pg.B,pg.C,saved.board1,out);if(saved.fedAI0)await require('./helpers/beta-fed-ai0-resume.cjs').verify(H,pg.B,pg.C,saved.fedAI0,out);if(saved.er0)await require('./helpers/beta-er0-resume.cjs').verify(H,pg.B,pg.C,saved.er0,out);if(saved.stability)await require('./helpers/beta-stability0-resume.cjs').verify(H,pg.B,pg.C,saved.stability,out);resumeVerified=true;});
    await test('R4 devam eden oyun: bekleyen teklif B tarafından tam bir kez kabul edilir; 6 ay daha kampanya + senkron',async()=>{
      assert(resumeVerified,'R3 must complete before R4 can be accepted');
      if(saved.pending.length){const r=await doAct('B',saved.e.B,{k:'respond',cmd:{kind:'respond',offer:saved.pending[0],action:'accept'}},'resume');assert.equal(r.status,'ok');
        const again=await cmd('B',{kind:'respond',offer:saved.pending[0],action:'accept'});assert.notEqual(again.status,'ok','second accept refused ('+again.code+')');metrics.resume.secondAccept=again.code;}
      else metrics.notes.push('R4: bekleyen teklif yok (C teklifi motor kapısından geçmedi: '+JSON.stringify(metrics.resume.pendingOffer)+')');
      if(saved.stability)metrics.resume.stability=await require('./helpers/beta-stability0-resume.cjs').finish(pg.H,pg.B,saved.stability,out);
      if(saved.personal)metrics.resume.personal=await require('./helpers/mp-p0-resume.cjs').finish(pg.H,pg.B,saved.personal);
      if(saved.founding)metrics.resume.founding=await require('./helpers/beta-fed-found0-resume.cjs').finish(pg.H,pg.B,out);
      if(saved.personal&&saved.founding){metrics.resume.noticeReload=await require('./helpers/mp-p0-resume.cjs').noticeReload(pg.B);await pg.B.evaluate(CANON+GUESTLIB);}
      if(saved.board1)metrics.resume.board1=await require('./helpers/beta-board1-resume.cjs').finish(pg.H,pg.B,pg.C,saved.board1,out);
      if(saved.warCenter)metrics.resume.warCenter=await require('./helpers/beta-war-center0-resume.cjs').finish(pg.H,pg.B,pg.C,saved.warCenter,out);
      if(saved.board2)metrics.resume.board2=await require('./helpers/beta-board2-resume.cjs').finish(pg.H,pg.B,saved.board2,out);
      if(saved.fedAI0)await require('./helpers/beta-fed-ai0-resume.cjs').finish(pg.H,pg.B,pg.C,saved.fedAI0,out);
      await campaign(MONTHS,MONTHS+6);});}

  if(process.env.MP89_UI==='1')await test('UI89 misafir PC ölçeği, gerçek giriş ve yerel kalıcılık; host ve C değişmez',async()=>{
    const p=pg.B,old=p.viewportSize();assert(await p.evaluate(()=>window.MP6Stars?.S.started),'guest UI requires completed game setup');await p.setViewportSize({width:1920,height:1080});
    const baseline=await pg.H.evaluate(()=>({rng:RND_STATE,scale:UI.getUIScale()})),other=await pg.C.evaluate(()=>UI.getUIScale());
    try{metrics.ui89=await require('./helpers/mp89-scale.cjs')(p,out,'guest1920',async()=>{
      await p.reload();await wait(p,()=>window.MP6Stars&&MP6Stars.S.started&&!document.getElementById('game').classList.contains('hidden'),undefined,60000);
    });assert.deepEqual(await pg.H.evaluate(()=>({rng:RND_STATE,scale:UI.getUIScale()})),baseline,'host untouched');assert.deepEqual(await pg.C.evaluate(()=>UI.getUIScale()),other,'other guest untouched');}
    finally{await p.setViewportSize(old);}
  });

  if(SCEN==='N'){
    const E=async n=>pg[n].evaluate(()=>MP1Join.empireId);
    const seatsOk=async()=>{const s=await pg.H.evaluate(()=>__mp8.seats());assert.equal(s.length,CONF.guests,'no extra seat');assert.equal(new Set(s.map(x=>x.e)).size,CONF.guests);return s;};
    const cut=async(n,ms,during)=>{await lanes[n].down();const t0=Date.now();if(during)await during();const left=ms-(Date.now()-t0);if(left>0)await sleep(left);await lanes[n].up();
      await wait(pg[n],()=>MP1Join.hostOnline&&MP1Join.screen!=='join',undefined,60000);return Date.now()-t0;};
    await test('N1 misafir B 5 s kopar → aynı devlete döner; ayna yeniden eşitlenir; başka koltuk açılmaz',async()=>{const e=await E('B');const ms=await cut('B',5000);
      assert.equal(await E('B'),e);await seatsOk();metrics.net.cut5={backMs:ms};await syncCheck('N1');});
    await test('N2 misafir B 30 s kopar (host 10 gün ilerler) → aynı devlet; kaçırılan farklar tam aynayla kapanır',async()=>{const e=await E('B');
      const ms=await cut('B',30000,async()=>{await advance(10);});assert.equal(await E('B'),e);await seatsOk();metrics.net.cut30={backMs:ms};await syncCheck('N2');});
    await test('N3 teklif açıkken kopma: C → B teklif; B kopar/döner; teklif hâlâ bekliyor; B tam bir kez kabul eder',async()=>{const b=await E('B'),c=await E('C');
      const r=await cmd('C',{kind:'offer',to:b,give:[{t:'res',r:'min',v:6}],want:[{t:'res',r:'ene',v:2}]});assert.equal(r.status,'ok','offer sent ('+r.code+')');
      const id=await pg.H.evaluate(([b,c])=>MP1Host.host.dip.offers.filter(o=>o.status==='pending'&&o.from===c&&o.to===b).at(-1).id,[b,c]);
      await cut('B',4000);await syncCheck('N3');assert.equal(await pg.H.evaluate(id=>MP1Host.host.dip.offers.find(o=>o.id===id).status,id),'pending');
      const res0=await pg.H.evaluate(([b,c])=>[G.emps[b].res.min,G.emps[c].res.min],[b,c]);
      const a=await doAct('B',b,{k:'respond',cmd:{kind:'respond',offer:id,action:'accept'}},'N3');assert.equal(a.status,'ok');
      const res1=await pg.H.evaluate(([b,c])=>[G.emps[b].res.min,G.emps[c].res.min],[b,c]);assert.equal(Math.round(res1[0]-res0[0]),6);assert.equal(Math.round(res0[1]-res1[1]),6,'transfer applied once');
      const again=await cmd('B',{kind:'respond',offer:id,action:'accept'});assert.notEqual(again.status,'ok');metrics.net.offerCut={secondAccept:again.code};});
    await test('N4 komuttan hemen sonra kopma: B bina komutu gönderir ve hat aynı anda kesilir → host tam bir kez uygular (ya da hiç), yanıt kaybı yeniden eşitlemeyle görünür',async()=>{
      const b=await E('B');const plan=await pg.H.evaluate(e=>__mp8.plan(e,9).find(a=>a.k==='build'),b);if(!plan){metrics.notes.push('N4: uygun bina yok');return;}
      const before=await pg.H.evaluate(([e,c])=>__mp8.probe(e,c),[b,plan.cmd]);
      const sent=await pg.B.evaluate(c=>MP1Join.cmd(c),plan.cmd);await lanes.B.down();await sleep(3000);await lanes.B.up();
      await wait(pg.B,()=>MP1Join.hostOnline&&MP1Join.screen!=='join',undefined,60000);await sleep(800);
      const after=await pg.H.evaluate(([e,c])=>__mp8.probe(e,c),[b,plan.cmd]);const gotReply=await pg.B.evaluate(cid=>MP1Join.results.some(x=>x.cid===cid),sent.cid);
      metrics.net.cmdThenCut={applied:after-before,reply:gotReply};assert(after-before===0||after-before===1,'applied at most once: '+(after-before));
      await syncCheck('N4');const q=await pg.B.evaluate(([s,p,k])=>{const pl=G.sys[s].planets[p];return pl.col?colonyQueuedOf(pl.col,k):-1;},[plan.cmd.sys,plan.cmd.planet,plan.cmd.key]);
      assert.equal(q,after,'guest sees the host outcome after resync');});
    await test('N5 host 8 s kopar: misafirler "host yok" görür, komut gönderilmez; host\'ta zaman durur; dönünce aynı oda, senkron',async()=>{
      await pg.H.evaluate(()=>MP1Host.host.local({kind:'speed',value:2}));await sleep(1500);await lanes.H.down();await sleep(1500);
      const d0=await pg.H.evaluate(()=>G.day);await wait(pg.B,()=>!MP1Join.hostOnline,undefined,20000);const local=await pg.B.evaluate(()=>MP1Join.cmd({kind:'researchMode',mode:'auto'}));
      assert.equal(local.ok,false,'no command while host offline');await sleep(5000);const d1=await pg.H.evaluate(()=>G.day);metrics.net.hostCut={dayDelta:+(d1-d0).toFixed(2),guestCmd:local.why};
      assert(d1-d0<0.6,'host time stops while offline (Δ '+(d1-d0)+')');await lanes.H.up();await wait(pg.H,()=>MP1Host.connected,undefined,30000);
      for(const n of guestNames())await wait(pg[n],()=>MP1Join.hostOnline,undefined,30000);await pg.H.evaluate(()=>MP1Host.host.local({kind:'speed',value:0}));await syncCheck('N5');});
    await test('N6 aynı oyuncu iki sekme: B aynı profilde ikinci sekmeyle aynı odaya gelir → tek koltuk, başka devlet açılmaz; komut yalnız kendi devletine',async()=>{
      const b=await E('B');const n0=await pg.H.evaluate(()=>MP1Host.host.state.players.size);const t2=await ctx.B.newPage();t2.on('pageerror',e=>errors.push('B2: '+e.message));
      await t2.goto(origin.B+'/mp/play?code='+code);await wait(t2,()=>window.MP1Join&&document.getElementById('jName'));
      const pre=await t2.evaluate(()=>document.getElementById('jName').value);await t2.locator('[data-j="go"]').first().tap();
      await wait(t2,()=>MP1Join.empireId!==null||MP1Join.err||MP1Join.screen==='join'&&MP1Join.closed,undefined,30000).catch(()=>{});await sleep(1500);
      const s2=await t2.evaluate(()=>({e:MP1Join.empireId,err:MP1Join.err,screen:MP1Join.screen}));const s1=await pg.B.evaluate(()=>({e:MP1Join.empireId,online:MP1Join.hostOnline,err:MP1Join.err,screen:MP1Join.screen,closed:MP1Join.closed}));
      const n1=await pg.H.evaluate(()=>MP1Host.host.state.players.size);metrics.net.twoTabs={prefilled:!!pre,tab2:s2,tab1:s1,playersBefore:n0,playersAfter:n1};
      assert.equal(n1,n0,'no new player record');await seatsOk();assert(s2.e===null||s2.e===b,'second tab never gets another empire');
      if(s2.e===null)assert.match(s2.err,/başka bir sekmede/,'MP.8: clear message instead of "Oda dolu"');assert.equal(s1.e,b,'first tab keeps its empire');
      if(s2.e===b){const pl=await pg.H.evaluate(e=>__mp8.plan(e,11).find(a=>a.k==='research'),b);if(pl){const p=t2;const r=await p.evaluate(c=>MP1Join.cmd(c),pl.cmd);metrics.net.twoTabs.cmd=r.ok;}}
      await t2.close();await sleep(1500);
      if(!(await pg.B.evaluate(()=>MP1Join.hostOnline&&MP1Join.empireId!==null))){await pg.B.reload();await wait(pg.B,()=>window.MP1Join&&document.getElementById('jName'),undefined,30000).catch(()=>{});
        if(await pg.B.evaluate(()=>MP1Join.screen==='join'))await guestGo('B',code,null);await wait(pg.B,()=>window.MP6Stars&&MP6Stars.S.started,undefined,60000);await pg.B.evaluate(CANON);await pg.B.evaluate(GUESTLIB);metrics.net.twoTabs.firstTabRejoined=true;}
      assert.equal(await E('B'),b);await syncCheck('N6');});
    await test('N8 karar ölü sokete gider (sessiz kopma): host komutu hiç almaz; yeniden bağlanınca teklif hâlâ bekliyor ve misafir gerçek gelen kutusu yolundan (DiplomaticInbox.resolve) YENİDEN karar verebilir; host tam bir kez uygular',async()=>{
      const b=await E('B'),c=await E('C');const r=await cmd('C',{kind:'offer',to:b,give:[{t:'res',r:'min',v:4}],want:[{t:'res',r:'ene',v:1}]});assert.equal(r.status,'ok','offer ('+r.code+')');
      const id=await pg.H.evaluate(([b,c])=>MP1Host.host.dip.offers.filter(o=>o.status==='pending'&&o.from===c&&o.to===b).at(-1).id,[b,c]);await syncCheck('N8a');
      const rec=await pg.B.evaluate(id=>{const it=DiplomaticInbox.state().records.find(x=>x.mp===id&&x.status==='pending');return it?it.id:null;},id);assert(rec,'guest inbox has the offer record');
      lanes.B.freeze();const first=await pg.B.evaluate(r=>DiplomaticInbox.resolve(r,true),rec);await sleep(500);
      await lanes.B.down();await sleep(1500);await lanes.B.up();await wait(pg.B,()=>MP1Join.hostOnline&&MP1Join.screen!=='join',undefined,60000);
      assert.equal(await pg.H.evaluate(id=>MP1Host.host.dip.offers.find(o=>o.id===id).status,id),'pending','lost command never reached the host');await syncCheck('N8b');
      const rec2=await pg.B.evaluate(id=>{const it=DiplomaticInbox.state().records.find(x=>x.mp===id&&x.status==='pending');return it?it.id:null;},id);
      const second=await pg.B.evaluate(r=>DiplomaticInbox.resolve(r,true),rec2);metrics.net.lostDecision={first,second};
      assert.equal(second&&second.ok,true,'decision can be given again after reconnect: '+JSON.stringify(second));
      await wait(pg.H,id=>MP1Host.host.dip.offers.find(o=>o.id===id).status==='accepted',id,20000);
      const third=await cmd('B',{kind:'respond',offer:id,action:'accept'});assert.notEqual(third.status,'ok','applied exactly once ('+third.code+')');await syncCheck('N8c');});
    await test('N7 relay yeniden başlatma: oda kaybolur (bellekte); misafirler açık hata görür; host dünyası değişmez (duraklar) — devam yalnız kayıt + yeni oda ile (R senaryosu)',async()=>{
      const s0=await pg.H.evaluate(()=>__mp8.state());await stopRelay();await sleep(1000);metrics.relayPid2=await startRelay();
      for(const n of guestNames())await wait(pg[n],()=>MP1Join.screen==='join'||!MP1Join.hostOnline,undefined,40000);await sleep(3000);
      const g=await pg.B.evaluate(()=>({screen:MP1Join.screen,err:MP1Join.err,closed:MP1Join.closed}));const s1=await pg.H.evaluate(()=>__mp8.state());
      metrics.net.relayRestart={guest:g,hostDayDelta:s1.day-s0.day,rngSame:s1.r===s0.r};assert.equal(s1.r,s0.r,'host world untouched');assert(g.err,'guest sees an explicit message');await shot(pg.B,'b-relay-restart');});}

}catch(e){console.log('FATAL',e);results.push({name:'FATAL',status:'FAIL',error:String(e&&e.stack||e)});}
finally{metrics.errors=errors;fs.writeFileSync(path.join(out,'mp8-'+SCEN+'.json'),JSON.stringify({results,metrics},null,1));
  for(const c of Object.values(ctx))try{await c.close();}catch{}try{await px?.close();}catch{}try{await stopRelay();}catch{}for(const l of Object.values(lanes))try{await l.down();}catch{}try{tlsK?.cleanup();}catch{}
  for(const d of Object.values(dirs))try{fs.rmSync(d,{recursive:true,force:true});}catch{}
  if(errors.length)console.log('SAYFA HATALARI '+JSON.stringify(errors.slice(0,10)));
  const pass=results.filter(r=>r.status==='PASS').length,fail=results.length-pass;console.log('GEÇEN: '+pass+' KALAN: '+fail);process.exit(fail?1:0);}
})();
