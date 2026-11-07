# Komut/fikstür hataları (ürün PASS/FAIL ile karıştırılmaz)

- İlk araştırma probe: generateGalaxy içindeki yerel components() dışarıdan çağrılamadı; testte bağımsız BFS ile düzeltildi, ilk FAIL dosyaları korunur.
- Alan tanısı eklenirken karşılaştırma betiğinde `ofJSON.parse` yazım hatası: SyntaxError; `of JSON.parse` düzeltildi. compare-diagnosis.log saklanır.
- İlk Chromium kampanyasında modal kapatma önceki hızı geri yükledi; kontrolsüz başlangıç ilerlemesi saptandı, koşu durduruldu. Son ölçüm enterGame sonrası ilk frame öncesi hızı0 yapar ve her adımda hız0 doğrular. INTERRUPTED.md korunur.
- İlk MP.1 static testi UI uyarısı değiştiği hâlde manifest güncellenmediği için13/1 FAIL; beklenen manifest SHA farklıydı. Manifest gerçek dosyalarla güncellendi; aynı katı test14/0 PASS. Assertion değişmedi.
- Çıkarılmış ZIP doğrulayıcısının ilk çağrısında dizin konumsal argüman olarak verildi; argparse exit2 verdi. Doğru `--root` çağrısı extracted-verify.log içinde PASS. ZIP ve runtime değişmedi.
- Son UI kaynak bütünlüğü tekrarında varsayılan sandbox `spawnSync git EPERM` verdi; aynı salt okunur test gerekli yürütme izniyle `ui-integrity-verified.log` içinde PASS. Assertion veya kaynak testi gevşetilmedi.
- Son doğrulama komutunun bir denemesi otomatik onay incelemesindeki kullanım sınırı nedeniyle **hiç yürütülmedi**. Güvensiz işlem kararı değildi. Kullanıcı devam istediğinde aynı doğrulama normal onay incelemesinden geçerek çalıştı; izin/inceleme sınırı aşılmadı.
