import assert from 'node:assert/strict';
import test from 'node:test';
import { FURNISHING_RULE_ID, planFurnishings, scoreTenGods } from '../src/furnishings.js';

function chart(over = {}) {
  return {
    dominant: '土',
    dayMaster: '甲',
    pillars: { year: '甲子', month: '乙丑', day: '丙寅', hour: '丁卯' },
    tenGods: { year: '比肩', month: '劫财', day: '日主', hour: '食神' },
    hidden: { year: [], month: [], day: [], hour: [] },
    strength: { scores: { 木: 10, 火: 10, 土: 40, 金: 8, 水: 8 } },
    ...over,
  };
}

test('the strongest element is copied through as the palette', () => {
  const metal = chart({ dominant: '金', strength: { scores: { 金: 80, 木: 1, 水: 1, 火: 1, 土: 1 } } });
  const plan = planFurnishings(metal, null);
  assert.equal(plan.rule, FURNISHING_RULE_ID);
  assert.equal(plan.palette, '金');
  assert.equal(plan.items.some((item) => item.id === 'books'), false);
});

test('a strong resource star adds books and does not recolour the room', () => {
  const learned = chart({
    dominant: '水',
    tenGods: { year: '比肩', month: '正印', day: '日主', hour: '比肩' },
    strength: { scores: { 水: 30, 木: 4, 火: 4, 土: 4, 金: 4 } },
  });
  assert.ok(scoreTenGods(learned).seal >= 4);
  const plan = planFurnishings(learned, null);
  assert.equal(plan.palette, '水');
  const books = plan.items.find((item) => item.id === 'books');
  assert.ok(books);
  assert.match(books.hintZh, /印星/);
});

test('eating god, wealth, office and the travelling horse each add their object', () => {
  const rich = chart({
    dominant: '火',
    dayMaster: '甲',
    pillars: { year: '甲子', month: '丙寅', day: '戊辰', hour: '壬申' },
    tenGods: { year: '正官', month: '食神', day: '日主', hour: '正官' },
    hidden: {
      year: [{ stem: '癸', god: '正财' }],
      month: [{ stem: '戊', god: '正财' }, { stem: '辛', god: '正财' }],
      day: [],
      hour: [],
    },
    strength: { scores: { 火: 20, 木: 19, 水: 5, 土: 4, 金: 3 } },
  });
  const plan = planFurnishings(rich, null);
  const ids = plan.items.map((item) => item.id);
  assert.ok(ids.includes('qin'), '食神 should bring the qin');
  assert.ok(ids.includes('treasure'));
  assert.equal(plan.items.find((item) => item.id === 'treasure').variant, 'bowl');
  assert.ok(ids.includes('seal'));
  assert.ok(ids.includes('travel'), 'year 子 horse 寅 is on the month');
  assert.equal(plan.items.find((item) => item.id === 'travel').variant, 'map');
  assert.ok(ids.includes('plants'));
  assert.equal(plan.palette, '火');
});

test('a very strong wealth star chooses the toad, and a migration horse chooses a globe', () => {
  const heavy = chart({
    tenGods: { year: '偏财', month: '正财', day: '日主', hour: '偏财' },
    pillars: { year: '乙未', month: '己卯', day: '丙午', hour: '戊子' },
  });
  const ziwei = {
    available: true,
    palaces: [
      { name: '命宫', major: [{ name: '天同' }], minor: [{ name: '文昌' }], adjective: [] },
      { name: '财帛', major: [{ name: '武曲' }], minor: [], adjective: [{ name: '禄存' }] },
      { name: '迁移', major: [], minor: [{ name: '天马' }], adjective: [] },
      { name: '官禄', major: [{ name: '紫微' }], minor: [], adjective: [] },
      { name: '福德', major: [{ name: '太阴' }], minor: [{ name: '文曲' }], adjective: [] },
    ],
  };
  const plan = planFurnishings(heavy, ziwei);
  assert.equal(plan.items.find((item) => item.id === 'treasure').variant, 'toad');
  assert.equal(plan.items.find((item) => item.id === 'travel').variant, 'globe');
  assert.ok(plan.items.some((item) => item.id === 'books'));
  assert.ok(plan.items.some((item) => item.id === 'qin'));
  assert.ok(plan.items.some((item) => item.id === 'seal'));
});

test('wood and water among the top two add plants and a basin', () => {
  const damp = chart({
    dominant: '木',
    strength: { scores: { 木: 22, 水: 21, 火: 3, 土: 2, 金: 1 } },
    tenGods: { year: '比肩', month: '比肩', day: '日主', hour: '比肩' },
    pillars: { year: '丙午', month: '丁巳', day: '戊午', hour: '己未' },
  });
  const plan = planFurnishings(damp, null);
  assert.ok(plan.items.some((item) => item.id === 'plants'));
  assert.ok(plan.items.some((item) => item.id === 'water'));
  assert.equal(plan.palette, '木');
});
