'use strict';
const {createHash}=require('crypto');
const hash=s=>createHash('sha256').update(s).digest('hex');
// 93D adds only a scoped science CSS block. Removing that exact, reviewed
// block must restore the untouched canonical 93A.1/93C HTML hash.
// Historical referans-sha.json remains intact; neither half is exempted.
exports.isReviewedUI=source=>{
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

 // 95C.1 mobile layout is an independently pinned additive block.
 const mobileStart=source.indexOf('/* FAZ 95C.1 — bounded mobile controls */');
 if(mobileStart>=0){const marker='/* END FAZ 95C.1 MOBILE */\n',end=source.indexOf(marker,mobileStart)+marker.length;
  if(end<mobileStart||hash(source.slice(mobileStart,end))!=='9a2c98af21d8cf1a66d11fed4959a4e8593b4cba6bd4961523c2fcb79173a3ef')return false;
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
