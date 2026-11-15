'use strict';
/* WAR-COALITION.0 (p33 / MP.8.9b30) koruma adaptörü: tek savaş ilanı akışı (WarCoal: hedef → müttefikler → son onay, toplu davet,
   kısmi son onay, davet durumu / karşı teklif / geçersizleşme, hazırlıkta Fetih/Vasallaştırma seçenekleri), plan katılım etiketi,
   Kan Hukuku ateşkesinde Fetih iadesi sırası, liveWorld pencere sınıfları (archive-ui / economy-ui), CSS bloğu, MP koalisyon komutları
   (warCoalition / warInvite / warInviteReply / warPrepareGoal / warDealRead, kısmi warLaunch), misafir sarmalayıcıları / açık pencerede
   ayna ve sürüm hunk'larını TAM METİNLE geri alır (p32 / MP.8.9b29 baytları, a20d531). Zincirde en yeni adım; stripReviewedFieldSiege
   önce bunu çağırır. Hash gevşetilmez: tanınmayan kaynak eski incelenmiş sürümlerden biri değilse durur. */
const assert=require('assert/strict'),fs=require('fs'),path=require('path'),crypto=require('crypto'),pins=require('./war-coalition0-reviewed.json'),sha=s=>crypto.createHash('sha256').update(s).digest('hex');
exports.stripReviewedWarCoalition=(file,source)=>{const p=pins[file];if(!p)return source;const hash=sha(source);if(hash===p.beforeSha256)return source;
  if(hash!==p.afterSha256){const old=fs.readdirSync(__dirname).filter(f=>f.endsWith('-reviewed.json')).map(f=>JSON.parse(fs.readFileSync(path.join(__dirname,f),'utf8'))[file]).filter(Boolean);assert(old.some(p=>hash===p.beforeSha256||hash===p.afterSha256),file+' unreviewed WAR-COALITION source');return source;}
  for(const h of p.hunks){assert.equal(source.split(h.after).length,2,file+' unique WAR-COALITION hunk');source=source.replace(h.after,h.before);}
  assert.equal(sha(source),p.beforeSha256,file+' exact p32 restored');return source;};
