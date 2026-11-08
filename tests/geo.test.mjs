import assert from 'node:assert/strict';
import test from 'node:test';
import { getCity, manualPlace, placeCounts, reduceCascade, searchCities, searchCountries, shouldSkipRegion } from '../src/geo.js';

test('the offline cascade covers countries, skips a missing state tier, and keeps precise zones', () => {
  assert.ok(placeCounts.countries >= 200);
  assert.ok(placeCounts.cities >= 20000);
  const china = searchCountries('中国', 5);
  assert.equal(china[0].code, 'CN');
  assert.equal(shouldSkipRegion('SG'), true);
  assert.equal(shouldSkipRegion('MC'), true);
  assert.equal(shouldSkipRegion('GB'), false);
  assert.equal(shouldSkipRegion('CN'), false);

  const london = searchCities({ countryCode: 'GB', regionCode: 'ENG', query: 'London', limit: 5 });
  assert.equal(london[0].name, 'London');
  assert.equal(london[0].zh, '伦敦');
  assert.equal(london[0].tz, 'Europe/London');
  assert.ok(Math.abs(london[0].lat - 51.50853) < 0.01);
  assert.ok(Math.abs(london[0].lon + 0.12574) < 0.01);

  const beijing = searchCities({ countryCode: 'CN', regionCode: '22', query: '北京', limit: 5 });
  assert.equal(beijing[0].tz, 'Asia/Shanghai');
  const urumqi = searchCities({ countryCode: 'CN', regionCode: '13', query: '乌鲁木齐', limit: 5 });
  assert.equal(urumqi[0].tz, 'Asia/Urumqi');
  assert.notEqual(urumqi[0].tz, beijing[0].tz);

  const springs = searchCities({ countryCode: 'US', regionCode: '', query: 'Springfield', limit: 12 });
  const regions = new Set(springs.map((city) => city.region));
  assert.ok(springs.length > 1);
  assert.ok(regions.size > 1);

  const singapore = searchCities({ countryCode: 'SG', regionCode: '', query: '新加坡', limit: 3 });
  assert.equal(singapore[0].tz, 'Asia/Singapore');
  assert.equal(getCity(london[0].id).name, 'London');
});

test('changing country clears the region and city and leaves the birthday alone', () => {
  const next = reduceCascade(
    { countryCode: 'CN', regionCode: '22', cityId: '1816670', birthday: '1998-06-18', birthTime: '07:30' },
    { type: 'country', code: 'GB' },
  );
  assert.equal(next.countryCode, 'GB');
  assert.equal(next.regionCode, '');
  assert.equal(next.cityId, '');
  assert.equal(next.birthday, '1998-06-18');
  assert.equal(next.birthTime, '07:30');
  const city = reduceCascade(next, { type: 'region', code: 'ENG' });
  assert.equal(city.cityId, '');
  assert.equal(reduceCascade(city, { type: 'city', id: '2643743' }).cityId, '2643743');
});

test('manual coordinates require a real timezone and reject impossible numbers', () => {
  const place = manualPlace({ lat: 51.5, lon: -0.12, timeZone: 'Europe/London' });
  assert.equal(place.provenance, 'manual');
  assert.equal(place.tz, 'Europe/London');
  assert.throws(() => manualPlace({ lat: 120, lon: 0, timeZone: 'Europe/London' }), (error) => error.code === 'invalid-coordinates');
  assert.throws(() => manualPlace({ lat: 10, lon: 10, timeZone: 'Not/AZone' }), (error) => error.code === 'invalid-timezone');
});
