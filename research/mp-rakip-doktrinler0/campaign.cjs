'use strict';

const assert = require('node:assert/strict');
const {createHash,randomBytes} = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const {runtime} = require('../../tests/helpers/runtime');

const [root, mode, cfgFile, out] = process.argv.slice(2);
assert(['host','p46-reference'].includes(mode));
const setup = JSON.parse(fs.readFileSync(cfgFile,'utf8'));
const h = runtime({root,processGlobal:true});
h.sb.fixture = setup;
h.sb.reference = mode === 'p46-reference';
h.sb.testRandom = n => randomBytes(n).toString('hex');
h.run(fs.readFileSync(path.join(root,'research/mp0/mp-core.js'),'utf8'));
h.run(`
  function requireOK(result,stage){if(!result?.ok)throw Error(stage+': '+JSON.stringify(result));}
  const {humans,aiRivals,...gameConfig}=fixture;
  const allowed={size:fixture.size,aiCount:fixture.aiCount-humans.length,seed:fixture.seed,shape:fixture.shape};
  const lobby={design:true,hostDraft:()=>({
    name:fixture.name,race:fixture.race,mizac:fixture.mizac,physio:fixture.physio,look:fixture.look,
    origin:fixture.origin,sigil:fixture.sigil,monoRes:fixture.monoRes,
    portraitVariant:fixture.portraitVariant,ethics:fixture.ethics,civics:fixture.civics,traits:fixture.traits
  }),generate(set){
    const {host,humans:seats,...world}=set;
    const expected=reference&&aiRivals?{aiRivals}:{};
    // Save8 serileştirmesi alan sırasını da taşır. Referans aynı girdiyi aynı düzenle kurar.
    setupGame({...gameConfig,...world,...expected,humans:seats});
    if(fixture.mizac)applyChosenPersona(G.p,fixture.mizac);
    G.autoSave=false;
    return {ok:true};
  }};
  const game=StarsMP.createHost({roomId:'campaign',random:testRandom,send(){},lobby});
  game.installGuards();
  requireOK(game.setCapacity(3),'capacity');
  requireOK(game.configure({...allowed,...(!reference&&aiRivals?{aiRivals}:{})}),'configure');
  for(const [i,draft] of humans.entries()){
    const connection='guest-'+i;
    const send=message=>game.onMessage(connection,JSON.stringify({v:1,...message}));
    send({type:'hello',name:draft.name});
    send({type:'draft',rev:1,draft});
    send({type:'ready',value:true});
  }
  requireOK(game.start(),'start');
  if(G.emps.filter(StarsMP.isHumanActor).length!==3||
    G.emps.filter(e=>e.ai&&!e.wild&&!e.crisisSide).length!==9||G.sys.length!==100)throw Error('world size');
  const initialPersonas=G.emps.filter(e=>!e.wild&&!e.crisisSide).map(e=>[e.id,e.ai,personaKey(e)]);
  function stepMonth(){
    const month=Math.floor(G.day/30);
    for(let step=0;step<60&&!G.over;step++){
      G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();
      if(Math.floor(G.day/30)>month)monthTick();
      if(Number.isInteger(G.day))game.observeHumans();
    }
  }
  function record(){
    const live=G.emps.filter(e=>!e.dead&&!e.wild&&!e.crisisSide).map(e=>e.id);
    const feds=G.feds.map(f=>({id:f.id,type:f.type,members:f.members.filter(id=>live.includes(id))}));
    return {day:G.day,over:!!G.over,rng:RND_STATE,live,feds,
      largest:Math.max(0,...feds.map(f=>f.members.length))};
  }
`);
const months=[];
const limit=Number(process.env.STARS_CAMPAIGN_MONTHS||180);
for(let month=0;month<=limit;month++){
  if(month)h.run('stepMonth()');
  const row=JSON.parse(h.run('JSON.stringify(record())'));
  row.save8=createHash('sha256').update(h.run('serialize()')).digest('hex');
  months.push(row);
  if(row.over)break;
}
const personas=JSON.parse(h.run('JSON.stringify(initialPersonas)'));
fs.writeFileSync(out,JSON.stringify({seed:setup.seed,aiRivals:setup.aiRivals,personas,months})+'\n');
process.stdout.write(JSON.stringify({mode,seed:setup.seed,months:months.length,final:months.at(-1)})+'\n');
