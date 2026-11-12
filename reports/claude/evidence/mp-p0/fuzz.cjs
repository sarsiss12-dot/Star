'use strict';
/* MP-P0 fuzz: s500/16 AI + 2 insan; her yayın try/catch (yığın izi), her ay snapshot→validatePackage (+ ayrı vm'de loadWorld),
   misafir modeli: ayna + delta uygula, her ay deserialize. HUMAN_AI=1 → insan devletlerini AI sürer (zengin durum). */
const path=require('path'),fs=require('fs'),crypto=require('crypto'),{performance}=require('perf_hooks');
const [rootArg,sizeKey='s500',ai='16',seed='404',months='70',shape='sarmal']=process.argv.slice(2),root=path.resolve(rootArg);
const {runtime}=require(path.join(root,'tests/helpers/runtime'));
const CORE=fs.readFileSync(path.join(root,'research/mp0/mp-core.js'),'utf8'),MIR=fs.readFileSync(path.join(root,'research/mp6/mirror.js'),'utf8');
const h=runtime({root});h.sb.performance=performance;let n=0;h.sb.__rand=k=>crypto.createHash('sha256').update('p0:'+(n++)).digest('hex').slice(0,k*2);
const guest={mirror:null,rev:0,resync:0,bad:0};const gv=runtime({root});gv.run(MIR);
h.sb.__send=(c,t)=>{if(c!=='g0')return;if(t.length+8>524288)console.log('OVER',t.slice(0,60),t.length);const m=JSON.parse(t);
  if(m.type==='mirror'){guest.mirror=m.full;guest.rev=m.rev;}
  else if(m.type==='mirrorDelta'){if(!guest.mirror||m.base!==guest.rev){guest.resync++;guest.need=true;return;}gv.sb.__m=guest.mirror;gv.sb.__o=m.ops;gv.run('StarsMirror.apply(__m,__o)');guest.rev=m.rev;}
  else if(m.type==='error')console.log('ERRMSG',t.slice(0,200));};
h.run(MIR);h.run(CORE);
h.run(`var D={name:'Probe Host',race:'klan',mizac:'militarist',physio:'avian',look:'surungen',origin:'standart',sigil:'simetrik',ethics:{mil:2,aut:0,mat:0,ahl:0},civics:[],traits:[]};
  var DG={name:'Misafir Devleti',race:'lonca',mizac:'kriminal',physio:'hive',look:'humanoid',origin:'standart',sigil:'simetrik',ethics:{mil:0,aut:1,mat:0,ahl:-3},civics:['maden_lonca','enkaz_muh'],traits:['tuccar','elektrotrof'],monoRes:'min'};
  var MP=StarsMP.createHost({roomId:'p0fuzz',random:__rand,send:(c,t)=>__send(c,t),kick(){},mirrorMs:0,lobby:{design:true,hostDraft:()=>D,generate(s){const{host,...rest}=s;setupGame({...CFG,...D,...rest});G.autoSave=false;return{ok:true}}}});
  MP.installGuards();MP.setCapacity(2);var __cfg=MP.configure({size:${JSON.stringify(sizeKey)},aiCount:${+ai},seed:${+seed},shape:${JSON.stringify(shape)}});
  MP.onMessage('g0',JSON.stringify({v:1,type:'hello',name:'g0'}));MP.onMessage('g0',JSON.stringify({v:1,type:'draft',rev:1,draft:DG}));MP.onMessage('g0',JSON.stringify({v:1,type:'ready',value:true}));
  var __st=MP.start();var __P=[...MP.state.players.values()];var __id=__P.find(p=>p.playerId!=='host').empireId,__hid=__P.find(p=>p.playerId==='host').empireId;MP.onMessage('g0',JSON.stringify({v:1,type:'ui',mode:'stars'}));
  var __errs=[];function __pub(tag){try{MP.publish();}catch(e){__errs.push({day:G.day,tag,stack:String(e&&e.stack||e).split('\\n').slice(0,7).join(' | ')});}}
  function __step(){const b=Math.floor(G.day/30);for(let i=0;i<60;i++){const d0=Math.floor(G.day);G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();
    let mt=false;if(Math.floor(G.day/30)>b){monthTick();mt=true;}
    if(mt||Math.floor(G.day)!==d0){if(mt)MP.observeHumans();__pub(mt?'month':'day');}
    if(mt)break;}}`);
if(process.env.HUMAN_AI==='1')h.run('G.emps[__id].ai=true;G.emps[__hid].ai=true;');
console.log('setup',h.run('JSON.stringify({cfg:__cfg,st:__st,sys:G.sys.length,emps:G.emps.length,guest:__id,host:__hid})'));
let errSeen=0;const whyCount={};
for(let m=1;m<=+months;m++){const t=performance.now();h.run('__step()');
  if(guest.need){guest.need=false;h.run(`MP.onMessage('g0',JSON.stringify({v:1,type:'resync'}))`);}
  const errs=JSON.parse(h.run('JSON.stringify(__errs)'));for(const e of errs.slice(errSeen,errSeen+3))console.log('PUBLISH-THROW',JSON.stringify(e));if(errs.length>errSeen)console.log(' ...throws total',errs.length);errSeen=errs.length;
  let des='';if(m%3===0&&guest.mirror){const g=runtime({root});g.sb.__t=JSON.stringify(guest.mirror);let r;try{r=g.run('deserialize(__t)');}catch(e){r='THROW '+e.message;}if(r!==true){guest.bad++;des=' GUEST-DESERIALIZE '+r+' '+(()=>{try{return g.run('JSON.stringify(DIAG.slice(-2))');}catch{return'';}})();}}
  const snap=h.run(`(()=>{const r=MP.snapshot({});if(!r.ok)return 'SNAP:'+r.why;const t=JSON.stringify(r.pkg);const v=StarsMP.validatePackage(t);globalThis.__lastPkg=t;return v.ok?'ok '+t.length:'INVALID:'+v.why;})()`);
  if(!/^ok/.test(snap)){whyCount[snap]=(whyCount[snap]||0)+1;}
  let load='';if((m%12===0||m===+months)&&/^ok/.test(snap)){const g=runtime({root});g.run(MIR);g.run(CORE);g.sb.__t=h.run('__lastPkg');let r;try{r=g.run(`(()=>{const v=StarsMP.validatePackage(__t);if(!v.ok)return 'V:'+v.why;const r=StarsMP.loadWorld(v.pkg);return r.ok?'ok day '+G.day:'L:'+r.why;})()`);}catch(e){r='THROW '+e.message;}load=' load='+r;}
  console.log('m'+m,Math.round(performance.now()-t)+'ms','day',h.run('G.day'),'pkg',snap,'rev',guest.rev,'resync',guest.resync,des,load, m%6===0?h.run(`JSON.stringify({feds:(G.feds||[]).length,wars:G.emps.filter(e=>!e.dead&&e.war&&e.war.length).length,fleets:G.fleets.length,dead:G.emps.filter(e=>e.dead).length,offers:MP.state?0:0})`):'');}
console.log('DONE throws',errSeen,'guestBad',guest.bad,'pkgBad',JSON.stringify(whyCount));
