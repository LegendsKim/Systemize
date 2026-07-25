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
  test('home page snapshot', async ({ page }, testInfo) => {
    await page.goto('/');
    await applyDirectionFixture(page, testInfo.project.name);
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('home.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.01,
    });
  });

  test('contact page snapshot', async ({ page }, testInfo) => {
    await page.goto('/contact');
    await applyDirectionFixture(page, testInfo.project.name);
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('contact.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.01,
    });
  });

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
