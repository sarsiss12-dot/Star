from pathlib import Path
import json,hashlib,shutil,subprocess
P=Path(__file__).resolve().parents[1];E=P/'evidence';R=P.parent/'Star'
summary={}
for name in ['timeline404-107','timeline404-113','timeline404-119','timeline404-131','timeline11-218','timeline11-219']:
 d=json.loads((E/(name+'.json')).read_text());a=d['initial'];prod=[x for x in d['trace'] if x['kind']=='production-report'];assert len(prod)==6
 summary[name]={'inputSHA256':d['inputSHA256'],'startMonth':a['day']/30,'initialStocks':a['resources'],'income':a['income'],'plan':a['plan']['rows'],'paidJobs':a['jobs'],'realSerialClock':d['queueClock'],'monthlyActual':d['monthly'],'productionAndConsumption':prod,'actions':[x for x in d['trace'] if x['kind'] in ['queueBuilding','queueDemolish'] or x['kind']=='flow' and x['stage']=='vassalTick'],'pure':d['readOnly'] and d['forecastSaveEqual'] and d['forecastRngEqual'] and all(m['observerSaveEqual'] and m['observerRngEqual'] for m in d['monthly'])}
 assert summary[name]['pure']
(E/'timing-summary.json').write_text(json.dumps(summary,indent=2))
T1=json.loads((E/'T1-local.json').read_text());decision={'candidate':'T1','scope':'Only paid colony queue credit in six-month aiEconomyPlan; serial completion and productive months. No C2, A2 or threshold changes.','status':'REJECTED','reason':'Same saved seed11 actor7 recovery worsened 9 to 10 critical empire-months; targeted safety gate failed.','matrix120':'NOT RUN: failed local gate','long240':'NOT RUN: failed local gate','sameSave404':{'from':107,'to':160,'controlCriticalActor7':42,'T1CriticalActor7':32,'actor7AliveBoth':True},'sameSave11':{'from':218,'to':240,'controlCriticalActor7':9,'T1CriticalActor7':10,'actor7AliveBoth':True},'rows':T1}
(E/'T1-decision.json').write_text(json.dumps(decision,indent=2))
# Preserve exact experimental source differences, never copy them into production.
for label in ['C2','T1']:
 diff=subprocess.check_output(['git','diff','--','ai.js'],cwd=P/label,text=True)
 (E/(label+'-rejected.patch')).write_text(diff)
# Copy only generated files touched by this run back into evidence before restoration.
paths=['tests/audit-95d/95c1-preservation/war-lines-on.png','tests/audit96e1/identity-distribution.json','tests/navy-95a-after-11.json','tests/navy-95a-after-404.json','tests/navy-95a-after-99.json']
for n in paths:
 dst=E/'generated-test-outputs'/n;dst.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(R/n,dst)
subprocess.run(['git','restore','--',*paths],cwd=R,check=True)
if (R/'tests/audit96g2').exists():shutil.copytree(R/'tests/audit96g2',E/'generated-test-outputs/audit96g2',dirs_exist_ok=True);shutil.rmtree(R/'tests/audit96g2')
Q=R/'research/96h61';Q.mkdir(parents=True,exist_ok=True)
for n in ['canonical.json','PROTOCOL.json','C2-targeted.json','C2-gate120.json','C2-long-decision.json','T1-decision.json','historical-comparability.json','war-metadata-comparison.json','timing-summary.json','birth-11.json','birth-404.json','regression-final.json','browser-final.json','game-package.json','C2-rejected.patch','T1-rejected.patch']:
 shutil.copy2(E/n,Q/n)
# Exact as-run drivers, including original source identity in each raw campaign.
shutil.copytree(P/'scripts',Q/'scripts-as-run',dirs_exist_ok=True)
print('Final audit summaries and rejected patches preserved; production AI unchanged.')
