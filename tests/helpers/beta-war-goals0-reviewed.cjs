'use strict';
/* BETA-WAR-GOALS.0 (p31 / MP.8.9b28) koruma adaptörü: iki savaş hedefi (Fetih / Vasallaştırma), gerekçe/meşruiyet önizlemesi, savaş içi
   teslim maddesi + kampanya kapsamı, ayrı barış önizlemesi, toprak vaadi, Sahte Bayrak ifşası yeniden değerlendirme, federasyona karşı
   federasyon (fedWar / fedPeace), Galaktik Gerilim ve MP köprüsü hunk'larını TAM METİNLE geri alır (p30 / MP.8.9b27 baytları, 4e6f7f6).
   Önce stripReviewedFieldSiege (p32) çağrılır; stripReviewedRival önce bunu çağırır. Hash gevşetilmez: tanınmayan kaynak eski incelenmiş sürümlerden biri değilse durur. */
const assert=require('assert/strict'),fs=require('fs'),path=require('path'),crypto=require('crypto'),pins=require('./beta-war-goals0-reviewed.json'),sha=s=>crypto.createHash('sha256').update(s).digest('hex');
exports.stripReviewedWarGoals=(file,source)=>{source=require('./field-war-siege0-reviewed.cjs').stripReviewedFieldSiege(file,source);const p=pins[file];if(!p)return source;const hash=sha(source);if(hash===p.beforeSha256)return source;
  if(hash!==p.afterSha256){const old=fs.readdirSync(__dirname).filter(f=>f.endsWith('-reviewed.json')).map(f=>JSON.parse(fs.readFileSync(path.join(__dirname,f),'utf8'))[file]).filter(Boolean);assert(old.some(p=>hash===p.beforeSha256||hash===p.afterSha256),file+' unreviewed WAR-GOALS source');return source;}
  for(const h of p.hunks){assert.equal(source.split(h.after).length,2,file+' unique WAR-GOALS hunk');source=source.replace(h.after,h.before);}
  assert.equal(sha(source),p.beforeSha256,file+' exact p30 restored');return source;};
