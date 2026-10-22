# Maintenance dashboard

`custom:home-maintenance-card` presents actionable messages, then compact
battery, supply, backup, update and device groups. It uses the existing room
palette, responsive container layout, native entity details and Dutch/English UI.
The desktop layout has actions on the left and grouped readings on the right;
mobile stacks them. There are no service calls, automatic updates or global CSS.

```yaml
type: custom:home-maintenance-card
items:
  - entity: sensor.example_hall_battery
    name: Hall motion sensor
    action: Replace the hall sensor battery
    kind: level
    category: batteries
    room: Hall
    threshold: 25
    critical_threshold: 10
  - entity: binary_sensor.example_leak
    name: Laundry leak sensor
    action: Check the laundry room for water
    kind: state
    category: devices
    severity: urgent
    problem_states: ['on']
    healthy_states: ['off']
    normal_text: No water detected
  - entity: sensor.example_last_successful_backup
    name: Last successful backup
    action: Check automatic backups
    kind: stale
    max_age_hours: 48
  - entity: update.example_firmware
    name: Sensor firmware
    action: Review the sensor update
    kind: update
```

`title` and `theme` (`auto`, `light`, `dark`) are optional. `items` is an explicit
list; the card does not discover, rename, or group physical devices itself.
Each item requires `entity`, `name`, `action`, and `kind`. Optional fields:

| Field                              | Behavior                                                                             |
| ---------------------------------- | ------------------------------------------------------------------------------------ |
| `category`                         | `batteries`, `supplies`, `backups`, `updates`, `devices`; default inferred from kind |
| `room`, `icon`                     | Supporting room label and icon                                                       |
| `threshold`                        | Inclusive low percentage threshold; default 25                                       |
| `critical_threshold`               | Inclusive urgent percentage threshold; default 10, must not exceed threshold         |
| `problem_states`, `healthy_states` | Required, non-overlapping exact string mappings for `state` rules                    |
| `severity`                         | `warning` (default) or `urgent` for state, update and stale rules                    |
| `max_age_hours`                    | Timestamp age before attention is needed; default 48                                 |
| `problem_text`                     | Supporting problem description for explicit state rules                              |
| `normal_text`                      | Healthy text for explicitly mapped state rules                                       |

Percentage rules accept finite 0–100 readings with a `%` or omitted unit; they
never apply percentage thresholds to voltage. Use the `supplies` category for
ink percentages. Other consumables need confirmed explicit state mappings.
A stale rule uses a full timestamp such as the last _successful_ backup, not
the most recent attempt. Invalid or future timestamps remain unconfirmed.

The summary counts confirmed problems separately from unavailable/unmapped
readings. Unavailable never means healthy. Unknown technical enum values are
not exposed as household-facing status labels. Urgent rows come first; battery
groups show the most important/lowest readings first. Groups initially preview
two readings and provide a keyboard-accessible disclosure for the remainder.
Tapping a row opens HA's native more-info dialog; the action copy is an
instruction, not an automated repair or an acknowledgement button.

Thresholds are configuration choices, not manufacturer maintenance advice.
Fixed sensors and rechargeable phones should normally be configured separately.
Periodic servicing/reminder tasks are not inferred from these sensors.

## Local development

Open `/preview/maintenance.html` after `npm run dev`. Light/dark themes, healthy,
attention and unavailable fixtures use fictional entity IDs. The UI and rules
are covered by unit and browser tests; these fixtures do not verify a live HA
installation. All fields also have a native-selector visual editor.
