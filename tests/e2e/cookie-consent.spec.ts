import { expect, test } from "@playwright/test";

test.describe("Cookie preferences", () => {
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
