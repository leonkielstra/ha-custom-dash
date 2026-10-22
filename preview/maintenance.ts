import { maintenance, maintenanceStates } from './maintenance-fixtures';
import type { MaintenanceCard } from '../src/cards/maintenance';
import type { HomeAssistant } from '../src/ha/types';
import './icons';
import './style.css';
const params = new URLSearchParams(location.search);
await import(
  /* @vite-ignore */ params.has('bundle')
    ? '/dist/ha-custom-dash.js'
    : '../src/index.ts'
);
let theme = params.get('theme') ?? 'light';
let language = 'nl';
let states = maintenanceStates();
document.body.innerHTML = `<header class="preview-bar"><div><h1>Onderhoud preview</h1><p>Fictional fixture states · no Home Assistant connection</p></div><div class="preview-controls"><label>Theme <select id="theme"><option>light</option><option>dark</option></select></label><label>Scenario <select id="scenario"><option value="attention">Attention</option><option value="healthy">Healthy</option><option value="unavailable">Unavailable</option></select></label><label>Language <select id="language"><option value="nl">Nederlands</option><option value="en">English</option></select></label></div></header><main style="max-width:1120px;margin:0 auto;padding:24px 16px"></main><p id="feedback" role="status"></p>`;
const card = document.createElement('home-maintenance-card') as MaintenanceCard;
card.setConfig(maintenance);
document.querySelector('main')!.append(card);
function update() {
  document.body.style.background = theme === 'dark' ? '#141414' : '#f7f5ef';
  card.hass = {
    states,
    locale: { language },
    themes: { darkMode: theme === 'dark' },
    async callService() {
      throw Error('No service calls expected');
    },
  } satisfies HomeAssistant;
}
update();
document.querySelector<HTMLSelectElement>('#theme')!.value = theme;
document.querySelector('#theme')!.addEventListener('change', (e) => {
  theme = (e.target as HTMLSelectElement).value;
  update();
});
document.querySelector('#language')!.addEventListener('change', (e) => {
  language = (e.target as HTMLSelectElement).value;
  update();
});
document.querySelector('#scenario')!.addEventListener('change', (e) => {
  states = maintenanceStates((e.target as HTMLSelectElement).value);
  update();
});
card.addEventListener('hass-more-info', (e) => {
  document.querySelector('#feedback')!.textContent = (
    e as CustomEvent<{ entityId: string }>
  ).detail.entityId;
});
