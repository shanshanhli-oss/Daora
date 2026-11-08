import * as THREE from 'three';
import { box, cylinder, sphere, torus, lathe, tube } from './geometry.js';

const GOLD = 0xd4b06a;
const WOOD = 0x6b4632;
const INK = 0x1c1a22;

function material(color, extra = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.08, ...extra });
}

function gold() {
  return material(GOLD, { metalness: 0.82, roughness: 0.28, emissive: 0x3a2a10, emissiveIntensity: 0.15 });
}

/** Build one chart furnishing. The group's feet sit on y = 0. */
export function createPropModel(kind, variant) {
  const group = new THREE.Group();
  group.name = `furnish-${kind}`;
  if (kind === 'books') buildBooks(group);
  else if (kind === 'qin') buildQin(group);
  else if (kind === 'treasure') buildTreasure(group, variant);
  else if (kind === 'seal') buildSeal(group);
  else if (kind === 'travel') buildTravel(group, variant);
  else if (kind === 'plants') buildPlant(group);
  else if (kind === 'water') buildWater(group);
  else if (kind === 'scroll') buildScroll(group);
  else if (kind === 'incense') buildIncense(group);
  return group;
}

function buildBooks(group) {
  const wood = material(0x3d2a22, { roughness: 0.72 });
  const brass = gold();
  box(group, wood, [0.92, 0.06, 0.34], [0, 0.42, 0], 0.01);
  box(group, wood, [0.92, 0.06, 0.34], [0, 0.86, 0], 0.01);
  for (const x of [-0.44, 0.44]) box(group, wood, [0.05, 0.9, 0.32], [x, 0.46, 0], 0.008);
  const colors = [0x6e3b3b, 0x2f4a44, 0x8a7044, 0x3a3a55, 0x704838];
  let x = -0.34;
  for (let i = 0; i < 5; i += 1) {
    const width = 0.09 + (i % 2) * 0.02;
    const height = 0.28 + (i % 3) * 0.04;
    const book = box(group, material(colors[i]), [width, height, 0.22], [x, 0.45 + height / 2, 0], 0.004);
    book.userData.action = 'book';
    box(book, material(0xf3ead4, { roughness: 0.9 }), [width * 0.82, height * 0.9, 0.2], [0, 0, 0.01]);
    x += width + 0.03;
  }
  const folio = box(group, material(0x245c4a), [0.28, 0.05, 0.2], [0.1, 0.92, 0], 0.004);
  folio.userData.action = 'book';
  box(group, brass, [0.9, 0.012, 0.012], [0, 0.46, 0.16]);
}

function buildQin(group) {
  const body = material(0x4a2e22, { roughness: 0.42, metalness: 0.05 });
  const board = box(group, body, [1.22, 0.06, 0.32], [0, 0.3, 0], 0.03);
  const top = box(group, material(0x7a5340, { roughness: 0.35 }), [1.1, 0.016, 0.24], [0, 0.34, 0], 0.012);
  top.userData.qinBody = true;
  for (const x of [-0.46, 0.46]) {
    cylinder(group, material(0x2a211c), [0.055, 0.08], 0.28, [x, 0.15, 0], 10);
  }
  const strings = [];
  for (let i = 0; i < 7; i += 1) {
    const z = -0.09 + i * 0.03;
    const string = box(group, gold(), [0.98, 0.006, 0.006], [0, 0.36, z]);
    string.userData.string = i;
    strings.push(string);
  }
  cylinder(group, material(0x1a1a1a), 0.012, 0.16, [-0.48, 0.33, 0], 8).rotation.z = Math.PI / 2;
  cylinder(group, gold(), 0.018, 0.12, [0.46, 0.33, 0], 8).rotation.z = Math.PI / 2;
  group.userData.strings = strings;
}

function buildTreasure(group, variant) {
  if (variant === 'toad') {
    const skin = gold();
    sphere(group, skin, 0.16, [0, 0.2, 0], [1.3, 0.7, 1]);
    sphere(group, skin, 0.09, [0.1, 0.28, 0.06], [1, 0.8, 1.1]);
    sphere(group, material(0x1a140c), 0.015, [0.14, 0.32, 0.12]);
    sphere(group, material(0x1a140c), 0.015, [0.08, 0.32, 0.14]);
    box(group, material(0x6a1f24, { roughness: 0.4 }), [0.08, 0.02, 0.06], [0.02, 0.34, 0]);
    cylinder(group, material(0x2c2418), 0.2, 0.04, [0, 0.04, 0], 20);
    return;
  }
  lathe(group, gold(), [[0.05, 0], [0.16, 0], [0.2, 0.08], [0.18, 0.16], [0.1, 0.2], [0.08, 0.22], [0, 0.22]], [0, 0.02, 0]);
  sphere(group, material(0xf2d48a, { metalness: 0.7, roughness: 0.25, emissive: 0x6a4a10, emissiveIntensity: 0.25 }), 0.045, [0, 0.16, 0]);
  torus(group, gold(), 0.12, 0.012, [0, 0.05, 0], [Math.PI / 2, 0, 0]);
}

function buildSeal(group) {
  const stone = material(0xc45a4a, { roughness: 0.28, metalness: 0.12 });
  box(group, material(0x3a2c24), [0.28, 0.04, 0.2], [0, 0.16, 0], 0.01);
  box(group, stone, [0.1, 0.12, 0.1], [0, 0.24, 0], 0.008);
  box(group, gold(), [0.11, 0.015, 0.11], [0, 0.31, 0]);
  box(group, material(0xf6f0e4, { roughness: 0.85 }), [0.16, 0.008, 0.12], [0.02, 0.185, 0.02]);
}

function buildTravel(group, variant) {
  if (variant === 'globe') {
    const stand = gold();
    sphere(group, material(0x1c3348, { roughness: 0.4, metalness: 0.25 }), 0.16, [0, 0.42, 0]);
    torus(group, stand, 0.17, 0.008, [0, 0.42, 0], [Math.PI / 2.2, 0.4, 0]);
    cylinder(group, stand, 0.02, 0.22, [0, 0.2, 0], 8);
    cylinder(group, material(0x3a2c24), 0.1, 0.03, [0, 0.04, 0], 16);
    return;
  }
  const paper = material(0xe7d7b0, { roughness: 0.9 });
  box(group, material(0x3d2a22), [0.46, 0.03, 0.32], [0, 0.2, 0], 0.008);
  const sheet = box(group, paper, [0.4, 0.008, 0.26], [0, 0.22, 0]);
  sheet.rotation.z = -0.04;
  tube(group, material(INK), [[-0.12, 0.24, -0.04], [0, 0.24, 0.02], [0.12, 0.24, -0.02]], 0.004);
  cylinder(group, gold(), 0.012, 0.42, [-0.22, 0.22, 0], 8).rotation.z = Math.PI / 2;
}

function buildPlant(group) {
  lathe(group, material(0x6d7c62, { roughness: 0.62 }), [[0.04, 0], [0.1, 0], [0.12, 0.08], [0.09, 0.16], [0.07, 0.16], [0, 0.14]], [0, 0, 0]);
  for (let i = 0; i < 6; i += 1) {
    const angle = (i / 6) * Math.PI * 2;
    const leaf = box(group, material(i % 2 ? 0x3f6b45 : 0x6ea15a, { roughness: 0.7 }), [0.04, 0.16, 0.08], [Math.cos(angle) * 0.05, 0.28, Math.sin(angle) * 0.05]);
    leaf.rotation.z = Math.cos(angle) * 0.5;
    leaf.rotation.x = Math.sin(angle) * 0.4;
  }
}

function buildWater(group) {
  lathe(group, material(0xd7e4ea, { roughness: 0.18, metalness: 0.05 }), [[0.06, 0], [0.16, 0.02], [0.18, 0.08], [0.14, 0.1], [0, 0.1]], [0, 0.02, 0]);
  cylinder(group, material(0x7eb0c8, { roughness: 0.08, metalness: 0.15, transparent: true, opacity: 0.85 }), 0.11, 0.02, [0, 0.1, 0], 24);
}

function buildScroll(group) {
  cylinder(group, gold(), 0.025, 0.46, [0, 0.72, 0], 12).rotation.z = Math.PI / 2;
  cylinder(group, gold(), 0.025, 0.46, [0, 0.28, 0], 12).rotation.z = Math.PI / 2;
  box(group, material(0xf4ecd8, { roughness: 0.88 }), [0.4, 0.42, 0.012], [0, 0.5, 0]);
  box(group, material(INK), [0.02, 0.22, 0.014], [-0.06, 0.52, 0.01]);
  box(group, material(INK), [0.02, 0.16, 0.014], [0.04, 0.48, 0.01]);
  for (const x of [-0.16, 0.16]) cylinder(group, material(0x3a2c24), 0.015, 0.7, [x, 0.36, -0.04], 6);
}

function buildIncense(group) {
  lathe(group, material(0x8d8f86, { metalness: 0.45, roughness: 0.35 }), [[0.02, 0], [0.1, 0], [0.12, 0.04], [0.08, 0.1], [0.05, 0.14], [0.07, 0.16], [0, 0.16]], [0, 0.02, 0]);
  cylinder(group, material(0xc4a574, { roughness: 0.8 }), 0.008, 0.12, [0, 0.24, 0], 6);
  const smoke = sphere(group, material(0xe6dcc4, { transparent: true, opacity: 0.28, roughness: 1 }), 0.03, [0, 0.36, 0]);
  smoke.name = 'incense-smoke';
}
