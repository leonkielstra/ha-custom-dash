import { css, html, nothing } from 'lit';
import { BaseCard } from '../ui/base-card';
import { roomConfig } from '../ha/config';
import { sensorValue } from '../ha/entities';
import type { RoomConfig } from '../ha/types';
import { roomLights } from '../ha/overview';

export class RoomCard extends BaseCard<RoomConfig> {
  static styles = [
    BaseCard.styles,
    css`
      :host {
        height: 100%;
        min-width: 0;
      }
      ha-card {
        height: 100%;
      }
      .room {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 12px;
        min-height: 124px;
        height: 100%;
        border-radius: inherit;
        color: inherit;
        text-decoration: none;
      }
      a:focus-visible {
        outline: 3px solid var(--room-accent);
        outline-offset: 2px;
      }
      a:active {
        outline: 1px solid var(--room-accent);
        outline-offset: -1px;
      }
      .top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        min-width: 0;
      }
      .icon-box {
        width: 36px;
        height: 36px;
        flex-basis: 36px;
        border-radius: 11px;
      }
      ha-icon {
        width: 21px;
        height: 21px;
        --mdc-icon-size: 21px;
      }
      .temperature {
        font-size: 14px;
        font-weight: 600;
        min-width: 0;
        overflow-wrap: anywhere;
      }
      h3 {
        font-size: 15px;
        line-height: 20px;
        font-weight: 600;
      }
      .status {
        color: var(--room-muted);
        font-size: 12px;
        line-height: 17px;
        overflow-wrap: anywhere;
      }
      .unavailable {
        display: block;
        font-size: 11px;
      }
    `,
  ];
  setConfig(value: unknown) {
    this.config = roomConfig(value);
  }
  protected entityIds() {
    return [this.config?.temperature, ...(this.config?.lights ?? [])].filter(
      (id): id is string => !!id,
    );
  }
  getGridOptions() {
    return { columns: 6, min_columns: 6, rows: 'auto' };
  }
  private navigate(event: MouseEvent) {
    const path = this.config?.navigation_path;
    if (
      !path ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    event.preventDefault();
    window.history.pushState(null, '', path);
    window.dispatchEvent(
      new CustomEvent('location-changed', { detail: { replace: false } }),
    );
  }
  protected render() {
    if (!this.config) return nothing;
    const c = this.config;
    const summary = roomLights(this.hass, c.lights);
    const text = this.strings;
    const content = html` <div class="top ${summary.on ? 'active' : ''}">
        <span class="icon-box"
          ><ha-icon
            .icon=${c.icon ?? 'mdi:home-outline'}
            aria-hidden="true"
          ></ha-icon
        ></span>
        ${c.temperature ? html`<span class="temperature" aria-label=${text.temperature}>${sensorValue(this.hass, c.temperature, '')}</span>` : nothing}
      </div>
      <h3 class="name" title=${c.name}>${c.name}</h3>
      ${
        c.lights?.length
          ? html`<p class="status">
              ${summary.on ? text.lightGroupsOn(summary.on) : summary.unavailable ? nothing : text.lightingOff}
              ${summary.unavailable ? html`<span class="unavailable">${text.unavailableShort(summary.unavailable)}</span>` : nothing}
            </p>`
          : nothing
      }`;
    return html`<ha-card
      >${
        c.navigation_path
          ? html`<a
              class="room"
              href=${c.navigation_path}
              aria-label=${c.name}
              @click=${this.navigate}
              >${content}</a
            >`
          : html`<div class="room">${content}</div>`
      }</ha-card
    >`;
  }
}
