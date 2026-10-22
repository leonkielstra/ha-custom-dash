import { css, html, nothing } from 'lit';
import { BaseCard } from '../ui/base-card';
import { systemHealthConfig } from '../ha/heat-pump-config';
import { metricValue } from '../ha/heat-pump';
import type { SystemHealthConfig } from '../ha/types';

export class SystemHealthCard extends BaseCard<SystemHealthConfig> {
  static styles = [
    BaseCard.styles,
    css`
      ha-card {
        padding: 16px;
      }
      h3 {
        margin-bottom: 10px;
      }
      .row {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto auto;
        gap: 12px;
        min-height: 44px;
        align-items: center;
        font-size: 12px;
      }
      .row + .row {
        border-top: 1px solid var(--room-border);
      }
      .label {
        display: flex;
        gap: 10px;
        align-items: center;
        min-width: 0;
      }
      .label span {
        overflow: hidden;
        text-overflow: ellipsis;
      }
      ha-icon {
        width: 18px;
        height: 18px;
        --mdc-icon-size: 18px;
        color: var(--room-muted);
        flex-shrink: 0;
      }
      .state {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: var(--room-muted);
      }
      .online .dot {
        background: var(--room-accent);
      }
      .offline .dot {
        background: var(--room-sand);
      }
      time {
        color: var(--room-muted);
        font-variant-numeric: tabular-nums;
      }
      .note {
        margin-top: 12px;
        font-size: 11px;
        color: var(--room-muted);
      }
    `,
  ];
  setConfig(value: unknown) {
    this.config = systemHealthConfig(value);
  }
  protected entityIds() {
    return (
      this.config?.items.flatMap((item) => [
        item.entity,
        ...(item.updated ? [item.updated] : []),
      ]) ?? []
    );
  }
  protected render() {
    if (!this.config) return nothing;
    const text = this.strings.heatPump;
    return html`<ha-card
      ><h3>${this.config.title ?? text.connections}</h3>
      ${this.config.items.map((item) => {
        const state = this.hass?.states[item.entity]?.state;
        return html`<div class="row">
          <span class="label"
            ><ha-icon
              .icon=${item.icon ?? 'mdi:access-point'}
              aria-hidden="true"
            ></ha-icon
            ><span>${item.name}</span></span
          ><span
            class=${`state ${state === 'on' ? 'online' : state === 'off' ? 'offline' : ''}`}
            ><span class="dot" aria-hidden="true"></span
            >${state === 'on' ? text.online : state === 'off' ? text.offlineShort : text.unavailable}</span
          >${item.updated ? html`<time title=${`${text.fetched}: ${this.hass?.states[item.updated]?.state ?? '—'}`}>${metricValue(this.hass, { entity: item.updated, format: 'timestamp' })}</time>` : nothing}
        </div>`;
      })}
      <p class="note">${text.fetchNote}</p></ha-card
    >`;
  }
}
