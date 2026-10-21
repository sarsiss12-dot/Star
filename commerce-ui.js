'use strict';
// 96A presentation follows the existing UI action delegation and 2D camera.
const CommerceUI={selected:null,hits:[],token:null,
 boot(){
  const host=$('outMap'),emp=$('outEmp');if(!host||!emp)return;
  if(!$('convoyToggle')){const b=document.createElement('button');b.id='convoyToggle';b.className='tool';b.dataset.a='convoyToggle';b.innerHTML='▱<span>Ticaret Konvoyları</span>';host.appendChild(b);}
  if(!$('commerceBtn')){const open=document.createElement('button');open.id='commerceBtn';open.className='tool';open.dataset.a='commerce';open.innerHTML='▱<span>Ticaret sözleşmeleri</span>';emp.appendChild(open);}
  this.buttons();
 },
 modal(html){UI.openModal(html);$('modal').classList.add('commerceHost');},
 buttons(){const b=$('convoyToggle');if(b){const on=Commerce.state().visible;b.setAttribute('aria-pressed',String(on));b.className='tool'+(on?' on':'');}},
 draw(g){this.hits=[];if(!Commerce.state().visible)return;let count=0;g.save();
  for(const c of Commerce.state().convoys){if(!Commerce.visible(c))continue;const p=View.w2s(c.x,c.y);if(p.x<-15||p.y<-15||p.x>View.vw+15||p.y>View.vh+15)continue;if(count++>=128)break;
   const blocks=(View._mapLabelBlocks||[]).concat(View._territoryLabels||[]),box=View.placeMapLabel(p.x-9,p.y+12,18,18,blocks);if(!box)continue;const x=box.x+9,y=box.y+9;g.strokeStyle=G.emps[c.e].col;g.fillStyle=c.id===this.selected?'#fff2ba':G.emps[c.e].col;g.lineWidth=1.5;
   g.beginPath();g.moveTo(x-6,y-3);g.lineTo(x+6,y-3);g.lineTo(x+3,y+4);g.lineTo(x-4,y+4);g.closePath();g.fill();g.stroke();g.fillRect(x-1,y-6,3,3);
   this.hits.push({x,y,id:c.id});View._mapLabelBlocks?.push({x:x-9,y:y-10,w:18,h:20});
   if(c.id===this.selected){g.setLineDash([3,5]);g.beginPath();c.route.forEach((sid,i)=>{const sy=G.sys[sid],q=View.w2s(sy.x,sy.y);if(i)g.lineTo(q.x,q.y);else g.moveTo(q.x,q.y);});g.stroke();g.setLineDash([]);}
  }g.restore();
 },
 hit(p){if(!Commerce.state().visible)return null;return this.hits.find(h=>Math.hypot(h.x-p.x,h.y-p.y)<16);},
 open(mode='contracts',id=null){
  const st=Commerce.state(),e=G.p,contracts=st.contracts.filter(c=>c.a===e.id||c.b===e.id),convoys=st.convoys.filter(c=>c.e===e.id||c.to===e.id),stats=Commerce.stats(e.id);let h=`<div class="mhd">TİCARET SÖZLEŞMELERİ <button class="riX" data-a="closem">✕</button></div><div class="mbd"><div class="mini">Genel ticaret anlaşması izin verir. Bu ekrandaki sözleşme gerçek yük taşır. Her iki yön çıkışta birlikte yüklenir, varışları ayrıdır. Bir yön kaybolursa diğer teslimat geri alınmaz.</div><div class="mft"><button class="ch" data-a="commerce">Sözleşmeler (${contracts.length})</button><button class="ch" data-a="commerceConvoys">Konvoylar (${convoys.filter(c=>!Commerce.terminal(c)).length})</button><button class="ch" data-a="commerceNew">Yeni sözleşme</button></div>`;
  if(mode==='convoys'){
   if(!convoys.length)h+='<div class="mini">Henüz konvoy yok; hayali geçmiş sefer oluşturulmaz.</div>';
   const rows=convoys.filter(c=>!Commerce.terminal(c)).concat(convoys.filter(c=>Commerce.terminal(c)).slice(-40).reverse());if(id){const selected=convoys.find(c=>c.id===+id);if(selected){const i=rows.indexOf(selected);if(i>=0)rows.splice(i,1);rows.unshift(selected);}}
   for(const c of rows){const eta=this.eta(c);h+=`<div class="box"><div class="bt"><button class="abtn" data-a="commerceConvoy" data-x="${c.id}">▱ #${c.id} · ${esc(Commerce.labels[c.status])}</button><b>${c.amount.toFixed(1)} ${RES[c.r].n}</b></div><div class="mini">${esc(G.sys[c.source]?.name||'?')} → ${esc(G.sys[c.target]?.name||'?')} · ${esc(G.emps[c.e]?.name||'?')}</div><div class="mini">Konum: ${esc(G.sys[c.at]?.name||'?')}${c.t>0?' · yolda':''} · ${eta} · ${esc(c.reason)}</div><div class="mini">Yüklenen ${c.loaded.toFixed(1)} · Teslim ${c.delivered.toFixed(1)} · Kayıp ${c.lost.toFixed(1)}</div><button class="abtn" data-a="commerceLocate" data-x="${c.id}">Haritada göster</button></div>`;}
  }else{
   if(!contracts.length)h+='<div class="mini">Henüz kaynak sözleşmesi yok. Ticaret anlaşmalı bir devlet ve iki liman gerekir.</div>';
   for(const c of contracts.slice().reverse()){h+=`<div class="box"><div class="bt"><b>#${c.id} · ${esc(G.emps[c.a]?.name||'?')} ↔ ${esc(G.emps[c.b]?.name||'?')}</b><span>${esc(Commerce.labels[c.status])}</span></div>`;for(const l of c.legs)h+=`<div class="mini">${esc(G.emps[l.e]?.name||'?')} → ${esc(G.emps[l.to]?.name||'?')}: <b>${l.v.toFixed(1)} ${RES[l.r].n}/sefer</b> · ${esc(G.sys[l.source]?.name||'?')} → ${esc(G.sys[l.target]?.name||'?')}</div>`;h+=`<div class="mini">${c.legs[0].every} günde bir · Kalan ${Math.max(0,Math.ceil((c.until-G.day)/30))} ay · Son teslimat ${c.lastDelivery===null?'—':'gün '+c.lastDelivery.toFixed(1)}</div><div class="mini">Teslim: ${this.amounts(c.delivered)} · Kayıp: ${this.amounts(c.lost)}</div><div class="mini">${esc(c.reason)}</div>${!Commerce.closed(c)?`<button class="abtn" data-a="commerceCancel" data-x="${c.id}">Yeni seferleri iptal et</button>`:''}<button class="abtn" data-a="commercePort" data-x="${c.legs[0].source}">Çıkış limanını göster</button></div>`;}
  }
  h+=`<div class="ph">GERÇEK TİCARET SONUÇLARI</div><div class="mini">Yüklenen: ${this.amounts(stats.loaded)}<br>Teslim gönderilen: ${this.amounts(stats.sent)}<br>Gerçek alınan: ${this.amounts(stats.received)}<br>Kayıp: ${this.amounts(stats.lost)} (imha: ${this.amounts(stats.destroyed)})</div><div class="mini">Liman/ağ üretim katkısı ayrıdır; teorik sefer geliri yoktur. Kaynak yalnız fiziksel varışta eklenir. Kapalı rota/liman en çok 180 gün beklenir; sonra taşınan yük kayıptır.</div></div><div class="mft"><button class="ch" data-a="closem">Kapat</button></div>`;
  this.modal(h);$('modal').classList.add('commerceHost');const box=$('modal').querySelector('.mbd');if(box)box.style.cssText='max-height:calc(100dvh - 110px);overflow-y:auto;overscroll-behavior:contain';this.token=G.sys;this.buttons();
 },
 amounts(o){return Commerce.resources.filter(k=>o?.[k]>0).map(k=>o[k].toFixed(1)+' '+RES[k].n).join(' · ')||'—';},
 eta(c){if(Commerce.terminal(c))return 'Sefer sonuçlandı';if(c.status==='blocked')return 'Varış belirsiz';let days=Math.max(0,c.depart-G.day);for(let i=c.step;i<c.route.length-1;i++)days+=Math.max(1,dist(G.sys[c.route[i]],G.sys[c.route[i+1]])/Commerce.speed)*(i===c.step?1-c.t:1);return '~'+Math.ceil(days)+' gün';},
 form(partner){
  const e=G.p,partners=G.emps.filter(o=>o!==e&&!Commerce.pairGate(e,o)&&e.contact[o.id]&&tradeHubs(o).some(s=>Commerce.known(e,G.sys[s])));const o=partners.find(o=>o.id===+partner)||partners[0];if(!o){this.modal('<div class="mhd">KAYNAK SÖZLEŞMESİ</div><div class="mbd">Ticaret anlaşmalı, bilinen limanlı ortak yok. Önce iki tarafta Ticaret Limanı ve genel ticaret anlaşması gerekir.</div><div class="mft"><button class="ch" data-a="commerce">Geri</button></div>');return;}
  const options=xs=>xs.map(id=>`<option value="${id}">${esc(G.sys[id].name)}</option>`).join(''),res=(selected)=>Commerce.resources.map(k=>`<option value="${k}" ${k===selected?'selected':''}>${RES[k].n}</option>`).join('');
  this.modal(`<div class="mhd">YENİ KAYNAK SÖZLEŞMESİ</div><div class="mbd"><div class="row">Ortak <select id="cargoPartner">${partners.map(x=>`<option value="${x.id}" ${x===o?'selected':''}>${esc(x.name)}</option>`).join('')}</select></div><div class="row">Çıkış limanı <select id="cargoSource">${options(tradeHubs(e))}</select></div><div class="row">Hedef limanı <select id="cargoTarget">${options(tradeHubs(o).filter(id=>Commerce.known(e,G.sys[id])))}</select></div><div class="row">Gönder <select id="cargoGive">${res('min')}</select><input id="cargoGiveN" type="number" min="1" max="1000" value="12" style="width:65px"></div><div class="row">Karşılık <select id="cargoWant">${res('ene')}</select><input id="cargoWantN" type="number" min="1" max="1000" value="8" style="width:65px"></div><div class="row">Sıklık (gün) <input id="cargoEvery" type="number" min="30" max="180" value="30" style="width:70px"></div><div class="row">Süre (ay) <input id="cargoMonths" type="number" min="3" max="120" value="12" style="width:70px"></div><div class="mini">İki yön aynı anda yüklenir, ayrı varışlarda teslim edilir. İptal yeni yüklemeyi durdurur; yoldaki yük teslimata devam eder. Savaş/liman engelinde 180 gün sonra yük kaybedilir.</div><div id="cargoReason" class="mini"></div></div><div class="mft"><button class="ch" data-a="commercePropose">Teklif et</button><button class="ch" data-a="commerce">Vazgeç</button></div>`);this.token=G.sys;$('cargoPartner').addEventListener('change',()=>this.form($('cargoPartner').value));
 },
 propose(){if(this.token!==G.sys)return;const n={from:G.p.id,to:+$('cargoPartner').value,give:[{t:'freight',r:$('cargoGive').value,v:+$('cargoGiveN').value,source:+$('cargoSource').value,target:+$('cargoTarget').value,every:+$('cargoEvery').value,months:+$('cargoMonths').value}],want:[{t:'freight',r:$('cargoWant').value,v:+$('cargoWantN').value,source:+$('cargoTarget').value,target:+$('cargoSource').value,every:+$('cargoEvery').value,months:+$('cargoMonths').value}]};const q=dealQuote(n);if(!q.ok){$('cargoReason').textContent=q.reasons.join(' · ');return;}const result=aiRespond(G.emps[n.to],n);if(result.v==='kabul'&&executeDeal(n))this.open();else $('cargoReason').textContent=result.why||'Ortak bu teklifi kabul etmedi; miktarları yeniden değerlendir.';},
 locate(id){const c=Commerce.state().convoys.find(c=>c.id===+id&&(c.e===G.p.id||c.to===G.p.id));if(!c)return;this.selected=c.id;UI.closeModal();UI.act('closeDiplo');View.panTo(c.x,c.y);if(typeof forceRedraw==='function')forceRedraw('commerce');},
};
const commerceBoot96=UI.boot;UI.boot=function(){const r=commerceBoot96.apply(this,arguments);CommerceUI.boot();return r;};
const commerceAction96=UI.act;UI.act=function(a,x,el){switch(a){
 case 'convoyToggle':Commerce.state().visible=!Commerce.state().visible;CommerceUI.buttons();return;
 case 'commerce':CommerceUI.open();return;case 'commerceConvoys':CommerceUI.open('convoys');return;
 case 'commerceNew':CommerceUI.form(x);return;case 'commercePropose':CommerceUI.propose();return;
 case 'commerceCancel':if(CommerceUI.token===G.sys){Commerce.cancel(+x,G.p);CommerceUI.open();}return;
 case 'commerceConvoy':CommerceUI.selected=+x;CommerceUI.open('convoys',+x);return;
 case 'commerceLocate':CommerceUI.locate(+x);return;
 case 'commercePort':{const s=G.sys[+x];if(s&&pSeen(s)){UI.closeModal();View.selSys=s;View.panTo(s.x,s.y);}return;}
 default:return commerceAction96.call(this,a,x,el);
}};

const commerceDraw96=View.draw;View.draw=function(t){const r=commerceDraw96.call(this,t);if(this.g)CommerceUI.draw(this.g);return r;};
const commerceTap96=View.tap;View.tap=function(screenPos){if(!this.route&&this.rallyForSys===undefined&&this.rallyFor===undefined&&this.panoptFor===undefined&&this.aimFleet===undefined){const hit=CommerceUI.hit(screenPos);if(hit){CommerceUI.selected=hit.id;CommerceUI.open('convoys',hit.id);return;}}return commerceTap96.call(this,screenPos);};
