import { test, expect } from '@playwright/test';

/*
 * Visual coverage for the authenticated entrance.
 *
 * The loading overlay is dismissed first in every case. It is driven by wall-clock
 * timers, so any baseline that included it would be a baseline of "whichever step
 * happened to be current when the screenshot fired" — a flake generator, not a
 * regression test. Its behaviour is covered instead by tests/e2e/portal-gate.spec.ts,
 * which asserts what it does rather than what it looks like mid-flight.
 */
async function openGate(page: import('@playwright/test').Page, path: string) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(path);
  await page.getByRole('button', { name: 'דילוג' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.waitForLoadState('networkidle');
}

const invitationToken = 'A'.repeat(43);

test.describe('Gate visual regression', () => {
  test('login snapshot', async ({ page }, testInfo) => {
    await openGate(page, '/login');
    const reminder = page.getByRole('complementary', {
      name: 'SYSTEMIZE עובדת טוב יותר כאפליקציה',
    });
    if (testInfo.project.name === 'visual-mobile') {
      await expect(reminder).toBeVisible();
    } else {
      await expect(reminder).toHaveCount(0);
    }
    await expect(page).toHaveScreenshot('gate-login.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.01,
    });
  });

  test('invitation snapshot', async ({ page }) => {
    await openGate(page, `/invite/${invitationToken}`);
    await expect(page).toHaveScreenshot('gate-invite.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.01,
    });
  });
});
