// Run an arm from a save (optional placebo rnd() draws on a day) and write the Save8 at the end.
const fs=require('fs'),{runtime}=require('/home/user/Star/tests/helpers/runtime.js');
const [root,save,months,out]=process.argv.slice(2);const h=runtime({root});h.sb.raw=fs.readFileSync(save,'utf8');h.run('deserialize(raw)');
h.sb.PD=process.env.PLACEBO_DAY?+process.env.PLACEBO_DAY:null;h.sb.PK=+(process.env.PLACEBO_RNG||0);
h.run('if(PD!==null){const mt=monthTick;monthTick=function(){if(G.day>=PD&&!globalThis.pdone){globalThis.pdone=true;for(let i=0;i<PK;i++)rnd();}return mt.apply(this,arguments);};}');
for(let m=0;m<+months;m++)h.run('for(let i=0;i<60;i++){const b=Math.floor(G.day/30);G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();if(Math.floor(G.day/30)>b)monthTick()}');
const raw=h.run('serialize()');const h2=runtime({root});h2.sb.raw=raw;if(!h2.run('deserialize(raw)'))throw Error('reload');fs.writeFileSync(out,raw);console.log(out,h.run('G.day'));
