'use strict';
/* MP-SYNC-FED.1 NF-9 — federasyon üyesinin savunma çağrısı. Host 0, misafir B (1), C (3) federasyonda; D (4) dışarıda; AI 2 ve 5 dış devlet.
   p38 kusuru: üye, BAŞKA bir üyenin savunma savaşına destek talebini yalnız o savaşı BİLİYORSA (knownWarPairs: istihbarat ≥3) açabiliyordu; host kapısı izin
   veriyor, misafirin aynasında savaş olmadığı için düğme hiç çıkmıyordu ("host kabul ediyor, misafir düğmeyi göremiyor").
   D1 host (SP arayüzü): fedDefenseCalls C'nin savunmasını gösterir (savunulan, saldırgan, cephe, durum); federasyon panelinde etkin düğme; istihbarat değişmez
   D2 misafir B: host görünümü (pol.fed.defCalls) aynı satırı verir; B'nin aynasında C'nin savaşı YOK (eski kapı reddederdi); B'nin komutu kabul → acil oy
   D3 federasyon dışı D: satır yok, pol.fed yok; ayna / görünüm C'nin savaşını D'ye açmaz
   D4 savunma oyu açıkken başka geçerli savunma talebi sıraya girer; satırlar 'voting' ve 'queued (sıra n)'
   D5 gerekçeler: aynı savaş için ikinci talep reddedilir ve satır durumu söyler; savaş biter → satır kalkar; üye ayrılır → onun satırı kalkar; temassız saldırgan → gerekçe
   D6 kayıt → yeni host: satır durumları aynı; aynı cid yeniden gönderim ikinci kuyruk / oy / Etki kesintisi üretmez
   D7 saf işlev: fedDefenseCalls dünyayı (Save8) ve RNG'yi değiştirmez */
const assert=require('assert/strict'),fs=require('fs'),path=require('path'),crypto=require('crypto'),{runtime}=require('./helpers/runtime');
const ROOT=process.env.STARS_ROOT?path.resolve(process.env.STARS_ROOT):path.resolve(__dirname,'..');
let pass=0,fail=0;const test=(n,f)=>{try{f();pass++;console.log('PASS '+n);}catch(e){fail++;console.log('FAIL '+n+'\n'+(e&&e.stack||e));}};
const J=(h,s)=>JSON.parse(h.run('JSON.stringify('+s+')'));
function world(){const h=runtime({root:ROOT});let n=0;h.sb.out=[];h.sb.rand=k=>crypto.createHash('sha256').update(String(n++)).digest('hex').slice(0,k*2);
  h.run(fs.readFileSync(path.join(ROOT,'research/mp0/mp-core.js'),'utf8'));h.run(fs.readFileSync(path.join(ROOT,'research/mp6/mirror.js'),'utf8'));
  h.run(`var MP=StarsMP.createHost({roomId:'def0',random:rand,send:(c,t)=>out.push([c,t]),kick(){},lobby:{generate(s){setupGame({...CFG,...s});G.autoSave=false;return {ok:true}}}});MP.installGuards();MP.setCapacity(4);MP.configure({size:'orta',aiCount:5,seed:23});
    for(const [c,e]of [['B',1],['C',3],['D',4]]){MP.onMessage(c,JSON.stringify({v:1,type:'hello',name:c}));MP.onMessage(c,JSON.stringify({v:1,type:'claim',empire:e}));MP.onMessage(c,JSON.stringify({v:1,type:'ready',value:true}));}if(!MP.start().ok)throw Error('start');var seq={};
    G.day=900;G.council=null;G.feds=[];for(const e of G.emps){e.overlord=null;e.civics=[];e.mizac='militarist';e.factions=null;e.nap={};e.peaceAt={};e.intel={};}
    for(const e of G.emps)for(const o of G.emps)if(e!==o&&!o.wild){e.ally[o.id]=false;e.rel[o.id]=60;e.war[o.id]=false;e.contact[o.id]=true;}
    for(const r of ['min','ene','ala','yiy','tuk','etk'])for(const id of [0,1,2,3,4])G.emps[id].res[r]=5000;
    fedFoundPropose(G.p,'bilimsel','equal',[1,3]);fedFoundReply(G.emps[1],1,true);fedFoundReply(G.emps[3],1,true);if(!fedFoundFinish(G.p,1).ok)throw Error('found');var F=G.feds[0];
    function attack(a,b){for(const id of F.members)G.emps[id].ally[a]=G.emps[a].ally[id]=false;warAuthorize(G.emps[a],G.emps[b],{n:'Test dış saldırı'});if(!declareWar(G.emps[a],G.emps[b]))throw Error('attack');warAuthClear();return warLedgerFind(a,b).id;}
    function votes(yes){const t=fedVoteToken(F.vote);for(const id of fedVoteCounts(F).waiting)castFedVote(G.emps[id],F.id,t,yes!==false);}
    var front=attack(2,3);`);return h;}
function cmd(h,c,x,cid){const n=h.sb.out.length,s=h.run(`seq['${c}']=(seq['${c}']||0)+1`);h.sb.message=JSON.stringify({v:1,type:'cmd',seq:s,cid:cid||('def0'+c+String(s).padStart(6,'0')),cmd:x});h.run(`MP.onMessage('${c}',message)`);
  return h.sb.out.slice(n).map(([to,t])=>({to,...JSON.parse(t)})).find(m=>m.to===c&&m.type==='result')||{};}
const call=(h,v,enemy,sponsor)=>J(h,`fedDefenseCalls(G.emps[${v}]).find(r=>r.enemy===${enemy}&&r.sponsor===${sponsor})||null`);

test('D1 host: C\'nin savunma savaşı federasyon panelinde görünür ve talep düğmesi etkin; istihbarat gerekmez ve değişmez',()=>{const h=world();
  assert.equal(h.run('intelOf(G.p,3)>=3'),false,'fikstür: host\'un C üzerinde istihbaratı yok');
  const r=call(h,0,2,3);assert(r,'host satırı');assert.equal(r.state,'open');assert.equal(r.ok,1);assert.equal(r.front,h.run('front'));assert.equal(r.known,1);
  const html=h.run('UI.fedGovernance(F,"military")');assert.match(html,/🛡 Savunma çağrıları/);assert.match(html,/data-a="fedMotion" data-x="joinWar:2:3" >Savunma desteği talep et/);
  assert.equal(h.run('intelOf(G.p,3)'),J(h,'G.p.intel[3]||0'),'istihbarat değişmedi');});

test('D2 misafir B: host görünümü aynı satır; B aynasında C\'nin savaşı yok (eski kapı reddeder); B\'nin komutu kabul → acil savunma oyu',()=>{const h=world();
  const row=J(h,'MP.polView(G.emps[1]).fed.defCalls.find(r=>r.enemy===2&&r.sponsor===3)');assert(row&&row.ok===1&&row.state==='open','pol.fed.defCalls '+JSON.stringify(row));
  /* misafirin gerçek aynası: ayrı motorda kur; eski (p38) kapı canFedMotion aynadaki savaşı göremez */
  const m=J(h,'StarsMirror.build(1)');const g=runtime({root:ROOT});g.sb.m=JSON.stringify(m);g.run('if(!deserialize(m))throw Error("des")');
  const pi=x=>x===1?0:x===0?1:x;assert.equal(g.run(`!!G.emps[${pi(3)}].war[${pi(2)}]`),false,'aynada C–2 savaşı yok (gizlilik korunur)');
  assert.equal(J(g,`canFedMotion(G.p,'joinWar',{target:${pi(2)},sponsor:${pi(3)}}).ok`),false,'aynaya dayanan eski kapı reddederdi');
  const etk=h.run('G.emps[1].res.etk');const r=cmd(h,'B',{kind:'fedMotion',motion:'joinWar',target:2,sponsor:3});assert.equal(r.status,'ok',JSON.stringify(r));
  assert.equal(h.run('F.vote&&F.vote.motion'),'joinWar');assert.equal(h.run('F.vote.defenseFront'),h.run('front'));assert.equal(h.run('G.emps[1].res.etk'),etk,'Etki kesintisi yok (bedel 0)');
  assert.equal(call(h,1,2,3).state,'voting');});

test('D3 federasyon dışı D: satır yok, pol.fed yok; C\'nin savaşı D\'nin görünümüne savunma çağrısı olarak girmez',()=>{const h=world();
  assert.deepEqual(J(h,'fedDefenseCalls(G.emps[4])'),[]);assert.equal(J(h,'MP.polView(G.emps[4]).fed'),null);
  assert.equal(JSON.stringify(J(h,'MP.polView(G.emps[4])')).includes('defCalls'),false);});

test('D4 savunma oyu açıkken başka geçerli savunma talebi sıraya girer; durumlar voting ve queued (sıra 1)',()=>{const h=world();
  h.run('var front2=attack(5,0);');assert.equal(cmd(h,'B',{kind:'fedMotion',motion:'joinWar',target:2,sponsor:3}).status,'ok');
  const r=cmd(h,'C',{kind:'fedMotion',motion:'joinWar',target:5,sponsor:0});assert.equal(r.status,'ok','oy açıkken yeni savunma talebi '+JSON.stringify(r));
  assert.equal(call(h,3,2,3).state,'voting');const q=call(h,3,5,0);assert.equal(q.state,'queued');assert.equal(q.position,1);assert.match(q.why,/kuyruğunda \(sıra 1\)/);
  const html=h.run('UI.fedGovernance(F,"military")');assert.match(html,/Oylanıyor/);assert.match(html,/Gündem kuyruğunda · sıra 1/);});

test('D5 gerekçeler: ikinci talep reddedilir ve satır durumu söyler; savaş biter → satır kalkar; üye ayrılır → satırı kalkar; temassız saldırgan → gerekçe',()=>{
  {const h=world();cmd(h,'B',{kind:'fedMotion',motion:'joinWar',target:2,sponsor:3});const r=cmd(h,'C',{kind:'fedMotion',motion:'joinWar',target:2,sponsor:3});assert.notEqual(r.status,'ok');
    assert.match(JSON.stringify(r),/zaten gündeme|zaten oylan/);assert.equal(call(h,3,2,3).ok,0);}
  {const h=world();h.run('makePeace(G.emps[2],G.emps[3],{force:true,quiet:true})');assert.equal(call(h,1,2,3),null,'savaş bitti → satır yok');}
  {const h=world();h.run('fedRemoveMember(F,3,"test")');assert.equal(call(h,1,2,3),null,'üye ayrıldı → satır yok');}
  {const h=world();h.run('G.emps[1].contact[2]=false');const r=call(h,1,2,3);assert(r);assert.equal(r.ok,0);assert.equal(r.known,0);assert.match(r.why,/temas/);
    assert.equal(J(h,'MP.polView(G.emps[1]).fed.defCalls[0].known'),0);}});

test('D6 kayıt → yeni host: durumlar aynı; aynı cid yeniden gönderim ikinci kuyruk / oy / Etki kesintisi üretmez',()=>{const a=world();
  a.run('var front2=attack(5,0);');assert.equal(cmd(a,'B',{kind:'fedMotion',motion:'joinWar',target:2,sponsor:3},'jdupcallB01').status,'ok');
  const before=J(a,'fedDefenseCalls(G.emps[1]).map(r=>[r.enemy,r.sponsor,r.state,r.position])');
  const s0=J(a,'({agenda:JSON.stringify(F.agenda||null),vote:fedVoteToken(F.vote),etk:G.emps[1].res.etk})');
  const dup=cmd(a,'B',{kind:'fedMotion',motion:'joinWar',target:2,sponsor:3},'jdupcallB01');assert.equal(dup.dup,1,'aynı cid yinelenen yanıt');
  assert.deepEqual(J(a,'({agenda:JSON.stringify(F.agenda||null),vote:fedVoteToken(F.vote),etk:G.emps[1].res.etk})'),s0,'ikinci kuyruk / oy / kesinti yok');
  a.run('var pkg=MP.snapshot({}).pkg;');const b=runtime({root:ROOT});b.sb.pkg=J(a,'pkg');b.sb.rand=k=>'ab'.repeat(k);b.run(fs.readFileSync(path.join(ROOT,'research/mp0/mp-core.js'),'utf8'));
  b.run(`var valid=StarsMP.validatePackage(pkg);if(!valid.ok)throw Error(valid.why);if(!StarsMP.loadWorld(valid.pkg).ok)throw Error('load');var MP=StarsMP.createHost({roomId:'cold',random:rand,send(){},lobby:{generate(){return {ok:false}}},resume:valid.pkg});MP.installGuards();var F=G.feds[0];`);
  assert.deepEqual(J(b,'fedDefenseCalls(G.emps[1]).map(r=>[r.enemy,r.sponsor,r.state,r.position])'),before,'yeni host aynı durum');
  assert.equal(b.run('fedVoteToken(F.vote)'),s0.vote);});

test('D7 saf işlev: fedDefenseCalls ve panel çizimi Save8 baytlarını ve RNG\'yi değiştirmez',()=>{const h=world();h.run('var s0=serialize(),r0=RND_STATE;for(const id of [0,1,3,4])fedDefenseCalls(G.emps[id]);UI.fedGovernance(F,"military");MP.polView(G.emps[1]);');
  assert.equal(h.run('serialize()===s0'),true);assert.equal(h.run('RND_STATE===r0'),true);});

console.log(`GEÇEN: ${pass} KALAN: ${fail}`);if(fail)process.exitCode=1;
