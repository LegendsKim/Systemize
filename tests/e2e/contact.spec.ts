import { test, expect } from '@playwright/test';

test.describe('Contact page', () => {
  test('renders the contact form', async ({ page }) => {
    await page.goto('/contact');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Get in Touch');
    await expect(page.getByLabel(/name/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/message/i)).toBeVisible();
  });

  test('shows validation errors for empty submission', async ({ page }) => {
    await page.goto('/contact');
    await page.getByRole('button', { name: /send|submit/i }).click();
    await expect(page.locator('#name-error')).toBeVisible();
    await expect(page.locator('#email-error')).toBeVisible();
    await expect(page.locator('#message-error')).toBeVisible();
  });

  test('has correct page title', async ({ page }) => {
    await page.goto('/contact');
    await expect(page).toHaveTitle(/Contact/);
  });

  test('persists a valid contact request', async ({ page }) => {
    await page.goto('/contact');
    await page.getByLabel(/name/i).fill('Boilerplate Test');
    await page.getByLabel(/email/i).fill('boilerplate@example.test');
    await page
      .getByLabel(/message/i)
      .fill('This deterministic request verifies the durable demo slice.');
    await page.getByRole('button', { name: /send|submit/i }).click();

    await expect(page.getByRole('status')).toContainText(
      'sent successfully'
    );
  });
});
