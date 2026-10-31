/* ==========================================================
   NOSTAL™ ARCADE
   Snake • Pong • Breakout • Mini Space Invaders
   ========================================================== */


/* ==========================================================
   1. SUPABASE
   ========================================================== */

const SUPABASE_URL =
    "https://ckevzcryjtivbrbsnhyq.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_seTOWKCN-oD-aMw4FkNuuQ_6k5JVsnT";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


/* ==========================================================
   2. ELEMENTOS HTML
   ========================================================== */

const canvas =
    document.getElementById("gameCanvas");

const ctx =
    canvas.getContext("2d");

const statusEl =
    document.getElementById("gameStatus");

const scoreEl =
    document.getElementById("currentScore");

const bestEl =
    document.getElementById("bestScore");

const rankingEl =
    document.getElementById("rankingList");

const startButton =
    document.getElementById("startButton");

const pauseButton =
    document.getElementById("pauseButton");

const gameTitle =
    document.getElementById("gameTitle");

const stageTitle =
    document.getElementById("stageTitle");

const rankingGameName =
    document.getElementById("rankingGameName");

const mobileHelp =
    document.getElementById("mobileHelp");


const controlPanels = {
    snake: document.getElementById("snakeControls"),
    pong: document.getElementById("pongControls"),
    breakout: document.getElementById("breakoutControls"),
    space_invaders: document.getElementById("invadersControls")
};


/* ==========================================================
   3. ESTADO GERAL
   ========================================================== */

let game = "snake";

let running = false;
let paused = false;

let loopTimer = null;

let score = 0;
let user = null;

const W = canvas.width;
const H = canvas.height;


function setStatus(message) {
    statusEl.textContent = message;
}


function setScore(value) {
    score = value;
    scoreEl.textContent = String(value);
}


function stopLoop() {
    if (loopTimer !== null) {
        clearInterval(loopTimer);
    }

    loopTimer = null;
    running = false;
}


function drawBackground() {
    ctx.fillStyle = "#07111d";
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = "rgba(150,190,220,.09)";
    ctx.lineWidth = 1;

    for (let x = 0; x <= W; x += 20) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
    }

    for (let y = 0; y <= H; y += 20) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
    }
}


function drawText(text, y, size = 22) {
    ctx.fillStyle = "#f3f7fb";
    ctx.font = `bold ${size}px monospace`;
    ctx.textAlign = "center";

    ctx.fillText(text, W / 2, y);
}


function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    }[character]));
}


function gameLabel(id) {
    return {
        snake: "Snake",
        pong: "Pong",
        breakout: "Breakout",
        space_invaders: "Mini Space Invaders"
    }[id];
}


/* ==========================================================
   4. SNAKE
   ========================================================== */

const CELL = 20;
const COLS = W / CELL;
const ROWS = H / CELL;

let snake = [];

let food = {
    x: 10,
    y: 8
};

let direction = {
    x: 1,
    y: 0
};

let nextDirection = {
    x: 1,
    y: 0
};


function drawSnake() {
    drawBackground();

    // Comida
    ctx.fillStyle = "#ffb84d";

    ctx.fillRect(
        food.x * CELL + 3,
        food.y * CELL + 3,
        CELL - 6,
        CELL - 6
    );

    // Cobra
    snake.forEach((part, index) => {
        ctx.fillStyle = index === 0
            ? "#8ee58e"
            : "#39b85c";

        ctx.fillRect(
            part.x * CELL + 1,
            part.y * CELL + 1,
            CELL - 2,
            CELL - 2
        );
    });

    ctx.fillStyle = "#dceaf5";
    ctx.font = "14px monospace";
    ctx.textAlign = "left";

    ctx.fillText(
        `PONTOS: ${score}`,
        10,
        18
    );
}


function placeFood() {
    do {
        food = {
            x: Math.floor(Math.random() * COLS),
            y: Math.floor(Math.random() * ROWS)
        };

    } while (
        snake.some(part =>
            part.x === food.x &&
            part.y === food.y
        )
    );
}


function resetSnake() {
    snake = [
        { x: 10, y: 12 },
        { x: 9, y: 12 },
        { x: 8, y: 12 }
    ];

    direction = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };

    setScore(0);

    placeFood();
    drawSnake();
}


function tickSnake() {
    direction = nextDirection;

    const head = {
        x: snake[0].x + direction.x,
        y: snake[0].y + direction.y
    };

    const eating =
        head.x === food.x &&
        head.y === food.y;

    const bodyToCheck = eating
        ? snake
        : snake.slice(0, -1);

    // Colisões
    if (
        head.x < 0 ||
        head.x >= COLS ||
        head.y < 0 ||
        head.y >= ROWS ||
        bodyToCheck.some(part =>
            part.x === head.x &&
            part.y === head.y
        )
    ) {
        endGame();
        return;
    }

    snake.unshift(head);

    if (eating) {
        setScore(score + 10);
        placeFood();
    } else {
        snake.pop();
    }

    drawSnake();
}


function setDirection(name) {
    const directions = {
        up: { x: 0, y: -1 },
        down: { x: 0, y: 1 },
        left: { x: -1, y: 0 },
        right: { x: 1, y: 0 }
    };

    const newDirection = directions[name];

    if (!newDirection) {
        return;
    }

    if (
        newDirection.x === -direction.x &&
        newDirection.y === -direction.y
    ) {
        return;
    }

    nextDirection = newDirection;
}


/* ==========================================================
   5. PONG
   ========================================================== */

let paddle = {
    y: 190,
    h: 100
};

let ai = {
    y: 190,
    h: 100
};

let ball = {
    x: 320,
    y: 240,
    vx: 4,
    vy: 3,
    r: 9
};

let pongOpponentScore = 0;

const pongHeld = {
    up: false,
    down: false
};


function drawPong() {
    drawBackground();

    ctx.fillStyle = "#dceaf5";

    // Jogador
    ctx.fillRect(
        24,
        paddle.y,
        12,
        paddle.h
    );

    // Computador
    ctx.fillRect(
        W - 36,
        ai.y,
        12,
        ai.h
    );

    // Linha central
    for (let y = 0; y < H; y += 28) {
        ctx.fillRect(
            W / 2 - 2,
            y,
            4,
            15
        );
    }

    // Bola
    ctx.beginPath();

    ctx.arc(
        ball.x,
        ball.y,
        ball.r,
        0,
        Math.PI * 2
    );

    ctx.fillStyle = "#ffbd58";
    ctx.fill();

    // Pontuação
    ctx.fillStyle = "#fff";
    ctx.font = "bold 24px monospace";
    ctx.textAlign = "center";

    ctx.fillText(
        String(score),
        W * 0.25,
        35
    );

    ctx.fillText(
        String(pongOpponentScore),
        W * 0.75,
        35
    );
}


function resetPong() {
    setScore(0);

    pongOpponentScore = 0;

    paddle.y = 190;
    ai.y = 190;

    ball = {
        x: 320,
        y: 240,
        vx: 4 * (Math.random() < 0.5 ? 1 : -1),
        vy: 3,
        r: 9
    };

    pongHeld.up = false;
    pongHeld.down = false;

    drawPong();
}


function tickPong() {
    if (pongHeld.up) {
        paddle.y -= 7;
    }

    if (pongHeld.down) {
        paddle.y += 7;
    }

    paddle.y = Math.max(
        0,
        Math.min(H - paddle.h, paddle.y)
    );

    // Inteligência artificial
    ai.y += (
        ball.y - (ai.y + ai.h / 2)
    ) * 0.075;

    ai.y = Math.max(
        0,
        Math.min(H - ai.h, ai.y)
    );

    // Movimento da bola
    ball.x += ball.vx;
    ball.y += ball.vy;

    if (
        ball.y < ball.r ||
        ball.y > H - ball.r
    ) {
        ball.vy *= -1;
    }

    // Raquete do jogador
    if (
        ball.vx < 0 &&
        ball.x - ball.r < 36 &&
        ball.y > paddle.y &&
        ball.y < paddle.y + paddle.h
    ) {
        ball.x = 37;
        ball.vx = Math.abs(ball.vx) * 1.04;

        ball.vy += (
            ball.y - (paddle.y + paddle.h / 2)
        ) / 45;

        setScore(score + 1);
    }

    // Raquete do computador
    if (
        ball.vx > 0 &&
        ball.x + ball.r > W - 36 &&
        ball.y > ai.y &&
        ball.y < ai.y + ai.h
    ) {
        ball.x = W - 37;
        ball.vx = -Math.abs(ball.vx) * 1.02;

        ball.vy += (
            ball.y - (ai.y + ai.h / 2)
        ) / 50;
    }

    if (ball.x < 0) {
        pongOpponentScore++;
        endGame();
        return;
    }

    if (ball.x > W) {
        endGame();
        return;
    }

    drawPong();
}


/* ==========================================================
   6. BREAKOUT
   ========================================================== */

const breakout = {
    paddleX: 270,
    paddleW: 100,
    paddleH: 12,

    ballX: 320,
    ballY: 420,
    ballVX: 4,
    ballVY: -4,
    ballR: 8,

    bricks: [],

    held: {
        left: false,
        right: false
    }
};


function resetBreakout() {
    setScore(0);

    breakout.paddleX =
        (W - breakout.paddleW) / 2;

    breakout.ballX = W / 2;
    breakout.ballY = 420;

    breakout.ballVX = 4;
    breakout.ballVY = -4;

    breakout.held.left = false;
    breakout.held.right = false;

    breakout.bricks = [];

    const rows = 5;
    const cols = 10;

    const gap = 6;
    const brickW = 54;
    const brickH = 20;

    const left = 20;
    const top = 55;

    const colors = [
        "#ff6b6b",
        "#ffb84d",
        "#ffe66d",
        "#55c98b",
        "#58a6ff"
    ];

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {

            breakout.bricks.push({
                x: left + col * (brickW + gap),
                y: top + row * (brickH + gap),

                w: brickW,
                h: brickH,

                alive: true,
                color: colors[row]
            });

        }
    }

    drawBreakout();
}


function drawBreakout() {
    drawBackground();

    // Blocos
    breakout.bricks.forEach(brick => {
        if (!brick.alive) {
            return;
        }

        ctx.fillStyle = brick.color;

        ctx.fillRect(
            brick.x,
            brick.y,
            brick.w,
            brick.h
        );

        ctx.strokeStyle = "rgba(255,255,255,.45)";

        ctx.strokeRect(
            brick.x,
            brick.y,
            brick.w,
            brick.h
        );
    });

    // Plataforma
    ctx.fillStyle = "#8ee5ff";

    ctx.fillRect(
        breakout.paddleX,
        H - 35,
        breakout.paddleW,
        breakout.paddleH
    );

    // Bola
    ctx.beginPath();

    ctx.arc(
        breakout.ballX,
        breakout.ballY,
        breakout.ballR,
        0,
        Math.PI * 2
    );

    ctx.fillStyle = "#fff";
    ctx.fill();

    // Pontuação
    ctx.fillStyle = "#fff";
    ctx.font = "14px monospace";
    ctx.textAlign = "left";

    ctx.fillText(
        `PONTOS: ${score}`,
        10,
        18
    );
}


function tickBreakout() {

    // Movimento da plataforma
    if (breakout.held.left) {
        breakout.paddleX -= 7;
    }

    if (breakout.held.right) {
        breakout.paddleX += 7;
    }

    breakout.paddleX = Math.max(
        0,
        Math.min(
            W - breakout.paddleW,
            breakout.paddleX
        )
    );

    // Movimento da bola
    breakout.ballX += breakout.ballVX;
    breakout.ballY += breakout.ballVY;

    // Paredes laterais
    if (
        breakout.ballX < breakout.ballR ||
        breakout.ballX > W - breakout.ballR
    ) {
        breakout.ballVX *= -1;
    }

    // Teto
    if (breakout.ballY < breakout.ballR) {
        breakout.ballVY = Math.abs(
            breakout.ballVY
        );
    }

    // Plataforma
    if (
        breakout.ballVY > 0 &&
        breakout.ballY + breakout.ballR >= H - 35 &&
        breakout.ballY < H - 20 &&
        breakout.ballX >= breakout.paddleX &&
        breakout.ballX <= breakout.paddleX + breakout.paddleW
    ) {
        breakout.ballY = H - 36;

        breakout.ballVY = -Math.abs(
            breakout.ballVY
        );

        const hit = (
            breakout.ballX -
            (breakout.paddleX + breakout.paddleW / 2)
        ) / (breakout.paddleW / 2);

        breakout.ballVX = hit * 5.5;
    }

    // Colisão com os blocos
    for (const brick of breakout.bricks) {

        if (!brick.alive) {
            continue;
        }

        const collision =
            breakout.ballX + breakout.ballR > brick.x &&
            breakout.ballX - breakout.ballR < brick.x + brick.w &&
            breakout.ballY + breakout.ballR > brick.y &&
            breakout.ballY - breakout.ballR < brick.y + brick.h;

        if (collision) {
            brick.alive = false;

            breakout.ballVY *= -1;

            setScore(score + 10);

            break;
        }

    }

    // Vitória
    if (
        breakout.bricks.every(brick => !brick.alive)
    ) {
        endGame(true);
        return;
    }

    // Bola caiu
    if (breakout.ballY > H + breakout.ballR) {
        endGame();
        return;
    }

    drawBreakout();
}


/* ==========================================================
   7. MINI SPACE INVADERS
   ========================================================== */

const invaders = {
    playerX: W / 2,
    playerW: 42,

    bullets: [],
    enemyBullets: [],
    enemies: [],

    move: 1,
    moveTick: 0,

    held: {
        left: false,
        right: false
    },

    shooting: false,
    cooldown: 0
};


function resetInvaders() {
    setScore(0);

    invaders.playerX = W / 2;

    invaders.bullets = [];
    invaders.enemyBullets = [];

    invaders.move = 1;
    invaders.moveTick = 0;
    invaders.cooldown = 0;

    invaders.held.left = false;
    invaders.held.right = false;

    invaders.shooting = false;

    invaders.enemies = [];

    // Formação de invasores
    for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 8; col++) {

            invaders.enemies.push({
                x: 95 + col * 58,
                y: 65 + row * 42,

                w: 30,
                h: 22,

                alive: true,
                row
            });

        }
    }

    drawInvaders();
}


function drawInvaders() {
    drawBackground();

    // Nave do jogador
    ctx.fillStyle = "#8ee58e";

    ctx.fillRect(
        invaders.playerX - invaders.playerW / 2,
        H - 45,
        invaders.playerW,
        18
    );

    ctx.fillRect(
        invaders.playerX - 5,
        H - 53,
        10,
        9
    );

    // Invasores
    invaders.enemies.forEach(enemy => {

        if (!enemy.alive) {
            return;
        }

        const colors = [
            "#ffbd58",
            "#ff7b7b",
            "#b69cff",
            "#58d7e8"
        ];

        ctx.fillStyle = colors[enemy.row];

        ctx.fillRect(
            enemy.x,
            enemy.y,
            enemy.w,
            enemy.h
        );

        // Olhos
        ctx.fillStyle = "#07111d";

        ctx.fillRect(
            enemy.x + 6,
            enemy.y + 7,
            5,
            5
        );

        ctx.fillRect(
            enemy.x + 19,
            enemy.y + 7,
            5,
            5
        );

    });

    // Disparos do jogador
    ctx.fillStyle = "#fff";

    invaders.bullets.forEach(bullet => {
        ctx.fillRect(
            bullet.x - 2,
            bullet.y - 8,
            4,
            12
        );
    });

    // Disparos inimigos
    ctx.fillStyle = "#ff7777";

    invaders.enemyBullets.forEach(bullet => {
        ctx.fillRect(
            bullet.x - 2,
            bullet.y,
            4,
            10
        );
    });

    // Pontuação
    ctx.fillStyle = "#fff";
    ctx.font = "14px monospace";
    ctx.textAlign = "left";

    ctx.fillText(
        `PONTOS: ${score}`,
        10,
        18
    );
}


function fireInvaderBullet() {
    if (invaders.cooldown > 0) {
        return;
    }

    invaders.bullets.push({
        x: invaders.playerX,
        y: H - 55,
        speed: 8
    });

    invaders.cooldown = 15;
}


function tickInvaders() {

    // Movimento da nave
    if (invaders.held.left) {
        invaders.playerX -= 6;
    }

    if (invaders.held.right) {
        invaders.playerX += 6;
    }

    invaders.playerX = Math.max(
        22,
        Math.min(W - 22, invaders.playerX)
    );

    // Disparo contínuo pelo botão
    if (invaders.shooting) {
        fireInvaderBullet();
    }

    if (invaders.cooldown > 0) {
        invaders.cooldown--;
    }

    // Movimento dos tiros do jogador
    invaders.bullets.forEach(bullet => {
        bullet.y -= bullet.speed;
    });

    invaders.bullets = invaders.bullets.filter(
        bullet => bullet.y > 0
    );

    // Movimento dos invasores
    invaders.moveTick++;

    if (invaders.moveTick >= 12) {

        invaders.moveTick = 0;

        const alive = invaders.enemies.filter(
            enemy => enemy.alive
        );

        const atEdge = alive.some(enemy =>
            (
                invaders.move > 0 &&
                enemy.x + enemy.w >= W - 12
            ) ||
            (
                invaders.move < 0 &&
                enemy.x <= 12
            )
        );

        if (atEdge) {
            invaders.move *= -1;

            alive.forEach(enemy => {
                enemy.y += 15;
            });

        } else {
            alive.forEach(enemy => {
                enemy.x += invaders.move * 8;
            });
        }

    }

    // Disparos aleatórios dos invasores
    if (Math.random() < 0.025) {

        const shooters = invaders.enemies.filter(
            enemy => enemy.alive
        );

        if (shooters.length) {

            const enemy = shooters[
                Math.floor(Math.random() * shooters.length)
            ];

            invaders.enemyBullets.push({
                x: enemy.x + enemy.w / 2,
                y: enemy.y + enemy.h,
                speed: 4
            });

        }

    }

    // Movimento dos tiros inimigos
    invaders.enemyBullets.forEach(bullet => {
        bullet.y += bullet.speed;
    });

    invaders.enemyBullets =
        invaders.enemyBullets.filter(
            bullet => bullet.y < H
        );

    // Colisões dos tiros do jogador
    for (const bullet of invaders.bullets) {

        const target = invaders.enemies.find(enemy =>
            enemy.alive &&
            bullet.x >= enemy.x &&
            bullet.x <= enemy.x + enemy.w &&
            bullet.y >= enemy.y &&
            bullet.y <= enemy.y + enemy.h
        );

        if (target) {

            target.alive = false;
            bullet.y = -20;

            setScore(
                score + (5 - target.row) * 10
            );

        }

    }

    invaders.bullets =
        invaders.bullets.filter(
            bullet => bullet.y > 0
        );

    // Colisão dos tiros inimigos com o jogador
    const playerTop = H - 53;

    const playerHit = invaders.enemyBullets.some(bullet =>
        bullet.x >= invaders.playerX - 20 &&
        bullet.x <= invaders.playerX + 20 &&
        bullet.y >= playerTop &&
        bullet.y <= H - 25
    );

    if (playerHit) {
        endGame();
        return;
    }

    // Invasores chegaram à base
    const invasionReachedBase =
        invaders.enemies.some(enemy =>
            enemy.alive &&
            enemy.y + enemy.h >= playerTop
        );

    if (invasionReachedBase) {
        endGame();
        return;
    }

    // Vitória
    if (
        invaders.enemies.every(enemy => !enemy.alive)
    ) {
        endGame(true);
        return;
    }

    drawInvaders();
}


/* ==========================================================
   8. INICIAR E PAUSAR PARTIDAS
   ========================================================== */

function startGame() {
    stopLoop();

    paused = false;
    running = true;

    startButton.textContent = "↻ Reiniciar";
    pauseButton.textContent = "Ⅱ Pausar";

    const games = {
        snake: [
            resetSnake,
            tickSnake,
            115,
            "Coma, cresça e evite as paredes e seu próprio corpo."
        ],

        pong: [
            resetPong,
            tickPong,
            16,
            "Use ↑/↓ ou W/S para mover sua raquete."
        ],

        breakout: [
            resetBreakout,
            tickBreakout,
            16,
            "Destrua os blocos. Use ←/→ ou os controles na tela."
        ],

        space_invaders: [
            resetInvaders,
            tickInvaders,
            16,
            "Mova sua nave e atire nos invasores!"
        ]
    };

    const setup = games[game];

    setup[0]();

    setStatus(setup[3]);

    loopTimer = setInterval(
        setup[1],
        setup[2]
    );
}


function pauseGame() {
    if (!running && !paused) {
        return;
    }

    if (!paused) {

        clearInterval(loopTimer);
        loopTimer = null;

        paused = true;

        releaseAllControls();

        pauseButton.textContent = "▶ Continuar";

        setStatus("Jogo pausado.");

    } else {

        paused = false;

        pauseButton.textContent = "Ⅱ Pausar";

        const ticks = {
            snake: tickSnake,
            pong: tickPong,
            breakout: tickBreakout,
            space_invaders: tickInvaders
        };

        loopTimer = setInterval(
            ticks[game],
            game === "snake" ? 115 : 16
        );

        setStatus("Jogo em andamento!");

    }
}


function endGame(won = false) {
    stopLoop();

    paused = false;

    releaseAllControls();

    pauseButton.textContent = "Ⅱ Pausar";

    setStatus(
        won
            ? `Vitória! Pontuação: ${score}.`
            : `Fim de jogo! Pontuação: ${score}.`
    );

    drawBackground();

    drawText(
        won ? "VOCÊ VENCEU!" : "FIM DE JOGO",
        210,
        30
    );

    drawText(
        `PONTOS: ${score}`,
        255,
        22
    );

    finishScore();
}


function releaseAllControls() {
    pongHeld.up = false;
    pongHeld.down = false;

    breakout.held.left = false;
    breakout.held.right = false;

    invaders.held.left = false;
    invaders.held.right = false;
    invaders.shooting = false;
}


/* ==========================================================
   9. SALVAMENTO DE PONTUAÇÕES
   ========================================================== */

async function finishScore() {
    if (score <= 0) {
        return;
    }

    const { data, error } =
        await supabaseClient.auth.getUser();

    if (error) {
        console.error(
            "Erro ao verificar login:",
            error
        );
    }

    user = data?.user || null;

    if (!user) {

        const go = confirm(
            "Você não está logado. Se quiser salvar sua pontuação no ranking, clique em OK para ir à tela inicial fazer login ou clique em CANCELAR se quiser continuar offline."
        );

        if (go) {
            window.location.href = "index.html";
        }

        return;
    }

    await saveBestScore();
}


async function saveBestScore() {

    const { data: old, error: readError } =
        await supabaseClient
            .from("arcade_scores")
            .select("score")
            .eq("user_id", user.id)
            .eq("game", game)
            .maybeSingle();

    if (readError) {
        console.error(readError);

        setStatus(
            "Não foi possível consultar seu recorde."
        );

        return;
    }

    // Preservar recorde anterior
    if (old && old.score >= score) {

        bestEl.textContent = old.score;

        setStatus(
            `Partida encerrada! Seu recorde continua sendo ${old.score} pontos.`
        );

        await loadRanking();

        return;
    }

    // Salvar novo recorde
    const { error } =
        await supabaseClient
            .from("arcade_scores")
            .upsert(
                {
                    user_id: user.id,
                    game,
                    score,
                    updated_at: new Date().toISOString()
                },
                {
                    onConflict: "user_id,game"
                }
            );

    if (error) {
        console.error(error);

        setStatus(
            "Não foi possível salvar a pontuação. Verifique sua conexão."
        );

        return;
    }

    bestEl.textContent = score;

    setStatus(
        "🏆 Novo recorde salvo! Você entrou na disputa do ranking."
    );

    await loadRanking();
}


/* ==========================================================
   10. RANKING
   ========================================================== */

async function loadRanking() {
    rankingEl.innerHTML = `
        <li class="arcade-empty">
            Carregando...
        </li>
    `;

    const { data, error } =
        await supabaseClient
            .from("arcade_scores")
            .select("score,user_id")
            .eq("game", game)
            .order("score", {
                ascending: false
            })
            .limit(10);

    if (error) {
        console.error(error);

        rankingEl.innerHTML = `
            <li class="arcade-empty">
                Ranking indisponível no momento.
            </li>
        `;

        return;
    }

    if (!data?.length) {
        rankingEl.innerHTML = `
            <li class="arcade-empty">
                Ainda não há pontuações. Seja o primeiro!
            </li>
        `;

        return;
    }

    const ids = [
        ...new Set(
            data.map(row => row.user_id)
        )
    ];

    const { data: profiles } =
        await supabaseClient
            .from("profiles")
            .select("id,username,display_name")
            .in("id", ids);

    const map = new Map(
        (profiles || []).map(profile => [
            profile.id,
            profile
        ])
    );

    rankingEl.innerHTML = data.map((row, index) => {

        const profile = map.get(row.user_id);

        const name =
            profile?.display_name ||
            profile?.username ||
            "Jogador";

        return `
            <li>
                <span>
                    ${index + 1}. ${escapeHTML(name)}
                </span>

                <span class="rank-score">
                    ${row.score}
                </span>
            </li>
        `;

    }).join("");
}


/* ==========================================================
   11. RECORDE PESSOAL
   ========================================================== */

async function loadMyBest() {
    bestEl.textContent = "—";

    const { data } =
        await supabaseClient.auth.getUser();

    user = data?.user || null;

    if (!user) {
        return;
    }

    const { data: row } =
        await supabaseClient
            .from("arcade_scores")
            .select("score")
            .eq("user_id", user.id)
            .eq("game", game)
            .maybeSingle();

    if (row) {
        bestEl.textContent = row.score;
    }
}


/* ==========================================================
   12. SELEÇÃO DE JOGO
   ========================================================== */

function selectGame(next) {
    if (!Object.hasOwn(controlPanels, next)) {
        return;
    }

    stopLoop();

    paused = false;

    releaseAllControls();

    game = next;

    startButton.textContent = "▶ Iniciar";
    pauseButton.textContent = "Ⅱ Pausar";

    // Botões de seleção
    document.querySelectorAll("[data-game]").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.game === game
        );
    });

    // Títulos
    const labels = {
        snake: "🐍 Snake",
        pong: "🏓 Pong",
        breakout: "🧱 Breakout",
        space_invaders: "👾 Mini Space Invaders"
    };

    gameTitle.textContent = labels[game];

    stageTitle.textContent =
        gameLabel(game).toUpperCase();

    rankingGameName.textContent =
        gameLabel(game);

    // Controles
    Object.entries(controlPanels).forEach(([id, panel]) => {
        panel.classList.toggle(
            "arcade-hidden",
            id !== game
        );
    });

    // Ajuda
    const help = {
        snake: "Use as setas ou os controles na tela.",
        pong: "Use ↑/↓ ou W/S para mover sua raquete.",
        breakout: "Use ←/→ ou os botões para mover a plataforma.",
        space_invaders: "Mova a nave e atire. No teclado: ←/→ e espaço."
    };

    mobileHelp.textContent = help[game];

    setScore(0);

    drawBackground();

    drawText(
        gameLabel(game).toUpperCase(),
        230,
        28
    );

    drawText(
        "PRONTO PARA JOGAR?",
        270,
        16
    );

    setStatus("Clique em Iniciar para jogar.");

    loadRanking();
    loadMyBest();
}


/* ==========================================================
   13. EVENTOS DOS BOTÕES
   ========================================================== */

startButton.addEventListener(
    "click",
    startGame
);

pauseButton.addEventListener(
    "click",
    pauseGame
);


// Seleção dos jogos
document.querySelectorAll("[data-game]").forEach(button => {

    button.addEventListener("click", () => {
        selectGame(button.dataset.game);
    });

});


// Controles do Snake
document.querySelectorAll("[data-dir]").forEach(button => {

    const action = () => {
        setDirection(button.dataset.dir);
    };

    button.addEventListener("click", action);

    button.addEventListener("touchstart", event => {
        event.preventDefault();
        action();
    }, {
        passive: false
    });

});


/* ==========================================================
   14. CONTROLES POR TOQUE
   ========================================================== */

function bindHold(selector, callbackDown, callbackUp) {

    document.querySelectorAll(selector).forEach(button => {

        const down = event => {
            event.preventDefault();
            callbackDown(button);
        };

        const up = () => {
            callbackUp(button);
        };

        button.addEventListener("pointerdown", down);
        button.addEventListener("pointerup", up);
        button.addEventListener("pointerleave", up);
        button.addEventListener("pointercancel", up);

    });

}


// Pong
bindHold(
    "[data-paddle]",

    button => {
        pongHeld[button.dataset.paddle] = true;
    },

    button => {
        pongHeld[button.dataset.paddle] = false;
    }
);


// Breakout
bindHold(
    "[data-breakout]",

    button => {
        breakout.held[button.dataset.breakout] = true;
    },

    button => {
        breakout.held[button.dataset.breakout] = false;
    }
);


// Mini Space Invaders
bindHold(
    "[data-invaders]",

    button => {

        const key = button.dataset.invaders;

        if (key === "shoot") {
            invaders.shooting = true;
        } else {
            invaders.held[key] = true;
        }

    },

    button => {

        const key = button.dataset.invaders;

        if (key === "shoot") {
            invaders.shooting = false;
        } else {
            invaders.held[key] = false;
        }

    }
);


/* ==========================================================
   15. CONTROLES PELO TECLADO
   ========================================================== */

window.addEventListener("keydown", event => {

    const key = event.key.toLowerCase();

    if (
        ["arrowup", "arrowdown", "arrowleft", "arrowright", " "]
            .includes(key)
    ) {
        event.preventDefault();
    }

    // Snake
    if (game === "snake") {

        const dirs = {
            arrowup: "up",
            w: "up",

            arrowdown: "down",
            s: "down",

            arrowleft: "left",
            a: "left",

            arrowright: "right",
            d: "right"
        };

        if (dirs[key]) {
            setDirection(dirs[key]);
        }

    }

    // Pong
    else if (game === "pong") {

        if (key === "arrowup" || key === "w") {
            pongHeld.up = true;
        }

        if (key === "arrowdown" || key === "s") {
            pongHeld.down = true;
        }

    }

    // Breakout
    else if (game === "breakout") {

        if (key === "arrowleft" || key === "a") {
            breakout.held.left = true;
        }

        if (key === "arrowright" || key === "d") {
            breakout.held.right = true;
        }

    }

    // Mini Space Invaders
    else if (game === "space_invaders") {

        if (key === "arrowleft" || key === "a") {
            invaders.held.left = true;
        }

        if (key === "arrowright" || key === "d") {
            invaders.held.right = true;
        }

        if (key === " " && !event.repeat) {
            fireInvaderBullet();
        }

    }

});


window.addEventListener("keyup", event => {

    const key = event.key.toLowerCase();

    if (key === "arrowup" || key === "w") {
        pongHeld.up = false;
    }

    if (key === "arrowdown" || key === "s") {
        pongHeld.down = false;
    }

    if (key === "arrowleft" || key === "a") {
        breakout.held.left = false;
        invaders.held.left = false;
    }

    if (key === "arrowright" || key === "d") {
        breakout.held.right = false;
        invaders.held.right = false;
    }

});


/* ==========================================================
   16. PAUSA AUTOMÁTICA
   ========================================================== */

window.addEventListener("blur", () => {

    releaseAllControls();

    if (running && !paused) {

        clearInterval(loopTimer);

        loopTimer = null;
        paused = true;

        pauseButton.textContent = "▶ Continuar";

        setStatus(
            "Jogo pausado enquanto a página está inativa."
        );

    }

});


/* ==========================================================
   17. INICIALIZAÇÃO
   ========================================================== */

selectGame("snake");
