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
export type ApplianceType = 'washer' | 'dryer' | 'oven' | 'dishwasher';
export interface ApplianceConfig {
  type: ApplianceType;
  name: string;
  icon?: string;
  entity: string;
  active_states: string[];
  room?: string;
  reference_duration_minutes?: number;
  started_at_entity?: string;
  current_temperature?: string;
  progress?: string;
  end_time?: string;
}
export interface ActivityConfig extends CardConfig {
  title?: string;
  hide_when_empty: boolean;
  appliances: ApplianceConfig[];
}
