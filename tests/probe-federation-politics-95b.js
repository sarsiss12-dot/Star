"use strict";
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{fresh}=require('./helpers/dispatch-fixture');
const src=fs.readFileSync(path.join(__dirname,'faz95b_federation_reform_test.js'),'utf8');
const world=new Function('fresh',src.slice(src.indexOf('function world('),src.indexOf('for(const type of'))+'return world')(fresh);const output={};
{const h=world('bilimsel',[1,2,4]);h.run('F.leader=1;F.charter.admission="contact";aiFederationPolitics()');output.invite=h.run('!!F.invites[0]||F.lastVote?.motion==="admit"||F.vote?.motion==="admit"');assert.ok(output.invite);assert.equal(h.run('F.members.includes(0)'),false);}
{const h=world('askeri',[1,2,4]);h.run('F.leader=1;F.founded=G.day-900;for(const id of F.members){G.emps[id].mizac="teknokrasi";delete G.emps[id]._prof;}aiFederationPolitics()');output.reform=h.run('F.lastVote?.motion==="reform"||F.vote?.motion==="reform"');assert.ok(output.reform);}
{const h=world('bilimsel',[1,2,4]);h.run('F.leader=1;F.founded=G.day-900;F.cohesion=10;G.emps[1].res.etk=0;G.emps[2].rel[1]=-80;aiFederationPolitics()');output.leave=h.run('!findFed(G.emps[2])&&G.emps[2]._fedLeaveUntil>G.day');assert.ok(output.leave);}
fs.writeFileSync(path.join(__dirname,'audit-95b/political-ai-probes.json'),JSON.stringify(output,null,2));console.log(JSON.stringify(output));
