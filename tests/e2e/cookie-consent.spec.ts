import { expect, test } from "@playwright/test";

test.describe("Cookie preferences", () => {
  test("anchors the consent card above the mobile controls", async ({
    context,
    page,
  }, testInfo) => {
    await context.clearCookies();
    await page.setViewportSize({ width: 412, height: 915 });
    await page.goto("/");

    const panel = page.locator(".cookie-consent");
    await expect(panel).toBeVisible({ timeout: 20_000 });

    async function expectBottomAnchored(): Promise<void> {
      // Browser engines can report fractional CSS pixels on a scaled mobile viewport.
      const subpixelTolerance = 1.5;
      const box = await panel.boundingBox();
      expect(box).not.toBeNull();
      expect(Math.abs(box!.x + box!.width / 2 - 206)).toBeLessThanOrEqual(
        subpixelTolerance
      );
      expect(Math.abs(915 - (box!.y + box!.height) - 80)).toBeLessThanOrEqual(
        subpixelTolerance
      );
      expect(box!.y).toBeGreaterThanOrEqual(0);
      expect(box!.y + box!.height).toBeLessThanOrEqual(915);
    }

    await expectBottomAnchored();
    await testInfo.attach("cookie-consent-mobile.png", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
    await panel.locator(".cookie-button--text").click();
    await expect(panel).toHaveClass(/cookie-consent--customizing/);
    await expectBottomAnchored();
  });

  test("lets a visitor choose categories and reopen the settings", async ({
    context,
    page,
  }) => {
    await context.clearCookies();
    await page.goto("/");

    /*
     * The panel is deliberately withheld for the first 10 seconds of a visit, so this
     * assertion is given a window wider than that delay rather than the default one.
     */
    const panel = page.locator(".cookie-consent");
    await expect(panel).toBeHidden();
    await expect(
      panel.getByRole("heading", { name: "עוגיות. בלי פירורים מיותרים." })
    ).toBeVisible({ timeout: 20_000 });
    await expect(panel.getByRole("link", { name: "למדיניות הפרטיות" })).toHaveAttribute(
      "href",
      "/privacy"
    );

    await panel.getByRole("button", { name: "בוחרים בעצמכם" }).click();
    await panel.locator(".cookie-option").nth(1).click();
    await expect(
      panel.getByRole("checkbox", { name: /העדפות וחוויית שימוש/ })
    ).toBeChecked();
    await panel.getByRole("button", { name: "שומרים את הבחירה" }).click();

    await expect(panel).toHaveCount(0);
    await expect
      .poll(async () => {
        const consent = (await context.cookies()).find(
          (cookie) => cookie.name === "systemize_cookie_consent"
        );
        return consent?.value;
      })
      .toBe("v1.p1.a0.m0");

    const settingsLink = page.getByRole("button", { name: "הגדרות עוגיות" });
    await settingsLink.scrollIntoViewIfNeeded();
    await settingsLink.click();

    await expect(panel).toBeVisible();
    await expect(
      panel.getByRole("checkbox", { name: /העדפות וחוויית שימוש/ })
    ).toBeChecked();
  });
});
