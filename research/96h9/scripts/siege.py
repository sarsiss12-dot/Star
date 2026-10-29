import json,sys,collections
for f in sys.argv[1:]:
  d=json.load(open(f));rows=d['rows']
  caps=[x for x in d['events'] if x['kind']=='capture' and x['flips']]
  falls=[x for x in d['events'] if x['kind']=='fall' and x['type'] in ('teslim','katastrof','temiz')]
  print('=====',f.split('/')[-1],'colony captures',[(int(x['day']//30),x['sys'],x['by'],x['flips']) for x in caps])
  # siege episodes
  ep=collections.defaultdict(list)
  for m,r in enumerate(rows):
    for s in r['sieges']:
      ep[(s['atk'],s['def'],s['sys'],s['pl'])].append((m,s))
  for k,v in ep.items():
    atk=k[0];months=[m for m,_ in v]
    arm=[]
    for m,_ in v:
      a=[x for x in rows[m]['armies'] if x['e']==atk]
      arm.append(len(a))
    first=v[0][1];last=v[-1][1]
    toward=sum(1 for m,_ in v for x in rows[m]['armies'] if x['e']==atk and (x['end']==k[2] or x['to']==k[2]))
    print(f' siege atk{atk}->def{k[1]} sys{k[2]}/pl{k[3]} months {months[0]}-{months[-1]} n={len(v)} war {first["war"]}->{last["war"]} shield {first["shield"]}->{last["shield"]} cap {first["cap"]} garrison {first["garrison"]}->{last["garrison"]} base {first["gbase"]} siegeCnt {last["siege"]} defEne {first["defEne"]} | atk armies/month {arm[:12]} armyMonthsToward {toward}')
