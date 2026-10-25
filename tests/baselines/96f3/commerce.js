'use strict';
/* 96A: physical freight. This is the sole recurring goods-transfer owner.
   Military fleets, tribute and one-off diplomatic gifts retain their owners. */
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
 port(e,id){return !!e&&!e.dead&&tradeHubs(e).includes(id);},
 pairGate(a,b){if(!a||!b||a===b||a.dead||b.dead||a.wild||b.wild||a.crisisSide||b.crisisSide)return 'Taraflardan biri geçerli değil';if(a.war[b.id]||b.war[a.id])return 'Savaş nedeniyle ticaret kapalı';if(tradeBlocked(a,b))return 'Ambargo / ticari yaptırım';if(!a.pact?.[b.id]||!b.pact?.[a.id])return 'Genel ticaret anlaşması yok';return null;},
 key(a,b){return a<b?a+'_'+b:b+'_'+a;},
 // Each autonomous sender assesses its own known hazards. No partner's
 // private fleets/treasury are consulted and unknown pirates remain a risk.
 aiHazards(e){
  const view=aiView(e),risk=new Set(view.ctx.pirates);
  for(const f of G.fleets){const at=f.mv?f.mv.to:f.sys;if(f.e!==e.id&&f.ships.length&&isArmed(f)&&hostile(e.id,f.e)&&view.ctx.visible.has(at))risk.add(at);}
  return risk;
 },
 route(a,b,source,target,{inFlight=false,avoidObserved=false}={}){
  if(!G.sys[source]||!G.sys[target]||source===target)return null;
  const risk=avoidObserved?this.aiHazards(a):null;if(risk?.has(source))return null;
  if(!inFlight&&G.raids?.[this.key(source,target)]>G.day)return null;
  const q=[[source]],seen=new Set([source]);let budget=512;
  for(let i=0;i<q.length&&budget-->0;i++){
   const path=q[i],s=G.sys[path.at(-1)];if(path.length>3)continue;
   for(const id of s.lanes){const n=G.sys[id];if(!n||seen.has(id)||risk?.has(id)||!this.known(a,n)||!this.known(b,n))continue;
    const owner=G.emps[n.owner];if(owner&&(a.war[owner.id]||b.war[owner.id]))continue;
    const next=path.concat(id);if(id===target)return next;seen.add(id);q.push(next);
   }
  }return null;
 },
 legGate(a,b,it,{stock=false}={}){
  const why=this.pairGate(a,b);if(why)return why;
  if(!this.resources.includes(it.r)||!Number.isFinite(it.v)||it.v<=0||it.v>1000)return 'Geçersiz kargo kaynağı / miktarı (1–1000)';
  if(!Number.isInteger(it.source)||!Number.isInteger(it.target)||!this.port(a,it.source)||!this.port(b,it.target)||it.source===it.target)return 'Çıkış veya varış limanı geçerli değil';
  if(G.sys[it.source].cr>0||G.sys[it.target].cr>0)return 'Ticaret limanı aktif çatışma / abluka altında';
  if(!Number.isInteger(it.every)||it.every<30||it.every>180||!Number.isInteger(it.months)||it.months<3||it.months>120)return 'Sıklık 30–180 gün, süre 3–120 ay olmalı';
  if(it.v>routeVolume(a,it.source,it.target))return 'Sefer miktarı yol kapasitesini aşıyor';
  if(!this.route(a,b,it.source,it.target))return 'En çok 3 sıçramalık bilinen açık rota yok / rota yağmalandı';
  if(stock&&(!Number.isFinite(a.res[it.r])||a.res[it.r]<it.v))return 'İlk sefer için depoda yeterli '+RES[it.r].n+' yok';return null;
 },
 signature(n){return JSON.stringify([n.from,n.to,n.give,n.want]);},
 quote(n){
  const a=G.emps[n.from],b=G.emps[n.to],all=n.give.concat(n.want),st=this.state();
  if(all.some(x=>x.t!=='freight')||n.give.length!==1||n.want.length!==1)return 'Kargo sözleşmesi iki karşılıklı sevkiyat içerir; diğer teklifler ayrı imzalanır';
  const x=n.give[0],y=n.want[0];if(x.source!==y.target||x.target!==y.source||x.every!==y.every||x.months!==y.months||x.r===y.r)return 'Karşı sefer limanları/sıklığı/süresi eşleşmeli; iki farklı kaynak seç';
  for(const [from,to,it]of [[a,b,x],[b,a,y]]){const why=this.legGate(from,to,it,{stock:true});if(why)return why;}
  const active=st.contracts.filter(c=>!this.closed(c));
  for(const [from,it]of [[a,x],[b,y]]){const reserved=active.flatMap(c=>c.legs).filter(l=>l.e===from.id&&l.source===it.source&&l.target===it.target).reduce((n,l)=>n+l.v*30/l.every,0);if(reserved+it.v*30/it.every>routeVolume(from,it.source,it.target)+1e-7)return 'Aynı hattaki sözleşmeler aylık yol kapasitesini aşıyor';}
  if(active.some(c=>c.signature===this.signature(n)))return 'Aynı kaynak sözleşmesi zaten aktif';
  if(active.length>=this.maxContracts||[a,b].some(e=>active.filter(c=>c.a===e.id||c.b===e.id).length>=this.maxPerEmpire))return 'Sözleşme sınırı dolu; mevcut seferler korunur';
  return null;
 },
 sign(n){const why=this.quote(n);if(why)throw Error(why);const st=this.state(),c={id:st.nextContract++,a:n.from,b:n.to,signature:this.signature(n),legs:[{...n.give[0],e:n.from,to:n.to},{...n.want[0],e:n.to,to:n.from}],born:G.day,until:G.day+n.give[0].months*30,next:G.day+this.prepareDays,cycle:0,status:'active',reason:'İlk yükleme hazırlanıyor',delivered:{},lost:{},lastDelivery:null};st.contracts.push(c);return c;},
 cancel(id,actor){const c=this.state().contracts.find(c=>c.id===+id);if(!c||![c.a,c.b].includes(actor?.id)||this.closed(c))return {ok:false,why:'Sözleşme yok veya yetkin yok'};c.status='cancelled';c.reason='Yeni sefer yok; yoldaki yük geçerli limana teslim edilir. Anlaşma/liman kapalıysa en çok 180 gün bekler.';return {ok:true};},
 note(c,event){c.history=c.history||[];c.history.push({day:G.day,event});if(c.history.length>12)c.history.shift();},
 dispatch(c){
  const st=this.state();if(this.closed(c))return false;
  if(G.day>=c.until){c.status='expired';c.reason='Süre doldu; yeni sefer yok, yoldaki kargolar ayrı sonuçlanır';return false;}
  if(st.convoys.some(v=>v.contract===c.id&&!this.terminal(v))){c.status='waiting';c.reason='Önceki karşılıklı sefer tamamlanıyor';return false;}
  if(st.convoys.filter(v=>!this.terminal(v)).length+2>this.maxConvoys){c.status='waiting';c.reason='256 aktif konvoy sınırı; yük depoda, sevkiyat bekliyor';return false;}
  const legs=[];
  for(const l of c.legs){const a=G.emps[l.e],b=G.emps[l.to],why=this.legGate(a,b,l,{stock:true});if(why){c.status='blocked';c.reason=why;return false;}const used=st.convoys.filter(v=>v.e===l.e&&v.source===l.source&&v.target===l.target&&v.started>G.day-30).reduce((n,v)=>n+v.loaded,0);if(used+l.v>routeVolume(a,l.source,l.target)+1e-7){c.status='waiting';c.reason='Son 30 günlük rota kapasitesi dolu; yük depoda bekliyor';return false;}// Prefer the AI sender's observed safe alternate. An already agreed
  // contract keeps the existing legal/risky fallback; this adds no launch ban.
  const path=(a.ai&&a.id!==0?this.route(a,b,l.source,l.target,{avoidObserved:true}):null)||this.route(a,b,l.source,l.target);legs.push({...l,route:path});}
  // Validate both outgoing loads before touching either stock. No partial cycle debt.
  for(const l of legs)G.emps[l.e].res[l.r]-=l.v;
  c.cycle++;c.next=G.day+c.legs[0].every;c.status='active';c.reason='İki yön ayrı teslim edilir; kayıp karşı seferi geri almaz';
  for(let i=0;i<legs.length;i++){
   const l=legs[i],sy=G.sys[l.source],v={id:st.nextConvoy++,contract:c.id,cycle:c.cycle,leg:i,e:l.e,to:l.to,source:l.source,target:l.target,r:l.r,loaded:l.v,amount:l.v,delivered:0,lost:0,plundered:0,route:l.route,step:0,t:0,at:l.source,x:sy.x,y:sy.y,status:'preparing',reason:'Yük ayrıldı; alıcıya henüz eklenmedi',depart:G.day+this.prepareDays,started:G.day,updated:G.day,blockedSince:null,retryAt:G.day,riskAt:-1,attackers:[],receipt:null,history:[]};
   st.convoys.push(v);this.add(v.e,'loaded',v.r,v.loaded);this.note(v,'loaded');
  }return true;
 },
 finish(v,status,reason){if(this.terminal(v))return false;const c=this.state().contracts.find(c=>c.id===v.contract),n=v.amount;
  if(status==='delivered'){
   if(v.at!==v.target||v.route[v.step]!==v.target||!this.port(G.emps[v.to],v.target)||this.pairGate(G.emps[v.e],G.emps[v.to]))return false;
   const to=G.emps[v.to];if(!to||to.dead)return this.finish(v,'destroyed','Alıcı devlet yok oldu; kargo kaybedildi');
   if(!Number.isFinite(to.res[v.r])||to.res[v.r]+n>Number.MAX_SAFE_INTEGER){v.status='blocked';v.reason='Alıcı depo sayı sınırı';return false;}
   to.res[v.r]+=n;v.delivered+=n;this.add(v.e,'sent',v.r,n);this.add(v.to,'received',v.r,n);const s=this.stats(v.e);s.deliveries++;s.lastDay=G.day;
   if(c){c.delivered[v.r]=(c.delivered[v.r]||0)+n;c.lastDelivery=G.day;}
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
  if(Math.floor(G.day)!==st.dispatchDay){st.dispatchDay=Math.floor(G.day);for(const c of st.contracts){if(!this.closed(c)&&(G.emps[c.a]?.dead||G.emps[c.b]?.dead)){c.status='expired';c.reason='Taraf devlet yok oldu; yeni yükleme yok';}if(G.day>=c.until&&!this.closed(c)){c.status='expired';c.reason='Süre doldu; yeni yükleme yok';}if(!this.closed(c)&&G.day>=c.next){this.dispatch(c);if(c.status==='blocked')c.next=G.day+10;}}this.raidTick();}
  let armedAtArrival=null;
  for(const v of st.convoys){
   if(this.terminal(v))continue;const a=G.emps[v.e],b=G.emps[v.to];
   if(!a||a.dead||!b||b.dead){this.finish(v,'destroyed','Taraflardan biri yok oldu');continue;}
   const why=this.pairGate(a,b)||(!this.port(a,v.source)||!this.port(b,v.target)?'Liman kaybedildi veya yok oldu':null)||(G.sys[v.at]?.cr>0?'Konvoy sistemi muharebe ablukasında':null);
   if(why){this.block(v,why);continue;}
   if(v.status==='attacked'&&G.day<v.depart)continue;
   if(v.status==='preparing'&&G.day<v.depart)continue;
   if(v.status==='blocked'){
    if(v.at===v.target){this.finish(v,'delivered','Varış limanı yeniden teslim almaya hazır');continue;}
    if(G.day<v.retryAt)continue;v.retryAt=G.day+10;
    // An interrupted edge resumes only if that physical edge is still valid.
    const next=v.route[v.step+1],s=G.sys[v.at];
    if(v.t>0&&s?.lanes.includes(next)&&!(G.sys[next].owner>=0&&(a.war[G.sys[next].owner]||b.war[G.sys[next].owner]))){v.status='moving';}
    else{const path=this.route(a,b,v.at,v.target,{inFlight:true});if(!path){this.block(v,'Açık alternatif rota yok');continue;}v.route=path;v.step=0;v.t=0;}
   }
   const ready=Math.max(0,G.day-Math.max(G.day-dt,v.depart));
   v.status='moving';v.reason='Gerçek kargo yolda';v.blockedSince=null;let remaining=ready;
   // A route is at most three edges. A large simulation step still accounts for each arrival.
   for(let hops=0;hops<4&&!this.terminal(v);hops++){
    if(v.at===v.target){this.finish(v,'delivered','Varış limanına ulaştı');break;}
    const from=G.sys[v.route[v.step]],next=G.sys[v.route[v.step+1]];
    if(!from||!next||!from.lanes.includes(next.id)||next.owner>=0&&(a.war[next.owner]||b.war[next.owner])){this.block(v,'Hiper-yol kapalı / düşman denetiminde');break;}
    if(next.cr>0){this.block(v,'Sonraki sistem muharebe / abluka altında');break;}
    const days=Math.max(1,dist(from,next)/this.speed),need=(1-v.t)*days;
    if(remaining<need){v.t+=remaining/days;remaining=0;this.position(v);break;}
    remaining-=need;v.step++;v.at=next.id;v.t=0;v.x=next.x;v.y=next.y;this.note(v,'arrived:'+next.id);
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
  for(const c of st.contracts)if(!this.closed(c))for(const l of c.legs){if(l.e===e.id)out[l.r]=(out[l.r]||0)+l.v*30/l.every;if(l.to===e.id)incoming[l.r]=(incoming[l.r]||0)+l.v*30/l.every;}
  const base={ene:80,min:60,yiy:40,ala:60,tuk:40},rows={};
  for(const r of this.resources){const stock=Math.max(0,e.res[r]||0),net=(e.inc?.[r]||0)-(out[r]||0),reserve=base[r]+Math.max(0,-net)*6;
   rows[r]={stock,net,reserve,incoming:incoming[r]||0,export:Math.max(0,Math.min(stock-reserve,Math.max(0,net)*.45+Math.max(0,stock-reserve)/12)),need:Math.max(0,-net)+Math.max(0,base[r]*2-stock)/6};
  }return rows;
 },
 /* 96C.1: bounded derived topology memo, used only during an AI opportunity pass.
    Exact signature includes world identity, lanes/owners/knowledge, all wars and
    raid deadlines. Ports/pacts/embargo/stock gates are always evaluated live. */
 aiRouteSignature(){return JSON.stringify([G.sys.map(s=>[s.id,s.owner,s.lanes,s.seen,s.cr]),G.emps.map(e=>[e.id,e.dead,e.war]),G.p?G.sys.map(s=>this.known(G.p,s)):[],Object.entries(G.raids||{}).map(([k,until])=>[k,until>G.day])]);},
 aiPortRoute(a,b,source,target){
  const scope=this._aiRouteScope;if(!scope)return this.route(a,b,source,target,{avoidObserved:true});
  const key=[a.id,b.id,source,target,...[...this.aiHazards(a)].sort((x,y)=>x-y)].join(':');
  if(scope.paths.has(key))return scope.paths.get(key)?.slice()||null;
  const path=this.route(a,b,source,target,{avoidObserved:true});if(scope.paths.size>=2048)scope.paths.clear();scope.paths.set(key,path?.slice()||null);return path;
 },
 aiPorts(a,b,budget){
  let best=null;
  const pairs=tradeHubs(a).flatMap(source=>tradeHubs(b).map(target=>({source,target,d:dist(G.sys[source],G.sys[target])}))).sort((x,y)=>x.d-y.d||x.source-y.source||x.target-y.target);
  const start=(Math.floor(G.day/30)+a.id+b.id)%Math.max(1,pairs.length);
  for(let i=0;i<Math.min(3,pairs.length);i++){const {source,target}=pairs[(start+i)%pairs.length];
   if(budget.routes<=0)return best;budget.routes--;
   const path=this.aiPortRoute(a,b,source,target);if(!path)continue;
   // Only the actor's observed pirate/hostile locations can inform risk selection.
   const view=aiView(a);if(path.some(id=>view.ctx.pirates.has(id)||aiObservedThreat(a,id,false)>0))continue;
   const distance=path.slice(1).reduce((n,id,i)=>n+dist(G.sys[path[i]],G.sys[id]),0);
   if(!best||distance<best.distance)best={source,target,distance};
  }return best;
 },
 aiValue(e,n){return evalOffer({...e},n);},
 aiTerms(a,b,A,B,ports){
  let best=null;
  const exports=this.resources.filter(r=>A[r].export>=1).sort((x,y)=>A[y].export-A[x].export).slice(0,3);
  const imports=this.resources.filter(r=>B[r].export>=1).sort((x,y)=>A[y].need-A[x].need).slice(0,3);
  for(const r of exports)for(const q of imports){
   if(r===q||A[q].need<=0&&B[r].need<=0)continue;
   const travel=ports.distance??dist(G.sys[ports.source],G.sys[ports.target]),period=Math.min(180,Math.max(30,Math.ceil((travel/this.speed+this.prepareDays*2)/30)*30));
   for(const every of [...new Set([period,Math.min(180,period*2)])]){
    const cap=Math.min(routeVolume(a,ports.source,ports.target),routeVolume(b,ports.target,ports.source));
    const make=(v,w)=>({from:a.id,to:b.id,give:[{t:'freight',r,v,source:ports.source,target:ports.target,every,months:12}],want:[{t:'freight',r:q,v:w,source:ports.target,target:ports.source,every,months:12}]});
    const unit=make(1,1),buyer=this.aiValue(b,unit),seller=this.aiValue(a,{from:b.id,to:a.id,give:unit.want,want:unit.give});
    if(buyer.hardLock||seller.hardLock||buyer.cost<=0||seller.gain<=0)continue;
    const low=seller.cost/seller.gain*1.04,high=buyer.gain/buyer.cost*.96;if(low>=high)continue;
    const ratio=Math.sqrt(low*high),maxA=Math.min(16,cap,A[r].export*every/30,A[r].stock-A[r].reserve),maxB=Math.min(16,cap,B[q].export*every/30,B[q].stock-B[q].reserve);
    const amount=Math.floor(Math.min(maxA,maxB/ratio)*10)/10,payment=Math.floor(amount*ratio*10)/10;if(amount<1||payment<1)continue;
    const n=make(amount,payment),receiver=this.aiValue(b,n),owner=this.aiValue(a,{from:b.id,to:a.id,give:n.want,want:n.give});
    if(receiver.net<=0||owner.net<=0)continue;
    const score=(Math.min(amount,B[r].need*every/30)+Math.min(payment,A[q].need*every/30))*30/every;
    if(!best||score>best.score)best={n,score};
   }
  }return best?.n||null;
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
  this._aiRouteScope=this._aiRouteMemo;
  try{return this.aiOpportunityTick();}finally{this._aiRouteScope=null;}
 },
 aiOpportunityTick(){
  const st=this.state(),month=Math.floor(G.day/30),budget={routes:96};let created=0;
  const normal=e=>e&&!e.dead&&!e.wild&&!e.crisisSide;
  const balances=new Map(G.emps.filter(e=>normal(e)&&e.ai&&e.id!==0).map(e=>[e.id,this.aiBalance(e)]));
  for(const a of G.emps){if(!normal(a)||!a.ai||a.id===0||st.aiAt[a.id]===month)continue;st.aiAt[a.id]=month;
   for(const c of st.contracts)if([c.a,c.b].includes(a.id)&&!this.closed(c)){
    const leg=c.legs.find(l=>l.e===a.id),row=balances.get(a.id)[leg.r];
    if(c.cycle>0&&(Object.values(c.lost).reduce((x,y)=>x+y,0)>Object.values(c.delivered).reduce((x,y)=>x+y,0)+20||row.net<0&&row.stock<row.reserve)){
     this.cancel(c.id,a);AIDiagnostics.note('trade-review-cancel',a,null,'Loss or outgoing reserve pressure; existing cargo remains physical');
    }
   }
   if(created>=4)break;
   for(const b of G.emps.slice().sort((x,y)=>Number(x.id===0)-Number(y.id===0)||x.id-y.id)){
    if(!normal(b)||b===a||b.id!==0&&(!b.ai||a.id>b.id))continue;
    const note=(code,why)=>AIDiagnostics.note(code,a,b,why);
    if(!a.contact[b.id]||!b.contact[a.id]){note('trade-no-contact');continue;}
    if(st.contracts.some(c=>!this.closed(c)&&[c.a,c.b].includes(a.id)&&[c.a,c.b].includes(b.id))){note('trade-existing');continue;}
    const political=this.pairGate(a,b);if(political&&political!=='Genel ticaret anlaşması yok'){note('trade-political',political);continue;}
    const wait=a.aiTalk?.['commerce:'+b.id];if(wait?.until>G.day){note('trade-cooldown',wait.reason);continue;}
    if(!tradeHubs(a).length||!tradeHubs(b).length){note('trade-no-port');continue;}
    const A=balances.get(a.id),B=balances.get(b.id);
    if(b.id!==0&&!this.resources.some(r=>A[r].export>=1&&B[r].need>0||B[r].export>=1&&A[r].need>0)){note('trade-no-supply-demand');continue;}
    const ports=this.aiPorts(a,b,budget);if(!ports){note(budget.routes<=0?'trade-route-budget':'trade-no-safe-route');continue;}
    const n=b.id===0?this.aiPlayerTerms(a,A,ports):this.aiTerms(a,b,A,B,ports);
    const cool=(reason,days=120)=>{(a.aiTalk||(a.aiTalk={}))['commerce:'+b.id]={until:G.day+days,reason};note(reason);};
    if(!n){cool('trade-no-fair-ratio',60);continue;}
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
  if(!raw){G.commerce=this.empty();return;}
  if(raw.v!==1||!raw.stats||typeof raw.stats!=='object'||Array.isArray(raw.stats)||!raw.aiAt||typeof raw.aiAt!=='object'||!Array.isArray(raw.contracts)||!Array.isArray(raw.convoys)||raw.contracts.length>256||raw.convoys.length>this.maxConvoys+this.historyLimit)throw Error('Geçersiz ticaret kaydı');
  const st=JSON.parse(JSON.stringify(raw)),ids=new Set(),cids=new Set(),num=n=>Number.isFinite(n)&&n>=0&&n<=Number.MAX_SAFE_INTEGER;
  for(const c of st.contracts){if(!Number.isSafeInteger(c.id)||cids.has(c.id)||!Array.isArray(c.legs)||c.legs.length!==2||!num(c.next)||!num(c.until)||!num(c.cycle)||!this.labels[c.status])throw Error('Bozuk sözleşme');cids.add(c.id);for(const l of c.legs)if(!this.resources.includes(l.r)||!num(l.v)||l.v<=0||!G.emps[l.e]||!G.emps[l.to]||!G.sys[l.source]||!G.sys[l.target])throw Error('Bozuk sözleşme yükü');}
  for(const v of st.convoys){if(!Number.isSafeInteger(v.id)||ids.has(v.id)||!cids.has(v.contract)||!G.emps[v.e]||!G.emps[v.to]||!this.resources.includes(v.r)||!Array.isArray(v.route)||v.route.length>4||!v.route.length||v.route.some(id=>!G.sys[id])||!Number.isInteger(v.step)||v.step<0||v.step>=v.route.length||!num(v.t)||v.t>1||!['loaded','amount','delivered','lost','plundered','x','y','started','depart','riskAt'].filter(k=>!['x','y','riskAt'].includes(k)).every(k=>num(v[k]))||!Number.isFinite(v.x)||!Number.isFinite(v.y)||!this.labels[v.status]||Math.abs(v.loaded-v.amount-v.delivered-v.lost)>1e-6||this.terminal(v)&&v.amount!==0)throw Error('Bozuk konvoy / kargo muhasebesi');ids.add(v.id);}
  for(const [id,stats] of Object.entries(st.stats||{})){if(!G.emps[id]||!stats||!Number.isSafeInteger(stats.deliveries)||stats.deliveries<0)throw Error('Bozuk ticaret sayacı');for(const key of ['loaded','sent','received','lost','destroyed','plundered','lootReceived']){if(!stats[key]||typeof stats[key]!=='object'||Array.isArray(stats[key])||Object.entries(stats[key]).some(([r,n])=>!this.resources.includes(r)||!num(n)))throw Error('Bozuk kargo toplamı');}}
  if(st.clock!==null&&!num(st.clock))throw Error('Bozuk ticaret saati');
  if(st.convoys.some(v=>v.at!==v.route[v.step]||!Array.isArray(v.attackers)||v.attackers.some(id=>!Number.isSafeInteger(id))||this.terminal(v)&&v.receipt!==v.id))throw Error('Bozuk konum / teslimat makbuzu');
  if(!Number.isSafeInteger(st.nextConvoy)||st.nextConvoy<=Math.max(0,...ids)||!Number.isSafeInteger(st.nextContract)||st.nextContract<=Math.max(0,...cids))throw Error('Ticaret kimliği tekrar edebilir');
  G.commerce=st; // No dispatch, payment, arrival, history synthesis or RNG during loading.
 },
};
