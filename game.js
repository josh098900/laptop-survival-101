// Get canvas and context
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Game state
let game = {
    player: { x: 2, y: 2, laptopOpen: true },
    lecturer: { x: 0, y: 0, speed: 0.015, targetX: null, targetY: null },
    score: 0,
    timeLeft: 180,
    desks: [],
    gameOver: false,
    npcs: [],
    distractionCooldown: 0,
    mashCount: 0,
    lecturerCooldown: 0,
    speechText: "",
    speechTimer: 0,
    speechIndex: 0
};

// Lecturer speech options
const lecturerLines = [
    "Close your laptop!",
    "Are you sleeping?",
    "Are you okay?",
    "What are you doing?"
];

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
    if (emptySpots.length === 0) return { x: 0, y: 0 };
    return emptySpots[Math.floor(Math.random() * emptySpots.length)];
}

// Draw the scene
function drawScene() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw desks
    ctx.font = "40px 'Comic Sans MS'";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (let y = 0; y < GRID_HEIGHT; y++) {
        for (let x = 0; x < GRID_WIDTH; x++) {
            ctx.fillStyle = "#fff";
            ctx.fillText("🖥️", x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2);
        }
    }

    // Draw NPCs
    game.npcs.forEach(npc => {
        ctx.fillStyle = "#fff";
        ctx.fillText(npc.laptopOpen ? "🤓" : "📝", npc.x * TILE_SIZE + TILE_SIZE / 2, npc.y * TILE_SIZE + TILE_SIZE / 2);
    });

    // Draw player with panic effect
    const lecturerDistance = Math.sqrt(
        (game.lecturer.x - game.player.x) ** 2 + (game.lecturer.y - game.player.y) ** 2
    );
    ctx.fillStyle = "#fff";
    ctx.fillText(
        game.player.laptopOpen ? "👨🏻‍💻" : "😓", // Changed from 💻 to 👨🏻‍💻
        game.player.x * TILE_SIZE + TILE_SIZE / 2,
        game.player.y * TILE_SIZE + TILE_SIZE / 2
    );
    if (lecturerDistance < 1 && game.player.laptopOpen) {
        ctx.fillStyle = "rgba(255, 0, 0, 0.4)";
        ctx.fillRect(game.player.x * TILE_SIZE, game.player.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    }

    // Draw lecturer with stomp effect
    const bounce = Math.sin(Date.now() / 200) * 5;
    ctx.fillStyle = "#fff";
    ctx.fillText("👨‍🏫", game.lecturer.x * TILE_SIZE + TILE_SIZE / 2, game.lecturer.y * TILE_SIZE + TILE_SIZE / 2 + bounce);

    // Draw speech bubble (bigger)
    if (game.speechTimer > 0) {
        const bubbleX = game.lecturer.x * TILE_SIZE + TILE_SIZE / 2;
        const bubbleY = game.lecturer.y * TILE_SIZE + TILE_SIZE / 2 + bounce - 50; // Adjusted up
        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.fillRect(bubbleX - 80, bubbleY - 25, 160, 50); // Increased from 120x40 to 160x50
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 2;
        ctx.strokeRect(bubbleX - 80, bubbleY - 25, 160, 50);
        ctx.fillStyle = "#000";
        ctx.font = "18px 'Comic Sans MS'"; // Slightly larger font
        ctx.fillText(game.speechText, bubbleX, bubbleY + 8);
    }

    // Update UI elements
    document.getElementById("score").textContent = `Score: ${Math.floor(game.score)}`;
    document.getElementById("time").textContent = `Time: ${Math.ceil(game.timeLeft)}`;
    if (!game.player.laptopOpen && game.speechTimer <= 0) {
        document.getElementById("message").textContent = `Mash Space (${game.mashCount}/5)`;
    }
}

// Update game state
function update() {
    if (game.gameOver) return;

    let targetX, targetY;
    if (game.distractionCooldown > 0) {
        const distractedNPC = game.npcs.find(npc => npc.laptopOpen);
        if (distractedNPC) {
            targetX = distractedNPC.x;
            targetY = distractedNPC.y;
            game.lecturer.targetX = null;
            game.lecturer.targetY = null;
        }
        game.distractionCooldown -= 1 / 60;
        if (game.distractionCooldown <= 0) {
            document.getElementById("message").textContent = "";
        }
    } else if (game.player.laptopOpen) {
        targetX = game.player.x;
        targetY = game.player.y;
        game.lecturer.targetX = null;
        game.lecturer.targetY = null;
    } else {
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

    if (game.lecturerCooldown > 0) {
        game.lecturerCooldown -= 1 / 60;
    }

    if (game.speechTimer > 0) {
        game.speechTimer -= 1 / 60;
        if (game.speechTimer <= 0) {
            game.speechText = "";
        }
    }

    if (Math.abs(game.lecturer.x - game.player.x) < 0.1 && Math.abs(game.lecturer.y - game.player.y) < 0.1) {
        if (game.player.laptopOpen && game.lecturerCooldown <= 0) {
            game.player.laptopOpen = false;
            game.mashCount = 0;
            game.lecturerCooldown = 2;
            game.speechText = lecturerLines[game.speechIndex];
            game.speechTimer = 3;
            game.speechIndex = (game.speechIndex + 1) % lecturerLines.length;
            const retreatSpot = getRandomEmptySpot();
            game.lecturer.targetX = retreatSpot.x;
            game.lecturer.targetY = retreatSpot.y;
        }
    }

    // Update score and time
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