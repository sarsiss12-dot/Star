# STARS — MP.3.1 sonuç raporu: federasyon siyaseti, gerçek insan oylamaları, vasallık sözleşmeleri

Dal: `claude/stars-mp31-federation-vassal`. Taban: `main` `e7e65b9cb82bf7115f8c2e92c18dff3520be8aee` (96H.10 + MP.0 – MP.3).

**Karar: yayımlanmayan geliştirme prototipi.**

- Uzak insan oyuncular federasyon oylarını kendileri veriyor, başvuruyor, daveti kabul/ret ediyor ve ayrılıyor.
- İki insan gerçek vasallık sözleşmesi pazarlığı yapıyor: teklif, karşı teklif, kabul, yenileme, barışçıl bağımsızlık.
- Bütün kararlar host'un motorunda uygulanıyor.
- Runtime, build `96h10`, PWA `stars-v96h10`, Save8 ve kanonik ZIP değişmedi.
- Gerçek internet sunucusu yok. Fiziksel Android NOT RUN.

## 1. Başlangıç doğrulaması

| | Sonuç |
|---|---|
| `main` HEAD | `e7e65b9…`; ağacı MP.3 dalının son commit'i `f27ac9b` ile aynı |
| ZIP | SHA-256 `78e76d16…6be6d0`, CRC32 `cf97cc3a`, 20 girdi, `testzip` temiz |
| Manifest | ZIP içi = çalışma ağacı (19 dosya `cmp` eşit); build 96h10, PWA stars-v96h10 |
| Save | v8 (`serialize` → `v:8`) |
| `verify-release.py --root <ZIP çıkışı>` | DOĞRULANDI (başta ve sonda) |
| Runtime farkı (`git diff origin/main`: 19 dosya + manifest + releases) | boş |

## 2. Bulunan kritik hata ve düzeltme

- Motorun `fedOpenVote` seçmen döngüsü yalnız devlet 0'ı (`if (id === 0) continue;`) AI değerlendirmesinden ayırıyordu.
  - Multiplayer'da uzak insanın (ör. devlet 3) oyu `aiFedVoteAssessment` ile veriliyor ve onun için rezerve RNG çekiliyordu.
  - Öneren insan da otomatik "evet" alıyordu.
  - Korumasız motorda yeniden üretildi.
- Düzeltme (yalnız MP oturumunda, `installGuards`): motorun kendi `fedOpenVote` / `startFedVote` metni tek koşulla genişletildi (`__mpHumanVoter`). Uzak insan devlet 0 gibi atlanır.
- `fedFounderCandidate` sarmalandı: uzak insan AI eğilimiyle kurucu yazılmaz.
- Uzak insan yokken davranış ve RNG birebir aynı (96E fikstürü + 60 günlük yayın kimliği).

Ayrıntı: `MULTIPLAYER-MP31-MIMARI.md` §1.

## 3. Değişen dosyalar

- **Çekirdek** — `research/mp0/mp-core.js`:
  - 11 komut;
  - insan oyu koruması;
  - `pol` görünümü (`pure()` içinde);
  - `polSweep` bildirimleri;
  - motor reddi gerekçesi (`rules:engine`).
- **Yeni:** `research/mp31/client/pol-ui.js`, `research/mp31/client/mp31.css`, `research/mp31/README.md`, `research/mp31/evidence/` (18 PNG + JSON).
- **İstemci:**
  - `research/mp2/client/guest-game.js`: TİCARET / FEDERASYON / VASALLIK bölümleri, rozetler;
  - `research/mp1/client/mp1-host.js`: host paneli bölümleri;
  - `research/mp1/client/join.js`: geri tuşu açık pencereyi kapatır;
  - `research/mp3/client/dip-ui.js`: `close()` sonuç döndürür;
  - `research/mp1/client/join.html`.
- **Relay ve dağıtım:** `research/mp1/server/relay.js` (izin listesi + host enjeksiyonu), `research/mp1/deploy/Dockerfile`, `.dockerignore`.
- **Testler:**
  - yeni: `tests/mp31_core_test.js` (15), `tests/browser-mp31.cjs` (11);
  - beklenen dosya listesi güncellenen (gevşetme yok): `tests/mp1_relay_test.js`, `tests/browser-mp1.cjs`.
- **Belgeler:** `MULTIPLAYER-MP31-MIMARI.md`, `-FEDERASYON.md`, `-VASSALLIK.md`, bu dosya, `PROJE-DURUMU.md`, `CLAUDE.md`.

## 4. Test sonuçları

### `tests/mp31_core_test.js` — 15/15 PASS (Node vm, gerçek motor)

Dünya: seed 22; insan A=1, B=3, C=4; AI 2, 5. Siyasi başlangıç açık fikstür: temas, Etki, ittifak ve AI 5 başkanlığında {5, 2, B} federasyonu.

1. **Kritik insan oyu:** korumasız motor B'yi oylatıyor (hata yeniden üretildi).
   - MP'de B evet/hayır listesinde, değerlendirmede ve gerekçede yok.
   - Yalnız AI 2 için bir rezerve RNG çekildi.
   - B'ye bildirim gitti; B'nin oyu tek başına kaydedildi.
2. **Oy = motor:** ağdan oy ile `castFedVote` aynı Save8 ve RNG.
   - Reddedilenler: sahte token, üye olmayan ve sahte federasyon (`no-fed`), sahte devlet, bozuk parametre, sonuçlanmış gündem, süresi dolmuş gündem.
   - Süre dolunca B çekimser (insan adına oy yok).
   - Host başkası adına oy veremez.
3. **Başvuru:** A, AI 5 üzerinden başvurdu (60 Etki).
   - Kabul oylaması açıldı; B kendi oyunu verdi.
   - Davet A'ya gitti ve A kendisi kabul etti.
   - Gerçek üyelik oluştu; ikinci kabul `no-invite`.
4. **Davet:** B, A'yı davet etti; oylama yapıldı; A reddetti.
   - Başkası kabul edemedi.
   - Yükümlülük değişince `rules:changed`, süre dolunca `rules:expired`; üyelik oluşmadı.
5. **Oy rejimleri:** eşit, hegemonik, ekonomik, karma ve ağırlıklı rejimlerde ağırlık, toplam ve kural metni motorla aynı. Her rejimde ağdan oy = motor (Save8 + RNG).
6. **Ayrılma:** ağdan ayrılma = `leaveFederation` (Save8 + RNG).
   - Üye olmayan ve host ayrılamaz.
   - İttifaklar ve 24 ay bekleme motordan geliyor; diğer üyelerin oyları korunuyor.
7. **Kuruluş koruması:** AI kurucu listesinde uzak insan "oyuncunun açık üyelik onayı gerekli" ile görünüyor. İnsan kurucu motor şartlarına tabi.
8. **Vasallık insan–insan:**
   - B himaye istedi (%20); teklif tek başına vasallık kurmadı.
   - A karşı teklif verdi (%10); %90 vergi `rules:terms` ile reddedildi.
   - Eski tur `stale`; başkası `no-offer`; kendi teklifini kabul `not-recipient`.
   - B kabul etti; ikinci kabul `closed`.
   - Her adım doğrudan motorla aynı Save8 ve RNG; sonraki ay vergi motorla aktı.
9. **Yenileme ve bağımsızlık:**
   - erken yenileme motor gerekçesiyle reddedildi;
   - reddedilen yenileme sözleşmeyi değiştirmedi;
   - soğuma süresi motorda;
   - bağımsızlığı yalnız vasal talep edebiliyor;
   - talep savaş başlatmadı;
   - ret: vasallık sürdü;
   - kabul: `freeVassal`, savaş yok, B bildirim aldı.
10. **AI ↔ insan:**
    - AI 2'nin A'dan himaye istemesi motor kuralıyla mümkün değildi (raporlandı).
    - C → AI 5 biat isteğinde AI karşı teklif verdi (tur 2) ve C'nin kararını bekledi.
11. **Gizlilik:** C'nin hiçbir paketinde A–B müzakere kimliği, hükmü ya da F oylama alanı yok. Gerçek ve hayalî müzakere için aynı yanıt.
12. **Çakışmalar:**
    - vasal devlet başvuramıyor;
    - üye vasal olunca motor üyeliği sürdürüyor (raporlandı);
    - ölen insanın açık müzakeresi ve daveti geçersizleşiyor.
13. **Kayıt:** bekleyen oylama ve müzakere `deserialize(serialize())` sonrası insan tarafından tamamlandı.
14. **Yayın Save8'e dokunmuyor:** 60 gün her gün yayın = yayınsız (Save8 + RNG).
15. **Tek oyunculu kimlik:** 96E fikstüründe oylama, başvuru, yasa, ayrılma ve vasallık; korumalı = korumasız (Save8 + RNG).

### `tests/browser-mp31.cjs` — 11/11 PASS, sayfa hatası 0

Kurulum: 4 ayrı Chromium süreci (host 915×412, A 390×844, B 360×800, C 412×915), gerçek dokunma, yerel relay.

| # | Vaka | Sonuç |
|---|---|---|
| 1 | Lobi → oyun; misafirde motor yok; TİCARET / FEDERASYON / VASALLIK; host korumalı | PASS |
| B | AI başkanın yasa önerisi; B oy vermeden listelerde yok; B telefondan HAYIR (iki adımlı onay); yalnız B'nin oyu kaydedildi; yasa 2/1 KABUL | PASS |
| A/D | A BAŞVUR → oylama → B EVET → KABUL → A'nın DAVETLER'ine davet → KATIL → gerçek üyelik; ikinci kabul `no-invite`; A AYRIL → üyelik kalktı | PASS |
| E | B himaye taslağı (haraçgüzar, Enerji %20) → önizleme (90 Etki, engel yok) → gönder; A rozet + GELEN → karşı teklif %10 → B kabul → sözleşme; eski tur `stale`, C `no-offer`; sonraki ay vergi aktı | PASS |
| F | B BAĞIMSIZLIK İSTE; geri tuşu yalnız onay penceresini kapattı (oyun ve "Ayrıl" sorusu yok); A REDDET (vasal, savaş yok); yeniden talep; A KABUL → bağımsız | PASS |
| G | C → AI 5 biat: AI motorla reddetti (tur 1) | PASS |
| H | Yetki ve gizlilik (ayrıntı aşağıda) | PASS |
| — | Host paneli: FEDERASYON (başvuru gerekçeleri) ve VASALLIK; 915×412 düzen | PASS |
| — | 5 görünüm × federasyon 4 bölüm × vasallık 4 bölüm + taslak + onay penceresi: taşma yok, ≥44 px, yazı ≥11 px | PASS |
| — | Host ağı kesilince düğmeler kapandı, komut `host-yok`; host dönünce açıldı | PASS |
| J | Performans (§6) | PASS |

Vaka H — yetki ve gizlilik:

- Doğal AI gündeminde B oy vermeden listelerde yok.
- Reddedilen istekler:
  - üye olmayan oy ve sahte federasyon: `no-fed`;
  - sahte token: `stale`;
  - sahte devlet: `forged-empire`;
  - başkasının müzakeresi: `no-offer`;
  - bozuk vergi: `bad-params`; motor dışı vergi: `rules:terms`;
  - üye olmayan ayrılma: `rules:no-fed`;
  - host'un başkası adına oyu: `no-fed`.
- Hiçbir ret durumu değiştirmedi.
- C'nin paketlerinde oylama ve A–B müzakere verisi yok.

### Regresyon

| Test | Sonuç |
|---|---|
| Tam Node regresyonu (`run-all`, 3 işçi) | **148 paket, 6187 PASS / 3 FAIL** (yeni `mp31_core_test` 15). 3 FAIL: bilinen `faz95d_identity_test.js` seed 11/99/404; yeni FAIL yok |
| `mp0_core` / `mp1_lobby_core` / `mp1_relay` / `mp11_online` / `mp1_actor_vision(_b)` / `mp2_core` / `mp3_core` | 11 / 7 / 14 / 9 / 2+2 / 7 / 11 — hepsi PASS |
| `browser-96h10` | 27/27 PASS |
| `browser-mp0` | 20/20 PASS |
| `browser-mp1` | 22/22 PASS |
| `browser-mp11` | 10/10 PASS |
| `browser-mp2` | 14/14 PASS |
| `browser-mp3` | 12/12 PASS |
| `browser-mp31` | 11/11 PASS |
| ZIP / CRC / SHA / manifest | DOĞRULANDI, değişmedi |

## 5. Save8 ve RNG

- Federasyon ve vasallık kayıtları kanonik `G`'de; Save8 şeması değişmedi.
- Ağdan karar = doğrudan motor çağrısı (aynı bayt, aynı RNG): oy, beş rejim, ayrılma, vasallık teklifi, karşı teklif, kabul, vergi ayı.
- İnsan oyu için RNG çekilmiyor; AI seçmenlerin rezerve çekim takvimi korunuyor.
- Uzak insan yokken korumalı motor = düz motor.
- Yayın (`polView`, `polSweep`) `pure()` içinde: Save8'e dokunmuyor.

## 6. Performans (yerel relay, başsız Chromium, 4 insan)

| Ölçüm | Değer |
|---|---|
| Federasyon oyu → sonuç | 30 ms |
| Vasallık teklifi → sonuç | 16 ms |
| Vasallık kabulü → sonuç | 16 ms |
| Host `publish()` (3 misafir) | medyan 3,9 ms, p95 6,7 ms |
| `pol` bölümü | 4,5–6,6 KB |
| `pol` içeren delta | medyan 4,7–7,6 KB, en çok 10,6 KB |
| Snapshot | 18–21 KB |
| Siyaset ekranı çizimi | medyan 0,3–0,7 ms |
| Bellek | host 13 MB, misafir 3–5 MB |

## 7. Açık konular

- **Üye vasal olunca üyelik:** motor federasyon üyeliğini sona erdirmiyor; başvuruda ise vasallar reddediliyor. Bu tutarsızlık motor kuralı olduğu için değiştirilmedi; ayrı faz kararı.
- **Güç oranı sızıntısı:** `canDemandVassal` / `canSeekProtection` gerekçesi insana gerçek güç oranını gösteriyor (tek oyunculu motor davranışı).
- **AI → insan vasallık teklifi** bu dünyada doğal gözlenmedi (AI 2 yeterince zayıf değildi). Motor yolu kod ve testle insanın kutusuna düşüyor.
- **Host rozeti:** panel kapalıyken yalnız ticaret tekliflerini sayar. Host'un federasyon ve vasallık bildirimleri motorun kendi gelen kutusunda.
- **Kapsam dışı:**
  - ortak savaş kararları (`joinWar` / `newWar` / `executeFedDecision`), başkan seçimi, ihraç, reform ve anayasa önergeleri;
  - yeni vasallık türleri;
  - tazminat;
  - tam MP kayıt/yükleme (MP.4).

## 8. NOT RUN

- Gerçek internet sunucusu (dağıtım yok, URL yok).
- Fiziksel Android telefon.
- Aynı Wi-Fi'da LAN.
- Docker imaj derlemesi.
