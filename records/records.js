function goBack() {
    window.location.href = "../index.html";
}

// Анимация появления кнопки
window.addEventListener("load", () => {
    document.body.classList.add("loaded");
});

document.getElementById("backBtn").addEventListener("click", goBack);

const leaderboard = JSON.parse(localStorage.getItem("leaderboard")) || [];
leaderboard.sort((a, b) => b.score - a.score);

const tbody = document.querySelector("#leaderboardTable tbody");
const medals = ["🥇", "🥈", "🥉"];

leaderboard.forEach((user, index) => {
    const row = document.createElement("tr");
    const place = medals[index] || (index + 1);
    row.innerHTML = `
        <td>${place}</td>
        <td>${user.name}</td>
        <td>${user.phone}</td>
        <td>${user.score}</td>
        <td>${user.coins || 0}</td>
    `;
    tbody.appendChild(row);
});
