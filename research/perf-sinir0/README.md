# PERF-SINIR.0 denetimleri

- Oynanabilir kontrol p43. Commit `54a52555c699d82507f6285580577571d4200380`.
- [Pilot ve kaynak araştırma](https://github.com/sarsiss12-dot/Star/blob/44c11195e31260c8e740c86689ed31a102d2e6b2/reports/codex/P43-AI-PERF-ARASTIRMA-SONUC.md)
- [Sonuç raporu](../../reports/codex/PERF-SINIR0-SONUC.md)

Komutlar depo kökünden çalışır. `STARS_CONTROL_ROOT` p43 çalışma ağacını, `CHECKPOINT_DIR` Save8 girdilerini, `STARS_OUTPUT` ölçüm çıktılarını gösterir. Linux tarayıcı ölçümleri Playwright ve `STARS_CHROMIUM_PATH` ile belirtilen Chromium yürütülebilirini kullanır.

Paketteki girişleri açıp ölçümü yeniden çalıştırmak için:

```bash
git worktree add --detach ../stars-p43 54a52555c699d82507f6285580577571d4200380
export STARS_CONTROL_ROOT="$(cd ../stars-p43 && pwd)"
export CHECKPOINT_DIR="$(mktemp -d)"
export STARS_OUTPUT="$(mktemp -d)"
for fixture in reports/codex/evidence/perf-sinir0/*.save.gz; do
  name="$(basename "$fixture" .gz)"
  gzip -dc "$fixture" > "$CHECKPOINT_DIR/$name"
done
```

### Tam ay, profil ve kayıt eşdeğerliği

```bash
node research/perf-sinir0/chromium.cjs profile-base 500-16-11-m120 500-16-11-m180
node research/perf-sinir0/chromium.cjs profile-candidate 500-16-11-m120 500-16-11-m180
node research/perf-sinir0/chromium.cjs compare 100-9-11-m3 100-9-11-m120 500-16-11-m3 500-16-11-m120 500-16-11-m180
node research/perf-sinir0/focused.cjs
for seed in 11 99 404; do
  node research/perf-sinir0/campaign.cjs 500 16 "$seed" 240
done
```

Zaman ölçümü her kayıtta sekiz temiz tarayıcı bağlamını sırayla açar. Sıra AB, BA, AB, BA. Bağlam başına iki ay ısınma ve altı tam oyun ayı örneği vardır. Save8 serileştirme ve SHA-256 zamanlanan aralığın dışındadır. Kampanya denetiminde kontrol ve aday ayrı Node süreçlerinde gerçek oyun betiklerini çalıştırır. Ay başına Save8 ve ayrı AI izi özetlenir. Ayrışmada ilk farklı kopyalar ve izler yazılır.

500 sistem kontrol kayıtları [p43 kampanya düzeneğiyle](https://github.com/sarsiss12-dot/Star/tree/44c11195e31260c8e740c86689ed31a102d2e6b2/research/p43-audit) aynı tohum ve başlangıç ayarından üretilir. 120 ve 180. aylar aynı doğal kampanyanın ayrı Save8 girdileridir. 100 sistem için dokuz AI ve tohum 11 kullanılır. Girdi hashleri zamanlama sonuçlarının başındadır.

### Gerçek multiplayer

```bash
MP8_SCEN=H STARS_RELAY_ROOT="$STARS_CONTROL_ROOT" STARS_OUTPUT=/tmp/stars-border/base node tests/browser-mp8.cjs
MP8_SCEN=H STARS_OUTPUT=/tmp/stars-border/candidate node tests/browser-mp8.cjs
```

İki koşuda da host ve iki ayrı kalıcı misafir profili kullanılır. H0'da relay sürümü host ve iki misafirin arayüz kimliğiyle karşılaştırılır. Eşit oyun adımı için host gün sıfırda duraklatılır. Ayna kozmetik tohumları test düzeneğinde misafir kimliğine sabitlenir. H1 kontrollü sensör, keşif, rota ve sevkiyat durumu kurar ve gerçek relay'den gelen aynayı kontrol eder. H2 gerçek misafir bağlantısını kesip yeniden kurar ve tersane emrini misafirin arayüzünden gönderir.

H sonuçlarını çapraz karşılaştırmak için:

```bash
node research/perf-sinir0/mp-proof.cjs /tmp/stars-border/base/H/mp8-H.json /tmp/stars-border/candidate/H/mp8-H.json
```

Ayna alanlarını teşhis etmek için iki koşuda da `STARS_H_RAW=1` verilebilir. Bu seçenek H sonucunun yanında iki misafirin host hash'iyle karşılaştırılmış kanonik JSON çıktısını yazar.
