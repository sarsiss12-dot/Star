#!/usr/bin/env python3
"""Paket sayaçlarını, ilk hatayı ve zinciri ham özete bağlı olarak çıkarır."""
import argparse
import json
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument('summary', type=Path)
parser.add_argument('--compare', type=Path)
args = parser.parse_args()

def load(file):
    data = json.loads(file.read_text(encoding='utf-8'))
    packages = {}
    for row in data['results']:
        chain = [line.strip() for line in row.get('details', '').splitlines() if line.strip()]
        signal = row.get('signal') or row.get('error')
        packages[row['name']] = {
            'pass': row['pass'], 'fail': row['fail'], 'exit': row['exit'],
            'durationMs': row['durationMs'], 'signal': signal,
            'timeout': row.get('timedOut', signal == 'SIGKILL' and row['durationMs'] >= 179000),
            'firstError': chain[0] if chain else signal, 'errors': chain,
            'inboxReference': any('DiplomaticInbox is not defined' in line for line in chain),
        }
    return {'totals': {k: data[k] for k in ('suites', 'pass', 'fail')}, 'packages': packages}

before = load(args.summary)
out = dict(before)
inbox = [row for row in before['packages'].values() if row['inboxReference']]
out['inboxCandidate'] = {
    'packages': len(inbox), 'failInPackages': sum(row['fail'] for row in inbox),
    'messages': sum(sum('DiplomaticInbox is not defined' in s for s in row['errors']) for row in inbox),
}
if args.compare:
    after = load(args.compare)
    out['after'] = after['totals']
    out['changes'] = {}
    for name in sorted(before['packages'].keys() | after['packages'].keys()):
        a, b = (x['packages'].get(name) for x in (before, after))
        state = lambda row: tuple(row[k] for k in ('pass', 'fail', 'exit', 'timeout')) if row else None
        if state(a) != state(b):
            out['changes'][name] = {'before': a, 'after': b}
print(json.dumps(out, ensure_ascii=False, indent=2))
