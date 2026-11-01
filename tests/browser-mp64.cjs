'use strict';
/* MP.6.4 — casusluk, Galaktik Borsa, kalan filo işlemleri, oyuncuya özel haberler ve MP.6.3'ten kalan siyasi işlemler; gerçek
   STARS arayüzünde gerçek dokunma. Ayrı Chromium süreçleri: host (915×412), misafir B (844×390), misafir C (960×540),
   misafir A (844×390) — üç insan misafir: gizlilik senaryosu. Dünya seed 22, orta, 5 AI; B = 3, C = 5, A = 1.
   FİKSTÜR (açıkça): temas/kaynak; istihbarat seviyesi (e.intel), Galaktik Konsey + borsa yasası (laws.borsaKur), ortak sefer
   (declareWar + warOn + captureSystem + makePeace), vasallık tarih kaydırması (sözleşme 13 ay önce) — motorun alanlarına.
   Ekran gezintisi (sekme / hedef seçimi) UI.act ya da UI.openX ile; karar düğmeleri gerçek dokunuş. Yerel relay; gerçek
   internet ve fiziksel Android DEĞİL. Çıktı: $STARS_OUTPUT/mp64-results.json + PNG. */
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),out=path.resolve(process.env.STARS_OUTPUT||path.join(root,'../evidence/mp64'));fs.mkdirSync(out,{recursive:true});
const relayMod=require('../research/mp1/server/relay.js');
const results=[],errors=[],metrics={spy:{},market:{},notes:[]};
const launch={executablePath:process.env.STARS_CHROMIUM_PATH||undefined,args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage']};
const PHONE=(w,h)=>({viewport:{width:w,height:h},isMobile:true,hasTouch:true,deviceScaleFactor:2});
const B=3,C=5,A=1;
let tno=0;const ONLY=process.env.MP64_ONLY||'';
async function test(name,fn){++tno;if(ONLY&&tno>1&&!new RegExp(ONLY).test(name)&&!name.startsWith('sayfa'))return;const t0=Date.now();try{await fn();results.push({name,status:'PASS',ms:Date.now()-t0});console.log('PASS '+name);}
  catch(e){results.push({name,status:'FAIL',error:String(e&&e.stack||e).slice(0,1600)});console.log('FAIL '+name+'\n'+(e&&e.stack||e));}}
const wait=(p,fn,arg,timeout=25000)=>p.waitForFunction(fn,arg,{timeout,polling:80});
const shot=(p,n)=>p.screenshot({path:path.join(out,n+'.png')}).catch(()=>{});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function tap(p,sel){const l=p.locator(sel).first();await l.scrollIntoViewIfNeeded().catch(()=>{});await l.tap();}
const openDetails=p=>p.evaluate(()=>{for(const d of document.querySelectorAll('#diploPane details,#side details,#panel details'))d.open=true;});
async function tapIn(p,sel){let err;for(let i=0;i<6;i++){await openDetails(p);try{const l=p.locator(sel).first();await l.scrollIntoViewIfNeeded({timeout:2000}).catch(()=>{});await l.tap({timeout:3000});return;}catch(e){err=e;await sleep(400);}}throw err;}
const loc=(me,id)=>id===me?0:id===0?me:id;   // misafirin aynası: π = (0 me)
async function synced(p){await H.evaluate(()=>MP1Host.host.publish());const d=await H.evaluate(()=>G.day);
  await wait(p,d=>typeof G!=='undefined'&&Math.abs(G.day-d)<1e-9&&!MP6Stars.S.timer,d,15000).catch(async e=>{throw Error('synced: host '+d+' guest '+JSON.stringify(await p.evaluate(()=>({day:G.day,timer:!!MP6Stars.S.timer,modal:!document.getElementById('modal').classList.contains('hidden')}))));});}
const closeAll=p=>p.evaluate(()=>{if(!document.getElementById('modal').classList.contains('hidden'))UI.closeModal();document.getElementById('diploPane').classList.remove('show');});
const notesOf=p=>p.evaluate(()=>(MP1Join.game.view.log||[]).map(n=>n.m));
async function hostWait(fn,arg,label){try{await wait(H,fn,arg);}catch(e){throw Error(label+': '+JSON.stringify(await H.evaluate(()=>MP1Host.host.stats)).slice(0,300));}}
/* diplomasi ilişki sayfası: ayna yeniden kurulursa hedef sıfırlanabilir — sayfa gerçekten açılana kadar yeniden seç */
async function relation(p,id){for(let i=0;i<5;i++){await closeAll(p);await sleep(500);await synced(p);await p.evaluate(id=>{UI.openDiplo();UI.selectDiplo(id,'relation');},id);await sleep(400);
  if(await p.evaluate(id=>document.getElementById('diploPane').classList.contains('show')&&UI.diploPage==='relation'&&UI.diploTarget===id&&!MP6Stars.S.timer,id)){await openDetails(p);return;}}
  throw Error('relation page '+id+' '+JSON.stringify(await p.evaluate(()=>({page:UI.diploPage,t:UI.diploTarget}))));}
async function openInbox(p){await closeAll(p);await synced(p);if(!await p.locator('#tools [data-a="diplomaticInbox"]').first().isVisible())await tap(p,'#tools [data-a="grpTog"][data-x="emp"]');await tap(p,'#tools [data-a="diplomaticInbox"]');}
async function inboxRecord(p,pred,ready){await openInbox(p);
  await wait(p,pr=>DiplomaticInbox.state().records.some(r=>r.status==='pending'&&new Function('r','return '+pr)(r)),pred);
  const id=await p.evaluate(pr=>DiplomaticInbox.state().records.find(r=>r.status==='pending'&&new Function('r','return '+pr)(r)).id,pred);
  await tap(p,'[data-a="diplomaticRecord"][data-x="'+id+'"]');await wait(p,sel=>{const b=document.querySelector(sel);return b&&!b.disabled;},ready);}

let relay,base,bH,bB,bC,bA,H,Bp,Cp,Ap;
(async()=>{try{
  relay=relayMod.create({MP1_PORT:'0'});const s=await relay.start();base='http://127.0.0.1:'+s.address().port;
  [bH,bB,bC,bA]=await Promise.all([0,1,2,3].map(()=>chromium.launch(launch)));
  H=await (await bH.newContext(PHONE(915,412))).newPage();Bp=await (await bB.newContext(PHONE(844,390))).newPage();Cp=await (await bC.newContext(PHONE(960,540))).newPage();Ap=await (await bA.newContext(PHONE(844,390))).newPage();
  for(const [n,p] of [['host',H],['B',Bp],['C',Cp],['A',Ap]]){p.on('pageerror',e=>errors.push(n+': '+e.message));p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))errors.push(n+' console: '+m.text());});}

  await test('kurulum: host oda açar; B, C, A davet bağlantısıyla (/mp/play) katılır; oyun başlar; fikstür: temas + kaynak',async()=>{
    await H.goto(base+'/');await wait(H,()=>typeof setupGame==='function'&&document.getElementById('mp1Btn'));
    await tap(H,'#mp1Btn');await tap(H,'[data-m="create"]');await wait(H,()=>MP1Host.lobby&&MP1Host.lobby.phase==='waiting');
    await H.evaluate(()=>{MP1Host.host.setCapacity(4);MP1Host.host.configure({size:'orta',aiCount:5,seed:22});MP1Host.ws.send('C'+JSON.stringify({cap:3}));});
    const link=await H.textContent('#mp1Link');
    for(const [p,name,e] of [[Bp,'Bora',B],[Cp,'Cem',C],[Ap,'Ada',A]]){await p.goto(link);await wait(p,()=>window.MP1Join&&document.getElementById('jCode'));
      await p.fill('#jName',name);await tap(p,'[data-j="go"]');await wait(p,()=>MP1Join.screen==='lobby'&&MP1Join.lobby);
      await tap(p,'[data-j="claim"][data-e="'+e+'"]');await wait(H,e=>MP1Host.lobby.players.some(x=>x.claim===e),e);await tap(p,'#jReady');}
    await wait(H,()=>MP1Host.host.canStart().ok);await tap(H,'[data-m="start"]');
    for(const p of [Bp,Cp,Ap])await wait(p,()=>window.MP6Stars&&MP6Stars.S.started&&!document.getElementById('game').classList.contains('hidden'));
    await H.waitForTimeout(600);await H.evaluate(()=>{if(!document.getElementById('modal').classList.contains('hidden'))UI.closeModal();UI.setSpeed(0);});
    await H.evaluate(()=>{MP1Host.advance(5);for(const e of G.emps)if(!e.wild)for(const k of ['etk','ene','min','ala','tuk','yiy'])e.res[k]=Math.max(e.res[k],5000);
      for(const a of [0,1,2,3,4,5])for(const b of [0,1,2,3,4,5])if(a!==b){G.emps[a].contact[b]=true;G.emps[a].rel[b]=30;}
      for(const s of G.sys){s.seen=G.emps.map(e=>e.id);s.surv=G.emps.map(e=>e.id);}
      for(const id of [0,1,2,3,4,5]){recalcMods(G.emps[id]);G.emps[id]._powAt=-1;}G.inbox=[];UI.drawInbox();MP1Host.host.publish();});
    for(const p of [Bp,Cp,Ap]){await synced(p);await p.evaluate(()=>{if(!document.getElementById('modal').classList.contains('hidden'))UI.closeModal();});}
  });

  await test('casusluk ağı: B gerçek İSTİHBARAT ekranında C\'yi seçer, CASUS ATA\'ya dokunur → host\'ta motorun ağı (e.spy); kapasite yazısı host kaydıyla tutarlı',async()=>{
    const c=loc(B,C);await closeAll(Bp);await Bp.evaluate(c=>{UI.tab('intel');UI.act('spySel',c);},c);
    await wait(Bp,c=>document.querySelector('[data-a="spy"][data-x="'+c+'"]'),c);await shot(Bp,'s1-b-intel');
    await tapIn(Bp,'[data-a="spy"][data-x="'+c+'"]');await hostWait(([b,c])=>!!(G.emps[b].spy||{})[c],[B,C],'spyAssign');
    await synced(Bp);assert.equal(await Bp.evaluate(c=>!!G.p.spy[c],c),true,'own mirror shows the network');
    metrics.spy.assigned=true;
  });

  await test('casusluk operasyonu: B operasyon kartına dokunur → onay penceresi host\'un değerleri (maliyet, %ifşa) → ONAYLA → host motoru zar atar → B gerçek SONUÇ penceresinde host\'un sonucu; C motorun izin verdiğini, A hiçbir şey görmez',async()=>{
    await H.evaluate(([b,c])=>{G.emps[b].intel=G.emps[b].intel||{};G.emps[b].intel[c]=1;MP1Host.host.publish();},[B,C]);const c=loc(B,C);
    await synced(Bp);await closeAll(Bp);await Bp.evaluate(c=>{UI.tab('intel');UI.act('spySel',c);},c);
    await wait(Bp,c=>document.querySelector('[data-a="opAsk"][data-x="'+c+':kervan"]'),c,20000);
    const host=await H.evaluate(([b,c])=>{const q=opQuote(G.emps[b],G.emps[c],'kervan');return {riskPct:q.riskPct,cost:q.cost};},[B,C]);
    await tapIn(Bp,'[data-a="opAsk"][data-x="'+c+':kervan"]');await wait(Bp,()=>document.querySelector('#modal [data-a="opGo"]'));
    const t=await Bp.evaluate(()=>document.getElementById('modal').textContent);assert(t.includes('%'+host.riskPct),'confirm shows the host risk %'+host.riskPct);await shot(Bp,'s2-b-op-confirm');
    const n0=await H.evaluate(b=>(G.emps[b].opLog||[]).length,B),etk0=await H.evaluate(b=>G.emps[b].res.etk,B);
    await tap(Bp,'#modal [data-a="opGo"]');await hostWait(([b,n])=>(G.emps[b].opLog||[]).length>n,[B,n0],'spyOp');
    const lg=await H.evaluate(b=>G.emps[b].opLog.at(-1),B);assert.equal(lg.k,'kervan');assert.equal(Math.round(etk0-await H.evaluate(b=>G.emps[b].res.etk,B)),host.cost.etk,'cost once');
    await wait(Bp,()=>/OPERASYON SONUCU/.test(document.getElementById('modal').textContent),undefined,20000);const res=await Bp.evaluate(()=>document.getElementById('modal').textContent);
    assert(res.includes(lg.actorSummary.slice(0,30)),'result window shows the host result');assert(/YAKALANDIN|İFŞA EDİLMEDİ/.test(res));await shot(Bp,'s2-b-op-result');
    metrics.spy.op={caught:lg.caught,msg:lg.actorSummary};
    await closeAll(Bp);await H.evaluate(()=>MP1Host.host.publish());await wait(Cp,()=>(MP1Join.game.view.log||[]).some(n=>/CASUSLUK|istihbarat|Kervan|fail/i.test(n.m)));
    const nC=await notesOf(Cp),nB=await H.evaluate(b=>G.emps[b].name,B);
    if(lg.caught)assert(nC.some(m=>m.includes(nB)),'caught: C learns the perpetrator');else assert(!nC.some(m=>m.includes(nB)),'uncaught: no name');
    assert(!(await notesOf(Ap)).some(m=>/CASUSLUK|istihbarat faaliyeti/i.test(m)),'A learns nothing');
    await synced(Cp);const hl=await Cp.evaluate(()=>(G.p.hitLog||[]).map(x=>({known:x.known,hasBy:'by' in x,framed:'framed' in x})));
    assert(hl.length>0&&hl.every(x=>x.known||!x.hasBy),'C mirror: unknown perpetrator stripped '+JSON.stringify(hl));assert(hl.every(x=>!x.framed));
  });

  await test('Galaktik Borsa: B gerçek borsa panelinde seçim yapar, TAKAS ET\'e dokunur → host\'ta motorun marketTrade\'i, kaynak BİR kez; C\'nin bakiyesi değişmez',async()=>{
    await H.evaluate(()=>{G.council={name:councilName(),founder:2,members:[0,1,2,3,4,5],laws:{borsaKur:true},targeted:{},treasury:0,president:2,termStart:G.day,terms:{},voteIn:12,vote:null,dead:false};marketInit();MP1Host.host.publish();});
    await synced(Bp);await closeAll(Bp);await Bp.evaluate(()=>{UI.mkt={sat:'min',al:'ala',mik:200};UI.openMarket();});
    await wait(Bp,()=>document.querySelector('#diploPane [data-a="mktTrade"][data-x="min:ala:200"]'));await shot(Bp,'m1-b-market');
    const b0=await H.evaluate(b=>({min:G.emps[b].res.min,ala:G.emps[b].res.ala}),B),c0=await H.evaluate(c=>({...G.emps[c].res}),C),exp=await H.evaluate(()=>marketQuote('min','ala',200).alinan);
    await tapIn(Bp,'#diploPane [data-a="mktTrade"][data-x="min:ala:200"]');await hostWait(([b,m])=>G.emps[b].res.min<m-1,[B,b0.min],'market');
    const b1=await H.evaluate(b=>({min:G.emps[b].res.min,ala:G.emps[b].res.ala}),B);assert.equal(Math.round(b0.min-b1.min),200);assert(Math.abs((b1.ala-b0.ala)-exp)<.01,'received the host quote');
    await sleep(800);const b2=await H.evaluate(b=>G.emps[b].res.min,B);assert.equal(Math.round(b2),Math.round(b1.min),'applied once');
    assert.deepEqual(await H.evaluate(c=>({...G.emps[c].res}),C),c0);metrics.market={paid:200,got:+(b1.ala-b0.ala).toFixed(2)};
    await closeAll(Bp);
  });

  await test('filo: B kendi hasarlı filosunda gerçek TAMİRİ DURDUR düğmesine dokunur → host\'ta onarım durur; C\'nin filosu için komut reddedilir',async()=>{
    const fb=await H.evaluate(b=>{const f=G.fleets.find(f=>f.e===b&&f.ships.length&&isArmed(f));f.ships[0].h=.4;f.sys=G.emps[b].home;f.mv=null;f.path=[];MP1Host.host.publish();return f.id;},B);
    await synced(Bp);await wait(Bp,id=>{const f=G.fleets.find(x=>x.id===id);return f&&fleetHull(f)<.99;},fb);   // ayna farkı gelene kadar (gün değişmedi)
    await closeAll(Bp);await Bp.evaluate(id=>{const f=G.fleets.find(x=>x.id===id);View.sel=f;UI.tab('filo');UI.refresh();},fb);
    const has=await Bp.locator('[data-a="repairToggle"][data-x="'+fb+'"]').count();
    if(!has)throw Error('repair button missing: '+JSON.stringify(await H.evaluate(id=>{const f=G.fleets.find(x=>x.id===id);return {hull:fleetHull(f),rc:repairContext(f)};},fb))+' guest '+JSON.stringify(await Bp.evaluate(id=>{const f=G.fleets.find(x=>x.id===id);
      return f?{hull:fleetHull(f),rc:repairContext(f),sel:View.sel&&View.sel.id,cur:UI.cur,panel:(document.getElementById('side')||document.body).textContent.replace(/\s+/g,' ').slice(0,300)}:'no fleet';},fb)));
    const before=await H.evaluate(id=>!!G.fleets.find(f=>f.id===id).repairOff,fb);await tapIn(Bp,'[data-a="repairToggle"][data-x="'+fb+'"]');
    await hostWait(([id,b])=>!!G.fleets.find(f=>f.id===id).repairOff!==b,[fb,before],'repair');
    const fc=await H.evaluate(c=>G.fleets.find(f=>f.e===c&&f.ships.length).id,C);
    const r=await Bp.evaluate(id=>new Promise(res=>{const c=MP1Join.cmd({kind:'repair',fleet:id});setTimeout(()=>res((MP1Join.results.find(x=>x.cid===c.cid)||{}).code),1500);}),fc);assert.equal(r,'not-owner');
  });

  await test('haberler: AI 2, B\'ye savaş ilan eder → B gerçek HABERLER panelinde "Savaş" haberini görür (doğrudan katılım); 2 ile temassız A görmez',async()=>{
    await H.evaluate(([a])=>{G.emps[a].contact[2]=false;G.emps[2].contact[a]=false;},[A]);
    await H.evaluate(b=>{G._dealAuth=true;try{declareWar(G.emps[2],G.emps[b]);}finally{G._dealAuth=false;}G.inbox=G.inbox.filter(n=>n.kind!=='warstart');UI.drawInbox();MP1Host.host.publish();},B);
    await synced(Bp);await closeAll(Bp);if(!await Bp.locator('#tools [data-a="news"]').first().isVisible())await tap(Bp,'#tools [data-a="grpTog"][data-x="emp"]').catch(()=>{});
    await tap(Bp,'#tools [data-a="news"]');await wait(Bp,()=>/Savaş/.test(document.getElementById('modal').textContent||'')||/Savaş/.test((document.getElementById('diploPane')||{}).textContent||''));
    await shot(Bp,'n1-b-news');assert.equal(await Bp.evaluate(()=>GalacticNews.state().records.some(r=>r.category==='war')),true);
    await synced(Ap);assert.equal(await Ap.evaluate(()=>GalacticNews.state().records.some(r=>r.category==='war')),false,'A has no contact with 2');
    await closeAll(Bp);await H.evaluate(([b,a])=>{makePeace(G.emps[2],G.emps[b]);G.emps[a].contact[2]=G.emps[2].contact[a]=true;MP1Host.host.publish();},[B,A]);   // fikstür geri: A–2 teması
  });

  /* ═══ MP.6.3'ten kalan siyasi işlemler — gerçek tarayıcı. Paylaşım ortağı A: C'nin doktrini vekâlet savaşını yasaklıyor
     (motorun dealQuote gerekçesi), bu yüzden C ortak olamaz. ═══ */
  await test('paylaşım RET ve GERİ ÇEKME: B önerir (gerçek pencere) → B geri çeker (gerçek "Teklifi geri çek") → yeni taslak → A (ortak) gerçek "Reddet" → teklif reddedildi; devir yok',async()=>{
    const camp=await H.evaluate(([b,c])=>{for(const id of [0,2,3,4,5])for(const o of [0,1,2,3,4,5])G.emps[id].war[o]=G.emps[o].war[id]=false;
      const P=G.emps[b],T=G.emps[2];G._dealAuth=true;try{declareWar(P,T);}finally{G._dealAuth=false;}
      /* ortak: motorun warOn anlaşmasını kabul ettiği ilk insan (önceki testler doktrin/koruma durumunu değiştirebilir) */
      const why={};const pick=[c,5].find(x=>{const q=dealQuote({from:x,to:b,give:[{t:'warOn',target:2}],want:[]});why[x]=q.ok?'ok':(q.reasons||[]).join(';');return q.ok&&executeDeal({from:x,to:b,give:[{t:'warOn',target:2}],want:[]})&&G.emps[x].war[2];});
      if(pick===undefined)return {err:why};c=pick;const Q=G.emps[c];window.__partner=c;
      const land=G.sys.filter(s=>!s.planets.some(p=>p.col)&&s.owner!==b&&s.owner!==c).slice(0,3);land.forEach((s,i)=>{s.owner=2;captureSystem(s,[b,c,c][i]);});
      window.__land=land.map(s=>s.id);const k=warLedgerFind(b,2).campaign;makePeace(P,T);if(Q.war[2])makePeace(Q,T);G.inbox=G.inbox.filter(n=>n.kind!=='warstart');UI.drawInbox();MP1Host.host.publish();return k;},[B,A]);
    assert(Number.isInteger(camp),'fixture: a human partner joined by the engine '+JSON.stringify(camp));
    const partner=await H.evaluate(()=>window.__partner),Pp=partner===A?Ap:Cp;metrics.notes.push('paylaşım ortağı: '+partner);
    const open=async p=>{await closeAll(p);await synced(p);await p.evaluate(()=>UI.openDiplo());await wait(p,()=>document.querySelector('#diploPane [data-a="shareOpen"]')).catch(async e=>{
        throw Error('shareOpen: '+JSON.stringify({guest:await p.evaluate(()=>MP1Join.game.view.settle),host:await H.evaluate(([b,k])=>settlementContext(G.emps[b],k).why||'ok',[B,camp])}));});await tap(p,'#diploPane [data-a="shareOpen"]');};
    await open(Bp);await wait(Bp,()=>document.querySelector('#modal [data-a="shareSend"]:not([disabled])'));await tap(Bp,'#modal [data-a="shareSend"]');
    await hostWait(k=>(G.settlements.offers||[]).some(o=>o.campaign===k&&o.state==='pending'),camp,'settleSubmit');
    await closeAll(Bp);await synced(Bp);await open(Bp);await wait(Bp,()=>document.querySelector('#modal [data-a="shareWithdraw"]'));await tap(Bp,'#modal [data-a="shareWithdraw"]');
    await hostWait(k=>G.settlements.offers.filter(o=>o.campaign===k).at(-1).state==='withdrawn',camp,'settleWithdraw');await shot(Bp,'p1-b-withdrawn');
    await closeAll(Bp);await synced(Bp);await open(Bp);await wait(Bp,()=>document.querySelector('#modal [data-a="shareNew"]'));await tap(Bp,'#modal [data-a="shareNew"]');
    await wait(Bp,()=>document.querySelector('#modal [data-a="shareSend"]:not([disabled])'));await tap(Bp,'#modal [data-a="shareSend"]');
    await hostWait(k=>{const o=G.settlements.offers.filter(o=>o.campaign===k).at(-1);return o.state==='pending'&&o.proposer===3;},camp,'settleSubmit2');
    const own0=await H.evaluate(()=>window.__land.map(id=>G.sys[id].owner));
    await open(Pp);await wait(Pp,()=>document.querySelector('#modal [data-a="shareNo"]'));await shot(Pp,'p1-partner-reject');await tap(Pp,'#modal [data-a="shareNo"]');
    await hostWait(k=>G.settlements.offers.filter(o=>o.campaign===k).at(-1).state==='rejected',camp,'settleReject');
    assert.deepEqual(await H.evaluate(()=>window.__land.map(id=>G.sys[id].owner)),own0,'rejected: no transfer');
    assert.equal(await H.evaluate(([k,c])=>G.settlements.offers.filter(o=>o.campaign===k).at(-1).votes.find(v=>v.by===c).yes,[camp,partner]),false,'partner\'s own NO');
    await closeAll(Bp);await closeAll(Pp);
  });

  await test('vasallık: sözleşme yenileme (B öneri, C kabul), bağımsızlık desteği (A gerçek düğme) ve barışçıl bağımsızlık (C gerçek pencere, B gelen kutusundan KABUL); C, B\'nin vasalı (fikstür: motorla kurulan sözleşme, tarihleri 25 ay geriye; 12 ay soğuma için ayrıca 13 ay)',async()=>{
    await H.evaluate(([b,c])=>{for(let i=0;i<4;i++)newFleet(G.emps[b],G.emps[b].home,Array.from({length:12},()=>({c:'kor'})));G.emps[b]._powAt=-1;G.emps[c]._powAt=-1;
      G.feds=(G.feds||[]).filter(f=>!f.members.some(m=>[b,c].includes(m)));const r=vassalOffer(G.emps[c],G.emps[b],'seek','bekci',vassalDefaultTerms('bekci'));
      const q=G.emps[c].vassalTalk;vassalReply(G.emps[b],c,q.id,q.round,'accept');
      const s=G.emps[c],d=25*30;if(s.vassalTalk)s.vassalTalk.finished-=d;for(const x of s.vassalTalkHistory||[])if(x.finished)x.finished-=d;if(s._vassalTalkAfter)s._vassalTalkAfter-=d;
      vassalContractOf(s).started-=d;MP1Host.host.publish();return r;},[B,C]);
    assert.equal(await H.evaluate(c=>G.emps[c].overlord,C),B,'fixture: C is B\'s vassal (engine contract)');
    /* sözleşme yenileme (24 ay — motorun süresi; tarihler 25 ay geriye): B gerçek vasallık penceresinden önerir, C gelen kutusundan KABUL */
    const lcB=loc(B,C);await closeAll(Bp);await synced(Bp);
    await wait(Bp,id=>{const s=G.emps[id],c=s&&vassalContractOf(s);return !!c&&G.day>=c.started+c.terms.renegotiate*30;},lcB);   /* tarih kaydırması aynaya yansıyana kadar */
    await relation(Bp,lcB);
    await tapIn(Bp,'#diploPane [data-a="vsOpen"][data-x="'+lcB+':renew"]').catch(async e=>{throw Error('renew button: '+JSON.stringify(await Bp.evaluate(id=>({btn:[...document.querySelectorAll('#diploPane [data-a="vsOpen"]')].map(b=>[b.dataset.x,b.disabled]),
      isV:isVassal(G.emps[id]),ov:G.emps[id].overlord,c:vassalContractOf(G.emps[id])&&{started:vassalContractOf(G.emps[id]).started,rn:vassalContractOf(G.emps[id]).terms.renegotiate},day:G.day,
      txt:(document.getElementById('diploPane').textContent.match(/VASSAL YÖNETİMİ.{0,200}/)||[''])[0]}),lcB)));});await wait(Bp,()=>document.querySelector('[data-a="vsSend"]')&&document.getElementById('vsRenegotiate'));
    const rn=await Bp.evaluate(()=>{const s=document.getElementById('vsRenegotiate');return [...s.options].map(o=>o.value).find(v=>v!==s.value);});await Bp.selectOption('#vsRenegotiate',rn);
    await shot(Bp,'v1-b-renew');await tap(Bp,'[data-a="vsSend"]');
    await hostWait(c=>G.emps[c].vassalTalk&&G.emps[c].vassalTalk.kind==='renew'&&G.emps[c].vassalTalk.status==='pending',C,'renew');
    await inboxRecord(Cp,"r.kind==='vassal'",'[data-a="vsReply"][data-x="accept"]');await tap(Cp,'[data-a="vsReply"][data-x="accept"]');
    await hostWait(([c,rn])=>vassalContractOf(G.emps[c])&&String(vassalContractOf(G.emps[c]).terms.renegotiate)===String(rn),[C,rn],'renewed');await closeAll(Cp);await closeAll(Bp);
    await H.evaluate(c=>{const s=G.emps[c],d=13*30;if(s.vassalTalk)s.vassalTalk.finished-=d;for(const x of s.vassalTalkHistory||[])if(x.finished)x.finished-=d;if(s._vassalTalkAfter)s._vassalTalkAfter-=d;MP1Host.host.publish();},C);   // 12 ay soğuma (motorun) geçmiş gibi
    /* bağımsızlık desteği: A, B'nin vasalı C'nin ilişki sayfasında gerçek destek düğmesine dokunur (motor: canSupportIndep, Etki, %40 sızma) */
    const lc=loc(A,C);await relation(Ap,lc);
    const etk0=await H.evaluate(a=>G.emps[a].res.etk,A),rel0=await H.evaluate(([b,a])=>G.emps[b].rel[a]||0,[B,A]);
    await tapIn(Ap,'#diploPane [data-a="supIndep"][data-x="'+lc+'"]');await shot(Ap,'v1-a-support');
    await hostWait(([c,a])=>(G.emps[c].indepBackers||[]).includes(a),[C,A],'supIndep');
    assert.equal(Math.round(etk0-await H.evaluate(a=>G.emps[a].res.etk,A)),await H.evaluate(()=>SUPPORT_COST),'cost once');
    const leaked=await H.evaluate(([b,a,r])=>(G.emps[b].rel[a]||0)<r,[B,A,rel0]);await H.evaluate(()=>MP1Host.host.publish());await sleep(600);
    assert.equal((await notesOf(Bp)).some(m=>/gizli görüşmeler/.test(m)),leaked,'lord B told only if it leaked');metrics.notes.push('bağımsızlık desteği sızdı mı: '+leaked);
    await closeAll(Ap);
    /* barışçıl bağımsızlık: C gerçek vasallık penceresinden talep eder, B gelen kutusundan KABUL */
    const lb=loc(C,B);await relation(Cp,lb);
    await tapIn(Cp,'#diploPane [data-a="vsOpen"][data-x="'+lb+':release"]');await wait(Cp,()=>document.querySelector('[data-a="vsSend"]'));await shot(Cp,'v1-c-release');await tap(Cp,'[data-a="vsSend"]');
    await hostWait(c=>G.emps[c].vassalTalk&&G.emps[c].vassalTalk.kind==='release'&&G.emps[c].vassalTalk.status==='pending',C,'release');
    await inboxRecord(Bp,"r.kind==='vassal'",'[data-a="vsReply"][data-x="accept"]');await tap(Bp,'[data-a="vsReply"][data-x="accept"]');
    await hostWait(c=>G.emps[c].overlord==null,C,'released');assert.equal(await H.evaluate(([b,c])=>!!G.emps[c].war[b],[B,C]),false,'peaceful');
    await closeAll(Bp);
  });

  await test('federasyon: A üyeler sekmesinde İHRAÇ önergesine, sonra REFORM\'a ve Başkan önerisine, ASKERÎ sekmede ortak savaş desteğine gerçek dokunur; insanlar gelen kutusundan kendi oyunu verir; kabul edilen savaş kararını önerici A uygular',async()=>{
    const fid=await H.evaluate(([b,a])=>{const M=[b,a,2,4];for(const x of M)for(const y of M)if(x!==y){G.emps[x].ally[y]=true;G.emps[x].rel[y]=80;}
      for(const x of M){G.emps[x].overlord=null;G.emps[x].war=G.emps[x].war||{};}G.feds=(G.feds||[]).filter(f=>!f.members.some(m=>M.includes(m)));
      const F={id:900,name:'MP64 Birliği',type:'askeri',charter:fedDefaultCharter('askeri'),leader:b,founder:b,members:M,laws:{},fund:{ala:0,ene:0},treasury:0,founded:G.day,typeSince:G.day,
        dutySince:{defense:0,offense:0},invites:{},decisions:{},dutyConsent:{},cohesion:70,nextVote:G.day+100000,politicsVersion:96};
      G.feds.push(F);G.fedUid=Math.max(G.fedUid||0,900);fedNormalize(F);G.emps[a].intel=G.emps[a].intel||{};G.emps[a].intel[2]=3;for(const x of M)recalcMods(G.emps[x]);MP1Host.host.publish();return F.id;},[B,A]);
    const vote=async(tok)=>{for(const p of [Ap,Bp]){const me=p===Ap?A:B;if(await H.evaluate(([f,m])=>{const v=fedOf(f).vote;return !v||v.yes.includes(m)||v.no.includes(m)||!v.eligible.includes(m);},[fid,me]))continue;
        await inboxRecord(p,"r.kind==='fedvote'",'#inboxYes');await tap(p,'#inboxYes');await hostWait(([f,m,t])=>{const v=fedOf(f).vote;return !v||fedVoteToken(v)!==t||v.yes.includes(m);},[fid,me,tok],'fedVote');await closeAll(p);}};
    const motion=async(tab,x,label)=>{await closeAll(Ap);await synced(Ap);await Ap.evaluate(()=>UI.openFed());await wait(Ap,()=>document.getElementById('diploPane').classList.contains('show'));
      await tapIn(Ap,'#diploPane [data-a="fedTab"][data-x="'+tab+'"]');await sleep(300);
      await tapIn(Ap,'#diploPane [data-a="fedMotion"][data-x="'+x+'"]');await hostWait(f=>!!fedOf(f).vote,fid,label);
      const v=await H.evaluate(f=>{const v=fedOf(f).vote;return {tok:fedVoteToken(v),motion:v.motion,yes:v.yes.slice()};},fid);assert(!v.yes.includes(A)&&!v.yes.includes(B),'humans not auto-voted');
      await vote(v.tok);for(let i=0;i<30&&await H.evaluate(f=>!!fedOf(f).vote,fid);i++)await H.evaluate(()=>MP1Host.advance(5));return v;};
    const xl=loc(A,4);let v=await motion('members','expel:'+xl,'expel');assert.equal(v.motion,'expel');
    const ex=await H.evaluate(f=>!fedOf(f).members.includes(4),fid);metrics.notes.push('ihraç sonucu (motor oylaması): '+(ex?'kabul':'ret'));
    await H.evaluate(f=>{fedOf(f).requestAfter={};MP1Host.host.publish();},fid);
    v=await motion('manage','reform:bilimsel','reform');assert.equal(v.motion,'reform');metrics.notes.push('reform: '+JSON.stringify(await H.evaluate(f=>fedOf(f).reform||null,fid)));
    await H.evaluate(f=>{fedOf(f).requestAfter={};MP1Host.host.publish();},fid);
    v=await motion('members','elect:'+loc(A,2),'elect');assert.equal(v.motion,'elect');metrics.notes.push('başkan: '+await H.evaluate(f=>fedOf(f).leader,fid));
    /* ortak savaş: üye AI 2, dış devlet 5 (C) ile savaşta; A desteği önerir */
    /* dış hedef: motorun savaş ilanına izin verdiği ilk dış devlet (C bağımsızlık korumasında olabilir; host 0) */
    const X=await H.evaluate(f=>{fedOf(f).requestAfter={};let x=null;for(const t of [5,0]){if(fedOf(f).members.includes(t))continue;if(!G.emps[2].war[t]){warAuthorize(G.emps[2],G.emps[t],{n:'test'});declareWar(G.emps[2],G.emps[t]);warAuthClear();}if(G.emps[2].war[t]){x=t;break;}}
      G.inbox=G.inbox.filter(n=>n.kind!=='warstart');UI.drawInbox();MP1Host.host.publish();return x;},fid);
    assert(X!==null,'fixture: member 2 at war with an outsider');metrics.notes.push('ortak savaş hedefi: '+X);
    await synced(Ap);await wait(Ap,([x,s])=>!!(G.emps[s]&&G.emps[s].war&&G.emps[s].war[x]),[loc(A,X),loc(A,2)]);
    v=await motion('military','joinWar:'+loc(A,X)+':'+loc(A,2),'joinWar');assert.equal(v.motion,'joinWar');
    const d=await H.evaluate(f=>Object.values(fedOf(f).decisions||{}).find(d=>d.kind==='joinWar'&&d.state==='ready')||null,fid);
    assert(d,'joinWar motion accepted by the engine vote (ready decision)');
    /* FİKSTÜR (açıkça): motorun aiFedHelp kapısı katılımcının hedefi ŞU AN görmesini ister (aiKnownSystems: AI istihbarat kaydı ya da
       explorationContext görüşü; insanın AI kaydı yok). A'nın silahlı bir filosu hedefin A'ya en yakın sistemine komşu sisteme konur
       (f.sys — motorun alanı). Uygulama kararı yine motorun executeFedDecision'ı. */
    metrics.notes.push('fedHelp fikstürü: '+JSON.stringify(await H.evaluate(([a,x])=>{const me=G.emps[a],home=G.sys[me.home];
      const tgt=G.sys.filter(s=>s.owner===x).sort((p,q)=>dist(home,p)-dist(home,q))[0];const adj=tgt&&tgt.lanes.map(i=>G.sys[i]).filter(s=>s.owner!==x).sort((p,q)=>dist(home,p)-dist(home,q))[0];
      const fl=G.fleets.find(f=>f.e===a&&f.ships.length&&isArmed(f));if(!fl||!adj)return {fl:!!fl,adj:!!adj};fl.sys=adj.id;fl.mv=null;AI_VIEW_CACHE.delete(me);
      MP1Host.host.publish();return {fleet:fl.id,at:adj.id,help:aiFedHelp(me,G.emps[x],true)};},[A,X])));
    await closeAll(Ap);await synced(Ap);await Ap.evaluate(()=>UI.openFed());await tapIn(Ap,'#diploPane [data-a="fedTab"][data-x="military"]');
    await tapIn(Ap,'#diploPane [data-a="fedExecute"][data-x="'+fid+':'+d.id+'"]').catch(async e=>{throw Error('fedExecute button: host '+JSON.stringify(await H.evaluate(([f,id])=>({d:fedOf(f).decisions[id],day:G.day,speed:G.speed}),[fid,d.id]))+' A '+
      JSON.stringify(await Ap.evaluate(()=>({decs:(findFed(G.p)||{}).decisions,day:G.day,btns:[...document.querySelectorAll('#diploPane [data-a]')].map(b=>b.dataset.a).slice(0,40)}))).slice(0,900));});
    await hostWait(([f,id])=>{const x=fedOf(f).decisions[id];return x&&x.state!=='ready';},[fid,d.id],'fedExecute');
    const dx=await H.evaluate(([f,id])=>fedOf(f).decisions[id],[fid,d.id]);metrics.notes.push('ortak savaş kararı: '+JSON.stringify(dx).slice(0,240));
    assert.equal(dx.state,'applied','engine executeFedDecision applied the decision');assert(dx.joined.includes(A),'A joined the war through the engine');
    assert(await H.evaluate(([a,x])=>!!G.emps[a].war[x],[A,X]),'host: A at war with the target');
    await wait(Ap,()=>(MP1Join.game.view.log||[]).some(n=>/Federasyon savaş kararı uygulandı/.test(n.m)));await shot(Ap,'f1-a-executed');await closeAll(Ap);
  });

  await test('sayfa hataları yok (host, B, C, A)',async()=>{assert.deepEqual(errors,[]);});
}catch(e){console.log('FATAL',e);results.push({name:'FATAL',status:'FAIL',error:String(e&&e.stack||e)});}
finally{
  const pass=results.filter(r=>r.status==='PASS').length,fail=results.filter(r=>r.status==='FAIL').length;
  fs.writeFileSync(path.join(out,'mp64-results.json'),JSON.stringify({results,metrics,errors},null,1));
  console.log('GEÇEN: '+pass+' KALAN: '+fail);
  for(const b of [bH,bB,bC,bA])try{await b.close();}catch{}
  try{if(relay)relay.shutdown('test-end');}catch{}
  process.exit(fail?1:0);
}})();
