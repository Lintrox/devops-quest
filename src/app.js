const canvas = document.getElementById("game");
const logEl = document.getElementById("log");
const scoreEl = document.getElementById("score");
const levelEl = document.getElementById("level");
const buildEl = document.getElementById("build");

function log(msg) {
  if (!logEl) return;
  const line = document.createElement("div");
  line.textContent = `> ${msg}`;
  logEl.appendChild(line);
  logEl.scrollTop = logEl.scrollHeight;
}

if (!canvas) {
  console.error("Canvas #game introuvable");
  log("❌ Canvas introuvable (#game). Vérifie index.html");
} else {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    console.error("Impossible d'obtenir le contexte 2D");
    log("❌ Contexte 2D introuvable");
  } else {
    // HUD
    if (buildEl) buildEl.textContent = `Build: ${window.BUILD_ID || "local"}`;

    const keys = new Set();
    window.addEventListener("keydown", (e) => keys.add(e.key.toLowerCase()));
    window.addEventListener("keyup", (e) => keys.delete(e.key.toLowerCase()));

    const state = { score: 0, level: 1 };

    const player = { x: 80, y: 80, r: 14, speed: 3.2 };
    let star = spawnStar();

    function spawnStar() {
      const padding = 30;
      return {
        x: padding + Math.random() * (canvas.width - 2 * padding),
        y: padding + Math.random() * (canvas.height - 2 * padding),
        r: 10,
      };
    }

    function dist(a, b) {
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      return Math.sqrt(dx * dx + dy * dy);
    }

    function updateHUD() {
      if (scoreEl) scoreEl.textContent = `Score: ${state.score}`;
      if (levelEl) levelEl.textContent = `Level: ${state.level}`;
    }

    function update() {
      const up = keys.has("arrowup") || keys.has("z");
      const down = keys.has("arrowdown") || keys.has("s");
      const left = keys.has("arrowleft") || keys.has("q");
      const right = keys.has("arrowright") || keys.has("d");

      if (up) player.y -= player.speed;
      if (down) player.y += player.speed;
      if (left) player.x -= player.speed;
      if (right) player.x += player.speed;

      player.x = Math.max(player.r, Math.min(canvas.width - player.r, player.x));
      player.y = Math.max(player.r, Math.min(canvas.height - player.r, player.y));

      if (dist(player, star) < player.r + star.r) {
        state.score += 10;
        log("⭐ Étoile ramassée (+10)");
        star = spawnStar();

        if (state.score % 50 === 0) {
          state.level += 1;
          player.speed += 0.4;
          log(`🎉 Level Up! Niveau ${state.level}`);
        }
        updateHUD();
      }
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // star
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
      ctx.fillStyle = "#ffd166";
      ctx.fill();

      // player
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
      ctx.fillStyle = "#4cc9f0";
      ctx.fill();

      ctx.fillStyle = "rgba(255,255,255,0.75)";
      ctx.font = "14px monospace";
      ctx.fillText("Bouge avec ZQSD / flèches", 14, canvas.height - 14);
    }

    function loop() {
      update();
      draw();
      requestAnimationFrame(loop);
    }

    updateHUD();
    log("✅ Jeu lancé. Bouge avec ZQSD / flèches.");
    loop();
  }
}
