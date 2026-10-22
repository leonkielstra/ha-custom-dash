import { afterEach, expect, it, vi } from 'vitest';
import '../src/index';
import { ActivitySectionCard } from '../src/cards/activity-section';
import { applianceActivities } from '../src/ha/activity';
import { activityConfig } from '../src/ha/config';
import { fixtureStates, heatPump } from '../preview/home-fixtures';
import type { HomeAssistant } from '../src/ha/types';

const config = {
  type: 'custom:home-activity-section-card',
  appliances: [heatPump],
};
const hass = (): HomeAssistant => ({
  states: fixtureStates('hot-water'),
  locale: { language: 'nl' },
  callService: vi.fn(),
});
afterEach(() => document.body.replaceChildren());

it('uses reported thermal output and explicit valve mappings, never settings or circulation alone', () => {
  const h = hass();
  const rows = () => applianceActivities(h, [heatPump], Date.now());
  expect(rows()[0]).toMatchObject({
    state: 'heat_pump_hot_water',
    heatOutput: 3.497,
  });
  expect(rows()[0]?.progress).toBeUndefined();
  expect(rows()[0]?.remainingMinutes).toBeUndefined();
  const mode = h.states[heatPump.mode_entity!]!;
  mode.state = 'climateCircuitOne';
  expect(rows()[0]?.state).toBe('heat_pump_heating');
  for (const state of ['other_position', 'unknown', 'unavailable']) {
    mode.state = state;
    expect(rows()[0]?.state).toBe('heat_pump_active');
  }
  delete h.states[heatPump.mode_entity!];
  expect(rows()[0]?.state).toBe('heat_pump_active');
  h.states[heatPump.mode_entity!] = { ...mode, state: 'domesticHotWater' };
  for (const state of ['0', '-1', 'unavailable', 'unknown', 'NaN', '', ' ']) {
    h.states[heatPump.entity]!.state = state;
    expect(rows()).toEqual([]);
  }
  delete h.states[heatPump.entity];
  expect(rows()).toEqual([]);
  expect(applianceActivities(undefined, [heatPump], Date.now())).toEqual([]);
});

it('normalizes watts and kilowatts, honors the output threshold, and rejects ambiguous units', () => {
  const h = hass();
  const entity = h.states[heatPump.entity]!;
  entity.state = '100';
  entity.attributes.unit_of_measurement = 'W';
  const configs = [{ ...heatPump, minimum_heat_output: 0.1 }];
  expect(applianceActivities(h, configs, Date.now())).toEqual([]);
  entity.state = '101';
  expect(applianceActivities(h, configs, Date.now())[0]?.heatOutput).toBe(
    0.101,
  );
  for (const unit of ['kWh', undefined, '']) {
    entity.attributes.unit_of_measurement = unit;
    expect(applianceActivities(h, configs, Date.now())).toEqual([]);
  }
});

it('suppresses standby, cooling, and unavailable operating states even with retained positive output', () => {
  const h = hass();
  const operation = h.states[heatPump.operating_entity!]!;
  for (const state of ['standby', 'cooling', 'unknown', 'unavailable']) {
    operation.state = state;
    expect(applianceActivities(h, [heatPump], Date.now())).toEqual([]);
  }
  delete h.states[heatPump.operating_entity!];
  expect(applianceActivities(h, [heatPump], Date.now())).toEqual([]);
  // Optional for controllers without a separate operating status sensor.
  expect(
    applianceActivities(
      h,
      [{ ...heatPump, operating_entity: undefined }],
      Date.now(),
    ),
  ).toHaveLength(1);
});

it('shows only valid fan percentages and preserves activity when fan data is missing', () => {
  const h = hass();
  const fan = h.states[heatPump.fan_speed!]!;
  const rows = () => applianceActivities(h, [heatPump], Date.now());
  expect(rows()[0]?.fanSpeed).toBe(42);
  for (const state of ['0', '100', '54.5']) {
    fan.state = state;
    expect(rows()[0]?.fanSpeed).toBe(Number(state));
  }
  for (const state of ['unknown', 'unavailable', '-1', '101', '', 'NaN']) {
    fan.state = state;
    expect(rows()[0]?.fanSpeed).toBeUndefined();
    expect(rows()[0]?.state).toBe('heat_pump_hot_water');
  }
  fan.state = '50';
  fan.attributes.unit_of_measurement = 'rpm';
  expect(rows()[0]?.fanSpeed).toBeUndefined();
  delete h.states[heatPump.fan_speed!];
  expect(rows()[0]?.fanSpeed).toBeUndefined();
});

it('validates heat-pump configuration without requiring active states or guessing heating valve values', () => {
  const { active_states: _states, ...input } = heatPump;
  void _states;
  expect(
    activityConfig({ ...config, appliances: [input] }).appliances[0],
  ).toMatchObject({ active_states: [] });
  for (const [key, value] of [
    ['mode_entity', undefined],
    ['hot_water_states', 'dhw'],
    ['heating_states', [1]],
    ['minimum_heat_output', -1],
    ['minimum_heat_output', Infinity],
    ['minimum_heat_output', '1'],
    ['operating_entity', 'bad-id'],
    ['operating_states', []],
    ['fan_speed', 'bad-id'],
  ]) {
    expect(() =>
      activityConfig({
        ...config,
        appliances: [{ ...input, [key as string]: value }],
      }),
    ).toThrow(`appliances[0].${key}`);
  }
  expect(() =>
    activityConfig({
      ...config,
      appliances: [{ ...input, heating_states: ['domesticHotWater'] }],
    }),
  ).toThrow('must not overlap');
});

it('reacts to power and valve updates, localizes clear labels, and hides when idle without service calls', async () => {
  const card = new ActivitySectionCard();
  card.setConfig(config);
  card.hass = hass();
  document.body.append(card);
  await card.updateComplete;
  const text = () => card.shadowRoot!.textContent;
  expect(text()).toContain('Warm water wordt opgewarmd');
  expect(text()).toContain('3,5kW');
  expect(text()).toContain('Ventilator 42%');
  expect(card.shadowRoot!.querySelector('progress')).toBeNull();
  const set = async (id: string, state: string) => {
    card.hass = {
      ...card.hass!,
      states: {
        ...card.hass!.states,
        [id]: { ...card.hass!.states[id]!, state },
      },
    };
    await card.updateComplete;
  };
  await set(heatPump.fan_speed!, '65');
  expect(text()).toContain('Ventilator 65%');
  await set(heatPump.fan_speed!, 'unavailable');
  expect(card.shadowRoot!.querySelector('.fan-speed')).toBeNull();
  await set(heatPump.mode_entity!, 'climateCircuitOne');
  expect(text()).toContain('Woning wordt verwarmd');
  await set(heatPump.mode_entity!, 'unknown');
  expect(text()).toContain('Warmtepomp actief');
  card.hass = { ...card.hass, locale: { language: 'en' } };
  await card.updateComplete;
  expect(text()).toContain('Heat pump active');
  await set(heatPump.mode_entity!, 'domesticHotWater');
  expect(text()).toContain('Heating hot water');
  await set(heatPump.entity, '0');
  expect(card.hidden).toBe(true);
  await set(heatPump.entity, '3.497');
  expect(card.hidden).toBe(false);
  await set(heatPump.operating_entity!, 'standby');
  expect(card.hidden).toBe(true);
  await set(heatPump.operating_entity!, 'heating');
  expect(card.hidden).toBe(false);
  expect(card.hass.callService).not.toHaveBeenCalled();
});
