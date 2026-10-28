# STARS — Reddedilmiş AI araştırmaları: karar özeti

Bu belge, 96H.5.1 → 96H.7 arasında denenip **üretime alınmayan** bütün AI adaylarını tek yerde toplar. Buradaki hiçbir yama oyuna otomatik eklenmez. Bir adayı yeniden açmak için yeni faz kararı, önceden ilan edilmiş kabul kapısı ve aynı Save/RNG üzerinde kontrol–aday karşılaştırması gerekir.

Ortak ders: yerel bir göstergede kazanç (tek seed, tek kaynak, tek devlet) genel faydayı kanıtlamadı. Reddedilen her adayda ya başka bir kaynak (gıda, maden, ticaret), ya yeni devlet toparlanması, ya da filo/güç geriledi.

| Aday | Faz | Ne denedi | Neden reddedildi | Yama |
|---|---|---|---|---|
| D1 | 96H.5.1 | Yeni AI devletlerine doktrin atama (minimal) | Kalite kapısı geçilemedi | `research/96h51/D1-REJECTED.patch` |
| D2 | 96H.5.1 | `assignNewAIDoctrine` ile açık doktrin seçimi (Teknokrasi/Kutsal Meclis görünürlüğü) | Kalite kapısı geçilemedi; dağılım/diplomasi davranışını değiştiriyor | `research/96h51/D2-REJECTED.patch` |
| A1 | 96H.6 | `aiRecoveryInvestment` biriktirme sınırı 3 → 6 ay | Hedefte etkisiz | `research/96h6/A1-REJECTED.patch` |
| A2 | 96H.6 | Pozitif gelirle finanse edilen beklemenin üst süre sınırını kaldırma | 240 ayda ticaret koruması %82,29 (<%85); seed11 yeni devlet kritik ay 9→11 | `research/96h6/A2-REJECTED.patch` |
| C1 | 96H.6 | `aiDemolitionChoice` öncelikli ihtiyaç binasını korusun | Hedefte etkisiz | `research/96h6/C1-REJECTED.patch` |
| C2 | 96H.6 / 96H.6.1 | Rezervin altındaki kaynak üretimini normal yıkımla azaltmama | Bağımsız 240 ay seed11 ticaret 204→155 (%75,98 < %85); kalan uzun seed'ler NOT RUN | `research/96h6/C2-REJECTED.patch`, `research/96h61/C2-rejected.patch` |
| AC | 96H.6 | A2 + C2 birleşik | 120 kapısı geçti, uzun ticaret koruması geçmedi | `research/96h6/AC-REJECTED.patch` |
| T1 | 96H.6.1 | Ücretli işlerin seri tamamlanma ayına göre gelir ağırlığı | Seed404 yerel 42→32 iyi, fakat seed11 aktör7 kritik 9→10; yerel güvenlik kapısı FAIL | `research/96h61/T1-rejected.patch` |
| I1 | 96H.6.2 | Seri kuyruk + peşin bedeli aynı stok yolunda karşılaştırma | Seed11 Save217: gıda sıfır ay 0→6, ardışık gıda kritik 0→11 (maden 9→4 iyileşmesi yetmez) | `research/96h62/I1-rejected.patch` |
| F1 | 96H.6.3 | Dizi sonundaki zorunlu üreticinin finansman riskini iki eylemle hesaplama | Aynı Save217 aktör7: maden kritik/sıfır 9/2→17/5, gıda 0/0→12/8 | `research/96h63/F1-rejected.patch` |
| Kapasite (120/160/200 sistem, 13–20 AI) | 96H.6.3 | Büyük galaksi sınırları | 4× CPU stres kapıları aşıldı (aylık karar karesi > 1500 ms, P95 > 33,3 ms); 120/13 son kademe de RET | `research/96h63/CAPACITY-REJECTED.patch` |
| Sefer bekleme (campaign deadline) | 96H.7 | `aiMilitaryCampaign` başarısız-hedef beklemesini dolmadan uzatmama | Kilit gerçekten açıldı, fakat seed11 ay60→84 güç 10323→4990, gemi 81→44, bilim 22→21; gün 2310'da 22 gemi terhis (`aiDisbandTick`) | `research/96h7/campaign-deadline-rejected.patch` |

## Açık kalan gerçek sorunlar (çözülmedi)

- **Sefer bekleme kilidi** (96H.7 §11): `failedTargets` son tarihi her değerlendirmede kayıyor; kilit kendiliğinden bitmiyor. Tek başına açmak sevk bakımı → terhis zincirine yol açıyor. Sonraki dar araştırma önerisi: aynı seed11/ay60 kaydında sefer sevkinin enerji bakımını mevcut `fleetUpkeep` ve `aiDisbandTick` kurallarıyla birlikte değerlendirmek. Bekleme yamasını tek başına yayımlamayın.
- Hedef → eylem → başarı bağı: `contain` kendi toprak artışını, `security` kale sayısını, `recovery` bütçeyi ölçüyor; `prof.exp` / `e.agr` karara bağlı değil.
- Ekonomide kuyruk zamanı ve takip eden üreticinin finansmanı (A2/C2/T1/I1/F1 hattı).
- Seed11/404 geç dönem yeni devlet ekonomisi, seed2026 ticaret kaybı.

## Kabul edilen (red değil)

- 96H.6.1: oyuncu ikili ittifak feshi + ortak AI fesih etkileri (yayımlandı).
- 96H.7.1: kapanmış tek üyeli ortak sefer geçmişinin Save8 yüklemesi (`research/96h63/SAVE8-GUARD-PROPOSED.patch` ile aynı satır). AI karar davranışı değil, yükleme doğrulaması düzeltmesidir; ayrıntı `PROJE-DURUMU.md`.
