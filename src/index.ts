import { RoomHeaderCard } from './cards/room-header';
import { SceneCard } from './cards/scenes';
import { LightControlCard } from './cards/light-control';
import { RoomLightingCard } from './cards/room-lighting';
import { DeviceCard } from './cards/device';
import { SectionCard } from './cards/section';
import { HomeHeroCard } from './cards/home-hero';
import { RoomCard } from './cards/room';
import { ActivitySectionCard } from './cards/activity-section';
import { ui } from './i18n/strings';

const text = ui(
  typeof navigator === 'undefined' ? undefined : navigator.language,
);
const cards = [
  ['home-hero-card', HomeHeroCard, text.heroCard, text.heroDescription],
  ['home-room-card', RoomCard, text.roomCard, text.roomDescription],
  [
    'home-activity-section-card',
    ActivitySectionCard,
    text.activityCard,
    text.activityDescription,
  ],
  [
    'home-room-header-card',
    RoomHeaderCard,
    text.roomHeaderCard,
    text.roomHeaderDescription,
  ],
  ['home-scene-card', SceneCard, text.sceneCard, text.sceneDescription],
  [
    'home-light-control-card',
    LightControlCard,
    text.lightCard,
    text.lightDescription,
  ],
  [
    'home-room-lighting-card',
    RoomLightingCard,
    text.lightingCard,
    text.lightingDescription,
  ],
  ['home-device-card', DeviceCard, text.deviceCard, text.deviceDescription],
  ['home-section-card', SectionCard, text.sectionCard, text.sectionDescription],
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
