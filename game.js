// Get the canvas and its context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

console.log('Canvas initialized:', canvas !== null);

// Get DOM elements
const timerElement = document.getElementById('timer');
const timesListElement = document.getElementById('timesList');

console.log('Timer element found:', timerElement !== null);
console.log('Times list element found:', timesListElement !== null);

// Timer variables
let startTime = 0;
let currentTime = 0;
let timerRunning = false;

// Animation variables
let mouthAngle = 0;
let mouthDirection = 1;
const MOUTH_SPEED = 0.15;
const MAX_MOUTH_ANGLE = Math.PI / 4; // 45 degrees

// Previous times array (max 10 entries)
let previousTimes = [];

// Create player image object
const playerImage = new Image();
playerImage.src = 'player.jpg';
playerImage.onload = function() {
    console.log('Player image loaded with dimensions:', playerImage.width, 'x', playerImage.height);
    handleImageLoad();
};
playerImage.onerror = function(e) {
    console.error('Error loading player image:', e);
    alert('Could not load player image. Check console for details.');
};

// Create goal image object
const goalImage = new Image();
goalImage.src = 'sarah.png';
goalImage.onload = function() {
    console.log('Goal image loaded with dimensions:', goalImage.width, 'x', goalImage.height);
    handleImageLoad();
};
goalImage.onerror = function(e) {
    console.error('Error loading goal image:', e);
    alert('Could not load goal image. Check console for details.');
};

// Log when images load successfully
let imagesLoaded = 0;
function handleImageLoad() {
    imagesLoaded++;
    console.log('Image loaded. Total images loaded:', imagesLoaded);
    if (imagesLoaded === 2) {
        console.log('Both images loaded, starting game...');
        restartGame();
        gameLoop();
    }
}

// Player properties
const player = {
    x: 20,                    // starting x position (bottom left)
    y: canvas.height - 70,    // starting y position (bottom left)
    size: 50,                 // size of the square
    speed: 5                  // how fast the square moves
};

// Goal properties
const goal = {
    x: canvas.width - 70,  // position from right
    y: 20,                 // position from top
    size: 50              // base size
};

// Obstacles template (will be used to create random obstacles)
const obstacleTemplates = [
    {
        width: 20,
        height: 200,
        speed: 2,
        color: '#FF6B6B'
    },
    {
        width: 200,
        height: 20,
        speed: 2,
        color: '#4ECDC4'
    },
    {
        width: 20,
        height: 150,
        speed: 3,
        color: '#FFD93D'
    }
];

// Function to get random position for obstacles
function getRandomPosition(obstacleWidth, obstacleHeight) {
    // Define safe zones (areas where obstacles shouldn't spawn)
    const safeZoneStart = {
        x: 0,
        y: canvas.height - 100,
        width: 100,
        height: 100
    };
    const safeZoneEnd = {
        x: canvas.width - 100,
        y: 0,
        width: 100,
        height: 100
    };

    let x, y;
    let validPosition = false;

    while (!validPosition) {
        // Get random position
        x = Math.random() * (canvas.width - obstacleWidth);
        y = Math.random() * (canvas.height - obstacleHeight);

        // Check if position overlaps with safe zones
        const overlapsStart = !(x + obstacleWidth < safeZoneStart.x || 
                              x > safeZoneStart.x + safeZoneStart.width ||
                              y + obstacleHeight < safeZoneStart.y ||
                              y > safeZoneStart.y + safeZoneStart.height);

        const overlapsEnd = !(x + obstacleWidth < safeZoneEnd.x ||
                            x > safeZoneEnd.x + safeZoneEnd.width ||
                            y + obstacleHeight < safeZoneEnd.y ||
                            y > safeZoneEnd.y + safeZoneEnd.height);

        if (!overlapsStart && !overlapsEnd) {
            validPosition = true;
        }
    }

    return { x, y };
}

// Function to create obstacles with random positions
function createRandomObstacles() {
    return obstacleTemplates.map(template => {
        const pos = getRandomPosition(template.width, template.height);
        return {
            ...template,
            x: pos.x,
            y: pos.y,
            direction: Math.random() < 0.5 ? 1 : -1 // Random initial direction
        };
    });
}

// Initialize obstacles array
let obstacles = createRandomObstacles();

// Game state
let gameWon = false;
let gameLost = false;

// Game controls
let rightPressed = false;
let leftPressed = false;
let upPressed = false;
let downPressed = false;

// Add keyboard event listeners
document.addEventListener('keydown', keyDownHandler);
document.addEventListener('keyup', keyUpHandler);

// Handle key press
function keyDownHandler(event) {
    if(event.key === "Right" || event.key === "ArrowRight") {
        rightPressed = true;
    }
    if(event.key === "Left" || event.key === "ArrowLeft") {
        leftPressed = true;
    }
    if(event.key === "Up" || event.key === "ArrowUp") {
        upPressed = true;
    }
    if(event.key === "Down" || event.key === "ArrowDown") {
        downPressed = true;
    }
    // Add R key to restart game
    if(event.key === "r" || event.key === "R") {
        restartGame();
    }
}

// Handle key release
function keyUpHandler(event) {
    if(event.key === "Right" || event.key === "ArrowRight") {
        rightPressed = false;
    }
    if(event.key === "Left" || event.key === "ArrowLeft") {
        leftPressed = false;
    }
    if(event.key === "Up" || event.key === "ArrowUp") {
        upPressed = false;
    }
    if(event.key === "Down" || event.key === "ArrowDown") {
        downPressed = false;
    }
}

// Add touch controls
const controlButtons = {
    up: document.querySelector('.control-btn.up'),
    down: document.querySelector('.control-btn.down'),
    left: document.querySelector('.control-btn.left'),
    right: document.querySelector('.control-btn.right')
};

// Handle touch events for control buttons
Object.entries(controlButtons).forEach(([direction, button]) => {
    if (button) {
        button.addEventListener('touchstart', (e) => {
            e.preventDefault();
            switch(direction) {
                case 'up': upPressed = true; break;
                case 'down': downPressed = true; break;
                case 'left': leftPressed = true; break;
                case 'right': rightPressed = true; break;
            }
        });

        button.addEventListener('touchend', (e) => {
            e.preventDefault();
            switch(direction) {
                case 'up': upPressed = false; break;
                case 'down': downPressed = false; break;
                case 'left': leftPressed = false; break;
                case 'right': rightPressed = false; break;
            }
        });
    }
});

// Prevent default touch behavior to avoid scrolling
canvas.addEventListener('touchstart', (e) => e.preventDefault());
canvas.addEventListener('touchmove', (e) => e.preventDefault());
canvas.addEventListener('touchend', (e) => e.preventDefault());

// Function to resize canvas
function resizeCanvas() {
    const container = canvas.parentElement;
    const maxSize = Math.min(window.innerWidth - 20, window.innerHeight - 200, 400);
    
    canvas.style.width = maxSize + 'px';
    canvas.style.height = maxSize + 'px';
}

// Add resize listener
window.addEventListener('resize', resizeCanvas);
window.addEventListener('load', resizeCanvas);

// Draw the player with circular clipping and animated mouth
function drawPlayer() {
    ctx.save(); // Save the current context state
    
    // Calculate the center of the player
    const centerX = player.x + player.size / 2;
    const centerY = player.y + player.size / 2;
    const radius = player.size / 2;
    
    // Create circular clipping path
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, mouthAngle, 2 * Math.PI - mouthAngle);
    ctx.lineTo(centerX, centerY);
    ctx.closePath();
    ctx.clip();
    
    // Draw the image within the clipping path
    ctx.drawImage(playerImage, player.x, player.y, player.size, player.size);
    
    ctx.restore(); // Restore the context state
    
    // Update mouth animation
    if (!gameWon && !gameLost) {
        mouthAngle += MOUTH_SPEED * mouthDirection;
        if (mouthAngle >= MAX_MOUTH_ANGLE || mouthAngle <= 0) {
            mouthDirection *= -1;
        }
        mouthAngle = Math.max(0, Math.min(mouthAngle, MAX_MOUTH_ANGLE));
    }
}

// Draw the goal
function drawGoal() {
    // Calculate size while maintaining aspect ratio
    let drawWidth = goal.size;
    let drawHeight = goal.size;
    
    // Center the image in its allocated space
    let drawX = goal.x;
    let drawY = goal.y;
    
    ctx.save();
    // Create circular clipping path
    ctx.beginPath();
    ctx.arc(drawX + drawWidth/2, drawY + drawHeight/2, goal.size/2, 0, Math.PI * 2);
    ctx.clip();
    
    // Draw the image
    ctx.drawImage(goalImage, drawX, drawY, drawWidth, drawHeight);
    
    ctx.restore();
}

// Draw obstacles
function drawObstacles() {
    obstacles.forEach(obstacle => {
        ctx.fillStyle = obstacle.color;
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    });
}

// Update obstacles
function updateObstacles() {
    obstacles.forEach(obstacle => {
        if (obstacle.height > obstacle.width) {
            // Vertical moving obstacle
            obstacle.y += obstacle.speed * obstacle.direction;
            if (obstacle.y + obstacle.height > canvas.height || obstacle.y < 0) {
                obstacle.direction *= -1;
            }
        } else {
            // Horizontal moving obstacle
            obstacle.x += obstacle.speed * obstacle.direction;
            if (obstacle.x + obstacle.width > canvas.width || obstacle.x < 0) {
                obstacle.direction *= -1;
            }
        }
    });
}

// Check collision with obstacles
function checkObstacleCollision() {
    return obstacles.some(obstacle => {
        return player.x < obstacle.x + obstacle.width &&
               player.x + player.size > obstacle.x &&
               player.y < obstacle.y + obstacle.height &&
               player.y + player.size > obstacle.y;
    });
}

// Check for collision between player and goal
function checkWinCollision() {
    const playerRight = player.x + player.size;
    const playerBottom = player.y + player.size;
    const goalRight = goal.x + goal.size;
    const goalBottom = goal.y + goal.size;

    return player.x < goalRight &&
           playerRight > goal.x &&
           player.y < goalBottom &&
           playerBottom > goal.y;
}

// Format time in seconds
function formatTime(timeInMs) {
    return (timeInMs / 1000).toFixed(1);
}

// Update timer display
function updateTimer() {
    if (timerRunning) {
        currentTime = Date.now() - startTime;
        timerElement.textContent = `Time: ${formatTime(currentTime)}s`;
    }
}

// Add time to leaderboard
function addTimeToLeaderboard(time) {
    previousTimes.unshift(time); // Add to start of array
    if (previousTimes.length > 10) {
        previousTimes.pop(); // Remove last element if more than 10
    }
    
    // Update leaderboard display
    timesListElement.innerHTML = '';
    previousTimes.forEach((time, index) => {
        const li = document.createElement('li');
        li.textContent = `${index + 1}. ${formatTime(time)}s`;
        timesListElement.appendChild(li);
    });
}

// Restart game (updated version)
function restartGame() {
    player.x = 20;
    player.y = canvas.height - 70;
    gameWon = false;
    gameLost = false;
    startTime = Date.now();
    timerRunning = true;
    
    // Reset obstacles to new random positions
    obstacles = createRandomObstacles();
}

// Draw messages
function drawMessages() {
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    
    if (gameWon) {
        ctx.fillStyle = 'green';
        ctx.fillText('You get a hug!', canvas.width/2, canvas.height/2);
        ctx.font = '24px Arial';
        ctx.fillText('Press R to play again', canvas.width/2, canvas.height/2 + 40);
        
        // Stop timer and add to leaderboard if not already added
        if (timerRunning) {
            timerRunning = false;
            addTimeToLeaderboard(currentTime);
        }
    } else if (gameLost) {
        ctx.fillStyle = 'red';
        ctx.fillText('Try Again!', canvas.width/2, canvas.height/2);
        ctx.font = '24px Arial';
        ctx.fillText('Press R to restart', canvas.width/2, canvas.height/2 + 40);
        timerRunning = false;
    }
}

// Main game loop
function gameLoop() {
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (!gameWon && !gameLost) {
        // Update timer
        updateTimer();
        
        // Update obstacles
        updateObstacles();
        
        // Calculate movement direction for mouth orientation
        let isMoving = rightPressed || leftPressed || upPressed || downPressed;
        if (!isMoving) {
            // Reset mouth angle when not moving
            mouthAngle = Math.max(0, mouthAngle - MOUTH_SPEED);
        }
        
        // Move the player based on key presses
        if(rightPressed && player.x < canvas.width - player.size) {
            player.x += player.speed;
        }
        if(leftPressed && player.x > 0) {
            player.x -= player.speed;
        }
        if(upPressed && player.y > 0) {
            player.y -= player.speed;
        }
        if(downPressed && player.y < canvas.height - player.size) {
            player.y += player.speed;
        }
        
        // Check for collisions
        if (checkObstacleCollision()) {
            gameLost = true;
        }
        
        // Check for win condition
        if (checkWinCollision()) {
            gameWon = true;
        }
    }
    
    // Draw game elements
    drawObstacles();
    drawGoal();
    drawPlayer();
    drawMessages();
    
    // Continue the game loop
    requestAnimationFrame(gameLoop);
} 