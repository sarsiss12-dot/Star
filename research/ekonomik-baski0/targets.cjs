'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {runtime}=require('../../tests/helpers/runtime');
const h=runtime({processGlobal:true});h.sb.input=fs.readFileSync(process.argv[2],'utf8');
const out={source:crypto.createHash('sha256').update(h.sb.input).digest('hex'),arms:{}};
for(const arm of ['original','soil-removed','soil-added']){
  h.run('deserialize(input)');h.sb.variant=arm;
  out.arms[arm]=h.run(`(()=>{
    const e=G.emps[10],o=G.emps[11],view=aiView(e);
    for(const id of [123,336,92])if(!view.ctx.visible.has(id)||!G.sys[id].surv.includes(e.id))throw Error('Survey or sensors missing');
    const p=G.sys[123].planets[0];
    if(variant==='soil-removed')p.dep=null;
    if(variant==='soil-added')G.sys[92].planets[0].dep='bereket';
    function bypass(s){
      const neighbours=s.lanes.filter(id=>view.ctx.known.has(id)),pairs=[];
      for(const [i,start]of neighbours.entries()){
        const q=[start],depth=new Map([[start,0]]);
        for(let k=0;k<q.length;k++)for(const id of G.sys[q[k]].lanes){
          if(id===s.id||depth.has(id)||!view.ctx.known.has(id))continue;
          depth.set(id,depth.get(q[k])+1);q.push(id);
        }
        for(const end of neighbours.slice(i+1))pairs.push([start,end,depth.get(end)??null]);
      }
      return pairs;
    }
    const candidates=warFetihCandidates(e,o);
    return {actor:e.id,other:o.id,cb:casusBelliOf(e,o),appetite:warAppetite(e,o).score,
      access:aiWarAccess(e,o),budget:aiWarBudget(e,o),default:warFetihDefault(e,o),choice:aiWarGoalChoice(e,o,'fetih'),
      targets:[123,336,92].map(id=>{const s=G.sys[id],c=candidates.find(q=>q.id===id);return {
        name:s.name,id,rank:candidates.indexOf(c)+1,d:c.d,knownDefense:aiEstimatedDefense(e,s),lanes:s.lanes.length,bypass:bypass(s),
        planets:s.planets.map(p=>({type:p.t,hab:habOf(e,p),deposit:p.dep,farms:p.col?.b.ciftlik||0})),
        nominalFood:Math.max(0,...s.planets.filter(p=>PLANETS[p.t].k==='hab').map(p=>colonyOutput(e,s,{...p,owner:e.id,col:{pop:10,stab:65,b:{ciftlik:1},f:'tarim'}}).o.yiy))};}),rng:RND_STATE};
  })()`);
}
fs.writeFileSync(path.join(__dirname,'raw','C.json'),JSON.stringify(out,null,2)+'\n');
