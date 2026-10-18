import { css, html, nothing } from 'lit';
import { BaseCard } from '../ui/base-card';
import { headerConfig } from '../ha/config';
import { available, sensorValue } from '../ha/entities';
import type { HeaderConfig } from '../ha/types';
export class RoomHeaderCard extends BaseCard<HeaderConfig> {
  static styles = [
    BaseCard.styles,
    css`
      ha-card {
        padding: 20px;
        display: flex;
        gap: 16px;
        align-items: center;
      }
      .icon-box {
        width: 56px;
        height: 56px;
        flex-basis: 56px;
        color: var(--room-accent);
        background: var(--room-active);
      }
      .readings {
        display: flex;
        flex-wrap: wrap;
        gap: 4px 8px;
        margin: 4px 0;
        color: var(--room-muted);
      }
      .summary {
        font-size: 13px;
      }
      .count {
        color: var(--room-accent);
        font-weight: 650;
      }
      h2 {
        overflow-wrap: anywhere;
      }
      .content {
        min-width: 0;
      }
    `,
  ];
  setConfig(value: unknown) {
    this.config = headerConfig(value);
  }
  protected entityIds() {
    return [
      this.config?.temperature,
      this.config?.humidity,
      ...(this.config?.lights ?? []),
    ].filter((v): v is string => !!v);
  }
  protected render() {
    if (!this.config) return nothing;
    const c = this.config;
    const lights = c.lights ?? [];
    const count = lights.filter(
      (id) => this.hass?.states[id]?.state === 'on',
    ).length;
    const unavailable = lights.filter(
      (id) => !available(this.hass?.states[id]),
    ).length;
    const text = this.strings;
    return html`<ha-card>
      <div class="icon-box">
        <ha-icon
          .icon=${c.icon ?? 'mdi:sofa-outline'}
          aria-hidden="true"
        ></ha-icon>
      </div>
      <div class="content">
        <h2>${c.name}</h2>
        <p class="readings">
          ${c.temperature ? html`<span aria-label=${text.temperature}>${sensorValue(this.hass, c.temperature, '°C')}</span>` : nothing}
          ${c.temperature && c.humidity ? html`<span aria-hidden="true">·</span>` : nothing}
          ${c.humidity ? html`<span>${sensorValue(this.hass, c.humidity, '%')} ${text.humidity}</span>` : nothing}
        </p>
        ${lights.length ? html`<p class="summary">${text.roomLightsOn(count)}${unavailable ? html`<span class="muted"> · ${text.unavailableShort(unavailable)}</span>` : nothing}</p>` : nothing}
      </div>
    </ha-card>`;
  }
}
