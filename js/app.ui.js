// app.ui.js
(() => {
  'use strict';
  const { $, clamp, todayISO, state, save } = window.KCK;
  const { beep, speakTR } = window.KCK;
  const { stage, setToast, startBubbles, playWinFX } = window.KCK;

  // ===== Stage helpers =====
  function clearStage(){
    stage.innerHTML = `<div class="toast" id="toast"></div><div class="hint" id="hint"></div>`;
  }
  function setHint(msg){
    const h = stage.querySelector("#hint");
    if(h) h.textContent = msg || "";
  }

  // ===== Overlay / modal =====
  const overlay = $("#overlay");
  const modalTitle = $("#modalTitle");
  const modalBody = $("#modalBody");
  const modalFoot = $("#modalFoot");

  function openOverlay({ title, bodyHTML, footHTML }){
    modalTitle.textContent = title || "Bilgi";
    modalBody.innerHTML = bodyHTML || "";
    modalFoot.innerHTML = footHTML || "";
    overlay.style.display = "flex";
  }
  function closeOverlay(){
    overlay.style.display = "none";
    modalBody.innerHTML = "";
    modalFoot.innerHTML = "";
  }

  $("#btnCloseOverlay").addEventListener("click", ()=>{ beep("click"); closeOverlay(); });
  overlay.addEventListener("click", (e)=>{ if(e.target === overlay) closeOverlay(); });

  // ===== Consequence mini scene =====
  const CONSEQ = {
      plastic: { big:"🥺🐟", text:"Çöp denize giderse balıklar üzülür. Çöpleri çöpe/geri dönüşüme atalım! ♻️" , voice:"Çöp denize giderse balıklar üzülür. Geri dönüşüm yapalım."},
      drain:   { big:"😵🌊", text:"Lavaboya dökülen yağ/kimyasal denize karışabilir. Doğru kutuya atmalıyız." , voice:"Lavaboya dökülen kimyasal denize karışabilir. Doğru kutuya atalım."},
      energy:  { big:"😮💡", text:"Boş odada ışık açık kalırsa enerji boşa gider. Kapatınca tasarruf olur!" , voice:"Boş odanın ışığını kapatalım. Enerji tasarrufu yapalım."},
      nature:  { big:"😢🌿", text:"Çiçeği koparmak/doğayı bozmak canlılara zarar verir. Fotoğraf çekmek daha iyi!" , voice:"Doğayı bozmayalım. Fotoğraf çekelim ve koruyalım."},
      polite:  { big:"😕💬", text:"Kaba sözler işe yaramaz. Nazik konuşursak herkes yardım eder." , voice:"Nazik konuşursak herkes yardım eder."},
      water:   { big:"😥💧", text:"Damla damla su boşa gidebilir. Musluğu kapatalım!" , voice:"Su değerli. Musluğu kapatalım."}
    };

  function showConsequence(kind, onDone){
    const c = CONSEQ[kind] || CONSEQ.plastic;
    openOverlay({
      title: "Mini Sonuç 🎬",
      bodyHTML: `
        <p>Bir bakalım ne olurdu?</p>
        <div class="conseqScene">
          <div class="big">${c.big}</div>
          <div>
            <div style="font-weight:1000; margin-bottom:6px;">${c.text}</div>
            <p style="margin:0;">Hadi yeniden deneyelim! 💪</p>
          </div>
        </div>
      `,
      footHTML: `<button class="btn primary" id="btnConseqOk">Tamam ✅</button>`
    });

    if(onDone){
      speakTR(c.voice, ()=>{ closeOverlay(); onDone(); });
      $("#btnConseqOk").addEventListener("click", ()=>{ beep("click"); closeOverlay(); onDone(); });
    } else {
      speakTR(c.voice);
      $("#btnConseqOk").addEventListener("click", ()=>{ beep("click"); closeOverlay(); });
      setTimeout(()=>{ if(overlay.style.display==="flex") closeOverlay(); }, 2600);
    }
  }

  // ===== Content data =====
  const collectibleCards = [
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

  const levels = [
      { id:1, title:"1) Sahil Temizliği: Çöp Topla!", desc:"Kıyıya gelen çöpleri hızlıca topla. Çöp sahilde kalırsa denize kaçar!",
        goalText:"12 çöp topla", timeText:"30 sn",
        hint:"Çöplere tıkla → kaybolsun. 12 tane toplayınca kazanırsın.",
        heroEmoji:"🐬", heroName:"Dodo (Yunus)",
        story:"Merhaba! Ben Dodo 🐬 Dalgalar sahile çöp getirmiş. Hadi birlikte temizleyelim!",
        voice:"Merhaba! Ben Dodo. Dalgalar sahile çöp getirmiş. Hadi birlikte çöpleri toplayalım!",
        winLine:"Yaşasın! Sahil tertemiz oldu!",
        missionText:"Bugün: Dışarı çıkarsan yere çöp atma. Bir çöp görürsen bir yetişkinle birlikte çöpe atmayı dene.",
        runKey: 'runTapTrash' },
      { id:2, title:"2) Plastiksiz Seçim", desc:"Market seçimleri! Tek kullanımlık yerine tekrar kullanılabilir olanı seç.",
        goalText:"6 doğru seçim", timeText:"Sınırsız",
        hint:"İki karttan çevre dostu olanı seç (bez çanta, matara, cam kap...).",
        heroEmoji:"🦀", heroName:"Kıtır (Yengeç)",
        story:"Ben Kıtır 🦀 Plastik denizde uzun kalır. Doğru seçimi yapalım!",
        voice:"Ben Kıtır. Plastik denizde uzun kalır. Hadi doğru seçimleri yapalım!",
        winLine:"Süper! Plastiksiz seçimler yaptın!",
        missionText:"Bugün: Yanına matara al veya pet şişe yerine tekrar kullanılabilir şişe kullan.",
        runKey: 'runChoicesPlastic' },
      { id:3, title:"3) Canlıyı Kurtar!", desc:"Bir canlı çöpe takılmış. Dikkatli ol: doğru sırayla kurtar ve atığı kutuya at.",
        goalText:"3 adım doğru", timeText:"Sınırsız",
        hint:"Sırayla: ipi kes → halkayı çıkar → atığı kutuya gönder.",
        heroEmoji:"🐢", heroName:"Taki (Kaplumbağa)",
        story:"Ben Taki 🐢 Bazen çöpler canlılara takılır. Nazikçe kurtaralım!",
        voice:"Ben Taki. Çöpler canlılara zarar verebilir. Hadi dikkatli olalım ve kurtaralım!",
        winLine:"Harika! Canlı güvende, atık da doğru yerde!",
        missionText:"Bugün: Sahilde/parkta bir canlıya yaklaşmadan uzaktan izlemeyi seç. Çöp görürsen yetişkine haber ver.",
        runKey: 'runRescue' },
      { id:4, title:"4) Lavabo Denize Gider mi?", desc:"Lavaboya dökülmemesi gerekenleri doğru kutuya at. (Yağ, boya, ilaç...)",
        goalText:"8 nesneden 7 doğru", timeText:"Sınırsız",
        hint:"Zararlı şeyler → Atık Kutusu. Sadece su → Lavabo.",
        heroEmoji:"🦉", heroName:"Bilge (Baykuş)",
        story:"Ben Bilge 🦉 Lavaboya dökülen şey denize gidebilir. Doğru yere atalım!",
        voice:"Ben Bilge. Lavaboya dökülen şeyler denize gidebilir. Zararlıları atık kutusuna atalım!",
        winLine:"Aferin! Deniz daha temiz kalacak!",
        missionText:"Bugün: Evde bir yetişkinle konuş: Kızartma yağı lavaboya dökülür mü? Doğru yöntem nedir?",
        runKey: 'runSortDrain' },
      { id:5, title:"5) Piknik Sonrası: İz Bırakma!", desc:"Sahilde saklanan çöpleri bul ve topla. Temiz sahil fotoğrafı gelsin!",
        goalText:"10 nesne bul", timeText:"45 sn",
        hint:"Etrafta saklı küçük ikonlara tıkla. Hepsini bul!",
        heroEmoji:"🐦", heroName:"Mavi (Martı)",
        story:"Ben Mavi 🐦 Sahilde kaybolmuş çöpler var. Bulup toplayalım!",
        voice:"Ben Mavi. Sahilde saklanan çöpleri bulup toplayalım. Hazır mısın?",
        winLine:"Vay! Sahil parladı! Fotoğraf zamanı!",
        missionText:"Bugün: Piknik/gezinti sonrası ‘geldiğim gibi bırak’ kuralını hatırla. Çöpünü yanında taşıyıp çöpe at.",
        runKey: 'runHiddenObjects' },
      { id:6, title:"6) Doğa Yürüyüşü: Doğru Karar", desc:"Patikada doğru davranışları seç. Doğa hatıra değil, ev!",
        goalText:"6 sorudan 5 doğru", timeText:"Sınırsız",
        hint:"İyi seçenek genelde 'koru, foto çek, topla, geri götür' olur.",
        heroEmoji:"🦊", heroName:"Pofuduk (Tilki)",
        story:"Ben Pofuduk 🦊 Doğada doğru kararlar verelim. Hazır mısın?",
        voice:"Ben Pofuduk. Doğada doğru kararlar verelim. Doğayı koruyalım!",
        winLine:"Bravo! Doğaya dost kararlar verdin!",
        missionText:"Bugün: Bir çiçeği koparmak yerine fotoğrafını çekmeyi dene. Doğayı olduğu gibi bırak.",
        runKey: 'runDecisionsHike' },
      { id:7, title:"7) Musluk Canavarı", desc:"Damla damla! Su damlalarını yakala ve muslukları kapa!",
        goalText:"25 damla yakala", timeText:"25 sn",
        hint:"Damlalar çıkınca tıkla. Hızlı ol!",
        heroEmoji:"🐸", heroName:"Zıpzıp (Kurbağa)",
        story:"Ben Zıpzıp 🐸 Her damla değerli! Damlaları yakalayalım!",
        voice:"Ben Zıpzıp. Her damla değerli. Damlaları yakala ve suyu koru!",
        winLine:"Süper! Suyu israf etmedin!",
        missionText:"Bugün: Diş fırçalarken musluğu kapat. Sadece gerektiğinde aç.",
        runKey: 'runWhackDrops' },
      { id:8, title:"8) Enerji Dedektifi", desc:"Boş odalardaki ışıkları kapat. Dolu odada kapatırsan yanlış olur!",
        goalText:"10 odadan 8 doğru", timeText:"Sınırsız",
        hint:"Boş odada ışık kapatılır ✅ Dolu odada kapatma ❌",
        heroEmoji:"🤖", heroName:"Işıko (Robot)",
        story:"Ben Işıko 🤖 Enerjiyi boşa harcamayalım! Boş odaların ışığını kapat!",
        voice:"Ben Işıko. Enerjiyi boşa harcamayalım. Boş odaların ışığını kapat!",
        winLine:"Harika! Enerji tasarrufu yaptın!",
        missionText:"Bugün: Odadan çıkarken ışığı kapatmayı hatırla. Ailene de ‘boş oda ışığı’ hatırlatması yap.",
        runKey: 'runLights' },
      { id:9, title:"9) Nazik Uyarı", desc:"Biri çöp atacak! Kırmadan, nazikçe uyar. Doğru cümleyi seç.",
        goalText:"4 sahne doğru", timeText:"Sınırsız",
        hint:"Nazik + çözüm öneren cümle genelde doğru.",
        heroEmoji:"🧒", heroName:"Ece (Çevre Kahramanı)",
        story:"Ben Ece 🧒 Nazik konuşursak herkes yardım eder. Doğru cümleyi seçelim!",
        voice:"Ben Ece. Nazik konuşursak herkes yardım eder. Hadi doğru cümleyi seç!",
        winLine:"Çok güzel konuştun! Hep birlikte koruruz!",
        missionText:"Bugün: Birine nazikçe ‘çöpü çöpe atalım mı?’ demeyi dene. Gülümse 😊",
        runKey: 'runPoliteDialog' },
      { id:10, title:"10) Sertifika Zamanı!", desc:"Tüm görevleri tamamladın! Sertifikanı al ve rozetlerini gör.",
        goalText:"Sertifika", timeText:"Sınırsız",
        hint:"İstersen sıfırlayıp tekrar oynayabilirsin.",
        heroEmoji:"🌟", heroName:"Rozet Perisi",
        story:"Ben Rozet Perisi 🌟 Tüm görevler bitti! Sertifikan hazır!",
        voice:"Ben Rozet Perisi. Tüm görevler bitti. Sertifikan hazır!",
        winLine:"Tebrikler! Sen artık Karadeniz Çevre Kahramanısın!",
        missionText:"Bugün: Bir arkadaşına öğrendiğin 1 çevre davranışını anlat. Paylaşmak büyütür!",
        runKey: 'runCertificate' },
    ];

  // Expose levels so games file can call run functions by name
  window.KCK.levels = levels;

  // ===== Sidebar =====
  function renderLevelList(){
    const list = $("#levelList");
    list.innerHTML = "";
    levels.forEach(l=>{
      const b = document.createElement("button");
      const isLocked = l.id > state.unlocked;
      b.className = (l.id===state.currentLevel ? "active " : "") + (isLocked ? "locked" : "");
      b.innerHTML = `
        <div><strong>${l.title}</strong></div>
        <small>${l.desc}</small>
        <span class="badge ${state.done[l.id-1] ? "done" : (isLocked ? "lock" : "")}">
          ${state.done[l.id-1] ? "🏅" : (isLocked ? "🔒" : "▶")}
        </span>`;
      b.addEventListener("click", ()=>{
        if(isLocked){ setToast("Önce önceki seviyeyi bitirelim! 😊","bad"); return; }
        state.currentLevel = l.id;
        save();
        window.KCK.loadLevel();
      });
      list.appendChild(b);
    });
  }

  function pendingMissionIds(){
    const ids = [];
    for(const k of Object.keys(state.missions || {})){
      const m = state.missions[k];
      if(m && !m.done) ids.push(Number(k));
    }
    ids.sort((a,b)=>a-b);
    return ids;
  }

  function ui(){
    $("#uiLevel").textContent = state.currentLevel;
    $("#uiBadges").textContent = state.done.filter(Boolean).length;
    $("#uiScore").textContent = state.score;
    $("#uiSound").textContent = state.soundOn ? "Açık" : "Kapalı";
    $("#uiVoice").textContent = state.voiceOn ? "Açık" : "Kapalı";
    $("#uiAlbum").textContent = state.collected.filter(Boolean).length;

    const pending = pendingMissionIds();
    $("#missionPill").style.display = pending.length ? "flex" : "none";
    renderLevelList();
  }

  // ===== Story panel =====
  function showStoryPanel(){
    const L = levels[state.currentLevel-1];
    const old = stage.querySelector(".storyPanel");
    if(old) old.remove();

    const panel = document.createElement("div");
    panel.className = "storyPanel";
    panel.innerHTML = `
      <div class="hero">${L.heroEmoji || "🌊"}</div>
      <div class="text">
        <strong>${L.heroName || "Karadeniz Kahramanı"}</strong><br>
        ${L.story || "Hazır mısın? Bu görevde çevreyi koruyoruz!"}
        <div class="tag">🎯 Hedef: <strong style="color:var(--ink)">${L.goalText}</strong></div>
        <small>💡 İpucu: ${L.hint || ""}</small>
      </div>
      <div class="actions">
        <button class="iconBtn" title="Sesli Anlatım" id="btnSpeak">🔊</button>
        <button class="iconBtn" title="Kapat" id="btnCloseStory">✖</button>
      </div>
    `;
    stage.appendChild(panel);

    panel.querySelector("#btnSpeak").addEventListener("click", ()=>{
      beep("click");
      speakTR(L.voice || L.story || L.desc);
    });
    panel.querySelector("#btnCloseStory").addEventListener("click", ()=>{
      beep("click");
      panel.remove();
    });
  }

  // ===== Album =====
  function openAlbumOverlay(){
    const count = state.collected.filter(Boolean).length;
    const cardsHTML = collectibleCards.map((c, idx)=>{
      const has = !!state.collected[idx];
      return `
        <div class="collectCard ${has ? "" : "locked"}">
          <div class="em">${c.em}</div>
          <div>
            <div class="ct">${has ? c.name : "??? Kart Kilitli"}</div>
            <div class="cf">${has ? c.fact : "Bu kartı açmak için ilgili seviyeyi bitir."}</div>
            <div class="cf">Seviye: ${idx+1}</div>
          </div>
        </div>
      `;
    }).join("");

    openOverlay({
      title: `Albüm 📚 (${count}/10)`,
      bodyHTML: `
        <p>Kartlara bakınca çevre davranışını hatırlarsın. 🌿</p>
        <div class="cardGrid">${cardsHTML}</div>
      `,
      footHTML: `<button class="btn primary" id="btnAlbumOk">Tamam ✅</button>`
    });
    $("#btnAlbumOk").addEventListener("click", ()=>{ beep("click"); closeOverlay(); });
  }
  $("#btnAlbum").addEventListener("click", ()=>{ beep("click"); openAlbumOverlay(); });

  // ===== Missions =====
  function openMissionsOverlay(){
    const pending = pendingMissionIds();
    if(!pending.length){
      openOverlay({
        title:"Görev Kartları 📌",
        bodyHTML:`<p>Şu an bekleyen görev yok. Yeni görevler her seviye bitince gelir. 🌟</p>`,
        footHTML:`<button class="btn primary" id="btnMissionOk">Tamam ✅</button>`
      });
      $("#btnMissionOk").addEventListener("click", ()=>{ beep("click"); closeOverlay(); });
      return;
    }
    const id = pending[0];
    const L = levels[id-1];
    const m = state.missions[String(id)];
    openOverlay({
      title: "Gerçek Hayat Görevi 📌",
      bodyHTML: `
        <p><strong>${L.heroName}</strong> diyor ki:</p>
        <div class="conseqScene" style="background: rgba(16,210,124,.08); border-color: rgba(16,210,124,.18);">
          <div class="big" style="background: rgba(16,210,124,.10); border-color: rgba(16,210,124,.18);">${L.heroEmoji}</div>
          <div>
            <div style="font-weight:1000; margin-bottom:6px;">${m?.text || L.missionText}</div>
            <p style="margin:0;">Bugün tarih: <strong>${todayISO()}</strong></p>
          </div>
        </div>
        <div class="checkRow">
          <label><input type="checkbox" id="chkDone" ${m?.done ? "checked" : ""}/> Yaptım ✅</label>
          <div style="font-weight:800; color:var(--muted);">Yapamadıysan sorun değil—yarın tekrar deneyebilirsin 😊</div>
        </div>
      `,
      footHTML: `
        <button class="btn" id="btnLater">Sonra</button>
        <button class="btn primary" id="btnSaveMission">Kaydet ✅</button>
      `
    });

    speakTR("Gerçek hayat görevin var. Hazır olunca işaretleyebilirsin.");

    $("#btnLater").addEventListener("click", ()=>{ beep("click"); closeOverlay(); });
    $("#btnSaveMission").addEventListener("click", ()=>{
      beep("click");
      const done = $("#chkDone").checked;
      state.missions[String(id)] = {
        text: m?.text || L.missionText,
        dateISO: m?.dateISO || todayISO(),
        done: !!done
      };
      save();
      ui();
      closeOverlay();
      setToast(done ? "Harika! Görev tamamlandı 🥳" : "Tamam! Hazır olunca işaretleyebilirsin 😊", "good");
    });
  }
  $("#btnMission").addEventListener("click", ()=>{ beep("click"); openMissionsOverlay(); });

  // ===== Level load / win =====
  function loadLevel(){
    const L = levels[state.currentLevel-1];
    $("#title").textContent = L.title;
    $("#desc").textContent = L.desc;
    $("#uiGoal").textContent = L.goalText;
    $("#uiTime").textContent = L.timeText;
    $("#btnStart").disabled = false;
    $("#btnStart").style.display = "block";

    clearStage();
    setHint(L.hint);
    showStoryPanel();
    startBubbles();
    ui();

    const pending = pendingMissionIds();
    if(pending.length){
      const shownKey = "kck_mission_hint_shown_" + todayISO();
      if(!sessionStorage.getItem(shownKey)){
        sessionStorage.setItem(shownKey, "1");
        openMissionsOverlay(false);
      }
    }
  }

  function winLevel(points = 10){
    const id = state.currentLevel;
    const L = levels[id-1];

    if(!state.done[id-1]) state.done[id-1] = true;
    state.score += points;

    state.collected[id-1] = true;

    const existing = state.missions[String(id)];
    state.missions[String(id)] = {
      text: L.missionText,
      dateISO: existing?.dateISO || todayISO(),
      done: existing?.done || false
    };

    if(state.unlocked < 10) state.unlocked = Math.max(state.unlocked, id+1);
    save();
    ui();

    playWinFX();
    setToast("Harika! Rozet kazandın! 🏅", "good");
    speakTR(L.winLine || "Harika!");

    const card = collectibleCards[id-1];
    openOverlay({
      title: "Seviye Bitti! 🎉",
      bodyHTML: `
        <p>Öğrendin ve başardın! Şimdi küçük bir “gerçek hayat” görevi alalım.</p>
        <div class="kpiRow">
          <div class="kpi">🏅 Rozet +1</div>
          <div class="kpi">📚 Kart +1 (${state.collected.filter(Boolean).length}/10)</div>
          <div class="kpi">⭐ +${points} puan</div>
        </div>

        <div style="margin-top:12px; font-weight:1000;">Yeni Kartın</div>
        <div class="collectCard" style="margin-top:8px;">
          <div class="em">${card.em}</div>
          <div>
            <div class="ct">${card.name}</div>
            <div class="cf">${card.fact}</div>
          </div>
        </div>

        <div style="margin-top:12px; font-weight:1000;">Gerçek Hayat Görevin</div>
        <div class="conseqScene" style="background: rgba(255,183,3,.10); border-color: rgba(255,183,3,.20);">
          <div class="big" style="background: rgba(255,183,3,.10); border-color: rgba(255,183,3,.20);">${L.heroEmoji}</div>
          <div>
            <div style="font-weight:1000; margin-bottom:6px;">${L.missionText}</div>
            <p style="margin:0;">Yapınca “Görev var!” bölümünden işaretleyebilirsin ✅</p>
          </div>
        </div>
      `,
      footHTML: `
        <button class="btn" id="btnOpenAlbum">Albümü Gör</button>
        <button class="btn" id="btnOpenMission">Görevi İşaretle</button>
        <button class="btn primary" id="btnNextLevel">Devam ▶</button>
      `
    });

    $("#btnOpenAlbum").addEventListener("click", ()=>{ beep("click"); openAlbumOverlay(); });
    $("#btnOpenMission").addEventListener("click", ()=>{ beep("click"); openMissionsOverlay(); });
    $("#btnNextLevel").addEventListener("click", ()=>{
      beep("click");
      closeOverlay();
      setTimeout(()=>{
        if(id < 10){
          state.currentLevel = id+1;
          save();
          loadLevel();
        } else {
          loadLevel();
        }
      }, 120);
    });
  }

  function failMsg(msg){ setToast(msg, "bad"); }

  // export UI functions
  window.KCK.clearStage = clearStage;
  window.KCK.setHint = setHint;
  window.KCK.openOverlay = openOverlay;
  window.KCK.closeOverlay = closeOverlay;
  window.KCK.openAlbumOverlay = openAlbumOverlay;
  window.KCK.openMissionsOverlay = openMissionsOverlay;
  window.KCK.showConsequence = showConsequence;
  window.KCK.showStoryPanel = showStoryPanel;
  window.KCK.renderLevelList = renderLevelList;
  window.KCK.ui = ui;
  window.KCK.loadLevel = loadLevel;
  window.KCK.winLevel = winLevel;
  window.KCK.failMsg = failMsg;
})();
