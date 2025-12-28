// app.core.js
(() => {
  'use strict';

  const $ = (s, el = document) => el.querySelector(s);

  const KEY = "kck_progress_v3_pedagogic";
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const rnd = (min, max) => Math.random() * (max - min) + min;

  const todayISO = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  // Global state (kept compatible with existing saves)
  const state = {
    currentLevel: 1,
    unlocked: 1,
    done: Array(10).fill(false),
    score: 0,
    soundOn: true,
    voiceOn: true,

    // "collected" = album cards (level-based) - keep for backward compatibility
    collected: Array(10).fill(false),

    missions: {},

    // Newer features may use these; harmless if unused
    pretest: null,
    posttest: null
  };

  function load() {
    const raw = localStorage.getItem(KEY);
    if (!raw) return;
    try {
      const obj = JSON.parse(raw);
      if (!obj) return;

      state.currentLevel = clamp(obj.currentLevel || 1, 1, 10);
      state.unlocked = clamp(obj.unlocked || 1, 1, 10);

      state.done = Array.isArray(obj.done) ? obj.done.slice(0, 10).map(Boolean) : Array(10).fill(false);
      while (state.done.length < 10) state.done.push(false);

      state.score = Number(obj.score || 0);
      state.soundOn = obj.soundOn !== false;
      state.voiceOn = obj.voiceOn !== false;

      state.collected = Array.isArray(obj.collected) ? obj.collected.slice(0, 10).map(Boolean) : Array(10).fill(false);
      while (state.collected.length < 10) state.collected.push(false);

      state.missions = (obj.missions && typeof obj.missions === "object") ? obj.missions : {};

      state.pretest = obj.pretest || null;
      state.posttest = obj.posttest || null;
    } catch (e) {
      // ignore
    }
  }

  function save() {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        currentLevel: state.currentLevel,
        unlocked: state.unlocked,
        done: state.done,
        score: state.score,
        soundOn: state.soundOn,
        voiceOn: state.voiceOn,
        collected: state.collected,
        missions: state.missions,
        pretest: state.pretest,
        posttest: state.posttest
      })
    );
  }

  const KCK = (window.KCK = window.KCK || {});
  KCK.$ = $;
  KCK.KEY = KEY;
  KCK.state = state;
  KCK.clamp = clamp;
  KCK.rnd = rnd;
  KCK.todayISO = todayISO;
  KCK.load = load;
  KCK.save = save;
})();