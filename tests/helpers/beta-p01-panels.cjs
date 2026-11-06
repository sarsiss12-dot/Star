'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
module.exports=async(p,out,label,advance)=>{
 const rows=[];
 const record=()=>fs.writeFileSync(path.join(out,label+'-transitions.json'),JSON.stringify(rows,null,2));
 const open=async(action,x)=>{
  await p.evaluate(()=>{UI.closeModal();$('diploPane').classList.remove('show');});
  const menu=p.locator('#outEmp');if(!await menu.evaluate(e=>e.classList.contains('open')))await p.locator('[data-a="grpTog"][data-x="emp"]').tap({timeout:8000});
  await p.locator('#outEmp [data-a="'+action+'"]'+(x?'[data-x="'+x+'"]':'')).first().tap({timeout:8000});
 };
 for(const [action,x] of [['diploPane',null],['globalPane','bilim'],['globalPane','imp'],['globalPane','ekonomi'],['fedPane',null],['marketPane',null],['tab','intel'],['news',null]]){
  await p.evaluate(()=>UI.openCouncil());
  await open(action,x);
  const row=await p.evaluate(([action,x])=>{const pane=$('diploPane');const before={head:pane.querySelector('.dpHd')?.textContent,key:pane._surfaceKey,html:pane.innerHTML,modal:$('modal').innerHTML};return {action,x,beforeHead:before.head,beforeKey:before.key,modal:before.modal};},[action,x]);
  if(advance)await advance();else await p.evaluate(()=>{if(G.council)G.council.voteIn-=1;});await p.evaluate(()=>UI.tick());
  await p.waitForTimeout(350);
  Object.assign(row,await p.evaluate(()=>{const pane=$('diploPane');return {afterHead:pane.querySelector('.dpHd')?.textContent,afterKey:pane._surfaceKey,stolen:pane.classList.contains('show')&&pane.querySelector('.dpHd')?.textContent.includes('GALAKTİK KONSEY'),modalAfter:$('modal').innerHTML};}));row.modalUnchanged=row.modal===row.modalAfter;delete row.modal;delete row.modalAfter;
  rows.push(row);record();assert.equal(row.stolen,false,label+' '+action+':'+x+' became Council');assert(row.modalUnchanged);
 }
 // Explicit Council request still works, and a queued automatic update cannot replace a later page.
 await p.evaluate(()=>{UI.closeModal();UI.openCouncil();});assert(await p.locator('#diploPane .dpHd').innerText().then(s=>s.includes('GALAKTİK KONSEY')));
 await p.evaluate(()=>{UI._surfaceUntil=Date.now()+500;UI.surfaceRender($('diploPane'),$('diploPane').innerHTML+'<span>queued Council update</span>','council',true);UI.openScience();});
 await p.waitForTimeout(300);assert(await p.locator('#diploPane .scienceBox').count(),'old deferred Council render must be invalidated');
 return rows;
};
