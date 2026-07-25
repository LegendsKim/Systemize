import { test, expect } from '@playwright/test';

test.describe('Home page', () => {
  test('renders the page title', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Systemize');
  });

  test('has correct page title in head', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Systemize/);
  });

  test('has skip link that becomes visible on focus', async ({ page }) => {
    await page.goto('/');
    const skipLink = page.getByText('Skip to main content');
    await skipLink.focus();
    await expect(skipLink).toBeVisible();
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
