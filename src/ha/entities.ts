import type { HassEntity, HomeAssistant } from './types';
export function available(entity?: HassEntity): entity is HassEntity {
  return !!entity && !['unavailable', 'unknown'].includes(entity.state);
}
export function brightnessPercent(raw: unknown): number {
  return typeof raw === 'number' && Number.isFinite(raw)
    ? Math.round((Math.min(255, Math.max(0, raw)) * 100) / 255)
    : 0;
}
export function brightnessRaw(percent: number): number {
  return Math.round(
    (Math.min(100, Math.max(0, Number.isFinite(percent) ? percent : 0)) * 255) /
      100,
  );
}
const dimmableModes = new Set([
  'brightness',
  'color_temp',
  'hs',
  'xy',
  'rgb',
  'rgbw',
  'rgbww',
  'white',
]);
export function supportsBrightness(entity?: HassEntity): boolean {
  const modes = entity?.attributes.supported_color_modes;
  return (
    Array.isArray(modes) &&
    modes.some((mode) => typeof mode === 'string' && dimmableModes.has(mode))
  );
}
export function nameOf(
  entity: HassEntity | undefined,
  override?: string,
): string {
  return (
    override ??
    (typeof entity?.attributes.friendly_name === 'string'
      ? entity.attributes.friendly_name
      : (entity?.entity_id ?? 'Missing entity'))
  );
}
export function entityStatus(entity?: HassEntity): string {
  if (!entity) return 'Not found';
  if (entity.state === 'unavailable') return 'Unavailable';
  if (entity.state === 'unknown') return 'Unknown';
  return entity.state
    .replaceAll('_', ' ')
    .replace(/^./, (c) => c.toUpperCase());
}
export function sensorValue(
  hass: HomeAssistant | undefined,
  id: string | undefined,
  fallbackUnit: string,
): string {
  if (!id) return '';
  const entity = hass?.states[id];
  if (
    !available(entity) ||
    !entity.state.trim() ||
    !Number.isFinite(Number(entity.state))
  )
    return '—';
  let formatted: string;
  try {
    formatted = new Intl.NumberFormat(hass?.locale?.language, {
      maximumFractionDigits: 1,
    }).format(Number(entity.state));
  } catch {
    formatted = new Intl.NumberFormat('en', {
      maximumFractionDigits: 1,
    }).format(Number(entity.state));
  }
  const unit =
    typeof entity.attributes.unit_of_measurement === 'string'
      ? entity.attributes.unit_of_measurement
      : fallbackUnit;
  return `${formatted}${unit}`;
}
export interface LightValue {
  on: boolean;
  brightness?: number;
}
export function lightValue(entity?: HassEntity): LightValue {
  return {
    on: entity?.state === 'on',
    brightness: brightnessPercent(entity?.attributes.brightness),
  };
}
export function sameLight(actual: LightValue, wanted: LightValue): boolean {
  return (
    actual.on === wanted.on &&
    (wanted.brightness === undefined ||
      Math.abs((actual.brightness ?? 0) - wanted.brightness) <= 1)
  );
}
