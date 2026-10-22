import type {
  ConfigForm,
  EditorType,
  FormField,
  ObjectField,
  Selector,
} from './types';
import { editorLabel, editorHelper } from './strings';
import { editorDefaults } from './data';

const field = (
  name: string,
  selector: Selector,
  required = false,
): FormField => ({ name, selector, ...(required ? { required: true } : {}) });
const text = (name: string, required = false) =>
  field(name, { text: {} }, required);
const entity = (
  name: string,
  domain?: string | string[],
  required = false,
  multiple = false,
) =>
  field(
    name,
    {
      entity: {
        ...(domain ? { filter: { domain } } : {}),
        ...(multiple ? { multiple: true, reorder: true } : {}),
      },
    },
    required,
  );
const bool = (name: string) => field(name, { boolean: {} });
const number = (
  name: string,
  min: number,
  max?: number,
  step: number | 'any' = 1,
) =>
  field(name, {
    number: { min, ...(max !== undefined ? { max } : {}), step, mode: 'box' },
  });
export const group = (
  name: string,
  schema: FormField[],
  language?: string,
): FormField => ({
  name: '',
  type: 'expandable',
  title: editorLabel(name, language),
  schema,
});
function select(
  name: string,
  values: string[],
  language?: string,
  required = false,
): FormField {
  return field(
    name,
    {
      select: {
        options: values.map((value) => ({
          value,
          label: editorLabel(
            value === 'state' ? 'state_format' : value,
            language,
          ),
        })),
        mode: 'dropdown',
      },
    },
    required,
  );
}
const strings = (name: string, required = false) =>
  field(name, { text: { multiple: true } }, required);
const icon = () => field('icon', { icon: {} });
const live = () => bool('slider_live_update');
function objects(
  name: string,
  schema: FormField[],
  language?: string,
  labelField = 'name',
  required = true,
): FormField {
  const fields: Record<string, ObjectField> = {};
  for (const f of schema) {
    if (!f.selector)
      throw new Error(`Object field ${f.name} must have a selector`);
    fields[f.name] = {
      selector: f.selector,
      label: editorLabel(f.name, language),
      description: editorHelper(f.name, language),
      required: f.required ?? false,
    };
  }
  return field(
    name,
    { object: { multiple: true, label_field: labelField, fields } },
    required,
  );
}
/** The shared adapter adds an explicit inherit choice; the public schema stays boolean. */
export function withEditorControls(
  form: ConfigForm,
  language?: string,
): ConfigForm {
  const adapt = (fields: FormField[]): FormField[] =>
    fields.map((f) => {
      if (f.name === 'slider_live_update')
        return {
          ...f,
          ...select(f.name, ['inherit', 'enabled', 'disabled'], language),
          default: 'inherit',
        };
      if (f.schema) return { ...f, schema: adapt(f.schema) };
      if (f.selector && 'object' in f.selector) {
        const object = f.selector.object;
        return {
          ...f,
          selector: {
            object: {
              ...object,
              fields: Object.fromEntries(
                Object.entries(object.fields).map(([name, value]) => [
                  name,
                  name === 'slider_live_update'
                    ? {
                        ...value,
                        selector: select(
                          name,
                          ['inherit', 'enabled', 'disabled'],
                          language,
                        ).selector!,
                        default: 'inherit',
                      }
                    : value,
                ]),
              ),
            },
          },
        };
      }
      return f;
    });
  return { ...form, schema: adapt(form.schema) };
}
export function metricItemSchema(language?: string): FormField[] {
  return [
    entity('entity', undefined, true),
    text('name', true),
    icon(),
    entity('secondary_entity'),
    text('secondary_name'),
    number('precision', 0, 3),
    select(
      'format',
      ['number', 'state', 'duration_hours', 'timestamp'],
      language,
    ),
    text('navigation_path'),
  ];
}
function heatFields(): FormField[] {
  return [
    entity('entity', 'sensor', true),
    entity('mode_entity', undefined, true),
    entity('operating_entity', undefined, true),
    strings('operating_states', true),
    strings('heating_states'),
    strings('hot_water_states'),
    number('minimum_heat_output', 0, undefined, 0.01),
  ];
}
const heatSensors = () =>
  [
    'compressor',
    'fan_speed',
    'electric_power',
    'outdoor_temperature',
    'auxiliary_heating',
    'controller_online',
    'outdoor_online',
    'fault_entity',
    'external_lock',
  ].map((name) => entity(name));
const flowSensors = () =>
  [
    'supply_temperature',
    'return_temperature',
    'temperature_difference',
    'pressure',
    'water_temperature',
    'water_target',
  ].map((name) => entity(name));
export function cardForm(
  type: EditorType,
  language = typeof navigator === 'undefined' ? 'en' : navigator.language,
): ConfigForm {
  let schema: FormField[];
  const entityItem = (domain: string) => [
    entity('entity', domain, true),
    text('name'),
    icon(),
  ];
  switch (type) {
    case 'home-maintenance-card':
      schema = [
        text('title'),
        objects(
          'items',
          [
            entity('entity', undefined, true),
            text('name', true),
            text('action', true),
            select(
              'kind',
              ['level', 'state', 'update', 'stale'],
              language,
              true,
            ),
            select(
              'category',
              ['batteries', 'supplies', 'backups', 'updates', 'devices'],
              language,
            ),
            text('room'),
            icon(),
            number('threshold', 0, 100, 'any'),
            number('critical_threshold', 0, 100, 'any'),
            number('max_age_hours', 0, undefined, 'any'),
            strings('problem_states'),
            strings('healthy_states'),
            select('severity', ['warning', 'urgent'], language),
            text('normal_text'),
            text('problem_text'),
          ],
          language,
          'name',
          false,
        ),
      ];
      break;
    case 'home-room-header-card':
      schema = [
        text('name'),
        bool('show_name'),
        icon(),
        entity('temperature'),
        entity('humidity'),
        entity('lights', 'light', false, true),
      ];
      break;
    case 'home-scene-card':
      schema = [
        text('title'),
        objects('scenes', entityItem('scene'), language, 'entity'),
      ];
      break;
    case 'home-light-control-card':
      schema = [...entityItem('light'), live()];
      break;
    case 'home-room-lighting-card':
      schema = [
        text('title'),
        live(),
        objects('lights', [...entityItem('light'), live()], language, 'entity'),
      ];
      break;
    case 'home-device-card':
      schema = entityItem('media_player');
      break;
    case 'home-climate-card':
      schema = entityItem('climate');
      break;
    case 'home-section-card':
      schema = [text('title', true)];
      break; // Child cards use HA's sub-card editor.
    case 'home-hero-card':
      schema = [
        entity('temperature', undefined, true),
        entity('outdoor_temperature', undefined, true),
        entity('sun_entity', 'sun', true),
        text('image_day', true),
        text('image_night', true),
        entity('weather', 'weather'),
      ];
      break;
    case 'home-room-card':
      schema = [
        text('name', true),
        icon(),
        text('navigation_path'),
        entity('temperature'),
        entity('lights', 'light', false, true),
        select(
          'icon_tone',
          ['teal', 'sand', 'blue', 'violet', 'neutral'],
          language,
        ),
      ];
      break;
    case 'home-activity-section-card':
      schema = [
        text('title'),
        bool('hide_when_empty'),
        bool('show_inactive'),
        objects(
          'appliances',
          [
            select(
              'type',
              ['washer', 'dryer', 'oven', 'dishwasher', 'heat_pump'],
              language,
              true,
            ),
            text('name', true),
            icon(),
            entity('entity', undefined, true),
            strings('active_states'),
            text('room'),
            number('reference_duration_minutes', 0, undefined, 'any'),
            entity('started_at_entity'),
            entity('finished_at_entity'),
            number('finished_for_minutes', 0, undefined, 'any'),
            strings('finished_states'),
            entity('current_temperature'),
            entity('progress'),
            entity('end_time'),
            entity('mode_entity'),
            entity('operating_entity'),
            strings('operating_states'),
            strings('heating_states'),
            strings('hot_water_states'),
            number('minimum_heat_output', 0, undefined, 0.01),
            entity('fan_speed'),
          ],
          language,
        ),
      ];
      break;
    case 'home-heat-pump-status-card':
      schema = [...heatFields(), group('sensors', heatSensors(), language)];
      break;
    case 'home-heat-flow-card':
      schema = [
        text('title'),
        ...heatFields(),
        group('sensors', [...heatSensors(), ...flowSensors()], language),
      ];
      break;
    case 'home-metric-card':
      schema = [
        text('title'),
        select('layout', ['grid', 'panel', 'strip', 'list'], language),
        number('columns', 1, 4),
      ];
      break; // Items and arbitrary state-label maps have dedicated controls.
    case 'home-system-health-card':
      schema = [
        text('title'),
        objects(
          'items',
          [
            entity('entity', 'binary_sensor', true),
            text('name', true),
            entity('updated'),
            icon(),
          ],
          language,
        ),
      ];
      break;
    default:
      throw new Error(`Missing visual editor schema for ${String(type)}`);
  }
  schema.push(select('theme', ['auto', 'light', 'dark'], language));
  const defaults = editorDefaults(type);
  for (const f of schema) if (f.name in defaults) f.default = defaults[f.name];
  return {
    schema,
    computeLabel: (s) => editorLabel(s.name, language),
    computeHelper: (s) => editorHelper(s.name, language),
  };
}
