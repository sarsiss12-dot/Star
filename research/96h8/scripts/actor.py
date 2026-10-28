import json,sys
S,tag,actor=sys.argv[1],sys.argv[2],int(sys.argv[3]);arms=sys.argv[4:]
for a in arms:
  d=json.load(open(f'{S}/runs/ss{tag}-{a}.json'))
  es=[[x for x in r['emps'] if x['id']==actor][0] for r in d['rows']]
  first,last=es[0],es[-1]
  minE=min(e['ene'] for e in es);minNet=min(e['incEne'] for e in es);defm=sum(1 for e in es[1:] if e['incEne']<0)
  maxUp=max(e['fleetUp'] for e in es);maxAway=max(e['upAway'] for e in es)
  dis=sum(x['ships'] for x in d['events'] if x['kind']=='disband' and x['e']==actor)
  rec=[int(x['day']) for x in d['events'] if x['kind']=='campaign-recalled' and x['e']==actor]
  rea=sum(1 for x in d['events'] if x['kind']=='campaign-reassessed' and x['e']==actor)
  att=sum(1 for e in es[1:] if (e['camp'] or {}).get('phase')=='attack');fund=sum(1 for e in es[1:] if (e['camp'] or {}).get('phase')=='fund')
  crit=sum(1 for e in es[1:] if e['crit'])
  print(f'{a:9s} ships {first["ships"]}->{last["ships"]} power {round(first["power"])}->{round(last["power"])} sys {first["systems"]}->{last["systems"]} techs {first["techs"]}->{last["techs"]} ene {round(first["ene"])}->{round(last["ene"])} minEne {round(minE)} minNet {minNet:.1f} deficitMonths {defm} maxUp {maxUp:.1f} maxAway {maxAway:.1f} disband {dis} recall {rec} reassessed {rea} attackMonths {att} fundMonths {fund} crit {crit}')
