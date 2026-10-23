import { css, html, nothing } from 'lit';
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
        padding: 16px;
      }
      .schematic {
        display: grid;
        grid-template-columns: minmax(72px, 1fr) minmax(32px, 1fr) minmax(
            116px,
            1.25fr
          );
        grid-template-rows: minmax(160px, auto) auto;
        grid-template-areas: 'source paths targets' '. valve .';
        align-items: stretch;
        column-gap: 8px;
        row-gap: 4px;
      }
      .source {
        grid-area: source;
        align-self: center;
        min-width: 0;
        text-align: center;
      }
      .source ha-icon {
        width: 48px;
        height: 48px;
        --mdc-icon-size: 48px;
        color: var(--room-muted);
        margin-bottom: 6px;
      }
      .source strong {
        display: block;
        font-size: 16px;
        margin-top: 6px;
      }
      .meta {
        font-size: 11px;
        color: var(--room-muted);
      }
      .paths {
        grid-area: paths;
        position: relative;
      }
      .valve-label {
        grid-area: valve;
        text-align: center;
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
        opacity: 0.4;
      }
      .running {
        stroke: var(--room-accent);
        opacity: 1;
        stroke-dasharray: none;
      }
      .hot {
        stroke: var(--room-sand);
        opacity: 1;
        stroke-dasharray: none;
      }
      .targets {
        grid-area: targets;
        display: grid;
        /* Row centers match the SVG branches at 25% and 75% height. */
        grid-template-rows: repeat(2, minmax(80px, 1fr));
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
        font-size: 13px;
        font-weight: 500;
      }
      .target ha-icon {
        width: 40px;
        height: 40px;
        --mdc-icon-size: 40px;
        justify-self: center;
        align-self: center;
      }
      .target.active {
        color: var(--room-accent);
      }
      .target.hot-water {
        color: var(--room-sand);
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
      .unconfirmed {
        margin-top: 8px;
        font-size: 12px;
        color: var(--room-muted);
      }
      @container (max-width: 370px) {
        .readings {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .source strong {
          font-size: 14px;
        }
        .target {
          gap: 4px;
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
    const heating = status.purpose === 'heating';
    const water = status.purpose === 'hot_water';
    const readings = [
      [c.supply_temperature, text.supply],
      [c.return_temperature, text.return],
      [c.temperature_difference, text.difference],
      [c.pressure, text.pressure],
    ].filter((item): item is [string, string] => !!item[0]);
    return html`<ha-card
      ><h3>${c.title ?? text.destination}</h3>
      <div class="schematic" aria-label=${text[status.purpose]}>
        <div class="source">
          <ha-icon
            .icon=${'mdi:heat-pump-outline'}
            aria-hidden="true"
          ></ha-icon>
          <p class="meta">${text.pump}</p>
          <strong
            >${metricValue(this.hass, { entity: c.entity, precision: 2 })}</strong
          >
          <p class="meta">${this.strings.heatOutput}</p>
          ${c.electric_power ? html`<p class="meta">${metricValue(this.hass, { entity: c.electric_power, precision: 2 })} ${text.electricity}</p>` : nothing}
        </div>
        <div class="paths">
          <svg
            viewBox="0 0 160 160"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path class=${status.active ? 'running' : ''} d="M0 80H65"></path>
            <path
              class=${`branch ${heating ? 'running' : ''}`}
              d="M95 80H110V40H160m-8-5 8 5-8 5"
            ></path>
            <path
              class=${`branch ${water ? 'hot' : ''}`}
              d="M95 80H110V120H160m-8-5 8 5-8 5"
            ></path>
            <path d="m65 69 30 22V69L65 91Z"></path>
            <circle cx="80" cy="80" r="5"></circle>
          </svg>
        </div>
        <div class="targets">
          <div class=${`target ${heating ? 'active' : ''}`}>
            <ha-icon .icon=${'mdi:radiator'} aria-hidden="true"></ha-icon>
            <div>
              <strong>${text.home}</strong
              ><span class="meta"
                >${heating ? this.strings.on : water || status.purpose === 'standby' ? text.inactive : text.unconfirmed}</span
              >
            </div>
          </div>
          <div class=${`target ${water ? 'hot-water' : ''}`}>
            <ha-icon .icon=${'mdi:water-boiler'} aria-hidden="true"></ha-icon>
            <div>
              <strong>${text.water}</strong
              ><span class="meta"
                >${c.water_temperature ? metricValue(this.hass, { entity: c.water_temperature }) : water ? this.strings.on : text.inactive}</span
              >${c.water_target ? html`<p class="meta">${text.target} ${metricValue(this.hass, { entity: c.water_target })}</p>` : nothing}
            </div>
          </div>
        </div>
        <span class="meta valve-label">${text.valve}</span>
      </div>
      ${status.purpose === 'unknown' || status.purpose === 'active' ? html`<p class="unconfirmed">${text.unconfirmed}</p>` : nothing}
      ${readings.length ? html`<div class="readings">${readings.map(([entity, name]) => html`<p class="reading">${name}<strong>${metricValue(this.hass, { entity })}</strong></p>`)}</div>` : nothing}
    </ha-card>`;
  }
}
