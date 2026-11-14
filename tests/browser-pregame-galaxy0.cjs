'use strict';
/* BETA-GALAXY.0 — pregame gerçek Chromium: fizyoloji / genetik kartları, Görünüş arması, galaksi şekli + çarpan + rota hatası.
   Görünümler: portre telefon 390×844 (dokunma), dar yatay 800×360 (dokunma), masaüstü 1280×720.
   STARS_ROOT ile kontrol kökü verilebilir ("önce" ekran görüntüleri; yeni denetimler orada NOT RUN sayılır).
   Kullanım: STARS_CHROMIUM_PATH=/opt/pw-browsers/chromium STARS_OUTPUT=<dizin> [STARS_ROOT=<kök>] [PG_TAG=sonra] node tests/browser-pregame-galaxy0.cjs */
const assert=require('node:assert/strict'),{createServer}=require('node:http'),{readFile}=require('node:fs'),fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
const root=path.resolve(process.env.STARS_ROOT||path.join(__dirname,'..')),out=process.env.STARS_OUTPUT||'/tmp/stars-pregame-galaxy0',tag=process.env.PG_TAG||'sonra';fs.mkdirSync(out,{recursive:true});
const server=createServer((req,res)=>{const p=new URL(req.url,'http://localhost').pathname,file=path.resolve(root,'.'+(p==='/'?'/index.html':p));if(!file.startsWith(root+path.sep))return res.writeHead(403).end();
  readFile(file,(e,d)=>{if(e)return res.writeHead(404).end();res.setHeader('Content-Type',{'.js':'text/javascript','.html':'text/html'}[path.extname(file)]||'application/json');res.end(d);});});
let pass=0,fail=0;const rows=[];
async function test(name,fn){try{const r=await fn();rows.push({name,status:'PASS',...(r||{})});pass++;console.log('PASS '+name);}catch(e){rows.push({name,status:'FAIL',error:String(e&&e.stack||e)});fail++;console.log('FAIL '+name+'\n'+(e&&e.stack||e));}}
async function run(){
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const browser=await chromium.launch({executablePath:process.env.STARS_CHROMIUM_PATH,args:['--no-sandbox','--disable-dev-shm-usage']});
  const isNew=fs.readFileSync(path.join(root,'ui.js'),'utf8').includes('physioEffects');
  try{for(const [w,h,mobile] of [[390,844,true],[800,360,true],[1280,720,false]]){
    const ctx=await browser.newContext({viewport:{width:w,height:h},isMobile:mobile,hasTouch:mobile,deviceScaleFactor:1});const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
    const V=w+'x'+h,touch=async sel=>{const l=page.locator(sel).first();await l.scrollIntoViewIfNeeded();return mobile?l.tap():l.click();};
    await page.goto('http://127.0.0.1:'+server.address().port);
    await page.evaluate(()=>{try{localStorage.clear();}catch{}});
    await page.evaluate(()=>{resetSetupNaming();SETUP_STEP='mizac';leaveTitle('setup');});await page.waitForFunction(()=>!document.getElementById('setup').classList.contains('hidden')||document.querySelector('#setup [data-a="step"]'),undefined,{timeout:10000}).catch(()=>{});
    await page.evaluate(()=>{SETUP_STEP='fizyo';safeRenderSetup();});
    await test(V+' fizyoloji: Okyanus Canlısı / Kuş Benzeri / Makine Ağı kartları aynı tipografi, kod terimi yok, taşma yok; seçili kart ayırt edilir',async()=>{
      const shots=[];
      for(const k of ['aquatic','avian','machine']){
        await touch(`#setup [data-a="physio"][data-x="${k}"]`);await page.waitForFunction(k=>CFG.physio===k,k,{timeout:5000});
        await page.locator(`#setup [data-a="physio"][data-x="${k}"]`).scrollIntoViewIfNeeded();
        const f=path.join(out,`${tag}-${V}-fizyo-${k}.png`);await page.screenshot({path:f});shots.push(path.basename(f));
      }
      const m=await page.evaluate(()=>{const cards=[...document.querySelectorAll('#setup [data-a="physio"]')];
        const st=el=>{if(!el)return null;const c=getComputedStyle(el);return [c.fontSize,c.fontWeight,c.color,c.lineHeight].join('|');};
        const sum=cards.map(c=>st(c.querySelector('.pcSum')||c.querySelector('small'))),fx=cards.map(c=>st(c.querySelector('.pcFx')||c.querySelector('small b')));
        const text=document.getElementById('setup').innerText;
        return {n:cards.length,sumStyles:[...new Set(sum)],fxStyles:[...new Set(fx.filter(Boolean))],noFx:fx.filter(x=>!x).length,
          code:(text.match(/\b[a-z]+(?:Cost|Mul|Flat|Cap|Bonus)\b/g)||[]),overflow:cards.filter(c=>c.scrollWidth>c.clientWidth+1||c.getBoundingClientRect().right>innerWidth+1).map(c=>c.dataset.x),
          sel:cards.filter(c=>c.classList.contains('on')).map(c=>c.dataset.x),selOutline:getComputedStyle(cards.find(c=>c.classList.contains('on'))).outlineStyle,
          aquatic:(cards.find(c=>c.dataset.x==='aquatic')||{}).innerText,avian:(cards.find(c=>c.dataset.x==='avian')||{}).innerText,detail:(document.querySelector('#setup .physioDetail')||document.querySelector('#setup .box'))?.innerText||''};});
      if(isNew){assert.equal(m.sumStyles.length,1,'özet satırı tek stil '+JSON.stringify(m.sumStyles));assert.equal(m.fxStyles.length,1,'etki satırı tek stil '+JSON.stringify(m.fxStyles));assert.equal(m.noFx,0,'her kartta etki satırı');
        assert.match(m.aquatic,/\+18 yaşanabilirlik/);assert.match(m.aquatic,/%20 üretim/);assert.match(m.avian,/Kolonileştirme maliyeti −%15/);assert.match(m.detail,/Beslenme/);assert.notEqual(m.selOutline,'none');}
      assert.deepEqual(m.code,[],'oyuncuya kod terimi gösterilmez: '+m.code.join(','));assert.deepEqual(m.overflow,[],'kart taşmaz');
      return {metrics:m,shots};});
    await test(V+' genetik özellik kartları tek tipografi; puan satırı görünür; özellik seçimi puanı değiştirir',async()=>{
      const m=await page.evaluate(()=>{const chips=[...document.querySelectorAll('#setup .tchip')];const st=el=>{if(!el)return null;const c=getComputedStyle(el);return [c.fontSize,c.fontWeight,c.lineHeight].join('|');};
        return {n:chips.length,tn:[...new Set(chips.map(c=>st(c.querySelector('.tn'))))],td:[...new Set(chips.map(c=>st(c.querySelector('.td'))))],overflow:chips.filter(c=>c.getBoundingClientRect().right>innerWidth+1).length,bar:document.querySelector('#setup .traitbar')?.innerText||''};});
      const k=await page.evaluate(()=>Object.keys(TRAITS).find(k=>canPickTrait(CFG.traits,k,CFG).ok&&TRAITS[k].c>0));const before=await page.evaluate(()=>traitCost(CFG.traits));
      await touch(`#setup [data-a="trait"][data-x="${k}"]`);await page.waitForFunction(k=>CFG.traits.includes(k),k,{timeout:5000});const after=await page.evaluate(()=>traitCost(CFG.traits));
      await page.locator(`#setup [data-a="trait"][data-x="${k}"]`).scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,`${tag}-${V}-genetik.png`)});
      if(isNew){assert.equal(m.tn.length,1,JSON.stringify(m.tn));assert.equal(m.td.length,1,JSON.stringify(m.td));}
      assert.equal(m.overflow,0);assert.match(m.bar,/PUAN/);assert.ok(after>before,'puan harcandı');
      await touch(`#setup [data-a="trait"][data-x="${k}"]`);return {metrics:m,trait:k,cost:[before,after]};});
    let previewHash=null;
    await test(V+' Görünüş arması: önizleme sekmeler arası aynı, fizyolojiye gidip dönünce değişmez, oyundaki arma ile aynı',async()=>{
      const hash=()=>page.evaluate(()=>{paintEmblems();const c=document.querySelector('#setup canvas[data-identity="setup"]');return c?c.toDataURL():null;});
      await page.evaluate(()=>{SETUP_STEP='goruns';safeRenderSetup();});await page.waitForSelector('#setup canvas[data-identity="setup"]');const a=await hash();
      await page.locator('#setup canvas[data-identity="setup"]').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,`${tag}-${V}-gorunus.png`)});
      await page.evaluate(()=>{SETUP_STEP='fizyo';safeRenderSetup();});await page.evaluate(()=>{SETUP_STEP='goruns';safeRenderSetup();});const b=await hash();
      const size=await page.evaluate(()=>{const r=document.querySelector('#setup canvas[data-identity="setup"]').getBoundingClientRect();return {w:r.width,h:r.height};});
      const pre=await page.evaluate(()=>JSON.stringify(normalizeEmblem(CFG.emblem,CFG.color||RACES[CFG.race].col,'setup')));
      await page.evaluate(()=>{SETUP_STEP='galaksi';safeRenderSetup();});await touch('#setup [data-a="start"]');await page.waitForFunction(()=>typeof G!=='undefined'&&G.p&&G.sys&&G.sys.length&&!document.getElementById('game').classList.contains('hidden'),undefined,{timeout:30000});
      const game=await page.evaluate(()=>JSON.stringify(stateEmblem(G.p)));const same=JSON.parse(game),p=JSON.parse(pre);
      previewHash=a;
      assert.equal(a,b,'önizleme sekme değişiminde aynı');assert.ok(size.w>=64,'önizleme rahat görünür: '+JSON.stringify(size));
      if(isNew)for(const k of ['shape','symbol','pattern','secondary'])assert.equal(same[k],p[k],'oyundaki arma '+k);
      return {preview:p,game:same,size};});
    await ctx.close();
    rows.push({viewport:V,errors});
  }
  /* galaksi kurulumu: şekil önizleme + çarpan + rota hatası (yalnız yeni kökte) */
  const ctx=await browser.newContext({viewport:{width:800,height:360},isMobile:true,hasTouch:true});const page=await ctx.newPage();await page.goto('http://127.0.0.1:'+server.address().port);
  await page.evaluate(()=>{resetSetupNaming();leaveTitle('setup');SETUP_STEP='galaksi';safeRenderSetup();});
  await test('galaksi sekmesi: yeni şekiller önizlemeli, çarpan seçilir; rota onarımı başarısızsa açık hata + YENİ TOHUMLA YENİDEN ÜRET',async()=>{
    if(!isNew)return {notRun:true};
    const n=await page.evaluate(()=>[...document.querySelectorAll('#setup [data-a="shape"]')].map(b=>({k:b.dataset.x,pv:!!b.querySelector('svg.shapePv'),dots:b.querySelectorAll('circle').length})));
    assert.ok(['eliptik','kumeli','cubuklu','duzensiz'].every(k=>n.some(x=>x.k===k&&x.pv&&x.dots>=40)),JSON.stringify(n));
    await page.locator('#setup [data-a="shape"][data-x="kumeli"]').tap();await page.locator('#setup [data-a="planetMul"][data-x="2"]').tap();
    assert.deepEqual(await page.evaluate(()=>[CFG.shape,CFG.planetMul]),['kumeli',2]);
    await page.locator('#setup [data-a="planetMul"][data-x="2"]').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,`${tag}-galaksi-sekil-carpan.png`)});
    await page.evaluate(()=>{window.__orig=galaxyRouteRepair;galaxyRouteRepair=c=>({ok:false,repairs:0,before:galaxyRouteAudit(c),after:galaxyRouteAudit(c),log:{sanitized:0,oneway:0,links:[]}});});
    const seed0=await page.evaluate(()=>CFG.seed);await page.locator('#setup [data-a="start"]').tap();
    await page.waitForSelector('#setupErrorBox',{timeout:8000,state:'attached'});const err=await page.locator('#setupErrorBox').innerText();
    const inGame=await page.evaluate(()=>!document.getElementById('game').classList.contains('hidden'));
    await page.screenshot({path:path.join(out,`${tag}-galaksi-rota-hatasi.png`)});
    await page.evaluate(()=>{galaxyRouteRepair=window.__orig;});await page.locator('#setup [data-a="regenGalaxy"]').tap();
    const seed1=await page.evaluate(()=>CFG.seed);await page.locator('#setup [data-a="start"]').tap();
    await page.waitForFunction(()=>!document.getElementById('game').classList.contains('hidden'),undefined,{timeout:30000});
    const r=await page.evaluate(()=>({route:LAST_GALAXY_ROUTE,mul:LAST_PLANET_MUL&&LAST_PLANET_MUL.mul,shape:G.cfg.shape}));
    await page.screenshot({path:path.join(out,`${tag}-galaksi-oyun-kumeli-2x.png`)});
    assert.match(err,/rota denetimi/);assert.equal(inGame,false,'tıkalı galaksiyle oyun başlamadı');assert.notEqual(seed1,seed0);assert.equal(r.route.ok,true);assert.equal(r.mul,2);assert.equal(r.shape,'kumeli');
    return {err,route:r.route,seeds:[seed0,seed1]};});
  await ctx.close();
  }finally{await browser.close();server.close();fs.writeFileSync(path.join(out,`pregame-${tag}.json`),JSON.stringify(rows,null,1));console.log(`GEÇEN: ${pass} KALAN: ${fail}`);if(fail)process.exitCode=1;}
}
run().catch(e=>{console.error(e);process.exitCode=1;});
