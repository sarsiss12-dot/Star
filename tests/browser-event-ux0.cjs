'use strict';
/* BETA-EVENT-UX.0 — tek oyunculu gerçek Chromium: (1) casusluk paneli sürükleme kolu (fare, dokunma, klavye; yalnız İSTİHBARAT;
   öteki paneller standart; hatırlama; hit-test; harita seçimine sızmama), (2) federasyon / Konsey bilgi kartları (Save8 / inboxUid /
   hız değişmez, tekil, kayıt yüklemede yeniden doğmaz, dokununca haber ayrıntısı), (3) Konsey oy kartında hızlı EVET (tam pencereyle
   aynı castCouncilVote yolu, tam bir kez; oy verilince kart düşer), (4) federasyon oy kartında hızlı EVET (mevcut yol).
   STARS_ROOT ile başka bir kaynak ağacı (ör. düzeltme öncesi taban) aynı testle koşulabilir. */
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict'),{chromium}=require('playwright');
const root=path.resolve(process.env.STARS_ROOT||path.join(__dirname,'..')),out=path.resolve(process.env.STARS_OUTPUT||'/tmp/event-ux0');fs.mkdirSync(out,{recursive:true});
const results=[],errors=[];let server,browser;
async function test(name,fn){if(process.env.EUX_ONLY&&!new RegExp(process.env.EUX_ONLY).test(name)){console.log('NOT RUN '+name);return;}
  try{await fn();results.push({name,status:'PASS'});console.log('PASS '+name);}catch(e){results.push({name,status:'FAIL',error:String(e&&e.stack||e).slice(0,1500)});console.log('FAIL '+name+'\n'+String(e&&e.stack||e).slice(0,1500));}}
async function page(w,h,mobile){const ctx=await browser.newContext({viewport:{width:w,height:h},...(mobile?{isMobile:true,hasTouch:true,deviceScaleFactor:1}:{})});const p=await ctx.newPage();p.setDefaultTimeout(8000);
  p.on('pageerror',e=>errors.push(w+'x'+h+': '+e.message));
  await p.goto('http://127.0.0.1:'+server.address().port+'/');await p.waitForFunction(()=>typeof UI!=='undefined'&&typeof setupGame==='function');
  await p.evaluate(()=>{setupGame({...CFG,seed:22,size:'orta',aiCount:5});G.autoSave=false;$('title').classList.add('hidden');enterGame(true);LOOP.on=false;UI.setSpeed(0);UI.closeModal();UI.tab('sistem');UI.refresh();});
  return {p,ctx};}
const W=p=>p.evaluate(()=>Math.round(document.getElementById('sidebar').getBoundingClientRect().width));
const shot=(p,n)=>p.screenshot({path:path.join(out,n+'.png')}).catch(()=>{});
async function touchDrag(p,x,y,dx){const c=await p.context().newCDPSession(p);try{await c.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
  for(let i=1;i<=8;i++)await c.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+dx*i/8,y}]});await c.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}finally{await c.detach().catch(()=>{});}}
const handle=p=>p.evaluate(()=>{const h=document.getElementById('sbResize');if(!h)return null;const r=h.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2,top=document.elementFromPoint(x,y);
  return {x,y,visible:r.width>0&&getComputedStyle(h).display!=='none',hit:top===h};});

(async()=>{try{
  server=http.createServer((q,r)=>{const n=new URL(q.url,'http://x').pathname,f=path.resolve(root,'.'+(n==='/'?'/index.html':n));if(!f.startsWith(root+path.sep))return r.writeHead(403).end();
    fs.readFile(f,(e,b)=>{if(e)return r.writeHead(404).end();r.setHeader('Content-Type',f.endsWith('.js')?'text/javascript':f.endsWith('.html')?'text/html':'application/json');r.end(b);});});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  browser=await chromium.launch({executablePath:process.env.STARS_CHROMIUM_PATH||undefined,args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage']});

  for(const [w,h,mobile] of [[1280,720,false],[1920,1080,false],[800,360,true],[915,412,true]])
  await test('S1 '+w+'×'+h+(mobile?' dokunma':' fare')+': casusluk kolu yalnız İSTİHBARAT\'ta; sola sürükleme genişletir, sağa daraltır; SİSTEM / FİLO standart; geri dönünce son genişlik; diplomasi aç/kapa korur; hit-test; harita seçimi değişmez',async()=>{
    const {p,ctx}=await page(w,h,mobile);try{
      const sysW=await W(p);await p.evaluate(()=>UI.tab('filo'));const fleetW=await W(p);assert.equal(await handle(p),null,'İSTİHBARAT dışında kol yok');
      await p.evaluate(()=>UI.tab('intel'));const base=await W(p);const h0=await handle(p);assert(h0&&h0.visible,'kol görünür');assert(h0.hit,'kol dokunulabilir (üstte başka öğe yok)');
      const sel0=await p.evaluate(()=>View.selSys&&View.selSys.id);
      const grow=mobile?-160:-260;
      if(mobile)await touchDrag(p,h0.x,h0.y,grow);else{await p.mouse.move(h0.x,h0.y);await p.mouse.down();for(let i=1;i<=10;i++)await p.mouse.move(h0.x+grow*i/10,h0.y);await p.mouse.up();}
      const wide=await W(p);assert(wide>base+(mobile?60:150),'genişledi: '+base+' → '+wide);
      assert.equal(await p.evaluate(()=>View.selSys&&View.selSys.id),sel0,'sürükleme harita seçimini değiştirmez');
      const vw=w;assert(vw-wide>=200,'haritaya en az ~220 px kalır ('+(vw-wide)+')');
      await shot(p,'s1-'+w+'-intel-wide');
      await p.evaluate(()=>UI.tab('sistem'));assert.equal(await W(p),sysW,'SİSTEM kendi standart genişliğinde');assert.equal(await handle(p)!==null&&(await handle(p)).visible,false,'SİSTEM\'de kol gizli');
      await p.evaluate(()=>UI.tab('filo'));assert.equal(await W(p),fleetW,'FİLO kendi standart genişliğinde');
      await p.evaluate(()=>UI.tab('intel'));assert.equal(await W(p),wide,'İSTİHBARAT son genişlikte');
      await p.evaluate(()=>{UI.openDiplo();});await p.evaluate(()=>UI.act('closeDiplo'));assert.equal(await W(p),wide,'diplomasi aç/kapa sonrası korunur');
      /* daraltma (sağa) ve sınır: standart genişliğin altına inmez */
      const h1=await handle(p);if(mobile)await touchDrag(p,h1.x,h1.y,400);else{await p.mouse.move(h1.x,h1.y);await p.mouse.down();await p.mouse.move(h1.x+400,h1.y,{steps:8});await p.mouse.up();}
      assert.equal(await W(p),base,'en dar = standart genişlik');
      /* klavye */
      await p.focus('#sbResize');await p.keyboard.press('ArrowLeft');await p.keyboard.press('ArrowLeft');assert.equal(await W(p),base+48,'klavye ← ×2 = +48');
      await p.keyboard.press('Home');const mx=await W(p);assert(mx>=base+48&&w-mx>=200,'Home = en geniş, haritaya yer kalır');
      /* içerik yeni genişliğe uyar: casusluk düzeni panelden taşmaz */
      const fit=await p.evaluate(()=>{const ws=document.querySelector('#panel .spyWorkspace')||document.querySelector('#panel');const pr=document.getElementById('panel').getBoundingClientRect(),r=ws.getBoundingClientRect();return {over:Math.round(r.right-pr.right),w:Math.round(r.width)};});
      assert(fit.over<=1,'içerik taşmıyor '+JSON.stringify(fit));
      /* sayfa yenilenince hatırlanır (yerel tercih); Save8'e girmez */
      const save=await p.evaluate(()=>serialize());assert(!/spyWidth/.test(save),'Save8\'de genişlik yok');
      await p.reload();await p.waitForFunction(()=>typeof UI!=='undefined');
      await p.evaluate(()=>{setupGame({...CFG,seed:22,size:'orta',aiCount:5});G.autoSave=false;$('title').classList.add('hidden');enterGame(true);LOOP.on=false;UI.setSpeed(0);UI.closeModal();UI.tab('intel');});
      assert(Math.abs(await W(p)-mx)<=2,'yeniden açılışta son genişlik ('+(await W(p))+' / '+mx+')');await p.evaluate(()=>UI.tab('sistem'));assert.equal(await W(p),sysW);
    }finally{await ctx.close();}});

  const FED=`(()=>{for(const e of G.emps)if(!e.wild){for(const k of ['etk','ene','min','ala'])e.res[k]=Math.max(e.res[k],3000);}
    for(const a of [0,1,2,3])for(const b of [0,1,2,3])if(a!==b){G.emps[a].contact[b]=true;G.emps[a].rel[b]=60;}
    const F={id:100,name:'EUX Test Birliği',type:'bilimsel',charter:fedDefaultCharter('bilimsel'),leader:1,founder:1,members:[0,1,2],laws:{},fund:{ala:0,ene:0},treasury:0,
      founded:G.day,typeSince:G.day,dutySince:{defense:0,offense:0},invites:{},decisions:{},dutyConsent:{},cohesion:70,nextVote:G.day+100000,politicsVersion:96};
    G.feds=[F];G.fedUid=100;for(const a of F.members)for(const b of F.members)if(a!==b)G.emps[a].ally[b]=true;fedNormalize(F);for(const id of [0,1,2,3])recalcMods(G.emps[id]);return F;})()`;
  await test('S2 federasyon bilgi kartı: olay haberi üst çubukta kart olur; G.inboxUid / kayıtlı kutu / hız değişmez; tekil; dokununca haber ayrıntısı; kayıt yüklemede yeniden doğmaz; ikinci olay yeni kart',async()=>{
    const {p,ctx}=await page(1280,720,false);try{
      await p.evaluate(FED);await p.evaluate(()=>{UI.tick();});
      const before=await p.evaluate(()=>({uid:G.inboxUid|0,inbox:JSON.stringify(serializeEventsWorld().inbox),cards:document.querySelectorAll('#inbox .nInfo').length,spd:G.speed}));
      assert.equal(before.cards,0,'başlangıçta var olan haberler kart olmaz');
      await p.evaluate(()=>{UI.setSpeed(2);LOOP.on=false;fedPoliticalRecord(G.feds[0],'join',{target:3});G.feds[0].members.push(3);UI.tick();UI.tick();});
      const a=await p.evaluate(()=>({uid:G.inboxUid|0,inbox:JSON.stringify(serializeEventsWorld().inbox),cards:[...document.querySelectorAll('#inbox .nInfo')].map(c=>c.textContent.replace(/\s+/g,' ').trim()),spd:G.speed}));
      assert.equal(a.cards.length,1,'tek kart: '+JSON.stringify(a.cards));assert(/Federasyona katılım/.test(a.cards[0]),a.cards[0]);
      assert.equal(a.uid,before.uid,'inboxUid değişmez');assert.equal(a.inbox,before.inbox,'kayıtlı kutu değişmez');assert.equal(a.spd,2,'hız değişmez (duraklatma yok)');
      await shot(p,'s2-fed-info-card');
      for(let i=0;i<5;i++)await p.evaluate(()=>{UI.tick();UI.drawInbox();});assert.equal(await p.locator('#inbox .nInfo').count(),1,'yeniden çizimde tekil');
      /* kayıt → yükle: aynı olay yeniden doğmaz */
      await p.evaluate(()=>{const s=serialize();deserialize(s);UI.refresh();UI.tick();UI.tick();});
      const afterLoad=await p.locator('#inbox .nInfo').count();assert(afterLoad<=1,'yüklemede çoğalmaz ('+afterLoad+')');
      await p.evaluate(()=>{UI._instInfo=null;UI.tick();UI.tick();});assert.equal(await p.locator('#inbox .nInfo').count(),0,'yeni oturum / yüklenen kayıtta eski olay kart olmaz');
      /* yeni olay → yeni kart; dokununca haber ayrıntısı, kart düşer */
      await p.evaluate(()=>{G.day+=1;fedPoliticalRecord(G.feds[0],'leave',{target:3});G.feds[0].members=G.feds[0].members.filter(x=>x!==3);UI.tick();UI.tick();});
      assert.equal(await p.locator('#inbox .nInfo').count(),1,'yeni olay → kart');
      await p.locator('#inbox .nInfo').first().click();await p.waitForFunction(()=>!document.getElementById('modal').classList.contains('hidden')&&/Federasyon/.test(document.getElementById('modal').textContent));
      await shot(p,'s2-fed-info-detail');await p.evaluate(()=>UI.closeModal());await p.evaluate(()=>UI.tick());assert.equal(await p.locator('#inbox .nInfo').count(),0,'açılan kart düşer');
      /* üye olmayana: üye olmadığı federasyonun oylama sonucu kartı yok */
      await p.evaluate(()=>{G.feds[0].members=G.feds[0].members.filter(x=>x!==0);G.feds[0].lastVote={id:'x9',law:Object.keys(FED_LAWS)[0],kind:'basic',day:G.day,passed:true,yes:2,no:0,why:'test'};UI.tick();UI.tick();});
      assert.equal(await p.locator('#inbox .nInfo').count(),0,'üye olmayana oylama sonucu kartı yok');
    }finally{await ctx.close();}});

  await test('S3 federasyon oylaması: oy kartı (motor) + hızlı EVET tek oy; sonuçlanınca "oylama sonuçlandı" bilgi kartı; kapanmış oy kartı yeniden doğmaz',async()=>{
    const {p,ctx}=await page(1280,720,false);try{
      await p.evaluate(FED);
      const k=await p.evaluate(()=>{const F=G.feds[0],ks=[...Object.keys(FED_LAWS),...Object.keys(FED_INNER_LAWS)],k=ks.find(k=>canFedLaw(G.emps[F.leader],k,false).ok);if(!k)return null;proposeFedLaw(G.emps[F.leader],k);UI.tick();return {k,tok:F.vote&&fedVoteToken(F.vote),wait:F.vote&&fedVoteCounts(F).waiting};});
      assert(k&&k.tok,'fikstür: oylama açıldı '+JSON.stringify(k));
      await p.evaluate(()=>UI.closeModal());const card=p.locator('#inbox [data-a="noteQuick"][data-x$=":y"]');await card.first().waitFor();await shot(p,'s3-fedvote-card');
      await card.first().click();await p.waitForTimeout(150);
      const v=await p.evaluate(()=>{const F=G.feds[0];return {yes:F.vote?F.vote.yes.filter(x=>x===0).length:(F.lastVote&&F.lastVote.yesMembers||[]).filter(x=>x===0).length,open:!!F.vote};});
      assert.equal(v.yes,1,'oy tam bir kez');
      await p.evaluate(()=>{const F=G.feds[0];if(F.vote){const t=fedVoteToken(F.vote);for(const id of fedVoteCounts(F).waiting)if(id!==0)castFedVote(G.emps[id],F.id,t,true);if(F.vote)finishFedVote(F);}UI.closeModal();UI.tick();UI.tick();});
      await p.waitForFunction(()=>{UI.drawInbox();return [...document.querySelectorAll('#inbox .nInfo')].some(e=>/oylaması sonuçlandı/.test(e.textContent));},undefined,{timeout:3000,polling:200}).catch(()=>{});   // tıklamadan hemen sonra yüzey çizimi 220 ms ertelenir
      const info=await p.evaluate(()=>[...document.querySelectorAll('#inbox .nInfo')].map(c=>c.textContent.replace(/\s+/g,' ').trim()));
      if(!info.some(t=>/oylaması sonuçlandı/.test(t))){const dg=await p.evaluate(()=>({lv:G.feds[0].lastVote&&{id:G.feds[0].lastVote.id,day:G.feds[0].lastVote.day},vote:!!G.feds[0].vote,day:G.day,st:UI._instInfo&&{day:UI._instInfo.day,live:UI._instInfo.live.map(r=>r.key),seen:[...UI._instInfo.seen].slice(-8)},members:G.feds[0].members}));assert.fail('sonuç kartı: '+JSON.stringify(info)+' '+JSON.stringify(dg));}
      assert.equal(await p.locator('#inbox [data-a="openNote"]').evaluateAll(es=>es.filter(e=>{const n=G.inbox.find(x=>x.uid===+e.dataset.x);return n&&n.kind==='fedvote';}).length),0,'kapanmış oy kartı yok');
      await shot(p,'s3-fedvote-result');
    }finally{await ctx.close();}});

  await test('S4 Konsey oylaması: kartta hızlı EVET / HAYIR; tam penceredeki castCouncilVote ile tam bir kez; oy verilince kart düşer, çift dokunma ikinci oy yazmaz',async()=>{
    const {p,ctx}=await page(800,360,true);try{
      const ok=await p.evaluate(()=>{for(const e of G.emps)if(!e.wild)e.res.etk=Math.max(e.res.etk,3000);for(const a of [0,1,2,3])for(const b of [0,1,2,3])if(a!==b){G.emps[a].contact[b]=true;}
        G.cfg.council='acik';G.council={name:'EUX Konseyi',founder:1,members:[0,1,2,3],laws:{},targeted:{},treasury:0,president:1,termStart:G.day,terms:{1:1},voteIn:30,vote:null,dead:false};
        startCouncilVote();UI.tick();return !!(G.council.vote&&!G.council.vote.done&&!G.council.vote.yes.includes(0)&&!G.council.vote.no.includes(0));});
      assert(ok,'fikstür: oyuncunun oyunu bekleyen Konsey oylaması');await p.evaluate(()=>UI.closeModal());
      const cuid=await p.evaluate(()=>G.inbox.find(n=>n.kind==='cncvote').uid);const y=p.locator('#inbox [data-a="noteQuick"][data-x="'+cuid+':y"]');await y.first().waitFor();await shot(p,'s4-council-card-800');
      const box=await y.first().boundingBox();assert(box.height>=40&&box.width>=44,'dokunma hedefi ≥44 px: '+JSON.stringify(box));
      await y.first().tap();await p.waitForTimeout(450);
      const r=await p.evaluate(()=>{const v=G.council.vote,lv=G.council.lastVote;const yes=v?v.yes:(lv?lv.yes:[]);return {yes:yes.filter(x=>x===0).length,cards:G.inbox.filter(n=>n.kind==='cncvote').length};});
      assert.equal(r.yes,1,'EVET tam bir kez');await p.evaluate(()=>UI.drawInbox());assert.equal(await p.locator('#inbox [data-a="noteQuick"][data-x^="'+cuid+':"]').count(),0,'oy verilince kart / düğme kalmaz');
      /* ikinci dokunma yolu: eski kart nesnesiyle doğrudan eylem → yeni oy yazılmaz */
      const again=await p.evaluate(cuid=>{try{UI.noteQuickAct(cuid+':y');}catch(e){return 'throw '+e.message;}const v=G.council.vote||G.council.lastVote;return (v.yes||[]).filter(x=>x===0).length;},cuid);assert.equal(again,1);
    }finally{await ctx.close();}});

  /* ---- BETA-EVENT-UX.1 ---- */
  const FED2=FED.replace("members:[0,1,2]","members:[1,2]").replace("for(const a of F.members)for(const b of F.members)","for(const a of [0,...F.members])for(const b of [0,...F.members])");
  await test('S6 üyelik başvurusu (gerçek requestFederation): oy kabul olursa eski "oylamada" kartı yerine ayrı aday rızası için KABUL / REDDET davet kartı; KABUL tam Gelen kutusu yoluyla üye yapar; Save8 kutusu / inboxUid değişmez',async()=>{
    const {p,ctx}=await page(1280,720,false);try{
      await p.evaluate(FED2);await p.evaluate(()=>{UI.tick();});
      const r=await p.evaluate(()=>{const F=G.feds[0],uid=G.inboxUid|0,inbox=JSON.stringify(serializeEventsWorld().inbox);const q=requestFederation(G.p,G.emps[F.leader]);
        for(let i=0;i<4&&F.vote;i++){const t=fedVoteToken(F.vote);for(const id of fedVoteCounts(F).waiting)castFedVote(G.emps[id],F.id,t,true);if(F.vote)finishFedVote(F);}
        UI.closeModal();UI.tick();UI.tick();return {q:q&&(q.ok?'ok':q.why),inv:!!(F.invites&&F.invites[0]),adm:Object.values(F.admissionResults||{}).map(x=>x.status),uid0:uid,uid1:G.inboxUid|0,same:inbox===JSON.stringify(serializeEventsWorld().inbox)};});
      const info=await p.evaluate(()=>[...document.querySelectorAll('#inbox .nInfo')].map(e=>e.textContent.replace(/\s+/g,' ').trim()));
      assert.equal(r.q,'ok','başvuru: '+JSON.stringify(r));assert(!info.some(t=>/başvurun oylamada/.test(t)),'oy kabul edildikten sonra eski "oylamada" kartı yok (karar davet kartında): '+JSON.stringify(info));
      assert(r.inv,'oy kabul → davet: '+JSON.stringify(r));assert.equal(r.uid1,r.uid0,'inboxUid değişmez');assert(r.same,'kayıtlı kutu değişmez');
      const k=p.locator('#inbox [data-a="instDecide"][data-x$=":y"]');await k.first().waitFor();await shot(p,'s6-invite-card');
      await k.first().click();await p.waitForTimeout(150);
      const after=await p.evaluate(()=>({member:!!(findFed(G.p)&&findFed(G.p).id===100),inv:!!(G.feds[0].invites||{})[0],rec:DiplomaticInbox.state().records.filter(r=>r.kind==='invite').map(r=>r.status)}));
      assert(after.member,'KABUL → üye '+JSON.stringify(after));const gone=await p.waitForFunction(()=>{UI.drawInbox();return !document.querySelector('#inbox [data-a="instDecide"]');},undefined,{timeout:3000,polling:200}).then(()=>true,()=>false);assert(gone,'karar sonrası kart kalmaz');   // yüzey çizimi dokunmadan sonra 220 ms ertelenir
      assert.deepEqual(after.rec,['accepted'],'tek Gelen kutusu kaydı, kabul');
    }finally{await ctx.close();}});
  await test('S7 üye için üyelik başvurusu oy kartı başvuranı adıyla gösterir ("Üyelik başvurusu — X"); hızlı EVET aynı yol',async()=>{
    const {p,ctx}=await page(1280,720,false);try{
      await p.evaluate(FED);const r=await p.evaluate(()=>{const F=G.feds[0];G.emps[3].res.etk=3000;for(const id of F.members){G.emps[3].contact[id]=G.emps[id].contact[3]=true;}const q=requestFederation(G.emps[3],G.emps[F.leader]);UI.closeModal();UI.tick();
        const n=G.inbox.find(n=>n.kind==='fedvote');return {q:q&&(q.ok?'ok':q.why),sub:n&&n.sub,name:G.emps[3].name,wait:F.vote&&fedVoteCounts(F).waiting};});
      assert.equal(r.q,'ok',JSON.stringify(r));assert.equal(r.sub,'Üyelik başvurusu — '+r.name,JSON.stringify(r));await shot(p,'s7-admit-card');
    }finally{await ctx.close();}});
  await test('S8 başkan değişimleri: federasyon başkanı ayrılınca (gerçek leaveFederation) üyeye tek kart; Konsey dönem sonu seçimi (gerçek councilTick) başkan değişirse üyeye tek kart; Konsey karar metninde gün tam sayı',async()=>{
    const {p,ctx}=await page(800,360,true);try{
      await p.evaluate(FED);await p.evaluate(()=>UI.tick());
      await p.evaluate(()=>{G.day+=1;leaveFederation(G.emps[G.feds[0].leader]);UI.tick();UI.tick();UI.tick();});
      let info=await p.evaluate(()=>[...document.querySelectorAll('#inbox .nInfo')].map(e=>e.textContent.replace(/\s+/g,' ').trim()));
      assert.equal(info.filter(t=>/Federasyon başkanı değişti/.test(t)).length,1,'tek başkan kartı: '+JSON.stringify(info));
      const c=await p.evaluate(()=>{for(const e of G.emps)if(!e.wild)e.res.etk=Math.max(e.res.etk,3000);G.cfg.council='acik';
        G.council={name:'EUX Konseyi',founder:1,members:[0,1,2,3],laws:{},targeted:{},treasury:0,president:0,termStart:G.day,terms:{0:1},voteIn:9999,vote:null,dead:false,termAge:PRESIDENT_TERM-1};
        const w=m=>voteWeight(G.emps[m]),ms=[0,1,2,3].sort((a,b)=>w(a)-w(b));G.council.president=ms[0];G.council.terms={[ms[0]]:1};UI.tick();
        G.day+=1;councilTick();UI.tick();UI.tick();return {pres:G.council.president,changed:G.council.president!==ms[0]};});
      info=await p.evaluate(()=>[...document.querySelectorAll('#inbox .nInfo')].map(e=>e.textContent.replace(/\s+/g,' ').trim()));
      assert(c.changed,'fikstür: başkan değişti');assert.equal(info.filter(t=>/Konsey başkanlığı değişti/.test(t)).length,1,'tek Konsey başkanı kartı: '+JSON.stringify(info));
      const veto=await p.evaluate(()=>{G.council.laws.muhafiz=true;UI.tick();G.p.guardian={vetoAt:-1e9};G.day+=1;const r=guardianVeto(G.p,'muhafiz');UI.tick();UI.tick();return {ok:r.ok,cards:[...document.querySelectorAll('#inbox .nInfo')].filter(e=>/yürürlükten kalktı/.test(e.textContent)).map(e=>e.textContent.replace(/\s+/g,' ').trim())};});
      assert(veto.ok,'fikstür: gerçek guardianVeto');assert.equal(veto.cards.length,1,'yasa kalkma kartı: '+JSON.stringify(veto));assert(/Konsey Muhafızları/.test(veto.cards[0]));
      const dt=await p.evaluate(()=>UI.dayText('Kabul edildi · EVET 1.0 / HAYIR 0.0 · gün 9.406519999999936'));assert.equal(dt,'Kabul edildi · EVET 1.0 / HAYIR 0.0 · gün 9');
      await shot(p,'s8-leader-cards-800');
      const over=await p.evaluate(()=>[...document.querySelectorAll('#inbox .nCard')].map(e=>e.scrollWidth-e.clientWidth).filter(x=>x>2).length);assert.equal(over,0,'kartlar yatay taşmıyor (800×360)');
    }finally{await ctx.close();}});
  await test('S5 sayfa hataları yok',async()=>{assert.deepEqual(errors,[]);});
}catch(e){console.log('FATAL',e);results.push({name:'FATAL',status:'FAIL',error:String(e&&e.stack||e)});}
finally{try{await browser?.close();}catch{}try{server?.close();}catch{}
  fs.writeFileSync(path.join(out,'event-ux0-sp.json'),JSON.stringify({root,results,errors},null,1));
  const pass=results.filter(r=>r.status==='PASS').length;console.log('GEÇEN: '+pass+' KALAN: '+(results.length-pass));process.exit(results.length-pass?1:0);}
})();
