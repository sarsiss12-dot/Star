// Kontrollü ahlak deneyi: aynı doktrin (militarist), aynı dünya; yalnız ethics.ahl değişir. Gerçek aiWarReview / fedDefend.
const path=require('path'),root=process.argv[2]||'/home/user/Star',{runtime}=require(path.join(root,'tests/helpers/runtime'));
const src=require('fs').readFileSync('/home/user/Star/tests/beta_rival_blocs0_test.js','utf8');
const pre=src.slice(src.indexOf('function world('),src.indexOf("const allied="));
const world=new Function('runtime','J',pre+';return world;')(runtime,(h,x)=>JSON.parse(h.run('JSON.stringify('+x+')')));
const out={nap:[],defense:[]};
for(const grudge of [-20,-60,-110]){const h=world({ai:5});h.run(`(()=>{globalThis.A=G.emps[1];globalThis.T=G.emps[2];for(const e of [A,T]){e.mizac='militarist';e.persLock='militarist';delete e._prof;delete e._pers;}
    A.nap[2]=G.day+3600;T.nap[1]=G.day+3600;A.rel[2]=T.rel[1]=-60;for(const e of G.emps)e.peaceAt={};A.mem=A.mem||{};A.mem[2]=[{k:'sistemAldi',v:${grudge},t:G.memAge||0}];
    G.fleets=G.fleets.filter(f=>f.e!==2);for(let i=0;i<4;i++)newFleet(A,A.home,[{c:'kru'},{c:'kru'},{c:'kru'},{c:'kor'}]);ensureIntel(A)[2]=3;for(const k of Object.keys(A.res))A.res[k]=1e6;
    for(const e of G.emps)if(e!==A)e.ai=false;})();var SNAP=serialize();`);
  for(const ahl of [-3,-1,0,1,3]){let broke=0,example=null,ap=null;const N=120;
    for(let k=1;k<=N;k++){h.run(`deserialize(SNAP);A=G.emps[1];T=G.emps[2];A.ethics.ahl=${ahl};delete A._prof;rndSeed(${k*7919});`);
      if(k===1)ap=JSON.parse(h.run('JSON.stringify((()=>{const a=warAppetite(A,T);return {score:+a.score.toFixed(3),brake:+a.brake.toFixed(3),cb:a.cb&&a.cb.n,threshold:+(.92-a.grudge*.45).toFixed(3),budget:aiWarBudget(A,T).ok};})())'));
      h.run('for(let m=0;m<12&&!A.war[2];m++){aiWarReview();}');if(h.run('!!A.war[2]')){broke++;if(!example)example=JSON.parse(h.run('JSON.stringify({oath:A.oathLog&&A.oathLog[0],mem:(T.mem[1]||[]).map(m=>m.k)})'));}}
    out.nap.push({grudge,ahl,trials:N,broke,rate:+(broke/N).toFixed(3),appetite:ap,example});console.log('nap',grudge,ahl,broke+'/'+N,JSON.stringify(ap));}}
for(const strong of [0,6,40])for(const ahl of [-3,0,3]){const h=world({ai:5});
  h.run(`(()=>{globalThis.F=mkFed([1,2],'askeri');globalThis.M=G.emps[2];globalThis.V=G.emps[1];globalThis.X=G.emps[3];M.ethics.ahl=${ahl};M.rel[1]=20;G.fleets=G.fleets.filter(f=>f.e!==3&&f.e!==2);newFleet(M,M.home,[{c:'kor'},{c:'kor'}]);for(let i=0;i<${strong};i++)newFleet(X,X.home,[{c:'kru'},{c:'kru'},{c:'kru'}]);ensureIntel(M)[3]=3;X._lastCB={n:'Test'};warAuthorize(X,V,X._lastCB);declareWar(X,V);warAuthClear();})()`);
  const r=JSON.parse(h.run('JSON.stringify({risk:aiKnownPower(M,X)/(aiKnownPower(M,M)+1),joined:!!M.war[3],log:M.oathLog||[]})'));out.defense.push({strong,ahl,...r});console.log('def',strong,ahl,JSON.stringify(r));}
require('fs').writeFileSync(process.argv[3]||'/tmp/ethics.json',JSON.stringify(out,null,1));
