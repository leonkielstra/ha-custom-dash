import { expect, test } from '@playwright/test';

test('heat-pump bundle renders the five views and follows operating states without service calls', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/preview/heatpump.html?bundle=1');
  const status = page.locator('home-heat-pump-status-card');
  const flow = page.locator('home-heat-flow-card');
  await expect(status).toContainText('Warm water wordt opgewarmd');
  await expect(status).toContainText('3,50 kW');
  await expect(status).toContainText('Ventilator 42%');
  await expect(flow.locator('path.hot')).toHaveCount(1);
  await expect(flow.locator('.target.active')).toHaveCount(0);
  await expect(
    page.locator('home-metric-card').filter({ hasText: 'Vandaag' }),
  ).toContainText('5 u 12 min');
  await expect(
    page.locator('home-metric-card').filter({ hasText: 'Vandaag' }),
  ).toContainText('44 min');
  await page.locator('#hp-scenario').selectOption('heating');
  await expect(status).toContainText('Woning wordt verwarmd');
  await expect(flow.locator('.target.active')).toHaveCount(1);
  await expect(flow.locator('path.hot')).toHaveCount(0);
  await page.locator('#hp-scenario').selectOption('standby');
  await expect(status).toContainText('Warmtepomp in rust');
  await expect(flow.locator('path.hot, path.running')).toHaveCount(0);
  await page.locator('#hp-scenario').selectOption('fault');
  await expect(status).toContainText('Storing gemeld');
  await expect(flow.locator('path.hot, path.running')).toHaveCount(0);
  await page.locator('#hp-scenario').selectOption('unavailable');
  await expect(status).toContainText('Werking niet bevestigd');
  await expect(page.locator('home-system-health-card')).toContainText(
    'Niet beschikbaar',
  );
  await page.locator('#hp-scenario').selectOption('hot-water');
  await page.locator('#hp-language').selectOption('en');
  await expect(status).toContainText('Heating hot water');
  await expect(flow).toContainText('Where does the heat go?');
  for (const name of [
    'afstelling',
    'warmwater',
    'energie',
    'diagnose',
    'overzicht',
  ]) {
    await page.locator(`[data-view="${name}"]`).click();
    await expect(page.locator(`[data-view="${name}"]`)).toHaveAttribute(
      'aria-current',
      'page',
    );
  }
  expect(errors).toEqual([]);
  expect(
    await page.evaluate(
      () =>
        (window as unknown as { heatPumpPreview: { calls: unknown[] } })
          .heatPumpPreview.calls,
    ),
  ).toEqual([]);
});

test('heat-pump cards match neutral surfaces and remain readable across themes and viewport sizes', async ({
  page,
}) => {
  await page.goto('/preview/heatpump.html?bundle=1');
  for (const [width, theme] of [
    [390, 'dark'],
    [390, 'light'],
    [320, 'dark'],
    [768, 'dark'],
    [1440, 'dark'],
    [1440, 'light'],
  ] as const) {
    await page.setViewportSize({ width, height: 1000 });
    await page.locator('#hp-theme').selectOption(theme);
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
    );
    const sections = page.locator('.hp-section');
    const first = (await sections.nth(0).boundingBox())!;
    const second = (await sections.nth(1).boundingBox())!;
    if (width === 1440) {
      expect(second.y).toBeCloseTo(first.y, 0);
      expect(second.width).toBeGreaterThan(first.width * 1.8);
    } else {
      expect(second.y).toBeGreaterThan(first.y);
    }
    const status = page.locator('home-heat-pump-status-card ha-card');
    expect(
      await status.evaluate((el) => getComputedStyle(el).backgroundColor),
    ).toBe(theme === 'dark' ? 'rgb(36, 36, 36)' : 'rgb(255, 253, 248)');
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.locator('.hp-page').screenshot({
      path: `test-results/heatpump-overview-${width}-${theme}.png`,
    });
  }
});

test('heat-flow destination icons stay square and centered on their pipe branches at every card width', async ({
  page,
}) => {
  await page.goto('/preview/heatpump.html?bundle=1');
  const flow = page.locator('home-heat-flow-card');
  for (const [width, theme] of [
    [320, 'dark'],
    [390, 'dark'],
    [390, 'light'],
    [768, 'dark'],
    [1440, 'dark'],
    [1440, 'light'],
  ] as const) {
    await page.setViewportSize({ width, height: 1000 });
    await page.locator('#hp-theme').selectOption(theme);
    for (const scenario of ['standby', 'heating', 'hot-water', 'unavailable']) {
      await page.locator('#hp-scenario').selectOption(scenario);
      const geometry = await flow.evaluate((el) => {
        const root = el.shadowRoot!;
        const svg = root.querySelector('svg')!;
        const matrix = svg.getScreenCTM()!;
        const targets = [...root.querySelectorAll('.target')];
        const label = root
          .querySelector('.valve-label')!
          .getBoundingClientRect();
        return {
          width: el.getBoundingClientRect().width,
          scrollWidth: el.scrollWidth,
          svgBottom: svg.getBoundingClientRect().bottom,
          labelTop: label.top,
          rows: targets.map((target, index) => {
            const row = target.getBoundingClientRect();
            const icon = target
              .querySelector('ha-icon')!
              .getBoundingClientRect();
            const details = target
              .querySelector('div')!
              .getBoundingClientRect();
            const branch = new DOMPoint(
              160,
              index === 0 ? 40 : 120,
            ).matrixTransform(matrix);
            return {
              iconWidth: icon.width,
              iconHeight: icon.height,
              iconCenter: icon.y + icon.height / 2,
              rowCenter: row.y + row.height / 2,
              branchY: branch.y,
              branchX: branch.x,
              iconLeft: icon.left,
              iconRight: icon.right,
              detailsLeft: details.left,
            };
          }),
        };
      });
      expect(geometry.scrollWidth).toBeLessThanOrEqual(
        Math.ceil(geometry.width),
      );
      expect(geometry.labelTop).toBeGreaterThanOrEqual(geometry.svgBottom);
      for (const row of geometry.rows) {
        expect(row.iconWidth).toBeCloseTo(40, 0);
        expect(row.iconHeight).toBeCloseTo(40, 0);
        expect(Math.abs(row.iconCenter - row.rowCenter)).toBeLessThan(1);
        expect(Math.abs(row.iconCenter - row.branchY)).toBeLessThan(1);
        expect(row.iconLeft).toBeGreaterThan(row.branchX);
        expect(row.detailsLeft).toBeGreaterThan(row.iconRight);
      }
      expect(geometry.rows[0]!.iconLeft).toBeCloseTo(
        geometry.rows[1]!.iconLeft,
        0,
      );
    }
    await page.locator('#hp-scenario').selectOption('standby');
    await flow.screenshot({
      path: `local/heat-flow-alignment/flow-${width}-${theme}.png`,
    });
  }
});

test('all detail views preserve their data and fit narrow screens with keyboard-accessible tabs', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto('/preview/heatpump.html?bundle=1');
  for (const theme of ['dark', 'light']) {
    await page.locator('#hp-theme').selectOption(theme);
    for (const name of ['afstelling', 'warmwater', 'energie', 'diagnose']) {
      const tab = page.locator(`[data-view="${name}"]`);
      await tab.focus();
      await page.keyboard.press('Enter');
      await expect(page.locator('.hp-sections')).not.toContainText(
        /NaN|undefined|Invalid Date/,
      );
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      if (name === 'afstelling')
        await expect(page.locator('.hp-sections')).toContainText(/stooklijn/i);
      if (name === 'warmwater')
        await expect(page.locator('.hp-sections')).toContainText(
          'Hygiëneprogramma',
        );
      if (name === 'energie')
        await expect(page.locator('.hp-sections')).toContainText(
          'voortschrijdende 7-daagse rendement',
        );
      if (name === 'diagnose')
        await expect(page.locator('.hp-sections')).toContainText(
          'Condensatierisico',
        );
      await page
        .locator('.hp-page')
        .screenshot({ path: `test-results/heatpump-${name}-320-${theme}.png` });
    }
  }
});
