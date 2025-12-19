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

    function drawBulldog(ctx, x, y, r, nowMs) {
      const t = nowMs ?? performance.now();
      const bob = Math.sin(t / 240) * r * 0.03;

      // face
      ctx.beginPath();
      ctx.arc(x, y + bob, r, 0, Math.PI * 2);
      ctx.fillStyle = "#d89b59";
      ctx.fill();

      // ears
      ctx.fillStyle = "#c07f3f";
      ctx.beginPath();
      ctx.moveTo(x - r * 0.6, y - r * 0.2 + bob);
      ctx.quadraticCurveTo(x - r * 0.9, y - r * 0.9 + bob, x - r * 0.3, y - r * 0.6 + bob);
      ctx.quadraticCurveTo(x - r * 0.45, y - r * 0.3 + bob, x - r * 0.6, y - r * 0.2 + bob);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(x + r * 0.6, y - r * 0.2 + bob);
      ctx.quadraticCurveTo(x + r * 0.9, y - r * 0.9 + bob, x + r * 0.3, y - r * 0.6 + bob);
      ctx.quadraticCurveTo(x + r * 0.45, y - r * 0.3 + bob, x + r * 0.6, y - r * 0.2 + bob);
      ctx.fill();

      // muzzle
      ctx.beginPath();
      ctx.ellipse(x, y + r * 0.25 + bob, r * 0.55, r * 0.4, 0, 0, Math.PI * 2);
      ctx.fillStyle = "#f0d5b0";
      ctx.fill();

      // nose
      ctx.beginPath();
      ctx.ellipse(x, y + r * 0.1 + bob, r * 0.18, r * 0.12, 0, 0, Math.PI * 2);
      ctx.fillStyle = "#1a1a1a";
      ctx.fill();

      // eyes
      ctx.fillStyle = "#0b0f14";
      ctx.beginPath();
      ctx.arc(x - r * 0.35, y - r * 0.1 + bob, r * 0.12, 0, Math.PI * 2);
      ctx.arc(x + r * 0.35, y - r * 0.1 + bob, r * 0.12, 0, Math.PI * 2);
      ctx.fill();

      // brows
      ctx.strokeStyle = "#0b0f14";
      ctx.lineWidth = r * 0.08;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(x - r * 0.5, y - r * 0.25 + bob);
      ctx.lineTo(x - r * 0.2, y - r * 0.2 + bob);
      ctx.moveTo(x + r * 0.5, y - r * 0.25 + bob);
      ctx.lineTo(x + r * 0.2, y - r * 0.2 + bob);
      ctx.stroke();

      // mouth lines
      ctx.lineWidth = r * 0.06;
      ctx.beginPath();
      ctx.moveTo(x - r * 0.12, y + r * 0.32 + bob);
      ctx.lineTo(x + r * 0.12, y + r * 0.32 + bob);
      ctx.moveTo(x, y + r * 0.32 + bob);
      ctx.lineTo(x, y + r * 0.48 + bob);
      ctx.stroke();
    }

    function drawKibble(ctx, x, y, r) {
      const size = r * 0.9;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.PI / 8);
      ctx.beginPath();
      ctx.moveTo(-size, 0);
      ctx.quadraticCurveTo(-size, -size, 0, -size);
      ctx.quadraticCurveTo(size, -size, size, 0);
      ctx.quadraticCurveTo(size, size, 0, size);
      ctx.quadraticCurveTo(-size, size, -size, 0);
      ctx.closePath();
      ctx.fillStyle = "#b26a28";
      ctx.fill();

      ctx.beginPath();
      ctx.arc(-size * 0.2, -size * 0.15, size * 0.16, 0, Math.PI * 2);
      ctx.arc(size * 0.15, size * 0.05, size * 0.12, 0, Math.PI * 2);
      ctx.arc(-size * 0.05, size * 0.2, size * 0.1, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.25)";
      ctx.fill();
      ctx.restore();
    }

    function updateHUD() {
      if (levelEl) levelEl.textContent = `Level: ${state.level}`;
    }

    function flashLevel(direction) {
      if (!levelEl) return;
      const upClass = "level-flash-up";
      const downClass = "level-flash-down";
      levelEl.classList.remove(upClass, downClass);
      void levelEl.offsetWidth; // force reflow to restart animation
      const targetClass = direction === "down" ? downClass : upClass;
      levelEl.classList.add(targetClass);
      if (levelFlashTimeout) clearTimeout(levelFlashTimeout);
      levelFlashTimeout = window.setTimeout(() => {
        levelEl.classList.remove(upClass, downClass);
        levelFlashTimeout = null;
      }, 900);
    }

    function updateTime(nowMs) {
      if (!started || levelStartMs === null) return;
      const elapsedSec = (nowMs - levelStartMs) / 1000;
      if (timeEl) timeEl.textContent = `Time: ${elapsedSec.toFixed(1)}s`;
    }

    function resetLevelOne(nowMs) {
      const ts = nowMs ?? performance.now();
      state.level = 0;
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
      flashLevel("down");
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

          flashLevel("up");

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

      // kibble
      drawKibble(ctx, star.x, star.y, star.r);

      // bulldog
      drawBulldog(ctx, player.x, player.y, player.r, nowMs);

      ctx.fillStyle = "rgba(255,255,255,0.75)";
      ctx.font = "14px monospace";
    }

    function loop(nowMs) {
      update(nowMs);

      if (started && !gameOver) {
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

    // Start/Stop via clavier : Entrée (start/toggle), Échap (stop)
    window.addEventListener("keydown", (e) => {
      if (e.repeat) return;
      if (e.key === "Enter") {
        e.preventDefault();
        toggleStart();
      } else if (e.key === "Escape") {
        e.preventDefault();
        if (started) resetToIdle();
      }
    });

    updateHUD();
    if (timeEl) timeEl.textContent = "Time: 0.0s";
    setButtonRunning(false);
    loop();
  }
}
