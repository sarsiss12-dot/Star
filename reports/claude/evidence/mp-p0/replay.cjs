'use strict';
/* MP-P0 yeniden üretim: kullanıcının misafir aynası host dünyası olarak yüklenir; uzak insan = devlet GUEST. Misafir modeli gerçek
   akışı izler: tam ayna / fark (base denetimi, StarsMirror.apply) → ayrı vm'de motorun deserialize'ı. Başarısızlıkta DIAG okunur. */
const path=require('path'),fs=require('fs'),crypto=require('crypto');
const [rootArg,file,hostId='16',guestId='0']=process.argv.slice(2),root=path.resolve(rootArg);
const {runtime}=require(path.join(root,'tests/helpers/runtime'));
const CORE=fs.readFileSync(path.join(root,'research/mp0/mp-core.js'),'utf8'),MIR=fs.readFileSync(path.join(root,'research/mp6/mirror.js'),'utf8');
const h=runtime({root});let n=0;h.sb.__rand=k=>crypto.createHash('sha256').update('rp:'+(n++)).digest('hex').slice(0,k*2);h.sb.__save=fs.readFileSync(file,'utf8');
const g=runtime({root});g.run(MIR);
const guest={mirror:null,rev:0,ok:0,fail:0,resync:0,last:''};const out=[];let results=[];
h.sb.__send=(c,t)=>{out.push(t);};
h.run(MIR);h.run(CORE);
h.run(`var MP=StarsMP.createHost({roomId:'replay',hostEmpireId:${+hostId},random:__rand,send:(c,t)=>__send(c,t),kick(){},mirrorMs:0,lobby:{generate(s){if(deserialize(__save)!==true)throw Error('load');G.autoSave=false;
    for(const e of G.emps)if(e.id===${+hostId})e.ai=false;else if(e.id===${+guestId})e.ai=true;return {ok:true};}}});
  MP.installGuards();MP.setCapacity(2);var __cfg=MP.configure({size:'s500',aiCount:16,seed:22});
  MP.onMessage('g0',JSON.stringify({v:1,type:'hello',name:'g0'}));MP.onMessage('g0',JSON.stringify({v:1,type:'claim',empire:${+guestId}}));MP.onMessage('g0',JSON.stringify({v:1,type:'ready',value:true}));
  var __st=MP.start();MP.onMessage('g0',JSON.stringify({v:1,type:'ui',mode:'stars'}));
  function __days(d){for(let i=0;i<d*2;i++){const b=Math.floor(G.day/30),d0=Math.floor(G.day);G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();let mt=false;if(Math.floor(G.day/30)>b){monthTick();mt=true;}
    if(mt||Math.floor(G.day)!==d0){if(mt)MP.observeHumans();MP.publish();}}}`);
console.log('setup',h.run('JSON.stringify({cfg:__cfg,st:__st,day:G.day,humans:G.emps.filter(e=>!e.ai).map(e=>e.id)})'));
function pump(label){let msgs=out.splice(0);for(const t of msgs){let m;try{m=JSON.parse(t);}catch{continue;}
  if(m.type==='result')results.push(m);if(process.env.DBG&&!['mirror','mirrorDelta','delta','snapshot'].includes(m.type))console.log('   MSG',t.slice(0,260));
  if(m.type==='mirror'){guest.mirror=m.full;guest.rev=m.rev;build(label,'full');}
  else if(m.type==='mirrorDelta'){if(!guest.mirror||m.base!==guest.rev){guest.resync++;h.run(`MP.onMessage('g0',JSON.stringify({v:1,type:'resync'}))`);out.push(...[]);continue;}
    g.sb.__m=guest.mirror;g.sb.__ops=m.ops;try{g.run('StarsMirror.apply(__m,__ops)');}catch(e){console.log(label,'APPLY THROW',e.message);}guest.rev=m.rev;build(label,'delta');}}
  if(out.length)pump(label);}
function build(label,kind){g.sb.__t=JSON.stringify(guest.mirror);let r;try{r=g.run('deserialize(__t)');}catch(e){r='THROW '+e.message;}
  if(r===true){guest.ok++;return;}guest.fail++;const diag=g.run('JSON.stringify(DIAG.slice(-2))');const key=String(r)+' '+diag;
  if(key!==guest.last){guest.last=key;console.log(label,'GUEST BUILD FAIL ('+kind+', rev '+guest.rev+', '+g.sb.__t.length+' chars):',String(r),diag.slice(0,500));
    fs.writeFileSync('/home/user/p0/fail-mirror-'+guest.fail+'.json',g.sb.__t);}
  guest.mirror=null;guest.rev=0;}
let seq=0;function cmd(c){results=[];seq++;h.sb.__c=JSON.stringify({v:1,type:'cmd',seq,cid:'replay'+String(seq).padStart(6,'0'),cmd:c});h.run(`MP.onMessage('g0',__c)`);pump('cmd '+c.kind);const r=results.at(-1);return r?(r.status+(r.code?':'+r.code:'')+(r.detail?' '+JSON.stringify(r.detail):'')):'NO-RESULT';}
function stat(l){console.log(l,'| day',(+h.run('G.day')).toFixed(1),'ok',guest.ok,'fail',guest.fail,'resync',guest.resync);}
module.exports={h,g,guest,pump,cmd,stat};
if(require.main===module){
  pump('start');stat('start');
  const G0=+guestId;
  const info=JSON.parse(h.run(`JSON.stringify((()=>{const e=G.emps[${G0}],f=findFed(e);const fl=G.fleets.filter(x=>x.e===${G0}&&x.ships.length).map(x=>({id:x.id,sys:x.sys,lanes:x.sys>=0?G.sys[x.sys].lanes:[]}));
    const yards=G.sys.filter(s=>s.owner===${G0}&&hasYard(s)).map(s=>s.id);return {fed:f&&{id:f.id,vote:f.vote&&{id:f.vote.id,law:f.vote.law,opened:f.vote.opened}},fl,yards,res:e.res};})())`));
  console.log('info',JSON.stringify(info).slice(0,600));
  h.run('__days(2)');pump('days');stat('after 2 days');
  for(const f of info.fl.slice(0,2))if(f.lanes.length){console.log('move',f.id,'→',f.lanes[0],cmd({kind:'move',fleet:f.id,to:f.lanes[0]}));stat(' ');}
  h.run('__days(1)');pump('days');stat('after move+1d');
  for(let i=0;i<3;i++)if(info.yards.length){console.log('ship kor',cmd({kind:'ship',sys:info.yards[0],key:'kor'}));stat(' ');}
  h.run('__days(3)');pump('days');stat('after ships+3d');
  if(info.fed&&info.fed.vote){const tok=h.run(`(()=>{try{return String(fedVoteToken(findFed(G.emps[${G0}])))}catch(e){return 'ERR '+e.message}})()`);console.log('vote token',tok);
    console.log('fedVote',cmd({kind:'fedVote',fed:info.fed.id,token:tok,yes:true}));stat(' ');}
  h.run('__days(5)');pump('days');stat('after vote+5d');
  for(let m=0;m<+(process.env.MONTHS||6);m++){h.run('__days(30)');pump('month');stat('month +'+(m+1));}
}
