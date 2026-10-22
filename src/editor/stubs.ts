import type { HomeAssistant } from '../ha/types';
import type { EditorType } from './types';
import { editorLabel } from './strings';

/** Suggestions only; saved configuration stays explicit and is never auto-discovered. */
export function cardStub(
  type: EditorType,
  hass?: HomeAssistant,
  entities: string[] = [],
  fallback: string[] = [],
): Record<string, unknown> {
  const candidates = [
    ...entities,
    ...fallback,
    ...Object.keys(hass?.states ?? {}),
  ];
  const pick = (domain: string, placeholder: string) =>
    candidates.find((id) => id.startsWith(domain + '.')) ??
    `${domain}.${placeholder}`;
  const language = hass?.locale?.language;
  switch (type) {
    case 'home-maintenance-card':
      return { items: [] };
    case 'home-room-header-card':
      return { name: editorLabel('new_room', language) };
    case 'home-scene-card':
      return { scenes: [{ entity: pick('scene', 'example_scene') }] };
    case 'home-light-control-card':
      return { entity: pick('light', 'example_light') };
    case 'home-room-lighting-card':
      return { lights: [{ entity: pick('light', 'example_light') }] };
    case 'home-device-card':
      return { entity: pick('media_player', 'example_player') };
    case 'home-climate-card':
      return { entity: pick('climate', 'example_thermostat') };
    case 'home-section-card':
      return {
        title: editorLabel('new_section', language),
        cards: [{ type: 'markdown', content: '' }],
      };
    case 'home-hero-card':
      return {
        temperature: 'sensor.example_indoor_temperature',
        outdoor_temperature: 'sensor.example_outdoor_temperature',
        sun_entity: 'sun.sun',
        image_day: '/local/images/dashboard/home-day.png',
        image_night: '/local/images/dashboard/home-night.png',
      };
    case 'home-room-card':
      return { name: editorLabel('new_room', language) };
    case 'home-activity-section-card':
      return { appliances: [], hide_when_empty: true };
    case 'home-heat-pump-status-card':
    case 'home-heat-flow-card':
      return {
        entity: 'sensor.example_heat_output',
        mode_entity: 'sensor.example_valve',
        operating_entity: 'sensor.example_operation',
        operating_states: ['heating'],
        heating_states: [],
        hot_water_states: [],
      };
    case 'home-metric-card':
      return {
        items: [
          {
            entity: pick('sensor', 'example_sensor'),
            name: editorLabel('new_metric', language),
          },
        ],
      };
    case 'home-system-health-card':
      return {
        items: [
          {
            entity: pick('binary_sensor', 'example_connection'),
            name: editorLabel('new_metric', language),
          },
        ],
      };
  }
}
export function childStub(
  type: string,
  hass?: HomeAssistant,
): { type: string } & Record<string, unknown> {
  if (type.startsWith('custom:'))
    return { type, ...cardStub(type.slice(7) as EditorType, hass) };
  if (type === 'markdown') return { type, content: '' };
  if (type === 'entities' || type === 'history-graph')
    return { type, entities: [] };
  if (
    type === 'grid' ||
    type === 'vertical-stack' ||
    type === 'horizontal-stack'
  )
    return { type, cards: [] };
  return {
    type,
    entity:
      Object.keys(hass?.states ?? {}).find((id) =>
        id.startsWith(type === 'media-control' ? 'media_player.' : 'sensor.'),
      ) ??
      (type === 'media-control'
        ? 'media_player.example_player'
        : 'sensor.example_sensor'),
  };
}
