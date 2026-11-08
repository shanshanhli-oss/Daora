/**
 * Drag snapping for room objects.
 * A ray is { origin: {x,y,z}, direction: {x,y,z} }.
 * Shelves are axis-aligned rectangles on a horizontal plane.
 * The nearest hit in front of the camera wins. Shelf hits stay on the shelf.
 * Floor hits are clamped to the walkable room. y of a floor snap is 0,
 * because prop groups are built with their feet on the local origin.
 */

export const LAYOUT_KEY = 'daora-prop-layout-v1';

export const ROOM_BOUNDS = { minX: -4.7, maxX: 4.7, minZ: -3.7, maxZ: 3.9 };

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function chooseSnap(origin, direction, shelves = [], bounds = ROOM_BOUNDS) {
  if (!origin || !direction) return null;
  const hits = [];
  if (direction.y < -1e-6) {
    const t = (0 - origin.y) / direction.y;
    if (t > 0) {
      hits.push({
        t,
        x: origin.x + direction.x * t,
        y: 0,
        z: origin.z + direction.z * t,
        surface: 'floor',
      });
    }
  }
  for (const shelf of shelves) {
    if (Math.abs(direction.y) < 1e-8) continue;
    const t = (shelf.y - origin.y) / direction.y;
    if (t <= 0) continue;
    const x = origin.x + direction.x * t;
    const z = origin.z + direction.z * t;
    if (x < shelf.minX || x > shelf.maxX || z < shelf.minZ || z > shelf.maxZ) continue;
    hits.push({ t, x, y: shelf.y, z, surface: 'shelf' });
  }
  hits.sort((a, b) => a.t - b.t);
  const hit = hits[0];
  if (!hit) return null;
  if (hit.surface === 'floor') {
    return {
      x: clamp(hit.x, bounds.minX, bounds.maxX),
      y: 0,
      z: clamp(hit.z, bounds.minZ, bounds.maxZ),
      surface: 'floor',
    };
  }
  return { x: hit.x, y: hit.y, z: hit.z, surface: 'shelf' };
}

export function readLayout(storage) {
  try {
    const raw = JSON.parse(storage.getItem(LAYOUT_KEY) || 'null');
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
    const layout = {};
    for (const [id, value] of Object.entries(raw)) {
      if (!value || ![value.x, value.y, value.z].every((n) => Number.isFinite(n))) continue;
      layout[id] = { x: value.x, y: value.y, z: value.z, surface: value.surface === 'shelf' ? 'shelf' : 'floor' };
    }
    return layout;
  } catch {
    return {};
  }
}

export function writeLayout(layout, storage) {
  storage.setItem(LAYOUT_KEY, JSON.stringify(layout));
}
