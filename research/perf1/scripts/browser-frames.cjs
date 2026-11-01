'use strict';
/* PERF.1 — gerçek Chromium'da (Playwright, --disable-gpu: yazılım çizimi; GPU/fiziksel Android DEĞİL) kare süresi.
   Aynı Save8 yüklenir (deserialize → enterGame), gerçek requestAnimationFrame döngüsü (frame → simülasyon + View.draw) çalışır.
   Kollar: hız 0 (yalnız çizim) / hız 4 (10 gün/sn: simülasyon + aylık AI turu), sensör paylaşımı kapalı / açık
   (fikstür: e.shareVis — oyuncu temaslı ve barıştaki her devletle), uzak / yakın kamera.
   Ölçülen: rAF aralıkları (ortalama, medyan, p95, p99, en kötü, ~FPS), View.draw süresi, görünür sistem/filo.
   Kullanım: node browser-frames.cjs <root> <save.json> <out.json> [seconds=10] */
const fs=require('fs'),path=require('path'),http=require('http'),{chromium}=require('playwright');
const [rootArg,saveFile,outFile,secs='10']=process.argv.slice(2),root=path.resolve(rootArg),save=fs.readFileSync(saveFile,'utf8');
const server=http.createServer((q,r)=>{const n=new URL(q.url,'http://localhost').pathname,f=path.resolve(root,'.'+(n==='/'?'/index.html':n));if(!f.startsWith(root+path.sep))return r.writeHead(403).end();
  fs.readFile(f,(e,b)=>{if(e)return r.writeHead(404).end();const ext=path.extname(f);r.writeHead(200,{'content-type':ext==='.html'?'text/html':ext==='.js'?'text/javascript':ext==='.json'?'application/json':'application/octet-stream'});r.end(b);});});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const browser=await chromium.launch({executablePath:process.env.STARS_CHROMIUM_PATH||'/opt/pw-browsers/chromium',args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage']});
  const out={root:path.basename(root),save:path.basename(saveFile),seconds:+secs,arms:[]};
  for(const arm of [{speed:0,share:false,zoom:'far'},{speed:0,share:true,zoom:'far'},{speed:0,share:true,zoom:'near'},{speed:4,share:false,zoom:'far'},{speed:4,share:true,zoom:'far'}]){
    const ctx=await browser.newContext({viewport:{width:1280,height:720}}),p=await ctx.newPage();const errors=[];p.on('pageerror',e=>errors.push(String(e)));
    await p.goto('http://127.0.0.1:'+server.address().port);await p.waitForFunction(()=>typeof UI!=='undefined'&&typeof deserialize==='function');
    await p.evaluate(s=>{if(!deserialize(s))throw Error('load');document.getElementById('title').classList.add('hidden');enterGame(true);UI.setSpeed(0);UI.closeModal();G.autoSave=false;},save);
    const r=await p.evaluate(async({arm,secs})=>{
      if(arm.share){const P=G.p;P.shareVis=P.shareVis||{};for(const o of G.emps){if(o===P||o.dead||o.wild||!P.contact[o.id]||P.war[o.id])continue;P.shareVis[o.id]=true;o.shareVis=o.shareVis||{};o.shareVis[P.id]=true;}if(typeof refreshSharedVision==='function')refreshSharedVision();updateVision();}
      if(View.fit)View.fit();if(arm.zoom==='near'){const h=G.sys[G.p.home];View.cam.x=h.x;View.cam.y=h.y;View.cam.z=1.0;}
      View.dirty=true;const d0=View.draw,draws=[];View.draw=function(){const t=performance.now();try{return d0.apply(this,arguments);}finally{draws.push(performance.now()-t);}};
      UI.closeModal();UI.setSpeed(arm.speed);G.speed=arm.speed;
      await new Promise(r=>setTimeout(r,1500));draws.length=0;   // ısınma
      const iv=[];let last=null,stop=false;const day0=G.day;await new Promise(res=>{const tick=t=>{if(last!==null)iv.push(t-last);last=t;if(!stop)requestAnimationFrame(tick);};requestAnimationFrame(tick);setTimeout(()=>{stop=true;res();},secs*1000);});
      View.draw=d0;UI.setSpeed(0);const s=[...iv].sort((a,b)=>a-b),q=f=>+s[Math.min(s.length-1,Math.floor(f*s.length))].toFixed(1),ds=[...draws].sort((a,b)=>a-b),dq=f=>ds.length?+ds[Math.min(ds.length-1,Math.floor(f*ds.length))].toFixed(2):null;
      const vis=new Set(G.vis||[]);if(G._sensorVision)for(const v of G._sensorVision.values())for(const id of v)vis.add(id);
      return {frames:iv.length,fps:+(iv.length/secs).toFixed(1),meanMs:+(iv.reduce((a,b)=>a+b,0)/iv.length).toFixed(1),medianMs:q(.5),p95Ms:q(.95),p99Ms:q(.99),maxMs:+s[s.length-1].toFixed(1),
        over50:iv.filter(x=>x>50).length,over250:iv.filter(x=>x>250).length,draw:{median:dq(.5),p95:dq(.95),max:dq(1)},daysAdvanced:+(G.day-day0).toFixed(1),visibleSystems:vis.size,
        visibleFleets:G.fleets.filter(f=>f.ships.length&&(f.e===0||vis.has(f.sys>=0?f.sys:(f.mv?f.mv.to:-1)))).length};},{arm,secs:+secs});
    out.arms.push({...arm,...r,errors});process.stderr.write(JSON.stringify({...arm,...r})+'\n');await ctx.close();}
  await browser.close();server.close();fs.writeFileSync(outFile,JSON.stringify(out,null,1));})().catch(e=>{console.error(e);process.exit(1);});
