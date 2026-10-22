import { test, expect } from '@playwright/test';
test('maintenance matches the mockup across themes, supports details and keeps unknown readings visible', async ({
  page,
}) => {
  await page.goto('/preview/maintenance.html?bundle=1');
  const card = page.locator('home-maintenance-card');
  await expect(card).toContainText('4 aandachtspunten');
  await expect(card).toContainText('Controleer de lekkage in het washok');
  for (const [width, theme] of [
    [390, 'light'],
    [390, 'dark'],
    [320, 'dark'],
    [1100, 'light'],
    [1100, 'dark'],
  ] as const) {
    await page.setViewportSize({ width, height: 1000 });
    await page.locator('#theme').selectOption(theme);
    await expect(card).toHaveAttribute('data-theme', theme);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const surface = await card
      .locator('ha-card')
      .first()
      .evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(surface).toBe(
      theme === 'dark' ? 'rgb(36, 36, 36)' : 'rgb(255, 253, 248)',
    );
    const grid = await card
      .locator('.layout')
      .evaluate(
        (el) => getComputedStyle(el).gridTemplateColumns.split(' ').length,
      );
    expect(grid).toBe(width >= 1000 ? 2 : 1);
    await page.screenshot({
      path: `local/maintenance-design/preview-${width}-${theme}.png`,
      fullPage: true,
    });
  }
  const button = card.getByRole('button', { name: /Controleer de lekkage/ });
  await button.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#feedback')).toHaveText(
    'binary_sensor.example_leak',
  );
  await card.getByText('Details bekijken (1)').first().click();
  await expect(
    card.getByText('Klimaatsensor woonkamer', { exact: true }),
  ).toBeVisible();
  await page.locator('#scenario').selectOption('healthy');
  await expect(card).toContainText('Alles in orde');
  await page.locator('#scenario').selectOption('unavailable');
  await expect(card).toContainText('2 niet bevestigd');
  await page.locator('#language').selectOption('en');
  await expect(card).toContainText('Needs attention');
  await expect(card).not.toContainText('NaN');
});

test('persisted appliance completion is shown and replaced when a new program starts', async ({
  page,
}) => {
  await page.clock.install();
  await page.goto('/preview/home.html?bundle=1');
  await expect(
    page.locator('home-activity-section-card').first(),
  ).toBeAttached();
  await page.waitForFunction(() => 'homePreview' in window);
  await page.evaluate(() => {
    const api = (
      window as unknown as {
        homePreview: {
          setState(
            id: string,
            state: string,
            attributes?: Record<string, unknown>,
          ): void;
        };
      }
    ).homePreview;
    for (const type of ['washer', 'dryer', 'dishwasher']) {
      api.setState(
        `input_datetime.example_${type}_finished`,
        new Date(Date.now() - 10 * 60000).toISOString(),
        {
          timestamp: (Date.now() - 10 * 60000) / 1000,
          has_date: true,
          has_time: true,
        },
      );
      api.setState(
        type === 'dishwasher'
          ? 'sensor.example_dishwasher_status'
          : `binary_sensor.example_${type}`,
        type === 'dishwasher' ? 'finished' : 'off',
      );
    }
  });
  const card = page.locator('home-activity-section-card').first();
  await expect(card.locator('.status')).toHaveCount(3);
  for (const status of await card.locator('.status').all())
    await expect(status).toContainText('Klaar');
  await page.screenshot({
    path: 'local/maintenance-design/appliances-finished.png',
    fullPage: true,
  });
  await page.evaluate(() => {
    (
      window as unknown as {
        homePreview: { setState(id: string, state: string): void };
      }
    ).homePreview.setState('binary_sensor.example_washer', 'on');
  });
  await expect(card.locator('.status').first()).toContainText(
    'Bezig met wassen',
  );
  await page.clock.fastForward(61 * 60000);
  await expect(card.locator('.status')).toHaveCount(1);
});
