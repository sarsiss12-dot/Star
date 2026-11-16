'use strict';
/* MP-WARON.0 (p36 / MP.8.9b34) koruma adaptörü: Genel Savaş Sözü (warOn) çok oyunculu müzakerede — diplomacy.js son tarihli söz
   (warPledge* bloğu, dealQuote / applyItems / dealPostcondition / declareWar kancaları, madde normalleştirme ve etiket), main.js ay başı
   warPledgeTick çağrısı, ui.js müzakere masası (etkin Savaş sözü, son tarih seçimi / ⏱, özet satırları, aktif söz paneli), mp-core warOn
   maddesi + son tarih kapısı + bekleyen teklif süpürmesi + bildirim, mirror söz kayıtları, guest-stars / mp71-dip gönderim köprüsü ve sürüm
   hunk'larını TAM METİNLE geri alır (p35 / MP.8.9b33 baytları, c2ab5f2). Zincirde en yeni adım; stripReviewedDealSys önce bunu çağırır.
   Hash gevşetilmez: tanınmayan kaynak eski incelenmiş sürümlerden biri değilse durur. */
const assert=require('assert/strict'),fs=require('fs'),path=require('path'),crypto=require('crypto'),pins=require('./mp-waron0-reviewed.json'),sha=s=>crypto.createHash('sha256').update(s).digest('hex');
exports.stripReviewedWarOn=(file,source)=>{const p=pins[file];if(!p)return source;const hash=sha(source);if(hash===p.beforeSha256)return source;
  if(hash!==p.afterSha256){const old=fs.readdirSync(__dirname).filter(f=>f.endsWith('-reviewed.json')).map(f=>JSON.parse(fs.readFileSync(path.join(__dirname,f),'utf8'))[file]).filter(Boolean);assert(old.some(p=>hash===p.beforeSha256||hash===p.afterSha256),file+' unreviewed MP-WARON source');return source;}
  for(const h of p.hunks){assert.equal(source.split(h.after).length,2,file+' unique MP-WARON hunk');source=source.replace(h.after,h.before);}
  assert.equal(sha(source),p.beforeSha256,file+' exact p35 restored');return source;};
