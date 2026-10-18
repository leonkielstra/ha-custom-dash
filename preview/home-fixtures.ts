import type {
  ActivityConfig,
  HassEntity,
  HomeAssistant,
  RoomConfig,
} from '../src/ha/types';

export type HomeScenario =
  'day' | 'night' | 'multiple' | 'unavailable' | 'no-lights';
// Public fixtures mirror the supplied configuration's structure, using fictional IDs only.
const floors = [
  {
    title: 'Begane grond',
    rooms: [
      ['Woonkamer', 'mdi:sofa-outline', 5, true],
      ['Keuken', 'mdi:countertop-outline', 7, false],
      ['Bijkeuken', 'mdi:door-open', 0, true],
      ['Entree', 'mdi:coat-rack', 0, false],
    ],
  },
  {
    title: 'Eerste verdieping',
    rooms: [
      ['Overloop', 'mdi:stairs', 1, true],
      ['Washok', 'mdi:washing-machine', 0, true],
      ['Kantoor', 'mdi:desk', 3, false],
      ['Slaapkamer', 'mdi:bed-outline', 3, true],
      ['Badkamer', 'mdi:shower', 1, true],
    ],
  },
  { title: 'Tweede verdieping', rooms: [['Zolder', 'mdi:home-roof', 0, true]] },
  {
    title: 'Buiten',
    rooms: [
      ['Achtertuin', 'mdi:flower-outline', 1, false],
      ['Oprit', 'mdi:car-outline', 2, false],
    ],
  },
] satisfies { title: string; rooms: [string, string, number, boolean][] }[];
let index = 0;
export const roomGroups = floors.map((floor) => ({
  title: floor.title,
  rooms: floor.rooms.map(
    ([name, icon, lightCount, temperature]): RoomConfig => {
      const id = index++;
      return {
        type: 'custom:home-room-card',
        name,
        icon,
        navigation_path: `/dashboard-home/${['woonkamer', 'keuken', 'bijkeuken', 'entree', 'overloop', 'washok', 'kantoor', 'slaapkamer', 'badkamer', 'zolder', 'achtertuin', 'oprit'][id]}`,
        ...(temperature
          ? { temperature: `sensor.example_room_${id}_temperature` }
          : {}),
        ...(lightCount
          ? {
              lights: Array.from(
                { length: lightCount },
                (_, i) => `light.example_room_${id}_${i}`,
              ),
            }
          : {}),
      };
    },
  ),
}));
export const hero = {
  type: 'custom:home-hero-card',
  temperature: 'sensor.example_indoor_temperature',
  outdoor_temperature: 'sensor.example_outdoor_temperature',
  sun_entity: 'sun.sun',
  image_day: '/preview/assets/home-day.svg',
  image_night: '/preview/assets/home-night.svg',
};
export const activities: ActivityConfig = {
  type: 'custom:home-activity-section-card',
  title: 'Actieve apparaten',
  hide_when_empty: true,
  appliances: [
    {
      type: 'washer',
      name: 'Wasmachine',
      entity: 'binary_sensor.example_washer',
      active_states: ['on'],
      room: 'Washok',
      reference_duration_minutes: 120,
    },
    {
      type: 'dryer',
      name: 'Wasdroger',
      entity: 'binary_sensor.example_dryer',
      active_states: ['on'],
      room: 'Washok',
      reference_duration_minutes: 120,
    },
    {
      type: 'oven',
      name: 'Oven',
      entity: 'sensor.example_oven_status',
      active_states: ['run', 'pause', 'actionrequired'],
      room: 'Keuken',
      current_temperature: 'sensor.example_oven_temperature',
      progress: 'sensor.example_oven_progress',
      end_time: 'sensor.example_oven_end',
    },
    {
      type: 'dishwasher',
      name: 'Vaatwasser',
      entity: 'sensor.example_dishwasher_status',
      active_states: ['run', 'pause', 'actionrequired'],
      room: 'Keuken',
      progress: 'sensor.example_dishwasher_progress',
      end_time: 'sensor.example_dishwasher_end',
    },
  ],
};
export const scenes = {
  type: 'custom:home-scene-card',
  title: 'Favoriete scènes',
  scenes: [
    {
      entity: 'scene.example_read',
      name: 'Lezen',
      icon: 'mdi:book-open-page-variant-outline',
    },
    {
      entity: 'scene.example_relax',
      name: 'Ontspannen',
      icon: 'mdi:weather-night',
    },
    {
      entity: 'scene.example_work',
      name: 'Werklicht',
      icon: 'mdi:lightbulb-outline',
    },
  ],
};
export function fixtureStates(
  scenario: HomeScenario,
  now = Date.now(),
): HomeAssistant['states'] {
  const states: HomeAssistant['states'] = {};
  const add = (
    id: string,
    state: string,
    attributes: Record<string, unknown> = {},
    lastChanged?: string,
  ) => {
    states[id] = {
      entity_id: id,
      state,
      attributes,
      last_changed: lastChanged,
    } satisfies HassEntity;
  };
  const multiple = scenario === 'multiple' || scenario === 'unavailable';
  add('sun.sun', scenario === 'night' ? 'below_horizon' : 'above_horizon');
  add(hero.temperature, '20.4', { unit_of_measurement: '°C' });
  add(hero.outdoor_temperature, '11.1', { unit_of_measurement: '°C' });
  for (const [i, room] of roomGroups.flatMap((g) => g.rooms).entries()) {
    if (room.temperature)
      add(room.temperature, (20.4 - i * 0.3).toFixed(1), {
        unit_of_measurement: '°C',
      });
    for (const [j, light] of (room.lights ?? []).entries())
      add(light, i === 0 || j === 0 ? 'on' : 'off');
  }
  for (const scene of scenes.scenes)
    add(scene.entity, new Date(now).toISOString());
  add(
    'binary_sensor.example_washer',
    multiple || scenario === 'night' ? 'on' : 'off',
    {},
    new Date(now - 48 * 60000).toISOString(),
  );
  add(
    'binary_sensor.example_dryer',
    multiple ? 'on' : 'off',
    {},
    new Date(now - 135 * 60000).toISOString(),
  );
  add('sensor.example_oven_status', multiple ? 'run' : 'idle');
  add('sensor.example_oven_temperature', '180', { unit_of_measurement: '°C' });
  add(
    'sensor.example_oven_progress',
    scenario === 'unavailable' ? 'unavailable' : '72',
    { unit_of_measurement: '%' },
  );
  add('sensor.example_oven_end', new Date(now + 12 * 60000).toISOString());
  add('sensor.example_dishwasher_status', multiple ? 'run' : 'idle');
  add('sensor.example_dishwasher_progress', 'unavailable');
  add(
    'sensor.example_dishwasher_end',
    new Date(now + 38 * 60000).toISOString(),
  );
  if (scenario === 'unavailable') {
    add('light.example_room_7_2', 'unavailable');
    add('sensor.example_room_4_temperature', 'unavailable');
    add(hero.outdoor_temperature, 'unavailable');
  }
  return states;
}
