'use strict';
const fs=require('node:fs'),path=require('node:path'),{runtime}=require('../../tests/helpers/runtime');
const h=runtime({processGlobal:true});h.sb.input=fs.readFileSync(path.join(process.env.STARS_WORK||'/tmp/stars-pressure','natural-11/36.save'),'utf8');
const out=[];
for(const [race,physio,r,producer] of [['klan','humanoid','yiy','ciftlik'],['makine','machine','ene','santral'],['klan','lithoid','min','maden']]){
  for(const shock of [false,true]){
    Object.assign(h.sb,{race,physio,r,producer,shock});h.run('deserialize(input)');
    out.push(h.run(`(()=>{const e=G.emps[4];e.race=race;e.physio=physio;recalcMods(e);
      const cols=e.colonies.map(c=>G.sys[c.s].planets[c.p]);if(shock)for(const p of cols)delete p.col.b[producer];
      e.inc=empireIncome(e);const marginal=()=>({net:e.inc[r],food:e.inc.yiy,cg:e.cgNeed,line:e._incomeDetail.rows.filter(q=>q.name==='Nüfus beslenmesi / tür fizyolojisi'&&q.r===r).reduce((n,q)=>n+q.n,0)});
      const before=marginal();cols[0].col.pop++;e.inc=empireIncome(e);const after=marginal();cols[0].col.pop--;e.inc=empireIncome(e);
      if(shock&&e.inc[r]<0)e.res[r]=-3*e.inc[r];
      const plan=aiEconomyPlan(e),market=Commerce.aiBalance(e);return {race,physio,r,shock,before,after,plan:plan.rows[r],trade:market[r],policy:plan.policy,foodEater:identityEatsFood(e)};
    })()`));
  }
}
fs.writeFileSync(path.join(__dirname,'raw','F-species.json'),JSON.stringify(out,null,2)+'\n');
