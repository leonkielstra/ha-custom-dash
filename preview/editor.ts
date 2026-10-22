import type { HomeAssistant } from '../src/ha/types';
import type { EditorConfig, EditorType } from '../src/editor/types';
import type { HomeCardEditor } from '../src/editor/card-editor';
import './editor-form';
import './icons';
import './style.css';
const params = new URLSearchParams(location.search);
await import(
  /* @vite-ignore */ params.has('bundle')
    ? '/dist/ha-custom-dash.js'
    : '../src/index.ts'
);
interface CardClass extends CustomElementConstructor {
  getConfigElement(): HomeCardEditor;
  getStubConfig(hass?: HomeAssistant): Record<string, unknown>;
}
interface PreviewCard extends HTMLElement {
  hass: HomeAssistant;
  setConfig(value: unknown): void;
}
const calls: unknown[] = [];
let language = 'en';
const hass = (): HomeAssistant => ({
  states: {
    'sensor.example_temperature': {
      entity_id: 'sensor.example_temperature',
      state: '20.4',
      attributes: { unit_of_measurement: '°C' },
    },
    'sensor.example_other': {
      entity_id: 'sensor.example_other',
      state: '42',
      attributes: {},
    },
    'light.example_lamp': {
      entity_id: 'light.example_lamp',
      state: 'on',
      attributes: { supported_color_modes: ['brightness'], brightness: 128 },
    },
    'light.example_second': {
      entity_id: 'light.example_second',
      state: 'off',
      attributes: { supported_color_modes: ['brightness'] },
    },
    'scene.example_evening': {
      entity_id: 'scene.example_evening',
      state: 'unknown',
      attributes: {},
    },
    'binary_sensor.example_online': {
      entity_id: 'binary_sensor.example_online',
      state: 'on',
      attributes: {},
    },
  },
  locale: { language },
  themes: { darkMode: false },
  async callService(...args) {
    calls.push(args);
  },
});
let config: EditorConfig;
let editor: HomeCardEditor;
let card: PreviewCard;
const main = document.createElement('main');
main.style.cssText =
  'display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,340px),1fr));gap:24px;max-width:1100px;margin:24px auto;padding:16px';
document.body.innerHTML = `<header class="preview-bar"><div><h1>Visual card editor</h1><p>Native-form stand-in for local testing. Production uses Home Assistant’s selectors and child-card editor.</p></div><div class="preview-controls"><label>Card <select id="editor-card"></select></label><label>Language <select id="editor-language"><option value="en">English</option><option value="nl">Nederlands</option></select></label></div></header>`;
const select = document.querySelector<HTMLSelectElement>('#editor-card')!;
for (const registration of window.customCards ?? []) {
  const option = document.createElement('option');
  option.value = registration.type;
  option.textContent = registration.type;
  select.append(option);
}
document.body.append(main);
const error = document.createElement('p');
error.setAttribute('role', 'status');
error.id = 'editor-error';
function preview() {
  try {
    card.setConfig(config);
    error.textContent = '';
  } catch (e) {
    error.textContent = String(e);
  }
  card.hass = hass();
}
function mount(type: EditorType, initial?: EditorConfig) {
  const constructor = customElements.get(type) as CardClass;
  config = initial ?? {
    type: `custom:${type}`,
    ...constructor.getStubConfig(hass()),
  };
  editor = constructor.getConfigElement();
  editor.hass = hass();
  editor.setConfig(config);
  card = document.createElement(type) as PreviewCard;
  main.replaceChildren(editor);
  const pane = document.createElement('section');
  pane.append(error, card);
  main.append(pane);
  editor.addEventListener('config-changed', (event: Event) => {
    config = (event as CustomEvent<{ config: EditorConfig }>).detail.config;
    editor.setConfig(config);
    preview();
  });
  editor.addEventListener('edit-sub-element', (event: Event) => {
    const detail = (
      event as CustomEvent<{
        config: Record<string, unknown>;
        saveConfig: (value: Record<string, unknown>) => void;
      }>
    ).detail;
    const form = document.createElement('ha-form') as HTMLElement &
      Record<string, unknown>;
    form.data = detail.config;
    form.schema = [{ name: 'content', selector: { text: {} } }];
    form.computeLabel = () => (language === 'nl' ? 'Inhoud' : 'Content');
    form.computeHelper = () => '';
    form.addEventListener('value-changed', (event: Event) => {
      event.stopPropagation();
      detail.saveConfig(
        (event as CustomEvent<{ value: Record<string, unknown> }>).detail.value,
      );
    });
    const nested = document.createElement('section');
    nested.id = 'nested-editor';
    nested.append(form);
    pane.append(nested);
  });
  preview();
  select.value = type;
}
select.addEventListener('change', () => mount(select.value as EditorType));
document
  .querySelector('#editor-language')!
  .addEventListener('change', (event) => {
    language = (event.target as HTMLSelectElement).value;
    editor.hass = hass();
    card.hass = hass();
  });
mount('home-room-card');
Object.assign(window, {
  editorPreview: {
    calls,
    getConfig: () => structuredClone(config),
    load: (value: EditorConfig) =>
      mount(value.type.slice(7) as EditorType, value),
  },
});
