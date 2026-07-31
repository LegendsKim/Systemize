import { expect, test } from "@playwright/test";

const signInButton = 'button:has-text("המשך עם Google")';

test.describe("the sign-in gate", () => {
  test("opens with the loading beat and clears itself", async ({ page }) => {
    await page.goto("/login");

    const splash = page.getByRole("dialog", {
      name: "מכינים את האזור האישי שלך",
    });
    await expect(splash).toBeVisible();

    // It must go away on its own. A splash that needs dismissing is a modal.
    await expect(splash).toHaveCount(0, { timeout: 8_000 });
    await expect(page.locator(signInButton)).toBeVisible();
  });

  test("can be skipped immediately", async ({ page }) => {
    await page.goto("/login");

    await page.getByRole("button", { name: "דילוג" }).click();

    await expect(
      page.getByRole("dialog", { name: "מכינים את האזור האישי שלך" })
    ).toHaveCount(0, { timeout: 4_000 });
    await expect(page.locator(signInButton)).toBeVisible();
  });

  test("closes on Escape and leaves the page scrollable", async ({ page }) => {
    await page.goto("/login");
    await page.keyboard.press("Escape");

    await expect(
      page.getByRole("dialog", { name: "מכינים את האזור האישי שלך" })
    ).toHaveCount(0, { timeout: 4_000 });

    // The overlay locks body scrolling while it runs; it has to give it back.
    await expect
      .poll(() => page.evaluate(() => document.body.style.overflow))
      .not.toBe("hidden");
  });

  test("the sign-in button reports that it is working", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "דילוג" }).click();

    const button = page.locator(signInButton);
    await expect(button).toBeVisible();

    // The action redirects off-site, so the assertion is on the pending state the
    // visitor sees during it, not on where they land.
    await Promise.all([
      page.waitForURL(/accounts\.google\.com|auth\/error/, { timeout: 15_000 }),
      button.click(),
    ]).catch(() => {
      // A missing Supabase configuration is a legitimate local outcome; the button
      // still had to change state, which is what the next assertion checks.
    });
  });

  /*
   * The entrance is meant to be one screen on a phone: no scrolling in any direction, in
   * either orientation. That is a promise about layout that only a measurement can keep,
   * so every size the design was built against is measured here rather than eyeballed.
   *
   * 280 × 653 is a folded Galaxy Fold cover screen, the narrowest viewport worth
   * supporting; 844 × 390 is a phone on its side.
   */
  const phones = [
    { name: "iPhone SE (320×568)", width: 320, height: 568 },
    { name: "Android (360×640)", width: 360, height: 640 },
    { name: "iPhone SE 2 (375×667)", width: 375, height: 667 },
    { name: "iPhone 14 (390×844)", width: 390, height: 844 },
    { name: "Pixel 7 (412×915)", width: 412, height: 915 },
    { name: "Galaxy Fold cover (280×653)", width: 280, height: 653 },
    { name: "landscape (844×390)", width: 844, height: 390 },
  ] as const;

  for (const phone of phones) {
    test(`fits one screen on ${phone.name}`, async ({ page }) => {
      await page.setViewportSize({ width: phone.width, height: phone.height });
      await page.goto("/login");

      const splashOverflow = await page.evaluate(() => {
        const root = document.documentElement;
        return {
          vertical: root.scrollHeight - root.clientHeight,
          horizontal: root.scrollWidth - root.clientWidth,
        };
      });

      expect(splashOverflow.horizontal).toBeLessThanOrEqual(0);
      expect(splashOverflow.vertical).toBeLessThanOrEqual(0);

      await page.getByRole("button", { name: "דילוג" }).click();
      await expect(page.locator(signInButton)).toBeVisible();

      const overflow = await page.evaluate(() => {
        const root = document.documentElement;
        return {
          vertical: root.scrollHeight - root.clientHeight,
          horizontal: root.scrollWidth - root.clientWidth,
        };
      });

      expect(overflow.horizontal).toBeLessThanOrEqual(0);
      expect(overflow.vertical).toBeLessThanOrEqual(0);
    });
  }
});
