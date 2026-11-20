'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { runtime } = require('./helpers/runtime');

const surplus = {ene:30,min:50,yiy:25,ala:25,tuk:20,ara:20,etk:20};

function fixture() {
  const h = runtime();
  h.sb.surplus = surplus;
  h.run(`
    setupGame({...CFG,size:setupSizeKey(100),aiCount:9,seed:11});
    const state=G.emps[1],location=state.colonies[0],system=G.sys[location.s];
    const planet=system.planets[location.p];
    planet.col.b={dokum:2,liman:1,maden:colonySlots(planet.col,state,planet)-3};
    planet.col.q=[];
    state.inc={...surplus};
    Object.assign(state.res,{min:500,ene:500,yiy:500,ala:500,tuk:500});
  `);
  return h;
}

test('Stratejik ikame kaydedilir, sökümde bir yapı sırası ve bir ödeme oluşturur', () => {
  const h = fixture();
  assert.equal(h.run("queueBuilding(state,system,planet,'lab')"), false, 'slot dolu');
  assert.equal(h.run("queueDemolish(state,system,planet, 'dokum',{key:'lab',choices:{science:true}})"), true);
  h.sb.saved = h.run('serialize()');
  const resumed = runtime();
  resumed.sb.saved = h.sb.saved;
  resumed.sb.surplus = surplus;
  assert.equal(resumed.run('deserialize(saved)'), true);
  resumed.run(`
    const state=G.emps[1],location=state.colonies[0],system=G.sys[location.s];
    const planet=system.planets[location.p];
    // Hold this authored income fixture fixed across the queue round trip.
    state.inc={...surplus};
  `);
  const settle = world => JSON.parse(world.run(`
    JSON.stringify((()=>{
      const before=state.res.min,rng=RND_STATE;
      const dem=planet.col.q[0],price=buildingCost(state,'lab').min;
      colonyBuildTick(dem.left);
      const order=planet.col.q[0],delta=state.res.min-before;
      if(!order)throw Error('İkame işi oluşmadı');
      colonyBuildTick(order.left);
      return {old:planet.col.b.dokum,new:planet.col.b.lab,jobs:planet.col.q.length,
        delta,expected:dem.refund.min-price,paid:order.paid,price,rng,after:RND_STATE};
    })())
  `));
  const a = settle(h), b = settle(resumed);
  assert.deepEqual(a,b);
  assert.equal(a.old,1);
  assert.equal(a.new,1);
  assert.equal(a.jobs,0);
  assert.equal(a.delta,a.expected);
  assert.deepEqual(a.paid,{min:a.price});
  assert.equal(a.rng,a.after);
});

test('İkame ödenemediğinde söküm, ödeme ve hurda iadesi gerçekleşmez', () => {
  const h = fixture();
  h.run(`
    queueDemolish(state,system,planet, 'dokum',{key:'lab',choices:{science:true}});
    state.res.min=buildingCost(state,'lab').min-1;
    var before=state.res.min;
    colonyBuildTick(planet.col.q[0].left);
  `);
  assert.equal(h.run('state.res.min'),h.run('before'));
  assert.equal(h.run('planet.col.b.dokum'),2);
  assert.equal(h.run('planet.col.q.length'),0);
});

test('Kayıptan sonra kalan dolu slot ve yeni bekleyen iş stratejik sökümü durdurur', () => {
  for(const change of [
    'planet.col.pop-=4.5',
    "planet.col.q.push({key:'lab',left:90,tot:90,paid:{min:120}})"
  ]) {
    const h = fixture();
    h.run(`
      queueDemolish(state,system,planet, 'dokum',{key:'lab',choices:{science:true}});
      var before=state.res.min;
      ${change};
      colonyBuildTick(planet.col.q[0].left);
    `);
    assert.equal(h.run('state.res.min'),h.run('before'));
    assert.equal(h.run('planet.col.b.dokum'),2);
  }
});

test('Savaş ve stok krizinin yıkımı, yeni stratejik ikame olmadan eski iade yolunu kullanır', () => {
  const h = fixture();
  assert.equal(h.run("aiUrgentReplacement(state,'kale',true)"),true);
  assert.equal(h.run("state.crisis='enerji'; aiUrgentReplacement(state,'santral',false)"),true);
  assert.equal(h.run("state.crisis=null; state.res.min=0; state.inc.min=-50; aiUrgentReplacement(state,'maden',false)"),true);
  assert.equal(h.run('aiRecoverEconomy(state)'),true);
  const result = JSON.parse(h.run(`JSON.stringify((()=>{
    const job=planet.col.q[0];
    colonyBuildTick(job.left);
    return {key:job.key,marked:Object.hasOwn(job,'replacement'),stock:state.res.min,refund:job.refund.min};
  })())`));
  assert.equal(result.key,'dokum');
  assert.equal(result.marked,false);
  assert.equal(result.stock,result.refund);
});

test('Mineral kurtarma, düşük alaşım stokuyla fabrikayı ve karşılanabilir kayıpla dökümhaneyi seçer', () => {
  for(const [alloy,key,foundries,factories] of [[50,'fabrika',2,0],[500,'dokum',1,1]]) {
    const h = fixture();
    h.sb.alloy = alloy;
    const result = JSON.parse(h.run(`JSON.stringify((()=>{
      planet.col.b.fabrika=1;
      planet.col.b.maden--;
      const loss=aiBuildingDelta(state,system,planet,'dokum',false,-1).ala;
      state.res.min=0;
      state.res.ala=alloy;
      state.inc.min=-12;
      state.inc.ala=-loss/2;
      const queued=aiRecoverEconomy(state),job=planet.col.q[0];
      if(queued)colonyBuildTick(job.left);
      return {loss,queued,key:job?.key,foundries:planet.col.b.dokum,factories:planet.col.b.fabrika||0,
        stock:state.res.min,refund:job?.refund.min};
    })())`));
    assert(result.loss<0);
    assert.equal(result.queued,true);
    assert.equal(result.key,key);
    assert.equal(result.foundries,foundries);
    assert.equal(result.factories,factories);
    assert.equal(result.stock,result.refund);
  }
});

test('Teknoloji veya bina sınırı değişirse ikame işi sökülmeden iptal edilir', () => {
  for(const [key,setup,change] of [
    ['oto_lab', "state.techs.x_automation=true", "delete state.techs.x_automation"],
    ['lab', "planet.col.b.lab=BUILDINGS.lab.max-1; planet.col.b.maden-=planet.col.b.lab",
      "planet.col.b.lab++; planet.col.b.maden--"]
  ]) {
    const h = fixture();
    h.sb.wanted = key;
    h.run(setup);
    assert.equal(h.run("queueDemolish(state,system,planet,'dokum',{key:wanted,choices:{science:true}})"),true);
    h.run(`
      const before=state.res.min;
      ${change};
      colonyBuildTick(planet.col.q[0].left);
    `);
    assert.equal(h.run('state.res.min'),h.run('before'));
    assert.equal(h.run('planet.col.b.dokum'),2);
    assert.equal(h.run('planet.col.q.length'),0);
  }
});
