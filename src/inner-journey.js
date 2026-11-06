import * as THREE from 'three';
import { seededRandom } from './materials.js';
import { box, cylinder, mesh, makeGlow } from './geometry.js';
import { createDoor, createFrame, createMemoryMaterials, memoryTexture } from './memory-art.js';

const TAU = Math.PI * 2;
const ART = ['landscape', 'river', 'map', 'neural', 'calligraphy', 'pavilion', 'topography', 'breath', 'lotus', 'horizon'];

/**
 * A separate, quiet space. Milestones stand along a gentle rising spiral —
 * doors for rituals and readings, framed screens for notes — with a clear
 * way back to the room.
 */
export class InnerJourney {
  constructor(environment) {
    this.scene = new THREE.Scene();
    this.scene.environment = environment;
    this.scene.environmentIntensity = 0.22;
    this.scene.background = new THREE.Color(0x0d1016);
    this.scene.fog = new THREE.FogExp2(0x0d1016, 0.028);
    this.root = new THREE.Group();
    this.root.name = '内在旅程';
    this.scene.add(this.root);
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.memoryMaterials = createMemoryMaterials();
    this.kit = this.makeKit();
    this.pieces = [];
    this.returnDoor = null;
    this.buildGround();
    this.buildAtmosphere();
    const home = this.cameraHome();
    this.homePosition = home.position;
    this.homeTarget = home.target;
  }

  makeKit() {
    const glow = new THREE.CanvasTexture(glowCanvas());
    glow.colorSpace = THREE.SRGBColorSpace;
    return {
      backing: new THREE.MeshStandardMaterial({ color: 0x12141c, roughness: 0.55, metalness: 0.35 }),
      bronze: new THREE.MeshStandardMaterial({ color: 0x9a7d58, roughness: 0.32, metalness: 0.72 }),
      gold: new THREE.MeshStandardMaterial({ color: 0xd4b56e, roughness: 0.28, metalness: 0.7 }),
      paper: new THREE.MeshStandardMaterial({ color: 0xf0d7ae, roughness: 0.9 }),
      glow,
    };
  }

  buildGround() {
    const disc = mesh(new THREE.CircleGeometry(8.2, 80), new THREE.MeshStandardMaterial({
      color: 0x141820, roughness: 0.55, metalness: 0.35, map: groundTexture(),
    }), this.root, [0, 0.01, 0], [-Math.PI / 2, 0, 0]);
    disc.receiveShadow = false;
    disc.castShadow = false;
    cylinder(this.root, new THREE.MeshStandardMaterial({ color: 0x0c0e13, roughness: 0.9 }), 8.2, 0.08, [0, -0.03, 0], 64);
  }

  buildAtmosphere() {
    this.scene.add(new THREE.HemisphereLight(0x9aa6b8, 0x1a120e, 0.7));
    const fill = new THREE.DirectionalLight(0xc5d0dc, 0.35);
    fill.position.set(-6, 8, 4);
    this.scene.add(fill);
    this.heart = new THREE.PointLight(0xffc48a, 4.2, 16, 2);
    this.heart.position.set(0, 3.1, 0);
    this.scene.add(this.heart);
    const count = 48;
    const positions = new Float32Array(count * 3);
    const random = seededRandom(77);
    this.motes = [];
    for (let i = 0; i < count; i++) {
      const mote = { a: random() * TAU, r: 0.4 + random() * 3.2, y: random() * 4.2, speed: 0.04 + random() * 0.06 };
      this.motes.push(mote);
      positions.set([Math.cos(mote.a) * mote.r, mote.y, Math.sin(mote.a) * mote.r], i * 3);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.particles = new THREE.Points(geometry, new THREE.PointsMaterial({
      color: 0xf0d7a8, size: 0.045, map: this.kit.glow, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    this.root.add(this.particles);
  }

  setTheme(element) {
    const tint = { 金: 0x12141a, 木: 0x101610, 水: 0x0e141c, 火: 0x160e0c, 土: 0x14110e }[element] || 0x0d1016;
    this.scene.background.set(tint);
    this.scene.fog.color.set(tint);
  }

  setMilestones(items) {
    this.clearPieces();
    const visible = choosePieces(items);
    visible.forEach((item, index) => this.addPiece(item, index, visible.length));
    this.addReturn();
    this.drawPath(visible.length);
  }

  addPiece(item, index, count) {
    const slot = place(index, count);
    const group = new THREE.Group();
    group.position.set(slot.x, slot.y, slot.z);
    group.rotation.y = slot.rotY;
    const isDoor = item.kind === 'ritual' || item.kind === 'reading';
    let content;
    if (isDoor) {
      content = createDoor(this.memoryMaterials, this.kit, index, true);
      group.add(content.group);
    } else {
      const texture = memoryTexture(ART[index % ART.length], index, item.date || '');
      content = createFrame(this.kit, this.memoryMaterials, texture, index);
      group.add(content);
    }
    const plate = datePlate(item.date || '');
    const sign = mesh(new THREE.PlaneGeometry(0.46, 0.12), new THREE.MeshBasicMaterial({ map: plate, transparent: true, toneMapped: false }), group, [0, isDoor ? -0.92 : -0.48, 0.08]);
    sign.castShadow = false;
    group.traverse((child) => { child.userData.milestoneId = item.id; });
    this.root.add(group);
    this.pieces.push({ id: item.id, object: group, baseY: slot.y, phase: index * 0.7, door: isDoor ? content.lightMaterial : null });
  }

  addReturn() {
    const group = new THREE.Group();
    group.position.set(-2.35, 1.05, 3.35);
    group.rotation.y = 0.42;
    const door = createDoor(this.memoryMaterials, this.kit, 3, true);
    door.group.scale.setScalar(1.15);
    group.add(door.group);
    const sign = mesh(new THREE.PlaneGeometry(0.7, 0.16), new THREE.MeshBasicMaterial({ map: datePlate('RETURN'), transparent: true, toneMapped: false }), group, [0, -1.05, 0.1]);
    sign.castShadow = false;
    group.traverse((child) => { child.userData.portal = 'return'; });
    this.root.add(group);
    this.returnDoor = group;
    makeGlow(group, this.kit, [0, 0.1, 0.2], 0xffe0b0, 1.1, 0.35);
  }

  drawPath(count) {
    const points = [new THREE.Vector3(-1.2, 0.04, 4.1)];
    for (let i = 0; i < count; i++) {
      const slot = place(i, count);
      points.push(new THREE.Vector3(slot.x, 0.04, slot.z));
    }
    if (points.length < 2) return;
    const curve = new THREE.CatmullRomCurve3(points);
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 80, 0.015, 6, false), new THREE.MeshBasicMaterial({ color: 0xd7b56a, transparent: true, opacity: 0.55 }));
    tube.castShadow = false;
    this.root.add(tube);
    this.path = tube;
  }

  clearPieces() {
    for (const piece of this.pieces) piece.object.removeFromParent();
    this.returnDoor?.removeFromParent();
    this.path?.removeFromParent();
    this.pieces = [];
    this.returnDoor = null;
    this.path = null;
  }

  focusOffset(id) {
    const piece = this.pieces.find((item) => item.id === id);
    if (!piece) return null;
    const target = piece.object.position.clone();
    target.y = Math.max(1.2, target.y);
    const outward = target.clone().setY(0);
    if (outward.lengthSq() < 0.01) outward.set(0, 0, 1);
    outward.normalize();
    const position = target.clone().add(outward.multiplyScalar(2.4));
    position.y = target.y + 0.35;
    return { position, target };
  }

  cameraHome() {
    return {
      position: new THREE.Vector3(0.15, 1.85, 6.15),
      target: new THREE.Vector3(0.05, 1.45, 0.7),
    };
  }

  containsReturn(x, z) {
    if (!this.returnDoor) return false;
    return Math.hypot(x - this.returnDoor.position.x, z - this.returnDoor.position.z) < 0.85;
  }

  canWalkTo(x, z) {
    return x * x + z * z < 7.4 * 7.4;
  }

  update(seconds) {
    const drift = this.reducedMotion ? 0 : Math.sin(seconds * 0.8) * 0.25;
    this.heart.intensity = 4.2 + drift;
    for (const piece of this.pieces) {
      piece.object.position.y = piece.baseY + (this.reducedMotion ? 0 : Math.sin(seconds * 0.55 + piece.phase) * 0.03);
      if (piece.door) {
        const pulse = this.reducedMotion ? 0 : Math.sin(seconds * 0.9 + piece.phase);
        piece.door.glow.material.opacity = 0.38 + pulse * 0.06;
      }
    }
    const positions = this.particles.geometry.attributes.position;
    this.motes.forEach((mote, index) => {
      const y = this.reducedMotion ? mote.y : (mote.y + seconds * mote.speed) % 4.4;
      const a = this.reducedMotion ? mote.a : mote.a + seconds * 0.03;
      positions.setXYZ(index, Math.cos(a) * mote.r, y, Math.sin(a) * mote.r);
    });
    positions.needsUpdate = true;
  }
}

function place(index, count) {
  const t = count <= 1 ? 0.5 : index / Math.max(1, count - 1);
  const angle = -0.9 + t * 1.8;
  const x = Math.sin(angle) * (2.35 + t * 0.55);
  const z = 0.55 + (1 - Math.cos(angle)) * 0.55;
  const y = 1.08 + t * 1.15;
  return { x, y, z, rotY: Math.atan2(0.15 - x, 6.15 - z) };
}

function choosePieces(items) {
  const real = items.filter((item) => !item.sample);
  const samples = items.filter((item) => item.sample);
  let chosen = [...samples, ...real];
  if (chosen.length > 12) {
    const room = Math.max(0, 12 - Math.min(12, real.length));
    chosen = [...samples.slice(0, room), ...real.slice(-Math.min(12, real.length))];
  }
  return chosen.sort((a, b) => String(a.date + (a.time || '')).localeCompare(String(b.date + (b.time || ''))));
}

function datePlate(text) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 512, 128);
  ctx.fillStyle = 'rgba(18,14,12,.78)';
  ctx.fillRect(8, 24, 496, 80);
  ctx.strokeStyle = 'rgba(214,180,112,.7)';
  ctx.strokeRect(8.5, 24.5, 495, 79);
  ctx.fillStyle = '#f3e2c0';
  ctx.font = '44px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, 64);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function glowCanvas() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  const g = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  return canvas;
}

function groundTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  const c = 512;
  const bg = ctx.createRadialGradient(c, c, 40, c, c, 500);
  bg.addColorStop(0, '#1a2030');
  bg.addColorStop(0.55, '#121722');
  bg.addColorStop(1, '#0c0e14');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1024, 1024);
  ctx.translate(c, c);
  ctx.strokeStyle = 'rgba(214,186,130,.22)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, 280, 0, TAU);
  ctx.stroke();
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
