'use strict';
/* 95E — references to existing diplomatic actions, never a second engine. */
const DiplomaticInbox = {
  historyLimit:256, pendingLimit:512,
  types:{aideal:'Diplomatik teklif',pact:'İstihbarat anlaşması',submit:'Vasallık / himaye talebi',peace:'Barış teklifi',sqOffer:'Statüko barışı',fedvote:'Federasyon oylaması',invite:'Federasyona katılım daveti',decision:'Ortak savaş kararı'},
  states:{pending:'Bekliyor',accepted:'Kabul edildi',rejected:'Reddedildi',expired:'Süresi doldu',invalid:'Geçersizleşti'},
  empty(){return {v:1,next:1,records:[]};},
  state(){return G.diplomaticInbox||(G.diplomaticInbox=this.empty());},
  supported(kind){return Object.hasOwn(this.types,kind);},
  capture(note){
    if(!this.supported(note.kind)||!G.p)return null;
    const st=this.state(),kind=note.kind,data=note.data;
    const from=kind==='aideal'||kind==='pact'||kind==='submit'?data?.from:kind==='fedvote'?fedOf(data)?.vote?.proposer:data;
    if(!Number.isInteger(from)||!G.emps[from])return null;
    const f=kind==='fedvote'?fedOf(data):null;
    const key=kind==='fedvote'?'vote:'+f.id+':'+fedVoteToken(f.vote):kind==='aideal'?'deal:'+offerSignature(data)+':'+data.born:kind+':'+from+':'+(note.key||'')+':'+(note.born??G.day);
    let rec=st.records.find(r=>r.key===key);if(rec)return rec;
    if(st.records.filter(r=>r.status==='pending').length>=this.pendingLimit)return null;
    const encoded=encodeNote({...note,uid:note.uid||1,born:note.born??G.day});if(!encoded)return null;
    const born=note.born??G.day,expires=kind==='aideal'?data.expires:kind==='fedvote'?f.vote.expires:kind==='peace'?(G.emps[from]._peaceOffer?.expires??born+540):born+180;
    rec={id:st.next++,key,kind,from,name:String(G.emps[from].name).slice(0,120),title:String(note.title||this.types[kind]).slice(0,180),sub:String(note.sub||'').slice(0,600),born,year:G.year,month:G.month,expires:Number.isFinite(expires)?expires:born+540,status:'pending',note:encoded};
    if(f){rec.fid=f.id;rec.token=fedVoteToken(f.vote);}
    st.records.push(rec);this.trim();return rec;
  },
  source(kind,key,from,fid,token,expires,title,sub){
    const st=this.state();if(st.records.some(r=>r.key===key)||st.records.filter(r=>r.status==='pending').length>=this.pendingLimit)return;
    if(!G.emps[from])return;
    st.records.push({id:st.next++,key,kind,from,name:String(G.emps[from].name).slice(0,120),fid,token,expires,title:String(title).slice(0,180),sub:String(sub).slice(0,600),born:G.day,year:G.year,month:G.month,status:'pending'});
  },
  sync(){
    if(!G.p)return;
    for(const f of G.feds||[]){
      const inv=f.invites?.[G.p.id];
      if(inv&&inv.expires>G.day)this.source('invite','invite:'+f.id+':'+inv.expires,inv.by,f.id,String(inv.expires),inv.expires,'Federasyona katılım — '+f.name,fedType(f).n+' · '+fedDutyText(f));
      if(f.vote&&fedVoteCounts(f).waiting.includes(G.p.id))this.capture({kind:'fedvote',data:f.id,born:f.vote.opened,title:'Federasyon oylaması — '+f.name,sub:fedVoteLaw(f.vote)?.n||'Karar'});
      for(const d of Object.values(f.decisions||{}))if(d.state==='ready'&&d.expires>G.day&&f.members.includes(G.p.id)&&(d.by===G.p.id||f.leader===G.p.id))this.source('decision','decision:'+f.id+':'+d.id,d.by,f.id,String(d.id),d.expires,'Ortak savaş kararı — '+f.name,'Hedef: '+(G.p.contact?.[d.target]?G.emps[d.target]?.name:'Bilinmeyen hedef')+' · '+d.kind);
    }
    for(const r of this.state().records)if(r.status==='pending'){
      if(G.day>=r.expires){r.status='expired';r.finished=G.day;continue;}
      if(this.deal(r))continue; // quote only on inspection/commit, not every daily tick
      const gate=this.gate(r);if(gate.terminal){r.status=gate.status||'invalid';r.why=gate.why;r.finished=G.day;}
    }
    this.trim();
  },
  trim(){const st=this.state(),history=st.records.filter(r=>r.status!=='pending');if(history.length>this.historyLimit){const drop=new Set(history.slice(0,history.length-this.historyLimit).map(r=>r.id));st.records=st.records.filter(r=>!drop.has(r.id));}},
  get(id){return this.state().records.find(r=>r.id===+id);},
  pending(){return this.state().records.filter(r=>r.status==='pending'&&r.expires>G.day).length;},
  deal(r){if(r.kind==='aideal')return encodeOffer(r.note?.data);if(r.kind==='pact'){const t=r.note?.data?.tur;return {from:r.from,to:0,give:[{t}],want:t==='intel'?[{t}]:[],born:r.born,expires:r.expires};}if(r.kind==='peace')return {from:r.from,to:0,give:[{t:'peace'}],want:[],born:r.born,expires:r.expires};return null;},
  settleSource(kind,fid,token,status){for(const r of this.state().records)if(r.status==='pending'&&r.kind===kind&&r.fid===fid&&r.token===String(token)){r.status=status;r.finished=G.day;}},
  findDeal(offer){if(!offer||offer.to!==0||offer.from===0)return null;const key=offerSignature(offer);return this.state().records.find(r=>r.kind==='aideal'&&r.note?.data?.born===offer.born&&offerSignature(r.note.data)===key)||null;},
  gate(r){
    const no=(why,terminal=false,status)=>({ok:false,why,terminal,status});
    if(!r||r.status!=='pending')return no('Teklif sonuçlandı',true);
    if(G.day>=r.expires)return no('Teklifin süresi doldu',true,'expired');
    const o=G.emps[r.from];if(!G.p||G.p.dead||!o||o.dead)return no('Taraf artık mevcut değil',true);
    const offer=this.deal(r);if(offer){const q=dealQuote(offer);return {ok:q.ok,why:q.reasons?.join(' · ')||'',quote:q};}
    if(r.kind==='submit'){
      if(isVassal(o))return no('Gönderen artık bağımsız değil',true);
      const q=aiProtection(o,G.p);return q.ok&&o.res.etk>=VASSAL_SEEK_COST?{ok:true}:no(q.why||'Gönderenin Etkisi yetersiz');
    }
    if(r.kind==='sqOffer')return G.p.war[o.id]?canStatusQuo(G.p,o):no('Savaş sona erdi',true);
    const f=fedOf(r.fid);if(!f)return no('Federasyon artık mevcut değil',true);
    if(r.kind==='invite'){
      const inv=f.invites?.[G.p.id];if(!inv||String(inv.expires)!==r.token)return no('Davet geri çekildi veya sonuçlandı',true,f.members.includes(G.p.id)?'accepted':'invalid');
      if(inv.terms!==fedCharterKey(f))return no('Davetin yükümlülükleri değişti',true);
      return fedAdmissionGate(f,G.p);
    }
    if(r.kind==='fedvote'){
      if(!f.vote||fedVoteToken(f.vote)!==r.token)return no('Oylama kapandı',true);
      if(!fedVoteCounts(f).waiting.includes(G.p.id))return no('Bu oylamada karar verildi',true,(f.vote.yes||[]).includes(G.p.id)?'accepted':'rejected');
      return {ok:true};
    }
    if(r.kind==='decision'){
      const d=f.decisions?.[r.token];if(!d||d.state!=='ready')return no('Karar sonuçlandı',true,d?.state==='applied'?'accepted':'invalid');
      if(!f.members.includes(G.p.id)||!(d.by===G.p.id||f.leader===G.p.id))return no('Uygulama yetkisi yok',true);
      const target=G.emps[d.target];return target&&!target.dead&&G.p.contact?.[target.id]?{ok:true}:no('Hedef artık bilinen ve geçerli bir devlet değil');
    }
    return no('Desteklenmeyen teklif',true);
  },
  resolve(id,yes,option='haracguzar',world=G.emps){
    if(world!==G.emps)return {ok:false,why:'Oyun kaydı değişti; teklifi yeniden aç'};
    const r=this.get(id),gate=this.gate(r);if(!r||r.status!=='pending'||G.day>=r.expires||yes&&!gate.ok)return {ok:false,why:gate.why||'Teklif geçersiz'};
    let result={ok:true};const o=G.emps[r.from];
    if(yes){
      const offer=this.deal(r);
      if(offer)result={ok:executeDeal(offer)};
      else if(r.kind==='invite')result=acceptFedInvite(G.p,r.fid);
      else if(r.kind==='fedvote')result=castFedVote(G.p,r.fid,r.token,true);
      else if(r.kind==='decision')result=executeFedDecision(G.p,r.fid,r.token);
      else if(r.kind==='sqOffer')result=statusQuoPeace(G.p,o);
      else if(r.kind==='submit'){
        if(!Object.hasOwn(VASSAL_TYPES,option))return {ok:false,why:'Geçersiz vasallık türü'};
        // Existing operation; no asynchronous gap between check and commit.
        result={ok:subjugate(G.p,o,option)};if(result.ok){o.res.etk-=VASSAL_SEEK_COST;o.rel[0]=clamp((o.rel[0]||0)+30,-100,100);}
      }
    }else{
      if(r.kind==='invite')result=rejectFedInvite(G.p,r.fid);
      else if(r.kind==='fedvote')result=castFedVote(G.p,r.fid,r.token,false);
      else if(r.kind==='aideal'&&recordPlayerOfferRefusal(r.note.data))o.rel[0]=clamp((o.rel[0]||0)-5,-100,100);
      else if(r.kind==='submit')o.rel[0]=clamp((o.rel[0]||0)-15,-100,100);
    }
    if(result?.ok){r.status=yes?'accepted':'rejected';r.finished=G.day;G.inbox=(G.inbox||[]).filter(n=>n.uid!==r.note?.uid);this.trim();}
    return result?.ok?{ok:true}:{ok:false,why:result?.why||'İşlem uygulanamadı; güncel şartları incele'};
  },
  restore(raw){
    const st=this.empty(),ids=new Set(),keys=new Set();
    if(raw?.v===1)for(const r of (Array.isArray(raw.records)?raw.records:[]).slice(-(this.pendingLimit+this.historyLimit))){
      if(!r||!Number.isSafeInteger(r.id)||r.id<1||ids.has(r.id)||typeof r.key!=='string'||keys.has(r.key)||!this.supported(r.kind)||!Object.hasOwn(this.states,r.status)||![r.born,r.expires,r.year,r.month].every(Number.isFinite)||!Number.isInteger(r.from))continue;
      const x={id:r.id,key:r.key.slice(0,400),kind:r.kind,status:r.status,from:r.from,name:String(r.name||'Tarihsel devlet').slice(0,120),title:String(r.title||'').slice(0,180),sub:String(r.sub||'').slice(0,600),born:r.born,expires:r.expires,year:r.year,month:r.month};
      if(r.note){const n=decodeNote(r.note);if(!n&&r.status==='pending')continue;x.note=n?encodeNote(n):null;}
      if(Number.isInteger(r.fid))x.fid=r.fid;if(typeof r.token==='string')x.token=r.token.slice(0,120);if(Number.isFinite(r.finished))x.finished=r.finished;
      ids.add(x.id);keys.add(x.key);st.records.push(x);
    }
    st.next=Math.max(1,Number.isSafeInteger(raw?.next)?raw.next:1,...st.records.map(r=>r.id+1));G.diplomaticInbox=st;
    // Legacy saves only have the surviving six notifications; lost history is not invented.
    if(!raw)for(const n of G.inbox||[])this.capture(n);
    this.sync();
  }
};
