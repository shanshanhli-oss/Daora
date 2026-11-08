/**
 * Chart-driven furnishings for the natal room.
 * Rule id: natal-furnishings-v1.
 *
 * Palette
 *   The room colour is always `chart.dominant` (wuxing-strength-v1, the
 *   strongest weighted element). This module copies that value onto
 *   `palette` and never recomputes it. Furnishings do not recolour the room.
 *
 * Ten gods (子平), from the chart's visible stems and hidden stems.
 *   lunar-javascript names: 正印 偏印 食神 伤官 正财 偏财 正官 七杀 比肩 劫财.
 *   The day stem is 日主 and is not scored.
 *   Weights: month stem 4, year stem 2, hour stem 2.
 *   Hidden stems: the first (main qi) counts 2 in the month and 1 elsewhere;
 *   every later hidden stem counts 1 in the month and 0.5 elsewhere.
 *
 * Groups
 *   印星 = 正印 + 偏印. Books when the score is at least 4.
 *   食神 counts fully toward the qin; 伤官 counts half toward the qin
 *   and fully toward the poetry scroll. Qin at 3, scroll at 4.
 *   财星 = 正财 + 偏财. Treasure at 4. At 8 or above the object is a 金蟾,
 *   otherwise a 聚宝盆.
 *   官星 = 正官 + 七杀. A seal at 4.
 *
 * BaZi stars, taken from the day stem or the year branch. Documented tables:
 *   文昌 甲巳 乙午 丙申 丁酉 戊申 己酉 庚亥 辛子 壬寅 癸卯. Present in any pillar: +4 learning.
 *   文曲 甲亥 乙子 丙寅 丁卯 戊寅 己卯 庚巳 辛午 壬申 癸酉. Present: +3 learning.
 *   驿马 of the year branch (申子辰马在寅, 寅午戌马在申, 巳酉丑马在亥, 亥卯未马在巳).
 *   If that branch appears in any pillar: +5 travel. The day-branch horse adds the same if different.
 *   华盖 of the year branch (寅午戌见戌, 申子辰见辰, 巳酉丑见丑, 亥卯未见未). Present: +3 incense.
 *
 * Zi Wei (iztro names), searched in major, minor and adjective stars.
 *   文昌 or 文曲 anywhere: +3 learning, and +2 more in 命宫 父母 官禄 福德.
 *   天同 or 太阴 in 命宫 or 福德: +4 music each.
 *   武曲, 禄存 or 天府 in 财帛 or 命宫: +4 wealth.
 *   紫微 or 天相 in 官禄, or 七杀 in 官禄: +4 career.
 *   天马 in 命宫 or 迁移: +5 travel. 天马 in 迁移 also chooses a globe instead of a map.
 *   天同 or 太阴 in 疾厄: plants and a water basin, as a health image of 水木.
 *
 * Elements
 *   If 木 is the strongest or the second-strongest weighted score: a plant.
 *   If 水 is the strongest or the second-strongest: a water basin.
 *   Ties in the ranking follow 木 火 土 金 水, the same order as the strength rule.
 *
 * Every returned item carries the reasons that cleared its threshold, in Chinese
 * and English, so the room can show them as the object's hint.
 */

export const FURNISHING_RULE_ID = 'natal-furnishings-v1';

const STEM_KEYS = ['year', 'month', 'hour'];
const PILLAR_KEYS = ['year', 'month', 'day', 'hour'];
const ELEMENT_ORDER = ['木', '火', '土', '金', '水'];

const WENCHANG = { 甲: '巳', 乙: '午', 丙: '申', 丁: '酉', 戊: '申', 己: '酉', 庚: '亥', 辛: '子', 壬: '寅', 癸: '卯' };
const WENQU = { 甲: '亥', 乙: '子', 丙: '寅', 丁: '卯', 戊: '寅', 己: '卯', 庚: '巳', 辛: '午', 壬: '申', 癸: '酉' };

const HORSE = { 申: '寅', 子: '寅', 辰: '寅', 寅: '申', 午: '申', 戌: '申', 巳: '亥', 酉: '亥', 丑: '亥', 亥: '巳', 卯: '巳', 未: '巳' };
const CANOPY = { 寅: '戌', 午: '戌', 戌: '戌', 申: '辰', 子: '辰', 辰: '辰', 巳: '丑', 酉: '丑', 丑: '丑', 亥: '未', 卯: '未', 未: '未' };

const LEARNING_PALACES = new Set(['命宫', '父母', '官禄', '福德']);
const YIN = new Set(['正印', '偏印']);
const WEALTH = new Set(['正财', '偏财']);
const OFFICE = new Set(['正官', '七杀']);

function branchesOf(chart) {
  return PILLAR_KEYS.map((key) => chart.pillars?.[key]?.[1]).filter(Boolean);
}

function addGod(bag, name, weight) {
  if (!name || name === '日主') return;
  bag[name] = (bag[name] || 0) + weight;
}

/** Visible and hidden ten-god scores. Exported for tests. */
export function scoreTenGods(chart) {
  const bag = {};
  const stemWeight = { year: 2, month: 4, hour: 2 };
  for (const key of STEM_KEYS) addGod(bag, chart.tenGods?.[key], stemWeight[key]);
  for (const key of PILLAR_KEYS) {
    const hidden = chart.hidden?.[key] || [];
    hidden.forEach((item, index) => {
      const main = index === 0;
      const weight = key === 'month' ? (main ? 2 : 1) : (main ? 1 : 0.5);
      addGod(bag, item.god, weight);
    });
  }
  const sum = (names) => names.reduce((total, name) => total + (bag[name] || 0), 0);
  return {
    gods: bag,
    seal: sum(['正印', '偏印']),
    output: bag['食神'] || 0,
    talent: bag['伤官'] || 0,
    wealth: sum(['正财', '偏财']),
    office: sum(['正官', '七杀']),
  };
}

function starHits(ziwei, names, palaces) {
  if (!ziwei?.available || !Array.isArray(ziwei.palaces)) return [];
  const wanted = new Set(names);
  const homes = palaces ? new Set(palaces) : null;
  const found = [];
  for (const palace of ziwei.palaces) {
    if (homes && !homes.has(palace.name)) continue;
    const stars = [...(palace.major || []), ...(palace.minor || []), ...(palace.adjective || [])];
    for (const star of stars) {
      if (wanted.has(star.name)) found.push({ star: star.name, palace: palace.name });
    }
  }
  return found;
}

function rankedElements(chart) {
  const scores = chart.strength?.scores || {};
  return [...ELEMENT_ORDER].sort((a, b) => {
    const gap = (scores[b] || 0) - (scores[a] || 0);
    if (Math.abs(gap) > 1e-9) return gap;
    return ELEMENT_ORDER.indexOf(a) - ELEMENT_ORDER.indexOf(b);
  });
}

function pushReason(list, zh, en) {
  list.push({ zh, en });
}

/**
 * @param {object} chart  result of computeChart, or a fixture with the same fields
 * @param {object|null} ziwei result of computeZiwei
 * @returns {{ rule: string, palette: string, items: Array }}
 */
export function planFurnishings(chart, ziwei = null) {
  const palette = chart?.dominant || chart?.strength?.strongest || '土';
  const gods = scoreTenGods(chart || {});
  const branches = branchesOf(chart || {});
  const dayStem = chart?.dayMaster || chart?.pillars?.day?.[0] || '';
  const yearBranch = chart?.pillars?.year?.[1] || '';
  const dayBranch = chart?.pillars?.day?.[1] || '';
  const items = [];

  const learning = [];
  if (gods.seal >= 4) pushReason(learning, `印星 ${gods.seal}，宜有书`, `Resource stars at ${gods.seal}: books`);
  for (const [table, label, bonus] of [[WENCHANG, '文昌', 4], [WENQU, '文曲', 3]]) {
    const branch = table[dayStem];
    if (branch && branches.includes(branch)) pushReason(learning, `${label}在${branch}`, `${label} falls on ${branch}`);
    if (branch && branches.includes(branch)) learning.score = (learning.score || 0) + bonus;
  }
  const chang = starHits(ziwei, ['文昌', '文曲']);
  for (const hit of chang) {
    const bonus = LEARNING_PALACES.has(hit.palace) ? 5 : 3;
    learning.score = (learning.score || 0) + bonus;
    pushReason(learning, `${hit.star}在${hit.palace}`, `${hit.star} in ${hit.palace}`);
  }
  if (gods.seal >= 4) learning.score = (learning.score || 0) + gods.seal;
  if ((learning.score || 0) >= 4 || gods.seal >= 4) {
    items.push(item('books', '书架', 'Bookshelves', learning, Math.max(learning.score || 0, gods.seal)));
  }

  const music = [];
  const musicScore = (gods.output || 0) + (gods.talent || 0) * 0.5;
  if (gods.output >= 3) pushReason(music, `食神 ${gods.output}`, `Eating God ${gods.output}`);
  else if (musicScore >= 3) pushReason(music, `食伤 ${musicScore}`, `Output stars ${musicScore}`);
  for (const hit of starHits(ziwei, ['天同', '太阴'], ['命宫', '福德'])) {
    music.score = (music.score || 0) + 4;
    pushReason(music, `${hit.star}在${hit.palace}`, `${hit.star} in ${hit.palace}`);
  }
  music.score = (music.score || 0) + musicScore;
  if (music.score >= 3) items.push(item('qin', '古琴', 'Qin', music, music.score));

  const wealth = [];
  if (gods.wealth >= 4) pushReason(wealth, `财星 ${gods.wealth}`, `Wealth stars ${gods.wealth}`);
  for (const hit of starHits(ziwei, ['武曲', '禄存', '天府'], ['财帛', '命宫'])) {
    wealth.score = (wealth.score || 0) + 4;
    pushReason(wealth, `${hit.star}在${hit.palace}`, `${hit.star} in ${hit.palace}`);
  }
  wealth.score = (wealth.score || 0) + gods.wealth;
  if (wealth.score >= 4) {
    const variant = wealth.score >= 8 ? 'toad' : 'bowl';
    items.push(item('treasure', variant === 'toad' ? '金蟾' : '聚宝盆', variant === 'toad' ? 'Golden toad' : 'Treasure bowl', wealth, wealth.score, variant));
  }

  const office = [];
  if (gods.office >= 4) pushReason(office, `官星 ${gods.office}`, `Officer stars ${gods.office}`);
  for (const hit of [...starHits(ziwei, ['紫微', '天相'], ['官禄']), ...starHits(ziwei, ['七杀'], ['官禄'])]) {
    office.score = (office.score || 0) + 4;
    pushReason(office, `${hit.star}在${hit.palace}`, `${hit.star} in ${hit.palace}`);
  }
  office.score = (office.score || 0) + gods.office;
  if (office.score >= 4) items.push(item('seal', '印绶', 'Seal', office, office.score));

  const travel = [];
  const horses = new Set([HORSE[yearBranch], HORSE[dayBranch]].filter(Boolean));
  for (const horse of horses) {
    if (branches.includes(horse)) {
      travel.score = (travel.score || 0) + 5;
      pushReason(travel, `驿马在${horse}`, `Travelling horse on ${horse}`);
    }
  }
  const horseStars = starHits(ziwei, ['天马'], ['命宫', '迁移']);
  let globe = false;
  for (const hit of horseStars) {
    travel.score = (travel.score || 0) + 5;
    if (hit.palace === '迁移') globe = true;
    pushReason(travel, `${hit.star}在${hit.palace}`, `${hit.star} in ${hit.palace}`);
  }
  if ((travel.score || 0) >= 5) {
    items.push(item('travel', globe ? '地球仪' : '舆图', globe ? 'Globe' : 'Map', travel, travel.score, globe ? 'globe' : 'map'));
  }

  const rank = rankedElements(chart || {});
  const topTwo = new Set(rank.slice(0, 2));
  const plants = [];
  const water = [];
  if (topTwo.has('木')) pushReason(plants, '木居前二', 'Wood is among the two strongest');
  if (topTwo.has('水')) pushReason(water, '水居前二', 'Water is among the two strongest');
  for (const hit of starHits(ziwei, ['天同', '太阴'], ['疾厄'])) {
    pushReason(plants, `${hit.star}在疾厄`, `${hit.star} in Health`);
    pushReason(water, `${hit.star}在疾厄`, `${hit.star} in Health`);
  }
  if (plants.length) items.push(item('plants', '盆景', 'Plants', plants, 1));
  if (water.length) items.push(item('water', '水盂', 'Water basin', water, 1));

  const scroll = [];
  if (gods.talent >= 4) {
    pushReason(scroll, `伤官 ${gods.talent}`, `Hurting Officer ${gods.talent}`);
    items.push(item('scroll', '诗轴', 'Poetry scroll', scroll, gods.talent));
  }

  const incense = [];
  const canopy = CANOPY[yearBranch];
  if (canopy && branches.includes(canopy)) {
    pushReason(incense, `华盖在${canopy}`, `Canopy on ${canopy}`);
    items.push(item('incense', '香炉', 'Incense', incense, 3));
  }

  return { rule: FURNISHING_RULE_ID, palette, items };
}

function item(id, labelZh, labelEn, reasons, score, variant = null) {
  const list = Array.isArray(reasons) ? reasons : [];
  return {
    id,
    labelZh,
    labelEn,
    variant,
    score,
    reasons: list,
    hintZh: list.map((reason) => reason.zh).join('；') || labelZh,
    hintEn: list.map((reason) => reason.en).join('; ') || labelEn,
  };
}

export { YIN, WEALTH, OFFICE };
