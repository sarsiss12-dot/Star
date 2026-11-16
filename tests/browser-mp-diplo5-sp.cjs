'use strict';
/* MP-DIPLO5 — tek oyunculu gerçek Chromium (PWA dosyaları, yerel sunucu), gerçek düğmeler.
   B1 masaüstü 1280×800 (fare) ve B2 yatay telefon 844×390 (dokunma): İLİŞKİ sayfası HIZLI ANTLAŞMA — Saldırmazlık tek tıkla; sonuç aynı satırda;
      çift dokunuş tek anlaşma; Geçiş Ver yönü (senin sınırın ona); savaşta satır gerekçeli pasif; Şartlı Teklif… masayı açar
   B3 (844×390) müzakere masası: Lüks mal satırı açılan bonusu yazar (NF-2b), Casusluk Ağı İKİ YÖNLÜ satırı (NF-3), Barıştırma seçimi yalnız
      bilinen savaşı Cephe # ile listeler ve satır onay yolunu yazar (NF-6); kabulden sonra Lüks mal ağın "erişim hakkı" kanalını gösterir */
const path=require('path'),fs=require('fs'),assert=require('assert/strict');
const {chromium}=require(require.resolve('playwright',{paths:[path.join(__dirname,'node_modules'),__dirname]}));
const root=path.resolve(process.env.STARS_ROOT||path.join(__dirname,'..')),out=path.resolve(process.env.STARS_OUTPUT||path.join(__dirname,'../reports/claude/evidence/mp-diplo5/browser-sp'));fs.mkdirSync(out,{recursive:true});
const results=[];let pass=0,fail=0;
async function test(name,fn){try{const r=await fn();results.push({name,status:'PASS',...(r||{})});pass++;console.log('PASS '+name);}catch(e){results.push({name,status:'FAIL',error:String(e&&e.stack||e).slice(0,2000)});fail++;console.log('FAIL '+name+'\n'+(e&&e.stack||e));}}
(async()=>{
 const http=require('http'),srv=http.createServer((q,r)=>{const u=decodeURIComponent(new URL(q.url,'http://x').pathname),f=path.join(root,u==='/'?'index.html':u.replace(/^\/+/,''));if(!f.startsWith(root)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.writeHead(404);r.end();return;}
   const t={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json','.css':'text/css','.webmanifest':'application/manifest+json'}[path.extname(f)]||'application/octet-stream';r.writeHead(200,{'Content-Type':t});fs.createReadStream(f).pipe(r);});
 await new Promise(r=>srv.listen(0,'127.0.0.1',r));const url='http://127.0.0.1:'+srv.address().port+'/';
 const browser=await chromium.launch({executablePath:process.env.STARS_CHROMIUM_PATH||undefined,args:['--no-sandbox','--disable-gpu']});
 const boot=async(vp,touch)=>{const ctx=await browser.newContext({viewport:vp,isMobile:!!touch,hasTouch:!!touch,deviceScaleFactor:1});const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(url);await page.evaluate(()=>{try{localStorage.clear();}catch{}resetSetupNaming();leaveTitle('setup');Object.assign(CFG,{seed:22,size:'orta',aiCount:5,pirates:false});startGame();});
   await page.waitForFunction(()=>typeof G!=='undefined'&&G.p&&!document.getElementById('game').classList.contains('hidden'),undefined,{timeout:60000});
   await page.waitForTimeout(600);await page.evaluate(()=>{for(let i=0;i<6&&!document.getElementById('modal').classList.contains('hidden');i++){if(document.querySelector('#modal [data-a="advNever"]'))UI.act('advNever');else if(document.querySelector('#modal [data-a="advClose"]'))UI.act('advClose');else UI.closeModal();}UI.setSpeed(0);
     for(const o of G.emps)if(!o.wild){for(const q of G.emps)if(q!==o&&!q.wild){o.contact[q.id]=true;o.rel[q.id]=90;o.war[q.id]=false;o.ally[q.id]=false;if(o.nap)delete o.nap[q.id];if(o.pact)o.pact[q.id]=false;if(o.passage)delete o.passage[q.id];}if(isPurifier(o)){o.mizac='militarist';delete o._pers;}}
     G.p.res.etk=G.p.res.min=G.p.res.ene=5000;window.__o=G.emps.find(o=>o.ai&&!o.wild&&!o.dead);window.__deals=0;const ex=executeDeal;executeDeal=function(...a){const r=ex.apply(this,a);if(r)window.__deals++;return r;};});
   const tap=async sel=>{const l=page.locator(sel).first();await l.scrollIntoViewIfNeeded();if(touch)await l.tap();else await l.click();await page.waitForTimeout(150);};
   return {ctx,page,errors,tap};};
 const closeAll=page=>page.evaluate(()=>{const seen=[];for(let i=0;i<8&&!document.getElementById('modal').classList.contains('hidden');i++){seen.push(document.getElementById('modal').innerText.slice(0,60));if(document.querySelector('#modal [data-a="advNever"]'))UI.act('advNever');else if(document.querySelector('#modal [data-a="advClose"]'))UI.act('advClose');else UI.closeModal();}return seen;});
 const relation=async page=>{await closeAll(page);await page.evaluate(()=>UI.selectDiplo(__o.id,'relation'));await page.waitForSelector('.quickTreaty[data-kind="nap"]');const s=await closeAll(page);if(s.length)console.log('  (kapatılan pencere: '+JSON.stringify(s)+')');};
 const quick=async(vp,touch,tag)=>{const {ctx,page,errors,tap}=await boot(vp,touch);try{
   await relation(page);await page.locator('.quickTreaty[data-kind="nap"]').first().scrollIntoViewIfNeeded();await page.waitForTimeout(500);await page.screenshot({path:path.join(out,tag+'-satir.png')});
   const btn=`.quickTreaty[data-kind="nap"] [data-a="quickTreaty"]`;const l=page.locator(btn).first();await l.scrollIntoViewIfNeeded();
   if(touch){await l.tap();await l.tap({force:true,timeout:1500}).catch(()=>{});}else{await l.click();await l.click({force:true,timeout:1500}).catch(()=>{});}   /* çift dokunuş */
   await page.waitForSelector('.quickTreaty[data-kind="nap"] .quickTreatyState');const s1=await page.evaluate(()=>({st:document.querySelector('.quickTreaty[data-kind="nap"] .quickTreatyState').dataset.state,txt:document.querySelector('.quickTreaty[data-kind="nap"] .quickTreatyState').textContent,deals:__deals,nap:!!(G.p.nap&&G.p.nap[__o.id]>G.day)}));
   assert(['accepted','rejected','countered'].includes(s1.st),JSON.stringify(s1));assert(s1.deals<=1,'çift dokunuş tek anlaşma: '+s1.deals);if(s1.st==='accepted')assert.equal(s1.nap,true);
   await page.evaluate(()=>{window.__a0=aiRespond;aiRespond=(ai,o)=>ai===__o?{v:'kabul'}:__a0(ai,o);});await relation(page);await tap('.quickTreaty[data-kind="passGive"] [data-a="quickTreaty"]');
   const s2=await page.evaluate(()=>({mine:!!(G.p.passage||{})[__o.id],theirs:!!(__o.passage||{})[0],st:document.querySelector('.quickTreaty[data-kind="passGive"] .quickTreatyState')?.dataset.state}));assert.deepEqual(s2,{mine:true,theirs:false,st:'accepted'});
   await page.evaluate(()=>{aiRespond=__a0;const t=G.emps.find(o=>o.ai&&!o.wild&&!o.dead&&o!==__o);G.p.war[t.id]=t.war[0]=true;window.__t=t;UI.selectDiplo(t.id,'relation');});await page.waitForSelector('.quickTreaty[data-kind="nap"]');await closeAll(page);
   const s3=await page.evaluate(()=>({dis:document.querySelector('.quickTreaty[data-kind="nap"] [data-a="quickTreaty"]').disabled,why:(document.querySelector('.quickTreaty[data-kind="nap"] .quickTreatyWhy')||{}).textContent||''}));
   assert.equal(s3.dis,true);assert.match(s3.why,/[Ss]avaş/);await page.locator('.quickTreaty[data-kind="nap"]').first().scrollIntoViewIfNeeded();await page.waitForTimeout(500);await page.screenshot({path:path.join(out,tag+'-savas-kilit.png')});
   await page.evaluate(()=>{G.p.war[__t.id]=__t.war[0]=false;UI.selectDiplo(__o.id,'relation');});await page.waitForSelector('.quickTreaty[data-kind="passWant"]');await closeAll(page);await tap('.quickTreaty[data-kind="passWant"] [data-a="quickTreatyCond"]');
   const s4=await page.evaluate(()=>({page:UI.diploPage,want:UI.deal&&UI.deal.want}));assert.equal(s4.page,'deal');assert.deepEqual(s4.want,[{t:'passage'}]);
   assert.deepEqual(errors,[],errors.join('\n'));return {s1,s2,s3,s4};}finally{await ctx.close();}};
 try{
  await test('B1 masaüstü 1280×800: HIZLI ANTLAŞMA gerçek tıklama',()=>quick({width:1280,height:800},false,'b1'));
  await test('B2 yatay telefon 844×390: HIZLI ANTLAŞMA gerçek dokunma',()=>quick({width:844,height:390},true,'b2'));
  await test('B3 masa: Lüks mal bonusu, Casusluk Ağı yönü, Barıştırma bilinen savaş + Cephe #',async()=>{const {ctx,page,errors,tap}=await boot({width:844,height:390},true);try{
    const fx=await page.evaluate(()=>{for(const e of G.emps)if(!e.wild)for(const c of e.colonies){const p=G.sys[c.s].planets[c.p];if(p.lux==='ipek')p.lux=null;}const pl=G.sys[__o.colonies[0].s].planets[__o.colonies[0].p];pl.lux='ipek';refreshLuxury(__o);
      ensureIntel(G.p)[__o.id]=3;const t=G.emps.find(o=>o.ai&&!o.wild&&!o.dead&&o!==__o);G._dealAuth=true;declareWar(__o,t);G._dealAuth=false;window.__t=t;
      UI.dealOpenWith(__o.id,[]);UI.deal.want=[{t:'lux',k:'ipek'}];UI.deal.give=[{t:'spynet'}];UI.drawDeal();return {t:t.id,tn:t.name,front:peaceWithFront(__o,t)};});
    await page.waitForSelector('.dealAssetRow[data-kind="lux"]');const rows=await page.evaluate(()=>({lux:document.querySelector('.dealAssetRow[data-kind="lux"]').textContent,spy:document.querySelector('.dealIntelRow[data-kind="spynet"]').textContent}));
    assert.match(rows.lux,/bonusu açılır/);assert.match(rows.lux,/mineral/);assert.match(rows.spy,/İKİ YÖNLÜ/);await page.screenshot({path:path.join(out,'b3-masa.png')});
    await tap('[data-a="dealAdd"][data-x="want:peaceWith"]');await page.waitForSelector('#modal .pickRow, #modal button[data-i], #modal [data-a="pick"]',{timeout:5000}).catch(()=>{});
    const pick=await page.evaluate(()=>document.getElementById('modal').innerText);assert.match(pick,new RegExp(fx.tn.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+' ile savaş · Cephe #'+fx.front),pick.slice(0,400));await page.screenshot({path:path.join(out,'b3-baristirma-secim.png')});
    const opt=page.locator('#modal').getByText(fx.tn+' ile savaş',{exact:false}).first();await opt.tap();await page.waitForTimeout(200);
    const pw=await page.evaluate(()=>({item:UI.deal.want.find(i=>i.t==='peaceWith'),row:(document.querySelector('.peaceWithRow')||{}).textContent||''}));
    assert.deepEqual(pw.item,{t:'peaceWith',target:fx.t,front:fx.front});assert.match(pw.row,/aracı Sen/);assert.match(pw.row,/Cephe #/);
    await page.evaluate(()=>{const o={from:0,to:__o.id,give:[{t:'res',r:'min',v:50}],want:[{t:'lux',k:'ipek'}],born:G.day,expires:G.day+300};window.__a0=aiRespond;aiRespond=()=>({v:'kabul'});executeDeal(o);aiRespond=__a0;UI.selectDiplo(null,'states');});
    const net=await page.evaluate(()=>UI.diploDirectory());assert.match(net,/erişim hakkı/);
    assert.deepEqual(errors,[],errors.join('\n'));return {rows,pw};}finally{await ctx.close();}});
 }finally{await browser.close();srv.close();fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,1));console.log(`GEÇEN: ${pass} KALAN: ${fail}`);process.exitCode=fail?1:0;}
})();
