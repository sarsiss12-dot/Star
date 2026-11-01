'use strict';
/* MP.6.4 — casusluk ve karşı istihbarat, uzak insanlarla. Host'un gerçek STARS motoru (Node vm), seed 22, orta, 5 AI;
   uzak insanlar A=1, B=3, C=5 (üç insan: gizlilik senaryosu).
   FİKSTÜR (açıkça): karşılıklı temas, Etki/kaynak; istihbarat seviyesi motorun alanına (e.intel) yazılır — doğal ilerleme
   ayrıca test edilir (intelP eşiğin hemen altından bir aylık spyTick).
   Kanıtlanan: casus ağı, motorun opQuote değerleri, operasyon (zar yalnız host'ta; maliyet bir kez; bayat onay 'stale'),
   özel operasyonlar, mağdur bildirimi (tespit edilmezse fail adı yok), üçüncü oyuncuya sızıntı yok, aynada failin kimliği
   yalnız biliniyorsa, kayıt/yükleme sonrası ağ ve istihbarat. */
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');
const {runtime}=require('./helpers/runtime'),{harness}=require('./helpers/95e-fixture');
const {test,end}=harness(),root=path.resolve(__dirname,'..');
const CORE=fs.readFileSync(path.join(root,'research/mp0/mp-core.js'),'utf8'),MIR=fs.readFileSync(path.join(root,'research/mp6/mirror.js'),'utf8');
const A=1,B=3,C=5,CONN={[A]:'cA',[B]:'cB',[C]:'cC'};
const STEP='function step(days){for(let i=0;i<days*2;i++){const b=Math.floor(G.day/30);G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();if(Math.floor(G.day/30)>b){monthTick();MP.observeHumans();}}}';
const POL=`for(const e of G.emps)if(!e.wild){for(const k of ['etk','ene','min','ala'])e.res[k]=Math.max(e.res[k],5000);}
  for(const a of [0,1,2,3,4,5])for(const b of [0,1,2,3,4,5])if(a!==b){G.emps[a].contact[b]=true;G.emps[a].rel[b]=20;}
  for(const s of G.sys){s.seen=G.emps.map(e=>e.id);s.surv=G.emps.map(e=>e.id);}`;
function rnd(n0){let n=n0;return k=>crypto.createHash('sha256').update(String(n++)).digest('hex').slice(0,k*2);}
function world(extra=''){
  const h=runtime({root});h.sb.__rand=rnd(0);h.sb.__out=[];h.run(MIR);h.run(CORE);
  h.run(`${STEP}
    var MP=StarsMP.createHost({roomId:'r64s',random:__rand,send:(c,t)=>__out.push([c,t]),kick(){},lobby:{generate(s){setupGame({...CFG,...s});applyChosenPersona(G.p,CFG.mizac);G.autoSave=false;return {ok:true};}}});
    MP.installGuards();MP.setCapacity(4);MP.configure({size:'orta',aiCount:5,seed:22});
    for(const [c,e] of [['cA',${A}],['cB',${B}],['cC',${C}]]){MP.onMessage(c,JSON.stringify({v:1,type:'hello',name:{cA:'Ada',cB:'Bora',cC:'Cem'}[c]}));MP.onMessage(c,JSON.stringify({v:1,type:'claim',empire:e}));MP.onMessage(c,JSON.stringify({v:1,type:'ready',value:true}));}
    if(!MP.start().ok)throw Error('start');var seq={};${POL};${extra};MP.publish();`);
  return h;
}
const J=(h,x)=>JSON.parse(h.run('JSON.stringify('+x+')'));
function msg(h,conn,obj){const n=h.sb.__out.length;h.run(`MP.onMessage(${JSON.stringify(conn)},${JSON.stringify(JSON.stringify(obj))})`);return h.sb.__out.slice(n).filter(([c])=>c===conn).map(([,t])=>JSON.parse(t));}
function cmd(h,who,c,cid){const conn=CONN[who],s=h.run(`seq[${JSON.stringify(conn)}]=(seq[${JSON.stringify(conn)}]||0)+1`);
  return msg(h,conn,{v:1,type:'cmd',seq:s,cid:cid||('m64'+conn+String(s).padStart(6,'0')),cmd:c}).find(m=>m.type==='result');}
const st=h=>({save:h.run('serialize()'),rng:h.run('RND_STATE')});
const notes=(h,id)=>{h.run('MP.publish()');return J(h,`MP.viewFor(G.emps[${id}]).log.map(n=>n.m)`);};
const mirror=(h,id)=>JSON.parse(h.run(`JSON.stringify(StarsMirror.build(${id},{cosmeticSeed:7}))`));
const LVL=(a,b,l)=>`G.emps[${a}].intel=G.emps[${a}].intel||{};G.emps[${a}].intel[${b}]=${l};`;

test('casus ağı: B, C\'ye casus yerleştirir/geri çeker (motorun spyAssignQuote/assignSpy); kapasite motorun; temassız hedef "yok"; RNG tüketmez',()=>{
  const h=world();const r0=h.run('RND_STATE');
  assert.equal(cmd(h,B,{kind:'spyAssign',target:C}).status,'ok');assert.equal(J(h,`!!G.emps[${B}].spy[${C}]`),true);
  const cap=J(h,`spyCap(G.emps[${B}])`);for(let i=0,t=0;i<cap-1;i++){t=[0,2,4][i];if(t!==undefined)assert.equal(cmd(h,B,{kind:'spyAssign',target:t}).status,'ok');}
  const extra=[0,2,4].find(t=>!J(h,`!!G.emps[${B}].spy[${t}]`));if(extra!==undefined&&J(h,`spiesUsed(G.emps[${B}])`)>=cap){const r=cmd(h,B,{kind:'spyAssign',target:extra});assert.equal(r.code,'rules:spy');assert.match(r.detail[0],/Boşta casusun yok/);}
  assert.equal(cmd(h,B,{kind:'spyAssign',target:C}).status,'ok');assert.equal(J(h,`!!G.emps[${B}].spy[${C}]`),false,'second tap withdraws (engine toggle)');
  h.run(`G.emps[${B}].contact[1]=false;`);assert.equal(cmd(h,B,{kind:'spyAssign',target:A}).code,'no-target');
  assert.equal(h.run('RND_STATE'),r0);
  assert(notes(h,B).some(m=>/Casus yerleştirildi/.test(m)));
});
test('istihbarat ilerlemesi motorun: eşiğin altındaki intelP bir aylık spyTick ile seviye atlar; B kendi listesinde görür (motor yalnız devlet 0\'a söylüyordu)',()=>{
  const h=world(`G.emps[${B}].intelP=G.emps[${B}].intelP||{};G.emps[${B}].intelP[${C}]=11.95;`);cmd(h,B,{kind:'spyAssign',target:C});h.run('MP.publish()');
  const l0=J(h,`intelOf(G.emps[${B}],${C})`);h.run('spyTick()');assert.equal(J(h,`intelOf(G.emps[${B}],${C})`),l0+1);
  assert(notes(h,B).some(m=>/İstihbarat seviyesi arttı/.test(m)));assert(!notes(h,A).some(m=>/İstihbarat/.test(m)));
});
test('operasyon teklifi (spyQuote): değerler host\'un opQuote\'u — maliyet, ifşa yüzdesi, seviye, uygunluk; kesin risk ve hedefin gizli verisi yok',()=>{
  const h=world(LVL(B,C,1));const r=cmd(h,B,{kind:'spyQuote',target:C});assert.equal(r.status,'ok');const q=r.extra;
  const host=J(h,`(()=>{const o={};for(const k of Object.keys(OPS)){const q=opQuote(G.emps[${B}],G.emps[${C}],k);o[k]=[q.ok,q.riskPct,JSON.stringify(q.cost),q.why];}return o;})()`);
  for(const k of Object.keys(host))assert.deepEqual([q.ops[k].ok,q.ops[k].riskPct,JSON.stringify(q.ops[k].cost),q.ops[k].why],host[k],k);
  assert.equal(q.ops.calTech.ok,false);assert.match(q.ops.calTech.why,/Yetersiz istihbarat/);assert.equal(q.ops.calTech.viableDesc,'','locked card leaks no counts');
  assert(!JSON.stringify(q).includes('"risk"'),'no exact risk value');assert(!('techs' in q)&&!('res' in q));
  assert.equal(cmd(h,A,{kind:'spyQuote',target:9}).code,'no-target','nonexistent empire');assert.equal(cmd(h,A,{kind:'spyQuote',target:99}).code,'bad-params');
});
test('operasyon (spyOp): zar host\'ta, maliyet BİR kez, sonuç yalnız B\'ye; bayat onay "stale"; yetersiz seviye motor gerekçesiyle; reddedilen komut Save8/RNG değiştirmez; aynı cid ikinci kez uygulanmaz',()=>{
  const h=world(LVL(B,C,1));const q=cmd(h,B,{kind:'spyQuote',target:C}).extra.ops.kervan;assert.equal(q.ok,true);
  let s0=st(h);let r=cmd(h,B,{kind:'spyOp',target:C,op:'kervan',cost:JSON.stringify(q.cost),riskPct:q.riskPct+1});assert.equal(r.code,'rules:stale');assert.deepEqual(st(h),s0,'stale: no change');
  r=cmd(h,B,{kind:'spyOp',target:C,op:'calTech',cost:'{"etk":60}',riskPct:35});assert.equal(r.code,'rules:spy');assert.deepEqual(st(h),s0);
  const etk0=J(h,`G.emps[${B}].res.etk`);r=cmd(h,B,{kind:'spyOp',target:C,op:'kervan',cost:JSON.stringify(q.cost),riskPct:q.riskPct},'m64dup000001');assert.equal(r.status,'ok');
  assert.notEqual(h.run('RND_STATE'),s0.rng,'host engine rolled the dice');assert.equal(Math.round(etk0-J(h,`G.emps[${B}].res.etk`)),q.cost.etk);
  assert.equal(typeof r.extra.msg,'string');assert.equal(typeof r.extra.caught,'boolean');
  const s1=st(h);const d=cmd(h,B,{kind:'spyOp',target:C,op:'kervan',cost:JSON.stringify(q.cost),riskPct:q.riskPct},'m64dup000001');assert(d.dup,'duplicate flagged');assert.deepEqual(st(h),s1,'duplicate cid: cached result, not applied again');
  assert.equal(J(h,`G.emps[${B}].opLog.at(-1).k`),'kervan');
});
test('gizlilik (3 insan): B, C\'ye operasyonlar yürütür; C yalnız motorun izin verdiğini görür — yakalanmayanda fail adı yok, yakalananda B; A hiçbir şey görmez; C\'nin aynasında bilinmeyen failin kimliği yok',()=>{
  const h=world(LVL(B,C,1));let caught=0,hidden=0;const nB=J(h,`G.emps[${B}].name`);
  for(let i=0;i<14&&(caught===0||hidden===0);i++){const q=cmd(h,B,{kind:'spyQuote',target:C}).extra.ops.kervan;const r=cmd(h,B,{kind:'spyOp',target:C,op:'kervan',cost:JSON.stringify(q.cost),riskPct:q.riskPct});
    assert.equal(r.status,'ok');if(r.extra.caught)caught++;else hidden++;}
  assert(caught>0&&hidden>0,'both outcomes observed: '+caught+'/'+hidden);
  const nC=notes(h,C);assert(nC.some(m=>m.includes('CASUSLUK YAKALANDI — '+nB)),'caught → victim learns the perpetrator');
  const hints=nC.filter(m=>!m.includes(nB));assert(hints.length>=hidden,'uncaught → hint without a name');
  const nA=notes(h,A);assert(!nA.some(m=>/CASUSLUK|istihbarat faaliyeti|Kervan/i.test(m)),'third player A learns nothing');
  const mC=mirror(h,C);const log=mC.emps[0].hitLog;const unknown=log.filter(x=>!x.known);assert(unknown.length>0);assert(unknown.every(x=>!('by' in x)),'mirror: unknown perpetrator not sent');
  assert(log.filter(x=>x.known).every(x=>Number.isInteger(x.by)));assert(log.every(x=>!('framed' in x)));
  const mA=mirror(h,A);assert(!JSON.stringify(mA.emps.filter(e=>e.id!==0).map(e=>[e.opLog,e.hitLog,e.spy])).includes('kervan'),'A\'s mirror: no op logs of others');
  const mB=mirror(h,B);assert(mB.emps[0].opLog.length>0,'B sees its own operation log');
});
test('özel operasyonlar (spySpecial): teknoloji çalma / kışkırtma / soruşturma motorun işlevleriyle; geçersiz tür "bad-op"; başkası adına değil',()=>{
  const h=world(LVL(B,C,3)+LVL(C,B,3));const r1=cmd(h,B,{kind:'spySpecial',op:'stealTech',target:C});
  assert(r1.status==='ok'||r1.code==='rules:engine','stealTech → engine: '+JSON.stringify(r1));
  if(r1.status==='ok'&&r1.extra.tech)assert.equal(J(h,`!!G.emps[${B}].techs[${JSON.stringify(r1.extra.tech)}]`),true,'only the actually acquired tech is revealed');
  const r2=cmd(h,B,{kind:'spySpecial',op:'incite',target:C});assert(r2.status==='ok'||r2.code==='rules:engine',JSON.stringify(r2));
  const r3=cmd(h,C,{kind:'spySpecial',op:'deepInv'});assert(r3.status==='ok'||r3.code==='rules:engine',JSON.stringify(r3));
  assert.equal(cmd(h,B,{kind:'spySpecial',op:'sabotage',target:C,tur:'x',sys:0}).code,'rules:bad-op');
  assert.equal(cmd(h,B,{kind:'spySpecial',op:'nuke',target:C}).code,'bad-params');
  const s0=st(h);h.run(`G.emps[${B}].res.etk=0`);const s1=st(h);const r4=cmd(h,B,{kind:'spySpecial',op:'stealTech',target:C});assert.equal(r4.code,'rules:engine');assert.deepEqual(st(h),s1,'refused: no change');void s0;
});
test('MP.4 kayıt/yükleme: casus ağı ve istihbarat seviyeleri Save8 ile korunur; B yeni süreçte aynı devlete döner ve operasyon yürütür',()=>{
  const h=world(LVL(B,C,2));cmd(h,B,{kind:'spyAssign',target:C});const tB=h.sb.__out.filter(([c,t])=>c==='cB'&&t.includes('"type":"assign"')).map(([,t])=>JSON.parse(t)).at(-1).token;
  const text=JSON.stringify(J(h,'MP.snapshot({})').pkg);
  const g=runtime({root});g.sb.__rand=rnd(700);g.sb.__out=[];g.sb.__text=text;g.run(MIR);g.run(CORE);
  assert.equal(J(g,`(()=>{var V=StarsMP.validatePackage(__text);if(!V.ok)return V;var LW=StarsMP.loadWorld(V.pkg);if(!LW.ok)return LW;
    globalThis.MP=StarsMP.createHost({roomId:'r64r',random:__rand,send:(c,t)=>__out.push([c,t]),kick(){},lobby:{generate(){return {ok:false};}},resume:V.pkg});MP.installGuards();globalThis.seq={};return {ok:true};})()`).ok,true);
  msg(g,'cB',{v:1,type:'hello',name:'Bora',token:tB});g.run('seq.cB='+J(h,'seq.cB'));   // MP.4: oyuncunun son sıra numarası kayıtla gelir
  assert.equal(J(g,'MP.resumeStart().ok'),true);
  assert.deepEqual([J(g,`!!G.emps[${B}].spy[${C}]`),J(g,`intelOf(G.emps[${B}],${C})`)],[true,2]);
  const rq=cmd(g,B,{kind:'spyQuote',target:C});assert.equal(rq.status,'ok',JSON.stringify(rq));const q=rq.extra.ops.hazine;if(q.ok)assert.equal(cmd(g,B,{kind:'spyOp',target:C,op:'hazine',cost:JSON.stringify(q.cost),riskPct:q.riskPct}).status,'ok');
});
end();
