'use strict';
/* 95E — task orchestration only. startStruct/structTick remain the sole payer
   and builder. No escrow/refund ledger, no second movement or camera engine. */
const RemoteConstruction = {
  queueLimit:16, historyLimit:128, retryLimit:4, routeBudget:4,
  labels:{queued:'Sırada',travel:'Yolda',waiting:'Bekliyor',building:'İnşa ediliyor',done:'Tamamlandı',failed:'Başarısız',cancelled:'İptal edildi',lost:'Gemi kaybedildi'},
  empty(){return {v:1,next:1,queues:{},history:[],metrics:{ordered:0,started:0,completed:0,failed:0,aiOrdered:0,aiStarted:0,aiCompleted:0,routeSearches:0},aiBuilders:[]};},
  state(){return G.construction||(G.construction=this.empty());},
  tasks(f){return this.state().queues[f.id]||[];},
  known(e,s){return s&&(e.id===0?pSeen(s):s.seen.includes(e.id));},
  route(e,f,s,from){
    const ctx=explorationContext(e);
    // Construction orders never use the unexplored frontier.
    ctx.frontier=new Set(ctx.known);const probe={...f,sys:from,mv:null};
    return explorationPath(explorationGraph(e,probe,ctx),s.id);
  },
  gate(f,sid,key,{route=true,from}={}){
    const no=why=>({ok:false,why}),e=f&&G.emps[f.e],s=G.sys[sid];
    if(!f||!G.fleets.includes(f)||!e||e.dead||!f.ships.some(sh=>sh.c==='ins'))return no('Geçerli inşaat gemisi yok');
    if(!this.known(e,s))return no('Hedef keşfedilmedi');
    if(!Object.hasOwn(STRUCTS,key)||!structAllowed(e,s,key))return no('Yapı, sahiplik, araştırma veya hak iddiası koşulu uygun değil');
    if(Object.values(this.state().queues).flat().some(t=>t.system===sid&&t.key===key&&t.state!=='building'))return no('Bu yapı için zaten bir görev var');
    const cost=structCost(e,key),afford=Object.keys(cost).every(k=>(e.res[k]||0)>=cost[k]);
    if(!afford)return no('Kaynaklar yetersiz');
    const start=from??(f.mv?f.mv.to:f.sys),path=route?this.route(e,f,s,start):null;
    if(route&&!path)return no('Güvenli, ikmalli ve erişilebilir rota yok');
    return {ok:true,cost,path,why:'Kaynaklar varışta, inşaat başladığında harcanır'};
  },
  enqueue(f,sid,key){
    const st=this.state(),list=this.tasks(f);if(list.length>=this.queueLimit)return {ok:false,why:'Gemi başına en çok 16 görev'};
    const last=list.at(-1),from=last?.system??(f.mv?f.mv.to:f.sys),q=this.gate(f,sid,key,{from});if(!q.ok)return q;
    const t={id:st.next++,fleet:f.id,empire:f.e,system:sid,systemName:String(G.sys[sid].name).slice(0,120),key,state:'queued',born:G.day,attempts:0,next:G.day,why:'Sırada; kaynaklar henüz harcanmadı'};
    (st.queues[f.id]||(st.queues[f.id]=[])).push(t);st.metrics.ordered++;if(G.emps[f.e].ai){st.metrics.aiOrdered++;if(!st.aiBuilders.includes(f.id))st.aiBuilders.push(f.id);if(st.aiBuilders.length>1024)st.aiBuilders.shift();}
    return {ok:true,task:t};
  },
  finish(f,t,state,why){
    const st=this.state();t.state=state;t.why=why;t.finished=G.day;
    const list=st.queues[t.fleet]||[],i=list.indexOf(t);if(i>=0)list.splice(i,1);if(!list.length)delete st.queues[t.fleet];
    st.history.push(t);if(st.history.length>this.historyLimit)st.history.shift();
    if(state==='done'){st.metrics.completed++;if(G.emps[t.empire]?.ai)st.metrics.aiCompleted++;}
    if(state==='failed'||state==='lost')st.metrics.failed++;
    if(t.empire===0){say('İnşaat görevi · '+STRUCTS[t.key].n+' · '+t.systemName+' — '+why,state==='done'?'win':'');
      recordNews({category:'construction',scope:'player',empires:[0],system:t.system,key:'construction:'+t.id,title:STRUCTS[t.key].n+' — '+this.labels[state],text:why});}
  },
  completed(sys,w){
    const st=this.state(),t=Object.values(st.queues).flat().find(t=>t.id===w.remoteTask),f=t&&G.fleets.find(f=>f.id===t.fleet);
    if(t){this.finish(f,t,'done','Yapı tamamlandı');return;}
    const old=st.history.find(t=>t.id===w.remoteTask);if(old?.state==='done')return;
    st.metrics.completed++;if(G.emps[w.e]?.ai)st.metrics.aiCompleted++;
    if(old){if(old.state==='lost')st.metrics.failed=Math.max(0,st.metrics.failed-1);old.state='done';old.finished=G.day;old.why='Gemi kaybından sonra mevcut yapı motorunda tamamlandı';}
  },
  cancel(f,id){const t=this.tasks(f).find(t=>t.id===+id);if(!t)return {ok:false,why:'Görev yok'};if(t.state==='building')return {ok:false,why:'İnşaat başladı; maliyet ödendi ve mevcut yapı motorunda tamamlanacak'};
    if(this.tasks(f)[0]===t&&t.state==='travel')f.path=f.mv?[f.mv.to]:[];this.finish(f,t,'cancelled','İptal edildi; kaynak harcanmadı');return {ok:true};},
  manual(f){for(const t of this.tasks(f).slice())if(t.state!=='building')this.finish(f,t,'cancelled','Manuel hareket emri görevin yerini aldı; kaynak harcanmadı');},
  retry(f,t,why){t.attempts++;if(t.attempts>=this.retryLimit){this.finish(f,t,'failed',why+'; dört sınırlı denemeden sonra durduruldu');return;}t.state='waiting';t.why=why;t.next=G.day+[5,10,20][t.attempts-1];},
  tick(){
    const st=this.state();let budget=this.routeBudget;
    for(const fid of Object.keys(st.queues)){
      const list=st.queues[fid],f=G.fleets.find(f=>f.id===+fid),t=list[0];if(!t)continue;
      if(!f||!f.ships.some(s=>s.c==='ins')){for(const x of list.slice())this.finish(null,x,'lost','Gemi kaybedildi; başlanmış yapı mevcut motorla devam eder');continue;}
      const e=G.emps[f.e],s=G.sys[t.system];
      if(t.state==='building'){
        if(s?.work?.some(w=>w.remoteTask===t.id&&w.e===f.e))continue;
        this.finish(f,t,s?.built?.[t.key]===f.e?'done':'failed',s?.built?.[t.key]===f.e?'Yapı tamamlandı':'Başlanmış yapı artık mevcut değil');continue;
      }
      if(f.combat||f.building!==undefined||f.ships.some(s=>s.busy!==undefined)){t.why='Gemi savaşta veya mevcut inşaatla meşgul';continue;}
      if(t.next>G.day)continue;
      if(!s||!this.known(e,s)||!structAllowed(e,s,t.key)){this.finish(f,t,'failed','Hedef, sahiplik, araştırma veya yapı koşulları değişti; kaynak harcanmadı');continue;}
      if(t.state==='travel'&&(f.path.length||f.mv)){
        // Validate known threats before every next leg. Active legs cannot teleport.
        const ctx=explorationContext(e);let from=f.mv?f.mv.to:f.sys;
        const unsafe=f.path.filter(id=>!f.mv||id!==f.mv.to).some(id=>{const bad=!ctx.known.has(id)||explorationBlock(e,f,id,ctx,from);from=id;return bad;});
        if(unsafe){f.path=f.mv?[f.mv.to]:[];this.retry(f,t,'Rotada yeni tehdit, erişim veya ikmal engeli');}continue;
      }
      if(f.mv||f.path.length){t.why='Önce mevcut manuel rota tamamlanacak';continue;}
      if(f.sys===t.system){
        if(!startStruct(e,s,t.key,f)){this.retry(f,t,'Varışta kaynak veya inşaat koşulları sağlanamadı');continue;}
        const w=s.work.find(w=>w.key===t.key&&w.e===e.id);w.remoteTask=t.id;t.state='building';t.why='Maliyet bir kez ödendi; mevcut yapı motoru çalışıyor';st.metrics.started++;if(e.ai)st.metrics.aiStarted++;continue;
      }
      if(budget<=0)continue;budget--;st.metrics.routeSearches++;
      const path=this.route(e,f,s,f.sys);
      if(!path||!orderMove(f,s.id,false,true,path)){this.retry(f,t,'Güvenli, ikmalli ve erişilebilir rota yok');continue;}
      t.state='travel';t.why='Güvenli rota · '+path.length+' atlama';
    }
  },
  restore(raw){
    const st=this.empty(),ids=new Set(),parse=t=>{
      if(!t||!Number.isSafeInteger(t.id)||t.id<1||ids.has(t.id)||!Number.isInteger(t.fleet)||!Number.isInteger(t.empire)||!Number.isInteger(t.system)||!G.sys[t.system]||!Object.hasOwn(STRUCTS,t.key)||!Object.hasOwn(this.labels,t.state))return null;
      ids.add(t.id);return {id:t.id,fleet:t.fleet,empire:t.empire,system:t.system,systemName:String(t.systemName||G.sys[t.system].name).slice(0,120),key:t.key,state:t.state,born:Number.isFinite(t.born)?t.born:G.day,attempts:Math.min(4,Math.max(0,t.attempts|0)),next:Number.isFinite(t.next)?Math.min(t.next,G.day+20):G.day,why:String(t.why||'').slice(0,300),...(Number.isFinite(t.finished)?{finished:t.finished}:{})};
    };
    if(raw?.v===1){
      for(const [fid,list] of Object.entries(raw.queues||{}).slice(0,1024)){
        if(!/^\d+$/.test(fid)||!Array.isArray(list))continue;const tasks=list.slice(0,this.queueLimit).map(parse).filter(t=>t&&String(t.fleet)===fid&&['queued','travel','waiting','building'].includes(t.state));if(tasks.length)st.queues[fid]=tasks;
      }
      st.history=(Array.isArray(raw.history)?raw.history:[]).slice(-this.historyLimit).map(parse).filter(t=>t&&!['queued','travel','waiting','building'].includes(t.state));
      for(const k of Object.keys(st.metrics))if(Number.isSafeInteger(raw.metrics?.[k])&&raw.metrics[k]>=0)st.metrics[k]=raw.metrics[k];
      st.aiBuilders=(Array.isArray(raw.aiBuilders)?raw.aiBuilders:[]).filter(Number.isSafeInteger).slice(-1024);
    }
    st.next=Math.max(1,Number.isSafeInteger(raw?.next)?raw.next:1,...[...ids].map(id=>id+1));G.construction=st;
  }
};
