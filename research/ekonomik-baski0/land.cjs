'use strict';
const fs=require('node:fs'),path=require('node:path'),z=require('node:zlib'),{runtime}=require('../../tests/helpers/runtime');
const h=runtime({processGlobal:true}),work=process.env.STARS_WORK||'/tmp/stars-pressure',data=[];
for(const world of ['natural-11','medium-99','natural-404']){
  const dir=path.join(work,world);
  for(const file of fs.readdirSync(dir).filter(f=>/^\d+\.save$/.test(f))){
    h.sb.input=fs.readFileSync(path.join(dir,file),'utf8');h.run('deserialize(input)');
    const pairs=h.run(`G.emps.filter(e=>e.ai&&!e.wild&&!e.dead&&!e.crisisSide).flatMap(e=>{
      const room=colonizeTargets(e).length,own=sysCount(e),cols=e.colonies.map(c=>G.sys[c.s].planets[c.p].col).filter(Boolean);
      return G.emps.filter(o=>o!==e&&e.contact[o.id]&&!o.dead&&!o.wild&&!o.crisisSide).map(o=>{
        const known=aiKnownSystems(e,o.id),border=known.some(s=>s.lanes.some(l=>G.sys[l].owner===e.id));
        return {e:e.id,o:o.id,cb:casusBelliOf(e,o)?.k||null,room,own,border,known:known.length,
          relation:e.rel[o.id],critical:e.crisis,foodNet:e.inc.yiy,cap:cols.reduce((n,c)=>n+c.cap,0),pop:cols.reduce((n,c)=>n+c.pop,0)};
      });})`);
    data.push({world,month:parseInt(file),pairs});
  }
}
fs.writeFileSync(path.join(__dirname,'raw','territory-pairs.json.gz'),z.gzipSync(JSON.stringify(data)+'\n'));
const captures=[];
for(const id of [123,336,92]){
  h.sb.input=fs.readFileSync(process.argv[2],'utf8');h.sb.targetId=id;
  h.run('deserialize(input)');
  captures.push(h.run(`(()=>{const e=G.emps[10],s=G.sys[targetId];if(!s.surv.includes(e.id)||!aiView(e).ctx.visible.has(s.id))throw Error('Unknown target');
    const report=()=>{const inc=empireIncome(e),net=aiFedBudget(e,inc).net,v=aiVassalBudget(e,inc);
      return Object.fromEntries(['ene','min','yiy','ala','tuk'].map(k=>[k,net[k]-(v[k]||0)]));};
    const before=report();captureSystem(s,e.id,'conquest');const after=report();return {id:targetId,before,after,
      delta:Object.fromEntries(Object.keys(after).map(k=>[k,after[k]-before[k]])),held:s.owner===e.id,
      cols:s.planets.filter(p=>p.col).map(p=>({pop:p.col.pop,stability:p.col.stab,martial:p.martial_law}))};
  })()`));
}
fs.writeFileSync(path.join(__dirname,'raw','C-capture.json'),JSON.stringify(captures,null,2)+'\n');
