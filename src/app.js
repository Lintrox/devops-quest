const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const logEl = document.getElementById("log");
const scoreEl = document.getElementById("score");
const levelEl = document.getElementById("level");
const buildEl = document.getElementById("build");

buildEl.textContent = `Build: ${window.BUILD_ID || "local"}`;

function log(msg) {
  const line = document.createElement("div");
  line.textContent = `> ${msg}`;
  logEl.appendChild(line);
  logEl.scrollTop = logEl.scrollHeight;
}

const keys = new Set();

window.addEventListener("keydown", (e) => {
  keys.add(e.key.toLowerCase());
});
window.addEventListener("keyup", (e) => {
  keys.delete(e.key.toLowerCase());
});

const state = {
  score: 0,
  level: 1,
};

const player = {
  x: 60,
  y: 60,
  r: 14,
  speed: 3.2,
};

let star = spawnStar();

function spawnStar() {
  // spawn within bounds
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
  scoreEl.textContent = `Score: ${state.score}`;
  levelEl.textContent = `Level: ${state.level}`;
}

function update() {
  // Controls: arrows or ZQSD
  const up = keys.has("arrowup") || keys.has("z");
  const down = keys.has("arrowdown") || keys.has("s");
  const left = keys.has("arrowleft") || keys.has("q");
  const right = keys.has("arrowright") || keys.has("d");

  if (up) player.y -= player.speed;
  if (down) player.y += player.speed;
  if (left) player.x -= player.speed;
  if (right) player.x += player.speed;

  // Clamp to canvas
  player.x = Math.max(player.r, Math.min(canvas.width - player.r, player.x));
  player.y = Math.max(player.r, Math.min(canvas.height - player.r, player.y));

  // Collision player-star
  if (dist(player, star) < player.r + star.r) {
    state.score += 10;
    log("⭐ Étoile ramassée (+10)");
    star = spawnStar();

    if (state.score % 50 === 0) {
      state.level += 1;
      player.speed += 0.4;
      log(`🎉 Level Up! Niveau ${state.level} (vitesse +)`);
    }
    updateHUD();
  }
}

function draw() {
  // background
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

  // small “shadow” text
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.font = "14px monospace";
  ctx.fillText("Attrape ⭐ pour gagner des points", 14, canvas.height - 14);
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

// Start
updateHUD();
log("Jeu lancé. Déplace-toi avec ZQSD / flèches.");
loop();
