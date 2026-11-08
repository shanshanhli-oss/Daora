import assert from 'node:assert/strict';
import test from 'node:test';
import { LAYOUT_KEY, chooseSnap, readLayout, writeLayout } from '../src/placement.js';

const shelf = { y: 1.16, minX: 3.8, maxX: 5.1, minZ: -4, maxZ: -3.2 };

test('a downward ray lands on the floor inside the room', () => {
  const snap = chooseSnap({ x: 0, y: 4, z: 1 }, { x: 0, y: -1, z: 0 }, [shelf]);
  assert.equal(snap.surface, 'floor');
  assert.equal(snap.y, 0);
  assert.equal(snap.x, 0);
  assert.equal(snap.z, 1);
});

test('a ray that meets a shelf before the floor snaps to the shelf', () => {
  const snap = chooseSnap({ x: 4.2, y: 3, z: -3.6 }, { x: 0, y: -1, z: 0 }, [shelf]);
  assert.equal(snap.surface, 'shelf');
  assert.equal(snap.y, 1.16);
  assert.equal(snap.x, 4.2);
});

test('a floor point outside the room is clamped', () => {
  const snap = chooseSnap({ x: 0, y: 2, z: 0 }, { x: 1, y: -0.2, z: 0 }, []);
  assert.equal(snap.surface, 'floor');
  assert.ok(snap.x <= 4.7);
});

test('layout round-trips and drops bad entries', () => {
  const memory = new Map();
  const storage = {
    getItem: (key) => memory.get(key) || null,
    setItem: (key, value) => memory.set(key, value),
  };
  writeLayout({ desk: { x: 1, y: 0, z: -1, surface: 'floor' }, bad: { x: 'no' } }, storage);
  assert.equal(memory.has(LAYOUT_KEY), true);
  const layout = readLayout(storage);
  assert.deepEqual(layout.desk, { x: 1, y: 0, z: -1, surface: 'floor' });
  assert.equal(layout.bad, undefined);
  assert.deepEqual(readLayout({ getItem: () => '{' }), {});
});
