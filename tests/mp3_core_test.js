'use strict';
/* MP.3: insan oyuncular arası gerçek diplomasi — host'un gerçek STARS motorunda (Node vm).
   Yeni anlaşma motoru yok: dealQuote / executeDeal / aiRespond. Teklif, kabul, ret, karşı teklif, geri çekme;
   insan → AI (tek oyunculu dealSend yolu), AI → uzak insan (aiNegotiate yönlendirmesi); barış; gizlilik; atomiklik.
   Dünya: seed 22, orta, 5 AI; misafir A=1, B=3, C=4 (C, A–B görüşmesinin üçüncü tarafı, ikisiyle de teması yok).
   1–3 ve 1–5 teması doğal yoldan (keşif) 2. ve 5. ayda kuruluyor; 5 AI kalır. Seed 11'de 3 numaralı devletin
   izolasyonist doktrini (isPurifier) her anlaşmayı motor düzeyinde yasaklıyor; bu yüzden seed 22. */
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');
const {runtime}=require('./helpers/runtime'),{harness}=require('./helpers/95e-fixture');
const {test,end}=harness(),root=path.resolve(__dirname,'..');
const CORE=fs.readFileSync(path.join(root,'research/mp0/mp-core.js'),'utf8');
const STEP='function step(days){for(let i=0;i<days*2;i++){const b=Math.floor(G.day/30);G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();if(Math.floor(G.day/30)>b){monthTick();MP.observeHumans();}}}';
const A=1,B=3,C=4,AI=5,CONN={[A]:'cA',[B]:'cB',[C]:'cC'};
function world(){
  const h=runtime({root});let n=0;h.sb.__rand=k=>crypto.createHash('sha256').update(String(n++)).digest('hex').slice(0,k*2);h.sb.__out=[];
  h.run(CORE);
  h.run(`${STEP}
    var MP=StarsMP.createHost({roomId:'r3',random:__rand,send:(c,t)=>__out.push([c,t]),kick(){},lobby:{generate(s){setupGame({...CFG,...s});applyChosenPersona(G.p,CFG.mizac);G.autoSave=false;return {ok:true};}}});
    MP.installGuards();MP.setCapacity(4);MP.configure({size:'orta',aiCount:5,seed:22});
    for(const [c,e] of [['cA',${A}],['cB',${B}],['cC',${C}]]){MP.onMessage(c,JSON.stringify({v:1,type:'hello',name:c}));MP.onMessage(c,JSON.stringify({v:1,type:'claim',empire:e}));MP.onMessage(c,JSON.stringify({v:1,type:'ready',value:true}));}
    if(!MP.start().ok)throw Error('start');var seq={};step(180);MP.publish();`);
  return h;
}
const J=(h,x)=>JSON.parse(h.run('JSON.stringify('+x+')'));
function cmd(h,who,c,extra={}){const conn=CONN[who],n=h.sb.__out.length,s=h.run(`seq[${JSON.stringify(conn)}]=(seq[${JSON.stringify(conn)}]||0)+1`);
  h.run(`MP.onMessage(${JSON.stringify(conn)},${JSON.stringify(JSON.stringify({v:1,type:'cmd',seq:s,cid:'mp3'+conn+String(s).padStart(5,'0'),cmd:c,...extra}))})`);
  return h.sb.__out.slice(n).filter(([cc])=>cc===conn).map(([,t])=>JSON.parse(t)).find(m=>m.type==='result');}
const st=h=>({save:h.run('serialize()'),rng:h.run('RND_STATE')});
const res=(h,e)=>J(h,`G.emps[${e}].res`);
const res1=(r,v)=>({t:'res',r,v});
function lastView(h,who){const conn=CONN[who];let v=null,base=null;for(const [c,t] of h.sb.__out){if(c!==conn)continue;const m=JSON.parse(t);
  if(m.type==='snapshot'){v=JSON.parse(JSON.stringify(m.view));base=m.rev;}else if(m.type==='delta'&&v&&m.base===base){const o=m.ops||{};
    for(const [s,u] of Object.entries(o.up||{}))Object.assign(v[s],u);for(const [s,r] of Object.entries(o.rm||{}))for(const k of r)delete v[s][k];for(const [s,x] of Object.entries(o.set||{}))v[s]=x;base=m.rev;}}return v;}
const offerOf=(h,who,id)=>lastView(h,who).dip.offers.find(o=>o.id===id);

test('contact is natural (exploration) and A, B, C are human; resources trade A→B through executeDeal: same Save8 as calling the engine directly',()=>{
  const a=world(),b=world();
  assert.deepEqual(J(a,`[G.emps[${A}].contact[${B}],G.emps[${B}].contact[${A}],G.emps[${A}].contact[${AI}],G.emps[${A}].contact[${C}],G.emps[${A}].ai,G.emps[${B}].ai,G.emps[${AI}].ai]`),[true,true,true,false,false,false,true]);
  const r0A=res(a,A),r0B=res(a,B);
  const s0=st(a);const r=cmd(a,A,{kind:'offer',to:B,give:[res1('min',100)],want:[res1('ala',50)]});
  assert.equal(r.status,'ok',JSON.stringify(r));const id=r.extra.offer;assert.deepEqual(st(a),s0,'creating an offer moves nothing');
  const o=offerOf(a,B,id);assert.equal(o.status,'pending');assert.equal(o.from,A);assert.equal(o.to,B);assert.equal(o.round,1);
  assert(lastView(a,B).log.some(x=>/Yeni teklif/.test(x.m)),'B notified');
  assert.equal(cmd(a,B,{kind:'respond',offer:id,action:'accept'}).status,'ok');
  assert.deepEqual([res(a,A).min,res(a,A).ala,res(a,B).min,res(a,B).ala],[r0A.min-100,r0A.ala+50,r0B.min+100,r0B.ala-50],'resources moved exactly');
  assert.equal(offerOf(a,A,id).status,'accepted');assert(lastView(a,A).log.some(x=>/kabul edildi/.test(x.m)));
  b.run(`if(!executeDeal({from:${A},to:${B},give:[{t:'res',r:'min',v:100}],want:[{t:'res',r:'ala',v:50}],born:G.day,expires:G.day+DEAL_OFFER_LIFE}))throw Error('engine')`);
  assert.equal(a.run('serialize()'),b.run('serialize()'),'MP accept == executeDeal');assert.equal(a.run('RND_STATE'),b.run('RND_STATE'));
  const s1=st(a);assert.equal(cmd(a,B,{kind:'respond',offer:id,action:'accept'}).code,'rules:closed','second accept refused');assert.deepEqual(st(a),s1);
});
test('counter-offer: B answers 60 instead of 100 alloy; the old round can no longer be accepted; only the new terms are applied when A accepts',()=>{
  const h=world(),r0A=res(h,A),r0B=res(h,B);
  const id=cmd(h,A,{kind:'offer',to:B,give:[res1('min',250)],want:[res1('ala',100)]}).extra.offer;
  assert.equal(cmd(h,A,{kind:'respond',offer:id,action:'accept'}).code,'rules:not-recipient','sender cannot accept its own offer');
  const c=cmd(h,B,{kind:'counter',offer:id,give:[res1('ala',60)],want:[res1('min',250)]});assert.equal(c.status,'ok',JSON.stringify(c));
  const cid=c.extra.offer,o=offerOf(h,A,cid);assert.deepEqual([o.from,o.to,o.round,o.prev,o.status],[B,A,2,id,'pending']);
  assert.equal(offerOf(h,A,id).status,'countered');
  const s0=st(h);assert.equal(cmd(h,B,{kind:'respond',offer:id,action:'accept'}).code,'rules:closed','the countered round is closed');
  assert.equal(cmd(h,A,{kind:'respond',offer:id,action:'accept'}).code,'rules:not-recipient');assert.equal(cmd(h,B,{kind:'respond',offer:cid,action:'accept'}).code,'rules:not-recipient');
  assert.deepEqual(st(h),s0);
  assert.equal(cmd(h,A,{kind:'respond',offer:cid,action:'accept'}).status,'ok');
  assert.deepEqual([res(h,A).min,res(h,A).ala,res(h,B).min,res(h,B).ala],[r0A.min-250,r0A.ala+60,r0B.min+250,r0B.ala-60]);
  assert.equal(offerOf(h,B,cid).status,'accepted');
});
test('reject moves nothing; accept-vs-reject race resolves once; duplicate cid and stale seq never apply twice; withdraw by the sender only',()=>{
  const h=world();let id=cmd(h,A,{kind:'offer',to:B,give:[res1('min',100)],want:[res1('ene',40)]}).extra.offer;const s0=st(h);
  assert.equal(cmd(h,B,{kind:'respond',offer:id,action:'reject'}).status,'ok');assert.deepEqual(st(h),s0,'reject: no transfer');
  assert.equal(offerOf(h,A,id).status,'rejected');assert(lastView(h,A).log.some(x=>/reddedildi/.test(x.m)));
  assert.equal(cmd(h,B,{kind:'respond',offer:id,action:'accept'}).code,'rules:closed');
  id=cmd(h,A,{kind:'offer',to:B,give:[res1('min',100)],want:[res1('ene',40)]}).extra.offer;
  const m={v:1,type:'cmd',seq:900,cid:'raceacc001',cmd:{kind:'respond',offer:id,action:'accept'}};
  h.run(`MP.onMessage('cB',${JSON.stringify(JSON.stringify(m))});MP.onMessage('cB',${JSON.stringify(JSON.stringify({...m,seq:901,cid:'racerej001',cmd:{kind:'respond',offer:id,action:'reject'}}))})`);
  const after=st(h);const rs=h.sb.__out.filter(([c])=>c==='cB').map(([,t])=>JSON.parse(t)).filter(x=>x.type==='result').slice(-2);
  assert.deepEqual(rs.map(x=>x.status+':'+(x.code||'')),['ok:','rejected:rules:closed']);
  for(let i=0;i<3;i++)h.run(`MP.onMessage('cB',${JSON.stringify(JSON.stringify(m))})`);assert.deepEqual(st(h),after,'duplicate cid once');
  h.run(`MP.onMessage('cB',${JSON.stringify(JSON.stringify({...m,seq:5,cid:'stale00001'}))})`);assert.deepEqual(st(h),after,'stale seq refused');
  h.run('seq.cB=901');id=cmd(h,A,{kind:'offer',to:B,give:[res1('min',50)],want:[]}).extra.offer;
  assert.equal(cmd(h,B,{kind:'withdraw',offer:id}).code,'rules:not-sender');assert.equal(cmd(h,A,{kind:'withdraw',offer:id}).status,'ok');
  assert.equal(offerOf(h,B,id).status,'invalid');
});
test('authorization and validation: third party, forged empire, bad items, self/AI-wild/no-contact targets, own stock and Etki, expiry, paused host — no side effects; no hint of private offers',()=>{
  const h=world();const id=cmd(h,A,{kind:'offer',to:B,give:[res1('min',100)],want:[res1('ala',10)]}).extra.offer;const s0=st(h);
  const wild=J(h,'G.wildId');
  const cases=[[C,{kind:'respond',offer:id,action:'accept'},'no-offer'],[C,{kind:'respond',offer:999999,action:'accept'},'no-offer'],[C,{kind:'counter',offer:id,give:[],want:[res1('min',1)]},'no-offer'],
    [C,{kind:'withdraw',offer:id},'no-offer'],
    [A,{kind:'offer',to:B,give:[res1('min',-5)],want:[]},'bad-params'],[A,{kind:'offer',to:B,give:[res1('min',0)],want:[]},'bad-params'],
    [A,{kind:'offer',to:B,give:[res1('gold',5)],want:[]},'bad-params'],[A,{kind:'offer',to:B,give:[res1('min',1e9)],want:[]},'bad-params'],
    [A,{kind:'offer',to:B,give:[{t:'res',r:'min',v:5,x:1}],want:[]},'bad-params'],[A,{kind:'offer',to:B,give:[{t:'sys',id:1}],want:[]},'bad-params'],
    [A,{kind:'offer',to:B,give:[],want:[]},'bad-params'],[A,{kind:'offer',to:B,give:[res1('min',5)],want:[],from:1},'bad-params'],
    [A,{kind:'offer',to:A,give:[res1('min',5)],want:[]},'rules:no-target'],[A,{kind:'offer',to:wild,give:[res1('min',5)],want:[]},'rules:no-target'],
    [A,{kind:'offer',to:C,give:[res1('min',5)],want:[]},'rules:no-target'],[A,{kind:'offer',to:B,give:[res1('min',9999999)],want:[]},'rules:quote']];
  for(const [who,c,code] of cases){const r=cmd(h,who,c);assert.equal(r.code,code,JSON.stringify(c));assert.deepEqual(st(h),s0,code);}
  assert.equal(cmd(h,A,{kind:'respond',offer:id,action:'accept'},{empire:B}).code,'forged-empire');
  const q=cmd(h,A,{kind:'offer',to:B,give:[res1('min',9999999)],want:[]});assert(q.detail.some(x=>/Mineral/.test(x)),'own-stock reason');
  // B'nin stoğu A'ya hiç söylenmez: B'nin veremeyeceği miktar istenirse teklif bekler, kabulde B kendi gerekçesini görür
  const big=cmd(h,A,{kind:'offer',to:B,give:[res1('min',10)],want:[res1('ala',9999999)]});assert.equal(big.status,'ok');assert(!JSON.stringify(big).includes('stok'));
  const acc=cmd(h,B,{kind:'respond',offer:big.extra.offer,action:'accept'});assert.equal(acc.code,'rules:quote');assert(acc.detail.some(x=>/Alaşım/.test(x)));assert.deepEqual(st(h),s0);
  // gönderen kabulden önce stoğunu harcadı: alıcıya gönderenin stoğu gösterilmez
  h.run(`G.emps[${A}].res.min=5`);const s1=st(h);const late=cmd(h,B,{kind:'respond',offer:id,action:'accept'});
  assert.equal(late.code,'rules:quote');assert(late.detail.includes('Karşı taraf bu şartları şu an karşılayamıyor'));assert(!late.detail.some(x=>x.startsWith(J(h,`G.emps[${A}].name`))));assert.deepEqual(st(h),s1);
  // süre: oyun zamanıyla dolar; süpürme iki tarafa bildirir, kabul kapalı
  h.run(`G.emps[${A}].res.min=500;step(DEAL_OFFER_LIFE+31);MP.publish()`);assert.equal(offerOf(h,B,id).status,'expired');
  assert.equal(cmd(h,B,{kind:'respond',offer:id,action:'accept'}).code,'rules:closed');assert(lastView(h,A).log.some(x=>/süresi doldu/.test(x.m)));
  h.run('MP.setPaused(true,"host-background")');assert.equal(cmd(h,A,{kind:'offer',to:B,give:[res1('min',5)],want:[]}).code,'paused');h.run('MP.setPaused(false)');
});
test('atomicity: a failure injected inside executeDeal rolls everything back; the offer stays pending and can still be accepted once',()=>{
  const h=world();const id=cmd(h,A,{kind:'offer',to:B,give:[res1('min',100)],want:[res1('ala',20)]}).extra.offer;const s0=st(h);
  for(const at of ['after:items','after:cost','after:goodwill','after:recalc']){
    h.run(`G._dealFailInject=w=>{if(w===${JSON.stringify(at)})throw Error('inject')}`);const r=cmd(h,B,{kind:'respond',offer:id,action:'accept'});
    h.run('delete G._dealFailInject');assert.equal(r.code,'rules',at);assert.deepEqual(st(h),s0,'rolled back at '+at);assert.equal(offerOf(h,B,id).status,'pending');}
  assert.equal(cmd(h,B,{kind:'respond',offer:id,action:'accept'}).status,'ok');assert.notDeepEqual(st(h),s0);
});
test('peace between humans: proposing does not end the war; acceptance runs the engine (makePeace via executeDeal); an old peace offer after peace is refused',()=>{
  const h=world();assert.equal(J(h,`declareWar(G.emps[${A}],G.emps[${B}])`),true);assert.equal(J(h,`!!G.emps[${A}].war[${B}]`),true);
  h.run(`G.emps[${A}].res.etk=Math.max(G.emps[${A}].res.etk,200);G.emps[${B}].res.etk=Math.max(G.emps[${B}].res.etk,200)`);h.run('MP.publish()');
  assert.deepEqual(lastView(h,A).dip.contacts.find(c=>c.id===B),{id:B,h:1,war:1,peace:1});
  const p1=cmd(h,A,{kind:'offer',to:B,give:[{t:'peace'}],want:[]});assert.equal(p1.status,'ok',JSON.stringify(p1));
  const p2=cmd(h,B,{kind:'offer',to:A,give:[{t:'peace'}],want:[]});assert.equal(p2.status,'ok');
  assert.equal(J(h,`!!G.emps[${A}].war[${B}]`),true,'war continues while the offer waits');
  const etk=res(h,A).etk;assert.equal(cmd(h,B,{kind:'respond',offer:p1.extra.offer,action:'accept'}).status,'ok');
  assert.deepEqual(J(h,`[!!G.emps[${A}].war[${B}],!!G.emps[${B}].war[${A}]]`),[false,false]);assert.equal(res(h,A).etk,etk-J(h,`DEAL_TREATY_COST.peace`),'peace cost charged to the proposer');
  const s0=st(h);const old=cmd(h,A,{kind:'respond',offer:p2.extra.offer,action:'accept'});assert.equal(old.code,'rules:quote');assert.deepEqual(st(h),s0);
  // Etki yetmezse barış teklifi gönderilemez
  assert.equal(J(h,`declareWar(G.emps[${A}],G.emps[${B}])`),true);h.run(`G.emps[${A}].res.etk=1`);
  const poor=cmd(h,A,{kind:'offer',to:B,give:[{t:'peace'}],want:[]});assert.equal(poor.code,'rules:quote');assert(poor.detail.some(x=>/Etki/.test(x)));
});
test('human → AI uses the single-player path (dealQuote → aiRespond → executeDeal): accept equals the engine; an unattractive offer is refused or countered, and an AI counter can be accepted',()=>{
  const a=world(),b=world();
  const give=[res1('min',300)],want=[res1('ene',10)];
  const r=cmd(a,A,{kind:'offer',to:AI,give,want});assert.equal(r.status,'ok',JSON.stringify(r));assert.equal(r.extra.ai,'kabul');
  b.run(`(()=>{const q=dealQuote({from:${A},to:${AI},give:${JSON.stringify(give)},want:${JSON.stringify(want)},born:G.day,expires:G.day+DEAL_OFFER_LIFE});const r=aiRespond(G.emps[${AI}],q.norm);if(r.v!=='kabul'||!executeDeal(q.norm))throw Error('engine '+r.v);})()`);
  assert.equal(a.run('serialize()'),b.run('serialize()'),'human→AI == single-player dealSend');assert.equal(a.run('RND_STATE'),b.run('RND_STATE'));
  // tek taraflı istek: AI ya reddeder ya karşı teklif verir; insan adına hiçbir şey uygulanmaz
  const h=world();let counter=null,refused=null;
  const stock=res(h,AI),rk=['min','ene','yiy','ala'].sort((x,y)=>stock[y]-stock[x])[0];
  for(const f of [.05,.15,.3,.6,.9]){const v=Math.max(1,Math.floor(stock[rk]*f)),s0=st(h);const x=cmd(h,A,{kind:'offer',to:AI,give:[],want:[res1(rk,v)]});assert.equal(x.status,'ok',JSON.stringify(x));
    if(x.extra.ai==='red'){refused=refused||x;assert.deepEqual(st(h),s0,'AI refusal changes nothing');}
    if(x.extra.ai==='karsi'){counter=counter||x;assert.deepEqual(st(h),s0,'counter changes nothing');}}
  assert(refused||counter,'AI answered without accepting a one-sided demand');
  console.log('   insan→AI tek taraflı istek ('+rk+'): '+(refused?'red':'-')+' / '+(counter?'karşı teklif':'-'));
  /* Karşı teklif yolu: AI ek kaynak isteyebilmek için karşı tarafın stoğunu bilmeli (aiKnownResources: istihbarat ≥3).
     Doğal durumda bu dünyada yok; burada AÇIKÇA fikstürle istihbarat 3 yapılıyor (doğal AI davranışı sayılmaz). */
  if(!counter){h.run(`ensureIntel(G.emps[${AI}])[${A}]=3`);
    for(const f of [.3,.6,.9]){const v=Math.max(1,Math.floor(stock[rk]*f)),s0=st(h);const x=cmd(h,A,{kind:'offer',to:AI,give:[res1('min',20)],want:[res1(rk,v)]});
      if(x.status==='ok'&&x.extra.ai==='karsi'){counter=x;assert.deepEqual(st(h),s0,'counter changes nothing');break;}}
    assert(counter,'AI counter with intel 3 (fixture)');}
  if(counter){const o=offerOf(h,A,counter.extra.counter);assert.deepEqual([o.from,o.to,o.by,o.status],[AI,A,'ai','pending']);
    const before=res(h,A);assert.equal(cmd(h,A,{kind:'respond',offer:o.id,action:'accept'}).status,'ok');assert.notDeepEqual(res(h,A),before,'AI counter executed');}
});
test('AI → remote human: AI diplomacy calls aimed at a human land in that player\'s inbox (natural AI turns, no fixture); AI never decides; human accept runs executeDeal',()=>{
  const h=world();let months=0;
  while(J(h,'MP.stats.aiOffers||0')===0&&months<60){h.run('step(30);MP.publish()');months++;}
  const ai=J(h,`MP.dip.offers.filter(r=>r.by==='ai'&&r.round===1)`);
  assert(ai.length>0,'no natural AI→human offer in '+months+' months');
  for(const r of ai)assert([A,B,C].includes(r.to),'routed to a human');
  const p=ai.find(r=>r.status==='pending');assert(p,'pending AI offer');const who=p.to;
  assert(lastView(h,who).dip.offers.some(o=>o.id===p.id&&o.by==='ai'),'visible in the human inbox');
  const q=J(h,`dealQuote(${JSON.stringify({from:p.from,to:p.to,give:p.give,want:p.want,born:p.born,expires:p.expires})}).ok`);
  const r=cmd(h,who,{kind:'respond',offer:p.id,action:q?'accept':'reject'});assert.equal(r.status,'ok',JSON.stringify(r));
  assert.equal(offerOf(h,who,p.id).status,q?'accepted':'rejected');
  console.log('   doğal AI→insan teklifleri: '+ai.length+' ('+months+' ayda) · türler '+[...new Set(ai.flatMap(r=>r.give.concat(r.want).map(i=>i.t)))].join(','));
});
test('privacy: C never receives A–B offer ids, terms, amounts or counter rounds; only the parties get them',()=>{
  const h=world();const id=cmd(h,A,{kind:'offer',to:B,give:[res1('min',137)],want:[res1('ala',71)]}).extra.offer;
  const cid=cmd(h,B,{kind:'counter',offer:id,give:[res1('ala',43)],want:[res1('min',137)]}).extra.offer;h.run('MP.publish()');
  const pkC=h.sb.__out.filter(([c])=>c==='cC').map(([,t])=>t);
  for(const t of pkC){const m=JSON.parse(t);const d=(m.view&&m.view.dip)||(m.ops&&m.ops.set&&m.ops.set.dip);if(d)assert.equal(d.offers.length,0,'C sees no offers');
    const am=t.match(/.{0,60}("v":(137|71|43)\b|\b(137|71|43) (Mineral|Alaşım)).{0,20}/);assert(!am,'amounts '+(am&&am[0]));assert(!new RegExp('"id":('+id+'|'+cid+'),"from"').test(t),'offer ids');}
  for(const w of [A,B])assert.deepEqual(lastView(h,w).dip.offers.map(o=>o.id).sort(),[id,cid].sort());
  // C'nin yanıtı "yok" ile aynı: teklifin varlığı sızmaz
  assert.equal(cmd(h,C,{kind:'respond',offer:id,action:'reject'}).code,cmd(h,C,{kind:'respond',offer:424242,action:'reject'}).code);
});
test('single player and AI–AI diplomacy untouched: lobby host without remote humans and the MP.3 guards keeps Save8/RNG identical to the plain engine over 120 days',()=>{
  const a=runtime({root});a.run(`setupGame({...CFG,size:'orta',aiCount:5,seed:22});applyChosenPersona(G.p,CFG.mizac);G.autoSave=false;${STEP.replace('MP.observeHumans();','')};step(120)`);
  const b=runtime({root});b.sb.__r=n=>'ab'.repeat(n);b.run(CORE);
  b.run(`${STEP.replace('MP.observeHumans();','')};var MP=StarsMP.createHost({roomId:'x',random:__r,send(){},lobby:{generate(s){setupGame({...CFG,...s});applyChosenPersona(G.p,CFG.mizac);G.autoSave=false;return {ok:true};}}});
    MP.installGuards();MP.configure({size:'orta',aiCount:5,seed:22});step(120);MP.publish()`);
  assert.equal(b.run('serialize()'),a.run('serialize()'));assert.equal(b.run('RND_STATE'),a.run('RND_STATE'));
});
end();
