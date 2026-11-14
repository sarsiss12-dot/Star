'use strict';
/* BETA-RIVAL-BLOCS.0 — ittifaksız kuruluş / üye kabulü (tek işlem), hedefli karşı blok, dürüstlük ve söz bozma.
   Gerçek runtime (Node vm). FİKSTÜR: setupGame + açıkça yazılan ilişki / temas / ittifak durumları. */
const assert=require('assert/strict'),{runtime}=require('./helpers/runtime');
let pass=0,fail=0;const test=(n,f)=>{try{f();pass++;console.log('PASS '+n);}catch(e){fail++;console.log('FAIL '+n+'\n'+(e&&e.stack||e));}};
const J=(h,x)=>JSON.parse(h.run('JSON.stringify('+x+')'));
/* Herkes temaslı, savaşsız, İTTİFAKSIZ; ilişki 80, bol Etki. humans: insan sayılan devlet kimlikleri (MP uzak insanı gibi). */
function world({seed=11,ai=7,humans=[]}={}){
  const h=runtime();h.run(`setupGame({...CFG,seed:${seed},size:'orta',aiCount:${ai}});G.autoSave=false;G.feds=[];G.day=180;
   for(const e of G.emps){if(e.wild)continue;e.overlord=null;e.civics=[];e.res.etk=10000;e._fedLeaveUntil=0;e.ethics={...(e.ethics||{}),ahl:0};
    for(const o of G.emps)if(e!==o&&!o.wild){e.contact[o.id]=true;e.ally[o.id]=false;e.war[o.id]=false;e.rel[o.id]=80;e.nap=e.nap||{};delete e.nap[o.id];}}
   for(const s of G.sys){s.seen=G.emps.map(e=>e.id);s.surv=s.seen.slice();}
   for(const e of G.emps)e.aiIntel={v:1,systems:Object.fromEntries(G.sys.map(s=>[s.id,{owner:s.owner,defense:sysDefense(s),day:G.day}]))};
   globalThis.mkFed=(ids,type='askeri')=>{for(const a of ids)for(const b of ids)if(a!==b){G.emps[a].ally[b]=true;}const f={id:(G.fedUid=(G.fedUid||0)+1),name:'Test '+ids.join(''),type,charter:{...fedDefaultCharter(type),ballot:'equal'},politicsVersion:96,leader:ids[0],founder:ids[0],members:ids.slice(),laws:{},treasury:0,fund:{ala:0,ene:0},nextVote:G.day+9999,vote:null,founded:G.day,typeSince:G.day,dutySince:{defense:G.day,offense:G.day},defenseFrontCutoff:G.warLedger?.next||1,dutyConsent:{},invites:{},decisions:{},cohesion:70};for(const id of ids)f.dutyConsent[id]={offense:false,since:G.day};G.feds.push(f);federationIdentity(f);for(const id of ids)recalcMods(G.emps[id]);return f;};
   globalThis.__mpHumanVoter=id=>${JSON.stringify(humans)}.includes(id);`);
  return h;
}
const allied=(h,ids)=>h.run(`(()=>{const ids=${JSON.stringify(ids)};return ids.every(a=>ids.every(b=>a===b||G.emps[a].ally[b]&&G.emps[b].ally[a]));})()`);

test('R1 iki insan, önceden ittifak YOK: davet → açık kabul → son onay; federasyon ve eksik ittifak birlikte, tek bedel; öncesinde ittifak yazılmaz',()=>{
  const h=world({humans:[1]});
  const q=J(h,`fedFoundQuote(G.p,'askeri','equal',[1])`);assert.equal(q.ok,true,q.why);
  assert.match(h.run(`fedAllianceText([0,1],G.p)`),/Kurulacak ittifaklar: Sen ↔ /);
  const r=J(h,`fedFoundPropose(G.p,'askeri','equal',[1])`);assert.equal(r.ok,true,r.why);h.run('var before=G.p.res.etk');
  assert.equal(h.run('fedFoundReply(G.emps[1],1,true).ok'),true);
  assert.equal(allied(h,[0,1]),false,'kabulde ittifak henüz yazılmaz');
  assert.equal(h.run('fedFoundFinish(G.p,1).ok'),true);
  assert.deepEqual(J(h,'G.feds[0].members'),[0,1]);assert.equal(allied(h,[0,1]),true);
  assert.equal(h.run('before-G.p.res.etk'),h.run('fedFoundCost(G.p)'));
  h.run('var txt=serialize(),rng=RND_STATE');assert.equal(h.run('fedFoundFinish(G.p,1).ok'),false,'ikinci son onay yok');
  assert.equal(h.run('serialize()'),h.run('txt'));assert.equal(h.run('RND_STATE'),h.run('rng'));
});
test('R2 ret / süre sonu / iptal / şart değişikliği (kurucular arası savaş): yarım ittifak ve bedel yok',()=>{
  for(const mode of ['reject','expire','cancel','war']){const h=world({humans:[1]});h.run(`fedFoundPropose(G.p,'askeri','equal',[1]);var before=G.p.res.etk;`);
    if(mode==='reject')h.run('fedFoundReply(G.emps[1],1,false)');else h.run('fedFoundReply(G.emps[1],1,true)');
    if(mode==='expire')h.run('G.day+=151;fedFoundTick()');if(mode==='cancel')h.run('fedFoundCancel(G.p,1)');if(mode==='war')h.run('G.p.war[1]=G.emps[1].war[0]=true');
    assert.equal(h.run('fedFoundFinish(G.p,1).ok'),false,mode);assert.equal(h.run('G.feds.length'),0,mode);
    assert.equal(h.run('G.p.ally[1]||G.emps[1].ally[0]'),false,mode);assert.equal(h.run('G.p.res.etk'),h.run('before'),mode);}
});
test('R3 tek insan + iki AI ortak, ittifaksız: AI gerçek stratejik kararla yanıt verir; kabulde federasyon + bütün karşılıklı ittifaklar',()=>{
  const h=world();h.run('globalThis.__mpHumanVoter=()=>false');
  assert.equal(h.run(`fedFoundQuote(G.p,'ticaret','equal',[1]).ok`),false,'tek insanlı kuruluşta iki AI ortak kuralı korunur');
  const c=J(h,`fedFoundQuote(G.p,'ticaret','equal',[]).candidates.filter(c=>c.ok).map(c=>c.id)`);assert.ok(c.length>=2,JSON.stringify(c));
  const pick=J(h,`(()=>{const ok=${JSON.stringify(c)}.filter(id=>fedFoundAssessment(G.emps[id],G.p,{type:'ticaret',ballot:'equal',members:[0,id]}).ok);return ok.slice(0,2);})()`);
  assert.equal(pick.length,2,'en az iki AI ittifaksız davete olumlu: '+JSON.stringify(pick));
  const r=J(h,`fedFoundPropose(G.p,'ticaret','equal',${JSON.stringify(pick)})`);assert.equal(r.ok,true,r.why);
  const st=J(h,`Object.values(fedFoundGet(${r.id}).replies).map(x=>x.status)`);assert.ok(st.every(s=>s==='accepted'),JSON.stringify(st));
  assert.equal(h.run(`fedFoundFinish(G.p,${r.id}).ok`),true);assert.equal(allied(h,[0,...pick]),true);
});
test('R4 ittifaksız üye kabulü: Federasyonuma Davet Et → üye oyu (insan oyu otomatik değil) → AI adayın kabulü → üyelik + bütün üyelerle ittifak',()=>{
  const h=world({humans:[1]});h.run(`fedFoundPropose(G.p,'ticaret','equal',[1]);fedFoundReply(G.emps[1],1,true);fedFoundFinish(G.p,1);var F=G.feds[0];F.nextVote=G.day+9999;`);
  const target=J(h,`G.emps.find(o=>o.ai&&!o.wild&&!o.dead&&!findFed(o)&&aiFedWilling(o,G.p,F.type,F).ok)?.id`);assert.ok(Number.isInteger(target),'uygun AI aday');
  assert.equal(h.run(`G.p.ally[${target}]||G.emps[${target}].ally[0]`),false);
  assert.equal(h.run(`canFedMotion(G.p,'admit',{target:${target}}).ok`),true,'önceden ittifak gerekmez');
  assert.match(h.run(`fedAdmissionAllianceText(F,${target},G.p)`),/Kurulacak ittifaklar/);
  const r=J(h,`fedInvite(F,G.emps[${target}])`);assert.equal(r.ok,true,r.why);
  assert.equal(h.run(`findFed(G.emps[${target}])===F`),false,'oy bitmeden üyelik yok');
  const token=h.run('fedVoteToken(F.vote)');h.run(`castFedVote(G.p,F.id,'${token}',true);castFedVote(G.emps[1],F.id,'${token}',true);`);
  if(h.run('!!F.vote'))h.run('fedResolveVote(F)');
  assert.equal(h.run(`findFed(G.emps[${target}])===F`),true,JSON.stringify(J(h,'F.history?.slice(-3)')));
  assert.equal(allied(h,[0,1,target]),true,'kabulde eksik ittifaklar bütün üyelerle birlikte');
});
test('R5 insan aday: oydan sonra davet kartı; açık kabulle üyelik + ittifak; ikinci kabul ikinci üyelik yaratmaz; ret ittifak bırakmaz',()=>{
  for(const mode of ['accept','reject']){
    const h=world({humans:[]});h.run(`var F=mkFed([1,2,4],'ticaret');`);
    assert.ok(h.run('!!F'),'AI federasyonu');assert.equal(h.run('G.p.ally[1]||G.p.ally[2]||G.p.ally[4]'),false);
    const r=J(h,`proposeFedMotion(G.emps[F.leader],'admit',{target:0})`);assert.equal(r.ok,true,r.why);if(h.run('!!F.vote'))h.run('fedResolveVote(F)');
    assert.ok(h.run('!!F.invites[0]'),'insan aday için davet: '+JSON.stringify(J(h,'F.history?.slice(-2)')));assert.equal(h.run('findFed(G.p)'),null,'insan adına kabul yok');
    if(mode==='accept'){assert.equal(h.run('acceptFedInvite(G.p,F.id).ok'),true);assert.equal(allied(h,[0,...J(h,'F.members')]),true);const n=h.run('F.members.length');assert.equal(h.run('acceptFedInvite(G.p,F.id).ok'),false);assert.equal(h.run('F.members.length'),n);}
    else{h.run('rejectFedInvite(G.p,F.id)');assert.equal(h.run('findFed(G.p)'),null);assert.equal(h.run('G.p.ally[1]||G.p.ally[2]||G.p.ally[4]'),false);}
  }
});
test('R6 hedefli karşı blok: büyük federasyon karşısında iki küçük müttefik AI (savunma bağı) — eski kural engeli gösterilir, yeni yolla 2 kurucu ve denge birliği indirimiyle kurulur, sürer',()=>{
  const h=world({ai:7});
  h.run(`(()=>{const ai=G.emps.filter(e=>e.ai&&!e.wild&&!e.dead&&!isVassal(e)&&!isPurifier(e)).map(e=>e.id);for(const id of ai){const x=G.emps[id];x.mizac='tuccar';x.persLock='tuccar';delete x._prof;delete x._pers;delete x._persAt;}
    let pair=null;for(const a of ai)for(const b of ai)if(!pair&&a<b&&aiFoundWilling(G.emps[b],G.emps[a],{type:'ticaret',ballot:'equal',members:[a,b]}).ok&&aiFoundWilling(G.emps[a],G.emps[b],{type:'ticaret',ballot:'equal',members:[a,b]}).ok)pair=[a,b];
    const big=ai.filter(id=>!pair.includes(id)).slice(0,4);mkFed(big,'askeri').founded=G.day-400;globalThis.__pair=pair;
    globalThis.A=G.emps[pair[0]];globalThis.B=G.emps[pair[1]];A.ally[B.id]=B.ally[A.id]=true;A.rel[B.id]=B.rel[A.id]=90;for(const x of [A,B])for(const id of [0,...big]){x.rel[id]=-30;G.emps[id].rel[x.id]=-30;}
    for(const e of G.emps)if(e!==A&&e!==B)e._fedPoliticsAfter=G.day+99999;})();`);
  assert.equal(h.run('G.feds.length'),1);
  const old=J(h,`canFoundFed(A,aiFedType(A)==='yagmaci'?'askeri':aiFedType(A),'equal')`);assert.equal(old.ok,false);assert.ok(old.reasons.some(r=>/En az 2 bağımsız/.test(r)),JSON.stringify(old.reasons));
  assert.ok(J(h,'fedCounterBloc(__pair)'),'büyük blok var');
  h.run('var etk=A.res.etk,etkB=B.res.etk;aiFederationPolitics();');
  const f=J(h,`(()=>{const f=findFed(A);return f&&{members:f.members,type:f.type,same:findFed(B)===f};})()`);
  assert.ok(f&&f.same&&f.members.length===2,JSON.stringify({f,why:J(h,'[A.aiFedReason,B.aiFedReason]')}));
  const paid=h.run('A.res.etk<etk?etk-A.res.etk:etkB-B.res.etk');assert.equal(paid,Math.round(220*.6),'denge birliği bedeli');
  h.run('for(let i=0;i<360;i++){G.day+=1;dailyTick(1);if(i%30===29)monthTick();}');
  assert.ok(h.run('!!findFed(A)&&findFed(A)===findFed(B)'),'karşı blok 12 ay sürdü');
});
/* Kontrollü etik: aynı doktrin, aynı koşul, yalnız ahl farklı. Saldırmazlık yürürlükte, güçlü fırsat ve sebep var. */
function oathWorld(ahl,ratio=4){
  const h=world({ai:5});h.run(`(()=>{globalThis.A=G.emps[1];globalThis.T=G.emps[2];for(const e of [A,T]){e.mizac='militarist';e.persLock='militarist';delete e._prof;delete e._pers;}
    A.ethics.ahl=${ahl};A.nap[2]=G.day+3600;T.nap[1]=G.day+3600;A.rel[2]=T.rel[1]=-60;A.contact[2]=T.contact[1]=true;for(const e of G.emps)e.peaceAt={};
    G.fleets=G.fleets.filter(f=>f.e!==2);for(let i=0;i<${ratio};i++)newFleet(A,A.home,[{c:'kru'},{c:'kru'},{c:'kru'},{c:'kor'}]);})()`);return h;
}
test('R7 dürüst / sahtekâr aynı fırsat: söz bozma freni dürüstlükle ölçeklenir; düşük getiride ikisi de vazgeçer',()=>{
  const b=ahl=>J(oathWorld(ahl),'warAppetite(A,T).brake');const hb=b(3),nb=b(0),db=b(-3);
  assert.ok(hb>nb&&nb>db,JSON.stringify({hb,nb,db}));
  const low=ahl=>J(oathWorld(ahl,0),'(()=>{const a=warAppetite(A,T);return a.score>=.92-a.grudge*.45;})()');
  assert.equal(low(3),false);assert.equal(low(-3),false,'düşük getirili ihanet iki profilde de yok');
  console.log('fren (ahl +3/0/−3):',hb.toFixed(2),nb.toFixed(2),db.toFixed(2));
});
test('R8 söz bozan savaş ilanı: gerekçe hafızada (paktBozdu), haber akışında ve devlet kaydında (oathLog)',()=>{
  const h=oathWorld(-3);h.run(`A._lastCB={n:'Stratejik fırsat'};warAuthorize(A,T,A._lastCB);declareWar(A,T);warAuthClear();`);
  assert.equal(h.run('A.war[2]'),true);assert.ok(J(h,'(T.mem[1]||[]).some(m=>m.k==="paktBozdu")'));
  const log=J(h,'A.oathLog');assert.equal(log.length,1);assert.equal(log[0].kind,'nap');assert.equal(log[0].why,'Stratejik fırsat');
  assert.ok(J(h,`GalacticNews.state().records.concat(GalacticNews.state().hidden).some(r=>r.key.startsWith('oath:1:2:'))`));
});
test('R9 federasyon savunma yükümlülüğü: aynı koşulda dürüst üye savaşa girer, sahtekâr üye kaçar (hafıza + uyum + haber); düşük riskte ikisi de girer',()=>{
  const run=(ahl,strong)=>{const h=world({ai:5});h.run(`(()=>{globalThis.F=mkFed([1,2],'askeri');
     globalThis.M=G.emps[2];globalThis.V=G.emps[1];globalThis.X=G.emps[3];M.ethics.ahl=${ahl};M.rel[1]=20;
     G.fleets=G.fleets.filter(f=>f.e!==3&&f.e!==2);newFleet(M,M.home,[{c:'kor'},{c:'kor'}]);for(let i=0;i<${strong?40:0};i++)newFleet(X,X.home,[{c:'kru'},{c:'kru'},{c:'kru'}]);
     ensureIntel(M)[3]=3;X._lastCB={n:'Test'};warAuthorize(X,V,X._lastCB);declareWar(X,V);warAuthClear();globalThis.__risk=aiKnownPower(M,X)/(aiKnownPower(M,M)+1);fedDefend(X,V);})()`);   /* declareWar zaten fedDefend çağırır; ikinci çağrı çift kayıt üretmemeli */
    return J(h,`({risk:__risk,joined:!!M.war[3],coh:F.cohesion,mem:(V.mem[2]||[]).some(m=>m.k==='paktBozdu'),log:(M.oathLog||[]).map(x=>x.kind)})`);};
  const hs=run(3,true),ds=run(-3,true),dl=run(-3,false);
  assert.equal(hs.joined,true,JSON.stringify(hs));assert.equal(ds.joined,false,JSON.stringify(ds));assert.equal(dl.joined,true,JSON.stringify(dl));
  assert.ok(ds.mem&&ds.log.length===1&&ds.log[0]==='defense'&&ds.coh===64,JSON.stringify(ds));
});
test('R10 Save8: ittifaksız kuruluş davetinin bekleyen rızası ve oathLog korunur; eski kayıt alanları zorla doldurulmaz',()=>{
  const h=world({humans:[1]});h.run(`fedFoundPropose(G.p,'askeri','equal',[1]);G.emps[3].oathLog=[{day:1,kind:'nap',target:2,why:'x'}];var s=serialize();G.fedFounding=null;var ok=deserialize(s);`);
  assert.equal(h.run('ok'),true,'yükleme başarılı');
  assert.equal(h.run('fedFoundGet(1).status'),'pending');assert.equal(h.run('G.p.ally[1]'),false);assert.equal(h.run('G.emps[3].oathLog.length'),1);
  assert.equal(h.run('fedFoundReply(G.emps[1],1,true).ok&&fedFoundFinish(G.p,1).ok'),true);assert.equal(allied(h,[0,1]),true);
  assert.equal(h.run('G.emps[4].oathLog===undefined'),true);
});
console.log(`GEÇEN: ${pass} KALAN: ${fail}`);if(fail)process.exitCode=1;
