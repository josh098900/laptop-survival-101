// Get canvas and context
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Game state
let game = {
    player: { x: 2, y: 2, laptopOpen: true },
    lecturer: { x: 0, y: 0, speed: 0.05 },
    score: 0,
    timeLeft: 180, // 3 minutes in seconds
    desks: [],
    gameOver: false,
    npcs: [], // Other students
    distractionCooldown: 0
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
    { x: 3, y: 3, laptopOpen: false } // No laptop
];
game.npcs.forEach(npc => {
    game.desks[npc.y][npc.x].occupied = true;
    game.desks[npc.y][npc.x].hasLaptop = npc.laptopOpen;
});

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
        ctx.fillStyle = npc.laptopOpen ? "#4caf50" : "#9e9e9e"; // Green if laptop, gray if not
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
}

// Update game state
function update() {
    if (game.gameOver) return;

    // Lecturer movement (chase player or distracted NPC)
    let targetX = game.player.x;
    let targetY = game.player.y;
    if (game.distractionCooldown > 0) {
        const distractedNPC = game.npcs.find(npc => npc.laptopOpen);
        if (distractedNPC) {
            targetX = distractedNPC.x;
            targetY = distractedNPC.y;
        }
        game.distractionCooldown -= 1 / 60;
        if (game.distractionCooldown <= 0) {
            document.getElementById("message").textContent = "";
        }
    }
    if (game.lecturer.x < targetX) game.lecturer.x += game.lecturer.speed;
    if (game.lecturer.x > targetX) game.lecturer.x -= game.lecturer.speed;
    if (game.lecturer.y < targetY) game.lecturer.y += game.lecturer.speed;
    if (game.lecturer.y > targetY) game.lecturer.y -= game.lecturer.speed;

    // Lecturer catches player
    if (Math.abs(game.lecturer.x - game.player.x) < 0.5 && Math.abs(game.lecturer.y - game.player.y) < 0.5) {
        if (game.player.laptopOpen) {
            game.player.laptopOpen = false;
            document.getElementById("message").textContent = "Laptop closed! Mash spacebar!";
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
let mashCount = 0;
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
        mashCount++;
        if (mashCount >= 5) {
            game.player.laptopOpen = true;
            mashCount = 0;
            document.getElementById("message").textContent = "Laptop reopened!";
        }
    }

    // Distraction (R key)
    if (e.key === "r" && game.distractionCooldown <= 0) {
        const npcWithLaptop = game.npcs.find(npc => npc.laptopOpen);
        if (npcWithLaptop) {
            game.distractionCooldown = 5; // 5-second distraction
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