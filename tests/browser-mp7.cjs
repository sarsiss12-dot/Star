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

  await test('sayfa hataları yok (host, B, C)',async()=>{assert.deepEqual(errors,[]);});
}catch(e){console.log('FATAL',e);results.push({name:'FATAL',status:'FAIL',error:String(e&&e.stack||e)});}
finally{fs.writeFileSync(path.join(out,'mp7-results.json'),JSON.stringify({results,errors,metrics,pass:results.filter(r=>r.status==='PASS').length,fail:results.filter(r=>r.status==='FAIL').length},null,2));
  for(const b of [bH,bB,bC])try{await b?.close();}catch{}try{await px?.close();}catch{}try{relay?.shutdown();}catch{}try{tls?.cleanup();}catch{}
  const pass=results.filter(r=>r.status==='PASS').length,fail=results.length-pass;console.log('GEÇEN: '+pass+' KALAN: '+fail);process.exit(fail?1:0);}
})();
