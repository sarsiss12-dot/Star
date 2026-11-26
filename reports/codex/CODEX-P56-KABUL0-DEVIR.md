# STARS · p56 Codex devri

Sonraki Codex işinin oynanabilir başlangıcı `96h10p57 / MP.8.9b56`, `codex/stars-p56-kabul0` dalındaki doğrulanmış kaynak `78668a4dff9373c1b81d0fd3073b64bb9e55a663`. p56 siyaseti ve keşfi için kanonik atası `claude/stars-fed-ai-siyaset0` @ `c187a12dee1c799f55453d4a21510efece934900`. p55 geri dönüşü `claude/stars-savas-destek-ai0` @ `914c00310200bbda97abdcecab56934fccbd7cf3`. [Kabul sonucu](CODEX-P56-KABUL0-SONUC.md) · [Taslak PR #82](https://github.com/sarsiss12-dot/Star/pull/82)

## Kontrol sözleşmesi

- Federasyon reformu, katılım ve ayrılış için tek başına büyüklük veya savaş sayısı hedefi yok. Mevcut `aiFedWilling` katılım kapısı, gerçek Etki, oy eşiği, Save8 ve insan onayı korunur.
- I3, uzun oturumdan sonra gerçek oda başlangıcından alınan Save8’de keşfedilmemiş tek yönlü bir sensör örneği kurar. Gerçek komut, eski/yeni bilinen sistem, ters yön, ilgisiz gizli sistem ve aynı gün uygulanan ayna revizyonu ayrı doğrulanır.
- F5 önce iki misafirde üyelik ve eski başkanı doğrular. Sonra başkan değişimini, gönderilen ve uygulanan revizyonu, kartın ilk görünümünü ve yeniden katılım sonrasındaki tekilliği doğrular.
- Relay hazır satırı kapanış işleyicileri kurulduktan sonra yayımlanır. Hazır satırına tepki olarak gerçek `SIGTERM` gönder. İşleyiciyi ve temiz çıkışı ayrıca doğrula. Bu yerel süreç testi Render dağıtımı değildir.
- İlk reform ayının işlem kopyası ayrı profil. Sürekli durumda aynı yüklü kayıt, dönüşümlü ABBA ve A/A. Siyasi işlemin geri alma kapsamını ancak bütün yazma kümesi ve hata enjeksiyonu kanıtı varsa değiştirmeye aday ol.
- Sonraki işte kaynak SHA, tetik öncesi Save8/RNG, p55 geri dönüşü ve 279 tarihsel Node başarısızlığı listesi referans alınır. Fiziksel cihaz ve uzak ağ ayrı saha testi.

## Sonraki işler

**CODEX-C2 · Diplomatik keşif.** Keşif gemisi siparişi, ulaşılabilir bilinmeyen rota ve ilk gerçek temasın ayrı kayıtları. Yuva veya düşman geçidini yalnız mevcut sensör bilgisiyle değerlendir. Kuruculardan ayrı doğan devletleri temas oranına karıştırma. Milestones, temas ve ekonomi fırsatına ek olarak hazır savaş gücü, korsan kayıpları ve keşif için ayrılan gemi sayısını ölç.

**CODEX-C3 · Gerçek ortak sefer.** Mevcut `jointSelect`, toplanma, açık rota, ikmal ve savaş katılımı. Rota bulunamadığı örneklerde bilgi, askerî geçiş, filo erişimi ve hazır olma retlerini ayır. Federal ve vasal filoların gerçekten hareket etmesini, cephedeki hasar/kayıp katkısını ve eve dönüşü aynı plan kimliğiyle izle.

**CODEX-C4 · Uzun galaksi dengesi.** 500/16, önce en açıklayıcı tohumlar, sonra 240 ay. Kurucu AI teması, yaşayan bağımsız devlet, tür reformu/ayrılış, fiilen tamamlanan savaş hedefi, rezerv krizi, bilim ve fiziksel ticaret. P55, p56, aday ve birden çok plasebo ile ilk ayrışmayı kaydet. İki uç tohumda tek ölçüm üzerinden savaş veya siyasi kapı değiştirme.

## Komutlar

```sh
export NODE_PATH="$PWD/tests/node_modules"
export STARS_CHROMIUM_PATH=/usr/bin/chromium
export STARS_OUTPUT=/tmp/p56-kabul-yeni
MP8_SCEN=I MP8_I_MIN=8 SCALE0_MP='{"size":"ulu","ai":9}' node tests/browser-mp8.cjs
MP8_SCEN=I node tests/browser-mp8.cjs
MP8_SCEN=I MP8_ONLY='^I[03] ' SCALE0_MP='{"size":"ulu","ai":9}' MP8_I_NO_SENSOR=1 node tests/browser-mp8.cjs
for senaryo in F FA L M SD SG J Q; do
  MP8_SCEN="$senaryo" MP8_J_NATURAL=1 node tests/browser-mp8.cjs
done
MP8_SCEN=R MP8_MONTHS=3 node tests/browser-mp8.cjs
STARS_TEST_WORKERS=2 STARS_TEST_LOGS=/tmp/p56-kabul-node node tests/run-all.js
STARS_CONTROL_ROOT="$P55" node tests/fed_ai_siyaset0_equivalence_test.js
node research/p56-kabul0/packages.cjs "$P55" /tmp/p56-paket.json
node research/p56-kabul0/f5-baseline.cjs "$P55" .
node research/p56-kabul0/relay-ready.cjs "$P55" "$P56" "$P57"
node research/p56-kabul0/build-parity.cjs "$P56" "$P57" /tmp/p56-kabul/kayit/*.save
python3 research/p56-kabul0/zip-check.py "$P56"
python3 tools/verify-release.py --root "$P57"
python3 tools/package-release.py --root "$P57" --out /tmp/p57-a.zip
python3 tools/package-release.py --root "$P57" --out /tmp/p57-b.zip
cmp /tmp/p57-a.zip /tmp/p57-b.zip
```

Negatif I3 kontrolünün gözlenen yeni görünürlüğü kesip testi düşürmesi beklenir. `STARS_RELAY_ROOT="$P55"` aynı yeni tarayıcı testini p55 oyunuyla çalıştırır. Node çalıştırıcı ve Chromium için mevcut kurulum ile sürüm kimliklerini kullan. Ağ/işlem kısıtı yüzünden stdout okunamayan koşular kabul kanıtı sayılmaz.
