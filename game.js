// Get canvas and context
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Game state
let game = {
    player: { x: 2, y: 2, laptopOpen: true },
    lecturer: { x: 0, y: 0, speed: 0.015, targetX: null, targetY: null }, // Reduced from 0.02 to 0.015
    score: 0,
    timeLeft: 180, // 3 minutes in seconds
    desks: [],
    gameOver: false,
    npcs: [],
    distractionCooldown: 0,
    mashCount: 0,
    lecturerCooldown: 0
};

// Grid settings
const GRID_WIDTH = 6;
const GRID_HEIGHT = 4;
const TILE_SIZE = 100;

// Initialize desks and NPCs
for (let y = 0; y < GRID_HEIGHT; y++) {
    game.desks[y] = [];
    for (let x = 0; x < GRID_WIDTH; x++) {
        game.desks[y][x] = { occupied: false, hasLaptop: false };
    }
}
game.desks[game.player.y][game.player.x].occupied = true;

// Add some NPC students with laptops
game.npcs = [
    { x: 1, y: 0, laptopOpen: true },
    { x: 4, y: 1, laptopOpen: true },
    { x: 3, y: 3, laptopOpen: false }
];
game.npcs.forEach(npc => {
    game.desks[npc.y][npc.x].occupied = true;
    game.desks[npc.y][npc.x].hasLaptop = npc.laptopOpen;
});

// Function to pick a random empty spot
function getRandomEmptySpot() {
    const emptySpots = [];
    for (let y = 0; y < GRID_HEIGHT; y++) {
        for (let x = 0; x < GRID_WIDTH; x++) {
            if (!game.desks[y][x].occupied) {
                emptySpots.push({ x, y });
            }
        }
    }
    if (emptySpots.length === 0) return { x: 0, y: 0 }; // Fallback
    return emptySpots[Math.floor(Math.random() * emptySpots.length)];
}

// Draw the scene
function drawScene() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw desks
    for (let y = 0; y < GRID_HEIGHT; y++) {
        for (let x = 0; x < GRID_WIDTH; x++) {
            ctx.fillStyle = "#d3a625"; // Desk color
            ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE - 10, TILE_SIZE - 10);
        }
    }

    // Draw NPCs
    game.npcs.forEach(npc => {
        ctx.fillStyle = npc.laptopOpen ? "#4caf50" : "#9e9e9e";
        ctx.fillRect(npc.x * TILE_SIZE + 30, npc.y * TILE_SIZE + 30, 40, 40);
    });

    // Draw player
    ctx.fillStyle = game.player.laptopOpen ? "#00f" : "#aaa";
    ctx.fillRect(game.player.x * TILE_SIZE + 20, game.player.y * TILE_SIZE + 20, 60, 60);

    // Draw lecturer
    ctx.fillStyle = "#f00";
    ctx.fillRect(game.lecturer.x * TILE_SIZE + 20, game.lecturer.y * TILE_SIZE + 20, 60, 60);

    // Update UI
    document.getElementById("score").textContent = `Score: ${Math.floor(game.score)}`;
    document.getElementById("time").textContent = `Time: ${Math.ceil(game.timeLeft)}`;
    if (!game.player.laptopOpen) {
        document.getElementById("message").textContent = `Mash Space (${game.mashCount}/5)`;
    }
}

// Update game state
function update() {
    if (game.gameOver) return;

    // Lecturer movement
    let targetX, targetY;
    if (game.distractionCooldown > 0) {
        const distractedNPC = game.npcs.find(npc => npc.laptopOpen);
        if (distractedNPC) {
            targetX = distractedNPC.x;
            targetY = distractedNPC.y;
            game.lecturer.targetX = null; // Clear retreat target during distraction
            game.lecturer.targetY = null;
        }
        game.distractionCooldown -= 1 / 60;
        if (game.distractionCooldown <= 0) {
            document.getElementById("message").textContent = "";
        }
    } else if (game.player.laptopOpen) {
        // Chase player if laptop is open
        targetX = game.player.x;
        targetY = game.player.y;
        game.lecturer.targetX = null; // Clear retreat target
        game.lecturer.targetY = null;
    } else {
        // If laptop is closed, move to or stay at retreat target
        if (game.lecturer.targetX === null || (Math.abs(game.lecturer.x - game.lecturer.targetX) < 0.1 && Math.abs(game.lecturer.y - game.lecturer.targetY) < 0.1)) {
            const retreatSpot = getRandomEmptySpot();
            game.lecturer.targetX = retreatSpot.x;
            game.lecturer.targetY = retreatSpot.y;
        }
        targetX = game.lecturer.targetX;
        targetY = game.lecturer.targetY;
    }

    if (game.lecturer.x < targetX) game.lecturer.x += game.lecturer.speed;
    if (game.lecturer.x > targetX) game.lecturer.x -= game.lecturer.speed;
    if (game.lecturer.y < targetY) game.lecturer.y += game.lecturer.speed;
    if (game.lecturer.y > targetY) game.lecturer.y -= game.lecturer.speed;

    // Lecturer cooldown
    if (game.lecturerCooldown > 0) {
        game.lecturerCooldown -= 1 / 60;
    }

    // Collision check
    if (Math.abs(game.lecturer.x - game.player.x) < 0.1 && Math.abs(game.lecturer.y - game.player.y) < 0.1) {
        if (game.player.laptopOpen && game.lecturerCooldown <= 0) {
            game.player.laptopOpen = false;
            game.mashCount = 0;
            game.lecturerCooldown = 2;
            document.getElementById("message").textContent = "Mash Space (0/5)";
            // Lecturer retreats
            const retreatSpot = getRandomEmptySpot();
            game.lecturer.targetX = retreatSpot.x;
            game.lecturer.targetY = retreatSpot.y;
        }
    }

    // Score and time
    if (game.player.laptopOpen) game.score += 0.1;
    game.timeLeft -= 1 / 60;
    if (game.timeLeft <= 0) {
        game.gameOver = true;
        document.getElementById("message").textContent = `Game Over! Score: ${Math.floor(game.score)}`;
    }
}

// Player input
document.addEventListener("keydown", (e) => {
    if (game.gameOver) return;

    // Movement
    let newX = game.player.x;
    let newY = game.player.y;
    if (e.key === "ArrowUp" && game.player.y > 0) newY--;
    if (e.key === "ArrowDown" && game.player.y < GRID_HEIGHT - 1) newY++;
    if (e.key === "ArrowLeft" && game.player.x > 0) newX--;
    if (e.key === "ArrowRight" && game.player.x < GRID_WIDTH - 1) newX++;
    if (!game.desks[newY][newX].occupied) {
        game.desks[game.player.y][game.player.x].occupied = false;
        game.player.x = newX;
        game.player.y = newY;
        game.desks[newY][newX].occupied = true;
    }

    // Mash to reopen
    if (e.key === " " && !game.player.laptopOpen) {
        game.mashCount++;
        if (game.mashCount >= 5) {
            game.player.laptopOpen = true;
            game.mashCount = 0;
            document.getElementById("message").textContent = "Laptop reopened!";
            setTimeout(() => {
                if (game.player.laptopOpen) document.getElementById("message").textContent = "";
            }, 1000);
        }
    }

    // Distraction (R key)
    if (e.key === "r" && game.distractionCooldown <= 0) {
        const npcWithLaptop = game.npcs.find(npc => npc.laptopOpen);
        if (npcWithLaptop) {
            game.distractionCooldown = 5;
            document.getElementById("message").textContent = "Lecturer distracted!";
        }
    }
});

// Game loop
function gameLoop() {
    update();
    drawScene();
    requestAnimationFrame(gameLoop);
}

// Start game
gameLoop();