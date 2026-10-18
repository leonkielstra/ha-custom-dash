import { expect, it } from 'vitest';
import { activityConfig, heroConfig, roomConfig } from '../src/ha/config';
import { activities, hero, roomGroups } from '../preview/home-fixtures';

it('accepts the Home schema without helpers, and all twelve room shapes', () => {
  expect(heroConfig(hero)).toMatchObject(hero);
  expect(activityConfig(activities).appliances).toHaveLength(4);
  const rooms = roomGroups.flatMap((floor) => floor.rooms).map(roomConfig);
  expect(rooms).toHaveLength(12);
  expect(rooms[7]?.lights).toHaveLength(3);
  expect(rooms[2]?.lights).toBeUndefined();
  expect(rooms[3]?.temperature).toBeUndefined();
  expect(roomConfig({ type: 'test', name: 'Room', lights: [] }).lights).toEqual(
    [],
  );
  expect(
    roomConfig({
      type: 'test',
      name: 'Room',
      lights: ['light.example', 'light.example'],
    }).lights,
  ).toEqual(['light.example']);
  expect(activityConfig({ type: 'test', appliances: [] }).hide_when_empty).toBe(
    true,
  );
});

it('reports specific paths for invalid hero, room, and appliance configuration', () => {
  expect(() =>
    heroConfig({ ...hero, sun_entity: 'sensor.example_sun' }),
  ).toThrow('sun_entity');
  expect(() => heroConfig({ ...hero, image_day: '' })).toThrow('image_day');
  expect(() => heroConfig({ ...hero, temperature: null })).toThrow(
    'temperature',
  );
  expect(() => roomConfig({ type: 'test', name: '' })).toThrow('name');
  expect(() =>
    roomConfig({ type: 'test', name: 'Room', lights: ['switch.example'] }),
  ).toThrow('lights[0]');
  expect(() =>
    roomConfig({ type: 'test', name: 'Room', lights: 'light.example' }),
  ).toThrow('lights');
  for (const path of [
    'javascript:alert(1)',
    '//external.example/path',
    'https://example.com/',
  ]) {
    expect(() =>
      roomConfig({ type: 'test', name: 'Room', navigation_path: path }),
    ).toThrow('navigation_path');
  }
  for (const [property, value] of [
    ['type', 'fridge'],
    ['entity', 'invalid'],
    ['active_states', []],
    ['active_states', [true]],
    ['reference_duration_minutes', 0],
    ['reference_duration_minutes', Infinity],
    ['reference_duration_minutes', '120'],
    ['end_time', 'bad-id'],
    ['started_at_entity', 'bad-id'],
  ] as const) {
    expect(() =>
      activityConfig({
        ...activities,
        appliances: [{ ...activities.appliances[0], [property]: value }],
      }),
    ).toThrow(`appliances[0].${property}`);
  }
  expect(() =>
    activityConfig({ ...activities, hide_when_empty: 'true' }),
  ).toThrow('hide_when_empty');
});
