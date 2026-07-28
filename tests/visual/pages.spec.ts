import { test, expect } from '@playwright/test';

async function applyDirectionFixture(
  page: import('@playwright/test').Page,
  projectName: string
) {
  if (projectName === 'visual-rtl') {
    await page.locator('html').evaluate((element) => {
      const html = element as HTMLHtmlElement;
      html.lang = 'he';
      html.dir = 'rtl';
    });
  }
}

test.describe('Visual regression', () => {
  test.beforeEach(async ({ page }) => {
    // Scroll-driven reveals start hidden. Reduced motion renders their final state and
    // gives the baseline complete content instead of animation setup frames.
    await page.emulateMedia({ reducedMotion: 'reduce' });
  });

  test('home page snapshot', async ({ page }, testInfo) => {
    await page.goto('/');
    await applyDirectionFixture(page, testInfo.project.name);
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('home.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.01,
    });
  });

  /*
   * The lead form has no route of its own — it is a section of `/`, so the home page
   * snapshot above already covers it full-page. This narrower snapshot exists because
   * the form is the primary conversion surface and a regression in it should not have
   * to be spotted inside a full-page diff.
   */
  test('blueprint lead form snapshot', async ({ page }, testInfo) => {
    await page.goto('/');
    await applyDirectionFixture(page, testInfo.project.name);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('#blueprint')).toHaveScreenshot('blueprint.png', {
      maxDiffPixelRatio: 0.01,
    });
  });

  /*
   * AGENTS.client.md §4 scopes visual regression to the home page and the three legal
   * routes, each at desktop RTL and mobile RTL. They share one renderer, so a diff on any
   * one of them is a diff in that renderer — which is exactly why all three are covered
   * rather than a representative.
   */
  for (const path of ['/privacy', '/terms', '/accessibility']) {
    test(`${path} snapshot`, async ({ page }, testInfo) => {
      await page.goto(path);
      await applyDirectionFixture(page, testInfo.project.name);
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveScreenshot(`${path.slice(1)}.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.01,
      });
    });
  }

  test('not-found page snapshot', async ({ page }, testInfo) => {
    await page.goto('/nonexistent');
    await applyDirectionFixture(page, testInfo.project.name);
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('not-found.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.01,
    });
  });
});
