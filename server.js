const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DB_FILE = path.join(__dirname, 'leaderboard.json');

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // Serve static files (HTML, CSS, JS)

// Load leaderboard data
function getLeaderboard() {
    if (!fs.existsSync(DB_FILE)) {
        return [];
    }
    const data = fs.readFileSync(DB_FILE, 'utf8');
    try {
        return JSON.parse(data);
    } catch (e) {
        return [];
    }
}

// Save leaderboard data
function saveLeaderboard(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// GET API to fetch leaderboard
app.get('/api/leaderboard', (req, res) => {
    const records = getLeaderboard();
    // Sort by accuracy (descending), then date (newest)
    records.sort((a, b) => {
        if (b.acc !== a.acc) {
            return b.acc - a.acc;
        }
        return new Date(b.date) - new Date(a.date);
    });
    // Send top 100
    res.json(records.slice(0, 100));
});

// POST API to add a new score
app.post('/api/leaderboard', (req, res) => {
    const { name, mode, acc } = req.body;
    
    if (!name || !mode || typeof acc !== 'number') {
        return res.status(400).json({ error: 'Invalid data' });
    }

    const records = getLeaderboard();
    records.push({
        name: name.substring(0, 20), // Max 20 chars
        mode: mode,
        acc: acc,
        date: new Date().toISOString()
    });

    saveLeaderboard(records);
    res.json({ success: true });
});

// Clear leaderboard (optional, maybe secure this in production)
app.delete('/api/leaderboard', (req, res) => {
    saveLeaderboard([]);
    res.json({ success: true });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});