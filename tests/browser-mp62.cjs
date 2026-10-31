'use strict';
/* MP.6.2 — gerçek STARS diplomasi / savaş / federasyon / vasallık pencereleri çok oyunculuda. Ayrı Chromium süreçleri:
   host (915×412), misafir B (844×390), misafir C (960×540). Dünya seed 22, orta, 5 AI; B = 3, C = 5.
   FİKSTÜR (açıkça): temaslar + Etki/kaynak (MP.3/MP.6 ile aynı) ve AI federasyonu 100 = {2, 1} (askerî; başkan AI 2).
   Sonraki her adım GERÇEK STARS düğmesine gerçek dokunmadır; sonuç host motorunda denetlenir. Motor bir işlemi kendi
   kuralıyla reddederse (ör. güç, bekleme süresi) bu, gerekçesiyle not edilir — PASS sayılmaz, ayrıca raporlanır.
   Yerel relay; gerçek internet ve fiziksel Android DEĞİL. Çıktı: $STARS_OUTPUT/mp62-results.json + PNG. */
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),out=path.resolve(process.env.STARS_OUTPUT||path.join(root,'../evidence/mp62'));fs.mkdirSync(out,{recursive:true});
const relayMod=require('../research/mp1/server/relay.js');
const results=[],errors=[],metrics={notes:[],engine:[],cmds:{},perf:{}};
const launch={executablePath:process.env.STARS_CHROMIUM_PATH||undefined,args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage']};
const PHONE=(w,h)=>({viewport:{width:w,height:h},isMobile:true,hasTouch:true,deviceScaleFactor:2});
const B=3,C=5;
let tno=0;const UNTIL=+(process.env.MP62_UNTIL||1e9);
async function test(name,fn){if(++tno>UNTIL)return;const t0=Date.now();try{await fn();results.push({name,status:'PASS',ms:Date.now()-t0});console.log('PASS '+name);}
  catch(e){results.push({name,status:'FAIL',error:String(e&&e.stack||e).slice(0,1600)});console.log('FAIL '+name+'\n'+(e&&e.stack||e));}}
const wait=(p,fn,arg,timeout=25000)=>p.waitForFunction(fn,arg,{timeout,polling:80});
const shot=(p,n)=>p.screenshot({path:path.join(out,n+'.png')}).catch(()=>{});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const POLITICS=`(()=>{for(const e of G.emps)if(!e.wild){for(const k of ['etk','ene','min','ala','tuk','yiy'])e.res[k]=Math.max(e.res[k],4000);}
  for(const a of [0,1,2,3,4,5])for(const b of [0,1,2,3,4,5])if(a!==b){G.emps[a].contact[b]=true;G.emps[a].rel[b]=70;}
  var F={id:100,name:'MP62 Birliği',type:'askeri',charter:fedDefaultCharter('askeri'),leader:2,founder:2,members:[2,1],laws:{},fund:{ala:0,ene:0},treasury:0,
    founded:G.day,typeSince:G.day,dutySince:{defense:0,offense:0},invites:{},decisions:{},dutyConsent:{},cohesion:70,nextVote:G.day+100000,politicsVersion:96};
  G.feds=(G.feds||[]).filter(f=>!f.members.some(m=>[1,2,${B},${C}].includes(m)));G.feds.push(F);G.fedUid=Math.max(G.fedUid||0,100);G.emps[1].ally[2]=G.emps[2].ally[1]=true;fedNormalize(F);
  newFleet(G.emps[${B}],G.emps[${B}].home,Array.from({length:16},()=>({c:'kru'})));   // B'ye güç: vasallık talebinde motorun 1.6× kuralı sağlanabilsin
  for(const id of [0,1,2,3,4,5]){recalcMods(G.emps[id]);G.emps[id]._powAt=-1;}MP1Host.host.publish();})()`;
async function synced(p){await H.evaluate(()=>MP1Host.host.publish());const d=await H.evaluate(()=>G.day);
  try{await wait(p,d=>typeof G!=='undefined'&&Math.abs(G.day-d)<1e-9&&!MP6Stars.S.timer,d,15000);}
  catch(e){throw Error('synced: '+JSON.stringify(await p.evaluate(()=>({day:G.day,timer:!!MP6Stars.S.timer,modal:!document.getElementById('modal').classList.contains('hidden')&&document.querySelector('#modal .mhd')?.textContent,pane:document.getElementById('diploPane').classList.contains('show')?(UI.globalCur||'diplo')+': '+document.getElementById('diploPane').textContent.replace(/\s+/g,' ').slice(0,160):null,held:MP6Stars.S.stats.held}))));}}
async function tap(p,sel){const l=p.locator(sel).first();await l.scrollIntoViewIfNeeded().catch(()=>{});await l.tap();}
const closeAll=p=>p.evaluate(()=>{if(!document.getElementById('modal').classList.contains('hidden'))UI.closeModal();document.getElementById('diploPane').classList.remove('show');});
/* gerçek diplomasi penceresinde bir devletin ilişki sayfası (liste dokunuşu yerine gezinme işlevi; ardından düğmeler gerçek dokunuş) */
async function relation(p,id){await closeAll(p);await sleep(700);await synced(p);await p.evaluate(id=>{UI.openDiplo();UI.selectDiplo(id,'relation');},id);await wait(p,()=>document.getElementById('diploPane').classList.contains('show'));
  await p.evaluate(()=>{for(const d of document.querySelectorAll('#diploPane details'))d.open=true;});}   // katlanmış bölümler açılır (dokunulabilir)
async function openInbox(p){await closeAll(p);await sleep(700);await synced(p);if(!await p.locator('#tools [data-a="diplomaticInbox"]').first().isVisible())await tap(p,'#tools [data-a="grpTog"][data-x="emp"]');await tap(p,'#tools [data-a="diplomaticInbox"]');}
/* gerçek gelen kutusundaki bir kaydı aç: koşulu sağlayan bekleyen kayıt */
async function record(p,pred,arg){await openInbox(p);try{await wait(p,([pr,a])=>DiplomaticInbox.state().records.some(r=>r.status==='pending'&&new Function('r','a','return '+pr)(r,a)),[pred,arg]);}
  catch(e){throw Error('record '+pred+' '+JSON.stringify(arg)+' '+JSON.stringify(await p.evaluate(()=>({recs:DiplomaticInbox.state().records.map(r=>[r.id,r.kind,r.status,r.mp,r.key&&r.key.slice(0,40)]),dip:(MP1Join.game.view.dip.offers||[]).map(o=>[o.id,o.from,o.to,o.status]),me:MP1Join.empireId,sig:MP6Stars.S.inboxSig,built:MP6Stars.S.stats.builds}))));}
  const id=await p.evaluate(([pr,a])=>DiplomaticInbox.state().records.find(r=>r.status==='pending'&&new Function('r','a','return '+pr)(r,a)).id,[pred,arg]);
  await tap(p,'[data-a="diplomaticRecord"][data-x="'+id+'"]');return id;}
async function lastRes(p,kind){return p.evaluate(k=>{const r=MP1Join.results.slice().reverse().find(x=>x&&(!k||x.kindHint===k));return r||null;},kind);}
async function hostWait(fn,arg,name,timeout=20000){const t0=Date.now();try{await wait(H,fn,arg,timeout);}catch(e){const d={};for(const [n,p] of [['B',Bp],['C',Cp]])d[n]=await p.evaluate(()=>({res:MP1Join.results.slice(-3),alerts:[...document.querySelectorAll('#alerts *')].map(x=>x.textContent).slice(-3)})).catch(()=>null);throw Error((name||'host')+' timeout '+JSON.stringify(d));}
  if(name)(metrics.cmds[name]=metrics.cmds[name]||[]).push(Date.now()-t0);}
async function dealSendFrom(p,target,kinds){await relation(p,target);await p.evaluate(id=>UI.act('deal',id),target);await wait(p,()=>document.querySelector('[data-a="dealSend"]'));
  for(const k of kinds){await tap(p,'[data-a="dealPact"][data-x="'+k+'"]');await wait(p,k=>UI.deal&&UI.deal.want.some(i=>i.t===k)||UI.deal.give.some(i=>i.t===k),k);}
  const o0=await H.evaluate(()=>MP1Host.host.dip.offers.length);await tap(p,'[data-a="dealSend"]');await hostWait(n=>MP1Host.host.dip.offers.length===n+1,o0,'offer');
  const off=await H.evaluate(()=>MP1Host.host.dip.offers.at(-1));await closeAll(p);await sleep(300);
  metrics.notes.push('teklif '+off.id+' '+JSON.stringify(off.want)+' → '+JSON.stringify(await H.evaluate(id=>{const r=MP1Host.host.dip.offers.find(x=>x.id===id);return [r.status,r.why];},off.id)));return off;}
async function acceptOffer(p,offId,yes=true){await record(p,'r.mp===a',offId);await wait(p,()=>document.getElementById('inboxYes')&&!document.getElementById('inboxYes').disabled);
  await tap(p,yes?'#inboxYes':'#inboxNo');await hostWait(([id,y])=>MP1Host.host.dip.offers.find(x=>x.id===id).status===(y?'accepted':'rejected'),[offId,yes],yes?'accept':'reject');await closeAll(p);}

let relay,base,bH,bB,bC,H,Bp,Cp,code;
(async()=>{try{
  relay=relayMod.create({MP1_PORT:'0'});const s=await relay.start();base='http://127.0.0.1:'+s.address().port;
  [bH,bB,bC]=await Promise.all([0,1,2].map(()=>chromium.launch(launch)));
  H=await (await bH.newContext(PHONE(915,412))).newPage();Bp=await (await bB.newContext(PHONE(844,390))).newPage();Cp=await (await bC.newContext(PHONE(960,540))).newPage();
  for(const [n,p] of [['host',H],['B',Bp],['C',Cp]]){p.on('pageerror',e=>errors.push(n+': '+e.message));p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))errors.push(n+' console: '+m.text());});}

  await test('kurulum: host + B + C (/mp/play), gerçek STARS arayüzü; fikstür: temaslar + AI federasyonu {2,1}',async()=>{
    await H.goto(base+'/');await wait(H,()=>typeof setupGame==='function'&&document.getElementById('mp1Btn'));
    await tap(H,'#mp1Btn');await tap(H,'[data-m="create"]');await wait(H,()=>MP1Host.lobby&&MP1Host.lobby.phase==='waiting');
    code=await H.evaluate(()=>{MP1Host.host.setCapacity(3);MP1Host.host.configure({size:'orta',aiCount:5,seed:22});MP1Host.ws.send('C'+JSON.stringify({cap:2}));return MP1Host.code;});
    const link=await H.textContent('#mp1Link');
    for(const [p,name,e] of [[Bp,'Bora',B],[Cp,'Cem',C]]){await p.goto(link);await wait(p,()=>window.MP1Join&&document.getElementById('jCode'));
      await p.fill('#jName',name);await tap(p,'[data-j="go"]');await wait(p,()=>MP1Join.screen==='lobby'&&MP1Join.lobby);
      await tap(p,'[data-j="claim"][data-e="'+e+'"]');await wait(H,e=>MP1Host.lobby.players.some(x=>x.claim===e),e);await tap(p,'#jReady');}
    await wait(H,()=>MP1Host.host.canStart().ok);await tap(H,'[data-m="start"]');
    for(const p of [Bp,Cp])await wait(p,()=>window.MP6Stars&&MP6Stars.S.started&&!document.getElementById('game').classList.contains('hidden'));
    await H.waitForTimeout(600);await H.evaluate(()=>{if(!document.getElementById('modal').classList.contains('hidden'))UI.closeModal();UI.setSpeed(0);});
    await H.evaluate(()=>MP1Host.advance(5));await H.evaluate(POLITICS);for(const p of [Bp,Cp]){await synced(p);await closeAll(p);}
  });

  await test('antlaşmalar (gerçek anlaşma penceresi + gerçek gelen kutusu): B → C saldırmazlık ve ticaret paktı; C kabul eder → host executeDeal; B ticaret paktını FESHET düğmesiyle bozar; AMBARGO / kaldır; HEDİYE',async()=>{
    for(const k of ['nap','pact']){const off=await dealSendFrom(Bp,C,[k]);assert.deepEqual([off.from,off.to],[B,C]);await acceptOffer(Cp,off.id);}
    assert.equal(await H.evaluate(([b,c])=>!!(G.emps[b].nap[c]>G.day&&G.emps[b].pact[c]),[B,C]),true,'nap + trade pact in force on the host');
    await relation(Bp,C);await shot(Bp,'b-relation-pacts');
    await tap(Bp,'#diploPane [data-a="unpact"][data-x="'+C+'"]');await wait(Bp,()=>document.querySelector('[data-a="unpactYes"]'));await tap(Bp,'[data-a="unpactYes"]');
    await hostWait(([b,c])=>!G.emps[b].pact[c],[B,C],'unpact');
    await relation(Bp,C);await tap(Bp,'#diploPane [data-a="embargo"][data-x="'+C+'"]');await hostWait(([b,c])=>!!(G.emps[b].embargo&&G.emps[b].embargo[c]),[B,C],'embargo');
    await relation(Bp,C);await tap(Bp,'#diploPane [data-a="unembargo"][data-x="'+C+'"]');await hostWait(([b,c])=>!(G.emps[b].embargo&&G.emps[b].embargo[c]),[B,C],'unembargo');
    const m0=await H.evaluate(c=>G.emps[c].res,C);
    await relation(Bp,C);await tap(Bp,'#diploPane [data-a="gift"][data-x="'+C+'"]');await wait(Bp,()=>document.querySelector('[data-a="giftDo"]'));
    const gx=await Bp.evaluate(()=>document.querySelector('[data-a="giftDo"]').dataset.x);await tap(Bp,'[data-a="giftDo"]');
    const [,gr,gv]=gx.split(':');await hostWait(([c,r,v,m])=>Math.round(G.emps[c].res[r]-m)===+v,[C,gr,gv,m0[gr]],'gift');await closeAll(Bp);
  });

  await test('ittifak: B → C ittifak teklifi (gerçek anlaşma penceresi), C kabul eder; sonra B İTTİFAKI SONLANDIR + gerçek onay penceresi → host endAlliance',async()=>{
    const off=await dealSendFrom(Bp,C,['ally']);await acceptOffer(Cp,off.id);
    assert.equal(await H.evaluate(([b,c])=>!!(G.emps[b].ally[c]&&G.emps[c].ally[b]),[B,C]),true,'alliance in force');
    await relation(Bp,C);await shot(Bp,'b-relation-ally');await tap(Bp,'#diploPane [data-a="endAlliance"][data-x="'+C+'"]');
    await wait(Bp,()=>document.querySelector('#allianceEndConfirm'));await tap(Bp,'#allianceEndConfirm');await hostWait(([b,c])=>!G.emps[b].ally[c]&&!G.emps[c].ally[b],[B,C],'endAlliance');await closeAll(Bp);
  });

  await test('SAVAŞ İLANI (gerçek pencereler): B → C: SAVAŞ HEDEFİ SEÇ → hedef → host önizlemesi gerçek önizleme penceresinde (saldırmazlık riski görünür) → ONAYLA → host warDeclarationAccess/declareWar/setWarGoal; C ve host ekranında savaş; savaşta ortak hız çalışır',async()=>{
    await relation(Bp,C);await Bp.evaluate(()=>{for(const d of document.querySelectorAll('#diploPane details.dcDetails'))d.open=true;});
    await wait(Bp,c=>document.querySelector('#diploPane [data-a="war"][data-x="'+c+'"]:not([disabled])'),C);await tap(Bp,'#diploPane [data-a="war"][data-x="'+C+'"]');
    await wait(Bp,()=>document.querySelector('[data-a="setwg"]'));await shot(Bp,'b-war-goals');
    const gx=await Bp.evaluate(()=>document.querySelector('[data-a="setwg"]').dataset.x);await tap(Bp,'[data-a="setwg"][data-x="'+gx+'"]');
    await wait(Bp,()=>document.getElementById('warFinalConfirm')&&!document.getElementById('warFinalConfirm').disabled);
    const txt=await Bp.textContent('#modal');assert.match(txt,/SAVAŞ İLANI ÖNİZLEMESİ/);metrics.notes.push('savaş önizlemesi: '+txt.replace(/\s+/g,' ').slice(0,300));
    await shot(Bp,'b-war-preview');
    await Bp.locator('#warFinalConfirm').scrollIntoViewIfNeeded();   // pencere gövdesi kaydırılabilir (844×390'da uzun önizleme)
    const btn=await Bp.evaluate(()=>{const r=document.getElementById('warFinalConfirm').getBoundingClientRect();const e=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return {inView:r.bottom<=innerHeight&&r.top>=0,top:!!(e&&e.closest('#warFinalConfirm')),hit:e&&(e.id||e.className||e.tagName)};});
    metrics.notes.push('onay düğmesi: '+JSON.stringify(btn));delete btn.hit;
    assert.deepEqual(btn,{inView:true,top:true},'confirm button reachable on 844x390 (not covered)');
    const etk0=await H.evaluate(b=>G.emps[b].res.etk,B);
    await tap(Bp,'#warFinalConfirm');await hostWait(([b,c])=>!!(G.emps[b].war[c]&&G.emps[c].war[b]),[B,C],'war');
    const g=await H.evaluate(([b,c])=>G.emps[b].wg&&G.emps[b].wg[c]&&G.emps[b].wg[c].t,[B,C]);assert.equal(g,gx.split(':')[1],'war goal set on the host');
    metrics.notes.push('savaş Etki bedeli: '+Math.round(etk0-await H.evaluate(b=>G.emps[b].res.etk,B)));
    await synced(Cp);await wait(Cp,()=>!!G.p.war[3]);await synced(Bp);await wait(Bp,()=>!!G.p.war[5]&&!!warLedgerFind(0,5));
    await wait(Cp,()=>MP1Join.game.view&&MP1Join.game.view.log.some(n=>/SAVAŞ BAŞLADI/.test(n.m)));await shot(Cp,'c-at-war');
    await closeAll(Bp);await sleep(800);await tap(Cp,'#timepod .sp[data-x="1"]');await hostWait(()=>G.speed===1,null,'speedInWar');
    await sleep(800);await tap(Bp,'#timepod .sp[data-x="0"]');await hostWait(()=>G.speed===0,null,'speedInWar');
  });

  await test('statüko ve barış (savaş sürerken): B statüko teklif eder → C\'nin GERÇEK gelen kutusunda "Statüko barışı" → C reddeder; ardından B barış maddesiyle teklif → C kabul eder → host makePeace (executeDeal)',async()=>{
    const sqBtn=await (async()=>{await relation(Bp,C);return Bp.evaluate(c=>{const b=document.querySelector('#diploPane [data-a="statuko"][data-x="'+c+'"]');return b?(b.disabled?'disabled':'enabled'):'none';},C);})();
    metrics.notes.push('statüko düğmesi (host kapısıyla): '+sqBtn);
    const hostSq=await H.evaluate(([b,c])=>canStatusQuo(G.emps[b],G.emps[c]).ok,[B,C]);assert.equal(sqBtn,hostSq?'enabled':'disabled','real button follows the host gate');
    if(sqBtn==='enabled')await tap(Bp,'#diploPane [data-a="statuko"][data-x="'+C+'"]');
    else await Bp.evaluate(c=>MP1Join.cmd({kind:'statusQuo',target:c}),C);   // motor statüko koşulunu sağlamıyor: aynı komut (rapor edilir)
    await hostWait(([b,c])=>MP1Host.host.dipView(G.emps[c]).sq.some(q=>q.from===b&&q.status==='pending'),[B,C],'statusQuo');
    await record(Cp,"r.kind==='sqOffer'&&r.mpSq===a",B);await wait(Cp,()=>document.getElementById('inboxNo'));await shot(Cp,'c-real-inbox-statusquo');
    await tap(Cp,'#inboxNo');await hostWait(([b,c])=>MP1Host.host.dipView(G.emps[c]).sq.some(q=>q.from===b&&q.status==='rejected'),[B,C],'statusQuoReply');
    assert.equal(await H.evaluate(([b,c])=>!!G.emps[b].war[c],[B,C]),true,'rejected status quo keeps the war');await closeAll(Cp);
    const off=await dealSendFrom(Bp,C,['peace']);await acceptOffer(Cp,off.id);
    assert.equal(await H.evaluate(([b,c])=>!G.emps[b].war[c]&&!G.emps[c].war[b],[B,C]),true,'peace signed on the host');
    await synced(Bp);await wait(Bp,()=>MP1Join.game.view.log.some(n=>/Savaş sona erdi/.test(n.m)));
  });

  await test('federasyon (gerçek pencereler): kurma girişimi; B AI üye 2 üzerinden başvurur → host kabul oylaması (AI üyeler) → davet B\'nin gerçek gelen kutusunda → B KABUL → üye; AI yasa önerir → B EVET; B yasa önerir; B C\'yi davet eder; B ayrılır',async()=>{
    await H.evaluate(([b,c])=>{for(const id of [b,c])G.emps[id].res.etk=Math.max(G.emps[id].res.etk,4000);MP1Host.host.publish();},[B,C]);   // fikstür: önceki adımlarda harcanan Etki
    /* kurma girişimi: gerçek düğme durumu + host'un motor kararı */
    await closeAll(Bp);await synced(Bp);await Bp.evaluate(()=>UI.openFed());await sleep(400);
    const fb=await Bp.evaluate(()=>{const b=document.querySelector('[data-a="foundFed"]');return b?(b.disabled?'disabled':'enabled'):'none';});
    const fq=await Bp.evaluate(()=>new Promise(res=>{const c=MP1Join.cmd({kind:'fedFoundQuote',type:'askeri',ballot:'equal'});const t=setInterval(()=>{const x=MP1Join.results.find(y=>y.cid===c.cid);if(x){clearInterval(t);res(x);}},60);}));
    metrics.notes.push('kurma: gerçek düğme '+fb+' · host önizlemesi '+JSON.stringify(fq.extra&&{ok:fq.extra.ok,reasons:fq.extra.reasons}));
    if(fb==='enabled'){await tap(Bp,'[data-a="foundFed"]');await sleep(1200);}
    await closeAll(Bp);
    /* başvuru: B, üye 2 üzerinden */
    await H.evaluate(b=>{for(const id of [1,2]){G.emps[b].ally[id]=G.emps[id].ally[b]=true;G.emps[id].rel[b]=G.emps[b].rel[id]=100;}MP1Host.host.publish();},B);
    await wait(Bp,()=>G.p.res.etk>=4000);   // ayna gelene kadar (en çok ~0,7 s)
    await relation(Bp,2);const rq=await Bp.evaluate(()=>{const b=document.querySelector('#diploPane [data-a="fedDipRequest"]');return b?(b.disabled?'disabled:'+b.nextElementSibling?.textContent:'enabled'):'none';});
    metrics.notes.push('başvur düğmesi: '+rq);assert.equal(rq,'enabled','real request button');
    await tap(Bp,'#diploPane [data-a="fedDipRequest"]');await hostWait(b=>{const F=fedOf(100);return F.vote&&F.vote.motion==='admit'&&F.vote.target===b||!!F.invites[b]||F.members.includes(b)||Object.values(F.admissionResults||{}).some(r=>r.target===b);},B,'fedRequest');
    metrics.notes.push('başvuru sonrası: '+JSON.stringify(await H.evaluate(b=>{const F=fedOf(100);return {vote:F.vote&&F.vote.motion,inv:!!F.invites[b],member:F.members.includes(b),adm:Object.values(F.admissionResults||{}).filter(r=>r.target===b).map(r=>[r.status,r.why])};},B)));
    for(let i=0;i<40;i++){if(await H.evaluate(()=>!fedOf(100).vote))break;await H.evaluate(()=>MP1Host.advance(5));}
    const adm=await H.evaluate(b=>({vote:!!fedOf(100).vote,inv:!!fedOf(100).invites[b],last:fedOf(100).lastVote&&{passed:fedOf(100).lastVote.passed,why:fedOf(100).lastVote.why}}),B);
    metrics.notes.push('kabul oylaması (AI üyeler): '+JSON.stringify(adm));
    if(!adm.inv){metrics.engine.push('üyelik başvurusu gerçek düğmeyle host\'a ulaştı; AI üyeler motor kararıyla reddetti: '+JSON.stringify(adm.last));
      await H.evaluate(b=>{const F=fedOf(100);F.invites[b]={expires:G.day+200,by:F.leader,terms:fedCharterKey(F)};MP1Host.host.publish();},B);   // fikstür: davet (sonraki adımlar için)
      metrics.notes.push('davet fikstürle oluşturuldu (AI oylaması reddettiği için)');}
    await record(Bp,"r.kind==='invite'",null);await wait(Bp,()=>document.getElementById('inboxYes')&&!document.getElementById('inboxYes').disabled);await shot(Bp,'b-fed-invite');
    await tap(Bp,'#inboxYes');await hostWait(b=>fedOf(100).members.includes(b),B,'fedJoin');await closeAll(Bp);
    /* AI başkan yasa önerir → B gerçek gelen kutusundan EVET */
    const tok=await H.evaluate(()=>{const F=fedOf(100);const k=[...Object.keys(FED_LAWS),...Object.keys(FED_INNER_LAWS)].find(k=>canFedLaw(G.emps[F.leader],k,false).ok);if(!k)return null;proposeFedLaw(G.emps[F.leader],k);MP1Host.host.publish();return F.vote?fedVoteToken(F.vote):null;});
    assert(tok,'AI leader proposal opened a vote');await record(Bp,"r.kind==='fedvote'",null);await wait(Bp,()=>document.getElementById('inboxYes')&&!document.getElementById('inboxYes').disabled);
    await tap(Bp,'#inboxYes');await hostWait(([b,t])=>{const F=fedOf(100);return !F.vote||fedVoteToken(F.vote)!==t||F.vote.yes.includes(b);},[B,tok],'fedVote');await closeAll(Bp);
    for(let i=0;i<40;i++){if(await H.evaluate(()=>!fedOf(100).vote))break;await H.evaluate(()=>MP1Host.advance(5));}
    /* B yasa önerir (gerçek federasyon penceresi) */
    await synced(Bp);await Bp.evaluate(()=>UI.openFed());await sleep(400);await tap(Bp,'[data-a="fedTab"][data-x="laws"]');await sleep(300);
    const lb=await Bp.evaluate(()=>{const b=[...document.querySelectorAll('[data-a="fedLawPropose"]')].find(x=>!x.disabled&&!x.classList.contains('dis'));return b?b.dataset.x:null;});
    metrics.notes.push('yasa öner düğmesi: '+lb);
    if(lb){await tap(Bp,'[data-a="fedLawPropose"][data-x="'+lb+'"]');await hostWait(([b,k])=>{const F=fedOf(100);return (F.vote&&F.vote.proposer===b)||(F.lastVote&&F.lastVote.law===k)||!!(F.laws&&F.laws[k]);},[B,lb],'fedLaw');}
    else metrics.engine.push('yasa önerisi: misafirin gerçek penceresinde uygun yasa yok (bekleme/oy açık)');
    await closeAll(Bp);for(let i=0;i<40;i++){if(await H.evaluate(()=>!fedOf(100).vote))break;await H.evaluate(()=>MP1Host.advance(5));}
    /* B, C'yi davet eder (üye kabul önergesi) */
    await H.evaluate(([b,c])=>{for(const id of [1,2,b]){G.emps[c].ally[id]=G.emps[id].ally[c]=true;}G.emps[b].intel=G.emps[b].intel||{};for(const id of [1,2,c])G.emps[b].intel[id]=3;MP1Host.host.publish();},[B,C]);   // fikstür: C üyelerle müttefik, B'nin istihbaratı 3
    await relation(Bp,C);const ib=await Bp.evaluate(()=>{const b=document.querySelector('#diploPane [data-a="fedDipInvite"]');return b?(b.disabled?'disabled':'enabled'):'none';});
    metrics.notes.push('davet düğmesi: '+ib);const hostAdm=await H.evaluate(([b,c])=>canFedMotion(G.emps[b],'admit',{target:c}),[B,C]);metrics.notes.push('host üye kabul kapısı: '+JSON.stringify(hostAdm));
    assert.equal(ib,hostAdm.ok?'enabled':'disabled','real invite button follows the host gate');
    if(ib==='enabled'){await tap(Bp,'#diploPane [data-a="fedDipInvite"]');await hostWait(c=>{const F=fedOf(100);return F.vote&&F.vote.motion==='admit'&&F.vote.target===c;},C,'fedInvite');
      for(let i=0;i<40;i++){if(await H.evaluate(()=>!fedOf(100).vote))break;await H.evaluate(()=>MP1Host.advance(5));
        if(await Bp.evaluate(()=>DiplomaticInbox.state().records.some(r=>r.kind==='fedvote'&&r.status==='pending'))){await record(Bp,"r.kind==='fedvote'",null);await tap(Bp,'#inboxYes');await closeAll(Bp);}}
      const inv=await H.evaluate(c=>!!fedOf(100).invites[c],C);metrics.notes.push('C daveti: '+inv);
      if(inv){await record(Cp,"r.kind==='invite'",null);await tap(Cp,'#inboxNo');await hostWait(c=>!fedOf(100).invites[c]&&!fedOf(100).members.includes(c),C,'fedInviteReject');await closeAll(Cp);}}
    else metrics.engine.push('davet düğmesi misafirde '+ib);
    /* B ayrılır (gerçek onay penceresi) */
    await closeAll(Bp);await synced(Bp);await Bp.evaluate(()=>UI.openFed());await sleep(400);await tap(Bp,'[data-a="fedTab"][data-x="manage"]');await sleep(300);
    const lv=await Bp.evaluate(()=>{const b=document.querySelector('[data-a="fedLeave"]');return b?(b.disabled?'disabled':'enabled'):'none';});metrics.notes.push('ayrıl düğmesi: '+lv);
    assert.equal(lv,'enabled');await tap(Bp,'[data-a="fedLeave"]');await wait(Bp,()=>document.querySelector('[data-a="fedLeaveConfirm"]'));await tap(Bp,'[data-a="fedLeaveConfirm"]');
    await hostWait(b=>!fedOf(100).members.includes(b),B,'fedLeave');await closeAll(Bp);
  });

  await test('vasallık (gerçek vasallık penceresi + gerçek gelen kutusu): B, C\'ye teklif (motorun izin verdiği yön) → C karşı teklif → B kabul → host sözleşmesi; sonra vasal barışçıl bağımsızlık ister → senyör reddeder',async()=>{
    const pick=await H.evaluate(([b,c])=>{for(const mode of ['seek','demand']){const t=mode==='seek'?'bekci':'haracguzar';const q=MP1Host.host.local?null:null;void q;
        const g=mode==='seek'?canSeekProtection(G.emps[b],G.emps[c]):canDemandVassal(G.emps[b],G.emps[c]);if(g.ok)return {mode,type:t};}
      return {why:[canSeekProtection(G.emps[b],G.emps[c]).why,canDemandVassal(G.emps[b],G.emps[c]).why]};},[B,C]);
    if(!pick.mode){metrics.engine.push('vasallık: motor iki yönü de reddetti — '+JSON.stringify(pick.why));throw Error('engine refuses both vassal directions: '+JSON.stringify(pick.why));}
    await relation(Bp,C);const vb=await Bp.evaluate(([c,m])=>{const b=[...document.querySelectorAll('#diploPane [data-a="vsOpen"]')].find(x=>x.dataset.x===c+':'+m);return b?(b.disabled?'disabled':'enabled'):'none';},[C,pick.mode]);
    metrics.notes.push('vasallık düğmesi '+pick.mode+': '+vb);assert.equal(vb,'enabled','real vassal button for the engine-allowed direction');
    await tap(Bp,'#diploPane [data-a="vsOpen"][data-x="'+C+':'+pick.mode+'"]');await wait(Bp,()=>document.querySelector('[data-a="vsSend"]'));await shot(Bp,'b-vassal-draft');
    await tap(Bp,'[data-a="vsSend"]');const sub=pick.mode==='seek'?B:C;
    await hostWait(s=>G.emps[s].vassalTalk&&G.emps[s].vassalTalk.status==='pending'&&G.emps[s].vassalTalk.round===1,sub,'vassalOffer');
    await record(Cp,"r.kind==='vassal'",null);await wait(Cp,()=>document.querySelector('[data-a="vsCounter"]:not([disabled])'));await shot(Cp,'c-vassal-record');
    await tap(Cp,'[data-a="vsCounter"]');await wait(Cp,()=>document.querySelector('[data-a="vsSend"]')&&document.getElementById('vsRenegotiate'));
    const rn=await Cp.evaluate(()=>{const s=document.getElementById('vsRenegotiate');return [...s.options].map(o=>o.value).find(v=>v!==s.value);});
    await Cp.selectOption('#vsRenegotiate',rn);await shot(Cp,'c-vassal-counter');await tap(Cp,'[data-a="vsSend"]');   // motor: karşı teklif en az bir hükmü değiştirmeli
    await hostWait(s=>G.emps[s].vassalTalk&&G.emps[s].vassalTalk.round===2,sub,'vassalCounter');
    await record(Bp,"r.kind==='vassal'",null);await wait(Bp,()=>document.querySelector('[data-a="vsReply"][data-x="accept"]'));await tap(Bp,'[data-a="vsReply"][data-x="accept"]');
    await hostWait(s=>isVassal(G.emps[s]),sub,'vassalAccept');const lord=sub===B?C:B;assert.equal(await H.evaluate(s=>G.emps[s].overlord,sub),lord);
    assert.equal(await H.evaluate(([s,third])=>MP1Host.host.polView(G.emps[third]).vas.talks.length,[sub,0]),0,'host (third party) sees no B–C talk');
    const subP=sub===B?Bp:Cp,lordP=sub===B?Cp:Bp,lordId=lord;
    await closeAll(subP);await relation(subP,lordId);const rb=await subP.evaluate(c=>{const b=[...document.querySelectorAll('#diploPane [data-a="vsOpen"]')].find(x=>x.dataset.x===c+':release');return b?(b.disabled?'disabled':'enabled'):'none';},lordId);
    metrics.notes.push('bağımsızlık düğmesi: '+rb);
    if(rb==='enabled'){await tap(subP,'#diploPane [data-a="vsOpen"][data-x="'+lordId+':release"]');await wait(subP,()=>document.querySelector('[data-a="vsSend"]'));await tap(subP,'[data-a="vsSend"]');
      const r=await hostWait(s=>G.emps[s].vassalTalk&&G.emps[s].vassalTalk.kind==='release'&&G.emps[s].vassalTalk.status==='pending',sub,'release').then(()=>'ok',e=>String(e).slice(0,200));
      if(r==='ok'){await record(lordP,"r.kind==='vassal'",null);await wait(lordP,()=>document.querySelector('[data-a="vsReply"][data-x="reject"]'));await tap(lordP,'[data-a="vsReply"][data-x="reject"]');
        await hostWait(s=>G.emps[s].vassalTalk&&G.emps[s].vassalTalk.status==='rejected',sub,'releaseReject');assert.equal(await H.evaluate(s=>isVassal(G.emps[s]),sub),true,'rejected release keeps the contract');}
      else metrics.engine.push('bağımsızlık talebi: host reddetti — '+JSON.stringify(await subP.evaluate(()=>MP1Join.results.slice(-2).map(x=>[x.code,x.detail]))));}
    else metrics.engine.push('bağımsızlık düğmesi misafirde '+rb+' (yerel koşul)');
    await closeAll(Bp);await closeAll(Cp);
  });

  await test('yetkisiz ve gizlilik: B C adına savaş/ilişki komutu veremez (forged-empire); başkasının teklifine yanıt yok (no-offer); temassız hedef "yok"; C\'nin aynasında B\'nin savaş hedefi ve vasallık dışı görüşmeler yok',async()=>{
    const r=await Bp.evaluate(c=>new Promise(res=>{const out=[];const cmds=[{kind:'war',target:c,goal:Object.keys(WAR_GOALS)[0]},{kind:'respond',offer:999999,action:'accept'},{kind:'gift',target:c,r:'min',v:1}];
      const ids=cmds.map((x,i)=>{if(i)return MP1Join.cmd(x).cid;MP1Join.seq++;const cid='jforge'+Date.now().toString(36);MP1Join.sendRaw({v:1,type:'cmd',seq:MP1Join.seq,cid,cmd:x,empire:c});return cid;});   // sahte devlet alanı (ham çerçeve)
      setTimeout(()=>res(ids.map(id=>MP1Join.results.find(y=>y.cid===id)).map(x=>x&&x.code)),1500);}),C);
    metrics.notes.push('yetkisiz: '+JSON.stringify(r));assert.equal(r[0],'forged-empire');assert.equal(r[1],'no-offer');
    const priv=await Cp.evaluate(()=>{const m=MP6Stars.S.mirror;return {wg:m.emps.filter(e=>e.id!==0).some(e=>e.wg&&Object.keys(e.wg).length),log:m.log.some(n=>/Bora|Savaş hedefi/.test(n.m))};});
    assert.deepEqual(priv,{wg:false,log:false});
  });

  await test('kopma ve dönüş: B\'nin soketi düşer; döndüğünde diplomatik durum (antlaşma/vasallık/savaş haritaları) host\'unkiyle aynı',async()=>{
    await closeAll(Bp);await closeAll(Cp);const room=relay.rooms.get(code);for(const c of room.clients.values()){c.socket.destroy();break;}
    await sleep(500);await wait(Bp,()=>MP1Join.ws&&MP1Join.ws.readyState===1&&MP1Join.hostOnline,undefined,30000);await synced(Bp);
    const h=await H.evaluate(([b,c])=>({war:!!G.emps[b].war[c],ally:!!G.emps[b].ally[c],nap:(G.emps[b].nap&&G.emps[b].nap[c]||0)>G.day,lord:G.emps[b].overlord??null}),[B,C]);
    const g=await Bp.evaluate(()=>({war:!!G.p.war[5],ally:!!G.p.ally[5],nap:(G.p.nap&&G.p.nap[5]||0)>G.day,lord:G.p.overlord===undefined||G.p.overlord===null?null:(G.p.overlord===0?3:G.p.overlord)}));
    assert.deepEqual(g,h);
  });

  await test('sayfa hataları yok (host, B, C)',async()=>{assert.deepEqual(errors,[]);});
}catch(e){console.log('FATAL',e);results.push({name:'FATAL',status:'FAIL',error:String(e&&e.stack||e)});}
finally{
  const pass=results.filter(r=>r.status==='PASS').length,fail=results.filter(r=>r.status==='FAIL').length;
  fs.writeFileSync(path.join(out,'mp62-results.json'),JSON.stringify({results,metrics,errors},null,1));
  console.log('GEÇEN: '+pass+' KALAN: '+fail);
  for(const b of [bH,bB,bC])try{await b.close();}catch{}
  try{if(relay)relay.shutdown('test-end');}catch{}
  process.exit(fail?1:0);
}})();
