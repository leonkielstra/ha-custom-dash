import { css, html, nothing } from 'lit';
import { BaseCard } from '../ui/base-card';
import { deviceConfig } from '../ha/config';
import { available, entityStatus, nameOf } from '../ha/entities';
import type { DeviceConfig } from '../ha/types';
const TURN_ON = 128;
const TURN_OFF = 256;
const PAUSE = 1;
const PLAY = 16384;
export class DeviceCard extends BaseCard<DeviceConfig> {
  static styles = [
    BaseCard.styles,
    css`
      ha-card {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
      }
      .details {
        flex: 1;
        min-width: 0;
      }
      button {
        color: var(--room-accent);
      }
      .error {
        padding: 8px 12px;
      }
    `,
  ];
  setConfig(value: unknown) {
    this.config = deviceConfig(value);
  }
  protected entityIds() {
    return this.config ? [this.config.entity] : [];
  }
  protected render() {
    if (!this.config) return nothing;
    const entity = this.hass?.states[this.config.entity];
    const name = nameOf(entity, this.config.name);
    const features =
      typeof entity?.attributes.supported_features === 'number'
        ? entity.attributes.supported_features
        : 0;
    const off = entity?.state === 'off' || entity?.state === 'standby';
    const playing = entity?.state === 'playing';
    const service = off
      ? features & TURN_ON
        ? 'turn_on'
        : undefined
      : playing && features & PAUSE
        ? 'media_pause'
        : !playing && features & PLAY
          ? 'media_play'
          : features & TURN_OFF
            ? 'turn_off'
            : undefined;
    const label =
      service === 'turn_on'
        ? 'Turn on'
        : service === 'turn_off'
          ? 'Turn off'
          : service === 'media_pause'
            ? 'Pause'
            : 'Play';
    const icon =
      service === 'media_pause'
        ? 'mdi:pause'
        : service === 'media_play'
          ? 'mdi:play'
          : 'mdi:power';
    return html`<ha-card class=${playing ? 'active' : ''}>
        <div class="icon-box">
          <ha-icon
            .icon=${this.config.icon ?? 'mdi:television'}
            aria-hidden="true"
          ></ha-icon>
        </div>
        <div class="details">
          <h3 class="name" title=${name}>${name}</h3>
          <p class="muted">${entityStatus(entity)}</p>
        </div>
        ${service ? html`<button ?disabled=${this.busy || !available(entity)} aria-label=${`${label} ${name}`} @click=${() => this.perform(() => this.hass!.callService('media_player', service, { entity_id: this.config!.entity }))}><ha-icon .icon=${icon} aria-hidden="true"></ha-icon></button>` : nothing} </ha-card
      >${this.errorMessage()}`;
  }
}
