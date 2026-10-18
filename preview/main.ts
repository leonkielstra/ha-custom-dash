import type { HomeAssistant, HassEntity } from '../src/ha/types';
import { ui } from '../src/i18n/strings';
import './style.css';

// The host normally provides ha-icon. This tiny SVG stand-in exists ONLY here.
const paths: Record<string, string> = {
  'mdi:sofa-outline':
    'M4 11V6h6v6h4V6h6v5M3 10H1v9h22v-9h-3v5H4zM4 19v3m16-3v3',
  'mdi:book-open-page-variant-outline':
    'M12 5C8 2 4 3 2 4v15c4-2 7-1 10 1 3-2 6-3 10-1V4c-4-2-7-1-10 1Zm0 0v15',
  'mdi:weather-night': 'M20 15A9 9 0 0 1 9 4a9 9 0 1 0 11 11Z',
  'mdi:movie-open-outline': 'M3 10h18v11H3zM3 8l17-5-1-3L2 5zM7 4l3 3m4-5 3 3',
  'mdi:power': 'M12 2v10M6 5a9 9 0 1 0 12 0',
  'mdi:power-standby': 'M12 2v10M6 5a9 9 0 1 0 12 0',
  'mdi:lightbulb-outline': 'M9 18h6m-6 3h6M8 14a7 7 0 1 1 8 0l-1 2H9Z',
  'mdi:light-recessed': 'M3 8a9 5 0 1 0 18 0 9 5 0 1 0-18 0m4 1a5 2 0 1 0 10 0',
  'mdi:floor-lamp': 'M8 3h8l3 9H5Zm4 9v9m-5 0h10',
  'mdi:television': 'M2 4h20v14H2Zm6 18h8m-4-4v4',
  'mdi:play': 'M7 3v18l14-9Z',
  'mdi:pause': 'M6 3v18m12-18v18',
};
class PreviewIcon extends HTMLElement {
  private value = '';
  set icon(value: string) {
    this.value = value;
    this.draw();
  }
  connectedCallback() {
    this.draw();
  }
  private draw() {
    const root = this.shadowRoot ?? this.attachShadow({ mode: 'open' });
    root.innerHTML = `<style>:host{display:inline-flex;width:24px;height:24px}svg{width:100%;height:100%}</style><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="${paths[this.value] ?? paths['mdi:lightbulb-outline']}"/></svg>`;
  }
}
customElements.define('ha-icon', PreviewIcon);
const modulePath = new URLSearchParams(location.search).has('bundle')
  ? '/dist/ha-custom-dash.js'
  : '../src/index.ts';
await import(/* @vite-ignore */ modulePath);

const makeEntity = (
  id: string,
  state: string,
  attributes: Record<string, unknown> = {},
): HassEntity => ({ entity_id: id, state, attributes });
const lights = [
  {
    entity: 'light.example_spots',
    name: 'Ceiling spots',
    icon: 'mdi:light-recessed',
  },
  { entity: 'light.example_reading', name: 'Reading lights' },
  { entity: 'light.example_wall', name: 'Wall lights' },
  {
    entity: 'light.example_floor',
    name: 'Floor and table lamps with a deliberately long descriptive name',
    icon: 'mdi:floor-lamp',
  },
  { entity: 'light.example_accent', name: 'Accent lights' },
  { entity: 'light.example_unavailable', name: 'Unavailable light' },
  { entity: 'light.example_basic', name: 'On/off-only light' },
];
let states: HomeAssistant['states'];
let previewLanguage = 'en';
let previewTheme: 'both' | 'light' | 'dark' = 'both';
let previewWidth: 'phone' | 'wide' = 'phone';
function initialStates(): HomeAssistant['states'] {
  return {
    'sensor.example_temperature': makeEntity(
      'sensor.example_temperature',
      '20.4',
      { unit_of_measurement: '°C' },
    ),
    'sensor.example_humidity': makeEntity('sensor.example_humidity', '54', {
      unit_of_measurement: '%',
    }),
    ...Object.fromEntries(
      lights.map((item, i) => [
        item.entity,
        makeEntity(
          item.entity,
          i === 5 ? 'unavailable' : i === 4 || i === 6 ? 'off' : 'on',
          {
            friendly_name: item.name,
            supported_color_modes: i === 6 ? ['onoff'] : ['brightness'],
            brightness: [112, 163, 33, 102, 54][i] ?? 0,
          },
        ),
      ]),
    ),
    'scene.example_read': makeEntity(
      'scene.example_read',
      '2026-01-01T00:00:00Z',
    ),
    'scene.example_relax': makeEntity(
      'scene.example_relax',
      '2026-01-01T00:00:00Z',
    ),
    'scene.example_film': makeEntity(
      'scene.example_film',
      '2026-01-01T00:00:00Z',
    ),
    'media_player.example_display': makeEntity(
      'media_player.example_display',
      'off',
      {
        friendly_name: 'Living room display',
        supported_features: 128 + 256 + 1 + 16384,
      },
    ),
  };
}
states = initialStates();
interface PreviewCard extends HTMLElement {
  setConfig(config: unknown): void;
  hass?: HomeAssistant;
}
const mounted: { card: PreviewCard; theme: 'light' | 'dark' }[] = [];
const calls: {
  domain: string;
  service: string;
  data: Record<string, unknown>;
}[] = [];
let failNext = false;
function hass(theme: 'light' | 'dark'): HomeAssistant {
  return {
    states,
    locale: { language: previewLanguage },
    themes: { darkMode: theme === 'dark' },
    async callService(domain, service, data) {
      calls.push({ domain, service, data });
      document.querySelector('.service-log')!.textContent = calls
        .slice(-8)
        .map((c) => `${c.domain}.${c.service} ${JSON.stringify(c.data)}`)
        .join('\n');
      await new Promise((resolve) => setTimeout(resolve, 200));
      if (failNext) {
        failNext = false;
        throw new Error('Simulated service failure');
      }
      // Separate acknowledgement and state event, as in Home Assistant.
      setTimeout(() => {
        const ids = Array.isArray(data.entity_id)
          ? data.entity_id
          : [data.entity_id];
        for (const id of ids) {
          if (typeof id !== 'string' || !states[id]) continue;
          const old = states[id];
          const state =
            domain === 'scene'
              ? new Date().toISOString()
              : service === 'media_pause'
                ? 'paused'
                : service === 'media_play'
                  ? 'playing'
                  : service === 'turn_off'
                    ? 'off'
                    : 'on';
          states = {
            ...states,
            [id]: {
              ...old,
              state,
              attributes: {
                ...old.attributes,
                ...(data.brightness === undefined
                  ? {}
                  : { brightness: data.brightness }),
              },
            },
          };
        }
        update();
      }, 350);
    },
  };
}
function update() {
  for (const item of mounted) item.card.hass = hass(item.theme);
}
function updateChrome() {
  const text = ui(previewLanguage);
  document.querySelector('#preview-title')!.textContent = text.previewTitle;
  document.querySelector('#preview-subtitle')!.textContent =
    text.previewSubtitle;
  document.querySelector('#language-label')!.textContent = text.language;
  document.querySelector('#theme-label')!.textContent = text.theme;
  document.querySelector('#width-label')!.textContent = text.layout;
  document.querySelector('#theme option[value="both"]')!.textContent =
    text.both;
  document.querySelector('#theme option[value="light"]')!.textContent =
    text.lightTheme;
  document.querySelector('#theme option[value="dark"]')!.textContent =
    text.darkTheme;
  document.querySelector('#width option[value="phone"]')!.textContent =
    text.phone;
  document.querySelector('#width option[value="wide"]')!.textContent =
    text.wide;
  document.querySelector('#fail')!.textContent = text.failAction;
  document.querySelector('#external')!.textContent = text.externalChange;
  document.querySelector('#reset')!.textContent = text.reset;
  document.querySelector('#preview-note')!.textContent = text.mockNotice;
  document
    .querySelector('.service-log')!
    .setAttribute('aria-label', text.mockServiceCalls);
  if (!calls.length)
    document.querySelector('.service-log')!.textContent = text.interactHint;
}

document.body.innerHTML = `
  <header class="preview-bar">
    <div><h1 id="preview-title"></h1><p id="preview-subtitle"></p></div>
    <div class="preview-controls">
      <label><span id="language-label"></span> <select id="language"><option value="en">English</option><option value="nl">Nederlands</option></select></label>
      <label><span id="theme-label"></span> <select id="theme"><option value="both">Both</option><option value="light">Light</option><option value="dark">Dark</option></select></label>
      <label><span id="width-label"></span> <select id="width"><option value="phone">Phone</option><option value="wide">Wide</option></select></label>
      <button id="fail"></button><button id="external"></button><button id="reset"></button>
    </div>
  </header>
  <main class="preview-grid" data-width="phone"></main>
  <footer class="preview-note"><p id="preview-note"></p><pre class="service-log"></pre></footer>`;

function renderRooms() {
  const text = ui(previewLanguage);
  const labels = previewLanguage.startsWith('nl')
    ? {
        room: 'Woonkamer',
        scenes: 'Scènes',
        lighting: 'Verlichting',
        media: 'Media',
        names: [
          'Plafondspots',
          'Leeslampen',
          'Wandlampen',
          'Vloer- en tafellampen met een bewust lange beschrijvende naam',
          'Sfeerlampen',
          'Niet-beschikbare lamp',
          'Lamp met alleen aan/uit',
        ],
        sceneNames: ['Lezen', 'Ontspannen', 'Film'],
        device: 'Televisie in de woonkamer',
      }
    : {
        room: 'Living room',
        scenes: 'Scenes',
        lighting: 'Lighting',
        media: 'Media',
        names: [
          'Ceiling spots',
          'Reading lights',
          'Wall lights',
          'Floor and table lamps with a deliberately long descriptive name',
          'Accent lights',
          'Unavailable light',
          'On/off-only light',
        ],
        sceneNames: ['Read', 'Relax', 'Film'],
        device: 'Living room display',
      };
  const localizedLights = lights.map((light, i) => ({
    ...light,
    name: labels.names[i],
  }));
  const main = document.querySelector('main')!;
  main.replaceChildren();
  mounted.length = 0;
  main.dataset.width = previewWidth;
  for (const theme of ['light', 'dark'] as const) {
    const room = document.createElement('article');
    room.className = `room ${theme}`;
    room.setAttribute(
      'aria-label',
      `${theme} ${labels.room.toLowerCase()} preview`,
    );
    room.innerHTML = `<div class="room-top"><p>${labels.room}</p><span>${theme} ${text.theme.toLowerCase()}</span></div>`;
    const add = (tag: string, config: Record<string, unknown>) => {
      const card = document.createElement(tag) as PreviewCard;
      card.setConfig({ type: `custom:${tag}`, ...config });
      card.hass = hass(theme);
      room.append(card);
      mounted.push({ card, theme });
    };
    add('home-room-header-card', {
      name: labels.room,
      temperature: 'sensor.example_temperature',
      humidity: 'sensor.example_humidity',
      lights: lights.map((v) => v.entity),
    });
    add('home-scene-card', {
      scenes: [
        {
          entity: 'scene.example_read',
          name: labels.sceneNames[0],
          icon: 'mdi:book-open-page-variant-outline',
        },
        {
          entity: 'scene.example_relax',
          name: labels.sceneNames[1],
          icon: 'mdi:weather-night',
        },
        {
          entity: 'scene.example_film',
          name: labels.sceneNames[2],
          icon: 'mdi:movie-open-outline',
        },
      ],
    });
    add('home-room-lighting-card', {
      title: labels.lighting,
      lights: localizedLights,
    });
    const heading = document.createElement('h2');
    heading.textContent = labels.media;
    room.append(heading);
    add('home-device-card', {
      entity: 'media_player.example_display',
      name: labels.device,
    });
    document.querySelector('main')!.append(room);
  }
}
document.querySelector<HTMLSelectElement>('#language')!.value = previewLanguage;
document.querySelector<HTMLSelectElement>('#theme')!.value = previewTheme;
document.querySelector<HTMLSelectElement>('#width')!.value = previewWidth;
updateChrome();
renderRooms();
document.querySelector('#language')!.addEventListener('change', (e) => {
  previewLanguage = (e.target as HTMLSelectElement).value;
  updateChrome();
  renderRooms();
});
document.querySelector('#theme')!.addEventListener('change', (e) => {
  const value = (e.target as HTMLSelectElement).value as typeof previewTheme;
  previewTheme = value;
  for (const room of document.querySelectorAll<HTMLElement>('.room'))
    room.hidden = value !== 'both' && !room.classList.contains(value);
});
document.querySelector('#width')!.addEventListener('change', (e) => {
  previewWidth = (e.target as HTMLSelectElement).value as typeof previewWidth;
  (document.querySelector('main') as HTMLElement).dataset.width = (
    e.target as HTMLSelectElement
  ).value;
});
document.querySelector('#fail')!.addEventListener('click', () => {
  failNext = true;
});
document.querySelector('#reset')!.addEventListener('click', () => {
  failNext = false;
  states = initialStates();
  update();
});
document.querySelector('#external')!.addEventListener('click', () => {
  const entity = states['light.example_spots']!;
  states = {
    ...states,
    [entity.entity_id]: {
      ...entity,
      state: entity.state === 'on' ? 'off' : 'on',
    },
  };
  update();
});
// A small test hook on the preview only, never included in the distributed bundle.
Object.assign(window, {
  preview: {
    calls,
    setState(id: string, state: string) {
      if (states[id]) states = { ...states, [id]: { ...states[id], state } };
      update();
    },
  },
});
