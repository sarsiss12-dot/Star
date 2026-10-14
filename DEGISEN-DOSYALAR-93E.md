# 93E değişiklikleri

- main.js: özgün 40 teknoloji listesi, 12 özel teknoloji ve gerçek katalog girdileri;
  temel bilim zaferi sayımı, savunma etkisi, yeni yapıda teknoloji/yerel inşa gemisi
  ve mükerrer iş kapısı; build 93e.
- economy.js: erişim, üç mod, puan/uygunluk koruması, AI bilim tercihi, geçmiş ve
  tek bildirim, bina teknoloji kapısı, gerçek yiyecek/tüketim malı girdisi.
- ai.js: yeni eskortu aynı bütçe/şablon üretimine ekleme; özel bina ve yapı seçimi.
- ui.js: üç mod, koşul görünürlüğü, erişim kaybı açıklaması, bina kilidi.
- diplomacy.js: uygun olmayan özel teknolojiyi takas/casuslukla edinmeyi engelleme.
- sw.js: yalnız yeni cache kimliği.
- Eski testlerde build/cache kimliği; 93D katalog testinde özgün 40 temel kayıt ile
  genişlemiş 52 düğüm ayrımı. Eski AI kampanya raporunun üzerine yazılmaz.
- Yeni testler, katalog fixture'ı, raporlar, yol haritası ve hash manifesti.

map.js, combat.js, audio.js, index.html ve manifest.json kanonik kaynakla bayt
olarak aynıdır. Kanonik dosya silinmedi. Temel 40 teknoloji ve ön koşulları ayrı
runtime eşitlik testiyle doğrulandı.

## Değişen mevcut dosyalar

- ACIK-RISKLER.md
- FAZ-PLANI.md
- GELISTIRME-GECMISI.md
- ILERI-GELISTIRME-PLANI.md
- ai.js
- diplomacy.js
- economy.js
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
- tests/faz93d1_navy_campaign_test.js
- tests/faz93d_research_planner_test.js
- tests/faz93d_science_ui_test.js
- ui.js

## Eklenen dosyalar

- BILIM-93E.md
- DEVAM-93E.md
- FAZ93E-RAPOR.txt
- TEKNOLOJI-KATALOGU-93E.json
- tests/faz93e_specialization_test.js
- tests/fixtures/techs-93d1.json
- tests/navy-93e-after-11.json
- tests/navy-93e-after-404.json
- tests/navy-93e-after-99.json
