'use strict';
/* MP-SYNC-FED.0 S4 — federasyon gündem kuyruğu (#50) MP doğrulaması. Motor: fedAgendaEnqueue / fedAdvanceAgenda / fedAgendaOrder / fedEmergencyId.
   Mevcut beta_board1_agenda_test (FIFO, geri çekme, Save8) ve beta_fed_ai0_emergency_test (acil öncelik) üstüne eksik vakalar:
   A1 savunma (acil) oyu AÇIKKEN başka üyenin ve aynı üyenin başka savaşı için destek talebi verilebilir; sıra / durum görünür; aynı cephe için ikinci talep gerekçeyle reddedilir
   A2 acil savunma (mevcut savaşa katılma) ile henüz başlamamış savaş için saldırı izni (Ortak Savaş İzni) ayrı görünür; saldırı izni acil sayılmaz
   A3 açık oy + olağan kuyruk + acil öneri MP paketiyle yeni host'a taşınır: sıra, kimlik, oy belirteci aynı; kalan oylar yeni host'ta tamamlanır, sıradaki açılır
   A4 düşme nedenleri: savaş biter (acil), öneren ayrılır, hedef elenir, süre dolar — her biri gerekçeyle, bedelsiz; sıradaki geçerli öneri açılır
   A5 çift gönderim (aynı cid), aynı öneri ikinci kez, kapanmış oya geç dokunma: ikinci oy / ikinci kuyruk / ikinci bedel yok
   A6 host + misafir + AI aynı ay içinde öneri: tek aktif oy, FIFO kimlik sırası, misafir aynasında kendi satırı (π) ve sırası */
const fs=require('fs'),assert=require('assert/strict'),{runtime}=require('./helpers/runtime'),{world:base,cmd,J}=require('./helpers/beta-fed-found0-mp-world.cjs');
let pass=0,fail=0;const test=(n,f)=>{try{f();pass++;console.log('PASS '+n);}catch(e){fail++;console.log('FAIL '+n+'\n'+(e&&e.stack||e));}};
/* üyeler 0 (host), 1 (B), 3 (C); D=4 dışarıda. Aktif yasa oyu açık. attack(a,b): a, b'ye saldırır (b savunmada). */
function world(){const h=base();h.run(`G.day=900;G.council=null;for(const e of G.emps){e.mizac='militarist';e.civics=[];e.factions=null;e.nap={};e.peaceAt={};}
  fedFoundPropose(G.p,'bilimsel','equal',[1,3]);fedFoundReply(G.emps[1],1,true);fedFoundReply(G.emps[3],1,true);if(!fedFoundFinish(G.p,1).ok)throw Error('found');
  var F=G.feds[0],laws=Object.keys(FED_LAWS).filter(k=>!F.laws[k]);
  function attack(a,b){for(const id of F.members)G.emps[id].ally[a]=G.emps[a].ally[id]=false;warAuthorize(G.emps[a],G.emps[b],{n:'Test dış saldırı'});if(!declareWar(G.emps[a],G.emps[b]))throw Error('attack');warAuthClear();return warLedgerFind(a,b).id;}
  function votes(yes){const t=fedVoteToken(F.vote);for(const id of fedVoteCounts(F).waiting)castFedVote(G.emps[id],F.id,t,yes!==false);}`);return h;}
const etk=(h,id)=>h.run(`G.emps[${id}].res.etk`);

test('A1 savunma oyu açıkken başka destek talepleri kuyruğa girer (sıra/durum görünür); aynı cephe ikinci kez gerekçeyle reddedilir',()=>{const h=world();
  h.run('var f1=attack(2,1),f2=attack(5,3),f3=attack(4,1);');
  const r1=cmd(h,'B',{kind:'fedMotion',motion:'joinWar',target:2,sponsor:1});assert.equal(r1.status,'ok',JSON.stringify(r1));
  assert.equal(h.run('F.vote&&F.vote.motion'),'joinWar','savunma oyu açıldı');assert.equal(h.run('F.vote.defenseFront'),h.run('f1'));
  const sC=etk(h,3),sB=etk(h,1),tok=h.run('fedVoteToken(F.vote)');
  const r2=cmd(h,'C',{kind:'fedMotion',motion:'joinWar',target:5,sponsor:3});assert.equal(r2.status,'ok','savunma oyu açıkken başka üyenin destek talebi: '+JSON.stringify(r2));
  const r3=cmd(h,'B',{kind:'fedMotion',motion:'joinWar',target:4,sponsor:1});assert.equal(r3.status,'ok','aynı üyenin BAŞKA savaşı için destek talebi: '+JSON.stringify(r3));
  const r4=cmd(h,'C',{kind:'fedLaw',law:h.run('laws[0]')});assert.equal(r4.status,'ok','olağan yasa önerisi de sıraya girer');
  assert.equal(h.run('fedVoteToken(F.vote)'),tok,'aktif oy kesilmedi');assert.equal(etk(h,3),sC,'kuyrukta bedel yok (C)');assert.equal(etk(h,1),sB,'kuyrukta bedel yok (B)');
  /* açık savunma oyu ilk acil açılış (seri 1): ikinci acilden sonra olağan öneri sırasını alır (acil, olağanı süresiz itemez) */
  assert.equal(h.run('F.agenda.emergencyStreak'),1);
  assert.deepEqual(J(h,'fedAgendaOrder(F).map(r=>[r.by,r.defenseFront?"acil":"olağan"])'),[[3,'acil'],[3,'olağan'],[1,'acil']]);
  const dup=cmd(h,'B',{kind:'fedMotion',motion:'joinWar',target:2,sponsor:1});assert.notEqual(dup.status,'ok');assert.match(JSON.stringify(dup),/zaten gündeme|zaten oylan/);
  /* misafir B kendi aynasında kuyruğu ve sırayı görür (π: kendisi 0) */
  const m=J(h,'StarsMirror.build(1).world.feds[0].agenda.items');assert.equal(m.length,3);assert(m.some(r=>r.by===0&&r.defenseFront),'B kendi acil satırını görür');
  /* gerçek STARS gündem listesi (aynı ui.js işlevi) iki acil + olağan, sıra numarası ve ACİL etiketi */
  const html=h.run('UI.fedAgendaList(F)');assert.equal((html.match(/🚨 ACİL SAVUNMA/g)||[]).length,2);assert.match(html,/1\. 🚨 ACİL SAVUNMA · Mevcut Savaşa Katılma/);assert.match(html,/3\. /);});

test('A2 acil savunma ile başlamamış savaş için saldırı izni ayrı; saldırı izni acil değildir',()=>{const h=world();
  h.run('var f1=attack(2,1);');assert.equal(cmd(h,'C',{kind:'fedLaw',law:h.run('laws[0]')}).status,'ok');
  const a=cmd(h,'B',{kind:'fedMotion',motion:'newWar',target:5});assert.equal(a.status,'ok',JSON.stringify(a));
  const d=cmd(h,'B',{kind:'fedMotion',motion:'joinWar',target:2,sponsor:1});assert.equal(d.status,'ok',JSON.stringify(d));
  const rows=J(h,'fedAgendaOrder(F).map(r=>({k:r.options.kind||r.kind,acil:!!r.defenseFront,label:fedAgendaLabel(r)}))');
  assert.equal(h.run('F.vote.law'),h.run('laws[0]'),'C\'nin yasası aktif oy');
  assert.deepEqual(rows.map(r=>[r.k,r.acil]),[['joinWar',true],['newWar',false]],'acil öne; saldırı izni olağan FIFO');
  assert.equal(rows[0].label,'Mevcut Savaşa Katılma');assert.equal(rows[1].label,'Ortak Savaş İzni');
  const html=h.run('UI.fedAgendaList(F)');assert.match(html,/1\. 🚨 ACİL SAVUNMA · Mevcut Savaşa Katılma/);assert.match(html,/2\. Ortak Savaş İzni/);assert(!h.run('!!G.emps[1].war[5]'),'kuyrukta savaş başlamaz');});

test('A3 açık oy + olağan kuyruk + acil öneri MP paketiyle yeni host: sıra, kimlik, belirteç aynı; kalan oylar tamamlanır ve sıradaki açılır',()=>{const a=world();
  a.run(`if(!proposeFedLaw(G.p,laws[0]).ok)throw Error('active');var f1=attack(2,1);`);
  assert.equal(cmd(a,'C',{kind:'fedLaw',law:a.run('laws[1]')}).status,'ok');assert.equal(cmd(a,'B',{kind:'fedMotion',motion:'joinWar',target:2,sponsor:1}).status,'ok');
  assert.equal(cmd(a,'B',{kind:'fedVote',fed:a.run('F.id'),token:a.run('fedVoteToken(F.vote)'),yes:true}).status,'ok','B açık oyda oyunu verdi');
  const before={tok:a.run('fedVoteToken(F.vote)'),yes:J(a,'F.vote.yes'),order:J(a,'fedAgendaOrder(F).map(r=>[r.id,r.by,r.defenseFront||0])'),hist:J(a,'F.agenda.history.map(r=>[r.id,r.status])')};
  a.run('var pkg=MP.snapshot({}).pkg;');const b=runtime();b.sb.pkg=J(a,'pkg');b.sb.rand=k=>'ab'.repeat(k);b.run(fs.readFileSync('research/mp0/mp-core.js','utf8'));
  b.run(`var valid=StarsMP.validatePackage(pkg);if(!valid.ok)throw Error(valid.why);if(!StarsMP.loadWorld(valid.pkg).ok)throw Error('load');var MP=StarsMP.createHost({roomId:'cold',random:rand,send(){},lobby:{generate(){return {ok:false}}},resume:valid.pkg});MP.installGuards();var F=G.feds[0];`);
  assert.equal(b.run('fedVoteToken(F.vote)'),before.tok);assert.deepEqual(J(b,'F.vote.yes'),before.yes,'verilmiş oy korunur');
  assert.deepEqual(J(b,'fedAgendaOrder(F).map(r=>[r.id,r.by,r.defenseFront||0])'),before.order);assert.deepEqual(J(b,'F.agenda.history.map(r=>[r.id,r.status])'),before.hist);
  /* B ikinci kez oy veremez (yeni host'ta da) */
  assert.equal(b.run(`castFedVote(G.emps[1],F.id,'${before.tok}',true).ok`),false,'aynı oy yeni host\'ta ikinci kez sayılmaz');
  const sC=b.run('G.emps[3].res.etk');b.run(`castFedVote(G.emps[3],F.id,fedVoteToken(F.vote),true);if(F.vote&&fedVoteToken(F.vote)==='${before.tok}')castFedVote(G.p,F.id,fedVoteToken(F.vote),true);`);
  assert.equal(b.run('F.vote&&F.vote.motion'),'joinWar','oy kapanınca sıradaki acil savunma açıldı');assert.equal(b.run('F.vote.defenseFront'),before.order[0][2]);
  assert.equal(b.run('G.emps[3].res.etk'),sC,'acil açılış C\'den ücret almaz');assert.equal(b.run('F.agenda.items.length'),1);});

test('A4 düşme nedenleri: savaş biter / öneren ayrılır / hedef elenir / süre dolar — gerekçeyle, bedelsiz; sıradaki geçerli öneri açılır',()=>{
  const modes={war:'makePeace(G.emps[2],G.emps[1],{force:true,quiet:true})',leave:'fedRemoveMember(F,1,"test")',dead:'G.emps[5].dead=true',expired:'F.agenda.items.find(r=>r.by===1).expires=G.day'};
  const want={war:/cephe|savaş/i,leave:/üye/i,dead:/hedef|geçerli/i,expired:/süre/i};
  for(const [m,src] of Object.entries(modes)){const h=world();h.run(`if(!proposeFedLaw(G.p,laws[0]).ok)throw Error('active');var f1=attack(2,1);`);
    const r=m==='war'?cmd(h,'B',{kind:'fedMotion',motion:'joinWar',target:2,sponsor:1}):cmd(h,'B',{kind:'fedMotion',motion:'newWar',target:5});assert.equal(r.status,'ok',m+' '+JSON.stringify(r));
    assert.equal(cmd(h,'C',{kind:'fedLaw',law:h.run('laws[1]')}).status,'ok');const sB=etk(h,1),sC=etk(h,3);
    h.run(src+';votes(true);');
    const row=J(h,'F.agenda.history.find(r=>r.by===1&&r.kind!=="law")');assert(row,m+': B satırı arşivde');assert.notEqual(row.status,'active',m);assert.match(row.status,/invalid|expired/,m);assert.match(row.why,want[m],m+' gerekçe: '+row.why);
    assert.equal(h.run('F.vote&&F.vote.law'),h.run('laws[1]'),m+': sıradaki geçerli öneri (C) açıldı');if(m!=='leave')assert.equal(etk(h,1),sB,m+': düşen öneri bedel almadı');
    assert(etk(h,3)<=sC,m);}});

test('A5 aynı cid tekrar, aynı öneri ikinci kez, kapanmış oya geç dokunma: ikinci kuyruk / oy / bedel yok',()=>{const h=world();h.run(`if(!proposeFedLaw(G.p,laws[0]).ok)throw Error('active');`);
  /* aynı cid'li ileti iki kez (ağ yeniden gönderimi) */
  h.run(`seq.B=(seq.B||0)+1;var msg=JSON.stringify({v:1,type:'cmd',seq:seq.B,cid:'dupB0001',cmd:{kind:'fedLaw',law:laws[1]}});MP.onMessage('B',msg);var s1=JSON.stringify(F.agenda);MP.onMessage('B',msg);`);
  assert.equal(h.run('JSON.stringify(F.agenda)'),h.run('s1'),'aynı cid ikinci satır üretmez');assert.equal(h.run('F.agenda.items.length'),1);
  const again=cmd(h,'C',{kind:'fedLaw',law:h.run('laws[1]')});assert.notEqual(again.status,'ok');assert.match(JSON.stringify(again),/zaten kuyrukta/);
  const tok=h.run('fedVoteToken(F.vote)');h.run('votes(true)');const sB=etk(h,1);
  const late=cmd(h,'B',{kind:'fedVote',fed:h.run('F.id'),token:tok,yes:false});assert.notEqual(late.status,'ok','kapanmış oya geç dokunma reddedilir');
  assert.equal(h.run('F.lastVote&&F.lastVote.passed'),true);assert.equal(etk(h,1),sB);assert.equal(h.run('F.vote&&F.vote.law'),h.run('laws[1]'),'sıradaki tek oy açık');});

test('A6 host + misafir + AI aynı anda öneri: tek aktif oy, kimlik sırasıyla FIFO, aynada kendi satırı',()=>{const h=world();h.run('for(const id of [0,1,3])G.emps[5].ally[id]=G.emps[id].ally[5]=false;');
  h.run(`F.members.push(2);for(const id of F.members)G.emps[2].ally[id]=G.emps[id].ally[2]=true;G.emps[2].ai=true;fedNormalize(F);if(!proposeFedLaw(G.p,laws[0]).ok)throw Error('active');`);
  assert(h.run(`MP.local({kind:'fedLaw',law:laws[1]}).ok`),'host kuyruğa');assert.equal(cmd(h,'B',{kind:'fedLaw',law:h.run('laws[2]')}).status,'ok');
  h.run('var ai=proposeFedLaw(G.emps[2],laws[3]);');assert.equal(h.run('ai.ok'),true,'AI kuyruğa');assert.equal(cmd(h,'C',{kind:'fedMotion',motion:'newWar',target:5}).status,'ok');
  assert.deepEqual(J(h,'fedAgendaOrder(F).map(r=>r.by)'),[0,1,2,3]);assert.equal(h.run('F.vote.law'),h.run('laws[0]'),'tek aktif oy');
  const own=J(h,'StarsMirror.build(3).world.feds[0].agenda.items.map(r=>r.by)');assert.equal(own.filter(x=>x===0).length,1,'C kendi satırını 0 olarak görür');
  h.run('votes(true)');assert.equal(h.run('F.vote.law'),h.run('laws[1]'),'sıradaki host önerisi');assert.equal(h.run('F.agenda.items.length'),3);});

console.log(`GEÇEN: ${pass} KALAN: ${fail}`);if(fail)process.exitCode=1;
