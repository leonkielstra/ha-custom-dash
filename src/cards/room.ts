import { css, html, nothing } from 'lit';
import { BaseCard } from '../ui/base-card';
import { roomConfig } from '../ha/config';
import { sensorValue } from '../ha/entities';
import type { IconTone, RoomConfig } from '../ha/types';
import { roomLights } from '../ha/overview';

const iconTones: Record<string, IconTone> = {
  'mdi:sofa-outline': 'teal',
  'mdi:countertop-outline': 'sand',
  'mdi:door-open': 'blue',
  'mdi:coat-rack': 'sand',
  'mdi:stairs': 'blue',
  'mdi:washing-machine': 'blue',
  'mdi:desk': 'blue',
  'mdi:bed-outline': 'violet',
  'mdi:shower': 'blue',
  'mdi:home-roof': 'sand',
  'mdi:flower-outline': 'teal',
  'mdi:car-outline': 'sand',
};

export class RoomCard extends BaseCard<RoomConfig> {
  static styles = [
    BaseCard.styles,
    css`
      :host {
        height: 100%;
        min-width: 0;
        container: room-shortcut / inline-size;
      }
      ha-card {
        height: 100%;
      }
      .room {
        display: grid;
        grid-template-columns: 44px minmax(0, 1fr);
        align-items: center;
        column-gap: 10px;
        padding: 8px;
        min-height: 88px;
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
      .icon-box {
        width: 44px;
        height: 64px;
        border-radius: 11px;
      }
      ha-icon {
        width: 24px;
        height: 24px;
        --mdc-icon-size: 24px;
      }
      .details {
        min-width: 0;
        container-type: inline-size;
      }
      .short {
        display: none;
      }
      @container (max-width: 100px) {
        .full {
          display: none;
        }
        .short {
          display: inline;
        }
      }
      .temperature {
        margin-top: 3px;
        color: var(--room-muted);
        font-size: 11px;
        font-style: italic;
        line-height: 15px;
      }
      h3 {
        font-size: 13px;
        line-height: 18px;
        font-weight: 550;
      }
      .status {
        margin-top: 3px;
        color: var(--room-muted);
        font-size: 11px;
        line-height: 15px;
        overflow-wrap: anywhere;
      }
      .unavailable {
        display: block;
        font-size: 10px;
      }
      @container room-shortcut (min-width: 300px) {
        .room {
          padding: 12px;
          column-gap: 12px;
          min-height: 92px;
        }
        .icon-box {
          height: 48px;
        }
        .details {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          align-items: center;
          column-gap: 12px;
        }
        .name,
        .status {
          grid-column: 1;
        }
        .name {
          font-size: 15px;
          line-height: 20px;
        }
        .status {
          font-size: 12px;
          line-height: 17px;
        }
        .temperature {
          grid-column: 2;
          grid-row: 1 / span 2;
          justify-self: end;
          margin: 0;
          font-size: 14px;
          line-height: 20px;
          font-style: normal;
        }
      }
      @media (max-width: 340px) {
        .room {
          grid-template-columns: 40px minmax(0, 1fr);
          gap: 8px;
        }
        .icon-box {
          width: 40px;
        }
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
    const statusLabel = [
      summary.on
        ? text.lightGroupsOn(summary.on)
        : summary.unavailable
          ? ''
          : text.lightingOff,
      summary.unavailable ? text.unavailableShort(summary.unavailable) : '',
    ]
      .filter(Boolean)
      .join(' · ');
    const tone =
      c.icon_tone ??
      iconTones[c.icon ?? ''] ??
      (summary.on ? 'teal' : 'neutral');
    const content = html` <div class="${`tone-${tone}`}">
        <span class="icon-box"
          ><ha-icon
            .icon=${c.icon ?? 'mdi:home-outline'}
            aria-hidden="true"
          ></ha-icon
        ></span>
      </div>
      <div class="details">
        <h3 class="name" title=${c.name}>${c.name}</h3>
        ${
          c.lights?.length
            ? html`<p class="status">
                <span class="sr-only">${statusLabel}</span>
                <span class="full" aria-hidden="true"
                  >${summary.on ? text.lightGroupsOn(summary.on) : summary.unavailable ? nothing : text.lightingOff}</span
                >
                <span class="short" aria-hidden="true"
                  >${summary.on ? `${summary.on} ${text.onLower}` : summary.unavailable ? nothing : text.off}</span
                >
                ${summary.unavailable ? html`<span class="unavailable" aria-hidden="true">${text.unavailableShort(summary.unavailable)}</span>` : nothing}
              </p>`
            : nothing
        }
        ${c.temperature ? html`<p class="temperature" aria-label=${text.temperature}>${sensorValue(this.hass, c.temperature, '')}</p>` : nothing}
      </div>`;
    return html`<ha-card
      >${
        c.navigation_path
          ? html`<a
              class="room"
              href=${c.navigation_path}
              aria-label=${[c.name, c.lights?.length ? statusLabel : '', c.temperature ? sensorValue(this.hass, c.temperature, '') : ''].filter(Boolean).join(', ')}
              @click=${this.navigate}
              >${content}</a
            >`
          : html`<div class="room">${content}</div>`
      }</ha-card
    >`;
  }
}
