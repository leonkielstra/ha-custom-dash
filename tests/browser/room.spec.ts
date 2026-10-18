import { expect, test } from '@playwright/test';
test('renders section headings around reusable nested cards', async ({
  page,
}) => {
  await page.goto('/?bundle=1');
  const room = page.locator('.room.light');
  const section = room.locator('home-section-card');
  await expect(section.getByRole('heading', { name: 'Media' })).toBeVisible();
  await expect(section.locator('home-device-card')).toHaveCount(1);
  await expect(
    section.getByRole('heading', { name: 'Living room display' }),
  ).toBeVisible();
});
test('bundled cards render both themes and handle real browser controls', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/?bundle=1');
  const room = page.locator('.room.light');
  const first = room.locator('home-light-control-card').first();
  await expect(first.getByRole('slider')).toHaveValue('44');
  await first.getByRole('slider').focus();
  await page.keyboard.press('ArrowRight');
  await expect(first.getByRole('slider')).toHaveValue('45');
  await expect(first.getByText(/Updating/)).toHaveCount(0, { timeout: 3000 });
  await first.getByRole('button').click();
  await expect(first.getByRole('button')).toHaveAttribute(
    'aria-pressed',
    'false',
  );
  await expect(first.getByRole('slider')).toBeDisabled();
  await room.getByRole('button', { name: 'Activate Read' }).click();
  await expect(room.getByRole('status')).toHaveText('Read activated');
  await page.getByRole('button', { name: 'Fail next action' }).click();
  await first.getByRole('button').click();
  await expect(first.getByRole('alert')).toContainText('Could not update');
  await expect(first.getByRole('button')).toHaveAttribute(
    'aria-pressed',
    'false',
  );
  expect(errors).toEqual([]);
  await page.screenshot({ path: 'test-results/desktop.png', fullPage: true });
});
test('fits a smartphone, supports dark theme, and keeps touch controls accessible', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/?bundle=1');
  await page.locator('#theme').selectOption('dark');
  const room = page.locator('.room.dark');
  await expect(room.locator('home-room-header-card')).toHaveAttribute(
    'data-theme',
    'dark',
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const first = room.locator('home-light-control-card').first();
  const bounds = await first.getByRole('button').boundingBox();
  expect(bounds?.width).toBeGreaterThanOrEqual(44);
  expect(bounds?.height).toBeGreaterThanOrEqual(44);
  await expect(
    room.locator('home-light-control-card').nth(5).getByRole('button'),
  ).toBeDisabled();
  await expect(
    room.locator('home-light-control-card').nth(6).getByRole('slider'),
  ).toBeDisabled();
  await first.getByRole('button').focus();
  await page.keyboard.press('Enter');
  await expect(first.getByRole('button')).toHaveAttribute(
    'aria-pressed',
    'false',
  );
  await page.screenshot({
    path: 'test-results/mobile-dark.png',
    fullPage: true,
  });
});
test('uses neutral dark card surfaces and compact room controls', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/?bundle=1');
  const room = page.locator('.room.dark');
  const header = room.locator('home-room-header-card');
  const light = room.locator('home-light-control-card').nth(1);
  await expect(header.locator('h2')).toHaveCount(0);
  const cardColors = await light.evaluate((card) => {
    return {
      page: getComputedStyle(card).getPropertyValue('--room-background').trim(),
    };
  });
  const surface = light.locator('ha-card');
  expect(cardColors.page).toBe('#141414');
  expect(
    await surface.evaluate(
      (element) => getComputedStyle(element).backgroundColor,
    ),
  ).toBe('rgb(36, 36, 36)');
  expect((await surface.boundingBox())?.height).toBeLessThanOrEqual(112);
  const toggle = light.getByRole('button');
  expect((await toggle.boundingBox())?.height).toBeGreaterThanOrEqual(44);
  await page.locator('#theme').selectOption('dark');
  await page.screenshot({
    path: 'test-results/refined-dark.png',
    fullPage: true,
  });
  await page.locator('#theme').selectOption('light');
  await page.screenshot({
    path: 'test-results/refined-light.png',
    fullPage: true,
  });
});
test('light content stays aligned across widths, themes, and device states', async ({
  page,
}) => {
  await page.goto('/?bundle=1');
  for (const width of [320, 375, 390, 430, 768, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    for (const theme of width === 390 ? ['dark', 'light'] : ['dark']) {
      await page.locator('#theme').selectOption(theme);
      const room = page.locator(`.room.${theme}`);
      const cards = room.locator('home-light-control-card');
      const heights: number[] = [];
      for (const card of await cards.all()) {
        const geometry = await card.locator('.row').evaluate((row) => {
          const bounds = (selector: string) => {
            const r = row.querySelector(selector)!.getBoundingClientRect();
            return {
              x: r.x,
              right: r.right,
              y: r.y,
              height: r.height,
              center: r.y + r.height / 2,
            };
          };
          return {
            row: row.getBoundingClientRect().toJSON(),
            label: bounds('.label'),
            icon: bounds('.icon-box'),
            toggle: bounds('.toggle'),
            slider: bounds('input'),
          };
        });
        expect(geometry.slider.x).toBeCloseTo(geometry.label.x, 1);
        expect(geometry.slider.right).toBeCloseTo(geometry.row.right, 1);
        expect(geometry.toggle.center).toBeCloseTo(geometry.label.center, 1);
        expect(geometry.icon.center).toBeCloseTo(
          geometry.row.y + geometry.row.height / 2,
          1,
        );
        expect(geometry.slider.y).toBeGreaterThanOrEqual(
          geometry.toggle.y + geometry.toggle.height,
        );
        heights.push((await card.boundingBox())!.height);
      }
      expect(new Set(heights).size).toBe(1);
      expect(heights[0]).toBeLessThanOrEqual(100);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      if (width === 390 || width === 320) {
        await room.screenshot({
          path: `test-results/light-layout-${width}-${theme}.png`,
        });
      }
    }
  }
});
test('external state events update both previews and room controls use explicit IDs', async ({
  page,
}) => {
  await page.goto('/?bundle=1');
  await page.getByRole('button', { name: 'External light change' }).click();
  for (const room of ['.room.light', '.room.dark'])
    await expect(
      page
        .locator(room)
        .locator('home-light-control-card')
        .first()
        .getByRole('button'),
    ).toHaveAttribute('aria-pressed', 'false');
  const room = page.locator('.room.light');
  await room
    .getByRole('button', {
      name: 'Turn all configured lights off',
      exact: true,
    })
    .click();
  await expect(
    room.locator('home-light-control-card').nth(4).getByRole('button'),
  ).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('.service-log')).toContainText(
    'light.example_basic',
  );
  await expect(page.locator('.service-log')).not.toContainText(
    'light.example_unavailable',
  );
  const allOn = room.getByRole('button', {
    name: 'Turn all configured lights on',
    exact: true,
  });
  await expect(allOn).toBeEnabled();
  await allOn.click();
  await expect(page.locator('.service-log')).toContainText('light.turn_on');
});
test('dragging is local until release, then reconciles a single service call', async ({
  page,
}) => {
  await page.goto('/?bundle=1');
  const first = page.locator('.room.light home-light-control-card').first();
  const slider = first.getByRole('slider');
  const box = await slider.boundingBox();
  if (!box) throw new Error('Missing slider');
  await page.mouse.move(box.x + box.width * 0.44, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.8, box.y + box.height / 2, {
    steps: 15,
  });
  await expect(page.locator('.service-log')).toContainText(
    'Interact with a card',
  );
  const desired = await slider.inputValue();
  expect(Number(desired)).toBeGreaterThan(70);
  expect(Number(desired)).toBeLessThan(90);
  await expect(first.locator('.state')).toContainText(`${desired}%`);
  await page.mouse.up();
  await expect(first.locator('.state')).not.toContainText('Updating', {
    timeout: 3000,
  });
  expect(
    await page.evaluate(
      () =>
        (window as unknown as { preview: { calls: unknown[] } }).preview.calls
          .length,
    ),
  ).toBe(1);
  await expect(slider).toHaveValue(desired);
});
test('wide room lighting uses two columns and remains within its container', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1500, height: 1000 });
  await page.goto('/'); // Also exercise the unbundled development entry.
  await page.locator('#width').selectOption('wide');
  const lights = page.locator('.room.light home-light-control-card');
  const first = await lights.nth(0).boundingBox();
  const second = await lights.nth(1).boundingBox();
  expect(first?.y).toBe(second?.y);
  expect(second!.x).toBeGreaterThan(first!.x);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test('live sliders update while held and reconcile the released position', async ({
  page,
}) => {
  await page.goto('/?bundle=1');
  await page.getByRole('checkbox', { name: 'Slider live update' }).check();
  const first = page.locator('.room.light home-light-control-card').first();
  const slider = first.getByRole('slider');
  await slider.scrollIntoViewIfNeeded();
  const box = await slider.boundingBox();
  if (!box) throw new Error('Missing slider');
  await page.mouse.move(box.x + box.width * 0.44, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.7, box.y + box.height / 2, {
    steps: 10,
  });
  await expect(page.locator('.service-log')).toContainText('light.turn_on');
  await page.mouse.move(box.x + box.width * 0.9, box.y + box.height / 2, {
    steps: 10,
  });
  const desired = await slider.inputValue();
  await page.mouse.up();
  await expect(first.locator('.state')).not.toContainText('Updating', {
    timeout: 3000,
  });
  await expect(slider).toHaveValue(desired);
  expect(
    await page.evaluate(() => {
      const calls = (
        window as unknown as {
          preview: { calls: { data: { brightness: number } }[] };
        }
      ).preview.calls;
      return calls.at(-1)?.data.brightness;
    }),
  ).toBe(Math.round((Number(desired) * 255) / 100));
});
