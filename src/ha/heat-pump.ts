import { applianceActivities, numericState, timestamp } from './activity';
import { available } from './entities';
import { languageOf, ui } from '../i18n/strings';
import type { HeatPumpCardConfig, HomeAssistant, MetricItem } from './types';

type HeatPumpPurpose =
  | 'heating'
  | 'hot_water'
  | 'active'
  | 'standby'
  | 'unknown'
  | 'offline'
  | 'fault'
  | 'locked';
export function heatPumpStatus(
  hass: HomeAssistant | undefined,
  config: HeatPumpCardConfig,
) {
  const state = (id?: string) => hass?.states[id ?? '']?.state;
  const compressorRunning =
    !config.compressor ||
    state(config.compressor) === 'on' ||
    state(config.auxiliary_heating) === 'on';
  const activity = compressorRunning
    ? applianceActivities(
        hass,
        [{ ...config, type: 'heat_pump', name: '', active_states: [] }],
        Date.now(),
      )[0]
    : undefined;
  const purpose: HeatPumpPurpose =
    config.fault_entity && state(config.fault_entity) === 'on'
      ? 'fault'
      : config.external_lock && state(config.external_lock) === 'on'
        ? 'locked'
        : [config.controller_online, config.outdoor_online].some(
              (id) => id && state(id) === 'off',
            )
          ? 'offline'
          : state(config.operating_entity) === 'standby'
            ? 'standby'
            : activity?.state === 'heat_pump_heating'
              ? 'heating'
              : activity?.state === 'heat_pump_hot_water'
                ? 'hot_water'
                : activity
                  ? 'active'
                  : 'unknown';
  return {
    purpose,
    activity,
    active: ['heating', 'hot_water', 'active'].includes(purpose),
    compressor: state(config.compressor),
    auxiliary: state(config.auxiliary_heating),
  };
}

export function metricValue(
  hass: HomeAssistant | undefined,
  item: Pick<MetricItem, 'entity' | 'precision' | 'format' | 'state_labels'>,
): string {
  const entity = hass?.states[item.entity];
  if (!available(entity)) return '—';
  if (!entity.state.trim() || /^(?:NaN|[+-]?Infinity)$/.test(entity.state))
    return '—';
  const text = ui(hass?.locale?.language);
  if (item.state_labels?.[entity.state])
    return item.state_labels[entity.state]!;
  const number = numericState(entity);
  if (item.format === 'number' && number === undefined) return '—';
  if (number !== undefined && entity.attributes.unit_of_measurement === 'EUR')
    return new Intl.NumberFormat(languageOf(hass?.locale?.language), {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: item.precision ?? 2,
      maximumFractionDigits: item.precision ?? 2,
    }).format(number);
  if (item.format === 'timestamp') {
    const time = timestamp(entity.state);
    if (time === undefined) return '—';
    return new Intl.DateTimeFormat(languageOf(hass?.locale?.language), {
      hour: '2-digit',
      minute: '2-digit',
    }).format(time);
  }
  if (item.format === 'duration_hours') {
    if (number === undefined || number < 0) return '—';
    const minutes = Math.round(number * 60);
    const hours = Math.floor(minutes / 60);
    return `${hours} ${text.shortHours} ${minutes % 60} min`;
  }
  if (item.format === 'state' || number === undefined)
    return (
      text.heatPump.states[entity.state] ??
      text.status[entity.state] ??
      entity.state
    );
  const value = new Intl.NumberFormat(languageOf(hass?.locale?.language), {
    minimumFractionDigits: item.precision ?? 0,
    maximumFractionDigits: item.precision ?? 1,
  }).format(number);
  const unit = entity.attributes.unit_of_measurement;
  return `${value}${typeof unit === 'string' && unit ? `${unit === '%' ? '' : ' '}${unit}` : ''}`;
}
