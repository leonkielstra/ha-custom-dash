import { expect, it } from 'vitest';
import {
  deviceConfig,
  headerConfig,
  lightConfig,
  lightingConfig,
  scenesConfig,
} from '../src/ha/config';
it('gives property paths for invalid configuration', () => {
  expect(() =>
    lightingConfig({ type: 'test', lights: [{ entity: 'switch.example' }] }),
  ).toThrow('lights[0].entity');
  expect(() => lightingConfig({ type: 'test', lights: [] })).toThrow('lights');
  expect(() =>
    scenesConfig({ type: 'test', scenes: [{ entity: 'light.example' }] }),
  ).toThrow('scenes[0].entity');
  expect(() =>
    deviceConfig({ type: 'test', entity: 'climate.example' }),
  ).toThrow('media_player.');
  expect(() => headerConfig({ type: 'test', name: '' })).toThrow('name');
  expect(() => headerConfig({ type: 'test', show_name: true })).toThrow(
    'required when show_name is true',
  );
  expect(() =>
    lightConfig({ type: 'test', entity: 'light.example', theme: 'invalid' }),
  ).toThrow('theme');
  expect(() => headerConfig(null)).toThrow('config');
});
it('rejects duplicate entity IDs and preserves explicit order', () => {
  const lights = [{ entity: 'light.example_b' }, { entity: 'light.example_a' }];
  expect(lightingConfig({ type: 'test', lights }).lights).toEqual(lights);
  expect(() =>
    lightingConfig({ type: 'test', lights: [lights[0], lights[0]] }),
  ).toThrow('duplicate');
  expect(() =>
    headerConfig({
      type: 'test',
      name: 'Room',
      lights: ['light.example', 'light.example'],
    }),
  ).toThrow('duplicate');
  expect(headerConfig({ type: 'test' }).name).toBeUndefined();
});
it('copies normalized configuration so callers cannot mutate light lists', () => {
  const raw = {
    type: 'test',
    lights: [{ entity: 'light.example', name: 'Example' }],
  };
  const normalized = lightingConfig(raw);
  raw.lights[0]!.name = 'Changed';
  expect(normalized.lights[0]?.name).toBe('Example');
});
it('accepts live slider defaults and per-light overrides and rejects non-booleans', () => {
  expect(
    lightConfig({ type: 'test', entity: 'light.example' }).slider_live_update,
  ).toBeUndefined();
  expect(
    lightConfig({
      type: 'test',
      entity: 'light.example',
      slider_live_update: true,
    }).slider_live_update,
  ).toBe(true);
  const config = lightingConfig({
    type: 'test',
    slider_live_update: true,
    lights: [
      { entity: 'light.example_a' },
      { entity: 'light.example_b', slider_live_update: false },
    ],
  });
  expect(config.slider_live_update).toBe(true);
  expect(config.lights[1]?.slider_live_update).toBe(false);
  for (const value of ['true', 1, null]) {
    expect(() =>
      lightConfig({
        type: 'test',
        entity: 'light.example',
        slider_live_update: value,
      }),
    ).toThrow('slider_live_update');
    expect(() =>
      lightingConfig({
        type: 'test',
        slider_live_update: value,
        lights: [{ entity: 'light.example' }],
      }),
    ).toThrow('slider_live_update');
    expect(() =>
      lightingConfig({
        type: 'test',
        lights: [{ entity: 'light.example', slider_live_update: value }],
      }),
    ).toThrow('lights[0].slider_live_update');
  }
});
