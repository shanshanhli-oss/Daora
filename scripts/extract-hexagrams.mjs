/** One-off dataset extraction: run every 6-bit line pattern through the TaiBu
 *  liuyao engine (method=coins, 7=yang / 8=yin, bottom line first) and record
 *  the resolved hexagram name, palace, element and judgment text.
 *  Output: src/yijing/hexagrams.json — the page never calculates hexagrams itself.
 */
import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const TB = process.env.TAIBU_CLI || '/app/.user/skills/taibu-divination/scripts/taibu.mjs';
const out = {};
for (let bits = 0; bits < 64; bits++) {
  const yaoValues = Array.from({ length: 6 }, (_, i) => ((bits >> i) & 1 ? 7 : 8)); // 初爻 = bit0
  const args = { question: '数据提取', yongShenTargets: ['官鬼'], method: 'coins', yaoValues, date: '2026-01-02T10:00:00' };
  const r = spawnSync('node', [TB, 'call', 'liuyao', '-', '--json'], { input: JSON.stringify(args), encoding: 'utf8', maxBuffer: 1 << 24 });
  if (r.status !== 0) { console.error('FAIL', bits, r.stderr.slice(0, 200)); process.exit(1); }
  const data = JSON.parse(r.stdout);
  const g = data['卦盘']['本卦'];
  const code = Array.from({ length: 6 }, (_, i) => ((bits >> i) & 1 ? '1' : '0')).join('');
  out[code] = { name: g['卦名'], palace: g['卦宫'], element: g['五行'], judgment: g['卦辞'] };
}
const names = new Set(Object.values(out).map((g) => g.name));
if (names.size !== 64) { console.error('expected 64 unique hexagrams, got', names.size); process.exit(1); }
writeFileSync('src/yijing/hexagrams.json', JSON.stringify(out, null, 1) + '\n');
console.log('OK — 64 hexagrams extracted,', JSON.stringify(out).length, 'bytes');
