'use strict';
/* MP-FIELD-FIX.0 — tek oyunculu ana menü "Oyuna Devam Et" yolu (saha: kayıttan tek başına devamda olay penceresi boş).
   S1 (844×390, gerçek Chromium + PWA): oyunda bekleyen (açık), pencereden kapatılmış (bekleyen) ve kaydırılarak gizlenmiş olay → oyun içi kayıt →
   sayfa yeniden yüklenir → ana menü OYUNA DEVAM ET (gerçek dokunuş) → bekleyen olaylar şeritte, gizlenen ☰ listesinde; gerçek oyun döngüsünde
   tarih ilerler; deterministik tetikleyiciyle üretilen yeni olay ve anomali şeritte ve listede görünür; karar bir kez uygulanır. */
const path=require('path'),fs=require('fs'),assert=require('assert/strict');
const {chromium}=require(require.resolve('playwright',{paths:[path.join(__dirname,'node_modules'),__dirname]}));
const root=path.resolve(process.env.STARS_ROOT||path.join(__dirname,'..')),out=path.resolve(process.env.STARS_OUTPUT||path.join(__dirname,'../reports/claude/evidence/mp-field-fix0/browser-sp'));fs.mkdirSync(out,{recursive:true});
const results=[];let pass=0,fail=0;
async function test(name,fn){try{const r=await fn();results.push({name,status:'PASS',...(r||{})});pass++;console.log('PASS '+name);}catch(e){results.push({name,status:'FAIL',error:String(e&&e.stack||e).slice(0,2000)});fail++;console.log('FAIL '+name+'\n'+(e&&e.stack||e));}}
(async()=>{
 const http=require('http'),srv=http.createServer((q,r)=>{const u=decodeURIComponent(new URL(q.url,'http://x').pathname),f=path.join(root,u==='/'?'index.html':u.replace(/^\/+/,''));if(!f.startsWith(root)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.writeHead(404);return r.end();}
   const t={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json','.css':'text/css','.webmanifest':'application/manifest+json'}[path.extname(f)]||'application/octet-stream';r.writeHead(200,{'Content-Type':t});fs.createReadStream(f).pipe(r);});
 await new Promise(r=>srv.listen(0,'127.0.0.1',r));const url='http://127.0.0.1:'+srv.address().port+'/';
 const browser=await chromium.launch({executablePath:process.env.STARS_CHROMIUM_PATH||undefined,args:['--no-sandbox','--disable-gpu']});
 try{const ctx=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true,deviceScaleFactor:1});const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  const tap=async sel=>{const l=page.locator(sel).first();await l.scrollIntoViewIfNeeded();await l.tap();await page.waitForTimeout(200);};
  const cardsOf=()=>page.evaluate(()=>{UI.drawInbox();return [...document.querySelectorAll('#inbox .nCard')].map(c=>(c.querySelector('.nTxt b')||c).textContent.trim());});
  const statusList=()=>page.evaluate(()=>{UI.act('topStatus');const t=document.getElementById('modal').innerText;UI.closeModal();return t;});
  await test('S1 tek oyunculu OYUNA DEVAM ET: bekleyen / kapatılmış / gizlenmiş olay kayıttan doğru döner; tarih ilerlerken yeni olay ve anomali şeritte ve listede; karar bir kez',async()=>{
   await page.goto(url);await page.evaluate(()=>{try{localStorage.clear();}catch{}resetSetupNaming();leaveTitle('setup');Object.assign(CFG,{seed:22,size:'orta',aiCount:5,pirates:false});startGame();});
   await page.waitForFunction(()=>typeof G!=='undefined'&&G.p&&!document.getElementById('game').classList.contains('hidden'),undefined,{timeout:60000});
   await page.evaluate(()=>{for(let i=0;i<6&&!document.getElementById('modal').classList.contains('hidden');i++){if(document.querySelector('#modal [data-a="advClose"]'))UI.act('advClose');else UI.closeModal();}UI.setSpeed(0);});
   const pre=await page.evaluate(()=>{AUTO_EVENT=false;const evs=EVENTS.filter(e=>e.ch&&e.ch.length>1&&!e.chain);const [a,b,c]=evs;
     UI.event(a);UI.event(b);UI.event(c);UI.closeModal();const nb=G.inbox.find(n=>n.key==='ev:'+b.id);UI.noteSwipe(nb.uid);
     return {a:a.n,b:b.n,c:c.n,ida:a.id,keys:G.inbox.map(n=>[n.key,!!n.hidden]),day:Math.floor(G.day)};});
   const before=await cardsOf();assert(before.includes(pre.a)&&before.includes(pre.c)&&!before.includes(pre.b),'kayıttan önce şerit '+JSON.stringify(before));
   /* a: olay penceresi kayıt anında AÇIK (gerçek dokunuşla açıldı, karar verilmedi) */
   await page.evaluate(k=>UI.act('openNote',G.inbox.find(n=>n.key===k).uid),'ev:'+pre.ida);await page.waitForSelector('#modal [data-a="evch"]');   /* kart dokunuşunun eylemi */
   const sv=await page.evaluate(async()=>{const day=Math.floor(G.day);return {ok:await saveGame(),day};});assert.equal(sv.ok,true,'oyun içi kayıt (olay penceresi açıkken)');pre.day=sv.day;
   await page.reload();await page.waitForFunction(()=>typeof G!=='undefined'&&document.querySelector('#title [data-a="tCont"]'),undefined,{timeout:60000});await page.screenshot({path:path.join(out,'s1-ana-menu.png')});
   await tap('#title [data-a="tCont"]');await page.waitForFunction(()=>G.p&&!document.getElementById('game').classList.contains('hidden'),undefined,{timeout:60000});
   await page.evaluate(()=>{for(let i=0;i<6&&!document.getElementById('modal').classList.contains('hidden');i++){if(document.querySelector('#modal [data-a="advClose"]'))UI.act('advClose');else UI.closeModal();}});
   const after=await page.evaluate(()=>({day:Math.floor(G.day),keys:G.inbox.map(n=>[n.key,!!n.hidden])}));
   assert(after.day>=pre.day&&after.day<=pre.day+1,'kayıt tarihi korunur (yükleme sonrası oyun kayıtlı hızla sürer; ≤1 gün): '+pre.day+' → '+after.day);for(const k of pre.keys)assert(after.keys.some(x=>x[0]===k[0]&&x[1]===k[1]),'olay durumu korunur: '+JSON.stringify(k));
   const vis=await cardsOf(),list=await statusList();await page.screenshot({path:path.join(out,'s1-devam-olaylar.png')});
   assert(vis.includes(pre.a)&&vis.includes(pre.c),'bekleyen olaylar şeritte: '+JSON.stringify(vis));assert(!vis.includes(pre.b),'gizlenen şeritte değil');assert(list.includes(pre.b),'gizlenen ☰ listesinde');
   /* gerçek oyun döngüsü: tarih ilerler (kartların duraklatması kapalı) */
   await page.evaluate(()=>{for(const n of G.inbox)n.pause=false;UI.setSpeed(4);});await page.waitForFunction(d=>G.day>=d+3,pre.day,{timeout:60000});await page.evaluate(()=>UI.setSpeed(0));
   const neu=await page.evaluate(()=>{const evs=EVENTS.filter(e=>e.ch&&e.ch.length>1&&!e.chain);const d=evs[3];UI.event(d);UI.closeModal();const an=ANOMALIES.find(a=>a.ch&&a.ch.length>1)||ANOMALIES[0];const s=G.sys[G.p.home];UI.anomaly(an,s);UI.closeModal();return {ev:d.n,sys:s.name,day:Math.floor(G.day)};});
   const vis2=await cardsOf(),list2=await statusList();await page.screenshot({path:path.join(out,'s1-yeni-olay.png')});
   assert(neu.day>pre.day);assert(vis2.includes(neu.ev),'yeni olay şeritte '+JSON.stringify(vis2));assert(vis2.some(t=>t.includes(neu.sys)),'yeni anomali şeritte');assert(list2.includes(neu.ev),'yeni olay listede');
   /* gizlenen olay listeden açılır, karar bir kez */
   const uid=await page.evaluate(k=>G.inbox.find(n=>n.key===k).uid,'ev:'+(await page.evaluate(b=>EVENTS.find(e=>e.n===b).id,pre.b)));
   await page.evaluate(u=>UI.act('openNote',u),uid);await page.waitForSelector('#modal [data-a="evch"]');await tap('#modal [data-a="evch"][data-x="0"]');
   const gone=await page.evaluate(u=>!G.inbox.some(n=>n.uid===u),uid);assert.equal(gone,true,'karar uygulandı, kayıt kalktı');
   assert.deepEqual(errors,[],errors.join('\n'));return {pre,after,vis,neu,vis2};});
 }finally{await browser.close();srv.close();fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,1));console.log(`GEÇEN: ${pass} KALAN: ${fail}`);process.exitCode=fail?1:0;}
})();
