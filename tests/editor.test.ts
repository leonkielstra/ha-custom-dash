import { afterEach, expect, it, vi } from 'vitest';
import '../src/index';
import { BaseCard } from '../src/ui/base-card';
import { HomeCardEditor } from '../src/editor/card-editor';
import { cardForm } from '../src/editor/forms';
import {
  editorTypes,
  type ConfigForm,
  type EditorConfig,
  type EditorType,
  type FormField,
} from '../src/editor/types';
import {
  fromEditorData,
  labelsToRows,
  rowsToLabels,
  toEditorData,
} from '../src/editor/data';
import type { HomeAssistant } from '../src/ha/types';

interface CardClass extends CustomElementConstructor {
  readonly editorType?: EditorType;
  new (): BaseCard<{ type: string }>;
  getConfigForm(language?: string): ConfigForm;
  getConfigElement(): HomeCardEditor;
  getStubConfig(
    hass?: HomeAssistant,
    entities?: string[],
    fallback?: string[],
  ): Record<string, unknown>;
}
interface FormElement extends HTMLElement {
  data: Record<string, unknown>;
  schema: FormField[];
  hass?: HomeAssistant;
  computeLabel: (schema: { name: string }) => string;
}
const hass: HomeAssistant = {
  states: {
    'light.example_lamp': {
      entity_id: 'light.example_lamp',
      state: 'off',
      attributes: {},
    },
    'sensor.example_reading': {
      entity_id: 'sensor.example_reading',
      state: '20',
      attributes: { unit_of_measurement: '°C' },
    },
  },
  locale: { language: 'nl' },
  callService: vi.fn(),
};
afterEach(() => {
  document.body.replaceChildren();
  vi.clearAllMocks();
});
const constructor = (type: EditorType) => customElements.get(type) as CardClass;
const forms = (editor: HomeCardEditor) => [
  ...editor.shadowRoot!.querySelectorAll<FormElement>('ha-form'),
];
function change(form: FormElement, data: Record<string, unknown>) {
  form.dispatchEvent(
    new CustomEvent('value-changed', {
      bubbles: true,
      composed: true,
      detail: { value: data },
    }),
  );
}
async function editorFor(config: EditorConfig) {
  const editor = constructor(
    config.type.slice(7) as EditorType,
  ).getConfigElement();
  editor.hass = hass;
  editor.setConfig(config);
  document.body.append(editor);
  await editor.updateComplete;
  return editor;
}
function flatten(schema: FormField[]): FormField[] {
  return schema.flatMap((field) =>
    field.schema ? flatten(field.schema) : [field],
  );
}

it('requires a form, visual editor and valid default for every registered card, including future cards', () => {
  expect(new Set(window.customCards!.map((card) => card.type))).toEqual(
    new Set(editorTypes),
  );
  for (const registration of window.customCards!) {
    const cls = constructor(registration.type as EditorType);
    expect(cls.editorType).toBe(registration.type);
    const schema = cls.getConfigForm('nl');
    expect(schema.schema.length).toBeGreaterThan(0);
    expect(cls.getConfigElement()).toBeInstanceOf(HomeCardEditor);
    const config = {
      type: `custom:${registration.type}`,
      ...cls.getStubConfig(hass),
    };
    expect(() => new cls().setConfig(config)).not.toThrow();
    const validateSelectors = (fields: FormField[]) => {
      for (const field of fields) {
        if (field.schema) {
          validateSelectors(field.schema);
          continue;
        }
        expect(field.selector).toBeDefined();
        if (field.selector && 'object' in field.selector) {
          expect(
            Object.keys(field.selector.object.fields).length,
          ).toBeGreaterThan(0);
        }
      }
    };
    validateSelectors(schema.schema);
  }
  class MissingEditor extends BaseCard<{ type: string }> {
    setConfig() {}
    protected entityIds() {
      return [];
    }
  }
  expect(() => MissingEditor.getConfigForm()).toThrow('Every card');
});

it('covers each supported configuration field instead of hiding list options behind a YAML selector', () => {
  const fields: Partial<Record<EditorType, string[]>> = {
    'home-room-header-card': [
      'name',
      'show_name',
      'icon',
      'temperature',
      'humidity',
      'lights',
      'theme',
    ],
    'home-scene-card': ['title', 'scenes', 'theme'],
    'home-light-control-card': [
      'entity',
      'name',
      'icon',
      'slider_live_update',
      'theme',
    ],
    'home-room-lighting-card': [
      'title',
      'lights',
      'slider_live_update',
      'theme',
    ],
    'home-device-card': ['entity', 'name', 'icon', 'theme'],
    'home-climate-card': ['entity', 'name', 'icon', 'theme'],
    'home-hero-card': [
      'temperature',
      'outdoor_temperature',
      'sun_entity',
      'image_day',
      'image_night',
      'weather',
      'theme',
    ],
    'home-room-card': [
      'name',
      'icon',
      'navigation_path',
      'temperature',
      'lights',
      'icon_tone',
      'theme',
    ],
    'home-activity-section-card': [
      'title',
      'appliances',
      'hide_when_empty',
      'theme',
    ],
    'home-system-health-card': ['title', 'items', 'theme'],
  };
  for (const [type, expected] of Object.entries(fields))
    expect(
      flatten(cardForm(type as EditorType).schema)
        .map((f) => f.name)
        .sort(),
    ).toEqual(expected!.sort());
  const scenes = flatten(cardForm('home-scene-card').schema).find(
    (f) => f.name === 'scenes',
  )!.selector!;
  expect(scenes).toHaveProperty('object.multiple', true);
  expect(scenes).toHaveProperty(
    'object.fields.entity.selector.entity.filter.domain',
    'scene',
  );
  const activity = flatten(cardForm('home-activity-section-card').schema).find(
    (f) => f.name === 'appliances',
  )!.selector!;
  expect(activity).toHaveProperty('object.fields.mode_entity');
  expect(activity).toHaveProperty('object.fields.minimum_heat_output');
});

it('passes HA state and Dutch labels to native forms while preserving YAML-only metadata', async () => {
  const config: EditorConfig = {
    type: 'custom:home-room-card',
    name: 'Room',
    icon: 'mdi:home',
    grid_options: { columns: 6 },
    visibility: [{ condition: 'state', entity: 'sensor.example', state: 'on' }],
    extension: { nested: ['keep'] },
  };
  const original = structuredClone(config);
  const editor = await editorFor(config);
  const changed = vi.fn();
  editor.addEventListener('config-changed', changed);
  const form = forms(editor)[0]!;
  expect(form.hass).toBe(hass);
  expect(form.computeLabel({ name: 'temperature' })).toBe('Temperatuursensor');
  change(form, { ...form.data, name: 'New room', icon: '' });
  const emitted = changed.mock.calls[0]![0].detail.config;
  expect(emitted).toMatchObject({
    name: 'New room',
    grid_options: config.grid_options,
    visibility: config.visibility,
    extension: config.extension,
  });
  expect(emitted).not.toHaveProperty('icon');
  expect(config).toEqual(original);
  expect(hass.callService).not.toHaveBeenCalled();
});

it('round-trips every default config through the form without dropping unknown fields', () => {
  for (const type of editorTypes) {
    const config = {
      type: `custom:${type}`,
      ...constructor(type).getStubConfig(hass),
      extension: { preserve: true },
    };
    expect(
      fromEditorData(config, toEditorData(config), cardForm(type).schema),
    ).toEqual(config);
  }
});

it('preserves inherited and explicit slider modes, including reordered light metadata', () => {
  const config: EditorConfig = {
    type: 'custom:home-room-lighting-card',
    slider_live_update: true,
    lights: [
      { entity: 'light.example_a', extension: 'first' },
      {
        entity: 'light.example_b',
        slider_live_update: false,
        extension: 'second',
      },
    ],
  };
  const data = toEditorData(config);
  expect(data).toMatchObject({
    slider_live_update: 'enabled',
    lights: [
      { slider_live_update: 'inherit' },
      { slider_live_update: 'disabled' },
    ],
  });
  expect(
    fromEditorData(config, data, cardForm('home-room-lighting-card').schema),
  ).toEqual(config);
  const lights = [...(data.lights as Record<string, unknown>[])].reverse();
  lights[0]!.slider_live_update = 'inherit';
  const changed = fromEditorData(
    config,
    { ...data, slider_live_update: 'disabled', lights },
    cardForm('home-room-lighting-card').schema,
  );
  expect(changed).toMatchObject({
    slider_live_update: false,
    lights: [
      { entity: 'light.example_b', extension: 'second' },
      { entity: 'light.example_a', extension: 'first' },
    ],
  });
  expect((changed.lights as Record<string, unknown>[])[0]).not.toHaveProperty(
    'slider_live_update',
  );
});

it('keeps zero/false values and supports clearing advanced optional entities', () => {
  const config = {
    type: 'custom:home-heat-flow-card',
    ...constructor('home-heat-flow-card').getStubConfig(hass),
    minimum_heat_output: 1,
    pressure: 'sensor.example_pressure',
    extension: false,
  };
  const result = fromEditorData(
    config,
    { ...config, minimum_heat_output: 0, pressure: '' },
    cardForm('home-heat-flow-card').schema,
  );
  expect(result.minimum_heat_output).toBe(0);
  expect(result.extension).toBe(false);
  expect(result).not.toHaveProperty('pressure');
});

it('edits arbitrary state labels visually, retaining the last valid config during incomplete edits', async () => {
  const editor = await editorFor({
    type: 'custom:home-metric-card',
    items: [
      {
        entity: 'sensor.example_state',
        name: 'Machine',
        state_labels: { run: 'Bezig' },
        extension: { keep: true },
      },
    ],
    grid_options: { columns: 12 },
  });
  const changed = vi.fn();
  editor.addEventListener('config-changed', changed);
  editor
    .shadowRoot!.querySelector<HTMLButtonElement>(
      '[data-action="add-mapping"]',
    )!
    .click();
  await editor.updateComplete;
  expect(changed).not.toHaveBeenCalled();
  const row = forms(editor).at(-1)!;
  change(row, { state: 'pause', label: '' });
  await editor.updateComplete;
  expect(changed).not.toHaveBeenCalled();
  change(forms(editor).at(-1)!, { state: 'pause', label: 'Gepauzeerd' });
  await editor.updateComplete;
  expect(changed.mock.calls.at(-1)![0].detail.config).toMatchObject({
    grid_options: { columns: 12 },
    items: [
      {
        state_labels: { run: 'Bezig', pause: 'Gepauzeerd' },
        extension: { keep: true },
      },
    ],
  });
  expect(
    rowsToLabels([
      { state: 'on', label: 'Aan' },
      { state: 'on', label: 'Nog aan' },
    ]),
  ).toBeUndefined();
  expect(labelsToRows({ new_state: 'Nieuwe status' })).toEqual([
    { state: 'new_state', label: 'Nieuwe status' },
  ]);
});

it('adds, reorders and removes metric items without moving metadata to another entity', async () => {
  const editor = await editorFor({
    type: 'custom:home-metric-card',
    items: [
      { entity: 'sensor.example_a', name: 'A', extension: 'a' },
      { entity: 'sensor.example_b', name: 'B', extension: 'b' },
    ],
  });
  const changed = vi.fn();
  editor.addEventListener('config-changed', changed);
  editor
    .shadowRoot!.querySelector<HTMLButtonElement>('[data-action="down"]')!
    .click();
  await editor.updateComplete;
  expect(changed.mock.calls.at(-1)![0].detail.config.items).toMatchObject([
    { entity: 'sensor.example_b', extension: 'b' },
    { entity: 'sensor.example_a', extension: 'a' },
  ]);
  editor
    .shadowRoot!.querySelector<HTMLButtonElement>('[data-action="add-item"]')!
    .click();
  await editor.updateComplete;
  expect(changed.mock.calls.at(-1)![0].detail.config.items).toHaveLength(3);
  editor
    .shadowRoot!.querySelector<HTMLButtonElement>('[data-action="remove"]')!
    .click();
  await editor.updateComplete;
  expect(changed.mock.calls.at(-1)![0].detail.config.items).toHaveLength(2);
});

it('delegates nested child cards to the HA editor and saves complete parent configuration', async () => {
  const child = {
    type: 'custom:example-third-party',
    entity: 'sensor.example',
    vendor: { a: 1 },
    tap_action: { action: 'more-info' },
  };
  const editor = await editorFor({
    type: 'custom:home-section-card',
    title: 'Section',
    cards: [child, { type: 'markdown', content: 'Keep me' }],
    visibility: [{ condition: 'screen', media_query: '(min-width: 320px)' }],
  });
  const nested = vi.fn();
  const changed = vi.fn();
  editor.addEventListener('edit-sub-element', nested);
  editor.addEventListener('config-changed', changed);
  editor
    .shadowRoot!.querySelector<HTMLButtonElement>('[data-action="edit-child"]')!
    .click();
  const event = nested.mock.calls[0]![0];
  expect(event.bubbles).toBe(true);
  expect(event.composed).toBe(true);
  expect(event.detail.type).toBe('card');
  expect(event.detail.config).toEqual(child);
  event.detail.saveConfig({ ...child, name: 'Updated' });
  await editor.updateComplete;
  expect(changed.mock.calls.at(-1)![0].detail.config).toMatchObject({
    cards: [{ name: 'Updated', vendor: { a: 1 } }, { content: 'Keep me' }],
    visibility: [{ condition: 'screen' }],
  });
  editor
    .shadowRoot!.querySelector<HTMLButtonElement>('[data-action="down"]')!
    .click();
  await editor.updateComplete;
  expect(changed.mock.calls.at(-1)![0].detail.config.cards[1]).toMatchObject({
    name: 'Updated',
    vendor: { a: 1 },
  });
  editor
    .shadowRoot!.querySelector<HTMLButtonElement>('[data-action="add-child"]')!
    .click();
  await editor.updateComplete;
  expect(changed.mock.calls.at(-1)![0].detail.config.cards).toHaveLength(3);
  expect(nested.mock.calls.at(-1)![0].detail.config).toEqual({
    type: 'markdown',
    content: '',
  });
});
