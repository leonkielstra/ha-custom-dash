import { afterEach, expect, it, vi } from 'vitest';
import '../src/index';
import { LightControlCard } from '../src/cards/light-control';
import { RoomLightingCard } from '../src/cards/room-lighting';
import { SceneCard } from '../src/cards/scenes';
import { RoomHeaderCard } from '../src/cards/room-header';
import { DeviceCard } from '../src/cards/device';
import { SectionCard } from '../src/cards/section';
import type { HassEntity, HomeAssistant } from '../src/ha/types';
const light = (state = 'on', brightness = 128): HassEntity => ({
  entity_id: 'light.example',
  state,
  attributes: {
    brightness,
    supported_color_modes: ['brightness'],
    friendly_name: 'Example light',
  },
});
const originalLoadCardHelpers = window.loadCardHelpers;
function hass(
  states: HomeAssistant['states'] = { 'light.example': light() },
): HomeAssistant {
  return {
    states,
    callService: vi.fn().mockResolvedValue(undefined),
    themes: { darkMode: false },
  };
}
afterEach(() => {
  document.body.replaceChildren();
  vi.useRealTimers();
  if (originalLoadCardHelpers) window.loadCardHelpers = originalLoadCardHelpers;
  else delete window.loadCardHelpers;
});
const changeBrightness = (slider: HTMLInputElement, value: number) => {
  slider.value = String(value);
  slider.dispatchEvent(new Event('input'));
};
it('throttles live changes, keeps the drag stable during state updates, and flushes release', async () => {
  vi.useFakeTimers();
  const card = new LightControlCard();
  card.setConfig({
    type: 'test',
    entity: 'light.example',
    slider_live_update: true,
  });
  card.hass = hass();
  const callService = card.hass.callService;
  document.body.append(card);
  await card.updateComplete;
  const slider = card.shadowRoot!.querySelector('input')!;
  changeBrightness(slider, 60);
  changeBrightness(slider, 65);
  changeBrightness(slider, 70);
  await vi.advanceTimersByTimeAsync(199);
  expect(callService).toHaveBeenCalledTimes(1);
  await vi.advanceTimersByTimeAsync(1);
  expect(callService).toHaveBeenCalledTimes(2);
  expect(callService).toHaveBeenLastCalledWith('light', 'turn_on', {
    entity_id: 'light.example',
    brightness: 179,
  });
  card.hass = { ...card.hass, states: { 'light.example': light('on', 153) } };
  await card.updateComplete;
  expect(card.shadowRoot!.textContent).toContain('70%');
  changeBrightness(slider, 80);
  slider.dispatchEvent(new Event('change'));
  await vi.advanceTimersByTimeAsync(0);
  expect(callService).toHaveBeenCalledTimes(3);
  expect(callService).toHaveBeenLastCalledWith('light', 'turn_on', {
    entity_id: 'light.example',
    brightness: 204,
  });
  await vi.advanceTimersByTimeAsync(200);
  expect(callService).toHaveBeenCalledTimes(3);
  card.hass = { ...card.hass, states: { 'light.example': light('on', 204) } };
  await card.updateComplete;
  await card.updateComplete;
  expect(card.shadowRoot!.textContent).not.toContain('Updating');
});
it('coalesces live changes behind a slow service and sends the final released value', async () => {
  vi.useFakeTimers();
  const card = new LightControlCard();
  card.setConfig({
    type: 'test',
    entity: 'light.example',
    slider_live_update: true,
  });
  card.hass = hass();
  let resolve!: () => void;
  vi.mocked(card.hass.callService).mockImplementationOnce(
    () =>
      new Promise<void>((done) => {
        resolve = done;
      }),
  );
  document.body.append(card);
  await card.updateComplete;
  const slider = card.shadowRoot!.querySelector('input')!;
  changeBrightness(slider, 60);
  changeBrightness(slider, 70);
  await vi.advanceTimersByTimeAsync(200);
  changeBrightness(slider, 90);
  slider.dispatchEvent(new Event('change'));
  expect(card.hass.callService).toHaveBeenCalledTimes(1);
  resolve();
  await vi.advanceTimersByTimeAsync(0);
  expect(card.hass.callService).toHaveBeenCalledTimes(2);
  expect(card.hass.callService).toHaveBeenLastCalledWith('light', 'turn_on', {
    entity_id: 'light.example',
    brightness: 230,
  });
});
it.each([
  'pointercancel',
  'blur',
  'disconnect',
  'entity',
  'disabled',
  'unavailable',
  'off',
  'toggle',
])('discards unsent live changes on %s', async (reason) => {
  vi.useFakeTimers();
  const card = new LightControlCard();
  const config = {
    type: 'test',
    entity: 'light.example',
    slider_live_update: true,
  };
  card.setConfig(config);
  card.hass = hass();
  document.body.append(card);
  await card.updateComplete;
  const slider = card.shadowRoot!.querySelector('input')!;
  changeBrightness(slider, 60);
  await vi.advanceTimersByTimeAsync(0);
  card.hass = { ...card.hass, states: { 'light.example': light('on', 153) } };
  await card.updateComplete;
  changeBrightness(slider, 80);
  if (reason === 'disconnect') card.remove();
  else if (reason === 'entity')
    card.setConfig({ ...config, entity: 'light.other' });
  else if (reason === 'disabled')
    card.setConfig({ ...config, slider_live_update: false });
  else if (reason === 'unavailable' || reason === 'off')
    card.hass = { ...card.hass, states: { 'light.example': light(reason) } };
  else if (reason === 'toggle')
    card.shadowRoot!.querySelector('button')!.click();
  else slider.dispatchEvent(new Event(reason));
  await card.updateComplete;
  await vi.advanceTimersByTimeAsync(300);
  expect(card.hass.callService).toHaveBeenCalledTimes(
    reason === 'toggle' ? 2 : 1,
  );
});
it('inherits live updates from the room while respecting a per-light false override', async () => {
  const card = new RoomLightingCard();
  card.setConfig({
    type: 'test',
    slider_live_update: true,
    lights: [
      { entity: 'light.example' },
      { entity: 'light.other', slider_live_update: false },
    ],
  });
  card.hass = hass({ 'light.example': light(), 'light.other': light() });
  document.body.append(card);
  await card.updateComplete;
  const children = [
    ...card.shadowRoot!.querySelectorAll<LightControlCard>(
      'home-light-control-card',
    ),
  ];
  await Promise.all(children.map((child) => child.updateComplete));
  changeBrightness(children[0]!.shadowRoot!.querySelector('input')!, 70);
  changeBrightness(children[1]!.shadowRoot!.querySelector('input')!, 80);
  expect(card.hass.callService).toHaveBeenCalledTimes(1);
  expect(card.hass.callService).toHaveBeenLastCalledWith('light', 'turn_on', {
    entity_id: 'light.example',
    brightness: 179,
  });
});
it('renders generic child cards beneath a reusable section heading and syncs hass', async () => {
  const children: (HTMLElement & { hass?: HomeAssistant })[] = [];
  window.loadCardHelpers = async () => ({
    createCardElement(config) {
      const child = document.createElement('div') as HTMLElement & {
        hass?: HomeAssistant;
      };
      child.dataset.type = config.type;
      children.push(child);
      return child;
    },
  });
  const card = new SectionCard();
  card.setConfig({
    type: 'custom:home-section-card',
    title: 'Media',
    cards: [
      { type: 'media-control', entity: 'media_player.example' },
      { type: 'custom:bubble-card', card_type: 'media-player' },
    ],
  });
  const firstHass = hass();
  card.hass = firstHass;
  document.body.append(card);
  await card.updateComplete;
  await Promise.resolve();
  await card.updateComplete;

  expect(card.shadowRoot!.querySelector('h3')!.textContent).toBe('Media');
  expect(card.shadowRoot!.querySelector('.content')!.children).toHaveLength(2);
  expect(children.map((child) => child.dataset.type)).toEqual([
    'media-control',
    'custom:bubble-card',
  ]);
  expect(children[0]?.hass).toBe(firstHass);

  const nextHass = hass({
    'media_player.example': {
      entity_id: 'media_player.example',
      state: 'playing',
      attributes: {},
    },
  });
  card.hass = nextHass;
  await card.updateComplete;
  expect(children[0]?.hass).toBe(nextHass);
});
it('provides local slider feedback without service calls until commit and rolls back failure', async () => {
  const card = new LightControlCard();
  card.setConfig({ type: 'test', entity: 'light.example' });
  card.hass = hass();
  document.body.append(card);
  await card.updateComplete;
  const slider = card.shadowRoot!.querySelector('input')!;
  slider.value = '75';
  slider.dispatchEvent(new Event('input'));
  await card.updateComplete;
  expect(card.hass.callService).not.toHaveBeenCalled();
  expect(card.shadowRoot!.textContent).toContain('75%');
  slider.dispatchEvent(new Event('change'));
  await card.updateComplete;
  expect(card.hass.callService).toHaveBeenCalledWith('light', 'turn_on', {
    entity_id: 'light.example',
    brightness: 191,
  });
  card.hass = { ...card.hass, states: { 'light.example': light('on', 191) } };
  await card.updateComplete;
  await card.updateComplete;
  await expect
    .poll(() => card.shadowRoot!.textContent)
    .not.toContain('Updating');
  vi.mocked(card.hass.callService).mockRejectedValueOnce(new Error('failure'));
  card.shadowRoot!.querySelector('button')!.click();
  await card.updateComplete;
  await Promise.resolve();
  await card.updateComplete;
  await expect
    .poll(() => card.shadowRoot!.querySelector('[role="alert"]')?.textContent)
    .toContain('Could not update');
  expect(
    card.shadowRoot!.querySelector('button')!.getAttribute('aria-pressed'),
  ).toBe('true');
});
it('disables brightness while off and gracefully handles unavailable and missing lights', async () => {
  const card = new LightControlCard();
  card.setConfig({ type: 'test', entity: 'light.example' });
  card.hass = hass({ 'light.example': light('off') });
  document.body.append(card);
  await card.updateComplete;
  expect(card.shadowRoot!.querySelector('input')!.disabled).toBe(true);
  expect(card.shadowRoot!.querySelector('button')!.disabled).toBe(false);
  card.hass = hass({});
  await card.updateComplete;
  expect(card.shadowRoot!.querySelector('button')!.disabled).toBe(true);
  expect(card.shadowRoot!.textContent).toContain('Not found');
  card.hass = hass({ 'light.example': light('unavailable') });
  await card.updateComplete;
  expect(card.shadowRoot!.textContent).toContain('Unavailable');
  const basic = light();
  basic.attributes.supported_color_modes = ['onoff'];
  card.hass = hass({ 'light.example': basic });
  await card.updateComplete;
  expect(card.shadowRoot!.textContent).toContain('On/off only');
  expect(card.shadowRoot!.querySelector('input')!.disabled).toBe(true);
});
it('limits room commands to configured available lights and uses the shared light component', async () => {
  const card = new RoomLightingCard();
  card.setConfig({
    type: 'test',
    lights: [{ entity: 'light.example' }, { entity: 'light.missing' }],
  });
  card.hass = hass({ 'light.example': light(), 'light.unconfigured': light() });
  document.body.append(card);
  await card.updateComplete;
  const button = card.shadowRoot!.querySelector<HTMLButtonElement>(
    '[aria-label="Turn all configured lights off"]',
  )!;
  button.click();
  await card.updateComplete;
  expect(card.hass.callService).toHaveBeenCalledWith('light', 'turn_off', {
    entity_id: ['light.example'],
  });
  expect(
    card.shadowRoot!.querySelectorAll('home-light-control-card'),
  ).toHaveLength(2);
});
it('activates scenes and reports action success without treating them as toggle state', async () => {
  const card = new SceneCard();
  card.setConfig({
    type: 'test',
    scenes: [{ entity: 'scene.example', name: 'Read' }],
  });
  card.hass = hass({
    'scene.example': {
      entity_id: 'scene.example',
      state: '2026-01-01',
      attributes: {},
    },
  });
  document.body.append(card);
  await card.updateComplete;
  card.shadowRoot!.querySelector('button')!.click();
  await card.updateComplete;
  await Promise.resolve();
  await card.updateComplete;
  expect(card.hass.callService).toHaveBeenCalledWith('scene', 'turn_on', {
    entity_id: 'scene.example',
  });
  expect(
    card.shadowRoot!.querySelector('[role="status"]')?.textContent,
  ).toContain('Read activated');
});
it('keeps sensor readings inline, reports unavailable counts, and follows HA dark mode', async () => {
  const card = new RoomHeaderCard();
  card.setConfig({
    type: 'test',
    name: 'Example room',
    temperature: 'sensor.example_temp',
    humidity: 'sensor.missing',
    lights: ['light.example', 'light.missing'],
  });
  card.hass = hass({
    'light.example': light(),
    'sensor.example_temp': {
      entity_id: 'sensor.example_temp',
      state: '20.4',
      attributes: {},
    },
  });
  document.body.append(card);
  await card.updateComplete;
  expect(card.shadowRoot!.querySelector('.readings')?.textContent).toContain(
    '20.4°C',
  );
  expect(card.shadowRoot!.textContent).toContain('1 unavailable');
  card.hass = { ...card.hass, themes: { darkMode: true } };
  await card.updateComplete;
  expect(card.dataset.theme).toBe('dark');
});
it('localizes room lighting summaries from the Home Assistant language', async () => {
  const lights = Array.from(
    { length: 5 },
    (_, index) => `light.example_${index}`,
  );
  const states = Object.fromEntries(lights.map((id) => [id, light()]));
  const card = new RoomHeaderCard();
  card.setConfig({ type: 'test', name: 'Example room', lights });
  card.hass = { ...hass(states), locale: { language: 'nl-NL' } };
  document.body.append(card);
  await card.updateComplete;
  expect(card.shadowRoot!.textContent).toContain('5 lampen aan');

  card.hass = { ...card.hass, locale: { language: 'en-US' } };
  await card.updateComplete;
  expect(card.shadowRoot!.textContent).toContain('5 lights on');
});
it('selects media actions using supported features', async () => {
  const card = new DeviceCard();
  card.setConfig({
    type: 'test',
    entity: 'media_player.example',
    name: 'Example media',
  });
  card.hass = hass({
    'media_player.example': {
      entity_id: 'media_player.example',
      state: 'playing',
      attributes: { supported_features: 1 },
    },
  });
  document.body.append(card);
  await card.updateComplete;
  card.shadowRoot!.querySelector('button')!.click();
  await card.updateComplete;
  expect(card.hass.callService).toHaveBeenCalledWith(
    'media_player',
    'media_pause',
    { entity_id: 'media_player.example' },
  );
  card.hass = hass({
    'media_player.example': {
      entity_id: 'media_player.example',
      state: 'on',
      attributes: { supported_features: 0 },
    },
  });
  await card.updateComplete;
  expect(card.shadowRoot!.querySelector('button')).toBeNull();
});
