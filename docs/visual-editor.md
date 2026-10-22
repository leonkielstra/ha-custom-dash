# Visual card configuration

All 15 registered cards support Home Assistant's simple visual editor and card
picker. Existing YAML configurations continue to work with the same schema.
Load the updated bundle, choose a community card in **Add card**, and configure
it through entity pickers, text fields, dropdowns and repeatable lists.

The visual editor supports:

- Entity, icon, title/name, navigation, light/dark appearance and sensor fields.
- Adding, editing, removing and reordering scenes, lights, appliances and
  connection rows using native structured object selectors.
- Metric items, including secondary readings, formats, precision and arbitrary
  reported-state/display-label mappings.
- Section child cards through Home Assistant's own card editor. Existing
  third-party configuration is preserved; a third-party card's own editor
  determines which of its fields can be edited visually.
- A **default/inherit** choice for live brightness updates. Unset values remain
  unset; a room-level default is not replaced with a false per-light override.

HA layout/visibility settings and unknown configuration fields survive edits.
Optional clears remove the field rather than saving an invalid empty string.
Zero, false and item order remain meaningful. Incomplete state-label rows stay
in the editor until valid, leaving the last valid mapping in the saved config.
The editor does not call services or save the dashboard itself; HA owns saving.

Field labels, helpers and editor controls follow the selected English/Dutch HA
language. The card's `theme` option remains auto/light/dark, not an arbitrary HA
theme name. Picker defaults suggest suitable entities only where their domain is
unambiguous. Heat-pump wiring and illustration paths must be configured explicitly.

## Implementation

Each card declares a unique `static readonly editorType` and inherits:

- `getConfigForm()` — typed native form schemas, including structured selectors.
- `getStubConfig()` — a valid initial configuration, also when no entities exist.
- `getConfigElement()` — a shared, thin adapter around native `ha-form`.

The adapter uses the same schemas, localizes them using `hass.locale.language`,
adds inheritance controls, and handles metric dictionaries and nested card
configuration. It emits complete `config-changed` events and delegates section
editing through HA's `edit-sub-element` event. It does not inspect or override
Home Assistant's DOM or styling.

The [official card-editor guide](https://contributors.home-assistant.io/frontend/custom-ui/card-editor/)
describes the form, picker, and custom-editor hooks. The nested-card event is
handled by [HA's element editor](https://github.com/home-assistant/frontend/blob/dev/src/panels/lovelace/editor/hui-element-editor.ts).

## Requirement for new components

Every new configurable Lovelace card/element must include a visual editor and
valid picker defaults. Add schemas, defaults, localization and editor regression
coverage alongside every new option. Do not use a raw YAML/object field for a
structured collection. The repository's [AGENTS.md](../AGENTS.md) records this
requirement; the registration test checks that every registered card has its own
form definition, editor and valid stub.

Tests cover round-tripping, unknown-field preservation, optional clearing,
booleans/zero, nested-card changes, list ordering and state-label editing.

## Local preview

Run `npm run dev` and open `/preview/editor.html`. Select any of the 15 cards,
edit values and inspect its live card preview. The page uses fictional entities
and a small native-form stand-in; it is not an embedded Home Assistant frontend.
Production uses the real native selectors and child-card editor.

Browser tests exercise the adapter and field event contracts with this fixture.
Those tests do not constitute verification against a live HA installation.
