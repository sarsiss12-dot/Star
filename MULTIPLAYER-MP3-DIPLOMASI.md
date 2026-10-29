# STARS — MP.3 diplomasi ekranı: teklif, kabul, ret, karşı teklif, barış

Kod: `research/mp3/client/dip-ui.js`, `mp3.css`. Kanıt: `tests/browser-mp3.cjs`, `research/mp3/evidence/`.

Testler mobil dokunmatik Chromium bağlamında yapıldı: gerçek dokunma olayları ve klavye. **Fiziksel Android cihazda denenmedi (NOT RUN).**

## 1. Yerleşim (misafir: DİPLOMASİ sekmesi)

```
┌──────────────────────────────────────┐
│ Bağlı · oda XXXX-XXXX                │
│ Devlet adı      Yıl·Ay·gün           │
│ Mineral … Enerji … Alaşım … Etki …   │
├──────────────────────────────────────┤
│ [DEVLETLER][GELEN ②][GÖNDERİLEN][GEÇMİŞ] │  ← yapışkan alt sekmeler, ≥44 px
│ ┌ teklif kartı ───────────────────┐  │
│ │ ← Gönderen       Bekliyor       │  │
│ │ #12 · tur 2 · önceki #9 · 37 gün│  │
│ │ Sana verilecek | Senden istenen │  │
│ │ Etki maliyeti (gönderen öder)   │  │
│ │ [KABUL ET] [REDDET]             │  │
│ │ [KARŞI TEKLİF]                  │  │
│ └─────────────────────────────────┘  │
├──────────────────────────────────────┤
│ HARİTA FİLOLAR KOLONİLER BİLİM DİPLOMASİ② │
└──────────────────────────────────────┘
```

- **Rozet:** bekleyen gelen teklif sayısı. Hem alt gezintide hem GELEN'de görünür.
- **DEVLETLER:** karşılıklı temas kurulmuş devletler.
  - İNSAN / AI etiketi, SAVAŞTA / Barış, ilişki.
  - Doktrin anlaşmayı yasaklıyorsa uyarı ve TEKLİF HAZIRLA kapalı.
  - **TEKLİF HAZIRLA**; savaştaysa **BARIŞ ÖNER** (barış mümkün değilse kapalı ve nedeni yazılı).
- **GELEN:** sana gelen bekleyen teklifler. KABUL ET, REDDET, KARŞI TEKLİF. Tur sınırında karşı teklif yerine uyarı çıkar.
- **GÖNDERİLEN:** bekleyen tekliflerin. GERİ ÇEK.
- **GEÇMİŞ:** sonuçlanan teklifler (kabul, ret, karşı teklif verildi, süresi doldu, geçersiz) ve gerekçesi.
- **Host bağlı değilken:** üstte "Host bağlı değil: diplomasi işlemleri gönderilmez" yazar ve bütün işlem düğmeleri kapanır. Komut gönderilmez (test edildi).

## 2. Teklif hazırlama

1. **BEN VERİYORUM** ya da **BEN İSTİYORUM** bölümünü seç (etkin bölüm çerçeveli).
2. Kaynak seç. Verirken her seçenekte stoğun yazar ("Mineral (sende 2312)").
3. Miktar: hazır düğmeler **100 / 250 / 500 / 1000 / MAKS** ya da elle giriş.
   - Elle giriş `inputmode="numeric"`; yalnız rakam kabul edilir, en fazla 8 hane, 16 px yazı (girişte sayfa yakınlaşmaz).
   - **MAKS yalnız verirken çalışır** ve gerçek stoğundan büyük olamaz. Stoktan büyük hazır düğmeler kapalıdır.
   - İsterken MAKS kapalıdır, çünkü karşı tarafın stoğu sana gönderilmez.
4. **EKLE.** Aynı kaynak iki kez eklenirse toplanır; ✕ ile çıkarılır. Savaştaysan **BARIŞ MADDESİ EKLE** görünür.
5. **ÖNİZLE.** Host'un `dealQuote`'u şunları döndürür:
   - Etki maliyeti (gönderen öder) ve senin Etki'n;
   - geçerlilik (540 oyun günü);
   - engeller ya da "Engel yok".
6. **GÖNDER** yalnız güncel ve engelsiz önizlemeden sonra açılır. Madde değişirse yeniden önizleme gerekir.

Sonuç bildirimi:

- insana: "Teklif gönderildi";
- AI'ya: "… kabul etti — anlaşma uygulandı", "… reddetti" ya da "… karşı teklif verdi (GELEN)".

**Karşı teklif:** KARŞI TEKLİF, taslağı ters çevrilmiş şartlarla açar (onun istediği → senin verdiğin). Başlık "KARŞI TEKLİF — tur n/6" olur. Kaynak ve barış dışındaki maddeler (ör. AI'nın ticaret paktı) taşınmaz ve bu söylenir.

## 3. Yanlış dokunmaya karşı

- **KABUL ET / REDDET / GERİ ÇEK** onay penceresi açar.
  - Pencerede şartlar yeniden gösterilir.
  - **EVET** düğmesi ilk 450 ms kapalıdır; çift dokunuş onayı geçemez (test edildi).
- Pencere arka plana dokununca kapanır.
  - Kapanıştan sonraki 400 ms içindeki dokunuşlar yok sayılır. Alttaki KABUL düğmesine "hayalet" dokunuş geçmez.
  - Test: arka plana alttaki düğmenin konumundan dokunuldu, hemen ardından aynı noktaya bir dokunuş daha yapıldı. Hiç komut gitmedi, teklif bekliyor kaldı.
- Bildirimler (`toast`) dokunuşu yutmaz (`pointer-events:none`).
- **Klavye:** miktar alanına odaklanınca alan ekranın ortasına kaydırılır. `visualViewport` küçülünce yeniden kaydırılır. Chromium yazılım klavyesi açmadığı için klavye, görünür alanı %55'e küçülterek benzetildi. Beş görünümün hepsinde alan görünür ve odakta kaldı.

## 4. Host paneli

- Oyun içi küçük ÇOK OYUNCULU panelinde **DİPLOMASİ** düğmesi, rozetinde bekleyen gelen teklif sayısıyla.
- Tam ekran "ÇOK OYUNCULU DİPLOMASİ" panelinde aynı ekran (DEVLETLER / GELEN / GÖNDERİLEN / GEÇMİŞ) yalnız insan oyuncularla açılır.
  - AI devletleri listelenmez; host onlarla tek oyunculu DİPLOMASİ ekranını kullanır (aynı motor).
  - Komutlar `host.local()` ile misafirle aynı denetimlerden geçer.
- Host'a ait bildirimler host'un günlüğüne (`say`) ve panelde bildirim olarak düşer.

## 5. Mobil sonuçlar (`browser-mp3.cjs`)

| Görünüm | DEVLETLER | GELEN | GÖNDERİLEN | GEÇMİŞ | taslak | onay penceresi | klavye benzetimi |
|---|---|---|---|---|---|---|---|
| 360×800, 390×844, 412×915 | taşma yok | taşma yok | taşma yok | taşma yok | taşma yok | taşma yok | alan görünür |
| 844×390, 915×412 | taşma yok | taşma yok | taşma yok | taşma yok | taşma yok | taşma yok | alan görünür |

- Her görünümde bütün düğme, seçim ve girişler ≥ 44×44 px; en küçük yazı ≥ 11 px.
- Alt gezintide beş sekme 360 px'e sığıyor (12 px yazı).
- Host paneli 915×412'de aynı ölçütlerle geçti.
- Uzun devlet adları ve uzun madde listeleri satır kırarak okunuyor (`overflow-wrap:anywhere`). 380 px altında "verilecek / istenen" sütunları alt alta iner.
