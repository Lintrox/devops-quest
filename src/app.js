let xp = 0;
let level = 1;

const logEl = document.getElementById("log");
const xpEl = document.getElementById("xp");
const levelEl = document.getElementById("level");
const buildEl = document.getElementById("build");

function log(msg) {
  const line = document.createElement("div");
  line.textContent = `> ${msg}`;
  logEl.appendChild(line);
  logEl.scrollTop = logEl.scrollHeight;
}

function update() {
  xpEl.textContent = `XP: ${xp}`;
  levelEl.textContent = `Level: ${level}`;
}

document.getElementById("btnQuest").addEventListener("click", () => {
  xp += 10;
  log("Quête terminée ✅ (+10 XP)");
  if (xp % 50 === 0) {
    level += 1;
    log(`Level Up! 🎉 (Level ${level})`);
  }
  update();
});

document.getElementById("btnDeploy").addEventListener("click", async () => {
  log("Déploiement simulé… ⚙️");
  await new Promise(r => setTimeout(r, 600));
  level += 1;
  log(`Déploiement OK 🚀 → Level ${level}`);
  update();
});

// Affiche une “version build” via variable d'env injectée (optionnel)
buildEl.textContent = `Build: ${window.BUILD_ID || "local"}`;
log("Jeu chargé. Prêt à automatiser.");
update();
