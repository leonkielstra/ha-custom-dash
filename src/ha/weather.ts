import type { HassEntity } from './types';
import { available } from './entities';
import { ui } from '../i18n/strings';

export function weatherLabel(
  entity: HassEntity | undefined,
  language?: string,
): string {
  const text = ui(language);
  if (!available(entity)) return text.unavailable;
  return text.weatherStates[entity.state] ?? text.unknown;
}
