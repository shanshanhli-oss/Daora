import assert from 'node:assert/strict';
import test from 'node:test';
import { SETTINGS_KEY, SYSTEM_PROMPT, createReading, templateReading, usableEndpoint, writeSettings } from '../src/reading.js';

const bazi = {
  kind: 'bazi',
  dayMaster: '丙',
  element: '火',
  pillars: { year: '戊寅', month: '戊午', day: '丙申', hour: '乙未' },
  tenGods: { year: '食神', month: '食神', day: '日主', hour: '正印' },
  dominant: '火',
  scores: '木1 火2 土3 金4 水5',
  gods: '戊寅 食神',
};

test('without an endpoint the reading is the local template and fetch is not called', async () => {
  let called = false;
  const result = await createReading(bazi, {}, { fetchImpl: () => { called = true; } });
  assert.equal(called, false);
  assert.equal(result.source, 'template');
  assert.match(result.text, /丙/);
  assert.match(result.text, /火/);
  assert.match(templateReading(bazi, 'en'), /Day master 丙/);
});

test('a key is sent only as a header and never inside the prompt', async () => {
  const secret = 'sk-test-should-not-leak';
  let seen;
  const result = await createReading(bazi, {
    endpoint: 'https://example.test/v1/chat/completions',
    model: 'local',
    apiKey: secret,
  }, {
    fetchImpl: async (url, options) => {
      seen = { url, options };
      assert.equal(options.headers.Authorization, `Bearer ${secret}`);
      assert.equal(options.body.includes(secret), false);
      assert.match(options.body, /丙/);
      const parsed = JSON.parse(options.body);
      assert.equal(parsed.messages[0].content, SYSTEM_PROMPT);
      return { ok: true, json: async () => ({ choices: [{ message: { content: '一段对照。' } }] }) };
    },
  });
  assert.equal(result.source, 'model');
  assert.equal(result.text, '一段对照。');
  assert.equal(seen.url.startsWith('https://'), true);
});

test('a failed endpoint falls back to the template', async () => {
  const result = await createReading(bazi, { endpoint: 'https://example.test/v1/chat/completions' }, {
    fetchImpl: async () => { throw new Error('offline'); },
  });
  assert.equal(result.source, 'template');
  assert.equal(result.fallback, true);
  assert.match(result.text, /丙/);
});

test('only http endpoints are usable and settings stay local', () => {
  assert.equal(usableEndpoint('https://api.example/v1/chat/completions'), true);
  assert.equal(usableEndpoint('javascript:alert(1)'), false);
  assert.equal(usableEndpoint(''), false);
  const memory = new Map();
  const storage = { getItem: (key) => memory.get(key) || null, setItem: (key, value) => memory.set(key, value) };
  writeSettings({ endpoint: 'https://example.test/v1', model: 'm', apiKey: 'secret' }, storage);
  assert.equal(JSON.parse(memory.get(SETTINGS_KEY)).apiKey, 'secret');
  assert.equal(memory.get(SETTINGS_KEY).includes('OPENAI'), false);
});
