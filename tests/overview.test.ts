import { expect, it } from 'vitest';
import {
  applianceActivities,
  durationText,
  runtimeProgress,
  timestamp,
} from '../src/ha/activity';
import { roomLights } from '../src/ha/overview';
import { activities, fixtureStates } from '../preview/home-fixtures';
import type { HomeAssistant } from '../src/ha/types';
const now = Date.parse('2026-01-01T12:00:00Z');
it('keeps illustrative runtime linear to the reference duration then approaches completion logarithmically', () => {
  expect(runtimeProgress(0, 120)).toBe(0);
  expect(runtimeProgress(60, 120)).toBe(40);
  expect(runtimeProgress(120, 120)).toBe(80);
  expect(runtimeProgress(240, 120)).toBeCloseTo(88.19, 2);
  expect(runtimeProgress(480, 120)).toBeCloseTo(91.62, 2);
  expect(runtimeProgress(60, 60)).toBe(80);
  expect(runtimeProgress(120 - 0.001, 120)).toBeCloseTo(80, 2);
  expect(runtimeProgress(120 + 0.001, 120)).toBeCloseTo(80, 2);
  const samples = Array.from({ length: 1001 }, (_, i) =>
    runtimeProgress(i * 10, 120)!,
  );
  expect(
    samples.every(
      (value, i) =>
        Number.isFinite(value) &&
        value >= 0 &&
        value < 100 &&
        (i === 0 || value > samples[i - 1]!),
    ),
  ).toBe(true);
  const gains = [
    runtimeProgress(240, 120)! - 80,
    runtimeProgress(360, 120)! - runtimeProgress(240, 120)!,
    runtimeProgress(480, 120)! - runtimeProgress(360, 120)!,
  ];
  expect(gains[0]).toBeGreaterThan(gains[1]!);
  expect(gains[1]).toBeGreaterThan(gains[2]!);
  expect(runtimeProgress(Number.MAX_VALUE, Number.MIN_VALUE)).toBeLessThan(100);
  for (const [elapsed, reference] of [
    [-1, 120],
    [NaN, 120],
    [Infinity, 120],
    [10, 0],
    [10, -1],
    [10, NaN],
    [10, Infinity],
  ])
    expect(runtimeProgress(elapsed!, reference!)).toBeUndefined();
});
function hass(): HomeAssistant {
  return {
    states: fixtureStates('multiple', now),
    callService: async () => undefined,
  };
}
it('counts each configured light once, and never treats missing/unknown states as off', () => {
  const h = hass();
  const ids = [
    'light.example_room_0_0',
    'light.example_room_0_0',
    'light.example_missing',
  ];
  expect(roomLights(h, ids)).toEqual({ on: 1, unavailable: 1 });
  h.states[ids[0]!] = { ...h.states[ids[0]!]!, state: 'off' };
  expect(roomLights(h, ids)).toEqual({ on: 0, unavailable: 1 });
  expect(roomLights(h, [])).toEqual({ on: 0, unavailable: 0 });
});
it('keeps configured order and excludes unknown/unavailable states even when listed as active', () => {
  const h = hass();
  expect(
    applianceActivities(h, activities.appliances, now).map(
      (a) => a.config.type,
    ),
  ).toEqual(['washer', 'dryer', 'oven', 'dishwasher']);
  h.states['binary_sensor.example_washer'] = {
    ...h.states['binary_sensor.example_washer']!,
    state: 'unavailable',
  };
  const configs = activities.appliances.map((a) => ({
    ...a,
    active_states: [...a.active_states, 'unavailable', 'unknown'],
  }));
  expect(
    applianceActivities(h, configs, now).map((a) => a.config.type),
  ).toEqual(['dryer', 'oven', 'dishwasher']);
  expect(applianceActivities(undefined, configs, now)).toEqual([]);
});
it('separates reference elapsed progress from actual progress and never estimates remaining wash time', () => {
  const [washer, dryer, oven, dishwasher] = applianceActivities(
    hass(),
    activities.appliances,
    now,
  );
  expect(washer).toMatchObject({
    elapsedMinutes: 48,
    progress: 32,
    approximate: true,
    indicative: true,
    remainingMinutes: undefined,
  });
  expect(dryer).toMatchObject({ elapsedMinutes: 135 });
  expect(dryer!.progress).toBeGreaterThan(80);
  expect(dryer!.progress).toBeLessThan(100);
  expect(oven).toMatchObject({
    progress: 72,
    remainingMinutes: 12,
    temperature: 180,
    indicative: false,
    elapsedMinutes: undefined,
  });
  expect(dishwasher).toMatchObject({
    progress: undefined,
    remainingMinutes: 38,
  });
});
it('prefers a reliable configured start and hides timing when that start is invalid', () => {
  const h = hass();
  const config = {
    ...activities.appliances[0]!,
    started_at_entity: 'input_datetime.example_start',
  };
  h.states[config.started_at_entity] = {
    entity_id: config.started_at_entity,
    state: '2026-01-01 11:00:00',
    attributes: {
      has_date: true,
      has_time: true,
      timestamp: (now - 3600000) / 1000,
    },
  };
  expect(applianceActivities(h, [config], now)[0]).toMatchObject({
    elapsedMinutes: 60,
    progress: 40,
    approximate: false,
  });
  for (const state of [
    'unknown',
    'unavailable',
    'garbage',
    '2026-02-30T00:00:00Z',
    '2026-01-01T13:00:00Z',
    '11:00:00',
  ]) {
    h.states[config.started_at_entity] = {
      entity_id: config.started_at_entity,
      state,
      attributes: {},
    };
    expect(applianceActivities(h, [config], now)[0]).toMatchObject({
      elapsedMinutes: undefined,
      progress: undefined,
    });
  }
  h.states[config.started_at_entity] = {
    entity_id: config.started_at_entity,
    state: '11:00:00',
    attributes: { has_date: false, timestamp: 39600 },
  };
  expect(
    applianceActivities(h, [config], now)[0]?.elapsedMinutes,
  ).toBeUndefined();
});
it('retains persisted runtime after sensor restoration and uses a new timestamp for the next cycle', () => {
  const h = hass();
  const config = {
    ...activities.appliances[0]!,
    started_at_entity: 'input_datetime.example_washer_started',
  };
  h.states[config.started_at_entity] = {
    entity_id: config.started_at_entity,
    state: '2026-01-01T11:00:00Z',
    attributes: {
      has_date: true,
      has_time: true,
      timestamp: (now - 3600000) / 1000,
    },
  };
  // HA restores the running sensor with a fresh last_changed timestamp.
  const restored = {
    ...h,
    states: {
      ...h.states,
      [config.entity]: {
        ...h.states[config.entity]!,
        last_changed: new Date(now).toISOString(),
      },
    },
  };
  expect(applianceActivities(restored, [config], now)[0]).toMatchObject({
    elapsedMinutes: 60,
    progress: 40,
    approximate: false,
  });
  expect(
    applianceActivities(restored, [config], now + 3600000)[0],
  ).toMatchObject({ elapsedMinutes: 120, progress: 80 });
  restored.states[config.entity] = {
    ...restored.states[config.entity]!,
    state: 'off',
  };
  expect(applianceActivities(restored, [config], now + 3600000)).toHaveLength(
    0,
  );
  restored.states[config.entity] = {
    ...restored.states[config.entity]!,
    state: 'on',
  };
  restored.states[config.started_at_entity] = {
    ...restored.states[config.started_at_entity]!,
    attributes: {
      has_date: true,
      has_time: true,
      timestamp: (now + 3600000) / 1000,
    },
  };
  expect(
    applianceActivities(restored, [config], now + 3600000)[0],
  ).toMatchObject({ elapsedMinutes: 0, progress: 0 });
});
it('omits invalid fallback timing and invalid actual progress without inventing replacements', () => {
  const h = hass();
  for (const state of ['unknown', 'unavailable', 'NaN', '', ' ', '-1', '101']) {
    h.states['sensor.example_oven_progress'] = {
      entity_id: 'sensor.example_oven_progress',
      state,
      attributes: {},
    };
    const oven = applianceActivities(h, activities.appliances, now)[2];
    expect(oven?.progress).toBeUndefined();
    expect(oven?.temperature).toBe(180);
  }
  h.states['sensor.example_oven_progress']!.state = '0';
  expect(applianceActivities(h, activities.appliances, now)[2]?.progress).toBe(
    0,
  );
  h.states['binary_sensor.example_washer'] = {
    ...h.states['binary_sensor.example_washer']!,
    last_changed: 'not-a-date',
  };
  h.states['sensor.example_oven_end'] = {
    ...h.states['sensor.example_oven_end']!,
    state: new Date(now - 60000).toISOString(),
  };
  const rows = applianceActivities(h, activities.appliances, now);
  expect(rows[0]?.elapsedMinutes).toBeUndefined();
  expect(rows[0]?.progress).toBeUndefined();
  expect(rows[2]?.remainingMinutes).toBeUndefined();
});
it('validates complete dates and formats elapsed durations in Dutch and English', () => {
  expect(timestamp('2026-02-30T12:00:00Z')).toBeUndefined();
  expect(timestamp('2026-01-01T24:00:00Z')).toBeUndefined();
  expect(timestamp('2026-01-01T13:00:00+01:00')).toBe(now);
  expect(durationText(60, 'nl-NL')).toBe('1 uur');
  expect(durationText(61, 'nl')).toBe('1 uur 1 minuut');
  expect(durationText(48, 'nl')).toBe('48 minuten');
  expect(durationText(135, 'en')).toBe('2 hours 15 minutes');
});
