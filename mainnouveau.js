// ✅ Initialisation PIXI
const app = new PIXI.Application({
  resizeTo: window,
  backgroundColor: 0x1099bb,
  resolution: window.devicePixelRatio || 1,
});
document.body.appendChild(app.view);

// ✅ Paramètres de la machine
const SYMBOL_SIZE = 100;
const NUM_REELS = 5;
const NUM_ROWS = 3;

// ✅ Bandes de symboles
const REELS = [
  ["hv2", "lv3", "lv3", "hv1", "hv1", "lv1", "hv1", "hv4", "lv1", "hv3", "hv2", "hv3", "lv4", "hv4", "lv1", "hv2", "lv4", "lv1", "lv3", "hv2"],
  ["hv1", "lv2", "lv3", "lv2", "lv1", "lv1", "lv4", "lv1", "lv1", "hv4", "lv3", "hv2", "lv1", "lv3", "hv1", "lv1", "lv2", "lv4", "lv3", "lv2"],
  ["lv1", "hv2", "lv3", "lv4", "hv3", "hv2", "lv2", "hv2", "hv2", "lv1", "hv3", "lv1", "hv1", "lv2", "hv3", "hv2", "hv4", "hv1", "lv2", "lv4"],
  ["hv2", "lv2", "hv3", "lv2", "lv4", "lv4", "hv3", "lv2", "lv4", "hv1", "lv1", "hv1", "lv2", "hv3", "lv2", "lv3", "hv2", "lv1", "hv3", "lv2"],
  ["lv3", "lv4", "hv2", "hv3", "hv4", "hv1", "hv3", "hv2", "hv2", "hv4", "hv4", "hv2", "lv2", "hv4", "hv1", "lv2", "hv1", "lv2", "hv4", "lv4"]
];

// ✅ Paytable
const PAYTABLE = {
  hv1: [10, 20, 50],
  hv2: [5, 10, 20],
  hv3: [5, 10, 15],
  hv4: [5, 10, 15],
  lv1: [2, 5, 10],
  lv2: [1, 2, 5],
  lv3: [1, 2, 3],
  lv4: [1, 2, 3],
};

// ✅ Lignes de gains
const PAYLINES = [
  [0, 0, 0, 0, 0],
  [1, 1, 1, 1, 1],
  [2, 2, 2, 2, 2],
  [0, 1, 2, 1, 0],
  [2, 1, 0, 1, 2],
  [0, 1, 2, 1, 0],
  [2, 1, 0, 1, 2],
];

let resources = {};
let symbolsOnScreen = [];
let winText;

// ✅ Préchargement des images
function preloadAssets() {
  const loader = new PIXI.Loader();
  const symbols = ["hv1", "hv2", "hv3", "hv4", "lv1", "lv2", "lv3", "lv4", "spin"];
  symbols.forEach(name => {
    loader.add(name, `assets/${name}.png`);
  });

  const loadingText = new PIXI.Text("Loading 0%", {
    fill: "white",
    fontSize: 24
  });
  loadingText.anchor.set(0.5);
  loadingText.x = app.screen.width / 2;
  loadingText.y = app.screen.height / 2;
  app.stage.addChild(loadingText);

  loader.onProgress.add(e => {
    loadingText.text = `Loading ${Math.round(e.progress)}%`;
  });

  loader.load((_, res) => {
    resources = res;
    app.stage.removeChild(loadingText);
    createGame();
  });
}

// ✅ Création du jeu
function createGame() {
  const container = new PIXI.Container();
  container.x = (app.screen.width - SYMBOL_SIZE * NUM_REELS) / 2;
  container.y = 50;
  app.stage.addChild(container);

  for (let i = 0; i < NUM_REELS; i++) {
    const col = [];
    for (let j = 0; j < NUM_ROWS; j++) {
      const sprite = new PIXI.Sprite(resources["lv1"].texture);
      sprite.x = i * SYMBOL_SIZE;
      sprite.y = j * SYMBOL_SIZE;
      sprite.width = SYMBOL_SIZE - 4;
      sprite.height = SYMBOL_SIZE - 4;
      container.addChild(sprite);
      col.push(sprite);
    }
    symbolsOnScreen.push(col);
  }

  const spinButton = new PIXI.Sprite(resources["spin"].texture);
  spinButton.anchor.set(0.5);
  spinButton.y = container.y + SYMBOL_SIZE * NUM_ROWS + 60;
  spinButton.x = app.screen.width / 2;
  spinButton.interactive = true;
  spinButton.buttonMode = true;
  spinButton.scale.set(0.5);
  app.stage.addChild(spinButton);

  spinButton.on("pointerdown", () => spin());

  winText = new PIXI.Text("", {
    fill: "white",
    fontSize: 18
  });
  winText.x = 50;
  winText.y = spinButton.y + 80;
  winText.style.wordWrap = true;
  winText.style.wordWrapWidth = app.screen.width - 100;
  app.stage.addChild(winText);

  showSymbols([0, 0, 0, 0, 0]);
}

// ✅ Affichage des symboles visibles
function showSymbols(positions) {
  for (let i = 0; i < NUM_REELS; i++) {
    const pos = positions[i];
    for (let j = 0; j < NUM_ROWS; j++) {
      const index = (pos + j) % REELS[i].length;
      const id = REELS[i][index];
      symbolsOnScreen[i][j].texture = resources[id].texture;
      symbolsOnScreen[i][j].symbolId = id;
    }
  }
  checkWinnings();
}

// ✅ Génération aléatoire des positions
function spin() {
  const positions = [];
  for (let i = 0; i < NUM_REELS; i++) {
    positions.push(Math.floor(Math.random() * REELS[i].length));
  }
  showSymbols(positions);
}

// ✅ Calcul des gains
function checkWinnings() {
  let totalWin = 0;
  let lines = [];
  for (let i = 0; i < PAYLINES.length; i++) {
    const line = PAYLINES[i];
    let symbol = symbolsOnScreen[0][line[0]].symbolId;
    if (!symbol) continue;
    let match = 1;
    for (let j = 1; j < NUM_REELS; j++) {
      const next = symbolsOnScreen[j][line[j]].symbolId;
      if (next === symbol) match++;
      else break;
    }
    if (match >= 3) {
      const payout = PAYTABLE[symbol][match - 3];
      totalWin += payout;
      lines.push(`- payline ${i + 1}, ${symbol} x${match}, ${payout}`);
    }
  }
  if (totalWin > 0) {
    winText.text = `Total wins: ${totalWin}\n${lines.join("\n")}`;
  } else {
    winText.text = "Total wins: 0";
  }
}

preloadAssets();
