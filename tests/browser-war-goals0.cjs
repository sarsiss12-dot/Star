'use strict';
/* BETA-WAR-GOALS.0 — gerçek Chromium (yerel), tek oyunculu gerçek STARS arayüzü, gerçek dokunma.
   B1 kurulum: GALAKTİK GERİLİM Sakin / Dengeli / Çalkantılı (dikey 390×844 ve dar yatay 800×360); Dengeli varsayılan, cfg'ye yazılmaz.
   B2 oyun içi (yatay 844×390): SAVAŞ HEDEFİ SEÇ → yalnız Fetih / Vasallaştırma → hedef sistem seçimi → ÖNİZLEME (hedef, gerekçe/meşruiyet,
      tahmini tutumlar) → ONAYLA; v2 kaydı.
   B3 müzakere masası: "Teslim iste" + TESLİM ÖNİZLEMESİ (kapanan / süren cepheler, savaşa katılım hükmü); ayrı barış kutusu (yalnız bu cephe).
   B4 iki federasyon: FEDERASYONA KARŞI SAVAŞ ÖNER → OYLAMAYA SUN → (AI üye oyu) → karar UYGULA → ilan; karşı federasyon başkanıyla ORTAK BARIŞ.
   FİKSTÜR (açıkça): temas/keşif açılır, hedeflere başkent çevresinden en çok 4 sistem verilir; B4'te iki askerî federasyon doğrudan kurulur, AI'lara
   tam harita bilgisi ve erişim filosu verilir. Fiziksel cihaz / Render DEĞİL. */
const assert=require('node:assert/strict'),{createServer}=require('node:http'),{readFile}=require('node:fs'),fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
const root=path.resolve(process.env.STARS_ROOT||path.join(__dirname,'..')),out=process.env.STARS_OUTPUT||'/tmp/stars-war-goals0';fs.mkdirSync(out,{recursive:true});
const server=createServer((req,res)=>{const p=new URL(req.url,'http://localhost').pathname,file=path.resolve(root,'.'+(p==='/'?'/index.html':p));if(!file.startsWith(root+path.sep))return res.writeHead(403).end();
  readFile(file,(e,b)=>{if(e)return res.writeHead(404).end();res.writeHead(200,{'content-type':file.endsWith('.js')?'text/javascript':file.endsWith('.json')?'application/json':file.endsWith('.css')?'text/css':'text/html'});res.end(b);});});
let pass=0,fail=0;const rows=[];
async function test(name,fn){try{const r=await fn();rows.push({name,status:'PASS',...(r||{})});pass++;console.log('PASS '+name);}catch(e){rows.push({name,status:'FAIL',error:String(e&&e.stack||e)});fail++;console.log('FAIL '+name+'\n'+(e&&e.stack||e));}}
const startGame=async(page,cfg)=>{await page.evaluate(cfg=>{Object.assign(CFG,cfg);G.autoSave=false;startGame();},cfg);await page.waitForFunction(()=>typeof G!=='undefined'&&G.p&&G.sys?.length&&!document.getElementById('game').classList.contains('hidden'),undefined,{timeout:60000});await page.evaluate(()=>{UI.setSpeed(0);G.autoSave=false;});await clean(page);};
const clean=page=>page.evaluate(()=>{for(let i=0;i<6&&!document.getElementById('modal').classList.contains('hidden');i++)UI.closeModal();if(document.getElementById('diploPane').classList.contains('show'))UI.act('closeDiplo');UI.setSpeed(0);});
async function run(){
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const browser=await chromium.launch({executablePath:process.env.STARS_CHROMIUM_PATH,args:['--no-sandbox','--disable-dev-shm-usage']});
  const url='http://127.0.0.1:'+server.address().port;
  try{
    for(const [w,h] of [[390,844],[800,360]]){
      const ctx=await browser.newContext({viewport:{width:w,height:h},isMobile:true,hasTouch:true,deviceScaleFactor:1});const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
      const V=w+'x'+h,tap=async sel=>{const l=page.locator(sel).first();await l.scrollIntoViewIfNeeded();await l.tap();await page.waitForTimeout(120);};
      await page.goto(url);await page.evaluate(()=>{try{localStorage.clear();}catch{}});
      await page.evaluate(()=>{resetSetupNaming();SETUP_STEP='galaksi';leaveTitle('setup');CFG.aiCount=5;CFG.size='orta';delete CFG.tension;safeRenderSetup();});await page.waitForSelector('#setup #tensionRow');
      await test(V+' B1 GALAKTİK GERİLİM: Dengeli varsayılan; Sakin / Çalkantılı dokunuşla seçilir; Dengeli cfg\'ye yazılmaz; seçim başlangıçta G.cfg\'ye geçer',async()=>{
        const st=()=>page.evaluate(()=>({t:CFG.tension,on:[...document.querySelectorAll('#tensionRow .opt.on')].map(b=>b.dataset.x),txt:document.getElementById('tensionRow').parentElement.innerText}));
        let s=await st();assert.deepEqual(s.on,['dengeli']);assert.equal(s.t,undefined);
        await tap('#tensionRow [data-x="sakin"]');s=await st();assert.equal(s.t,'sakin');assert.deepEqual(s.on,['sakin']);
        await tap('#tensionRow [data-x="calkantili"]');s=await st();assert.equal(s.t,'calkantili');assert.match(s.txt,/Rakip Doktrinlerden ayrıdır/);
        await page.locator('#tensionRow').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,`${V}-gerilim.png`)});
        await tap('#tensionRow [data-x="dengeli"]');s=await st();assert.equal(s.t,undefined,'Dengeli yazılmaz');
        if(w===390){await tap('#tensionRow [data-x="calkantili"]');await tap('#setup [data-a="start"]');
          await page.waitForFunction(()=>typeof G!=='undefined'&&G.p&&G.sys?.length&&!document.getElementById('game').classList.contains('hidden'),undefined,{timeout:60000});
          assert.equal(await page.evaluate(()=>G.cfg.tension),'calkantili');assert.equal(await page.evaluate(()=>tensionMul()),1.5);}
        return {final:s};});
      assert.deepEqual(errors,[],errors.join('\n'));await ctx.close();
    }
    const ctx=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true,deviceScaleFactor:1});const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
    const modals=[];   /* geç açılan bağımsız pencere (ör. DANIŞMAN karşılama) dokunulacak yeri örterse önce kapatılır ve günlüğe yazılır */
    const tap=async sel=>{if(!sel.includes('#modal')){const m=await page.evaluate(sel=>{const el=document.getElementById('modal');if(el.classList.contains('hidden')||document.querySelector(sel)?.closest('#modal'))return null;const t=el.innerText.slice(0,120);if(el.querySelector('[data-a="advClose"]'))UI.act('advClose');else UI.closeModal();return t;},sel);if(m)modals.push({before:sel,modal:m});}
      const l=page.locator(sel).first();await l.scrollIntoViewIfNeeded();await l.tap();await page.waitForTimeout(150);};
    await page.goto(url);await page.evaluate(()=>{try{localStorage.clear();}catch{}});await page.evaluate(()=>{resetSetupNaming();leaveTitle('setup');});
    await startGame(page,{seed:22,size:'orta',aiCount:6,pirates:false});
    const X=await page.evaluate(()=>{G.feds=[];for(const e of G.emps){e.res.etk=5000;e.civics=[];for(const o of G.emps)if(e!==o&&!o.wild){e.contact[o.id]=true;e.ally[o.id]=false;e.war[o.id]=false;}}
      for(const s of G.sys)for(const e of G.emps)if(!e.wild&&!s.seen.includes(e.id))s.seen.push(e.id);
      for(const e of G.emps.filter(e=>!e.wild)){const nb=G.sys[e.home].lanes.filter(l=>G.sys[l].owner<0).slice(0,4);for(const l of nb)territoryOwnerSet(G.sys[l],e.id);}
      for(const e of G.emps)e.aiIntel={v:1,systems:Object.fromEntries(G.sys.map(s=>[s.id,{owner:s.owner,defense:sysDefense(s),day:G.day}]))};return 1;});
    await page.waitForTimeout(700);if(await page.locator('#modal [data-a="advClose"]').count())await page.locator('#modal [data-a="advClose"]').first().tap();   // DANIŞMAN karşılama penceresi (gerçek düğme)
    await test('B2 SAVAŞ HEDEFİ SEÇ → yalnız Fetih / Vasallaştırma → hedef sistem seçimi → ÖNİZLEME (hedef, gerekçe, tutum) → ONAYLA; v2 kaydı',async()=>{
      await clean(page);await page.evaluate(x=>{remember(G.emps[x],0,'savasIlan');remember(G.p,x,'sistemAldi');UI.selectDiplo(x,'relation');},X);
      await page.waitForSelector(`[data-a="war"][data-x="${X}"]`,{state:'attached'});await tap(`details.dcDetails:has([data-a="war"][data-x="${X}"]) > summary`);   // gerçek dokunuşla "Savaş ve baskı" bölümünü aç
      await tap(`[data-a="war"][data-x="${X}"]`);const goals=await page.evaluate(()=>[...document.querySelectorAll('#modal [data-a="setwg"]')].map(b=>b.dataset.x.split(':')[1]));assert.deepEqual(goals,['fetih','boyun']);
      await page.screenshot({path:path.join(out,'b2-iki-hedef.png')});
      await tap(`#modal [data-a="setwg"][data-x="${X}:fetih"]`);await page.waitForSelector('#modal [data-a="wgTarget"]');
      const before=await page.evaluate(()=>UI._wgSel.targets.slice());const first=await page.evaluate(()=>+document.querySelector('#modal [data-a="wgTarget"]').dataset.x);
      await tap(`#modal [data-a="wgTarget"][data-x="${first}"]`);const after=await page.evaluate(()=>UI._wgSel.targets.slice());assert.notDeepEqual(after,before,'dokunuş hedef listesini değiştirir');
      if(!after.length)await tap(`#modal [data-a="wgTarget"][data-x="${first}"]`);
      await page.screenshot({path:path.join(out,'b2-hedef-secimi.png')});
      await tap('#modal [data-a="wgGo"]');await page.waitForSelector('#warFinalConfirm');const pv=await page.locator('#modal').innerText();
      assert.match(pv,/HEDEF: FETİH/);assert.match(pv,/GEREKÇELER VE MEŞRUİYET/);assert.match(pv,/Kaybedilen toprak/);assert.match(pv,/TAHMİNİ TUTUMLAR/);
      await page.screenshot({path:path.join(out,'b2-onizleme.png'),fullPage:true});const sel=await page.evaluate(()=>UI._wgSel.targets.slice());
      await tap('#warFinalConfirm');const g=await page.evaluate(x=>({war:!!G.p.war[x],wg:G.p.wg[x]}),X);
      assert.equal(g.war,true);assert.equal(g.wg.t,'fetih');assert.equal(g.wg.v,2);assert.deepEqual(g.wg.targets,sel);return {goal:g.wg};});
    await test('B3 müzakere masası: "Teslim iste" → TESLİM ÖNİZLEMESİ (vergi, özerklik, kapanan/süren cephe, katılım hükmü); destek ortağının AYRI BARIŞ kutusu yalnız kendi cephesini kapatır',async()=>{
      await clean(page);await page.evaluate(x=>UI.openDeal(x),X);await page.waitForSelector('[data-a="dealVassal"][data-x="want:bekci"]');
      await tap('[data-a="dealVassal"][data-x="want:bekci"]');let box=await page.evaluate(()=>[...document.querySelectorAll('#diploPane .box')].map(b=>b.innerText).find(t=>/TESLİM ÖNİZLEMESİ/.test(t))||'');
      assert.match(box,/Sınır Bekçisi/);assert.match(box,/Kapanan cepheler/);assert.match(box,/Yalnız savunma/);
      await tap('[data-a="dealVassal"][data-x="war:all"]');assert.equal(await page.evaluate(()=>UI.deal.want.find(i=>i.t==='vassal').war),'all','saldırı savaşı katılımı yalnız açık madde');
      await page.screenshot({path:path.join(out,'b3-teslim-onizleme.png'),fullPage:true});
      const C=await page.evaluate(x=>{const C=G.emps.find(e=>e.ai&&!e.wild&&e.id!==x);warAuthorize(C,G.emps[x],{n:'test'});declareWar(C,G.emps[x],{sponsor:0,enemy:x,kind:'promise'});warAuthClear();return C.id;},X);
      await clean(page);await page.evaluate(x=>{UI.openDeal(x);UI.deal.give=[{t:'peace'}];UI.drawDeal();},X);
      const sp=await page.evaluate(()=>[...document.querySelectorAll('#diploPane .box')].map(b=>b.innerText).find(t=>/AYRI BARIŞ/.test(t))||'');
      assert.match(sp,/AYRI BARIŞ — yalnız bu cephe/);assert.match(sp,/Öteki cepheler/);await page.screenshot({path:path.join(out,'b3-ayri-baris.png'),fullPage:true});return {C};});
    await test('B4 iki federasyon: FEDERASYONA KARŞI SAVAŞ ÖNER → hedef üye + Vasallaştırma → OYLAMAYA SUN → AI üye oyu → karar UYGULA → ilan; ORTAK BARIŞ kutusu; karşı federasyonun kesin savunmacıları önizlemede',async()=>{
      await clean(page);const ids=await page.evaluate(()=>{for(const e of G.emps)for(const o of G.emps)if(e!==o&&!o.wild){e.war[o.id]=false;}G.warLedger=warLedgerEmpty();
        const ai=G.emps.filter(e=>e.ai&&!e.wild),A2=ai[0],B=ai[1],B2=ai[2];
        function mk(ms){const f={id:(G.fedUid=(G.fedUid||0)+1),name:'Test '+ms[0],type:'askeri',charter:{...fedDefaultCharter('askeri'),ballot:'equal',defense:'auto'},politicsVersion:96,leader:ms[0],founder:ms[0],members:ms.slice(),laws:{},treasury:0,fund:{ala:0,ene:0},nextVote:G.day+9999,vote:null,founded:G.day,typeSince:G.day,dutySince:{defense:G.day,offense:G.day},defenseFrontCutoff:1,dutyConsent:{},invites:{},decisions:{},cohesion:70};G.feds.push(f);federationIdentity(f);for(const id of ms)f.dutyConsent[id]={offense:false,since:G.day};return f;}
        for(const [a,b] of [[0,A2.id],[B.id,B2.id]])G.emps[a].ally[b]=G.emps[b].ally[a]=true;const FA=mk([0,A2.id]),FB=mk([B.id,B2.id]);
        for(const x of [0,A2.id]){const hs=G.sys[G.emps[x].home],ts=G.sys[B.home];if(!hs.lanes.includes(ts.id)){hs.lanes.push(ts.id);ts.lanes.push(hs.id);}newFleet(G.emps[x],hs.id,[{c:'kor'},{c:'kor'},{c:'muh'}]);}
        G.p.intel=G.p.intel||{};G.p.intel[B.id]=G.p.intel[B2.id]=3;   /* FİKSTÜR: karşı federasyon bağı istihbaratla bilinir */
        A2.rel[B.id]=-100;remember(A2,B.id,'sistemAldi');for(const e of G.emps)e.aiIntel={v:1,systems:Object.fromEntries(G.sys.map(s=>[s.id,{owner:s.owner,defense:sysDefense(s),day:G.day}]))};
        UI.fedTab='military';UI.openFed();return {FA:FA.id,FB:FB.id,B:B.id,B2:B2.id,A2:A2.id};});
      await tap('[data-a="fedTab"][data-x="military"]');
      await page.waitForSelector(`[data-a="fedWarOpen"][data-x="${ids.FB}"]`,{state:'attached',timeout:10000});await tap(`details:has([data-a="fedWarOpen"][data-x="${ids.FB}"]) > summary`);
      await tap(`[data-a="fedWarOpen"][data-x="${ids.FB}"]`);await tap(`#modal [data-a="fwTarget"][data-x="${ids.B}"]`);await tap('#modal [data-a="fwGoal"][data-x="boyun"]');
      const pv=await page.locator('#modal').innerText();assert.match(pv,/KARŞI TARAF/);assert.match(pv,/Yürürlükteki ortak savunma/);assert.match(pv,/Oy ve ilan ayrı adımdır/);
      await page.screenshot({path:path.join(out,'b4-fed-savas-onizleme.png'),fullPage:true});
      await tap('#modal [data-a="fwPropose"]');
      const v=await page.evaluate(ids=>{const f=fedOf(ids.FA);if(f.vote){const tok=fedVoteToken(f.vote);if(!f.vote.yes.includes(0))castFedVote(G.p,f.id,tok,true);if(f.vote)fedResolveVote(f);}const d=Object.values(f.decisions).find(d=>d.kind==='fedWar');return {d:d&&{id:d.id,state:d.state,approved:d.approved},war:!!G.p.war[ids.B],hist:(f.history||[]).slice(-2)};},ids);
      assert.ok(v.d,JSON.stringify(v));assert.equal(v.d.state,'ready');assert.equal(v.war,false,'oy savaş başlatmaz');
      await page.evaluate(()=>{UI.fedTab='military';UI.openFed();});const exe=`[data-a="fedExecute"]`;await page.waitForSelector(exe,{state:'attached',timeout:10000});
      if(!await page.locator(exe).first().isVisible())await tap(`details:has(${exe}) > summary`);await tap(exe);
      const r=await page.evaluate(ids=>({war:!!G.p.war[ids.B],mark:fedWarMark(warLedgerFind(0,ids.B)),fronts:G.warLedger.fronts.filter(f=>f.ended===null).map(f=>f.sides)}),ids);
      assert.equal(r.war,true,JSON.stringify(r));assert.equal(r.mark.against,ids.FB);
      await clean(page);await page.evaluate(b=>UI.openDeal(b),ids.B);await page.waitForSelector('[data-a="dealFedPeace"]');await tap('[data-a="dealFedPeace"]');
      const box=await page.evaluate(()=>[...document.querySelectorAll('#diploPane .box')].map(b=>b.innerText).find(t=>/ORTAK BARIŞ/.test(t))||'');assert.match(box,/cephe kapanır/);
      await page.screenshot({path:path.join(out,'b4-ortak-baris.png'),fullPage:true});
      return {ids,decision:v.d,fronts:r.fronts};});
    rows.push({name:'kapatılan bağımsız pencereler',status:'INFO',modals});
    assert.deepEqual(errors,[],errors.join('\n'));await ctx.close();
  }finally{await browser.close();server.close();fs.writeFileSync(path.join(out,'browser-war-goals0.json'),JSON.stringify({pass,fail,rows},null,1));}
  console.log(`GEÇEN: ${pass} KALAN: ${fail}`);if(fail)process.exitCode=1;
}
run().catch(e=>{console.error(e);process.exitCode=1;});
