/**
 * Offline country → region → city cascade.
 *
 * Places are city centroids from GeoNames cities15000 (CC-BY 4.0), with the
 * IANA timezone GeoNames records for that place. A country with fewer than
 * two first-level regions skips that step. Nothing here infers a timezone
 * from longitude. Settlements under the dataset threshold, and any exact
 * birth building, use the manual latitude / longitude / timezone fallback.
 */
import raw from './geo/places.json' with { type: 'json' };

export const PLACE_DATASET = {
  id: raw.dataset,
  retrieved: raw.retrieved,
  license: raw.license,
  attribution: raw.attribution,
  url: raw.url,
  accuracy: raw.accuracy,
  note: raw.note,
};

const countries = raw.countries.map((row) => ({ code: row.c, name: row.n, zh: row.z || row.n }));
const regions = raw.regions.map((row) => ({ country: row.c, code: row.r, name: row.n, zh: row.z || '' }));
const cities = raw.cities.map((row) => ({
  id: row[0],
  country: row[1],
  region: row[2],
  name: row[3],
  ascii: row[4] || row[3],
  zh: row[5] || '',
  lat: row[6],
  lon: row[7],
  tz: raw.tz[row[8]],
}));

const countryByCode = new Map(countries.map((country) => [country.code, country]));
const regionsByCountry = new Map();
for (const region of regions) {
  const list = regionsByCountry.get(region.country) || [];
  list.push(region);
  regionsByCountry.set(region.country, list);
}
const citiesByCountry = new Map();
const cityById = new Map();
for (const city of cities) {
  cityById.set(city.id, city);
  const list = citiesByCountry.get(city.country) || [];
  list.push(city);
  citiesByCountry.set(city.country, list);
}

function fold(value) {
  return String(value || '').trim().toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
}

function rank(query, fields) {
  const needle = fold(query);
  const rawQuery = String(query || '').trim();
  if (!needle && !rawQuery) return 9;
  let best = 9;
  for (const field of fields) {
    if (!field) continue;
    const folded = fold(field);
    if (field === rawQuery || folded === needle) best = Math.min(best, 0);
    else if (folded.startsWith(needle) || field.startsWith(rawQuery)) best = Math.min(best, 1);
    else if (folded.includes(needle) || field.includes(rawQuery)) best = Math.min(best, 2);
  }
  return best;
}

function take(items, query, fieldsOf, limit) {
  const found = [];
  for (const item of items) {
    const score = rank(query, fieldsOf(item));
    if (score < 9) found.push({ item, score });
  }
  found.sort((a, b) => a.score - b.score || fieldsOf(a.item)[0].localeCompare(fieldsOf(b.item)[0]));
  return found.slice(0, limit).map((entry) => entry.item);
}

export function listCountries() {
  return countries;
}

export function getCountry(code) {
  return countryByCode.get(code) || null;
}

export function listRegions(countryCode) {
  return regionsByCountry.get(countryCode) || [];
}

/** Countries with no state tier, or only one administrative label, skip the middle step. */
export function shouldSkipRegion(countryCode) {
  return listRegions(countryCode).length <= 1;
}

export function searchCountries(query, limit = 8) {
  return take(countries, query, (country) => [country.name, country.zh, country.code], limit);
}

export function searchRegions(countryCode, query, limit = 8) {
  return take(listRegions(countryCode), query, (region) => [region.name, region.zh, region.code], limit);
}

export function searchCities({ countryCode, regionCode = '', query, limit = 8 }) {
  let pool = citiesByCountry.get(countryCode) || [];
  if (regionCode) pool = pool.filter((city) => city.region === regionCode);
  return take(pool, query, (city) => [city.name, city.ascii, city.zh], limit);
}

export function getCity(id) {
  return cityById.get(String(id || '')) || null;
}

export function findExactCity({ countryCode, regionCode = '', query }) {
  const pool = searchCities({ countryCode, regionCode, query, limit: 20 });
  const needle = fold(query);
  const rawQuery = String(query || '').trim();
  const exact = pool.filter((city) => fold(city.name) === needle || fold(city.ascii) === needle || city.zh === rawQuery);
  return exact.length === 1 ? exact[0] : null;
}

export function regionOf(city) {
  if (!city?.region) return null;
  return listRegions(city.country).find((region) => region.code === city.region) || null;
}

export function placeLabel(city, language = 'zh') {
  if (!city) return '';
  const country = getCountry(city.country);
  const region = regionOf(city);
  const cityName = language === 'zh' && city.zh ? city.zh : city.name;
  const regionName = region ? (language === 'zh' && region.zh ? region.zh : region.name) : '';
  const countryName = country ? (language === 'zh' && country.zh ? country.zh : country.name) : city.country;
  const local = language === 'zh' && city.zh && city.zh !== city.name ? city.name : '';
  return [cityName, local, regionName, countryName].filter(Boolean).join(' · ');
}

export function countryLabel(country, language = 'zh') {
  if (!country) return '';
  if (language === 'zh' && country.zh && country.zh !== country.name) return `${country.zh} · ${country.name}`;
  return country.name;
}

export function regionLabel(region, language = 'zh') {
  if (!region) return '';
  if (language === 'zh' && region.zh && region.zh !== region.name) return `${region.zh} · ${region.name}`;
  return region.name;
}

/**
 * Cascade reducer. Choosing a country drops the previous region and city.
 * Choosing a region drops the city. The birthday is carried through untouched.
 */
export function reduceCascade(state, action) {
  const current = {
    countryCode: state?.countryCode || '',
    regionCode: state?.regionCode || '',
    cityId: state?.cityId || '',
    birthday: state?.birthday || '',
    birthTime: state?.birthTime || '',
  };
  if (action.type === 'country') {
    return { ...current, countryCode: action.code || '', regionCode: '', cityId: '' };
  }
  if (action.type === 'region') {
    return { ...current, regionCode: action.code || '', cityId: '' };
  }
  if (action.type === 'city') {
    return { ...current, cityId: action.id || '' };
  }
  return current;
}

export function isValidTimeZone(timeZone) {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone });
    return typeof timeZone === 'string' && timeZone.length > 0;
  } catch {
    return false;
  }
}

/** Manual coordinates never invent a timezone. The caller must name an IANA zone. */
export function manualPlace({ lat, lon, timeZone }) {
  const latitude = Number(lat);
  const longitude = Number(lon);
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    const error = new Error('Invalid latitude');
    error.code = 'invalid-coordinates';
    throw error;
  }
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    const error = new Error('Invalid longitude');
    error.code = 'invalid-coordinates';
    throw error;
  }
  if (!isValidTimeZone(timeZone)) {
    const error = new Error('Invalid timezone');
    error.code = 'invalid-timezone';
    throw error;
  }
  return {
    mode: 'manual',
    lat: latitude,
    lon: longitude,
    tz: timeZone,
    accuracy: 'user-coordinates',
    provenance: 'manual',
  };
}

export function cityPlace(city) {
  if (!city) return null;
  return {
    mode: 'city',
    cityId: city.id,
    name: city.name,
    zh: city.zh,
    countryCode: city.country,
    regionCode: city.region,
    lat: city.lat,
    lon: city.lon,
    tz: city.tz,
    accuracy: PLACE_DATASET.accuracy,
    provenance: PLACE_DATASET.id,
  };
}

export const placeCounts = { countries: countries.length, regions: regions.length, cities: cities.length };
