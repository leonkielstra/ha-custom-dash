import { css, html, nothing } from 'lit';
import { BaseCard } from '../ui/base-card';
import { heroConfig } from '../ha/config';
import { sensorValue } from '../ha/entities';
import { weatherLabel } from '../ha/weather';
import type { HeroConfig } from '../ha/types';

export class HomeHeroCard extends BaseCard<HeroConfig> {
  static readonly editorType = 'home-hero-card' as const;
  static properties = { ...BaseCard.properties, imageFailed: { state: true } };
  static styles = [
    BaseCard.styles,
    css`
      ha-card {
        display: grid;
        padding: 0 0 8px;
        background: var(--room-background);
      }
      .illustration {
        display: grid;
        place-items: center;
        min-width: 0;
        width: 100%;
        height: clamp(180px, 57vw, 225px);
        overflow: hidden;
      }
      img {
        display: block;
        width: auto;
        max-width: 100%;
        height: 100%;
        min-height: 0;
        object-fit: contain;
        mask-image:
          linear-gradient(
            to bottom,
            transparent,
            black 18%,
            black 72%,
            transparent
          ),
          linear-gradient(
            to right,
            transparent,
            black 12%,
            black 88%,
            transparent
          );
        mask-composite: intersect;
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
        gap: 2px;
        min-width: 0;
        text-align: center;
      }
      dl > div:not(.outdoor) {
        display: flex;
        align-items: baseline;
        justify-content: center;
        flex-direction: row-reverse;
        gap: 8px;
      }
      dt {
        font-size: 13px;
        color: var(--room-text);
        font-weight: 550;
      }
      .outdoor {
        padding: 0;
      }
      .outdoor .reading {
        display: flex;
        flex-direction: row-reverse;
        justify-content: center;
        align-items: baseline;
        gap: 5px;
      }
      .outdoor dd {
        font-size: 16px;
        font-weight: 500;
        letter-spacing: 0;
      }
      .outdoor dt {
        font-size: 13px;
        color: var(--room-muted);
        font-weight: 400;
      }
      .weather {
        font-size: 11px;
        color: var(--room-muted);
        margin-top: 3px;
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
