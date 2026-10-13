# 93D → 93D.1 dosya değişiklikleri

- ai.js: fiziksel/pending envanter, bütçeli çoklu tersane kararı, bilim yenileme
  beklemesi, sınıf ağırlıkları ve AI şablon güncellemesi; mevcut Colossus politikasını
  helper'a ayırma, tüm tersanelerde mükerrer sipariş kontrolü.
- main.js: build 93d1; AI bilim gemisini bağımsız filo olarak tamamlama;
  reinforceFleet için isteğe bağlı tersane bekleme sınırı; aiDesign metadata'sını
  Save v8 yüklemesinde koruma. Araştırma kodunda davranış değişikliği yok.
- sw.js: stars-v93d1 cache kimliği.
- Eski testlerde yalnız build/cache beklentileri; faz93c filo testinde bilinçli
  çoklu AI sipariş davranışına göre tek sipariş sınırını güncelleme. Yeni testler
  gerçek maliyet, üst sınır, sınıf, tekilleştirme ve kampanya sonuçlarını ayrıca sınar.
- Yeni 17 hedefli üretim kontrolü ve 8 kampanya kontrolü, salt gözlem aracı,
  üç tohumun 120 aylık ham önce/sonra verileri ve regresyon günlükleri.
- Raporlar, devam noktası, ileri plan ve teslim hash manifesti güncellendi.

93D'ye göre ui.js, index.html, economy.js, map.js, combat.js, diplomacy.js,
audio.js ve manifest.json bayt olarak aynıdır. Eski kaynak dosyası silinmedi.
Bilim ağacı/kuyruk/geçmiş, teknoloji kataloğu ve UI.setTech yeniden geliştirilmedi.

## Değişen mevcut dosyalar

- ACIK-RISKLER.md
- FAZ-PLANI.md
- GELISTIRME-GECMISI.md
- ILERI-GELISTIRME-PLANI.md
- ai.js
- main.js
- sw.js
- tests/faz84a_intel_dedup_test.js
- tests/faz84b_vassal_state_dedup_test.js
- tests/faz84c_state_visibility_gate_test.js
- tests/faz85a_political_save_integrity_test.js
- tests/faz85b_load_idempotency_test.js
- tests/faz85c_crisis_save_continuity_test.js
- tests/faz85d_campaign_save_continuity_test.js
- tests/faz85e_event_inbox_continuity_test.js
- tests/faz85f_spatial_simulation_continuity_test.js
- tests/faz86a_intel_command_center_test.js
- tests/faz86b_deal_engine_test.js
- tests/faz86c_1_quote_effective_plan_test.js
- tests/faz86c_2_transaction_test.js
- tests/faz86c_3_ai_negotiation_test.js
- tests/faz86c_4_reciprocal_offers_test.js
- tests/faz86c_4h_map_input_test.js
- tests/faz86c_4h_r1_exact_regression_test.js
- tests/faz86c_4h_r2_surface_camera_layers_test.js
- tests/faz86c_4h_r3_surface_lifecycle_test.js
- tests/faz86c_4h_r4_diagnosis_test.js
- tests/faz86c_4h_r4_targeted_diag_test.js
- tests/faz86c_strict_deal_ai_test.js
- tests/faz86g_integration_handoff_test.js
- tests/faz90rc_2_load_feedback_test.js
- tests/faz90rc_release_candidate_test.js
- tests/faz93c_fleet_composition_test.js

Yeni belgeler/testler/veriler RELEASE-MANIFEST.json içinde hash ile listelenir.

- tests/ai-dispatch-probe.js: eski kayıttan kalan gelir yerine üretim fırsatı
  testine açık pozitif enerji/alaşım geliri ve krizsiz durum verildi; aynı gerçek
  aiTurn/teslim yolu test edilir. Oyun kodu bu test için gevşetilmedi.
