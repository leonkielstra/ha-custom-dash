import { css, html, nothing } from 'lit';
import { BaseCard } from '../ui/base-card';
import { activityConfig } from '../ha/config';
import {
  applianceActivities,
  durationText,
  durationCompact,
  type ApplianceActivity,
} from '../ha/activity';
import { sensorValue } from '../ha/entities';
import type { ActivityConfig, ApplianceType } from '../ha/types';

const icons: Record<ApplianceType, string> = {
  washer: 'mdi:washing-machine',
  dryer: 'mdi:tumble-dryer',
  oven: 'mdi:stove',
  dishwasher: 'mdi:dishwasher',
  heat_pump: 'mdi:heat-pump-outline',
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
        grid-template-columns: 44px minmax(0, 1fr);
        align-items: center;
        gap: 12px;
        padding: 10px 12px;
        min-height: 84px;
      }
      .icon-box {
        width: 44px;
        height: 56px;
      }
      ha-icon {
        width: 21px;
        height: 21px;
        --mdc-icon-size: 21px;
      }
      .content {
        min-width: 0;
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        grid-template-areas: 'name metric' 'status timing' 'progress progress';
        column-gap: 8px;
        row-gap: 2px;
      }
      h3 {
        grid-area: name;
        font-size: 13px;
        font-weight: 550;
      }
      .status {
        grid-area: status;
        font-size: 11px;
        color: var(--room-muted);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .metric {
        grid-area: metric;
        font-size: var(--room-label-size);
        font-weight: 550;
        text-align: end;
      }

      .timing {
        grid-area: timing;
        font-size: 11px;
        color: var(--room-muted);
        text-align: end;
        max-width: 116px;
      }
      progress {
        display: block;
        width: 100%;
        height: 7px;
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
        background: var(--room-control);
        border-radius: 6px;
      }
      progress::-moz-progress-bar {
        background: var(--room-control);
        border-radius: 6px;
      }
      .progress {
        grid-area: progress;
        margin-top: 6px;
      }
      .fan-speed {
        grid-area: progress;
        margin-top: 4px;
        font-size: 11px;
        color: var(--room-muted);
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
          a.mode_entity,
          a.operating_entity,
          a.fan_speed,
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
    if (activity.state === 'heat_pump_hot_water') return text.heatingWater;
    if (activity.state === 'heat_pump_heating') return text.heatingHome;
    if (activity.state === 'heat_pump_active') return text.heatPumpActive;
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
        ${activities.map((a) => {
          const temperature =
            a.temperature !== undefined
              ? sensorValue(this.hass, a.config.current_temperature, '')
              : undefined;
          const elapsed =
            a.elapsedMinutes !== undefined
              ? text.elapsed(
                  durationText(a.elapsedMinutes, this.hass?.locale?.language),
                  a.approximate,
                )
              : undefined;
          const status = `${this.status(a)}${a.config.room ? ` · ${a.config.room}` : ''}`;
          return html`<ha-card>
            <span class=${a.config.type === 'oven' ? 'tone-sand' : 'tone-teal'}
              ><span class="icon-box"
                ><ha-icon
                  .icon=${a.config.icon ?? icons[a.config.type]}
                  aria-hidden="true"
                ></ha-icon></span
            ></span>
            <div class="content">
              <h3 class="name" title=${a.config.name}>${a.config.name}</h3>
              ${a.heatOutput !== undefined ? html`<span class="metric" title=${text.heatOutput}>${sensorValue(this.hass, a.config.entity, '')}</span>` : temperature ? html`<span class="metric">${temperature}</span>` : a.elapsedMinutes !== undefined ? html`<span class="metric" title=${elapsed} aria-label=${elapsed}>${durationCompact(a.elapsedMinutes, this.hass?.locale?.language)}</span>` : nothing}
              <p class="status" title=${status}>${status}</p>
              ${a.fanSpeed !== undefined ? html`<p class="fan-speed">${text.fanSpeed} ${sensorValue(this.hass, a.config.fan_speed, '%')}</p>` : nothing}
              ${elapsed ? html`<p class="timing" title=${elapsed}>${text.referenceTime}</p>` : a.remainingMinutes !== undefined ? html`<p class="timing">${text.remaining(durationCompact(a.remainingMinutes, this.hass?.locale?.language))}</p>` : nothing}
              ${a.progress !== undefined ? html`<div class="progress"><progress max="100" value=${a.progress} aria-label=${a.indicative ? text.referenceProgress : text.programProgress} aria-valuetext=${a.indicative ? text.referenceProgress : `${Math.round(a.progress)}%`} title=${a.indicative ? text.referenceProgress : `${Math.round(a.progress)}%`}></progress></div>` : nothing}
            </div>
          </ha-card>`;
        })}
      </div>
      ${!activities.length ? html`<p class="muted">${text.noActivity}</p>` : nothing}
    </section>`;
  }
}
