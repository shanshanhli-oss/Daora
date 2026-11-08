/**
 * Traditional six-line cast (六爻) for DAORA.
 * Three coins, six times, lines stacked from the bottom.
 * Old yin (6) and old yang (9) are moving lines and produce the changed figure.
 * glossZh / glossEn are original short images.
 * judgment, tuan, image and lines come from the received Zhou Yi (public domain),
 * with original plain-language explanations attached in src/iching.
 */
import { classicByNumber } from '../iching/classic.js';
import { hexagramSymbol, lineTitle } from '../iching/line.js';

const TRI = {
  乾: '111',
  兑: '110',
  离: '101',
  震: '100',
  巽: '011',
  坎: '010',
  艮: '001',
  坤: '000',
};

/** [number, name, lower trigram, upper trigram, english image, chinese gloss, english gloss] */
const RAW = [
  [1, '乾为天', '乾', '乾', 'Heaven', '六阳相叠，像天空一层层向前运行。', 'Six yang lines, stacked, like a sky that keeps moving.'],
  [2, '坤为地', '坤', '坤', 'Earth', '六阴铺开，像土地把重量轻轻接住。', 'Six yin lines spread out, like ground receiving weight.'],
  [3, '水雷屯', '震', '坎', 'Sprouting', '雷在水下，像幼芽还顶着泥土。', 'Thunder under water, like a sprout still under the soil.'],
  [4, '山水蒙', '坎', '艮', 'Covering', '山下有泉，像事物还罩在一层雾里。', 'A spring under the mountain, things still under a mist.'],
  [5, '水天需', '乾', '坎', 'Waiting', '水在天上，像云层尚未落下。', 'Water above heaven, like clouds that have not yet fallen.'],
  [6, '天水讼', '坎', '乾', 'Dispute', '天与水相背，像两条路各说各的。', 'Heaven and water pull apart, like two paths telling different stories.'],
  [7, '地水师', '坎', '坤', 'A host', '地中有水，像一群人要有个次序。', 'Water held in the earth, a group that needs an order.'],
  [8, '水地比', '坤', '坎', 'Alliance', '水在地上，像彼此靠得很近。', 'Water on the earth, things standing close together.'],
  [9, '风天小畜', '乾', '巽', 'A small gathering', '风行天上，只聚起薄薄的一层。', 'Wind moving in heaven, gathering only a thin layer.'],
  [10, '天泽履', '兑', '乾', 'Treading', '天下有泽，像步子踩在软地上。', 'A lake under heaven, a step placed on soft ground.'],
  [11, '地天泰', '乾', '坤', 'Peace', '地在上、天在下，气息上下往来。', 'Earth above and heaven below, breath moving between them.'],
  [12, '天地否', '坤', '乾', 'Standstill', '天在上、地在下，彼此暂时不交。', 'Heaven above and earth below, not meeting for a while.'],
  [13, '天火同人', '离', '乾', 'Fellowship', '火在天下，像光被众人分享。', 'Fire under heaven, a light held in common.'],
  [14, '火天大有', '乾', '离', 'Great having', '火在天上，像收获被照得很亮。', 'Fire above heaven, a harvest lit brightly.'],
  [15, '地山谦', '艮', '坤', 'Modesty', '山藏在地下，高处自己低下去。', 'A mountain kept under the earth, height lowering itself.'],
  [16, '雷地豫', '坤', '震', 'Delight', '雷出地上，像声音先动了起来。', 'Thunder leaving the earth, a sound starting to move.'],
  [17, '泽雷随', '震', '兑', 'Following', '泽中有雷，像一个跟随另一个。', 'Thunder inside the lake, one movement following another.'],
  [18, '山风蛊', '巽', '艮', 'What has settled', '山下有风，像旧的堆积该被翻开。', 'Wind under the mountain, old settling ready to be opened.'],
  [19, '地泽临', '兑', '坤', 'Approach', '泽上有地，像靠近正在发生。', 'Earth above the lake, a drawing-near that is underway.'],
  [20, '风地观', '坤', '巽', 'Viewing', '风行地上，像从高处慢慢看。', 'Wind over the earth, a slow look from higher up.'],
  [21, '火雷噬嗑', '震', '离', 'Biting through', '雷电交加，像中间有东西要咬开。', 'Thunder and lightning, something in the middle to bite through.'],
  [22, '山火贲', '离', '艮', 'Adornment', '山下有火，光只照亮表面的纹。', 'Fire under the mountain, light on the pattern of a surface.'],
  [23, '山地剥', '坤', '艮', 'Splitting', '山附于地，像一层层剥落。', 'A mountain resting on the earth, layers coming away.'],
  [24, '地雷复', '震', '坤', 'Return', '雷在地中，像一点阳气重新回来。', 'Thunder inside the earth, a little yang coming back.'],
  [25, '天雷无妄', '震', '乾', 'Without pretence', '天下有雷，动作不另找借口。', 'Thunder under heaven, a movement without an extra excuse.'],
  [26, '山天大畜', '乾', '艮', 'Great storing', '天在山中，像很多东西被收着。', 'Heaven held in the mountain, a great deal kept in store.'],
  [27, '山雷颐', '震', '艮', 'Nourishment', '山下有雷，像张口等待喂养。', 'Thunder under the mountain, an open mouth waiting to be fed.'],
  [28, '泽风大过', '巽', '兑', 'Great excess', '泽灭其木，像横梁承受了太多。', 'The lake over the wood, a beam carrying too much.'],
  [29, '坎为水', '坎', '坎', 'Water', '两水相重，像坑里还有坑。', 'Water doubled, a hollow inside a hollow.'],
  [30, '离为火', '离', '离', 'Fire', '两火相续，像光明附着在物上。', 'Fire doubled, brightness clinging to something.'],
  [31, '泽山咸', '艮', '兑', 'Resonance', '山上有泽，像两端彼此感应。', 'A lake on the mountain, two ends answering each other.'],
  [32, '雷风恒', '巽', '震', 'Duration', '雷风相与，像一种节奏愿意长久。', 'Thunder and wind together, a rhythm willing to last.'],
  [33, '天山遁', '艮', '乾', 'Withdrawal', '天下有山，像身影向后退去。', 'A mountain under heaven, a figure stepping back.'],
  [34, '雷天大壮', '乾', '震', 'Great strength', '雷在天上，力量已经很满。', 'Thunder above heaven, strength already full.'],
  [35, '火地晋', '坤', '离', 'Advance', '明出地上，像太阳升过地平。', 'Light leaving the earth, a sun past the horizon.'],
  [36, '地火明夷', '离', '坤', 'Light hidden', '明入地中，光还在，只是被盖住。', 'Light gone into the earth: still there, covered.'],
  [37, '风火家人', '离', '巽', 'Household', '风自火出，像屋里有自己的秩序。', 'Wind born of fire, a house with its own order.'],
  [38, '火泽睽', '兑', '离', 'Opposition', '火向上、泽向下，两方各走各的。', 'Fire rises and the lake sinks; the two go different ways.'],
  [39, '水山蹇', '艮', '坎', 'A limp', '山上有水，路被挡住了。', 'Water on the mountain, the path is blocked.'],
  [40, '雷水解', '坎', '震', 'Release', '雷雨作，像紧的地方松开。', 'Thunder and rain, a tightness letting go.'],
  [41, '山泽损', '兑', '艮', 'Decrease', '山下有泽，一边减，一边才看得见。', 'A lake under the mountain: one side less, so the other can be seen.'],
  [42, '风雷益', '震', '巽', 'Increase', '风雷相助，像增益从外面送来。', 'Wind and thunder helping, an increase arriving from outside.'],
  [43, '泽天夬', '乾', '兑', 'Breakthrough', '泽上于天，像满了之后必须决开。', 'The lake risen over heaven, fullness that has to break.'],
  [44, '天风姤', '巽', '乾', 'A meeting', '天下有风，像不期而遇的一触。', 'Wind under heaven, an unexpected meeting.'],
  [45, '泽地萃', '坤', '兑', 'Gathering', '泽上于地，人群与水都聚拢来。', 'The lake above the earth, people and water gathering.'],
  [46, '地风升', '巽', '坤', 'Ascent', '地中生木，像慢慢往上长。', 'Wood growing in the earth, a slow rise.'],
  [47, '泽水困', '坎', '兑', 'Exhaustion', '泽中无水，像力气暂时用尽。', 'A lake without water, strength used up for now.'],
  [48, '水风井', '巽', '坎', 'The well', '木上有水，像一口井还在原处。', 'Water over wood, a well that stays where it is.'],
  [49, '泽火革', '离', '兑', 'Change', '泽中有火，旧的皮毛要换掉。', 'Fire in the lake, an old hide ready to be changed.'],
  [50, '火风鼎', '巽', '离', 'The cauldron', '木上有火，像鼎在烹煮。', 'Fire over wood, a cauldron cooking.'],
  [51, '震为雷', '震', '震', 'Thunder', '两雷相重，震动来了又来。', 'Thunder doubled, a shock that comes again.'],
  [52, '艮为山', '艮', '艮', 'Mountain', '两山相叠，停在该停的地方。', 'Mountain doubled, a stop where a stop belongs.'],
  [53, '风山渐', '艮', '巽', 'Gradual', '山上有木，像一步一步才站稳。', 'Wood on the mountain, standing firm one step at a time.'],
  [54, '雷泽归妹', '兑', '震', 'The maiden', '泽上有雷，像关系走到一个名分里。', 'Thunder over the lake, a relation arriving at a name.'],
  [55, '雷火丰', '离', '震', 'Abundance', '雷电皆至，明亮而盛大。', 'Thunder and lightning both arrive: bright, and full.'],
  [56, '火山旅', '艮', '离', 'The traveller', '山上有火，像火在不属于它的地方过夜。', 'Fire on the mountain, a flame staying somewhere that is not its home.'],
  [57, '巽为风', '巽', '巽', 'Wind', '两风相随，进入细小的缝。', 'Wind doubled, entering the small seams.'],
  [58, '兑为泽', '兑', '兑', 'Lake', '两泽相连，喜悦是敞开的。', 'Two lakes joined, an openness that is glad.'],
  [59, '风水涣', '坎', '巽', 'Dispersion', '风行水上，聚着的东西散开。', 'Wind over water, what was gathered comes apart.'],
  [60, '水泽节', '兑', '坎', 'Measure', '泽上有水，多少要有个限度。', 'Water over the lake, an amount that needs a limit.'],
  [61, '风泽中孚', '兑', '巽', 'Inner trust', '泽上有风，中间是空的，因而能信。', 'Wind over the lake: empty in the middle, and so able to trust.'],
  [62, '雷山小过', '艮', '震', 'Small excess', '山上有雷，越过的只是一小步。', 'Thunder on the mountain, the overstep is a small one.'],
  [63, '水火既济', '离', '坎', 'Already across', '水在火上，各爻都已到了自己的位置。', 'Water over fire: every line already in its place.'],
  [64, '火水未济', '坎', '离', 'Not yet across', '火在水上，位置还未对上。', 'Fire over water: the places have not yet matched.'],
];

export const PLACES = [
  { zh: '初爻', en: 'First line' },
  { zh: '二爻', en: 'Second line' },
  { zh: '三爻', en: 'Third line' },
  { zh: '四爻', en: 'Fourth line' },
  { zh: '五爻', en: 'Fifth line' },
  { zh: '上爻', en: 'Top line' },
];

const BY_KEY = new Map();

export const book = RAW.map(([no, name, lower, upper, en, glossZh, glossEn]) => {
  const key = TRI[lower] + TRI[upper];
  const classic = classicByNumber(no);
  const lines = classic.lines.map((line, index) => ({
    index,
    title: lineTitle(index, key[index] === '1'),
    yang: key[index] === '1',
    text: line.text,
    explainZh: line.explainZh,
    explainEn: line.explainEn,
  }));
  const entry = {
    no,
    name,
    lower,
    upper,
    en,
    glossZh,
    glossEn,
    key,
    symbol: hexagramSymbol(no),
    judgment: classic.judgment,
    tuan: classic.tuan,
    image: classic.image,
    explainZh: classic.explainZh,
    explainEn: classic.explainEn,
    lines,
    special: classic.special || null,
  };
  if (BY_KEY.has(key)) throw new Error(`Duplicate hexagram key ${key}`);
  BY_KEY.set(key, entry);
  return entry;
});

export function lookup(key) {
  const found = BY_KEY.get(key);
  if (!found) throw new Error(`Unknown hexagram ${key}`);
  return found;
}

/** Coin face: 3 = 字 (yang), 2 = 背 (yin). Sum 6 old yin, 7 young yang, 8 young yin, 9 old yang. */
export function lineFromCoins(coins) {
  if (!Array.isArray(coins) || coins.length !== 3 || coins.some((coin) => coin !== 2 && coin !== 3)) {
    throw new Error('Three coins, each 2 or 3');
  }
  const sum = coins[0] + coins[1] + coins[2];
  const table = {
    6: { kind: 'yin', moving: true, zh: '老阴', en: 'Old yin' },
    7: { kind: 'yang', moving: false, zh: '少阳', en: 'Young yang' },
    8: { kind: 'yin', moving: false, zh: '少阴', en: 'Young yin' },
    9: { kind: 'yang', moving: true, zh: '老阳', en: 'Old yang' },
  };
  const meta = table[sum];
  if (!meta) throw new Error(`Impossible coin sum ${sum}`);
  return { sum, coins: coins.slice(), ...meta };
}

export function tossCoins(rng = Math.random) {
  const coins = [0, 1, 2].map(() => (rng() < 0.5 ? 2 : 3));
  return lineFromCoins(coins);
}

function keyFromLines(lines, mapLine) {
  return lines.map(mapLine).join('');
}

/** Lines are bottom-up: index 0 is 初爻, index 5 is 上爻. */
export function assemble(lines) {
  if (!Array.isArray(lines) || lines.length !== 6) throw new Error('A hexagram needs six lines');
  const primary = lookup(keyFromLines(lines, (line) => (line.kind === 'yang' ? '1' : '0')));
  const moving = lines.flatMap((line, index) => (line.moving ? [{ index, line }] : []));
  const changed = moving.length
    ? lookup(keyFromLines(lines, (line) => {
      const yang = line.kind === 'yang';
      return (line.moving ? !yang : yang) ? '1' : '0';
    }))
    : null;
  const nuclear = lookup(keyFromLines([1, 2, 3, 2, 3, 4], (index) => (lines[index].kind === 'yang' ? '1' : '0')));
  return { lines, primary, changed, nuclear, moving };
}

export function drawLot(rng = Math.random) {
  const index = Math.min(book.length - 1, Math.floor(rng() * book.length));
  return book[index];
}

/** Stable daily figure. The same civil date always returns the same hexagram. */
export function dailyIndex(dateKey) {
  let hash = 2166136261;
  const text = String(dateKey);
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % book.length;
}

export function dailyHexagram(date = new Date()) {
  const key = date instanceof Date
    ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    : String(date);
  return book[dailyIndex(key)];
}

/**
 * 答案之书. A hexagram and one of its lines, with the classical sentence
 * and DAORA's own plain-language line.
 */
export function drawAnswer(rng = Math.random) {
  const entry = drawLot(rng);
  const index = Math.min(entry.lines.length - 1, Math.floor(rng() * entry.lines.length));
  const line = entry.lines[index];
  return {
    entry,
    line,
    zh: `${entry.symbol} ${entry.name}。${line.title}：${line.text}${line.explainZh}`,
    en: `${entry.symbol} ${entry.name}. ${line.title}: ${line.text} ${line.explainEn}`,
  };
}
