'use strict';

const assert=require('node:assert/strict');
const {sensorWorld}=require('./helpers/95e3-fixture');
const {world,cmd,J}=require('./helpers/beta-fed-found0-mp-world.cjs');
const {harness}=require('./helpers/95e-fixture');
const {test,end}=harness();

test('Tek yönlü ve karşılıklı sensör kayıtları canlı ve kalıcı bilgiyi zincirlemez',()=>{
  const h=sensorWorld();
  h.run(`G.sys[10].owner=2;G.sys[11].seen=[2];rememberNativeChart(G.sys[11],2);
    G.emps[1].visionFrom[2]=true;
    G.p.visionFrom[1]=true;
    for(let i=0;i<2;i++)visionTick();`);
  assert(h.run('G.sys[10].seen.includes(1)&&G.sys[11].seen.includes(1)'));
  assert.equal(h.run('pVis(G.sys[10])||pSeen(G.sys[10])||pSeen(G.sys[11])'),false);
  h.run('G.p.visionFrom={};G.p.shareVis[1]=G.emps[1].shareVis[0]=true;visionTick();');
  assert.equal(h.run('pSeen(G.sys[10])||pSeen(G.sys[11])'),false);
  assert(h.run('pSeen(G.sys[8])&&pVis(G.sys[6])'));
  h.run(`var saved=serialize(),rng=RND_STATE;deserialize(saved);visionTick();`);
  assert.equal(h.run('pSeen(G.sys[11])'),false);
  assert(h.run('pSeen(G.sys[8])&&RND_STATE===rng'));
  h.run('endShareVision(G.p,G.emps[1]);');
  assert(h.run('pSeen(G.sys[8])&&!pVis(G.sys[6])'));
});

test('Eski kaydın kaynağı belirsiz haritası sahibinde kalır, sonraki alıcıya geçmez',()=>{
  const h=sensorWorld();
  h.run(`G.sys[16].seen=[1];G.p.visionFrom[1]=true;
   var raw=JSON.parse(serialize());
   for(const s of raw.sys)delete s.nc;
   deserialize(JSON.stringify(raw));visionTick();`);
  assert(h.run('G.sys[16].seen.includes(1)'));
  assert.equal(h.run('pSeen(G.sys[16])'),false);
  h.run('rememberNativeChart(G.sys[16],1);visionTick();');
  assert(h.run('pSeen(G.sys[16])'));
});

test('AI uzak insanın sensörünü imzadan önce kullanamaz ve masraf doğmaz',()=>{
  const h=world();
  h.run(`for(const e of G.emps){e.contact={};e.ally={};e.visionFrom={};e.shareVis={};e.spynet={};e._pactCd=0;}
    var from=G.emps.find(e=>e.ai&&!e.dead&&!e.wild&&!e.crisisSide), to=G.emps[1];
    from.contact[to.id]=to.contact[from.id]=true;
    from.rel[to.id]=to.rel[from.id]=65;
    from.res.etk=1000;to.res.etk=1000;
    var before=RND_STATE;aiIntelPactTick();`);
  assert.equal(h.run('!!from.visionFrom[to.id]||!!to.visionFrom[from.id]'),false);
  assert(h.run('from.res.etk===1000&&to.res.etk===1000&&RND_STATE===before'));
  const pending=J(h,'MP.dip.offers.find(o=>o.from===from.id&&o.to===1&&o.status==="pending")');
  assert(pending);
  assert.deepEqual(pending.give,[{t:'intel'}]);
  assert.deepEqual(pending.want,[{t:'intel'}]);
  assert.equal(cmd(h,'B',{kind:'respond',offer:pending.id,action:'accept'}).status,'ok');
  assert(h.run('from.visionFrom[to.id]&&to.visionFrom[from.id]'));
  assert(h.run('from.res.etk===955&&to.res.etk===1000'));
  assert.notEqual(cmd(h,'B',{kind:'respond',offer:pending.id,action:'accept'}).status,'ok');
  assert(h.run('from.res.etk===955&&RND_STATE===before'));
});
end();
