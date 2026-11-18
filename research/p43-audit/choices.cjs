'use strict';
// Discard each measurement world. No shadow calls in the natural campaign.
const fs=require('node:fs'),path=require('node:path'),{runtime}=require('../../tests/helpers/runtime');
const dir=process.env.CHECKPOINT_DIR||'/tmp/stars-p43',out={investment:[],doctrine:[]};
for(const seed of [11,99,404]){const save=fs.readFileSync(path.join(dir,'100-9-'+seed+'-m120.save'),'utf8'),h=runtime();h.sb.txt=save;h.run('if(!deserialize(txt))throw Error("load")');
 out.investment.push(...JSON.parse(h.run(`JSON.stringify(G.emps.filter(e=>e.ai&&!e.dead&&!e.wild&&!e.crisisSide).flatMap(e=>e.colonies.flatMap(c=>{
 const s=G.sys[c.s],p=s.planets[c.p];return ['maden','santral','dokum'].filter(b=>(p.col.b[b]||0)<BUILDINGS[b].max).map(b=>({seed:${seed},id:e.id,s:c.s,p:c.p,b,cost:buildingCost(e,b),delta:aiBuildingDelta(e,s,p,b)}));})))`)));
 if(seed!==11)continue;
 for(const doc of ['teknokrasi','militarist','tuccar','pasifist','kriminal']){h.sb.doc=doc;h.run('if(!deserialize(txt))throw Error("load")');out.doctrine.push(JSON.parse(h.run(`JSON.stringify((()=>{const e=G.emps[1];e.persLock=e.mizac=doc;e._prof=null;e._pers=null;e._persAt=-1;return {doc,chosen:aiFedType(e),scores:Object.fromEntries(Object.keys(FED_TYPES).map(t=>[t,aiFedAffinity(e,t)])),war:aiProfile(e).war};})())`)));}}
fs.writeFileSync(path.join(__dirname,'raw','choices.json'),JSON.stringify(out));
