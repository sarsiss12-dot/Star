# STARS MP.7 — Render'da yeniden dağıtım (kullanıcının kendi servisi)

Bu depo hiçbir servise dağıtım yapmaz ve servis adresini kalıcı yapılandırmaya yazmaz. Aşağıdaki `<adres>`, servisin kendi `https://…onrender.com` adresidir.

## Neden gerekli

MP.7 düzeltmeleri relay'de ve istemci dosyalarındadır (parçalı WebSocket mesajı, başlangıç durum makinesi, kurulum ekranı). Render bu dosyaları yeniden derlemeden kullanmaz.

Render varsayılan olarak deponun varsayılan dalını (`main`) dağıtır. `main` şu an yalnız MP.0–MP.4 kodudur; MP.5–MP.7 açık PR'lerdedir (#17 → #24). Aynı çerçeve ayrıştırıcısı `main`'deki relay'de de vardır.

## Adımlar

1. **Settings → Build & Deploy:**
   - **Branch:** `claude/stars-mp7-mobile-setup-start`. PR'ler merge edilirse `main`.
   - **Runtime:** Docker.
   - **Dockerfile Path:** `research/mp1/deploy/Dockerfile`.
   - **Docker Build Context Directory:** depo kökü (`.`).
2. **Environment:**
   - `MP1_ORIGINS=<adres>`: tam köken, sonda `/` yok, yalnız `https://`.
   - `MP1_TRUST_PROXY=1` ve `MP1_BIND=0.0.0.0` imajda var.
   - `MP1_DEV` **verilmez**.
   - `PORT`'u Render kendisi verir.
   - Gizli anahtar gerekmez.
3. **Health Check Path:** `/healthz`.
4. **Manual Deploy → Clear build cache & deploy.** Eski imaj eski istemci dosyalarını sunar.
5. **Doğrulama** (tarayıcıdan ya da bilgisayardan):
   - `<adres>/healthz` → `{"ok":true}`
   - `<adres>/main.js` içinde `const BUILD_ID = '96h10p2';`
   - `<adres>/research/mp7/client/mp7-setup.js` → 200 (MP.7 dosyaları imajda)
   - `node research/mp1/deploy/smoke.js <adres>` → 10 denetim
6. **Telefonlar:** açık STARS sekmelerini kapatıp yeniden açın.
   - Service worker önce ağı dener.
   - Yeni önbellek adı (`stars-v96h10p2`) eski önbelleği siler.
   - Host ile misafir aynı sürümü kullanmalı: ikisi de aynı adresten.

## Bilinen sınırlar

- Relay odaları bellekte tutar. Servis yeniden başlarsa ya da uyursa (ücretsiz planlarda hareketsizlikte) açık odalar kapanır.
- Oyunun kendisi host telefondadır. Host OYUNU KAYDET ile kaydedip yeni odada KAYITLI OYUNA DEVAM ET ile sürdürebilir (MP.4).
- Bu adımların sonucu bu oturumdan doğrulanamadı: ağ politikası Render adresini engelledi. Canlı servis ve fiziksel telefon testi **NOT RUN**.
