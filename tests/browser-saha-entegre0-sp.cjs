'use strict';
/* SAHA-ENTEGRE.0 — tek oyunculu gerçek Chromium (844×390, dokunmatik). STARS_ROOT=<kök> ile p47 aynı vakalar.
   S1 FİLO paneli → FİLO TAKVİYESİ (gerçek dokunuş, sınır geçişinden ÖNCE sipariş) → ana filo düşman sistemine geçer → üretim biter →
      GERÇEK oyun döngüsünde (UI.setSpeed) tersane çıkışı → hareket → ana filo gemi sayısı artar.
   S2 ana filo yok olur, ona giden sevkiyatlar → Haberler → Sevkiyatlar sekmesi (gerçek dokunuş) tek kart; oyun içi kayıt → sayfa yenilenir →
      OYUNA DEVAM ET → aynı kart, aynı toplam. */
const path=require('path'),fs=require('fs'),assert=require('assert/strict');
const {chromium}=require(require.resolve('playwright',{paths:[path.join(__dirname,'node_modules'),__dirname]}));
const root=path.resolve(process.env.STARS_ROOT||path.join(__dirname,'..')),out=path.resolve(process.env.STARS_OUTPUT||path.join(__dirname,'../reports/claude/evidence/saha-entegre0/browser-sp'));fs.mkdirSync(out,{recursive:true});
const results=[];let pass=0,fail=0;
async function test(name,fn){try{const r=await fn();results.push({name,status:'PASS',...(r||{})});pass++;console.log('PASS '+name);}catch(e){results.push({name,status:'FAIL',error:String(e&&e.stack||e).slice(0,2000)});fail++;console.log('FAIL '+name+'\n'+(e&&e.stack||e));}}
(async()=>{
 const http=require('http'),srv=http.createServer((q,r)=>{const u=decodeURIComponent(new URL(q.url,'http://x').pathname),f=path.join(root,u==='/'?'index.html':u.replace(/^\/+/,''));if(!f.startsWith(root)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.writeHead(404);return r.end();}
   const t={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json','.css':'text/css','.webmanifest':'application/manifest+json'}[path.extname(f)]||'application/octet-stream';r.writeHead(200,{'Content-Type':t});fs.createReadStream(f).pipe(r);});
 await new Promise(r=>srv.listen(0,'127.0.0.1',r));const url='http://127.0.0.1:'+srv.address().port+'/';
 const browser=await chromium.launch({executablePath:process.env.STARS_CHROMIUM_PATH||undefined,args:['--no-sandbox','--disable-gpu']});
 try{const ctx=await browser.newContext({viewport:{width:+(process.env.SP_VIEW||'844x390').split('x')[0],height:+(process.env.SP_VIEW||'844x390').split('x')[1]},isMobile:true,hasTouch:true,deviceScaleFactor:1});const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  /* gerçek dokunma olayı: öğe yan panelde kaydırılır, merkezine touchscreen.tap (Playwright tap'in örtüşme beklemesi yan panel kaydırmasında takılıyor) */
  const tap=async sel=>{const l=page.locator(sel).first();await l.scrollIntoViewIfNeeded();const b=await l.boundingBox();if(!b)throw Error('görünmüyor: '+sel);
    const hit=await page.evaluate(([x,y,sel])=>{const el=document.elementFromPoint(x,y),t=document.querySelector(sel);return !!(el&&t&&(el===t||t.contains(el)));},[b.x+b.width/2,b.y+b.height/2,sel]);
    if(!hit)throw Error('dokunma noktası başka öğede: '+sel);await page.touchscreen.tap(b.x+b.width/2,b.y+b.height/2);await page.waitForTimeout(250);};
  const closeAll=()=>page.evaluate(()=>{for(let i=0;i<6&&!document.getElementById('modal').classList.contains('hidden');i++){if(document.querySelector('#modal [data-a="advClose"]'))UI.act('advClose');else UI.closeModal();}UI.setSpeed(0);});

  await test('S1 kurulum: BİLİM ANOMALİLERİ → Kapalı (gerçek dokunuş); oyunda normal anomali yok',async()=>{
   await page.goto(url);await page.evaluate(()=>{try{localStorage.clear();}catch{}resetSetupNaming();leaveTitle('setup');Object.assign(CFG,{seed:22,size:'orta',aiCount:5,pirates:false});safeRenderSetup();});
   await tap('#setup [data-a="step"][data-x="galaksi"]');const found=await page.evaluate(()=>!!document.querySelector('#setup [data-a="anomRate"]'));
   assert(found,'kurulum ekranında anomali satırı');await tap('#setup [data-a="anomRate"][data-x="kapali"]');
   const lv=await page.evaluate(()=>CFG.anomalies);await page.screenshot({path:path.join(out,'s1-kurulum-anomali.png')});assert.equal(lv,'kapali');
   await page.evaluate(()=>startGame());await page.waitForFunction(()=>typeof G!=='undefined'&&G.p&&!document.getElementById('game').classList.contains('hidden'),undefined,{timeout:60000});
   /* ilk turda DANIŞMAN 420 ms sonra açılır (main.js FAZ 18): açılmasını bekle, sonra kapat — yoksa sonraki harita dokunuşları onun satırına düşer */
   await page.waitForFunction(()=>!!document.querySelector('#modal [data-a="advClose"]'),undefined,{timeout:5000}).catch(()=>{});await closeAll();
   const n=await page.evaluate(()=>({anom:G.sys.filter(s=>s.anom&&!G.emps.some(e=>e.home===s.id&&e.origin==='kalinti')).length,cfg:G.cfg.anomalies}));
   assert.equal(n.cfg,'kapali');assert.equal(n.anom,0);return n;});
  await test('S2 Fetih HARİTADAN HEDEF SEÇ: 7 sistem gerçek harita dokunuşu → TAMAM → önizlemede talep bedeli',async()=>{
   const fx=await page.evaluate(()=>{const E=G.p,O=G.emps.find(o=>o.ai&&!o.dead&&!o.wild);E.contact[O.id]=O.contact[E.id]=true;E.res.etk=5000;
     for(const s of G.sys.filter(s=>s.owner<0&&!s.planets.some(p=>p.col)).slice(0,9)){territoryOwnerSet(s,O.id);if(!s.seen.includes(0))s.seen.push(0);}
     UI.warGoalPick(O.id,'fetih');UI._wgSel.targets=[];UI.warGoalPick(O.id,'fetih');return {O:O.id,c:warFetihCandidates(E,O,{capital:true}).map(x=>x.id)};});
   await tap('[data-a="wgMap"]');
   for(const id of fx.c.slice(0,7)){await page.evaluate(id=>{const s=G.sys[id];View.cam.x=s.x;View.cam.y=s.y;},id);await page.waitForTimeout(120);
     const pt=await page.evaluate(id=>{const s=G.sys[id],p=View.w2s(s.x,s.y),r=document.getElementById('map').getBoundingClientRect();return {x:r.left+p.x,y:r.top+p.y};},id);await page.touchscreen.tap(pt.x,pt.y);await page.waitForTimeout(200);}
   const picked=await page.evaluate(()=>View.claimPick&&View.claimPick.targets.length);await page.screenshot({path:path.join(out,'s2-harita-secim.png')});
   await tap('#claimBar [data-a="claimDone"]');await tap('.mbox.wgPick [data-a="wgGo"]');await page.waitForTimeout(400);
   const html=await page.evaluate(()=>document.getElementById('modal').innerHTML);await page.screenshot({path:path.join(out,'s2-onizleme.png')});
   assert.ok(picked>=7,'seçilen '+picked);assert.ok(/Talep bedeli/.test(html),'önizlemede talep bedeli');await closeAll();return {picked};});
  await test('S3 TÜMÜNÜ KENARA AL (gerçek dokunuş): olay kararları gizlenir, kaynak değişmez, ☰ listesinde',async()=>{
   const pre=await page.evaluate(()=>{AUTO_EVENT=false;const evs=EVENTS.filter(e=>e.ch&&e.ch.length>1&&!e.chain);UI.event(evs[0]);UI.closeModal();UI.event(evs[1]);UI.closeModal();UI.drawInbox();return {res:JSON.stringify(G.p.res),n:evs[0].n};});
   await tap('#inbox [data-a="noteStashAll"]');
   const r=await page.evaluate(()=>({vis:(G.inbox||[]).filter(n=>!n.hidden).length,res:JSON.stringify(G.p.res)}));const list=await page.evaluate(()=>{UI.act('topStatus');const t=document.getElementById('modal').innerText;UI.closeModal();return t;});
   assert.equal(r.vis,0);assert.equal(r.res,pre.res,'ödül / karar yok');assert.ok(list.includes(pre.n),'☰ listesinde');});
  if(errors.length)console.log('pageerror: '+errors.slice(0,5).join(' | '));
 }finally{await browser.close();srv.close();}
 fs.writeFileSync(path.join(out,'browser-saha-entegre0-sp.json'),JSON.stringify({root,results},null,1));
 console.log(`GEÇEN: ${pass} KALAN: ${fail}`);process.exitCode=fail?1:0;
})();
