import { expect, test } from '@playwright/test';

test('section spans allocate full width to room controls and collapse on mobile', async ({
  page,
}) => {
  await page.goto('/preview/sections.html?bundle=1');
  for (const width of [390, 1440, 320]) {
    await page.setViewportSize({ width, height: 1100 });
    const lighting = page.locator('home-room-lighting-card');
    const section = lighting.locator('xpath=../..');
    const sectionBox = (await section.boundingBox())!;
    const cardBox = (await lighting.boundingBox())!;
    expect(cardBox.width).toBeCloseTo(sectionBox.width, 0);
    const lights = lighting.locator('home-light-control-card');
    const first = (await lights.nth(0).boundingBox())!;
    const second = (await lights.nth(1).boundingBox())!;
    if (width === 1440) {
      expect(cardBox.width).toBeGreaterThan(600);
      expect(first.y).toBeCloseTo(second.y, 0);
      expect(second.x).toBeGreaterThan(first.x);
      const view = (await page.locator('.sections-view').boundingBox())!;
      expect(view.x + view.width / 2).toBeCloseTo(width / 2, 0);
    } else {
      expect(first.x).toBeCloseTo(second.x, 0);
      expect(second.y).toBeGreaterThan(first.y);
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page
      .locator('.sections-view')
      .screenshot({ path: `test-results/sections-room-${width}-dark.png` });
  }
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.locator('#theme').selectOption('light');
  await page
    .locator('.sections-view')
    .screenshot({ path: 'test-results/sections-room-1440-light.png' });
});

test('Home floors use multiple desktop sections while room shortcuts stay half-width', async ({
  page,
}) => {
  await page.goto('/preview/sections.html?bundle=1');
  await page.locator('#view').selectOption('home');
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 1100 });
    const sections = page.locator('.layout-section');
    const first = (await sections.nth(0).boundingBox())!;
    const second = (await sections.nth(1).boundingBox())!;
    if (width === 1440) {
      expect(second.y).toBe(first.y);
      expect(second.x).toBeGreaterThan(first.x);
    } else {
      expect(second.x).toBe(first.x);
      expect(second.y).toBeGreaterThan(first.y);
    }
    const rooms = page.locator('home-room-card');
    const a = (await rooms.nth(0).boundingBox())!;
    const b = (await rooms.nth(1).boundingBox())!;
    expect(a.y).toBe(b.y);
    expect(b.x).toBeGreaterThan(a.x);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page
      .locator('.sections-view')
      .screenshot({ path: `test-results/sections-home-${width}-dark.png` });
  }
});
