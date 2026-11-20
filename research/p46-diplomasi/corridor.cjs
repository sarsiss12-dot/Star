'use strict';
// Isolate sponsor territory between the joiner's fleet and the one known enemy colony.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {world}=require('../../tests/helpers/beta-fed-ai0-world.cjs'),h=world();
const r=JSON.parse(h.run(`JSON.stringify((()=>{const joiner=C,sponsor=A,enemy=B,a=C.home,b=A.home,c=B.home;
 G.cfg.gates=false;G.feds=[];for(const s of G.sys){s.lanes=[];s.seen=[joiner.id];if(s.id!==c&&s.owner===enemy.id)s.owner=-1;}
 G.sys[a].lanes=[b];G.sys[b].lanes=[a,c];G.sys[c].lanes=[b];G.sys[b].owner=sponsor.id;G.sys[c].owner=enemy.id;
 for(const f of G.fleets.filter(f=>f.e===joiner.id)){f.sys=a;f.mv=null;f.path=[];}
 sponsor.ally[joiner.id]=joiner.ally[sponsor.id]=false;delete sponsor.passage[joiner.id];delete joiner.passage[sponsor.id];
 const before=warSupportReach(joiner,enemy,sponsor,[]),quoted=warSupportReach(joiner,enemy,sponsor,[{t:'passage'}]),bal=joiner.res.min,other=sponsor.res.min;
 const applied=executeDeal({from:joiner.id,to:sponsor.id,give:[{t:'res',r:'min',v:100}],want:[{t:'passage'}]});
 return {a,b,c,before,quoted,applied,granted:!!sponsor.passage[joiner.id],reverse:!!joiner.passage[sponsor.id],after:warSupportReach(joiner,enemy,sponsor,[]),paid:bal-joiner.res.min,received:sponsor.res.min-other};
})())`));fs.writeFileSync(path.join(__dirname,'raw','corridor.json'),JSON.stringify(r));console.log(r);
assert(!r.before&&r.quoted&&r.granted&&!r.reverse&&r.after&&r.paid===100&&r.received===100);
