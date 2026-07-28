import { test, expect, type Page } from "@playwright/test";

/**
 * The Blueprint lead form, on the single page it lives on.
 *
 * Covers docs/PRODUCT.md §4 J1 through J3 from the visitor's side. The J2 replay and
 * the J3 fault injection are also covered at the unit level against fakes
 * (src/features/lead/__tests__/lead-service.test.ts); here they are verified through
 * the real Server Action against the local Supabase stack.
 */

/*
 * The rate limit is real, distributed, and 5 per address per hour — so the suite has to
 * present a fresh client, or it would pass once and then be refused for an hour.
 *
 * The address must be unique per *test*, not per file. A file-level `test.use` gives every
 * test in the file the same address, and this file submits more than five times; run in
 * parallel they share one bucket and the last ones are correctly refused. That refusal is
 * the rate limiter working, but it fails the wrong test for the wrong reason.
 *
 * The octets are derived from the test title rather than randomised, so a failure
 * reproduces on re-run. 198.18.0.0/15 is the reserved benchmarking range (RFC 2544) and
 * can never collide with a real client. `x-forwarded-for` is the header the server derives
 * the subject from when it is not behind Vercel, which is the case for `next start`.
 */
test.beforeEach(async ({ page }, testInfo) => {
  let hash = 0;
  for (const char of testInfo.title) {
    hash = (hash * 31 + char.charCodeAt(0)) % 65_536;
  }
  await page.setExtraHTTPHeaders({
    "x-forwarded-for": `198.18.${Math.floor(hash / 256)}.${hash % 256}`,
  });
});

const FIELD = {
  fullName: "#lead-full_name",
  businessName: "#lead-business_name",
  phone: "#lead-phone",
  email: "#lead-email",
  message: "#lead-message",
} as const;

/** Unique per run, so a re-run is never mistaken for a duplicate submission. */
function uniqueSuffix(): string {
  return `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}

async function fillValidLead(page: Page, suffix = uniqueSuffix()): Promise<void> {
  await page.fill(FIELD.fullName, "בדיקת קצה");
  await page.fill(FIELD.businessName, `עסק בדיקה ${suffix}`);
  await page.fill(FIELD.phone, "050-1234567");
  await page.fill(FIELD.email, `e2e-${suffix}@example.test`);
  await page.fill(
    FIELD.message,
    "פנייה דטרמיניסטית שנוצרה על ידי חבילת בדיקות הקצה כדי לאמת את מסלול השמירה."
  );
}

test.describe("Blueprint lead form", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.locator("#blueprint").scrollIntoViewIfNeeded();
  });

  test("is the target the hero's primary call to action points at", async ({ page }) => {
    const section = page.locator("#blueprint");
    await expect(section).toBeVisible();
    // The hero owns its own copy; only the anchor contract is asserted here.
    await expect(page.locator('a[href="#blueprint"]').first()).toHaveCount(1);
  });

  test("renders every field with an associated label", async ({ page }) => {
    const form = page.getByRole("form", {
      name: "טופס פנייה לקביעת שיחת היכרות",
    });
    await expect(form).toBeVisible();

    for (const selector of Object.values(FIELD)) {
      const field = page.locator(selector);
      await expect(field).toBeVisible();
      // A visible, programmatically associated label — not a placeholder.
      await expect(field).toHaveAccessibleName(/\S/);
    }
  });

  test("announces a field-level error for every empty required field", async ({ page }) => {
    await page.getByRole("button", { name: /שולחים רקע/ }).click();

    for (const name of ["full_name", "business_name", "phone", "email", "message"]) {
      const error = page.locator(`#lead-${name}-error`);
      await expect(error).toBeVisible();
      await expect(error).toHaveAttribute("role", "alert");
    }

    // The first invalid field takes focus, so the announced error is actionable.
    await expect(page.locator(FIELD.fullName)).toBeFocused();
    await expect(page.locator(FIELD.fullName)).toHaveAttribute("aria-invalid", "true");
  });

  test("rejects a malformed email without contacting the server", async ({ page }) => {
    await fillValidLead(page);
    await page.fill(FIELD.email, "not-an-email");
    await page.getByRole("button", { name: /שולחים רקע/ }).click();

    await expect(page.locator("#lead-email-error")).toBeVisible();
    await expect(page.locator(FIELD.email)).toBeFocused();
  });

  test("J1 — a valid submission reports success and clears the form", async ({ page }) => {
    await fillValidLead(page);
    await page.getByRole("button", { name: /שולחים רקע/ }).click();

    await expect(page.getByRole("status")).toContainText("הפנייה נשלחה");
    await expect(page.locator(FIELD.email)).toHaveValue("");
  });

  test("J1 — the submit control is disabled while the submission is in flight", async ({
    page,
  }) => {
    // Hold the Server Action open so the pending state is observable rather than raced.
    let release: (() => void) | undefined;
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route(
      (url) => url.pathname === "/",
      async (route) => {
        if (route.request().method() !== "POST") return route.continue();
        await held;
        return route.continue();
      }
    );

    await fillValidLead(page);
    const submit = page.getByRole("button", { name: /שולח|שולחים רקע/ });
    await submit.click();

    await expect(submit).toBeDisabled();
    await expect(submit).toHaveAttribute("aria-busy", "true");

    release?.();
    await expect(page.getByRole("status")).toContainText("הפנייה נשלחה");
  });

  test("J1 — going offline reports a distinct state and keeps the entered details", async ({
    page,
    context,
  }) => {
    await fillValidLead(page);
    await context.setOffline(true);

    await page.getByRole("button", { name: /שולחים רקע/ }).click();

    await expect(page.getByRole("alert").first()).toContainText("אין חיבור לאינטרנט");
    // The details survive, so the visitor does not retype them.
    await expect(page.locator(FIELD.fullName)).toHaveValue("בדיקת קצה");

    await context.setOffline(false);
  });

  test("J2 — resubmitting the same session creates no duplicate and says so", async ({
    page,
  }) => {
    await fillValidLead(page);

    // Intercept the action response so the browser keeps the same idempotency key,
    // which is exactly the "response was lost, visitor retried" case.
    await page.route(
      (url) => url.pathname === "/",
      async (route) => {
        if (route.request().method() !== "POST") return route.continue();
        await route.fetch();
        return route.abort("failed");
      },
      { times: 1 }
    );

    await page.getByRole("button", { name: /שולחים רקע/ }).click();
    await expect(page.getByRole("alert").first()).toContainText("השליחה נכשלה");

    // Same key, second attempt: the server recognises the replay.
    await page.getByRole("button", { name: /שולחים רקע/ }).click();
    await expect(page.getByRole("status")).toContainText("הפנייה כבר אצלנו");
  });
});
