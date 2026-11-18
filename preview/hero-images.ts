import { hero } from './home-fixtures';

// Local household images stay outside the published library and tracked fixtures.
export async function previewHero() {
  if (new URLSearchParams(location.search).has('fixtures')) return hero;
  const image_day = '/local/ha-config/www/images/dashboard/home-day-v2.png';
  const image_night = '/local/ha-config/www/images/dashboard/home-night-v2.png';
  try {
    const responses = await Promise.all(
      [image_day, image_night].map((url) => fetch(url, { method: 'HEAD' })),
    );
    if (
      responses.every(
        (response) =>
          response.ok &&
          response.headers.get('content-type')?.startsWith('image/'),
      )
    )
      return { ...hero, image_day, image_night };
  } catch {
    // The fictional images remain usable when the private configuration is absent.
  }
  return hero;
}
