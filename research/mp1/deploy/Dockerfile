# STARS MP.1 relay — sağlayıcıdan bağımsız konteyner.
# Derleme (depo kökünden):  docker build -f research/mp1/deploy/Dockerfile -t stars-relay .
# Yalnız 19 runtime dosyası + manifest + MP betikleri kopyalanır; testler, sürüm ZIP'leri,
# araştırma verisi ve hiçbir gizli anahtar imaja girmez. Bağımlılık yok (npm install yok).
FROM node:22-alpine
WORKDIR /app
COPY RELEASE-MANIFEST.json index.html manifest.json sw.js main.js map.js combat.js ui.js ai.js diplomacy.js economy.js \
     commerce.js commerce-ui.js economic-ledger.js economy-ui.js news.js inbox.js construction.js archive-ui.js audio.js ./
COPY research/mp0/mp-core.js research/mp0/mp-core.js
COPY research/mp0/server/dev-relay.js research/mp0/server/dev-relay.js
COPY research/mp1/server/relay.js research/mp1/server/relay.js
COPY research/mp1/client/ research/mp1/client/
COPY research/mp2/client/ research/mp2/client/
COPY research/mp3/client/ research/mp3/client/
COPY research/mp31/client/ research/mp31/client/
COPY research/mp4/client/ research/mp4/client/
# Herkese açık kip: relay TLS'yi önündeki vekilden/platformdan bekler. MP1_ORIGINS
# dağıtımda ZORUNLU verilir (https://oyun-alanı); verilmezse relay başlamayı reddeder.
# PORT: platform kendi değerini verirse o kullanılır (MP1_PORT boş bırakıldı).
ENV NODE_ENV=production MP1_BIND=0.0.0.0 PORT=8080 MP1_TRUST_PROXY=1
USER node
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:${PORT}/healthz || exit 1
CMD ["node","research/mp1/server/relay.js"]
