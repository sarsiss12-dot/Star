'use strict';
/* 96B observer. No resource setter, RNG call, economic decision or payment lives here. */
const EconomyLedger={
 keys:['ene','min','yiy','ala','tuk','ara','etk'],eventLimit:192,monthLimit:12,stack:[],muted:0,atomic:0,freightDepth:0,colonyDepth:0,
 clean(n){return Number.isFinite(n)?n:0;},
 stock(e){return Object.fromEntries(this.keys.map(k=>[k,this.clean(e.res?.[k])]));},
 zero(){return Object.fromEntries(this.keys.map(k=>[k,0]));},
 state(){return G.economyHistory||null;},
 start(){const s={v:1,started:G.day,lastClosed:null,next:1,empires:{}};for(const e of G.emps){const stock=this.stock(e);s.empires[e.id]={balance:stock,opening:{...stock},start:G.day,in:this.zero(),out:this.zero(),months:[],events:[],shortage:!!e.shortage,crisis:e.crisis||null};}G.economyHistory=s;return s;},
 snapshot(){return Object.fromEntries(G.emps.map(e=>[e.id,this.stock(e)]));},
 flush(frame){if(!frame||frame.processed)return;frame.processed=true;const index=this.stack.indexOf(frame),parent=this.stack[index-1];this.flush(parent);this.sync(parent?.label,parent?.kind,parent?.link,frame.before);},
 sync(label='Açıklanamayan stok farkı',kind='unexplained',link=null,snapshot=null){
  const s=this.state();if(!s||this.muted||this.atomic)return;
  if(!snapshot)this.flush(this.stack.at(-1));
  for(const e of G.emps){let row=s.empires[e.id];const current=snapshot?.[e.id]||this.stock(e);if(!row){s.empires[e.id]=row={balance:{...current},opening:{...current},start:G.day,in:this.zero(),out:this.zero(),months:[],events:[],shortage:!!e.shortage,crisis:e.crisis||null};}const changes={};for(const k of this.keys){const d=current[k]-row.balance[k];if(Math.abs(d)>1e-10){changes[k]=d;if(d>0)row.in[k]+=d;else row.out[k]-=d;}row.balance[k]=current[k];}
   if(Object.keys(changes).length)this.event(e.id,{label,kind,changes,link,group:s.next});
  }
 },
 event(id,data){const s=this.state(),row=s?.empires[id];if(!row||this.muted||this.atomic)return;row.events.push({id:s.next++,day:G.day,...data});if(row.events.length>this.eventLimit)row.events.splice(0,row.events.length-this.eventLimit);},
 observe(label,kind,fn,link=null,atomic=false){
  if(this.muted||this.atomic||!this.state())return fn();
  const world=G.emps,frame={label,kind,link,before:this.snapshot(),processed:false};this.stack.push(frame);if(atomic)this.atomic++;
  try{return fn();}finally{if(atomic)this.atomic--;if(world===G.emps&&(frame.processed||G.emps.some(e=>Object.entries(this.stock(e)).some(([k,v])=>v!==frame.before[e.id]?.[k])))){this.flush(frame);this.sync(label,kind,link);}this.stack.pop();}
 },
 closeMonth(){const s=this.state();if(!s||this.muted||s.lastClosed===G.day)return;this.sync();
  for(const e of G.emps){const r=s.empires[e.id];if(!r)continue;const current=this.stock(e),delta=this.zero();for(const k of this.keys)delta[k]=current[k]-r.opening[k];
   r.months.push({start:r.start,end:G.day,year:G.year,month:G.month,full:G.day-r.start>=29.9,opening:r.opening,closing:current,delta,in:r.in,out:r.out,net:Object.fromEntries(this.keys.map(k=>[k,this.clean(e.inc?.[k])])),shortage:!!e.shortage,crisis:e.crisis||null});
   if(r.months.length>this.monthLimit)r.months.shift();
   if(r.shortage!==!!e.shortage||r.crisis!==(e.crisis||null))this.event(e.id,{label:'Kıtlık / kriz durumu değişti',kind:'shortage',changes:{},note:(e.shortage?'Tüketim malı kıtlığı':'Mal kıtlığı yok')+' · '+(e.crisis||'Kaynak krizi yok')});
   r.opening={...current};r.start=G.day;r.in=this.zero();r.out=this.zero();r.shortage=!!e.shortage;r.crisis=e.crisis||null;
  }s.lastClosed=G.day;
 },
 view(e){const r=this.state()?.empires[e.id],stock=this.stock(e);if(!r)return {stock,months:[],events:[],unexplained:this.zero(),last:null};return {stock,months:r.months,events:r.events,unexplained:Object.fromEntries(this.keys.map(k=>[k,stock[k]-r.balance[k]])),last:r.months.at(-1)||null};},
 restore(raw){
  if(!raw){this.start();return;}
  const number=n=>Number.isFinite(n)&&Math.abs(n)<=Number.MAX_SAFE_INTEGER,vector=o=>o&&typeof o==='object'&&!Array.isArray(o)&&this.keys.every(k=>number(o[k]));
  if(raw.lastClosed!==null&&!number(raw.lastClosed))throw Error('Bozuk ekonomi dönem tarihi');
  if(raw.v!==1||!Number.isSafeInteger(raw.next)||raw.next<1||!number(raw.started)||!raw.empires||typeof raw.empires!=='object'||Array.isArray(raw.empires)||Object.keys(raw.empires).length>128)throw Error('Geçersiz ekonomi geçmişi');
  const ids=new Set();let max=0;
  for(const [id,r]of Object.entries(raw.empires)){if(!/^\d+$/.test(id)||!G.emps[id]||!vector(r.balance)||!vector(r.opening)||!vector(r.in)||!vector(r.out)||!number(r.start)||this.keys.some(k=>r.in[k]<0||r.out[k]<0||Math.abs(r.opening[k]+r.in[k]-r.out[k]-r.balance[k])>1e-5)||!Array.isArray(r.months)||r.months.length>12||!Array.isArray(r.events)||r.events.length>this.eventLimit)throw Error('Bozuk ekonomi dönemi');
   for(const m of r.months)if(!['opening','closing','delta','in','out','net'].every(k=>vector(m[k]))||!number(m.start)||!number(m.end)||m.end<m.start||!Number.isInteger(m.year)||!Number.isInteger(m.month)||m.month<1||m.month>12||typeof m.full!=='boolean'||this.keys.some(k=>Math.abs(m.opening[k]+m.in[k]-m.out[k]-m.closing[k])>1e-5||Math.abs(m.closing[k]-m.opening[k]-m.delta[k])>1e-5))throw Error('Ekonomi dönem muhasebesi tutarsız');
   for(const event of r.events){if(!Number.isSafeInteger(event.id)||event.id<1||ids.has(event.id)||!number(event.day)||typeof event.label!=='string'||event.label.length>240||typeof event.kind!=='string'||!event.changes||Object.entries(event.changes).some(([k,v])=>!this.keys.includes(k)||!number(v)))throw Error('Bozuk ekonomi olayı');if(event.note!==undefined&&(typeof event.note!=='string'||event.note.length>1000))throw Error('Bozuk ekonomi açıklaması');if(event.cargo&&(!this.keys.includes(event.cargo.r)||!number(event.cargo.lost)||!number(event.cargo.plundered)||event.cargo.lost<0||event.cargo.plundered<0||event.cargo.plundered>event.cargo.lost+1e-7))throw Error('Bozuk ekonomi kargo kaydı');if(event.link&&(['system','convoy'].some(k=>event.link[k]!==undefined&&(!Number.isSafeInteger(event.link[k])||event.link[k]<0))))throw Error('Bozuk ekonomi konumu');ids.add(event.id);max=Math.max(max,event.id);}
  }if(raw.next<=max)throw Error('Ekonomi olay kimliği tekrarı');G.economyHistory=JSON.parse(JSON.stringify(raw));
 },
 incomeReport(e){
  const rows=[],keys=this.keys;let last={};
  const add=(name,r,n,system=null)=>{if(Number.isFinite(n)&&n!==0)rows.push({name,r,n,system});};
  const delta=(name,o,previous,system=null)=>{for(const k of keys)add(name,k,(o[k]||0)-(previous[k]||0),system);};
  return {add,reset(o){last={...o};},colony(sys,pl,o){let prev={...o};return name=>{delta(name,o,prev,sys.id);prev={...o};};},empire(inc){last={...inc};return name=>{delta(name,inc,last);last={...inc};};},finish(inc){
   const grouped=new Map();for(const row of rows){const key=JSON.stringify([row.name,row.r,row.system]),previous=grouped.get(key);if(previous)previous.n+=row.n;else grouped.set(key,{...row});}
   const list=[...grouped.values()],sum={};for(const k of keys){const values=list.filter(r=>r.r===k);sum[k]={production:values.reduce((n,r)=>n+Math.max(0,r.n),0),consumption:values.reduce((n,r)=>n+Math.max(0,-r.n),0),net:inc[k],difference:(inc[k]||0)-values.reduce((n,r)=>n+r.n,0)};}
   return {day:G.day,rows:list,sum};
  }};
 },
 freightNote(before,v){if(!v||!before)return;const lost=(v.lost||0)-before.lost,plundered=(v.plundered||0)-before.plundered;if(lost>0)this.event(v.e,{label:plundered>0?'Gerçek kargo yağması / kaybı':'Gerçek kargo imhası',kind:'cargoLoss',changes:{},cargo:{r:v.r,lost,plundered},link:{convoy:v.id,system:v.at},note:'Yük daha önce depodan ayrıldı; depodan ikinci kez düşülmez.'});},
 install(){
  const wrap=(obj,key,label,kind,atomic=false)=>{const old=obj[key];if(typeof old!=='function')return;obj[key]=function(...args){const watch=['captureSystem','invasionTick','colossusFire','schismTick','devourPlanet','doColonize','buildHabitat','executeDeal'].includes(key),outer=watch&&EconomyLedger.colonyDepth++===0,before=outer?G.emps.map(e=>e.colonies.map(c=>c.s+':'+c.p).sort().join(',')):null;const sy=args.find(x=>x&&typeof x==='object'&&G.sys[x.id]===x);try{const result=EconomyLedger.observe(label,kind,()=>old.apply(this,args),sy?{system:sy.id}:null,atomic);if(outer)for(const e of G.emps)if(before[e.id]!==e.colonies.map(c=>c.s+':'+c.p).sort().join(','))EconomyLedger.event(e.id,{label:'Koloni edinimi / kaybı',kind:'colony',changes:{},note:'Koloni listesi değişti; üretim sonraki ekonomik hesapta yenilenir.',link:sy?{system:sy.id}:null});return result;}finally{if(watch)EconomyLedger.colonyDepth--;}};};
  // Explicit mutation owners, generated from the source audit and reviewed labels.
  wrap(globalThis,"aiDisbandTick","Doğrulanmış işlem: aiDisbandTick","other",false);
  wrap(globalThis,"aiIntelPactTick","Doğrulanmış işlem: aiIntelPactTick","other",false);
  wrap(globalThis,"aiSubmitTick","Doğrulanmış işlem: aiSubmitTick","other",false);
  wrap(globalThis,"aiTurn","Doğrulanmış işlem: aiTurn","other",false);
  wrap(globalThis,"applyDamage","Doğrulanmış işlem: applyDamage","other",false);
  wrap(globalThis,"applyItems","Diplomatik kaynak aktarımı","diplomacy",false);
  wrap(globalThis,"battleRound","Doğrulanmış işlem: battleRound","other",false);
  wrap(globalThis,"battleTick","Nedeni ayrıştırılmamış simülasyon farkı: battleTick","unexplained",false);
  wrap(globalThis,"blackmailLeader","Doğrulanmış işlem: blackmailLeader","other",false);
  wrap(globalThis,"blackmailVote","Doğrulanmış işlem: blackmailVote","other",false);
  wrap(globalThis,"bribeVote","Doğrulanmış işlem: bribeVote","other",false);
  wrap(globalThis,"buildHabitat","Doğrulanmış işlem: buildHabitat","other",false);
  wrap(globalThis,"cancelBuild","Bina siparişi iptal iadesi","refund",false);
  wrap(globalThis,"cancelShipOrders","Gemi siparişi iptal iadesi","refund",false);
  wrap(globalThis,"captureSystem","Doğrulanmış işlem: captureSystem","other",false);
  wrap(globalThis,"claimPermanent","Doğrulanmış işlem: claimPermanent","other",false);
  wrap(globalThis,"colonyBuildTick","Bina yıkımı / iş tamamlama iadesi","building",false);
  wrap(globalThis,"councilTick","Doğrulanmış işlem: councilTick","other",false);
  wrap(globalThis,"counterPanopticon","Doğrulanmış işlem: counterPanopticon","other",false);
  wrap(globalThis,"crisisResolved","Doğrulanmış işlem: crisisResolved","other",false);
  wrap(globalThis,"dailyTick","Nedeni ayrıştırılmamış simülasyon farkı: dailyTick","unexplained",false);
  wrap(globalThis,"deepInvestigate","Doğrulanmış işlem: deepInvestigate","other",false);
  wrap(globalThis,"demandVassal","Doğrulanmış işlem: demandVassal","other",false);
  wrap(globalThis,"demolishBuilding","Nedeni ayrıştırılmamış simülasyon farkı: demolishBuilding","unexplained",false);
  wrap(globalThis,"devourPlanet","Doğrulanmış işlem: devourPlanet","other",false);
  wrap(globalThis,"doColonize","Nedeni ayrıştırılmamış simülasyon farkı: doColonize","unexplained",false);
  wrap(globalThis,"doReform","Doğrulanmış işlem: doReform","other",false);
  wrap(globalThis,"doSabotage","Doğrulanmış işlem: doSabotage","other",false);
  wrap(globalThis,"doSurvey","Doğrulanmış işlem: doSurvey","other",false);
  wrap(globalThis,"edictTick","Doğrulanmış işlem: edictTick","other",false);
  wrap(globalThis,"executeDeal","Diplomatik anlaşma / kaynak transferi / imza bedeli","diplomacy",true);
  wrap(globalThis,"falseFlagOp","Doğrulanmış işlem: falseFlagOp","other",false);
  wrap(globalThis,"fedFundTick","Doğrulanmış işlem: fedFundTick","other",false);
  wrap(globalThis,"fedTick","Doğrulanmış işlem: fedTick","other",false);
  wrap(globalThis,"foundCouncil","Doğrulanmış işlem: foundCouncil","other",false);
  wrap(globalThis,"foundFederation","Doğrulanmış işlem: foundFederation","other",false);
  wrap(globalThis,"fundSeparatists","Doğrulanmış işlem: fundSeparatists","other",false);
  wrap(globalThis,"grantFed","Doğrulanmış işlem: grantFed","other",false);
  wrap(globalThis,"inciteRebellion","Doğrulanmış işlem: inciteRebellion","other",false);
  wrap(globalThis,"invasionTick","İstila / koloni yağması","war",false);
  wrap(globalThis,"issueEdict","Doğrulanmış işlem: issueEdict","other",false);
  wrap(globalThis,"marketTrade","Piyasa kaynak takası","market",false);
  wrap(globalThis,"monthTick","Nedeni ayrıştırılmamış simülasyon farkı: monthTick","unexplained",false);
  wrap(globalThis,"offerPatronage","Doğrulanmış işlem: offerPatronage","other",false);
  wrap(globalThis,"offerShareVision","Doğrulanmış işlem: offerShareVision","other",false);
  wrap(globalThis,"pickSituation","Özel durum seçimi / proje bedeli","event",false);
  wrap(globalThis,"proposeBill","Doğrulanmış işlem: proposeBill","other",false);
  wrap(globalThis,"proposeFedLaw","Doğrulanmış işlem: proposeFedLaw","other",false);
  wrap(globalThis,"proposeFedMotion","Doğrulanmış işlem: proposeFedMotion","other",false);
  wrap(globalThis,"queueBuilding","Bina inşaatı peşin ödemesi","building",false);
  wrap(globalThis,"queueDemolish","Nedeni ayrıştırılmamış simülasyon farkı: queueDemolish","unexplained",false);
  wrap(globalThis,"queueShip","Gemi siparişi peşin ödemesi","ship",false);
  wrap(globalThis,"rebuildThrone","Doğrulanmış işlem: rebuildThrone","other",false);
  wrap(globalThis,"recruitLeader","Doğrulanmış işlem: recruitLeader","other",false);
  wrap(globalThis,"repairTick","Filo onarım maliyeti","fleet",false);
  wrap(globalThis,"researchTick","Bilim puanının araştırma dallarına aktarımı","research",false);
  wrap(globalThis,"ruinReward","Harabe keşif ödülü","event",false);
  wrap(globalThis,"runOp","Doğrulanmış işlem: runOp","other",false);
  wrap(globalThis,"runWhisper","Doğrulanmış işlem: runWhisper","other",false);
  wrap(globalThis,"seekProtection","Doğrulanmış işlem: seekProtection","other",false);
  wrap(globalThis,"sendUltimatum","Doğrulanmış işlem: sendUltimatum","other",false);
  wrap(globalThis,"setWarGoal","Doğrulanmış işlem: setWarGoal","other",false);
  wrap(globalThis,"situationsTick","Doğrulanmış işlem: situationsTick","other",false);
  wrap(globalThis,"starName","Doğrulanmış işlem: starName","other",false);
  wrap(globalThis,"startStruct","Uzay yapısı inşaat ödemesi","building",false);
  wrap(globalThis,"startTerraform","Doğrulanmış işlem: startTerraform","other",false);
  wrap(globalThis,"stealTech","Doğrulanmış işlem: stealTech","other",false);
  wrap(globalThis,"stepFleets","Nedeni ayrıştırılmamış simülasyon farkı: stepFleets","unexplained",false);
  wrap(globalThis,"structTick","Nedeni ayrıştırılmamış simülasyon farkı: structTick","unexplained",false);
  wrap(globalThis,"supportIndep","Doğrulanmış işlem: supportIndep","other",false);
  wrap(globalThis,"tributeTick","Aylık haraç transferi","tribute",false);
  wrap(globalThis,"trySabotage","Doğrulanmış işlem: trySabotage","other",false);
  wrap(globalThis,"vassalTick","Vasallık vergi / araştırma transferi","tribute",false);
  wrap(globalThis,"warSubsidyTick","Doğrulanmış işlem: warSubsidyTick","other",false);
  wrap(globalThis,'economyTick','Aylık ekonomi / diğer fark','unexplained');
  for(const key of ['captureSystem','colossusFire','schismTick','doColonize'])if(typeof globalThis[key]==='function')wrap(globalThis,key,'Koloni işlemi','colony');
  const setup=setupGame;setupGame=function(...args){EconomyLedger.muted++;try{return setup.apply(this,args);}finally{EconomyLedger.muted--;EconomyLedger.start();}};
  const load=deserialize;deserialize=function(...args){EconomyLedger.muted++;try{return load.apply(this,args);}finally{EconomyLedger.muted--;}};
  const tick=monthTick;monthTick=function(...args){const result=tick.apply(this,args);EconomyLedger.closeMonth();return result;};
  for(const [key,label,kind]of [['dispatch','Gerçek konvoy yükleme','cargoLoad'],['finish','Gerçek konvoy teslimatı','cargoDelivery'],['attack','Yağmacının aldığı gerçek kargo','cargoPlunder']]){
   const old=Commerce[key];Commerce[key]=function(...args){const v=key==='dispatch'?null:args[0],before=v?{lost:v.lost||0,plundered:v.plundered||0}:null;const outer=EconomyLedger.freightDepth++===0;try{const result=EconomyLedger.observe(label,kind,()=>old.apply(this,args),v?{convoy:v.id,system:v.at}:null);if(outer)EconomyLedger.freightNote(before,v);return result;}finally{EconomyLedger.freightDepth--;}};
  }
  // Catalog callbacks are otherwise anonymous resource writers.
  const catalog=(value,seen=new Set())=>{if(!value||typeof value!=='object'||seen.has(value))return;seen.add(value);for(const key of Object.keys(value)){if(key==='f'&&typeof value[key]==='function')wrap(value,key,'Olay / keşif kararı','event');else if(typeof value[key]==='object')catalog(value[key],seen);}};
  for(const value of [ANOMALIES,EVENTS,CHAINS])catalog(value);
  const hook=UI._hook;UI._hook=function(action,fn){return hook.call(this,action,(...args)=>EconomyLedger.observe('Onay işlemi: '+action,'action',()=>fn(...args)));};
  const act=UI.act;UI.act=function(action,...args){if(action.startsWith('eco')||['globalPane','closeDiplo','grpTog','tab','news','diplomaticInbox','commerce','commerceConvoys','commerceNew','diploPane','cncPane','fedPane'].includes(action))return act.call(this,action,...args);return EconomyLedger.observe('Arayüz işlemi: '+action,'action',()=>act.call(this,action,...args));};
 }
};
