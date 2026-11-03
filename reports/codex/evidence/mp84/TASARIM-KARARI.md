# MP.8.4 — güvenli kimlik sözleşmesi (öneri, uygulanmadı)

## Mevcut kanıt

- SP `saveGame/loadGame`: `yildiz:save` tek depolama anahtarı, içeriği ham Save8; dosya yüklemesi de ham Save8 kabul eder. Bu depolama adresi farklı oyunlara tekrar kullanılır.
- Save8 `events` yalnız codec alanlarını saklar. `uid` dünya içi sayaçtır. Checkpoint tekrar yüklenince yeni olay aynı uid'yi alabilir. `key`, `born`, payload ve seed iki farklı kayıtta aynı olabilir.
- Tam Save8 SHA-256, bir belgenin içeriğini tanımlar; soy kimliği değildir. Simülasyon ilerleyince değişir. Kopyalanmış bayt-identik iki dosyanın ayrı oyun/fork olup olmadığını tek başına ayıramaz. Hash çarpışması iddia edilmiyor.
- MP paketinin `saveId` alanı ve session oyuncu/devlet eşlemesi var. `restoreSession` saveId'yi korur. Oda kodu ve bağlantı token'ı uygun kimlik değildir; devamda oda değişir, token yenilenir.
- Misafir aynasında global `events` yok; oyuncu yerel numarası 0'dır. Uzak gerçek empireId/oyuncu bilgisi atanma ile gelir. Yerel 0'a göre tercih saklamak oyuncu yalıtımı sağlamaz.
- Misafir kartları `inboxOffers()` ile yeniden kurulur. `S.swiped` yalnız bellek Set'idir; `noteSig` çoğunlukla key kullanır. Bu mekanizmayı doğrulamadan localStorage'a aynen taşımak güvenli değildir. Konsey kartı anahtarı key+target ikilisidir; yeni oylama aynı ikiliyi kullanabilir. Bu fazda bununla doğal yanlış gizleme üretildiği iddia edilmiyor.

## MP.8.5'te kurulabilecek sözleşme

1. SP için Save8'in dışında sürümlü bir kayıt zarfı/sidecar: kriptografik kaynakla oluşturulan opaque `lineageId`, profil/oyuncu kapsamı ve eski Save8 metni. Oyun RNG'si kullanılmaz. Yanlış dosyayla eşleşmeyen payload SHA-256 bağı olmalı; bu bağ kimlik yerine geçmez.
2. İçeri aktarma ve kopyalama/fork davranışı açık olmalı. Kimliği bulunmayan eski Save8 görünür kartlarla açılır; otomatik olarak başka kaydın sidecar'ına bağlanmaz. Yeni soy/fork tercihleri varsayılan olarak sıfırdan başlar.
3. Her olay örneği için yalnız UID/key yerine sidecar'da occurrence kimliği ve sürümlü fingerprint: kind, orijinal aktör, payload'un güvenli kanonik biçimi, doğuş bilgisi. Doğuş bilgisi yeniden çizimdeki `G.day` olmamalı. Eşleştirme belirsizse kart görünür.
4. MP için `(mode, profile, saveId, realEmpireId/playerId)` kapsamı; host/misafir ve aktör değişiminde RAM önbelleğini sıfırla. `mp71` teklifleri için kalıcı teklif ID + tur/şartlar; yeni konsey oylaması için host kaynaklı kalıcı occurrence kimliği gerekir. Üçüncü taraf gizli veri aynaya eklenmez.
5. Arayüz deposu host'a komut, kabul/ret veya simülasyon yazımı yapmaz. Görsel tercih kaybolabilir; karar kaybolamaz. Menü/DI kaydı hiçbir zaman depo yüzünden silinmez. Önce başarılı karar kaydı kontrol edilir, sonra yalnız kart gizlenir.
6. Depo sürümü, kayıt ve satır sayısı/boyut üst sınırı; yalnız tamamlanmış veya artık eşleşmeyen eski tercihleri temizleme. Bozuk JSON, kota, izin, IndexedDB engeli ve silinmiş veri görünür karta döner. Ham HTML/callback/token saklanmaz. Hata kaydı da gizli veri içermez.
7. Serialize/deserialize yan etkileri ve başarısız yükleme rollback'i incelenmeli: sidecar ancak başarılı yüklemeden sonra etkinleşmeli; yanlış/bozuk dosya önceki dünya tercihlerini değiştirmemeli. Save8 ve RNG byte eşdeğerliği ayrı VM kontrolüyle sınanmalı.

Bu sözleşme tam bir uygulama değildir. Yeni kayıt-zarfı/sidecar yaşam döngüsü ve import/export/fork politikası geliştirilmeden eski ham Save8'e sessiz otomatik kalıcılık eklenmesi önerilmez. Save8'e `hidden` ekleme bu fazda yapılmaz; daha küçük kod değişikliği olsa da Save8 baytlarını değiştirir ve kimlik/fork politikasını tek başına çözmez.
