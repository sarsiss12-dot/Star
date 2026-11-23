// node funnel.cjs <kök> <tohum> <ay> <çıkış.json> — doğal kampanya; ticaret AI karar hunisi (salt gözlem: AIDiagnostics.note kodları +
// aiTransitRequest aşamalarının yan etkisiz kopyası; kopya kendi bütçe nesnesiyle çalışır, dünyaya / RNG'ye yazmaz)
const fs=require('fs'),path=require('path');const {runtime}=require(require('path').resolve(__dirname,'../../tests/helpers/runtime'));
const [root,seed,months,out]=process.argv.slice(2);const h=runtime({root:path.resolve(root)});
h.run(`resetSetupNaming();Object.assign(CFG,{seed:${+seed},size:'ulu',aiCount:9});setupGame({...CFG});G.autoSave=false;
var F={codes:{},transit:{calls:0,etk:0,need:0,cool:0,noOwner:0,pairs:0,fwdBase:0,ownerTried:0,withGrant:0,terms:0,baseOpen:0,grantVol:0,revFail:0,revFailBGrantOk:0,quote:0,ok:0},port:{calls:0,made:0},signed:0,transitDeals:0,deliv:0,month:[]};
var __n=AIDiagnostics.note;AIDiagnostics.note=function(code){F.codes[code]=(F.codes[code]||0)+1;return __n.apply(this,arguments);};
var __t=Commerce.aiTransitRequest;Commerce.aiTransitRequest=function(a,b,A,B,budget){const T=F.transit;T.calls++;try{(function(){const C=Commerce,bud={routes:budget.routes};
  if(!B||!a.ai||!b.ai)return;if(a.res.etk<80){T.etk++;return;}if(!C.resources.some(r=>A[r].need>0&&B[r].export>=1)){T.need++;return;}
  if(a.aiTalk?.['portTransit:'+b.id]?.until>G.day){T.cool++;return;}
  const owners=G.emps.filter(o=>o!==a&&o!==b&&!o.dead&&!o.wild&&!o.crisisSide&&a.contact[o.id]&&!C.portRight(o,a)&&!a.war[o.id]&&!diploBlocked(a,o)&&!tradeBlocked(a,o)&&tradeHubs(o).some(id=>C.identifiedPort(a,G.sys[id],o)));
  if(!owners.length){T.noOwner++;return;}
  for(const source of tradeHubs(a))for(const target of tradeHubs(b)){if(bud.routes<2)return;if(!C.identifiedPort(a,G.sys[target],b))continue;T.pairs++;bud.routes--;if(!C.aiPortRoute(b,a,target,source))continue;T.fwdBase++;
   for(const owner of owners){if(bud.routes<=0)return;bud.routes--;T.ownerTried++;const grants=new Set([owner.id+':'+a.id]);const p=C.route(a,b,source,target,{grants,avoidObserved:true});if(!p)continue;T.withGrant++;
    const distance=p.slice(1).reduce((n,id,i)=>n+dist(G.sys[p[i]],G.sys[id]),0);const terms=C.aiTerms(a,b,A,B,{source,target,distance});if(!terms)continue;T.terms++;
    if(C.route(a,b,source,target,{avoidObserved:true,volume:terms.give[0].v})){T.baseOpen++;continue;}
    if(!C.route(a,b,source,target,{grants,avoidObserved:true,volume:terms.give[0].v}))continue;T.grantVol++;
    if(!C.route(b,a,target,source,{avoidObserved:true,volume:terms.want[0].v})){T.revFail++;if(C.route(b,a,target,source,{grants:new Set([owner.id+':'+b.id]),avoidObserved:true,volume:terms.want[0].v}))T.revFailBGrantOk++;continue;}
    const offer={from:a.id,to:owner.id,give:[{t:'res',r:'etk',v:36}],want:[{t:'portTransit'}]};if(!dealQuote(offer).ok||a.res.etk-36<40)continue;T.quote++;return;}}
  })();}catch(e){T.err=String(e).slice(0,80);}const r=__t.apply(this,arguments);if(r)T.ok++;return r;};
var __p=Commerce.aiPortInvestment;Commerce.aiPortInvestment=function(){F.port.calls++;const r=__p.apply(this,arguments);if(r)F.port.made++;return r;};
var __ex=executeDeal;executeDeal=function(o){const r=__ex.apply(this,arguments);if(r){const it=(o.give||[]).concat(o.want||[]);if(it.some(i=>i.t==='freight'))F.signed++;if(it.some(i=>i.t==='portTransit'))F.transitDeals++;}return r;};
var __m=()=>{const m=Math.floor(G.day/30);let g=0;while(Math.floor(G.day/30)<=m&&g++<200){G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);if(Math.floor(G.day/30)>m)monthTick();}};`);
const t0=Date.now();for(let m=1;m<=+months;m++){h.run('__m()');if(m%12===0)h.run(`F.month.push({m:${m},contracts:(G.commerce?.contracts||[]).filter(c=>!Commerce.closed(c)).length,deliv:(G.commerce?.convoys||[]).filter(v=>v.status==='delivered').length,ports:G.emps.filter(e=>e.ai&&!e.dead).reduce((n,e)=>n+tradeHubs(e).length,0)})`);}
const r=JSON.parse(h.run('JSON.stringify(F)'));r.sec=Math.round((Date.now()-t0)/1000);fs.writeFileSync(out,JSON.stringify(r));
console.log(seed,JSON.stringify({transit:r.transit,port:r.port,signed:r.signed,transitDeals:r.transitDeals,last:r.month.at(-1),sec:r.sec}));
