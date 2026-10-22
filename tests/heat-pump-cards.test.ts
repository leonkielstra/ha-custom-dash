import { afterEach, expect, it, vi } from 'vitest';
import '../src/index';
import { HeatPumpStatusCard } from '../src/cards/heat-pump-status';
import { HeatFlowCard } from '../src/cards/heat-flow';
import { MetricCard } from '../src/cards/metrics';
import { SystemHealthCard } from '../src/cards/system-health';
import {
  heatPumpCardConfig,
  metricCardConfig,
  systemHealthConfig,
} from '../src/ha/heat-pump-config';
import { heatPumpStatus, metricValue } from '../src/ha/heat-pump';
import {
  dashboard,
  entities,
  initialStates,
} from '../preview/heatpump-fixtures';
import type { HomeAssistant } from '../src/ha/types';

const cards = dashboard.views.flatMap((view) =>
  view.sections.flatMap((section) => section.cards),
);
const statusConfig = cards.find(
  (c) => c.type === 'custom:home-heat-pump-status-card',
)!;
const flowConfig = cards.find((c) => c.type === 'custom:home-heat-flow-card')!;
const healthConfig = cards.find(
  (c) => c.type === 'custom:home-system-health-card',
)!;
const hass = (): HomeAssistant => ({
  states: structuredClone(initialStates),
  locale: { language: 'nl' },
  themes: { darkMode: true },
  callService: vi.fn(),
});
afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

it('accepts all five views and every public heat-pump card configuration', () => {
  expect(dashboard.views).toHaveLength(5);
  for (const c of cards) {
    if (c.type === 'custom:home-metric-card')
      expect(metricCardConfig(c).items.length).toBeGreaterThan(0);
    if (
      c.type === 'custom:home-heat-pump-status-card' ||
      c.type === 'custom:home-heat-flow-card'
    )
      expect(heatPumpCardConfig(c).operating_states).toEqual(['heating']);
    if (c.type === 'custom:home-system-health-card')
      expect(systemHealthConfig(c).items).toHaveLength(3);
  }
});

it('rejects invalid configuration with useful property paths', () => {
  for (const [key, value] of [
    ['columns', 0],
    ['layout', 'wide'],
    ['items', []],
  ] as const)
    expect(() =>
      metricCardConfig({
        type: 'metric',
        items: [{ entity: 'sensor.example', name: 'Value' }],
        [key]: value,
      }),
    ).toThrow(key);
  for (const [key, value] of [
    ['entity', 'bad'],
    ['name', ''],
    ['secondary_entity', 'bad'],
    ['precision', 5],
    ['format', 'bad'],
    ['navigation_path', '//external.test'],
    ['state_labels', { on: 1 }],
  ] as const)
    expect(() =>
      metricCardConfig({
        type: 'metric',
        items: [{ entity: 'sensor.example', name: 'Value', [key]: value }],
      }),
    ).toThrow(`items[0].${key}`);
  expect(() =>
    heatPumpCardConfig({ ...statusConfig, compressor: 'bad' }),
  ).toThrow('compressor');
  expect(() =>
    heatPumpCardConfig({ ...statusConfig, operating_states: [] }),
  ).toThrow('operating_states');
  expect(() =>
    systemHealthConfig({
      type: 'health',
      items: [
        { entity: 'binary_sensor.example', name: 'Controller', updated: 'bad' },
      ],
    }),
  ).toThrow('items[0].updated');
});

it('distinguishes confirmed purposes, standby, unavailable inputs and lockouts without routing retained heat', () => {
  const h = hass();
  const config = heatPumpCardConfig(statusConfig);
  const set = (id: string, state: string) => {
    h.states[id] = { ...h.states[id]!, state };
  };
  const purpose = () => heatPumpStatus(h, config).purpose;
  expect(purpose()).toBe('hot_water');
  set(entities.valve, 'climateCircuitOne');
  expect(purpose()).toBe('heating');
  set(entities.valve, 'unrecognized');
  expect(purpose()).toBe('active');
  set(entities.compressor, 'off');
  expect(purpose()).toBe('unknown');
  set(entities.operation, 'standby');
  expect(purpose()).toBe('standby');
  set(entities.operation, 'cooling');
  expect(purpose()).toBe('unknown');
  set(entities.operation, 'heating');
  set(entities.compressor, 'on');
  set(entities.output, 'unavailable');
  expect(purpose()).toBe('unknown');
  set(entities.controller, 'off');
  expect(purpose()).toBe('offline');
  set(config.external_lock!, 'on');
  expect(purpose()).toBe('locked');
  set(entities.fault, 'on');
  expect(purpose()).toBe('fault');
  expect(heatPumpStatus(undefined, config).purpose).toBe('unknown');
});

it('updates the status card on state events, translates labels, and is read-only', async () => {
  const card = new HeatPumpStatusCard();
  card.setConfig(statusConfig);
  card.hass = hass();
  document.body.append(card);
  await card.updateComplete;
  expect(card.shadowRoot!.textContent).toContain('Warm water wordt opgewarmd');
  expect(card.shadowRoot!.textContent).toContain('3,50 kW');
  expect(card.shadowRoot!.textContent).toContain('Ventilator 42%');
  card.hass = {
    ...card.hass,
    locale: { language: 'en' },
    states: {
      ...card.hass.states,
      [entities.valve]: {
        ...card.hass.states[entities.valve]!,
        state: 'climateCircuitOne',
      },
    },
  };
  await card.updateComplete;
  expect(card.shadowRoot!.textContent).toContain('Heating the home');
  expect(card.shadowRoot!.textContent).toContain('Outside');
  expect(card.hass.callService).not.toHaveBeenCalled();
});

it('highlights only the confirmed branch, and shows no active route for standby or faults', async () => {
  const card = new HeatFlowCard();
  card.setConfig(flowConfig);
  card.hass = hass();
  document.body.append(card);
  await card.updateComplete;
  expect(card.shadowRoot!.querySelector('path.hot')).not.toBeNull();
  expect(card.shadowRoot!.querySelector('.target.active')).toBeNull();
  expect(card.shadowRoot!.textContent).toContain('48,3 °C');
  card.hass = {
    ...card.hass,
    states: {
      ...card.hass.states,
      [entities.operation]: {
        ...card.hass.states[entities.operation]!,
        state: 'standby',
      },
    },
  };
  await card.updateComplete;
  expect(card.shadowRoot!.querySelector('path.hot, path.running')).toBeNull();
});

it('formats units, durations, unavailable values and untranslated technical states without fabricated values', () => {
  const h = hass();
  const id = 'sensor.example_metric';
  const value = (state: string, attributes: Record<string, unknown> = {}) => {
    h.states[id] = { entity_id: id, state, attributes };
    return metricValue(h, { entity: id });
  };
  expect(value('68.4', { unit_of_measurement: '°F' })).toBe('68,4 °F');
  expect(value('unknown')).toBe('—');
  expect(value('NaN')).toBe('—');
  expect(value('')).toBe('—');
  expect(value('climateCircuitOne')).toBe('Verwarmingscircuit');
  expect(value('new_vendor_diagnostic')).toBe('new_vendor_diagnostic');
  value('5.2', { unit_of_measurement: 'h' });
  expect(metricValue(h, { entity: id, format: 'duration_hours' })).toBe(
    '5 u 12 min',
  );
  value('44', { unit_of_measurement: 'min' });
  expect(metricValue(h, { entity: id })).toBe('44 min');
  expect(value('1.92', { unit_of_measurement: 'EUR' })).toMatch(/^€\s1,92$/);
  value('2026-02-30T12:00:00Z');
  expect(metricValue(h, { entity: id, format: 'timestamp' })).toBe('—');
});

it('opens native entity details from metric buttons without calling services', async () => {
  const card = new MetricCard();
  card.setConfig({
    type: 'metric',
    items: [{ entity: entities.temperature, name: 'Binnen' }],
  });
  card.hass = hass();
  const details = vi.fn();
  card.addEventListener('hass-more-info', details);
  document.body.append(card);
  await card.updateComplete;
  card.shadowRoot!.querySelector('button')!.click();
  expect(details.mock.calls[0]?.[0].detail).toEqual({
    entityId: entities.temperature,
  });
  expect(card.hass.callService).not.toHaveBeenCalled();
});

it('renders metric links with client-side navigation and preserves modified-click behavior', async () => {
  const card = new MetricCard();
  card.setConfig({
    type: 'metric',
    items: [
      {
        entity: entities.temperature,
        name: 'Binnen',
        navigation_path: '/dashboard-example/comfort',
      },
    ],
  });
  card.hass = hass();
  document.body.append(card);
  await card.updateComplete;
  const push = vi.spyOn(history, 'pushState').mockImplementation(() => {});
  const changed = vi.fn();
  window.addEventListener('location-changed', changed);
  const link = card.shadowRoot!.querySelector('a')!;
  link.dispatchEvent(
    new MouseEvent('click', { button: 0, bubbles: true, cancelable: true }),
  );
  expect(push).toHaveBeenCalledOnce();
  expect(changed).toHaveBeenCalledOnce();
  link.dispatchEvent(
    new MouseEvent('click', {
      button: 0,
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    }),
  );
  expect(push).toHaveBeenCalledOnce();
  window.removeEventListener('location-changed', changed);
});

it('never conflates unknown connection status with online or cloud fetch time with measurement time', async () => {
  const card = new SystemHealthCard();
  card.setConfig(healthConfig);
  card.hass = hass();
  document.body.append(card);
  await card.updateComplete;
  expect(card.shadowRoot!.querySelectorAll('.online')).toHaveLength(3);
  expect(card.shadowRoot!.textContent).toContain(
    'Ophaaltijd is niet de oorspronkelijke meettijd',
  );
  card.hass = {
    ...card.hass,
    states: {
      ...card.hass.states,
      [entities.controller]: {
        ...card.hass.states[entities.controller]!,
        state: 'unavailable',
      },
    },
  };
  await card.updateComplete;
  expect(card.shadowRoot!.querySelectorAll('.online')).toHaveLength(2);
  expect(card.shadowRoot!.textContent).toContain('Niet beschikbaar');
});
