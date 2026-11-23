// node cift-iz.cjs <kök> <tohum> <başlangıç günü> <a> <b>  — gölge fırsatından sonraki 90 günde gerçek AI'nın a–b çifti için tanı notları ve açık sözleşmeler
const path=require('path');const {runtime}=require(path.resolve(__dirname,'../../tests/helpers/runtime'));
const [root,seed,day,a,b]=process.argv.slice(2);const h=runtime({root:path.resolve(root)});
console.log(h.run(`(()=>{resetSetupNaming();Object.assign(CFG,{seed:${+seed},size:'ulu',aiCount:9});setupGame({...CFG});G.autoSave=false;
 const m1=()=>{const m=Math.floor(G.day/30);let g=0;while(Math.floor(G.day/30)<=m&&g++<200){G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);if(Math.floor(G.day/30)>m)monthTick();}};
 while(G.day<${+day}-1)m1();const pair=[${+a},${+b}],notes=[];const n0=AIDiagnostics.note;
 AIDiagnostics.note=function(c,x,y,why){if(x&&y&&pair.includes(x.id)&&pair.includes(y.id))notes.push([Math.floor(G.day),x.id,y.id,c,String(why||'').slice(0,90)]);return n0.apply(this,arguments);};
 const open=()=>Commerce.state().contracts.filter(c=>!Commerce.closed(c)&&pair.includes(c.a)&&pair.includes(c.b)).map(c=>({id:c.id,once:!!c.once,legs:c.legs.map(l=>l.e+':'+l.r+':'+l.v),ends:c.ends??c.until??null}));
 const o0=open(),A=G.emps[${+a}],cool=A.aiTalk?.['commerce:${+b}']||null;while(G.day<${+day}+90)m1();
 return JSON.stringify({o0,cool,notes:notes.slice(0,30),o1:open()});})()`));
