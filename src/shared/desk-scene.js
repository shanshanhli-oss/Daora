import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
export const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/**
 * The shared DAORA desk: renderer, camera orbit, warm lantern, round wooden
 * table with cloth and brass ring, drifting dust, a small tween engine, and
 * the resize/render loop. Domain pages (oracle cards, yi jing coins, compass)
 * add their own props on top via the returned handles.
 */
export function createDeskScene(container) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const speed = reducedMotion ? 0.35 : 1;

  // ---------- renderer / scene / camera ----------
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.06;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x100d10, 9, 20);

  const camera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 0.1, 60);
  camera.position.set(0, 4.6, 5.6);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0.05, 0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.enablePan = false;
  controls.rotateSpeed = 0.55;
  controls.minDistance = 3.1;
  controls.maxDistance = 9.5;
  controls.minPolarAngle = 0.42;
  controls.maxPolarAngle = 1.32;

  // ---------- lights ----------
  scene.add(new THREE.HemisphereLight(0x8a7a66, 0x141016, 0.55));

  const spot = new THREE.SpotLight(0xffd9a3, 165, 0, 0.62, 0.75, 2);
  spot.position.set(2.4, 5.4, 2.9);
  spot.castShadow = true;
  spot.shadow.mapSize.set(1024, 1024);
  spot.shadow.bias = -0.0004;
  spot.shadow.radius = 5;
  scene.add(spot);
  spot.target.position.set(0, 0, 0);
  scene.add(spot.target);

  const rim = new THREE.DirectionalLight(0x6a7a9a, 0.5);
  rim.position.set(-3.5, 4, -4);
  scene.add(rim);

  const lanternLight = new THREE.PointLight(0xe8a85c, 7, 7, 2);
  lanternLight.position.set(-2.6, 1.0, -1.5);
  scene.add(lanternLight);

  // ---------- desk set ----------
  const wood = new THREE.MeshStandardMaterial({ color: 0x2b1d1a, roughness: 0.62, metalness: 0.08 });
  const table = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.78, 0.24, 72), wood);
  table.position.y = -0.12;
  table.receiveShadow = true;
  scene.add(table);

  const cloth = new THREE.Mesh(
    new THREE.CircleGeometry(2.55, 72),
    new THREE.MeshStandardMaterial({ color: 0x241820, roughness: 0.96, metalness: 0 })
  );
  cloth.rotation.x = -Math.PI / 2;
  cloth.position.y = 0.004;
  cloth.receiveShadow = true;
  scene.add(cloth);

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(2.34, 2.4, 96),
    new THREE.MeshStandardMaterial({ color: 0xc7aa75, roughness: 0.35, metalness: 0.85 })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.008;
  scene.add(ring);

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(18, 48),
    new THREE.MeshStandardMaterial({ color: 0x100d10, roughness: 1 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.26;
  floor.receiveShadow = true;
  scene.add(floor);

  // lantern — the warm heart of the desk
  const lantern = new THREE.Group();
  const lanternMetal = new THREE.MeshStandardMaterial({ color: 0x4a3626, roughness: 0.45, metalness: 0.7 });
  const lanternGlass = new THREE.MeshStandardMaterial({
    color: 0x3a2412, emissive: 0xffb35c, emissiveIntensity: 1.7, roughness: 0.4,
  });
  const lBase = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.2, 0.05, 24), lanternMetal);
  lBase.position.y = 0.025;
  const lBody = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.36, 24), lanternGlass);
  lBody.position.y = 0.23;
  const lTop = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.12, 24), lanternMetal);
  lTop.position.y = 0.47;
  lantern.add(lBase, lBody, lTop);
  lantern.position.set(-2.6, 0, -1.5);
  lantern.traverse((m) => { m.castShadow = true; });
  scene.add(lantern);

  // drifting dust in the lamplight
  const dustCount = 140;
  const dustPos = new Float32Array(dustCount * 3);
  const dustSeed = [];
  for (let i = 0; i < dustCount; i++) {
    const r = Math.sqrt(Math.random()) * 3.6;
    const a = Math.random() * Math.PI * 2;
    dustPos[i * 3] = Math.cos(a) * r;
    dustPos[i * 3 + 1] = Math.random() * 2.8 + 0.15;
    dustPos[i * 3 + 2] = Math.sin(a) * r;
    dustSeed.push({ y: dustPos[i * 3 + 1], phase: Math.random() * Math.PI * 2, speed: 0.12 + Math.random() * 0.2 });
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({
    color: 0xd9c399, size: 0.02, transparent: true, opacity: 0.32,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  dust.raycast = () => {}; // atmosphere must never intercept picking
  scene.add(dust);

  // ---------- tween engine ----------
  const tweens = new Set();
  function tween({ duration = 600, delay = 0, ease = easeOutCubic, update, complete }) {
    return new Promise((resolve) => {
      tweens.add({ start: performance.now() + delay, duration: duration * speed, ease, update, complete, resolve });
    });
  }
  function stepTweens(now) {
    for (const tw of [...tweens]) {
      const raw = (now - tw.start) / tw.duration;
      if (raw < 0) continue;
      const t = Math.min(raw, 1);
      tw.update(tw.ease(t));
      if (t >= 1) {
        tweens.delete(tw);
        if (tw.complete) tw.complete();
        tw.resolve();
      }
    }
  }

  // ---------- picking helper ----------
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  function castAt(event, objects) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    return raycaster.intersectObjects(objects, true);
  }

  /** Tap = press & release within 9px and 450ms; anything longer is an orbit drag. */
  function onTap(handler) {
    let downInfo = null;
    renderer.domElement.addEventListener('pointerdown', (event) => {
      downInfo = { x: event.clientX, y: event.clientY, t: performance.now() };
    });
    renderer.domElement.addEventListener('pointerup', (event) => {
      if (!downInfo) return;
      const moved = Math.hypot(event.clientX - downInfo.x, event.clientY - downInfo.y);
      const elapsed = performance.now() - downInfo.t;
      downInfo = null;
      if (moved > 9 || elapsed > 450) return;
      handler(event);
    });
  }

  /** Project a world position to CSS pixels (smoke tests and tooltips). */
  function project(position) {
    const v = position.clone().project(camera);
    const rect = renderer.domElement.getBoundingClientRect();
    return { x: rect.left + (v.x * 0.5 + 0.5) * rect.width, y: rect.top + (-v.y * 0.5 + 0.5) * rect.height };
  }

  // ---------- resize / loop ----------
  const frameHooks = new Set();
  function onFrame(fn) { frameHooks.add(fn); return () => frameHooks.delete(fn); }

  function resize() {
    const w = container.clientWidth, h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }
  window.addEventListener('resize', resize);

  let raf = 0;
  const clock = new THREE.Clock();
  let ready = false;
  function loop() {
    raf = requestAnimationFrame(loop);
    const now = performance.now();
    stepTweens(now);
    const t = clock.getElapsedTime();
    const pos = dust.geometry.attributes.position;
    for (let i = 0; i < dustCount; i++) {
      const seed = dustSeed[i];
      pos.array[i * 3 + 1] = seed.y + Math.sin(t * seed.speed + seed.phase) * 0.28;
    }
    pos.needsUpdate = true;
    lanternLight.intensity = 7 + Math.sin(t * 2.3) * 0.5 + Math.sin(t * 5.1) * 0.25;
    lBody.material.emissiveIntensity = 1.7 + Math.sin(t * 2.3) * 0.12;
    frameHooks.forEach((fn) => fn(t));
    controls.update();
    renderer.render(scene, camera);
    if (!ready) {
      ready = true;
      window.__SCENE_READY__ = true;
    }
  }
  loop();

  return {
    scene, camera, renderer, controls, tween, castAt, onTap, project, onFrame, speed,
    dispose() {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      controls.dispose();
      renderer.dispose();
      container.removeChild(renderer.domElement);
    },
  };
}
