from pathlib import Path
R=Path(__file__).resolve().parents[2]/'Star'
p=R/'diplomacy.js';s=p.read_text();a=s.index('        e.ally[o.id] = false; o.ally[e.id] = false;',s.index('function aiReviewAlliances'));b=s.index('        if (o.id === 0)',a);core=s[a:b];s=s[:a]+'        applyAllianceEnd(e,o);\n'+s[b:]
helper="""/* Normal bilateral withdrawal. Federation and sovereign bonds use their own exits. */
function canEndAlliance(e,o){
  if(!e||!o||e===o||G.emps[e.id]!==e||G.emps[o.id]!==o||e.dead||o.dead||e.wild||o.wild)return {ok:false,why:'Devlet artık mevcut veya geçerli değil'};
  if(sovereignPair(e,o))return {ok:false,why:'Vassallık bağı normal ittifak feshiyle değiştirilemez; sözleşme veya bağımsızlık yönetimini kullan'};
  const f=findFed(e),other=findFed(o);
  if(f&&other&&f.id===other.id)return {ok:false,why:'Aynı federasyondaki ittifak bağı üyelik düzeninin parçasıdır. Federasyon Yönetimi içindeki Ayrıl veya İhraç işlemini kullan',federation:true};
  if(!e.ally[o.id]&&!o.ally[e.id])return {ok:false,why:'Sonlandırılabilecek bir ittifak yok'};
  return {ok:true};
}
function applyAllianceEnd(e,o){
"""+''.join(line[6:]+'\n' for line in core.rstrip().splitlines())+"""}
function endAlliance(e,o){
  const gate=canEndAlliance(e,o);if(!gate.ok)return gate;
  applyAllianceEnd(e,o);
  say('İTTİFAK SONLANDIRILDI — '+o.name+' · '+COLD_WAR_TURNS+' ay soğuk savaş','war');
  return {ok:true};
}

"""
s=s.replace('function aiReviewAlliances(){',helper+'function aiReviewAlliances(){');p.write_text(s)
p=R/'ui.js';s=p.read_text();s=s.replace("      case 'unpact':", "      case 'endAlliance': this.confirmAllianceEnd(+x); break;\n      case 'unpact':",1)
s=s.replace('let h=this.diploIdentity(e,o)+this.diploTreaties(e,o);','''let h=this.diploIdentity(e,o)+this.diploTreaties(e,o);
    if(e.ally[o.id]||o.ally[e.id]){
      const gate=canEndAlliance(e,o);
      h+=`<button class="abtn dgr" data-a="endAlliance" data-x="${o.id}" ${gate.ok?'':'disabled'}>⚑ İTTİFAKI SONLANDIR…</button>`;
      if(!gate.ok)h+='<div class="mini">'+esc(gate.why)+'</div>'+(gate.federation?'<button class="abtn" data-a="fedPane">Federasyon Yönetimini aç</button>':'');
    }''',1)
needle='  confirmFedLeave(){';assert needle in s
s=s.replace(needle,'''  confirmAllianceEnd(id){
    const player=G.p,other=G.emps[id],gate=canEndAlliance(player,other);
    if(!gate.ok){say(gate.why,'war');return;}
    const world=G.emps,token={};
    this.openModal(`<div class="mhd"><span>İTTİFAKI SONLANDIR · ${esc(other.name)}</span></div><div class="mbd">
      <p>${esc(other.name)} ile karşılıklı ittifak tek taraflı sona erecek. Kaynak bedeli yok.</p>
      <p>İki tarafın ilişki puanı 15 azalır (alt sınır −100). Karşı devlet ve mevcut motorun seçtiği diğer devletler seni “pakt bozdu” diye hatırlayabilir; bu güveni etkiler.</p>
      <p>${COLD_WAR_TURNS} ay soğuk savaş kaydı başlar. AI bu süre içinde sana normal savaş değerlendirmesinden savaş açmaz. Yeniden ittifak için ayrıca sabit bir bekleme süresi uygulanmaz; anlaşma kabul koşulları geçerlidir.</p>
      <p>Yeni ittifak savunma ve ortak saldırı taahhütleri biter. Mevcut savaşlar sürer; yeni savaş başlamaz. Mevcut ortak sefer emirleri bu işlemle iptal edilmez.</p>
      <p>İttifaka dayalı askerî sınır geçişi biter. Açık sınırlar ve bağımsız geçiş izinleri kendi kurallarıyla sürer. Ayrı sensör paylaşımı, ticaret paktları, kaynak sözleşmeleri ve saldırmazlık anlaşmaları korunur.</p>
      </div><div class="mft"><button class="ch" data-a="closem">VAZGEÇ</button><button id="allianceEndConfirm" class="ch" data-a="allianceEndConfirm">SONLANDIRMAYI ONAYLA</button></div>`,'war');
    this._archiveToken=token;
    this._hook('allianceEndConfirm',()=>{
      if(this._archiveToken!==token||G.emps!==world||G.p!==player||G.emps[id]!==other)return;
      this._archiveToken=null;
      const result=endAlliance(player,other);say(result.ok?'İttifak sona erdi':result.why,result.ok?'win':'war');
      this.closeModal();this.openDiplo();if(!other.dead)this.selectDiploIdentity(id);this.topbar();
    });
  },
'''+needle,1);p.write_text(s)
print('Alliance minimal helper + UI added')
