import * as THREE from 'three';
import { box, cylinder, sphere, makeGlow } from './geometry.js';

/**
 * One person-scale door set into a side wall. It stays slightly ajar so warm
 * light leaks around the leaf, and it can swing open when the visitor enters.
 */
export class WallDoor {
  constructor(parent, materials) {
    this.m = materials;
    this.root = new THREE.Group();
    this.root.name = '内在旅程 · wall door';
    parent.add(this.root);
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.opening = false;
    this.openStarted = 0;
    this.build();
  }

  build() {
    const m = this.m;
    const w = 1.12;
    const h = 2.22;
    const ivory = new THREE.MeshPhysicalMaterial({ color: 0xe7e0d2, roughness: 0.42, metalness: 0.02, clearcoat: 0.18 });
    const molding = new THREE.MeshStandardMaterial({ color: 0xf4ecdc, roughness: 0.34 });
    const recess = new THREE.MeshStandardMaterial({ color: 0x8d877c, roughness: 0.62 });
    const panel = new THREE.MeshPhysicalMaterial({ color: 0xcfc6b4, roughness: 0.48, clearcoat: 0.12 });
    const backing = new THREE.MeshStandardMaterial({ color: 0x140e0c, roughness: 0.9 });
    this.materials = { ivory, molding, recess, panel, backing };

    box(this.root, backing, [w + 0.22, h + 0.16, 0.12], [0, h / 2, -0.08]);
    const glowMap = doorwayWash();
    const wash = new THREE.MeshBasicMaterial({ map: glowMap, color: 0xffe2b4, toneMapped: false });
    const opening = box(this.root, wash, [w - 0.08, h - 0.08, 0.02], [0, h / 2, -0.01]);
    opening.castShadow = false;
    opening.receiveShadow = false;

    box(this.root, m.lacquer, [0.09, h, 0.16], [-w / 2, h / 2, 0.04], 0.01);
    box(this.root, m.lacquer, [0.09, h, 0.16], [w / 2, h / 2, 0.04], 0.01);
    box(this.root, m.lacquer, [w + 0.18, 0.12, 0.18], [0, h + 0.02, 0.04], 0.012);
    box(this.root, m.darkWood, [w + 0.28, 0.08, 0.22], [0, h + 0.1, 0.02]);
    box(this.root, m.brass, [w + 0.04, 0.018, 0.02], [0, 0.04, 0.09]);

    const rim = new THREE.MeshBasicMaterial({ color: 0xffd7a4, transparent: true, opacity: 0.85, toneMapped: false, depthWrite: false });
    this.rim = rim;
    for (const x of [-w / 2 + 0.02, w / 2 - 0.02]) {
      const strip = box(this.root, rim, [0.025, h - 0.12, 0.012], [x, h / 2, 0.09]);
      strip.castShadow = false;
    }
    const top = box(this.root, rim, [w - 0.08, 0.028, 0.012], [0, h - 0.04, 0.09]);
    top.castShadow = false;

    this.hinge = new THREE.Group();
    this.hinge.position.set(-w / 2 + 0.08, h / 2, 0.07);
    this.root.add(this.hinge);
    const leafW = w - 0.16;
    const leafH = h - 0.16;
    this.hinge.rotation.y = -0.18;
    const leaf = box(this.hinge, ivory, [leafW, leafH, 0.055], [leafW / 2, 0, 0.02], 0.012);
    leaf.castShadow = true;
    for (const [y, height] of [[0.42, 0.72], [-0.38, 0.62]]) {
      box(this.hinge, recess, [leafW * 0.72, height, 0.012], [leafW * 0.52, y, 0.05]);
      box(this.hinge, panel, [leafW * 0.72 - 0.04, height - 0.04, 0.016], [leafW * 0.52, y, 0.058]);
    }
    box(this.hinge, m.brass, [0.035, 0.16, 0.02], [leafW - 0.12, -0.05, 0.07]);
    sphere(this.hinge, m.gold, 0.028, [leafW - 0.11, -0.05, 0.09]);
    for (const y of [-leafH * 0.36, leafH * 0.36]) {
      const pin = cylinder(this.hinge, m.brass, 0.012, 0.09, [0, y, 0.01], 10);
      pin.castShadow = false;
    }

    this.light = new THREE.PointLight(0xffb56a, 3.1, 6.2, 2);
    this.light.position.set(0.05, h * 0.58, -0.05);
    this.light.castShadow = false;
    this.root.add(this.light);
    this.glow = makeGlow(this.root, m, [0.15, h * 0.55, 0.16], 0xffc48a, 1.35, 0.42);
    this.anchor = new THREE.Object3D();
    this.anchor.position.set(0, h * 0.62, 0.2);
    this.root.add(this.anchor);

    this.root.traverse((child) => {
      child.userData.portal = 'journey';
    });
    this.closedAngle = -0.18;
    this.openAngle = -1.22;
  }

  /** World-space slab just inside the room, in front of the leaf. */
  containsApproach(x, z) {
    const dx = x - this.root.position.x;
    const dz = z - this.root.position.z;
    const yaw = this.root.rotation.y;
    const localX = dx * Math.cos(yaw) - dz * Math.sin(yaw);
    const localZ = dx * Math.sin(yaw) + dz * Math.cos(yaw);
    return localZ > 0.25 && localZ < 1.15 && Math.abs(localX) < 0.48;
  }

  open() {
    if (this.opening) return;
    this.opening = true;
    this.openStarted = performance.now();
  }

  update(seconds) {
    const pulse = this.reducedMotion ? 0 : Math.sin(seconds * 1.5) * 0.08;
    this.rim.opacity = 0.72 + pulse;
    this.glow.material.opacity = 0.36 + pulse * 0.5;
    if (!this.opening) {
      this.hinge.rotation.y = this.closedAngle;
      this.light.intensity = 3.1 + (this.reducedMotion ? 0 : Math.sin(seconds * 1.7) * 0.28);
      return;
    }
    const duration = this.reducedMotion ? 1 : 880;
    const t = Math.min(1, (performance.now() - this.openStarted) / duration);
    const eased = t * t * (3 - 2 * t);
    this.hinge.rotation.y = this.closedAngle + (this.openAngle - this.closedAngle) * eased;
    this.light.intensity = 3.1 + eased * 6.5;
  }
}

function doorwayWash() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  const sky = ctx.createLinearGradient(0, 0, 0, 512);
  sky.addColorStop(0, '#fff6df');
  sky.addColorStop(0.45, '#f0c48a');
  sky.addColorStop(1, '#8a5a42');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 256, 512);
  const sun = ctx.createRadialGradient(160, 150, 8, 160, 150, 140);
  sun.addColorStop(0, 'rgba(255,252,230,.95)');
  sun.addColorStop(1, 'rgba(255,220,160,0)');
  ctx.fillStyle = sun;
  ctx.fillRect(0, 0, 256, 512);
  ctx.fillStyle = 'rgba(48,42,36,.35)';
  ctx.beginPath();
  ctx.moveTo(0, 360);
  for (let x = 0; x <= 256; x += 16) ctx.lineTo(x, 330 + Math.sin(x * 0.05) * 16);
  ctx.lineTo(256, 512);
  ctx.lineTo(0, 512);
  ctx.fill();
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
