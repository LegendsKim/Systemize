import { test, expect } from '@playwright/test';

test.describe('Home page', () => {
  test('renders the page title', async ({ page }) => {
    await page.goto('/');
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: 'לא מתאימים את העסק למערכת. בונים את המערכת סביב העסק.',
      })
    ).toBeVisible();
  });

  test('has correct page title in head', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Systemize/);
  });

  test('has skip link that becomes visible on focus', async ({ page }) => {
    await page.goto('/');
    const skipLink = page.getByText('דילוג לתוכן הראשי');
    await skipLink.focus();
    await expect(skipLink).toBeVisible();
  });

  test('presents the four delivery stages in order', async ({ page }) => {
    await page.goto('/');

    const process = page.getByRole('region', {
      name: 'מהשיחה הראשונה ועד מערכת שעובדת בעסק.',
    });
    // The same four names, in the same order, as the hero's trail milestones.
    await expect(process.getByRole('heading', { level: 3 })).toHaveText([
      'אפיון',
      'תכנון',
      'פיתוח',
      'הטמעה',
    ]);
  });

  test('opens only one FAQ answer at a time', async ({ page }) => {
    await page.goto('/');

    // Exclusivity comes from the shared `name` attribute, which is a browser feature
    // rather than our code, so it is worth asserting in a real browser and not only in
    // the unit test that checks the markup.
    const entries = page.locator('.faq-entry');
    const first = entries.nth(0);
    const second = entries.nth(1);

    await first.locator('summary').click();
    await expect(first).toHaveAttribute('open', '');

    await second.locator('summary').click();
    await expect(second).toHaveAttribute('open', '');
    await expect(first).not.toHaveAttribute('open', '');
  });

  test('opens an accessible detail dialog from every hero milestone', async ({ page }) => {
    await page.goto('/');

    const discovery = page.getByRole('button', {
      name: 'אפיון, שלב ראשון בתהליך. מבינים איך העבודה מתנהלת באמת. לפתיחת מידע נוסף',
    });
    await discovery.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('heading', { level: 2 })).toHaveText('אפיון');
    await expect(dialog).toContainText('מיפוי הצורך');

    await dialog.getByRole('button', { name: 'סגירת החלונית' }).click();
    await expect(dialog).not.toBeVisible();
  });

  test('has no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    expect(errors).toHaveLength(0);
  });

  test('serves a nonce-based security policy', async ({ page }) => {
    const response = await page.goto('/');
    const csp = response?.headers()['content-security-policy'] ?? '';

    expect(csp).toContain("script-src 'self' 'nonce-");
    expect(csp).not.toMatch(/script-src[^;]*'unsafe-inline'/);
    expect(response?.headers()['x-content-type-options']).toBe('nosniff');
    expect(response?.headers()['x-frame-options']).toBe('DENY');
  });
});
