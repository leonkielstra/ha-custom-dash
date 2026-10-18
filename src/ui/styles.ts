import { css } from 'lit';
export const sharedStyles = css`
  :host {
    --room-background: var(
      --home-room-background,
      var(--primary-background-color, #f7f6f2)
    );
    --room-surface: var(
      --home-room-surface,
      var(--ha-card-background, var(--card-background-color, #fff))
    );
    --room-secondary: var(--home-room-secondary, #edece7);
    --room-text: var(--home-room-text, var(--primary-text-color, #242a27));
    --room-muted: var(--home-room-muted, #626c65);
    --room-accent: var(--home-room-accent, #397f79);
    --room-active: var(--home-room-active, #e2f0ec);
    --room-border: var(--home-room-border, #e7e5df);
    --room-error: var(--error-color, #ba1a1a);
    display: block;
    color: var(--room-text);
    font-family: var(
      --primary-font-family,
      -apple-system,
      BlinkMacSystemFont,
      'Segoe UI',
      sans-serif
    );
    font-size: 14px;
    line-height: 1.45;
    -webkit-tap-highlight-color: transparent;
  }
  :host([data-theme='dark']) {
    --room-background: var(--home-room-background, #141414);
    --room-surface: var(--home-room-surface, #242424);
    --room-secondary: var(--home-room-secondary, #303030);
    --room-text: var(--home-room-text, #f2f2f2);
    --room-muted: var(--home-room-muted, #a8a8a8);
    --room-accent: var(--home-room-accent, #76b9ae);
    --room-active: var(--home-room-active, #29453f);
    --room-border: var(--home-room-border, #363636);
    --room-error: var(--error-color, #ffb4ab);
  }
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }
  ha-card {
    display: block;
    background: var(--room-surface);
    color: var(--room-text);
    border: none;
    border-radius: 16px;
    box-shadow: none;
  }
  h2,
  h3,
  p {
    margin: 0;
  }
  h2 {
    font-size: 18px;
    font-weight: 650;
    letter-spacing: -0.3px;
  }
  h3 {
    font-size: 15px;
    font-weight: 650;
  }
  button,
  input {
    font: inherit;
  }
  button {
    color: inherit;
    cursor: pointer;
    touch-action: manipulation;
  }
  button:disabled {
    cursor: default;
    opacity: 0.55;
  }
  button:focus-visible,
  input:focus-visible {
    outline: 3px solid var(--room-accent);
    outline-offset: 3px;
  }
  button {
    border: 0;
    background: transparent;
    min-height: 44px;
    min-width: 44px;
    border-radius: 12px;
  }
  button:hover:not(:disabled) {
    background: var(--room-active);
  }
  .muted {
    color: var(--room-muted);
  }
  .error {
    color: var(--room-error);
    font-size: 13px;
    padding-top: 8px;
  }
  .section-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 8px;
    min-height: 36px;
  }
  .section-heading h3 {
    font-size: 17px;
    font-weight: 620;
  }
  .action {
    display: inline-flex;
    gap: 8px;
    align-items: center;
    min-height: 40px;
    padding: 6px 10px;
    border: 1px solid var(--room-border);
    background: transparent;
    color: var(--room-accent);
    font-size: 13px;
    font-weight: 550;
  }
  .icon-box {
    display: grid;
    place-items: center;
    flex: 0 0 44px;
    width: 44px;
    height: 44px;
    background: var(--room-secondary);
    border-radius: 12px;
    color: var(--room-muted);
  }
  .active .icon-box {
    color: var(--room-accent);
    background: var(--room-active);
  }
  ha-icon {
    display: inline-flex;
    width: 24px;
    height: 24px;
    --mdc-icon-size: 24px;
    flex-shrink: 0;
  }
  .name {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  @media (prefers-reduced-motion: no-preference) {
    button {
      transition:
        background 120ms ease,
        opacity 120ms ease;
    }
  }
`;
