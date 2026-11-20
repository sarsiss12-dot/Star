'use strict';
const {world}=require('../../tests/helpers/beta-fed-ai0-world.cjs'),fs=require('node:fs'),path=require('node:path');
const results=[];
for(const type of ['askeri','bilimsel','ticaret','yagmaci']){
 const h=world();h.sb.ft=type;
 results.push(JSON.parse(h.run(`JSON.stringify((()=>{
 const f={id:1,members:[1,3],type:ft,founder:A.id,leader:A.id,name:'Test',fund:{ene:0,ala:0},charter:{...fedDefaultCharter(ft),ballot:'equal'},laws:{},founded:G.day,nextVote:G.day+999,politicsVersion:96,cohesion:70,dutySince:{defense:G.day,offense:G.day},defenseFrontCutoff:1,dutyConsent:{}};
 G.feds=[f];G.fedUid=1;federationIdentity(f);
 for(const e of [A,C]){recalcMods(e);e.inc.ala=100;e.inc.ene=100;}
 fedFundTick();
 const fund={...f.fund},vote=aiFedVoteAssessment(C,f,{kind:'motion',motion:'newWar',target:B.id,proposer:A.id});
 const law=aiFedVoteAssessment(C,f,{kind:'basic',law:'savunma',proposer:A.id});
 warAuthorize(B,A,{n:'test'});const declared=declareWar(B,A);warAuthClear();
 return {type:ft,fund,law:law.score,warVote:vote.score,defense:f.charter.defense,declared,defenderJoined:!!C.war[B.id],fronts:G.warLedger.fronts.map(x=>({sides:x.sides,parent:x.parent,kind:x.kind}))};})())`)));
}
fs.writeFileSync(path.join(__dirname,'raw','types.json'),JSON.stringify(results,null,1));
