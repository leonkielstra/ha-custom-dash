import type { CardConfig, HomeAssistant, HassEntity } from '../src/ha/types';
import {
  activities,
  heatPump,
  fixtureStates,
  hero,
  roomGroups,
  scenes,
  type HomeScenario,
} from './home-fixtures';
import './icons';
import './style.css';
import './home.css';

const params = new URLSearchParams(location.search);
await import(
  /* @vite-ignore */ params.has('bundle')
    ? '/dist/ha-custom-dash.js'
    : '../src/index.ts'
);
interface PreviewCard extends HTMLElement {
  setConfig(config: unknown): void;
  hass?: HomeAssistant;
}
let scenario: HomeScenario = params.has('reference') ? 'reference' : 'day';
let states = fixtureStates(scenario);
let language = 'nl';
let theme: 'both' | 'light' | 'dark' = 'both';
const mounted: { card: PreviewCard; theme: 'light' | 'dark' }[] = [];
const calls: {
  domain: string;
  service: string;
  data: Record<string, unknown>;
}[] = [];
function hass(dark: boolean): HomeAssistant {
  return {
    states,
    locale: { language },
    themes: { darkMode: dark },
    async callService(domain, service, data) {
      calls.push({ domain, service, data });
      document.querySelector('#home-feedback')!.textContent =
        language === 'nl' ? 'Scène geactiveerd' : 'Scene activated';
    },
  };
}
function update() {
  for (const { card, theme } of mounted) card.hass = hass(theme === 'dark');
}
document.body.innerHTML = `
  <header class="preview-bar">
    <div><h1>Home overview</h1><p>Interactive Home preview · <a href="/">Living room preview</a></p></div>
    <div class="preview-controls">
      <label>Taal / language <select id="language"><option value="nl">Nederlands</option><option value="en">English</option></select></label>
      <label>Thema / theme <select id="theme"><option value="both">Both</option><option value="light">Light</option><option value="dark">Dark</option></select></label>
      <label>Scenario <select id="scenario"><option value="reference">Reference · washer and oven</option><option value="day">A · Day, idle</option><option value="night">B · Night, washer</option><option value="multiple">C · Multiple appliances</option><option value="unavailable">D · Unavailable entities</option><option value="no-lights">E · Rooms without lights</option><option value="hot-water">F · Heat pump, hot water</option><option value="heating">G · Heat pump, space heating</option></select></label>
      <label>Daglicht / daylight <select id="daylight"><option value="above_horizon">Day</option><option value="below_horizon">Night</option><option value="unavailable">Unavailable</option></select></label>
      <button id="long-name">Long room name</button>
    </div>
  </header>
  <main class="preview-grid home-preview"></main>
  <footer class="preview-note"><p>Fictional entity fixtures and illustrative SVG assets. Layout approximates native Lovelace Sections/grids; no Home Assistant connection.</p><p id="home-feedback" role="status"></p></footer>`;
function render() {
  const main = document.querySelector('main')!;
  main.dataset.theme = theme;
  main.replaceChildren();
  mounted.length = 0;
  for (const mode of ['light', 'dark'] as const) {
    const page = document.createElement('article');
    page.className = `home-page room ${mode}`;
    page.hidden = theme !== 'both' && theme !== mode;
    page.setAttribute('aria-label', `${mode} Home preview`);
    page.innerHTML =
      '<div class="home-title"><h1>Home</h1><span>Een fijn thuis</span></div>';
    const composition = document.createElement('div');
    composition.className = 'home-composition';
    const summary = document.createElement('section');
    summary.className = 'home-summary';
    summary.setAttribute('aria-label', 'Home summary');
    const navigation = document.createElement('section');
    navigation.className = 'home-navigation';
    navigation.setAttribute('aria-label', 'Rooms');
    composition.append(summary, navigation);
    page.append(composition);
    const add = (config: CardConfig, target: HTMLElement = page) => {
      const card = document.createElement(
        String(config.type).replace('custom:', ''),
      ) as PreviewCard;
      card.setConfig(config);
      card.hass = hass(mode === 'dark');
      target.append(card);
      mounted.push({ card, theme: mode });
    };
    add(hero, summary);
    const homeActivities = {
      ...activities,
      ...(params.has('room-appliances')
        ? { title: 'Apparaten', show_inactive: true, hide_when_empty: false }
        : {}),
      appliances: params.has('room-appliances')
        ? activities.appliances
        : [...activities.appliances, heatPump],
    };
    add(homeActivities, summary);
    add(scenes, summary);
    for (const group of roomGroups) {
      const section = document.createElement('section');
      section.className = 'floor';
      const heading = document.createElement('h2');
      heading.textContent = group.title;
      section.append(heading);
      const grid = document.createElement('div');
      grid.className = 'room-grid';
      for (const room of group.rooms) add({ ...room }, grid);
      section.append(grid);
      navigation.append(section);
    }
    main.append(page);
  }
}
render();
document.querySelector<HTMLSelectElement>('#scenario')!.value = scenario;
document.querySelector('#theme')!.addEventListener('change', (event) => {
  theme = (event.target as HTMLSelectElement).value as typeof theme;
  document.querySelector<HTMLElement>('main')!.dataset.theme = theme;
  for (const page of document.querySelectorAll<HTMLElement>('.home-page'))
    page.hidden = theme !== 'both' && !page.classList.contains(theme);
});
document.querySelector('#language')!.addEventListener('change', (event) => {
  language = (event.target as HTMLSelectElement).value;
  update();
});
document.querySelector('#scenario')!.addEventListener('change', (event) => {
  scenario = (event.target as HTMLSelectElement).value as HomeScenario;
  states = fixtureStates(scenario);
  document.querySelector<HTMLSelectElement>('#daylight')!.value =
    states['sun.sun']!.state;
  update();
});
document.querySelector('#daylight')!.addEventListener('change', (event) => {
  states = {
    ...states,
    'sun.sun': {
      ...states['sun.sun']!,
      state: (event.target as HTMLSelectElement).value,
    },
  };
  update();
});
document.querySelector('#long-name')!.addEventListener('click', () => {
  for (const card of document.querySelectorAll<PreviewCard>('home-room-card')) {
    card.setConfig({
      ...roomGroups[0]!.rooms[0],
      name: 'Een kamer met een bijzonder lange beschrijvende naam',
    });
  }
});
window.addEventListener('location-changed', () => {
  document.querySelector('#home-feedback')!.textContent =
    `Navigation: ${location.pathname}`;
});
// Preview-only hook for state-event and navigation tests; excluded from the bundle.
Object.assign(window, {
  homePreview: {
    calls,
    setState(
      id: string,
      state: string,
      attributes?: Record<string, unknown>,
      lastChanged?: string,
    ) {
      states = {
        ...states,
        [id]: {
          ...states[id],
          entity_id: id,
          state,
          attributes: attributes ?? states[id]?.attributes ?? {},
          last_changed: lastChanged ?? states[id]?.last_changed,
        } satisfies HassEntity,
      };
      update();
    },
  },
});
