import { activityConfig } from './config';
import type {
  CardConfig,
  HeatPumpCardConfig,
  MetricCardConfig,
  MetricItem,
  SystemHealthConfig,
} from './types';

function object(value: unknown, path = 'config'): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error(`${path}: expected an object`);
  return value as Record<string, unknown>;
}
function text(value: unknown, path: string): string {
  if (typeof value !== 'string' || !value.trim())
    throw new Error(`${path}: expected a non-empty string`);
  return value;
}
function entity(value: unknown, path: string): string {
  const id = text(value, path);
  if (!/^[a-z_]+\.[a-z0-9_]+$/.test(id))
    throw new Error(`${path}: expected domain.entity_id`);
  return id;
}
function optional(value: unknown, path: string): string | undefined {
  return value === undefined ? undefined : text(value, path);
}
function base(c: Record<string, unknown>): CardConfig {
  if (
    c.theme !== undefined &&
    !['auto', 'light', 'dark'].includes(String(c.theme))
  )
    throw new Error('theme: expected auto, light, or dark');
  return { type: text(c.type, 'type'), theme: c.theme as CardConfig['theme'] };
}
function list(value: unknown, path: string): unknown[] {
  if (!Array.isArray(value) || !value.length)
    throw new Error(`${path}: expected a non-empty list`);
  return value;
}

export function heatPumpCardConfig(value: unknown): HeatPumpCardConfig {
  const c = object(value);
  const normalized = activityConfig({
    type: 'activity',
    appliances: [{ ...c, type: 'heat_pump', name: 'heat pump' }],
  }).appliances[0]!;
  const result: HeatPumpCardConfig = {
    ...base(c),
    entity: normalized.entity,
    mode_entity: normalized.mode_entity!,
    operating_entity: entity(c.operating_entity, 'operating_entity'),
    operating_states: normalized.operating_states!,
    heating_states: normalized.heating_states!,
    hot_water_states: normalized.hot_water_states!,
    minimum_heat_output: normalized.minimum_heat_output,
    title: optional(c.title, 'title'),
  };
  const keys = [
    'compressor',
    'fan_speed',
    'electric_power',
    'outdoor_temperature',
    'auxiliary_heating',
    'controller_online',
    'outdoor_online',
    'fault_entity',
    'external_lock',
    'supply_temperature',
    'return_temperature',
    'temperature_difference',
    'pressure',
    'water_temperature',
    'water_target',
  ] as const;
  for (const key of keys)
    if (c[key] !== undefined) result[key] = entity(c[key], key);
  return result;
}

export function metricCardConfig(value: unknown): MetricCardConfig {
  const c = object(value);
  const layout = c.layout ?? 'grid';
  if (!['grid', 'panel', 'strip', 'list'].includes(String(layout)))
    throw new Error('layout: expected grid, panel, strip, or list');
  const columns = c.columns ?? 2;
  if (
    typeof columns !== 'number' ||
    !Number.isInteger(columns) ||
    columns < 1 ||
    columns > 4
  )
    throw new Error('columns: expected an integer from 1 to 4');
  const items = list(c.items, 'items').map((value, i): MetricItem => {
    const path = `items[${i}]`;
    const item = object(value, path);
    if (
      item.precision !== undefined &&
      (typeof item.precision !== 'number' ||
        !Number.isInteger(item.precision) ||
        item.precision < 0 ||
        item.precision > 3)
    )
      throw new Error(`${path}.precision: expected an integer from 0 to 3`);
    if (
      item.format !== undefined &&
      !['number', 'state', 'duration_hours', 'timestamp'].includes(
        String(item.format),
      )
    )
      throw new Error(`${path}.format: unsupported format`);
    const navigation = optional(
      item.navigation_path,
      `${path}.navigation_path`,
    );
    if (
      navigation &&
      (!navigation.startsWith('/') || navigation.startsWith('//'))
    )
      throw new Error(`${path}.navigation_path: expected an internal path`);
    const labels =
      item.state_labels === undefined
        ? undefined
        : object(item.state_labels, `${path}.state_labels`);
    return {
      entity: entity(item.entity, `${path}.entity`),
      name: text(item.name, `${path}.name`),
      icon: optional(item.icon, `${path}.icon`),
      secondary_entity:
        item.secondary_entity === undefined
          ? undefined
          : entity(item.secondary_entity, `${path}.secondary_entity`),
      secondary_name: optional(item.secondary_name, `${path}.secondary_name`),
      precision: item.precision as number | undefined,
      format: item.format as MetricItem['format'],
      navigation_path: navigation,
      state_labels: labels
        ? Object.fromEntries(
            Object.entries(labels).map(([key, v]) => [
              key,
              text(v, `${path}.state_labels.${key}`),
            ]),
          )
        : undefined,
    };
  });
  return {
    ...base(c),
    title: optional(c.title, 'title'),
    layout: layout as MetricCardConfig['layout'],
    columns,
    items,
  };
}

export function systemHealthConfig(value: unknown): SystemHealthConfig {
  const c = object(value);
  return {
    ...base(c),
    title: optional(c.title, 'title'),
    items: list(c.items, 'items').map((value, i) => {
      const path = `items[${i}]`;
      const item = object(value, path);
      return {
        entity: entity(item.entity, `${path}.entity`),
        name: text(item.name, `${path}.name`),
        icon: optional(item.icon, `${path}.icon`),
        updated:
          item.updated === undefined
            ? undefined
            : entity(item.updated, `${path}.updated`),
      };
    }),
  };
}
