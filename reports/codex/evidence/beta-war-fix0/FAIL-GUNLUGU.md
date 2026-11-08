# İlk FAIL'ler ve sınıflandırma

Son PASS'ler aşağıdaki kayıtları silmez. Kökü belirsiz gerçek kullanıcı vakası bu liste sayesinde kapanmış sayılmaz.

| Kanıt | İlk sonuç | Sınıflandırma / sonraki kanıt |
|---|---|---|
| before.log / before/targeted.json | P12 kontrolünde1PASS/5FAIL | Eski çağrı geri girişi, sefer kilidi ve bağımsız ittifak kabul açığı; ürün kökleri. |
| p11-before.log + p11-source-proof.json | 4PASS/9FAIL | Gerçek p11 kaynak dosyaları; yeni sözleşme testlerinin eksikleri yeniden üretilir. Bu, kullanıcı kaydının yeniden üretimi değildir. |
| mp-cooldown-before.log | Aynı reddedilen AI teklifinden2kayıt | MP ürün yolu ret penceresini uygulamıyor. Sonraki after kaydı1teklif, süre sonrası yeniden değerlendirme. |
| mp-contact-before.log | Yeni misafir cephesi temassızlık nedeniyle habersiz | Ürün: host0 erken dönüşü. Sonraki test kimlik teması sağlar; harita keşfi ve istihbarat değişmez. |
| mp-first.log | A1PASS/PWFFAIL unknown-kind | Yeni yardımcının yanlış sendDeal komutu. Gerçek offer komutuyla düzeltildi; sahte click yok. |
| mp-second.log | A1PASS/PWFFAIL duplicate uid1 | Yeni kart korumasında ürün adayı regresyonu. UID sayacı ve anahtar→UID korunumu düzeltildi; selector.first ile gizlenmedi. |
| mp-final.log | A1FAIL sürüm b7 beklentisi / PWFPASS | Testte yeni b8 için kesin sürüm beklentisi güncellendi. Sürüm assertion'ı kaldırılmadı. |
| mp73.log | 7PASS/5FAIL | Eski aday: P04 fikstürü yeni testin savaş kimlikleriyle çakıştı. A2/B1/B2 kart UID'si ayna altında değişti; B3 önceki oylama adımları başarısızlığının devamı. Temiz MP738/0, ayrı kritik4/0 ve kart kimliği kabulü2/0 bunu ayırır. Tarihsel jEditMe sorunu bu yüzden kapatılmaz. |
| legacy-before.log | 13PASS/1FAIL | Eski, ledger'sız kayıtta bilinen warSince/peaceAt desteği eksikti; küçük tarih geri uyumu eklendi. |
| voluntary-before.log | 14PASS/1FAIL | İlk koruma yeni gönüllü promise'i de engelliyordu. Koruma yalnız otomatik vassal/overlord/federation çağrılarına daraltıldı. |
| war-visibility-old-expectation.log | 33PASS/1FAIL | Eski test bütün sefer için tek kart bekliyordu. Yeni açık kullanıcı şartı gereği3ayrıcephe,1sefer,3farklıkimlik sıkı doğrulanır; gevşetilmiş assertion yok. |
| news-detail-before.log | Misafir arşivinde katılım nedeni yok | Yeni DTO'nun entryKind alanı detay görünümüne bağlanmamıştı. Status metadata fallback ve süzülmüş çağıran adı eklendi. |
| campaign/results.json + seed99-diagnosis | Seed99/gün3900FAIL | Ham ölü devlet bayrağı; aktif cephe aynı gün eliminated ile kapanmış. SEED99-TANI.md ve tam Save8 korundu. |
| campaign/results.json | 200/16seed11,119ayda BLOCKED-budget | İlk150ay hedefinin işlem bütçesi doldu; PASS sayılmadı. Son120ay koşusunda gerçek hedefe ulaşıldı. Playwright bekleme süreleri değişmedi. |
| campaign-initial-candidate/STATUS.txt | Erken aday kampanyası kesildi | Son kaynak kabulü değildir; eski sonuçlar korunur. |

Yeni temiz son kabul koşuları ayrı dizinlerde tutulur. Başarısızlık ekranları ve özgün Playwright hata metinleri önceki dizinlerde kalır.

## Son kabulde bulunan ve saklanan yeni sonuçlar

| Kanıt | İlk sonuç | Kök neden ve son doğrulama |
|---|---|---|
| mp-acceptance-final.log | 1/1 FAIL | Aynı gün/şartlı ikinci barış kapanmış aynı Gelen Kutusu kaydını kullanıyor. Kesin MP ID + eski not ID geçişi; offer-final 1/0, MP71 9/0, gerçek PWF 2/0. |
| mp3-final.log + mp3-parent.log | İkisi de 10/1 FAIL | Fikstür kendi eski AI tekliflerini yok varsayıyor. Önceki özel kayıt kümesi + yalnız iki yeni ID ve eski kayıtların değişmezliği sıkı doğrulanır; C gizliliği/ret kapıları korunur; son 11/0. |
| mp74-accepted.log, mp74-diagnostic2.log, mp75-accepted.log | 5/2, 5/2 ve 4/2 FAIL | Gerçek aday regresyonu: ara çizim kartı geçici UID ile değiştiriyor. card-dom-before 1/1 FAIL aynı DOM düğümünün kaldırıldığını kanıtlar. Kimlikler çizim öncesine taşındı, rebuild içi ara çizim ertelendi. card-dom-after 2/0, MP74 7/0, MP75 6/0. |
| mp8-R-accepted.log | R0–R2 PASS; R3/R4 FAIL | Yeni tarihçe assertion'ı sıfır misafir cephesiyle çalışıyordu. Opsiyonel kabul fikstürü gerçek ilanla misafir savaşı da kurar; zero-coverage assertion korunur. Tam süreç/relay kapanması + yeni oda + kendi haberleri + 6 ay devam son 5/0. |
| history-before.log | Boş özel tarihçe FAIL | Soğuk odada newsBy taşınmıyor. Kendi ledger olaylarından 80 satırla sınırlı, üçüncü tarafı içermeyen projeksiyon eklendi. Son history 3/0 ve gerçek R PASS. |
| save-reg-id-fixed.log | spawnSync git EPERM | Sandbox alt süreç kısıtı. Önceden doğrulanmış kaynak kökleri açık env ile verildi; aynı Save8/RNG testinin save-final-accepted.log sonucu 2/0 PASS. |
| mp74-diagnostic.log | Kesilmiş eksik koşu | Python hazırlık komutunda girinti hatası sonrası başlayan tanısız koşu durduruldu; kabul sonucu sayılmaz. |

final-regression.json dosya adlarındaki “accepted” sözcüğü PASS iddiası değildir: gerçek exit/status değerleri korunmuştur. Son aday follow-up sonuçları ayrı final-followup.json içindedir.
