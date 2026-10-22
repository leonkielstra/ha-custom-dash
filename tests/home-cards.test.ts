import { afterEach, expect, it, vi } from 'vitest';
import '../src/index';
import { HomeHeroCard } from '../src/cards/home-hero';
import { RoomCard } from '../src/cards/room';
import { ActivitySectionCard } from '../src/cards/activity-section';
import {
  activities,
  fixtureStates,
  hero,
  roomGroups,
} from '../preview/home-fixtures';
import type { HomeAssistant } from '../src/ha/types';
const now = Date.parse('2026-01-01T12:00:00Z');
function hass(
  scenario: Parameters<typeof fixtureStates>[0] = 'day',
): HomeAssistant {
  return {
    states: fixtureStates(scenario, now),
    locale: { language: 'nl' },
    themes: { darkMode: true },
    callService: vi.fn(),
  };
}
afterEach(() => {
  document.body.replaceChildren();
  vi.useRealTimers();
  vi.restoreAllMocks();
});
it('switches images on sun updates independently of theme, retaining the last valid selection', async () => {
  const card = new HomeHeroCard();
  card.setConfig(hero);
  card.hass = hass();
  document.body.append(card);
  await card.updateComplete;
  const image = () => card.shadowRoot!.querySelector('img')!;
  expect(image().getAttribute('src')).toBe(hero.image_day);
  expect(card.getAttribute('data-theme')).toBe('dark');
  card.hass = {
    ...card.hass,
    states: {
      ...card.hass.states,
      'sun.sun': { ...card.hass.states['sun.sun']!, state: 'below_horizon' },
    },
    themes: { darkMode: false },
  };
  await card.updateComplete;
  expect(image().getAttribute('src')).toBe(hero.image_night);
  card.hass = {
    ...card.hass,
    states: {
      ...card.hass.states,
      'sun.sun': { ...card.hass.states['sun.sun']!, state: 'unavailable' },
    },
  };
  await card.updateComplete;
  expect(image().getAttribute('src')).toBe(hero.image_night);
  card.setConfig({ ...hero, sun_entity: 'sun.example_other' });
  await card.updateComplete;
  expect(image().getAttribute('src')).toBe(hero.image_day);
});
it('renders hero while loading, localizes actual units, and handles image failure', async () => {
  const card = new HomeHeroCard();
  card.setConfig(hero);
  document.body.append(card);
  await card.updateComplete;
  expect(card.shadowRoot!.textContent).not.toMatch(/NaN|undefined/);
  card.hass = {
    ...hass(),
    states: {
      [hero.temperature]: {
        entity_id: hero.temperature,
        state: '68.5',
        attributes: { unit_of_measurement: '°F' },
      },
    },
  };
  await card.updateComplete;
  expect(card.shadowRoot!.textContent).toContain('68,5°F');
  expect(card.shadowRoot!.textContent).toContain('Buiten');
  expect(card.shadowRoot!.textContent).toContain('—');
  card.shadowRoot!.querySelector('img')!.dispatchEvent(new Event('error'));
  await card.updateComplete;
  expect(card.shadowRoot!.querySelector('[role="img"]')).not.toBeNull();
});
it('keeps unknown lights configured and omits absent metadata and unsafe navigation', async () => {
  const card = new RoomCard();
  const config = roomGroups[1]!.rooms[3]!;
  card.setConfig(config);
  card.hass = hass('unavailable');
  document.body.append(card);
  await card.updateComplete;
  expect(card.shadowRoot!.textContent).toContain('1 lichtgroep aan');
  expect(card.shadowRoot!.textContent).toContain('1 niet beschikbaar');
  expect(card.shadowRoot!.textContent).not.toContain('Verlichting uit');
  const id = config.lights![2]!;
  card.hass = {
    ...card.hass,
    states: {
      ...card.hass.states,
      [id]: { ...card.hass.states[id]!, state: 'on' },
    },
  };
  await card.updateComplete;
  expect(card.shadowRoot!.textContent).toContain('2 lichtgroepen aan');
  expect(card.shadowRoot!.textContent).not.toContain('niet beschikbaar');
  card.setConfig({ type: 'custom:home-room-card', name: 'Room' });
  await card.updateComplete;
  expect(card.shadowRoot!.querySelector('.status')).toBeNull();
  expect(card.shadowRoot!.querySelector('.temperature')).toBeNull();
  expect(card.shadowRoot!.querySelector('a')).toBeNull();
});
it('hides the entire empty activity card and emits HA visibility notifications on reappearance', async () => {
  const card = new ActivitySectionCard();
  card.setConfig(activities);
  card.hass = hass();
  const listener = vi.fn();
  card.addEventListener('card-visibility-changed', listener);
  document.body.append(card);
  await card.updateComplete;
  expect(card.hidden).toBe(true);
  expect(card.shadowRoot!.querySelector('section')).toBeNull();
  expect(card.getCardSize()).toBe(0);
  expect(card.connectedWhileHidden).toBe(true);
  card.hass = hass('multiple');
  await card.updateComplete;
  expect(card.hidden).toBe(false);
  expect(card.shadowRoot!.querySelectorAll('ha-card')).toHaveLength(4);
  expect(listener.mock.calls.at(-1)?.[0].detail).toEqual({ value: true });
  expect(card.hass.callService).not.toHaveBeenCalled();
  card.hass = hass();
  await card.updateComplete;
  expect(card.hidden).toBe(true);
  card.setConfig({ ...activities, hide_when_empty: false });
  await card.updateComplete;
  expect(card.hidden).toBe(false);
  expect(card.shadowRoot!.textContent).toContain('Geen actieve apparaten');
});
it('keeps room appliance rows visible with honest idle, error, scheduled and unavailable labels', async () => {
  const card = new ActivitySectionCard();
  card.setConfig({
    ...activities,
    show_inactive: true,
    hide_when_empty: false,
  });
  card.hass = hass();
  document.body.append(card);
  await card.updateComplete;
  const rows = () => [...card.shadowRoot!.querySelectorAll('ha-card')];
  expect(rows()).toHaveLength(4);
  expect(card.hidden).toBe(false);
  expect(rows().every((row) => row.textContent?.includes('Niet actief'))).toBe(
    true,
  );
  expect(card.shadowRoot!.querySelector('progress')).toBeNull();
  const cases = [
    ['off', 'Niet actief'],
    ['ready', 'Gereed om te starten'],
    ['error', 'Storing gemeld'],
    ['aborting', 'Programma wordt afgebroken'],
    ['delayedstart', 'Start gepland'],
    ['unavailable', 'Niet beschikbaar'],
    ['unknown', 'Onbekend'],
    ['unexpected_value', 'Onbekend'],
  ] as const;
  const entity = activities.appliances[0]!.entity;
  for (const [state, label] of cases) {
    card.hass = {
      ...card.hass!,
      states: {
        ...card.hass!.states,
        [entity]: { entity_id: entity, state, attributes: {} },
      },
    };
    await card.updateComplete;
    expect(rows()[0]!.querySelector('.status')?.textContent).toContain(label);
    expect(rows()).toHaveLength(4);
  }
  card.hass = { ...card.hass!, locale: { language: 'en' } };
  await card.updateComplete;
  expect(rows()[0]!.querySelector('.status')?.textContent).toContain('Unknown');
  card.hass = hass('multiple');
  await card.updateComplete;
  expect(rows()[0]!.textContent).toContain('Bezig met wassen');
  expect(rows()[0]!.querySelector('progress')).not.toBeNull();
  expect(card.hass.callService).not.toHaveBeenCalled();
});
it('updates timing every minute and cleans up its single timer on idle/disconnect/reconnect', async () => {
  vi.useFakeTimers();
  vi.setSystemTime(now);
  const card = new ActivitySectionCard();
  card.setConfig(activities);
  card.hass = hass('night');
  document.body.append(card);
  await card.updateComplete;
  expect(
    card.shadowRoot!.querySelector('.metric')!.getAttribute('aria-label'),
  ).toBe('Indicatief: 48 minuten bezig');
  expect(vi.getTimerCount()).toBe(1);
  await vi.advanceTimersByTimeAsync(60000);
  await card.updateComplete;
  expect(
    card.shadowRoot!.querySelector('.metric')!.getAttribute('aria-label'),
  ).toBe('Indicatief: 49 minuten bezig');
  expect(vi.getTimerCount()).toBe(1);
  card.remove();
  expect(vi.getTimerCount()).toBe(0);
  document.body.append(card);
  await card.updateComplete;
  expect(vi.getTimerCount()).toBe(1);
  card.hass = hass();
  await card.updateComplete;
  expect(vi.getTimerCount()).toBe(0);
  // A machine can start hours after initial render; do not use a stale clock.
  vi.setSystemTime(now + 7200000);
  const h = hass('night');
  h.states['binary_sensor.example_washer'] = {
    ...h.states['binary_sensor.example_washer']!,
    last_changed: new Date(now + 7200000).toISOString(),
  };
  card.hass = h;
  await card.updateComplete;
  expect(
    card.shadowRoot!.querySelector('.metric')!.getAttribute('aria-label'),
  ).toBe('Indicatief: 0 minuten bezig');
  expect(vi.getTimerCount()).toBe(1);
});
it('uses translated program statuses and actual progress without a temperature-based substitute', async () => {
  const card = new ActivitySectionCard();
  card.setConfig(activities);
  card.hass = hass('unavailable');
  card.hass.states['sensor.example_oven_status']!.state = 'pause';
  card.hass.states['sensor.example_dishwasher_status']!.state =
    'actionrequired';
  document.body.append(card);
  await card.updateComplete;
  expect(card.shadowRoot!.textContent).toContain('Gepauzeerd');
  expect(card.shadowRoot!.textContent).toContain('Actie nodig');
  const oven = card.shadowRoot!.querySelectorAll('ha-card')[2]!;
  expect(oven.textContent).toContain('180°C');
  expect(oven.querySelector('progress')).toBeNull();
  expect(card.shadowRoot!.textContent).not.toMatch(
    /NaN|undefined|Invalid Date/,
  );
});
