'use strict';
/* TİCARET-SON-EKSİKLER.0 — tek oyunculu gerçek Chromium, dokunmatik (isMobile + hasTouch), yatay 800×360 / 844×390 / 901×411.
   Fikstür: canlı oyunda yalıtılmış 10 sistemlik zincir; AI X (s0) ↔ AI Y (s9) ticareti oyuncunun limanından (s3) ve D'nin limanından (s6) geçer.
   D, window.__mpHumanVoter ile ikinci insan sahip sayılır (onayı motor yoluyla verilir; MP komut yolu Node P1–P7 ve MP8 TZ'de).
   V1 talep kartı bildirim şeridinde → dokunuşla TİCARET · Liman izinleri; kim, hangi liman, hangi taşıyıcı, bedel, son gün görünür; taşma yok
   V2 ONAYLA (dokunuş) → "diğer onaylar bekleniyor", izin / ödeme yok (işlem başarı gibi gösterilmez)
   V3 ikinci sahip onaylar → kart Uygulandı, dört izin, X–Y sözleşmesi; sözleşme ekranına dönüş
   V4 yeni talep → REDDET (dokunuş) → Reddedildi, izin / ödeme yok
   V5 süresi dolan talebin kartına dokunma → Süresi doldu, karar düğmesi yok, izin / ödeme yok
   V6 liman izni yenileme: oyuncunun izni 40 gün → İzinler satırında YENİLEME İSTE → masada izin + 36 ◈ hazır → TEKLİF → AI kabul ederse bitişten +360; kullanan sözleşme görünür
   V7 aktif ticaret hattı: kargo / sözleşme ekranına geri dönüş, konvoy listesi açılır */
const path=require('path'),fs=require('fs'),assert=require('assert/strict');
const {chromium}=require(require.resolve('playwright',{paths:[path.join(__dirname,'node_modules'),__dirname]}));
const root=path.resolve(process.env.STARS_ROOT||path.join(__dirname,'..')),out=path.resolve(process.env.STARS_OUTPUT||path.join(__dirname,'../reports/claude/evidence/ticaret-son-eksikler0/browser-sp'));fs.mkdirSync(out,{recursive:true});
const VIEWS=(process.env.SP_VIEWS||'800x360,844x390,901x411').split(',');
const results=[];let pass=0,fail=0;
async function test(name,fn){try{const r=await fn();results.push({name,status:'PASS',...(r||{})});pass++;console.log('PASS '+name);}catch(e){results.push({name,status:'FAIL',error:String(e&&e.stack||e).slice(0,1500)});fail++;console.log('FAIL '+name+'\n'+String(e&&e.message||e).slice(0,400));}}
(async()=>{
 const http=require('http'),srv=http.createServer((q,r)=>{const u=decodeURIComponent(new URL(q.url,'http://x').pathname),f=path.join(root,u==='/'?'index.html':u.replace(/^\/+/,''));if(!f.startsWith(root)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.writeHead(404);r.end();return;}
   const t={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json','.css':'text/css'}[path.extname(f)]||'application/octet-stream';r.writeHead(200,{'Content-Type':t});fs.createReadStream(f).pipe(r);});
 await new Promise(r=>srv.listen(0,'127.0.0.1',r));const url='http://127.0.0.1:'+srv.address().port+'/';
 const browser=await chromium.launch({executablePath:process.env.STARS_CHROMIUM_PATH||undefined,args:['--no-sandbox','--disable-gpu']});
 try{for(const view of VIEWS){const [w,hh]=view.split('x').map(Number);
  const ctx=await browser.newContext({viewport:{width:w,height:hh},isMobile:true,hasTouch:true,deviceScaleFactor:1});const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  const tap=async sel=>{const l=page.locator(sel).first();await l.scrollIntoViewIfNeeded();const b=await l.boundingBox();if(!b)throw Error('görünmüyor: '+sel);
    const hit=await page.evaluate(([x,y,sel])=>{const el=document.elementFromPoint(x,y),t=document.querySelector(sel);return !!(el&&t&&(el===t||t.contains(el)));},[b.x+b.width/2,b.y+b.height/2,sel]);
    if(!hit)throw Error('dokunma noktası başka öğede: '+sel);await page.touchscreen.tap(b.x+b.width/2,b.y+b.height/2);await page.waitForTimeout(220);};
  const closeAll=()=>page.evaluate(()=>{try{UI.act('closeDiplo');}catch{}for(let i=0;i<6&&!document.getElementById('modal').classList.contains('hidden');i++){if(document.querySelector('#modal [data-a="advClose"]'))UI.act('advClose');else UI.closeModal();}UI.setSpeed(0);});
  const overflow=()=>page.evaluate(()=>{const m=document.querySelector('#modal .mbox'),r=m.getBoundingClientRect();
    const out=[...m.querySelectorAll('button,input,select')].filter(e=>{const b=e.getBoundingClientRect();return b.width>0&&(b.right>window.innerWidth+1||b.left<-1);}).map(e=>e.dataset.a||e.id);
    return {boxW:Math.round(r.width),vw:window.innerWidth,hScroll:m.scrollWidth>m.clientWidth+2||document.documentElement.scrollWidth>window.innerWidth+2,offscreen:out};});
  const S=()=>page.evaluate(()=>({etk:Object.fromEntries([0,FX.X,FX.Y,FX.D].map(id=>[id,Math.round(G.emps[id].res.etk)])),tx:(G.commerce.transit||[]).map(t=>({id:t.id,st:t.st,votes:t.votes})),
    pt:Object.fromEntries([0,FX.D].map(id=>[id,Object.keys(G.emps[id].portTransit||{}).filter(k=>G.emps[id].portTransit[k]>G.day).map(Number).sort((a,b)=>a-b)])),k:G.commerce.contracts.filter(c=>!Commerce.closed(c)&&[c.a,c.b].includes(FX.X)).length}));
  await page.goto(url);await page.evaluate(()=>{try{localStorage.clear();}catch{}resetSetupNaming();leaveTitle('setup');Object.assign(CFG,{seed:22,size:'orta',aiCount:5,pirates:false});safeRenderSetup();startGame();});
  await page.waitForFunction(()=>typeof G!=='undefined'&&G.p&&!document.getElementById('game').classList.contains('hidden'),undefined,{timeout:60000});
  await page.waitForFunction(()=>!!document.querySelector('#modal [data-a="advClose"]'),undefined,{timeout:5000}).catch(()=>{});await closeAll();
  await page.evaluate(()=>{const ais=G.emps.filter(o=>o.ai&&!o.dead&&!o.wild),X=ais[0],Y=ais[1],D=ais[2],P=G.p;window.FX={X:X.id,Y:Y.id,D:D.id};window.__mpHumanVoter=id=>id===D.id;
    for(const a of G.emps)for(const b of G.emps)if(a!==b){a.contact[b.id]=true;a.war[b.id]=false;a.rel[b.id]=60;(a.intel||={})[b.id]=3;(a.mem||={})[b.id]=[{v:60,d:G.day,k:'t'}];}
    for(const e of G.emps)for(const k of ['min','ene','ala','etk'])e.res[k]=Math.max(e.res[k],600);
    const tpl=JSON.parse(JSON.stringify(G.sys.flatMap(s=>s.planets).find(p=>p.col).col));
    const free=G.sys.filter(s=>s.planets.length&&!s.planets.some(p=>p.col)&&s.owner<0).slice(0,10);const ids=new Set(free.map(s=>s.id));for(const s of G.sys)s.lanes=s.lanes.filter(x=>!ids.has(x));
    const h=G.sys[P.home];free.forEach((s,i)=>{s.lanes=[];s.x=h.x+40+i*30;s.y=h.y+60;s.cr=0;s.seen=G.emps.map(e=>e.id);s.surv=s.seen.slice();});for(let i=0;i<9;i++){free[i].lanes.push(free[i+1].id);free[i+1].lanes.push(free[i].id);}
    function port(e,s){const p=s.planets[0];p.owner=e.id;p.col=JSON.parse(JSON.stringify(tpl));p.col.e=e.id;p.col.b={liman:1};p.col.pop=120;p.col.q=[];e.colonies.push({s:s.id,p:0});s.owner=e.id;}
    port(X,free[0]);port(P,free[3]);port(D,free[6]);port(Y,free[9]);(X.pact||={})[Y.id]=(Y.pact||={})[X.id]=true;
    X.res.min=20;X.inc={min:-4,ene:12,yiy:1,ala:1,tuk:1};X.res.ene=600;Y.res.min=600;Y.inc={min:12,ene:-4,yiy:1,ala:1,tuk:1};Y.res.ene=20;
    window.FX.chain=free.map(s=>s.id);window.ASK=()=>{const bud={routes:96};return !!Commerce.aiTransitRequest(X,Y,Commerce.aiBalance(X),Commerce.aiBalance(Y),bud);};
    updateVision();Commerce.state();G.inbox=[];UI.drawInbox();});
  FXV=await page.evaluate(()=>({D:FX.D,Y:FX.Y}));
  const cardSel=async id=>{const uid=await page.evaluate(id=>(G.inbox||[]).find(n=>n.kind==='transit'&&n.data===id)?.uid,id);if(!uid)throw Error('kart yok');return '#inbox [data-a="openNote"][data-x="'+uid+'"]';};
  await test(view+' V1 talep kartı → dokunuşla Liman izinleri: talep eden, limanlar, taşıyıcılar, bedel, son gün; taşma yok',async()=>{
    const ok=await page.evaluate(()=>ASK());assert.equal(ok,true,'AI talep açtı');await page.evaluate(()=>UI.drawInbox());await tap(await cardSel(1));
    const box=await page.evaluate(()=>{const b=document.querySelector('#modal .transitReq[data-tx="1"]');return b?{st:b.dataset.st,legs:b.querySelectorAll('.transitLeg').length,text:b.textContent,
      buttons:[...b.querySelectorAll('button')].map(x=>x.dataset.a+':'+x.dataset.x)}:null;});
    assert.ok(box,'talep kutusu');assert.equal(box.st,'pending');assert.equal(box.legs,4,'dört bacak (iki sahip × iki taşıyıcı)');assert.match(box.text,/36 ◈/);assert.match(box.text,/son \d+ gün/);
    assert.ok(box.buttons.includes('transitVote:1:1')&&box.buttons.includes('transitVote:1:0'),'ONAYLA / REDDET');const ov=await overflow();assert.equal(ov.hScroll,false);assert.deepEqual(ov.offscreen,[]);
    await page.screenshot({path:path.join(out,view+'-v1-talep.png')});return {box:{...box,text:undefined},ov};});
  await test(view+' V2 ONAYLA → diğer sahibin onayı bekleniyor; izin / ödeme yok, başarı gösterilmez',async()=>{
    const s0=await S();await tap('#modal [data-a="transitVote"][data-x="1:1"]');
    const ui=await page.evaluate(()=>{const b=document.querySelector('#modal .transitReq[data-tx="1"]');return {st:b?.dataset.st,wait:!!b?.querySelector('.transitWait'),btn:!!b?.querySelector('[data-a="transitVote"]')};});
    const s1=await S();assert.equal(ui.st,'pending');assert.equal(ui.wait,true,'bekleme metni');assert.equal(ui.btn,false,'ikinci karar düğmesi yok');
    assert.deepEqual(s1.etk,s0.etk);assert.deepEqual(s1.pt[0],[]);assert.equal(s1.tx[0].votes[0],'yes');await page.screenshot({path:path.join(out,view+'-v2-bekliyor.png')});return {ui,s1};});
  await test(view+' V3 ikinci sahip onaylar → Uygulandı, dört izin, X–Y sözleşmesi; sözleşmeler ekranına dönüş',async()=>{
    const s0=await S();const r=await page.evaluate(()=>Commerce.transitVote(G.emps[FX.D],1,true));assert.equal(r.st,'committed',JSON.stringify(r));
    await page.evaluate(()=>UI.act('commerceTransit','1'));await page.waitForTimeout(200);const st=await page.evaluate(()=>document.querySelector('#modal .transitReq[data-tx="1"]')?.dataset.st);
    const s1=await S();assert.equal(st,'committed');assert.equal(s1.pt[0].length,2,'oyuncu iki taşıyıcıya izin verdi');assert.equal(s1.pt[FX_D(s1)].length,2,'ikinci sahip de');
    assert.equal(s1.etk[0]-s0.etk[0],72);assert.equal(s1.k,1,'X–Y sözleşmesi');await tap('#modal [data-a="commerce"]');const back=await page.evaluate(()=>!!document.querySelector('#modal .mhd')?.textContent.includes('TİCARET'));
    assert.equal(back,true);return {s1};});
  function FX_D(s){return Object.keys(s.pt).map(Number).find(k=>k!==0);}
  let FXV=null;const FX_Dn=()=>FXV.D,FX_Yn=()=>FXV.Y;
  await test(view+' V4 yeni talep → REDDET → Reddedildi, izin / ödeme yok',async()=>{
    await page.evaluate(()=>{for(const id of [FX.X,FX.Y]){delete G.emps[0].portTransit[id];delete G.emps[FX.D].portTransit[id];}for(const c of G.commerce.contracts)if([c.a,c.b].includes(FX.X))c.status='cancelled';
      for(const e of [G.emps[FX.X],G.emps[FX.Y]])e.aiTalk={};return ASK();});const s0=await S();const id=s0.tx[s0.tx.length-1].id;await closeAll();await page.evaluate(()=>UI.drawInbox());
    await tap(await cardSel(id));await tap('#modal [data-a="transitVote"][data-x="'+id+':0"]');const st=await page.evaluate(id=>document.querySelector('#modal .transitReq[data-tx="'+id+'"]')?.dataset.st,id);
    const s1=await S();assert.equal(st,'rejected');assert.deepEqual(s1.etk,s0.etk);assert.deepEqual(s1.pt[0],[]);return {id,st};});
  await test(view+' V5 süresi dolan talebin kartına dokunma → Süresi doldu, karar düğmesi yok, izin / ödeme yok',async()=>{
    await page.evaluate(()=>{for(const e of [G.emps[FX.X],G.emps[FX.Y]])e.aiTalk={};return ASK();});const s0=await S();const id=s0.tx[s0.tx.length-1].id;
    await page.evaluate(()=>{for(let i=0;i<250;i++){G.day+=.5;Commerce.tick(.5);}});await closeAll();await page.evaluate(()=>UI.drawInbox());await tap(await cardSel(id));
    const ui=await page.evaluate(id=>{const b=document.querySelector('#modal .transitReq[data-tx="'+id+'"]');return {st:b?.dataset.st,btn:!!b?.querySelector('[data-a="transitVote"]'),text:b?.textContent};},id);
    const s1=await S();assert.equal(ui.st,'expired');assert.equal(ui.btn,false);assert.deepEqual(s1.etk,s0.etk);const late=await page.evaluate(id=>Commerce.transitVote(G.p,id,true),id);assert.equal(late.ok,false);
    await page.screenshot({path:path.join(out,view+'-v5-suresi-doldu.png')});return {id,st:ui.st,late};});
  await test(view+' V6 izin yenileme: 40 gün kala YENİLEME İSTE → masada izin + 36 ◈ → TEKLİF → bitişten +360 (tek bedel)',async()=>{
    await closeAll();const r0=await page.evaluate(()=>{const O=G.emps[FX.Y];O.portTransit={0:G.day+40};O.rel[0]=95;(O.mem||={})[0]=[{v:95,d:G.day,k:'t'}];O.res.ala=5000;
      const free=FX.chain;const n={from:0,to:FX.Y,give:[{t:'freight',r:'ene',v:6,source:free[3],target:free[9],every:30,months:24}],want:[{t:'freight',r:'min',v:4,source:free[9],target:free[3],every:30,months:24}]};
      return {end:O.portTransit[0],etk:G.p.res.etk};});
    await page.evaluate(()=>UI.act('commerceTransit'));await page.waitForTimeout(200);const row=await page.evaluate(()=>!!document.querySelector('#modal .permitRow[data-o="'+FX.Y+'"] [data-a="transitRenewAsk"]'));
    assert.equal(row,true,'yenileme düğmesi');await tap('#modal .permitRow[data-o="'+(await page.evaluate(()=>FX.Y))+'"] [data-a="transitRenewAsk"]');
    const draft=await page.evaluate(()=>({give:UI.deal?.give,want:UI.deal?.want,to:UI.deal?.to}));assert.deepEqual(draft.want,[{t:'portTransit'}]);assert.deepEqual(draft.give,[{t:'res',r:'etk',v:36}]);
    await tap('[data-a="dealSend"]');await page.waitForTimeout(400);const r1=await page.evaluate(()=>({end:G.emps[FX.Y].portTransit[0],etk:G.p.res.etk,msg:UI.dealMsg}));
    await page.screenshot({path:path.join(out,view+'-v6-yenileme.png')});await closeAll();
    assert.notEqual(r1.end,r0.end,'yenileme uygulanmadı: '+r1.msg);
    assert.ok(Math.abs(r1.end-r0.end-360)<1e-6,'bitişten uzadı '+(r1.end-r0.end));assert.ok(r0.etk-r1.etk>=36&&r0.etk-r1.etk<=40,'tek bedel '+(r0.etk-r1.etk));return {r0,r1};});
  await test(view+' V7 aktif ticaret hattı: Liman izinleri → Konvoylar / Sözleşmeler ekranına dönüş',async()=>{
    await page.evaluate(()=>{for(let i=0;i<10;i++){G.day+=1;dailyTick(1);}UI.act('commerceTransit');});await page.waitForTimeout(200);
    await tap('#modal [data-a="commerceConvoys"]');const t1=await page.evaluate(()=>document.querySelector('#modal .mbd')?.textContent.slice(0,200));await tap('#modal [data-a="commerce"]');
    const t2=await page.evaluate(()=>document.querySelector('#modal .mbd')?.textContent.slice(0,200));const ov=await overflow();await closeAll();
    assert.ok(t1&&t2);assert.equal(ov.hScroll,false);return {ov};});
  await test(view+' V8 oyuncunun koridor talebi: sözleşme formu "Gereken transit izni" → GEREKEN LİMAN İZİNLERİNİ İSTE (dokunuş) → D\'nin onayı beklenir → onaylanınca iki yön izinleri',async()=>{
    await closeAll();await page.evaluate(()=>{const Y=G.emps[FX.Y];(G.p.pact||={})[Y.id]=(Y.pact||={})[0]=true;for(const id of [0,FX.Y])delete G.emps[FX.D].portTransit?.[id];G.commerce.contracts.forEach(c=>{if([c.a,c.b].includes(0))c.status='cancelled';});
      UI.act('commerceNew',String(FX.Y));});await page.waitForTimeout(300);
    await page.evaluate(()=>{const s=document.getElementById('cargoSource'),t=document.getElementById('cargoTarget');s.value=String(FX.chain[3]);s.dispatchEvent(new Event('change'));t.value=String(FX.chain[9]);t.dispatchEvent(new Event('change'));});
    await page.waitForFunction(()=>{const b=document.getElementById('cargoTransitAsk');return b&&b.style.display!=='none';},undefined,{timeout:8000});
    const reason=await page.evaluate(()=>document.getElementById('cargoReason').textContent);assert.match(reason,/Gereken transit izni/);const s0=await S();
    await tap('#cargoTransitAsk');const tx=await page.evaluate(()=>{const t=G.commerce.transit.at(-1);return {id:t.id,by:t.by,st:t.st,votes:t.votes,legs:t.legs.map(l=>l.o+':'+l.c)};});
    assert.equal(tx.by,0);assert.equal(tx.st,'pending');assert.deepEqual(Object.keys(tx.votes).map(Number),[FX_Dn()]);assert.deepEqual((await S()).etk,s0.etk,'onaydan önce ödeme yok');
    const r=await page.evaluate(id=>Commerce.transitVote(G.emps[FX.D],id,true),tx.id);assert.equal(r.st,'committed');
    const pt=await page.evaluate(()=>Object.keys(G.emps[FX.D].portTransit||{}).filter(k=>G.emps[FX.D].portTransit[k]>G.day).map(Number).sort((a,b)=>a-b));assert.deepEqual(pt,[0,FX_Yn()].sort((a,b)=>a-b));
    const open=await page.evaluate(()=>!!Commerce.route(G.p,G.emps[FX.Y],FX.chain[3],FX.chain[9])&&!!Commerce.route(G.emps[FX.Y],G.p,FX.chain[9],FX.chain[3]));assert.equal(open,true,'iki yön açık');
    await closeAll();return {tx,reason};});
  if(errors.length)results.push({name:view+' sayfa hataları',status:'INFO',errors:errors.slice(0,5)});await ctx.close();}
 }finally{await browser.close();srv.close();fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({root,results},null,1));console.log(`GEÇEN: ${pass} KALAN: ${fail}`);process.exitCode=fail?1:0;}
})();
