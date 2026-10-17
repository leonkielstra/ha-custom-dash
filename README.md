# ha-custom-dash

A dependency-free Home Assistant dashboard strategy that automatically generates
a Lovelace configuration from your entities.

## Installation

1. Copy `ha-custom-dash.js` into your Home Assistant `/config/www/` directory.
   If you just created `www`, restart Home Assistant.
2. Under **Settings → Dashboards → Resources** (enable advanced mode in your
   profile if needed), add `/local/ha-custom-dash.js` as a **JavaScript module**.
3. Create a dashboard and replace its configuration using the raw configuration
   editor with:

   ```yaml
   strategy:
     type: custom:ha-custom-dash
   ```

For YAML-managed resources, register the module in `configuration.yaml` instead:

```yaml
lovelace:
  resources:
    - url: /local/ha-custom-dash.js
      type: module
```

## Behavior

The strategy creates a Home view containing an entities card for each entity
domain (for example, lights, sensors, and switches). Cards and entities are
sorted by entity ID. Hidden entities and entities categorized as configuration
or diagnostic are excluded when entity registry metadata is available.
Unavailable entities remain visible so you can see their status. An empty
dashboard displays a message instead.

Optionally override the view title:

```yaml
strategy:
  type: custom:ha-custom-dash
  title: My home
```

The module uses only built-in Home Assistant cards and browser APIs; no package
installation or build step is required.
