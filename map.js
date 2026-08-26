/* ═══════════════════════════════════════════════════════════════════
   YILDIZ HANEDANI — map.js
   FAZ 74: harita ve görsel katman.

   İÇERİK: View nesnesi (kamera, frustum, harita çizimi, sistem/
   filo/rota render'ı, harita modları, ping) ve ART (prosedürel
   sprite üreteci: gezegen, yıldız, gemi, portre, bulutsu).

   BAĞIMLILIK: main.js'teki veri tabloları ve G. index.html'de
   main.js'ten SONRA, ui.js'ten ÖNCE yüklenir (UI, View'i çağırır).
   ═══════════════════════════════════════════════════════════════════ */

const ART = (() => {
  const cache = new Map();
  function cv(w,h){
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    return {c,g};
  }
  function hex(h){
    h = h.replace('#','');
    return [parseInt(h.substr(0,2),16), parseInt(h.substr(2,2),16), parseInt(h.substr(4,2),16)];
  }
  function shade(rgb, m){
    return [clamp(rgb[0]*m,0,255)|0, clamp(rgb[1]*m,0,255)|0, clamp(rgb[2]*m,0,255)|0];
  }
  function mix(a,b,t){ return [lerp(a[0],b[0],t)|0, lerp(a[1],b[1],t)|0, lerp(a[2],b[2],t)|0]; }

  /* yüzey renk şemaları (ana palete ek) */
  const SURF = {
    oky:['#1d5c33','#2f8348','#63ad6b'], tro:['#6d4f27','#9b7638','#c2a25e'],
    sav:['#2f5a86','#3f7fb0','#6aa8cf'], sul:['#1e3f5e','#2f6d8f','#57a0b8'],
    gay:['#154f8a','#2a7cc0','#6cc0e8'], col:['#8a6a34','#d8b06a','#f0dcae'],
    kur:['#5f3f2b','#a06a42','#d0a375'], tun:['#2a3b2c','#3f5a42','#617f60'],
    kut:['#e9f6ff','#ffffff','#cfe6f5'], alp:['#3a4a44','#56705f','#88a78f'],
    mak:['#6ff2c8','#3fb894','#a8ffe6']
  };

  /* --------------------------------------------------------------
     GEZEGEN — küresel gölgelendirme + türe özgü yüzey
     -------------------------------------------------------------- */
  function planet(type, seed, R){
    R = R || 26;
    const key = 'p'+type+'_'+seed+'_'+R;
    if (cache.has(key)) return cache.get(key);
    const def = PLANETS[type] || PLANETS.cor;
    const pal = def.pal.map(hex);
    const sur = (SURF[type]||['#555','#777','#999']).map(hex);
    const {c,g} = cv(R,R);
    const img = g.createImageData(R,R);
    const D = img.data;
    const cx = (R-1)/2, cy = (R-1)/2, rad = R/2 - .5;
    const lx = -.52, ly = -.55, lz = .66;       // ışık yönü
    const S = seed*7919 % 100000;
    const isBelt = def.f === 'belt';

    for (let y=0;y<R;y++) for (let x=0;x<R;x++){
      const i = (y*R+x)*4;
      const ux = (x-cx)/rad, uy = (y-cy)/rad;
      const d2 = ux*ux + uy*uy;

      if (isBelt){
        // asteroit kuşağı: elips üzerine dağılmış kayalar
        const ey = uy*2.6;
        const rr = Math.sqrt(ux*ux + ey*ey);
        const nz = hash2(x*3, y*3, S);
        if (rr > .55 && rr < 1.02 && nz > .62){
          const lum = .45 + nz*.75;
          const col = shade(pal[2 + ((nz*3)|0) % 3], lum);
          D[i]=col[0]; D[i+1]=col[1]; D[i+2]=col[2]; D[i+3]=255;
        }
        continue;
      }

      if (d2 > 1){ continue; }
      const nz = Math.sqrt(Math.max(0, 1-d2));
      let lum = ux*lx + uy*ly + nz*lz;          // -1..1
      lum = clamp(lum*.9 + .34, 0, 1.25);

      // küre üzerine sözde-küresel doku eşlemesi
      const sx = ux/(nz*.55+.5), sy = uy/(nz*.55+.5);
      let col;

      switch(def.f){
        case 'ocean': {
          const n = fbm(sx*2.6+S*.01, sy*2.6, S, 4);
          if (n > .52){
            const t = clamp((n-.52)/.30, 0, 1);
            col = mix(sur[0], sur[2], t);
            if (n > .74) col = mix(col, pal[4], .35);
          } else {
            const t = clamp(n/.52, 0, 1);
            col = mix(pal[0], pal[2], t);
            if (nz > .82 && n < .3) col = mix(col, [255,255,255], .16); // yansıma
          }
          const ice = Math.abs(uy);
          if (ice > .74) col = mix(col, [235,248,255], clamp((ice-.74)/.24,0,.9));
          break;
        }
        case 'land': {
          const n = fbm(sx*3.4, sy*3.4, S, 4)*.7 + fbm(sx*9, sy*9, S+11, 2)*.3;
          const idx = clamp(Math.floor(n*4.6), 0, 4);
          col = pal[idx];
          if (n > .66) col = mix(col, sur[2], .35);
          break;
        }
        case 'ice': {
          const n = fbm(sx*3.0, sy*3.0, S, 4);
          col = mix(pal[1], pal[3], clamp(n*1.5-.15,0,1));
          const ice = Math.abs(uy);
          if (ice > .52) col = mix(col, hex('#f3fbff'), clamp((ice-.52)/.38,0,.92));
          if (n > .70) col = mix(col, sur[0], .30);
          break;
        }
        case 'city': {
          const n = fbm(sx*4, sy*4, S, 3);
          col = mix(pal[1], pal[3], clamp(n*1.4,0,1));
          const grid = (Math.abs((sx*13)%1-.5)<.09 || Math.abs((sy*13)%1-.5)<.09);
          if (grid && n>.42){
            const night = clamp(1-lum*1.35, 0, 1);
            col = mix(col, sur[0], .30 + night*.62);
          }
          break;
        }
        case 'crater': {
          let n = fbm(sx*3.2, sy*3.2, S, 3);
          for (let k=0;k<5;k++){
            const ox = (hash2(k,1,S)-.5)*1.5, oy = (hash2(k,2,S)-.5)*1.5;
            const cr = .12 + hash2(k,3,S)*.24;
            const dd = Math.hypot(sx-ox, sy-oy);
            if (dd < cr) n += (1 - dd/cr) * (dd < cr*.62 ? -.30 : .26);
          }
          col = pal[clamp(Math.floor(n*4.8),0,4)];
          break;
        }
        case 'lava': {
          const n = fbm(sx*3.4, sy*3.4, S, 4);
          const crack = Math.abs(fbm(sx*5.5, sy*5.5, S+31, 3) - .5);
          col = mix(pal[0], pal[2], clamp(n*1.3,0,1));
          if (crack < .055){
            const hot = 1 - crack/.055;
            col = mix(col, pal[4], .35 + hot*.62);
            D[i]=col[0]; D[i+1]=col[1]; D[i+2]=col[2]; D[i+3]=255;  // ışık saçar
            continue;
          }
          break;
        }
        case 'bands': {
          const warp = fbm(sx*1.5, sy*5.0, S, 3)*.22;
          const b = (sy + warp)*3.6;
          const n = (Math.sin(b*3.0)*.5+.5)*.6 + fbm(sx*1.2, sy*7, S+7, 3)*.4;
          col = pal[clamp(Math.floor(n*4.8),0,4)];
          // büyük fırtına
          const sxo = sx - .34, syo = (sy + .18)*2.1;
          const sd = Math.hypot(sxo, syo);
          if (sd < .30) col = mix(col, pal[4], clamp(1-sd/.30,0,1)*.85);
          break;
        }
        default: col = pal[2];
      }

      col = shade(col, lum);
      // kenar atmosfer parıltısı
      if (def.k === 'hab' && d2 > .80){
        const rim = clamp((Math.sqrt(d2)-.895)/.105, 0, 1);
        col = mix(col, hex('#9fd8ff'), rim*.42);
      }
      D[i]=col[0]; D[i+1]=col[1]; D[i+2]=col[2]; D[i+3]=255;
    }
    g.putImageData(img,0,0);

    // gaz devlerine halka
    if (def.k === 'gaz' && (seed % 3 === 0)){
      g.save();
      g.translate(R/2, R/2); g.scale(1, .28); g.rotate(-.24);
      g.strokeStyle = 'rgba(230,215,185,.55)'; g.lineWidth = 1.1;
      g.beginPath(); g.arc(0,0,R*.62,0,Math.PI*2); g.stroke();
      g.strokeStyle = 'rgba(230,215,185,.28)';
      g.beginPath(); g.arc(0,0,R*.74,0,Math.PI*2); g.stroke();
      g.restore();
    }
    cache.set(key,c);
    return c;
  }

  /* --------------------------------------------------------------
     YILDIZ — çekirdek + halo
     -------------------------------------------------------------- */
  function star(colr, r){
    const key = 's'+colr+'_'+r;
    if (cache.has(key)) return cache.get(key);
    const R = Math.ceil(r*6)*2;
    const {c,g} = cv(R,R);
    const m = R/2;
    const gr = g.createRadialGradient(m,m,0,m,m,m);
    gr.addColorStop(0, colr);
    gr.addColorStop(.14, colr);
    gr.addColorStop(.30, colr+'aa');
    gr.addColorStop(.62, colr+'33');
    gr.addColorStop(1, colr+'00');
    g.fillStyle = gr;
    g.beginPath(); g.arc(m,m,m,0,Math.PI*2); g.fill();
    g.fillStyle = '#fff';
    g.globalAlpha = .85;
    g.beginPath(); g.arc(m,m,Math.max(1,r*.5),0,Math.PI*2); g.fill();
    cache.set(key,c);
    return c;
  }

  /* --------------------------------------------------------------
     GEMİLER — piksel şablonları
     -------------------------------------------------------------- */
  const ART_MAP = {
    kor:['..#..','.#C#.','.#W#.','#CCC#','#C#C#','.E.E.'],
    muh:['...#...','..#C#..','..#W#..','.#CCC#.','.#CCC#.','#CC#CC#','#C#.#C#','#E#.#E#','.E...E.'],
    kru:['....#....','...#C#...','...#W#...','..#CCC#..','..#CCC#..','.#CC#CC#.','.#CCCCC#.','#CC#C#CC#','#C#...#C#','#E#...#E#','.E#...#E.','..E...E..'],
    zir:['.....#.....','....#C#....','....#W#....','...#CCC#...','...#CCC#...','..#CC#CC#..','..#CCCCC#..','.#CC#C#CC#.','.#CCCCCCC#.','#CC#CCC#CC#','#C#CCCCC#C#','#C#.#C#.#C#','#E#.#E#.#E#','.E..#E#..E.','.....E.....'],
    bil:['..###..','.#WWW#.','.#WWW#.','..#C#..','.#CCC#.','#CCCCC#','#C###C#','.#...#.','..E.E..'],
    kol:['..###..','.#CCC#.','#CWWWC#','#CCCCC#','#C###C#','#CCCCC#','#C#.#C#','#CCCCC#','.#E.E#.','..E.E..']
  };
  function ship(cls, colr, scale){
    scale = scale || 1;
    const key = 'v'+cls+'_'+colr+'_'+scale;
    if (cache.has(key)) return cache.get(key);
    const art = ART_MAP[cls] || ART_MAP.kor;
    const w = art[0].length, h = art.length;
    const {c,g} = cv(w*scale, h*scale);
    const base = hex(colr);
    const dark = '#0a1120';
    const light = 'rgb('+shade(base,1.45).join(',')+')';
    const mid   = 'rgb('+base.join(',')+')';
    for (let y=0;y<h;y++) for (let x=0;x<w;x++){
      const ch = art[y][x];
      if (ch === '.') continue;
      g.fillStyle = ch==='#' ? dark : ch==='C' ? mid : ch==='L' ? light :
                    ch==='W' ? '#bfeaff' : '#ffb45a';
      g.fillRect(x*scale, y*scale, scale, scale);
    }
    cache.set(key,c);
    return c;
  }

  /* --------------------------------------------------------------
     ARMA — ırka özgü geometrik mühür
     -------------------------------------------------------------- */
  function emblem(seedStr, colr, R, style){
    R = R || 22;
    style = style || 'simetrik';
    const key = 'e'+seedStr+'_'+colr+'_'+R+'_'+style;
    if (cache.has(key)) return cache.get(key);
    let s = 0; for (let i=0;i<seedStr.length;i++) s = (s*31 + seedStr.charCodeAt(i))|0;
    const rnd = mulberry32(Math.abs(s)+1);
    const {c,g} = cv(R,R);
    const N = 11, px = R/N, half = Math.ceil(N/2);
    const base = hex(colr);
    const grid = [];
    for (let y=0;y<N;y++){ grid[y]=[]; for (let x=0;x<half;x++) grid[y][x] = rnd() < (y>1&&y<N-2?.55:.34); }
    const mid = (N-1)/2;
    for (let y=0;y<N;y++) for (let x=0;x<N;x++){
      let v = grid[y][x<half ? x : N-1-x];
      if (style === 'dikey'){
        // dar ve uzun sancak: kenar sütunları boşalt
        if (x < 2 || x > N-3) v = false;
        if (y > N-2) v = false;
      } else if (style === 'dairesel'){
        const d = Math.hypot(x-mid, y-mid);
        if (d > mid*.98) v = false;
        else if (d < mid*.30) v = true;
      } else if (style === 'keskin'){
        // köşeli: eşkenar dörtgen maskesi
        if (Math.abs(x-mid) + Math.abs(y-mid) > mid*1.12) v = false;
        if (y === Math.round(mid)) v = true;
      }
      if (!v) continue;
      const m = .62 + (y/N)*.72;
      g.fillStyle = 'rgb('+shade(base,m).join(',')+')';
      g.fillRect(Math.round(x*px), Math.round(y*px), Math.ceil(px), Math.ceil(px));
    }
    cache.set(key,c);
    return c;
  }

  /* --------------------------------------------------------------
     PORTRE — tür siluetleri (16-bit)
     -------------------------------------------------------------- */
  const PORTRAIT = {
    humanoid:['....####....','...######...','..##WW##W#..','..########..','...##..##...','....####....','..###..###..','.##..##..##.','.#...##...#.','.....##.....','....#..#....','...##..##...'],
    bocek   :['..#......#..','...#....#...','..W#....#W..','..###..###..','.##########.','##..####..##','#.##....##.#','..##....##..','.#..####..#.','#..######..#','..#..##..#..','.#.#....#.#.'],
    surungen:['...######...','..##WWWW##..','.###....###.','.##..##..##.','.##########.','..########..','...######...','..##....##..','.#..####..#.','#..######..#','..##....##..','.#........#.'],
    kristal :['.....##.....','....####....','...##WW##...','..##W..W##..','.####..####.','##...##...##','.####..####.','..##....##..','...######...','....####....','.....##.....','......#.....'],
    makine  :['.##########.','.#WW####WW#.','.##########.','.#.######.#.','.##########.','..#.####.#..','.##########.','.#..####..#.','.##########.','.#.#....#.#.','.#.#....#.#.','.###....###.'],
    amorf   :['...######...','..########..','.##W####W##.','.##########.','##########.#','.##########.','..########..','.#########..','..#######...','...######...','....####....','.....##.....'],
    kanatli :['#..######..#','##.##WW##.##','.####..####.','..########..','#.########.#','##..####..##','.#..####..#.','....####....','...##..##...','..##....##..','.##......##.','.#........#.'],
    akuatik :['....####....','...##WW##...','..########..','.##..##..##.','.##########.','..##..##..#.','.####..####.','#..######..#','.#.######.#.','..##....##..','.#..#..#..#.','#...#..#...#']
  };
  function portrait(type, colr, scale){
    scale = scale || 3;
    const key = 'q'+type+'_'+colr+'_'+scale;
    if (cache.has(key)) return cache.get(key);
    const art = PORTRAIT[type] || PORTRAIT.humanoid;
    const w = art[0].length, h = art.length;
    const {c,g} = cv(w*scale, h*scale);
    const base = hex(colr);
    for (let y=0;y<h;y++) for (let x=0;x<w;x++){
      const ch = art[y][x];
      if (ch === '.') continue;
      if (ch === 'W'){ g.fillStyle = '#bfeaff'; }
      else {
        const m = .55 + (1 - y/h) * .75;
        g.fillStyle = 'rgb('+shade(base,m).join(',')+')';
      }
      g.fillRect(x*scale, y*scale, scale, scale);
    }
    cache.set(key,c);
    return c;
  }

  /* ═══════════════════════════════════════════════════════════════
     FAZ 31 — PİKSEL SANAT MOTORU
     Hiçbir görsel dosya yok. Her sembol 16×16 sayısal matris;
     0 = boş, 1 = ana renk, 2 = vurgu, 3 = üçüncü ton.
     Çizim tek geçişli fillRect — modal açılışında bir kez.
     ═══════════════════════════════════════════════════════════════ */
  const PIXEL_ART = {
    /* AJAN İNFAZ EDİLDİ — kurukafa */
    infaz: {
      c: ['', '#c8ccd8', '#ff5f6d', '#6a7285'],
      m: [
        [0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0],
        [0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0],
        [0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
        [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
        [0,1,1,2,2,2,1,1,1,1,2,2,2,1,1,0],
        [0,1,1,2,2,2,1,1,1,1,2,2,2,1,1,0],
        [0,1,1,2,2,2,1,1,1,1,2,2,2,1,1,0],
        [0,1,1,1,1,1,1,3,3,1,1,1,1,1,1,0],
        [0,1,1,1,1,1,1,3,3,1,1,1,1,1,1,0],
        [0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
        [0,0,1,1,3,1,3,1,3,1,3,1,1,1,0,0],
        [0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0],
        [0,0,0,0,1,3,1,3,1,3,1,1,0,0,0,0],
        [0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0],
        [0,0,0,0,0,2,2,0,0,2,2,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
      ]
    },
    /* TEKNOLOJİ ÇALINDI — veri çipi */
    veri: {
      c: ['', '#6ff2c8', '#8b7bff', '#0d3b34'],
      m: [
        [0,0,2,0,0,2,0,0,0,0,2,0,0,2,0,0],
        [0,0,2,0,0,2,0,0,0,0,2,0,0,2,0,0],
        [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
        [0,1,3,3,3,3,3,3,3,3,3,3,3,3,1,0],
        [2,1,3,1,1,1,3,3,3,1,1,1,3,3,1,2],
        [2,1,3,1,3,1,3,3,3,1,3,1,3,3,1,2],
        [0,1,3,1,1,1,3,3,3,1,1,1,3,3,1,0],
        [0,1,3,3,3,3,3,3,3,3,3,3,3,3,1,0],
        [0,1,3,3,1,1,1,1,1,1,1,1,3,3,1,0],
        [2,1,3,3,3,3,3,3,3,3,3,3,3,3,1,2],
        [2,1,3,1,1,1,1,3,3,1,1,1,1,3,1,2],
        [0,1,3,3,3,3,3,3,3,3,3,3,3,3,1,0],
        [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
        [0,0,2,0,0,2,0,0,0,0,2,0,0,2,0,0],
        [0,0,2,0,0,2,0,0,0,0,2,0,0,2,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
      ]
    },
    /* PARÇALANMIŞ DÜNYA — ikiye çatlamış gezegen */
    catlak: {
      c: ['', '#ff9b3d', '#ffe08a', '#8a3410'],
      m: [
        [0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0],
        [0,0,0,1,1,1,1,3,2,1,1,1,1,0,0,0],
        [0,0,1,1,1,1,3,2,0,2,3,1,1,1,0,0],
        [0,1,1,1,1,3,2,0,0,0,2,3,1,1,1,0],
        [0,1,1,1,3,2,0,0,0,0,2,3,1,1,1,0],
        [1,1,1,3,2,0,0,0,0,0,0,2,3,1,1,1],
        [1,1,3,2,0,0,0,0,0,0,0,0,2,3,1,1],
        [1,1,2,0,0,0,0,0,0,0,0,0,0,2,1,1],
        [1,1,3,2,0,0,0,0,0,0,0,0,2,3,1,1],
        [1,1,1,3,2,0,0,0,0,0,0,2,3,1,1,1],
        [0,1,1,1,3,2,0,0,0,0,2,3,1,1,1,0],
        [0,1,1,1,1,3,2,0,0,2,3,1,1,1,1,0],
        [0,0,1,1,1,1,3,2,2,3,1,1,1,1,0,0],
        [0,0,0,1,1,1,1,3,3,1,1,1,1,0,0,0],
        [0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
      ]
    }
  };

  /* Matrisi bir canvas bağlamına çizer. Tek geçiş, fillRect. */
  function drawPixelArt(g, key, boyut){
    const A = PIXEL_ART[key];
    if (!A || !g) return false;
    const B = boyut || 128;
    const n = A.m.length;
    const px = Math.max(1, Math.floor(B / n));
    const off = Math.floor((B - px * n) / 2);
    g.clearRect(0, 0, B, B);
    for (let y = 0; y < n; y++){
      const row = A.m[y];
      for (let x = 0; x < row.length; x++){
        const v = row[x];
        if (!v) continue;
        g.fillStyle = A.c[v] || '#fff';
        g.fillRect(off + x * px, off + y * px, px, px);
      }
    }
    return true;
  }

  /* ═══════════════════════════════════════════════════════════════
     FAZ 9 — KATMANLI PORTRE
     Üç katman: ARKA PLAN · ZIRH/KIYAFET · KAFA
     Hiçbir resim dosyası yok; her şey prosedürel çizilir ve önbelleğe
     alınır. Önbellek anahtarı ruh hâlini de içerir, böylece ilişki
     değiştiğinde yeniden çizilir ama her karede değil.
     ═══════════════════════════════════════════════════════════════ */

  /* Zırh/kıyafet siluetleri — 12 sütun, 5 satır. Mizaca göre değişir.
     'a' = agresif varyant (ilişki −30 altına düşünce devreye girer) */
  /* ═══ FAZ 67: KAİDE TEMİZLİĞİ ═══
     Eski siluetlerde `.#.######.#.` satırı vardı: solda ve sağda
     ANA GÖVDEDEN KOPUK birer piksel. Portrenin altında iki noktalı
     bir ayak/kaide gibi görünüyordu. Ayrıca son satır `.##########.`
     düz bir bar olduğu için heykel kaidesi izlenimi veriyordu.
     Yeni siluetler: tüm pikseller gövdeye BAĞLI, alt satır aşağı
     doğru daralıyor (omuzdan göğse doğru bir V). Kopuk piksel yok. */
  const ARMOR = {
    militarist  :{ n:['..##....##..','.##########.','.##########.','..########..','...######...'],
                   a:['.###....###.','############','.##########.','..########..','...######...'] },
    tuccar      :{ n:['....####....','..########..','.##########.','..########..','...######...'],
                   a:['...######...','.##########.','.##########.','..########..','...######...'] },
    pasifist    :{ n:['.....##.....','...######...','..########..','..########..','...######...'],
                   a:['....####....','..########..','.##########.','..########..','...######...'] },
    yayilmaci   :{ n:['...##..##...','..########..','.##########.','..########..','...######...'],
                   a:['..###..###..','.##########.','.##########.','..########..','...######...'] },
    izolasyonist:{ n:['..########..','.##########.','.##########.','..########..','...######...'],
                   a:['.##########.','############','.##########.','..########..','...######...'] }
  };
  const PERSONA_KEYS = ['militarist','tuccar','pasifist','yayilmaci','izolasyonist'];

  /* Arka plan: ruh hâline göre renklenen radyal alan + yıldız tozu */
  function drawBackdrop(g, W, H, base, mood, seed){
    /* mood: 1 dostane · 0 nötr · −1 düşman */
    let c1, c2;
    if (mood < 0){        c1 = [58, 10, 14];  c2 = [120, 22, 26]; }
    else if (mood > 0){   c1 = [10, 34, 40];  c2 = [20, 74, 70];  }
    else {                c1 = [12, 16, 30];  c2 = [30, 38, 62];  }
    const gr = g.createRadialGradient(W/2, H*.62, 2, W/2, H*.55, W*.78);
    gr.addColorStop(0, 'rgb(' + c2.join(',') + ')');
    gr.addColorStop(1, 'rgb(' + c1.join(',') + ')');
    g.fillStyle = gr;
    g.fillRect(0, 0, W, H);

    /* Prosedürel yıldız tozu — tohumlu, her portre için sabit */
    let r = (seed | 0) || 7;
    const nxt = () => { r = (r * 1664525 + 1013904223) >>> 0; return r / 4294967296; };
    const n = Math.round(W * H / 420);
    for (let i = 0; i < n; i++){
      const x = Math.floor(nxt() * W), y = Math.floor(nxt() * H);
      const a = .10 + nxt() * .30;
      g.fillStyle = 'rgba(255,255,255,' + a.toFixed(2) + ')';
      g.fillRect(x, y, 1, 1);
    }
    /* Düşmanlıkta alt taraftan yükselen kızıl sis */
    if (mood < 0){
      const gg = g.createLinearGradient(0, H, 0, H * .35);
      gg.addColorStop(0, 'rgba(190,40,36,0.42)');
      gg.addColorStop(1, 'rgba(190,40,36,0)');
      g.fillStyle = gg;
      g.fillRect(0, 0, W, H);
    }
  }

  /* ASCII ızgarayı boyar; 'W' göz parıltısı, 'A' agresif vurgu */
  function paintGrid(g, art, ox, oy, scale, base, mood, karart){
    const h = art.length;
    for (let y = 0; y < h; y++){
      const row = art[y];
      for (let x = 0; x < row.length; x++){
        const ch = row[x];
        if (ch === '.') continue;
        if (ch === 'W'){
          g.fillStyle = mood < 0 ? '#ffd0c4' : '#bfeaff';
        } else if (ch === 'A'){
          g.fillStyle = mood < 0 ? '#ff5f6d' : '#8b7bff';
        } else {
          const m = (.55 + (1 - y / h) * .75) * (karart || 1);
          g.fillStyle = 'rgb(' + shade(base, m).join(',') + ')';
        }
        g.fillRect(ox + x * scale, oy + y * scale, scale, scale);
      }
    }
  }

  /* Katmanlı portre. opts: {look, col, persona, mood, scale}
     mood sayısal ilişki (−100..100) ya da −1/0/1 olabilir. */
  /* ═══════════════════════════════════════════════════════════════
     FAZ 78B — PROSEDÜREL LİDER PORTRESİ
     Her liderin kalıcı bir seed'i var; portresi ondan türetiliyor:
       1. TEN/KABUK TONU — ırk taban renginden HSL'de ±22° kayma
       2. AKSESUAR — 5 küçük matristen seed'e göre 0-2 tanesi
          kafa katmanının üstüne bindiriliyor
       3. RÜTBE ÇERÇEVESİ — deneyim seviyesine göre kenar rengi
     shadowBlur KULLANILMIYOR (Faz 77D ölçümü: kare başına 0.6 ms).
     Sonuç ART.cache'e seed anahtarıyla yazılıyor — bir kez
     üretilip her karede tek drawImage ile basılıyor.
     ═══════════════════════════════════════════════════════════════ */
  const LEADER_ACC = {
    /* 12 sütunluk kafa matrisinin üstüne binen küçük parçalar.
       Satır indeksi kafa matrisinin üst satırından sayılır. */
    bant   :{r:4, m:['.##########.']},                  // göz bandı
    yara   :{r:3, m:['...#........']},                  // yara izi
    tac    :{r:0, m:['..#.#..#.#..']},                  // taç
    tekGoz :{r:4, m:['....##......']},                  // tek göz teki
    sakal  :{r:7, m:['..########..']}                   // çene örtüsü
  };
  const ACC_KEYS = Object.keys(LEADER_ACC);

  /* HSL kaydırma — hex girer, hex çıkar */
  function shiftHue(hex6, derece, satMul, ligMul){
    const r0 = parseInt(hex6.slice(1,3),16)/255,
          g0 = parseInt(hex6.slice(3,5),16)/255,
          b0 = parseInt(hex6.slice(5,7),16)/255;
    const mx = Math.max(r0,g0,b0), mn = Math.min(r0,g0,b0);
    let h = 0, sL = 0; const l = (mx+mn)/2;
    if (mx !== mn){
      const d = mx-mn;
      sL = l > .5 ? d/(2-mx-mn) : d/(mx+mn);
      h = mx === r0 ? (g0-b0)/d + (g0<b0?6:0) : mx === g0 ? (b0-r0)/d+2 : (r0-g0)/d+4;
      h /= 6;
    }
    h = (h + derece/360 + 1) % 1;
    sL = Math.min(1, sL * (satMul||1));
    const l2 = Math.min(.92, Math.max(.10, l * (ligMul||1)));
    const q = l2 < .5 ? l2*(1+sL) : l2+sL-l2*sL, pp = 2*l2-q;
    const kan = t2 => { t2=(t2+1)%1;
      return t2<1/6 ? pp+(q-pp)*6*t2 : t2<.5 ? q : t2<2/3 ? pp+(q-pp)*(2/3-t2)*6 : pp; };
    const to = v => Math.round(v*255).toString(16).padStart(2,'0');
    return '#' + to(kan(h+1/3)) + to(kan(h)) + to(kan(h-1/3));
  }

  function leaderPortrait(opts){
    opts = opts || {};
    const seed  = (opts.seed | 0) || 1;
    const look  = opts.look || 'humanoid';
    const taban = opts.col || '#6ff2c8';
    const rank  = Math.min(4, opts.rank | 0);
    const scale = opts.scale || 3;
    const key = 'ldr|' + seed + '|' + look + '|' + taban + '|' + rank + '|' + scale;
    if (cache.has(key)) return cache.get(key);

    /* Seed'den üç eksen türet */
    let sd = (seed * 2654435761) >>> 0;
    const nxt = () => { sd = (sd * 1664525 + 1013904223) >>> 0; return sd / 4294967296; };
    const hueOfs = (nxt() * 44) - 22;          // ±22°
    const satMul = .78 + nxt() * .5;
    const ligMul = .82 + nxt() * .40;
    const renk = shiftHue(taban, hueOfs, satMul, ligMul);

    const head = PORTRAIT[look] || PORTRAIT.humanoid;
    const cols = 12, pad = 1;
    const W = (cols + pad*2) * scale, H = (head.length + pad*2) * scale;
    const { c, g } = cv(W, H);
    g.imageSmoothingEnabled = false;

    /* Arka plan — rütbeye göre koyulaşan düz alan (gradyan yok) */
    g.fillStyle = '#070c16';
    g.fillRect(0, 0, W, H);

    /* Kafa */
    paintGrid(g, head, pad*scale, pad*scale, scale, hex(renk), 0, 1);

    /* Aksesuarlar — 0-2 adet, seed'e göre */
    const kacAcc = nxt() < .28 ? 0 : nxt() < .72 ? 1 : 2;
    const secilen = [];
    for (let i = 0; i < kacAcc; i++){
      const k = ACC_KEYS[Math.floor(nxt() * ACC_KEYS.length)];
      if (secilen.indexOf(k) >= 0) continue;
      secilen.push(k);
      const A = LEADER_ACC[k];
      if (A.r >= head.length) continue;
      const accRenk = shiftHue(renk, 150 + nxt()*60, 1.2, 1.25);
      paintGrid(g, A.m, pad*scale, (pad + A.r)*scale, scale, hex(accRenk), 0, .92);
    }

    /* Rütbe çerçevesi — deneyim yükseldikçe parlar */
    if (rank > 0){
      const rc = ['#6a7285','#9fb6cc','#6ff2c8','#f2d452','#ff9b3d'][rank];
      g.strokeStyle = rc;
      g.lineWidth = Math.max(1, scale * .6);
      g.strokeRect(g.lineWidth/2, g.lineWidth/2, W-g.lineWidth, H-g.lineWidth);
    }
    cache.set(key, c);
    return c;
  }

  function portraitFull(opts){
    opts = opts || {};
    const look    = opts.look || 'humanoid';
    const colr    = opts.col || '#6ff2c8';
    const persona = PERSONA_KEYS.indexOf(opts.persona) >= 0 ? opts.persona : 'yayilmaci';
    const scale   = opts.scale || 3;
    /* Ruh hâlini üç kovaya indir: önbellek patlamasın */
    const raw  = (opts.mood === undefined) ? 0 : opts.mood;
    const mood = raw <= -30 ? -1 : raw >= 30 ? 1 : 0;

    const key = 'pf_' + look + '_' + colr + '_' + persona + '_' + mood + '_' + scale;
    if (cache.has(key)) return cache.get(key);

    const head = PORTRAIT[look] || PORTRAIT.humanoid;
    const arm  = ARMOR[persona] || ARMOR.yayilmaci;
    /* FAZ 70: armArt artık çizilmiyor (kaide kaldırıldı) */

    const cols = 12;
    const pad  = 1;                                   // hücre cinsinden kenar payı
    /* ═══ FAZ 70: KAİDE KATMANI TAMAMEN KALDIRILDI ═══
       Faz 67'de yalnız kopuk pikselleri temizlemiştim; sorun
       pikseller değil KATMANIN KENDİSİYDİ. `armArt` (zırh/gövde
       bloğu) kafanın altına biniyor ve %62 opaklıkla çizilerek
       portrenin altında bir kaide/zemin izlenimi veriyordu.
       Artık yalnız KAFA siluetı var, doğrudan arka planın üstünde.
       ARMOR verisi ileride gerekirse diye duruyor ama ÇİZİLMİYOR. */
    const rows = head.length;                        // yalnız kafa
    const W = (cols + pad * 2) * scale;
    const H = (rows + pad * 2) * scale;
    const { c, g } = cv(W, H);
    g.imageSmoothingEnabled = false;

    const base = hex(colr);
    /* 1. KATMAN — arka plan */
    let sd = 0;
    for (let i = 0; i < look.length; i++) sd = (sd * 31 + look.charCodeAt(i)) >>> 0;
    for (let i = 0; i < colr.length; i++) sd = (sd * 31 + colr.charCodeAt(i)) >>> 0;
    drawBackdrop(g, W, H, base, mood, sd);

    /* 2. KATMAN — kafa (tek silüet, kaide yok) */
    paintGrid(g, head, pad * scale, pad * scale, scale, base, mood, 1);

    /* Düşmanlıkta ince kızıl çerçeve — durum bir bakışta okunsun */
    if (mood < 0){
      g.strokeStyle = 'rgba(255,95,109,.85)';
      g.lineWidth = Math.max(1, scale / 3);
      g.strokeRect(g.lineWidth / 2, g.lineWidth / 2, W - g.lineWidth, H - g.lineWidth);
    } else if (mood > 0){
      g.strokeStyle = 'rgba(101,224,138,.55)';
      g.lineWidth = Math.max(1, scale / 3);
      g.strokeRect(g.lineWidth / 2, g.lineWidth / 2, W - g.lineWidth, H - g.lineWidth);
    }
    cache.set(key, c);
    return c;
  }

  /* --------------------------------------------------------------
     BULUTSU — galaksi arka planı
     -------------------------------------------------------------- */
  function nebula(seed, W, H){
    const {c,g} = cv(W,H);
    const img = g.createImageData(W,H);
    const D = img.data;
    const tints = [hex('#3a2a6b'), hex('#1d4a63'), hex('#5b2340'), hex('#1f5a4a')];
    const rnd = mulberry32(seed);
    const blobs = [];
    for (let i=0;i<5;i++) blobs.push({
      x: rnd()*W, y: rnd()*H, r: (.18+rnd()*.30)*W, t: tints[(rnd()*tints.length)|0]
    });
    for (let y=0;y<H;y++) for (let x=0;x<W;x++){
      const i = (y*W+x)*4;
      let r=0,gg=0,b=0,a=0;
      const n = fbm(x*.045, y*.045, seed, 5);
      for (const bl of blobs){
        const d = Math.hypot(x-bl.x, y-bl.y)/bl.r;
        if (d < 1){
          const f = Math.pow(1-d, 2.1) * (n*.85+.25);
          r += bl.t[0]*f; gg += bl.t[1]*f; b += bl.t[2]*f; a += f;
        }
      }
      if (a > .01){
        D[i]=clamp(r,0,255)|0; D[i+1]=clamp(gg,0,255)|0; D[i+2]=clamp(b,0,255)|0;
        D[i+3]=clamp(a*150,0,120)|0;
      }
    }
    g.putImageData(img,0,0);
    return c;
  }

  return {planet, star, ship, emblem, portrait, portraitFull, leaderPortrait, nebula, cache,
          PORTRAIT, ARMOR, hexOf: hex, drawPixelArt, PIXEL_ART};
})();

const View = {
  cam:{x:2100, y:2100, z:.30}, vw:0, vh:0, dpr:1,
  sel:null, selSys:null, route:false, routed:false, hl:null, stars:[], flash:[],
  cv:null, g:null,

  init(){
    this.cv = $('map'); this.g = this.cv.getContext('2d');
    this.resize();
    if (this._inited) return;
    this._inited = true;
    /* ═══ FAZ 46: ARKA PLAN YAYILIMI ═══
       ÖLÇÜM: yıldızlar G.W×1.3 alanında üretiliyordu ama paralaks
       çarpanı (p: 0.30–0.75) onları ekran merkezinde dar bir kutuya
       sıkıştırıyordu — kenarlarda boş siyah bant kalıyordu.
       Alan ±G.W×1.5'e yayıldı ve paralaks tabanı yükseltildi. */
    const rnd = mulberry32(9182);
    this.stars = [];
    for (let i=0;i<520;i++) this.stars.push({
      x: rnd()*G.W*3.0 - G.W*1.0, y: rnd()*G.H*3.0 - G.H*1.0,
      r: rnd()<.85 ? 1 : 2, a: .25 + rnd()*.6, p: .55 + rnd()*.40
    });
    window.addEventListener('resize', ()=>this.resize());
    this.bind();
  },
  resize(){
    this.dpr = Math.min(2, window.devicePixelRatio||1);
    this.vw = window.innerWidth; this.vh = window.innerHeight;
    this.cv.width = this.vw*this.dpr; this.cv.height = this.vh*this.dpr;
    this.cv.style.width = this.vw+'px'; this.cv.style.height = this.vh+'px';
    this.g.setTransform(this.dpr,0,0,this.dpr,0,0);
    this.g.imageSmoothingEnabled = false;
    UI.checkOrient();
  },
  fit(){
    const pad = 120;
    const z = Math.min((this.vw-320)/(G.W+pad), (this.vh-90)/(G.H+pad));
    this.cam.z = clamp(z, .035, .5);
    const h = G.sys[G.p.home];
    if (h){ this.cam.x = h.x; this.cam.y = h.y; this.cam.z = .40; }
  },
  w2s(x,y){ return {x:(x-this.cam.x)*this.cam.z + this.vw/2, y:(y-this.cam.y)*this.cam.z + this.vh/2}; },
  /* ═══ FAZ 47: YUMUŞAK KAYDIRMA + PING ═══
     Zoom'a DOKUNULMAZ. Kamera hedefe animasyonla süzülür. */
  panTo(x, y){
    this._pan = {x0:this.cam.x, y0:this.cam.y, x1:x, y1:y, t0:Date.now(), ms:520};
  },
  panStep(){
    const p = this._pan;
    if (!p) return;
    const k = Math.min(1, (Date.now() - p.t0) / p.ms);
    /* easeOutCubic — sonda yumuşak durur */
    const e = 1 - Math.pow(1 - k, 3);
    this.cam.x = p.x0 + (p.x1 - p.x0) * e;
    /* FAZ 78B: animasyon sonunda da sınır uygulanır */
    this.cam.y = p.y0 + (p.y1 - p.y0) * e;
    this.clampCam();
    if (k >= 1) this._pan = null;
  },
  ping(sy){
    if (!sy) return;
    this._pings = this._pings || [];
    this._pings.push({x:sy.x, y:sy.y, t0:Date.now(), ms:4000});
    if (this._pings.length > 4) this._pings.shift();
  },
  drawPings(g, t){
    if (!this._pings || !this._pings.length) return;
    const now = Date.now();
    for (let i = this._pings.length - 1; i >= 0; i--){
      const pg = this._pings[i];
      const k = (now - pg.t0) / pg.ms;
      if (k >= 1){ this._pings.splice(i, 1); continue; }
      /* FAZ 47: ping ekran dışındaysa atlanır — ama frustum
         payı dar olduğu için kaydırma sürerken halka kaybolmasın
         diye geniş bir pay kullanılır. */
      const pp = this.w2s(pg.x, pg.y);
      if (pp.x < -80 || pp.y < -80 || pp.x > this.vw+80 || pp.y > this.vh+80) continue;
      const p = pp;
      /* Üç iç içe halka, dışa doğru genişleyip sönüyor */
      g.save();
      for (let q = 0; q < 3; q++){
        const faz = (k * 3 + q * .33) % 1;
        const r = 12 + faz * 34;
        const a = (1 - faz) * (1 - k) * .9;
        if (a <= .02) continue;
        g.strokeStyle = 'rgba(111,242,200,' + a.toFixed(2) + ')';
        g.lineWidth = 2.2;
        g.beginPath(); g.arc(p.x, p.y, r, 0, Math.PI*2); g.stroke();
      }
      /* Merkez nokta — nabız */
      const nb = .5 + .5 * Math.sin(t / 120);
      g.fillStyle = 'rgba(111,242,200,' + (nb * (1-k)).toFixed(2) + ')';
      g.beginPath(); g.arc(p.x, p.y, 3.5, 0, Math.PI*2); g.fill();
      g.restore();
    }
  },

  /* ---------- SINIR KATMANI ----------
     Dünya bir ızgaraya bölünür, her hücrenin sahibi bulunur ve
     bölgeler imparatorluk renginde doldurulup kenarları çizilir. */
  bcache:null, bkey:'',
  rgbOf(hexs){
    const h = hexs.replace('#','');
    return [parseInt(h.substr(0,2),16), parseInt(h.substr(2,2),16), parseInt(h.substr(4,2),16)];
  },
  buildBorders(){
    const N = 240;
    let key = '';
    for (const s of G.sys) key += s.owner + ':' + ((s._reach|0)/10|0) + ':' + (pSeen(s)?1:0) + ',';
    if (this.bkey === key && this.bcache) return this.bcache;

    const c = document.createElement('canvas');
    c.width = N; c.height = N;
    const g = c.getContext('2d');
    const img = g.createImageData(N,N);
    const D = img.data;
    const own = new Int16Array(N*N).fill(-1);
    const best = new Float32Array(N*N).fill(2);
    const cw = G.W/N, chh = G.H/N;

    // yalnızca sahipli sistemleri gez (hızlı)
    const list = [];
    // yalnızca KEŞFEDİLMİŞ sistemlerin sınırları görünür (savaş sisi)
    for (const s of G.sys) if (s.owner >= 0 && s._reach > 0 && pSeen(s)) list.push(s);

    for (const s of list){
      const r = s._reach;
      const x0 = Math.max(0, Math.floor((s.x-r)/cw)),  x1 = Math.min(N-1, Math.ceil((s.x+r)/cw));
      const y0 = Math.max(0, Math.floor((s.y-r)/chh)), y1 = Math.min(N-1, Math.ceil((s.y+r)/chh));
      for (let y=y0;y<=y1;y++) for (let x=x0;x<=x1;x++){
        const wx = (x+.5)*cw, wy = (y+.5)*chh;
        const dx = s.x-wx, dy = s.y-wy;
        const d = Math.sqrt(dx*dx+dy*dy);
        // organik kenar: yarıçapı gürültüyle dalgalandır (yuvarlak baloncuk hissini kırar)
        const wob = .84 + fbm(wx*.0035, wy*.0035, 1337, 3) * .34;
        const rr = r * wob;
        if (d > rr) continue;
        const score = d/rr;
        const idx = y*N+x;
        if (own[idx] < 0 || score < best[idx]){
          own[idx] = s.owner;
          best[idx] = score;
        }
      }
    }

    for (let y=0;y<N;y++) for (let x=0;x<N;x++){
      const idx = y*N+x, o = own[idx];
      if (o < 0) continue;
      const emp = G.emps[o];
      if (!emp) continue;
      const col = this.rgbOf(emp.col);
      // kaç komşu farklı? kenar yumuşaklığı buna göre ayarlanır
      let diff = 0, checked = 0;
      if (x > 0){   checked++; if (own[idx-1] !== o) diff++; }
      if (x < N-1){ checked++; if (own[idx+1] !== o) diff++; }
      if (y > 0){   checked++; if (own[idx-N] !== o) diff++; }
      if (y < N-1){ checked++; if (own[idx+N] !== o) diff++; }
      if (checked < 4) diff = Math.max(diff, 1);
      const sc = best[idx];                    // 0 merkez → 1 kenar
      const i = idx*4;
      D[i]=col[0]; D[i+1]=col[1]; D[i+2]=col[2];
      if (diff > 0){
        D[i+3] = Math.min(255, 150 + diff*38); // sınır çizgisi
      } else {
        // merkeze doğru hafifçe koyulaşan yumuşak dolgu
        D[i+3] = 24 + Math.round((1 - sc) * 26);
      }
    }
    g.putImageData(img,0,0);

    // iki geçişli yumuşatma: küçük tuvale küçültüp geri büyütmek kenarları eritir
    try {
      const soft = document.createElement('canvas');
      soft.width = N; soft.height = N;
      const sg = soft.getContext('2d');
      sg.imageSmoothingEnabled = true;
      sg.imageSmoothingQuality = 'high';
      sg.drawImage(c, 0, 0, N*0.5, N*0.5);
      sg.clearRect(0, 0, N, N);
      sg.drawImage(c, 0, 0, N*0.5, N*0.5);
      g.clearRect(0, 0, N, N);
      g.imageSmoothingEnabled = true;
      g.drawImage(soft, 0, 0, N*0.5, N*0.5, 0, 0, N, N);
    } catch(e){}
    this.bcache = c; this.bkey = key;
    return c;
  },
  s2w(x,y){ return {x:(x-this.vw/2)/this.cam.z + this.cam.x, y:(y-this.vh/2)/this.cam.z + this.cam.y}; },

  /* ---------- girdi ---------- */
  bind(){
    const cv = this.cv;
    let pts = new Map(), last = null, moved = 0, t0 = 0, pinch = null;
    const pos = ev => ({x:ev.clientX, y:ev.clientY});

    cv.addEventListener('pointerdown', ev => {
      cv.setPointerCapture(ev.pointerId);
      pts.set(ev.pointerId, pos(ev));
      if (pts.size === 1){ last = pos(ev); moved = 0; t0 = performance.now(); }
      else if (pts.size === 2){
        const [a,b] = [...pts.values()];
        pinch = {d: Math.hypot(a.x-b.x, a.y-b.y), z: this.cam.z,
                 mx:(a.x+b.x)/2, my:(a.y+b.y)/2};
      }
    });
    cv.addEventListener('pointermove', ev => {
      if (!pts.has(ev.pointerId)) return;
      pts.set(ev.pointerId, pos(ev));
      if (pts.size === 2 && pinch){
        const [a,b] = [...pts.values()];
        const d = Math.hypot(a.x-b.x, a.y-b.y);
        /* FAZ 44: pinch-zoom mobilde asıl kullanılan yol —
           tekerlekle aynı sınıra çekildi (0.07 → 0.035). */
        const nz = clamp(pinch.z * (d/pinch.d), .035, 1.9);
        const mid = this.s2w((a.x+b.x)/2, (a.y+b.y)/2);
        this.cam.z = nz;
        const mid2 = this.s2w((a.x+b.x)/2, (a.y+b.y)/2);
        this.cam.x += mid.x-mid2.x; this.cam.y += mid.y-mid2.y;
        this.clampCam();                    // FAZ 78B
        moved = 99;
      } else if (pts.size === 1 && last){
        const p = pos(ev);
        const dx = p.x-last.x, dy = p.y-last.y;
        moved += Math.hypot(dx,dy);
        this.cam.x -= dx/this.cam.z; this.cam.y -= dy/this.cam.z;
        /* FAZ 78B: sabit panPad yerine zoom'a duyarlı merkezi sınır */
        this.clampCam();
        last = p;
      }
    });
    const up = ev => {
      if (pts.size === 1 && moved < 14 && performance.now()-t0 < 420){
        this.tap(pos(ev));
      }
      pts.delete(ev.pointerId);
      if (pts.size < 2) pinch = null;
      if (pts.size === 1) last = [...pts.values()][0];
      if (pts.size === 0) last = null;
    };
    cv.addEventListener('pointerup', up);
    cv.addEventListener('pointercancel', ev => { pts.delete(ev.pointerId); pinch = null; });
    cv.addEventListener('wheel', ev => {
      ev.preventDefault();
      const before = this.s2w(ev.clientX, ev.clientY);
      /* FAZ 44: min zoom 0.07 → 0.035. ULU halka haritada tüm
         galaksiyi tek ekranda görmek 0.061 gerektiriyordu. */
      this.cam.z = clamp(this.cam.z * (ev.deltaY < 0 ? 1.14 : .88), .035, 1.9);
      const after = this.s2w(ev.clientX, ev.clientY);
      this.cam.x += before.x-after.x; this.cam.y += before.y-after.y;
      this.clampCam();                      // FAZ 78B
    }, {passive:false});
  },

  hit(sp){
    const w = this.s2w(sp.x, sp.y);
    const R = 34/this.cam.z;
    // dokunma menzilindeki TÜM filolar (üst üste duranlar dahil)
    const near = [];
    for (const f of G.fleets){
      if (!f.ships.length) continue;
      if (f.e !== 0 && !this.fleetVisible(f)) continue;
      const d = Math.hypot(f.x-w.x, f.y-w.y);
      if (d < R) near.push({f, d});
    }
    near.sort((a,b)=>{
      const oa = (a.f.e === 0) ? 0 : 1, ob = (b.f.e === 0) ? 0 : 1;
      return (oa - ob) || (a.d - b.d);
    });
    let bf = near.length ? near[0].f : null;
    // aynı noktada birden fazla filo varsa her dokunuşta sıradakine geç
    if (near.length > 1 && this.sel){
      const idx = near.findIndex(n => n.f === this.sel);
      if (idx >= 0) bf = near[(idx + 1) % near.length].f;
    }
    this.hitCount = near.length;
    let bs = null, bsd = R;
    for (const s of G.sys){
      if (!pSeen(s)) continue;
      const d = Math.hypot(s.x-w.x, s.y-w.y);
      if (d < bsd){ bsd = d; bs = s; }
    }
    return {f:bf, s:bs};
  },
  fleetVisible(f){
    if (f.e === 0) return true;
    if (f.sys >= 0) return pVis(G.sys[f.sys]);
    return f.mv && (pVis(G.sys[f.mv.from]) || pVis(G.sys[f.mv.to]));
  },

  tap(sp){
    const {f, s} = this.hit(sp);
    const now = performance.now();
    const dbl = (now - (this._lastTap||0) < 320) && this._lastPt &&
                Math.hypot(sp.x-this._lastPt.x, sp.y-this._lastPt.y) < 26;
    this._lastTap = now; this._lastPt = {x:sp.x, y:sp.y};

    // çift dokunuş: filoları atla, doğrudan sistem paneline gir
    if (dbl && s && !this.route){
      this.selSys = s;
      UI.tab('sistem');
      UI.refresh();
      return;
    }
    /* ═══════════════════════════════════════════════════════════
       FAZ 76 — NİŞANGAH MODU
       Koloni/inşaat gemileri sürü halinde aynı hedefe gitmesin
       diye tekil emir kipi: sağ panelden bir gemi seçilip
       "hedef seç" denince oyun bu kipe giriyor, haritada tıklanan
       sisteme YALNIZ O GEMİ yollanıyor.
       ═══════════════════════════════════════════════════════════ */
    if (this.aimFleet !== undefined && s){
      const af = G.fleets.find(q => q.id === this.aimFleet && q.ships.length);
      this.aimFleet = undefined;
      if (af){
        const kol = af.ships.some(sh => sh.c === 'kol');
        if (kol){
          /* Koloni gemisi: hedefte yerleşilebilir gezegen ara */
          let hedefP = -1;
          for (let i = 0; i < s.planets.length; i++){
            const pl = s.planets[i];
            if (!pl || pl.col) continue;
            if (typeof canColonize === 'function' && !canColonize(G.p, s, pl)) continue;
            if (typeof colonyClaimedBy === 'function' && colonyClaimedBy(pl, af.id)) continue;
            hedefP = i; break;
          }
          if (hedefP >= 0){
            if (typeof claimColony === 'function') claimColony(af, s, hedefP);
            orderMove(af, s.id);
            af.ord = {t:'kol', s:s.id, p:hedefP};
            say('🎯 ' + (af.name || 'Gemi') + ' → ' +
                s.planets[hedefP].name + ' (tekil emir)', 'sci');
          } else {
            say('🎯 ' + s.name + ' sisteminde yerleşilebilir boş gezegen yok', 'war');
          }
        } else {
          orderMove(af, s.id);
          say('🎯 ' + (af.name || 'Gemi') + ' → ' + s.name + ' (tekil emir)', 'sci');
        }
        this.sel = af;
      }
      UI.refresh();
      return;
    }

    /* ═══ FAZ 67: TERSANE RALLİ HEDEFİ SEÇİMİ ═══ */
    if (this.rallyForSys !== undefined && s){
      const kaynak = G.sys[this.rallyForSys];
      this.rallyForSys = undefined;
      if (kaynak){
        kaynak.rally = kaynak.rally || {};
        kaynak.rally[0] = {sys: s.id};
        say('📍 ' + kaynak.name + ' → ' + s.name +
            ' · yeni askeri gemiler oraya gidecek', 'sci');
      }
      UI.refresh();
      return;
    }

    /* FAZ 50: Panoptikon yeniden hedefleme */
    if (this.panoptFor !== undefined && s){
      const kay = this.panoptFor;
      this.panoptFor = undefined;
      const r = (typeof panopticonLock === 'function')
        ? panopticonLock(G.p, kay, s.id) : {ok:false, why:'—'};
      if (!r.ok) say(r.why, 'war');
      UI.refresh();
      return;
    }

    /* ═══ FAZ 48: TOPLANMA NOKTASI SEÇİMİ ═══
       rallyFor açıkken haritadan seçilen sistem o filonun
       toplanma noktası olur; üretilen gemiler oraya intikal eder. */
    if (this.rallyFor !== undefined && s){
      const fl = G.fleets.find(q => q.id === this.rallyFor);
      this.rallyFor = undefined;
      if (fl){
        fl.rallyAt = s.id;
        /* Filonun bulunduğu/gittiği sistemin tersanelerine kaydet */
        const kaynak = fl.sys >= 0 ? G.sys[fl.sys] : (fl.mv ? G.sys[fl.mv.to] : null);
        if (kaynak && typeof setRally === 'function') setRally(G.p, kaynak, s.id);
        for (const sy of G.sys){
          if (sy.owner !== 0) continue;
          if (typeof hasStructYard === 'function' && !hasStructYard(sy) &&
              !(sy.built && sy.built.tersane)) continue;
          sy.rally = sy.rally || {};
          sy.rally[0] = {fleet: fl.id, sys: s.id};
        }
        say('📍 Toplanma noktası: ' + s.name + ' — yeni gemiler oraya gidecek', 'sci');
      }
      UI.refresh();
      return;
    }

    if (this.sel && this.route && s){
      if (orderMove(this.sel, s.id, this.routed)){
        if (!this.routed) this.sel.ord = null;
        this.routed = true;
        UI.pulse(s);
        UI.refresh();
      }
      return;
    }
    if (f && f.e === 0){
      this.sel = f; this.selSys = null;
      if (this.hitCount > 1) UI.alert(this.hitCount + ' filo üst üste — tekrar dokun, sıradakine geç');
      UI.tab('filo'); UI.refresh(); return;
    }
    if (s){ this.selSys = s; if (!this.route) this.sel = null; UI.tab('sistem'); UI.refresh(); return; }
    this.sel = null; this.selSys = null; this.route = false; UI.refresh();
  },

  /* ═══════════════════════════════════════════════════════════════
     FAZ 78B — MERKEZİ KAMERA SINIRI
     KÖK NEDEN: kamera 6 AYRI YERDE yazılıyordu (fit, pan, pinch,
     wheel-zoom, center, animasyon) ama clamp yalnız BİRİNDE vardı.
     Pinch ve tekerlek zoom'u sınırsız kaydırıyor, sonraki pan
     hareketi kamerayı geri çekiyordu — oyuncu bunu "görünmez
     duvar" olarak hissediyordu.

     Yeni sınır ZOOM'A DUYARLI: kenardaki bir sistemin ekranın
     ortasına gelebilmesi için kamera merkezinin harita kenarını
     EKRANIN YARISI kadar aşabilmesi gerekir. Uzaklaştıkça
     (z küçülür) yarım ekran dünya biriminde büyür, sınır da
     doğal olarak genişler.
     ═══════════════════════════════════════════════════════════════ */
  /* ═══════════════════════════════════════════════════════════════
     FAZ 80 — MODA GÖRE BÖLGE RENGİ
     Sınır boyaması artık her harita modunun mantığını yansıtıyor:
       siyasi    → devletin kendi rengi (kim nerede)
       diplomasi → bize göre duruş (dost/düşman/tarafsız)
       savas     → savaşta mı (kırmızı) yoksa değil mi (soluk)
       askeri    → LOJİSTİK: bizim ikmal ağımızda mı?
     ═══════════════════════════════════════════════════════════════ */
  bolgeRenk(sahip){
    if (!sahip) return '#3a4356';
    const e0 = G.p;
    /* ═══ FAZ 81: SERT AYRIM ═══
       diploColor() savaş moduna özel dallar taşıdığı için
       diplomatik modda beklenen rengi vermiyordu. Diplomatik
       mod artık KENDİ tablosunu okuyor — devlet rengiyle hiçbir
       ortak noktası yok, saf ilişki göstergesi. */
    if (MAP_MODE === 'diplomasi'){
      if (!e0 || sahip.id === e0.id) return '#6ff2c8';        // biz
      if (sahip.wild || sahip.crisisSide) return '#8b3ad8';   // korsan/kriz
      if (e0.war[sahip.id]) return '#ff5f6d';                 // savaşta
      if (e0.ally && e0.ally[sahip.id]) return '#65e08a';     // müttefik
      if (typeof isVassal === 'function' && isVassal(sahip) &&
          sahip.overlord === e0.id) return '#4fd8c4';         // vasalım
      if (e0.pact && e0.pact[sahip.id]) return '#9fdcc9';     // saldırmazlık
      if (!e0.contact[sahip.id]) return '#2e3646';            // tanımıyoruz
      const r = e0.rel[sahip.id] || 0;
      if (r >= 40) return '#a8e6a0';                          // dostane
      if (r <= -40) return '#ff9b3d';                         // gergin
      return '#7d90ad';                                        // nötr
    }
    if (MAP_MODE === 'savas') return diploColor(sahip);
    if (MAP_MODE === 'askeri'){
      /* Lojistik modu: kendi sistemlerimiz ikmal durumuna göre,
         yabancılar erişilebilirliğe göre renklenir. */
      const e = G.p;
      if (sahip.id === e.id) return '#6ff2c8';            // kendi hattımız
      if (e.ally && e.ally[sahip.id]) return '#4fd8c4';   // müttefik limanı
      if (e.passage && e.passage[sahip.id]) return '#f2d452'; // geçiş izni
      if (e.war[sahip.id]) return '#ff5f6d';              // hat kapalı
      return '#5a6478';                                    // nötr, geçilemez
    }
    return sahip.col;                                      // siyasi
  },

  clampCam(){
    const c = this.cam;
    if (!c) return;
    const z = Math.max(.02, c.z || .4);
    /* Ekranın yarısı, dünya biriminde */
    const yariW = (this.vw || 900) / (2 * z);
    const yariH = (this.vh || 420) / (2 * z);
    /* Pay: ekranın yarısı + küçük bir nefes payı.
       Taban 300 birim ki aşırı yakınlaştırmada da kenar okunsun. */
    const padX = Math.max(300, yariW * .95);
    const padY = Math.max(300, yariH * .95);
    c.x = clamp(c.x, -padX, (G.W || 4000) + padX);
    c.y = clamp(c.y, -padY, (G.H || 4000) + padY);
  },
  center(x,y){ this.cam.x = x; this.cam.y = y; this.clampCam(); },

  /* ---------- çizim ---------- */
  /* ═══ FAZ 21: GÖRÜŞ ALANI (FRUSTUM CULLING) ═══
     Kameranın dışındaki sistemlere hiç çizim komutu gönderilmez.
     Sınırlar DÜNYA koordinatında bir kez hesaplanır; her sistem
     için ekran dönüşümü yapmak yerine ucuz bir kutu testi yapılır.
     Pay (margin) kenardaki halkalar ve etiketler kırpılmasın diye. */
  updateFrustum(){
    const z = this.cam.z;
    /* ═══════════════════════════════════════════════════════════
       FAZ 45 — SİYASİ HARİTA MODU (LOD)
       ÖLÇÜM: kamera 0.035'e açılınca ekrana daha çok sistem
       giriyor ve çizim yükü ARTIYORDU (0.167 → 0.533 ms,
       45 → 808 çizim komutu). Faz 44'te kamerayı serbest
       bıraktım, şimdi bedelini ödüyorum.
       z < 0.05'te detaylar kapanır, yalnız çekirdek noktalar ve
       hakimiyet renkleri kalır — galaksi bir siyasi haritaya
       dönüşür. */
    this.politik = z < .05;
    /* ═══ FAZ 64: CULLING PAYI GENİŞLETİLDİ ═══
       ÖLÇÜM/RAPOR: 90 px pay, sistem etrafında çizilen en geniş
       öğeler için yetmiyordu ve halkalar ekran kenarında BIÇAK
       GİBİ KESİLİYORDU. En geniş çizimler:
         · hakimiyet halesi (siyasi harita)      ~7 px
         · radyasyon/enkaz halkaları             ~26 px
         · ping halkası (genişleyen)             ~46 px
         · sistem adı + tersane etiketi (altta)  ~24 px
         · bölge adı (19 px font, ortalanmış)    ~120 px genişlik
       Bunların hepsi merkez ekran DIŞINDAYKEN de görünür olmalı.
       Pay 300 px'e çıkarıldı — istenen 200-300 aralığının üstü.
       Maliyet: ULU galakside kare başına birkaç ek sistem taranır,
       ölçülebilir bir fark yok (aşağıdaki testte doğrulandı). */
    const RENDER_MARGIN = 300;               // ekran uzayında piksel
    const pay = RENDER_MARGIN / Math.max(.02, z);   // dünya birimine çevir
    const halfW = this.vw / 2 / Math.max(.02, z);
    const halfH = this.vh / 2 / Math.max(.02, z);
    this.fx0 = this.cam.x - halfW - pay;
    this.fx1 = this.cam.x + halfW + pay;
    this.fy0 = this.cam.y - halfH - pay;
    this.fy1 = this.cam.y + halfH + pay;
    this.culled = 0; this.drawn = 0;
  },
  inView(x, y){
    return x >= this.fx0 && x <= this.fx1 && y >= this.fy0 && y <= this.fy1;
  },
  /* Yol testi: iki uçtan biri görünürse çiz. İkisi de dışarıdaysa
     ama yol ekranı KESİYORSA da çizilmeli — kaba kutu kesişimi. */
  laneInView(a, b){
    if (this.inView(a.x, a.y) || this.inView(b.x, b.y)) return true;
    const lx0 = Math.min(a.x, b.x), lx1 = Math.max(a.x, b.x);
    const ly0 = Math.min(a.y, b.y), ly1 = Math.max(a.y, b.y);
    return !(lx1 < this.fx0 || lx0 > this.fx1 || ly1 < this.fy0 || ly0 > this.fy1);
  },

  draw(t){
    const g = this.g;
    this.panStep();                     // FAZ 47: yumuşak kaydırma
    const z = this.cam.z;
    this.updateFrustum();
    g.fillStyle = '#05070f';
    g.fillRect(0,0,this.vw,this.vh);

    // bulutsu
    if (G.nebula && !BG_OFF){
      const a = this.w2s(0,0), b = this.w2s(G.W,G.H);
      g.globalAlpha = .55;
      g.imageSmoothingEnabled = true;
      g.drawImage(G.nebula, a.x, a.y, b.x-a.x, b.y-a.y);
      g.imageSmoothingEnabled = false;
      g.globalAlpha = 1;
    }
    // yıldız tozu (paralaks)
    if (!BG_OFF) for (const s of this.stars){
      const px = (s.x-this.cam.x)*z*s.p + this.vw/2;
      const py = (s.y-this.cam.y)*z*s.p + this.vh/2;
      if (px<-4||py<-4||px>this.vw+4||py>this.vh+4) continue;
      g.fillStyle = 'rgba(200,225,255,'+s.a+')';
      g.fillRect(px|0, py|0, s.r, s.r);
    }

    // imparatorluk sınırları (renkli bölgeler + kenar çizgileri)
    const bmap = this.buildBorders();
    if (bmap){
      const a0 = this.w2s(0,0), b0 = this.w2s(G.W,G.H);
      g.save();
      g.imageSmoothingEnabled = true;
      g.globalAlpha = .92;
      g.drawImage(bmap, a0.x, a0.y, b0.x-a0.x, b0.y-a0.y);
      g.globalAlpha = 1;
      g.imageSmoothingEnabled = false;
      g.restore();
    }

    // imparatorluk adları — kendi renkli bölgesinin merkezinde
    if (z > .10){
      const cen = {};
      for (const sy of G.sys){
        if (sy.owner < 0 || !pSeen(sy)) continue;
        const o = cen[sy.owner] || (cen[sy.owner] = {x:0, y:0, n:0});
        o.x += sy.x; o.y += sy.y; o.n++;
      }
      for (const id in cen){
        const c2 = cen[id];
        if (c2.n < 1) continue;
        const emp = G.emps[id];
        if (!emp) continue;
        const p2 = this.w2s(c2.x/c2.n, c2.y/c2.n);
        if (p2.x < -80 || p2.y < -40 || p2.x > this.vw+80 || p2.y > this.vh+40) continue;
        // az sistem görünüyorsa yalnızca kısaltma yaz
        const wide = z > .26 && c2.n >= 2;
        const label = wide ? emp.name.toUpperCase()
                           : (RACES[emp.race] ? RACES[emp.race].kisa.toUpperCase() : '?');
        const fs = wide ? Math.round(clamp(11 + z*8, 11, 17)) : Math.round(clamp(10 + z*6, 10, 14));
        g.save();
        g.font = 'bold ' + fs + 'px ui-monospace,monospace';
        g.textAlign = 'center';
        g.letterSpacing = '2px';
        // arkasına koyu gölge, okunabilirlik için
        g.lineWidth = 4;
        g.strokeStyle = 'rgba(5,7,15,.85)';
        g.strokeText(label, p2.x, p2.y);
        g.fillStyle = emp.col;
        g.globalAlpha = .78;
        g.fillText(label, p2.x, p2.y);
        g.globalAlpha = 1;
        g.restore();
      }
    }

    /* ═══════════════════════════════════════════════════════════
       FAZ 75 — DİPLOMATİK BÖLGE BOYAMASI
       Diplomatik ve savaş modlarında yalnız gezegen halkaları
       değil, devletlerin HÜKÜM ALANI da şeffaf boyanıyor.
       Poligon değil, sistem başına yumuşak bir hale çiziyoruz:
       komşu sistemlerin haleleri birleşince doğal bir bölge
       oluşuyor ve Voronoi hesabı gerekmeden sınır okunuyor.
       Yollardan ÖNCE çizilir ki zemin katmanı olsun.
       ═══════════════════════════════════════════════════════════ */
    /* NOT: `politik` bu satırdan SONRA tanımlanıyor (TDZ), o yüzden
       koşulu doğrudan zoom'dan okuyoruz — this.politik zaten
       updateFrustum'da hesaplanmış oluyor. */
    /* FAZ 80: bölge boyaması artık DÖRT modda da çalışıyor.
       Her mod kendi renk mantığını kullanıyor (bkz. bolgeRenk). */
    if (MAP_MODE !== 'siyasi_yok' && !this.politik){
      g.save();
      g.globalCompositeOperation = 'lighter';
      for (const s of G.sys){
        if (s.owner < 0) continue;
        if (!pVis(s) && !s.seen.includes(0)) continue;
        const sahip = G.emps[s.owner];
        if (!sahip || sahip.dead) continue;
        if (!this.inView(s.x, s.y)) continue;
        const p2 = this.w2s(s.x, s.y);
        /* Hale yarıçapı: sistemler arası tipik mesafenin yarısı */
        const R = Math.max(26, 150 * z);
        const dc = this.bolgeRenk(sahip);
        const yanip = G.p.war[sahip.id] ? (.55 + .45*Math.sin(t/260)) : 1;
        const grad = g.createRadialGradient(p2.x, p2.y, 0, p2.x, p2.y, R);
        grad.addColorStop(0,   dc + (G.p.war[sahip.id] ? '3a' : '2e'));
        grad.addColorStop(.55, dc + '18');
        grad.addColorStop(1,   dc + '00');
        g.globalAlpha = yanip * .9;
        g.fillStyle = grad;
        g.beginPath(); g.arc(p2.x, p2.y, R, 0, Math.PI*2); g.fill();
      }
      g.globalAlpha = 1;
      g.restore();
    }

    // hiper yollar
    g.lineWidth = Math.max(.6, 1.1*Math.min(1,z*3));
    for (const s of G.sys){
      for (const l of s.lanes){
        if (l < s.id) continue;
        const o = G.sys[l];
        if (!this.laneInView(s, o)) continue;      // FAZ 21: culling
        const seenA = pSeen(s), seenB = pSeen(o);
        if (!seenA && !seenB) continue;
        const a = this.w2s(s.x,s.y), b = this.w2s(o.x,o.y);
        if ((a.x<0&&b.x<0)||(a.y<0&&b.y<0)||(a.x>this.vw&&b.x>this.vw)||(a.y>this.vh&&b.y>this.vh)) continue;
        const both = seenA && seenB;
        if (s.owner >= 0 && s.owner === o.owner && both){
          g.strokeStyle = G.emps[s.owner].col + '55';
        } else g.strokeStyle = both ? 'rgba(120,150,190,.24)' : 'rgba(90,110,140,.10)';
        g.beginPath(); g.moveTo(a.x,a.y); g.lineTo(b.x,b.y); g.stroke();
      }
    }

    // ticaret hatları (yalnız oyuncunun)
    if (G.p && G.p.trade && G.p.trade.links && z > .13){
      for (const L of G.p.trade.links){
        // rota hiper yolları takip eder — uzak sistemler arası düz atlama yok
        const nodes = (L.path && L.path.length > 1) ? L.path : [L.a, L.b];
        const pts = nodes.map(id => this.w2s(G.sys[id].x, G.sys[id].y));
        const a = pts[0], b = pts[pts.length-1];
        if ((a.x<0&&b.x<0)||(a.y<0&&b.y<0)||(a.x>this.vw&&b.x>this.vw)||(a.y>this.vh&&b.y>this.vh)) continue;
        g.save();
        g.lineWidth = 2.4;
        if (L.raided){
          g.strokeStyle = 'rgba(255,95,109,.55)';
          g.setLineDash([2,3]);
        } else if (L.bl){
          g.strokeStyle = 'rgba(255,95,109,.42)';
          g.setLineDash([3,4]);
        } else {
          const heavy = (L.vol || 0) > 40;
          g.strokeStyle = heavy ? 'rgba(242,212,82,.46)' : 'rgba(242,212,82,.28)';
          g.lineWidth = heavy ? 3.2 : 2.4;
          g.setLineDash([]);
        }
        g.beginPath();
        pts.forEach((q,qi)=>{ qi ? g.lineTo(q.x,q.y) : g.moveTo(q.x,q.y); });
        g.stroke();
        if (L.bl){
          const midP = pts[Math.floor(pts.length/2)] || a;
          const mx = midP.x, my = midP.y;
          g.setLineDash([]);
          g.strokeStyle = '#ff5f6d'; g.lineWidth = 1.8;
          g.beginPath();
          g.moveTo(mx-4,my-4); g.lineTo(mx+4,my+4);
          g.moveTo(mx+4,my-4); g.lineTo(mx-4,my+4);
          g.stroke();
        } else if (z > .22){
          // hat üzerinde gidip gelen sivil ticaret konvoyları
          const seed = (L.a*37 + L.b*11) % 100;
          const hops = (L.path ? L.path.length - 1 : 1);
          const per = (3400 + (seed % 7) * 500) * Math.max(1, hops * .8);
          const cars = (L.vol||0) > 60 ? 3 : (L.vol||0) > 25 ? 2 : 1;
          for (let k=0;k<cars;k++){
            let tt = ((t + seed*90 + k*per/cars) % per) / per;
            const fwd = k === 0;
            const u = clamp(fwd ? tt : 1 - tt, 0, 1);
            const segs = Math.max(1, pts.length - 1);
            const fpos = u * segs;
            const si = Math.min(segs - 1, Math.floor(fpos));
            const sf = fpos - si;
            const q1 = pts[si], q2 = pts[si+1] || pts[si];
            const px = lerp(q1.x, q2.x, sf), py = lerp(q1.y, q2.y, sf);
            g.setLineDash([]);
            g.fillStyle = 'rgba(242,212,82,.95)';
            g.fillRect(px-1.5, py-1.5, 3, 3);
            g.fillStyle = 'rgba(242,212,82,.28)';
            g.fillRect(px-3, py-3, 6, 6);
          }
        }
        g.restore();
      }
      g.setLineDash([]);
    }

    // seçili filo rotası
    if (this.sel){
      const f = this.sel;
      const nodes = [];
      if (f.mv) nodes.push({x:f.x, y:f.y});
      else if (f.sys>=0) nodes.push({x:G.sys[f.sys].x, y:G.sys[f.sys].y});
      f.path.forEach(id => nodes.push({x:G.sys[id].x, y:G.sys[id].y}));
      if (nodes.length > 1){
        g.strokeStyle = '#6ff2c8'; g.lineWidth = 1.4;
        g.setLineDash([5,5]); g.lineDashOffset = -(t/26)%10;
        g.beginPath();
        nodes.forEach((n,i)=>{ const p = this.w2s(n.x,n.y); i?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y); });
        g.stroke(); g.setLineDash([]);
        const last = this.w2s(nodes[nodes.length-1].x, nodes[nodes.length-1].y);
        g.strokeStyle = '#6ff2c8';
        g.beginPath(); g.arc(last.x,last.y,9,0,Math.PI*2); g.stroke();
      }
    }

    // sistemler
    const showName = z > .22;
    /* ═══════════════════════════════════════════════════════════
       FAZ 45 — SİYASİ HARİTA MODU (LOD)
       ÖLÇÜM: kamera 0.035'e açıldığında tüm sistemler kadraja
       giriyor ve kare başına 919 çizim işlemi birikiyordu
       (0.192 → 0.633 ms). Bu eşiğin altında detay çizilmez;
       yalnız çekirdek nokta + hakimiyet rengi kalır ve harita
       temiz bir siyasi görünüme döner. */
    const politik = z < .05;
    for (const s of G.sys){
      /* FAZ 21: dünya-uzayı testi ÖNCE — w2s dönüşümü bile yapılmaz.
         Eskiden her sistem için w2s hesaplanıp sonra eleniyordu. */
      if (!this.inView(s.x, s.y)){ this.culled++; continue; }
      const p = this.w2s(s.x,s.y);
      this.drawn++;
      const seen = pSeen(s), vis = pVis(s);
      if (!seen){
        g.fillStyle = 'rgba(90,110,150,.22)';
        g.beginPath(); g.arc(p.x,p.y,2,0,Math.PI*2); g.fill();
        continue;
      }
      const sr = Math.max(2.2, s.star.r*z*1.5);

      /* ═══ FAZ 45: SİYASİ HARİTA — ERKEN ÇIKIŞ ═══
         Bu eşiğin altında sistem tek bir noktadır. Sahipliyse
         imparatorluk renginde ve biraz büyük çizilir; böylece
         galaksinin siyasi dokusu tek bakışta okunur. Halkalar,
         enkaz işaretleri, bina/işçi göstergeleri, moral rozetleri
         ve filo modelleri hepsi atlanır. */
      if (politik){
        const sahip = s.owner >= 0 ? G.emps[s.owner] : null;
        if (sahip && !sahip.dead){
          /* FAZ 47: diplomatik modda renk ilişkiden gelir */
          if (MAP_MODE === 'diplomasi' || MAP_MODE === 'savas'){
            const dc = diploColor(sahip);
            const yanip = G.p.war[sahip.id]
              ? (.55 + .45 * Math.sin(t / 260)) : 1;
            g.globalAlpha = yanip;
            g.fillStyle = dc + '38';
            g.beginPath(); g.arc(p.x, p.y, 7, 0, Math.PI*2); g.fill();
            g.fillStyle = dc;
            g.beginPath(); g.arc(p.x, p.y, 2.6, 0, Math.PI*2); g.fill();
            g.globalAlpha = 1;
            continue;
          }
          /* Hakimiyet halesi — sınırları belirginleştirir */
          g.fillStyle = sahip.col + '38';
          g.beginPath(); g.arc(p.x, p.y, 7, 0, Math.PI*2); g.fill();
          g.fillStyle = sahip.col;
          g.beginPath(); g.arc(p.x, p.y, 2.6, 0, Math.PI*2); g.fill();
        } else {
          g.fillStyle = 'rgba(150,175,210,.55)';
          g.beginPath(); g.arc(p.x, p.y, 1.8, 0, Math.PI*2); g.fill();
        }
        continue;
      }

      /* ═══ FAZ 25: KIRIK DÜNYA İŞARETİ ═══
         Colossus ile parçalanmış gezegeni olan sistem, kızıl ve
         kesikli bir enkaz halkasıyla işaretlenir. Ucuz: tek arc +
         tek stroke, yalnız yakınlaştırmada ve yalnız o sistemlerde.
         s._shat önbelleği sayesinde gezegen dizisi her karede
         taranmaz — sadece bir kez, sonra bayrak okunur. */
      if (s._shat === undefined){
        s._shat = false;
        for (const pl2 of s.planets) if (pl2.shattered){ s._shat = true; break; }
      }
      /* ═══ FAZ 38: RADYASYON TEHLİKE HALKASI ═══
         Neon sarı-yeşil, kesikli, yavaşça dönen halka. Tek arc +
         tek stroke; z > .15 altında hiç çizilmiyor. Bayrak doğrudan
         sistem nesnesinde (s.radiation), önbellek taraması yok. */
      if (s.radiation && z > .15){
        const rr2 = sr + 9;
        g.save();
        g.strokeStyle = 'rgba(214,240,60,.80)';
        g.lineWidth = Math.max(1, z * 1.3);
        g.setLineDash([4, 5]);
        g.lineDashOffset = -(t / 160) % 9;      // yavaş dönüş
        g.beginPath(); g.arc(p.x, p.y, rr2, 0, Math.PI * 2); g.stroke();
        g.setLineDash([]);
        /* İç titreşim — nabız gibi */
        const nabiz = .18 + .12 * Math.sin(t / 420 + s.id);
        g.fillStyle = 'rgba(160,220,70,' + nabiz.toFixed(2) + ')';
        g.beginPath(); g.arc(p.x, p.y, rr2 * .60, 0, Math.PI * 2); g.fill();
        g.restore();
      }

      /* ═══════════════════════════════════════════════════════════
         FAZ 77D — GÖÇEN GÜNEŞ (sy.wander)
         SEÇİM (A): hiper yollara DOKUNULMUYOR. Yıldızın göçü
         yalnız görsel — findPath, supplyDistance, gateNetwork ve
         updateVision'ın önbellekleri güvende kalıyor.

         Efekt üç katman: dıştan içe daralan iki titreşen halka,
         merkezde nabız atan bir korona ve arkada shadowBlur
         parıltısı. Hepsi tek save/restore içinde; bayrak
         doğrudan sistem nesnesinde (s.wander), tarama yok.
         ═══════════════════════════════════════════════════════════ */
      if (s.wander && z > .10){
        g.save();
        const faz = t / 700 + s.id;
        /* Korona — yıldızın kendisi büyüyüp küçülüyor.
           ÖLÇÜM (Faz 77D): shadowBlur kare başına 0.67 ms ekliyordu
           (%89 artış). Canvas'ta gölge filtresi her çizimde tüm
           tamponu yeniden tarıyor. Kaldırıldı — aynı parıltı
           gradyanın kendisiyle veriliyor, maliyeti sıfır. */
        const kor = sr * (1.9 + .45 * Math.sin(faz * 2));
        const gr = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, kor);
        gr.addColorStop(0,   'rgba(255,246,205,1)');
        gr.addColorStop(.18, 'rgba(255,224,140,.85)');
        gr.addColorStop(.45, 'rgba(255,172,58,.48)');
        gr.addColorStop(1,   'rgba(255,110,16,0)');
        g.fillStyle = gr;
        g.beginPath(); g.arc(p.x, p.y, kor, 0, Math.PI * 2); g.fill();

        /* İki titreşen halka — dışarı doğru genişleyip sönüyor */
        for (let i = 0; i < 2; i++){
          const evre = ((t / 1500) + i * .5) % 1;         // 0…1 döngü
          const rr3 = sr + 6 + evre * (sr * 5 + 26);
          const alfa = (1 - evre) * .62;
          g.strokeStyle = 'rgba(255,204,110,' + alfa.toFixed(2) + ')';
          g.lineWidth = Math.max(.8, z * 1.6 * (1 - evre) + .4);
          g.beginPath(); g.arc(p.x, p.y, rr3, 0, Math.PI * 2); g.stroke();
        }

        /* Sürüklenme kuyruğu — geldiği yöne doğru soluk bir iz.
           ÖLÇÜM: createLinearGradient her karede yeniden kuruluyordu.
           Aynı sönümlenme üç düz parçayla veriliyor: gradyan
           nesnesi yok, görsel fark yok. */
        if (s.wanderFrom !== undefined && G.sys[s.wanderFrom]){
          const o2 = G.sys[s.wanderFrom];
          const q = this.w2s(o2.x, o2.y);
          g.lineWidth = Math.max(1.2, z * 2.4);
          for (let i = 0; i < 3; i++){
            const a0 = i / 3, a1 = (i + 1) / 3;
            g.strokeStyle = 'rgba(255,190,90,' + (.42 * (1 - a0)).toFixed(2) + ')';
            g.beginPath();
            g.moveTo(p.x + (q.x - p.x) * a0, p.y + (q.y - p.y) * a0);
            g.lineTo(p.x + (q.x - p.x) * a1, p.y + (q.y - p.y) * a1);
            g.stroke();
          }
        }
        g.restore();
      }

      if (s._shat && z > .22){
        /* ═══ FAZ 35: İKİ TÜR ENKAZ ═══
           Colossus enkazı kızıl ve kesikli (patlama).
           Sürü enkazı mor-yeşil ve dalgalı (biyolojik çürüme).
           Ayrım önbellekte tutuluyor, her karede taranmıyor. */
        if (s._shatBio === undefined){
          s._shatBio = false;
          for (const pl2 of s.planets)
            if (pl2.devoured !== undefined){ s._shatBio = true; break; }
        }
        const rr = sr + 6;
        g.save();
        if (s._shatBio){
          /* Biyolojik enkaz: mor halka + yeşil spor bulutu */
          g.strokeStyle = 'rgba(160,60,200,.85)';
          g.lineWidth = Math.max(1, z * 1.2);
          g.setLineDash([2, 3]);
          g.beginPath(); g.arc(p.x, p.y, rr, 0, Math.PI * 2); g.stroke();
          g.setLineDash([]);
          g.fillStyle = 'rgba(70,150,90,.20)';
          g.beginPath(); g.arc(p.x, p.y, rr * .74, 0, Math.PI * 2); g.fill();
          /* Dışa saçılan sporlar — üç kısa çizgi, ucuz */
          g.strokeStyle = 'rgba(120,220,140,.45)';
          g.lineWidth = Math.max(1, z * .7);
          for (let q = 0; q < 3; q++){
            const a2 = (t / 900 + q * 2.09 + s.id) % 6.283;
            g.beginPath();
            g.moveTo(p.x + Math.cos(a2) * rr * .8, p.y + Math.sin(a2) * rr * .8);
            g.lineTo(p.x + Math.cos(a2) * rr * 1.25, p.y + Math.sin(a2) * rr * 1.25);
            g.stroke();
          }
        } else {
          g.strokeStyle = 'rgba(190,70,60,.85)';
          g.lineWidth = Math.max(1, z * 1.1);
          g.setLineDash([3, 4]);
          g.beginPath(); g.arc(p.x, p.y, rr, 0, Math.PI * 2); g.stroke();
          g.setLineDash([]);
          g.fillStyle = 'rgba(120,55,50,.22)';
          g.beginPath(); g.arc(p.x, p.y, rr * .72, 0, Math.PI * 2); g.fill();
        }
        g.restore();
      }

      const spr = ART.star(s.star.c, s.star.r);
      const sz = spr.width * clamp(z*1.5, .28, 1.5);
      g.globalAlpha = vis ? 1 : .48;
      g.imageSmoothingEnabled = true;
      g.drawImage(spr, p.x-sz/2, p.y-sz/2, sz, sz);
      g.imageSmoothingEnabled = false;

      if (s.owner >= 0){
        g.strokeStyle = G.emps[s.owner].col; g.lineWidth = 1.4;
        g.beginPath(); g.arc(p.x,p.y, sr+6, 0, Math.PI*2); g.stroke();
      }
      // taranmamış işareti
      if (!pSurv(s) && z > .2){
        g.fillStyle = 'rgba(139,123,255,.9)';
        g.font = 'bold 9px ui-monospace,monospace'; g.textAlign='center';
        g.fillText('?', p.x, p.y - sr - 7);
      }
      /* FAZ 17: ANOMALİ İŞARETİ
         Anomali yalnızca sistem GÖRÜLDÜĞÜNDE ama HENÜZ TARANMADIĞINDA
         belli olur — keşif merakını canlı tutar. Nabız gibi atar. */
      if (s.anom && pSeen(s) && !pSurv(s) && z > .18){
        const puls = .55 + .45 * Math.sin(t / 380 + s.id);
        /* Tür rengi: oyuncu neyle karşılaşacağını sezsin */
        const AK = (typeof ANOM_KINDS !== 'undefined' && ANOM_KINDS[s.anomK])
          ? ANOM_KINDS[s.anomK] : null;
        /* HOTFIX 23.1 — SİYAH EKRANIN SEBEBİ BURASIYDI.
           hex() ART modülünün IIFE kapsamı içinde tanımlı; View.draw
           içinden erişilemiyor ve "hex is not defined" fırlatıyordu.
           Hata yalnızca GÖRÜLMÜŞ ama TARANMAMIŞ bir anomali ekranda
           olduğunda tetiklendiği için oyunun 3-4. ayında ortaya
           çıkıyor ve o karede tüm çizimi öldürüyordu.
           ART.hexOf üzerinden güvenli erişim + yedek renk. */
        let arc = [255, 155, 61];
        if (AK && AK.col){
          if (typeof ART !== 'undefined' && typeof ART.hexOf === 'function')
            arc = ART.hexOf(AK.col) || arc;
        }
        g.strokeStyle = 'rgba(' + arc.join(',') + ',' + (puls * .9).toFixed(2) + ')';
        g.lineWidth = 1.4;
        g.beginPath(); g.arc(p.x, p.y, sr + 9, 0, Math.PI * 2); g.stroke();
        if (z > .30){
          g.fillStyle = 'rgba(255,155,61,' + puls.toFixed(2) + ')';
          g.font = 'bold 10px ui-monospace,monospace'; g.textAlign = 'center';
          g.fillText('◈', p.x, p.y + sr + (showName ? 24 : 12));
        }
      }
      if (s.queue.length && s.owner===0 && z>.22){
        g.fillStyle = '#ff9b3d';
        g.fillRect(p.x+sr+3, p.y-2, 3, 4);
      }
      if (showName){
        /* ═══ FAZ 62: OKUNABİLİRLİK ═══
           9 px çok küçüktü ve dış hat yoktu; gezegen diskinin
           üstüne düşünce yazı kayboluyordu. 11 px'e çıkarıldı,
           koyu dış hat eklendi ve gezegenin ALTINA, disk yarıçapı
           kadar uzağa kaydırıldı. Ad KISALTILMIYOR. */
        g.font = '600 11px ui-monospace,monospace';
        g.textAlign = 'center';
        g.textBaseline = 'top';
        const ty = p.y + sr + 6;
        /* FAZ 75: uzaklaşınca yazının arkasına koyu şerit —
           yıldız kalabalığında okunabilirlik. */
        if (z < .28){
          const w3 = g.measureText(s.name).width;
          g.fillStyle = 'rgba(5,8,16,.62)';
          g.fillRect(p.x - w3/2 - 3, ty - 1, w3 + 6, 12);
        }
        g.lineWidth = 3;
        g.lineJoin = 'round';
        g.strokeStyle = 'rgba(4,7,14,.92)';
        g.strokeText(s.name, p.x, ty);
        g.fillStyle = s.owner>=0
          ? ((MAP_MODE === 'diplomasi' || MAP_MODE === 'savas')
              ? diploColor(G.emps[s.owner]) : G.emps[s.owner].col)
          : 'rgba(214,228,246,.95)';
        g.fillText(s.name, p.x, ty);
        g.textBaseline = 'alphabetic';
        if (pSurv(s) && z > .42){
          const hab = s.planets.filter(pl=>PLANETS[pl.t].k==='hab').length;
          if (hab){
            g.fillStyle = 'rgba(101,224,138,.85)'; g.font='8px ui-monospace,monospace';
            g.fillText('◍'.repeat(Math.min(hab,4)), p.x, p.y + sr + 22);
          }
        }
      }
      // sistem dayanıklılığı: savunma + koloni morali
      const sdef = sysDefense(s);
      if (seen && z > .19 && (sdef > 0 || s.cr > 0)){
        let stabSum = 0, cols = 0;
        for (const pp of s.planets) if (pp.col){ stabSum += pp.col.stab; cols++; }
        const morale = cols ? stabSum/cols/100 : 1;
        const bw = 30, bx = p.x - bw/2;
        let by = p.y - sr - 16;
        // savunma çubuğu
        if (sdef > 0){
          const full = clamp(sdef/720, 0, 1);
          g.fillStyle = 'rgba(5,7,15,.9)'; g.fillRect(bx-1, by-1, bw+2, 5);
          g.fillStyle = '#6ff2c8'; g.fillRect(bx, by, bw*full, 3);
          g.strokeStyle = 'rgba(120,150,190,.55)'; g.lineWidth = .6;
          g.strokeRect(bx-1, by-1, bw+2, 5);
          if (z > .4){
            g.font = '7px ui-monospace,monospace'; g.textAlign = 'right';
            g.fillStyle = '#6ff2c8'; g.fillText('KLK', bx-3, by+4);
          }
          by -= 7;
        }
        // moral çubuğu — çatışmada veya moral düşükken görünür
        if (cols && (s.cr > 0 || morale < .55)){
          g.fillStyle = 'rgba(5,7,15,.9)'; g.fillRect(bx-1, by-1, bw+2, 5);
          g.fillStyle = morale > .55 ? '#65e08a' : morale > .28 ? '#ff9b3d' : '#ff5f6d';
          g.fillRect(bx, by, bw*clamp(morale,0,1), 3);
          g.strokeStyle = 'rgba(120,150,190,.55)'; g.lineWidth = .6;
          g.strokeRect(bx-1, by-1, bw+2, 5);
          if (z > .4){
            g.font = '7px ui-monospace,monospace'; g.textAlign = 'right';
            g.fillStyle = g.fillStyle; g.fillText('MRL', bx-3, by+4);
          }
          if (morale < .28 && s.cr > 0 && z > .3){
            g.font = 'bold 8px ui-monospace,monospace'; g.textAlign = 'center';
            g.fillStyle = '#ff5f6d';
            g.fillText('TESLİM RİSKİ', p.x, by - 4);
          }
        }
        g.textAlign = 'center';
      }
      /* ═══ FAZ 47: TERSANE GÖSTERGESİ ═══
         Kendi sistemlerinde daima; yabancı sistemlerde yalnız
         2. seviye istihbaratla görünür. Tersane sayısı gemi
         inşa kapasitesini gösterir — düşmanın nerede filo
         basabildiğini bilmek stratejik bilgidir. */
      if (seen && z > .26){
        let yard = 0;
        for (const pl2 of s.planets)
          if (pl2.col && pl2.col.b && pl2.col.b.tersane) yard += pl2.col.b.tersane;
        /* ═══ FAZ 60: ÇİFT İKON HATASI ═══
           Aynı ⚓×N göstergesi burada (solda, arka plansız) ve
           Faz 47'nin bloğunda (sağ üstte, arka planlı) OLMAK ÜZERE
           İKİ KEZ çiziliyordu. Üst üste binip okunmaz hale
           geliyordu. Bu eski kopya kaldırıldı; tek kaynak Faz 47
           bloğu (yardCount + yardVisible). */
      }

      // uzay yapıları rozeti
      /* ═══ FAZ 47: TERSANE GÖSTERGESİ ═══
         Sistem adının sağ üstünde ⚓ ×N. Kendi sistemlerimizde
         daima, yabancıda 2. seviye istihbaratla. */
      if (seen && z > .20 && typeof yardCount === 'function'){
        const yn = yardCount(s);
        if (yn > 0 && yardVisible(s)){
          g.save();
          g.font = '10px ui-monospace,monospace';
          g.textAlign = 'left';
          const yazi = '⚓×' + yn;
          const w = g.measureText(yazi).width;
          g.fillStyle = 'rgba(6,10,18,.70)';
          g.fillRect(p.x + sr + 3, p.y - sr - 12, w + 6, 13);
          g.fillStyle = s.owner === 0 ? '#6ff2c8' : '#ff9b3d';
          g.fillText(yazi, p.x + sr + 6, p.y - sr - 2);
          g.restore();
          g.textAlign = 'center';
        }
      }

      if (seen && z > .22 && (s.built || (s.work && s.work.length))){
        const items = [];
        if (s.built) for (const k in s.built) if (STRUCTS[k] && s.built[k] !== undefined) items.push({ico:STRUCTS[k].ico, done:true, own:s.built[k]});
        if (s.work) s.work.forEach(w=>{ if (STRUCTS[w.key]) items.push({ico:STRUCTS[w.key].ico, done:false}); });
        g.font = '10px ui-monospace,monospace'; g.textAlign = 'left';
        items.slice(0,4).forEach((it,ix)=>{
          g.globalAlpha = it.done ? 1 : .55;
          g.fillStyle = it.done ? (G.emps[it.own] ? G.emps[it.own].col : '#6ff2c8') : '#ff9b3d';
          g.fillText(it.ico, p.x + sr + 5, p.y - 4 + ix*10);
        });
        g.globalAlpha = 1;
        g.textAlign = 'center';
      }
      // kayıp uygarlık kalıntısı
      if (s.ruin && seen){
        const ph3 = (Math.sin(t/420)+1)/2;
        g.strokeStyle = 'rgba(139,123,255,' + (.45+ph3*.4) + ')';
        g.lineWidth = 2;
        g.beginPath(); g.arc(p.x, p.y, sr+13, 0, Math.PI*2); g.stroke();
        if (z > .2){
          g.font = 'bold 12px ui-monospace,monospace'; g.textAlign = 'center';
          g.fillStyle = s.ruin.awake ? '#ff5f6d' : '#8b7bff';
          g.fillText('🏺', p.x, p.y - sr - 6);
        }
      }
      // korsan yuvası işareti
      if (s.nest && seen){
        const ph2 = (Math.sin(t/320)+1)/2;
        g.strokeStyle = 'rgba(138,47,63,' + (.5+ph2*.4) + ')';
        g.lineWidth = 2;
        g.beginPath(); g.arc(p.x, p.y, sr+11, 0, Math.PI*2); g.stroke();
        if (z > .2){
          g.font = 'bold 12px ui-monospace,monospace'; g.textAlign = 'center';
          g.fillStyle = '#ff5f6d';
          g.fillText('☠', p.x, p.y - sr - 6);
        }
      }
      // ÇATIŞMA İŞARETİ — sistemde savaş varsa çok belirgin göster
      if (s.cr > 0 && seen){
        const ph = (Math.sin(t/150)+1)/2;
        const rr = sr + 16 + ph*7;
        g.strokeStyle = 'rgba(255,95,109,' + (.55 + ph*.45) + ')';
        g.lineWidth = 2.4;
        g.beginPath(); g.arc(p.x, p.y, rr, 0, Math.PI*2); g.stroke();
        g.strokeStyle = 'rgba(255,155,61,' + (.25 + ph*.35) + ')';
        g.lineWidth = 1.4;
        g.beginPath(); g.arc(p.x, p.y, rr + 8, 0, Math.PI*2); g.stroke();
        if (z > .16){
          g.font = 'bold 15px ui-monospace,monospace';
          g.textAlign = 'center';
          g.fillStyle = 'rgba(255,95,109,' + (.7 + ph*.3) + ')';
          g.fillText('⚔', p.x, p.y - sr - 15);
          g.font = 'bold 8px ui-monospace,monospace';
          g.fillStyle = '#ff9b3d';
          g.fillText(RANGE_NAMES[s.cr] || '', p.x, p.y - sr - 27);
        }
      }
      if (this.selSys === s){
        g.strokeStyle = '#6ff2c8'; g.lineWidth = 1.6;
        const rr = sr+11 + Math.sin(t/260)*1.8;
        g.beginPath(); g.arc(p.x,p.y,rr,0,Math.PI*2); g.stroke();
      }
      g.globalAlpha = 1;
    }

    /* ═══════════════════════════════════════════════════════════
       FAZ 47 — ASKERİ MOD: İSTİHBARAT KADEMELİ ROTA VEKTÖRLERİ
       Seviye 0-1 → yalnız nokta, rota gizli
       Seviye 2   → hedef sistem + kesikli ok
       Seviye 3   → güç ve varış süresi (ETA) de listelenir
       Yalnız EKRANDA GÖRÜNEN hareketli filolar taranır. */
    if (MAP_MODE === 'askeri' || RADAR_ON){
      g.save();
      g.textAlign = 'left';
      g.textBaseline = 'middle';
      for (const f of G.fleets){
        if (!f.mv || !f.ships || !f.ships.length) continue;
        if (!this.fleetVisible(f)) continue;
        const p0 = this.w2s(f.x, f.y);
        /* FAZ 64: rota etiketi sağa doğru ~140 px uzayabiliyor */
        if (p0.x < -140 || p0.y < -140 ||
            p0.x > this.vw+140 || p0.y > this.vh+140) continue;

        const kendi = f.e === 0;
        /* FAZ 66: radar havuzlanmış istihbaratı kullanır —
           casusluk ağı paktı olan ortağın gördüğünü sen de
           görürsün. */
        const lvl = kendi ? 3
          : (typeof pooledIntel === 'function' ? pooledIntel(G.p, f.e)
             : (typeof intelOf === 'function' ? intelOf(G.p, f.e) : 0));
        /* FAZ 63: gemi modunda GÖRÜŞ yeterli — istihbarat aranmaz;
           askeri modda kademeli gizlilik korunur. */
        if (RADAR_ON){
          /* Radar görüşe dayanır: gördüğün her filoyu izlersin.
             İstihbarat seviyesi yalnız ETİKET AYRINTISINI belirler
             (aşağıda), rotanın görünmesini değil. */
          if (!kendi && lvl < 1 && !pVis(G.sys[f.sys >= 0 ? f.sys :
              (f.mv ? f.mv.to : 0)])) continue;
        } else if (lvl < 2) continue;       // askeri mod: kademeli gizlilik

        const hedef = G.sys[f.mv.to];
        if (!hedef) continue;
        const p1 = this.w2s(hedef.x, hedef.y);
        const fe = G.emps[f.e];
        const renk = fe && !fe.dead ? fe.col : '#8fa8c8';

        /* Kesikli rota çizgisi */
        g.strokeStyle = renk;
        g.globalAlpha = .70;
        g.lineWidth = 1.3;
        g.setLineDash([4, 4]);
        g.lineDashOffset = -(t / 55) % 8;
        g.beginPath(); g.moveTo(p0.x, p0.y); g.lineTo(p1.x, p1.y); g.stroke();
        g.setLineDash([]);

        /* Ok ucu */
        const ang = Math.atan2(p1.y - p0.y, p1.x - p0.x);
        const ux = p1.x - Math.cos(ang) * 12, uy = p1.y - Math.sin(ang) * 12;
        g.fillStyle = renk;
        g.beginPath();
        g.moveTo(ux + Math.cos(ang)*8, uy + Math.sin(ang)*8);
        g.lineTo(ux + Math.cos(ang+2.6)*7, uy + Math.sin(ang+2.6)*7);
        g.lineTo(ux + Math.cos(ang-2.6)*7, uy + Math.sin(ang-2.6)*7);
        g.closePath(); g.fill();
        g.globalAlpha = 1;

        /* Etiket */
        if (z > .06){
          let etiket = (f.name || 'Filo') + ' ➔ ' + hedef.name;
          if (lvl >= 3){
            const guc = Math.round(fleetPower(f));
            const hiz = fleetSpeed(f);
            const kalan = Math.hypot(hedef.x - f.x, hedef.y - f.y);
            const eta = hiz > 0 ? Math.max(1, Math.round(kalan / hiz / 30)) : 0;
            etiket += '  ⚔' + guc + ' · ' + eta + ' ay';
          }
          /* ═══ FAZ 55: ROTA ÜSTÜNDE TEDARİK ═══
             Kendi filolarımızda daima; düşmanda 3. seviye
             istihbaratla. Zayıf hat kırmızı yazılır. */
          let supRenk = null;
          if (typeof fleetSupply === 'function' && (kendi || lvl >= 3)){
            const sup = fleetSupply(fe, f);
            if (sup < 1){
              etiket += '  📦%' + Math.round(sup * 100);
              supRenk = sup >= .7 ? '#f2d452' : sup >= .55 ? '#ff9b3d' : '#ff5f6d';
            }
          }
          g.font = '10px ui-monospace,monospace';
          const w = g.measureText(etiket).width;
          g.fillStyle = 'rgba(6,10,18,.72)';
          g.fillRect(p0.x + 9, p0.y - 8, w + 8, 15);
          /* Tedarik zayıfsa etiket uyarı renginde yazılır */
          g.fillStyle = supRenk || renk;
          g.fillText(etiket, p0.x + 13, p0.y);
        }
      }
      g.restore();
      g.textAlign = 'center';
      g.textBaseline = 'alphabetic';
    }

    /* ═══ FAZ 46: BÖLGE ADLARI ═══
       Siyasi haritada her imparatorluğun hakimiyet ağırlık
       merkezine TAM adı saydam yazılır. Ağırlık merkezi ayda
       bir hesaplanıp önbelleğe alınır — her karede sistem
       taraması yapılmaz. */
    if (politik && z > .022){
      if (this._bolgeAt !== G.day){
        this._bolgeAt = G.day;
        const acc = {};
        for (const sy of G.sys){
          if (sy.owner < 0) continue;
          const a = acc[sy.owner] || (acc[sy.owner] = {x:0, y:0, n:0});
          a.x += sy.x; a.y += sy.y; a.n++;
        }
        this._bolge = [];
        for (const id in acc){
          const a = acc[id], em = G.emps[id];
          if (!em || em.dead || em.wild || em.crisisSide) continue;
          if (a.n < 2) continue;               // tek sistemli devlete etiket yok
          this._bolge.push({x:a.x/a.n, y:a.y/a.n, name:em.name, col:em.col, n:a.n});
        }
      }
      if (this._bolge && this._bolge.length){
        g.save();
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        for (const b of this._bolge){
          if (!this.inView(b.x, b.y)) continue;
          const p2 = this.w2s(b.x, b.y);
          const fs = clamp(9 + b.n * .55, 10, 19);
          g.font = '600 ' + fs.toFixed(0) + 'px ui-monospace,monospace';
          /* Okunurluk için koyu dış hat + saydam dolgu */
          g.lineWidth = 3;
          g.strokeStyle = 'rgba(6,10,18,.75)';
          g.strokeText(b.name, p2.x, p2.y);
          g.fillStyle = b.col + 'cc';
          g.fillText(b.name, p2.x, p2.y);
        }
        g.restore();
      }
    }

    // filolar
    /* ═══════════════════════════════════════════════════════════
       FAZ 75 — GEMİ YIĞILMASI
       Aynı sistemde duran bilim + koloni + savaş filoları üst üste
       biniyor, harita okunmaz hale geliyordu. Artık DURAN filolar
       sistem başına toplanıp gezegen adının altına tek özet
       satırı olarak yazılıyor:  ⚔5.4K · 🛰×2 · 🚀×1
       Hareket HÂLİNDEKİ filolar tek tek çizilmeye devam ediyor —
       rota okunabilirliği önemli. Seçili filo da her zaman çizilir.
       ═══════════════════════════════════════════════════════════ */
    const yigin = {};
    if (!politik){
      for (const f of G.fleets){
        if (!this.fleetVisible(f) || f.mv || f === this.sel) continue;
        if (f.sys < 0 || !f.ships.length) continue;
        const anahtar = f.sys + '_' + f.e;
        const y = yigin[anahtar] || (yigin[anahtar] = {
          sys: f.sys, e: f.e, guc: 0, bilim: 0, koloni: 0, sav: 0, insa: 0
        });
        if (isArmed(f)){ y.sav++; y.guc += fleetPower(f); }
        else if (fleetHasRole(f, 'bilim')) y.bilim++;
        else if (f.ships.some(sh => sh.c === 'ins')) y.insa++;
        else y.koloni++;
      }
    }
    /* Yığın oluşan sistemlerdeki duran filolar tek tek çizilmez */
    const gizli = new Set();
    for (const k in yigin){
      const y = yigin[k];
      if (y.sav + y.bilim + y.koloni + y.insa < 2) continue;   // tek filo yığın değil
      gizli.add(k);
    }

    for (const f of G.fleets){
      if (!this.fleetVisible(f)) continue;
      /* FAZ 75: yığına düşen duran filo atlanır */
      if (!f.mv && f !== this.sel && f.sys >= 0 &&
          gizli.has(f.sys + '_' + f.e)) continue;
      const p = this.w2s(f.x, f.y);
      /* FAZ 64: 40 → 120. Filo ikonunun ALTINA güç ve durum
         yazısı düşüyor; 40 px payla o yazılar kenarda kesiliyordu. */
      if (p.x<-120||p.y<-120||p.x>this.vw+120||p.y>this.vh+120) continue;
      /* FAZ 45: siyasi haritada filo modelleri çizilmez — bu
         zoom'da zaten birkaç piksel. Yalnız hareket hâlindekiler
         renkli birer nokta olarak görünür ki cepheler okunsun. */
      if (politik){
        if (!f.mv) continue;
        const fe = G.emps[f.e];
        g.fillStyle = fe && !fe.dead ? fe.col : '#8fa8c8';
        g.fillRect(p.x - 1.5, p.y - 1.5, 3, 3);
        continue;
      }
      /* Tek bir filonun hatası haritayı karartmasın */
      try { this.drawFleet(g, f, p, t); }
      catch(err){ if (!this._fxWarn){ this._fxWarn = 1; console.warn('drawFleet:', err); } }
    }

    /* FAZ 75: yığın özet satırlarını çiz */
    if (!politik){
      g.save();
      g.textAlign = 'center';
      g.font = 'bold 10px ui-monospace,monospace';
      g.lineWidth = 3; g.lineJoin = 'round';
      for (const k of gizli){
        const y = yigin[k];
        const sy = G.sys[y.sys];
        if (!sy || !this.inView(sy.x, sy.y)) continue;
        const fe = G.emps[y.e];
        if (!fe || fe.dead) continue;
        const parca = [];
        if (y.sav)    parca.push('⚔' + fmt(y.guc));
        if (y.bilim)  parca.push('🛰×' + y.bilim);
        if (y.koloni) parca.push('🚀×' + y.koloni);
        if (y.insa)   parca.push('🔧×' + y.insa);
        if (!parca.length) continue;
        const txt = parca.join(' · ');
        const p2 = this.w2s(sy.x, sy.y);
        const sr2 = Math.max(2.2, sy.star.r * this.cam.z * 1.5);
        const ty = p2.y + sr2 + 20;
        /* Arka plan şeridi — sistem adıyla karışmasın */
        const w = g.measureText(txt).width;
        g.fillStyle = 'rgba(5,8,16,.72)';
        g.fillRect(p2.x - w/2 - 4, ty - 8, w + 8, 13);
        g.strokeStyle = 'rgba(4,7,14,.92)';
        g.strokeText(txt, p2.x, ty);
        g.fillStyle = fe.col;
        g.fillText(txt, p2.x, ty);
      }
      g.restore();
      g.textAlign = 'center';
    }

    /* ═══ FAZ 60: RALLY LOJİSTİK HATTI ═══
       Seçili tersane ile toplanma noktası arasında ince, akan
       kesik çizgi. Yalnız seçili sistemde çizilir — harita
       kalabalıklaşmaz. */
    if (this.selSys && this.selSys.rally && this.selSys.rally[0]){
      const ral = this.selSys.rally[0];
      const hedefF = ral.fleet !== undefined
        ? G.fleets.find(f2 => f2.id === ral.fleet && f2.ships.length) : null;
      let hx, hy;
      if (hedefF){ hx = hedefF.x; hy = hedefF.y; }
      else if (ral.sys !== undefined && G.sys[ral.sys]){
        hx = G.sys[ral.sys].x; hy = G.sys[ral.sys].y;
      }
      if (hx !== undefined){
        const a = this.w2s(this.selSys.x, this.selSys.y);
        const b = this.w2s(hx, hy);
        g.save();
        g.strokeStyle = 'rgba(111,242,200,.60)';
        g.lineWidth = 1.2;
        g.setLineDash([5, 5]);
        g.lineDashOffset = -(t / 42) % 10;      // akan çizgi
        g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke();
        g.setLineDash([]);
        /* Hedef ucunda küçük halka */
        g.strokeStyle = 'rgba(111,242,200,.85)';
        g.beginPath(); g.arc(b.x, b.y, 6, 0, Math.PI*2); g.stroke();
        g.fillStyle = 'rgba(111,242,200,.85)';
        g.font = '9px ui-monospace,monospace';
        g.textAlign = 'center';
        g.fillText('📍', b.x, b.y - 9);
        g.restore();
        g.textAlign = 'center';
      }
    }

    /* ═══════════════════════════════════════════════════════════
       FAZ 63 — GEMİ MODU: TÜM RALLİ HATLARI
       Normalde yalnız seçili tersanenin hattı çizilir; bu modda
       hepsi birden görünür — lojistik ağının tamamı tek bakışta.
       ═══════════════════════════════════════════════════════════ */
    if (RADAR_ON){
      g.save();
      g.strokeStyle = 'rgba(111,242,200,.42)';
      g.lineWidth = 1.1;
      g.setLineDash([4, 6]);
      g.lineDashOffset = -(t / 50) % 10;
      for (const sy of G.sys){
        if (!sy.rally || !sy.rally[0]) continue;
        const ral = sy.rally[0];
        const hf = ral.fleet !== undefined
          ? G.fleets.find(q => q.id === ral.fleet && q.ships.length) : null;
        let hx, hy;
        if (hf){ hx = hf.x; hy = hf.y; }
        else if (ral.sys !== undefined && G.sys[ral.sys]){
          hx = G.sys[ral.sys].x; hy = G.sys[ral.sys].y;
        }
        if (hx === undefined) continue;
        if (!this.inView(sy.x, sy.y) && !this.inView(hx, hy)) continue;
        const a = this.w2s(sy.x, sy.y), b = this.w2s(hx, hy);
        g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke();
      }
      g.setLineDash([]);
      g.restore();
    }

    /* ═══════════════════════════════════════════════════════════
       FAZ 63 — SAVAŞ MODU: HUSUMET AĞI
       Savaşan her devlet çiftinin BAŞKENTLERİ arasına kırmızı,
       nabız atan bir hat çizilir. Kim kiminle savaşıyor, tek
       bakışta okunur. Kendi savaşlarımız daha parlak.
       ═══════════════════════════════════════════════════════════ */
    if (MAP_MODE === 'savas'){
      g.save();
      const nb = .55 + .45 * Math.sin(t / 320);
      const cizildi = {};
      for (const a of G.emps){
        if (a.dead || a.wild || a.crisisSide) continue;
        for (const wid in a.war){
          if (!a.war[wid]) continue;
          const b = G.emps[wid];
          if (!b || b.dead || b.wild || b.crisisSide) continue;
          const anahtar = Math.min(a.id, b.id) + '_' + Math.max(a.id, b.id);
          if (cizildi[anahtar]) continue;
          cizildi[anahtar] = 1;
          const sa = G.sys[a.home], sb2 = G.sys[b.home];
          if (!sa || !sb2) continue;
          /* Görüş: en az bir tarafı tanımalıyız */
          if (!G.p.contact[a.id] && !G.p.contact[b.id] && a.id !== 0 && b.id !== 0)
            continue;
          if (!this.inView(sa.x, sa.y) && !this.inView(sb2.x, sb2.y)) continue;
          const bizim = (a.id === 0 || b.id === 0);
          const pa = this.w2s(sa.x, sa.y), pb = this.w2s(sb2.x, sb2.y);
          g.strokeStyle = bizim
            ? 'rgba(255,95,109,' + (nb * .95).toFixed(2) + ')'
            : 'rgba(255,95,109,' + (nb * .38).toFixed(2) + ')';
          g.lineWidth = bizim ? 2.4 : 1.3;
          g.setLineDash(bizim ? [] : [7, 5]);
          g.beginPath(); g.moveTo(pa.x, pa.y); g.lineTo(pb.x, pb.y); g.stroke();
          /* Orta noktada çatışma işareti */
          if (bizim){
            const mx = (pa.x + pb.x) / 2, my = (pa.y + pb.y) / 2;
            g.fillStyle = 'rgba(255,95,109,' + nb.toFixed(2) + ')';
            g.font = 'bold 13px ui-monospace,monospace';
            g.textAlign = 'center';
            g.fillText('⚔', mx, my + 4);
          }
        }
      }
      g.setLineDash([]);
      g.restore();
      g.textAlign = 'center';
    }

    /* ═══════════════════════════════════════════════════════════
       FAZ 81 — DİNAMİK LOJİSTİK AĞI
       Lojistik modu açıkken bir filo seçiliyse harita o filonun
       BESLENME AĞINA dönüşür:
         · ulaşabildiği sistemler arası hiper yollar parlak yeşil
         · menzil dışı yollar soluk kırmızı
         · ikmal limanları (tedarik tazeleyebileceği noktalar) ⚓
       Hesap günde bir yapılıp f._logiNet'e yazılıyor; her karede
       yalnız çizim var, pathfinding yok.
       ═══════════════════════════════════════════════════════════ */
    if (MAP_MODE === 'askeri' && this.sel && this.sel.ships &&
        this.sel.ships.length && this.sel.sys >= 0 &&
        typeof fleetSupply === 'function' && !this.politik){
      const f = this.sel;
      const fe = G.emps[f.e];
      if (fe && !fe.dead){
        if (f._logiAt !== G.day){
          f._logiAt = G.day;
          const ulasilir = new Set(), liman = [];
          for (const sy of G.sys){
            if (f.e === 0 && !sy.seen.includes(0)) continue;
            const sup = fleetSupply(fe, {sys: sy.id, ships: f.ships, e: f.e});
            if (sup >= .70) ulasilir.add(sy.id);
            /* İkmal limanı: tedariki tam tazeleyen nokta */
            if (typeof isSupplyNode === 'function' && isSupplyNode(fe, sy))
              liman.push(sy.id);
          }
          f._logiNet = ulasilir;
          f._logiPort = liman;
        }
        const net = f._logiNet || new Set();
        const portlar = f._logiPort || [];
        g.save();
        /* Hiper yolları ikmal durumuna göre boya */
        for (const sy of G.sys){
          if (!this.inView(sy.x, sy.y)) continue;
          for (const l of sy.lanes){
            if (l < sy.id) continue;
            const o2 = G.sys[l];
            if (!o2) continue;
            const ikiUcu = net.has(sy.id) && net.has(l);
            const birUcu = net.has(sy.id) || net.has(l);
            const a = this.w2s(sy.x, sy.y), b = this.w2s(o2.x, o2.y);
            if (ikiUcu){
              g.strokeStyle = 'rgba(111,242,200,.72)';
              g.lineWidth = Math.max(1.4, z * 2.2);
            } else if (birUcu){
              g.strokeStyle = 'rgba(242,212,82,.34)';       // sınır hattı
              g.lineWidth = Math.max(.9, z * 1.4);
            } else {
              g.strokeStyle = 'rgba(255,95,109,.16)';       // menzil dışı
              g.lineWidth = Math.max(.6, z * 1);
            }
            g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke();
          }
        }
        /* İkmal limanları — çapa işareti */
        g.font = 'bold 12px ui-monospace,monospace';
        g.textAlign = 'center';
        const nb2 = .6 + .4 * Math.sin(t / 400);
        for (const pid of portlar){
          const sy = G.sys[pid];
          if (!sy || !this.inView(sy.x, sy.y)) continue;
          const p3 = this.w2s(sy.x, sy.y);
          g.strokeStyle = 'rgba(111,242,200,' + nb2.toFixed(2) + ')';
          g.lineWidth = Math.max(1, z * 1.6);
          g.beginPath(); g.arc(p3.x, p3.y, 11, 0, Math.PI*2); g.stroke();
          g.fillStyle = 'rgba(111,242,200,.9)';
          g.fillText('⚓', p3.x, p3.y - 13);
        }
        /* Özet şerit */
        g.fillStyle = 'rgba(5,8,16,.72)';
        g.fillRect(6, this.vh - 30, 250, 20);
        g.fillStyle = 'rgba(111,242,200,.9)';
        g.font = '10px ui-monospace,monospace';
        g.textAlign = 'left';
        g.fillText('⚓ ' + net.size + ' sistem beslenebilir · ' +
                   portlar.length + ' ikmal limanı', 12, this.vh - 16);
        g.restore();
        g.textAlign = 'center';
      }
    }

    /* ═══════════════════════════════════════════════════════════
       FAZ 77E — MENZİL HARESİ (node tabanlı)
       ESKİSİ YANLIŞTI: kuş uçuşu devasa bir çember çiziliyordu.
       Oyun hiper yol (node) tabanlı — Öklid mesafesinin oyunda
       hiçbir karşılığı yok. Çember kaldırıldı.

       Yerine: seçili filonun ikmali kopmadan ulaşabileceği HER
       SİSTEMİN etrafına küçük parlak bir hare. Menzil gerçek
       fleetSupply hesabından geliyor, günlük önbellekli (f._opAt)
       — her karede tarama yok, yalnız listeyi çiziyoruz.
       ═══════════════════════════════════════════════════════════ */
    if (RADAR_ON && this.sel && this.sel.ships && this.sel.ships.length &&
        this.sel.sys >= 0 && typeof fleetSupply === 'function'){
      const f = this.sel;
      const fe = G.emps[f.e];
      if (fe && !fe.dead){
        /* Menzildeki sistemleri günde bir hesapla */
        if (f._opAt !== G.day){
          f._opAt = G.day;
          const liste = [];
          for (const sy of G.sys){
            if (!sy.seen.includes(f.e) && f.e === 0) continue;   // görmediğimiz yer
            const sup = fleetSupply(fe, {sys: sy.id, ships: f.ships, e: f.e});
            if (sup >= .55) liste.push(sy.id);                   // savaşabilir
          }
          f._opList = liste;
        }
        const liste = f._opList || [];
        if (liste.length){
          g.save();
          const nb = .55 + .45 * Math.sin(t / 380);
          for (const sid of liste){
            const sy = G.sys[sid];
            if (!sy || !this.inView(sy.x, sy.y)) continue;
            const p2 = this.w2s(sy.x, sy.y);
            const rr = Math.max(4, this.starR ? this.starR(sy)
                       : Math.max(2.2, sy.star.r * this.cam.z * 1.5)) + 5;
            /* Dış hare */
            g.strokeStyle = 'rgba(111,242,200,' + (nb * .55).toFixed(2) + ')';
            g.lineWidth = Math.max(.9, this.cam.z * 1.4);
            g.beginPath(); g.arc(p2.x, p2.y, rr, 0, Math.PI * 2); g.stroke();
            /* İç dolgu — çok soluk */
            g.fillStyle = 'rgba(111,242,200,' + (nb * .10).toFixed(2) + ')';
            g.beginPath(); g.arc(p2.x, p2.y, rr, 0, Math.PI * 2); g.fill();
          }
          /* Filonun kendi sistemi vurgulu */
          const kendi = G.sys[f.sys];
          if (kendi && this.inView(kendi.x, kendi.y)){
            const pk = this.w2s(kendi.x, kendi.y);
            g.strokeStyle = 'rgba(111,242,200,.9)';
            g.lineWidth = Math.max(1.4, this.cam.z * 2);
            g.beginPath(); g.arc(pk.x, pk.y, 9, 0, Math.PI * 2); g.stroke();
          }
          /* Sayaç etiketi */
          g.fillStyle = 'rgba(111,242,200,.85)';
          g.font = '10px ui-monospace,monospace';
          g.textAlign = 'left';
          g.fillText('📡 menzilde ' + liste.length + ' sistem', 10, this.vh - 12);
          g.restore();
          g.textAlign = 'center';
        }
      }
    }

    this.drawPings(g, t);               // FAZ 47: bildirim ping halkası

    // rota işaretleri
    for (let i=this.flash.length-1;i>=0;i--){
      const fl = this.flash[i];
      fl.t += 1;
      const p = this.w2s(fl.x, fl.y);
      const a = 1 - fl.t/fl.life;
      if (a <= 0){ this.flash.splice(i,1); continue; }
      g.strokeStyle = 'rgba(255,'+(120+a*120|0)+',80,'+a+')';
      g.lineWidth = 2;
      g.beginPath(); g.arc(p.x,p.y, (1-a)*26+4, 0, Math.PI*2); g.stroke();
    }

    // muharebe efektleri: atış izleri, patlamalar, kalkan darbeleri
    if (G.fx && G.fx.length){
      let oldu = false;
      for (let i=G.fx.length-1;i>=0;i--){
        const e2 = G.fx[i];
        e2.age++;
        const a = 1 - e2.age/e2.life;
        /* FAZ 21: splice yok — ölü işaretlenir, sonra tek geçişte
           havuza iade edilir. */
        if (a <= 0){ e2.dead = true; oldu = true; continue; }
        const p = this.w2s(e2.x, e2.y);
        if (p.x < -60 || p.y < -60 || p.x > this.vw+60 || p.y > this.vh+60) continue;
        if (e2.k === 'shot'){
          const q = this.w2s(e2.x2, e2.y2);
          const t = clamp(1-a, 0, 1);
          const hx = lerp(p.x, q.x, t), hy = lerp(p.y, q.y, t);
          const tx = lerp(p.x, q.x, Math.max(0,t-.22)), ty = lerp(p.y, q.y, Math.max(0,t-.22));
          g.strokeStyle = (e2.c || '#ffffff') + 'cc';
          g.lineWidth = 1.8;
          g.beginPath(); g.moveTo(tx,ty); g.lineTo(hx,hy); g.stroke();
        } else if (e2.k === 'boom'){
          const r = (1-a)*18 + 3;
          g.strokeStyle = 'rgba(255,'+(140+a*100|0)+',70,'+a+')';
          g.lineWidth = 2.2;
          g.beginPath(); g.arc(p.x,p.y,r,0,Math.PI*2); g.stroke();
          g.fillStyle = 'rgba(255,220,150,'+(a*.5)+')';
          g.beginPath(); g.arc(p.x,p.y,r*.35,0,Math.PI*2); g.fill();
        } else if (e2.k === 'shield'){
          g.strokeStyle = 'rgba(111,242,200,'+(a*.7)+')';
          g.lineWidth = 2;
          g.beginPath(); g.arc(p.x,p.y,(1-a)*30+12,0,Math.PI*2); g.stroke();
        }
      }
      if (oldu) fxCompact();      // FAZ 21: ölüleri havuza iade et
    }
  },

  drawFleet(g, f, p, t){
    /* HOTFIX 23.1: öksüz/bozuk filo çizimi tüm kareyi öldürmesin */
    if (!f || !f.ships || !f.ships.length) return;
    const e = G.emps[f.e];
    if (!e) return;
    /* FAZ 22: taarruz ordusu savaş filosundan ayrı okunsun —
       altına turuncu bir çıkarma çengeli çizilir. */
    const ordu = (typeof isTransport === 'function') && isTransport(f);
    const n = f.ships.length;
    const z = clamp(this.cam.z*2.4, .7, 2.2);
    const cls = f.ships.reduce((a,s)=> SHIPS[s.c].sz > SHIPS[a].sz ? s.c : a, f.ships[0].c);
    const spr = ART.ship(cls, e.col, 1);
    const sc = z * (this.sel===f ? 1.25 : 1);
    const w = spr.width*sc, h = spr.height*sc;
    let ang = 0;
    if (f.mv){
      const a = G.sys[f.mv.from], b = G.sys[f.mv.to];
      ang = Math.atan2(b.y-a.y, b.x-a.x) + Math.PI/2;
    }
    if (ordu){
      const r = Math.max(3, 5 * z);
      g.strokeStyle = '#ff9b3d';
      g.lineWidth = Math.max(1, z * .9);
      g.globalAlpha = .85;
      /* Aşağı bakan üçgen: "yüzeye inecek kuvvet" */
      g.beginPath();
      g.moveTo(p.x - r, p.y + r * .5);
      g.lineTo(p.x + r, p.y + r * .5);
      g.lineTo(p.x, p.y + r * 1.6);
      g.closePath(); g.stroke();
      g.globalAlpha = 1;
    }
    const drawOne = (ox,oy,s) => {
      g.save(); g.translate(p.x+ox, p.y+oy); g.rotate(ang);
      g.drawImage(spr, -w*s/2, -h*s/2, w*s, h*s); g.restore();
    };
    if (f.combat){
      g.strokeStyle = 'rgba(255,95,109,'+(.5+Math.sin(t/90)*.35)+')';
      g.lineWidth = 1.6;
      g.beginPath(); g.arc(p.x,p.y, 15, 0, Math.PI*2); g.stroke();
    }
    if (n <= 1) drawOne(0,0,1);
    else if (n <= 4){ drawOne(-w*.55,h*.2,.9); drawOne(w*.55,h*.2,.9); drawOne(0,-h*.25,1); }
    else { drawOne(-w*.8,h*.35,.8); drawOne(w*.8,h*.35,.8); drawOne(-w*.4,-h*.05,.9); drawOne(w*.4,-h*.05,.9); drawOne(0,-h*.5,1.05); }

    if (this.sel === f){
      g.strokeStyle = '#6ff2c8'; g.lineWidth = 1.5;
      const r = 14 + Math.sin(t/240)*2;
      g.beginPath(); g.arc(p.x,p.y,r,0,Math.PI*2); g.stroke();
    }
    // panelden işaretlenmiş filolar nabız gibi parlar
    if (this.hl && this.hl.has(f.id)){
      const ph = (Math.sin(t/180)+1)/2;
      g.strokeStyle = 'rgba(139,123,255,'+(.35+ph*.55)+')';
      g.lineWidth = 2;
      g.beginPath(); g.arc(p.x, p.y, 15 + ph*9, 0, Math.PI*2); g.stroke();
      g.strokeStyle = 'rgba(139,123,255,'+(.18+ph*.3)+')';
      g.beginPath(); g.arc(p.x, p.y, 24 + ph*13, 0, Math.PI*2); g.stroke();
    }
    if (this.cam.z > .18){
      const armed = isArmed(f);
      // gövde bütünlüğü barı — hasar görmüşse veya çatışmadaysa
      const hp = fleetHealth(f);
      if (hp < .995 || f.combat){
        const bw = Math.max(16, w*1.1), bx = p.x - bw/2, by = p.y + h*.9 + 2;
        g.fillStyle = 'rgba(5,7,15,.85)';
        g.fillRect(bx-1, by-1, bw+2, 5);
        g.fillStyle = hp > .6 ? '#65e08a' : hp > .3 ? '#ff9b3d' : '#ff5f6d';
        g.fillRect(bx, by, bw*clamp(hp,0,1), 3);
        g.strokeStyle = 'rgba(120,150,190,.5)'; g.lineWidth = .6;
        g.strokeRect(bx-1, by-1, bw+2, 5);
      }
      /* FAZ 62: filo gücü de dış hatlı ve daha büyük */
      g.font = 'bold 11px ui-monospace,monospace'; g.textAlign = 'center';
      const label = armed ? fmt(fleetPower(f)) : (fleetHasRole(f,'bilim')?'BİL':'KOL');
      const ly = p.y + h*.9 + 17;
      g.lineWidth = 3; g.lineJoin = 'round';
      g.strokeStyle = 'rgba(4,7,14,.92)';
      g.strokeText(label, p.x, ly);
      g.fillStyle = e.col;
      g.fillText(label, p.x, ly);
      if (f.e === 0 && this.cam.z > .34){
        const st = fleetStatus(f);
        if (st.c !== 'id'){
          g.font = 'bold 9px ui-monospace,monospace';
          g.strokeStyle = 'rgba(4,7,14,.92)';
          g.strokeText(st.t, p.x, ly + 11);
          g.fillStyle = st.c === 'ft' ? '#ff5f6d' : st.c === 'wk' ? '#8b7bff' : '#6ff2c8';
          g.fillText(st.t, p.x, ly + 11);
        }
      }
    }
  },

  boom(x,y){ this.flash.push({x,y,t:0,life:26}); }
};

