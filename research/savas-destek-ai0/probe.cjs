// node probe.cjs <kök> — SAVAŞ-DESTEK-AI.0 Faz A: aynı kontrollü dünyada AI katılım kararı (aiRespond), maliyet (itemValue) ve kapı nedenleri.
const path=require('path');const {runtime}=require(path.resolve(__dirname,'../../tests/helpers/runtime'));const root=path.resolve(process.argv[2]||'.');
function world(O={}){const h=runtime({root});h.sb.OPT=JSON.stringify(O);h.run(`resetSetupNaming();Object.assign(CFG,{seed:22,size:'orta',aiCount:5});setupGame({...CFG});G.autoSave=false;
 var OPT=JSON.parse(OPT),ais=G.emps.filter(o=>o.ai&&!o.dead&&!o.wild&&!o.crisisSide),S=ais[0],X=ais[1],C=ais[2];
 for(const a of G.emps)for(const b of G.emps)if(a!==b){a.contact[b.id]=true;a.ally[b.id]=false;a.war[b.id]=false;a.rel[b.id]=40;(a.intel||={})[b.id]=3;if(a.nap)delete a.nap[b.id];}
 for(const s of G.sys){s.seen=G.emps.map(e=>e.id);}
 if(OPT.ally){S.ally[C.id]=C.ally[S.id]=true;S.rel[C.id]=C.rel[S.id]=80;}
 if(OPT.miz){C._pers=OPT.miz;C._persAt=G.memAge;C.mizac=undefined;}
 C.rel[X.id]=X.rel[C.id]=OPT.hostile?-60:0;
 for(const e of [S,C,X])for(const k of ['min','ene','ala','etk'])e.res[k]=3000;
 if(OPT.crisis){C.res.ene=5;C.res.ala=5;C.inc={...(C.inc||{}),ene:-30,ala:-10};}
 if(OPT.xstrong){for(let i=0;i<6;i++)newFleet(X,X.home,[{c:'zir'},{c:'zir'},{c:'zir'},{c:'zir'}],'güç');}
 if(OPT.cstrong){for(let i=0;i<3;i++)newFleet(C,C.home,[{c:'kru'},{c:'kru'}],'güç');}
 /* C'nin filosu X'e komşu sistemde (erişim) */
 const xs=G.sys[X.home],adj=xs.lanes.map(i=>G.sys[i]).find(s=>s.owner<0)||xs;if(!OPT.noreach)for(const f of G.fleets.filter(f=>f.e===C.id&&isArmed(f))){f.sys=adj.id;f.mv=null;}
 else{for(const f of G.fleets.filter(f=>f.e===C.id))f.ships=[];}
 const att=OPT.sponsorAttacks?S:X,def=OPT.sponsorAttacks?X:S;warAuthorize(att,def,{n:'t'});declareWar(att,def);warAuthClear();
 if(OPT.twoWars){const Y=ais[3];warAuthorize(Y,C,{n:'t'});declareWar(Y,C);warAuthClear();const Z=ais[4];if(Z){warAuthorize(Z,C,{n:'t'});declareWar(Z,C);warAuthClear();}}
 var F=warLedgerFind(S.id,X.id);`);return h;}
const J=(h,x)=>JSON.parse(h.run('JSON.stringify('+x+')'));
const cases={S1_ally_defense_strong:{ally:1,cstrong:1},S2_pasifist_offense:{ally:1,cstrong:1,miz:'pasifist',sponsorAttacks:1},S2b_pasifist_defense:{ally:1,cstrong:1,miz:'pasifist'},
 S2c_militarist_offense:{ally:1,cstrong:1,miz:'militarist',sponsorAttacks:1},S3_common_enemy:{cstrong:1,hostile:1},S4_crisis:{ally:1,cstrong:1,crisis:1},S5_enemy_strong:{ally:1,xstrong:1},
 S6_no_reach:{ally:1,noreach:1},S10_two_wars:{ally:1,cstrong:1,twoWars:1},S20_tuccar:{ally:1,cstrong:1,miz:'tuccar'}};
const out={};for(const [k,o] of Object.entries(cases)){const h=world(o);out[k]=J(h,`(()=>{if(!F)return {err:'no front'};const it={t:'warJoin',front:F.id,target:X.id};
 const offer0={from:S.id,to:C.id,give:[],want:[it],born:G.day,expires:G.day+60},offer300={from:S.id,to:C.id,give:[{t:'res',r:'ala',v:300}],want:[it],born:G.day,expires:G.day+60};
 const g=warSupportGate(C,S,it),r0=aiRespond(C,offer0),r3=aiRespond(C,offer300);const cost=Math.round(itemValue(C,it,S));
 return {cwars:Object.keys(C.war).filter(k=>C.war[k]),gate:g.ok?'ok':g.why,free:r0.v+(r0.v==='red'?':'+String(r0.why).slice(0,70):''),paid300:r3.v+(r3.v==='red'?':'+String(r3.why).slice(0,70):''),cost,pers:personaKey(C),defend:F.roles[F.sides.indexOf(S.id)]===1};})()`);}
console.log(JSON.stringify(out,null,1));
