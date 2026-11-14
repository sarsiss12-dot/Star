'use strict';
/* FIELD-WAR-SIEGE.0 — gerçek Chromium (yerel), tek oyunculu gerçek STARS arayüzü, gerçek dokunma, yatay 844×390.
   F1 Synarth (Kan Hukuku) %100 yorgunlukta: günlükte TEK açık neden (zorunlu ateşkes, Savaş #n); eski "kendiliğinden durdu" + "barış imzalandı"
      ikilisi yok. Aynı hedefe yeniden ilan: SAVAŞ HEDEFİ SEÇ → Fetih → ÖNİZLEME'de SAVAŞ YORGUNLUĞU bloğu (rakibin tahmini yorgunluğu + açıklama).
   F2 36K filo düşman başkentinde: SİSTEM panelinde "⚔ GEZEGEN SAVAŞI" altında gerçek durum metni; barıştan sonra "⏸ KUŞATMA DURDU" + neden.
   F3 FİLO sekmesi SEVKİYATLAR: "Bekleyenleri Yeniden Dene (3)" — rota açılan, otomatik sınırdaki, kapalı rotalı, hedefi kayıp ve yoldaki
      sevkiyatlar tek listede; çift gerçek dokunuş tek uygulama; sonuç metni gerçek sayılar.
   FİKSTÜR (açıkça): temas/keşif açılır, Synarth'a başkent çevresinden 3 sistem verilir, yorgunluk %99,5'e konur; filolar newFleet ile kurulur.
   Fiziksel cihaz / Render DEĞİL. */
const assert=require('node:assert/strict'),{createServer}=require('node:http'),{readFile}=require('node:fs'),fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
const root=path.resolve(process.env.STARS_ROOT||path.join(__dirname,'..')),out=process.env.STARS_OUTPUT||'/tmp/stars-field-war-siege0';fs.mkdirSync(out,{recursive:true});
const server=createServer((req,res)=>{const p=new URL(req.url,'http://localhost').pathname,file=path.resolve(root,'.'+(p==='/'?'/index.html':p));if(!file.startsWith(root+path.sep))return res.writeHead(403).end();
  readFile(file,(e,b)=>{if(e)return res.writeHead(404).end();res.writeHead(200,{'content-type':file.endsWith('.js')?'text/javascript':file.endsWith('.json')?'application/json':file.endsWith('.css')?'text/css':'text/html'});res.end(b);});});
let pass=0,fail=0;const rows=[];
async function test(name,fn){try{const r=await fn();rows.push({name,status:'PASS',...(r||{})});pass++;console.log('PASS '+name);}catch(e){rows.push({name,status:'FAIL',error:String(e&&e.stack||e)});fail++;console.log('FAIL '+name+'\n'+(e&&e.stack||e));}}
const clean=page=>page.evaluate(()=>{for(let i=0;i<6&&!document.getElementById('modal').classList.contains('hidden');i++){if(document.querySelector('#modal [data-a="advClose"]'))UI.act('advClose');else UI.closeModal();}if(document.getElementById('diploPane').classList.contains('show'))UI.act('closeDiplo');UI.setSpeed(0);});
async function run(){
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const browser=await chromium.launch({executablePath:process.env.STARS_CHROMIUM_PATH,args:['--no-sandbox','--disable-dev-shm-usage']});
  const url='http://127.0.0.1:'+server.address().port;
  try{
    const ctx=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true,deviceScaleFactor:1});const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
    const modals=[];
    const tap=async sel=>{if(!sel.includes('#modal')){const m=await page.evaluate(sel=>{const el=document.getElementById('modal');if(el.classList.contains('hidden')||document.querySelector(sel)?.closest('#modal'))return null;const t=el.innerText.slice(0,120);if(el.querySelector('[data-a="advClose"]'))UI.act('advClose');else UI.closeModal();return t;},sel);if(m)modals.push({before:sel,modal:m});}
      const l=page.locator(sel).first();await l.scrollIntoViewIfNeeded();await l.tap();await page.waitForTimeout(150);};
    await page.goto(url);await page.evaluate(()=>{try{localStorage.clear();}catch{}});await page.evaluate(()=>{resetSetupNaming();leaveTitle('setup');Object.assign(CFG,{seed:22,size:'orta',aiCount:5,pirates:false});G.autoSave=false;startGame();});
    await page.waitForFunction(()=>typeof G!=='undefined'&&G.p&&G.sys?.length&&!document.getElementById('game').classList.contains('hidden'),undefined,{timeout:60000});
    await page.waitForTimeout(700);await clean(page);
    const X=await page.evaluate(()=>{G.autoSave=false;const S=G.emps[1];S.name='Synarth Sığınağı';S.civics=['kan_hukuku'];G.p.civics=G.p.civics.filter(c=>c!=='kan_hukuku');G.p.res.etk=5000;
      for(const e of G.emps)for(const o of G.emps)if(e!==o&&!o.wild){e.contact[o.id]=true;e.ally[o.id]=false;}for(const s of G.sys)if(!s.seen.includes(0))s.seen.push(0);
      for(const l of G.sys[S.home].lanes.filter(l=>G.sys[l].owner<0).slice(0,3))territoryOwnerSet(G.sys[l],S.id);
      window.__month=n=>{for(let k=0;k<n*60;k++){const m=Math.floor(G.day/30);G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();if(Math.floor(G.day/30)>m)monthTick();}};return S.id;});
    await test('F1 Synarth %100 yorgunluk: günlükte tek açık neden; yeniden ilanda ÖNİZLEME SAVAŞ YORGUNLUĞU bloğu',async()=>{
      await page.evaluate(x=>{warAuthorize(G.p,G.emps[x],{n:'t'});declareWar(G.p,G.emps[x]);warAuthClear();__month(1);G.log.length=0;G.emps[x].exh[0]=99.5;__month(2);UI.refresh();},X);
      const log=await page.evaluate(()=>G.log.map(l=>l.m).filter(m=>/YORGUNLU|kendiliğinden durdu|savaştan çekildi/i.test(m)));
      assert.equal(log.length,1,JSON.stringify(log));assert.match(log[0],/SAVAŞ YORGUNLUĞU %100 .*zorunlu ateşkes.*Savaş #\d+/);
      const fr=await page.evaluate(x=>G.warLedger.fronts.filter(f=>f.sides.includes(x)).map(f=>f.endReason),X);assert.match(fr[0],/^exhaustion-lock\|actor:1/);
      await clean(page);await page.evaluate(x=>{remember(G.emps[x],0,'savasIlan');UI.selectDiplo(x,'relation');},X);
      await page.waitForSelector(`[data-a="war"][data-x="${X}"]`,{state:'attached'});await tap(`details.dcDetails:has([data-a="war"][data-x="${X}"]) > summary`);
      await tap(`[data-a="war"][data-x="${X}"]`);await tap(`#modal [data-a="setwg"][data-x="${X}:fetih"]`);await page.waitForSelector('#modal [data-a="wgGo"]');
      await tap('#modal [data-a="wgGo"]');await page.waitForSelector('#warFinalConfirm');const pv=await page.locator('#modal').innerText();
      assert.match(pv,/SAVAŞ YORGUNLUĞU/);assert.match(pv,/Synarth Sığınağı: ~?%\d+/);assert.match(pv,/ayda 2,5/);
      await page.screenshot({path:path.join(out,'f1-onizleme-yorgunluk.png'),fullPage:true});
      await tap('#warFinalConfirm');assert.equal(await page.evaluate(x=>!!G.p.war[x],X),true);
      return {log,preview:pv.split('\n').filter(l=>/YORGUNLU|Senin|Synarth/.test(l)).slice(0,6)};});
    await test('F2 36K filo düşman başkentinde: SİSTEM paneli gerçek kuşatma durumu; barıştan sonra KUŞATMA DURDU + neden',async()=>{
      await clean(page);const T=await page.evaluate(x=>{const S=G.emps[x],T=G.sys[S.home],P=T.planets.find(p=>p.col&&p.owner===x);if(!G.p.war[x]){warAuthorize(G.p,S,{n:'t'});declareWar(G.p,S);warAuthClear();}
        const f=newFleet(G.p,T.id,[{c:'kor'}]);while(fleetPower(f)<36000)f.ships.push({c:'kor',h:1});f.name='Ana 36K';if(!T.surv.includes(0))T.surv.push(0);P.col.shield=60;S.exh[0]=0;G.p.exh[x]=0;return T.id;},X);
      await page.evaluate(t=>{View.selSys=G.sys[t];},T);await tap('#tabs [data-x="sistem"]');
      let txt=await page.locator('#panel').innerText();assert.match(txt,/GEZEGEN SAVAŞI/);assert.match(txt,/Kalkan düşürülüyor/);
      await page.screenshot({path:path.join(out,'f2-kalkan.png')});
      await page.evaluate(()=>{__month(1);UI.refresh();});const st=await page.evaluate(t=>{const T=G.sys[t],P=T.planets.find(p=>p.col);return siegeStatus(T,P,0);},T);
      txt=await page.locator('#panel').innerText();assert.ok(txt.includes(st.text),'panel motor durumunu gösterir: '+st.text);
      await page.evaluate(x=>{G.emps[x].civics=[];if(!makePeace(G.p,G.emps[x],'agreement',0))throw Error('barış yok');UI.refresh();},X);await tap('#tabs [data-x="sistem"]');
      txt=await page.locator('#panel').innerText();assert.match(txt,/KUŞATMA DURDU/);assert.match(txt,/Kuşatma durdu — gezegen sahibiyle savaş sona erdi/);
      await page.locator('#panel .siegeSt[data-code="nowar"]').first().scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,'f2-kusatma-durdu.png')});
      return {month1:st};});
    await test('F3 FİLO SEVKİYATLAR: tek liste, "Bekleyenleri Yeniden Dene (3)", çift gerçek dokunuş tek uygulama, doğru sonuç metni',async()=>{
      await clean(page);await page.evaluate(()=>{const A=G.p,far=G.sys.find(s=>s.id!==A.home&&!G.sys[A.home].lanes.includes(s.id)&&(s.owner<0||s.owner===0)&&(findPathAllowed(A,{ships:[{c:'kor'}],e:0},A.home,s.id)||[]).length>1);
        const ana=newFleet(A,far.id,[{c:'kor'}]);ana.name='Araştırma 3';
        const ship=(name,d)=>{const f=newFleet(A,A.home,[{c:'kor'},{c:'muh'}]);f.name=name;f.shipment={...d,attempts:d.attempts||0,next:d.next||0,origin:A.home};if(d.fleet!==undefined)f.joinFleet=d.fleet;else f.rallyTo=d.sys;f.path=[];return f;};
        const iso=G.sys.find(s=>s.id!==A.home&&s.id!==far.id&&s.owner<0&&!s.planets.some(p=>p.col)&&!(findPathAllowed(A,{ships:[{c:'kor'}],e:0},A.home,far.id)||[]).includes(s.id));for(const l of iso.lanes)G.sys[l].lanes=G.sys[l].lanes.filter(x=>x!==iso.id);iso.lanes=[];if(typeof TRADE_PATHS!=='undefined')TRADE_PATHS.clear?.();
        ship('Arran',{fleet:ana.id,state:'blocked',attempts:2,next:G.day+40,reason:'Bilinen düşman tehdidi — güvenli rota yok'});ship('Lyrdex-59',{fleet:ana.id,state:'paused',attempts:4,reason:'Bilinen düşman tehdidi — güvenli rota yok'});
        ship('Kapalı',{sys:iso.id,state:'blocked',attempts:1,next:G.day+5});const gone=newFleet(A,A.home,[{c:'kor'}]);ship('Kayıp',{fleet:gone.id,state:'blocked',attempts:1});G.fleets.splice(G.fleets.indexOf(gone),1);
        const m=ship('Yolda',{sys:far.id,state:'moving'});m.path=findPath(A.home,far.id,A);View.sel=ana;window.__res0=JSON.stringify(G.p.res);});
      await tap('#tabs [data-x="filo"]');await page.waitForSelector('#panel [data-a="shipmentRetryAll"]');
      const lbl=await page.locator('#panel [data-a="shipmentRetryAll"]').innerText();assert.match(lbl,/Bekleyenleri Yeniden Dene \(3\)/);
      const listTxt=await page.locator('#panel .shipmentsAll').innerText();for(const n of ['Arran','Lyrdex-59','Kapalı','Kayıp','Yolda'])assert.ok(listTxt.includes(n),n);
      assert.match(listTxt,/Otomatik deneme sınırına ulaşıldı/);await page.locator('#panel .shipmentsAll').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,'f3-once.png')});
      const calls=await page.evaluate(()=>{window.__n=0;const o=shipmentRetryAll;window.shipmentRetryAll=function(){__n++;return o.apply(this,arguments);};return 1;});
      const b=page.locator('#panel [data-a="shipmentRetryAll"]').first();await b.scrollIntoViewIfNeeded();await b.tap();await b.tap({force:true,noWaitAfter:true}).catch(()=>{});await page.waitForFunction(()=>!!document.querySelector('#panel .shipmentRetryResult'),undefined,{timeout:5000}).catch(()=>{});
      const r=await page.evaluate(()=>({n:__n,ur:UI._shipmentRetryResult,pend:UI._shipmentRetryPending,cur:UI.cur,html:document.querySelector('#panel .shipmentsAll')?.innerHTML.slice(0,300),res:document.querySelector('#panel .shipmentRetryResult')?.innerText,lbl:document.querySelector('#panel [data-a="shipmentRetryAll"]')?.innerText,
        st:G.fleets.filter(f=>f.e===0&&f.shipment).map(f=>[f.name,f.shipment.state]),res0:__res0===JSON.stringify(G.p.res)}));
      assert.equal(r.n,1,'çift dokunuş tek çağrı '+JSON.stringify(r));assert.equal(r.res,'2 yola çıktı · 1 güvenli rota bekliyor · 1 hedef bulunamadı — hedef değiştir · 1 zaten yolda');
      assert.match(r.lbl,/Yeniden Dene \(1\)/,'kalan: yalnız kapalı rota');assert.equal(r.res0,true,'kaynak değişmez');
      if(r.n===2){const again=await page.evaluate(()=>G.fleets.filter(f=>f.e===0&&f.shipment&&f.shipment.state==='moving').length);assert.equal(again,3,'ikinci dokunuş yoldakileri yeniden başlatmadı');}
      await page.screenshot({path:path.join(out,'f3-sonra.png')});return {calls:r.n,res:r.res,states:r.st};});
    assert.deepEqual(errors,[],errors.join('\n'));fs.writeFileSync(path.join(out,'modals.json'),JSON.stringify(modals,null,1));await ctx.close();
  }finally{await browser.close();server.close();}
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(rows,null,1));console.log(`GEÇEN: ${pass} KALAN: ${fail}`);if(fail)process.exitCode=1;
}
run().catch(e=>{console.error(e);process.exitCode=1;});
