'use strict';
/* PERF.2 — gerçek Chromium V8'inde aynı Save8'den deterministik ay adımları (gerçek zaman döngüsü yok → iki kolda aynı oyun durumu).
   Sayfa = kökün index.html'i (tek oyunculu motor + arayüz yüklü), deserialize → enterGame, hız 0; sonra PERF.1 adım döngüsü
   (dailyTick/structTick/colonyBuildTick/autoExploreTick + monthTick) N ay. Ölçülen: ay başına süre (medyan/p95/en uzun), monthTick,
   aiTurn toplamı, uzun görev değil (tek senkron çağrı = ay başına bir "takılma"), son Save8 SHA-256 + RNG.
   Kullanım: node browser-months.cjs <root> <save.json> <months> [warm=1] */
const fs=require('fs'),path=require('path'),http=require('http'),crypto=require('crypto'),{chromium}=require('playwright');
const [rootArg,saveFile,months,warm='1']=process.argv.slice(2),root=path.resolve(rootArg),save=fs.readFileSync(saveFile,'utf8');
const server=http.createServer((q,r)=>{const n=new URL(q.url,'http://localhost').pathname,f=path.resolve(root,'.'+(n==='/'?'/index.html':n));if(!f.startsWith(root+path.sep))return r.writeHead(403).end();
  fs.readFile(f,(e,b)=>{if(e)return r.writeHead(404).end();const ext=path.extname(f);r.writeHead(200,{'content-type':ext==='.html'?'text/html':ext==='.js'?'text/javascript':ext==='.json'?'application/json':'application/octet-stream'});r.end(b);});});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const browser=await chromium.launch({executablePath:process.env.STARS_CHROMIUM_PATH||'/opt/pw-browsers/chromium',args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage']});
  const p=await (await browser.newContext({viewport:{width:1280,height:720}})).newPage();const errors=[];p.on('pageerror',e=>errors.push(String(e)));
  await p.goto('http://127.0.0.1:'+server.address().port);await p.waitForFunction(()=>typeof UI!=='undefined'&&typeof deserialize==='function');
  await p.evaluate(s=>{if(!deserialize(s))throw Error('load');document.getElementById('title').classList.add('hidden');enterGame(true);UI.setSpeed(0);UI.closeModal();G.autoSave=false;G.speed=0;},save);
  const r=await p.evaluate(({months,warm})=>{
    const step=()=>{const b=Math.floor(G.day/30);for(let i=0;i<60;i++){G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();if(Math.floor(G.day/30)>b){monthTick();break;}}};
    const mt=[],ai=[];const m0=monthTick,a0=aiTurn;let aiAcc=0;
    monthTick=function(){const t=performance.now();try{return m0.apply(this,arguments);}finally{mt.push(performance.now()-t);}};
    aiTurn=function(){const t=performance.now();try{return a0.apply(this,arguments);}finally{aiAcc+=performance.now()-t;}};
    for(let i=0;i<warm;i++){step();UI.closeModal();}mt.length=0;
    const per=[];for(let i=0;i<months;i++){aiAcc=0;const t=performance.now();step();per.push(performance.now()-t);ai.push(aiAcc);UI.closeModal();}
    monthTick=m0;aiTurn=a0;
    const st=a=>{const s=[...a].sort((x,y)=>x-y),q=f=>+s[Math.min(s.length-1,Math.floor(f*s.length))].toFixed(1);return {n:s.length,med:q(.5),p95:q(.95),max:+s[s.length-1].toFixed(1)};};
    return {step:st(per),monthTick:st(mt),aiTurnPerMonth:st(ai),save8:serialize(),rng:String(RND_STATE),heapMB:performance.memory?Math.round(performance.memory.usedJSHeapSize/1048576):null};
  },{months:+months,warm:+warm});
  r.save8=crypto.createHash('sha256').update(r.save8).digest('hex');r.errors=errors;r.root=path.basename(root);r.save=path.basename(saveFile);
  process.stdout.write(JSON.stringify(r)+'\n');await browser.close();server.close();})().catch(e=>{console.error(e);process.exit(1);});
