import type { MaintenanceConfig, HassEntity } from '../src/ha/types';
export const maintenance: MaintenanceConfig = {
  type: 'custom:home-maintenance-card',
  items: [
    {
      entity: 'binary_sensor.example_leak',
      name: 'Lekkagesensor washok',
      action: 'Controleer de lekkage in het washok',
      kind: 'state',
      category: 'devices',
      room: 'Washok',
      problem_states: ['on'],
      healthy_states: ['off'],
      severity: 'urgent',
      normal_text: 'Geen lekkage',
      problem_text: 'Water gedetecteerd',
    },
    {
      entity: 'sensor.example_rinse',
      name: 'Vaatwasser · Glansspoelmiddel',
      action: 'Vul glansspoelmiddel bij',
      kind: 'state',
      category: 'supplies',
      room: 'Keuken',
      problem_states: ['present'],
      healthy_states: ['off'],
      normal_text: 'Voldoende',
      problem_text: 'Bijna op',
    },
    {
      entity: 'sensor.example_hall_battery',
      name: 'Overloopsensor',
      action: 'Vervang de batterij van de overloopsensor',
      kind: 'level',
      category: 'batteries',
      room: 'Overloop',
      threshold: 20,
      critical_threshold: 10,
    },
    {
      entity: 'sensor.example_bed_battery',
      name: 'Klimaatsensor slaapkamer',
      action: 'Vervang de batterij van de klimaatsensor',
      kind: 'level',
      category: 'batteries',
      room: 'Slaapkamer',
      threshold: 20,
      critical_threshold: 10,
    },
    {
      entity: 'sensor.example_living_battery',
      name: 'Klimaatsensor woonkamer',
      action: 'Vervang de batterij van de klimaatsensor',
      kind: 'level',
      category: 'batteries',
      room: 'Woonkamer',
    },
    {
      entity: 'sensor.example_salt',
      name: 'Vaatwasser · Zout',
      action: 'Vul vaatwasserzout bij',
      kind: 'state',
      category: 'supplies',
      problem_states: ['present'],
      healthy_states: ['off'],
      normal_text: 'Voldoende',
    },
    {
      entity: 'sensor.example_ink',
      name: 'Printer · Zwarte inkt',
      action: 'Vul zwarte inkt bij',
      kind: 'level',
      category: 'supplies',
      threshold: 15,
      critical_threshold: 5,
    },
    {
      entity: 'sensor.example_backup',
      name: 'Laatste succesvolle back-up',
      action: 'Controleer de automatische back-up',
      kind: 'stale',
      category: 'backups',
      max_age_hours: 48,
    },
    {
      entity: 'update.example_core',
      name: 'Home Assistant Core',
      action: 'Bekijk de Home Assistant-update',
      kind: 'update',
      category: 'updates',
    },
    {
      entity: 'update.example_sensor',
      name: 'Klimaatsensor',
      action: 'Bekijk de firmware-update',
      kind: 'update',
      category: 'updates',
    },
  ],
};
export function maintenanceStates(
  scenario = 'attention',
  now = Date.now(),
): Record<string, HassEntity> {
  const result: Record<string, HassEntity> = {};
  const states: Record<string, string> = {
    'binary_sensor.example_leak': scenario === 'healthy' ? 'off' : 'on',
    'sensor.example_rinse': scenario === 'healthy' ? 'off' : 'present',
    'sensor.example_hall_battery': scenario === 'healthy' ? '87' : '12',
    'sensor.example_bed_battery': '24',
    'sensor.example_living_battery': '97',
    'sensor.example_salt': 'off',
    'sensor.example_ink': '68',
    'sensor.example_backup': new Date(
      now - (scenario === 'healthy' ? 3 : 72) * 3600000,
    ).toISOString(),
    'update.example_core': 'off',
    'update.example_sensor': 'off',
  };
  if (scenario === 'unavailable') {
    states['sensor.example_bed_battery'] = 'unavailable';
    states['sensor.example_rinse'] = 'unmapped_state';
  }
  for (const item of maintenance.items)
    result[item.entity] = {
      entity_id: item.entity,
      state: states[item.entity]!,
      attributes: item.kind === 'level' ? { unit_of_measurement: '%' } : {},
    };
  return result;
}
