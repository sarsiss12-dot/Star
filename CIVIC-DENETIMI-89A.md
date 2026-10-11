# 89A — Civic bağlantı denetimi

Katalogda 13 civic var. Aşağıdaki çağrı listesi sabit metinli `hasCivic` çağrılarının statik taramasıdır; bütün etkilerin cihazda ölçüldüğü anlamına gelmez.

| Civic | Anahtar | Flag | Çağrı sayısı |
|---|---|---|---:|
| Bürokratik Verimlilik | `burokrasi` | `slots` | 2 |
| Gen Öncüleri | `gen_oncu` | `seedPop` | 2 |
| Kale Doktrini | `kale_dok` | `fortress` | 6 |
| Sinyal Avcısı | `sinyal_avci` | `scan` | 2 |
| Madencilik Loncaları | `maden_lonca` | `minerguild` | 0 |
| Gölge Konseyi | `golge_kons` | `shadow` | 23 |
| Lojistik Komiserliği | `lojistik_k` | `logistics` | 0 |
| Enkaz Mühendisliği | `enkaz_muh` | `salvage` | 1 |
| Panoptikon | `panoptikon` | `panopt` | 9 |
| Kan Hukuku | `kan_hukuku` | `blood` | 8 |
| Taht Gemisi | `taht_gemi` | `throneship` | 6 |
| Tek Ürün Ekonomisi | `tek_urun` | `mono` | 3 |
| Yıldız Yiyen Ekonomi | `yildiz_yiyen` | `devourer` | 4 |

Katalog dışında kalan 23 flag ve dosya/satırları `tests/civic-audit-89a.json` içindedir. `counter` 7 çağrıda geçiyor, katalogda karşılığı yok. main.js içindeki 77B revizyon notu kaldırılan civic kancalarının false dönmesini açıkça tarif ediyor. Bunları Panoptikon veya Gölge Konseyi üzerine taşımak yeni bir denge kararı olur; yapılmadı. Panoptikonun mevcut karşı istihbarat artışı gerçek `counterIntel` ve `recalcMods` yolunda test edildi.

Fraksiyon denetimi: `facShift` 0–100 sınırında ham istek miktarını logluyordu (98 + 18 → 100 ama log +18). Şimdi log uygulanan +2’yi yazar. Uzlaşı Kültürü cezası ×0,6, mevcut formül korunur; talep ekranı aynı fonksiyonla mevcut moral için tahmin verir. Talebin sona erdiği güne kadar moral değişebilir. Aylık katsayılar ve kaynak üretim formülleri değiştirilmedi.

Açık inceleme: aylık fraksiyon güç paylarının ayrı yuvarlanması toplamı 100 dışında bırakabilir. 89B kampanyasında ölçülecek; bu fazda kalibrasyon yapılmadı.
