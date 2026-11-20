"""Compare the three campaign arms over the same in-game months."""
import argparse
from collections import defaultdict
import json
from pathlib import Path
from statistics import median
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'ai-ikame0'))
from compare import RESOURCES, critical, load, summarize


def shortage_runs(months):
    runs = defaultdict(list)
    for month in months:
        number = month['day'] // 30
        for empire in month['emps']:
            for resource in RESOURCES:
                if critical(empire, resource):
                    periods = runs[empire['id'], resource]
                    if periods and periods[-1][1] == number - 1:
                        periods[-1][1] = number
                    else:
                        periods.append([number, number])
    return {resource: [dict(actor=actor, first=first, last=last, months=last-first+1)
                       for (actor, key), periods in sorted(runs.items()) if key == resource
                       for first, last in periods] for resource in RESOURCES}


def alloy_flows(run, days):
    months = [m for m in run['months'] if 0 < m['day'] <= days]
    living = [[e for e in m['emps'] if not e['dead']] for m in months]
    net = [sum(e['inc']['ala'] for e in empires) for empires in living]
    if not all(e.get('alloy', {}).get('upkeep') is not None for empires in living for e in empires):
        return None
    upkeep = [sum(e['alloy']['upkeep'] for e in empires) for empires in living]
    before_upkeep = [a+b for a, b in zip(net, upkeep)]
    foundry = [sum(row['n'] for e in empires for row in e['alloy']['lines']
                   if row['name'] == 'Bina üretimi: Alaşım Dökümhanesi') for empires in living]
    orders = [e for e in run['events'] if e['kind'] == 'ship-order' and e['day'] <= days]
    ledger = defaultdict(float)
    for event in run['events']:
        if event['kind'] == 'stock-alloy' and event['day'] <= days:
            sign = 'in' if event['delta'] > 0 else 'out'
            ledger[event['type'], sign] += abs(event['delta'])
    return dict(medianNet=median(net), medianUpkeep=median(upkeep), medianBeforeUpkeep=median(before_upkeep),
                medianFoundryBase=median(foundry), sumNet=sum(net), sumUpkeep=sum(upkeep),
                sumBeforeUpkeep=sum(before_upkeep), sumFoundryBase=sum(foundry), orders=len(orders),
                paidShipAlloy=sum(e['paid'].get('ala', 0) for e in orders),
                ledger={f'{kind}/{sign}': value for (kind, sign), value in sorted(ledger.items())},
                endingStock=sum(e['res']['ala'] for e in living[-1]))


def first_change(before, after):
    aligned = list(zip(before['months'], after['months']))
    index = next((i for i, (b, a) in enumerate(aligned) if b['sha256'] != a['sha256']), None)
    if index is None:
        return None
    day = aligned[index][0]['day']
    previous = aligned[index-1][0] if index else None
    events = lambda run: [e for e in run['events'] if day-30 < e['day'] <= day
                          and e['kind'] in ('demolition', 'recovery-demolition')]
    return dict(day=day, previous=previous and {k: previous[k] for k in ('day', 'sha256', 'rng')},
                firstRng=next((b['day'] for b, a in aligned if b['rng'] != a['rng']), None),
                before=events(before), after=events(after))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('evidence', type=Path)
    parser.add_argument('archived', type=Path)
    args = parser.parse_args()
    result = {}
    for key in ('100-9-11', '100-9-99', '100-9-404', '500-16-11'):
        arms = {}
        for arm, prior_name in (('p44', 'p44'), ('p45', 'aday'), ('aday', 'aday')):
            original = args.archived / f'{prior_name}-{key}.json.gz'
            directory = 'accepted' if arm == 'aday' else 'diagnosis'
            traced = args.evidence / directory / f'{arm}-{key}.json.gz'
            if traced.exists():
                trace = load(traced)
                if arm != 'aday':
                    old = load(original)
                    assert all((a['day'], a['sha256'], a['rng']) == (b['day'], b['sha256'], b['rng'])
                               for a, b in zip(trace['months'], old['months'])), (key, arm)
                    if trace['months'][-1]['day'] < old['months'][-1]['day']:
                        trace = old
                arms[arm] = trace
            elif arm != 'aday':
                arms[arm] = load(original)
        if 'aday' not in arms:
            continue
        days = min(run['months'][-1]['day'] for run in arms.values())
        result[key] = dict(commonDays=days, firstChange=first_change(arms['p45'], arms['aday']))
        for arm, run in arms.items():
            months = [m for m in run['months'] if 0 < m['day'] <= days]
            by_resource = shortage_runs(months)
            end = months[-1]['emps']
            result[key][arm] = dict(nativeDay=run['months'][-1]['day'], **summarize(run, days),
                                    militaryFinal=sum(e['military'] for e in end if not e['dead']),
                                    resourceMonths={r: sum(v['months'] for v in runs) for r, runs in by_resource.items()},
                                    shortageRuns=by_resource, alloyFlows=alloy_flows(run, days))
    print(json.dumps(result, indent=2, ensure_ascii=False))


if __name__ == '__main__':
    main()
