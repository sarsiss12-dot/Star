# Devam — 93E.1

Bu kaynak 93E'nin SHA-256 ve ZIP CRC doğrulamasından türetildi.
Faz93E.1: altı doktrin teknolojisi, İktisat Bürosu/Sinod Evi, gerçek askerî
üretim süresi, savunma, bakım ve istihbarat etkileri. Oyun build93e1,
PWA cache stars-v93e1; Save v8 değişmedi.

Önce FAZ93E1-RAPOR.txt, BILIM-93E1.md, TEKNOLOJI-KATALOGU-93E1.json,
ACIK-RISKLER.md ve ILERI-GELISTIRME-PLANI.md okunmalı.
Tam test kanıtı tests/logs-93e1/summary.json ve test başına loglardadır.
Eski faz belgeleri/logları tarihseldir; yeni sonuçları temsil etmez.

Geliştirme yüzeyi:
- main.js: altı teknoloji, iki bina, militaryBuildMul tanımı, savunma etkisi,
  takviye süre hesabının ortak yardımcıyı kullanması ve build kimliği.
- economy.js: shipProductionDays(), gerçek etki açıklamalarının etiketleri.
- ui.js: bina bakım satırı gerçek 1,6 ekonomi katsayısını gösterir.
- sw.js: cache sürümü. Araştırma motoru, AI bütçesi, diplomasi/edinim
  kapıları ve Save8 şeması yeniden yazılmadı.
- tests/faz93e1_doctrine_test.js: 32 yeni odaklı kontrol.

Gereksiz tam test tekrarı yapmayın. İlgili testi STARS_CASE alt dizesiyle
izole edin; gerekli değişiklikten sonra ilgili regresyonu çalıştırın.
Tam çalıştırma: STARS_TEST_LOGS=tests/logs-next node tests/run-all.js
Paket bütünlüğü: python3 tools/verify-release.py
Yerel oyun: python3 -m http.server 8000

Sıradaki büyük arayüz fazı94A, fakat otomatik başlanmaz. Öncelikli ticaret
bütünlük denetimi bağımsızdır. GitHub'a ayrı izin olmadan yayın yapılmaz.
