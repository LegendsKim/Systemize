import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility', () => {
  test('home page has no a11y violations', async ({ page }) => {
    await page.goto('/');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test('hero milestone dialog has no a11y violations', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', {
      name: 'אפיון, שלב ראשון בתהליך. מבינים איך העבודה מתנהלת באמת. לפתיחת מידע נוסף',
    }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    const results = await new AxeBuilder({ page })
      .include('dialog')
      .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });

  /*
   * The consent panel now appears 10 seconds into a visit rather than on load, so the
   * home page scan above no longer covers it. It is scanned here in its expanded state,
   * which is the one with the toggles, the fieldset and the live-reachable controls.
   */
  test('cookie consent panel has no a11y violations', async ({ context, page }) => {
    await context.clearCookies();
    await page.goto('/');

    const panel = page.locator('.cookie-consent');
    await expect(panel).toBeVisible({ timeout: 20_000 });
    await panel.getByRole('button', { name: 'בוחרים בעצמכם' }).click();
    await expect(panel.getByRole('group', { name: 'בחירת סוגי עוגיות' })).toBeVisible();

    const results = await new AxeBuilder({ page })
      .include('.cookie-consent')
      .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });

  /*
   * The accessibility toolbar is scanned open, and again with every setting turned on.
   * A toolbar that fails its own audit is worse than no toolbar, and the second scan is
   * the one that matters: high contrast, large text and wide spacing all restyle the panel
   * itself, so a clean scan of the pristine panel would not cover the states a visitor who
   * needs it will actually be looking at.
   */
  test('accessibility toolbar has no a11y violations when open', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'פתיחת תפריט נגישות' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    const pristine = await new AxeBuilder({ page })
      .include('dialog')
      .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
      .analyze();
    expect(pristine.violations).toEqual([]);

    /*
     * Indexed over a locator whose match set does not change. Selecting on
     * `{ pressed: false }` would re-evaluate after every click and skip elements as they
     * flipped, which is what makes that read like a passing test while covering half the
     * toggles.
     */
    const toggles = page.locator('.a11y-toggle');
    const count = await toggles.count();
    expect(count).toBeGreaterThan(0);
    for (let index = 0; index < count; index += 1) {
      await toggles.nth(index).click();
      await expect(toggles.nth(index)).toHaveAttribute('aria-pressed', 'true');
    }

    for (const group of await page.locator('.a11y-level').all()) {
      await group.getByRole('radio', { name: 'מרבי' }).click();
    }

    const adjusted = await new AxeBuilder({ page })
      .include('dialog')
      .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
      .analyze();
    expect(adjusted.violations).toEqual([]);
  });

  /*
   * The lead form is scanned in its invalid state as well: the announced errors, the
   * `aria-invalid` fields and the alert region only exist after a failed submission,
   * so a clean scan of the pristine form would not cover them.
   */
  test('blueprint lead form has no a11y violations while showing errors', async ({
    page,
  }) => {
    await page.goto('/');
    await page.locator('#blueprint').scrollIntoViewIfNeeded();
    await page.getByRole('button', { name: /שולחים רקע/ }).click();
    await expect(page.locator('#lead-full_name-error')).toBeVisible();

    const results = await new AxeBuilder({ page })
      .include('#blueprint')
      .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });

  /*
   * AGENTS.client.md §4 scopes automated axe to *every* indexable route, and the three
   * legal routes are indexable. They are scanned as a set rather than individually because
   * they share one renderer — a regression in it would otherwise be caught on whichever
   * route happened to be listed.
   */
  for (const path of ['/privacy', '/terms', '/accessibility']) {
    test(`${path} has no a11y violations`, async ({ page }) => {
      await page.goto(path);
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
        .analyze();
      expect(results.violations).toEqual([]);
    });
  }

  test('not-found page has no a11y violations', async ({ page }) => {
    await page.goto('/nonexistent-page');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });
});
