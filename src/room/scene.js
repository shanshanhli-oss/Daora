import * as T from 'three';
import { createDeskScene } from '../shared/desk-scene.js';
import { makeCoinFace, makeScrollFace, makeCompassFace, makeCenserBand } from './textures.js';

/**
 * 四门静室 — the DAORA hall. Four stations on the shared desk:
 *   占卜 divination — coins + lot cup (open, → yijing.html)
 *   命盘 chart      — standing scroll (coming)
 *   风水 fengshui   — bagua compass, swaying needle (coming)
 *   通灵 spirit     — incense burner with smoke (coming)
 * Hover lifts a station and shows its label; tap routes through onGate(id).
 */
export function createHall(container, { onGate }) {
  const desk = createDeskScene(container);
  const { scene, renderer } = desk;

  const stations = new Map(); // id -> {group, base, label, anchor}
  const pickables = [];

  function register(id, group, anchorY) {
    group.userData.gate = id;
    group.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.userData.gate = id; } });
    scene.add(group);
    stations.set(id, { group, base: group.position.y, anchor: new T.Vector3(group.position.x, anchorY, group.position.z) });
    pickables.push(group);
  }

  // ---------- 占卜 · coins & cup ----------
  const div = new T.Group();
  const coinFace = makeCoinFace(renderer);
  const coinRim = new T.MeshStandardMaterial({ color: 0xb08d57, roughness: 0.4, metalness: 0.8 });
  const coinCap = new T.MeshStandardMaterial({ map: coinFace, roughness: 0.5, metalness: 0.35 });
  const coinGeo = new T.CylinderGeometry(0.17, 0.17, 0.028, 40);
  [[-0.16, 0.05], [0.1, -0.08], [0.02, 0.16]].forEach(([dx, dz], i) => {
    const coin = new T.Mesh(coinGeo, [coinRim, coinCap, coinCap]);
    coin.position.set(dx, 0.014 + i * 0.03, dz);
    coin.rotation.y = i * 1.3;
    div.add(coin);
  });
  const cupMat = new T.MeshStandardMaterial({ color: 0x8a6f4d, roughness: 0.7, side: T.DoubleSide });
  const cup = new T.Mesh(new T.CylinderGeometry(0.16, 0.12, 0.34, 28, 1, true), cupMat);
  cup.position.set(0.42, 0.17, 0.06);
  div.add(cup);
  const cupBottom = new T.Mesh(new T.CircleGeometry(0.12, 28), new T.MeshStandardMaterial({ color: 0x4a3524, roughness: 0.9 }));
  cupBottom.rotation.x = -Math.PI / 2;
  cupBottom.position.set(0.42, 0.004, 0.06);
  div.add(cupBottom);
  for (let i = 0; i < 5; i++) {
    const stick = new T.Mesh(
      new T.BoxGeometry(0.045, 0.42, 0.012),
      new T.MeshStandardMaterial({ color: 0xc9b183, roughness: 0.65 })
    );
    const a = (i / 5) * Math.PI * 2;
    stick.position.set(0.42 + Math.cos(a) * 0.07, 0.36, 0.06 + Math.sin(a) * 0.07);
    stick.rotation.z = Math.cos(a) * 0.16;
    stick.rotation.x = Math.sin(a) * 0.16;
    div.add(stick);
  }
  div.position.set(0.92, 0, 0.6);
  register('divination', div, 0.08);

  // ---------- 命盘 · standing scroll ----------
  const bazi = new T.Group();
  const scrollTex = makeScrollFace(renderer);
  const rodMat = new T.MeshStandardMaterial({ color: 0x3a2a1c, roughness: 0.5, metalness: 0.15 });
  const paper = new T.Mesh(
    new T.PlaneGeometry(0.62, 1.24),
    new T.MeshStandardMaterial({ map: scrollTex, roughness: 0.85, side: T.DoubleSide })
  );
  paper.position.y = 0.72;
  bazi.add(paper);
  const rodGeo = new T.CylinderGeometry(0.035, 0.035, 0.74, 16);
  const rodTop = new T.Mesh(rodGeo, rodMat); rodTop.rotation.z = Math.PI / 2; rodTop.position.y = 1.36;
  const rodBottom = new T.Mesh(rodGeo, rodMat); rodBottom.rotation.z = Math.PI / 2; rodBottom.position.y = 0.08;
  bazi.add(rodTop, rodBottom);
  const stand = new T.Mesh(new T.CylinderGeometry(0.2, 0.26, 0.05, 24), rodMat);
  stand.position.y = 0.025;
  bazi.add(stand);
  bazi.rotation.y = 0.5;
  bazi.position.set(-0.92, 0, 0.6);
  register('chart', bazi, 0.72);

  // ---------- 风水 · bagua compass ----------
  const feng = new T.Group();
  const compassTex = makeCompassFace(renderer);
  const plate = new T.Mesh(
    new T.CylinderGeometry(0.5, 0.54, 0.07, 56),
    [
      new T.MeshStandardMaterial({ color: 0x5a4326, roughness: 0.45, metalness: 0.6 }),
      new T.MeshStandardMaterial({ map: compassTex, roughness: 0.6, metalness: 0.15 }),
      new T.MeshStandardMaterial({ color: 0x2c2015, roughness: 0.8 }),
    ]
  );
  plate.position.y = 0.035;
  feng.add(plate);
  const needleMat = new T.MeshStandardMaterial({ color: 0x9a2b1e, roughness: 0.35, metalness: 0.55, emissive: 0x2a0805 });
  const needleGeo = new T.BoxGeometry(0.62, 0.012, 0.045);
  const needle = new T.Mesh(needleGeo, needleMat);
  needle.position.y = 0.085;
  feng.add(needle);
  const pivot = new T.Mesh(
    new T.SphereGeometry(0.045, 20, 14),
    new T.MeshStandardMaterial({ color: 0xdfc591, roughness: 0.3, metalness: 0.9 })
  );
  pivot.position.y = 0.09;
  feng.add(pivot);
  feng.position.set(0, 0, -0.2);
  register('fengshui', feng, 0.05);

  // ---------- 通灵 · incense burner ----------
  const spirit = new T.Group();
  const bandTex = makeCenserBand(renderer);
  const body = new T.Mesh(
    new T.CylinderGeometry(0.3, 0.22, 0.3, 36),
    new T.MeshStandardMaterial({ map: bandTex, roughness: 0.5, metalness: 0.55 })
  );
  body.position.y = 0.19;
  spirit.add(body);
  const rim = new T.Mesh(
    new T.TorusGeometry(0.3, 0.028, 12, 40),
    new T.MeshStandardMaterial({ color: 0x8c6b3f, roughness: 0.4, metalness: 0.8 })
  );
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.34;
  spirit.add(rim);
  for (let i = 0; i < 3; i++) {
    const leg = new T.Mesh(
      new T.SphereGeometry(0.05, 14, 10),
      new T.MeshStandardMaterial({ color: 0x4c3a24, roughness: 0.5, metalness: 0.6 })
    );
    const a = (i / 3) * Math.PI * 2;
    leg.position.set(Math.cos(a) * 0.17, 0.04, Math.sin(a) * 0.17);
    spirit.add(leg);
  }
  const stickMat = new T.MeshStandardMaterial({ color: 0x6b4630, roughness: 0.8 });
  const tipMat = new T.MeshStandardMaterial({ color: 0xff9a4d, emissive: 0xff6a22, emissiveIntensity: 2.2 });
  for (let i = 0; i < 3; i++) {
    const a = -0.3 + i * 0.3;
    const stick = new T.Mesh(new T.CylinderGeometry(0.008, 0.008, 0.34, 8), stickMat);
    stick.position.set(Math.sin(a) * 0.05, 0.5, Math.cos(a) * 0.05 - 0.03);
    stick.rotation.z = a * 0.35;
    const tip = new T.Mesh(new T.SphereGeometry(0.012, 10, 8), tipMat);
    tip.position.y = 0.17;
    stick.add(tip);
    spirit.add(stick);
  }
  // smoke
  const SMOKE = 90;
  const smokePos = new Float32Array(SMOKE * 3);
  const smokeSeed = [];
  for (let i = 0; i < SMOKE; i++) {
    smokeSeed.push({ phase: Math.random(), drift: Math.random() * Math.PI * 2, r: 0.03 + Math.random() * 0.09 });
    smokePos[i * 3 + 1] = -10; // hidden until loop starts
  }
  const smokeGeo = new T.BufferGeometry();
  smokeGeo.setAttribute('position', new T.BufferAttribute(smokePos, 3));
  const smoke = new T.Points(smokeGeo, new T.PointsMaterial({
    color: 0xcabfae, size: 0.045, transparent: true, opacity: 0.16,
    blending: T.AdditiveBlending, depthWrite: false,
  }));
  smoke.raycast = () => {}; // smoke must never intercept station picking
  spirit.add(smoke);
  spirit.position.set(0, 0, -1.35);
  register('spirit', spirit, 0.25);

  // ---------- per-frame life ----------
  desk.onFrame((t) => {
    needle.rotation.y = Math.sin(t * 0.7) * 0.35 + Math.sin(t * 0.23) * 0.2;
    const pos = smoke.geometry.attributes.position;
    for (let i = 0; i < SMOKE; i++) {
      const s = smokeSeed[i];
      const life = (t * 0.14 * desk.speed + s.phase) % 1;
      const y = 0.38 + life * 1.5;
      const swirl = s.drift + life * 5;
      pos.array[i * 3] = Math.cos(swirl) * s.r * (0.4 + life * 2.2);
      pos.array[i * 3 + 1] = y;
      pos.array[i * 3 + 2] = Math.sin(swirl) * s.r * (0.4 + life * 2.2);
    }
    pos.needsUpdate = true;
    // idle breathing on hovered station handled by hover tweens; add gentle bob for coins
    div.rotation.y = Math.sin(t * 0.4) * 0.03;
  });

  // ---------- hover / tap ----------
  const labelEl = document.getElementById('station-label');
  let hovered = null;

  function gateOf(obj) {
    let o = obj;
    while (o) {
      if (o.userData.gate) return o.userData.gate;
      o = o.parent;
    }
    return null;
  }

  function setHover(id, event) {
    if (hovered === id) {
      if (id && event) moveLabel(event);
      return;
    }
    if (hovered) {
      const prev = stations.get(hovered);
      desk.tween({ duration: 260, update: (k) => { prev.group.position.y = prev.base + (1 - k) * 0.07; } });
    }
    hovered = id;
    if (id) {
      const st = stations.get(id);
      desk.tween({ duration: 260, update: (k) => { st.group.position.y = st.base + k * 0.07; } });
      labelEl.textContent = labelEl.dataset[id] || id;
      labelEl.classList.remove('hidden');
      labelEl.classList.add('show');
      renderer.domElement.style.cursor = 'pointer';
      if (event) moveLabel(event);
    } else {
      labelEl.classList.remove('show');
      renderer.domElement.style.cursor = '';
    }
  }

  function moveLabel(event) {
    labelEl.style.left = `${event.clientX}px`;
    labelEl.style.top = `${event.clientY}px`;
  }

  renderer.domElement.addEventListener('pointermove', (event) => {
    const hit = desk.castAt(event, pickables)[0];
    setHover(hit ? gateOf(hit.object) : null, event);
  });
  renderer.domElement.addEventListener('pointerleave', () => setHover(null));

  desk.onTap((event) => {
    const hit = desk.castAt(event, pickables)[0];
    const gate = hit ? gateOf(hit.object) : null;
    if (gate) onGate(gate);
  });

  return {
    ...desk,
    debugCast(x, y) {
      return desk.castAt({ clientX: x, clientY: y }, pickables)
        .slice(0, 5)
        .map((h) => ({ type: h.object.type, gate: h.object.userData.gate ?? null, d: +h.distance.toFixed(3) }));
    },
    projectStation(id) {
      const st = stations.get(id);
      return desk.project(st.anchor);
    },
    stationIds: [...stations.keys()],
  };
}
