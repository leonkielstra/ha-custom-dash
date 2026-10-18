import { expect, test } from '@playwright/test';
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
    .getByRole('button', { name: 'Turn all configured lights on', exact: true })
    .click();
  await expect(
    room.locator('home-light-control-card').nth(4).getByRole('button'),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.service-log')).toContainText(
    'light.example_basic',
  );
  await expect(page.locator('.service-log')).not.toContainText(
    'light.example_unavailable',
  );
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
