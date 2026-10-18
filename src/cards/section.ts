import { css, html, nothing, type PropertyValues } from 'lit';
import { BaseCard } from '../ui/base-card';
import { sectionConfig } from '../ha/config';
import type {
  HomeAssistant,
  LovelaceCardConfig,
  SectionConfig,
} from '../ha/types';

interface LovelaceChildCard extends HTMLElement {
  hass?: HomeAssistant;
  getCardSize?: () => number;
}

interface CardHelpers {
  createCardElement(config: LovelaceCardConfig): LovelaceChildCard;
}

declare global {
  interface Window {
    loadCardHelpers?: () => Promise<CardHelpers>;
  }
}

export class SectionCard extends BaseCard<SectionConfig> {
  static styles = [
    BaseCard.styles,
    css`
      .content {
        display: grid;
        gap: 8px;
        min-width: 0;
      }
      .content > * {
        min-width: 0;
      }
    `,
  ];

  private childCards: LovelaceChildCard[] = [];
  private renderGeneration = 0;

  setConfig(value: unknown) {
    this.config = sectionConfig(value);
  }

  protected entityIds() {
    return [];
  }

  protected shouldUpdate(changes: PropertyValues) {
    return changes.has('hass') || super.shouldUpdate(changes);
  }

  protected updated(changes: PropertyValues) {
    if (changes.has('config')) void this.createChildCards();
    this.mountChildCards();
    if (changes.has('hass')) this.syncChildHass();
  }

  getCardSize() {
    return (
      1 +
      this.childCards.reduce(
        (size, card) => size + (card.getCardSize?.() ?? 2),
        0,
      )
    );
  }

  private async createChildCards() {
    if (!this.config) return;
    const generation = ++this.renderGeneration;
    this.error = '';
    try {
      const helpers = await window.loadCardHelpers?.();
      if (!helpers) throw new Error('missing card helpers');
      const cards = this.config.cards.map((config) =>
        helpers.createCardElement(config),
      );
      if (generation !== this.renderGeneration) return;
      this.childCards = cards;
      this.requestUpdate();
    } catch {
      if (generation !== this.renderGeneration) return;
      this.childCards = [];
      this.error = this.strings.sectionCardError;
    }
  }

  private mountChildCards() {
    const container = this.renderRoot.querySelector('.content');
    if (!container) return;
    const current = [...container.children];
    if (
      current.length !== this.childCards.length ||
      this.childCards.some((card, index) => current[index] !== card)
    ) {
      container.replaceChildren(...this.childCards);
    }
    this.syncChildHass();
  }

  private syncChildHass() {
    for (const card of this.childCards) card.hass = this.hass;
  }

  protected render() {
    if (!this.config) return nothing;
    return html`<section aria-label=${this.config.title}>
      <div class="section-heading">
        <h3>${this.config.title}</h3>
      </div>
      <div class="content"></div>
      ${this.errorMessage()}
    </section>`;
  }
}
