/* =========================================================
   NOSTAL™ ARCADE — Snake + Pong
   ========================================================= */

const SUPABASE_URL = "https://ckevzcryjtivbrbsnhyq.supabase.co";
const SUPABASE_KEY = "sb_publishable_seTOWKCN-oD-aMw4FkNuuQ_6k5JVsnT";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const statusEl = document.getElementById("gameStatus");
const scoreEl = document.getElementById("currentScore");
const bestEl = document.getElementById("bestScore");
const rankingEl = document.getElementById("rankingList");

const startButton = document.getElementById("startButton");
const pauseButton = document.getElementById("pauseButton");

const snakeControls = document.getElementById("snakeControls");
const pongControls = document.getElementById("pongControls");

let game = "snake";
let running = false;
let paused = false;
let loopTimer = null;
let score = 0;
let user = null;

let snake = [];
let food = { x: 10, y: 8 };
let direction = { x: 1, y: 0 };
let nextDirection = { x: 1, y: 0 };

let paddle = { y: 190, h: 100 };
let ai = { y: 190, h: 100 };
let ball = { x: 320, y: 240, vx: 4, vy: 3, r: 9 };

let pongHeld = {
    up: false,
    down: false
};

const COLS = 32;
const ROWS = 24;
const CELL = 20;

function setStatus(text) {
    statusEl.textContent = text;
}

function setScore(value) {
    score = value;
    scoreEl.textContent = String(score);
}

function drawBackground() {
    ctx.fillStyle = "#07111d";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "rgba(150,190,220,.09)";
    ctx.lineWidth = 1;

    for (let x = 0; x <= canvas.width; x += 20) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }

    for (let y = 0; y <= canvas.height; y += 20) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}

function drawText(text, y, size = 22) {
    ctx.fillStyle = "#f3f7fb";
    ctx.font = `bold ${size}px monospace`;
    ctx.textAlign = "center";
    ctx.fillText(text, canvas.width / 2, y);
}

/* =========================================================
   SNAKE
   ========================================================= */

function drawSnake() {
    drawBackground();

    ctx.fillStyle = "#ffb84d";
    ctx.fillRect(
        food.x * CELL + 3,
        food.y * CELL + 3,
        CELL - 6,
        CELL - 6
    );

    snake.forEach((p, i) => {
        ctx.fillStyle = i === 0 ? "#8ee58e" : "#39b85c";

        ctx.fillRect(
            p.x * CELL + 1,
            p.y * CELL + 1,
            CELL - 2,
            CELL - 2
        );
    });

    ctx.fillStyle = "#dceaf5";
    ctx.font = "14px monospace";
    ctx.textAlign = "left";
    ctx.fillText(`PONTOS: ${score}`, 10, 18);
}

function placeFood() {
    do {
        food = {
            x: Math.floor(Math.random() * COLS),
            y: Math.floor(Math.random() * ROWS)
        };
    } while (
        snake.some(p => p.x === food.x && p.y === food.y)
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

    if (
        head.x < 0 ||
        head.x >= COLS ||
        head.y < 0 ||
        head.y >= ROWS ||
        snake.some(p => p.x === head.x && p.y === head.y)
    ) {
        endGame();
        return;
    }

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
        setScore(score + 10);
        placeFood();
    } else {
        snake.pop();
    }

    drawSnake();
}

function setDirection(name) {
    const map = {
        up: { x: 0, y: -1 },
        down: { x: 0, y: 1 },
        left: { x: -1, y: 0 },
        right: { x: 1, y: 0 }
    };

    const d = map[name];

    if (!d) return;

    if (
        d.x === -direction.x &&
        d.y === -direction.y
    ) {
        return;
    }

    nextDirection = d;
}

/* =========================================================
   PONG
   ========================================================= */

let pongOpponentScore = 0;

function drawPong() {
    drawBackground();

    ctx.fillStyle = "#dceaf5";

    ctx.fillRect(24, paddle.y, 12, paddle.h);
    ctx.fillRect(
        canvas.width - 36,
        ai.y,
        12,
        ai.h
    );

    for (let y = 0; y < canvas.height; y += 28) {
        ctx.fillRect(
            canvas.width / 2 - 2,
            y,
            4,
            15
        );
    }

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

    ctx.fillStyle = "#fff";
    ctx.font = "bold 24px monospace";
    ctx.textAlign = "center";

    ctx.fillText(
        String(score),
        canvas.width * 0.25,
        35
    );

    ctx.fillText(
        String(pongOpponentScore),
        canvas.width * 0.75,
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
        Math.min(canvas.height - paddle.h, paddle.y)
    );

    ai.y += (
        ball.y - (ai.y + ai.h / 2)
    ) * 0.075;

    ai.y = Math.max(
        0,
        Math.min(canvas.height - ai.h, ai.y)
    );

    ball.x += ball.vx;
    ball.y += ball.vy;

    if (
        ball.y < ball.r ||
        ball.y > canvas.height - ball.r
    ) {
        ball.vy *= -1;
    }

    // Colisão com a raquete do jogador
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

    // Colisão com a raquete do computador
    if (
        ball.vx > 0 &&
        ball.x + ball.r > canvas.width - 36 &&
        ball.y > ai.y &&
        ball.y < ai.y + ai.h
    ) {
        ball.x = canvas.width - 37;
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

    if (ball.x > canvas.width) {
        endGame();
        return;
    }

    drawPong();
}

/* =========================================================
   CONTROLE DOS JOGOS
   ========================================================= */

function startGame() {
    clearInterval(loopTimer);

    running = true;
    paused = false;

    startButton.textContent = "↻ Reiniciar";
    pauseButton.textContent = "Ⅱ Pausar";

    if (game === "snake") {
        resetSnake();

        setStatus(
            "Boa sorte! Não bata nas paredes nem em você mesmo."
        );

        loopTimer = setInterval(tickSnake, 115);
    } else {
        resetPong();

        setStatus(
            "Use ↑/↓, W/S ou os botões para mover sua raquete."
        );

        loopTimer = setInterval(tickPong, 16);
    }
}

function stopLoop() {
    clearInterval(loopTimer);
    loopTimer = null;
    running = false;
}

function endGame() {
    stopLoop();

    setStatus(`Fim de jogo! Pontuação: ${score}.`);

    drawBackground();

    drawText("FIM DE JOGO", 210, 30);
    drawText(`PONTOS: ${score}`, 255, 22);

    if (game === "pong" && pongOpponentScore > 0) {
        drawText("O computador marcou!", 300, 15);
    }

    finishScore();
}

/* =========================================================
   PONTUAÇÕES E RANKING
   ========================================================= */

async function finishScore() {
    if (score <= 0) return;

    const { data, error } = await supabaseClient.auth.getUser();

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
    const { data: old, error: readError } = await supabaseClient
        .from("arcade_scores")
        .select("score")
        .eq("user_id", user.id)
        .eq("game", game)
        .maybeSingle();

    if (readError) {
        console.error(readError);

        setStatus(
            "Não foi possível consultar seu recorde. Tente novamente mais tarde."
        );

        return;
    }

    if (old && old.score >= score) {
        bestEl.textContent = old.score;

        setStatus(
            "Partida encerrada! Seu recorde continua sendo " +
            old.score +
            " pontos."
        );

        await loadRanking();
        return;
    }

    const payload = {
        user_id: user.id,
        game,
        score,
        updated_at: new Date().toISOString()
    };

    const { error } = await supabaseClient
        .from("arcade_scores")
        .upsert(payload, {
            onConflict: "user_id,game"
        });

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

async function loadRanking() {
    rankingEl.innerHTML =
        '<li class="arcade-empty">Carregando...</li>';

    const { data, error } = await supabaseClient
        .from("arcade_scores")
        .select("score,user_id")
        .eq("game", game)
        .order("score", { ascending: false })
        .limit(10);

    if (error) {
        console.error(error);

        rankingEl.innerHTML =
            '<li class="arcade-empty">Ranking indisponível no momento.</li>';

        return;
    }

    if (!data?.length) {
        rankingEl.innerHTML =
            '<li class="arcade-empty">Ainda não há pontuações. Seja o primeiro!</li>';

        return;
    }

    const ids = [
        ...new Set(data.map(x => x.user_id))
    ];

    const { data: profiles } = await supabaseClient
        .from("profiles")
        .select("id,username,display_name")
        .in("id", ids);

    const map = new Map(
        (profiles || []).map(p => [p.id, p])
    );

    rankingEl.innerHTML = data.map(row => {
        const p = map.get(row.user_id);

        const name =
            p?.display_name ||
            p?.username ||
            "Jogador";

        return `
            <li>
                ${escapeHTML(name)}
                <span class="rank-score">${row.score}</span>
            </li>
        `;
    }).join("");
}

function escapeHTML(v) {
    return String(v ?? "").replace(/[&<>"']/g, c => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    }[c]));
}

async function loadMyBest() {
    bestEl.textContent = "—";

    const { data } = await supabaseClient.auth.getUser();

    user = data?.user || null;

    if (!user) return;

    const { data: row } = await supabaseClient
        .from("arcade_scores")
        .select("score")
        .eq("user_id", user.id)
        .eq("game", game)
        .maybeSingle();

    if (row) {
        bestEl.textContent = row.score;
    }
}

/* =========================================================
   SELEÇÃO DE JOGO
   ========================================================= */

function selectGame(next) {
    if (running) {
        stopLoop();
    }

    game = next;

    document.querySelectorAll("[data-game]").forEach(b => {
        b.classList.toggle(
            "active",
            b.dataset.game === game
        );
    });

    const isSnake = game === "snake";

    document.getElementById("gameTitle").textContent =
        isSnake ? "🐍 Snake" : "🏓 Pong";

    document.getElementById("stageTitle").textContent =
        isSnake ? "SNAKE" : "PONG";

    document.getElementById("rankingGameName").textContent =
        isSnake ? "Snake" : "Pong";

    snakeControls.classList.toggle(
        "arcade-hidden",
        !isSnake
    );

    pongControls.classList.toggle(
        "arcade-hidden",
        isSnake
    );

    document.getElementById("mobileHelp").textContent =
        isSnake
            ? "Use as setas do teclado ou os controles na tela."
            : "Use ↑/↓, W/S ou mantenha os botões pressionados.";

    setStatus("Clique em Iniciar para jogar.");
    setScore(0);

    drawBackground();

    drawText(
        isSnake ? "SNAKE" : "PONG",
        230,
        30
    );

    drawText(
        "PRONTO PARA JOGAR?",
        270,
        16
    );

    loadRanking();
    loadMyBest();
}

/* =========================================================
   EVENTOS E CONTROLES
   ========================================================= */

startButton.addEventListener("click", startGame);

pauseButton.addEventListener("click", () => {
    if (!running && !paused) return;

    if (!paused) {
        clearInterval(loopTimer);

        paused = true;
        pauseButton.textContent = "▶ Continuar";

        setStatus("Jogo pausado.");
    } else {
        paused = false;

        pauseButton.textContent = "Ⅱ Pausar";

        loopTimer = setInterval(
            game === "snake" ? tickSnake : tickPong,
            game === "snake" ? 115 : 16
        );

        setStatus("Jogo em andamento!");
    }
});

document.querySelectorAll("[data-game]").forEach(b => {
    b.addEventListener("click", () => {
        selectGame(b.dataset.game);
    });
});

// Controles do Snake
document.querySelectorAll("[data-dir]").forEach(b => {
    b.addEventListener("click", () => {
        setDirection(b.dataset.dir);
    });

    b.addEventListener("touchstart", e => {
        e.preventDefault();
        setDirection(b.dataset.dir);
    }, { passive: false });
});

// Controles do Pong
document.querySelectorAll("[data-paddle]").forEach(b => {
    const key = b.dataset.paddle;

    const on = e => {
        e.preventDefault();
        pongHeld[key] = true;
    };

    const off = () => {
        pongHeld[key] = false;
    };

    b.addEventListener("pointerdown", on);
    b.addEventListener("pointerup", off);
    b.addEventListener("pointerleave", off);
    b.addEventListener("pointercancel", off);
});

// Teclado
window.addEventListener("keydown", e => {
    const k = e.key.toLowerCase();

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

        if (dirs[k]) {
            e.preventDefault();
            setDirection(dirs[k]);
        }
    } else {
        if (k === "arrowup" || k === "w") {
            pongHeld.up = true;
        }

        if (k === "arrowdown" || k === "s") {
            pongHeld.down = true;
        }
    }
});

window.addEventListener("keyup", e => {
    const k = e.key.toLowerCase();

    if (k === "arrowup" || k === "w") {
        pongHeld.up = false;
    }

    if (k === "arrowdown" || k === "s") {
        pongHeld.down = false;
    }
});

// Pausa automática ao sair da página
window.addEventListener("blur", () => {
    pongHeld.up = false;
    pongHeld.down = false;

    if (running && !paused) {
        clearInterval(loopTimer);

        paused = true;
        pauseButton.textContent = "▶ Continuar";

        setStatus(
            "Jogo pausado enquanto a página está inativa."
        );
    }
});

// Inicialização
selectGame("snake");
