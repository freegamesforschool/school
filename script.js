const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 600;
canvas.height = 400;

// Game State
let taxiX = 0; 
let score = 0;
let speed = 5;
let obstacles = [];
const lanes = [-150, 0, 150];

// Projection Constants
const fieldOfView = 200; 
const cameraHeight = 150;
const vPointX = canvas.width / 2;
const vPointY = canvas.height / 2;

function project(x, y, z) {
    // Basic 3D to 2D projection formula:
    // ScreenX = (X / Z) * Scale + Offset
    const scale = fieldOfView / z;
    return {
        x: x * scale + vPointX,
        y: y * scale + vPointY,
        scale: scale
    };
}

function drawTaxi() {
    // The player taxi is drawn at a fixed "near" position
    ctx.fillStyle = "#f1c40f"; // Yellow
    const x = (taxiX * 0.5) + vPointX - 40;
    ctx.fillRect(x, 300, 80, 40); // Body
    ctx.fillStyle = "black";
    ctx.fillRect(x + 5, 290, 70, 20); // Roof
}

function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw Road (Static Trapezoid)
    ctx.fillStyle = "#444";
    ctx.beginPath();
    ctx.moveTo(vPointX - 20, vPointY);
    ctx.lineTo(vPointX + 20, vPointY);
    ctx.lineTo(canvas.width, canvas.height);
    ctx.lineTo(0, canvas.height);
    ctx.fill();

    // Handle Obstacles
    if (Math.random() < 0.05) {
        obstacles.push({ x: lanes[Math.floor(Math.random() * 3)], z: 1000 });
    }

    for (let i = obstacles.length - 1; i >= 0; i--) {
        let obs = obstacles[i];
        obs.z -= speed;

        if (obs.z <= 1) {
            // Collision Detection (simplified)
            if (Math.abs(obs.x - taxiX) < 50) {
                alert("CRASH! Score: " + score);
                location.reload();
            }
            obstacles.splice(i, 1);
            score++;
            document.getElementById('score').innerText = "Score: " + score;
            speed += 0.1;
            continue;
        }

        // Draw Obstacle (Cone)
        const p = project(obs.x - taxiX, cameraHeight, obs.z);
        const size = 20 * p.scale;
        
        ctx.fillStyle = "orangered";
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - size, p.y + size * 2);
        ctx.lineTo(p.x + size, p.y + size * 2);
        ctx.fill();
    }

    drawTaxi();
    requestAnimationFrame(update);
}

// Input
window.addEventListener('keydown', (e) => {
    if (e.key === 'a' || e.key === 'ArrowLeft') taxiX -= 150;
    if (e.key === 'd' || e.key === 'ArrowRight') taxiX += 150;
    // Boundary check
    taxiX = Math.max(-150, Math.min(150, taxiX));
});

update();
