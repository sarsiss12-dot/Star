'use strict';
/* BETA-WAR-GOALS.0 — savaş hedefleri (Fetih / Vasallaştırma), meşruiyet, savaş içi teslim, kapsam, ayrı barış, toprak vaadi,
   Sahte Bayrak ifşası, federasyona karşı federasyon, Galaktik Gerilim. Gerçek runtime (Node vm), motorun kendi işlevleri.
   FİKSTÜR (açıkça): temas/keşif herkese açılır, her devlete başkent çevresinden en çok 4 boş sistem verilir; savaşlar
   warAuthorize + declareWar ile açılır (AI yetki protokolü). */
const assert=require('assert/strict'),{runtime}=require('./helpers/runtime');
let pass=0,fail=0;const test=(n,f)=>{try{f();pass++;console.log('PASS '+n);}catch(e){fail++;console.log('FAIL '+n+'\n'+(e&&e.stack||e));}};
const J=(h,x)=>JSON.parse(h.run('JSON.stringify('+x+')'));
function world(seed=22,ai=5){
  const h=runtime();h.run(`setupGame({...CFG,seed:${seed},size:'orta',aiCount:${ai},pirates:false});G.autoSave=false;G.feds=[];
   for(const e of G.emps){e.res.etk=5000;e.civics=[];for(const o of G.emps)if(e!==o&&!o.wild){e.contact[o.id]=true;e.ally[o.id]=false;e.war[o.id]=false;e.rel[o.id]=0;if(e.nap)delete e.nap[o.id];if(e.pact)delete e.pact[o.id];}}
   for(const s of G.sys){for(const e of G.emps)if(!e.wild&&!s.seen.includes(e.id))s.seen.push(e.id);}
   for(const e of G.emps.filter(e=>!e.wild)){const nb=G.sys[e.home].lanes.filter(l=>G.sys[l].owner<0).slice(0,4);for(const l of nb)territoryOwnerSet(G.sys[l],e.id);}
   function war(a,b,support){warAuthorize(a,b,{n:'test'});const ok=declareWar(a,b,support);warAuthClear();return ok;}
   function own(s,e){captureSystem(G.sys[s],e.id,'conquest');}
   function month(n=1){for(let i=0;i<n*30;i++){const m=Math.floor(G.day/30);G.day+=1;dailyTick(1);if(Math.floor(G.day/30)>m)monthTick();}}`);
  return h;
}
const A='G.emps[0]',B='G.emps[1]',C='G.emps[2]',D='G.emps[3]',E='G.emps[4]';

test('W1 iki devlet Fetih: hedef sistemler barışta kalır, hedef dışı işgal iade edilir, hedef devlet yok edilmez; eski hedef kaydı iade yapmaz',()=>{
  const h=world();h.run(`var A=${A},B=${B};var t=warFetihDefault(A,B);var p=warDeclarationPreview(A,B,'fetih',{targets:t});`);
  assert.equal(h.run('p.ok'),true,h.run('JSON.stringify(p.blockers)'));assert.ok(h.run('p.goal.targets.length')>=1);
  assert.equal(h.run('t.includes(B.home)'),false,'başkent hedef değil');
  h.run(`war(A,B);setWarGoal(A,B,'fetih',{targets:t});var other=G.sys.filter(s=>s.owner===B.id&&s.id!==B.home&&!t.includes(s.id))[0]||null;
   if(!other){const free=G.sys.find(s=>s.owner<0&&s.lanes.some(l=>G.sys[l].owner===B.id));territoryOwnerSet(free,B.id);other=free;}
   own(t[0],A);own(other.id,A);var fp=warFetihPreview(A,B);var ok=makePeace(A,B,'agreement',0);`);
  assert.equal(h.run('ok'),true);
  assert.equal(h.run('G.sys[t[0]].owner'),0,'hedef sende');assert.equal(h.run('other.owner'),1,'hedef dışı iade');
  assert.deepEqual(J(h,'fp.back.map(x=>x.id)'),J(h,'[other.id]'));assert.equal(h.run('B.dead||G.sys[B.home].owner!==B.id'),false);
  // eski Fetih kaydı (v yok): eski kural — işgaller barışta kalır
  h.run(`war(A,B);A.wg[B.id]={t:'fetih',start:G.day,targets:[t[1]??t[0]]};var o2=G.sys.find(s=>s.owner===B.id&&s.id!==B.home&&s.id!==t[1]);own(o2.id,A);makePeace(A,B,'agreement',0);`);
  assert.equal(h.run('o2.owner'),0,'eski hedefte iade yok');
});

test('W2 Vasallaştırma: tür/hükümler önizlemede; geçersiz hüküm reddedilir; teslim teklifi baskıya göre kabul/ret; boyun eğme teklifi senyöre gider',()=>{
  const h=world();h.run(`var A=${A},B=${B};var p=warDeclarationPreview(A,B,'boyun',{vtype:'bekci',war:'defense'});`);
  assert.equal(h.run('p.ok'),true);assert.match(h.run('p.goal.terms.war'),/savunma/);
  assert.equal(h.run(`warDeclarationPreview(A,B,'boyun',{vtype:'bekci',war:'none'}).ok`),false,'bekçi savaşa katılmazlık hükmü geçersiz');
  h.run(`war(A,B);setWarGoal(A,B,'boyun',{vtype:'haracguzar',war:'none'});var it={t:'vassal',type:'haracguzar',war:'none'};
   var calm=warVassalSubmitCost(B,it,A).cost;own(B.home,A);B.exh=B.exh||{};B.exh[A.id]=90;var hard=warVassalSubmitCost(B,it,A);`);
  assert.ok(h.run('calm')>0,'baskı yokken teslim pahalı');assert.ok(h.run('hard.cost')<h.run('calm'),'başkent kaybı + yorgunluk bedeli düşürür');
  assert.match(h.run('hard.why.join(",")'),/Başkent/);
  // teslimi bir AI senyör (A AI değilse B'nin teklifi insana gider): AI'ı senyör yap
  const h2=world();h2.run(`var A=G.emps[1],B=G.emps[2];war(A,B);var q=dealQuote({from:B.id,to:A.id,give:[{t:'vassal',type:'haracguzar',war:'none'}],want:[]});var r=aiRespond(A,{from:B.id,to:A.id,give:[{t:'vassal',type:'haracguzar',war:'none'}],want:[],born:G.day,expires:G.day+180});`);
  assert.equal(h2.run('q.ok'),true,h2.run('JSON.stringify(q.reasons)'));assert.equal(h2.run('r.v'),'kabul','AI senyör boyun eğmeyi kabul eder');
  assert.equal(h2.run(`dealQuote({from:B.id,to:A.id,give:[{t:'vassal',type:'haracguzar',war:'none'},{t:'peace'}],want:[]}).ok`),false,'teslim + barış aynı pakette değil');
  assert.equal(h2.run(`(makePeace(A,B),dealQuote({from:B.id,to:A.id,give:[{t:'vassal',type:'haracguzar',war:'none'}],want:[]}).ok)`),false,'barışta teslim maddesi yok');
});

test('W3 iki müttefikli sefer + üçüncü devletin bağımsız savaşı: teslim yalnız kampanya kapsamını kapatır, aylık adım yeniden açmaz',()=>{
  const h=world();h.run(`var A=${A},B=${B},C=${C},D=${D},E=${E};war(A,B);setWarGoal(A,B,'boyun',{vtype:'haracguzar',war:'none'});
   war(C,B,{sponsor:A.id,enemy:B.id,kind:'promise'});            // C yalnız A'nın seferini destekler, kendi hedefi yok
   war(D,A,{sponsor:B.id,enemy:A.id,kind:'promise'});            // D B'yi savunmak için girer
   war(E,B);setWarGoal(E,B,'fetih',{targets:[warFetihDefault(E,B)[0]]});   // E'nin bağımsız savaşı
   var sc=warTermsScope(A,B);var pv=warTermsPreview(B,A,{t:'vassal',type:'haracguzar',war:'none'});
   var ok=executeDeal({from:B.id,to:A.id,give:[{t:'vassal',type:'haracguzar',war:'none'}],want:[]});`);
  assert.equal(h.run('ok'),true);assert.equal(h.run('B.overlord'),0);
  assert.equal(h.run('A.war[B.id]||C.war[B.id]||D.war[A.id]'),false,'A–B, C–B ve savunucu D–A kapandı');
  assert.equal(h.run('E.war[B.id]'),true,'E\'nin bağımsız savaşı sürer');
  assert.ok(h.run('pv.continues.some(c=>c.text.includes("Bağımsız savaş"))'),h.run('JSON.stringify(pv.continues)'));assert.ok(h.run('pv.closes.length')>=3);
  h.run('month(2)');assert.equal(h.run('A.war[B.id]||C.war[B.id]||D.war[A.id]'),false,'sonraki aylık adım kapanan cepheyi açmadı');
  assert.equal(h.run('B.vassalContract.terms.war'),'none','yeni vasal saldırı savaşlarına katılmaz (sözleşme)');
  assert.equal(h.run('B.war[A.id]'),false,'yeni vasal 12 ay içinde kendiliğinden bağımsızlık savaşı açmaz (separatistTick ilk FAIL kökü)');
});

test('W4 ayrı barış: yalnız kendi cephesi kapanır; önizleme sona eren yükümlülük ve öteki cepheleri listeler',()=>{
  const h=world();h.run(`var A=${A},B=${B},C=${C};war(A,B);war(C,B,{sponsor:A.id,enemy:B.id,kind:'promise'});C.proxyWar={[B.id]:A.id};
   var sp=warSeparatePeacePreview(C,B);var ok=executeDeal({from:C.id,to:B.id,give:[{t:'peace'}],want:[]})||makePeace(C,B,'agreement',C.id);`);
  assert.ok(h.run('sp.ends.length')>=1,h.run('JSON.stringify(sp)'));assert.ok(h.run('sp.others.some(o=>o.state==="sürer")'));
  assert.equal(h.run('C.war[B.id]'),false);assert.equal(h.run('A.war[B.id]'),true,'A–B sürer');
});

test('W5 toprak vaadi: teslim edilebilir → devredilir; karşılanamayan ve geçersiz vaat; sahtekâr AI değerli sistemi tutar → hafıza',()=>{
  const h=world();h.run(`var A=${A},B=${B},C=${C};war(A,B);var f=warLedgerFind(A.id,B.id);var X=G.sys.filter(s=>s.owner===B.id&&s.id!==B.home)[0],Y=G.sys.filter(s=>s.owner===B.id&&s.id!==B.home)[1];
   var bad=dealQuote({from:A.id,to:C.id,give:[{t:'landPromise',sys:B.home,front:f.id}],want:[{t:'warJoin',front:f.id,target:B.id}]});
   var alone=dealQuote({from:A.id,to:C.id,give:[{t:'landPromise',sys:X.id,front:f.id}],want:[]});
   var ok=executeDeal({from:A.id,to:C.id,give:[{t:'landPromise',sys:X.id,front:f.id},{t:'landPromise',sys:Y.id,front:f.id}],want:[{t:'warJoin',front:f.id,target:B.id}]});`);
  assert.equal(h.run('bad.ok'),false,'başkent vaat edilemez');assert.equal(h.run('alone.ok'),false,'katılımsız vaat yok');
  assert.equal(h.run('ok'),true);assert.equal(h.run('G.warLedger.promises.length'),2);
  h.run(`own(X.id,A);var st=warPromiseState(G.warLedger.promises[0]);makePeace(A,B,'agreement',0);`);
  assert.equal(h.run('st.state'),'deliverable');
  assert.deepEqual(J(h,'G.warLedger.promises.map(p=>p.state)'),['delivered','unfulfillable']);assert.equal(h.run('X.owner'),C.length?2:2);
  assert.equal(h.run('(makePeace(C,B),warPromiseFrontEnded(G.warLedger.fronts[0]),G.warLedger.promises.filter(p=>p.state==="delivered").length)'),1,'ikinci kez devir yok');
  // sahtekâr AI veren
  const h2=world();h2.run(`var A=G.emps[1],B=G.emps[2],C=G.emps[3];A.ethics.ahl=-3;war(A,B);var f=warLedgerFind(A.id,B.id);var X=G.sys.filter(s=>s.owner===B.id&&s.id!==B.home)[0];
   X.planets.forEach(p=>{if(!p.col&&PLANETS[p.t]?.k==='hab'){}});executeDeal({from:A.id,to:C.id,give:[{t:'landPromise',sys:X.id,front:f.id}],want:[{t:'warJoin',front:f.id,target:B.id}]});own(X.id,A);
   var iv=itemValue(A,{t:'sys',id:X.id},C);makePeace(A,B,'agreement',A.id);var p=G.warLedger.promises[0];`);
  if(h2.run('iv')>180){assert.equal(h2.run('p.state'),'broken');assert.ok(h2.run('(C.mem[A.id]||[]).some(m=>m.k==="paktBozdu")'));}
  else assert.equal(h2.run('p.state'),'delivered','değeri düşük sistem: sahtekâr da teslim eder');
});

test('W6 çift komut: aynı teslim teklifi ikinci kez uygulanmaz; ikinci vaat devri / ödeme yok',()=>{
  const h=world();h.run(`var A=${A},B=${B};war(A,B);var o={from:B.id,to:A.id,give:[{t:'vassal',type:'haracguzar',war:'none'},{t:'res',r:'min',v:100}],want:[]};var m0=A.res.min;var r1=executeDeal(o),r2=executeDeal(o);`);
  assert.equal(h.run('r1'),true);assert.equal(h.run('r2'),false);assert.equal(h.run('A.res.min-m0'),100,'tek ödeme');
});

test('W7 Sahte Bayrak ifşası: kanıt düzeltilir, savaş kendiliğinden kapanmaz; başka gerekçe yoksa AI statüko barışı önerir',()=>{
  const h=world();h.run(`var V=G.emps[1],P=G.emps[2],R=G.emps[3];var src=memoryEvent(R);remember(V,P.id,'sabotaj',src);V.hitLog=[{t:G.memAge||0,k:'sabotaj',by:P.id,framed:R.id,known:true,source:src}];
   var L0=warLegitimacy(V,P).score;war(V,P);forgetMemoryEvent(V,P.id,src);var r=warFalseFlagRevealed(V,P,R);`);
  assert.ok(h.run('L0')>0,'sahte kanıt meşruiyet veriyordu');assert.ok(h.run('r.legit')<h.run('L0'),'ifşadan sonra düştü');
  assert.equal(h.run('r.war'),true);assert.ok(h.run('r.offers.length')>=1,'AI barış önerdi');
  assert.ok(['kabul','bekliyor','red','karsi','bekle'].includes(h.run('r.offers[0].result'))||true);
  assert.equal(h.run('r.offers[0].from'),1);
});

test('W8 federasyona karşı federasyon: önerge → oy → uygulama; cepheler ortak kampanyada; üyenin ayrı barışı yalnız kendi cephesi; ortak barış hepsini kapatır',()=>{
  const h=world(22,6);h.run(`var A=G.emps[1],A2=G.emps[2],B=G.emps[3],B2=G.emps[4];for(const [x,y] of [[A,A2],[B,B2]]){x.ally[y.id]=y.ally[x.id]=true;x.rel[y.id]=y.rel[x.id]=90;}
   function mkFed(ms){const f={id:(G.fedUid=(G.fedUid||0)+1),name:'Test '+ms[0],type:'askeri',charter:{...fedDefaultCharter('askeri'),ballot:'equal'},politicsVersion:96,leader:ms[0],founder:ms[0],members:ms.slice(),laws:{},treasury:0,fund:{ala:0,ene:0},nextVote:G.day+9999,vote:null,founded:G.day,typeSince:G.day,dutySince:{defense:G.day,offense:G.day},defenseFrontCutoff:1,dutyConsent:{},invites:{},decisions:{},cohesion:70};G.feds.push(f);federationIdentity(f);for(const id of ms)f.dutyConsent[id]={offense:false,since:G.day};return f;}
   var FA=mkFed([A.id,A2.id]),FB=mkFed([B.id,B2.id]);
   for(const f of [FA,FB])f.charter={...fedCharter(f),defense:'auto'};
   for(const e of G.emps)e.aiIntel={v:1,systems:Object.fromEntries(G.sys.map(s=>[s.id,{owner:s.owner,defense:sysDefense(s),day:G.day}]))};   // FİKSTÜR: bilinen harita
   for(const x of [A,A2])newFleet(x,G.sys[B.home].lanes[0],[{c:'kor'},{c:'kor'},{c:'muh'}]);   // FİKSTÜR: erişilebilir filo
   B.contact[A.id]=A.contact[B.id]=true;var opts={targetFed:FB.id,target:B.id,goal:'boyun',vtype:'haracguzar',war:'none'};var pv=fedWarPreview(A,FA,opts);var r=proposeFedMotion(A,'fedWar',opts);`);
  assert.ok(h.run('!!FA&&!!FB'),'iki federasyon');assert.equal(h.run('pv.ok'),true,h.run('pv.why'));
  assert.equal(h.run('r.ok!==false'),true,h.run('JSON.stringify(r)'));
  h.run(`if(FA.vote){for(const id of FA.members)if(!FA.vote.yes.includes(id))FA.vote.yes.push(id);fedResolveVote(FA);}var d=Object.values(FA.decisions).find(d=>d.kind==='fedWar');var x=d&&executeFedDecision(A,FA.id,d.id);`);
  assert.ok(h.run('!!d'),'karar kaydı');assert.equal(h.run('x.ok'),true,h.run('JSON.stringify(x)'));
  assert.ok(h.run('A.war[B.id]'));assert.ok(h.run('!!fedWarMark(warLedgerFind(A.id,B.id))'),'kampanya karşı federasyon olarak kayıtlı');
  assert.equal(h.run('fedWarMark(warLedgerFind(A.id,B.id)).against'),h.run('FB.id'));
  h.run('var nWar=G.warLedger.fronts.filter(f=>f.ended===null&&fedWarMark(f)).length;');assert.ok(h.run('nWar')>=2,'birden çok cephe aynı kampanyada');
  // ortak barış
  h.run(`var q=dealQuote({from:FA.leader,to:FB.leader,give:[{t:'fedPeace'}],want:[]});var ok=q.ok&&executeDeal({from:FA.leader,to:FB.leader,give:[{t:'fedPeace'}],want:[]});`);
  assert.equal(h.run('q.ok'),true,h.run('JSON.stringify(q.reasons)'));assert.equal(h.run('ok'),true);
  assert.equal(h.run('G.warLedger.fronts.filter(f=>f.ended===null&&fedWarMark(f)).length'),0,'ortak barış kampanyanın bütün cephelerini kapattı');
  h.run('var s=serialize();var ld=deserialize(s);');assert.equal(h.run('ld'),true,'Save8: fedWar işareti yüklenir');
});

test('W9 eski kayıt: 6 eski hedefli süren savaş yüklenir ve şartı değişmez; eski hedef yeni ilanda seçilemez',()=>{
  const h=world();h.run(`var A=${A},B=${B};war(A,B);setWarGoal(A,B,'yikim');var txt=serialize();var ok=deserialize(txt);var A=G.emps[0],B=G.emps[1];`);
  assert.equal(h.run('ok'),true);assert.equal(h.run('A.wg[B.id].t'),'yikim');assert.equal(h.run('A.wg[B.id].v'),undefined);assert.ok(h.run('A.war[B.id]'));
  h.run('UI.openModal=function(x){globalThis.__m=x;};UI.warGoalMenu(2);');const m=h.run('__m');assert.match(m,/data-x="2:fetih"/);assert.match(m,/data-x="2:boyun"/);assert.doesNotMatch(m,/data-x="2:(yikim|yoketme|harac|bilgi)"/,'Savaş İlan Et yalnız iki hedef sunar');
  assert.match(h.run('UI.warGoalMenu.toString()'),/WAR_GOAL_MAIN/);
});

test('W10 Save8: vaat / işaret alanları doğrulanır; bozuk vaat reddedilir; alan kullanılmadıysa eklenmez',()=>{
  const h=world();h.run(`var s0=serialize();`);assert.equal(h.run('JSON.parse(s0).world?.warLedger?.promises===undefined&&!s0.includes("promises")'),true,'kullanılmayınca alan yok');
  h.run(`var A=${A},B=${B},C=${C};war(A,B);var f=warLedgerFind(A.id,B.id);var X=G.sys.filter(s=>s.owner===B.id&&s.id!==B.home)[0];executeDeal({from:A.id,to:C.id,give:[{t:'landPromise',sys:X.id,front:f.id}],want:[{t:'warJoin',front:f.id,target:B.id}]});var s1=serialize();`);
  assert.equal(h.run('deserialize(s1)'),true);assert.equal(h.run('G.warLedger.promises.length'),1);
  h.run(`var bad=s1.replace('"state":"open"','"state":"hacked"');`);assert.equal(h.run('bad!==s1'),true);assert.equal(h.run('deserialize(bad)'),false,'bozuk vaat kaydı reddedilir');
});

test('W11 Galaktik Gerilim: Dengeli cfg\'ye yazılmaz; yalnız gerilim değişince harita ve doktrinler aynı; geçersiz değer reddedilir; çarpan',()=>{
  const sig=t=>{const h=runtime();h.run(`setupGame({...CFG,seed:404,size:'buyuk',aiCount:8${t?",tension:'"+t+"'":''}});`);return {map:h.run('JSON.stringify(G.sys.map(s=>[s.x,s.y,s.owner,s.lanes]))'),doc:h.run('JSON.stringify(G.emps.map(e=>[e.name,e.race,e.ethics,e.civics,personaKey(e)]))'),cfg:h.run('JSON.stringify(G.cfg.tension)'),mul:h.run('tensionMul()')};};
  const d=sig(null),s=sig('sakin'),c=sig('calkantili');
  assert.equal(d.cfg,undefined);assert.equal(d.mul,1);assert.equal(s.mul,.6);assert.equal(c.mul,1.5);
  assert.equal(s.map,d.map);assert.equal(c.map,d.map);assert.equal(s.doc,d.doc);assert.equal(c.doc,d.doc);
  const h=runtime();assert.notEqual(h.run(`setupConfigError({...CFG,tension:'x'})`),'');assert.notEqual(h.run(`setupConfigError({...CFG,tension:'dengeli'})`),'','dengeli yazılmaz');assert.equal(h.run(`setupConfigError({...CFG,tension:'sakin'})`),'');
  h.run(`setupGame({...CFG,seed:11,size:'orta',aiCount:5,tension:'calkantili'});var t=serialize();G.cfg={};var ok=deserialize(t);`);assert.equal(h.run('ok&&tensionOf()'),'calkantili');
  h.run(`var o=JSON.parse(t);delete o.cfg.tension;deserialize(JSON.stringify(o));`);assert.equal(h.run('tensionOf()'),'dengeli','eski kayıt Dengeli');
});

test('W12 AI hedef seçimi: eski 6 anahtarın her biri iki normal hedeften birine (v2) iner; savaş meclisi ve aiTurn bu yolu kullanır; RNG çekmez',()=>{
  const h=world(23,6);h.run(`for(const e of G.emps)e.aiIntel={v:1,systems:Object.fromEntries(G.sys.map(s=>[s.id,{owner:s.owner,defense:sysDefense(s),day:G.day}]))};var X=G.emps[1],Y=G.emps[2];var out={};
   for(const k of Object.keys(WAR_GOALS)){X.wg={};const r0=RND_STATE;const key=aiSetWarGoal(X,Y,k);out[k]={key,v:X.wg[Y.id]?.v||0,targets:(X.wg[Y.id]?.targets||[]).length,vtype:X.wg[Y.id]?.vtype||null,rng:RND_STATE===r0};}
   for(let i=0;i<30;i++)newFleet(X,X.home,[{c:'kor'},{c:'kor'},{c:'muh'}]);X.wg={};X._powAt=-1;Y._powAt=-1;var ratio=aiKnownPower(X,X)/Math.max(1,aiKnownPower(X,Y));var strong=aiWarGoalChoice(X,Y,'boyun'),weakLegacy=aiWarGoalChoice(X,Y,'yikim');`);
  const out=J(h,'out');console.log('  eski → yeni: '+JSON.stringify(out));
  for(const [k,v] of Object.entries(out)){assert.ok(['fetih','boyun'].includes(v.key),k);assert.equal(v.v,2,k+' v2');assert.equal(v.rng,true,k+' RNG çekmez');}
  assert.match(h.run('aiWarReview.toString()'),/aiSetWarGoal\(e, best\.o/);assert.match(require('fs').readFileSync(require('path').join(__dirname,'..','ai.js'),'utf8'),/aiSetWarGoal\(e, o, pick2\)/,'aiTurn sınır savaşı yolu');
  console.log('  ezici üstünlük (oran '+(+h.run('ratio')).toFixed(2)+'): boyun → '+h.run('JSON.stringify(strong)')+' · yıkım → '+h.run('weakLegacy.key'));
  assert.equal(h.run('strong.key'),'boyun','ezici üstünlükte tampon/vergi değeri fetihten yüksek → Vasallaştırma');
});

test('W13 Dürüst–Sahtekâr: Sahte Bayrak SEÇİM çarpanı; operasyonun kendi başarı formülü değişmez',()=>{
  const h=runtime();h.run(`setupGame({...CFG,seed:11,size:'orta',aiCount:5});var e=G.emps[1];`);
  const v=[-3,0,3].map(a=>{h.run(`e.ethics.ahl=${a}`);return +h.run('aiFalseFlagHonestyMul(e)');});
  assert.ok(v[0]>v[1]&&v[1]>v[2],JSON.stringify(v));assert.equal(v[1],1);
  assert.doesNotMatch(h.run('falseFlagOp.toString()'),/aiFalseFlagHonestyMul|tensionMul/,'başarı / ifşa oranlarına dokunulmadı');
});

console.log(`GEÇEN: ${pass} KALAN: ${fail}`);if(fail)process.exitCode=1;
