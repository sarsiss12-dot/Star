'use strict';
/* MP-FIELD-FIX.0 (p34 / MP.8.9b31) koruma adaptörü: oyuncu katılım yolları tam STARS arayüzüne (/mp/join → /mp/play yönlendirmesi, ana menü ODAYA KATIL),
   katılım aşama mesajları ve adreste oda kodu (join.js), misafirde kalıcı kaydırılan kart + gizli karar listede (guest-stars), filo ret kodlarının Türkçe
   karşılığı ve tekrar uyarı birleştirme, uzak insanın Fetih adayı bilinen sahiplikten + warFetihMax (diplomacy.js), canlı Fetih hedef seçimi + pasif düğme +
   Vasallaştırmaya dön (ui.js, index.html), müzakere masasından Savaşa Destek İste (warSupportOptions / warSupportList) ve sürüm hunk'larını TAM METİNLE
   geri alır (p33 / MP.8.9b30 baytları, 0ec5720). Zincirde en yeni adım; stripReviewedWarCoalition önce bunu çağırır.
   Hash gevşetilmez: tanınmayan kaynak eski incelenmiş sürümlerden biri değilse durur. */
const assert=require('assert/strict'),fs=require('fs'),path=require('path'),crypto=require('crypto'),pins=require('./mp-field-fix0-reviewed.json'),sha=s=>crypto.createHash('sha256').update(s).digest('hex');
exports.stripReviewedFieldFix=(file,source)=>{const p=pins[file];if(!p)return source;const hash=sha(source);if(hash===p.beforeSha256)return source;
  if(hash!==p.afterSha256){const old=fs.readdirSync(__dirname).filter(f=>f.endsWith('-reviewed.json')).map(f=>JSON.parse(fs.readFileSync(path.join(__dirname,f),'utf8'))[file]).filter(Boolean);assert(old.some(p=>hash===p.beforeSha256||hash===p.afterSha256),file+' unreviewed MP-FIELD-FIX source');return source;}
  for(const h of p.hunks){assert.equal(source.split(h.after).length,2,file+' unique MP-FIELD-FIX hunk');source=source.replace(h.after,h.before);}
  assert.equal(sha(source),p.beforeSha256,file+' exact p33 restored');return source;};
