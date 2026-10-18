# ha-custom-dash

Warm, compact Home Assistant room cards built with TypeScript and Lit. The first
milestone covers a room header, scenes, explicit lighting controls, and a compact
media device. No backend, separate login, Bubble Card dependency, or automatic
entity discovery is required.

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

To upgrade, download the new release in HACS and reload the browser. If an old
version remains cached, perform a hard reload and check for duplicate resources.

### Manual installation

Run `npm ci` and `npm run build`. Copy `dist/ha-custom-dash.js` to
`<config>/www/ha-custom-dash.js` on your Home Assistant host. Add this resource
in Settings → Dashboards → Resources (advanced mode may be required):

```yaml
url: /local/ha-custom-dash.js?v=0.1.0
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
lights:
  - entity: light.example_ceiling
    name: Ceiling spots
    icon: mdi:light-recessed
  - entity: light.example_reading
    name: Reading lights
```

### Card options

Every card requires `type`. All cards accept `theme: auto` (default), `light`, or
`dark`. Auto follows `hass.themes.darkMode`. Invalid configuration throws an error
with a property path, so Home Assistant can show its standard error card.

| Card                             | Required options                    | Optional options                            |
| -------------------------------- | ----------------------------------- | ------------------------------------------- |
| `custom:home-room-header-card`   | `name`                              | `icon`, `temperature`, `humidity`, `lights` |
| `custom:home-scene-card`         | `scenes` (nonempty scene item list) | `title`                                     |
| `custom:home-light-control-card` | `entity` (`light.*`)                | `name`, `icon`                              |
| `custom:home-room-lighting-card` | `lights` (nonempty light item list) | `title`                                     |
| `custom:home-device-card`        | `entity` (`media_player.*`)         | `name`, `icon`                              |

A scene/light item has `entity`, optional `name`, and optional `icon` (an MDI name).
Labels default to entity friendly names. The header's `temperature` and `humidity`
are entity IDs; its `lights` is an explicit list of light entity IDs. Missing
readings show an em dash. Values use the entity's unit and Home Assistant locale.
Missing lights are counted as unavailable, not as off. Duplicate IDs in lists
are rejected. Header and lighting lists are independent; configure the same IDs
if their counts should match.

Media primary actions follow reported `supported_features`: turn on when off,
pause when playing, play when supported, otherwise turn off if supported. No
action is shown when the integration reports no appropriate capability. Missing,
unknown, and unavailable entities disable actions.

### Lighting behavior

- Power buttons are native 44px-minimum buttons with a pressed state. A distinct
  power icon, text state, and accent surface indicate on/off state.
- Every light has a visible native range. Off, unavailable, and non-dimmable lights
  disable it. On/off-only lights show an explanatory label.
- Brightness capability comes from `supported_color_modes`, not the current mode
  or the existence of a brightness value.
- Sliders use 1–100%; the power button handles off. Values are rounded to/from
  Home Assistant's 0–255 brightness representation.
- Dragging updates the label locally without calling Home Assistant. Release
  (`change`) commits one command; keyboard steps also commit. In-flight commands
  are serialized and newer pending values coalesce to the latest value.
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

Cards respect Home Assistant text, font, and card-surface variables where suitable.
Dark mode has explicit matching layout and palette. Set the following CSS variables
in a Home Assistant theme to customize the cards (HA theme keys omit the `--`):

| CSS token                | Light default | Dark default |
| ------------------------ | ------------- | ------------ |
| `--home-room-background` | `#F7F6F2`     | `#151917`    |
| `--home-room-surface`    | `#FFFFFF`     | `#242A27`    |
| `--home-room-secondary`  | `#EDECE7`     | `#303833`    |
| `--home-room-text`       | `#242A27`     | `#F2F4F1`    |
| `--home-room-muted`      | `#626C65`     | `#A5B0A9`    |
| `--home-room-accent`     | `#32726C`     | `#76B9AE`    |
| `--home-room-active`     | `#E2F0EC`     | `#29453F`    |

Muted text and the light accent are darker than the reference palette for contrast. The dashboard page
background remains owned by Home Assistant; these cards do not inject global CSS.
Cards use their allocated width; room lighting switches to two columns when its
container reaches 600px. All labels, controls, and focus states are inside each
card's shadow root. Motion respects `prefers-reduced-motion`.

## Architecture and scope

- `src/ha/`: typed HA contract, validation, entity helpers, command reconciliation.
- `src/ui/`: tokens and shared card lifecycle.
- `src/cards/`: five understandable domain-specific Lit cards.
- `preview/`: local mock host only; never distributed.
- `tests/`: logic/component tests and real-browser tests with mock HA state.

See [Plan.md](Plan.md) for decisions and future boundaries. Home overview, hero,
room summaries, contextual appliances, climate controls, and a strategy that
automatically assembles these cards remain future work. There is no Lights tab.

## Releasing

CI runs the checks and browser tests. To prepare a release, push an explicitly
approved version tag, then manually run the **Prepare release** workflow with that
tag. It validates, builds, and creates a **draft** GitHub release containing
`ha-custom-dash.js` and its map. Review and publish the draft for HACS users.
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
