import { expect, test } from '@playwright/test';

test('heat-pump activity uses a compact neutral row, localizes, and responds to live valve and output updates', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/preview/home.html?bundle=1');
  await page.locator('#scenario').selectOption('hot-water');
  for (const theme of ['dark', 'light']) {
    await page.locator('#theme').selectOption(theme);
    const view = page.locator(`.home-page.${theme}`);
    const section = view.locator('home-activity-section-card');
    await expect(section.locator('ha-card')).toHaveCount(1);
    await expect(section).toContainText('Warm water wordt opgewarmd');
    await expect(section).toContainText('3,5kW');
    await expect(section).toContainText('Ventilator 42%');
    await expect(section.locator('progress')).toHaveCount(0);
    expect(
      await section
        .locator('ha-card')
        .evaluate((el) => getComputedStyle(el).backgroundColor),
    ).toBe(theme === 'dark' ? 'rgb(36, 36, 36)' : 'rgb(255, 253, 248)');
    expect(
      await section
        .locator('.status')
        .evaluate((el) => el.scrollWidth <= el.clientWidth),
    ).toBe(true);
    await view.screenshot({ path: `test-results/heat-pump-390-${theme}.png` });
  }
  await page.locator('#theme').selectOption('dark');
  await page.setViewportSize({ width: 320, height: 844 });
  const view = page.locator('.home-page.dark');
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(
    await view
      .locator('home-activity-section-card .status')
      .evaluate((el) => el.scrollWidth <= el.clientWidth),
  ).toBe(true);
  await view.screenshot({ path: 'test-results/heat-pump-320-dark.png' });
  await page.locator('#scenario').selectOption('heating');
  const section = view.locator('home-activity-section-card');
  await expect(section).toContainText('Woning wordt verwarmd');
  await page.locator('#language').selectOption('en');
  await expect(section).toContainText('Heating the home');
  await expect(section).toContainText('Fan speed 42%');
  const setState = async (id: string, state: string) =>
    page.evaluate(
      ({ id, state }) => {
        (
          window as unknown as {
            homePreview: { setState(id: string, state: string): void };
          }
        ).homePreview.setState(id, state);
      },
      { id, state },
    );
  await setState('sensor.example_heat_pump_valve', 'unavailable');
  await expect(section).toContainText('Heat pump active');
  await setState('sensor.example_heat_output', '0');
  await expect(section).toBeHidden();
  await setState('sensor.example_heat_output', '3.497');
  await expect(section).toBeVisible();
  await setState('sensor.example_heat_pump_fan_speed', '65');
  await expect(section).toContainText('Fan speed 65%');
  await setState('sensor.example_heat_pump_operation', 'standby');
  await expect(section).toBeHidden();
});

test('Home bundle renders all twelve rooms and switches illustrations independently of theme', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/preview/home.html?bundle=1');
  const dark = page.locator('.home-page.dark');
  const light = page.locator('.home-page.light');
  for (const view of [dark, light]) {
    await expect(view.locator('home-room-card')).toHaveCount(12);
    await expect(view.locator('home-hero-card img')).toHaveAttribute(
      'src',
      /home-day.svg$/,
    );
    expect(
      await view
        .locator('home-hero-card img')
        .evaluate(
          (image: HTMLImageElement) => image.complete && image.naturalWidth > 0,
        ),
    ).toBe(true);
    await expect(view.locator('home-hero-card')).toContainText('20,4°C');
    await expect(view.locator('home-activity-section-card')).toBeHidden();
  }
  await page.locator('#daylight').selectOption('below_horizon');
  await expect(light.locator('home-hero-card img')).toHaveAttribute(
    'src',
    /home-night.svg$/,
  );
  await expect(dark.locator('home-hero-card img')).toHaveAttribute(
    'src',
    /home-night.svg$/,
  );
  await page.locator('#daylight').selectOption('unavailable');
  await expect(light.locator('home-hero-card img')).toHaveAttribute(
    'src',
    /home-night.svg$/,
  );
  await page.locator('#language').selectOption('en');
  await expect(dark.locator('home-hero-card')).toContainText('Indoors');
  expect(errors).toEqual([]);
});

test('activity collapses without a blank slot, reappears from state updates, and distinguishes actual and indicative progress', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/preview/home.html?bundle=1');
  await page.locator('#theme').selectOption('dark');
  const view = page.locator('.home-page.dark');
  const hero = view.locator('home-hero-card');
  const section = view.locator('home-activity-section-card');
  const scenes = view.locator('home-scene-card');
  const gap =
    (await scenes.boundingBox())!.y -
    ((await hero.boundingBox())!.y + (await hero.boundingBox())!.height);
  expect(gap).toBe(8);
  await page.locator('#scenario').selectOption('multiple');
  await expect(section).toBeVisible();
  const rows = section.locator('ha-card');
  await expect(rows).toHaveCount(4);
  await expect(rows.nth(0).locator('.metric')).toHaveAttribute(
    'aria-label',
    'Indicatief: 48 minuten bezig',
  );
  await expect(rows.nth(0)).toContainText('Tijdsindicatie');
  await expect(rows.nth(0).getByRole('progressbar')).toHaveAttribute(
    'aria-label',
    /geen programmavoortgang/,
  );
  await expect(rows.nth(0).getByRole('progressbar')).toHaveAttribute(
    'value',
    '40',
  );
  await expect(rows.nth(1).getByRole('progressbar')).toHaveAttribute(
    'value',
    '100',
  );
  await expect(rows.nth(2).getByRole('progressbar')).toHaveAttribute(
    'value',
    '72',
  );
  await expect(rows.nth(2)).toContainText('Nog 12 min');
  await expect(rows.nth(3)).toContainText('Nog 38 min');
  await expect(rows.nth(3).getByRole('progressbar')).toHaveCount(0);
  await page.locator('#scenario').selectOption('day');
  await expect(section).toBeHidden();
  await page.evaluate(() => {
    const preview = (
      window as unknown as {
        homePreview: { setState(id: string, state: string): void };
      }
    ).homePreview;
    preview.setState('binary_sensor.example_washer', 'on');
  });
  await expect(section).toBeVisible();
  await expect(section.locator('ha-card')).toHaveCount(1);
});

test('missing metadata and unavailable lights keep room navigation and live reconnection intact', async ({
  page,
}) => {
  await page.goto('/preview/home.html?bundle=1');
  await page.locator('#theme').selectOption('dark');
  await page.locator('#scenario').selectOption('unavailable');
  const view = page.locator('.home-page.dark');
  const rooms = view.locator('home-room-card');
  const bedroom = rooms.nth(7);
  await expect(bedroom).toContainText('1 lichtgroep aan');
  await expect(bedroom).toContainText('1 niet beschikbaar');
  await expect(bedroom).not.toContainText('Verlichting uit');
  await expect(rooms.nth(4)).toContainText('—');
  await expect(rooms.nth(2).locator('.status')).toHaveCount(0);
  await expect(rooms.nth(3).locator('.temperature')).toHaveCount(0);
  await expect(
    view
      .locator('home-activity-section-card ha-card')
      .nth(2)
      .locator('progress'),
  ).toHaveCount(0);
  await page.evaluate(() => {
    (
      window as unknown as {
        homePreview: { setState(id: string, state: string): void };
      }
    ).homePreview.setState('light.example_room_7_2', 'on');
  });
  await expect(bedroom).toContainText('2 lichtgroepen aan');
  await expect(bedroom).not.toContainText('niet beschikbaar');
  const token = await page.evaluate(() => {
    Object.assign(window, { navigationToken: 'preserved' });
    return 'preserved';
  });
  await rooms.first().getByRole('link').focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/dashboard-home\/woonkamer$/);
  expect(
    await page.evaluate(
      () => (window as unknown as { navigationToken: string }).navigationToken,
    ),
  ).toBe(token);
  await expect(page.locator('#home-feedback')).toContainText(
    'Navigation: /dashboard-home/woonkamer',
  );
  await page.goBack();
  await expect(page).toHaveURL(/\/preview\/home.html\?bundle=1$/);
});

test('Home stays compact and neutral with no overflow across mobile/tablet sizes and long labels', async ({
  page,
}) => {
  await page.goto('/preview/home.html?bundle=1');
  await page.locator('#scenario').selectOption('multiple');
  for (const [width, theme] of [
    [390, 'dark'],
    [390, 'light'],
    [320, 'dark'],
    [768, 'dark'],
    [375, 'dark'],
    [430, 'dark'],
  ] as const) {
    await page.setViewportSize({ width, height: 844 });
    await page.locator('#theme').selectOption(theme);
    const view = page.locator(`.home-page.${theme}`);
    const hero = await view.locator('home-hero-card').boundingBox();
    expect(hero!.height).toBeGreaterThanOrEqual(140);
    expect(hero!.height).toBeLessThanOrEqual(170);
    for (const grid of await view.locator('.room-grid').all()) {
      const roomCards = grid.locator('home-room-card');
      if ((await roomCards.count()) > 1) {
        const a = await roomCards.nth(0).boundingBox();
        const b = await roomCards.nth(1).boundingBox();
        expect(a!.y).toBe(b!.y);
        expect(a!.height).toBe(b!.height);
        expect(b!.x).toBeGreaterThan(a!.x);
      }
    }
    if (theme === 'dark') {
      expect(
        await view
          .locator('home-room-card ha-card')
          .first()
          .evaluate((card) => getComputedStyle(card).backgroundColor),
      ).toBe('rgb(36, 36, 36)');
      expect(
        await view.evaluate((card) => getComputedStyle(card).backgroundColor),
      ).toBe('rgb(20, 20, 20)');
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if (width === 390 || width === 320 || width === 768) {
      await view.screenshot({
        path: `test-results/home-${width}-${theme}.png`,
      });
    }
  }
  await page.locator('#long-name').click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const room = page.locator('.home-page.dark home-room-card').first();
  expect(
    await room
      .locator('.name')
      .evaluate((el) => el.scrollWidth > el.clientWidth),
  ).toBe(true);
  const link = await room.getByRole('link').boundingBox();
  expect(link!.height).toBeGreaterThanOrEqual(44);
});
