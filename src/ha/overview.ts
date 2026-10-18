import type { HomeAssistant } from './types';

export function roomLights(
  hass: HomeAssistant | undefined,
  ids: string[] = [],
) {
  let on = 0;
  let unavailable = 0;
  for (const id of new Set(ids)) {
    const state = hass?.states[id]?.state;
    if (state === 'on') on++;
    else if (state !== 'off') unavailable++;
  }
  return { on, unavailable };
}
