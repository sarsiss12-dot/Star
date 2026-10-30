'use strict';
/* MP.3.1 — federasyon siyaseti ve vasallık sözleşmeleri, gerçek tarayıcılarda.
   Ayrı Chromium süreçleri: host telefon (yatay) + misafir A (390×844) + misafir B (360×800) + misafir C (412×915).
   Dünya: seed 22, orta, 5 AI; A=1, B=3, C=4 insan; AI 2 ve 5.
   FİKSTÜR (açıkça): siyasi başlangıç — karşılıklı temas, Etki, ittifaklar ve AI 5 başkanlığında {5, 2, B} federasyonu
   (tests/mp31_core_test.js ile aynı). Bundan sonraki her adım misafir arayüzünden gerçek dokunma ile yapılır; kararları
   host'un motoru (castFedVote, requestFederation, acceptFedInvite, leaveFederation, vassalOffer, vassalReply) uygular.
   Yerel relay; gerçek internet ve fiziksel Android değildir. Çıktı: $STARS_OUTPUT/mp31-results.json + PNG. */
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),out=path.resolve(process.env.STARS_OUTPUT||path.join(root,'../evidence/mp31'));fs.mkdirSync(out,{recursive:true});
const relayMod=require('../research/mp1/server/relay.js');
const results=[],errors=[],metrics={viewports:{},perf:{},latency:{},notes:[]};
const launch={executablePath:process.env.STARS_CHROMIUM_PATH||undefined,args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--enable-precise-memory-info']};
const PHONE=(w,h)=>({viewport:{width:w,height:h},isMobile:true,hasTouch:true,deviceScaleFactor:2});
let relay,base,bH,bA,bB,bC,H,A,B,C,code;const E={A:1,B:3,C:4,AI2:2,AI5:5};
const freeBar=p=>p.evaluate(()=>{const m=document.getElementById('modal');if(m&&!m.classList.contains('hidden')&&typeof UI!=='undefined'){const s=G.speed;UI.closeModal();UI.setSpeed(s);}});   // MP.6: açık STARS penceresi (danışman/olay) MP çubuğunun üstündedir; kapat, hızı koru
async function test(name,fn){const t0=Date.now();try{await fn();results.push({name,status:'PASS',ms:Date.now()-t0});console.log('PASS '+name);}
  catch(e){results.push({name,status:'FAIL',error:String(e&&e.stack||e).slice(0,1600)});console.log('FAIL '+name+'\n'+(e&&e.stack||e));}}
const wait=(p,fn,arg,timeout=20000)=>p.waitForFunction(fn,arg,{timeout,polling:50});
const shot=(p,n)=>p.screenshot({path:path.join(out,n+'.png')}).catch(()=>{});
const HS=()=>H.evaluate(()=>({s:JSON.stringify(JSON.parse(serialize()),(k,v)=>k[0]==='_'?undefined:v),r:RND_STATE}));
function sameState(x,y,msg){assert.equal(x.r,y.r,(msg||'state')+' rng');assert(x.s===y.s,(msg||'state')+' save');}
const POLITICS=`(()=>{
  for(const e of G.emps)if(!e.wild){for(const k of ['etk','ene','min','ala'])e.res[k]=Math.max(e.res[k],2000);}
  const pairs=[[0,1],[0,2],[0,3],[0,4],[0,5],[1,2],[1,3],[1,5],[2,3],[2,5],[3,5],[4,5],[2,4]];
  for(const [a,b] of pairs){G.emps[a].contact[b]=G.emps[b].contact[a]=true;G.emps[a].rel[b]=G.emps[b].rel[a]=60;}
  const F={id:100,name:'MP31 Test Birliği',type:'bilimsel',charter:fedDefaultCharter('bilimsel'),leader:5,founder:5,members:[5,2,3],laws:{},fund:{ala:0,ene:0},treasury:0,
    founded:G.day,typeSince:G.day,dutySince:{defense:0,offense:0},invites:{},decisions:{},dutyConsent:{},cohesion:70,nextVote:G.day+100000,politicsVersion:96};
  G.feds=[F];G.fedUid=100;for(const a of F.members)for(const b of F.members)if(a!==b)G.emps[a].ally[b]=true;fedNormalize(F);for(const id of F.members)recalcMods(G.emps[id]);
  MP1Host.host.publish();})()`;
const cdps=new Map();
async function touch(p,type,pts){let c=cdps.get(p);if(!c){c=await p.context().newCDPSession(p);cdps.set(p,c);}
  await c.send('Input.dispatchTouchEvent',{type,touchPoints:pts.map((q,i)=>({x:q.x,y:q.y,id:i+1,radiusX:4,radiusY:4,force:1}))});}
const nres=p=>p.evaluate(()=>MP1Join.results.length);
const F=()=>H.evaluate(()=>{const f=fedOf(100);return f&&JSON.parse(JSON.stringify({members:f.members,vote:f.vote,last:f.lastVote,invites:f.invites}));});
async function sync(p){const day=await H.evaluate(()=>Math.floor(G.day));await wait(p,d=>MP1Join.game.view&&MP1Join.game.view.pol&&MP1Join.game.clock&&MP1Join.game.clock.day===d,day);}
async function pub(){await H.evaluate(()=>MP1Host.host.publish());}

/* ---------- arayüz adımları ---------- */
async function seg(p,s){if(await p.locator('#mp3Sheet').count()){await p.locator('#mp3Sheet [data-s="no"]').tap();await p.waitForTimeout(450);}
  if(await p.evaluate(()=>MP2Game.G.tab!=='dip')){await p.locator('.mp2-nav [data-tab="dip"]').tap();await wait(p,()=>document.querySelector('#mp2Dip .mp31-seg'));}
  await p.locator(`[data-g2="dseg"][data-seg="${s}"]`).tap();await wait(p,s=>MP2Game.G.dseg===s&&document.querySelector(s==='trade'?'#mp2DipT .mp3':'#mp2DipP .mp31'),s);
  if(s!=='trade'&&await p.locator('#mp2DipP [data-p="vcancel"]').count())await p.locator('#mp2DipP [data-p="vcancel"]').tap();}
async function tab(p,kind,k,scope='#mp2DipP'){await p.locator(`${scope} [data-p="${kind}"][data-k="${k}"]`).tap();await wait(p,([s,kind,k])=>document.querySelector(`${s} [data-p="${kind}"][data-k="${k}"].on`),[scope,kind,k]);}
/* iki adımlı onay: pencere açılır, onay düğmesi ilk 450 ms kapalı, sonra dokunulur */
async function confirmSheet(p,guest=true){await wait(p,()=>document.getElementById('mp3Sheet'));
  assert.equal(await p.locator('#mp3Sheet [data-s="ok"]').isDisabled(),true,'confirm starts disabled');await wait(p,()=>!document.querySelector('#mp3Sheet [data-s="ok"]').disabled);
  const n=guest?await nres(p):0,t0=Date.now();await p.locator('#mp3Sheet [data-s="ok"]').tap();if(guest)await wait(p,n=>MP1Join.results.length>n,n);const ms=Date.now()-t0;
  await wait(p,()=>!document.getElementById('mp3Sheet'));await p.waitForTimeout(450);return guest?{...(await p.evaluate(()=>MP1Join.results.at(-1))),wall:ms}:null;}
async function raw(p,cmd,extra={}){const cid='x'+Math.random().toString(36).slice(2,12);
  await p.evaluate(([cmd,extra,cid])=>{const J=MP1Join;J.seq++;J.sendRaw({v:1,type:'cmd',seq:J.seq,cid,cmd,...extra});},[cmd,extra,cid]);
  await wait(p,c=>MP1Join.results.some(r=>r.cid===c),cid);return p.evaluate(c=>MP1Join.results.filter(r=>r.cid===c).at(-1),cid);}
async function layout(p,where){return p.evaluate(where=>{const vw=innerWidth;
  const vis=e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none'&&!e.closest('[hidden]');};
  const all=[...document.querySelectorAll(where)].flatMap(s=>[s,...s.querySelectorAll('*')]);const ctl=all.filter(e=>e.matches('button,select,input')&&vis(e));
  const small=ctl.filter(e=>{const r=e.getBoundingClientRect();return r.height<44||r.width<44;}).map(e=>(e.textContent||e.id).trim().slice(0,16)+':'+Math.round(e.getBoundingClientRect().width)+'x'+Math.round(e.getBoundingClientRect().height));
  const wide=all.filter(e=>vis(e)&&e.getBoundingClientRect().right>vw+1).map(e=>e.className||e.tagName).slice(0,5);
  let minFont=99,minAt='';for(const e of all)if(vis(e)&&[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())){const f=parseFloat(getComputedStyle(e).fontSize);if(f<minFont){minFont=f;minAt=e.className+':'+e.textContent.slice(0,16);}}
  return {overflow:document.documentElement.scrollWidth>vw+1,small,wide,minFont,minAt,controls:ctl.length};},where);}
function assertLayout(l,where){assert(!l.overflow,where+' overflow');assert.deepEqual(l.wide,[],where+' wide');assert.deepEqual(l.small,[],where+' <44px');assert(l.minFont>=11,where+' font '+l.minFont+' '+l.minAt);assert(l.controls>0,where+' controls');}
async function setTerm(p,id,v){await p.locator('#'+id).selectOption(String(v));await p.waitForTimeout(60);}
async function room(guests){
  await H.goto(base+'/');await wait(H,()=>typeof setupGame==='function'&&document.getElementById('mp1Btn'));
  await H.locator('#mp1Btn').tap();await H.locator('[data-m="create"]').tap();await wait(H,()=>MP1Host.lobby&&MP1Host.lobby.phase==='waiting');
  const c=await H.evaluate(n=>{MP1Host.host.setCapacity(n+1);MP1Host.host.configure({size:'orta',aiCount:5,seed:22});return MP1Host.code;},guests.length);
  await H.evaluate(()=>{MP1Host.ws.send('C'+JSON.stringify({cap:MP1Host.host.lobby.capacity-1}));});
  for(const [g,name,e] of guests){await g.goto(base+'/mp/join?code='+c);await wait(g,()=>window.MP1Join&&document.getElementById('jCode'));await g.fill('#jName',name);
    await g.locator('[data-j="go"]').tap();await wait(g,()=>MP1Join.screen==='lobby'&&MP1Join.lobby);await g.evaluate(x=>MP1Join.claim(x),e);
    await wait(H,([e])=>MP1Host.lobby.players.some(p=>p.claim===e),[e]);await g.evaluate(()=>MP1Join.ready(true));}
  await wait(H,()=>MP1Host.host.canStart().ok);await H.locator('[data-m="start"]').tap();
  for(const [g,,e] of guests)await wait(g,x=>MP1Join.screen==='game'&&MP1Join.game.view&&MP1Join.game.view.me.id===x&&document.getElementById('mp2Map'),e);
  await H.evaluate(()=>UI.setSpeed(0));return c;
}
const LAW=`[...Object.keys(FED_LAWS),...Object.keys(FED_INNER_LAWS)].find(k=>canFedLaw(G.emps[5],k,false).ok)`;

(async()=>{try{
  relay=relayMod.create({MP1_PORT:'0'});const s=await relay.start();base='http://127.0.0.1:'+s.address().port;
  [bH,bA,bB,bC]=await Promise.all([0,1,2,3].map(()=>chromium.launch(launch)));
  H=await (await bH.newContext(PHONE(915,412))).newPage();A=await (await bA.newContext(PHONE(390,844))).newPage();
  B=await (await bB.newContext(PHONE(360,800))).newPage();C=await (await bC.newContext(PHONE(412,915))).newPage();
  for(const [n,p] of [['host',H],['A',A],['B',B],['C',C]])p.on('pageerror',e=>errors.push(n+': '+e.message));
  metrics.browserProcesses=[...new Set((require('child_process').execSync('ps -eo args').toString().match(/--user-data-dir=\S+/g)||[]))].length;

  await test('kurulum: gerçek lobi → oyun, 3 misafir; siyasi fikstür; misafirde motor yok; DİPLOMASİ altında TİCARET / FEDERASYON / VASALLIK',async()=>{
    code=await room([[A,'Ayşe',E.A],[B,'Bora',E.B],[C,'Cem',E.C]]);await H.evaluate(POLITICS);
    for(const p of [A,B,C]){assert.equal(await p.evaluate(()=>[typeof G,typeof castFedVote,typeof vassalOffer,typeof fedOpenVote].join()),'undefined,undefined,undefined,undefined');await sync(p);
      await seg(p,'fed');assert.deepEqual(await p.evaluate(()=>[...document.querySelectorAll('.mp31-seg button')].map(b=>b.dataset.seg)),['trade','fed','vas']);}
    assert.equal(await H.evaluate(()=>String(fedOpenVote).includes('__mpHumanVoter')),true,'host guard installed');
    await tab(B,'fsub','gen');assert.match(await B.textContent('#mp2DipP'),/MP31 Test Birliği/);await shot(B,'b-fed-general');
  });

  await test('B. kritik: AI başkanın yasa önerisinde B oy vermeden evet/hayır listesinde değil; B telefondan HAYIR oyu verir (iki adımlı onay); yalnız B\'nin oyu kaydedilir',async()=>{
    const law=await H.evaluate(`(()=>{const k=${LAW};proposeFedLaw(G.emps[5],k);MP1Host.host.publish();return k;})()`);assert(law,'a proposable law');
    const f=await F();assert(f.vote,'vote open');assert.equal(f.vote.yes.includes(3)||f.vote.no.includes(3),false,'no automatic vote for the human');
    await sync(B);await wait(B,()=>/FEDERASYON\s*1/.test(document.querySelector('[data-seg="fed"]').textContent));
    await tab(B,'fsub','vote');await wait(B,()=>document.querySelector('#mp2DipP [data-p="askVote"][data-yes="0"]'));
    assert.match(await B.textContent('#mp2DipP .mp31-vote'),/Bekleyen[\s\S]*Bora|Bekleyen/);await shot(B,'b-fed-vote');
    await B.locator('#mp2DipP [data-p="askVote"][data-yes="0"]').tap();const r=await confirmSheet(B);assert.equal(r.status,'ok',JSON.stringify(r));metrics.latency.voteMs=r.ms;metrics.latency.voteWall=r.wall;
    const g=await F();assert.equal(g.vote,null,'vote resolved by the engine');assert.deepEqual([g.last.noMembers.includes(3),g.last.yesMembers.includes(3)],[true,false]);
    await wait(B,()=>/Son oylama/.test(document.getElementById('mp2DipP').textContent));await shot(B,'b-fed-vote-result');
    metrics.notes.push('yasa '+law+': '+(g.last.passed?'KABUL':'RED')+' '+g.last.yes+'/'+g.last.no);
  });

  await test('A/D. üyelik başvurusu: A, AI 5 üzerinden BAŞVUR → kabul oylaması → B oy verir → davet A\'nın DAVETLER bölümüne → A KATIL → gerçek üyelik; sonra A AYRIL → üyelik kalkar',async()=>{
    await H.evaluate(()=>{for(const id of fedOf(100).members){G.emps[1].ally[id]=G.emps[id].ally[1]=true;}MP1Host.host.publish();});await sync(A);
    await seg(A,'fed');await tab(A,'fsub','gen');await wait(A,()=>document.querySelector('#mp2DipP [data-p="apply"][data-via="5"]:not([disabled])'));await shot(A,'a-fed-apply');
    const n=await nres(A);await A.locator('#mp2DipP [data-p="apply"][data-via="5"]').tap();await wait(A,n=>MP1Join.results.length>n,n);
    assert.equal(await A.evaluate(()=>MP1Join.results.at(-1).status),'ok');let f=await F();assert.deepEqual([f.vote.motion,f.vote.target],['admit',1]);assert.equal(f.vote.yes.includes(3)||f.vote.no.includes(3),false);
    await sync(B);await seg(B,'fed');await tab(B,'fsub','vote');await wait(B,()=>document.querySelector('#mp2DipP [data-p="askVote"][data-yes="1"]'));
    await B.locator('#mp2DipP [data-p="askVote"][data-yes="1"]').tap();assert.equal((await confirmSheet(B)).status,'ok');
    f=await F();metrics.notes.push('üyelik oylaması: '+(f.last.passed?'KABUL':'RED')+' — '+f.last.why);
    if(!f.last.passed){await sync(A);await tab(A,'fsub','inv');assert.match(await A.textContent('#mp2DipP'),/Reddedildi|Süresi doldu/);return;}
    assert.equal(f.members.includes(1),false,'vote alone does not admit');assert(f.invites['1'],'invite awaits A');
    await sync(A);await wait(A,()=>/FEDERASYON\s*1/.test(document.querySelector('[data-seg="fed"]').textContent));await tab(A,'fsub','inv');
    await wait(A,()=>document.querySelector('#mp2DipP [data-p="askJoin"]:not([disabled])'));await shot(A,'a-fed-invite');
    await A.locator('#mp2DipP [data-p="askJoin"]').tap();assert.equal((await confirmSheet(A)).status,'ok');assert.equal((await F()).members.includes(1),true,'A is a real member');
    assert.equal((await raw(A,{kind:'fedReply',fed:100,action:'accept'})).code,'no-invite','same invitation cannot be accepted twice');
    await sync(A);await tab(A,'fsub','mem');assert.match(await A.textContent('#mp2DipP'),/Ayşe|Kadim/);await shot(A,'a-fed-members');
    await tab(A,'fsub','gen');await A.locator('#mp2DipP [data-p="askLeave"]').tap();assert.equal((await confirmSheet(A)).status,'ok');
    assert.equal((await F()).members.includes(1),false,'left the federation');assert.equal(await H.evaluate(()=>G.emps[1]._fedLeaveUntil>G.day),true);
  });

  await test('E. vasallık insan–insan: B himaye ister (haraçgüzar, Enerji %20) → A karşı teklif (Enerji %10) → B kabul → gerçek sözleşme; eski tur reddedilir; A\'nın DURUM ekranında sözleşme',async()=>{
    await seg(B,'vas');await tab(B,'vsub','new','#mp2DipP');await wait(B,()=>document.querySelector('#mp2DipP [data-vc="1"] [data-p="vdraft"][data-mode="seek"]:not([disabled])'));
    await B.locator('#mp2DipP [data-vc="1"] [data-p="vdraft"][data-mode="seek"]').tap();await wait(B,()=>document.querySelector('.mp31-draft'));
    await setTerm(B,'vtType','haracguzar');await setTerm(B,'vtTax_ene','0.2');await shot(B,'b-vas-draft');
    assert.equal(await B.locator('[data-p="vsend"]').isDisabled(),true,'send needs a fresh preview');
    await B.locator('[data-p="vquote"]').tap();await wait(B,()=>document.querySelector('#mp31Quote .mp1-card'));assert.match(await B.textContent('#mp31Quote'),/Engel yok/);
    assert.match(await B.textContent('#mp31Quote'),new RegExp('Maliyet \\(gönderen öder\\): '+await H.evaluate(()=>VASSAL_SEEK_COST)));await shot(B,'b-vas-preview');
    const s0=await HS();await B.locator('[data-p="vsend"]').tap();const r=await confirmSheet(B);assert.equal(r.status,'ok',JSON.stringify(r));metrics.latency.vassalOfferMs=r.ms;
    assert.equal(r.extra.karar,'pending');assert.equal(await H.evaluate(()=>isVassal(G.emps[3])),false,'offer alone creates nothing');assert.notEqual(s0.s,(await HS()).s);
    const q=await H.evaluate(()=>G.emps[3].vassalTalk);assert.deepEqual([q.to,q.round,q.terms.tax.ene],[1,1,.2]);
    await sync(A);await seg(A,'vas');await wait(A,()=>/VASALLIK\s*1/.test(document.querySelector('[data-seg="vas"]').textContent));await tab(A,'vsub','in','#mp2DipP');
    await wait(A,()=>document.querySelector('#mp2DipP [data-p="vcounter"]'));await shot(A,'a-vas-incoming');
    await A.locator('#mp2DipP [data-p="vcounter"]').tap();await wait(A,()=>/KARŞI TEKLİF — tur 2\/3/.test((document.querySelector('.mp31-draft')||{}).textContent||''));
    await setTerm(A,'vtTax_ene','0.1');await A.locator('[data-p="vsend"]').tap();assert.equal((await confirmSheet(A)).status,'ok');
    assert.deepEqual(await H.evaluate(()=>{const q=G.emps[3].vassalTalk;return [q.to,q.round,q.terms.tax.ene];}),[3,2,.1]);
    assert.equal((await raw(B,{kind:'vassalReply',sub:3,id:q.id,round:1,action:'accept'})).code,'rules:stale','old round refused');
    assert.equal((await raw(C,{kind:'vassalReply',sub:3,id:q.id,round:2,action:'accept'})).code,'no-offer','third party sees nothing');
    await sync(B);await tab(B,'vsub','in','#mp2DipP');await wait(B,()=>document.querySelector('#mp2DipP [data-p="askV"][data-a="accept"]'));
    await B.locator('#mp2DipP [data-p="askV"][data-a="accept"]').tap();const ok=await confirmSheet(B);assert.equal(ok.status,'ok');metrics.latency.vassalAcceptMs=ok.ms;
    assert.deepEqual(await H.evaluate(()=>[G.emps[3].overlord,G.emps[3].vassalContract.terms.tax.ene,G.emps[3].vassalContract.type]),[1,.1,'haracguzar']);
    await sync(A);await tab(A,'vsub','st','#mp2DipP');await wait(A,()=>document.querySelector('#mp2DipP [data-ctr="3"]'));assert.match(await A.textContent('#mp2DipP [data-ctr="3"]'),/Enerji 10%/);await shot(A,'a-vas-contract');
    const paid0=await H.evaluate(()=>G.emps[3].vassalPaidMonth??null);await H.evaluate(()=>MP1Host.advance(31));assert.notEqual(await H.evaluate(()=>G.emps[3].vassalPaidMonth??null),paid0,'monthly tribute processed by the engine');
    metrics.notes.push('vergi: '+JSON.stringify(await H.evaluate(()=>G.emps[3].vassalTransfer)));
  });

  await test('F. barışçıl bağımsızlık: B BAĞIMSIZLIK İSTE → A REDDET (vasallık sürer, savaş yok) → yeniden talep → A KABUL → B bağımsız; geri tuşu açık onay penceresini kapatır, oyundan çıkmaz',async()=>{
    const cool=()=>H.evaluate(()=>{const s=G.emps[3];if(s.vassalContract)s.vassalContract.started-=400;if(s.vassalTalk)s.vassalTalk.finished-=400;s._vassalTalkAfter=0;MP1Host.host.publish();});
    await cool();await sync(B);await seg(B,'vas');await tab(B,'vsub','st','#mp2DipP');
    await B.locator('#mp2DipP [data-p="askRelease"]').tap();await wait(B,()=>document.querySelector('.mp31-draft'));await B.locator('[data-p="vquote"]').tap();
    await wait(B,()=>/Engel yok/.test((document.getElementById('mp31Quote')||{}).textContent||''));await B.locator('[data-p="vsend"]').tap();
    // geri tuşu: önce onay penceresi kapanır
    await wait(B,()=>document.getElementById('mp3Sheet'));await B.goBack();await wait(B,()=>!document.getElementById('mp3Sheet'));
    assert.equal(await B.evaluate(()=>[MP1Join.screen,!!document.getElementById('jSheet')].join()),'game,false','back closes the modal, not the game');await B.waitForTimeout(450);
    await B.locator('[data-p="vsend"]').tap();assert.equal((await confirmSheet(B)).status,'ok');
    assert.deepEqual(await H.evaluate(()=>[G.emps[3].vassalTalk.kind,!!G.emps[1].war[3],G.emps[3].overlord]),['release',false,1],'request alone: no war, no independence');
    await sync(A);await seg(A,'vas');await tab(A,'vsub','in','#mp2DipP');await wait(A,()=>/Bağımsızlık talebi/.test(document.getElementById('mp2DipP').textContent));await shot(A,'a-vas-release');
    await A.locator('#mp2DipP [data-p="askV"][data-a="reject"]').tap();assert.equal((await confirmSheet(A)).status,'ok');
    assert.deepEqual(await H.evaluate(()=>[G.emps[3].overlord,!!G.emps[1].war[3]]),[1,false],'refused: still vassal, no war');
    await cool();await sync(B);await tab(B,'vsub','st','#mp2DipP');await B.locator('#mp2DipP [data-p="askRelease"]').tap();await B.locator('[data-p="vquote"]').tap();
    await wait(B,()=>/Engel yok/.test((document.getElementById('mp31Quote')||{}).textContent||''));await B.locator('[data-p="vsend"]').tap();assert.equal((await confirmSheet(B)).status,'ok');
    await sync(A);await tab(A,'vsub','in','#mp2DipP');await wait(A,()=>document.querySelector('#mp2DipP [data-p="askV"][data-a="accept"]'));
    await A.locator('#mp2DipP [data-p="askV"][data-a="accept"]').tap();assert.equal((await confirmSheet(A)).status,'ok');
    assert.deepEqual(await H.evaluate(()=>[isVassal(G.emps[3]),G.emps[3].vassalContract.status,!!G.emps[1].war[3]]),[false,'ended',false]);
    await sync(B);await tab(B,'vsub','st','#mp2DipP');assert.match(await B.textContent('#mp2DipP'),/Bağımsızsın/);await shot(B,'b-vas-free');
  });

  await test('G. AI ↔ insan: C (güçlü) AI 5\'ten biat ister; AI motorla (vassalDriveAI) yanıtlar; AI karşı teklifi C\'nin GELEN kutusunda bekler, AI C adına karar vermez',async()=>{
    await sync(C);await seg(C,'vas');await tab(C,'vsub','new','#mp2DipP');await wait(C,()=>document.querySelector('#mp2DipP [data-vc="5"] [data-p="vdraft"][data-mode="demand"]:not([disabled])'));
    await C.locator('#mp2DipP [data-vc="5"] [data-p="vdraft"][data-mode="demand"]').tap();await setTerm(C,'vtTax_ene','0.1');await C.locator('[data-p="vquote"]').tap();
    await wait(C,()=>/Engel yok/.test((document.getElementById('mp31Quote')||{}).textContent||''));await C.locator('[data-p="vsend"]').tap();const r=await confirmSheet(C);assert.equal(r.status,'ok',JSON.stringify(r));
    const q=await H.evaluate(()=>G.emps[5].vassalTalk);metrics.notes.push('C→AI5 biat: '+q.status+' tur '+q.round);
    if(q.status==='pending'){assert.equal(q.to,4,'AI counter waits for the human');await sync(C);await tab(C,'vsub','in','#mp2DipP');await wait(C,()=>document.querySelector('#mp2DipP [data-p="askV"]'));await shot(C,'c-vas-ai-counter');
      await C.locator('#mp2DipP [data-p="askV"][data-a="reject"]').tap();assert.equal((await confirmSheet(C)).status,'ok');}
  });

  await test('H. yetki ve gizlilik: üye olmayan oy, sahte federasyon, sahte token, sahte devlet, başkasının müzakeresi, geçersiz vergi, host başkası adına; C ağdan A–B müzakeresini ve F oylamasını almaz',async()=>{
    // açık gündem: önerilebilir yasa yoksa AI başkan motorun başkan seçimi önergesini açar (proposeFedMotion)
    const law=await H.evaluate(`(()=>{const k=${LAW};const r=k?proposeFedLaw(G.emps[5],k):proposeFedMotion(G.emps[5],'elect',{target:2});MP1Host.host.publish();return (k||'elect')+':'+r.ok;})()`);const f=await F();
    assert(f.vote&&f.vote.eligible.includes(3)&&!f.vote.yes.includes(3)&&!f.vote.no.includes(3),'open vote waiting for B: '+law);
    const tok=f.vote?String(f.vote.id):'1',s0=await HS();
    assert.equal((await raw(A,{kind:'fedVote',fed:100,token:tok,yes:true})).code,'no-fed');assert.equal((await raw(A,{kind:'fedVote',fed:777,token:tok,yes:true})).code,'no-fed');
    if(f.vote){assert.equal((await raw(B,{kind:'fedVote',fed:100,token:'999',yes:true})).code,'rules:stale');assert.equal((await raw(B,{kind:'fedVote',fed:100,token:tok,yes:true},{empire:5})).code,'forged-empire');}
    assert.equal((await raw(C,{kind:'vassalReply',sub:3,id:'3:1',round:1,action:'accept'})).code,'no-offer');
    assert.equal((await raw(B,{kind:'vassalOffer',to:1,mode:'seek',type:'haracguzar',terms:{tax:{ene:'%90'}}})).code,'bad-params');
    assert.equal((await raw(B,{kind:'vassalOffer',to:1,mode:'seek',type:'haracguzar',terms:{tax:{ene:.9,min:0,ala:0,yiy:0,tuk:0}}})).code,'rules:terms');
    assert.equal((await raw(A,{kind:'fedLeave'})).code,'rules:no-fed');
    assert.equal(await H.evaluate(t=>MP1Host.host.local({kind:'fedVote',fed:100,token:t,yes:true}).code,tok),'no-fed','host cannot vote for others');
    sameState(s0,await HS(),'rejected commands change nothing');
    if(f.vote){await sync(B);await seg(B,'fed');await tab(B,'fsub','vote');await B.locator('#mp2DipP [data-p="askVote"][data-yes="1"]').tap();await confirmSheet(B);}
    const leak=await C.evaluate(()=>{const bad=[];for(const t of MP1Join.packets){if(/"vote":\{|"waiting":|"eligible":|"cy":/.test(t))bad.push('vote');if(/"id":"3:\d+"/.test(t))bad.push('talk');}return [...new Set(bad)];});
    assert.deepEqual(leak,[],'C received no federation vote or A–B vassal data');metrics.notes.push('yetki/gizlilik yasa '+law);
  });

  await test('host paneli: FEDERASYON / VASALLIK bölümleri aynı görünüm ve kurallarla; host üye olmadığı federasyonda oy veremez; düzen 915×412',async()=>{
    await freeBar(H);await H.locator('#mp3HostBtn').tap();await wait(H,()=>document.querySelector('#mp3Host .mp31-seg'));
    await H.locator('#mp3Host [data-hs="fed"]').tap();await wait(H,()=>!document.getElementById('mp3HostP').hidden&&document.querySelector('#mp3HostP .mp31'));
    assert.match(await H.textContent('#mp3HostP'),/Federasyon üyeliğin yok/);await shot(H,'host-fed');assertLayout(await layout(H,'#mp3Host'),'host fed');
    await H.locator('#mp3Host [data-hs="vas"]').tap();await wait(H,()=>document.querySelector('#mp3HostP [data-p="vsub"]'));await shot(H,'host-vas');assertLayout(await layout(H,'#mp3Host'),'host vas');
    await H.locator('#mp3Host [data-hs="trade"]').tap();await H.locator('#mp3Host [data-h="close"]').tap();await wait(H,()=>!document.getElementById('mp3Host'));
  });

  await test('Android görünümleri 360×800, 390×844, 412×915, 844×390, 915×412: federasyon (4 bölüm), vasallık (4 bölüm), sözleşme taslağı ve onay penceresi — taşma yok, ≥44 px, yazı ≥11 px',async()=>{
    await H.evaluate(()=>{for(const id of fedOf(100).members){G.emps[1].ally[id]=G.emps[id].ally[1]=true;}MP1Host.host.publish();});
    for(const [w,h] of [[360,800],[390,844],[412,915],[844,390],[915,412]]){const k=w+'x'+h;await B.setViewportSize({width:w,height:h});await B.waitForTimeout(120);await sync(B);const m={};
      await seg(B,'fed');for(const x of ['gen','mem','vote','inv']){await tab(B,'fsub',x);const l=await layout(B,'#mp2Dip, .mp2-nav');assertLayout(l,k+' fed '+x);m['fed-'+x]=l.small.length;}
      await shot(B,'b-fed-'+k);
      await seg(B,'vas');for(const x of ['st','in','new','hist']){await tab(B,'vsub',x);const l=await layout(B,'#mp2Dip, .mp2-nav');assertLayout(l,k+' vas '+x);}
      await tab(B,'vsub','new');await B.locator('#mp2DipP [data-vc="1"] [data-p="vdraft"][data-mode="seek"]').tap();await wait(B,()=>document.querySelector('.mp31-draft'));
      assertLayout(await layout(B,'#mp2Dip, .mp2-nav'),k+' draft');await shot(B,'b-vas-draft-'+k);await B.locator('[data-p="vcancel"]').tap();
      await seg(B,'fed');await tab(B,'fsub','gen');await B.locator('#mp2DipP [data-p="askLeave"]').tap();await wait(B,()=>document.getElementById('mp3Sheet'));
      assertLayout(await layout(B,'#mp3Sheet'),k+' sheet');await B.locator('#mp3Sheet [data-s="no"]').tap();await wait(B,()=>!document.getElementById('mp3Sheet'));await B.waitForTimeout(450);
      metrics.viewports[k]=m;}
    await B.setViewportSize({width:360,height:800});
  });

  await test('bağlantı: host ağı kesilince federasyon/vasallık düğmeleri kapanır ve komut gönderilmez; host dönünce açılır',async()=>{
    await seg(B,'fed');await tab(B,'fsub','gen');
    await H.evaluate(()=>{window.__WS=window.WebSocket;window.WebSocket=class{constructor(){setTimeout(()=>this.onclose&&this.onclose({code:1006}),100);}send(){}close(){}};});
    relay.rooms.get(code).host.socket.destroy();await wait(B,()=>!MP1Join.hostOnline);await wait(B,()=>/Host bağlı değil/.test(document.getElementById('mp2DipP').textContent));
    assert.equal(await B.locator('#mp2DipP [data-p="askLeave"]').isDisabled(),true);await shot(B,'b-fed-offline');
    assert.equal(await B.evaluate(()=>MP1Join.cmd({kind:'fedLeave'}).why),'host-yok');
    await H.evaluate(()=>{window.WebSocket=window.__WS;});await wait(H,()=>MP1Host.connected&&MP1Host.host.lobby.phase==='ingame',undefined,30000);await wait(B,()=>MP1Join.hostOnline,undefined,30000);
    await wait(B,()=>!document.querySelector('#mp2DipP [data-p="askLeave"]').disabled);
  });

  await test('J. performans (host + 3 misafir): oy ve vasallık gecikmesi, pol bölümü boyutu, delta, host yayını, çizim, bellek',async()=>{
    const hp=await H.evaluate(()=>{const t=[];for(let i=0;i<20;i++){const a=performance.now();MP1Host.host.publish();t.push(performance.now()-a);}t.sort((a,b)=>a-b);
      return {publishMedianMs:Math.round(t[10]*100)/100,publishP95Ms:Math.round(t[18]*100)/100,heapMB:performance.memory?Math.round(performance.memory.usedJSHeapSize/1048576*10)/10:null};});
    const g={};for(const [n,p] of [['A',A],['B',B],['C',C]])g[n]=await p.evaluate(()=>{const d=MP1Join.packets.filter(x=>x.includes('"pol"')&&x.includes('"type":"delta"')).map(x=>x.length).sort((a,b)=>a-b);
      const r=MP2Game.G.pol?MP2Game.G.pol.U.stats.ms.slice().sort((a,b)=>a-b):[];
      return {polBytes:JSON.stringify(MP1Join.game.view.pol).length,polDeltas:d.length,polDeltaMedian:d[d.length>>1]||0,polDeltaMax:d[d.length-1]||0,
        snapshotMax:Math.max(...MP1Join.packets.filter(x=>x.includes('"type":"snapshot"')).map(x=>x.length)),renderMedianMs:Math.round((r[r.length>>1]||0)*100)/100,
        heapMB:performance.memory?Math.round(performance.memory.usedJSHeapSize/1048576*10)/10:null};});
    metrics.perf={host:hp,guests:g,latency:metrics.latency};
    assert(hp.publishMedianMs<60);for(const k of Object.keys(g)){assert(g[k].polBytes<30000,'pol size '+k);assert(g[k].renderMedianMs<16,'render '+k);}
  });
  assert.equal(errors.length,0,'page errors: '+errors.join(' | '));
}catch(e){results.push({name:'harness',status:'FAIL',error:String(e&&e.stack||e)});console.log('FAIL harness\n'+(e&&e.stack||e));}
finally{
  metrics.pageErrors=errors;fs.writeFileSync(path.join(out,'mp31-results.json'),JSON.stringify({note:'Yerel relay + 4 ayrı Chromium süreci (mobil dokunmatik bağlam). Gerçek internet ya da fiziksel Android DEĞİL. Siyasi başlangıç durumu açık fikstür.',results,metrics},null,1));
  for(const b of [bH,bA,bB,bC])if(b)await b.close().catch(()=>{});if(relay)relay.shutdown('test-end');
  const pass=results.filter(r=>r.status==='PASS').length,fail=results.length-pass;console.log('GEÇEN: '+pass+' KALAN: '+fail);process.exit(fail?1:0);
}})();
