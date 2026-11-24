# TİCARET-FİNAL.0 — Devir

Güncelleme: 24 Kasım 2026

## Dallar
| Dal | Durum |
|---|---|
| `claude/stars-ticaret-final0` | **p53 / MP.8.9b52 — en güncel yayın adayı** ({{PR}}) |
| `claude/stars-ticaret-teslim-degeri0` | araştırma, çalışma zamanı p52 (PR #77) |
| `claude/stars-ticaret-gecerli-hat0` | p52 (PR #76), geri dönüş |

Render için `claude/stars-ticaret-final0`. main ve canlı Render değiştirilmedi.

## Ticaret döngüsü kapandı
- Geliştirme tamam. Kalan iş saha kabulü ve aşağıdaki bilinen tasarım sınırlarıdır. Ayrıntı: `TICARET-FINAL0-SONUC.md` §3 envanter, §16 kapanış matrisi.
- p53 değişikliği:
  - `Commerce.tick` içinde tick ömürlü `openEdge` / `relay` önbelleği (`memoEdge` / `memoRelay`);
  - sözleşme formunda açıklama.
- Önbelleğe dokunacak yeni kod için kural: tick içinde liman, izin, savaş, sahiplik, abluka ya da görünürlük değiştiren bir kod eklenirse, yazmadan önce `Commerce._tickMemo=null` yapılmalı ya da kod tick dışına alınmalı.

## Bilinen tasarım sınırları (yeniden araştırma gerektirmeden ayrı faz kararı)
1. İnsan sahiplere atomik iki yönlü / çok duraklı transit izni (çok taraflı işlem motoru).
2. İzin süresi (360 gün) ↔ uzun sözleşme: yenileme yok.
3. Limansız kriz devletinin liman yatırımı (404).
4. Rota bütçesi sırası (tek vaka).
5. `aiBalance.need` gelen kargoyu saymıyor. Aday reddedildi; yeniden uygulanmaz.

## Araçlar
- `research/ticaret-final0/yogun-konvoy.cjs`: Codex koridoru, ABBA. Kullanım: `N=12 OUT=x node … <kökA> <kökB> <kayıt>`.
- `research/ticaret-teslim-degeri0/perf-abba.cjs`: normal oyun perf. Kapı kararları için bu araç kullanılmalı, Chromium p95 değil.
- `tests/browser-ticaret-tamamlama0-sp.cjs`: U1–U5, 3 çözünürlük.

## NOT RUN
- Fiziksel Android, LAN, uzak internet, canlı Render.
- p53 ile uzun MP oturumu (`MP8_SCEN=I`).

## Sonraki ilk görev
- Kullanıcı test edebiliyorsa: Render'da p53 ile iki cihazlı ticaret kabulü (TR akışı elle).
- Edemiyorsa: planlanan savaş desteği / FED-AI-SİYASET.0 AI fazı. Ticaret yeni bir faz kararı olmadan açılmamalı.
