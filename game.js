let scene, camera, renderer;
let player, keys = {};
let velocity = new THREE.Vector3();
let dashCooldown = 0;
const projectiles = [];

init();
animate();

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050510);

  camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 10, 18);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Lights
  const hemi = new THREE.HemisphereLight(0x8888ff, 0x080808, 1.2);
  scene.add(hemi);
  const dir = new THREE.DirectionalLight(0xffffff, 0.8);
  dir.position.set(10, 20, 10);
  scene.add(dir);

  // Arena
  const floorGeo = new THREE.CircleGeometry(30, 64);
  const floorMat = new THREE.MeshPhongMaterial({
    color: 0x111122,
    emissive: 0x111133
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  // Player (simple capsule)
  const bodyGeo = new THREE.CapsuleGeometry(0.6, 1.6, 8, 16);
  const bodyMat = new THREE.MeshPhongMaterial({
    color: 0xffeeee,
    emissive: 0x331111
  });
  player = new THREE.Mesh(bodyGeo, bodyMat);
  player.position.set(0, 1.5, 0);
  scene.add(player);

  // Input
  window.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
  window.addEventListener("keyup",   e => keys[e.key.toLowerCase()] = false);

  window.addEventListener("resize", onResize);

  // Mouse click = cursed blast
  window.addEventListener("mousedown", shootCursedBlast);
}

function shootCursedBlast() {
  const projGeo = new THREE.SphereGeometry(0.3, 16, 16);
  const projMat = new THREE.MeshPhongMaterial({
    color: 0x66ccff,
    emissive: 0x2299ff
  });
  const proj = new THREE.Mesh(projGeo, projMat);

  const dir = new THREE.Vector3(0, 0, -1);
  dir.applyQuaternion(player.quaternion).normalize();

  proj.position.copy(player.position).add(new THREE.Vector3(0, 1, 0)).add(dir.clone().multiplyScalar(1.2));
  proj.userData = {
    dir,
    speed: 18,
    life: 2.0
  };

  scene.add(proj);
  projectiles.push(proj);
}

function updatePlayer(delta) {
  const move = new THREE.Vector3();
  const speed = 8;

  if (keys["w"]) move.z -= 1;
  if (keys["s"]) move.z += 1;
  if (keys["a"]) move.x -= 1;
  if (keys["d"]) move.x += 1;

  if (move.lengthSq() > 0) {
    move.normalize();
    // face movement direction
    const targetAngle = Math.atan2(move.x, move.z);
    player.rotation.y = targetAngle;
  }

  move.multiplyScalar(speed * delta);
  player.position.add(move);

  // Dash (space)
  dashCooldown -= delta;
  if (keys[" "] && dashCooldown <= 0) {
    const dashDir = new THREE.Vector3(0, 0, -1);
    dashDir.applyQuaternion(player.quaternion).normalize();
    player.position.add(dashDir.multiplyScalar(6));
    dashCooldown = 1.0;
  }

  // keep inside arena
  const r = Math.sqrt(player.position.x ** 2 + player.position.z ** 2);
  if (r > 28) {
    const factor = 28 / r;
    player.position.x *= factor;
    player.position.z *= factor;
  }

  // camera follow
  const camOffset = new THREE.Vector3(0, 10, 18);
  const targetCamPos = player.position.clone().add(camOffset);
  camera.position.lerp(targetCamPos, 0.08);
  camera.lookAt(player.position.x, player.position.y + 2, player.position.z);
}

function updateProjectiles(delta) {
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];
    p.position.add(p.userData.dir.clone().multiplyScalar(p.userData.speed * delta));
    p.userData.life -= delta;
    if (p.userData.life <= 0) {
      scene.remove(p);
      projectiles.splice(i, 1);
    }
  }
}

function animate() {
  requestAnimationFrame(animate);
  const delta = 0.016;

  updatePlayer(delta);
  updateProjectiles(delta);

  renderer.render(scene, camera);
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
