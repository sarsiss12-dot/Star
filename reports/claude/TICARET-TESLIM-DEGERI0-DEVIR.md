# TİCARET-TESLİM-DEĞERİ.0 — Devir

Güncelleme: 23 Kasım 2026

## Dallar
| Dal | Durum |
|---|---|
| `claude/stars-ticaret-teslim-degeri0` | Araştırma (çalışma zamanı = p52), sürüm yok |
| `claude/stars-ticaret-gecerli-hat0` | **p52 / MP.8.9b51 — en güncel yayın adayı** (PR #76) |
| `claude/stars-ticaret-tamamlama0` | p51 (PR #75) |

Render için `claude/stars-ticaret-gecerli-hat0`. main ve Render değiştirilmedi.

## Kesinleşenler
- p52 performans gerilemesi yok: ABBA Node ölçümü (`perf-abba.cjs`) medyan ±%0,2, A/A içinde. Sonraki perf ölçümlerinde bu araç kullanılmalı; Chromium p95'i tek başına kapı kararına uygun değil.
- Ticaret değerlemesi doğal kampanyada kaçırılan fırsat üretmiyor. 4 kampanyada 1 gerçek vaka; o da rota bütçesi yüzünden.
- `aiBalance` sözleşmeli ithalatı saymıyor ve değer varış zamanını içermiyor. İkisi de doğrulandı; ilkini düzelten aday faydasız → reddedildi.
- Gıda / tüketim malı krizlerinin (404) kökü: krizdeki devletin limanı yok, temas yok, ortak ihraç edemiyor.

## NOT RUN
- Fiziksel Android, LAN, uzak internet, Render.
- Bu dalda tam Node ve Chromium (çalışma zamanı değişmedi; p52 sonuçları geçerli).

## Sonraki ilk görev
- Kullanıcı test edebiliyorsa: Render'da p52 ile mobil ticaret kabulü.
- Edemiyorsa: planlanan savaş desteği / FED-AI-SİYASET AI fazı. Ticaretten aktarılacaklar:
  - temas ve liman genişlemesi asıl ekonomik kaldıraç;
  - federasyon `ticaret` yasası izin sorununu çözer.
- Ticarette ileride ölçülebilecekler:
  - limansız kriz devletinin liman yatırımı (krizde yatırım kapısı);
  - rota bütçesinin AI sırasına göre adil dağıtımı. Tek vaka var; büyük galakside ölçülmeli.
