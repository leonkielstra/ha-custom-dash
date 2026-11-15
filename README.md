# ha-custom-dash

Warm, compact Home Assistant dashboard cards built with TypeScript and Lit. The
cards use explicit entity configuration, support English and Dutch, and include
Home, room, lighting, appliance, maintenance and heat-pump views. They work with
native Lovelace layouts and do not need a backend or automatic entity discovery.

## Guides

- [Install and configure the cards](docs/project-reference.md#installation)
- [Browse the card options and dashboard examples](docs/project-reference.md#card-options)
- [Configure the visual editor](docs/visual-editor.md)
- [Build a maintenance dashboard](docs/maintenance.md)
- [Show appliance completion time](docs/appliance-completion.md)
- [Build a heat-pump dashboard](docs/heatpump.md)
- [Review design decisions](docs/design-review.md)

## Development

Use Node 22.13+ (22 LTS recommended) or Node 24+. Node 23 is not supported by
parts of the development toolchain. All tracked examples use fictional entity IDs.
Keep household entity IDs, dashboard exports and screenshots under Git-ignored
`local/`.

```sh
nvm use
npm ci
npm run dev
```

Open <http://127.0.0.1:5173> for the lighting preview. Other previews are linked
from their guides. To run checks and browser coverage:

```sh
npm run check
npx playwright install chromium
npm run test:browser
```

The preview and browser tests use mock Home Assistant state. They do not verify a
live Home Assistant installation. See [development and release details](docs/project-reference.md#development).
