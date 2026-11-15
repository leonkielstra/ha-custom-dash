import { css, html, nothing, type PropertyValues } from 'lit';
import { BaseCard } from '../ui/base-card';
import { headerConfig } from '../ha/config';
import { available, sensorValue } from '../ha/entities';
import type { HeaderConfig, HomeAssistant } from '../ha/types';
export class RoomHeaderCard extends BaseCard<HeaderConfig> {
  static readonly editorType = 'home-room-header-card' as const;
  static styles = [
    BaseCard.styles,
    css`
      ha-card {
        padding: 14px 16px;
        min-height: 108px;
        display: flex;
        gap: 16px;
        align-items: center;
      }
      .icon-box {
        width: 64px;
        height: 76px;
        flex-basis: 64px;
        color: var(--room-accent);
        background: var(--room-active);
        border-radius: 14px;
      }
      .icon-box ha-icon {
        width: 30px;
        height: 30px;
        --mdc-icon-size: 30px;
      }
      @media (max-width: 340px) {
        .icon-box {
          width: 56px;
          flex-basis: 56px;
        }
      }
      .readings {
        display: block;
        gap: 2px 7px;
        margin: 0;
        color: var(--room-muted);
      }
      .temperature {
        color: var(--room-text);
        font-size: 26px;
        line-height: 1.25;
        font-weight: 600;
        letter-spacing: -0.35px;
      }
      button.temperature {
        padding: 0;
        border: 0;
        background: none;
        cursor: pointer;
        font-family: inherit;
      }
      dialog {
        width: min(90vw, 600px);
        border: 0;
        border-radius: 14px;
        padding: 20px;
        color: var(--room-text);
        background: var(--card-background-color, white);
      }
      dialog::backdrop {
        background: rgb(0 0 0 / 0.5);
      }
      .humidity {
        display: block;
        margin-top: 3px;
        font-size: 13px;
      }
      .summary {
        font-size: var(--room-meta-size);
        line-height: 1.4;
        margin-top: 8px;
      }
      .count {
        color: var(--room-accent);
        font-weight: 600;
      }
      .room-name {
        margin-bottom: 2px;
        font-size: 13px;
        line-height: 1.3;
        font-weight: 600;
      }
      .content {
        min-width: 0;
        flex: 1;
      }
    `,
  ];
  private historyGeneration = 0;

  setConfig(value: unknown) {
    this.config = headerConfig(value);
  }
  protected entityIds() {
    return [
      this.config?.temperature,
      this.config?.humidity,
      ...(this.config?.lights ?? []),
    ].filter((v): v is string => !!v);
  }
  private async openHistory() {
    const dialog = this.renderRoot.querySelector('dialog');
    const container = this.renderRoot.querySelector('.history');
    if (!dialog || !container || !this.config?.temperature) return;
    if (!dialog.open) dialog.showModal();
    const generation = ++this.historyGeneration;
    container.replaceChildren();
    try {
      const helpers = await window.loadCardHelpers?.();
      if (!helpers) throw new Error('missing card helpers');
      if (
        generation !== this.historyGeneration ||
        !dialog.open ||
        !this.config?.temperature
      )
        return;
      const graph = helpers.createCardElement({
        type: 'history-graph',
        entities: [this.config.temperature, this.config.humidity].filter(
          Boolean,
        ),
      });
      graph.hass = this.hass;
      container.replaceChildren(graph);
    } catch {
      if (generation !== this.historyGeneration || !dialog.open) return;
      container.textContent = this.strings.historyError;
    }
  }
  protected shouldUpdate(changes: PropertyValues) {
    return changes.has('hass') || super.shouldUpdate(changes);
  }
  protected updated(changes: PropertyValues) {
    if (
      changes.has('config') &&
      this.renderRoot.querySelector('dialog')?.open
    ) {
      if (this.config?.temperature) void this.openHistory();
      else this.renderRoot.querySelector('dialog')?.close();
    }
    const graph = this.renderRoot.querySelector('.history > *') as
      (HTMLElement & { hass?: HomeAssistant }) | null;
    if (graph) graph.hass = this.hass;
  }
  protected render() {
    if (!this.config) return nothing;
    const c = this.config;
    const lights = c.lights ?? [];
    const count = lights.filter(
      (id) => this.hass?.states[id]?.state === 'on',
    ).length;
    const unavailable = lights.filter(
      (id) => !available(this.hass?.states[id]),
    ).length;
    const text = this.strings;
    return html`<ha-card>
      <div class="icon-box">
        <ha-icon
          .icon=${c.icon ?? 'mdi:sofa-outline'}
          aria-hidden="true"
        ></ha-icon>
      </div>
      <div class="content">
        ${c.show_name && c.name ? html`<p class="room-name">${c.name}</p>` : nothing}
        <p class="readings">
          ${c.temperature ? html`<button class="temperature" aria-label=${text.historyTitle} @click=${this.openHistory}>${sensorValue(this.hass, c.temperature, '°C')}</button>` : nothing}
          ${c.humidity ? html`<span class="humidity">${sensorValue(this.hass, c.humidity, '%')} ${text.humidity}</span>` : nothing}
        </p>
        ${lights.length ? html`<p class="summary">${html`<span class="count">${count}</span>${text.roomLightsOn(count).slice(String(count).length)}`}${unavailable ? html`<span class="muted"> · ${text.unavailableShort(unavailable)}</span>` : nothing}</p>` : nothing}
      </div>
      <dialog
        aria-label=${text.historyTitle}
        @close=${() => {
          this.historyGeneration++;
        }}
      >
        <button
          @click=${() => this.renderRoot.querySelector('dialog')?.close()}
        >
          ${text.close}
        </button>
        <div class="history"></div>
      </dialog>
    </ha-card>`;
  }
}
