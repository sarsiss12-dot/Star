'use strict';
/* TİCARET-AĞ.2 — AI–AI düzenli ticaret sözleşmesi için daraltılmış işlem kopyası (diplomacy.js dealTxScope / dealTxBegin(scope)).
   X1 Yazma kümesi: her biçimde (freight çifti, portTransit, freight + portTransit; pact haber + ekonomi geçmişi yazdığı için kapsam dışı → tam işlem) tam dünya yakalamasıyla
      karşılaştırılan bütün değişen nesneler daraltılmış kapsamın yakalamasının içinde; kök ilkel alanlar değişmez.
   X2 Geri alma: her hata kancasında (before:/after: madde, after:items/cost/goodwill/recalc/log, son) işlem false, Save8 bayt-bayt aynı, RNG aynı.
   X3 Başarı eşdeğerliği: aynı dünyada daraltılmış ve tam işlem (G._dealTxFull) aynı Save8 / RNG üretir; ikinci yürütme ikinci sözleşme / ödeme üretmez.
   X4 Kapsam seçimi: insan taraf, res maddesi, pact, G.commerce yokken tam işlem (null). */
const assert=require('assert/strict');const {cargoWorld}=require('./helpers/96a-fixture');
let pass=0,fail=0;function test(n,fn){try{fn();pass++;console.log('✓ '+n);}catch(e){fail++;console.log('✗ '+n+' — '+String(e&&e.message||e).split('\n')[0]);}}
const J=(h,x)=>JSON.parse(h.run('JSON.stringify('+x+')'));
function world(){const h=cargoWorld();
  h.run(`G.sys[3].planets[0].col=null;G.emps[1].colonies=[];port(G.emps[2],3);port(G.emps[3],6);for(let i=3;i<6;i++)link(i,i+1);
    for(const id of [3,6])G.sys[id].planets[0].col.pop=120;for(const e of [G.emps[2],G.emps[3]]){e.ai=true;e.res.etk=500;e.res.min=500;e.res.ene=500;}
    G.emps[2].contact[3]=G.emps[3].contact[2]=true;G.emps[2].rel[3]=G.emps[3].rel[2]=60;Commerce.state();
    (G.emps[2].pact||={})[3]=true;(G.emps[3].pact||={})[2]=true;   /* AI'nın gerçek düzenli sözleşmesi gibi: ticaret anlaşması zaten var */
    var SH={
      freight:{from:2,to:3,give:[{t:'freight',r:'min',v:5,source:3,target:6,every:30,months:12}],want:[{t:'freight',r:'ene',v:5,source:6,target:3,every:30,months:12}]},
      pact:{from:2,to:3,give:[{t:'pact'}],want:[]},
      transit:{from:2,to:3,give:[{t:'portTransit'}],want:[]},
      mixed:{from:2,to:3,give:[{t:'freight',r:'min',v:5,source:3,target:6,every:30,months:12},{t:'portTransit'}],want:[{t:'freight',r:'ene',v:5,source:6,target:3,every:30,months:12}]}};
    function rootVals(){const v=[];for(const k of DEAL_TX_ROOTS){const d=Object.getOwnPropertyDescriptor(G,k);if(d&&'value' in d)v.push(d.value);}return v;}
    function changedOutside(off){const q=dealQuote(off);if(!q.ok)return {err:q.reasons};const scope=dealTxScope(q.norm);if(!scope)return {err:'kapsam yok'};
      const inScope=new Set(txCaptureGraph(scope).map(r=>r.obj));const before=txCaptureGraph(rootVals());const prim={};for(const k of DEAL_TX_ROOTS){const v=G[k];if(!(v&&typeof v==='object'))prim[k]=v;}
      const ok=executeDeal(off);let changed=0,outside=[];
      for(const rec of before){const o=rec.obj,keys=Reflect.ownKeys(o);let ch=keys.length!==rec.keys.length;
        for(let i=0;!ch&&i<rec.keys.length;i++){const d=rec.props[i],now=Object.getOwnPropertyDescriptor(o,rec.keys[i]);if(!now||('value' in d)&&!Object.is(d.value,now.value))ch=true;}
        if(ch){changed++;if(!inScope.has(o))outside.push(Object.keys(o).slice(0,6).join(','));}}
      const primCh=DEAL_TX_ROOTS.filter(k=>{const v=G[k];return !(v&&typeof v==='object')&&!Object.is(prim[k],v);});
      return {ok,changed,outside,primCh};}`);
  return h;}

for(const shape of ['freight','transit','mixed'])test('X1 yazma kümesi ('+shape+'): değişen her nesne daraltılmış kapsamda, kök ilkel alan değişmez',()=>{
  const h=world();const r=J(h,`changedOutside(SH.${shape})`);
  assert.ok(!r.err,'teklif geçerli: '+JSON.stringify(r.err));assert.equal(r.ok,true,'anlaşma uygulandı');assert.ok(r.changed>0,'gerçekten yazdı');
  assert.deepEqual(r.outside,[],'kapsam dışı değişen nesne yok');assert.deepEqual(r.primCh,[],'kök ilkel alan değişmedi');});

const HOOKS=['before:freight','after:freight','before:portTransit','after:portTransit','after:items','after:cost','after:goodwill','after:recalc','after:log','son'];
test('X2 geri alma: her hata kancasında (10 kanca × 3 biçim) işlem false, Save8 bayt-bayt ve RNG aynı',()=>{
  const bad=[];for(const shape of ['freight','transit','mixed'])for(const hook of HOOKS){const h=world();
    const r=J(h,`(()=>{const off=SH.${shape};const q=dealQuote(off);const scoped=!!dealTxScope(q.norm);const s0=serialize(),r0=RND_STATE;let hit=false;
      G._dealFailInject=k=>{if(k==='${hook}'){hit=true;throw Error('enjekte');}};const ok=executeDeal(off);delete G._dealFailInject;
      return {scoped,hit,ok,same:serialize()===s0,rng:RND_STATE===r0};})()`);
    if(!r.hit)continue;if(!r.scoped||r.ok||!r.same||!r.rng)bad.push(shape+'/'+hook+' '+JSON.stringify(r));}
  assert.deepEqual(bad,[]);});

test('X3 başarı eşdeğerliği: daraltılmış ve tam işlem aynı Save8 / RNG; ikinci yürütme ikinci sözleşme üretmez',()=>{
  for(const shape of ['freight','mixed','transit']){const a=world(),b=world();b.run('G._dealTxFull=true');
    const ra=J(a,`(()=>{const ok=executeDeal(SH.${shape});const again=executeDeal(SH.${shape});delete G._dealTxFull;return {ok,again,n:G.commerce.contracts.length,etk:G.emps[2].res.etk};})()`);
    const rb=J(b,`(()=>{const ok=executeDeal(SH.${shape});const again=executeDeal(SH.${shape});delete G._dealTxFull;return {ok,again,n:G.commerce.contracts.length,etk:G.emps[2].res.etk};})()`);
    assert.deepEqual(ra,rb,shape+' sonuç');assert.equal(a.run('serialize()'),b.run('serialize()'),shape+' Save8 aynı');assert.equal(a.run('RND_STATE'),b.run('RND_STATE'),shape+' RNG aynı');
    if(shape!=='transit')assert.equal(ra.again,false,'aynı sözleşme ikinci kez yok');}});

test('X4 kapsam seçimi: insan taraf, res maddesi ve G.commerce yokken tam işlem',()=>{
  const h=world();const r=J(h,`(()=>{const sc=o=>{const q=dealQuote(o);return q.ok?!!dealTxScope(q.norm):'q:'+q.reasons[0];};
    const human=sc({from:0,to:3,give:[{t:'pact'}],want:[]});const res=sc({from:2,to:3,give:[{t:'pact'},{t:'res',r:'min',v:5}],want:[]});
    const ai=sc(SH.freight),pact=sc({from:2,to:3,give:[{t:'pact'}],want:[]});const saved=G.commerce;delete G.commerce;const none=dealTxScope({effectiveGive:[{t:'pact'}],effectiveWant:[],from:2,to:3});G.commerce=saved;
    return {human,res,ai,pact,none};})()`);
  assert.equal(r.human,false,'insan taraf → tam');assert.equal(r.res,false,'res maddesi → tam');assert.equal(r.ai,true,'AI–AI freight → daraltılmış');assert.ok(r.pact===false||String(r.pact).startsWith('q:'),'pact → tam işlem '+r.pact);assert.equal(r.none,null,'G.commerce yok → tam');});

console.log(`GEÇEN: ${pass} KALAN: ${fail}`);process.exitCode=fail?1:0;
