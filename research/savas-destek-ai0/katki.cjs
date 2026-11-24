// node katki.cjs <kök> — S15/S16: katılımı kabul eden AI'nın gerçek cephe davranışı (filo hedefi, mesafe, cephe metrikleri), 6 ay.
const path=require('path');const {runtime}=require(path.resolve(__dirname,'../../tests/helpers/runtime'));const root=path.resolve(process.argv[2]||'.');
const reach=process.argv[3]!=='noreach';const h=runtime({root});h.sb.REACH=reach;h.sb.THREAT=process.argv[4]==='threat';h.sb.FAR=process.argv[5]==='far';
h.run(`resetSetupNaming();Object.assign(CFG,{seed:22,size:'orta',aiCount:5});setupGame({...CFG});G.autoSave=false;
 var ais=G.emps.filter(o=>o.ai&&!o.dead&&!o.wild&&!o.crisisSide),S=ais[0],X=ais[1],C=ais[2];
 for(const a of G.emps)for(const b of G.emps)if(a!==b){a.contact[b.id]=true;a.ally[b.id]=false;a.war[b.id]=false;a.rel[b.id]=40;(a.intel||={})[b.id]=3;if(a.nap)delete a.nap[b.id];}
 for(const s of G.sys)s.seen=G.emps.map(e=>e.id);S.ally[C.id]=C.ally[S.id]=true;for(const e of [S,C,X])for(const k of ['min','ene','ala','etk'])e.res[k]=3000;
 for(let i=0;i<3;i++)newFleet(C,C.home,[{c:'kru'},{c:'kru'}],'güç');
 if(REACH){const xs=G.sys[X.home],adj=xs.lanes.map(i=>G.sys[i]).find(s=>s.owner<0)||xs;for(const f of G.fleets.filter(f=>f.e===C.id&&isArmed(f))){f.sys=adj.id;f.mv=null;}}
 warAuthorize(X,S,{n:'t'});declareWar(X,S);warAuthClear();var F=warLedgerFind(S.id,X.id);
 if(THREAT){const sh=G.sys[S.home];for(const f of G.fleets.filter(f=>f.e===S.id&&isArmed(f)))f.ships=f.ships.slice(0,1);newFleet(X,sh.id,[{c:'kor'},{c:'kor'}],'baskın');
  /* C'nin filoları S'ye komşu, S topraklarına geçiş müttefiklikle açık */const adj1=sh.lanes.map(i=>G.sys[i])[0],adj=FAR?adj1.lanes.map(i=>G.sys[i]).find(x=>x.id!==sh.id&&!sh.lanes.includes(x.id))||adj1:adj1;for(const f of G.fleets.filter(f=>f.e===C.id&&isArmed(f))){f.sys=adj.id;f.mv=null;}}
 var dS=()=>G.fleets.filter(f=>f.e===C.id&&isArmed(f)).map(f=>Math.round(dist(G.sys[f.mv?f.mv.to:f.sys],G.sys[S.home])));
 var dHome=()=>{const xs=G.sys[X.home];return G.fleets.filter(f=>f.e===C.id&&isArmed(f)).map(f=>Math.round(dist(G.sys[f.mv?f.mv.to:f.sys],xs)));};
 var __step=n=>{const m0=Math.floor(G.day/30);let g=0;while(Math.floor(G.day/30)<m0+n&&g++<20000){const pm=Math.floor(G.day/30);G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);if(Math.floor(G.day/30)>pm)monthTick();}};`);
const r=JSON.parse(h.run(`(()=>{const d0=dHome(),offer={from:S.id,to:C.id,give:[{t:'res',r:'ala',v:300}],want:[{t:'warJoin',front:F.id,target:X.id}],born:G.day,expires:G.day+60};
 const ok=executeDeal(offer);const f2=warLedgerFind(C.id,X.id);const rows=[];for(let m=1;m<=6;m++){__step(1);const fr=warLedgerFind(C.id,X.id),i=fr?fr.sides.indexOf(C.id):-1,mt=fr?fr.metrics[i]:{};
  rows.push({m,war:!!C.war[X.id],d:dHome(),dS:dS(),ev:(C.aiStrategy?.events||C.aiStrategy?.log||[]).filter(x=>x&&(x.kind==='support-defend'||x.k==='support-defend')).length,orders:G.fleets.filter(f=>f.e===C.id&&isArmed(f)&&f.mv).length,dmg:Math.round(mt.damageDealt||0),kills:mt.shipsDestroyed||0,lost:mt.shipsLost||0,sys:(mt.systems||[]).length,plan:C.aiStrategy?.plan?.enemy??null,stage:C.aiStrategy?.plan?.stage||null});}
 return JSON.stringify({ok:!!ok,front:f2&&{id:f2.id,parent:f2.parent,campaign:f2.campaign,root:F.campaign,entry:f2.entryKind},d0,rows});})()`));
console.log(JSON.stringify(r));
