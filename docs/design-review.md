# Mockup fidelity and component coverage

Reference: `images/mockup-1.png`. Compare at equal content width; the four phone
renders in the image are scaled, not literal CSS-pixel measurements.

| Element             | v0.4.0 discrepancy                                                                 | Refinement                                                                                                    |
| ------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Typography          | Broad use of semibold; large room labels; inherited HA font can change proportions | System font, restrained weights, 16px section titles, 13–14px labels, 11–12px metadata                        |
| Home room shortcuts | 124px vertical tiles with temperature above the name                               | Horizontal icon/content layout, approximately 88–96px, status and temperature beneath name                    |
| Hero                | Equally prominent temperatures, weak indoor hierarchy                              | Large indoor reading, separated compact outdoor reading, contained illustration                               |
| Appliance rows      | Values and timing stacked; reference text adds height                              | Name/status on left, actual temperature/time on right, integrated progress; keep indicative timing honest     |
| Room header         | 19px temperature shares a line with humidity; small icon                           | Prominent temperature, humidity and count below, tall calm icon treatment                                     |
| Lights              | Separate 32px slider row and short icon container                                  | Cohesive 88px grid, taller icon treatment, slightly fuller track, small pale thumb                            |
| Scenes              | Teal icons and 68px buttons                                                        | Neutral 28px icons, 80px shortcuts, lighter label weight                                                      |
| Surfaces            | Pure white plus arbitrary inherited HA card colors                                 | Warm off-white light surfaces; explicit neutral charcoal dark surfaces; active tint limited to icons/controls |
| Climate             | Mockup section absent                                                              | Reusable compact climate summary opening HA's native more-info controls                                       |

Preserve all existing YAML APIs, slider/service logic, unavailable-state handling,
Dutch/English localization, and explicit light lists. Optional icon tones/weather
are additive. Do not copy the mockup's invented remaining wash time or green card
fills: keep the previously agreed truthful timing and neutral dark surfaces.

Use native Lovelace Sections/grids and view/subview routing. Supply a companion
HA theme for page/native-card defaults without injecting CSS into HA internals.
Create remaining private room views only from the explicitly supplied temperature
and light lists. Keep existing Home/Woonkamer configuration intact; do not infer
climate/media bindings from device names or add fake entities to private YAML.

Home and room screenshots must be checked at 390px in both themes and at 320px;
check tablet/desktop, keyboard navigation, long labels, unavailable states and
all existing lighting interactions. Mock preview evidence is not a live HA test.

## Component and view coverage

All ten content components are registered: `home-room-header-card`,
`home-scene-card`, `home-light-control-card`, `home-room-lighting-card`,
`home-device-card`, `home-section-card`, `home-hero-card`, `home-room-card`,
`home-activity-section-card`, and `home-climate-card`. The scene API and existing
room configuration remain compatible. Weather conditions are an optional hero
field; a native HA heading badge can also display a confirmed weather entity.

`examples/dashboard.yaml` contains Home and twelve room views. The private
`local/dashboards/dashboard.yaml` preserves existing Home/Woonkamer views and adds missing
room subviews from the confirmed draft. No thermostat entity was supplied, so
climate is demonstrated with a fictional public fixture rather than a private
binding. Existing native media/fan choices are preserved.

The photograph-like house artwork and filled MDI glyphs in the mockup differ
from preview SVG stand-ins. Production uses the configured image paths and HA
icons. HA owns its top bar and navigation, including the original illustration's
app chrome; no fictitious Kamers/Meer views or decorative navigation chevrons are
created. Runtime native-card layout and real assets still need an HA check.

The responsive short lighting count keeps the full status accessible. Reference
wash/dry timing stays visibly indicative. Toggle thumbs remain pale in both
modes, and unavailable lights continue to occupy their configured room lists.

## Verification

The final implementation passes typecheck, lint, formatting, build, 52 unit tests
and 14 browser tests. Browser comparisons cover 390px in both themes, 320px dark,
and tablet/desktop layouts, plus long labels and unavailable entities. Reference
screenshots are saved under ignored `test-results/design-*.png` and inspected.
At the 390px reference width: hero 156px, room shortcuts 88px, lighting rows 88px,
room summary 108px, scene shortcuts 80px, and appliance rows 84px.

The supplied private draft, expanded private dashboard and full public example
are accepted by the built custom-card validators. Both complete dashboards have
Home plus twelve room views, and all configured room paths resolve. Private room
entity lists, including unavailable lights, are preserved. Native HA media/fan
configuration and the real PNG assets require live-host verification.
