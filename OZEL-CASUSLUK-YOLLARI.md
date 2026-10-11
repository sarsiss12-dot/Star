# Özel casusluk yolları — 87C.1 kod incelemesi

| Yol | Ücret ve sonuç | Geçmiş / soruşturma | Bu faz |
|---|---|---|---|
| Fısıltı Ağı | 45 Etki; başarı ve ifşa bağımsız | whisperLog → counterIntelTick; actor özeti opLog | Dört sonuç, güncel hedef kapısı, UI ve actor kaydı |
| Fısıltıya iftira ekleme | Toplam 80 Etki; başarı ×.88, ifşa ×1.55 | Aynı whisperLog, blame alanı | Gerçek maliyet/yüzde ve ifşa edilmiş iftiranın doğru anlatımı |
| falseFlagOp | 140 Etki; teknoloji verisi veya senato sabotajı; iftira ve olası savaş | hitLog by=masum/framed=fail → deepInvestigate; actor opLog | Geçmiş, uygunluk, gerçek savaş sonucu ve geçici yetki temizliği |
| trySabotage | Kuşatma sırasında otomatik; deneme 30 Etki; yakalanmada ek 40 (eldekiyle sınırlı) | Koloni sabCd/sabotaged/ambush; say ve sabStats | Kod yolu sınıflandırıldı, değiştirilmedi |

Kuşatmada çift ajan saldırgana bilerek yanlış başarı bildirir; kalkan ayakta
kalır ve pusu oluşur. Bu yolun true dönüşü gerçek kalkan kaybı garantisi
DEĞİLDİR. Genel başarılı/başarısız etiketiyle bilgi sızdırılmamalıdır.
88B savaş geri bildirimi bu iki tarafın bildiklerini ayrı ele almalıdır.

Açık hafıza borcu: runWhisper anlık ifşası, counterIntelTick gecikmeli ifşası
ve deepInvestigate bazı komplo/sabotaj anılarını tür bazında topluca siler.
Başka geçmiş olayların anıları da aynı türde olabilir. Anılar remember ile
birleştirildiği için tek bir filtre satırını değiştirip düzeldi demek yeterli
olmaz. Operasyonla ilişkilendirme ve eski v8 göç politikası 89A'da incelenecek.

Fısıltı actor özeti denemenin anındaki sonucu saklar; sonraki ifşa mevcut
whisperLog.found/foundAt ve bildirimlerde kalır. Actor özetine sonradan ifşa
senkronizasyonu bu fazın kapsamı değildir. Yeni bir soruşturma RNG yolu yoktur.
