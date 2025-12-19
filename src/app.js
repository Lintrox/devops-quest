let xp = 0;
let level = 1;

const logEl = document.getElementById("log");
const xpEl = document.getElementById("xp");
const levelEl = document.getElementById("level");
const buildEl = document.getElementById("build");
const btnSpecialQuestEl = document.getElementById("btnSpecialQuest");

function log(msg) {
  const line = document.createElement("div");
  line.textContent = `> ${msg}`;
  logEl.appendChild(line);
  logEl.scrollTop = logEl.scrollHeight;
}

function update() {
  xpEl.textContent = `XP: ${xp}`;
  levelEl.textContent = `Level: ${level}`;
  
  // Désactiver le bouton Special Quest à partir du niveau 3
  if (level >= 3) {
    btnSpecialQuestEl.disabled = true;
    btnSpecialQuestEl.style.opacity = "0.5";
    btnSpecialQuestEl.style.cursor = "not-allowed";
  }
  
  // Changer la couleur de fond en fonction du niveau
  if (level += 1) {
    document.body.style.backgroundColor = "#1a1a2e"
  } else if (level % 2 === 0) {
    document.body.style.backgroundColor = "#16213e"
    log('waouw! Quel niveau!');
  } else if (level % 3 === 0) {
    document.body.style.backgroundColor = "#0f3460"
    log("Incroyable!");
  } else if (level % 4 === 0) {
    document.body.style.backgroundColor = "#533483"
    log('après je trouve que c est quand même aberrant de try-hard un jeu comme ça quoi mais oklm');
  }

    
}

document.getElementById("btnQuest").addEventListener("click", () => {
  xp += 10;
  log("Mission réussie ✅ (+10 XP)");
if (xp % 30 === 0) {
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

document.getElementById("btnSpecialQuest").addEventListener("click", () => {
  log("Quête spéciale ✅ (+50 XP)");
  xp += 50;
  level += 1;
  log(`waouw! Tu es un vrai padawan SRE! (level ${level})`);
  update();
});