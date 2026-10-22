import { LitElement, css, html, nothing } from 'lit';
import { cardForm, metricItemSchema, withEditorControls } from './forms';
import {
  cleanFields,
  editorType,
  fromEditorData,
  labelsToRows,
  rowsToLabels,
  toEditorData,
  type LabelRow,
} from './data';
import { cardStub, childStub } from './stubs';
import { editorLabel } from './strings';
import type { ConfigForm, EditorConfig, FormField } from './types';
import type { HomeAssistant } from '../ha/types';

/** A small adapter around HA's native ha-form. No services, YAML editor, or global listeners. */
export class HomeCardEditor extends LitElement {
  static properties = {
    hass: { attribute: false },
    lovelace: { attribute: false },
    config: { state: true },
    selected: { state: true },
    mappings: { state: true },
    mappingDirty: { state: true },
    newCardType: { state: true },
    otherType: { state: true },
  };
  static styles = css`
    :host {
      display: block;
      font-family: var(--primary-font-family, system-ui);
      color: var(--primary-text-color);
    }
    .collection {
      display: grid;
      gap: 8px;
      margin-top: 16px;
    }
    .row {
      display: flex;
      align-items: center;
      gap: 4px;
      border: 1px solid var(--divider-color, #ddd);
      border-radius: 12px;
      padding: 4px 8px;
    }
    .row .name {
      flex: 1;
      min-width: 0;
      overflow-wrap: anywhere;
    }
    .controls {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }
    button {
      min-height: 44px;
      min-width: 44px;
      padding: 8px;
      background: transparent;
      color: var(--primary-color, #397f79);
      border: 0;
      border-radius: 8px;
      font: inherit;
      cursor: pointer;
    }
    button:disabled {
      opacity: 0.35;
      cursor: default;
    }
    button:focus-visible,
    input:focus-visible,
    select:focus-visible {
      outline: 2px solid var(--primary-color, #397f79);
      outline-offset: 2px;
    }
    .details {
      padding: 12px;
      border: 1px solid var(--divider-color, #ddd);
      border-radius: 12px;
    }
    .mapping {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-top: 8px;
    }
    .mapping ha-form {
      flex: 1;
      min-width: 0;
    }
    h3 {
      font-size: 16px;
      margin: 16px 0 8px;
      font-weight: 600;
    }
    .hint {
      font-size: 13px;
      color: var(--secondary-text-color);
    }
    .error {
      color: var(--error-color, #ba1a1a);
      font-size: 13px;
    }
    select,
    input {
      box-sizing: border-box;
      width: 100%;
      min-height: 44px;
      background: var(--card-background-color, #fff);
      color: inherit;
      border: 1px solid var(--divider-color, #ddd);
      border-radius: 8px;
      padding: 8px;
      font: inherit;
      margin-top: 6px;
    }
    @media (max-width: 420px) {
      .row {
        flex-wrap: wrap;
      }
      .row .name {
        flex-basis: 100%;
      }
    }
  `;
  hass?: HomeAssistant;
  lovelace?: unknown;
  private config?: EditorConfig;
  private selected = 0;
  private mappings: LabelRow[] = [];
  private mappingDirty = false;
  private newCardType = 'markdown';
  private otherType = '';
  private t = (key: string) => editorLabel(key, this.hass?.locale?.language);
  setConfig(value: EditorConfig) {
    editorType(value);
    // Preserve in-progress dictionary rows when HA echoes our own change back.
    if (JSON.stringify(value) !== JSON.stringify(this.config)) {
      this.config = structuredClone(value);
      this.selected = 0;
      this.resetMappings();
    }
  }
  private form(): ConfigForm {
    const type = editorType(this.config!);
    const component = customElements.get(type) as
      | (CustomElementConstructor & {
          getConfigForm?: (language?: string) => ConfigForm;
        })
      | undefined;
    return withEditorControls(
      component?.getConfigForm?.(this.hass?.locale?.language) ??
        cardForm(type, this.hass?.locale?.language),
      this.hass?.locale?.language,
    );
  }
  private emit(config: EditorConfig) {
    this.config = config;
    this.dispatchEvent(
      new CustomEvent('config-changed', {
        detail: { config: structuredClone(config) },
        bubbles: true,
        composed: true,
      }),
    );
  }
  private changed(event: CustomEvent<{ value: Record<string, unknown> }>) {
    event.stopPropagation();
    this.emit(
      fromEditorData(this.config!, event.detail.value, this.form().schema),
    );
  }
  private renderForm(
    data: Record<string, unknown>,
    schema: FormField[],
    changed: (event: CustomEvent<{ value: Record<string, unknown> }>) => void,
  ) {
    const form = this.form();
    return html`<ha-form
      .hass=${this.hass}
      .data=${data}
      .schema=${schema}
      .computeLabel=${form.computeLabel}
      .computeHelper=${form.computeHelper}
      @value-changed=${changed}
    ></ha-form>`;
  }
  private get items(): Record<string, unknown>[] {
    return (
      Array.isArray(this.config?.items) ? this.config.items : []
    ) as Record<string, unknown>[];
  }
  private resetMappings() {
    this.mappings = labelsToRows(this.items[this.selected]?.state_labels);
    this.mappingDirty = false;
  }
  private changeItem(index: number, value: Record<string, unknown>) {
    const items = [...this.items];
    items[index] = {
      ...items[index],
      ...cleanFields(value, metricItemSchema()),
    };
    // Explicit optional clears must remove old values, while unknown item options survive.
    for (const f of metricItemSchema())
      if (f.name in value && !(f.name in cleanFields(value, [f])))
        delete items[index]![f.name];
    this.emit({ ...this.config!, items });
  }
  private changeMapping(
    index: number,
    event: CustomEvent<{ value: Record<string, unknown> }>,
  ) {
    event.stopPropagation();
    const rows = [...this.mappings];
    rows[index] = {
      state: String(event.detail.value.state ?? ''),
      label: String(event.detail.value.label ?? ''),
    };
    this.mappings = rows;
    this.mappingDirty = true;
    this.saveMappings();
  }
  private saveMappings() {
    const labels = rowsToLabels(this.mappings);
    if (labels === undefined) return;
    const items = [...this.items];
    const item = { ...items[this.selected] };
    if (Object.keys(labels).length) item.state_labels = labels;
    else delete item.state_labels;
    items[this.selected] = item;
    this.mappingDirty = false;
    this.emit({ ...this.config!, items });
  }
  private editItem(index: number) {
    this.selected = index;
    this.resetMappings();
  }
  private move(key: 'cards' | 'items', index: number, delta: number) {
    const list = [...((this.config![key] ?? []) as Record<string, unknown>[])];
    const next = index + delta;
    if (next < 0 || next >= list.length) return;
    [list[index], list[next]] = [list[next]!, list[index]!];
    if (key === 'items') {
      if (this.selected === index) this.selected = next;
      else if (this.selected === next) this.selected = index;
    }
    this.emit({ ...this.config!, [key]: list });
  }
  private removeEntry(key: 'cards' | 'items', index: number) {
    const list = [...((this.config![key] ?? []) as Record<string, unknown>[])];
    list.splice(index, 1);
    this.emit({ ...this.config!, [key]: list });
    if (key === 'items') {
      if (index < this.selected) this.selected--;
      else if (index === this.selected) {
        this.selected = Math.max(0, Math.min(this.selected, list.length - 1));
        this.resetMappings();
      }
    }
  }
  private controls(key: 'cards' | 'items', index: number, count: number) {
    const name =
      key === 'items'
        ? this.items[index]?.name
        : (this.config!.cards as Record<string, unknown>[])[index]?.type;
    return html`<span class="controls"
      ><button
        type="button"
        data-action="up"
        aria-label=${`${this.t('up')}: ${name}`}
        ?disabled=${index === 0}
        @click=${() => this.move(key, index, -1)}
      >
        ↑</button
      ><button
        type="button"
        data-action="down"
        aria-label=${`${this.t('down')}: ${name}`}
        ?disabled=${index === count - 1}
        @click=${() => this.move(key, index, 1)}
      >
        ↓</button
      ><button
        type="button"
        data-action="remove"
        aria-label=${`${this.t('remove')}: ${name}`}
        @click=${() => this.removeEntry(key, index)}
      >
        ${this.t('remove')}
      </button></span
    >`;
  }
  private metricItems() {
    const selected = this.items[this.selected];
    return html`<div class="collection">
      <h3>${this.t('items')}</h3>
      ${this.items.map((item, index) => html`<div class="row"><span class="name">${String(item.name ?? item.entity ?? '')}</span><button type="button" data-action="edit-item" @click=${() => this.editItem(index)}>${this.t('edit')}</button>${this.controls('items', index, this.items.length)}</div>`)}
      <button
        type="button"
        data-action="add-item"
        @click=${() => {
          const item = (
            cardStub('home-metric-card', this.hass).items as Record<
              string,
              unknown
            >[]
          )[0]!;
          this.emit({ ...this.config!, items: [...this.items, item] });
          this.editItem(this.items.length - 1);
        }}
      >
        ${this.t('add')}
      </button>
      ${
        selected
          ? html`<div class="details">
              ${this.renderForm(
                selected,
                metricItemSchema(this.hass?.locale?.language),
                (event) => {
                  event.stopPropagation();
                  this.changeItem(this.selected, event.detail.value);
                },
              )}
              <h3>${this.t('state_labels')}</h3>
              ${this.mappings.map(
                (row, index) =>
                  html`<div class="mapping">
                    ${this.renderForm(
                      { ...row },
                      [
                        {
                          name: 'state',
                          required: true,
                          selector: { text: {} },
                        },
                        {
                          name: 'label',
                          required: true,
                          selector: { text: {} },
                        },
                      ],
                      (event) => this.changeMapping(index, event),
                    )}<button
                      type="button"
                      data-action="remove-mapping"
                      aria-label=${this.t('remove')}
                      @click=${() => {
                        this.mappings = this.mappings.filter(
                          (_, i) => i !== index,
                        );
                        this.mappingDirty = true;
                        this.saveMappings();
                      }}
                    >
                      ${this.t('remove')}
                    </button>
                  </div>`,
              )}
              <button
                type="button"
                data-action="add-mapping"
                @click=${() => {
                  this.mappings = [...this.mappings, { state: '', label: '' }];
                  this.mappingDirty = true;
                }}
              >
                ${this.t('add_mapping')}
              </button>
              ${this.mappingDirty ? html`<p class="error" role="status">${this.t('mapping_error')}</p>` : nothing}
            </div>`
          : nothing
      }
    </div>`;
  }
  private editChild(index: number) {
    const config = (this.config!.cards as Record<string, unknown>[])[index];
    this.dispatchEvent(
      new CustomEvent('edit-sub-element', {
        bubbles: true,
        composed: true,
        detail: {
          type: 'card',
          config: structuredClone(config),
          saveConfig: (value: Record<string, unknown>) => {
            const cards = [
              ...(this.config!.cards as Record<string, unknown>[]),
            ];
            cards[index] = value;
            this.emit({ ...this.config!, cards });
          },
        },
      }),
    );
  }
  private childCards() {
    const cards = (this.config!.cards ?? []) as Record<string, unknown>[];
    const types = [
      'markdown',
      'tile',
      'entities',
      'media-control',
      'button',
      'history-graph',
      'grid',
      'vertical-stack',
      ...(window.customCards ?? []).map((card) => `custom:${card.type}`),
    ];
    return html`<div class="collection">
      <h3>${this.t('cards')}</h3>
      <p class="hint">${this.t('nested_hint')}</p>
      ${cards.map((card, index) => html`<div class="row"><span class="name">${String(card.title ?? card.name ?? card.type)}</span><button type="button" data-action="edit-child" @click=${() => this.editChild(index)}>${this.t('edit')}</button>${this.controls('cards', index, cards.length)}</div>`)}
      <label
        >${this.t('card_type')}<select
          .value=${this.newCardType}
          @change=${(e: Event) => {
            this.newCardType = (e.target as HTMLSelectElement).value;
          }}
        >
          ${types.map((type) => html`<option .value=${type}>${type}</option>`)}
          <option value="other">${this.t('other')}</option>
        </select></label
      >
      ${
        this.newCardType === 'other'
          ? html`<label
              >${this.t('card_type')}<input
                .value=${this.otherType}
                placeholder="custom:example-card"
                @input=${(e: Event) => {
                  this.otherType = (e.target as HTMLInputElement).value;
                }}
            /></label>`
          : nothing
      }
      <button
        type="button"
        data-action="add-child"
        ?disabled=${this.newCardType === 'other' && !this.otherType.trim()}
        @click=${() => {
          const type =
            this.newCardType === 'other'
              ? this.otherType.trim()
              : this.newCardType;
          const child = types.includes(type)
            ? childStub(type, this.hass)
            : { type };
          this.emit({ ...this.config!, cards: [...cards, child] });
          this.editChild(cards.length);
        }}
      >
        ${this.t('add')}
      </button>
    </div>`;
  }
  protected render() {
    if (!this.config) return nothing;
    const type = editorType(this.config);
    return html`${this.renderForm(toEditorData(this.config), this.form().schema, (event) => this.changed(event))}${type === 'home-metric-card' ? this.metricItems() : type === 'home-section-card' ? this.childCards() : nothing}`;
  }
}
if (!customElements.get('home-card-editor'))
  customElements.define('home-card-editor', HomeCardEditor);
