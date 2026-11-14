'use strict';
/* BETA-GALAXY.0 — tek oyunculu arka plan dönüşü (gerçek Chromium, dar yatay 800×360 dokunma + 1280×720).
   EMÜLASYON (açıkça): headless/Xvfb Chromium bu ortamda gerçek sekme/pencere arka planı üretmiyor (bringToFront ve küçültme
   visibilityState'i değiştirmedi, ölçüldü). Bu yüzden document.visibilityState 'hidden' → 'visible' olarak tanımlanır ve gerçek
   visibilitychange / pagehide / pageshow / focus olayları gönderilir; oyunun KENDİ kurtarma zinciri (scheduleRecovery → runRecovery)
   çalışır. Arka plandayken "GPU yedek belleği bırakıldı" durumu, DOM gezegen tuvalleri + ART önbellek tuvalleri + #map pikselleri
   silinerek simüle edilir; önbellek NESNELERİ yerinde bırakılır (yalnız piksel silmek değil: oyunun önbelleği kendisi yenilemeli).
   Ayrıca panel tuvaline gerçek 'contextrestored' olayı gönderilir. Fiziksel Android: NOT RUN.
   Denetim: 3 ardışık dönüş + açık sistem/gezegen paneli + kayıttan yükleme sonrası 1 dönüş; her dönüşte gezegen küçük resimleri,
   bölge armaları ve harita pikselleri geri gelir; kamera, yakınlaştırma, seçim, sekme ve Save8 değişmez (oyun duraklatılmış). */
const assert=require('node:assert/strict'),{createServer}=require('node:http'),{readFile}=require('node:fs'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{chromium}=require('playwright');
const root=path.resolve(process.env.STARS_ROOT||path.join(__dirname,'..')),out=process.env.STARS_OUTPUT||'/tmp/stars-bgreturn-galaxy0';fs.mkdirSync(out,{recursive:true});
const server=createServer((req,res)=>{const p=new URL(req.url,'http://localhost').pathname,file=path.resolve(root,'.'+(p==='/'?'/index.html':p));if(!file.startsWith(root+path.sep))return res.writeHead(403).end();
  readFile(file,(e,d)=>{if(e)return res.writeHead(404).end();res.setHeader('Content-Type',{'.js':'text/javascript','.html':'text/html'}[path.extname(file)]||'application/json');res.end(d);});});
let pass=0,fail=0;const rows=[];
function simDiff(x,y){const a=JSON.parse(x),b=JSON.parse(y),d=[];const walk=(p,q,k)=>{if(d.length>8||JSON.stringify(p)===JSON.stringify(q))return;if(p&&q&&typeof p==='object'&&typeof q==='object'){for(const kk of new Set([...Object.keys(p),...Object.keys(q)]))walk(p[kk],q[kk],k+'.'+kk);return;}d.push(k+': '+JSON.stringify(p)+' -> '+JSON.stringify(q));};walk(a,b,'');return d.join(' | ');}
async function test(name,fn){try{const r=await fn();rows.push({name,status:'PASS',...(r||{})});pass++;console.log('PASS '+name);}catch(e){rows.push({name,status:'FAIL',error:String(e&&e.stack||e)});fail++;console.log('FAIL '+name+'\n'+(e&&e.stack||e));}}
function setup(){
  setupGame({...CFG,seed:22,size:'orta',aiCount:5});G.autoSave=false;$('title').classList.add('hidden');enterGame(true);LOOP.on=false;UI.setSpeed(0);UI.closeModal();
  for(const s of G.sys){if(!s.seen.includes(0))s.seen.push(0);if(!s.surv.includes(0))s.surv.push(0);}for(const e of G.emps)if(e.id)G.p.contact[e.id]=true;updateVision();
  const h=G.sys[G.p.home];View.sel=null;View.selSys=h;View.cam.x=h.x;View.cam.y=h.y;View.cam.z=Math.max(View.cam.z||1,.9);UI.tab('sistem');UI.refresh();forceRedraw('test');UI.setSpeed(0);
}
const state=()=>({cam:{x:Math.round(View.cam.x),y:Math.round(View.cam.y),z:+View.cam.z.toFixed(4)},sel:View.selSys&&View.selSys.id,tab:UI.curTab||document.querySelector('#tabs .on')?.dataset?.x||null,speed:G.speed,day:G.day,
  pspr:[...document.querySelectorAll('#panel .pOrb')].map(o=>{const c=getComputedStyle(o),r=o.getBoundingClientRect();return /radial-gradient/.test(c.backgroundImage)&&c.backgroundColor!=='rgba(0, 0, 0, 0)'&&r.width>20&&r.height>20?100:0;}),
  emblems:(View._emblemPlaced||[]).length,
  map:(()=>{const c=$('map');const g=c.getContext('2d');const w=c.width,h=c.height,d=g.getImageData(0,0,w,h).data;let n=0;for(let i=0;i<d.length;i+=4*97)if(d[i]+d[i+1]+d[i+2]>30)n++;return n;})()});
async function cycle(page,label){
  /* arka plan: gizli + piksel kaybı (önbellek nesneleri yerinde) */
  await page.evaluate(()=>{
    Object.defineProperty(document,'visibilityState',{configurable:true,get:()=>'hidden'});Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});
    window.dispatchEvent(new Event('pagehide'));document.dispatchEvent(new Event('visibilitychange'));
    const wipe=c=>{try{const g=c.getContext('2d');g.clearRect(0,0,c.width,c.height);}catch{}};
    for(const c of document.querySelectorAll('canvas'))wipe(c);
    for(const k of ['cache','identityCache','portraitCache'])for(const v of (ART[k]?.values?.()||[]))if(v&&v.getContext)wipe(v);
    {const c=$('map'),d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let n=0;for(let i=0;i<d.length;i+=4*97)if(d[i]+d[i+1]+d[i+2]>30)n++;window.__wiped=n===0;}
  });
  await page.waitForTimeout(600);
  const hidden={pspr:await page.evaluate(()=>window.__wiped)};
  await page.evaluate(()=>{delete document.visibilityState;delete document.hidden;
    document.dispatchEvent(new Event('visibilitychange'));window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}));window.dispatchEvent(new Event('focus'));});
  await page.waitForFunction(()=>{const c=$('map'),d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let n=0;for(let i=0;i<d.length;i+=4*97)if(d[i]+d[i+1]+d[i+2]>30)n++;return n>200;},undefined,{timeout:8000}).catch(()=>{});
  await page.waitForTimeout(500);
  return {label,hiddenBlank:hidden.pspr};
}
async function run(){
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const browser=await chromium.launch({executablePath:process.env.STARS_CHROMIUM_PATH,args:['--no-sandbox','--disable-dev-shm-usage']});
  try{for(const [w,h,mobile] of [[800,360,true],[1280,720,false]]){
    const ctx=await browser.newContext({viewport:{width:w,height:h},isMobile:mobile,hasTouch:mobile});const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));const V=w+'x'+h;
    await page.goto('http://127.0.0.1:'+server.address().port);await page.evaluate(setup);await page.waitForTimeout(1200);
    const base=await page.evaluate(new Function('return ('+state.toString()+')()'));
    const sha0=await page.evaluate(()=>(o=>JSON.stringify({day:o.day,rs:o.rs,sys:o.sys,fl:o.fl,emps:o.emps}))(JSON.parse(serialize())));
    await page.screenshot({path:path.join(out,V+'-once.png')});
    await test(V+' başlangıç: açık sistem panelinde gezegen küçük resimleri, haritada bölge armaları ve yıldızlar çizili',async()=>{
      assert.ok(base.pspr.length>0&&base.pspr.every(n=>n>40),JSON.stringify(base.pspr));assert.ok(base.map>200);return {base};});
    for(let i=1;i<=3;i++)await test(V+' arka plan dönüşü #'+i+': gezegen görselleri + armalar + harita geri gelir; kamera / yakınlaştırma / seçim / sekme / dünya korunur',async()=>{
      const c=await cycle(page,'dönüş '+i);const s=await page.evaluate(new Function('return ('+state.toString()+')()'));const sha=await page.evaluate(()=>(o=>JSON.stringify({day:o.day,rs:o.rs,sys:o.sys,fl:o.fl,emps:o.emps}))(JSON.parse(serialize())));
      if(i===3)await page.screenshot({path:path.join(out,V+'-donus3.png')});
      assert.equal(c.hiddenBlank,true,'arka planda harita pikselleri gerçekten silindi (simülasyon)');
      assert.ok(s.pspr.length===base.pspr.length&&s.pspr.every(n=>n>40),'gezegen küçük resimleri geri geldi '+JSON.stringify(s.pspr));
      assert.ok(s.map>base.map*.5,'harita yeniden çizildi '+s.map+'/'+base.map);assert.equal(s.emblems,base.emblems,'bölge armaları');
      assert.deepEqual(s.cam,base.cam);assert.equal(s.sel,base.sel);assert.equal(s.tab,base.tab);assert.equal(s.speed,base.speed);assert.ok(sha===sha0,'oyun durumu değişmedi: '+simDiff(sha0,sha));
      return {cycle:c,state:s};});
    await test(V+' paneldeki arma tuvaline gerçek contextrestored olayı → tuval yeniden boyanır',async()=>{
      const r=await page.evaluate(async()=>{let c=document.querySelector('#panel canvas[data-identity="state"]');if(!c){c=document.createElement('canvas');c.width=c.height=48;c.dataset.identity='state';c.dataset.id=String(G.p.id);$('panel').prepend(c);paintEmblems();}
        c.getContext('2d').clearRect(0,0,c.width,c.height);c.dispatchEvent(new Event('contextrestored'));await new Promise(r=>setTimeout(r,50));
        const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let n=0;for(let i=3;i<d.length;i+=4)if(d[i])n++;return n;});
      assert.ok(r>40,'yeniden boyandı '+r);return {pixels:r};});
    await test(V+' kayıttan yükleme sonrası bir dönüş: görseller geri gelir, yüklenen dünya korunur',async()=>{
      await page.evaluate(()=>{const t=serialize();deserialize(t);enterGame(true);LOOP.on=false;UI.closeModal();const h=G.sys[G.p.home];View.selSys=h;View.cam.x=h.x;View.cam.y=h.y;UI.tab('sistem');UI.refresh();forceRedraw('test-load');UI.setSpeed(0);});
      await page.waitForTimeout(900);const b=await page.evaluate(new Function('return ('+state.toString()+')()'));const sha1=await page.evaluate(()=>(o=>JSON.stringify({day:o.day,rs:o.rs,sys:o.sys,fl:o.fl,emps:o.emps}))(JSON.parse(serialize())));
      const c=await cycle(page,'yükleme sonrası');const s=await page.evaluate(new Function('return ('+state.toString()+')()'));const sha2=await page.evaluate(()=>(o=>JSON.stringify({day:o.day,rs:o.rs,sys:o.sys,fl:o.fl,emps:o.emps}))(JSON.parse(serialize())));
      await page.screenshot({path:path.join(out,V+'-yukleme-donus.png')});
      assert.ok(s.pspr.length&&s.pspr.every(n=>n>40),JSON.stringify(s.pspr));assert.deepEqual(s.cam,b.cam);assert.equal(s.sel,b.sel);assert.ok(sha2===sha1,'yüklenen dünya korunur: '+simDiff(sha1,sha2));return {cycle:c,state:s};});
    await test(V+' sayfa hatası yok',async()=>{assert.deepEqual(errors,[]);});
    await ctx.close();
  }}finally{await browser.close();server.close();fs.writeFileSync(path.join(out,'bgreturn.json'),JSON.stringify(rows,null,1));console.log(`GEÇEN: ${pass} KALAN: ${fail}`);if(fail)process.exitCode=1;}
}
run().catch(e=>{console.error(e);process.exitCode=1;});
