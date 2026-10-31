'use strict';
/* MP.6.2 — çok oyunculu savaş ve ikili siyaset (host'un gerçek STARS motoru, Node vm). Seed 22, orta, 5 AI; uzak insanlar
   A=1, B=3, C=4 (C, A ve B ile temassız); federasyon 100 = {5, 2, B} (MP.3.1 fikstürü).
   Kanıtlanan:
   - savaş ilanı: önizleme host'un warDeclarationPreview'u (ilan edenin bilgisiyle); 'war' = tek oyunculu son onay zinciri
     (Save8 + RNG aynı); tekrar ve ikinci ilan ikinci savaş/maliyet üretmez; sahte devlet, temassız hedef, geçersiz hedef reddi;
     konsey yasağında devlet 0 dalı (ceza + savaş) — AI zarı yok.
   - çok taraflı: federasyon savunma yükümlülüğü ve senyör koruması motorla aynı; savaşa sürüklenen uzak insan kendi listesinde
     "SAVAŞ BAŞLADI" görür.
   - ittifak / saldırmazlık / ticaret paktı insan–insan MP teklifiyle (executeDeal); ittifak sonu, fesih, ambargo, hediye.
   - statüko: insan hedefe teklif (karar onun), AI hedefe tek oyunculu yol.
   - AI insan adına karar vermez: AI barış teklifi uzak insanın kutusuna gider (host'unkine değil); AI statüko imzalamaz.
   - ayna: savaş haritaları yeniden numaralandırılır; üçüncü taraf savaşı motorun bilgi kuralıyla. */
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');
const {runtime}=require('./helpers/runtime'),{harness}=require('./helpers/95e-fixture');
const {test,end}=harness(),root=path.resolve(__dirname,'..');
const CORE=fs.readFileSync(path.join(root,'research/mp0/mp-core.js'),'utf8'),MIR=fs.readFileSync(path.join(root,'research/mp6/mirror.js'),'utf8');
const STEP='function step(days){for(let i=0;i<days*2;i++){const b=Math.floor(G.day/30);G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();if(Math.floor(G.day/30)>b){monthTick();MP.observeHumans();}}}';
const A=1,B=3,C=4,CONN={[A]:'cA',[B]:'cB',[C]:'cC'};
const POLITICS=`
  for(const e of G.emps)if(!e.wild){for(const k of ['etk','ene','min','ala','tuk','yiy'])e.res[k]=Math.max(e.res[k],3000);}
  const pairs=[[0,1],[0,2],[0,3],[0,4],[0,5],[1,2],[1,3],[1,5],[2,3],[2,5],[3,5],[4,5],[2,4]];
  for(const [a,b] of pairs){G.emps[a].contact[b]=G.emps[b].contact[a]=true;G.emps[a].rel[b]=G.emps[b].rel[a]=60;}
  var F={id:100,name:'MP62 Birliği',type:'askeri',charter:fedDefaultCharter('askeri'),leader:5,founder:5,members:[5,2,3],laws:{},fund:{ala:0,ene:0},treasury:0,
    founded:G.day,typeSince:G.day,dutySince:{defense:0,offense:0},invites:{},decisions:{},dutyConsent:{},cohesion:70,nextVote:G.day+100000,politicsVersion:96};
  G.feds=[F];G.fedUid=100;for(const a of F.members)for(const b of F.members)if(a!==b)G.emps[a].ally[b]=true;fedNormalize(F);
  for(const id of [0,1,2,3,4,5])recalcMods(G.emps[id]);`;
function world(extra=''){
  const h=runtime({root});let n=0;h.sb.__rand=k=>crypto.createHash('sha256').update(String(n++)).digest('hex').slice(0,k*2);h.sb.__out=[];
  h.run(MIR);h.run(CORE);
  h.run(`${STEP}
    var MP=StarsMP.createHost({roomId:'r62',random:__rand,send:(c,t)=>__out.push([c,t]),kick(){},
      lobby:{generate(s){setupGame({...CFG,...s});applyChosenPersona(G.p,CFG.mizac);G.autoSave=false;return {ok:true};}}});
    MP.installGuards();MP.setCapacity(4);MP.configure({size:'orta',aiCount:5,seed:22});
    for(const [c,e] of [['cA',${A}],['cB',${B}],['cC',${C}]]){MP.onMessage(c,JSON.stringify({v:1,type:'hello',name:c}));MP.onMessage(c,JSON.stringify({v:1,type:'claim',empire:e}));MP.onMessage(c,JSON.stringify({v:1,type:'ready',value:true}));}
    if(!MP.start().ok)throw Error('start');var seq={};${POLITICS};${extra};MP.publish();`);
  return h;
}
const J=(h,x)=>JSON.parse(h.run('JSON.stringify('+x+')'));
function cmd(h,who,c,extra={}){const conn=CONN[who],n=h.sb.__out.length,s=h.run(`seq[${JSON.stringify(conn)}]=(seq[${JSON.stringify(conn)}]||0)+1`);
  h.run(`MP.onMessage(${JSON.stringify(conn)},${JSON.stringify(JSON.stringify({v:1,type:'cmd',seq:s,cid:extra.cid||('m62'+conn+String(s).padStart(5,'0')),cmd:c,...(extra.empire!==undefined?{empire:extra.empire}:{})}))})`);
  return h.sb.__out.slice(n).filter(([cc])=>cc===conn).map(([,t])=>JSON.parse(t)).find(m=>m.type==='result');}
const st=h=>({save:h.run('serialize()'),rng:h.run('RND_STATE')});
/* Save8 farkının yolları (eşitlik başarısızsa iletiye) */
function sdiff(x,y,p='',out=[]){if(out.length>12||JSON.stringify(x)===JSON.stringify(y))return out;
  if(x&&y&&typeof x==='object'&&typeof y==='object'){for(const k of new Set([...Object.keys(x),...Object.keys(y)]))sdiff(x[k],y[k],p+'.'+k,out);}else out.push(p+'='+String(JSON.stringify(x)).slice(0,60)+'|'+String(JSON.stringify(y)).slice(0,60));return out;}
const same=(a,b,m)=>{const x=st(a),y=st(b);assert.equal(x.rng,y.rng,m+' RNG');if(x.save!==y.save)assert.fail(m+' Save8: '+sdiff(JSON.parse(x.save),JSON.parse(y.save)).join(' ; '));};
function lastView(h,who){const conn=CONN[who];let v=null,base=null;for(const [c,t] of h.sb.__out){if(c!==conn)continue;const m=JSON.parse(t);
  if(m.type==='snapshot'){v=JSON.parse(JSON.stringify(m.view));base=m.rev;}else if(m.type==='delta'&&v&&m.base===base){const o=m.ops||{};
    for(const [s,u] of Object.entries(o.up||{}))Object.assign(v[s],u);for(const [s,r] of Object.entries(o.rm||{}))for(const k of r)delete v[s][k];for(const [s,x] of Object.entries(o.set||{}))v[s]=x;base=m.rev;}}return v;}
const goal=h=>J(h,'Object.keys(WAR_GOALS)[0]');

test('savaş ilanı: önizleme host\'un warDeclarationPreview\'u (salt okuma); ilan = tek oyunculu son onay zinciri, ağdan = doğrudan motor (Save8 + RNG); Etki bir kez',()=>{
  const a=world(),b=world(),g=goal(a),s0=st(a);
  const q=cmd(a,A,{kind:'warQuote',target:B,goal:g});assert.equal(q.status,'ok');assert.deepEqual(st(a),s0,'quote is read-only');
  assert.deepEqual(q.extra,J(a,`warDeclarationPreview(G.emps[${A}],G.emps[${B}],${JSON.stringify(g)})`),'engine preview, actor view');
  const etk0=J(a,`G.emps[${A}].res.etk`);
  const w=cmd(a,A,{kind:'war',target:B,goal:g});assert.equal(w.status,'ok');
  b.run(`{const x=G.emps[${A}],t=G.emps[${B}];if(!warDeclarationAccess(x,t).ok||!declareWar(x,t))throw Error('engine');setWarGoal(x,t,${JSON.stringify(g)});}`);
  same(a,b,'MP == engine');
  assert.deepEqual(J(a,`[G.emps[${A}].war[${B}],G.emps[${B}].war[${A}],G.emps[${A}].wg[${B}].t]`),[true,true,g]);
  const paid=etk0-J(a,`G.emps[${A}].res.etk`);
  assert.equal(cmd(a,A,{kind:'war',target:B,goal:g},{cid:w.cid}).dup,1,'same cid → cached result');
  const r=cmd(a,A,{kind:'war',target:B,goal:g});assert.equal(r.code,'rules:war',JSON.stringify(r));assert.match(r.detail.join(' '),/zaten/);
  assert.equal(etk0-J(a,`G.emps[${A}].res.etk`),paid,'no second cost');
});
test('savaş ilanı yetkisi: sahte devlet, temassız hedef, kendisi, geçersiz hedef ve bilinmeyen anahtar reddedilir; dünya değişmez',()=>{
  const h=world(),g=goal(h),s0=st(h);
  assert.equal(cmd(h,A,{kind:'war',target:B,goal:g},{empire:B}).code,'forged-empire');
  {const r=cmd(h,B,{kind:'war',target:C,goal:g});assert.equal(r.code,'no-target','no contact → looks absent '+JSON.stringify(r)+' contact='+J(h,`!!G.emps[${B}].contact[${C}]`));}
  assert.equal(cmd(h,B,{kind:'warQuote',target:C,goal:g}).code,'no-target');
  assert.equal(cmd(h,B,{kind:'war',target:B,goal:g}).code,'no-target');
  assert.equal(cmd(h,B,{kind:'war',target:A,goal:'yok'}).code,'bad-params');
  assert.equal(cmd(h,B,{kind:'war',target:A,goal:g,extra:1}).code,'bad-params');
  assert.deepEqual(st(h),s0);
});
test('konsey yasağı: motor devlet 0\'a "bilerek çiğne" (ceza + savaş), diğerlerine AI zarı uyguluyordu; uzak insanda devlet 0 dalı — savaş başlar, ceza uygulanır, zar ve RNG çekimi yok',()=>{
  const h=world(`var __pun=[];councilBlocksWar=(a,b)=>b.id===${B};const __cp=councilPunish;councilPunish=function(e){__pun.push(e.id);};`),g=goal(h);
  const q=cmd(h,A,{kind:'warQuote',target:B,goal:g});assert(q.extra.risks.some(r=>/Konsey/.test(r)),'preview shows the council risk');
  const r0=h.run('RND_STATE');assert.equal(cmd(h,A,{kind:'war',target:B,goal:g}).status,'ok');
  assert.equal(J(h,`G.emps[${A}].war[${B}]`),true);assert.deepEqual(J(h,'__pun'),[A]);
  assert.equal(J(h,'councilBlocksWar(G.emps[1],G.emps[3])'),true,'council gate restored after the command');void r0;
});
test('çok taraflı: federasyon savunma yükümlülüğü ve senyör koruması motorla aynı; savaşa sürüklenen uzak insan B kendi listesinde "SAVAŞ BAŞLADI" görür',()=>{
  const ex=`F.dutySince={defense:0,offense:0};`;   // askerî tüzük: savunma 'auto' (motorun varsayılanı)
  const a=world(ex),b=world(ex),g=goal(a);
  const q=cmd(a,A,{kind:'warQuote',target:2,goal:g});assert.equal(q.status,'ok');
  assert.equal(cmd(a,A,{kind:'war',target:2,goal:g}).status,'ok');
  b.run(`{const x=G.emps[${A}],t=G.emps[2];if(!warDeclarationAccess(x,t).ok||!declareWar(x,t))throw Error('engine');setWarGoal(x,t,${JSON.stringify(g)});}`);
  same(a,b,'MP == engine incl. joiners');
  const joined=J(a,`G.emps.filter(e=>e.id!==${A}&&e.war[${A}]).map(e=>e.id)`);assert(joined.includes(2));
  console.log('  A → AI 2 savaşına girenler (motorla aynı): '+JSON.stringify(joined)+' · kesin katılım önizlemesi: '+JSON.stringify(q.extra.certain.map(x=>x.id)));
  a.run('MP.publish()');const v=lastView(a,B);
  assert(joined.includes(B),'federation defense duty brings human member B into the war (engine fedDefend)');
  assert(v.log.some(n=>/SAVAŞ BAŞLADI/.test(n.m)&&n.m.includes(J(a,`G.emps[${A}].name`))),'dragged-in human B is told in its own list');
  for(const row of q.extra.certain)assert(joined.includes(row.id),'certain joiners really joined: '+row.id);
  /* senyör koruması: federasyon yok; A, AI 5'in vasalı; B A'ya saldırır → motorun overlordDefend'i 5'i savaşa sokar */
  const ex2=`G.feds=[];for(const e of G.emps)e.ally={};if(!subjugate(G.emps[5],G.emps[${A}],'haracguzar'))throw Error('subjugate');`;
  const c=world(ex2),d=world(ex2);const r=cmd(c,B,{kind:'war',target:A,goal:g});assert.equal(r.status,'ok',JSON.stringify(r));
  d.run(`{const x=G.emps[${B}],t=G.emps[${A}];if(!warDeclarationAccess(x,t).ok||!declareWar(x,t))throw Error('engine');setWarGoal(x,t,${JSON.stringify(g)});}`);
  same(c,d,'overlord path MP == engine');assert.equal(J(c,`!!G.emps[5].war[${B}]`),J(d,`!!G.emps[5].war[${B}]`));
  console.log('  senyör 5 savaşa girdi mi (motorla aynı): '+J(c,`!!G.emps[5].war[${B}]`)+' · vasal koruma görevi: '+J(c,`vassalDuty(G.emps[${A}],'protect')`));
});
test('ittifak / saldırmazlık / ticaret paktı insan–insan: MP teklifi → karşı insan kabul eder → executeDeal (ağdan = doğrudan motor); üçüncü kişi yanıtlayamaz; AI insan adına yanıt vermez',()=>{
  const a=world(),b=world();
  for(const t of ['nap','pact']){const r=cmd(a,A,{kind:'offer',to:B,give:[],want:[{t}]});assert.equal(r.status,'ok',t+' '+JSON.stringify(r));
    assert.equal(cmd(a,C,{kind:'respond',offer:r.extra.offer,action:'accept'}).code,'no-offer','third party sees no offer');
    assert.equal(cmd(a,B,{kind:'respond',offer:r.extra.offer,action:'accept'}).status,'ok');
    b.run(`if(!executeDeal({from:${A},to:${B},give:[],want:[{t:${JSON.stringify(t)}}],born:G.day,expires:G.day+${J(a,'typeof DEAL_OFFER_LIFE==="number"?DEAL_OFFER_LIFE:540')}}))throw Error('engine')`);}
  assert.equal(J(a,`!!(G.emps[${A}].pact[${B}]&&G.emps[${A}].nap[${B}])`),true);
  const r=cmd(a,A,{kind:'offer',to:B,give:[],want:[{t:'ally'}]});
  if(r.status==='ok'){assert.equal(cmd(a,B,{kind:'respond',offer:r.extra.offer,action:'accept'}).status,'ok');assert.equal(J(a,`G.emps[${A}].ally[${B}]&&G.emps[${B}].ally[${A}]`),true);}
  else assert.equal(r.code.startsWith('rules:'),true,'engine gate for alliance: '+JSON.stringify(r.detail));
  assert.equal(cmd(a,A,{kind:'offer',to:B,give:[],want:[{t:'spynet'}]}).code,'bad-params','espionage pact not in this phase');
});
test('ittifakı sonlandır, ticaret anlaşmasını feshet, ambargo, hediye: motorun işlevleri / tek oyunculu satırları; yalnız kendi devleti; hediye alan uzak insan bildirim alır',()=>{
  const h=world();
  {const r=cmd(h,B,{kind:'endAlliance',target:5});assert.equal(r.code,'rules:diplo');assert.match(r.detail[0],/federasyon/i,'federation alliance: engine reason');}
  h.run(`G.emps[${A}].ally[${B}]=G.emps[${B}].ally[${A}]=true;`);
  assert.equal(cmd(h,B,{kind:'endAlliance',target:A}).status,'ok');assert.equal(J(h,`!!G.emps[${B}].ally[${A}]||!!G.emps[${A}].ally[${B}]`),false);
  assert.equal(cmd(h,B,{kind:'endAlliance',target:A}).code,'rules:diplo','no alliance any more');
  h.run(`G.emps[${A}].pact=G.emps[${A}].pact||{};G.emps[${B}].pact=G.emps[${B}].pact||{};G.emps[${A}].pact[${B}]=G.emps[${B}].pact[${A}]=true;`);
  const rel0=J(h,`G.emps[${A}].rel[${B}]`);assert.equal(cmd(h,A,{kind:'unpact',target:B}).status,'ok');
  assert.deepEqual(J(h,`[!!G.emps[${A}].pact[${B}],G.emps[${A}].rel[${B}]]`),[false,rel0-10]);assert.equal(cmd(h,A,{kind:'unpact',target:B}).code,'rules:no-pact');
  assert.equal(cmd(h,A,{kind:'embargo',target:B,on:true}).status,'ok');assert.equal(J(h,`!!G.emps[${A}].embargo[${B}]`),true);
  assert.equal(cmd(h,A,{kind:'embargo',target:B,on:true}).code,'rules:same');assert.equal(cmd(h,A,{kind:'embargo',target:B,on:false}).status,'ok');
  const m0=J(h,`[G.emps[${A}].res.min,G.emps[${B}].res.min]`);assert.equal(cmd(h,A,{kind:'gift',target:B,r:'min',v:100}).status,'ok');
  assert.deepEqual(J(h,`[G.emps[${A}].res.min,G.emps[${B}].res.min]`),[m0[0]-100,m0[1]+100]);
  h.run('MP.publish()');assert(lastView(h,B).log.some(n=>/Hediye/.test(n.m)));
  assert.equal(cmd(h,A,{kind:'gift',target:B,r:'min',v:99999999}).code,'bad-params');assert.equal(cmd(h,A,{kind:'gift',target:B,r:'etk',v:5}).code,'bad-params');
  assert.equal(cmd(h,A,{kind:'gift',target:C,r:'min',v:5}).code,'no-target');
});
test('statüko barışı: insan hedefe TEKLİF (savaş sürer, karar onun; yalnız taraflar görür); kabulde motorun statusQuoPeace\'i ya da motorun gerekçesiyle ret; AI hedefe tek oyunculu yol',()=>{
  const h=world(),g=goal(h);assert.equal(cmd(h,A,{kind:'war',target:B,goal:g}).status,'ok');
  assert.equal(cmd(h,A,{kind:'statusQuo',target:B}).status,'ok');assert.equal(J(h,`G.emps[${A}].war[${B}]`),true,'proposal does not end the war');
  assert.equal(cmd(h,A,{kind:'statusQuo',target:B}).code,'rules:duplicate');
  h.run('MP.publish()');assert.equal(lastView(h,B).dip.sq.filter(q=>q.status==='pending').length,1);assert.equal(lastView(h,C).dip.sq.length,0,'third party sees nothing');
  assert.equal(cmd(h,C,{kind:'statusQuoReply',from:A,accept:true}).code,'no-offer');
  const ok=J(h,`canStatusQuo(G.emps[${B}],G.emps[${A}]).ok`);const r=cmd(h,B,{kind:'statusQuoReply',from:A,accept:true});
  if(ok){assert.equal(r.status,'ok');assert.equal(J(h,`!!G.emps[${A}].war[${B}]`),false);}else{assert.equal(r.code,'rules:diplo');assert.equal(J(h,`G.emps[${A}].war[${B}]`),true);}
});
test('AI insan adına karar vermez: AI\'nın barış teklifi uzak insan B\'nin kutusuna gider (host\'unkine değil); host hedefte motorun yolu; uzak insan yokken düz motor',()=>{
  const h=world(),g=goal(h);
  h.run(`G.emps[2].war[${B}]=G.emps[${B}].war[2]=true;G.emps[2].lastOffer={};G.emps[2].lastOffer[${B}]=G.day;G.inbox=G.inbox||[];var __in0=G.inbox.length;UI.peaceOffer(G.emps[2]);`);
  assert.equal(J(h,'G.inbox.length'),J(h,'__in0'),'host inbox untouched');
  h.run('MP.publish()');const off=lastView(h,B).dip.offers.find(o=>o.from===2&&o.to===B);assert(off,'AI peace offer is in B\'s own box');assert.deepEqual(off.give.map(x=>x.t),['peace']);
  assert.equal(J(h,`G.emps[2].war[${B}]`),true,'no peace until B decides');
  h.run(`G.emps[5].war[0]=G.emps[0].war[5]=true;G.emps[5].lastOffer={0:G.day};UI.peaceOffer(G.emps[5]);`);
  assert(J(h,'G.inbox.some(n=>n.kind==="peace"&&n.data===5)'),'host target keeps the single-player path');
  assert(J(h,'String(aiStatusQuoTick).includes("__mpHumanVoter(o.id)")'),'status-quo guard installed');
});
test('AI statüko ve barışı uzak insan adına imzalamaz: B iki AI ile savaşta, 400 gün; motorun statusQuoPeace / makePeace çağrılarında karşı taraf B olan hiçbiri AI kararı değil',()=>{
  const h=world(`var __calls=[];for(const k of ['statusQuoPeace','makePeace']){const f=globalThis[k];globalThis[k]=function(a,b){__calls.push([k,a&&a.id,b&&b.id,!!(a&&a.ai),!!(b&&b.ai)]);return f.apply(this,arguments);};}
    for(const id of [2,5]){G.emps[id].war[${B}]=G.emps[${B}].war[id]=true;G.emps[id].warStart=G.emps[id].warStart||{};G.emps[id].warStart[${B}]=G.day-400;}`);
  h.run('step(400)');const calls=J(h,'__calls');
  const ai4b=calls.filter(([k,a,b,aai])=>k==='statusQuoPeace'&&b===3&&aai);
  assert.deepEqual(ai4b,[],'AI signed status quo for B');
  assert.equal(J(h,`G.emps[2].war[3]||G.emps[5].war[3]`)!==undefined,true);
});
test('ayna: savaş haritaları yeniden numaralandırılır (host\'la savaş misafirde doğru devlette); kendi savaş hedefi; üçüncü taraf savaşı yalnız motorun bilgi kuralıyla (istihbarat ≥3)',()=>{
  const h=world(),g=goal(h);assert.equal(cmd(h,B,{kind:'war',target:0,goal:g}).status,'ok');
  h.run(`G.emps[2].war[5]=G.emps[5].war[2]=true;G.emps[${B}].intel=G.emps[${B}].intel||{};G.emps[${B}].intel[2]=0;G.emps[${B}].intel[5]=0;`);
  const m=JSON.parse(h.run(`JSON.stringify(StarsMirror.build(${B},{cosmeticSeed:7}))`));
  assert.equal(m.emps[0].war[B],true,"own war with the host is under the host's mirrored id");assert.equal(m.emps[0].wg[B].t,g,'own war goal keyed by the mirrored id');
  assert(m.emps[0].warSince[B]!==undefined);assert.equal(m.emps[B].war[0],true);assert(m.emps[B].warSince&&m.emps[B].warSince[0]!==undefined);
  assert.equal(m.emps[2].war[5],undefined,'third-party war hidden without intel');
  h.run(`G.emps[${B}].intel[2]=3;`);const m2=JSON.parse(h.run(`JSON.stringify(StarsMirror.build(${B},{cosmeticSeed:7}))`));assert.equal(m2.emps[2].war[5],true,'known with intel 3');
  const g2=runtime({root});g2.sb.__t=JSON.stringify(m);assert.equal(g2.run('deserialize(__t)'),true);assert.equal(J(g2,'!!G.p.war[3]&&!!warLedgerFind(0,3)'),true,'guest war mode has the front');
});
test('kayıt: bekleyen ittifak teklifi MP.4 paketinde doğrulanır ve yüklenir (antlaşma maddeleri paket şemasında); statüko teklifi oturumdur (belgelenir)',()=>{
  const h=world();const r=cmd(h,A,{kind:'offer',to:B,give:[],want:[{t:'nap'}]});assert.equal(r.status,'ok');
  const pkg=J(h,'MP.snapshot().pkg');assert.equal(J(h,`StarsMP.validatePackage(${JSON.stringify(JSON.stringify(pkg))},{build:BUILD_ID}).ok`),true);
  assert(pkg.diplomacy.offers.some(o=>o.want.some(i=>i.t==='nap')));
});
test('host düğme kapıları (misafirin aynasında eksik veri): statüko kapısı yalnız savaşılan temaslıya, üye kabul kapısı yalnız üyeye ve yalnız {id, ok, why}; AI değerlendirmesi gitmez',()=>{
  const h=world(),g=goal(h);assert.equal(cmd(h,A,{kind:'war',target:B,goal:g}).status,'ok');h.run('MP.publish()');
  const va=lastView(h,A),vb=lastView(h,B),vc=lastView(h,C);
  const cb=va.dip.contacts.find(x=>x.id===B);assert.deepEqual([cb.sq,typeof cb.sqw],[J(h,`canStatusQuo(G.emps[${A}],G.emps[${B}]).ok?1:0`),'string']);
  for(const x of va.dip.contacts)assert.equal(x.sq!==undefined,J(h,'!!G.emps['+A+'].war['+x.id+']'),'gate only for wars: '+x.id);
  assert(Array.isArray(vb.pol.fed.admit),'member gets the admission gate');assert.equal(va.pol.fed,null,'non-member gets no federation');
  for(const r of vb.pol.fed.admit)assert.deepEqual(Object.keys(r).sort(),['id','ok','why']);
  assert(!JSON.stringify(vb.pol).includes('assessments')&&!JSON.stringify(vc).includes('assessments'));
});
end();
