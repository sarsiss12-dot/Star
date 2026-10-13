# 93D değişen dosyalar

Kanonik 93C ZIP ile byte karşılaştırması. Eski kaynak dosyası silinmedi.

## Üretim kodu

- economy.js: ortak araştırma planı, teknoloji bazlı ilerleme, geçmiş, Kadim gelir yolu; mevcut AI skorları korunur.
- main.js: Save v8 normalleştirmesi, gerçek teknoloji edinimlerinin geçmiş kaydı, bilim zaferi doğru tamamlanma sayısı, build kimliği.
- diplomacy.js: iki mevcut teknoloji edinim yolunu geçmiş/ilerleme kapısına bağlama; anlaşma motoru kuralları değişmez.
- ui.js: bilim ağaçları, kuyruk, rota, Geçmiş ve ilerleme koruyan setTech.
- index.html: yalnız bilim ekranına özgü CSS bloğu.
- sw.js: stars-v93d cache.

## Diğer değişen mevcut dosyalar

- ACIK-RISKLER.md
- FAZ-PLANI.md
- GELISTIRME-GECMISI.md
- ILERI-GELISTIRME-PLANI.md
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
- tests/helpers/ui-preservation.js
- RELEASE-MANIFEST.json: 93D kimliği ve tüm nihai dosya hashleri.

## Yeni içerik

- BILIM-93D.md, DEVAM-93D.md, FAZ93D-RAPOR.txt ve bu dosya.
- tests/faz93d_research_planner_test.js, tests/faz93d_science_ui_test.js.
- tests/results-93d.json, tests/performance-93d.json, tests/preservation-93d.json.
- tests/logs-93d-targeted/, tests/logs-93d/, tests/logs-93d-final/ ve çalıştırma günlükleri.

Eski testlerin davranış iddiaları korunur. Sürüm/cache beklentileri 93d olarak
güncellendi; altı HTML koruma kontrolü ortak helper üzerinden hem yeni bilim
CSS hem değişmeyen eski HTML imzasını doğrular. Tarihsel referans hash aynıdır.
