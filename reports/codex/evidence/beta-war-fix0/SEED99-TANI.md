# Seed99 ham savaş bayrağı FAIL tanısı

`campaign` ve bağımsız `seed99-diagnosis` koşuları gün3900'de FAIL verdi. Kayıt ve tam alan farkı saklandı: `seed99-diagnosis/100-99-failure.save`, `seed99-asymmetry.json`.

- Devlet5 **dead=true**, eski `war[9]=true` alanı kalmış.
- Devlet9 **dead=false**, `war[5]` yok/false.
- Cephe5 (9→5), gün3660 başlangıç; gün3900 **ended=3900**, `endReason=eliminated|actor:auto`.
- Kanonik `warLedgerPair` yaşayan taraf ister. `knownWarPairs` bu kapıyı kullanır. Yok olmuş devlette kalmış bayrak yeni veya aktif savaş değildir.
- İlk kampanya kontrolü bütün geçmiş devlet nesnelerini simetrik istemişti. Bu, motorun aktif savaş sözleşmesinden daha güçlü ve yanlış bir test varsayımıdır.
- Son kampanya yaşayan tarafların tüm bayraklarını sıkı karşılaştırır; ayrıca ölü tarafı olan aktif ledger cephesini reddeder. Ham asimetriler **silinmez/normalize edilmez**; her örnekte `rawInactiveAsymmetry` olarak korunur. Save8 hash ve RNG karşılaştırması ham değerler üzerindedir.
- Ürün kodu bu farkı gizlemek için değiştirilmedi. İlk iki FAIL kaydı PASS'a çevrilmedi. Bu bulgu kullanıcıdaki beş/yirmi saniyelik vakayı açıklamaz.
