'use strict';
/* MP-P0 sonda: 500 sistem / 17 AI + 2 insan (host + 1 misafir, ui:stars). Her giden iletinin türü ve boyutu; her N ayda
   misafir "resync" ister (tam ayna + tam görünüm) → tam iletilerin boyutu relay sınırıyla (hostMsg 524288 karakter) karşılaştırılır.
   Ayrıca tam ayna ayrı bir vm'de motorun deserialize'ına verilir (misafirin kurulum yolu). */
const path=require('path'),fs=require('fs'),crypto=require('crypto'),{performance}=require('perf_hooks');
const [rootArg,sizeKey='s500',ai='16',seed='404',months='70',every='6',shape='sarmal']=process.argv.slice(2),root=path.resolve(rootArg);
const {runtime}=require(path.join(root,'tests/helpers/runtime'));
const CORE=fs.readFileSync(path.join(root,'research/mp0/mp-core.js'),'utf8'),MIR=fs.readFileSync(path.join(root,'research/mp6/mirror.js'),'utf8');
const LIMIT=524288;
const h=runtime({root});h.sb.performance=performance;let n=0;h.sb.__rand=k=>crypto.createHash('sha256').update('p0:'+(n++)).digest('hex').slice(0,k*2);
const cur={};let lastFull=null,lastSnap=null;const all={};
h.sb.__send=(c,t)=>{let ty='?';const m=/"type":"([a-zA-Z]+)"/.exec(t.slice(0,80));if(m)ty=m[1];const L=t.length+2+String(c).length;   // relay: 'T'+id+'\n'+gövde
  const r=cur[ty]||(cur[ty]={n:0,max:0,sum:0,over:0});r.n++;r.sum+=L;if(L>r.max)r.max=L;if(L>LIMIT)r.over++;
  const a=all[ty]||(all[ty]={n:0,max:0,over:0});a.n++;if(L>a.max)a.max=L;if(L>LIMIT)a.over++;
  if(ty==='mirror')lastFull=t;if(ty==='snapshot')lastSnap=t;};
h.run(MIR);h.run(CORE);
const t0=performance.now();
h.run(`var D={name:'Probe Host',race:'klan',mizac:'militarist',physio:'avian',look:'surungen',origin:'standart',sigil:'simetrik',ethics:{mil:2,aut:0,mat:0,ahl:0},civics:[],traits:[]};
  var DG={name:'Misafir Devleti',race:'lonca',mizac:'kriminal',physio:'hive',look:'humanoid',origin:'standart',sigil:'simetrik',ethics:{mil:0,aut:1,mat:0,ahl:-3},civics:['maden_lonca','enkaz_muh'],traits:['tuccar','elektrotrof'],monoRes:'min'};
  var MP=StarsMP.createHost({roomId:'p0probe',random:__rand,send:(c,t)=>__send(c,t),kick(){},mirrorMs:0,lobby:{design:true,hostDraft:()=>D,generate(s){const{host,...rest}=s;setupGame({...CFG,...D,...rest});G.autoSave=false;return{ok:true}}}});
  MP.installGuards();MP.setCapacity(2);var __cfg=MP.configure({size:${JSON.stringify(sizeKey)},aiCount:${+ai},seed:${+seed},shape:${JSON.stringify(shape)}});
  MP.onMessage('g0',JSON.stringify({v:1,type:'hello',name:'g0'}));var __dr=MP.onMessage('g0',JSON.stringify({v:1,type:'draft',rev:1,draft:DG}));MP.onMessage('g0',JSON.stringify({v:1,type:'ready',value:true}));
  var __st=MP.start();var __id=[...MP.state.players.values()].find(p=>p.playerId!=='host').empireId;MP.onMessage('g0',JSON.stringify({v:1,type:'ui',mode:'stars'}));
  function __step(){const b=Math.floor(G.day/30);for(let i=0;i<60;i++){const d0=Math.floor(G.day);G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();
    let mt=false;if(Math.floor(G.day/30)>b){monthTick();mt=true;}
    if(mt||Math.floor(G.day)!==d0){if(mt)MP.observeHumans();MP.publish();}
    if(mt)break;}}`);
console.log('setup',h.run('JSON.stringify({cfg:__cfg,st:__st,sys:G.sys.length,emps:G.emps.length,guest:__id})'),'ms',Math.round(performance.now()-t0));
const rep=(label)=>{const o={};for(const [k,v] of Object.entries(cur))o[k]=v.n+'×≤'+v.max+(v.over?' OVER×'+v.over:'');for(const k of Object.keys(cur))delete cur[k];return label+' '+JSON.stringify(o);};
console.log(rep('m0'));
for(let m=1;m<=+months;m++){const t=performance.now();h.run('__step()');const ms=Math.round(performance.now()-t);
  let extra='';
  if(m%+every===0||m===+months){lastFull=null;lastSnap=null;h.run(`MP.onMessage('g0',JSON.stringify({v:1,type:'resync'}))`);
    let des='n/a';if(lastFull){const full=JSON.parse(lastFull).full;const g=runtime({root});g.sb.__t=JSON.stringify(full);const td=performance.now();let r;try{r=g.run('deserialize(__t)');}catch(e){r='THROW '+e.message;}des=String(r)+' '+Math.round(performance.now()-td)+'ms';}
    const known=h.run(`G.sys.filter(s=>s.seen.includes(__id)).length`);
    extra=` | RESYNC mirror ${lastFull?lastFull.length:'NONE'} snapshot ${lastSnap?lastSnap.length:'NONE'} limit ${LIMIT} | deserialize ${des} | known ${known} | fleets ${h.run('G.fleets.length')} | save8 ${h.run('serialize().length')}`;}
  console.log(rep('m'+m+' '+ms+'ms')+extra);}
console.log('ALL',JSON.stringify(all));
