// 36K kuşatma: kara ordusuz bombardıman / kara ordulu çıkarma / yoldaki ordu (ateşkes) / bekleyen ordu sevkiyatı / savaş ortasında barış.
const {runtime}=require(require('path').resolve(__dirname,'../../../../tests/helpers/runtime'));
function world(){const h=runtime({root:process.argv[2]});h.run(`setupGame({...CFG,seed:22,size:'orta',aiCount:5,pirates:false});G.autoSave=false;var A=G.p,S=G.emps[1];A.contact[S.id]=S.contact[A.id]=true;
 for(const s of G.sys)if(!s.seen.includes(0))s.seen.push(0);S.civics=[];
 var T=G.sys[S.home],P=T.planets.find(p=>p.col&&p.owner===S.id);
 function month(n=1){for(let i=0;i<n*60;i++){const m=Math.floor(G.day/30);G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();if(Math.floor(G.day/30)>m)monthTick();}}
 function big(sys){const f=newFleet(A,sys,[{c:'kor'}]);while(fleetPower(f)<36000)f.ships.push({c:['kor','muh','zir'].find(c=>SHIPS[c])||'kor',h:1});return f;}
 warAuthorize(A,S,{n:'t'});declareWar(A,S);warAuthClear();S.exh={};A.exh={};`);return h;}
const snap=h=>JSON.parse(h.run(`JSON.stringify({d:Math.round(G.day),owner:P.owner,shield:Math.round(P.col?.shield||0),garr:Math.round(P.col?.garrison||0),base:Math.round(P.col?.garrisonBase||0),siege:P.col?.siege||0,truce:P.col?.truce,ta:P.col?.truceAge||0,war:!!A.war[S.id]})`));
for(const sc of ['bombard','army','army-blocked','peace-mid','fort','fort-army-blocked','ally-garrison']){const h=world();if(sc.startsWith('fort'))h.run("P.col.b.kale=(P.col.b.kale||0)+6;for(let i=0;i<3;i++)groundTick();P.col.garrison=P.col.garrisonBase;P.col.shield=shieldCap(P.col,S,{s:T.id,i:P.i});");if(sc==='ally-garrison')h.run("var Z=G.emps[2];Z.ally[S.id]=S.ally[Z.id]=true;newFleet(Z,T.id,[{c:'ord'}]);");
 h.run(`var F=big(T.id);F.name='Ana 36K';`);
 if(sc==='army')h.run(`newFleet(A,G.sys[T.lanes[0]].id,[{c:'ord'},{c:'ord'},{c:'ord'}]).path=[T.id];`);
 if(sc==='army-blocked'||sc==='fort-army-blocked')h.run(`var tf=newFleet(A,A.home,[{c:'ord'},{c:'ord'}]);tf.path=findPath(A.home,T.id,A)||[];tf.jointHoldUntil=G.day+99999;`);
 const rows=[];for(let m=1;m<=30;m++){h.run('month(1)');if(sc==='peace-mid'&&m===3)h.run("makePeace(A,S,'agreement',0)");const s=snap(h);rows.push(m+':'+s.shield+'/'+s.garr+'/'+s.siege+(s.truce!==undefined?'T'+s.ta:'')+(s.war?'':'P')+(s.owner===0?'!':''));if(s.owner===0)break;}
 console.log(sc,h.run('fleetPower(F)|0'),JSON.stringify(snap(h)),rows.join(' '));}
