// Показываем модалку при старте
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
const bgImg = new Image();

let imagesLoaded = 0;
const totalImages = 2; // Количество изображений для загрузки

// Функция, вызываемая после загрузки каждого изображения
function imageLoaded() {
    imagesLoaded++;
    if (imagesLoaded === totalImages) {
        // Все изображения загружены, можно начинать игру
        checkUserAndStartGame();
    }
}

// Устанавливаем обработчики загрузки и ошибки для изображений
birdImg.onload = imageLoaded;
bgImg.onload = imageLoaded;

birdImg.onerror = () => {
    console.error("Ошибка загрузки изображения птицы:", birdImg.src);
    // Можно добавить резервное поведение, например, нарисовать квадрат
    // Или показать сообщение об ошибке пользователю
};
bgImg.onerror = () => {
    console.error("Ошибка загрузки фонового изображения:", bgImg.src);
    // Можно добавить резервное поведение
};


// Загружаем выбранного персонажа или используем стандартного
const selectedCharacter = localStorage.getItem('selectedCharacter') || 'geek';
birdImg.src = CHARACTER_IMAGES[selectedCharacter];
bgImg.src = "../img/background.png";


let bgX = 0;
// Скорость фона в пикселях в секунду
let bgSpeed = 30;
let animationId;
let isGameOver = false;

// Устанавливаем размеры канваса (лучше делать это после загрузки DOM)
// Перенесём это в window.onload или перед первым draw
// canvas.width = window.innerWidth;
// canvas.height = window.innerHeight;

// Птица
let bird = {
    x: 0, // Будет установлено после определения размеров канваса
    y: 0, // Будет установлено после определения размеров канваса
    width: 50,
    height: 80, // Высота иконки
    // Гравитация и подъем в единицах в секунду
    gravity: 1400,
    lift: -600,
    velocity: 0 // Скорость в единицах в секунду
};

// Массив для хранения позиций для следа
let trail = [];
const trailLength = 30; // Увеличим длину следа
const horizontalTrailOffset = 10; // Горизонтальное смещение для каждой точки следа


// Трубы
let pipes = [];
// Интервал между трубами в миллисекундах
let pipeInterval = 1670;
let pipeTimer = 0; // Таймер для генерации труб
let pipeGap = 300; // Изначальный промежуток между трубами
let pipeWidth = 10;
// Скорость труб в пикселях в секунду
let pipeSpeed = 200;
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
// registrationModal.style.display = "flex"; // Не показываем сразу, ждем загрузки изображений
const saveUserBtn = document.getElementById("saveUserBtn");

// Переменные для deltaTime
let lastTime = 0;

document.addEventListener("keydown", jump);
document.addEventListener("touchstart", jump);

function jump() {
    if (!isGameOver) {
        // При прыжке задаем скорость, которая теперь в единицах в секунду
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
    // После смены персонажа, если игра не идет, можно перерисовать канвас
    if (!isGameOver && animationId === undefined) {
        draw(); // Перерисовать только если игра не запущена
    }
}

// Вызываем функцию смены персонажа при перезапуске игры
function resetGame() {
    isGameOver = false;
    // Устанавливаем начальную позицию птицы после определения размеров канваса
    bird.x = canvas.width / 4;
    bird.y = canvas.height / 2;
    bird.velocity = 0;
    pipes = [];
    // Сбрасываем таймер труб
    pipeTimer = 0;
    score = 0;
    lastCoinReward = 0;
    coinsEarned = 0;
    // Очищаем след
    trail = [];
    // Возвращаем начальные параметры труб
    pipeGap = 300;
    pipeSpeed = 200;
    pipeColor = "#FFD700";
    gameOverModal.classList.add("hidden");
    const savedUser = localStorage.getItem("currentUser");
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
    }
    // Обновляем персонажа при перезапуске
    changeCharacter();
    // Сбрасываем lastTime для корректного расчета deltaTime в начале новой игры
    lastTime = 0; // Сбрасываем lastTime
    requestAnimationFrame(gameLoop); // Начинаем цикл с requestAnimationFrame
}

restartBtn.addEventListener("click", resetGame);

// Функция обновления игры, принимает deltaTime в миллисекундах
function update(deltaTime) {
    if (isGameOver) return;

    try {
        // Применяем гравитацию к скорости, масштабируя на deltaTime (в секундах)
        bird.velocity += bird.gravity * (deltaTime / 1000);
        // Применяем скорость к положению, масштабируя на deltaTime (в секундах)
        bird.y += bird.velocity * (deltaTime / 1000);

        // Добавляем текущую позицию птицы в след
        // Используем центр птицы для добавления точки следа
        trail.push({ x: bird.x + bird.width / 2, y: bird.y + bird.height / 2 });

        // Удаляем старые позиции, если след слишком длинный
        if (trail.length > trailLength) {
            trail.shift(); // Удаляем первый (самый старый) элемент
        }


        // Двигающийся фон, масштабируя на deltaTime (в секундах)
        bgX -= bgSpeed * (deltaTime / 1000);
        if (bgX <= -canvas.width) {
            bgX = 0;
        }

        // Обновляем таймер труб
        pipeTimer += deltaTime;

        // Новая труба - генерируем, если таймер достиг интервала
        if (pipeTimer >= pipeInterval) {
            let top = Math.random() * (canvas.height - pipeGap - 100);
            pipes.push({
                x: canvas.width,
                top,
                bottom: top + pipeGap,
                passed: false
            });
            // Сбрасываем таймер, вычитая интервал (чтобы учесть "перебор" времени)
            pipeTimer -= pipeInterval;
        }

        // Уровни сложности - теперь зависят только от счета
        if (score >= 20) {
            pipeSpeed = 270;
            pipeGap = 240;
            pipeColor = "#90EE90"; // светло-зелёный
        } else if (score >= 10) {
            pipeSpeed = 192;
            pipeGap = 260;
            pipeColor = "#00BFFF"; // голубой
        }

        // Движение труб и столкновений
        for (let i = pipes.length - 1; i >= 0; i--) {
            // Двигаем трубы, масштабируя на deltaTime (в секундах)
            pipes[i].x -= pipeSpeed * (deltaTime / 1000);

            // Проверка столкновений
            if (
                bird.x + bird.width > pipes[i].x &&
                bird.x < pipes[i].x + pipeWidth &&
                (bird.y < pipes[i].top || bird.y + bird.height > pipes[i].bottom)
            ) {
                gameOver();
            }

            // Удаление труб за экраном
            if (pipes[i].x + pipeWidth < 0) {
                pipes.splice(i, 1);
            }

            // Подсчет очков
            if (!pipes[i].passed && pipes[i].x + pipeWidth < bird.x) {
                pipes[i].passed = true;
                score++;
                checkCoinReward(); // Проверяем начисление коинов
            }
        }

        // Проверка столкновений с верхним/нижним краем
        if (bird.y + bird.height > canvas.height || bird.y < 0) {
            gameOver();
        }
    } catch (error) {
        console.error("Ошибка в функции update:", error);
        gameOver(); // Завершаем игру при ошибке
    }
}

function draw() {
    if (isGameOver) return;

    try {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Фон
        // Проверяем, загружено ли изображение перед отрисовкой
        if (bgImg.complete && bgImg.naturalHeight !== 0) {
            ctx.drawImage(bgImg, bgX, 0, canvas.width, canvas.height);
            ctx.drawImage(bgImg, bgX + canvas.width, 0, canvas.width, canvas.height);
        } else {
            // Если фон не загружен, нарисуем временный цвет
            ctx.fillStyle = "#87CEEB"; // Светло-голубой
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // Рисуем след как отдельные круги
        for (let i = 0; i < trail.length; i++) {
            const position = trail[i];
            // Рассчитываем прозрачность и размер в зависимости от положения в следе
            const opacity = (i + 1) / trail.length; // Прозрачность
            // Радиус круга, основанный на высоте птицы и положении в следе
            // Используем bird.height / 2 для радиуса, чтобы диаметр был равен высоте
            const radius = (i + 1) / trailLength * (bird.height / 2);

            // Смещаем X-координату при отрисовке
            // Смещение теперь назад от центра птицы
            const drawX = position.x - (trailLength - i) * horizontalTrailOffset;

            ctx.beginPath();
            ctx.arc(drawX, position.y, radius, 0, Math.PI * 2);
            // Используем прозрачный желтый цвет с намного большей прозрачностью
            ctx.fillStyle = `rgba(255, 255, 0, ${opacity * 0.02})`; // Уменьшен множитель прозрачности до 0.2
            ctx.fill();
        }


        // Птица
        // Проверяем, загружено ли изображение перед отрисовкой
        if (birdImg.complete && birdImg.naturalHeight !== 0) {
            ctx.drawImage(birdImg, bird.x, bird.y, bird.width, bird.height);
        } else {
            // Если птица не загружена, нарисуем временный квадрат
            ctx.fillStyle = "red";
            ctx.fillRect(bird.x, bird.y, bird.width, bird.height);
        }


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
    } catch (error) {
        console.error("Ошибка в функции draw:", error);
        gameOver(); // Завершаем игру при ошибке
    }
}

// Главный игровой цикл, принимает текущее время (timestamp) от requestAnimationFrame
function gameLoop(timestamp) {
    if (isGameOver) return;

    // Рассчитываем deltaTime в миллисекундах
    // timestamp - время текущего кадра, lastTime - время предыдущего кадра
    // Если lastTime равно 0 (первый кадр или после сброса), устанавливаем deltaTime в 0
    const deltaTime = (lastTime === 0) ? 0 : timestamp - lastTime;
    lastTime = timestamp; // Обновляем время предыдущего кадра

    // Вызываем функцию обновления игры, передавая deltaTime
    update(deltaTime);
    draw();

    // Запрашиваем следующий кадр
    animationId = requestAnimationFrame(gameLoop);
}

// Функция для проверки пользователя и запуска игры/модалки
function checkUserAndStartGame() {
    // Устанавливаем размеры канваса после загрузки DOM и изображений
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    // Устанавливаем начальную позицию птицы после определения размеров канваса
    bird.x = canvas.width / 4;
    bird.y = canvas.height / 2;


    const savedUser = localStorage.getItem("currentUser");
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        registrationModal.style.display = "none";
        // Обновляем персонажа при старте игры
        changeCharacter();
        // Начинаем игровой цикл, передавая текущее время для первого расчета deltaTime
        requestAnimationFrame(gameLoop); // Используем requestAnimationFrame
    } else {
        registrationModal.style.display = "flex";
    }
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

                // Запуск игры - начинаем с requestAnimationFrame
                requestAnimationFrame(gameLoop); // Используем requestAnimationFrame
            } else {
                alert("Произошла ошибка при отправке данных на сервер.");
            }
        })
        .catch(error => {
            console.error("Ошибка запроса:", error);
            alert("Ошибка сети. Попробуйте позже.");
        });
});

// Инициируем загрузку изображений. После загрузки checkUserAndStartGame() запустит игру или покажет модалку.
// birdImg.src и bgImg.src уже установлены выше, это просто комментарий о порядке выполнения.
