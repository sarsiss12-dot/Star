'use strict';
/* TİCARET-TAMAMLAMA.0 Faz D — tek oyunculu gerçek Chromium, dokunmatik (isMobile + hasTouch), yatay 800×360 / 844×390 / 901×411.
   STARS_ROOT=<kök> ile eski sürüm aynı vakalarla koşar (p50'de −100 / +100 / MAKS / 25 yok → U1 FAIL beklenir).
   U1 Müzakere masası miktar penceresi: yalnız gerçek dokunuşla (klavye açılmadan) +100, +10, −10, MAKS, 25 hazır değeri → TASLAĞA EKLE; taşma yok.
   U2 Kaynak sözleşmesi formu: gönderilen miktar +100, sefer sıklığı +30, süre +12 adım düğmeleri (klavyesiz); rota önizlemesi; TEKLİF ET / VAZGEÇ görünür; taşma yok.
   U3 Teklif gerçek dokunuşla gönderilir → sözleşme (ya da açık ret nedeni); sözleşme varsa konvoy listesinden KONVOYU BUL ile haritada seçilir. */
const path=require('path'),fs=require('fs'),assert=require('assert/strict');
const {chromium}=require(require.resolve('playwright',{paths:[path.join(__dirname,'node_modules'),__dirname]}));
const root=path.resolve(process.env.STARS_ROOT||path.join(__dirname,'..')),out=path.resolve(process.env.STARS_OUTPUT||path.join(__dirname,'../reports/claude/evidence/ticaret-tamamlama0/browser-sp'));fs.mkdirSync(out,{recursive:true});
const Commerce_closed=st=>['cancelled','expired','blocked'].includes(st);
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
    if(!hit)throw Error('dokunma noktası başka öğede: '+sel);await page.touchscreen.tap(b.x+b.width/2,b.y+b.height/2);await page.waitForTimeout(200);};
  const closeAll=()=>page.evaluate(()=>{for(let i=0;i<6&&!document.getElementById('modal').classList.contains('hidden');i++){if(document.querySelector('#modal [data-a="advClose"]'))UI.act('advClose');else UI.closeModal();}UI.setSpeed(0);});
  const overflow=()=>page.evaluate(()=>{const m=document.querySelector('#modal .mbox'),r=m.getBoundingClientRect();
    const out=[...m.querySelectorAll('button,input,select')].filter(e=>{const b=e.getBoundingClientRect();return b.width>0&&(b.right>window.innerWidth+1||b.left<-1);}).map(e=>e.dataset.a||e.id);
    return {boxW:Math.round(r.width),vw:window.innerWidth,hScroll:m.scrollWidth>m.clientWidth+2||document.documentElement.scrollWidth>window.innerWidth+2,offscreen:out};});
  const kb=()=>page.evaluate(()=>{const a=document.activeElement;return !!(a&&/INPUT|TEXTAREA/.test(a.tagName));});
  await page.goto(url);await page.evaluate(()=>{try{localStorage.clear();}catch{}resetSetupNaming();leaveTitle('setup');Object.assign(CFG,{seed:22,size:'orta',aiCount:5,pirates:false});safeRenderSetup();startGame();});
  await page.waitForFunction(()=>typeof G!=='undefined'&&G.p&&!document.getElementById('game').classList.contains('hidden'),undefined,{timeout:60000});
  await page.waitForFunction(()=>!!document.querySelector('#modal [data-a="advClose"]'),undefined,{timeout:5000}).catch(()=>{});await closeAll();
  const fx=await page.evaluate(()=>{const E=G.p,O=G.emps.find(o=>o.ai&&!o.dead&&!o.wild);const h=G.sys[E.home];
    for(const [x,y] of [[E,O],[O,E]]){x.contact[y.id]=true;x.war[y.id]=false;x.rel[y.id]=80;(x.intel||={})[y.id]=3;(x.pact||={})[y.id]=true;}
    const hc=h.planets.find(p=>p.col&&p.owner===E.id).col;hc.b.liman=1;hc.pop=Math.max(hc.pop,120);E.res.min=3000;E.res.ene=3000;E.res.etk=3000;
    const n=h.lanes.map(i=>G.sys[i]).find(s=>s.owner<0&&s.planets.length&&!s.planets.some(p=>p.col));const pl=n.planets[0];pl.owner=O.id;pl.col=JSON.parse(JSON.stringify(hc));pl.col.e=O.id;pl.col.b={liman:1};pl.col.pop=120;pl.col.q=[];O.colonies.push({s:n.id,p:0});n.owner=O.id;
    for(const s of [h,n])for(const id of [E.id,O.id])if(!s.seen.includes(id))s.seen.push(id);O.res.min=10;O.inc={...(O.inc||{}),min:-6};O.res.ene=3000;
    updateVision();Commerce.state();return {O:O.id,port:n.id,home:h.id};});
  await test(view+' U1 miktar penceresi: yalnız dokunuşla +100 / +10 / −10 / MAKS / 25 → TASLAĞA EKLE; klavye yok, taşma yok',async()=>{
    await page.evaluate(o=>{UI.forgetDeal?.(o);UI.openDeal(o);UI.dealAmount(UI.deal,'give','res','min');},fx.O);
    const seq=[];const val=()=>page.evaluate(()=>+document.getElementById('dealAmountInput').value);
    await tap('#modal [data-a="amountUp100"]');seq.push(await val());await tap('#modal [data-a="amountUp"]');seq.push(await val());await tap('#modal [data-a="amountDown"]');seq.push(await val());
    await tap('#modal [data-a="amountMax"]');seq.push(await val());await tap('#modal [data-a="amountPreset"][data-x="25"]');seq.push(await val());
    const ov=await overflow(),keyboard=await kb();await page.screenshot({path:path.join(out,view+'-u1-miktar.png')});
    await tap('#modal [data-a="amountApply"]');const item=await page.evaluate(()=>UI.deal.give.find(i=>i.t==='res'&&i.r==='min'));
    assert.deepEqual(seq,[110,120,110,3000,25],'adımlar '+JSON.stringify(seq));assert.equal(keyboard,false,'klavye (odak) açılmadı');
    assert.equal(ov.hScroll,false,'yatay kaydırma yok '+JSON.stringify(ov));assert.deepEqual(ov.offscreen,[],'ekran dışı düğme yok');assert.equal(item&&item.v,25,'taslakta 25 mineral');
    await page.evaluate(()=>{UI.act('closeDiplo');});await closeAll();return {seq,ov};});
  let signed=false;
  await test(view+' U2 kaynak sözleşmesi formu: +100 miktar, +30 sıklık, +12 süre (klavyesiz); rota önizlemesi; TEKLİF ET / VAZGEÇ görünür, taşma yok',async()=>{
    await page.evaluate(o=>UI.act('commerceNew',o),fx.O);await page.waitForTimeout(300);
    const stepAfter=(id,label)=>`#modal #${id} ~ .qtySteps .qtyStep[aria-label="${label}"], #modal #${id} + .qtySteps .qtyStep[aria-label="${label}"]`;
    const g0=await page.evaluate(()=>[+cargoGiveN.value,+cargoEvery.value,+cargoMonths.value]);
    await tap(stepAfter('cargoGiveN','+100'));await tap(stepAfter('cargoEvery','+30'));await tap(stepAfter('cargoMonths','+12'));
    const g1=await page.evaluate(()=>[+cargoGiveN.value,+cargoEvery.value,+cargoMonths.value]);const reason=await page.evaluate(()=>document.getElementById('cargoReason').textContent);
    const ov=await overflow(),keyboard=await kb();
    const btns=await page.evaluate(()=>['commercePropose','commerce'].map(a=>{const b=document.querySelector('#modal [data-a="'+a+'"]');if(!b)return null;b.scrollIntoView({block:'nearest'});const r=b.getBoundingClientRect();return r.bottom<=window.innerHeight+1&&r.top>=-1&&r.width>0;}));
    await page.screenshot({path:path.join(out,view+'-u2-form.png')});
    assert.deepEqual(g1,[g0[0]+100,g0[1]+30,g0[2]+12],'adımlar '+JSON.stringify({g0,g1}));assert.equal(keyboard,false,'klavye yok');
    assert.ok(/Hat açık/.test(reason),'rota önizlemesi: '+reason);assert.deepEqual(btns,[true,true],'TEKLİF ET / VAZGEÇ erişilebilir');assert.equal(ov.hScroll,false,'yatay kaydırma yok '+JSON.stringify(ov));
    return {g0,g1,reason,ov};});
  await test(view+' U3 TEKLİF ET (dokunuş) → sözleşme ya da açık ret nedeni; sözleşmede konvoy listesinden KONVOYU BUL haritada seçer',async()=>{
    await tap('#modal [data-a="commercePropose"]');await page.waitForTimeout(300);
    const r=await page.evaluate(o=>({n:Commerce.state().contracts.filter(c=>[c.a,c.b].includes(o)&&!Commerce.closed(c)).length,reason:document.getElementById('cargoReason')?.textContent||''}),fx.O);
    signed=r.n>0;let located=null;
    if(signed){await page.evaluate(()=>{for(let i=0;i<20;i++){G.day+=1;dailyTick(1);}});await closeAll();await page.evaluate(()=>UI.act('commerceConvoys'));await page.waitForTimeout(300);
      await page.screenshot({path:path.join(out,view+'-u3-konvoylar.png')});
      if(await page.locator('#modal [data-a="commerceLocate"]').count()){await tap('#modal [data-a="commerceLocate"]');located=await page.evaluate(()=>({sel:CommerceUI.selected,modal:!document.getElementById('modal').classList.contains('hidden')}));}}
    assert.ok(signed||r.reason.length>3,'sözleşme ya da açık neden '+JSON.stringify(r));if(signed)assert.ok(located&&located.sel!==null&&!located.modal,'konvoy haritada seçildi '+JSON.stringify(located));
    await closeAll();return {...r,signed,located};});
  await test(view+' U4 sözleşme listesinden İPTAL (dokunuş) → yeni yükleme yok, yoldaki kargo çift teslim edilmez',async()=>{
    const st0=await page.evaluate(o=>{const c=Commerce.state().contracts.find(c=>!Commerce.closed(c)&&[c.a,c.b].includes(o));return c?{id:c.id,conv:Commerce.state().convoys.filter(v=>v.contract===c.id).length}:null;},fx.O);
    if(!st0)return {skip:'sözleşme yok (U3 imzalamadı)'};
    await closeAll();await page.evaluate(()=>UI.act('commerce'));await page.waitForTimeout(300);
    const sel='#modal [data-a="commerceCancel"][data-x="'+st0.id+'"]';await tap(sel);
    const r=await page.evaluate(id=>{const c=Commerce.state().contracts.find(c=>c.id===id);const conv0=Commerce.state().convoys.filter(v=>v.contract===id).length;
      const recv0=Commerce.state().convoys.filter(v=>v.contract===id&&v.status==='delivered').map(v=>v.id);for(let i=0;i<400;i++){G.day+=1;dailyTick(1);}
      const conv=Commerce.state().convoys.filter(v=>v.contract===id);return {contractStatus:c.status,conv0,conv1:conv.length,receipts:conv.filter(v=>v.status==='delivered').map(v=>[v.id,v.receipt])};},st0.id);
    await closeAll();
    assert.ok(Commerce_closed(r.contractStatus),'sözleşme kapandı '+r.contractStatus);assert.equal(r.conv1,r.conv0,'iptalden sonra yeni sefer yok '+JSON.stringify(r));
    assert.ok(r.receipts.every(([id,rc])=>id===rc),'her konvoy tek makbuz');return r;});
  await test(view+' U5 oyuncu AI\'ya müzakere masasından Transit İzni verir (dokunuş) → izin yalnız o devlet için, 360 gün',async()=>{
    await closeAll();await page.evaluate(o=>{UI.forgetDeal?.(o);UI.openDeal(o);},fx.O);await page.waitForTimeout(250);
    await tap('[data-a="dealAdd"][data-x="give:portTransit"]');await tap('[data-a="dealSend"]');await page.waitForTimeout(400);
    const r=await page.evaluate(o=>({until:G.p.portTransit?.[o],day:G.day,others:Object.keys(G.p.portTransit||{}).filter(k=>+k!==o).length}),fx.O);
    await page.screenshot({path:path.join(out,view+'-u5-transit.png')});await page.evaluate(()=>{try{UI.act('closeDiplo');}catch{}});await closeAll();
    assert.ok(r.until>r.day+300,'izin verildi '+JSON.stringify(r));assert.equal(r.others,0,'başka devlete izin yok');return r;});
  if(errors.length)results.push({name:view+' sayfa hataları',status:'INFO',errors:errors.slice(0,5)});await ctx.close();}
 }finally{await browser.close();srv.close();fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({root,results},null,1));console.log(`GEÇEN: ${pass} KALAN: ${fail}`);process.exitCode=fail?1:0;}
})();
