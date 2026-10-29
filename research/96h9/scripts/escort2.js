const fs=require('fs'),{runtime}=require('/home/user/Star/tests/helpers/runtime.js');
const [root,save,days]=process.argv.slice(2);const h=runtime({root});h.sb.raw=fs.readFileSync(save,'utf8');h.run('deserialize(raw)');
const out=[];for(let i=0;i<+days*2;i++){h.run('{const b=Math.floor(G.day/30);G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();if(Math.floor(G.day/30)>b)monthTick()}');
 if(i%20===0)out.push(JSON.parse(h.run('JSON.stringify({day:G.day,army:(f=>f?[f.sys,f.mv?f.mv.to:null,f.path.at(-1)??null]:null)(G.fleets.find(f=>f.id===237)),escortAt5:G.fleets.filter(f=>f.e===3&&isArmed(f)&&f.sys===5&&!f.mv).map(f=>f.id),phase:G.emps[3].aiCampaign?.phase})')));}
console.log(JSON.stringify(out));
