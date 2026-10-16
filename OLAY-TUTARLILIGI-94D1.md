# Faz 94D.1 — sınır olayı tutarlılığı

## Kanıt

94D `borderFriction()` yalnız coğrafi temas süresi 10 ayı geçince %6 olasılıkla oyuncuya sınır devriyesi/ihlali metni üretiyordu. Gerçek askerî ihlal, devriye filosu, talep veya saldırı kontrolü yoktu. Temasın kendisi ayrıca aylık ilişki aşınması yaratıyordu. `memoryTick()` uzun komşuluğu rastgele “sınırında asker yığıyor” hafızasına çevirebiliyor, yalnız temas süresi bir savaş gerekçesi olabiliyordu.

İzole tekrarda sıfır filo ve enjekte edilen gerçekçi sınır-temas girdisiyle 94D ilişkisi -30 → -31,05, kart türü `border`; 94D.1 -30 → -30, kart yok. Olay şansı testte sıfıra sabitlenmiştir; bu kampanya istatistiği değil, koşul izolasyonudur. Ham önce/sonra `tests/audit-94d1/before.json` ve `after.json`.

## Sınırlı düzeltme

- Rastgele olay ve rastgele AI tırmandırma kolu kaldırıldı.
- Salt komşuluğa dayanan ilişki aşınması ve asker yığınağı hafızası kaldırıldı.
- Yalnız 18 aylık sınır temasını “Sınır Anlaşmazlığı” yapan casus belli kolu kaldırıldı.
- `G.friction` coğrafi temas sayacı olarak ve eski kayıt referansları için korunur. Sayaç, gerçek kin/hafızaya eşlik eden mevcut değerlendirmelerde hâlâ kullanılabilir; kendi başına ihlal değildir.
- Gerçek fetih, sabotaj, komplo, yaptırım, toprak/yaşam alanı talebi ve diğer somut eylem yolları korunur. Yeni sınır ihtilafı sistemi veya sınır polisi eklenmedi.

## Eski kayıtlar

`border` codec'i ve zararsız eski açma rotası tutuldu. Eski kart açılınca olayın kaldırıldığı açıklanır; geri çekilme/etki kazanma/antlaşma seçenekleri ve bunların kaynak/ilişki etkileri artık yoktur. Eski `treaty` alanları, ilişki değerleri ve ortak `sinirGergin` hafıza türü silinmez. Bu hafıza başka gerçek operasyonlarda da kullanıldığı için geçmişin kaynağını uydurarak toplu temizlemek güvenli değildir.

Rastgele komşuluk çağrıları kaldırıldığından aynı tohumun **94D ve 94D.1** kampanyaları zamanla farklılaşır. Bu fazlar arası birebir sonuç garantisi değildir; aynı 94D.1 kaydının deterministik devamı ve RNG korunumu regresyonla denetlenir. Yeni ücretsiz kaynak/gemi verilmedi.
