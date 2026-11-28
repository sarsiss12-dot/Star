'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {fork}=require('node:child_process');
const {createHash}=require('node:crypto');
const {gunzipSync}=require('node:zlib');
const {runtime}=require('../../tests/helpers/runtime');

const sha=text=>createHash('sha256').update(text).digest('hex');
const millis=()=>Number(process.hrtime.bigint())/1e6;
const cpu=()=>{const t=process.cpuUsage();return (t.user+t.system)/1000;};

if(process.argv[2]==='worker'){
  const h=runtime({root:path.resolve(process.argv[3]),processGlobal:true});
  const raw=new Map();
  h.sb.realNow=millis;
  h.run(`
  var sampleCost={};
  function profileObject(obj,names){
    for(const key of names){
      const original=obj[key];
      if(typeof original!=='function')continue;
      obj[key]=function(...args){
        const start=realNow();
        try{return original.apply(this,args);}finally{
          const row=sampleCost[key]||={calls:0,wall:0};
          row.calls++;row.wall+=realNow()-start;
        }
      }
    }
  }
  function oneMonth(){
    G.autoSave=false;G.speed=0;
    const m=Math.floor(G.day/30);
    do{G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();}while(Math.floor(G.day/30)===m);
    monthTick();
  }`);
  process.on('message',({file,profile})=>{
    try{
      if(!raw.has(file)){
        const bytes=fs.readFileSync(file);
        raw.set(file,(file.endsWith('.gz')?gunzipSync(bytes):bytes).toString('utf8'));
      }
      h.sb.rawInput=raw.get(file);
      assert(h.run('deserialize(rawInput)'));
      h.run('sampleCost={}');
      const start=millis(), startCpu=cpu();
      h.run('oneMonth()');
      const cpuMs=cpu()-startCpu, wall=millis()-start;
      const record={cpuMs,wall,save:sha(h.run('serialize()')),rng:h.run('RND_STATE')};
      if(profile)record.cost=JSON.parse(h.run('JSON.stringify(sampleCost)'));
      process.send(record);
    }catch(error){process.send({error:error.stack});}
  });
  if(process.env.STARS_SENSOR_PROFILE==='1')
    h.run("profileObject(globalThis,['explorationContext','autoExploreTick','nativeSensorVision','sharedSensorCoverage','visionTick']);profileObject(Commerce,['aiTick','identifiedPort']);");
}else{
  const [control,candidate,out,...files]=process.argv.slice(2);
  const repeats=Number(process.env.SAMPLES||12);
  assert(repeats>=4&&repeats%2===0);
  function make(root,profile=false){
    return fork(__filename,['worker',root],{env:{...process.env,STARS_SENSOR_PROFILE:profile?'1':'0'},stdio:['ignore','ignore','inherit','ipc']});
  }
  function run(worker,file,profile=false){
    return new Promise((resolve,reject)=>{
      worker.once('message',r=>r.error?reject(Error(r.error)):resolve(r));
      worker.once('error',reject);
      worker.send({file,profile});
    });
  }
  const quantile=(a,q)=>{
    const sorted=[...a].sort((x,y)=>x-y),i=(a.length-1)*q;
    return sorted[Math.floor(i)]*(1-(i%1))+sorted[Math.ceil(i)]*(i%1);
  };
  const metrics=rows=>Object.fromEntries(['cpuMs','wall'].map(key=>{
    const a=rows.map(r=>r[key]);
    return [key,{median:quantile(a,.5),p95:quantile(a,.95)}];
  }));
  async function check(){
    const workers=[make(control),make(candidate),make(control),make(control,true),make(candidate,true)];
    const data={};
    try{
      for(const file of files){
        for(const w of workers)await run(w,file);
        const rules={ab:[0,1],aa:[0,2]};
        const row={input:sha(fs.readFileSync(file)),profiles:[]};
        for(const [name,ids] of Object.entries(rules)){
          const arms=[[],[]];
          for(let rep=0;rep<repeats/2;rep++)for(const j of rep%2?[1,0,0,1]:[0,1,1,0])
            arms[j].push(await run(workers[ids[j]],file));
          for(const arm of arms)assert(arm.every(s=>s.save===arm[0].save&&s.rng===arm[0].rng),name+' determinism');
          const [a,b]=arms.map(metrics);
          row[name]={arms,a,b,p95CPUChange:100*(b.cpuMs.p95/a.cpuMs.p95-1),sameSave:arms[0][0].save===arms[1][0].save};
        }
        assert(row.aa.sameSave);
        for(let i=0;i<2;i++){
          const profile=await run(workers[i+3],file,true);
          assert.equal(profile.save,row.ab.arms[i][0].save,'Profil davranışı değiştirdi');
          row.profiles.push(profile);
        }
        data[path.basename(file)]=row;
        fs.writeFileSync(out,JSON.stringify(data,null,2)+'\n');
        console.log(path.basename(file),row.ab.p95CPUChange.toFixed(2),row.aa.p95CPUChange.toFixed(2));
      }
    }finally{for(const w of workers)w.kill();}
  }
  check().catch(error=>{console.error(error.stack);process.exitCode=1;});
}
