import assert from 'node:assert/strict';
import test from 'node:test';
import { ELEMENT_THEMES, chooseStrongest, computeChart, dominantElement, scoreElements } from '../src/bazi.js';

test('the five room styles exist and the London chart still resolves to earth', () => {
  assert.deepEqual(Object.keys(ELEMENT_THEMES).sort(), ['土', '木', '水', '火', '金'].sort());
  const chart = computeChart({ year: 1998, month: 6, day: 18, hour: 7, minute: 30, longitude: -0.1278, timeZone: 'Europe/London' });
  assert.equal(chart.dominant, '土');
  assert.equal(chart.strength.rule, 'wuxing-strength-v1');
  assert.equal(chart.strength.strongest, '土');
  assert.ok(chart.strength.scores.土 > chart.strength.scores.火);
});

test('weighted strength can disagree with a plain eight-character count', () => {
  const pillars = { year: '戊午', month: '庚午', day: '庚申', hour: '庚申' };
  const counts = { 金: 5, 木: 0, 水: 0, 火: 2, 土: 1 };
  assert.equal(dominantElement(counts), '金');
  const scored = scoreElements(pillars, counts);
  assert.equal(scored.monthBranch, '午');
  assert.equal(scored.strongest, '土');
  assert.ok(scored.scores.土 > scored.scores.金);
});

test('ties prefer the higher plain count, then wood', () => {
  const tied = { 金: 10, 木: 10, 水: 1, 火: 1, 土: 1 };
  assert.equal(chooseStrongest(tied, { 金: 4, 木: 1, 水: 0, 火: 0, 土: 0 }), '金');
  assert.equal(chooseStrongest({ 金: 5, 木: 5, 水: 5, 火: 5, 土: 5 }, { 金: 1, 木: 1, 水: 1, 火: 1, 土: 1 }), '木');
});
