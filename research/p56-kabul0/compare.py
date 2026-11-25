#!/usr/bin/env python3
from collections import Counter
import json
from pathlib import Path
import sys

historic, new = map(Path, sys.argv[1:3])
fields = ('cols', 'power', 'ships', 'wildLoss', 'nests', 'contact0', 'surv', 'wars', 'dead')
output = {}
for key, size, seed in [('u9-99', 'ulu', 99), ('u9-404', 'ulu', 404), ('s5-23', 's500', 23), ('s5-404', 's500', 404)]:
    arms = {}
    for file in sorted(historic.glob(f'{key}-*.json')):
        data = json.loads(file.read_text())
        row = data['snap'][-1]
        arms[file.stem[len(key)+1:]] = {
            'last': {field: row.get(field) for field in fields},
            'reforms': data['ev'].get('memberReformProposal', 0),
            'leave': data.get('leaveWhy', []),
            'joint': data['joint'],
        }
    control, cand = (new / f'{size}-{seed}-p{p}.json' for p in (55, 56))
    row = output[key] = {'claude': arms}
    if not (control.exists() and cand.exists()):
        continue
    a, b = (json.loads(f.read_text()) for f in (control, cand))
    first = next((i for i, (x, y) in enumerate(zip(a['hashes'], b['hashes'])) if x != y), None)
    rng = next((i for i, (x, y) in enumerate(zip(a['months'], b['months'])) if x['rng'] != y['rng']), None)

    def totals(m):
        return {
            'day': m['day'],
            'colonies': sum(len(e['colonies']) for e in m['empires']),
            'power': round(sum(e['power'] for e in m['empires'])),
            'ships': sum(e['ships'] for e in m['fleets'].values()),
            'tech': sum(e['tech'] for e in m['empires']),
            'science': round(sum(e['science'] for e in m['empires'])),
            'activeShips': sum(e['active'] for e in m['fleets'].values()),
            'types': dict(sum((Counter(x['classes']) for x in m['fleets'].values()), Counter())),
            'states': len(m['empires']),
            'cargo': m['cargo'],
            'fronts': m['fronts'],
        }

    def wars(data):
        keyed = {}
        for month in data['months']:
            for war in month['fronts']:
                keyed.setdefault(tuple(sorted(war[2])), {'daySeen': month['day'], 'front': war})
        return keyed

    baseline, later = wars(a), wars(b)
    row['replay'] = {
        'firstSaveMonth': None if first is None else first+1,
        'firstRngMonth': None if rng is None else rng+1,
        'firstPrizes': b['prizes'][:5],
        'firstReforms': b['reforms'][:8],
        'firstAdmissionRejections': b.get('refused', [])[:5],
        'leaves': b['leaves'],
        'candidateOnlyWars': [v for k, v in later.items() if k not in baseline],
        'controlOnlyWars': [v for k, v in baseline.items() if k not in later],
        'totals': [totals(x['months'][-1]) for x in (a, b)],
        'crisisMonths': [sum(bool(e['crisis']) for m in arm['months'] for e in m['empires']) for arm in (a,b)],
        'shortageMonths': [sum(e['cg'] for m in arm['months'] for e in m['empires']) for arm in (a,b)],
        'battleReports': [len(x['battles']) for x in (a, b)],
    }
print(json.dumps(output, ensure_ascii=False, indent=2))
