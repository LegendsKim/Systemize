import { expect, test } from "@playwright/test";

test.describe("Projects", () => {
  test("lists the three products and opens a detail page", async ({ page }) => {
    await page.goto("/projects");

    await expect(
      page.getByRole("heading", { level: 1, name: "מערכות שקיבלו צורה." })
    ).toBeVisible();

    const projectLinks = page
      .getByRole("list", { name: "רשימת פרויקטים" })
      .getByRole("link");
    await expect(projectLinks).toHaveCount(3);

    await page.getByRole("link", { name: /FinQuest/ }).click();
    await expect(page).toHaveURL("/projects/finquest");
    await expect(
      page.getByRole("heading", { level: 1, name: "FinQuest" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 2, name: "מה המערכת עושה" })
    ).toBeVisible();
  });

  test("keeps the primary navigation minimal and routes clients through the portal", async ({
    page,
  }) => {
    await page.goto("/");

    const navigation = page.getByRole("navigation", { name: "ניווט ראשי" });
    await expect(navigation.getByRole("link")).toHaveCount(2);
    await expect(
      navigation.getByRole("link", {
        name: "פרויקטים",
      })
    ).toHaveAttribute("href", "/projects");
    await expect(
      navigation.getByRole("link", {
        name: "אזור אישי",
      })
    ).toHaveAttribute("href", "/portal");
  });
});
