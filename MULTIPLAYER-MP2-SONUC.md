# STARS — MP.2 sonuç raporu: misafir haritası, gerçek filo emri, araştırma yönetimi

Dal: `claude/stars-mp2-gameplay`. Taban: `main` `43f9cb38aa7f402f8d983275808824ea25ef4b64` (96H.10 + MP.0 + MP.1 + MP.1.1).

**Karar: yayımlanmayan geliştirme prototipi.**

- Misafir artık galaksi haritasında gezinip kendi filosunu başka sisteme gönderiyor, araştırma hedefi ve kipi seçiyor.
- Bunların hepsi host'un gerçek motorunda uygulanıyor (`orderMove`, `researchTarget`, `setResearchMode`).
- Runtime, build `96h10`, PWA `stars-v96h10`, Save8 ve kanonik ZIP değişmedi.
- Gerçek internet sunucusu yok (MP.1.1'deki engel sürüyor). Fiziksel Android NOT RUN.

## 1. Başlangıç doğrulaması

| | Sonuç |
|---|---|
| `main` HEAD | `43f9cb3…`. Ağacı, MP.1.1 dalındaki son commit `9174316` ile aynı |
| ZIP | SHA-256 `78e76d16…6be6d0`, dosya CRC32 `cf97cc3a`, 20 girdi, `testzip` temiz |
| Manifest | ZIP içi = çalışma ağacı; 19 SHA eşleşiyor; build 96h10, PWA stars-v96h10 |
| `verify-release.py --root <ZIP çıkışı>` | DOĞRULANDI (başta ve sonda) |
| Runtime farkı (`git diff origin/main` 19 dosya) | boş |

## 2. Değişen dosyalar

- **Çekirdek** — `research/mp0/mp-core.js`:
  - `move`, `research`, `researchMode` komutları;
  - komut başına `locate`;
  - `viewFor` genişlemesi (kendi filo ayrıntısı, `sci`, `tech`, `log`);
  - temassız devlet maskeleme;
  - `pure()` yayın koruması;
  - duraklatmada `paused`;
  - uzak insanın araştırma bildirimleri.
- **Yeni:** `research/mp2/client/guest-game.js`, `research/mp2/client/mp2.css`, `research/mp2/README.md`, `research/mp2/evidence/`.
- **MP.1 istemcisi:**
  - `join.js`: oyun ekranı `MP2Game`'e devredilir;
  - `view.js`: değişen bölümler;
  - `join.html`: iki yeni dosya.
- **Relay ve dağıtım:**
  - `relay.js` izin listesi (+2 dosya);
  - `research/mp1/deploy/Dockerfile` ve `.dockerignore` (+`research/mp2/client/`).
- **Testler:**
  - yeni: `tests/mp2_core_test.js`, `tests/browser-mp2.cjs`;
  - değişen: `tests/browser-mp1.cjs` (2 yer), `tests/browser-mp11.cjs` (1 yer).
    - İnşa adımından önce KOLONİLER sekmesine geçiş eklendi; inşa kontrolleri artık bu sekmede.
    - Misafir sayfasının beklenen betik listesine `guest-game.js` eklendi.
    - Hiçbir assertion gevşetilmedi ya da silinmedi.
- **Belgeler:** `MULTIPLAYER-MP2-MIMARI.md`, `MULTIPLAYER-MP2-MOBIL-HARITA.md`, bu dosya, `PROJE-DURUMU.md`, `CLAUDE.md`.

## 3. Test sonuçları

### `tests/mp2_core_test.js` — 7/7 PASS (Node vm, gerçek motor)

1. Ağdan `move` = doğrudan `orderMove` + `f.ord=null`.
   - Aynı Save8; her 5 günde hâlâ aynı.
   - Filo hedefe varıyor; misafir görünümü kanonik konumu izliyor.
2. Motor kuralları:
   - kapalı sınır: savaş filosu `rules:passage`, bilim gemisi geçiyor;
   - `same`, `no-route` (kurguda şeritleri kesilmiş hedef);
   - başka devletin / olmayan filo `not-owner`;
   - hatalı parametre ve istemci rotası `bad-params`;
   - sahte devlet `forged-empire`;
   - her redde Save8 ve RNG aynı.
3. Tekrarlanan `cid` bir kez (3 tekrar), eski `seq` reddi, `paused`.
4. Ağdan `research` = doğrudan `researchTarget`.
   - Aynı Save8.
   - Hedef dalın aktif araştırması oluyor; ilerleme artıyor, tamamlanıyor; iki dünya sonunda aynı.
   - Bildirim misafirde, host günlüğünde değil.
5. Araştırma kuralları:
   - `access`, `done`, geçersiz kimlik, `bad-position`, `same` kip reddedildi (Save8 ve RNG aynı);
   - sıra değiştirme, çıkarma ve elle kip çalışıyor;
   - AI devleti adına komut `forged-empire`.
6. Gizlilik:
   - kendi filo ayrıntısı var;
   - yabancı filo yalnız `{id, e, s, n}`, temassızsa `e:null`;
   - temassız sahip `-2`;
   - temassız devlet adı ve yabancı filo adı yok, iç alan yok;
   - snapshot Save8'in üçte birinden küçük.
7. Tek oyunculu: korumalar kurulu lobi host'u (uzak insan yok) 120 günde düz motorla aynı Save8 ve RNG.

### `tests/browser-mp2.cjs` — 14/14 PASS, sayfa hatası 0

Kurulum:

- 3 ayrı Chromium süreci: host 915×412, misafir A 390×844, misafir B 360×800;
- gerçek dokunma olayları (CDP `Input.dispatchTouchEvent`);
- yerel relay.

| # | Vaka | Sonuç |
|---|---|---|
| 1 | Gerçek lobi → oyun, iki misafir (devlet 3 ve 4), seed 11 / 45 sistem; misafirde motor yok | PASS |
| 2 | Varsayılan HARİTA: başkent ortada, harita çizili, keşfedilmemiş sistem adsız, dört sekme | PASS |
| 3 | Tek parmak kaydırma (piksel doğruluğunda), iki parmak yakınlaştırma/uzaklaştırma, SIĞDIR/+/BAŞKENT, sisteme dokunup panel | PASS |
| 4 | Haritadan filo emri (ayrıntı aşağıda) | PASS |
| 5 | Kapalı sınıra savaş filosu → "Rota kapalı", host durumu aynı | PASS |
| 6 | FİLOLAR listesi, HARİTADA ortalama; sekmeler arasında seçim ve kamera korunuyor | PASS |
| 7 | Bilim ekranından araştırma (ayrıntı aşağıda) | PASS |
| 8 | Kilitli teknoloji: neden görünür, düğme pasif, zorla istek `rules:access`, host durumu aynı | PASS |
| 9 | Gerçek misafir sayfasından yetkisiz istekler (ayrıntı aşağıda) | PASS |
| 10 | Gizlilik: A ve B paketleri ayrı tarandı (ayrıntı aşağıda) | PASS |
| 11 | Sayfa yenileme: aynı sekme, kamera ve seçim; filo rotası ve araştırma host'tan aynı; arka plan duraklatma metni ve dönüş | PASS |
| 12 | 360×800 / 390×844 / 412×915 / 844×390 / 915×412 × 4 sekme: taşma yok, ≥44 px, yazı ≥11 px, harita alanı; geri tuşu | PASS |
| 13 | Performans, 45 sistem (§5) | PASS |
| 14 | 60 sistem gerçek oynanış (hareket + araştırma) ve 100 sistem kapasite denetimi | PASS |

Vaka 4 — haritadan filo emri:

- filoya dokun → HEDEF SEÇ;
- boş alana dokunmak hiçbir şey yapmadı; İPTAL komut göndermedi (host durumu aynı);
- sisteme dokun → "gönderilsin mi?" → GÖNDER;
- host `orderMove` uyguladı, rota misafirde göründü;
- 15 oyun gününde varış, misafir haritasında aynı konum.

Vaka 7 — bilim ekranından araştırma:

- dal, teknoloji, HEDEFE EKLE → host `researchTarget`;
- Elle kipi → host `setResearchMode`;
- ilerleme arttı; 30 oyun ayında tamamlandı;
- "Tamamlandı" ve bildirim misafirde.

Vaka 9 — yetkisiz istekler:

| İstek | Sonuç |
|---|---|
| Başka oyuncunun filosu | `not-owner` |
| Sahte devlet | `forged-empire` |
| AI adına araştırma | `forged-empire` |
| İstemci rotası | `bad-params` |
| `__proto__` teknoloji | `bad-params` |
| Bozuk `cid` | `bad-cmd` |
| Eski `seq` | `stale-seq` |
| Duraklatılmış host | `paused` |
| Aynı `cid` iki kez | bir kez uygulandı |

Hepsinde host Save8 ve RNG aynı. Bu karşılaştırmada host'un kendi tek oyunculu arayüzünün damgaladığı `_` önekli önbellekler hariç tutuldu; tam bayt eşitliği vm testinde.

Vaka 10 — gizlilik:

- temassız devlet adı ya da kimliği yok;
- yabancı filo adı yok;
- bilinmeyen sistem adı yok;
- iç alan yok;
- yabancı filo anahtarları yalnız `id/e/s/n`;
- her misafir yalnız kendi araştırma hedeflerini görüyor (B'nin `m_warp` hedefi A'da yok).

### Regresyon

| Test | Sonuç |
|---|---|
| Tam Node regresyonu (`run-all`, 3 işçi) | **146 paket, 6161 PASS / 3 FAIL** (yeni `mp2_core_test` 7) |
| 3 FAIL | Bilinen `faz95d_identity_test.js` seed 11/99/404. Yeni FAIL yok |
| `mp0_core_test` | 11/11 PASS |
| `mp1_lobby_core_test` | 7/7 PASS |
| `mp1_actor_vision(_b)` | 2/2 + 2/2 PASS |
| `mp1_relay_test` | 14/14 PASS |
| `mp11_online_test` | 9/9 PASS (Dockerfile dosya kümesi + smoke dahil) |
| `browser-96h10` (tek oyunculu) | 27/27 PASS |
| `browser-mp0` | 20/20 PASS |
| `browser-mp1` | 22/22 PASS |
| `browser-mp11` | 10/10 PASS |
| `browser-mp2` | 14/14 PASS |
| ZIP / CRC / manifest | DOĞRULANDI, değişmedi |
| Fiziksel Android | **NOT RUN** |
| Gerçek internet | **NOT RUN** (sunucu yok) |
| Gerçek Wi-Fi LAN | **NOT RUN** |

## 4. Bulunup düzeltilen hatalar

1. **Yayın yan etkisi (MP.0'dan beri):**
   - `viewFor` motorun Save8'e giren günlük önbellek damgalarını (`_powAt`, `_pressAt`) yazıyordu.
   - Uzak insan varken yayın, Save8 baytlarını ve aynı günkü önbellek okumalarını değiştirebiliyordu.
   - `pure()` ile giderildi; kanıt: yayınlı ve yayınsız dünyalar her 5 günde eşit.
2. **Temassız devlet kimliği:** yabancı filoda (`e`) ve sistem/gezegen sahipliğinde (`o`) gidiyordu; maskelendi.
3. **Araştırma bildirimleri:** uzak insanınkiler host günlüğüne düşüyordu; artık oyuncunun kendi listesinde.

## 5. Performans (yerel Chromium; gerçek telefon değil)

| Ölçüm | 45 sistem (2 misafir) | 60 sistem | 100 sistem (kapasite) |
|---|---|---|---|
| Harita karesi (misafir) | 0,1 ms (780×1404 tuval) | 0,3 ms | 0,3 ms |
| Filo komutu (dokunuş → sonuç) | 134 ms | 66 ms | — |
| Snapshot (bir kez, bağlanınca) | 13,6 KB | 13,0 KB | 14,3 KB |
| Delta (canlı) | medyan 92 B, en çok 490 B | — | — |
| Canlı oyun, hız 3 | 4,8 mesaj/sn, 0,5 KB/sn misafir başına | — | — |
| Host ay simülasyonu | 62 ms | 106 ms | — |
| Host yayını (`publish`) | — | — | 1,3 ms |
| Misafir JS yığını | 10,4 MB | — | — |

Snapshot büyümesinin (MP.1'de ~5 KB) ana nedeni 58 teknolojilik katalog. Bir kez gider; sonraki teknoloji değişiklikleri yalnız değişen girdileri taşır.

## 6. Açık konular

1. Filo ikmal sınırında durunca motorun `!e.ai` bildirimi host günlüğüne düşüyor. Filo hareket döngüsünde; devlet başına sarılamıyor (MP.3).
2. Filo birleştirme, bölme, sevkiyat, savaş/saldırı emri, koloni gemisiyle yerleşim, otomatik keşif aç/kapa yok.
3. Misafir haritasında gezegen ayrıntısı, sınır alanı (bölge boyası) ve yabancı filonun yön bilgisi yok. Kaynak listesi kısaltılmış.
4. Gerçek internet sunucusu yok (MP.1.1 engeli). Fiziksel Android, gerçek Wi-Fi ve internet testleri NOT RUN.

## 7. MP.3 için önerilen en küçük güvenli kapsam

1. **Uzak insanın gelen kutusu.** AI teklifini (`UI.aiOffer`) host yerine misafire göndermek, misafirin kabul/ret komutu ve host'ta `aiRespond` yerine motorun mevcut kabul yolu. İnsan devletine AI karar vermiyor (MP.0 koruması), bu yol bunun üzerine kurulur.
2. **İnsan–insan teklif.** Önce yalnız kaynak takası ve barış/ateşkes: tek tip teklif, karşı tarafın onayı, host'ta mevcut anlaşma motoru (`executeDeal`), tekrar/eski koruması.
3. Filo hareketinin `!e.ai` bildirimlerini oyuncuya yönlendirmek için motor içi dar bir aktör-genel `sayFor(e, …)` kararı. Runtime değişikliği gerektirir: ayrı faz kararı ve koruma testi.
4. Gerçek internet dağıtımı ve iki fiziksel Android ile uçtan uca doğrulama (MP.1.1 dosyaları hazır).
