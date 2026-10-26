# Recently finished appliances

The activity card can retain washing machines, dryers and dishwashers for a
configurable period after completion. The reliable source is a persisted HA
completion timestamp, not browser memory or the `last_changed` of an idle sensor.

```yaml
type: custom:home-activity-section-card
title: Appliance activity
appliances:
  - type: washer
    name: Washing machine
    entity: binary_sensor.example_washer
    active_states: ['on']
    started_at_entity: input_datetime.example_washer_started
    finished_at_entity: input_datetime.example_washer_finished
    finished_for_minutes: 60
  - type: dishwasher
    name: Dishwasher
    entity: sensor.example_dishwasher
    active_states: [run, pause, actionrequired]
    finished_at_entity: input_datetime.example_dishwasher_finished
    finished_for_minutes: 60
    finished_states: [finished, ready, inactive]
```

Optional appliance fields (also available in the visual editor):

- `finished_at_entity`: a full timestamp sensor or a date-and-time helper. For
  `input_datetime`, the absolute `timestamp` attribute takes precedence over
  parsing its local date string. Time-only/date-only helpers are not accepted.
- `finished_for_minutes`: defaults to 60; zero disables completion display.
- `finished_states`: defaults to `["off"]` for washer/dryer and
  `[finished, ready, inactive]` for dishwasher. Customize to the integration's
  actual idle states. Active, unknown, unavailable, error and aborting states
  do not silently become a successful completion.

A valid recent timestamp displays “Klaar” / “Finished”, a check icon and time
since completion. It has no running progress or remaining-time estimate.
Active states always take precedence. A minute timer expires the row (within
one timer tick), including when there are no HA state changes. It is cleaned
up on disconnect. Missing, invalid, future or expired timestamps do not
produce a completion row. Other appliance types are unaffected.

## Persisted timestamps

The [example HA package](../examples/appliance-completion-package.yaml) defines
five helpers and automations. Replace the fictional IDs and install it once
under HA's packages; it is **not** Lovelace dashboard YAML.

```yaml
homeassistant:
  packages:
    appliance_completion: !include packages/appliance-completion.yaml
```

Merge this into the existing `homeassistant`/`packages` configuration rather than
adding duplicate keys. Alternatively, merge the package into existing helper
and automation configuration or create equivalent helpers/automations in HA.
Validate configuration and restart/reload the relevant HA integrations before
using the new dashboard settings. Preserve helper IDs if they already exist.

The helpers deliberately have no `initial`: HA restores their previous values.
The automations record only an explicit `on` → `off` activity transition for
washer/dryer, or `run`/`pause`/`actionrequired` → `finished` for dishwasher. They
clear the previous timestamp when a new cycle starts, using an expired year-2000
sentinel. Thus an old completed cycle cannot reappear when a new cycle stops.
The card never writes helpers or calls services while rendering.

Binary activity sensors indicate activity ending; they cannot distinguish a
completed cycle from a manual cancellation that also changes `on` to `off`.
Dishwasher errors/abortions are not recorded as completion. Transitions missed
while HA is shut down cannot be reconstructed by this package. An existing
completed timestamp survives normal restarts and can be read by every browser.
A normal idle state or an `unavailable` → idle reconnection does not create one.

### Runtime across Home Assistant restarts

For washer/dryer runtime, configure `started_at_entity` as
`input_datetime.example_washer_started` / `input_datetime.example_dryer_started`.
The package records these on explicit `off` → `on` transitions. They have no
`initial`, so their saved values survive normal HA restarts. An `unknown` or
`unavailable` → `on` restoration/reconnection does not overwrite the start.
Every browser reads the same saved timestamp, independent of sensor
`last_changed`. Each observed new cycle replaces the timestamp.

Without `started_at_entity`, runtime still uses the sensor's `last_changed`,
which can reset on restart. Missing/invalid configured start helpers hide timing
rather than falling back to this unreliable timestamp. Installing the package
mid-cycle cannot recover the original start; for that first cycle, set the
date-and-time helper to the known start manually, or wait for the next observed
`off` → `on` transition. A cycle that finishes and restarts entirely while HA is
offline cannot be distinguished from one continuous run by these binary sensors.

See HA's [date/time helper](https://www.home-assistant.io/integrations/input_datetime/),
[state trigger](https://www.home-assistant.io/docs/automation/trigger/) and
[package](https://www.home-assistant.io/docs/configuration/packages/) documentation.
The package has been checked structurally, not executed on a live HA instance.

## Always-visible room details

Use the same activity card in a room view with `show_inactive: true`:

```yaml
type: custom:home-activity-section-card
title: Appliances
show_inactive: true
hide_when_empty: false
appliances:
  - type: washer
    name: Washing machine
    entity: binary_sensor.example_washer
    active_states: ['on']
    finished_at_entity: input_datetime.example_washer_finished
    finished_for_minutes: 60
```

`show_inactive` defaults to false, preserving the contextual Home screen.
`hide_when_empty: false` alone only keeps the section visible; `show_inactive`
keeps each configured appliance row visible. It is also a checkbox in the visual
editor. An expired completion becomes “Not active” / “Niet actief” in a room,
while it disappears from the default Home activity list.

Idle rows have no stale progress, elapsed runtime or remaining-time estimate.
An oven can still display its separately measured current temperature. Unknown,
unavailable, fault, stopping, ready and delayed-start states have distinct
localized labels; missing or unrecognized states are never called inactive.
Active rows and valid recent-completion rows retain their existing behavior.
