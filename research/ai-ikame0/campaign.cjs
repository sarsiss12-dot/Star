'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { gzipSync } = require('node:zlib');
const { runtime } = require('../../tests/helpers/runtime');

const [root, arm, ...args] = process.argv.slice(2);
const [systems, ai, seed, limit] = args.map(Number);
const output = path.resolve(process.env.STARS_OUTPUT || '/tmp/stars-ikame');
const name = [arm, systems, ai, seed].join('-');
const finance = process.env.STARS_FINANCE ?? '';
const checkpoints = new Set((process.env.STARS_CHECKPOINTS || '').split(',').filter(Boolean).map(Number));
const from = process.env.STARS_FROM;
const probe = process.env.STARS_RECOVERY_PROBE ?? '';
const recordForecast = process.env.STARS_RECOVERY_FORECAST === '1';
const firstMonth = from ? Math.floor(JSON.parse(fs.readFileSync(from, 'utf8')).day / 30) : 0;
const h = runtime({ root: path.resolve(root), processGlobal: true });
fs.mkdirSync(output, { recursive: true });

if(from){
  h.sb.auditInput=fs.readFileSync(from,'utf8');
  if(!h.run('deserialize(auditInput)'))throw Error('Save8');
  delete h.sb.auditInput;
}
h.run(`
  if(!${!!from})setupGame({...CFG,size:setupSizeKey(${systems}),aiCount:${ai},seed:${seed}});
  if(G.sys.length!==${systems}||(!${!!from}&&G.emps.filter(e=>e.ai&&!e.wild&&!e.crisisSide).length!==${ai}))throw Error('Kurulum');
  G.autoSave=false;
  const auditEvents=[], auditOrders=new WeakMap(), auditIncome=new Map();
  const finance=${JSON.stringify(finance)};
  const financeFor=e=>e?.ai&&!e.wild&&!e.crisisSide&&(finance==='all'||finance===String(e.id));
  let auditId=0, auditCompletionOrders=null;
  const auditAI=e=>e?.ai&&!e.wild&&!e.crisisSide;
  const auditNote=(kind,e,detail)=>auditEvents.push({kind,day:G.day,actor:e.id,...detail});
  const auditWrap=(name,record)=>{
    const original=globalThis[name];
    globalThis[name]=function(...args){
      const result=original.apply(this,args);
      record(result,...args);
      return result;
    };
  };
  for(const name of ['queueBuilding','queueDemolish'])auditWrap(name,(ok,e,s,p,key)=>{
    if(!ok||!auditAI(e))return;
    const q=p.col.q.at(-1),id=++auditId;
    auditOrders.set(q,id);
    const event={system:s.id,planet:p.i,key,id,paid:q.paid};
    if(auditCompletionOrders&&!q.dem)auditCompletionOrders.set(p,{e,event});
    else auditNote(q.dem?'demolition':'paid',e,event);
  });
  auditWrap('aiPlanEvent',(_,e,kind,detail)=>{
    if(auditAI(e)&&kind==='building-replacement'){
      const q=G.sys[detail.system].planets[detail.planet].col.q.at(-1);
      auditNote('replacement',e,{...detail,id:auditOrders.get(q)});
    }
  });
  if(finance){
    auditWrap('empireIncome',(income,e,detail)=>{
      if(!financeFor(e)||e!==G.emps[e.id]||detail===false)return;
      const lines=e._incomeDetail?.rows?.filter(row=>row.r==='ala')||[];
      auditIncome.set(e.id,{day:G.day,net:income.ala,upkeep:e.fleetAlloyUp,lines});
    });
    const ledgerEvent=EconomyLedger.event;
    EconomyLedger.event=function(id,data){
      if(financeFor(G.emps[id])&&data.changes?.ala&&data.kind!=='production')
        auditNote('stock-alloy',G.emps[id],{label:data.label,type:data.kind,delta:data.changes.ala});
      return ledgerEvent.call(this,id,data);
    };
    auditWrap('queueShip',(ok,e,s,cls)=>{
      if(ok&&financeFor(e))auditNote('ship-order',e,{system:s.id,cls,paid:s.queue.at(-1).paid});
    });
    let recover=false;
    const recovery=aiRecoverEconomy,demolish=queueDemolish;
    aiRecoverEconomy=function(e){
      recover=financeFor(e);
      try{return recovery(e);}finally{recover=false;}
    };
    if(${recordForecast})auditWrap('aiBuildingDelta',(delta,e,s,p,key)=>{
      if(!recover||key!=='dokum')return;
      const stock=e.res.ala||0,net=e.inc.ala||0,after=net+delta.ala;
      auditNote('recovery-forecast',e,{system:s.id,planet:p.i,key,stock,net,loss:delta.ala,after,
        months:after<0?stock/-after:null});
    });
    queueDemolish=function(e,s,p,key,...rest){
      if(recover){
        const blocked=key==='dokum'&&${JSON.stringify(probe)}==='keep-foundry';
        auditNote('recovery-demolition',e,{system:s.id,planet:p.i,key,blocked,stock:{...e.res},income:{...e.inc},buildings:{...p.col.b}});
        if(blocked)return false;
      }
      return demolish(e,s,p,key,...rest);
    };
    if(typeof aiCanFinishReplacement==='function'){
      const finish=aiCanFinishReplacement;
      aiCanFinishReplacement=function(e,s,p,job){
        const ok=finish(e,s,p,job);
        if(financeFor(e))auditNote('replacement-finish',e,{system:s.id,planet:p.i,key:job.key,wanted:job.replacement.key,ok});
        return ok;
      };
    }
    if(${JSON.stringify(probe)}==='omit-strategic-preview'){
      const preview=aiReplacementFirstBuilding;
      aiReplacementFirstBuilding=function(e,s,p,pick,...rest){
        return financeFor(e)?pick.wanted:preview(e,s,p,pick,...rest);
      };
    }
  }
  const auditDiagnostic=AIDiagnostics.note;
  AIDiagnostics.note=function(code,e,other,detail){
    if(code==='replacement:deferred'||code==='replacement:committed')auditNote(code,e,
      typeof detail==='string'?JSON.parse(detail):detail);
    return auditDiagnostic.call(this,code,e,other,detail);
  };
  const auditBuild=colonyBuildTick;
  colonyBuildTick=function(dt){
    const ready=[];
    for(const e of G.emps)if(auditAI(e)&&!e.dead)for(const c of e.colonies){
      const p=G.sys[c.s].planets[c.p],q=p.col?.q?.[0];
      if(q&&p.owner===e.id&&q.left<=dt)ready.push({e,c,p,q,count:p.col.b[q.key]||0});
    }
    auditCompletionOrders=new Map();
    auditBuild(dt);
    for(const {e,c,p,q,count} of ready){
      const diff=(p.col.b[q.key]||0)-count;
      auditNote(diff>0?'built':diff<0?'removed':'refunded',e,{
        system:c.s,planet:c.p,key:q.key,id:auditOrders.get(q),paid:q.paid,refund:q.refund,replacement:q.replacement
      });
      const order=auditCompletionOrders.get(p);
      if(order)auditNote('paid',order.e,order.event);
    }
    auditCompletionOrders=null;
  };
  // activeShipQueue runs inside dailyTick after movement/trade and before the
  // exact same indices are decremented. Count delivered hulls, including merges.
  let auditDailyStep=0;
  const auditDaily=dailyTick;
  dailyTick=function(dt){
    auditDailyStep=dt;
    try{return auditDaily(dt);}finally{auditDailyStep=0;}
  };
  const auditActive=activeShipQueue;
  activeShipQueue=function(s){
    const active=auditActive(s);
    if(auditDailyStep)for(const i of active){
      const q=s.queue[i],e=G.emps[q.e];
      if(auditAI(e)&&q.fed===undefined&&!e.dead&&s.owner===e.id&&q.left<=auditDailyStep){
        auditNote('ship-delivered',e,{system:s.id,key:q.cls});
      }
    }
    return active;
  };
  function auditMonth(){
    for(let i=0;i<60&&!G.over;i++){
      const m=Math.floor(G.day/30);
      G.day+=.5;
      dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();
      if(Math.floor(G.day/30)>m)monthTick();
    }
  }
  function auditState(){
    const ships=new Map(),military=new Map();
    for(const f of G.fleets){
      ships.set(f.e,(ships.get(f.e)||0)+f.ships.length);
      if(isArmed(f))military.set(f.e,(military.get(f.e)||0)+fleetPower(f));
    }
    return JSON.stringify({day:G.day,over:!!G.over,rng:RND_STATE,emps:G.emps.filter(auditAI).map(e=>({
      id:e.id,dead:e.dead,res:e.res,inc:e.inc,colonies:e.colonies.length,
      ships:ships.get(e.id)||0,military:military.get(e.id)||0,tech:Object.keys(e.techs).length,
      deliveries:G.commerce?.stats?.[e.id]?.deliveries||0,
      ...(financeFor(e)?{alloy:auditIncome.get(e.id),shipPlan:e.aiShipPlan,
        foundries:e.colonies.reduce((n,c)=>n+(G.sys[c.s]?.planets[c.p]?.col?.b.dokum||0),0),
        incomeLedger:EconomyLedger.state()?.empires[e.id]?.months.at(-1)?.delta.ala}: {})
    }))});
  }
`);

const months = [];
const fixtureMonths = { '100-9-11': 79, '100-9-99': 90, '100-9-404': 33 };
const fixtureMonth = fixtureMonths[[systems, ai, seed].join('-')];
let previous;
let capturedFirst = false;
for (let m = firstMonth; m <= limit; m++) {
  if (m > firstMonth) h.run('auditMonth()');
  const state = JSON.parse(h.run('auditState()'));
  const save = h.run('serialize()');
  state.sha256 = createHash('sha256').update(save).digest('hex');
  months.push(state);
  if(checkpoints.has(m))fs.writeFileSync(path.join(output,name+'-m'+m+'.save'),save);
  if (arm === 'p44' && m === fixtureMonth) fs.writeFileSync(path.join(output, name + '-ornek.save'), save);
  if (!capturedFirst && h.run("auditEvents.some(e=>e.kind.startsWith('replacement:'))")) {
    capturedFirst = true;
    if(previous)fs.writeFileSync(path.join(output, name + '-ilk.save'), previous);
  }
  previous = save;
  if (m % 30 === 0 || state.over) process.stdout.write(name + ' ' + m + ' ' + state.day + '\n');
  if (state.over) break;
}
const world = JSON.parse(h.run('JSON.stringify({events:auditEvents,fronts:G.warLedger.fronts})'));
fs.writeFileSync(path.join(output, name + '.json.gz'), gzipSync(JSON.stringify({ months, ...world })));
