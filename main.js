// PIXI.js slot machine game (ES6)
import * as PIXI from 'pixi.js';

const app = new PIXI.Application({
    resizeTo: window,
    backgroundColor: 0x1099bb,
});
document.body.appendChild(app.view);

const SYMBOL_SIZE = 100;
const REEL_WIDTH = SYMBOL_SIZE;
const REEL_HEIGHT = SYMBOL_SIZE * 3;
const NUM_REELS = 5;

const bands = [
  ["hv2", "lv3", "lv3", "hv1", "hv1", "lv1", "hv1", "hv4", "lv1", "hv3", "hv2", "hv3", "lv4", "hv4", "lv1", "hv2", "lv4", "lv1", "lv3", "hv2"],
  ["hv1", "lv2", "lv3", "lv2", "lv1", "lv1", "lv4", "lv1", "lv1", "hv4", "lv3", "hv2", "lv1", "lv3", "hv1", "lv1", "lv2", "lv4", "lv3", "lv2"],
  ["lv1", "hv2", "lv3", "lv4", "hv3", "hv2", "lv2", "hv2", "hv2", "lv1", "hv3", "lv1", "hv1", "lv2", "hv3", "hv2", "hv4", "hv1", "lv2", "lv4"],
  ["hv2", "lv2", "hv3", "lv2", "lv4", "lv4", "hv3", "lv2", "lv4", "hv1", "lv1", "hv1", "lv2", "hv3", "lv2", "lv3", "hv2", "lv1", "hv3", "lv2"],
  ["lv3", "lv4", "hv2", "hv3", "hv4", "hv1", "hv3", "hv2", "hv2", "hv4", "hv4", "hv2", "lv2", "hv4", "hv1", "lv2", "hv1", "lv2", "hv4", "lv4"]
];

const paytable = {
    hv1: [10, 20, 50],
    hv2: [5, 10, 20],
    hv3: [5, 10, 15],
    hv4: [5, 10, 15],
    lv1: [2, 5, 10],
    lv2: [1, 2, 5],
    lv3: [1, 2, 3],
    lv4: [1, 2, 3],
};

const paylines = [
    [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]],
    [[0, 1], [1, 1], [2, 1], [3, 1], [4, 1]],
    [[0, 2], [1, 2], [2, 2], [3, 2], [4, 2]],
    [[0, 0], [1, 1], [2, 2], [3, 1], [4, 0]],
    [[0, 2], [1, 1], [2, 0], [3, 1], [4, 2]],
    [[0, 0], [1, 1], [2, 2], [3, 1], [4, 0]],
    [[0, 2], [1, 1], [2, 0], [3, 1], [4, 2]],
];

const resources = {
    symbols: ["hv1", "hv2", "hv3", "hv4", "lv1", "lv2", "lv3", "lv4"].reduce((acc, id) => {
        acc[id] = `./assets/${id}.png`;
        return acc;
    }, {}),
    spinButton: './assets/spin.png',
};

const loader = PIXI.Loader.shared;
Object.values(resources.symbols).forEach((url) => loader.add(url));
loader.add('spin', resources.spinButton);

const preloadText = new PIXI.Text('Loading 0%', {
    fill: '#ffffff',
    fontSize: 24,
    align: 'center'
});
preloadText.anchor.set(0.5);
app.stage.addChild(preloadText);
resize();

loader.onProgress.add((loader) => {
    preloadText.text = `Loading ${Math.floor(loader.progress)}%`;
    resize();
});

loader.load(setup);

let reels = [], symbols = [], spinBtn, winText;
function setup() {
    app.stage.removeChildren();

    const center = { x: app.screen.width / 2, y: app.screen.height / 2 };

    for (let i = 0; i < NUM_REELS; i++) {
        symbols[i] = [];
        for (let j = 0; j < 3; j++) {
            const s = new PIXI.Sprite(loader.resources[bands[i][j]].texture);
            s.width = s.height = SYMBOL_SIZE;
            s.x = i * REEL_WIDTH - (NUM_REELS * REEL_WIDTH) / 2;
            s.y = j * SYMBOL_SIZE - SYMBOL_SIZE * 1.5;
            symbols[i].push(s);
            app.stage.addChild(s);
        }
    }

    spinBtn = new PIXI.Sprite(loader.resources.spin.texture);
    spinBtn.interactive = true;
    spinBtn.buttonMode = true;
    spinBtn.anchor.set(0.5);
    spinBtn.y = center.y + 200;
    spinBtn.on('pointerdown', spin);
    app.stage.addChild(spinBtn);

    winText = new PIXI.Text('', { fill: '#ffffff', fontSize: 18, align: 'center' });
    winText.anchor.set(0.5);
    winText.y = center.y + 300;
    app.stage.addChild(winText);

    spin();
    resize();
}

function spin() {
    const positions = Array.from({ length: 5 }, (_, i) => Math.floor(Math.random() * bands[i].length));
    const grid = Array.from({ length: 3 }, () => []);

    for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 3; j++) {
            const symbolIndex = (positions[i] + j) % bands[i].length;
            const id = bands[i][symbolIndex];
            grid[j][i] = id;
            symbols[i][j].texture = loader.resources[id].texture;
        }
    }

    const wins = checkWins(grid);
    winText.text = `Total wins: ${wins.total}\n` + wins.details.join('\n');
    resize();
}

function checkWins(grid) {
    let total = 0;
    const details = [];

    for (let i = 0; i < paylines.length; i++) {
        const line = paylines[i];
        const first = grid[line[0][1]][line[0][0]];
        let matchCount = 1;
        for (let j = 1; j < line.length; j++) {
            const [x, y] = line[j];
            if (grid[y][x] === first) {
                matchCount++;
            } else {
                break;
            }
        }
        if (matchCount >= 3 && paytable[first]) {
            const payout = paytable[first][matchCount - 3];
            total += payout;
            details.push(`- payline ${i + 1}, ${first} x${matchCount}, ${payout}`);
        }
    }

    return { total, details };
}

function resize() {
    const { width, height } = app.screen;
    preloadText.x = winText.x = spinBtn.x = width / 2;
    preloadText.y = height / 2;
}
