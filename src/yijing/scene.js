import * as THREE from 'three';
import { createDeskScene, easeOutCubic, easeInOutCubic } from '../shared/desk-scene.js';
import { drawCoinFace, drawCupSide, drawStick } from './textures.js';

const COIN_R = 0.17;
const COIN_T = 0.024;

// where the coins rest before the first toss
const COIN_HOME = [
  { x: -0.1, z: 0.16, ry: 0.3 },
  { x: 0.09, z: 0.26, ry: 2.2 },
  { x: 0.02, z: 0.02, ry: 4.1 },
];
// where they land after a toss — three loose slots in front of the caster
const COIN_SLOTS = [
  { x: -0.52, z: 0.1 },
  { x: -0.02, z: 0.46 },
  { x: 0.5, z: 0.14 },
];

const CUP_POS = new THREE.Vector3(0, 0, -0.05);
const STICK_COUNT = 10;

export function createYiTable(container, { audio, onCoinsTap, onCupTap }) {
  const desk = createDeskScene(container);
  const { scene, tween } = desk;

  // ---------- coins ----------
  const coinSideMat = new THREE.MeshStandardMaterial({ color: 0x9a7443, roughness: 0.38, metalness: 0.9 });
  const faceTex = new THREE.CanvasTexture(drawCoinFace('face'));
  const backTex = new THREE.CanvasTexture(drawCoinFace('back'));
  [faceTex, backTex].forEach((t) => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; });
  const coinFaceMat = new THREE.MeshStandardMaterial({ map: faceTex, roughness: 0.42, metalness: 0.75 });
  const coinBackMat = new THREE.MeshStandardMaterial({ map: backTex, roughness: 0.42, metalness: 0.75 });
  const coinGeo = new THREE.CylinderGeometry(COIN_R, COIN_R, COIN_T, 48);

  const coinsGroup = new THREE.Group();
  scene.add(coinsGroup);
  const coins = [];
  for (let i = 0; i < 3; i++) {
    const root = new THREE.Group();
    const flipper = new THREE.Group();
    const mesh = new THREE.Mesh(coinGeo, [coinSideMat, coinFaceMat, coinBackMat]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    flipper.add(mesh);
    root.add(flipper);
    const home = COIN_HOME[i];
    root.position.set(home.x, COIN_T / 2 + 0.012, home.z);
    root.rotation.y = home.ry;
    coinsGroup.add(root);
    coins.push(root);
  }

  const mod2pi = (v) => ((v % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);

  /** Toss all three coins. faces[i] = true means the character side lands up. */
  async function toss(faces) {
    const jobs = coins.map(async (root, i) => {
      const flipper = root.children[0];
      const from = root.position.clone();
      const slot = COIN_SLOTS[i];
      const to = new THREE.Vector3(
        slot.x + (Math.random() - 0.5) * 0.14,
        COIN_T / 2 + 0.012,
        slot.z + (Math.random() - 0.5) * 0.14
      );
      const peak = 0.9 + Math.random() * 0.5;
      const ry0 = root.rotation.y;
      const ry1 = ry0 + (Math.random() - 0.5) * 2.4;

      // spin whole turns, then land on the face the roll decided
      const z0 = flipper.rotation.z;
      const turns = 2 + Math.floor(Math.random() * 2);
      const parityTarget = faces[i] ? 0 : Math.PI;
      let z1 = z0 + turns * Math.PI * 2;
      z1 += mod2pi(parityTarget - z1);

      audio.clink(i * 0.09);
      await tween({
        duration: 820,
        delay: i * 90,
        ease: easeInOutCubic,
        update: (t) => {
          root.position.x = from.x + (to.x - from.x) * t;
          root.position.z = from.z + (to.z - from.z) * t;
          root.position.y = from.y + (to.y - from.y) * t + Math.sin(t * Math.PI) * peak;
          root.rotation.y = ry0 + (ry1 - ry0) * t;
          flipper.rotation.z = z0 + (z1 - z0) * t;
        },
      });
      // a small bounce as the coin settles
      audio.thock();
      const y0 = root.position.y;
      await tween({
        duration: 150,
        update: (t) => { root.position.y = y0 + Math.sin(t * Math.PI) * 0.055; },
      });
      root.position.y = y0;
    });
    await Promise.all(jobs);
  }

  /** Gather the coins back to their resting cluster. */
  async function resetCoins() {
    await Promise.all(coins.map((root, i) => {
      const flipper = root.children[0];
      const from = root.position.clone();
      const home = COIN_HOME[i];
      const to = new THREE.Vector3(home.x, COIN_T / 2 + 0.012, home.z);
      const ry0 = root.rotation.y;
      const z0 = flipper.rotation.z;
      let z1 = z0 + Math.PI * 2;
      z1 += mod2pi(0 - z1);
      return tween({
        duration: 480,
        delay: i * 70,
        ease: easeInOutCubic,
        update: (t) => {
          root.position.lerpVectors(from, to, t);
          root.position.y = from.y + (to.y - from.y) * t + Math.sin(t * Math.PI) * 0.3;
          root.rotation.y = ry0 + (home.ry - ry0) * t;
          flipper.rotation.z = z0 + (z1 - z0) * t;
        },
      });
    }));
  }

  // ---------- lot cup ----------
  const cupGroup = new THREE.Group();
  cupGroup.position.copy(CUP_POS);
  cupGroup.visible = false;
  scene.add(cupGroup);

  const cupTex = new THREE.CanvasTexture(drawCupSide());
  cupTex.colorSpace = THREE.SRGBColorSpace;
  cupTex.anisotropy = 8;
  const cupBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.26, 0.62, 32, 1, true),
    new THREE.MeshStandardMaterial({ map: cupTex, roughness: 0.7, metalness: 0.05, side: THREE.DoubleSide })
  );
  cupBody.position.y = 0.31;
  cupBody.castShadow = true;
  const cupBottom = new THREE.Mesh(
    new THREE.CircleGeometry(0.26, 32),
    new THREE.MeshStandardMaterial({ color: 0x4a3524, roughness: 0.9 })
  );
  cupBottom.rotation.x = -Math.PI / 2;
  cupBottom.position.y = 0.025;
  cupGroup.add(cupBody, cupBottom);

  const stickGeo = new THREE.BoxGeometry(0.055, 0.78, 0.014);
  stickGeo.translate(0, 0.39, 0); // pivot at the stick's foot
  const stickMat = new THREE.MeshStandardMaterial({ color: 0xc9a06a, roughness: 0.72, metalness: 0.02 });
  const sticks = [];
  for (let i = 0; i < STICK_COUNT; i++) {
    const a = (i / STICK_COUNT) * Math.PI * 2 + Math.random() * 0.4;
    const r = 0.08 + Math.random() * 0.12;
    const stick = new THREE.Mesh(stickGeo, stickMat);
    stick.position.set(Math.cos(a) * r, 0.03, Math.sin(a) * r);
    stick.rotation.set((Math.random() - 0.5) * 0.18, Math.random() * Math.PI, (Math.random() - 0.5) * 0.18);
    stick.castShadow = true;
    stick.userData.home = { pos: stick.position.clone(), rot: stick.rotation.clone() };
    cupGroup.add(stick);
    sticks.push(stick);
  }

  let drawnStick = null;

  /** Shake the cup, then raise one stick that carries the drawn hexagram. */
  async function drawLot(code, name) {
    if (drawnStick) return;
    audio.rattle();
    const rx0 = cupGroup.rotation.x, rz0 = cupGroup.rotation.z;
    await tween({
      duration: 560,
      update: (t) => {
        const decay = 1 - t;
        cupGroup.rotation.x = rx0 + Math.sin(t * Math.PI * 7) * 0.09 * decay;
        cupGroup.rotation.z = rz0 + Math.cos(t * Math.PI * 6) * 0.09 * decay;
      },
      complete: () => { cupGroup.rotation.x = rx0; cupGroup.rotation.z = rz0; },
    });

    drawnStick = sticks[Math.floor(Math.random() * sticks.length)];
    const tex = new THREE.CanvasTexture(drawStick(code, name));
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    drawnStick.material = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.65, metalness: 0.02 });

    const p0 = drawnStick.position.clone();
    const r0 = { x: drawnStick.rotation.x, z: drawnStick.rotation.z };
    await tween({
      duration: 780,
      ease: easeOutCubic,
      update: (t) => {
        drawnStick.position.y = p0.y + t * 0.85;
        drawnStick.position.x = p0.x * (1 - t * 0.6);
        drawnStick.position.z = p0.z * (1 - t * 0.6);
        drawnStick.rotation.x = r0.x + (-0.42 - r0.x) * t;
        drawnStick.rotation.z = r0.z * (1 - t);
      },
    });
    audio.reveal();
  }

  /** Slide the drawn stick back into the cup. */
  async function resetLot() {
    if (!drawnStick) return;
    const stick = drawnStick;
    drawnStick = null;
    const p0 = stick.position.clone();
    const r0 = { x: stick.rotation.x, z: stick.rotation.z };
    const home = stick.userData.home;
    await tween({
      duration: 420,
      ease: easeInOutCubic,
      update: (t) => {
        stick.position.lerpVectors(p0, home.pos, t);
        stick.rotation.x = r0.x + (home.rot.x - r0.x) * t;
        stick.rotation.z = r0.z + (home.rot.z - r0.z) * t;
      },
    });
    const old = stick.material;
    stick.material = stickMat;
    if (old.map) old.map.dispose();
    old.dispose();
  }

  // ---------- mode switching ----------
  let mode = 'coins';
  async function setMode(next) {
    if (next === mode) return;
    mode = next;
    const showGroup = mode === 'coins' ? coinsGroup : cupGroup;
    const hideGroup = mode === 'coins' ? cupGroup : coinsGroup;
    if (mode === 'coins') await resetLot();
    hideGroup.visible = false;
    showGroup.visible = true;
    const y0 = -0.1;
    showGroup.position.y = y0;
    await tween({ duration: 340, update: (t) => { showGroup.position.y = y0 * (1 - t); } });
  }

  // ---------- picking ----------
  desk.onTap((event) => {
    if (mode === 'coins') {
      if (desk.castAt(event, coins).length && onCoinsTap) onCoinsTap();
    } else {
      if (desk.castAt(event, [cupBody, ...sticks]).length && onCupTap) onCupTap();
    }
  });

  return {
    toss, resetCoins, drawLot, resetLot, setMode,
    get mode() { return mode; },
    projectCoin: (i) => (coins[i] ? desk.project(coins[i].position) : null),
    projectCup: () => desk.project(CUP_POS.clone().setY(0.35)),
    dispose: desk.dispose,
  };
}
