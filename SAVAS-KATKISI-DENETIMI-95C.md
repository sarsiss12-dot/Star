# Savaş katkısı ve paylaşım denetimi — 95C

92A defteri ve 92B/C/D paylaşım motoru korunur. Ortak plan oluşturmak, toplanmak veya hedefe varmak tek başına hasar/fetih katkısı üretmez. Bu olaylar gözlemci ölçümüdür; katkı değildir.

| Gerçek olay | Mevcut kayıt sahibi |
|---|---|
| Gövde hasarı / imha | `battleRound → applyDamage → warLedgerBattle`, gerçek devlet çifti |
| Garnizon ve ordu kaybı | `invasionTick → warLedgerGround`, gerçek saldırgan ve savunan |
| Sistem / ilgili koloni fetih olayı | `captureSystem → warLedgerCapture` |
| Toprak önerisi ve onay | `settlementPreview/Submit/Vote` |
| Oybirliği sonrası gerçek devir | mevcut atomik `settlementApply` |

95C muharebe entegrasyonu ortak filoları başka devletin filosuna dönüştürmez. Bir turda birden çok gerçek aktörün verdiği hasar, kendi cephesinde kayıtlıdır. Hedefli ölçüm: düşmanın gerçek gövde azalması ile üç müttefikin `damageDealt` toplamı sayısal tolerans içinde eşittir; her aktör aynı turda bir kez katkı alır. Ortak savunanın atış payları toplamı birdir. Gerçek imha edilen gemiler de kendi aktörlerine yazılır.

Farklı cephelerdeki ele geçirmeler mevcut varlık kimliğiyle tekilleşir. Kolonili sistem yörüngesi ayrıca toprak puanı almaz. Savaş öncesi geçerli fetih hedeflerinin +4 tercihi ve mevcut kontrolün +2 tercihi korunur. Aynı katkı kayıtlarını yeni ortak planın içine kopyalayıp ikinci kez sayma yoktur.

95C, yeni taslakta katkı/hedef/kontrol puanı eşitse bilinen askerî erişimi olan alıcıyı tercih eder. `settlementReach` en fazla altı kendi kolonisi çıkışından 95A bilinen rotasını değerlendirir. Bu, erişilemeyen yerin otomatik mülkiyet hakkını değiştiren bir veto değildir; açık alıcı seçimi, mevcut teklifler, içerik bağı ve bütün ortakların açık onayı korunur. Önceden onaylanmış tekliflerin atamaları yeni coğrafi tercihle yeniden yazılmaz.

Oybirliği, güncel sahiplik/revizyon, yaşayan ortaklar, son koloni, bekleyen üretim, üçüncü taraf mülkü ve koloninin ayrı devri kontrolleri kaldırılmadı. Ortak sefer veya katkı yüzdesi otomatik toprak devri yapmaz. Oyuncu adına oy veya uygulama kararı verilmez. Barış sonrası 92D gündemi aynı motoru kullanır.

Kontrollü kampanyalarda paylaşım teklifleri ve uygulanan sonuçlar ham JSON'a kaydedilir. Sıfır devir, paylaşımın işlemediğinin kanıtı değildir: uygun toprak, ortaklar, bitmiş cepheler ve oybirliği şartları oluşmamış olabilir. Son regresyondaki 92A/B/C/D paketleri ve 95C'nin gerçek muharebe/otomatik devir yokluğu senaryoları birlikte değerlendirilmelidir.

Kalan sunum sınırı: mevcut kısa savaş raporu çift bazındadır; koalisyon çapında tek birleşik muharebe raporu eklenmedi. Kanonik katkı defteri bütün ilgili çiftlerin gerçek sonuçlarını tutar.
