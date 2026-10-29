'use strict';
/* MP.2 — misafirin gerçek oynanışı: galaksi haritası, gerçek filo hareketi (orderMove), gerçek
   araştırma hedefi (researchTarget), yetki/gizlilik, mobil dokunma, performans.
   Ayrı Chromium süreçleri: host telefon + misafir A + misafir B. Dokunmalar CDP Input.dispatchTouchEvent
   ile gerçek dokunmatik olay dizisi olarak verilir (sürükleme, iki parmak yakınlaştırma, dokunma).
   Yerel relay; gerçek internet ve fiziksel Android değildir. Çıktı: $STARS_OUTPUT/mp2-results.json + PNG. */
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),out=path.resolve(process.env.STARS_OUTPUT||path.join(root,'../evidence/mp2'));fs.mkdirSync(out,{recursive:true});
const relayMod=require('../research/mp1/server/relay.js');
const results=[],errors=[],metrics={viewports:{},perf:{}};
const launch={executablePath:process.env.STARS_CHROMIUM_PATH||undefined,args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--enable-precise-memory-info']};
const PHONE=(w,h)=>({viewport:{width:w,height:h},isMobile:true,hasTouch:true,deviceScaleFactor:2});
let relay,base,bH,bA,bB,H,A,B,code;const emp={A:3,B:4};
async function test(name,fn){const t0=Date.now();try{await fn();results.push({name,status:'PASS',ms:Date.now()-t0});console.log('PASS '+name);}
  catch(e){results.push({name,status:'FAIL',error:String(e&&e.stack||e).slice(0,1600)});console.log('FAIL '+name+'\n'+(e&&e.stack||e));}}
const wait=(p,fn,arg,timeout=20000)=>p.waitForFunction(fn,arg,{timeout,polling:50});
const shot=(p,n)=>p.screenshot({path:path.join(out,n+'.png')}).catch(()=>{});
/* Host sayfasının KENDİ tek oyunculu arayüzü çizim sırasında motorun günlük önbelleklerini (_powAt, _pressAt…)
   damgalar — tek oyunculu oyunla aynı, misafir komutundan bağımsız. Tarayıcı karşılaştırması bu "_" önekli
   önbellek alanlarını dışarıda bırakır; tam Save8 baytı eşitliği arayüzsüz vm testinde (mp2_core_test) kanıtlanır. */
const HS=()=>H.evaluate(()=>({s:JSON.stringify(JSON.parse(serialize()),(k,v)=>k[0]==='_'?undefined:v),r:RND_STATE}));
/* Save8 eşitliği; farkta ilk farklı yolu raporla */
function firstDiff(a,b,p=''){if(JSON.stringify(a)===JSON.stringify(b))return null;if(a&&b&&typeof a==='object'&&typeof b==='object'){for(const k of new Set([...Object.keys(a),...Object.keys(b)])){const d=firstDiff(a[k],b[k],p+'/'+k);if(d)return d;}}
  return p+' '+JSON.stringify(a)?.slice(0,80)+' → '+JSON.stringify(b)?.slice(0,80);}
function sameState(x,y,msg){if(x.s===y.s&&x.r===y.r)return;assert.fail((msg||'state changed')+': rng '+x.r+'→'+y.r+' '+firstDiff(JSON.parse(x.s),JSON.parse(y.s)));}
/* gerçek dokunmatik olaylar */
const cdps=new Map();
async function touch(p,type,pts){let c=cdps.get(p);if(!c){c=await p.context().newCDPSession(p);cdps.set(p,c);}
  await c.send('Input.dispatchTouchEvent',{type,touchPoints:pts.map((q,i)=>({x:q.x,y:q.y,id:i+1,radiusX:4,radiusY:4,force:1}))});}
async function canvasBox(p){return p.locator('#mp2Map').boundingBox();}
async function tapAt(p,kind,id){const b=await canvasBox(p);const s=await p.evaluate(([k,i])=>MP2Game.screenOf(k,i),[kind,id]);assert(s,'on screen '+kind+id);
  const q={x:b.x+s.x,y:b.y+s.y};assert(q.x>b.x&&q.x<b.x+b.width&&q.y>b.y&&q.y<b.y+b.height,'inside canvas '+JSON.stringify(q));
  await touch(p,'touchStart',[q]);await touch(p,'touchEnd',[]);return q;}
async function drag(p,from,to,steps=6){await touch(p,'touchStart',[from]);for(let i=1;i<=steps;i++)await touch(p,'touchMove',[{x:from.x+(to.x-from.x)*i/steps,y:from.y+(to.y-from.y)*i/steps}]);await touch(p,'touchEnd',[]);}
async function pinch(p,c,d0,d1,steps=6){const pts=d=>[{x:c.x-d/2,y:c.y},{x:c.x+d/2,y:c.y}];await touch(p,'touchStart',pts(d0));
  for(let i=1;i<=steps;i++)await touch(p,'touchMove',pts(d0+(d1-d0)*i/steps));await touch(p,'touchEnd',[]);}
async function layout(p){return p.evaluate(()=>{const vw=innerWidth,root=document.getElementById('app');
  const vis=e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none'&&!e.closest('[hidden]');};
  const ctl=[...root.querySelectorAll('button,select,input,a.mp1-btn')].filter(vis);
  const small=ctl.filter(e=>{const r=e.getBoundingClientRect();return r.height<44||r.width<44;}).map(e=>(e.textContent||e.id).trim().slice(0,16)+':'+Math.round(e.getBoundingClientRect().width)+'x'+Math.round(e.getBoundingClientRect().height));
  const wide=[...root.querySelectorAll('*')].filter(e=>vis(e)&&!e.closest('.mp1-tabs')&&e.getBoundingClientRect().right>vw+1).map(e=>e.className||e.tagName).slice(0,5);
  let minFont=99,minAt='';for(const e of root.querySelectorAll('*'))if(vis(e)&&[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())){const f=parseFloat(getComputedStyle(e).fontSize);if(f<minFont){minFont=f;minAt=e.className+':'+e.textContent.slice(0,16);}}
  const cv=document.getElementById('mp2Map').getBoundingClientRect();
  return {overflow:document.documentElement.scrollWidth>vw+1,small,wide,minFont,minAt,map:{w:Math.round(cv.width),h:Math.round(cv.height)},vw,vh:innerHeight};});}
function assertLayout(l,where){assert(!l.overflow,where+' overflow');assert.deepEqual(l.wide,[],where+' wide');assert.deepEqual(l.small,[],where+' <44px');assert(l.minFont>=11,where+' font '+l.minFont+' '+l.minAt);}
async function room(hostPage,size,ai,seed,guests){
  await hostPage.goto(base+'/');await wait(hostPage,()=>typeof setupGame==='function'&&document.getElementById('mp1Btn'));
  await hostPage.locator('#mp1Btn').tap();await hostPage.locator('[data-m="create"]').tap();await wait(hostPage,()=>MP1Host.lobby&&MP1Host.lobby.phase==='waiting');
  const c=await hostPage.evaluate(([size,ai,seed,n])=>{MP1Host.host.setCapacity(n+1);MP1Host.host.configure({size,aiCount:ai,seed});return MP1Host.code;},[size,ai,seed,guests.length]);
  await hostPage.evaluate(()=>{MP1Host.ws.send('C'+JSON.stringify({cap:MP1Host.host.lobby.capacity-1}));});
  for(const [g,name,e] of guests){await g.goto(base+'/mp/join?code='+c);await wait(g,()=>window.MP1Join&&document.getElementById('jCode'));await g.fill('#jName',name);
    await g.locator('[data-j="go"]').tap();await wait(g,()=>MP1Join.screen==='lobby'&&MP1Join.lobby);await g.evaluate(x=>MP1Join.claim(x),e);
    await wait(hostPage,([e])=>MP1Host.lobby.players.some(p=>p.claim===e),[e]);await g.evaluate(()=>MP1Join.ready(true));}
  await wait(hostPage,()=>MP1Host.host.canStart().ok);await hostPage.locator('[data-m="start"]').tap();
  for(const [g,,e] of guests)await wait(g,x=>MP1Join.screen==='game'&&MP1Join.game.view&&MP1Join.game.view.me.id===x&&document.getElementById('mp2Map'),e);
  await hostPage.evaluate(()=>UI.setSpeed(0));return c;
}
const advance=(d)=>H.evaluate(n=>MP1Host.advance(n),d);
async function sync(p){const day=await H.evaluate(()=>Math.floor(G.day));await wait(p,d=>MP1Join.game.clock&&MP1Join.game.clock.day===d,day);}

(async()=>{try{
  relay=relayMod.create({MP1_PORT:'0'});const s=await relay.start();base='http://127.0.0.1:'+s.address().port;
  bH=await chromium.launch(launch);bA=await chromium.launch(launch);bB=await chromium.launch(launch);
  H=await (await bH.newContext(PHONE(915,412))).newPage();A=await (await bA.newContext(PHONE(390,844))).newPage();B=await (await bB.newContext(PHONE(360,800))).newPage();
  for(const [n,p] of [['host',H],['A',A],['B',B]])p.on('pageerror',e=>errors.push(n+': '+e.message));
  metrics.browserProcesses=[...new Set((require('child_process').execSync('ps -eo args').toString().match(/--user-data-dir=\S+/g)||[]))].length;

  await test('real lobby → game with two guests (empires 3 and 4) on seed 11, 45 systems; guests run no engine',async()=>{
    code=await room(H,'orta',5,11,[[A,'Ayşe',emp.A],[B,'Bora',emp.B]]);
    for(const p of [A,B])assert.equal(await p.evaluate(()=>typeof G+typeof orderMove+typeof researchTarget),'undefinedundefinedundefined');
    assert.deepEqual(await H.evaluate(()=>[G.emps[3].ai,G.emps[4].ai,G.sys.length]),[false,false,45]);
  });
  await test('map is the default screen: own capital centred, own systems named, unknown systems only as dots, tabs HARİTA/FİLOLAR/KOLONİLER/BİLİM',async()=>{
    const g=await A.evaluate(()=>({tab:MP2Game.G.tab,draws:MP2Game.G.stats.draws,cam:MP2Game.G.cam,home:MP1Join.game.view.me.home,tabs:[...document.querySelectorAll('.mp2-nav button')].map(b=>b.textContent)}));
    assert.equal(g.tab,'map');assert(g.draws>0);assert.deepEqual(g.tabs,['HARİTA','FİLOLAR','KOLONİLER','BİLİM']);
    const b=await canvasBox(A),h=await A.evaluate(id=>MP2Game.screenOf('s',id),g.home);
    assert(Math.abs(h.x-b.width/2)<2&&Math.abs(h.y-b.height/2)<2,'capital centred');
    const px=await A.evaluate(()=>{const c=document.getElementById('mp2Map'),d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let n=0;for(let i=0;i<d.length;i+=16)if(d[i]+d[i+1]+d[i+2]>60)n++;return n;});assert(px>50,'map drawn');
    const v=await A.evaluate(()=>{const v=MP1Join.game.view;return {unknownNamed:Object.values(v.sys).filter(s=>!s.k&&s.n).length,known:Object.values(v.sys).filter(s=>s.k).length,all:Object.keys(v.sys).length};});
    assert.equal(v.unknownNamed,0);assert(v.known<v.all);await shot(A,'guest-map-portrait');
  });
  await test('Android touch: one-finger drag pans, two-finger pinch zooms, buttons fit/capital/zoom; tap on a system opens its panel',async()=>{
    const b=await canvasBox(A),c={x:b.x+b.width/2,y:b.y+b.height/2};
    const c0=await A.evaluate(()=>({...MP2Game.G.cam}));await drag(A,c,{x:c.x+80,y:c.y+40});
    const c1=await A.evaluate(()=>({...MP2Game.G.cam}));assert(Math.abs((c0.x-c1.x)*c0.z-80)<3&&Math.abs((c0.y-c1.y)*c0.z-40)<3,'pan '+JSON.stringify([c0,c1]));
    await pinch(A,c,80,200);const c2=await A.evaluate(()=>({...MP2Game.G.cam}));assert(c2.z>c1.z*1.8,'pinch zoom in '+c1.z+'→'+c2.z);
    await pinch(A,c,200,80);assert((await A.evaluate(()=>MP2Game.G.cam.z))<c2.z,'pinch out');
    await A.locator('[data-g2="fit"]').tap();const cf=await A.evaluate(()=>MP2Game.G.cam.z);await A.locator('[data-g2="zin"]').tap();assert((await A.evaluate(()=>MP2Game.G.cam.z))>cf);
    await A.locator('[data-g2="home"]').tap();
    const home=await A.evaluate(()=>MP1Join.game.view.me.home);await tapAt(A,'s',home);
    await wait(A,()=>!document.getElementById('mp2Sel').hidden);assert.match(await A.textContent('#mp2Sel'),new RegExp(await A.evaluate(id=>MP1Join.game.view.sys[id].n,home)));
    metrics.drawMsMedian=await A.evaluate(()=>{const d=MP2Game.G.stats.drawMs.slice().sort((a,b)=>a-b);return Math.round(d[d.length>>1]*100)/100;});
  });
  let war,target;
  await test('fleet order from the map: select own warfleet, HEDEF SEÇ, tap a system, confirm GÖNDER → host runs orderMove; route shown; fleet arrives in game time',async()=>{
    ({war,target}=await H.evaluate(()=>{const e=G.emps[3],f=G.fleets.find(f=>f.e===3&&f.ships.some(s=>SHIPS[s.c].dmg>0));
      for(const s of G.sys){if(s.id===f.sys)continue;const p=findPath(f.sys,s.id,e);if(p&&p.length>=2&&p.length<=3&&pathAllowed(e,f,p,f.sys))return {war:f.id,target:s.id};}}));
    await A.locator('[data-g2="home"]').tap();await A.evaluate(()=>{MP2Game.G.cam.z/=2.2;MP2Game.G.dirty=true;});
    await tapAt(A,'f',war);await wait(A,()=>!document.getElementById('mp2Sel').hidden&&document.querySelector('#mp2Sel [data-g2="aim"]'));
    await A.locator('#mp2Sel [data-g2="aim"]').tap();await wait(A,()=>!document.getElementById('mp2Aim').hidden);
    const n0=await A.evaluate(()=>MP1Join.results.length),before=await HS();
    // yanlış dokunma: boş alana dokunuş emir üretmez, İPTAL hiçbir komut göndermez
    const b=await canvasBox(A);await touch(A,'touchStart',[{x:b.x+5,y:b.y+b.height-5}]);await touch(A,'touchEnd',[]);
    assert.equal(await A.evaluate(()=>MP2Game.G.pending),null);await A.locator('#mp2Aim [data-g2="cancel"]').tap();
    assert.equal(await A.evaluate(()=>MP1Join.results.length),n0);sameState(before,await HS(),'no command, no change');
    await tapAt(A,'f',war);await A.locator('#mp2Sel [data-g2="aim"]').tap();await tapAt(A,'s',target);
    await wait(A,()=>/gönderilsin mi/.test(document.getElementById('mp2Aim').textContent));await shot(A,'guest-move-confirm');
    const t0=Date.now();await A.locator('#mp2Aim [data-g2="send"]').tap();await wait(A,n=>MP1Join.results.length>n,n0);metrics.moveCommandMs=Date.now()-t0;
    assert.equal(await A.evaluate(()=>MP1Join.results.at(-1).status),'ok');
    const hp=await H.evaluate(id=>G.fleets.find(f=>f.id===id).path,war);assert.equal(hp.at(-1),target);
    await wait(A,([id,t])=>{const f=MP1Join.game.view.fleets[id];return f&&f.to===t&&f.pa.length>0;},[war,target]);
    assert(await A.evaluate(()=>/Emir uygulandı/.test(document.getElementById('mp2Toast').textContent)));
    let days=0;while((await H.evaluate(id=>G.fleets.find(f=>f.id===id).sys,war))!==target&&days<150){await advance(5);days+=5;}
    assert.equal(await H.evaluate(id=>G.fleets.find(f=>f.id===id).sys,war),target,'arrived after '+days+' days');await sync(A);
    assert.equal(await A.evaluate(id=>MP1Join.game.view.fleets[id].s,war),target);metrics.arrivalDays=days;await shot(A,'guest-move-arrived');
  });
  await test('engine rules reach the phone: a warfleet into closed borders is refused with "Rota kapalı" and nothing changes',async()=>{
    const home4=await H.evaluate(()=>G.emps[4].home),before=await HS(),n0=await A.evaluate(()=>MP1Join.results.length);
    await A.evaluate(([f,t])=>MP1Join.cmd({kind:'move',fleet:f,to:t}),[war,home4]);await wait(A,n=>MP1Join.results.length>n,n0);
    assert.equal(await A.evaluate(()=>MP1Join.results.at(-1).code),'rules:passage');await wait(A,()=>/Rota kapalı/.test(document.getElementById('mp2Toast').textContent));
    sameState(before,await HS());
  });
  await test('FİLOLAR tab lists own fleets; HARİTADA centres the map; selection and camera survive tab switches',async()=>{
    await A.locator('.mp2-nav [data-tab="fleets"]').tap();await wait(A,()=>document.querySelectorAll('[data-fleetcard]').length>0);
    const n=await A.evaluate(()=>Object.values(MP1Join.game.view.fleets).filter(f=>f.own).length);assert.equal(await A.locator('[data-fleetcard]').count(),n);
    await A.locator(`[data-fleetcard="${war}"] [data-g2="fshow"]`).tap();await wait(A,()=>MP2Game.G.tab==='map');
    const sel=await A.evaluate(()=>JSON.stringify([MP2Game.G.sel,MP2Game.G.cam]));
    await A.locator('.mp2-nav [data-tab="sci"]').tap();await A.locator('.mp2-nav [data-tab="cols"]').tap();await A.locator('.mp2-nav [data-tab="map"]').tap();
    assert.equal(await A.evaluate(()=>JSON.stringify([MP2Game.G.sel,MP2Game.G.cam])),sel);
  });
  let tech;
  await test('science on the phone: pick a ready technology → host runs researchTarget; Elle mode; progress grows and the tech completes in game time',async()=>{
    await A.locator('.mp2-nav [data-tab="sci"]').tap();await wait(A,()=>document.querySelector('.mp2-tech'));
    tech=await H.evaluate(()=>Object.keys(TECHS).filter(id=>researchReady(G.emps[3],id)&&!Object.values(G.emps[3].rq).includes(id)).sort((a,b)=>techCost(G.emps[3],a)-techCost(G.emps[3],b))[0]);
    const br=await H.evaluate(t=>TECHS[t].b,tech);
    await A.locator(`[data-g2="branch"][data-b="${br}"]`).tap();await A.locator(`.mp2-tech[data-tech="${tech}"]`).tap();
    await A.locator(`.mp2-tdet [data-g2="rtoggle"][data-tech="${tech}"]`).tap();
    await wait(A,t=>MP1Join.game.view.sci.targets.includes(t),tech);assert.deepEqual(await H.evaluate(()=>G.emps[3].research.targets),[tech]);
    await A.locator('[data-g2="rmode"][data-mode="manual"]').tap();await wait(A,()=>MP1Join.game.view.sci.mode==='manual');
    assert.equal(await H.evaluate(()=>researchMode(G.emps[3])),'manual');assert.equal(await H.evaluate(b=>G.emps[3].rq[b],br),tech);
    const p0=await A.evaluate(b=>MP1Join.game.view.sci.rp[b],br);await advance(30);await sync(A);
    assert((await A.evaluate(b=>MP1Join.game.view.sci.rp[b],br))>p0,'progress');await shot(A,'guest-science');
    let m=0;while(!(await H.evaluate(t=>!!G.emps[3].techs[t],tech))&&m<120){await advance(30);m++;}
    assert(await H.evaluate(t=>!!G.emps[3].techs[t],tech),'completed');await sync(A);metrics.researchMonths=m+1;
    await wait(A,t=>MP1Join.game.view.tech[t].s==='d',tech);
    const tn=await H.evaluate(t=>TECHS[t].n,tech);assert(await A.evaluate(n=>MP1Join.game.view.log.some(x=>x.m.includes(n)),tn),'completion notice on the guest');
    assert(!(await H.evaluate(n=>G.log.some(x=>x.m.includes('Araştırma tamamlandı — '+n)),tn))||await H.evaluate(t=>!!G.emps[0].techs[t],tech),'not in the host log');
  });
  await test('locked technology: reason shown, button disabled; host refuses a forced request without side effects',async()=>{
    const lk=await H.evaluate(()=>Object.keys(TECHS).find(id=>!researchAccess(G.emps[3],id).ok)),br=await H.evaluate(t=>TECHS[t].b,lk);
    await A.locator(`[data-g2="branch"][data-b="${br}"]`).tap();await A.locator(`.mp2-tech[data-tech="${lk}"]`).tap();
    assert.equal(await A.locator(`.mp2-tdet [data-g2="rtoggle"]`).isDisabled(),true);assert.match(await A.textContent('.mp2-tdet'),/Erişim koşulu/);
    const before=await HS(),n0=await A.evaluate(()=>MP1Join.results.length);await A.evaluate(t=>MP1Join.cmd({kind:'research',tech:t}),lk);
    await wait(A,n=>MP1Join.results.length>n,n0);assert.equal(await A.evaluate(()=>MP1Join.results.at(-1).code),'rules:access');sameState(before,await HS());
  });
  await test('authorization from a real guest page: other player\'s fleet, forged empire, AI research, duplicate cid, stale seq, malformed packet, paused host — all refused, host Save8/RNG unchanged',async()=>{
    const bFleet=await H.evaluate(()=>G.fleets.find(f=>f.e===4).id),home=await H.evaluate(()=>G.emps[3].home),before=await HS();
    const send=async m=>{const n0=await A.evaluate(()=>MP1Join.results.length+MP1Join.errors.length);await A.evaluate(x=>MP1Join.sendRaw(x),m);await wait(A,n=>MP1Join.results.length+MP1Join.errors.length>n,n0);
      return A.evaluate(()=>{const r=MP1Join.results.at(-1),e=MP1Join.errors.at(-1);return {r:r&&r.code,e};});};
    let seq=await A.evaluate(()=>MP1Join.seq+100);
    assert.equal((await send({v:1,type:'cmd',seq:++seq,cid:'att0000001',cmd:{kind:'move',fleet:bFleet,to:home}})).r,'not-owner');
    assert.equal((await send({v:1,type:'cmd',seq:++seq,cid:'att0000002',empire:4,cmd:{kind:'move',fleet:bFleet,to:home}})).r,'forged-empire');
    assert.equal((await send({v:1,type:'cmd',seq:++seq,cid:'att0000003',empire:1,cmd:{kind:'research',tech:'f_reaktor'}})).r,'forged-empire');
    assert.equal((await send({v:1,type:'cmd',seq:++seq,cid:'att0000004',cmd:{kind:'move',fleet:war,to:home,path:[1,2,3]}})).r,'bad-params');
    assert.equal((await send({v:1,type:'cmd',seq:++seq,cid:'att0000005',cmd:{kind:'research',tech:'__proto__'}})).r,'bad-params');
    assert.equal((await send({v:1,type:'cmd',seq:++seq,cid:'x',cmd:{kind:'move',fleet:war,to:home}})).e,'bad-cmd');
    assert.equal((await send({v:1,type:'cmd',seq:3,cid:'att0000006',cmd:{kind:'move',fleet:war,to:home}})).r,'stale-seq');
    sameState(before,await HS(),'nothing changed');
    // aynı cid'li gerçek emir: bir kez uygulanır
    const ok={v:1,type:'cmd',seq:++seq,cid:'att0000007',cmd:{kind:'move',fleet:war,to:home}};await send(ok);const after=await HS();
    await A.evaluate(x=>{MP1Join.sendRaw(x);MP1Join.sendRaw(x);},ok);await wait(A,()=>MP1Join.results.filter(r=>r.dup).length>=2);sameState(after,await HS(),'duplicate applied once');
    await H.evaluate(()=>MP1Host.host.setPaused(true,'host-background'));assert.equal((await send({v:1,type:'cmd',seq:++seq,cid:'att0000008',cmd:{kind:'move',fleet:war,to:target}})).r,'paused');
    await H.evaluate(()=>MP1Host.host.setPaused(false));sameState(after,await HS());
    await A.evaluate(s=>{MP1Join.seq=s;},seq);
  });
  await test('privacy per player: A and B packets recorded separately — only own fleets/research, no uncontacted empire names or ids, no other player\'s targets',async()=>{
    await B.evaluate(()=>MP1Join.cmd({kind:'research',tech:'m_warp'}));await wait(H,()=>G.emps[4].research.targets.includes('m_warp'));await advance(5);await sync(A);await sync(B);
    for(const [n,p,id,other] of [['A',A,3,4],['B',B,4,3]]){
      const pk=await p.evaluate(()=>MP1Join.packets.filter(t=>t.startsWith('H')&&/"type":"(snapshot|delta)"/.test(t)));
      const truth=await H.evaluate(([id,o])=>({unc:G.emps.filter(x=>x.id!==id&&!G.emps[id].contact[x.id]).map(x=>x.name),uncIds:G.emps.filter(x=>x.id!==id&&!G.emps[id].contact[x.id]).map(x=>x.id),
        fleetNames:(()=>{const own=new Set(G.fleets.filter(f=>f.e===id).map(f=>f.name));return G.fleets.filter(f=>f.e!==id&&f.name&&!own.has(f.name)).map(f=>f.name);})(),
        unknown:G.sys.filter(s=>!explorationContext(G.emps[id]).known.has(s.id)).map(s=>s.name),otherTargets:G.emps[o].research.targets,ownTargets:G.emps[id].research.targets}),[id,other]);
      // kendi filolarının (o an ya da daha önce) adları serbest: paketlerdeki own:1 kayıtlarından
      const ownNames=new Set();for(const t of pk){const m=JSON.parse(t.slice(1)),fl=(m.view&&m.view.fleets)||(m.ops&&m.ops.up&&m.ops.up.fleets)||{};for(const f of Object.values(fl))if(f.own)ownNames.add(f.nm);}
      truth.fleetNames=truth.fleetNames.filter(x=>!ownNames.has(x));
      for(const t of pk){for(const x of truth.unc)assert(!t.includes(JSON.stringify(x)),n+' uncontacted name '+x);for(const x of truth.fleetNames)assert(!t.includes(JSON.stringify(x)),n+' foreign fleet '+x);
        for(const x of truth.unknown)assert(!t.includes(JSON.stringify(x)),n+' unknown system '+x);
        assert(!/"(techs|bank|history|aiStrategy|aiIntel|spy|spies|intel|journal|seen|surv|token)":/.test(t),n+' internal field');
        const m=JSON.parse(t.slice(1)),v=m.view||{},fl=v.fleets||(m.ops&&m.ops.up&&m.ops.up.fleets)||{};
        for(const f of Object.values(fl)){if(f.own)continue;assert(Object.keys(f).every(k=>['id','e','s','n'].includes(k)),n+JSON.stringify(f));assert(!truth.uncIds.includes(f.e),n+' uncontacted empire id on a fleet');}
        for(const sv of Object.values(v.sys||(m.ops&&m.ops.up&&m.ops.up.sys)||{}))if(sv.o!==undefined)assert(!truth.uncIds.includes(sv.o),n+' uncontacted owner id');}
      const sci=await p.evaluate(()=>MP1Join.game.view.sci);assert.deepEqual(sci.targets,truth.ownTargets,n+' sees only its own research targets');
      (metrics.privacy=metrics.privacy||{})[n]={packets:pk.length,bytes:pk.reduce((a,t)=>a+t.length,0),uncontacted:truth.unc.length,hiddenSystems:truth.unknown.length};}
  });
  await test('reconnect: guest page reload returns to the same tab, camera and selection; fleet route and research come back from the host',async()=>{
    await A.locator('.mp2-nav [data-tab="map"]').tap();await A.evaluate(id=>{MP2Game.G.sel={t:'f',id};},war);await A.locator('[data-g2="zin"]').tap();
    const st=await A.evaluate(()=>JSON.stringify([MP2Game.G.tab,MP2Game.G.sel,Math.round(MP2Game.G.cam.z*1e4)]));
    await A.reload();await wait(A,()=>window.MP1Join&&MP1Join.screen==='game'&&MP1Join.game.view&&document.getElementById('mp2Map'));
    assert.equal(await A.evaluate(()=>JSON.stringify([MP2Game.G.tab,MP2Game.G.sel,Math.round(MP2Game.G.cam.z*1e4)])),st);
    assert.deepEqual(await A.evaluate(id=>MP1Join.game.view.fleets[id].pa,war),await H.evaluate(id=>G.fleets.find(f=>f.id===id).path.slice(0,24),war));
    assert.deepEqual(await A.evaluate(()=>MP1Join.game.view.sci.rq),await H.evaluate(()=>G.emps[3].rq));
    await H.evaluate(()=>MP1Host.host.setPaused(true,'host-background'));await wait(A,()=>/arka plana/.test(document.getElementById('jConn').textContent));
    await H.evaluate(()=>MP1Host.host.setPaused(false));await wait(A,()=>/^Bağlı/.test(document.getElementById('jConn').textContent));
  });
  await test('phone layouts 360×800, 390×844, 412×915, 844×390, 915×412: map fills the screen, no overflow, ≥44 px targets, readable text on every tab',async()=>{
    for(const [w,h] of [[360,800],[390,844],[412,915],[844,390],[915,412]]){const tag=w+'x'+h,m=metrics.viewports[tag]={};
      await A.setViewportSize({width:w,height:h});
      for(const t of ['map','fleets','cols','sci']){await A.locator(`.mp2-nav [data-tab="${t}"]`).tap();await A.waitForTimeout(80);
        if(t==='map'){await A.evaluate(id=>{MP2Game.G.sel={t:'s',id};},await A.evaluate(()=>MP1Join.game.view.me.home));await A.locator('[data-g2="home"]').tap();
          await A.evaluate(()=>{document.querySelector('#mp2Sel')&&0;});}
        const l=await layout(A);m[t]=l;assertLayout(l,tag+' '+t);
        if(t==='map'){assert(l.map.w>=w-2&&l.map.h>=(h>w?h*.55:h*.5),'map area '+JSON.stringify(l.map));await shot(A,'guest-map-'+tag);}
        if(t==='sci')await shot(A,'guest-sci-'+tag);}}
    await A.setViewportSize({width:390,height:844});
    await A.goBack();await wait(A,()=>document.getElementById('jSheet'));await A.locator('[data-j="sheetStay"]').tap();assert.equal(await A.evaluate(()=>MP1Join.screen),'game');
  });
  await test('performance: map draw cost, command latency, snapshot/delta size, message rate (live speed 3), guest memory, host month time (45 systems, 2 guests)',async()=>{
    await A.locator('.mp2-nav [data-tab="map"]').tap();await wait(A,()=>document.getElementById('mp2Map').width>100);
    const draw=await A.evaluate(()=>{const t=[];for(let i=0;i<30;i++){const a=performance.now();MP2Game.G.dirty=true;MP2Game.screenOf('s',0);t.push(performance.now()-a);}
      const c=document.getElementById('mp2Map');return {ms:Math.round(t.sort((x,y)=>x-y)[15]*100)/100,canvas:[c.width,c.height]};});
    const hm=await H.evaluate(()=>{const t=[];for(let i=0;i<3;i++){const a=performance.now();MP1Host.advance(30);t.push(performance.now()-a);}return t.sort((a,b)=>a-b)[1];});
    // canlı oyun: host hız 3'te 4 sn; misafir mesaj sıklığı ve trafiği
    await sync(A);const n0=await A.evaluate(()=>MP1Join.stats.msgs),b0=await A.evaluate(()=>MP1Join.stats.bytes),d0=await H.evaluate(()=>G.day),k0=await A.evaluate(()=>MP1Join.packets.length);
    await H.evaluate(()=>UI.setSpeed(3));await H.waitForTimeout(4000);await H.evaluate(()=>UI.setSpeed(0));await sync(A);
    const live=await A.evaluate(([n0,b0,k0])=>{const pk=MP1Join.packets.slice(k0).filter(x=>x.includes('"type":"delta"')).map(x=>x.length).sort((a,b)=>a-b);
      return {msgs:MP1Join.stats.msgs-n0,bytes:MP1Join.stats.bytes-b0,deltas:pk.length,deltaMedian:pk[pk.length>>1],deltaMax:pk[pk.length-1],heapMB:performance.memory?Math.round(performance.memory.usedJSHeapSize/1048576*10)/10:null,
        snapshotBytes:Math.max(...MP1Join.packets.filter(x=>x.includes('"type":"snapshot"')).map(x=>x.length))};},[n0,b0,k0]);
    const days=(await H.evaluate(()=>G.day))-d0;
    metrics.perf.s45={drawMs:draw.ms,canvas:draw.canvas,hostMonthMs:Math.round(hm),moveCommandMs:metrics.moveCommandMs,live:{seconds:4,gameDays:Math.round(days),...live,msgsPerSec:Math.round(live.msgs/4*10)/10,bytesPerSec:Math.round(live.bytes/4)}};
    assert(draw.canvas[0]>100&&draw.ms<16,'draw within a frame');assert(live.snapshotBytes<40000);assert(live.deltas>0);
  });
  await test('60 systems: real play on a second galaxy (move + research), then 100-system capacity check (snapshot size, draw cost, host publish)',async()=>{
    const H2=await (await bH.newContext(PHONE(915,412))).newPage(),G2=await (await bA.newContext(PHONE(390,844))).newPage();
    for(const [n,p] of [['host60',H2],['guest60',G2]])p.on('pageerror',e=>errors.push(n+': '+e.message));
    await room(H2,'buyuk',7,23,[[G2,'Altmış',2]]);
    const mv=await H2.evaluate(()=>{const e=G.emps[2];for(const f of G.fleets.filter(f=>f.e===2))for(const s of G.sys){if(s.id===f.sys)continue;const p=findPath(f.sys,s.id,e);if(p&&p.length>=1&&p.length<=3&&pathAllowed(e,f,p,f.sys))return {f:f.id,t:s.id};}});
    const t0=Date.now();await G2.evaluate(x=>MP1Join.cmd({kind:'move',fleet:x.f,to:x.t}),mv);await wait(G2,()=>MP1Join.results.length>0);const cmdMs=Date.now()-t0;
    assert.equal(await G2.evaluate(()=>MP1Join.results.at(-1).status),'ok');assert.equal(await H2.evaluate(x=>G.fleets.find(f=>f.id===x.f).path.at(-1),mv),mv.t);
    const tc=await H2.evaluate(()=>Object.keys(TECHS).find(id=>researchReady(G.emps[2],id)));await G2.evaluate(t=>MP1Join.cmd({kind:'research',tech:t}),tc);
    await wait(H2,t=>G.emps[2].research.targets.includes(t),tc);
    const hm=await H2.evaluate(()=>{const t=[];for(let i=0;i<3;i++){const a=performance.now();MP1Host.advance(30);t.push(performance.now()-a);}return t.sort((a,b)=>a-b)[1];});
    const day=await H2.evaluate(()=>Math.floor(G.day));await wait(G2,d=>MP1Join.game.clock.day===d,day);
    const g=await G2.evaluate(()=>{const t=[];for(let i=0;i<20;i++){const a=performance.now();MP2Game.G.dirty=true;MP2Game.screenOf('s',0);t.push(performance.now()-a);}
      const sn=MP1Join.packets.filter(x=>x.includes('"type":"snapshot"')).map(x=>x.length);return {draw:t.sort((a,b)=>a-b)[10],snap:Math.max(...sn),sys:Object.keys(MP1Join.game.view.sys).length};});
    metrics.perf.s60={systems:g.sys,commandMs:cmdMs,hostMonthMs:Math.round(hm),drawMs:Math.round(g.draw*100)/100,snapshotBytes:g.snap};
    // 100 sistem: host sayfasında gerçek motor + çekirdek; misafir haritası aynı veriyle çizilir
    const cap=await H2.evaluate(()=>{MP1Host.started=false;setupGame({...CFG,size:'ulu',aiCount:11,seed:42});G.autoSave=false;let snap='';
      const mp=StarsMP.createHost({roomId:'cap',random:n=>'cd'.repeat(n),send:(c,t)=>{if(!snap&&t.includes('"type":"snapshot"'))snap=t;}});mp.onMessage('g',JSON.stringify({v:1,type:'hello',name:'P'}));
      const pid=[...mp.state.players.keys()].find(k=>k!=='host');let a=performance.now();mp.assign(pid,3);const assignMs=performance.now()-a;
      const t=[];for(let i=0;i<5;i++){a=performance.now();mp.publish();t.push(performance.now()-a);}
      return {systems:G.sys.length,snapshotBytes:snap.length,publishMs:Math.round(t.sort((x,y)=>x-y)[2]*100)/100,assignMs:Math.round(assignMs),snapshot:snap};});
    const draw100=await G2.evaluate(s=>{const m=JSON.parse(s);MP1Join.game.view=m.view;MP2Game.G.tab='map';MP2Game.fit('all');const t=[];
      for(let i=0;i<20;i++){const a=performance.now();MP2Game.G.dirty=true;MP2Game.screenOf('s',0);t.push(performance.now()-a);}return Math.round(t.sort((a,b)=>a-b)[10]*100)/100;},cap.snapshot.slice(cap.snapshot.indexOf('{')));
    metrics.perf.s100={systems:cap.systems,snapshotBytes:cap.snapshotBytes,hostPublishMs:cap.publishMs,guestDrawMs:draw100};
    assert.equal(cap.systems,100);assert(draw100<16&&cap.publishMs<50);
    await shot(G2,'guest-map-100');await H2.close();await G2.close();
  });
  assert.equal(errors.length,0,'page errors: '+errors.join(' | '));
}catch(e){results.push({name:'harness',status:'FAIL',error:String(e&&e.stack||e)});console.log('FAIL harness\n'+(e&&e.stack||e));}
finally{
  metrics.pageErrors=errors;fs.writeFileSync(path.join(out,'mp2-results.json'),JSON.stringify({note:'Yerel relay + ayrı Chromium süreçleri (mobil dokunmatik bağlam). Gerçek internet ya da fiziksel Android DEĞİL.',results,metrics},null,1));
  for(const b of [bH,bA,bB])if(b)await b.close().catch(()=>{});if(relay)relay.shutdown('test-end');
  const pass=results.filter(r=>r.status==='PASS').length,fail=results.length-pass;console.log('GEÇEN: '+pass+' KALAN: '+fail);process.exit(fail?1:0);
}})();
