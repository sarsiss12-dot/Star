# Mevcut Web Audio motorunun geliştirilmesi

AUDIO.start/resume/suspend/play/forLog/toggle/setMuted ve mevcut yedi SFX bankası korundu. Ses dosyası, SoundFont, MIDI, CDN, yayın veya müzik servisi kullanılmaz. PeriodicWave harmonikleri, ayrı filtreli yay/nefes gürültüsü zarfları, alçak geçiren filtre, yumuşak transient, küçük perde/zaman farkları, stereo ve sınırlı prosedürel yankı birlikte kullanılır. Bu, gerçek çalgının fiziksel kaydının birebir kopyası değildir.

C Dorian tonalite; dört akor ilerleyişi; sekiz ölçülük cümleler ve dört motif ailesi bulunur. Melodi akor seslerine bağlıdır; bas aynı akorun kökünü izler. Cümle sonu boşluk bırakır. Bölümler küçük varyasyonlarla gelişir; tek kısa sabit döngü veya bütünüyle rastgele nota dizisi değildir. Müzik için bağımsız PRNG kullanılır; oyun RND_STATE tüketilmez.

| Atmosfer | Güvenli durum ve duyum tasarımı |
|---|---|
| Normal | Yönetim; sakin üçlü armoni, yumuşak bas/nefesli motif |
| Keşif | Oyuncunun hareket eden/araştıran bilim gemisi; daha açık oktav |
| Savaş | Oyuncunun birden çok savaşı, önemli silahlı donanmalı savaşı veya kendi aktif çatışması; bas hareketi ve seyrek vurmalı |
| Kriz | Gerçek aktif büyük kriz; daha alçak yaylı armoni, seyrek melodi ve ağır vurmalı |

Tek küçük savaş tek başına dramatik atmosferi zorlamaz. Sahne kararı ölçü sınırlarında ve en az iki ölçü aralığında alınır. Yumuşak atak/release ve mevcut kuyruklar sert kesimi azaltır; ayrı ikinci bir müzik motoru/crossfade zamanlayıcısı yoktur. UI açılması müziği baştan başlatmaz. Arka planda mevcut visibilitychange akışı motoru askıya alır.

Ana menü seçenekleri ve mevcut Kayıt/Ayarlar ekranında Ana/Müzik/Efekt düzeyi ve bağımsız Müzik/Efekt açık anahtarları bulunur. Ana sessize alma da korunur. Varsayılan düzeyler0,65/0,60/0,70; tercihler cihazın oyun tercih deposundadır (`yh_audio_mix`), ana mute eski `yh_audio` ile uyumludur. Geç gelen okuma yeni kararı ezmesin diye mix revizyonu kullanılır. Dinleyiciler tek seferlik delegation'dır.

Tek müzik zamanlayıcısı, 250ms bakış aralığı, yaklaşık52BPM ve önceden sınırlı planlama vardır. En çok12 müzik ve10 SFX ses grubu, bütün planlanmış çakışma aralıkları üzerinden korunur. Ortak dalga tabloları3 ve gürültü/yankı tamponları yeniden kullanılır. Her sesin onended temizliği bağlantıları keser; dispose bağlamı kapatır. Önceki SFX kalınlaştırma yolundaki filtreyi dolaşan çift doğrudan bağlantı kaldırıldı.

İşitsel kabul açıktır: gerçek dinleme yapılmadı. Teknik olarak armonik/ritmik yapı ve güvenli ses düzeyi doğrulanmıştır; güzel/doğal bulunduğu veya fiziksel Android maliyeti kanıtlanmış değildir.
