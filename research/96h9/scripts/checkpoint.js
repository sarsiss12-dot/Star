const fs=require('fs'),{runtime}=require('/home/user/Star/tests/helpers/runtime.js');
const [root,save,months,out,reloadAt]=process.argv.slice(2);const h=runtime({root});h.sb.raw=fs.readFileSync(save,'utf8');h.run('deserialize(raw)');
const start=Math.round(h.run('G.day')/30);
for(let m=0;m<+months;m++){h.run('for(let i=0;i<60;i++){const b=Math.floor(G.day/30);G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();if(Math.floor(G.day/30)>b)monthTick()}');if(reloadAt&&start+m+1===+reloadAt)h.run('deserialize(serialize())');}
fs.writeFileSync(out,h.run('serialize()'));console.log(out,h.run('G.day'));
