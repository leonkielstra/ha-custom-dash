/** Public subset of HA's LovelaceConfigForm and selector contracts. */
export interface ObjectField {
  selector: Selector;
  label?: string;
  description?: string;
  required?: boolean;
  default?: unknown;
}
export type Selector =
  | { text: { multiple?: true } }
  | {
      entity: {
        filter?: { domain?: string | string[] };
        multiple?: boolean;
        reorder?: boolean;
      };
    }
  | { boolean: Record<string, never> }
  | { icon: Record<string, never> }
  | {
      number: {
        min?: number;
        max?: number;
        step?: number | 'any';
        mode: 'box';
      };
    }
  | {
      select: {
        options: { value: string; label: string }[];
        multiple?: boolean;
        custom_value?: boolean;
        mode: 'dropdown';
      };
    }
  | {
      object: {
        multiple: true;
        label_field: string;
        description_field?: string;
        fields: Record<string, ObjectField>;
      };
    };
export interface FormField {
  name: string;
  default?: unknown;
  selector?: Selector;
  required?: boolean;
  type?: 'expandable';
  title?: string;
  schema?: FormField[];
  expanded?: boolean;
}
export interface ConfigForm {
  schema: FormField[];
  computeLabel: (schema: Pick<FormField, 'name'>) => string;
  computeHelper: (schema: Pick<FormField, 'name'>) => string;
}
export const editorTypes = [
  'home-maintenance-card',
  'home-room-header-card',
  'home-scene-card',
  'home-light-control-card',
  'home-room-lighting-card',
  'home-device-card',
  'home-climate-card',
  'home-section-card',
  'home-hero-card',
  'home-room-card',
  'home-activity-section-card',
  'home-heat-pump-status-card',
  'home-heat-flow-card',
  'home-metric-card',
  'home-system-health-card',
] as const;
export type EditorType = (typeof editorTypes)[number];
export type EditorConfig = Record<string, unknown> & { type: string };
