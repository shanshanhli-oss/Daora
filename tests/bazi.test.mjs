import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { computeChart } from '../src/bazi.js';
import { cities, findCity, searchCities } from '../src/cities.js';

const WELCOME = '你出生的那一刻，星辰的位置、大地的湿度、风的走向、你的第一声啼哭，都在天地之间留下了一张唯一的签名。这张签名，叫八字。它不是锁，不是镣铐，不是判决书，它是你的出场设置，是你在这个世界上只能是你而不能是别人的那个东西，接受这件事情，比改变任何事情都更需要勇气。';

test('welcome page contains the oath exactly', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.equal(html.includes(WELCOME), true);
});

test('London 1998-06-18 07:30 BST converts to 14:30 Beijing time', () => {
  const chart = computeChart({ year: 1998, month: 6, day: 18, hour: 7, minute: 30, longitude: -0.1278, timeZone: 'Europe/London' });
  assert.equal(chart.local.label, '1998-06-18 07:30');
  assert.equal(chart.local.offset, 'UTC+1');
  assert.equal(chart.beijing.label, '1998-06-18 14:30');
  assert.equal(chart.beijing.offset, 'UTC+8');
  assert.deepEqual(chart.pillars, { year: '戊寅', month: '戊午', day: '丙申', hour: '乙未' });
  assert.deepEqual(chart.counts, { 金: 1, 木: 2, 水: 0, 火: 2, 土: 3 });
  assert.equal(chart.dominant, '土');
  assert.equal(chart.trueSolar.hour, 6);
  assert.ok(chart.trueSolar.minute >= 20 && chart.trueSolar.minute <= 40);
});

test('historical Chinese daylight saving is applied, not a fixed UTC+8', () => {
  const fromLondon = computeChart({ year: 1990, month: 7, day: 1, hour: 12, minute: 0, longitude: -0.1278, timeZone: 'Europe/London' });
  assert.equal(fromLondon.beijing.label, '1990-07-01 20:00');
  assert.equal(fromLondon.beijing.offset, 'UTC+9');
  const inShanghai = computeChart({ year: 1990, month: 7, day: 1, hour: 12, minute: 0, longitude: 121.47, timeZone: 'Asia/Shanghai' });
  assert.equal(inShanghai.local.offset, 'UTC+9');
  assert.equal(inShanghai.beijing.label, '1990-07-01 12:00');
});

test('winter London is UTC+0 and lands an hour later in Beijing', () => {
  const chart = computeChart({ year: 1998, month: 1, day: 15, hour: 7, minute: 30, longitude: -0.1278, timeZone: 'Europe/London' });
  assert.equal(chart.local.offset, 'UTC+0');
  assert.equal(chart.beijing.label, '1998-01-15 15:30');
});

test('year and month pillars change at 立春, not at midnight or lunar new year', () => {
  const before = computeChart({ year: 2024, month: 2, day: 4, hour: 16, minute: 0, longitude: 116.4074, timeZone: 'Asia/Shanghai' });
  const after = computeChart({ year: 2024, month: 2, day: 4, hour: 16, minute: 30, longitude: 116.4074, timeZone: 'Asia/Shanghai' });
  assert.deepEqual(before.pillars, { year: '癸卯', month: '乙丑', day: '戊戌', hour: '庚申' });
  assert.equal(after.pillars.year, '甲辰');
  assert.equal(after.pillars.month, '丙寅');
  assert.equal(after.pillars.day, '戊戌');
});

test('month pillar changes at 惊蛰 while the year pillar stays', () => {
  const before = computeChart({ year: 1998, month: 3, day: 6, hour: 2, minute: 57, second: 14, longitude: 116.4, timeZone: 'Asia/Shanghai' });
  const after = computeChart({ year: 1998, month: 3, day: 6, hour: 2, minute: 57, second: 15, longitude: 116.4, timeZone: 'Asia/Shanghai' });
  assert.equal(before.pillars.year, '戊寅');
  assert.equal(after.pillars.year, '戊寅');
  assert.equal(before.pillars.month, '甲寅');
  assert.equal(after.pillars.month, '乙卯');
  assert.equal(before.pillars.hour, after.pillars.hour);
});

test('known Beijing dates agree with lunar-javascript solar-term pillars', () => {
  const cases = [
    ['1990-01-01 00:00', { year: '己巳', month: '丙子', day: '丙寅', hour: '戊子' }],
    ['2000-01-01 00:00', { year: '己卯', month: '丙子', day: '戊午', hour: '壬子' }],
    ['1984-02-04 23:00', { year: '癸亥', month: '乙丑', day: '戊辰', hour: '甲子' }],
    ['1984-02-05 00:00', { year: '甲子', month: '丙寅', day: '己巳', hour: '甲子' }],
  ];
  for (const [stamp, expected] of cases) {
    const [date, time] = stamp.split(' ');
    const [year, month, day] = date.split('-').map(Number);
    const [hour, minute] = time.split(':').map(Number);
    const chart = computeChart({ year, month, day, hour, minute, longitude: 116.4, timeZone: 'Asia/Shanghai' });
    assert.deepEqual(chart.pillars, expected, stamp);
  }
});

test('city gazetteer covers the requested places and resolves uniquely', () => {
  assert.ok(cities.length >= 300);
  for (const name of ['London', 'Brighton', 'Manchester', 'Edinburgh', 'Shanghai', '北京', '成都']) {
    const city = findCity(name);
    assert.ok(city, name);
    assert.equal(Number.isFinite(city.lat), true);
    assert.equal(Number.isFinite(city.lon), true);
    assert.match(city.tz, /\//);
  }
  assert.equal(findCity('London').tz, 'Europe/London');
  assert.equal(findCity('Edinburgh').name, 'Edinburgh');
  assert.equal(findCity('Urumqi').tz, 'Asia/Urumqi');
  assert.equal(findCity('Perth'), null);
  const perth = searchCities('Perth').map((city) => city.country).sort();
  assert.deepEqual(perth, ['Australia', 'United Kingdom']);
});
