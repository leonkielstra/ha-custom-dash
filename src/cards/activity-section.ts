import { css, html, nothing } from 'lit';
import { BaseCard } from '../ui/base-card';
import { activityConfig } from '../ha/config';
import {
  applianceActivities,
  durationText,
  type ApplianceActivity,
} from '../ha/activity';
import { sensorValue } from '../ha/entities';
import type { ActivityConfig, ApplianceType } from '../ha/types';

const icons: Record<ApplianceType, string> = {
  washer: 'mdi:washing-machine',
  dryer: 'mdi:tumble-dryer',
  oven: 'mdi:stove',
  dishwasher: 'mdi:dishwasher',
};

export class ActivitySectionCard extends BaseCard<ActivityConfig> {
  static properties = { ...BaseCard.properties, now: { state: true } };
  static styles = [
    BaseCard.styles,
    css`
      :host([hidden]) {
        display: none !important;
      }
      .activities {
        display: grid;
        gap: 8px;
      }
      ha-card {
        display: grid;
        grid-template-columns: 36px minmax(0, 1fr);
        align-items: center;
        gap: 12px;
        padding: 12px 14px;
      }
      .icon-box {
        width: 36px;
        height: 36px;
        color: var(--room-accent);
        background: var(--room-active);
      }
      ha-icon {
        width: 21px;
        height: 21px;
        --mdc-icon-size: 21px;
      }
      .content {
        min-width: 0;
      }
      h3 {
        font-size: 14px;
        font-weight: 600;
      }
      .status {
        font-size: 12px;
        color: var(--room-muted);
        overflow-wrap: anywhere;
      }
      .timing {
        font-size: 11px;
        color: var(--room-muted);
        margin-top: 3px;
      }
      progress {
        display: block;
        width: 100%;
        height: 5px;
        min-width: 0;
        border: 0;
        border-radius: 6px;
        overflow: hidden;
        background: var(--room-secondary);
        color: var(--room-accent);
        appearance: none;
      }
      progress::-webkit-progress-bar {
        background: var(--room-secondary);
      }
      progress::-webkit-progress-value {
        background: var(--room-accent);
        border-radius: 6px;
      }
      progress::-moz-progress-bar {
        background: var(--room-accent);
        border-radius: 6px;
      }
      .progress {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 8px;
      }
      .reference {
        font-size: 10px;
        color: var(--room-muted);
        white-space: nowrap;
      }
    `,
  ];
  // HA must keep this card connected and forward hass even while its wrapper hides it.
  connectedWhileHidden = true;
  private now = Date.now();
  private timer?: ReturnType<typeof setInterval>;

  setConfig(value: unknown) {
    this.config = activityConfig(value);
  }
  connectedCallback() {
    super.connectedCallback();
    this.now = Date.now();
    this.requestUpdate();
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this.stopTimer();
  }
  private stopTimer() {
    if (this.timer !== undefined) clearInterval(this.timer);
    this.timer = undefined;
  }
  protected entityIds() {
    return (
      this.config?.appliances.flatMap((a) =>
        [
          a.entity,
          a.started_at_entity,
          a.current_temperature,
          a.progress,
          a.end_time,
        ].filter((id): id is string => !!id),
      ) ?? []
    );
  }
  private get activities() {
    return applianceActivities(
      this.hass,
      this.config?.appliances ?? [],
      this.now,
    );
  }
  protected willUpdate() {
    super.willUpdate();
    this.now = Date.now();
  }
  protected updated() {
    const activities = this.activities;
    const hidden = !!this.config?.hide_when_empty && activities.length === 0;
    if (this.hidden !== hidden) {
      this.hidden = hidden;
      this.dispatchEvent(
        new CustomEvent('card-visibility-changed', {
          bubbles: true,
          composed: true,
          detail: { value: !hidden },
        }),
      );
    }
    const needsClock =
      this.isConnected &&
      activities.some(
        (a) =>
          a.elapsedMinutes !== undefined || a.remainingMinutes !== undefined,
      );
    if (!needsClock) this.stopTimer();
    else if (this.timer === undefined)
      this.timer = setInterval(() => {
        this.now = Date.now();
      }, 60000);
  }
  getCardSize() {
    return this.hidden ? 0 : 1 + this.activities.length * 2;
  }
  private status(activity: ApplianceActivity) {
    const text = this.strings;
    if (activity.state === 'actionrequired') return text.applianceAttention;
    if (activity.state === 'pause') return text.appliancePaused;
    if (activity.config.type === 'washer') return text.washing;
    if (activity.config.type === 'dryer') return text.drying;
    return text.applianceRunning;
  }
  protected render() {
    if (!this.config) return nothing;
    const activities = this.activities;
    if (!activities.length && this.config.hide_when_empty) return nothing;
    const text = this.strings;
    return html`<section
      aria-label=${this.config.title ?? text.activeAppliances}
    >
      <div class="section-heading">
        <h3>${this.config.title ?? text.activeAppliances}</h3>
      </div>
      <div class="activities">
        ${activities.map(
          (a) =>
            html`<ha-card>
              <span class="icon-box"
                ><ha-icon
                  .icon=${a.config.icon ?? icons[a.config.type]}
                  aria-hidden="true"
                ></ha-icon
              ></span>
              <div class="content">
                <h3 class="name" title=${a.config.name}>${a.config.name}</h3>
                <p class="status">
                  ${this.status(a)}${a.config.room ? html` · ${a.config.room}` : nothing}${a.temperature !== undefined ? html` · ${sensorValue(this.hass, a.config.current_temperature, '')}` : nothing}
                </p>
                ${a.elapsedMinutes !== undefined ? html`<p class="timing">${text.elapsed(durationText(a.elapsedMinutes, this.hass?.locale?.language), a.approximate)}</p>` : nothing}
                ${a.remainingMinutes !== undefined ? html`<p class="timing">${text.remaining(durationText(a.remainingMinutes, this.hass?.locale?.language))}</p>` : nothing}
                ${a.progress !== undefined ? html`<div class="progress"><progress max="100" value=${a.progress} aria-label=${a.indicative ? text.referenceProgress : text.programProgress} aria-valuetext=${a.indicative ? text.referenceProgress : `${Math.round(a.progress)}%`} title=${a.indicative ? text.referenceProgress : `${Math.round(a.progress)}%`}></progress>${a.indicative ? html`<span class="reference">${text.referenceTime}</span>` : nothing}</div>` : nothing}
              </div>
            </ha-card>`,
        )}
      </div>
      ${!activities.length ? html`<p class="muted">${text.noActivity}</p>` : nothing}
    </section>`;
  }
}
