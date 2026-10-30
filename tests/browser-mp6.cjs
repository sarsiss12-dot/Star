'use strict';
/* MP.6 — misafirde GERÇEK STARS arayüzü (aynı index.html, aynı map.js/ui.js/main.js), ayna dünya ile. Ayrı Chromium süreçleri:
   host (915×412), misafir B (844×390), misafir C (960×540) ve tek oyunculu referans sayfası (aynı ayna dünyayı motorun
   deserialize()'ıyla açan düz STARS sayfası). Dünya seed 22, orta, 5 AI; B = 3, C = 5.
   FİKSTÜR (açıkça): siyasi başlangıç (temas, Etki/kaynak) — MP.3/MP.4 testleriyle aynı. Sonraki her adım gerçek dokunma ya da
   gerçek MP komutudur. Yerel relay; gerçek internet ve fiziksel Android DEĞİL. Çıktı: $STARS_OUTPUT/mp6-results.json + PNG. */
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),out=path.resolve(process.env.STARS_OUTPUT||path.join(root,'../evidence/mp6'));fs.mkdirSync(out,{recursive:true});
const relayMod=require('../research/mp1/server/relay.js');
let napi=null;try{napi=require(require.resolve('@napi-rs/canvas',{paths:[__dirname,path.join(__dirname,'node_modules')]}));}catch{}
const results=[],errors=[],metrics={pixel:{},perf:{},layout:{},blocked:{},notes:[]};
const launch={executablePath:process.env.STARS_CHROMIUM_PATH||undefined,args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--enable-precise-memory-info']};
const PHONE=(w,h)=>({viewport:{width:w,height:h},isMobile:true,hasTouch:true,deviceScaleFactor:2});
const LAND=[[844,390],[915,412],[960,540]];
const B=3,C=5;
let tno=0;const UNTIL=+(process.env.MP6_UNTIL||1e9);
async function test(name,fn){if(++tno>UNTIL)return;const t0=Date.now();try{await fn();results.push({name,status:'PASS',ms:Date.now()-t0});console.log('PASS '+name);if(process.env.MP6_DBG&&H)console.log('  dbg',await H.evaluate(()=>JSON.stringify({sp:G.speed,day:G.day,c53:G.emps[5].contact[3],c35:G.emps[3].contact[5]})));}
  catch(e){results.push({name,status:'FAIL',error:String(e&&e.stack||e).slice(0,1600)});console.log('FAIL '+name+'\n'+(e&&e.stack||e));}}
const wait=(p,fn,arg,timeout=25000)=>p.waitForFunction(fn,arg,{timeout,polling:80});
const shot=(p,n)=>p.screenshot({path:path.join(out,n+'.png')}).catch(()=>{});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const POLITICS=`(()=>{for(const e of G.emps)if(!e.wild){for(const k of ['etk','ene','min','ala'])e.res[k]=Math.max(e.res[k],2000);}
  for(const a of [0,1,2,3,4,5])for(const b of [0,1,2,3,4,5])if(a!==b){G.emps[a].contact[b]=true;G.emps[a].rel[b]=60;}
  for(const id of [0,1,2,3,4,5]){recalcMods(G.emps[id]);G.emps[id]._powAt=-1;}MP1Host.host.publish();})()`;
/* host'un bir sonraki aynası misafirde kurulana kadar bekle */
async function synced(H,p){await H.evaluate(()=>MP1Host.host.publish());const d=await H.evaluate(()=>G.day);
  try{await wait(p,d=>typeof G!=='undefined'&&Math.abs(G.day-d)<1e-9&&!MP6Stars.S.timer,d,15000);}
  catch(e){throw Error('sync '+d+' '+JSON.stringify(await p.evaluate(()=>({g:typeof G!=='undefined'&&G.day,m:MP6Stars.S.mirror&&MP6Stars.S.mirror.day,st:MP6Stars.S.stats,t:!!MP6Stars.S.timer,ws:MP1Join.ws&&MP1Join.ws.readyState,diag:DIAG.slice(-3)}))));}}
async function sync6(H,p){await H.evaluate(()=>MP1Host.host.publish());const d=await H.evaluate(()=>Math.floor(G.day));await wait(p,d=>MP1Join.game.clock&&MP1Join.game.clock.day===d&&MP1Join.game.view,d);}
async function tapEl(p,sel){await p.locator(sel).first().tap();}
async function tapWorld(p,sysId){const pt=await p.evaluate(id=>{const s=G.sys[id],q=View.w2s(s.x,s.y),r=document.getElementById('map').getBoundingClientRect();return {x:r.left+q.x,y:r.top+q.y};},sysId);
  await p.touchscreen.tap(pt.x,pt.y);}
async function centerOn(p,sysId){await p.evaluate(id=>{View.cam.z=Math.max(View.cam.z,.6);View.center(G.sys[id].x,G.sys[id].y);},sysId);await p.waitForTimeout(250);}
function decode(buf){const {Image,createCanvas}=napi;const img=new Image();img.src=buf;const c=createCanvas(img.width,img.height),g=c.getContext('2d');g.drawImage(img,0,0);return {w:img.width,h:img.height,d:g.getImageData(0,0,img.width,img.height).data};}
function pixelDiff(a,b,skip){if(!napi)return null;const A=decode(a),Bm=decode(b);if(A.w!==Bm.w||A.h!==Bm.h)return {sizeMismatch:true};
  let n=0,tot=0;for(let y=0;y<A.h;y++)for(let x=0;x<A.w;x++){if(skip.some(r=>x>=r.x&&x<r.x+r.w&&y>=r.y&&y<r.y+r.h))continue;tot++;const i=(y*A.w+x)*4;
    if(Math.abs(A.d[i]-Bm.d[i])>48||Math.abs(A.d[i+1]-Bm.d[i+1])>48||Math.abs(A.d[i+2]-Bm.d[i+2])>48)n++;}
  return {ratio:Math.round(n/tot*10000)/10000,pixels:tot};}
async function layout(p){return p.evaluate(()=>{const vw=innerWidth;return {overflow:document.documentElement.scrollWidth>vw+1,rotate:document.getElementById('rotate').classList.contains('show'),
  game:!document.getElementById('game').classList.contains('hidden')};});}

let relay,base,bH,bB,bC,bR,H,Bp,Cp,R,code;
(async()=>{try{
  relay=relayMod.create({MP1_PORT:'0'});const s=await relay.start();base='http://127.0.0.1:'+s.address().port;
  [bH,bB,bC,bR]=await Promise.all([0,1,2,3].map(()=>chromium.launch(launch)));
  H=await (await bH.newContext(PHONE(915,412))).newPage();Bp=await (await bB.newContext(PHONE(844,390))).newPage();
  Cp=await (await bC.newContext(PHONE(960,540))).newPage();R=await (await bR.newContext(PHONE(844,390))).newPage();
  for(const [n,p] of [['host',H],['B',Bp],['C',Cp],['ref',R]]){p.on('pageerror',e=>errors.push(n+': '+e.message));p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))errors.push(n+' console: '+m.text());});}

  await test('kurulum: host oda açar; davet bağlantısı GERÇEK oyun sayfasına (/mp/play) gider; B ve C aynı lobiden katılır; oyun başlar; misafirler gerçek STARS arayüzüyle açılır',async()=>{
    await H.goto(base+'/');await wait(H,()=>typeof setupGame==='function'&&document.getElementById('mp1Btn'));
    await tapEl(H,'#mp1Btn');await tapEl(H,'[data-m="create"]');await wait(H,()=>MP1Host.lobby&&MP1Host.lobby.phase==='waiting');
    code=await H.evaluate(()=>{MP1Host.host.setCapacity(3);MP1Host.host.configure({size:'orta',aiCount:5,seed:22});MP1Host.ws.send('C'+JSON.stringify({cap:2}));return MP1Host.code;});
    const link=await H.textContent('#mp1Link');assert.equal(link,base+'/mp/play?code='+code);
    for(const [p,name,e] of [[Bp,'Bora',B],[Cp,'Cem',C]]){await p.goto(link);await wait(p,()=>window.MP1Join&&document.getElementById('jCode'));
      assert.equal(await p.evaluate(()=>typeof setupGame+typeof UI+typeof View),'functionobjectobject','guest page loads the real STARS runtime');
      await p.fill('#jName',name);await tapEl(p,'[data-j="go"]');await wait(p,()=>MP1Join.screen==='lobby'&&MP1Join.lobby);
      await tapEl(p,'[data-j="claim"][data-e="'+e+'"]');await wait(H,e=>MP1Host.lobby.players.some(x=>x.claim===e),e);await tapEl(p,'#jReady');}
    await shot(Bp,'b-lobby');
    await wait(H,()=>MP1Host.host.canStart().ok);await tapEl(H,'[data-m="start"]');
    for(const p of [Bp,Cp])await wait(p,()=>window.MP6Stars&&MP6Stars.S.started&&!document.getElementById('game').classList.contains('hidden'));
    await H.waitForTimeout(600);await H.evaluate(()=>{if(UI.closeModal)UI.closeModal();UI.setSpeed(0);});   // danışman kapanınca motor önceki hızı geri yükler: önce kapat, sonra durdur
    const dA=await H.evaluate(()=>MP1Host.advance(5));await H.evaluate(POLITICS);if(process.env.MP6_DBG)console.log('  setup',dA,await H.evaluate(()=>JSON.stringify({day:G.day,c:G.emps[5].contact[3]})));
    await synced(H,Bp);await synced(H,Cp);
    for(const [p,e] of [[Bp,B],[Cp,C]]){const g=await p.evaluate(()=>({id:G.p.id,n:G.p.name,ai:G.p.ai,sp:G.speed,mp2:!!document.getElementById('mp2')}));
      assert.deepEqual(g,{id:0,n:await H.evaluate(e=>G.emps[e].name,e),ai:false,sp:0,mp2:false});}
  });

  await test('aynı arayüz iskeleti: host ve misafirde aynı üst çubuk, sol araçlar, tarih/hız kutusu, sağ panel sekmeleri, aynı yazı tipleri; misafir sayfasında MP.2 basit arayüzü yok',async()=>{
    const sk=p=>p.evaluate(()=>{const q=s=>document.querySelector(s),txt=s=>[...document.querySelectorAll(s)].map(x=>x.textContent.trim());
      return {top:!!q('#topbar')&&q('#topbar').children.length>0,tools:txt('#tools > .tool').length,toolsA:[...document.querySelectorAll('#tools [data-a]')].map(x=>x.dataset.a+':'+(x.dataset.x||'')),
        timepod:txt('#timepod .sp'),tabs:txt('#tabs .tab'),font:getComputedStyle(q('#topbar')).fontFamily,panel:!!q('#sidebar,#panel,#side,.sidebar')};});
    const h=await sk(H),b=await sk(Bp),c=await sk(Cp);metrics.skeleton={host:h,guest:b};
    assert.deepEqual(b,h,'guest B skeleton = host');assert.deepEqual(c,h,'guest C skeleton = host');
    assert.deepEqual(h.tabs,['SİSTEM','FİLO','İSTİHBARAT']);
  });

  await test('görsel: aynı ayna dünya için misafir ekranı ile düz tek oyunculu STARS sayfası piksel piksel karşılaştırılır (çok oyunculu çubuk hariç); host ekranı aynı tasarım',async()=>{
    await R.goto(base+'/');await wait(R,()=>typeof setupGame==='function');
    const text=await Bp.evaluate(()=>JSON.stringify(MP6Stars.S.mirror));
    await R.evaluate(t=>{deserialize(t);leaveTitle(null);document.getElementById('menu').classList.add('hidden');document.getElementById('game').classList.remove('hidden');enterGame(true);UI.setSpeed(0);},text);
    const home=await Bp.evaluate(()=>G.p.home);
    for(const p of [Bp,R]){await p.evaluate(h=>{View.cam.z=.8;View.center(G.sys[h].x,G.sys[h].y);View.selSys=G.sys[h];UI.tab('sistem');UI.refresh();},home);}
    await Bp.waitForTimeout(600);await R.waitForTimeout(600);
    const mini=await Bp.evaluate(()=>{const r=document.getElementById('mp1Mini').getBoundingClientRect();return {x:Math.floor(r.left*2)-4,y:Math.floor(r.top*2)-4,w:Math.ceil(r.width*2)+8,h:Math.ceil(r.height*2)+8};});
    const a=await Bp.screenshot({path:path.join(out,'compare-guest-844x390.png')}),r=await R.screenshot({path:path.join(out,'compare-singleplayer-844x390.png')});
    const d=pixelDiff(a,r,[mini]);metrics.pixel.guestVsSingleplayer=d;
    if(d){assert(!d.sizeMismatch);assert(d.ratio<0.05,'guest vs single-player pixel difference '+d.ratio);}else metrics.notes.push('piksel karşılaştırması NOT RUN (@napi-rs/canvas yok)');
    await H.evaluate(()=>{const h=G.p.home;View.cam.z=.8;View.center(G.sys[h].x,G.sys[h].y);View.selSys=G.sys[h];UI.tab('sistem');UI.refresh();});await H.waitForTimeout(500);
    await shot(H,'compare-host-915x412');
  });

  await test('zorunlu yatay ekran: 844×390, 915×412, 960×540 yatayda oyun görünür, yatay taşma yok; dikey tutulunca mevcut "çevir" uyarısı çıkar (host ve misafir aynı)',async()=>{
    for(const [n,p,sz0] of [['guest',Bp,[844,390]],['host',H,[915,412]]]){metrics.layout[n]={};
      for(const [w,h] of LAND){await p.setViewportSize({width:w,height:h});await p.evaluate(()=>{dispatchEvent(new Event('resize'));UI.checkOrient&&UI.checkOrient();});await p.waitForTimeout(300);
        const l=await layout(p);metrics.layout[n][w+'x'+h]=l;assert(l.game&&!l.rotate&&!l.overflow,n+' '+w+'x'+h+' '+JSON.stringify(l));await shot(p,n+'-'+w+'x'+h);}
      await p.setViewportSize({width:390,height:844});await p.evaluate(()=>{dispatchEvent(new Event('resize'));UI.checkOrient&&UI.checkOrient();});await p.waitForTimeout(300);
      const l=await layout(p);metrics.layout[n]['390x844']=l;await shot(p,n+'-portrait-390x844');
      const top=await p.evaluate(()=>{const m=document.getElementById('mp1Mini');if(!m)return 'none';const r=m.getBoundingClientRect();if(!r.width)return 'rotate';const t=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return t&&t.closest('#rotate')?'rotate':t&&t.closest('#mp1Mini')?'mini':'other';});
      await p.setViewportSize({width:sz0[0],height:sz0[1]});await p.evaluate(()=>{dispatchEvent(new Event('resize'));UI.checkOrient&&UI.checkOrient();});await p.waitForTimeout(200);   // önce geri yükle (sonraki vakalar yatayda)
      assert(l.rotate,n+' portrait shows the rotate prompt');assert(['rotate','none'].includes(top),n+' MP bar stays under the rotate prompt: '+top);}
    assert.equal(await Bp.evaluate(()=>document.querySelector('link[rel="manifest"]')?.href),base+'/manifest.json','same PWA manifest (orientation: landscape)');
  });

  await test('harita ve panel etkileşimi (misafir, gerçek dokunma): sistem seçimi sağ paneli açar; sürükleme kamerayı kaydırır; sekmeler ve sol menü açılır; senkron sırasında seçim ve kamera korunur',async()=>{
    const target=await Bp.evaluate(()=>{const ctx=explorationContext(G.p);return [...ctx.known].find(id=>id!==G.p.home&&G.sys[id].name);});
    await centerOn(Bp,target);await tapWorld(Bp,target);await wait(Bp,t=>View.selSys&&View.selSys.id===t,target);
    assert.match(await Bp.textContent('#side, #sidebar, body'),new RegExp(await Bp.evaluate(t=>G.sys[t].name,target)));
    const cam0=await Bp.evaluate(()=>({x:View.cam.x,y:View.cam.y}));
    const m=await Bp.evaluate(()=>{const r=document.getElementById('map').getBoundingClientRect();return {x:r.left+r.width*.3,y:r.top+r.height*.5};});
    const cdp=await Bp.context().newCDPSession(Bp);const T=(type,x,y)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'?[]:[{x,y,id:1}]});
    await T('touchStart',m.x,m.y);for(let i=1;i<=6;i++){await T('touchMove',m.x+i*15,m.y+i*6);await sleep(16);}await T('touchEnd');
    const cam1=await Bp.evaluate(()=>({x:View.cam.x,y:View.cam.y}));assert(Math.hypot(cam1.x-cam0.x,cam1.y-cam0.y)>5,'drag pans the camera');
    await synced(H,Bp);assert.equal(await Bp.evaluate(()=>View.selSys&&View.selSys.id),target,'selection kept across sync');
    const cam2=await Bp.evaluate(()=>({x:View.cam.x,y:View.cam.y}));assert.deepEqual(cam2,cam1,'camera kept across sync');
    await tapEl(Bp,'#tabs [data-a="tab"][data-x="filo"]');await wait(Bp,()=>document.querySelector('#tabs .tab.on')?.dataset.x==='filo');
    await tapEl(Bp,'#tabs [data-a="tab"][data-x="sistem"]');
    await tapEl(Bp,'#tools [data-a="grpTog"][data-x="emp"]');await tapEl(Bp,'[data-a="globalPane"][data-x="bilim"]');await wait(Bp,()=>document.querySelector('#diploPane.show .scienceRoot'));
    assert.equal(await Bp.evaluate(()=>{const r=document.getElementById('mp1Mini').getBoundingClientRect();const t=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return !!(t&&t.closest('#diploPane'));}),true,'STARS panel above the MP bar');
    await shot(Bp,'b-science');
  });

  await test('gerçek komutlar gerçek arayüzden (misafir B): bilim ağacından araştırma hedefi, koloni panelinden bina, filo panelinden ROTA + haritada hedef → host motoru uygular; misafir kendi devleti dışında komut veremez',async()=>{
    /* araştırma */
    const tech=await H.evaluate(b=>{const E=G.emps[b];return Object.keys(TECHS).find(id=>!E.techs[id]&&researchAccess(E,id).ok&&researchRoute(E,id).ok&&!(E.research&&E.research.targets||[]).includes(id));},B);
    const br=await H.evaluate(t=>TECHS[t].b,tech);
    await Bp.evaluate(b=>UI.scienceAction('scienceTab',b),br);await wait(Bp,t=>document.querySelector('[data-a="scienceNode"][data-x="'+t+'"],[data-x="'+t+'"][data-a]'),tech);
    await Bp.locator('[data-a="scienceNode"][data-x="'+tech+'"]').first().tap();
    await wait(H,([b,t])=>G.emps[b].research.targets.includes(t),[B,tech]);await synced(H,Bp);
    assert.equal(await Bp.evaluate(t=>G.p.research.targets.includes(t),tech),true,'guest sees its research target after sync');await shot(Bp,'b-science-target');
    await tapEl(Bp,'[data-a="closeDiplo"],[data-a="closem"]').catch(()=>{});await Bp.evaluate(()=>document.getElementById('diploPane').classList.remove('show'));
    /* bina — FİKSTÜR (açıkça): seed 22'de başlangıç kolonisinin yuvaları dolu (14/13); host'ta bir maden kaldırılıp bir yuva boşaltılır */
    await H.evaluate(b=>{const E=G.emps[b],c=E.colonies[0],pl=G.sys[c.s].planets[c.p];
      for(let i=0;i<4&&colonyUsed(pl.col)+colonyQueued(pl.col)>=colonySlots(pl.col,E,pl);i++){const k=['maden','ciftlik','santral'].find(k=>(pl.col.b[k]||0)>1);if(!k)break;pl.col.b[k]--;}
      recalcMods(E);MP1Host.host.publish();},B);
    const col=await H.evaluate(b=>{const E=G.emps[b];for(const c of E.colonies){const s=G.sys[c.s],pl=s.planets[c.p];if(colonyUsed(pl.col)+colonyQueued(pl.col)<colonySlots(pl.col,E,pl))
        for(const k of Object.keys(BUILDINGS)){if(BUILDINGS[k].tech&&!E.techs[BUILDINGS[k].tech])continue;const cost=buildingCost(E,k);if(Object.entries(cost).every(([r,v])=>E.res[r]>=v)&&(pl.col.b[k]||0)+colonyQueuedOf(pl.col,k)<BUILDINGS[k].max)return {s:c.s,p:c.p,i:pl.i,k,q:(pl.col.q||[]).length};}}return null;},B);
    assert(col,'buildable colony');
    await Bp.evaluate(s=>{View.selSys=G.sys[s];UI.tab('sistem');UI.refresh();},col.s);
    await wait(Bp,x=>document.querySelector('[data-a="build"][data-x="'+x+'"]'),col.s+':'+col.i+':'+col.k);
    await Bp.locator('[data-a="build"][data-x="'+col.s+':'+col.i+':'+col.k+'"]').first().tap();
    await wait(H,c=>(G.sys[c.s].planets[c.p].col.q||[]).length>c.q,col);await synced(H,Bp);
    await wait(Bp,c=>(G.sys[c.s].planets[c.p].col.q||[]).some(w=>w.key===c.k),col);   // kuyruk misafirde görünür (ayna gecikmesi en çok ~0,7 s)await shot(Bp,'b-build-queued');
    /* filo rotası */
    const mv=await H.evaluate(b=>{const E=G.emps[b];for(const f of G.fleets.filter(f=>f.e===b&&!f.mv&&!f.path.length&&f.ships.length))for(const s of G.sys){if(s.id===f.sys)continue;
        const p=findPath(f.sys,s.id,E);if(p&&p.length>=1&&p.length<=2&&pathAllowed(E,f,p,f.sys))return {f:f.id,from:f.sys,t:s.id};}return null;},B);
    assert(mv,'movable fleet');
    await Bp.evaluate(f=>{View.sel=G.fleets.find(x=>x.id===f);UI.tab('filo');UI.refresh();},mv.f);await wait(Bp,()=>document.querySelector('[data-a="route"]'));
    await Bp.locator('[data-a="route"]').first().tap();await wait(Bp,()=>View.route);
    await centerOn(Bp,mv.t);await tapWorld(Bp,mv.t);
    await wait(H,m=>{const f=G.fleets.find(x=>x.id===m.f);return !!(f&&(f.mv||f.path.length));},mv);metrics.notes.push('filo '+mv.f+' → '+mv.t+' (gerçek ROTA dokunuşu)');
    await synced(H,Bp);await wait(Bp,f=>{const x=G.fleets.find(y=>y.id===f);return !!(x&&(x.mv||x.path.length));},mv.f);   // misafir rotayı görür (ayna gecikmesi en çok ~0,7 s)await shot(Bp,'b-fleet-route');
    metrics.sent=await Bp.evaluate(()=>MP6Stars.S.stats.sent);
  });

  /* MP.6.1: hız, duruş, birleştirme, otomatik keşif, kolonileştirme, yıkım ve dur artık host komutlarıdır (browser-mp61);
     burada hâlâ desteklenmeyen eylemler denetlenir. */
  await test('desteklenmeyen eylemler açıkça engellenir ve host\'a dokunmaz: savaş ilanı, hediye, casusluk, elçi, terraform, takviye, ittifak, pakt; misafirde zaman ilerlemez',async()=>{
    const s0=await H.evaluate(()=>({speed:G.speed,day:G.day,ser:serialize().length}));
    const UNS=['war','giftDo','spy','envoyTask','terraform','reinf','ally','pact'];
    for(const a of UNS)await Bp.evaluate(a=>UI.act(a,'1'),a);await Bp.waitForTimeout(400);
    assert.equal(await Bp.evaluate(()=>G.speed),0,'guest local speed stays 0 (no local simulation)');
    metrics.blocked=await Bp.evaluate(()=>MP6Stars.S.stats.blocked);
    for(const a of UNS)assert(metrics.blocked[a]>=1,'blocked '+a);
    const s1=await H.evaluate(()=>({speed:G.speed,day:G.day}));assert.deepEqual([s1.speed,s1.day],[s0.speed,s0.day],'host time/speed untouched');
    assert.match(await Bp.evaluate(()=>[...document.querySelectorAll('#alerts *')].map(x=>x.textContent).join(' | ')),/host|henüz yok/i);await shot(Bp,'b-blocked-toast');
  });

  await test('gizlilik: misafirin aynasında başka devletin kaynağı/teknolojisi/koloni ayrıntısı, host günlüğü, gerçek tohum ve RNG yok; görünmeyen sistemde sahip yok; C\'nin aynası B\'nin kuyruğunu ve araştırmasını içermez',async()=>{
    const priv=await Bp.evaluate(()=>{const m=MP6Stars.S.mirror;const others=m.emps.filter(e=>e.id!==0);
      return {res:others.reduce((a,e)=>a+Object.values(e.res).reduce((x,y)=>x+y,0),0),techs:others.reduce((a,e)=>a+Object.keys(e.techs).length,0),
        foreignColDetail:m.sys.some(s=>s.p.some(p=>p.col&&p.owner!==0&&(Object.keys(p.col.b).length||p.col.q.length))),seed:m.seed,cfgSeed:m.cfg.seed,rs:m.rs,log:m.log.length,
        aiPlans:others.some(e=>e.aiStrategy||e.aiIntel),hiddenOwners:m.sys.filter(s=>!s.se.length&&s.o!==-1).length,names:m.sys.filter(s=>!s.se.length&&s.n).length};});
    metrics.privacy=priv;
    assert.deepEqual([priv.res,priv.techs,priv.foreignColDetail,priv.aiPlans,priv.hiddenOwners,priv.names],[0,0,false,false,0,0]);
    assert.notEqual(priv.cfgSeed,22);assert.notEqual(priv.seed,22);assert.equal(priv.rs,1);
    const hostLog=await H.evaluate(()=>G.log.map(x=>x.m));const bLog=await Bp.evaluate(()=>MP6Stars.S.mirror.log.map(x=>x.m));for(const m of bLog)assert(!hostLog.includes(m)||/./.test(m));
    const cm=await Cp.evaluate(()=>JSON.stringify(MP6Stars.S.mirror));const bt=await Bp.evaluate(()=>G.p.research.targets);
    const bInC=await Cp.evaluate(n=>{const e=G.emps.find(x=>x.name===n);return e?{res:Object.values(e.res).reduce((a,b)=>a+b,0),targets:(e.research&&e.research.targets||[]).length,techs:Object.keys(e.techs).length}:null;},await H.evaluate(b=>G.emps[b].name,B));
    assert(bInC,'B appears to C as a contacted shell');assert.deepEqual(bInC,{res:0,targets:0,techs:0});void bt;void cm;
    const mirrorKB=await Bp.evaluate(()=>Math.round(JSON.stringify(MP6Stars.S.mirror).length/1024));metrics.perf.mirrorKB=mirrorKB;
  });

  await test('MP diplomasi (host ile aynı panel ve aynı çubuk): B DİPLOMASİ panelinden C\'ye ticaret teklifi gönderir; C kendi panelinden kabul eder; host motoru tam bir kez uygular',async()=>{
    await tapEl(Bp,'#mp6DipBtn');await wait(Bp,()=>document.getElementById('mp3Host'));await shot(Bp,'b-mp-diplomacy');
    const n0=await Bp.evaluate(()=>MP1Join.results.length);
    const r=await Bp.evaluate(c=>new Promise(res=>{MP6Stars.dip.ui;const cid=MP1Join.cmd({kind:'offer',to:c,give:[{t:'res',r:'min',v:100}],want:[{t:'res',r:'ala',v:40}]}).cid;
      const t=setInterval(()=>{const x=MP1Join.results.find(y=>y.cid===cid);if(x){clearInterval(t);res(x);}},50);}),C);
    assert.equal(r.status,'ok',JSON.stringify(r));void n0;
    const r0=await H.evaluate(([b,c])=>[G.emps[b].res.min,G.emps[c].res.ala],[B,C]);
    await tapEl(Cp,'#mp6DipBtn');await wait(Cp,()=>document.getElementById('mp3Host'));
    await sync6(H,Cp);await Cp.locator('#mp3Host [data-d="sub"][data-sub="in"]').tap();
    await wait(Cp,id=>document.querySelector('[data-d="ask"][data-a="accept"][data-id="'+id+'"]'),r.extra.offer);await shot(Cp,'c-mp-diplomacy-incoming');
    await Cp.locator('[data-d="ask"][data-a="accept"][data-id="'+r.extra.offer+'"]').tap();
    await wait(Cp,()=>document.getElementById('mp3Sheet')&&!document.querySelector('#mp3Sheet [data-s="ok"]').disabled);await Cp.locator('#mp3Sheet [data-s="ok"]').tap();
    await wait(H,o=>MP1Host.host.dip.offers.find(x=>x.id===o).status==='accepted',r.extra.offer);
    const r1=await H.evaluate(([b,c])=>[G.emps[b].res.min,G.emps[c].res.ala],[B,C]);assert.deepEqual([Math.round(r0[0]-r1[0]),Math.round(r0[1]-r1[1])],[100,40]);
    for(const p of [Bp,Cp]){await p.evaluate(()=>MP6Stars.dip.open(false));}
  });

  await test('kopma/yeniden bağlanma: misafirin soketi düşer; gerçek arayüz kalır, yeniden bağlanınca tam ayna yeniden gelir ve oyun aynı devletle sürer',async()=>{
    const m0=await Bp.evaluate(()=>MP6Stars.S.stats.mirrors);
    const room=relay.rooms.get(code);for(const c of room.clients.values()){c.socket.destroy();break;}
    await sleep(300);
    await wait(Bp,()=>MP1Join.ws&&MP1Join.ws.readyState===1&&MP1Join.hostOnline,undefined,30000);await wait(Cp,()=>MP1Join.ws&&MP1Join.ws.readyState===1&&MP1Join.hostOnline,undefined,30000);
    await H.evaluate(()=>MP1Host.advance(3));await synced(H,Bp);await synced(H,Cp);
    for(const [p,e] of [[Bp,B],[Cp,C]])assert.equal(await p.evaluate(()=>G.p.name),await H.evaluate(e=>G.emps[e].name,e));
    assert(await Bp.evaluate(()=>!document.getElementById('game').classList.contains('hidden')),'real UI kept');metrics.notes.push('yeniden bağlanma sonrası tam ayna: '+((await Bp.evaluate(()=>MP6Stars.S.stats.mirrors))-m0));
  });

  await test('performans: 45 / 60 / 100 sistemde ayna boyutu (tam ve fark), host ayna üretimi, misafir yeniden kurulum süresi',async()=>{
    const perf={};
    for(const [size,ai] of [['orta',5],['buyuk',7],['ulu',11]]){
      const r=await R.evaluate(([size,ai])=>{setupGame({...CFG,size,aiCount:ai,seed:42});G.autoSave=false;G.emps[1].ai=false;
        let t=performance.now();const m=StarsMirror.build(1,{cosmeticSeed:7});const build=performance.now()-t;const text=JSON.stringify(m);
        for(let i=0;i<20;i++){G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();}
        const m2=StarsMirror.build(1,{cosmeticSeed:7});const ops=StarsMirror.diff(m,m2);
        const saved=serialize();t=performance.now();const ok=deserialize(text);const load=performance.now()-t;deserialize(saved);
        return {systems:G.sys.length,fullKB:Math.round(text.length/1024*10)/10,delta10dKB:Math.round(JSON.stringify(ops).length/1024*10)/10,buildMs:Math.round(build*10)/10,guestLoadMs:Math.round(load*10)/10,ok};},[size,ai]);
      assert.equal(r.ok,true);perf['s'+r.systems]=r;}
    metrics.perf.sizes=perf;
    metrics.perf.liveGuestBuildMs=await Bp.evaluate(()=>MP6Stars.S.stats.buildMs.slice(-10));
    metrics.perf.hostMirrorBytes=await H.evaluate(()=>((MP1Host.host.stats||{}).mirrorBytes||[]).slice(-10));
  });
  assert.equal(errors.length,0,'page errors: '+errors.join(' | '));
}catch(e){results.push({name:'harness',status:'FAIL',error:String(e&&e.stack||e)});console.log('FAIL harness\n'+(e&&e.stack||e));}
finally{
  metrics.pageErrors=errors;fs.writeFileSync(path.join(out,'mp6-results.json'),JSON.stringify({note:'Yerel relay + 4 ayrı Chromium süreci (mobil dokunmatik bağlam). Gerçek internet ya da fiziksel Android DEĞİL. Siyasi başlangıç açık fikstür.',results,metrics},null,1));
  for(const b of [bH,bB,bC,bR])if(b)await b.close().catch(()=>{});if(relay)relay.shutdown('test-end');
  const pass=results.filter(r=>r.status==='PASS').length,fail=results.length-pass;console.log('GEÇEN: '+pass+' KALAN: '+fail);process.exit(fail?1:0);
}})();
