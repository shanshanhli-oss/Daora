/**
 * Build the offline birth-place dataset from a GeoNames dump.
 *
 * Source (CC-BY 4.0, https://www.geonames.org/):
 *   cities15000.txt, admin1CodesASCII.txt, countryInfo.txt
 * Chinese country names come from i18n-iso-countries (MIT), used only
 * while generating this file. The app ships the JSON, not that package.
 *
 * Usage: node scripts/build-places.mjs /tmp/geonames
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import countries from 'i18n-iso-countries';
import zhLocale from 'i18n-iso-countries/langs/zh.json' with { type: 'json' };

countries.registerLocale(zhLocale);

const dump = process.argv[2] || '/tmp/geonames';
const read = (name) => readFileSync(path.join(dump, name), 'utf8');

const REGION_ZH = {
  'CN.22': '北京', 'CN.23': '上海', 'CN.28': '天津', 'CN.33': '重庆',
  'CN.30': '广东', 'CN.04': '江苏', 'CN.02': '浙江', 'CN.32': '四川',
  'CN.10': '河北', 'CN.24': '山西', 'CN.19': '辽宁', 'CN.05': '吉林',
  'CN.08': '黑龙江', 'CN.01': '安徽', 'CN.07': '福建', 'CN.03': '江西',
  'CN.25': '山东', 'CN.09': '河南', 'CN.11': '湖南', 'CN.12': '湖北',
  'CN.31': '海南', 'CN.18': '贵州', 'CN.29': '云南', 'CN.26': '陕西',
  'CN.15': '甘肃', 'CN.06': '青海', 'CN.14': '西藏', 'CN.16': '广西',
  'CN.20': '内蒙古', 'CN.21': '宁夏', 'CN.13': '新疆',
  'GB.ENG': '英格兰', 'GB.SCT': '苏格兰', 'GB.WLS': '威尔士', 'GB.NIR': '北爱尔兰',
  'US.AL': '亚拉巴马', 'US.AK': '阿拉斯加', 'US.AZ': '亚利桑那', 'US.AR': '阿肯色',
  'US.CA': '加利福尼亚', 'US.CO': '科罗拉多', 'US.CT': '康涅狄格', 'US.DE': '特拉华',
  'US.DC': '哥伦比亚特区', 'US.FL': '佛罗里达', 'US.GA': '佐治亚', 'US.HI': '夏威夷',
  'US.ID': '爱达荷', 'US.IL': '伊利诺伊', 'US.IN': '印第安纳', 'US.IA': '艾奥瓦',
  'US.KS': '堪萨斯', 'US.KY': '肯塔基', 'US.LA': '路易斯安那', 'US.ME': '缅因',
  'US.MD': '马里兰', 'US.MA': '马萨诸塞', 'US.MI': '密歇根', 'US.MN': '明尼苏达',
  'US.MS': '密西西比', 'US.MO': '密苏里', 'US.MT': '蒙大拿', 'US.NE': '内布拉斯加',
  'US.NV': '内华达', 'US.NH': '新罕布什尔', 'US.NJ': '新泽西', 'US.NM': '新墨西哥',
  'US.NY': '纽约州', 'US.NC': '北卡罗来纳', 'US.ND': '北达科他', 'US.OH': '俄亥俄',
  'US.OK': '俄克拉荷马', 'US.OR': '俄勒冈', 'US.PA': '宾夕法尼亚', 'US.RI': '罗得岛',
  'US.SC': '南卡罗来纳', 'US.SD': '南达科他', 'US.TN': '田纳西', 'US.TX': '得克萨斯',
  'US.UT': '犹他', 'US.VT': '佛蒙特', 'US.VA': '弗吉尼亚', 'US.WA': '华盛顿州',
  'US.WV': '西弗吉尼亚', 'US.WI': '威斯康星', 'US.WY': '怀俄明',
};

function cjkName(alternates) {
  for (const raw of String(alternates || '').split(',')) {
    const name = raw.trim();
    if (!name || name.length > 12) continue;
    if ([...name].every((char) => char >= '\u3400' && char <= '\u9fff')) return name;
  }
  return '';
}

const countryRows = [];
for (const line of read('countryInfo.txt').split('\n')) {
  if (!line || line.startsWith('#')) continue;
  const [code, , , , name] = line.split('\t');
  if (!code || !name) continue;
  countryRows.push({ c: code, n: name, z: countries.getName(code, 'zh') || name });
}

const regionRows = [];
for (const line of read('admin1CodesASCII.txt').split('\n')) {
  if (!line.trim()) continue;
  const [code, name] = line.split('\t');
  const [country, region] = code.split('.');
  if (!country || !region || !name) continue;
  regionRows.push({ c: country, r: region, n: name, z: REGION_ZH[code] || '' });
}

const tz = [];
const tzIndex = new Map();
function timezoneId(name) {
  if (!tzIndex.has(name)) {
    tzIndex.set(name, tz.length);
    tz.push(name);
  }
  return tzIndex.get(name);
}

const cityRows = [];
for (const line of read('cities15000.txt').split('\n')) {
  if (!line.trim()) continue;
  const parts = line.split('\t');
  const [id, name, ascii, alternates, lat, lon, , , country, , admin1, , , , , , , zone] = parts;
  if (!id || !name || !country || !zone || !zone.includes('/')) continue;
  const latitude = Number(lat);
  const longitude = Number(lon);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) continue;
  cityRows.push([
    id,
    country,
    admin1 || '',
    name,
    ascii && ascii !== name ? ascii : '',
    cjkName(alternates),
    Math.round(latitude * 1e5) / 1e5,
    Math.round(longitude * 1e5) / 1e5,
    timezoneId(zone),
  ]);
}

const payload = {
  dataset: 'geonames-cities15000',
  retrieved: '2026-11-08',
  license: 'CC-BY-4.0',
  attribution: 'GeoNames',
  url: 'https://www.geonames.org/',
  accuracy: 'city-centroid',
  note: 'Populated places with population above about 15,000, plus capitals recorded by GeoNames. Coordinates are the city centroid, not a street address. Timezones are the GeoNames IANA zone for that place, not a longitude guess.',
  tz,
  countries: countryRows,
  regions: regionRows,
  cities: cityRows,
};

const out = path.resolve('src/geo/places.json');
writeFileSync(out, JSON.stringify(payload));
console.log(`Wrote ${out}: ${countryRows.length} countries, ${regionRows.length} regions, ${cityRows.length} cities, ${tz.length} timezones, ${(Buffer.byteLength(JSON.stringify(payload)) / 1024 / 1024).toFixed(2)} MB`);
