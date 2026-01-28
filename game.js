const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let keys = {};
let projectiles = [];

const player = {
  x: canvas.width / 2,
  z: 200,
  speed: 4,
  dashCooldown: 0
};

window.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
window.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

window.addEventListener("mousedown", shoot);

function shoot() {
  projectiles.push({
    x: player.x,
    z: player.z - 20,
    speed: 10
  });
}

function update() {
  let moveX = 0;
  let moveZ = 0;

  if (keys["w"]) moveZ -= 1;
  if (keys["s"]) moveZ += 1;
  if (keys["a"]) moveX -= 1;
  if (keys["d"]) moveX += 1;

  const len = Math.hypot(moveX, moveZ);
  if (len > 0) {
    moveX /= len;
    moveZ /= len;
  }

  player.x += moveX * player.speed;
  player.z += moveZ * player.speed;

  if (keys[" "] && player.dashCooldown <= 0) {
    player.z -= 80;
    player.dashCooldown = 40;
  }

  if (player.dashCooldown > 0) player.dashCooldown--;

  for (let p of projectiles) {
    p.z -= p.speed;
  }

  projectiles = projectiles.filter(p => p.z > -200);
}

function drawPlayer() {
  const size = 40;
  ctx.fillStyle = "#ffdddd";
  ctx.fillRect(player.x - size / 2, canvas.height - player.z - size, size, size);
}

function drawProjectiles() {
  ctx.fillStyle = "#66ccff";
  for (let p of projectiles) {
    ctx.beginPath();
    ctx.arc(p.x, canvas.height - p.z, 10, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawArena() {
  ctx.strokeStyle = "#333";
  ctx.lineWidth = 2;

  for (let i = 0; i < 10; i++) {
    const z = i * 80;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - z);
    ctx.lineTo(canvas.width, canvas.height - z);
    ctx.stroke();
  }
}

function loop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  update();
  drawArena();
  drawPlayer();
  drawProjectiles();

  requestAnimationFrame(loop);
}

loop();
