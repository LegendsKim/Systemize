import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const validInvitationToken = "A".repeat(43);
const wcagTags = ["wcag2a", "wcag2aa", "wcag22aa"];

for (const path of [
  "/login",
  "/invite/not-a-valid-token",
  `/invite/${validInvitationToken}`,
]) {
  test(`${path} has no accessibility violations`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator("main")).toBeVisible();

    // The entrance opens with a loading beat and the shell fades up behind it. Sampling
    // during either one measures blended colours against a half-transparent card and
    // reports contrast failures that no visitor is ever shown — a timing flake, not a
    // finding. Dismiss the overlay, let the shell's own animation finish, then audit the
    // state a person actually reads.
    const skip = page.getByRole("button", { name: "דילוג" });
    if (await skip.isVisible()) await skip.click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await page
      .locator(".auth-gate-shell")
      .evaluate((shell) =>
        Promise.all(shell.getAnimations().map((animation) => animation.finished))
      );

    // The install reminder is revealed three seconds after arrival, so an audit fired the
    // moment the shell settles would miss it. Wait for it explicitly rather than let the
    // coverage depend on how long the steps above happened to take.
    if (path === "/login") {
      const reminder = page.getByRole("complementary", {
        name: "SYSTEMIZE עובדת טוב יותר כאפליקציה",
      });
      await expect(reminder).toBeVisible();
      await reminder.evaluate((card) =>
        Promise.all(card.getAnimations().map((animation) => animation.finished))
      );
    }

    const results = await new AxeBuilder({ page }).withTags(wcagTags).analyze();
    expect(results.violations).toEqual([]);
  });
}

test("an invitation reveals no project data before authentication", async ({
  page,
}) => {
  await page.goto(`/invite/${validInvitationToken}`);

  await expect(page.locator('input[name="invitationToken"]')).toHaveValue(
    validInvitationToken
  );
  await expect(page.locator("body")).not.toContainText(/company|project id|email/i);
});
