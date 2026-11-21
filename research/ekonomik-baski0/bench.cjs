'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {chromium}=require('playwright');
async function main(){
  const browser=await chromium.launch({executablePath:process.env.STARS_CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
  const relay=require('../mp1/server/relay.js').create({MP1_BIND:'127.0.0.1',MP1_PORT:'0'});
  const server=await relay.start();
  const report={browser:browser.version(),fixtures:[]};
  try{
    for(const file of process.argv.slice(2)){
      const page=await browser.newPage();await page.goto('http://127.0.0.1:'+server.address().port);
      const save=fs.readFileSync(file,'utf8');
      const data=await page.evaluate(save=>{
        if(!deserialize(save))throw Error('Save8');
        G.speed=0;G.autoSave=false;
        const actors=G.emps.filter(e=>e.ai&&!e.dead&&!e.wild&&!e.crisisSide);
        const plans=actors.map(e=>aiEconomyPlan(e));
        const check=(e,p)=>{
          const r=identityEatsFood(e)?'yiy':RACES[e.race].bio==='makine'||physioOf(e).yiyer==='enerji'?'ene':'min',row=p.rows[r];
          if(row.net>=0||row.months>=6)return -1;
          let best=null;
          for(const o of G.emps){
            if(!o.ai||o.dead||o.wild||o.crisisSide||o===e||!e.contact[o.id]||!e.ally[o.id]||e.war[o.id]||diploBlocked(e,o))continue;
            if(!best||e.rel[o.id]>e.rel[best.id]||e.rel[o.id]===e.rel[best.id]&&o.id<best.id)best=o;
          }
          return best?.id??-1;
        };
        let sum=0;
        function batch(kind,count){
          const t=performance.now();
          for(let rep=0;rep<count;rep++)for(let i=0;i<actors.length;i++){
            if(kind==='loop')sum+=plans[i].critical?1:0;
            else if(kind==='reuse')sum+=check(actors[i],plans[i]);
            else sum+=check(actors[i],aiEconomyPlan(actors[i]));
          }
          return (performance.now()-t)/count;
        }
        for(const k of ['loop','reuse','rebuild'])batch(k,k==='rebuild'?1:250);
        const start=serialize(),rng=RND_STATE,series=[];
        for(let i=0;i<12;i++)for(const k of i%2?['rebuild','reuse','loop']:['loop','reuse','rebuild']){
          series.push({round:i,kind:k,ms:batch(k,k==='rebuild'?2:4000)});
        }
        return {day:G.day,actors:actors.length,eligible:actors.map((e,i)=>[e.id,check(e,plans[i])]).filter(v=>v[1]>=0),series,
          sameSave:serialize()===start,sameRng:RND_STATE===rng,sum};
      },save);
      if(!data.sameSave||!data.sameRng)throw Error('Observer changed state');
      report.fixtures.push({name:path.basename(file),sha256:crypto.createHash('sha256').update(save).digest('hex'),...data});
      await page.close();
    }
  }finally{await browser.close();relay.shutdown();}
  fs.writeFileSync(path.join(__dirname,'raw','cpu.json'),JSON.stringify(report,null,2)+'\n');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
