// --- CONFIGURATION ---
const CELL_SIZE = 20; // Size of one city block
const GRID_SIZE = 10; // 10x10 City
const CAR_SPEED = 0.5;
const TURN_SPEED = 0.04;

// --- GLOBALS ---
let scene, camera, renderer;
let taxi, passenger;
let buildings = [];
let speed = 0;
let angle = 0;
let score = 0;
let isCarryingPassenger = false;

// Input State
const keys = { w: false, a: false, s: false, d: false };

// 1. INITIALIZATION
function init() {
    // Scene Setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xaaccff); // Day sky
    scene.fog = new THREE.Fog(0xaaccff, 20, 100); // Distance fog for realism

    // Camera
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 15, -15); // Start above

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.body.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(50, 100, 50);
    dirLight.castShadow = true;
    dirLight.shadow.camera.left = -50;
    dirLight.shadow.camera.right = 50;
    dirLight.shadow.camera.top = 50;
    dirLight.shadow.camera.bottom = -50;
    scene.add(dirLight);

    createCity();
    createTaxi();
    spawnPassenger();
    
    // Event Listeners
    window.addEventListener('keydown', (e) => keyUpdate(e, true));
    window.addEventListener('keyup', (e) => keyUpdate(e, false));
    window.addEventListener('resize', onResize);

    animate();
}

// 2. CREATE THE CITY
function createCity() {
    // Floor (The Ground)
    const groundGeo = new THREE.PlaneGeometry(GRID_SIZE * CELL_SIZE * 2, GRID_SIZE * CELL_SIZE * 2);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x333333 }); // Dark asphalt
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Buildings
    const geometry = new THREE.BoxGeometry(10, 1, 10); // Base shape
    
    for (let x = -GRID_SIZE; x <= GRID_SIZE; x++) {
        for (let z = -GRID_SIZE; z <= GRID_SIZE; z++) {
            // Leave the center and some random paths open for roads
            if (Math.abs(x) < 2 && Math.abs(z) < 2) continue; // Town square
            if (Math.random() > 0.7) continue; // Random parking lots/parks

            const height = Math.random() * 30 + 10;
            const buildingMat = new THREE.MeshPhongMaterial({ 
                color: Math.random() * 0xffffff,
                flatShading: true
            });
            
            const building = new THREE.Mesh(geometry, buildingMat);
            building.position.set(x * CELL_SIZE, height / 2, z * CELL_SIZE);
            building.scale.y = height;
            building.castShadow = true;
            building.receiveShadow = true;
            
            scene.add(building);
            buildings.push(building); // Store for collision later (optional)
        }
    }
}

// 3. CREATE THE TAXI
function createTaxi() {
    taxi = new THREE.Group();

    // Car Body
    const body = new THREE.Mesh(
        new THREE.BoxGeometry(2.2, 1, 4.5),
        new THREE.MeshPhongMaterial({ color: 0xf1c40f }) // Taxi Yellow
    );
    body.position.y = 0.7;
    body.castShadow = true;
    taxi.add(body);

    // Car Roof / Windows
    const top = new THREE.Mesh(
        new THREE.BoxGeometry(1.8, 0.8, 2.5),
        new THREE.MeshPhongMaterial({ color: 0x111111 }) // Dark windows
    );
    top.position.y = 1.5;
    taxi.add(top);

    // Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 12);
    const wheelMat = new THREE.MeshLambertMaterial({ color: 0x000000 });
    
    const w1 = new THREE.Mesh(wheelGeo, wheelMat); w1.rotation.z = Math.PI/2; w1.position.set(1.1, 0.4, 1.5);
    const w2 = new THREE.Mesh(wheelGeo, wheelMat); w2.rotation.z = Math.PI/2; w2.position.set(-1.1, 0.4, 1.5);
    const w3 = new THREE.Mesh(wheelGeo, wheelMat); w3.rotation.z = Math.PI/2; w3.position.set(1.1, 0.4, -1.5);
    const w4 = new THREE.Mesh(wheelGeo, wheelMat); w4.rotation.z = Math.PI/2; w4.position.set(-1.1, 0.4, -1.5);
    
    taxi.add(w1, w2, w3, w4);

    scene.add(taxi);
}

// 4. PASSENGER SYSTEM
function spawnPassenger() {
    if (passenger) scene.remove(passenger);

    // Create a glowing marker
    const geometry = new THREE.CylinderGeometry(1, 1, 10, 16);
    const color = isCarryingPassenger ? 0xff0000 : 0x00ff00; // Green = Pickup, Red = Dropoff
    const material = new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.6 });
    passenger = new THREE.Mesh(geometry, material);

    // Random position on the grid
    const px = Math.floor((Math.random() * GRID_SIZE * 2) - GRID_SIZE) * CELL_SIZE;
    const pz = Math.floor((Math.random() * GRID_SIZE * 2) - GRID_SIZE) * CELL_SIZE;
    
    passenger.position.set(px, 5, pz);
    scene.add(passenger);

    // Update UI text
    const uiText = document.getElementById('mission');
    uiText.innerText = isCarryingPassenger ? "Drive to the RED ZONE!" : "Pick up the PASSENGER (Green)!";
    uiText.style.color = isCarryingPassenger ? "#ff6b6b" : "#00ffcc";
}

// 5. INPUT HANDLING
function keyUpdate(e, state) {
    const key = e.key.toLowerCase();
    if (keys.hasOwnProperty(key)) keys[key] = state;
    if (e.key === "ArrowUp") keys.w = state;
    if (e.key === "ArrowDown") keys.s = state;
    if (e.key === "ArrowLeft") keys.a = state;
    if (e.key === "ArrowRight") keys.d = state;
}

// 6. GAME LOOP
function animate() {
    requestAnimationFrame(animate);

    // --- CAR PHYSICS ---
    if (keys.w) speed += 0.02;
    if (keys.s) speed -= 0.02;
    
    // Friction
    speed *= 0.96; 

    // Steering (only if moving)
    if (Math.abs(speed) > 0.01) {
        if (keys.a) angle += TURN_SPEED * Math.sign(speed);
        if (keys.d) angle -= TURN_SPEED * Math.sign(speed);
    }

    // Apply movement
    taxi.rotation.y = angle;
    taxi.position.x += Math.sin(angle) * speed;
    taxi.position.z += Math.cos(angle) * speed;

    // --- CAMERA FOLLOW ---
    // Camera floats behind and above the car
    const relativeCameraOffset = new THREE.Vector3(0, 10, -15);
    const cameraOffset = relativeCameraOffset.applyMatrix4(taxi.matrixWorld);
    
    // Smooth camera movement (Lerp)
    camera.position.lerp(cameraOffset, 0.1);
    camera.lookAt(taxi.position);

    // --- GAMEPLAY LOGIC ---
    // Check distance to passenger
    const dist = taxi.position.distanceTo(passenger.position);
    
    // Spin the passenger marker
    passenger.rotation.y += 0.05;
    passenger.position.y = 2 + Math.sin(Date.now() * 0.005);

    if (dist < 4) {
        if (!isCarryingPassenger) {
            // Picked up!
            isCarryingPassenger = true;
            spawnPassenger(); // Creates dropoff point
        } else {
            // Dropped off!
            score += 100;
            document.getElementById('score').innerText = score;
            isCarryingPassenger = false;
            spawnPassenger(); // Create new pickup
        }
    }

    renderer.render(scene, camera);
}

function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Start
init();
