import { afterEach, expect, it, vi } from 'vitest';
import '../src/index';
import { ClimateCard } from '../src/cards/climate';
import { HomeHeroCard } from '../src/cards/home-hero';
import { climateConfig, heroConfig, roomConfig } from '../src/ha/config';
import { weatherLabel } from '../src/ha/weather';
import { hero } from '../preview/home-fixtures';
import type { HomeAssistant } from '../src/ha/types';
function hass(): HomeAssistant {
  return {
    states: {
      'climate.example_heating': {
        entity_id: 'climate.example_heating',
        state: 'auto',
        attributes: { current_temperature: 20 },
      },
    },
    locale: { language: 'nl-NL' },
    config: { unit_system: { temperature: '°C' } },
    callService: vi.fn(),
  };
}
afterEach(() => {
  document.body.replaceChildren();
});
it('validates additive climate/weather/tone options without changing the existing schema', () => {
  expect(
    climateConfig({ type: 'test', entity: 'climate.example_heating' }).entity,
  ).toBe('climate.example_heating');
  expect(() =>
    climateConfig({ type: 'test', entity: 'sensor.example' }),
  ).toThrow('climate.entity');
  expect(() => heroConfig({ ...hero, weather: 'sensor.example' })).toThrow(
    'weather',
  );
  expect(() =>
    roomConfig({ type: 'test', name: 'Room', icon_tone: 'green' }),
  ).toThrow('icon_tone');
  expect(
    roomConfig({ type: 'test', name: 'Room', icon_tone: 'blue' }).icon_tone,
  ).toBe('blue');
});
it('opens HA native thermostat controls through a composed event without making service calls', async () => {
  const card = new ClimateCard();
  card.setConfig({
    type: 'custom:home-climate-card',
    entity: 'climate.example_heating',
    name: 'Heating',
  });
  card.hass = hass();
  document.body.append(card);
  await card.updateComplete;
  const listener = vi.fn();
  card.addEventListener('hass-more-info', listener);
  expect(card.shadowRoot!.textContent).toContain('Auto · 20,0°C');
  card.shadowRoot!.querySelector('button')!.click();
  expect(listener).toHaveBeenCalledOnce();
  const event = listener.mock.calls[0]![0] as CustomEvent;
  expect(event.detail).toEqual({ entityId: 'climate.example_heating' });
  expect(event.composed).toBe(true);
  expect(event.bubbles).toBe(true);
  expect(card.hass.callService).not.toHaveBeenCalled();
  card.hass = { ...card.hass, config: { unit_system: { temperature: '°F' } } };
  await card.updateComplete;
  expect(card.shadowRoot!.textContent).toContain('20,0°F');
});
it('handles loading and unavailable thermostats without stale readings or entity IDs', async () => {
  const card = new ClimateCard();
  card.setConfig({ type: 'test', entity: 'climate.example_heating' });
  document.body.append(card);
  await card.updateComplete;
  expect(card.shadowRoot!.querySelector('button')!.disabled).toBe(true);
  expect(card.shadowRoot!.textContent).not.toContain('climate.example_heating');
  card.hass = hass();
  card.hass.states['climate.example_heating'] = {
    ...card.hass.states['climate.example_heating']!,
    state: 'unavailable',
  };
  await card.updateComplete;
  expect(card.shadowRoot!.textContent).toContain('Niet beschikbaar');
  expect(card.shadowRoot!.textContent).not.toContain('20,0');
});
it('renders optional weather reactively with translated labels and no raw integration states', async () => {
  const card = new HomeHeroCard();
  card.setConfig({ ...hero, weather: 'weather.example' });
  const h = hass();
  h.states['weather.example'] = {
    entity_id: 'weather.example',
    state: 'cloudy',
    attributes: {},
  };
  card.hass = h;
  document.body.append(card);
  await card.updateComplete;
  expect(card.shadowRoot!.textContent).toContain('Bewolkt');
  card.hass = {
    ...h,
    states: {
      ...h.states,
      'weather.example': {
        ...h.states['weather.example']!,
        state: 'snowy-rainy',
      },
    },
  };
  await card.updateComplete;
  expect(card.shadowRoot!.textContent).toContain('Natte sneeuw');
  expect(
    weatherLabel(
      {
        entity_id: 'weather.example',
        state: 'new_technical_value',
        attributes: {},
      },
      'nl',
    ),
  ).toBe('Onbekend');
  expect(weatherLabel(undefined, 'en')).toBe('Unavailable');
});
