import {
  LitElement,
  type PropertyValues,
  type CSSResultGroup,
  html,
  nothing,
} from 'lit';
import type { CardConfig, HomeAssistant } from '../ha/types';
import { sharedStyles } from './styles';
import { localizedError, ui } from '../i18n/strings';
export abstract class BaseCard<C extends CardConfig> extends LitElement {
  static properties = {
    hass: { attribute: false },
    config: { state: true },
    busy: { state: true },
    error: { state: true },
  };
  static styles: CSSResultGroup = sharedStyles;
  hass?: HomeAssistant;
  protected config?: C;
  protected busy = false;
  protected error = '';
  protected get strings() {
    return ui(this.hass?.locale?.language);
  }
  abstract setConfig(config: unknown): void;
  protected abstract entityIds(): string[];
  getCardSize() {
    return 2;
  }
  getGridOptions(): {
    columns: number | 'full';
    min_columns: number;
    rows: string;
  } {
    // A widened Sections section has 24+ cells. Twelve only fills half of it.
    return { columns: 'full', min_columns: 6, rows: 'auto' };
  }
  protected shouldUpdate(changes: PropertyValues): boolean {
    if (changes.size !== 1 || !changes.has('hass')) return true;
    const previous = changes.get('hass') as HomeAssistant | undefined;
    return (
      !previous ||
      previous.themes?.darkMode !== this.hass?.themes?.darkMode ||
      previous.locale?.language !== this.hass?.locale?.language ||
      this.entityIds().some(
        (id) => previous.states[id] !== this.hass?.states[id],
      )
    );
  }
  protected willUpdate() {
    const theme = this.config?.theme ?? 'auto';
    this.setAttribute(
      'data-theme',
      theme === 'auto'
        ? this.hass?.themes?.darkMode
          ? 'dark'
          : 'light'
        : theme,
    );
  }
  protected async perform(action: () => Promise<unknown>) {
    if (this.busy) return;
    this.busy = true;
    this.error = '';
    try {
      await action();
    } catch {
      this.error = 'Action failed. Please try again.';
    } finally {
      this.busy = false;
    }
  }
  protected errorMessage() {
    return this.error
      ? html`<p class="error" role="alert">
          ${localizedError(this.error, this.hass?.locale?.language)}
        </p>`
      : nothing;
  }
}
