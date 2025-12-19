const canvas = document.getElementById("game");
const levelEl = document.getElementById("level");
const timeEl = document.getElementById("time");
const startBtn = document.getElementById("start-btn");

function log() {} // logging désactivé (zone log supprimée)

if (!canvas) {
  console.error("Canvas #game introuvable");
} else {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    console.error("Impossible d'obtenir le contexte 2D");
  } else {
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
    const EDGE_FLASH_MS = 400;
    let starRadius = BASE_STAR_RADIUS;
    const player = { x: 80, y: 80, r: 14, speed: BASE_PLAYER_SPEED };
    let star = spawnStar();
    let touchingEdge = false;
    let edgeFlashTimeout = null;
    let started = false;
    let levelFlashTimeout = null;

    // Timer par niveau
    let gameStartMs = null;
    let levelStartMs = null;
    let lastUiUpdateMs = null;
    let bestLevelTimeSec = null;
    let bestLevelNumber = null;
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

    function drawPacman(ctx, x, y, r, nowMs) {
      const t = nowMs ?? performance.now();
      const pulse = Math.abs(Math.sin(t / 240));
      const mouth = 0.2 * Math.PI + 0.25 * Math.PI * pulse;
      const start = mouth;
      const end = Math.PI * 2 - mouth;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.arc(x, y, r, start, end);
      ctx.closePath();
      ctx.fillStyle = "#ffd54f";
      ctx.fill();

      ctx.beginPath();
      ctx.arc(x + r * 0.2, y - r * 0.35, r * 0.12, 0, Math.PI * 2);
      ctx.fillStyle = "#0b0f14";
      ctx.fill();
    }

    function drawCheese(ctx, x, y, r) {
      ctx.fillStyle = "#f4b400";
      ctx.beginPath();
      ctx.moveTo(x - r, y + r * 0.85);
      ctx.lineTo(x + r, y + r * 0.85);
      ctx.lineTo(x + r * 1.15, y - r * 0.6);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "rgba(255, 241, 166, 0.9)";
      ctx.beginPath();
      ctx.arc(x - r * 0.3, y + r * 0.3, r * 0.18, 0, Math.PI * 2);
      ctx.arc(x + r * 0.25, y + r * 0.15, r * 0.14, 0, Math.PI * 2);
      ctx.arc(x + r * 0.4, y - r * 0.25, r * 0.12, 0, Math.PI * 2);
      ctx.fill();
    }

    function updateHUD() {
      if (levelEl) levelEl.textContent = `Level: ${state.level}`;
    }

    function flashLevel() {
      if (!levelEl) return;
      levelEl.classList.remove("level-flash");
      void levelEl.offsetWidth; // force reflow to restart animation
      levelEl.classList.add("level-flash");
      if (levelFlashTimeout) clearTimeout(levelFlashTimeout);
      levelFlashTimeout = window.setTimeout(() => {
        levelEl.classList.remove("level-flash");
        levelFlashTimeout = null;
      }, 600);
    }

    function updateTime(nowMs) {
      if (!started || levelStartMs === null) return;
      const elapsedSec = (nowMs - levelStartMs) / 1000;
      if (timeEl) timeEl.textContent = `Time: ${elapsedSec.toFixed(1)}s`;
    }

    function resetLevelOne(nowMs) {
      const ts = nowMs ?? performance.now();
      state.level = 1;
      player.speed = BASE_PLAYER_SPEED;
      starRadius = BASE_STAR_RADIUS;
      star.r = starRadius;
      levelStartMs = started ? ts : null;
      gameStartMs = started ? ts : null;
      bestLevelTimeSec = null;
      bestLevelNumber = null;
      gameOver = false;
      updateHUD();
      if (started) updateTime(ts);
    }

    function flashEdgeBorder() {
      canvas.classList.add("edge-flash");
      if (edgeFlashTimeout) clearTimeout(edgeFlashTimeout);
      edgeFlashTimeout = window.setTimeout(() => {
        canvas.classList.remove("edge-flash");
        edgeFlashTimeout = null;
      }, EDGE_FLASH_MS);
    }

    function finishGame(nowMs) {
      gameOver = true;
      const finalTimeSec = gameStartMs === null ? 0 : (nowMs - gameStartMs) / 1000;
      const bestTime = bestLevelTimeSec === null ? null : bestLevelTimeSec.toFixed(2);
      const bestText =
        bestTime && bestLevelNumber ? `Niveau ${bestLevelNumber} en ${bestTime}s` : "Aucun niveau chronométré";
      if (timeEl) timeEl.textContent = `Temps final: ${finalTimeSec.toFixed(2)}s`;
    }

    function update(nowMs) {
      if (!started || gameOver) return;

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
        flashEdgeBorder();
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
          const completedLevel = state.level;

          bestLevelTimeSec =
            bestLevelTimeSec === null
              ? levelTimeSec
              : Math.min(bestLevelTimeSec, levelTimeSec);
          if (bestLevelTimeSec === levelTimeSec) bestLevelNumber = completedLevel;

          const nextLevel = Math.min(MAX_LEVEL, state.level + 1);
          state.level = nextLevel;

          if (state.level % 2 === 0 && starRadius > MIN_STAR_RADIUS) {
            starRadius = Math.max(MIN_STAR_RADIUS, starRadius - STAR_SHRINK_STEP);
            star.r = starRadius;
          }

          flashLevel();

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

    function draw(nowMs) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // cheese
      drawCheese(ctx, star.x, star.y, star.r);

      // pacman
      drawPacman(ctx, player.x, player.y, player.r, nowMs);

      ctx.fillStyle = "rgba(255,255,255,0.75)";
      ctx.font = "14px monospace";
    }

    function loop(nowMs) {
      update(nowMs);

      // Refresh timer UI (max 10 fois/sec)
      if (started && !gameOver && nowMs - (lastUiUpdateMs ?? 0) > 100) {
        updateTime(nowMs);
        lastUiUpdateMs = nowMs;
      }

      draw(nowMs);
      requestAnimationFrame(loop);
    }

    function setButtonRunning(isRunning) {
      if (!startBtn) return;
      startBtn.textContent = isRunning ? "Stop" : "Start";
      startBtn.classList.toggle("stop", isRunning);
    }

    function resetToIdle() {
      state.score = 0;
      state.level = 1;
      player.x = 80;
      player.y = 80;
      player.speed = BASE_PLAYER_SPEED;
      starRadius = BASE_STAR_RADIUS;
      star = spawnStar();
      touchingEdge = false;
      if (edgeFlashTimeout) {
        clearTimeout(edgeFlashTimeout);
        edgeFlashTimeout = null;
      }
      canvas.classList.remove("edge-flash");
      gameStartMs = null;
      levelStartMs = null;
      lastUiUpdateMs = null;
      bestLevelTimeSec = null;
      bestLevelNumber = null;
      gameOver = false;
      started = false;
      setButtonRunning(false);
      updateHUD();
      if (timeEl) timeEl.textContent = "Time: 0.0s";
    }

    function startGame() {
      const now = performance.now();
      resetToIdle();
      gameStartMs = now;
      levelStartMs = now;
      lastUiUpdateMs = now;
      started = true;
      setButtonRunning(true);
      updateHUD();
      updateTime(now);
    }

    function toggleStart() {
      if (!started) {
        startGame();
      } else {
        resetToIdle();
      }
    }

    if (startBtn) startBtn.addEventListener("click", toggleStart);

    updateHUD();
    if (timeEl) timeEl.textContent = "Time: 0.0s";
    setButtonRunning(false);
    loop();
  }
}
