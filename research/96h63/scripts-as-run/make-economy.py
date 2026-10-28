from pathlib import Path
import json,hashlib
P=Path(__file__).resolve().parents[1];r=P/'economy';s=(P/'control/ai.js').read_text();prototype=(P.parent/'phase96h62/scripts/prototype.js').read_text()
# Extend only by native queue/build times, no new economic threshold.
prototype=prototype.replace("keys=['ene','min','yiy','tuk','ala','ara','etk'],horizon=6,day=G.day", "keys=['ene','min','yiy','tuk','ala','ara','etk'],horizon=6+Math.ceil(Math.max(0,...e.colonies.map(c=>(G.sys[c.s]?.planets[c.p]?.col?.q||[]).reduce((n,q)=>n+q.left,0)))/30)+2*Math.ceil(Math.max(...['santral','maden','ciftlik','fabrika','dokum'].map(k=>buildDays(e,k)))/30),day=G.day")
s=s.replace('function aiEconomyPlan(e){',prototype+'\n'+(P/'scripts/financing.js').read_text()+'\nfunction aiEconomyPlan(e){',1)
a=s.index('function aiRecoverEconomy(e){');b=s.index('function aiBuildingSustainable(',a)
s=s[:a]+'''function aiRecoverEconomy(e){
 if(!e.ai||e.id===0||e.dead||e.aiTalk?.['economy-recovery']?.until>G.day)return false;
 const f=ecoFinance63(e),a=f.selected?.first;
 if(!f.active||!a?.dem)return false;
 const ok=queueDemolish(e,G.sys[a.s],G.sys[a.s].planets[a.p],a.key);
 if(ok){(e.aiTalk||(e.aiTalk={}))['economy-recovery']={until:G.day+120,reason:'Two-action financing: '+a.key};AIDiagnostics.note('recovery:demolish',e,null,a.key+'; terminal repair finance checked');}return ok;
}
'''+s[b:]
s=s.replace('function aiEconomicOrder(e,sys,pl,legacy){','''function aiEconomicOrder(e,sys,pl,legacy){
 const f63=ecoFinance63(e);
 if(f63.active){const a=f63.selected?.first;return a&&!a.dem&&a.s===sys.id&&a.p===pl.i?[a.key]:[];}
''',1)
(r/'ai.js').write_text(s);m=json.loads((r/'RELEASE-MANIFEST.json').read_text());m['files']['ai.js']=hashlib.sha256(s.encode()).hexdigest();(r/'RELEASE-MANIFEST.json').write_text(json.dumps(m,indent=2))
