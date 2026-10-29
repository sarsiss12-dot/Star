// One month from a save: upkeep split home/away and fleet positions right before each disband of actor A.
const fs=require('fs'),{runtime}=require('/home/user/Star/tests/helpers/runtime.js');
const [root,save,A]=process.argv.slice(2);const h=runtime({root});h.sb.raw=fs.readFileSync(save,'utf8');h.run('deserialize(raw)');h.sb.A=+A;
h.run(`var out=[];function upS(e){let home=0,away=0;const mul0=1+(e.mods.upMul||0);let mob=1;if(hasCivic(e,'mobilize')&&!Object.keys(e.war||{}).some(k=>e.war[k]))mob=2;
 for(const f of G.fleets){if(f.e!==e.id||!f.ships.length)continue;const sup=fleetSupply(e,f),inH=fleetInHome(e,f),m=(inH?.5:1)*mob*(1+(1-sup)*2.2);let b=0;for(const s of f.ships)b+=SHIPS[s.c].up;if(inH)home+=b*m*mul0;else away+=b*m*mul0;}return {home,away};}
 function fl(e){return G.fleets.filter(f=>f.e===e.id&&f.ships.length).map(f=>({id:f.id,n:f.ships.length,sys:f.sys,own:G.sys[f.sys]?.owner,home:fleetInHome(e,f),sup:+fleetSupply(e,f).toFixed(2),to:f.mv?.to??f.path.at(-1),armed:isArmed(f)}));}
 const d0=aiDisbandTick;aiDisbandTick=function(){const e=G.emps[A],b={day:G.day,ene:e.res.ene,inc:e.inc.ene,up:upS(e),fu:e.fleetUp,camp:e.aiCampaign&&{phase:e.aiCampaign.phase,target:e.aiCampaign.target,rally:e.aiCampaign.rally},fleets:fl(e)};const r=d0.apply(this,arguments);b.after=G.fleets.filter(f=>f.e===A).reduce((a,f)=>a+f.ships.length,0);out.push(b);return r;};
 const at=aiTurn;var moves=[];const mv0=aiMove;aiMove=function(e,f,to){if(e.id===A)moves.push({day:G.day,f:f.id,from:f.sys,to});return mv0.apply(this,arguments);};`);
h.run('for(let i=0;i<60;i++){const b=Math.floor(G.day/30);G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();if(Math.floor(G.day/30)>b)monthTick()}');
console.log(JSON.stringify(JSON.parse(h.run('JSON.stringify({out,moves:moves.slice(-30)})')),null,0));
