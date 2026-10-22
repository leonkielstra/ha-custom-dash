import { css, html, nothing } from 'lit';
import { BaseCard } from '../ui/base-card';
import { metricCardConfig } from '../ha/heat-pump-config';
import { metricValue } from '../ha/heat-pump';
import type { MetricCardConfig, MetricItem } from '../ha/types';

export class MetricCard extends BaseCard<MetricCardConfig> {
  static readonly editorType = 'home-metric-card' as const;
  static styles = [
    BaseCard.styles,
    css`
      :host {
        container-type: inline-size;
      }
      .items {
        display: grid;
        gap: 8px;
        grid-template-columns: repeat(var(--columns), minmax(0, 1fr));
      }
      ha-card {
        padding: 14px;
        min-width: 0;
        height: 100%;
      }
      .name {
        display: block;
        font-size: 12px;
        color: var(--room-muted);
      }
      .value {
        display: block;
        margin-top: 4px;
        font-size: 22px;
        line-height: 1.2;
        font-weight: 600;
        letter-spacing: -0.3px;
        overflow-wrap: anywhere;
      }
      .secondary {
        display: block;
        color: var(--room-muted);
        font-size: 12px;
        margin-top: 4px;
      }
      ha-icon {
        width: 21px;
        height: 21px;
        --mdc-icon-size: 21px;
        color: var(--room-muted);
      }
      .metric-icon {
        float: right;
        margin-left: 6px;
      }
      .list,
      .strip,
      .panel {
        padding: 8px 14px;
      }
      .list .items {
        display: block;
      }
      .list .item {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, auto);
        align-items: center;
        gap: 8px;
        min-height: 44px;
      }
      .list .item + .item {
        border-top: 1px solid var(--room-border);
      }
      .list .value {
        font-size: 14px;
        margin: 0;
        letter-spacing: 0;
        text-align: end;
      }
      .list .name {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 13px;
      }
      .list h3,
      .strip h3 {
        margin: 6px 0 8px;
      }
      .strip .items {
        gap: 0;
      }
      .strip .item {
        padding: 8px 10px;
      }
      .strip .item + .item {
        border-left: 1px solid var(--room-border);
      }
      .strip .value {
        font-size: 20px;
      }
      .strip .metric-icon {
        display: none;
      }
      .panel .item {
        display: flex;
        flex-direction: column;
        align-items: start;
        justify-content: center;
        padding: 10px;
      }
      .panel .name {
        order: 2;
        margin-top: 4px;
      }
      .panel .value {
        order: 1;
        margin: 0;
        font-size: 20px;
      }
      .panel h3 {
        margin: 6px 0;
      }
      .panel .metric-icon {
        display: none;
      }
      a,
      button {
        display: block;
        color: inherit;
        text-decoration: none;
        border-radius: 12px;
        min-height: 44px;
      }
      button {
        background: none;
        border: 0;
        padding: 0;
        width: 100%;
        text-align: start;
        font: inherit;
      }
      .list a {
        display: grid;
      }
      a:focus-visible,
      button:focus-visible {
        outline: 2px solid var(--room-accent);
        outline-offset: 3px;
      }
      @container (max-width: 340px) {
        .strip .item {
          padding: 8px 6px;
        }
        .strip .value {
          font-size: 17px;
        }
        .strip .name {
          font-size: 11px;
        }
      }
    `,
  ];
  setConfig(value: unknown) {
    this.config = metricCardConfig(value);
  }
  protected entityIds() {
    return (
      this.config?.items.flatMap((item) => [
        item.entity,
        ...(item.secondary_entity ? [item.secondary_entity] : []),
      ]) ?? []
    );
  }
  private navigate(event: MouseEvent, item: MetricItem) {
    if (
      !item.navigation_path ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    event.preventDefault();
    window.history.pushState(null, '', item.navigation_path);
    window.dispatchEvent(
      new CustomEvent('location-changed', { detail: { replace: false } }),
    );
  }
  private item(item: MetricItem) {
    const list = this.config?.layout === 'list';
    const contents = html`${!list && item.icon ? html`<ha-icon class="metric-icon" .icon=${item.icon} aria-hidden="true"></ha-icon>` : nothing}
      <span class="name">
        ${list && item.icon ? html`<ha-icon .icon=${item.icon} aria-hidden="true"></ha-icon>` : nothing}${item.name}
      </span>
      <span class="value" title=${this.hass?.states[item.entity]?.state ?? ''}
        >${metricValue(this.hass, item)}</span
      >
      ${item.secondary_entity ? html`<span class="secondary">${item.secondary_name ?? ''} ${metricValue(this.hass, { entity: item.secondary_entity })}</span>` : nothing}`;
    return item.navigation_path
      ? html`<a
          class="item"
          href=${item.navigation_path}
          @click=${(event: MouseEvent) => this.navigate(event, item)}
          >${contents}</a
        >`
      : html`<button
          type="button"
          class="item"
          @click=${() => this.dispatchEvent(new CustomEvent('hass-more-info', { bubbles: true, composed: true, detail: { entityId: item.entity } }))}
        >
          ${contents}
        </button>`;
  }
  protected render() {
    if (!this.config) return nothing;
    const c = this.config;
    if (c.layout === 'grid')
      return html`${c.title ? html`<div class="section-heading"><h3>${c.title}</h3></div>` : nothing}
        <div class="items" style=${`--columns:${c.columns}`}>
          ${c.items.map((item) => html`<ha-card>${this.item(item)}</ha-card>`)}
        </div>`;
    return html`<ha-card class=${c.layout}
      >${c.title ? html`<h3>${c.title}</h3>` : nothing}
      <div class="items" style=${`--columns:${c.columns}`}>
        ${c.items.map((item) => this.item(item))}
      </div></ha-card
    >`;
  }
}
