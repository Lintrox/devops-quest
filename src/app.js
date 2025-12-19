const canvas = document.getElementById("game");
const logEl = document.getElementById("log");
const scoreEl = document.getElementById("score");
const levelEl = document.getElementById("level");
const timeEl = document.getElementById("time");
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
    // HUD build
    if (buildEl) buildEl.textContent = `Build: ${window.BUILD_ID || "local"}`;

    // Inputs
    const keys = new Set();
    window.addEventListener("keydown", (e) => keys.add(e.key.toLowerCase()));
    window.addEventListener("keyup", (e) => keys.delete(e.key.toLowerCase()));

    // Game state
    const state = { score: 0, level: 1 };

    const BASE_PLAYER_SPEED = 3.2;
    const BASE_STAR_RADIUS = 10;
    const STAR_SHRINK_STEP = 4;
    const MIN_STAR_RADIUS = 4;
    const MAX_LEVEL = 10;
    let starRadius = BASE_STAR_RADIUS;
    const player = { x: 80, y: 80, r: 14, speed: BASE_PLAYER_SPEED };
    let star = spawnStar();
    let touchingEdge = false;

    // Timer par niveau
    let gameStartMs = performance.now();
    let levelStartMs = gameStartMs;
    let lastUiUpdateMs = 0;
    let bestLevelTimeSec = null;
    let gameOver = false;

    function spawnStar() {
      const padding = 30;
      return {
        x: padding + Math.random() * (canvas.width - 2 * padding),
        y: padding + Math.random() * (canvas.height - 2 * padding),
        r: starRadius,
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

    function updateTime(nowMs) {
      const elapsedSec = (nowMs - levelStartMs) / 1000;
      if (timeEl) timeEl.textContent = `Time: ${elapsedSec.toFixed(1)}s`;
    }

    function resetLevelOne(nowMs) {
      const ts = nowMs ?? performance.now();
      state.level = 1;
      player.speed = BASE_PLAYER_SPEED;
      starRadius = BASE_STAR_RADIUS;
      star.r = starRadius;
      levelStartMs = ts;
      gameStartMs = ts;
      bestLevelTimeSec = null;
      gameOver = false;
      updateHUD();
      updateTime(ts);
      log("↩️ Bord touché : retour au niveau 1");
    }

    function finishGame(nowMs) {
      gameOver = true;
      const finalTimeSec = (nowMs - gameStartMs) / 1000;
      const best = bestLevelTimeSec === null ? null : bestLevelTimeSec.toFixed(2);
      const bestText = best ? `${best}s` : "N/A";
      log(`🏁 Fin du jeu ! Temps final: ${finalTimeSec.toFixed(2)}s | Niveau le plus rapide: ${bestText}`);
      if (timeEl) timeEl.textContent = `Temps final: ${finalTimeSec.toFixed(2)}s (lvl le + rapide: ${bestText})`;
    }

    function update(nowMs) {
      if (gameOver) return;

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

      const isTouchingEdge =
        player.x <= player.r ||
        player.x >= canvas.width - player.r ||
        player.y <= player.r ||
        player.y >= canvas.height - player.r;

      if (isTouchingEdge && !touchingEdge) {
        resetLevelOne(nowMs);
      }
      touchingEdge = isTouchingEdge;

      // Collision joueur-étoile
      if (dist(player, star) < player.r + star.r) {
        state.score += 10;
        star = spawnStar();

        // Level up toutes les 50 points
        if (state.score % 50 === 0 && state.level < MAX_LEVEL) {
          const levelTimeSec = (nowMs - levelStartMs) / 1000;

          bestLevelTimeSec =
            bestLevelTimeSec === null
              ? levelTimeSec
              : Math.min(bestLevelTimeSec, levelTimeSec);

          const nextLevel = Math.min(MAX_LEVEL, state.level + 1);
          state.level = nextLevel;

          if (state.level % 2 === 0 && starRadius > MIN_STAR_RADIUS) {
            starRadius = Math.max(MIN_STAR_RADIUS, starRadius - STAR_SHRINK_STEP);
            star.r = starRadius;
            log(`✨ Niveau ${state.level}: étoile rétrécie`);
          }

          log(`🎉 Level Up! Niveau ${state.level} (temps: ${levelTimeSec.toFixed(2)}s)`);

          if (state.level === MAX_LEVEL) {
            updateHUD();
            finishGame(nowMs);
            return;
          }

          player.speed += 0.4;

          // reset chrono pour le niveau suivant
          levelStartMs = nowMs;
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
      ctx.fillText("Utilise les flèches pour te déplacer", 14, canvas.height - 14);
    }

    function loop(nowMs) {
      update(nowMs);

      // Refresh timer UI (max 10 fois/sec)
      if (!gameOver && nowMs - lastUiUpdateMs > 100) {
        updateTime(nowMs);
        lastUiUpdateMs = nowMs;
      }

      draw();
      requestAnimationFrame(loop);
    }

    updateHUD();
    log("✅ Jeu lancé. Déplace toi avec les flèches.");
    loop();
  }
}
