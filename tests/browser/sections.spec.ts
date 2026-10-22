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

test('Home keeps every floor in the right navigation region and collapses below the summary on mobile', async ({
  page,
}) => {
  await page.goto('/preview/sections.html?bundle=1');
  await page.locator('#view').selectOption('home');
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1100 });
    const sections = page.locator('.layout-section');
    await expect(sections).toHaveCount(2);
    const first = (await sections.nth(0).boundingBox())!;
    const second = (await sections.nth(1).boundingBox())!;
    if (width === 1440) {
      expect(second.y).toBe(first.y);
      expect(second.x).toBeGreaterThan(first.x);
    } else {
      expect(second.x).toBe(first.x);
      expect(second.y).toBeGreaterThan(first.y);
    }
    const navigation = page.locator('.room-navigation');
    await expect(navigation.getByRole('heading', { level: 2 })).toHaveText([
      'Begane grond',
      'Eerste verdieping',
      'Tweede verdieping',
      'Buiten',
    ]);
    const rooms = navigation.locator('home-room-card');
    await expect(rooms).toHaveCount(12);
    await expect(navigation.locator('.navigation-grid')).toHaveCount(4);
    if (width === 1440) {
      for (const heading of await navigation
        .getByRole('heading', { level: 2 })
        .all()) {
        expect((await heading.boundingBox())!.x).toBeCloseTo(second.x, 0);
      }
      const card = rooms.first();
      const label = (await card.locator('.name').boundingBox())!;
      const temperature = (await card.locator('.temperature').boundingBox())!;
      expect(temperature.x).toBeGreaterThan(label.x + label.width);
      expect(
        await card
          .locator('.name')
          .evaluate((e) => getComputedStyle(e).fontSize),
      ).toBe('15px');
      const headingPositions = await navigation
        .getByRole('heading', { level: 2 })
        .evaluateAll((elements) =>
          elements.map((e) => e.getBoundingClientRect().y),
        );
      await page
        .locator('home-activity-section-card')
        .evaluate((e) => e.remove());
      expect(
        await navigation
          .getByRole('heading', { level: 2 })
          .evaluateAll((elements) =>
            elements.map((e) => e.getBoundingClientRect().y),
          ),
      ).toEqual(headingPositions);
    } else if (width < 672) {
      const card = rooms.first();
      const label = (await card.locator('.name').boundingBox())!;
      const temperature = (await card.locator('.temperature').boundingBox())!;
      expect(temperature.y).toBeGreaterThan(label.y);
      expect(
        await card
          .locator('.name')
          .evaluate((e) => getComputedStyle(e).fontSize),
      ).toBe('13px');
    }
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

test('Home desktop composition stays consistent in light mode', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto('/preview/sections.html?bundle=1');
  await page.locator('#view').selectOption('home');
  await page.locator('#theme').selectOption('light');
  const navigation = page.locator('.room-navigation');
  await expect(navigation.locator('home-room-card')).toHaveCount(12);
  for (const card of await navigation.locator('home-room-card').all()) {
    expect((await card.boundingBox())!.height).toBeLessThanOrEqual(100);
  }
  await page
    .locator('.sections-view')
    .screenshot({ path: 'test-results/sections-home-1440-light.png' });
});
