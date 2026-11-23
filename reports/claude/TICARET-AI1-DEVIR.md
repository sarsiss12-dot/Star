# TİCARET-AI.1 — Devir (sonraki Claude oturumu)

Güncelleme: 23 Kasım 2026

## Dallar
| Dal | Durum |
|---|---|
| `claude/stars-ticaret-ai1` | p50 çalışma zamanı (değişmedi) + TR testi + liman / transit araştırması; taslak PR (taban ai0), sürüm yok |
| `claude/stars-ticaret-ai0` | PR #73, araştırma (sürüm yok) |
| `claude/stars-ticaret-ag2` | **p50 / MP.8.9b49 — en güvenli sürüm** (PR #72) |

Render'da sonraki kullanıcı testi için `claude/stars-ticaret-ag2` (p50) kullanılmalı. main ve Render değiştirilmedi.

## Tamamlananlar
1. **Faz A.** Stratejik liman yatırımının kök nedeni (`research/ticaret-ai1/funnel3.cjs`; 100/9 × 3 tohum + 500/16 tohum 11):
   - kolonilerin çoğu zaten limanlı;
   - eşleşme ya da bilgi yok;
   - bir yıllık sözleşme değeri liman bedelinin %2–%49'u;
   - 4 yıllık ufukla bile ≤2 fırsat, onlar da başka kapılara takılıyor.
2. **Liman ufku ×4 adayı.** Doğal kampanyada 0 yatırım → reddedildi (`ADAY-LIMAN-UFUK4-rejected.patch`).
3. **Transit.**
   - TİCARET-AI.0 yamasının atomik olmadığı K7'de gösterildi.
   - Atomik v2 hazırlandı (`ADAY-IKI-YONLU-TRANSIT-ATOMIK-BEKLETILDI.patch`). Doğal fayda bant içinde → bekletildi.
   - 500 sistemde rota bütçesi darboğazı var, ama ayrı pay adayında erişilen 8 çiftin 8'i ekonomik şartta elendi → reddedildi (`ADAY-TRANSIT-BUTCE-rejected.patch`).
4. **MP.** `MP8_SCEN=TR` Chromium 6/6: kargolu kayıt → yeni oda → misafirler döner → tek teslim. TL / TA / TB / SG / J / X hepsi PASS.

## Son başarılı testler
- Chromium: TR 6/0, TL 5/0, TA 6/0, TB 6/0, SG 5/0, J 5/0, X 5/0.
- Kontrollü: transit K1–K7 (p50 / v1 / v2) ve liman L-D1a / D1 / D3 / D4 / D5 / D9.
- `verify-release` DOĞRULANDI (96h10p50).
- Tam Node: 245 / 6551 / 279 (p50 ile aynı; yeni FAIL yok).

## İlk başarısız (bu fazda)
- TR ilk deneme: `STARS_CHROMIUM_PATH` verilmediği için Chromium başlamadı (ortam hatası, `evidence/ticaret-ai1/chromium/tr1.log`).
- Liman fikstürü:
  - koloni şablonunun kuyruğunda `santral` vardı (kuyruk meşgul) → kuyruk boşaltıldı;
  - açık kaynak (mineral) liman bedelini karşılamıyordu → ayrı vaka L-D1a olarak saklandı.
- K7 v1: gerçek kusur (kısmi ödeme) → v2.

## NOT RUN
- Fiziksel Android, gerçek LAN, uzak internet, canlı Render.
- 180 / 240 ay ve 500 sistemde plasebo bandı.
- Aday p95 ölçümü.

## Sonraki ilk kesin görev
Kullanıcı test edebiliyorsa: Render'da p50 ile 2 cihaz.

Edemiyorsa: **FED-AI-SİYASET.0**. Ticaret ayağı: federasyon `ticaret` yasasının (izin sorununu kendiliğinden çözer) üyelik kararındaki gerçek ekonomik değeri `funnel2` / `camp` araçlarıyla ölçülmeli.

Ticaret ağını büyütmek istenirse kaldıraç liman değil, genişleme / sömürgeleştirme kararıdır (boşluklar AI'nın sahip olmadığı sistemlerde); bu ayrı faz kararıdır.
