'use strict';
const assert=require('assert/strict'),path=require('path'),fs=require('fs');
module.exports=async(p,out)=>{
 const rows=await require('./beta-p01-news.cjs')(p,out);
 const records=await p.evaluate(()=>{UI.closeModal();const peace=G.news.records.find(r=>/^war-end:/.test(r.key));const a=[{type:'peace',id:peace.id,title:peace.title}];
 for(const type of ['council','federation','politics','colony','territory','construction']){const r=recordNews({category:type,scope:'player',empires:[G.p.id],key:'p02:'+type,title:'P02 '+type,text:'Bu olayın kendi güvenli tarihsel ayrıntısı; kaydedilmemiş filo kimliği bilinmiyor.'});a.push({type,id:r.id,title:r.title,key:r.key});}return a;});
 for(const r of records){await p.evaluate(()=>{UI.closeModal();UI.openDiplo();ArchiveUI.open('news');});await p.locator('[data-a="newsDetail"][data-x="'+r.id+'"]').tap({timeout:8000});const text=await p.locator('#modal').innerText();assert(text.includes(r.title));if(r.type==='peace')assert(text.includes('SAVAŞ DURUMU')&&text.includes('SONA ERDİ'));else assert(text.includes(r.key));
 await p.screenshot({path:path.join(out,'p02-news-'+r.type+'.png')});fs.writeFileSync(path.join(out,'p02-news-'+r.type+'.txt'),text);await p.locator('#modal [data-a="news"]').last().tap({timeout:8000});assert(await p.locator('#archiveRows').count());rows.push({type:r.type,status:'PASS',event:r.key||'war-end:1'});}
 return rows;
};
