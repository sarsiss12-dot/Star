'use strict';
// Real production deals; no applyItems/recalcMods/postcondition stub on the
// normal path. Fault injection is explicit. No browser/device claims here.
const assert=require('assert/strict'), path=require('path'), fs=require('fs');
const {runtime}=require('./helpers/runtime');
const ROOT=process.env.STARS_SOURCE_ROOT || path.resolve(__dirname,'..');
const SAVE=process.env.STARS_SAVE || path.join(__dirname,'fixtures/stars-2210-06.sav.json');
let pass=0,fail=0;
function test(name,fn){try{fn();pass++;console.log('✓ '+name);}catch(e){fail++;console.log('✗ '+name+': '+e.message);}}
function eq(actual,expected=true){assert.equal(actual,expected);}

// Independent read-only oracle: enumerates ALL G roots, not DEAL_TX_ROOTS.
// Keeps original objects and compares every own slot by identity/value.
// It never invokes production snapshot/rollback to establish expectations.
function photograph(h){
  const root=h.run('G'), nodes=[],seen=new Set();
  const stack=[{obj:root,label:'G'}];
  while(stack.length){
    const {obj,label}=stack.pop();
    if(!obj||typeof obj!=='object'||seen.has(obj))continue;
    seen.add(obj);
    const keys=Reflect.ownKeys(obj).filter(k=>!(obj===root&&k==='_dealFailInject'));
    const slots=keys.map(k=>[k,Object.getOwnPropertyDescriptor(obj,k)]);
    const tag=Object.prototype.toString.call(obj);
    const entries=tag==='[object Map]'?[...obj]:tag==='[object Set]'?[...obj].map(v=>[v,v]):null;
    nodes.push({obj,label,slots,entries,tag,proto:Object.getPrototypeOf(obj)});
    for(const [k,d] of slots)if('value'in d)stack.push({obj:d.value,label:label+'.'+String(k)});
    if(entries)for(const [k,v]of entries)stack.push({obj:k,label:label+'.key'},{obj:v,label:label+'.value'});
  }
  const rng=h.run('RND_STATE');
  return ()=>{
    eq(h.run('G'),root);eq(h.run('RND_STATE'),rng);
    for(const {obj,label,slots,entries,tag,proto} of nodes){
      eq(Object.getPrototypeOf(obj),proto);
      const keys=Reflect.ownKeys(obj).filter(k=>!(obj===root&&k==='_dealFailInject'));
      assert.equal(keys.length,slots.length,label+' own key count');
      for(const [k,d]of slots){
        const actual=Object.getOwnPropertyDescriptor(obj,k);
        assert.ok(actual,label+'.'+String(k)+' missing');
        for(const part of Reflect.ownKeys(d))
          assert.ok(Object.is(actual[part],d[part]),label+'.'+String(k)+'.'+String(part)+' changed');
      }
      if(entries){
        const actual=tag==='[object Map]'?[...obj]:[...obj].map(v=>[v,v]);
        eq(actual.length,entries.length);
        entries.forEach(([k,v],i)=>{eq(actual[i][0],k);eq(actual[i][1],v);});
      }
    }
  };
}
function fresh(){
  const h=runtime({root:ROOT});h.loadSave(SAVE);
  h.run(`
    var A=G.emps[0],B=G.emps[1],C=G.emps[3],D=G.emps[4],E=G.emps[5];
    for(const e of G.emps){
      if(e.wild||e.crisisSide)continue;
      e.civics=[];e.ethics={mil:0,aut:0,mat:0,ahl:0};e.mizac='tuccar';e._pers='tuccar';
      e.overlord=null;e.vassalType=null;e.war={};e.ally={};e.pact={};e.nap={};e.spynet={};
      e.passage={};e.visionFrom={};e.proxyWar={};e.tribute=[];e.luxGrant={};
      for(const r of ['min','ene','yiy','ala','tuk','etk'])e.res[r]=10000;
      for(const o of G.emps){if(o.id===e.id||o.wild||o.crisisSide)continue;
        e.contact[o.id]=true;e.rel[o.id]=65;}
      recalcMods(e);
    }
    G.feds=[];G.council=null;
    UI.alert=()=>{};UI.warDeclared=()=>{};AUDIO.forLog=()=>{};
    function setupWar(a,b){a.war[b.id]=b.war[a.id]=true;
      a.exh=a.exh||{};b.exh=b.exh||{};a.exh[b.id]=b.exh[a.id]=99;
      a.warSince=a.warSince||{};b.warSince=b.warSince||{};
      a.warSince[b.id]=b.warSince[a.id]=0;}
    function setupColony(){
      const sys=G.sys.find(s=>s.owner<0&&s.planets.some(p=>PLANETS[p.t].k==='hab'&&!p.col));
      const pl=sys.planets.find(p=>PLANETS[p.t].k==='hab'&&!p.col);
      doColonize(A,sys,pl);return sys;
    }
  `);
  return h;
}
function fixture(kind,want=false){
  const h=fresh();h.sb.__kind=kind;h.sb.__want=want;
  h.run(`
    var item={t:__kind},sy=null;
    if(__kind==='res'||__kind==='tribute'){item.r='min';item.v=__kind==='res'?100:5;}
    if(__kind==='sys'){sy=setupColony();item.id=sy.id;}
    if(__kind==='tech'){item.id=Object.keys(TECHS).find(k=>!B.techs[k]);A.techs[item.id]=true;}
    if(__kind==='lux'){item.k=Object.keys(LUXURY)[0];A.luxOwn=A.luxOwn||{};A.luxOwn[item.k]=1;}
    if(__kind==='peace')setupWar(A,B);
    if(__kind==='peaceWith'){setupWar(A,C);item.target=C.id;}
    if(__kind==='warOn')item.target=C.id;
    // Guarantee a real sight mutation in addition to the visionFrom flag.
    if(__kind==='intel'){sy=G.sys.find(s=>s.seen.includes(A.id));
      sy.seen=sy.seen.filter(id=>id!==B.id);sy.vis=[A.id];}
    var offer=__want?{from:B.id,to:A.id,give:[],want:[item]}:
                    {from:A.id,to:B.id,give:[item],want:[]};
    var givenMin=A.res.min,takenMin=B.res.min;
    function applied(){switch(item.t){
      case 'res':return A.res.min===givenMin-100&&B.res.min===takenMin+100;
      case 'tribute':return A.tribute.some(x=>x.to===B.id&&x.r==='min'&&x.v===5);
      case 'sys':return sy.owner===B.id&&sy.planets.some(p=>p.col&&p.owner===B.id)&&
        B.colonies.some(c=>c.s===sy.id)&&!A.colonies.some(c=>c.s===sy.id);
      case 'tech':return B.techs[item.id]===true;
      case 'lux':return B.luxGrant[item.k]===A.id;
      case 'peace':return A.war[B.id]===false&&B.war[A.id]===false;
      case 'peaceWith':return A.war[C.id]===false&&C.war[A.id]===false;
      case 'nap':return A.nap[B.id]===G.day+3600&&B.nap[A.id]===G.day+3600;
      case 'pact':return A.pact[B.id]===true&&B.pact[A.id]===true;
      case 'ally':return A.ally[B.id]===true&&B.ally[A.id]===true;
      case 'warOn':return A.war[C.id]===true&&C.war[A.id]===true&&A.proxyWar[C.id]===B.id;
      case 'intel':return B.visionFrom[A.id]===true&&sy.seen.includes(B.id);
      case 'spynet':return A.spynet[B.id]===true&&B.spynet[A.id]===true;
      case 'passage':return A.passage[B.id]===true&&!B.passage[A.id];
    }}
  `);
  return h;
}
test('Oracle detects identity loss even when serialized values match',()=>{
  const h=fresh(),check=photograph(h);
  h.run('G.p.colonies=G.p.colonies.map(c=>({...c}))');
  assert.throws(check,/changed/);
});

const kinds=['res','tribute','sys','tech','lux','peace','nap','pact','ally','warOn','peaceWith','intel','spynet','passage'];
for(const want of [false,true])for(const kind of kinds){
  const h=fixture(kind,want),prefix=(want?'want:':'give:')+kind;
  test(prefix+' real quote is valid and has a new effect',()=>{
    eq(h.run('dealQuote(offer).ok'));eq(h.run('!!applied()'),false);
  });
  for(const point of ['before:'+kind,'after:'+kind,'after:items','after:cost','after:goodwill','after:recalc','after:log','son']){
    let reached=0,mutated=false,alerts=0,audio=0;
    h.sb.__inject=t=>{if(t!==point)return;reached++;mutated=h.run('!!applied()');throw Error(point);};
    h.sb.__alert=()=>alerts++;h.sb.__audio=()=>audio++;
    h.run('G._dealFailInject=__inject;UI.alert=__alert;AUDIO.forLog=__audio;');
    const check=photograph(h),result=h.run('executeDeal(offer)');
    test(prefix+' '+point+' reaches the real mutation boundary',()=>{
      eq(reached,1);eq(mutated,!point.startsWith('before:'));eq(result,false);
    });
    test(prefix+' '+point+' restores the complete G graph/RNG with zero publication',()=>{
      check();eq(alerts,0);eq(audio,0);eq(h.run('_dealTxActive'),false);
    });
    h.run('delete G._dealFailInject');
  }
  test(prefix+' succeeds afterwards; canonical fee paid by proposer once',()=>{
    const cost=h.run('dealQuote(offer).cost'),before=h.run('G.emps[offer.from].res.etk');
    eq(h.run('executeDeal(offer)'));eq(h.run('!!applied()'));
    eq(h.run('G.emps[offer.from].res.etk'),before-cost);
  });
}

test('Nested array reorder/replacement restores original arrays, members and aliases',()=>{
  const h=fresh();h.run(`A.colonies.push({s:99,p:0});A.alias=A.colonies;G.inbox=[{m:{v:1}}];
    G.log=[{m:'old',detail:{v:1}}];`);
  const check=photograph(h);
  h.run(`var tx=dealTxBegin();A.colonies=A.colonies.slice().reverse();A.colonies[0].s=55;
    A.mods={};G.fleets=G.fleets.slice().reverse();G.fleets[0].ships.reverse();
    G.log[0].detail.v=2;G.inbox[0].m.v=2;G.p={};dealTxRollback(tx);`);check();
});
test('Deep graph, cycles, Map/Set, sparse arrays, symbols and absent roots restore',()=>{
  const h=fresh();
  h.run(`A.probe={};var tail=A.probe;for(let i=0;i<80;i++)tail=tail.next={};tail.value=1;
    A.probe.self=A.probe;B.alias=tail;A.probe.map=new Map([[tail,A.probe]]);
    A.probe.set=new Set([tail,A.probe]);A.probe.array=new Array(4);A.probe.array[2]=tail;
    A.probe[Symbol.for('tx')]=tail;delete G.fallStats;delete G.inbox;delete G.inboxUid;`);
  const check=photograph(h);
  h.run(`var tx=dealTxBegin();tail.value=7;B.alias={};A.probe.map.clear();A.probe.set.clear();
    A.probe.array[0]=9;A.probe.array.length=1;delete A.probe[Symbol.for('tx')];
    G.fallStats={x:4};G.inbox=[];G.inboxUid=7;dealTxRollback(tx);`);check();
});
test('Final recalc failure rolls back real transfer; no exception escapes',()=>{
  const h=fixture('res');const check=photograph(h);
  h.run(`var realCalc=recalcMods;recalcMods=()=>{throw Error('final calc')};`);
  eq(h.run('executeDeal(offer)'),false);check();
  h.run('recalcMods=realCalc');eq(h.run('executeDeal(offer)'));
});
test('Snapshot preparation failure returns false without mutation and releases guard',()=>{
  const h=fixture('res');h.run('A.weak=new WeakMap()');const check=photograph(h);
  eq(h.run('executeDeal(offer)'),false);check();eq(h.run('_dealTxActive'),false);
  h.run('delete A.weak');eq(h.run('executeDeal(offer)'));
});
test('Malformed quote getter cannot escape; next normal deal still works',()=>{
  const h=fixture('res'),check=photograph(h);
  eq(h.run(`executeDeal({get from(){throw Error('malformed')}})`),false);check();
  eq(h.run('executeDeal(offer)'));
});
test('Log-write failure rolls back agreement before audio/UI publication',()=>{
  const h=fixture('spynet');let published=0;h.sb.__pub=()=>published++;
  h.run(`UI.alert=__pub;AUDIO.forLog=__pub;Object.freeze(G.log);`);
  const check=photograph(h);eq(h.run('executeDeal(offer)'),false);check();eq(published,0);
});
for(const present of [false,true])for(const failure of [false,true]){
  test('Authority/buffer own-field presence and values: present='+present+', failure='+failure,()=>{
    const h=fixture('res');
    h.run(present?`G._dealAuth='ONCEKI';G._warAuth={a:8,b:9};G._warWhy='ONCEKI';G._sideBuf=null;`:
      `delete G._dealAuth;delete G._warAuth;delete G._warWhy;delete G._sideBuf;`);
    const g=h.run('G'),keys=['_dealAuth','_warAuth','_warWhy','_sideBuf'];
    const ds=keys.map(k=>Object.getOwnPropertyDescriptor(g,k));
    if(failure)h.run(`G._dealFailInject=t=>{if(t==='after:cost'){rnd();throw Error(t)}}`);
    eq(h.run('executeDeal(offer)'),!failure);
    keys.forEach((k,i)=>assert.deepEqual(Object.getOwnPropertyDescriptor(g,k),ds[i]));
  });
}
test('Nested execute is rejected without leaking a child event or charge',()=>{
  const h=fixture('res');let child;
  h.sb.__nested=t=>{if(t==='after:res'){child=h.run(`executeDeal({from:0,to:1,give:[{t:'spynet'}],want:[]})`);throw Error(t);}};
  h.run('G._dealFailInject=__nested');const check=photograph(h);
  eq(h.run('executeDeal(offer)'),false);eq(child,false);check();
});
test('A foreign pending buffer is preserved; execute reports busy without applying',()=>{
  const h=fixture('res');h.run(`G._sideBuf=[{tur:'say',msg:'outer'}]`);
  const check=photograph(h);eq(h.run('executeDeal(offer)'),false);check();
});

// Real multi-party closures, including loss of the last remaining colony.
// That system is not the old capital: a prior conquest is performed first.
test('Colonized system, empire purge and fleet removal are all reached, then rolled back',()=>{
  const h=fixture('sys');
  h.run(`for(const id of new Set(A.colonies.map(c=>c.s)))if(id!==sy.id)captureSystem(G.sys[id],C.id);
    if(A.colonies.some(c=>c.s!==sy.id))throw Error('fixture has other colonies');
    newFleet(A,sy.id,[{c:Object.keys(SHIPS)[0]}],'Rollback fleet');`);
  const check=photograph(h);let reached=false;
  h.sb.__purge=t=>{if(t==='after:sys'){
    reached=h.run('A.dead===true&&!G.fleets.some(f=>f.e===A.id)&&sy.owner===B.id');throw Error(t);}};
  h.run('G._dealFailInject=__purge');eq(h.run('executeDeal(offer)'),false);eq(reached);check();
  h.run('delete G._dealFailInject');eq(h.run('executeDeal(offer)'));eq(h.run('A.dead===true'));
});
test('Independence peace frees vassal and ends proxy war before complete rollback',()=>{
  const h=fixture('peace');h.run(`A.overlord=B.id;A.vassalType='bekci';A.vassalAnger=60;
    A.warCause=A.warCause||{};A.warCause[B.id]='Bağımsızlık Savaşı';setupWar(E,B);E.proxyWar[B.id]=A.id;`);
  const check=photograph(h);let reached=false;
  h.sb.__peace=t=>{if(t==='after:peace'){
    reached=h.run('A.overlord===null&&!E.war[B.id]&&A.freeUntil===G.memAge+60');throw Error(t);}};
  h.run('G._dealFailInject=__peace');eq(h.run('executeDeal(offer)'),false);eq(reached);check();
  h.run('delete G._dealFailInject');eq(h.run('executeDeal(offer)'));eq(h.run('A.overlord===null&&!E.war[B.id]'));
});
test('warOn triggers federation and overlord defense; all third-party state/RNG returns',()=>{
  const h=fixture('warOn');
  h.run(`G.feds=[{id:99,members:[C.id,D.id],laws:{savunma:true}}];C.overlord=E.id;C.vassalType='bekci';
    C.vassalAnger=70;`);
  const check=photograph(h);let reached=false;
  h.sb.__war=t=>{if(t==='after:warOn'){
    reached=h.run('D.war[A.id]===true&&E.war[A.id]===true&&C.vassalAnger===45');throw Error(t);}};
  h.run('G._dealFailInject=__war');eq(h.run('executeDeal(offer)'),false);eq(reached);check();
  h.run('delete G._dealFailInject');eq(h.run('executeDeal(offer)'));eq(h.run('D.war[A.id]&&E.war[A.id]'));
});

test('Council enforcement in a defense chain consumes real RNG and rolls it back',()=>{
  const h=fixture('warOn');
  h.run(`G.feds=[{id:99,members:[C.id,D.id],laws:{savunma:true}}];
    G.council={members:[D.id,E.id],laws:{savasYasak:true},targeted:{savasYasak:A.id}};
    rndSeed(99);`);
  const check=photograph(h),rng=h.run('RND_STATE');let consumed=false;
  h.sb.__council=t=>{if(t==='after:warOn'){
    consumed=h.run('RND_STATE')!==rng;throw Error(t);}};
  h.run('G._dealFailInject=__council');eq(h.run('executeDeal(offer)'),false);eq(consumed);check();
});
test('Second final recalc throws after the first has mutated; both original mods return',()=>{
  const h=fixture('res'),check=photograph(h);
  h.run(`var realCalc=recalcMods;recalcMods=e=>{realCalc(e);if(e===B)throw Error('second calc');};`);
  eq(h.run('executeDeal(offer)'),false);check();
});
test('Log trimming at 60 entries is undone with original first-entry identity',()=>{
  const h=fixture('spynet');h.run(`G.log=Array.from({length:60},(_,i)=>({m:'old-'+i,c:'',d:0}));`);
  const check=photograph(h);let trimmed=false;
  h.sb.__trim=t=>{if(t==='after:log'){trimmed=h.run(`G.log.length===60&&G.log[0].m==='old-1'`);throw Error(t);}};
  h.run('G._dealFailInject=__trim');eq(h.run('executeDeal(offer)'),false);eq(trimmed);check();
});

for(const fault of ['none','audio','alert','ui','all'])test('Commit presentation matrix: '+fault,()=>{
  const h=fresh(),calls=[];h.sb.__call=(kind,msg)=>{calls.push([kind,msg]);
    if(fault===kind||fault==='all')throw Error(kind);};
  h.run(`UI.alert=(msg)=>__call('alert',msg);AUDIO.forLog=()=>__call('audio','');
    UI.warDeclared=()=>__call('ui','');
    var offer={from:B.id,to:C.id,give:[{t:'warOn',target:A.id},{t:'spynet'}],want:[]};`);
  const before=h.run('G.log.length'),cost=h.run('dealQuote(offer).cost'),etk=h.run('B.res.etk');
  eq(h.run('executeDeal(offer)'));eq(h.run('B.res.etk'),etk-cost);eq(h.run('B.war[A.id]'));
  const log=h.run('G.log.slice('+before+')');assert.ok(log.length>=1);
  eq(calls.filter(x=>x[0]==='alert').length,log.length);
  eq(calls.filter(x=>x[0]==='audio').length,log.length);
  eq(calls.filter(x=>x[0]==='ui').length,1);
  assert.deepEqual(calls.filter(x=>x[0]==='alert').map(x=>x[1]),Array.from(log,x=>x.m));
  // Original per-event order is retained even if an earlier consumer throws.
  for(let i=0;i<calls.length;i++)if(calls[i][0]==='audio')eq(calls[i+1][0],'alert');
  eq(h.run(`Object.prototype.hasOwnProperty.call(G,'_sideBuf')`),false);
  eq(h.run(`DIAG.some(x=>x.tur==='deal-presentation')`),fault!=='none');
});

test('Player save, menu and recovery preferences survive a transaction rollback',()=>{
  const h=fixture('spynet');h.run(`MAP_MODE='savas';RADAR_ON=true;LOGI_ON=true;
    View.sel=G.fleets[0];View.selSys=G.sys[A.home];View.cam={x:3000,y:2500,z:1.9};`);
  const cam=h.run('JSON.stringify(View.cam)'),sel=h.run('View.sel'),sys=h.run('View.selSys');
  const check=photograph(h);h.run(`G._dealFailInject=t=>{if(t==='after:log')throw Error(t)}`);
  eq(h.run('executeDeal(offer)'),false);check();eq(h.run('JSON.stringify(View.cam)'),cam);
  eq(h.run('View.sel'),sel);eq(h.run('View.selSys'),sys);
  eq(h.run(`MAP_MODE==='savas'&&RADAR_ON&&LOGI_ON`));
});

// Performance is informational. Wall-clock measurement, no simulated clock.
{
  const h=fixture('res'),times=[];
  for(let i=0;i<20;i++){
    const t=process.hrtime.bigint();const ok=h.run('executeDeal(offer)');
    if(!ok)throw Error('benchmark deal rejected');
    times.push(Number(process.hrtime.bigint()-t)/1e6);
  }
  times.sort((a,b)=>a-b);
  console.log('PERF '+JSON.stringify({systems:h.run('G.sys.length'),fleets:h.run('G.fleets.length'),
    nodes:h.run('dealTxBegin().records.length'),medianMs:times[10],p95Ms:times[18]}));
}
console.log('GEÇEN: '+pass+' KALAN: '+fail);process.exitCode=fail?1:0;
