'use strict';

const assert = require('node:assert/strict');
const {cargoWorld} = require('../../tests/helpers/96a-fixture');

function measure(spacing, blocked) {
  const h = cargoWorld();
  h.sb.spacing = spacing;
  h.sb.blocked = blocked;
  return JSON.parse(h.run(`JSON.stringify((()=>{
    for (let i=0;i<=3;i++) G.sys[i].x=i*spacing;
    const buyer=G.emps[1], offer=terms();
    buyer.inc.min=-10;
    buyer.res.min=125;
    for (const id of [0,3]) G.sys[id].planets[0].col.pop=120;
    const deadline=(buyer.res.min-60)/(-buyer.inc.min)*30;
    const before=Commerce.aiBalance(buyer).min;
    const value=itemValue(buyer,offer.give[0],G.p);
    if (!executeDeal(offer)) throw Error('Sözleşme imzalanmadı');
    const signed=Commerce.aiBalance(buyer).min;
    for(let i=0;i<4;i++) advanceCargo(.5);
    const freight=Commerce.state().convoys.find(v=>v.to===buyer.id);
    if (!freight) throw Error('Yük depodan çıkmadı');
    const afterLoad=buyer.res.min;
    if (blocked) G.sys[1].cr=1;
    const saved=serialize(), rng=RND_STATE;
    function runWindow() {
      while(G.day<361) advanceCargo(.5);
      const v=Commerce.state().convoys.find(v=>v.id===freight.id);
      return {status:v.status,receipt:v.receipt,finished:v.finished,delivered:v.delivered,lost:v.lost,
        stock:Commerce.aiBalance(G.emps[1]).min.stock,rng:RND_STATE};
    }
    const result=runWindow();
    if (!deserialize(saved)) throw Error('Save8 açılamadı');
    const restoredRng=RND_STATE;
    const restored=runWindow();
    return {spacing,blocked,deadline,offerDay:120,value,before,signed,afterLoad,
      loaded:freight.loaded,rng,restoredRng,result,restored};
  })())`));
}

const close = measure(156, false);
const far = measure(1350, false);
const interrupted = measure(156, true);
for (const sample of [close, far, interrupted]) {
  assert.deepEqual(sample.result, sample.restored);
  assert.equal(sample.rng, sample.restoredRng);
  assert.equal(sample.before.need, sample.signed.need);
  assert.equal(sample.signed.incoming, 12);
  assert.equal(sample.afterLoad, sample.before.stock);
  assert.equal(sample.loaded, 12);
}
assert.equal(close.value, far.value);
assert.equal(close.result.status, 'delivered');
assert.equal(far.result.status, 'delivered');
assert(close.result.finished - close.offerDay < close.deadline);
assert(far.result.finished - far.offerDay > far.deadline);
assert.equal(interrupted.result.status, 'destroyed');
assert.equal(interrupted.result.delivered, 0);
assert.equal(interrupted.result.lost, 12);
console.log(JSON.stringify({close, far, interrupted}, null, 2));
