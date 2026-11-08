import assert from 'node:assert/strict';
import test from 'node:test';
import { computeChart } from '../src/bazi.js';
import { computeZiwei, locateHoroscope, shichenIndex } from '../src/ziwei.js';

test('shichen index keeps early zi, hour double-hours, and late zi apart', () => {
  assert.equal(shichenIndex(0, 30), 0);
  assert.equal(shichenIndex(14, 30), 7);
  assert.equal(shichenIndex(23, 30), 12);
  assert.throws(() => shichenIndex(24, 0), (error) => error.code === 'unknown-hour');
});

test('London 1998-06-18 14:30 Beijing is the 未时 Zi Wei chart from iztro', () => {
  const birth = computeChart({ year: 1998, month: 6, day: 18, hour: 7, minute: 30, longitude: -0.1278, timeZone: 'Europe/London' });
  assert.equal(birth.beijing.label, '1998-06-18 14:30');
  const female = computeZiwei({ ...birth.pillarClock, gender: '女' });
  const male = computeZiwei({ ...birth.pillarClock, gender: '男' });
  assert.equal(female.available, true);
  assert.equal(female.engine.name, 'iztro');
  assert.equal(female.shichenIndex, 7);
  assert.equal(female.shichen, '未时');
  assert.equal(female.timeRange, '13:00~15:00');
  assert.equal(female.fiveElementsClass, '水二局');
  assert.equal(female.soul, '巨门');
  assert.equal(female.body, '天梁');
  assert.equal(female.soulBranch, '亥');
  assert.equal(female.bodyBranch, '丑');
  assert.equal(female.palaces.length, 12);
  const life = female.palaces.find((palace) => palace.name === '命宫');
  const spouse = female.palaces.find((palace) => palace.name === '夫妻');
  const fortune = female.palaces.find((palace) => palace.name === '福德');
  assert.equal(life.branch, '亥');
  assert.deepEqual(life.major.map((star) => star.name), []);
  assert.ok(life.minor.some((star) => star.name === '文曲'));
  assert.deepEqual(spouse.major.map((star) => star.name), ['武曲', '七杀']);
  assert.deepEqual(fortune.major.map((star) => star.name), ['紫微', '破军']);
  assert.equal(female.transformations.length, 4);
  const parents = (chart) => chart.palaces.find((palace) => palace.name === '父母').decadal.range.join('-');
  assert.equal(parents(female), '112-121');
  assert.equal(parents(male), '12-21');
  assert.equal(computeZiwei({ ...birth.pillarClock }).available, false);
});

test('late zi stays on the same solar date, and leap-month fixLeap changes the life palace', () => {
  const late = computeZiwei({ year: 1998, month: 6, day: 18, hour: 23, minute: 30, gender: '女' });
  assert.equal(late.shichen, '晚子时');
  assert.match(late.lunarDate, /五月廿四/);
  const earlyNext = computeZiwei({ year: 1998, month: 6, day: 19, hour: 0, minute: 30, gender: '女' });
  assert.equal(earlyNext.shichen, '早子时');
  assert.match(earlyNext.lunarDate, /五月廿五/);
  const leap = computeZiwei({ year: 2023, month: 3, day: 22, hour: 11, minute: 0, gender: '女' });
  assert.match(leap.lunarDate, /闰/);
  const afterTrue = computeZiwei({ year: 2023, month: 4, day: 6, hour: 12, minute: 0, gender: '女', fixLeap: true });
  const afterFalse = computeZiwei({ year: 2023, month: 4, day: 6, hour: 12, minute: 0, gender: '女', fixLeap: false });
  assert.equal(afterTrue.palaces.find((palace) => palace.name === '命宫').branch, '戌');
  assert.equal(afterTrue.fiveElementsClass, '水二局');
  assert.equal(afterFalse.palaces.find((palace) => palace.name === '命宫').branch, '酉');
  assert.equal(afterFalse.fiveElementsClass, '木三局');
  const located = locateHoroscope({ year: 1998, month: 6, day: 18, hour: 14, minute: 30, gender: '女' }, '2026-01-01');
  assert.equal(typeof located.decadal, 'string');
  assert.equal(located.decadal.length > 0, true);
  assert.equal(located.yearly.length > 0, true);
});
