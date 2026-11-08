import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const ORDER = ['divine', 'natal', 'feng', 'spirit'];

function prefersReduced() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function makeGold(envIntensity = 1.2) {
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#C6A15A'),
    metalness: 1,
    roughness: 0.22,
    emissive: new THREE.Color('#FBF5B7'),
    emissiveIntensity: 0.04,
    envMapIntensity: envIntensity,
  });
}

function addMesh(group, geometry, material, position, rotation) {
  const mesh = new THREE.Mesh(geometry, material);
  if (position) mesh.position.set(position[0], position[1], position[2]);
  if (rotation) mesh.rotation.set(rotation[0], rotation[1], rotation[2]);
  mesh.userData.metal = true;
  group.add(mesh);
  return mesh;
}

function buildAlcove(material) {
  const group = new THREE.Group();
  const dark = new THREE.MeshPhysicalMaterial({
    color: 0x101010,
    metalness: 0.6,
    roughness: 0.45,
    emissive: 0x1a1408,
    emissiveIntensity: 0.15,
  });
  addMesh(group, new THREE.BoxGeometry(1.28, 1.72, 0.06), dark, [0, 1.05, -0.28]);
  addMesh(group, new THREE.BoxGeometry(0.07, 1.55, 0.08), material, [-0.58, 0.86, 0]);
  addMesh(group, new THREE.BoxGeometry(0.07, 1.55, 0.08), material, [0.58, 0.86, 0]);
  const arch = new THREE.TorusGeometry(0.5, 0.028, 10, 40, Math.PI);
  addMesh(group, arch, material, [0, 1.58, 0]);
  addMesh(group, new THREE.CylinderGeometry(0.46, 0.5, 0.12, 32), material, [0, 0.08, 0.18]);
  return group;
}

function buildProp(id, material) {
  const group = new THREE.Group();
  if (id === 'divine') {
    for (let i = 0; i < 3; i += 1) {
      const coin = addMesh(group, new THREE.CylinderGeometry(0.16, 0.16, 0.035, 28), material, [-0.22 + i * 0.22, 0.28, 0.22]);
      coin.rotation.x = Math.PI / 2;
      coin.rotation.z = i * 0.4;
    }
  } else if (id === 'natal') {
    [0.42, 0.62, 0.5, 0.72].forEach((height, index) => {
      addMesh(group, new THREE.BoxGeometry(0.08, height, 0.08), material, [-0.24 + index * 0.16, 0.18 + height / 2, 0.2]);
    });
    addMesh(group, new THREE.TorusGeometry(0.28, 0.015, 8, 32), material, [0, 0.34, 0.34], [Math.PI / 2, 0, 0]);
  } else if (id === 'feng') {
    addMesh(group, new THREE.ConeGeometry(0.22, 0.48, 5), material, [-0.12, 0.4, 0.18]);
    const disc = addMesh(group, new THREE.CylinderGeometry(0.28, 0.28, 0.04, 32), material, [0.16, 0.22, 0.28]);
    disc.userData.spin = true;
  } else {
    addMesh(group, new THREE.SphereGeometry(0.2, 28, 20), material, [0, 0.62, 0.16]);
    addMesh(group, new THREE.TorusGeometry(0.16, 0.03, 10, 24), material, [0, 0.24, 0.22], [Math.PI / 2.4, 0, 0]);
  }
  return group;
}

export function mountZones(container, { onSelect, onHover } = {}) {
  const reduced = prefersReduced();
  const mobile = window.matchMedia('(max-width: 800px)').matches;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: !mobile, alpha: true, powerPreference: 'high-performance' });
  } catch {
    container.classList.add('is-fallback');
    return { destroy() {}, focus() {}, setPaused() {} };
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.2 : 1.5));
  renderer.setClearColor(0x050505, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x050505, 8, 16);
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 40);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.05).texture;
  scene.environment = env;

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(7, 64),
    new THREE.MeshPhysicalMaterial({ color: 0x080808, metalness: 0.92, roughness: 0.18, envMapIntensity: 1.1 }),
  );
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);
  const inlay = new THREE.Mesh(
    new THREE.RingGeometry(2.55, 2.6, 80),
    makeGold(1.4),
  );
  inlay.rotation.x = -Math.PI / 2;
  inlay.position.y = 0.01;
  scene.add(inlay);

  const starCount = mobile ? 80 : 220;
  const starPositions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i += 1) {
    starPositions[i * 3] = (Math.random() - 0.5) * 16;
    starPositions[i * 3 + 1] = 1 + Math.random() * 6;
    starPositions[i * 3 + 2] = -2 - Math.random() * 8;
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  const starField = new THREE.Points(starGeo, new THREE.PointsMaterial({
    color: 0xfbf5b7, size: 0.03, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  scene.add(starField);
  scene.add(new THREE.AmbientLight(0xfff6df, 0.25));
  const key = new THREE.DirectionalLight(0xfff3d2, 2.4);
  key.position.set(3, 6, 4);
  scene.add(key);

  const views = {
    overview: { position: new THREE.Vector3(0, 2.55, 7.15), target: new THREE.Vector3(0, 0.85, 0) },
    divine: { position: new THREE.Vector3(-3.1, 1.45, 3.15), target: new THREE.Vector3(-2.7, 0.9, 0) },
    natal: { position: new THREE.Vector3(-0.9, 1.45, 3.15), target: new THREE.Vector3(-0.9, 0.9, 0) },
    feng: { position: new THREE.Vector3(0.9, 1.45, 3.15), target: new THREE.Vector3(0.9, 0.9, 0) },
    spirit: { position: new THREE.Vector3(2.7, 1.45, 3.05), target: new THREE.Vector3(2.7, 0.9, 0) },
  };
  const goal = { position: views.overview.position.clone(), target: views.overview.target.clone() };
  camera.position.copy(goal.position);
  const look = new THREE.Vector3().copy(goal.target);

  const zones = new Map();
  const goldMaterials = [];
  ORDER.forEach((id, index) => {
    const material = makeGold();
    goldMaterials.push(material);
    const group = new THREE.Group();
    group.position.x = -2.7 + index * 1.8;
    group.add(buildAlcove(material));
    group.add(buildProp(id, material));
    const light = new THREE.PointLight(0xfbf5b7, 0.4, 2.4);
    light.position.set(0, 1.1, 0.8);
    group.add(light);
    group.userData = { id, light, material, baseX: group.position.x };
    scene.add(group);
    zones.set(id, group);
  });

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let hovered = null;
  function paintHover(id) {
    zones.forEach((group, key) => {
      const on = key === id;
      group.userData.material.emissiveIntensity = on ? 0.55 : 0.04;
      group.userData.material.envMapIntensity = on ? 2.15 : 1.15;
      group.userData.light.intensity = on ? 4.5 : 0.35;
    });
    onHover?.(id);
  }
  function pick(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects([...zones.values()], true);
    if (!hits.length) return null;
    let node = hits[0].object;
    while (node && !node.userData.id) node = node.parent;
    return node?.userData.id || null;
  }
  const onMove = (event) => {
    const id = pick(event);
    if (id !== hovered) {
      hovered = id;
      paintHover(id);
    }
    renderer.domElement.style.cursor = id ? 'pointer' : '';
  };
  const onClick = (event) => {
    const id = pick(event);
    if (!id) return;
    focus(id);
    onSelect?.(id);
  };
  renderer.domElement.addEventListener('pointermove', onMove);
  renderer.domElement.addEventListener('click', onClick);

  let frame = 0;
  let paused = false;
  const clock = new THREE.Clock();
  function focus(id) {
    const view = views[id] || views.overview;
    goal.position.copy(view.position);
    goal.target.copy(view.target);
    paintHover(id || null);
    if (reduced) {
      camera.position.copy(goal.position);
      look.copy(goal.target);
      camera.lookAt(look);
      renderer.render(scene, camera);
    }
  }
  function render() {
    const dt = Math.min(clock.getDelta(), 0.05);
    const ease = reduced ? 1 : 1 - Math.exp(-dt * 4.2);
    camera.position.lerp(goal.position, ease);
    look.lerp(goal.target, ease);
    camera.lookAt(look);
    if (!reduced) {
      const time = clock.elapsedTime;
      zones.forEach((group) => {
        group.traverse((obj) => {
          if (obj.userData.spin) obj.rotation.y = time * 0.6;
        });
      });
      starField.rotation.y = time * 0.05;
    }
    renderer.render(scene, camera);
  }
  function loop() {
    if (paused) return;
    render();
    frame = requestAnimationFrame(loop);
  }
  function resize() {
    const width = container.clientWidth || 1;
    const height = container.clientHeight || 1;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    render();
  }
  const observer = new ResizeObserver(resize);
  observer.observe(container);
  resize();
  if (reduced) render();
  else loop();

  return {
    focus,
    setPaused(next) {
      paused = Boolean(next) || document.hidden;
      if (!paused && !reduced) loop();
      else cancelAnimationFrame(frame);
    },
    destroy() {
      cancelAnimationFrame(frame);
      observer.disconnect();
      renderer.domElement.removeEventListener('pointermove', onMove);
      renderer.domElement.removeEventListener('click', onClick);
      goldMaterials.forEach((material) => material.dispose());
      renderer.dispose();
      pmrem.dispose();
      container.replaceChildren();
    },
  };
}
