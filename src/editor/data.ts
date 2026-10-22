import type { EditorConfig, EditorType, FormField } from './types';
import { editorTypes } from './types';

export function editorType(config: EditorConfig): EditorType {
  const type = config.type.replace(/^custom:/, '');
  if (!editorTypes.includes(type as EditorType))
    throw new Error(`Unsupported card editor: ${type}`);
  return type as EditorType;
}
export function toEditorData(config: EditorConfig): EditorConfig {
  const data = {
    ...editorDefaults(editorType(config)),
    ...structuredClone(config),
  };
  const mode = (value: unknown) =>
    value === true ? 'enabled' : value === false ? 'disabled' : 'inherit';
  if (
    config.type.endsWith('home-light-control-card') ||
    config.type.endsWith('home-room-lighting-card')
  )
    data.slider_live_update = mode(config.slider_live_update);
  if (
    config.type.endsWith('home-room-lighting-card') &&
    Array.isArray(data.lights)
  )
    data.lights = data.lights.map((item) => ({
      ...item,
      slider_live_update: mode(item.slider_live_update),
    }));
  return data;
}
export function editorDefaults(type: EditorType): Record<string, unknown> {
  return {
    theme: 'auto',
    ...(type === 'home-activity-section-card' ? { hide_when_empty: true } : {}),
    ...(type === 'home-room-header-card' ? { show_name: false } : {}),
    ...(type === 'home-metric-card' ? { layout: 'grid', columns: 2 } : {}),
  };
}
/** Only clean supported fields. Preserve HA layout/visibility, extensions and child configs. */
export function cleanFields(
  value: Record<string, unknown>,
  schema: FormField[],
): Record<string, unknown> {
  const result = structuredClone(value);
  for (const field of schema) {
    if (field.schema) {
      Object.assign(result, cleanFields(result, field.schema));
      continue;
    }
    if (!(field.name in result)) continue;
    const v = result[field.name];
    if (!field.required && (v === '' || v === null || v === undefined)) {
      delete result[field.name];
      continue;
    }
    if (field.selector && 'object' in field.selector && Array.isArray(v)) {
      const fields = field.selector.object.fields;
      const nested = Object.entries(fields).map(([name, def]) => ({
        name,
        selector: def.selector,
        required: def.required,
      }));
      result[field.name] = v.map((item) =>
        cleanFields(item as Record<string, unknown>, nested),
      );
    }
  }
  return result;
}
export function fromEditorData(
  current: EditorConfig,
  value: Record<string, unknown>,
  schema: FormField[],
): EditorConfig {
  const result = { ...structuredClone(current), ...cleanFields(value, schema) };
  // A cleared field must be removed, rather than restored by the preservation merge.
  const removeCleared = (fields: FormField[]) => {
    for (const f of fields) {
      if (f.schema) removeCleared(f.schema);
      else if (f.name in value && !(f.name in cleanFields(value, [f])))
        delete result[f.name];
    }
  };
  removeCleared(schema);
  const mode = (record: Record<string, unknown>) => {
    if (record.slider_live_update === 'enabled')
      record.slider_live_update = true;
    else if (record.slider_live_update === 'disabled')
      record.slider_live_update = false;
    else if (record.slider_live_update === 'inherit')
      delete record.slider_live_update;
  };
  if (
    current.type.endsWith('home-light-control-card') ||
    current.type.endsWith('home-room-lighting-card')
  )
    mode(result);
  if (
    current.type.endsWith('home-room-lighting-card') &&
    Array.isArray(result.lights)
  )
    result.lights = result.lights.map((item) => {
      const light = { ...item };
      mode(light);
      return light;
    });
  for (const [key, defaultValue] of Object.entries(
    editorDefaults(editorType(current)),
  ))
    if (!(key in current) && result[key] === defaultValue) delete result[key];
  return result;
}
export interface LabelRow {
  state: string;
  label: string;
}
export function labelsToRows(value: unknown): LabelRow[] {
  return Object.entries((value ?? {}) as Record<string, string>).map(
    ([state, label]) => ({ state, label }),
  );
}
export function rowsToLabels(
  rows: LabelRow[],
): Record<string, string> | undefined {
  if (
    rows.some((row) => !row.state.trim() || !row.label.trim()) ||
    new Set(rows.map((row) => row.state)).size !== rows.length
  )
    return undefined;
  return Object.fromEntries(rows.map((row) => [row.state, row.label]));
}
