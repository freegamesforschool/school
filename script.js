const world = document.getElementById("world");
const taxi = document.getElementById("taxi");

let x = 1000;
let y = 1000;
let angle = 0;

const speed = 5;
const turnSpeed = 4;

const keys = {};

document.addEventListener("keydown", e => keys[e.key] = true);
document.addEventListener("keyup", e => keys[e.key] = false);

function gameLoop() {

    // Turning
    if (keys["ArrowLeft"]) angle -= turnSpeed;
    if (keys["ArrowRight"]) angle += turnSpeed;

    // Forward/backward
    if (keys["ArrowUp"]) {
        x += Math.sin(angle * Math.PI / 180) * speed;
        y -= Math.cos(angle * Math.PI / 180) * speed;
    }
    if (keys["ArrowDown"]) {
        x -= Math.sin(angle * Math.PI / 180) * speed;
        y += Math.cos(angle * Math.PI / 180) * speed;
    }

    // Move taxi
    taxi.style.left = x + "px";
    taxi.style.top = y + "px";
    taxi.style.transform = `translateZ(20px) rotateZ(${angle}deg)`;

    // Fake follow camera by rotating the world
    world.style.transform =
        `translate(-50%, -50%) rotateX(60deg) rotateZ(${-angle}deg) translate(${-x}px, ${-y}px)`;

    requestAnimationFrame(gameLoop);
}

gameLoop();
