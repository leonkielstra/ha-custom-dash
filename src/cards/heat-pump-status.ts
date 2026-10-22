import { css, html, nothing } from 'lit';
import { BaseCard } from '../ui/base-card';
import { heatPumpCardConfig } from '../ha/heat-pump-config';
import { heatPumpStatus, metricValue } from '../ha/heat-pump';
import type { HeatPumpCardConfig } from '../ha/types';

export class HeatPumpStatusCard extends BaseCard<HeatPumpCardConfig> {
  static styles = [
    BaseCard.styles,
    css`
      ha-card {
        padding: 16px;
      }
      .summary {
        display: grid;
        grid-template-columns: 44px minmax(0, 1fr) auto;
        gap: 4px 12px;
        align-items: center;
      }
      .icon-box {
        grid-row: 1 / 3;
        width: 44px;
        height: 52px;
        background: var(--room-secondary);
        color: var(--room-muted);
      }
      .active .icon-box {
        background: var(--room-active);
        color: var(--room-accent);
      }
      .warning .icon-box {
        background: var(--room-sand-surface);
        color: var(--room-sand);
      }
      h3 {
        grid-column: 2;
        grid-row: 1;
        font-size: 15px;
        line-height: 1.35;
      }
      .description {
        grid-column: 2 / 4;
        grid-row: 2;
        font-size: 12px;
        color: var(--room-muted);
      }
      .metric {
        grid-column: 3;
        grid-row: 1;
        text-align: end;
        font-size: 18px;
        font-weight: 600;
        white-space: nowrap;
      }
      .metric small {
        display: block;
        color: var(--room-muted);
        font-size: 11px;
        font-weight: 400;
      }
      .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 12px;
      }
      .chip {
        padding: 5px 8px;
        border-radius: 8px;
        background: var(--room-secondary);
        color: var(--room-muted);
        font-size: 12px;
      }
      .chip.on {
        color: var(--room-sand);
      }
      .content {
        display: contents;
      }
      @container (max-width: 340px) {
        .summary {
          gap: 4px 8px;
          grid-template-columns: 36px minmax(0, 1fr) auto;
        }
        .metric {
          font-size: 16px;
        }
      }
      :host {
        container-type: inline-size;
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
    const compressor =
      status.compressor === 'on'
        ? text.compressorActive
        : status.compressor === 'off'
          ? text.compressorOff
          : text.compressorUnknown;
    const warning = ['fault', 'locked', 'offline'].includes(status.purpose);
    return html`<ha-card
      class=${warning ? 'warning' : status.active ? 'active' : ''}
    >
      <div class="summary">
        <span class="icon-box"
          ><ha-icon
            .icon=${warning ? 'mdi:alert-circle-outline' : 'mdi:heat-pump-outline'}
            aria-hidden="true"
          ></ha-icon
        ></span>
        <div class="content">
          <h3>${text[status.purpose]}</h3>
          <p class="description">
            ${compressor}${status.active && status.activity?.fanSpeed !== undefined ? html` · ${text.fan} ${metricValue(this.hass, { entity: c.fan_speed!, precision: 0 })}` : nothing}
          </p>
        </div>
        ${status.active ? html`<p class="metric">${metricValue(this.hass, { entity: c.entity, precision: 2 })}<small>${text.heat}</small></p>` : nothing}
      </div>
      ${
        c.outdoor_temperature || c.auxiliary_heating
          ? html`<div class="chips">
              ${c.outdoor_temperature ? html`<span class="chip">${text.outside} ${metricValue(this.hass, { entity: c.outdoor_temperature })}</span>` : nothing}
              ${c.auxiliary_heating ? html`<span class=${`chip ${status.auxiliary === 'on' ? 'on' : ''}`}>${text.auxiliary} ${status.auxiliary === 'on' ? this.strings.onLower : status.auxiliary === 'off' ? this.strings.offLower : this.strings.unavailable}</span>` : nothing}
            </div>`
          : nothing
      }
    </ha-card>`;
  }
}
