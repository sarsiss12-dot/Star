'use strict';
const fs=require('node:fs'),path=require('node:path'),z=require('node:zlib'),crypto=require('node:crypto');
const {runtime}=require('../../tests/helpers/runtime');
const [group,arm,kind='run']=process.argv.slice(2),work=process.env.STARS_WORK||'/tmp/stars-pressure';
const [world,m,id,n]=({A:['natural-11',36,5,12],B:['natural-11',36,4,18],D:['medium-99',48,10,24],E:['SP',96,2,12],F:['natural-11',36,4,12]})[group];
const save=fs.readFileSync(world==='SP'?path.join(work,'sp-100-9-404-m96.save'):path.join(work,world,m+'.save'),'utf8');
const h=runtime({processGlobal:true});
Object.assign(h.sb,{input:save,actorId:id,arm,group});
if(world!=='SP'){
  // Restore the original three seat assignments via the package-independent MP actor map.
  h.run(fs.readFileSync(path.resolve(__dirname,'../mp0/mp-core.js'),'utf8'));
}
if(!h.run('deserialize(input)'))throw Error('Save8');
if(world!=='SP')h.run(`const researchHost=StarsMP.createHost({roomId:'research',send(){},random:()=> 'x'});
 researchHost.installGuards();`);
h.run(fs.readFileSync(path.join(__dirname,'replay.js'),'utf8'));
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const output={group,arm,kind,source:sha(save),id,world,month:m};
if(kind==='probe')output.diagnosis=h.run('diagnose()');
else{
  output.months=[];
  for(let k=0;k<=n;k++){
    if(k)h.run(`{const m=Math.floor(G.day/30);for(let i=0;i<60&&!G.over;i++){
      G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();
      if(Math.floor(G.day/30)>m)monthTick();
      if(typeof researchHost!=='undefined'&&Number.isInteger(G.day))researchHost.observeHumans();
    }}`);
    output.months.push({...JSON.parse(h.run('JSON.stringify(current())')),hash:sha(h.run('serialize()'))});
    if(output.months.at(-1).over)break;
  }
  output.events=h.run('events');
}
fs.writeFileSync(path.join(__dirname,'raw',[group,arm,kind].join('-')+'.json.gz'),z.gzipSync(JSON.stringify(output)+'\n'));
