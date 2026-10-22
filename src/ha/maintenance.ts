import { available } from './entities';
import { numericState, timestamp } from './activity';
import type { HomeAssistant, MaintenanceItem } from './types';

export interface MaintenanceReading {
  config: MaintenanceItem;
  status: 'urgent' | 'warning' | 'unknown' | 'healthy';
  value?: number;
  ageHours?: number;
}
export function maintenanceReadings(
  hass: HomeAssistant | undefined,
  items: MaintenanceItem[],
  now: number,
): MaintenanceReading[] {
  return items.map((config) => {
    const entity = hass?.states[config.entity];
    const result: MaintenanceReading = { config, status: 'unknown' };
    if (!available(entity)) return result;
    if (config.kind === 'level') {
      const value = numericState(entity);
      const unit = entity.attributes.unit_of_measurement;
      if (
        value === undefined ||
        value < 0 ||
        value > 100 ||
        (unit !== undefined && unit !== '%')
      )
        return result;
      result.value = value;
      result.status =
        value <= (config.critical_threshold ?? 10)
          ? 'urgent'
          : value <= (config.threshold ?? 25)
            ? 'warning'
            : 'healthy';
    } else if (config.kind === 'stale') {
      const time = timestamp(entity.state);
      if (time === undefined || time > now) return result;
      result.ageHours = (now - time) / 3600000;
      result.status =
        result.ageHours > (config.max_age_hours ?? 48)
          ? (config.severity ?? 'warning')
          : 'healthy';
    } else {
      const problem =
        config.kind === 'update' ? ['on'] : (config.problem_states ?? []);
      const healthy =
        config.kind === 'update' ? ['off'] : (config.healthy_states ?? []);
      result.status = problem.includes(entity.state)
        ? (config.severity ?? 'warning')
        : healthy.includes(entity.state)
          ? 'healthy'
          : 'unknown';
    }
    return result;
  });
}
export const maintenancePriority = (value: MaintenanceReading) =>
  ({ urgent: 0, warning: 1, unknown: 2, healthy: 3 })[value.status];
