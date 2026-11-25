// node stres-kayit.cjs <kök> <girdi.save> <çıkış.save>
// FED-AI-SİYASET.0 Faz K2: siyasi yoğunluk stres kaydı. Savaş yoğun 500/16 kaydından: bütün AI'lar arası temas + istihbarat 2, AI'lar iki
// federasyona (farklı türler, tür uyumsuz üyelerle — üye sesi / çıkış yolları çalışsın), her federasyona federal filo, etkin savaşlar korunur.
// Yalnız ölçüm kaydı; oyuna ve testlere girmez.
const fs=require('fs'),path=require('path');const {runtime}=require(path.resolve(__dirname,'../../tests/helpers/runtime'));
const [root,inp,out]=process.argv.slice(2);const h=runtime({root:path.resolve(root)});h.sb.S=fs.readFileSync(inp,'utf8');
const info=h.run(`(()=>{if(!deserialize(S))throw Error('yüklenemedi');
 const ais=G.emps.filter(e=>e.ai&&!e.dead&&!e.wild&&!e.crisisSide&&!isPurifier(e));
 for(const a of ais)for(const b of ais)if(a!==b){a.contact[b.id]=true;(a.intel||={})[b.id]=Math.max(a.intel[b.id]||0,2);}
 for(const e of ais)if(findFed(e))leaveFederation(e);
 const free=ais.filter(e=>!ais.some(o=>o!==e&&e.war[o.id]));const pool=(free.length>=8?free:ais).slice(0,8);
 const groups=[pool.slice(0,4),pool.slice(4,8)],types=['bilimsel','askeri'],made=[];
 groups.forEach((M,i)=>{if(M.length<3)return;const type=types[i];
  const F={id:(G.fedUid=(G.fedUid||0)+1),name:fedName(null,type),type,charter:{...fedDefaultCharter(type),ballot:'equal'},politicsVersion:96,leader:M[0].id,founder:M[0].id,members:M.map(e=>e.id),laws:{savunma:true},
   treasury:0,fund:{ala:4000,ene:4000},nextVote:G.day+30,vote:null,founded:G.day-900,typeSince:G.day-900,dutySince:{defense:G.day,offense:G.day},defenseFrontCutoff:1,dutyConsent:{},invites:{},decisions:{},cohesion:80};
  G.feds=G.feds||[];G.feds.push(F);federationIdentity(F);
  for(const id of F.members){F.dutyConsent[id]={offense:false,since:G.day-900};for(const p of F.members)if(p!==id){G.emps[id].ally[p]=true;G.emps[id].war[p]=false;}}
  fedRefreshRepresentation(F,true);for(let k=0;k<2;k++){const f=newFleet(M[0],M[0].home,[{c:"kru"},{c:"kru"},{c:"muh"}],"federal");f.federal=true;f.fedId=F.id;}
  for(const e of M)recalcMods(e);made.push({id:F.id,type,members:F.members,mismatch:M.filter(e=>typeof aiFedMismatch==="function"&&aiFedMismatch(e,F)).length});});
 for(const k of Object.keys(G.jointOps?.cooldowns||{}))delete G.jointOps.cooldowns[k];if(G.jointOps)G.jointOps.nextAuto=G.day;
 return JSON.stringify({feds:made,wars:(G.warLedger?.fronts||[]).filter(f=>f.ended===null).length,contacts:ais.length*(ais.length-1)});})()`);
fs.writeFileSync(out,h.run('serialize()'));console.log(info);
