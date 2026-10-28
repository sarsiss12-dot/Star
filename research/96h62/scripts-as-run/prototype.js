/* Read-only 96H.6.2 prototype. Frozen current production factors; real paid
   serial completion, current contracts and purchase wallets. No game cloning. */
function ecoPrefix62(e,s,p,valid){
 const q=p.col.q;try{p.col.q=valid;return aiBuildingDelta(e,s,p,null,true);}finally{p.col.q=q;}
}
function ecoFrame62(e){
 const keys=['ene','min','yiy','tuk','ala','ara','etk'],horizon=6,day=G.day,first=(Math.floor(day/30)+1)*30;
 const income=empireIncome({...e,_trAt:-1,_trCache:null},false),raw=Array.from({length:horizon},()=>({...income})),refunds=Array.from({length:horizon},()=>({})),jobs=[],colonies=[];
 for(const c of e.colonies){const s=G.sys[c.s],p=s?.planets[c.p];if(!p?.col||p.owner!==e.id)continue;let delay=0,prev={},valid=[],b={...p.col.b};
  for(let i=0;i<(p.col.q||[]).length;i++){
   const q=p.col.q[i];delay+=Math.max(.5,Math.ceil(q.left/.5)*.5);const finish=day+delay,index=Math.max(0,Math.ceil((finish-first)/30));
   const possible=q.dem?(b[q.key]||0)>0:BUILDINGS[q.key]&&(b[q.key]||0)<BUILDINGS[q.key].max&&colonyUsed({b})<colonySlots(p.col,e,p);
   jobs.push({s:s.id,p:p.i,index:i,key:q.key,dem:!!q.dem,finish,productionMonth:Math.ceil(finish/30),possible:!!possible});
   if(possible){valid.push(q);b[q.key]=Math.max(0,(b[q.key]||0)+(q.dem?-1:1));}
   if(index>=horizon)continue;
   const next=ecoPrefix62(e,s,p,valid);
   for(let m=index;m<horizon;m++)for(const r of keys)raw[m][r]=(raw[m][r]||0)+(next[r]||0)-(prev[r]||0);
   const refund=possible&&q.dem?q.refund:!possible&&!q.dem?q.paid:null;
   for(const r in refund||{})refunds[index][r]=(refunds[index][r]||0)+refund[r];prev=next;
  }
  colonies.push({s:s.id,p:p.i,delay,valid,b});
 }
 const up=Math.max(.1,1+(e.mods.upMul||0)),peace=!Object.values(e.war||{}).some(Boolean);
 for(const s of G.sys)for(const q of s.queue||[])if(q.e===e.id&&SHIPS[q.cls])for(const row of raw){row.ene-=SHIPS[q.cls].up*up*(hasCivic(e,'mobilize')&&peace?2:1);row.ala-=(SHIPS[q.cls].upA||0)*up;}
 const freight=Array.from({length:horizon},()=>({}));
 for(const c of G.commerce?.contracts||[])if(!Commerce.closed(c)){
  let due=Math.max(day+.5,c.next),every=c.legs[0]?.every||30;
  for(;due<Math.min(c.until,first+(horizon-1)*30+.00001);due+=every){const index=Math.max(0,Math.ceil((due-first)/30));if(index>=horizon)break;for(const l of c.legs)if(l.e===e.id)freight[index][l.r]=(freight[index][l.r]||0)+l.v;}
 }
 return {keys,horizon,day,first,income,raw,refunds,freight,jobs,colonies,committed:aiConstructionCommitment(e)};
}
function ecoRate62(e,raw,at){
 const net=aiFedBudget(e,raw).net,c=vassalContractOf(e),tax=c&&c.expires!==null&&at>=c.expires?{}:aiVassalBudget(e,raw);
 for(const r in tax)net[r]=(net[r]||0)-tax[r];return net;
}
function ecoPath62(e,frame,action=null){
 const {keys,horizon,first}=frame,stocks=Object.fromEntries(keys.map(r=>[r,(e.res[r]||0)-(frame.committed[r]||0)-(action?.cost?.[r]||0)])),rows=[],min={...stocks},empty={};
 let finish=null,index=horizon,delta={};
 if(action){const s=G.sys[action.s],p=s.planets[action.p],key=action.key,delay=(p.col.q||[]).reduce((n,q)=>n+Math.max(.5,Math.ceil(q.left/.5)*.5),0);finish=frame.day+delay+(action.dem?demolishDays(e,key):buildDays(e,key));index=Math.max(0,Math.ceil((finish-first)/30));
  const q=p.col.q,valid=frame.colonies.find(c=>c.s===s.id&&c.p===p.i).valid;try{p.col.q=valid;const base=aiBuildingDelta(e,s,p,null,true),whole=aiBuildingDelta(e,s,p,key,true,action.dem?-1:1);for(const r of keys)delta[r]=(whole[r]||0)-(base[r]||0);}finally{p.col.q=q;}
 }
 for(let m=0;m<horizon;m++){
  const at=first+m*30,raw={...frame.raw[m]};if(m>=index)for(const r of keys)raw[r]=(raw[r]||0)+(delta[r]||0);
  const net=ecoRate62(e,raw,at),start={...stocks};for(const r of keys){stocks[r]+=(net[r]||0)+(frame.refunds[m][r]||0)-(frame.freight[m][r]||0);if(action?.dem&&m===index)stocks[r]+=demolishRefund(action.key)[r]||0;min[r]=Math.min(min[r],stocks[r]);if(stocks[r]<0&&empty[r]===undefined)empty[r]=m+1;}
  rows.push({month:Math.round(at/30),start,net,freight:frame.freight[m],refund:frame.refunds[m],end:{...stocks}});
 }
 return {action,finish,firstProductionMonth:finish===null?null:Math.ceil(finish/30),rows,min,empty,last:{...stocks},terminal:rows.at(-1).net,shortage:Object.fromEntries(keys.map(r=>[r,rows.filter(x=>x.end[r]<0).length]))};
}
