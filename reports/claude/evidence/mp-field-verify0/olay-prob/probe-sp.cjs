'use strict';
/* doğal olay üretimi: gerçek döngü, varsayılan ayar; her UI.event/chain/anomaly/notify kaydı; sonra her kart açılır, pencere içeriği ölçülür */
const path=require('path'),fs=require('fs');
const {chromium}=require(require.resolve('playwright',{paths:['/home/user/Star/tests/node_modules']}));
const root=path.resolve(process.argv[2]||'/home/user/Star'),months=+(process.argv[3]||36),auto=process.env.AUTO==='1',rnd=process.env.RE!=='0';
(async()=>{
 const http=require('http'),srv=http.createServer((q,r)=>{const u=decodeURIComponent(new URL(q.url,'http://x').pathname),f=path.join(root,u==='/'?'index.html':u.replace(/^\/+/,''));if(!f.startsWith(root)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.writeHead(404);return r.end();}
   const t={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json'}[path.extname(f)]||'application/octet-stream';r.writeHead(200,{'Content-Type':t});fs.createReadStream(f).pipe(r);});
 await new Promise(r=>srv.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox']});
 const page=await (await browser.newContext({viewport:{width:844,height:390}})).newPage();const errs=[];page.on('pageerror',e=>errs.push(e.message));
 await page.goto('http://127.0.0.1:'+srv.address().port+'/');
 await page.evaluate(([auto,rnd,H])=>{window.__H=H;try{localStorage.clear();if(auto)localStorage.setItem('yh_autoev','on');}catch{}resetSetupNaming();leaveTitle('setup');Object.assign(CFG,{seed:22,size:'orta',aiCount:5,randomEvents:rnd});if(window.__H)CFG.humans=[{race:Object.keys(RACES)[3],name:'Misafir Birliği',color:'#33cc88'}];startGame();AUTO_EVENT=auto;},[auto,rnd,process.env.H==='1']);
 await page.waitForFunction(()=>G.p&&!document.getElementById('game').classList.contains('hidden'),undefined,{timeout:60000});
 if(process.env.RELOAD==='1'){await page.evaluate(async()=>{UI.setSpeed(0);return saveGame();});await page.reload();await page.waitForFunction(()=>typeof G!=='undefined'&&document.querySelector('#title [data-a="tCont"]'),undefined,{timeout:60000});await page.evaluate(()=>{document.querySelector('#title [data-a="tCont"]').click();});await page.waitForFunction(()=>G.p&&!document.getElementById('game').classList.contains('hidden'),undefined,{timeout:60000});console.log('reloaded',await page.evaluate(()=>({humans:(G.cfg.humans||[]).length,ai:G.emps.map(e=>e.ai)})));}
 const res=await page.evaluate(async months=>{
   const log=[];for(const k of ['event','chain','anomaly','notify']){const f=UI[k];UI[k]=function(){const a=arguments;log.push({k,day:Math.floor(G.day),arg:k==='notify'?(a[0]&&a[0].kind):(a[0]&&(a[0].id||a[0].n||a[0]))});return f.apply(this,a);};}
   const m0=G.year*12+G.month;let opened=[];
   /* hızlı ilerletme: gerçek monthTick'e giden döngü, kartlar açıldıkça kapatılmaz (şeritte birikir) */
   UI.setSpeed(0);for(let i=0;i<months*31*2&&G.year*12+G.month<m0+months&&!G.over;i++){const days=.5,pm=Math.floor(G.day/30);G.day+=days;dailyTick(days);structTick(days);colonyBuildTick(days);autoExploreTick();if(Math.floor(G.day/30)>pm)monthTick();if(i%40===0)await new Promise(r=>setTimeout(r,0));}
   return {cfg:{re:G.cfg.randomEvents,auto:AUTO_EVENT},log,inbox:(G.inbox||[]).map(n=>({uid:n.uid,kind:n.kind,key:n.key,title:n.title})),day:G.day};
 },months);
 console.log(JSON.stringify({cfg:res.cfg,n:res.log.length,kinds:res.log.reduce((a,x)=>(a[x.k+':'+(x.k==='notify'?x.arg:'')]=(a[x.k+':'+(x.k==='notify'?x.arg:'')]||0)+1,a),{}),inbox:res.inbox.map(n=>n.kind+':'+n.title)}));
 const ev=res.inbox.filter(n=>['event','chain','anomaly'].includes(n.kind));
 for(const n of ev){const r=await page.evaluate(u=>{UI.act('openNote',u);const m=document.getElementById('modal');const t=m.classList.contains('hidden')?'(gizli)':m.innerText.trim();const ch=m.querySelectorAll('[data-a="evch"],[data-a="chch"],[data-a="anch"],button').length;UI.stashNote&&UI.stashNote();UI.closeModal();return {len:t.length,ch,head:t.slice(0,80)};},n.uid);console.log(n.kind,n.title,JSON.stringify(r));}
 console.log('errs',errs.slice(0,5));await browser.close();srv.close();
})();
