"""Kampanya kontrolü ve adayı ortak ay sınırında karşılaştırır."""
import json
import sys
from collections import Counter
from pathlib import Path

RESOURCES = ('ene', 'min', 'yiy', 'ala', 'tuk')
FLOOR = (80, 60, 40, 60, 40)


def pair(a, b):
    return ':'.join(map(str, sorted((a, b))))


def summarize(data, months=None):
    rows = data['months'][:months]
    observation = data['contactAudit']
    state = observation['months'][len(rows) - 1]
    cutoff = state['day']
    active = [x for x in observation['months'] if x['day'] <= cutoff]
    events = [x for x in observation['contacts'] if x['day'] <= cutoff]
    moves = [x for x in observation['moves'] if x['day'] <= cutoff]
    charts = [x for x in observation['charts'] if x['day'] <= cutoff]
    contacts = {pair(x['a'], x['b']): x for x in events if x['method'] == 'paylasimli-fiziksel'}
    pacts = [x for x in observation['pacts'] if x['day'] <= cutoff]
    receipts = [x for x in data['receipts'] if x['day'] <= cutoff]
    delivery = [x for x in receipts if x['status'] == 'delivered']
    new_links = [x for x in delivery if pair(x['from'], x['to']) in contacts
                 and contacts[pair(x['from'], x['to'])]['day'] <= x['day']]
    freight = [x for x in data['deals'] if x['day'] <= cutoff and x.get('id') is not None]
    stock_short = Counter()
    cargo = Counter()
    for x in delivery:
        cargo[x['r']] += x['delivered']
    for row in rows:
        for e in row['states']:
            for r, stock, inc, floor in zip(RESOURCES, e['stocks'], e['inc'], FLOOR):
                if stock < floor and inc < 0:
                    stock_short[r] += 1
    return {
        'source': data['source'], 'months': len(rows), 'endReason': data['endReason'] if len(rows) == len(data['months']) else None,
        'founderPairs': len(state['pairs']), 'physicalContacts': Counter(x['method'] for x in events),
        'sharedTargets': len(moves), 'sharedContacts': list(contacts.values()), 'mappedSystems': sum(x['added'] for x in charts),
        'sharedPairs': len({pair(x[0], x[1]) for row in active for x in row['grants']}),
        'activeDirections': len(state['grants']), 'tradePactsSigned': len(pacts), 'activeTradePactsPerAI': sum(x['pacts'] for x in state['empires'])/len(state['empires']),
        'contactsPerAI': sum(x['contacts'] for x in state['empires'])/len(state['empires']),
        'signatures': len(freight), 'loads': sum(x['day'] <= cutoff for x in data['loads']), 'deliveries': len(delivery),
        'losses': len(receipts)-len(delivery), 'firstDelivery': delivery[0]['day'] if delivery else None,
        'throughNewSharedContact': new_links, 'valueProxy': sum(x['valueReceiver']-x['valueSource'] for x in receipts),
        'distinctPartners': len({pair(x['from'], x['to']) for x in delivery}),
        'cargoByResource': cargo, 'shortageResourceMonths': stock_short, 'colonies': sum(e['colonies'] for e in rows[-1]['states']),
        'largestFederationShare': state['biggest'], 'federations': rows[-1]['feds'], 'warDegree': sum(x['wars'] for x in state['empires']),
        'scienceLosses': sum(x['day'] <= cutoff for x in observation['scienceLosses']),
        'funnel': Counter(x[3] for x in data['notes'] if x[0] <= cutoff), 'rng': rows[-1]['rng'], 'save': rows[-1].get('save'),
    }


def compare(directory):
    result = []
    for control in sorted(directory.glob('kontrol-*.json')):
        candidate = control.with_name(control.name.replace('kontrol-', 'aday-', 1))
        if not candidate.is_file():
            continue
        a, b = (json.loads(p.read_text()) for p in (control, candidate))
        n = min(len(a['months']), len(b['months']))
        if not n:
            continue
        rng = next((x['day'] for x,y in zip(a['months'], b['months']) if x['rng']!=y['rng']), None)
        result.append({'size': a['size'], 'seed': a['seed'], 'commonMonths': n,
                       'rngFirstDivergence': rng,
                       'controlMonth': len(a['months']), 'candidateMonth': len(b['months']),
                       'controlEnd': a['endReason'], 'candidateEnd': b['endReason'],
                       'control': summarize(a,n), 'candidate': summarize(b,n)})
    return result


if __name__ == '__main__':
    print(json.dumps(compare(Path(sys.argv[1])), ensure_ascii=False, indent=2))
