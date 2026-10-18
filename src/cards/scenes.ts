import { css, html, nothing } from 'lit';
import { BaseCard } from '../ui/base-card';
import { scenesConfig } from '../ha/config';
import { available, nameOf } from '../ha/entities';
import type { ScenesConfig } from '../ha/types';
export class SceneCard extends BaseCard<ScenesConfig> {
  static properties = { ...BaseCard.properties, activated: { state: true } };
  static styles = [
    BaseCard.styles,
    css`
      .scenes {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(76px, 1fr));
        gap: 8px;
      }
      button {
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        gap: 4px;
        padding: 8px 6px;
        min-height: 68px;
        background: var(--room-surface);
      }
      button span {
        max-width: 100%;
        overflow-wrap: anywhere;
        font-size: 13px;
        font-weight: 600;
      }
      button ha-icon {
        color: var(--room-accent);
        width: 21px;
        height: 21px;
        --mdc-icon-size: 21px;
      }
      .feedback {
        font-size: 12px;
        color: var(--room-muted);
        margin-top: 0;
      }
    `,
  ];
  private activated = '';
  setConfig(value: unknown) {
    this.config = scenesConfig(value);
  }
  protected entityIds() {
    return this.config?.scenes.map((v) => v.entity) ?? [];
  }
  private async activate(id: string, name: string) {
    this.activated = '';
    await this.perform(async () => {
      if (!this.hass) return;
      await this.hass.callService('scene', 'turn_on', { entity_id: id });
      this.activated = this.strings.activated(name);
    });
  }
  protected render() {
    if (!this.config) return nothing;
    const text = this.strings;
    return html`<section aria-label=${this.config.title ?? text.scenes}>
      <div class="section-heading">
        <h3>${this.config.title ?? text.scenes}</h3>
      </div>
      <div class="scenes">
        ${this.config.scenes.map((item) => {
          const entity = this.hass?.states[item.entity];
          const name = nameOf(
            entity,
            item.name ?? (entity ? undefined : item.entity),
          );
          return html`<button
            ?disabled=${this.busy || !available(entity)}
            @click=${() => this.activate(item.entity, name)}
            aria-label=${text.activate(name)}
          >
            <ha-icon
              .icon=${item.icon ?? 'mdi:palette-outline'}
              aria-hidden="true"
            ></ha-icon
            ><span>${name}</span>
          </button>`;
        })}
      </div>
      <p class="feedback" role="status">
        ${this.busy ? text.activating : this.activated}
      </p>
      ${this.errorMessage()}
    </section>`;
  }
}
