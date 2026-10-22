import type { HomeAssistant } from '../src/ha/types';
import { dashboard, initialStates, entities } from './heatpump-fixtures';
import './icons';
import './style.css';
import './heatpump.css';

const params = new URLSearchParams(location.search);
await import(
  /* @vite-ignore */ params.has('bundle')
    ? '/dist/ha-custom-dash.js'
    : '../src/index.ts'
);
interface PreviewCard extends HTMLElement {
  setConfig(value: unknown): void;
  hass?: HomeAssistant;
}
let states = structuredClone(initialStates);
let dark = true;
let language = 'nl';
let current = 'overzicht';
const mounted: PreviewCard[] = [];
const calls: unknown[] = [];
function hass(): HomeAssistant {
  return {
    states,
    locale: { language },
    themes: { darkMode: dark },
    async callService(...args) {
      calls.push(args);
    },
  };
}
const host = document.createElement('main');
host.className = 'hp-page';
document.body.innerHTML = `<header class="preview-bar"><div><h1>Heat-pump preview</h1><p><a href="/preview/home.html">Home</a> · Fictional states and illustrative chart traces</p></div><div class="preview-controls"><label>Theme <select id="hp-theme"><option value="dark">Dark</option><option value="light">Light</option></select></label><label>Layout <select id="hp-layout"><option value="wide">Responsive</option><option value="phone">Phone</option></select></label><label>Language <select id="hp-language"><option value="nl">Nederlands</option><option value="en">English</option></select></label><label>Scenario <select id="hp-scenario"><option value="hot-water">Hot water</option><option value="heating">Heating</option><option value="standby">Standby</option><option value="unavailable">Unavailable</option><option value="fault">Fault</option><option value="auxiliary">Auxiliary heating</option></select></label></div></header>`;
document.body.append(host);
const ns = 'http://www.w3.org/2000/svg';
function svgEl(tag: string, attrs: Record<string, string | number>) {
  const e = document.createElementNS(ns, tag);
  for (const [key, value] of Object.entries(attrs))
    e.setAttribute(key, String(value));
  return e;
}

/** Preview only. Production cards are rendered by ApexCharts/native HA, not this fixture renderer. */
function chart(config: Record<string, unknown>): HTMLElement {
  const card = document.createElement('article');
  card.className = 'hp-fixture-chart';
  card.dataset.fixture = 'illustrative';
  const header = config.header as { title?: string } | undefined;
  const heading = document.createElement('h3');
  heading.textContent = String(header?.title ?? config.title ?? '');
  card.append(heading);
  const svg = svgEl('svg', {
    viewBox: '0 0 600 205',
    role: 'img',
    'aria-label': `${heading.textContent} — illustrative fixture`,
  });
  const series = (config.series ?? config.entities ?? []) as {
    entity: string;
    name: string;
    color?: string;
    yaxis_id?: string;
    stroke_dash?: number;
    group_by?: { func: string };
  }[];
  const time = config.type === 'history-graph';
  const bar = config.type === 'statistics-graph';
  if (time) {
    for (const [index, s] of series.entries()) {
      const label = svgEl('text', { x: 5, y: 24 + index * 42 });
      label.textContent = s.name;
      svg.append(label);
      svg.append(
        svgEl('rect', {
          x: 120,
          y: 12 + index * 42,
          width: 460,
          height: 20,
          fill: 'var(--divider-color)',
          rx: 4,
        }),
      );
      for (let i = 0; i < 6; i++)
        if (index === 0 || i % 2 === 0)
          svg.append(
            svgEl('rect', {
              x: 125 + i * 73,
              y: 12 + index * 42,
              width: 35 + ((i * 7) % 31),
              height: 20,
              fill: index === 1 ? '#d69a45' : '#76b9ae',
              rx: 3,
            }),
          );
    }
  } else {
    const groups = new Map<string, { min: number; max: number }>();
    for (const s of series) {
      const n = Number(states[s.entity]?.state);
      const id = s.yaxis_id ?? 'default';
      if (Number.isFinite(n)) {
        const group = groups.get(id);
        groups.set(id, {
          min: Math.min(group?.min ?? n, n),
          max: Math.max(group?.max ?? n, n),
        });
      }
    }
    const first = [...groups.values()][0] ?? { min: 0, max: 10 };
    const range = (g: { min: number; max: number }) => {
      const pad = Math.max(
        (g.max - g.min) * 0.3,
        g.max > 100 ? 500 : g.max > 30 ? 3 : 1,
      );
      return {
        low: g.min < 0 ? g.min - pad : Math.max(0, g.min - pad),
        high: g.max + pad,
      };
    };
    const primary = bar ? { low: 0, high: 18 } : range(first);
    for (let i = 0; i < 4; i++) {
      const y = 12 + i * 48;
      svg.append(
        svgEl('line', { x1: 38, y1: y, x2: 580, y2: y, class: 'gridline' }),
      );
      const label = svgEl('text', { x: 0, y: y + 4 });
      label.textContent = (
        primary.high -
        ((primary.high - primary.low) * i) / 3
      ).toFixed(primary.high < 10 ? 1 : 0);
      svg.append(label);
    }
    for (const [index, s] of series.entries()) {
      const base = Number(states[s.entity]?.state);
      if (!Number.isFinite(base)) continue;
      const color = s.color ?? ['#76b9ae', '#d69a45', '#7a9dba'][index % 3]!;
      if (bar) {
        for (let i = 0; i < 14; i++) {
          const height = 30 + ((i * 17 + index * 13) % 90);
          svg.append(
            svgEl('rect', {
              x: 42 + i * 38 + index * 8,
              y: 164 - height,
              width: 7,
              height,
              fill: color,
              rx: 2,
            }),
          );
        }
      } else {
        const g = range(groups.get(s.yaxis_id ?? 'default')!);
        const amplitude = Math.max((g.high - g.low) * 0.025, 0.025);
        const points = Array.from({ length: 49 }, (_, i) => {
          const v =
            base +
            (s.group_by?.func === 'last'
              ? 0
              : Math.sin(i * 0.61 + index) * amplitude +
                Math.sin(i * 0.17) * amplitude * 0.5);
          return `${38 + i * 11.25},${164 - ((v - g.low) / (g.high - g.low)) * 152}`;
        }).join(' ');
        svg.append(
          svgEl('polyline', {
            points,
            fill: 'none',
            stroke: color,
            'stroke-width': 2,
            ...(s.stroke_dash ? { 'stroke-dasharray': '5 5' } : {}),
          }),
        );
      }
    }
    const ticks = bar
      ? ['−14 d', '−10 d', '−7 d', '−3 d', 'Nu']
      : config.graph_span === '7d'
        ? ['Ma', 'Di', 'Do', 'Za', 'Zo']
        : config.graph_span === '72h'
          ? ['−72 u', '−54 u', '−36 u', '−18 u', 'Nu']
          : config.graph_span === '48h'
            ? ['−48 u', '−36 u', '−24 u', '−12 u', 'Nu']
            : ['00:00', '06:00', '12:00', '18:00', '24:00'];
    for (const [i, text] of ticks.entries()) {
      const t = svgEl('text', { x: 38 + i * 132, y: 194 });
      if (i === 4) t.setAttribute('text-anchor', 'end');
      t.textContent = text;
      svg.append(t);
    }
    // Dual-axis labels are explicit; each line uses its configured axis group.
    if (groups.size > 1) {
      const secondary = range([...groups.values()][1]!);
      for (let i = 0; i < 4; i++) {
        const t = svgEl('text', {
          x: 598,
          y: 16 + i * 48,
          'text-anchor': 'end',
        });
        t.textContent = (
          secondary.high -
          ((secondary.high - secondary.low) * i) / 3
        ).toFixed(0);
        svg.append(t);
      }
    }
  }
  card.append(svg);
  // Preview-only chart scaling: keep labels readable in CSS pixels at mobile widths.
  const plotHeight = time ? series.length * 42 + 32 : 205;
  svg.style.height = `${plotHeight}px`;
  if (time)
    for (const [i, label] of [
      '00:00',
      '06:00',
      '12:00',
      '18:00',
      '24:00',
    ].entries()) {
      const tick = svgEl('text', {
        x: 120 + i * 112,
        y: plotHeight - 5,
        ...(i === 4 ? { 'text-anchor': 'end' } : {}),
      });
      tick.textContent = label;
      svg.append(tick);
    }
  queueMicrotask(() => {
    const width = svg.getBoundingClientRect().width;
    if (!width) return;
    const factor = width / 600;
    svg.setAttribute('viewBox', `0 0 ${width} ${plotHeight}`);
    for (const node of svg.querySelectorAll('*')) {
      for (const attr of ['x', 'x1', 'x2', 'width'])
        if (node.hasAttribute(attr))
          node.setAttribute(
            attr,
            String(Number(node.getAttribute(attr)) * factor),
          );
      const points = node.getAttribute('points');
      if (points)
        node.setAttribute(
          'points',
          points
            .split(' ')
            .map((pair) => {
              const [x, y] = pair.split(',');
              return `${Number(x) * factor},${y}`;
            })
            .join(' '),
        );
    }
  });
  const legend = document.createElement('div');
  legend.className = 'legend';
  series.forEach((s, i) => {
    const label = document.createElement('span');
    const line = document.createElement('i');
    line.style.backgroundColor =
      s.color ?? ['#76b9ae', '#d69a45', '#7a9dba'][i % 3]!;
    label.append(line, document.createTextNode(s.name));
    legend.append(label);
  });
  card.append(legend);
  return card;
}
function create(config: Record<string, unknown>): HTMLElement | null {
  if (config.type === 'heading') {
    const h = document.createElement('h2');
    h.textContent = String(config.heading);
    return h;
  }
  if (config.type === 'conditional') {
    const conditions = config.conditions as {
      condition: string;
      entity?: string;
      media_query?: string;
      state?: string;
      state_not?: string;
    }[];
    return conditions.every((c) => {
      if (c.condition === 'screen') return matchMedia(c.media_query!).matches;
      const state = states[c.entity ?? '']?.state ?? 'unavailable';
      return c.state !== undefined ? state === c.state : state !== c.state_not;
    })
      ? create(config.card as Record<string, unknown>)
      : null;
  }
  if (config.type === 'markdown') {
    const note = document.createElement('div');
    note.className = 'hp-note';
    note.textContent = String(config.content).replaceAll('**', '');
    if (/offline|actief|Storing/.test(note.textContent))
      note.classList.add('warning');
    return note;
  }
  if (
    config.type === 'custom:apexcharts-card' ||
    config.type === 'statistics-graph' ||
    config.type === 'history-graph'
  )
    return chart(config);
  const tag = String(config.type).replace('custom:', '');
  if (!customElements.get(tag))
    throw new Error(`Unknown preview component ${tag}`);
  const card = document.createElement(tag) as PreviewCard;
  card.setConfig(config);
  card.hass = hass();
  mounted.push(card);
  return card;
}
function render() {
  mounted.length = 0;
  host.replaceChildren();
  host.classList.toggle('light', !dark);
  const header = document.createElement('header');
  header.className = 'hp-heading';
  header.innerHTML = `<div><h1>${language === 'nl' ? 'Warmtepomp' : 'Heat pump'}</h1><p>${language === 'nl' ? 'Comfort, werking en verbruik' : 'Comfort, operation and consumption'}</p></div><span class="sample-tag">${language === 'nl' ? 'Voorbeeldgegevens' : 'Illustrative data'}</span>`;
  host.append(header);
  const nav = document.createElement('nav');
  nav.className = 'hp-tabs';
  nav.setAttribute('aria-label', 'Heat pump views');
  for (const view of dashboard.views) {
    const button = document.createElement('button');
    button.textContent = view.title;
    button.dataset.view = view.path;
    if (view.path === current) button.setAttribute('aria-current', 'page');
    button.onclick = () => {
      current = view.path;
      render();
    };
    nav.append(button);
  }
  host.append(nav);
  const view = dashboard.views.find((v) => v.path === current)!;
  const sections = document.createElement('div');
  sections.className = 'hp-sections';
  for (const data of view.sections) {
    const section = document.createElement('section');
    section.className = 'hp-section';
    section.style.setProperty('--span', String(data.column_span));
    for (const config of data.cards) {
      const card = create(config);
      if (card) section.append(card);
    }
    sections.append(section);
  }
  host.append(sections);
}
render();
document.querySelector('#hp-theme')!.addEventListener('change', (event) => {
  dark = (event.target as HTMLSelectElement).value === 'dark';
  render();
});
document.querySelector('#hp-language')!.addEventListener('change', (event) => {
  language = (event.target as HTMLSelectElement).value;
  render();
});
document
  .querySelector('#hp-layout')!
  .addEventListener('change', (event) =>
    host.classList.toggle(
      'phone',
      (event.target as HTMLSelectElement).value === 'phone',
    ),
  );
document.querySelector('#hp-scenario')!.addEventListener('change', (event) => {
  states = structuredClone(initialStates);
  const value = (event.target as HTMLSelectElement).value;
  const set = (id: string, state: string) => {
    states[id] = { ...states[id]!, state };
  };
  if (value === 'heating') set(entities.valve, 'climateCircuitOne');
  if (value === 'standby') {
    set(entities.operation, 'standby');
    set(entities.compressor, 'off');
  }
  if (value === 'unavailable') {
    set(entities.output, 'unavailable');
    set(entities.temperature, 'unavailable');
    set(entities.fan, 'unavailable');
    set(entities.controller, 'unavailable');
  }
  if (value === 'fault') set(entities.fault, 'on');
  if (value === 'auxiliary') set(entities.auxiliary, 'on');
  render();
});
Object.assign(window, {
  heatPumpPreview: {
    calls,
    entities,
    setState(id: string, state: string) {
      states = { ...states, [id]: { ...states[id]!, state } };
      for (const card of mounted) card.hass = hass();
    },
  },
});

window.addEventListener('resize', render);
