'use strict';
/* Canlı localhost HTTP/WS ve gerçek host/istemci kaynakları. Tarayıcı SRI ve CacheStorage olayları VM'de modellenir. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const crypto=require('node:crypto');
const {runtime}=require('./helpers/runtime');
const ROOT=path.resolve(__dirname,'..');
const P40=process.env.STARS_P40_ROOT;
const P41=process.env.STARS_P41_ROOT;
const read=(root,file)=>fs.readFileSync(path.join(root,file),'utf8');
const expectedBuild=JSON.parse(read(ROOT,'RELEASE-MANIFEST.json')).build;
const json=(h,expr)=>JSON.parse(h.run('JSON.stringify('+expr+')'));
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const hash=body=>crypto.createHash('sha256').update(body).digest('base64');
const log=(name,result)=>{passed++;console.log('PASS '+name+' '+JSON.stringify(result));};
let passed=0;

async function waitFor(fn,label){
  const until=Date.now()+4500;
  while(Date.now()<until){
    const value=fn();
    if(value)return value;
    await pause(10);
  }
  throw Error('Bekleme doldu: '+label);
}

function buildFixture(root){
  const {world}=require(path.join(root,'tests/helpers/beta-fed-found0-mp-world.cjs'));
  const previous=process.cwd();
  let h;
  try{process.chdir(root);h=world();}finally{process.chdir(previous);}
  h.run(`var E=G.emps[1],SY=G.sys[E.home];for(const k in E.res)E.res[k]=100000;
    SY.planets.find(p=>p.col&&p.owner===1).col.b.tersane=1;SY.queue=[];`);
  const seat=json(h,"[...MP.state.players.values()].find(p=>p.empireId===1).token");
  const pkg=json(h,'MP.snapshot({}).pkg');
  const profile=new Map([['mp1:name','Misafir'],['mp4:save:'+pkg.saveId,JSON.stringify({token:seat,empire:1})]]);
  return {pkg,profile,ship:json(h,"({kind:'ship',sys:SY.id,key:'kor'})")};
}

async function room(root,fixture){
  const relay=require(path.join(root,'research/mp1/server/relay.js')).create({MP1_PORT:'0'});
  const server=await relay.start();
  const origin='http://127.0.0.1:'+server.address().port;
  const h=runtime({root});
  h.sb.pkg=fixture.pkg;
  h.sb.rand=n=>crypto.randomBytes(n).toString('hex');
  h.sb.out=[];
  h.run(read(root,'research/mp0/mp-core.js'));
  h.run(read(root,'research/mp6/mirror.js'));
  const ws=new WebSocket(origin.replace('http','ws')+'/mp1/ws?role=host');
  const incoming=[];
  const forwarded=[];
  const active=new Set();
  ws.addEventListener('message',e=>{
    const s=e.data;
    incoming.push(s);
    if(s[0]==='J')active.add(s.slice(1));
    if(s[0]==='L'){
      active.delete(s.slice(1));
      h.sb.left=s.slice(1);
      h.run('MP.onLeave(left)');
    }
    if(s[0]!=='F')return;
    const split=s.indexOf('\n');
    h.sb.peer=s.slice(1,split);h.sb.body=s.slice(split+1);
    forwarded.push(JSON.parse(h.sb.body).type);
    h.run('MP.onMessage(peer,body)');
    for(const [to,part] of h.sb.out.splice(0))ws.send('T'+to+'\n'+part);
  });
  const control=await waitFor(()=>incoming.find(s=>s[0]==='R'&&JSON.parse(s.slice(1)).t==='room'),'host oda');
  const code=JSON.parse(control.slice(1)).code;
  h.sb.roomCode=code;
  try{h.run(`var checked=StarsMP.validatePackage(pkg);if(!checked.ok)throw Error('validate:'+checked.why);
    var loaded=StarsMP.loadWorld(checked.pkg);if(!loaded.ok)throw Error('load:'+JSON.stringify(loaded));
    var MP=StarsMP.createHost({roomId:roomCode,random:rand,mirrorMs:0,send:(to,s)=>out.push([to,s]),lobby:{generate(){return {ok:false}}},resume:pkg});
    MP.installGuards();MP.resumeStart();var E=G.emps[1],SY=G.sys[E.home];`);}catch(e){ws.close();relay.shutdown();server.closeAllConnections?.();throw e;}
  ws.send('C{"cap":4}');
  return {h,origin,code,forwarded,active,relay,stop:async()=>{
    ws.close();
    relay.shutdown();
    server.closeAllConnections?.();
  }};
}

async function worker(root,origin){
  const stores=new Map(),handlers={};
  const key=req=>new URL(typeof req==='string'?req:req.url,origin).href;
  function cache(name){
    if(!stores.has(name))stores.set(name,new Map());
    const items=stores.get(name);
    return {
      addAll:async urls=>{for(const url of urls){const r=await fetch(key(url));assert(r.ok);items.set(key(url),r);}},
      put:async (req,res)=>{items.set(key(req),res);},
      match:async req=>items.get(key(req))?.clone()
    };
  }
  const caches={open:async name=>cache(name),keys:async()=>[...stores.keys()],delete:async name=>stores.delete(name),match:async req=>{
    for(const name of stores.keys()){const hit=await cache(name).match(req);if(hit)return hit;}
  }};
  let offline=false;
  vm.runInNewContext(read(root,'sw.js'),{
    self:{location:{origin},addEventListener:(name,fn)=>handlers[name]=fn,clients:{claim(){}},skipWaiting(){}},
    URL,Response,caches,fetch:req=>offline?Promise.reject(Error('offline')):fetch(key(req))
  });
  let install;
  handlers.install({waitUntil:p=>{install=p;}});
  await install;
  return {stores,caches,offline(){offline=true;},request:async (route,mode='navigate')=>{
    let res;handlers.fetch({request:{url:key(route),mode,method:'GET'},respondWith:p=>{res=p;}});
    return res;
  }};
}

function browser(root,r,profile,href){
  const g=runtime({root,local:profile,width:800,height:360});
  const sent=[],sockets=[],events={};
  let offline=false,loaded=null;
  g.sb.URL=URL;g.sb.URLSearchParams=URLSearchParams;g.sb.AbortController=AbortController;
  g.sb.location=new URL(href,r.origin);
  g.sb.location.replace=next=>{loaded=new URL(next);};
  g.sb.history={pushState(){},replaceState(_,unused,value){g.sb.location=new URL(value,r.origin);}};
  g.sb.window.location=g.sb.location;
  g.sb.innerWidth=800;g.sb.innerHeight=360;
  g.sb.crypto=crypto.webcrypto;g.sb.btoa=btoa;
  const session=new Map();
  g.sb.sessionStorage={getItem:k=>session.get(k),setItem:(k,v)=>session.set(k,v)};
  g.sb.fetch=(input,options)=>offline?Promise.reject(Error('offline')):fetch(new URL(input,r.origin),options);
  g.sb.addEventListener=(name,fn)=>{events[name]=fn;};
  g.sb.WebSocket=function(url){
    const ws=new WebSocket(url);
    sockets.push(ws);
    const send=ws.send.bind(ws);
    ws.send=data=>{sent.push(JSON.parse(data));send(data);};
    return ws;
  };
  g.run("Object.defineProperty(window,'queueShip',{get:()=>queueShip,set:f=>{queueShip=f;}})");
  const script=f=>g.run(read(root,f));
  script('research/mp1/client/view.js');g.sb.window.MP1View=g.sb.MP1View;
  script('research/mp6/mirror.js');
  script('research/mp6/client/guest-stars.js');g.sb.MP6Stars=g.sb.window.MP6Stars;
  const app=()=>g.doc.getElementById('mp6App');
  const rows=sys=>g.run(`View.selSys=G.sys[${sys}];(UI.p_sistem().match(/data-a="shipCancel"/g)||[]).length`);
  return {g,sent,sockets,loaded:()=>loaded,setOffline:b=>{offline=b;},app,rows,
    runGuard(html){
      const m=html.match(/<script data-release="([^"]+)" data-build="([^"]+)">([\s\S]*?)<\/script>/);
      assert(m,'guard embedded');
      g.doc.currentScript={dataset:{release:m[1],build:m[2]}};
      g.run(m[3]);
      g.doc.getElementById('mpReleaseNotice').hidden=true;
      return {release:m[1],build:m[2],src:m[3]};
    },
    badScript(integrity){events.error({target:{tagName:'SCRIPT',integrity}});},
    start(joinRoot=root){g.run(read(joinRoot,'research/mp1/client/join.js'));g.doc.emit('DOMContentLoaded');},
    join(){
      g.doc.getElementById('jCode').value=r.code;
      g.doc.getElementById('jName').value='Misafir';
      g.doc.emit('click',{target:{closest:()=>({dataset:{j:'go'}})}});
    },
    async seat(){
      await waitFor(()=>g.run("window.MP1Join.screen==='game'&&window.MP1Join.empireId===1"),'eski devlet');
      await this.mirror(()=>g.run('MP6Stars.S.started&&MP6Stars.S.appliedRev>0'));
    },
    async mirror(predicate){
      await waitFor(()=>{
        const id=g.run('MP6Stars.S.timer'),t=g.timers.get(id);
        if(t){g.advance(5000);g.timers.delete(id);t.fn();}
        return predicate();
      },'ayna');
    },
    close(){for(const w of sockets)w.close();}
  };
}

async function submit(r,b,fixture,expected){
  const {ship}=fixture;
  const prior=json(r.h,'({q:SY.queue.length,ala:E.res.ala})');
  const rowsBefore=b.rows(ship.sys);
  assert.equal(rowsBefore,prior.q,'misafir önceki kuyruğu görüyor');
  const start=Date.now();
  b.g.run(`UI.act('ship',${JSON.stringify(ship.sys+':'+ship.key)})`);
  const frame=b.sent.find(m=>m.cmd?.kind==='ship');
  assert(frame,'tersane düğmesi gemi emrini gönderdi');
  const result=await waitFor(()=>json(b.g,`window.MP1Join.results.find(r=>r.cid===${JSON.stringify(frame.cid)})||null`),'host sonucu');
  const tAck=Date.now()-start;
  const host=json(r.h,'({q:SY.queue.length,ala:E.res.ala})');
  const shipCost=r.h.run("shipCost(E,'kor').ala");
  const change=expected==='ok'?1:0;
  assert.equal(result.status,expected,JSON.stringify({build:r.h.run('BUILD_ID'),saved:r.h.run("pkg.session.players.find(p=>p.empireId===1).lastSeq"),host:r.h.run("[...MP.state.players.values()].find(p=>p.empireId===1).legacyCommands===null"),cidFormat:b.sent.find(m=>m.cmd?.kind==='ship')?.cid.startsWith('j1_'),result:result.code}));
  assert.equal(host.q,prior.q+change);
  assert.equal(prior.ala-host.ala,change*shipCost);
  await b.mirror(()=>b.rows(ship.sys)===rowsBefore+change);
  assert.equal(b.sent.filter(m=>m.cmd?.kind==='ship').length,1);
  return {hostResult:result.status,reason:result.code,guestEmpire:1,hostQueue:host.q,guestRows:b.rows(ship.sys),newOrders:change,charge:prior.ala-host.ala,tAck};
}

async function openGuest(r,root,fixture,href='?code='+r.code){
  const b=browser(root,r,new Map(fixture.profile),'/mp/play'+href);
  try{
    if(root===ROOT)b.runGuard(await (await fetch(r.origin+'/mp/play'+href)).text());
    b.start();
    if(!b.sockets.length)b.join();
    await b.seat();
    assert.equal(b.g.run('window.MP1Join.saveId'),fixture.pkg.saveId);
    return b;
  }catch(e){b.close();throw e;}
}

async function main(){
  const old=P40||ROOT;
  const fixture=buildFixture(old);
  let saved41;
  if(P40&&P41){
    const r=await room(P40,fixture);
    let b;
    try{
      const pwa=await worker(P40,r.origin);
      const route='/mp/play?code='+r.code;
      const cached=await (await pwa.request(route)).text();
      await pause(30);
      pwa.offline();
      assert.equal(await (await pwa.request(route)).text(),cached);
      assert.match(await (await pwa.caches.match('/main.js')).text(),/96h10p40/);
      b=await openGuest(r,P40,fixture);
      const result=await submit(r,b,fixture,'ok');
      fixture.pkg=json(r.h,'MP.snapshot({}).pkg');
      fixture.profile=b.g.local;
      log('p40 profilinde önbellek ve bir eski sipariş',result);
    }finally{b?.close();await r.stop();}
    const r41=await room(P41,fixture);
    let b41;
    try{
      b41=await openGuest(r41,P40,fixture);
      const result=await submit(r41,b41,fixture,'rejected');
      assert.equal(result.reason,'command-unconfirmed');
      assert(!b41.app().innerHTML.includes('Oyun sürümü eski'));
      log('p41 tabanı eski istemciyi odaya alıyor',result);
    }finally{b41?.close();await r41.stop();}
    const c41=await room(P41,fixture);
    let clean;
    try{
      clean=await openGuest(c41,P41,fixture);
      log('p41 temiz kaynak yeni emri kabul ediyor',await submit(c41,clean,fixture,'ok'));
      saved41={...fixture,pkg:json(c41.h,'MP.snapshot({}).pkg'),profile:new Map(clean.g.local)};
    }finally{clean?.close();await c41.stop();}
    const m41=await room(P41,fixture);
    let mixed41;
    try{
      const shell=await (await fetch(m41.origin+'/mp/play?code='+m41.code)).text();
      assert(!shell.includes('integrity='));
      mixed41=browser(P41,m41,new Map(fixture.profile),'/mp/play?code='+m41.code);
      mixed41.start(P40);mixed41.join();await mixed41.seat();
      assert.equal(mixed41.g.run('BUILD_ID'),'96h10p41');
      const result=await submit(m41,mixed41,fixture,'rejected');
      assert.equal(result.reason,'command-unconfirmed');
      log('p41 etiketi altında tek eski join.js sürüm kapısından geçiyor',result);
    }finally{mixed41?.close();await m41.stop();}
  }else console.log('NOT RUN p40/p41 sabit kökleri verilmedi');

  const candidate=await room(ROOT,fixture);
  let stale,updated,again;
  try{
    const {origin,code}=candidate;
    const href='/mp/play?code='+code+'&from=invite#bookmark';
    const page=await fetch(origin+href);
    const html=await page.text();
    const version=await (await fetch(origin+'/mp/version')).json();
    assert.equal(version.build,expectedBuild);
    const sha12=file=>crypto.createHash('sha256').update(read(ROOT,file)).digest('hex').slice(0,12);
    assert.equal(version.files['main.js'],sha12('main.js'));
    assert.equal(version.runtime,sha12('RELEASE-MANIFEST.json'));
    const tags=[...html.matchAll(/<script src="([^"]+)" integrity="sha256-([^"]+)"><\/script>/g)];
    assert.equal(tags.length,25);
    for(const [,url,digest] of tags){
      const response=await fetch(origin+url);
      assert.equal(response.headers.get('cache-control'),'no-store');
      assert.equal(hash(Buffer.from(await response.arrayBuffer())),digest,url);
      assert.equal(new URL(url,origin).searchParams.get('mp-release'),version.release);
    }
    const pwa=await worker(ROOT,origin);
    assert.equal(await pwa.request(href),undefined);
    assert.equal(await pwa.request(tags[0][1],'cors'),undefined);
    assert.equal(await pwa.request('/mp/version'),undefined);
    pwa.offline();
    assert((await (await pwa.request('/main.js','cors')).text()).includes(`const BUILD_ID = '${expectedBuild}'`));
    assert.equal((await pwa.request('/missing.js','cors')).type,'error');
    log('aday uç noktası, 25 gerçek bayt özeti ve MP önbellek dışı',{build:version.build,mp:version.mp,release:version.release,main:version.files['main.js']});

    const profile=new Map(fixture.profile);
    if(P40){
      stale=browser(P40,candidate,profile,href);
      stale.start();stale.join();
      await waitFor(()=>stale.app().innerHTML.includes('Oyun sürümü eski.'),'p40 uyarısı');
      await waitFor(()=>stale.g.run('window.MP1Join.closed&&!window.MP1Join.ws'),'p40 katılımı sonlandı');
      assert(stale.app().innerHTML.includes('Oyun sürümü eski.'),'kapalı sokette eski istemci uyarısı kalır');
      assert.equal(candidate.active.size,0);
      assert.equal(candidate.forwarded.length,0);
      assert.equal(stale.sent.filter(m=>m.type==='hello'||m.type==='cmd').length,0);
      log('p40 tam eski sayfa uyarıyı görür ve odaya alınmaz',{roomClients:0,hostFrames:0});
      stale.close();
    }

    const previous=browser(ROOT,candidate,new Map(profile),href);
    previous.runGuard(html.replace('data-release="'+version.release+'"','data-release="'+'0'.repeat(64)+'"'));
    previous.start();previous.join();
    try{
      await waitFor(()=>previous.g.run('window.MP1Join.errCode==="update-required"'),'önceki sürüm etiketi');
      assert.equal(candidate.active.size,0);
      assert.equal(previous.sent.filter(m=>m.type==='hello'||m.type==='cmd').length,0);
      log('önceki içerik kimliği relayden geri çevrilir',{roomClients:0,hostFrames:candidate.forwarded.length});
    }finally{previous.close();}
    const mixed=browser(ROOT,candidate,profile,href);
    const release=mixed.runGuard(html);
    assert.equal(release.release,version.release);
    assert(page.headers.get('content-security-policy').includes("'sha256-"+hash(release.src)+"'"));
    const oldPath=P40?'main.js':'research/mp1/client/join.js';
    const tag=tags.find(([,url])=>url.startsWith('/'+oldPath+'?'));
    const oldBytes=P40?read(P40,oldPath):'önceki eski betik';
    assert.notEqual(hash(oldBytes),tag[2]);
    mixed.badScript('sha256-'+tag[2]);
    mixed.start();
    assert.match(mixed.g.doc.getElementById('mpReleaseMessage').textContent,/Güncelle ve yeniden katıl/);
    mixed.join();
    assert.equal(mixed.sockets.length,0);
    mixed.setOffline(true);
    mixed.g.doc.getElementById('mpReleaseRetry').emit('click');
    await waitFor(()=>/Güncelleme alınamadı/.test(mixed.g.doc.getElementById('mpReleaseMessage').textContent),'çevrimdışı açıklaması');
    assert.equal(mixed.loaded(),null);
    mixed.setOffline(false);
    mixed.g.doc.getElementById('mpReleaseRetry').emit('click');
    const url=await waitFor(()=>mixed.loaded(),'güncelleme adresi');
    assert.equal(url.searchParams.get('code'),code);
    assert.equal(url.searchParams.get('from'),'invite');
    assert.equal(url.hash,'#bookmark');
    assert(url.searchParams.has('mp-refresh'));
    assert.equal(profile.get('mp4:save:'+fixture.pkg.saveId),fixture.profile.get('mp4:save:'+fixture.pkg.saveId));
    log('tek eski JS, çevrimdışı uyarı, ardından güncelle ve yeniden katıl',{oldPath,stampWithOldBytes:null,roomPreserved:true});
    updated=browser(ROOT,candidate,profile,url.href);
    updated.runGuard(await (await fetch(url)).text());
    updated.start();await updated.seat(); // Yenileme işareti aynı davete otomatik döndürür.
    assert.equal(updated.g.run('window.MP1Join.saveId'),fixture.pkg.saveId);
    assert.equal(updated.g.run('window.MP1Join.playerId'),fixture.pkg.session.players.find(p=>p.empireId===1).playerId);
    assert.equal(updated.sent.filter(m=>m.cmd?.kind==='ship').length,0);
    log('güncellemeden sonra ilk yeni tersane emri',await submit(candidate,updated,fixture,'ok'));
    updated.close();
    await waitFor(()=>candidate.active.size===0,'önceki koltuk soketi kapandı');

    // Aynı kayıt için son kimliği kullanan temiz sayfa, aynı odaya yeniden bağlanır.
    again=await openGuest(candidate,ROOT,{...fixture,profile});
    assert.equal(again.sent.filter(m=>m.cmd?.kind==='ship').length,0);
    assert.equal(again.rows(fixture.ship.sys),candidate.h.run('SY.queue.length'));
    log('güncel temiz giriş ve tekrar bağlanma',{guestEmpire:1,rows:again.rows(fixture.ship.sys),automaticShipOrders:0});
  }finally{stale?.close();updated?.close();again?.close();await candidate.stop();}
  if(saved41){
    assert.equal(saved41.pkg.build,'96h10p41');
    const next=await room(ROOT,saved41);
    let clean;
    try{
      clean=await openGuest(next,ROOT,saved41);
      log('p41 kaydı '+expectedBuild+' temiz istemciyle açılır ve ilk emir tek uygulanır',await submit(next,clean,saved41,'ok'));
    }finally{clean?.close();await next.stop();}
  }
}
main().then(()=>console.log('GEÇEN: '+passed+' KALAN: 0')).catch(e=>{console.error(e.stack);console.log('GEÇEN: '+passed+' KALAN: 1');process.exitCode=1;});
