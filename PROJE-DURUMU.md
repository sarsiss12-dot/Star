# STARS — Güncel proje durumu

Son güncelleme: 2026-10-28. Depo `sarsiss12-dot/Star`. Devir alınan HEAD: `73c0f2e8d58024c0350e108f68e1dcf708ce8a51` (main).

## Oynanabilir sürüm

| | Devir öncesi (main) | Bu dal (aday hotfix) |
|---|---|---|
| Faz | 96H.6.1 | 96H.7.1 |
| Build / PWA | `96h61` / `stars-v96h61` | `96h71` / `stars-v96h71` |
| Save | v8 | v8 (şema değişmedi) |
| Oyun ZIP | `releases/stars-faz96h61.zip` | `releases/stars-faz96h71.zip` |
| Değişen runtime | — | `ai.js` (1 satır), `main.js` (`BUILD_ID`), `sw.js` (`CACHE`) |

96H.6.2, 96H.6.3 ve 96H.7 yalnız araştırmadır; oyun yayımlamadılar. 96H.7.1, bir kayıt yükleme hatasını düzelten dar hotfix'tir; AI karar davranışı, ekonomi, askerî strateji ve galaksi sınırları (100 sistem / 11 AI) değişmedi.

## 96H.7.1 düzeltmesi: kapanmış ortak sefer Save8 yüklemesi

**Belirti:** Oyun kendi kaydını `Geçersiz ortak sefer kaydı` hatasıyla yükleyemiyor (96H.6.3'te 200/20 galakside ay 120'de görüldü).

**Gerçek neden (kodla doğrulandı):**

1. `jointValid` (ai.js), siyasi bağı değişen ortak üyeleri `p.members` listesinden çıkarır; sponsor hiç çıkarılmaz.
2. Yalnız sponsor kalırsa `Ortak savaş katılımcısı kalmadı` gerekçesiyle `jointClose` planı `cancelled` yapar; plan son 24 kapanmış kayıt içinde Save'e yazılır (`members.length === 1`).
3. `restoreJoint`, kapanmış geçmiş kayıtlar dahil bütün planlarda `members.length >= 2` istiyordu → istisna → yükleme geri alınır.

**Doğal yeniden üretim:** ortak sefer sürerken federasyon dağılır, fakat üyeler birbirinin müttefiki kalır. Bağ türü `fed` → `ally` değiştiği için iki üye de çıkarılır; plan tek üyeli kapanır ve oyunun kendi kaydı yüklenemez. Bu durum küçük galakside de oluşur; büyük galaksiye özgü değildir.

**Düzeltme:** `restoreJoint` içinde üye alt sınırı `jointActive(p) ? 2 : 1`. Aktif planlar için 2 üye şartı korunur; kapanmış geçmiş için sponsor şartı (`members.includes(sponsor)`), tekrarsızlık, filo sahipliği ve diğer bütün kontroller aynen kalır. `research/96h63/SAVE8-GUARD-PROPOSED.patch` ile birebir aynı satırdır. RNG tüketimi, Save şeması ve savaş/ittifak/federasyon sonuçları değişmez.

**Testler:** `tests/faz96h71_closed_joint_save_test.js` (eski kaynakta hatanın yeniden üretimi, yeni kaynakta yükleme, idempotent ikinci yükleme, yükleme sonrası simülasyon eşitliği, aktif tek üyeli ve bozuk kapanmış kayıtların reddi), `tests/browser-96h71.cjs` (gerçek Chromium). Koruma adaptörü: `tests/helpers/96h63-preservation.js`.

| Kontrol (Node v22.22.0, Linux) | Sonuç |
|---|---|
| Tam regresyon, değişiklik öncesi | 135 paket, 6065 PASS / 3 FAIL |
| Tam regresyon, değişiklik sonrası | 136 paket, 6075 PASS / 3 FAIL; mevcut 135 paketin sayıları birebir aynı |
| Yeni paket `faz96h71_closed_joint_save_test.js` | 10 PASS / 0 FAIL |
| Chromium `browser-96h71.cjs` | 19 PASS / 0 FAIL, 0 sayfa hatası; yeni 2 senaryo 96H.6.1 dosyalarında FAIL (negatif kontrol) |
| ZIP CRC / SHA / manifest (`tools/package-release.py`, `tools/verify-release.py`) | PASS |
| 120/240 ay kampanyaları | NOT RUN (AI karar davranışı değişmedi) |
| Fiziksel Android | NOT RUN |

**Bilinen, önceden var olan FAIL:** `faz95d_identity_test.js` içindeki 3 "historical seeded geography preserved" vakası. Üretilen sistem koordinatları 95C.1 fixture'larından son ondalık basamakta ayrışıyor (bu ortamın Node/V8 kayan nokta sonucu). Değişiklik öncesinde de aynı biçimde başarısız; `ai.js` ile ilgisi yok. Ayrı bir iş olarak, fixture'ın hangi Node sürümüyle üretildiği doğrulanmalı.

**Test yan etkisi:** bazı paketler `tests/navy-95a-after-*.json`, `tests/audit-95d/…`, `tests/audit96e1/…`, `tests/audit96g2/` dosyalarını yeniden yazar; commit öncesi `git checkout`/silme ile geri alın.

## Açık konular (sıralı)

1. Sefer bekleme kilidi + sevk bakımı/terhis zinciri (96H.7 §11–12). Bekleme yamasını tek başına yayımlamayın.
2. Dokuz stratejik hedefin başarı ölçümü (contain/security/recovery dolaylı ölçüyor).
3. Ekonomide kuyruk zamanı ve takip eden üreticinin finansmanı; seed11/404 geç dönem yeni devletleri.
4. Büyük galaksi (120+ sistem, 13+ AI) mobil performansı — reddedildi, sınırlar 100/11.
5. Fiziksel Android testi hiçbir fazda çalıştırılmadı.

Reddedilmiş adayların tam listesi: `AI-RED-KARARLARI.md`.
