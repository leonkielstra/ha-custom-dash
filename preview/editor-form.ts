/** Preview fixture only: real HA supplies ha-form and its selectors. Not bundled. */
import { LitElement, html, css, nothing } from 'lit';
import type { FormField } from '../src/editor/types';
import type { HomeAssistant } from '../src/ha/types';
class EditorFormFixture extends LitElement {
  static properties = {
    hass: { attribute: false },
    data: { attribute: false },
    schema: { attribute: false },
    computeLabel: { attribute: false },
    computeHelper: { attribute: false },
  };
  static styles = css`
    :host {
      display: block;
      font: 14px system-ui;
      color: var(--primary-text-color, #242a27);
    }
    label {
      display: block;
      margin: 12px 0;
    }
    input,
    select {
      box-sizing: border-box;
      width: 100%;
      min-height: 44px;
      background: var(--card-background-color, #fff);
      color: inherit;
      border: 1px solid var(--divider-color, #ccc);
      border-radius: 8px;
      padding: 8px;
      font: inherit;
    }
    input[type='checkbox'] {
      width: 24px;
      min-height: 24px;
      vertical-align: middle;
      margin-right: 8px;
    }
    small {
      display: block;
      color: var(--secondary-text-color, #69716c);
      font-size: 12px;
      margin-top: 4px;
    }
    fieldset {
      border: 1px solid var(--divider-color, #ccc);
      border-radius: 12px;
      margin: 8px 0;
      padding: 8px;
    }
    button {
      min-width: 44px;
      min-height: 44px;
      font: inherit;
      border: 0;
      background: none;
      color: var(--primary-color, #397f79);
      cursor: pointer;
    }
    summary {
      padding: 12px 0;
      cursor: pointer;
    }
    input:focus-visible,
    button:focus-visible,
    select:focus-visible {
      outline: 2px solid var(--primary-color, #397f79);
      outline-offset: 2px;
    }
  `;
  hass?: HomeAssistant;
  data: Record<string, unknown> = {};
  schema: FormField[] = [];
  computeLabel: (field: { name: string }) => string = (field) => field.name;
  computeHelper: (field: { name: string }) => string = () => '';
  private change(name: string, value: unknown) {
    this.dispatchEvent(
      new CustomEvent('value-changed', {
        bubbles: true,
        composed: true,
        detail: { value: { ...this.data, [name]: value } },
      }),
    );
  }
  private field(field: FormField): unknown {
    if (field.schema)
      return html`<details ?open=${field.expanded}>
        <summary>${field.title}</summary>
        ${field.schema.map((f) => this.field(f))}
      </details>`;
    const selector = field.selector!;
    const value = this.data[field.name] ?? field.default;
    const label = this.computeLabel(field);
    if ('object' in selector) {
      const config = selector.object;
      const rows = (value ?? []) as Record<string, unknown>[];
      const schema = Object.entries(config.fields).map(([name, f]) => ({
        name,
        selector: f.selector,
        required: f.required,
        default: f.default,
      }));
      const update = (next: Record<string, unknown>[]) =>
        this.change(field.name, next);
      return html`<fieldset>
        <legend>${label}</legend>
        ${rows.map(
          (row, index) =>
            html`<fieldset>
              <ha-form
                .hass=${this.hass}
                .data=${row}
                .schema=${schema}
                .computeLabel=${(f: { name: string }) => config.fields[f.name]?.label ?? f.name}
                .computeHelper=${(f: { name: string }) => config.fields[f.name]?.description ?? ''}
                @value-changed=${(
                  event: CustomEvent<{ value: Record<string, unknown> }>,
                ) => {
                  event.stopPropagation();
                  const next = [...rows];
                  next[index] = event.detail.value;
                  update(next);
                }}
              ></ha-form
              ><button
                type="button"
                aria-label=${`Move up ${index + 1}`}
                ?disabled=${index === 0}
                @click=${() => {
                  const next = [...rows];
                  [next[index - 1], next[index]] = [
                    next[index]!,
                    next[index - 1]!,
                  ];
                  update(next);
                }}
              >
                ↑</button
              ><button
                type="button"
                aria-label=${`Remove ${index + 1}`}
                @click=${() => update(rows.filter((_, i) => i !== index))}
              >
                Remove
              </button>
            </fieldset>`,
        )}<button
          type="button"
          data-add-object=${field.name}
          @click=${() => update([...rows, Object.fromEntries(schema.filter((f) => f.default !== undefined).map((f) => [f.name, f.default]))])}
        >
          Add
        </button>
      </fieldset>`;
    }
    if ('boolean' in selector)
      return html`<label
        ><input
          type="checkbox"
          .checked=${value === true}
          @change=${(event: Event) => this.change(field.name, (event.target as HTMLInputElement).checked)}
        />${label}</label
      >`;
    if ('select' in selector)
      return html`<label
        >${label}<select
          .value=${String(value ?? '')}
          @change=${(event: Event) => this.change(field.name, (event.target as HTMLSelectElement).value)}
        >
          <option value="">—</option>
          ${selector.select.options.map((o) => html`<option .value=${o.value} ?selected=${String(value ?? '') === o.value}>${o.label}</option>`)}
        </select></label
      >`;
    if ('entity' in selector && !selector.entity.multiple) {
      const domain = selector.entity.filter?.domain;
      const ids = [
        ...new Set([
          ...(typeof value === 'string' && value ? [value] : []),
          ...Object.keys(this.hass?.states ?? {}).filter(
            (id) =>
              !domain ||
              (Array.isArray(domain) ? domain : [domain]).includes(
                id.split('.')[0]!,
              ),
          ),
        ]),
      ];
      return html`<label
        >${label}<select
          .value=${String(value ?? '')}
          @change=${(event: Event) => this.change(field.name, (event.target as HTMLSelectElement).value)}
        >
          <option value="">—</option>
          ${ids.map((id) => html`<option .value=${id} ?selected=${value === id}>${id}</option>`)}
        </select></label
      >`;
    }
    const multiple =
      ('text' in selector && selector.text.multiple) ||
      ('entity' in selector && selector.entity.multiple);
    return html`<label
      >${label}<input
        .type=${'number' in selector ? 'number' : 'text'}
        .value=${multiple ? ((value ?? []) as string[]).join(', ') : String(value ?? '')}
        @input=${(event: Event) => {
          const value = (event.target as HTMLInputElement).value;
          this.change(
            field.name,
            multiple
              ? value
                  .split(',')
                  .map((v) => v.trim())
                  .filter(Boolean)
              : 'number' in selector
                ? value === ''
                  ? ''
                  : Number(value)
                : value,
          );
        }}
      />${this.computeHelper(field) ? html`<small>${this.computeHelper(field)}</small>` : nothing}</label
    >`;
  }
  protected render() {
    return html`${this.schema.map((field) => this.field(field))}`;
  }
}
if (!customElements.get('ha-form'))
  customElements.define('ha-form', EditorFormFixture);
