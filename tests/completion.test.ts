import { afterEach, expect, it, vi } from 'vitest';
import '../src/index';
import { applianceActivities } from '../src/ha/activity';
import { activityConfig } from '../src/ha/config';
import { ActivitySectionCard } from '../src/cards/activity-section';
import type { ApplianceConfig, HomeAssistant } from '../src/ha/types';
const now = Date.parse('2026-01-01T12:00:00Z');
const config: ApplianceConfig = {
  type: 'washer',
  name: 'Washer',
  entity: 'binary_sensor.example_washer',
  active_states: ['on'],
  finished_at_entity: 'input_datetime.example_finished',
};
function hass(minutes = 10): HomeAssistant {
  return {
    states: {
      [config.entity]: {
        entity_id: config.entity,
        state: 'off',
        attributes: {},
      },
      [config.finished_at_entity!]: {
        entity_id: config.finished_at_entity!,
        state: new Date(now - minutes * 60000).toISOString(),
        attributes: {
          has_date: true,
          has_time: true,
          timestamp: (now - minutes * 60000) / 1000,
        },
      },
    },
    locale: { language: 'nl' },
    callService: vi.fn(),
  };
}
afterEach(() => {
  document.body.replaceChildren();
  vi.useRealTimers();
});
it('shows persisted completion on a fresh mount, expires exactly at an hour, and active cycles take precedence', () => {
  expect(applianceActivities(hass(), [config], now)[0]).toMatchObject({
    state: 'finished',
    finishedMinutesAgo: 10,
  });
  expect(
    applianceActivities(hass(), [config], now)[0]?.progress,
  ).toBeUndefined();
  expect(
    applianceActivities(hass(), [config], now)[0]?.remainingMinutes,
  ).toBeUndefined();
  expect(applianceActivities(hass(59.99), [config], now)).toHaveLength(1);
  expect(applianceActivities(hass(60), [config], now)).toEqual([]);
  expect(
    applianceActivities(hass(), [{ ...config, finished_for_minutes: 0 }], now),
  ).toEqual([]);
  expect(
    applianceActivities(
      hass(10),
      [{ ...config, finished_for_minutes: 5 }],
      now,
    ),
  ).toEqual([]);
  const h = hass();
  h.states[config.entity] = { ...h.states[config.entity]!, state: 'on' };
  expect(applianceActivities(h, [config], now)[0]?.state).toBe('on');
  // The start automation clears the old persisted timestamp: it must not reappear on idle.
  h.states[config.entity] = { ...h.states[config.entity]!, state: 'off' };
  h.states[config.finished_at_entity!] = {
    entity_id: config.finished_at_entity!,
    state: '2000-01-01 00:00:00',
    attributes: { timestamp: 946684800 },
  };
  expect(applianceActivities(h, [config], now)).toEqual([]);
});
it('never invents completion from idle, unavailable, future dates, or a cancelled dishwasher program', () => {
  expect(
    applianceActivities(
      hass(),
      [{ ...config, finished_at_entity: undefined }],
      now,
    ),
  ).toEqual([]);
  for (const state of ['unknown', 'unavailable', 'error', 'aborting']) {
    const h = hass();
    h.states[config.entity] = { ...h.states[config.entity]!, state };
    expect(applianceActivities(h, [config], now)).toEqual([]);
  }
  expect(applianceActivities(hass(-1), [config], now)).toEqual([]);
  for (const state of ['unknown', 'unavailable', 'not a date']) {
    const h = hass();
    h.states[config.finished_at_entity!] = {
      entity_id: config.finished_at_entity!,
      state,
      attributes: {},
    };
    expect(applianceActivities(h, [config], now)).toEqual([]);
  }
  const h = hass();
  h.states[config.entity] = { ...h.states[config.entity]!, state: 'finished' };
  const dishwasher = {
    ...config,
    type: 'dishwasher' as const,
    active_states: ['run', 'pause', 'actionrequired'],
  };
  expect(applianceActivities(h, [dishwasher], now)[0]?.state).toBe('finished');
  h.states[config.entity] = { ...h.states[config.entity]!, state: 'pause' };
  expect(applianceActivities(h, [dishwasher], now)[0]?.state).toBe('pause');
  expect(() =>
    activityConfig({
      type: 'activity',
      appliances: [{ ...config, finished_for_minutes: -1 }],
    }),
  ).toThrow('non-negative');
  expect(() =>
    activityConfig({
      type: 'activity',
      appliances: [{ ...config, finished_states: ['on'] }],
    }),
  ).toThrow('overlap');
});
it('keeps finished cards visible, updates elapsed text, expires without hass events and cleans up timers', async () => {
  vi.useFakeTimers();
  vi.setSystemTime(now);
  const card = new ActivitySectionCard();
  card.setConfig({
    type: 'custom:home-activity-section-card',
    appliances: [config],
  });
  card.hass = hass(59);
  document.body.append(card);
  await card.updateComplete;
  expect(card.hidden).toBe(false);
  expect(card.shadowRoot!.textContent).toContain('Klaar');
  expect(card.shadowRoot!.textContent).toContain('59 min geleden');
  expect(card.shadowRoot!.querySelector('progress')).toBeNull();
  await vi.advanceTimersByTimeAsync(60000);
  await card.updateComplete;
  expect(card.hidden).toBe(true);
  expect(vi.getTimerCount()).toBe(0);
  card.remove();
  expect(vi.getTimerCount()).toBe(0);
});
