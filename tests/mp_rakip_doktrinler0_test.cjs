'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {createHash,randomBytes} = require('node:crypto');
const {runtime} = require('./helpers/runtime');

const root = path.join(__dirname,'..');
const core = fs.readFileSync(path.join(root,'research/mp0/mp-core.js'),'utf8');
const host = runtime();
host.sb.random = n => randomBytes(n).toString('hex');
host.run(core);
const inspect = expression => JSON.parse(host.run('JSON.stringify('+expression+')'));
const hash = value => createHash('sha256').update(value).digest('hex');
const report = {};

host.run(`
  const settings = {size:setupSizeKey(100),aiCount:9,seed:11};
  const options = {roomId:'local-test',random,lobby:{design:true,capacity:3,
    hostDraft:()=>({name:CFG.name,race:CFG.race,mizac:CFG.mizac}),
    generate(cfg){setupGame({...CFG,...cfg});return {ok:true};}}};
  const mp=StarsMP.createHost(options);
`);
for (const tension of [undefined,'sakin','calkantili']) {
  for (const aiRivals of [undefined,{min:0,max:0},{min:2,max:4}]) {
    host.sb.incoming = {...(tension ? {tension} : {}), ...(aiRivals ? {aiRivals} : {})};
    assert.equal(host.run('mp.configure({...settings,...incoming}).ok'),true);
    const selected=inspect('mp.lobbyView().settings');
    assert.deepEqual(selected.aiRivals,aiRivals);
    assert.equal(selected.tension,tension);
  }
}
host.run('incoming.aiRivals.max=9');
assert.deepEqual(inspect('mp.lobbyView().settings.aiRivals'),{min:2,max:4});
host.run('mp.lobbyView().settings.aiRivals.max=9');
assert.deepEqual(inspect('mp.lobbyView().settings.aiRivals'),{min:2,max:4});
report.configureMatrix = '9/9, including 0–0 and independent tension';
console.log('PASS', report.configureMatrix);

function unpackWithAudit(save8, header) {
  host.sb.save8=save8;
  const made=inspect('StarsMP.packageFromSave8(save8,{random,now:()=>0})');
  assert(made.ok,made.why);
  host.sb.pkg=made.pkg;
  if(header!==undefined){
    host.sb.header=header;
    host.run(`
      if(header===null)delete pkg.session.settings.aiRivals;
      else pkg.session.settings.aiRivals=header;
      var rehash=()=>{
        const {save8,integrity,...body}=pkg;
        const sha=StarsMP.sha256(save8);
        pkg.integrity={alg:'SHA-256',save8:sha,body:StarsMP.sha256(StarsMP.canon({...body,save8:sha}))};
      };
      rehash();
    `);
  }
  return inspect('StarsMP.validatePackage(pkg)');
}
const save = host.run(`
  setupGame({...CFG,...settings,humans:[{...CFG,name:'Bora',mizac:'teknokrasi'},{...CFG,name:'Cem',mizac:'tuccar'}],
    aiCount:11,aiRivals:{min:3,max:3}});
  G.autoSave=false;
  serialize();
`);
host.sb.initialConfig=JSON.parse(save).cfg;
const worldByTension=[];
for(const tension of [undefined,'sakin','calkantili']){
  host.sb.selectedTension=tension;
  worldByTension.push(inspect(`(()=>{
    const cfg={...initialConfig};
    if(selectedTension)cfg.tension=selectedTension;
    setupGame(cfg);
    return {rng:RND_STATE,personas:G.emps.map(e=>[e.id,e.ai,personaKey(e)]),
      geography:G.sys.map(s=>[s.x,s.y,s.lanes,s.owner])};
  })()`));
}
assert.deepEqual(worldByTension[0],worldByTension[1]);
assert.deepEqual(worldByTension[0],worldByTension[2]);
report.independentCreation=true;
host.sb.initialSave=save;
assert(host.run('deserialize(initialSave)'));
const unchanged=host.run('serialize()');
let result=unpackWithAudit(save);
assert.deepEqual(result.pkg.session.settings.aiRivals,{min:3,max:3});
assert.equal(result.pkg.session.settings.aiCount,9);
assert.equal(result.pkg.save8,save);
assert.equal(unpackWithAudit(save,{min:2,max:4}).why,'rival-mismatch');
assert.equal(unpackWithAudit(save,{min:3,max:10}).why,'rival-range');
assert.equal(host.run('serialize()'),unchanged);
result=unpackWithAudit(save,null);
assert(result.ok);
host.run(`
  var original=assignRivalPersonas,assignments=0;
  assignRivalPersonas=function(...args){assignments++;return original(...args);};
  if(!StarsMP.loadWorld(pkg).ok)throw Error('Save8');
  var resumed=StarsMP.createHost({...options,resume:pkg});
`);
assert.equal(host.run('assignments'),0);
assert.deepEqual(inspect('resumed.lobbyView().settings.aiRivals'),{min:3,max:3});
assert.equal(host.run('resumed.lobbyView().rivalLabel'),'Özel · 3 AI');
assert.deepEqual(inspect('G.emps.filter(StarsMP.isHumanActor).map(e=>e.mizac)'),['yayilmaci','teknokrasi','tuccar']);
report.continue = {headerAbsentRecovered:true,reassignments:0,conflict:'rival-mismatch',invalid:'rival-range',save:hash(save)};
console.log('PASS MP Save8, missing header, disagreement, no redistribution');

host.sb.pkg.build='96h10p46';
host.run('rehash()');
assert(host.run('StarsMP.validatePackage(pkg).ok'));
const natural = host.run('delete G.cfg.aiRivals;serialize()');
assert(unpackWithAudit(natural).ok);
host.sb.pkg.build='96h10p46';
host.run(`
  rehash();
  if(!StarsMP.validatePackage(pkg).ok||!StarsMP.loadWorld(pkg).ok)throw Error('p46 doğal');
  resumed=StarsMP.createHost({...options,resume:pkg});
`);
assert.equal(host.run('resumed.lobbyView().rivalLabel'),'Doğal');
assert.equal(host.run("Object.hasOwn(G.cfg,'aiRivals')"),false);
const single = host.run("setupGame({...CFG,...settings,aiRivals:{min:0,max:0}});G.autoSave=false;serialize()");
assert(unpackWithAudit(single).ok);
assert.equal(inspect('pkg.session.players').length,1);
assert.deepEqual(inspect('pkg.session.settings.aiRivals'),{min:0,max:0});
assert.equal(inspect('pkg.save8'),single);
console.log('PASS p46 Doğal and SP fixed-zero Save8 import');

const late=process.argv[2];
if(late){
  const p46=runtime({root:process.env.STARS_CONTROL_ROOT});
  host.sb.replay=p46.sb.replay=fs.readFileSync(late,'utf8');
  p46.sb.random=host.sb.random;
  p46.run(fs.readFileSync(path.join(process.env.STARS_CONTROL_ROOT,'research/mp0/mp-core.js'),'utf8'));
  host.sb.oldPkg=p46.run(`
    setupGame({...CFG,size:setupSizeKey(100),aiCount:11,seed:11,humans:[{...CFG,name:'Bora'},{...CFG,name:'Cem'}]});
    G.autoSave=false;
    const legacy=StarsMP.packageFromSave8(serialize(),{random,now:()=>0});
    if(!legacy.ok)throw Error(legacy.why);
    JSON.stringify(legacy.pkg);
  `);
  p46.sb.oldPkg=host.sb.oldPkg;
  for(const engine of [host,p46])assert(engine.run(`{
    const verified=StarsMP.validatePackage(oldPkg);
    if(!verified.ok)throw Error(verified.why);
    StarsMP.loadWorld(verified.pkg).ok;
  }`));
  const nextMonth=`
    for(let i=0;i<60;i++){G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();}
    monthTick();
  `;
  for(const engine of [host,p46])engine.run(nextMonth);
  assert.equal(host.run('RND_STATE'),p46.run('RND_STATE'));
  assert.equal(hash(host.run('serialize()')),hash(p46.run('serialize()')));
  report.oldPackage={source:'96h10p46',nextMonthSave8:hash(host.run('serialize()')),nextMonthRng:host.run('RND_STATE')};
  for(const engine of [host,p46])engine.run("if(!deserialize(replay))throw Error('fixture');");
  const sample=`
    JSON.stringify((()=>{
      const f=G.feds.find(f=>f.members.includes(5)), candidate=G.emps[11], via=G.emps[5];
      const order=G.emps.filter(e=>e.id!==candidate.id&&candidate.contact[e.id]&&findFed(e)&&canRequestFederation(candidate,e).ok)
        .map(e=>({id:e.id,score:aiFedWilling(candidate,e,findFed(e).type,findFed(e)).score,rel:candidate.rel[e.id]||0}))
        .filter(x=>x.score>=.5)
        .sort((a,b)=>(G.cfg.aiRivals?b.score-a.score:0)||b.rel-a.rel||a.id-b.id);
      return {willing:aiFedWilling(candidate,via,f.type,f).score,
        vote:aiFedAdmissionScore(via,candidate,f.type,f).score,order,tension:tensionMul(),rng:RND_STATE};
    })())
  `;
  report.score=[];
  for(const open of [false,true]){
    for(const engine of [host,p46])engine.run(open?'G.cfg.aiRivals={min:4,max:7}':'delete G.cfg.aiRivals');
    const row=JSON.parse(host.run(sample));
    assert.deepEqual(row,JSON.parse(p46.run(sample)));
    assert(Math.abs(row.willing-(open?-.0919486514329356:.5080513485670644))<1e-10);
    for(const tension of ['sakin','calkantili']){
      host.run('G.cfg.tension='+JSON.stringify(tension));
      const other=JSON.parse(host.run(sample));
      assert.deepEqual({...other,tension:row.tension},row);
    }
    host.run('delete G.cfg.tension');
    report.score.push({open,...row});
  }
  // Ayrı fikstür. İki adayın da uygun olduğunu varsayıp üretim sıralamasını çalıştır.
  // Yukarıdaki gerçek dünya deneyi ise aday puanının nereden geldiğini denetler.
  const ranking=engine=>JSON.parse(engine.run(`
    JSON.stringify((()=>{
      const candidate=G.emps[11], options=[G.emps[4],G.emps[5]];
      const [near,better]=options;
      for(const o of options)candidate.contact[o.id]=true;
      candidate.rel[near.id]=70;candidate.rel[better.id]=40;
      findFed=e=>options.includes(e)?{members:[e.id],type:'bilimsel'}:null;
      canRequestFederation=(e,o)=>({ok:options.includes(o)});
      aiFedWilling=(e,o)=>({ok:true,score:o===better?.86:.60});
      aiEconomyPlan=()=>({critical:true});
      let selected=null;
      requestFederation=(e,o)=>{selected=o.id;return {ok:false};};
      delete G.cfg.aiRivals;
      aiRivalBlocChoice(candidate);
      const natural=selected;
      G.cfg.aiRivals={min:0,max:0};
      aiRivalBlocChoice(candidate);
      return {natural,open:selected};
    })())
  `));
  report.ranking=ranking(host);
  assert.deepEqual(report.ranking,{natural:4,open:5});
  assert.deepEqual(report.ranking,ranking(p46));
  console.log('PASS p46 SP üyelik puanı, kabul oyu ve Gerilim bağımsızlığı');
}
console.log(JSON.stringify(report,null,2));
