import { css, html, nothing, type PropertyValues } from 'lit';
import { BaseCard } from '../ui/base-card';
import { climateConfig } from '../ha/config';
import { entityStatus, nameOf, iconOf } from '../ha/entities';
import { languageOf } from '../i18n/strings';
import type { ClimateConfig } from '../ha/types';

/** A compact thermostat shortcut; HA owns the full thermostat controls. */
export class ClimateCard extends BaseCard<ClimateConfig> {
  static readonly editorType = 'home-climate-card' as const;
  static styles = [
    BaseCard.styles,
    css`
      button {
        width: 100%;
        display: grid;
        grid-template-columns: 48px minmax(0, 1fr) 24px;
        align-items: center;
        gap: 12px;
        min-height: 76px;
        padding: 10px 12px;
        background: var(--room-surface);
        border-radius: 16px;
        text-align: start;
      }
      button:hover:not(:disabled) {
        background: var(--room-surface);
      }
      .icon-box {
        width: 48px;
        height: 52px;
      }
      .details {
        min-width: 0;
      }
      .name {
        font-size: var(--room-label-size);
        font-weight: 550;
      }
      .status {
        font-size: var(--room-meta-size);
        color: var(--room-muted);
        margin-top: 3px;
      }
      .chevron {
        width: 18px;
        height: 18px;
        --mdc-icon-size: 18px;
        color: var(--room-muted);
      }
    `,
  ];
  setConfig(value: unknown) {
    this.config = climateConfig(value);
  }
  protected entityIds() {
    return this.config ? [this.config.entity] : [];
  }
  protected shouldUpdate(changes: PropertyValues) {
    const previous = changes.get('hass') as typeof this.hass;
    return (
      super.shouldUpdate(changes) ||
      (changes.has('hass') &&
        previous?.config?.unit_system?.temperature !==
          this.hass?.config?.unit_system?.temperature)
    );
  }
  private moreInfo() {
    if (!this.config || !this.hass?.states[this.config.entity]) return;
    this.dispatchEvent(
      new CustomEvent('hass-more-info', {
        bubbles: true,
        composed: true,
        detail: { entityId: this.config.entity },
      }),
    );
  }
  protected render() {
    if (!this.config) return nothing;
    const entity = this.hass?.states[this.config.entity];
    const name = nameOf(entity, this.config.name ?? this.strings.climate);
    const value = entity?.attributes.current_temperature;
    const reportedUnit =
      entity?.attributes.temperature_unit ??
      entity?.attributes.unit_of_measurement;
    const unit =
      typeof reportedUnit === 'string'
        ? reportedUnit
        : (this.hass?.config?.unit_system?.temperature ?? '°');
    const reading =
      typeof value === 'number' && Number.isFinite(value)
        ? new Intl.NumberFormat(languageOf(this.hass?.locale?.language), {
            maximumFractionDigits: 1,
            minimumFractionDigits: 1,
          }).format(value) + unit
        : undefined;
    return html`<ha-card
      ><button
        aria-label=${this.strings.openClimate(name)}
        ?disabled=${!entity}
        @click=${this.moreInfo}
      >
        <span class="tone-sand"
          ><span class="icon-box"
            ><ha-icon
              .icon=${iconOf(entity, this.config.icon, 'mdi:heating-coil')}
              aria-hidden="true"
            ></ha-icon></span
        ></span>
        <div class="details">
          <p class="name" title=${name}>${name}</p>
          <p class="status">
            ${entityStatus(entity, this.hass?.locale?.language)}${reading && entity?.state !== 'unavailable' && entity?.state !== 'unknown' ? html` · ${reading}` : nothing}
          </p>
        </div>
        <ha-icon
          class="chevron"
          .icon=${'mdi:chevron-right'}
          aria-hidden="true"
        ></ha-icon></button
    ></ha-card>`;
  }
}
