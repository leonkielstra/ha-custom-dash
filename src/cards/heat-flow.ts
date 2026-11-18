import { css, html, nothing, svg } from 'lit';
import { BaseCard } from '../ui/base-card';
import { heatPumpCardConfig } from '../ha/heat-pump-config';
import { heatPumpStatus, metricValue } from '../ha/heat-pump';
import type { HeatPumpCardConfig } from '../ha/types';

export class HeatFlowCard extends BaseCard<HeatPumpCardConfig> {
  static readonly editorType = 'home-heat-flow-card' as const;
  static styles = [
    BaseCard.styles,
    css`
      :host {
        container-type: inline-size;
      }
      ha-card {
        padding: clamp(12px, 4cqi, 24px);
        border-radius: 22px;
      }
      .schematic {
        display: grid;
        grid-template-columns:
          clamp(72px, 19cqi, 110px) minmax(32px, 1fr)
          minmax(116px, 33%);
        max-width: 560px;
        margin-inline: auto;
        grid-template-rows: minmax(clamp(128px, 28cqi, 156px), auto);
        grid-template-areas: 'source paths targets';
        align-items: stretch;
        column-gap: 8px;
        row-gap: 4px;
      }
      .source {
        grid-area: source;
        align-self: stretch;
        position: relative;
        display: grid;
        grid-template-rows: repeat(2, 1fr);
        min-width: 0;
        text-align: center;
      }
      .source ha-icon {
        width: clamp(48px, 11cqi, 60px);
        height: clamp(48px, 11cqi, 60px);
        --mdc-icon-size: clamp(48px, 11cqi, 60px);
        color: var(--room-muted);
      }
      .defrost .source ha-icon,
      .fault .source ha-icon {
        color: var(--state-color);
      }
      .source-label {
        grid-row: 2;
        align-self: start;
        padding-top: calc(clamp(48px, 11cqi, 60px) / 2 + 4px);
      }
      .source p {
        overflow-wrap: anywhere;
      }
      .source .source-state {
        color: var(--state-color);
      }
      .source-icon {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        display: flex;
      }
      .source-icon .steam {
        position: absolute;
        bottom: 100%;
        left: 50%;
        translate: -50% 4px;
        width: 24px;
        height: 20px;
        --mdc-icon-size: 20px;
      }
      .meta {
        font-size: clamp(12px, 2.8cqi, 15px);
        color: var(--room-muted);
      }
      .paths {
        grid-area: paths;
        position: relative;
      }
      svg {
        display: block;
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        overflow: visible;
      }
      path,
      circle {
        fill: none;
        stroke: var(--room-muted);
        stroke-width: 2;
        vector-effect: non-scaling-stroke;
      }
      .branch {
        stroke-dasharray: 4 4;
        opacity: 0.8;
      }
      .running {
        stroke: var(--room-accent);
        opacity: 1;
        stroke-dasharray: none;
      }
      .hot {
        stroke: var(--room-accent);
        opacity: 1;
        stroke-dasharray: none;
      }
      .targets {
        grid-area: targets;
        display: grid;
        /* Row centers match the SVG branches at 25% and 75% height. */
        grid-template-rows: repeat(2, minmax(64px, 1fr));
      }
      .target {
        display: grid;
        grid-template-columns: 40px minmax(0, 1fr);
        align-items: center;
        gap: 8px;
        min-width: 0;
        color: var(--room-muted);
      }
      .target > div {
        min-width: 0;
        overflow-wrap: anywhere;
      }
      .target strong {
        display: block;
        font-size: clamp(13px, 3.25cqi, 18px);
        font-weight: 500;
        color: var(--room-text);
      }
      .target ha-icon {
        display: block;
        width: 40px;
        height: 40px;
        --mdc-icon-size: 40px;
        justify-self: center;
        align-self: center;
      }
      .target.active,
      .target.hot-water,
      .target.active strong,
      .target.hot-water strong {
        color: var(--room-accent);
      }
      .state {
        display: flex;
        align-items: center;
        gap: clamp(10px, 4cqi, 18px);
        margin-bottom: 8px;
      }
      .state ha-icon {
        display: grid;
        place-items: center;
        flex: none;
        width: clamp(42px, 13cqi, 64px);
        height: clamp(42px, 13cqi, 64px);
        --mdc-icon-size: clamp(24px, 7cqi, 36px);
        border-radius: 14px;
        color: var(--state-color, var(--room-muted));
        background: color-mix(in srgb, currentColor 30%, transparent);
      }
      .state h3 {
        font-size: clamp(16px, 5cqi, 25px);
        line-height: 1.15;
      }
      .state p {
        color: var(--room-muted);
        font-size: clamp(12px, 3.5cqi, 18px);
        margin-top: 4px;
      }
      .heating,
      .hot_water {
        --state-color: var(--room-accent);
      }
      .defrost,
      .auxiliary_active {
        --state-color: var(--room-sand);
      }
      .fault {
        --state-color: var(--room-error);
      }
      .fault-details {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        align-items: center;
        border-top: 1px solid var(--room-border);
      }
      .fault-details button {
        min-height: 44px;
        font: inherit;
        color: inherit;
        background: none;
        border: 0;
        cursor: pointer;
      }
      details {
        color: var(--room-muted);
        font-size: 12px;
      }
      summary {
        cursor: pointer;
        width: fit-content;
      }
      .readings {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 8px;
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid var(--room-border);
      }
      .reading {
        font-size: 11px;
        color: var(--room-muted);
      }
      .reading strong {
        display: block;
        font-size: 14px;
        color: var(--room-text);
        font-weight: 550;
        margin-top: 3px;
      }
      @container (max-width: 420px) {
        .schematic {
          grid-template-columns: minmax(86px, 22%) minmax(24px, 1fr) minmax(
              138px,
              35%
            );
          column-gap: 6px;
        }
        .source-label {
          font-size: 13px;
        }
        .target {
          gap: 4px;
        }
        .state {
          align-items: start;
        }
        .state h3 {
          text-wrap: balance;
        }
      }
      @container (max-width: 370px) {
        .readings {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }
    `,
  ];
  setConfig(value: unknown) {
    this.config = heatPumpCardConfig(value);
  }
  protected entityIds() {
    return Object.values(this.config ?? {}).filter(
      (v): v is string =>
        typeof v === 'string' && /^[a-z_]+\.[a-z0-9_]+$/.test(v),
    );
  }
  protected render() {
    if (!this.config) return nothing;
    const c = this.config;
    const status = heatPumpStatus(this.hass, c);
    const text = this.strings.heatPump;
    const heating = status.activity?.state === 'heat_pump_heating';
    const water = status.activity?.state === 'heat_pump_hot_water';
    const icon = {
      heating: 'mdi:fire',
      hot_water: 'mdi:water',
      standby: 'mdi:pause',
      defrost: 'mdi:snowflake',
      auxiliary_active: 'mdi:lightning-bolt',
      fault: 'mdi:alert-outline',
      offline: 'mdi:cloud-off-outline',
      locked: 'mdi:lock',
      unknown: 'mdi:help-circle-outline',
      active: 'mdi:heat-pump-outline',
    }[status.purpose];
    const descriptions = {
      heating: text.descHeating,
      hot_water: text.descWater,
      standby: text.descStandby,
      defrost: text.descDefrost,
      auxiliary_active: text.descAuxiliary,
      fault: text.descFault,
      offline: text.descOffline,
      unknown: text.unconfirmed,
      active: text.unconfirmed,
      locked: text.locked,
    };
    const headings: Partial<Record<typeof status.purpose, string>> = {
      hot_water: text.flowHotWater,
      fault: text.flowFault,
      offline: text.flowOffline,
    };
    const heading = headings[status.purpose] ?? text[status.purpose];
    const defrost = status.purpose === 'defrost';
    const fault = status.purpose === 'fault';
    const unknownRoute = !heating && !water && status.purpose !== 'standby';
    const inactive = unknownRoute ? '—' : this.strings.off;
    const readings = [
      [c.entity, this.strings.heatOutput],
      [c.electric_power, text.electricity],
      [c.water_temperature, text.water],
      [c.water_target, text.target],
      [c.supply_temperature, text.supply],
      [c.return_temperature, text.return],
      [c.temperature_difference, text.difference],
      [c.pressure, text.pressure],
    ].filter((item): item is [string, string] => !!item[0]);
    return html`<ha-card class=${status.purpose}>
      <div class="state">
        <ha-icon .icon=${icon} aria-hidden="true"></ha-icon>
        <div>
          ${c.title ? html`<p class="meta">${c.title}</p>` : nothing}
          <h3>${heading}</h3>
          <p>${descriptions[status.purpose]}</p>
        </div>
      </div>
      <div class="schematic">
        <div class="source">
          <div class="source-icon">
            ${defrost ? html`<ha-icon class="steam" .icon=${'mdi:heating-coil'} aria-hidden="true"></ha-icon>` : nothing}
            <ha-icon
              .icon=${'mdi:heat-pump-outline'}
              aria-hidden="true"
            ></ha-icon>
          </div>
          <div class="source-label">
            <p>${text.pump}</p>
            ${defrost || fault ? html`<p class="source-state">${defrost ? text.defrostShort : text.faultShort}</p>` : nothing}
          </div>
        </div>
        <div class="paths">
          <svg
            viewBox="0 0 160 160"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              class=${heating ? 'running' : water ? '' : 'branch'}
              d="M0 80H65"
            ></path>
            ${svg`<path
                      class=${`branch ${heating ? 'running' : ''}`}
                      d="M95 80H110V40H160m-8-5 8 5-8 5"
                    ></path>
                    <path
                      class=${`branch ${water ? 'hot' : ''}`}
                      d="M95 80H110V120H160m-8-5 8 5-8 5"
                    ></path> `}
            <path d="m65 69 30 22V69L65 91Z"></path>
            <circle cx="80" cy="80" r="5"></circle>
          </svg>
        </div>
        <div class="targets">
          ${html`
            <div class=${`target ${heating ? 'active' : ''}`}>
              <ha-icon .icon=${'mdi:home-outline'} aria-hidden="true"></ha-icon>
              <div>
                <strong>${text.home}</strong
                ><span class="meta"
                  >${heating ? this.strings.on : inactive}</span
                >
              </div>
            </div>
            <div class=${`target ${water ? 'hot-water' : ''}`}>
              <ha-icon .icon=${'mdi:water-boiler'} aria-hidden="true"></ha-icon>
              <div>
                <strong>${text.water}</strong
                ><span class="meta">${water ? this.strings.on : inactive}</span>
              </div>
            </div>
          `}
        </div>
      </div>
      ${status.auxiliary === 'on' ? html`<p class="meta">${text.auxiliary}: ${this.strings.on}</p>` : nothing}
      ${fault ? html`<div class="fault-details"><span>${text.faultCode}: ${c.fault_code ? metricValue(this.hass, { entity: c.fault_code }) : '—'}</span><button @click=${() => this.dispatchEvent(new CustomEvent('hass-more-info', { bubbles: true, composed: true, detail: { entityId: c.fault_code ?? c.fault_entity } }))}>${text.details} ›</button></div>` : nothing}
      ${
        readings.length
          ? html`<details>
              <summary>${text.readings}</summary>
              <div class="readings">
                ${readings.map(([entity, name]) => html`<p class="reading">${name}<strong>${metricValue(this.hass, { entity, precision: entity === c.entity || entity === c.electric_power ? 2 : undefined })}</strong></p>`)}
              </div>
            </details>`
          : nothing
      }
    </ha-card>`;
  }
}
