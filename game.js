const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const ui = document.getElementById("ui");

let money = 0;
let hookX = canvas.width / 2;
let hookY = 80;
let hookWidth = 10;
let hookHeight = 20;

let lineTop = 80;
let maxDepth = 600;

let state = "aim"; // "aim" | "down" | "up"
let speedDown = 4;
let speedUp = 5;

let fishes = [];
let caught = [];

canvas.addEventListener("mousemove", e => {
  if (state === "aim") {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    hookX = Math.max(40, Math.min(canvas.width - 40, x));
  }
});

canvas.addEventListener("click", () => {
  if (state === "aim") {
    state = "down";
    caught = [];
  } else if (state === "up" && hookY <= lineTop + 5) {
    state = "aim";
  }
});

function spawnFishes() {
  fishes = [];
  const rows = 6;
  for (let i = 0; i < rows; i++) {
    const depth = 140 + i * 80;
    const count = 3 + Math.floor(Math.random() * 3);
    for (let j = 0; j < count; j++) {
      fishes.push({
        x: Math.random() * (canvas.width - 80) + 40,
        y: depth + (Math.random() - 0.5) * 30,
        r: 12 + Math.random() * 10,
        value: 5 + i * 5,
        dir: Math.random() < 0.5 ? -1 : 1,
        speed: 0.5 + Math.random() * 0.8,
        alive: true
      });
    }
  }
}

spawnFishes();

function update() {
  if (state === "down") {
    hookY += speedDown;
    if (hookY >= maxDepth) {
      state = "up";
    }
  } else if (state === "up") {
    hookY -= speedUp;
    if (hookY <= lineTop) {
      hookY = lineTop;
      // cash in
      let gained = 0;
      for (const f of caught) gained += f.value;
      money += gained;
      ui.innerText = "$" + money;
      // reset fish
      spawnFishes();
      state = "aim";
    }
  }

  // move fishes
  for (const f of fishes) {
    if (!f.alive) continue;
    f.x += f.dir * f.speed;
    if (f.x < 30 || f.x > canvas.width - 30) f.dir *= -1;
  }

  // collisions while going down or up
  if (state === "down" || state === "up") {
    const hx = hookX;
    const hy = hookY + hookHeight / 2;
    for (const f of fishes) {
      if (!f.alive) continue;
      const dx = f.x - hx;
      const dy = f.y - hy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < f.r + 10) {
        f.alive = false;
        caught.push(f);
        if (caught.length >= 5) {
          state = "up";
        }
      }
    }
  }
}

function drawFish(f) {
  ctx.save();
  ctx.translate(f.x, f.y);
  ctx.scale(f.dir, 1);

  ctx.fillStyle = "#ffcc66";
  ctx.beginPath();
  ctx.ellipse(0, 0, f.r * 1.4, f.r, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(-f.r * 1.4, 0);
  ctx.lineTo(-f.r * 2, -f.r * 0.8);
  ctx.lineTo(-f.r * 2, f.r * 0.8);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.arc(f.r * 0.6, -f.r * 0.3, f.r * 0.25, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "black";
  ctx.beginPath();
  ctx.arc(f.r * 0.7, -f.r * 0.3, f.r * 0.12, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // water gradient already from CSS, but we can add seabed
  ctx.fillStyle = "#002244";
  ctx.fillRect(0, lineTop, canvas.width, canvas.height - lineTop);

  // seabed
  ctx.fillStyle = "#553311";
  ctx.fillRect(0, maxDepth + 40, canvas.width, canvas.height - (maxDepth + 40));

  // line
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(hookX, 0);
  ctx.lineTo(hookX, hookY);
  ctx.stroke();

  // hook
  ctx.fillStyle = "#dddddd";
  ctx.fillRect(hookX - hookWidth / 2, hookY, hookWidth, hookHeight);
  ctx.beginPath();
  ctx.arc(hookX, hookY + hookHeight, hookWidth, 0, Math.PI);
  ctx.stroke();

  // fishes
  for (const f of fishes) {
    if (f.alive) drawFish(f);
  }

  // caught (draw attached above hook)
  let offset = 0;
  for (const f of caught) {
    ctx.save();
    ctx.translate(hookX, hookY + hookHeight + 10 + offset);
    drawFish({ ...f, x: 0, y: 0 });
    ctx.restore();
    offset += f.r * 2;
  }
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

loop();
