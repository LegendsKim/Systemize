import { expect, test } from '@playwright/test';

/**
 * The accessibility toolbar.
 *
 * These assert the behaviour a manual reviewer would check: that a setting actually
 * reaches the document, that it survives a reload, that the dialog obeys the keyboard,
 * and that reset really clears everything. Attribute names come from
 * `src/features/accessibility/a11y-settings.ts`.
 */
test.describe('Accessibility toolbar', () => {
  const open = async (page: import('@playwright/test').Page) => {
    await page.getByRole('button', { name: 'פתיחת תפריט נגישות' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
  };

  test('applies a toggle to the document and reports its state', async ({ page }) => {
    await page.goto('/');
    await open(page);

    const contrast = page.getByRole('button', { name: /ניגודיות גבוהה/ });
    await expect(contrast).toHaveAttribute('aria-pressed', 'false');

    await contrast.click();
    await expect(contrast).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('html')).toHaveAttribute('data-a11y-contrast', 'on');

    await contrast.click();
    await expect(page.locator('html')).not.toHaveAttribute('data-a11y-contrast', 'on');
  });

  test('applies a level and scales the root font size', async ({ page }) => {
    await page.goto('/');
    await open(page);

    const before = await page.evaluate(
      () => parseFloat(getComputedStyle(document.documentElement).fontSize)
    );

    await page
      .getByRole('group', { name: /גודל טקסט/ })
      .getByRole('radio', { name: 'מרבי' })
      .click();

    await expect(page.locator('html')).toHaveAttribute('data-a11y-text', '3');
    const after = await page.evaluate(
      () => parseFloat(getComputedStyle(document.documentElement).fontSize)
    );
    expect(after).toBeGreaterThan(before);
  });

  /*
   * The point of persisting: a returning visitor must not have to reconfigure. The
   * attribute has to be present immediately after load, which is what the before-paint
   * script in the root layout exists for.
   */
  test('restores saved settings on reload without a flash of the default page', async ({
    page,
  }) => {
    await page.goto('/');
    await open(page);
    await page.getByRole('button', { name: /הדגשת קישורים/ }).click();
    await expect(page.locator('html')).toHaveAttribute('data-a11y-links', 'on');

    await page.reload({ waitUntil: 'commit' });
    // No waiting: if this only became true after hydration, the restore script failed.
    await expect(page.locator('html')).toHaveAttribute('data-a11y-links', 'on');
  });

  test('reset clears every setting and disables itself', async ({ page }) => {
    await page.goto('/');
    await open(page);

    const reset = page.getByRole('button', { name: 'איפוס כל ההתאמות' });
    await expect(reset).toBeDisabled();

    await page.getByRole('button', { name: /עצירת אנימציות/ }).click();
    await page.getByRole('button', { name: /סמן גדול/ }).click();
    await expect(reset).toBeEnabled();

    await reset.click();
    await expect(page.locator('html')).not.toHaveAttribute('data-a11y-motion', 'on');
    await expect(page.locator('html')).not.toHaveAttribute('data-a11y-cursor', 'on');
    await expect(reset).toBeDisabled();
  });

  test('closes on Escape and returns focus to the trigger', async ({ page }) => {
    await page.goto('/');
    const trigger = page.getByRole('button', { name: 'פתיחת תפריט נגישות' });
    await trigger.click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(trigger).toBeFocused();
  });

  test('is reachable and operable by keyboard alone', async ({ page }) => {
    await page.goto('/');
    const trigger = page.getByRole('button', { name: 'פתיחת תפריט נגישות' });
    await trigger.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog')).toBeVisible();

    const contrast = page.getByRole('button', { name: /ניגודיות גבוהה/ });
    await contrast.focus();
    await page.keyboard.press('Space');
    await expect(page.locator('html')).toHaveAttribute('data-a11y-contrast', 'on');
  });
});
