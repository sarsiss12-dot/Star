from pathlib import Path
import json,hashlib,subprocess,shutil,zipfile
P=Path(__file__).resolve().parents[1];R=P.parent/'Star';E=P/'evidence';D=P.parent/'deliverables';D.mkdir(exist_ok=True)
read=lambda n:json.loads((E/n).read_text());hash=lambda b:hashlib.sha256(b).hexdigest();initial=read('SOURCE.json');m=json.loads((R/'RELEASE-MANIFEST.json').read_text())
assert all(hash((R/n).read_bytes())==sha for n,sha in m['files'].items());assert subprocess.check_output(['git','status','--short'],cwd=R,text=True)==''
perf=[]
for file,label in [('browser.json','experimental4x'),('qualification-1.json','160qualification1x'),('qualification-4.json','160qualification4x'),('final-tier-1.json','120final1x'),('final-tier-4.json','120final4x')]:
 d=read(file)
 for row in d['rows']:
  v=row.get('detail')or{}
  if 'performanceAccepted' in v:perf.append({'phase':label,'scenario':row['name'],'normalGate':v['performanceAccepted'],'nativeBudget':v.get('nativeFrameBudgetAccepted'),**{k:v[k]for k in ['medianFPS','p95DrawMs','heap']},**v['simulation']})
(E/'PERFORMANCE-SUMMARY.json').write_text(json.dumps(perf,indent=2))
scale=[]
for f in sorted(E.glob('scale-*.json')):
 d=json.loads(f.read_text());scale.append({k:d[k]for k in ['label','config','months','setupMs','medianMonthMs','p95MonthMs','maxMonthMs','maxHeapBytes','turn','last']})
(E/'SCALABILITY-SUMMARY.json').write_text(json.dumps(scale,indent=2))
record={'phase':'96H.6.3','kind':'RESEARCH ONLY — NO NEW GAME','canonical_head_before':initial['head'],'canonical_game':{'version':'96H.6.1','build':'96h61','pwa':'stars-v96h61','save':8,'zip':'stars-faz96h61.zip','bytes':initial['zipBytes'],'sha256':initial['zipSHA256'],'ai_sha256':m['files']['ai.js']},'runtime_changes_published':[],'economy':read('ECONOMY-DECISION.json'),'galaxy':{'decision':'REJECTED FOR MOBILE RELEASE','technicalGeneration':'117cases PASS,45old fullSave/RNG exact,72extended cases','maxExperimentalSystems':200,'maxExperimentalAI':20,'publishedMaxSystems':100,'publishedMaxAI':11,'performance':perf,'note':'Final requested120/13 tier failed4x seed23 p95live38.7ms>33.3333ms. No more variants.'},'proposed_save8_fix':{'scope':'Closed joint-plan history may have one surviving member; active plans still require2','realFailedSaveTests':9,'nativeFixtureTests':4,'published':False,'reason':'Both phase acceptance goals failed; preserve96h61 per phaseD'},'tests':{'fullExperimentalRegressionSuites':135,'fullPass':6068,'fullFail':0,'fullRunBeforeProposedLoadGuard':True,'newProductionStyleTests':9,'mechanicalEconomicTests':8,'engineScaleTests':9,'realLoadGuardTests':9,'jointPostfixTests':59,'sourcePreservationPostfixTests':15,'legacyExactWorldMonths':36,'sameF1DiagnosticWorldMonths':23,'newBrowserFunctionalScenarios':54,'canonicalPwaSmoke':1,'economicSeed404':'NOT RUN: seed11 failed','economic120':'NOT RUN','economic240':'NOT RUN','physicalAndroid':'NOT RUN'},'knownLimits':['4xFPS around16–24 even canonicalcontrols; normalCPU cases around60FPS. StressFPS not claimed30. All initial raw failures retained.','Performance.memory was quantized10000000; qualification usedCDP real heap. Graphics/native memory not measured.','Scalability host timings include concurrentworkers; not physicalAndroid estimates.','Far route computed and nativecolonization fixture passed; end-to-end player longvoyage touch order not separately run.'],'runtime19':m['files']}
(E/'RESEARCH-96H63.json').write_text(json.dumps(record,ensure_ascii=False,indent=2));(D/'RESEARCH-96H63.json').write_text(json.dumps(record,ensure_ascii=False,indent=2))
# Candidate sources remain explicitly research-only; production is untouched.
T=R/'research/96h63';T.mkdir(exist_ok=True)
for n in ['SOURCE.json','PRIOR-EVIDENCE-VERIFIED.json','ECONOMY-DECISION.json','DECISION-96H63.json','PERFORMANCE-SUMMARY.json','SCALABILITY-SUMMARY.json','PERFORMANCE-PROTOCOL.json','QUALIFICATION-PROTOCOL.json','FINAL-TIER-PROTOCOL.json','load-regression.json','fps-calibration.json','F1-rejected.patch','CAPACITY-REJECTED.patch','SAVE8-GUARD-PROPOSED.patch','economy-gate1.json','engine-scale.json','legacy-simulation.json']:
 shutil.copyfile(E/n,T/n)
for f in (P/'scripts').glob('*'):
 if f.is_file():out=T/'scripts-as-run'/f.name;out.parent.mkdir(exist_ok=True);shutil.copyfile(f,out)
for f in (E/'test-sources').rglob('*.js'):
 out=T/'test-sources'/f.relative_to(E/'test-sources');out.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(f,out)
(R/'RESEARCH-96H63.json').write_bytes((D/'RESEARCH-96H63.json').read_bytes())
print('Prepared research, runtime19 unchanged, no game/release created')
