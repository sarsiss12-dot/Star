'use strict';
/* MP.7.1 — tek STARS arayüzü köprüsü (research/mp71/client/mp71-dip.js) host'un GERÇEK motorunda (Node vm).
   Host = devlet 0 (gerçek STARS arayüzü), uzak insanlar A=1, B=3 (seed 22, orta, 5 AI; mp3_core_test ile aynı dünya).
   Sınanan: insan → host teklifi host'un GERÇEK gelen kutusuna (bildirim kartı + DiplomaticInbox kaydı) girer; gelen kutusu
   kabul / ret kararı MP.3 'respond' komutundan geçer (tek oyunculu doğrudan executeDeal / ret yaptırımı yok); geri çekme ve süre
   dolumu kaydın durumuna yansır; host'un gerçek anlaşma penceresi (UI.dealSend) insan hedefe 'offer' gönderir; gönderenin stoğu
   gelen kutusu kapısında gizli; yinelenen karar tek uygulanır; MP.4 paketi sonrası eşleşme sürer; köprü insan teklifi yokken
   Save8 / RNG'ye dokunmaz. */
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');
const {runtime}=require('./helpers/runtime'),{harness}=require('./helpers/95e-fixture');
const {test,end}=harness(),root=path.resolve(__dirname,'..');
const CORE=fs.readFileSync(path.join(root,'research/mp0/mp-core.js'),'utf8'),BRIDGE=fs.readFileSync(path.join(root,'research/mp71/client/mp71-dip.js'),'utf8');
const STEP='function step(days){for(let i=0;i<days*2;i++){const b=Math.floor(G.day/30);G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();if(Math.floor(G.day/30)>b){monthTick();MP.observeHumans();}}}';
const A=1,B=3,CONN={[A]:'cA',[B]:'cB'};
/* köprünün host bağdaştırıcısı: mp1-host.js mp71Tick ile aynı alanlar (host.local ile aynı denetimler) */
const ADAPTER=`var __toasts=[];MP71Dip.attach({role:'host',on:()=>true,me:()=>G.p.id,offers:()=>MP.dipView(G.p).offers,raw:()=>MP.dip.offers,local:id=>id,real:id=>id,
  human:id=>{const o=G.emps[id];return !!o&&o!==G.p&&o.ai===false&&!o.wild&&!o.crisisSide&&!o.dead;},
  exec:c=>{const x=MP.local(c);return {ok:!!x.ok,code:x.code||null,detail:x.detail,extra:x.extra};},day:()=>G.day,toast:(t,b)=>__toasts.push([t,!!b]),
  send:(c,done)=>{const x=MP.local(c);if(done)done({status:x.ok?'ok':'rejected',code:x.code,detail:x.detail,extra:x.extra});return 1;},
  record:id=>null});`;
function world(o={}){
  const h=runtime({root});let n=0;h.sb.__rand=k=>crypto.createHash('sha256').update(String(n++)).digest('hex').slice(0,k*2);h.sb.__out=[];
  h.run(CORE);
  h.run(`${STEP}
    var MP=StarsMP.createHost({roomId:'r71',random:__rand,send:(c,t)=>__out.push([c,t]),kick(){},hostNotify(){},lobby:{generate(s){setupGame({...CFG,...s});applyChosenPersona(G.p,CFG.mizac);G.autoSave=false;return {ok:true};}}});
    MP.installGuards();MP.setCapacity(3);MP.configure({size:'orta',aiCount:5,seed:22});
    for(const [c,e] of [['cA',${A}],['cB',${B}]]){MP.onMessage(c,JSON.stringify({v:1,type:'hello',name:c}));MP.onMessage(c,JSON.stringify({v:1,type:'claim',empire:e}));MP.onMessage(c,JSON.stringify({v:1,type:'ready',value:true}));}
    if(!MP.start().ok)throw Error('start');var seq={};step(180);
    for(const a of [0,${A},${B}])for(const b of [0,${A},${B}])if(a!==b){G.emps[a].contact[b]=true;}
    for(const e of [0,${A},${B}]){G.emps[e].res.min=Math.max(G.emps[e].res.min,3000);G.emps[e].res.ene=Math.max(G.emps[e].res.ene,3000);G.emps[e].res.ala=Math.max(G.emps[e].res.ala,500);}
    MP.publish();`);
  if(o.bridge!==false){h.run(BRIDGE);h.run(ADAPTER);}
  return h;
}
const J=(h,x)=>JSON.parse(h.run('JSON.stringify('+x+')'));
function cmd(h,who,c){const conn=CONN[who],n=h.sb.__out.length,s=h.run(`seq[${JSON.stringify(conn)}]=(seq[${JSON.stringify(conn)}]||0)+1`);
  h.run(`MP.onMessage(${JSON.stringify(conn)},${JSON.stringify(JSON.stringify({v:1,type:'cmd',seq:s,cid:'m71'+conn+String(s).padStart(5,'0'),cmd:c}))})`);
  return h.sb.__out.slice(n).filter(([cc])=>cc===conn).map(([,t])=>JSON.parse(t)).find(m=>m.type==='result');}
const res1=(r,v)=>({t:'res',r,v});
const rec=(h,id)=>J(h,`(()=>{const o=MP.dip.offers.find(x=>x.id===${id});const k='deal:'+offerSignature({from:o.from,to:0,give:o.give,want:o.want})+':'+o.born;
  const r=DiplomaticInbox.state().records.find(x=>x.key===k);return r?{id:r.id,status:r.status,why:r.why||'',sub:r.sub,card:(G.inbox||[]).some(n=>n.key==='mp71:${id}')}:null;})()`);
const dip=(h,id)=>J(h,`MP.dip.offers.find(x=>x.id===${id})`);

test('insan → host teklifi host\'un GERÇEK gelen kutusuna girer (bildirim kartı + kayıt, tek kez); kabul MP.3 respond ile: kaynaklar tam bir kez, dünya MP komutuyla aynı, ikinci karar reddedilir',()=>{
  const h=world(),twin=world({bridge:false});
  const send=w=>cmd(w,A,{kind:'offer',to:0,give:[res1('min',200)],want:[res1('ene',50)]});
  const id=send(h).extra.offer;assert.equal(send(twin).extra.offer,id);
  assert.equal(rec(h,id),null,'before the bridge tick nothing is captured');
  h.run('MP71Dip.sync();MP71Dip.sync();');
  const r=rec(h,id);assert.deepEqual([r.status,r.card],['pending',true]);
  assert.equal(J(h,`DiplomaticInbox.state().records.filter(r=>r.kind==='aideal'&&r.from===${A}).length`),1,'no duplicate record');
  assert.equal(J(h,`(G.inbox||[]).filter(n=>n.key==='mp71:${id}').length`),1,'one card');
  const g=J(h,`DiplomaticInbox.gate(DiplomaticInbox.get(${r.id}))`);assert.equal(g.ok,true,JSON.stringify(g));
  const out=J(h,`DiplomaticInbox.resolve(${r.id},true,'haracguzar',G.emps)`);assert.deepEqual(out,{ok:true});
  twin.run(`if(!MP.local({kind:'respond',offer:${id},action:'accept'}).ok)throw Error('twin')`);
  assert.equal(dip(h,id).status,'accepted');assert.deepEqual(J(h,`[G.emps[0].res,G.emps[${A}].res]`),J(twin,`[G.emps[0].res,G.emps[${A}].res]`),'same resources as the plain MP command');
  assert.equal(h.run('RND_STATE'),twin.run('RND_STATE'),'same RNG');
  const r2=rec(h,id);assert.deepEqual([r2.status,r2.card],['accepted',false]);
  const s0=h.run('serialize()');assert.equal(J(h,`DiplomaticInbox.resolve(${r.id},true,'haracguzar',G.emps)`).ok,false,'second accept refused');
  assert.equal(cmd(h,A,{kind:'respond',offer:id,action:'accept'}).code,'rules:not-recipient');assert.equal(h.run('serialize()'),s0,'nothing changed');
});
test('ret: MP.3 respond reject — gönderene ilişki cezası ve 27 aylık tekrar yasağı (tek oyunculu AI ret yaptırımı) UYGULANMAZ; kayıt Reddedildi',()=>{
  const h=world();const id=cmd(h,A,{kind:'offer',to:0,give:[res1('min',100)],want:[]}).extra.offer;h.run('MP71Dip.sync()');
  const rel0=J(h,`G.emps[${A}].rel[0]`),ref0=J(h,'JSON.stringify(G.p.offerRefusals||null)');
  assert.deepEqual(J(h,`DiplomaticInbox.resolve(${rec(h,id).id},false,'haracguzar',G.emps)`),{ok:true});
  assert.equal(dip(h,id).status,'rejected');assert.equal(rec(h,id).status,'rejected');
  assert.equal(J(h,`G.emps[${A}].rel[0]`),rel0);assert.equal(J(h,'JSON.stringify(G.p.offerRefusals||null)'),ref0);
  h.run('MP.publish()');assert(h.sb.__out.some(([c,t])=>c==='cA'&&/Teklif reddedildi/.test(t)),'sender notified');
});
test('geri çekme ve süre dolumu host\'un gelen kutusu kaydına yansır (Geçersizleşti · Gönderen geri çekti / Süresi doldu), kart kalkar; kayıt artık kabul edilemez',()=>{
  const h=world();const w=cmd(h,A,{kind:'offer',to:0,give:[res1('min',100)],want:[]}).extra.offer;const x=cmd(h,B,{kind:'offer',to:0,give:[res1('ene',100)],want:[]}).extra.offer;h.run('MP71Dip.sync()');
  assert.equal(cmd(h,A,{kind:'withdraw',offer:w}).status,'ok');h.run('MP71Dip.sync()');
  const r=rec(h,w);assert.deepEqual([r.status,r.card],['invalid',false]);assert.match(r.why,/geri çekti/);assert.match(r.sub,/Gönderen geri çekti/);
  assert.equal(J(h,`DiplomaticInbox.resolve(${r.id},true,'haracguzar',G.emps)`).ok,false);
  h.run(`step(Math.ceil(MP.dip.offers.find(o=>o.id===${x}).expires-G.day)+2);MP.publish();MP71Dip.sync();`);
  assert.equal(dip(h,x).status,'expired');assert.equal(rec(h,x).status,'expired');assert.equal(rec(h,x).card,false);
});
test('gizlilik: gelen kutusu kapısı gönderenin kendi stok satırlarını göstermez (MP.3 dipReasons ile aynı); kabul host\'ta yine tam denetlenir',()=>{
  const h=world();const id=cmd(h,A,{kind:'offer',to:0,give:[res1('min',2500)],want:[]}).extra.offer;h.run('MP71Dip.sync()');
  h.run(`G.emps[${A}].res.min=10;`);   // gönderen sonradan harcadı
  const g=J(h,`DiplomaticInbox.gate(DiplomaticInbox.get(${rec(h,id).id}))`);
  assert.equal(g.ok,false);assert(!/10|2500/.test(g.why.replace(/\d+ Etki/,'')),g.why);assert.match(g.why,/Karşı taraf/);
  assert.equal(J(h,`DiplomaticInbox.resolve(${rec(h,id).id},true,'haracguzar',G.emps)`).ok,false);assert.equal(dip(h,id).status,'pending','refused by host rules, still pending');
});
test('host\'un GERÇEK anlaşma penceresi (UI.dealSend) insan hedefe MP.3 offer gönderir (AI yolu / aiRespond yok); desteklenmeyen madde gönderilmez; AI hedefte tek oyunculu yol aynen',()=>{
  const h=world();
  h.run(`UI.ensureDiploWorld();UI.deal={from:0,to:${A},give:[{t:'res',r:'min',v:120}],want:[{t:'res',r:'ene',v:30}]};UI.diploTarget=${A};UI.diploPage='deal';UI.dealSend();`);
  const o=J(h,`MP.dip.offers.filter(o=>o.from===0&&o.to===${A})`);assert.equal(o.length,1);assert.deepEqual([o[0].status,o[0].give[0].v,o[0].want[0].v],['pending',120,30]);
  assert.match(J(h,'UI.dealMsg'),/gelen kutusunda/);
  h.run(`UI.deal={from:0,to:${A},give:[{t:'tech',id:Object.keys(G.p.techs)[0]}],want:[]};UI.dealSend();`);
  assert.equal(J(h,`MP.dip.offers.filter(o=>o.from===0&&o.to===${A}).length`),1,'tech item not sent');assert.match(J(h,'UI.dealMsg'),/teknoloji/);
  /* AI hedef: MP deposu değişmez (tek oyunculu aiRespond yolu) */
  const ai=J(h,'G.emps.find(e=>e.ai&&!e.wild&&!e.dead&&G.p.contact[e.id]).id');const n0=J(h,'MP.dip.offers.length');
  h.run(`UI.deal={from:0,to:${ai},give:[{t:'res',r:'min',v:50}],want:[]};UI.dealSend();`);assert.equal(J(h,'MP.dip.offers.length'),n0);
  /* misafir A gelen teklife karşı teklif verir; host'un kaydı 'countered' olur ama host'un KENDİ teklifi olduğu için gelen kutusunda değil, Gönderilen görünümünde */
  const id=o[0].id;assert.equal(cmd(h,A,{kind:'counter',offer:id,give:[res1('ene',30)],want:[res1('min',60)]}).status,'ok');h.run('MP71Dip.sync()');
  assert.equal(dip(h,id).status,'countered');const c=J(h,`MP.dip.offers.find(o=>o.prev===${id})`);assert.equal(rec(h,c.id).status,'pending','counter reaches host inbox');
  assert.equal(J(h,`MP71Dip.stateText(MP.dipView(G.p).offers.find(o=>o.id===${id}),MP.dipView(G.p).offers)`),'Karşı teklif geldi · senin yanıtın bekleniyor');
});
test('MP.4 paketi: teklif deposu (durumlar) ve host\'un gelen kutusu kaydı korunur; yüklenen dünyada kayıt yine MP teklifine bağlıdır ve kararı respond\'dan geçer',()=>{
  const h=world();const id=cmd(h,A,{kind:'offer',to:0,give:[res1('min',100)],want:[]}).extra.offer;h.run('MP71Dip.sync()');
  const done=cmd(h,B,{kind:'offer',to:0,give:[res1('ene',10)],want:[]}).extra.offer;h.run(`MP71Dip.sync();DiplomaticInbox.resolve(DiplomaticInbox.state().records.find(r=>r.from===${B}).id,false,'x',G.emps);`);
  const pkg=h.run('JSON.stringify(MP.snapshot({}).pkg)');
  const v=J(h,`StarsMP.validatePackage(${JSON.stringify(pkg)}).ok`);assert.equal(v,true);
  const g=world();g.run(`var __pkg=StarsMP.validatePackage(${JSON.stringify(pkg)}).pkg;if(!StarsMP.loadWorld(__pkg).ok)throw Error('load');
    MP=StarsMP.createHost({roomId:'r71b',random:__rand,send:(c,t)=>__out.push([c,t]),kick(){},hostNotify(){},lobby:{generate(){return {ok:false};}},resume:__pkg});MP.installGuards();`);
  assert.deepEqual(J(g,`[MP.dip.offers.find(o=>o.id===${id}).status,MP.dip.offers.find(o=>o.id===${done}).status]`),['pending','rejected']);
  assert.equal(rec(g,id).status,'pending');assert.equal(rec(g,done).status,'rejected');
  g.run(`MP71Dip.sync()`);assert.equal(J(g,`DiplomaticInbox.state().records.filter(r=>r.kind==='aideal'&&r.from===${A}).length`),1,'no duplicate after load');
});
test('vasallık (host paneli yok): misafir A host\'tan himaye ister (MP.3.1 vassalOffer); talep host\'un GERÇEK gelen kutusunda vasallık kaydı olur, AI karar vermez; host kararı gelen kutusundan (motorun vassalReply\'ı) verir',()=>{
  const h=world();
  /* fikstür: host'un donanması güçlendirilir (himaye kapısı güç oranı ister); kurallar motorun */
  h.run(`for(const f of G.fleets.filter(f=>f.e===0&&f.ships.length))f.ships=f.ships.concat(...Array.from({length:6},()=>f.ships.map(x=>({...x}))));G.p._powAt=-1;G.emps[${A}]._powAt=-1;`);
  const r=cmd(h,A,{kind:'vassalOffer',to:0,mode:'seek',type:'bekci',terms:{}});assert.equal(r.status,'ok',JSON.stringify(r)+' '+JSON.stringify(J(h,`canSeekProtection(G.emps[${A}],G.p)`)));
  const q=J(h,`G.emps[${A}].vassalTalk`);assert.deepEqual([q.status,q.to,q.from],['pending',0,A],'pending for the host — no AI decision for a human');
  h.run('DiplomaticInbox.sync()');const rec=J(h,`DiplomaticInbox.state().records.find(r=>r.kind==='vassal'&&r.status==='pending')`);assert(rec,'vassal record in the host inbox');
  assert.deepEqual(J(h,`DiplomaticInbox.resolve(${rec.id},false,'bekci',G.emps)`),{ok:true});
  assert.equal(J(h,`G.emps[${A}].vassalTalk.status`),'rejected');assert.equal(J(h,`isVassal(G.emps[${A}])`),false);
});
test('Save8 / RNG: insan teklifi yokken köprü (sarmalayıcılar + her gün tick) 90 günde dünyayı değiştirmez; AI kararları (dealQuote) aynı',()=>{
  const a=world(),b=world({bridge:false});
  a.run('for(let d=0;d<90;d++){step(1);MP.publish();MP71Dip.tick();}');b.run('for(let d=0;d<90;d++){step(1);MP.publish();}');
  assert.equal(a.run('serialize()'),b.run('serialize()'));assert.equal(a.run('RND_STATE'),b.run('RND_STATE'));
});
end();
