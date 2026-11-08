import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const BRANCHES = '子丑寅卯辰巳午未申酉戌亥';
const TRIGRAMS = [
  { angle: 0, bits: [0, 1, 0] },
  { angle: 45, bits: [0, 0, 1] },
  { angle: 90, bits: [1, 0, 0] },
  { angle: 135, bits: [0, 1, 1] },
  { angle: 180, bits: [1, 0, 1] },
  { angle: 225, bits: [0, 0, 0] },
  { angle: 270, bits: [1, 1, 0] },
  { angle: 315, bits: [1, 1, 1] },
];

function paintCompass() {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const g = canvas.getContext('2d');
  const c = size / 2;
  g.clearRect(0, 0, size, size);
  g.strokeStyle = 'rgba(251, 245, 183, 0.82)';
  g.fillStyle = '#FBF5B7';
  g.lineCap = 'round';
  for (const radius of [470, 404, 292]) {
    g.lineWidth = radius === 404 ? 1.2 : 2;
    g.beginPath();
    g.arc(c, c, radius, 0, Math.PI * 2);
    g.stroke();
  }
  for (let i = 0; i < 72; i += 1) {
    const angle = (i / 72) * Math.PI * 2 - Math.PI / 2;
    const major = i % 6 === 0;
    const inner = major ? 430 : 452;
    g.lineWidth = major ? 2.4 : 1;
    g.globalAlpha = major ? 1 : 0.65;
    g.beginPath();
    g.moveTo(c + Math.cos(angle) * inner, c + Math.sin(angle) * inner);
    g.lineTo(c + Math.cos(angle) * 470, c + Math.sin(angle) * 470);
    g.stroke();
  }
  g.globalAlpha = 1;
  g.font = '600 54px "Noto Serif SC", "Songti SC", serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  for (let i = 0; i < 12; i += 1) {
    const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
    g.save();
    g.translate(c + Math.cos(angle) * 436, c + Math.sin(angle) * 436);
    g.rotate(angle + Math.PI / 2);
    g.fillText(BRANCHES[i], 0, 0);
    g.restore();
  }
  TRIGRAMS.forEach(({ angle, bits }) => {
    const rad = (angle * Math.PI) / 180 - Math.PI / 2;
    g.save();
    g.translate(c + Math.cos(rad) * 338, c + Math.sin(rad) * 338);
    g.rotate(rad + Math.PI / 2);
    bits.forEach((bit, index) => {
      const y = 22 - index * 22;
      g.lineWidth = 4;
      g.strokeStyle = '#F8EFCB';
      g.beginPath();
      if (bit) {
        g.moveTo(-26, y);
        g.lineTo(26, y);
      } else {
        g.moveTo(-26, y);
        g.lineTo(-8, y);
        g.moveTo(8, y);
        g.lineTo(26, y);
      }
      g.stroke();
    });
    g.restore();
  });
  return canvas;
}

function paintTaiji() {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const g = canvas.getContext('2d');
  const c = size / 2;
  const r = 228;
  g.beginPath();
  g.arc(c, c, r, 0, Math.PI * 2);
  g.fillStyle = '#F4E7B8';
  g.fill();
  g.fillStyle = '#120E08';
  g.beginPath();
  g.arc(c, c, r, Math.PI / 2, -Math.PI / 2);
  g.arc(c, c - r / 2, r / 2, -Math.PI / 2, Math.PI / 2, true);
  g.arc(c, c + r / 2, r / 2, -Math.PI / 2, Math.PI / 2);
  g.fill();
  g.beginPath();
  g.arc(c, c - r / 2, r / 6, 0, Math.PI * 2);
  g.fillStyle = '#F4E7B8';
  g.fill();
  g.beginPath();
  g.arc(c, c + r / 2, r / 6, 0, Math.PI * 2);
  g.fillStyle = '#120E08';
  g.fill();
  g.beginPath();
  g.arc(c, c, r, 0, Math.PI * 2);
  g.strokeStyle = '#8C6A2E';
  g.lineWidth = 8;
  g.stroke();
  return canvas;
}

function prefersReduced() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function mountHero(container) {
  const reduced = prefersReduced();
  const mobile = window.matchMedia('(max-width: 800px)').matches;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: !mobile, alpha: true, powerPreference: 'high-performance' });
  } catch {
    container.classList.add('is-fallback');
    return { destroy() {}, setPaused() {} };
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.25 : 1.6));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 40);
  camera.position.set(0, 0.15, 6.4);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const pivot = new THREE.Group();
  pivot.rotation.set(0.22, -0.45, 0);
  scene.add(pivot);

  const gold = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#D4B36A'),
    metalness: 1,
    roughness: 0.18,
    emissive: new THREE.Color('#6a4a16'),
    emissiveIntensity: 0.18,
    envMapIntensity: 1.35,
  });
  const ringGold = gold.clone();
  gold.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = { value: 0 };
    shader.vertexShader = `uniform float uTime;\n${shader.vertexShader.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
       transformed += normal * sin(position.y * 5.0 + uTime) * sin(position.x * 4.0 + uTime * 0.6) * 0.028;`,
    )}`;
    gold.userData.shader = shader;
  };

  const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.92, 64, 48), gold);
  pivot.add(sphere);

  const taijiMap = new THREE.CanvasTexture(paintTaiji());
  taijiMap.colorSpace = THREE.SRGBColorSpace;
  const taiji = new THREE.Mesh(
    new THREE.CircleGeometry(0.62, 64),
    new THREE.MeshBasicMaterial({ map: taijiMap, transparent: true, toneMapped: false }),
  );
  taiji.position.z = 0.98;
  pivot.add(taiji);

  const compassMap = new THREE.CanvasTexture(paintCompass());
  compassMap.colorSpace = THREE.SRGBColorSpace;
  compassMap.anisotropy = 4;
  const compass = new THREE.Mesh(
    new THREE.CircleGeometry(2.35, 96),
    new THREE.MeshBasicMaterial({ map: compassMap, transparent: true, depthWrite: false, toneMapped: false, side: THREE.DoubleSide }),
  );
  compass.position.z = -0.05;
  pivot.add(compass);

  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.55, 0.018, 12, 80), gold);
  pivot.add(ring);
  const outer = new THREE.Mesh(new THREE.TorusGeometry(2.42, 0.012, 10, 90), ringGold);
  outer.material.roughness = 0.28;
  pivot.add(outer);

  const count = mobile ? 80 : 220;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    const angle = (i / count) * Math.PI * 8;
    const radius = 1.35 + (i % 7) * 0.16;
    positions[i * 3] = Math.cos(angle) * radius;
    positions[i * 3 + 1] = ((i % 11) - 5) * 0.08;
    positions[i * 3 + 2] = Math.sin(angle) * radius * 0.35;
  }
  const points = new THREE.Points(
    new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(positions, 3)),
    new THREE.PointsMaterial({ color: 0xfbf5b7, size: mobile ? 0.03 : 0.028, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true }),
  );
  pivot.add(points);

  scene.add(new THREE.AmbientLight(0xfff4d2, 0.35));
  const key = new THREE.PointLight(0xfff1c4, 18, 12);
  key.position.set(2.2, 2.4, 3.2);
  scene.add(key);
  const rim = new THREE.PointLight(0xb38728, 10, 10);
  rim.position.set(-2.6, -1.2, 2);
  scene.add(rim);

  const pointer = { x: 0, y: 0 };
  const onPointer = (event) => {
    const rect = container.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = ((event.clientY - rect.top) / rect.height) * 2 - 1;
  };
  container.addEventListener('pointermove', onPointer);

  let frame = 0;
  let paused = false;
  const clock = new THREE.Clock();
  function render() {
    const time = clock.getElapsedTime();
    if (!reduced) {
      pivot.rotation.y += (pointer.x * 0.55 - 0.45 - pivot.rotation.y) * 0.05;
      pivot.rotation.x += (-pointer.y * 0.28 + 0.22 - pivot.rotation.x) * 0.05;
      ring.rotation.z = time * 0.15;
      outer.rotation.z = -time * 0.08;
      points.rotation.y = time * 0.12;
      if (gold.userData.shader) gold.userData.shader.uniforms.uTime.value = time;
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
  document.fonts?.ready?.then(() => {
    const next = paintCompass();
    compassMap.image = next;
    compassMap.needsUpdate = true;
    render();
  });
  if (reduced) render();
  else loop();

  return {
    setPaused(next) {
      paused = next || document.hidden;
      if (!paused && !reduced) loop();
      else cancelAnimationFrame(frame);
    },
    destroy() {
      cancelAnimationFrame(frame);
      observer.disconnect();
      container.removeEventListener('pointermove', onPointer);
      renderer.dispose();
      pmrem.dispose();
      container.replaceChildren();
    },
  };
}
