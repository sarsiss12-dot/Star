# Erken görünürlük atlaması geri alındı

`reinforcementThreats` içinde görünmeyen sistem için `claimOf` çağrısından önce `continue` yapılması ilk kısa native örneklerde Save8/RNG eşdeğerdi. Gerçek Chromium 200/16 m30 kaydından 10 tam ay karşılaştırmasında ilk31. ayda fark bulundu: güç/baskı önbelleklerinin son hesaplandığı yarım gün ve türetilmiş değerler farklı. RNG aynı. Kanıt: `compare-fields/200-diff.json` ve ham iki Save8.

Alan silme, normalizasyon veya serializer değişikliği yapılmadı. Bu optimizasyon geri alındı. Önceki bu adaya ait hızlanma rakamları kabul edilmiş kazanım değildir. Uzun kampanyalar da bu ara adayı kullandığından son kod için aşağıdaki ek kontroller gereklidir. Son kontrol–aday testi yalnız ikmal bağlamı adayı üzerinde yapılır.
