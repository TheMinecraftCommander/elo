const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;

let players = [];
const eloTitles = {
    1000: "Shit",
    1200: "Mediocre",
    1400: "Gold",
    1600: "Platinum",
    1800: "Diamond",
    2000: "Master"
};

// Load players from JSON file on server start
const playersFilePath = path.join(__dirname, 'players.json');

function loadPlayerData() {
    if (fs.existsSync(playersFilePath)) {
        const data = fs.readFileSync(playersFilePath);
        players = JSON.parse(data);
    }
}

function savePlayerData() {
    fs.writeFileSync(playersFilePath, JSON.stringify(players, null, 2));
}

loadPlayerData();

app.use(express.json()); // Parse JSON bodies

// API to get the list of players
app.get('/players', (req, res) => {
    res.json(players);
});

// API to add a new player
app.post('/players', (req, res) => {
    const playerName = req.body.name.trim();

    if (playerName !== "") {
        const player = {
            name: playerName,
            elo: 950,
            title: "Shit"
        };

        players.push(player);
        savePlayerData();
        res.status(201).json(player);
    } else {
        res.status(400).json({ error: "Please enter a player name." });
    }
});

// API to record a match
app.post('/match', (req, res) => {
    const { player1Name, player2Name, outcome } = req.body;

    const player1 = players.find(player => player.name === player1Name);
    const player2 = players.find(player => player.name === player2Name);

    if (!player1 || !player2) {
        return res.status(400).json({ error: "Invalid player name." });
    }

    const kFactor = 32; // You can adjust the k-factor as needed

    updateElo(player1, player2, outcome, kFactor);
    updateTitles();
    savePlayerData();

    res.status(200).json({ player1, player2 });
});

function updateElo(player1, player2, outcome, kFactor) {
    const expectedScore1 = 1 / (1 + Math.pow(10, (player2.elo - player1.elo) / 400));
    const expectedScore2 = 1 / (1 + Math.pow(10, (player1.elo - player2.elo) / 400));

    const actualScore1 = outcome ? 1 : 0; // 1 if player1 won, 0 if player2 won
    const actualScore2 = outcome ? 0 : 1; // 0 if player1 won, 1 if player2 won

    const newRating1 = player1.elo + kFactor * (actualScore1 - expectedScore1);
    const newRating2 = player2.elo + kFactor * (actualScore2 - expectedScore2);

    player1.elo = Math.round(newRating1);
    player2.elo = Math.round(newRating2);
}

function updateTitles() {
    players.forEach(player => {
        for (let rating in eloTitles) {
            if (player.elo >= parseInt(rating)) {
                player.title = eloTitles[rating];
            }
        }
    });
}

// Serve static files for the frontend
app.use(express.static('public'));

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
