import json,sys,glob,os
S=sys.argv[1];months=sys.argv[2];arms=sys.argv[3:]
seeds=[11,99,404,7,23,42,123,2026]
keys=['criticalEmpireMonths','deliveries','techs','colonies','ships','power','alive','warsStarted','peace','contracts','plansCompleted','plansFailed','upkeep']
tot={a:{k:0 for k in keys} for a in arms}
print('seed '+' | '.join(arms))
for s in seeds:
  row=[]
  for a in arms:
    f=f'{S}/c{months}/{a}-{s}/summary-{a}-{s}.json'
    d=json.load(open(f))
    for k in keys: tot[a][k]+=d.get(k,0) or 0
    row.append('crit %d del %d tech %d col %d ships %d pow %d alive %d wars %d'%(d['criticalEmpireMonths'],d['deliveries'],d['techs'],d['colonies'],d['ships'],d['power'],d['alive'],d['warsStarted']))
  print(s,' | '.join(row))
for a in arms: print(a,{k:round(v,1) for k,v in tot[a].items()})
