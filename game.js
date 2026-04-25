// Lost in Space — Three.js 3D game

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x000008, 0.0015);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ── Lights ────────────────────────────────────────────────────────────────────
const ambient = new THREE.AmbientLight(0x111133, 1.2);
scene.add(ambient);

const sun = new THREE.PointLight(0xffeedd, 2.5, 800);
sun.position.set(200, 100, -300);
scene.add(sun);

const alienGlow = new THREE.PointLight(0x00ffaa, 3, 60);
scene.add(alienGlow); // positioned later with the alien

// ── Stars ─────────────────────────────────────────────────────────────────────
function makeStars() {
  const geo = new THREE.BufferGeometry();
  const N = 8000;
  const pos = new Float32Array(N * 3);
  for (let i = 0; i < N * 3; i++) pos[i] = (Math.random() - 0.5) * 1800;
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.6, sizeAttenuation: true });
  return new THREE.Points(geo, mat);
}
scene.add(makeStars());

// ── Nebula clouds (sprite-like planes) ───────────────────────────────────────
function makeNebula() {
  const group = new THREE.Group();
  const colors = [0x2200aa, 0x880044, 0x004488, 0x116622];
  for (let i = 0; i < 12; i++) {
    const geo = new THREE.PlaneGeometry(80 + Math.random() * 120, 60 + Math.random() * 100);
    const mat = new THREE.MeshBasicMaterial({
      color: colors[i % colors.length],
      transparent: true,
      opacity: 0.04 + Math.random() * 0.06,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(
      (Math.random() - 0.5) * 600,
      (Math.random() - 0.5) * 400,
      (Math.random() - 0.5) * 600
    );
    mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
    group.add(mesh);
  }
  return group;
}
scene.add(makeNebula());

// ── Distant planets ───────────────────────────────────────────────────────────
function makePlanet(r, color, x, y, z, ring) {
  const geo = new THREE.SphereGeometry(r, 32, 32);
  const mat = new THREE.MeshPhongMaterial({ color, shininess: 10 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, y, z);
  scene.add(mesh);
  if (ring) {
    const rg = new THREE.TorusGeometry(r * 1.6, r * 0.25, 8, 60);
    const rm = new THREE.MeshPhongMaterial({ color: 0xddbb88, transparent: true, opacity: 0.5, side: THREE.DoubleSide });
    const r2 = new THREE.Mesh(rg, rm);
    r2.rotation.x = Math.PI / 3;
    mesh.add(r2);
  }
  return mesh;
}
const planet1 = makePlanet(30, 0x3366cc, -250, -60, -400, false);
const planet2 = makePlanet(50, 0xcc8833, 350, 80, -500, true);
const planet3 = makePlanet(18, 0x228855, 100, -120, -300, false);

// ── Asteroids ─────────────────────────────────────────────────────────────────
const asteroids = [];
function makeAsteroids() {
  for (let i = 0; i < 40; i++) {
    const r = 1.5 + Math.random() * 4;
    const geo = new THREE.DodecahedronGeometry(r, 0);
    const mat = new THREE.MeshPhongMaterial({ color: 0x554433, shininess: 5 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(
      (Math.random() - 0.5) * 300,
      (Math.random() - 0.5) * 200,
      (Math.random() - 0.5) * 300
    );
    mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    mesh.userData.spin = new THREE.Vector3(
      (Math.random() - 0.5) * 0.01,
      (Math.random() - 0.5) * 0.01,
      (Math.random() - 0.5) * 0.01
    );
    mesh.userData.radius = r;
    scene.add(mesh);
    asteroids.push(mesh);
  }
}
makeAsteroids();

// ── Player ship ───────────────────────────────────────────────────────────────
const shipGroup = new THREE.Group();
scene.add(shipGroup);

// Body
const bodyGeo = new THREE.ConeGeometry(0.8, 3.5, 8);
const bodyMat = new THREE.MeshPhongMaterial({ color: 0xaabbcc, shininess: 80 });
const body = new THREE.Mesh(bodyGeo, bodyMat);
body.rotation.x = Math.PI / 2;
shipGroup.add(body);

// Wings
function makeWing(flip) {
  const geo = new THREE.BufferGeometry();
  const v = new Float32Array([
    0, 0, 0,
    flip * 3, 0, 0.5,
    flip * 2, 0, -1.5,
  ]);
  geo.setAttribute('position', new THREE.BufferAttribute(v, 3));
  geo.setIndex([0, 1, 2]);
  geo.computeVertexNormals();
  const mat = new THREE.MeshPhongMaterial({ color: 0x8899aa, side: THREE.DoubleSide, shininess: 60 });
  return new THREE.Mesh(geo, mat);
}
shipGroup.add(makeWing(1));
shipGroup.add(makeWing(-1));

// Cockpit
const cockGeo = new THREE.SphereGeometry(0.5, 12, 12);
const cockMat = new THREE.MeshPhongMaterial({ color: 0x88ccff, transparent: true, opacity: 0.7, shininess: 120 });
const cockpit = new THREE.Mesh(cockGeo, cockMat);
cockpit.position.set(0, 0.3, 0.8);
shipGroup.add(cockpit);

// Engine glow
const engGeo = new THREE.CylinderGeometry(0.3, 0.5, 0.4, 12);
const engMat = new THREE.MeshBasicMaterial({ color: 0xff6622 });
const engine = new THREE.Mesh(engGeo, engMat);
engine.position.set(0, 0, -2.2);
engine.rotation.x = Math.PI / 2;
shipGroup.add(engine);

const thrustLight = new THREE.PointLight(0xff4400, 2, 8);
thrustLight.position.set(0, 0, -2.5);
shipGroup.add(thrustLight);

shipGroup.position.set(0, 0, 0);

// Camera sits behind and above the ship
const cameraOffset = new THREE.Vector3(0, 2.5, 10);

// ── Alien life form ───────────────────────────────────────────────────────────
const alienGroup = new THREE.Group();

// Core orb
const orbGeo = new THREE.SphereGeometry(2.5, 32, 32);
const orbMat = new THREE.MeshPhongMaterial({
  color: 0x00ffaa,
  emissive: 0x004422,
  shininess: 100,
  transparent: true,
  opacity: 0.85,
});
const orb = new THREE.Mesh(orbGeo, orbMat);
alienGroup.add(orb);

// Tentacles
for (let i = 0; i < 8; i++) {
  const angle = (i / 8) * Math.PI * 2;
  const tentGeo = new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(Math.cos(angle) * 2, -1.5 - Math.random(), Math.sin(angle) * 2),
      new THREE.Vector3(Math.cos(angle) * 3.5, -3 - Math.random() * 2, Math.sin(angle) * 3.5),
    ]),
    12, 0.18, 5
  );
  const tentMat = new THREE.MeshPhongMaterial({ color: 0x00cc88, emissive: 0x003311, shininess: 60 });
  const tent = new THREE.Mesh(tentGeo, tentMat);
  alienGroup.add(tent);
}

// Outer shell rings
for (let i = 0; i < 3; i++) {
  const rg = new THREE.TorusGeometry(3.2 + i * 0.5, 0.12, 8, 40);
  const rm = new THREE.MeshBasicMaterial({ color: 0x44ffcc });
  const ring = new THREE.Mesh(rg, rm);
  ring.rotation.x = (i * Math.PI) / 3;
  ring.userData.spinSpeed = 0.005 + i * 0.003;
  alienGroup.add(ring);
}

// Place alien far away
const ALIEN_POS = new THREE.Vector3(120, 30, -200);
alienGroup.position.copy(ALIEN_POS);
alienGlow.position.copy(ALIEN_POS);
scene.add(alienGroup);

// ── Signal particles (trail toward alien) ────────────────────────────────────
const signalGeo = new THREE.BufferGeometry();
const SIGNAL_COUNT = 60;
const sigPos = new Float32Array(SIGNAL_COUNT * 3);
for (let i = 0; i < SIGNAL_COUNT; i++) {
  const t = i / SIGNAL_COUNT;
  const p = new THREE.Vector3().lerpVectors(new THREE.Vector3(0, 0, 0), ALIEN_POS, t);
  p.x += (Math.random() - 0.5) * 15;
  p.y += (Math.random() - 0.5) * 15;
  p.z += (Math.random() - 0.5) * 15;
  sigPos[i * 3]     = p.x;
  sigPos[i * 3 + 1] = p.y;
  sigPos[i * 3 + 2] = p.z;
}
signalGeo.setAttribute('position', new THREE.BufferAttribute(sigPos, 3));
const signalMat = new THREE.PointsMaterial({ color: 0x00ffaa, size: 0.5, sizeAttenuation: true, transparent: true, opacity: 0.5 });
const signalParticles = new THREE.Points(signalGeo, signalMat);
scene.add(signalParticles);

// ── Game state ────────────────────────────────────────────────────────────────
const keys = {};
let gameRunning = false;
let oxygen = 1.0; // 0–1
const OXYGEN_DRAIN = 0.000035;
const SPEED = 0.25;
const BOOST = 0.55;

// Mouse look
let yaw = 0;
let pitch = 0;
const shipQuat = new THREE.Quaternion();
let mouseLocked = false;

document.addEventListener('pointerlockchange', () => {
  mouseLocked = document.pointerLockElement === renderer.domElement;
});

function requestLock() {
  const p = renderer.domElement.requestPointerLock();
  if (p && p.catch) p.catch(() => {});
}

renderer.domElement.addEventListener('click', () => {
  if (gameRunning && !mouseLocked) requestLock();
});

document.addEventListener('mousemove', e => {
  if (!gameRunning) return;
  if (mouseLocked) {
    yaw   -= e.movementX * 0.002;
    pitch -= e.movementY * 0.002;
  } else {
    // Fallback: mouse offset from screen centre steers the ship
    const dx = e.clientX - window.innerWidth  / 2;
    const dy = e.clientY - window.innerHeight / 2;
    yaw   = -dx / window.innerWidth  * Math.PI;
    pitch = -dy / window.innerHeight * Math.PI * 0.6;
  }
  pitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, pitch));
});

document.addEventListener('keydown', e => { keys[e.code] = true; });
document.addEventListener('keyup',   e => { keys[e.code] = false; });

// ── Story messages ────────────────────────────────────────────────────────────
const storyEl = document.getElementById('story');
const storyMessages = [
  { dist: 999, text: 'Day 47. Systems failing. Oxygen reserves at 100%. You have to find that signal...' },
  { dist: 200,  text: 'The signal is getting stronger. Keep going.' },
  { dist: 100,  text: 'You can almost see it — something luminous in the dark.' },
  { dist: 50,   text: "It's alive! Something beautiful and alien. It's waiting for you." },
  { dist: 20,   text: 'Reach it. REACH IT.' },
];
let lastStoryIndex = -1;

function updateStory(dist) {
  for (let i = storyMessages.length - 1; i >= 0; i--) {
    if (dist <= storyMessages[i].dist && i > lastStoryIndex) {
      storyEl.textContent = storyMessages[i].text;
      lastStoryIndex = i;
      break;
    }
  }
}

// ── Win / dead screens ────────────────────────────────────────────────────────
function triggerWin() {
  gameRunning = false;
  document.exitPointerLock();
  const el = document.getElementById('win-overlay');
  document.getElementById('win-text').innerHTML =
    `The creature pulses with warm light, wrapping your ship in a strange energy field.<br><br>
     It guides your battered vessel through a fold in space — and suddenly, there it is.<br><br>
     <strong>Earth.</strong> Blue and perfect against the black.<br><br>
     You're going home.`;
  el.style.display = 'flex';
}

function triggerDead() {
  gameRunning = false;
  document.exitPointerLock();
  document.getElementById('dead-overlay').style.display = 'flex';
}

// ── Start ─────────────────────────────────────────────────────────────────────
document.getElementById('start-btn').addEventListener('click', () => {
  document.getElementById('overlay').style.display = 'none';
  gameRunning = true;
  storyEl.textContent = storyMessages[0].text;
  lastStoryIndex = 0;
  requestLock();
});

// ── Main loop ─────────────────────────────────────────────────────────────────
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();

  if (!gameRunning) { renderer.render(scene, camera); return; }

  // ── Orientation from yaw/pitch ──────────────────────────────────────────────
  const qYaw   = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
  const qPitch = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), pitch);

  // Roll with Q/E
  if (keys['KeyQ']) yaw += 0.015;
  if (keys['KeyE']) yaw -= 0.015;

  shipQuat.copy(qYaw).multiply(qPitch);
  shipGroup.quaternion.copy(shipQuat);

  // ── Movement ────────────────────────────────────────────────────────────────
  const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(shipQuat);
  const right   = new THREE.Vector3(1, 0, 0).applyQuaternion(shipQuat);
  const up      = new THREE.Vector3(0, 1, 0).applyQuaternion(shipQuat);

  const boost = keys['ShiftLeft'] || keys['ShiftRight'];
  const spd = boost ? BOOST : SPEED;
  let moving = false;

  if (keys['KeyW'] || keys['ArrowUp'])    { shipGroup.position.addScaledVector(forward, spd); moving = true; }
  if (keys['KeyS'] || keys['ArrowDown'])  { shipGroup.position.addScaledVector(forward, -spd * 0.6); moving = true; }
  if (keys['KeyA'] || keys['ArrowLeft'])  { shipGroup.position.addScaledVector(right, -spd * 0.7); moving = true; }
  if (keys['KeyD'] || keys['ArrowRight']) { shipGroup.position.addScaledVector(right, spd * 0.7); moving = true; }

  // Engine glow
  thrustLight.intensity = moving ? (boost ? 4 : 2) : 0.3;
  engMat.color.setHex(moving ? (boost ? 0xff9900 : 0xff6622) : 0x441100);

  // ── Camera follows ship ─────────────────────────────────────────────────────
  const camTarget = shipGroup.position.clone()
    .add(cameraOffset.clone().applyQuaternion(shipQuat));
  camera.position.lerp(camTarget, 0.12);
  camera.quaternion.copy(shipQuat);

  // ── Asteroid rotation ───────────────────────────────────────────────────────
  for (const ast of asteroids) {
    ast.rotation.x += ast.userData.spin.x;
    ast.rotation.y += ast.userData.spin.y;
    ast.rotation.z += ast.userData.spin.z;

    // Collision
    const d = ast.position.distanceTo(shipGroup.position);
    if (d < ast.userData.radius + 1.2) {
      // Bounce back
      const bounce = shipGroup.position.clone().sub(ast.position).normalize();
      shipGroup.position.addScaledVector(bounce, 2);
      oxygen -= 0.05; // penalty
    }
  }

  // ── Alien animation ─────────────────────────────────────────────────────────
  const t = clock.getElapsedTime();
  alienGroup.rotation.y += 0.004;
  orb.material.emissiveIntensity = 0.5 + 0.4 * Math.sin(t * 1.8);
  alienGroup.position.y = ALIEN_POS.y + Math.sin(t * 0.6) * 3;
  alienGlow.position.copy(alienGroup.position);
  alienGlow.intensity = 2 + 1.5 * Math.sin(t * 2);

  // Ring spin
  alienGroup.children.forEach(c => {
    if (c.userData.spinSpeed) c.rotation.z += c.userData.spinSpeed;
  });

  // Signal particles pulse
  signalMat.opacity = 0.3 + 0.3 * Math.sin(t * 3);

  // ── Planet slow rotation ────────────────────────────────────────────────────
  planet1.rotation.y += 0.0003;
  planet2.rotation.y += 0.0002;
  planet3.rotation.y += 0.0005;

  // ── Oxygen drain ───────────────────────────────────────────────────────────
  oxygen -= OXYGEN_DRAIN;
  oxygen = Math.max(0, oxygen);
  document.getElementById('oxygen-bar').style.width = (oxygen * 100) + '%';
  const oxyCol = oxygen > 0.4 ? '#4f8' : oxygen > 0.2 ? '#ff8' : '#f44';
  document.getElementById('oxygen-bar').style.background = `linear-gradient(90deg, ${oxyCol}, #0ff)`;

  // ── Distance to alien ──────────────────────────────────────────────────────
  const dist = shipGroup.position.distanceTo(alienGroup.position);
  document.getElementById('distance-hud').innerHTML =
    `Signal Distance: <strong>${Math.round(dist)} units</strong><br>` +
    `<span style="color:#88f">↑ Follow the green particles</span>`;

  updateStory(dist);

  // ── Win condition ───────────────────────────────────────────────────────────
  if (dist < 8) triggerWin();

  // ── Dead condition ──────────────────────────────────────────────────────────
  if (oxygen <= 0) triggerDead();

  renderer.render(scene, camera);
}

animate();
