# Faz 96E.1 — tür ve fizyoloji denetimi

Kodda 8 RACES arketipi ile 7 PHYSIO fizyolojisi ayrı katmandır. Genetik TRAITS üçüncü katmandır. Bunları 15 yeni tür gibi toplamayın.

| Arketip | Mevcut doğal modifier katkıları (oranlar ondalık) |
|---|---|
| insan — Birleşik Yıldız Cumhuriyeti | `{"araMul": 0.1, "dipMul": 0.35, "etkFlat": 1, "dmgMul": -0.05}` |
| klan — Vorrak Klan Birliği | `{"dmgMul": 0.18, "hullMul": 0.1, "buildMul": 0.25, "dipMul": -0.35, "araMul": -0.08}` |
| suru — Zhal Sürü Zihni | `{"growMul": 0.35, "yiyMul": 0.25, "minMul": 0.1, "colCost": -0.2, "dipMul": -1}` |
| makine — Sentetik Uyum Kolektifi | `{"minMul": 0.3, "alaMul": 0.2, "stab": 25, "growMul": -0.15, "dipMul": -0.8}` |
| meclis — Kutsal Amarant Meclisi | `{"etkFlat": 2.5, "araMul": 0.08, "dipMul": 0.2, "growMul": 0.1, "alaMul": -0.1}` |
| lonca — Kaskad Ticaret Loncası | `{"eneMul": 0.4, "minMul": 0.12, "dipMul": 0.15, "upMul": -0.15, "dmgMul": -0.08}` |
| teknokrasi — Aksiyom Teknokrasisi | `{"araMul": 0.3, "buildMul": 0.12, "etkFlat": -1, "dmgMul": -0.08}` |
| kasif — Ilyari Keşif Sözleşmesi | `{"araMul": 0.35, "spdMul": 0.2, "sensor": 1, "dmgMul": -0.1, "minMul": -0.08}` |

| Fizyoloji | Bildirilen ve ortak motorlarda denetlenen davranış |
|---|---|
| humanoid | Her dünyada idare eder, hiçbirinde zirve yapmaz. |
| lithoid | Her gezegende +%50 yaşanabilirlik · büyüme −%25 · kara zırhı +%20 |
| aquatic | Okyanus/Sulakalan/Tundra: +%20 üretim, +18 yaşanabilirlik · Çöl/Kurak: −35 yaşanabilirlik |
| avian | Filo kaçınma +%10 · koloni gemisi maliyeti −%15 · büyüme +%10 · kara savunması −%15 |
| hive | İstikrar daima yüksek · nüfus büyümesi +%15 · diplomasi −%25 |
| machine | Enerji tüketir · her gezegende yaşar · büyüme −%20 |
| plantoid | Enerjiden pasif yiyecek üretir · soğuk dünyalarda enerji ×2 |

Her arketipin tüm tanımlı modifier değerleri, tekrarlı recalcMods sonrası kalıcılığı ve gerçek gelir/üretim/savaş hesaplarının geçerli sonuç vermesi otomatik denetlendi. Bu, her kombinasyon için ayrı denge kanıtı değildir. Kayaç/kuş garnizon ve istila sonuçları sayısal denetlendi: nötr 32/55; kayaç 38/66; kuş 27/47. Eski garnizon hesabı fizyoloji katsayısını iki kez çarpıyordu; tek uygulama bırakıldı.

Makine AI artık machine, Zhal AI hive fizyolojisiyle doğar. Fizyoloji e katkısı bir kez extra içine girer; growMul, beslenme ve habBonus ayrı mevcut tüketicilerde kullanılır. Kayaç mineral, makine enerji tüketir ve yiyecek üretimi sıfırlanır. Kullanılmayan yiyecek cezası AI'ya ücretsiz genetik puan kazandıramaz.

Okyanus türünde sevilen dünyada gerçek üretim ×1,20 ve yaşanabilirlik +18; kurak dünyada yaşanabilirlik −35 doğrulandı. Eski belirsiz moral/yüzde ifadesi bu gerçek kurala uyarlandı; bedelsiz +20 moral eklenmedi. Kuş açıklaması mevcut koloni gemisi maliyeti −%15 ve büyüme +%10'u açıklar. Fotosentez gerçek yiyecek ihtiyacını azaltır; soğukta enerji bedeli iki kat. Kovan fizyolojisi arketipten bağımsız yüksek istikrar hedefi kullanır; istikrar mevcut aylık toparlanma sınırıyla bu hedefe yaklaşır. Makine arketipinin %60 taban yaşanabilirliği fizyoloji/özelliklerden sonra artabilir; açıklama netleştirildi.

Genetik 28 özelliğin bütün e alanları ortak mods yolunda denetlendi; üretim, büyüme, bakım, hasar, kapasite, diplomasi ve hareket tüketicileri kodda incelendi. Savaş Korosu'nun eksik rofMul tüketicisi gerçek uzay hasarına bağlandı. Öğrenen Sinapslar'ın şok süresi artık normal koloni ve habitatta çalışır. İsimlerdeki “Uzun/Kısa Ömürlü” bu oyunda araştırma modifier'ıdır; yeni lider ömrü sistemi eklenmedi.
