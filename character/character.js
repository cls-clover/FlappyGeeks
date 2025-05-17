// Анимация появления кнопки
window.addEventListener("load", () => {
    document.body.classList.add("loaded");
});

// Навигация назад
function goBack() {
    window.location.href = "../index.html";
}

document.getElementById("backBtn").addEventListener("click", goBack);

// Получаем данные пользователя и его коины
const leaderboard = JSON.parse(localStorage.getItem("leaderboard")) || [];
const currentUser = JSON.parse(localStorage.getItem("currentUser"));
let userCoins = 0;

if (currentUser) {
    const userEntry = leaderboard.find(entry => entry.name === currentUser.name);
    if (userEntry) {
        userCoins = userEntry.coins || 0;
    }
}

// Цены персонажей
const CHARACTER_PRICES = {
    'geek': 0,
    'senior': 300,
    'pro': 600
};

// Получаем купленных персонажей
const purchasedCharacters = JSON.parse(localStorage.getItem('purchasedCharacters') || '["geek"]');

// Обновление UI для отображения монет
const coinsDisplay = document.createElement('div');
coinsDisplay.className = 'coins-display';
coinsDisplay.innerHTML = `💰 ${userCoins} coins`;
document.querySelector('.center-characters').insertBefore(coinsDisplay, document.querySelector('.character-grid'));

// Разблокировка персонажей на основе коинов
const characters = document.querySelectorAll('.character-item');
characters.forEach(character => {
    const characterType = character.dataset.character;
    const button = character.querySelector('.select-btn');
    const price = CHARACTER_PRICES[characterType];
    
    if (purchasedCharacters.includes(characterType)) {
        // Если персонаж уже куплен
        character.classList.remove('locked');
        button.disabled = false;
        button.textContent = 'Выбрать';
    } else if (characterType !== 'geek') {
        // Если персонаж не куплен
        button.textContent = `Купить за ${price} 💰`;
        if (userCoins >= price) {
            button.disabled = false;
        } else {
            button.disabled = true;
            character.classList.add('locked');
        }
    }
});

// Выбор или покупка персонажа
document.querySelectorAll('.select-btn').forEach(button => {
    button.addEventListener('click', function() {
        const characterItem = this.closest('.character-item');
        const characterType = characterItem.dataset.character;
        
        if (purchasedCharacters.includes(characterType)) {
            // Если персонаж уже куплен - выбираем его
            localStorage.setItem('selectedCharacter', characterType);
            window.location.href = '../game/game.html';
        } else {
            // Покупка персонажа
            const price = CHARACTER_PRICES[characterType];
            if (userCoins >= price) {
                // Вычитаем коины
                userCoins -= price;
                const userEntry = leaderboard.find(entry => entry.name === currentUser.name);
                if (userEntry) {
                    userEntry.coins = userCoins;
                    localStorage.setItem("leaderboard", JSON.stringify(leaderboard));
                }
                
                // Добавляем персонажа в купленные
                purchasedCharacters.push(characterType);
                localStorage.setItem('purchasedCharacters', JSON.stringify(purchasedCharacters));
                
                // Обновляем UI
                characterItem.classList.remove('locked');
                button.textContent = 'Выбрать';
                coinsDisplay.innerHTML = `💰 ${userCoins} coins`;
                
                // Показываем сообщение о покупке
                alert(`Поздравляем! Вы приобрели персонажа ${characterType}!`);
            }
        }
    });
}); 