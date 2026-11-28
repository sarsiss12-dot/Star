"""campaign.cjs çıktısından devlet ve kaynak bazında fiziksel ticaret özeti."""
import json
import sys
from collections import Counter, defaultdict
from pathlib import Path

RESOURCES = ('ene', 'min', 'yiy', 'ala', 'tuk')
BASE = dict(zip(RESOURCES, (80, 60, 40, 60, 40)))


def summarize(data):
    rows = data['months']
    states = {row['day']: {e['id']: e for e in row['states']} for row in rows}
    empires = defaultdict(lambda: {
        'partners': set(), 'contracts': set(), 'signed': set(), 'loaded': Counter(),
        'received': Counter(), 'lost': Counter(), 'shortageMonths': Counter(),
        'portsUsed': set(), 'shortageFlagMonths': 0, 'minStock': {},
        'aliveMonths': 0,
    })
    notes = Counter()
    for day, a, b, code, *why in data['notes']:
        notes[code] += 1
    aid = set(e for sample in states.values() for e in sample)
    for month in rows:
        for e in month['states']:
            dest = empires[e['id']]
            dest['aliveMonths'] += 1
            dest['shortageFlagMonths'] += int(e['shortage'])
            for r, stock, inc in zip(RESOURCES, e['stocks'], e['inc']):
                dest['minStock'][r] = min(stock, dest['minStock'].get(r, stock))
                if stock < BASE[r] and inc < 0:
                    dest['shortageMonths'][r] += 1
    # Plunder and unloading are recorded separately by the original engine.
    # Contracts may remain open after the last load. Don't infer closure from silence.
    contracts = {d['id']: d for d in data['deals'] if d.get('id') is not None}
    payments = Counter()
    for d in data['deals']:
        contract = d.get('id')
        if contract is not None:
            for e, partner in ((d['from'], d['to']), (d['to'], d['from'])):
                if e in aid:
                    empires[e]['signed'].add(contract)
        if any(i['t'] == 'portTransit' for i in d['give'] + d['want']):
            for e, items in ((d['from'], d['give']), (d['to'], d['want'])):
                payments[e] += sum(i['v'] for i in items if i['t'] == 'res' and i['r'] == 'etk')
    for load in data['loads']:
        e = empires[load['from']] if load['from'] in aid else None
        if e is not None:
            e['loaded'][load['r']] += load['amount']
            e['contracts'].add(load['contract'])
            terms = contracts.get(load['contract'], {})
            for it in terms.get('give' if terms.get('from') == load['from'] else 'want', []):
                if it.get('r') == load['r'] and it.get('source') is not None:
                    e['portsUsed'].add(it['source'])
    crisis_receipts = []
    receipts = Counter()
    for r in data['receipts']:
        receipts[r['status']] += 1
        if r['from'] in aid:
            empires[r['from']]['lost'][r['r']] += r['lost']
        if r['status'] != 'delivered':
            continue
        for e, partner in ((r['from'], r['to']), (r['to'], r['from'])):
            if e in aid:
                empires[e]['partners'].add(partner)
        if r['to'] in aid:
            empires[r['to']]['received'][r['r']] += r['delivered']
        if r['inc'] < 0 and r['before'] < BASE[r['r']]:
            crisis_receipts.append({**r, 'recoveredReserve': r['before'] + r['delivered'] >= BASE[r['r']]})
    final = states[rows[-1]['day']]
    flat = lambda obj: {key: sorted(value) if isinstance(value, set) else value for key, value in obj.items()}
    for e, row in empires.items():
        row['final'] = final.get(e)
        row['transitInfluencePaid'] = payments[e]
        row['eliminated'] = e not in final
    daily = data.get('dailyEconomy')
    series = [e for month in daily['growth'] for e in month['empires']] if daily else []
    daily_summary = {
        'resourceDays': daily['resourceDays'],
        'lastState': daily['growth'][-1],
        'meanOpenPerLivingAI': sum(e['open'] for e in series) / len(series),
        'portOrders': daily['portOrders'],
        'firstActivePorts': daily['firstActivePorts'],
        'endReason': data['endReason'],
    } if series else {}
    return {
        'seed': data['seed'], 'size': data['size'], 'ai': data['aiCount'], 'months': len(rows),
        'save': data['end'], 'rng': rows[-1]['rng'], 'receiptCounts': receipts,
        'campaignDistinctPartnersPerAI': sum(len(r['partners']) for r in empires.values()) / len(aid),
        'contractMonthsMeanWorld': sum(row['open'] for row in rows) / len(rows),
        'lastOpen': rows[-1]['open'], 'signed': len(contracts), 'crisisReceipts': crisis_receipts,
        'firstFreightDay': min((x['day'] for x in contracts.values()), default=None),
        'firstDeliveryDay': min((x['day'] for x in data['receipts'] if x['status'] == 'delivered'), default=None),
        'funnel': notes, **daily_summary, 'empires': {e: flat(row) for e, row in sorted(empires.items())},
    }


if __name__ == '__main__':
    print(json.dumps([summarize(json.loads(Path(p).read_text())) for p in sys.argv[1:]], indent=2, ensure_ascii=False))
