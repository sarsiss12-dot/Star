/* ═══════════════════════════════════════════════════════════════════
   YILDIZ HANEDANI · audio.js — İŞLEMSEL SES
   Hiçbir ses dosyası yok. Her şey Web Audio API ile matematiksel
   üretilir: ADSR zarfları, alçak geçiren filtreler ve yumuşak
   dalga biçimleriyle. Ham kare dalga kullanılmaz — kulak yorulmaz.

   YÜKLEME SIRASI: main.js'ten SONRA (storeSet/storeGet kullanır).
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

const AUDIO = (function(){

  let ctx = null;              // AudioContext (kullanıcı etkileşiminde doğar)
  let master = null;           // ana ses yolu
  let musicBus = null;         // müzik kanalı
  let sfxBus = null;           // efekt kanalı
  let convolver = null;        // yankı (prosedürel impulse)
  let started = false;
  let muted = false;
  let musicTimer = null;

  /* ── MÜZİKAL ÖLÇEK ──
     C Dorian: uzay teması için melankolik ama umutsuz olmayan bir
     kip. Minör üçlü + majör altılı; ne fazla neşeli ne matem.
     Frekanslar iki oktava yayılır ki melodi tekdüze olmasın. */
  const SCALE = [
    130.81, 146.83, 155.56, 174.61, 196.00, 220.00, 233.08,   // C3 Dorian
    261.63, 293.66, 311.13, 349.23, 392.00, 440.00, 466.16,   // C4
    523.25, 587.33, 622.25                                     // C5 (üst uç)
  ];
  /* Pedal (dem) notaları — arka planda duran kök sesler */


  /* ── YARDIMCILAR ── */
  function now(){ return ctx ? ctx.currentTime : 0; }

  /* Prosedürel yankı: rastgele gürültünün üstel sönümü.
     Dosya yok, iki saniyelik tampon matematikle doldurulur. */
  function makeImpulse(sn, decay){
    const rate = ctx.sampleRate;
    const len = Math.floor(rate * sn);
    const buf = ctx.createBuffer(2, len, rate);
    for (let ch = 0; ch < 2; ch++){
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++){
        /* Erken yansımalar seyrek, kuyruk yoğun — salon hissi */
        d[i] = (audioRand() * 2 - 1) * Math.pow(1 - i / len, decay);
      }
    }
    return buf;
  }

  // 96D: independent musical randomness and bounded, disconnectable voice groups.
  let randomState=0x96d151,offline=false,compressor=null,noise=null;
  let prefs={master:.65,music:.60,effects:.70,musicOn:true,effectsOn:true},prefsRevision=0;
  const groups=new Set(),waves=new Map(),limits={music:12,sfx:10};
  const stats={createdNodes:0,releasedNodes:0,peakMusic:0,peakSfx:0,bars:0};
  function audioRand(){randomState=(Math.imul(randomState,1664525)+1013904223)>>>0;return randomState/4294967296;}
  function active(kind,t=now()){return [...groups].filter(g=>g.kind===kind&&!g.closed&&g.start<=t+.001&&g.end>t).length;}
  function scheduledPeak(kind,start=-Infinity,end=Infinity){
    const pending=[...groups].filter(g=>g.kind===kind&&!g.closed&&g.end>start&&g.start<end);
    const points=pending.map(g=>Math.max(start,g.start));
    return Math.max(0,...points.map(t=>pending.filter(g=>g.start<=t&&g.end>t).length));
  }
  function room(kind,start,end){return scheduledPeak(kind,start,end)<limits[kind];}
  function track(nodes,sources,output,start,end,kind){
    const group={nodes,sources,output,start,end,kind,closed:false};groups.add(group);stats.createdNodes+=nodes.length;
    const close=()=>{if(group.closed)return;group.closed=true;groups.delete(group);for(const n of nodes)try{n.disconnect();}catch(e){}stats.releasedNodes+=nodes.length;};group.close=close;
    let left=sources.length;for(const s of sources)s.onended=()=>{if(--left===0)close();};
    if(kind==='music')stats.peakMusic=Math.max(stats.peakMusic,scheduledPeak(kind,start,end));else stats.peakSfx=Math.max(stats.peakSfx,scheduledPeak(kind,start,end));return group;
  }
  function stopVoices(kind,fade=.12){if(!ctx)return;const t=now();for(const g of [...groups]){
    if(kind&&g.kind!==kind)continue;
    try{g.output.gain.cancelScheduledValues(t);g.output.gain.setValueAtTime(Math.max(.0001,g.output.gain.value),t);g.output.gain.linearRampToValueAtTime(.0001,t+fade);}catch(e){}
    for(const s of g.sources)try{s.stop(t+fade+.01);}catch(e){}if(!fade)g.close();
  }}
  function ramp(param,target,seconds=.18){if(!ctx)return;const t=now();param.cancelScheduledValues(t);param.setValueAtTime(param.value,t);param.linearRampToValueAtTime(target,t+seconds);}
  function applyGains(){if(!ctx)return;ramp(master.gain,muted?0:prefs.master,.25);ramp(musicBus.gain,prefs.musicOn?prefs.music:0);ramp(sfxBus.gain,prefs.effectsOn?prefs.effects:0);}
  function sanitizePrefs(raw){const p={...prefs};for(const k of ['master','music','effects'])if(Number.isFinite(raw?.[k]))p[k]=Math.max(0,Math.min(1,raw[k]));for(const k of ['musicOn','effectsOn'])if(typeof raw?.[k]==='boolean')p[k]=raw[k];return p;}
  function configure(patch,persist=true){prefs=sanitizePrefs(patch);prefsRevision++;applyGains();if(!prefs.musicOn){cancelMusic();stopVoices('music');}else ensureMusic();if(!prefs.effectsOn)stopVoices('sfx');if(persist&&typeof storeSet==='function')try{storeSet('yh_audio_mix',JSON.stringify(prefs));}catch(e){}return {...prefs};}
  function controls(){return `<div class="audioControls96d" aria-label="Ses ayarları">${[['master','Ana ses'],['music','Müzik'],['effects','Efekt']].map(([key,label])=>`<label>${label}<input type="range" data-audio="${key}" aria-label="${label}" min="0" max="100" value="${Math.round(prefs[key]*100)}"></label>`).join('')}<div class="audioChecks96d"><label><input type="checkbox" data-audio="musicOn" ${prefs.musicOn?'checked':''}>Müzik açık</label><label><input type="checkbox" data-audio="effectsOn" ${prefs.effectsOn?'checked':''}>Efektler açık</label></div></div>`;}
  function init(context){
    if(ctx)return true;const AC=window.AudioContext||window.webkitAudioContext;if(!context&&!AC)return false;
    try{ctx=context||new AC();}catch(e){return false;}
    master=ctx.createGain();master.gain.value=muted?0:prefs.master;
    compressor=ctx.createDynamicsCompressor();compressor.threshold.value=-18;compressor.knee.value=18;compressor.ratio.value=4;compressor.attack.value=.015;compressor.release.value=.25;master.connect(compressor);compressor.connect(ctx.destination);
    convolver=ctx.createConvolver();convolver.buffer=makeImpulse(1.8,3);const wet=ctx.createGain();wet.gain.value=.16;convolver.connect(wet);wet.connect(master);
    musicBus=ctx.createGain();musicBus.gain.value=prefs.musicOn?prefs.music:0;musicBus.connect(master);musicBus.connect(convolver);
    sfxBus=ctx.createGain();sfxBus.gain.value=prefs.effectsOn?prefs.effects:0;sfxBus.connect(master);sfxBus.connect(convolver);
    noise=ctx.createBuffer(1,Math.round(ctx.sampleRate*2),ctx.sampleRate);const d=noise.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=audioRand()*2-1;
    return true;
  }
  function voice(o){
    if(!ctx||muted||!prefs.effectsOn)return;const t0=now()+(o.delay||0);
    const freq=Math.max(20,o.freq||220),A=Math.max(.004,o.a??.02),D=o.d??.18,S=o.s??.28,R=o.r??.35,hold=o.hold??.05,peak=Math.min(.4,o.gain??.25),end=t0+A+D+hold+R+.05;
    if(!room('sfx',t0,end))return;
    const osc=ctx.createOscillator(),lp=ctx.createBiquadFilter(),g=ctx.createGain(),nodes=[osc,lp,g],sources=[osc];osc.type=o.wave||'sine';osc.frequency.setValueAtTime(freq,t0);if(o.glide)osc.frequency.exponentialRampToValueAtTime(Math.max(20,o.glide),t0+A+D+hold);
    lp.type='lowpass';const fc=o.cut||freq*4+400;lp.frequency.setValueAtTime(Math.max(180,fc*.55),t0);lp.frequency.linearRampToValueAtTime(Math.min(7000,fc),t0+A+D*.6);lp.frequency.exponentialRampToValueAtTime(Math.max(180,fc*.35),end);lp.Q.value=o.q??.7;
    g.gain.setValueAtTime(.0001,t0);g.gain.exponentialRampToValueAtTime(Math.max(.0002,peak),t0+A);g.gain.exponentialRampToValueAtTime(Math.max(.0002,peak*(S||.28)),t0+A+D);g.gain.setValueAtTime(Math.max(.0002,peak*(S||.28)),t0+A+D+hold);g.gain.exponentialRampToValueAtTime(.0001,end-.05);
    osc.connect(lp);lp.connect(g);g.connect(sfxBus);
    if(o.thick){const second=ctx.createOscillator(),gain=ctx.createGain();second.type=o.wave||'sine';second.frequency.setValueAtTime(freq*1.0035,t0);gain.gain.value=.28;second.connect(gain);gain.connect(lp);nodes.push(second,gain);sources.push(second);}
    track(nodes,sources,g,t0,end,'sfx');for(const s of sources){s.start(t0);s.stop(end);}
  }

  /* ═══════════════════════════════════════════════════════════════
     ETKİLEŞİM SESLERİ
     Hepsi kısa, yumuşak ve düşük kazançlı. Tıklama sesi bir
     "uzay çanı": temel nota + oktav üstü kısa parıltı.
     ═══════════════════════════════════════════════════════════════ */
  const SFX = {
    /* Genel dokunuş — hafif ksilofon/çan */
    tap(){
      const f = SCALE[7 + Math.floor(audioRand() * 4)];
      voice({freq:f, wave:'sine', a:.006, d:.16, s:.0, r:.30, hold:0,
             gain:0.248, cut:f*5+900});
      voice({freq:f*2, wave:'sine', a:.004, d:.09, s:.0, r:.18, hold:0,
             gain:0.085, cut:f*7+1200, delay:.012});
    },
    /* Onay / başarı — yükselen üçlü */
    ok(){
      const b = SCALE[7];
      [0, 2, 4].forEach((s, i) =>
        voice({freq:SCALE[7 + s], wave:'sine', a:.008, d:.20, s:.10, r:.45,
               hold:.02, gain:0.217, delay:i * .075, cut:2600, thick:true}));
    },
    /* Hata / reddedilme — inen küçük ikili, sert değil */
    nope(){
      voice({freq:196.00, wave:'triangle', a:.010, d:.16, s:.06, r:.34,
             hold:.03, gain:0.202, cut:900, glide:174.61});
    },
    /* Olay penceresi — merak uyandıran yumuşak açılış */
    event(){
      voice({freq:SCALE[4], wave:'sine', a:.09, d:.35, s:.22, r:.90,
             hold:.15, gain:0.232, cut:1500, thick:true});
      voice({freq:SCALE[9], wave:'sine', a:.14, d:.40, s:.18, r:1.1,
             hold:.10, gain:0.155, cut:2200, delay:.16});
    },
    /* Savaş / kriz — tok, çello-brass arası uyarı. Gerilimli ama
       tırmalamıyor: triangle + ağır alçak geçiren + uzun release. */
    alarm(){
      voice({freq:98.00, wave:'triangle', a:.05, d:.45, s:.34, r:1.4,
             hold:.35, gain:0.341, cut:620, q:1.1, thick:true});
      voice({freq:146.83, wave:'triangle', a:.07, d:.50, s:.26, r:1.5,
             hold:.30, gain:0.232, cut:780, delay:.09, thick:true});
      /* Üstte çok hafif bir gerilim notası (minör ikili) */
      voice({freq:155.56, wave:'sine', a:.20, d:.60, s:.20, r:1.6,
             hold:.20, gain:0.116, cut:900, delay:.22});
    },
    /* Keşif / anomali — parıltılı, yukarı doğru */
    discover(){
      [0, 3, 5, 7].forEach((s, i) =>
        voice({freq:SCALE[7 + s], wave:'sine', a:.012, d:.22, s:.08, r:.55,
               hold:.02, gain:0.171, delay:i * .055, cut:3200}));
    },
    /* Zafer / büyük olumlu */
    win(){
      [0, 4, 7, 11].forEach((s, i) =>
        voice({freq:SCALE[Math.min(SCALE.length-1, 7 + s)], wave:'sine',
               a:.02, d:.30, s:.24, r:1.3, hold:.10, gain:0.232,
               delay:i * .12, cut:2800, thick:true}));
    }
  };

  // Tonal score: C Dorian, eight-bar phrases, chord-linked motif and a final breath.
  const DEGREES=[0,2,3,5,7,9,10],PROGRESSIONS=[[0,3,1,4],[0,1,3,0],[0,4,3,0],[0,5,3,1]],MOTIFS=[[0,1,2],[2,1,0],[0,2,1],[1,0,2]];
  function degreeMidi(degree,octave){const oct=Math.floor(degree/7);return 12*(octave+1)+DEGREES[(degree%7+7)%7]+oct*12;}
  function scoreBar(bar,scene='normal',seed=719){
    const phrase=Math.floor(bar/8),part=bar%8,variation=(Math.imul(phrase+seed,1664525)>>>0),progression=PROGRESSIONS[(variation>>>8)%PROGRESSIONS.length],root=progression[Math.floor(part/2)],chord=[root,root+2,root+4],events=[];
    const add=(beat,duration,instrument,degree,octave,gain)=>events.push({bar,phrase,beat,duration,instrument,degree,midi:degreeMidi(degree,octave),gain,scene,chord:chord.slice()});
    for(let i=0;i<3;i++)add(0,part===7?2.6:3.55,'strings',chord[i],scene==='crisis'?2:3,i===0?.027:.019);
    add(0,part===7?2.6:3.1,'bass',root,2,.047);
    const motif=MOTIFS[(variation>>>16)%MOTIFS.length],open=scene==='explore'?5:4;
    if(part%2===0)for(let i=0;i<3;i++)add(.5+i,.62+(i===2?.2:0),'wind',chord[motif[i]],open,scene==='crisis'?.024:.037);
    if((part===3||part===5)&&scene!=='crisis')add(1.5,.95,'wind',chord[(variation+part)%3],open,.029);
    if(part===7)add(.35,.95,'wind',root,4,.026); // phrase ending leaves room to breathe
    if(scene==='war'&&part<7)add(2,1.0,'bass',root,2,.026);
    if(scene==='war'||scene==='crisis'){add(0,.45,'percussion',root,1,scene==='crisis'?.025:.018);if(part%2===0)add(2,.35,'percussion',root,1,.013);}
    return events.sort((a,b)=>a.beat-b.beat);
  }
  function instrumentWave(kind){if(waves.has(kind))return waves.get(kind);const real=new Float32Array(13),imag=new Float32Array(13);for(let i=1;i<13;i++)imag[i]=kind==='wind'?(i===1?1:i===2?.22:i===3?.09:.02/i):kind==='bass'?1/Math.pow(i,2.3):1/Math.pow(i,1.55);const w=ctx.createPeriodicWave(real,imag);waves.set(kind,w);return w;}
  function musicVoice(event,start,beatSeconds){
    if(!ctx||muted||!prefs.musicOn)return;
    const kind=event.instrument,freq=440*Math.pow(2,(event.midi-69)/12),duration=event.duration*beatSeconds,attack=kind==='strings'?.55:kind==='wind'?.18:.035,release=kind==='percussion'?.20:.48,end=start+duration+release;
    if(!room('music',start,end+.02))return;
    const osc=ctx.createOscillator(),lp=ctx.createBiquadFilter(),gain=ctx.createGain(),pan=ctx.createStereoPanner(),nodes=[osc,lp,gain,pan],sources=[osc];
    if(kind==='percussion'){osc.type='sine';osc.frequency.setValueAtTime(78,start);osc.frequency.exponentialRampToValueAtTime(39,start+.16);}else{osc.setPeriodicWave(instrumentWave(kind));osc.frequency.setValueAtTime(freq,start);osc.detune.setValueAtTime(Math.sin(event.bar*.81+event.degree)*2,start);osc.detune.linearRampToValueAtTime(Math.sin(event.bar*.81+event.degree+1)*2,start+duration);}
    lp.type='lowpass';lp.frequency.setValueAtTime(kind==='strings'?1700:kind==='wind'?2200:kind==='bass'?420:210,start);lp.frequency.linearRampToValueAtTime(kind==='strings'?950:kind==='wind'?1400:kind==='bass'?270:130,end);lp.Q.value=.55;
    const peak=event.gain;gain.gain.setValueAtTime(.0001,start);gain.gain.linearRampToValueAtTime(peak,start+Math.min(attack,duration*.35));gain.gain.linearRampToValueAtTime(peak*.72,start+duration*.75);gain.gain.linearRampToValueAtTime(.0001,end);
    pan.pan.value=kind==='bass'?0:kind==='strings'?[-.28,.08,.28][event.degree%3]:kind==='wind'?.14:0;osc.connect(lp);lp.connect(gain);gain.connect(pan);pan.connect(musicBus);
    // Separate filtered bow/breath transient envelope, not another detuned sine.
    if(kind==='strings'||kind==='wind'||kind==='percussion'){
      const breath=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),air=ctx.createGain();breath.buffer=noise;breath.loop=true;filter.type='bandpass';filter.frequency.value=kind==='wind'?1450:kind==='strings'?850:180;filter.Q.value=kind==='percussion'?.6:1.1;
      air.gain.setValueAtTime(.0001,start);air.gain.linearRampToValueAtTime((kind==='wind'?.11:kind==='strings'?.065:.7),start+.045);air.gain.exponentialRampToValueAtTime(.0001,Math.min(end,start+(kind==='percussion'?.2:duration*.85)));
      breath.connect(filter);filter.connect(air);air.connect(gain);nodes.push(breath,filter,air);sources.push(breath);
    }
    track(nodes,sources,gain,start,end+.02,'music');for(const s of sources){s.start(start);s.stop(end+.02);}
  }
  function scene(){
    if(typeof G==='undefined'||!G.p)return 'normal';
    if(typeof crisisActive==='function'&&crisisActive())return 'crisis';
    const own=(G.fleets||[]).filter(f=>f.e===G.p.id),wars=Object.values(G.p.war||{}).filter(Boolean).length;
    const armed=own.reduce((n,f)=>n+(f.ships||[]).filter(s=>typeof SHIPS!=='undefined'&&SHIPS[s.c]?.dmg>0).length,0);
    if(wars>=2||wars&&armed>=8||wars&&own.some(f=>f.combat>0))return 'war';
    if(own.some(f=>(f.mv||f.surv>0)&&(f.ships||[]).some(s=>s.c==='bil')))return 'explore';return 'normal';
  }
  let transportBar=0,nextBar=0,currentScene='normal',lastSceneBar=-8;const BEAT=60/52;
  function cancelMusic(){if(musicTimer!==null)clearTimeout(musicTimer);musicTimer=null;nextBar=0;}
  function pump(){
    musicTimer=null;if(!started||muted||!prefs.musicOn||!ctx||ctx.state!=='running'||offline)return;
    const t=now();if(!nextBar||nextBar<t-.5)nextBar=t+.08;
    if(nextBar<t+.65){const wanted=scene();if(wanted!==currentScene&&transportBar-lastSceneBar>=2&&transportBar%2===0){currentScene=wanted;lastSceneBar=transportBar;}
      for(const event of scoreBar(transportBar,currentScene))musicVoice(event,nextBar+event.beat*BEAT,BEAT);stats.bars++;transportBar++;nextBar+=4*BEAT;}
    musicTimer=setTimeout(pump,250);
  }
  function ensureMusic(){if(!offline&&started&&!muted&&prefs.musicOn&&ctx?.state==='running'&&musicTimer===null)musicTimer=setTimeout(pump,0);}
  const lastSfx=new Map();
  async function preview(context,{scene:which='normal',seconds=30,seed=719,sfx=false}={}){
    if(ctx||typeof context?.startRendering!=='function')throw Error('Preview requires a fresh engine and an OfflineAudioContext');
    offline=true;init(context);started=true;
    for(let bar=0;bar*4*BEAT<seconds-1;bar++)for(const event of scoreBar(bar,which,seed)){const start=.08+(bar*4+event.beat)*BEAT;if(start+event.duration*BEAT+.5<seconds)musicVoice(event,start,BEAT);}
    if(sfx){SFX.alarm();SFX.discover();SFX.win();}
    const rendered=await context.startRendering();return rendered;
  }

  return {
    start(){if(started){this.resume();return;}if(!init())return;started=true;this.resume();},
    resume(){if(!ctx||muted)return;if(ctx.state==='suspended')ctx.resume().then(()=>ensureMusic()).catch(()=>{});else ensureMusic();},
    suspend(){cancelMusic();stopVoices(null,0);if(ctx?.state==='running')ctx.suspend().catch(()=>{});},
    isOn(){return started&&!muted;},isMuted(){return muted;},
    setMuted(v){muted=!!v;applyGains();if(muted){cancelMusic();stopVoices(null,.18);}else this.resume();return muted;},
    toggle(){return this.setMuted(!muted);},
    play(name){if(!started||muted||!prefs.effectsOn||!ctx||ctx.state!=='running')return;if(!Object.hasOwn(SFX,name))return;const t=now();if(t-(lastSfx.get(name)??-100)<.08)return;lastSfx.set(name,t);if(SFX[name])try{SFX[name]();}catch(e){}},
    forLog(cls){if(cls==='war')this.play('alarm');else if(cls==='win')this.play('win');else if(cls==='sci')this.play('discover');},
    settings(){return {...prefs};},configure,controls,
    async loadSettings(){const rev=prefsRevision;if(typeof storeGet!=='function')return;try{const raw=await storeGet('yh_audio_mix');if(rev===prefsRevision&&raw){configure(JSON.parse(raw),false);}}catch(e){}},
    diagnostics(){return {started,muted,state:ctx?.state||'uncreated',scene:currentScene,musicTimer:musicTimer===null?0:1,activeMusic:active('music'),activeSfx:active('sfx'),liveNodes:[...groups].reduce((n,g)=>n+g.nodes.length,0),groups:groups.size,...stats,limits:{...limits},waveTables:waves.size};},
    dispose(){cancelMusic();stopVoices(null,0);const old=ctx;ctx=null;master=null;musicBus=null;sfxBus=null;convolver=null;compressor=null;noise=null;waves.clear();lastSfx.clear();started=false;if(old&&typeof old.close==='function'&&old.state!=='closed')old.close().catch(()=>{});},
    scene,scoreBar,preview,SCALE,SFX
  };
})();
// Stable delegation: opening settings never adds another input listener.
for(const type of ['input','change'])document.addEventListener(type,event=>{
  const el=event.target,key=el?.dataset?.audio;if(!['master','music','effects','musicOn','effectsOn'].includes(key))return;
  const value=key.endsWith('On')?el.checked:Number(el.value)/100;
  AUDIO.configure({[key]:value},type==='change');
});
