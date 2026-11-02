'use strict';
const assert=require('assert/strict');
// MP.7.5 reviewed inbox change: one exact block in inbox.js (stale peace / status-quo records close when the war ends or a newer
// offer from the same empire supersedes them). Stripping it restores the MP.7.4 inbox.js bytes.
const BLOCK="      /* MP.7.5: savaş bittiyse barış / statüko kaydı kapanır; aynı devletten daha yeni barış teklifi eskisinin yerine geçer (bekleyen eş kayıt birikmez) */\n      if((r.kind==='peace'||r.kind==='sqOffer')&&G.emps[r.from]&&(!G.p.war[r.from]||this.state().records.some(x=>x!==r&&x.kind===r.kind&&x.from===r.from&&x.status==='pending'&&x.born>r.born))){\n        r.status='invalid';r.why=G.p.war[r.from]?'Aynı devletten daha yeni teklif geldi':'Savaş sona erdi';r.finished=G.day;G.inbox=(G.inbox||[]).filter(n=>n.uid!==r.note?.uid);continue;}\n      /* END MP.7.5 INBOX */\n";
exports.reviewedMP75Blocks=[BLOCK];
exports.stripReviewedMP75=(name,source)=>{
 if(name!=='inbox.js'||!source.includes('/* END MP.7.5 INBOX */'))return source;
 assert.equal(source.split(BLOCK).length,2,'one reviewed MP.7.5 inbox block');return source.replace(BLOCK,'');
};
