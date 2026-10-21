import { available } from './entities';
import { languageOf } from '../i18n/strings';
import type { ApplianceConfig, HassEntity, HomeAssistant } from './types';

export function numericState(entity?: HassEntity): number | undefined {
  if (!available(entity) || !entity.state.trim()) return undefined;
  const value = Number(entity.state);
  return Number.isFinite(value) ? value : undefined;
}

/** Accept full timestamps only; a time of day alone is not an appliance start. */
export function timestamp(value: unknown): number | undefined {
  if (typeof value !== 'string') return undefined;
  const parts =
    /^(\d{4})-(\d{2})-(\d{2})[T ]([01]\d|2[0-3]):([0-5]\d):([0-5]\d)(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?$/.exec(
      value,
    );
  if (!parts) return undefined;
  const [, year, month, day] = parts;
  const days = new Date(Date.UTC(Number(year), Number(month), 0)).getUTCDate();
  if (
    Number(month) < 1 ||
    Number(month) > 12 ||
    Number(day) < 1 ||
    Number(day) > days
  )
    return undefined;
  const result = Date.parse(value.replace(' ', 'T'));
  return Number.isFinite(result) ? result : undefined;
}

function startTimestamp(entity?: HassEntity): number | undefined {
  if (!available(entity)) return undefined;
  const attributes = entity.attributes;
  // input_datetime supplies an absolute timestamp when it has both date and time.
  if (attributes.has_date === false || attributes.has_time === false)
    return undefined;
  if (
    typeof attributes.timestamp === 'number' &&
    Number.isFinite(attributes.timestamp) &&
    attributes.timestamp > 0
  )
    return attributes.timestamp * 1000;
  return timestamp(entity.state);
}

export interface ApplianceActivity {
  config: ApplianceConfig;
  state: string;
  progress?: number;
  indicative: boolean;
  elapsedMinutes?: number;
  approximate: boolean;
  remainingMinutes?: number;
  temperature?: number;
}

export function applianceActivities(
  hass: HomeAssistant | undefined,
  appliances: ApplianceConfig[],
  now: number,
): ApplianceActivity[] {
  return appliances.flatMap((config) => {
    const entity = hass?.states[config.entity];
    if (!available(entity) || !config.active_states.includes(entity.state))
      return [];
    const timedByReference =
      config.type === 'washer' || config.type === 'dryer';
    const start = config.started_at_entity
      ? startTimestamp(hass?.states[config.started_at_entity])
      : timestamp(entity.last_changed);
    const elapsedMinutes =
      timedByReference && start !== undefined && start <= now
        ? Math.floor((now - start) / 60000)
        : undefined;
    const reportedProgress = numericState(hass?.states[config.progress ?? '']);
    const end = timestamp(hass?.states[config.end_time ?? '']?.state);
    const referenceProgress =
      elapsedMinutes !== undefined && config.reference_duration_minutes
        ? Math.min(
            100,
            (elapsedMinutes / config.reference_duration_minutes) * 100,
          )
        : undefined;
    return [
      {
        config,
        state: entity.state,
        progress: timedByReference
          ? referenceProgress
          : reportedProgress !== undefined &&
              reportedProgress >= 0 &&
              reportedProgress <= 100
            ? reportedProgress
            : undefined,
        indicative: timedByReference,
        elapsedMinutes,
        approximate: !config.started_at_entity,
        remainingMinutes:
          !timedByReference && end !== undefined && end > now
            ? Math.ceil((end - now) / 60000)
            : undefined,
        temperature: numericState(
          hass?.states[config.current_temperature ?? ''],
        ),
      },
    ];
  });
}

export function durationText(minutes: number, language?: string): string {
  const nl = languageOf(language) === 'nl';
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  const h = `${hours} ${nl ? 'uur' : hours === 1 ? 'hour' : 'hours'}`;
  const m = `${rest} ${nl ? (rest === 1 ? 'minuut' : 'minuten') : rest === 1 ? 'minute' : 'minutes'}`;
  return hours ? `${h}${rest ? ` ${m}` : ''}` : m;
}

/** Compact display only; complete elapsed wording remains the accessible label. */
export function durationCompact(minutes: number, language?: string): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return hours
    ? `${hours} ${languageOf(language) === 'nl' ? 'u' : 'h'}${rest ? ` ${rest} min` : ''}`
    : `${rest} min`;
}
