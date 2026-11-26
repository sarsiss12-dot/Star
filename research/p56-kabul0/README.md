# CODEX-P56-KABUL.0 araştırma araçları

Araçlar p55 `914c00310200bbda97abdcecab56934fccbd7cf3`, p56 `c187a12dee1c799f55453d4a21510efece934900` ve p57 `78668a4dff9373c1b81d0fd3073b64bb9e55a663` için aynı Node VM yükleyicisini kullanır. Düzenekler oyun dosyalarını değiştirmeden gerçek motor çağrılarını yürütür. `P55`, `P56` ve `P57` sabit git ağaçlarıdır. `K` sonuç dizinidir.

```sh
P55=/absolute/path/to/p55
P56=/absolute/path/to/p56
P57=/absolute/path/to/p57
K=/tmp/p56-kabul
mkdir -p "$K"/{kayit,iz,ilk,perf}

CHECKPOINTS="$K/kayit" node research/p56-kabul0/replay.cjs "$P55" ulu 9 11 120 "$K/iz/ulu-11-p55.json"
CHECKPOINTS="$K/kayit" node research/p56-kabul0/replay.cjs "$P55" s500 16 11 180 "$K/iz/s500-11-p55.json"
node research/fed-ai-siyaset0/stres-kayit.cjs "$P55" "$K/kayit/s500-11-m120.save" "$K/kayit/s500-11-siyasi.save"

SAMPLES=4 node research/p56-kabul0/perf.cjs "$P55" "$P56" "$K/perf/ornek.json" "$K/kayit/ulu-11-m120.save"
PHASE=steady SAMPLES=24 WARMUP=16 node research/p56-kabul0/perf.cjs "$P55" "$P57" "$K/perf/100-isinmis.json" "$K/kayit/ulu-11-m120.save"

for row in 'ulu 9 99' 'ulu 9 404' 's500 16 23' 's500 16 404'; do
  read -r size ai seed <<<"$row"
  node research/p56-kabul0/first.cjs "$P55" "$P56" "$size" "$ai" "$seed" 60 "$K/ilk/$size-$seed.json"
done
python3 research/p56-kabul0/compare.py reports/claude/evidence/fed-ai-siyaset0/kampanya "$K/iz" >"$K/kampanya-ozet.json"
node research/p56-kabul0/packages.cjs "$P55" "$K/package.json"
python3 research/p56-kabul0/zip-check.py "$P56" >"$K/zip.json"
```

`replay` yarım günlük adımlarla baştan oynatır. `first` iki kaydı her ay karşılaştırır ve son ortak Save8’i her iki motora yükleyerek ayrışan ayı yarım günlük adımlarla tekrarlar. Bir kararın kabul edilen rota emri olarak oyuna girdiği anı, RNG’yi ve değişen kayıt alanlarını verir. Erken ayrışma tek başına 120–240 aylık sonuçların tek nedenini göstermez.

`perf` aynı dünya girdisinde dönüşümlü ABBA/BAAB, sürekli ayda A/A ve aynı kol Save8/RNG eşitliğini ölçer. `cpuMs` süreç CPU süresidir, `ms` eşzamanlı yükü de içeren duvar saatidir. Profilli ve profilsiz çıktı kayıtları aynı olmak zorundadır. Bir aylık ilk açılış girdi noktası ve p56’da bir ay ilerletilen ortak devam girdisi ayrı işler. Çalışan tarayıcı ve kampanya süreçleri duvar saati örneklerini etkiler. Önceki uzun referans örnekleri sonuç raporunda ayrıca gösterilir.

Tarayıcı ve Node komutları [devir dosyasında](../../reports/codex/CODEX-P56-KABUL0-DEVIR.md), sonuçlar [kanıt klasöründe](../../reports/codex/evidence/p56-kabul0/) bulunur.
