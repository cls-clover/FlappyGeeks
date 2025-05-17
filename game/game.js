// // Показываем модалку при старте
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

function goBack() {
    window.location.href = "/index.html";
}


// Анимация появления кнопки
window.addEventListener("load", () => {
    document.body.classList.add("loaded");
});

document.getElementById("backBtn").addEventListener("click", goBack);


//liderbord
let currentUser = null;

// Пути к изображениям персонажей
const CHARACTER_IMAGES = {
    'geek': '../img/geeksLogo.svg',
    'senior': '../img/geeks_pro.svg',
    'pro': '../img/geekStudio.svg'
};

// Картинки
const birdImg = new Image();
// Загружаем выбранного персонажа или используем стандартного
const selectedCharacter = localStorage.getItem('selectedCharacter') || 'geek';
birdImg.src = CHARACTER_IMAGES[selectedCharacter];

const bgImg = new Image();
bgImg.src = "../img/background.png";

let bgX = 0;
const bgSpeed = 0.5;
let animationId;
let isGameOver = false;

// Устанавливаем размеры канваса
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Птица
let bird = {
    x: canvas.width / 4,
    y: canvas.height / 2,
    width: 50,
    height: 80,
    gravity: 0.4,
    lift: -10,
    velocity: 0
};

// Трубы
let pipes = [];
let frame = 0;
let pipeGap = 1000;
let pipeWidth = 10;
let pipeSpeed = 1.0;
let pipeColor = "#FFD700";

// Счёт и коины
let score = 0;
let lastCoinReward = 0; // Последний порог начисления коинов
let coinsEarned = 0; // Коины заработанные в текущей игре

// DOM элементы
const gameOverModal = document.getElementById("gameOverModal");
const finalScore = document.getElementById("finalScore");
const restartBtn = document.getElementById("restartBtn");

// Регистрация
const registrationModal = document.getElementById("registrationModal");
registrationModal.style.display = "flex";
const saveUserBtn = document.getElementById("saveUserBtn");

document.addEventListener("keydown", jump);
document.addEventListener("touchstart", jump);

function jump() {
    if (!isGameOver) {
        bird.velocity = bird.lift;
    }
}

function checkCoinReward() {
    // Проверяем, достиг ли игрок нового порога в 10 очков
    const currentThreshold = Math.floor(score / 10) * 10;
    if (currentThreshold > lastCoinReward) {
        coinsEarned += 150; // Добавляем 150 коинов за каждые 10 очков
        lastCoinReward = currentThreshold;
    }
}

function gameOver() {
    isGameOver = true;
    cancelAnimationFrame(animationId);

    // Обновляем данные в таблице лидеров
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    if (currentUser) {
        const leaderboard = JSON.parse(localStorage.getItem("leaderboard")) || [];
        const userEntry = leaderboard.find(entry =>
            entry.name === currentUser.name &&
            entry.phone === currentUser.phone
        );

        if (userEntry) {
            if (score > userEntry.score) {
                userEntry.score = score;
            }
            // Добавляем все заработанные коины
            userEntry.coins = (userEntry.coins || 0) + coinsEarned;
        } else {
            leaderboard.push({
                name: currentUser.name,
                phone: currentUser.phone,
                score: score,
                coins: coinsEarned
            });
        }

        localStorage.setItem("leaderboard", JSON.stringify(leaderboard));
    }

    finalScore.textContent = score;
    gameOverModal.classList.remove("hidden");
}

// Добавляем функцию для смены персонажа
function changeCharacter() {
    const selectedCharacter = localStorage.getItem('selectedCharacter') || 'geek';
    birdImg.src = CHARACTER_IMAGES[selectedCharacter];
}

// Вызываем функцию смены персонажа при перезапуске игры
function resetGame() {
    isGameOver = false;
    bird.y = canvas.height / 2;
    bird.velocity = 0;
    pipes = [];
    frame = 0;
    score = 0;
    lastCoinReward = 0;
    coinsEarned = 0;
    pipeGap = 300;
    pipeSpeed = 2.2;
    pipeColor = "#FFD700";
    gameOverModal.classList.add("hidden");
    const savedUser = localStorage.getItem("currentUser");
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
    }
    // Обновляем персонажа при перезапуске
    changeCharacter();
    gameLoop();
}

restartBtn.addEventListener("click", resetGame);

function update() {
    if (isGameOver) return;
    frame++;
    bird.velocity += bird.gravity;
    bird.y += bird.velocity;

    // Двигающийся фон
    bgX -= bgSpeed;
    if (bgX <= -canvas.width) {
        bgX = 0;
    }

    // Новая труба
    if (frame % 100 === 0) {
        let top = Math.random() * (canvas.height - pipeGap - 100);
        pipes.push({
            x: canvas.width,
            top,
            bottom: top + pipeGap,
            passed: false
        });
    }

    // Уровни сложности
    if (score >= 20) {
        pipeSpeed = 4.5;
        pipeGap = 140;
        pipeColor = "#90EE90"; // светло-зелёный
    } else if (score >= 10) {
        pipeSpeed = 3.2;
        pipeGap = 160;
        pipeColor = "#00BFFF"; // голубой
    }

    // Движение труб и столкновения
    for (let i = pipes.length - 1; i >= 0; i--) {
        pipes[i].x -= pipeSpeed;

        if (
            bird.x + bird.width > pipes[i].x &&
            bird.x < pipes[i].x + pipeWidth &&
            (bird.y < pipes[i].top || bird.y + bird.height > pipes[i].bottom)
        ) {
            gameOver();
        }

        if (pipes[i].x + pipeWidth < 0) {
            pipes.splice(i, 1);
        }

        if (!pipes[i].passed && pipes[i].x + pipeWidth < bird.x) {
            pipes[i].passed = true;
            score++;
            checkCoinReward(); // Проверяем начисление коинов
        }
    }

    if (bird.y + bird.height > canvas.height || bird.y < 0) {
        gameOver();
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Фон
    ctx.drawImage(bgImg, bgX, 0, canvas.width, canvas.height);
    ctx.drawImage(bgImg, bgX + canvas.width, 0, canvas.width, canvas.height);

    // Птица
    ctx.drawImage(birdImg, bird.x, bird.y, bird.width, bird.height);

    // Трубы с подсветкой в зависимости от уровня
    pipes.forEach(pipe => {
        // Сохраняем текущий контекст
        ctx.save();

        // Определяем цвет подсветки в зависимости от уровня
        let glowColor;
        if (score >= 20) {
            glowColor = '#90EE90'; // светло-зеленый
        } else if (score >= 10) {
            glowColor = '#00BFFF'; // голубой
        } else {
            glowColor = '#FFD700'; // золотой
        }

        // Создаем градиент для подсветки
        const gradientTop = ctx.createLinearGradient(pipe.x, 0, pipe.x + pipeWidth, 0);
        gradientTop.addColorStop(0, pipeColor);
        gradientTop.addColorStop(0.5, glowColor);
        gradientTop.addColorStop(1, pipeColor);

        // Верхняя труба
        ctx.beginPath();
        ctx.roundRect(pipe.x, 0, pipeWidth, pipe.top, [0, 0, 10, 10]);
        ctx.fillStyle = pipeColor;
        ctx.fill();

        // Добавляем свечение соответствующего цвета
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 15;
        ctx.strokeStyle = glowColor;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Нижняя труба
        ctx.beginPath();
        ctx.roundRect(pipe.x, pipe.bottom, pipeWidth, canvas.height - pipe.bottom, [10, 10, 0, 0]);
        ctx.fill();
        ctx.stroke();

        // Восстанавливаем контекст
        ctx.restore();
    });

    // Счёт и коины
    ctx.fillStyle = "#FFD700";
    ctx.font = "24px Arial";
    ctx.textAlign = "center";
    ctx.fillText(`Счёт: ${score}`, canvas.width / 2, 40);
    ctx.fillText(`💰 Коины: ${coinsEarned}`, canvas.width / 2, 70);
}

function gameLoop() {
    if (isGameOver) return;
    update();
    draw();
    animationId = requestAnimationFrame(gameLoop);
}

const savedUser = localStorage.getItem("currentUser");
if (savedUser) {
    currentUser = JSON.parse(savedUser);
    registrationModal.style.display = "none";
    // Обновляем персонажа при старте игры
    changeCharacter();
    gameLoop();
} else {
    registrationModal.style.display = "flex";
}

// Добавляем слушатель события для обновления персонажа при изменении в localStorage
window.addEventListener('storage', (e) => {
    if (e.key === 'selectedCharacter') {
        changeCharacter();
    }
});

// Регистрация
saveUserBtn.addEventListener("click", () => {
    const name = document.getElementById("userName").value.trim();
    const phone = document.getElementById("userPhone").value.trim();

    const kyrgyzPhoneRegex = /^\+996\d{9}$/;

    // Проверка на корректность данных
    if (!name || !kyrgyzPhoneRegex.test(phone)) {
        alert("Введите имя и корректный номер (+996XXXXXXXXX)");
        return;
    }

    // Создаём объект пользователя
    currentUser = { name, phone, score: 0 };
    localStorage.setItem("currentUser", JSON.stringify(currentUser)); // Сохраняем пользователя в localStorage

    // Отправка данных на API Bitrix24
    const apiUrl = "https://geektech.bitrix24.ru/rest/1/e08w1jvst0jj152c/crm.lead.add.json";

    const params = new URLSearchParams({
        "fields[SOURCE_ID]": 127,
        "fields[NAME]": name,
        "fields[TITLE]": "GEEKS GAME: Хакатон 2025",
        "fields[PHONE][0][VALUE]": phone,
        "fields[PHONE][0][VALUE_TYPE]": "WORK"
    });

    fetch(`${apiUrl}?${params.toString()}`, {
        method: "GET",  // Метод GET для API Bitrix24
    })
    .then(response => response.json())
    .then(data => {
        if (data.result) {
            // Если запрос успешен, скрываем модалку и начинаем игру
            registrationModal.style.display = "none";  // Скрываем модальное окно

            // Запуск игры
            gameLoop(); // запускаем игру
        } else {
            alert("Произошла ошибка при отправке данных на сервер.");
        }
    })
    .catch(error => {
        console.error("Ошибка запроса:", error);
        alert("Ошибка сети. Попробуйте позже.");
    });
});
