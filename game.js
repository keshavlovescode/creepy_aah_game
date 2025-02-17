const gameArea = document.querySelector('#gameArea');
const scoreElement = document.querySelector('#score');
const player = document.querySelector('.player');
const startScreen = document.querySelector('#startScreen');
const startButton = document.querySelector('#startButton');
let score = 0;
let currentRoom = { x: 0, y: 0 };
let entities = [];
let gameActive = false;
let playerPos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
let playerSpeed = 5;
let isMoving = false;
let moveInterval = null;
let pressedKeys = new Set();

// Initialize audio objects but don't play them yet
const doorSound = new Audio('DoorOpen2.mp3');
const ambientSound = new Audio('roblox horror ambience.mp3');
ambientSound.loop = true;
ambientSound.volume = 0.3;

// Wait for user interaction before starting the game
startButton.addEventListener('click', () => {
    startScreen.style.display = 'none';
    gameActive = true;
    initGame();
});

function initGame() {
    // Now it's safe to play audio
    ambientSound.play().catch(err => console.log('Audio play failed:', err));
    generateRoom();
    setupControls();
    gameLoop();
}

function generateRoom() {
    const room = document.querySelector('.room');
    const walls = document.querySelector('.walls');
    room.innerHTML = '';
    walls.innerHTML = '';
    
    // Generate walls
    const topWall = document.createElement('div');
    topWall.className = 'wall horizontal';
    topWall.style.top = '0';
    
    const bottomWall = document.createElement('div');
    bottomWall.className = 'wall horizontal';
    bottomWall.style.bottom = '0';
    
    const leftWall = document.createElement('div');
    leftWall.className = 'wall vertical';
    leftWall.style.left = '0';
    
    const rightWall = document.createElement('div');
    rightWall.className = 'wall vertical';
    rightWall.style.right = '0';
    
    walls.appendChild(topWall);
    walls.appendChild(bottomWall);
    walls.appendChild(leftWall);
    walls.appendChild(rightWall);
    
    // Random number of doors (1-4)
    const doorCount = Math.floor(Math.random() * 4) + 1;
    const positions = ['left', 'right', 'top', 'bottom'];
    
    // Shuffle positions
    for (let i = positions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [positions[i], positions[j]] = [positions[j], positions[i]];
    }
    
    // Add doors
    for (let i = 0; i < doorCount; i++) {
        const door = document.createElement('div');
        door.className = `door ${positions[i]}`;
        door.onclick = () => useDoor(positions[i]);
        room.appendChild(door);
    }
    
    // Random chance to spawn entity
    if (Math.random() < 0.3) {
        spawnEntity();
    }
    
    // Rare chance to spawn Monster Candy (5% chance)
    if (Math.random() < 0.05) {
        const candy = document.createElement('div');
        candy.className = 'monster-candy';
        candy.style.left = `${Math.random() * 60 + 20}%`;
        candy.style.top = `${Math.random() * 60 + 20}%`;
        room.appendChild(candy);
    }
    
    score++;
    scoreElement.textContent = score;
}

function spawnEntity() {
    const entity = document.createElement('div');
    entity.className = 'entity';
    entity.style.left = `${Math.random() * 80 + 10}%`;
    entity.style.top = `${Math.random() * 80 + 10}%`;
    document.querySelector('.room').appendChild(entity);
    entities.push({
        element: entity,
        x: parseInt(entity.style.left),
        y: parseInt(entity.style.top)
    });
}

function movePlayer(dx, dy) {
    if (!gameActive) return;
    
    const newX = playerPos.x + dx * playerSpeed;
    const newY = playerPos.y + dy * playerSpeed;
    
    // Boundary checking
    if (newX > 50 && newX < window.innerWidth - 50 &&
        newY > 50 && newY < window.innerHeight - 50) {
        playerPos.x = newX;
        playerPos.y = newY;
        player.style.left = `${playerPos.x}px`;
        player.style.top = `${playerPos.y}px`;
        
        // Check for entity collisions
        checkEntityCollisions();
        
        // Check for door proximity
        checkDoorProximity();
    }
}

function checkEntityCollisions() {
    const playerRect = player.getBoundingClientRect();
    
    entities.forEach(entity => {
        const entityRect = entity.element.getBoundingClientRect();
        if (isColliding(playerRect, entityRect)) {
            triggerJumpscare();
        }
    });
    
    // Check for candy collection
    const candies = document.querySelectorAll('.monster-candy');
    candies.forEach(candy => {
        const candyRect = candy.getBoundingClientRect();
        if (isColliding(playerRect, candyRect)) {
            candy.remove();
            // Could add scoring or other effects here
        }
    });
}

function isColliding(rect1, rect2) {
    return !(rect1.right < rect2.left || 
             rect1.left > rect2.right || 
             rect1.bottom < rect2.top || 
             rect1.top > rect2.bottom);
}

function checkDoorProximity() {
    const doors = document.querySelectorAll('.door');
    let nearDoor = false;
    
    doors.forEach(door => {
        const doorRect = door.getBoundingClientRect();
        const playerRect = player.getBoundingClientRect();
        
        if (isColliding(playerRect, doorRect)) {
            nearDoor = true;
            const direction = door.className.split(' ')[1];
            useDoor(direction);
        }
    });
    
    player.classList.toggle('scared', nearDoor);
}

function setupControls() {
    // Keyboard controls
    document.addEventListener('keydown', e => {
        pressedKeys.add(e.key);
    });
    
    document.addEventListener('keyup', e => {
        pressedKeys.delete(e.key);
    });
    
    // Touch controls
    const controls = ['leftBtn', 'rightBtn', 'upBtn', 'downBtn'];
    controls.forEach(btnId => {
        const btn = document.getElementById(btnId);
        
        const startMove = () => {
            isMoving = true;
            moveInterval = setInterval(() => {
                switch(btnId) {
                    case 'leftBtn': movePlayer(-1, 0); break;
                    case 'rightBtn': movePlayer(1, 0); break;
                    case 'upBtn': movePlayer(0, -1); break;
                    case 'downBtn': movePlayer(0, 1); break;
                }
            }, 16);
        };
        
        const stopMove = () => {
            isMoving = false;
            clearInterval(moveInterval);
        };
        
        btn.addEventListener('mousedown', startMove);
        btn.addEventListener('touchstart', startMove);
        btn.addEventListener('mouseup', stopMove);
        btn.addEventListener('touchend', stopMove);
        btn.addEventListener('mouseleave', stopMove);
    });
}

function gameLoop() {
    if (gameActive) {
        // Handle keyboard movement
        if (pressedKeys.has('ArrowLeft')) movePlayer(-1, 0);
        if (pressedKeys.has('ArrowRight')) movePlayer(1, 0);
        if (pressedKeys.has('ArrowUp')) movePlayer(0, -1);
        if (pressedKeys.has('ArrowDown')) movePlayer(0, 1);
        
        requestAnimationFrame(gameLoop);
    }
}

function useDoor(direction) {
    if (!gameActive) return;
    
    doorSound.play().catch(err => console.log('Door sound failed:', err));
    
    // Reset player position to center of new room
    playerPos.x = window.innerWidth / 2;
    playerPos.y = window.innerHeight / 2;
    player.style.left = `${playerPos.x}px`;
    player.style.top = `${playerPos.y}px`;
    
    // Update room coordinates based on direction
    switch(direction) {
        case 'left': currentRoom.x--; break;
        case 'right': currentRoom.x++; break;
        case 'top': currentRoom.y--; break;
        case 'bottom': currentRoom.y++; break;
    }
    
    const room = document.querySelector('.room');
    room.style.opacity = 0;
    
    setTimeout(() => {
        room.style.opacity = 1;
        generateRoom();
    }, 500);
}

function triggerJumpscare() {
    gameActive = false;
    const jumpscare = document.querySelector('.jumpscare');
    jumpscare.style.display = 'block';
    
    const screamSound = new Audio('roblox-doors-rush-screaming.mp3');
    screamSound.play().catch(err => console.log('Scream sound failed:', err));
    
    setTimeout(() => {
        jumpscare.style.display = 'none';
        document.getElementById('gameOver').style.display = 'flex';
    }, 1000);
}

function restartGame() {
    score = 0;
    currentRoom = { x: 0, y: 0 };
    entities = [];
    gameActive = true;
    playerPos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    player.style.left = `${playerPos.x}px`;
    player.style.top = `${playerPos.y}px`;
    document.getElementById('gameOver').style.display = 'none';
    // Restart ambient sound
    ambientSound.currentTime = 0;
    ambientSound.play().catch(err => console.log('Ambient sound restart failed:', err));
    generateRoom();
    gameLoop();
}

// Keep the touch event prevention
document.addEventListener('touchstart', (e) => {
    if (e.target.classList.contains('control-btn')) {
        e.preventDefault();
    }
}, { passive: false });