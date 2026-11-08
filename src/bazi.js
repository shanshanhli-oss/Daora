/**
 * Civil-time conversion and BaZi Four Pillars.
 *
 * Local birth time is converted with the runtime IANA timezone database
 * (historical daylight saving included), then expressed as Asia/Shanghai
 * civil time. Year and month pillars change at the solar terms — 立春 for
 * the year, and the twelve 节 for the months — via lunar-javascript.
 * The day pillar changes at local midnight in Beijing (library sect 2,
 * 晚子时日柱算当天). The hour pillar follows the two-hour 时辰 of that
 * clock. Beijing civil time is the default. True solar time is opt-in:
 * the longitude and equation of time are applied once to that Beijing
 * clock, and the UTC instant is left unchanged.
 *
 * Room colour uses STRENGTH_RULE_ID. It is an aesthetic weighting of
 * stems, hidden stems and the month branch, not a diagnosis of strength
 * or the useful god. `counts` stays the plain eight-character tally.
 */
import { Solar } from 'lunar-javascript';

const STEM_ELEMENT = { 甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土', 己: '土', 庚: '金', 辛: '金', 壬: '水', 癸: '水' };
const BRANCH_ELEMENT = { 子: '水', 丑: '土', 寅: '木', 卯: '木', 辰: '土', 巳: '火', 午: '火', 未: '土', 申: '金', 酉: '金', 戌: '土', 亥: '水' };
const ELEMENT_ORDER = ['木', '火', '土', '金', '水'];

/** Each branch totals 10. Stems score 10 each, so stems and branches weigh the same. */
const HIDDEN_STEMS = {
  子: [['癸', 10]],
  丑: [['己', 6], ['癸', 3], ['辛', 1]],
  寅: [['甲', 6], ['丙', 3], ['戊', 1]],
  卯: [['乙', 10]],
  辰: [['戊', 6], ['乙', 3], ['癸', 1]],
  巳: [['丙', 6], ['庚', 3], ['戊', 1]],
  午: [['丁', 7], ['己', 3]],
  未: [['己', 6], ['丁', 3], ['乙', 1]],
  申: [['庚', 6], ['壬', 3], ['戊', 1]],
  酉: [['辛', 10]],
  戌: [['戊', 6], ['辛', 3], ['丁', 1]],
  亥: [['壬', 7], ['甲', 3]],
};

/** 旺 1.6 · 相 1.3 · 休 1.0 · 囚 0.7 · 死 0.4, taken from the month branch. */
const SEASON = {
  寅: { 木: 1.6, 火: 1.3, 水: 1.0, 金: 0.7, 土: 0.4 },
  卯: { 木: 1.6, 火: 1.3, 水: 1.0, 金: 0.7, 土: 0.4 },
  巳: { 火: 1.6, 土: 1.3, 木: 1.0, 水: 0.7, 金: 0.4 },
  午: { 火: 1.6, 土: 1.3, 木: 1.0, 水: 0.7, 金: 0.4 },
  申: { 金: 1.6, 水: 1.3, 土: 1.0, 火: 0.7, 木: 0.4 },
  酉: { 金: 1.6, 水: 1.3, 土: 1.0, 火: 0.7, 木: 0.4 },
  亥: { 水: 1.6, 木: 1.3, 金: 1.0, 土: 0.7, 火: 0.4 },
  子: { 水: 1.6, 木: 1.3, 金: 1.0, 土: 0.7, 火: 0.4 },
  辰: { 土: 1.6, 金: 1.3, 火: 1.0, 木: 0.7, 水: 0.4 },
  戌: { 土: 1.6, 金: 1.3, 火: 1.0, 木: 0.7, 水: 0.4 },
  丑: { 土: 1.6, 金: 1.3, 火: 1.0, 木: 0.7, 水: 0.4 },
  未: { 土: 1.6, 金: 1.3, 火: 1.0, 木: 0.7, 水: 0.4 },
};

export const STRENGTH_RULE_ID = 'wuxing-strength-v1';

export const ELEMENT_THEMES = {
  金: { fog: 0x1e212b, background: 0x181b23, hemi: 0xd5d3e0, key: 0xf6f1e7, fill: 0xb9c3d4, fillIntensity: 1.55, warm: 0xe7d7b8, exposure: 1.18, accent: '#e4dcc8' },
  木: { fog: 0x16251b, background: 0x131e16, hemi: 0x8fb892, key: 0xf3e6c4, fill: 0x3f8a58, fillIntensity: 1.65, warm: 0xc6e08a, exposure: 1.15, accent: '#b7c4a4' },
  水: { fog: 0x13202f, background: 0x101a26, hemi: 0x8eb4d4, key: 0xd7eaf8, fill: 0x2f6ea0, fillIntensity: 1.75, warm: 0x9ec4e0, exposure: 1.12, accent: '#9eb4c6' },
  火: { fog: 0x2d1913, background: 0x231411, hemi: 0xe7a090, key: 0xffc09a, fill: 0xc24b32, fillIntensity: 1.2, warm: 0xff7a3c, exposure: 1.22, accent: '#e7a088' },
  土: { fog: 0x2a1e14, background: 0x211910, hemi: 0xd2b48a, key: 0xf0d0a0, fill: 0xa67c45, fillIntensity: 1.3, warm: 0xe09a55, exposure: 1.17, accent: '#d4bc90' },
};

export function isValidTimeZone(timeZone) {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone });
    return typeof timeZone === 'string' && timeZone.length > 0;
  } catch {
    return false;
  }
}

function partsInZone(utcMs, timeZone) {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'shortOffset',
  });
  const bag = {};
  for (const part of dtf.formatToParts(new Date(utcMs))) {
    if (part.type !== 'literal') bag[part.type] = part.value;
  }
  return {
    year: Number(bag.year),
    month: Number(bag.month),
    day: Number(bag.day),
    hour: bag.hour === '24' ? 0 : Number(bag.hour),
    minute: Number(bag.minute),
    second: Number(bag.second),
    offset: prettyOffset(bag.timeZoneName || ''),
  };
}

function offsetMilliseconds(utcMs, timeZone) {
  const parts = partsInZone(utcMs, timeZone);
  const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  return asUtc - utcMs;
}

function wallKey(parts) {
  return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
}

/**
 * Match a wall clock to the instants when that zone actually showed it.
 * Gaps (spring-forward) are nonexistent. Overlaps (fall-back) are ambiguous.
 * The clock is never silently slid onto a neighbouring hour.
 */
export function resolveZonedTime({ year, month, day, hour, minute, second = 0 }, timeZone) {
  if (!isValidTimeZone(timeZone)) throw new Error(`Unknown timezone: ${timeZone}`);
  const desired = Date.UTC(year, month - 1, day, hour, minute, second);
  const found = new Set();
  for (let delta = -18; delta <= 18; delta += 1) {
    const probe = desired + delta * 3600000;
    const candidate = desired - offsetMilliseconds(probe, timeZone);
    if (wallKey(partsInZone(candidate, timeZone)) === desired) found.add(candidate);
  }
  const occurrences = [...found].sort((a, b) => a - b).map((ms) => new Date(ms));
  if (occurrences.length === 0) return { status: 'nonexistent', occurrences };
  if (occurrences.length === 1) return { status: 'unique', utc: occurrences[0], occurrences };
  return { status: 'ambiguous', occurrences };
}

/** Wall-clock time in an IANA zone → UTC instant, using that zone's historical offset. */
export function zonedWallTimeToUtc(wall, timeZone, dstChoice) {
  const resolved = resolveZonedTime(wall, timeZone);
  if (resolved.status === 'unique') return resolved.utc;
  if (resolved.status === 'ambiguous') {
    if (dstChoice !== 'earlier' && dstChoice !== 'later') {
      const error = new Error('Ambiguous local time');
      error.code = 'ambiguous';
      error.occurrences = resolved.occurrences;
      throw error;
    }
    return dstChoice === 'later' ? resolved.occurrences.at(-1) : resolved.occurrences[0];
  }
  const error = new Error('Nonexistent local time');
  error.code = 'nonexistent';
  throw error;
}

export function formatInZone(date, timeZone) {
  const parts = partsInZone(date.getTime(), timeZone);
  const pad = (value) => String(value).padStart(2, '0');
  return {
    ...parts,
    date: `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`,
    time: `${pad(parts.hour)}:${pad(parts.minute)}`,
    label: `${parts.year}-${pad(parts.month)}-${pad(parts.day)} ${pad(parts.hour)}:${pad(parts.minute)}`,
  };
}

function prettyOffset(name) {
  const match = String(name).match(/([+-])(\d{1,2})(?::?(\d{2}))?/);
  if (!match) return name || '';
  const minutes = match[3] && match[3] !== '00' ? `:${match[3]}` : '';
  return `UTC${match[1]}${Number(match[2])}${minutes}`;
}

function dayOfYear(year, month, day) {
  const start = Date.UTC(year, 0, 1);
  const current = Date.UTC(year, month - 1, day);
  return Math.round((current - start) / 86400000) + 1;
}

/** NOAA-style approximation, in minutes. Accurate to about a minute for display. */
export function equationOfTimeMinutes(year, month, day) {
  const b = (2 * Math.PI * (dayOfYear(year, month, day) - 81)) / 364;
  return 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b);
}

/**
 * Apparent solar time at `longitude` (degrees east), expressed against the
 * Beijing civil clock that was passed in. Standard meridian is 120°E.
 */
export function trueSolarTime(beijing, longitude) {
  const correction = (longitude - 120) * 4;
  const equation = equationOfTimeMinutes(beijing.year, beijing.month, beijing.day);
  let minutes = beijing.hour * 60 + beijing.minute + beijing.second / 60 + correction + equation;
  let dayShift = 0;
  while (minutes < 0) { minutes += 1440; dayShift -= 1; }
  while (minutes >= 1440) { minutes -= 1440; dayShift += 1; }
  let hour = Math.floor(minutes / 60);
  let minute = Math.round(minutes - hour * 60);
  if (minute === 60) { hour += 1; minute = 0; }
  if (hour === 24) { hour = 0; dayShift += 1; }
  const pad = (value) => String(value).padStart(2, '0');
  return {
    hour, minute, dayShift,
    correctionMinutes: correction,
    equationMinutes: equation,
    label: `${pad(hour)}:${pad(minute)}`,
  };
}

function countElements(pillars) {
  const counts = { 金: 0, 木: 0, 水: 0, 火: 0, 土: 0 };
  for (const key of ['year', 'month', 'day', 'hour']) {
    const [stem, branch] = [...pillars[key]];
    counts[STEM_ELEMENT[stem]] += 1;
    counts[BRANCH_ELEMENT[branch]] += 1;
  }
  return counts;
}

/** Highest of the eight characters. Ties break along the generating cycle, 木 first. */
export function dominantElement(counts) {
  let best = '木';
  let bestCount = -1;
  for (const element of ELEMENT_ORDER) {
    if (counts[element] > bestCount) {
      best = element;
      bestCount = counts[element];
    }
  }
  return best;
}

function emptyScores() {
  return { 金: 0, 木: 0, 水: 0, 火: 0, 土: 0 };
}

/** Stem points plus hidden-stem points, before the month-branch multiplier. */
export function rawElementScores(pillars) {
  const scores = emptyScores();
  for (const key of ['year', 'month', 'day', 'hour']) {
    const [stem, branch] = [...pillars[key]];
    scores[STEM_ELEMENT[stem]] += 10;
    for (const [hidden, weight] of HIDDEN_STEMS[branch]) scores[STEM_ELEMENT[hidden]] += weight;
  }
  return scores;
}

export function seasonWeights(monthBranch) {
  return SEASON[monthBranch];
}

/**
 * Pick the strongest weighted element.
 * A numerical tie falls through to the plain character count, then to 木 → 火 → 土 → 金 → 水.
 */
export function chooseStrongest(scores, counts = {}) {
  let best = ELEMENT_ORDER[0];
  for (const element of ELEMENT_ORDER) {
    const scoreGap = scores[element] - scores[best];
    if (scoreGap > 1e-9) best = element;
    else if (Math.abs(scoreGap) <= 1e-9 && (counts[element] || 0) > (counts[best] || 0)) best = element;
  }
  return best;
}

export function scoreElements(pillars, counts = countElements(pillars)) {
  const monthBranch = pillars.month[1];
  const raw = rawElementScores(pillars);
  const weights = seasonWeights(monthBranch);
  const scores = emptyScores();
  for (const element of ELEMENT_ORDER) scores[element] = raw[element] * weights[element];
  return {
    rule: STRENGTH_RULE_ID,
    monthBranch,
    raw,
    weights,
    scores,
    strongest: chooseStrongest(scores, counts),
  };
}

function shiftClock(beijing, solar) {
  const utc = Date.UTC(beijing.year, beijing.month - 1, beijing.day + solar.dayShift, solar.hour, solar.minute, 0);
  const date = new Date(utc);
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
    hour: date.getUTCHours(),
    minute: date.getUTCMinutes(),
    second: 0,
  };
}

function pillarBundle(eight) {
  return {
    year: eight.getYear(),
    month: eight.getMonth(),
    day: eight.getDay(),
    hour: eight.getTime(),
  };
}

function hiddenOf(eight, key) {
  const gan = eight[`get${key}HideGan`]();
  const gods = eight[`get${key}ShiShenZhi`]();
  return gan.map((stem, index) => ({ stem, god: gods[index] || '' }));
}

function luckCycles(eight, gender) {
  if (gender !== '男' && gender !== '女') return null;
  const yun = eight.getYun(gender === '男' ? 1 : 0);
  const start = yun.getStartSolar();
  return {
    gender,
    forward: Boolean(yun.isForward()),
    start: typeof start?.toYmd === 'function' ? start.toYmd() : '',
    years: yun.getStartYear(),
    months: yun.getStartMonth(),
    days: yun.getStartDay(),
    cycles: yun.getDaYun().slice(1, 9).map((cycle) => ({
      ganZhi: cycle.getGanZhi(),
      startYear: cycle.getStartYear(),
      endYear: cycle.getEndYear(),
      startAge: cycle.getStartAge(),
    })),
  };
}

export function computeChart({ year, month, day, hour, minute, second = 0, longitude, timeZone, dstChoice, useTrueSolar = false, gender }) {
  const utc = zonedWallTimeToUtc({ year, month, day, hour, minute, second }, timeZone, dstChoice);
  const local = formatInZone(utc, timeZone);
  const beijing = formatInZone(utc, 'Asia/Shanghai');
  const trueSolar = trueSolarTime(beijing, longitude);
  const pillarClock = useTrueSolar ? shiftClock(beijing, trueSolar) : beijing;
  const eight = Solar.fromYmdHms(pillarClock.year, pillarClock.month, pillarClock.day, pillarClock.hour, pillarClock.minute, pillarClock.second || 0).getLunar().getEightChar();
  const pillars = pillarBundle(eight);
  const counts = countElements(pillars);
  const strength = scoreElements(pillars, counts);
  return {
    utc: utc.toISOString(),
    local,
    beijing,
    trueSolar,
    pillarBasis: useTrueSolar ? 'true-solar-v1' : 'beijing-civil',
    pillarClock: {
      year: pillarClock.year,
      month: pillarClock.month,
      day: pillarClock.day,
      hour: pillarClock.hour,
      minute: pillarClock.minute,
    },
    pillars,
    wuxing: {
      year: eight.getYearWuXing(),
      month: eight.getMonthWuXing(),
      day: eight.getDayWuXing(),
      hour: eight.getTimeWuXing(),
    },
    hidden: {
      year: hiddenOf(eight, 'Year'),
      month: hiddenOf(eight, 'Month'),
      day: hiddenOf(eight, 'Day'),
      hour: hiddenOf(eight, 'Time'),
    },
    tenGods: {
      year: eight.getYearShiShenGan(),
      month: eight.getMonthShiShenGan(),
      day: eight.getDayShiShenGan(),
      hour: eight.getTimeShiShenGan(),
    },
    naYin: {
      year: eight.getYearNaYin(),
      month: eight.getMonthNaYin(),
      day: eight.getDayNaYin(),
      hour: eight.getTimeNaYin(),
    },
    voids: { year: eight.getYearXunKong(), day: eight.getDayXunKong() },
    luck: luckCycles(eight, gender),
    counts,
    strength,
    dominant: strength.strongest,
    dayMaster: pillars.day[0],
    dayMasterElement: STEM_ELEMENT[pillars.day[0]],
    timeZone,
    longitude,
    dstChoice: dstChoice || null,
    gender: gender === '男' || gender === '女' ? gender : null,
    engine: { name: 'lunar-javascript', version: '1.7.8' },
  };
}
