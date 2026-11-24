'use strict';
/* SAVAŞ-DESTEK-AI.0 — MP savaş desteği (Node, gerçek mp-core komutları; Chromium değil). host = devlet 0 (A), misafir B = 1, misafir C = 3.
   S, X, K = AI. X, S'ye savaş açar; S zorlanır (X çok güçlü). STARS_ROOT=<kök> eski sürüm (aiWarHelpAsk yok → M1/M2/M5 FAIL).
   M1 AI S → misafir B (müttefik): yardım isteği B'nin teklif kutusuna gider (insan adına karar / katılım yok); aynı ay ikinci istek yok
   M2 B kabul eder (respond): B aynı sefere katılır, ödeme bir kez (S'den düşen = B'ye gelen); aynı teklife ikinci kabul / farklı cid reddedilir
   M3 misafir B → AI K (offer, warJoin isteği): AI kapıları host'ta (kriz → ret + neden; normal → karar); ret kaydı ödeme / savaş yaratmaz
   M4 host A → misafir B: A'nın savaşına destek isteği (local offer) B'ye gider, C (taraf olmayan misafir) teklifi görmez; B reddederse savaş / ödeme yok
   M5 bekleyen AI → B isteği MP paketiyle yeni host'a taşınır; yeni host'ta kabul bir kez uygular, S'nin yardım-isteği beklemesi (aiTalk) korunur */
const assert=require('assert/strict'),fs=require('fs'),path=require('path'),crypto=require('crypto');const {runtime}=require('./helpers/runtime');
const ROOT=process.env.STARS_ROOT?path.resolve(process.env.STARS_ROOT):path.resolve(__dirname,'..');let pass=0,fail=0;
function test(n,fn){try{fn();pass++;console.log('✓ '+n);}catch(e){fail++;console.log('✗ '+n+' — '+String(e&&e.message||e).split('\n')[0]);}}
const J=(h,x)=>JSON.parse(h.run('JSON.stringify('+x+')'));
const FIXG0=`var A=G.emps[0],B=G.emps[1],Cg=G.emps[3],ais=G.emps.filter(o=>o.ai&&!o.dead&&!o.wild&&!o.crisisSide&&![0,1,3].includes(o.id)),S=ais[0],X=ais[1],K=ais.slice(2).find(o=>!(typeof hasCivic==='function'&&hasCivic(o,'shadow'))&&!isPurifier(o));`;
const FIX=FIXG0;const FIXG=FIXG0+'var F=warLedgerFind(S.id,X.id);';
function mpWorld(){const h=runtime({root:ROOT});let n=0;h.sb.out=[];h.sb.rand=k=>crypto.createHash('sha256').update(String(n++)).digest('hex').slice(0,k*2);
  h.run(fs.readFileSync(path.join(ROOT,'research/mp0/mp-core.js'),'utf8'));h.run(fs.readFileSync(path.join(ROOT,'research/mp6/mirror.js'),'utf8'));
  h.run(`var MP=StarsMP.createHost({roomId:'sda0',random:rand,send:(c,t)=>out.push([c,t]),kick(){},lobby:{generate(s){setupGame({...CFG,...s});G.autoSave=false;return {ok:true}}}});MP.installGuards();MP.setCapacity(4);MP.configure({size:'orta',aiCount:6,seed:22});
    for(const [c,e]of [['B',1],['C',3]]){MP.onMessage(c,JSON.stringify({v:1,type:'hello',name:c}));MP.onMessage(c,JSON.stringify({v:1,type:'claim',empire:e}));MP.onMessage(c,JSON.stringify({v:1,type:'ready',value:true}));}
    if(!MP.start().ok)throw Error('start');var seq={};${FIX}
    for(const a of G.emps)for(const b of G.emps)if(a!==b){a.contact[b.id]=true;a.war[b.id]=false;a.ally[b.id]=false;a.rel[b.id]=10;(a.intel||={})[b.id]=3;if(a.nap)delete a.nap[b.id];}
    for(const s of G.sys)s.seen=G.emps.map(e=>e.id);
    for(const e of G.emps)for(const k of ['min','ene','ala','etk'])e.res[k]=3000;
    S.ally[B.id]=B.ally[S.id]=true;S.rel[B.id]=B.rel[S.id]=85;
    for(const o of [B,K,A])for(let i=0;i<3;i++)newFleet(o,o.home,[{c:'kru'},{c:'kru'}],'güç');
    for(let i=0;i<6;i++)newFleet(X,X.home,[{c:'zir'},{c:'zir'},{c:'zir'},{c:'zir'}],'güç');
    {const xs=G.sys[X.home],adj=xs.lanes.map(i=>G.sys[i]).find(s=>s.owner<0)||xs;for(const f of G.fleets.filter(f=>[B.id,K.id,A.id].includes(f.e)&&isArmed(f))){f.sys=adj.id;f.mv=null;}}
    warAuthorize(X,S,{n:'t'});declareWar(X,S);warAuthClear();var F=warLedgerFind(S.id,X.id);`);return h;}
function cmd(h,c,x,cid){const n=h.sb.out.length,s=h.run(`seq['${c}']=(seq['${c}']||0)+1`);h.sb.message=JSON.stringify({v:1,type:'cmd',seq:s,cid:cid||'sda'+c+String(s).padStart(6,'0'),cmd:x});h.run(`MP.onMessage('${c}',message)`);
  return h.sb.out.slice(n).map(([to,t])=>({to,...JSON.parse(t)})).find(m=>m.to===c&&m.type==='result');}
const pend=(h,to)=>J(h,`MP.viewFor(G.emps[${to}]).dip.offers.filter(r=>r.status==='pending').map(r=>({id:r.id,from:r.from,to:r.to,give:r.give,want:r.want}))`);
const ask=h=>J(h,'aiWarHelpAsk(S)');

test('M1 AI S → misafir B (müttefik): istek B\'nin teklif kutusuna gider, B adına karar / katılım yok; aynı ay ikinci istek yok',()=>{
  const h=mpWorld();const s0=J(h,'S.res.ala+S.res.min');assert.equal(ask(h),true,'istek');const p=pend(h,1);
  assert.equal(p.length,1,'B kutusunda tek teklif '+JSON.stringify(p));assert.ok(p[0].give.some(i=>i.t==='warJoin')||p[0].want.some(i=>i.t==='warJoin'),'warJoin maddesi');
  assert.equal(J(h,'!!B.war[X.id]'),false,'B adına katılım yok');assert.equal(J(h,'S.res.ala+S.res.min'),s0,'ödeme kabulden önce yok');assert.equal(ask(h),false,'ay içinde ikinci istek yok');});
test('M2 B kabul eder: aynı sefere katılım, ödeme bir kez; ikinci kabul (aynı cid / yeni cid) yeni etki üretmez',()=>{
  const h=mpWorld();ask(h);const p=pend(h,1)[0];const t0=J(h,'({s:S.res.ala+S.res.min,b:B.res.ala+B.res.min})');
  const r=cmd(h,'B',{kind:'respond',offer:p.id,action:'accept'},'sdaBacc00001');assert.equal(r.status,'ok',JSON.stringify(r));
  const t1=J(h,'({s:S.res.ala+S.res.min,b:B.res.ala+B.res.min,war:!!B.war[X.id]&&!!X.war[B.id],camp:(warLedgerFind(B.id,X.id)||{}).campaign===F.campaign})');
  assert.equal(t1.war,true,'B savaşta');assert.equal(t1.camp,true,'aynı sefer (yeni ilan değil)');assert.equal(t0.s-t1.s,t1.b-t0.b,'ödeme tek ve eşit');
  h.sb.message=JSON.stringify({v:1,type:'cmd',seq:77,cid:'sdaBacc00001',cmd:{kind:'respond',offer:p.id,action:'accept'}});const n=h.sb.out.length;h.run(`MP.onMessage('B',message)`);
  const dup=h.sb.out.slice(n).map(([to,t])=>JSON.parse(t)).find(m=>m.type==='result');assert.equal(dup.dup,1,'aynı cid önbellekten');
  assert.notEqual(cmd(h,'B',{kind:'respond',offer:p.id,action:'accept'}).status,'ok','yeni cid ile ikinci kabul');
  const t2=J(h,'({s:S.res.ala+S.res.min,b:B.res.ala+B.res.min})');assert.deepEqual(t2,{s:t1.s,b:t1.b},'ikinci ödeme yok');});
test('M3 misafir B → AI K: AI katılım kapıları host\'ta; kriz → ret + gerekçe, savaş / ödeme yok; normal → karar',()=>{
  const h=mpWorld();h.run(`warAuthorize(X,B,{n:'t'});declareWar(X,B);warAuthClear();var FB=warLedgerFind(B.id,X.id);K.ally[B.id]=B.ally[K.id]=true;K.rel[B.id]=B.rel[K.id]=85;`);
  const off={kind:'offer',to:h.run('K.id'),give:[{t:'res',r:'ala',v:300}],want:[{t:'warJoin',front:h.run('FB.id'),target:h.run('X.id')}]};
  const r1=cmd(h,'B',off);assert.equal(r1.status,'ok',JSON.stringify(r1));const v1=r1.extra&&r1.extra.ai;assert.ok(['kabul','karsi','red'].includes(v1),'AI kararı '+JSON.stringify(r1.extra));
  const h2=mpWorld();h2.run(`warAuthorize(X,B,{n:'t'});declareWar(X,B);warAuthClear();var FB=warLedgerFind(B.id,X.id);K.ally[B.id]=B.ally[K.id]=true;K.rel[B.id]=B.rel[K.id]=85;K.res.ene=5;K.res.ala=5;K.inc={...(K.inc||{}),ene:-30,ala:-10};`);
  const b0=J(h2,'B.res.ala'),r2=cmd(h2,'B',{...off,to:h2.run('K.id'),want:[{t:'warJoin',front:h2.run('FB.id'),target:h2.run('X.id')}]});
  assert.equal(r2.extra&&r2.extra.ai,'red','kriz → ret '+JSON.stringify(r2));assert.equal(J(h2,'!!K.war[X.id]'),false);assert.equal(J(h2,'B.res.ala'),b0,'ödeme yok');});
test('M4 host A → misafir B: A\'nın savaşına destek isteği B\'ye gider, C görmez; B reddederse savaş / ödeme yok',()=>{
  const h=mpWorld();h.run(`warAuthorize(X,A,{n:'t'});declareWar(X,A);warAuthClear();var FA=warLedgerFind(A.id,X.id);`);
  const r=J(h,`MP.local({kind:'offer',to:B.id,give:[],want:[{t:'warJoin',front:FA.id,target:X.id}]})`);assert.equal(r.ok,true,JSON.stringify(r));
  const pb=pend(h,1),pc=J(h,'MP.viewFor(G.emps[3]).dip.offers.length');assert.equal(pb.length,1,'B kutusunda');assert.equal(pc,0,'taraf olmayan misafir görmez');
  const b0=J(h,'B.res'),rr=cmd(h,'B',{kind:'respond',offer:pb[0].id,action:'reject'});assert.equal(rr.status,'ok');assert.equal(J(h,'!!B.war[X.id]'),false);assert.deepEqual(J(h,'B.res'),b0);});
test('M5 bekleyen AI → B isteği MP paketiyle yeni host\'ta (devam): B aynı koltuğa döner, teklifi görür, kabul bir kez uygular; S\'nin beklemesi korunur',()=>{
  const a=mpWorld();ask(a);const p=pend(a,1)[0];const pkg=J(a,'MP.snapshot({}).pkg');const tok=a.sb.out.filter(([c,t])=>c==='B'&&t.includes('"type":"assign"')).map(([,t])=>JSON.parse(t)).at(-1).token;
  const g=runtime({root:ROOT});let n=0;g.sb.out=[];g.sb.rand=k=>crypto.createHash('sha256').update('r'+String(n++)).digest('hex').slice(0,k*2);g.run(fs.readFileSync(path.join(ROOT,'research/mp0/mp-core.js'),'utf8'));g.sb.T=JSON.stringify(pkg);
  const L=J(g,`(()=>{var V=StarsMP.validatePackage(T);if(!V.ok)return V;var LW=StarsMP.loadWorld(V.pkg);if(!LW.ok)return LW;globalThis.MP=StarsMP.createHost({roomId:'sda1',random:rand,send:(c,t)=>out.push([c,t]),kick(){},lobby:{generate(){return {ok:false};}},resume:V.pkg});MP.installGuards();globalThis.seq={};return {ok:true};})()`);
  assert.equal(L.ok,true,JSON.stringify(L));g.run(FIXG);g.sb.message=JSON.stringify({v:1,type:'hello',name:'B',token:tok});g.run(`MP.onMessage('B',message)`);assert.equal(J(g,'MP.resumeStart().ok'),true,'devam başladı');
  assert.equal(J(g,'S.aiTalk?.warHelp?.until>G.day'),true,'S beklemesi korunur');assert.equal(J(g,'aiWarHelpAsk(S)'),false,'yeni host\'ta aynı ay tekrar istek yok');
  const p2=pend(g,1);assert.equal(p2.length,1,'bekleyen teklif taşındı');assert.equal(p2[0].id,p.id);const t0=J(g,'({s:S.res.ala+S.res.min,b:B.res.ala+B.res.min})');
  const r=cmd(g,'B',{kind:'respond',offer:p.id,action:'accept'});assert.equal(r.status,'ok',JSON.stringify(r));const t1=J(g,'({s:S.res.ala+S.res.min,b:B.res.ala+B.res.min,war:!!B.war[X.id]})');
  assert.equal(t1.war,true);assert.equal(t0.s-t1.s,t1.b-t0.b,'ödeme tek');assert.notEqual(cmd(g,'B',{kind:'respond',offer:p.id,action:'accept'}).status,'ok','ikinci kabul yok');});
console.log('GEÇEN: '+pass+' KALAN: '+fail);process.exitCode=fail?1:0;
