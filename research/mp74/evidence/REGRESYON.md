# MP.7.4 — regresyon ve kanıt kaydı

Ortam: bulut konteyner, Node v22, Chromium `/opt/pw-browsers/chromium` (Playwright), Docker 29.

Koşulmayanlar (**NOT RUN**): fiziksel Android, gerçek internet, canlı Render.

## Runtime ve yayın

- Değişen runtime dosyaları: `ui.js` (tek blok, `/* END MP.7.4 NOTICES */`), `index.html` (CSS bloğu), `main.js` (BUILD_ID `96h10p3`), `sw.js` (`stars-v96h10p3`).
- Simülasyon ve Save8 şeması değişmedi.
- ZIP: `releases/stars-faz96h10p3.zip`.
  - 771 121 bayt, SHA-256 `1cb0ea94f4e6e891454e1d09f4908e891e2ab2a633ae152a86cc4b02d73aad77`, CRC32 `3769aff4`, 20 girdi.
  - İki paketlemede aynı bayt (deterministik).
  - Çıkarılıp `verify-release.py --root` → "DOĞRULANDI: 19 dosya; oyun build 96h10p3".

## Node

Tam `node tests/run-all.js` (4 işçi, son üretim koduyla): **170 paket, 6355 GEÇEN / 3 KALAN**. 3 KALAN yalnız bilinen `faz95d_identity` (Node v22 kayan nokta).
- Bu koşudan sonra çalışma zamanı kodu değişmedi.
- Değişen dosyalar:
  - misafir istemcisinin hayalet dokunuş kuralı (`join.js`, yalnız tarayıcıda);
  - tarayıcı testleri.

Hedefli MP.7.4 paketleri:

| Paket | Sonuç |
|---|---|
| `mp74_lobby_test` | 5 / 0 |
| `mp74_notice_test` | 6 / 0 |
| `mp5_relay_security_test` | 13 / 0 |
| `mp1_relay_test` | 14 / 0 |
| `mp11_online_test` | 9 / 0 |

`index.html` koruması: `tests/helpers/ui-preservation.js` MP.7.4 bloğunu tam metin hash'iyle çıkarır; 93A / 93C / 93D referans hash'leri aynen geçer.

Tam koşunun yeniden yazdığı dosyalar geri alındı; `tests/audit96g2` depo dışına taşındı.

## Chromium (son aday)

Hepsi üretim relay'i ya da testin kendi relay'iyle, yatay mobil görünümler.

| Test | Sonuç | Not |
|---|---|---|
| browser-mp74 (yeni) | **7 / 0** | 5 karakterli kod; 600 ms gecikmeli ağda üçlü KATIL → 1 koltuk; küçük düğme; kaydırma; hızlı karar (çift dokunma = 1 komut); kapasite 3 + dördüncü telefon "Oda dolu." |
| browser-mp73 | 8 / 0 | Test güncellendi (sürüm 7.3 / 7.4, salt okuma sorguları sayılmaz) |
| browser-mp72 | 9 / 0 | |
| browser-mp71 | 12 / 0 | Misafir kararı artık host yanıtını bekliyor; MP.7.1 akışları aynen geçti |
| browser-mp7 | 9 / 0 | |
| browser-96h10 (tek oyunculu) | 27 / 0 | |
| browser-mp0 | 20 / 0 | |
| browser-mp1 | 22 / 0 | Test güncellendi (5 karakter, tiresiz kod) |
| browser-mp11 | 10 / 0 | |
| browser-mp2 | 14 / 0 | |
| browser-mp3 | 12 / 0 | |
| browser-mp31 | 11 / 0 | |
| browser-mp4 | 13 / 0 | Kayıt / yükleme |
| browser-mp6 | 11 / 0 | |
| browser-mp61 | 13 / 0 | Ortak hız, MP çubuğu yerleşimi |
| browser-mp62 | 10 / 0 | |
| browser-mp63 | 15 / 0 | Akıllı duraklatma |
| browser-mp64 | 10 / 0 | |
| browser-mp5 | 10 / 0 | Docker relay; misafir URL denetimi sekme etiketiyle güncellendi |
| mp5_docker | 6 / 0 | İmaj güncel ağaçtan |

**Docker imajı içeriği.** `stars-relay:mp5-test` içindeki dosyaların SHA-256 önekleri çalışma ağacıyla aynı: `ui.js`, `index.html`, `main.js`, `sw.js`, `relay.js`, `join.js`, `mp1-host.js`, `guest-stars.js`, `mp-core.js`.

### Koşu sırasında yakalanan ve düzeltilenler

- **Çift dokunmanın ikinci dokunuşu** lobi açılınca aynı noktadaki "devletini tasarla" düğmesine düştü.
  - İlk çözüm 700 ms yutmaydı; eski testlerdeki meşru hızlı dokunuşları da yuttu.
  - Kural daraltıldı: yalnız başlangıcı (pointerdown) lobi çizilmeden önce olan dokunuş yutulur.
- **Misafirde bekleyen karar** kayıt nesnesine bağlıydı; ayna yenilenince kayıt yeniden kurulup çift dokunma iki `respond` gönderdi. Artık komut hedefiyle tutuluyor (`S.decWait`).
- **Manifest `ui.js` özeti** son düzeltmeden önce alınmıştı; relay "tam runtime baytları" testi yakaladı, yenilendi.
- **browser-mp74 A5:** ölçüm sırasında ay geliri eklendi; ölçüm oyun durdurulmuşken yapılıyor.
