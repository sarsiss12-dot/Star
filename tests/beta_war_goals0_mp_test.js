'use strict';
/* BETA-WAR-GOALS.0 — MP: misafirler GERÇEK mp-core komutlarıyla savaş hedefi seçer, insan–insan savaş içi teslim, ortak barış,
   federasyona karşı savaş önergesi ve Galaktik Gerilim lobi ayarı. Host her adımı motorun kendi işlevinde yeniden denetler;
   çift komut ikinci devir / bedel üretmez. Dünya: helpers/beta-fed-found0-mp-world.cjs (B=1, C=3, D=4 misafir). */
const assert=require('assert/strict'),fs=require('fs'),{world,cmd,J}=require('./helpers/beta-fed-found0-mp-world.cjs');
let pass=0,fail=0;const test=(n,f)=>{try{f();pass++;console.log('PASS '+n);}catch(e){fail++;console.log('FAIL '+n+'\n'+(e&&e.stack||e));}};
const prep=h=>h.run(`for(const e of G.emps){for(const o of G.emps)if(e!==o&&!o.wild){e.ally[o.id]=false;e.rel[o.id]=0;}}
  for(const s of G.sys)for(const e of G.emps)if(!e.wild&&!s.seen.includes(e.id))s.seen.push(e.id);
  for(const e of G.emps.filter(e=>!e.wild)){const nb=G.sys[e.home].lanes.filter(l=>G.sys[l].owner<0).slice(0,4);for(const l of nb)territoryOwnerSet(G.sys[l],e.id);}`);

test('M1 misafir B Fetih hedefleriyle savaş: warQuote host önizlemesi (meşruiyet + tutum), war yalnız geçerli hedeflerle; v2 kaydı; geçersiz hedef ve çift ilan reddedilir',()=>{
  const h=world();prep(h);const t=J(h,'warFetihDefault(G.emps[1],G.emps[3])');assert.ok(t.length>=1);
  const q=cmd(h,'B',{kind:'warQuote',target:3,goal:'fetih',targets:t});assert.equal(q.status,'ok',JSON.stringify(q));
  assert.ok(q.extra.legit&&Array.isArray(q.extra.stances),'önizleme meşruiyet ve tutum taşır');assert.deepEqual(q.extra.goal.targets.map(x=>x.id),t);
  const home=h.run('G.emps[3].home');const bad=cmd(h,'B',{kind:'war',target:3,goal:'fetih',targets:[home]});assert.notEqual(bad.status,'ok','başkent hedef olamaz');
  assert.notEqual(cmd(h,'B',{kind:'war',target:3,goal:'fetih',targets:t,vtype:'bekci'}).status,'ok','iki seçenek birden yok');
  const w=cmd(h,'B',{kind:'war',target:3,goal:'fetih',targets:t});assert.equal(w.status,'ok',JSON.stringify(w));
  assert.deepEqual(J(h,'G.emps[1].wg[3]'),{...J(h,'G.emps[1].wg[3]'),t:'fetih',v:2,targets:t});
  assert.notEqual(cmd(h,'B',{kind:'war',target:3,goal:'fetih',targets:t}).status,'ok','çift ilan');
});

test('M2 insan–insan savaş içi teslim: B → C "teslim iste" (offer want:vassal); C kabul eder → vasallık + cephe kapanır; ikinci kabul ve çift teklif reddedilir',()=>{
  const h=world();prep(h);cmd(h,'B',{kind:'war',target:3,goal:'boyun',vtype:'haracguzar',war:'none'});assert.equal(h.run('G.emps[1].war[3]'),true);
  const o=cmd(h,'B',{kind:'offer',to:3,give:[],want:[{t:'vassal',type:'haracguzar',war:'none'}]});assert.equal(o.status,'ok',JSON.stringify(o));
  assert.notEqual(cmd(h,'B',{kind:'offer',to:3,give:[],want:[{t:'vassal',type:'haracguzar',war:'none'}]}).status,'ok','aynı teklif ikinci kez yok');
  assert.notEqual(cmd(h,'B',{kind:'offer',to:3,give:[],want:[{t:'vassal',type:'bekci',war:'none'}]}).status,'ok','geçersiz hüküm (bekçi katılmaz) reddedilir');
  const id=o.extra?.offer??o.extra?.id;assert.ok(Number.isInteger(id),JSON.stringify(o.extra));
  const r=cmd(h,'C',{kind:'respond',offer:id,action:'accept'});assert.equal(r.status,'ok',JSON.stringify(r));
  assert.equal(h.run('G.emps[3].overlord'),1);assert.equal(h.run('G.emps[1].war[3]||G.emps[3].war[1]'),false);
  assert.notEqual(cmd(h,'C',{kind:'respond',offer:id,action:'accept'}).status,'ok','ikinci kabul yok');
  assert.equal(h.run('G.emps[3].vassalContract.source'),'surrender');
});

test('M3 misafir C boyun eğme teklifi gönderir (give:vassal), misafir B kabul eder; B yetkisiz yanıt veremez',()=>{
  const h=world();prep(h);cmd(h,'B',{kind:'war',target:3,goal:'fetih',targets:J(h,'warFetihDefault(G.emps[1],G.emps[3])')});
  const o=cmd(h,'C',{kind:'offer',to:1,give:[{t:'vassal',type:'akademik',war:'none'}],want:[]});assert.equal(o.status,'ok',JSON.stringify(o));
  const id=o.extra?.offer??o.extra?.id;assert.notEqual(cmd(h,'C',{kind:'respond',offer:id,action:'accept'}).status,'ok','gönderen kendi teklifini kabul etmez');
  assert.equal(cmd(h,'B',{kind:'respond',offer:id,action:'accept'}).status,'ok');assert.equal(h.run('G.emps[3].overlord'),1);assert.equal(h.run('G.emps[3].vassalType'),'akademik');
});

test('M4 misafir başkan B federasyona karşı savaş önergesi (fedMotion fedWar) → misafir D oy → fedExecute; ortak barış iki insan başkan arasında offer/respond fedPeace',()=>{
  const h=world();prep(h);h.run(`function mkFed(ms){const f={id:(G.fedUid=(G.fedUid||0)+1),name:'Test '+ms[0],type:'askeri',charter:{...fedDefaultCharter('askeri'),ballot:'equal',defense:'auto'},politicsVersion:96,leader:ms[0],founder:ms[0],members:ms.slice(),laws:{},treasury:0,fund:{ala:0,ene:0},nextVote:G.day+9999,vote:null,founded:G.day,typeSince:G.day,dutySince:{defense:G.day,offense:G.day},defenseFrontCutoff:1,dutyConsent:{},invites:{},decisions:{},cohesion:70};G.feds.push(f);federationIdentity(f);for(const id of ms)f.dutyConsent[id]={offense:false,since:G.day};return f;}
   var FA=mkFed([1,4]),FB=mkFed([3,5]);for(const [a,b] of [[1,4],[3,5]])G.emps[a].ally[b]=G.emps[b].ally[a]=true;
   for(const e of G.emps)e.aiIntel={v:1,systems:Object.fromEntries(G.sys.map(s=>[s.id,{owner:s.owner,defense:sysDefense(s),day:G.day}]))};for(const x of [1,4]){const hs=G.sys[G.emps[x].home],ts=G.sys[G.emps[3].home];if(!hs.lanes.includes(ts.id)){hs.lanes.push(ts.id);ts.lanes.push(hs.id);}newFleet(G.emps[x],hs.id,[{c:'kor'},{c:'kor'},{c:'muh'}]);}if(typeof TRADE_PATHS!=='undefined')TRADE_PATHS.clear?.();   /* FİKSTÜR: üyelerin başkentinden hedef başkente doğrudan hat (erişim) */`);
  const m=cmd(h,'B',{kind:'fedMotion',motion:'fedWar',targetFed:h.run('FB.id'),target:3,goal:'boyun',vtype:'haracguzar',war:'none'});assert.equal(m.status,'ok',JSON.stringify(m));
  assert.ok(h.run('!!FA.vote'),'oylama açık (insan üye kendi oyunu verir)');
  const tok=h.run('fedVoteToken(FA.vote)');for(const c of ['B','D']){const v=cmd(h,c,{kind:'fedVote',fed:h.run('FA.id'),token:tok,yes:true});assert.equal(v.status,'ok',c+' '+JSON.stringify(v));}   // insan önerici de açıkça oy verir
  if(h.run('!!FA.vote'))h.run('fedResolveVote(FA)');
  const d=J(h,'Object.values(FA.decisions).find(d=>d.kind==="fedWar")');assert.ok(d,'karar');assert.equal(d.state,'ready');assert.equal(h.run('G.emps[1].war[3]'),false,'oy savaş başlatmaz');
  const x=cmd(h,'B',{kind:'fedExecute',fed:h.run('FA.id'),id:d.id});assert.equal(x.status,'ok',JSON.stringify(x));
  assert.equal(h.run('G.emps[1].war[3]'),true);assert.equal(h.run('fedWarMark(warLedgerFind(1,3)).against'),h.run('FB.id'));
  assert.notEqual(cmd(h,'B',{kind:'fedExecute',fed:h.run('FA.id'),id:d.id}).status,'ok','ikinci uygulama yok');
  const o=cmd(h,'B',{kind:'offer',to:3,give:[{t:'fedPeace'}],want:[]});assert.equal(o.status,'ok',JSON.stringify(o));
  const r=cmd(h,'C',{kind:'respond',offer:o.extra?.offer??o.extra?.id,action:'accept'});assert.equal(r.status,'ok',JSON.stringify(r));
  assert.equal(h.run('G.warLedger.fronts.filter(f=>f.ended===null&&fedWarMark(f)&&canPeace(G.emps[f.sides[0]],G.emps[f.sides[1]])).length'),0,'ortak barış barışabilen bütün kampanya cephelerini kapattı');
  console.log('  doktrin nedeniyle süren cephe: '+h.run('G.warLedger.fronts.filter(f=>f.ended===null&&fedWarMark(f)).length'));
});

test('M5 Galaktik Gerilim lobi ayarı: configure kabul/ret; paket ayarı doğrulanır; Dengeli yazılmaz',()=>{
  const {runtime}=require('./helpers/runtime');const h=runtime();let n=0;h.sb.out=[];h.sb.rand=k=>require('crypto').createHash('sha256').update(String(n++)).digest('hex').slice(0,k*2);
  h.run(fs.readFileSync('research/mp0/mp-core.js','utf8'));h.run(`var MP=StarsMP.createHost({roomId:'tn',random:rand,send:(c,t)=>out.push([c,t]),kick(){},lobby:{generate(s){setupGame({...CFG,...s});G.autoSave=false;return {ok:true}}}});`);
  assert.equal(J(h,`MP.configure({size:'orta',aiCount:5,seed:23,tension:'calkantili'})`).ok,true);assert.equal(h.run('G.cfg.tension'),'calkantili');
  assert.notEqual(J(h,`MP.configure({size:'orta',aiCount:5,seed:23,tension:'dengeli'})`).ok,true,'Dengeli yazılmaz (varsayılan)');
  assert.notEqual(J(h,`MP.configure({size:'orta',aiCount:5,seed:23,tension:'x'})`).ok,true);
  assert.equal(J(h,`MP.configure({size:'orta',aiCount:5,seed:23})`).ok,true);assert.equal(h.run('tensionOf()'),'dengeli');
});

console.log(`GEÇEN: ${pass} KALAN: ${fail}`);if(fail)process.exitCode=1;
