/**
 * Zi Wei Dou Shu via iztro (MIT). The solar date and shichen index are the
 * already-normalised Beijing civil clock, or the true-solar clock when that
 * option is on. iztro's default 晚子时 rule (dayDivide "current") keeps
 * 23:00–23:59 on the same solar date. fixLeap follows iztro: in a leap
 * month, days after the 15th are read as the next month when fixLeap is true.
 * Gender is the traditional algorithm input for luck direction. It is not
 * inferred. Language is a label layer; pass zh-CN for stable Chinese names.
 */
import { astro } from 'iztro';

export const ZIWEI_ENGINE = {
  name: 'iztro',
  version: '2.5.7',
  algorithm: 'default',
  dayDivide: 'current',
  license: 'MIT',
};

/** 0 早子时 … 11 亥时, 12 晚子时. Clock hours are never passed through as the index. */
export function shichenIndex(hour, minute = 0) {
  const whole = Number(hour);
  const mins = Number(minute) || 0;
  if (!Number.isInteger(whole) || whole < 0 || whole > 23 || mins < 0 || mins > 59) {
    const error = new Error('Birth hour is required');
    error.code = 'unknown-hour';
    throw error;
  }
  if (whole === 23) return 12;
  if (whole === 0) return 0;
  return Math.floor((whole + 1) / 2);
}

const SHICHEN = ['早子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '晚子'];

function starBrief(star) {
  return {
    name: star.name,
    brightness: star.brightness || '',
    mutagen: star.mutagen || '',
  };
}

export function computeZiwei({ year, month, day, hour, minute = 0, gender, fixLeap = true, language = 'zh-CN' }) {
  const index = shichenIndex(hour, minute);
  if (gender !== '男' && gender !== '女') {
    return {
      available: false,
      reason: 'gender-required',
      shichenIndex: index,
      shichen: SHICHEN[index],
      engine: ZIWEI_ENGINE,
      fixLeap: Boolean(fixLeap),
    };
  }
  const chart = astro.bySolar(`${year}-${month}-${day}`, index, gender, Boolean(fixLeap), language);
  const palaces = chart.palaces.map((palace) => ({
    index: palace.index,
    name: palace.name,
    stem: palace.heavenlyStem,
    branch: palace.earthlyBranch,
    isBody: Boolean(palace.isBodyPalace),
    major: palace.majorStars.map(starBrief),
    minor: palace.minorStars.map(starBrief),
    adjective: palace.adjectiveStars.map(starBrief),
    decadal: {
      range: palace.decadal?.range ? [...palace.decadal.range] : [],
      stem: palace.decadal?.heavenlyStem || '',
      branch: palace.decadal?.earthlyBranch || '',
    },
  }));
  const transformations = [];
  for (const palace of palaces) {
    for (const star of [...palace.major, ...palace.minor]) {
      if (star.mutagen) transformations.push({ star: star.name, mutagen: star.mutagen, palace: palace.name });
    }
  }
  return {
    available: true,
    engine: ZIWEI_ENGINE,
    shichenIndex: index,
    shichen: chart.time,
    timeRange: chart.timeRange,
    solarDate: chart.solarDate,
    lunarDate: chart.lunarDate,
    fiveElementsClass: chart.fiveElementsClass,
    soul: chart.soul,
    body: chart.body,
    soulBranch: chart.earthlyBranchOfSoulPalace,
    bodyBranch: chart.earthlyBranchOfBodyPalace,
    palaces,
    transformations,
    gender,
    fixLeap: Boolean(fixLeap),
    language,
  };
}

/** Decadal and yearly palaces for a civil date. The birth instant is not modified. */
export function locateHoroscope({ year, month, day, hour, minute = 0, gender, fixLeap = true }, dateStr) {
  if (gender !== '男' && gender !== '女') return null;
  const chart = astro.bySolar(`${year}-${month}-${day}`, shichenIndex(hour, minute), gender, Boolean(fixLeap), 'zh-CN');
  const horoscope = chart.horoscope(dateStr);
  const decadal = chart.palaces[horoscope.decadal?.index];
  const yearly = chart.palaces[horoscope.yearly?.index];
  return {
    date: dateStr,
    decadal: decadal?.name || '',
    decadalRange: decadal?.decadal?.range ? [...decadal.decadal.range] : [],
    yearly: yearly?.name || '',
  };
}
