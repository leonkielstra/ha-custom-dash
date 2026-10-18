import { RoomHeaderCard } from './cards/room-header';
import { SceneCard } from './cards/scenes';
import { LightControlCard } from './cards/light-control';
import { RoomLightingCard } from './cards/room-lighting';
import { DeviceCard } from './cards/device';

const cards = [
  [
    'home-room-header-card',
    RoomHeaderCard,
    'Room header',
    'Inline room readings and lighting summary.',
  ],
  [
    'home-scene-card',
    SceneCard,
    'Room scenes',
    'Compact, single-tap scene buttons.',
  ],
  [
    'home-light-control-card',
    LightControlCard,
    'Light control',
    'A light with an always-visible brightness slider.',
  ],
  [
    'home-room-lighting-card',
    RoomLightingCard,
    'Room lighting',
    'Explicit lights and room-level controls.',
  ],
  [
    'home-device-card',
    DeviceCard,
    'Media device',
    'Compact media state and primary action.',
  ],
] as const;
declare global {
  interface Window {
    customCards?: {
      type: string;
      name: string;
      description: string;
      preview: boolean;
    }[];
  }
}
window.customCards ??= [];
for (const [tag, component, name, description] of cards) {
  if (!customElements.get(tag)) customElements.define(tag, component);
  if (!window.customCards.some((card) => card.type === tag))
    window.customCards.push({ type: tag, name, description, preview: false });
}
