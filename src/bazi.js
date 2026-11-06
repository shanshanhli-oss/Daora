/**
 * Civil-time conversion and BaZi Four Pillars.
 *
 * Local birth time is converted with the runtime IANA timezone database
 * (historical daylight saving included), then expressed as Asia/Shanghai
 * civil time. Year and month pillars change at the solar terms — 立春 for
 * the year, and the twelve 节 for the months — via lunar-javascript.
 * The day pillar changes at local midnight in Beijing (library sect 2,
 * 晚子时日柱算当天). The hour pillar follows the two-hour 时辰 of that
 * Beijing civil time. True solar time is shown as an approximation and is
 * not what the pillars are calculated from.
 */
import { Solar } from 'lunar-javascript';

const STEM_ELEMENT = { 甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土', 己: '土', 庚: '金', 辛: '金', 壬: '水', 癸: '水' };
const BRANCH_ELEMENT = { 子: '水', 丑: '土', 寅: '木', 卯: '木', 辰: '土', 巳: '火', 午: '火', 未: '土', 申: '金', 酉: '金', 戌: '土', 亥: '水' };
const ELEMENT_ORDER = ['木', '火', '土', '金', '水'];

export const ELEMENT_THEMES = {
  金: { fog: 0x15171c, background: 0x12141a, hemi: 0xb7b6c2, key: 0xf3ecdf, fill: 0x9aa8be, fillIntensity: 1.15, warm: 0xf0d7b0, exposure: 1.02, accent: '#d9d3c4' },
  木: { fog: 0x141814, background: 0x121612, hemi: 0xa3b59a, key: 0xf6e6c8, fill: 0x8eaa8c, fillIntensity: 1.2, warm: 0xffc98a, exposure: 1.0, accent: '#b7c4a4' },
  水: { fog: 0x12161c, background: 0x10141a, hemi: 0x93a9bc, key: 0xd7e6f0, fill: 0x7f9bb8, fillIntensity: 1.35, warm: 0xf0c9a0, exposure: 0.98, accent: '#9eb4c6' },
  火: { fog: 0x1a1412, background: 0x16110f, hemi: 0xc9a090, key: 0xffd2ae, fill: 0xc48b78, fillIntensity: 0.85, warm: 0xffb060, exposure: 1.07, accent: '#e0a888' },
  土: { fog: 0x181410, background: 0x16130f, hemi: 0xc6b08a, key: 0xf3d7b0, fill: 0xb09978, fillIntensity: 1.05, warm: 0xffc078, exposure: 1.03, accent: '#d4bc90' },
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

/** Wall-clock time in an IANA zone → UTC instant, using that zone's historical offset. */
export function zonedWallTimeToUtc({ year, month, day, hour, minute, second = 0 }, timeZone) {
  if (!isValidTimeZone(timeZone)) throw new Error(`Unknown timezone: ${timeZone}`);
  const desired = Date.UTC(year, month - 1, day, hour, minute, second);
  let utc = desired - offsetMilliseconds(desired, timeZone);
  utc = desired - offsetMilliseconds(utc, timeZone);
  const seen = partsInZone(utc, timeZone);
  const got = Date.UTC(seen.year, seen.month - 1, seen.day, seen.hour, seen.minute, seen.second);
  if (got !== desired) utc += desired - got;
  return new Date(utc);
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

export function computeChart({ year, month, day, hour, minute, second = 0, longitude, timeZone }) {
  const utc = zonedWallTimeToUtc({ year, month, day, hour, minute, second }, timeZone);
  const local = formatInZone(utc, timeZone);
  const beijing = formatInZone(utc, 'Asia/Shanghai');
  const eight = Solar.fromYmdHms(beijing.year, beijing.month, beijing.day, beijing.hour, beijing.minute, beijing.second).getLunar().getEightChar();
  const pillars = {
    year: eight.getYear(),
    month: eight.getMonth(),
    day: eight.getDay(),
    hour: eight.getTime(),
  };
  const counts = countElements(pillars);
  return {
    local,
    beijing,
    trueSolar: trueSolarTime(beijing, longitude),
    pillars,
    wuxing: {
      year: eight.getYearWuXing(),
      month: eight.getMonthWuXing(),
      day: eight.getDayWuXing(),
      hour: eight.getTimeWuXing(),
    },
    counts,
    dominant: dominantElement(counts),
    dayMaster: pillars.day[0],
    timeZone,
    longitude,
  };
}
