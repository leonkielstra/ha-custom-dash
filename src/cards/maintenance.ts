import { css, html, nothing } from 'lit';
import { BaseCard } from '../ui/base-card';
import { maintenanceConfig } from '../ha/config';
import {
  maintenanceReadings,
  maintenancePriority,
  type MaintenanceReading,
} from '../ha/maintenance';
import { durationText } from '../ha/activity';
import { maintenanceText } from '../i18n/maintenance';
import type { MaintenanceConfig, MaintenanceCategory } from '../ha/types';

const icons: Record<MaintenanceCategory, string> = {
  batteries: 'mdi:battery-outline',
  supplies: 'mdi:package-variant-closed',
  backups: 'mdi:cloud-check-outline',
  updates: 'mdi:update',
  devices: 'mdi:devices',
};
export class MaintenanceCard extends BaseCard<MaintenanceConfig> {
  static readonly editorType = 'home-maintenance-card' as const;
  static properties = { ...BaseCard.properties, now: { state: true } };
  static styles = [
    BaseCard.styles,
    css`
      .intro {
        margin-bottom: 16px;
      }
      h2 {
        font-size: 22px;
        font-weight: 600;
      }
      .intro p {
        margin-top: 4px;
        color: var(--room-muted);
        font-size: 13px;
      }
      .summary {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 16px;
        margin-bottom: 20px;
      }
      .summary strong {
        font-size: 20px;
        font-weight: 600;
      }
      .summary p {
        font-size: 12px;
        color: var(--room-muted);
        margin-top: 3px;
      }
      .summary .icon-box {
        width: 48px;
        height: 48px;
      }
      .layout {
        display: grid;
        gap: 24px;
        align-items: start;
      }
      .inventory {
        display: grid;
        gap: 20px;
      }
      h3 {
        font-size: 16px;
        margin-bottom: 10px;
      }
      .rows {
        overflow: hidden;
      }
      .row {
        display: grid;
        grid-template-columns: 24px minmax(0, 1fr) auto;
        gap: 12px;
        align-items: center;
        width: 100%;
        padding: 12px 14px;
        border-radius: 0;
        text-align: start;
        min-height: 64px;
      }
      .row + .row {
        border-top: 1px solid var(--room-border);
      }
      .row:hover {
        background: var(--room-secondary) !important;
      }
      .row ha-icon {
        width: 20px;
        height: 20px;
        --mdc-icon-size: 20px;
        color: var(--room-accent);
      }
      .row .chevron {
        width: 16px;
        --mdc-icon-size: 16px;
        color: var(--room-muted);
      }
      .row .marker {
        color: var(--room-sand);
      }
      .row.urgent .marker {
        color: var(--room-error);
      }
      .row.unknown .marker {
        color: var(--room-muted);
      }
      .label {
        min-width: 0;
      }
      .label strong {
        display: block;
        font-size: 14px;
        line-height: 1.4;
        font-weight: 550;
        overflow-wrap: anywhere;
      }
      .label p {
        font-size: 12px;
        line-height: 1.45;
        color: var(--room-muted);
        margin-top: 3px;
        overflow-wrap: anywhere;
      }
      .value {
        display: grid;
        gap: 6px;
        text-align: end;
        font-size: 12px;
        color: var(--room-muted);
        max-width: 108px;
      }
      progress {
        width: 70px;
        height: 5px;
        border: 0;
        border-radius: 4px;
        overflow: hidden;
        appearance: none;
        background: var(--room-secondary);
        color: var(--room-accent);
      }
      progress::-webkit-progress-bar {
        background: var(--room-secondary);
      }
      progress::-webkit-progress-value {
        background: var(--room-accent);
        border-radius: 4px;
      }
      progress::-moz-progress-bar {
        background: var(--room-accent);
      }
      .warning progress::-webkit-progress-value,
      .urgent progress::-webkit-progress-value {
        background: var(--room-sand);
      }
      .warning progress::-moz-progress-bar,
      .urgent progress::-moz-progress-bar {
        background: var(--room-sand);
      }
      details {
        margin-top: 0;
      }
      summary {
        cursor: pointer;
        padding: 12px 14px;
        min-height: 44px;
        color: var(--room-accent);
        font-size: 13px;
      }
      summary:focus-visible {
        outline: 3px solid var(--room-accent);
        outline-offset: -3px;
        border-radius: 12px;
      }
      .heading {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        margin-bottom: 10px;
      }
      .heading h3 {
        margin: 0;
      }
      .count {
        border-radius: 999px;
        padding: 3px 9px;
        font-size: 11px;
        background: var(--room-secondary);
        color: var(--room-muted);
      }
      .empty {
        padding: 20px 16px;
      }
      .empty strong {
        font-weight: 550;
        font-size: 14px;
      }
      .empty p {
        color: var(--room-muted);
        font-size: 12px;
        margin-top: 4px;
      }
      @container maintenance (min-width: 760px) {
        .layout {
          grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr);
        }
      }
      .dashboard {
        container: maintenance / inline-size;
      }
    `,
  ];
  private now = Date.now();
  private timer?: ReturnType<typeof setInterval>;
  setConfig(value: unknown) {
    this.config = maintenanceConfig(value);
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
  protected updated() {
    if (
      this.isConnected &&
      this.config?.items.some((item) => item.kind === 'stale')
    ) {
      if (this.timer === undefined)
        this.timer = setInterval(() => {
          this.now = Date.now();
        }, 60000);
    } else this.stopTimer();
  }
  protected willUpdate() {
    super.willUpdate();
    this.now = Date.now();
  }
  protected entityIds() {
    return this.config?.items.map((item) => item.entity) ?? [];
  }
  getCardSize() {
    return 6 + (this.config?.items.length ?? 0);
  }
  private get text() {
    return maintenanceText(this.hass?.locale?.language);
  }
  private open(reading: MaintenanceReading) {
    this.dispatchEvent(
      new CustomEvent('hass-more-info', {
        detail: { entityId: reading.config.entity },
        bubbles: true,
        composed: true,
      }),
    );
  }
  private description(reading: MaintenanceReading) {
    const text = this.text;
    if (reading.status === 'unknown') return text.unknown;
    if (reading.value !== undefined)
      return text.remaining(
        new Intl.NumberFormat(this.hass?.locale?.language, {
          maximumFractionDigits: 0,
        }).format(reading.value),
      );
    if (reading.ageHours !== undefined)
      return text.ago(
        reading.ageHours >= 24
          ? text.days(Math.floor(reading.ageHours / 24))
          : durationText(
              Math.floor(reading.ageHours * 60),
              this.hass?.locale?.language,
            ),
      );
    if (reading.config.kind === 'update')
      return reading.status === 'healthy' ? text.updated : text.update;
    return reading.status === 'healthy'
      ? (reading.config.normal_text ?? text.healthy)
      : (reading.config.problem_text ?? this.text.attention);
  }
  private row(reading: MaintenanceReading, action = false) {
    const c = reading.config;
    const issue = reading.status !== 'healthy';
    const label = action
      ? reading.status === 'unknown'
        ? this.text.check(c.name)
        : c.action
      : c.name;
    const description = this.description(reading);
    return html`<button
      class=${`row ${reading.status}`}
      @click=${() => this.open(reading)}
      aria-label=${`${label}. ${description}. ${this.text.open(c.name)}`}
    >
      <ha-icon
        class=${action && issue ? 'marker' : ''}
        .icon=${action && issue ? (reading.status === 'unknown' ? 'mdi:help-circle-outline' : reading.status === 'urgent' ? 'mdi:alert-circle-outline' : 'mdi:alert-outline') : (c.icon ?? icons[c.category])}
        aria-hidden="true"
      ></ha-icon>
      <span class="label"
        ><strong>${label}</strong
        >${action ? html`<p>${[description, c.room].filter(Boolean).join(' · ')}</p>` : c.room ? html`<p>${c.room}</p>` : nothing}</span
      >
      ${action ? html`<ha-icon class="chevron" .icon=${'mdi:chevron-right'} aria-hidden="true"></ha-icon>` : html`<span class="value"><span>${description}</span>${reading.value !== undefined ? html`<progress max="100" value=${reading.value} aria-label=${`${c.name}: ${description}`}></progress>` : nothing}</span>`}
    </button>`;
  }
  protected render() {
    if (!this.config) return nothing;
    const text = this.text;
    const readings = maintenanceReadings(
      this.hass,
      this.config.items,
      this.now,
    );
    const issues = readings
      .filter((r) => r.status !== 'healthy')
      .sort((a, b) => maintenancePriority(a) - maintenancePriority(b));
    const urgent = issues.filter((r) => r.status === 'urgent').length;
    const warning = issues.filter((r) => r.status === 'warning').length;
    const unknown = issues.filter((r) => r.status === 'unknown').length;
    const groups = (['batteries', 'supplies', 'backups', 'devices'] as const)
      .map((category) => ({
        category,
        rows: readings
          .filter(
            (r) =>
              r.config.category === category ||
              (category === 'backups' && r.config.category === 'updates'),
          )
          .sort(
            (a, b) =>
              maintenancePriority(a) - maintenancePriority(b) ||
              (a.value ?? Infinity) - (b.value ?? Infinity),
          ),
      }))
      .filter((group) => group.rows.length);
    return html`<section
      class="dashboard"
      aria-label=${this.config.title ?? text.title}
    >
      <header class="intro">
        <h2>${this.config.title ?? text.title}</h2>
        <p>${text.subtitle}</p>
      </header>
      <ha-card class="summary"
        ><span class="icon-box tone-teal"
          ><ha-icon .icon=${'mdi:wrench-outline'} aria-hidden="true"></ha-icon
        ></span>
        <div>
          <strong
            >${urgent + warning ? text.count(urgent + warning) : unknown ? text.checking : text.allGood}</strong
          >
          <p>
            ${[urgent ? text.urgent(urgent) : '', warning ? text.soon(warning) : '', unknown ? text.unavailable(unknown) : ''].filter(Boolean).join(' · ') || text.allGoodDetail}
          </p>
        </div></ha-card
      >
      <div class="layout">
        <section>
          <h3>${text.attention}</h3>
          <ha-card class="rows"
            >${
              issues.length
                ? issues.map((r) => this.row(r, true))
                : html`<div class="empty">
                    <strong>${text.allGood}</strong>
                    <p>${text.allGoodDetail}</p>
                  </div>`
            }</ha-card
          >
        </section>
        <aside class="inventory" aria-label=${text.details}>
          ${groups.map(({ category, rows }) => {
            const flagged = rows.filter((r) => r.status !== 'healthy');
            const preview = rows.slice(0, 2);
            return html`<section>
              <div class="heading">
                <h3>
                  ${category === 'backups' ? text.backupsUpdates : text.categories[category]}
                </h3>
                <span class="count"
                  >${flagged.length ? text.flagged(flagged.length) : `${rows.length}`}</span
                >
              </div>
              <ha-card class="rows"
                >${preview.map((r) => this.row(r))}${
                  rows.length > 2
                    ? html`<details>
                        <summary>${text.details} (${rows.length - 2})</summary>
                        ${rows.slice(2).map((r) => this.row(r))}
                      </details>`
                    : nothing
                }</ha-card
              >
            </section>`;
          })}
        </aside>
      </div>
    </section>`;
  }
}
