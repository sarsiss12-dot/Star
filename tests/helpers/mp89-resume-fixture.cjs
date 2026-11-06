'use strict';
// Explicit Save8 coverage fixture, reusing the normalized MP.4 federation record shape.
// Applied at month 6: it seeds nonempty records; it does not change serializers or decide an AI peace offer.
module.exports=H=>H.evaluate(()=>{
 const hs=__mp8.humans(),a=hs[0],b=hs[1],enemy=G.emps.find(e=>e.ai&&!e.dead&&!e.wild&&!e.crisisSide&&!e.ally[a]);
 if(G.feds.length||!enemy)throw Error('MP89 fixture needs free federation members and a live AI');
 const F={id:(G.fedUid||0)+1,name:'MP89 Kayıt Birliği',type:'bilimsel',charter:fedDefaultCharter('bilimsel'),leader:a,founder:a,members:[a,b],laws:{},fund:{ala:0,ene:0},treasury:0,
  founded:G.day,typeSince:G.day,dutySince:{defense:0,offense:0},invites:{},decisions:{},dutyConsent:{},cohesion:70,nextVote:G.day+100000,politicsVersion:96};
 G.feds.push(F);G.fedUid=F.id;for(const x of F.members)for(const y of F.members)if(x!==y)G.emps[x].ally[y]=true;fedNormalize(F);
 for(const id of F.members){recalcMods(G.emps[id]);G.emps[id]._powAt=-1;}
 enemy.contact[a]=G.emps[a].contact[enemy.id]=true;
 warAuthorize(enemy,G.emps[a],{n:'MP89 kayıt fikstürü'});
 try{if(!declareWar(enemy,G.emps[a]))throw Error('fixture war rejected by engine');}finally{warAuthClear();}
 if(!G.emps[a].war[enemy.id]||!findFed(G.emps[b]))throw Error('fixture records absent');
 const subject=G.emps.find(e=>e.ai&&!e.dead&&!e.wild&&!e.crisisSide&&e.id!==enemy.id);
 if(!subject||!subjugate(G.emps[a],subject,'haracguzar'))throw Error('fixture vassal rejected by engine');
 UI.closeModal();MP1Host.host.local({kind:'speed',value:0});MP1Host.host.publish();
 return {explicitFixture:true,day:G.day,seed:G.cfg.seed,humanIds:hs,aiCount:G.emps.filter(e=>e.ai&&!e.wild&&!e.crisisSide).length,federation:{id:F.id,members:F.members.slice()},war:[enemy.id,a],vassal:{lord:a,subject:subject.id,type:subject.vassalType},rng:RND_STATE};
});
