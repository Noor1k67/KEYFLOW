
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const scoreElement = document.getElementById("score");
const accuracyElement = document.getElementById("accuracy");
const comboElement = document.getElementById("combo");
const wpmElement = document.getElementById("wpm");
const timerElement = document.getElementById("timer");
const messageElement = document.getElementById("message");

const keys = ["a", "s", "d", "f", "j", "k", "l", ";"];

let tiles = [];

let score = 0;
let combo = 0;
let bestCombo = 0;
let hits = 0;
let mistakes = 0;

let timeLeft = 60;
let running = false;

let lastTime = 0;
let spawnTimer = 0;
let elapsedTime = 0;

let speed = 190;
let spawnInterval = 850;

const hitLine = 350;

// Цвета клавиш
const colors = [
    "#e879a9",
    "#f0a66a",
    "#65cbb9",
    "#a78bfa",
    "#a78bfa",
    "#65cbb9",
    "#f0a66a",
    "#e879a9"
];

// Создание новой плитки
function spawnTile() {

    const lane = Math.floor(Math.random() * keys.length);

    tiles.push({
        key: keys[lane],
        lane: lane,
        y: -55
    });
}

// Отрисовка игрового поля
function draw() {

    ctx.clearRect(0, 0, 800, 420);

    const laneWidth = 100;

    // Дорожки
    for (let i = 0; i < 8; i++) {

        ctx.fillStyle = i % 2 === 0
            ? "#111322"
            : "#151627";

        ctx.fillRect(i * laneWidth, 0, laneWidth, 420);

        ctx.strokeStyle = "#292b40";
        ctx.lineWidth = 1;

        ctx.beginPath();
        ctx.moveTo(i * laneWidth, 0);
        ctx.lineTo(i * laneWidth, 420);
        ctx.stroke();
    }

    // Линия нажатия
    ctx.strokeStyle = "#a78bfa";
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.moveTo(0, hitLine);
    ctx.lineTo(800, hitLine);
    ctx.stroke();

    // Плитки
    tiles.forEach(tile => {

        const x = tile.lane * laneWidth + 8;

        ctx.shadowBlur = 18;
        ctx.shadowColor = colors[tile.lane];

        ctx.fillStyle = colors[tile.lane];

        ctx.beginPath();
        ctx.roundRect(x, tile.y, 84, 48, 9);
        ctx.fill();

        ctx.shadowBlur = 0;

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 25px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.fillText(
            tile.key.toUpperCase(),
            x + 42,
            tile.y + 24
        );
    });

    // Подсказка в начале игры
    if (!running && timeLeft === 60 && score === 0) {

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 23px Inter";
        ctx.textAlign = "center";

        ctx.fillText(
            "PRESS START TO PLAY",
            400,
            190
        );
    }
}

// Обновление статистики
function updateStats() {

    const total = hits + mistakes;

    const accuracy = total === 0
        ? 100
        : Math.round((hits / total) * 100);

    const minutes = Math.max(elapsedTime / 60000, 1 / 60);

    const wpm = Math.round(hits / 5 / minutes);

    scoreElement.textContent = score;
    accuracyElement.textContent = accuracy + "%";
    comboElement.textContent = combo;
    wpmElement.textContent = wpm;
}

// Подсветка нажатой клавиши
function highlightKey(key) {

    const element = document.querySelector(
        `.key[data-key="${key}"]`
    );

    if (element) {

        element.classList.add("active");

        setTimeout(() => {
            element.classList.remove("active");
        }, 150);
    }
}

// Обработка нажатий
document.addEventListener("keydown", function(event) {

    const key = event.key.toLowerCase();

    if (!keys.includes(key)) return;

    if (!running) return;

    highlightKey(key);

    // Ищем подходящую плитку
    let targetIndex = -1;
    let closestDistance = Infinity;

    tiles.forEach((tile, index) => {

        if (tile.key === key) {

            const distance = Math.abs(
                hitLine - (tile.y + 48)
            );

            if (distance < closestDistance) {
                closestDistance = distance;
                targetIndex = index;
            }
        }
    });

    // Попадание
    if (
        targetIndex !== -1 &&
        closestDistance < 100
    ) {

        tiles.splice(targetIndex, 1);

        hits++;
        score += 10;

        combo++;

        if (combo > bestCombo) {
            bestCombo = combo;
        }

        messageElement.textContent = "PERFECT! +10";

    } else {

        mistakes++;
        combo = 0;

        messageElement.textContent = "MISS! TRY AGAIN";
    }

    updateStats();
});

// Игровой цикл
function gameLoop(timestamp) {

    if (!running) return;

    const delta = Math.min(
        (timestamp - lastTime) / 1000,
        0.05
    );

    lastTime = timestamp;

    elapsedTime += delta * 1000;
    timeLeft -= delta;

    spawnTimer += delta * 1000;

    // Создание плиток
    if (spawnTimer >= spawnInterval) {

        spawnTile();

        spawnTimer = 0;
    }

    // Движение плиток
    tiles.forEach(tile => {
        tile.y += speed * delta;
    });

    // Пропущенные плитки
    const before = tiles.length;

    tiles = tiles.filter(tile => tile.y < 420);

    const missed = before - tiles.length;

    if (missed > 0) {

        mistakes += missed;
        combo = 0;

        messageElement.textContent = "KEY MISSED!";
    }

    // Таймер
    if (timeLeft <= 0) {

        timeLeft = 0;
        endGame();
        return;
    }

    timerElement.textContent =
        Math.ceil(timeLeft) + " SEC";

    updateStats();
    draw();

    requestAnimationFrame(gameLoop);
}

// Запуск игры
function startGame() {

    if (running) return;

    if (timeLeft <= 0) {
        resetGame();
    }

    running = true;

    lastTime = performance.now();

    messageElement.textContent = "GAME STARTED!";

    document.getElementById("startBtn").textContent =
        "GAME RUNNING";

    requestAnimationFrame(gameLoop);
}

// Завершение игры
function endGame() {

    running = false;

    document.getElementById("startBtn").textContent =
        "PLAY AGAIN";

    messageElement.textContent =
        "GAME OVER! BEST COMBO: " + bestCombo;

    timerElement.textContent = "TIME UP";

    draw();
}

// Сброс игры
function resetGame() {

    running = false;

    tiles = [];

    score = 0;
    combo = 0;
    bestCombo = 0;

    hits = 0;
    mistakes = 0;

    timeLeft = 60;
    elapsedTime = 0;
    spawnTimer = 0;

    speed = 190;

    timerElement.textContent = "60 SEC";

    messageElement.textContent = "READY TO START?";

    document.getElementById("startBtn").textContent =
        "START GAME";

    updateStats();
    draw();
}

// Начальная отрисовка
updateStats();
draw();
