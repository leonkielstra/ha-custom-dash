import { css, html, nothing } from 'lit';
import { BaseCard } from '../ui/base-card';
import { heroConfig } from '../ha/config';
import { sensorValue } from '../ha/entities';
import { weatherLabel } from '../ha/weather';
import type { HeroConfig } from '../ha/types';

export class HomeHeroCard extends BaseCard<HeroConfig> {
  static properties = { ...BaseCard.properties, imageFailed: { state: true } };
  static styles = [
    BaseCard.styles,
    css`
      ha-card {
        display: grid;
        grid-template-columns: minmax(0, 0.9fr) minmax(0, 1fr);
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        background: var(--room-hero-surface);
        min-height: 156px;
      }
      .illustration {
        display: grid;
        place-items: center;
        min-width: 0;
        height: 132px;
      }
      img {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: contain;
      }
      .illustration ha-icon {
        color: var(--room-muted);
        width: 40px;
        height: 40px;
        --mdc-icon-size: 40px;
      }
      dl {
        margin: 0;
        display: grid;
        gap: 12px;
        min-width: 0;
      }
      dl > div:not(.outdoor) {
        display: flex;
        flex-direction: column-reverse;
      }
      dt {
        font-size: 13px;
        color: var(--room-text);
        font-weight: 550;
      }
      .outdoor {
        border-top: 1px solid var(--room-border);
        padding-top: 12px;
      }
      .outdoor .reading {
        display: flex;
        flex-direction: row-reverse;
        justify-content: flex-end;
        align-items: baseline;
        gap: 5px;
      }
      .outdoor dd {
        font-size: 13px;
        font-weight: 500;
        letter-spacing: 0;
      }
      .outdoor dt {
        font-size: 11px;
        color: var(--room-muted);
        font-weight: 400;
      }
      .weather {
        font-size: 11px;
        color: var(--room-muted);
        margin-top: 3px;
      }
      @media (max-width: 340px) {
        ha-card {
          padding: 12px;
          gap: 8px;
        }
        dd {
          font-size: 26px;
        }
      }
      dd {
        margin: 0;
        font-size: 28px;
        line-height: 1.2;
        font-weight: 600;
        letter-spacing: -0.5px;
        overflow-wrap: anywhere;
      }
    `,
  ];
  private night = false;
  private imageFailed = false;
  private imageSource = '';

  setConfig(value: unknown) {
    const next = heroConfig(value);
    if (next.sun_entity !== this.config?.sun_entity) this.night = false;
    this.config = next;
  }
  protected entityIds() {
    return this.config
      ? [
          this.config.temperature,
          this.config.outdoor_temperature,
          this.config.sun_entity,
          ...(this.config.weather ? [this.config.weather] : []),
        ]
      : [];
  }
  protected willUpdate() {
    super.willUpdate();
    const state = this.hass?.states[this.config?.sun_entity ?? '']?.state;
    if (state === 'above_horizon') this.night = false;
    else if (state === 'below_horizon') this.night = true;
    const source = this.night
      ? this.config?.image_night
      : this.config?.image_day;
    if (source !== this.imageSource) {
      this.imageSource = source ?? '';
      this.imageFailed = false;
    }
  }
  getCardSize() {
    return 3;
  }
  protected render() {
    if (!this.config) return nothing;
    const text = this.strings;
    return html`<ha-card>
      <div class="illustration">
        ${
          this.imageFailed
            ? html`<ha-icon
                .icon=${'mdi:home-outline'}
                role="img"
                aria-label=${text.houseImageUnavailable}
              ></ha-icon>`
            : html`<img
                src=${this.imageSource}
                alt=""
                @error=${() => {
                  this.imageFailed = true;
                }}
              />`
        }
      </div>
      <dl>
        <div>
          <dt>${text.indoors}</dt>
          <dd>${sensorValue(this.hass, this.config.temperature, '')}</dd>
        </div>
        <div class="outdoor">
          <div class="reading">
            <dt>${text.outdoors}</dt>
            <dd>
              ${sensorValue(this.hass, this.config.outdoor_temperature, '')}
            </dd>
          </div>
          ${this.config.weather ? html`<p class="weather">${weatherLabel(this.hass?.states[this.config.weather], this.hass?.locale?.language)}</p>` : nothing}
        </div>
      </dl>
    </ha-card>`;
  }
}
