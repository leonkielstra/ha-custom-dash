// The host normally provides ha-icon. This tiny SVG stand-in exists ONLY here.
const paths: Record<string, string> = {
  'mdi:check-circle-outline': 'M3 12a9 9 0 1 0 18 0 9 9 0 1 0-18 0m5 0 3 3 6-7',
  'mdi:wrench-outline':
    'm14 3 2 4 5-1a6 6 0 0 1-8 7L5 21l-3-3 8-8a6 6 0 0 1 4-7Z',
  'mdi:battery-outline': 'M8 3h8v2h3v17H5V5h3ZM8 9h8m-8 4h8m-8 4h8',
  'mdi:alert-outline': 'M12 3 1 21h22ZM12 9v5m0 3v1',
  'mdi:help-circle-outline':
    'M3 12a9 9 0 1 0 18 0 9 9 0 1 0-18 0M9 9c0-4 7-3 6 0-1 2-3 1-3 4m0 3v1',
  'mdi:cloud-check-outline':
    'M7 19H5a4 4 0 0 1-1-8 6 6 0 0 1 11-4 5 5 0 0 1 6 8m-11 3 3 3 6-7',
  'mdi:update': 'M21 8a9 9 0 1 0 0 8m0-14v6h-6M12 7v6l4 2',
  'mdi:devices': 'M2 3h15v12H2Zm5 16h6M19 8h4v14h-4Z',
  'mdi:package-variant-closed':
    'm3 6 9-4 9 4v12l-9 4-9-4Zm0 0 9 4 9-4m-9 4v12M7 4l10 5',
  'mdi:radiator': 'M4 5h3v14H4Zm6 0h3v14h-3Zm6 0h3v14h-3M1 9h3m15 6h3',
  'mdi:water-boiler': 'M7 3h10v18H7ZM10 3V1m4 2V1M10 8h4m-4 4h4m-4 4h4',
  'mdi:access-point':
    'M10 12a2 2 0 1 0 4 0 2 2 0 1 0-4 0M7 7a7 7 0 0 0 0 10m10-10a7 7 0 0 1 0 10M4 4a11 11 0 0 0 0 16M20 4a11 11 0 0 1 0 16',
  'mdi:alert-circle-outline':
    'M12 3a9 9 0 1 0 0 18 9 9 0 1 0 0-18M12 7v6m0 3v1',
  'mdi:home-thermometer-outline':
    'M2 11 10 3l8 8M4 9v12h8m3-8V8a2 2 0 0 1 4 0v7a4 4 0 1 1-4 0',
  'mdi:weather-partly-cloudy':
    'M5 7V3m-3 7H0m8-6 2-2M3 5 1 3M4 12a5 5 0 1 1 9-5M7 20a4 4 0 1 1 1-8 5 5 0 0 1 9-1 4 4 0 1 1 2 9Z',
  'mdi:water-thermometer':
    'M8 2c-1 4-6 7-6 12a6 6 0 0 0 10 4m4-5V5a2 2 0 0 1 4 0v8a4 4 0 1 1-4 0',
  'mdi:heat-pump-outline': 'M3 3h18v18H3ZM7 7h10v10H7ZM12 7v10M7 12h10',
  'mdi:heating-coil':
    'M7 3c-6 5 6 7 0 12s0 6 0 6m5-18c-6 5 6 7 0 12s0 6 0 6m5-18c-6 5 6 7 0 12s0 6 0 6',
  'mdi:chevron-right': 'm9 5 7 7-7 7',
  'mdi:home-outline': 'M3 11 12 3l9 8v10h-6v-7H9v7H3Z',
  'mdi:countertop-outline': 'M2 10h20M3 10v11h18V10M6 8V4h5v4M8 10v11m8-11v11',
  'mdi:door-open': 'M4 3h12v18H4ZM16 5l5 3v13h-5M12 12h1',
  'mdi:coat-rack': 'M12 2v20M5 6v5l7 4 7-4V6M5 22h14',
  'mdi:stairs': 'M2 20h6v-6h6V8h6V2',
  'mdi:desk': 'M2 8h20M4 8v13m16-13v13M15 8v8h5M5 4h9v4',
  'mdi:bed-outline': 'M3 12h18v9M3 4v17m0-5h18M7 8h6v4H7Zm6-1h7v5',
  'mdi:shower': 'M3 5h8l4 5m-5-3 6-4m-1 10v2m5-4v2m-9 0v2m5 3v2m5-3v2',
  'mdi:home-roof': 'M2 12 12 3l10 9M5 10v11h14V10',
  'mdi:flower-outline':
    'M12 10c-8-10-13 3-4 4-6 8 8 12 7 3 11 1 5-14-3-7Zm0 4v8m0-4 6 1',
  'mdi:car-outline':
    'M4 11 6 4h12l2 7M3 11h18v8H3ZM5 15h2m10 0h2M5 19v3m14-3v3',
  'mdi:washing-machine':
    'M4 2h16v20H4ZM4 7h16M7 4h1m3 0h6M7 14a5 5 0 1 0 10 0 5 5 0 1 0-10 0m0 0c4 4 6-3 10 0',
  'mdi:tumble-dryer':
    'M4 2h16v20H4ZM4 7h16M7 4h1m3 0h6M7 14a5 5 0 1 0 10 0 5 5 0 1 0-10 0M10 12l4 4m0-4-4 4',
  'mdi:stove': 'M4 2h16v20H4ZM4 7h16M7 4h1m3 0h1m4 0h1M7 11h10v7H7Z',
  'mdi:dishwasher': 'M4 2h16v20H4ZM4 7h16M7 4h1m3 0h6M8 10v8m4-8v8m4-8v8',
  'mdi:sofa-outline':
    'M4 11V6h6v6h4V6h6v5M3 10H1v9h22v-9h-3v5H4zM4 19v3m16-3v3',
  'mdi:book-open-page-variant-outline':
    'M12 5C8 2 4 3 2 4v15c4-2 7-1 10 1 3-2 6-3 10-1V4c-4-2-7-1-10 1Zm0 0v15',
  'mdi:weather-night': 'M20 15A9 9 0 0 1 9 4a9 9 0 1 0 11 11Z',
  'mdi:movie-open-outline': 'M3 10h18v11H3zM3 8l17-5-1-3L2 5zM7 4l3 3m4-5 3 3',
  'mdi:power': 'M12 2v10M6 5a9 9 0 1 0 12 0',
  'mdi:power-standby': 'M12 2v10M6 5a9 9 0 1 0 12 0',
  'mdi:lightbulb-outline': 'M9 18h6m-6 3h6M8 14a7 7 0 1 1 8 0l-1 2H9Z',
  'mdi:light-recessed': 'M3 8a9 5 0 1 0 18 0 9 5 0 1 0-18 0m4 1a5 2 0 1 0 10 0',
  'mdi:floor-lamp': 'M8 3h8l3 9H5Zm4 9v9m-5 0h10',
  'mdi:television': 'M2 4h20v14H2Zm6 18h8m-4-4v4',
  'mdi:play': 'M7 3v18l14-9Z',
  'mdi:pause': 'M6 3v18m12-18v18',
};
class PreviewIcon extends HTMLElement {
  private value = '';
  set icon(value: string) {
    this.value = value;
    this.draw();
  }
  connectedCallback() {
    this.draw();
  }
  private draw() {
    const root = this.shadowRoot ?? this.attachShadow({ mode: 'open' });
    root.innerHTML = `<style>:host{display:inline-flex;width:24px;height:24px}svg{width:100%;height:100%}</style><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="${paths[this.value] ?? paths['mdi:lightbulb-outline']}"/></svg>`;
  }
}
if (!customElements.get('ha-icon'))
  customElements.define('ha-icon', PreviewIcon);
