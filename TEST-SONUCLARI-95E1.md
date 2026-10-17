# 95E.1 doğrulama

- `tests/faz95e1_random_event_switch_test.js`: **8/8**. Kurulumun gerçek click eylemi, 1000× pasif olay engeli, 1000× galaktik çalkantı engeli, RNG tüketmeme, Save v8 ve eski kayıt uyumu, gerçek diplomasi/casusluk/keşif fonksiyonlarının korunması, zincir temizlenmesi.
- 95E ilgili haber/gelen kutusu/uzaktan inşaat/UI ile yeni anahtar: **5 paket, 86/86**. Kanıt: `tests/logs-95e1-targeted`.
- Önceki olay+gelen kutusu testleri: **147/147**.
- İlk tam 95E.1 regresyonu zaman sınırı nedeniyle 14 pakette durdu. O ana kadar geçen kontroller önceki kanıttır; 95E.1 için 90+ paketin yeniden geçtiği iddia edilmez.
- Yerel `@napi-rs/canvas` eksik olduğundan native piksel testi çalıştırılamadı. Gerçek Android ve Chromium testi yapılmadı.
- Faz 95E kendi kapanış raporu: 90 paket / 5170 / 0; bu tarihsel kanıt 95E.1 test sonucu sayılmaz.
