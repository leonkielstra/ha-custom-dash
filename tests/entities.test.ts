import { describe, expect, it } from 'vitest';
import {
  available,
  brightnessPercent,
  brightnessRaw,
  sensorValue,
  supportsBrightness,
  sameLight,
} from '../src/ha/entities';
import type { HassEntity, HomeAssistant } from '../src/ha/types';
const entity = (state: string, attributes = {}): HassEntity => ({
  entity_id: 'light.example',
  state,
  attributes,
});
describe('light state helpers', () => {
  it('converts and clamps brightness with at most one percent rounding error', () => {
    expect(brightnessPercent(0)).toBe(0);
    expect(brightnessPercent(255)).toBe(100);
    expect(brightnessPercent(128)).toBe(50);
    expect(brightnessRaw(50)).toBe(128);
    expect(brightnessRaw(200)).toBe(255);
    expect(brightnessRaw(-1)).toBe(0);
    expect(brightnessRaw(NaN)).toBe(0);
    expect(brightnessPercent(undefined)).toBe(0);
    for (let i = 0; i <= 100; i++)
      expect(
        Math.abs(brightnessPercent(brightnessRaw(i)) - i),
      ).toBeLessThanOrEqual(1);
  });
  it('uses supported modes, not a brightness attribute or current color mode', () => {
    expect(
      supportsBrightness(
        entity('on', { supported_color_modes: ['rgbww'], color_mode: 'onoff' }),
      ),
    ).toBe(true);
    expect(
      supportsBrightness(
        entity('on', { supported_color_modes: ['onoff'], brightness: 255 }),
      ),
    ).toBe(false);
    expect(
      supportsBrightness(entity('on', { supported_color_modes: ['unknown'] })),
    ).toBe(false);
    expect(supportsBrightness(undefined)).toBe(false);
  });
  it('rejects missing and unknown states and tolerates device brightness rounding', () => {
    expect(available(undefined)).toBe(false);
    expect(available(entity('unknown'))).toBe(false);
    expect(available(entity('unavailable'))).toBe(false);
    expect(available(entity('off'))).toBe(true);
    expect(
      sameLight({ on: true, brightness: 51 }, { on: true, brightness: 50 }),
    ).toBe(true);
    expect(sameLight({ on: true, brightness: 90 }, { on: true })).toBe(true);
  });
});
it('formats sensor values using the HA locale and preserves their actual unit', () => {
  const hass = {
    states: { 'sensor.example': entity('20.4', { unit_of_measurement: '°F' }) },
    locale: { language: 'nl' },
    callService: async () => undefined,
  } satisfies HomeAssistant;
  expect(sensorValue(hass, 'sensor.example', '°C')).toBe('20,4°F');
  expect(sensorValue(hass, 'sensor.missing', '°C')).toBe('—');
  hass.states['sensor.example'] = entity('unknown');
  expect(sensorValue(hass, 'sensor.example', '°C')).toBe('—');
});
