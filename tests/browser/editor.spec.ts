import { expect, test } from '@playwright/test';

test('all registered cards open the shared visual editor with valid picker defaults', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/preview/editor.html?bundle=1');
  await page.waitForFunction(() => 'editorPreview' in window);
  const types = await page
    .locator('#editor-card option')
    .evaluateAll((options) =>
      options.map((o) => (o as HTMLOptionElement).value),
    );
  expect(types).toHaveLength(14);
  for (const type of types) {
    await page.locator('#editor-card').selectOption(type);
    await expect(
      page.locator('home-card-editor ha-form').first(),
    ).toBeVisible();
    await expect(page.locator('#editor-error')).toBeEmpty();
  }
  expect(errors).toEqual([]);
});

test('visual fields update preview and preserve hidden YAML metadata and inherited slider values', async ({
  page,
}) => {
  await page.goto('/preview/editor.html?bundle=1');
  await page.waitForFunction(() => 'editorPreview' in window);
  await page.evaluate(() => {
    (
      window as unknown as { editorPreview: { load(value: unknown): void } }
    ).editorPreview.load({
      type: 'custom:home-room-lighting-card',
      title: 'Lighting',
      slider_live_update: true,
      lights: [{ entity: 'light.example_lamp', extension: 'keep' }],
      grid_options: { columns: 12 },
      visibility: [{ condition: 'screen', media_query: '(min-width: 320px)' }],
    });
  });
  const editor = page.locator('home-card-editor');
  await editor.getByLabel('Title', { exact: true }).fill('My lighting');
  await expect(page.locator('home-room-lighting-card')).toContainText(
    'My lighting',
  );
  const get = () =>
    page.evaluate(() =>
      (
        window as unknown as {
          editorPreview: { getConfig(): Record<string, unknown> };
        }
      ).editorPreview.getConfig(),
    );
  expect(await get()).toMatchObject({
    title: 'My lighting',
    slider_live_update: true,
    lights: [{ extension: 'keep' }],
    grid_options: { columns: 12 },
    visibility: [{ condition: 'screen' }],
  });
  expect(
    ((await get()).lights as Record<string, unknown>[])[0],
  ).not.toHaveProperty('slider_live_update');
  const toggles = editor.getByRole('combobox', {
    name: 'Brightness live updates',
    exact: true,
  });
  await toggles.nth(1).selectOption('enabled');
  expect(((await get()).lights as Record<string, unknown>[])[0]).toHaveProperty(
    'slider_live_update',
    true,
  );
  await toggles.nth(1).selectOption('inherit');
  expect(
    ((await get()).lights as Record<string, unknown>[])[0],
  ).not.toHaveProperty('slider_live_update');
  await page.locator('#editor-language').selectOption('nl');
  await expect(editor.getByLabel('Titel', { exact: true })).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        (window as unknown as { editorPreview: { calls: unknown[] } })
          .editorPreview.calls,
    ),
  ).toEqual([]);
  await page.setViewportSize({ width: 390, height: 900 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: 'test-results/visual-editor-390.png',
    fullPage: true,
  });
});

test('state-label rows and nested child-card editing work without a YAML field', async ({
  page,
}) => {
  await page.goto('/preview/editor.html?bundle=1');
  await page.locator('#editor-card').selectOption('home-metric-card');
  const editor = page.locator('home-card-editor');
  await editor.locator('[data-action="add-mapping"]').click();
  await editor.getByLabel('Reported state', { exact: true }).fill('on');
  await editor.getByLabel('Display label', { exact: true }).fill('Running');
  expect(
    await page.evaluate(
      () =>
        (
          window as unknown as {
            editorPreview: {
              getConfig(): { items: { state_labels: unknown }[] };
            };
          }
        ).editorPreview.getConfig().items[0]!.state_labels,
    ),
  ).toEqual({ on: 'Running' });
  await page.locator('#editor-card').selectOption('home-section-card');
  await editor.locator('[data-action="edit-child"]').first().click();
  await page
    .locator('#nested-editor')
    .getByLabel('Content', { exact: true })
    .fill('Updated child');
  expect(
    await page.evaluate(
      () =>
        (
          window as unknown as {
            editorPreview: { getConfig(): { cards: { content: string }[] } };
          }
        ).editorPreview.getConfig().cards[0]!.content,
    ),
  ).toBe('Updated child');
  await expect(editor.locator('ha-yaml-editor,textarea')).toHaveCount(0);
});
