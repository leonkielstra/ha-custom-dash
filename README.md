# ha-custom-dash

Warm, compact Home Assistant cards built with TypeScript and Lit: a Home overview,
room summaries, contextual appliances, scenes, explicit lighting controls, and
media. Use regular Lovelace views, Sections, headings, and grids for layout.
No backend, separate login, Bubble Card dependency, or automatic entity discovery
is required.

## Visual editor

All 15 cards support Home Assistant’s visual editor and picker, including lists,
metric state labels, and section child cards. YAML remains supported. See the
[visual editor guide](docs/visual-editor.md); preview it locally at `/preview/editor.html`.
Visual editing is required for every new configurable element.

## Maintenance and recently finished appliances

The [maintenance card](docs/maintenance.md) provides actionable messages with
battery, supply, backup, update and device groups. Preview it at
`/preview/maintenance.html`. All rules are explicitly configured and visually
editable; missing readings are never treated as healthy.

The activity card can retain “Finished” for an hour, cleared by a new cycle.
See [completion setup](docs/appliance-completion.md) and the example HA helper
package for persisted, cross-browser completion timestamps.

## Heat-pump dashboard

The reusable heat-pump cards add operating status, a heat-routing schematic,
compact metric groups, and connection summaries. See [the configuration guide](docs/heatpump.md)
and [complete fictional dashboard YAML](examples/heatpump.yaml). The five-view
preview is available at `/preview/heatpump.html`; chart traces there are illustrative.

## Development

Use Node 22.13+ (22 LTS recommended) or Node 24+ and npm. Node 23 is not supported
by parts of the development toolchain. All entities in examples and tests are
fictional; do not commit personal entity IDs, device names, or locations.

```sh
nvm use
npm ci
npm run dev
```

Open <http://127.0.0.1:5173>. The local preview shows both themes, on/off lights,
different brightness levels, a long name, an unavailable light, an on/off-only
light, and a media device. Choose Phone or Wide layout, simulate an external
state change, or fail the next action. Mock service calls are shown below the
cards. The preview does not connect to Home Assistant or request credentials.
Its SVG icon stand-in is not included in the installed bundle; Home Assistant
provides the real icons.

Open <http://127.0.0.1:5173/preview/home.html> for the Home overview. Choose day/idle,
night/washer, multiple appliances, unavailable entities, or rooms without lighting.
The daylight control works independently of theme (including day in dark mode
and night in light mode). Both previews support English and Dutch. Home fixtures
mirror the twelve-room configuration structure with fictional entity IDs. Its SVG
house illustrations are preview assets; configure your own production images.
Select a single theme to see the desktop summary/navigation composition at full
width; the side-by-side theme comparison keeps each preview compact.
For comparison with `images/mockup-1.png`, open `/?reference=1` for the five-light
room composition or `/preview/home.html?reference=1` for washer/oven activity.
These use the same production components, with fictional preview entities.

Open <http://127.0.0.1:5173/preview/sections.html> to check desktop/mobile section
placement. This mock host applies section spans and each card's `getGridOptions()`
to reproduce width allocation. It is not the full Home Assistant frontend.
The Phone/Wide selector in the original preview only changes its container width;
it does not configure the installed Lovelace view.

```sh
npm run check             # TypeScript, ESLint, formatting, unit tests, production build
npx playwright install chromium
npm run test:browser      # Build first; tests load dist/ha-custom-dash.js
```

Browser tests save screenshots under `test-results/` (ignored by Git). The build
produces one ES module at `dist/ha-custom-dash.js`, including Lit, and a source map.
Runtime dependencies do not require separate resource registration.

## Installation

### HACS custom repository

The repository must be public and have a published GitHub release containing the
built `ha-custom-dash.js` asset. HACS installation has not yet been tested against
a real Home Assistant instance.

1. Open HACS → Custom repositories.
2. Add this repository's GitHub URL, selecting **Dashboard** as its type.
3. Find **Home Room Cards**, download it, and reload the browser.
4. Verify a JavaScript module resource exists at
   `/hacsfiles/ha-custom-dash/ha-custom-dash.js`. Add it under dashboard resources
   if your installation mode does not register it automatically. Avoid duplicates.
5. Configure the cards in your existing dashboard using the example below.

For matching page backgrounds and native cards, install the companion
[Home Room theme](examples/home-room-theme.yaml) and select it in your HA profile.
The theme YAML is also attached to GitHub releases for download.
`ha-card-border-radius` is the shared outer-card radius (16px in Home Room).
The theme binds Bubble Card's standard and pop-up radii to this value, and the
custom cards respect the same token. Change it once in the theme rather than
adding radius overrides to individual cards.
For example, with `frontend: themes: !include_dir_merge_named themes` configured,
copy the file to `<config>/themes/home-room.yaml`, reload themes, and select
**Home Room**. Both light and dark modes are included. This aligns native heading
sizes, section gaps and surfaces through HA theme variables, without card-mod.

### Responsive dashboard layout

Use the updated [complete dashboard](examples/dashboard.yaml),
[Home view](examples/home.yaml), or [living room view](examples/living-room.yaml).
Home uses a summary section on the left and one room-navigation section spanning
two columns on the right. All floor headings and two-column room grids stay inside
that navigation section, so lower floors cannot move below the hero. Native
headings and room grids explicitly use `grid_options: { columns: full }` to fill
the widened section. Keep dense placement disabled to preserve reading order.
The summary retains hero → relevant activity → favorite scenes, followed by rooms
on mobile. Wider room shortcuts show larger labels and right-aligned temperatures;
narrow cards keep their compact stacked metadata.

Home allows three section columns. Room views allow two, and sections containing
lighting span both columns. Home Assistant reduces section spans on mobile.
The theme's 430px limit applies to each column, not to the entire desktop view.

Increasing `max_columns` alone does not widen a single section. For example:

```yaml
type: sections
max_columns: 2
sections:
  - type: grid
    column_span: 2
    cards:
      - type: custom:home-room-lighting-card
        lights:
          - entity: light.example_ceiling
```

Summary and control cards fill their section by default, including widened
sections. Room shortcuts retain their half-section defaults. HA's `grid_options`
can override card sizing explicitly. Lighting uses two internal columns once its
available content width reaches 600px. Keep room content in native sections rather
than one outer vertical stack, which prevents independent layout placement.
Existing dashboards need these YAML layout changes; updating the JavaScript
resource alone does not rewrite dashboard configuration.

To upgrade, download the new release in HACS and reload the browser. If an old
version remains cached, perform a hard reload and check for duplicate resources.

### Manual installation

Run `npm ci` and `npm run build`. Copy `dist/ha-custom-dash.js` to
`<config>/www/ha-custom-dash.js` on your Home Assistant host. Add this resource
in Settings → Dashboards → Resources (advanced mode may be required):

```yaml
url: /local/ha-custom-dash.js?v=0.8.4
type: module
```

Change the version query when replacing the file, then reload the browser.
For YAML-managed resources, add the same entry under `lovelace.resources` in
Home Assistant configuration. Use either the HACS or manual resource URL.

## Example room

[examples/living-room.yaml](examples/living-room.yaml) contains a complete dashboard
with a room view. Copy its view into an existing dashboard or use it as a new
manual dashboard. Replace all `example_*` entities with your own. The custom
cards accept YAML through Home Assistant's manual card editor; there is no visual
configuration editor in this milestone.

```yaml
type: custom:home-room-lighting-card
title: Lighting
slider_live_update: true
lights:
  - entity: light.example_ceiling
    name: Ceiling spots
    icon: mdi:light-recessed
  - entity: light.example_reading
    name: Reading lights
    slider_live_update: false # This light commits only on release.
```

### Card options

Every card requires `type`. All cards accept `theme: auto` (default), `light`, or
`dark`. Auto follows `hass.themes.darkMode`. Invalid configuration throws an error
with a property path, so Home Assistant can show its standard error card.

| Card                                | Required options                                                               | Optional options                                                 |
| ----------------------------------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------- |
| `custom:home-room-header-card`      | —                                                                              | `name`, `show_name`, `icon`, `temperature`, `humidity`, `lights` |
| `custom:home-scene-card`            | `scenes` (nonempty scene item list)                                            | `title`                                                          |
| `custom:home-light-control-card`    | `entity` (`light.*`)                                                           | `name`, `icon`, `slider_live_update`                             |
| `custom:home-room-lighting-card`    | `lights` (nonempty light item list)                                            | `title`, `slider_live_update`                                    |
| `custom:home-device-card`           | `entity` (`media_player.*`)                                                    | `name`, `icon`                                                   |
| `custom:home-climate-card`          | `entity` (`climate.*`)                                                         | `name`, `icon`                                                   |
| `custom:home-section-card`          | `title`, `cards` (nonempty card list)                                          | —                                                                |
| `custom:home-hero-card`             | `temperature`, `outdoor_temperature`, `sun_entity`, `image_day`, `image_night` | `weather`                                                        |
| `custom:home-room-card`             | `name`                                                                         | `icon`, `navigation_path`, `temperature`, `lights`, `icon_tone`  |
| `custom:home-activity-section-card` | `appliances` (list)                                                            | `title`, `hide_when_empty` (default `true`)                      |

Use `home-section-card` to give native or custom Lovelace cards the same
section heading style as Scenes and Lighting. It creates its configured child
cards through Home Assistant's `loadCardHelpers()` API and forwards `hass` state
updates to each child. For example:

```yaml
type: custom:home-section-card
title: Media
cards:
  - type: media-control
    entity: media_player.example_display
  - type: custom:bubble-card
    card_type: button
    entity: fan.example
```

A scene/light item has `entity`, optional `name`, and optional `icon` (an MDI name).
Light items also accept `slider_live_update` to override the room card's setting.
Labels default to entity friendly names. The header's `temperature` and `humidity`
are entity IDs; its `lights` is an explicit list of light entity IDs. Missing
readings show an em dash. Values use the entity's unit and Home Assistant locale.
The room title is hidden by default to avoid repeating the dashboard navigation
title. Set `name` and `show_name: true` when the header is used outside a room view.
Missing lights are counted as unavailable, not as off. Duplicate IDs in header
and lighting lists are rejected. Header and lighting lists are independent; configure the same IDs
if their counts should match.

Built-in card labels, accessibility text, common device states, and action
feedback follow the Home Assistant language when it is English or Dutch, with
English as the fallback. Names, titles, and scene labels explicitly supplied in
dashboard YAML are shown as configured. The preview includes a language selector
for both supported translations.

Media primary actions follow reported `supported_features`: turn on when off,
pause when playing, play when supported, otherwise turn off if supported. No
action is shown when the integration reports no appropriate capability. Missing,
unknown, and unavailable entities disable actions.

The climate summary matches the mockup's compact row. It reads a configured
thermostat's mode and current temperature, using HA's temperature unit, and opens
HA's native more-info controls on click/keyboard activation. It does not issue
thermostat commands itself:

```yaml
type: custom:home-section-card
title: Klimaat
cards:
  - type: custom:home-climate-card
    entity: climate.example_heating
    name: Vloerverwarming
```

Light, media and climate icons prefer an explicit YAML `icon`, then the entity's
reported icon, then a neutral fallback. Native media-control/fan cards remain
supported inside `home-section-card` when you prefer their full native controls.

### Home overview

[examples/home.yaml](examples/home.yaml) is a complete Home Sections view with
native headings and two-column grids for all twelve room shortcuts. Insert its
Home view first in your existing dashboard and replace the fictional entities.
Only configure views you have implemented as actual dashboard views; the example
preserves future navigation targets without generating room views or a strategy.
Keep personal dashboard YAML and entity exports in the Git-ignored `local/` folder.

[examples/dashboard.yaml](examples/dashboard.yaml) provides a complete alternative:
Home plus all twelve room views, using subviews and the existing reusable cards.
Set the dashboard URL to `/dashboard-home` or adjust the navigation prefixes.
The Home shortcut and room detail share the same explicit light/temperature IDs.
Rooms without configured controls get an empty-state message. Add scenes, media,
fan or climate sections only when you have confirmed entities for those rooms.

The hero requires two temperature entity IDs, a `sun_entity`, and two image paths:

```yaml
type: custom:home-hero-card
temperature: sensor.example_indoor_temperature
outdoor_temperature: sensor.example_outdoor_temperature
sun_entity: sun.sun
image_day: /local/images/dashboard/home-day.png
image_night: /local/images/dashboard/home-night.png
```

Copy the illustrations to `<config>/www/images/dashboard/` on your HA host.
The illustration follows `above_horizon`/`below_horizon`, independently of theme;
an unavailable sun retains the last valid selection, initially day. Failed images
show a house icon. Temperature formatting uses the entity's actual unit and HA
language; missing/invalid values show `—`. Optional `weather: weather.example`
adds a translated condition beneath the outdoor reading; the original schema
still works without it. The illustration still follows only sun state. Humidity
is not part of the hero. A native heading badge can show weather in the HA header
instead; see [heading badges](https://www.home-assistant.io/dashboards/heading/).

Room cards require only `name`. Optional `icon`, `temperature`, and `lights` add
context. `navigation_path` accepts an internal path starting with `/`, using
client-side navigation and normal link keyboard behavior. Without it, the card
is an informational surface. Each configured light is counted once (duplicate
IDs are deduplicated); groups are never expanded or discovered. Missing, unknown,
and unavailable lights are reported separately. A room never reports lights off
while an unknown light remains. Omitted or empty lists omit lighting status.
Cards use a horizontal icon/content layout with temperature below lighting status.
At very narrow widths, the visible count shortens to e.g. `2 aan`; its full status
remains accessible. Icon panels use restrained category tones inferred from common
configured icons. Override with `icon_tone: teal`, `sand`, `blue`, `violet`, or
`neutral`. Card surfaces never change color with lighting state.
Sections defaults allocate half a section to each room card; use native
`type: grid`, `columns: 2`, `square: false` as in the supplied example if nesting.

Appliance items support these properties:

| Property                          | Meaning                                                                                                                                    |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `type`                            | Required: `washer`, `dryer`, `oven`, `dishwasher`, or `heat_pump`                                                                          |
| `name`, `entity`, `active_states` | Required label, state entity, and nonempty string list of active states; heat pumps use thermal power as `entity` and omit `active_states` |
| `icon`, `room`                    | Optional icon and location label                                                                                                           |
| `reference_duration_minutes`      | Optional positive reference duration for washer/dryer elapsed-time indication                                                              |
| `started_at_entity`               | Optional date-and-time helper or timestamp state for washer/dryer start                                                                    |
| `current_temperature`             | Optional temperature sensor, using its reported unit                                                                                       |
| `progress`                        | Optional actual program percentage sensor; only values from 0–100 are accepted                                                             |
| `end_time`                        | Optional full program-end timestamp sensor for remaining time                                                                              |

Activity compares states exactly with `active_states`, preserves appliance order,
and always excludes `unknown`/`unavailable`. `run`, `pause`, and `actionrequired`
have translated status labels. Rows are read-only and make no service calls.
The entire card hides when empty, including its heading and Sections grid slot.
It notifies HA of visibility changes and remains connected to receive states.
Set `hide_when_empty: false` to show an empty-state message instead.

Washer/dryer bars are labeled **Tijdsindicatie / Time indication**: elapsed time
relative to a reference duration, clamped at 100%. They do not assert cycle
completion or remaining time. A valid `started_at_entity` takes priority. Without
one, `last_changed` is approximate and elapsed text is marked indicative because
HA restarts/restoration can reset that timestamp. A configured but invalid start
helper does not silently fall back. Time-only/date-only helpers are insufficient.
`input_datetime`'s absolute timestamp attribute is preferred; bare date-time state
strings without a timezone use the browser's local timezone. Use a full timestamp
with timezone or a date-and-time helper when reliable timing matters.

Oven/dishwasher bars use actual configured progress only; temperature never
substitutes for program progress. Remaining time uses a valid future `end_time`;
invalid/past dates and unavailable progress are omitted. No target temperature is
invented. One timer updates visible timed activity each minute, with cleanup when
idle or disconnected. No helpers or automations are needed for the initial view.

### Heat-pump activity

Add a `heat_pump` item to the existing activity section. The configured `entity`
must report **thermal output**, with `W` or `kW` units. Electrical consumption,
enabled operating modes, and circulation pumps do not establish heat production.
The row appears only when reported thermal output exceeds `minimum_heat_output`
(optional, in kW, default `0`). Zero, negative, missing, invalid, or unavailable
output hides the row. Unsupported or absent units also hide it.

```yaml
- type: heat_pump
  name: Warmtepomp
  entity: sensor.example_heat_output
  mode_entity: sensor.example_heat_pump_valve
  hot_water_states:
    - domesticHotWater
  heating_states:
    - climateCircuitOne
  operating_entity: sensor.example_heat_pump_operation
  operating_states:
    - heating
  fan_speed: sensor.example_heat_pump_fan_speed
```

`mode_entity` is required. `hot_water_states` and `heating_states` are optional
lists of exact, case-sensitive valve states; both default to empty and must not
overlap. Configure values reported by your integration. A hot-water match displays
“Warm water wordt opgewarmd”; a heating match displays “Woning wordt verwarmd”.
An unrecognized, unavailable, or missing valve state displays “Warmtepomp actief”
while thermal output is positive. English equivalents follow HA's language setting.
The reported output appears alongside the status. No progress or remaining time
is inferred, and no helpers, automations, or service calls are needed.
Optional `fan_speed` shows the fan's reported percentage as a small secondary
detail while active. Missing, unavailable, invalid, or out-of-range percentages
are omitted, as are sensors reporting units other than `%` (an absent unit uses `%`).

This is a summary of the integration's latest reported output and valve position,
not an independent measurement of compressor activity. Optional `operating_entity`
and its nonempty `operating_states` list add a second activity check: if configured,
only a matching available operating state permits the row to appear. This suppresses
activity during standby even if the last reported output is still positive. Unknown,
unavailable, missing, and unlisted operating states also suppress the row. Configure
only states verified on your installation; cooling is not inferred from a heating
circuit valve position. A retained valve position
alone never shows an activity. The Home preview includes separate hot-water and
space-heating scenarios, with fictional entity IDs.

### Lighting behavior

- Power buttons are native 44px-minimum buttons with a pressed state. A distinct
  power icon, text state, and accent surface indicate on/off state.
- Every light has a visible native range. Off, unavailable, and non-dimmable lights
  disable it. On/off-only lights show an explanatory label.
- Brightness capability comes from `supported_color_modes`, not the current mode
  or the existence of a brightness value.
- Sliders use 1–100%; the power button handles off. Values are rounded to/from
  Home Assistant's 0–255 brightness representation.
- By default, dragging updates the label locally and release (`change`) commits
  one command; keyboard steps also commit. Set `slider_live_update: true` to
  update brightness while dragging, with at most one submission every 200 ms
  during a drag. Release flushes the final value immediately. The option defaults
  to `false` on individual and room lighting cards; explicit per-light values
  override the room setting. In-flight commands are serialized and newer pending
  values coalesce to the latest value.
- Cancellation, loss of focus, reconfiguration, and disconnect discard unsent
  drag values. Already submitted changes remain applied. Turning a light off or
  losing brightness support also cancels unsent updates.
- Optimistic values remain until a matching reported state arrives (with 1%
  brightness rounding tolerance). Stale updates cannot snap a drag back. Service
  failure or timeout restores the reported state and shows an inline error.
- Room All on/All off targets only configured, available lights. Partial
  availability is shown; unavailable entities are skipped. The room does not
  infer other entities from an area or device. Individual rows follow the reported
  states after a room command rather than assuming every light succeeded.
- Scene feedback confirms the activation request, not that every affected device
  reached its scene target. Scenes are actions, not persistent selected modes.

### Theme tokens

Cards use explicit warm-neutral/charcoal defaults and a system font so unrelated
HA card colors or fonts do not change the mockup's appearance. Their theme mode
follows HA; explicit `home-room-*` overrides customize the design. Set these variables
in a Home Assistant theme to customize the cards (HA theme keys omit the `--`):

| CSS token                  | Light default | Dark default |
| -------------------------- | ------------- | ------------ |
| `--home-room-background`   | `#F7F5EF`     | `#141414`    |
| `--home-room-surface`      | `#FFFDF8`     | `#242424`    |
| `--home-room-secondary`    | `#EEECE6`     | `#353535`    |
| `--home-room-text`         | `#242A27`     | `#F2F2F2`    |
| `--home-room-muted`        | `#69716C`     | `#A8A8A8`    |
| `--home-room-accent`       | `#397F79`     | `#76B9AE`    |
| `--home-room-active`       | `#E2F0EC`     | `#29453F`    |
| `--home-room-control`      | `#397F79`     | `#397F79`    |
| `--home-room-hero-surface` | `#FAECD8`     | `#242424`    |

The same token family includes `sand`, `blue`, `violet` and their `*-surface`
counterparts for small icon panels, plus `home-room-font-family` for an explicit
font override. Section headings use 16px, standard labels 14px, metadata 12px,
and compact room/activity summaries 11–13px. Icons and controls have intentional
larger touch areas than their visible marks.

The dark active token is reserved for small interactive or icon treatments; card
surfaces remain neutral charcoal. The dashboard page background remains owned by
Home Assistant; these cards do not inject global CSS.
Cards use their allocated width; room lighting switches to two columns when its
container reaches 600px. All labels, controls, and focus states are inside each
card's shadow root. Motion respects `prefers-reduced-motion`.

## Architecture and scope

- `src/ha/`: typed HA contract, validation, entity/activity helpers, command reconciliation.
- `src/ui/`: tokens and shared card lifecycle.
- `src/cards/`: domain-specific Lit cards, including Home and reusable sections.
- `preview/`: local mock host only; never distributed.
- `tests/`: logic/component tests and real-browser tests with mock HA state.

See [Plan.md](Plan.md) and [the visual audit](docs/design-review.md) for decisions
and component coverage. Appliance target temperatures remain future work. HA owns
dashboard navigation, the top bar, native media/fan cards and thermostat details;
the custom cards supply the content shown in the mockup. There is no Lights tab
or dashboard strategy.

## Releasing

CI runs the checks and browser tests. To prepare a release, push an explicitly
approved version tag, then manually run the **Prepare release** workflow with that
tag. It validates, builds, and creates a **draft** GitHub release containing
`ha-custom-dash.js`, its map, and the companion theme YAML. Review and publish
the draft for HACS users.
The local build folder is ignored; release assets are the installation source.
No release is published automatically by a source change.

## Verification status

The preview and automated browser tests use mock state and service calls. They
can verify component behavior and the browser bundle, but cannot establish that
real Home Assistant service calls or HACS installation work. Live Home Assistant,
real-device behavior, and a HACS install/upgrade remain to be verified. Do not
enter a Home Assistant access token into the preview.

References: [custom card contract](https://developers.home-assistant.io/docs/frontend/custom-ui/custom-card/),
[light services](https://www.home-assistant.io/integrations/light/),
[HACS dashboard packaging](https://www.hacs.dev/docs/publish/plugin/).
