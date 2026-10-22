# Heat-pump dashboard

The heat-pump cards extend the existing room-card library and share its neutral
surfaces, system typography, teal accents, and light/dark theme handling. All
entities are explicitly configured. Cards make no service calls and do not add
settings that the integration cannot change.

Open `/preview/heatpump.html` with `npm run dev` for the five-view preview. The
preview uses fictional entities and illustrative chart traces. In Home Assistant,
the YAML uses ApexCharts Card and native history/statistics cards for real data. Native
[screen conditions](https://www.home-assistant.io/dashboards/conditional/#screen)
place the comfort chart appropriately at each viewport size.
The preview deliberately does not embed a copy of HA or ApexCharts. It verifies
our components and approximate Sections geometry, not those external cards.

Use [examples/heatpump.yaml](../examples/heatpump.yaml) as a complete fictional
configuration. The private household configuration is in ignored `local/`.
Load the updated `ha-custom-dash.js`, retain your existing ApexCharts resource,
and select the **Home Room** theme for matching native card surfaces. No Bubble
Card dependency is needed for this dashboard.

## Layout

- **Overzicht:** operating status, comfort, today's totals, connections, heat
  routing, and 24-hour trends. At desktop widths the summary occupies one section
  column and trends occupy two. Mobile places the comfort chart after today’s metrics, before connection and
  technical detail. Native screen conditions keep one comfort chart visible
  across the two arrangements. The 24-hour circuit chart lives in Afstelling.
- **Afstelling:** read-only heating-curve values, current comfort, seven-day
  comfort/deviation graphs, 72-hour circuit history, compressor cycling and RPM.
- **Warmwater:** storage temperature and target, hygiene status, 48-hour history,
  and hot-water energy/efficiency readings.
- **Energie:** daily input/output, cooling and yearly totals, fixed-tariff costs,
  14/30-day statistics and rolling seven-day efficiency.
- **Diagnose:** connectivity and fetch timestamps, lockouts, compressor/inverter,
  pumps, valve, pressure, refrigerant-side temperatures and room-controller data.

The configuration preserves the original 77 distinct sensor/binary-sensor
references. It consolidates duplicate comfort history and replaces the original
popups with persistent detail views. Unknown values remain unknown; absent
statistics are not converted to zero.

## Operating status and heat routing

Both `custom:home-heat-pump-status-card` and `custom:home-heat-flow-card` use:

```yaml
type: custom:home-heat-pump-status-card
entity: sensor.example_heat_output
mode_entity: sensor.example_valve
operating_entity: sensor.example_operation
operating_states: [heating]
heating_states: [climateCircuitOne]
hot_water_states: [domesticHotWater]
compressor: binary_sensor.example_compressor
fan_speed: sensor.example_fan_speed
electric_power: sensor.example_electric_power
outdoor_temperature: sensor.example_outdoor_temperature
auxiliary_heating: binary_sensor.example_auxiliary_heating
controller_online: binary_sensor.example_controller_online
outdoor_online: binary_sensor.example_outdoor_online
fault_entity: binary_sensor.example_fault
external_lock: binary_sensor.example_external_lock
```

Required: `entity` (thermal output, W or kW), `mode_entity`, `operating_entity`,
and a nonempty `operating_states` list. The two valve-state lists default to empty
and may not overlap. `minimum_heat_output` optionally sets an exclusive minimum in
kW (default 0). Other fields are optional; `theme` accepts auto/light/dark.

The status card explains space heating, water heating, standby, an unconfirmed
purpose, connection loss, or a lockout. Fault/external lock/offline states take
priority over a normal activity. Standby never highlights a heat route, even if
an earlier positive power reading remains. When configured, the compressor must
report on (or auxiliary heating on) before active routing is shown. Unknown
compressor or operating states do not confirm a heat route.

The flow card adds optional `title`, `supply_temperature`, `return_temperature`,
`temperature_difference`, `pressure`, `water_temperature`, and `water_target`.
It draws a responsive schematic, not a physical installation diagram. Only a
confirmed valve branch is highlighted; cooling and defrost are not inferred.
Current reported readings remain available even in standby. They are not
attributed to the active route as independently measured branch energy.

Status wording follows HA's English/Dutch language setting. Fan speed is a valid
0–100 percentage, omitted when unavailable or invalid. Both cards use reported
states and make no polling or service calls.

## Metric groups

```yaml
type: custom:home-metric-card
layout: grid
columns: 2
items:
  - entity: sensor.example_indoor_temperature
    name: Binnen
    icon: mdi:home-thermometer-outline
    secondary_entity: sensor.example_target_temperature
    secondary_name: Gewenst
  - entity: sensor.example_compressor_hours_today
    name: Compressor vandaag
    format: duration_hours
```

Required: nonempty `items`, each with `entity` and `name`. Optional card fields:
`title`, `theme`, `layout` (grid/panel/strip/list; default grid), `columns` (1–4; default
2). Items also accept `icon`, `secondary_entity`, `secondary_name`, `precision`
(0–3 fixed decimal places), `format`, `state_labels`, and `navigation_path`.

`format` accepts number/state/duration_hours/timestamp. The default detects
numeric states and preserves the entity's unit. `duration_hours` expects hours;
minute sensors should use the normal number format. Timestamp formatting displays
a local clock time; full source values remain available in metric tooltips and
native more-info dialogs. Known diagnostic states are translated; other vendor
states remain visible for diagnosis. Explicit `state_labels` override wording.

`panel` groups a compact value-first grid in one surface; `grid` uses separate
surfaces, `strip` uses one compact row, and `list` uses labeled rows.

Metrics open native HA more-info on click/keyboard activation. An internal
`navigation_path` instead creates a real link with client-side navigation;
modified clicks retain normal browser behavior. Long labels wrap, values never
push controls beyond the card, and touch targets stay at least 44px high.

## Connection summary

```yaml
type: custom:home-system-health-card
items:
  - name: Systeemcontroller
    entity: binary_sensor.example_controller_online
    updated: sensor.example_controller_fetched
```

Required: `items` with `name` and connectivity `entity`. Optional: `title`, `theme`,
and each item's `icon` and `updated` timestamp entity. Connection states are
explicitly online/offline/unavailable. An unknown state never gets an online dot.
Fetch timestamps are labeled as cloud fetches, not original measurement times or
a guarantee that every displayed measurement is recent. No extra timer is used.

## Charts and data meaning

Production chart definitions keep the supplied time ranges, averaging/last-value
aggregation, series and units. The modulation chart uses a separate kW axis for
electrical power instead of incorrectly labeling it watts. The deviation chart's
zero annotation uses `y: 0`. Chart backgrounds follow the existing theme.
[ApexCharts Card documents these configuration options](https://github.com/RomRider/apexcharts-card).

Efficiency is heat divided by electricity over the same period; it is not an
instantaneous COP. Rolling seven-day samples are not daily efficiency values.
Daily bars require valid long-term statistics and correct counter-reset handling.
The dashboard does not create helpers, fabricate missing history, estimate tank
heating time, or diagnose excessive cycling from an invented threshold.
