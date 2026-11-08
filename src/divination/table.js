import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { drawCardBack, drawCardFace } from './textures.js';

const CARD_W = 0.78;
const CARD_H = 1.32;
const CARD_R = 0.06;
const CARD_T = 0.016;
const DECK_POS = new THREE.Vector3(1.85, 0.02, -0.55);
const SPREAD = [
  { x: -0.95, z: 0.18, rz: -0.09 },
  { x: 0, z: 0.26, rz: 0 },
  { x: 0.95, z: 0.18, rz: 0.09 },
];

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function roundedRectShape(w, h, r) {
  const s = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

export function createOracleTable(container, { audio, onPick, getLang }) {
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
  scene.add(dust);

  // ---------- card factory ----------
  const cardShape = roundedRectShape(CARD_W, CARD_H, CARD_R);
  const coreGeo = new THREE.ExtrudeGeometry(cardShape, { depth: CARD_T, bevelEnabled: false });
  coreGeo.translate(0, 0, -CARD_T / 2);
  const plateGeo = new THREE.ShapeGeometry(cardShape, 24);
  // ShapeGeometry leaves UVs in raw shape units — remap them onto the texture's 0–1 space
  {
    const pos = plateGeo.attributes.position;
    const uv = plateGeo.attributes.uv;
    for (let i = 0; i < uv.count; i++) {
      uv.setXY(i, (pos.getX(i) + CARD_W / 2) / CARD_W, (pos.getY(i) + CARD_H / 2) / CARD_H);
    }
    uv.needsUpdate = true;
  }
  const coreMat = new THREE.MeshStandardMaterial({ color: 0x3a2c24, roughness: 0.5, metalness: 0.25 });

  const backTexture = new THREE.CanvasTexture(drawCardBack());
  backTexture.colorSpace = THREE.SRGBColorSpace;
  backTexture.anisotropy = 8;

  function faceTexture(cardData, lang) {
    const tex = new THREE.CanvasTexture(drawCardFace(cardData, lang));
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    return tex;
  }

  function buildCard(cardData) {
    const root = new THREE.Group();      // sits on the table, rotation.x lays the card flat
    root.rotation.x = -Math.PI / 2;
    const flipper = new THREE.Group();   // rotation.y turns the card over
    root.add(flipper);

    const core = new THREE.Mesh(coreGeo, coreMat);
    core.castShadow = true;
    core.receiveShadow = true;
    flipper.add(core);

    const back = new THREE.Mesh(plateGeo, new THREE.MeshStandardMaterial({
      map: backTexture, roughness: 0.55, metalness: 0.12,
    }));
    back.position.z = CARD_T / 2 + 0.0012;
    flipper.add(back);

    const front = new THREE.Mesh(plateGeo, new THREE.MeshStandardMaterial({
      map: faceTexture(cardData, getLang()), roughness: 0.6, metalness: 0.05,
    }));
    front.position.z = -CARD_T / 2 - 0.0012;
    front.rotation.y = Math.PI;
    flipper.add(front);

    root.userData = { card: cardData, flipper, front, flipped: false, busy: false, home: null };
    scene.add(root);
    return root;
  }

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

  // ---------- deck ----------
  const deckCards = [];
  const deck = new THREE.Group();
  deck.position.copy(DECK_POS);
  scene.add(deck);
  for (let i = 0; i < 12; i++) {
    const layer = new THREE.Mesh(coreGeo, coreMat);
    layer.castShadow = true;
    const top = new THREE.Mesh(plateGeo, new THREE.MeshStandardMaterial({ map: backTexture, roughness: 0.55 }));
    top.position.z = CARD_T / 2 + 0.0012;
    const holder = new THREE.Group();
    holder.add(layer, top);
    holder.rotation.x = -Math.PI / 2;
    holder.rotation.z = (Math.random() - 0.5) * 0.14;
    holder.position.y = i * (CARD_T + 0.002);
    deck.add(holder);
    deckCards.push(holder);
  }

  // ---------- table state ----------
  let slots = [];        // the three card roots on the cloth
  let dealing = false;

  function setFaceTexture(root) {
    const { card, front } = root.userData;
    const old = front.material.map;
    front.material.map = faceTexture(card, getLang());
    front.material.needsUpdate = true;
    if (old) old.dispose();
  }

  /** Deal three fresh cards onto the cloth. */
  async function deal(cards) {
    dealing = true;
    slots.forEach((root) => scene.remove(root));
    slots = cards.map((data, i) => {
      const root = buildCard(data);
      root.position.set(DECK_POS.x, 0.02 + i * 0.004, DECK_POS.z);
      root.rotation.z = (Math.random() - 0.5) * 0.2;
      return root;
    });

    await Promise.all(slots.map((root, i) => {
      const target = SPREAD[i];
      const from = root.position.clone();
      const to = new THREE.Vector3(target.x, 0.02, target.z);
      const rzFrom = root.rotation.z;
      audio.slide();
      return tween({
        duration: 620,
        delay: i * 130,
        update: (t) => {
          root.position.lerpVectors(from, to, t);
          root.position.y = from.y + (to.y - from.y) * t + Math.sin(t * Math.PI) * 0.5;
          root.rotation.z = rzFrom + (target.rz - rzFrom) * t;
        },
        complete: () => {
          root.userData.home = to.clone();
          audio.tap();
        },
      });
    }));
    dealing = false;
  }

  /** Flip one card over (or back), lifting it toward the viewer. */
  async function flip(root) {
    const state = root.userData;
    if (state.busy || dealing) return;
    state.busy = true;
    state.flipped = !state.flipped;
    audio.flip();

    const flipper = state.flipper;
    const rotFrom = flipper.rotation.y;
    const rotTo = state.flipped ? Math.PI : 0;
    const posFrom = root.position.clone();
    const home = state.home || posFrom;
    const lift = 0.32;
    const restY = state.flipped ? 0.3 : home.y;   // a tilted card's lower edge needs clearance
    const tiltFrom = root.rotation.x;
    const tiltTo = state.flipped ? -Math.PI / 2 + 0.42 : -Math.PI / 2;
    const targetZ = state.flipped ? home.z + 0.55 : home.z;
    const targetX = state.flipped ? home.x * 0.32 : home.x;   // drawn cards come forward and toward center

    await tween({
      duration: 880,
      ease: easeInOutCubic,
      update: (t) => {
        flipper.rotation.y = rotFrom + (rotTo - rotFrom) * t;
        root.position.y = posFrom.y + (restY - posFrom.y) * t + Math.sin(t * Math.PI) * lift;
        root.position.x = posFrom.x + (targetX - posFrom.x) * t;
        root.position.z = posFrom.z + (targetZ - posFrom.z) * t;
        root.rotation.x = tiltFrom + (tiltTo - tiltFrom) * t;
      },
      complete: () => {
        root.position.y = restY;
        audio.tap();
      },
    });
    state.busy = false;
    if (onPick) onPick(state.card, state.flipped);
  }

  /** Gather the spread, shuffle, and deal a fresh trio. */
  async function newDraw(cards) {
    if (dealing) return;
    dealing = true;

    // flip any open cards back, then glide everything home
    await Promise.all(slots.map(async (root, i) => {
      const state = root.userData;
      const rotFrom = state.flipper.rotation.y;
      const from = root.position.clone();
      const tiltFrom = root.rotation.x;
      const rzFrom = root.rotation.z;
      audio.slide();
      await tween({
        duration: 520,
        delay: i * 80,
        ease: easeInOutCubic,
        update: (t) => {
          state.flipper.rotation.y = rotFrom * (1 - t);
          root.position.lerpVectors(from, DECK_POS, t);
          root.position.y = from.y + (0.02 - from.y) * t + Math.sin(t * Math.PI) * 0.42;
          root.rotation.x = tiltFrom + (-Math.PI / 2 - tiltFrom) * t;
          root.rotation.z = rzFrom * (1 - t);
          state.flipped = false;
        },
      });
    }));

    // shuffle: the deck shivers
    audio.shuffle();
    const deckFrom = deck.rotation.y;
    await tween({
      duration: 460,
      update: (t) => {
        deck.rotation.y = deckFrom + Math.sin(t * Math.PI * 6) * 0.08 * (1 - t);
        deck.position.y = DECK_POS.y + Math.sin(t * Math.PI) * 0.05;
      },
      complete: () => { deck.rotation.y = deckFrom; deck.position.y = DECK_POS.y; },
    });

    // retire the old cards and deal the new trio
    slots.forEach((root) => {
      scene.remove(root);
      root.userData.front.material.map.dispose();
      root.userData.front.material.dispose();
    });
    slots = [];
    dealing = false;
    await deal(cards);
    if (onPick) onPick(null, false);
  }

  /** Re-render faces after a language switch. */
  function setLanguage() {
    slots.forEach((root) => setFaceTexture(root));
    if (onPick) {
      const open = slots.find((r) => r.userData.flipped);
      onPick(open ? open.userData.card : null, !!open);
    }
  }

  // ---------- picking ----------
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let downInfo = null;
  let hovered = null;

  function castCards(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(slots, true);
    if (!hits.length) return null;
    let node = hits[0].object;
    while (node && !node.userData.card) node = node.parent;
    return node;
  }

  renderer.domElement.addEventListener('pointerdown', (event) => {
    downInfo = { x: event.clientX, y: event.clientY, t: performance.now() };
  });
  renderer.domElement.addEventListener('pointerup', (event) => {
    if (!downInfo) return;
    const moved = Math.hypot(event.clientX - downInfo.x, event.clientY - downInfo.y);
    const elapsed = performance.now() - downInfo.t;
    downInfo = null;
    if (moved > 9 || elapsed > 450) return;   // it was a drag, not a tap
    const root = castCards(event);
    if (root) flip(root);
  });
  renderer.domElement.addEventListener('pointermove', (event) => {
    if (event.pointerType !== 'mouse') return;
    const root = castCards(event);
    if (root !== hovered) {
      if (hovered && !hovered.userData.flipped && !hovered.userData.busy) {
        const h = hovered;
        tween({ duration: 200, update: (t) => { h.position.y = 0.02 + 0.05 * (1 - t); } });
      }
      hovered = root;
      if (hovered && !hovered.userData.flipped && !hovered.userData.busy && !dealing) {
        const h = hovered;
        tween({ duration: 200, update: (t) => { h.position.y = 0.02 + 0.05 * t; } });
      }
      renderer.domElement.style.cursor = hovered ? 'pointer' : 'grab';
    }
  });

  // ---------- resize / loop ----------
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
    controls.update();
    renderer.render(scene, camera);
    if (!ready) {
      ready = true;
      window.__SCENE_READY__ = true;
    }
  }
  loop();

  // hooks used by the smoke tests and by future in-app shortcuts
  function flipSlot(i) { if (slots[i]) flip(slots[i]); }
  function projectSlot(i) {
    const root = slots[i];
    if (!root) return null;
    const v = root.position.clone();
    v.project(camera);
    const rect = renderer.domElement.getBoundingClientRect();
    return { x: rect.left + (v.x * 0.5 + 0.5) * rect.width, y: rect.top + (-v.y * 0.5 + 0.5) * rect.height };
  }

  return {
    deal, flip, newDraw, setLanguage, flipSlot, projectSlot,
    get busy() { return dealing; },
    dispose() {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      controls.dispose();
      renderer.dispose();
      container.removeChild(renderer.domElement);
    },
  };
}
