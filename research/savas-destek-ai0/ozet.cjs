// node ozet.cjs <dizin> <kontrolKol> <adayKol>  — SAVAŞ-DESTEK-AI.0 kampanya özeti: her yapılandırma için kontrol ↔ aday satırı + ilk ayrışma ayı.
const fs=require('fs'),path=require('path');const [dir,ca,cb]=process.argv.slice(2);
const files=fs.readdirSync(dir).filter(f=>f.endsWith('-'+ca+'.json'));const rows=[];
const sum=r=>{const jf=r.fin.joinedFronts||[];return {wars:r.wars.length,aiOff:r.wars.filter(w=>w.ai&&!w.support).length,supWars:r.wars.filter(w=>w.support).length,asks:r.asks.length,askOk:r.asks.filter(a=>a.applied).length,
  askTo:[...new Set(r.asks.map(a=>a.other))].length,warJoinDeals:r.joins.length,opp:r.opp.length,resp:Object.entries(r.resp).map(([k,v])=>k+'×'+v).join(' ')||'—',
  joined:jf.length,passive:jf.filter(x=>x.passive).length,jDes:jf.reduce((n,x)=>n+x.destroyed,0),jLost:jf.reduce((n,x)=>n+x.lost,0),jSys:jf.reduce((n,x)=>n+x.sys,0),
  warMonths:r.monthsWar.reduce((a,b)=>a+b,0),dead:r.fin.em.filter(e=>e.dead).length,colLost:r.fin.em.reduce((n,e)=>n+Math.max(0,e.col0-e.col),0),cols:r.fin.em.reduce((n,e)=>n+e.col,0),feds:r.fin.feds.join('/'),sec:r.sec};};
for(const f of files.sort()){const key=f.slice(0,-(ca.length+6)),fb=path.join(dir,key+'-'+cb+'.json');if(!fs.existsSync(fb))continue;
 const A=JSON.parse(fs.readFileSync(path.join(dir,f))),B=JSON.parse(fs.readFileSync(fb));const d=B.hashes.findIndex((x,i)=>x!==A.hashes[i]);
 rows.push({key,first:d<0?'yok':(d+1)+'. ay',a:sum(A),b:sum(B)});}
const cols=['wars','aiOff','supWars','asks','askTo','warJoinDeals','opp','joined','passive','jDes','jLost','jSys','warMonths','dead','colLost','cols','feds','sec'];
console.log('| yapılandırma | kol | ilk ayrışma | '+cols.join(' | ')+' | aiRespond warJoin |');console.log('|'+'---|'.repeat(cols.length+4));
for(const r of rows)for(const [k,s] of [[ca,r.a],[cb,r.b]])console.log(`| ${r.key} | ${k} | ${k===cb?r.first:''} | `+cols.map(c=>s[c]).join(' | ')+` | ${s.resp} |`);
