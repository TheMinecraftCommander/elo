var players = [];
var eloTitles = {
    1000: "Shit",
    1200: "Mediocre",
    1400: "Gold",
    1600: "Platinum",
    1800: "Diamond",
    2000: "Master"
};

// Load players from JSON file
fetch('players.json')
    .then(response => response.json())
    .then(data => {
        players = data;
        updateLeaderboard(); // Update leaderboard after fetching data
    });

// Function to save player data to JSON file
function savePlayerData() {
    fetch('players.json', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(players),
    });
}

// Function to add a new player
function addPlayer() {
    var playerNameInput = document.getElementById("new-player-name");
    var playerName = playerNameInput.value.trim();

    if (playerName !== "") {
        var player = {
            name: playerName,
            elo: 950,
            title: "Shit"
        };

        players.push(player);
        savePlayerData(); // Save player data to JSON file
        updateLeaderboard();
        
        // Clear input field after adding player
        playerNameInput.value = "";
    } else {
        alert("Please enter a player name.");
    }
}

// Function to record a match
function recordMatch() {
    var player1Name = document.getElementById("player1").value.trim();
    var player2Name = document.getElementById("player2").value.trim();

    var player1 = players.find(player => player.name === player1Name);
    var player2 = players.find(player => player.name === player2Name);

    if (!player1 || !player2) {
        alert("Invalid player name.");
        return;
    }

    var outcome = confirm(player1Name + " won the match?");

    var kFactor = 32; // You can adjust the k-factor as needed

    updateElo(player1, player2, outcome, kFactor);
    updateTitles();
    savePlayerData(); // Save player data to JSON file
    updateLeaderboard();
}

function updateElo(player1, player2, outcome, kFactor) {
    var expectedScore1 = 1 / (1 + Math.pow(10, (player2.elo - player1.elo) / 400));
    var expectedScore2 = 1 / (1 + Math.pow(10, (player1.elo - player2.elo) / 400));

    var actualScore1 = outcome ? 1 : 0; // 1 if player1 won, 0 if player2 won
    var actualScore2 = outcome ? 0 : 1; // 0 if player1 won, 1 if player2 won

    var newRating1 = player1.elo + kFactor * (actualScore1 - expectedScore1);
    var newRating2 = player2.elo + kFactor * (actualScore2 - expectedScore2);

    player1.elo = Math.round(newRating1);
    player2.elo = Math.round(newRating2);
}

function updateTitles() {
    players.forEach(player => {
        for (var rating in eloTitles) {
            if (player.elo >= parseInt(rating)) {
                player.title = eloTitles[rating];
            }
        }
    });
}

function updateLeaderboard() {
    var leaderboard = document.getElementById("leaderboard");
    leaderboard.innerHTML = ""; // Clear previous leaderboard

    // Sort players by Elo rating (descending order)
    players.sort((a, b) => b.elo - a.elo);

    // Update leaderboard with sorted player list
    players.forEach((player, index) => {
        var playerItem = document.createElement("li");
        playerItem.textContent = player.name + " - Elo: " + player.elo + " - Title: " + player.title;
        playerItem.className = "player-item";
        leaderboard.appendChild(playerItem);
    });
}
