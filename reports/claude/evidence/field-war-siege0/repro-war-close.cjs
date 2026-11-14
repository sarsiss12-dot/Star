const {runtime}=require(require('path').resolve(__dirname,'../../../../tests/helpers/runtime'));
for(const lock of [false,true]){const h=runtime({root:process.argv[2]});
h.run(`setupGame({...CFG,seed:22,size:'orta',aiCount:5,pirates:false});G.autoSave=false;var A=G.p,S=G.emps[1];S.name='Synarth Sığınağı';A.contact[S.id]=S.contact[A.id]=true;for(const s of G.sys)if(!s.seen.includes(0))s.seen.push(0);S.civics=${lock?"['kan_hukuku']":'[]'};
globalThis.__log=[];const _say=say;say=function(m,c){__log.push(Math.floor(G.day)+' '+m);return _say.apply(this,arguments);};
function month(n=1){for(let i=0;i<n*60;i++){const m=Math.floor(G.day/30);G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();if(Math.floor(G.day/30)>m)monthTick();}}
declareWar(A,S);month(1);__log.length=0;S.exh[0]=99.5;month(2);`);
console.log(lock?'KİLİT':'NORMAL',h.run(`JSON.stringify({war:!!A.war[S.id],fr:G.warLedger.fronts.map(f=>[f.id,Math.floor(f.opened),f.ended&&Math.floor(f.ended),f.endReason]),exh:[S.exh[0],A.exh&&A.exh[1]],log:__log.filter(l=>!/^\\d+ (Araştırma|Keşif)/.test(l)).slice(0,8)})`));}
