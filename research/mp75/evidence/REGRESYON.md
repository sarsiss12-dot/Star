# MP.7.5 — regresyon ve kanıt kaydı

Ortam: bulut konteyner, Node v22, Chromium `/opt/pw-browsers/chromium`, Docker 29.

Koşulmayanlar (**NOT RUN**): fiziksel Android, gerçek internet, canlı Render.

## Yayın

- **Runtime:** `ui.js` (MP.7.5 blokları), `inbox.js` (`/* END MP.7.5 INBOX */`), `index.html` (`/* END MP.7.5 QTY */`), `main.js` (BUILD_ID `96h10p4`), `sw.js` (`stars-v96h10p4`).
- **ZIP:** `releases/stars-faz96h10p4.zip`.
  - 773 870 bayt, 20 girdi.
  - SHA-256 `3ebc53ab8d15620666b7bb40b73efdbd0948b2f0469182e96aa988179c22e0d8`, CRC32 `cb205d22`.
  - İki paketlemede aynı bayt.
  - Çıkarılıp `verify-release.py --root` → "DOĞRULANDI: 19 dosya; oyun build 96h10p4".
- **Koruma adaptörleri:**
  - `tests/helpers/mp75-preservation.js` (`inbox.js` bloğu, `faz96h31` testinde);
  - `tests/helpers/ui-preservation.js` (`index.html` MP.7.5 CSS bloğu).

## Node

| Koşu | Sonuç |
|---|---|
| Tam `run-all` (son aday, 4 işçi) | **171 paket, 6359 / 3**. 3 KALAN yalnız bilinen `faz95d_identity`. |
| İlk tam koşu (düzeltmeden önce) | 6354 / 8. Ayrıntı aşağıda. |
| `mp75_war_test` | 4 / 0 |
| `mp74_notice_test` | 6 / 0 |
| `faz95c1_ui_test` | 29 / 0 |
| `faz96h31_compact_construction_test` | 15 / 0 |

İlk tam koşunun 5 yeni FAIL'i:
- `faz95c1_ui_test` 4: durum listesinde savaş satırının mevcut diplomasi akışını açması bekleniyordu. Satır korundu; "Aktif savaşlar listesi" ayrı satır oldu.
- `faz96h31` 1: `inbox.js` bayt koruması. Tam metinli koruma adaptörü eklendi.

## Chromium (son aday)

| Test | Sonuç | Not |
|---|---|---|
| browser-mp75 (yeni) | **6 / 0** | Son `ui.js` ile yeniden |
| browser-mp74 | 7 / 0 | |
| browser-mp73 | 8 / 0 | |
| browser-mp72 | 9 / 0 | |
| browser-mp71 | 12 / 0 | |
| browser-mp7 | 9 / 0 | |
| browser-96h10 (tek oyunculu) | 27 / 0 | |
| browser-mp0 | 20 / 0 | |
| browser-mp1 | 22 / 0 | |
| browser-mp11 | 10 / 0 | |
| browser-mp2 | 14 / 0 | |
| browser-mp3 | 12 / 0 | |
| browser-mp31 | 11 / 0 | |
| browser-mp4 | 13 / 0 | |
| browser-mp6 | 11 / 0 | |
| browser-mp61 | 13 / 0 | Yeniden: hap kuralı + yerleşim denetimi güncellendi |
| browser-mp62 | 10 / 0 | |
| browser-mp63 | 15 / 0 | |
| browser-mp64 | 10 / 0 | |
| browser-mp5 | 10 / 0 | |
| mp5_docker | 6 / 0 | |

**Docker imajı:** 12 dosyanın SHA-256 önekleri çalışma ağacıyla aynı — `ui.js`, `index.html`, `inbox.js`, `main.js`, `sw.js`, relay, `view.js`, `mp1-host.js`, `mp1.css`, `guest-stars.js`, `mp61.js`, `mp-core.js`.

**browser-mp61 ilk koşu 6 / 7.**
- MP.7.5 iki MP.6.1 beklentisini değiştirdi:
  - üst durum hapı yalnız bildirim / bağlantı sorunu varken görünüyordu → duraklatılmış oyunda da görünür olacak şekilde düzeltildi;
  - MP düğmesi artık araç sütununun öğesi.
- Kalan hatalar zincirleme hatalardı. Yeniden koşu 13 / 0.

## Performans ölçümü

`perf/` (taban / aday JSON, `ozet.txt`). Yöntem ve tablo: `MULTIPLAYER-MP75-SONUC.md` §3.

**Not:** büyük galaksi aday koşusu ve ilk Konsey aday koşusu, sonradan düzeltilen `mp61` hap hatasıyla koşuldu. Konsey ve orta galaksi aday koşuları hatasız yinelendi (`cand-council.json`, `cand-orta-5.json` yinelenmiş sürümdür).
