'use strict';
/* MP.3 — insan oyuncular arası gerçek diplomasi, gerçek tarayıcılarda.
   Ayrı Chromium süreçleri: host telefon (yatay) + misafir A (390×844) + misafir B (360×800) + misafir C (412×915).
   Dünya: seed 22, orta, 5 AI; A=1, B=3, C=4 insan; 5 AI. Temas DOĞAL yoldan (keşif) kurulur: host zamanı ilerletir.
   Her işlem misafir arayüzünden gerçek dokunma ve klavyeyle yapılır; host motoru (dealQuote / executeDeal / aiRespond) uygular.
   Yerel relay; gerçek internet ve fiziksel Android değildir. Çıktı: $STARS_OUTPUT/mp3-results.json + PNG. */
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),out=path.resolve(process.env.STARS_OUTPUT||path.join(root,'../evidence/mp3'));fs.mkdirSync(out,{recursive:true});
const relayMod=require('../research/mp1/server/relay.js');
const results=[],errors=[],metrics={viewports:{},perf:{},latency:{}};
const launch={executablePath:process.env.STARS_CHROMIUM_PATH||undefined,args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--enable-precise-memory-info']};
const PHONE=(w,h)=>({viewport:{width:w,height:h},isMobile:true,hasTouch:true,deviceScaleFactor:2});
let relay,base,bH,bA,bB,bC,H,A,B,C,code;const E={A:1,B:3,C:4,AI:5};
async function test(name,fn){const t0=Date.now();try{await fn();results.push({name,status:'PASS',ms:Date.now()-t0});console.log('PASS '+name);}
  catch(e){results.push({name,status:'FAIL',error:String(e&&e.stack||e).slice(0,1600)});console.log('FAIL '+name+'\n'+(e&&e.stack||e));}}
const wait=(p,fn,arg,timeout=20000)=>p.waitForFunction(fn,arg,{timeout,polling:50});
const shot=(p,n)=>p.screenshot({path:path.join(out,n+'.png')}).catch(()=>{});
/* Host sayfasının kendi tek oyunculu arayüzü motorun "_" önekli günlük önbelleklerini damgalar (MP.2 notu);
   tarayıcı karşılaştırması bunları dışarıda bırakır. Tam Save8 baytı eşitliği vm testinde (mp3_core_test). */
const HS=()=>H.evaluate(()=>({s:JSON.stringify(JSON.parse(serialize()),(k,v)=>k[0]==='_'?undefined:v),r:RND_STATE}));
function firstDiff(a,b,p=''){if(JSON.stringify(a)===JSON.stringify(b))return null;if(a&&b&&typeof a==='object'&&typeof b==='object'){for(const k of new Set([...Object.keys(a),...Object.keys(b)])){const d=firstDiff(a[k],b[k],p+'/'+k);if(d)return d;}}
  return p+' '+JSON.stringify(a)?.slice(0,80)+' → '+JSON.stringify(b)?.slice(0,80);}
function sameState(x,y,msg){if(x.s===y.s&&x.r===y.r)return;assert.fail((msg||'state changed')+': rng '+x.r+'→'+y.r+' '+firstDiff(JSON.parse(x.s),JSON.parse(y.s)));}
const cdps=new Map();
async function touch(p,type,pts){let c=cdps.get(p);if(!c){c=await p.context().newCDPSession(p);cdps.set(p,c);}
  await c.send('Input.dispatchTouchEvent',{type,touchPoints:pts.map((q,i)=>({x:q.x,y:q.y,id:i+1,radiusX:4,radiusY:4,force:1}))});}
async function tapXY(p,x,y){await touch(p,'touchStart',[{x,y}]);await touch(p,'touchEnd',[]);}
const R=id=>H.evaluate(i=>({...G.emps[i].res}),id);
const advance=d=>H.evaluate(n=>MP1Host.advance(n),d);
async function sync(p){const day=await H.evaluate(()=>Math.floor(G.day));await wait(p,d=>MP1Join.game.view&&MP1Join.game.view.dip&&MP1Join.game.clock&&MP1Join.game.clock.day===d,day);}
const lastOffer=()=>H.evaluate(()=>MP1Host.host.dip.offers.at(-1));
const offerAt=id=>H.evaluate(i=>MP1Host.host.dip.offers.find(r=>r.id===i),id);
const nres=p=>p.evaluate(()=>MP1Join.results.length);

/* ---------- arayüz adımları (gerçek dokunma + klavye) ---------- */
const S=(scope,sel)=>scope?scope+' '+sel:sel;
async function dipTab(p){await p.locator('.mp2-nav [data-tab="dip"]').tap();await wait(p,()=>document.querySelector('#mp2Dip .mp3'));}
async function sub(p,k,scope){await p.locator(S(scope,`[data-d="sub"][data-sub="${k}"]`)).tap();await wait(p,([k,s])=>document.querySelector((s?s+' ':'')+`[data-d="sub"][data-sub="${k}"].on`),[k,scope||'']);}
/* items: [['give','min',100,'preset'|'type'|'max'], ['want','ala',50,'type']] */
/* önceki adımdan kalan taslak/onay penceresi bir sonraki adımı etkilemesin */
async function clean(p,scope){if(await p.locator('#mp3Sheet').count()){await p.locator('#mp3Sheet [data-s="no"]').tap();await p.waitForTimeout(450);}
  if(await p.locator(S(scope,'.mp3-draft [data-d="cancel"]')).count())await p.locator(S(scope,'.mp3-draft [data-d="cancel"]')).tap();
  if(!scope&&await p.evaluate(()=>MP2Game.G.tab!=='dip'))await dipTab(p);}
async function draft(p,to,items,scope){
  await clean(p,scope);
  await sub(p,'emp',scope);await p.locator(S(scope,`[data-d="compose"][data-to="${to}"]`)).tap();await wait(p,s=>document.querySelector((s?s+' ':'')+'.mp3-draft'),scope||'');
  for(const [side,r,v,how] of items){
    await p.locator(S(scope,`[data-d="side"][data-side="${side}"]`)).tap();
    await p.locator(S(scope,'#mp3Res')).selectOption(r);
    if(how==='preset')await p.locator(S(scope,`[data-d="pre"][data-v="${v}"]`)).tap();
    else if(how==='max')await p.locator(S(scope,'[data-d="pre"][data-v="max"]')).tap();
    else{await p.locator(S(scope,'#mp3Amt')).tap();await p.keyboard.type(String(v));}
    await p.locator(S(scope,'[data-d="add"]')).tap();
  }
}
async function preview(p,scope){await p.locator(S(scope,'[data-d="preview"]')).tap();await wait(p,s=>document.querySelector((s?s+' ':'')+'#mp3Quote .mp1-card'),scope||'');return p.textContent(S(scope,'#mp3Quote'));}
async function sendDraft(p,scope){const n=scope?0:await nres(p);await p.locator(S(scope,'[data-d="send"]')).tap();if(!scope)await wait(p,n=>MP1Join.results.length>n,n);await wait(p,s=>!document.querySelector((s?s+' ':'')+'.mp3-draft'),scope||'');}
/* yanlış dokunmaya karşı iki adım: KABUL/RET/GERİ ÇEK → onay penceresi (onay düğmesi ilk 450 ms kapalı) → EVET */
async function decide(p,id,action,scope){
  await clean(p,scope);
  const sb=action==='withdraw'?'out':'in';await sub(p,sb,scope);
  await p.locator(S(scope,`[data-d="ask"][data-a="${action}"][data-id="${id}"]`)).tap();await wait(p,()=>document.getElementById('mp3Sheet'));
  assert.equal(await p.locator('#mp3Sheet [data-s="ok"]').isDisabled(),true,'confirm starts disabled (double-tap guard)');
  await wait(p,()=>!document.querySelector('#mp3Sheet [data-s="ok"]').disabled);
  const n=scope?0:await nres(p);await p.locator('#mp3Sheet [data-s="ok"]').tap();if(!scope)await wait(p,n=>MP1Join.results.length>n,n);
  await wait(p,()=>!document.getElementById('mp3Sheet'));await p.waitForTimeout(450);   // kapanış sonrası 400 ms hayalet dokunuş koruması
  return scope?null:p.evaluate(()=>MP1Join.results.at(-1));
}
/* ham protokol (kötü niyetli istemci): arayüzü atlayıp doğrudan paket gönderir */
async function raw(p,cmd,extra={}){const cid='x'+Math.random().toString(36).slice(2,12);
  await p.evaluate(([cmd,extra,cid])=>{const J=MP1Join;J.seq++;J.sendRaw({v:1,type:'cmd',seq:J.seq,cid,cmd,...extra});},[cmd,extra,cid]);
  await wait(p,c=>MP1Join.results.some(r=>r.cid===c),cid);return p.evaluate(c=>MP1Join.results.filter(r=>r.cid===c).at(-1),cid);}
async function dipLayout(p,where){return p.evaluate(where=>{const vw=innerWidth,vh=innerHeight;
  const vis=e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none'&&!e.closest('[hidden]');};
  const scopes=[...document.querySelectorAll(where)];const all=scopes.flatMap(s=>[s,...s.querySelectorAll('*')]);
  const ctl=all.filter(e=>e.matches('button,select,input')&&vis(e));
  const small=ctl.filter(e=>{const r=e.getBoundingClientRect();return r.height<44||r.width<44;}).map(e=>(e.textContent||e.id).trim().slice(0,16)+':'+Math.round(e.getBoundingClientRect().width)+'x'+Math.round(e.getBoundingClientRect().height));
  const wide=all.filter(e=>vis(e)&&e.getBoundingClientRect().right>vw+1).map(e=>e.className||e.tagName).slice(0,5);
  let minFont=99,minAt='';for(const e of all)if(vis(e)&&[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())){const f=parseFloat(getComputedStyle(e).fontSize);if(f<minFont){minFont=f;minAt=e.className+':'+e.textContent.slice(0,16);}}
  return {overflow:document.documentElement.scrollWidth>vw+1,small,wide,minFont,minAt,controls:ctl.length,vw,vh};},where);}
function assertLayout(l,where){assert(!l.overflow,where+' overflow');assert.deepEqual(l.wide,[],where+' wide');assert.deepEqual(l.small,[],where+' <44px');assert(l.minFont>=11,where+' font '+l.minFont+' '+l.minAt);assert(l.controls>0,where+' has controls');}
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

(async()=>{try{
  relay=relayMod.create({MP1_PORT:'0'});const s=await relay.start();base='http://127.0.0.1:'+s.address().port;
  [bH,bA,bB,bC]=await Promise.all([0,1,2,3].map(()=>chromium.launch(launch)));
  H=await (await bH.newContext(PHONE(915,412))).newPage();A=await (await bA.newContext(PHONE(390,844))).newPage();
  B=await (await bB.newContext(PHONE(360,800))).newPage();C=await (await bC.newContext(PHONE(412,915))).newPage();
  for(const [n,p] of [['host',H],['A',A],['B',B],['C',C]])p.on('pageerror',e=>errors.push(n+': '+e.message));
  metrics.browserProcesses=[...new Set((require('child_process').execSync('ps -eo args').toString().match(/--user-data-dir=\S+/g)||[]))].length;

  await test('real lobby → game with three guests (1, 3, 4) on seed 22; contact comes from exploration as host time advances; guests run no engine and have a DİPLOMASİ tab',async()=>{
    code=await room([[A,'Ayşe',E.A],[B,'Bora',E.B],[C,'Cem',E.C]]);
    for(const p of [A,B,C]){assert.equal(await p.evaluate(()=>[typeof G,typeof dealQuote,typeof executeDeal,typeof aiRespond].join()),'undefined,undefined,undefined,undefined');
      assert.deepEqual(await p.evaluate(()=>[...document.querySelectorAll('.mp2-nav button')].map(b=>b.dataset.tab)),['map','fleets','cols','sci','dip']);}
    assert.equal(await H.evaluate(()=>!!G.emps[1].contact[3]),false,'no contact at start');
    for(let i=0;i<6;i++)await advance(30);
    assert.deepEqual(await H.evaluate(()=>[!!G.emps[1].contact[3],!!G.emps[1].contact[5],!!G.emps[1].contact[4],!!G.emps[3].contact[4],G.emps[1].ai,G.emps[3].ai,G.emps[4].ai,G.emps[5].ai]),
      [true,true,false,false,false,false,false,true],'natural contacts: A–B and A–AI; C knows neither');
    /* Arayüz adımları birbirini izler; stok tükenip sonraki adımı bozmasın diye insanların temel kaynakları açık fikstürle
       en az 3000'e çekilir (Etki doğal kalır). Motor yolu değişmez; Save8 eşitliği vm testinde fikstürsüz kanıtlanır. */
    await H.evaluate(()=>{for(const i of [0,1,3,4])for(const k of ['min','ene','yiy','ala'])G.emps[i].res[k]=Math.max(G.emps[i].res[k],3000);});await advance(1);
    for(const p of [A,B,C])await sync(p);
  });

  await test('A. human ↔ human trade on two phones: A composes with presets and the keyboard, previews the host quote, sends; B sees the badge, accepts with two-step confirm; exact resources move once',async()=>{
    await dipTab(A);await sub(A,'emp');
    assert.match(await A.textContent(`[data-emp="${E.B}"]`),/İNSAN/);assert.match(await A.textContent(`[data-emp="${E.AI}"]`),/AI/);
    await draft(A,E.B,[['give','min',100,'preset'],['want','ala',50,'type']]);await shot(A,'guest-a-draft');
    assert.match(await A.textContent('.mp3-draft'),/100 Mineral/);assert.match(await A.textContent('.mp3-draft'),/50 Alaşım/);
    assert.equal(await A.locator('[data-d="send"]').isDisabled(),true,'send needs a fresh preview');
    const q=await preview(A);assert.match(q,/Etki maliyeti \(gönderen öder\): 0/);assert.match(q,/540 oyun günü/);assert.match(q,/Engel yok/);await shot(A,'guest-a-preview');
    const s0=await HS(),rA=await R(E.A),rB=await R(E.B),t0=Date.now();await sendDraft(A);metrics.latency.offerMs=await A.evaluate(()=>MP1Join.results.at(-1).ms);metrics.latency.offerWallMs=Date.now()-t0;
    assert.equal(await A.evaluate(()=>MP1Join.results.at(-1).status),'ok');sameState(s0,await HS(),'creating an offer moves nothing');
    const o=await lastOffer();assert.deepEqual([o.from,o.to,o.status,o.round],[E.A,E.B,'pending',1]);
    await wait(A,id=>document.querySelector(`#mp2Dip [data-offer="${id}"]`),o.id);
    await wait(B,()=>/DİPLOMASİ\s*1/.test(document.querySelector('.mp2-nav [data-tab="dip"]').textContent));await shot(B,'guest-b-badge');
    await dipTab(B);await sub(B,'in');const card=await B.textContent(`[data-offer="${o.id}"]`);assert.match(card,/Sana verilecek.*100 Mineral/s);assert.match(card,/Senden istenen.*50 Alaşım/s);
    await shot(B,'guest-b-inbox');const t1=Date.now();const r=await decide(B,o.id,'accept');metrics.latency.acceptMs=r.ms;metrics.latency.acceptWallMs=Date.now()-t1;assert.equal(r.status,'ok');
    const a1=await R(E.A),b1=await R(E.B);
    assert.deepEqual([a1.min-rA.min,a1.ala-rA.ala,b1.min-rB.min,b1.ala-rB.ala].map(x=>Math.round(x*1000)/1000),[-100,50,100,-50],'resources moved exactly once');
    assert.equal((await offerAt(o.id)).status,'accepted');
    await wait(A,()=>/kabul edildi/.test(document.getElementById('mp2Toast').textContent)||MP1Join.game.view.log.some(x=>/kabul edildi/.test(x.m)));
    await sub(A,'hist');await wait(A,id=>/Kabul edildi/.test((document.querySelector(`[data-offer="${id}"]`)||{}).textContent||''),o.id);await shot(A,'guest-a-history');
    const again=await raw(B,{kind:'respond',offer:o.id,action:'accept'});assert.equal(again.code,'rules:closed','the same deal cannot apply twice');
    assert.equal(await H.evaluate(()=>G.log.some(x=>/Yeni teklif|kabul edildi|Anlaşma imzalandı/.test(x.m))),false,'remote players\' notices never land in the host log');
  });

  await test('B. counter-offer: B answers 60 instead of 100 alloy from the inbox; A sees round 2 and accepts; the old round is closed; only the new terms move',async()=>{
    await draft(A,E.B,[['give','min',250,'preset'],['want','ala',100,'preset']]);await preview(A);await sendDraft(A);const o=await lastOffer();
    await sync(B);await sub(B,'in');await wait(B,id=>document.querySelector(`[data-d="counter"][data-id="${id}"]`),o.id);await B.locator(`[data-d="counter"][data-id="${o.id}"]`).tap();
    await wait(B,()=>/KARŞI TEKLİF — tur 2/.test(document.querySelector('.mp3-draft').textContent));
    assert.match(await B.locator('.mp3-side').first().textContent(),/100 Alaşım/,'prefilled: B gives what A asked');
    await B.locator('.mp3-side [data-d="rm"][data-side="give"][data-i="0"]').tap();
    await B.locator('[data-d="side"][data-side="give"]').tap();await B.locator('#mp3Res').selectOption('ala');await B.locator('#mp3Amt').tap();await B.keyboard.type('60');await B.locator('[data-d="add"]').tap();
    await preview(B);await shot(B,'guest-b-counter');await sendDraft(B);
    const c=await lastOffer();assert.deepEqual([c.from,c.to,c.round,c.prev,c.status],[E.B,E.A,2,o.id,'pending']);assert.equal((await offerAt(o.id)).status,'countered');
    assert.equal((await raw(B,{kind:'respond',offer:o.id,action:'accept'})).code,'rules:closed','old round no longer acceptable');
    assert.equal((await raw(B,{kind:'respond',offer:c.id,action:'accept'})).code,'rules:not-recipient','cannot accept your own counter');
    await sync(A);await sub(A,'in');assert.match(await A.textContent(`[data-offer="${c.id}"]`),/tur 2 · önceki #/);
    const rA=await R(E.A),rB=await R(E.B);assert.equal((await decide(A,c.id,'accept')).status,'ok');
    const a1=await R(E.A),b1=await R(E.B);assert.deepEqual([a1.min-rA.min,a1.ala-rA.ala,b1.min-rB.min,b1.ala-rB.ala].map(x=>Math.round(x*1000)/1000),[-250,60,250,-60]);
  });

  await test('C. reject moves nothing; a tap on the backdrop over the KABUL button only closes the sheet; withdraw by the sender',async()=>{
    await draft(A,E.B,[['give','min',80,'type'],['want','ene',30,'type']]);await preview(A);await sendDraft(A);const o=await lastOffer();
    await sync(B);await sub(B,'in');const btn=await B.locator(`[data-d="ask"][data-a="accept"][data-id="${o.id}"]`).boundingBox();
    await B.locator(`[data-d="ask"][data-a="accept"][data-id="${o.id}"]`).tap();await wait(B,()=>document.getElementById('mp3Sheet'));await shot(B,'guest-b-confirm');
    const n0=await nres(B);const sheet=await B.locator('.mp3-sheet').boundingBox();
    const y=btn.y+btn.height/2<sheet.y?btn.y+btn.height/2:Math.max(4,sheet.y-10);await tapXY(B,btn.x+btn.width/2,y);   // arka plan: alttaki düğmenin konumu ya da sheet dışı
    await wait(B,()=>!document.getElementById('mp3Sheet'));await tapXY(B,btn.x+btn.width/2,btn.y+btn.height/2);   // kapanıştan hemen sonraki hayalet dokunuş
    await B.waitForTimeout(300);assert.equal(await nres(B),n0,'closing the sheet sends nothing');assert.equal((await offerAt(o.id)).status,'pending');
    if(await B.locator('#mp3Sheet').count())await B.locator('#mp3Sheet [data-s="no"]').tap();
    const s0=await HS();const r=await decide(B,o.id,'reject');assert.equal(r.status,'ok');sameState(s0,await HS(),'reject: no transfer');
    assert.equal((await offerAt(o.id)).status,'rejected');await wait(A,()=>MP1Join.game.view.log.some(x=>/reddedildi/.test(x.m)));
    await draft(A,E.B,[['give','min',20,'type']]);await preview(A);await sendDraft(A);const w=await lastOffer();
    assert.equal((await raw(B,{kind:'withdraw',offer:w.id})).code,'rules:not-sender');
    assert.equal((await decide(A,w.id,'withdraw')).status,'ok');assert.equal((await offerAt(w.id)).status,'invalid');
  });

  await test('D. AI ↔ human: guest → AI runs aiRespond (accept moves resources, one-sided demand is refused); natural AI → guest offers wait in the human inbox, AI never decides for the human',async()=>{
    await sync(A);const rA=await R(E.A),rI=await R(E.AI),gv=Math.min(300,Math.floor(rA.min*.8));
    await draft(A,E.AI,[['give','min',gv,'type'],['want','ene',10,'type']]);const q=await preview(A);assert.match(q,/Engel yok/);await sendDraft(A);
    const r=await A.evaluate(()=>MP1Join.results.at(-1));assert.equal(r.extra.ai,'kabul',JSON.stringify(r));
    const a1=await R(E.A),i1=await R(E.AI);assert.equal(Math.round((a1.min-rA.min)*1000)/1000,-gv);assert.equal(Math.round((i1.min-rI.min)*1000)/1000,gv);
    await wait(A,()=>/kabul etti|Anlaşma/.test(document.getElementById('mp2Toast').textContent));
    const ai=await R(E.AI),k=['yiy','ene','ala','min'].sort((x,y)=>ai[y]-ai[x])[0];
    await draft(A,E.AI,[['want',k,Math.max(1,Math.floor(ai[k]*.3)),'type']]);await preview(A);const s0=await HS();await sendDraft(A);
    const x=await A.evaluate(()=>MP1Join.results.at(-1));assert(['red','karsi'].includes(x.extra.ai),JSON.stringify(x));if(x.extra.ai==='red')sameState(s0,await HS(),'AI refusal changes nothing');
    metrics.aiAnswers={accept:r.extra.ai,oneSided:x.extra.ai};
    let months=0;const seen=()=>H.evaluate(h=>MP1Host.host.dip.offers.filter(r=>r.by==='ai'&&r.round===1&&h.includes(r.to)),[E.A,E.B,E.C]);
    while(!(await seen()).some(r=>r.status==='pending')&&months<60){await advance(30);months++;}
    const list=await seen();assert(list.length>0,'natural AI → human offer within '+months+' months');const p=list.find(r=>r.status==='pending');assert(p,'pending AI offer');
    metrics.aiToHuman={months,offers:list.length,kinds:[...new Set(list.flatMap(r=>r.give.concat(r.want).map(i=>i.t)))],aiOffersStat:await H.evaluate(()=>MP1Host.host.stats.aiOffers)};
    const who=p.to===E.A?A:p.to===E.B?B:C;await sync(who);await dipTab(who);await sub(who,'in');
    await wait(who,id=>/AI teklifi/.test((document.querySelector(`[data-offer="${id}"]`)||{}).textContent||''),p.id);await shot(who,'guest-ai-offer');
    assert.equal((await offerAt(p.id)).status,'pending','still waiting: AI did not decide for the human');
    const ok=await H.evaluate(p=>dealQuote({from:p.from,to:p.to,give:p.give,want:p.want,born:p.born,expires:p.expires}).ok,p);
    const d=await decide(who,p.id,ok?'accept':'reject');assert.equal(d.status,'ok',JSON.stringify(d));assert.equal((await offerAt(p.id)).status,ok?'accepted':'rejected');
    metrics.aiToHuman.decision=ok?'accepted':'rejected';
  });

  await test('E. privacy (3 players): C never receives the A–B offers, ids, amounts or counter rounds over the network; probing a real id looks the same as a missing one',async()=>{
    await draft(A,E.B,[['give','min',137,'type'],['want','ala',71,'type']]);await preview(A);await sendDraft(A);const o=await lastOffer();
    await sync(B);await sub(B,'in');await B.locator(`[data-d="counter"][data-id="${o.id}"]`).tap();await B.locator('.mp3-side [data-d="rm"][data-side="give"][data-i="0"]').tap();
    await B.locator('[data-d="side"][data-side="give"]').tap();await B.locator('#mp3Res').selectOption('ala');await B.locator('#mp3Amt').tap();await B.keyboard.type('43');await B.locator('[data-d="add"]').tap();
    await preview(B);await sendDraft(B);const c=await lastOffer();await advance(1);await sync(C);
    const ids=(await H.evaluate(()=>MP1Host.host.dip.offers.filter(r=>[1,3].includes(r.from)&&[1,3].includes(r.to)).map(r=>r.id)));
    const leak=await C.evaluate(([ids])=>{const bad=[];for(const t of MP1Join.packets){if(/"v":(137|71|43)\b|\b(137|71|43) [A-ZÇĞİÖŞÜ]/.test(t))bad.push('amount');
      for(const id of ids)if(new RegExp('"id":'+id+',"from"').test(t))bad.push('id '+id);}
      const d=MP1Join.game.view.dip;return {bad:[...new Set(bad)],offers:d.offers.length,contacts:d.contacts.map(c=>c.id)};},[ids]);
    assert.deepEqual(leak.bad,[],'no A–B terms or ids in any packet C received');assert.equal(leak.offers,0);assert(!leak.contacts.includes(E.A)&&!leak.contacts.includes(E.B));
    const real=await raw(C,{kind:'respond',offer:o.id,action:'reject'}),none=await raw(C,{kind:'respond',offer:987654,action:'reject'});
    assert.equal(real.code,'no-offer');assert.equal(none.code,'no-offer');assert.equal(JSON.stringify(real.detail),JSON.stringify(none.detail));
    assert.equal((await raw(C,{kind:'counter',offer:c.id,give:[{t:'res',r:'min',v:1}],want:[]})).code,'no-offer');
    assert.equal((await raw(C,{kind:'quote',to:E.A,give:[{t:'res',r:'min',v:1}],want:[]})).code,'rules:no-target','no contact, no quote');
    for(const p of [A,B])assert.equal(await p.evaluate(ids=>ids.every(i=>MP1Join.game.view.dip.offers.some(o=>o.id===i)),[o.id,c.id]),true);
    await dipTab(C);await sub(C,'emp');await shot(C,'guest-c-contacts');
    await A.evaluate(()=>0);await sub(A,'in');assert.equal((await decide(A,c.id,'reject')).status,'ok');
  });

  await test('F. security and atomicity over the network: forged empire, bad items, duplicate cid, stale seq, accept+reject race, stock change, low Etki, injected engine failure, expiry, paused host — no partial change',async()=>{
    const bad=[[{kind:'offer',to:E.B,give:[{t:'res',r:'min',v:-5}],want:[]},'bad-params'],[{kind:'offer',to:E.B,give:[{t:'res',r:'xyz',v:5}],want:[]},'bad-params'],
      [{kind:'offer',to:E.B,give:[{t:'res',r:'min',v:1e9}],want:[]},'bad-params'],[{kind:'offer',to:E.B,give:[{t:'tech',id:'x'}],want:[]},'bad-params'],
      [{kind:'offer',to:E.B,give:[{t:'res',r:'min',v:5,x:'<img src=x onerror=__x=1>'}],want:[]},'bad-params'],[{kind:'offer',to:E.B,give:[],want:[]},'bad-params'],
      [{kind:'offer',to:E.A,give:[{t:'res',r:'min',v:5}],want:[]},'rules:no-target'],[{kind:'offer',to:6,give:[{t:'res',r:'min',v:5}],want:[]},'rules:no-target'],
      [{kind:'respond',offer:1,action:'steal'},'bad-params']];
    const s0=await HS();for(const [c,code] of bad)assert.equal((await raw(A,c)).code,code,JSON.stringify(c));
    assert.equal((await raw(A,{kind:'offer',to:E.B,give:[{t:'res',r:'min',v:5}],want:[]},{empire:E.B})).code,'forged-empire');sameState(s0,await HS(),'rejected commands change nothing');
    assert.equal(await A.evaluate(()=>window.__x),undefined);
    // yarış: aynı anda kabul + ret → biri uygulanır
    await draft(A,E.B,[['give','min',40,'type'],['want','ene',10,'type']]);await preview(A);await sendDraft(A);const o=await lastOffer();
    const race=await B.evaluate(id=>{const J=MP1Join,a='race-a-'+id,b='race-b-'+id;J.seq++;J.sendRaw({v:1,type:'cmd',seq:J.seq,cid:a,cmd:{kind:'respond',offer:id,action:'accept'}});
      J.seq++;J.sendRaw({v:1,type:'cmd',seq:J.seq,cid:b,cmd:{kind:'respond',offer:id,action:'reject'}});return [a,b];},o.id);
    await wait(B,c=>c.every(x=>MP1Join.results.some(r=>r.cid===x)),race);
    assert.deepEqual(await B.evaluate(c=>c.map(x=>{const r=MP1Join.results.find(r=>r.cid===x);return r.status+':'+(r.code||'');}),race),['ok:','rejected:rules:closed']);
    const after=await HS();
    await B.evaluate(c=>{const J=MP1Join;for(let i=0;i<3;i++)J.sendRaw({v:1,type:'cmd',seq:J.seq,cid:c,cmd:{kind:'respond',offer:1,action:'accept'}});},race[0]);
    await B.evaluate(()=>{MP1Join.sendRaw({v:1,type:'cmd',seq:1,cid:'stale-0001',cmd:{kind:'respond',offer:1,action:'accept'}});});await wait(B,()=>MP1Join.results.some(r=>r.cid==='stale-0001'));
    assert.equal(await B.evaluate(()=>MP1Join.results.find(r=>r.cid==='stale-0001').code),'stale-seq');sameState(after,await HS(),'duplicate cid / stale seq apply nothing');
    // stok değişimi: gönderende kaynak kalmazsa kabul reddedilir, hiçbir şey değişmez, teklif bekler
    await draft(A,E.B,[['give','min',300,'type']]);await preview(A);await sendDraft(A);const st=await lastOffer();
    const keep=await H.evaluate(()=>G.emps[1].res.min);await H.evaluate(()=>{G.emps[1].res.min=10;});await sync(B);const s1=await HS();
    const fail=await decide(B,st.id,'accept');assert.equal(fail.code,'rules:quote');assert(fail.detail.some(x=>/karşılayamıyor/.test(x)),'generic reason; A stock not revealed: '+JSON.stringify(fail.detail));
    assert(!fail.detail.some(x=>/stok 10/.test(x)));sameState(s1,await HS(),'failed accept changes nothing');assert.equal((await offerAt(st.id)).status,'pending');
    await wait(B,()=>/uygulanamıyor/.test(document.getElementById('mp2Toast').textContent));
    await H.evaluate(k=>{G.emps[1].res.min=k;},keep);
    // motor içinde hata: executeDeal kendi işlemini geri alır
    await H.evaluate(()=>{G._dealFailInject=w=>{if(w==='after:items')throw Error('inject');};});const s2=await HS();
    const inj=await decide(B,st.id,'accept');await H.evaluate(()=>{delete G._dealFailInject;});assert.equal(inj.code,'rules');sameState(s2,await HS(),'injected failure rolls back');
    assert.equal((await offerAt(st.id)).status,'pending');const ok=await decide(B,st.id,'accept');assert.equal(ok.status,'ok');
    // düşük Etki: barış teklifi önizlemede engel gösterir, GÖNDER kapalı
    await H.evaluate(()=>{declareWar(G.emps[1],G.emps[3]);G.emps[1].res.etkKeep=G.emps[1].res.etk;G.emps[1].res.etk=1;});await advance(1);await sync(A);await sub(A,'emp');
    await A.locator(`[data-d="peace"][data-to="${E.B}"]`).tap();await wait(A,()=>document.querySelector('#mp3Quote .mp1-card'));
    assert.match(await A.textContent('#mp3Quote'),/Engeller:[\s\S]*Etki/);assert.equal(await A.locator('[data-d="send"]').isDisabled(),true);await shot(A,'guest-a-peace-low-etk');
    assert.equal((await raw(A,{kind:'offer',to:E.B,give:[{t:'peace'}],want:[]})).code,'rules:quote','host refuses too');
    await A.locator('[data-d="cancel"]').tap();await H.evaluate(()=>{G.emps[1].res.etk=Math.max(200,G.emps[1].res.etkKeep||0);delete G.emps[1].res.etkKeep;});
    // süre: oyun zamanıyla dolar
    await draft(A,E.B,[['give','min',5,'type']]);await preview(A);await sendDraft(A);const ex=await lastOffer();
    await H.evaluate(n=>MP1Host.advance(n),await H.evaluate(()=>DEAL_OFFER_LIFE+2));await sync(B);
    assert.equal((await offerAt(ex.id)).status,'expired');assert.equal((await raw(B,{kind:'respond',offer:ex.id,action:'accept'})).code,'rules:closed');
    await wait(B,()=>MP1Join.game.view.log.some(x=>/süresi doldu/.test(x.m)));
    // host duraklatılmış: komut uygulanmaz, arayüz nedeni gösterir
    await draft(A,E.B,[['give','min',6,'type']]);await preview(A);await sendDraft(A);const pz=await lastOffer();await sync(B);
    await H.evaluate(()=>MP1Host.host.setPaused(true,'host-background'));const s3=await HS();await sub(B,'in');
    await B.locator(`[data-d="ask"][data-a="accept"][data-id="${pz.id}"]`).tap();await wait(B,()=>!document.querySelector('#mp3Sheet [data-s="ok"]').disabled);
    const n=await nres(B);await B.locator('#mp3Sheet [data-s="ok"]').tap();await wait(B,n=>MP1Join.results.length>n,n);
    assert.equal(await B.evaluate(()=>MP1Join.results.at(-1).code),'paused');sameState(s3,await HS());await wait(B,()=>/duraklatıldı/.test(document.getElementById('mp2Toast').textContent));
    await H.evaluate(()=>MP1Host.host.setPaused(false));assert.equal((await offerAt(pz.id)).status,'pending');
    metrics.peaceWar=await H.evaluate(()=>!!G.emps[1].war[3]);
  });

  await test('peace between humans via the UI: BARIŞ ÖNER previews the host cost; war continues while pending; acceptance runs makePeace through executeDeal; the crossing offer becomes invalid',async()=>{
    if(!(await H.evaluate(()=>!!G.emps[1].war[3])))await H.evaluate(()=>declareWar(G.emps[1],G.emps[3]));
    await H.evaluate(()=>{for(const i of [1,3])G.emps[i].res.etk=Math.max(G.emps[i].res.etk,200);});await advance(1);await sync(A);await sync(B);
    await clean(A);await clean(B);await sub(A,'emp');assert.match(await A.textContent(`[data-emp="${E.B}"]`),/SAVAŞTA/);
    await A.locator(`[data-d="peace"][data-to="${E.B}"]`).tap();await wait(A,()=>document.querySelector('#mp3Quote .mp1-card'));const q=await A.textContent('#mp3Quote');
    const cost=await H.evaluate(()=>DEAL_TREATY_COST.peace);assert.match(q,new RegExp('Etki maliyeti \\(gönderen öder\\): '+cost));await shot(A,'guest-a-peace');await sendDraft(A);const p1=await lastOffer();
    await sub(B,'emp');await B.locator(`[data-d="peace"][data-to="${E.A}"]`).tap();await wait(B,()=>document.querySelector('#mp3Quote .mp1-card'));await sendDraft(B);const p2=await lastOffer();
    assert.equal(await H.evaluate(()=>!!G.emps[1].war[3]),true,'proposing does not end the war');
    const etk=(await R(E.A)).etk;assert.equal((await decide(B,p1.id,'accept')).status,'ok');
    assert.deepEqual(await H.evaluate(()=>[!!G.emps[1].war[3],!!G.emps[3].war[1]]),[false,false]);assert.equal(Math.round(((await R(E.A)).etk-etk)*1000)/1000,-cost);
    assert.equal((await offerAt(p2.id)).status,'invalid');assert.equal((await raw(A,{kind:'respond',offer:p2.id,action:'accept'})).code,'rules:closed');
  });

  await test('host MP diplomacy panel: humans only, same rules through host.local(); host ↔ C trade both ways with two-step confirm; host cannot act on other parties\' offers; host notices go to the host log only',async()=>{
    await H.locator('#mp3HostBtn').tap();await wait(H,()=>document.querySelector('#mp3Host .mp3'));const P='#mp3Host';
    await sub(H,'emp',P);const ids=await H.evaluate(()=>[...document.querySelectorAll('#mp3Host [data-emp]')].map(e=>+e.dataset.emp));
    assert(ids.includes(E.C)&&!ids.includes(E.AI)&&ids.every(i=>[E.A,E.B,E.C].includes(i)),'humans only (AI diplomacy stays in the single-player DİPLOMASİ screen): '+ids);
    assert.equal(await H.evaluate(()=>!!G.emps[0].contact[5]),true,'host knows the AI, yet it is not listed here');await shot(H,'host-panel-contacts');
    const r0=await R(0),rC=await R(E.C),wk=['ene','yiy','ala','min'].find(k=>rC[k]>=40);
    await draft(H,E.C,[['give','min',50,'type'],['want',wk,20,'type']],P);await preview(H,P);await shot(H,'host-panel-draft');await sendDraft(H,P);
    const o=await lastOffer();assert.deepEqual([o.from,o.to,o.status],[0,E.C,'pending']);
    await sync(C);await dipTab(C);await sub(C,'in');{const d=await decide(C,o.id,'accept');assert.equal(d.status,'ok',JSON.stringify(d));}
    const r1=await R(0),c1=await R(E.C);assert.deepEqual([r1.min-r0.min,r1[wk]-r0[wk],c1.min-rC.min,c1[wk]-rC[wk]].map(x=>Math.round(x*1000)/1000),wk==='min'?[-30,-30,30,30]:[-50,20,50,-20]);
    assert.equal(await H.evaluate(()=>G.log.some(x=>/Teklif kabul edildi/.test(x.m))),true,'host notice in the host log');
    await sub(C,'emp');assert.match(await C.textContent('[data-emp="0"]'),/İNSAN/);
    await draft(C,0,[['give','min',30,'type']]);await preview(C);await sendDraft(C);const c=await lastOffer();
    await wait(H,()=>/DİPLOMASİ\s*1/.test(document.getElementById('mp3HostBtn').textContent));
    await sub(H,'in',P);await wait(H,id=>document.querySelector(`#mp3Host [data-offer="${id}"]`),c.id);await shot(H,'host-panel-inbox');
    await decide(H,c.id,'accept',P);assert.equal((await offerAt(c.id)).status,'accepted');
    const ab=await H.evaluate(()=>MP1Host.host.dip.offers.find(r=>r.from===1&&r.to===3).id);
    assert.equal(await H.evaluate(id=>MP1Host.host.local({kind:'respond',offer:id,action:'accept'}).code,ab),'no-offer','host cannot decide for other players');
    assert.equal(await H.evaluate(()=>MP1Host.host.local({kind:'respond',offer:999999,action:'accept'}).code),'no-offer');
    assert.equal(await H.evaluate(()=>G.log.some(x=>/Yeni teklif — Ayşe|Teklif reddedildi — /.test(x.m)&&false)),false);
    const hl=await dipLayout(H,'#mp3Host');assertLayout(hl,'host panel 915×412');metrics.viewports.host915=hl;
    await H.locator('#mp3Host [data-h="close"]').tap();await wait(H,()=>!document.getElementById('mp3Host'));
  });

  await test('G. phone layouts 360×800, 390×844, 412×915, 844×390, 915×412: contacts, draft (keyboard), inbox, sent, history and the confirm sheet — no overflow, ≥44 px, ≥11 px text; the amount field stays visible with a keyboard-sized viewport',async()=>{
    await draft(B,E.A,[['give','min',11,'type'],['want','ene',7,'type']]);await preview(B);await sendDraft(B);const o=await lastOffer();await sync(A);
    for(const [w,h] of [[360,800],[390,844],[412,915],[844,390],[915,412]]){
      await A.setViewportSize({width:w,height:h});await A.waitForTimeout(120);const k=w+'x'+h,m={};
      for(const sb of ['emp','in','out','hist']){await sub(A,sb);const l=await dipLayout(A,'#mp2Dip, .mp2-nav');assertLayout(l,k+' '+sb);m[sb]=l.small.length;}
      await sub(A,'in');await A.locator(`[data-d="ask"][data-a="accept"][data-id="${o.id}"]`).tap();await wait(A,()=>document.getElementById('mp3Sheet'));
      assertLayout(await dipLayout(A,'#mp3Sheet'),k+' sheet');await shot(A,'guest-a-sheet-'+k);await A.locator('#mp3Sheet [data-s="no"]').tap();await wait(A,()=>!document.getElementById('mp3Sheet'));await A.waitForTimeout(450);
      await sub(A,'emp');await A.locator(`[data-d="compose"][data-to="${E.B}"]`).tap();await A.locator('#mp3Amt').tap();await A.keyboard.type('123');
      assert.equal(await A.inputValue('#mp3Amt'),'123');assert.equal(await A.getAttribute('#mp3Amt','inputmode'),'numeric');
      await A.setViewportSize({width:w,height:Math.round(h*.55)});await A.waitForTimeout(400);   // yazılım klavyesi kadar küçülen görünür alan (benzetim)
      const vis=await A.evaluate(()=>{const r=document.getElementById('mp3Amt').getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight&&document.activeElement.id==='mp3Amt';});
      assert(vis,k+' amount input visible with keyboard-sized viewport');await shot(A,'guest-a-keyboard-'+k);
      await A.setViewportSize({width:w,height:h});await A.waitForTimeout(150);await A.locator('[data-d="add"]').tap();
      assertLayout(await dipLayout(A,'#mp2Dip, .mp2-nav'),k+' draft');await shot(A,'guest-a-draft-'+k);await A.locator('[data-d="cancel"]').tap();
      metrics.viewports[k]=m;}
    await A.setViewportSize({width:390,height:844});await sub(A,'in');assert.equal((await decide(A,o.id,'reject')).status,'ok');
  });

  await test('disconnect / reconnect: offline guest cannot act; reload restores the inbox from the host; host offline disables actions until it returns',async()=>{
    await draft(A,E.B,[['give','min',9,'type']]);await preview(A);await sendDraft(A);const o=await lastOffer();await sync(B);
    await B.reload();await wait(B,()=>window.MP1Join&&MP1Join.screen==='game'&&MP1Join.game.view&&MP1Join.game.view.dip);
    await dipTab(B);await sub(B,'in');await wait(B,id=>document.querySelector(`[data-offer="${id}"]`),o.id);
    await H.evaluate(()=>{window.__WS=window.WebSocket;window.WebSocket=class{constructor(){setTimeout(()=>this.onclose&&this.onclose({code:1006}),100);}send(){}close(){}};});   // host ağı yok
    const room=relay.rooms.get(code);const dbg={room:!!room,host:!!(room&&room.host),keys:[...relay.rooms.keys()].length};room.host.socket.destroy();
    try{await wait(B,()=>!MP1Join.hostOnline);}catch(e){dbg.after=!!relay.rooms.get(code).host;dbg.b=await B.evaluate(()=>[MP1Join.hostOnline,MP1Join.screen,MP1Join.packets.slice(-3).map(x=>x.slice(0,60))]);throw Error('host offline not seen '+JSON.stringify(dbg));}await wait(B,()=>/Host bağlı değil/.test(document.getElementById('mp2Dip').textContent));
    assert.equal(await B.locator(`[data-d="ask"][data-a="accept"][data-id="${o.id}"]`).isDisabled(),true,'no action while the host is away');await shot(B,'guest-b-host-offline');
    assert.equal(await B.evaluate(()=>MP1Join.cmd({kind:'respond',offer:1,action:'accept'}).why),'host-yok');
    await H.evaluate(()=>{window.WebSocket=window.__WS;});
    await wait(H,()=>MP1Host.connected&&MP1Host.host.lobby.phase==='ingame',undefined,30000);await wait(B,()=>MP1Join.hostOnline,undefined,30000);
    await wait(B,id=>!document.querySelector(`[data-d="ask"][data-a="accept"][data-id="${id}"]`).disabled,o.id);
    assert.equal((await decide(B,o.id,'accept')).status,'ok');
  });

  await test('H. performance with 4 humans (host + 3 guests): offer/accept round trip, inbox size in snapshot and delta, host publish cost, render cost, memory',async()=>{
    const hp=await H.evaluate(()=>{const t=[];for(let i=0;i<20;i++){const a=performance.now();MP1Host.host.publish();t.push(performance.now()-a);}t.sort((a,b)=>a-b);
      return {publishMedianMs:Math.round(t[10]*100)/100,publishP95Ms:Math.round(t[18]*100)/100,offers:MP1Host.host.dip.offers.length,heapMB:performance.memory?Math.round(performance.memory.usedJSHeapSize/1048576*10)/10:null};});
    const g={};for(const [n,p] of [['A',A],['B',B],['C',C]])g[n]=await p.evaluate(()=>{const d=MP1Join.packets.filter(x=>x.includes('"dip"')&&x.includes('"type":"delta"')).map(x=>x.length).sort((a,b)=>a-b);
      const dg=MP2Game.G.dip?MP2Game.G.dip.U.stats.ms.slice().sort((a,b)=>a-b):[];
      return {dipBytes:JSON.stringify(MP1Join.game.view.dip).length,dipDeltas:d.length,dipDeltaMedian:d[d.length>>1]||0,dipDeltaMax:d[d.length-1]||0,
        snapshotMax:Math.max(...MP1Join.packets.filter(x=>x.includes('"type":"snapshot"')).map(x=>x.length)),renderMedianMs:Math.round((dg[dg.length>>1]||0)*100)/100,
        heapMB:performance.memory?Math.round(performance.memory.usedJSHeapSize/1048576*10)/10:null};});
    metrics.perf={host:hp,guests:g,latency:metrics.latency};
    assert(hp.publishMedianMs<50,'host publish');for(const k of Object.keys(g)){assert(g[k].dipBytes<60000,'inbox size '+k);assert(g[k].renderMedianMs<16,'render '+k);}
    assert(metrics.latency.offerMs<1000&&metrics.latency.acceptMs<1000,'round trip on a local relay');
  });
  assert.equal(errors.length,0,'page errors: '+errors.join(' | '));
}catch(e){results.push({name:'harness',status:'FAIL',error:String(e&&e.stack||e)});console.log('FAIL harness\n'+(e&&e.stack||e));}
finally{
  metrics.pageErrors=errors;fs.writeFileSync(path.join(out,'mp3-results.json'),JSON.stringify({note:'Yerel relay + 4 ayrı Chromium süreci (mobil dokunmatik bağlam). Gerçek internet ya da fiziksel Android DEĞİL. Klavye: Chromium yazılım klavyesi açmaz; görünür alan küçültülerek benzetildi.',results,metrics},null,1));
  for(const b of [bH,bA,bB,bC])if(b)await b.close().catch(()=>{});if(relay)relay.shutdown('test-end');
  const pass=results.filter(r=>r.status==='PASS').length,fail=results.length-pass;console.log('GEÇEN: '+pass+' KALAN: '+fail);process.exit(fail?1:0);
}})();
