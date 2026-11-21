'use strict';
/* Physical shipments share one loading, movement, loss and delivery ledger. */
const Commerce={
 resources:['ene','min','yiy','ala','tuk'],maxContracts:128,maxPerEmpire:12,maxConvoys:256,historyLimit:256,speed:18,prepareDays:2,waitLimit:180,
 labels:{active:'Aktif',waiting:'Bekliyor',blocked:'Engellendi',expired:'Sona erdi',cancelled:'İptal edildi',preparing:'Hazırlanıyor',moving:'Seyahat ediyor',attacked:'Saldırı altında',delivered:'Teslim edildi',destroyed:'İmha edildi',raided:'Yağmalandı'},
 empty(){return {v:1,nextContract:1,nextConvoy:1,contracts:[],convoys:[],stats:{},aiAt:{},dispatchDay:-1,clock:null,visible:true};},
 state(){return G.commerce||(G.commerce=this.empty());},
 terminal(c){return ['delivered','destroyed','raided'].includes(c.status);},
 closed(c){return ['expired','cancelled'].includes(c.status);},
 stats(id){const s=this.state();return s.stats[id]||(s.stats[id]={loaded:{},sent:{},received:{},lost:{},destroyed:{},plundered:{},lootReceived:{},deliveries:0,lastDay:null});},
 add(id,key,r,n){const s=this.stats(id);s[key][r]=(s[key][r]||0)+n;},
 known(e,s){return !!s&&(e.id===0?pSeen(s):(s.seen||[]).includes(e.id));},
 port(e,id){return !!e&&!e.dead&&G.sys[id]?.planets.some(p=>p.owner===e.id&&p.col?.b?.liman>0);},
 pairGate(a,b,once=false){if(!a||!b||a===b||a.dead||b.dead||a.wild||b.wild||a.crisisSide||b.crisisSide)return 'Taraflardan biri geçerli değil';if(a.war[b.id]||b.war[a.id])return 'Savaş nedeniyle ticaret kapalı';if(!a.contact?.[b.id]||!b.contact?.[a.id]||diploBlocked(a,b))return 'Diplomatik temas kapalı';if(tradeBlocked(a,b))return 'Ambargo / ticari yaptırım';if(!once&&(!a.pact?.[b.id]||!b.pact?.[a.id]))return 'Genel ticaret anlaşması yok';return null;},
 key(a,b){return a<b?a+'_'+b:b+'_'+a;},
 // Each autonomous sender assesses its own known hazards. No partner's
 // private fleets/treasury are consulted and unknown pirates remain a risk.
 aiHazards(e){
  const cached=this._aiHazardScope?.get(e.id);if(cached)return cached;
  const view=aiView(e),risk=new Set(view.ctx.pirates);
  for(const f of G.fleets){const at=f.mv?f.mv.to:f.sys;if(f.e!==e.id&&f.ships.length&&isArmed(f)&&hostile(e.id,f.e)&&view.ctx.visible.has(at))risk.add(at);}
  this._aiHazardScope?.set(e.id,risk);return risk;
 },
 portRight(owner,carrier,grants){
  if(owner===carrier)return true;
  if(!owner||owner.dead||!carrier.contact?.[owner.id]||owner.war[carrier.id]||carrier.war[owner.id]||
     diploBlocked(owner,carrier)||embargoOn(owner,carrier.id)||embargoOn(carrier,owner.id))return false;
  if(owner.portTransit?.[carrier.id]>G.day||grants?.has(owner.id+':'+carrier.id))return true;
  const f=findFed(carrier);
  return !!(f?.laws?.ticaret&&f.members.includes(owner.id));
 },
 identifiedPort(viewer,s,owner){
  return viewer===owner||!!owner&&this.known(viewer,s)&&(intelOf(viewer,owner.id)>=2||
   (viewer===G.p?pVis(s):aiView(viewer).ctx.visible.has(s.id)));
 },
 relay(a,s,grants){
  return !(s.cr>0)&&s.planets.some(p=>p.col?.b?.liman>0&&this.identifiedPort(a,s,G.emps[p.owner])&&this.portRight(G.emps[p.owner],a,grants));
 },
 openEdge(a,b,from,to){
  const s=G.sys[to];
  return !!s&&G.sys[from]?.lanes.includes(to)&&!(s.cr>0)&&this.known(a,s)&&this.known(b,s)&&
   !(s.owner>=0&&(a.war[s.owner]||b.war[s.owner]));
 },
 route(a,b,source,target,{inFlight=false,avoidObserved=false,initialHops=0,initialPort=source,grants,volume=0}={}){
  if(!G.sys[source]||!G.sys[target]||source===target||initialHops>3)return null;
  if(!inFlight&&(!this.identifiedPort(a,G.sys[target],b)||!this.identifiedPort(b,G.sys[source],a)))return null;
  const risk=avoidObserved?this.aiHazards(a):null;
  if(risk?.has(source)||!inFlight&&G.raids?.[this.key(source,target)]>G.day)return null;
  // Positive travel times. A system reached with fuel for another leg is a distinct state.
  const queue=[],best=new Map(),relays=new Map();
  const enqueue=(id,hops,cost,parent,origin)=>{
   const key=volume?(origin*G.sys.length+id)*4+hops:id*4+hops;
   if(cost>=(best.get(key)??Infinity))return;
   best.set(key,cost);
   const row={id,hops,cost,parent,key,origin};let lo=0,hi=queue.length;
   while(lo<hi){const mid=(lo+hi)>>1,q=queue[mid];if(q.cost>cost||q.cost===cost&&q.id>id)lo=mid+1;else hi=mid;}
   queue.splice(lo,0,row);
  };
  enqueue(source,initialHops,0,null,initialPort);
  while(queue.length){
   const row=queue.pop();
   if(best.get(row.key)!==row.cost)continue;
   if(row.id===target){const path=[];for(let r=row;r;r=r.parent)path.push(r.id);return path.reverse();}
   if(row.hops>=3)continue;
   const s=G.sys[row.id];
   for(const id of s.lanes){
    if(!this.openEdge(a,b,s.id,id)||risk?.has(id))continue;
    let repeat=false;for(let r=row;r;r=r.parent)if(r.id===id){repeat=true;break;}
    if(repeat)continue;
    const n=G.sys[id];
    if(!relays.has(id))relays.set(id,this.relay(a,n,grants));
    const days=row.cost+Math.max(1,dist(s,n)/this.speed);
    const fits=!volume||id!==target&&!relays.get(id)||routeVolume(a,row.origin,id)>=volume;
    if(id===target&&!fits)continue;
    const stop=id!==target&&relays.get(id)&&fits;
    enqueue(id,stop?0:row.hops+1,days,row,stop?id:row.origin);
    if(stop&&volume&&row.hops<2)enqueue(id,row.hops+1,days,row,row.origin);
   }
  }
  return null;
 },
 legGate(a,b,it,{stock=false,once=false,pact=false,grants,live=false}={}){
  const why=this.pairGate(a,b,once||pact);if(why)return why;
  if(!this.resources.includes(it.r)||!Number.isFinite(it.v)||it.v<=0||it.v>1000)return 'Geçersiz kargo kaynağı / miktarı (1–1000)';
  if(!Number.isInteger(it.source)||!Number.isInteger(it.target)||!this.port(a,it.source)||!this.port(b,it.target)||it.source===it.target)return 'Çıkış veya varış limanı geçerli değil';
  if(G.sys[it.source].cr>0||G.sys[it.target].cr>0)return 'Ticaret limanı aktif çatışma / abluka altında';
  if(!Number.isInteger(it.every)||it.every<30||it.every>180||!Number.isInteger(it.months)||it.months<3||it.months>120)return 'Sıklık 30–180 gün, süre 3–120 ay olmalı';
  if(it.v>routeVolume(a,it.source,it.target))return 'Sefer miktarı yol kapasitesini aşıyor';
  if(!(live||grants?.size?this.route(a,b,it.source,it.target,{grants,volume:it.v}):this.aiQuoteRoute(a,b,it.source,it.target,it.v)))return 'Limanlar arasında üç sıçrama içinde açık ve izinli bağlantı bulunamadı';
  if(stock&&(!Number.isFinite(a.res[it.r])||a.res[it.r]<it.v))return 'İlk sefer için depoda yeterli '+RES[it.r].n+' yok';return null;
 },
 signature(n){return JSON.stringify([n.from,n.to,n.give,n.want]);},
 // Produce the same transport obligations for preview and commit. Project only rights in this offer.
 freightPlan(n){
  const a=G.emps[n.from],b=G.emps[n.to],st=this.state(),legs=[],grants=new Set();
  const sides=[[a,b,n.effectiveGive||n.give],[b,a,n.effectiveWant||n.want]];
  const all=sides.flatMap(x=>x[2]),once=!all.some(i=>i.t==='freight');
  for(const [from,to,items] of sides)if(items.some(i=>i.t==='portTransit'))grants.add(from.id+':'+to.id);
  if(!once&&all.some(i=>!['freight','portTransit','pact'].includes(i.t)))return {why:'Düzenli sözleşmeye yalnız sevkiyat, ticaret anlaşması ve liman izni eklenebilir'};
  for(const [from,to,items] of sides){
   const goods=items.filter(i=>once?i.t==='res'&&this.resources.includes(i.r):i.t==='freight');
   if(!goods.length)continue;
   if(!once){for(const it of goods)legs.push({...it,e:from.id,to:to.id});continue;}
   const gate=this.pairGate(from,to,true);if(gate)return {why:gate};
   const amount=goods.reduce((sum,i)=>sum+i.v,0);
   let best=null;
   for(const source of tradeHubs(from))for(const target of tradeHubs(to)){
    if(source===target||G.sys[source].cr>0||G.sys[target].cr>0||amount>routeVolume(from,source,target))continue;
    const path=this.route(from,to,source,target,{grants,volume:amount});if(!path)continue;
    const cost=path.slice(1).reduce((sum,id,i)=>sum+Math.max(1,dist(G.sys[path[i]],G.sys[id])/this.speed),0);
    if(!best||cost<best.cost||cost===best.cost&&(source<best.source||source===best.source&&target<best.target))best={source,target,cost};
   }
   if(!best)return {why:'Tek seferlik yük için yeterli kapasiteli, açık ve izinli liman hattı yok'};
   for(const it of goods)legs.push({...it,source:best.source,target:best.target,e:from.id,to:to.id,every:30,months:3});
  }
  if(!once){
   const [x,y]=legs;
   if(legs.length!==2||x.e===y.e||x.source!==y.target||x.target!==y.source||x.every!==y.every||x.months!==y.months||x.r===y.r)return {why:'İki karşı seferin limanları, sıklığı ve süresi eşleşmeli'};
  }
  if(!legs.length)return {legs,once};
  const active=st.contracts.filter(c=>!this.closed(c));
  if(active.length>=this.maxContracts||[a,b].some(e=>active.filter(c=>c.a===e.id||c.b===e.id).length>=this.maxPerEmpire))return {why:'Aktif sözleşme sınırı dolu'};
  for(const l of legs){
   const from=G.emps[l.e],why=this.legGate(from,G.emps[l.to],l,{stock:true,once,grants,pact:all.some(i=>i.t==='pact')});if(why)return {why};
   const onLine=i=>i.e===l.e&&i.source===l.source&&i.target===l.target;
   const used=active.flatMap(c=>c.legs).concat(legs).filter(onLine).reduce((sum,i)=>sum+i.v*30/i.every,0);
   if(used>routeVolume(from,l.source,l.target)+1e-7)return {why:'Aylık hat kapasitesi dolu'};
  }
  if(st.contracts.some(c=>c.signature===this.signature(n)&&(!this.closed(c)||once&&G.day<c.born+30)))return {why:'Bu sevkiyat zaten imzalandı'};
  return {legs,once};
 },
 stops(a,path,grants){
  return path.filter((id,i)=>i===0||i===path.length-1||this.relay(a,G.sys[id],grants));
 },
 preview(a,b,source,target){
  const closed={open:false,stops:[],missing:[]};
  if(this.pairGate(a,b)||!this.port(a,source)||!this.port(b,target)||!this.identifiedPort(a,G.sys[target],b))return closed;
  const grants=new Set();let path=this.route(a,b,source,target);
  const open=!!path;
  if(!path){
   for(const e of G.emps)if(e!==a&&!e.dead&&a.contact[e.id])grants.add(e.id+':'+a.id);
   path=this.route(a,b,source,target,{grants});
   if(!path)return closed;
  }
  const missing=new Set();
  const stops=this.stops(a,path,grants).map((id,i,all)=>{
   if(i===0||i===all.length-1)return {id};
   const known=G.sys[id].planets.filter(p=>p.col?.b?.liman&&this.identifiedPort(a,G.sys[id],G.emps[p.owner]));
   const pl=known.find(p=>this.portRight(G.emps[p.owner],a))||known.find(p=>this.portRight(G.emps[p.owner],a,grants));
   if(!pl)return {id};
   if(!this.portRight(G.emps[pl.owner],a))missing.add(pl.owner);
   return {id,owner:pl.owner};
  });
  const days=2*this.prepareDays+path.slice(1).reduce((n,id,i)=>n+Math.max(1,dist(G.sys[id],G.sys[path[i]])/this.speed),0);
  return {open,stops,missing:[...missing],days:Math.ceil(days)};
 },
 remainingRoute(v,a,b){
  let hops=v.hops??v.step,origin=v.legSource??v.source;
  for(let i=v.step;i<v.route.length-1;i++){
   const here=G.sys[v.route[i]],next=v.route[i+1];
   if((i!==v.step||v.t===0)&&this.relay(a,here)&&routeVolume(a,origin,here.id)>=v.amount){hops=0;origin=here.id;}
   if(++hops>3||!this.openEdge(a,b,here.id,next)||next===v.target&&routeVolume(a,origin,next)<v.amount)return here;
  }
  return null;
 },
 quote(n){return this.freightPlan(n).why||null;},
 sign(n){
  const {legs,once,why}=this.freightPlan(n);if(why)throw Error(why);if(!legs.length)return;
  const st=this.state(),c={id:st.nextContract++,a:n.from,b:n.to,signature:this.signature(n),legs,
   born:G.day,until:G.day+(once?180:legs[0].months*30),next:G.day+this.prepareDays,cycle:0,status:'active',
   reason:'İmzalandı · ilk yükleme bekleniyor',delivered:{},lost:{},lastDelivery:null};
  if(once){c.once=true;if([n.give,n.want].some(items=>!items.length)&&n.give.concat(n.want).every(i=>i.t==='res'&&this.resources.includes(i.r)))c.gift=true;}
  st.contracts.push(c);return c;
 },
 cancel(id,actor){const c=this.state().contracts.find(c=>c.id===+id);if(!c||![c.a,c.b].includes(actor?.id)||this.closed(c))return {ok:false,why:'Sözleşme yok veya yetkin yok'};c.status='cancelled';c.reason='Yeni sefer yok; yoldaki yük geçerli limana teslim edilir. Anlaşma/liman kapalıysa en çok 180 gün bekler.';return {ok:true};},
 note(c,event){c.history=c.history||[];c.history.push({day:G.day,event});if(c.history.length>12)c.history.shift();},
 dispatch(c){
  const st=this.state();if(this.closed(c))return false;
  if(G.day>=c.until){c.status='expired';c.reason='Süre doldu; yeni sefer yok, yoldaki kargolar ayrı sonuçlanır';return false;}
  if(st.convoys.some(v=>v.contract===c.id&&!this.terminal(v))){c.status='waiting';c.reason='Önceki karşılıklı sefer tamamlanıyor';return false;}
  if(st.convoys.filter(v=>!this.terminal(v)).length+c.legs.length>this.maxConvoys){c.status='waiting';c.reason='256 aktif konvoy sınırı; yük depoda, sevkiyat bekliyor';return false;}
  const legs=[];
  for(const l of c.legs){
   const a=G.emps[l.e],b=G.emps[l.to],why=this.legGate(a,b,l,{stock:true,once:c.once});
   if(why){c.status='blocked';c.reason=why;return false;}
   const sameLine=i=>i.e===l.e&&i.source===l.source&&i.target===l.target;
   const used=st.convoys.filter(v=>sameLine(v)&&v.started>G.day-30).reduce((sum,v)=>sum+v.loaded,0);
   const pending=legs.filter(sameLine).reduce((sum,i)=>sum+i.v,0);
   if(used+pending+l.v>routeVolume(a,l.source,l.target)+1e-7){
    c.status='waiting';c.reason='Son 30 günlük rota kapasitesi dolu; yük depoda bekliyor';return false;
   }
   const path=this.route(a,b,l.source,l.target,{avoidObserved:true,volume:l.v})||this.route(a,b,l.source,l.target,{volume:l.v});
   if(!path){c.status='blocked';c.reason='Yüklemede liman erişimi değişti';return false;}
   legs.push({...l,route:path});
  }
  // Validate both outgoing loads before touching either stock. No partial cycle debt.
  for(const l of legs)G.emps[l.e].res[l.r]-=l.v;
  c.cycle++;c.next=G.day+c.legs[0].every;c.status='active';c.reason='İki yön ayrı teslim edilir; kayıp karşı seferi geri almaz';
  for(let i=0;i<legs.length;i++){
   const l=legs[i],sy=G.sys[l.source],v={id:st.nextConvoy++,contract:c.id,cycle:c.cycle,leg:i,e:l.e,to:l.to,source:l.source,target:l.target,r:l.r,loaded:l.v,amount:l.v,delivered:0,lost:0,plundered:0,route:l.route,step:0,t:0,at:l.source,x:sy.x,y:sy.y,status:'preparing',reason:'Yük ayrıldı; alıcıya henüz eklenmedi',depart:G.day+this.prepareDays,started:G.day,updated:G.day,blockedSince:null,retryAt:G.day,riskAt:-1,attackers:[],receipt:null,history:[]};
   if(c.once)v.once=true;st.convoys.push(v);this.add(v.e,'loaded',v.r,v.loaded);this.note(v,'loaded');
  }
  if(c.once){c.status='expired';c.reason='Tek seferlik yük depodan çıktı · konvoy varışı bekleniyor';}
  return true;
 },
 finish(v,status,reason){if(this.terminal(v))return false;const c=this.state().contracts.find(c=>c.id===v.contract),n=v.amount;
  if(status==='delivered'){
   if(v.at!==v.target||v.route[v.step]!==v.target||!this.port(G.emps[v.to],v.target)||this.pairGate(G.emps[v.e],G.emps[v.to],c?.once))return false;
   const to=G.emps[v.to];if(!to||to.dead)return this.finish(v,'destroyed','Alıcı devlet yok oldu; kargo kaybedildi');
   if(!Number.isFinite(to.res[v.r])||to.res[v.r]+n>Number.MAX_SAFE_INTEGER){v.status='blocked';v.reason='Alıcı depo sayı sınırı';return false;}
   to.res[v.r]+=n;v.delivered+=n;this.add(v.e,'sent',v.r,n);this.add(v.to,'received',v.r,n);const s=this.stats(v.e);s.deliveries++;s.lastDay=G.day;
   if(c){c.delivered[v.r]=(c.delivered[v.r]||0)+n;c.lastDelivery=G.day;}
   if(c?.gift&&!giftOnCooldown(G.emps[v.e],to)){
    const donor=G.emps[v.e],reward=dealGoodwill(to,donor,{from:v.e,to:v.to,give:[{t:'res',r:v.r,v:n}],want:[]});
    if(reward>0){to.rel[v.e]=clamp(to.rel[v.e]+reward,-100,100);(donor.giftAt||={})[v.to]=G.memAge||0;}
   }
   if(c&&n>0&&c.cycle>=2&&G.day-c.born>=180&&typeof rememberEvidence==='function')rememberEvidence(to,G.emps[v.e],'ticaretGuveni','freight:'+v.id,6);
   const e=G.emps[v.e];e.tradeFlow=e.tradeFlow||{};e.tradeFlow[v.to]=(e.tradeFlow[v.to]||0)+n;
  }else{v.lost+=n;this.add(v.e,'lost',v.r,n);this.add(v.e,'destroyed',v.r,n);if(c)c.lost[v.r]=(c.lost[v.r]||0)+n;}
  v.amount=0;v.status=status;v.reason=reason;v.finished=G.day;v.receipt=v.id;this.note(v,status);
  if(v.e===0||v.to===0)recordNews({category:'economy',empires:[v.e,v.to],scope:'player',system:status==='delivered'?v.target:v.at,key:'freight:'+v.id,title:status==='delivered'?'Kargo teslim edildi':'Ticaret kargosu kaybedildi',text:n.toFixed(1)+' '+RES[v.r].n+' · '+reason});return true;
 },
 attack(v,f){
  if(!v||this.terminal(v)||!f||!f.ships?.length||!isArmed(f)||f.combat||f.e===v.e||v.attackers.includes(f.id))return false;
  const e=G.emps[v.e],raider=G.emps[f.e];if(!raider||raider.dead||!(e.war[f.e]||raider.wild&&G.cfg.pirates!==false)||Math.hypot(f.x-v.x,f.y-v.y)>160)return false;
  v.attackers.push(f.id);const loot=v.amount*.4;v.amount-=loot;v.lost+=loot;v.plundered+=loot;
  raider.res[v.r]=(raider.res[v.r]||0)+loot;this.add(v.e,'lost',v.r,loot);this.add(v.e,'plundered',v.r,loot);this.add(raider.id,'lootReceived',v.r,loot);
  const c=this.state().contracts.find(c=>c.id===v.contract);if(c)c.lost[v.r]=(c.lost[v.r]||0)+loot;
  G.raids=G.raids||{};G.raids[this.key(v.source,v.target)]=G.day+90;this.note(v,'plundered:'+f.id);
  if(fleetPower(f)>=12)return this.finish(v,'raided','Gerçek kargonun %40’ı ele geçirildi; kalanı imha edildi');
  v.status='attacked';v.reason='Kargonun %40’ı yağmalandı; 10 gün kaçış/mola';v.depart=G.day+10;return true;
 },
 raidTick(){
  const st=this.state(),live=st.convoys.filter(v=>!this.terminal(v));if(!live.length)return;
  const armed=G.fleets.filter(f=>f.ships.length&&!f.combat&&isArmed(f));
  for(const v of live){const day=Math.floor(G.day/10);if(v.riskAt===day)continue;v.riskAt=day;for(const f of armed)if(this.attack(v,f))break;}
 },
 position(v){const a=G.sys[v.route[v.step]],b=G.sys[v.route[v.step+1]];if(!a)return;if(b&&v.status==='moving'){v.x=lerp(a.x,b.x,v.t);v.y=lerp(a.y,b.y,v.t);}else if(v.t===0){v.x=a.x;v.y=a.y;}},
 block(v,why){if(v.blockedSince===null)v.blockedSince=G.day;v.status='blocked';v.reason=why;if(G.day-v.blockedSince>=this.waitLimit)this.finish(v,'destroyed',why+' · 180 gün sonra kargo kaybedildi');},
 tick(dt){
  const st=this.state();if(!Number.isFinite(dt)||dt<0)return;
  dt=st.clock===null?dt:Math.max(0,Math.min(dt,G.day-st.clock));st.clock=G.day;
  // Dispatch and route retries run once per simulation day, not once per paint.
  const newDay=Math.floor(G.day)!==st.dispatchDay;
  if(newDay){st.dispatchDay=Math.floor(G.day);for(const c of st.contracts){if(!this.closed(c)&&(G.emps[c.a]?.dead||G.emps[c.b]?.dead)){c.status='expired';c.reason='Taraf devlet yok oldu; yeni yükleme yok';}if(G.day>=c.until&&!this.closed(c)){c.status='expired';c.reason='Süre doldu; yeni yükleme yok';}if(!this.closed(c)&&G.day>=c.next){this.dispatch(c);if(c.status==='blocked')c.next=G.day+10;}}this.raidTick();}
  let armedAtArrival=null;
  for(const v of st.convoys){
   if(this.terminal(v))continue;const a=G.emps[v.e],b=G.emps[v.to];
   if(!a||a.dead||!b||b.dead){this.finish(v,'destroyed','Taraflardan biri yok oldu');continue;}
   const why=this.pairGate(a,b,v.once)||(G.sys[v.at]?.cr>0?'Konvoy sistemi muharebe ablukasında':null);
   if(why){this.block(v,why);continue;}
   if(v.status==='attacked'&&G.day<v.depart)continue;
   if(v.status==='preparing'&&G.day<v.depart)continue;
   const targetLost=!this.port(b,v.target)||G.sys[v.target].cr>0;
   if(newDay&&!targetLost&&v.route.length>4&&v.status!=='blocked'){
    const closed=this.remainingRoute(v,a,b);
    if(closed)this.block(v,'Liman bağlantısı kesildi · '+closed.name);
   }
   if(targetLost||v.status==='blocked'){
    if(G.day<v.retryAt){this.block(v,v.reason);continue;}
    v.retryAt=G.day+10;
    // An interrupted edge keeps its exact progress. Replan its suffix from the arrival node.
    const next=v.route[v.step+1],moving=v.t>0;
    const at=moving?next:v.at;
    if(moving&&!this.openEdge(a,b,v.at,next)){this.block(v,'Konvoyun bulunduğu hiperhat kapalı');continue;}
    const used=v.hops??v.step;
    const origin=v.legSource??v.source;
    const stop=this.relay(a,G.sys[at])&&routeVolume(a,origin,at)>=v.amount;
    const initialHops=stop?0:used+(moving?1:0);
    let choice=null;
    for(const target of targetLost?tradeHubs(b):[v.target]){
     if(G.sys[target].cr>0||!this.identifiedPort(a,G.sys[target],b))continue;
     if(at===target&&(used+(moving?1:0)>3||routeVolume(a,origin,target)<v.amount))continue;
     const path=at===target?[at]:this.route(a,b,at,target,{inFlight:true,initialHops,initialPort:stop?at:origin,volume:v.amount});
     if(!path||moving&&path.includes(v.at))continue;
     const days=path.slice(1).reduce((sum,id,i)=>sum+Math.max(1,dist(G.sys[path[i]],G.sys[id])/this.speed),0);
     if(!choice||days<choice.days||days===choice.days&&target<choice.target)choice={target,path,days};
    }
    if(!choice){this.block(v,v.reason?.startsWith('Liman bağlantısı kesildi')?v.reason:'Liman erişimi kapalı · '+G.sys[v.target].name+' · açık alternatif yok');continue;}
    v.target=choice.target;v.route=moving?[v.at,...choice.path]:choice.path;v.step=0;v.hops=used;
   }
   const ready=Math.max(0,G.day-Math.max(G.day-dt,v.depart));
   v.status='moving';v.reason='Gerçek kargo yolda';let remaining=ready;
   // Large ticks still account for each physical arrival.
   for(let hops=0;hops<v.route.length&&!this.terminal(v);hops++){
    if(v.at===v.target){this.finish(v,'delivered','Varış limanına ulaştı');break;}
    const from=G.sys[v.route[v.step]],next=G.sys[v.route[v.step+1]];
    if(!from||!next||!this.openEdge(a,b,from.id,next.id)){this.block(v,'Hiper-yol kapalı / düşman denetiminde');break;}
    if(next.cr>0){this.block(v,'Sonraki sistem muharebe / abluka altında');break;}
    if(!v.t&&this.relay(a,from)&&routeVolume(a,v.legSource??v.source,from.id)>=v.amount){
     v.hops=0;if(from.id!==v.source)v.legSource=from.id;
    }
    if((v.hops??v.step)>=3){this.block(v,'Aktarma limanına erişilemiyor · '+from.name);break;}
    v.blockedSince=null;
    const days=Math.max(1,dist(from,next)/this.speed),need=(1-v.t)*days;
    if(remaining<need){v.t+=remaining/days;remaining=0;this.position(v);break;}
    remaining-=need;v.hops=(v.hops??v.step)+1;v.step++;v.at=next.id;v.t=0;v.x=next.x;v.y=next.y;this.note(v,'arrived:'+next.id);
    if(!armedAtArrival)armedAtArrival=G.fleets.filter(f=>f.ships.length&&isArmed(f)&&!f.combat);const threat=armedAtArrival.find(f=>(a.war[f.e]||G.emps[f.e]?.wild&&G.cfg.pirates!==false)&&Math.hypot(f.x-v.x,f.y-v.y)<=160&&!v.attackers.includes(f.id));if(threat)this.attack(v,threat);
    if(v.status==='attacked'||this.terminal(v))break;
    if(v.at===v.target){this.finish(v,'delivered','Varış limanına ulaştı');break;}if(remaining<=0)break;
   }v.updated=G.day;
  }
  const terminal=st.convoys.filter(v=>this.terminal(v));if(terminal.length>this.historyLimit){const remove=new Set(terminal.slice(0,terminal.length-this.historyLimit).map(v=>v.id));st.convoys=st.convoys.filter(v=>!remove.has(v.id));}
  const closed=st.contracts.filter(c=>this.closed(c)&&!st.convoys.some(v=>v.contract===c.id&&!this.terminal(v)));if(closed.length>128){const ids=new Set(closed.slice(0,closed.length-128).map(c=>c.id));st.contracts=st.contracts.filter(c=>!ids.has(c.id));st.convoys=st.convoys.filter(v=>!ids.has(v.contract));}
 },
 /* Self-assessed supply/demand, not access to another empire's hidden treasury.
    Stocks committed to export remain distinct from recurring production. */
 aiBalance(e){
  const out={},incoming={},st=this.state();
  for(const c of st.contracts)if(!c.once&&!this.closed(c))for(const l of c.legs){if(l.e===e.id)out[l.r]=(out[l.r]||0)+l.v*30/l.every;if(l.to===e.id)incoming[l.r]=(incoming[l.r]||0)+l.v*30/l.every;}
  const base={ene:80,min:60,yiy:40,ala:60,tuk:40},rows={};
  for(const r of this.resources){const stock=Math.max(0,e.res[r]||0),net=(e.inc?.[r]||0)-(out[r]||0),reserve=base[r]+Math.max(0,-net)*6;
   rows[r]={stock,net,reserve,incoming:incoming[r]||0,export:Math.max(0,Math.min(stock-reserve,Math.max(0,net)*.45+Math.max(0,stock-reserve)/12)),need:Math.max(0,-net)+Math.max(0,base[r]*2-stock)/6};
  }return rows;
 },
 /* 96C.1: bounded derived topology memo, used only during an AI opportunity pass.
    Exact signature includes world identity, lanes/owners/knowledge, all wars and
    raid deadlines. Ports/pacts/embargo/stock gates are always evaluated live. */
 aiRouteSignature(){
  const owners=G.emps.filter(e=>!e.dead&&tradeHubs(e).length);
  const rights=owners.map(o=>[o.id,...G.emps.filter(e=>!e.dead&&this.portRight(o,e)).map(e=>e.id)]);
  const ports=owners.map(o=>tradeHubs(o).map(id=>[id,routeVolume(o,id,id),...G.emps.filter(e=>!e.dead&&this.identifiedPort(e,G.sys[id],o)).map(e=>e.id)]));
  return JSON.stringify([rights,ports,G.sys.map(s=>[s.owner,s.lanes,s.seen,s.cr]),
   G.emps.map(e=>[e.dead,e.war]),G.p?G.sys.map(s=>this.known(G.p,s)):[],
   Object.entries(G.raids||{}).map(([key,until])=>[key,until>G.day])]);
 },
 aiQuoteRoute(a,b,source,target,volume=0){
  const scope=this._aiRouteScope;if(!scope)return this.route(a,b,source,target,{volume});
  const key=['quote',a.id,b.id,source,target,volume].join(':');
  if(scope.paths.has(key))return scope.paths.get(key)?.slice()||null;
  const path=this.route(a,b,source,target,{volume});if(scope.paths.size>=2048)scope.paths.clear();scope.paths.set(key,path?.slice()||null);return path;
 },
 aiPortRoute(a,b,source,target){
  const scope=this._aiRouteScope;if(!scope)return this.route(a,b,source,target,{avoidObserved:true});
  const key=[a.id,b.id,source,target,...[...this.aiHazards(a)].sort((x,y)=>x-y)].join(':');
  if(scope.paths.has(key))return scope.paths.get(key)?.slice()||null;
  const path=this.route(a,b,source,target,{avoidObserved:true});if(scope.paths.size>=2048)scope.paths.clear();scope.paths.set(key,path?.slice()||null);return path;
 },
 aiPorts(a,b,budget){
  let best=null;
  const pairs=tradeHubs(a).flatMap(source=>tradeHubs(b).map(target=>({source,target,d:dist(G.sys[source],G.sys[target])}))).sort((x,y)=>x.d-y.d||x.source-y.source||x.target-y.target);
  // Inspect every pair for ordinary small networks. For large networks keep
  // the closest half and rotate the rest; never claim an untested path failed.
  const limit=Math.min(12,pairs.length),near=Math.min(6,limit),tail=pairs.slice(near),offset=(Math.floor(G.day/30)+a.id+b.id)%Math.max(1,tail.length);
  const candidates=pairs.slice(0,near).concat(Array.from({length:limit-near},(_,i)=>tail[(offset+i)%tail.length]));
  const scan={total:pairs.length,tried:0,exhausted:false,limited:false};budget.lastScan=scan;
  const hazards=this.aiHazards(a);
  for(const {source,target} of candidates){
   if(budget.routes<=0){scan.exhausted=true;break;}budget.routes--;scan.tried++;
   if(G.sys[source].cr>0||G.sys[target].cr>0)continue;
   const path=this.aiPortRoute(a,b,source,target);if(!path)continue;
   if(path.some(id=>hazards.has(id)))continue;
   const distance=path.slice(1).reduce((n,id,i)=>n+dist(G.sys[path[i]],G.sys[id]),0);
   if(!best||distance<best.distance)best={source,target,distance};
  }
  scan.limited=scan.tried<scan.total;
  return best;
 },
 aiPortInvestment(a,b,A,B,budget){
  if(!B||!a.ai||!b.ai||a.crisis||a.shortage||a.war[b.id]||Object.values(a.war).some(Boolean)||
    !this.resources.some(r=>A[r].net<0&&A[r].need>0&&B[r].export>=1))return false;
  if(a.colonies.some(c=>G.sys[c.s]?.planets[c.p]?.col?.q?.some(q=>q.key==='liman')))return false;
  const targets=tradeHubs(b).filter(id=>this.identifiedPort(a,G.sys[id],b));
  if(!targets.length)return false;
  let plan;
  const producer={ene:'santral',min:'maden',yiy:'ciftlik',ala:'dokum',tuk:'fabrika'};
  for(const col of a.colonies){
   const s=G.sys[col.s],p=s.planets[col.p],cost=buildingOrderCost(a,p,'liman');
   if(!cost||p.col.q?.length||this.port(a,s.id))continue;
   for(const target of targets){
    if(budget.routes<2)return false;budget.routes-=2;
    const path=this.aiPortRoute(a,b,s.id,target);
    if(!path||!this.aiPortRoute(b,a,target,s.id))continue;
    const distance=path.slice(1).reduce((n,id,i)=>n+dist(G.sys[path[i]],G.sys[id]),0);
    const n=this.aiTerms(a,b,A,B,{source:s.id,target,distance});
    if(!n)continue;
    const value=this.aiValue(a,{from:b.id,to:a.id,give:n.want,want:n.give}).net;
    const price=Object.entries(cost).reduce((sum,[r,v])=>sum+itemValue(a,{t:'res',r,v},b),0);
    if(value<=price)continue;
    plan||=aiEconomyPlan(a);if(plan.critical)return false;
    if(!aiBuildingSustainable(a,s,p,'liman',plan)||this.resources.some(r=>A[r].net<0&&buildingOrderCost(a,p,producer[r])&&aiBuildingDelta(a,s,p,producer[r])[r]>0))continue;
    if(!queueBuilding(a,s,p,'liman'))continue;
    AIDiagnostics.note('trade-port-investment',a,b,'Bilinen hat · '+s.id+' → '+target);
    return true;
   }
  }
  return false;
 },
 aiTransitRequest(a,b,A,B,budget){
  if(!B||!a.ai||!b.ai||a.res.etk<80||!this.resources.some(r=>A[r].need>0&&B[r].export>=1))return false;
  const key='portTransit:'+b.id;
  if(a.aiTalk?.[key]?.until>G.day)return false;
  const owners=G.emps.filter(o=>o!==a&&o!==b&&!o.dead&&!o.wild&&!o.crisisSide&&a.contact[o.id]&&
    !this.portRight(o,a)&&!a.war[o.id]&&!diploBlocked(a,o)&&!tradeBlocked(a,o)&&
    tradeHubs(o).some(id=>this.identifiedPort(a,G.sys[id],o)));
  for(const source of tradeHubs(a))for(const target of tradeHubs(b)){
   if(budget.routes<2)return false;
   if(!this.identifiedPort(a,G.sys[target],b))continue;
   budget.routes--;if(!this.aiPortRoute(b,a,target,source))continue;
   for(const owner of owners){
    if(budget.routes<=0)return false;budget.routes--;
    const grants=new Set([owner.id+':'+a.id]);
    const path=this.route(a,b,source,target,{grants,avoidObserved:true});
    if(!path)continue;
    const distance=path.slice(1).reduce((n,id,i)=>n+dist(G.sys[path[i]],G.sys[id]),0);
    const terms=this.aiTerms(a,b,A,B,{source,target,distance});
    if(!terms)continue;
    // A paid grant must enable this actual load in both directions.
    if(budget.routes<3)return false;
    budget.routes-=3;
    if(this.route(a,b,source,target,{avoidObserved:true,volume:terms.give[0].v})||
       !this.route(a,b,source,target,{grants,avoidObserved:true,volume:terms.give[0].v})||
       !this.route(b,a,target,source,{avoidObserved:true,volume:terms.want[0].v}))continue;
    const payment=36,offer={from:a.id,to:owner.id,give:[{t:'res',r:'etk',v:payment}],want:[{t:'portTransit'}]};
    if(!dealQuote(offer).ok||a.res.etk-payment<40)continue;
    (a.aiTalk||={})[key]={until:G.day+180,reason:'Transit izni değerlendirildi'};
    if(owner.id===0)return !!UI.aiOffer(offer);
    const guest=typeof __mpHumanVoter==='function'&&__mpHumanVoter(owner.id);
    if(!owner.ai&&!guest)return false;
    const result=aiNegotiate(a,owner,offer.give,offer.want,true);
    const pending=guest&&result.tur>0&&result.karar==='bekle';
    AIDiagnostics.note(result.uygulandi?'trade-transit-granted':pending?'trade-transit-pending':'trade-transit-refused',a,owner,'Kargo ortağı '+b.id+' · '+path.length+' sistem');
    return result.uygulandi||pending;
   }
  }
  return false;
 },
 aiValue(e,n){return evalOffer({...e},n);},
 aiTerms(a,b,A,B,ports){
  let best=null;const scan={pairs:0,ratios:0,amounts:0};this._aiTermsScan=scan;
  const exports=this.resources.filter(r=>A[r].export>=1).sort((x,y)=>B[y].need-B[x].need||A[y].export-A[x].export);
  const imports=this.resources.filter(r=>B[r].export>=1).sort((x,y)=>A[y].need-A[x].need||B[y].export-B[x].export);
  const valuation=new Map(),cap=Math.min(routeVolume(a,ports.source,ports.target),routeVolume(b,ports.target,ports.source));
  // Freight value is linear in quantity. Reuse canonical one-unit evaluations
  // for each resource/direction/period inside this one decision only. All
  // politics, memory, envoy and strategic multipliers still come from aiValue.
  const units=every=>{
   if(valuation.has(every))return valuation.get(every);
   const buyer={},seller={};let hardLock=false;
   for(let i=0;i<this.resources.length;i++){
    const r=this.resources[i],q=this.resources[(i+1)%this.resources.length];
    const n={from:a.id,to:b.id,give:[{t:'freight',r,v:1,source:ports.source,target:ports.target,every,months:12}],want:[{t:'freight',r:q,v:1,source:ports.target,target:ports.source,every,months:12}]};
    const B=this.aiValue(b,n),A=this.aiValue(a,{from:b.id,to:a.id,give:n.want,want:n.give});hardLock=hardLock||B.hardLock||A.hardLock;
    (buyer[r]||(buyer[r]={})).gain=B.gain;(buyer[q]||(buyer[q]={})).cost=B.cost;
    (seller[q]||(seller[q]={})).gain=A.gain;(seller[r]||(seller[r]={})).cost=A.cost;
   }
   const row={buyer,seller,hardLock};valuation.set(every,row);return row;
  };
  for(const r of exports)for(const q of imports){
   if(r===q||A[q].need<=0&&B[r].need<=0)continue;
   scan.pairs++;
   const travel=ports.distance??dist(G.sys[ports.source],G.sys[ports.target]),period=Math.min(180,Math.max(30,Math.ceil((travel/this.speed+this.prepareDays*2)/30)*30));
   for(const every of [...new Set([period,Math.min(180,period*2)])]){
    const make=(v,w)=>({from:a.id,to:b.id,give:[{t:'freight',r,v,source:ports.source,target:ports.target,every,months:12}],want:[{t:'freight',r:q,v:w,source:ports.target,target:ports.source,every,months:12}]});
    const values=units(every),buyer={gain:values.buyer[r].gain,cost:values.buyer[q].cost,hardLock:values.hardLock},seller={gain:values.seller[q].gain,cost:values.seller[r].cost,hardLock:values.hardLock};
    if(buyer.hardLock||seller.hardLock||buyer.cost<=0||seller.gain<=0)continue;
    const low=seller.cost/seller.gain*1.04,high=buyer.gain/buyer.cost*.96;if(low>=high)continue;scan.ratios++;
    const ratio=Math.sqrt(low*high),maxA=Math.min(16,cap,A[r].export*every/30,A[r].stock-A[r].reserve),maxB=Math.min(16,cap,B[q].export*every/30,B[q].stock-B[q].reserve);
    const amount=Math.floor(Math.min(maxA,maxB/ratio)*10)/10,payment=Math.floor(amount*ratio*10)/10;if(amount<1||payment<1)continue;scan.amounts++;
    const n=make(amount,payment);
    if(buyer.gain*amount-buyer.cost*payment<=0||seller.gain*payment-seller.cost*amount<=0)continue;
    const score=(Math.min(amount,B[r].need*every/30)+Math.min(payment,A[q].need*every/30))*30/every;
    if(!best||score>best.score)best={n,score};
   }
  }
  if(!best)return null;
  const n=best.n,receiver=this.aiValue(b,n),owner=this.aiValue(a,{from:b.id,to:a.id,give:n.want,want:n.give});
  return receiver.net>0&&owner.net>0?n:null;
 },
 aiPlayerTerms(a,A,ports){
  // No reading player stocks/net to infer a hidden need. The player alone decides.
  const r=this.resources.filter(r=>A[r].export>=2).sort((x,y)=>A[y].export-A[x].export)[0];
  const q=this.resources.filter(q=>q!==r&&A[q].need>0).sort((x,y)=>A[y].need-A[x].need)[0];if(!r||!q)return null;
  const cap=Math.min(routeVolume(a,ports.source,ports.target),routeVolume(G.p,ports.target,ports.source)),v=Math.floor(Math.min(8,cap,A[r].export)),w=Math.min(6,cap,v);
  if(v<1||w<1)return null;const n={from:a.id,to:0,give:[{t:'freight',r,v,source:ports.source,target:ports.target,every:30,months:12}],want:[{t:'freight',r:q,v:w,source:ports.target,target:ports.source,every:30,months:12}]};
  return this.aiValue(a,{from:0,to:a.id,give:n.want,want:n.give}).net>0?n:null;
 },
 aiTick(){
  const signature=this.aiRouteSignature(),old=this._aiRouteMemo;
  if(!old||old.world!==G.sys||old.signature!==signature)this._aiRouteMemo={world:G.sys,signature,paths:new Map()};
  this._aiRouteScope=this._aiRouteMemo;this._aiHazardScope=new Map();
  try{return this.aiOpportunityTick();}finally{this._aiRouteScope=null;this._aiHazardScope=null;}
 },
 aiPartnerOffers(a,partners,balances,budget){
  const A=balances.get(a.id),quotes=new Map();
  if(!A||!this.resources.some(r=>A[r].need>0)||!tradeHubs(a).length)return quotes;
  // Only compare competing solvent offers. The other trader supplies its own export assessment.
  const peers=partners.filter(b=>b.ai&&b.id>a.id&&balances.has(b.id)&&a.pact?.[b.id]&&!this.pairGate(a,b)&&
    this.resources.some(r=>A[r].export>=1&&balances.get(b.id)[r].need>0||balances.get(b.id)[r].export>=1&&A[r].need>0)&&
    tradeHubs(b).length&&!(a.aiTalk?.['commerce:'+b.id]?.until>G.day));
  if(peers.length<2)return quotes;
  for(const b of peers.slice(0,4)){
   if(budget.routes<2)break;
   const ports=this.aiPorts(a,b,budget);if(!ports)continue;
   const terms=this.aiTerms(a,b,A,balances.get(b.id),ports);
   if(!terms||!dealQuote(terms).ok)continue;
   const score=this.aiValue(a,{from:b.id,to:a.id,give:terms.want,want:terms.give}).net/
    (terms.give[0].every+ports.distance/this.speed);
   if(score>0)quotes.set(b.id,{score,ports,terms});
  }
  return quotes;
 },
 aiOpportunityTick(){
  const st=this.state(),month=Math.floor(G.day/30),budget={routes:96};let created=0;
  const normal=e=>e&&!e.dead&&!e.wild&&!e.crisisSide;
  const balances=new Map(G.emps.filter(e=>normal(e)&&e.ai&&e.id!==0).map(e=>[e.id,this.aiBalance(e)]));
  for(const a of G.emps){if(!normal(a)||!a.ai||a.id===0||st.aiAt[a.id]===month)continue;st.aiAt[a.id]=month;
   for(const c of st.contracts)if(!c.once&&[c.a,c.b].includes(a.id)&&!this.closed(c)){
    const leg=c.legs.find(l=>l.e===a.id),row=balances.get(a.id)[leg.r];
    if(c.cycle>0&&(Object.values(c.lost).reduce((x,y)=>x+y,0)>Object.values(c.delivered).reduce((x,y)=>x+y,0)+20||row.net<0&&row.stock<row.reserve)){
     this.cancel(c.id,a);AIDiagnostics.note('trade-review-cancel',a,null,'Loss or outgoing reserve pressure; existing cargo remains physical');
    }
   }
   if(created>=4)break;
   const partners=G.emps.slice().sort((x,y)=>Number(x.id===0)-Number(y.id===0)||x.id-y.id);
   const offers=this.aiPartnerOffers(a,partners,balances,budget);
   if(offers.size)partners.sort((x,y)=>(offers.get(y.id)?.score||0)-(offers.get(x.id)?.score||0));
   for(const b of partners){
    if(!normal(b)||b===a||b.id!==0&&(!b.ai||a.id>b.id))continue;
    const note=(code,why)=>AIDiagnostics.note(code,a,b,why);
    if(!a.contact[b.id]||!b.contact[a.id]){note('trade-no-contact');continue;}
    if(st.contracts.some(c=>!this.closed(c)&&[c.a,c.b].includes(a.id)&&[c.a,c.b].includes(b.id))){note('trade-existing');continue;}
    const political=this.pairGate(a,b);if(political&&political!=='Genel ticaret anlaşması yok'){note('trade-political',political);continue;}
    const wait=a.aiTalk?.['commerce:'+b.id];if(wait?.until>G.day){note('trade-cooldown',wait.reason);continue;}
    const A=balances.get(a.id),B=balances.get(b.id);
    if(!tradeHubs(a).length||!tradeHubs(b).length){
     if(!political&&b.ai&&this.aiPortInvestment(a,b,A,B,budget)){created++;break;}
     note('trade-no-port');continue;
    }
    if(b.id!==0&&!this.resources.some(r=>A[r].export>=1&&B[r].need>0||B[r].export>=1&&A[r].need>0)){note('trade-no-supply-demand');continue;}
    const ports=offers.get(b.id)?.ports||this.aiPorts(a,b,budget);if(!ports){if(!political&&b.ai&&(this.aiTransitRequest(a,b,A,B,budget)||this.aiPortInvestment(a,b,A,B,budget))){created++;break;}note(budget.lastScan?.exhausted?'trade-route-budget':budget.lastScan?.limited?'trade-route-not-exhausted':'trade-no-safe-route',JSON.stringify(budget.lastScan));continue;}
    const n=offers.get(b.id)?.terms||(b.id===0?this.aiPlayerTerms(a,A,ports):this.aiTerms(a,b,A,B,ports));
    const cool=(reason,days=120)=>{(a.aiTalk||(a.aiTalk={}))['commerce:'+b.id]={until:G.day+days,reason};note(reason);};
    if(!n){const scan=b.id===0?null:this._aiTermsScan;cool(b.id===0?'trade-player-no-supply':!scan?.pairs?'trade-no-barter-candidates':!scan.ratios?'trade-no-fair-ratio':!scan.amounts?'trade-volume-below-minimum':'trade-no-positive-value',60);continue;}
    if(political){
     if(!canPact(a,b)){cool('trade-pact-unavailable');continue;}
     const terms=aiProposeTerms(a,b,'pact');
     if(b.id===0){if(UI.aiOffer({from:a.id,to:0,...terms}))created++;cool('trade-pact-player-pending',180);}
     else{const result=aiNegotiate(a,b,terms.give,terms.want,true);if(result.uygulandi)created++;cool(result.uygulandi?'trade-pact-agreed':'trade-pact-rejected');}
     break;
    }
    const quote=dealQuote(n);if(!quote.ok){cool('trade-quote-rejected');note('trade-quote-reason',quote.reasons[0]);continue;}
    if(b.id===0){if(UI.aiOffer(n)){created++;cool('trade-player-pending',180);break;}cool('trade-player-wait',180);continue;}
    const result=aiNegotiate(a,b,n.give,n.want,true);note(result.uygulandi?'trade-signed':'trade-negotiation-rejected',result.why);
    cool(result.uygulandi?'trade-agreed':'trade-retry-wait');if(result.uygulandi){balances.set(a.id,this.aiBalance(a));balances.set(b.id,this.aiBalance(b));created++;break;}
   }
  }
 },
 visible(v,viewer=G.p){if(!viewer||this.terminal(v))return false;if(v.e===viewer.id||v.to===viewer.id)return true;return false;},
 restore(raw){
  for(const e of G.emps)if(e.portTransit!==undefined){
   const g=e.portTransit;
   if(!g||typeof g!=='object'||Array.isArray(g)||Object.entries(g).some(([id,end])=>!/^\d+$/.test(id)||!G.emps[id]||+id===e.id||!Number.isFinite(end)||end<0))throw Error('Bozuk liman transit izni');
  }
  if(!raw){G.commerce=this.empty();return;}
  if(raw.v!==1||!raw.stats||typeof raw.stats!=='object'||Array.isArray(raw.stats)||!raw.aiAt||typeof raw.aiAt!=='object'||!Array.isArray(raw.contracts)||!Array.isArray(raw.convoys)||raw.contracts.length>256||raw.convoys.length>this.maxConvoys+this.historyLimit)throw Error('Geçersiz ticaret kaydı');
  const st=JSON.parse(JSON.stringify(raw)),ids=new Set(),cids=new Set(),num=n=>Number.isFinite(n)&&n>=0&&n<=Number.MAX_SAFE_INTEGER;
  for(const c of st.contracts){if(!Number.isSafeInteger(c.id)||cids.has(c.id)||!Array.isArray(c.legs)||(c.once?c.legs.length<1||c.legs.length>10:c.legs.length!==2)||!num(c.next)||!num(c.until)||!num(c.cycle)||!this.labels[c.status])throw Error('Bozuk sözleşme');cids.add(c.id);for(const l of c.legs)if(!this.resources.includes(l.r)||!num(l.v)||l.v<=0||!G.emps[l.e]||!G.emps[l.to]||!G.sys[l.source]||!G.sys[l.target])throw Error('Bozuk sözleşme yükü');}
  for(const v of st.convoys){if(!Number.isSafeInteger(v.id)||ids.has(v.id)||!cids.has(v.contract)||!G.emps[v.e]||!G.emps[v.to]||!this.resources.includes(v.r)||!Array.isArray(v.route)||v.route.length>G.sys.length||new Set(v.route).size!==v.route.length||v.legSource!==undefined&&(!Number.isInteger(v.legSource)||!G.sys[v.legSource])||v.hops!==undefined&&(!Number.isInteger(v.hops)||v.hops<0||v.hops>3)||!v.route.length||v.route.some(id=>!G.sys[id])||!Number.isInteger(v.step)||v.step<0||v.step>=v.route.length||!num(v.t)||v.t>1||!['loaded','amount','delivered','lost','plundered','x','y','started','depart','riskAt'].filter(k=>!['x','y','riskAt'].includes(k)).every(k=>num(v[k]))||!Number.isFinite(v.x)||!Number.isFinite(v.y)||!this.labels[v.status]||Math.abs(v.loaded-v.amount-v.delivered-v.lost)>1e-6||this.terminal(v)&&v.amount!==0)throw Error('Bozuk konvoy / kargo muhasebesi');ids.add(v.id);}
  for(const [id,stats] of Object.entries(st.stats||{})){if(!G.emps[id]||!stats||!Number.isSafeInteger(stats.deliveries)||stats.deliveries<0)throw Error('Bozuk ticaret sayacı');for(const key of ['loaded','sent','received','lost','destroyed','plundered','lootReceived']){if(!stats[key]||typeof stats[key]!=='object'||Array.isArray(stats[key])||Object.entries(stats[key]).some(([r,n])=>!this.resources.includes(r)||!num(n)))throw Error('Bozuk kargo toplamı');}}
  if(st.clock!==null&&!num(st.clock))throw Error('Bozuk ticaret saati');
  if(st.convoys.some(v=>v.at!==v.route[v.step]||!Array.isArray(v.attackers)||v.attackers.some(id=>!Number.isSafeInteger(id))||this.terminal(v)&&v.receipt!==v.id))throw Error('Bozuk konum / teslimat makbuzu');
  if(!Number.isSafeInteger(st.nextConvoy)||st.nextConvoy<=Math.max(0,...ids)||!Number.isSafeInteger(st.nextContract)||st.nextContract<=Math.max(0,...cids))throw Error('Ticaret kimliği tekrar edebilir');
  G.commerce=st; // No dispatch, payment, arrival, history synthesis or RNG during loading.
 },
};
