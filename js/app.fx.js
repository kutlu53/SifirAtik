// app.fx.js
(() => {
  'use strict';
  const { $, rnd, state } = window.KCK;
  const { beep } = window.KCK;

  const stage = $("#stage");

  function stageShake() {
    stage.classList.remove("shake");
    void stage.offsetWidth;
    stage.classList.add("shake");
  }

  function setToast(msg, type = "good") {
    const t = stage.querySelector("#toast");
    t.className = "toast " + (type === "bad" ? "bad" : "good");
    t.textContent = msg;
    t.style.display = "block";

    if (type === "bad") {
      beep("wrong");
      stageShake();
    } else {
      beep("good");
    }
    clearTimeout(setToast._tm);
    setToast._tm = setTimeout(() => (t.style.display = "none"), 1200);
  }

  let bubbleTimer = null;
  function startBubbles() {
    stopBubbles();
    bubbleTimer = setInterval(() => {
      const b = document.createElement("div");
      b.className = "bubbleFx";
      b.style.left = rnd(5, 95) + "%";
      b.style.bottom = "-24px";
      const s = rnd(10, 22);
      b.style.width = b.style.height = s + "px";
      b.style.animationDuration = rnd(2.8, 4.4) + "s";
      stage.appendChild(b);
      setTimeout(() => b.remove(), 4600);
    }, 420);
  }
  function stopBubbles() {
    if (bubbleTimer) clearInterval(bubbleTimer);
    bubbleTimer = null;
  }

  function playWinFX() {
    beep("win");
    const fx = document.createElement("div");
    fx.className = "fx";
    stage.appendChild(fx);

    const w = document.createElement("div");
    w.className = "wave";
    fx.appendChild(w);

    const colors = [
      "rgba(255,0,153,.85)",
      "rgba(0,255,200,.85)",
      "rgba(255,183,3,.85)",
      "rgba(124,58,237,.85)",
      "rgba(0,183,255,.85)"
    ];
    for (let i = 0; i < 22; i++) {
      const s = document.createElement("div");
      s.className = "spark";
      s.style.left = 8 + Math.random() * 84 + "%";
      s.style.top = 8 + Math.random() * 26 + "%";
      s.style.animationDelay = Math.random() * 140 + "ms";
      s.style.width = s.style.height = 6 + Math.random() * 12 + "px";
      s.style.background = colors[Math.floor(Math.random() * colors.length)];
      fx.appendChild(s);
    }
    setTimeout(() => fx.remove(), 980);
  }

  // Optional: vibration helper (safe)
  function vib(ms = 20) {
    try {
      if (navigator.vibrate) navigator.vibrate(ms);
    } catch (e) {}
  }

  window.KCK.stage = stage;
  window.KCK.stageShake = stageShake;
  window.KCK.setToast = setToast;
  window.KCK.startBubbles = startBubbles;
  window.KCK.stopBubbles = stopBubbles;
  window.KCK.playWinFX = playWinFX;
  window.KCK.vib = vib;
})();