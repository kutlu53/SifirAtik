// app.audio.js
(() => {
  'use strict';
  const { state } = window.KCK;

  let audioCtx = null;
  function ensureAudio() {
    if (!state.soundOn) return;
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") audioCtx.resume();
  }

  function beep(type = "win") {
    if (!state.soundOn) return;
    ensureAudio();
    if (!audioCtx) return;

    const t0 = audioCtx.currentTime;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = "sine";

    const freq =
      type === "win" ? 740 :
      type === "click" ? 520 :
      type === "good" ? 620 :
      type === "wrong" ? 180 : 420;

    o.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.18, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.24);
    o.connect(g);
    g.connect(audioCtx.destination);
    o.start(t0);
    o.stop(t0 + 0.28);
  }

  // speech synthesis
  let voiceReady = false;
  function speakTR(text, onEnd) {
    if (!state.voiceOn || !("speechSynthesis" in window) || !text) {
      if (onEnd) onEnd();
      return;
    }

    const synth = window.speechSynthesis;
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.0; // Normal hız (daha anlaşılır)
    u.pitch = 1.0; // Doğal ton (robotikleşmeyi önler)
    u.lang = "tr-TR";
    if (onEnd) {
      u.onend = onEnd;
    }

    const pickVoice = () => {
      const vs = synth.getVoices?.() || [];
      // Öncelik: Google (Android/Chrome), Emel (Windows), veya genel Kadın/Female ibaresi
      let tr = vs.find(v => (v.lang || "").toLowerCase().startsWith("tr") && 
               (v.name.includes("Google") || v.name.includes("Emel") || v.name.includes("Female") || v.name.includes("Kadın")));
      if (!tr) tr = vs.find(v => (v.lang || "").toLowerCase().startsWith("tr"));
      
      if (tr) u.voice = tr;
      synth.cancel();
      synth.speak(u);
    };

    if (!voiceReady) setTimeout(pickVoice, 160);
    else pickVoice();
  }

  if ("speechSynthesis" in window) {
    window.speechSynthesis.onvoiceschanged = () => { voiceReady = true; };
  }

  window.KCK.ensureAudio = ensureAudio;
  window.KCK.beep = beep;
  window.KCK.speakTR = speakTR;
})();
