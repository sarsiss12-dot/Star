'use strict';
/* 95E — bounded history. Observation, storage and presentation are separate.
   Hidden records have an independent quota: no count/eviction side channel.
   Knowledge is frozen at the event; contact does not retroactively declassify. */
const GalacticNews = {
  limit:1000, hiddenLimit:256, pinLimit:20,
  categories:{war:'Savaş',peace:'Barış',federation:'Federasyon',politics:'Siyaset',territory:'Toprak',colony:'Koloni',council:'Konsey',economy:'Ekonomi / ticaret',crisis:'Kriz',espionage:'Casusluk',construction:'İnşaat'},
  empty(){return {v:1,next:1,hiddenNext:1,records:[],hidden:[]};},
  state(){return G.news||(G.news=this.empty());},
  known(id){return id===G.p?.id||!!G.p?.contact?.[id];},
  visibility(e){
    const ids=e.empires||[],self=ids.includes(G.p?.id);
    if(!G.p||!ids.every(id=>this.known(id)))return '';
    if(e.system!==undefined){const s=G.sys[e.system];if(!s||!pSeen(s))return '';if(!self&&!pVis(s))return '';}
    if(e.scope==='player')return self?'Doğrudan katılım':'';
    if(e.scope==='public')return 'Öğrenilmiş galaktik duyuru';
    if(e.federation){const f=e.federation;if(!(e.bonds||f.members).every(id=>knownFederationBond(G.p,f,id)))return '';return 'Bilinen federasyon ilişkileri';}
    if(self)return 'Doğrudan katılım';
    if(e.system!==undefined)return 'Görüş / sensör gözlemi';
    return ids.length&&ids.some(id=>intelOf(G.p,id)>=3)?'Diplomatik istihbarat (seviye 3)':'';
  },
  emit(e){
    if(typeof _loadTxActive!=='undefined'&&_loadTxActive||G._newsSetup||!G.p||!Object.hasOwn(this.categories,e.category))return null;
    const st=this.state(),knowledge=this.visibility(e),list=knowledge?st.records:st.hidden;
    const key=String(e.key||[e.category,G.day,e.empires,e.system,e.planet,e.title].join('|')).slice(0,240);
    if(list.some(r=>r.key===key))return null;
    const text=v=>String(v||'').slice(0,800);
    const r={id:knowledge?st.next++:st.hiddenNext++,key,day:G.day,year:G.year,month:G.month,category:e.category,
      title:text(e.title).slice(0,180),text:text(e.text),important:!!e.important,read:false,pinned:false,knowledge,
      empires:[...new Set(e.empires||[])].filter(id=>Number.isInteger(id)&&G.emps[id]).slice(0,16).map(id=>({id,name:text(G.emps[id].name).slice(0,120)}))};
    if(Number.isInteger(e.system)&&G.sys[e.system]){r.system={id:e.system,name:text(G.sys[e.system].name).slice(0,120)};
      const p=G.sys[e.system].planets.find(p=>p.i===e.planet);if(p)r.planet={id:p.i,name:text(p.name).slice(0,120)};}
    if(e.federation)r.federation={id:e.federation.id,name:text(e.federation.name).slice(0,120)};
    if(knowledge){const hidden=st.hidden.findIndex(x=>x.key===key);if(hidden>=0)st.hidden.splice(hidden,1);}
    list.push(r);this.trim(list,knowledge?this.limit:this.hiddenLimit);return r;
  },
  trim(list,limit){while(list.length>limit){const i=list.findIndex(r=>!r.pinned);list.splice(i<0?0:i,1);}},
  list({category='',query='',unread=false,pinned=false}={}){const q=String(query).slice(0,160).toLocaleLowerCase('tr');return this.state().records.filter(r=>(!category||r.category===category)&&(!unread||!r.read)&&(!pinned||r.pinned)&&(!q||[r.title,r.text,...r.empires.map(x=>x.name),r.system?.name].join(' ').toLocaleLowerCase('tr').includes(q))).slice().reverse();},
  unread(){return this.state().records.reduce((n,r)=>n+!r.read,0);},
  get(id){return this.state().records.find(r=>r.id===+id);},
  pin(id){const r=this.get(id);if(!r)return false;if(!r.pinned&&this.state().records.filter(r=>r.pinned).length>=this.pinLimit)return false;r.pinned=!r.pinned;return true;},
  restore(raw){
    const st=this.empty(),read=(list,visible,limit)=>{const out=[],ids=new Set(),keys=new Set();for(const r of (Array.isArray(list)?list:[]).slice(-limit)){
      if(!r||!Number.isSafeInteger(r.id)||r.id<1||ids.has(r.id)||typeof r.key!=='string'||keys.has(r.key)||!Object.hasOwn(this.categories,r.category)||![r.day,r.year,r.month].every(Number.isFinite)||typeof r.title!=='string'||typeof r.text!=='string'||!Array.isArray(r.empires)||visible&&!r.knowledge)continue;
      ids.add(r.id);keys.add(r.key);const x={id:r.id,key:r.key.slice(0,240),day:r.day,year:r.year,month:r.month,category:r.category,title:r.title.slice(0,180),text:r.text.slice(0,800),knowledge:visible?String(r.knowledge).slice(0,100):'',read:!!r.read,pinned:!!r.pinned,important:!!r.important,
        empires:r.empires.filter(x=>x&&Number.isSafeInteger(x.id)&&typeof x.name==='string').slice(0,16).map(x=>({id:x.id,name:x.name.slice(0,120)}))};
      for(const k of ['system','planet','federation'])if(r[k]&&Number.isSafeInteger(r[k].id)&&typeof r[k].name==='string')x[k]={id:r[k].id,name:r[k].name.slice(0,120)};
      out.push(x);
    }return out;};
    if(raw?.v===1){st.records=read(raw.records,true,this.limit);st.hidden=read(raw.hidden,false,this.hiddenLimit);st.next=Math.max(1,Number.isSafeInteger(raw.next)?raw.next:1,...st.records.map(x=>x.id+1));st.hiddenNext=Math.max(1,...st.hidden.map(x=>x.id+1));let pins=0;for(const r of st.records)if(r.pinned&&++pins>this.pinLimit)r.pinned=false;}
    G.news=st;
  },
  political(f,event,data={}){
    const labels={founded:'Federasyon kuruldu',join:'Federasyona katılım',leave:'Federasyondan ayrılış',expel:'Federasyondan ihraç',reformComplete:'Federasyon reformu tamamlandı',motion:'Federasyon kararı',warDecision:'Ortak savaş kararı',dissolved:'Federasyon dağıldı'};
    if(!labels[event])return;
    const ids=[...new Set([...f.members,...(Number.isInteger(data.target)&&G.emps[data.target]?[data.target]:[])])];
    // Removed members are checked against the pre-removal bond snapshot.
    const snap={...f,members:ids};
    this.emit({category:'federation',federation:snap,bonds:ids,empires:ids,key:'fed:'+f.id+':'+event+':'+G.day+':'+(data.target??'')+':'+(f.history?.length||0),title:labels[event],text:f.name+' — '+(data.kind||data.type||event),important:event==='founded'||event==='dissolved'});
  },
  location(r){const s=r?.system&&G.sys[r.system.id];return s&&pSeen(s)?s:null;}
};
