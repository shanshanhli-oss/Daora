import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { assemble, book, drawLot, lineFromCoins, tossCoins } from '../src/landing/hexagrams.js';

const landing = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const sanctuary = readFileSync(new URL('../sanctuary.html', import.meta.url), 'utf8');
const hero = readFileSync(new URL('../src/landing/hero.js', import.meta.url), 'utf8');
const divine = readFileSync(new URL('../src/landing/divine.js', import.meta.url), 'utf8');

test('landing keeps the oath on the sanctuary entry and links the reading there', () => {
  const oath = '这张签名，叫八字';
  assert.equal(sanctuary.includes(oath), true);
  assert.equal(landing.includes('观天之道'), true);
  assert.equal(landing.includes('执天之行'), true);
  assert.equal(landing.includes('href="sanctuary.html"'), true);
  assert.equal(landing.includes('Design by DAORA'), true);
  assert.match(landing, /三枚铜钱连掷六次/);
  assert.match(landing, /自下而上/);
  assert.match(landing, /动爻/);
  assert.match(landing, /变卦/);
  assert.match(landing, /六十四卦/);
});

test('motion can be turned down to a still instrument', () => {
  assert.match(hero, /prefers-reduced-motion/);
  assert.match(divine, /reduced/);
});

test('the sixty-four figures are unique and the coin values are the traditional ones', () => {
  assert.equal(book.length, 64);
  assert.equal(new Set(book.map((entry) => entry.key)).size, 64);
  assert.equal(book.find((entry) => entry.no === 1).key, '111111');
  assert.equal(book.find((entry) => entry.no === 2).key, '000000');
  assert.equal(book.find((entry) => entry.name === '泽风大过').key, '011110');
  assert.equal(lineFromCoins([3, 3, 3]).sum, 9);
  assert.equal(lineFromCoins([3, 3, 3]).moving, true);
  assert.equal(lineFromCoins([3, 3, 3]).kind, 'yang');
  assert.equal(lineFromCoins([2, 2, 2]).sum, 6);
  assert.equal(lineFromCoins([2, 2, 2]).kind, 'yin');
  assert.equal(lineFromCoins([3, 2, 2]).sum, 7);
  assert.equal(lineFromCoins([3, 2, 2]).moving, false);
  assert.equal(lineFromCoins([3, 3, 2]).sum, 8);
  assert.equal(lineFromCoins([3, 3, 2]).kind, 'yin');
});

test('lines stack bottom-up and only old yin and old yang become the changed figure', () => {
  const still = assemble([
    lineFromCoins([2, 3, 3]),
    lineFromCoins([3, 2, 2]),
    lineFromCoins([3, 2, 2]),
    lineFromCoins([3, 2, 2]),
    lineFromCoins([3, 2, 2]),
    lineFromCoins([2, 3, 3]),
  ]);
  assert.equal(still.primary.name, '泽风大过');
  assert.equal(still.changed, null);
  assert.equal(still.nuclear.name, '乾为天');
  assert.equal(still.moving.length, 0);

  const moving = assemble([
    lineFromCoins([3, 3, 3]),
    lineFromCoins([2, 2, 2]),
    lineFromCoins([3, 2, 2]),
    lineFromCoins([3, 3, 2]),
    lineFromCoins([3, 2, 2]),
    lineFromCoins([3, 3, 2]),
  ]);
  assert.equal(moving.primary.name, '水火既济');
  assert.equal(moving.changed.name, '水风井');
  assert.deepEqual(moving.moving.map((item) => item.index), [0, 1]);
});

test('a lot is one of the sixty-four and a rigged toss is reproducible', () => {
  let step = 0;
  const values = [0.1, 0.9, 0.2];
  const line = tossCoins(() => values[step++]);
  assert.deepEqual(line.coins, [2, 3, 2]);
  assert.equal(line.sum, 7);
  const lot = drawLot(() => 0);
  assert.equal(lot.no, 1);
});
