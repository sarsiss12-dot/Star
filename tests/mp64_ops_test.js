'use strict';
/* MP.6.4 — kalan filo / koloni işlemleri, uzak insanlarla. Host'un gerçek STARS motoru (Node vm), seed 22, orta, 5 AI;
   uzak insanlar B=3, C=5. FİKSTÜR (açıkça): kaynak; terraform / habitat için motorun gerektirdiği teknoloji (m_gaia,
   t_habitat) ve parçalanmış gezegen (pl.shattered) motorun alanlarına yazılır.
   Kanıtlanan: her komut yalnız kendi devletinde (başkasının filosu/sistemi/lideri reddedilir); ağdan = motor işlevi;
   reddedilen komut Save8/RNG değiştirmez; motorun gerekçesi döner. */
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');
const {runtime}=require('./helpers/runtime'),{harness}=require('./helpers/95e-fixture');
const {test,end}=harness(),root=path.resolve(__dirname,'..');
const CORE=fs.readFileSync(path.join(root,'research/mp0/mp-core.js'),'utf8');
const B=3,C=5,CONN={[B]:'cB',[C]:'cC'};
function rnd(n0){let n=n0;return k=>crypto.createHash('sha256').update(String(n++)).digest('hex').slice(0,k*2);}
function world(){
  const h=runtime({root});h.sb.__rand=rnd(0);h.sb.__out=[];h.run(CORE);
  h.run(`var MP=StarsMP.createHost({roomId:'r64o',random:__rand,send:(c,t)=>__out.push([c,t]),kick(){},lobby:{generate(s){setupGame({...CFG,...s});applyChosenPersona(G.p,CFG.mizac);G.autoSave=false;return {ok:true};}}});
    MP.installGuards();MP.setCapacity(3);MP.configure({size:'orta',aiCount:5,seed:22});
    for(const [c,e] of [['cB',${B}],['cC',${C}]]){MP.onMessage(c,JSON.stringify({v:1,type:'hello',name:c}));MP.onMessage(c,JSON.stringify({v:1,type:'claim',empire:e}));MP.onMessage(c,JSON.stringify({v:1,type:'ready',value:true}));}
    if(!MP.start().ok)throw Error('start');var seq={};for(const e of G.emps)if(!e.wild)for(const k of ['etk','ene','min','ala','tuk','yiy'])e.res[k]=Math.max(e.res[k],5000);MP.publish();`);
  return h;
}
const J=(h,x)=>JSON.parse(h.run('JSON.stringify('+x+')'));
function cmd(h,who,c){const conn=CONN[who],n=h.sb.__out.length,s=h.run(`seq[${JSON.stringify(conn)}]=(seq[${JSON.stringify(conn)}]||0)+1`);
  h.run(`MP.onMessage(${JSON.stringify(conn)},${JSON.stringify(JSON.stringify({v:1,type:'cmd',seq:s,cid:'m64o'+conn+String(s).padStart(6,'0'),cmd:c}))})`);
  return h.sb.__out.slice(n).filter(([cc])=>cc===conn).map(([,t])=>JSON.parse(t)).find(m=>m.type==='result');}
const st=h=>({save:h.run('serialize()'),rng:h.run('RND_STATE')});
const home=(h,id)=>J(h,`G.emps[${id}].home`);
const fleetOf=(h,id)=>J(h,`G.fleets.find(f=>f.e===${id}&&f.ships.length).id`);
const refused=(h,who,c,code)=>{const s0=st(h);const r=cmd(h,who,c);assert.equal(r.code,code,JSON.stringify(c)+' '+JSON.stringify(r));assert.deepEqual(st(h),s0,'refused: Save8 + RNG unchanged');return r;};

test('gemi siparişi iptali: B kendi sistemindeki siparişini sırasıyla iptal eder (motorun cancelShipOrders\'ı, iade); başkasının sistemi "not-owner", bayat sıra "stale"',()=>{
  const h=world();const hs=home(h,B);const cls=J(h,`Object.keys(SHIPS).find(k=>shipBuildAccess(G.emps[${B}],k).ok)`);
  assert.equal(cmd(h,B,{kind:'ship',sys:hs,key:cls}).status,'ok');const n0=J(h,`G.sys[${hs}].queue.filter(q=>q.e===${B}).length`);assert(n0>=1);
  refused(h,C,{kind:'shipCancel',sys:hs,orders:[J(h,'shipOrderToken(G.sys['+hs+'].queue.filter(q=>q.e==='+B+')[0])')],all:false},'not-owner');refused(h,B,{kind:'shipCancel',sys:hs,orders:['order:zzzzzz'],all:false},'stale');
  const r0=J(h,`G.emps[${B}].res`);assert.equal(cmd(h,B,{kind:'shipCancel',sys:hs,orders:[J(h,'shipOrderToken(G.sys['+hs+'].queue.filter(q=>q.e==='+B+')['+(n0-1)+'])')],all:false}).status,'ok');
  assert.equal(J(h,`G.sys[${hs}].queue.filter(q=>q.e===${B}).length`),n0-1);const r1=J(h,`G.emps[${B}].res`);assert(Object.keys(r1).some(k=>r1[k]>r0[k]),'refund applied by the engine');
});
test('toplanma noktası ve sürekli üretim: B kendi tersane sistemine ralli/döngü kurar ve kaldırır; C\'nin sistemi reddedilir; erişilemeyen sınıf motor gerekçesiyle',()=>{
  const h=world();const hs=home(h,B),hc=home(h,C);
  assert.equal(cmd(h,B,{kind:'rally',sys:hs,target:hc}).status,'ok');assert.deepEqual(J(h,`G.sys[${hs}].rally[${B}]`),{sys:hc});
  assert.equal(cmd(h,B,{kind:'rally',sys:hs,target:null}).status,'ok');assert.equal(J(h,`!!(G.sys[${hs}].rally||{})[${B}]`),false);
  refused(h,B,{kind:'rally',sys:hc,target:hs},'not-owner');
  const cls=J(h,`Object.keys(SHIPS).find(k=>shipBuildAccess(G.emps[${B}],k).ok)`);assert.equal(cmd(h,B,{kind:'loop',sys:hs,cls}).status,'ok');assert.equal(J(h,`G.sys[${hs}].loopBuild`),cls);
  assert.equal(cmd(h,B,{kind:'loop',sys:hs,cls:null}).status,'ok');assert.equal(J(h,`G.sys[${hs}].loopBuild===undefined`),true);
  const locked=J(h,`Object.keys(SHIPS).find(k=>!shipBuildAccess(G.emps[${B}],k).ok)`);if(locked)refused(h,B,{kind:'loop',sys:hs,cls:locked},'rules:access');
  refused(h,C,{kind:'loop',sys:hs,cls},'not-owner');refused(h,B,{kind:'loop',sys:hs,cls:'yok'},'bad-params');
});
test('onarım ve takviye: B kendi filosunda onarımı açar/kapatır, takviye ister (motorun reinforceFleet\'i ya da gerekçesi); C\'nin filosu reddedilir',()=>{
  const h=world();const fb=fleetOf(h,B),fc=fleetOf(h,C);
  assert.equal(cmd(h,B,{kind:'repair',fleet:fb}).status,'ok');assert.equal(J(h,`G.fleets.find(f=>f.id===${fb}).repairOff`),true);
  assert.equal(cmd(h,B,{kind:'repair',fleet:fb}).status,'ok');assert.equal(J(h,`G.fleets.find(f=>f.id===${fb}).repairOff`),false);
  refused(h,B,{kind:'repair',fleet:fc},'not-owner');refused(h,B,{kind:'reinforce',fleet:fc},'not-owner');
  const q=J(h,`fleetReinforcementStatus(G.emps[${B}],G.fleets.find(f=>f.id===${fb}))`),r=cmd(h,B,{kind:'reinforce',fleet:fb});
  if(q.ok)assert.equal(r.status,'ok');else assert.equal(r.code,'rules:engine','engine reason: '+q.why);
  refused(h,B,{kind:'shipment',fleet:fb,action:'cancel'},'rules:engine');refused(h,B,{kind:'shipment',fleet:fc,action:'cancel'},'not-owner');
});
test('lider: B işe alır (Etki), kendi filosuna amiral atar, görevden alır; C\'nin filosuna atama ve C\'nin liderine dokunma reddedilir',()=>{
  const h=world();const fb=fleetOf(h,B),fc=fleetOf(h,C);const n0=J(h,`leaderPool(G.emps[${B}]).length`),etk=J(h,`G.emps[${B}].res.etk`);
  const r=cmd(h,B,{kind:'leader',action:'hire',tip:'amiral'});assert.equal(r.status,'ok',JSON.stringify(r));assert.equal(J(h,`leaderPool(G.emps[${B}]).length`),n0+1);assert.equal(Math.round(etk-J(h,`G.emps[${B}].res.etk`)),60);
  const L=J(h,`leaderPool(G.emps[${B}]).find(l=>l.tip==='amiral'&&l.post===undefined).id`);
  refused(h,B,{kind:'leader',action:'assign',leader:L,tip:'amiral',target:String(fc)},'rules:not-owner');
  assert.equal(cmd(h,B,{kind:'leader',action:'assign',leader:L,tip:'amiral',target:String(fb)}).status,'ok');assert.equal(J(h,`leaderPool(G.emps[${B}]).find(l=>l.id===${L}).post`),fb);
  const cl=J(h,`(cmdC=0,leaderPool(G.emps[${C}]).map(l=>l.id))`);if(cl.length&&!J(h,`leaderPool(G.emps[${B}]).some(l=>l.id===${cl[0]})`))refused(h,B,{kind:'leader',action:'unassign',leader:cl[0]},'not-owner');
  assert.equal(cmd(h,B,{kind:'leader',action:'unassign',leader:L}).status,'ok');assert.equal(J(h,`leaderPool(G.emps[${B}]).find(l=>l.id===${L}).post===undefined`),true);
});
test('terraform / habitat: motorun koşulları (teknoloji, gezegen, sahiplik); geçerli durumda motor işlevi; başkasının sistemi motor gerekçesiyle',()=>{
  const h=world();const hs=home(h,B);
  const pi=J(h,`G.sys[${hs}].planets.findIndex(p=>!p.col)`);assert(pi>=0);
  let r=refused(h,B,{kind:'terraform',sys:hs,planet:pi},'rules:colony');assert.match(r.detail[0],/zaten yaşanabilir|Gaia/);
  h.run(`G.emps[${B}].techs.m_gaia=true;G.sys[${hs}].planets[${pi}].shattered=true;`);const r0=h.run('RND_STATE');
  r=cmd(h,B,{kind:'terraform',sys:hs,planet:pi});assert.equal(r.status,'ok',JSON.stringify(r));assert(J(h,`!!G.sys[${hs}].planets[${pi}].terraform`),'terraform started by the engine');void r0;
  const hc=home(h,C),pc=J(h,`G.sys[${hc}].planets.findIndex(p=>!p.col)`);if(pc>=0){h.run(`G.sys[${hc}].planets[${pc}].shattered=true`);refused(h,B,{kind:'terraform',sys:hc,planet:pc},'rules:colony');}
  const ph=J(h,`G.sys[${hs}].planets.findIndex(p=>!p.col&&p.owner<0&&PLANETS[p.t].k!=='hab'&&PLANETS[p.t].k!=='ast'&&!p.terraform)`);
  refused(h,B,{kind:'habitat',sys:hs,planet:Math.max(0,ph)},'rules:colony');
  if(ph>=0){h.run(`G.emps[${B}].techs.t_habitat=true`);r=cmd(h,B,{kind:'habitat',sys:hs,planet:ph});assert.equal(r.status,'ok',JSON.stringify(r));assert.equal(J(h,`G.sys[${hs}].planets[${ph}].owner`),B);}
});
end();
