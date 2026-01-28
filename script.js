const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const keys = {};

// Car object
const car = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    angle: 0,
    speed: 0,
    maxSpeed: 8,
    accel: 0.2,
    brake: 0.3,
    friction: 0.05,
    turnSpeed: 0.04,
    driftFactor: 0.92 // lower = more drift
};

// Input listeners
document.addEventListener("keydown", e => keys[e.key] = true);
document.addEventListener("keyup", e => keys[e.key] = false);

// Game loop
function update() {
    // Acceleration
    if (keys["w"]) car.speed += car.accel;
    if (keys["s"]) car.speed -= car.brake;

    // Clamp speed
    car.speed = Math.max(Math.min(car.speed, car.maxSpeed), -car.maxSpeed / 2);

    // Steering (only when moving)
    if (Math.abs(car.speed) > 0.1) {
        if (keys["a"]) car.angle -= car.turnSpeed * (car.speed / car.maxSpeed);
        if (keys["d"]) car.angle += car.turnSpeed * (car.speed / car.maxSpeed);
    }

    // Apply friction
    car.speed *= (1 - car.friction);

    // Drift physics
    const vx = Math.cos(car.angle) * car.speed;
    const vy = Math.sin(car.angle) * car.speed;

    car.x += vx;
    car.y += vy;

    // Wrap screen
    if (car.x < 0) car.x = canvas.width;
    if (car.x > canvas.width) car.x = 0;
    if (car.y < 0) car.y = canvas.height;
    if (car.y > canvas.height) car.y = 0;

    draw();
    requestAnimationFrame(update);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(car.x, car.y);
    ctx.rotate(car.angle);

    // Simple placeholder car
    ctx.fillStyle = "orange";
    ctx.fillRect(-20, -10, 40, 20);

    ctx.restore();
}

update();
