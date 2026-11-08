import assert from 'node:assert/strict';
import test from 'node:test';
import { assemble, book, dailyHexagram, dailyIndex, drawAnswer, drawLot, lineFromCoins, tossCoins } from '../src/landing/hexagrams.js';

const TITLES = ['初', '二', '三', '四', '五', '上'];

test('all sixty-four hexagrams carry six classical lines and original explanations', () => {
  assert.equal(book.length, 64);
  assert.equal(new Set(book.map((entry) => entry.key)).size, 64);
  assert.equal(new Set(book.map((entry) => entry.symbol)).size, 64);
  for (const entry of book) {
    assert.equal(entry.lines.length, 6, entry.name);
    assert.ok(entry.judgment.length > 1, entry.name);
    assert.ok(entry.tuan.length > 8, entry.name);
    assert.ok(entry.image.length > 4, entry.name);
    assert.ok(entry.explainZh.length > 8);
    assert.ok(entry.explainEn.length > 8);
    assert.notEqual(entry.explainZh, entry.judgment);
    assert.equal(entry.symbol, String.fromCodePoint(0x4dbf + entry.no));
    entry.lines.forEach((line, index) => {
      assert.ok(line.text.length > 1, `${entry.name} ${index}`);
      assert.ok(line.explainZh.length > 2);
      assert.ok(line.explainEn.length > 2);
      assert.notEqual(line.explainZh, line.text);
      assert.equal(line.yang, entry.key[index] === '1');
      if (index === 0) assert.match(line.title, /^初[九六]$/);
      else if (index === 5) assert.match(line.title, /^上[九六]$/);
      else assert.equal(line.title[1], TITLES[index]);
    });
  }
  assert.equal(book[0].lines[0].title, '初九');
  assert.equal(book[0].lines[5].title, '上九');
  assert.equal(book[1].lines[0].title, '初六');
  assert.match(book[0].special.text, /群龙无首/);
  assert.match(book[1].special.text, /利永贞/);
});

test('moving lines keep the primary line text and build the changed figure', () => {
  const lines = [
    lineFromCoins([3, 3, 3]),
    lineFromCoins([2, 2, 2]),
    lineFromCoins([3, 2, 2]),
    lineFromCoins([3, 3, 2]),
    lineFromCoins([3, 2, 2]),
    lineFromCoins([3, 3, 2]),
  ];
  const cast = assemble(lines);
  assert.equal(cast.primary.name, '水火既济');
  assert.equal(cast.changed.name, '水风井');
  assert.equal(cast.moving.length, 2);
  assert.equal(cast.primary.lines[0].text.includes('曳其轮') || cast.primary.lines[0].text.includes('濡其尾'), true);
  assert.ok(cast.changed.judgment.length > 1);
  assert.equal(cast.primary.lines.length, 6);
  assert.equal(cast.changed.lines.length, 6);

  const still = assemble(Array.from({ length: 6 }, () => lineFromCoins([2, 3, 3])));
  assert.equal(still.changed, null);
  assert.equal(still.moving.length, 0);
});

test('a rigged coin toss and a daily figure are stable', () => {
  let step = 0;
  const line = tossCoins(() => [0.1, 0.9, 0.2][step++]);
  assert.deepEqual(line.coins, [2, 3, 2]);
  assert.equal(line.sum, 7);
  assert.equal(line.moving, false);
  assert.equal(dailyIndex('2026-11-08'), dailyIndex('2026-11-08'));
  assert.equal(dailyHexagram('2026-11-08').no, book[dailyIndex('2026-11-08')].no);
  assert.equal(drawLot(() => 0).no, 1);
  const answer = drawAnswer(() => 0);
  assert.equal(answer.entry.no, 1);
  assert.equal(answer.line.index, 0);
  assert.match(answer.zh, /潜龙/);
});
