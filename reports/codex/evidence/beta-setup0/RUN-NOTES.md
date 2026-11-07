# BETA-SETUP.0 tekrar üretim ve sınırlar

Kaynak: P0.2 `3fd07944b6764ca6e71f6e8dc8b81404d5c8cfbd`. Node24.22.1, Playwright1.62.1, Chromium155.0.8059.79. Yeni ortam/izin değişikliği/Render yok. Üretim farkı yalnız pano #41.

## Önce/sonra

- `before-tests.log`: değiştirilmemiş P0.2'de seed11/99/404 KAPALI başlangıç kontrolleri **0/3 FAIL**; her seed'de3 yuva ve3 korsan muhafızı.
- `unit-after.log`: ilk test taslağı normal AI'da `wild` alanının false yerine undefined olmasına takıldı7/1; mantıksal bayrak denetimi olarak düzeltildi.
- `unit-final.log`: isyanın anında filo kurduğu yanlış fikstür beklentisi8/1; mevcut secede gerçek çıktısı olan devlet/koloni devriyle doğrulandı. Üretim isyan sistemi değiştirilmedi.
- `era-before.log`: ayrı Korsan Çağı yolu **9/1 FAIL**. KAPALI olduğunda olay havuzundan çıkarıldı; diğer olaylar korunur. Son `reg-beta_setup0_pirates_test.cjs.log` **10/0**.
- `campaign-before-era.*` ve `campaign/` ilk aday ölçümleridir. **Son kabul campaign-final/campaign.json**; son aday0/30/120 kontrolüne Korsan Çağı da dahildir.
- `perf2-adapter-first-fail.log` **4/1**: PERF2'nin sentetik `stripReviewedP2('economy.js','x')` denetimine yeni kaynak adaptörü yanlış kapsamda uygulanıyordu. Adaptör yalnız PERF2'nin ai/main alanına sınırlandı; kaynak hash ve Save8 assertion'ları kaldırılmadı. `perf2-final.log` **5/0**.
- İlk `git fetch origin <dal>` yalnız FETCH_HEAD getirdi; origin/<dal> takip ref'i yoktu. Doğrulanmış SHA'dan yeni dal oluşturuldu. Kanonik kaynak değişmedi.

## Komutlar

```sh
# P0.2 kontrol kökünü sabit kopya olarak hazırla (symlink değil):
mkdir -p /tmp/setup0-control
git archive 3fd07944b6764ca6e71f6e8dc8b81404d5c8cfbd | tar -x -C /tmp/setup0-control
STARS_CONTROL_ROOT=/tmp/setup0-control STARS_OUTPUT=/tmp/setup0-campaign node tests/beta-setup0-campaign.cjs
node tests/beta_setup0_pirates_test.cjs
STARS_CHROMIUM_PATH=/usr/bin/chromium STARS_OUTPUT=/tmp/setup0-sp node tests/browser-beta-setup0.cjs
MP73_ONLY='^A1|^P0' SETUP0_AUDIT=1 BETA_P01_PANELS=1 BETA_P01_VOTES=1 BETA_P01_WAR=1 STARS_CHROMIUM_PATH=/usr/bin/chromium STARS_OUTPUT=/tmp/setup0-mp node tests/browser-mp73.cjs
```

Kampanya gerçek0.5 günlük dailyTick/struct/colonyBuild/autoExplore/monthTick yolu;3 seed × kontrol AÇIK/adayı AÇIK/adayı KAPALI/KAPALI tekrar ×120 ay. Her koşu121 örnek; oyun erken bitse FAIL, sıfır örnek PASS değil. Her ay doğrudan Save8 SHA-256/RNG karşılaştırılır; normalizasyon yok. WildTurn sonrası yeni gerçek korsan doğumu ve Commerce.attack sonucu korsan baskını gözlenir; monster işareti tamamlandıktan sonra sayılır.

SP tarayıcıda korsan düğmesi gerçek tap; geçerli varsayılan kurulum ve seed11 fikstürüyle GALAKSİYİ YARAT gerçek tap. Save8 alınır, Chromium süreci kapatılır, yenisinde gerçek deserialize ile yüklenir; dosya yükleme diyalogu ayrıca sınanmaz. MP testinde gerçek host galaksi ekranında KAPALI tap, host CFG/G.cfg ve misafir G.cfg kontrol edilir; misafir galaksi ayarı host'a aittir. Kararlar gerçek dokunmadır.

Canavar doğumu ve yeni olay seçimi gibi nadir dallar unit testte kontrollü RNG ile tetiklenir; üretim RNG değiştirilmez. Doğal120 aylık KAPALI kampanyada da canavar oluşumu gözlenir. İsyan/kriz testinde gerçek motor işlevi kontrollü fikstürde çağrılır; bu doğal kriz zamanı kampanyası değildir.

`G.raids` genel savaş kargo baskınlarını da tutar. Eski bilinmeyen kaynaklı rota bekleme/haber geçmişi topluca silinmez. Yeni korsan üretimi/baskını engellenir; normal savaşlar ve canavar/kalıntı tehditleri kapatılmaz. Kullanıcının disk/IndexedDB kayıtları silinmez.

Son runtime ZIP manifest/CRC/SHA ve tekrarlı üretim `RELEASE-VERIFIED.json`;8 MP endpoint hash'i `version-contract.json`. MP relay/client dosyaları oyun ZIP'inden ayrı mevcut Docker dağıtım yolundadır; deploy/container build yapılmadı.
