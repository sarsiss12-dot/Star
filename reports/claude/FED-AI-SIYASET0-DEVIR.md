# FED-AI-SİYASET.0 — Devir

Güncelleme: 25 Kasım 2026

## Dallar

| Dal | Durum |
|---|---|
| `claude/stars-fed-ai-siyaset0` | **p56 / MP.8.9b55 — en güncel yayın adayı** (taslak PR #81, taban `claude/stars-savas-destek-ai0`) |
| `claude/stars-savas-destek-ai0` | p55 / MP.8.9b54 (PR #80), geri dönüş |

- Render için `claude/stars-fed-ai-siyaset0`. main ve canlı Render değiştirilmedi.
- Kontrol kökü: `git archive 914c003` (p55, sabit kopya).

## Kod haritası (yalnız `ai.js`)

**Federasyon üye sesi ve çıkışı** (`aiFederationPolitics` üye dalı, `aiFedStayReview`'den önce yazılmış yardımcılar):
- `aiFedMismatch(e,f)`: tercih edilen tür (`aiFedType`) ile birlik türü arasındaki `aiFedAffinity` farkı (≥0,35 ise uyumsuzluk).
  - destek: canlı üyelerden kaçı o türü birlik türüne yeğliyor;
  - `plausible`: destek ≥ yarı, reform/geçiş kilidi yok, son 4 yılda reddedilmemiş ve henüz önerilmemiş;
  - `unresolved`: reddedildi, kilitli ya da desteksiz.
- `aiFedMemberReform(e,f)`: başkan olmayan AI üye, `plausible` ise mevcut `proposeFedMotion(e,'reform',{type})` yolunu kullanır (bedel 150 Etki, %75, 12 ay geçiş aynen). `_fedReformAsk` aynı reformu 4 yıl tekrarlatmaz.
- `aiFedStayReview`: `unresolved` uyumsuzluk çatışma terimine girer (başkana güven indirir). Sabır sayacı, dürüstlük ve "yaşayabilir alternatif" kapısı p55 ile aynı. Çıkış `leaveFederation`; `_fedLeft={fed,type}` kaydı.
- `aiFedVoteWant`: reform önergesinde iyi niyet terimi en çok +0,1 (doymuş ilişki her reformu geçiriyordu).

**Tek katılım kapısı**:
- `aiFedWilling(e,founder,type,f)`: `f.id` olan (var olan) birliğe AI katılımı `aiFedLeftRecently` ya da `aiFedDoctrineBar` ise ret.
- Kapsadığı yollar: başvuru (`aiRivalBlocChoice`), davet kabulü, kabul oyu sonrası AI kabulü (`diplomacy.js` `fedResolveVote` içindeki `aiFedWilling` çağrısı), `aiStrategicDiplomacy` federasyon başvurusu ve "yaşayabilir alternatif".
- `aiFedDoctrineBar(e,f)`: fark ≥0,35 ve üyelerin (+ kendisi) yarısından azı o türü destekliyor. Ayrılık kuralıyla aynı ölçüt.
- Kuruluş (`f.id` yok) ve insan değişmez.

**Ödül avı** (`aiTurn` barış dalı): `sy.seen` ya da `aiView(e).ctx.visible` (şu an sensörle görülen). İstihbarat belleği bilerek dışarıda (reddedilen varyant: `research/fed-ai-siyaset0/ADAY-ODUL-BELLEK-rejected.patch`).

Yeni Save8 alanı yok. `_fedLeft`, `_fedReformAsk`, `_fedStrain` alt çizgili AI alanları; misafir aynasına gitmez (FA A3).

## Kurallar (sonraki işler için)

- AI'nın var olan birliğe katılım kararı **yalnız** `aiFedWilling` üzerinden. Yeni bir katılım yolu eklenirse bu kapıyı çağırmalı. Aksi hâlde katıl → ayrıl çalkantısı geri gelir (kampanyada aynı AI 3 kez).
- Üye ayrılışı için yeni koşul `aiFedStayReview` çatışma terimine eklenir; yaşayabilir alternatif ve sabır sayacı korunur.
- AI insan adına öneri, oy ya da ayrılış yapmaz (`e.ai` kapıları; MP testleri M1–M3, FA A1–A3).
- Kampanyada AI–AI temas oranını ölçerken `contact0` (yalnız kurucu AI'lar) kullanın. Ayrılıkçı yeni devlet herkesle temasla doğar ve `contact`'ı şişirir (500/16 t23: 142 temas bu yoldan).
- Plasebo tek RNG çekimi bazı tohumlarda emiliyor (mulberry32 sayaç; "uygun olana kadar çek" kalıbı). Birden çok plasebo günü kullanın (300/600/900/1500).

## Testler

| Komut | Sonuç |
|---|---|
| `node tests/fed_ai_siyaset0_test.js` | 14/0 (p55'te yeni vakalar FAIL) |
| `node tests/fed_ai_siyaset0_mp_test.js` | 3/0 |
| `STARS_CONTROL_ROOT=<git archive 914c003> node tests/fed_ai_siyaset0_equivalence_test.js` | 4/0 |
| `MP8_SCEN=FA STARS_CHROMIUM_PATH=/opt/pw-browsers/chromium node tests/browser-mp8.cjs` | 5/0 |

Kampanya / tanı araçları (`research/fed-ai-siyaset0/`, hepsi saf, RNG çekmez):
```sh
CAMP_SIZE=ulu|s500 CAMP_AI=9|16 [CAMP_TENSION=calkantili] [CAMP_RIVALS=az|cok] [PLACEBO_DAY=<gün>] node camp.cjs <kök> <tohum> <ay> <çıkış>
node tur.cjs <kök> <tohum> <askeri|bilimsel|ticaret|yagmaci> <ay> <çıkış>   # START=60
node cephe.cjs | rota.cjs | av.cjs | temas.cjs | temas-kaynak.cjs <kök> <tohum> <ay> <çıkış>
node stres-kayit.cjs <kök> <girdi.save> <çıkış.save>   # K2 siyasi yoğunluk kaydı
```

## NOT RUN

- Fiziksel Android, gerçek uzak internet, LAN, canlı Render.
- İki gerçek insanla saha kullanılabilirliği.

## Sonraki ilk görev

- Kullanıcı test edebiliyorsa: p56'da uyumsuz AI üyeli bir federasyonda reform önergesi kartı, ret ve AI'nın gerekçeli ayrılışı (Haber ağı / federasyon geçmişi).
- Edemiyorsa: jointOps "Ulaşılabilir ikmalli toplanma noktası veya açık askerî rota yok" reddi (aday kampanyada 13 / 28 ret). `rota.cjs` alt nedeni çoğunlukla bilinen rota yok (toplanma noktasına giden yol bilinen sistemlerden geçmiyor). Kanıt olmadan sınır gevşetilmemeli.
