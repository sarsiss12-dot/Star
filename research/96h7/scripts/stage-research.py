from pathlib import Path
import shutil,json
P=Path(__file__).resolve().parents[1];R=P.parent/'Star';dst=R/'research/96h7';dst.mkdir(parents=True,exist_ok=True)
def cp(a,b):b.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(a,b)
cp(P/'AI-KARAR-VERIMLILIK-96H7.md',R/'AI-KARAR-VERIMLILIK-96H7.md');cp(P/'RESEARCH-96H7.json',R/'RESEARCH-96H7.json');cp(P/'README.md',dst/'README.md');cp(P/'campaign-deadline-rejected.patch',dst/'campaign-deadline-rejected.patch');cp(P/'PORTABLE-VERIFICATION.json',dst/'PORTABLE-VERIFICATION.json')
for f in (P/'scripts').glob('*'):
 if f.is_file():cp(f,dst/'scripts'/f.name)
for name in ['SOURCE.json','F4-ARCHIVE-VERIFIED.json','HISTORICAL-COMPARISON.json','PROTOCOL.json','INITIAL-CONTROLS.json','CANONICAL-REUSE-CHECK.json','CANONICAL-REUSE-QUALIFIED.json','SENSITIVITY-COMPARISON.json','ONE-TURN-RESULT.json','OBJECTIVE-CENSUS.json','PREGAME-COMPARISON.json','CURRENT-CARGO-VECTORS.json','PERFORMANCE.json','CAMPAIGN-LIFECYCLE.json','TARGET-FEASIBILITY.json','AI-F4-H61.diff','HARNESS-NOTES.md','initial-runs.json','sensitivity-runs.json','pregame-runs.json','candidate-local-runs.json','battle-audit.log']:
 cp(P/'evidence'/name,dst/name)
for f in (P/'evidence/candidate-local').glob('summary-*.json'):cp(f,dst/'candidate-local'/f.name)
for f in (P/'evidence/regression').glob('*.log'):cp(f,dst/'regression'/f.name)
cp(P/'evidence/regression/summary.json',dst/'regression/summary.json');cp(P/'evidence/browser/results.json',dst/'browser/results.json')
# Store compact direct cause evidence, not hundreds of battle-round rows in git.
b=json.loads((P/'evidence/BATTLE-AUDIT.json').read_text());summary=[]
for r in b:
 loss={}
 for x in r['rounds']:
  loss[str(x['a'])]=loss.get(str(x['a']),0)+x['lossA'];loss[str(x['b'])]=loss.get(str(x['b']),0)+x['lossB']
 summary.append({k:r[k]for k in ['version','inputSHA256','exactFinalSaveMatches','nonCombatLosses']}|{'battleRounds':len(r['rounds']),'battleLossesByActor':loss})
(dst/'BATTLE-CAUSE.json').write_text(json.dumps(summary,indent=2))
paths=[R/'AI-KARAR-VERIMLILIK-96H7.md',R/'RESEARCH-96H7.json']+sorted(f for f in dst.rglob('*')if f.is_file())
records=[{'path':str(f.relative_to(R)),'mode':'100644','type':'blob','content':f.read_text()}for f in paths]
(P/'github-tree-entries.json').write_text(json.dumps(records,ensure_ascii=False));print(len(paths),'files',sum(f.stat().st_size for f in paths),'bytes')
