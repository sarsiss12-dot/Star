'use strict';
/* SAVAŞ-DESTEK-AI.0 — tek oyunculu gerçek Chromium, dokunmatik (isMobile + hasTouch), yatay 800×360 / 844×390 / 901×411.
   Fikstür: X oyuncuya savaş açar (oyuncu savunan). C müttefik (filosu X başkentine komşu), D dost (ilişki 55), diğerleri ilişki 0.
   W1 Savaş Merkezi → cephe (pencere çerçevesi içinde) → ASKERÎ DESTEK İSTE (dokunuş): adaylar uygun önde, müttefik dosttan önce, gerekçe etiketleri; taşma yok
   W2 UYGUN n ADAYA DESTEK İSTE (dokunuş): her uygun adaya tek teklif; durum satırları; kabul eden mevcut cepheye katılır (yeni ilan yok: aynı sefer)
   W3 toplu düğme ikinci kez görünmez / basılsa da yeni teklif yok; oyuncunun kaynakları değişmez (karşılıksız istek) */
const path=require('path'),fs=require('fs'),assert=require('assert/strict');
const {chromium}=require(require.resolve('playwright',{paths:[path.join(__dirname,'node_modules'),__dirname]}));
const root=path.resolve(process.env.STARS_ROOT||path.join(__dirname,'..')),out=path.resolve(process.env.STARS_OUTPUT||path.join(__dirname,'../reports/claude/evidence/savas-destek-ai0/browser-sp'));fs.mkdirSync(out,{recursive:true});
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
  const overflow=()=>page.evaluate(()=>{const m=document.querySelector('#modal .mbox')||document.getElementById('modal'),r=m.getBoundingClientRect();
    const out=[...m.querySelectorAll('button,input,select')].filter(e=>{const b=e.getBoundingClientRect();return b.width>0&&(b.right>window.innerWidth+1||b.left<-1);}).map(e=>e.dataset.a||e.id);
    return {boxW:Math.round(r.width),vw:window.innerWidth,hScroll:m.scrollWidth>m.clientWidth+2||document.documentElement.scrollWidth>window.innerWidth+2,offscreen:out};});
  await page.goto(url);await page.evaluate(()=>{try{localStorage.clear();}catch{}resetSetupNaming();leaveTitle('setup');Object.assign(CFG,{seed:22,size:'orta',aiCount:5,pirates:false});safeRenderSetup();startGame();});
  await page.waitForFunction(()=>typeof G!=='undefined'&&G.p&&!document.getElementById('game').classList.contains('hidden'),undefined,{timeout:60000});
  await page.waitForFunction(()=>!!document.querySelector('#modal [data-a="advClose"]'),undefined,{timeout:5000}).catch(()=>{});await closeAll();
  const fx=await page.evaluate(()=>{const ais=G.emps.filter(o=>o.ai&&!o.dead&&!o.wild&&!o.crisisSide),X=ais[0],C=ais[1],D=ais[2],P=G.p;
    for(const a of G.emps)for(const b of G.emps)if(a!==b){a.contact[b.id]=true;a.ally[b.id]=false;a.war[b.id]=false;a.rel[b.id]=0;(a.intel||={})[b.id]=3;if(a.nap)delete a.nap[b.id];}
    for(const s of G.sys)s.seen=G.emps.map(e=>e.id);
    P.ally[C.id]=C.ally[P.id]=true;P.rel[C.id]=C.rel[P.id]=85;P.rel[D.id]=D.rel[P.id]=55;
    for(const e of G.emps)for(const k of ['min','ene','ala','etk'])e.res[k]=Math.max(e.res[k],3000);
    for(const o of [C,D])for(let i=0;i<3;i++)newFleet(o,o.home,[{c:'kru'},{c:'kru'}],'güç');
    const xs=G.sys[X.home],adj=xs.lanes.map(i=>G.sys[i]).find(s=>s.owner<0)||xs;for(const f of G.fleets.filter(f=>(f.e===C.id||f.e===D.id)&&isArmed(f))){f.sys=adj.id;f.mv=null;}
    warAuthorize(X,P,{n:'t'});declareWar(X,P);warAuthClear();const F=warLedgerFind(P.id,X.id);window.FX={X:X.id,C:C.id,D:D.id,F:F.id,camp:F.campaign};UI.setSpeed(0);return window.FX;});
  const res0=await page.evaluate(()=>['min','ene','ala','etk'].map(k=>Math.floor(G.p.res[k])).join(','));
  await test(view+' W1 destek adayları sıralı, gerekçeli, taşmasız',async()=>{
    await page.evaluate(F=>UI.act('warCenterDetail',F),fx.F);await page.waitForSelector(`#modal [data-a="warCenterSupport"]`,{timeout:5000});
    assert.ok(await page.evaluate(()=>!!document.querySelector('#modal>.mbox #warCenterRoot')),'cephe ayrıntısı pencere çerçevesinin içinde (p54: çerçeve düşüyordu)');
    await tap(`#modal [data-a="warCenterSupport"]`);await page.waitForSelector('#warSupportRoot .supCand',{timeout:5000});
    const cards=await page.evaluate(()=>[...document.querySelectorAll('#warSupportRoot .supCand')].map(c=>({id:+c.dataset.cand,tier:+c.dataset.tier,ok:c.querySelector('.supGate').dataset.ok,txt:c.querySelector('.bt').textContent.trim()})));
    const ok=cards.filter(c=>c.ok==='1'),bad=cards.findIndex(c=>c.ok!=='1');assert.ok(bad<0||cards.slice(bad).every(c=>c.ok!=='1'),'uygunlar önde');
    for(let i=1;i<ok.length;i++)assert.ok(ok[i-1].tier>=ok[i].tier,'öncelik');const ic=cards.findIndex(c=>c.id===fx.C),id=cards.findIndex(c=>c.id===fx.D);assert.ok(ic>=0&&ic<id,'müttefik dosttan önce');
    assert.match(cards[ic].txt,/müttefik/);assert.match(cards[id].txt,/dost/);const ov=await overflow();assert.equal(ov.hScroll,false,'yatay kaydırma');assert.deepEqual(ov.offscreen,[]);
    await page.screenshot({path:path.join(out,view+'-w1-adaylar.png')});return {cards,ov};});
  await test(view+' W2 toplu destek isteği: her uygun adaya tek teklif, kabul eden mevcut cepheye katılır',async()=>{
    const n=await page.evaluate(()=>document.querySelectorAll('#warSupportRoot .supGate[data-ok="1"]').length);assert.ok(n>=2,'en az iki uygun aday: '+n);
    await tap('#warSupportAll');await page.waitForFunction(()=>![...document.querySelectorAll('#warSupportRoot .supState')].some(s=>s.dataset.state==='sending'),undefined,{timeout:5000});
    const st=await page.evaluate(()=>[...document.querySelectorAll('#warSupportRoot .supCand')].map(c=>({id:+c.dataset.cand,state:c.querySelector('.supState')?.dataset.state||'',text:c.querySelector('.supState')?.textContent||''})));
    const asked=st.filter(s=>s.state);assert.equal(asked.length,n,'her uygun adaya bir teklif '+JSON.stringify(st));
    const joined=await page.evaluate(FX=>G.emps.filter(e=>e.war[FX.X]&&e.id!==0).map(e=>{const f=warLedgerFind(e.id,FX.X);return {id:e.id,camp:f&&f.campaign===FX.camp,parent:f&&f.parent};}),fx);
    for(const j of joined){assert.equal(j.camp,true,'kabul eden aynı sefere katılır (yeni ilan yok)');const s=st.find(x=>x.id===j.id);assert.equal(s&&s.state,'accepted');}
    for(const s of asked.filter(s=>s.state==='accepted'))assert.ok(joined.some(j=>j.id===s.id),'kabul = gerçek katılım');
    assert.ok(await page.evaluate(()=>!!document.querySelector('#modal>.mbox #warSupportRoot')),'yeniden çizim pencere çerçevesinin içinde');
    const ov=await overflow();assert.equal(ov.hScroll,false);assert.deepEqual(ov.offscreen,[]);await page.screenshot({path:path.join(out,view+'-w2-toplu.png')});return {st,joined};});
  await test(view+' W3 tekrar yok, oyuncu kaynağı değişmez',async()=>{
    const vis=await page.evaluate(()=>!!document.getElementById('warSupportAll'));const n=await page.evaluate(FX=>WarCenterUI.askAll(FX.F,FX.X),fx);assert.equal(n,0,'ikinci toplu basışta teklif yok');
    const res1=await page.evaluate(()=>['min','ene','ala','etk'].map(k=>Math.floor(G.p.res[k])).join(','));assert.equal(res1,res0,'karşılıksız istek oyuncudan kaynak düşmez');
    await closeAll();return {bulkVisible:vis};});
  if(errors.length)results.push({name:view+' sayfa hataları',status:'INFO',errors:errors.slice(0,5)});await ctx.close();}
 }finally{await browser.close();srv.close();fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({root,results},null,1));console.log(`GEÇEN: ${pass} KALAN: ${fail}`);process.exitCode=fail?1:0;}
})();
