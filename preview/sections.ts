import type { CardConfig, HomeAssistant } from '../src/ha/types';
import {
  activities,
  fixtureStates,
  hero,
  roomGroups,
  scenes,
} from './home-fixtures';
import './icons';
import './style.css';
import './sections.css';

const params = new URLSearchParams(location.search);
await import(
  /* @vite-ignore */ params.has('bundle')
    ? '/dist/ha-custom-dash.js'
    : '../src/index.ts'
);
interface PreviewCard extends HTMLElement {
  setConfig(value: unknown): void;
  hass?: HomeAssistant;
  getGridOptions(): { columns: number | 'full' };
}
const states = fixtureStates('unavailable');
const lightNames = [
  'Plafondspots',
  'Leeslampen',
  'Wandlampen',
  'Vloer- en tafellampen',
  'Sfeerlampen',
];
for (const [index, id] of roomGroups[0]!.rooms[0]!.lights!.entries()) {
  states[id] = {
    ...states[id]!,
    attributes: {
      friendly_name: lightNames[index],
      supported_color_modes: ['brightness'],
      brightness: [112, 163, 33, 102, 54][index],
    },
  };
}
states['media_player.example_display'] = {
  entity_id: 'media_player.example_display',
  state: 'playing',
  attributes: { friendly_name: 'Media', supported_features: 1 },
};
states['climate.example_heating'] = {
  entity_id: 'climate.example_heating',
  state: 'heat',
  attributes: { current_temperature: 20.4 },
};
const hass: HomeAssistant = {
  states,
  locale: { language: 'nl' },
  themes: { darkMode: true },
  async callService() {},
};
document.body.innerHTML = `
  <header class="preview-bar">
    <div><h1>Sections layout preview</h1><p>Mock layout using HA section spans and card sizing; not a running HA frontend.</p></div>
    <div class="preview-controls">
      <label>View <select id="view"><option value="room">Woonkamer</option><option value="home">Home</option></select></label>
      <label>Theme <select id="theme"><option value="dark">Dark</option><option value="light">Light</option></select></label>
    </div>
  </header>
  <main class="sections-host"><div class="sections-view"></div></main>`;
const view = document.querySelector<HTMLElement>('.sections-view')!;
function render() {
  const home =
    document.querySelector<HTMLSelectElement>('#view')!.value === 'home';
  view.className = `sections-view ${home ? 'home-layout' : 'room-layout'}`;
  view.replaceChildren();
  const section = <T extends CardConfig>(configs: T[], span = 1) => {
    const section = document.createElement('section');
    section.className = 'layout-section';
    section.style.setProperty('--requested-span', String(span));
    for (const config of configs) {
      const card = document.createElement(
        config.type.replace('custom:', ''),
      ) as PreviewCard;
      card.setConfig(config);
      card.hass = hass;
      const wrapper = document.createElement('div');
      wrapper.className = 'layout-card';
      const columns = card.getGridOptions().columns;
      wrapper.style.gridColumn =
        columns === 'full' ? '1 / -1' : `span ${columns}`;
      wrapper.append(card);
      section.append(wrapper);
    }
    view.append(section);
    return section;
  };
  if (home) {
    section([hero, activities, scenes]);
    const navigation = section([], 2);
    navigation.classList.add('room-navigation');
    for (const group of roomGroups) {
      const heading = document.createElement('h2');
      heading.textContent = group.title;
      const grid = document.createElement('div');
      grid.className = 'navigation-grid';
      for (const config of group.rooms) {
        const card = document.createElement('home-room-card') as PreviewCard;
        card.setConfig(config);
        card.hass = hass;
        grid.append(card);
      }
      navigation.append(heading, grid);
    }
  } else {
    const room = roomGroups[0]!.rooms[0]!;
    section(
      [
        {
          type: 'custom:home-room-header-card',
          temperature: room.temperature,
          lights: room.lights,
        },
        scenes,
      ],
      2,
    );
    section(
      [
        {
          type: 'custom:home-room-lighting-card',
          lights: room.lights!.map((entity) => ({ entity })),
        },
      ],
      2,
    );
    section([
      {
        type: 'custom:home-device-card',
        entity: 'media_player.example_display',
        name: 'Media',
      },
    ]);
    section([
      {
        type: 'custom:home-climate-card',
        entity: 'climate.example_heating',
        name: 'Klimaat',
      },
    ]);
  }
}
document.querySelector('#view')!.addEventListener('change', render);
document.querySelector('#theme')!.addEventListener('change', (event) => {
  const dark = (event.target as HTMLSelectElement).value === 'dark';
  hass.themes = { darkMode: dark };
  document.body.dataset.theme = dark ? 'dark' : 'light';
  render();
});
document.body.dataset.theme = 'dark';
render();
