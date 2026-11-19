'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { createHash } = require('node:crypto');
const { runtime } = require('../../tests/helpers/runtime');
const candidate = path.resolve(__dirname, '../..');
const control = path.resolve(process.env.STARS_CONTROL_ROOT || '../Star');
const inputs = path.resolve(process.env.CHECKPOINT_DIR || '/tmp/stars-p43');
const output = path.resolve(process.env.STARS_OUTPUT || '/tmp/stars-border');
const sha = text => createHash('sha256').update(text).digest('hex');

const scenario = `
  let fixture = null;
  function observation() {
    const known = explorationContext(G.emps[1]);
    const threats = reinforcementThreats(G.emps[0]);
    return JSON.stringify({
      blocked:[...known.blocked], known:[...known.known], visible:[...known.visible],
      threats:[...threats], owned:[...threats.owned], armed:[...threats.armed], held:[...threats.held],
      owner:claimOf(fixture.target, typeof borderClaimRows==='function'?borderClaimRows():null), day:G.day, rng:RND_STATE,
      pressure:G.emps.map(e=>[e._pressAt,e._press,e._powAt,e._powC])
    });
  }
  function setupTransfer(){
    for(const e of G.emps)for(const k of ['_pressAt','_press','_powAt','_powC'])delete e[k];
    const source=G.sys.find(s=>s.owner===1&&s._reach);
    const target=G.sys.find(s=>s.owner<0&&s!==source);
    source.x=G.W+10000;
    source.y=G.H+10000;
    target.x=source.x+CORE_RADIUS/2;
    target.y=source.y;
    fixture={source,target};
  }
  function toNextMonth(){
    for(let i=0;i<60;i++){
      G.day+=.5; dailyTick(.5); structTick(.5); colonyBuildTick(.5); autoExploreTick();
    }
    monthTick();
  }
`;

const save = fs.readFileSync(path.join(inputs, '500-16-11-m30.save'), 'utf8');
const worlds = [control, candidate].map(root => {
  const h = runtime({ root });
  h.sb.inputSave = save;
  assert(h.run('deserialize(inputSave)'));
  h.run('G.autoSave=false');
  h.run(scenario);
  return h;
});
const states = [];
function check(label, code, observe = true) {
  const records = worlds.map(h => {
    const value = h.run(code);
    const observation = observe ? h.run('observation()') : null;
    return { value, observation, save: h.run('serialize()'), rng: h.run('RND_STATE') };
  });
  assert.deepEqual(records[0], records[1], label);
  const state = records[0];
  states.push({ label, day:JSON.parse(state.save).day, rng:state.rng, save:sha(state.save),
    ...(state.observation ? { observation:JSON.parse(state.observation) } : {}) });
}

check('30→31. ay, gerçek kayıt ve 60 yarım gün', 'toNextMonth()', false);
check('sıfırdan sınır baskısı', 'setupTransfer()');
check('aynı gün sahiplik devri', 'var tx = dealTxBegin(); territoryOwnerSet(fixture.source, 2)');
check('aynı gün işlem geri alma', 'dealTxRollback(tx)');
check('aynı gün erişim sıfıra indi', 'fixture.source._reach = 0');
check('kaydet ve yeniden yükle', `
  var sId=fixture.source.id,tId=fixture.target.id;
  if(!deserialize(serialize()))throw Error('Save8');
  fixture={source:G.sys[sId],target:G.sys[tId]};
`);
check('erişim güncellendi', 'refreshReach()');
assert.equal(states[1].observation.day, 930);
assert.deepEqual(states.slice(1,5).map(state=>state.observation.owner), [1,2,1,-1]);
const h = worlds[1];
const order = JSON.parse(h.run(`
  G.sys=Array.from({length:500},(_,i)=>({id:i,x:10000+i,y:10000,owner:-1,_reach:0}));
  G.sys[0]={id:0,x:-200,y:0,owner:1,_reach:250};
  G.sys[1]={id:1,x:200,y:0,owner:2,_reach:250};
  const target = G.sys[499]; target.x=target.y=0;
  let calls=[];
  borderPressure=e=>{calls.push(e.id);return 1;};
  const tie=claimOf(target,borderClaimRows()), tieCalls=calls;
  calls=[];G.sys[1].x=CORE_RADIUS-1;
  const core=claimOf(target,borderClaimRows()), coreCalls=calls;
  JSON.stringify({tie,tieCalls,core,coreCalls});
`));
assert.deepEqual(order, { tie:1,tieCalls:[1,2],core:2,coreCalls:[1] });
fs.mkdirSync(output, {recursive:true});
fs.writeFileSync(path.join(output,'focused.json'), JSON.stringify({ equal:true, states, order }, null, 2)+'\n');
console.log('PASS', states.length, 'durum; eşit puan / çekirdek sırası aynı');
