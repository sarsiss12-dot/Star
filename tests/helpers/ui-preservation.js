'use strict';
const {createHash}=require('crypto');
const hash=s=>createHash('sha256').update(s).digest('hex');
// 93D adds only a scoped science CSS block. Removing that exact, reviewed
// block must restore the untouched canonical 93A.1/93C HTML hash.
// Historical referans-sha.json remains intact; neither half is exempted.
exports.isReviewedUI=source=>{
 const contractStart=source.indexOf('/* 96G.1: scoped subject contract inputs */');
 if(contractStart>=0){const marker='/* END 96G.1 CONTRACT UI */\n',end=source.indexOf(marker,contractStart)+marker.length;
  if(end<contractStart||hash(source.slice(contractStart,end))!=='a3ca3772e61423b8a2d721db131c35b24fc5e354cf6df6c2ad533903244cba1b')return false;
  source=source.slice(0,contractStart)+source.slice(end);
 }
 const politicsStart=source.indexOf('/* 96G: bounded federation politics */');
 if(politicsStart>=0){const marker='/* END 96G POLITICS */\n',end=source.indexOf(marker,politicsStart)+marker.length;
  if(end<politicsStart||hash(source.slice(politicsStart,end))!=='154904e4f5e6c7751d00a04a37e667175da8d23a4663c721bb6b47eabf3df8cf')return false;
  source=source.slice(0,politicsStart)+source.slice(end);
 }
 const dStart=source.indexOf('/* 96D: scoped origin identity and audio controls */');
 if(dStart>=0){const marker='/* END 96D UI */\n',end=source.indexOf(marker,dStart)+marker.length;
  if(end<dStart||hash(source.slice(dStart,end))!=='c2e034e3a4c57a29667a8c481102af88c3850fe2cdd49bc563ff8ec47e5e7d2c')return false;
  source=source.slice(0,dStart)+source.slice(end);
 }
 // 96F: the reviewed report-close touch area is now 44px; every other byte remains pinned.
 const qaStart=source.indexOf('/* 96C.3: scoped attention and report views */');
 if(qaStart>=0){const marker='/* END 96C.3 UI */\n',end=source.indexOf(marker,qaStart)+marker.length;
  if(end<qaStart||hash(source.slice(qaStart,end))!=='aca95e46f824db37abe88be5620950621db9c28d7e91cbea532771c34b1dbaf6')return false;
  source=source.slice(0,qaStart)+source.slice(end);
 }
 const economyStart=source.indexOf('/* 96B: scoped economy workspace */');
 if(economyStart>=0){const marker='/* END 96B ECONOMY UI */\n',end=source.indexOf(marker,economyStart)+marker.length;
  if(end<economyStart||hash(source.slice(economyStart,end))!=='44fbe9415713675c3f2e69cd09fc30d7d24354618a7f38bb8c247f051344120e')return false;
  source=source.slice(0,economyStart)+source.slice(end);
 }
 for(const file of ['economic-ledger.js','economy-ui.js'])source=source.replace('<script src="'+file+'"></script>\n','');
 // 96A additive freight CSS is independently pinned; all older layout pins remain.
 const freightStart=source.indexOf('/* 96A: scoped freight workspace');
 if(freightStart>=0){const marker='/* END 96A FREIGHT UI */\n',end=source.indexOf(marker,freightStart)+marker.length;
  if(end<freightStart||hash(source.slice(freightStart,end))!=='16649e8d4346ca88fcaba0c9013a0b140fbebda85ab32c12c5ef3607a4ee80c6')return false;
  source=source.slice(0,freightStart)+source.slice(end);
 }
 for(const file of ['commerce.js','commerce-ui.js'])source=source.replace('<script src="'+file+'"></script>\n','');
 const workspaceStart=source.indexOf('/* FAZ 95E.2 — bounded archive workspace */');
 if(workspaceStart>=0){const marker='/* END FAZ 95E.2 ARCHIVE */\n',end=source.indexOf(marker,workspaceStart)+marker.length;
  if(end<workspaceStart||hash(source.slice(workspaceStart,end))!=='fb3ad1acc5d83f164bbda00c1c38cc1218801e38c0416d0d97e21b7e2fb679fb')return false;
  source=source.slice(0,workspaceStart)+source.slice(end);
 }
 const archiveStart=source.indexOf('/* FAZ 95E ARCHIVE */');
 if(archiveStart>=0){const marker='/* END FAZ 95E ARCHIVE */\n',end=source.indexOf(marker,archiveStart)+marker.length;
  if(end<archiveStart||hash(source.slice(archiveStart,end))!=='96a4e38594d2f946f8b2d858013988683192f4370aac722aac7f849fbbce4d8d')return false;
  source=source.slice(0,archiveStart)+source.slice(end);
 }
 for(const file of ['news.js','inbox.js','construction.js','archive-ui.js'])source=source.replace('<script src="'+file+'"></script>\n','');
 // 95D adds only this pinned identity block; all 95C.1 layout pins remain.
 const identityStart=source.indexOf('/* FAZ 95D — compact identity controls */');
 if(identityStart>=0){const marker='/* END FAZ 95D IDENTITY */\n',end=source.indexOf(marker,identityStart)+marker.length;
  if(end<identityStart||hash(source.slice(identityStart,end))!=='afd1d5e1baa89f429acb58d40da1793ce9c13d7c67e6f4d70d2ef4d892ca3aca')return false;
  source=source.slice(0,identityStart)+source.slice(end);
 }

 // 96H.0 reviews only the building-card rules inside the 95C.1 mobile block.
 // The complete reviewed block is pinned; all other layout/science pins stay fixed.
 const mobileStart=source.indexOf('/* FAZ 95C.1 — bounded mobile controls */');
 if(mobileStart>=0){const marker='/* END FAZ 95C.1 MOBILE */\n',end=source.indexOf(marker,mobileStart)+marker.length;
  if(end<mobileStart||hash(source.slice(mobileStart,end))!=='75bba4da37ca0cf9afc3980090b130fb1659dfacde3bf5fb1f143a44aa1458fe')return false;
  source=source.slice(0,mobileStart)+source.slice(end);
 }

 // 95B's canonical federation CSS was shipped without updating this guard.
 // Pin that exact block separately; original UI and science hashes stay fixed.
 const fedStart=source.indexOf('/* 95B: reuse the bounded diplomacy panel');
 if(fedStart>=0){const end=source.indexOf('/* FAZ 93D — scoped science tree',fedStart);
  if(end<fedStart||hash(source.slice(fedStart,end))!=='a526565c9c7bcd5ae8c42a816b3fbac4263a623ddaabda4277f5a92939d12a76')return false;
  source=source.slice(0,fedStart)+source.slice(end);
 }
 const noticeStart=source.indexOf('/* FAZ 94D.1 — compact war notices */'),noticeEnd='/* END FAZ 94D.1 NOTICES */';
 if(noticeStart>=0){const end=source.indexOf(noticeEnd,noticeStart)+noticeEnd.length;
  if(end<noticeStart||hash(source.slice(noticeStart,end))!=='9cba1c96fce1048776124ab24e7d8004d7a8b8597bff742004585d3a878198e2')return false;
  source=source.slice(0,noticeStart-1)+source.slice(end);
 }
 const start=source.indexOf('/* FAZ 93D — scoped science tree');
 const marker='/* END FAZ 93D SCIENCE */\n',last=source.indexOf(marker,start);
 if(start<0||last<0)return false;
 const end=last+marker.length;
 return hash(source.slice(start,end))==='34e939ab23c375214b1adf76c6d892dc2a2c9761cca678c169e7ba7cb7557696' &&
   hash(source.slice(0,start)+source.slice(end))==='d85ef126bdfe642ff9e36e0d2490b271c9e4caf63a903d312082e9abe59a8e41';
};
