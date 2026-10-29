// Same protocol as arm9/arm10 (RELOAD_AT, one-shot PLACEBO) but writes the Save8 after N months.
const fs=require('fs'),{runtime}=require('/home/user/Star/tests/helpers/runtime.js');
const [root,save,months,out]=process.argv.slice(2);const h=runtime({root});h.sb.raw=fs.readFileSync(save,'utf8');if(!h.run('deserialize(raw)'))throw Error('load');
h.sb.PD=process.env.PLACEBO_DAY?+process.env.PLACEBO_DAY:null;h.sb.PK=+(process.env.PLACEBO_RNG||0);
h.run('if(PD!==null){const mt=monthTick;monthTick=function(){if(G.day>=PD&&!globalThis.pdone){globalThis.pdone=true;for(let i=0;i<PK;i++)rnd();}return mt.apply(this,arguments);};}');
for(let m=0;m<+months;m++){h.run('for(let i=0;i<60;i++){const b=Math.floor(G.day/30);G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();if(Math.floor(G.day/30)>b)monthTick()}');
 if(process.env.RELOAD_AT&&Math.round(h.run('G.day')/30)===+process.env.RELOAD_AT&&!h.run('deserialize(serialize())'))throw Error('reload');}
fs.writeFileSync(out,h.run('serialize()'));console.log(out,h.run('G.day'),h.run('RND_STATE'));
