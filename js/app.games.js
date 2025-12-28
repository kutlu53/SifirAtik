// app.games.js (FIXED)
(() => {
  'use strict';
  const KCK = window.KCK;
  const { $, rnd, clamp, state } = KCK;
  const stage = KCK.stage;
  const levels = KCK.levels;

  const { beep, speakTR, ensureAudio } = KCK;
  const setToast = KCK.setToast;
  const playWinFX = KCK.playWinFX;
  const startBubbles = KCK.startBubbles;

  const clearStage = KCK.clearStage;
  const setHint = KCK.setHint;
  const showStoryPanel = KCK.showStoryPanel;
  const showConsequence = KCK.showConsequence;
  const openOverlay = KCK.openOverlay;
  const closeOverlay = KCK.closeOverlay;
  const openAlbumOverlay = KCK.openAlbumOverlay;
  const openMissionsOverlay = KCK.openMissionsOverlay;
  const winLevel = KCK.winLevel;
  const failMsg = KCK.failMsg;

  // Ensure cards available (fallback)
  const collectibleCards = KCK.collectibleCards || [

      {em:"🐬", name:"Dodo Yunus", fact:"Yunuslar çok zekidir. Deniz temiz olursa daha güvenli yaşarlar."},
      {em:"🦀", name:"Kıtır Yengeç", fact:"Yengeçler kıyıda yaşar. Plastik parçalar onlara zarar verebilir."},
      {em:"🐢", name:"Taki Kaplumbağa", fact:"Deniz kaplumbağaları poşeti denizanası sanabilir. Bu çok tehlikelidir."},
      {em:"🦉", name:"Bilge Baykuş", fact:"Doğru atık yönetimi, suyun kirlenmesini azaltır."},
      {em:"🐦", name:"Mavi Martı", fact:"Kıyıda kalan atıklar rüzgârla denize taşınabilir."},
      {em:"🦊", name:"Pofuduk Tilki", fact:"Doğada iz bırakmamak, canlıların yaşamını korur."},
      {em:"🐸", name:"Zıpzıp Kurbağa", fact:"Kurbağalar temiz suya ihtiyaç duyar. Su tasarrufu önemlidir."},
      {em:"🤖", name:"Işıko Robot", fact:"Enerji tasarrufu, daha az kirlilik ve daha temiz hava demektir."},
      {em:"🧒", name:"Ece Kahraman", fact:"Nazik uyarı, çevre davranışlarını birlikte güçlendirir."},
      {em:"🌟", name:"Rozet Perisi", fact:"Küçük adımlar büyük değişim yapar. Bugün yaptığın, yarını güzelleştirir."},
    
  ];
  KCK.collectibleCards = collectibleCards;

function startTimer(seconds, onTick, onDone, isPaused){
      let t = seconds;
      onTick?.(t);
      const iv = setInterval(()=>{
        if(isPaused && isPaused()) return;
        t--;
        onTick?.(t);
        if(t<=0){
          clearInterval(iv);
          onDone?.();
        }
      }, 1000);
      return ()=> clearInterval(iv);
    }

function makeDraggableTo(el, target, onDropGood, onDropBad){
      let dragging=false, ox=0, oy=0;
      el.addEventListener("pointerdown", (e)=>{
        dragging=true;
        el.setPointerCapture(e.pointerId);
        const r = el.getBoundingClientRect();
        ox = e.clientX - r.left;
        oy = e.clientY - r.top;
      });
      el.addEventListener("pointermove", (e)=>{
        if(!dragging) return;
        const sr = stage.getBoundingClientRect();
        el.style.left = (e.clientX - sr.left - ox) + "px";
        el.style.top  = (e.clientY - sr.top  - oy) + "px";
      });
      el.addEventListener("pointerup", ()=>{
        dragging=false;
        const a = el.getBoundingClientRect();
        const b = target.getBoundingClientRect();
        const hit = !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
        if(hit) onDropGood?.();
        else onDropBad?.();
      });
    }

function shuffle(a){
        const b = a.slice();
        for(let i=b.length-1;i>0;i--){
          const j = Math.floor(Math.random()*(i+1));
          [b[i],b[j]]=[b[j],b[i]];
        }
        return b;
      }

function runTapTrash(){
      clearStage(); startBubbles();
      setHint("Çöplere tıkla ve topla! 12 tane toplayınca kazanırsın.");
      stage.style.background = "linear-gradient(to bottom, #87CEEB 0%, #E0F7FA 70%, #29B6F6 100%)";

      const total = 12;
      let got = 0;
      let missed = 0;
      let paused = false;
      let warningShown = false;
      let consequenceShown = false;

      const hudP = document.createElement("div");
      hudP.style.position="absolute";
      hudP.style.left="12px";
      hudP.style.top="12px";
      hudP.className="pill";
      hudP.innerHTML = `Toplanan: <strong id="g1got">0</strong>/${total} &nbsp; Kaçan: <strong id="g1miss">0</strong>`;
      stage.appendChild(hudP);

      const seaLine = document.createElement("div");
      seaLine.style.position="absolute";
      seaLine.style.left="0"; seaLine.style.bottom="0"; seaLine.style.width="100%";
      seaLine.style.height="40px";
      seaLine.style.background="linear-gradient(to top, rgba(0,100,255,0.5), transparent)";
      seaLine.style.borderBottom="4px solid rgba(0,100,255,0.8)";
      seaLine.style.zIndex="1";
      stage.appendChild(seaLine);

      const stop = startTimer(30, (t)=>{ $("#uiTime").textContent = t + " sn"; }, ()=>{
        if(got>=total) winLevel(36);
        else { failMsg("Süre bitti! Bir daha deneyelim 😊"); loadLevel(); }
      }, () => paused);

      function spawn(){
        if(got>=total || paused) return;
        const el = document.createElement("div");
        el.className="obj";
        el.textContent = ["🧴","🥤","🧃","🧻","🍬","🧱","🧷"][Math.floor(Math.random()*7)];
        el.style.left = rnd(10, stage.clientWidth-70) + "px";
        el.style.top  = rnd(60, 120) + "px";

        const iv = setInterval(()=>{
          if(paused) return;
          const top = parseFloat(el.style.top);
          el.style.top = (top + 2.5) + "px";

          if(top > (stage.clientHeight - 90)){
             if(!warningShown){
               paused = true;
               warningShown = true;
               setToast("Dikkat! Çöpler denize düşmesin! 🛑", "bad");
               speakTR("Dikkat! Çöpler denize düşmesin. Onları yakala!", ()=>{
                 paused = false;
                 if(el.isConnected) el.remove();
                 clearInterval(iv);
               });
             } else {
               clearInterval(iv);
               if(el.isConnected){
                 el.remove();
                 missed++;
                 $("#g1miss").textContent = missed;
                 setToast("Olamaz! Bir çöp denize kaçtı! 🌊","bad");
                 
                 if(!consequenceShown){
                   consequenceShown = true;
                   paused = true;
                   showConsequence("plastic", ()=>{ paused = false; });
                 } else {
                   // Sonraki kaçışlarda sadece ses/toast uyarısı kalır, oyun durmaz
                 }

                 if(missed>=6){ stop(); failMsg("Çok çöp denize kaçtı! Baştan 😊"); loadLevel(); }
               }
             }
          }
        }, 50);

        el.addEventListener("click", ()=>{
          if(paused) return;
          if(!el.isConnected) return;
          clearInterval(iv);
          el.remove();
          got++;
          state.score += 1;
          $("#g1got").textContent = got;
          $("#uiScore").textContent = state.score;
          setToast("Topladın! ✅","good");
          if(got>=total){ stop(); winLevel(40); }
        });
        stage.appendChild(el);
      }

      let sp = setInterval(()=> spawn(), 900);
      stage._cleanup = ()=>{ clearInterval(sp); stop(); stage.style.background = ""; };
      spawn();
    }

function runChoicesPlastic(){
      clearStage(); startBubbles();
      setHint("Her turda 2 seçenek var. Çevre dostu olanı seç!");
      stage.style.background = "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)";

      const pairs = [
        {a:{emo:"🛍️", t:"Plastik Poşet", good:false}, b:{emo:"🧺", t:"Bez Çanta", good:true}},
        {a:{emo:"🥤", t:"Pet Şişe", good:false}, b:{emo:"🚰", t:"Matara", good:true}},
        {a:{emo:"🍱", t:"Tek Kullanımlık Kap", good:false}, b:{emo:"🥣", t:"Yıkanabilir Kap", good:true}},
        {a:{emo:"🍴", t:"Tek Kullanımlık Çatal", good:false}, b:{emo:"🥄", t:"Metal Kaşık", good:true}},
        {a:{emo:"🧻", t:"Gereksiz Kağıt", good:false}, b:{emo:"📄", t:"İhtiyaç Kadar", good:true}},
        {a:{emo:"🎁", t:"Çok Ambalaj", good:false}, b:{emo:"🛒", t:"Az Ambalaj", good:true}},
      ];
      let idx=0, correct=0, wrong=0;

      const hud = document.createElement("div");
      hud.style.position="absolute"; hud.style.left="12px"; hud.style.top="12px";
      hud.className="pill";
      hud.innerHTML = `Doğru: <strong id="g2c">0</strong>/6 &nbsp; Yanlış: <strong id="g2w">0</strong>`;
      stage.appendChild(hud);

      const grid = document.createElement("div");
      grid.className="grid2";
      stage.appendChild(grid);

      function makeChoice(o){
        const div = document.createElement("div");
        div.className="choice";
        div.innerHTML = `
          <div class="emo">${o.emo}</div>
          <div class="t"><strong>${o.t}</strong></div>
          <small>${o.good ? "Tekrar kullan!" : "Denizde kalabilir!"}</small>`;
        div.addEventListener("click", ()=>{
          if(o.good){
            correct++;
            state.score += 5;
            $("#uiScore").textContent = state.score;
            $("#g2c").textContent = correct;
            setToast("Süper seçim! 🌟","good");
            speakTR("Süper seçim!");

            idx++;
            if(idx>=pairs.length){
              if(correct>=6) winLevel(30);
              else { failMsg("Biraz daha! Tekrar deneyelim 😊"); loadLevel(); }
              return;
            }
            render();
          }else{
            wrong++;
            $("#g2w").textContent = wrong;
            setToast("Hmm… Daha çevreci bir seçenek var 😊","bad");
            speakTR("Daha çevreci bir seçenek var.");
            if(wrong>=3){ failMsg("3 kez yanlış oldu. Tekrar başlayalım 😊"); loadLevel(); return; }
          }
        });
        return div;
      }
      function render(){
        grid.innerHTML="";
        const p = pairs[idx];
        grid.appendChild(makeChoice(p.a));
        grid.appendChild(makeChoice(p.b));
      }
      render();
      stage._cleanup = ()=>{ stage.style.background = ""; };
    }

function runRescue(){
      clearStage(); startBubbles();
      setHint("Sırayla: 1) İpi kes 2) Halkayı çıkar 3) Atığı kutuya at");
      stage.style.background = "linear-gradient(to bottom, #4facfe 0%, #00f2fe 100%)";

      let step = 1;

      const hud = document.createElement("div");
      hud.style.position="absolute"; hud.style.left="12px"; hud.style.top="12px";
      hud.className="pill";
      hud.innerHTML = `Adım: <strong id="g3s">1</strong>/3`;
      stage.appendChild(hud);

      const animal = document.createElement("div");
      animal.className="obj";
      animal.textContent="🐬";
      animal.style.width="92px"; animal.style.height="92px";
      animal.style.left="72px"; animal.style.top="210px";
      animal.style.cursor="default";
      stage.appendChild(animal);

      const rope = document.createElement("div");
      rope.className="obj";
      rope.textContent="🧵";
      rope.style.left="195px"; rope.style.top="218px";
      stage.appendChild(rope);

      const ring = document.createElement("div");
      ring.className="obj";
      ring.textContent="⭕";
      ring.style.left="155px"; ring.style.top="276px";
      stage.appendChild(ring);

      const bin = document.createElement("div");
      bin.className="bin";
      bin.innerHTML = `🗑️<span>Atık Kutusu</span>`;
      stage.appendChild(bin);

      function setStep(n){ step=n; $("#g3s").textContent=step; }

      animal.addEventListener("click", ()=>{
        setToast("Canlılara dokunmayız, nazik oluruz 🐬","bad");
        speakTR("Canlılara dokunmayız, nazik oluruz.");
      });

      rope.addEventListener("click", ()=>{
        if(step!==1){ failMsg("Önce doğru adım 😊"); return; }
        rope.remove();
        setToast("İp kesildi! ✅","good");
        speakTR("İp kesildi.");
        setStep(2);
      });

      ring.addEventListener("click", ()=>{
        if(step!==2){ failMsg("Önce ipi kesmeliyiz 😊"); return; }
        ring.textContent="♻️";
        setToast("Halka çıkarıldı! ✅","good");
        speakTR("Halka çıkarıldı.");
        setStep(3);

        ring.style.cursor="grab";
        makeDraggableTo(ring, bin, ()=>{
          ring.remove();
          setToast("Atık doğru yere! 🏅","good");
          speakTR("Atık doğru yere.");
          winLevel(32);
        }, ()=>{
          setToast("Kutunun içine sürükle 😊","bad");
          speakTR("Kutunun içine sürükle.");
        });
      });

      stage._cleanup = ()=>{ stage.style.background = ""; };
    }

function runSortDrain(){
      clearStage(); startBubbles();
      setHint("Zararlı şeyler → Atık Kutusu. Sadece su → Lavabo.");
      stage.style.background = "radial-gradient(circle at 50% 50%, #ffffff 0%, #e6e9f0 100%)";

      let correct=0, total=8, wrong=0;

      const hud = document.createElement("div");
      hud.style.position="absolute"; hud.style.left="12px"; hud.style.top="12px";
      hud.className="pill";
      hud.innerHTML = `Doğru: <strong id="g4c">0</strong>/${total} &nbsp; Yanlış: <strong id="g4w">0</strong>`;
      stage.appendChild(hud);

      const drain = document.createElement("div");
      drain.className="bin";
      drain.style.left="18px"; drain.style.right="auto";
      drain.innerHTML = `🚰<span>Lavabo</span>`;
      stage.appendChild(drain);

      const waste = document.createElement("div");
      waste.className="bin";
      waste.innerHTML = `🗑️<span>Atık Kutusu</span>`;
      stage.appendChild(waste);

      const items = [
        {emo:"🛢️", ok:"waste"},
        {emo:"🎨", ok:"waste"},
        {emo:"💊", ok:"waste"},
        {emo:"🧪", ok:"waste"},
        {emo:"🧴", ok:"waste"},
        {emo:"🪫", ok:"waste"},
        {emo:"🧻", ok:"waste"},
        {emo:"💧", ok:"drain"},
      ].sort(()=>Math.random()-0.5);

      items.forEach((it,i)=>{
        const el = document.createElement("div");
        el.className="obj";
        el.textContent=it.emo;
        el.style.left = (120 + (i%4)*92) + "px";
        el.style.top  = (120 + Math.floor(i/4)*92) + "px";
        const initLeft = el.style.left;
        const initTop = el.style.top;
        stage.appendChild(el);

        const goodTarget = it.ok==="drain" ? drain : waste;
        const badTarget  = it.ok==="drain" ? waste : drain;

        makeDraggableTo(el, goodTarget, ()=>{
          el.remove();
          correct++;
          state.score += 4;
          $("#uiScore").textContent = state.score;
          $("#g4c").textContent = correct;
          setToast("Doğru yer! ✅","good");
          speakTR("Doğru yer.");
          if(correct>=7) winLevel(30);
        }, ()=>{
          const a = el.getBoundingClientRect();
          const b = badTarget.getBoundingClientRect();
          const hitBad = !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
          if(hitBad){
            wrong++;
            $("#g4w").textContent = wrong;
            setToast("Orası doğru yer değil 😊","bad");
            
            if(wrong>=3){
              failMsg("3 yanlış oldu. Tekrar deneyelim 😊"); loadLevel();
            } else {
              showConsequence("drain", ()=>{ el.style.left = initLeft; el.style.top = initTop; });
            }
          }else{
            setToast("Kutulardan birine bırak 😊","bad");
          }
        });
      });

      stage._cleanup = ()=>{ stage.style.background = ""; };
    }

function runHiddenObjects(){
      clearStage(); startBubbles();
      setHint("Sahilde saklanan çöpleri bul: Hepsine tıkla!");
      
      stage.style.background = "linear-gradient(to bottom, #87CEEB 0%, #87CEEB 25%, #f4e7c3 25%, #e6d2a0 100%)";

      let found=0, total=10;

      const hud = document.createElement("div");
      hud.style.position="absolute"; hud.style.left="12px"; hud.style.top="12px";
      hud.className="pill";
      hud.innerHTML = `Bulunan: <strong id="g5f">0</strong>/${total}`;
      stage.appendChild(hud);

      const bin = document.createElement("div");
      bin.className="bin";
      bin.innerHTML = `🗑️<span>Atık Kutusu</span>`;
      stage.appendChild(bin);

      const deco = document.createElement("div");
      deco.style.position="absolute";
      deco.style.right="12px"; deco.style.top="12px";
      deco.style.opacity=".9";
      deco.style.fontSize="32px";
      deco.style.zIndex="1";
      deco.innerHTML = "🌴 🏖️ ⛱️ 🌊 ⛵";
      stage.appendChild(deco);

      const stop = startTimer(45, (t)=> $("#uiTime").textContent = t+" sn", ()=>{
        if(found>=total) winLevel(34);
        else { failMsg("Süre bitti! Bir daha deneyelim 😊"); loadLevel(); }
      });

      const trashList = ["🥤","🧴","🧻","🍬","🧃","🧱","🥡","🥫","🚬","🛍️","🥣"];

      for(let i=0;i<total;i++){
        const el = document.createElement("div");
        el.className="obj";
        el.textContent = trashList[Math.floor(Math.random()*trashList.length)];
        el.style.width="64px"; el.style.height="64px";
        el.style.borderRadius="16px";
        el.style.fontSize="34px";
        el.style.opacity = rnd(0.55, 0.98).toFixed(2);
        el.style.transform = `rotate(${rnd(-45, 45)}deg)`;
        el.style.left = rnd(20, stage.clientWidth-90) + "px";
        el.style.top  = rnd(130, stage.clientHeight-100) + "px";
        el.addEventListener("click", ()=>{
          el.remove();
          found++;
          state.score += 2;
          $("#uiScore").textContent = state.score;
          $("#g5f").textContent = found;
          setToast("Buldun! ✅","good");
          if(found>=total){
            stop();
            speakTR("Sahil tertemiz! Fotoğraf zamanı!");
            winLevel(38);
          }
        });
        stage.appendChild(el);
      }

      stage._cleanup = ()=> { stop(); stage.style.background = ""; };
    }

function runDecisionsHike(){
      clearStage(); startBubbles();
      setHint("Her soruda doğru davranışı seç. 6 sorudan 5 doğru hedef!");
      stage.style.background = "linear-gradient(to bottom, #d4fc79 0%, #96e6a1 100%)";

      const qs = [
        {q:"Yolda güzel bir çiçek gördün. Ne yaparsın?", a:[
          {emo:"🌼✂️", t:"Koparıp eve götürürüm", ok:false, c:"nature", w:"Çiçekler dalında güzeldir."},
          {emo:"📸🌼", t:"Fotoğrafını çekerim", ok:true}
        ]},
        {q:"Piknikten sonra ne yaparsın?", a:[
          {emo:"🗑️✅", t:"Çöpümü toplarım", ok:true},
          {emo:"🚶‍♂️💨", t:"Bırakıp giderim", ok:false, c:"plastic", w:"Çöpler hayvanlara zarar verir."}
        ]},
        {q:"Bir taşın üstünde yazı var. Ne yaparsın?", a:[
          {emo:"🖍️🪨", t:"Ben de çizerim", ok:false, c:"nature", w:"Kayaları boyamak kirliliktir."},
          {emo:"🪨❤️", t:"Dokunmam, korurum", ok:true}
        ]},
        {q:"Bir hayvanı uzaktan gördün. Ne yaparsın?", a:[
          {emo:"🤫👀", t:"Sessizce izlerim", ok:true},
          {emo:"🏃‍♂️📢", t:"Koşup yanına giderim", ok:false, c:"nature", w:"Hayvanları ürkütmek tehlikelidir."}
        ]},
        {q:"Yolda çöp gördün. Ne yaparsın?", a:[
          {emo:"🤷‍♂️", t:"Bana ait değil", ok:false, c:"plastic", w:"Temizlik hepimizin görevidir."},
          {emo:"🧤🗑️", t:"Eldivenle alıp atarım", ok:true}
        ]},
        {q:"Ormanda ateş yakmak?", a:[
          {emo:"🔥❌", t:"Tehlikeli, yakmam", ok:true},
          {emo:"🔥✅", t:"İstediğim yerde yakarım", ok:false, c:"nature", w:"Orman yangını çıkabilir!"}
        ]},
      ];

      let i=0, correct=0, wrong=0;

      const hud = document.createElement("div");
      hud.style.position="absolute"; hud.style.left="12px"; hud.style.top="12px";
      hud.className="pill";
      hud.innerHTML = `Doğru: <strong id="g6c">0</strong>/6 &nbsp; Yanlış: <strong id="g6w">0</strong>`;
      stage.appendChild(hud);

      const box = document.createElement("div");
      box.style.position="absolute";
      box.style.inset="126px 12px 12px 12px";
      box.style.borderRadius="20px";
      box.style.border="1px solid rgba(0,0,0,.10)";
      box.style.background="rgba(255,255,255,.55)";
      box.style.overflow="hidden";
      box.style.zIndex="4";
      stage.appendChild(box);

      function render(){
        box.innerHTML="";
        const q = document.createElement("div");
        q.className="bubble npc";
        q.textContent = qs[i].q;
        q.style.margin="12px";
        box.appendChild(q);

        const grid = document.createElement("div");
        grid.className="grid2";
        grid.style.paddingTop="0";

        qs[i].a.forEach(opt=>{
          const c = document.createElement("div");
          c.className="choice";
          c.innerHTML = `<div class="emo">${opt.emo}</div><div class="t"><strong>${opt.t}</strong></div>`;
          c.addEventListener("click", ()=>{
            if(opt.ok){
              correct++;
              state.score += 6;
              $("#uiScore").textContent = state.score;
              $("#g6c").textContent = correct;
              setToast("Doğru karar! ✅","good");
              speakTR("Doğru karar.");

              i++;
              if(i>=qs.length){
                if(correct>=5) winLevel(34);
                else { failMsg("Biraz daha! Tekrar 😊"); loadLevel(); }
                return;
              }
              render();
            }else{
              wrong++;
              $("#g6w").textContent = wrong;
              const msg = opt.w || "Bu doğaya zarar verir 😊";
              setToast(msg, "bad");
              speakTR(msg);
              if(wrong>=2){ failMsg("2 yanlış oldu. Tekrar başlayalım 😊"); loadLevel(); return; }
            }
          });
          grid.appendChild(c);
        });

        box.appendChild(grid);
      }

      render();
      stage._cleanup = ()=>{ stage.style.background = ""; };
    }

function runWhackDrops(){
      clearStage(); startBubbles();
      setHint("Damlalara tıkla! 25 damla yakala.");
      stage.style.background = "linear-gradient(180deg, #e0c3fc 0%, #8ec5fc 100%)";

      let got=0;
      const target=25;

      const hud = document.createElement("div");
      hud.style.position="absolute"; hud.style.left="12px"; hud.style.top="12px";
      hud.className="pill";
      hud.innerHTML = `Yakalanan: <strong id="g7g">0</strong>/${target}`;
      stage.appendChild(hud);

      const stop = startTimer(25, (t)=> $("#uiTime").textContent = t+" sn", ()=>{
        if(got>=target) winLevel(36);
        else { failMsg("Süre bitti! Tekrar 😊"); showConsequence("water"); loadLevel(); }
      }, ()=> got>=target); // Pause timer if won

      function spawn(){
        const el = document.createElement("div");
        el.className="obj";
        el.textContent="💧";
        el.style.width="46px"; el.style.height="46px";
        el.style.fontSize="24px";
        el.style.left = rnd(10, stage.clientWidth-60) + "px";
        el.style.top  = rnd(140, stage.clientHeight-90) + "px";
        stage.appendChild(el);

        const ttl = setTimeout(()=>{ if(el.isConnected) el.remove(); }, 1500);
        el.addEventListener("click", ()=>{
          clearTimeout(ttl);
          el.remove();
          got++;
          state.score += 2;
          $("#uiScore").textContent = state.score;
          $("#g7g").textContent = got;
          setToast("Kapatttın! ✅","good");
          if(got>=target){ clearInterval(sp); stop(); winLevel(38); }
        });
      }

      const sp = setInterval(()=> spawn(), 800);
      stage._cleanup = ()=>{ clearInterval(sp); stop(); stage.style.background = ""; };
    }

function runLights(){
      clearStage(); startBubbles();
      setHint("Boş odanın ışığını kapat ✅ Dolu odada kapatma ❌");
      stage.style.background = "linear-gradient(to bottom, #cfd9df 0%, #e2ebf0 100%)";

      let correct=0, wrong=0, total=10;

      const hud = document.createElement("div");
      hud.style.position="absolute"; hud.style.left="12px"; hud.style.top="12px";
      hud.className="pill";
      hud.innerHTML = `Doğru: <strong id="g8c">0</strong>/10 &nbsp; Yanlış: <strong id="g8w">0</strong>`;
      stage.appendChild(hud);

      const grid = document.createElement("div");
      grid.style.position="absolute";
      grid.style.inset="126px 12px 12px 12px";
      grid.style.display="grid";
      grid.style.gridTemplateColumns="repeat(5, 1fr)";
      grid.style.gap="10px";
      grid.style.zIndex="4";
      stage.appendChild(grid);

      // 8 boş oda (kapatılmalı), 2 dolu oda (dokunulmamalı)
      const roomsData = [
        false, false, false, false, false, false, false, false, // 8 empty
        true, true // 2 occupied
      ].sort(()=> Math.random()-0.5);

      const rooms = roomsData.map(occ => ({ occupied: occ, done: false }));

      rooms.forEach((r)=>{
        const b = document.createElement("button");
        b.className="btn";
        b.style.height="90px";
        b.style.borderRadius="20px";
        b.style.background="rgba(255,255,255,.85)";
        b.style.display="flex";
        b.style.flexDirection="column";
        b.style.alignItems="center";
        b.style.justifyContent="center";
        b.style.gap="6px";
        b.style.boxShadow="0 10px 18px rgba(0,0,0,.06)";
        b.innerHTML = `<div style="font-size:26px">${r.occupied ? "🧒" : "🚪"}</div><div style="font-size:18px">💡</div>`;
        b.addEventListener("click", ()=>{
          if(r.done) return;
          r.done = true;

          if(!r.occupied){
            correct++;
            state.score += 4;
            $("#uiScore").textContent = state.score;
            setToast("Boş oda → kapattın ✅","good");
            speakTR("Boş oda. Işığı kapat.");
            b.innerHTML = `<div style="font-size:26px">🚪</div><div style="font-size:18px">🔌</div>`;
            b.style.borderColor="rgba(16,210,124,.35)";
          }else{
            wrong++;
            setToast("Dolu oda → kapatma ❌","bad");
            showConsequence("energy");
            b.innerHTML = `<div style="font-size:26px">🧒</div><div style="font-size:18px">😅</div>`;
            b.style.borderColor="rgba(255,61,113,.35)";
            if(wrong>=3){ failMsg("3 yanlış oldu. Tekrar 😊"); loadLevel(); return; }
          }

          $("#g8c").textContent = correct;
          $("#g8w").textContent = wrong;

          if(correct>=8){
            winLevel(32);
          }else if(correct+wrong>=10){
            failMsg("Hedef 8 doğruydu. Tekrar 😊");
            showConsequence("energy");
            loadLevel();
          }
        });
        grid.appendChild(b);
      });

      stage._cleanup = ()=>{ stage.style.background = ""; };
    }

function runPoliteDialog(){
      clearStage(); startBubbles();
      setHint("Nazikçe uyar: çözüm öner, birlikte yap.");
      stage.style.background = "linear-gradient(to top, #a8edea 0%, #fed6e3 100%)";

      const scenes = [
        {npc:"Ben bunu denize atayım, ne olacak ki?", ok:"Affedersiniz, deniz çöp kutusu değil. Çöp kutusuna atalım mı? 😊",
         bad:[
           {t:"Çöp atma ya! 😠", w:"Kızmak yerine nazikçe uyaralım."},
           {t:"Bana ne, at gitsin.", w:"Umursamaz olmak doğaya zarar verir."}
         ]},
        {npc:"Poşeti rüzgâr götürdü, uğraşamam.", ok:"İstersen beraber yakalayıp çöpe atalım. Çok kısa sürer 🙌",
         bad:[
           {t:"Senin yüzünden kirleniyor!", w:"Suçlamak yerine yardım teklif edelim."},
           {t:"Bırak, zaten gitti.", w:"Pes etmeyelim, yakalayabiliriz!"}
         ]},
        {npc:"Şişeyi burada bırakıyorum.", ok:"Ben de çevreyi seviyorum. Şişeyi geri dönüşüme atalım mı? ♻️",
         bad:[
           {t:"Kes sesini!", w:"Kaba sözler iletişimi kapatır."},
           {t:"Şişeyi bırak, kimse görmez.", w:"Kimse görmese bile doğa görür."}
         ]},
        {npc:"Çocuklar böyle şeylere takılmaz.", ok:"Aslında hepimiz etkileyebiliriz. Karadeniz bizim evimiz 🌊",
         bad:[
           {t:"Yanlış düşünüyorsun!", w:"Daha yapıcı bir dille anlatalım."},
           {t:"Boş ver, önemli değil.", w:"Her davranış önemlidir."}
         ]},
      ];

      let i=0, correct=0;

      const hud = document.createElement("div");
      hud.style.position="absolute"; hud.style.left="12px"; hud.style.top="12px";
      hud.className="pill";
      hud.innerHTML = `Doğru sahne: <strong id="g9c">0</strong>/4`;
      stage.appendChild(hud);

      const box = document.createElement("div");
      box.className="dialog";
      box.style.position="absolute";
      box.style.inset="126px 12px 12px 12px";
      box.style.borderRadius="20px";
      box.style.border="1px solid rgba(0,0,0,.10)";
      box.style.background="rgba(255,255,255,.55)";
      box.style.zIndex="4";
      stage.appendChild(box);

      function shuffle(a){
        const b = a.slice();
        for(let i=b.length-1;i>0;i--){
          const j = Math.floor(Math.random()*(i+1));
          [b[i],b[j]]=[b[j],b[i]];
        }
        return b;
      }

      function render(){
        box.innerHTML = "";
        const s = scenes[i];

        const npc = document.createElement("div");
        npc.className="bubble npc";
        npc.textContent = "👤 " + s.npc;
        npc.style.color = "#d81b60";
        box.appendChild(npc);

        const answers = document.createElement("div");
        answers.className="answers";

        const allOpts = s.bad.map(b => ({t:b.t, w:b.w, ok:false}));
        allOpts.push({t:s.ok, ok:true});
        const opts = shuffle(allOpts);

        opts.forEach(opt=>{
          const btn = document.createElement("button");
          btn.textContent = opt.t;
          btn.addEventListener("click", ()=>{
            if(opt.ok){
              correct++;
              state.score += 8;
              $("#uiScore").textContent = state.score;
              $("#g9c").textContent = correct;
              setToast("Nazik uyarı süper! ✅","good");
              speakTR("Nazik konuşmak çok güzel.");

              const me = document.createElement("div");
              me.className="bubble me";
              me.textContent = "🧒 " + opt.t;
              box.appendChild(me);

              i++;
              if(i>=scenes.length){ winLevel(40); return; }
              setTimeout(render, 520);
            }else{
              setToast(opt.w, "bad");
              speakTR(opt.w);
            }
          });
          answers.appendChild(btn);
        });

        box.appendChild(answers);
      }

      render();
      stage._cleanup = ()=>{ stage.style.background = ""; };
    }

function runCertificate(){
      clearStage(); startBubbles();
      setHint("Sertifikan hazır! İstersen tekrar oyna.");
      stage.style.background = "linear-gradient(120deg, #f6d365 0%, #fda085 100%)";

      if(!state.done[9] || !state.collected[9]){
        state.done[9] = true;
        state.collected[9] = true;
        KCK.save();
        KCK.ui();
      }

      const doneCount = state.done.filter(Boolean).length;

      const cert = document.createElement("div");
      cert.style.position="absolute";
      cert.style.inset="126px 12px 12px 12px";
      cert.style.borderRadius="26px";
      cert.style.background="rgba(255,255,255,.92)";
      cert.style.border="1px solid rgba(0,0,0,.12)";
      cert.style.boxShadow="0 16px 30px rgba(0,0,0,.10)";
      cert.style.display="flex";
      cert.style.alignItems="center";
      cert.style.justifyContent="center";
      cert.style.padding="16px";
      cert.style.zIndex="4";
      cert.innerHTML = `
        <div style="text-align:center; width:min(560px, 92%);">
          <div style="font-size:48px; margin:8px 0;">🏆</div>
          <div style="font-size:18px; font-weight:1000; margin-bottom:8px;">Karadeniz Çevre Kahramanı Sertifikası</div>
          <div style="color:var(--muted); font-weight:800; font-size:13px; line-height:1.35;">
            10 görevden <strong>${doneCount}</strong> tanesini tamamladın.<br>
            Unutma: <strong>Deniz çöp kutusu değildir.</strong>
          </div>
          <div style="display:flex; gap:10px; justify-content:center; flex-wrap:wrap; margin-top:14px;">
            <button class="btn primary" id="playAgain">Tekrar Oyna</button>
            <button class="btn" id="openAll">Tüm Seviyeleri Aç</button>
            <button class="btn" id="openAlbum2">Albüm</button>
            <button class="btn" id="openMission2">Görev</button>
          </div>
          <div style="margin-top:10px; color:var(--muted); font-weight:800; font-size:12px;">🎉 Aferin! Arkadaşına bir çevre davranışı anlat!</div>
        </div>
      `;
      stage.appendChild(cert);

      $("#playAgain").addEventListener("click", ()=>{
        beep("click"); speakTR("Tekrar oynayalım!");
        state.currentLevel = 1; save(); loadLevel();
      });
      $("#openAll").addEventListener("click", ()=>{
        beep("click");
        state.unlocked = 10; save();
        setToast("Tüm seviyeler açıldı ✅", "good");
        loadLevel();
      });
      $("#openAlbum2").addEventListener("click", ()=>{ beep("click"); openAlbumOverlay(); });
      $("#openMission2").addEventListener("click", ()=>{ beep("click"); openMissionsOverlay(); });

      playWinFX();
      speakTR("Tebrikler! Sertifikan hazır!");
      stage._cleanup = ()=>{ stage.style.background = ""; };
    }

  // Export run functions
  KCK.games = {
    runTapTrash,
    runChoicesPlastic,
    runRescue,
    runSortDrain,
    runHiddenObjects,
    runDecisionsHike,
    runWhackDrops,
    runLights,
    runPoliteDialog,
    runCertificate
  };
})();
