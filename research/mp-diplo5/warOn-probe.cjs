const path=require('path'),{runtime}=require(require('path').resolve(__dirname,'../../tests/helpers/runtime'));const root=process.argv[2];
const h=runtime({root});const J=s=>JSON.parse(h.run('JSON.stringify('+s+')'));
h.run(`resetSetupNaming();Object.assign(CFG,{seed:22,size:'orta',aiCount:5});setupGame({...CFG});G.autoSave=false;
for(const o of G.emps)if(!o.wild){for(const q of G.emps)if(q!==o&&!q.wild){o.contact[q.id]=true;o.rel[q.id]=40;o.war[q.id]=false;o.ally[q.id]=false;}if(isPurifier(o)){o.mizac='militarist';delete o._pers;}}
G.p.res.min=G.p.res.etk=9000;var A=G.emps.filter(o=>o.ai&&!o.wild&&!o.dead);`);
const cases=[];for(let i=0;i<A_len();i++);function A_len(){return 0;}
const r=J(`(()=>{const out=[];for(const x of A)for(const y of A){if(x===y)continue;for(const pay of [300,800]){const o={from:0,to:x.id,give:[{t:'res',r:'min',v:pay}],want:[{t:'warOn',target:y.id}],born:G.day,expires:G.day+300};
  const r=aiRespond(x,o);out.push({x:x.id,y:y.id,pay,v:r.v,why:r.why||'',ratio:+(aiKnownPower(x,y)/Math.max(1,aiKnownPower(x,x))).toFixed(2),reach:!!warSupportReach(x,y,G.p,[]),budget:typeof aiWarBudget==='function'?aiWarBudget(x,y).ok:null});}}return out;})()`);
const acc=r.filter(c=>c.v==='kabul');console.log(JSON.stringify({n:r.length,kabul:acc.length,kabulUnreach:acc.filter(c=>!c.reach).length,kabulStrong:acc.filter(c=>c.ratio>2.5).length,kabulNoBudget:acc.filter(c=>c.budget===false).length,sample:acc.filter(c=>!c.reach||c.ratio>2.5||c.budget===false).slice(0,4),rej:r.filter(c=>c.v!=='kabul').slice(0,3)}));
