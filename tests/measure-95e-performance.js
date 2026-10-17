'use strict';
const fs=require('fs'),path=require('path'),{performance}=require('perf_hooks'),{runtime}=require('./helpers/runtime'),{world}=require('./helpers/95e-fixture');
const base=runtime({root:path.resolve(process.argv[2])}),next=runtime();
for(const h of [base,next])h.run(`setupGame({...CFG,size:'ulu',seed:11,crisis:'kapali',council:'kapali'});G.autoSave=false;for(let i=0;i<100;i++)dailyTick(0);`);
const samples={baseline:[],next:[]};
for(let r=0;r<24;r++)for(const [name,h]of(r%2?[['next',next],['baseline',base]]:[['baseline',base],['next',next]])){const t=performance.now();h.run('for(let i=0;i<50;i++)dailyTick(0)');samples[name].push((performance.now()-t)/50);}
const pct=(a,p)=>a.slice().sort((a,b)=>a-b)[Math.min(a.length-1,Math.floor(a.length*p))];
const idle=Object.fromEntries(Object.entries(samples).map(([k,a])=>[k,{medianMs:pct(a,.5),p95Ms:pct(a,.95),samples:a}]));
const h=world();
h.run(`for(const e of G.emps)G.p.contact[e.id]=true;G.news=GalacticNews.empty();`);
const eventTimes=[];for(let r=0;r<20;r++){h.sb.offset=r*100;const t=performance.now();h.run(`for(let i=0;i<100;i++)recordNews({key:'v'+(offset+i),category:'war',empires:G.emps.slice(0,12).map(e=>e.id),title:'Başlık '.repeat(40),text:'Açıklama '.repeat(200)});`);eventTimes.push((performance.now()-t)/100);}
h.run(`G.p.contact[1]=false;for(let i=0;i<1000;i++)recordNews({key:'hidden'+i,category:'war',empires:[1,2],title:'Gizli',text:'Gizli metin'});G.p.contact[1]=true;for(let i=0;i<512;i++)addOffer(i+1);for(let i=0;i<16;i++)RemoteConstruction.enqueue(builder,Math.floor(i/3)+1,['bilim_ist','role','sensor'][i%3]);`);
const text=h.run('serialize()'),d=JSON.parse(text),moduleBytes=Object.fromEntries(['news','diplomaticInbox','construction'].map(k=>[k,Buffer.byteLength(JSON.stringify(d[k]))]));delete d.news;delete d.diplomaticInbox;delete d.construction;
const q=h.run('Object.values(G.construction.queues).reduce((n,a)=>n+a.length,0)'),initial=JSON.parse(next.run('serialize()'));
const t=performance.now();h.run('for(let i=0;i<1000;i++)GalacticNews.unread()');const unreadMs=(performance.now()-t)/1000;
const out={method:'Node mock host. 100 systems / 13 starting empires. Paired alternating batches, 24 samples x 50 dailyTick(0); no concurrent real-device claim. Idle simulation only; campaign outcomes reported separately.',idle,eventInsertion:{medianMs:pct(eventTimes,.5),p95Ms:pct(eventTimes,.95)},unread1000RecordsMs:unreadMs,stress:{knownNews:h.run('G.news.records.length'),hiddenNews:h.run('G.news.hidden.length'),pendingOffers:h.run('DiplomaticInbox.pending()'),queuedTasks:q,saveBytes:Buffer.byteLength(text),sameWorldWithout95eBytes:Buffer.byteLength(JSON.stringify(d)),moduleBytes},initialSaveBytes:Buffer.byteLength(next.run('serialize()')),initialSystemCount:initial.sys.length};
fs.writeFileSync(path.join(__dirname,'audit-95e/performance.json'),JSON.stringify(out,null,2));console.log(JSON.stringify(out,null,2));
