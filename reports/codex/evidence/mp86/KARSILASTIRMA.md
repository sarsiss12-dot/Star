# Aynı Save8, 4× CPU, 120. ay izole deserialize karşılaştırması

Input SHA-256: `ffb42a16abda275b73b459c07918d376aa199925494f09e7a95c9b9d9a3b5202`. 4 AB/BA turu, her kolda 4 yeni context × 12 sıcak yükleme = 48 örnek. Her contextte 2 ısınma yüklemesi. Ortanca/p95 sıralı dizide floor(n×q) indeksidir.

| Tur | Kontrol ortanca/p95 ms | Aday ortanca/p95 ms | Ortanca azalma |
|---|---|---|---|
| 1 | 221.5/456.1 | 55.7/113.1 | 74.9% |
| 2 | 124.1/198.3 | 49.5/83.2 | 60.1% |
| 3 | 215.7/477.0 | 79.2/156.5 | 63.3% |
| 4 | 138.7/268.4 | 62.6/107.5 | 54.9% |

Toplam: 167.7/360.1 → 61.1/109.0 ms. Ortanca azalma 63.6%, p95 azalma 69.7%.

Kontrol ve adayın tüm son serialize SHA-256 ve RNG değerleri eşit. Bu yükleme çekirdeği ölçümüdür; canlı tam mirror/build, FPS veya host ay hesabı kazanımı değildir. 240. ay için geçerli pencere oluşmadı; o ay için yüzde yok.
