# STARS — MP.4 kayıt / yükleme akışı (telefon)

Kod: `research/mp1/client/mp1-host.js` (ekranlar), `research/mp4/client/mp4-save.js` (depo + dosya), `research/mp0/mp-core.js` (paket).
Testler: `tests/mp4_core_test.js` (Node vm, iki ayrı bağlam), `tests/browser-mp4.cjs` (ayrı Chromium süreçleri, gerçek kapanış).

## 1. Menü

Başlık → **ÇOK OYUNCULU**:

| Düğme | İş |
|---|---|
| ODA OLUŞTUR | yeni galaksi (MP.1) |
| ODAYA KATIL | misafir sayfası (MP.1) |
| **KAYITLI OYUNA DEVAM ET** | kayıt listesi + DOSYADAN AÇ |
| **KAYITLARI YÖNET** | aynı liste; DIŞA AKTAR / SİL odaklı |
| GERİ | başlık menüsü |

Tek oyunculu YENİ OYUN / OYUNA DEVAM ET / AYARLAR ve tek oyunculu kayıt yuvası değişmedi (yüklenen MP dünyasında `G.autoSave=false`).

## 2. Kaydetme (host, oyun içinde)

Host paneli (üstteki tek satır) → aç → **OYUNU KAYDET** (telefonun tarayıcı deposu) ya da **DOSYAYA AKTAR** (tek `.starsmp.json` dosyası, Android'de
"İndirilenler"). Bilgisayar gerekmez.

- Kayıt kararlı noktada alınır; yarım işlem varken `busy` ("Bir işlem sürüyor; birazdan yeniden dene").
- Kayıt oyunu durdurmaz ve Save8/RNG'ye dokunmaz.
- Elle kayıt sınırı 12: dolunca yeni kayıt yazılmaz, mevcutlar silinmez ("Önce eski bir kaydı sil").
- Otomatik kayıt: 3 oyun ayında bir, oyun başına son 3 tutulur.
- Depo kullanılamıyorsa: "Telefonun tarayıcı deposu kullanılamıyor; DOSYAYA AKTAR ile sakla."

## 3. Kayıt kartı

Her kart: kayıt adı, Yıl/Ay, galaksi boyutu, sistem sayısı, insan oyuncular ve devletleri, elle/otomatik, kayıt zamanı, boyut (KB),
**DEVAM ET**, **DIŞA AKTAR**, **SİL** (onay penceresi: "… silinsin mi? Bu işlem geri alınamaz.", Vazgeç / Sil).

## 4. Yükleme

1. Karttan **DEVAM ET** ya da **DOSYADAN AÇ** → dosya seçici.
2. Paket doğrulanır (bkz. güvenlik belgesi). Hata: kartın üstünde Türkçe gerekçe; mevcut durum değişmez.
3. Onay: "\"<ad>\" (Yıl, Ay) yeni bir odada açılsın mı?" → **Yükle ve oda aç**.
4. Motor Save8'i yükler (hata → önceki dünya geri), oyun duraklatılır, yeni oda kodu alınır.
5. **DEVAM LOBİSİ** (host):
   - kayıt adı, tarih, boyut, insanlar;
   - davet kodu + KODU KOPYALA / DAVET PAYLAŞ;
   - insan oyuncular: bağlı / bekleniyor;
   - kimliği doğrulanmayan bağlantılar (varsa) + KİMLİĞİ KURTAR (yalnız bağlı olmayan koltuk, onaylı);
   - **DEVAM ET** (bağlı olmayan oyuncu varsa onay: "Devletleri ayrılmış kalır, AI yönetmez"), ODAYI KAPAT.
6. Misafir yeni kodla katılır:
   - cihazında bu kaydın kimliği varsa: "KAYITLI OYUN — DEVAM LOBİSİ · **Eski devletin bulundu: <devlet>**", "Host'un DEVAM ET demesi bekleniyor…";
   - yoksa: "**Kimliğin doğrulanmadı** … Başka oyuncunun devleti alınamaz." (ziyaretçi; ODADAN AYRIL).
7. DEVAM ET → oyun kayıttaki hızla sürer; ziyaretçiler "Oyun başladı; yeni oyuncu alınmıyor." ile çıkar.
8. Sonradan gelen (oyun sürerken): cihazında kimlik varsa doğrudan kendi devletine döner; yoksa
   "Oyun kayıttan devam ediyor ve bu cihazda bu kayda ait oyuncu kimliği yok. Host'tan kimliğini kurtarmasını iste."

## 5. Bağlantı durumları (ayrı metinler)

| Durum | Misafirin gördüğü |
|---|---|
| Host kapandı (oda bekliyor) | "Host bağlı değil — oyun duraklatıldı" |
| Relay yeniden başladı (oda yok) | "Sunucu yeniden başlatıldı; oda kapandı." |
| Yeni oda, host henüz DEVAM ET demedi | "Host'un DEVAM ET demesi bekleniyor…" |
| Kimlik yok (lobi) | "Kimliğin doğrulanmadı" |
| Kimlik yok (oyun sürüyor) | "… bu cihazda bu kayda ait oyuncu kimliği yok …" |
| Ağ koptu | "Bağlantı koptu — yeniden bağlanılıyor…" (MP.1) |

## 6. Dosya boyutları ve süreler

Bkz. `MULTIPLAYER-MP4-SONUC.md` §21 (45 / 60 / 100 sistem; Node ve Chromium ölçümleri).
