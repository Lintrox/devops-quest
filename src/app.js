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

// Messages différents selon le niveau atteint
function getLevelUpMessage(newLevel) {
  const messages = {
    2: "Bravo ! Tu commences à maîtriser les bases ! 🌱",
    3: "Excellent ! Tu es maintenant un apprenti DevOps ! 🚀",
    4: "Impressionnant ! Tu deviens expert en automatisation ! ⚡",
    5: "Incroyable ! Tu es un vrai maître DevOps ! 🏆",
    6: "Légendaire ! Plus rien ne t'arrête ! 🌟",
    7: "Tu as atteint le niveau ultime ! Tu es une légende SRE ! 👑"
  };
  return messages[newLevel] || `Level Up! Niveau ${newLevel} atteint ! 🎉`;
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
  if (level === 1) {
    document.body.style.backgroundColor = "#f710aa";
  } else if (level === 2) {
    document.body.style.backgroundColor = "#16213e";
  } else if (level === 3) {
    document.body.style.backgroundColor = "#0f3460";
  } else if (level === 4) {
    document.body.style.backgroundColor = "#533483";
  } else if (level >= 5) {
    document.body.style.backgroundColor = "#2d1b4e";
  }

    
}

document.getElementById("btnQuest").addEventListener("click", () => {
  xp += 10;
  log("Mission réussie ✅ (+10 XP)");
  if (xp % 30 === 0) {
    level += 1;
    log(getLevelUpMessage(level));
  }
  update();
});

document.getElementById("btnDeploy").addEventListener("click", async () => {
  log("Déploiement simulé… ⚙️");
  await new Promise(r => setTimeout(r, 600));
  level += 1;
  log(`Déploiement OK 🚀`);
  log(getLevelUpMessage(level));
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
  log(getLevelUpMessage(level));
  update();
});