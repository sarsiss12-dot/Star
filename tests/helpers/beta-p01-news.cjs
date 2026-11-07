'use strict';
const assert=require('assert/strict'),path=require('path');
module.exports=async(p,out)=>{
 const ids=await p.evaluate(()=>{UI.closeModal();for(const e of G.emps){e.war={};e.ally={};e.wg={};e.civics=[];e.mizac=e.persLock='yayilmaci';delete e._pers;delete e._prof;}G.news=GalacticNews.empty();G.warLedger=warLedgerEmpty();const e=G.p,o=G.emps[1];e.contact[1]=o.contact[e.id]=true;e.war[1]=o.war[e.id]=true;G.day=60;G.year=2210;G.month=3;const old=warLedgerOpen(e.id,1),r=G.news.records.find(r=>r.key==='war-front:'+old.id);G.day=90;if(!makePeace(e,o))throw Error('news fixture peace gate rejected');G.day=120;e.war[1]=o.war[e.id]=true;const newer=warLedgerOpen(e.id,1);if(newer.id===old.id)throw Error('news fixture reused the old front');const n=G.news.records.find(r=>r.key==='war-front:'+newer.id);const legacy=recordNews({category:'war',empires:[e.id,1],key:'legacy-unbound',title:'Eski savaş haberi',text:'Başlangıç ayrıntısı kaydedilmemiş'});return {old:r.id,current:n.id,legacy:legacy.id};});
 const rows=[];
 for(const [type,id,expect] of [['old',ids.old,'SONA ERDİ'],['current',ids.current,'AKTİF'],['legacy',ids.legacy,'kesin savaş durumu / bitiş tarihi bilinmiyor']]){
  await p.evaluate(()=>ArchiveUI.open('news'));await p.locator('[data-a="newsDetail"][data-x="'+id+'"]').tap({timeout:8000});const text=await p.locator('#modal').innerText();require('fs').writeFileSync(path.join(out,'news-'+type+'-text.txt'),text);assert(text.includes('SAVAŞ DURUMU'));assert(text.includes(expect));await p.screenshot({path:path.join(out,'news-'+type+'.png')});rows.push({type,expect,status:'PASS'});await p.locator('#modal .mhd [data-a="closem"]').tap({timeout:8000});
 }return rows;
};
