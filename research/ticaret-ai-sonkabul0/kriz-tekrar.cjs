'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const {createHash} = require('node:crypto');
const {runtime} = require('../../tests/helpers/runtime');

const [file,rawPath] = process.argv.slice(2);
const raw=fs.readFileSync(file,'utf8');
const campaign=JSON.parse(fs.readFileSync(rawPath,'utf8'));
const expected=campaign.receipts.find(v=>v.id===273 && v.to===5 && v.r==='min');
assert(expected,'Kontrol makbuzu');
const options=h=>h.run('JSON.stringify({day:G.day,rng:RND_STATE,stock:G.emps[5].res.min})');

function replay(withoutCredit){
 const h=runtime();
 h.sb.raw=raw;
 h.sb.remove=withoutCredit;
 h.sb.stopAt=expected.day;
 assert(h.run('deserialize(raw)'));
 h.run(String.raw`
  G.autoSave=false;
  var changes=[], trace=null;
  const tickFinish=Commerce.finish;
  Commerce.finish=function(v,status,why){
    const ok=tickFinish.apply(this,arguments);
    if(ok&&v.id===273){
      trace={day:G.day,status,receipt:v.receipt,delivered:v.delivered,before:G.emps[5].res.min-v.delivered};
      if(remove&&status==='delivered')G.emps[5].res.min-=v.delivered;
    }
    return ok;
  };
  function watch(){
    const res=G.emps[5].res;
    if(Object.getOwnPropertyDescriptor(res,'min')?.set)return;
    let n=res.min;
    Object.defineProperty(res,'min',{configurable:true,enumerable:true,get(){return n;},set(v){
      if(G.day>=5160 && v!==n)changes.push({day:G.day,before:n,after:v,delta:v-n,
        source:String(new Error().stack).split('\n').slice(2,6).map(s=>s.trim())});
      n=v;
    }});
  }
  while(G.day<stopAt){
   const m=Math.floor(G.day/30);
   watch();
   G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();
   if(Math.floor(G.day/30)!==m)monthTick();
  }
 `);
 const row=JSON.parse(h.run('JSON.stringify({changes,trace})'));
 return {...row,finish:JSON.parse(options(h))};
}

const control=replay(false), withoutCredit=replay(true);
assert.equal(control.trace?.status,'delivered');
assert.equal(control.trace?.day,expected.day);
assert(Math.abs(control.trace.before-expected.before)<1e-6);
assert.equal(control.finish.rng,withoutCredit.finish.rng);
assert(Math.abs(control.finish.stock-withoutCredit.finish.stock-expected.delivered)<1e-6);
assert(withoutCredit.finish.stock>60,'Alıcı bu teslimattan önce rezervin üstündeydi');
console.log(JSON.stringify({saveSha256:createHash('sha256').update(raw).digest('hex'),expected,control,withoutCredit},null,2));
