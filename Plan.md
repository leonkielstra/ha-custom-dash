# Implementation plan

## Current milestone: reusable room cards and Home overview

Build a functioning living room and Home overview with TypeScript, Lit, and Vite.
The current product brief supersedes the earlier Bubble Card generation proposal:
these are independent custom cards placed in an existing Home Assistant dashboard.
Keep Home Assistant responsible for state, authentication, services, and layout.
HACS custom-repository installation remains a requirement.

## Decisions

- Ship one bundled ES module, `dist/ha-custom-dash.js`, with Lit included.
- Register room header, scenes, individual light, room lighting, media device,
  reusable section, Home hero, room shortcut, appliance activity, and climate summary cards.
  Room lighting composes the same individual light component.
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

## Home overview milestone

Implement three independent cards in a regular Lovelace Sections view, with
native heading/grid cards for floors and two-column room layout. Keep Woonkamer
unchanged. The supplied private Home view is the configuration contract; preserve
all entity IDs and future navigation targets under ignored `local/` only.

- Hero: configured day/night images follow sun state independently of theme,
  retain the last valid selection, and reuse localized sensor formatting.
- Room: accessible client navigation, optional temperature and explicit lights,
  deduplicated counts, and unknown states distinguished from lights that are off.
- Activity: read-only contextual rows, actual progress/end times for programs,
  explicitly indicative reference-duration progress for washer/dryer. Optional
  reliable start entity takes precedence over approximate `last_changed`.
- One per-card clock while timed activity is visible; clean up on disconnect/idle.
  Notify HA of visibility changes and keep the hidden card connected for updates.
- Extend the framework-free preview with Home scenarios and fictional entities;
  validate the supplied private configuration separately. Reuse existing tokens,
  scene component, build, and test tools without adding runtime dependencies.

## Future architecture

Appliance target temperatures remain optional future work.
Humidity belongs in room headers only. Do not add a dedicated Lights tab.
Use shared tokens/helpers without building speculative domain abstractions.

## Mockup fidelity and complete views

See [docs/design-review.md](docs/design-review.md) for the visual audit and coverage.
Use horizontal room shortcuts, right-aligned appliance metrics, a dominant indoor
temperature, neutral scene icons, and cohesive compact lighting rows. Keep heading
spacing inside reusable section components so it works in native Lovelace grids.
The companion HA theme aligns page/native-card colors without DOM overrides.

The climate summary opens HA's native controls. Hero weather is optional and
localized; neither requires a binding in the existing Home schema. Icon tones are
optional appearance overrides. All prior schemas and light interactions remain.
Ship a full public example with Home and twelve room views using fictional IDs.
Private missing room views use only the explicit confirmed temperature/light
lists; existing views are preserved, with no invented climate/media bindings.

## Responsive Sections correction

Use native Sections for room views as well as Home. Allow three columns on Home
and two on room views; lighting sections span two columns and collapse on mobile.
Keep the 430px theme limit per column. Summary/control cards request `columns:
full`, since a fixed twelve cells occupies only half of a two-column section.
Room shortcuts retain six cells. Group the private fan popup with its trigger
inside the same native section so it cannot reserve a separate view column.
Keep the popup in its own native card slot so it can hide that slot independently.
The Sections fixture preview exercises card metadata and section spans, alongside
the existing isolated component previews. It does not replace live HA verification.

## Verification limits

Local browser tests use a mock `hass` object and cannot verify Home Assistant
runtime integration, real services, real themes, or HACS installation. Test those
against an actual instance before describing the first release as live verified.
