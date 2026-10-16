# Devam noktası — 95C

Kanonik kaynak: `stars-faz95b.zip`, SHA-256 `b5de2154d3b4cec88850959a63dbfab41a41c1b4c7a782fcfc2f9ea4cfa835c7`. CRC ve 1765 dosyalı manifest doğrulandı. GitHub main verilen `1fc2e86382a6bba965acbaf6d323c7ef79f5747e` yayın commit'iyle aynıydı. 15 Ekim geliştirme notu değişmeden korunur.

95C'nin üretim değişiklikleri `main.js`, `ai.js`, `combat.js`, `diplomacy.js`, `ui.js`, `sw.js` içindedir. Ana HTML, harita, ekonomi, ses ve manifest kaynakları korunur. Save v8, PWA `stars-v95c`, build `95c`.

- `G.jointOps` ve mevcut savaş defterine bağlı ortak görev/geçerlilik/rezervasyon.
- 95A bilinen rota aramasında isteğe bağlı ara düğüm filtresi; mevcut hareket motoruyla gerçek toplanma, bekleme ve ETA farkına göre çıkış.
- Aylık otomatik plan, beş günlük sınırlı değerlendirme; kritik savunma, ikmal, geri çekilme ve bekleme sınırları.
- Oyuncunun üç destek talebi, kabul/ret ve iptal; mevcut üç panelde kompakt bölüm.
- Eski yalnız-iki-devlet muharebe seçiminin aynı seferdeki gerçek aktörler için mevcut çözümleyiciye bağlanması; tek toplam atış bütçesi ve gerçek katkı.
- Savunmasız boş düşman yörüngesinde gerçek varıştan mevcut fetih motoruna geçiş.
- Paylaşımda eşit puanlı adaylar için bilinen erişim tercihi; oybirliği ve açık atamalar korunur.

Son sayılar `FAZ95C-RAPOR.txt`, `TEST-SONUCLARI-95C.md`, `tests/summary-95c.json` içindedir. İlk başarısız denemeler saklanmıştır; aynı testleri neden olmadan tekrarlamayın. Karşılaştırma: üç doğal 120 aylık kampanya + üç kontrollü savaş başlangıcı; erken biten koşular süreleriyle açık raporlanır. `tests/campaign-95c` ham veriyi, `tests/audit-95c` bütünlük ve performans kanıtını içerir.

Dikkat: gerçek Android/DOM kabulü yok; Chromium bulunamadı. Koalisyon raporu hâlâ çift bazlıdır. ETA yaklaşık; rota/hız değişince tam eşzamanlılık garantisi yok. Büyük tek başkent filosunun muhafazakâr tutulması yardım vermemeye neden olabilir. Uzun vadeli dengeyi üç tohum kanıtlamaz; ekonomik zorluk ve kayıpları karşılaştırma belgesinden okuyun.

GitHub'a yayın yapılmadı. 95D'ye başlanmadı. Sonraki faz ancak ayrı kullanıcı talimatıyla; önceki yol haritası ve talepler aynen korunur.
