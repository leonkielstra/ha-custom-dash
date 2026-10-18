import type {
  CardConfig,
  DeviceConfig,
  EntityItem,
  HeaderConfig,
  LightConfig,
  LightingConfig,
  ScenesConfig,
} from './types';

type ObjectValue = Record<string, unknown>;
function object(value: unknown, path = 'config'): ObjectValue {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error(`${path}: expected an object`);
  return value as ObjectValue;
}
function text(value: unknown, path: string): string {
  if (typeof value !== 'string' || !value.trim())
    throw new Error(`${path}: expected a non-empty string`);
  return value;
}
function optionalText(value: unknown, path: string): string | undefined {
  return value === undefined ? undefined : text(value, path);
}
function optionalBoolean(value: unknown, path: string): boolean | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'boolean')
    throw new Error(`${path}: expected a boolean`);
  return value;
}
function entity(value: unknown, path: string, domain?: string): string {
  const id = text(value, path);
  if (
    !/^[a-z_]+\.[a-z0-9_]+$/.test(id) ||
    (domain && !id.startsWith(`${domain}.`))
  ) {
    throw new Error(
      `${path}: expected ${domain ? `${domain}.` : 'domain.'}entity_id`,
    );
  }
  return id;
}
function base(value: unknown): CardConfig {
  const c = object(value);
  if (
    c.theme !== undefined &&
    !['auto', 'light', 'dark'].includes(String(c.theme))
  )
    throw new Error('theme: expected auto, light, or dark');
  return { type: text(c.type, 'type'), theme: c.theme as CardConfig['theme'] };
}
function item(value: unknown, path: string, domain: string): EntityItem {
  const c = object(value, path);
  return {
    entity: entity(c.entity, `${path}.entity`, domain),
    name: optionalText(c.name, `${path}.name`),
    icon: optionalText(c.icon, `${path}.icon`),
  };
}
function items(value: unknown, path: string, domain: string): EntityItem[] {
  if (!Array.isArray(value) || !value.length)
    throw new Error(`${path}: expected a non-empty list`);
  const result = value.map((v, i) => item(v, `${path}[${i}]`, domain));
  if (new Set(result.map((v) => v.entity)).size !== result.length)
    throw new Error(`${path}: duplicate entity IDs are not allowed`);
  return result;
}
export function headerConfig(value: unknown): HeaderConfig {
  const c = object(value);
  let lights: string[] | undefined;
  if (c.lights !== undefined) {
    if (!Array.isArray(c.lights))
      throw new Error('lights: expected a list of light entity IDs');
    lights = c.lights.map((v, i) => entity(v, `lights[${i}]`, 'light'));
    if (new Set(lights).size !== lights.length)
      throw new Error('lights: duplicate entity IDs are not allowed');
  }
  return {
    ...base(value),
    name: text(c.name, 'name'),
    icon: optionalText(c.icon, 'icon'),
    temperature:
      c.temperature === undefined
        ? undefined
        : entity(c.temperature, 'temperature'),
    humidity:
      c.humidity === undefined ? undefined : entity(c.humidity, 'humidity'),
    lights,
  };
}
export function scenesConfig(value: unknown): ScenesConfig {
  const c = object(value);
  return {
    ...base(value),
    title: optionalText(c.title, 'title'),
    scenes: items(c.scenes, 'scenes', 'scene'),
  };
}
export function lightConfig(value: unknown): LightConfig {
  const c = object(value);
  return {
    ...base(value),
    ...item(value, 'light', 'light'),
    slider_live_update: optionalBoolean(
      c.slider_live_update,
      'slider_live_update',
    ),
  };
}
export function lightingConfig(value: unknown): LightingConfig {
  const c = object(value);
  return {
    ...base(value),
    title: optionalText(c.title, 'title'),
    slider_live_update: optionalBoolean(
      c.slider_live_update,
      'slider_live_update',
    ),
    lights: items(c.lights, 'lights', 'light').map((light, index) => ({
      ...light,
      slider_live_update: optionalBoolean(
        object((c.lights as unknown[])[index]).slider_live_update,
        `lights[${index}].slider_live_update`,
      ),
    })),
  };
}
export function deviceConfig(value: unknown): DeviceConfig {
  return { ...base(value), ...item(value, 'device', 'media_player') };
}
