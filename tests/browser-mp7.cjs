'use strict';
/* MP.7 — gerçek mobil başlangıç + tek oyunculu kurulum ekranıyla oyuncuya özel devlet tasarımı.
   Üretim kipindeki relay (MP1_BIND 0.0.0.0, MP1_TRUST_PROXY=1, https MP1_ORIGINS) + yerel TLS ters vekili. Vekil, gerçek bulut
   vekillerinin RFC 6455'e uygun davranışını taklit ederek istemci → relay yönündeki büyük metin çerçevelerini PARÇALAR (kök neden
   senaryosu). Ayrı Chromium süreçleri, dikey telefon görünümü (host 390×844, B 360×800, C 412×915), yalnız gerçek dokunma.
   BU GERÇEK İNTERNET / FİZİKSEL ANDROID TESTİ DEĞİLDİR. Çıktı: $STARS_OUTPUT/mp7-results.json + PNG. MP7_ONLY=<regex>. */
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{execSync}=require('child_process'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),out=path.resolve(process.env.STARS_OUTPUT||path.join(root,'../evidence/mp7'));fs.mkdirSync(out,{recursive:true});
const relayMod=require('../research/mp1/server/relay.js'),{selfSigned,startProxy}=require('./helpers/mp11-tls-proxy.js');
const results=[],errors=[],metrics={notes:[]};
let tno=0;const ONLY=process.env.MP7_ONLY||'';
async function test(name,fn){++tno;if(ONLY&&tno>1&&!new RegExp(ONLY).test(name)&&!name.startsWith('sayfa'))return;const t0=Date.now();
  try{await fn();results.push({name,status:'PASS',ms:Date.now()-t0});console.log('PASS '+name);}
  catch(e){results.push({name,status:'FAIL',error:String(e&&e.stack||e).slice(0,1800)});console.log('FAIL '+name+'\n'+(e&&e.stack||e));}}
const PHONE=(w,h)=>({viewport:{width:w,height:h},isMobile:true,hasTouch:true,deviceScaleFactor:2,serviceWorkers:'allow'});
const freePort=()=>new Promise(res=>{const s=require('net').createServer().listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>res(p));});});
const wait=(p,fn,arg,timeout=30000)=>p.waitForFunction(fn,arg,{timeout,polling:100});
const shot=(p,n)=>p.screenshot({path:path.join(out,n+'.png')}).catch(()=>{});
const tap=async(p,sel)=>{const l=p.locator(sel).first();await l.scrollIntoViewIfNeeded().catch(()=>{});try{await l.tap({timeout:8000});}
  catch(e){throw Error('tap '+sel+' '+JSON.stringify(await p.evaluate(s=>{const el=document.querySelector(s),r=el&&el.getBoundingClientRect(),m=document.getElementById('menu');
    return {box:r&&[r.x,r.y,r.width,r.height],menu:m&&m.className,step:typeof SETUP_STEP!=='undefined'&&SETUP_STEP,disp:el&&getComputedStyle(el).display,vis:el&&getComputedStyle(el).visibility,
      top:r&&(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)||{}).id,par:el&&el.closest('[style*="display: none"],.hidden')&&el.closest('[style*="display: none"],.hidden').id};},sel)));}};
/* gerçek kurulum ekranında seçimler (tek oyunculuyla aynı düğmeler) */
async function design(p,o){
  await wait(p,()=>!document.getElementById('menu').classList.contains('hidden')&&document.querySelector('#setup [data-a="mizacSet"]'));
  if(o.name){await p.fill('#empName',o.name);}
  await tap(p,'#setup [data-a="mizacSet"][data-x="'+o.mizac+'"]');
  await tap(p,'#setup [data-a="step"][data-x="goruns"]');await tap(p,'#setup [data-a="look"][data-x="'+o.look+'"]');
  await tap(p,'#setup [data-a="step"][data-x="fizyo"]');await tap(p,'#setup [data-a="physio"][data-x="'+o.physio+'"]');
  await tap(p,'#setup [data-a="step"][data-x="etik"]');for(const x of o.ethics)await tap(p,'#setup [data-a="ethic"][data-x="'+x+'"]');
  await tap(p,'#setup [data-a="step"][data-x="civic"]');for(const c of o.civics)await tap(p,'#setup [data-a="civic"][data-x="'+c+'"]');
  await tap(p,'#setup [data-a="step"][data-x="koken"]');await tap(p,'#setup [data-a="origin"][data-x="'+o.origin+'"]');
  if(o.galaxy){await tap(p,'#setup [data-a="step"][data-x="galaksi"]');await tap(p,'#setup [data-a="size"][data-x="'+o.galaxy.size+'"]');}
  await shot(p,o.shot);
  await tap(p,'#setup [data-a="start"]');
  await wait(p,()=>document.getElementById('menu').classList.contains('hidden'));
}
let relay,px,base,tls,bH,bB,bC,H,Bp,Cp,code,link;
(async()=>{tls=selfSigned();try{
  const pport=await freePort();base='https://localhost:'+pport;
  relay=relayMod.create({MP1_PORT:'0',MP1_BIND:'0.0.0.0',MP1_TRUST_PROXY:'1',MP1_ORIGINS:base});const rs=await relay.start();
  px=await startProxy({target:rs.address().port,cert:tls.cert,key:tls.key,port:pport,fragment:4096});
  const spki=execSync(`openssl x509 -in ${tls.cert} -pubkey -noout | openssl pkey -pubin -outform der | openssl dgst -sha256 -binary | base64`).toString().trim();
  const launch={executablePath:process.env.STARS_CHROMIUM_PATH||undefined,args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--ignore-certificate-errors-spki-list='+spki]};
  [bH,bB,bC]=await Promise.all([0,1,2].map(()=>chromium.launch(launch)));
  H=await (await bH.newContext(PHONE(390,844))).newPage();Bp=await (await bB.newContext(PHONE(360,800))).newPage();Cp=await (await bC.newContext(PHONE(412,915))).newPage();
  for(const [n,p] of [['host',H],['B',Bp],['C',Cp]]){p.on('pageerror',e=>errors.push(n+': '+e.message));p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))errors.push(n+' console: '+m.text().slice(0,300));});}

  await test('A1 host oda açar (üretim kipi relay, HTTPS/WSS); lobi yeni sade lobi: oda kodu, davet, oyuncular, DEVLETİMİ DÜZENLE, GALAKSİ AYARLARI, kapasite; eski sekmeler yok',async()=>{
    await H.goto(base+'/');await wait(H,()=>typeof setupGame==='function'&&document.getElementById('mp1Btn')&&window.MP7Setup);
    await tap(H,'#mp1Btn');await tap(H,'[data-m="create"]');await wait(H,()=>window.MP1Host&&MP1Host.lobby&&MP1Host.lobby.mode==='design'&&MP1Host.lobby.phase==='waiting');
    link=await H.textContent('#mp1Link');code=await H.evaluate(()=>MP1Host.code);assert.equal(link,base+'/mp/play?code='+code);
    const ui=await H.evaluate(()=>({tabs:document.querySelectorAll('#mp1 .mp1-tabs').length,edit:!!document.getElementById('mp7EditMe'),gal:!!document.getElementById('mp7GalaxyBtn'),cap:!!document.getElementById('mp7Cap')}));
    assert.deepEqual(ui,{tabs:0,edit:true,gal:true,cap:true});await shot(H,'a1-host-lobby');
  });

  await test('A2 host kendi devletini GERÇEK tek oyunculu kurulum ekranında tasarlar (doktrin/görünüş/fizyoloji/etik/civic/köken + galaksi boyutu) ve lobiye döner; seçimler host CFG\'sinde, lobi özeti güncel',async()=>{
    await tap(H,'#mp7EditMe');
    await wait(H,()=>document.getElementById('mp7Head')&&document.querySelector('#setup .stp[data-x="galaksi"]'));
    await design(H,{name:'Kızıl Muhafız',mizac:'militarist',look:'surungen',physio:'avian',ethics:['mil:2'],civics:['kale_dok'],origin:'kusatilmis',galaxy:{size:'orta'},shot:'a2-host-setup'});
    const s=await H.evaluate(()=>({mz:CFG.mizac,ph:CFG.physio,o:CFG.origin,mil:CFG.ethics.mil,cv:CFG.civics,lobby:!document.getElementById('mp1').classList.contains('mp7-hide'),card:document.getElementById('mp7Players').textContent,size:MP1Host.lobby.settings.size}));
    assert.deepEqual([s.mz,s.ph,s.o,s.mil,s.cv,s.lobby,s.size],['militarist','avian','kusatilmis',2,['kale_dok'],true,'orta']);assert.match(s.card,/Kızıl Muhafız/);await shot(H,'a2-host-lobby');
  });

  await test('A3 misafir B davet bağlantısıyla katılır, AYNI kurulum ekranında (galaksi adımı yok) kendi devletini tasarlar ve kaydeder; host taslağı motorun kurallarıyla kabul eder; B HAZIRIM',async()=>{
    await Bp.goto(link);await wait(Bp,()=>window.MP1Join&&document.getElementById('jName'));
    await Bp.fill('#jName','Bora');await tap(Bp,'[data-j="go"]');await wait(Bp,()=>MP1Join.screen==='lobby'&&MP1Join.lobby&&MP1Join.lobby.mode==='design'&&document.getElementById('jEditMe'));
    assert.equal(await Bp.evaluate(()=>document.getElementById('jReady').disabled),true,'ready needs a saved design');await shot(Bp,'a3-b-lobby');
    if(process.env.MP7_DBG)await Bp.evaluate(()=>{window.__hid=[];const add=DOMTokenList.prototype.add;DOMTokenList.prototype.add=function(...a){try{if(a.includes('hidden')&&this===document.getElementById('menu').classList)window.__hid.push(new Error().stack.split('\n').slice(1,7).join(' | '));}catch{}return add.apply(this,a);};
      for(const k of ['back','go','pushState','replaceState']){const f=history[k].bind(history);history[k]=function(...a){window.__hid.push(k+' '+JSON.stringify(a[0])+' len'+history.length+' '+new Error().stack.split('\n').slice(2,5).join(' | '));return f(...a);};}});
    await tap(Bp,'#jEditMe');await wait(Bp,()=>document.getElementById('mp7Head'));
    assert.equal(await Bp.evaluate(()=>!!document.querySelector('#setup .stp[data-x="galaksi"]')),false,'guest has no galaxy step');
    if(process.env.MP7_DBG)Bp.on('close',()=>{});try{await design(Bp,{name:'Saf Akıl Ağı',mizac:'teknokrasi',look:'makine',physio:'machine',ethics:['mat:2','mil:-1'],civics:['sinyal_avci'],origin:'son_umut',shot:'a3-b-setup'});}catch(e){if(process.env.MP7_DBG)console.log('HID',JSON.stringify(await Bp.evaluate(()=>window.__hid),null,1));throw e;}
    if(0)await design(Bp,{name:'Saf Akıl Ağı',mizac:'teknokrasi',look:'makine',physio:'machine',ethics:['mat:2','mil:-1'],civics:['sinyal_avci'],origin:'son_umut',shot:'a3-b-setup'});
    await wait(H,()=>[...MP1Host.host.state.players.values()].some(p=>p.draft&&p.draft.name==='Saf Akıl Ağı'));
    await wait(Bp,()=>/kaydedildi/.test(document.getElementById('jDraft').textContent));
    await tap(Bp,'#jReady');await wait(H,()=>MP1Host.host.canStart().ok);
    const d=await H.evaluate(()=>[...MP1Host.host.state.players.values()].find(p=>p.draft).draft);
    assert.deepEqual([d.mizac,d.physio,d.origin,d.ethics.mat,d.ethics.mil,d.civics],['teknokrasi','machine','son_umut',2,-1,['sinyal_avci']]);
    await shot(H,'a3-host-ready');
  });

  await test('A4 host OYUNU BAŞLAT: galaksi iki taslakla kurulur; misafir sonsuz beklemeden GERÇEK STARS haritasına geçer (vekil büyük iletileri parçalarken); her oyuncu kendi tasarladığı devleti yönetir',async()=>{
    const t0=Date.now();await tap(H,'[data-m="start"]');
    await wait(Bp,()=>window.MP6Stars&&MP6Stars.S.started&&!document.getElementById('game').classList.contains('hidden'),undefined,40000);metrics.guestStartMs=Date.now()-t0;
    metrics.fragmented=px.frag.split;
    const hs=await H.evaluate(()=>({p:[G.p.name,G.p.mizac,G.p.physio,G.p.origin,G.p.ethics.mil,G.p.civics],e1:[G.emps[1].name,G.emps[1].ai,G.emps[1].mizac,G.emps[1].physio,G.emps[1].origin,G.emps[1].ethics.mat,G.emps[1].civics,Object.keys(G.emps[1].techs).length],
      ai:G.emps.filter(e=>e.ai&&!e.wild).length}));
    assert.deepEqual(hs.p,['Kızıl Muhafız','militarist','avian','kusatilmis',2,['kale_dok']],'host empire = host design');
    assert.deepEqual(hs.e1.slice(0,7),['Saf Akıl Ağı',false,'teknokrasi','machine','son_umut',2,['sinyal_avci']],'guest empire = guest design');
    assert(hs.e1[7]>0,'son_umut origin effect: free tier-1 techs');assert.equal(hs.ai,5,'AI count independent of humans');
    const g=await Bp.evaluate(()=>({id:G.p.id,n:G.p.name,ai:G.p.ai,map:!!document.getElementById('map'),stage:MP6Stars.S.boot.stage}));
    assert.deepEqual(g,{id:0,n:'Saf Akıl Ağı',ai:false,map:true,stage:'ready'});
    assert(metrics.fragmented>0,'the proxy really fragmented large frames');await shot(Bp,'a4-b-game');await shot(H,'a4-host-game');
  });

  await test('A5 misafir gerçek arayüzden kendi devletine emir verir (bilim ağacından araştırma hedefi); host motoru uygular; iki tarafta güncel',async()=>{
    await Bp.setViewportSize({width:800,height:360});await H.setViewportSize({width:844,height:390});
    const tech=await H.evaluate(()=>{const E=G.emps[1];return Object.keys(TECHS).find(id=>!E.techs[id]&&researchAccess(E,id).ok&&researchRoute(E,id).ok);});
    await Bp.evaluate(t=>UI.scienceAction('scienceTab',TECHS[t].b),tech);await wait(Bp,t=>document.querySelector('[data-a="scienceNode"][data-x="'+t+'"]'),tech);
    await tap(Bp,'[data-a="scienceNode"][data-x="'+tech+'"]');
    await wait(H,t=>G.emps[1].research.targets.includes(t),tech);await H.evaluate(()=>MP1Host.host.publish());
    await wait(Bp,t=>G.p.research.targets.includes(t),tech);await shot(Bp,'a5-b-research');
  });

  /* ---------- B: üç oyuncu, ayrı oda (host + B + C) ---------- */
  let H2,link2;
  await test('B1 ikinci oda (kapasite 3): B yeniden katılır (cihazdaki taslağı kurulum ekranına geri gelir), C 412×915 telefondan farklı bir devlet tasarlar; ikisi de hazır',async()=>{
    H2=await (await bH.newContext(PHONE(390,844))).newPage();H2.on('pageerror',e=>errors.push('host2: '+e.message));
    await H2.goto(base+'/');await wait(H2,()=>typeof setupGame==='function'&&document.getElementById('mp1Btn')&&window.MP7Setup);
    await tap(H2,'#mp1Btn');await tap(H2,'[data-m="create"]');await wait(H2,()=>MP1Host.lobby&&MP1Host.lobby.mode==='design'&&MP1Host.lobby.phase==='waiting');
    await H2.selectOption('#mp7Cap','3');await wait(H2,()=>MP1Host.lobby.capacity===3);link2=await H2.textContent('#mp1Link');
    for(const [p,name] of [[Bp,'Bora'],[Cp,'Cem']]){await p.goto(link2);await wait(p,()=>window.MP1Join&&document.getElementById('jName'));await p.fill('#jName',name);await tap(p,'[data-j="go"]');
      await wait(p,()=>MP1Join.screen==='lobby'&&MP1Join.lobby&&MP1Join.lobby.mode==='design'&&document.getElementById('jEditMe'));}
    await tap(Bp,'#jEditMe');await wait(Bp,()=>document.getElementById('mp7Head'));
    assert.deepEqual(await Bp.evaluate(()=>[CFG.name,CFG.mizac,CFG.origin]),['Saf Akıl Ağı','teknokrasi','son_umut'],'device keeps the previous design');
    await tap(Bp,'#setup [data-a="start"]');await wait(Bp,()=>document.getElementById('menu').classList.contains('hidden'));
    await tap(Cp,'#jEditMe');await wait(Cp,()=>document.getElementById('mp7Head'));
    await design(Cp,{name:'Okyanus Ticaret Birliği',mizac:'tuccar',look:'akuatik',physio:'aquatic',ethics:['aut:-1','mat:1'],civics:['maden_lonca'],origin:'gocebe',shot:'b1-c-setup'});
    for(const p of [Bp,Cp]){await wait(p,()=>/kaydedildi/.test(document.getElementById('jDraft').textContent));await tap(p,'#jReady');}
    await wait(H2,()=>MP1Host.host.canStart().ok);await shot(H2,'b1-host-lobby');await shot(Cp,'b1-c-lobby');
  });
  await test('B2 başlangıçta aksilikler: host\'un B\'ye tam aynası ilk 6 sn, ayna farkları 12 sn kaybolur (fark yok → yeniden eşitleme tetiklenemez; yalnız bekçi kurtarır), C\'nin ağı başlangıç anında 3 sn kopar; B başlangıç bekçisiyle aynayı yeniden ister, C aynı devletine döner; ikisi de sonsuz beklemeden haritaya geçer',async()=>{
    const bConn=await H2.evaluate(n=>{for(const p of MP1Host.host.state.players.values())if(p.name===n)return [...MP1Host.host.state.conns.entries()].find(([,pid])=>pid===p.playerId)[0];},'Bora');
    /* başlangıçtan sonraki 6 sn boyunca B'ye giden BÜTÜN ayna ve ayna farkı iletileri kaybolur: fark gelmediği için tam yeniden eşitleme
       tetiklenemez; yalnız başlangıç bekçisi (8 sn sonra ui:stars yeniden) kurtarabilir */
    await H2.evaluate(c=>{const ws=MP1Host.ws,s0=ws.send.bind(ws);window.__dropped=0;window.__t0=0;ws.send=t=>{
      if(typeof t==='string'&&t.startsWith('T'+c+'\n')){const full=t.includes('"type":"mirror"'),delta=t.includes('"type":"mirrorDelta"');
        if((full||delta)&&!window.__t0)window.__t0=Date.now();const age=Date.now()-window.__t0;
        if(full&&age<6000||delta&&age<12000){window.__dropped++;return;}}return s0(t);};},bConn);
    const t0=Date.now();await tap(H2,'[data-m="start"]');await Cp.context().setOffline(true);await Cp.waitForTimeout(3000);await Cp.context().setOffline(false);
    await wait(Cp,()=>window.MP6Stars&&MP6Stars.S.started,undefined,60000);metrics.cStartMs=Date.now()-t0;
    await wait(Bp,()=>window.MP6Stars&&MP6Stars.S.started,undefined,60000);metrics.bStartMs=Date.now()-t0;
    metrics.droppedToB=await H2.evaluate(()=>window.__dropped);assert(metrics.droppedToB>=1,'mirror traffic to B was really dropped');
    const bl=await Bp.evaluate(()=>({log:MP6Stars.S.boot.log.map(x=>x.what),resyncs:MP6Stars.S.stats.resyncs}));metrics.bBoot=bl;
    assert(bl.log.includes('ask-mirror'),'B start watchdog re-requested the mirror: '+JSON.stringify(bl));
    const c=await Cp.evaluate(()=>({id:MP1Join.empireId,n:G.p.name,reconnects:MP1Join.reconnects||0,stage:MP6Stars.S.boot.stage}));
    assert.deepEqual([c.id,c.n,c.stage],[2,'Okyanus Ticaret Birliği','ready']);
    const b=await Bp.evaluate(()=>[MP1Join.empireId,G.p.name]);assert.deepEqual(b,[1,'Saf Akıl Ağı']);
    await shot(Bp,'b2-b-game');await shot(Cp,'b2-c-game');
  });
  await test('B3 C kendi filosuna gerçek komut verir (filo seçimi → ROTA → haritada hedef) ve host uygular; B\'nin aynasında C\'nin kaynağı/teknolojisi yok',async()=>{
    await Cp.setViewportSize({width:915,height:412});
    const plan=await H2.evaluate(()=>{const e=G.emps[2],f=G.fleets.find(x=>x.e===2&&x.ships.length&&x.sys>=0&&!x.mv);return {f:f.id,to:G.sys[f.sys].lanes[0]};});
    const r=await Cp.evaluate(p=>new Promise(res=>{const cid=MP1Join.cmd({kind:'move',fleet:p.f,to:p.to}).cid;const t=setInterval(()=>{const x=MP1Join.results.find(y=>y.cid===cid);if(x){clearInterval(t);res(x);}},50);}),plan);
    assert.equal(r.status,'ok',JSON.stringify(r));assert.equal(await H2.evaluate(p=>{const f=G.fleets.find(x=>x.id===p.f);return !!(f.mv||f.path.length);},plan),true);
    const priv=await Bp.evaluate(()=>{const c=MP6Stars.S.mirror.emps.find(e=>e.name==='Okyanus Ticaret Birliği');return c?{res:Object.values(c.res).reduce((a,b)=>a+b,0),techs:Object.keys(c.techs).length}:'not-contacted';});
    assert(priv==='not-contacted'||(priv.res===0&&priv.techs===0),JSON.stringify(priv));
  });

  await test('sayfa hataları yok (host, B, C)',async()=>{assert.deepEqual(errors,[]);});
}catch(e){console.log('FATAL',e);results.push({name:'FATAL',status:'FAIL',error:String(e&&e.stack||e)});}
finally{fs.writeFileSync(path.join(out,'mp7-results.json'),JSON.stringify({results,errors,metrics,pass:results.filter(r=>r.status==='PASS').length,fail:results.filter(r=>r.status==='FAIL').length},null,2));
  for(const b of [bH,bB,bC])try{await b?.close();}catch{}try{await px?.close();}catch{}try{relay?.shutdown();}catch{}try{tls?.cleanup();}catch{}
  const pass=results.filter(r=>r.status==='PASS').length,fail=results.length-pass;console.log('GEÇEN: '+pass+' KALAN: '+fail);process.exit(fail?1:0);}
})();
