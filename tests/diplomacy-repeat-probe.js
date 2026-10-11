'use strict';
const fs=require('fs'),path=require('path');
const {runtime}=require('./helpers/runtime');
function scenario(root,seed,months=120){
 const h=runtime({root:path.resolve(root)});h.sb.seed=seed;
 h.run(`setupGame({name:'87D ölçümü',race:'insan',traits:[],size:'buyuk',shape:'sarmal',diff:'normal',seed,
   ethics:{mil:0,aut:0,mat:0,ahl:0},civics:[],origin:'standart',ruins:'yok',crisis:'kapali',council:'kapali'});
   View.init();G.speed=0;G.sandbox=true;
   for(const a of G.emps)for(const b of G.emps)if(a!==b&&!a.dead&&!b.dead&&!a.wild&&!b.wild)a.contact[b.id]=true;
   var stats={playerAttempts:0,playerDelivered:0,playerRejected:0,aiNegotiations:0,aiRejected:0,aiRepeatedWithin180:0,aiExecuted:0};
   var last={},playerDays=[];const originalOffer=UI.aiOffer,originalNeg=aiNegotiate;
   UI.aiOffer=function(off){stats.playerAttempts++;const uid=G.inboxUid||0;const r=originalOffer.call(this,off);
     const notes=(G.inbox||[]).filter(n=>n.kind==='aideal'&&n.uid>uid);
     for(const n of notes){stats.playerDelivered++;playerDays.push({day:G.day,from:off.from});
       this.openNote(n.uid);this._hooks.offNo();stats.playerRejected++;}return r;};
   aiNegotiate=function(p,t,g,w){const sig=JSON.stringify([p.id,t.id,g,w]);
     if(last[sig]!==undefined&&G.day-last[sig]<180)stats.aiRepeatedWithin180++;
     const r=originalNeg(p,t,g,w);stats.aiNegotiations++;if(r.uygulandi)stats.aiExecuted++;
     if(r.karar==='red'||r.karar==='karsi-red'){stats.aiRejected++;last[sig]=G.day;}return r;};
 `);
 for(let m=0;m<months;m++){
   h.run('G.day+=30;monthTick();');h.timers.clear();h.raf.clear();
 }
 return JSON.parse(h.run(`JSON.stringify({seed,months:${months},stats,playerDays,rng:RND_STATE})`));
}
function stress(root){
 const h=runtime({root:path.resolve(root)});h.loadSave(path.join(__dirname,'fixtures/stars-2210-06.sav.json'));
 h.run(`var E=G.emps[1];E.dead=false;E.wild=false;E.contact[0]=G.p.contact[E.id]=true;
   E.res.min=10000;G.p.res.ene=10000;G.inbox=[];
   var offer={from:E.id,to:0,give:[{t:'res',r:'min',v:100}],want:[{t:'res',r:'ene',v:50}]};
   var delivered=0,relBefore=E.rel[0];
   for(let i=0;i<12;i++){UI.aiOffer(offer);const note=G.inbox.find(n=>n.kind==='aideal');
     if(note){delivered++;UI.openNote(note.uid);UI._hooks.offNo();}G.day+=30;}
   var declineDelta=E.rel[0]-relBefore;
   G.inbox=[];G.day+=900;UI.aiOffer(offer);var old=G.inbox[0];
   G.day=old.data.expires+1;UI.aiOffer(offer);var renewed=G.inbox.some(n=>n.kind==='aideal'&&!dealExpired(n.data));
 `);
 return JSON.parse(h.run('JSON.stringify({forcedMonthlyAttempts:12,delivered,declineDelta,expiredOfferRenewed:renewed})'));
}
module.exports={scenario,stress};
if(require.main===module){const root=process.argv[2]||path.join(__dirname,'..');
 const data={method:'120 monthly ticks; all living non-wild contacts; player rejects every delivered offer; no daily exploration/combat; separate forced stream is not normal offer frequency',stress:stress(root),runs:[11,99,404].map(seed=>scenario(root,seed))};
 const txt=JSON.stringify(data,null,2)+'\n';if(process.argv[3])fs.writeFileSync(process.argv[3],txt);else console.log(txt);
}
