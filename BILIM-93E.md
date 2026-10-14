# 93E — Bilimsel uzmanlaşma

40 temel teknoloji değişmedi; üç ağaca 12 özel teknoloji eklendi. Geçmiş dördüncü bilim dalı değildir. Civic koşullu yeni teknoloji yok.

| Teknoloji | Dal | Koşullar | Temel araştırma maliyeti | Gerçek kazanım |
|---|---|---|---:|---|
| Taarruz Eskortu | Mühendislik | MİLİTARİST (en az 1) | 2600 | Gemi: Taarruz Eskortu |
| Sivil Savunma Ağı | Fizik | PASİFİST (en az 1) | 2300 | Sistem savunması +80 |
| Deney Otomasyonu | Mühendislik | MATERYALİST (en az 1) | 2500 | Yapı: Otomasyon Laboratuvarı |
| Birlik Külliyesi | Toplum | RUHANİ (en az 1) | 2400 | Yapı: Birlik Külliyesi |
| Derin Gözlem Ağı | Fizik | Teknokrasi ve MATERYALİST (en az 1) | 2800 | Yapı: Derin Gözlemevi |
| Sınır İkmal Protokolü | Toplum | Yayılmacı | 2400 | Koloni gemisi maliyeti −%10; Filo kapasitesi +8 |
| Sentetik Üretim Hücresi | Mühendislik | Makine Ağı | 2600 | Yapı: Sentetik Üretim Hücresi |
| Ortak Biliş Düğümü | Toplum | Kovan Zihni | 2400 | Yapı: Sinaps Merkezi |
| Derin Kabuk Sondajı | Mühendislik | Kayaç (Litoit) | 2400 | Yapı: Derin Sondaj |
| Kapalı Biyom Döngüsü | Toplum | Okyanus Canlısı veya Bitkisel | 2300 | Yapı: Biyom Bahçesi |
| Hafif Seyir İskeleti | Mühendislik | Kuş Benzeri | 2500 | Filo hızı +%12; Bakım gideri −%4 |
| Uyarlanabilir Kurumlar | Toplum | İnsansı / Memeli | 2400 | Diplomasi +%12; İstikrar +4 |

Araştırma maliyetlerine mevcut çapraz teknoloji ve dal serisi indirimleri uygulanır. Farklı koşullar **ve**, aynı koşuldaki tür seçenekleri **veya** ilişkisidir. Derin Gözlem Ağı için hem Teknokrasi doktrini hem en az +1 Materyalist etik gerekir.

## Gerçek üretim içeriği

| İçerik | Temel maliyet | Gerçek değer/etki |
|---|---|---|
| Taarruz Eskortu | 64 alaşım | Gövde 120, kalkan 30, hasar 32, hız 3.3, kapasite 2; aylık 13.8 enerji + 1.5 alaşım bakım. Yakın menzil. Devlet/lider/üretim çarpanları mevcut kurallarla uygulanır. |
| Otomasyon Laboratuvarı | 280 min, 50 ala | Temel +10 bilim; 5 enerji ve 1 tüketim malı bakım. Nüfus/işgücü ve üretim çarpanları uygulanır. Koloni başına en fazla 1. |
| Birlik Külliyesi | 270 min, 35 ala | Temel +1,6 etki ve +3 bilim; 3 enerji bakım. Üretim çarpanları uygulanır. Koloni başına en fazla 1. |
| Derin Gözlemevi | 360 min, 90 ala | İnşa gemisiyle kurulur; +10 bilim ve −3 enerji/ay. Sistem başına bir adet. Temel süre 12 ay; inşa çarpanı maliyet/süreyi etkiler. |
| Sentetik Üretim Hücresi | 320 min, 60 ala | Temel +7 alaşım; 15 mineral ve 5 enerji bakım. İşgücü/üretim çarpanları uygulanır. Koloni başına en fazla 1. |
| Sinaps Merkezi | 270 min, 40 ala | Temel +8 bilim; 3 yiyecek ve 3 enerji bakım. İşgücü/üretim çarpanları uygulanır. Koloni başına en fazla 1. |
| Derin Sondaj | 280 min, 50 ala | Temel +12 mineral; 4 enerji bakım. İşgücü/üretim çarpanları uygulanır. Koloni başına en fazla 1. |
| Biyom Bahçesi | 260 min, 35 ala | Temel +10 yiyecek ve +2 bilim; 3 enerji bakım. İşgücü/üretim çarpanları uygulanır. Koloni başına en fazla 1. |

## Erişim ve kayıt davranışı

Koşullar her seçim/araştırma/edinim sırasında değerlendirilir. Doktrin için
kalıcı `mizac`, sonra `persLock`, eski kayıtta ırkın doktrini kullanılır;
geçici AI tavrı erişim hakkını değiştirmez. Tür için seçili PHYSIO kullanılır;
eski makine/sürü kayıtlarında ilgili ırk kökeni desteklenir.

İncelenen doktrinler: Militarist, Tüccar, Pasifist, Yayılmacı, Fanatik Arındırıcılar,
Teknokrasi, Kriminal Sendika, Kutsal Meclis. Etikler: Militarist/Pasifist,
Otoriter/Egaliter, Materyalist/Ruhani, Dürüst/Sahtekâr. Türler: İnsansı/Memeli,
Kayaç, Okyanus Canlısı, Kuş Benzeri, Kovan Zihni, Makine Ağı, Bitkisel.
İlk 12 içerik bunların tümüne ayrı bir teknoloji vaat etmez; bütün yedi fizyoloji
kapsanır, Okyanus ve Bitkisel aynı biyom teknolojisini paylaşır. Doktrin özel
koşulları Teknokrasi ve Yayılmacı ile başlar. Diğer doktrinler etik/tür uygunluğuna
göre özel araştırmalara erişebilir; sonraki çeşitlendirme 93E.1 adayıdır.

Tamamlanan teknoloji, doktrin/etik değişince silinmez; açtığı imkânlar kalır.
Koşulunu kaybeden tamamlanmamış hedef kuyrukta gerekçesiyle bekler; o hedefin
rotası yeni bilim harcamaz. Aktif puan `research.bank` içine alınır, uygunluk
geri gelince aynı teknolojiye bir kez döner. Kuyruk kaldırılabilir/sıralanabilir.
Takas, casusluk, olay ve kalıntı edinimi erişim kapısını aşmaz; özel araştırma
rakibin gizli teknolojisini öğrenmeden hiçbir yeni karşı teknoloji davranışı eklemez.

## Üç mod

- **Manuel:** yalnız oyuncu hedefleri ve zorunlu ön koşulları. Boş dallar bekler;
  uygun aktif dal yoksa kullanılmamış araştırma kaynağı birikir.
- **Yarı otomatik:** oyuncunun planı öncelikli; boş dallarda uygarlığa uygun seçim.
- **Otomatik:** seçim otomasyonda; kaydedilmiş oyuncu hedefleri silinmez, uygulanmaz.

Üç dal paraleldir. Mod değişimi kuyruk/geçmiş/puanları silmez. Eski v8 kayıtları
önceki davranışa karşılık gelen yarı otomatik modla açılır. AI daima otomatik
araştırır; uygun özel teknolojiye 1,65 ağırlık, maliyet ve mevcut askerî/ekonomik
öncelikler birlikte uygulanır. Ucuz temel araştırmalar kullanılabilir kalır.

40 temel teknoloji, zirve teknolojiler ve mevcut Kadim Araştırma şartı bilim
zaferini belirler. Özel teknolojiler zafer için zorunlu değildir. Temel ağaç
bittikten sonra boş bilim dallarındaki artan puanın Kadim Araştırma'ya aktarımı
korunur; manuel mod da bu mevcut geç oyun dönüşümünü kaldırmaz.

## Üretim ve AI

Taarruz Eskortu mevcut ücretli tersane, kapasite, bakım, muharebe ve filo şablonu
sistemini kullanır. AI sınıf dengesine katılır; 93D.1 bütçe, rezerv, enerji dayanması,
çoklu tersane ve 93B/93C teslim güvenliği gevşetilmez. Muhripten daha hızlı fakat
hafif korumalı bir yakın menzil alternatifidir; ücretsiz filo yükseltmesi değildir.

Altı bina mevcut slot/işgücü/inşa kuyruğu ve gerçek maliyet üzerinden çalışır.
Bilim/yiyecek/tüketim malı girdileri mevcut ekonomi hesabında gerçekten düşülür.
AI enerji/mineral krizini önce çözer, karşılayabildiği özel binayı sıraya alır.
Derin Gözlemevi yerel, boşta bir inşa gemisi gerektirir; teknoloji, sahiplik,
maliyet ve tek sipariş kontrolünden geçer. AI mevcut inşa hedefleme yolunda
enerji geliri uygunsa seçer. Uzaktan inşa arayüzü eklenmedi.

Yeni özel teknoloji edinildiğinde açılan imkânlar bir kez bildirilir. Geçmişte
gerçek tarih, edinim kaynağı ve ◆/⚖/◈ koşulları gösterilir; eski tarihler uydurulmaz.

## Doğrulama sınırı

Hedefli VM/DOM/native Canvas testleri fiziksel Android FPS ölçümü değildir.
Yeni kütüphane, ağ bağımlılığı veya harici asset eklenmedi. Üç kampanya ve test
ayrıntıları FAZ93E-RAPOR.txt ve tests/logs-93e içinde. Uzun geç oyun ve bütün
fizyoloji/doktrin kombinasyonlarının denge incelemesi 93E.1 takip adayıdır.
