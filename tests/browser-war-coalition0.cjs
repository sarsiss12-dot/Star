'use strict';
/* WAR-COALITION.0 — gerçek Chromium (yerel), tek oyunculu gerçek STARS arayüzü, gerçek dokunma. Yatay 844×390 ve daha dar yatay 740×360.
   S1 tek başına ilan iki adımda: SAVAŞ → Fetih (sistem seç) → tek akış → "Savaş İlan Et"; seçilen sistemler ilana taşınır; davet / hazırlık yok.
   S2 Vasallaştırma seçimi (tür + savaşa katılım) akıştan "Hedefi değiştir" ile geri gidince korunur.
   S4 (844×390) tek başına Vasallaştırma ilanı iki adımda; tür ve hüküm ilana taşınır.
   S3 karışık koalisyon: kaynaklı kabul (Şart ekle, ±50 düğmeleri), karşı teklif → Kabul Et, ret, engelli aday (hedefle saldırmazlık paktı);
      "Hazırlığı Kaydet ve Çık" → oyuna dönüş → diplomasi SAVAŞ düğmesinden aynı hazırlığa devam; kaydet/yükle sonrası Savaş Merkezi'nden devam;
      hedef değişince kabuller "Yeniden onay gerekli"; yeniden davet → kabul; "1 Destekçiyle Savaş İlan Et" çift dokunuş → tek savaş, bedel bir kez.
   FİKSTÜR (açıkça): temas/keşif açık; 2 ve 3 oyuncunun müttefiki ve oyuncu hakkında SIZILMIŞ istihbaratlı; 6 hedefle saldırmazlık paktlı; oyuncuya kaynak.
   Fiziksel cihaz / Render DEĞİL. */
const assert=require('node:assert/strict'),{createServer}=require('node:http'),{readFile}=require('node:fs'),fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
const root=path.resolve(process.env.STARS_ROOT||path.join(__dirname,'..')),out=process.env.STARS_OUTPUT||'/tmp/stars-war-coalition0';fs.mkdirSync(out,{recursive:true});
const server=createServer((req,res)=>{const p=new URL(req.url,'http://localhost').pathname,file=path.resolve(root,'.'+(p==='/'?'/index.html':p));if(!file.startsWith(root+path.sep))return res.writeHead(403).end();
  readFile(file,(e,b)=>{if(e)return res.writeHead(404).end();res.writeHead(200,{'content-type':file.endsWith('.js')?'text/javascript':file.endsWith('.json')?'application/json':file.endsWith('.css')?'text/css':'text/html'});res.end(b);});});
let pass=0,fail=0;const rows=[];
async function test(name,fn){try{const r=await fn();rows.push({name,status:'PASS',...(r||{})});pass++;console.log('PASS '+name);}catch(e){rows.push({name,status:'FAIL',error:String(e&&e.stack||e)});fail++;console.log('FAIL '+name+'\n'+(e&&e.stack||e));}}
const FIX=()=>{G.autoSave=false;const A=G.p;for(const e of G.emps){e.res.etk=5000;e.civics=[];for(const o of G.emps)if(e!==o&&!o.wild){e.contact[o.id]=true;e.ally[o.id]=false;e.war[o.id]=false;e.rel[o.id]=60;}}
  for(const s of G.sys)for(const e of G.emps)if(!e.wild&&!s.seen.includes(e.id))s.seen.push(e.id);for(const e of G.emps.filter(e=>!e.wild)){const nb=G.sys[e.home].lanes.filter(l=>G.sys[l].owner<0).slice(0,4);for(const l of nb)territoryOwnerSet(G.sys[l],e.id);}
  for(const id of [2,3]){A.ally[id]=G.emps[id].ally[0]=true;A.rel[id]=G.emps[id].rel[0]=90;(G.emps[id].intel=G.emps[id].intel||{})[0]=3;}
  const T=G.emps[1];T.nap=T.nap||{};G.emps[6].nap=G.emps[6].nap||{};G.emps[6].nap[1]=T.nap[6]=G.day+9999;for(const r of ['min','ene','ala','yiy','tuk'])A.res[r]=4000;remember(T,0,'savasIlan');UI.setSpeed(0);return 1;};
async function run(){
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const browser=await chromium.launch({executablePath:process.env.STARS_CHROMIUM_PATH,args:['--no-sandbox','--disable-dev-shm-usage']});
  const url='http://127.0.0.1:'+server.address().port;
  try{
    for(const [W,Hh] of [[844,390],[740,360]]){const V=W+'x'+Hh;
    const ctx=await browser.newContext({viewport:{width:W,height:Hh},isMobile:true,hasTouch:true,deviceScaleFactor:1});const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
    const tap=async sel=>{if(!sel.includes('#modal')&&!sel.startsWith('.coal')&&!sel.startsWith('[data-a="coal')&&!sel.startsWith('#coal')&&!sel.startsWith('#warFinalConfirm')){await page.evaluate(sel=>{const el=document.getElementById('modal');if(el.classList.contains('hidden')||document.querySelector(sel)?.closest('#modal'))return;if(el.querySelector('[data-a="advClose"]'))UI.act('advClose');else UI.closeModal();},sel);}
      const l=page.locator(sel).first();await l.scrollIntoViewIfNeeded();await l.tap();await page.waitForTimeout(160);};
    const settle=()=>page.waitForTimeout(450);   /* dokunuştan sonra yüzey güncellemesi ~250 ms ertelenir */
    const stateOf=id=>page.evaluate(id=>document.querySelector(`.coalCard[data-member="${id}"]`)?.dataset.state||null,id);
    await page.goto(url);await page.evaluate(()=>{try{localStorage.clear();}catch{}resetSetupNaming();leaveTitle('setup');Object.assign(CFG,{seed:22,size:'orta',aiCount:6,pirates:false});startGame();});
    await page.waitForFunction(()=>typeof G!=='undefined'&&G.p&&G.sys?.length&&!document.getElementById('game').classList.contains('hidden'),undefined,{timeout:60000});await page.waitForTimeout(800);
    await page.evaluate(()=>{for(let i=0;i<6&&!document.getElementById('modal').classList.contains('hidden');i++){if(document.querySelector('#modal [data-a="advClose"]'))UI.act('advClose');else UI.closeModal();}});await page.evaluate(FIX);
    const openWar=async x=>{await page.evaluate(x=>{UI.closeModal();UI.selectDiplo(x,'relation');},x);await page.waitForSelector(`[data-a="war"][data-x="${x}"]`,{state:'attached'});
      await page.evaluate(x=>{const d=document.querySelector(`[data-a="war"][data-x="${x}"]`).closest('details');if(d)d.open=true;},x);await tap(`[data-a="war"][data-x="${x}"]`);};
    if(W===844){
    await test(V+' S1 tek başına ilan iki adımda: Fetih sistem seçimi → tek akış → "Savaş İlan Et"; seçim ilana taşınır; davet/hazırlık yok',async()=>{
      await openWar(4);await tap('#modal [data-a="setwg"][data-x="4:fetih"]');await page.waitForSelector('#modal [data-a="wgTarget"]');
      const first=await page.evaluate(()=>+document.querySelector('#modal [data-a="wgTarget"]').dataset.x);await tap(`#modal [data-a="wgTarget"][data-x="${first}"]`);
      const sel=await page.evaluate(()=>UI._wgSel.targets.slice());if(!sel.length){await tap(`#modal [data-a="wgTarget"][data-x="${first}"]`);}
      await tap('#modal [data-a="wgGo"]');await page.waitForSelector('#warCoalRoot .coalSummary');const picked=await page.evaluate(()=>WarCoal.st.sel.targets.slice());
      const btn=await page.locator('#warFinalConfirm').innerText();assert.equal(btn.trim(),'Savaş İlan Et');await page.screenshot({path:path.join(out,V+'-s1-tek-basina.png')});
      await tap('#warFinalConfirm');const g=await page.evaluate(()=>({war:!!G.p.war[4],wg:G.p.wg[4],preps:(G.warLedger.preparations||[]).length}));
      assert.equal(g.war,true);assert.deepEqual(g.wg.targets,picked);assert.equal(g.preps,0,'hazırlık açılmadı');return {picked};});
    await test(V+' S2 Vasallaştırma seçimi (Akademik + Katılmaz) "Hedefi değiştir" ile geri gidince korunur',async()=>{
      await openWar(5);await tap('#modal [data-a="setwg"][data-x="5:boyun"]');await tap('#modal [data-a="wgVtype"][data-x="akademik"]');await tap('#modal [data-a="wgVwar"][data-x="none"]');
      await tap('#modal [data-a="wgGo"]');await page.waitForSelector('#warCoalRoot .coalSummary');assert.match(await page.locator('#warCoalRoot').innerText(),/VASALLAŞTIRMA · Akademik/i);
      await tap('#warCoalRoot [data-a="setwg"]');await page.waitForSelector('#modal [data-a="wgVtype"]');
      const s=await page.evaluate(()=>({t:document.querySelector('#modal [data-a="wgVtype"].pri')?.dataset.x,w:document.querySelector('#modal [data-a="wgVwar"].pri')?.dataset.x}));assert.deepEqual(s,{t:'akademik',w:'none'});
      await page.evaluate(()=>UI.closeModal());return s;});
    }
    await test(V+' S3 karışık koalisyon tek ekrandan: kaynaklı kabul, karşı teklif → Kabul Et, ret, engelli aday; kaydet-çık-devam; kaydet/yükle; hedef değişince yeniden onay; ilan bedeli bir kez',async()=>{
      if(W!==844){await page.evaluate(()=>{const s=serialize();deserialize(s);});await page.evaluate(FIX);}
      await openWar(1);await tap('#modal [data-a="setwg"][data-x="1:fetih"]');await tap('#modal [data-a="wgGo"]');await page.waitForSelector('#warCoalRoot .coalSummary');
      await tap('.coalAllies > summary');await page.waitForSelector('[data-a="coalPick"][data-x="2"]');
      assert.equal(await page.evaluate(()=>!!document.querySelector('.coalOthers .coalCard[data-member="6"]')&&!document.querySelector('.coalOthers .coalCard[data-member="2"]')),true,'müttefikler önce, diğerleri "Diğer devletler" altında');
      await tap('.coalOthers > summary');await settle();
      assert.equal(await stateOf(6),'blocked');assert.match(await page.locator('.coalCard[data-member="6"] .coalWhy').innerText(),/Hedefle saldırmazlık paktı var/);
      await tap('[data-a="coalTerms"][data-x="2"]');for(let i=0;i<8;i++){await page.waitForSelector('[data-a="coalAmt"][data-x="2:ala:50"]');await tap('[data-a="coalAmt"][data-x="2:ala:50"]');}
      await page.screenshot({path:path.join(out,V+'-s3-sart.png')});await tap('[data-a="coalTermsDone"][data-x="2"]');
      await tap('[data-a="coalPick"][data-x="3"]');await tap('[data-a="coalPick"][data-x="5"]');await settle();
      assert.match(await page.locator('#coalSend').innerText(),/Davetleri Gönder \(3\)/);await tap('#coalSend');await settle();
      const st0={2:await stateOf(2),3:await stateOf(3),5:await stateOf(5)};assert.equal(st0[2],'accepted',JSON.stringify(st0));assert.equal(st0[3],'countered');assert.equal(st0[5],'rejected');
      await page.screenshot({path:path.join(out,V+'-s3-yanitlar.png')});
      await tap('[data-a="coalReply"][data-x="3:accept"]');await settle();assert.equal(await stateOf(3),'accepted');
      assert.match(await page.locator('#warFinalConfirm').innerText(),/2 Destekçiyle Savaş İlan Et/);
      /* kaydet-çık-devam */
      await tap('[data-a="coalSave"]');assert.equal(await page.evaluate(()=>document.getElementById('modal').classList.contains('hidden')),true);
      await openWar(1);await page.waitForSelector('#warCoalRoot .coalSummary');assert.equal(await stateOf(3),'accepted','diplomasi SAVAŞ düğmesinden aynı hazırlığa dönüldü');
      /* kaydet / yükle → Savaş Merkezi'nden devam */
      await page.evaluate(()=>{UI.closeModal();const s=serialize();if(!deserialize(s))throw Error('yüklenemedi');UI.refresh();});
      await page.evaluate(()=>WarCenterUI.open());await page.waitForSelector('#modal [data-a="warPreparation"]',{timeout:10000});await tap('#modal [data-a="warPreparation"]');
      await page.waitForSelector('#warCoalRoot .coalSummary');assert.equal(await stateOf(2),'accepted');assert.equal(await stateOf(3),'accepted');
      /* hedef değişikliği → yeniden onay */
      await tap('#warCoalRoot [data-a="setwg"]');await page.waitForSelector('#modal [data-a="wgTarget"]');
      const add=await page.evaluate(()=>[...document.querySelectorAll('#modal [data-a="wgTarget"]')].map(b=>+b.dataset.x).find(id=>!UI._wgSel.targets.includes(id)));
      if(add!==undefined)await tap(`#modal [data-a="wgTarget"][data-x="${add}"]`);else await tap('#modal [data-a="wgTarget"]');
      await tap('#modal [data-a="wgGo"]');await page.waitForFunction(()=>document.querySelector('.coalCard[data-member="2"]')?.dataset.state==='stale',undefined,{timeout:10000});
      assert.equal(await stateOf(3),'stale');assert.match(await page.locator('#warFinalConfirm').innerText(),/Desteksiz Savaş İlan Et|Savaş İlan Et/);await page.screenshot({path:path.join(out,V+'-s3-yeniden-onay.png')});
      await tap('[data-a="coalPick"][data-x="2"]');await settle();await tap('#coalSend');await page.waitForFunction(()=>document.querySelector('.coalCard[data-member="2"]')?.dataset.state!=='stale',undefined,{timeout:8000}).catch(()=>{});
      assert.equal(await stateOf(2),'accepted',await page.evaluate(()=>JSON.stringify({msg:WarCoal.st&&WarCoal.st.msg,picks:WarCoal.st&&WarCoal.st.picks,terms:WarCoal.st&&WarCoal.st.terms})));
      assert.match(await page.locator('#warFinalConfirm').innerText(),/1 Destekçiyle Savaş İlan Et/);await page.locator('.coalSummary').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,V+'-s3-son-onay.png')});
      const r0=await page.evaluate(()=>({ala:G.p.res.ala,etk:G.p.res.etk}));const b=page.locator('#warFinalConfirm');await b.tap();await b.tap({force:true,noWaitAfter:true}).catch(()=>{});await page.waitForTimeout(600);
      const g=await page.evaluate(()=>({war:!!G.p.war[1],w2:!!G.emps[2].war[1],w3:!!G.emps[3].war[1],fronts:G.warLedger.fronts.filter(f=>f.sides.includes(0)&&f.sides.includes(1)).length,ala:G.p.res.ala,etk:G.p.res.etk,targets:G.p.wg[1].targets}));
      assert.equal(g.war,true);assert.equal(g.w2,true);assert.equal(g.w3,false,'yeniden onay vermeyen 3 katılmaz');assert.equal(g.fronts,1,'tek savaş');assert.equal(r0.ala-g.ala,400,'kaynak bedeli bir kez');
      return {spent:{ala:r0.ala-g.ala,etk:r0.etk-g.etk},targets:g.targets};});
    if(W===844)await test(V+' S4 tek başına Vasallaştırma ilanı iki adımda: Akademik + Katılmaz → tek akış → "Savaş İlan Et"; tür ve hüküm ilana taşınır; davet/hazırlık yok',async()=>{
      const pre=await page.evaluate(()=>(G.warLedger.preparations||[]).length);
      await openWar(5);await tap('#modal [data-a="setwg"][data-x="5:boyun"]');await tap('#modal [data-a="wgVtype"][data-x="akademik"]');await tap('#modal [data-a="wgVwar"][data-x="none"]');
      await tap('#modal [data-a="wgGo"]');await page.waitForSelector('#warCoalRoot .coalSummary');
      const btn=await page.locator('#warFinalConfirm').innerText();assert.equal(btn.trim(),'Savaş İlan Et');await page.screenshot({path:path.join(out,V+'-s4-vasal-tek-basina.png')});
      await tap('#warFinalConfirm');const g=await page.evaluate(()=>({war:!!G.p.war[5],wg:G.p.wg[5],preps:(G.warLedger.preparations||[]).length}));
      assert.equal(g.war,true);assert.equal(g.wg.t,'boyun');assert.equal(g.wg.vtype,'akademik');assert.equal(g.wg.terms.war,'none');assert.equal(g.preps,pre,'yeni hazırlık açılmadı');return {wg:g.wg};});
    assert.deepEqual(errors,[],errors.join('\n'));await ctx.close();}
  }finally{await browser.close();server.close();}
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(rows,null,1));console.log(`GEÇEN: ${pass} KALAN: ${fail}`);if(fail)process.exitCode=1;
}
run().catch(e=>{console.error(e);process.exitCode=1;});
