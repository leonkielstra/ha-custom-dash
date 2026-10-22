# Home Assistant component requirements

- Preserve the existing TypeScript/Lit architecture, explicit YAML configuration,
  design tokens, Dutch/English localization, and public/private configuration boundary.
- Every new configurable custom card, badge, or other Lovelace element must ship
  with a simple visual editor. Expose a typed `getConfigForm()` schema and useful
  picker defaults. Use the shared editor adapter where nested lists, dictionaries,
  or child-card delegation need more than the native form. Do not ship YAML-only options.
- Existing cards extend `BaseCard` and declare `static readonly editorType`; add
  new types, form fields and stubs under `src/editor/`. Newly added options must
  be editable without typing YAML and must preserve existing saved configuration.
- Never use a raw object/YAML selector as a substitute for a visual editor of
  structured lists. Preserve unknown fields, native visibility/layout settings,
  item order, optional clears, and inherited per-item settings on every edit.
- Extend the editor contract tests whenever a new element or option is added.
  Verify valid picker defaults, complete schemas, editor change events, nested
  configuration preservation, and Dutch/English labels. The registration test
  must cover every registered card; do not bypass it for new components.
- Run relevant checks and browser coverage. Distinguish local fixture verification
  from testing inside a live Home Assistant frontend.
- Keep real household entity IDs, exports, dashboard YAML and screenshots under
  Git-ignored `local/`. Use fictional identifiers in tracked files.
