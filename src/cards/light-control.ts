import { css, html, nothing } from 'lit';
import { BaseCard } from '../ui/base-card';
import { lightConfig } from '../ha/config';
import {
  available,
  brightnessRaw,
  entityStatus,
  lightValue,
  nameOf,
  sameLight,
  supportsBrightness,
  type LightValue,
} from '../ha/entities';
import { ConfirmedCommand } from '../ha/command';
import type { LightConfig } from '../ha/types';
import { localizedError } from '../i18n/strings';
export class LightControlCard extends BaseCard<LightConfig> {
  static properties = { ...BaseCard.properties, draft: { state: true } };
  static styles = [
    BaseCard.styles,
    css`
      ha-card {
        padding: 8px;
      }
      .row {
        display: grid;
        grid-template-columns: 48px minmax(0, 1fr) 44px;
        gap: 0 8px;
        align-items: center;
      }
      .icon-box {
        grid-row: 1 / 3;
      }
      .label {
        min-width: 0;
        padding: 4px 0 0;
      }
      .label .name {
        font-size: 14px;
        font-weight: 600;
      }
      .state {
        font-size: 12px;
        color: var(--room-muted);
        min-height: 18px;
      }
      .toggle {
        display: grid;
        place-items: center;
        color: var(--room-muted);
        grid-column: 3;
        grid-row: 1;
      }
      .toggle[aria-pressed='true'] {
        background: var(--room-active);
        color: var(--room-accent);
      }
      input {
        grid-column: 2 / 4;
        width: 100%;
        margin: 0;
        min-width: 0;
        height: 44px;
        appearance: none;
        background: transparent;
        touch-action: pan-y;
        cursor: pointer;
      }
      input::-webkit-slider-runnable-track {
        height: 8px;
        border-radius: 8px;
        background: linear-gradient(
          to right,
          var(--room-accent) 0 var(--range-fill),
          var(--room-secondary) var(--range-fill) 100%
        );
      }
      input::-moz-range-track {
        height: 8px;
        border-radius: 8px;
        background: var(--room-secondary);
      }
      input::-moz-range-progress {
        height: 8px;
        border-radius: 8px;
        background: var(--room-accent);
      }
      input::-webkit-slider-thumb {
        appearance: none;
        width: 20px;
        height: 20px;
        margin-top: -6px;
        border: 2px solid var(--room-surface);
        border-radius: 50%;
        background: var(--room-accent);
      }
      input::-moz-range-thumb {
        width: 16px;
        height: 16px;
        border: 2px solid var(--room-surface);
        border-radius: 50%;
        background: var(--room-accent);
      }
      input:disabled {
        opacity: 0.45;
        cursor: default;
        --room-accent: var(--room-muted);
      }
      .note {
        grid-column: 2 / 4;
        font-size: 12px;
        color: var(--room-muted);
        padding-bottom: 4px;
      }
    `,
  ];
  private draft?: number;
  private liveTimer?: ReturnType<typeof setTimeout>;
  private pendingLiveBrightness?: number;
  private lastLiveBrightness?: number;
  private lastLiveSentAt = -Infinity;
  private command = new ConfirmedCommand<LightValue>(
    async (value) => {
      if (!this.hass || !this.config) throw new Error('Not connected');
      return this.hass.callService('light', value.on ? 'turn_on' : 'turn_off', {
        entity_id: this.config.entity,
        ...(value.on && value.brightness !== undefined
          ? { brightness: brightnessRaw(value.brightness) }
          : {}),
      });
    },
    sameLight,
    () => this.requestUpdate(),
  );
  setConfig(value: unknown) {
    const config = lightConfig(value);
    if (config.entity !== this.config?.entity) {
      this.command.reset();
    }
    if (
      config.entity !== this.config?.entity ||
      config.slider_live_update !== this.config?.slider_live_update
    )
      this.cancelSlider();
    this.config = config;
  }
  set cardConfig(value: unknown) {
    this.setConfig(value);
  }
  protected entityIds() {
    return this.config ? [this.config.entity] : [];
  }
  getCardSize() {
    return 2;
  }
  protected willUpdate() {
    super.willUpdate();
    const entity = this.hass?.states[this.config?.entity ?? ''];
    if (!available(entity)) {
      this.command.reset();
      this.cancelSlider();
    } else {
      this.command.observe(lightValue(entity));
      if (
        !(this.command.value ?? lightValue(entity)).on ||
        !supportsBrightness(entity)
      )
        this.cancelSlider();
    }
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this.command.reset();
    this.cancelSlider();
  }
  private toggle() {
    const entity = this.hass?.states[this.config?.entity ?? ''];
    if (!available(entity)) return;
    const current = this.command.value ?? lightValue(entity);
    this.cancelSlider();
    this.command.submit({ on: !current.on });
  }
  private canAdjustBrightness() {
    const entity = this.hass?.states[this.config?.entity ?? ''];
    return (
      available(entity) &&
      supportsBrightness(entity) &&
      (this.command.value ?? lightValue(entity)).on
    );
  }
  private cancelSlider() {
    clearTimeout(this.liveTimer);
    this.liveTimer = undefined;
    this.pendingLiveBrightness = undefined;
    this.lastLiveBrightness = undefined;
    this.lastLiveSentAt = -Infinity;
    this.draft = undefined;
  }
  private flushLiveBrightness() {
    this.liveTimer = undefined;
    const value = this.pendingLiveBrightness;
    this.pendingLiveBrightness = undefined;
    if (value === undefined || !this.canAdjustBrightness()) return;
    if (value === this.lastLiveBrightness && !this.command.error) return;
    this.lastLiveSentAt = Date.now();
    this.lastLiveBrightness = value;
    this.command.submit({ on: true, brightness: value });
  }
  private input(event: Event) {
    if (!this.canAdjustBrightness()) return;
    this.draft = Number((event.target as HTMLInputElement).value);
    if (!this.config?.slider_live_update) return;
    this.pendingLiveBrightness = this.draft;
    if (this.liveTimer !== undefined) return;
    const delay = 200 - (Date.now() - this.lastLiveSentAt);
    if (delay <= 0) this.flushLiveBrightness();
    else this.liveTimer = setTimeout(() => this.flushLiveBrightness(), delay);
  }
  private commit(event: Event) {
    const value = Number((event.target as HTMLInputElement).value);
    const alreadySubmitted =
      value === this.lastLiveBrightness && !this.command.error;
    this.cancelSlider();
    if (this.canAdjustBrightness() && !alreadySubmitted)
      this.command.submit({ on: true, brightness: value });
  }
  protected render() {
    if (!this.config) return nothing;
    const entity = this.hass?.states[this.config.entity];
    const isAvailable = available(entity);
    const current = this.command.value ?? lightValue(entity);
    const percent =
      this.draft ?? current.brightness ?? lightValue(entity).brightness ?? 0;
    const dimmable = supportsBrightness(entity);
    const name = nameOf(
      entity,
      this.config.name ?? (entity ? undefined : this.config.entity),
    );
    const text = this.strings;
    return html`<ha-card class=${current.on && isAvailable ? 'active' : ''}>
      <div class="row">
        <div class="icon-box">
          <ha-icon
            .icon=${this.config.icon ?? 'mdi:lightbulb-outline'}
            aria-hidden="true"
          ></ha-icon>
        </div>
        <div class="label">
          <p class="name" title=${name}>${name}</p>
          <p class="state">
            ${isAvailable ? `${current.on ? text.on : text.off}${current.on && dimmable ? ` · ${percent}%` : ''}${this.command.value ? ` · ${text.updating}` : ''}` : entityStatus(entity, this.hass?.locale?.language)}
          </p>
        </div>
        <button
          class="toggle"
          aria-label=${`${current.on ? text.turnOff : text.turnOn} ${name}`}
          aria-pressed=${current.on && isAvailable}
          ?disabled=${!isAvailable}
          @click=${this.toggle}
        >
          <ha-icon
            .icon=${current.on ? 'mdi:power' : 'mdi:power-standby'}
            aria-hidden="true"
          ></ha-icon>
        </button>
        <input
          style=${`--range-fill: ${current.on && dimmable ? percent : 0}%`}
          type="range"
          min="1"
          max="100"
          step="1"
          .value=${String(Math.max(1, percent))}
          aria-label=${text.brightness(name)}
          aria-valuetext=${`${percent}%`}
          ?disabled=${!isAvailable || !current.on || !dimmable}
          @input=${this.input}
          @change=${this.commit}
          @pointercancel=${this.cancelSlider}
          @blur=${this.cancelSlider}
        />
        ${isAvailable && !dimmable ? html`<p class="note">${text.onOffOnly}</p>` : nothing}
      </div>
      ${this.command.error ? html`<p class="error" role="alert">${localizedError(this.command.error, this.hass?.locale?.language)}</p>` : nothing}
    </ha-card>`;
  }
}
