# 90RC.3 — kayıt yükleme işlem sınırı

Kök: G ve eriştiği değiştirilebilir oyun nesneleri; ayrı kök RND_STATE.
Özgün referans, prototype, alan descriptor'ı, alan varlığı, dizi sırası,
paylaşılan bağlantı/döngü, Map/Set, Date ve ArrayBuffer günlüğe alınır.
G.nebula native çizim yüzeyi opaque'dır: eski referansı korunur, eski
pikseller değiştirilmez. Yeni yüzey uygulama başarısızsa terk edilir.

Sıra: saf zarf kontrolü → snapshot → uygulama/göç → türetilmiş durum →
economyTick(true) → log commit → son kontrol → eski sideBuf alanını geri
kur → sunum. Yakalanan uygulama hatasında dünya/RNG geri alınır; yeniden
hesaplama, tik, sayfa yenileme veya kayıt dosyasını ezme yapılmaz.

12 hata noktası: before:apply; after:roots; after:treaties; after:world;
after:crisis; after:campaign; after:simulation; after:events; after:mods;
after:derived; after:economy; before:commit.

View seçim/kamera, canvas/context, pointer capture, UI açık bildirim/teklif,
LOOP, zamanlayıcılar ve depolama uygulama sırasında değiştirilmez. Başarıdan
sonra seçim yeni dünya nesnelerine bağlanır; jest/önbellekler temizlenir.
Bu sunum işlemlerindeki istisna tanıya yazılır, yüklenmiş dünyayı geri almaz.
Ses/UI tamponu yalnız başarıda yayımlanır. Hata tanı kaydı kasıtlı istisnadır:
reddedilmiş işlem tamamen sessiz olmak zorunda değildir.

Eşzamanlı/nested yükleme, etkin anlaşma ve başkasının sideBuf'u reddedilir.
Snapshot alınamazsa atama başlamadan false döner. Yükleme kilidi finally ile
serbest kalır. Test, production snapshot'ını beklenen sonuç olarak kullanmaz;
bağımsız nesne/deskriptor/kimlik oracle'ı ve native Canvas pikselleri kullanır.

Sınırlar: mevcut senkron üretim yükleme yolları ve tersinir oyun verisi.
Object.freeze, yeni nonconfigurable alan, tarayıcı/process çökmesi, native
GPU yan etkisi, keyfî getter/setter veya göç koduna ileride eklenecek doğrudan
DOM/localStorage yazısı için evrensel atomiklik garantisi verilmez. Böyle bir
üretim yolu eklenirse işlem kapanımı yeniden incelenmelidir.

Gerçek Chrome/Android yaşam döngüsü bu testin kapsamı değildir. Node sahte
DOM ve native Skia ayrı katmanlardır; Skia, tarayıcı veya fiziksel cihaz değildir.
