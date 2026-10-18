/** The small, public subset of Home Assistant's frontend contract used here. */
export interface HassEntity {
  entity_id: string;
  state: string;
  attributes: Record<string, unknown>;
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
  name: string;
  icon?: string;
  temperature?: string;
  humidity?: string;
  lights?: string[];
}
export interface ScenesConfig extends CardConfig {
  title?: string;
  scenes: EntityItem[];
}
export interface LightConfig extends CardConfig, EntityItem {}
export interface LightingConfig extends CardConfig {
  title?: string;
  lights: EntityItem[];
}
export interface DeviceConfig extends CardConfig, EntityItem {}
