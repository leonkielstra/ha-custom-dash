import { expect, test } from '@playwright/test';

test('reference Home and room compositions match the compact hierarchy in both themes', async ({
  page,
}) => {
  for (const width of [390, 320, 768]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const view of ['home', 'room']) {
      await page.goto(
        view === 'home'
          ? '/preview/home.html?bundle=1&reference=1'
          : '/?bundle=1&reference=1',
      );
      for (const theme of width === 390 ? ['light', 'dark'] : ['dark']) {
        await page.locator('#theme').selectOption(theme);
        const screen = page.locator(
          view === 'home' ? `.home-page.${theme}` : `.room.${theme}`,
        );
        if (view === 'home') {
          const hero = screen.locator('home-hero-card');
          const indoor = await hero
            .locator('dd')
            .first()
            .evaluate((e) => Number.parseFloat(getComputedStyle(e).fontSize));
          const outdoor = await hero
            .locator('.outdoor dd')
            .evaluate((e) => Number.parseFloat(getComputedStyle(e).fontSize));
          expect(indoor).toBeGreaterThan(outdoor * 1.8);
          const card = screen.locator('home-room-card').first();
          const icon = await card.locator('.icon-box').boundingBox();
          const name = await card.locator('.name').boundingBox();
          const temp = await card.locator('.temperature').boundingBox();
          expect(icon!.x).toBeLessThan(name!.x);
          expect(temp!.y).toBeGreaterThan(name!.y);
          expect((await card.boundingBox())!.height).toBeLessThanOrEqual(104);
          await expect(
            screen.locator('home-activity-section-card ha-card'),
          ).toHaveCount(2);
          const activity = screen
            .locator('home-activity-section-card ha-card')
            .first();
          const value = await activity.locator('.metric').boundingBox();
          expect(value!.x).toBeGreaterThan(
            (await activity.locator('h3').boundingBox())!.x,
          );
          expect((await activity.boundingBox())!.height).toBeLessThanOrEqual(
            88,
          );
        } else {
          const lights = screen.locator('home-light-control-card');
          await expect(lights).toHaveCount(5);
          expect(
            (await lights.first().boundingBox())!.height,
          ).toBeLessThanOrEqual(88);
          const thumbColor = await lights
            .first()
            .locator('.switch-track')
            .evaluate((e) => getComputedStyle(e, '::after').backgroundColor);
          expect(thumbColor).toBe('rgb(255, 253, 248)');
          const slider = lights.first().getByRole('slider');
          expect((await slider.boundingBox())!.height).toBeGreaterThanOrEqual(
            24,
          );
          const header = screen.locator('home-room-header-card');
          expect(
            await header
              .locator('.temperature')
              .evaluate((e) => Number.parseFloat(getComputedStyle(e).fontSize)),
          ).toBe(26);
          expect(
            (await screen
              .locator('home-scene-card button')
              .first()
              .boundingBox())!.height,
          ).toBeGreaterThanOrEqual(80);
          await expect(screen.locator('home-climate-card')).toBeVisible();
          await screen.locator('home-climate-card').getByRole('button').click();
          await expect(page.locator('.service-log')).toContainText(
            'More info: climate.example_heating',
          );
        }
        if (theme === 'dark') {
          const surfaces = screen.locator(
            'home-room-card ha-card, home-light-control-card ha-card, home-climate-card ha-card, home-activity-section-card ha-card',
          );
          for (const surface of await surfaces.all()) {
            expect(
              await surface.evaluate(
                (e) => getComputedStyle(e).backgroundColor,
              ),
            ).toBe('rgb(36, 36, 36)');
          }
        }
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
        await screen.screenshot({
          path: `test-results/design-${view}-${width}-${theme}.png`,
        });
      }
    }
  }
});
