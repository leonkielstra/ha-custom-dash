# Implementation plan

## Current milestone: reusable room cards

Build a functioning living room vertical slice with TypeScript, Lit, and Vite.
The current product brief supersedes the earlier Bubble Card generation proposal:
these are independent custom cards placed in an existing Home Assistant dashboard.
Keep Home Assistant responsible for state, authentication, services, and layout.
HACS custom-repository installation remains a requirement.

## Decisions

- Ship one bundled ES module, `dist/ha-custom-dash.js`, with Lit included.
- Register five public cards: room header, scenes, individual light, room lighting,
  and media device. Room lighting composes the same individual light component.
- Separate typed configuration/validation, Home Assistant helpers, state handling,
  and shared styles. Keep explicit light lists; no registry discovery.
- Use CSS tokens with Home Assistant theme fallbacks and explicit light/dark
  overrides. Maintain the same layout in both themes. Native buttons and ranges
  provide keyboard and touch behavior; do not imitate operating-system controls.
- Localize built-in UI labels, accessibility text, common entity statuses, and
  feedback through a shared English/Dutch catalog selected from Home Assistant's
  configured language, with English as the fallback. Keep user-configured names
  and labels unchanged. Apply the same language options to the local preview.
- Brightness input updates locally; by default commit on change (release or keyboard step).
  Optional `slider_live_update` submits during input at 200 ms intervals, flushing
  the final value on release. Room defaults allow explicit per-light overrides.
  Serialize requests, coalesce subsequent changes, and keep an optimistic value
  until a matching entity update or bounded confirmation timeout. Service errors
  restore the actual state and appear inline. Clear timers on disconnect.
- Use supported color modes for brightness capability, including an on/off-only
  fallback. Missing/unknown/unavailable states disable unsafe controls.
- Use mock-only preview entities and examples. Never add personal device IDs,
  device names, area names, or locations to repository code or fixtures.
- Provide a framework-free Vite preview with light/dark, mobile/desktop, delayed
  service updates, errors, off/on/non-dimmable/unavailable lights, and long labels.
- Use Vitest for logic and component tests, plus Playwright for browser interaction,
  screenshots, responsive layout, and distributable-module smoke tests.

## Delivery order

Slider reference: Bubble Card commit `91a5c77ddbd563d2586368905ead6ded8b1c9fda`.
Its [button card](https://github.com/Clooos/Bubble-Card/blob/91a5c77ddbd563d2586368905ead6ded8b1c9fda/src/cards/button/create.js)
delegates to the [shared slider](https://github.com/Clooos/Bubble-Card/blob/91a5c77ddbd563d2586368905ead6ded8b1c9fda/src/components/slider/create.js),
which gates drag-time service updates on `slider_live_update` and uses a 200 ms
leading/trailing throttle. Here the same opt-in behavior uses the existing command
queue, with an immediate final submission on release and cleanup on cancellation.

1. Establish strict TypeScript, linting, formatting, build, and typed HA contracts.
2. Build shared tokens, validation, state helpers, and optimistic command handling.
3. Implement room header, scenes, individual lights, room lighting, media card.
4. Add complete fictional YAML and interactive mock preview.
5. Test conversions, capabilities, validation, synchronization, failure recovery,
   room filtering, component interactions, accessibility, and mobile layout.
6. Add HACS metadata, release artifact workflow, CI, and installation documentation.
7. Run all checks and report local evidence separately from live HA verification.

## HACS distribution

Use a public GitHub repository added to HACS as type Dashboard. Configure the
manifest filename as `ha-custom-dash.js`. Publish the bundled file as a GitHub
release asset through a manually triggered release workflow for an existing tag.
Do not publish or push during implementation. Document the resource URL
`/hacsfiles/ha-custom-dash/ha-custom-dash.js` and JavaScript module registration.
A default-store listing is not required. Verify real HACS installation and upgrade
before claiming them tested.

## Future architecture

Reserve hero, room summary, and contextual activity cards for a later milestone.
Home overview should use a small configurable illustration, indoor/outdoor
readings and weather, active appliances, favorites, and rooms grouped by floor.
Humidity belongs in room headers only. Do not add a dedicated Lights tab.
Use shared tokens/helpers without building speculative domain abstractions.

## Verification limits

Local browser tests use a mock `hass` object and cannot verify Home Assistant
runtime integration, real services, real themes, or HACS installation. Test those
against an actual instance before describing the first release as live verified.
