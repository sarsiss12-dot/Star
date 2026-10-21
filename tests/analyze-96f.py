"""Reproduce the release's measured campaign tables and concrete action excerpts."""
import collections,json,pathlib
root=pathlib.Path(__file__).resolve().parent.parent
out=root/'tests/audit96f';campaigns=out/'campaigns'
def load(p):return json.loads(p.read_text())
def events(d):
    seen=set();result=[]
    for rows in d['monthly']:
        for e in rows:
            for v in e.get('strategy',{}).get('history',[]):
                key=json.dumps([e['id'],v],sort_keys=True)
                if key not in seen:seen.add(key);result.append({'actor':e['id'],**v})
    return sorted(result,key=lambda x:(x['day'],x['actor']))
data={};analyses=[]
for seed in [11,99,404]:
    before=load(campaigns/f'96E1-{seed}.json');after=load(campaigns/f'96F-{seed}.json');data[seed]=after;ev=events(after)
    (out/f'decision-events-{seed}.json').write_text(json.dumps(ev,ensure_ascii=False,indent=2)+'\n')
    changes=[]
    for actor in [e['id'] for e in after['initial']['identities']]:
        chosen=[x for x in ev if x['actor']==actor and x['kind']=='objective-selected']
        for previous,next_event in zip(chosen,chosen[1:]):
            changes.append({'actor':actor,'previous':previous['objective'],'next':next_event['objective'],'afterDays':next_event['day']-previous['day'],'reason':next_event['reason']})
    def totals(d):return {k:sum(e['income'][k] for e in d['monthly'][-1] if not e['dead']) for k in ['ene','min','ala','ara','tuk']}
    analyses.append({'seed':seed,'comparison':load(campaigns/f'comparison-{seed}.json'),'finalNetIncome':{'old':totals(before),'next':totals(after)},'objectiveSelections':dict(collections.Counter(x['objective'] for x in ev if x['kind']=='objective-selected')),'changes':changes,'earlyNormalChanges':sum(x['afterDays']<720 and x['reason']=='Kimlik, bilinen çevre ve kendi ekonomik kapasitesi' for x in changes),'finalMemoryKinds':dict(collections.Counter(m['k'] for e in after['monthly'][-1] for rows in e.get('memory',{}).values() for m in rows)),'tradeDiagnosticCounts':{k:v for k,v in after['diagnostics']['counts'].items() if k.startswith('trade-')},'initialIdentities':after['initial']['identities']})
# Excerpts are selected from unmodified actual transaction traces, not synthetic
# plan flags. Intent and execution are labelled separately in the prose report.
chains=[{'name':'Scientific continuity','seed':404,'actor':4,'intent':[e for e in events(data[404]) if e['actor']==4 and e['kind'] in ['objective-selected','milestone-complete']],'actual':[x for x in data[404]['trace'] if x['actor']==4 and (x['kind']=='research-completed' or x['kind']=='building-order' and x['key'] in ['maden','lab'])][:18]},
{'name':'Economic and diplomatic preparation, war and peace','seed':11,'actor':2,'intent':[e for e in events(data[11]) if e['actor']==2 and 1590<=e['day']<=2940 and e['kind'] in ['objective-selected','preparation-stage','milestone-complete','diplomatic-proposal']],'actual':[x for x in data[11]['trace'] if 1590<=x['day']<=2610 and (x['actor']==2 and x['kind'] in ['building-order','ship-order','diplomatic-offer','war-start','fleet-route'] or x['kind']=='peace' and x['other']==2)],'front':[f for f in data[11]['warLedger']['fronts'] if f['id']==1]},
{'name':'Real freight and response to losses','seed':11,'actor':4,'actual':[x for x in data[11]['trace'] if x['actor']==4 and (x['kind']=='diplomatic-offer' and x['day'] in [630,780] or x['kind']=='freight-delivered' and x['day']<1000 or x['kind']=='freight-raided' or x['kind']=='fleet-route' and x['day']==3090)],'intent':[e for e in events(data[11]) if e['actor']==4 and e['kind']=='trade-route-protection']},
{'name':'Failed science plan and reassessment','seed':11,'actor':5,'intent':[e for e in events(data[11]) if e['actor']==5 and e['day']<=1230 and e['kind'] in ['objective-selected','plan-reassessed','preparation-stage','milestone-complete']],'actual':[x for x in data[11]['trace'] if x['actor']==5 and x['day']<=1230 and x['kind'] in ['building-order','research-completed']]}]
(out/'campaign-analysis.json').write_text(json.dumps({'method':'Same source ZIP, seed, map and homes; normal difficulty, five AI, idle player, 120 months, real simulation ticks, Save8 reload at month60. Counts are delivered sender voyages. Plans completed are bounded measured milestones, not automatic war wins.','results':analyses},ensure_ascii=False,indent=2)+'\n')
(out/'decision-chains.json').write_text(json.dumps({'scope':'Intent records and actual paid/action traces are distinct. Temporal order is evidence of real state changes; it is not a counterfactual proof that every legacy action was caused solely by the new objective.','chains':chains},ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'seeds':3,'monthsPerRun':120,'pairedRuns':6,'chains':len(chains),'earlyNormalChanges':[x['earlyNormalChanges'] for x in analyses]},ensure_ascii=False))
