'use strict';
const fs=require('node:fs'),path=require('node:path'),{runtime}=require('../../tests/helpers/runtime');
const h=runtime({processGlobal:true}),work=process.env.STARS_WORK||'/tmp/stars-pressure';
const out={casus:[],growth:[]};
h.sb.input=fs.readFileSync(path.join(work,'medium-99','6.save'),'utf8');
for(const room of ['open','none'])for(const full of [false,true]){
  Object.assign(h.sb,{room,full});h.run('deserialize(input)');
  out.casus.push(h.run(`(()=>{const e=G.emps[3],o=G.emps[10];(e.mem||={})[10]=[];e.rel[10]=-5;
    if(room==='none')for(const q of colonizeTargets(e))G.sys[q.s].planets[q.p].t='ast';
    for(const c of e.colonies){const p=G.sys[c.s].planets[c.p];p.col.pop=full?p.col.cap:Math.max(2,Math.floor(p.col.cap/2));}
    e.inc=empireIncome(e);return {room,full,sites:colonizeTargets(e).length,cb:casusBelliOf(e,o),border:aiKnownSystems(e,o.id).some(s=>s.lanes.some(l=>G.sys[l].owner===e.id)),
      own:sysCount(e),known:aiKnownSystems(e,o.id).length,tolerance:personaOf(e).roomTol,rng:RND_STATE};
  })()`));
}
h.sb.input=fs.readFileSync(path.join(work,'natural-11','36.save'),'utf8');
for(const [race,physio] of [['klan','humanoid'],['makine','machine'],['klan','lithoid']])for(const scenario of ['zero-food','ample-food','own-fuel-empty']){
  Object.assign(h.sb,{race,physio,scenario});h.run('deserialize(input)');
  out.growth.push(h.run(`(()=>{const e=G.emps[4];e.race=race;e.physio=physio;
    const cols=e.colonies.map(c=>G.sys[c.s].planets[c.p]),p=cols[0];p.col.pop=8;p.col.grow=0;
    const r=physio==='lithoid'?'min':race==='makine'?'ene':'yiy';
    for(const k of ['ene','min','ala','tuk','yiy'])e.res[k]=5000;
    if(scenario==='zero-food')e.res.yiy=0;
    if(scenario==='own-fuel-empty'){
      e.res[r]=0;for(const p of cols)delete p.col.b[{min:'maden',ene:'santral',yiy:'ciftlik'}[r]];
    }
    economyTick(false);return {race,physio,scenario,r,net:e.inc[r],stock:e.res[r],crisis:e.crisis,grow:p.col.grow,pop:p.col.pop};
  })()`));
}
fs.writeFileSync(path.join(__dirname,'raw','edges.json'),JSON.stringify(out,null,2)+'\n');
