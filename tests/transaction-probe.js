'use strict';
// Usage: node tests/transaction-probe.js /path/to/source
// Uses the bundled real save; the source under inspection is read-only.
const path=require('path');const {runtime}=require('./helpers/runtime');
const root=path.resolve(process.argv[2]||path.join(__dirname,'..'));
const save=process.env.STARS_SAVE||path.join(__dirname,'fixtures/stars-2210-06.sav.json');
function fresh(){const h=runtime({root});h.loadSave(save);h.run(`
  var A=G.emps[0],B=G.emps[1];
  for(const e of [A,B]){e.civics=[];e.mizac='tuccar';e._pers='tuccar';
    e.res.min=10000;e.res.etk=10000;}
  A.contact[B.id]=B.contact[A.id]=true;
  UI.alert=()=>{};AUDIO.forLog=()=>{};
  var offer={from:0,to:1,give:[{t:'res',r:'min',v:100}],want:[]};
`);return h;}
const out={build:null};let h=fresh();out.build=h.run('BUILD_ID');
out.identity=h.run(`(()=>{const list=A.colonies,first=list[0],value=first.s,mods=A.mods;
  const tx=dealTxBegin();A.colonies=list.slice().reverse();A.mods={};
  dealTxRollback(tx);return {array:A.colonies===list,member:A.colonies[0]===first,
    originalMemberValue:first.s===value,mods:A.mods===mods};})()`);
h=fresh();out.depth=h.run(`(()=>{A.probe={};let p=A.probe;for(let i=0;i<30;i++)p=p.next={};
  p.value=1;const tx=dealTxBegin();p.value=2;dealTxRollback(tx);return p.value;})()`);
h=fresh();out.finalCalculation=h.run(`(()=>{const before=A.res.min;recalcMods=()=>{throw Error('final calc')};
  let result=null,error=null;try{result=executeDeal(offer)}catch(e){error=e.message}
  return {result,error,minDelta:A.res.min-before};})()`);
h=fresh();out.nestedLog=h.run(`(()=>{G.log=[{m:'old',detail:{value:1}}];
  const tx=dealTxBegin();G.log[0].detail.value=2;dealTxRollback(tx);return G.log[0].detail.value;})()`);
h=fresh();out.absentBuffer=h.run(`(()=>{delete G._sideBuf;executeDeal(offer);
  return Object.prototype.hasOwnProperty.call(G,'_sideBuf');})()`);
h=fresh();out.nestedExecute=h.run(`(()=>{let alerts=0,child=null;UI.alert=()=>alerts++;
  G._dealFailInject=t=>{if(t==='after:res'){
    child=executeDeal({from:0,to:1,give:[{t:'spynet'}],want:[]});throw Error(t);}};
  const parent=executeDeal(offer);return {parent,child,alerts};})()`);
h=fresh();const times=[];
for(let i=0;i<45;i++){
  const t=process.hrtime.bigint();if(!h.run('executeDeal(offer)'))throw Error('benchmark deal rejected');
  if(i>=5)times.push(Number(process.hrtime.bigint()-t)/1e6);
}
times.sort((a,b)=>a-b);
out.performance={samples:times.length,systems:h.run('G.sys.length'),fleets:h.run('G.fleets.length'),
  medianMs:times[20],p95Ms:times[37]};
console.log(JSON.stringify(out,null,2));
