'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {runtime}=require('../../tests/helpers/runtime');
const [base,input,out]=process.argv.slice(2),save=fs.readFileSync(input,'utf8');
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const rows=[];
for(const root of [base,path.resolve(__dirname,'../..')]){
 const h=runtime({root});h.sb.input=save;
 h.run(`if(!deserialize(input))throw Error('Save8');G.autoSave=false;
 var events=[],q0=dealQuote,ex0=executeDeal;
 dealQuote=function(o){const q=q0.apply(this,arguments);if(o&&o.from!==undefined&&o.to!==undefined){
 events.push({day:G.day,from:o.from,to:o.to,give:o.give,want:o.want,stage:'quote',ok:q.ok,why:q.reasons,ports:[tradeHubs(G.emps[o.from]),tradeHubs(G.emps[o.to])]});}return q;};
 executeDeal=function(o){const ok=ex0.apply(this,arguments);events.push({day:G.day,from:o.from,to:o.to,give:o.give,want:o.want,stage:'execute',ok});return ok;};
 for(let i=0;i<60;i++){G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();}monthTick();`);
 rows.push({rng:h.run('RND_STATE'),save:sha(h.run('serialize()')),events:JSON.parse(h.run('JSON.stringify(events)'))});
}
let i=0;while(i<rows[0].events.length&&JSON.stringify(rows[0].events[i])===JSON.stringify(rows[1].events[i]))i++;
const result={input:sha(save),first:i,rows};fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n');
console.log(i,rows.map(r=>r.events[i]));
