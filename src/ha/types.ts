/** The small, public subset of Home Assistant's frontend contract used here. */
export interface HassEntity {
  entity_id: string;
  state: string;
  attributes: Record<string, unknown>;
  last_changed?: string;
}
export interface HomeAssistant {
  states: Record<string, HassEntity | undefined>;
  callService(
    domain: string,
    service: string,
    data: Record<string, unknown>,
  ): Promise<unknown>;
  locale?: { language?: string };
  themes?: { darkMode?: boolean };
  config?: { unit_system?: { temperature?: string } };
}
export interface CardConfig {
  type: string;
  theme?: 'auto' | 'light' | 'dark';
}
export interface EntityItem {
  entity: string;
  name?: string;
  icon?: string;
}
export interface HeaderConfig extends CardConfig {
  name?: string;
  show_name?: boolean;
  icon?: string;
  temperature?: string;
  humidity?: string;
  lights?: string[];
}
export interface ScenesConfig extends CardConfig {
  title?: string;
  scenes: EntityItem[];
}
export interface LightItem extends EntityItem {
  slider_live_update?: boolean;
}
export interface LightConfig extends CardConfig, LightItem {}
export interface LightingConfig extends CardConfig {
  title?: string;
  slider_live_update?: boolean;
  lights: LightItem[];
}
export interface LovelaceCardConfig extends Record<string, unknown> {
  type: string;
}
export interface SectionConfig extends CardConfig {
  title: string;
  cards: LovelaceCardConfig[];
}
export interface DeviceConfig extends CardConfig, EntityItem {}
export interface ClimateConfig extends CardConfig, EntityItem {}
export type IconTone = 'teal' | 'sand' | 'blue' | 'violet' | 'neutral';

export interface HeroConfig extends CardConfig {
  temperature: string;
  outdoor_temperature: string;
  sun_entity: string;
  image_day: string;
  image_night: string;
  weather?: string;
}
export interface RoomConfig extends CardConfig {
  name: string;
  icon?: string;
  navigation_path?: string;
  temperature?: string;
  lights?: string[];
  icon_tone?: IconTone;
}
export type ApplianceType =
  'washer' | 'dryer' | 'oven' | 'dishwasher' | 'heat_pump';
export interface ApplianceConfig {
  type: ApplianceType;
  name: string;
  icon?: string;
  entity: string;
  active_states: string[];
  room?: string;
  reference_duration_minutes?: number;
  started_at_entity?: string;
  /** Persisted program completion timestamp; normally an input_datetime. */
  finished_at_entity?: string;
  finished_for_minutes?: number;
  finished_states?: string[];
  current_temperature?: string;
  progress?: string;
  end_time?: string;
  mode_entity?: string;
  operating_entity?: string;
  operating_states?: string[];
  fan_speed?: string;
  heating_states?: string[];
  hot_water_states?: string[];
  /** Minimum thermal output in kW, exclusive. */
  minimum_heat_output?: number;
}
export interface ActivityConfig extends CardConfig {
  title?: string;
  hide_when_empty: boolean;
  appliances: ApplianceConfig[];
}

export interface HeatPumpCardConfig extends CardConfig {
  entity: string;
  mode_entity: string;
  operating_entity: string;
  operating_states: string[];
  heating_states: string[];
  hot_water_states: string[];
  minimum_heat_output?: number;
  compressor?: string;
  fan_speed?: string;
  electric_power?: string;
  outdoor_temperature?: string;
  auxiliary_heating?: string;
  controller_online?: string;
  outdoor_online?: string;
  fault_entity?: string;
  external_lock?: string;
  supply_temperature?: string;
  return_temperature?: string;
  temperature_difference?: string;
  pressure?: string;
  water_temperature?: string;
  water_target?: string;
  title?: string;
}
export interface MetricItem {
  entity: string;
  name: string;
  icon?: string;
  secondary_entity?: string;
  secondary_name?: string;
  precision?: number;
  format?: 'number' | 'state' | 'duration_hours' | 'timestamp';
  navigation_path?: string;
  state_labels?: Record<string, string>;
}
export interface MetricCardConfig extends CardConfig {
  title?: string;
  layout: 'grid' | 'panel' | 'strip' | 'list';
  columns: number;
  items: MetricItem[];
}
export interface SystemHealthConfig extends CardConfig {
  title?: string;
  items: { entity: string; name: string; updated?: string; icon?: string }[];
}

export type MaintenanceCategory =
  'batteries' | 'supplies' | 'backups' | 'updates' | 'devices';
export interface MaintenanceItem {
  entity: string;
  name: string;
  action: string;
  kind: 'level' | 'state' | 'update' | 'stale';
  category: MaintenanceCategory;
  room?: string;
  icon?: string;
  threshold?: number;
  critical_threshold?: number;
  max_age_hours?: number;
  problem_states?: string[];
  healthy_states?: string[];
  severity?: 'warning' | 'urgent';
  normal_text?: string;
  problem_text?: string;
}
export interface MaintenanceConfig extends CardConfig {
  title?: string;
  items: MaintenanceItem[];
}
