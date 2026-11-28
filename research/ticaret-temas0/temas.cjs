'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const {createHash}=require('node:crypto');
const {runtime}=require('../../tests/helpers/runtime');
const {sensorWorld}=require('../../tests/helpers/95e3-fixture');
const [baseline,candidate]=process.argv.slice(2).map(x=>path.resolve(x));

const h=sensorWorld();
h.run(`
G.cfg.pirates=false;G.autoSave=false;G.fleets=[];
for(const e of G.emps){
 e.contact={};e.war={};e.ally={};e.pact={};e.visionFrom={};e.shareVis={};
 for(const k in e.res)e.res[k]=1000;
}
for(const s of G.sys){s.owner=-1;s.seen=[];s.surv=[];s.lanes=[];s.nebulaS=false;delete s.nativeChart;}
var A=G.emps[1],B=G.emps[2],C=G.emps[3];
function colony(e,id){
 const s=G.sys[id],p=s.planets[0];
 p.owner=s.owner=e.id;p.col=JSON.parse(JSON.stringify(template));
 p.col.e=e.id;p.col.b.liman=1;p.col.pop=90;p.col.q=[];
 e.colonies.push({s:id,p:0});e.home=id;s.seen=[e.id];s.surv=[e.id];
}
colony(G.p,20);colony(A,0);colony(B,3);colony(C,4);
for(let i=0;i<=4;i++){G.sys[i].x=100+i*52;G.sys[i].y=100;if(i>0)link(i-1,i);}
A.contact[B.id]=B.contact[A.id]=true;
B.contact[C.id]=C.contact[B.id]=true;
A.ally[B.id]=B.ally[A.id]=true;
A.visionFrom[B.id]=true;
var scout=newFleet(A,0,[{c:'bil'}],'Temas gemisi');
scout.auto=true;
updateVision();
`);
const raw=h.run('serialize()');
const options={baseline,candidate};
const list={};
for(const [arm,root] of Object.entries(options)){
 for(const condition of ['shared','none','war','blocked','shareVis']){
  const w=runtime({root});
  w.sb.raw=raw;w.sb.mode=condition;
  assert(w.run('deserialize(raw)'),arm);
  w.run(`
  var a=G.emps[1],b=G.emps[2],c=G.emps[3],f=G.fleets.find(f=>f.e===1);
  if(mode==='none')a.visionFrom={};
  if(mode==='shareVis'){a.visionFrom={};a.shareVis={2:true};b.shareVis={1:true};}
  if(mode==='war'){a.war[2]=b.war[1]=true;}
  if(mode==='blocked'){G.sys[2].lanes=[1];G.sys[3].lanes=[4];}
  var before={day:G.day,contact:!!a.contact[3],human:humanVisionContext(a).visible.has(4)};
  var orders=[],last;
  for(let i=0;i<100;i++){
   autoExploreTick(1);
   if(f.explore?.target!==last){last=f.explore?.target;orders.push({day:G.day,target:last??null,path:[...f.path]});}
   G.day+=.5;stepFleets(.5);
   if(a.contact[3])break;
  }
  var after={day:G.day,contact:!!a.contact[3],reciprocal:!!c.contact[1],rng:RND_STATE,
    owner:G.sys[4].owner,system:f.sys,stock:a.res.min,otherStock:c.res.min};
  `);
  list[arm+':'+condition]=JSON.parse(w.run('JSON.stringify({before,orders,after})'));
 }
}
const first=key=>list[key].orders[0]?.target;
console.log(JSON.stringify({save:createHash('sha256').update(raw).digest('hex'),...list},null,2));
if(process.env.STARS_EXPECT_CONTACT==='1'){
 assert.notEqual(first('baseline:shared'),4);
 for(const condition of ['shared','shareVis']){
  const trial=list['candidate:'+condition];
  assert.equal(trial.before.contact,false);
  assert.equal(first('candidate:'+condition),4);
  assert.equal(trial.after.contact&&trial.after.reciprocal,true);
  assert.equal(trial.after.system,4);
  assert(trial.after.day<list['baseline:shared'].after.day);
 }
 for(const condition of ['none','war','blocked'])assert.notEqual(first('candidate:'+condition),4);
 assert.equal(list['candidate:blocked'].after.contact,false);
}
