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

test('Home keeps each floor in a compact section across screen widths', async ({
  page,
}) => {
  await page.goto('/preview/sections.html?bundle=1');
  await page.locator('#view').selectOption('home');
  for (const width of [320, 393, 768, 1440]) {
    await page.setViewportSize({ width, height: 1100 });
    const sections = page.locator('.layout-section');
    await expect(sections).toHaveCount(5);
    const floors = page.locator('.room-navigation');
    await expect(floors.locator('.section-heading h3')).toHaveText([
      'Begane grond',
      'Eerste verdieping',
      'Tweede verdieping',
      'Buiten',
    ]);
    const rooms = floors.locator('home-room-card');
    await expect(rooms).toHaveCount(12);
    const a = (await rooms.nth(0).boundingBox())!;
    const b = (await rooms.nth(1).boundingBox())!;
    expect(b.y).toBeGreaterThan(a.y);
    expect(b.x).toBe(a.x);
    await expect(rooms.first()).toContainText('20,4°C');
    await expect(rooms.first().getByRole('link')).toHaveAttribute(
      'href',
      /woonkamer/,
    );
    if (width === 1440) {
      expect((await floors.nth(1).boundingBox())!.x).toBeGreaterThan(
        (await floors.nth(0).boundingBox())!.x,
      );
    }
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
