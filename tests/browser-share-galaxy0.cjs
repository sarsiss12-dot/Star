'use strict';
/* BETA-GALAXY.0 — barış sonrası toprak paylaşımına erişim, gerçek Chromium + gerçek düğmeler (tek oyuncu, 800×360 dokunma).
   FİKSTÜR (açıkça): gerçek kayıt tests/fixtures/stars-2210-06.sav.json; faz92c fikstürüyle aynı kurgu: oyuncu P(0) ve müttefik
   M(3) T(2)'ye karşı tek seferde; dört boş sistemin ikisinde T kolonisi; 0–1 P, 2–3 M tarafından captureSystem ile ele geçirilir.
   Akış: (1) P–T barışı, M–T cephesi açık → Savaş Merkezi ayrıntısında somut gerekçe, Diplomasi'de kısayol yok;
   (2) M–T barışı (son cephe kapanır) → Savaş Merkezi → Geçmiş → Ayrıntı ve Diplomasi Merkezi kısayolu AYNI seferi açar;
   (3) taslakta koloni/boş sistem, mevcut sahip, fetih hedefi, önerilen alıcı; P'nin fethettiği koloninin alıcısı M yapılır; sun;
   (4) kaydet → yükle; teklif durumu korunur; (5) Uygula (ayrı adım) → koloni P'den M'ye geçer (fetheden ≠ yeni sahip);
   (6) ikinci uygulama yapılamaz; (7) tek galip seferi ve eksik (legacy) kayıt için gerekçe. Yetkili misafir: mp63_settle_test (Node). */
const assert=require('node:assert/strict'),{createServer}=require('node:http'),{readFile}=require('node:fs'),fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
const root=path.resolve(process.env.STARS_ROOT||path.join(__dirname,'..')),out=process.env.STARS_OUTPUT||'/tmp/stars-share-galaxy0';fs.mkdirSync(out,{recursive:true});
const server=createServer((req,res)=>{const p=new URL(req.url,'http://localhost').pathname,file=path.resolve(root,'.'+(p==='/'?'/index.html':p));if(!file.startsWith(root+path.sep))return res.writeHead(403).end();
  readFile(file,(e,d)=>{if(e)return res.writeHead(404).end();res.setHeader('Content-Type',{'.js':'text/javascript','.html':'text/html'}[path.extname(file)]||'application/json');res.end(d);});});
let pass=0,fail=0;const rows=[];
async function test(name,fn){try{const r=await fn();rows.push({name,status:'PASS',...(r||{})});pass++;console.log('PASS '+name);}catch(e){rows.push({name,status:'FAIL',error:String(e&&e.stack||e)});fail++;console.log('FAIL '+name+'\n'+(e&&e.stack||e));}}
async function run(){
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const browser=await chromium.launch({executablePath:process.env.STARS_CHROMIUM_PATH,args:['--no-sandbox','--disable-dev-shm-usage']});
  const ctx=await browser.newContext({viewport:{width:800,height:360},isMobile:true,hasTouch:true});const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  const tap=async sel=>{const l=page.locator(sel).first();await l.waitFor({state:'attached',timeout:8000});await l.scrollIntoViewIfNeeded().catch(()=>{});await l.tap();};
  try{
    await page.goto('http://127.0.0.1:'+server.address().port);
    const fx=await page.evaluate(async()=>{const t=await (await fetch('/tests/fixtures/stars-2210-06.sav.json')).text();if(!deserialize(t))throw Error('fixture');
      $('title').classList.add('hidden');enterGame(true);LOOP.on=false;UI.closeModal();
      G.warLedger=warLedgerEmpty();G.settlements=settlementEmpty();G.feds=[];G.council=null;G.fleets=G.fleets.filter(f=>f.e!==0&&f.e!==2&&f.e!==3);
      for(const e of G.emps){e.war={};e.ally={};e.civics=[];e.mizac='yayilmaci';e._pers='yayilmaci';e.overlord=null;e.dead=false;e.wg={};e.res.etk=1000;for(const o of G.emps)e.contact[o.id]=true;}
      for(const s of G.sys){s.seen=G.emps.map(e=>e.id);s.surv=G.emps.map(e=>e.id);}
      window.P=G.p;window.T=G.emps[2];window.M=G.emps[3];
      window.land=G.sys.filter(s=>!s.planets.some(p=>p.col)&&s.planets.length>=2).slice(0,4);
      const template=JSON.parse(JSON.stringify(G.sys[P.colonies[0].s].planets[P.colonies[0].p].col));
      declareWar(P,T);executeDeal({from:3,to:0,give:[{t:'warOn',target:2}],want:[]});
      for(const i of [0,2]){const s=land[i],p=s.planets[0];p.col=JSON.parse(JSON.stringify(template));p.owner=2;T.colonies.push({s:s.id,p:p.i});}
      land.forEach((s,i)=>{s.owner=2;captureSystem(s,i<2?0:3);});
      window.campaign=warLedgerFind(0,2).campaign;UI.setSpeed(0);
      return {campaign,land:land.map(s=>({id:s.id,owner:s.owner,col:s.planets[0].col?s.planets[0].owner:null})),fronts:G.warLedger.fronts.map(f=>({id:f.id,sides:f.sides,ended:f.ended}))};});
    const openWarDetail=async(tab='past')=>{await page.evaluate(()=>{UI.closeModal();WarCenterUI.open();});await tap(`[data-a="warCenterTab"][data-x="${tab}"]`);
      const front=await page.evaluate(c=>G.warLedger.fronts.find(f=>f.campaign===c&&f.sides.includes(0)).id,fx.campaign);
      await tap(`[data-a="warCenterDetail"][data-x="${front}"]`);await page.waitForSelector('#warCenterRoot',{state:'attached',timeout:8000});await page.waitForTimeout(300);};
    await test('1 cepheler açıkken (P–T ve M–T sürüyor): Savaş Merkezi → Benim Savaşlarım → Ayrıntı somut gerekçe verir, düğme yok; Diplomasi Merkezi kısayolu yok; P–T barışı M–T cephesini de kapatır mı kaydedilir',async()=>{
      await openWarDetail('mine');const why=await page.locator('#shareWhy').innerText({timeout:5000});const btn=await page.locator('#warCenterRoot [data-a="shareOpen"]').count();
      await page.screenshot({path:path.join(out,'1-acik-cephe-gerekce.png')});
      const dip=await page.evaluate(c=>{UI.closeModal();return UI.settlementAgenda().includes('data-x="'+c+'"');},fx.campaign);
      const fronts=await page.evaluate(()=>{makePeace(P,T);UI.setSpeed(0);return G.warLedger.fronts.map(f=>({sides:f.sides,ended:f.ended!==null}));});
      assert.match(why,/bütün cepheler kapanmalı/);assert.equal(btn,0);assert.equal(dip,false);return {why,fixture:fx,afterPT:fronts};});
    await test('2 son cephe kapanır: Savaş Merkezi ayrıntısı ve Diplomasi Merkezi kısayolu AYNI seferi ve taslağı açar; taslakta koloni/boş sistem, mevcut sahip, fetih hedefi, önerilen alıcı',async()=>{
      await page.evaluate(()=>{if(M.war[2]||T.war[3])makePeace(M,T);UI.setSpeed(0);});await openWarDetail();
      const ready=await page.locator('#shareReady').innerText();await page.screenshot({path:path.join(out,'2-savas-merkezi-hazir.png')});
      await tap('#warCenterRoot [data-a="shareOpen"]');await page.waitForSelector('#modal [data-share-recipient]',{state:'attached'});
      const a=await page.evaluate(()=>({head:$('modal').querySelector('.mhd').innerText,facts:[...$('modal').querySelectorAll('.shareFacts')].map(e=>e.innerText),rows:[...$('modal').querySelectorAll('.lrow b')].map(e=>e.innerText),kinds:[...$('modal').querySelectorAll('.lrow .mini')].map(e=>e.innerText).filter(t=>/Koloni|Boş sistem/.test(t))}));
      await page.screenshot({path:path.join(out,'2-taslak.png')});
      await page.evaluate(()=>{UI.closeModal();UI.diploPage='states';UI.openDiplo();});await page.waitForTimeout(400);
      await tap(`[data-a="shareOpen"][data-x="${fx.campaign}"]`);await page.waitForSelector('#modal [data-share-recipient]',{state:'attached'});
      const b=await page.evaluate(()=>({facts:[...$('modal').querySelectorAll('.shareFacts')].map(e=>e.innerText),rows:[...$('modal').querySelectorAll('.lrow b')].map(e=>e.innerText)}));
      assert.match(ready,/2 koloni · 2 boş sistem/);assert.deepEqual(b.rows,a.rows,'iki giriş aynı sefer satırları');assert.deepEqual(b.facts,a.facts);
      assert.ok(a.facts.length===4&&a.facts.every(t=>/Mevcut sahip:.*fetih hedefi.*önerilen alıcı:/.test(t)),JSON.stringify(a.facts));assert.ok(a.kinds.some(t=>/Koloni/.test(t))&&a.kinds.some(t=>/Boş sistem/.test(t)));
      return {ready,a};});
    let target=null;
    await test('3 P\'nin fethettiği koloninin alıcısı M seçilir (gerçek seçim kutusu) ve taslak sunulur; ortak onayıyla teklif onaylanır',async()=>{
      target=await page.evaluate(()=>{const s=land[0],p=s.planets[0];return {sys:s.id,planet:p.i,owner:p.owner};});
      const idx=await page.evaluate(t=>{const q=settlementPreview(G.p,campaign);return q.rows.findIndex(r=>r.sys===t.sys&&r.planet===t.planet);},target);
      assert.ok(idx>=0);await page.locator(`#modal select[data-share-recipient="${idx}"]`).selectOption('3');await page.waitForTimeout(300);
      const to=await page.evaluate(i=>$('modal').querySelectorAll('select[data-share-recipient]')[i].value,idx);assert.equal(to,'3');
      await tap('#modal [data-a="shareSend"]');await page.waitForTimeout(500);
      let o=await page.evaluate(()=>{const o=G.settlements.offers.slice(-1)[0];return o&&{id:o.id,state:o.state,rows:o.rows.map(r=>[r.sys,r.planet,r.from,r.to])};});
      if(o&&o.state==='pending'){await page.evaluate(id=>{settlementVote(M,id,true);},o.id);o=await page.evaluate(()=>{const o=G.settlements.offers.slice(-1)[0];return {id:o.id,state:o.state,rows:o.rows.map(r=>[r.sys,r.planet,r.from,r.to])};});}
      assert.equal(o.state,'approved');assert.ok(o.rows.some(r=>r[0]===target.sys&&r[1]===target.planet&&r[2]===0&&r[3]===3),JSON.stringify(o.rows));
      assert.equal(target.owner,0,'koloniyi P fethetti');return {offer:o,target};});
    await test('4 kaydet → yükle: onaylı teklif ve Savaş Merkezi durumu korunur',async()=>{
      await page.evaluate(()=>{const t=serialize();UI.closeModal();deserialize(t);enterGame(true);LOOP.on=false;UI.closeModal();UI.setSpeed(0);window.P=G.p;window.M=G.emps[3];window.T=G.emps[2];});
      await openWarDetail();const st=await page.locator('#shareState').innerText();assert.match(st,/onaylandı/);return {st};});
    await test('5 Uygula ayrı adım (gerçek düğme): koloni P\'den M\'ye geçer — fetheden devlet ≠ yeni sahip; nüfus/yapılar korunur',async()=>{
      const before=await page.evaluate(t=>JSON.stringify(G.sys[t.sys].planets[t.planet].col.b),target);
      await tap('#warCenterRoot [data-a="shareOpen"]');await page.waitForSelector('#modal [data-a="shareApply"]',{state:'attached'});await page.screenshot({path:path.join(out,'5-uygula-oncesi.png')});
      await tap('#modal [data-a="shareApply"]');await page.waitForTimeout(500);
      const after=await page.evaluate(t=>{const p=G.sys[t.sys].planets[t.planet];return {owner:p.owner,b:JSON.stringify(p.col.b),state:G.settlements.offers.slice(-1)[0].state,inM:M.colonies.some(c=>c.s===t.sys&&c.p===t.planet),inP:P.colonies.some(c=>c.s===t.sys&&c.p===t.planet)};},target);
      await page.screenshot({path:path.join(out,'5-uygula-sonrasi.png')});
      assert.equal(after.owner,3,'yeni sahip M');assert.notEqual(after.owner,target.owner);assert.equal(after.state,'applied');assert.equal(after.inM,true);assert.equal(after.inP,false);assert.equal(after.b,before,'yapılar korundu');
      return {after};});
    await test('6 ikinci uygulama yapılamaz: düğme yok, motor reddeder, sahiplik değişmez',async()=>{
      await page.evaluate(()=>UI.closeModal());await tap(`[data-a="shareOpen"]`).catch(()=>{});
      const r=await page.evaluate(t=>{UI.closeModal();UI.openSettlement(campaign);const btn=!!$('modal').querySelector('[data-a="shareApply"]');const o=G.settlements.offers.slice(-1)[0];const again=settlementApply(G.p,o.id);return {btn,again,owner:G.sys[t.sys].planets[t.planet].owner};},target);
      assert.equal(r.btn,false);assert.equal(r.again.ok,false);assert.equal(r.owner,3);return r;});
    await test('7 tek galip seferi ve eksik (legacy) kayıt: Savaş Merkezi ayrıntısında somut gerekçe',async()=>{
      const c2=await page.evaluate(()=>{const X=G.emps[4];for(const e of G.emps){e.war={};}declareWar(P,X);const s=G.sys.find(s=>s.owner===X.id&&!s.planets.some(p=>p.col))||G.sys.find(s=>s.owner<0&&s.planets.length);s.owner=X.id;captureSystem(s,0);const c=warLedgerFind(0,X.id).campaign;makePeace(P,X);UI.setSpeed(0);return c;});
      await page.evaluate(()=>UI.closeModal());await page.evaluate(()=>WarCenterUI.open());await tap('[data-a="warCenterTab"][data-x="past"]');
      const f2=await page.evaluate(c=>G.warLedger.fronts.find(f=>f.campaign===c).id,c2);await tap(`[data-a="warCenterDetail"][data-x="${f2}"]`);await page.waitForTimeout(300);
      const why1=await page.locator('#shareWhy').innerText();await page.screenshot({path:path.join(out,'7-tek-galip.png')});
      await page.evaluate(c=>{G.warLedger.fronts.find(f=>f.campaign===c).legacy=true;},c2);await page.evaluate(()=>WarCenterUI.open());await tap('[data-a="warCenterTab"][data-x="past"]');await tap(`[data-a="warCenterDetail"][data-x="${f2}"]`);await page.waitForTimeout(300);
      const why2=await page.locator('#shareWhy').innerText();
      assert.match(why1,/en az iki yaşayan ortak/);assert.match(why2,/Kısmi savaş kaydı/);return {why1,why2};});
    await test('sayfa hatası yok',async()=>{assert.deepEqual(errors,[]);});
  }finally{await browser.close();server.close();fs.writeFileSync(path.join(out,'share.json'),JSON.stringify(rows,null,1));console.log(`GEÇEN: ${pass} KALAN: ${fail}`);if(fail)process.exitCode=1;}
}
run().catch(e=>{console.error(e);process.exitCode=1;});
