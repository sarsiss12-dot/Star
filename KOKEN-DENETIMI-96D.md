# Sekiz köken — kaynak ve gerçek başlangıç

Denetim başlangıçta kod değiştirmeden yapıldı. Ham başlangıçlar: `tests/audit96d/origins-before.json`. Tablo kökenin standart başlangıca eklediği/farklılaştırdığı etkilerdir; tür, etik, doktrin, civics ve zorluk ayrıca uygulanır.

| Köken | Gerçek başlangıç | Sonuç |
|---|---|---|
| Standart | Dengeli stok; 12 nüfus, normal ekonomik altyapı, 3 korvet, 1 bilim ve 1 koloni gemisi | Referans korunur; ek köken bonusu yok |
| Antik Kalıntı | +900 araştırma stoku, anavatanda kalıntı yatağı, sistem anomalisi | Etki zaten çalışıyordu; anomali bilim gemisi ister |
| Sıkı Sınırlar | Stoklar ×1,25; 2 kale ve gezegen savunması; iki taraflı −25 ilişki | Simetrik ilişki ve kale savunması doğrulandı |
| Kuşatılmış | Alaşım ×1,40; 2 kale; ek 2 korvet ve 1 muhrip | Üç rakibin çevrelemesi/deneyim garantisi kodda yoktu; vaat düzeltildi. Harita üretimi ve teknoloji kilidi değiştirilmedi |
| Son Umut | 5 nüfus; stok ×0,45; 1 maden/santral/çiftlik/tersane; yalnız erişilebilir kademe1 teknolojiler | grantResearchTech/researchAccess zaten kilitleri koruyor; yeniden teknoloji motoru yazılmadı |
| Altın Çağ | 18 nüfus, gelişmiş yapılar/2 tersane/liman, stok ×1,50, uygun komşuda en çok 2 ek koloni; çift yönlü −30 ilişki | Koloni garantisi kaldırıldı. Gerçek kriz atMonth 120 ay erkene, minimum72; kapalı kriz korunur |
| Gölgeden | Başlangıç temasları çift yönlü kaldırılır, diğer devletlerde istihbarat1 | Sistem/filo görünmezliği yoktur. Açıklama doğru bilgi sınırını anlatır; sonraki temas normal işler |
| Göçebe Filosu | 6 nüfuslu küçük koloni/çıplak temel yapılar; 5 korvet, toplam2 koloni ve2 bilim gemisi; maden×1,15, alaşım×1,60; ikmalsiz yıpranma yarıya | Yok edilmiş gerçek bir başlangıç sistemi/gezegensiz devlet üretilmiyor. Hikâye filonun yeni yurda ulaşmasına uyarlandı |

Mevcut sekiz kart korundu. Seçimde kısa hikâye, oyun tarzı, zorluk, artı/eksi, özel koşul ve gerçek başlangıç dökümü açılır. Oyun içi Devlet paneli köken hikâyesi ve mekanik dökümünü korur. Sekiz bağımsız hikâye sistemi veya ek ekonomik ödül eklenmedi.

15 hedefli test sekiz başlangıcın gerçek stok/pop/yapı/filo/teknoloji/diplomasi/anomali farklarını ve v8 yeniden yüklemeyi içerir. Normal ve büyük galaksi, eksik/eski/geçersiz ID, prototip anahtarı, kapalı kriz ve tür/etik/doktrin kilitleri risk bazlı kapsandı. Altın Çağ'da gerçek crisisTick eşikten bir ay önce durur, eşikte ilk dalgayı yaratır. Tüm kombinasyonlar körlemesine çoğaltılmadı.

İlk geçersiz-ID testinde `__proto__` katalog üyesi sanılıyordu. Object.hasOwn ile düzeltildi; eski tanınmayan kökenli kayıt okunur, geriye dönük bonus üretilmez. İlk hata ve son başarılı kayıtlar audit96d içinde korunur.
