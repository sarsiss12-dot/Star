'use strict';
/* STARS MP.3.1 — federasyon ve vasallık ekranı (misafir DİPLOMASİ sekmesi + host MP paneli; MP.3 dip-ui ile yan yana).
   Oyun motoru YOK, kural kopyası YOK: veri host'un oyuncuya özel `pol` görünümünden (polView) gelir; oy rejimi
   açıklaması, ağırlıklar ve çoğunluk kuralı motorun kendi metinleri; vasallık seçenekleri motorun vassalTerms'ünden
   süzülmüş liste (pol.vas.lim); önizleme host'un fedFoundQuote / vassalQuote komutları; her karar host motorunda.
   Bu dosya yalnız arayüz durumu tutar: bölüm, alt sekme, sözleşme taslağı, onay penceresi. */
(function(){
const FSUB=[['gen','GENEL'],['mem','ÜYELER'],['vote','OYLAMALAR'],['inv','DAVETLER']];
const VSUB=[['st','DURUM'],['in','GELEN'],['new','TEKLİF'],['hist','GEÇMİŞ']];
const RES=[['ene','Enerji'],['min','Mineral'],['ala','Alaşım'],['yiy','Yiyecek'],['tuk','Tüketim Malı']];
const WAR={none:'Savaşa katılım yok',defense:'Yalnız savunma savaşları',all:'Senyörün bütün savaşları'};
const AUT={free:'Serbest dış politika',consent:'Dış politika senyör onayıyla'};
const MODE={demand:'Biat iste (sen senyör)',seek:'Himaye iste (sen vasal)',renew:'Sözleşmeyi yeniden müzakere',release:'Barışçıl bağımsızlık'};
const TALK={demand:'Biat talebi',seek:'Himaye talebi'};
const TST={pending:'Bekliyor',accepted:'Kabul edildi',rejected:'Reddedildi',expired:'Süresi doldu',invalid:'Geçersiz'};
const ACT={offer:'teklif',counter:'karşı teklif',accept:'kabul',reject:'ret'};
const CODE={'no-fed':'Bu federasyonda oy hakkın yok.','no-invite':'Geçerli bir davet yok.','no-offer':'Müzakere bulunamadı.','no-target':'Bu devletle bu işlem yapılamaz.',
  'rules:no-vote':'Açık oylama yok.','rules:stale':'Bu tur ya da oylama artık geçerli değil.','rules:expired':'Süre doldu.','rules:voted':'Bu gündemde oyunu kullandın ya da oy hakkın yok.',
  'rules:changed':'Federasyonun yükümlülükleri değişti; davet geçersiz.','rules:no-fed':'Federasyon üyesi değilsin.','rules:fed':'Federasyon kuralı izin vermedi.',
  'rules:closed':'Bu müzakere kapandı.','rules:not-recipient':'Bu tur için karar senin değil.','rules:terms':'Sözleşme hükümleri bu tür için geçersiz.','rules:no-contract':'Geçerli sözleşme yok.',
  'rules:engine':'Oyun kuralı izin vermedi.','rules':'İşlem uygulanamadı; hiçbir şey değişmedi.','bad-params':'Geçersiz istek.',paused:'Oyun duraklatıldı; işlem yapılmadı.',
  'host-yok':'Host bağlı değil; işlem gönderilmedi.',lost:'Bağlantı koptu; sonucu listeden kontrol et.','forged-empire':'Başka devlet adına işlem yapılamaz.','stale-seq':'Eski komut yok sayıldı.'};
const pct=x=>Math.round((+x||0)*100)+'%';
const RNAME={ene:'Enerji',min:'Mineral',ala:'Alaşım',yiy:'Yiyecek',tuk:'Tüketim Malı',ara:'Bilim'};

function create(o){
  const doc=o.root.ownerDocument,esc=o.esc;
  const U={sec:'fed',fsub:'gen',vsub:'st',draft:null,found:{type:'askeri',ballot:'equal',q:null},confirm:null,guard:0,dirty:true,last:'',stats:{renders:0,ms:[]}};
  const data=()=>o.data()||{};
  const P=()=>data().pol||{fed:null,invites:[],apps:[],others:[],canFound:null,vas:{lord:null,subs:[],talks:[],cand:[],costs:{},lim:{},free:0}};
  const me=()=>(data().me||{id:-1});
  const day=()=>data().day||0;
  const off=()=>!o.online();
  const dis=x=>off()||x?' disabled':'';
  const nm=(id,n)=>n||(id===me().id?'Sen':'Bilinmeyen devlet');
  const counts=()=>{const p=P(),v=p.fed&&p.fed.vote;return {fed:(v&&v.mine==='wait'?1:0)+p.invites.filter(x=>x.valid).length,vas:p.vas.talks.filter(t=>t.status==='pending'&&t.to===me().id).length};};
  const pend=()=>{const c=counts();return c.fed+c.vas;};

  /* ---------- federasyon ---------- */
  function fedGen(){
    const p=P(),f=p.fed;
    if(f){return '<div class="mp1-card"><div class="mp3-oh"><b>'+esc(f.n)+'</b><span class="mp1-tag">'+esc(f.type.n)+'</span></div>'+
      '<div class="mp1-sub">'+esc(f.type.d)+'</div>'+
      '<dl class="mp31-dl"><dt>Başkan</dt><dd>'+esc(nm(f.leader,(f.members.find(m=>m.id===f.leader)||{}).n))+'</dd><dt>Üye</dt><dd>'+f.members.length+'</dd>'+
      '<dt>Oy rejimi</dt><dd>'+esc(f.ballot.n)+'</dd><dt>Uyum</dt><dd>'+(+f.cohesion)+'/100</dd><dt>Yasalar</dt><dd>'+(f.laws.length?f.laws.map(l=>esc(l.n)).join(', '):'yok')+'</dd></dl>'+
      '<div class="mp1-sub">'+esc(f.ballot.d)+'</div><div class="mp1-sub">Yükümlülükler: '+esc(f.duty)+'</div>'+
      '<div class="mp1-sub">Üyeliğin sürüyor. Ayrılırsan ittifakların biter ve '+Math.round(f.leaveWait/30)+' ay yeni federasyona giremezsin.</div>'+
      '<button class="mp1-btn warn" data-p="askLeave"'+dis()+'>FEDERASYONDAN AYRIL</button></div>';}
    let h='<div class="mp1-sub">Federasyon üyeliğin yok.</div>';
    if(p.others.length)h+='<div class="mp1-h mp31-h">BAŞVURU</div>'+p.others.map(x=>'<div class="mp1-card" data-fedo="'+(+x.fid)+'"><div class="mp3-oh"><b>'+esc(x.n)+'</b><span class="mp1-tag">'+esc(x.type)+'</span></div>'+
      '<div class="mp1-sub">'+(+x.size)+' üye · '+esc(x.ballot.n)+'. Başvuru 60 Etki; üyeler oylar, sonra kabul senin kararın.</div>'+
      x.vias.map(v=>'<div class="mp31-row"><span>'+esc(nm(v.id,v.n))+' üzerinden'+(v.ok?'':' — <i class="bad">'+esc(v.why)+'</i>')+'</span><button class="mp1-btn" data-p="apply" data-via="'+(+v.id)+'"'+dis(!v.ok)+'>BAŞVUR</button></div>').join('')+'</div>').join('');
    if(p.canFound){const c=p.canFound,F=U.found;
      h+='<div class="mp1-h mp31-h">FEDERASYON KUR</div><div class="mp1-card"><label class="mp1-l" for="mp31Type">Tür</label><select class="mp1-sel" id="mp31Type">'+c.types.map(t=>'<option value="'+esc(t.k)+'"'+(t.k===F.type?' selected':'')+'>'+esc(t.n)+'</option>').join('')+'</select>'+
        '<div class="mp1-sub">'+esc((c.types.find(t=>t.k===F.type)||{}).d||'')+'</div>'+
        '<label class="mp1-l" for="mp31Ballot">Oy rejimi</label><select class="mp1-sel" id="mp31Ballot">'+c.ballots.map(b=>'<option value="'+esc(b.k)+'"'+(b.k===F.ballot?' selected':'')+'>'+esc(b.n)+'</option>').join('')+'</select>'+
        '<div class="mp1-sub">'+esc((c.ballots.find(b=>b.k===F.ballot)||{}).d||'')+'</div>'+
        (F.q?'<div class="mp1-card">Maliyet: <b>'+(+F.q.cost)+'</b> Etki'+(F.q.ok?'<div class="mp3-ok">Kurulabilir.</div>':'<ul class="mp3-items bad">'+F.q.reasons.map(r=>'<li>'+esc(r)+'</li>').join('')+'</ul>')+
          (F.q.candidates.length?'<div class="mp1-sub">Kurucu adaylar: '+F.q.candidates.map(x=>esc(nm(x.id,x.n))+(x.ok?' ✓':' ✗ '+esc(x.why))).join(' · ')+'</div>':'')+'</div>':
          '<div class="mp1-sub">Kurucu üyeler motorun kuralıyla seçilir: kabul eden AI müttefikler. İnsan müttefik ancak kendi açık kararıyla (davet) katılır.</div>')+
        '<div class="mp1-row"><button class="mp1-btn" data-p="foundQ"'+dis()+'>ÖNİZLE</button><button class="mp1-btn pri" data-p="askFound"'+dis(!(F.q&&F.q.ok&&F.q.type===F.type&&F.q.ballot===F.ballot))+'>KUR</button></div></div>';}
    return h;
  }
  function fedMem(){
    const f=P().fed;if(!f)return '<div class="mp1-sub">Federasyon üyeliğin yok.</div>';
    const cs=((data().dip||{}).contacts||[]).filter(c=>!f.members.some(m=>m.id===c.id));
    return '<div class="mp1-card"><div class="mp1-sub">Oy ağırlığı ('+esc(f.ballot.n)+'): '+esc(f.ballot.d)+'</div>'+
      f.members.map(m=>'<div class="mp31-row" data-mem="'+(+m.id)+'"><span><b style="color:'+esc(o.color(m.col))+'">'+esc(nm(m.id,m.n))+'</b>'+(m.id===f.leader?' · başkan':'')+'</span>'+
        '<span class="mp1-tag">'+(m.h?'İNSAN':'AI')+'</span><span class="mp31-w">oy '+(+m.w)+'</span></div>').join('')+'</div>'+
      (cs.length?'<div class="mp1-h mp31-h">ÜYELİĞE DAVET</div><div class="mp1-card"><div class="mp1-sub">Davet bir kabul oylaması açar (60 Etki). Oylama geçerse aday kendisi kabul eder.</div>'+
        cs.map(c=>'<div class="mp31-row"><span>'+esc(c.n)+' <i class="mp1-tag">'+(c.h?'İNSAN':'AI')+'</i></span><button class="mp1-btn" data-p="invite" data-to="'+(+c.id)+'"'+dis(f.vote)+'>DAVET ET</button></div>').join('')+'</div>':'');
  }
  function fedVote(){
    const f=P().fed;if(!f)return '<div class="mp1-sub">Federasyon üyeliğin yok.</div>';
    const v=f.vote,mn=id=>nm(id,(f.members.find(m=>m.id===id)||{}).n),lst=ids=>ids.length?ids.map(id=>esc(mn(id))+' ('+(+(v.w[id]||1))+')').join(', '):'—';
    let h='';
    if(v){h+='<div class="mp1-card mp31-vote" data-vote="'+esc(v.token)+'"><div class="mp3-oh"><b>'+esc(v.n)+(v.repeal?' (kaldırma)':'')+'</b><span class="mp3-st s-pending">'+Math.max(0,v.expires-day())+' gün</span></div>'+
      (v.d?'<div class="mp1-sub">'+esc(v.d)+'</div>':'')+
      '<div class="mp1-sub">Öneren: '+esc(v.proposer===null?'federasyon gündemi':nm(v.proposer,v.pn))+(v.target!==null&&v.target!==undefined?' · konu: '+esc(nm(v.target,v.tn)):'')+'</div>'+
      '<dl class="mp31-dl"><dt>Evet</dt><dd>'+lst(v.yes)+' = '+(+v.cy)+'</dd><dt>Hayır</dt><dd>'+lst(v.no)+' = '+(+v.cn)+'</dd><dt>Bekleyen</dt><dd>'+lst(v.waiting)+'</dd><dt>Toplam</dt><dd>'+(+v.total)+'</dd></dl>'+
      '<div class="mp1-sub">Kural: '+esc(v.rule)+'</div>'+
      (v.mine==='wait'?'<div class="mp1-row"><button class="mp1-btn pri" data-p="askVote" data-yes="1"'+dis()+'>EVET OYU</button><button class="mp1-btn warn" data-p="askVote" data-yes="0"'+dis()+'>HAYIR OYU</button></div>':
        '<div class="mp1-sub">'+(v.mine==='yes'?'Oyun: EVET':v.mine==='no'?'Oyun: HAYIR':'Bu gündemde oy hakkın yok.')+'</div>')+'</div>';}
    else h+='<div class="mp1-sub">Açık oylama yok.</div>';
    if(f.last)h+='<div class="mp1-card"><b>Son oylama: '+esc(f.last.n)+' — '+(f.last.passed?'KABUL':'RED')+'</b><div class="mp1-sub">'+(+f.last.yes)+' evet / '+(+f.last.no)+' hayır / '+(+f.last.abstain)+' çekimser · gün '+(+f.last.day)+'</div><div class="mp1-sub">'+esc(f.last.why)+'</div></div>';
    const laws=f.lawsOpen.filter(l=>l.ok);
    h+='<div class="mp1-h mp31-h">YASA ÖNER</div>'+(laws.length?laws.map(l=>'<div class="mp31-row" data-law="'+esc(l.k)+'"><span>'+esc(l.n)+(l.on?' (kaldır)':'')+' · '+(+l.cost)+' Etki</span><button class="mp1-btn" data-p="law" data-law="'+esc(l.k)+'" data-rep="'+(l.on?1:0)+'"'+dis(v)+'>ÖNER</button></div>').join(''):
      '<div class="mp1-sub">Şu an önerilebilecek yasa yok'+(f.lawsOpen[0]&&f.lawsOpen[0].why?' ('+esc(f.lawsOpen[0].why)+')':'')+'.</div>');
    return h;
  }
  function fedInv(){
    const p=P();let h='';
    h+=p.invites.length?p.invites.map(x=>'<div class="mp1-card" data-finv="'+(+x.fid)+'"><div class="mp3-oh"><b>'+esc(x.n)+'</b><span class="mp1-tag">'+esc(x.type)+'</span></div>'+
      '<div class="mp1-sub">'+(+x.size)+' üye'+(x.members.length?': '+x.members.map(esc).join(', '):'')+' · '+esc(x.ballot.n)+' · davet eden '+esc(nm(x.by,x.bn))+' · '+Math.max(0,x.expires-day())+' gün</div>'+
      '<div class="mp1-sub">Yükümlülükler: '+esc(x.duty)+'</div>'+(x.gate?'<div class="mp1-sub bad">'+esc(x.gate)+'</div>':'')+(x.valid?'':'<div class="mp1-sub bad">Davet artık geçerli değil.</div>')+
      '<div class="mp1-row"><button class="mp1-btn pri" data-p="askJoin" data-fed="'+(+x.fid)+'"'+dis(!x.valid||x.gate)+'>KATIL</button><button class="mp1-btn warn" data-p="askDecline" data-fed="'+(+x.fid)+'"'+dis()+'>REDDET</button></div></div>').join(''):
      '<div class="mp1-sub">Gelen federasyon daveti yok.</div>';
    if(p.apps.length)h+='<div class="mp1-h mp31-h">BAŞVURULARIN</div>'+p.apps.slice().reverse().map(a=>'<div class="mp1-card"><div class="mp3-oh"><b>'+esc(a.n)+'</b><span class="mp3-st s-'+esc(a.status)+'">'+esc(TST[a.status]||a.status)+'</span></div><div class="mp1-sub">'+esc(a.why)+'</div></div>').join('');
    const f=p.fed;if(f&&f.invites.length)h+='<div class="mp1-h mp31-h">FEDERASYONUN DAVETLERİ</div>'+f.invites.map(x=>'<div class="mp31-row"><span>'+esc(nm(x.id,x.n))+'</span><span class="mp1-sub">'+Math.max(0,x.expires-day())+' gün</span></div>').join('');
    return h;
  }

  /* ---------- vasallık ---------- */
  function terms(t,type){
    const L=P().vas.lim[type]||{};
    return '<dl class="mp31-dl"><dt>Tür</dt><dd>'+esc(L.n||type)+'</dd><dt>Vergi</dt><dd>'+RES.map(([k,n])=>esc(n)+' '+pct(t.tax[k])).join(' · ')+'</dd><dt>Bilim payı</dt><dd>'+pct(t.science)+'</dd>'+
      '<dt>Savunma</dt><dd>'+(t.defense?'Senyör korur':'Koruma yükümlülüğü yok')+'</dd><dt>Savaş</dt><dd>'+esc(WAR[t.war]||t.war)+'</dd><dt>Özerklik</dt><dd>'+esc(AUT[t.autonomy]||t.autonomy)+'</dd>'+
      '<dt>Süre</dt><dd>'+(t.duration?t.duration+' ay':'Süresiz')+'</dd><dt>Yeniden müzakere</dt><dd>'+(+t.renegotiate)+' ayda bir</dd><dt>Sensör paylaşımı</dt><dd>'+(t.sensors?'Var':'Yok')+'</dd></dl>';
  }
  function ctr(c,role){
    const est=c.est?'<div class="mp1-sub">Aylık tahmini aktarım (motor, gelirden): '+Object.entries(c.est).filter(([,v])=>v>0).map(([k,v])=>esc(RNAME[k]||k)+' '+(+v)).join(' · ')+(Object.values(c.est).some(v=>v>0)?'':'şu an yok')+'</div>':'';
    const other=role==='sub'?nm(c.lord,c.ln):nm(c.sub,c.sn),until=Math.max(0,c.reneg-day());
    return '<div class="mp1-card mp31-ctr" data-ctr="'+(+c.sub)+'"><div class="mp3-oh"><b>'+(role==='sub'?'Senyörün: ':'Vasalın: ')+esc(other)+'</b><span class="mp1-tag">'+esc(c.tn)+'</span></div>'+terms(c.terms,c.type)+est+
      '<div class="mp1-sub">Başlangıç gün '+(+c.started)+(c.expires!==null?' · bitiş gün '+(+c.expires):'')+' · yeniden müzakere '+(until?until+' gün sonra':'şimdi mümkün')+'</div>'+
      '<div class="mp1-row"><button class="mp1-btn" data-p="vdraft" data-to="'+(+(role==='sub'?c.lord:c.sub))+'" data-mode="renew" data-type="'+esc(c.type)+'"'+dis(until>0)+'>YENİDEN MÜZAKERE</button>'+
      (role==='sub'?'<button class="mp1-btn warn" data-p="askRelease" data-to="'+(+c.lord)+'"'+dis()+'>BAĞIMSIZLIK İSTE</button>':'')+'</div></div>';
  }
  function talk(t,mode){
    const mine=t.to===me().id&&t.status==='pending',from=nm(t.from,t.from===t.lord?t.ln:t.sn);
    const kind=t.kind==='release'?'Bağımsızlık talebi':t.kind==='renew'?'Yeniden müzakere':TALK[t.mode]||'Vasallık teklifi';
    return '<div class="mp1-card mp31-talk" data-talk="'+esc(t.id)+'"><div class="mp3-oh"><b>'+esc(kind)+'</b><span class="mp3-st s-'+esc(t.status)+'">'+esc(TST[t.status]||t.status)+'</span></div>'+
      '<div class="mp1-sub">Senyör '+esc(nm(t.lord,t.ln))+' · vasal '+esc(nm(t.sub,t.sn))+' · tur '+(+t.round)+'/3 · son öneren '+esc(from)+(t.status==='pending'?' · '+Math.max(0,t.expires-day())+' gün':'')+'</div>'+
      (t.kind==='release'?'<div class="mp1-sub">Kabul edilirse vasallık barışçıl biter. Ret bağımsızlık vermez, savaş başlatmaz.</div>':terms(t.terms,t.type))+
      (t.hist.length?'<div class="mp1-sub">Geçmiş: '+t.hist.map(x=>'gün '+(+x.day)+' '+esc(nm(x.by,x.by===t.lord?t.ln:t.sn))+' '+esc(ACT[x.action]||x.action)).join(' → ')+'</div>':'')+
      (t.status!=='pending'&&t.why?'<div class="mp1-sub">'+esc(t.why)+'</div>':'')+
      (mine&&mode==='in'?'<div class="mp1-row"><button class="mp1-btn pri" data-p="askV" data-a="accept" data-sub="'+(+t.sub)+'"'+dis()+'>KABUL ET</button><button class="mp1-btn warn" data-p="askV" data-a="reject" data-sub="'+(+t.sub)+'"'+dis()+'>REDDET</button></div>'+
        (t.round<3?'<button class="mp1-btn" data-p="vcounter" data-sub="'+(+t.sub)+'"'+dis()+'>KARŞI TEKLİF ('+(+(P().vas.costs.counter||20))+' Etki)</button>':'<div class="mp1-sub">Üç tur sınırı: karşı teklif verilemez.</div>'):'')+'</div>';
  }
  function vasSt(){
    const v=P().vas;let h='';
    if(v.lord)h+=ctr(v.lord,'sub');
    h+=v.subs.map(c=>ctr(c,'lord')).join('');
    if(!v.lord&&!v.subs.length)h+='<div class="mp1-sub">Bağımsızsın; vasalın da yok.'+(v.free?' Yeni bağımsızlık koruması: '+(+v.free)+' ay.':'')+'</div>';
    const open=v.talks.filter(t=>t.status==='pending'&&t.to!==me().id);if(open.length)h+='<div class="mp1-h mp31-h">YANIT BEKLEYEN</div>'+open.map(t=>talk(t,'out')).join('');
    return h;
  }
  function vasNew(){
    const v=P().vas;if(!v.cand.length)return '<div class="mp1-sub">Temas kurulan uygun devlet yok.</div>';
    return '<div class="mp1-sub">Biat isteme '+(+v.costs.demand)+' Etki, himaye isteme '+(+v.costs.seek)+' Etki (motor). Teklif tek başına vasallık kurmaz; karşı taraf açıkça kabul etmeli.</div>'+
      v.cand.map(c=>'<div class="mp1-card" data-vc="'+(+c.id)+'"><div class="mp3-oh"><b>'+esc(c.n)+'</b><span class="mp1-tag">'+(c.h?'İNSAN':'AI')+'</span></div>'+
        '<div class="mp31-row"><span>'+esc(MODE.demand)+(c.demand?' — <i class="bad">'+esc(c.demand)+'</i>':'')+'</span><button class="mp1-btn" data-p="vdraft" data-to="'+(+c.id)+'" data-mode="demand"'+dis(c.demand)+'>HAZIRLA</button></div>'+
        '<div class="mp31-row"><span>'+esc(MODE.seek)+(c.seek?' — <i class="bad">'+esc(c.seek)+'</i>':'')+'</span><button class="mp1-btn" data-p="vdraft" data-to="'+(+c.id)+'" data-mode="seek"'+dis(c.seek)+'>HAZIRLA</button></div></div>').join('');
  }
  function sel(id,opts,cur,label){return '<label class="mp1-l" for="'+id+'">'+esc(label)+'</label><select class="mp1-sel" id="'+id+'" data-vt="'+id+'">'+opts.map(([v,n])=>'<option value="'+esc(String(v))+'"'+(String(v)===String(cur)?' selected':'')+'>'+esc(n)+'</option>').join('')+'</select>';}
  function draftHtml(){
    const d=U.draft,L=P().vas.lim[d.type]||{},t=d.terms,counter=!!d.counter;
    const title=counter?'KARŞI TEKLİF — tur '+(d.round+1)+'/3':MODE[d.mode];
    let h='<div class="mp1-card mp31-draft"><div class="mp1-h">'+esc(title)+'</div><div class="mp3-to">Karşı taraf: <b>'+esc(nm(d.to,d.tn))+'</b></div>';
    if(d.mode==='release'&&!counter)h+='<div class="mp1-sub">Mevcut sözleşmenle barışçıl bağımsızlık talep edersin ('+(+P().vas.costs.release)+' Etki). Senyör kabul etmezse vasallık sürer; savaş başlamaz.</div>';
    else{
      if(!counter&&d.mode!=='renew')h+=sel('vtType',Object.entries(P().vas.lim).map(([k,x])=>[k,x.n]),d.type,'Vasallık türü')+'<div class="mp1-sub">'+esc(L.d||'')+'</div>';
      else h+='<div class="mp1-sub">Tür: '+esc(L.n||d.type)+'</div>';
      h+='<div class="mp31-grid">'+RES.map(([k,n])=>sel('vtTax_'+k,(L.tax||[]).map(x=>[x,pct(x)]),t.tax[k],n+' vergisi')).join('')+'</div>'+
        sel('vtScience',(L.science||[]).map(x=>[x,pct(x)]),t.science,'Bilim payı')+
        sel('vtDefense',[['true','Senyör korur'],['false','Koruma yok']],String(t.defense),'Savunma yükümlülüğü')+
        sel('vtWar',(L.war||[]).map(x=>[x,WAR[x]]),t.war,'Savaşlara katılım')+sel('vtAutonomy',(L.autonomy||[]).map(x=>[x,AUT[x]]),t.autonomy,'Diplomatik özerklik')+
        sel('vtDuration',(L.duration||[]).map(x=>[x,x?x+' ay':'Süresiz']),t.duration,'Sözleşme süresi')+sel('vtReneg',(L.renegotiate||[]).map(x=>[x,x+' ayda bir']),t.renegotiate,'Yeniden müzakere aralığı')+
        sel('vtSensors',[['false','Yok'],['true','Var']],String(t.sensors),'Sensör paylaşımı');
    }
    const q=d.q,fresh=q&&d.qkey===key(d);
    if(!counter)h+='<div class="mp3-quote" id="mp31Quote">'+(fresh?'<div class="mp1-card">Maliyet (gönderen öder): <b>'+(+q.cost)+'</b> Etki · sende '+(+q.etk)+'<div>Geçerlilik: '+(+q.life)+' oyun günü · en çok '+(+q.rounds)+' tur</div>'+
        (q.est?'<div class="mp1-sub">Senin gelirinden aylık tahmini kesinti: '+Object.entries(q.est).filter(([,v])=>v>0).map(([k,v])=>esc(RNAME[k]||k)+' '+(+v)).join(' · ')+'</div>':'<div class="mp1-sub">Vergi ve bilim payı vasalın gerçek gelirinden alınır (karşı tarafın geliri gizli).</div>')+
        (q.ok?'<div class="mp3-ok">Engel yok. Karşı taraf kabul ederse host motoru uygular.</div>':'<ul class="mp3-items bad">'+q.reasons.map(r=>'<li>'+esc(r)+'</li>').join('')+'</ul>')+'</div>':
        '<div class="mp1-sub">Göndermeden önce ÖNİZLE: maliyet ve engeller host\'un motorundan gelir.</div>')+'</div>'+
      '<div class="mp1-row"><button class="mp1-btn" data-p="vquote"'+dis(d.busy)+'>ÖNİZLE</button><button class="mp1-btn pri" data-p="vsend"'+dis(d.busy||!fresh||!q.ok)+'>GÖNDER</button></div>';
    else h+='<button class="mp1-btn pri" data-p="vsend"'+dis(d.busy)+'>KARŞI TEKLİFİ GÖNDER</button>';
    return h+'<button class="mp1-btn" data-p="vcancel">VAZGEÇ</button></div>';
  }
  const key=d=>JSON.stringify([d.to,d.mode,d.type,d.terms]);

  /* ---------- çizim ---------- */
  function render(force){
    const t0=performance.now(),act=doc.activeElement;
    if(!force&&act&&o.root.contains(act)&&act.matches('input,select'))return void(U.dirty=true);
    const p=P();let html;
    if(U.draft)html=draftHtml();
    else if(U.sec==='fed'){const v=p.fed&&p.fed.vote,inv=p.invites.filter(x=>x.valid).length;
      html='<div class="mp3-sub">'+FSUB.map(([k,n])=>'<button data-p="fsub" data-k="'+k+'" class="'+(U.fsub===k?'on':'')+'">'+n+(k==='vote'&&v&&v.mine==='wait'?' <i class="mp3-badge">1</i>':k==='inv'&&inv?' <i class="mp3-badge">'+inv+'</i>':'')+'</button>').join('')+'</div>'+
        (off()?'<div class="mp1-status bad">Host bağlı değil: işlemler gönderilmez.</div>':'')+({gen:fedGen,mem:fedMem,vote:fedVote,inv:fedInv}[U.fsub]||fedGen)();}
    else{const n=p.vas.talks.filter(t=>t.status==='pending'&&t.to===me().id).length;
      html='<div class="mp3-sub">'+VSUB.map(([k,x])=>'<button data-p="vsub" data-k="'+k+'" class="'+(U.vsub===k?'on':'')+'">'+x+(k==='in'&&n?' <i class="mp3-badge">'+n+'</i>':'')+'</button>').join('')+'</div>'+
        (off()?'<div class="mp1-status bad">Host bağlı değil: işlemler gönderilmez.</div>':'')+
        (U.vsub==='st'?vasSt():U.vsub==='in'?(p.vas.talks.filter(t=>t.status==='pending'&&t.to===me().id).map(t=>talk(t,'in')).join('')||'<div class="mp1-sub">Yanıt bekleyen vasallık teklifi yok.</div>'):
         U.vsub==='new'?vasNew():(p.vas.talks.filter(t=>t.status!=='pending').map(t=>talk(t,'hist')).join('')||'<div class="mp1-sub">Sonuçlanan müzakere yok.</div>'));}
    html='<div class="mp3 mp31">'+html+'</div>';
    if(html!==U.last){o.root.innerHTML=html;U.last=html;}
    U.dirty=false;U.stats.renders++;U.stats.ms.push(performance.now()-t0);if(U.stats.ms.length>200)U.stats.ms.shift();
  }

  /* ---------- onay penceresi (MP.3 ile aynı koruma: EVET ilk 450 ms kapalı, kapanış sonrası 400 ms dokunuş yok) ---------- */
  function ask(title,text,ok,warn,fn){
    close();const el=doc.createElement('div');el.className='mp3-back';el.id='mp3Sheet';
    el.innerHTML='<div class="mp3-sheet" role="dialog" aria-modal="true"><div class="mp1-h">'+esc(title)+'</div><div>'+text+'</div><div class="mp1-row"><button class="mp1-btn" data-s="no">VAZGEÇ</button><button class="mp1-btn '+(warn?'warn':'pri')+'" data-s="ok" disabled>'+esc(ok)+'</button></div></div>';
    doc.body.appendChild(el);U.confirm={el,fn};
    setTimeout(()=>{const b=el.querySelector('[data-s="ok"]');if(b&&U.confirm&&U.confirm.el===el&&!off())b.disabled=false;},450);
    el.addEventListener('click',e=>{e.stopPropagation();e.preventDefault();const s=e.target.closest('[data-s]');
      if(s&&s.dataset.s==='ok'&&!s.disabled){const c=U.confirm;close();c.fn();}else if(!s||s.dataset.s==='no'){if(e.target===el||s)close();}});
  }
  function close(){if(U.confirm){U.confirm.el.remove();U.confirm=null;U.guard=performance.now()+400;return true;}return false;}
  function fail(r){o.toast((CODE[r.code]||r.code)+(r.detail&&r.detail.length?' — '+r.detail.slice(0,2).join(' · '):''),true);}
  function send(cmd,ok,after){const r=o.send(cmd,x=>{if(x.status==='ok'){if(ok)o.toast(ok);}else fail(x);if(after)after(x);render(true);});if(r&&r.ok===false){fail({code:r.why||r.code});if(after)after({status:'rejected'});}}

  function newDraft(to,mode,type,base,extra){const v=P().vas,L=v.lim[type];
    const t=JSON.parse(JSON.stringify(base||(L&&L.def)||{}));U.draft={to,tn:(v.cand.find(c=>c.id===to)||{}).n,mode,type,terms:t,q:null,qkey:'',busy:false,...(extra||{})};}
  function onClick(e){
    if(performance.now()<U.guard){e.preventDefault();e.stopPropagation();return;}
    const b=e.target.closest('[data-p]');if(!b||b.disabled)return;const a=b.dataset.p,p=P(),f=p.fed,d=U.draft;
    if(a==='fsub'){U.fsub=b.dataset.k;render(true);}
    else if(a==='vsub'){U.vsub=b.dataset.k;render(true);}
    else if(a==='askLeave')ask('FEDERASYONDAN AYRIL','<b>'+esc(f.n)+'</b> üyeliğin sona erer; üyelerle ittifakların biter ve 24 ay yeni federasyona giremezsin.','EVET, AYRIL',true,()=>send({kind:'fedLeave'},'Federasyondan ayrıldın'));
    else if(a==='apply')send({kind:'fedRequest',via:+b.dataset.via},'Başvuru federasyon oylamasına girdi');
    else if(a==='invite')send({kind:'fedInvite',target:+b.dataset.to},'Üyelik oylaması açıldı');
    else if(a==='law')send({kind:'fedLaw',law:b.dataset.law,repeal:b.dataset.rep==='1'},'Yasa oylaması açıldı');
    else if(a==='askVote'){const v=f&&f.vote;if(!v)return;const yes=b.dataset.yes==='1',tok=v.token,fid=f.id;
      ask(yes?'EVET OYU':'HAYIR OYU','<b>'+esc(v.n)+'</b> için oyun '+(yes?'EVET':'HAYIR')+' olarak kaydedilsin mi? Oy geri alınamaz.',yes?'EVET OYU VER':'HAYIR OYU VER',!yes,()=>send({kind:'fedVote',fed:fid,token:tok,yes},'Oyun kaydedildi'));}
    else if(a==='askJoin'){const x=p.invites.find(y=>y.fid===+b.dataset.fed);if(!x)return;ask('FEDERASYONA KATIL','<b>'+esc(x.n)+'</b> üyeliği kabul edilsin mi?<div class="mp1-sub">'+esc(x.duty)+'</div>','EVET, KATIL',false,()=>send({kind:'fedReply',fed:x.fid,action:'accept'},'Federasyona katıldın'));}
    else if(a==='askDecline'){const x=p.invites.find(y=>y.fid===+b.dataset.fed);if(!x)return;ask('DAVETİ REDDET','<b>'+esc(x.n)+'</b> daveti reddedilsin mi?','EVET, REDDET',true,()=>send({kind:'fedReply',fed:x.fid,action:'reject'},'Davet reddedildi'));}
    else if(a==='foundQ'){const F=U.found;send({kind:'fedFoundQuote',type:F.type,ballot:F.ballot},null,r=>{if(r.status==='ok')F.q={...r.extra,type:F.type,ballot:F.ballot};});}
    else if(a==='askFound'){const F=U.found;ask('FEDERASYON KUR',esc(F.q.cost)+' Etki ödenir; kabul eden AI müttefikler kurucu olur.','EVET, KUR',false,()=>send({kind:'fedFound',type:F.type,ballot:F.ballot},'Federasyon kuruldu',()=>{F.q=null;U.fsub='gen';}));}
    else if(a==='vdraft'){const to=+b.dataset.to,mode=b.dataset.mode,v=p.vas;
      const c=mode==='renew'?(v.lord&&v.lord.lord===to?v.lord:v.subs.find(x=>x.sub===to)):null;
      newDraft(to,mode,c?c.type:mode==='demand'?'haracguzar':'bekci',c?c.terms:null,c?{tn:c.lord===to?c.ln:c.sn}:null);render(true);}
    else if(a==='askRelease'){const c=p.vas.lord;if(!c)return;newDraft(+b.dataset.to,'release',c.type,c.terms,{tn:c.ln});render(true);}
    else if(a==='vcounter'){const t=p.vas.talks.find(x=>x.sub===+b.dataset.sub&&x.status==='pending');if(!t)return;
      newDraft(t.from,t.kind==='release'?'renew':t.mode,t.type,t.terms,{counter:{sub:t.sub,id:t.id,round:t.round},round:t.round,tn:t.from===t.lord?t.ln:t.sn});render(true);}
    else if(a==='askV'){const t=p.vas.talks.find(x=>x.sub===+b.dataset.sub&&x.status==='pending');if(!t)return;const acc=b.dataset.a==='accept';
      ask(acc?'SÖZLEŞMEYİ KABUL ET':'REDDET',(acc?(t.kind==='release'?'Bağımsızlık talebini kabul edersen vasallık barışçıl biter.':'Bu şartlar host motorunda hemen uygulanır.'):'Teklif reddedilsin mi? Mevcut durum değişmez.')+(t.kind==='release'?'':terms(t.terms,t.type)),
        acc?'EVET, KABUL ET':'EVET, REDDET',!acc,()=>send({kind:'vassalReply',sub:t.sub,id:t.id,round:t.round,action:acc?'accept':'reject'},acc?'Sözleşme kabul edildi':'Reddedildi'));}
    else if(a==='vcancel'){U.draft=null;render(true);}
    else if(a==='vquote'&&d){d.busy=true;const k=key(d);render(true);send({kind:'vassalQuote',to:d.to,mode:d.mode,type:d.type,terms:d.terms},null,r=>{d.busy=false;if(r.status==='ok'){d.q=r.extra;d.qkey=k;}});}
    else if(a==='vsend'&&d){
      if(d.counter){const c=d.counter;ask('KARŞI TEKLİF','Karşı teklif '+(+(p.vas.costs.counter||20))+' Etki ister; tur '+(c.round+1)+'/3 karşı tarafa geçer.'+terms(d.terms,d.type),'GÖNDER',false,()=>{d.busy=true;
        send({kind:'vassalReply',sub:c.sub,id:c.id,round:c.round,action:'counter',terms:d.terms},'Karşı teklif gönderildi',r=>{d.busy=false;if(r.status==='ok'){U.draft=null;U.vsub='st';}});});}
      else if(d.q&&d.q.ok&&d.qkey===key(d))ask(d.mode==='release'?'BAĞIMSIZLIK İSTE':'TEKLİFİ GÖNDER',(d.mode==='release'?'Bağımsızlık talebi senyörüne gider.':'Teklif karşı tarafın kutusuna gider; kabul edilene kadar hiçbir şey değişmez.')+' Maliyet '+(+d.q.cost)+' Etki.','GÖNDER',false,()=>{d.busy=true;
        send({kind:'vassalOffer',to:d.to,mode:d.mode,type:d.type,terms:d.terms},null,r=>{d.busy=false;if(r.status==='ok'){const k=r.extra&&r.extra.karar;const ctr=k==='pending'&&r.extra.round>1;o.toast(k==='accepted'?'Karşı taraf kabul etti — sözleşme yürürlükte':k==='rejected'?'Karşı taraf reddetti':ctr?'Karşı teklif geldi (GELEN)':'Teklif gönderildi',k==='rejected');U.draft=null;U.vsub=ctr?'in':k==='pending'?'st':'hist';}});});}
  }
  function onChange(e){const t=e.target,id=t.id;
    if(id==='mp31Type'){U.found.type=t.value;U.found.q=null;return render(true);}
    if(id==='mp31Ballot'){U.found.ballot=t.value;U.found.q=null;return render(true);}
    const d=U.draft;if(!d||!t.dataset.vt)return;const v=t.value,T=d.terms;
    if(id==='vtType'){const L=P().vas.lim[v];d.type=v;d.terms=JSON.parse(JSON.stringify(L.def));}
    else if(id.startsWith('vtTax_'))T.tax[id.slice(6)]=+v;else if(id==='vtScience')T.science=+v;else if(id==='vtDefense')T.defense=v==='true';else if(id==='vtWar')T.war=v;
    else if(id==='vtAutonomy')T.autonomy=v;else if(id==='vtDuration')T.duration=+v;else if(id==='vtReneg')T.renegotiate=+v;else if(id==='vtSensors')T.sensors=v==='true';
    d.q=null;t.blur();render(true);}
  o.root.addEventListener('click',onClick,true);o.root.addEventListener('change',onChange);
  o.root.addEventListener('focusout',()=>setTimeout(()=>{if(U.dirty)render();},0));
  return {U,render,close,pending:pend,counts,setSection(s){U.sec=s;render(true);},codes:CODE};
}
/* Geri tuşu: açık onay penceresi önce kapanır (join.js popstate bunu sorar). */
const closers=[];
window.__mpBack=function(){for(const c of closers)if(c())return true;return false;};
window.MP31Pol={create(o){const x=create(o);closers.push(x.close);return x;},addCloser(fn){closers.push(fn);},CODE};
})();
