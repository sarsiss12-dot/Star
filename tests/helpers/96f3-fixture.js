'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{runtime}=require('./runtime');
const fixture=path.resolve(__dirname,'../fixtures/96f3');
function decision(name,root=path.resolve(__dirname,'../..')){
 const h=runtime({root});h.sb.raw=fs.readFileSync(path.join(fixture,name),'utf8');assert(h.run('deserialize(raw)'));
 h.run("for(const x of JSON.parse(raw).emps){const e=G.emps[x.id];for(const k of ['inc','cgNeed','foodNeed'])if(x[k]!==undefined)e[k]=x[k]}");return h;
}
function incomeDelta(h,key,direction=1){h.sb.key=key;h.sb.direction=direction;return JSON.parse(h.run(`JSON.stringify((()=>{const c=a.colonies[0],s=G.sys[c.s],p=s.planets[c.p],old=empireIncome(a,false),b={...p.col.b};p.col.b[key]=Math.max(0,(b[key]||0)+direction);const next=empireIncome(a,false);p.col.b=b;return Object.fromEntries(Object.keys(old).map(r=>[r,next[r]-old[r]]))})())`));}
module.exports={decision,fixture,incomeDelta};
