import { afterEach, expect, it, vi } from 'vitest';
import '../src/index';
import { MaintenanceCard } from '../src/cards/maintenance';
import { maintenanceConfig } from '../src/ha/config';
import { maintenanceReadings } from '../src/ha/maintenance';
import {
  maintenance,
  maintenanceStates,
} from '../preview/maintenance-fixtures';
import type { HomeAssistant } from '../src/ha/types';
const now = Date.parse('2026-01-01T12:00:00Z');
const hass = (scenario = 'attention'): HomeAssistant => ({
  states: maintenanceStates(scenario, now),
  locale: { language: 'nl' },
  themes: { darkMode: true },
  callService: vi.fn(),
});
afterEach(() => {
  document.body.replaceChildren();
  vi.useRealTimers();
});
it('classifies explicit rules without guessing state meanings or treating unavailable as healthy', () => {
  const readings = maintenanceReadings(
    hass(),
    maintenanceConfig(maintenance).items,
    now,
  );
  expect(readings.filter((r) => r.status === 'urgent')).toHaveLength(1);
  expect(readings.filter((r) => r.status === 'warning')).toHaveLength(3);
  const missing = maintenanceReadings(
    hass('unavailable'),
    maintenance.items,
    now,
  );
  expect(
    missing.find((r) => r.config.entity === 'sensor.example_rinse')?.status,
  ).toBe('unknown');
  expect(
    missing.find((r) => r.config.entity === 'sensor.example_bed_battery')
      ?.status,
  ).toBe('unknown');
  expect(
    maintenanceReadings(undefined, maintenance.items, now).every(
      (r) => r.status === 'unknown',
    ),
  ).toBe(true);
});
it('validates units, malformed and future timestamps, inclusive level thresholds, and explicit mappings', () => {
  const h = hass();
  const level = maintenance.items[2]!;
  const backup = maintenance.items[7]!;
  h.states[level.entity] = {
    entity_id: level.entity,
    state: '10',
    attributes: { unit_of_measurement: '%' },
  };
  expect(maintenanceReadings(h, [level], now)[0]?.status).toBe('urgent');
  for (const state of ['-1', '101', 'NaN', 'unknown', 'unavailable']) {
    h.states[level.entity] = { ...h.states[level.entity]!, state };
    expect(maintenanceReadings(h, [level], now)[0]?.status).toBe('unknown');
  }
  h.states[level.entity] = {
    entity_id: level.entity,
    state: '3',
    attributes: { unit_of_measurement: 'V' },
  };
  expect(maintenanceReadings(h, [level], now)[0]?.status).toBe('unknown');
  for (const state of [
    '2026-02-30T00:00:00Z',
    '2027-01-01T00:00:00Z',
    'garbage',
  ]) {
    h.states[backup.entity] = {
      entity_id: backup.entity,
      state,
      attributes: {},
    };
    expect(maintenanceReadings(h, [backup], now)[0]?.status).toBe('unknown');
  }
  expect(() =>
    maintenanceConfig({
      ...maintenance,
      items: [{ ...level, critical_threshold: 30, threshold: 20 }],
    }),
  ).toThrow('must not exceed');
  expect(() =>
    maintenanceConfig({
      ...maintenance,
      items: [maintenance.items[0], maintenance.items[0]],
    }),
  ).toThrow('duplicate');
  expect(() =>
    maintenanceConfig({
      ...maintenance,
      items: [{ ...maintenance.items[0], healthy_states: ['on'] }],
    }),
  ).toThrow('overlap');
  expect(() =>
    maintenanceConfig({
      ...maintenance,
      items: [{ ...maintenance.items[0], problem_states: [] }],
    }),
  ).toThrow('explicit');
});
it('updates stale backup status without hass events, opens native details and cleans up its timer', async () => {
  vi.useFakeTimers();
  vi.setSystemTime(now);
  const card = new MaintenanceCard();
  const h = hass('healthy');
  const backup = maintenance.items[7]!;
  h.states[backup.entity] = {
    entity_id: backup.entity,
    state: new Date(now - 47 * 3600000 - 59 * 60000).toISOString(),
    attributes: {},
  };
  card.setConfig({ ...maintenance, items: [backup] });
  card.hass = h;
  document.body.append(card);
  await card.updateComplete;
  expect(card.shadowRoot!.textContent).toContain('Alles in orde');
  await vi.advanceTimersByTimeAsync(120000);
  await card.updateComplete;
  expect(card.shadowRoot!.textContent).toContain(
    'Controleer de automatische back-up',
  );
  const detail = vi.fn();
  card.addEventListener('hass-more-info', detail);
  card.shadowRoot!.querySelector('button')!.click();
  expect(detail).toHaveBeenCalledOnce();
  expect(h.callService).not.toHaveBeenCalled();
  card.remove();
  expect(vi.getTimerCount()).toBe(0);
});
