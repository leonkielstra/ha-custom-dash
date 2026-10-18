import { css, html, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { BaseCard } from '../ui/base-card';
import { lightingConfig } from '../ha/config';
import { available } from '../ha/entities';
import type { LightingConfig } from '../ha/types';
export class RoomLightingCard extends BaseCard<LightingConfig> {
  static styles = [
    BaseCard.styles,
    css`
      .lights {
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        gap: 8px;
      }
      .actions {
        display: flex;
        gap: 4px;
      }
      @container (min-width: 600px) {
        .lights {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }
      section {
        container-type: inline-size;
      }
      .availability {
        color: var(--room-muted);
        font-size: 12px;
        margin-bottom: 8px;
      }
    `,
  ];
  setConfig(value: unknown) {
    this.config = lightingConfig(value);
  }
  protected entityIds() {
    return this.config?.lights.map((v) => v.entity) ?? [];
  }
  getCardSize() {
    return (this.config?.lights.length ?? 1) * 2 + 1;
  }
  private async all(on: boolean) {
    const ids = this.entityIds().filter((id) =>
      available(this.hass?.states[id]),
    );
    if (!ids.length || !this.hass) return;
    await this.perform(() =>
      this.hass!.callService('light', on ? 'turn_on' : 'turn_off', {
        entity_id: ids,
      }),
    );
  }
  protected render() {
    if (!this.config) return nothing;
    const ids = this.entityIds();
    const unavailable = ids.filter(
      (id) => !available(this.hass?.states[id]),
    ).length;
    const disabled = this.busy || unavailable === ids.length;
    return html`<section aria-label=${this.config.title ?? 'Lighting'}>
      <div class="section-heading">
        <h3>${this.config.title ?? 'Lighting'}</h3>
        <div class="actions">
          <button
            class="action"
            ?disabled=${disabled}
            aria-label="Turn all configured lights on"
            @click=${() => this.all(true)}
          >
            All on
          </button>
          <button
            class="action"
            ?disabled=${disabled}
            aria-label="Turn all configured lights off"
            @click=${() => this.all(false)}
          >
            All off
          </button>
        </div>
      </div>
      ${unavailable ? html`<p class="availability">${unavailable} ${unavailable === 1 ? 'light' : 'lights'} unavailable</p>` : nothing}
      <div class="lights">
        ${repeat(
          this.config.lights,
          (item) => item.entity,
          (item) =>
            html`<home-light-control-card
              .hass=${this.hass}
              .cardConfig=${{ type: 'custom:home-light-control-card', theme: this.config?.theme, ...item }}
            ></home-light-control-card>`,
        )}
      </div>
      ${this.errorMessage()}
    </section>`;
  }
}
