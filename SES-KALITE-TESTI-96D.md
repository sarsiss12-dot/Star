# Gerçek Chromium Web Audio ölçümü

Chromium133, stereo22050Hz OfflineAudioContext ve gerçek AudioContext kullanıldı. Hiçbir ses çıktısı oyun paketine dosya olarak eklenmedi. Ölçümler donanım hoparlörü/mikrofon veya dinleme testi değildir.

| Atmosfer | Render | Tepe | RMS | Kırpılmış örnek | Oluşan/temizlenen geçici düğüm |
|---|---:|---:|---:|---:|---:|
| normal | 45s | 0.499929 | 0.023107 | 0 | 391/391 |
| explore | 45s | 0.499929 | 0.023184 | 0 | 391/391 |
| war | 45s | 0.493803 | 0.023212 | 0 | 528/528 |
| crisis | 45s | 0.492597 | 0.024662 | 0 | 482/482 |

Her renderda alarm/keşif/zafer birlikte sınandı; NaN/Infinity örnek, kırpılma, kalan geçici düğüm ve oyun RNG farkı sıfır. Skorun32 ölçüsü her sahnede akor üyeliği/cümle sınırına uyar. Bunlar ayrı dört Chromium render deneyidir.

Yedi SFX'in aynı anda çalındığı ek stres deneyinin ilk koşusu gerçek zaman aralıklarından **13 SFX** ölçtü; eski başlangıç-anı sayacı10 gösteriyordu. Bu yeni prototip hatası saklandı (`audio-stress-first.json/log`). Sınır bütün çakışma aralığına taşındı. Son gerçek render: **10 SFX, 8 müzik**, tepe0.523182, RMS0.030840, kırpılma0. Ses motoruna yalnız ölçüm ve yedi mevcut bankanın aynı anda çağrılması enjekte edildi; sentez/bütçe algoritması testte değiştirilmedi.

Son canlı çalışma 180.49s sürdü. Dört sahne, efektler, gerçek ayar/mute tıklamaları, askıya alma/devam ve dispose doğrulandı. Tek müzik zamanlayıcısı; ölçüm örneklerinde en çok121 geçici düğüm ve22 planlı/aktif grup görüldü. Grup sayısı aktif seslilikle aynı değildir; gelecekteki notalar da bu sayıda bulunur. Geçici düğümler kapatmada0; oluşturulan/serbest bırakılan2581/2581.

Sabit kanal grafiğinin6 ortak düğümü geçici sayaç dışında tutulur ve bağlam kapanınca serbest bırakılır. Bu sayaçlar tarayıcının tüm iç ses düğümlerinin/RAM'inin ölçümü değildir. Offline grafik önceden kurulur; onun düğüm yüksekliği gerçek zamanlı sızıntı diye yorumlanmaz.

Autoplay: etkileşim öncesi bağlam uncreated; gerçek menü tıklaması sonrasında running. Visibility deneyi gerçek kurulu olayı, kontrollü document.hidden ile tetikler; OS'nin gerçek arka planına geçiş testi değildir. Ana sessizleşme ve kanal geçişleri kısa gain rampalarıyla yapılır. Hiçbir yeni timer ikinci kez birikmedi. Oyun yüklemesi sesin başlamasına bağlanmadı.

Ham kanıt: `audio-prototype.json`, `audio-long.json`, `audio-stress-final.json`; ilk koşular ayrıca saklanır. Gerçek dinleme yapılmadı. Müziğin estetik/natürel niteliği ve fiziksel Android performansı açık kabul maddeleridir.
