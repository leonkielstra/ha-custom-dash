import { css } from 'lit';
export const sharedStyles = css`
  :host {
    --room-background: var(--home-room-background, #f7f5ef);
    --room-surface: var(--home-room-surface, #fffdf8);
    --room-secondary: var(--home-room-secondary, #eeece6);
    --room-text: var(--home-room-text, #242a27);
    --room-muted: var(--home-room-muted, #69716c);
    --room-accent: var(--home-room-accent, #397f79);
    --room-control: var(--home-room-control, #397f79);
    --room-active: var(--home-room-active, #e2f0ec);
    --room-border: var(--home-room-border, #e6e2d9);
    --room-hero-surface: var(--home-room-hero-surface, #faecd8);
    --room-sand: var(--home-room-sand, #95643e);
    --room-sand-surface: var(--home-room-sand-surface, #f7e8d7);
    --room-blue: var(--home-room-blue, #446782);
    --room-blue-surface: var(--home-room-blue-surface, #e2e9f0);
    --room-violet: var(--home-room-violet, #79697f);
    --room-violet-surface: var(--home-room-violet-surface, #ece5ed);
    --room-heading-size: 16px;
    --room-label-size: 14px;
    --room-meta-size: 12px;
    --room-error: var(--error-color, #ba1a1a);
    display: block;
    color: var(--room-text);
    font-family: var(
      --home-room-font-family,
      -apple-system,
      BlinkMacSystemFont,
      'Segoe UI',
      sans-serif
    );
    font-size: var(--room-label-size);
    line-height: 1.45;
    -webkit-tap-highlight-color: transparent;
  }
  :host([data-theme='dark']) {
    --room-background: var(--home-room-background, #141414);
    --room-surface: var(--home-room-surface, #242424);
    --room-secondary: var(--home-room-secondary, #353535);
    --room-text: var(--home-room-text, #f2f2f2);
    --room-muted: var(--home-room-muted, #a8a8a8);
    --room-accent: var(--home-room-accent, #76b9ae);
    --room-active: var(--home-room-active, #29453f);
    --room-border: var(--home-room-border, #363636);
    --room-hero-surface: var(--home-room-hero-surface, #242424);
    --room-sand: var(--home-room-sand, #e0ad7c);
    --room-sand-surface: var(--home-room-sand-surface, #493c2d);
    --room-blue: var(--home-room-blue, #a8c5da);
    --room-blue-surface: var(--home-room-blue-surface, #2c3d4c);
    --room-violet: var(--home-room-violet, #d2bed7);
    --room-violet-surface: var(--home-room-violet-surface, #413745);
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
    font-weight: 600;
    letter-spacing: -0.3px;
  }
  h3 {
    font-size: 15px;
    font-weight: 600;
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
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
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
    padding-top: 16px;
    margin-bottom: 8px;
    min-height: 48px;
  }
  .section-heading h3 {
    font-size: var(--room-heading-size);
    font-weight: 600;
  }
  .action {
    display: inline-flex;
    gap: 8px;
    align-items: center;
    min-height: 40px;
    padding: 6px 10px;
    position: relative;
    isolation: isolate;
    border: 0;
    background: transparent;
    color: var(--room-accent);
    font-size: 13px;
    font-weight: 550;
  }
  .action::before {
    content: '';
    position: absolute;
    z-index: -1;
    inset: 4px 0;
    background: var(--room-active);
    border-radius: 12px;
  }
  :host([data-theme='dark']) .action {
    color: #fffdf8;
  }
  :host([data-theme='dark']) .action::before {
    background: var(--room-control);
  }
  .tone-sand {
    --icon-color: var(--room-sand);
    --icon-surface: var(--room-sand-surface);
  }
  .tone-blue {
    --icon-color: var(--room-blue);
    --icon-surface: var(--room-blue-surface);
  }
  .tone-violet {
    --icon-color: var(--room-violet);
    --icon-surface: var(--room-violet-surface);
  }
  .tone-teal {
    --icon-color: var(--room-accent);
    --icon-surface: var(--room-active);
  }
  .icon-box {
    display: grid;
    place-items: center;
    flex: 0 0 44px;
    width: 44px;
    height: 44px;
    background: var(--icon-surface, var(--room-secondary));
    border-radius: 12px;
    color: var(--icon-color, var(--room-muted));
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
