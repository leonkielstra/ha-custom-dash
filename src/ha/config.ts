import type {
  ActivityConfig,
  ApplianceConfig,
  CardConfig,
  ClimateConfig,
  DeviceConfig,
  EntityItem,
  HeaderConfig,
  HeroConfig,
  LightConfig,
  LightingConfig,
  LovelaceCardConfig,
  SectionConfig,
  ScenesConfig,
  RoomConfig,
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
  const name = optionalText(c.name, 'name');
  const showName = optionalBoolean(c.show_name, 'show_name');
  if (showName && !name)
    throw new Error('name: required when show_name is true');
  return {
    ...base(value),
    name,
    show_name: showName,
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
export function sectionConfig(value: unknown): SectionConfig {
  const c = object(value);
  if (!Array.isArray(c.cards) || c.cards.length === 0)
    throw new Error('cards: expected a non-empty list');
  const cards = c.cards.map((card, index) => {
    const child = object(card, `cards[${index}]`);
    return {
      ...child,
      type: text(child.type, `cards[${index}].type`),
    } as LovelaceCardConfig;
  });
  return {
    ...base(value),
    title: text(c.title, 'title'),
    cards,
  };
}
export function deviceConfig(value: unknown): DeviceConfig {
  return { ...base(value), ...item(value, 'device', 'media_player') };
}
export function climateConfig(value: unknown): ClimateConfig {
  return { ...base(value), ...item(value, 'climate', 'climate') };
}

function optionalEntity(value: unknown, path: string): string | undefined {
  return value === undefined ? undefined : entity(value, path);
}

export function heroConfig(value: unknown): HeroConfig {
  const c = object(value);
  return {
    ...base(value),
    temperature: entity(c.temperature, 'temperature'),
    outdoor_temperature: entity(c.outdoor_temperature, 'outdoor_temperature'),
    sun_entity: entity(c.sun_entity, 'sun_entity', 'sun'),
    image_day: text(c.image_day, 'image_day'),
    image_night: text(c.image_night, 'image_night'),
    weather:
      c.weather === undefined
        ? undefined
        : entity(c.weather, 'weather', 'weather'),
  };
}

export function roomConfig(value: unknown): RoomConfig {
  const c = object(value);
  if (
    c.icon_tone !== undefined &&
    !['teal', 'sand', 'blue', 'violet', 'neutral'].includes(String(c.icon_tone))
  )
    throw new Error('icon_tone: expected teal, sand, blue, violet, or neutral');
  let lights: string[] | undefined;
  if (c.lights !== undefined) {
    if (!Array.isArray(c.lights))
      throw new Error('lights: expected a list of light entity IDs');
    lights = [
      ...new Set(c.lights.map((v, i) => entity(v, `lights[${i}]`, 'light'))),
    ];
  }
  const path = optionalText(c.navigation_path, 'navigation_path');
  if (path && (!path.startsWith('/') || path.startsWith('//')))
    throw new Error(
      'navigation_path: expected an internal path starting with /',
    );
  return {
    ...base(value),
    name: text(c.name, 'name'),
    icon: optionalText(c.icon, 'icon'),
    navigation_path: path,
    temperature: optionalEntity(c.temperature, 'temperature'),
    lights,
    icon_tone: c.icon_tone as RoomConfig['icon_tone'],
  };
}

export function activityConfig(value: unknown): ActivityConfig {
  const c = object(value);
  if (!Array.isArray(c.appliances))
    throw new Error('appliances: expected a list');
  const appliances = c.appliances.map((value, index): ApplianceConfig => {
    const path = `appliances[${index}]`;
    const a = object(value, path);
    const heatPump = a.type === 'heat_pump';
    if (
      !['washer', 'dryer', 'oven', 'dishwasher', 'heat_pump'].includes(
        String(a.type),
      )
    )
      throw new Error(
        `${path}.type: expected washer, dryer, oven, dishwasher, or heat_pump`,
      );
    if (
      !heatPump &&
      (!Array.isArray(a.active_states) || !a.active_states.length)
    )
      throw new Error(
        `${path}.active_states: expected a non-empty list of strings`,
      );
    const stateList = (value: unknown, key: string): string[] => {
      if (value === undefined) return [];
      if (!Array.isArray(value))
        throw new Error(`${path}.${key}: expected a list of strings`);
      return value.map((state, i) => text(state, `${path}.${key}[${i}]`));
    };
    const heatingStates = stateList(a.heating_states, 'heating_states');
    const hotWaterStates = stateList(a.hot_water_states, 'hot_water_states');
    const operatingEntity = optionalEntity(
      a.operating_entity,
      `${path}.operating_entity`,
    );
    const operatingStates = stateList(a.operating_states, 'operating_states');
    if (operatingEntity && !operatingStates.length)
      throw new Error(
        `${path}.operating_states: required with operating_entity`,
      );
    if (heatingStates.some((state) => hotWaterStates.includes(state)))
      throw new Error(
        `${path}.heating_states: must not overlap hot_water_states`,
      );
    const minimumOutput = a.minimum_heat_output;
    if (
      minimumOutput !== undefined &&
      (typeof minimumOutput !== 'number' ||
        !Number.isFinite(minimumOutput) ||
        minimumOutput < 0)
    )
      throw new Error(
        `${path}.minimum_heat_output: expected a non-negative number in kW`,
      );
    const duration = a.reference_duration_minutes;
    if (
      duration !== undefined &&
      (typeof duration !== 'number' ||
        !Number.isFinite(duration) ||
        duration <= 0)
    )
      throw new Error(
        `${path}.reference_duration_minutes: expected a positive number`,
      );
    return {
      type: a.type as ApplianceConfig['type'],
      name: text(a.name, `${path}.name`),
      icon: optionalText(a.icon, `${path}.icon`),
      entity: entity(a.entity, `${path}.entity`),
      active_states: heatPump
        ? []
        : (a.active_states as unknown[]).map((state, i) =>
            text(state, `${path}.active_states[${i}]`),
          ),
      room: optionalText(a.room, `${path}.room`),
      reference_duration_minutes: duration as number | undefined,
      started_at_entity: optionalEntity(
        a.started_at_entity,
        `${path}.started_at_entity`,
      ),
      current_temperature: optionalEntity(
        a.current_temperature,
        `${path}.current_temperature`,
      ),
      progress: optionalEntity(a.progress, `${path}.progress`),
      end_time: optionalEntity(a.end_time, `${path}.end_time`),
      mode_entity: heatPump
        ? entity(a.mode_entity, `${path}.mode_entity`)
        : undefined,
      operating_entity: operatingEntity,
      operating_states: operatingStates,
      fan_speed: optionalEntity(a.fan_speed, `${path}.fan_speed`),
      heating_states: heatingStates,
      hot_water_states: hotWaterStates,
      minimum_heat_output: minimumOutput as number | undefined,
    };
  });
  return {
    ...base(value),
    title: optionalText(c.title, 'title'),
    hide_when_empty:
      optionalBoolean(c.hide_when_empty, 'hide_when_empty') ?? true,
    appliances,
  };
}
