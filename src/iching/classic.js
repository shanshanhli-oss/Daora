/**
 * The sixty-four hexagrams of the received Zhou Yi, in King Wen order.
 * 卦辞, 彖传, 象传 and 爻辞 are the classical text, which is public domain.
 * explainZh and explainEn are original DAORA sentences, not quotations.
 * Lines are bottom-up: index 0 is 初爻, index 5 is 上爻.
 * 乾 has 用九 and 坤 has 用六 on `special`. They are not a seventh line.
 */
import { CLASSIC_A } from './classic-a.js';
import { CLASSIC_B } from './classic-b.js';

export const CLASSIC = [...CLASSIC_A, ...CLASSIC_B];

export function classicByNumber(no) {
  const entry = CLASSIC[no - 1];
  if (!entry || entry.no !== no) throw new Error(`Missing classic hexagram ${no}`);
  return entry;
}
