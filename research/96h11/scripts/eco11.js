'use strict';
// Economic summary per arm run: final + mean over months of AI empires (alive), crit/food months.
const fs=require('fs');const R=['ene','min','ala','yiy','tuk','ara','etk'];
function sum(f){const r=JSON.parse(fs.readFileSync(f,'utf8'));const out={crit:0,food:0,techs:0,ships:0,power:0,cols:0,used:0,slots:0,alive:0};
 for(const k of R){out['inc_'+k]=0;out['res_'+k]=0;}
 for(const row of r.rows)for(const e of row.emps){if(e.dead)continue;if(e.crit)out.crit++;if(e.food)out.food++;for(const k of R)out['inc_'+k]+=e.inc[k]/r.rows.length;}
 const last=r.rows.at(-1).emps.filter(e=>!e.dead);out.alive=last.length;for(const e of last){out.techs+=e.techs;out.ships+=e.ships;out.power+=e.power;out.cols+=e.cols;out.used+=e.used;out.slots+=e.slots;for(const k of R)out['res_'+k]+=e.res[k];}
 const ev=r.events;out.dem=ev.filter(x=>x.k==='dem'&&x.ok).length;out.done=ev.filter(x=>x.k==='done').length;
 out.paidMin=ev.filter(x=>x.k==='q'&&x.ok).length;return out;}
const [a,b]=process.argv.slice(2,4);const seeds=process.argv.slice(4);const tot={};
for(const s of seeds){const A=sum(a.replace('S',s)),B=sum(b.replace('S',s));const line=[];for(const k of Object.keys(A)){tot[k]=tot[k]||[0,0];tot[k][0]+=A[k];tot[k][1]+=B[k];}
 console.log(s,['crit','food','techs','ships','power','cols','dem','done','inc_min','inc_ala','inc_ara','inc_ene','inc_tuk'].map(k=>k+' '+(+A[k].toFixed(1))+'→'+(+B[k].toFixed(1))).join(' | '));}
console.log('TOTAL',Object.entries(tot).map(([k,[x,y]])=>k+' '+(+x.toFixed(0))+'→'+(+y.toFixed(0))).join(' | '));
