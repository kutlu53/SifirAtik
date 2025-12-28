// app.main.js
(() => {
  'use strict';
  const { $, state, load, save } = window.KCK;
  const { ui, loadLevel, renderLevelList, openOverlay, closeOverlay, setToast } = window.KCK;
  const { ensureAudio, beep, speakTR } = window.KCK;

  function resetProgress() {
    // Reset but keep sound/voice preferences
    const keepSound = state.soundOn;
    const keepVoice = state.voiceOn;

    state.currentLevel = 1;
    state.unlocked = 1;
    state.done = Array(10).fill(false);
    state.score = 0;
    state.collected = Array(10).fill(false);
    state.missions = {};
    state.pretest = null;
    state.posttest = null;

    state.soundOn = keepSound;
    state.voiceOn = keepVoice;

    save();
    ui();
    loadLevel();
  }

  $("#btnSound").addEventListener("click", () => {
    state.soundOn = !state.soundOn;
    save();
    ui();
    setToast(state.soundOn ? "Ses açıldı 🔊" : "Ses kapandı 🔇", "good");
  });

  $("#btnVoice").addEventListener("click", () => {
    state.voiceOn = !state.voiceOn;
    save();
    ui();
    setToast(state.voiceOn ? "Anlatım açıldı 🗣️" : "Anlatım kapandı 🤫", "good");
  });

  $("#btnReset").addEventListener("click", () => {
    beep("click");
    openOverlay({
      title: "Sıfırlama",
      bodyHTML: `<p>İlerlemeyi sıfırlamak istiyor musun? (Rozetler, puan ve albüm sıfırlanır.)</p>`,
      footHTML: `
        <button class="btn" id="btnNoReset">Vazgeç</button>
        <button class="btn primary" id="btnYesReset">Sıfırla ✅</button>
      `
    });
    $("#btnNoReset").addEventListener("click", () => { beep("click"); closeOverlay(); });
    $("#btnYesReset").addEventListener("click", () => {
      beep("click");
      closeOverlay();
      resetProgress();
      setToast("Sıfırlandı ✅", "good");
    });
  });

  $("#btnTeacher").addEventListener("click", () => {
    beep("click");
    state.unlocked = 10;
    save();
    setToast("Öğretmen Modu: tüm seviyeler açıldı ✅", "good");
    renderLevelList();
  });

  let isStarting = false;

  // Start current level game
  $("#btnStart").addEventListener("click", () => {
    ensureAudio();
    const levels = window.KCK.levels || [];
    const L = levels[state.currentLevel - 1];
    if (!L) return;

    $("#btnStart").disabled = true;
    $("#btnStart").style.display = "none";

    // Call run function by key
    const key = L.runKey;
    const fn = window.KCK.games?.[key];
    if (typeof fn === "function") {
      isStarting = true;
      speakTR(L.voice || L.story || L.desc, () => {
        if (!isStarting) return;
        const { stage } = window.KCK;
        if (typeof stage._cleanup === "function") stage._cleanup();
        fn();
      });
    } else {
      setToast("Oyun dosyası bulunamadı 😅", "bad");
      $("#btnStart").disabled = false;
      $("#btnStart").style.display = "block";
    }
  });

  // Wrap loadLevel to always cleanup stage timers etc.
  const _loadLevel = loadLevel;
  window.KCK.loadLevel = function() {
    isStarting = false;
    const { stage } = window.KCK;
    if (typeof stage._cleanup === "function") stage._cleanup();
    _loadLevel();
  };

  // Boot
  load();
  ui();
  window.KCK.loadLevel();
})();