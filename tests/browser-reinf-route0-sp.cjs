'use strict';
/* REINF-ROUTE.0 — tek oyunculu gerçek Chromium (844×390, dokunmatik). STARS_ROOT=<kök> ile p39 aynı vakalar.
   S1 FİLO paneli → FİLO TAKVİYESİ (gerçek dokunuş, sınır geçişinden ÖNCE sipariş) → ana filo düşman sistemine geçer → üretim biter →
      GERÇEK oyun döngüsünde (UI.setSpeed) tersane çıkışı → hareket → ana filo gemi sayısı artar.
   S2 ana filo yok olur, ona giden sevkiyatlar → Haberler → Sevkiyatlar sekmesi (gerçek dokunuş) tek kart; oyun içi kayıt → sayfa yenilenir →
      OYUNA DEVAM ET → aynı kart, aynı toplam. */
const path=require('path'),fs=require('fs'),assert=require('assert/strict');
const {chromium}=require(require.resolve('playwright',{paths:[path.join(__dirname,'node_modules'),__dirname]}));
const root=path.resolve(process.env.STARS_ROOT||path.join(__dirname,'..')),out=path.resolve(process.env.STARS_OUTPUT||path.join(__dirname,'../reports/claude/evidence/reinf-route0/browser-sp'));fs.mkdirSync(out,{recursive:true});
const results=[];let pass=0,fail=0;
async function test(name,fn){try{const r=await fn();results.push({name,status:'PASS',...(r||{})});pass++;console.log('PASS '+name);}catch(e){results.push({name,status:'FAIL',error:String(e&&e.stack||e).slice(0,2000)});fail++;console.log('FAIL '+name+'\n'+(e&&e.stack||e));}}
(async()=>{
 const http=require('http'),srv=http.createServer((q,r)=>{const u=decodeURIComponent(new URL(q.url,'http://x').pathname),f=path.join(root,u==='/'?'index.html':u.replace(/^\/+/,''));if(!f.startsWith(root)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.writeHead(404);return r.end();}
   const t={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json','.css':'text/css','.webmanifest':'application/manifest+json'}[path.extname(f)]||'application/octet-stream';r.writeHead(200,{'Content-Type':t});fs.createReadStream(f).pipe(r);});
 await new Promise(r=>srv.listen(0,'127.0.0.1',r));const url='http://127.0.0.1:'+srv.address().port+'/';
 const browser=await chromium.launch({executablePath:process.env.STARS_CHROMIUM_PATH||undefined,args:['--no-sandbox','--disable-gpu']});
 try{const ctx=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true,deviceScaleFactor:1});const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  /* gerçek dokunma olayı: öğe yan panelde kaydırılır, merkezine touchscreen.tap (Playwright tap'in örtüşme beklemesi yan panel kaydırmasında takılıyor) */
  const tap=async sel=>{const l=page.locator(sel).first();await l.scrollIntoViewIfNeeded();const b=await l.boundingBox();if(!b)throw Error('görünmüyor: '+sel);
    const hit=await page.evaluate(([x,y,sel])=>{const el=document.elementFromPoint(x,y),t=document.querySelector(sel);return !!(el&&t&&(el===t||t.contains(el)));},[b.x+b.width/2,b.y+b.height/2,sel]);
    if(!hit)throw Error('dokunma noktası başka öğede: '+sel);await page.touchscreen.tap(b.x+b.width/2,b.y+b.height/2);await page.waitForTimeout(250);};
  const closeAll=()=>page.evaluate(()=>{for(let i=0;i<6&&!document.getElementById('modal').classList.contains('hidden');i++){if(document.querySelector('#modal [data-a="advClose"]'))UI.act('advClose');else UI.closeModal();}UI.setSpeed(0);});
  let fx;
  await test('S1 sipariş sınırdan önce (FİLO TAKVİYESİ dokunuşu), ana filo düşman sistemine geçer; gerçek oyun döngüsünde tersane çıkışı → hareket → ana filo büyür',async()=>{
   await page.goto(url);await page.evaluate(()=>{try{localStorage.clear();}catch{}resetSetupNaming();leaveTitle('setup');Object.assign(CFG,{seed:22,size:'orta',aiCount:5,pirates:false});startGame();});
   await page.waitForFunction(()=>typeof G!=='undefined'&&G.p&&!document.getElementById('game').classList.contains('hidden'),undefined,{timeout:60000});await closeAll();
   fx=await page.evaluate(()=>{const e=G.p,b=0;for(const k of ['min','ene','ala','etk'])e.res[k]=Math.max(e.res[k]||0,20000);AUTO_EVENT=false;
     const yard=G.sys.find(s=>s.owner===0&&yardCount(s)>0);
     for(const a of G.emps.filter(o=>o.ai&&!o.dead&&!o.wild&&!o.crisisSide)){e.ally[a.id]=a.ally[0]=false;if(e.nap)delete e.nap[a.id];if(a.nap)delete a.nap[0];if(a.peaceAt)delete a.peaceAt[0];
       if(!e.war[a.id]){warAuthorize(a,e,{n:'Test dış saldırı'});declareWar(a,e);warAuthClear();}
       for(const s of G.sys){if(s.owner!==a.id)continue;const raw=findPath(yard.id,s.id,e);if(!raw||!pathAllowed(e,{e:0,ships:[{c:'kor'}]},raw,yard.id))continue;
         G.fleets=G.fleets.filter(f=>!(f.e===a.id&&f.sys===s.id));if(!s.seen.includes(0))s.seen.push(0);G.vis.add(s.id);
         const F=newFleet(e,yard.id,[{c:'kor'},{c:'kor'},{c:'kor'},{c:'kor'},{c:'kor'},{c:'kor'}],'1. Taarruz Filosu');setFleetTemplate(e,F,{kor:7},false);
         return {fleet:F.id,yard:yard.id,target:s.id,path:raw.join('>')};}}
     return {err:'hedef yok'};});
   assert(!fx.err,JSON.stringify(fx));
   await page.evaluate(id=>{const f=G.fleets.find(f=>f.id===id);View.sel=f;UI.tab('filo');UI.refresh();},fx.fleet);await page.screenshot({path:path.join(out,'s1-filo-takviye.png')});
   await tap('[data-a="reinf"][data-x="'+fx.fleet+'"]');
   const q=await page.evaluate(id=>G.sys.reduce((n,s)=>n+(s.queue||[]).filter(q=>q.delivery&&q.delivery.fleet===id).length,0),fx.fleet);assert.equal(q,1,'sipariş kuyrukta');
   await page.evaluate(({id,t})=>{const F=G.fleets.find(f=>f.id===id);F.sys=t;F.path=[];F.mv=null;for(const s of G.sys)for(const q of s.queue||[])if(q.delivery&&q.delivery.fleet===id)q.left=0.5;},{id:fx.fleet,t:fx.target});
   /* gerçek oyun döngüsü */
   const seen={exit:false,moving:false};await page.evaluate(()=>UI.setSpeed(4));
   for(let i=0;i<120;i++){const r=await page.evaluate(id=>{const N=G.fleets.filter(f=>f.joinFleet===id&&f.ships.length);return {exit:N.length>0,moving:N.some(f=>f.path.length||f.mv),main:G.fleets.find(f=>f.id===id).ships.length,st:N.map(f=>shipmentStatus(f))[0]||null,day:G.day};},fx.fleet);
     if(r.exit)seen.exit=true;if(r.moving)seen.moving=true;seen.last=r;if(r.main>6)break;
     if(await page.evaluate(()=>!document.getElementById('modal').classList.contains('hidden')))await page.evaluate(()=>{UI.closeModal();UI.setSpeed(4);});
     await page.waitForTimeout(250);}
   await page.evaluate(()=>UI.setSpeed(0));await page.evaluate(id=>{View.sel=G.fleets.find(f=>f.id===id);UI.tab('filo');UI.refresh();},fx.fleet);await page.screenshot({path:path.join(out,'s1-katildi.png')});
   assert(seen.exit,'tersaneden çıktı');assert(seen.moving,'yola çıktı: '+JSON.stringify(seen.last));assert.equal(seen.last.main,7,'ana filo büyüdü: '+JSON.stringify(seen.last));
   return {fx,seen};});
  await test('S2 ana filo yok → Haberler → Sevkiyatlar tek kart (dokunuş); kayıt → yenile → OYUNA DEVAM ET → aynı kart ve toplam',async()=>{
   await closeAll();
   const g=await page.evaluate(({id,yard})=>{const e=G.p,F=G.fleets.find(f=>f.id===id);
     for(const [s,n] of [[yard,3],[yard,2]]){const x=newFleet(e,s,Array.from({length:n},()=>({c:'kor'})));x.shipment={fleet:id,safe:true,origin:yard,state:'ready',attempts:0,next:0};x.joinFleet=id;}
     const far=G.sys[G.sys[yard].lanes[0]];   /* ikinci bekleme sistemi: tersanenin komşusu */const x=newFleet(e,far.id,[{c:'kor'},{c:'muh'}]);x.shipment={fleet:id,safe:true,origin:yard,state:'ready',attempts:0,next:0};x.joinFleet=id;
     fleetLost(F,'combat');F.ships=[];G.fleets=G.fleets.filter(f=>f!==F);return {ships:7};},{id:fx.fleet,yard:fx.yard});
   await page.evaluate(()=>UI.act('news'));await tap('.archiveTabs [data-a="shipmentsNews"]');
   const card=()=>page.evaluate(()=>{const c=[...document.querySelectorAll('#archiveShip .shipLostCard')];return {n:c.length,head:c.map(x=>x.querySelector('summary b').textContent),at:c.map(x=>[...x.querySelectorAll('.shipLostAt')].map(a=>a.textContent.split(' · ')[0]))};});
   const c0=await card();await page.evaluate(()=>{const d=document.querySelector('#archiveShip .shipLostCard');if(d)d.open=true;});await page.screenshot({path:path.join(out,'s2-sevkiyatlar-kart.png')});
   assert.equal(c0.n,1,'tek kart');assert.equal(c0.head[0],'Filo #'+fx.fleet+' · Hedef kayıp · '+g.ships+' takviye gemisi');
   const sv=await page.evaluate(async()=>{UI.closeModal();return await saveGame();});assert.equal(sv,true,'oyun içi kayıt');
   await page.reload();await page.waitForFunction(()=>typeof G!=='undefined'&&document.querySelector('#title [data-a="tCont"]'),undefined,{timeout:60000});
   await tap('#title [data-a="tCont"]');await page.waitForFunction(()=>G.p&&!document.getElementById('game').classList.contains('hidden'),undefined,{timeout:60000});await closeAll();
   await page.evaluate(()=>UI.act('news'));await tap('.archiveTabs [data-a="shipmentsNews"]');const c1=await card();await page.screenshot({path:path.join(out,'s2-devam-kart.png')});
   assert.deepEqual(c1,c0,'kayıt / devam sonrası aynı kart');return {c0,c1};});
  if(errors.length)console.log('pageerror: '+errors.slice(0,5).join(' | '));
 }finally{await browser.close();srv.close();}
 fs.writeFileSync(path.join(out,'browser-reinf-route0-sp.json'),JSON.stringify({root,results},null,1));
 console.log(`GEÇEN: ${pass} KALAN: ${fail}`);process.exitCode=fail?1:0;
})();
