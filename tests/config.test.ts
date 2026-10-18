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
