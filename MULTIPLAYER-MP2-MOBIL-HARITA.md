# STARS — MP.2 misafir telefon ekranı: harita, filolar, koloniler, bilim

Kod: `research/mp2/client/guest-game.js`, `mp2.css`. Kanıt: `tests/browser-mp2.cjs`, `research/mp2/evidence/`.

Testler mobil dokunmatik Chromium bağlamında, gerçek dokunma olay dizisiyle yapıldı (CDP `Input.dispatchTouchEvent`). **Fiziksel Android cihazda denenmedi (NOT RUN).**

## 1. Ekran düzeni

```
┌──────────────────────────────┐
│ Bağlı · oda XXXX-XXXX        │  ← #jConn (MP.1 bağlantı/duraklatma metni)
│ Devlet adı      Yıl·Ay·gün   │
│ Mineral … Enerji … Alaşım …  │
├──────────────────────────────┤
│                    [+]       │
│   galaksi haritası [−]       │  ← HARİTA: ekranın kalanının tamamı
│   (canvas)         [SIĞDIR]  │
│                    [BAŞKENT] │
│ ┌ seçim paneli ────────────┐ │  ← dikeyde altta, yatayda sağda
│ └──────────────────────────┘ │
├──────────────────────────────┤
│ HARİTA FİLOLAR KOLONİLER BİLİM│  ← her biri ≥50 px yüksek
└──────────────────────────────┘
```

- Varsayılan sekme HARİTA. İlk girişte kamera kendi başkentinde, haritanın tam ortasında (test edildi).
- Sekme değişince seçili sistem/filo ve kamera korunur (test edildi).
- Sayfa yenilenince sekme, kamera ve seçim `sessionStorage`'dan geri gelir; oyun durumu host'tan (test edildi).
- Yatay telefonda üst bilgi tek satıra iner; seçim paneli haritanın sağına geçer, harita geniş kalır.

## 2. Harita

- **Ne çizilir:**
  - bilinen şeritler;
  - bilinen sistemler (adlı; görüş altındaysa parlak, son bilinen durumda soluk);
  - sahiplik halkası: kendi rengin, temas kurulan devletin rengi, temas yoksa gri;
  - keşfedilmemiş sistemler yalnız soluk nokta: MP.0'dan beri paylaşılan kamu koordinatı; ad, sahip ve gezegen yok;
  - kendi filoların (üçgen; yoldaysa host'un bildirdiği ilerlemeyle iki sistem arasında);
  - görünen yabancı filolar (eşkenar dörtgen);
  - seçili filonun rotası (kesikli çizgi);
  - bekleyen hedef (sarı halka).
- **Kontroller:**
  - tek parmakla sürükle: kaydır;
  - iki parmakla: yakınlaştır/uzaklaştır (sınırlı aralık);
  - kısa dokunuş: sistem/filo seç (filo işareti 16 px, sistem 24 px yarıçap);
  - **+ / −**, **SIĞDIR** (bütün galaksi), **BAŞKENT**;
  - masaüstünde tekerlek.
- **Çizim maliyeti:** yalnız veri ya da kamera değişince tek kare (`requestAnimationFrame`), sürekli döngü yok.

  | Galaksi | Bir kare |
  |---|---|
  | 45 sistem | ~0,1 ms (780×1404 piksel tuval) |
  | 60 sistem | ~0,2 ms |
  | 100 sistem | ~0,2 ms |

  Başsız Chromium'da ölçüldü; yazılım tuvali, GPU kapalı.

## 3. Filo emri (yanlış dokunmaya karşı iki adım)

1. Haritada kendi filona dokun ya da FİLOLAR → **HARİTADA**.
2. Seçim panelinde **HEDEF SEÇ**. Üstte "Hedef sistemi seç" şeridi çıkar.
3. Haritada bir sisteme dokun. Şerit "**Filo → Sistem gönderilsin mi?** [GÖNDER] [İPTAL]" olur.
   - Boş alana dokunmak hiçbir şey yapmaz.
   - İPTAL hiçbir komut göndermez (test edildi: komut sayısı ve host Save8 değişmedi).
4. **GÖNDER** → `move` komutu → host `orderMove`. Sonuç bildirimi:
   - kabul: "Emir uygulandı · N ms";
   - motor kuralı: "Rota kapalı: yabancı bölgeden geçiş izni gerekli.", "Bu sisteme ulaşan yol yok.", "Bu filo senin değil ya da artık yok.";
   - "Oyun duraklatıldı; komut uygulanmadı."
5. Rota kesik çizgiyle görünür. Filo paneli YOLDA, hedef ve güç gösterir; host zamanı ilerledikçe filo harita üzerinde ilerler ve hedefte durur (testte 15 oyun günü).

Filo paneli:

- ad, durum (`fleetStatus`: BEKLİYOR, YOLDA, TARIYOR…);
- bulunduğu sistem ya da hareket bacağı, hedef;
- güç (`fleetPower`), otomatik keşif;
- gemi türleri ve sayıları.

**Kapsam dışı (MP.3+):** birleştirme, bölme, sevkiyat, savaş emirleri, otomatik keşif aç/kapa, koloni gemisiyle yerleşim emri.

## 4. Bilim ekranı

- Araştırma geliri; üç dal (FİZİK / TOPLUM / MÜHENDİSLİK) için aktif teknoloji, ilerleme çubuğu, `ilerleme / maliyet` ve yüzde.
- **Araştırma kipi:** Yarı otomatik / Elle / Otomatik (`setResearchMode`).
- **Hedefler:** sıra numarası, ek ön koşul sayısı, rota hatası; **▲** ile öne al (`move`), **✕** ile çıkar.
- **Teknoloji listesi:** dal sekmeli, kademe ve maliyet sıralı. Her satırda durum:
  - Tamamlandı;
  - Araştırılabilir;
  - Ön koşul gerekli (hedef seçilebilir; motor ön koşul rotasını plana ekler);
  - Erişim yok.
- Satıra dokununca:
  - açıklama;
  - ön koşullar (✓ tamamlananlar);
  - erişim nedeni (örn. "Erişim koşulu: …");
  - **HEDEFE EKLE / HEDEFTEN ÇIKAR.** Erişilemeyen teknolojide düğme pasif; zorla gönderilirse host `access` ile reddeder (test edildi).
- Teknoloji tamamlanınca bildirim misafirin kendi listesine düşer, host günlüğüne düşmez.

## 5. Koloniler

MP.1'deki inşa ekranı KOLONİLER sekmesine taşındı:

- koloni başına nüfus, yer, binalar ve kuyruk;
- bina seçimi ve **İNŞA ET**.

MP.1 ve MP.1.1 tarayıcı testleri inşa adımından önce bu sekmeye geçiyor (bkz. SONUÇ §4).

## 6. Mobil sonuçlar (`browser-mp2.cjs`)

| Görünüm | HARİTA | FİLOLAR | KOLONİLER | BİLİM |
|---|---|---|---|---|
| 360×800, 390×844, 412×915 | harita ≥ ekranın %55'i, taşma yok | taşma yok | taşma yok | taşma yok |
| 844×390, 915×412 | harita tam genişlik | taşma yok | taşma yok | taşma yok |

- Her görünümde ve her sekmede bütün düğme ve seçimler ≥ 44 px, en küçük yazı ≥ 11 px.
- Android geri tuşu oyunda "Ayrıl / Kal" sorar (MP.1 davranışı, test edildi).
- Ekranda klavye açan alan yok; oda kodu ve ad girişi MP.1'de test edildi.
