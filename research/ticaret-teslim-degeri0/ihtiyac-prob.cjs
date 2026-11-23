// node ihtiyac-prob.cjs <kök> — aiBalance ihtiyacının sözleşmeli ithalatı ve varış süresini dikkate alıp almadığı (salt okunur; 96a kargo fikstürü)
const path=require('path');const {cargoWorld}=require(path.resolve(__dirname,'../../tests/helpers/96a-fixture'));
const h=cargoWorld();console.log(h.run(`JSON.stringify((()=>{const a=G.emps[0],b=G.emps[1];a.inc={min:30,ene:-6,yiy:0,ala:0,tuk:0};a.res.min=900;a.res.ene=100;b.inc={min:-6,ene:30};b.res.ene=900;
 /* terms(): a mineral verir, b her 30 günde 8 enerji gönderir → a için enerji İTHALATI */
 const n0=Commerce.aiBalance(a).ene;const ok=executeDeal(terms());const n1=Commerce.aiBalance(a).ene;
 const near={from:1,to:0,give:[{t:'freight',r:'ene',v:12,source:3,target:0,every:30,months:12}],want:[{t:'freight',r:'min',v:8,source:0,target:3,every:30,months:12}]};
 const far={...near,give:[{...near.give[0],every:180}],want:[{...near.want[0],every:180}]};
 return {once:{need0:+n0.need.toFixed(2),incoming0:n0.incoming},contract:ok,after:{need1:+n1.need.toFixed(2),incoming1:+n1.incoming.toFixed(2),net1:+n1.net.toFixed(2)},
  valueNear:+Commerce.aiValue(a,near).net.toFixed(2),valueFar180:+Commerce.aiValue(a,far).net.toFixed(2)};})())`));
