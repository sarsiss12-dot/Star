# Savaş ilanı önizlemesi — 95D

Akış: Diplomasi → hedef devlet → savaş → mevcut savaş hedefini seç → **SAVAŞ İLANI ÖNİZLEMESİ** → **ONAYLA · SAVAŞ İLAN ET**. Hedef seçimi artık doğrudan Etki kesip savaş başlatmaz. Vazgeç düğmesi ücretsizdir. Önizleme oyunu mevcut modal yoluyla duraklatır; oyun günü ilerlemez, Etki veya oyun RNG’si tüketilmez.

`warDeclarationAccess` gerçek declareWar girişinde ve önizlemede ortak saf kapıdır: yaşayan ayrı devlet, mevcut savaş, vasallık, federasyon savaş izni, Gölge Konseyi/Evrensel Barış ve gerçek ilan yetkisi. Hedefin Etki bedeli mevcut WAR_GOALS/hasPerk hesabıdır. Saldırmazlık/ittifak ihanet riski ve mevcut councilBlocksWar sonucu açıklanır. Oyuncunun bilinçli Konsey yasağı ihlali seçeneği kaldırılmaz; mevcut cezalar yalnız gerçek ilanda uygulanır.

- **Kesin katılacaklar:** Bilinen yürürlükteki savunma yükümlülüğü, kabul edilmiş saldırı taahhüdü veya bilinen senyör/bekçi yükümlülüğü; güncel giriş kapısı uygunsa ve Konsey nedeniyle rastlantısal ret yoksa.
- **Koşullu katılabilecekler:** Bilimsel/Ticaret federasyonunda savaş oyu, taahhüt vermemiş ortak veya sıradan ittifakta gönüllü destek. İttifak doğrudan otomatik savaş sayılmaz. Konsey engelli otomatik destek de kesin gösterilmez.
- **Bilinmeyenler:** Sabit bir istihbarat sınırı açıklaması. Gizli devlet adı, kimliği, bağlantısı veya sayısı verilmez. Temas kurulmamış bir hedefe doğrudan API isteği de kimlik döndürmez.

Tahmin fedDuty/fedSupportGate/fedWarAllowed/fedDefensiveWar, dutyConsent ve mevcut vasallık kurallarından türetilir. Gerçek motor fedDefend/fedAttack/overlordDefend ile çalışmaya devam eder. Bilinen otomatik savunma zinciri sınırlı kuyrukla izlenir. Bu yeni bir savaş simülatörü, yardım garantisi veya filo kuvvet tahmini değildir; gerçek harekât 95C koordinasyon motorundadır. İstihbarat, daha önce görülmemiş özel kriz/isyancı senaryoları ve gelecekte alınacak siyasi kararların tümünü kesinleştirmez.

Son onay güncel dünya/oyuncu nesnesi ve tek kullanımlık modal token’ıyla bağlıdır. Güncel önizleme imzası değişirse yeni özet ve yeniden onay gerekir; para veya savaş başlamaz. Dünya değişmediyse gerçek giriş kapısı tekrar doğrulanır, savaş ilanı başarıyla kurulur ve mevcut hedef bedeli yalnız bir kez uygulanır. Eski callback; iptal, başka modal veya save/load sonrasında etkisizdir. Nihai ilan yine mevcut savaş/katkı/bildirim motorunu kullanır.
