"""Compare p44 and candidate half-day campaign traces."""
import argparse
import collections
import gzip
import json
from pathlib import Path
from statistics import median

RESOURCES = ('ene', 'min', 'yiy', 'tuk', 'ala')


def load(file):
    with gzip.open(file, 'rt', encoding='utf-8') as stream:
        return json.load(stream)


def critical(empire, resource):
    return (not empire['dead'] and empire['inc'][resource] < 0
            and empire['res'][resource] < -3 * empire['inc'][resource])


def summarize(run, days):
    months = [month for month in run['months'] if month['day'] <= days]
    events = [event for event in run['events'] if event['day'] <= days]
    colonies = collections.defaultdict(list)
    completed = {event.get('id'): event for event in events
                 if event['kind'] == 'built' and event.get('id') is not None}
    intents = {event['id']: event for event in events if event['kind'] == 'replacement'}
    cycles, replacements = [], []
    for event in events:
        if event['kind'] in ('paid', 'removed'):
            key = (event['actor'], event['system'], event['planet'])
            colonies[key].append(event)
    for records in colonies.values():
        for i, removed in enumerate(records):
            if removed['kind'] != 'removed':
                continue
            first = records[i + 1] if i + 1 < len(records) else None
            if first and first['kind'] == 'paid' and first['day'] <= removed['day'] + 180:
                built = completed.get(first.get('id'))
                if built and first['key'] == removed['key']:
                    cycles.append(dict(removed=removed, order=first, built=built,
                                       net=first['paid'].get('min', 0) - removed['refund'].get('min', 0)))
            wanted = intents.get(removed.get('id'))
            if wanted:
                target = None
                for event in records[i + 1:]:
                    if event['kind'] == 'removed' or event['day'] > removed['day'] + 720:
                        break
                    if event['key'] == wanted['wanted'] and event.get('id') in completed:
                        target = event
                        break
                replacements.append(dict(day=removed['day'], wanted=wanted['wanted'],
                                         done=completed[target['id']]['day'] if target else None))
    settled = [r for r in replacements if r['day'] + 720 <= days]
    rows = [[e for e in month['emps'] if not e['dead']] for month in months[1:]]
    checkpoints = {}
    for month in (6, 12, 24, 120, 180, 240):
        state = next((m for m in months if m['day'] == 30 * month), None)
        if state:
            checkpoints[month] = dict(alloy=sum(e['inc']['ala'] for e in state['emps'] if not e['dead']),
                                      hulls=sum(e['kind'] == 'ship-delivered' and e['day'] <= state['day']
                                                for e in events))
    return dict(
        days=months[-1]['day'], demolitions=sum(e['kind'] == 'removed' for e in events),
        cycles=len(cycles), netMinerals=sum(c['net'] for c in cycles),
        critical=sum(any(critical(e, r) for r in RESOURCES) for empires in rows for e in empires),
        actor2GoodsCritical=sum(e['id'] == 2 and critical(e, 'tuk') for empires in rows for e in empires),
        alloyMedian=median(sum(e['inc']['ala'] for e in empires) for empires in rows),
        finalAlloy=sum(e['inc']['ala'] for e in rows[-1]),
        delivered=sum(e['kind'] == 'ship-delivered' for e in events),
        militaryMedian=median(sum(e['military'] for e in empires) for empires in rows),
        tradeDeliveries=sum(e['deliveries'] for e in months[-1]['emps']),
        tech=sum(e['tech'] for e in rows[-1]),
        deferred=dict(collections.Counter(e['reason'] for e in events if e['kind'] == 'replacement:deferred')),
        replacementCount=len(replacements),
        replacementDone=sum(r['done'] is not None for r in replacements),
        replacementCohort=len(settled),
        replacementCohortDone={m: sum(r['done'] is not None and r['done'] - r['day'] <= 30 * m for r in settled)
                               for m in (6, 12, 24)},
        checkpoints=checkpoints,
        warEnds=dict(collections.Counter(f.get('endReason') or 'ongoing' for f in run['fronts']
                                         if f.get('ended') and f['ended'] <= days))
    )


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('output', type=Path)
    parser.add_argument('--candidate', default='aday')
    args = parser.parse_args()
    results = {}
    for key in ('100-9-11', '100-9-99', '100-9-404', '500-16-11'):
        base_file = args.output / ('p44-' + key + '.json.gz')
        next_file = args.output / (args.candidate + '-' + key + '.json.gz')
        if not base_file.exists() or not next_file.exists():
            continue
        base, candidate = load(base_file), load(next_file)
        days = min(base['months'][-1]['day'], candidate['months'][-1]['day'])
        first = next((e for e in candidate['events'] if e['kind'].startswith('replacement:')), None)
        aligned = list(zip(base['months'], candidate['months']))
        first_save_change = next((b['day'] for b, a in aligned
                                  if b['sha256'] != a['sha256'] or b['rng'] != a['rng']), None)
        first_rng_change = next((b['day'] for b, a in aligned if b['rng'] != a['rng']), None)
        ends = [base['months'][-1]['day'], candidate['months'][-1]['day']]
        results[key] = dict(p44=summarize(base, ends[0]), candidate=summarize(candidate, ends[1]),
                            commonDays=days, nativeEnds=ends, equalThrough=sum(
                                b['day'] < (first_save_change if first_save_change is not None else days + 1)
                                for b, a in aligned), firstChange=first, firstSaveChange=first_save_change,
                            firstRngChange=first_rng_change)
        if ends[0] != ends[1]:
            results[key]['samePeriod'] = dict(p44=summarize(base, days), candidate=summarize(candidate, days))
    print(json.dumps(results, indent=2, ensure_ascii=False))


if __name__ == '__main__':
    main()
