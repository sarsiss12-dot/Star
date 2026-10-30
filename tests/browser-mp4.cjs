'use strict';
/* MP.4 — çok oyunculu kayıt / yükleme / odayı yeniden açma, gerçek tarayıcılarda ve gerçek kapatmayla.
   Süreçler: relay ayrı Node süreci (kapatılıp aynı portta yeniden başlatılır); host telefon kalıcı profilli ayrı Chromium
   (IndexedDB diskte; tarayıcı süreci GERÇEKTEN kapanır, yeni süreç aynı profille açılır); misafir B ayrı Chromium;
   misafir C kalıcı profilli ayrı Chromium (o da kapanıp yeniden açılır); izinsiz kişi ayrı Chromium.
   Dünya: seed 22, orta, 5 AI; B = devlet 3, C = devlet 5. FİKSTÜR (açıkça): siyasi başlangıç (temas, Etki/kaynak,
   C'ye ek filo, AI 1 başkanlığında {1, 2, B} federasyonu) — tests/mp4_core_test.js ile aynı.
   Yerel relay; gerçek internet ve fiziksel Android değildir. Çıktı: $STARS_OUTPUT/mp4-results.json + PNG + kayıt dosyaları. */
const fs=require('fs'),os=require('os'),path=require('path'),net=require('net'),assert=require('assert/strict'),{spawn,execSync}=require('child_process'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),out=path.resolve(process.env.STARS_OUTPUT||path.join(root,'../evidence/mp4'));fs.mkdirSync(out,{recursive:true});
const RELAY=path.join(root,'research/mp1/server/relay.js');
const results=[],errors=[],metrics={processes:{},perf:{},files:{},viewports:{},notes:[]};
const launch={executablePath:process.env.STARS_CHROMIUM_PATH||undefined,args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--enable-precise-memory-info']};
const PHONE=(w,h)=>({viewport:{width:w,height:h},isMobile:true,hasTouch:true,deviceScaleFactor:2});
const VIEWS=[[360,800],[390,844],[412,915],[844,390],[915,412]];
const B=3,C=5;
async function test(name,fn){const t0=Date.now();try{await fn();results.push({name,status:'PASS',ms:Date.now()-t0});console.log('PASS '+name);}
  catch(e){results.push({name,status:'FAIL',error:String(e&&e.stack||e).slice(0,1600)});console.log('FAIL '+name+'\n'+(e&&e.stack||e));}}
const wait=(p,fn,arg,timeout=25000)=>p.waitForFunction(fn,arg,{timeout,polling:50});
const shot=(p,n)=>p.screenshot({path:path.join(out,n+'.png')}).catch(()=>{});
const strip=s=>JSON.stringify(JSON.parse(s),(k,v)=>k[0]==='_'?undefined:v);
const HS=p=>p.evaluate(()=>({s:JSON.stringify(JSON.parse(serialize()),(k,v)=>k[0]==='_'?undefined:v),r:RND_STATE,day:G.day}));
const POLITICS=`(()=>{
  for(const e of G.emps)if(!e.wild){for(const k of ['etk','ene','min','ala'])e.res[k]=Math.max(e.res[k],2000);}
  for(const a of [0,1,2,3,4,5])for(const b of [0,1,2,3,4,5])if(a!==b){G.emps[a].contact[b]=true;G.emps[a].rel[b]=60;}
  newFleet(G.emps[5],G.emps[5].home,Array.from({length:12},()=>({c:'kor'})));
  const F={id:100,name:'MP4 Test Birliği',type:'bilimsel',charter:fedDefaultCharter('bilimsel'),leader:1,founder:1,members:[1,2,3],laws:{},fund:{ala:0,ene:0},treasury:0,
    founded:G.day,typeSince:G.day,dutySince:{defense:0,offense:0},invites:{},decisions:{},dutyConsent:{},cohesion:70,nextVote:G.day+100000,politicsVersion:96};
  G.feds=[F];G.fedUid=100;for(const a of F.members)for(const b of F.members)if(a!==b)G.emps[a].ally[b]=true;fedNormalize(F);for(const id of [0,1,2,3,4,5]){recalcMods(G.emps[id]);G.emps[id]._powAt=-1;}
  MP1Host.host.publish();})()`;
const TERMS={tax:{ene:.2,min:.2,ala:.2,yiy:0,tuk:0},science:0,defense:true,war:'none',autonomy:'consent',duration:0,renegotiate:24,sensors:false};
async function raw(p,cmd,extra={}){const cid='x'+Math.random().toString(36).slice(2,12);
  await p.evaluate(([cmd,extra,cid])=>{const J=MP1Join;J.seq++;J.sendRaw({v:1,type:'cmd',seq:J.seq,cid,cmd,...extra});},[cmd,extra,cid]);
  await wait(p,c=>MP1Join.results.some(r=>r.cid===c),cid);return p.evaluate(c=>MP1Join.results.filter(r=>r.cid===c).at(-1),cid);}
async function sync(h,p){const day=await h.evaluate(()=>{MP1Host.host.publish();return Math.floor(G.day);});await wait(p,d=>MP1Join.game.view&&MP1Join.game.clock&&MP1Join.game.clock.day===d,day);}
async function layout(p,where){return p.evaluate(where=>{const vw=innerWidth;
  const vis=e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none'&&!e.closest('[hidden]');};
  const all=[...document.querySelectorAll(where)].flatMap(s=>[s,...s.querySelectorAll('*')]);const ctl=all.filter(e=>e.matches('button,select,input,label.mp1-btn')&&vis(e));
  const small=ctl.filter(e=>{const r=e.getBoundingClientRect();return r.height<44||r.width<44;}).map(e=>(e.textContent||e.id).trim().slice(0,16)+':'+Math.round(e.getBoundingClientRect().width)+'x'+Math.round(e.getBoundingClientRect().height));
  const wide=all.filter(e=>vis(e)&&e.getBoundingClientRect().right>vw+1).map(e=>e.className||e.tagName).slice(0,5);
  let minFont=99,minAt='';for(const e of all)if(vis(e)&&[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())){const f=parseFloat(getComputedStyle(e).fontSize);if(f<minFont){minFont=f;minAt=e.className+':'+e.textContent.slice(0,16);}}
  return {overflow:document.documentElement.scrollWidth>vw+1,small,wide,minFont,minAt,controls:ctl.length};},where);}
function assertLayout(l,where,o={}){assert(!l.overflow,where+' overflow');assert.deepEqual(l.wide,[],where+' wide');assert.deepEqual(l.small,[],where+' <44px');assert(l.minFont>=11,where+' font '+l.minFont+' '+l.minAt);if(!o.noControls)assert(l.controls>0,where+' controls');}
async function viewports(p,where,name,o){const r={};const v0=p.viewportSize();
  for(const [w,h] of VIEWS){await p.setViewportSize({width:w,height:h});await p.waitForTimeout(120);const l=await layout(p,where);r[w+'x'+h]=l;assertLayout(l,name+' '+w+'x'+h,o);await shot(p,name+'-'+w+'x'+h);}
  await p.setViewportSize(v0);metrics.viewports[name]=Object.fromEntries(Object.entries(r).map(([k,l])=>[k,{controls:l.controls,minFont:l.minFont}]));}

/* ---------- süreçler ---------- */
const freePort=()=>new Promise(r=>{const s=net.createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>r(p));});});
function startRelay(port){return new Promise((res,rej)=>{const env={...process.env};for(const k of Object.keys(env))if(k.startsWith('MP1_'))delete env[k];
  const p=spawn(process.execPath,[RELAY],{env:{...env,MP1_PORT:String(port)},stdio:['ignore','pipe','pipe']});let o='';
  p.stdout.on('data',d=>{o+=d;if(/relay http/.test(o))res(p);});p.stderr.on('data',d=>{o+=d;});p.on('exit',c=>rej(Error('relay exit '+c+' '+o)));});}
function stopRelay(p){return new Promise(r=>{if(!p||p.exitCode!==null)return r();p.on('exit',()=>r());p.kill('SIGTERM');setTimeout(()=>{try{p.kill('SIGKILL');}catch{}},3000);});}
/* kalıcı profilli tarayıcının ana süreç kimliği (ps): kapanınca kaybolmalı, yeniden açılınca farklı olmalı */
function mainPid(dir){const l=execSync('ps -eo pid,args').toString().split('\n').filter(x=>x.includes('--user-data-dir='+dir)&&!x.includes('--type='));return l.length?+l[0].trim().split(/\s+/)[0]:null;}
const alive=pid=>{try{process.kill(pid,0);return true;}catch{return false;}};
async function persistent(dir,vp,name){const ctx=await chromium.launchPersistentContext(dir,{...launch,...PHONE(...vp),acceptDownloads:true});
  const p=ctx.pages()[0]||await ctx.newPage();p.on('pageerror',e=>errors.push(name+': '+e.message));return {ctx,p,pid:mainPid(dir)};}
async function plain(vp,name){const b=await chromium.launch(launch);const p=await (await b.newContext(PHONE(...vp))).newPage();p.on('pageerror',e=>errors.push(name+': '+e.message));return {b,p};}

async function hostMenu(H,base){await H.goto(base+'/');await wait(H,()=>typeof setupGame==='function'&&document.getElementById('mp1Btn'));
  await H.locator('#mp1Btn').tap();await wait(H,()=>MP1Host.screen==='menu');}
async function guestJoin(p,base,code,name){await p.goto(base+'/mp/join?code='+code);await wait(p,()=>window.MP1Join&&document.getElementById('jCode'));
  if(name)await p.fill('#jName',name);await p.locator('[data-j="go"]').tap();}
async function sheetOk(H){await wait(H,()=>document.getElementById('mp1Sheet'));await H.locator('#mp1Sheet [data-m="sheetOk"]').tap();await wait(H,()=>!document.getElementById('mp1Sheet'));}
async function miniTap(H,g){if(!await H.locator('#mp1Mini [data-g="'+g+'"]').count())await H.locator('#mp1Mini [data-g="toggle"]').tap();await H.locator('#mp1Mini [data-g="'+g+'"]').tap();}
/* Gerçek indirme (Playwright download olayı) ilk oturumda doğrulanır. Aynı kalıcı profil YENİDEN açıldığında bu ortamda Chromium indirmeyi
   ".crdownload"da bırakıyor ya da tarayıcı çöküyor (crashpad; Playwright/Chromium kısıtı, oyun kodundan bağımsız, boş sayfayla yeniden üretildi):
   o oturumlarda yerel indirme tetiklenmez; sayfanın oluşturduğu Blob ve <a download> adı yakalanır (dışa aktarma kodu aynı yoldan geçer). */
async function dlHook(H){await H.evaluate(()=>{window.__dl=null;if(window.__dlHook)return;window.__dlHook=1;const o=URL.createObjectURL.bind(URL);
  URL.createObjectURL=b=>{const u=o(b);if(b instanceof Blob)b.text().then(t=>{window.__dl={t};});return u;};
  const c=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){if(this.download&&this.href.startsWith('blob:')){window.__dlName=this.download;return;}return c.call(this);};});}
async function captured(H,name){await wait(H,()=>window.__dl);const f=path.join(out,name);fs.writeFileSync(f,await H.evaluate(()=>window.__dl.t));return {file:f,suggested:await H.evaluate(()=>window.__dlName),real:false};}
async function exportFile(H,name,real){
  if(!real){await dlHook(H);await miniTap(H,'export');return captured(H,name);}
  const [dl]=await Promise.all([H.waitForEvent('download'),miniTap(H,'export')]);const f=path.join(out,name);await dl.saveAs(f);return {file:f,suggested:dl.suggestedFilename(),real:true};}

let port,base,relay,host1Dir,host2Dir,cDir,H,hostCtx,Bb,Bp,Cc,Cp,Ib,Ip,code0,code1,saved={},file1,file2;
(async()=>{try{
  port=await freePort();base='http://127.0.0.1:'+port;relay=await startRelay(port);metrics.processes.relay1=relay.pid;
  host1Dir=fs.mkdtempSync(path.join(os.tmpdir(),'mp4-host1-'));host2Dir=fs.mkdtempSync(path.join(os.tmpdir(),'mp4-host2-'));cDir=fs.mkdtempSync(path.join(os.tmpdir(),'mp4-c-'));
  ({ctx:hostCtx,p:H}=await persistent(host1Dir,[915,412],'host'));metrics.processes.host1=mainPid(host1Dir);
  ({b:Bb,p:Bp}=await plain([390,844],'B'));({ctx:Cc,p:Cp}=await persistent(cDir,[412,915],'C'));metrics.processes.c1=mainPid(cDir);

  await test('kurulum: gerçek lobi → oyun (B = 3, C = 5); siyasi fikstür; gerçek komutlar; bekleyen MP.3 karşı teklifi, federasyon oyu ve vasallık karşı teklifi',async()=>{
    await hostMenu(H,base);
    assert.deepEqual(await H.evaluate(()=>[...document.querySelectorAll('#mp1 .mp1-btn')].map(b=>b.textContent)),['ODA OLUŞTUR','ODAYA KATIL','KAYITLI OYUNA DEVAM ET','KAYITLARI YÖNET','GERİ']);
    await H.locator('[data-m="create"]').tap();await wait(H,()=>MP1Host.lobby&&MP1Host.lobby.phase==='waiting');
    code0=await H.evaluate(()=>{MP1Host.host.setCapacity(3);MP1Host.host.configure({size:'orta',aiCount:5,seed:22});MP1Host.ws.send('C'+JSON.stringify({cap:2}));return MP1Host.code;});
    for(const [g,name,e] of [[Bp,'Bora',B],[Cp,'Cem',C]]){await guestJoin(g,base,code0,name);await wait(g,()=>MP1Join.screen==='lobby'&&MP1Join.lobby);await g.evaluate(x=>MP1Join.claim(x),e);
      await wait(H,e=>MP1Host.lobby.players.some(p=>p.claim===e),e);await g.evaluate(()=>MP1Join.ready(true));}
    await wait(H,()=>MP1Host.host.canStart().ok);await H.locator('[data-m="start"]').tap();
    for(const [g,e] of [[Bp,B],[Cp,C]])await wait(g,x=>MP1Join.screen==='game'&&MP1Join.game.view&&MP1Join.game.view.me.id===x,e);
    await H.evaluate(()=>UI.setSpeed(0));await H.evaluate(()=>MP1Host.advance(30));await H.evaluate(POLITICS);await sync(H,Bp);await sync(H,Cp);
    const col=await H.evaluate(b=>{const c=G.emps[b].colonies[0];return c&&{s:c.s,p:c.p};},B);if(col){const r=await raw(Bp,{kind:'build',sys:col.s,planet:col.p,key:'santral'});metrics.notes.push('B inşa: '+r.status+(r.code?' '+r.code:''));}
    const mv=await H.evaluate(c=>{const e=G.emps[c];for(const f of G.fleets.filter(f=>f.e===c&&!f.mv&&f.ships.length))for(const s of G.sys){if(s.id===f.sys)continue;const p=findPath(f.sys,s.id,e);if(p&&p.length>=1&&p.length<=3&&pathAllowed(e,f,p,f.sys))return {f:f.id,t:s.id};}return null;},C);
    if(mv)assert.equal((await raw(Cp,{kind:'move',fleet:mv.f,to:mv.t})).status,'ok');
    const r1=await raw(Bp,{kind:'offer',to:C,give:[{t:'res',r:'min',v:250}],want:[{t:'res',r:'ala',v:100}]});assert.equal(r1.status,'ok',JSON.stringify(r1));saved.o1=r1.extra.offer;
    const r2=await raw(Cp,{kind:'counter',offer:saved.o1,give:[{t:'res',r:'ala',v:60}],want:[{t:'res',r:'min',v:250}]});assert.equal(r2.status,'ok',JSON.stringify(r2));saved.o2=r2.extra.offer;
    const r3=await raw(Bp,{kind:'offer',to:C,give:[{t:'res',r:'ene',v:40}],want:[{t:'res',r:'yiy',v:5}]});assert.equal(r3.status,'ok');saved.o3=r3.extra.offer;
    saved.law=await H.evaluate(()=>{const k=[...Object.keys(FED_LAWS),...Object.keys(FED_INNER_LAWS)].find(k=>canFedLaw(G.emps[1],k,false).ok);proposeFedLaw(G.emps[1],k);MP1Host.host.publish();return k;});
    assert.equal(await H.evaluate(()=>!!fedOf(100).vote&&fedVoteCounts(fedOf(100)).waiting.includes(3)),true,'B vote pending');
    assert.equal((await raw(Bp,{kind:'vassalOffer',to:C,mode:'seek',type:'haracguzar',terms:TERMS})).status,'ok');
    saved.vq=await H.evaluate(b=>G.emps[b].vassalTalk.id,B);
    const vc=await raw(Cp,{kind:'vassalReply',sub:B,id:saved.vq,round:1,action:'counter',terms:{...TERMS,tax:{ene:.1,min:.1,ala:.1,yiy:0,tuk:0}}});assert.equal(vc.status,'ok',JSON.stringify(vc));
    await sync(H,Bp);await sync(H,Cp);
    assert(await Bp.evaluate(o=>MP1Join.game.view.dip.offers.some(x=>x.id===o&&x.status==='pending'&&x.round===2),saved.o2),'B sees the counter');
  });

  await test('kayıt: OYUN İÇİ → OYUNU KAYDET (IndexedDB) ve DOSYAYA AKTAR (indirme); kayıt Save8/RNG değiştirmez; dosyada jeton yok; misafir cihazında kayıt kimliği saklı',async()=>{
    const s0=await HS(H);saved.state=s0;
    saved.dip=await H.evaluate(()=>JSON.stringify(MP1Host.host.dip));saved.vote=await H.evaluate(()=>JSON.stringify(fedOf(100).vote));saved.talk=await H.evaluate(b=>JSON.stringify(G.emps[b].vassalTalk),B);
    const t0=Date.now();await miniTap(H,'save');await wait(H,()=>MP1Host.lastSave&&MP1Host.lastSave.ok);metrics.perf.saveWallMs=Date.now()-t0;
    metrics.perf.snapshotMs=await H.evaluate(()=>{const t=performance.now();MP1Host.host.snapshot({});return Math.round((performance.now()-t)*10)/10;});
    assert.deepEqual(await HS(H),s0,'saving does not touch Save8 or RNG');
    await shot(H,'host-saved-toast');
    const ex=await exportFile(H,'mp4-save-1.starsmp.json',true);metrics.files.realDownload=true;file1=ex.file;const text=fs.readFileSync(file1,'utf8');metrics.files.save1={bytes:text.length,name:ex.suggested};
    assert.match(ex.suggested,/^stars-mp-.+-y\d+-a\d+\.starsmp\.json$/);
    const pkg=JSON.parse(text);saved.saveId=pkg.saveId;assert.equal(pkg.format,'stars-mp-save');assert.equal(pkg.mpVersion,4);
    const toks=await H.evaluate(()=>[...MP1Host.host.state.players.values()].map(p=>p.token).filter(Boolean));assert(toks.length>=2);
    for(const t of toks)assert(!text.includes(t),'no live token in the file');
    for(const [g,e] of [[Bp,B],[Cp,C]]){const s=await g.evaluate(id=>JSON.parse(localStorage.getItem('mp4:save:'+id)),saved.saveId);assert.equal(s.empire,e);assert(!text.includes(s.token));saved['tok'+e]=s.token;}
    const list=await H.evaluate(()=>MP4Save.list());assert.equal(list.filter(x=>x.saveId===saved.saveId&&x.kind==='manual').length,1);
    metrics.files.idbSave1=list[0].size;
  });

  await test('gerçek kapanış: misafir C tarayıcısı ve host tarayıcı SÜRECİ kapanır, relay süreci de durur ve yeniden başlar (eski oda yok)',async()=>{
    await Cc.close();const pc=metrics.processes.c1;await new Promise(r=>setTimeout(r,500));assert(!alive(pc),'C browser process ended');
    const ph=metrics.processes.host1;await hostCtx.close();for(let i=0;i<40&&alive(ph);i++)await new Promise(r=>setTimeout(r,100));assert(!alive(ph),'host browser process ended');
    await wait(Bp,()=>!MP1Join.hostOnline);await shot(Bp,'b-host-gone');
    await stopRelay(relay);relay=await startRelay(port);metrics.processes.relay2=relay.pid;assert.notEqual(metrics.processes.relay1,metrics.processes.relay2);
    await wait(Bp,()=>MP1Join.screen==='join'&&MP1Join.closed,undefined,40000);metrics.notes.push('B eski oda kapanışı: '+await Bp.evaluate(()=>MP1Join.err));
  });

  await test('yeniden açılış: host yeni süreçte aynı profille → KAYITLI OYUNA DEVAM ET → kayıt kartı (ad, tarih, insanlar) → DEVAM ET → doğrulama → yeni oda + devam lobisi; dünya motorun yüklediğiyle aynı, RNG aynı, zaman ilerlemiyor',async()=>{
    ({ctx:hostCtx,p:H}=await persistent(host1Dir,[915,412],'host-2'));metrics.processes.host2=mainPid(host1Dir);assert.notEqual(metrics.processes.host2,metrics.processes.host1,'new host process');
    await hostMenu(H,base);await H.locator('[data-m="saves"][data-mode="resume"]').tap();await wait(H,()=>document.querySelector('#mp1 [data-save]'));
    const card=await H.textContent('#mp1 [data-save]');assert.match(card,/Bora/);assert.match(card,/Cem/);assert.match(card,/Yıl \d+ · Ay \d+/);assert.match(card,/Elle kayıt/);
    await shot(H,'host-saves-list');
    const t0=Date.now();await H.locator('#mp1 [data-save] [data-m="resume"]').first().tap();await sheetOk(H);
    await wait(H,()=>MP1Host.lobby&&MP1Host.lobby.phase==='resume'&&document.getElementById('mp4Seats'));metrics.perf.resumeWallMs=Date.now()-t0;
    code1=await H.evaluate(()=>MP1Host.code);assert.notEqual(code1,code0,'new room code');
    const s1=await HS(H);assert.equal(s1.r,saved.state.r,'RNG restored');assert.equal(s1.day,saved.state.day,'same game day');
    /* referans: aynı Save8'i motorun kendisi ayrı bir sayfada yükler */
    const save8=JSON.parse(fs.readFileSync(file1,'utf8')).save8;
    ({b:Ib,p:Ip}=await plain([360,800],'intruder'));await Ip.goto(base+'/');await wait(Ip,()=>typeof deserialize==='function'&&typeof setupGame==='function');
    const ref=await Ip.evaluate(t=>{deserialize(t);return {s:JSON.stringify(JSON.parse(serialize()),(k,v)=>k[0]==='_'?undefined:v),r:RND_STATE};},save8);
    assert.equal(s1.r,ref.r);assert(s1.s===ref.s,'host world = engine load of the same Save8');
    metrics.notes.push('yükleme sonrası oyun durumu kayıttan önceki durumla (önbellek alanları dışında) '+(s1.s===saved.state.s?'AYNI':'motor normalleştirmesi kadar farklı')+'.');
    assert.equal(await H.evaluate(()=>JSON.stringify(MP1Host.host.dip)),saved.dip,'MP.3 offer store restored');
    assert.equal(await H.evaluate(()=>JSON.stringify(fedOf(100).vote)),saved.vote);assert.equal(await H.evaluate(b=>JSON.stringify(G.emps[b].vassalTalk),B),saved.talk);
    await H.waitForTimeout(2500);assert.equal((await HS(H)).day,saved.state.day,'no hidden time advance in the lobby');assert.equal(await H.evaluate(()=>G.speed),0);
    assert.match(await H.textContent('#mp4Seats'),/Bora[\s\S]*bekleniyor/);await shot(H,'host-resume-lobby-empty');
  });

  await test('dönüş: B yeni kodla katılır → cihazındaki kimlikle devlet 3 ("Eski devletin bulundu"); izinsiz kişi C\'nin adıyla gelir → ziyaretçi, uydurma jeton/talep/komut geçmez',async()=>{
    await guestJoin(Bp,base,code1,null);await wait(Bp,()=>MP1Join.screen==='lobby'&&MP1Join.lobby&&MP1Join.lobby.phase==='resume'&&MP1Join.empireId===3);
    await wait(Bp,()=>/Eski devletin bulundu/.test(document.getElementById('jResume').textContent));await shot(Bp,'b-resume-found');
    const newTok=await Bp.evaluate(id=>JSON.parse(localStorage.getItem('mp4:save:'+id)).token,saved.saveId);
    assert.notEqual(newTok,saved['tok'+B],'token rotated on verified return');assert.equal(JSON.parse(fs.readFileSync(file1,'utf8')).session.players.find(p=>p.empireId===B).token,undefined,'file holds no token field');
    await guestJoin(Ip,base,code1,'Cem');await wait(Ip,()=>MP1Join.screen==='lobby'&&MP1Join.lobby&&MP1Join.lobby.phase==='resume');
    await wait(Ip,()=>/Kimliğin doğrulanmadı/.test(document.getElementById('jResume').textContent));assert.equal(await Ip.evaluate(()=>MP1Join.empireId),null);
    await Ip.evaluate(()=>MP1Join.sendRaw({v:1,type:'hello',name:'Cem',token:'0123456789abcdef0123456789abcdef'}));await Ip.waitForTimeout(400);
    assert.equal(await Ip.evaluate(()=>MP1Join.empireId),null,'forged token');
    const n=await Ip.evaluate(()=>MP1Join.lresults.length);await Ip.evaluate(e=>MP1Join.claim(e),C);await wait(Ip,n=>MP1Join.lresults.length>n,n);assert.equal(await Ip.evaluate(()=>MP1Join.lresults.at(-1).code),'phase');
    assert.equal((await raw(Ip,{kind:'fedLeave'})).code,'not-started');
    await wait(H,()=>document.getElementById('mp4Visitors')&&/Cem/.test(document.getElementById('mp4Visitors').textContent));
    assert.equal(await H.evaluate(c=>MP1Host.host.state.players.get(MP1Host.host.state.slots.get(c)).conn,C),null,'C seat stays free for the real C');
    await shot(Ip,'intruder-visitor');await shot(H,'host-resume-lobby');
    await viewports(H,'#mp1','host-resume-lobby');await viewports(Bp,'#app','guest-resume-lobby',{noControls:true});await viewports(Ip,'#app','guest-visitor-lobby');   // doğrulanan oyuncunun bekleme ekranında düğme yok (ayrılamaz)
  });

  await test('devam: host DEVAM ET (C yok → onay); ziyaretçi çıkarılır; B oyunda kendi devletiyle; C\'nin devleti AI\'ya geçmez, B\'nin bekleyen oyu AI tarafından verilmez',async()=>{
    await H.locator('[data-m="resumeGo"]').tap();await sheetOk(H);await wait(H,()=>MP1Host.started&&MP1Host.host.lobby.phase==='ingame');
    await wait(Ip,()=>MP1Join.screen==='join'&&/Oyun başladı/.test(MP1Join.err));
    await wait(Bp,b=>MP1Join.screen==='game'&&MP1Join.game.view&&MP1Join.game.view.me.id===b,B);
    assert.equal(await H.evaluate(()=>G.speed),0,'saved speed restored (paused at save)');
    await H.evaluate(()=>MP1Host.advance(20));assert.equal(await H.evaluate(c=>G.emps[c].ai,C),false,'waiting seat not handed to AI');
    assert.equal(await H.evaluate(()=>fedVoteCounts(fedOf(100)).waiting.includes(3)&&!fedOf(100).vote.yes.includes(3)&&!fedOf(100).vote.no.includes(3)),true);
    assert.equal(await H.evaluate(()=>__mpHumanVoter(3)),true);await sync(H,Bp);await shot(Bp,'b-game-after-resume');
  });

  await test('geç dönüş: C\'nin tarayıcısı yeni süreçte aynı profille açılır, yeni kodla katılır → oyun sürerken kendi devleti 5; jetonsuz yabancı reddedilir',async()=>{
    /* önce jetonsuz yabancı (C'nin yeri boşken): oyuncu kaydı açılmaz, kimlik sorulur, reddedilir */
    const {b:Xb,p:Xp}=await plain([360,800],'stranger');const n0=await H.evaluate(()=>MP1Host.host.state.players.size);
    await guestJoin(Xp,base,code1,'Yabancı');await wait(Xp,()=>MP1Join.screen==='join'&&MP1Join.err);
    assert.match(await Xp.evaluate(()=>MP1Join.err),/bu kayda ait oyuncu kimliği yok/);assert.equal(await H.evaluate(()=>MP1Host.host.state.players.size),n0,'no player record');
    await shot(Xp,'stranger-refused-ingame');metrics.notes.push('oyun sürerken jetonsuz katılım: '+await Xp.evaluate(()=>MP1Join.err));await Xb.close();
    ({ctx:Cc,p:Cp}=await persistent(cDir,[412,915],'C-2'));metrics.processes.c2=mainPid(cDir);assert.notEqual(metrics.processes.c2,metrics.processes.c1);
    await guestJoin(Cp,base,code1,null);await wait(Cp,c=>MP1Join.screen==='game'&&MP1Join.game.view&&MP1Join.game.view.me.id===c,C);
    await sync(H,Cp);await shot(Cp,'c-game-after-late-return');
  });

  await test('diplomasi sürer: B, C\'nin karşı teklifini kabul eder (tam bir kez); eski tur kabul edilemez; B FEDERASYON ekranından oy verir; B vasallık karşı teklifini kabul eder → sözleşme',async()=>{
    const r0=await H.evaluate(([b,c])=>[G.emps[b].res.min,G.emps[b].res.ala,G.emps[c].res.min,G.emps[c].res.ala],[B,C]);
    assert.equal((await raw(Bp,{kind:'respond',offer:saved.o2,action:'accept'})).status,'ok');
    const r1=await H.evaluate(([b,c])=>[G.emps[b].res.min,G.emps[b].res.ala,G.emps[c].res.min,G.emps[c].res.ala],[B,C]);
    assert.deepEqual(r1.map((x,i)=>Math.round((x-r0[i])*1000)/1000),[-250,60,250,-60],'exactly once');
    assert.equal((await raw(Bp,{kind:'respond',offer:saved.o2,action:'accept'})).code,'rules:closed');assert.equal((await raw(Cp,{kind:'respond',offer:saved.o1,action:'accept'})).code,'rules:closed');
    /* oy: misafir arayüzünden gerçek dokunma (MP.3.1 ekranı) */
    await sync(H,Bp);await Bp.locator('.mp2-nav [data-tab="dip"]').tap();await wait(Bp,()=>document.querySelector('#mp2Dip .mp31-seg'));
    await Bp.locator('[data-g2="dseg"][data-seg="fed"]').tap();await wait(Bp,()=>document.querySelector('#mp2DipP .mp31'));
    await Bp.locator('#mp2DipP [data-p="fsub"][data-k="vote"]').tap();await wait(Bp,()=>document.querySelector('#mp2DipP [data-p="askVote"][data-yes="1"]'));await shot(Bp,'b-vote-after-load');
    await Bp.locator('#mp2DipP [data-p="askVote"][data-yes="1"]').tap();await wait(Bp,()=>document.getElementById('mp3Sheet')&&!document.querySelector('#mp3Sheet [data-s="ok"]').disabled);
    const n=await Bp.evaluate(()=>MP1Join.results.length);await Bp.locator('#mp3Sheet [data-s="ok"]').tap();await wait(Bp,n=>MP1Join.results.length>n,n);
    assert.equal(await Bp.evaluate(()=>MP1Join.results.at(-1).status),'ok');assert.equal(await H.evaluate(()=>fedOf(100).lastVote&&fedOf(100).lastVote.yesMembers.includes(3)),true,'B\'s own vote recorded');
    assert.equal((await raw(Bp,{kind:'vassalReply',sub:B,id:saved.vq,round:1,action:'accept'})).code,'rules:stale');
    assert.equal((await raw(Bp,{kind:'vassalReply',sub:B,id:saved.vq,round:2,action:'accept'})).status,'ok');
    assert.deepEqual(await H.evaluate(b=>[G.emps[b].overlord,G.emps[b].vassalContract.terms.tax.ene],B),[C,.1]);
  });

  await test('ikinci kayıt + dosya: host kaydeder ve dışa aktarır, host süreci yine kapanır; otomatik kayıt sınırlı',async()=>{
    const autos=async()=>H.evaluate(id=>MP4Save.list().then(l=>l.filter(x=>x.kind==='auto'&&x.saveId===id).length),saved.saveId);
    for(let i=0;i<12;i++){await H.evaluate(()=>MP1Host.advance(90));await H.waitForTimeout(300);}   // ~36 oyun ayı: otomatik kayıt 3 ayda bir, en çok 3 tutulur
    await H.evaluate(()=>MP4Save.idle());const na=await autos();
    metrics.notes.push('~36 oyun ayında otomatik kayıt sayısı (sınır 3): '+na);assert.equal(na,3,'bounded autosaves');
    assert.equal(await H.evaluate(c=>G.emps[c].ai,C),false);
    await miniTap(H,'save');await wait(H,()=>MP1Host.lastSave&&MP1Host.lastSave.ok&&MP1Host.lastSave.kind==='manual'&&Date.now()-MP1Host.lastSave.at<5000);
    saved.state2=await HS(H);saved.overlord=await H.evaluate(b=>G.emps[b].overlord,B);
    const ex=await exportFile(H,'mp4-save-2.starsmp.json');file2=ex.file;metrics.files.save2={bytes:fs.readFileSync(file2,'utf8').length};
    const ph=mainPid(host1Dir);await hostCtx.close();for(let i=0;i<40&&alive(ph);i++)await new Promise(r=>setTimeout(r,100));assert(!alive(ph));
    await wait(Bp,()=>!MP1Join.hostOnline);
  });

  await test('dosyadan açma (boş profil, yeni host süreci): bozuk JSON, değiştirilmiş Save8 ve tek oyunculu kayıt reddedilir, mevcut durum bozulmaz; geçerli dosya → devam lobisi',async()=>{
    ({ctx:hostCtx,p:H}=await persistent(host2Dir,[390,844],'host-3'));metrics.processes.host3=mainPid(host2Dir);
    await hostMenu(H,base);await H.locator('[data-m="saves"][data-mode="resume"]').tap();await wait(H,()=>/Telefonda kayıt yok/.test(document.getElementById('mp4Status').textContent));
    const good=fs.readFileSync(file2,'utf8'),pkg=JSON.parse(good);
    const bad={'bad-json.starsmp.json':good.slice(0,good.length>>1),'tampered.starsmp.json':JSON.stringify({...pkg,save8:pkg.save8.replace(/"day":(\d+)/,(m,d)=>'"day":'+(+d+1))}),
      'single.starsmp.json':pkg.save8};
    const before=await H.evaluate(()=>({r:RND_STATE,n:G.sys?G.sys.length:0,day:G.day}));
    for(const [n,t] of Object.entries(bad)){const f=path.join(out,n);fs.writeFileSync(f,t);await H.setInputFiles('#mp4File',f);await wait(H,()=>document.getElementById('mp4Status').classList.contains('bad'));
      const msg=await H.textContent('#mp4Status');metrics.notes.push(n+': '+msg);assert.equal(await H.locator('#mp4FileCard').count(),0);
      await H.evaluate(()=>{MP1Host.saveErr='';document.getElementById('mp4Status').className='mp1-status';});}
    assert.deepEqual(await H.evaluate(()=>({r:RND_STATE,n:G.sys?G.sys.length:0,day:G.day})),before,'rejected files change nothing');
    await H.setInputFiles('#mp4File',file2);await wait(H,()=>document.getElementById('mp4FileCard'));assert.match(await H.textContent('#mp4FileCard'),/Bora[\s\S]*Cem/);
    await viewports(H,'#mp1','host-file-card');
    await H.locator('[data-m="resumeFile"]').tap();await sheetOk(H);await wait(H,()=>MP1Host.lobby&&MP1Host.lobby.phase==='resume');
    const s=await HS(H);assert.equal(s.r,saved.state2.r);assert.equal(s.day,saved.state2.day);assert.equal(await H.evaluate(b=>G.emps[b].overlord,B),saved.overlord);
  });

  await test('kimlik kurtarma: C telefonunu kaybetti (temiz tarayıcı) → ziyaretçi; host onaylı KİMLİĞİ KURTAR ile yalnız bağlı olmayan C koltuğunu verir; B kendi (yenilenmiş) jetonuyla döner; DEVAM ET onaysız',async()=>{
    const code2=await H.evaluate(()=>MP1Host.code);
    await guestJoin(Bp,base,code2,null);await wait(Bp,()=>MP1Join.lobby&&MP1Join.lobby.phase==='resume'&&MP1Join.empireId===3);
    const {b:Nb,p:Np}=await plain([360,800],'C-new-phone');
    await guestJoin(Np,base,code2,'Cem');await wait(Np,()=>MP1Join.lobby&&MP1Join.lobby.phase==='resume'&&MP1Join.empireId===null);
    await wait(H,()=>document.querySelector('#mp4Visitors [data-m="recover"]'));
    const opts=await H.evaluate(()=>[...document.querySelectorAll('#mp4Visitors select option')].map(o=>o.textContent));assert.equal(opts.length,1,'only the offline seat is offered');assert.match(opts[0],/Cem/);
    await H.locator('#mp4Visitors [data-m="recover"]').tap();await wait(H,()=>document.getElementById('mp1Sheet'));await H.locator('#mp1Sheet [data-m="sheetNo"]').tap();
    assert.equal(await Np.evaluate(()=>MP1Join.empireId),null,'cancel changes nothing');
    await H.locator('#mp4Visitors [data-m="recover"]').tap();await sheetOk(H);await wait(Np,c=>MP1Join.empireId===c,C);
    await wait(Np,()=>/Eski devletin bulundu/.test(document.getElementById('jResume').textContent));
    await H.locator('[data-m="resumeGo"]').tap();await wait(H,()=>MP1Host.started&&MP1Host.host.lobby.phase==='ingame');assert.equal(await H.locator('#mp1Sheet').count(),0,'no confirm when all seats are online');
    await wait(Np,c=>MP1Join.screen==='game'&&MP1Join.game.view&&MP1Join.game.view.me.id===c,C);await wait(Bp,b=>MP1Join.screen==='game'&&MP1Join.game.view.me.id===b,B);
    assert.equal((await raw(Np,{kind:'fedLeave'})).code!=='not-joined',true);await shot(Np,'c-recovered-game');await Nb.close();
  });

  await test('KAYITLARI YÖNET: ilk profil yeniden açılır; liste (elle + otomatik), DIŞA AKTAR indirir, SİL onay ister (Vazgeç → kalır, Sil → gider); 5 ekran boyutu',async()=>{
    const old=H,oldCtx=hostCtx;
    const {ctx,p}=await persistent(host1Dir,[360,800],'host-4');await hostMenu(p,base);await viewports(p,'#mp1','host-mp-menu');
    await p.locator('[data-m="saves"][data-mode="manage"]').tap();await wait(p,()=>document.querySelectorAll('#mp1 [data-save]').length>=2);
    const kinds=await p.evaluate(()=>MP4Save.list().then(l=>l.map(x=>x.kind)));metrics.notes.push('profil 1 kayıtları: '+kinds.join(','));assert(kinds.includes('manual')&&kinds.includes('auto'));
    await viewports(p,'#mp1','host-saves-manage');
    await dlHook(p);await p.locator('#mp1 [data-save] [data-m="export"]').first().tap();const lx=await captured(p,'mp4-export-from-list.starsmp.json');
    assert.equal(JSON.parse(fs.readFileSync(lx.file,'utf8')).format,'stars-mp-save');assert.match(lx.suggested,/^stars-mp-.+\.starsmp\.json$/);
    assert.equal((await p.evaluate(()=>StarsMP.validatePackage(window.__dl.t))).ok,true,'exported file validates');
    const n0=kinds.length;await p.locator('#mp1 [data-save] [data-m="del"]').first().tap();await wait(p,()=>document.getElementById('mp1Sheet'));await shot(p,'host-delete-confirm');
    await p.locator('#mp1Sheet [data-m="sheetNo"]').tap();assert.equal((await p.evaluate(()=>MP4Save.list())).length,n0,'cancel keeps the save');
    await p.locator('#mp1 [data-save] [data-m="del"]').first().tap();await sheetOk(p);await wait(p,n=>document.querySelectorAll('#mp1 [data-save]').length===n-1,n0);
    assert.equal((await p.evaluate(()=>MP4Save.list())).length,n0-1);await ctx.close();void old;void oldCtx;
  });

  await test('performans: 45 / 60 / 100 sistem, gerçek tarayıcıda kayıt alma, doğrulama, yükleme ve IndexedDB yazma; dosya boyutu',async()=>{
    const P=Ip;await P.goto(base+'/');await wait(P,()=>typeof setupGame==='function'&&window.StarsMP&&window.MP4Save);
    for(const [size,ai] of [['orta',5],['buyuk',7],['ulu',11]]){
      const r=await P.evaluate(async([size,ai])=>{setupGame({...CFG,size,aiCount:ai,seed:42});G.autoSave=false;const h=StarsMP.createHost({roomId:'perf',random:n=>Array.from(crypto.getRandomValues(new Uint8Array(n)),b=>b.toString(16).padStart(2,'0')).join(''),send(){}});h.installGuards();
        let t=performance.now();const s=h.snapshot({});const snap=performance.now()-t;const text=JSON.stringify(s.pkg);t=performance.now();const v=StarsMP.validatePackage(text);const val=performance.now()-t;
        t=performance.now();const l=StarsMP.loadWorld(v.pkg);const load=performance.now()-t;t=performance.now();const w=await MP4Save.put(text,{saveId:s.pkg.saveId,display:s.pkg.display,kind:'manual'});const idb=performance.now()-t;
        await MP4Save.del(w.key);const R=x=>Math.round(x*10)/10;return {systems:G.sys.length,kb:Math.round(text.length/1024),snapMs:R(snap),validateMs:R(val),loadMs:R(load),idbMs:R(idb),ok:v.ok&&l.ok&&w.ok};},[size,ai]);
      assert.equal(r.ok,true);metrics.perf['s'+r.systems]=r;}
  });
  assert.equal(errors.length,0,'page errors: '+errors.join(' | '));
}catch(e){results.push({name:'harness',status:'FAIL',error:String(e&&e.stack||e)});console.log('FAIL harness\n'+(e&&e.stack||e));}
finally{
  metrics.pageErrors=errors;fs.writeFileSync(path.join(out,'mp4-results.json'),JSON.stringify({note:'Ayrı süreçler: relay (Node, yeniden başlatıldı), kalıcı profilli host Chromium (gerçekten kapatılıp yeniden açıldı), misafirler ayrı Chromium (mobil dokunmatik bağlam). Gerçek internet ya da fiziksel Android DEĞİL. Siyasi başlangıç durumu açık fikstür.',results,metrics},null,1));
  for(const x of [hostCtx,Cc])if(x)await x.close().catch(()=>{});for(const b of [Bb,Ib])if(b)await b.close().catch(()=>{});await stopRelay(relay);
  for(const d of [host1Dir,host2Dir,cDir])if(d)fs.rmSync(d,{recursive:true,force:true});
  const pass=results.filter(r=>r.status==='PASS').length,fail=results.length-pass;console.log('GEÇEN: '+pass+' KALAN: '+fail);process.exit(fail?1:0);
}})();
