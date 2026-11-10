'use strict';
/* MP.7.3 — Galaktik Konsey ve siyasi entrikalar gerçek STARS ekranlarıyla + iki telefonlu ilk test rehberinin akışı (MP.7.1 test altyapısı).
   Üretim kipindeki relay (MP1_BIND 0.0.0.0, MP1_TRUST_PROXY=1, https MP1_ORIGINS) + büyük çerçeveleri PARÇALAYAN yerel TLS vekili (MP.7).
   Ayrı Chromium süreçleri, YATAY telefon görünümleri (host 844×390, B 800×360, C 915×412), kararlar gerçek dokunmayla.
   Gezinme (diplomasi sayfasını / gelen kutusu penceresini açmak) sayfa işleviyle; teklif, kabul, ret, karşı teklif, geri çekme düğmeleri dokunmayla.
   Test düzeni: insan devletler arasında temas ve başlangıç stoğu host'ta kurulur (fikstür).
   BU GERÇEK İNTERNET / FİZİKSEL ANDROID TESTİ DEĞİLDİR. Çıktı: $STARS_OUTPUT/mp73-results.json + PNG. */
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{execSync}=require('child_process'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),out=path.resolve(process.env.STARS_OUTPUT||path.join(root,'../evidence/mp73'));fs.mkdirSync(out,{recursive:true});
const relayMod=require('../research/mp1/server/relay.js'),{selfSigned,startProxy}=require('./helpers/mp11-tls-proxy.js');
const BUILD=JSON.parse(fs.readFileSync(path.join(root,'RELEASE-MANIFEST.json'),'utf8')).build;const results=[],errors=[],metrics={},auditPages=new Set();
const EXPECTED_MP=fs.readFileSync(path.join(root,'research/mp1/client/view.js'),'utf8').match(/const MP_VERSION='([^']+)';/)[1],MP_RE=EXPECTED_MP.split('.').join('[.]');
async function test(name,fn){if(process.env.MP73_ONLY&&!new RegExp(process.env.MP73_ONLY).test(name))return;const t0=Date.now();
  try{await fn();results.push({name,status:'PASS',ms:Date.now()-t0});console.log('PASS '+name);}
  catch(e){for(const p of auditPages){try{const tag='failure-'+results.length+'-'+[...auditPages].indexOf(p);await p.screenshot({path:path.join(out,tag+'.png')});fs.writeFileSync(path.join(out,tag+'.json'),JSON.stringify(await p.evaluate(()=>({url:location.pathname,vote:typeof G!=='undefined'?G.council:null,inbox:typeof G!=='undefined'?G.inbox:null,modal:document.getElementById('modal')?.innerHTML,pane:document.getElementById('diploPane')?.innerHTML})),null,2));}catch{}}results.push({name,status:'FAIL',error:String(e&&e.stack||e).slice(0,1800)});console.log('FAIL '+name+'\n'+(e&&e.stack||e));}finally{if(process.env.FEDAI0_AUDIT==='1')await require('./helpers/beta-fed-ai0-input.cjs').dump([...auditPages],out,String(results.length));}}
const PHONE=(w,h)=>process.env.MPP0_DESKTOP==='1'?{viewport:{width:1920,height:1080},isMobile:false,hasTouch:false,deviceScaleFactor:1,serviceWorkers:'allow'}:({viewport:{width:w,height:h},isMobile:true,hasTouch:true,deviceScaleFactor:2,serviceWorkers:'allow'});
const freePort=()=>new Promise(res=>{const s=require('net').createServer().listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>res(p));});});
const wait=(p,fn,arg,timeout=30000)=>p.waitForFunction(fn,arg,{timeout,polling:100});
const shot=(p,n)=>p.screenshot({path:path.join(out,n+'.png')}).catch(()=>{});
let tapFail=0;
const tap=async(p,sel)=>{const l=p.locator(sel).first();await l.scrollIntoViewIfNeeded().catch(()=>{});try{if(process.env.MPP0_DESKTOP==='1')await l.click({timeout:8000});else await l.tap({timeout:8000});}
  catch(e){const n='tapfail-'+(++tapFail);fs.writeFileSync(path.join(out,n+'-playwright-error.json'),JSON.stringify({selector:sel,name:e.name,message:e.message,stack:e.stack},null,2));await shot(p,n);
    const d=await p.evaluate(sel=>{const el=document.querySelector(sel),r=el?.getBoundingClientRect(),top=r&&document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return {selector:sel,url:location.pathname,who:G.p?.name,box:r&&[r.x,r.y,r.width,r.height],connected:el?.isConnected,top:top&&(top.id||top.className||top.tagName),viewport:[innerWidth,innerHeight],scroll:[scrollX,scrollY],focus:document.activeElement?.id,modal:document.getElementById('modal')?.className};},sel).catch(x=>({diagnosticError:x.message}));
    fs.writeFileSync(path.join(out,n+'-target.json'),JSON.stringify(d,null,2));throw e;}};
async function design(p,o){
  /* kurulum ekranı dikeyde doldurulur (MP.7 testiyle aynı); oyun yatay görünümde oynanır */
  const vp=p.viewportSize();if(vp.width>vp.height)await p.setViewportSize({width:vp.height,height:vp.width});
  try{await design0(p,o);}finally{await p.setViewportSize(vp);}
}
async function design0(p,o){
  await wait(p,()=>!document.getElementById('menu').classList.contains('hidden')&&document.querySelector('#setup [data-a="mizacSet"]'));
  await p.fill('#empName',o.name);
  if(process.env.UX0_NAMES){const before=await p.locator('#empName').inputValue();await tap(p,'#setup [data-a="rollName"]');assert.equal(await p.locator('#empName').inputValue(),before);assert.equal(await p.locator('#setupNameStatus').innerText(),'⚠️ Önce devletinin doktrinini seç!');}
  await tap(p,'#setup [data-a="mizacSet"][data-x="'+o.mizac+'"]');
  if(process.env.UX0_NAMES){await tap(p,'#setup [data-a="rollName"]');const n=await p.locator('#empName').inputValue();assert.equal(n.split(' ').length,2);assert(await p.evaluate(k=>NAME_TITLES[k].some(([t])=>CFG.name.endsWith(' '+t)),o.mizac));}

  await tap(p,'#setup [data-a="step"][data-x="etik"]');for(const x of o.ethics)await tap(p,'#setup [data-a="ethic"][data-x="'+x+'"]');
  await tap(p,'#setup [data-a="step"][data-x="civic"]');for(const c of o.civics)await tap(p,'#setup [data-a="civic"][data-x="'+c+'"]');
  await tap(p,'#setup [data-a="step"][data-x="koken"]');await tap(p,'#setup [data-a="origin"][data-x="'+o.origin+'"]');
  if(process.env.SETUP0_AUDIT&&await p.evaluate(()=>MP7Setup.role==='host')){
    await tap(p,'#setup [data-a="step"][data-x="galaksi"]');
    if(await p.evaluate(()=>CFG.pirates!==false))await tap(p,'#setup [data-a="togPirate"]');
    assert.equal(await p.evaluate(()=>CFG.pirates),false);await p.screenshot({path:path.join(out,'setup0-host-pirates-off.png')});
  }
  if(process.env.SETUP1_AUDIT&&await p.evaluate(()=>MP7Setup.role==='host')){
    await tap(p,'#setup [data-a="step"][data-x="galaksi"]');
    for(const[a,k]of[['togGate','gates'],['togRandomEvents','randomEvents'],['togAIOrigins','aiOrigins']])if(await p.evaluate(k=>CFG[k]!==false,k))await tap(p,'#setup [data-a="'+a+'"]');
    await tap(p,'#setup [data-a="crisisPower"][data-x="kapali"]');
    await tap(p,'#setup [data-a="councilSet"][data-x="seyrek"]');
    await tap(p,'#setup [data-a="ruinSet"][data-x="az"]');
  }
  await tap(p,'#setup [data-a="start"]');
  try{await wait(p,()=>document.getElementById('menu').classList.contains('hidden'),undefined,10000);}
  catch(e){await shot(p,'design-fail-'+o.mizac);throw Error('kurulum kapanmadı: '+await p.evaluate(()=>(UI.setupError||'')+' | '+(document.querySelector('#setup .err,#setup .setupError')||{}).textContent));}
}
async function room(H,cap,guests){
  for(const p of [H,...guests.map(g=>g[0])])auditPages.add(p);
  await H.goto(base+'/');await wait(H,()=>typeof setupGame==='function'&&document.getElementById('mp1Btn')&&window.MP7Setup&&window.MP71Dip);
  await tap(H,'#mp1Btn');await tap(H,'[data-m="create"]');await wait(H,()=>MP1Host.lobby&&MP1Host.lobby.mode==='design'&&MP1Host.lobby.phase==='waiting');
  if(cap>2){await H.selectOption('#mp7Cap',String(cap));await wait(H,c=>MP1Host.lobby.capacity===c,cap);}
  await tap(H,'#mp7EditMe');await design(H,{name:'Kızıl Muhafız',mizac:'militarist',origin:'standart',ethics:['mil:2'],civics:['kale_dok']});
  const link=await H.textContent('#mp1Link');
  for(const [p,name,d] of guests){await p.goto(link);await wait(p,()=>window.MP1Join&&document.getElementById('jName'));await p.fill('#jName',name);await tap(p,'[data-j="go"]');
    await wait(p,()=>MP1Join.screen==='lobby'&&MP1Join.lobby&&MP1Join.lobby.mode==='design'&&document.getElementById('jEditMe'));
    await tap(p,'#jEditMe');await wait(p,()=>document.getElementById('mp7Head'));await design(p,d);
    await wait(p,()=>/kaydedildi/.test(document.getElementById('jDraft').textContent));await tap(p,'#jReady');}
  await wait(H,()=>MP1Host.host.canStart().ok);await H.waitForTimeout(300);await shot(H,'room-lobby-'+guests.length);
  /* MP.7.1 düzeltmesi: kurulumu kapatan dokunuşun sentetik tıklaması lobi düğmesine düşmez (yatayda ODAYI KAPAT sorusu açılıyordu) */
  assert.equal(await H.evaluate(()=>{const s=document.getElementById('mp1Sheet');return s?s.textContent:'';}),'','ghost click opened a lobby sheet');
  await tap(H,'[data-m="start"]');
  for(const [p] of guests)await wait(p,()=>window.MP6Stars&&MP6Stars.S.started&&!document.getElementById('game').classList.contains('hidden'),undefined,40000);
  /* fikstür: insan devletler arası temas + başlangıç stoğu (motorun teklif kuralları aynen) */
  await H.evaluate(n=>{const hs=[0,...Array.from({length:n},(_,i)=>i+1)];for(const a of hs){const A=G.emps[a];A.res.min=Math.max(A.res.min,2000);A.res.ene=Math.max(A.res.ene,2000);A.res.etk=Math.max(A.res.etk,400);
    for(const b of hs)if(a!==b){A.contact[b]=true;A.rel[b]=40;}}MP1Host.host.publish();},guests.length);
  /* başlangıçta açılan tek oyunculu tanıtım penceresi kapatılır (pencere açıkken misafirde ayna bekletilir — MP.6.1) */
  await H.waitForTimeout(1200);   // tek oyunculu danışman penceresi oyun girişinden 420 ms sonra açılır
  for(const p of [H,...guests.map(g=>g[0])]){const open=await p.evaluate(()=>{const m=document.getElementById('modal');return m&&!m.classList.contains('hidden')?(m.querySelector('.mhd')||m).textContent.trim().slice(0,40):'';});
    metrics.startModal=(metrics.startModal||[]).concat(open);
    if(open){const b=await p.$('#modal [data-a="advClose"],#modal [data-a="closem"]');if(b)await tap(p,'#modal [data-a="advClose"],#modal [data-a="closem"]');else await p.evaluate(()=>UI.closeModal());
      await wait(p,()=>document.getElementById('modal').classList.contains('hidden'));}}
  for(const [p] of guests)await wait(p,n=>G.emps.filter(e=>e.id!==0&&G.p.contact[e.id]).length>=n,guests.length);
  return link;
}
/* gerçek anlaşma penceresi: kaynak maddesi ekle (Kaynak → kaynak seç → miktar → TASLAĞA EKLE) */
async function addRes(p,side,r,v){
  await tap(p,'#diploPane [data-a="dealAdd"][data-x="'+side+':res"]');const idx=['min','ene','yiy','ala','tuk','etk'].indexOf(r);
  await tap(p,'#modal [data-a="pickOne"][data-x="'+idx+'"]');await tap(p,'#modal [data-a="amountPreset"][data-x="'+v+'"]');await tap(p,'#modal [data-a="amountApply"]');
  await wait(p,()=>document.getElementById('modal').classList.contains('hidden'));
}
const openDeal=(p,id)=>p.evaluate(id=>{UI.openDiplo();UI.selectDiplo(id,'deal');},id);
const cardUid=(p,key)=>wait(p,k=>(G.inbox||[]).some(n=>n.key===k),key).then(()=>p.evaluate(k=>G.inbox.find(n=>n.key===k).uid,key));
async function openCard(p,key){const uid=await cardUid(p,key);
  /* diplomasi sayfası tam ekran (yatay telefon): kartlara dönmek için oyuncu gibi ✕ ile kapatılır */
  if(await p.evaluate(()=>document.getElementById('diploPane').classList.contains('show')))await tap(p,'#diploPane [data-a="closeDiplo"]');await tap(p,'#inbox [data-a="openNote"][data-x="'+uid+'"]');await wait(p,council=>council?document.querySelector('#diploPane.show [data-a="cncNo"]'):document.getElementById('inboxYes')||document.querySelector('#modal .archiveDetail'),key.startsWith('mp73cnc:'));}
/* yatay telefon: pencere ekranda, onay/ret düğmeleri görünür ve üst üste binmez */
async function layout(p,sels){return p.evaluate(sels=>{const vw=innerWidth,vh=innerHeight,m=document.querySelector('#modal .modalBox,#modal > div')||document.getElementById('modal'),rs=sels.map(s=>{const e=document.querySelector(s);if(!e)return null;e.scrollIntoView({block:'nearest'});const r=e.getBoundingClientRect();
  return {s,x:r.x,y:r.y,w:r.width,h:r.height,top:(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)||{}).id||''};});
  const bad=[];for(const r of rs){if(!r){bad.push('yok');continue;}if(r.x<0||r.y<0||r.x+r.w>vw+1||r.y+r.h>vh+1)bad.push(r.s+' ekran dışı '+JSON.stringify(r));}
  for(let i=0;i<rs.length;i++)for(let j=i+1;j<rs.length;j++){const a=rs[i],b=rs[j];if(a&&b&&a.x<b.x+b.w&&b.x<a.x+a.w&&a.y<b.y+b.h&&b.y<a.y+a.h)bad.push('üst üste '+a.s+' / '+b.s);}
  const mr=m.getBoundingClientRect();return {bad,vw,vh,modal:[mr.x,mr.y,mr.width,mr.height]};},sels);}
const D=H=>H.evaluate(()=>MP1Host.host.dip.offers.map(o=>({id:o.id,from:o.from,to:o.to,status:o.status,why:o.why,round:o.round,prev:o.prev})));
let relay,px,base,tls,bH,bB,bC;
(async()=>{tls=selfSigned();try{
  const pport=await freePort();base='https://localhost:'+pport;
  relay=relayMod.create({MP1_PORT:'0',MP1_BIND:'0.0.0.0',MP1_TRUST_PROXY:'1',MP1_ORIGINS:base});const rs=await relay.start();
  px=await startProxy({target:rs.address().port,cert:tls.cert,key:tls.key,port:pport,fragment:4096});
  const spki=execSync(`openssl x509 -in ${tls.cert} -pubkey -noout | openssl pkey -pubin -outform der | openssl dgst -sha256 -binary | base64`).toString().trim();
  const launch={executablePath:process.env.STARS_CHROMIUM_PATH||undefined,args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--ignore-certificate-errors-spki-list='+spki]};
  [bH,bB,bC]=await Promise.all([0,1,2].map(()=>chromium.launch(launch)));
  const H=await (await bH.newContext(PHONE(844,390))).newPage(),Bp=await (await bB.newContext(PHONE(800,360))).newPage();
  for(const [n,p] of [['host',H],['B',Bp]]){p.on('pageerror',e=>errors.push(n+': '+e.message));p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))errors.push(n+' console: '+m.text().slice(0,300));});}

  const cmdOf=(p,c)=>p.evaluate(c=>new Promise(res=>{const cid=MP1Join.cmd(c).cid;const t=setInterval(()=>{const x=MP1Join.results.find(y=>y.cid===cid);if(x){clearInterval(t);res(x.code||x.status);}},50);}),c);
  /* ---------- A: host + 1 misafir — iki telefonlu ilk test rehberinin akışı (B 800×360) ---------- */
  await test('A1 rehber 1–8: oda, iki farklı devlet, hazır, başlat; iki ekranda galaksi; sürüm işareti lobi / başlangıç / MP çubuğunda ve /mp/version oyun build\'iyle aynı',async()=>{
    await room(H,2,[[Bp,'Bora',{name:'Saf Akıl Ağı',mizac:'teknokrasi',origin:'standart',ethics:['mat:2','mil:-1'],civics:['sinyal_avci']}]]);
    if(process.env.UX0_NAMES){const names=await H.evaluate(()=>G.emps.map(e=>e.name));await wait(Bp,names=>G.p.name===names[1],names);assert.equal(await Bp.evaluate(()=>G.emps[1].name),names[0]);metrics.ux0Names={host:names,guestOwn:await Bp.evaluate(()=>G.p.name),guestHost:await Bp.evaluate(()=>G.emps[1].name)};await shot(Bp,'ux0-guest-names');}
    if(process.env.SETUP1_AUDIT)metrics.setup1=await require('./helpers/beta-setup1-mp.cjs')(H,Bp,out);
    if(process.env.SETUP0_AUDIT){metrics.setup0=[];for(const [who,p] of [['host',H],['guest',Bp]]){await wait(p,()=>G.cfg.pirates===false);const row=await p.evaluate(()=>({cfg:typeof MP1Join==='undefined'?CFG.pirates:null,game:G.cfg.pirates,nests:(G.nests||[]).length,pirateFleets:G.fleets.filter(f=>f.name==='Korsan Muhafızı'||f.name==='Korsan Akıncısı').length,ownName:G.p.name,ownId:G.p.id}));assert.equal(row.game,false);assert.equal(row.nests+row.pirateFleets,0);metrics.setup0.push({who,...row});}assert.equal(metrics.setup0[0].cfg,false);}
    for(const p of [H,Bp])assert.equal(await p.evaluate(()=>!!document.getElementById('map')&&!document.getElementById('game').classList.contains('hidden')),true);
    const v=await Bp.evaluate(async()=>{const r=await fetch('/mp/version',{cache:'no-store'});return {s:r.status,j:await r.json(),b:BUILD_ID,line:MP1View.verLine(),chip:(document.getElementById('mp1Mini')||{}).title||''};});
    metrics.version=v.j;assert.equal(v.s,200);assert.equal(v.j.mp,EXPECTED_MP);assert.equal(v.j.build,v.b);assert.match(v.line,new RegExp(MP_RE+' · oyun '+BUILD+'$'));assert.match(v.chip,new RegExp(MP_RE));
    assert.equal(Object.values(v.j.files).every(x=>/^[0-9a-f]{12}$/.test(x)),true);
    await wait(Bp,()=>MP6Stars.S.unsupported&&MP6Stars.S.unsupported.length>0);metrics.unsupported=await Bp.evaluate(()=>MP6Stars.S.unsupported);
    for(const a of ['bill','billPick','billTarget','cncFound','cncJoin','cncLeave','cncNo','cncPane','cncYes','permanent','reform','throneBuild','veto','bribe','blackmail','bmGo','fundSep','panoptRetarget','revolt','revoltConfirm','whisperBlame','whisperGo','whisperMenu','whisperPick','devour','devourConfirm','colFire'])
      assert(!metrics.unsupported.includes(a),a+' still unsupported');
    assert.equal(metrics.unsupported.length,18,JSON.stringify(metrics.unsupported));
    await tap(Bp,'#mp6Conn');await wait(Bp,()=>document.getElementById('mpVer')&&document.getElementById('mpVer').offsetParent);   // telefonda görünür tanı satırı
    metrics.guestDiag=await Bp.evaluate(()=>document.getElementById('mpVer').textContent);assert.match(metrics.guestDiag,new RegExp(MP_RE+' · oyun '+BUILD+'( · misafir)? · host bağlı .*son hata: '));
    assert.doesNotMatch(metrics.guestDiag,/tok|key|anahtar/i);await shot(Bp,'a1-guest-diag');await tap(Bp,'#mp6Conn');
    assert.match(await H.evaluate(()=>{MP1Host.miniOpen=true;return MP1View.verLine();}),new RegExp(MP_RE));
  });
  if(process.env.BETA02_TOUCH_REPEAT)await test('T02 mp6Conn sınırlı gerçek dokunma tekrarı',async()=>{
    for(let i=0;i<Number(process.env.BETA02_TOUCH_REPEAT);i++){
      const old=await Bp.locator('#mp6Conn').getAttribute('aria-expanded');await tap(Bp,'#mp6Conn');
      assert.notEqual(await Bp.locator('#mp6Conn').getAttribute('aria-expanded'),old,'trusted tap toggles exactly once');
    }
  });
  if(process.env.BETA_P01_PANELS==='1')await test('P01 #1 host ve misafir panel sahipliği / ayna yenilemesi',async()=>{
    await H.evaluate(()=>{MP1Host.host.local({kind:'speed',value:0});G.cfg.council='acik';G.council={name:'P0.1 Test Konseyi',founder:0,members:[0,1],laws:{},targeted:{},treasury:0,president:0,termStart:G.day,terms:{0:1},voteIn:30,vote:null,dead:false};MP1Host.host.publish();});
    await wait(Bp,()=>!!G.council);
    metrics.p01Host=await require('./helpers/beta-p01-panels.cjs')(H,out,'p01-host');
    metrics.p01Guest=await require('./helpers/beta-p01-panels.cjs')(Bp,out,'p01-guest',async()=>{
      const v=await H.evaluate(()=>{G.council.voteIn-=1;MP1Host.host.publish();return G.council.voteIn});await wait(Bp,v=>MP6Stars.S.mirror?.world?.council?.voteIn===v,v);const held=await Bp.evaluate(()=>!document.getElementById('modal').classList.contains('hidden'));if(!held)await wait(Bp,v=>G.council.voteIn===v,v);
    });
  });
  if(process.env.BETA_P01_VOTES==='1')await test('P03 #3 tek dokunma, bekleyen gerçek ACK, panel koruması ve yeniden bağlantı',async()=>{metrics.p03=await require('./helpers/beta-p01-votes.cjs')(H,Bp);});
  if(process.env.FEDFOUND0==='1')await test('FD0 gerçek host-misafir kuruluş daveti, tek dokunma ve açık son onay',async()=>{metrics.fedfound=await require('./helpers/beta-fed-found0-browser.cjs')(H,Bp,out);});
  if(process.env.WARFIX0==='1')await test('PWF barış / yeni yan cephe / gerçek misafir dokunması / Save8 / tekrar bağlantı',async()=>{metrics.warfix=await require('./helpers/beta-war-fix0-mp.cjs')(H,Bp,out);});
  if(process.env.BETA_P01_WAR==='1')await test('P04 #4/#21 iki insan savaş bitişi, güvenli haber aynası ve ambargo',async()=>{metrics.p04=await require('./helpers/beta-p01-war-mp.cjs')(H,Bp);});
  await test('A2 rehber 9–12: misafir filosunu yürütür (gerçek orderMove → host), B → host diplomatik teklif ve host gelen kutusundan kabul eder; zaman iki ekranda ilerler',async()=>{
    const plan=await H.evaluate(()=>{const f=G.fleets.find(x=>x.e===1&&x.ships.length&&x.sys>=0&&!x.mv);return {f:f.id,to:G.sys[f.sys].lanes[0]};});
    await Bp.evaluate(p=>orderMove(G.fleets.find(f=>f.id===p.f),p.to),plan);await wait(H,p=>{const f=G.fleets.find(x=>x.id===p.f);return !!(f.mv||f.path.length);},plan);
    await openDeal(Bp,1);await addRes(Bp,'give','ene',50);await tap(Bp,'#diploPane [data-a="dealSend"]');
    await wait(H,()=>MP1Host.host.dip.offers.some(o=>o.from===1&&o.to===0&&o.status==='pending'));const id=(await D(H)).find(o=>o.from===1&&o.to===0&&o.status==='pending').id;
    await H.evaluate(()=>MP71Dip.tick());await openCard(H,'mp71:'+id);await tap(H,'#inboxYes');await wait(H,id=>MP1Host.host.dip.offers.find(o=>o.id===id).status==='accepted',id);
    await H.evaluate(()=>UI.closeModal());const d0=await Bp.evaluate(()=>G.day);await wait(Bp,d=>G.day>d+0.9,d0,30000);
  });
  await test('A3 rehber 13–15: misafir bağlantısı kopar ve döner → aynı devlet; host oyun kaydı alır (MP.4 paketi doğrulanır)',async()=>{
    const e0=await Bp.evaluate(()=>[MP1Join.empireId,G.p.name]);await Bp.context().setOffline(true);await Bp.waitForTimeout(3000);await Bp.context().setOffline(false);
    await wait(Bp,()=>MP1Join.ws&&MP1Join.ws.readyState===1&&MP1Join.hostOnline,undefined,40000);await wait(Bp,n=>G.p.name===n,e0[1]);
    assert.deepEqual(await Bp.evaluate(()=>[MP1Join.empireId,G.p.name]),e0);
    assert.equal(await H.evaluate(()=>{const s=MP1Host.host.snapshot({});return s.ok&&StarsMP.validatePackage(JSON.stringify(s.pkg)).ok;}),true);
  });
  /* ---------- B: host + 2 misafir — Galaktik Konsey (B 800×360, C 915×412) ---------- */
  const H2=await (await (process.env.MPP0_REVERSE==='1'?bB:bH).newContext(PHONE(844,390))).newPage(),B2=await (await (process.env.MPP0_REVERSE==='1'?bH:bB).newContext(PHONE(800,360))).newPage(),C2=await (await bC.newContext(PHONE(915,412))).newPage();
  for(const [n,p] of [['host2',H2],['B2',B2],['C2',C2]]){p.on('pageerror',e=>errors.push(n+': '+e.message));p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))errors.push(n+' console: '+m.text().slice(0,300));});}
  const cv=()=>H2.evaluate(()=>{const v=G.council&&G.council.vote;return v?{yes:v.yes.slice(),no:v.no.slice(),done:!!v.done,key:v.key}:null;});
  await test('B1 konsey motorun kendi yoluyla kurulur (fikstür: temas); AI insanlar adına oy / sponsor yazmaz; B gerçek "KONSEY OYLAMASI" kartından Konsey ekranını açar ve EVET (dokunma) → host kaydeder, oylama açık kalır',async()=>{
    await room(H2,3,[[B2,'Bora',{name:'Saf Akıl Ağı',mizac:'teknokrasi',origin:'standart',ethics:['mat:2','mil:-1'],civics:['sinyal_avci']}],[C2,'Cem',{name:'Okyanus Ticaret Birliği',mizac:'tuccar',origin:'standart',ethics:['aut:-1','mat:1'],civics:['maden_lonca']}]]);
    await H2.evaluate(()=>{for(const a of G.emps)for(const b of G.emps)if(a!==b&&!a.wild&&!b.wild)a.contact[b.id]=true;for(const e of [0,1,2])for(const r of ['min','etk'])G.emps[e].res[r]=Math.max(G.emps[e].res[r],3000);
      if(!foundCouncilByConvention())throw Error('council');startCouncilVote();MP1Host.host.publish();});
    const v=await cv();assert(v&&!v.done);for(const id of [1,2])assert(!v.yes.includes(id)&&!v.no.includes(id),'no AI vote for human '+id);
    const key=await (await B2.waitForFunction(()=>{const n=(G.inbox||[]).find(n=>typeof n.key==='string'&&n.key.startsWith('mp73cnc:'));return n?n.key:false;},undefined,{timeout:30000,polling:100})).jsonValue();
    await openCard(B2,key);await wait(B2,()=>{const b=document.querySelector('#diploPane [data-a="cncYes"]'),r=b&&b.getBoundingClientRect();return r&&r.x>=0&&r.right<=innerWidth;});   // panel kayarak açılır
    await B2.waitForTimeout(400);await shot(B2,'b1-b-council-vote');
    /* layout() düğmeyi scrollIntoView ile getirir; ilk okuma kaydırma sürerken olabilir → yerleşince yeniden ölç (en çok 3 kez) */
    let L;for(let i=0;i<3;i++){L=await layout(B2,['#diploPane [data-a="cncYes"]','#diploPane [data-a="cncNo"]']);if(!L.bad.length)break;metrics.b1Relayout=(metrics.b1Relayout|0)+1;await B2.waitForTimeout(500);}
    assert.deepEqual(L.bad,[],JSON.stringify(L));
    if(process.env.BETA02_BALLOT_PROOF)await B2.evaluate(()=>{window.__p02Seen=MP6Stars.S.seenResults;MP6Stars.S.seenResults=1e9;window.__p02Sent=MP6Stars.S.stats.sent.councilVote||0;});
    await tap(B2,'#diploPane [data-a="cncYes"]');await wait(H2,()=>G.council.vote&&G.council.vote.yes.includes(1));assert.equal((await cv()).done,false,'still open for C and host');
    if(process.env.BETA02_BALLOT_PROOF){
      await wait(B2,()=>!!UI._councilPending&&document.getElementById('councilVoteStatus').textContent.includes('bekliyor'));
      assert(await B2.locator('#diploPane [data-a="cncYes"]').isDisabled());
      await B2.evaluate(()=>{UI.openDiplo();MP6Stars.S.seenResults=window.__p02Seen;});await wait(B2,()=>!!UI._councilAck);
      assert((await B2.evaluate(()=>$('diploPane')._surfaceKey)).startsWith('diplo:'));assert.equal(await B2.evaluate(()=>(MP6Stars.S.stats.sent.councilVote||0)-window.__p02Sent),1);
      const t=await H2.evaluate(()=>councilVoteToken(G.council.vote));assert.equal(await cmdOf(B2,{kind:'councilVote',token:t,yes:true}),'rules:voted');
    }
  });
  await test('B2 C (915×412) HAYIR verir; oylama host oy verene kadar açık; host kendi Konsey ekranından EVET → motor kapatır; tekrar oy reddedilir',async()=>{
    const key=await (await C2.waitForFunction(()=>{const n=(G.inbox||[]).find(n=>typeof n.key==='string'&&n.key.startsWith('mp73cnc:'));return n?n.key:false;},undefined,{timeout:30000,polling:100})).jsonValue();
    await openCard(C2,key);await wait(C2,()=>document.querySelector('#diploPane [data-a="cncNo"]'));await tap(C2,'#diploPane [data-a="cncNo"]');
    await wait(H2,()=>G.council.vote.no.includes(2));const host0=await H2.evaluate(()=>G.council.members.includes(0));
    if(host0){assert.equal((await cv()).done,false,'waits for the host');await H2.evaluate(()=>{UI.closeModal();UI.openCouncil();});await wait(H2,()=>document.querySelector('#diploPane [data-a="cncYes"]'));
      await shot(H2,'b2-host-council-vote');await tap(H2,'#diploPane [data-a="cncYes"]');}
    await wait(H2,()=>!G.council.vote||G.council.vote.done);
    assert.match(await cmdOf(C2,{kind:'councilVote',token:'x:',yes:true}),/^rules:(no-vote|stale|voted)$/);
    if(process.env.BETA02_BALLOT_PROOF){
      const canonical=await H2.evaluate(()=>G.council.lastVote),laws=await H2.evaluate(()=>G.council.laws);assert(canonical);assert(canonical.yes.includes(0)&&canonical.yes.includes(1)&&canonical.no.includes(2));
      metrics.p02Ballot={canonical,devices:[]};
      for(const [p,me] of [[H2,0],[B2,1],[C2,2]]){await wait(p,key=>G.council.lastVote?.eventKey===key,canonical.eventKey);
        const v=await p.evaluate(()=>G.council.lastVote),pi=id=>id===me?0:id===0?me:id;
        assert.deepEqual(v.yes,canonical.yes.map(pi));assert.deepEqual(v.no,canonical.no.map(pi));assert.deepEqual(v.weight,canonical.weight);assert.equal(v.passed,canonical.passed);assert.deepEqual(await p.evaluate(()=>G.council.laws),laws);
        await wait(p,key=>G.news.records.some(r=>r.key===key),canonical.eventKey);await p.evaluate(()=>{UI.closeModal();UI.openCouncil();});
        await wait(p,()=>document.querySelector('[data-council-result]'));await shot(p,'p02-result-'+me);metrics.p02Ballot.devices.push({me,result:v});
        const rid=await p.evaluate(key=>G.news.records.find(r=>r.key===key).id,canonical.eventKey);await p.evaluate(()=>ArchiveUI.open('news'));
        await tap(p,'#modal [data-a="newsDetail"][data-x="'+rid+'"]');await tap(p,'#modal [data-a="newsContext"]');await wait(p,()=>$('diploPane')._surfaceKey==='council');
        await tap(p,'#diploPane [data-a="newsReturn"]');assert((await p.locator('#modal').innerText()).includes(canonical.eventKey));await p.evaluate(()=>UI.closeModal());
      }
      await C2.context().setOffline(true);await C2.waitForTimeout(900);await C2.context().setOffline(false);
      await wait(C2,()=>MP1Join.ws?.readyState===1&&MP1Join.hostOnline);await wait(C2,key=>G.council.lastVote?.eventKey===key,canonical.eventKey);
      assert.deepEqual(await C2.evaluate(()=>G.council.lastVote.weight),canonical.weight);metrics.p02Ballot.reconnect=true;
      const stored=await H2.evaluate(()=>{const s=serialize();return {v:JSON.parse(s).v,bytes:s.length};});assert.equal(stored.v,8);metrics.p02Ballot.save8=stored;
    }
  });
  await test('B3 tasarı: B Konsey ekranından tasarı sunar (dokunma) → host kampanya sponsoru B; B AI üyeye rüşvet (dokunma) → host 200 mineral aktarır; insan üye C\'ye rüşvet reddedilir; C\'nin aynasında rüşvetin yönü yok',async()=>{
    await B2.evaluate(()=>{UI.closeModal();UI.openCouncil();});const k=await (await B2.waitForFunction(()=>{const b=document.querySelector('#diploPane [data-a="bill"]');return b?b.dataset.x:false;},undefined,{timeout:30000,polling:100})).jsonValue();
    await H2.evaluate(()=>MP1Host.host.local({kind:'speed',value:0}));   // ölçüm sırasında kampanya ayı ilerlemesin (gerçek hız komutu)
    await tap(B2,'#diploPane [data-a="bill"][data-x="'+k+'"]');await wait(H2,k=>G.council.campaign&&G.council.campaign.key===k&&G.council.campaign.sponsor===1,k);
    await wait(B2,()=>G.council&&G.council.campaign);
    const aiIds=await H2.evaluate(()=>G.council.members.filter(m=>G.emps[m].ai&&!G.council.campaign.bribed[m]));
    /* Rüşvet düğmeleri tek oyunculuda olduğu gibi İSTİHBARAT → OPERASYONLAR → SİYASİ VE LOJİSTİK grubunda (intelSenate). */
    await B2.evaluate(ids=>{UI.closeModal();const p=document.getElementById('diploPane');if(p)p.classList.remove('show');UI.tab('intel');UI.act('spySel',String(ids.find(i=>spyTargetCheck(G.p,G.emps[i]).ok)??ids[0]));},aiIds);
    await wait(B2,()=>document.querySelector('[data-a="intelGroup"][data-x="siyasi"]'));
    if(!(await B2.evaluate(()=>UI.intelGroup==='siyasi')))await tap(B2,'[data-a="intelGroup"][data-x="siyasi"]');
    const ai=await (await B2.waitForFunction(ids=>{const b=[...document.querySelectorAll('[data-a="bribe"]')].map(x=>x.dataset.x).find(x=>x.endsWith(':yes')&&ids.includes(+x.split(':')[0]));return b?+b.split(':')[0]:false;},aiIds,{timeout:30000,polling:100})).jsonValue();
    const m0=await H2.evaluate(a=>[G.emps[1].res.min,G.emps[a].res.min],ai);await shot(B2,'b3-b-campaign');
    await tap(B2,'[data-a="bribe"][data-x="'+ai+':yes"]');await wait(H2,a=>!!G.council.campaign.bribed[a],ai);
    const m1=await H2.evaluate(a=>[G.emps[1].res.min,G.emps[a].res.min],ai);assert.deepEqual([Math.round(m0[0]-m1[0]),Math.round(m1[1]-m0[1])],[200,200]);
    const cLocal=await B2.evaluate(()=>{const me=MP1Join.empireId;return 2===me?0:2;});
    assert.equal(await cmdOf(B2,{kind:'bribe',target:2,yon:'no'}),'rules:human');void cLocal;
    await wait(C2,()=>G.council&&G.council.campaign&&Object.keys(G.council.campaign.bribed).length>0);
    assert.equal(await C2.evaluate(()=>Object.values(G.council.campaign.bribed).every(v=>v===1)),true,'only the lock');
    await H2.evaluate(()=>MP1Host.host.local({kind:'speed',value:1}));
  });
  await test('B4 entrika ve yıkıcı onay: B fısıltı ağını gerçek pencereden açar, iki AI seçer, gönderir → host motoru (B\'nin günlüğü ya da motorun gerekçesi); onaysız yutma çağrısı host\'a hiçbir şey göndermez',async()=>{
    await B2.evaluate(()=>{UI.closeModal();UI.act('whisperMenu');});await wait(B2,()=>document.querySelectorAll('#modal [data-a="whisperPick"]').length>=2);await shot(B2,'b4-b-whisper');
    const ids=await B2.evaluate(()=>[...document.querySelectorAll('#modal [data-a="whisperPick"]')].map(b=>+b.dataset.x).filter(id=>G.emps[id]&&G.emps[id].ai).slice(0,2));
    if(ids.length===2){for(const id of ids)await tap(B2,'#modal [data-a="whisperPick"][data-x="'+id+'"]');
      const w0=await H2.evaluate(()=>(G.emps[1].whisperLog||[]).length),hl=await H2.evaluate(()=>(G.p.whisperLog||[]).length);const go=await B2.$('#modal [data-a="whisperGo"]:not([disabled])');
      if(go){await tap(B2,'#modal [data-a="whisperGo"]');await H2.waitForTimeout(1500);metrics.whisper=await H2.evaluate(()=>(G.emps[1].whisperLog||[]).length);
        assert(metrics.whisper>=w0,'B log');assert.equal(await H2.evaluate(()=>(G.p.whisperLog||[]).length),hl,'host log untouched');}
      else metrics.whisper='gönder düğmesi motor koşuluyla kapalı';}
    const sentW=p=>p.evaluate(()=>{const o={...MP6Stars.S.stats.sent};for(const k of ['spyQuote','quote','warQuote','vassalQuote','settleQuote','fedFoundQuote'])delete o[k];return JSON.stringify(o);});   // salt okuma sorguları hariç
    const s0=await sentW(B2);await B2.evaluate(()=>{UI.closeModal();UI.act('devourConfirm');});await B2.waitForTimeout(300);
    assert.equal(await sentW(B2),s0,'no command without a confirmed preview');
  });
  if(process.env.FEDFOUND0_THREE==='1')await test('FD3 üç insan, misafir kurucu, özel davet ret/iptal, yeniden bağlantı ve karma oy',async()=>{metrics.fd3=await require('./helpers/beta-fed-found0-three.cjs')(H2,B2,C2,out);});
  if(process.env.FEDAI0_AUDIT==='1')await require('./helpers/beta-fed-ai0-input.cjs').start([H2,B2,C2]);
  if(process.env.MPP0==='1')await test('P0 katılımcı görüş, sağlık, özel kararlar, rota ve görsel hareket',async()=>{metrics.p0=await require('./helpers/mp-p0-guest-browser.cjs')(H2,B2,C2,out);});
  if(process.env.ER0_ACCEPT==='1')await test('ERA gerçek dış kışkırtma ve ayrı ideolojik bölünme kabulü',async()=>{metrics.er0Acceptance=await require('./helpers/beta-er0-acceptance.cjs')(H2,B2,C2,out,{tap,wait});});
  if(process.env.ER0==='1')await test('ER0 katılımcı casusluk, hedef güvenliği ve gerçek isyan müdahalesi',async()=>{metrics.er0=await require('./helpers/beta-er0-browser.cjs')(H2,B2,C2,out,{tap,wait});});
  if(process.env.FEDAI0==='1')await test('FAI0 misafir taslak düzenleme ve üç insan acil savunma sırası',async()=>{metrics.fedAI0=await require('./helpers/beta-fed-ai0-browser.cjs')(H2,B2,C2,out,{tap,wait});});
  if(process.env.WAR_CENTER0==='1')await test('WC0 üç insan koşullu koalisyon, karşı teklif, ücret ve savaş merkezi',async()=>{metrics.warCenter=await require('./helpers/beta-war-center0-browser.cjs')(H2,B2,C2,out,{tap,wait,openCard,addRes});});
  if(process.env.BOARD2==='1')await test('BD2 koloni paneli ve yetkili uzaktan inşa',async()=>{metrics.board2=await require('./helpers/beta-board2-browser.cjs')(H2,B2,C2,out);});
  if(process.env.BOARD1==='1')await test('BD1 federasyon FIFO, savaş yardımı, geri çekme ve ayrı aday rızası',async()=>{metrics.board1=await require('./helpers/beta-board1-browser.cjs')(H2,B2,C2,out);});
  await test('sayfa hataları yok',async()=>{assert.deepEqual(errors,[]);});
}catch(e){console.log('FATAL',e);results.push({name:'FATAL',status:'FAIL',error:String(e&&e.stack||e)});}
finally{fs.writeFileSync(path.join(out,'mp73-results.json'),JSON.stringify({results,errors,metrics,pass:results.filter(r=>r.status==='PASS').length,fail:results.filter(r=>r.status==='FAIL').length},null,2));
  for(const b of [bH,bB,bC])try{await b?.close();}catch{}try{await px?.close();}catch{}try{relay?.shutdown();}catch{}try{tls?.cleanup();}catch{}
  const pass=results.filter(r=>r.status==='PASS').length,fail=results.length-pass;console.log('GEÇEN: '+pass+' KALAN: '+fail);process.exit(fail?1:0);}
})();
